package com.cloudops.backend.model;

public class Incident {
    private String incidentId;
    private String region;
    private String serviceName;
    private String severity;
    private String status;
    private String createdAt;
    private String summary;

    public Incident() {
    }

    public Incident(String incidentId, String region, String serviceName, String severity, String status, String createdAt, String summary) {
        this.incidentId = incidentId;
        this.region = region;
        this.serviceName = serviceName;
        this.severity = severity;
        this.status = status;
        this.createdAt = createdAt;
        this.summary = summary;
    }

    public String getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(String incidentId) {
        this.incidentId = incidentId;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}