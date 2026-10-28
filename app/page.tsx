"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    voiceflow?: {
      chat?: {
        load: (config: Record<string, unknown>) => void;
        destroy?: () => void;
      };
    };
  }
}

export default function Home() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let initialized = false;
    const scriptId = "voiceflow-widget-script";

    const initialize = () => {
      if (cancelled || initialized || !targetRef.current || !window.voiceflow?.chat) return;
      initialized = true;
      try {
        window.voiceflow.chat.load({
          verify: { projectID: "6ae1e2332e2bb7bb800781b7" },
          url: "https://general-runtime.voiceflow.com",
          voice: { url: "https://runtime-api.voiceflow.com" },
          render: { mode: "embedded", target: targetRef.current },
          assistant: { title: "AQUA Apartments Bellamar", color: "#075e54" },
        });
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    };

    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (window.voiceflow?.chat) {
      initialize();
    } else if (existing) {
      existing.addEventListener("load", initialize, { once: true });
      existing.addEventListener("error", () => setStatus("error"), { once: true });
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs";
      script.type = "text/javascript";
      script.onload = initialize;
      script.onerror = () => setStatus("error");
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      try { window.voiceflow?.chat?.destroy?.(); } catch { /* Widget may not have mounted. */ }
    };
  }, []);

  return (
    <main className="app-shell">
      <header className="demo-topbar">
        <a className="brand" href="https://transportai.es" aria-label="Transport AI">
          <span className="brand-mark">T</span><span>Transport <strong>AI</strong></span>
        </a>
        <span className="demo-pill"><span className="pulse" /> DEMO PERSONALIZADA PARA AQUA</span>
      </header>

      <section className="intro">
        <p className="eyebrow">EXPERIENCIA DE ATENCIÓN AL HUÉSPED</p>
        <h1>Así podría atender AQUA a sus huéspedes.</h1>
        <p>Habla directamente con el agente de IA de la demo. Esta interfaz reproduce una conversación estilo WhatsApp, pero las respuestas las genera el agente real de Voiceflow.</p>
      </section>

      <section className="workspace">
        <aside className="info-panel">
          <div className="wave-icon">🌊</div>
          <p className="kicker">AQUA APARTMENTS BELLAMAR</p>
          <h2>Una conversación natural, a cualquier hora.</h2>
          <p>Haz preguntas como un huésped: consulta información o inicia una solicitud de reserva. El agente conectado responderá según su configuración actual.</p>
          <div className="feature-list">
            <div><span>✓</span><p>Conversación con el agente existente</p></div>
            <div><span>✓</span><p>Interfaz tipo WhatsApp sin botón flotante</p></div>
            <div><span>✓</span><p>Preparado para ampliar el flujo de reservas</p></div>
          </div>
          <div className="notice"><span>ⓘ</span><p>Demostración web: no es la aplicación oficial de WhatsApp. No confirma reservas ni consulta disponibilidad real salvo que esos sistemas estén conectados al agente.</p></div>
        </aside>

        <div className="chat-column">
          <div className="chat-window">
            <div className="status-bar"><span>9:41</span><span>●●● ▰</span></div>
            <div className="chat-header">
              <div className="back-arrow">‹</div><div className="avatar">🌊</div>
              <div className="contact-info">
                <strong>AQUA Apartments Bellamar</strong>
                <span>{status === "ready" ? "Asistente virtual" : status === "error" ? "No se ha podido cargar" : "Conectando con el asistente…"}</span>
              </div>
              <div className="header-actions" aria-hidden="true"><span>⌕</span><span>⋮</span></div>
            </div>
            <div className="chat-canvas">
              <div className="date-chip">HOY</div>
              <div className="demo-notice">Conversación de demostración · No introduzcas datos personales reales</div>
              <div className="voiceflow-mount" ref={targetRef} aria-label="Conversación con el agente de IA de AQUA">
                {status === "loading" && <div className="loading-state"><span className="spinner" />Conectando con el agente de AQUA…</div>}
                {status === "error" && <div className="error-state">No se ha podido cargar el agente. Recarga la página para intentarlo de nuevo.</div>}
              </div>
            </div>
            <div className="chat-footer"><span>🔒</span> Demo web conectada al agente de IA</div>
          </div>
          <p className="under-chat">El agente responde con la configuración y la base de conocimiento publicadas en Voiceflow.</p>
        </div>
      </section>

      <footer className="footer"><span>Una propuesta de <strong>Transport AI</strong></span><span>Prototipo demostrativo · Sin reservas reales</span></footer>
    </main>
  );
}
