create table public.initial_surveys (
    id uuid default gen_random_uuid() primary key,
    passenger_id uuid not null references public.passengers(id) on delete cascade unique,
    rating_attention integer not null check (rating_attention >= 1 and rating_attention <= 5),
    info_clear text not null check (info_clear in ('Sí', 'Parcialmente', 'No')),
    understood_needs text not null check (understood_needs in ('Sí totalmente', 'Más o menos', 'No')),
    booking_ease integer not null check (booking_ease >= 1 and booking_ease <= 5),
    nps integer not null check (nps >= 0 and nps <= 10),
    comment text,
    responded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.initial_surveys enable row level security;

-- Políticas de seguridad
-- Pasajero puede ver su propia encuesta
create policy "Pasajeros pueden ver su propia encuesta inicial"
on public.initial_surveys for select
using (
    exists (
        select 1 from public.passengers p
        where p.id = initial_surveys.passenger_id
        and p.profile_id = auth.uid()
    )
);

-- Pasajero puede insertar su propia encuesta
create policy "Pasajeros pueden insertar su propia encuesta inicial"
on public.initial_surveys for insert
with check (
    exists (
        select 1 from public.passengers p
        where p.id = initial_surveys.passenger_id
        and p.profile_id = auth.uid()
    )
);

-- Operador/Admin pueden ver todas las encuestas
create policy "Operadores y Admins pueden ver todas las encuestas iniciales"
on public.initial_surveys for select
using (
    exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and (profiles.role = 'operator' or profiles.role = 'admin')
    )
);
