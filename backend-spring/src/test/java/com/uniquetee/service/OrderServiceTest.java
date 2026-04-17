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

    private final CapturingEmailService emailService = new CapturingEmailService();

    @InjectMocks
    private OrderService orderService;

    private void injectEmailService() {
        emailService.reset();
        try {
            java.lang.reflect.Field emailServiceField = OrderService.class.getDeclaredField("emailService");
            emailServiceField.setAccessible(true);
            emailServiceField.set(orderService, emailService);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("Không thể gán emailService cho OrderService", ex);
        }
    }

    @Test
    void createOrder_normalizesCodPaymentMethodAndSetsPendingStatus() {
        injectEmailService();

        Order order = new Order();
        order.setPaymentMethod("  COD  ");
        order.setStatus("  ");
        order.setCustomerName("Nguyen Van A");
        order.setCustomerEmail("customer@example.com");
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
        assertEquals(1, emailService.getSendCount());
        assertEquals("customer@example.com", emailService.getLastRecipientEmail());
        assertEquals("Nguyen Van A", emailService.getLastCustomerName());
        assertSame(order, emailService.getLastOrder());
    }

    @Test
    void getOrderByCode_returnsRepositoryMatch() {
        injectEmailService();

        Order order = new Order();
        order.setOrderCode("UNQ-ABC-1234");

        when(orderRepository.findByOrderCode("UNQ-ABC-1234")).thenReturn(Optional.of(order));

        Optional<Order> foundOrder = orderService.getOrderByCode("UNQ-ABC-1234");

        assertEquals(Optional.of(order), foundOrder);
    }

    @Test
    void createOrder_countsCodSalesImmediately() {
        injectEmailService();

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

    @Test
    void confirmPaymentSuccess_updatesStatusAndSendsEmail() {
        injectEmailService();

        Order order = new Order();
        order.setId(1);
        order.setOrderCode("UNQ-VNPAY-1234");
        order.setPaymentMethod("vnpay");
        order.setStatus("pending");
        order.setCustomerName("Nguyen Van B");
        order.setCustomerEmail("vnpay.customer@example.com");

        when(orderRepository.findById(1)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        Order updatedOrder = orderService.confirmPaymentSuccess(1);

        assertSame(order, updatedOrder);
        assertEquals("processing", updatedOrder.getStatus());
        assertEquals(1, emailService.getSendCount());
        assertEquals("vnpay.customer@example.com", emailService.getLastRecipientEmail());
        assertEquals("Nguyen Van B", emailService.getLastCustomerName());
        assertSame(order, emailService.getLastOrder());
    }

    private static final class CapturingEmailService extends EmailService {

        private String lastRecipientEmail;
        private String lastCustomerName;
        private Order lastOrder;
        private int sendCount;

        @Override
        public void sendOrderConfirmationEmail(String email, String customerName, Order order) {
            this.lastRecipientEmail = email;
            this.lastCustomerName = customerName;
            this.lastOrder = order;
            this.sendCount++;
        }

        void reset() {
            this.lastRecipientEmail = null;
            this.lastCustomerName = null;
            this.lastOrder = null;
            this.sendCount = 0;
        }

        String getLastRecipientEmail() {
            return lastRecipientEmail;
        }

        String getLastCustomerName() {
            return lastCustomerName;
        }

        Order getLastOrder() {
            return lastOrder;
        }

        int getSendCount() {
            return sendCount;
        }
    }
}