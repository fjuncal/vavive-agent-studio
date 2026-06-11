package br.com.vavive.gptmaker.dto;

public record LoginResponse(
    String token,
    UserResponse user
) {
}
