package br.com.agrogestor.weather.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class MetNoClient {

    public static final String SOURCE_URL = "https://www.yr.no/";
    private final RestClient restClient;

    public MetNoClient(RestClient.Builder builder) {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5_000);
        requestFactory.setReadTimeout(10_000);
        restClient = builder
                .baseUrl("https://api.met.no")
                .requestFactory(requestFactory)
                .defaultHeader(
                        "User-Agent",
                        "AgroGestor/1.0 contato: rodrigowalter1234@icloud.com"
                )
                .build();
    }

    public OpenMeteoResponse fetch(double latitude, double longitude, String timezone) {
        JsonNode source = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/weatherapi/locationforecast/2.0/compact")
                        .queryParam("lat", latitude)
                        .queryParam("lon", longitude)
                        .build())
                .retrieve()
                .body(JsonNode.class);

        if (source == null) {
            throw new IllegalStateException("Resposta meteorológica alternativa vazia");
        }

        JsonNode timeseries = source.path("properties").path("timeseries");
        if (!timeseries.isArray() || timeseries.isEmpty()) {
            throw new IllegalStateException("Previsão alternativa sem períodos disponíveis");
        }

        ZoneId zoneId = ZoneId.of(timezone);
        Map<LocalDate, DailyAccumulator> daily = new LinkedHashMap<>();
        for (JsonNode period : timeseries) {
            LocalDate date = OffsetDateTime.parse(period.path("time").asText())
                    .atZoneSameInstant(zoneId)
                    .toLocalDate();
            if (daily.size() >= 5 && !daily.containsKey(date)) {
                continue;
            }

            JsonNode data = period.path("data");
            JsonNode details = data.path("instant").path("details");
            BigDecimal temperature = decimal(details, "air_temperature");
            BigDecimal precipitation = decimal(
                    data.path("next_1_hours").path("details"),
                    "precipitation_amount"
            );
            String symbol = data.path("next_1_hours").path("summary")
                    .path("symbol_code")
                    .asText("");
            daily.computeIfAbsent(date, ignored -> new DailyAccumulator())
                    .add(temperature, precipitation, weatherCode(symbol));
        }

        JsonNode currentData = timeseries.get(0).path("data");
        BigDecimal currentTemperature = decimal(
                currentData.path("instant").path("details"),
                "air_temperature"
        );
        String currentSymbol = currentData.path("next_1_hours").path("summary")
                .path("symbol_code")
                .asText("");

        List<Map.Entry<LocalDate, DailyAccumulator>> days = daily.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .limit(5)
                .toList();

        return new OpenMeteoResponse(
                new OpenMeteoResponse.Current(
                        currentTemperature,
                        currentTemperature,
                        weatherCode(currentSymbol)
                ),
                new OpenMeteoResponse.Daily(
                        days.stream().map(Map.Entry::getKey).toList(),
                        days.stream().map(item -> item.getValue().minimum()).toList(),
                        days.stream().map(item -> item.getValue().maximum()).toList(),
                        days.stream().map(item -> item.getValue().rainProbability()).toList(),
                        days.stream().map(item -> item.getValue().precipitation()).toList(),
                        days.stream().map(item -> item.getValue().weatherCode()).toList()
                )
        );
    }

    private BigDecimal decimal(JsonNode node, String field) {
        return node.has(field)
                ? node.path(field).decimalValue()
                : BigDecimal.ZERO;
    }

    private int weatherCode(String symbol) {
        if (symbol.contains("thunder")) return 95;
        if (symbol.contains("snow")) return 71;
        if (symbol.contains("sleet")) return 66;
        if (symbol.contains("rain")) return 61;
        if (symbol.contains("fog")) return 45;
        if (symbol.contains("cloudy")) return 3;
        if (symbol.contains("fair") || symbol.contains("partlycloudy")) return 2;
        return 0;
    }

    private static final class DailyAccumulator {
        private final List<BigDecimal> temperatures = new ArrayList<>();
        private BigDecimal precipitation = BigDecimal.ZERO;
        private int weatherCode;

        void add(BigDecimal temperature, BigDecimal rain, int code) {
            temperatures.add(temperature);
            precipitation = precipitation.add(rain);
            weatherCode = Math.max(weatherCode, code);
        }

        BigDecimal minimum() {
            return temperatures.stream().min(Comparator.naturalOrder())
                    .orElse(BigDecimal.ZERO);
        }

        BigDecimal maximum() {
            return temperatures.stream().max(Comparator.naturalOrder())
                    .orElse(BigDecimal.ZERO);
        }

        BigDecimal precipitation() {
            return precipitation.setScale(1, RoundingMode.HALF_UP);
        }

        int rainProbability() {
            return precipitation.signum() > 0 ? 100 : 0;
        }

        int weatherCode() {
            return weatherCode;
        }
    }
}
