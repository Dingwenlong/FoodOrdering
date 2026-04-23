package com.foodordering.service.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodordering.dto.client.ClientDtos;
import com.foodordering.entity.Order;
import com.foodordering.entity.Payment;
import com.foodordering.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class WechatPayService {

    private static final String WECHAT_PAY_HOST = "https://api.mch.weixin.qq.com";
    private static final String JSAPI_PATH = "/v3/pay/transactions/jsapi";
    private static final String SIGN_TYPE_RSA = "RSA";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final String mode;
    private final String appId;
    private final String mchId;
    private final String merchantSerialNo;
    private final String privateKeyPath;
    private final String apiV3Key;
    private final String notifyUrl;
    private final String platformPublicKeyPath;
    private final String platformSerialNo;

    public WechatPayService(
            ObjectMapper objectMapper,
            @Value("${app.pay.wechat.mode:mock}") String mode,
            @Value("${app.wechat.app-id:}") String appId,
            @Value("${app.pay.wechat.mch-id:}") String mchId,
            @Value("${app.pay.wechat.merchant-serial-no:}") String merchantSerialNo,
            @Value("${app.pay.wechat.private-key-path:}") String privateKeyPath,
            @Value("${app.pay.wechat.api-v3-key:}") String apiV3Key,
            @Value("${app.pay.wechat.notify-url:}") String notifyUrl,
            @Value("${app.pay.wechat.platform-public-key-path:}") String platformPublicKeyPath,
            @Value("${app.pay.wechat.platform-serial-no:}") String platformSerialNo
    ) {
        this.objectMapper = objectMapper;
        this.mode = mode == null ? "mock" : mode.trim().toLowerCase();
        this.appId = appId;
        this.mchId = mchId;
        this.merchantSerialNo = merchantSerialNo;
        this.privateKeyPath = privateKeyPath;
        this.apiV3Key = apiV3Key;
        this.notifyUrl = notifyUrl;
        this.platformPublicKeyPath = platformPublicKeyPath;
        this.platformSerialNo = platformSerialNo;
    }

    public boolean isMockMode() {
        return !"real".equals(mode);
    }

    public ClientDtos.PrepayResponse createPrepay(Order order, User payer, Payment payment) {
        if (isMockMode()) {
            String nonce = randomNonce();
            String pkg = "prepay_id=mock_" + order.getId();
            return new ClientDtos.PrepayResponse(
                    String.valueOf(Instant.now().getEpochSecond()),
                    nonce,
                    pkg,
                    pkg,
                    "MD5",
                    "mock-sign-" + nonce
            );
        }

        requireRealPayConfig();
        if (!StringUtils.hasText(payer.getWechatOpenid())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前用户缺少微信 openid，无法发起微信支付");
        }

        String body = buildJsapiRequestBody(order, payer);
        String nonce = randomNonce();
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String authorization = buildAuthorization("POST", JSAPI_PATH, timestamp, nonce, body);

        HttpRequest request = HttpRequest.newBuilder(URI.create(WECHAT_PAY_HOST + JSAPI_PATH))
                .header("Authorization", authorization)
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String message = root.path("message").asText("微信支付下单失败");
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
            }
            String prepayId = root.path("prepay_id").asText();
            if (!StringUtils.hasText(prepayId)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信支付未返回 prepay_id");
            }
            String pkg = "prepay_id=" + prepayId;
            String payTimestamp = String.valueOf(Instant.now().getEpochSecond());
            String payNonce = randomNonce();
            String paySign = sign(appId.trim() + "\n" + payTimestamp + "\n" + payNonce + "\n" + pkg + "\n");
            return new ClientDtos.PrepayResponse(payTimestamp, payNonce, pkg, pkg, SIGN_TYPE_RSA, paySign);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信支付响应解析失败");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "微信支付请求被中断");
        }
    }

    public NotifyResult parseAndVerifyNotify(Map<String, String> headers, String body) {
        if (isMockMode()) {
            return parsePlainNotify(body);
        }
        requireNotifyConfig();
        verifyNotifySignature(headers, body);
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!"TRANSACTION.SUCCESS".equals(root.path("event_type").asText())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非支付成功通知");
            }
            JsonNode resource = root.path("resource");
            String plain = decryptResource(
                    resource.path("associated_data").asText(""),
                    resource.path("nonce").asText(),
                    resource.path("ciphertext").asText()
            );
            JsonNode transaction = objectMapper.readTree(plain);
            String outTradeNo = transaction.path("out_trade_no").asText();
            String transactionId = transaction.path("transaction_id").asText();
            int total = transaction.path("amount").path("total").asInt();
            if (!StringUtils.hasText(outTradeNo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "通知缺少商户订单号");
            }
            return new NotifyResult(outTradeNo, transactionId, total);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "支付通知报文解析失败");
        }
    }

    private NotifyResult parsePlainNotify(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String outTradeNo = root.path("out_trade_no").asText(root.path("orderNo").asText());
            String transactionId = root.path("transaction_id").asText("MOCK_NOTIFY_" + UUID.randomUUID());
            int total = root.path("amount").path("total").asInt(root.path("total").asInt(0));
            if (!StringUtils.hasText(outTradeNo)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "通知缺少商户订单号");
            }
            return new NotifyResult(outTradeNo, transactionId, total);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "支付通知报文解析失败");
        }
    }

    private String buildJsapiRequestBody(Order order, User payer) {
        Map<String, Object> amount = new LinkedHashMap<>();
        amount.put("total", toFen(order.getTotalAmount()));
        amount.put("currency", "CNY");

        Map<String, Object> payerMap = new LinkedHashMap<>();
        payerMap.put("openid", payer.getWechatOpenid());

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("appid", appId.trim());
        payload.put("mchid", mchId.trim());
        payload.put("description", "未来餐厅订单 " + order.getOrderNo());
        payload.put("out_trade_no", order.getOrderNo());
        payload.put("notify_url", notifyUrl.trim());
        payload.put("amount", amount);
        payload.put("payer", payerMap);

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付请求构建失败");
        }
    }

    private String buildAuthorization(String method, String path, String timestamp, String nonce, String body) {
        String message = method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + body + "\n";
        String signature = sign(message);
        return "WECHATPAY2-SHA256-RSA2048 "
                + "mchid=\"" + mchId.trim() + "\","
                + "nonce_str=\"" + nonce + "\","
                + "signature=\"" + signature + "\","
                + "timestamp=\"" + timestamp + "\","
                + "serial_no=\"" + merchantSerialNo.trim() + "\"";
    }

    private String sign(String message) {
        try {
            Signature signer = Signature.getInstance("SHA256withRSA");
            signer.initSign(loadPrivateKey());
            signer.update(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(signer.sign());
        } catch (GeneralSecurityException | IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付签名失败");
        }
    }

    private PrivateKey loadPrivateKey() throws IOException, GeneralSecurityException {
        String pem = Files.readString(Path.of(privateKeyPath.trim()), StandardCharsets.UTF_8);
        String normalized = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] keyBytes = Base64.getDecoder().decode(normalized);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    private void verifyNotifySignature(Map<String, String> headers, String body) {
        String serial = header(headers, "Wechatpay-Serial");
        String signature = header(headers, "Wechatpay-Signature");
        String timestamp = header(headers, "Wechatpay-Timestamp");
        String nonce = header(headers, "Wechatpay-Nonce");
        if (!StringUtils.hasText(serial) || !StringUtils.hasText(signature)
                || !StringUtils.hasText(timestamp) || !StringUtils.hasText(nonce)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "微信支付通知缺少签名头");
        }
        if (StringUtils.hasText(platformSerialNo) && !platformSerialNo.trim().equals(serial.trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "微信支付平台证书序列号不匹配");
        }
        try {
            String message = timestamp + "\n" + nonce + "\n" + body + "\n";
            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(loadPlatformPublicKey());
            verifier.update(message.getBytes(StandardCharsets.UTF_8));
            boolean ok = verifier.verify(Base64.getDecoder().decode(signature));
            if (!ok) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "微信支付通知验签失败");
            }
        } catch (GeneralSecurityException | IOException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "微信支付通知验签失败");
        }
    }

    private PublicKey loadPlatformPublicKey() throws IOException, GeneralSecurityException {
        String pem = Files.readString(Path.of(platformPublicKeyPath.trim()), StandardCharsets.UTF_8);
        if (pem.contains("BEGIN CERTIFICATE")) {
            try (var input = Files.newInputStream(Path.of(platformPublicKeyPath.trim()))) {
                X509Certificate certificate = (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(input);
                return certificate.getPublicKey();
            }
        }
        String normalized = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
        return KeyFactory.getInstance("RSA").generatePublic(new java.security.spec.X509EncodedKeySpec(Base64.getDecoder().decode(normalized)));
    }

    private String decryptResource(String associatedData, String nonce, String ciphertext) {
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec key = new SecretKeySpec(apiV3Key.trim().getBytes(StandardCharsets.UTF_8), "AES");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, nonce.getBytes(StandardCharsets.UTF_8)));
            if (associatedData != null && !associatedData.isEmpty()) {
                cipher.updateAAD(associatedData.getBytes(StandardCharsets.UTF_8));
            }
            byte[] plain = cipher.doFinal(Base64.getDecoder().decode(ciphertext));
            return new String(plain, StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "微信支付通知解密失败");
        }
    }

    private String header(Map<String, String> headers, String name) {
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private void requireRealPayConfig() {
        if (!StringUtils.hasText(appId) || !StringUtils.hasText(mchId)
                || !StringUtils.hasText(merchantSerialNo) || !StringUtils.hasText(privateKeyPath)
                || !StringUtils.hasText(apiV3Key) || !StringUtils.hasText(notifyUrl)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付真实模式配置不完整");
        }
    }

    private void requireNotifyConfig() {
        requireRealPayConfig();
        if (!StringUtils.hasText(platformPublicKeyPath)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付通知验签公钥未配置");
        }
        if (apiV3Key.trim().getBytes(StandardCharsets.UTF_8).length != 32) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付 API v3 密钥必须为 32 字节");
        }
    }

    private String randomNonce() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private int toFen(BigDecimal amount) {
        if (amount == null) {
            return 0;
        }
        return amount.movePointRight(2).setScale(0, java.math.RoundingMode.HALF_UP).intValue();
    }

    public record NotifyResult(String outTradeNo, String transactionId, int totalAmountFen) {
    }
}
