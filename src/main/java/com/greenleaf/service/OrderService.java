package com.greenleaf.service;

import com.greenleaf.dto.OrderItemRequest;
import com.greenleaf.dto.OrderRequest;
import com.greenleaf.model.Order;
import com.greenleaf.model.OrderItem;
import com.greenleaf.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one item.");
        }

        Order order = new Order();
        order.setCustomerName(
                request.getCustomerName() == null || request.getCustomerName().isBlank()
                        ? "Guest"
                        : request.getCustomerName()
        );
        order.setPhone(request.getPhone());
        order.setEmail(request.getEmail());
        order.setNotes(request.getNotes());

        List<OrderItem> items = new ArrayList<>();
        double total = 0.0;

        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                continue;
            }
            double price = itemReq.getPrice() != null ? itemReq.getPrice() : 0.0;
            double lineTotal = price * itemReq.getQuantity();
            total += lineTotal;

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setItemName(itemReq.getName());
            oi.setUnitPrice(price);
            oi.setQuantity(itemReq.getQuantity());
            oi.setLineTotal(lineTotal);

            items.add(oi);
        }

        if (items.isEmpty()) {
            throw new IllegalArgumentException("Order items are invalid.");
        }

        order.setItems(items);
        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    public Order getOrder(Long id) {
        return orderRepository.findById(id).orElse(null);
    }
}
