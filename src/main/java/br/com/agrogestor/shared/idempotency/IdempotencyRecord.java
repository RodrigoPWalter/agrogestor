package br.com.agrogestor.shared.idempotency;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(
        name = "idempotency_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_idempotency_user_key",
                columnNames = {"username", "request_key"}
        )
)
public class IdempotencyRecord {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 254)
    private String username;

    @Column(name = "request_key", nullable = false, length = 100)
    private String requestKey;

    @Column(name = "request_method", nullable = false, length = 10)
    private String requestMethod;

    @Column(name = "request_path", nullable = false, length = 500)
    private String requestPath;

    @Column(name = "response_status", nullable = false)
    private Integer responseStatus;

    @Column(name = "response_content_type", length = 120)
    private String responseContentType;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected IdempotencyRecord() {
    }

    public IdempotencyRecord(
            String username,
            String requestKey,
            String requestMethod,
            String requestPath,
            int responseStatus,
            String responseContentType,
            String responseBody
    ) {
        this.username = username;
        this.requestKey = requestKey;
        this.requestMethod = requestMethod;
        this.requestPath = requestPath;
        this.responseStatus = responseStatus;
        this.responseContentType = responseContentType;
        this.responseBody = responseBody;
    }

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public String getRequestMethod() {
        return requestMethod;
    }

    public String getUsername() {
        return username;
    }

    public String getRequestKey() {
        return requestKey;
    }

    public String getRequestPath() {
        return requestPath;
    }

    public int getResponseStatus() {
        return responseStatus;
    }

    public String getResponseContentType() {
        return responseContentType;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
