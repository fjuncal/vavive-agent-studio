package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.DefaultAgentText;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.CreateDefaultAgentTextRequest;
import br.com.vavive.gptmaker.dto.DefaultAgentTextResponse;
import br.com.vavive.gptmaker.dto.UpdateDefaultAgentTextRequest;
import br.com.vavive.gptmaker.repository.DefaultAgentTextRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DefaultAgentTextService {
    private final DefaultAgentTextRepository repository;
    private final CurrentUserService currentUserService;

    public DefaultAgentTextService(DefaultAgentTextRepository repository, CurrentUserService currentUserService) {
        this.repository = repository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<DefaultAgentTextResponse> list() {
        var user = currentUserService.requireCurrentUser();
        List<DefaultAgentText> texts = user.getRole() == UserRole.SUPER_ADMIN
            ? repository.findAllByOrderByCategoryAscTitleAsc()
            : repository.findByActiveTrueOrderByCategoryAscTitleAsc();
        return texts.stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public DefaultAgentTextResponse create(CreateDefaultAgentTextRequest request) {
        requireSuperAdmin();
        DefaultAgentText text = new DefaultAgentText(
            request.title().trim(),
            request.category(),
            request.content().trim(),
            request.active() == null || request.active()
        );
        return toResponse(repository.save(text));
    }

    @Transactional
    public DefaultAgentTextResponse update(UUID id, UpdateDefaultAgentTextRequest request) {
        requireSuperAdmin();
        DefaultAgentText text = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Texto padrao nao encontrado"));
        text.setTitle(request.title().trim());
        text.setCategory(request.category());
        text.setContent(request.content().trim());
        if (request.active() != null) {
            text.setActive(request.active());
        }
        return toResponse(repository.save(text));
    }

    @Transactional
    public DefaultAgentTextResponse toggle(UUID id) {
        requireSuperAdmin();
        DefaultAgentText text = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Texto padrao nao encontrado"));
        text.setActive(!text.isActive());
        return toResponse(repository.save(text));
    }

    private void requireSuperAdmin() {
        currentUserService.requireSuperAdmin("Apenas SUPER_ADMIN pode acessar textos padrao da matriz.");
    }

    private DefaultAgentTextResponse toResponse(DefaultAgentText text) {
        return new DefaultAgentTextResponse(
            text.getId(),
            text.getTitle(),
            text.getCategory(),
            text.getContent(),
            text.isActive(),
            text.getCreatedAt(),
            text.getUpdatedAt()
        );
    }
}
