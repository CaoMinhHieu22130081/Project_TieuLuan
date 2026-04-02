package com.uniquetee.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

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

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Lấy token từ Authorization header
            String token = extractTokenFromRequest(request);
            
            if (token != null && jwtUtil.validateToken(token)) {
                // Token hợp lệ, lấy user info
                String email = jwtUtil.getEmailFromToken(token);
                Integer userId = jwtUtil.getUserIdFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);
                
                // Set user info vào request attributes
                request.setAttribute("userId", userId);
                request.setAttribute("email", email);
                request.setAttribute("role", role);
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
}
