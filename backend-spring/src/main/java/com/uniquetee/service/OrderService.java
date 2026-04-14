package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;
import com.uniquetee.entity.User;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;
import com.uniquetee.repository.UserRepository;

@Service
public class OrderService {

    private static final Set<String> SUPPORTED_PAYMENT_METHODS = Set.of("cod", "vnpay", "momo", "card");

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    public Optional<Order> getOrderById(Integer id) {
        return orderRepository.findById(Objects.requireNonNull(id, "id"));
    }

    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(Objects.requireNonNull(orderCode, "orderCode"));
    }

    public List<Order> getOrdersByUser(Integer userId) {
        return orderRepository.findByUserId(userId);
    }

    @Transactional
    public Order createOrder(Order order) {
        order.setPaymentMethod(resolvePaymentMethod(order.getPaymentMethod()));
        order.setStatus(resolveInitialStatus(order.getStatus()));

        // compute subtotal from items if not provided
        List<OrderItem> items = order.getItems();
        if (items == null) {
            items = new ArrayList<>();
            order.setItems(items);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : items) {
            if (item == null) {
                continue;
            }

            // if unitPrice missing, try to fetch product price
            Integer pid = item.getProductId();
            if (item.getUnitPrice() == null && pid != null) {
                productRepository.findById(pid).ifPresent(p -> item.setUnitPrice(p.getPrice()));
            }
            if (item.getUnitPrice() != null) {
                BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQty()));
                item.setSubtotal(line);
                subtotal = subtotal.add(line);
            }
            item.setOrder(order);
        }
        order.setSubtotal(subtotal);
        if (order.getShippingFee() == null) order.setShippingFee(BigDecimal.ZERO);
        order.setTotal(order.getSubtotal().add(order.getShippingFee()));

        // link user if provided
        if (order.getUser() != null) {
            Integer uid = order.getUser().getId();
            if (uid != null) {
                Optional<User> u = userRepository.findById(uid);
                u.ifPresent(order::setUser);
            }
        }

        Order savedOrder = orderRepository.save(order);
        syncProductSoldCounts(savedOrder, null, normalizeStatus(savedOrder.getStatus()));
        return savedOrder;
    }

    @Transactional
    public Order updateOrderStatus(Integer id, String status) {
        Optional<Order> o = orderRepository.findById(Objects.requireNonNull(id, "id"));
        if (o.isPresent()) {
            Order order = o.get();
            String previousStatus = normalizeStatus(order.getStatus());
            String nextStatus = normalizeStatus(status);
            order.setStatus(nextStatus);
            Order updatedOrder = orderRepository.save(order);
            syncProductSoldCounts(updatedOrder, previousStatus, nextStatus);
            return updatedOrder;
        }
        return null;
    }

    private String resolvePaymentMethod(String paymentMethod) {
        String normalizedPaymentMethod = normalizeValue(paymentMethod);
        if (normalizedPaymentMethod == null || normalizedPaymentMethod.isBlank()) {
            return "cod";
        }

        if (SUPPORTED_PAYMENT_METHODS.contains(normalizedPaymentMethod)) {
            return normalizedPaymentMethod;
        }

        return "cod";
    }

    private String resolveInitialStatus(String status) {
        String normalizedStatus = normalizeValue(status);
        if (normalizedStatus == null || normalizedStatus.isBlank()) {
            return "pending";
        }

        return normalizedStatus;
    }

    private void syncProductSoldCounts(Order order, String previousStatus, String nextStatus) {
        boolean wasDelivered = isDelivered(previousStatus);
        boolean isDelivered = isDelivered(nextStatus);

        if (wasDelivered == isDelivered) {
            return;
        }

        int multiplier = isDelivered ? 1 : -1;
        adjustSoldCounts(order, multiplier);
    }

    private void adjustSoldCounts(Order order, int multiplier) {
        if (order == null || order.getItems() == null || order.getItems().isEmpty()) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            Integer productId = item.getProductId();
            if (productId == null) {
                continue;
            }

            Integer quantityValue = item.getQty();
            int quantity = quantityValue == null ? 1 : quantityValue;
            productRepository.findById(productId).ifPresent(product -> {
                Integer currentSoldValue = product.getSold();
                int currentSold = currentSoldValue == null ? 0 : currentSoldValue;
                int updatedSold = currentSold + (multiplier * quantity);
                product.setSold(Math.max(0, updatedSold));
                productRepository.save(product);
            });
        }
    }

    private String normalizeValue(String value) {
        return value == null ? null : value.trim().toLowerCase();
    }

    private String normalizeStatus(String status) {
        return normalizeValue(status);
    }

    private boolean isDelivered(String status) {
        return status != null && "delivered".equalsIgnoreCase(status.trim());
    }
}
