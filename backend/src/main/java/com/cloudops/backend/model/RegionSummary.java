package com.cloudops.backend.model;

public class RegionSummary {
    private String region;
    private double avgLatency;
    private int activeIncidents;
    private double uptime;

    public RegionSummary(String region, double avgLatency, int activeIncidents, double uptime) {
        this.region = region;
        this.avgLatency = avgLatency;
        this.activeIncidents = activeIncidents;
        this.uptime = uptime;
    }

    public String getRegion() {
        return region;
    }

    public double getAvgLatency() {
        return avgLatency;
    }

    public int getActiveIncidents() {
        return activeIncidents;
    }

    public double getUptime() {
        return uptime;
    }
}