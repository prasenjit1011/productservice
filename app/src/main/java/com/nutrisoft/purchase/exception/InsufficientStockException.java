package com.nutrisoft.purchase.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(Long productId) {
        super("Product out of stock: " + productId);
    }
}
