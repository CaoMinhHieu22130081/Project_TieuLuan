package com.uniquetee.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.entity.Wishlist;
import com.uniquetee.service.WishlistService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/wishlists")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174", "http://127.0.0.1:5175", "http://localhost:5175", "http://127.0.0.1:5176", "http://localhost:5176"}, allowCredentials = "true")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping("/user/{userId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<List<Wishlist>> getUserWishlist(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(wishlistService.getWishlistByUserId(userId));
    }

    @PostMapping
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Wishlist> addToWishlist(@RequestBody Map<String, Integer> requestBody, HttpServletRequest request) {
        Integer userId = requestBody.get("userId");
        Integer productId = requestBody.get("productId");

        if (userId == null || productId == null) {
            return ResponseEntity.badRequest().build();
        }
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        // Kiểm tra xem đã tồn tại chưa
        if (wishlistService.isProductInWishlist(userId, productId)) {
            return ResponseEntity.ok().build();
        }
        
        Wishlist wishlist = new Wishlist();
        com.uniquetee.entity.User user = new com.uniquetee.entity.User();
        user.setId(userId);
        wishlist.setUser(user);
        
        com.uniquetee.entity.Product product = new com.uniquetee.entity.Product();
        product.setId(productId);
        wishlist.setProduct(product);

        Wishlist created = wishlistService.addToWishlist(wishlist);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{userId}/{productId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable Integer userId, 
            @PathVariable Integer productId, 
            HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        wishlistService.removeFromWishlist(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/clear")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Void> clearWishlist(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        wishlistService.clearWishlist(userId);
        return ResponseEntity.noContent().build();
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
