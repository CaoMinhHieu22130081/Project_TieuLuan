package com.uniquetee.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.PromoCode;
import com.uniquetee.repository.PromoCodeRepository;

/**
 * Service quản lý Mã khuyến mãi
 */
@Service
public class PromoCodeService {

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    /**
     * Lấy tất cả mã khuyến mãi
     */
    public List<PromoCode> getAllPromoCodes() {
        return promoCodeRepository.findAll();
    }

    /**
     * Lấy mã khuyến mãi theo ID
     */
    public Optional<PromoCode> getPromoCodeById(Integer id) {
        return promoCodeRepository.findById(id);
    }

    /**
     * Lấy mã khuyến mãi theo code
     */
    public Optional<PromoCode> getPromoCodeByCode(String code) {
        return promoCodeRepository.findByCode(code);
    }

    /**
     * Lấy tất cả mã khuyến mãi đang hoạt động
     */
    public List<PromoCode> getActivePromoCodes() {
        return promoCodeRepository.findByIsActiveTrue();
    }

    /**
     * Tạo mã khuyến mãi mới
     */
    public PromoCode createPromoCode(PromoCode promoCode) {
        return promoCodeRepository.save(promoCode);
    }

    /**
     * Cập nhật mã khuyến mãi
     */
    public PromoCode updatePromoCode(Integer id, PromoCode promoProcodeDetails) {
        Optional<PromoCode> promoCode = promoCodeRepository.findById(id);
        if (promoCode.isPresent()) {
            PromoCode existingPromo = promoCode.get();
            if (promoProcodeDetails.getCode() != null) {
                existingPromo.setCode(promoProcodeDetails.getCode());
            }
            if (promoProcodeDetails.getDiscountType() != null) {
                existingPromo.setDiscountType(promoProcodeDetails.getDiscountType());
            }
            if (promoProcodeDetails.getDiscountValue() != null) {
                existingPromo.setDiscountValue(promoProcodeDetails.getDiscountValue());
            }
            if (promoProcodeDetails.getMinOrder() != null) {
                existingPromo.setMinOrder(promoProcodeDetails.getMinOrder());
            }
            if (promoProcodeDetails.getMaxUses() != null) {
                existingPromo.setMaxUses(promoProcodeDetails.getMaxUses());
            }
            if (promoProcodeDetails.getExpiresAt() != null) {
                existingPromo.setExpiresAt(promoProcodeDetails.getExpiresAt());
            }
            if (promoProcodeDetails.getIsActive() != null) {
                existingPromo.setIsActive(promoProcodeDetails.getIsActive());
            }
            return promoCodeRepository.save(existingPromo);
        }
        return null;
    }

    /**
     * Xoá mã khuyến mãi
     */
    public void deletePromoCode(Integer id) {
        promoCodeRepository.deleteById(id);
    }

    /**
     * Kiểm tra mã khuyến mãi còn hợp lệ hay không
     */
    public boolean isPromoCodeValid(String code) {
        Optional<PromoCode> promo = promoCodeRepository.findByCode(code);
        if (promo.isEmpty() || !promo.get().getIsActive()) {
            return false;
        }

        PromoCode promoCode = promo.get();

        // Kiểm tra hết hạn
        if (promoCode.getExpiresAt() != null && promoCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }

        // Kiểm tra đã sử dụng hết không
        if (promoCode.getMaxUses() != null && promoCode.getUsedCount() >= promoCode.getMaxUses()) {
            return false;
        }

        return true;
    }

    /**
     * Tính giá trị giảm giá
     */
    public BigDecimal calculateDiscount(String code, BigDecimal orderTotal) {
        Optional<PromoCode> promo = promoCodeRepository.findByCode(code);
        if (promo.isEmpty() || !isPromoCodeValid(code)) {
            return BigDecimal.ZERO;
        }

        PromoCode promoCode = promo.get();

        // Kiểm tra đơn hàng tối thiểu
        if (promoCode.getMinOrder() != null && orderTotal.compareTo(promoCode.getMinOrder()) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("percent".equals(promoCode.getDiscountType())) {
            // Giảm giá theo phần trăm
            discount = orderTotal.multiply(promoCode.getDiscountValue()).divide(new BigDecimal("100"));
        } else if ("fixed".equals(promoCode.getDiscountType())) {
            // Giảm giá cố định
            discount = promoCode.getDiscountValue();
        }

        return discount;
    }

    /**
     * Sử dụng mã khuyến mãi (tăng lượt sử dụng)
     */
    public void usePromoCode(String code) {
        Optional<PromoCode> promo = promoCodeRepository.findByCode(code);
        if (promo.isPresent()) {
            PromoCode promoCode = promo.get();
            promoCode.setUsedCount(promoCode.getUsedCount() + 1);
            promoCodeRepository.save(promoCode);
        }
    }

    /**
     * Đếm số mã khuyến mãi
     */
    public long countPromoCodes() {
        return promoCodeRepository.count();
    }
}
