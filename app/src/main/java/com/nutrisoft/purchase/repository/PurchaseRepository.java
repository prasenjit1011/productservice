package com.nutrisoft.purchase.repository;

import com.nutrisoft.purchase.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    boolean existsByCustomerIdAndPurchasedAtAfter(Long customerId, Instant after);

    List<Purchase> findAllByOrderByPurchasedAtDesc();
}
