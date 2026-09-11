package br.com.vavive.gptmaker.dto;

import java.util.List;

public record ConversationMessagePageResponse(
    List<ConversationMessageResponse> items,
    int page,
    int pageSize,
    boolean hasMore
) {
}
