alter table franchise
    add column access_status varchar(16) not null default 'ACTIVE';

alter table franchise
    add constraint ck_franchise_access_status check (access_status in ('ACTIVE', 'INACTIVE'));
