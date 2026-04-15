package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;
import com.uniquetee.entity.Product;
import com.uniquetee.entity.Review;
import com.uniquetee.repository.CategoryRepository;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;
import com.uniquetee.repository.ReviewRepository;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void getProductById_syncsRatingReviewCountAndSoldFromDatabase() {
        Product product = new Product();
        product.setId(1);
        product.setRating(new BigDecimal("5.00"));
        product.setReviewCount(0);
        product.setSold(0);

        Review firstReview = new Review();
        firstReview.setRating(4);
        Review secondReview = new Review();
        secondReview.setRating(5);

        Order codOrder = new Order();
        codOrder.setPaymentMethod("cod");
        codOrder.setStatus("pending");
        OrderItem codItem = new OrderItem();
        codItem.setProductId(1);
        codItem.setQty(2);
        codOrder.setItems(List.of(codItem));

        Order onlineOrder = new Order();
        onlineOrder.setPaymentMethod("vnpay");
        onlineOrder.setStatus("processing");
        OrderItem onlineItem = new OrderItem();
        onlineItem.setProductId(1);
        onlineItem.setQty(3);
        onlineOrder.setItems(List.of(onlineItem));

        when(productRepository.findById(1)).thenReturn(Optional.of(product));
        when(reviewRepository.findByProductId(1)).thenReturn(List.of(firstReview, secondReview));
        when(orderRepository.findByProductId(1)).thenReturn(List.of(codOrder, onlineOrder));
        when(productRepository.save(product)).thenReturn(product);

        Optional<Product> result = productService.getProductById(1);

        assertEquals(true, result.isPresent());
        assertSame(product, result.orElseThrow());
        assertEquals(2, product.getReviewCount());
        assertEquals(new BigDecimal("4.50"), product.getRating());
        assertEquals(5, product.getSold());
        verify(productRepository).save(product);
    }
}