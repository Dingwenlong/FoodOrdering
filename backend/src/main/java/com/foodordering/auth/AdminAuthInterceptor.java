package com.foodordering.auth;

import com.foodordering.entity.AdminUserAccount;
import com.foodordering.entity.AdminOperationLog;
import com.foodordering.mapper.AdminOperationLogMapper;
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
import java.time.LocalDateTime;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_ADMIN_ATTR = "CURRENT_ADMIN_USER";

    private final AdminJwtTokenService adminJwtTokenService;
    private final AdminUserAccountMapper adminUserAccountMapper;
    private final AdminAuthorizationService adminAuthorizationService;
    private final AdminOperationLogMapper adminOperationLogMapper;

    public AdminAuthInterceptor(
            AdminJwtTokenService adminJwtTokenService,
            AdminUserAccountMapper adminUserAccountMapper,
            AdminAuthorizationService adminAuthorizationService,
            AdminOperationLogMapper adminOperationLogMapper
    ) {
        this.adminJwtTokenService = adminJwtTokenService;
        this.adminUserAccountMapper = adminUserAccountMapper;
        this.adminAuthorizationService = adminAuthorizationService;
        this.adminOperationLogMapper = adminOperationLogMapper;
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

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex
    ) {
        if (!shouldAudit(request)) {
            return;
        }
        Object value = request.getAttribute(CURRENT_ADMIN_ATTR);
        if (!(value instanceof AdminUserAccount account)) {
            return;
        }

        AdminOperationLog log = new AdminOperationLog();
        log.setAdminId(account.getId());
        log.setAdminName(account.getDisplayName());
        log.setAction(request.getMethod());
        log.setRequestPath(request.getRequestURI());
        log.setResourceType(resolveResourceType(request.getRequestURI()));
        log.setResourceId(resolveResourceId(request.getRequestURI()));
        log.setResult(ex == null && response.getStatus() < 400 ? "SUCCESS" : "FAILED");
        log.setMessage(ex == null ? null : ex.getMessage());
        log.setCreateTime(LocalDateTime.now());
        adminOperationLogMapper.insert(log);
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

    private boolean shouldAudit(HttpServletRequest request) {
        String method = request.getMethod();
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method)) {
            return false;
        }
        String uri = request.getRequestURI();
        return uri != null
                && uri.startsWith("/v1/admin/")
                && !uri.endsWith("/auth/login");
    }

    private String resolveResourceType(String uri) {
        if (!StringUtils.hasText(uri)) {
            return "admin";
        }
        String[] parts = uri.split("/");
        return parts.length > 3 ? parts[3] : "admin";
    }

    private String resolveResourceId(String uri) {
        if (!StringUtils.hasText(uri)) {
            return null;
        }
        String[] parts = uri.split("/");
        return parts.length > 4 ? parts[4] : null;
    }
}
