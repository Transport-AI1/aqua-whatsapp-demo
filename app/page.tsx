"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { id: number; from: "guest" | "agent"; text: string; time: string };

const quickReplies = [
  "Quiero información sobre los apartamentos",
  "Quiero hacer una solicitud de reserva",
  "¿Tenéis apartamentos con vistas al mar?",
];

function clock() {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function getReply(text: string, stage: string) {
  const value = text.toLowerCase();

  if (value.includes("reiniciar") || value.includes("empezar de nuevo")) {
    return {
      reply: "¡Por supuesto! 🌊 ¿En qué puedo ayudarle? Puede consultar información general o preparar una solicitud de reserva.",
      stage: "start",
    };
  }

  if (stage === "need-guests") {
    return {
      reply: "Perfecto. ¿Qué fechas de entrada y salida tiene previstas? Puede indicármelas, por ejemplo, del 15 al 18 de noviembre.",
      stage: "need-dates",
    };
  }

  if (stage === "need-dates") {
    return {
      reply: "Gracias. ¿Qué características son más importantes para usted: vistas al mar, terraza, número de habitaciones u otra preferencia?",
      stage: "need-preference",
    };
  }

  if (stage === "need-preference") {
    return {
      reply: "Anotado. Para completar la solicitud de demostración, ¿qué nombre debemos poner y qué teléfono o correo de contacto prefiere facilitar? Utilice datos ficticios en esta demo.",
      stage: "need-contact",
    };
  }

  if (stage === "need-contact") {
    return {
      reply: "Gracias. Aquí tiene el resumen de la solicitud de ejemplo. El equipo de AQUA tendría que verificar la disponibilidad, las características y las tarifas antes de confirmar nada.\n\nEsta demo no envía datos a AQUA ni registra reservas reales. Puede escribir «reiniciar» para empezar otra vez.",
      stage: "summary",
    };
  }

  if (value.includes("reserva") || value.includes("reservar") || value.includes("solicitud")) {
    return {
      reply: "Con mucho gusto. Para preparar una solicitud, primero necesito saber para cuántas personas sería la estancia.",
      stage: "need-guests",
    };
  }

  if (value.includes("mar") || value.includes("terraza") || value.includes("apartamento") || value.includes("alojamiento")) {
    return {
      reply: "¡Estaré encantado de orientarle! 🌊 Para no darle información incorrecta, las características concretas y la disponibilidad deben verificarse con el equipo de AQUA. Si lo desea, podemos preparar una solicitud con sus preferencias y fechas.",
      stage: "start",
    };
  }

  if (value.includes("precio") || value.includes("disponibilidad") || value.includes("disponible") || value.includes("cuánto cuesta")) {
    return {
      reply: "Las tarifas y la disponibilidad deben comprobarse en el sistema de reservas de AQUA. Esta demostración no está conectada a ese sistema, así que no puedo confirmar precios ni disponibilidad reales. ¿Quiere preparar una solicitud para que el equipo la revise?",
      stage: "start",
    };
  }

  if (value.includes("hola") || value.includes("buenas") || value.includes("hello")) {
    return {
      reply: "¡Hola! 👋 Bienvenido/a a AQUA Apartments Bellamar. Puedo ayudarle con información general o guiarle para preparar una solicitud de reserva. ¿Qué necesita?",
      stage: "start",
    };
  }

  return {
    reply: "Gracias por su mensaje. Puedo orientarle sobre los apartamentos o ayudarle a preparar una solicitud de reserva. Tenga en cuenta que esta es una demo: no consulta disponibilidad, tarifas ni reservas reales.",
    stage: "start",
  };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: "agent",
      text: "¡Bienvenido/a a AQUA Apartments Bellamar! 🌊\n\nEstoy aquí para ayudarle con sus consultas y orientarle para preparar su próxima estancia. ¿Qué le gustaría consultar?",
      time: "17:30",
    },
  ]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("start");
  const [counter, setCounter] = useState(2);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text) return;

    const guestMessage: Message = { id: counter, from: "guest", text, time: clock() };
    const result = getReply(text, stage);
    const agentMessage: Message = { id: counter + 1, from: "agent", text: result.reply, time: clock() };

    setMessages((current) => [...current, guestMessage, agentMessage]);
    setStage(result.stage);
    setCounter((current) => current + 2);
    setInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function resetChat() {
    setMessages([
      {
        id: 1,
        from: "agent",
        text: "¡Bienvenido/a a AQUA Apartments Bellamar! 🌊\n\nEstoy aquí para ayudarle con sus consultas y orientarle para preparar su próxima estancia. ¿Qué le gustaría consultar?",
        time: clock(),
      },
    ]);
    setStage("start");
    setCounter(2);
    setInput("");
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Transport AI">
          <span className="brand-mark">T</span>
          <span>Transport <strong>AI</strong></span>
        </a>
        <span className="demo-pill"><span className="pulse" /> DEMOSTRACIÓN INTERACTIVA</span>
      </header>

      <section className="intro">
        <p className="eyebrow">ATENCIÓN AL HUÉSPED CON IA</p>
        <h1>Así podría funcionar AQUA en WhatsApp.</h1>
        <p className="intro-copy">Prueba una simulación de conversación para descubrir cómo un asistente virtual podría atender consultas y recoger solicitudes de reserva fuera del horario de oficina.</p>
      </section>

      <section className="demo-layout" aria-label="Demostración de chat">
        <aside className="side-panel">
          <div className="side-icon">🌊</div>
          <p className="side-kicker">EXPERIENCIA DE HUÉSPED</p>
          <h2>Una atención más ágil, también fuera de horario.</h2>
          <p>El agente puede guiar al huésped, recoger sus preferencias y preparar una solicitud para revisión del equipo.</p>
          <div className="feature-list">
            <div><span>✓</span><p>Respuestas a consultas frecuentes</p></div>
            <div><span>✓</span><p>Recogida de fechas y preferencias</p></div>
            <div><span>✓</span><p>Resumen previo a la revisión humana</p></div>
          </div>
          <div className="privacy-note">
            <span>ⓘ</span>
            <p>Demo con respuestas simuladas. No está conectada a WhatsApp, al sistema de reservas ni a los sistemas de AQUA.</p>
          </div>
        </aside>

        <div className="phone-wrap">
          <div className="phone">
            <div className="phone-notch" />
            <div className="chat-header">
              <div className="back-arrow">‹</div>
              <div className="avatar">🌊</div>
              <div className="contact-info">
                <strong>AQUA Apartments</strong>
                <span>Asistente virtual · Demo</span>
              </div>
              <div className="header-actions"><span>⌕</span><span>⋮</span></div>
            </div>
            <div className="chat-background">
              <div className="date-chip">HOY</div>
              <div className="demo-notice">Esta es una simulación de WhatsApp creada para mostrar una posible experiencia de atención.</div>
              <div className="messages">
                {messages.map((message) => (
                  <div key={message.id} className={`message-row ${message.from === "guest" ? "outgoing" : "incoming"}`}>
                    <div className="bubble">
                      <p>{message.text}</p>
                      <span className="message-meta">{message.time}{message.from === "guest" && <span className="checks"> ✓✓</span>}</span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
            <div className="quick-replies">
              {quickReplies.map((reply) => (
                <button key={reply} type="button" onClick={() => sendMessage(reply)}>{reply}</button>
              ))}
            </div>
            <form className="composer" onSubmit={handleSubmit}>
              <button className="emoji-button" type="button" onClick={() => setInput((value) => value + "😊")} aria-label="Añadir emoji">☺</button>
              <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe un mensaje" aria-label="Escribe un mensaje" />
              <button className="send-button" type="submit" aria-label="Enviar mensaje" disabled={!input.trim()}>➤</button>
            </form>
            <button className="reset-button" type="button" onClick={resetChat}>Reiniciar conversación</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>Una propuesta de <strong>Transport AI</strong></span>
        <span>Prototipo demostrativo · No realiza reservas reales</span>
      </footer>
    </main>
  );
}
