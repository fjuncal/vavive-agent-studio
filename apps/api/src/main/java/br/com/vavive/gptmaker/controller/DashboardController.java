package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.DashboardSummaryResponse;
import br.com.vavive.gptmaker.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.summary();
    }
}
