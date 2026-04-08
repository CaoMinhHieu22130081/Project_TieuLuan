export const getDisplayRating = (product) => {
  const reviewCount = Number(product?.reviewCount ?? product?.reviews ?? 0);

  if (reviewCount <= 0) {
    return 0;
  }

  const rating = Number(product?.rating);
  return Number.isFinite(rating) ? rating : 0;
};

export const normalizeSizeOption = (size) => {
  if (typeof size === "string") {
    return {
      value: size,
      isAvailable: true,
    };
  }

  return {
    value: size?.size || size?.name || "",
    isAvailable: size?.isAvailable !== false,
  };
};

export const getSizeOptions = (product, { availableOnly = false } = {}) => {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

  return sizes
    .map(normalizeSizeOption)
    .filter((size) => size.value && (!availableOnly || size.isAvailable));
};