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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.entity.CartItem;
import com.uniquetee.entity.Product;
import com.uniquetee.entity.User;
import com.uniquetee.service.CartService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/cart")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174", "http://127.0.0.1:5175", "http://localhost:5175", "http://127.0.0.1:5176", "http://localhost:5176"}, allowCredentials = "true")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping("/user/{userId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<List<CartItem>> getUserCart(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @PostMapping
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<CartItem> addToCart(@RequestBody Map<String, Object> requestBody, HttpServletRequest request) {
        try {
            Integer userId = (Integer) requestBody.get("userId");
            if (userId == null || !canAccessUser(userId, request)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Integer productId = (Integer) requestBody.get("productId");
            String color = (String) requestBody.get("color");
            String colorHex = (String) requestBody.get("colorHex");
            String size = (String) requestBody.get("size");
            Integer qty = (Integer) requestBody.get("qty");

            CartItem cartItem = new CartItem();
            User user = new User();
            user.setId(userId);
            cartItem.setUser(user);

            Product product = new Product();
            product.setId(productId);
            cartItem.setProduct(product);

            cartItem.setColor(color);
            cartItem.setColorHex(colorHex);
            cartItem.setSize(size);
            cartItem.setQty(qty != null ? qty : 1);

            CartItem saved = cartService.addToCart(cartItem);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{cartItemId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<CartItem> updateQty(
            @PathVariable Integer cartItemId, 
            @RequestBody Map<String, Integer> requestBody, 
            HttpServletRequest request) {
        
        Integer userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Integer newQty = requestBody.get("qty");
        if (newQty == null) {
            return ResponseEntity.badRequest().build();
        }

        CartItem updated = cartService.updateCartItemQty(userId, cartItemId, newQty);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{cartItemId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Void> removeFromCart(@PathVariable Integer cartItemId, HttpServletRequest request) {
        Integer userId = getCurrentUserId(request);
        if (userId != null) {
            cartService.removeFromCart(userId, cartItemId);
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/clear")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Void> clearCart(@PathVariable Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<Void> mergeCart(@RequestBody List<Map<String, Object>> items, HttpServletRequest request) {
        Integer userId = getCurrentUserId(request);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        for (Map<String, Object> reqItem : items) {
            try {
                Integer productId = (Integer) reqItem.get("productId");
                String color = (String) reqItem.get("color");
                String colorHex = (String) reqItem.get("colorHex");
                String size = (String) reqItem.get("size");
                Integer qty = (Integer) reqItem.get("qty");

                CartItem cartItem = new CartItem();
                User user = new User();
                user.setId(userId);
                cartItem.setUser(user);

                Product product = new Product();
                product.setId(productId);
                cartItem.setProduct(product);

                cartItem.setColor(color);
                cartItem.setColorHex(colorHex);
                cartItem.setSize(size);
                cartItem.setQty(qty != null ? qty : 1);

                cartService.addToCart(cartItem);
            } catch (Exception ignored) {
            }
        }
        return ResponseEntity.ok().build();
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
