package com.foodordering.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminAuthorizationServiceTest {

    private final AdminAuthorizationService service = new AdminAuthorizationService();

    @Test
    void shouldGrantAllPermissionsToSuperAdmin() {
        assertTrue(service.hasAllPermissions("超级管理员", new AdminPermission[]{AdminPermission.ORDER_STATUS_UPDATE}));
        assertTrue(service.hasAllPermissions("SUPER_ADMIN", new AdminPermission[]{AdminPermission.SUPPORT_TICKET_STATUS_UPDATE}));
    }

    @Test
    void shouldGrantOnlyMappedPermissionsToManager() {
        assertTrue(service.hasAllPermissions("店长", new AdminPermission[]{AdminPermission.MENU_MANAGE}));
        assertFalse(service.hasAllPermissions("店长", new AdminPermission[]{AdminPermission.SUPPORT_TICKET_STATUS_UPDATE}));
    }

    @Test
    void shouldDenyUnknownRoleAndBlankRole() {
        assertFalse(service.hasAllPermissions("未知角色", new AdminPermission[]{AdminPermission.NOTICE_MANAGE}));
        assertFalse(service.hasAllPermissions("  ", new AdminPermission[]{AdminPermission.NOTICE_MANAGE}));
    }
}
