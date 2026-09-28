package br.com.agrogestor.task.entity;

public enum FarmTaskStatus {
    PENDING("Pendente"),
    IN_PROGRESS("Em andamento"),
    COMPLETED("Concluída");

    private final String displayName;

    FarmTaskStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
