package br.com.agrogestor.diary.controller;

import br.com.agrogestor.diary.dto.FieldDiaryRequest;
import br.com.agrogestor.diary.dto.FieldDiaryResponse;
import br.com.agrogestor.diary.service.FieldDiaryService;
import br.com.agrogestor.shared.dto.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/v1/field-diary")
@Tag(name = "Diário da lavoura", description = "Atividades realizadas em cada plantio")
public class FieldDiaryController {

    private final FieldDiaryService service;

    public FieldDiaryController(FieldDiaryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<FieldDiaryResponse> create(
            @Valid @RequestBody FieldDiaryRequest request
    ) {
        FieldDiaryResponse response = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public PageResponse<FieldDiaryResponse> findAll(
            @RequestParam(required = false) UUID plantingId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return service.findAll(plantingId, page, size);
    }

    @GetMapping("/{id}")
    public FieldDiaryResponse findById(@PathVariable UUID id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public FieldDiaryResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody FieldDiaryRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
