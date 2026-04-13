package com.uniquetee.service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.Review;
import com.uniquetee.repository.ReviewRepository;

/**
 * Service quản lý Đánh giá sản phẩm
 */
@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    /**
     * Lấy tất cả bình luận
     */
    public List<Review> getAllReviews() {
        return reviewRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    /**
     * Lấy bình luận theo ID
     */
    public Optional<Review> getReviewById(@NonNull Integer id) {
        return reviewRepository.findById(Objects.requireNonNull(id, "id"));
    }

    /**
     * Lấy tất cả bình luận của một sản phẩm
     */
    public List<Review> getReviewsByProductId(Integer productId) {
        return reviewRepository.findByProductId(productId);
    }

    /**
     * Lấy tất cả bình luận của một người dùng
     */
    public List<Review> getReviewsByUserId(Integer userId) {
        return reviewRepository.findByUserId(userId);
    }

    /**
     * Lấy bình luận có rating từ cao xuống thấp
     */
    public List<Review> getTopRatedReviews(Integer productId) {
        return reviewRepository.findByProductIdOrderByRatingDesc(productId);
    }

    /**
     * Tạo đánh giá mới
     */
    public Review createReview(@NonNull Review review) {
        return reviewRepository.save(Objects.requireNonNull(review, "review"));
    }

    /**
     * Cập nhật đánh giá
     */
    public Review updateReview(@NonNull Integer id, @NonNull Review reviewDetails) {
        Optional<Review> review = reviewRepository.findById(Objects.requireNonNull(id, "id"));
        if (review.isPresent()) {
            Review existingReview = review.get();
            if (reviewDetails.getRating() != null) {
                existingReview.setRating(reviewDetails.getRating());
            }
            if (reviewDetails.getContent() != null) {
                existingReview.setContent(reviewDetails.getContent());
            }
            if (reviewDetails.getReviewerName() != null) {
                existingReview.setReviewerName(reviewDetails.getReviewerName());
            }
            return reviewRepository.save(Objects.requireNonNull(existingReview, "existingReview"));
        }
        return null;
    }

    /**
     * Xoá đánh giá
     */
    public void deleteReview(@NonNull Integer id) {
        reviewRepository.deleteById(Objects.requireNonNull(id, "id"));
    }

    /**
     * Đếm số đánh giá của sản phẩm
     */
    public long countReviewsByProduct(Integer productId) {
        return reviewRepository.countByProductId(productId);
    }

    /**
     * Tính rating trung bình của sản phẩm
     */
    public Double getAverageRating(Integer productId) {
        return reviewRepository.findByProductId(productId)
                .stream()
                .mapToDouble(r -> r.getRating().doubleValue())
                .average()
                .orElse(0.0);
    }
}
