package com.greenleaf.repository;

import com.greenleaf.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByReservationDateAndTableNumber(LocalDate reservationDate, Integer tableNumber);
}


