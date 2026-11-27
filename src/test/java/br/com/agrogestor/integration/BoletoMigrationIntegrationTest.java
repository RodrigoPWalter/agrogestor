package br.com.agrogestor.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.sql.DriverManager;

import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfEnvironmentVariable(named = "RUN_DATABASE_TESTS", matches = "true")
class BoletoMigrationIntegrationTest {
    @Test
    void migrationPreservesExistingPurchaseAndObservation() throws Exception {
        String url = System.getenv("DB_URL");
        String username = System.getenv("DB_USERNAME");
        String password = System.getenv("DB_PASSWORD");
        String schema = "boleto_migration_test";
        try (var connection = DriverManager.getConnection(url, username, password);
             var statement = connection.createStatement()) {
            Flyway.configure().dataSource(url, username, password).schemas(schema)
                    .target("33").load().migrate();
            statement.execute("""
                    INSERT INTO boleto_migration_test.field_diary_entries
                      (id, property_id, entry_date, activity_type, activity, created_at, updated_at)
                    VALUES
                      ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
                       '2026-01-01', 'PRODUCT_PURCHASE', 'Compra anterior', now(), now()),
                      ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
                       '2026-01-01', 'OBSERVATION', 'Observação anterior', now(), now())
                    """);
            Flyway.configure().dataSource(url, username, password).schemas(schema).load().migrate();
            try (var result = statement.executeQuery("""
                    SELECT count(*) FROM boleto_migration_test.field_diary_entries
                    WHERE activity IN ('Compra anterior', 'Observação anterior')
                      AND boleto_due_date IS NULL AND boleto_name IS NULL AND boleto_paid = false
                    """)) {
                assertThat(result.next()).isTrue();
                assertThat(result.getInt(1)).isEqualTo(2);
            }
        }
    }
}
