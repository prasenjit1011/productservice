package com.nutrisoft.purchase.dto;

import jakarta.validation.constraints.NotNull;

public record PurchaseRequest(
        @NotNull Long customerId,
        @NotNull Long productId
) {
}
