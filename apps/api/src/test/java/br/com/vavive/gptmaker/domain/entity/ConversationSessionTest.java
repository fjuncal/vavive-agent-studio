package br.com.vavive.gptmaker.domain.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ConversationSessionTest {
    @Test
    void constructorAndSettersTrimValuesToDatabaseSafeLengths() {
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "ATIVA");
        String oversized = "x".repeat(400);

        ConversationSession session = new ConversationSession(
            franchise,
            oversized,
            oversized,
            oversized,
            oversized,
            oversized,
            oversized,
            oversized,
            oversized,
            oversized
        );

        session.setResponsibleUserName(oversized);
        session.setClosedReason(oversized);
        session.setSaleSummary("y".repeat(4000));
        session.setHandoffError("z".repeat(2500));

        assertThat(session.getExternalAgentId()).hasSize(255);
        assertThat(session.getAgentName()).hasSize(255);
        assertThat(session.getContextId()).hasSize(255);
        assertThat(session.getCustomerName()).hasSize(255);
        assertThat(session.getCustomerPhone()).hasSize(255);
        assertThat(session.getFirstPrompt()).hasSize(255);
        assertThat(session.getLastResponse()).hasSize(255);
        assertThat(session.getChatId()).hasSize(255);
        assertThat(session.getInteractionId()).hasSize(255);
        assertThat(session.getResponsibleUserName()).hasSize(255);
        assertThat(session.getClosedReason()).hasSize(255);
        assertThat(session.getSaleSummary()).hasSize(3000);
        assertThat(session.getHandoffError()).hasSize(2000);
    }
}
