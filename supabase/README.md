# Supabase setup

## Crear proyecto

1. `npm i -g supabase`
2. `supabase login`
3. Crear proyecto desde https://supabase.com/dashboard
4. Anotar: `PROJECT_REF`, `anon key`, `service_role key`, URL

## Aplicar migraciones

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push        # aplica todas las migrations/*.sql en orden
```

O manual: pegar el contenido de `migrations/0001_init.sql` y `0002_rls.sql` en el SQL Editor del dashboard.

## Generar tipos TS

```bash
SUPABASE_PROJECT_REF=<ref> npm run db:types
```

Se genera `src/lib/supabase/database.types.ts`.

## Storage buckets

Crear desde dashboard (Storage):

- `avatars` — public read, authenticated write (max 2MB, image/*)
- `lesson-audio` — authenticated read+write (max 5MB, audio/*)

## Auth providers

En **Authentication → Providers**: habilitar Email + (opcional) Google OAuth.
URL de redirect: `https://tudominio.com/auth/callback`
