package br.com.agrogestor.shared.idempotency;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class IdempotencyServiceTest {

    @Test
    void shouldDeleteRecordsOlderThanRetentionPeriod() {
        IdempotencyRecordRepository repository = mock(IdempotencyRecordRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-08-11T12:00:00Z"), ZoneOffset.UTC);
        IdempotencyService service = new IdempotencyService(repository, 90, clock);

        service.discardExpiredRecords();

        verify(repository).deleteCreatedBefore(
                OffsetDateTime.parse("2026-05-13T12:00:00Z"));
    }

    @Test
    void shouldKeepAtLeastOneDayOfProtection() {
        IdempotencyRecordRepository repository = mock(IdempotencyRecordRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-08-11T12:00:00Z"), ZoneOffset.UTC);
        IdempotencyService service = new IdempotencyService(repository, 0, clock);

        service.discardExpiredRecords();

        verify(repository).deleteCreatedBefore(
                OffsetDateTime.parse("2026-08-10T12:00:00Z"));
    }
}
