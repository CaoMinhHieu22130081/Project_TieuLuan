package com.uniquetee.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.uniquetee.entity.User;
import com.uniquetee.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * JWT Filter để kiểm tra token từ Authorization header
 * Nếu token hợp lệ, sẽ set userId, email, role vào request attributes
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Lấy token từ Authorization header
            String token = extractTokenFromRequest(request);
            
            if (token != null && jwtUtil.validateToken(token)) {
                // Token hợp lệ, lấy user info mới nhất từ MySQL
                String email = jwtUtil.getEmailFromToken(token);
                Integer userId = jwtUtil.getUserIdFromToken(token);

                User user = null;
                if (userId != null) {
                    user = userRepository.findById(userId).orElse(null);
                }

                if (user == null && email != null) {
                    user = userRepository.findByEmail(email).orElse(null);
                }

                if (user == null) {
                    reject(response, HttpServletResponse.SC_UNAUTHORIZED, "Tài khoản không tồn tại hoặc token không hợp lệ");
                    return;
                }

                if (user.getStatus() == null || !"active".equalsIgnoreCase(user.getStatus())) {
                    reject(response, 423, "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
                    return;
                }
                
                // Set user info vào request attributes
                request.setAttribute("userId", user.getId());
                request.setAttribute("email", user.getEmail());
                request.setAttribute("role", user.getRole());
                request.setAttribute("status", user.getStatus());
            }
        } catch (Exception e) {
            // Log error nhưng vẫn cho request đi tiếp
            System.err.println("JWT Filter Error: " + e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token từ Authorization header
     * Format: "Bearer <token>"
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
    }
}
