package com.uniquetee.config;

import java.util.Arrays;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.uniquetee.annotation.RequiredRole;

import jakarta.servlet.http.HttpServletRequest;

/**
 * AOP Aspect để kiểm tra role trước khi thực thi method có @RequiredRole
 */
@Aspect
@Component
public class AuthorizationAspect {

    @Before("@annotation(requiredRole)")
    public void checkRole(RequiredRole requiredRole) throws Exception {
        // Lấy request từ context
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            throw new Exception("❌ Request context not found");
        }
        
        HttpServletRequest request = attributes.getRequest();
        
        // Lấy role từ request attribute (được set bởi JwtAuthenticationFilter)
        String userRole = (String) request.getAttribute("role");
        Integer userId = (Integer) request.getAttribute("userId");
        
        // Nếu không có role, kiểm tra tất cả required roles, nếu có "admin" hoặc "staff" thì block
        String[] requiredRoles = requiredRole.value();
        
        if (userRole == null) {
            // Không có token, kiểm tra xem có yêu cầu role không
            if (requiredRoles.length > 0 && !Arrays.asList(requiredRoles).contains("customer")) {
                throw new SecurityException("❌ Unauthorized: Token required. Required roles: " + Arrays.toString(requiredRoles));
            }
            return; // Allow if no specific role required
        }
        
        // Kiểm tra xem role của user có trong required roles không
        boolean hasRequiredRole = false;
        for (String role : requiredRoles) {
            if (userRole.equalsIgnoreCase(role)) {
                hasRequiredRole = true;
                break;
            }
        }
        
        if (!hasRequiredRole) {
            throw new SecurityException("❌ Forbidden: User role '" + userRole + "' is not allowed. Required roles: " + 
                    Arrays.toString(requiredRoles) + " (User ID: " + userId + ")");
        }
    }
}
