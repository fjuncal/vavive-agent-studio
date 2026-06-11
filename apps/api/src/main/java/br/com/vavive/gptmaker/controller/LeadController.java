package br.com.vavive.gptmaker.controller;

import br.com.vavive.gptmaker.dto.LeadResponse;
import br.com.vavive.gptmaker.service.LeadService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LeadController {
    private final LeadService leadService;

    public LeadController(LeadService leadService) {
        this.leadService = leadService;
    }

    @GetMapping("/leads")
    public List<LeadResponse> list() {
        return leadService.list();
    }
}
