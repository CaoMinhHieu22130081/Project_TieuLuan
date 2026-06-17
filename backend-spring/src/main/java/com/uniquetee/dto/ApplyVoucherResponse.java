package com.uniquetee.dto;

import java.math.BigDecimal;

public class ApplyVoucherResponse {
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal shippingDiscount = BigDecimal.ZERO;
    private String code;
    private String shippingCode;
    private String message;

    public ApplyVoucherResponse() {}

    public ApplyVoucherResponse(BigDecimal discountAmount, BigDecimal shippingDiscount, String code, String shippingCode, String message) {
        this.discountAmount = discountAmount;
        this.shippingDiscount = shippingDiscount;
        this.code = code;
        this.shippingCode = shippingCode;
        this.message = message;
    }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getShippingDiscount() { return shippingDiscount; }
    public void setShippingDiscount(BigDecimal shippingDiscount) { this.shippingDiscount = shippingDiscount; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getShippingCode() { return shippingCode; }
    public void setShippingCode(String shippingCode) { this.shippingCode = shippingCode; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
