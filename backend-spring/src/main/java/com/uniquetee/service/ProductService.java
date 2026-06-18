package com.uniquetee.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.uniquetee.entity.Category;
import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;
import com.uniquetee.entity.Product;
import com.uniquetee.entity.ProductColor;
import com.uniquetee.entity.ProductImage;
import com.uniquetee.entity.ProductSize;
import com.uniquetee.entity.Review;
import com.uniquetee.repository.CategoryRepository;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;
import com.uniquetee.repository.ReviewRepository;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OrderRepository orderRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::syncProductStatistics)
                .collect(Collectors.toList());
    }

    public Optional<Product> getProductById(int id) {
        return productRepository.findById(id).map(this::syncProductStatistics);
    }

    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategoryName(category).stream()
                .map(this::syncProductStatistics)
                .collect(Collectors.toList());
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::syncProductStatistics)
                .collect(Collectors.toList());
    }

    public List<Product> getRelatedProducts(int productId, int limit) {
        Product current = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại"));

        int safeLimit = Math.max(4, Math.min(limit, 12));

        Integer categoryId = current.getCategory() != null ? current.getCategory().getId() : null;
        String type = StringUtils.hasText(current.getType()) ? current.getType().trim() : null;

        List<Product> candidates = new java.util.ArrayList<>(
            productRepository.findRecommendationCandidates(productId, categoryId, type)
        );

        if (candidates.size() < safeLimit) {
            List<Product> fallback = productRepository.findActiveExcept(productId);
            for (Product item : fallback) {
                if (candidates.stream().noneMatch(p -> java.util.Objects.equals(p.getId(), item.getId()))) {
                    candidates.add(item);
                }
            }
        }

        return candidates.stream()
                .map(this::syncProductStatistics)
                .sorted(java.util.Comparator.comparingDouble((Product p) -> recommendationScore(current, p)).reversed())
                .limit(safeLimit)
                .collect(Collectors.toList());
    }

    public List<Product> getBestSellers(int limit) {
        int safeLimit = Math.max(4, Math.min(limit, 24));
        return productRepository.findByIsActiveTrueOrderBySoldDesc(org.springframework.data.domain.PageRequest.of(0, safeLimit))
                .stream()
                .map(this::syncProductStatistics)
                .collect(Collectors.toList());
    }

    public List<Product> getNewArrivals(int limit) {
        int safeLimit = Math.max(4, Math.min(limit, 24));
        return productRepository.findByIsActiveTrueOrderByIdDesc(org.springframework.data.domain.PageRequest.of(0, safeLimit))
                .stream()
                .map(this::syncProductStatistics)
                .collect(Collectors.toList());
    }

    public List<Product> getRecommendedProductsForUser(Integer userId, int limit) {
        if (userId == null) {
            return getBestSellers(limit);
        }

        List<Order> orders = orderRepository.findByUserId(userId);
        if (orders == null || orders.isEmpty()) {
            return getBestSellers(limit);
        }

        Order latestOrder = orders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .max(java.util.Comparator.comparing(Order::getCreatedAt))
                .orElse(null);

        if (latestOrder == null || latestOrder.getItems() == null || latestOrder.getItems().isEmpty()) {
            return getBestSellers(limit);
        }

        Integer pid = latestOrder.getItems().get(0).getProductId();
        if (pid == null) {
            return getBestSellers(limit);
        }
        
        return getRelatedProducts(pid, limit);
    }

    private double recommendationScore(Product current, Product candidate) {
        double score = 0;

        if (sameCategory(current, candidate)) {
            score += 45;
        }

        if (sameText(current.getType(), candidate.getType())) {
            score += 25;
        }

        if (sameText(current.getMaterial(), candidate.getMaterial())) {
            score += 12;
        }

        if (sameText(current.getTag(), candidate.getTag())) {
            score += 8;
        }

        if (candidate.getRating() != null) {
            score += candidate.getRating().doubleValue() * 4;
        }

        score += Math.log1p(candidate.getSold() == null ? 0 : candidate.getSold()) * 6;
        score += Math.log1p(candidate.getReviewCount() == null ? 0 : candidate.getReviewCount()) * 3;

        if (current.getPrice() != null && candidate.getPrice() != null) {
            double currentPrice = current.getPrice().doubleValue();
            double candidatePrice = candidate.getPrice().doubleValue();

            if (currentPrice > 0) {
                double priceDiffRate = Math.abs(currentPrice - candidatePrice) / currentPrice;
                score += Math.max(0, 15 - priceDiffRate * 30);
            }
        }

        return score;
    }

    private boolean sameCategory(Product left, Product right) {
        if (left.getCategory() == null || right.getCategory() == null) {
            return false;
        }

        return java.util.Objects.equals(left.getCategory().getId(), right.getCategory().getId());
    }

    private boolean sameText(String left, String right) {
        return StringUtils.hasText(left)
                && StringUtils.hasText(right)
                && left.trim().equalsIgnoreCase(right.trim());
    }

    @Transactional
    public Product createProduct(Product product) {
        validateProduct(product);
        product.setCategory(resolveCategory(product.getCategory(), product.getType()));
        syncProductRelations(product, product);
        return syncProductStatistics(productRepository.save(product));
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

        return syncProductStatistics(productRepository.save(existingProduct));
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

    private Product syncProductStatistics(Product product) {
        if (product == null || product.getId() == null) {
            return product;
        }

        Integer productId = product.getId();
        List<Review> reviews = reviewRepository.findByProductId(productId);
        int reviewCount = reviews.size();
        double averageRating = reviews.stream()
                .map(Review::getRating)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);
        BigDecimal rating = BigDecimal.valueOf(averageRating).setScale(2, RoundingMode.HALF_UP);
        int soldCount = calculateSoldCount(productId);

        boolean changed = false;
        if (!java.util.Objects.equals(product.getReviewCount(), reviewCount)) {
            product.setReviewCount(reviewCount);
            changed = true;
        }

        if (product.getRating() == null || product.getRating().compareTo(rating) != 0) {
            product.setRating(rating);
            changed = true;
        }

        if (!java.util.Objects.equals(product.getSold(), soldCount)) {
            product.setSold(soldCount);
            changed = true;
        }

        if (changed) {
            return productRepository.save(product);
        }

        return product;
    }

    private int calculateSoldCount(Integer productId) {
        if (productId == null) {
            return 0;
        }

        List<Order> orders = orderRepository.findByProductId(productId);
        int soldCount = 0;

        for (Order order : orders) {
            if (!isCountedAsSold(order)) {
                continue;
            }

            List<OrderItem> items = order.getItems();
            if (items == null || items.isEmpty()) {
                continue;
            }

            for (OrderItem item : items) {
                if (item == null || !productId.equals(item.getProductId())) {
                    continue;
                }

                Integer quantityValue = item.getQty();
                soldCount += quantityValue == null ? 1 : quantityValue;
            }
        }

        return soldCount;
    }

    private boolean isCountedAsSold(Order order) {
        if (order == null || isCancelled(order.getStatus())) {
            return false;
        }

        String paymentMethod = normalizeValue(order.getPaymentMethod());
        String status = normalizeValue(order.getStatus());

        if ("cod".equals(paymentMethod)) {
            return true;
        }

        return status != null && !"pending".equals(status);
    }

    private boolean isCancelled(String status) {
        return status != null && "cancelled".equalsIgnoreCase(status.trim());
    }

    private String normalizeValue(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }
}
