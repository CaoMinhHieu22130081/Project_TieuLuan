package com.uniquetee.dto;

import java.util.List;

public class OrderCancellationRequest {
    private List<String> reasons;
    private String otherReason;

    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> reasons) { this.reasons = reasons; }

    public String getOtherReason() { return otherReason; }
    public void setOtherReason(String otherReason) { this.otherReason = otherReason; }
}
