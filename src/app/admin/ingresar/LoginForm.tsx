"use client";

import Link from "next/link";
import { useActionState } from "react";
import logo from "@/assets/logo-ion.png";
import type { LoginState } from "../actions";

export function LoginForm({ action }: { action?: (prev: LoginState, form: FormData) => Promise<LoginState> }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(action ?? (async () => ({})), {});

  return (
    <main className="adm-login">
      <form action={formAction} className="adm-login-card">
        <img src={logo.src} width={logo.width} height={logo.height} alt="IonBikeStore" className="adm-login-logo" />
        <h1>Panel de administración</h1>
        {!action && (
          <p className="adm-demo">
            Vista previa: en la tienda real acá se ingresa con email, contraseña y el código de la app de autenticación.{" "}
            <Link href="/admin/estadisticas">Entrar a la vista previa →</Link>
          </p>
        )}
        <label className="adm-field">
          <span>Email</span>
          <input className="adm-input" name="email" type="email" autoComplete="username" required maxLength={200} autoFocus={!state.email} defaultValue={state.email} />
        </label>
        <label className="adm-field">
          <span>Contraseña</span>
          <input className="adm-input" name="password" type="password" autoComplete="current-password" required maxLength={200} autoFocus={Boolean(state.email)} />
        </label>
        <label className="adm-field">
          <span>Código de la app de autenticación</span>
          <input className="adm-input adm-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} placeholder="123 456" required />
        </label>
        {state.error && <p className="adm-alert" role="alert">{state.error}</p>}
        <button type="submit" className="adm-btn adm-btn-primary adm-btn-block" disabled={pending || !action}>
          {pending ? "Verificando…" : "Ingresar"}
        </button>
        <p className="adm-hint">La sesión se cierra sola tras una hora sin uso. Si perdiste el celular con la app, pedí que te renueven el acceso.</p>
      </form>
    </main>
  );
}
