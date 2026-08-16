package br.com.agrogestor.shared.observability;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RequestCorrelationFilterTest {

    private final RequestCorrelationFilter filter = new RequestCorrelationFilter();

    @Test
    void preservesAValidRequestId() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/health");
        request.addHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, "request-12345678");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER))
                .isEqualTo("request-12345678");
        assertThat(request.getAttribute(RequestCorrelationFilter.REQUEST_ID_ATTRIBUTE))
                .isEqualTo("request-12345678");
    }

    @Test
    void replacesAnUnsafeRequestId() throws Exception {
        var request = new MockHttpServletRequest("GET", "/api/v1/health");
        request.addHeader(RequestCorrelationFilter.REQUEST_ID_HEADER, "valor com espaços");
        var response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER))
                .matches("[0-9a-f-]{36}");
    }
}
