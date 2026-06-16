package br.com.vavive.gptmaker.dto;

public record ConversationMessageResponse(
    String id,
    String role,
    String type,
    String text,
    String userName,
    String userPicture,
    String imageUrl,
    String audioUrl,
    String documentUrl,
    String fileName,
    String mediaContent,
    Long time,
    Integer width,
    Integer height
) {
}
