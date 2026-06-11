-- ============================================================
-- Migration 0010 — Página de contacto (mensajes + adjuntos)
--
-- · contact_messages : solicitudes del formulario /contacto.
-- · bucket "contact-files" : adjuntos (imagen/doc/pdf), PRIVADO.
--   Solo el servidor (service_role) escribe y lee; el público no.
-- ============================================================

create table if not exists public.contact_messages (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    email       text not null,
    phone       text,
    reason      text not null,      -- 'soporte' | 'pagos' | 'colegios' | 'sugerencia' | 'otro'
    message     text,
    file_path   text,               -- ruta del adjunto en el bucket contact-files (opcional)
    status      text not null default 'new'
                  check (status in ('new', 'answered', 'closed')),
    created_at  timestamptz not null default now()
);

create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);

alter table public.contact_messages enable row level security;
-- Sin políticas: el formulario inserta vía servidor (service_role) con rate limit.

-- Bucket privado para adjuntos (5 MB máx; imágenes, PDF y documentos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'contact-files',
  'contact-files',
  false,
  5242880,
  array[
    'image/png', 'image/jpeg', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
-- Sin políticas en storage.objects para este bucket → solo service_role accede.
