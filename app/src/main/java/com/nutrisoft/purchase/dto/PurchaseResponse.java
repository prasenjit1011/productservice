package com.nutrisoft.purchase.dto;

import com.nutrisoft.purchase.model.Purchase;

import java.time.Instant;

public record PurchaseResponse(
        Long id,
        Long customerId,
        Long productId,
        Instant purchasedAt
) {
    public static PurchaseResponse from(Purchase purchase) {
        return new PurchaseResponse(
                purchase.getId(),
                purchase.getCustomerId(),
                purchase.getProductId(),
                purchase.getPurchasedAt()
        );
    }
}
