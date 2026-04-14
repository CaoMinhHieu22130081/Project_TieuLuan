package com.uniquetee.service;

import java.math.BigDecimal;

public record CustomerPurchaseStats(BigDecimal spent, int orderCount) {
    public CustomerPurchaseStats {
        spent = spent == null ? BigDecimal.ZERO : spent;
    }
}