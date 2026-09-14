package br.com.vavive.gptmaker.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class FranchiseInactiveException extends ResponseStatusException {
    public FranchiseInactiveException() {
        super(HttpStatus.FORBIDDEN, "Esta franquia está inativa.");
    }
}
