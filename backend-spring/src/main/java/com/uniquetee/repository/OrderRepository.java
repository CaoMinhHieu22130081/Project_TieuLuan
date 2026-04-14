package com.uniquetee.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    // Query orders by user ID using relationship
    @Query("SELECT o FROM Order o WHERE o.user.id = :userId")
    List<Order> findByUserId(@Param("userId") Integer userId);

    Optional<Order> findByOrderCode(String orderCode);
}
