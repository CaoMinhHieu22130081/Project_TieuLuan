package com.uniquetee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.ProductColor;

@Repository
public interface ProductColorRepository extends JpaRepository<ProductColor, Integer> {
    // Tìm tất cả màu sắc của một sản phẩm
    List<ProductColor> findByProductId(Integer productId);

    // Xoá tất cả màu sắc theo sản phẩm
    void deleteByProductId(Integer productId);
}
