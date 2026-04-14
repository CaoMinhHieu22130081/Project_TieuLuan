package com.uniquetee.dto;

import jakarta.validation.constraints.NotBlank;

public class VnpayCreateRequest {

    @NotBlank(message = "Vui lòng cung cấp mã đơn hàng")
    private String orderCode;

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }
}