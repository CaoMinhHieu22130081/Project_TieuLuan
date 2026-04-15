export const FREE_SHIPPING_THRESHOLD = 500000;

export const isFreeShippingEligible = (subtotal) => Number(subtotal || 0) >= FREE_SHIPPING_THRESHOLD;

export const formatShippingThreshold = () => `${FREE_SHIPPING_THRESHOLD.toLocaleString("vi-VN")}đ`;