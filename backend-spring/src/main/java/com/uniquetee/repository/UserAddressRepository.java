package com.uniquetee.repository;

import com.uniquetee.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Integer> {

    List<UserAddress> findByUserIdOrderByIsDefaultDescUpdatedAtDesc(Integer userId);

    Optional<UserAddress> findByIdAndUserId(Integer id, Integer userId);

    Optional<UserAddress> findByUserIdAndIsDefaultTrue(Integer userId);

    boolean existsByUserId(Integer userId);

    @Modifying
    @Query("UPDATE UserAddress a SET a.isDefault = false WHERE a.user.id = :userId")
    void clearDefaultByUserId(@Param("userId") Integer userId);
    
    Optional<UserAddress> findFirstByUserIdOrderByUpdatedAtDesc(Integer userId);
}
