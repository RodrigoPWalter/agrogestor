package br.com.agrogestor.shared.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class SystemHealthController {

    private static final Logger LOGGER = LoggerFactory.getLogger(SystemHealthController.class);
    private final JdbcTemplate jdbcTemplate;

    public SystemHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<HealthResponse> check() {
        try {
            Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);
            if (Integer.valueOf(1).equals(result)) {
                return ResponseEntity.ok(new HealthResponse("UP", "UP"));
            }
        } catch (RuntimeException exception) {
            LOGGER.warn("A verificação de saúde não conseguiu acessar o banco: {}",
                    exception.getMessage());
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new HealthResponse("DOWN", "DOWN"));
    }
}
