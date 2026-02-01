-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.attrezzature (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attrezzature_pkey PRIMARY KEY (id)
);
CREATE TABLE public.comuni (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  province character varying,
  region character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT comuni_pkey PRIMARY KEY (id)
);
CREATE TABLE public.imprese (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  partita_iva character varying,
  phone character varying,
  email character varying,
  address character varying,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT imprese_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materiali_tubo (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT materiali_tubo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mezzi (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mezzi_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rilevamenti (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  operaio_id uuid NOT NULL,
  comune_id uuid NOT NULL,
  via character varying NOT NULL,
  numero_civico character varying,
  tipo_lavorazione_id uuid,
  impresa_id uuid,
  numero_operai integer,
  foto_url character varying,
  gps_lat numeric,
  gps_lon numeric,
  manual_lat numeric,
  manual_lon numeric,
  rilevamento_date date,
  rilevamento_time time without time zone,
  notes text,
  sync_status character varying DEFAULT 'synced'::character varying CHECK (sync_status::text = ANY (ARRAY['synced'::character varying, 'pending'::character varying, 'failed'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  materiale_tubo text,
  diametro text,
  altri_interventi text,
  submit_timestamp timestamp with time zone,
  submit_gps_lat double precision,
  submit_gps_lon double precision,
  materiale_tubo_id uuid,
  foto_panoramica_url text,
  foto_inizio_lavori_url text,
  foto_intervento_url text,
  foto_fine_lavori_url text,
  ora_fine time without time zone,
  tubo_esistente_materiale text,
  tubo_esistente_diametro text,
  tubo_esistente_pn text,
  tubo_esistente_profondita text,
  tubo_nuovo_materiale text,
  tubo_nuovo_diametro text,
  tubo_nuovo_pn text,
  tubo_nuovo_profondita text,
  CONSTRAINT rilevamenti_pkey PRIMARY KEY (id),
  CONSTRAINT rilevamenti_comune_id_fkey FOREIGN KEY (comune_id) REFERENCES public.comuni(id),
  CONSTRAINT rilevamenti_tipo_lavorazione_id_fkey FOREIGN KEY (tipo_lavorazione_id) REFERENCES public.tipi_lavorazione(id),
  CONSTRAINT rilevamenti_impresa_id_fkey FOREIGN KEY (impresa_id) REFERENCES public.imprese(id),
  CONSTRAINT rilevamenti_operaio_id_fkey FOREIGN KEY (operaio_id) REFERENCES public.users(id),
  CONSTRAINT rilevamenti_materiale_tubo_id_fkey FOREIGN KEY (materiale_tubo_id) REFERENCES public.materiali_tubo(id)
);
CREATE TABLE public.rilevamenti_attrezzature (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  rilevamento_id uuid NOT NULL,
  attrezzatura_id uuid NOT NULL,
  ore_utilizzo numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rilevamenti_attrezzature_pkey PRIMARY KEY (id),
  CONSTRAINT rilevamenti_attrezzature_rilevamento_id_fkey FOREIGN KEY (rilevamento_id) REFERENCES public.rilevamenti(id),
  CONSTRAINT rilevamenti_attrezzature_attrezzatura_id_fkey FOREIGN KEY (attrezzatura_id) REFERENCES public.attrezzature(id)
);
CREATE TABLE public.rilevamenti_mezzi (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  rilevamento_id uuid NOT NULL,
  mezzo_id uuid NOT NULL,
  ore_utilizzo numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rilevamenti_mezzi_pkey PRIMARY KEY (id),
  CONSTRAINT rilevamenti_mezzi_rilevamento_id_fkey FOREIGN KEY (rilevamento_id) REFERENCES public.rilevamenti(id),
  CONSTRAINT rilevamenti_mezzi_mezzo_id_fkey FOREIGN KEY (mezzo_id) REFERENCES public.mezzi(id)
);
CREATE TABLE public.rilevamenti_operai (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  rilevamento_id uuid NOT NULL,
  tipo_operaio text NOT NULL CHECK (tipo_operaio = ANY (ARRAY['specializzato'::text, 'qualificato'::text, 'comune'::text])),
  numero integer NOT NULL CHECK (numero > 0),
  ore_lavoro numeric NOT NULL CHECK (ore_lavoro > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rilevamenti_operai_pkey PRIMARY KEY (id),
  CONSTRAINT rilevamenti_operai_rilevamento_id_fkey FOREIGN KEY (rilevamento_id) REFERENCES public.rilevamenti(id)
);
CREATE TABLE public.tipi_lavorazione (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT tipi_lavorazione_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role text NOT NULL DEFAULT 'operaio'::text CHECK (role = ANY (ARRAY['operaio'::text, 'admin'::text, 'impresa'::text, 'responsabile'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  impresa_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_impresa_id_fkey FOREIGN KEY (impresa_id) REFERENCES public.imprese(id)
);