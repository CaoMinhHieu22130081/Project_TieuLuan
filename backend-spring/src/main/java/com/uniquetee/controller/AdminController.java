package com.uniquetee.controller;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.entity.Order;
import com.uniquetee.entity.User;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.UserRepository;
import com.uniquetee.service.UserService;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {
        "http://127.0.0.1:5173", "http://localhost:5173",
        "http://127.0.0.1:5174", "http://localhost:5174",
        "http://127.0.0.1:5175", "http://localhost:5175",
        "http://127.0.0.1:5176", "http://localhost:5176"
})
public class AdminController {

    private static final DateTimeFormatter ADMIN_USER_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    @RequiredRole({"admin"})
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "joinedAt"))
                .stream()
                .map(this::mapUserSummary)
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    @RequiredRole({"admin"})
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable int id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(mapUserSummary(user)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Người dùng không tồn tại")));
    }

    @PutMapping("/users/{id}/role")
    @RequiredRole({"admin"})
    public ResponseEntity<Map<String, Object>> updateUserRole(@PathVariable int id,
            @RequestBody Map<String, String> request) {
        String role = normalizeValue(request.get("role"));
        if (!isValidRole(role)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vai trò không hợp lệ"));
        }

        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Người dùng không tồn tại"));
        }

        User user = userOptional.get();
        user.setRole(role);
        user = userRepository.save(user);

        return ResponseEntity.ok(mapUserSummary(user));
    }

    @PutMapping("/users/{id}/status")
    @RequiredRole({"admin"})
    public ResponseEntity<Map<String, Object>> updateUserStatus(@PathVariable int id,
            @RequestBody Map<String, String> request) {
        String status = normalizeValue(request.get("status"));
        if (!isValidStatus(status)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ"));
        }

        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Người dùng không tồn tại"));
        }

        User user = userOptional.get();
        user.setStatus(status);
        user = userRepository.save(user);

        return ResponseEntity.ok(mapUserSummary(user));
    }

    @DeleteMapping("/users/{id}")
    @RequiredRole({"admin"})
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable int id) {
        boolean deleted = userService.deleteUser(id);
        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Người dùng không tồn tại"));
        }

        return ResponseEntity.ok(Map.of("message", "Tài khoản đã được xóa"));
    }

    @GetMapping("/orders")
    @RequiredRole({"admin", "staff"})
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @GetMapping("/stats")
    @RequiredRole({"admin"})
    public ResponseEntity<Map<String, Object>> getStats() {
        List<User> users = userRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("users", users.size());
        stats.put("activeUsers", users.stream().filter(user -> "active".equalsIgnoreCase(user.getStatus())).count());
        stats.put("blockedUsers", users.stream().filter(user -> "blocked".equalsIgnoreCase(user.getStatus())).count());
        stats.put("adminUsers", users.stream().filter(user -> "admin".equalsIgnoreCase(user.getRole())).count());
        stats.put("staffUsers", users.stream().filter(user -> "staff".equalsIgnoreCase(user.getRole())).count());
        stats.put("customerUsers", users.stream().filter(user -> "customer".equalsIgnoreCase(user.getRole())).count());
        stats.put("orders", orderRepository.count());
        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> mapUserSummary(User user) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", user.getId());
        summary.put("name", user.getName());
        summary.put("email", user.getEmail());
        summary.put("phone", user.getPhone());
        summary.put("role", normalizeValue(user.getRole(), "customer"));
        summary.put("status", normalizeValue(user.getStatus(), "active"));
        summary.put("orders", user.getOrderCount() == null ? Integer.valueOf(0) : user.getOrderCount());
        summary.put("spent", user.getSpent() != null ? user.getSpent() : BigDecimal.ZERO);
        summary.put("createdAt", user.getJoinedAt() != null ? user.getJoinedAt().format(ADMIN_USER_DATE_FORMAT) : null);
        summary.put("gender", user.getGender());
        summary.put("dob", user.getDob());
        summary.put("address", user.getAddress());
        return summary;
    }

    private String normalizeValue(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String normalizeValue(String value, String defaultValue) {
        String normalizedValue = normalizeValue(value);
        return normalizedValue == null || normalizedValue.isBlank() ? defaultValue : normalizedValue;
    }

    private boolean isValidRole(String role) {
        return role != null && List.of("admin", "staff", "customer").contains(role);
    }

    private boolean isValidStatus(String status) {
        return status != null && List.of("active", "inactive", "blocked").contains(status);
    }
}
