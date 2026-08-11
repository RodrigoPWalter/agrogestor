package br.com.agrogestor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AgroGestorApplication {

    public static void main(String[] args) {
        SpringApplication.run(AgroGestorApplication.class, args);
    }
}
