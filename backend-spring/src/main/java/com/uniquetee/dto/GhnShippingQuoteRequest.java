package com.uniquetee.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class GhnShippingQuoteRequest {

    @NotNull(message = "districtId is required")
    private Integer districtId;

    @NotBlank(message = "wardCode is required")
    private String wardCode;

    @NotNull(message = "itemCount is required")
    @Positive(message = "itemCount must be greater than 0")
    private Integer itemCount;

    @NotNull(message = "insuranceValue is required")
    @DecimalMin(value = "0", inclusive = true, message = "insuranceValue must be non-negative")
    private BigDecimal insuranceValue;

    public Integer getDistrictId() {
        return districtId;
    }

    public void setDistrictId(Integer districtId) {
        this.districtId = districtId;
    }

    public String getWardCode() {
        return wardCode;
    }

    public void setWardCode(String wardCode) {
        this.wardCode = wardCode;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }

    public BigDecimal getInsuranceValue() {
        return insuranceValue;
    }

    public void setInsuranceValue(BigDecimal insuranceValue) {
        this.insuranceValue = insuranceValue;
    }
}