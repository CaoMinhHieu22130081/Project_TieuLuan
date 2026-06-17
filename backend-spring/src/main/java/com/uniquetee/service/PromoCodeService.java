package com.uniquetee.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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

    @Autowired
    @Lazy
    private UserVoucherService userVoucherService;

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
            if (promoProcodeDetails.getVoucherType() != null) {
                existingPromo.setVoucherType(promoProcodeDetails.getVoucherType());
            }
            if (promoProcodeDetails.getMaxDiscountAmount() != null) {
                existingPromo.setMaxDiscountAmount(promoProcodeDetails.getMaxDiscountAmount());
            }
            if (promoProcodeDetails.getStartAt() != null) {
                existingPromo.setStartAt(promoProcodeDetails.getStartAt());
            }
            if (promoProcodeDetails.getPerUserLimit() != null) {
                existingPromo.setPerUserLimit(promoProcodeDetails.getPerUserLimit());
            }
            if (promoProcodeDetails.getDescription() != null) {
                existingPromo.setDescription(promoProcodeDetails.getDescription());
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

        if (promoCode.getStartAt() != null && promoCode.getStartAt().isAfter(LocalDateTime.now())) {
            return false;
        }

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
        } else if ("free_shipping".equals(promoCode.getDiscountType())) {
            // free_shipping cần shippingFee làm baseAmount, không phải orderTotal
            // Dùng calculateSpecificDiscount(code, shippingFee, "FREE_SHIPPING") thay thế
            discount = BigDecimal.ZERO;
        }

        if (promoCode.getMaxDiscountAmount() != null && discount.compareTo(promoCode.getMaxDiscountAmount()) > 0) {
            discount = promoCode.getMaxDiscountAmount();
        }

        return discount;
    }

    /**
     * Tính toán giảm giá cụ thể theo loại
     */
    public BigDecimal calculateSpecificDiscount(String code, BigDecimal baseAmount, String requiredType) {
        Optional<PromoCode> promo = promoCodeRepository.findByCode(code);
        if (promo.isEmpty() || !isPromoCodeValid(code)) {
            return BigDecimal.ZERO;
        }
        PromoCode promoCode = promo.get();
        if (!requiredType.equals(promoCode.getVoucherType())) {
            return BigDecimal.ZERO;
        }

        if (promoCode.getMinOrder() != null && baseAmount.compareTo(promoCode.getMinOrder()) < 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("percent".equals(promoCode.getDiscountType())) {
            discount = baseAmount.multiply(promoCode.getDiscountValue()).divide(new BigDecimal("100"));
        } else if ("fixed".equals(promoCode.getDiscountType())) {
            discount = promoCode.getDiscountValue();
        } else if ("free_shipping".equals(promoCode.getDiscountType())) {
            discount = baseAmount; 
        }

        if (promoCode.getMaxDiscountAmount() != null && discount.compareTo(promoCode.getMaxDiscountAmount()) > 0) {
            discount = promoCode.getMaxDiscountAmount();
        }

        return discount;
    }

    /**
     * API applyVoucher tổng
     */
    public com.uniquetee.dto.ApplyVoucherResponse applyVoucher(com.uniquetee.dto.ApplyVoucherRequest request) {
        BigDecimal productDiscount = BigDecimal.ZERO;
        BigDecimal shippingDiscount = BigDecimal.ZERO;
        String appliedCode = null;
        String appliedShippingCode = null;

        BigDecimal subtotal = request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO;
        BigDecimal shippingFee = request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO;

        if (request.getCode() != null && !request.getCode().isEmpty()) {
            productDiscount = calculateSpecificDiscount(request.getCode(), subtotal, "PRODUCT_DISCOUNT");
            if (productDiscount.compareTo(BigDecimal.ZERO) > 0) {
                // Kiểm tra perUserLimit nếu có userId
                if (request.getUserId() != null) {
                    Optional<PromoCode> promo = promoCodeRepository.findByCode(request.getCode());
                    if (promo.isPresent() && promo.get().getPerUserLimit() != null) {
                        boolean exceeded = userVoucherService.hasUserExceededLimit(
                            request.getUserId(), promo.get().getId(), promo.get().getPerUserLimit());
                        if (exceeded) {
                            productDiscount = BigDecimal.ZERO;
                        } else {
                            appliedCode = request.getCode();
                        }
                    } else {
                        appliedCode = request.getCode();
                    }
                } else {
                    appliedCode = request.getCode();
                }
            }
        }

        if (request.getShippingCode() != null && !request.getShippingCode().isEmpty()) {
            shippingDiscount = calculateSpecificDiscount(request.getShippingCode(), shippingFee, "FREE_SHIPPING");
            if (shippingDiscount.compareTo(BigDecimal.ZERO) > 0) {
                // Kiểm tra perUserLimit nếu có userId
                if (request.getUserId() != null) {
                    Optional<PromoCode> promo = promoCodeRepository.findByCode(request.getShippingCode());
                    if (promo.isPresent() && promo.get().getPerUserLimit() != null) {
                        boolean exceeded = userVoucherService.hasUserExceededLimit(
                            request.getUserId(), promo.get().getId(), promo.get().getPerUserLimit());
                        if (exceeded) {
                            shippingDiscount = BigDecimal.ZERO;
                        } else {
                            appliedShippingCode = request.getShippingCode();
                        }
                    } else {
                        appliedShippingCode = request.getShippingCode();
                    }
                } else {
                    appliedShippingCode = request.getShippingCode();
                }
            }
        }

        String message = (appliedCode != null || appliedShippingCode != null) ? "Áp dụng thành công" : "Mã không hợp lệ hoặc chưa đủ điều kiện";
        return new com.uniquetee.dto.ApplyVoucherResponse(productDiscount, shippingDiscount, appliedCode, appliedShippingCode, message);
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
