package br.com.vavive.gptmaker.dto;

public record DashboardSummaryResponse(
    long totalLeads,
    long newLeads,
    long activeLeads,
    long finishedChats,
    double conversionRate
) {
}
