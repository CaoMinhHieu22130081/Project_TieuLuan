package com.uniquetee.controller;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.entity.UserAddress;
import com.uniquetee.service.UserAddressService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173",
        "http://127.0.0.1:5174", "http://localhost:5174",
        "http://127.0.0.1:5175", "http://localhost:5175",
        "http://127.0.0.1:5176", "http://localhost:5176"}, allowCredentials = "true")
public class UserAddressController {

    @Autowired
    private UserAddressService userAddressService;

    @GetMapping("/{userId}/addresses")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> getAddresses(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized to view these addresses"));
        }
        List<UserAddress> addresses = userAddressService.getAddresses(userId);
        return ResponseEntity.ok(addresses);
    }

    @GetMapping("/{userId}/addresses/default")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> getDefaultAddress(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }
        return userAddressService.getDefaultAddress(userId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{userId}/addresses")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> createAddress(@PathVariable Integer userId, @RequestBody UserAddress address, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }
        try {
            UserAddress created = userAddressService.createAddress(userId, address);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/addresses/{addressId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> updateAddress(@PathVariable Integer userId, @PathVariable Integer addressId, @RequestBody UserAddress address, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }
        try {
            UserAddress updated = userAddressService.updateAddress(userId, addressId, address);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/addresses/{addressId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> deleteAddress(@PathVariable Integer userId, @PathVariable Integer addressId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }
        try {
            userAddressService.deleteAddress(userId, addressId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{userId}/addresses/{addressId}/default")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> setDefaultAddress(@PathVariable Integer userId, @PathVariable Integer addressId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Unauthorized"));
        }
        try {
            UserAddress updated = userAddressService.setDefaultAddress(userId, addressId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private Integer getCurrentUserId(HttpServletRequest request) {
        Object currentUserId = request.getAttribute("userId");
        if (currentUserId instanceof Integer integerUserId) {
            return integerUserId;
        }
        if (currentUserId instanceof Number numberUserId) {
            return numberUserId.intValue();
        }
        if (currentUserId instanceof String stringUserId) {
            try {
                return Integer.valueOf(stringUserId.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String getCurrentUserRole(HttpServletRequest request) {
        Object currentRole = request.getAttribute("role");
        return currentRole == null ? null : currentRole.toString();
    }

    private boolean isAdminOrStaff(String role) {
        if (role == null) {
            return false;
        }
        return "admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role);
    }

    private boolean canAccessUser(Integer targetUserId, HttpServletRequest request) {
        String currentRole = getCurrentUserRole(request);
        if (isAdminOrStaff(currentRole)) {
            return true;
        }

        Integer currentUserId = getCurrentUserId(request);
        return currentUserId != null && currentUserId.equals(targetUserId);
    }
}
