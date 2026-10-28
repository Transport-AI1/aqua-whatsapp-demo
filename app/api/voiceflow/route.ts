import { NextResponse } from "next/server";

const PROJECT_ID = "6ae235a652d497d4392a4e2e";
const ENVIRONMENT_ID = process.env.VOICEFLOW_ENVIRONMENT_ID || "main";
const BASE_URL = "https://general-runtime.voiceflow.com";

type Trace = { type?: string; payload?: unknown };

function traceMessages(traces: Trace[]): string[] {
  const messages: string[] = [];
  for (const trace of traces || []) {
    const payload = trace.payload as Record<string, unknown> | string | undefined;
    if (trace.type === "speak" || trace.type === "text") {
      const value = typeof payload === "string" ? payload : payload?.message ?? payload?.text;
      if (typeof value === "string" && value.trim()) messages.push(value.trim());
    } else if (trace.type === "visual" && payload && typeof payload === "object") {
      const visual = payload as Record<string, unknown>;
      const value = visual.message ?? visual.text;
      if (typeof value === "string" && value.trim()) messages.push(value.trim());
    }
  }
  return messages;
}

export async function POST(request: Request) {
  const apiKey = process.env.VOICEFLOW_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar VOICEFLOW_API_KEY en las variables de entorno de Vercel." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action === "text" ? "text" : "launch";
    let sessionKey = typeof body.sessionKey === "string" ? body.sessionKey : "";

    if (action === "launch") {
      const sessionResponse = await fetch(
        `${BASE_URL}/v4/project/${PROJECT_ID}/environment/${ENVIRONMENT_ID}/session`,
        {
          method: "POST",
          headers: { authorization: apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ userID: `aqua-demo-${crypto.randomUUID()}` }),
          cache: "no-store",
        }
      );
      const sessionData = await sessionResponse.json();
      if (!sessionResponse.ok || typeof sessionData.sessionKey !== "string") {
        console.error("Voiceflow session start failed:", sessionResponse.status, sessionData);
        return NextResponse.json({ error: "Voiceflow no ha podido iniciar una sesión. Comprueba la API key y el entorno del proyecto." }, { status: 502 });
      }
      sessionKey = sessionData.sessionKey;
    }

    if (!sessionKey) {
      return NextResponse.json({ error: "La sesión ha caducado. Recarga la página para iniciar otra conversación." }, { status: 400 });
    }

    const interactResponse = await fetch(`${BASE_URL}/v4/interact`, {
      method: "POST",
      headers: { authorization: sessionKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        action: action === "launch"
          ? { type: "launch" }
          : { type: "text", payload: String(body.text || "").slice(0, 2000) },
        config: { userTimezone: "Europe/Madrid" },
      }),
      cache: "no-store",
    });
    const interactData = await interactResponse.json();
    if (!interactResponse.ok) {
      console.error("Voiceflow interact failed:", interactResponse.status, JSON.stringify(interactData));
      return NextResponse.json({ error: "Voiceflow no ha podido procesar el mensaje. Inténtalo de nuevo." }, { status: 502 });
    }

    return NextResponse.json({ sessionKey, messages: traceMessages(interactData.traces || []) });
  } catch (error) {
    console.error("Voiceflow API route error:", error);
    return NextResponse.json({ error: "Error al conectar con Voiceflow. Inténtalo de nuevo." }, { status: 500 });
  }
}
