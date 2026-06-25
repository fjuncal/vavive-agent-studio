package br.com.vavive.gptmaker.service;

import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.ScheduledServiceRequest;
import br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationContact;
import br.com.vavive.gptmaker.domain.entity.WhatsAppNotificationEvent;
import br.com.vavive.gptmaker.domain.enums.NotificationStatus;
import br.com.vavive.gptmaker.domain.enums.ScheduledRequestStatus;
import br.com.vavive.gptmaker.dto.NotificationDispatchSummaryResponse;
import br.com.vavive.gptmaker.integration.whatsapp.WhatsAppNotificationProvider;
import br.com.vavive.gptmaker.integration.whatsapp.WhatsAppSendResult;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import br.com.vavive.gptmaker.repository.ScheduledServiceRequestRepository;
import br.com.vavive.gptmaker.repository.WhatsAppNotificationContactRepository;
import br.com.vavive.gptmaker.repository.WhatsAppNotificationEventRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsAppNotificationService {
    private static final String DEFAULT_TEST_MESSAGE = """
        ✅ Teste de notificação Vavive Agent Studio

        Esta é uma mensagem de teste para confirmar que este WhatsApp receberá avisos quando um atendimento for agendado.
        """;

    private final FranchiseRepository franchiseRepository;
    private final ScheduledServiceRequestRepository scheduledServiceRequestRepository;
    private final WhatsAppNotificationContactRepository contactRepository;
    private final WhatsAppNotificationEventRepository eventRepository;
    private final WhatsAppNotificationProvider provider;

    public WhatsAppNotificationService(
        FranchiseRepository franchiseRepository,
        ScheduledServiceRequestRepository scheduledServiceRequestRepository,
        WhatsAppNotificationContactRepository contactRepository,
        WhatsAppNotificationEventRepository eventRepository,
        WhatsAppNotificationProvider provider
    ) {
        this.franchiseRepository = franchiseRepository;
        this.scheduledServiceRequestRepository = scheduledServiceRequestRepository;
        this.contactRepository = contactRepository;
        this.eventRepository = eventRepository;
        this.provider = provider;
    }

    @Transactional
    public NotificationDispatchSummaryResponse notifyScheduledService(ScheduledServiceRequest request) {
        Franchise franchise = request.getFranchise();
        if (franchise == null) {
            return summary(0, 0, 0, 0);
        }

        String message = buildScheduledServiceMessage(request);
        NotificationDispatchSummaryResponse summary = dispatch(franchise, request, message);
        request.setStatus(resolveScheduledStatus(summary));
        scheduledServiceRequestRepository.save(request);
        return summary;
    }

    @Transactional
    public NotificationDispatchSummaryResponse sendTestMessage(UUID franchiseId, String customMessage) {
        Franchise franchise = franchiseRepository.findById(franchiseId).orElseThrow();
        String message = customMessage == null || customMessage.isBlank() ? DEFAULT_TEST_MESSAGE : customMessage.trim();
        return dispatch(franchise, null, message);
    }

    private NotificationDispatchSummaryResponse dispatch(Franchise franchise, ScheduledServiceRequest request, String message) {
        List<WhatsAppNotificationContact> contacts = contactRepository.findByFranchiseIdAndActiveTrueOrderByNameAsc(franchise.getId());
        int sent = 0;
        int failed = 0;
        int dryRun = 0;

        for (WhatsAppNotificationContact contact : contacts) {
            WhatsAppSendResult result = provider.sendText(contact.getPhone(), message);
            NotificationStatus status;
            if (result.success() && result.dryRun()) {
                status = NotificationStatus.DRY_RUN;
                dryRun++;
            } else if (result.success()) {
                status = NotificationStatus.SENT;
                sent++;
            } else {
                status = NotificationStatus.FAILED;
                failed++;
            }

            WhatsAppNotificationEvent event = new WhatsAppNotificationEvent();
            event.setFranchise(franchise);
            event.setScheduledRequest(request);
            event.setContact(contact);
            event.setPhone(contact.getPhone());
            event.setProvider(provider.providerName());
            event.setStatus(status);
            event.setMessage(message);
            event.setProviderResponse(result.providerResponse());
            event.setErrorMessage(result.errorMessage());
            eventRepository.save(event);
        }

        return summary(contacts.size(), sent, failed, dryRun);
    }

    private NotificationDispatchSummaryResponse summary(int total, int sent, int failed, int dryRun) {
        return new NotificationDispatchSummaryResponse(total, sent, failed, dryRun, provider.providerName());
    }

    private ScheduledRequestStatus resolveScheduledStatus(NotificationDispatchSummaryResponse summary) {
        if (summary.total() == 0) {
            return ScheduledRequestStatus.NOTIFICATION_FAILURE;
        }
        if (summary.failed() == 0) {
            return ScheduledRequestStatus.NOTIFIED;
        }
        if (summary.sent() > 0 || summary.dryRun() > 0) {
            return ScheduledRequestStatus.PARTIAL_NOTIFICATION_FAILURE;
        }
        return ScheduledRequestStatus.NOTIFICATION_FAILURE;
    }

    private String buildScheduledServiceMessage(ScheduledServiceRequest request) {
        Franchise franchise = request.getFranchise();
        return """
            ✅ Novo atendimento agendado pela IA Vavive

            Franquia: %s
            Cliente: %s
            Telefone: %s
            Serviço: %s
            Plano: %s
            Duração: %s
            Data/Hora: %s
            CEP: %s
            Endereço: %s
            Referência: %s

            Acesse o painel Vavive Agent Studio para acompanhar.
            """.formatted(
            fallback(franchise == null ? null : franchise.getName()),
            fallback(request.getCustomerName()),
            fallback(request.getCustomerPhone()),
            fallback(request.getServiceType()),
            fallback(request.getPlan()),
            fallback(request.getDuration()),
            fallback(request.getRequestedDatetime()),
            fallback(request.getCep()),
            fallback(request.getAddress()),
            fallback(request.getReferencePoint())
        );
    }

    private String fallback(String value) {
        return value == null || value.isBlank() ? "Não informado" : value.trim();
    }
}
