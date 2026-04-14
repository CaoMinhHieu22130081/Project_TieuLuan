package com.uniquetee.service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.Order;

@Service
public class VnpayPaymentService {

    private static final DateTimeFormatter VNPAY_DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId HO_CHI_MINH_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @Value("${vnpay.ipn-url}")
    private String ipnUrl;

    @Value("${vnpay.version}")
    private String version;

    @Value("${vnpay.command}")
    private String command;

    @Value("${vnpay.currency}")
    private String currency;

    @Value("${vnpay.locale}")
    private String locale;

    @Value("${vnpay.order-type}")
    private String orderType;

    @Value("${vnpay.expire-minutes}")
    private int expireMinutes;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;

    private final OrderService orderService;

    public VnpayPaymentService(OrderService orderService) {
        this.orderService = orderService;
    }

    public boolean isConfigured() {
        return missingConfigurationFields().isEmpty();
    }

    public List<String> missingConfigurationFields() {
        List<String> missingFields = new ArrayList<>();
        if (isBlank(payUrl)) missingFields.add("vnpay.pay-url");
        if (isBlank(hashSecret)) missingFields.add("vnpay.hash-secret");
        if (isBlank(tmnCode)) missingFields.add("vnpay.tmn-code");
        if (isBlank(returnUrl)) missingFields.add("vnpay.return-url");
        if (isBlank(ipnUrl)) missingFields.add("vnpay.ipn-url");
        if (isBlank(frontendBaseUrl)) missingFields.add("app.frontend-base-url");
        return missingFields;
    }

    public String createPaymentUrl(String orderCode, String clientIpAddress) {
        if (!isConfigured()) {
            throw new IllegalStateException("VNPay configuration is incomplete: " + String.join(", ", missingConfigurationFields()));
        }

        String safeOrderCode = normalize(orderCode);
        if (isBlank(safeOrderCode)) {
            throw new IllegalArgumentException("Vui lòng cung cấp mã đơn hàng");
        }

        Order order = findVnpayOrder(safeOrderCode);
        BigDecimal orderTotal = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
        if (orderTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Tổng tiền đơn hàng không hợp lệ");
        }

        if (!"vnpay".equalsIgnoreCase(normalize(order.getPaymentMethod()))) {
            throw new IllegalStateException("Đơn hàng này không được cấu hình thanh toán qua VNPay");
        }

        Map<String, String> params = new TreeMap<>();
        LocalDateTime now = LocalDateTime.now(HO_CHI_MINH_ZONE);

        params.put("vnp_Amount", orderTotal.multiply(BigDecimal.valueOf(100)).longValueExact() + "");
        params.put("vnp_Command", command);
        params.put("vnp_CreateDate", formatDateTime(now));
        params.put("vnp_CurrCode", currency);
        params.put("vnp_ExpireDate", formatDateTime(now.plusMinutes(expireMinutes)));
        params.put("vnp_IpAddr", normalizeClientIp(clientIpAddress));
        params.put("vnp_Locale", locale);
        params.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getOrderCode());
        params.put("vnp_OrderType", orderType);
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_TxnRef", order.getOrderCode());
        params.put("vnp_Version", version);

        String queryString = buildQueryString(params);
        String secureHash = hmacSha512(hashSecret, queryString);
        return payUrl + "?" + queryString + "&vnp_SecureHash=" + secureHash;
    }

    public VnpayCallbackResult processCallback(Map<String, String> params, boolean updateOrderStatus) {
        String orderCode = normalize(params == null ? null : params.get("vnp_TxnRef"));
        if (!isSignatureValid(params)) {
            return new VnpayCallbackResult(false, false, false, orderCode, "Chữ ký VNPay không hợp lệ");
        }

        if (isBlank(orderCode)) {
            return new VnpayCallbackResult(true, false, false, null, "Thiếu mã đơn hàng");
        }

        Optional<Order> optionalOrder = orderService.getOrderByCode(orderCode);
        if (optionalOrder.isEmpty()) {
            return new VnpayCallbackResult(true, false, false, orderCode, "Không tìm thấy đơn hàng");
        }

        Order order = optionalOrder.get();
        boolean paymentSuccess = isPaymentSuccess(params);

        if (updateOrderStatus) {
            String currentStatus = normalize(order.getStatus());
            if (!"cancelled".equals(currentStatus) && !"delivered".equals(currentStatus)) {
                if (paymentSuccess) {
                    orderService.updateOrderStatus(order.getId(), "processing");
                } else {
                    orderService.updateOrderStatus(order.getId(), "cancelled");
                }
            }
        }

        return new VnpayCallbackResult(true, true, paymentSuccess, orderCode,
                paymentSuccess ? "Thanh toán VNPay thành công" : "Thanh toán VNPay thất bại hoặc đã bị hủy");
    }

    public String buildFrontendRedirectUrl(String orderCode, String paymentResult, String responseCode, String message) {
        StringBuilder builder = new StringBuilder();
        builder.append(frontendBaseUrl);
        if (!frontendBaseUrl.endsWith("/")) {
            builder.append('/');
        }
        builder.append("checkout");
        builder.append("?paymentResult=").append(isBlank(paymentResult) ? "failed" : urlEncode(paymentResult));
        if (!isBlank(orderCode)) {
            builder.append("&orderCode=").append(urlEncode(orderCode));
        }
        if (!isBlank(responseCode)) {
            builder.append("&vnpResponseCode=").append(urlEncode(responseCode));
        }
        if (!isBlank(message)) {
            builder.append("&paymentMessage=").append(urlEncode(message));
        }
        return builder.toString();
    }

    private Order findVnpayOrder(String orderCode) {
        return orderService.getOrderByCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng " + orderCode));
    }

    private boolean isSignatureValid(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return false;
        }

        String providedSignature = normalize(params.get("vnp_SecureHash"));
        if (isBlank(providedSignature)) {
            return false;
        }

        String signedData = buildSignedData(params);
        String expectedSignature = hmacSha512(hashSecret, signedData);
        return providedSignature.equalsIgnoreCase(expectedSignature);
    }

    private boolean isPaymentSuccess(Map<String, String> params) {
        String responseCode = normalize(params == null ? null : params.get("vnp_ResponseCode"));
        String transactionStatus = normalize(params == null ? null : params.get("vnp_TransactionStatus"));
        return "00".equals(responseCode) && "00".equals(transactionStatus);
    }

    private String buildQueryString(Map<String, String> params) {
        return params.entrySet().stream()
                .filter(entry -> !isBlank(entry.getValue()))
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> urlEncode(entry.getKey()) + "=" + urlEncode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String buildSignedData(Map<String, String> params) {
        return params.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("vnp_"))
                .filter(entry -> !"vnp_SecureHash".equals(entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(entry.getKey()))
                .filter(entry -> !isBlank(entry.getValue()))
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> urlEncode(entry.getKey()) + "=" + urlEncode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String hmacSha512(String secretKey, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKeySpec);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte currentByte : bytes) {
                hex.append(String.format("%02x", currentByte));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPay", ex);
        }
    }

    private String normalizeClientIp(String clientIpAddress) {
        String normalized = normalize(clientIpAddress);
        if (isBlank(normalized) || "0:0:0:0:0:0:0:1".equals(normalized)) {
            return "127.0.0.1";
        }
        return normalized;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return VNPAY_DATE_TIME_FORMAT.format(dateTime);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}