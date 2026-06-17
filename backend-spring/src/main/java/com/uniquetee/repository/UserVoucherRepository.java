package com.uniquetee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uniquetee.entity.UserVoucher;

public interface UserVoucherRepository extends JpaRepository<UserVoucher, Integer> {
    List<UserVoucher> findByUserIdAndStatus(Integer userId, String status);
    Optional<UserVoucher> findByUserIdAndPromoCodeId(Integer userId, Integer promoCodeId);
    boolean existsByUserIdAndPromoCodeId(Integer userId, Integer promoCodeId);
    long countByUserIdAndPromoCodeIdAndStatus(Integer userId, Integer promoCodeId, String status);
}
