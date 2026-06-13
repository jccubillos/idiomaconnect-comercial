# Cuentas de colegio — Guía de activación

Esta guía explica cómo **activar la función de colegios** y cómo **dar de alta un colegio nuevo**. Pensada para hacerse desde el panel de Supabase (no requiere programar).

---

## Paso 1 — Aplicar las migraciones (una sola vez)

En Supabase: **SQL Editor → New query** y ejecuta, en este orden, el contenido de:

1. `supabase/migrations/0005_schools.sql`
2. `supabase/migrations/0006_schools_rls.sql`

Esto crea las tablas de colegios (staff, cursos, etc.) y las reglas de seguridad. No afecta a las cuentas familiares existentes.

> Si usas el CLI de Supabase: `supabase db push` aplica todas las migraciones pendientes automáticamente.

---

## Paso 2 — Dar de alta un colegio

Cuando un colegio acepta una propuesta, lo activas en 2 pasos:

### 2.1 Crear la cuenta del administrador del colegio

Pídele al colegio el correo del responsable (UTP, jefe de inglés, etc.) y que se registre en **`/signup`** con ese correo. (O créalo tú desde **Authentication → Add user** en Supabase.)

### 2.2 Convertir esa cuenta en colegio

En **SQL Editor**, pega esto y **reemplaza los 4 valores** marcados, luego ejecuta:

```sql
with u as (
  select id from auth.users
  where email = 'admin@colegio.cl'          -- ← correo del administrador
),
fam as (
  update public.families f
  set org_type   = 'school',
      family_name = 'Colegio San Ejemplo',   -- ← nombre del colegio
      seats       = 600,                      -- ← cupos contratados (n° de alumnos)
      plan        = 'school'
  from u
  where f.owner_user_id = u.id
  returning f.id, f.owner_user_id
)
insert into public.staff_members (org_id, user_id, role, full_name)
select fam.id, fam.owner_user_id, 'admin', 'Coordinador del colegio'  -- ← nombre del contacto
from fam
on conflict (org_id, user_id) do nothing;
```

¡Listo! Cuando ese administrador inicie sesión, entrará directo al **Panel del colegio** (`/school-admin`), donde puede:

- Crear **cursos** (7°A, 8°B, …).
- Crear **cuentas de profesor** (se genera una contraseña temporal para entregarles).
- Asignar profesores a cursos.
- Agregar **alumnos** y asignarlos a un curso (respeta el cupo contratado).
- Entrar al **Modo aula** para que los alumnos practiquen.

---

## Cómo lo usa cada rol

| Rol | Entra a | Puede |
|-----|---------|-------|
| **Administrador** | `/school-admin` | Gestionar cursos, profesores, alumnos y cupos. Ver todo el colegio. Modo aula. |
| **Profesor** | `/teacher` | Ver sus cursos, el avance de cada alumno y estadísticas. Definir el "tema de la semana". Modo aula con sus alumnos. |
| **Alumno** | Modo aula → elige su perfil | Practicar. Su progreso se guarda y aparece en el panel del profesor. |

### Práctica de los alumnos (Modo aula)
En esta primera versión, los alumnos practican en un dispositivo con la sesión de su **profesor** o del **administrador** abierta: entran a **Modo aula**, eligen su perfil y practican. El avance queda registrado y visible para el profesor.
*(Mejora futura: login individual por alumno.)*

---

## Fase 2 — Contenido alineado al colegio

En la ficha de cada curso (`/teacher/course/…`), el profesor puede definir un **"Tema de la semana"** (ej: *"Present continuous · deportes"*) y una instrucción para la IA. A partir de ese momento, **las lecciones de los alumnos de ese curso** se adaptan a ese foco.

**Aislamiento garantizado:** ese contexto solo aplica a los alumnos de ESE curso. Las familias y otros colegios no se ven afectados, porque cada lección se genera por separado con el contexto que corresponde.

---

## Precios (actualizados por JC, 2026-06-12 · modelo afiliados/internacional)

Cobro **por alumno / año** en USD, con descuento por volumen:

| Tramo de alumnos | Precio por alumno / año |
|---|---|
| 1 – 50 | **USD 39** |
| 51 – 200 | **USD 34** |
| 201 – 500 | **USD 31** |
| 500+ | **USD 28** |

> Nota: precios pensados para el mercado internacional (B2B ed-tech). Para colegios
> chilenos puede ofrecerse una tarifa local negociada. Margen muy alto: el costo de
> IA por alumno/año es ~USD 2-4 (con caché de audio), así que cada alumno deja >85%.

- **Contratación mínima:** anual (idealmente alineada al año escolar, marzo–diciembre).
- **Piloto:** se habilita **desde el dashboard de administración** (no autoservicio):
  convierte la cuenta del colegio en "piloto" con fecha de término definida.
  Es herramienta de venta con urgencia incorporada.

---

## Las solicitudes del formulario web

Las solicitudes enviadas desde **`/colegios`** se guardan en la tabla **`school_leads`**.
Para revisarlas: Supabase → **Table Editor → school_leads** (o SQL Editor):

```sql
select created_at, institution_name, contact_name, email, phone, num_students, levels, message
from public.school_leads
order by created_at desc;
```
