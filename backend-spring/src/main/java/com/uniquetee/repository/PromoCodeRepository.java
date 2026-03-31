package com.uniquetee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.PromoCode;

@Repository
public interface PromoCodeRepository extends JpaRepository<PromoCode, Integer> {
    // Tìm mã khuyến mãi theo code
    Optional<PromoCode> findByCode(String code);

    // Tìm tất cả mã khuyến mãi đang hoạt động
    List<PromoCode> findByIsActiveTrue();

    // Tìm mã khuyến mãi theo trạng thái
    List<PromoCode> findByIsActive(Boolean isActive);
}
