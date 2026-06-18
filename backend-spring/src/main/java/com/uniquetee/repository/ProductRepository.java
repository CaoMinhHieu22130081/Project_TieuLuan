package com.uniquetee.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.uniquetee.entity.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    @Query("SELECT p FROM Product p JOIN p.category c WHERE c.name = :name")
    List<Product> findByCategoryName(@Param("name") String name);

    List<Product> findByNameContainingIgnoreCase(String name);

    @Query("""
            SELECT p FROM Product p
            LEFT JOIN p.category c
            WHERE p.id <> :productId
              AND p.isActive = true
              AND (
                    (:categoryId IS NOT NULL AND c.id = :categoryId)
                 OR (:type IS NOT NULL AND LOWER(p.type) = LOWER(:type))
              )
            """)
    List<Product> findRecommendationCandidates(
            @Param("productId") Integer productId,
            @Param("categoryId") Integer categoryId,
            @Param("type") String type
    );

    @Query("""
            SELECT p FROM Product p
            WHERE p.id <> :productId
              AND p.isActive = true
            """)
    List<Product> findActiveExcept(@Param("productId") Integer productId);

    List<Product> findByIsActiveTrueOrderBySoldDesc(org.springframework.data.domain.Pageable pageable);

    List<Product> findByIsActiveTrueOrderByIdDesc(org.springframework.data.domain.Pageable pageable);
}
