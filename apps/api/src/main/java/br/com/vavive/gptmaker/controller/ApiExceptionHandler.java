package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.service.FranchiseInactiveException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String code = exception instanceof FranchiseInactiveException ? "FRANCHISE_INACTIVE" : null;
        return ResponseEntity.status(status).body(buildBody(status, exception.getReason(), code));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String message = fieldError == null
            ? "Dados invalidos."
            : "Campo invalido: " + fieldError.getField() + ".";
        return ResponseEntity.badRequest().body(buildBody(HttpStatus.BAD_REQUEST, message, null));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableMessage(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(buildBody(HttpStatus.BAD_REQUEST, "Dados invalidos.", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpectedException(Exception exception) {
        return ResponseEntity.internalServerError().body(buildBody(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Nao foi possivel concluir a solicitacao.",
            null
        ));
    }

    private Map<String, Object> buildBody(HttpStatus status, String message, String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message == null || message.isBlank() ? "Nao foi possivel concluir a solicitacao." : message);
        if (code != null) {
            body.put("code", code);
        }
        body.put("timestamp", LocalDateTime.now());
        return body;
    }
}
