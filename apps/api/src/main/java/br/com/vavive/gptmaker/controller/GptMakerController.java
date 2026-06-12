package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerHealthResponse;
import br.com.vavive.gptmaker.service.GptMakerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GptMakerController {
    private final GptMakerService gptMakerService;

    public GptMakerController(GptMakerService gptMakerService) {
        this.gptMakerService = gptMakerService;
    }

    @GetMapping("/gptmaker/health")
    public GptMakerHealthResponse health() {
        return gptMakerService.health();
    }
}
