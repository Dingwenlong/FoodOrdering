package com.foodordering.service.client;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodordering.auth.ClientJwtTokenService;
import com.foodordering.dto.client.ClientDtos;
import com.foodordering.entity.User;
import com.foodordering.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
public class WechatAuthService {

    private static final String CODE_TO_SESSION_URL = "https://api.weixin.qq.com/sns/jscode2session";

    private final UserMapper userMapper;
    private final ClientJwtTokenService clientJwtTokenService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final String appId;
    private final String appSecret;
    private final boolean mockLoginEnabled;

    public WechatAuthService(
            UserMapper userMapper,
            ClientJwtTokenService clientJwtTokenService,
            ObjectMapper objectMapper,
            @Value("${app.wechat.app-id:}") String appId,
            @Value("${app.wechat.app-secret:}") String appSecret,
            @Value("${app.wechat.mock-login-enabled:true}") boolean mockLoginEnabled
    ) {
        this.userMapper = userMapper;
        this.clientJwtTokenService = clientJwtTokenService;
        this.objectMapper = objectMapper;
        this.appId = appId;
        this.appSecret = appSecret;
        this.mockLoginEnabled = mockLoginEnabled;
    }

    public ClientDtos.WechatLoginResponse login(ClientDtos.WechatLoginRequest request) {
        if (request == null || !StringUtils.hasText(request.code())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "code 不能为空");
        }

        WechatSession session = exchangeCode(request.code().trim());
        User user = upsertUser(session.openid(), request.nickname(), request.avatar());
        String token = clientJwtTokenService.createToken(user);
        return new ClientDtos.WechatLoginResponse(token, toUserView(user));
    }

    private WechatSession exchangeCode(String code) {
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(appSecret)) {
            if (!mockLoginEnabled) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "未配置微信小程序 appId/appSecret");
            }
            return new WechatSession("mock_openid_" + code, null);
        }

        String url = CODE_TO_SESSION_URL
                + "?appid=" + encode(appId.trim())
                + "&secret=" + encode(appSecret.trim())
                + "&js_code=" + encode(code)
                + "&grant_type=authorization_code";
        HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(url)).GET().build();
        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信登录接口调用失败");
            }
            JsonNode root = objectMapper.readTree(response.body());
            if (root.has("errcode") && root.path("errcode").asInt() != 0) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, root.path("errmsg").asText("微信登录失败"));
            }
            String openid = root.path("openid").asText();
            if (!StringUtils.hasText(openid)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "微信登录未返回 openid");
            }
            return new WechatSession(openid, root.path("session_key").asText(null));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信登录接口响应解析失败");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信登录接口调用被中断");
        }
    }

    private User upsertUser(String openid, String nickname, String avatar) {
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getWechatOpenid, openid)
                        .last("LIMIT 1")
        );

        LocalDateTime now = LocalDateTime.now();
        if (user == null) {
            user = new User();
            user.setWechatOpenid(openid);
            user.setUsername(resolveNickname(nickname, openid));
            user.setAvatar(trimToNull(avatar));
            user.setStatus(1);
            user.setCreateTime(now);
            user.setUpdateTime(now);
            userMapper.insert(user);
            return user;
        }

        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号已被禁用");
        }
        boolean changed = false;
        String cleanNickname = trimToNull(nickname) == null ? null : resolveNickname(nickname, openid);
        if (cleanNickname != null && !cleanNickname.equals(user.getUsername())) {
            user.setUsername(cleanNickname);
            changed = true;
        }
        String cleanAvatar = trimToNull(avatar);
        if (cleanAvatar != null && !cleanAvatar.equals(user.getAvatar())) {
            user.setAvatar(cleanAvatar);
            changed = true;
        }
        if (changed) {
            user.setUpdateTime(now);
            userMapper.updateById(user);
        }
        return user;
    }

    private ClientDtos.ClientUserView toUserView(User user) {
        return new ClientDtos.ClientUserView(
                String.valueOf(user.getId()),
                user.getUsername(),
                user.getAvatar(),
                user.getWechatOpenid()
        );
    }

    private String resolveNickname(String nickname, String openid) {
        String suffix = openid.length() <= 6 ? openid : openid.substring(openid.length() - 6);
        String clean = trimToNull(nickname);
        if (clean != null) {
            return clean + "_" + suffix;
        }
        return "微信用户" + suffix;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record WechatSession(String openid, String sessionKey) {
    }
}
