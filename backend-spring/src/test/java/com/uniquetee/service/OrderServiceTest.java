package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;
import com.uniquetee.entity.Product;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_normalizesCodPaymentMethodAndSetsPendingStatus() {
        Order order = new Order();
        order.setPaymentMethod("  COD  ");
        order.setStatus("  ");
        order.setShippingFee(new BigDecimal("30000"));

        OrderItem item = new OrderItem();
        item.setQty(2);
        item.setUnitPrice(new BigDecimal("50000"));
        order.setItems(new ArrayList<>(java.util.List.of(item)));

        when(orderRepository.save(order)).thenReturn(order);

        Order savedOrder = orderService.createOrder(order);

        assertSame(order, savedOrder);
        assertEquals("cod", savedOrder.getPaymentMethod());
        assertEquals("pending", savedOrder.getStatus());
        assertEquals(new BigDecimal("100000"), savedOrder.getSubtotal());
        assertEquals(new BigDecimal("130000"), savedOrder.getTotal());
        assertSame(savedOrder, item.getOrder());
    }

    @Test
    void getOrderByCode_returnsRepositoryMatch() {
        Order order = new Order();
        order.setOrderCode("UNQ-ABC-1234");

        when(orderRepository.findByOrderCode("UNQ-ABC-1234")).thenReturn(Optional.of(order));

        Optional<Order> foundOrder = orderService.getOrderByCode("UNQ-ABC-1234");

        assertEquals(Optional.of(order), foundOrder);
    }

    @Test
    void createOrder_countsCodSalesImmediately() {
        Product product = new Product();
        product.setId(11);
        product.setPrice(new BigDecimal("50000"));
        product.setSold(4);

        Order order = new Order();
        order.setPaymentMethod("cod");
        order.setStatus("pending");

        OrderItem item = new OrderItem();
        item.setProductId(11);
        item.setQty(2);
        order.setItems(new ArrayList<>(java.util.List.of(item)));

        when(productRepository.findById(11)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        when(orderRepository.save(order)).thenReturn(order);

        Order savedOrder = orderService.createOrder(order);

        assertSame(order, savedOrder);
        assertEquals(new BigDecimal("100000"), savedOrder.getSubtotal());
        assertEquals(6, product.getSold());
    }
}