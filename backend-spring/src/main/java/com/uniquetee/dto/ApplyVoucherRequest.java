package com.uniquetee.dto;

import java.math.BigDecimal;

public class ApplyVoucherRequest {
    private Integer userId;
    private String code;
    private String shippingCode;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getShippingCode() { return shippingCode; }
    public void setShippingCode(String shippingCode) { this.shippingCode = shippingCode; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }
}
