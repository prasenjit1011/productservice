package com.nutrisoft.purchase.exception;

public class PurchaseLimitExceededException extends RuntimeException {

    public PurchaseLimitExceededException(Long customerId) {
        super("Customer " + customerId + " can buy only 1 product within 45 minutes");
    }
}
