package com.uniquetee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.Wishlist;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Integer> {
    // Tìm danh sách yêu thích của người dùng
    List<Wishlist> findByUserId(Integer userId);

    // Kiểm tra sản phẩm có trong danh sách yêu thích hay không
    Optional<Wishlist> findByUserIdAndProductId(Integer userId, Integer productId);

    // Xoá khỏi danh sách yêu thích
    void deleteByUserIdAndProductId(Integer userId, Integer productId);

    // Tìm số lượng sản phẩm yêu thích
    Long countByUserId(Integer userId);
}
