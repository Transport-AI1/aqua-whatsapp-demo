create extension if not exists pgcrypto;

create table if not exists public.aqua_reservation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  guest_name text not null,
  email text not null,
  phone text,
  check_in date not null,
  check_out date not null,
  guests integer not null check (guests between 1 and 8),
  apartment_type text,
  notes text,
  status text not null default 'Pendiente'
    check (status in ('Pendiente', 'Contactado', 'Confirmado', 'Rechazado')),
  source text not null default 'demo-aqua-bellamar'
);

alter table public.aqua_reservation_requests enable row level security;

-- No se crean políticas públicas: la demo inserta mediante la API del servidor
-- usando SUPABASE_SERVICE_ROLE_KEY, que nunca debe exponerse al navegador.
