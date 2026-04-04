package com.uniquetee.controller;

import java.util.List;
import java.util.Optional;

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
import com.uniquetee.entity.Review;
import com.uniquetee.service.ReviewService;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = {"http://127.0.0.1:5173", "http://localhost:5173"})
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    /**
     * Lấy tất cả bình luận của một sản phẩm
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsByProductId(@PathVariable Integer productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(reviews);
    }

    /**
     * Lấy bình luận theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable Integer id) {
        Optional<Review> review = reviewService.getReviewById(id);
        return review.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Tạo bình luận mới
     */
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        Review createdReview = reviewService.createReview(review);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdReview);
    }

    /**
     * Cập nhật bình luận
     */
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(@PathVariable Integer id, @RequestBody Review reviewDetails) {
        Review updatedReview = reviewService.updateReview(id, reviewDetails);
        if (updatedReview != null) {
            return ResponseEntity.ok(updatedReview);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Xóa bình luận
     */
    @DeleteMapping("/{id}")
    @RequiredRole({"admin"})
    public ResponseEntity<Void> deleteReview(@PathVariable Integer id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lấy top bình luận (sắp xếp theo rating cao nhất)
     */
    @GetMapping("/product/{productId}/top")
    public ResponseEntity<List<Review>> getTopRatedReviews(@PathVariable Integer productId) {
        List<Review> reviews = reviewService.getTopRatedReviews(productId);
        return ResponseEntity.ok(reviews);
    }

}
