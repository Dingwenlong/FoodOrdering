package com.foodordering.auth;

import com.foodordering.entity.User;
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
public class ClientJwtTokenService {

    private static final long DEFAULT_TTL_SECONDS = 30L * 24 * 60 * 60;

    private final Key signingKey;
    private final long tokenTtlSeconds;

    public ClientJwtTokenService(
            @Value("${app.auth.client.jwt-secret:food-ordering-client-jwt-secret-change-me-2026}") String jwtSecret,
            @Value("${app.auth.client.token-ttl-seconds:2592000}") long tokenTtlSeconds
    ) {
        byte[] secretBytes = jwtSecret == null ? new byte[0] : jwtSecret.trim().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.auth.client.jwt-secret must be at least 32 bytes");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.tokenTtlSeconds = tokenTtlSeconds > 0 ? tokenTtlSeconds : DEFAULT_TTL_SECONDS;
    }

    public String createToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(String.valueOf(user.getId()))
                .claim("openid", user.getWechatOpenid())
                .claim("nickname", user.getUsername())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(tokenTtlSeconds)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public ClientTokenClaims parseToken(String token) {
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
            return new ClientTokenClaims(
                    userId,
                    claimToString(claims, "openid"),
                    claimToString(claims, "nickname")
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
