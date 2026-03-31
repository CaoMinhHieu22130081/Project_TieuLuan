package com.uniquetee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.ProductFeature;

@Repository
public interface ProductFeatureRepository extends JpaRepository<ProductFeature, Integer> {
    // Tìm tất cả tính năng của một sản phẩm
    List<ProductFeature> findByProductIdOrderBySortOrder(Integer productId);

    // Xoá tất cả tính năng theo sản phẩm
    void deleteByProductId(Integer productId);
}
