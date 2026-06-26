export const getLocale = (language) => (language === "en" ? "en-US" : "vi-VN");

export const formatNumber = (value, language = "vi") =>
  Number(value || 0).toLocaleString(getLocale(language));

export const formatCurrency = (value, language = "vi") =>
  new Intl.NumberFormat(getLocale(language), {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDate = (value, language = "vi") => {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat(getLocale(language)).format(new Date(value));
};
