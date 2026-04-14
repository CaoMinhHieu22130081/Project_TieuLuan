package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

import com.uniquetee.entity.Order;

class CustomerPurchaseStatsServiceTest {

    private final CustomerPurchaseStatsService service = new CustomerPurchaseStatsService();

    @Test
    void calculate_sumsNonCancelledOrdersAndCountsAllOrders() {
        Order firstOrder = new Order();
        firstOrder.setTotal(new BigDecimal("669000"));
        firstOrder.setStatus("pending");

        Order secondOrder = new Order();
        secondOrder.setTotal(new BigDecimal("432000"));
        secondOrder.setStatus("delivered");

        Order cancelledOrder = new Order();
        cancelledOrder.setTotal(new BigDecimal("150000"));
        cancelledOrder.setStatus("cancelled");

        CustomerPurchaseStats stats = service.calculate(List.of(firstOrder, secondOrder, cancelledOrder));

        assertEquals(new BigDecimal("1101000"), stats.spent());
        assertEquals(3, stats.orderCount());
    }
}