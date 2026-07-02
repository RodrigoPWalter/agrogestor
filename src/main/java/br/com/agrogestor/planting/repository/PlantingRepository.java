package br.com.agrogestor.planting.repository;

import br.com.agrogestor.planting.entity.Planting;
import br.com.agrogestor.planting.entity.PlantingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PlantingRepository extends JpaRepository<Planting, UUID> {

    Page<Planting> findByHarvestIgnoreCase(String harvest, Pageable pageable);
    Page<Planting> findByStatus(PlantingStatus status, Pageable pageable);
    Page<Planting> findByHarvestIgnoreCaseAndStatus(
            String harvest, PlantingStatus status, Pageable pageable);

    @Query("select distinct p.harvest from Planting p order by p.harvest desc")
    List<String> findDistinctHarvests();
}
