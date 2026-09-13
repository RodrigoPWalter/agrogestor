package br.com.agrogestor.shared.idempotency;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Executa os mesmos cenários de transação e concorrência no PostgreSQL do CI. */
@EnabledIfEnvironmentVariable(named = "RUN_DATABASE_TESTS", matches = "true")
class PostgresIdempotencyDatabaseTest extends IdempotencyDatabaseTest {

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        String url = System.getenv("DB_URL");
        if (url == null || !url.matches(
                "jdbc:postgresql://(localhost|127\\.0\\.0\\.1):[0-9]+/agrogestor_test")) {
            throw new IllegalStateException(
                    "Use apenas o PostgreSQL local descartável, no banco agrogestor_test");
        }
        registry.add("spring.datasource.url", () -> url + "?currentSchema=idempotency_validation");
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.datasource.username", () -> System.getenv("DB_USERNAME"));
        registry.add("spring.datasource.password", () -> System.getenv("DB_PASSWORD"));
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.default-schema", () -> "idempotency_validation");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }
}
