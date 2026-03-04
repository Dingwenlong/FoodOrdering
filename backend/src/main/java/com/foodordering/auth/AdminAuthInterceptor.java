package com.foodordering.auth;

import com.foodordering.entity.AdminUserAccount;
import com.foodordering.mapper.AdminUserAccountMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_ADMIN_ATTR = "CURRENT_ADMIN_USER";

    private final AdminJwtTokenService adminJwtTokenService;
    private final AdminUserAccountMapper adminUserAccountMapper;
    private final AdminAuthorizationService adminAuthorizationService;

    public AdminAuthInterceptor(
            AdminJwtTokenService adminJwtTokenService,
            AdminUserAccountMapper adminUserAccountMapper,
            AdminAuthorizationService adminAuthorizationService
    ) {
        this.adminJwtTokenService = adminJwtTokenService;
        this.adminUserAccountMapper = adminUserAccountMapper;
        this.adminAuthorizationService = adminAuthorizationService;
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

        AdminTokenClaims claims = adminJwtTokenService.parseToken(token);
        Long adminId = parseAdminId(claims.userId());
        AdminUserAccount account = adminUserAccountMapper.selectById(adminId);
        if (account == null || account.getStatus() == null || account.getStatus() != 1) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号不可用，请重新登录");
        }
        validatePermission(account, handler);

        request.setAttribute(CURRENT_ADMIN_ATTR, account);
        return true;
    }

    public static AdminUserAccount requireCurrentAdmin(HttpServletRequest request) {
        Object value = request.getAttribute(CURRENT_ADMIN_ATTR);
        if (value instanceof AdminUserAccount account) {
            return account;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已失效");
    }

    private Long parseAdminId(String userId) {
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

    private void validatePermission(AdminUserAccount account, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return;
        }
        AdminAuthorize authorize = handlerMethod.getMethodAnnotation(AdminAuthorize.class);
        if (authorize == null) {
            authorize = handlerMethod.getBeanType().getAnnotation(AdminAuthorize.class);
        }
        if (authorize == null) {
            return;
        }
        if (!adminAuthorizationService.hasAllPermissions(account.getRoleName(), authorize.value())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权限执行该操作");
        }
    }
}
