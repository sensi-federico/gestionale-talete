-- Aggiunta campi di tracciamento inizio inserimento per imprese
alter table public.rilevamenti
  add column if not exists start_timestamp timestamptz,
  add column if not exists start_gps_lat double precision,
  add column if not exists start_gps_lon double precision;

comment on column public.rilevamenti.start_timestamp is 'Istante di avvio compilazione dichiarato dall''impresa';
comment on column public.rilevamenti.start_gps_lat is 'Latitudine (GPS) al momento di avvio compilazione';
comment on column public.rilevamenti.start_gps_lon is 'Longitudine (GPS) al momento di avvio compilazione';
