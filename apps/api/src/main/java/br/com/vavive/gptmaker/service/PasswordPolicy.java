package br.com.vavive.gptmaker.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class PasswordPolicy {
    private static final int MIN_LENGTH = 8;

    private PasswordPolicy() {
    }

    public static void requireValid(String password) {
        boolean hasLetter = password != null
            && password.codePoints().anyMatch(Character::isLetter);
        boolean hasNumber = password != null
            && password.codePoints().anyMatch(Character::isDigit);

        if (password == null || password.length() < MIN_LENGTH || !hasLetter || !hasNumber) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A senha deve ter pelo menos 8 caracteres, uma letra e um número."
            );
        }
    }
}
