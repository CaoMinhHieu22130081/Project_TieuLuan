package com.uniquetee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.CartItem;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Integer> {
    List<CartItem> findByUserId(Integer userId);
    Optional<CartItem> findByUserIdAndProductIdAndColorAndSize(Integer userId, Integer productId, String color, String size);
    void deleteByUserId(Integer userId);
    void deleteByUserIdAndId(Integer userId, Integer id);
}
