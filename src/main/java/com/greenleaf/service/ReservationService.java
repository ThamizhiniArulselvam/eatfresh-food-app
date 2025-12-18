package com.greenleaf.service;

import com.greenleaf.model.Reservation;
import com.greenleaf.repository.ReservationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;

    private static final LocalTime OPEN_TIME = LocalTime.of(11, 0);  // 11:00
    private static final LocalTime CLOSE_TIME = LocalTime.of(23, 0); // 23:00
    private static final int DURATION_MINUTES = 90; // 1.5 hours

    public ReservationService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    public Reservation createReservation(Reservation request) {
        LocalDate date = request.getReservationDate();
        LocalTime startTime = request.getStartTime();

        if (date == null || startTime == null || request.getTableNumber() == null) {
            throw new IllegalArgumentException("Date, start time and table number are required.");
        }

        // Calculate end time = start + 90 mins
        LocalTime endTime = startTime.plusMinutes(DURATION_MINUTES);
        request.setEndTime(endTime);

        // 1) Validate time within 11:00–23:00 window
        if (startTime.isBefore(OPEN_TIME) || endTime.isAfter(CLOSE_TIME)) {
            throw new IllegalArgumentException(
                    "Reservations are allowed only between 11:00 AM and 11:00 PM (1.5 hours per reservation)."
            );
        }

        // 2) Check for conflicts for same date + same table
        List<Reservation> existing = reservationRepository
                .findByReservationDateAndTableNumber(date, request.getTableNumber());

        boolean conflict = existing.stream().anyMatch(r -> {
            LocalTime existingStart = r.getStartTime();
            LocalTime existingEnd = r.getEndTime();
            // Overlap if newStart < existingEnd && newEnd > existingStart
            return startTime.isBefore(existingEnd) && endTime.isAfter(existingStart);
        });

        if (conflict) {
            throw new IllegalStateException(
                    "This table is already reserved at this time. Kindly choose another table or time."
            );
        }

        return reservationRepository.save(request);
    }
}



