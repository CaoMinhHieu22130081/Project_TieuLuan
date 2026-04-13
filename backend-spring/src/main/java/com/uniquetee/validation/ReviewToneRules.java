package com.uniquetee.validation;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

public final class ReviewToneRules {

    private static final List<String> NEGATIVE_PHRASES = List.of(
            "te",
            "xau",
            "kem",
            "that vong",
            "khong hai long",
            "khong tot",
            "chua tot",
            "qua te",
            "rat te",
            "loi",
            "hong"
    );

    private ReviewToneRules() {
    }

    public static boolean hasNegativeTone(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String normalizedText = normalizeText(value);
        return NEGATIVE_PHRASES.stream().anyMatch(normalizedText::contains);
    }

    public static String normalizeText(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT);
    }
}