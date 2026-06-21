package com.uniquetee.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.config.JwtUtil;
import com.uniquetee.entity.User;
import com.uniquetee.service.EmailService;
import com.uniquetee.service.UserService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173",
                        "http://127.0.0.1:5174", "http://localhost:5174",
                        "http://127.0.0.1:5175", "http://localhost:5175",
                        "http://127.0.0.1:5176", "http://localhost:5176"}, allowCredentials = "true")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @GetMapping
    @RequiredRole({"admin"})
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/test")
    public ResponseEntity<Object> testEndpoint() {
        return ResponseEntity.ok(Map.of("message", "✅ Test endpoint works!"));
    }

    @PostMapping("/test-post")
    public ResponseEntity<Object> testPostEndpoint(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(Map.of("message", "✅ Test POST with hyphen works!", "received", request));
    }

    @GetMapping("/{id}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<User> getUserById(@PathVariable Integer id, HttpServletRequest request) {
        if (!canAccessUser(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/register")
    public ResponseEntity<Object> register(@RequestBody User user) {
        try {
            // Validate input
            if (user.getEmail() == null || user.getEmail().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email là bắt buộc"));
            }
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Mật khẩu là bắt buộc"));
            }
            if (user.getName() == null || user.getName().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Họ tên là bắt buộc"));
            }
            if (user.getPhone() == null || user.getPhone().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Số điện thoại là bắt buộc"));
            }
            if (user.getGender() == null || user.getGender().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Giới tính là bắt buộc"));
            }
            if (user.getDob() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Ngày sinh là bắt buộc"));
            }

            // Register user (email duplicate check inside service)
            User createdUser = userService.registerUser(user);

            // Generate JWT token with role
            String token = jwtUtil.generateToken(createdUser.getEmail(), createdUser.getId(), createdUser.getRole());

            // Return response with token and user info
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đăng ký thành công");
            response.put("token", token);
            response.put("user", createdUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Đăng ký thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email là bắt buộc"));
            }
            if (password == null || password.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Mật khẩu là bắt buộc"));
            }

            // Authenticate user
            try {
                User user = userService.authenticate(email, password);
                if (user != null) {
                    // Generate JWT token with role
                    String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());

                    // Return response with token and user info
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Đăng nhập thành công");
                    response.put("token", token);
                    response.put("user", user);

                    return ResponseEntity.ok(response);
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Email hoặc mật khẩu không chính xác"));
                }
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Đăng nhập thất bại: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody User userDetails, HttpServletRequest request) {
        if (!canAccessUser(id, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Prevent profile update from mutating privileged or derived fields.
        userDetails.setPassword(null);
        userDetails.setSpent(null);
        userDetails.setOrderCount(null);

        if (!isAdminOrStaff(getCurrentUserRole(request))) {
            userDetails.setRole(null);
            userDetails.setStatus(null);
        }

        User updatedUser = userService.updateUser(id, userDetails);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @RequiredRole({"admin"})
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        if (userService.deleteUser(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Object> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email là bắt buộc"));
            }

            // Create reset token
            String token = userService.createPasswordResetToken(email);

            // Send email with reset link (skip if email fails)
            try {
                String resetLink = "http://localhost:5176/reset-password?token=" + token;
                emailService.sendPasswordResetEmail(email, token, resetLink);
            } catch (Exception emailEx) {
                // Log error but don't fail the token creation
                System.out.println("Warning: Failed to send reset email: " + emailEx.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi gửi email: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Object> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || token.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Token là bắt buộc"));
            }
            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Mật khẩu mới là bắt buộc"));
            }

            // Reset password and get the PasswordReset object back
            com.uniquetee.entity.PasswordReset passwordReset = userService.resetPassword(token, newPassword);
            String email = passwordReset.getEmail();
            String userName = userService.getUserByEmail(email).get().getName();
            
            // Send success notification email (skip if email fails)
            try {
                emailService.sendPasswordResetSuccessEmail(email, userName);
            } catch (Exception emailEx) {
                // Log error but don't fail the password reset
                System.out.println("Warning: Failed to send notification email: " + emailEx.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi đặt lại mật khẩu: " + e.getMessage()));
        }
    }

    // ============ TEST ENDPOINT (FOR DEVELOPMENT ONLY) ============
    @PostMapping("/get-reset-token")
    @RequiredRole({"admin"})
    public ResponseEntity<Object> getResetToken(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email là bắt buộc"));
            }

            String token = userService.getResetTokenByEmail(email);

            return ResponseEntity.ok(Map.of(
                    "message", "Token lấy thành công (chỉ để test)",
                    "token", token,
                    "resetLink", "http://localhost:5176/reset-password?token=" + token
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    // ============ OAUTH2 ENDPOINTS ============
    
    /**
     * Generate JWT token for OAuth2 user after successful OAuth2 authentication.
     * Uses the authenticated OAuth2 session instead of trusting request body data.
     */
    @PostMapping("/oauth2/callback")
    public ResponseEntity<Object> oauth2Callback(@AuthenticationPrincipal OAuth2User oauth2User) {
        return buildOAuth2LoginResponse(oauth2User, "Đăng nhập OAuth2 thành công");
    }

    /**
     * Get OAuth2 user info endpoint for frontend.
     * Reuses the authenticated OAuth2 session.
     */
    @PostMapping("/oauth2/user-info")
    public ResponseEntity<Object> getOAuth2UserInfo(@AuthenticationPrincipal OAuth2User oauth2User) {
        return buildOAuth2LoginResponse(oauth2User, "OAuth2 user info lấy thành công");
    }

    private ResponseEntity<Object> buildOAuth2LoginResponse(OAuth2User oauth2User, String successMessage) {
        try {
            if (oauth2User == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Phiên OAuth2 không hợp lệ hoặc đã hết hạn"));
            }

            Integer userId = resolveOAuth2UserId(oauth2User.getAttribute("userId"));
            String email = resolveOAuth2Email(oauth2User.getAttribute("email"));

            Optional<User> userOpt = Optional.empty();
            if (userId != null) {
                userOpt = userService.getUserById(userId);
            }
            if (userOpt.isEmpty() && email != null) {
                userOpt = userService.getUserByEmailIgnoreCase(email);
            }

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Người dùng không tìm thấy"));
            }

            User user = userOpt.get();

            if (user.getStatus() == null || !"active".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(423)
                        .body(Map.of("message", "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."));
            }

            // Generate JWT token with role
            String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole());

            // Return response with token and user info
            Map<String, Object> response = new HashMap<>();
            response.put("message", successMessage);
            response.put("token", token);
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi OAuth2 callback: " + e.getMessage()));
        }
    }

    /**
     * Change password for logged-in user
     * @param userId User ID
     * @param request Map containing oldPassword and newPassword
     * @return Response with success/error message
     */
    @PostMapping("/{id}/change-password")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Object> changePassword(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request,
            HttpServletRequest servletRequest) {
        try {
            if (!canAccessUser(id, servletRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Bạn không có quyền thay đổi mật khẩu tài khoản này"));
            }

            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            // Validate input
            if (oldPassword == null || oldPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Mật khẩu cũ là bắt buộc"));
            }
            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Mật khẩu mới là bắt buộc"));
            }
            if (confirmPassword == null || confirmPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Xác nhận mật khẩu là bắt buộc"));
            }

            // Check if passwords match
            if (!newPassword.equals(confirmPassword)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Mật khẩu mới và xác nhận mật khẩu không khớp"));
            }

            // Change password
            User updatedUser = userService.changePassword(id, oldPassword, newPassword);

            return ResponseEntity.ok(Map.of(
                    "message", "Mật khẩu đã được thay đổi thành công",
                    "user", updatedUser
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi thay đổi mật khẩu: " + e.getMessage()));
        }
    }

    /**
     * Upload/Update user avatar
     * Accepts Base64 encoded image data
     * @param id User ID
     * @param request Contains imageBase64 field with Base64 encoded image
     * @return Response with success/error message and updated user
     */
    @PostMapping("/{id}/upload-avatar")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Object> uploadAvatar(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request,
            HttpServletRequest servletRequest) {
        try {
            if (!canAccessUser(id, servletRequest)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Bạn không có quyền cập nhật ảnh đại diện tài khoản này"));
            }

            String imageBase64 = request.get("imageBase64");

            // Validate input
            if (imageBase64 == null || imageBase64.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Dữ liệu hình ảnh không được để trống"));
            }

            // Update avatar
            User updatedUser = userService.updateAvatar(id, imageBase64);

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật ảnh đại diện thành công",
                    "user", updatedUser
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi cập nhật ảnh đại diện: " + e.getMessage()));
        }
    }

    private Integer resolveOAuth2UserId(Object userIdValue) {
        if (userIdValue instanceof Integer integerUserId) {
            return integerUserId;
        }
        if (userIdValue instanceof Number numberUserId) {
            return numberUserId.intValue();
        }
        if (userIdValue instanceof String stringUserId) {
            String trimmedUserId = stringUserId.trim();
            if (trimmedUserId.isEmpty()) {
                return null;
            }
            try {
                return Integer.valueOf(trimmedUserId);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String resolveOAuth2Email(Object emailValue) {
        if (emailValue == null) {
            return null;
        }
        String email = emailValue.toString().trim();
        return email.isEmpty() ? null : email;
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
        if ("admin".equalsIgnoreCase(currentRole)) {
            return true;
        }

        Integer currentUserId = getCurrentUserId(request);
        return currentUserId != null && currentUserId.equals(targetUserId);
    }
}
