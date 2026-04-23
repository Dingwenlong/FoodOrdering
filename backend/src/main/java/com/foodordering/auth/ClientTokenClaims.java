package com.foodordering.auth;

public record ClientTokenClaims(
        String userId,
        String openid,
        String nickname
) {
}
