package com.uniquetee.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.CartItem;
import com.uniquetee.repository.CartItemRepository;

import jakarta.transaction.Transactional;

@Service
public class CartService {

    @Autowired
    private CartItemRepository cartItemRepository;

    public List<CartItem> getCartByUserId(Integer userId) {
        return cartItemRepository.findByUserId(userId);
    }

    @Transactional
    public CartItem addToCart(CartItem item) {
        // Find existing to increment quantity, or save new
        Optional<CartItem> existingOpt = cartItemRepository.findByUserIdAndProductIdAndColorAndSize(
            item.getUser().getId(), 
            item.getProduct().getId(), 
            item.getColor(), 
            item.getSize()
        );

        if (existingOpt.isPresent()) {
            CartItem existing = existingOpt.get();
            existing.setQty(existing.getQty() + item.getQty());
            return cartItemRepository.save(existing);
        } else {
            return cartItemRepository.save(item);
        }
    }

    @Transactional
    public CartItem updateCartItemQty(Integer userId, Integer cartItemId, Integer newQty) {
        Optional<CartItem> itemOpt = cartItemRepository.findById(cartItemId);
        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            if (item.getUser().getId().equals(userId)) {
                if (newQty <= 0) {
                    cartItemRepository.delete(item);
                    return null;
                } else {
                    item.setQty(newQty);
                    return cartItemRepository.save(item);
                }
            }
        }
        return null; // or throw exception
    }

    @Transactional
    public void removeFromCart(Integer userId, Integer cartItemId) {
        cartItemRepository.deleteByUserIdAndId(userId, cartItemId);
    }

    @Transactional
    public void clearCart(Integer userId) {
        cartItemRepository.deleteByUserId(userId);
    }
}
