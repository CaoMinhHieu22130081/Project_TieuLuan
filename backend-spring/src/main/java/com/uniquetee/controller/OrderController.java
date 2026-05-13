package com.uniquetee.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.dto.OrderCancellationRequest;
import com.uniquetee.dto.PurchasedProductRecommendation;
import com.uniquetee.entity.Order;
import com.uniquetee.service.OrderService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174", "http://127.0.0.1:5175", "http://localhost:5175", "http://127.0.0.1:5176", "http://localhost:5176"}, allowCredentials = "true")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping("/user/{userId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping("/user/{userId}/recommendations")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<List<PurchasedProductRecommendation>> getPurchaseRecommendations(
            @PathVariable Integer userId,
            @RequestParam(defaultValue = "8") int limit,
            HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(orderService.getPurchasedProductRecommendations(userId, limit));
    }

    @GetMapping("/{id}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Order> getOrderById(@PathVariable Integer id, HttpServletRequest request) {
        Optional<Order> order = orderService.getOrderById(id);
        if (order.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!canAccessOrder(order.get(), request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(order.get());
    }

    @GetMapping("/code/{orderCode}")
    public ResponseEntity<Order> getOrderByCode(@PathVariable String orderCode, HttpServletRequest request) {
        Optional<Order> order = orderService.getOrderByCode(orderCode);
        if (order.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order foundOrder = order.get();
        if (foundOrder.getUser() != null && !canAccessOrder(foundOrder, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(foundOrder);
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        Order created = orderService.createOrder(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/status")
    @RequiredRole({"admin", "staff"})
    public ResponseEntity<Order> updateStatus(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Order updated = orderService.updateOrderStatus(id, status);
        if (updated != null) return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/cancel")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Order> cancelOrder(@PathVariable Integer id, @RequestBody OrderCancellationRequest cancelRequest, HttpServletRequest request) {
        Optional<Order> orderOpt = orderService.getOrderById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();
        if (!canAccessOrder(order, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        boolean hasReasons = cancelRequest.getReasons() != null && !cancelRequest.getReasons().isEmpty();
        boolean hasOther = cancelRequest.getOtherReason() != null && !cancelRequest.getOtherReason().isBlank();
        if (!hasReasons && !hasOther) {
            return ResponseEntity.badRequest().build();
        }

        Order updated = orderService.cancelOrder(id, cancelRequest.getReasons(), cancelRequest.getOtherReason());
        if (updated != null) return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
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

    private boolean canAccessOrder(Order order, HttpServletRequest request) {
        String currentRole = getCurrentUserRole(request);
        if (isAdminOrStaff(currentRole)) {
            return true;
        }

        Integer currentUserId = getCurrentUserId(request);
        Integer ownerId = order.getUser() == null ? null : order.getUser().getId();
        return currentUserId != null && currentUserId.equals(ownerId);
    }
}
