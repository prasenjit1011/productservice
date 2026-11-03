package com.nutrisoft.purchase.service;

import com.nutrisoft.customer.exception.CustomerNotFoundException;
import com.nutrisoft.customer.repository.CustomerRepository;
import com.nutrisoft.product.exception.ProductNotFoundException;
import com.nutrisoft.product.model.Product;
import com.nutrisoft.product.repository.ProductRepository;
import com.nutrisoft.purchase.dto.PurchaseRequest;
import com.nutrisoft.purchase.dto.PurchaseResponse;
import com.nutrisoft.purchase.exception.InsufficientStockException;
import com.nutrisoft.purchase.exception.PurchaseLimitExceededException;
import com.nutrisoft.purchase.model.Purchase;
import com.nutrisoft.purchase.repository.PurchaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PurchaseService {

    private static final int PURCHASE_COOLDOWN_MINUTES = 45;

    private final PurchaseRepository purchaseRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    public PurchaseService(
            PurchaseRepository purchaseRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository
    ) {
        this.purchaseRepository = purchaseRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseResponse> list() {
        return purchaseRepository.findAllByOrderByPurchasedAtDesc().stream()
                .map(PurchaseResponse::from)
                .toList();
    }

    @Transactional
    public PurchaseResponse buy(PurchaseRequest request) {
        if (!customerRepository.existsById(request.customerId())) {
            throw new CustomerNotFoundException(request.customerId());
        }

        Instant cooldownStart = Instant.now().minus(PURCHASE_COOLDOWN_MINUTES, ChronoUnit.MINUTES);
        if (purchaseRepository.existsByCustomerIdAndPurchasedAtAfter(request.customerId(), cooldownStart)) {
            throw new PurchaseLimitExceededException(request.customerId());
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ProductNotFoundException(request.productId()));
        if (product.getStock() == null || product.getStock() < 1) {
            throw new InsufficientStockException(product.getId());
        }

        product.setStock(product.getStock() - 1);
        productRepository.save(product);

        Purchase purchase = new Purchase();
        purchase.setCustomerId(request.customerId());
        purchase.setProductId(request.productId());
        purchase.setPurchasedAt(Instant.now());
        return PurchaseResponse.from(purchaseRepository.save(purchase));
    }
}
