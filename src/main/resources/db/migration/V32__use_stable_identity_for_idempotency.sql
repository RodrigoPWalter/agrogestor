-- A coluna mantém o nome legado, mas os novos registros usam o UUID do usuário.
-- Sem prova de que a conta manteve o e-mail desde o registro, preservamos o
-- histórico sem reassociá-lo. Reenvios ambíguos exigem conferência, não repetição.
UPDATE idempotency_records AS receipt
SET username = CAST(owner.id AS VARCHAR(254))
FROM usuarios AS owner
WHERE LOWER(receipt.username) = LOWER(owner.email)
  AND owner.created_at <= receipt.created_at
  AND owner.updated_at <= receipt.created_at
  AND NOT EXISTS (
      SELECT 1 FROM idempotency_records AS existing
      WHERE existing.id <> receipt.id
        AND existing.request_key = receipt.request_key
        AND (existing.username = CAST(owner.id AS VARCHAR(254))
             OR LOWER(existing.username) = LOWER(owner.email))
  );
