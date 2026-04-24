package com.foodordering.controller.admin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AdminControllerIntegrationTest {

    @LocalServerPort
    private int port;

    private final TestRestTemplate restTemplate = new TestRestTemplate();

    @Test
    void adminOperationalEndpointsShouldWorkWithSeedData() {
        String token = loginAsAdmin();
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders(token));

        ResponseEntity<Map> orders = restTemplate.exchange(url("/api/v1/admin/orders?page=1&pageSize=5"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, orders.getStatusCodeValue());
        assertTrue(((Number) data(orders).get("total")).longValue() > 0);

        ResponseEntity<Map> summary = restTemplate.exchange(url("/api/v1/admin/stats/summary"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, summary.getStatusCodeValue());
        assertNotNull(data(summary).get("revenue"));

        ResponseEntity<Map> trend = restTemplate.exchange(url("/api/v1/admin/stats/trend?from=2026-03-01&to=2026-03-01"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, trend.getStatusCodeValue());
        assertTrue(dataList(trend).size() > 0);

        ResponseEntity<Map> dishSales = restTemplate.exchange(url("/api/v1/admin/stats/dish-sales"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, dishSales.getStatusCodeValue());
        assertTrue(dataList(dishSales).size() > 0);

        ResponseEntity<Map> settings = restTemplate.exchange(url("/api/v1/admin/settings"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, settings.getStatusCodeValue());
        assertEquals("store_1", data(settings).get("storeId"));

        ResponseEntity<Map> qr = restTemplate.exchange(url("/api/v1/admin/tables/1/qr-payload"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, qr.getStatusCodeValue());
        assertEquals("storeId=store_1&tableId=1", data(qr).get("payload"));

        ResponseEntity<Map> admins = restTemplate.exchange(url("/api/v1/admin/admin-users?page=1&pageSize=5"), HttpMethod.GET, entity, Map.class);
        assertEquals(200, admins.getStatusCodeValue());
        assertTrue(((Number) data(admins).get("total")).longValue() > 0);
    }

    @Test
    void supportRoleShouldNotAccessSettings() {
        String token = login("support", "support123");
        HttpEntity<Void> entity = new HttpEntity<>(authHeaders(token));

        ResponseEntity<Map> response = restTemplate.exchange(url("/api/v1/admin/settings"), HttpMethod.GET, entity, Map.class);
        assertEquals(403, response.getStatusCodeValue());
    }

    private String loginAsAdmin() {
        return login("admin", "admin123");
    }

    private String login(String username, String password) {
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/v1/admin/auth/login"),
                Map.of("username", username, "password", password),
                Map.class
        );
        assertEquals(200, response.getStatusCodeValue());
        Object token = data(response).get("token");
        assertNotNull(token);
        return String.valueOf(token);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> data(ResponseEntity<Map> response) {
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        Object data = body.get("data");
        assertTrue(data instanceof Map);
        return (Map<String, Object>) data;
    }

    @SuppressWarnings("unchecked")
    private java.util.List<Object> dataList(ResponseEntity<Map> response) {
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        Object data = body.get("data");
        assertTrue(data instanceof java.util.List);
        return (java.util.List<Object>) data;
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    private String url(String path) {
        return "http://127.0.0.1:" + port + path;
    }
}
