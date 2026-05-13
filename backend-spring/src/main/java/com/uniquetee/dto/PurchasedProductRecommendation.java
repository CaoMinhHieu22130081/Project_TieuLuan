package com.uniquetee.dto;

import java.time.LocalDateTime;

import com.uniquetee.entity.Product;

public class PurchasedProductRecommendation {

    private Product product;
    private Integer totalQty;
    private LocalDateTime lastPurchasedAt;

    public PurchasedProductRecommendation() {
    }

    public PurchasedProductRecommendation(Product product, Integer totalQty, LocalDateTime lastPurchasedAt) {
        this.product = product;
        this.totalQty = totalQty;
        this.lastPurchasedAt = lastPurchasedAt;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Integer getTotalQty() {
        return totalQty;
    }

    public void setTotalQty(Integer totalQty) {
        this.totalQty = totalQty;
    }

    public LocalDateTime getLastPurchasedAt() {
        return lastPurchasedAt;
    }

    public void setLastPurchasedAt(LocalDateTime lastPurchasedAt) {
        this.lastPurchasedAt = lastPurchasedAt;
    }
}
