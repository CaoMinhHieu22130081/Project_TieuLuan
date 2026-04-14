package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;

import com.uniquetee.entity.Order;

@Service
public class CustomerPurchaseStatsService {

    public CustomerPurchaseStats calculate(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return new CustomerPurchaseStats(BigDecimal.ZERO, 0);
        }

        BigDecimal spent = BigDecimal.ZERO;
        int orderCount = 0;

        for (Order order : orders) {
            if (order == null) {
                continue;
            }

            orderCount += 1;

            if (!isSpendableOrder(order)) {
                continue;
            }

            spent = spent.add(resolveOrderTotal(order));
        }

        return new CustomerPurchaseStats(spent, orderCount);
    }

    private BigDecimal resolveOrderTotal(Order order) {
        if (order == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = order.getTotal();
        if (total != null) {
            return total;
        }

        BigDecimal subtotal = order.getSubtotal() == null ? BigDecimal.ZERO : order.getSubtotal();
        BigDecimal shippingFee = order.getShippingFee() == null ? BigDecimal.ZERO : order.getShippingFee();
        return subtotal.add(shippingFee);
    }

    private boolean isCancelled(String status) {
        return status != null && "cancelled".equalsIgnoreCase(status.trim());
    }

    private boolean isSpendableOrder(Order order) {
        if (order == null || isCancelled(order.getStatus())) {
            return false;
        }

        String paymentMethod = normalizePaymentMethod(order.getPaymentMethod());
        String status = normalizeStatus(order.getStatus());

        if ("cod".equals(paymentMethod)) {
            return true;
        }

        return status != null && !"pending".equals(status);
    }

    private String normalizePaymentMethod(String paymentMethod) {
        return paymentMethod == null ? "cod" : paymentMethod.trim().toLowerCase();
    }

    private String normalizeStatus(String status) {
        return status == null ? null : status.trim().toLowerCase();
    }
}