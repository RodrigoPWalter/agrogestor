package br.com.agrogestor.diary.repository;

import br.com.agrogestor.diary.entity.FieldDiaryEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FieldDiaryRepository extends JpaRepository<FieldDiaryEntry, UUID> {
    Page<FieldDiaryEntry> findByPlantingId(UUID plantingId, Pageable pageable);
}
