package com.uniquetee.validation;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class ReviewToneRules {

    private static final List<String> POSITIVE_PHRASES = List.of(
            "rat tot",
            "tot lam",
            "hai long",
            "rat hai long",
            "ung y",
            "xuat sac",
            "hoan hao",
            "rat dep",
            "dep qua",
            "chat luong",
            "dang tien",
            "rat muot",
            "muot ma",
            "rat ngon",
            "ngon qua",
            "rat thich",
            "thich lam",
            "xung dang",
            "tuyet voi",
            "rat tuyet",
            "on dinh",
            "rat on",
            "chuan",
            "cang det",
            "pha pha",
            "khong co gi phai suy nghi"
    );

    private static final List<String> NEGATIVE_PHRASES = List.of(
            "rat te",
            "qua te",
            "that vong",
            "khong hai long",
            "khong tot",
            "chua tot",
            "khong on",
            "khong on dinh",
            "khong dung duoc",
            "khong chap nhan",
            "khong dang tien",
            "bat tien",
            "vo dung",
            "qua dat",
            "khong dung",
            "khong xai duoc",
            "khong the chap nhan",
            "lag",
            "giat",
            "do",
            "chan",
            "xau",
            "kem",
            "loi",
            "hong",
            "hu",
            "cui",
            "buc",
            "tuc",
            "xui",
            "phe",
            "cham",
            "tat",
            "mat tac dung",
            "khong dang",
            "qua cham",
            "cham chap",
            "that bai"
    );

    private static final Set<String> POSITIVE_WORDS = Set.of(
            "tot",
            "dep",
            "hay",
            "ok",
            "oke",
            "on",
            "muot",
            "ngon",
            "thich",
            "ung",
            "sang",
            "dinh",
            "tuyet",
            "xin",
            "chat",
            "trau"
    );

    private static final Set<String> NEGATIVE_WORDS = Set.of(
            "te",
            "xau",
            "kem",
            "loi",
            "hong",
            "hu",
            "lag",
            "giat",
            "do",
            "chan",
            "cui",
            "buc",
            "tuc",
            "phe",
            "cham",
            "tat",
            "mat",
            "xui",
            "sai"
    );

    private static final Set<String> NEGATION_WORDS = Set.of(
            "khong",
            "ko",
            "k",
            "chua",
            "chang",
            "cha"
    );

    private static final Set<String> POSITIVE_EMOJIS = Set.of(
            ":)",
            ":-)",
            ":d",
            "^^",
            "<3",
            "😍",
            "👍",
            "🔥",
            "😊",
            "😄",
            "😁",
            "🙂"
    );

    private static final Set<String> NEGATIVE_EMOJIS = Set.of(
            ":(",
            ":-(",
            "🙁",
            "☹",
            "😞",
            "😡",
            "😢",
            "😭",
            "👎",
            "😒",
            "😤",
            "💀"
    );

    public enum Tone {
        POSITIVE,
        NEGATIVE,
        NEUTRAL
    }

    private ReviewToneRules() {
    }

    public static boolean hasNegativeTone(String value) {
        return detectTone(value) == Tone.NEGATIVE;
    }

    public static boolean hasPositiveTone(String value) {
        return detectTone(value) == Tone.POSITIVE;
    }

    public static Tone detectTone(String value) {
        if (value == null || value.isBlank()) {
            return Tone.NEUTRAL;
        }

        String normalizedText = normalizeText(value);
        List<String> tokens = tokenize(normalizedText);

        int score = 0;
        score += phraseScore(normalizedText, POSITIVE_PHRASES, 3);
        score -= phraseScore(normalizedText, NEGATIVE_PHRASES, 3);
        score += tokenScore(tokens);
        score += emojiScore(value);
        score += punctuationScore(value, score);

        if (score >= 2) {
            return Tone.POSITIVE;
        }
        if (score <= -2) {
            return Tone.NEGATIVE;
        }
        return Tone.NEUTRAL;
    }

    public static boolean isToneAlignedWithRating(Integer rating, String value) {
        Tone tone = detectTone(value);
        if (tone == Tone.NEUTRAL || rating == null) {
            return true;
        }

        if (rating >= 4) {
            return tone != Tone.NEGATIVE;
        }

        if (rating <= 2) {
            return tone != Tone.POSITIVE;
        }

        return true;
    }

    public static String normalizeText(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        normalized = normalized.toLowerCase(Locale.ROOT)
                .replace('_', ' ')
                .replaceAll("[^a-z0-9\\s]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return normalized;
    }

    private static int phraseScore(String normalizedText, List<String> phrases, int weight) {
        int score = 0;
        for (String phrase : phrases) {
            if (normalizedText.contains(phrase)) {
                score += weight;
            }
        }
        return score;
    }

    private static int tokenScore(List<String> tokens) {
        int score = 0;
        for (int index = 0; index < tokens.size(); index++) {
            String token = tokens.get(index);
            if (token.isBlank()) {
                continue;
            }

            if (POSITIVE_WORDS.contains(token)) {
                score += isNegated(tokens, index) ? -1 : 1;
            } else if (NEGATIVE_WORDS.contains(token)) {
                score += isNegated(tokens, index) ? 1 : -1;
            }
        }

        return score;
    }

    private static boolean isNegated(List<String> tokens, int index) {
        int windowStart = Math.max(0, index - 3);
        for (int i = windowStart; i < index; i++) {
            if (NEGATION_WORDS.contains(tokens.get(i))) {
                return true;
            }
        }

        return false;
    }

    private static int emojiScore(String originalText) {
        int score = 0;

        for (String emoji : POSITIVE_EMOJIS) {
            if (originalText.contains(emoji)) {
                score++;
            }
        }

        for (String emoji : NEGATIVE_EMOJIS) {
            if (originalText.contains(emoji)) {
                score--;
            }
        }

        return score;
    }

    private static int punctuationScore(String originalText, int currentScore) {
        long exclamationCount = originalText.chars().filter(character -> character == '!').count();
        if (exclamationCount == 0 || currentScore == 0) {
            return 0;
        }

        return currentScore > 0 ? 1 : -1;
    }

    private static List<String> tokenize(String normalizedText) {
        return Arrays.stream(normalizedText.split("\\s+"))
                .filter(token -> !token.isBlank())
                .toList();
    }
}