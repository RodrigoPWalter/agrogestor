package br.com.agrogestor.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI agroGestorOpenApi() {
        return new OpenAPI().info(new Info()
                .title("AgroGestor API")
                .description("API de gerenciamento rural para propriedades agrícolas familiares")
                .version("v1"));
    }
}
