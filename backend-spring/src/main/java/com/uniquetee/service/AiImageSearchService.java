package com.uniquetee.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.uniquetee.dto.ImageSearchResponse;

@Service
public class AiImageSearchService {

    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 12;
    private static final long MAX_UPLOAD_SIZE_BYTES = 10L * 1024L * 1024L;

    private final RestTemplate restTemplate;

    @Value("${ai.module.base-url:http://localhost:8000}")
    private String aiModuleBaseUrl;

    public AiImageSearchService() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public ImageSearchResponse searchByImage(MultipartFile imageFile, int limit, String type) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng tải lên một hình ảnh sản phẩm hợp lệ");
        }

        String contentType = imageFile.getContentType();
        if (StringUtils.hasText(contentType) && !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ hỗ trợ tệp hình ảnh");
        }

        if (imageFile.getSize() > MAX_UPLOAD_SIZE_BYTES) {
            throw new IllegalArgumentException("Kích thước ảnh tối đa là 10MB");
        }

        int safeLimit = Math.max(MIN_LIMIT, Math.min(limit, MAX_LIMIT));
        String requestedType = StringUtils.hasText(type) ? type.trim() : null;

        try {
            return callAiModule(imageFile, safeLimit, requestedType);
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể đọc file ảnh đã tải lên", exception);
        } catch (RestClientException exception) {
            throw new IllegalStateException(
                    "Không thể kết nối module AI tìm kiếm ảnh. Hãy kiểm tra service Python đang chạy.", exception);
        }
    }

    private ImageSearchResponse callAiModule(MultipartFile imageFile, int limit, String requestedType)
            throws IOException {
        String baseUrl = aiModuleBaseUrl == null ? "http://localhost:8000" : aiModuleBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(baseUrl + "/search/image")
                .queryParam("limit", limit);
        if (StringUtils.hasText(requestedType)) {
            builder.queryParam("type", requestedType);
        }
        String targetUrl = builder.toUriString();

        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        fileHeaders.setContentDispositionFormData("file", resolveFilename(imageFile));

        ByteArrayResource fileResource = new ByteArrayResource(imageFile.getBytes()) {
            @Override
            public String getFilename() {
                return resolveFilename(imageFile);
            }
        };

        MediaType fileContentType = resolveContentType(imageFile);
        MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
        if (fileContentType != null) {
            fileHeaders.setContentType(fileContentType);
        }
        formData.add("file", new HttpEntity<>(fileResource, fileHeaders));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(formData, headers);
        ResponseEntity<ImageSearchResponse> response = restTemplate.exchange(
                targetUrl,
                HttpMethod.POST,
                requestEntity,
                ImageSearchResponse.class);

        HttpStatusCode statusCode = response.getStatusCode();
        if (!statusCode.is2xxSuccessful()) {
            throw new IllegalStateException("Module AI trả về trạng thái không hợp lệ: " + statusCode.value());
        }

        ImageSearchResponse responseBody = response.getBody();
        if (responseBody == null) {
            responseBody = new ImageSearchResponse();
            responseBody.setModel("unknown");
            responseBody.setCatalogSize(0);
            responseBody.setResults(new ArrayList<>());
            return responseBody;
        }

        if (responseBody.getResults() == null) {
            responseBody.setResults(new ArrayList<>());
        }

        return responseBody;
    }

    private MediaType resolveContentType(MultipartFile imageFile) {
        String contentType = imageFile.getContentType();
        if (!StringUtils.hasText(contentType)) {
            return MediaType.IMAGE_JPEG;
        }

        try {
            MediaType parsed = MediaType.parseMediaType(contentType);
            if (parsed.getType() != null && parsed.getType().equalsIgnoreCase("image")) {
                return parsed;
            }
        } catch (IllegalArgumentException exception) {
            // fall through to default image content type
        }

        return MediaType.IMAGE_JPEG;
    }

    private String resolveFilename(MultipartFile imageFile) {
        String filename = imageFile.getOriginalFilename();
        if (!StringUtils.hasText(filename)) {
            return "image-upload.jpg";
        }
        return filename;
    }
}