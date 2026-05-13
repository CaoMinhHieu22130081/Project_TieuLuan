package com.uniquetee.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.uniquetee.dto.PurchasedProductRecommendation;
import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;
import com.uniquetee.entity.Product;
import com.uniquetee.entity.User;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;
import com.uniquetee.repository.UserRepository;

@Service
public class OrderService {

    private static final Set<String> SUPPORTED_PAYMENT_METHODS = Set.of("cod", "vnpay", "momo", "card");
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;
    
    @Autowired
    private AdminNotificationService adminNotificationService;

    public Optional<Order> getOrderById(Integer id) {
        return orderRepository.findById(Objects.requireNonNull(id, "id"));
    }

    public Optional<Order> getOrderByCode(String orderCode) {
        return orderRepository.findByOrderCode(Objects.requireNonNull(orderCode, "orderCode"));
    }

    public List<Order> getOrdersByUser(Integer userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<PurchasedProductRecommendation> getPurchasedProductRecommendations(Integer userId, int limit) {
        if (userId == null) {
            return List.of();
        }

        int safeLimit = limit <= 0 ? 8 : Math.min(limit, 24);
        List<Order> orders = orderRepository.findByUserId(userId);
        if (orders == null || orders.isEmpty()) {
            return List.of();
        }

        Map<Integer, PurchaseStats> purchaseStats = new HashMap<>();
        for (Order order : orders) {
            if (order == null) {
                continue;
            }

            String status = normalizeStatus(order.getStatus());
            if (isCancelled(status)) {
                continue;
            }

            LocalDateTime purchasedAt = order.getCreatedAt();
            List<OrderItem> items = order.getItems();
            if (items == null || items.isEmpty()) {
                continue;
            }

            for (OrderItem item : items) {
                if (item == null) {
                    continue;
                }

                Integer productId = item.getProductId();
                if (productId == null) {
                    continue;
                }

                int qty = item.getQty() == null || item.getQty() <= 0 ? 1 : item.getQty();
                PurchaseStats stats = purchaseStats.computeIfAbsent(productId, key -> new PurchaseStats());
                stats.totalQty += qty;
                if (purchasedAt != null && (stats.lastPurchasedAt == null || purchasedAt.isAfter(stats.lastPurchasedAt))) {
                    stats.lastPurchasedAt = purchasedAt;
                }
            }
        }

        if (purchaseStats.isEmpty()) {
            return List.of();
        }

        Map<Integer, Product> productById = productRepository.findAllById(purchaseStats.keySet())
                .stream()
                .filter(product -> product != null && !Boolean.FALSE.equals(product.getIsActive()))
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        if (productById.isEmpty()) {
            return List.of();
        }

        List<Map.Entry<Integer, PurchaseStats>> sorted = purchaseStats.entrySet().stream()
                .filter(entry -> productById.containsKey(entry.getKey()))
                .sorted(Comparator
                        .comparing((Map.Entry<Integer, PurchaseStats> entry) -> entry.getValue().lastPurchasedAt,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing((Map.Entry<Integer, PurchaseStats> entry) -> entry.getValue().totalQty,
                                Comparator.reverseOrder())
                        .thenComparing(Map.Entry::getKey))
                .toList();

        List<PurchasedProductRecommendation> recommendations = new ArrayList<>();
        for (Map.Entry<Integer, PurchaseStats> entry : sorted) {
            Product product = productById.get(entry.getKey());
            if (product == null) {
                continue;
            }

            PurchaseStats stats = entry.getValue();
            recommendations.add(new PurchasedProductRecommendation(product, stats.totalQty, stats.lastPurchasedAt));
            if (recommendations.size() >= safeLimit) {
                break;
            }
        }

        return recommendations;
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
        if (isCodPayment(savedOrder)) {
            notifyOrderConfirmationAfterCommit(savedOrder);
        }
        return savedOrder;
    }

    @Transactional
    public Order confirmPaymentSuccess(Integer id) {
        Optional<Order> o = orderRepository.findById(Objects.requireNonNull(id, "id"));
        if (o.isPresent()) {
            Order order = o.get();
            if (!isVnpayPayment(order)) {
                return order;
            }

            String previousStatus = normalizeStatus(order.getStatus());
            if ("processing".equals(previousStatus) || isCancelled(previousStatus) || "delivered".equals(previousStatus)) {
                return order;
            }

            order.setStatus("processing");
            Order updatedOrder = orderRepository.save(order);
            syncProductSoldCounts(updatedOrder, previousStatus, normalizeStatus(updatedOrder.getStatus()));
            notifyOrderConfirmationAfterCommit(updatedOrder);
            return updatedOrder;
        }
        return null;
    }

    @Transactional
    public Order markPaymentPendingAndNotify(Integer id) {
        Optional<Order> o = orderRepository.findById(Objects.requireNonNull(id, "id"));
        if (o.isPresent()) {
            Order order = o.get();
            if (!isVnpayPayment(order)) {
                return order;
            }

            String previousStatus = normalizeStatus(order.getStatus());
            if ("processing".equals(previousStatus) || isCancelled(previousStatus) || "delivered".equals(previousStatus)) {
                return order;
            }

            order.setStatus("pending");
            Order updatedOrder = orderRepository.save(order);
            syncProductSoldCounts(updatedOrder, previousStatus, normalizeStatus(updatedOrder.getStatus()));
            notifyOrderConfirmationAfterCommit(updatedOrder);
            return updatedOrder;
        }
        return null;
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

    @Transactional
    public Order cancelOrder(Integer id, List<String> reasons, String otherReason) {
        Optional<Order> o = orderRepository.findById(Objects.requireNonNull(id, "id"));
        if (o.isPresent()) {
            Order order = o.get();
            String previousStatus = normalizeStatus(order.getStatus());
            if ("delivered".equals(previousStatus) || isCancelled(previousStatus)) {
                return order;
            }

            String reasonText = "";
            if (reasons != null && !reasons.isEmpty()) {
                reasonText = reasons.stream()
                        .filter(r -> r != null && !r.isBlank())
                        .map(String::trim)
                        .collect(Collectors.joining("; "));
            }
            if (otherReason != null && !otherReason.isBlank()) {
                if (reasonText.isBlank()) reasonText = otherReason.trim();
                else reasonText = reasonText + "; " + otherReason.trim();
            }

            order.setStatus("cancelled");
            order.setCancellationReason(reasonText == null ? null : reasonText);
            order.setCancelledAt(LocalDateTime.now());
            Order updatedOrder = orderRepository.save(order);
            syncProductSoldCounts(updatedOrder, previousStatus, normalizeStatus(updatedOrder.getStatus()));

            try {
                // notify customer
                String customerEmail = order == null ? null : order.getCustomerEmail();
                String customerName = order == null ? null : order.getCustomerName();
                if (customerEmail != null && !customerEmail.isBlank()) {
                    emailService.sendOrderCancellationEmail(customerEmail, customerName, updatedOrder, reasonText);
                }
            } catch (Exception ex) {
                log.warn("Failed to notify customer about cancellation for order {}: {}", order.getOrderCode(), ex.getMessage());
            }

            try {
                // create server-side admin notification so it appears in admin bell
                String orderLabel = updatedOrder.getOrderCode() == null ? String.valueOf(updatedOrder.getId()) : updatedOrder.getOrderCode();
                String notifText = "Đã hủy đơn #" + orderLabel + (hasText(order.getCustomerName()) ? " bởi " + order.getCustomerName() : "");
                adminNotificationService.createNotification("order", notifText, updatedOrder.getId());
            } catch (Exception ex) {
                log.warn("Failed to create admin notification for cancellation of order {}: {}", order.getOrderCode(), ex.getMessage());
            }

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
        boolean wasCountedAsSold = previousStatus != null && isCountedAsSold(order, previousStatus);
        boolean isCountedAsSold = isCountedAsSold(order, nextStatus);

        if (wasCountedAsSold == isCountedAsSold) {
            return;
        }

        int multiplier = isCountedAsSold ? 1 : -1;
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

    private boolean isCountedAsSold(Order order, String status) {
        if (order == null || isCancelled(status)) {
            return false;
        }

        String paymentMethod = normalizeValue(order.getPaymentMethod());
        String normalizedStatus = normalizeStatus(status);

        if ("cod".equals(paymentMethod)) {
            return true;
        }

        return normalizedStatus != null && !"pending".equals(normalizedStatus);
    }

    private boolean isCodPayment(Order order) {
        return order != null && "cod".equals(normalizeValue(order.getPaymentMethod()));
    }

    private boolean isVnpayPayment(Order order) {
        return order != null && "vnpay".equals(normalizeValue(order.getPaymentMethod()));
    }

    private void notifyOrderConfirmationAfterCommit(Order order) {
        if (order == null) {
            return;
        }

        String recipientEmail = resolveNotificationEmail(order);
        if (!hasText(recipientEmail)) {
            log.warn("Skipping order confirmation email for order {} because no recipient email was found", order.getOrderCode());
            return;
        }

        String recipientName = resolveNotificationName(order);
        Runnable sendEmailTask = () -> {
            try {
                emailService.sendOrderConfirmationEmail(recipientEmail, recipientName, order);
            } catch (Exception ex) {
                log.warn("Failed to send order confirmation email for order {}: {}", order.getOrderCode(), ex.getMessage());
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void suspend() {
                }

                @Override
                public void resume() {
                }

                @Override
                public void flush() {
                }

                @Override
                public void beforeCommit(boolean readOnly) {
                }

                @Override
                public void beforeCompletion() {
                }

                @Override
                public void afterCommit() {
                    sendEmailTask.run();
                }

                @Override
                public void afterCompletion(int status) {
                }
            });
            return;
        }

        sendEmailTask.run();
    }

    private String resolveNotificationEmail(Order order) {
        if (order == null) {
            return null;
        }

        if (order.getUser() != null && hasText(order.getUser().getEmail())) {
            return order.getUser().getEmail().trim();
        }

        if (hasText(order.getCustomerEmail())) {
            return order.getCustomerEmail().trim();
        }

        return null;
    }

    private String resolveNotificationName(Order order) {
        if (order == null) {
            return null;
        }

        if (order.getUser() != null && hasText(order.getUser().getName())) {
            return order.getUser().getName().trim();
        }

        if (hasText(order.getCustomerName())) {
            return order.getCustomerName().trim();
        }

        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean isCancelled(String status) {
        return status != null && "cancelled".equalsIgnoreCase(status.trim());
    }

    private static class PurchaseStats {
        private int totalQty;
        private LocalDateTime lastPurchasedAt;
    }
}
