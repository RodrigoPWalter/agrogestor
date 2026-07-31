ALTER TABLE planting_steps
    ADD COLUMN seed_variety VARCHAR(120);

UPDATE planting_steps AS step
SET seed_variety = planting.seed_variety
FROM plantings AS planting
WHERE step.planting_id = planting.id
  AND step.seed_variety IS NULL;
