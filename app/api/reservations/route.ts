import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "La conexión con Supabase no está configurada en el servidor." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const guest_name = String(body.guest_name || "").trim().slice(0, 120);
    const guest_email = String(body.guest_email || body.email || "").trim().slice(0, 254);
    const guest_phone = String(body.guest_phone || body.phone || "").trim().slice(0, 40);
    const check_in = String(body.check_in || "");
    const check_out = String(body.check_out || "");
    const guests = Number(body.guests);
    const apartment_type = String(body.apartment_type || "").trim().slice(0, 100);
    const notes = String(body.notes || "").trim().slice(0, 2000);

    if (!guest_name || !guest_email || !/^\S+@\S+\.\S+$/.test(guest_email)) {
      return NextResponse.json({ error: "Indica tu nombre y un correo electrónico válido." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(check_in) || !/^\d{4}-\d{2}-\d{2}$/.test(check_out) || check_out <= check_in) {
      return NextResponse.json({ error: "Comprueba las fechas: la salida debe ser posterior a la entrada." }, { status: 400 });
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
      return NextResponse.json({ error: "El número de huéspedes debe estar entre 1 y 8." }, { status: 400 });
    }

    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/aqua_reservation_requests`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify([{
        guest_name,
        guest_email,
        guest_phone: guest_phone || null,
        check_in,
        check_out,
        guests,
        apartment_type: apartment_type || null,
        notes: notes || null,
      }]),
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Supabase reservation request failed:", response.status, result);
      return NextResponse.json({ error: "No se ha podido guardar la solicitud. Comprueba la configuración de Supabase." }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      id: result?.[0]?.id,
      message: "Solicitud guardada. Esto no confirma una reserva ni disponibilidad.",
    });
  } catch (error) {
    console.error("Reservation request error:", error);
    return NextResponse.json({ error: "Ha ocurrido un error al guardar la solicitud." }, { status: 500 });
  }
}
