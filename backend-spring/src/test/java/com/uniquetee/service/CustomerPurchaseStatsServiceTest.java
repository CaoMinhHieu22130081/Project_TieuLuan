package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

import com.uniquetee.entity.Order;

class CustomerPurchaseStatsServiceTest {

    private final CustomerPurchaseStatsService service = new CustomerPurchaseStatsService();

    @Test
    void calculate_countsCodAndPaidOnlineOrders_butSkipsPendingOnlineAndCancelledOrders() {
        Order firstOrder = new Order();
        firstOrder.setTotal(new BigDecimal("669000"));
        firstOrder.setStatus("pending");
        firstOrder.setPaymentMethod("cod");

        Order secondOrder = new Order();
        secondOrder.setTotal(new BigDecimal("432000"));
        secondOrder.setStatus("processing");
        secondOrder.setPaymentMethod("vnpay");

        Order pendingOnlineOrder = new Order();
        pendingOnlineOrder.setTotal(new BigDecimal("150000"));
        pendingOnlineOrder.setStatus("pending");
        pendingOnlineOrder.setPaymentMethod("vnpay");

        Order cancelledOrder = new Order();
        cancelledOrder.setTotal(new BigDecimal("150000"));
        cancelledOrder.setStatus("cancelled");
        cancelledOrder.setPaymentMethod("vnpay");

        CustomerPurchaseStats stats = service.calculate(List.of(firstOrder, secondOrder, pendingOnlineOrder, cancelledOrder));

        assertEquals(new BigDecimal("1101000"), stats.spent());
        assertEquals(4, stats.orderCount());
    }
}