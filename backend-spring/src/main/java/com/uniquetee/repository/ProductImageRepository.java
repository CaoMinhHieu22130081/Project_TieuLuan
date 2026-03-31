package com.uniquetee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.ProductImage;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    // Tìm tất cả hình ảnh của một sản phẩm
    List<ProductImage> findByProductIdOrderBySortOrder(Integer productId);

    // Xoá tất cả hình ảnh theo sản phẩm
    void deleteByProductId(Integer productId);
}
