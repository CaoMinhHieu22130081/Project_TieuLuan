package com.uniquetee.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "user_vouchers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "promo_code_id"})
)
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "promo_code_id", nullable = false)
    private PromoCode promoCode;

    @Column(name = "saved_at")
    private LocalDateTime savedAt = LocalDateTime.now();

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "status")
    private String status = "saved"; 
    // saved, used, expired

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public PromoCode getPromoCode() { return promoCode; }
    public void setPromoCode(PromoCode promoCode) { this.promoCode = promoCode; }

    public LocalDateTime getSavedAt() { return savedAt; }
    public void setSavedAt(LocalDateTime savedAt) { this.savedAt = savedAt; }

    public LocalDateTime getUsedAt() { return usedAt; }
    public void setUsedAt(LocalDateTime usedAt) { this.usedAt = usedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
