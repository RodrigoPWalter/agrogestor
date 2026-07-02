package br.com.agrogestor.diary.repository;

import br.com.agrogestor.diary.entity.FieldDiaryProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FieldDiaryProductRepository
        extends JpaRepository<FieldDiaryProduct, UUID> {
    List<FieldDiaryProduct> findByEntryId(UUID entryId);
    void deleteByEntryId(UUID entryId);
}
