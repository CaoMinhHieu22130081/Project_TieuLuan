package com.uniquetee.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import com.uniquetee.entity.Order;
import com.uniquetee.entity.Product;
import com.uniquetee.entity.Review;
import com.uniquetee.entity.User;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;
import com.uniquetee.repository.ReviewRepository;
import com.uniquetee.repository.UserRepository;

/**
 * Service quản lý Đánh giá sản phẩm
 */
@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ReviewSentimentAnalyzer reviewSentimentAnalyzer;

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
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
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
    @Transactional
    public Review createReview(Integer productId, Integer rating, String reviewerName, String content, Integer authenticatedUserId) {
        Integer userId = Objects.requireNonNull(authenticatedUserId, "authenticatedUserId");

        Integer safeProductId = Objects.requireNonNull(productId, "productId");

        if (reviewRepository.existsByUserIdAndProductId(userId, safeProductId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bạn đã đánh giá sản phẩm này rồi");
        }

        if (!hasDeliveredOrderContainingProduct(userId, safeProductId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ có thể đánh giá sau khi đơn hàng đã được giao");
        }

        Product product = productRepository.findById(safeProductId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));

        int normalizedRating = validateAndNormalizeRating(rating);
        String normalizedContent = normalizeContent(content);
        validateReviewTone(normalizedRating, normalizedContent);

        Review newReview = new Review();
        newReview.setProduct(product);
        newReview.setUser(user);
        newReview.setReviewerName(StringUtils.hasText(reviewerName)
                ? reviewerName.trim()
                : user.getName());
        newReview.setRating(normalizedRating);
        newReview.setContent(normalizedContent);
        newReview.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(newReview);
        refreshProductReviewStats(safeProductId);
        return savedReview;
    }

    /**
     * Cập nhật đánh giá
     */
    @Transactional
    public Review updateReview(@NonNull Integer id, @NonNull Review reviewDetails) {
        Optional<Review> review = reviewRepository.findById(Objects.requireNonNull(id, "id"));
        if (review.isPresent()) {
            Review existingReview = review.get();
            Integer updatedRating = existingReview.getRating();
            if (updatedRating == null) {
                updatedRating = 0;
            }
            String updatedContent = existingReview.getContent();

            if (reviewDetails.getRating() != null) {
                updatedRating = validateAndNormalizeRating(reviewDetails.getRating());
            }
            if (reviewDetails.getContent() != null) {
                updatedContent = normalizeContent(reviewDetails.getContent());
            }
            if (reviewDetails.getReviewerName() != null) {
                existingReview.setReviewerName(reviewDetails.getReviewerName().trim());
            }
            if (reviewDetails.getAdminReply() != null) {
                existingReview.setAdminReply(reviewDetails.getAdminReply().trim());
            }

            validateReviewTone(updatedRating, updatedContent);
            existingReview.setRating(updatedRating);
            existingReview.setContent(updatedContent);

            Review savedReview = reviewRepository.save(Objects.requireNonNull(existingReview, "existingReview"));
            if (savedReview.getProduct() != null && savedReview.getProduct().getId() != null) {
                refreshProductReviewStats(savedReview.getProduct().getId());
            }
            return savedReview;
        }
        return null;
    }

    /**
     * Xoá đánh giá
     */
    @Transactional
    public void deleteReview(@NonNull Integer id) {
        Review review = reviewRepository.findById(Objects.requireNonNull(id, "id"))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Đánh giá không tồn tại"));
        Integer productId = review.getProduct() != null ? review.getProduct().getId() : null;
        reviewRepository.delete(review);
        if (productId != null) {
            refreshProductReviewStats(productId);
        }
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
                .mapToDouble(r -> r.getRating() == null ? 0.0 : r.getRating().doubleValue())
                .average()
                .orElse(0.0);
    }

    private boolean hasDeliveredOrderContainingProduct(Integer userId, Integer productId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        if (orders == null || orders.isEmpty()) {
            return false;
        }

        return orders.stream()
                .filter(order -> order.getStatus() != null && "delivered".equalsIgnoreCase(order.getStatus().trim()))
                .filter(order -> order.getItems() != null && !order.getItems().isEmpty())
                .anyMatch(order -> order.getItems().stream()
                        .anyMatch(item -> productId.equals(item.getProductId())));
    }

    private int validateAndNormalizeRating(Integer rating) {
        if (rating == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn số sao đánh giá");
        }

        int normalizedRating = rating;
        if (normalizedRating < 1 || normalizedRating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số sao phải nằm trong khoảng từ 1 đến 5");
        }

        return normalizedRating;
    }

    private String normalizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập nội dung đánh giá");
        }

        return content.trim();
    }

    private void validateReviewTone(Integer rating, String content) {
        if (!reviewSentimentAnalyzer.isToneAlignedWithRating(rating, content)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung đánh giá chưa khớp với số sao đã chọn");
        }
    }

    private void refreshProductReviewStats(Integer productId) {
        Integer safeProductId = Objects.requireNonNull(productId, "productId");

        List<Review> productReviews = reviewRepository.findByProductId(safeProductId);
        int reviewCount = productReviews.size();
        double averageRating = productReviews.stream()
                .map(Review::getRating)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        Product product = productRepository.findById(safeProductId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
        product.setReviewCount(reviewCount);
        product.setRating(BigDecimal.valueOf(averageRating).setScale(2, RoundingMode.HALF_UP));
        productRepository.save(product);
    }
}