package br.com.agrogestor.task.entity;

public enum FarmTaskUrgency {
    MINIMAL("Mínima"),
    ATTENTION("Atenção"),
    URGENT("Urgente"),
    OVERDUE("Atrasada"),
    COMPLETED("Concluída");

    private final String displayName;

    FarmTaskUrgency(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
