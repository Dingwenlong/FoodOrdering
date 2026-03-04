package com.foodordering.auth;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.EnumSet;
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
                    AdminPermission.ORDER_STATUS_UPDATE
            ),
            "MANAGER", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.USER_STATUS_UPDATE,
                    AdminPermission.MENU_MANAGE,
                    AdminPermission.ORDER_STATUS_UPDATE
            ),
            "运营", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.MENU_MANAGE
            ),
            "OPERATOR", EnumSet.of(
                    AdminPermission.NOTICE_MANAGE,
                    AdminPermission.MENU_MANAGE
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
}
