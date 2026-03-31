package com.uniquetee.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.Category;
import com.uniquetee.repository.CategoryRepository;

/**
 * Service quản lý Danh mục sản phẩm
 */
@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Lấy tất cả danh mục
     */
    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrder();
    }

    /**
     * Lấy danh mục theo ID
     */
    public Optional<Category> getCategoryById(Integer id) {
        return categoryRepository.findById(id);
    }

    /**
     * Lấy danh mục theo tên
     */
    public Optional<Category> getCategoryByName(String name) {
        return categoryRepository.findByName(name);
    }

    /**
     * Lấy danh mục theo loại (Áo, Quần)
     */
    public List<Category> getCategoriesByType(String type) {
        return categoryRepository.findByType(type);
    }

    /**
     * Tạo danh mục mới
     */
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    /**
     * Cập nhật danh mục
     */
    public Category updateCategory(Integer id, Category categoryDetails) {
        Optional<Category> category = categoryRepository.findById(id);
        if (category.isPresent()) {
            Category existingCategory = category.get();
            if (categoryDetails.getName() != null) {
                existingCategory.setName(categoryDetails.getName());
            }
            if (categoryDetails.getType() != null) {
                existingCategory.setType(categoryDetails.getType());
            }
            if (categoryDetails.getSortOrder() != null) {
                existingCategory.setSortOrder(categoryDetails.getSortOrder());
            }
            return categoryRepository.save(existingCategory);
        }
        return null;
    }

    /**
     * Xoá danh mục
     */
    public void deleteCategory(Integer id) {
        categoryRepository.deleteById(id);
    }

    /**
     * Kiểm tra danh mục có tồn tại không
     */
    public boolean categoryExists(Integer id) {
        return categoryRepository.existsById(id);
    }

    /**
     * Đếm số danh mục
     */
    public long countCategories() {
        return categoryRepository.count();
    }
}
