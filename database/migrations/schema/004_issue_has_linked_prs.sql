alter table issue add column has_linked_prs boolean not null default false;

---- create above / drop below ----

alter table issue drop column has_linked_prs;

