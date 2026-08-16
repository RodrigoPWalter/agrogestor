package br.com.agrogestor.shared.exception;

import java.time.OffsetDateTime;
import java.util.Map;

public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        String requestId,
        Map<String, String> fieldErrors
) {
}
