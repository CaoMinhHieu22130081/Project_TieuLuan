package com.uniquetee.controller;

import java.util.Arrays;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.dto.ApplyVoucherRequest;
import com.uniquetee.entity.PromoCode;
import com.uniquetee.service.PromoCodeService;
import com.uniquetee.service.UserVoucherService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/vouchers")
@CrossOrigin(origins = {"http://localhost:5176", "http://127.0.0.1:5176"}, allowCredentials = "true")
public class VoucherController {

    @Autowired
    private PromoCodeService promoCodeService;

    @Autowired
    private UserVoucherService userVoucherService;

    // ─── Helper: kiểm tra role ────────────────────────────────────────────────
    private ResponseEntity<?> unauthorized(String[] requiredRoles) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Unauthorized: cần đăng nhập. Required roles: " + Arrays.toString(requiredRoles)));
    }

    private ResponseEntity<?> forbidden(String userRole, String[] requiredRoles) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Forbidden: role '" + userRole + "' không có quyền. Required: " + Arrays.toString(requiredRoles)));
    }

    /** Trả về null nếu role hợp lệ, trả ResponseEntity lỗi nếu không hợp lệ */
    private ResponseEntity<?> requireRole(HttpServletRequest request, String... roles) {
        String userRole = (String) request.getAttribute("role");
        if (userRole == null) return unauthorized(roles);
        for (String r : roles) {
            if (userRole.equalsIgnoreCase(r)) return null; // OK
        }
        return forbidden(userRole, roles);
    }

    // ─── Public ───────────────────────────────────────────────────────────────

    @GetMapping("/public")
    public ResponseEntity<?> getPublicVouchers() {
        return ResponseEntity.ok(promoCodeService.getActivePromoCodes());
    }

    // ─── User ─────────────────────────────────────────────────────────────────

    @PostMapping("/{voucherId}/save")
    public ResponseEntity<?> saveVoucher(
            @PathVariable Integer voucherId,
            @RequestParam Integer userId,
            HttpServletRequest request
    ) {
        ResponseEntity<?> authErr = requireRole(request, "customer", "admin", "staff");
        if (authErr != null) return authErr;
        try {
            return ResponseEntity.ok(userVoucherService.saveVoucher(userId, voucherId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Lỗi lưu voucher"));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserVouchers(@PathVariable Integer userId, HttpServletRequest request) {
        ResponseEntity<?> authErr = requireRole(request, "customer", "admin", "staff");
        if (authErr != null) return authErr;
        return ResponseEntity.ok(userVoucherService.getSavedVouchers(userId));
    }

    @PostMapping("/apply")
    public ResponseEntity<?> applyVoucher(@RequestBody ApplyVoucherRequest applyRequest) {
        return ResponseEntity.ok(promoCodeService.applyVoucher(applyRequest));
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    @GetMapping("/all")
    public ResponseEntity<?> getAllVouchers(HttpServletRequest request) {
        ResponseEntity<?> authErr = requireRole(request, "admin", "staff");
        if (authErr != null) return authErr;
        return ResponseEntity.ok(promoCodeService.getAllPromoCodes());
    }

    @PostMapping("/create")
    public ResponseEntity<?> createVoucher(@RequestBody PromoCode promoCode, HttpServletRequest request) {
        ResponseEntity<?> authErr = requireRole(request, "admin", "staff");
        if (authErr != null) return authErr;
        return ResponseEntity.ok(promoCodeService.createPromoCode(promoCode));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVoucher(@PathVariable Integer id, @RequestBody PromoCode promoCodeDetails, HttpServletRequest request) {
        ResponseEntity<?> authErr = requireRole(request, "admin", "staff");
        if (authErr != null) return authErr;
        PromoCode updated = promoCodeService.updatePromoCode(id, promoCodeDetails);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVoucher(@PathVariable Integer id, HttpServletRequest request) {
        ResponseEntity<?> authErr = requireRole(request, "admin", "staff");
        if (authErr != null) return authErr;
        promoCodeService.deletePromoCode(id);
        return ResponseEntity.ok().build();
    }
}

