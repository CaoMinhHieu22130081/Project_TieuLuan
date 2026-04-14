package com.uniquetee.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.dto.VnpayCreateRequest;
import com.uniquetee.service.VnpayCallbackResult;
import com.uniquetee.service.VnpayPaymentService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/payments/vnpay")
@CrossOrigin(origins = {
        "http://127.0.0.1:5173", "http://localhost:5173",
        "http://127.0.0.1:5174", "http://localhost:5174",
        "http://127.0.0.1:5175", "http://localhost:5175",
        "http://127.0.0.1:5176", "http://localhost:5176"
})
public class PaymentController {

    @Autowired
    private VnpayPaymentService vnpayPaymentService;

    @GetMapping("/configured")
    public ResponseEntity<Map<String, Object>> getConfigurationState() {
        return ResponseEntity.ok(Map.of(
                "configured", vnpayPaymentService.isConfigured(),
                "missingFields", vnpayPaymentService.missingConfigurationFields()));
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createPayment(@Valid @RequestBody VnpayCreateRequest request,
            HttpServletRequest servletRequest) {
        try {
            String paymentUrl = vnpayPaymentService.createPaymentUrl(request.getOrderCode(), extractClientIp(servletRequest));
            return ResponseEntity.ok(Map.of(
                    "orderCode", request.getOrderCode(),
                    "paymentUrl", paymentUrl,
                    "configured", Boolean.TRUE));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "message", ex.getMessage(),
                    "configured", vnpayPaymentService.isConfigured()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "message", ex.getMessage(),
                    "configured", vnpayPaymentService.isConfigured(),
                    "missingFields", vnpayPaymentService.missingConfigurationFields()));
        }
    }

    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(@RequestParam Map<String, String> params) {
        VnpayCallbackResult result = vnpayPaymentService.processCallback(params, false);
        String paymentResult = result.signatureValid() && result.orderFound() && result.paymentSuccess()
            ? "waiting"
            : "failed";
        String message = result.signatureValid() && result.orderFound() && result.paymentSuccess()
            ? "Thanh toán VNPay đã được ghi nhận, đang chờ xác nhận từ VNPay."
            : result.message();
        String redirectUrl = vnpayPaymentService.buildFrontendRedirectUrl(
                result.orderCode(),
            paymentResult,
                params.get("vnp_ResponseCode"),
            message);

        return ResponseEntity.status(HttpStatus.FOUND)
            .header("Location", Objects.requireNonNull(redirectUrl, "redirectUrl"))
                .build();
    }

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, Object>> handleIpn(@RequestParam Map<String, String> params) {
        VnpayCallbackResult result = vnpayPaymentService.processCallback(params, true);

        if (!result.signatureValid()) {
            return ResponseEntity.ok(Map.of(
                    "RspCode", "97",
                    "Message", result.message()));
        }

        if (!result.orderFound()) {
            return ResponseEntity.ok(Map.of(
                    "RspCode", "01",
                    "Message", result.message()));
        }

        return ResponseEntity.ok(Map.of(
                "RspCode", "00",
                "Message", result.message()));
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String clientIp = request.getRemoteAddr();
        return clientIp == null ? "127.0.0.1" : clientIp;
    }
}