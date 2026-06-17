package com.uniquetee.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.PromoCode;
import com.uniquetee.entity.User;
import com.uniquetee.entity.UserVoucher;
import com.uniquetee.repository.PromoCodeRepository;
import com.uniquetee.repository.UserRepository;
import com.uniquetee.repository.UserVoucherRepository;

@Service
public class UserVoucherService {

    @Autowired
    private UserVoucherRepository userVoucherRepository;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Autowired
    private UserRepository userRepository;

    public UserVoucher saveVoucher(Integer userId, Integer promoCodeId) {
        if (userId == null || promoCodeId == null) {
            throw new IllegalArgumentException("User ID và PromoCode ID không được để trống");
        }
        if (userVoucherRepository.existsByUserIdAndPromoCodeId(userId, promoCodeId)) {
            throw new RuntimeException("Bạn đã lưu voucher này rồi.");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Không tìm thấy User"));
        PromoCode promo = promoCodeRepository.findById(promoCodeId).orElseThrow(() -> new RuntimeException("Không tìm thấy PromoCode"));

        UserVoucher userVoucher = new UserVoucher();
        userVoucher.setUser(user);
        userVoucher.setPromoCode(promo);
        userVoucher.setStatus("saved");

        return userVoucherRepository.save(userVoucher);
    }

    public List<UserVoucher> getSavedVouchers(Integer userId) {
        return userVoucherRepository.findByUserIdAndStatus(userId, "saved");
    }

    public void markAsUsed(Integer userId, Integer promoCodeId) {
        Optional<UserVoucher> uvOpt = userVoucherRepository.findByUserIdAndPromoCodeId(userId, promoCodeId);
        if (uvOpt.isPresent()) {
            UserVoucher uv = uvOpt.get();
            uv.setStatus("used");
            uv.setUsedAt(LocalDateTime.now());
            userVoucherRepository.save(uv);
        }
    }

    public void markAsUsedByCode(Integer userId, String code) {
        if (userId == null || code == null || code.isBlank()) return;
        promoCodeRepository.findByCode(code).ifPresent(promo ->
            markAsUsed(userId, promo.getId())
        );
    }

    public boolean hasUserExceededLimit(Integer userId, Integer promoCodeId, Integer perUserLimit) {
        if (userId == null || promoCodeId == null || perUserLimit == null) return false;
        long usedCount = userVoucherRepository.countByUserIdAndPromoCodeIdAndStatus(userId, promoCodeId, "used");
        return usedCount >= perUserLimit;
    }
}
