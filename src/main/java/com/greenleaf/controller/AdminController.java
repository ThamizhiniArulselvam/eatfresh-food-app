package com.greenleaf.controller;

import com.greenleaf.model.Reservation;
import com.greenleaf.model.Order;
import com.greenleaf.repository.ReservationRepository;
import com.greenleaf.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final ReservationRepository reservationRepository;
    private final OrderRepository orderRepository;

    public AdminController(ReservationRepository reservationRepository,
                           OrderRepository orderRepository) {
        this.reservationRepository = reservationRepository;
        this.orderRepository = orderRepository;
    }

    @GetMapping("/reservations")
    public List<Reservation> getAllReservations() {
      // you can add sorting later if you want
      return reservationRepository.findAll();
    }

    @GetMapping("/orders")
    public List<Order> getAllOrders() {
      return orderRepository.findAll();
    }
}
