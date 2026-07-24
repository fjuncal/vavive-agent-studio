package br.com.vavive.gptmaker.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.vavive.gptmaker.config.AppRuntimeProperties;
import br.com.vavive.gptmaker.domain.entity.Franchise;
import br.com.vavive.gptmaker.domain.entity.FranchiseChannelSnapshot;
import br.com.vavive.gptmaker.domain.entity.User;
import br.com.vavive.gptmaker.domain.enums.UserRole;
import br.com.vavive.gptmaker.dto.ChannelQrCodeResponse;
import br.com.vavive.gptmaker.integration.gptmaker.GptMakerClient;
import br.com.vavive.gptmaker.integration.gptmaker.dto.GptMakerChannelResponse;
import br.com.vavive.gptmaker.repository.FranchiseChannelSnapshotRepository;
import br.com.vavive.gptmaker.repository.FranchiseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ChannelServiceTest {
    @Mock
    private FranchiseRepository franchiseRepository;
    @Mock
    private FranchiseChannelSnapshotRepository channelRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private GptMakerClient gptMakerClient;
    @Mock
    private ChannelConfigurationService channelConfigurationService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void getChannelQRCodeReturnsStablePayloadWithQrValue() {
        UUID franchiseId = UUID.randomUUID();
        UUID channelId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "ATIVA");
        franchise.setWorkspaceId("workspace-1");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        FranchiseChannelSnapshot snapshot = new FranchiseChannelSnapshot(franchise, "channel-ext-1", "Canal", "WHATSAPP");
        ReflectionTestUtils.setField(snapshot, "id", channelId);
        snapshot.setConnected(false);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));
        when(channelRepository.findById(channelId)).thenReturn(Optional.of(snapshot));
        when(gptMakerClient.getChannelQRCode("channel-ext-1"))
            .thenReturn(objectMapper.createObjectNode().put("value", "base64-qr"));

        ChannelService service = new ChannelService(
            franchiseRepository,
            channelRepository,
            currentUserService,
            gptMakerClient,
            channelConfigurationService,
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(true, true, true)),
            objectMapper
        );

        ChannelQrCodeResponse response = service.getChannelQRCode(franchiseId, channelId);

        assertThat(response.value()).isEqualTo("base64-qr");
        assertThat(response.connected()).isFalse();
        assertThat(response.message()).isNull();
        verify(channelRepository).save(snapshot);
    }

    @Test
    void getChannelQRCodeRefreshesConnectionStatusWhenQrValueIsMissing() {
        UUID franchiseId = UUID.randomUUID();
        UUID channelId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "ATIVA");
        franchise.setWorkspaceId("workspace-1");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        FranchiseChannelSnapshot snapshot = new FranchiseChannelSnapshot(franchise, "channel-ext-1", "Canal", "WHATSAPP");
        ReflectionTestUtils.setField(snapshot, "id", channelId);
        snapshot.setConnected(false);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));
        when(channelRepository.findById(channelId)).thenReturn(Optional.of(snapshot));
        when(gptMakerClient.getChannelQRCode("channel-ext-1"))
            .thenReturn(objectMapper.createObjectNode());
        when(gptMakerClient.listWorkspaceChannels("workspace-1"))
            .thenReturn(List.of(new GptMakerChannelResponse(
                "channel-ext-1",
                "Canal",
                null,
                null,
                null,
                null,
                "WHATSAPP",
                true,
                null
            )));

        ChannelService service = new ChannelService(
            franchiseRepository,
            channelRepository,
            currentUserService,
            gptMakerClient,
            channelConfigurationService,
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(true, true, true)),
            objectMapper
        );

        ChannelQrCodeResponse response = service.getChannelQRCode(franchiseId, channelId);

        assertThat(response.value()).isNull();
        assertThat(response.connected()).isTrue();
        assertThat(response.message()).isNull();
        assertThat(snapshot.isConnected()).isTrue();
        verify(channelRepository).save(snapshot);
    }

    @Test
    void getChannelQRCodeReturnsFriendlyMessageWhenWhatsAppIntegrationIsMissing() {
        UUID franchiseId = UUID.randomUUID();
        UUID channelId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "ATIVA");
        franchise.setWorkspaceId("workspace-1");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        FranchiseChannelSnapshot snapshot = new FranchiseChannelSnapshot(franchise, "channel-ext-1", "Canal", "WHATSAPP");
        ReflectionTestUtils.setField(snapshot, "id", channelId);
        snapshot.setConnected(false);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));
        when(channelRepository.findById(channelId)).thenReturn(Optional.of(snapshot));
        when(gptMakerClient.getChannelQRCode("channel-ext-1"))
            .thenReturn(objectMapper.createObjectNode());
        when(gptMakerClient.listWorkspaceChannels("workspace-1"))
            .thenReturn(List.of(new GptMakerChannelResponse(
                "channel-ext-1",
                "Canal",
                null,
                null,
                null,
                null,
                "WHATSAPP",
                false,
                null
            )));

        ChannelService service = new ChannelService(
            franchiseRepository,
            channelRepository,
            currentUserService,
            gptMakerClient,
            channelConfigurationService,
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(true, true, true)),
            objectMapper
        );

        ChannelQrCodeResponse response = service.getChannelQRCode(franchiseId, channelId);

        assertThat(response.value()).isNull();
        assertThat(response.connected()).isFalse();
        assertThat(response.message()).contains("integracao do WhatsApp");
        verify(channelRepository).save(snapshot);
    }

    @Test
    void createWhatsAppChannelUsesAgentEndpoint() {
        UUID franchiseId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "ATIVA");
        franchise.setWorkspaceId("workspace-1");
        franchise.setAgentId("agent-1");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));
        when(gptMakerClient.createAgentChannel("agent-1", "Canal", "WHATSAPP"))
            .thenReturn(objectMapper.createObjectNode()
                .put("id", "channel-ext-1")
                .put("name", "Canal")
                .put("type", "WHATSAPP"));
        when(channelRepository.findFirstByFranchiseIdAndExternalChannelId(franchiseId, "channel-ext-1"))
            .thenReturn(Optional.empty());
        when(channelRepository.save(org.mockito.ArgumentMatchers.any(FranchiseChannelSnapshot.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        ChannelService service = new ChannelService(
            franchiseRepository,
            channelRepository,
            currentUserService,
            gptMakerClient,
            channelConfigurationService,
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(true, true, true)),
            objectMapper
        );

        service.create(franchiseId, "Canal", "WHATSAPP");

        verify(gptMakerClient).createAgentChannel("agent-1", "Canal", "WHATSAPP");
    }

    @Test
    void createWhatsAppChannelWithoutAgentFails() {
        UUID franchiseId = UUID.randomUUID();
        Franchise franchise = new Franchise("Franquia", "1", "Sao Paulo", "SP", "ATIVA");
        franchise.setWorkspaceId("workspace-1");
        ReflectionTestUtils.setField(franchise, "id", franchiseId);

        User user = new User("Admin", "admin@vavive.com", "hash", UserRole.SUPER_ADMIN, null);

        when(currentUserService.requireCurrentUser()).thenReturn(user);
        when(franchiseRepository.findById(franchiseId)).thenReturn(Optional.of(franchise));

        ChannelService service = new ChannelService(
            franchiseRepository,
            channelRepository,
            currentUserService,
            gptMakerClient,
            channelConfigurationService,
            new AppRuntimeProperties(null, new AppRuntimeProperties.Features(true, true, true)),
            objectMapper
        );

        assertThatThrownBy(() -> service.create(franchiseId, "Canal", "WHATSAPP"))
            .hasMessageContaining("precisa ter um agente GPTMaker configurado");
    }
}
