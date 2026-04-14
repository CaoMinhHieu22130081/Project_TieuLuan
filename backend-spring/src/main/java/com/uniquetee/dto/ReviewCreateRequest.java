package com.uniquetee.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReviewCreateRequest {

    @NotNull(message = "Vui lòng chọn sản phẩm cần đánh giá")
    private Integer productId;

    @NotNull(message = "Vui lòng chọn số sao đánh giá")
    @Min(value = 1, message = "Số sao phải nằm trong khoảng từ 1 đến 5")
    @Max(value = 5, message = "Số sao phải nằm trong khoảng từ 1 đến 5")
    private Integer rating;

    @Size(max = 100, message = "Tên hiển thị không được vượt quá 100 ký tự")
    private String reviewerName;

    @Size(max = 2000, message = "Nội dung đánh giá không được vượt quá 2000 ký tự")
    private String content;

    public Integer getProductId() {
        return productId;
    }

    public void setProductId(Integer productId) {
        this.productId = productId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}