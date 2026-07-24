create table franchise (
    id uuid not null,
    name varchar(255),
    document varchar(255),
    city varchar(255),
    state varchar(255),
    status varchar(255),
    workspace_id varchar(255),
    workspace_name varchar(255),
    agent_id varchar(255),
    agent_name varchar(255),
    gpt_maker_last_sync_at timestamp(6),
    created_at timestamp(6),
    constraint pk_franchise primary key (id)
);

create table assistant_standard_profile (
    id uuid not null,
    name varchar(255),
    active boolean not null default false,
    version integer not null,
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_assistant_standard_profile primary key (id)
);

create table channel_standard_config (
    id uuid not null,
    channel_type varchar(50) not null,
    payload_json varchar(12000) not null,
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_channel_standard_config primary key (id),
    constraint uk_channel_standard_config_channel_type unique (channel_type)
);

create table default_agent_text (
    id uuid not null,
    title varchar(255),
    category varchar(255),
    content oid,
    active boolean not null default true,
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_default_agent_text primary key (id),
    constraint ck_default_agent_text_category check (category in (
        'CONTEXTO_VAVIVE',
        'REGRAS_ATENDIMENTO',
        'TOM_DE_VOZ',
        'SERVICOS',
        'FAQ',
        'RESTRICOES'
    ))
);

create table app_user (
    id uuid not null,
    name varchar(255),
    email varchar(255),
    password_hash varchar(255),
    role varchar(255),
    franchise_id uuid,
    active boolean not null default true,
    created_at timestamp(6),
    constraint pk_app_user primary key (id),
    constraint fk_app_user_franchise foreign key (franchise_id) references franchise (id),
    constraint ck_app_user_role check (role in ('SUPER_ADMIN', 'ADMIN_FRANQUIA'))
);

create table franchise_setup (
    id uuid not null,
    franchise_id uuid,
    responsible_name varchar(255),
    services varchar(4000),
    prices varchar(4000),
    regions varchar(4000),
    schedules varchar(4000),
    faq varchar(8000),
    rules varchar(8000),
    tone_of_voice varchar(2000),
    franchise_whatsapp varchar(1000),
    conversation_examples_summary varchar(6000),
    last_generated_training varchar(12000),
    last_published_at timestamp(6),
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_franchise_setup primary key (id),
    constraint uk_franchise_setup_franchise_id unique (franchise_id),
    constraint fk_franchise_setup_franchise foreign key (franchise_id) references franchise (id)
);

create table gpt_maker_agent (
    id uuid not null,
    external_id varchar(255),
    name varchar(255),
    avatar text,
    status varchar(255),
    tone_of_voice varchar(255),
    franchise_id uuid,
    created_at timestamp(6),
    constraint pk_gpt_maker_agent primary key (id),
    constraint fk_gpt_maker_agent_franchise foreign key (franchise_id) references franchise (id)
);

create table conversation_session (
    id uuid not null,
    franchise_id uuid,
    external_agent_id varchar(255),
    agent_name varchar(255),
    context_id varchar(255),
    customer_name varchar(255),
    customer_phone varchar(255),
    first_prompt varchar(255),
    last_response varchar(255),
    chat_id varchar(255),
    interaction_id varchar(255),
    channel_type varchar(255),
    operational_status varchar(255),
    responsible_user_name varchar(255),
    sync_status varchar(255),
    closed_reason varchar(255),
    sale_outcome varchar(255),
    sale_summary varchar(3000),
    handoff_status varchar(255),
    handoff_sent_at timestamp(6),
    handoff_error varchar(2000),
    human_takeover_active boolean not null default false,
    last_message_at timestamp(6),
    last_synced_at timestamp(6),
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_conversation_session primary key (id),
    constraint fk_conversation_session_franchise foreign key (franchise_id) references franchise (id)
);

create table franchise_assistant_block_config (
    id uuid not null,
    franchise_id uuid,
    block_type varchar(255),
    mode varchar(255),
    standard_version_applied integer,
    custom_payload_json oid,
    customized_at timestamp(6),
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_franchise_assistant_block_config primary key (id),
    constraint fk_franchise_assistant_block_config_franchise foreign key (franchise_id) references franchise (id),
    constraint ck_franchise_assistant_block_config_block_type check (block_type in (
        'BEHAVIOR',
        'ROLE',
        'BASE_DESCRIPTION',
        'TRAININGS',
        'INTENTIONS',
        'AGENT_SETTINGS',
        'IDLE_ACTIONS',
        'TRANSFER_RULES'
    )),
    constraint ck_franchise_assistant_block_config_mode check (mode in ('STANDARD', 'CUSTOM'))
);

create table franchise_channel_snapshot (
    id uuid not null,
    franchise_id uuid,
    external_channel_id varchar(255),
    name varchar(255),
    channel_type varchar(255),
    connected boolean not null default false,
    agent_id varchar(255),
    agent_name varchar(255),
    external_username varchar(255),
    raw_payload varchar(4000),
    config_payload_json varchar(12000),
    last_sync_error varchar(2000),
    last_synced_at timestamp(6),
    config_updated_at timestamp(6),
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_franchise_channel_snapshot primary key (id),
    constraint fk_franchise_channel_snapshot_franchise foreign key (franchise_id) references franchise (id)
);

create table lead (
    id uuid not null,
    name varchar(255),
    phone varchar(255),
    service varchar(255),
    source varchar(255),
    status varchar(255),
    franchise_id uuid,
    agent_id uuid,
    created_at timestamp(6),
    constraint pk_lead primary key (id),
    constraint fk_lead_franchise foreign key (franchise_id) references franchise (id),
    constraint fk_lead_agent foreign key (agent_id) references gpt_maker_agent (id),
    constraint ck_lead_status check (status in ('NOVO', 'EM_ATENDIMENTO', 'CONVERTIDO', 'FINALIZADO'))
);

create table scheduled_service_requests (
    id uuid not null,
    franchise_id uuid,
    agent_external_id varchar(255),
    customer_name varchar(255),
    customer_phone varchar(255),
    cpf_or_cnpj varchar(255),
    email varchar(255),
    cep varchar(255),
    address text,
    reference_point text,
    service_type varchar(255),
    plan varchar(255),
    duration varchar(255),
    requested_datetime varchar(255),
    raw_payload text not null,
    status varchar(255) default 'RECEIVED',
    created_at timestamp(6),
    constraint pk_scheduled_service_requests primary key (id),
    constraint fk_scheduled_service_requests_franchise foreign key (franchise_id) references franchise (id),
    constraint ck_scheduled_service_requests_status check (status in (
        'RECEIVED',
        'NOTIFIED',
        'PARTIAL_NOTIFICATION_FAILURE',
        'NOTIFICATION_FAILURE'
    ))
);

create table whatsapp_notification_contacts (
    id uuid not null,
    franchise_id uuid not null,
    name varchar(255),
    phone varchar(255),
    active boolean not null default true,
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_whatsapp_notification_contacts primary key (id),
    constraint fk_whatsapp_notification_contacts_franchise foreign key (franchise_id) references franchise (id)
);

create table agent_conversation_example (
    id uuid not null,
    agent_id uuid,
    title varchar(255),
    objective varchar(255),
    messages varchar(8000),
    status varchar(255),
    include_in_training boolean not null default false,
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_agent_conversation_example primary key (id),
    constraint fk_agent_conversation_example_agent foreign key (agent_id) references gpt_maker_agent (id)
);

create table agent_intent (
    id uuid not null,
    name varchar(255),
    description varchar(255),
    example_phrase varchar(255),
    active boolean not null default true,
    status varchar(255),
    external_reference varchar(255),
    result_message varchar(2000),
    agent_id uuid,
    created_at timestamp(6),
    constraint pk_agent_intent primary key (id),
    constraint fk_agent_intent_agent foreign key (agent_id) references gpt_maker_agent (id)
);

create table agent_rule (
    id uuid not null,
    title varchar(255),
    description varchar(255),
    category varchar(255),
    enabled boolean not null default false,
    agent_id uuid,
    created_at timestamp(6),
    constraint pk_agent_rule primary key (id),
    constraint fk_agent_rule_agent foreign key (agent_id) references gpt_maker_agent (id)
);

create table agent_training (
    id uuid not null,
    title varchar(255),
    content varchar(6000),
    status varchar(255),
    external_reference varchar(255),
    result_message varchar(2000),
    content_summary varchar(2000),
    published_at timestamp(6),
    agent_id uuid,
    created_at timestamp(6),
    constraint pk_agent_training primary key (id),
    constraint fk_agent_training_agent foreign key (agent_id) references gpt_maker_agent (id)
);

create table assistant_standard_block (
    id uuid not null,
    profile_id uuid,
    block_type varchar(255),
    payload_json oid,
    version integer not null,
    created_at timestamp(6),
    updated_at timestamp(6),
    constraint pk_assistant_standard_block primary key (id),
    constraint fk_assistant_standard_block_profile foreign key (profile_id) references assistant_standard_profile (id),
    constraint ck_assistant_standard_block_block_type check (block_type in (
        'BEHAVIOR',
        'ROLE',
        'BASE_DESCRIPTION',
        'TRAININGS',
        'INTENTIONS',
        'AGENT_SETTINGS',
        'IDLE_ACTIONS',
        'TRANSFER_RULES'
    ))
);

create table assistant_standard_block_history (
    id uuid not null,
    block_id uuid,
    block_type varchar(255),
    version integer not null,
    payload_json oid,
    changed_by varchar(255),
    changed_at timestamp(6),
    constraint pk_assistant_standard_block_history primary key (id),
    constraint fk_assistant_standard_block_history_block foreign key (block_id) references assistant_standard_block (id),
    constraint ck_assistant_standard_block_history_block_type check (block_type in (
        'BEHAVIOR',
        'ROLE',
        'BASE_DESCRIPTION',
        'TRAININGS',
        'INTENTIONS',
        'AGENT_SETTINGS',
        'IDLE_ACTIONS',
        'TRANSFER_RULES'
    ))
);

create table conversation_handoff_event (
    id uuid not null,
    conversation_id uuid,
    outcome varchar(255),
    delivery_status varchar(255),
    responsible_user_name varchar(255),
    recipient_phone varchar(255),
    summary varchar(3000),
    delivery_error varchar(2000),
    sent_at timestamp(6),
    created_at timestamp(6),
    constraint pk_conversation_handoff_event primary key (id),
    constraint fk_conversation_handoff_event_conversation foreign key (conversation_id) references conversation_session (id)
);

create table whatsapp_notification_events (
    id uuid not null,
    franchise_id uuid,
    scheduled_request_id uuid,
    contact_id uuid,
    phone varchar(255),
    provider varchar(255),
    status varchar(255),
    message text,
    provider_response text,
    error_message text,
    created_at timestamp(6),
    constraint pk_whatsapp_notification_events primary key (id),
    constraint fk_whatsapp_notification_events_franchise foreign key (franchise_id) references franchise (id),
    constraint fk_whatsapp_notification_events_scheduled_request foreign key (scheduled_request_id) references scheduled_service_requests (id),
    constraint fk_whatsapp_notification_events_contact foreign key (contact_id) references whatsapp_notification_contacts (id),
    constraint ck_whatsapp_notification_events_status check (status in ('PENDING', 'SENT', 'FAILED', 'DRY_RUN'))
);

create index idx_agent_conversation_example_agent_created_at
    on agent_conversation_example (agent_id, created_at desc);

create index idx_agent_intent_agent_id
    on agent_intent (agent_id);

create index idx_agent_rule_agent_id
    on agent_rule (agent_id);

create index idx_agent_training_agent_created_at
    on agent_training (agent_id, created_at desc);

create index idx_app_user_franchise_role
    on app_user (franchise_id, role);

create index idx_app_user_upper_email
    on app_user (upper(email));

create index idx_assistant_standard_block_history_block_version
    on assistant_standard_block_history (block_id, version desc);

create index idx_assistant_standard_block_profile_block_type
    on assistant_standard_block (profile_id, block_type);

create index idx_assistant_standard_profile_active_updated_at
    on assistant_standard_profile (active, updated_at desc);

create index idx_conversation_handoff_event_conversation_created_at
    on conversation_handoff_event (conversation_id, created_at desc);

create index idx_conversation_handoff_event_conversation_outcome
    on conversation_handoff_event (conversation_id, outcome);

create index idx_conversation_session_franchise_chat_id
    on conversation_session (franchise_id, chat_id);

create index idx_conversation_session_franchise_updated_at
    on conversation_session (franchise_id, updated_at desc);

create index idx_default_agent_text_active_category_title
    on default_agent_text (active, category, title);

create index idx_franchise_agent_id
    on franchise (agent_id);

create index idx_franchise_assistant_block_config_franchise_block_type
    on franchise_assistant_block_config (franchise_id, block_type);

create index idx_franchise_channel_snapshot_franchise_external_channel
    on franchise_channel_snapshot (franchise_id, external_channel_id);

create index idx_franchise_channel_snapshot_franchise_name
    on franchise_channel_snapshot (franchise_id, name);

create index idx_franchise_workspace_id
    on franchise (workspace_id);

create index idx_gpt_maker_agent_franchise_created_at
    on gpt_maker_agent (franchise_id, created_at);

create index idx_gpt_maker_agent_franchise_external_id
    on gpt_maker_agent (franchise_id, external_id);

create index idx_gpt_maker_agent_franchise_name
    on gpt_maker_agent (franchise_id, name);

create index idx_lead_franchise_id
    on lead (franchise_id);

create index idx_lead_franchise_status
    on lead (franchise_id, status);

create index idx_lead_status
    on lead (status);

create index idx_scheduled_service_requests_franchise_id
    on scheduled_service_requests (franchise_id);

create index idx_whatsapp_notification_contacts_franchise_active_name
    on whatsapp_notification_contacts (franchise_id, active, name);

create index idx_whatsapp_notification_contacts_franchise_name
    on whatsapp_notification_contacts (franchise_id, name);

create index idx_whatsapp_notification_events_contact_id
    on whatsapp_notification_events (contact_id);

create index idx_whatsapp_notification_events_franchise_id
    on whatsapp_notification_events (franchise_id);

create index idx_whatsapp_notification_events_scheduled_request_id
    on whatsapp_notification_events (scheduled_request_id);
