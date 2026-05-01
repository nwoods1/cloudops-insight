package com.cloudops.backend.model;

public class Metric {
    private String metricId;
    private String region;
    private String serviceName;
    private String timestamp;
    private double avgLatency;
    private double errorRate;
    private double uptime;

    public Metric(String metricId, String region, String serviceName, String timestamp, double avgLatency, double errorRate, double uptime) {
        this.metricId = metricId;
        this.region = region;
        this.serviceName = serviceName;
        this.timestamp = timestamp;
        this.avgLatency = avgLatency;
        this.errorRate = errorRate;
        this.uptime = uptime;
    }

    public String getMetricId() {
        return metricId;
    }

    public String getRegion() {
        return region;
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public double getAvgLatency() {
        return avgLatency;
    }

    public double getErrorRate() {
        return errorRate;
    }

    public double getUptime() {
        return uptime;
    }
}