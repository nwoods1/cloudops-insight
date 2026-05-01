package com.cloudops.backend.controller;

import com.cloudops.backend.model.Incident;
import com.cloudops.backend.model.Metric;
import com.cloudops.backend.model.RegionSummary;
import com.cloudops.backend.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public List<Metric> getMetrics() {
        return dashboardService.getAllMetrics();
    }

    @GetMapping("/incidents")
    public List<Incident> getIncidents() {
        return dashboardService.getAllIncidents();
    }

    @GetMapping("/regions/summary")
    public List<RegionSummary> getRegionSummaries() {
        return dashboardService.getRegionSummaries();
    }

    @GetMapping("/incidents/{id}")
    public Incident getIncidentById(@org.springframework.web.bind.annotation.PathVariable String id) {
        return dashboardService.getIncidentById(id);
    }

    @PostMapping("/incidents")
    public void createIncident(@RequestBody Incident incident) {
        dashboardService.createIncident(incident);
    }
}