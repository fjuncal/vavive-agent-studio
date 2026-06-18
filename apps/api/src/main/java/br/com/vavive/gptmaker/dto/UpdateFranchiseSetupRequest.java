package br.com.vavive.gptmaker.dto;

public record UpdateFranchiseSetupRequest(
    String franchiseName,
    String document,
    String city,
    String state,
    String responsibleName,
    String services,
    String prices,
    String regions,
    String schedules,
    String faq,
    String rules,
    String toneOfVoice,
    String franchiseWhatsapp
) {
}
