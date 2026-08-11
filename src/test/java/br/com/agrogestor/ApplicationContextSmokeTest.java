package br.com.agrogestor;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:agrogestor;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "agrogestor.security.jwt-secret=test-secret-with-at-least-32-characters",
        "agrogestor.security.cors-allowed-origins=http://localhost:5173",
        "agrogestor.security.bootstrap-admin.enabled=false"
})
@ActiveProfiles("production")
class ApplicationContextSmokeTest {

    @Test
    void contextLoads() {
    }
}
