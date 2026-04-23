package com.foodordering.auth;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AdminAuthorizationService {

    private static final Set<AdminPermission> ALL_PERMISSIONS = EnumSet.allOf(AdminPermission.class);
    private static final Map<String, Set<AdminPermission>> ROLE_PERMISSIONS = Map.of(
            "超级管理员", ALL_PERMISSIONS,
            "SUPER_ADMIN", ALL_PERMISSIONS,
            "店长", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.USER_STATUS_UPDATE,
                    AdminPermission.MENU_MANAGE,
                    AdminPermission.ORDER_STATUS_UPDATE,
                    AdminPermission.TABLE_MANAGE,
                    AdminPermission.STATS_VIEW,
                    AdminPermission.SETTINGS_MANAGE
            ),
            "MANAGER", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.USER_STATUS_UPDATE,
                    AdminPermission.MENU_MANAGE,
                    AdminPermission.ORDER_STATUS_UPDATE,
                    AdminPermission.TABLE_MANAGE,
                    AdminPermission.STATS_VIEW,
                    AdminPermission.SETTINGS_MANAGE
            ),
            "运营", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.MENU_MANAGE,
                    AdminPermission.ORDER_STATUS_UPDATE,
                    AdminPermission.TABLE_MANAGE,
                    AdminPermission.STATS_VIEW
            ),
            "OPERATOR", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.MENU_MANAGE,
                    AdminPermission.ORDER_STATUS_UPDATE,
                    AdminPermission.TABLE_MANAGE,
                    AdminPermission.STATS_VIEW
            ),
            "客服", EnumSet.of(
                    AdminPermission.FEEDBACK_STATUS_UPDATE,
                    AdminPermission.SUPPORT_TICKET_STATUS_UPDATE
            ),
            "SUPPORT", EnumSet.of(
                    AdminPermission.FEEDBACK_STATUS_UPDATE,
                    AdminPermission.SUPPORT_TICKET_STATUS_UPDATE
            )
    );

    public boolean hasAllPermissions(String roleName, AdminPermission[] requiredPermissions) {
        if (requiredPermissions == null || requiredPermissions.length == 0) {
            return true;
        }
        if (!StringUtils.hasText(roleName)) {
            return false;
        }
        Set<AdminPermission> rolePermissions = ROLE_PERMISSIONS.getOrDefault(roleName.trim(), Collections.emptySet());
        for (AdminPermission requiredPermission : requiredPermissions) {
            if (!rolePermissions.contains(requiredPermission)) {
                return false;
            }
        }
        return true;
    }

    public Set<AdminPermission> getPermissions(String roleName) {
        if (!StringUtils.hasText(roleName)) {
            return Collections.emptySet();
        }
        return ROLE_PERMISSIONS.getOrDefault(roleName.trim(), Collections.emptySet());
    }

    public List<String> getPermissionNames(String roleName) {
        return getPermissions(roleName).stream()
                .map(Enum::name)
                .sorted()
                .toList();
    }

    public List<String> getRoleNames() {
        return List.of("超级管理员", "店长", "运营", "客服");
    }
}
