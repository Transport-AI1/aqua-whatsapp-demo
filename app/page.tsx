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
  const [reservation, setReservation] = useState({ guest_name: "", email: "", phone: "", check_in: "", check_out: "", guests: "2", apartment_type: "Vista al mar", notes: "" });
  const [reservationStatus, setReservationStatus] = useState("");
  const [reservationSaving, setReservationSaving] = useState(false);
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

  async function submitReservation(event: FormEvent) {
    event.preventDefault();
    setReservationStatus("");
    setReservationSaving(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reservation, guests: Number(reservation.guests) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se ha podido guardar la solicitud.");
      setReservationStatus(`Solicitud guardada correctamente. Referencia: ${data.id || "registrada"}. No es una reserva confirmada.`);
      setReservation({ guest_name: "", email: "", phone: "", check_in: "", check_out: "", guests: "2", apartment_type: "Vista al mar", notes: "" });
    } catch (e) {
      setReservationStatus(e instanceof Error ? e.message : "Error al guardar la solicitud.");
    } finally {
      setReservationSaving(false);
    }
  }

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
          <p>Haz preguntas como un huésped: consulta información o inicia una solicitud de reserva. El agente conectado responderá según su configuración actual.</p>
          <div className="feature-list">
            <div><span>✓</span><p>Respuestas del agente real de Voiceflow</p></div>
            <div><span>✓</span><p>Interfaz propia estilo WhatsApp</p></div>
            <div><span>✓</span><p>Preparado para ampliar el flujo de reservas</p></div>
          </div>
          <div className="notice"><span>ⓘ</span><p>Esta demo permite enviar solicitudes de estancia para que el equipo las revise. No consulta disponibilidad ni confirma reservas.</p></div>
          <div className="reservation-card">
            <h3>Solicitar una estancia</h3>
            <p>Prueba el formulario: la solicitud se guardará para que AQUA pueda verla en Supabase cuando esté configurado.</p>
            <form className="reservation-form" onSubmit={submitReservation}>
              <label>Nombre completo<input required maxLength={120} value={reservation.guest_name} onChange={(e) => setReservation({ ...reservation, guest_name: e.target.value })} placeholder="Tu nombre" /></label>
              <label>Correo electrónico<input required type="email" maxLength={254} value={reservation.email} onChange={(e) => setReservation({ ...reservation, email: e.target.value })} placeholder="nombre@correo.com" /></label>
              <label>Teléfono (opcional)<input type="tel" value={reservation.phone} onChange={(e) => setReservation({ ...reservation, phone: e.target.value })} placeholder="+34…" /></label>
              <div className="reservation-grid">
                <label>Entrada<input required type="date" min={new Date().toISOString().slice(0, 10)} value={reservation.check_in} onChange={(e) => setReservation({ ...reservation, check_in: e.target.value, check_out: reservation.check_out && reservation.check_out <= e.target.value ? "" : reservation.check_out })} /></label>
                <label>Salida<input required type="date" min={reservation.check_in || new Date().toISOString().slice(0, 10)} value={reservation.check_out} onChange={(e) => setReservation({ ...reservation, check_out: e.target.value })} /></label>
              </div>
              <div className="reservation-grid">
                <label>Huéspedes<select value={reservation.guests} onChange={(e) => setReservation({ ...reservation, guests: e.target.value })}>{[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
                <label>Tipo de apartamento<select value={reservation.apartment_type} onChange={(e) => setReservation({ ...reservation, apartment_type: e.target.value })}><option>Vista al mar</option><option>Premium vista al mar</option><option>Con terraza</option><option>No lo sé todavía</option></select></label>
              </div>
              <label>Comentarios (opcional)<textarea rows={3} maxLength={2000} value={reservation.notes} onChange={(e) => setReservation({ ...reservation, notes: e.target.value })} placeholder="Preferencias o preguntas" /></label>
              <button type="submit" disabled={reservationSaving}>{reservationSaving ? "Guardando…" : "Guardar solicitud de reserva"}</button>
              {reservationStatus && <p className="reservation-status" role="status">{reservationStatus}</p>}
              <small>Datos de demostración. No se confirmará ninguna reserva ni disponibilidad. No uses datos reales hasta que AQUA autorice esta demo y se configure su aviso de privacidad.</small>
            </form>
          </div>
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
