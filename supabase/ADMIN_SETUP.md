# Dashboard de Administración (/admin) — Guía de activación

El panel del dueño de la plataforma vive en **https://idiomaconnect.com/admin**.
No hay ningún link público hacia él (acceso discreto por URL directa).

Seguridad de 3 capas:
1. **Login normal** de tu cuenta.
2. **Membresía de administrador** (tabla `app_admins`, invisible para clientes).
   Quien no esté en ella ve un **404** — como si la página no existiera.
3. **TOTP** (Google Authenticator): código de 6 dígitos. Sesión admin de 12 horas.

Toda acción del panel queda registrada en la tabla `admin_audit`.

---

## Paso 1 — Aplicar la migración 0009 (una sola vez)

Supabase → **SQL Editor → New query** → pegar el contenido de
`supabase/migrations/0009_superadmin.sql` → **Run**.

(Si aún no aplicaste la **0008**, aplícala primero.)

## Paso 2 — Darte de alta como administrador

En **SQL Editor**, pega esto (con TU correo) y ejecuta:

```sql
insert into public.app_admins (user_id)
select id from auth.users where email = 'jccubillos@gmail.com'
on conflict (user_id) do nothing;
```

Debe decir `1 row affected`.

## Paso 3 — Enrolar Google Authenticator (primera entrada)

1. Instala **Google Authenticator** en tu teléfono (App Store / Play Store) si no lo tienes.
2. Entra a la app con tu cuenta y visita **https://idiomaconnect.com/admin**.
3. Verás un **código QR**: en Google Authenticator toca **+ → Escanear código QR** y apúntalo.
4. La app del teléfono te mostrará un código de 6 dígitos → escríbelo en la pantalla y listo.

Desde entonces, cada vez que entres a /admin (y la sesión de 12 h haya vencido),
solo te pedirá el código de 6 dígitos del teléfono.

> ⚠️ Si pierdes el teléfono: borra tu fila de `app_admins` y vuelve a insertarla
> (Paso 2). Eso reinicia el enrolamiento y te deja escanear un QR nuevo.

---

## Qué puedes hacer en el panel

- **Métricas**: familias mensual/anual, colegios, trials activos e históricos,
  cuentas expiradas y pagos con falla.
- **Cuentas**: lista con correo, plan y estado (buscador incluido).
- **Códigos de descuento**: crear (con % y duración personalizados, usos máximos
  y vencimiento) y desactivar. Se crean de verdad en Lemon Squeezy vía API;
  la validación al pagar la hace LS automáticamente. *Requiere LS configurado.*
- **Re-trials**: autorizar la excepción a la regla "1 trial por correo".
- **Leads de colegios**: ver las solicitudes del formulario y cambiarles el estado.

## Variable opcional

`ADMIN_SESSION_SECRET`: secreto propio para firmar la sesión admin.
Si no existe, se usa `CRON_SECRET`. En producción basta con que `CRON_SECRET`
sea fuerte (ya lo es).
