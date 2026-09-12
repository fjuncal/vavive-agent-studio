package br.com.vavive.gptmaker.dto;

import java.util.List;

public record ConversationPageResponse(
    List<ConversationSummaryResponse> items,
    int page,
    int pageSize,
    boolean hasMore
) {
}
