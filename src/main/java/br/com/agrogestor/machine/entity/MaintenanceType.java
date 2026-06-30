package br.com.agrogestor.machine.entity;

public enum MaintenanceType {
    PREVENTIVE("Preventiva"),
    CORRECTIVE("Corretiva");

    private final String displayName;

    MaintenanceType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
