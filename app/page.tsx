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
  const value = text.toLowerCase().trim();
  const has = (...terms: string[]) => terms.some((term) => value.includes(term));

  // Siempre priorizar una nueva intención antes de continuar el flujo de reserva.
  if (has("reiniciar", "empezar de nuevo", "cancelar")) {
    return {
      reply: "Por supuesto, dejamos la solicitud anterior. 🌊 ¿Qué desea consultar ahora: información de los apartamentos o preparar una reserva?",
      stage: "start",
    };
  }

  if (has("información", "informacion", "dame información", "dame informacion", "qué apartamentos", "que apartamentos", "apartamentos")) {
    return {
      reply: "¡Claro! 🌊 Puedo ayudarle a preparar una estancia en AQUA Apartments Bellamar. Para darle datos exactos sobre equipamiento, capacidad, servicios y características de cada apartamento, hay que utilizar la información oficial de AQUA; no quiero inventarle detalles. ¿Busca algún tipo de apartamento en particular o quiere preparar una reserva?",
      stage: "start",
    };
  }

  if (has("precio", "precios", "tarifa", "tarifas", "cuánto cuesta", "cuanto cuesta", "disponibilidad", "disponible")) {
    return {
      reply: "Las tarifas y la disponibilidad dependen de las fechas y del apartamento. Esta demo todavía utiliza datos de prueba y no está conectada al sistema de reservas de AQUA, así que no puedo confirmar un precio ni disponibilidad reales. Si quiere, podemos hacer una reserva ficticia para enseñarle cómo funcionaría.",
      stage: "start",
    };
  }

  if (has("mar", "vistas", "terraza", "habitaciones", "piscina", "parking", "aparcamiento", "mascota", "mascotas", "wifi", "wi-fi")) {
    return {
      reply: "Puedo ayudarle a encontrar una opción que encaje con sus preferencias. Para confirmar si un apartamento concreto tiene esa característica, tendremos que contrastarlo con la ficha oficial de AQUA. ¿Quiere que preparemos una solicitud de reserva de prueba?",
      stage: "start",
    };
  }

  if (has("reserva", "reservar", "solicitud", "alojarme", "alojamiento")) {
    return {
      reply: "¡Con mucho gusto! Vamos a preparar una reserva de demostración. 🌊 ¿Para cuántas personas sería la estancia? (Por ejemplo: 2 adultos y 1 niño).",
      stage: "need-guests",
    };
  }

  if (stage === "need-guests") {
    if (!/\\d/.test(value) && !has("adulto", "adultos", "persona", "personas", "niño", "niños", "nino", "ninos", "pareja", "familia")) {
      return { reply: "Para registrar la solicitud, necesito el número de huéspedes. Por ejemplo: «2 adultos».", stage };
    }
    return {
      reply: "Perfecto. ¿Qué fecha de entrada y qué fecha de salida desea? Por ejemplo, del 15 al 18 de noviembre de 2026.",
      stage: "need-dates",
    };
  }

  if (stage === "need-dates") {
    if (!/\\d/.test(value) && !has("mañana", "manana", "fin de semana", "noviembre", "diciembre", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre")) {
      return { reply: "No he identificado las fechas todavía. Indíqueme la entrada y la salida, por ejemplo: «del 15 al 18 de noviembre».", stage };
    }
    return {
      reply: "Gracias. ¿Qué prefiere para su estancia: vistas al mar, terraza, más habitaciones u otra característica? Lo anotaremos como preferencia, pendiente de comprobar.",
      stage: "need-preference",
    };
  }

  if (stage === "need-preference") {
    return {
      reply: "Anotado. Para completar la reserva ficticia, ¿qué nombre de prueba ponemos y qué teléfono o correo ficticio usamos? No introduzca datos personales reales en esta demostración.",
      stage: "need-contact",
    };
  }

  if (stage === "need-contact") {
    const looksLikeContact = value.includes("@") || /\\d{6,}/.test(value) || value.split(/\\s+/).length >= 2;
    if (!looksLikeContact) {
      return { reply: "Necesito un nombre de prueba y un contacto ficticio (correo o teléfono) para completar el ejemplo. No utilice sus datos reales.", stage };
    }
    return {
      reply: "Perfecto. Ya tenemos los datos de la solicitud de demostración. Antes de guardarla, el siguiente paso sería mostrarle un resumen con huéspedes, fechas, preferencias y contacto para que confirme. Esta demo usa datos ficticios: no consulta disponibilidad real ni confirma una reserva en AQUA.",
      stage: "summary",
    };
  }

  if (has("hola", "buenas", "buenos días", "buenas tardes")) {
    return {
      reply: "¡Hola! 👋 Bienvenido/a a AQUA Apartments Bellamar. Puedo orientarle sobre los apartamentos o ayudarle a preparar una reserva de demostración. ¿Qué necesita?",
      stage: "start",
    };
  }

  if (has("gracias")) {
    return { reply: "¡Gracias a usted! 😊 ¿Le ayudo con alguna otra consulta o quiere preparar una reserva de demostración?", stage: "start" };
  }

  return {
    reply: "Entiendo. Puedo ayudarle con información general, preferencias de alojamiento o una reserva de demostración. Si me dice qué necesita, le guío paso a paso. La disponibilidad y los precios reales todavía no están conectados.",
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
