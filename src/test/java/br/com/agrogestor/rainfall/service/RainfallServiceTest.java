package br.com.agrogestor.rainfall.service;

import br.com.agrogestor.diary.repository.FieldDiaryRepository;
import br.com.agrogestor.property.entity.Property;
import br.com.agrogestor.property.service.CurrentPropertyService;
import br.com.agrogestor.rainfall.dto.RainfallRequest;
import br.com.agrogestor.rainfall.entity.RainfallMeasurement;
import br.com.agrogestor.rainfall.repository.RainfallRepository;
import br.com.agrogestor.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RainfallServiceTest {

    private static final UUID PROPERTY_ID = UUID.randomUUID();

    @Mock
    private RainfallRepository repository;
    @Mock
    private FieldDiaryRepository diaryRepository;
    @Mock
    private CurrentPropertyService currentProperty;

    private Property property;
    private RainfallService service;

    @BeforeEach
    void setUp() {
        property = new Property("Sítio Walter");
        ReflectionTestUtils.setField(property, "id", PROPERTY_ID);
        when(currentProperty.id()).thenReturn(PROPERTY_ID);
        Clock clock = Clock.fixed(
                Instant.parse("2026-08-31T12:00:00Z"),
                ZoneId.of("America/Sao_Paulo")
        );
        service = new RainfallService(repository, diaryRepository, currentProperty, clock);
    }

    @Test
    void shouldIncludeWholeCurrentMonthInSummaryOnThirtyFirstDay() {
        RainfallMeasurement firstDay = measurement(LocalDate.of(2026, 8, 1), "10.00");
        RainfallMeasurement secondDay = measurement(LocalDate.of(2026, 8, 2), "20.00");
        when(repository.findByPropertyIdAndMeasurementDateGreaterThanEqual(
                PROPERTY_ID, LocalDate.of(2026, 8, 1)))
                .thenReturn(List.of(firstDay, secondDay));
        when(repository.findFirstByPropertyIdOrderByMeasurementDateDesc(PROPERTY_ID))
                .thenReturn(Optional.of(secondDay));

        var summary = service.summary();

        assertThat(summary.currentMonthTotal()).isEqualByComparingTo("30.00");
        assertThat(summary.lastThirtyDaysTotal()).isEqualByComparingTo("20.00");
        assertThat(summary.lastMeasurementDate()).isEqualTo(LocalDate.of(2026, 8, 2));
    }

    @Test
    void shouldMarkRainfallCreatedByDiary() {
        UUID rainfallId = UUID.randomUUID();
        RainfallMeasurement measurement = measurement(LocalDate.of(2026, 8, 10), "8.50");
        ReflectionTestUtils.setField(measurement, "id", rainfallId);
        when(diaryRepository.findRainfallIdsByPropertyId(PROPERTY_ID))
                .thenReturn(List.of(rainfallId));
        when(repository.findByPropertyIdOrderByMeasurementDateDesc(PROPERTY_ID))
                .thenReturn(List.of(measurement));

        var response = service.findAll();

        assertThat(response).singleElement().satisfies(item ->
                assertThat(item.diaryManaged()).isTrue());
    }

    @Test
    void shouldNotUpdateRainfallCreatedByDiary() {
        UUID rainfallId = UUID.randomUUID();
        RainfallMeasurement measurement = measurement(LocalDate.of(2026, 8, 10), "8.50");
        when(repository.findByIdAndPropertyId(rainfallId, PROPERTY_ID))
                .thenReturn(Optional.of(measurement));
        when(diaryRepository.existsByPropertyIdAndRainfallId(PROPERTY_ID, rainfallId))
                .thenReturn(true);

        RainfallRequest request = new RainfallRequest(
                LocalDate.of(2026, 8, 11), new BigDecimal("9.00"), null);

        assertThatThrownBy(() -> service.update(rainfallId, request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Diário");
        assertThat(measurement.getMillimeters()).isEqualByComparingTo("8.50");
    }

    @Test
    void shouldNotDeleteRainfallCreatedByDiary() {
        UUID rainfallId = UUID.randomUUID();
        RainfallMeasurement measurement = measurement(LocalDate.of(2026, 8, 10), "8.50");
        when(repository.findByIdAndPropertyId(rainfallId, PROPERTY_ID))
                .thenReturn(Optional.of(measurement));
        when(diaryRepository.existsByPropertyIdAndRainfallId(PROPERTY_ID, rainfallId))
                .thenReturn(true);

        assertThatThrownBy(() -> service.delete(rainfallId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Diário");
        verify(repository, never()).delete(measurement);
    }

    private RainfallMeasurement measurement(LocalDate date, String millimeters) {
        return new RainfallMeasurement(property, date, new BigDecimal(millimeters), null);
    }
}
