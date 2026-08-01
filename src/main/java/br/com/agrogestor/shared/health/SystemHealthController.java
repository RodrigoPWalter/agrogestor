package br.com.agrogestor.shared.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class SystemHealthController {

    @GetMapping
    public HealthResponse check() {
        return new HealthResponse("UP");
    }
}
