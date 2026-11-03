package com.nutrisoft.customer.service;

import com.nutrisoft.customer.dto.CustomerRequest;
import com.nutrisoft.customer.dto.CustomerResponse;
import com.nutrisoft.customer.exception.CustomerNotFoundException;
import com.nutrisoft.customer.model.Customer;
import com.nutrisoft.customer.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> list() {
        return customerRepository.findAll().stream()
                .map(CustomerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse get(Long id) {
        return CustomerResponse.from(find(id));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest request) {
        Customer customer = new Customer();
        apply(customer, request);
        return CustomerResponse.from(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer customer = find(id);
        apply(customer, request);
        return CustomerResponse.from(customerRepository.save(customer));
    }

    @Transactional
    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new CustomerNotFoundException(id);
        }
        customerRepository.deleteById(id);
    }

    private Customer find(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new CustomerNotFoundException(id));
    }

    private void apply(Customer customer, CustomerRequest request) {
        customer.setName(request.name());
        customer.setEmail(request.email());
        customer.setPhone(request.phone());
    }
}
