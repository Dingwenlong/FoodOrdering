package com.foodordering.auth;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.foodordering.entity.User;
import com.foodordering.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@Component
public class ClientUserContext {

    private final UserMapper userMapper;
    private final boolean allowDevFallback;

    public ClientUserContext(
            UserMapper userMapper,
            @Value("${app.auth.client.allow-dev-fallback:true}") boolean allowDevFallback
    ) {
        this.userMapper = userMapper;
        this.allowDevFallback = allowDevFallback;
    }

    public User requireCurrentUser() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            HttpServletRequest request = servletAttrs.getRequest();
            Object value = request.getAttribute(ClientAuthInterceptor.CURRENT_CLIENT_USER_ATTR);
            if (value instanceof User user) {
                return user;
            }
        }

        if (!allowDevFallback) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已失效");
        }

        List<User> users = userMapper.selectList(
                new LambdaQueryWrapper<User>()
                        .eq(User::getStatus, 1)
                        .orderByAsc(User::getId)
        );
        if (users.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "系统未配置可用用户");
        }
        return users.get(0);
    }
}
