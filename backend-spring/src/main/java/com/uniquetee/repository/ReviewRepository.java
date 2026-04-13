package com.uniquetee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {
    // Tìm tất cả bình luận của một sản phẩm
    List<Review> findByProductId(Integer productId);

    // Tìm tất cả bình luận của một sản phẩm theo thời gian giảm dần
    List<Review> findByProductIdOrderByCreatedAtDesc(Integer productId);

    // Kiểm tra user đã review sản phẩm này chưa
    boolean existsByUserIdAndProductId(Integer userId, Integer productId);

    // Tìm tất cả bình luận của một người dùng
    List<Review> findByUserId(Integer userId);

    // Tìm bình luận của sản phẩm sắp xếp theo rating từ cao xuống thấp
    List<Review> findByProductIdOrderByRatingDesc(Integer productId);

    // Đếm số bình luận của sản phẩm
    long countByProductId(Integer productId);
}

