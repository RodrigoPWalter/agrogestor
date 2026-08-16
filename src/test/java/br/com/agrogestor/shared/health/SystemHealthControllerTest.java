package br.com.agrogestor.shared.health;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SystemHealthControllerTest {

    @Test
    void returnsUpWhenTheDatabaseIsAvailable() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject("select 1", Integer.class)).thenReturn(1);
        var mockMvc = MockMvcBuilders
                .standaloneSetup(new SystemHealthController(jdbcTemplate))
                .build();

        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"));
    }

    @Test
    void returnsServiceUnavailableWhenTheDatabaseIsDown() throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject("select 1", Integer.class))
                .thenThrow(new IllegalStateException("sem conexão"));
        var mockMvc = MockMvcBuilders
                .standaloneSetup(new SystemHealthController(jdbcTemplate))
                .build();

        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"))
                .andExpect(jsonPath("$.database").value("DOWN"));
    }
}
