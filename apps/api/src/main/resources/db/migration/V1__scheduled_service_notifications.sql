create table if not exists whatsapp_notification_contacts (
    id uuid primary key,
    franchise_id uuid not null,
    name varchar(120) not null,
    phone varchar(32) not null,
    active boolean not null default true,
    created_at timestamp not null,
    updated_at timestamp not null
);

create index if not exists idx_whatsapp_notification_contacts_franchise
    on whatsapp_notification_contacts (franchise_id);

create table if not exists scheduled_service_requests (
    id uuid primary key,
    franchise_id uuid null,
    agent_external_id varchar(120) null,
    customer_name varchar(180) null,
    customer_phone varchar(32) null,
    cpf_or_cnpj varchar(32) null,
    email varchar(180) null,
    cep varchar(16) null,
    address text null,
    reference_point text null,
    service_type varchar(120) null,
    plan varchar(120) null,
    duration varchar(80) null,
    requested_datetime varchar(120) null,
    raw_payload text not null,
    status varchar(40) not null default 'RECEIVED',
    created_at timestamp not null
);

create index if not exists idx_scheduled_service_requests_franchise
    on scheduled_service_requests (franchise_id);

create table if not exists whatsapp_notification_events (
    id uuid primary key,
    franchise_id uuid null,
    scheduled_request_id uuid null,
    contact_id uuid null,
    phone varchar(32) not null,
    provider varchar(60) not null,
    status varchar(40) not null,
    message text not null,
    provider_response text null,
    error_message text null,
    created_at timestamp not null
);

create index if not exists idx_whatsapp_notification_events_franchise
    on whatsapp_notification_events (franchise_id);

create index if not exists idx_whatsapp_notification_events_scheduled_request
    on whatsapp_notification_events (scheduled_request_id);
