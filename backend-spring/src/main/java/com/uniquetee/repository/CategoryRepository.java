package com.uniquetee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
    // Tìm danh mục theo tên
    Optional<Category> findByName(String name);

    // Tìm danh mục theo loại (Áo, Quần)
    List<Category> findByType(String type);

    // Tìm tất cả danh mục sắp xếp theo thứ tự
    List<Category> findAllByOrderBySortOrder();
}

