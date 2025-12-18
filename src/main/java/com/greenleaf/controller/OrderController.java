package com.greenleaf.controller;

import com.greenleaf.dto.OrderRequest;
import com.greenleaf.model.Order;
import com.greenleaf.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody OrderRequest request) {
        try {
            Order saved = orderService.createOrder(request);
            // Return only ID + total so response is small
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Order placed successfully. Order ID: " + saved.getId() +
                          ", Total: ₹" + saved.getTotalAmount());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error placing order: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Order order = orderService.getOrder(id);
        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
        }
        return ResponseEntity.ok(order);
    }
}
