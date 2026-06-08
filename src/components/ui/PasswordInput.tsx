"use client";

import { useState } from "react";

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
}

/**
 * Campo de contraseña con botón para mostrar/ocultar (ojo) al costado derecho.
 * Reutilizable en registro, login, recuperación y cambio de clave.
 */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  required = false,
  id,
  ...rest
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={rest["aria-label"]}
        className="w-full px-3 py-2.5 pr-11 rounded-xl bg-surface-mid border border-white/10 focus:border-neon-cyan focus:outline-none transition-colors"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-ink-dim hover:text-neon-cyan transition-colors"
        tabIndex={-1}
      >
        {show ? (
          // Ojo tachado (ocultar)
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        ) : (
          // Ojo abierto (mostrar)
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
