package br.com.vavive.gptmaker.integration.gptmaker.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GptMakerCreateIntentRequest(
    String description,
    String type,
    String httpMethod,
    String url,
    boolean autoGenerateParams,
    boolean autoGenerateBody,
    String details,
    String instructions,
    List<GptMakerIntentField> fields,
    List<GptMakerIntentHeader> headers,
    List<GptMakerIntentParam> params,
    List<GptMakerIntentVariable> variables,
    String requestBody
) {
    public record GptMakerIntentField(String name, String jsonName, String description, boolean required) {
    }

    public record GptMakerIntentHeader(String name, String value) {
    }

    public record GptMakerIntentParam(String name, String value) {
    }

    public record GptMakerIntentVariable(String valueExpression, String defaultFieldKey, GptMakerIntentCustomField customField) {
    }

    public record GptMakerIntentCustomField(String id, String name, String description, String jsonName) {
    }
}
