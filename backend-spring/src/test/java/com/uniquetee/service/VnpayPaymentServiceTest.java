package com.uniquetee.service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.uniquetee.entity.Order;

class VnpayPaymentServiceTest {

    @Test
    void processCallback_confirmsSuccessfulReturnAndKeepsIpnIdempotent() {
        RecordingOrderService orderService = new RecordingOrderService();
        VnpayPaymentService vnpayPaymentService = new VnpayPaymentService(orderService);
        ReflectionTestUtils.setField(vnpayPaymentService, "hashSecret", "test-secret");

        Order order = new Order();
        order.setId(1);
        order.setOrderCode("UNQ-123");
        order.setStatus("pending");
        order.setPaymentMethod("vnpay");
        order.setTotal(new BigDecimal("100000"));
        orderService.setOrder(order);

        Map<String, String> params = createSignedSuccessParams("UNQ-123");

        VnpayCallbackResult returnResult = vnpayPaymentService.processCallback(params, false);

        assertTrue(returnResult.signatureValid());
        assertTrue(returnResult.orderFound());
        assertTrue(returnResult.paymentSuccess());
        assertEquals(1, orderService.getConfirmCallCount());

        VnpayCallbackResult ipnResult = vnpayPaymentService.processCallback(params, true);

        assertTrue(ipnResult.signatureValid());
        assertTrue(ipnResult.orderFound());
        assertTrue(ipnResult.paymentSuccess());
        assertEquals(2, orderService.getConfirmCallCount());
    }

    private Map<String, String> createSignedSuccessParams(String orderCode) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", "10000000");
        params.put("vnp_Command", "pay");
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", "Thanh toan don hang #" + orderCode);
        params.put("vnp_OrderType", "other");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TmnCode", "04K6II75");
        params.put("vnp_TxnRef", orderCode);
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_SecureHash", signParams(params));
        return params;
    }

    private String signParams(Map<String, String> params) {
        String signedData = params.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith("vnp_"))
                .filter(entry -> !"vnp_SecureHash".equals(entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(entry.getKey()))
                .filter(entry -> entry.getValue() != null && !entry.getValue().isBlank())
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> urlEncode(entry.getKey()) + "=" + urlEncode(entry.getValue()))
                .collect(Collectors.joining("&"));

        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKeySpec);
            byte[] bytes = hmac512.doFinal(signedData.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte currentByte : bytes) {
                hex.append(String.format("%02x", currentByte));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Không thể tạo chữ ký test VNPay", ex);
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static final class RecordingOrderService extends OrderService {

        private Optional<Order> order = Optional.empty();
        private int confirmCallCount;

        void setOrder(Order order) {
            this.order = Optional.ofNullable(order);
        }

        @Override
        public Optional<Order> getOrderByCode(String orderCode) {
            return order;
        }

        @Override
        public Order markPaymentPendingAndNotify(Integer id) {
            this.confirmCallCount++;
            order.ifPresent(currentOrder -> currentOrder.setStatus("pending"));
            return order.orElse(null);
        }

        int getConfirmCallCount() {
            return confirmCallCount;
        }
    }
}
