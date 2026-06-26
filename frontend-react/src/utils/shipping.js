export const FREE_SHIPPING_THRESHOLD = 500000;

export const isFreeShippingEligible = (subtotal) => Number(subtotal || 0) >= FREE_SHIPPING_THRESHOLD;

export const formatShippingThreshold = (language = "vi") =>
  new Intl.NumberFormat(language === "en" ? "en-US" : "vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(FREE_SHIPPING_THRESHOLD);
