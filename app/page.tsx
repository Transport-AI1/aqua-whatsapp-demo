"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { id: string; role: "assistant" | "user"; text: string };

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionKey, setSessionKey] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function start() {
      try {
        const response = await fetch("/api/voiceflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "launch" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se ha podido conectar con el agente.");
        if (!active) return;
        setSessionKey(data.sessionKey);
        setMessages((data.messages || []).map((text: string, i: number) => ({
          id: `welcome-${i}-${Date.now()}`, role: "assistant", text,
        })));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error al conectar con Voiceflow.");
      } finally {
        if (active) setLoading(false);
      }
    }
    start();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !sessionKey || sending) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text }]);
    setSending(true);
    try {
      const response = await fetch("/api/voiceflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "text", sessionKey, text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se ha podido obtener una respuesta.");
      setMessages((current) => [...current, ...(data.messages || []).map((reply: string, i: number) => ({
        id: `assistant-${Date.now()}-${i}`, role: "assistant" as const, text: reply,
      }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ha ocurrido un error.");
    } finally {
      setSending(false);
    }
  }

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
        <p>Habla directamente con el agente de IA de la demo. Las respuestas las genera el agente real de Voiceflow, dentro de una interfaz de conversación propia.</p>
      </section>

      <section className="workspace">
        <aside className="info-panel">
          <div className="wave-icon">🌊</div>
          <p className="kicker">AQUA APARTMENTS BELLAMAR</p>
          <h2>Una conversación natural, a cualquier hora.</h2>
          <p>Haz preguntas como un huésped: consulta información o inicia tu solicitud de reserva directamente en la conversación con el agente.</p>
          <div className="feature-list">
            <div><span>✓</span><p>Respuestas del agente real de Voiceflow</p></div>
            <div><span>✓</span><p>Interfaz propia estilo WhatsApp</p></div>
            <div><span>✓</span><p>Preparado para ampliar el flujo de reservas</p></div>
          </div>
          <div className="notice"><span>ⓘ</span><p>Las solicitudes de reserva se gestionan desde la conversación con el agente. La demo no consulta disponibilidad ni confirma reservas.</p></div>
        </aside>

        <div className="chat-column">
          <div className="chat-window">
            <div className="status-bar"><span>9:41</span><span>●●● ▰</span></div>
            <div className="chat-header">
              <div className="back-arrow">‹</div><div className="avatar">🌊</div>
              <div className="contact-info">
                <strong>AQUA Apartments Bellamar</strong>
                <span>{loading ? "Conectando con el asistente…" : error && !sessionKey ? "No se ha podido conectar" : "Asistente virtual"}</span>
              </div>
              <div className="header-actions" aria-hidden="true"><span>⌕</span><span>⋮</span></div>
            </div>
            <div className="chat-canvas" ref={scrollRef}>
              <div className="date-chip">HOY</div>
              <div className="demo-notice">Conversación de demostración · No introduzcas datos personales reales</div>
              {loading && <div className="loading-state"><span className="spinner" />Conectando con el agente de AQUA…</div>}
              {!loading && messages.length === 0 && !error && <div className="empty-chat">Escribe un mensaje para empezar la conversación.</div>}
              {messages.map((message) => (
                <div key={message.id} className={`message-row ${message.role === "user" ? "from-user" : "from-assistant"}`}>
                  <div className="message-bubble">{message.text}<span className="message-time">{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{message.role === "user" ? " ✓✓" : ""}</span></div>
                </div>
              ))}
              {sending && <div className="message-row from-assistant"><div className="message-bubble typing"><span></span><span></span><span></span></div></div>}
              {error && <div className="error-state">{error}</div>}
            </div>
            <form className="composer" onSubmit={sendMessage}>
              <span className="composer-plus" aria-hidden="true">＋</span>
              <input aria-label="Escribe tu mensaje" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe un mensaje" disabled={!sessionKey || loading || sending} />
              <button type="submit" aria-label="Enviar mensaje" disabled={!input.trim() || !sessionKey || sending}>➤</button>
            </form>
            <div className="chat-footer"><span>🔒</span> Demo web conectada al agente de IA</div>
          </div>
          <p className="under-chat">El agente responde con la configuración y la base de conocimiento publicadas en Voiceflow.</p>
        </div>
      </section>
      <footer className="footer"><span>Una propuesta de <strong>Transport AI</strong></span><span>Prototipo demostrativo · Sin reservas reales</span></footer>
    </main>
  );
}
