package com.uniquetee.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniquetee.validation.ReviewToneRules;

@Component
public class ReviewSentimentAnalyzer {

    private static final String DEFAULT_MODEL_ID = "5CD-AI/Vietnamese-Sentiment-visobert";
    private static final String DEFAULT_API_BASE_URL = "https://api-inference.huggingface.co/models";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${review.sentiment.use-remote-model:true}")
    private boolean useRemoteModel;

    @Value("${review.sentiment.model:" + DEFAULT_MODEL_ID + "}")
    private String modelId;

    @Value("${review.sentiment.api-base-url:" + DEFAULT_API_BASE_URL + "}")
    private String apiBaseUrl;

    @Value("${review.sentiment.min-confidence:0.58}")
    private double minConfidence;

    @Value("${review.sentiment.request-timeout-ms:3000}")
    private long requestTimeoutMs;

    @Value("${review.sentiment.hf-token:}")
    private String configuredToken;

    @Autowired
    public ReviewSentimentAnalyzer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }

    public ReviewToneRules.Tone classifyTone(String content) {
        ReviewToneRules.Tone heuristicTone = ReviewToneRules.detectTone(content);
        ReviewToneRules.Tone remoteTone = classifyWithRemoteModel(content);

        if (remoteTone == null) {
            return heuristicTone;
        }

        if (remoteTone == ReviewToneRules.Tone.NEUTRAL && heuristicTone != ReviewToneRules.Tone.NEUTRAL) {
            return heuristicTone;
        }

        return remoteTone;
    }

    public boolean isToneAlignedWithRating(Integer rating, String content) {
        ReviewToneRules.Tone tone = classifyTone(content);
        if (tone == ReviewToneRules.Tone.NEUTRAL || rating == null) {
            return true;
        }

        if (rating >= 4) {
            return tone != ReviewToneRules.Tone.NEGATIVE;
        }

        if (rating <= 2) {
            return tone != ReviewToneRules.Tone.POSITIVE;
        }

        return true;
    }

    private ReviewToneRules.Tone classifyWithRemoteModel(String content) {
        if (!useRemoteModel || !StringUtils.hasText(content)) {
            return null;
        }

        String token = resolveToken();
        if (!StringUtils.hasText(token)) {
            return null;
        }

        String endpoint = buildEndpoint();
        try {
            Map<String, Object> payload = Map.of(
                    "inputs", content.trim(),
                    "parameters", Map.of(
                            "top_k", 3,
                            "function_to_apply", "softmax"
                    )
            );

            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofMillis(Math.max(requestTimeoutMs, 1000L)))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (root == null || !root.isArray() || root.isEmpty()) {
                return null;
            }

            JsonNode topPrediction = root.get(0);
            if (topPrediction == null) {
                return null;
            }

            double confidence = topPrediction.path("score").asDouble(0.0);
            if (confidence < minConfidence) {
                return null;
            }

            return mapLabel(topPrediction.path("label").asText(null));
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            return null;
        } catch (IOException | RuntimeException exception) {
            return null;
        }
    }

    private String resolveToken() {
        if (StringUtils.hasText(configuredToken)) {
            return configuredToken.trim();
        }

        String environmentToken = System.getenv("HF_TOKEN");
        if (StringUtils.hasText(environmentToken)) {
            return environmentToken.trim();
        }

        return null;
    }

    private String buildEndpoint() {
        String baseUrl = StringUtils.hasText(apiBaseUrl) ? apiBaseUrl.trim() : DEFAULT_API_BASE_URL;
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        String model = StringUtils.hasText(modelId) ? modelId.trim() : DEFAULT_MODEL_ID;
        return baseUrl + "/" + model;
    }

    private ReviewToneRules.Tone mapLabel(String label) {
        if (!StringUtils.hasText(label)) {
            return null;
        }

        String normalizedLabel = ReviewToneRules.normalizeText(label);
        if (normalizedLabel.contains("neg") || normalizedLabel.contains("negative") || normalizedLabel.equals("0") || normalizedLabel.contains("label_0")) {
            return ReviewToneRules.Tone.NEGATIVE;
        }

        if (normalizedLabel.contains("pos") || normalizedLabel.contains("positive") || normalizedLabel.equals("1") || normalizedLabel.contains("label_1")) {
            return ReviewToneRules.Tone.POSITIVE;
        }

        if (normalizedLabel.contains("neu") || normalizedLabel.contains("neutral") || normalizedLabel.equals("2") || normalizedLabel.contains("label_2")) {
            return ReviewToneRules.Tone.NEUTRAL;
        }

        return null;
    }
}