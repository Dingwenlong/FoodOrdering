package com.foodordering.auth;

import com.foodordering.dto.admin.AdminDtos;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;

@Service
public class AdminJwtTokenService {

    private static final long DEFAULT_TTL_SECONDS = 12 * 60 * 60;

    private final Key signingKey;
    private final long tokenTtlSeconds;

    public AdminJwtTokenService(
            @Value("${app.auth.admin.jwt-secret:food-ordering-admin-jwt-secret-change-me-2026}") String jwtSecret,
            @Value("${app.auth.admin.token-ttl-seconds:43200}") long tokenTtlSeconds
    ) {
        byte[] secretBytes = jwtSecret == null ? new byte[0] : jwtSecret.trim().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.auth.admin.jwt-secret must be at least 32 bytes");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.tokenTtlSeconds = tokenTtlSeconds > 0 ? tokenTtlSeconds : DEFAULT_TTL_SECONDS;
    }

    public String createToken(AdminDtos.AdminUserView userView) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(userView.id())
                .claim("username", userView.username())
                .claim("displayName", userView.displayName())
                .claim("roleName", userView.roleName())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(tokenTtlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public AdminTokenClaims parseToken(String token) {
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或 token 缺失");
        }
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token.trim())
                    .getBody();
            String userId = claims.getSubject();
            if (!StringUtils.hasText(userId)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录");
            }
            return new AdminTokenClaims(
                    userId,
                    claimToString(claims, "username"),
                    claimToString(claims, "displayName"),
                    claimToString(claims, "roleName")
            );
        } catch (JwtException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录");
        }
    }

    private String claimToString(Claims claims, String claimName) {
        Object value = claims.get(claimName);
        return value == null ? null : String.valueOf(value);
    }
}
