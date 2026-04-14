package com.uniquetee.service;

public record VnpayCallbackResult(
        boolean signatureValid,
        boolean orderFound,
        boolean paymentSuccess,
        String orderCode,
        String message) {
}