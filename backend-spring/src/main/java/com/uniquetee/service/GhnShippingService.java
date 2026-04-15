package com.uniquetee.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.uniquetee.dto.GhnShippingQuoteRequest;

@Service
public class GhnShippingService {

    private static final int DEFAULT_PACKAGE_WEIGHT_GRAMS = 500;
    private static final int DEFAULT_PACKAGE_LENGTH_CM = 20;
    private static final int DEFAULT_PACKAGE_WIDTH_CM = 15;
    private static final int DEFAULT_PACKAGE_HEIGHT_CM = 10;
    private static final int DEFAULT_SERVICE_TYPE_ID = 2;
    private static final String FALLBACK_SERVICE_NAME = "Phí tạm tính";
    private static final String GHN_SOURCE = "ghn";
    private static final String FALLBACK_SOURCE = "fallback";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ghn.api-base-url:https://online-gateway.ghn.vn/shiip/public-api/v2}")
    private String apiBaseUrl;

    @Value("${ghn.token:}")
    private String token;

    @Value("${ghn.shop-id:}")
    private String shopId;

    @Value("${ghn.from-district-id:}")
    private String fromDistrictId;

    @Value("${ghn.from-ward-code:}")
    private String fromWardCode;

    @Value("${ghn.package-weight-grams:500}")
    private int packageWeightGrams;

    @Value("${ghn.package-length-cm:20}")
    private int packageLengthCm;

    @Value("${ghn.package-width-cm:15}")
    private int packageWidthCm;

    @Value("${ghn.package-height-cm:10}")
    private int packageHeightCm;

    @Value("${ghn.default-service-type-id:2}")
    private int defaultServiceTypeId;

    public Map<String, Object> getConfigurationState() {
        return Map.of(
                "configured", isConfigured(),
                "masterDataConfigured", isMasterDataConfigured(),
                "missingFields", missingConfigurationFields());
    }

    public boolean isConfigured() {
        return hasText(token) && hasText(shopId);
    }

    public boolean isMasterDataConfigured() {
        return isConfigured() && hasText(fromDistrictId) && hasText(fromWardCode);
    }

    public List<String> missingConfigurationFields() {
        List<String> missingFields = new ArrayList<>();

        if (!hasText(token)) {
            missingFields.add("ghn.token");
        }
        if (!hasText(shopId)) {
            missingFields.add("ghn.shop-id");
        }
        if (!hasText(fromDistrictId)) {
            missingFields.add("ghn.from-district-id");
        }
        if (!hasText(fromWardCode)) {
            missingFields.add("ghn.from-ward-code");
        }

        return missingFields;
    }

    public List<Map<String, Object>> getProvinces() {
        if (!isConfigured()) {
            return Collections.emptyList();
        }

        Map<String, Object> response = callGhn(HttpMethod.GET, "/master-data/province", null);
        return normalizeLocationList(response == null ? null : response.get("data"), "provinceId", "provinceName");
    }

    public List<Map<String, Object>> getDistricts(Integer provinceId) {
        if (!isConfigured() || provinceId == null) {
            return Collections.emptyList();
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("province_id", provinceId);

        Map<String, Object> response = callGhn(HttpMethod.POST, "/master-data/district", requestBody);
        return normalizeLocationList(response == null ? null : response.get("data"), "districtId", "districtName");
    }

    public List<Map<String, Object>> getWards(Integer districtId) {
        if (!isConfigured() || districtId == null) {
            return Collections.emptyList();
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("district_id", districtId);

        Map<String, Object> response = callGhn(HttpMethod.POST, "/master-data/ward", requestBody);
        return normalizeLocationList(response == null ? null : response.get("data"), "wardCode", "wardName");
    }

    public Map<String, Object> quoteShippingFee(GhnShippingQuoteRequest request) {
        if (request == null) {
            return fallbackQuote(false, "GHN chưa nhận được yêu cầu tính phí ship");
        }

        if (!isConfigured()) {
            return fallbackQuote(false, "GHN chưa được cấu hình");
        }

        if (!isMasterDataConfigured()) {
            return fallbackQuote(true, "GHN thiếu thông tin điểm gửi hàng mặc định");
        }

        Integer districtId = request.getDistrictId();
        String wardCode = normalizeText(request.getWardCode());
        if (districtId == null || wardCode == null) {
            return fallbackQuote(true, "Thiếu thông tin quận/huyện hoặc phường/xã để tính phí GHN");
        }

        int itemCount = request.getItemCount() == null || request.getItemCount() < 1 ? 1 : request.getItemCount();
        int insuranceValue = normalizeMoney(request.getInsuranceValue());

        try {
            ResolvedService resolvedService = resolveService(districtId);
            Map<String, Object> feeRequest = buildFeeRequest(resolvedService, districtId, wardCode, itemCount, insuranceValue);
            Map<String, Object> response = callGhn(HttpMethod.POST, "/shipping-order/fee", feeRequest);
            Map<String, Object> data = asMap(response == null ? null : response.get("data"));

            Number shippingFeeValue = firstNumber(data, "total", "service_fee", "total_fee");
            int shippingFee = shippingFeeValue == null ? 0 : Math.max(0, shippingFeeValue.intValue());
            String serviceName = resolvedService == null || !hasText(resolvedService.name)
                    ? "GHN"
                    : resolvedService.name;

            return successQuote(shippingFee, serviceName, "Phí vận chuyển được GHN tính theo địa chỉ đã chọn.");
        } catch (Exception ex) {
            return fallbackQuote(true, ex.getMessage() == null || ex.getMessage().isBlank()
                    ? "Không thể tính phí GHN"
                    : ex.getMessage());
        }
    }

    private ResolvedService resolveService(Integer districtId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("shop_id", parseInteger(shopId));
        payload.put("from_district", parseInteger(fromDistrictId));
        payload.put("from_district_id", parseInteger(fromDistrictId));
        payload.put("to_district", districtId);
        payload.put("to_district_id", districtId);

        Map<String, Object> response = callGhn(HttpMethod.POST, "/shipping-order/available-services", payload);
        List<Map<String, Object>> services = normalizeServiceList(response == null ? null : response.get("data"));
        if (services.isEmpty()) {
            return new ResolvedService(null, "GHN");
        }

        Map<String, Object> firstService = services.get(0);
        Integer serviceId = firstInteger(firstService, "service_id", "serviceId");
        String serviceName = firstText(firstService, "short_name", "shortName", "service_name", "serviceName");
        return new ResolvedService(serviceId, hasText(serviceName) ? serviceName : "GHN");
    }

    private Map<String, Object> buildFeeRequest(ResolvedService resolvedService, Integer districtId, String wardCode,
            int itemCount, int insuranceValue) {
        Map<String, Object> payload = new LinkedHashMap<>();

        payload.put("shop_id", parseInteger(shopId));
        if (resolvedService != null && resolvedService.id != null) {
            payload.put("service_id", resolvedService.id);
        }
        payload.put("service_type_id", defaultServiceTypeId);
        payload.put("from_district_id", parseInteger(fromDistrictId));
        payload.put("from_district", parseInteger(fromDistrictId));
        payload.put("to_district_id", districtId);
        payload.put("to_district", districtId);
        payload.put("to_ward_code", wardCode);
        payload.put("height", packageHeightCm > 0 ? packageHeightCm : DEFAULT_PACKAGE_HEIGHT_CM);
        payload.put("length", packageLengthCm > 0 ? packageLengthCm : DEFAULT_PACKAGE_LENGTH_CM);
        payload.put("width", packageWidthCm > 0 ? packageWidthCm : DEFAULT_PACKAGE_WIDTH_CM);
        payload.put("weight", Math.max(1, (packageWeightGrams > 0 ? packageWeightGrams : DEFAULT_PACKAGE_WEIGHT_GRAMS) * itemCount));
        payload.put("insurance_value", Math.max(0, insuranceValue));
        payload.put("cod_failed_amount", 0);

        return payload;
    }

    private Map<String, Object> fallbackQuote(boolean configured, String message) {
        return Map.of(
                "configured", configured,
                "source", FALLBACK_SOURCE,
                "shippingFee", 0,
                "serviceName", FALLBACK_SERVICE_NAME,
                "message", message == null || message.isBlank() ? FALLBACK_SERVICE_NAME : message);
    }

    private Map<String, Object> successQuote(int shippingFee, String serviceName, String message) {
        return Map.of(
                "configured", true,
                "source", GHN_SOURCE,
                "shippingFee", Math.max(0, shippingFee),
                "serviceName", hasText(serviceName) ? serviceName : "GHN",
                "message", message == null || message.isBlank()
                        ? "Phí vận chuyển được GHN tính theo địa chỉ đã chọn."
                        : message);
    }

    private Map<String, Object> callGhn(HttpMethod method, String path, Object body) {
        if (!isConfigured()) {
            return Collections.emptyMap();
        }

        HttpHeaders headers = createHeaders();
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                resolveUrl(path),
                method,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });

        return response.getBody() == null ? Collections.emptyMap() : response.getBody();
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (hasText(token)) {
            headers.set("Token", token.trim());
        }
        if (hasText(shopId)) {
            headers.set("ShopId", shopId.trim());
        }
        return headers;
    }

    private String resolveUrl(String path) {
        String normalizedBaseUrl = hasText(apiBaseUrl) ? apiBaseUrl.trim() : "https://online-gateway.ghn.vn/shiip/public-api/v2";
        if (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }

        String normalizedPath = path == null ? "" : path.trim();
        if (!normalizedPath.startsWith("/")) {
            normalizedPath = "/" + normalizedPath;
        }

        boolean masterDataPath = normalizedPath.startsWith("/master-data/");
        boolean hasVersionSuffix = normalizedBaseUrl.endsWith("/v2");

        if (masterDataPath && hasVersionSuffix) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 3);
        } else if (!masterDataPath && !hasVersionSuffix) {
            normalizedBaseUrl = normalizedBaseUrl + "/v2";
        }

        return normalizedBaseUrl + normalizedPath;
    }

    private List<Map<String, Object>> normalizeLocationList(Object rawData, String idField, String nameField) {
        if (!(rawData instanceof List<?> rawList)) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (Object entry : rawList) {
            Map<String, Object> normalized = normalizeLocationEntry(entry, idField, nameField);
            if (!normalized.isEmpty()) {
                results.add(normalized);
            }
        }
        return results;
    }

    private List<Map<String, Object>> normalizeServiceList(Object rawData) {
        if (!(rawData instanceof List<?> rawList)) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (Object entry : rawList) {
            if (!(entry instanceof Map<?, ?> rawMap)) {
                continue;
            }

            Map<String, Object> normalized = new LinkedHashMap<>();
            Integer serviceId = firstInteger(rawMap, "service_id", "serviceId");
            String serviceName = firstText(rawMap, "short_name", "shortName", "service_name", "serviceName");

            if (serviceId != null) {
                normalized.put("serviceId", serviceId);
            }
            if (hasText(serviceName)) {
                normalized.put("serviceName", serviceName);
            }

            if (!normalized.isEmpty()) {
                results.add(normalized);
            }
        }

        return results;
    }

    private Map<String, Object> normalizeLocationEntry(Object entry, String idField, String nameField) {
        if (!(entry instanceof Map<?, ?> rawMap)) {
            return Collections.emptyMap();
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        if ("wardCode".equals(idField)) {
            String wardCode = firstText(rawMap, "wardCode", "ward_code", "WardCode");
            String wardName = firstText(rawMap, "wardName", "ward_name", "WardName");
            if (hasText(wardCode)) {
                normalized.put("wardCode", wardCode);
            }
            if (hasText(wardName)) {
                normalized.put("wardName", wardName);
            }
            return normalized;
        }

        Integer id = firstInteger(rawMap, idField, snakeCase(idField), pascalCase(idField));
        String name = firstText(rawMap, nameField, snakeCase(nameField), pascalCase(nameField));

        if (id != null) {
            normalized.put(idField, id);
        }
        if (hasText(name)) {
            normalized.put(nameField, name);
        }

        return normalized;
    }

    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> rawMap) {
            Map<String, Object> result = new LinkedHashMap<>();
            rawMap.forEach((key, item) -> result.put(key == null ? null : key.toString(), item));
            return result;
        }
        return Collections.emptyMap();
    }

    private Integer firstInteger(Map<?, ?> map, String... keys) {
        Number number = firstNumber(map, keys);
        return number == null ? null : number.intValue();
    }

    private Number firstNumber(Map<?, ?> map, String... keys) {
        Object value = firstValue(map, keys);
        if (value instanceof Number number) {
            return number;
        }
        if (value instanceof String stringValue) {
            try {
                if (stringValue.contains(".")) {
                    return Double.valueOf(stringValue);
                }
                return Long.valueOf(stringValue);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String firstText(Map<?, ?> map, String... keys) {
        Object value = firstValue(map, keys);
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private Object firstValue(Map<?, ?> map, String... keys) {
        if (map == null || keys == null) {
            return null;
        }

        for (String key : keys) {
            if (!hasText(key)) {
                continue;
            }

            for (Map.Entry<?, ?> entry : map.entrySet()) {
                Object entryKey = entry.getKey();
                if (entryKey != null && entryKey.toString().equalsIgnoreCase(key)) {
                    return entry.getValue();
                }
            }
        }

        return null;
    }

    private int normalizeMoney(BigDecimal value) {
        if (value == null) {
            return 0;
        }
        return value.setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private Integer parseInteger(String value) {
        if (!hasText(value)) {
            return null;
        }

        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeText(String value) {
        if (!hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String snakeCase(String value) {
        if (!hasText(value)) {
            return value;
        }

        if (value.contains("_")) {
            return value;
        }

        StringBuilder builder = new StringBuilder();
        for (char character : value.toCharArray()) {
            if (Character.isUpperCase(character)) {
                if (builder.length() > 0) {
                    builder.append('_');
                }
                builder.append(Character.toLowerCase(character));
            } else {
                builder.append(character);
            }
        }
        return builder.toString();
    }

    private String pascalCase(String value) {
        if (!hasText(value)) {
            return value;
        }

        StringBuilder builder = new StringBuilder();
        boolean capitalizeNext = true;
        for (char character : value.toCharArray()) {
            if (character == '_' || character == '-') {
                capitalizeNext = true;
                continue;
            }

            if (capitalizeNext) {
                builder.append(Character.toUpperCase(character));
                capitalizeNext = false;
            } else {
                builder.append(character);
            }
        }
        return builder.toString();
    }

    private static final class ResolvedService {
        private final Integer id;
        private final String name;

        private ResolvedService(Integer id, String name) {
            this.id = id;
            this.name = name;
        }
    }
}