package br.com.vavive.gptmaker.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record ContactResponse(
    String id,
    String name,
    Long birthday,
    String gender,
    String picture,
    String phone,
    String email,
    String jobTitle,
    String recipient,
    JsonNode customFieldValues
) {
}
