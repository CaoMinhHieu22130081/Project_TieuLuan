package com.uniquetee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.ProductSize;

@Repository
public interface ProductSizeRepository extends JpaRepository<ProductSize, Integer> {
    // Tìm tất cả kích cỡ của một sản phẩm
    List<ProductSize> findByProductId(Integer productId);

    // Xoá tất cả kích cỡ theo sản phẩm
    void deleteByProductId(Integer productId);

    // Tìm kích cỡ có sẵn
    List<ProductSize> findByProductIdAndIsAvailableTrue(Integer productId);
}
