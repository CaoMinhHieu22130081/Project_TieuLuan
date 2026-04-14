package com.uniquetee.validation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class ReviewToneRulesTest {

    @Test
    void shouldDetectPositiveReviewText() {
        assertEquals(ReviewToneRules.Tone.POSITIVE, ReviewToneRules.detectTone("Sản phẩm rất tốt, mình rất hài lòng"));
    }

    @Test
    void shouldDetectNegativeReviewText() {
        assertEquals(ReviewToneRules.Tone.NEGATIVE, ReviewToneRules.detectTone("Sản phẩm quá tệ, mình rất thất vọng"));
    }

    @Test
    void shouldTreatNegatedPositiveAsNegative() {
        assertEquals(ReviewToneRules.Tone.NEGATIVE, ReviewToneRules.detectTone("Sản phẩm không tốt chút nào"));
    }

    @Test
    void shouldRejectPositiveContentWithLowRating() {
        assertFalse(ReviewToneRules.isToneAlignedWithRating(1, "Sản phẩm rất tốt, mình rất hài lòng"));
    }

    @Test
    void shouldRejectNegativeContentWithHighRating() {
        assertFalse(ReviewToneRules.isToneAlignedWithRating(5, "Sản phẩm quá tệ, mình rất thất vọng"));
    }

    @Test
    void shouldAllowNeutralRatingForNeutralContent() {
        assertTrue(ReviewToneRules.isToneAlignedWithRating(3, "Giao hàng ổn, đóng gói bình thường"));
    }
}