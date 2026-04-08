package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.uniquetee.entity.Category;
import com.uniquetee.entity.Product;
import com.uniquetee.entity.ProductColor;
import com.uniquetee.entity.ProductImage;
import com.uniquetee.entity.ProductSize;
import com.uniquetee.repository.CategoryRepository;
import com.uniquetee.repository.ProductRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(int id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryName(category);
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword);
    }

    @Transactional
    public Product createProduct(Product product) {
        validateProduct(product);
        product.setCategory(resolveCategory(product.getCategory(), product.getType()));
        syncProductRelations(product, product);
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(int id, Product productDetails) {
        Optional<Product> product = productRepository.findById(id);
        if (product.isEmpty()) {
            return null;
        }

        validateProduct(productDetails);

        Product existingProduct = product.get();
        existingProduct.setSku(productDetails.getSku());
        existingProduct.setName(productDetails.getName());
        existingProduct.setType(productDetails.getType());
        existingProduct.setCategory(resolveCategory(productDetails.getCategory(), productDetails.getType()));
        existingProduct.setPrice(productDetails.getPrice());
        existingProduct.setOriginalPrice(productDetails.getOriginalPrice());
        existingProduct.setTag(productDetails.getTag());
        existingProduct.setMaterial(productDetails.getMaterial());
        existingProduct.setDescription(productDetails.getDescription());
        syncProductRelations(existingProduct, productDetails);
        if (productDetails.getIsActive() != null) {
            existingProduct.setIsActive(productDetails.getIsActive());
        }

        return productRepository.save(existingProduct);
    }

    public boolean deleteProduct(int id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return true;
        }
        return false;
    }

    private void validateProduct(Product product) {
        if (product == null) {
            throw new IllegalArgumentException("Dữ liệu sản phẩm không hợp lệ");
        }
        if (!StringUtils.hasText(product.getSku())) {
            throw new IllegalArgumentException("SKU không được để trống");
        }
        if (!StringUtils.hasText(product.getName())) {
            throw new IllegalArgumentException("Tên sản phẩm không được để trống");
        }
        if (!StringUtils.hasText(product.getType())) {
            throw new IllegalArgumentException("Loại sản phẩm không được để trống");
        }
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giá bán phải lớn hơn 0");
        }
        if (product.getCategory() == null) {
            throw new IllegalArgumentException("Danh mục không được để trống");
        }
        if (product.getImages() == null || product.getImages().stream().noneMatch(image -> image != null && StringUtils.hasText(image.getUrl()))) {
            throw new IllegalArgumentException("Vui lòng thêm ít nhất 1 hình ảnh");
        }
    }

    private Category resolveCategory(Category requestedCategory, String productType) {
        if (requestedCategory == null) {
            throw new IllegalArgumentException("Danh mục không được để trống");
        }

        Category resolvedCategory = null;
        if (requestedCategory.getId() != null) {
            Integer categoryId = java.util.Objects.requireNonNull(requestedCategory.getId(), "Danh mục không hợp lệ");
            resolvedCategory = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại"));
        } else if (StringUtils.hasText(requestedCategory.getName())) {
            resolvedCategory = categoryRepository.findByName(requestedCategory.getName().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại"));
        }

        if (resolvedCategory == null) {
            throw new IllegalArgumentException("Danh mục không hợp lệ");
        }

        if (StringUtils.hasText(productType)
                && StringUtils.hasText(resolvedCategory.getType())
                && !resolvedCategory.getType().equalsIgnoreCase(productType.trim())) {
            throw new IllegalArgumentException("Danh mục không khớp với loại sản phẩm");
        }

        return resolvedCategory;
    }

    private void syncProductRelations(Product targetProduct, Product sourceProduct) {
        List<ProductImage> requestedImages = sourceProduct.getImages() == null ? null : new ArrayList<>(sourceProduct.getImages());
        List<ProductColor> requestedColors = sourceProduct.getColors() == null ? null : new ArrayList<>(sourceProduct.getColors());
        List<ProductSize> requestedSizes = sourceProduct.getSizes() == null ? null : new ArrayList<>(sourceProduct.getSizes());

        if (requestedImages != null) {
            targetProduct.getImages().clear();
            targetProduct.getImages().addAll(normalizeImages(requestedImages, targetProduct));
        }

        if (requestedColors != null) {
            targetProduct.getColors().clear();
            targetProduct.getColors().addAll(normalizeColors(requestedColors, targetProduct));
        }

        if (requestedSizes != null) {
            targetProduct.getSizes().clear();
            targetProduct.getSizes().addAll(normalizeSizes(requestedSizes, targetProduct));
        }
    }

    private List<ProductImage> normalizeImages(List<ProductImage> requestedImages, Product product) {
        List<ProductImage> normalizedImages = new ArrayList<>();
        if (requestedImages == null) {
            return normalizedImages;
        }

        int sortOrder = 0;
        for (ProductImage requestedImage : requestedImages) {
            if (requestedImage == null || !StringUtils.hasText(requestedImage.getUrl())) {
                continue;
            }

            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setUrl(requestedImage.getUrl().trim());
                image.setSortOrder(sortOrder);
            normalizedImages.add(image);
            sortOrder++;
        }

        return normalizedImages;
    }

    private List<ProductColor> normalizeColors(List<ProductColor> requestedColors, Product product) {
        List<ProductColor> normalizedColors = new ArrayList<>();
        if (requestedColors == null) {
            return normalizedColors;
        }

        for (ProductColor requestedColor : requestedColors) {
            if (requestedColor == null) {
                continue;
            }

            String colorName = requestedColor.getName();
            String colorHex = requestedColor.getHex();
            if (!StringUtils.hasText(colorName) && !StringUtils.hasText(colorHex)) {
                continue;
            }

            ProductColor color = new ProductColor();
            color.setProduct(product);
            color.setName(StringUtils.hasText(colorName) ? colorName.trim() : "Màu") ;
            color.setHex(StringUtils.hasText(colorHex) ? colorHex.trim() : "#1a1a1a");
            normalizedColors.add(color);
        }

        return normalizedColors;
    }

    private List<ProductSize> normalizeSizes(List<ProductSize> requestedSizes, Product product) {
        List<ProductSize> normalizedSizes = new ArrayList<>();
        if (requestedSizes == null) {
            return normalizedSizes;
        }

        for (ProductSize requestedSize : requestedSizes) {
            if (requestedSize == null || !StringUtils.hasText(requestedSize.getSize())) {
                continue;
            }

            ProductSize size = new ProductSize();
            size.setProduct(product);
            size.setSize(requestedSize.getSize().trim());
            size.setIsAvailable(requestedSize.getIsAvailable() == null || requestedSize.getIsAvailable());
            normalizedSizes.add(size);
        }

        return normalizedSizes;
    }
}
