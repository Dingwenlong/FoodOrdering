package com.foodordering.auth;

public record AdminTokenClaims(
        String userId,
        String username,
        String displayName,
        String roleName
) {
}
