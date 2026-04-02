package com.uniquetee.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.config.JwtUtil;
import com.uniquetee.entity.User;
import com.uniquetee.service.UserService;
import com.uniquetee.service.EmailService;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173",
                        "http://127.0.0.1:5174", "http://localhost:5174",
                        "http://127.0.0.1:5175", "http://localhost:5175",
                        "http://127.0.0.1:5176", "http://localhost:5176"})
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @GetMapping
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
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
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

            // Generate JWT token
            String token = jwtUtil.generateToken(createdUser.getEmail(), createdUser.getId());

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
                    // Generate JWT token
                    String token = jwtUtil.generateToken(user.getEmail(), user.getId());

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
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @RequestBody User userDetails) {
        User updatedUser = userService.updateUser(id, userDetails);
        if (updatedUser != null) {
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
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
     * Generate JWT token for OAuth2 user after successful OAuth2 authentication
     * Called from frontend after OAuth2 user is authenticated
     */
    @PostMapping("/oauth2/callback")
    public ResponseEntity<Object> oauth2Callback(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String email = request.get("email");

            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "userId là bắt buộc"));
            }

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "email là bắt buộc"));
            }

            // Verify user exists
            Optional<User> userOpt = userService.getUserById(Integer.parseInt(userId));
            if (!userOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Người dùng không tìm thấy"));
            }

            User user = userOpt.get();

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getId());

            // Return response with token and user info
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Đăng nhập OAuth2 thành công");
            response.put("token", token);
            response.put("user", user);

            return ResponseEntity.ok(response);

        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "userId phải là số"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi OAuth2 callback: " + e.getMessage()));
        }
    }

    /**
     * Get OAuth2 user info endpoint for frontend
     * Frontend calls this endpoint with OAuth2 attributes to create user or get existing user
     */
    @PostMapping("/oauth2/user-info")
    public ResponseEntity<Object> getOAuth2UserInfo(@RequestBody Map<String, Object> attributes) {
        try {
            String provider = (String) attributes.get("provider"); // "google" or "facebook"
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String picture = (String) attributes.get("picture");

            if (provider == null || provider.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "provider là bắt buộc"));
            }

            if (email == null || email.isEmpty()) {
                // For Facebook without email
                if ("facebook".equals(provider)) {
                    email = "facebook_" + attributes.get("id") + "@sociallogin.local";
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "email là bắt buộc"));
                }
            }

            // Check if user exists
            Optional<User> userOpt = userService.getUserByEmail(email);
            User user;

            if (userOpt.isPresent()) {
                user = userOpt.get();
            } else {
                // Create new user from OAuth2 info
                user = new User();
                user.setEmail(email);
                user.setName(name != null ? name : email);
                user.setPassword("OAUTH2_" + provider.toUpperCase() + "_" + System.currentTimeMillis());
                user.setRole("customer");
                user.setStatus("active");
                user.setAvatar(name != null && !name.isEmpty() ? name.substring(0, 1).toUpperCase() : "U");

                try {
                    user = userService.createUser(user);
                } catch (Exception createEx) {
                    // If user creation fails (e.g., email already exists in between),
                    // try to fetch again
                    Optional<User> retryOpt = userService.getUserByEmail(email);
                    if (retryOpt.isPresent()) {
                        user = retryOpt.get();
                    } else {
                        throw createEx;
                    }
                }
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(user.getEmail(), user.getId());

            // Return response with token and user info
            Map<String, Object> response = new HashMap<>();
            response.put("message", "OAuth2 user info lấy thành công");
            response.put("token", token);
            response.put("user", user);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi OAuth2 user info: " + e.getMessage()));
        }
    }
}
