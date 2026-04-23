package com.foodordering.auth;

import com.foodordering.entity.User;
import com.foodordering.mapper.UserMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class ClientAuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_CLIENT_USER_ATTR = "CURRENT_CLIENT_USER";

    private final ClientJwtTokenService clientJwtTokenService;
    private final UserMapper userMapper;

    public ClientAuthInterceptor(ClientJwtTokenService clientJwtTokenService, UserMapper userMapper) {
        this.clientJwtTokenService = clientJwtTokenService;
        this.userMapper = userMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String token = extractBearerToken(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或 token 缺失");
        }

        ClientTokenClaims claims = clientJwtTokenService.parseToken(token);
        Long userId = parseUserId(claims.userId());
        User user = userMapper.selectById(userId);
        if (user == null || user.getStatus() == null || user.getStatus() != 1) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号不可用，请重新登录");
        }

        request.setAttribute(CURRENT_CLIENT_USER_ATTR, user);
        return true;
    }

    public static User requireCurrentUser(HttpServletRequest request) {
        Object value = request.getAttribute(CURRENT_CLIENT_USER_ATTR);
        if (value instanceof User user) {
            return user;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已失效");
    }

    private Long parseUserId(String userId) {
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "无效 token");
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            return null;
        }
        String value = authorizationHeader.trim();
        if (!value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        return value.substring(7).trim();
    }
}
