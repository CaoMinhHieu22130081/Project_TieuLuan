package com.uniquetee.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.Product;
import com.uniquetee.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Integer id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryName(category);
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

    public Product createProduct(Product product) {
        java.util.Objects.requireNonNull(product);
        return productRepository.save(product);
    }

    public Product updateProduct(Integer id, Product productDetails) {
        Optional<Product> product = productRepository.findById(id);
        if (product.isPresent()) {
            Product existingProduct = product.get();
            if (productDetails.getName() != null) existingProduct.setName(productDetails.getName());
            if (productDetails.getDescription() != null) existingProduct.setDescription(productDetails.getDescription());
            if (productDetails.getPrice() != null) existingProduct.setPrice(productDetails.getPrice());
            if (productDetails.getOriginalPrice() != null) existingProduct.setOriginalPrice(productDetails.getOriginalPrice());
            if (productDetails.getTag() != null) existingProduct.setTag(productDetails.getTag());
            if (productDetails.getMaterial() != null) existingProduct.setMaterial(productDetails.getMaterial());
            if (productDetails.getType() != null) existingProduct.setType(productDetails.getType());
            if (productDetails.getIsActive() != null) existingProduct.setIsActive(productDetails.getIsActive());
            java.util.Objects.requireNonNull(existingProduct);
            return productRepository.save(existingProduct);
        }
        return null;
    }

    public boolean deleteProduct(Integer id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
