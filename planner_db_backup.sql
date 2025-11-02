--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: get_giorno_settimana(date); Type: FUNCTION; Schema: public; Owner: zy0n
--

CREATE FUNCTION public.get_giorno_settimana(data_input date) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN CASE 
        WHEN EXTRACT(DOW FROM data_input) = 0 THEN 1  -- Domenica
        WHEN EXTRACT(DOW FROM data_input) = 1 THEN 2  -- Lunedì
        WHEN EXTRACT(DOW FROM data_input) = 2 THEN 3  -- Martedì
        WHEN EXTRACT(DOW FROM data_input) = 3 THEN 4  -- Mercoledì
        WHEN EXTRACT(DOW FROM data_input) = 4 THEN 5  -- Giovedì
        WHEN EXTRACT(DOW FROM data_input) = 5 THEN 6  -- Venerdì
        WHEN EXTRACT(DOW FROM data_input) = 6 THEN 7  -- Sabato
    END;
END;
$$;


ALTER FUNCTION public.get_giorno_settimana(data_input date) OWNER TO zy0n;

--
-- Name: update_nome_completo(); Type: FUNCTION; Schema: public; Owner: zy0n
--

CREATE FUNCTION public.update_nome_completo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.nome_completo := TRIM(COALESCE(NEW.nome, '') || ' ' || COALESCE(NEW.cognome, ''));
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_nome_completo() OWNER TO zy0n;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: zy0n
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO zy0n;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assegnazioni; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.assegnazioni (
    id integer NOT NULL,
    postazione_id integer,
    slot_orario_id integer,
    data_turno date NOT NULL,
    stato character varying(20) DEFAULT 'assegnato'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT assegnazioni_stato_check CHECK (((stato)::text = ANY ((ARRAY['assegnato'::character varying, 'completato'::character varying, 'cancellato'::character varying])::text[])))
);


ALTER TABLE public.assegnazioni OWNER TO zy0n;

--
-- Name: assegnazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.assegnazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assegnazioni_id_seq OWNER TO zy0n;

--
-- Name: assegnazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.assegnazioni_id_seq OWNED BY public.assegnazioni.id;


--
-- Name: assegnazioni_volontari; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.assegnazioni_volontari (
    id integer NOT NULL,
    assegnazione_id integer,
    volontario_id integer,
    ruolo_turno character varying(50) DEFAULT 'volontario'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assegnazioni_volontari OWNER TO zy0n;

--
-- Name: assegnazioni_volontari_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.assegnazioni_volontari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.assegnazioni_volontari_id_seq OWNER TO zy0n;

--
-- Name: assegnazioni_volontari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.assegnazioni_volontari_id_seq OWNED BY public.assegnazioni_volontari.id;


--
-- Name: congregazioni; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.congregazioni (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    indirizzo text,
    citta character varying(100),
    provincia character varying(50),
    cap character varying(10),
    nazione character varying(100) DEFAULT 'Italia'::character varying,
    telefono character varying(20),
    email character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    codice character varying(20)
);


ALTER TABLE public.congregazioni OWNER TO zy0n;

--
-- Name: TABLE congregazioni; Type: COMMENT; Schema: public; Owner: zy0n
--

COMMENT ON TABLE public.congregazioni IS 'Tabella per gestire le congregazioni (multi-tenant)';


--
-- Name: congregazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.congregazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.congregazioni_id_seq OWNER TO zy0n;

--
-- Name: congregazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.congregazioni_id_seq OWNED BY public.congregazioni.id;


--
-- Name: disponibilita; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.disponibilita (
    id integer NOT NULL,
    volontario_id integer,
    data date NOT NULL,
    stato character varying(20) DEFAULT 'disponibile'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    slot_orario_id integer NOT NULL,
    CONSTRAINT disponibilita_stato_check CHECK (((stato)::text = ANY ((ARRAY['disponibile'::character varying, 'non_disponibile'::character varying])::text[])))
);


ALTER TABLE public.disponibilita OWNER TO zy0n;

--
-- Name: disponibilita_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.disponibilita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.disponibilita_id_seq OWNER TO zy0n;

--
-- Name: disponibilita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.disponibilita_id_seq OWNED BY public.disponibilita.id;


--
-- Name: gruppi_servizio; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.gruppi_servizio (
    id integer NOT NULL,
    congregazione_id integer NOT NULL,
    nome character varying(255) NOT NULL,
    sorvegliante_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gruppi_servizio OWNER TO zy0n;

--
-- Name: TABLE gruppi_servizio; Type: COMMENT; Schema: public; Owner: zy0n
--

COMMENT ON TABLE public.gruppi_servizio IS 'Tabella per gestire i gruppi di servizio all''interno delle congregazioni';


--
-- Name: gruppi_servizio_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.gruppi_servizio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gruppi_servizio_id_seq OWNER TO zy0n;

--
-- Name: gruppi_servizio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.gruppi_servizio_id_seq OWNED BY public.gruppi_servizio.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.notifications (
    id character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    details text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read boolean DEFAULT false,
    admin_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO zy0n;

--
-- Name: notifiche; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.notifiche (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    titolo character varying(255) NOT NULL,
    messaggio text NOT NULL,
    destinatario_id integer,
    letta boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifiche OWNER TO zy0n;

--
-- Name: notifiche_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.notifiche_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifiche_id_seq OWNER TO zy0n;

--
-- Name: notifiche_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.notifiche_id_seq OWNED BY public.notifiche.id;


--
-- Name: postazioni; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.postazioni (
    id integer NOT NULL,
    luogo character varying(255) NOT NULL,
    indirizzo text,
    giorni_settimana integer[] DEFAULT '{1,2,3,4,5,6,7}'::integer[],
    stato character varying(20) DEFAULT 'attiva'::character varying,
    max_proclamatori integer DEFAULT 3,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    congregazione_id integer NOT NULL,
    CONSTRAINT postazioni_stato_check CHECK (((stato)::text = ANY ((ARRAY['attiva'::character varying, 'inattiva'::character varying])::text[])))
);


ALTER TABLE public.postazioni OWNER TO zy0n;

--
-- Name: postazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.postazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.postazioni_id_seq OWNER TO zy0n;

--
-- Name: postazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.postazioni_id_seq OWNED BY public.postazioni.id;


--
-- Name: slot_orari; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.slot_orari (
    id integer NOT NULL,
    postazione_id integer,
    orario_inizio time without time zone NOT NULL,
    orario_fine time without time zone NOT NULL,
    max_volontari integer DEFAULT 3,
    stato character varying(20) DEFAULT 'attivo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slot_orari_stato_check CHECK (((stato)::text = ANY ((ARRAY['attivo'::character varying, 'inattivo'::character varying])::text[])))
);


ALTER TABLE public.slot_orari OWNER TO zy0n;

--
-- Name: slot_orari_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.slot_orari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.slot_orari_id_seq OWNER TO zy0n;

--
-- Name: slot_orari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.slot_orari_id_seq OWNED BY public.slot_orari.id;


--
-- Name: volontari; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.volontari (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    cognome character varying(100) NOT NULL,
    sesso character(1) NOT NULL,
    stato character varying(20) DEFAULT 'attivo'::character varying,
    ultima_assegnazione timestamp without time zone,
    email character varying(255),
    telefono character varying(20),
    password_hash character varying(255),
    ruolo character varying(20) DEFAULT 'volontario'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    congregazione_id integer,
    gruppo_servizio_id integer,
    nome_completo character varying(510),
    data_nascita date,
    data_battesimo date,
    nominato character varying(50) DEFAULT 'No'::character varying,
    cellulare character varying(20),
    telefono_casa character varying(20),
    indirizzo text,
    citta character varying(100),
    provincia character varying(50),
    cap character varying(10),
    nazione character varying(100) DEFAULT 'Italia'::character varying,
    status_spirituale character varying(100) DEFAULT 'Proclamatore'::character varying,
    CONSTRAINT volontari_nominato_check CHECK (((nominato)::text = ANY ((ARRAY['No'::character varying, 'Servitore di Ministero'::character varying, 'Anziano'::character varying])::text[]))),
    CONSTRAINT volontari_ruolo_check CHECK (((ruolo)::text = ANY ((ARRAY['volontario'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT volontari_sesso_check CHECK ((sesso = ANY (ARRAY['M'::bpchar, 'F'::bpchar]))),
    CONSTRAINT volontari_stato_check CHECK (((stato)::text = ANY ((ARRAY['attivo'::character varying, 'non_attivo'::character varying])::text[]))),
    CONSTRAINT volontari_status_spirituale_check CHECK (((status_spirituale)::text = ANY ((ARRAY['Proclamatore'::character varying, 'Pioniere Ausiliare'::character varying, 'Pioniere Ausiliare Continuo'::character varying, 'Pioniere Regolare'::character varying, 'Pioniere Speciale'::character varying])::text[])))
);


ALTER TABLE public.volontari OWNER TO zy0n;

--
-- Name: COLUMN volontari.nome_completo; Type: COMMENT; Schema: public; Owner: zy0n
--

COMMENT ON COLUMN public.volontari.nome_completo IS 'Nome completo generato automaticamente da nome + cognome';


--
-- Name: COLUMN volontari.nominato; Type: COMMENT; Schema: public; Owner: zy0n
--

COMMENT ON COLUMN public.volontari.nominato IS 'Ruolo spirituale: No, Servitore di Ministero, Anziano';


--
-- Name: COLUMN volontari.status_spirituale; Type: COMMENT; Schema: public; Owner: zy0n
--

COMMENT ON COLUMN public.volontari.status_spirituale IS 'Status di servizio: Proclamatore, Pioniere Ausiliare, etc.';


--
-- Name: volontari_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.volontari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.volontari_id_seq OWNER TO zy0n;

--
-- Name: volontari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.volontari_id_seq OWNED BY public.volontari.id;


--
-- Name: volontari_postazioni_abilitate; Type: TABLE; Schema: public; Owner: zy0n
--

CREATE TABLE public.volontari_postazioni_abilitate (
    id integer NOT NULL,
    volontario_id integer NOT NULL,
    postazione_id integer NOT NULL,
    abilitato boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.volontari_postazioni_abilitate OWNER TO zy0n;

--
-- Name: volontari_postazioni_abilitate_id_seq; Type: SEQUENCE; Schema: public; Owner: zy0n
--

CREATE SEQUENCE public.volontari_postazioni_abilitate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.volontari_postazioni_abilitate_id_seq OWNER TO zy0n;

--
-- Name: volontari_postazioni_abilitate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zy0n
--

ALTER SEQUENCE public.volontari_postazioni_abilitate_id_seq OWNED BY public.volontari_postazioni_abilitate.id;


--
-- Name: assegnazioni id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni ALTER COLUMN id SET DEFAULT nextval('public.assegnazioni_id_seq'::regclass);


--
-- Name: assegnazioni_volontari id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni_volontari ALTER COLUMN id SET DEFAULT nextval('public.assegnazioni_volontari_id_seq'::regclass);


--
-- Name: congregazioni id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.congregazioni ALTER COLUMN id SET DEFAULT nextval('public.congregazioni_id_seq'::regclass);


--
-- Name: disponibilita id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.disponibilita ALTER COLUMN id SET DEFAULT nextval('public.disponibilita_id_seq'::regclass);


--
-- Name: gruppi_servizio id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.gruppi_servizio ALTER COLUMN id SET DEFAULT nextval('public.gruppi_servizio_id_seq'::regclass);


--
-- Name: notifiche id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.notifiche ALTER COLUMN id SET DEFAULT nextval('public.notifiche_id_seq'::regclass);


--
-- Name: postazioni id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.postazioni ALTER COLUMN id SET DEFAULT nextval('public.postazioni_id_seq'::regclass);


--
-- Name: slot_orari id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.slot_orari ALTER COLUMN id SET DEFAULT nextval('public.slot_orari_id_seq'::regclass);


--
-- Name: volontari id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari ALTER COLUMN id SET DEFAULT nextval('public.volontari_id_seq'::regclass);


--
-- Name: volontari_postazioni_abilitate id; Type: DEFAULT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari_postazioni_abilitate ALTER COLUMN id SET DEFAULT nextval('public.volontari_postazioni_abilitate_id_seq'::regclass);


--
-- Data for Name: assegnazioni; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.assegnazioni (id, postazione_id, slot_orario_id, data_turno, stato, note, created_at, updated_at) FROM stdin;
95	16	50	2025-01-27	assegnato	\N	2025-07-25 04:16:06.99606	2025-07-25 04:16:06.99606
1181	16	50	2025-08-04	assegnato	\N	2025-08-10 22:31:20.719111	2025-08-10 22:31:20.719111
1182	16	51	2025-08-04	assegnato	\N	2025-08-10 22:31:20.782941	2025-08-10 22:31:20.782941
1183	16	50	2025-08-11	assegnato	\N	2025-08-10 22:31:20.802288	2025-08-10 22:31:20.802288
118	16	50	2025-01-28	assegnato	\N	2025-07-25 04:19:44.686065	2025-07-25 04:19:44.686065
119	16	50	2025-01-30	assegnato	\N	2025-07-25 04:21:34.730575	2025-07-25 04:21:34.730575
120	17	37	2025-07-21	assegnato	\N	2025-07-25 04:23:50.557963	2025-07-25 04:23:50.557963
121	17	38	2025-07-21	assegnato	\N	2025-07-25 04:23:50.572569	2025-07-25 04:23:50.572569
122	17	37	2025-07-22	assegnato	\N	2025-07-25 04:23:50.585247	2025-07-25 04:23:50.585247
123	17	38	2025-07-22	assegnato	\N	2025-07-25 04:23:50.589872	2025-07-25 04:23:50.589872
124	17	37	2025-07-23	assegnato	\N	2025-07-25 04:23:50.601511	2025-07-25 04:23:50.601511
125	17	38	2025-07-23	assegnato	\N	2025-07-25 04:23:50.603722	2025-07-25 04:23:50.603722
126	17	37	2025-07-24	assegnato	\N	2025-07-25 04:23:50.608475	2025-07-25 04:23:50.608475
127	17	38	2025-07-24	assegnato	\N	2025-07-25 04:23:50.610451	2025-07-25 04:23:50.610451
128	17	37	2025-07-25	assegnato	\N	2025-07-25 04:23:50.61507	2025-07-25 04:23:50.61507
129	17	38	2025-07-25	assegnato	\N	2025-07-25 04:23:50.61695	2025-07-25 04:23:50.61695
133	19	52	2025-07-25	assegnato	\N	2025-07-25 04:23:50.622382	2025-07-25 04:23:50.622382
137	16	50	2025-07-27	assegnato	\N	2025-07-25 04:23:50.631326	2025-07-25 04:23:50.631326
138	16	51	2025-07-27	assegnato	\N	2025-07-25 04:23:50.634319	2025-07-25 04:23:50.634319
142	16	50	2025-07-28	assegnato	\N	2025-07-25 04:24:21.431222	2025-07-25 04:24:21.431222
143	16	51	2025-07-28	assegnato	\N	2025-07-25 04:24:21.44338	2025-07-25 04:24:21.44338
144	17	37	2025-07-28	assegnato	\N	2025-07-25 04:24:21.446377	2025-07-25 04:24:21.446377
145	17	38	2025-07-28	assegnato	\N	2025-07-25 04:24:21.448754	2025-07-25 04:24:21.448754
149	17	37	2025-07-29	assegnato	\N	2025-07-25 04:24:21.461126	2025-07-25 04:24:21.461126
150	17	38	2025-07-29	assegnato	\N	2025-07-25 04:24:21.463785	2025-07-25 04:24:21.463785
151	17	37	2025-07-30	assegnato	\N	2025-07-25 04:24:21.468641	2025-07-25 04:24:21.468641
152	17	38	2025-07-30	assegnato	\N	2025-07-25 04:24:21.471299	2025-07-25 04:24:21.471299
328	17	37	2025-07-09	assegnato	\N	2025-07-25 04:48:14.5271	2025-07-25 04:48:14.5271
330	17	37	2025-07-31	assegnato	\N	2025-07-25 04:48:57.987438	2025-07-25 04:48:57.987438
331	17	38	2025-07-31	assegnato	\N	2025-07-25 04:48:57.993425	2025-07-25 04:48:57.993425
374	16	50	2025-01-15	assegnato	\N	2025-07-25 05:02:58.314443	2025-07-25 05:02:58.314443
375	16	51	2025-01-16	assegnato	\N	2025-07-25 05:03:16.166884	2025-07-25 05:03:16.166884
\.


--
-- Data for Name: assegnazioni_volontari; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.assegnazioni_volontari (id, assegnazione_id, volontario_id, ruolo_turno, created_at) FROM stdin;
2324	1181	1	volontario	2025-08-10 22:31:20.724849
238	133	1	volontario	2025-07-25 04:23:50.622634
2327	1182	1	volontario	2025-08-10 22:31:20.784142
245	138	1	volontario	2025-07-25 04:23:50.63471
252	142	1	volontario	2025-07-25 04:24:21.440529
264	149	1	volontario	2025-07-25 04:24:21.461597
\.


--
-- Data for Name: congregazioni; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.congregazioni (id, nome, indirizzo, citta, provincia, cap, nazione, telefono, email, created_at, updated_at, codice) FROM stdin;
2	Congregazione Test	\N	\N	\N	\N	Italia	\N	\N	2025-08-11 01:06:57.605057	2025-08-11 01:06:57.605057	0002
1	Palermo Uditore	Via Altarello 161	Palermo	PA	90100	Italia	00000000	altarellojw@gmail.com	2025-08-10 21:46:28.527877	2025-08-10 22:37:31.262205	001
\.


--
-- Data for Name: disponibilita; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.disponibilita (id, volontario_id, data, stato, note, created_at, slot_orario_id) FROM stdin;
4605	1	2025-07-24	disponibile	\N	2025-07-25 02:37:41.548054	37
4606	1	2025-07-24	disponibile	\N	2025-07-25 02:37:41.548054	38
4610	1	2025-07-25	disponibile	\N	2025-07-25 02:37:41.548054	37
4611	1	2025-07-25	disponibile	\N	2025-07-25 02:37:41.548054	38
4613	1	2025-07-25	disponibile	\N	2025-07-25 02:37:41.548054	52
4616	1	2025-07-27	disponibile	\N	2025-07-25 02:37:41.548054	50
4617	1	2025-07-27	disponibile	\N	2025-07-25 02:37:41.548054	51
4621	1	2025-07-28	disponibile	\N	2025-07-25 02:37:41.548054	50
4622	1	2025-07-28	disponibile	\N	2025-07-25 02:37:41.548054	51
4626	1	2025-07-28	disponibile	\N	2025-07-25 02:37:41.548054	37
4627	1	2025-07-28	disponibile	\N	2025-07-25 02:37:41.548054	38
4628	1	2025-07-29	disponibile	\N	2025-07-25 02:37:41.548054	37
4629	1	2025-07-29	disponibile	\N	2025-07-25 02:37:41.548054	38
4633	1	2025-07-30	non_disponibile	\N	2025-07-25 02:37:41.548054	37
4634	1	2025-07-30	non_disponibile	\N	2025-07-25 02:37:41.548054	38
4661	1	2025-08-19	disponibile	\N	2025-08-03 11:58:29.226308	50
4662	1	2025-08-19	disponibile	\N	2025-08-03 11:58:29.226308	51
4663	1	2025-08-19	disponibile	\N	2025-08-03 11:58:29.226308	37
4664	1	2025-08-19	disponibile	\N	2025-08-03 11:58:29.226308	38
4665	1	2025-08-21	disponibile	\N	2025-08-03 11:58:29.226308	37
4666	1	2025-08-21	disponibile	\N	2025-08-03 11:58:29.226308	38
4667	1	2025-08-22	disponibile	\N	2025-08-03 11:58:29.226308	37
4668	1	2025-08-22	disponibile	\N	2025-08-03 11:58:29.226308	38
4669	1	2025-08-30	disponibile	\N	2025-08-03 11:58:29.226308	37
4670	1	2025-08-30	disponibile	\N	2025-08-03 11:58:29.226308	38
4671	1	2025-08-29	disponibile	\N	2025-08-03 11:58:29.226308	38
4672	1	2025-08-29	disponibile	\N	2025-08-03 11:58:29.226308	37
4673	1	2025-08-26	disponibile	\N	2025-08-03 11:58:29.226308	38
4674	1	2025-08-26	disponibile	\N	2025-08-03 11:58:29.226308	37
4689	1	2025-08-04	disponibile	\N	2025-08-03 19:43:37.310853	50
4690	1	2025-08-04	disponibile	\N	2025-08-03 19:43:37.310853	51
4691	1	2025-08-05	disponibile	\N	2025-08-03 19:43:37.310853	50
4692	1	2025-08-05	disponibile	\N	2025-08-03 19:43:37.310853	51
4693	1	2025-08-05	disponibile	\N	2025-08-03 19:43:37.310853	37
4694	1	2025-08-05	disponibile	\N	2025-08-03 19:43:37.310853	38
4695	1	2025-08-06	disponibile	\N	2025-08-03 19:43:37.310853	37
4696	1	2025-08-06	disponibile	\N	2025-08-03 19:43:37.310853	38
4697	1	2025-08-07	disponibile	\N	2025-08-03 19:43:37.310853	37
4698	1	2025-08-07	disponibile	\N	2025-08-03 19:43:37.310853	38
4699	1	2025-08-20	disponibile	\N	2025-08-03 19:43:37.310853	38
4700	1	2025-08-20	disponibile	\N	2025-08-03 19:43:37.310853	37
4701	1	2025-08-28	disponibile	\N	2025-08-03 19:43:37.310853	37
4702	1	2025-08-28	disponibile	\N	2025-08-03 19:43:37.310853	38
\.


--
-- Data for Name: gruppi_servizio; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.gruppi_servizio (id, congregazione_id, nome, sorvegliante_id, created_at, updated_at) FROM stdin;
3	1	Gruppo Marco ARCARA	5	2025-08-11 00:16:03.203561	2025-08-11 00:16:03.203561
4	1	Gruppo Domenico PASQUALE	81	2025-08-11 00:16:03.210248	2025-08-11 00:16:03.210248
5	1	Gruppo Vincenzo SCHIMMENTI	91	2025-08-11 00:16:03.212895	2025-08-11 00:16:03.212895
6	1	Gruppo Riccardo BADAGLIACCA	11	2025-08-11 00:16:03.215498	2025-08-11 00:16:03.215498
7	1	Gruppo Giovanni RICCOBONO	85	2025-08-11 00:16:03.217149	2025-08-11 00:16:03.217149
8	1	Gruppo Davide CARROCCETTO	25	2025-08-11 00:16:03.218262	2025-08-11 00:16:03.218262
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.notifications (id, type, title, message, details, "timestamp", read, admin_id, created_at, updated_at) FROM stdin;
notif-1	info	🚀 Sistema Avviato	Il sistema di notifiche è stato attivato con successo	{"sistema": "notifiche", "stato": "attivo"}	2025-07-23 01:31:23.587721	f	\N	2025-07-23 01:31:23.587721	2025-07-23 01:31:23.587721
notif-2	success	✅ Test Completato	Test di assegnazione automatica completato con successo	{"test": "assegnazione", "risultato": "successo"}	2025-07-23 01:31:23.587721	f	\N	2025-07-23 01:31:23.587721	2025-07-23 01:31:23.587721
\.


--
-- Data for Name: notifiche; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.notifiche (id, tipo, titolo, messaggio, destinatario_id, letta, created_at) FROM stdin;
\.


--
-- Data for Name: postazioni; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.postazioni (id, luogo, indirizzo, giorni_settimana, stato, max_proclamatori, created_at, updated_at, congregazione_id) FROM stdin;
17	Stazione Notarbartolo	Via Notarbartolo, Milano	{2,3,4,5,6}	attiva	2	2025-07-24 16:03:59.77177	2025-08-10 23:47:22.326156	1
16	Piazza Giotto	Piazza Giotto, Milano	{1,2}	attiva	3	2025-07-24 16:03:52.736018	2025-08-10 23:47:22.326156	1
19	Villa Sperlinga	Piazza Sperlinga	{6}	inattiva	2	2025-07-24 17:42:46.158365	2025-08-10 23:47:22.326156	1
\.


--
-- Data for Name: slot_orari; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.slot_orari (id, postazione_id, orario_inizio, orario_fine, max_volontari, stato, created_at, updated_at) FROM stdin;
37	17	10:00:00	12:00:00	2	attivo	2025-07-24 16:03:59.77177	2025-07-24 16:03:59.77177
38	17	15:00:00	17:00:00	2	attivo	2025-07-24 16:03:59.77177	2025-07-24 16:03:59.77177
50	16	09:00:00	11:00:00	3	attivo	2025-07-24 17:10:18.986365	2025-07-24 17:10:18.986365
51	16	14:00:00	16:00:00	3	attivo	2025-07-24 17:10:18.986365	2025-07-24 17:10:18.986365
52	19	09:30:00	11:30:00	3	attivo	2025-07-24 17:42:46.158365	2025-07-24 17:42:46.158365
\.


--
-- Data for Name: volontari; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.volontari (id, nome, cognome, sesso, stato, ultima_assegnazione, email, telefono, password_hash, ruolo, created_at, updated_at, congregazione_id, gruppo_servizio_id, nome_completo, data_nascita, data_battesimo, nominato, cellulare, telefono_casa, indirizzo, citta, provincia, cap, nazione, status_spirituale) FROM stdin;
98	Test	User	M	attivo	\N	test@congregazione2.com	\N	$2a$10$FvpNTb38po5CC9opMb9kS.3MQPX9TYmtO45S.raAG3bLET.vPUfP.	volontario	2025-08-11 01:06:57.691544	2025-08-11 01:06:57.691544	2	\N	Test User	\N	\N	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
1	Amministratore	Sistema	M	attivo	2025-08-04 00:00:00	info@advpro.it	3288956870	$2a$10$XS1AcmVSGb4uKFdOO32SA.uGRHnV59rJe1khxfuGIqq.4wJxdc72q	admin	2025-07-25 02:33:08.912766	2025-08-11 01:11:05.31827	1	5	Amministratore Sistema	\N	\N	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
10	Eulalia	ARENA	F	attivo	\N	eulaliamatera@gmail.com		$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.758036	2025-08-11 01:17:10.98088	1	5	Eulalia ARENA	1997-01-10	2015-10-03	No	327 3278709		via Esterna Spartiviolo 2/19	Monreale	PA		Italia	Pioniere Regolare
2	Giacomo	ALFANO	M	non_attivo	\N	giacomo.alfano75lm@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.731764	2025-08-11 00:15:25.731764	1	\N	Giacomo ALFANO	1975-06-26	2005-07-02	No	3898798044	\N	Via Cartagine, 1	Palermo	\N	90100	IT	Proclamatore
3	Antonella	ARBUSTO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.743375	2025-08-11 00:15:25.743375	1	\N	Antonella ARBUSTO	1971-06-29	2022-03-13	No	388 7542988	\N	\N	\N	\N	\N	Italia	Proclamatore
5	Marco	ARCARA	M	attivo	\N	arcaramarco@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.746383	2025-08-11 00:16:56.780921	1	3	Marco ARCARA	1973-07-17	1989-08-26	Anziano	3388126740	091423647	VIA MARIA MONTESSORI 11	Palermo	\N	90100	IT	Proclamatore
6	Morena	ARCARA	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.748344	2025-08-11 00:16:56.783721	1	3	Morena ARCARA	2007-05-31	2023-06-24	No	3500820828	\N	VIA MARIA MONTESSORI 11	Palermo	\N	90100	IT	Proclamatore
7	Paola	ARCARA	F	attivo	\N	francypaola14@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.750346	2025-08-11 00:16:56.785447	1	3	Paola ARCARA	1973-02-16	1989-12-16	No	3205663817	091423647	VIA MARIA MONTESSORI 11	Palermo	\N	90100	IT	Pioniere Regolare
8	Danny	ARENA	M	attivo	\N	arenadanny71@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.754033	2025-08-11 00:16:56.787447	1	4	Danny ARENA	2001-12-28	2018-07-28	No	3288161692	\N	Via Mammana, 48	Palermo	\N	90100	IT	Proclamatore
9	Davide	ARENA	M	attivo	\N	phoenix.da95@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.756785	2025-08-11 00:16:56.789125	1	5	Davide ARENA	1995-01-17	2018-03-04	Servitore di Ministero	3288956870	\N	via Esterna Spartiviolo 2/19	Monreale	\N	90100	IT	Pioniere Regolare
11	Riccardo	BADAGLIACCA	M	attivo	\N	badagliaccariccardo@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.759095	2025-08-11 00:16:56.798632	1	6	Riccardo BADAGLIACCA	1974-05-26	1991-10-19	Anziano	\N	\N	\N	\N	\N	\N	Italia	Pioniere Regolare
12	Viviana	BADAGLIACCA	F	attivo	\N	vivianabadagliacca@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.760737	2025-08-11 00:16:56.802656	1	6	Viviana BADAGLIACCA	1976-04-22	1989-08-26	No	329 4080216	\N	\N	\N	\N	\N	Italia	Pioniere Regolare
13	Franco	BAIAMONTE	M	attivo	\N	meridionaleservizi@libero.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.762321	2025-08-11 00:16:56.806906	1	7	Franco BAIAMONTE	1976-02-17	1988-08-27	No	3286194930	\N	Via Pozzo 88	Palermo	PA	90135	IT	Proclamatore
14	Selenia	BAIAMONTE	F	attivo	\N	f.selenia.bc@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.763412	2025-08-11 00:16:56.811063	1	7	Selenia BAIAMONTE	1990-05-30	2002-07-06	No	3894415527	\N	Via Pozzo 88	Palermo	PA	90135	IT	Proclamatore
15	Anna	BERTINI	F	attivo	\N	annabertini28@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.765	2025-08-11 00:16:56.812953	1	6	Anna BERTINI	1970-05-30	1994-07-23	No	3393207914	\N	\N	\N	\N	\N	Italia	Proclamatore
16	Edoardo	BIRRIOLO	M	attivo	\N	Edoardobirriolo92@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.766729	2025-08-11 00:16:56.816802	1	6	Edoardo BIRRIOLO	1992-11-07	2023-02-11	Servitore di Ministero	380 1476838	\N	\N	\N	\N	\N	Italia	Pioniere Regolare
17	Antonella	BOLOGNA	F	attivo	\N	antonellacometa69@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.768198	2025-08-11 00:16:56.819437	1	8	Antonella BOLOGNA	1968-01-03	1985-08-15	No	3914677840	\N	Via Mammana, 118	Palermo	PA	90135	IT	Proclamatore
18	Giovanni	BOLOGNA	M	attivo	\N	bolognagiovanni70@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.769814	2025-08-11 00:16:56.821146	1	8	Giovanni BOLOGNA	1970-02-19	1986-11-15	Servitore di Ministero	3206418851	\N	Via Mammana, 118	Palermo	PA	90135	IT	Proclamatore
19	Cristina	BOSSAN	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.770591	2025-08-11 00:16:56.825637	1	4	Cristina BOSSAN	1972-01-18	1989-04-22	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
20	Giuseppa	BUZZOTTA	F	attivo	\N	giuseppaparriniello748@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.771329	2025-08-11 00:16:56.828284	1	7	Giuseppa BUZZOTTA	1950-02-25	1984-11-17	No	3895277258	\N	\N	\N	\N	\N	Italia	Proclamatore
21	Marisa	CALA'	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.772284	2025-08-11 00:16:56.831148	1	8	Marisa CALA'	1948-04-12	\N	No	377 0909910	\N	\N	\N	\N	\N	Italia	Proclamatore
22	Fabrizio	CARAVELLO	M	attivo	\N	fabri217@icloud.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.77321	2025-08-11 00:16:56.833063	1	4	Fabrizio CARAVELLO	1988-05-19	2013-03-23	Servitore di Ministero	3314904196	\N	Via Mammana, 118	Palermo	PA	90135	IT	Pioniere Regolare
23	Rosetta	CARAVELLO	F	attivo	\N	tulipano59@icloud.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.774653	2025-08-11 00:16:56.835001	1	8	Rosetta CARAVELLO	1959-12-01	1993-02-14	No	328 6156827	\N	Via Fondo Gallo 8/L	\N	\N	\N	Italia	Proclamatore
24	Simona	CARAVELLO	F	attivo	\N	simonabologna@live.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.776505	2025-08-11 00:16:56.837007	1	4	Simona CARAVELLO	1997-07-28	2013-11-02	No	3667471145	\N	Via Mammana, 118	Palermo	PA	90135	IT	Pioniere Regolare
26	Debora	CARROCCETTO	F	attivo	\N	debbi74.ds@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.778732	2025-08-11 00:16:56.840355	1	8	Debora CARROCCETTO	1974-12-13	1988-06-05	No	3283113579	091408710	Via Casalini, 256	Palermo	\N	90100	IT	Pioniere Regolare
27	Miriam	CARROCCETTO	F	attivo	\N	mimi.carroccetto@hotmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.779648	2025-08-11 00:16:56.841071	1	3	Miriam CARROCCETTO	2002-05-08	2013-08-24	No	3884383089	091408710	Via Casalini, 256	Palermo	\N	90100	IT	Pioniere Regolare
28	Maria	CAVIGLIA	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.780213	2025-08-11 00:16:56.842183	1	7	Maria CAVIGLIA	1962-01-28	1987-08-15	No	3421912461	\N	Via Uditore, 36	Palermo	\N	90100	IT	Proclamatore
29	Antonina	CHIOVARO	F	attivo	\N	antoninachiovaro@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.780962	2025-08-11 00:16:56.842874	1	6	Antonina CHIOVARO	1948-01-15	1978-04-09	No	3205656359	\N	Via Aci,7	Palermo	PA	90100	IT	Pioniere Regolare
99	Admin	User	M	attivo	\N	admin@planner.com	\N	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	admin	2025-08-11 01:08:21.306123	2025-08-11 01:08:21.306123	1	\N	Admin User	\N	\N	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
49	Carmela	GRESTI	F	non_attivo	\N	scutocarmela2@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.818906	2025-08-11 00:15:25.818906	1	\N	Carmela GRESTI	1952-07-02	1984-07-21	No	3288834313	\N	Via Castellana, 54	Palermo	\N	90100	IT	Proclamatore
52	Fabrizio	GUERCIA	M	non_attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.822432	2025-08-11 00:15:25.822432	1	\N	Fabrizio GUERCIA	1980-09-10	2011-05-07	No	3385468775	\N	Via Olivella, 2	Palermo	\N	90100	IT	Proclamatore
53	Valentina	GUERCIA	F	non_attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.8231	2025-08-11 00:15:25.8231	1	\N	Valentina GUERCIA	1984-02-08	2014-08-23	No	3884874955	\N	Via Olivella, 2	Palermo	\N	90100	IT	Proclamatore
31	Giuseppe	CHIOVARO	M	attivo	\N	giuseppechiovaro@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.786413	2025-08-11 00:16:56.8446	1	6	Giuseppe CHIOVARO	1942-01-14	1978-04-09	Anziano	3205656369	\N	Via Aci,7	Palermo	PA	90100	IT	Proclamatore
32	Salvatore	CIRIVELLO	M	attivo	\N	salvinocirivello@libero.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.787608	2025-08-11 00:16:56.845282	1	5	Salvatore CIRIVELLO	1975-06-06	2021-07-25	No	3474798847	\N	Viale Lazio, 128	palermo	\N	90100	Italia	Proclamatore
33	Angela	CLEMENTE	F	attivo	\N	angyclem85@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.788744	2025-08-11 00:16:56.846179	1	7	Angela CLEMENTE	1985-11-19	2001-04-09	No	3202174890	\N	via dei redentoristi, 25	Palermo	\N	90100	IT	Proclamatore
34	Nicola Angelo	CLEMENTE	M	attivo	\N	clementenicolaangelo@libero.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.790277	2025-08-11 00:16:56.847	1	7	Nicola Angelo CLEMENTE	1984-05-24	2001-08-11	No	3280372594	\N	via dei redentoristi, 25	Palermo	\N	90100	IT	Proclamatore
35	Rosy	CONCIAURO	F	attivo	\N	rosy.conciauro@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.791549	2025-08-11 00:16:56.847744	1	6	Rosy CONCIAURO	1952-04-30	1977-08-05	No	3478294345	\N	Passaggio Ciaikowsky, 4	Palermo	\N	90100	IT	Proclamatore
36	Liliana	COSTA	F	attivo	\N	costa.liliana1955@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.792544	2025-08-11 00:16:56.848753	1	8	Liliana COSTA	1955-08-22	1994-10-29	No	3204929160	\N	Via Uditore, 36	Palermo	\N	90100	IT	Pioniere Regolare
37	Filippo	D'AMORE	M	attivo	\N	filippodamore@yahoo.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.793835	2025-08-11 00:16:56.85018	1	3	Filippo D'AMORE	1958-06-25	1978-04-19	Anziano	3289761203	\N	Via Cartagine, 4	Palermo	\N	90100	IT	Proclamatore
38	Gandolfa	D'AMORE	F	attivo	\N	igandolfa@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.795024	2025-08-11 00:16:56.851016	1	3	Gandolfa D'AMORE	1964-12-05	1979-12-12	No	3297355838	\N	Via Cartagine, 4	Palermo	\N	90100	IT	Pioniere Ausiliare Continuo
39	Francesca	DI FRANCO	F	attivo	\N	francadifr@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.796279	2025-08-11 00:16:56.851895	1	7	Francesca DI FRANCO	1947-05-22	1988-06-05	No	3925284439	\N	Via Del Salice, 5	Palermo	\N	90100	IT	Proclamatore
40	Rosaria	DI LORENZO	F	attivo	\N	rosaria.dilor@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.797815	2025-08-11 00:16:56.852537	1	3	Rosaria DI LORENZO	1957-03-03	1990-05-06	No	3278713195	\N	Via Cartagine, 1	Palermo	\N	90100	IT	Proclamatore
41	Rosario	DI LORENZO	M	attivo	\N	dilorenzo.r@hotmail.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.803334	2025-08-11 00:16:56.853779	1	3	Rosario DI LORENZO	1957-05-22	2016-06-18	No	3292307835	\N	Via Cartagine, 1	Palermo	\N	90100	IT	Proclamatore
43	Vincenza	FARRAUTO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.806555	2025-08-11 00:16:56.855539	1	6	Vincenza FARRAUTO	1937-07-16	1982-05-22	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
44	Francesco	FERRANTE	M	attivo	\N	francescoferrante000@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.807947	2025-08-11 00:16:56.856284	1	7	Francesco FERRANTE	1954-07-27	1993-10-03	Servitore di Ministero	3409643215	\N	Via Cartagine, 15	Palermo	\N	90100	IT	Proclamatore
45	Rosolino	FERRANTE	M	attivo	\N	ferranterosolino0@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.809564	2025-08-11 00:16:56.856867	1	4	Rosolino FERRANTE	1974-10-13	2014-03-23	No	3461674421	\N	VIA MAMMANA 155	Palermo	\N	90100	IT	Proclamatore
46	Gabriele	GIPPETTO	M	attivo	\N	gabrielegipp93@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.810362	2025-08-11 00:16:56.857497	1	5	Gabriele GIPPETTO	1993-08-31	2008-04-24	No	3291880396	\N	Via Mammana, 118	Palermo	PA	90135	IT	Proclamatore
47	Roberta	GIPPETTO	F	attivo	\N	robibologna1@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.812048	2025-08-11 00:16:56.858155	1	5	Roberta GIPPETTO	1994-10-23	2013-11-02	No	3290462011	\N	Via Mammana, 118	Palermo	PA	90135	IT	Proclamatore
48	Alessandra	GRESTI	F	attivo	\N	grestialessandra@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.814059	2025-08-11 00:16:56.858982	1	7	Alessandra GRESTI	1971-05-06	1989-08-26	No	3295728396	\N	Via Castellana, 54	Palermo	\N	90100	IT	Proclamatore
50	Roberta	GRESTI	F	attivo	\N	robertagresti@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.820748	2025-08-11 00:16:56.859721	1	7	Roberta GRESTI	1976-10-07	1989-08-26	No	3896490782	\N	Via Castellana, 54	Palermo	\N	90100	IT	Proclamatore
51	Sabrina	GRESTI	F	attivo	\N	grestisabrina@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.821909	2025-08-11 00:16:56.861719	1	7	Sabrina GRESTI	1973-11-25	1988-12-10	No	3248233330	\N	Via Castellana, 54	Palermo	\N	90100	IT	Proclamatore
54	Marilena	GUGLIELMO	F	attivo	\N	maddalenaconigliaro@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.823863	2025-08-11 00:16:56.863156	1	5	Marilena GUGLIELMO	1974-03-30	1988-08-21	No	3397812864	\N	Via	Palermo	PA	\N	IT	Proclamatore
55	Francesca	ILARDA	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.824299	2025-08-11 00:16:56.864067	1	3	Francesca ILARDA	1942-02-13	1971-09-03	No	3889393833	091-225211	Via Cartagine, 4	Palermo	\N	90100	IT	Proclamatore
56	Salvatore	ILARDA	M	attivo	\N	salvoilarda32@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.825081	2025-08-11 00:16:56.864697	1	3	Salvatore ILARDA	1932-06-16	1971-09-04	Anziano	3297354961	091-222511	Via Cartagine, 4	Palermo	\N	90100	IT	Proclamatore
57	Carlotta	LENTINI	F	attivo	\N	carlottalentini4@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.82584	2025-08-11 00:16:56.865283	1	4	Carlotta LENTINI	2011-08-19	\N	No	3515048193	\N	Via Cartagine, 3	Palermo	PA	90100	IT	Proclamatore
58	Valentina	LENTINI	F	attivo	\N	valentinaflaccovio85@hotmail.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.82661	2025-08-11 00:16:56.865951	1	4	Valentina LENTINI	1985-09-09	2017-07-22	No	3890663253	\N	Via Cartagine, 3	Palermo	\N	90100	IT	Proclamatore
60	Filippo	LO PICCOLO	M	attivo	\N	filippo.lopiccolo@libero.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.82802	2025-08-11 00:16:56.867174	1	6	Filippo LO PICCOLO	1980-02-17	2009-09-26	No	3534049193	\N	Via Torre Ingastone, 7	Palermo	\N	90100	IT	Proclamatore
61	Margherita	LO PICCOLO	F	attivo	\N	mcacioppomargherita87@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.828549	2025-08-11 00:16:56.867752	1	6	Margherita LO PICCOLO	1987-03-03	2005-07-07	No	3271370794	\N	Via Torre Ingastone 7	Palermo	\N	90100	IT	Proclamatore
62	Nunzia	LO PRESTI	F	attivo	\N	loprestinu@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.829294	2025-08-11 00:16:56.868367	1	4	Nunzia LO PRESTI	1959-07-28	\N	No	3887996780	\N	Via Van Vitelli, 54	Palermo	\N	90100	IT	Proclamatore
63	Adriana	LO VECCHIO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.829846	2025-08-11 00:16:56.868971	1	5	Adriana LO VECCHIO	1942-12-25	1984-06-02	No	3283298364	\N	Via Olivella, 32	Palermo	\N	90100	IT	Proclamatore
64	Francesco	LOPES	M	attivo	\N	francescolopes2010@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.830686	2025-08-11 00:16:56.86962	1	5	Francesco LOPES	1976-10-13	1991-10-20	No	3483589010	\N	Viale Michelangelo, 1004	Palermo	\N	90100	IT	Proclamatore
65	Silvia	LOPES	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.831195	2025-08-11 00:16:56.870617	1	5	Silvia LOPES	1973-01-13	1988-01-01	No	3406822541	\N	Viale Michelangelo, 1004	Palermo	\N	90100	IT	Proclamatore
66	Rosalia	MARAVENTANO	F	attivo	\N	rosycannella3@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.83196	2025-08-11 00:16:56.871454	1	3	Rosalia MARAVENTANO	1956-08-03	1992-08-08	No	\N	\N	Via Cartagine, 12/C	Palermo	\N	90100	IT	Proclamatore
67	Teresa	MARAVENTANO	F	attivo	\N	teresamaraventano@icloud.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.832576	2025-08-11 00:16:56.872053	1	3	Teresa MARAVENTANO	1965-10-10	1988-12-10	No	3205775861	\N	Via Cartagine, 12/C	Palermo	\N	90100	IT	Proclamatore
68	Ismaele	MILITELLO	M	attivo	\N	ismaelemilitello@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.833239	2025-08-11 00:16:56.872688	1	8	Ismaele MILITELLO	1983-12-20	2000-07-08	No	3312503280	\N	Via Petrazzi 10	Palermo	PA	90145	IT	Proclamatore
69	Justyn	MILITELLO	F	attivo	\N	runfolojustyn@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.833801	2025-08-11 00:16:56.873296	1	8	Justyn MILITELLO	1986-07-22	2000-07-08	No	3205593827	\N	Via Petrazzi 10	Palermo	PA	90145	IT	Proclamatore
70	Letizia	MILITELLO	F	attivo	\N	letiziamilitello79@hotmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.834529	2025-08-11 00:16:56.87387	1	8	Letizia MILITELLO	1979-07-11	1993-07-17	No	3881574620	\N	\N	\N	\N	\N	Italia	Pioniere Regolare
71	Nunzia	MILITELLO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.834967	2025-08-11 00:16:56.874533	1	8	Nunzia MILITELLO	1950-12-04	1986-09-08	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
73	Angela	MUREDDU	F	attivo	\N	angela.mureddu@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.836458	2025-08-11 00:16:56.875911	1	6	Angela MUREDDU	1956-06-01	1976-06-28	No	346 5404211	\N	Via Pozzo, 24	Palermo	PA	90135	IT	Pioniere Speciale
74	Angela	NUCCIO	F	attivo	\N	angelanuccio04@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.837086	2025-08-11 00:16:56.876489	1	4	Angela NUCCIO	1965-04-10	1989-08-26	No	3806599398	\N	Via Mammana, 103	\N	\N	\N	IT	Proclamatore
75	Ninfa	NUCCIO	F	attivo	\N	collinepianure@live.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.837884	2025-08-11 00:16:56.87734	1	4	Ninfa NUCCIO	1983-05-04	2008-03-08	No	392 6578046	\N	Via Mammana, 91	\N	\N	\N	IT	Proclamatore
76	Roberto	NUCCIO	M	attivo	\N	robertosport73@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.838474	2025-08-11 00:16:56.879066	1	4	Roberto NUCCIO	1973-08-15	2013-08-24	No	3713227011	\N	Via Mammana, 91	\N	\N	\N	IT	Proclamatore
77	Maria	ORSO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.839006	2025-08-11 00:16:56.88018	1	7	Maria ORSO	1937-01-04	2011-07-16	No	\N	\N	\N	\N	\N	\N	Italia	Proclamatore
78	Francesca	PACE	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.839399	2025-08-11 00:16:56.881152	1	8	Francesca PACE	1952-06-16	2021-07-25	No	3516511989	\N	Via Badia, 19d	Palermo	\N	90100	IT	Pioniere Ausiliare Continuo
79	Concetta	PANDOLFINI	F	attivo	\N	cettyfascella.74@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.840063	2025-08-11 00:16:56.882108	1	3	Concetta PANDOLFINI	1974-08-23	1990-08-18	No	349 8469094	\N	Via Aloisio Juvara, 65	Palermo	\N	90100	Italia	Proclamatore
80	Antonella	PASQUALE	F	attivo	\N	anto.scarnato99@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.840781	2025-08-11 00:16:56.882833	1	4	Antonella PASQUALE	1999-09-18	2015-03-14	No	388 1176262	\N	Largo Corleone, 3	Palermo	PA	90135	Italia	Pioniere Regolare
81	Domenico	PASQUALE	M	attivo	\N	domenicopasq@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.841424	2025-08-11 00:16:56.883608	1	4	Domenico PASQUALE	1992-10-15	2009-04-18	Anziano	327 0211233	\N	Largo Corleone, 3	Palermo	PA	90135	Italia	Pioniere Regolare
82	Joana	PEREIRA	F	attivo	\N	jennypereira171@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.842138	2025-08-11 00:16:56.884212	1	8	Joana PEREIRA	1961-06-23	1979-08-11	No	327 8493335	\N	Via Giovanni Alfredo Cesareo, 85	Palermo	PA	\N	Italia	Proclamatore
83	Giuseppina	PICONE	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.842568	2025-08-11 00:16:56.884743	1	4	Giuseppina PICONE	1950-09-10	1985-03-02	No	3202467442	\N	Via Cartagine, 8	Palermo	\N	90100	IT	Proclamatore
84	Antonella	PIPITO'	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.84291	2025-08-11 00:16:56.885375	1	8	Antonella PIPITO'	\N	\N	No	3286624282	\N	Via Alias 2/d	Palermo	\N	90135	Italia	Proclamatore
85	Giovanni	RICCOBONO	M	attivo	\N	gioviriccobono@hotmail.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.843558	2025-08-11 00:16:56.886062	1	7	Giovanni RICCOBONO	1993-04-13	2008-03-15	Anziano	329 2075028	\N	Via Polizzi, 27	Pioppo/Monreale	PA	90046	IT	Pioniere Regolare
86	Rachele	RICCOBONO	F	attivo	\N	rakelelele@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.844154	2025-08-11 00:16:56.886786	1	7	Rachele RICCOBONO	1996-01-17	2014-03-22	No	329 0485744	\N	Via Polizzi, 27	Pioppo/Monreale	PA	90046	IT	Pioniere Regolare
87	Teresa	RIZZO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.844549	2025-08-11 00:16:56.887659	1	5	Teresa RIZZO	1971-08-16	2009-04-18	No	3298220253	\N	\N	\N	\N	\N	Italia	Proclamatore
88	Carmela	SALVATO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.844932	2025-08-11 00:16:56.888341	1	5	Carmela SALVATO	1955-02-26	1994-07-02	No	3245629398	\N	Cortile Gambino, 8	Palermo	\N	90100	IT	Proclamatore
92	Vito	TANCREDI	M	non_attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.847698	2025-08-11 00:15:25.847698	1	\N	Vito TANCREDI	1944-11-27	2016-08-06	No	3505968606	\N	Villa Perrotta, 1	\N	\N	\N	IT	Proclamatore
4	Dennis	ARCARA	M	attivo	\N	dennisarcara17@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.744784	2025-08-11 00:16:56.76953	1	3	Dennis ARCARA	2000-09-18	2016-06-18	No	3282606512	\N	VIA MARIA MONTESSORI 11	Palermo	\N	90100	IT	Proclamatore
25	Davide	CARROCCETTO	M	attivo	\N	palermo.uditorejw@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.777911	2025-08-11 00:16:56.839382	1	8	Davide CARROCCETTO	1975-07-22	1989-04-08	Anziano	3204142855	091408710	Via Casalini 256	Palermo	PA	90145	IT	Proclamatore
30	Giovanni	CHIOVARO	M	attivo	\N	chiovarogiovanni@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.78184	2025-08-11 00:16:56.843804	1	7	Giovanni CHIOVARO	1954-01-04	2004-10-24	Servitore di Ministero	3276689056	\N	Via Pozzo, 24	Palermo	PA	90135	IT	Pioniere Regolare
42	Antonella	DOMINO	F	attivo	\N	anto.nella60@libero.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.805861	2025-08-11 00:16:56.854775	1	5	Antonella DOMINO	1960-02-13	1995-05-06	No	3801433748	\N	Largo Giovanni Zappalà, 2	Palermo	\N	90100	IT	Proclamatore
59	Alessandra	LO PICCOLO	F	attivo	\N	alexlopiccolo11@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.827306	2025-08-11 00:16:56.866557	1	6	Alessandra LO PICCOLO	2011-06-16	\N	No	3534043936	\N	\N	\N	\N	\N	Italia	Proclamatore
72	Concetta	MILITO	F	attivo	\N	militoconcetta@libero.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.835707	2025-08-11 00:16:56.875115	1	8	Concetta MILITO	1975-02-15	2019-06-22	No	3248939780	\N	Via Nunzio Morello, 17	Palermo	\N	90100	IT	Pioniere Regolare
89	Maria	SANFILIPPO	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.84568	2025-08-11 00:16:56.888914	1	3	Maria SANFILIPPO	1951-06-28	1974-11-24	No	3899638245	\N	Via Casalini, 196	Palermo	\N	90145	IT	Proclamatore
90	Aurora	SCHIMMENTI	F	attivo	\N	aurora.pierino@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.846539	2025-08-11 00:16:56.889484	1	5	Aurora SCHIMMENTI	1987-01-23	2000-07-08	No	3667436826	\N	Via Alfredo e Antonio di Dio, 7	Palermo	PA	90143	Italia	Pioniere Regolare
91	Vincenzo	SCHIMMENTI	M	attivo	\N	vince.schimme@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.847255	2025-08-11 00:16:56.890073	1	5	Vincenzo SCHIMMENTI	1974-07-05	2015-03-08	Anziano	339 7150513	\N	Via Alfredo e Antonio di Dio, 7	Palermo	PA	90143	Italia	Pioniere Regolare
93	Emilia	VIOLANTE	F	attivo	\N	emiliaviolante@outlook.it	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.84837	2025-08-11 00:16:56.890629	1	6	Emilia VIOLANTE	1968-06-07	1984-11-10	No	3200128175	091-6734320	Via Mozambico, 21	Palermo	\N	90100	IT	Proclamatore
94	Maria	VIOLANTE	F	attivo	\N	\N	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.848842	2025-08-11 00:16:56.891185	1	6	Maria VIOLANTE	1934-02-15	1977-08-05	No	\N	091-6734320	Via Mozambico, 21	Palermo	\N	90100	IT	Proclamatore
95	Donato	ZAPPALA'	M	attivo	\N	zappaladonato@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.849512	2025-08-11 00:16:56.892028	1	6	Donato ZAPPALA'	1971-10-22	2012-06-30	No	3286166162	\N	Viale Regione Siciliana 2551	Palermo	PA	90100	IT	Proclamatore
96	Francesca	ZAPPALA'	F	attivo	\N	francyzappala70@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.850124	2025-08-11 00:16:56.892686	1	6	Francesca ZAPPALA'	1970-05-04	1987-08-15	No	3890488043	\N	Viale Regione Siciliana 2551	Palermo	PA	90100	IT	Proclamatore
97	Walter	ZAPPALA'	M	attivo	\N	walter.zappa48@gmail.com	\N	$2a$10$R4mVRRZZtSfXrn/.Rhga6.zHrAdsbenlmiDMAFsFlQ1subdxzPyOK	volontario	2025-08-11 00:15:25.850761	2025-08-11 00:16:56.893617	1	6	Walter ZAPPALA'	2006-04-20	2020-08-02	No	3247823234	\N	Viale Regione Siciliana 2551	Palermo	PA	90100	IT	Proclamatore
\.


--
-- Data for Name: volontari_postazioni_abilitate; Type: TABLE DATA; Schema: public; Owner: zy0n
--

COPY public.volontari_postazioni_abilitate (id, volontario_id, postazione_id, abilitato, created_at, updated_at) FROM stdin;
7	3	16	t	2025-08-11 01:20:05.296646	2025-08-11 01:20:05.296646
8	4	16	t	2025-08-11 01:20:05.298427	2025-08-11 01:20:05.298427
9	5	16	t	2025-08-11 01:20:05.301512	2025-08-11 01:20:05.301512
10	6	16	t	2025-08-11 01:20:05.302343	2025-08-11 01:20:05.302343
11	7	16	t	2025-08-11 01:20:05.303427	2025-08-11 01:20:05.303427
12	8	16	t	2025-08-11 01:20:05.304609	2025-08-11 01:20:05.304609
13	9	16	t	2025-08-11 01:20:05.305358	2025-08-11 01:20:05.305358
14	10	16	t	2025-08-11 01:20:05.306302	2025-08-11 01:20:05.306302
15	11	16	t	2025-08-11 01:20:05.306878	2025-08-11 01:20:05.306878
16	12	16	t	2025-08-11 01:20:05.307384	2025-08-11 01:20:05.307384
17	13	16	t	2025-08-11 01:20:05.307816	2025-08-11 01:20:05.307816
18	14	16	t	2025-08-11 01:20:05.30813	2025-08-11 01:20:05.30813
19	15	16	t	2025-08-11 01:20:05.308577	2025-08-11 01:20:05.308577
20	16	16	t	2025-08-11 01:20:05.308987	2025-08-11 01:20:05.308987
21	17	16	t	2025-08-11 01:20:05.309595	2025-08-11 01:20:05.309595
22	18	16	t	2025-08-11 01:20:05.31036	2025-08-11 01:20:05.31036
23	19	16	t	2025-08-11 01:20:05.311136	2025-08-11 01:20:05.311136
24	20	16	t	2025-08-11 01:20:05.311548	2025-08-11 01:20:05.311548
25	21	16	t	2025-08-11 01:20:05.31191	2025-08-11 01:20:05.31191
26	22	16	t	2025-08-11 01:20:05.312935	2025-08-11 01:20:05.312935
27	23	16	t	2025-08-11 01:20:05.314383	2025-08-11 01:20:05.314383
28	24	16	t	2025-08-11 01:20:05.316462	2025-08-11 01:20:05.316462
29	25	16	t	2025-08-11 01:20:05.317287	2025-08-11 01:20:05.317287
30	26	16	t	2025-08-11 01:20:05.317946	2025-08-11 01:20:05.317946
31	27	16	t	2025-08-11 01:20:05.318262	2025-08-11 01:20:05.318262
32	28	16	t	2025-08-11 01:20:05.318687	2025-08-11 01:20:05.318687
33	29	16	t	2025-08-11 01:20:05.319134	2025-08-11 01:20:05.319134
34	30	16	t	2025-08-11 01:20:05.319699	2025-08-11 01:20:05.319699
35	30	17	t	2025-08-11 01:20:05.319699	2025-08-11 01:20:05.319699
36	31	16	t	2025-08-11 01:20:05.320695	2025-08-11 01:20:05.320695
37	31	17	t	2025-08-11 01:20:05.320695	2025-08-11 01:20:05.320695
38	32	16	t	2025-08-11 01:20:05.321549	2025-08-11 01:20:05.321549
39	32	17	t	2025-08-11 01:20:05.321549	2025-08-11 01:20:05.321549
40	33	16	t	2025-08-11 01:20:05.32225	2025-08-11 01:20:05.32225
41	33	17	t	2025-08-11 01:20:05.32225	2025-08-11 01:20:05.32225
42	34	16	t	2025-08-11 01:20:05.322564	2025-08-11 01:20:05.322564
43	34	17	t	2025-08-11 01:20:05.322564	2025-08-11 01:20:05.322564
44	35	16	t	2025-08-11 01:20:05.322969	2025-08-11 01:20:05.322969
45	35	17	t	2025-08-11 01:20:05.322969	2025-08-11 01:20:05.322969
46	36	16	t	2025-08-11 01:20:05.323374	2025-08-11 01:20:05.323374
47	36	17	t	2025-08-11 01:20:05.323374	2025-08-11 01:20:05.323374
48	37	16	t	2025-08-11 01:20:05.324319	2025-08-11 01:20:05.324319
49	37	17	t	2025-08-11 01:20:05.324319	2025-08-11 01:20:05.324319
50	38	16	t	2025-08-11 01:20:05.325065	2025-08-11 01:20:05.325065
51	38	17	t	2025-08-11 01:20:05.325065	2025-08-11 01:20:05.325065
52	39	16	t	2025-08-11 01:20:05.325769	2025-08-11 01:20:05.325769
53	39	17	t	2025-08-11 01:20:05.325769	2025-08-11 01:20:05.325769
54	40	16	t	2025-08-11 01:20:05.326172	2025-08-11 01:20:05.326172
55	40	17	t	2025-08-11 01:20:05.326172	2025-08-11 01:20:05.326172
56	41	16	t	2025-08-11 01:20:05.326503	2025-08-11 01:20:05.326503
57	41	17	t	2025-08-11 01:20:05.326503	2025-08-11 01:20:05.326503
58	42	16	t	2025-08-11 01:20:05.326837	2025-08-11 01:20:05.326837
59	42	17	t	2025-08-11 01:20:05.326837	2025-08-11 01:20:05.326837
60	43	16	t	2025-08-11 01:20:05.327161	2025-08-11 01:20:05.327161
61	43	17	t	2025-08-11 01:20:05.327161	2025-08-11 01:20:05.327161
62	44	16	t	2025-08-11 01:20:05.327504	2025-08-11 01:20:05.327504
63	44	17	t	2025-08-11 01:20:05.327504	2025-08-11 01:20:05.327504
64	45	16	t	2025-08-11 01:20:05.328029	2025-08-11 01:20:05.328029
65	45	17	t	2025-08-11 01:20:05.328029	2025-08-11 01:20:05.328029
66	46	16	t	2025-08-11 01:20:05.328392	2025-08-11 01:20:05.328392
67	46	17	t	2025-08-11 01:20:05.328392	2025-08-11 01:20:05.328392
68	47	16	t	2025-08-11 01:20:05.32877	2025-08-11 01:20:05.32877
69	47	17	t	2025-08-11 01:20:05.32877	2025-08-11 01:20:05.32877
70	48	16	t	2025-08-11 01:20:05.32912	2025-08-11 01:20:05.32912
71	48	17	t	2025-08-11 01:20:05.32912	2025-08-11 01:20:05.32912
72	50	16	t	2025-08-11 01:20:05.329551	2025-08-11 01:20:05.329551
73	50	17	t	2025-08-11 01:20:05.329551	2025-08-11 01:20:05.329551
74	51	16	t	2025-08-11 01:20:05.329952	2025-08-11 01:20:05.329952
75	51	17	t	2025-08-11 01:20:05.329952	2025-08-11 01:20:05.329952
76	54	16	t	2025-08-11 01:20:05.330743	2025-08-11 01:20:05.330743
77	54	17	t	2025-08-11 01:20:05.330743	2025-08-11 01:20:05.330743
78	55	16	t	2025-08-11 01:20:05.33159	2025-08-11 01:20:05.33159
79	55	17	t	2025-08-11 01:20:05.33159	2025-08-11 01:20:05.33159
80	56	16	t	2025-08-11 01:20:05.332416	2025-08-11 01:20:05.332416
81	56	17	t	2025-08-11 01:20:05.332416	2025-08-11 01:20:05.332416
82	57	16	t	2025-08-11 01:20:05.332931	2025-08-11 01:20:05.332931
83	57	17	t	2025-08-11 01:20:05.332931	2025-08-11 01:20:05.332931
84	58	16	t	2025-08-11 01:20:05.333721	2025-08-11 01:20:05.333721
85	58	17	t	2025-08-11 01:20:05.333721	2025-08-11 01:20:05.333721
86	59	16	t	2025-08-11 01:20:05.33435	2025-08-11 01:20:05.33435
87	59	17	t	2025-08-11 01:20:05.33435	2025-08-11 01:20:05.33435
\.


--
-- Name: assegnazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.assegnazioni_id_seq', 1183, true);


--
-- Name: assegnazioni_volontari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.assegnazioni_volontari_id_seq', 2333, true);


--
-- Name: congregazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.congregazioni_id_seq', 2, true);


--
-- Name: disponibilita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.disponibilita_id_seq', 4702, true);


--
-- Name: gruppi_servizio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.gruppi_servizio_id_seq', 8, true);


--
-- Name: notifiche_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.notifiche_id_seq', 1, false);


--
-- Name: postazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.postazioni_id_seq', 19, true);


--
-- Name: slot_orari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.slot_orari_id_seq', 55, true);


--
-- Name: volontari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.volontari_id_seq', 99, true);


--
-- Name: volontari_postazioni_abilitate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.volontari_postazioni_abilitate_id_seq', 87, true);


--
-- Name: assegnazioni assegnazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_pkey PRIMARY KEY (id);


--
-- Name: assegnazioni_volontari assegnazioni_volontari_assegnazione_id_volontario_id_key; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_assegnazione_id_volontario_id_key UNIQUE (assegnazione_id, volontario_id);


--
-- Name: assegnazioni_volontari assegnazioni_volontari_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_pkey PRIMARY KEY (id);


--
-- Name: congregazioni congregazioni_codice_key; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.congregazioni
    ADD CONSTRAINT congregazioni_codice_key UNIQUE (codice);


--
-- Name: congregazioni congregazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.congregazioni
    ADD CONSTRAINT congregazioni_pkey PRIMARY KEY (id);


--
-- Name: disponibilita disponibilita_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_pkey PRIMARY KEY (id);


--
-- Name: gruppi_servizio gruppi_servizio_congregazione_id_nome_key; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.gruppi_servizio
    ADD CONSTRAINT gruppi_servizio_congregazione_id_nome_key UNIQUE (congregazione_id, nome);


--
-- Name: gruppi_servizio gruppi_servizio_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.gruppi_servizio
    ADD CONSTRAINT gruppi_servizio_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: notifiche notifiche_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.notifiche
    ADD CONSTRAINT notifiche_pkey PRIMARY KEY (id);


--
-- Name: postazioni postazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.postazioni
    ADD CONSTRAINT postazioni_pkey PRIMARY KEY (id);


--
-- Name: slot_orari slot_orari_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_pkey PRIMARY KEY (id);


--
-- Name: slot_orari slot_orari_postazione_id_orario_inizio_orario_fine_key; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_postazione_id_orario_inizio_orario_fine_key UNIQUE (postazione_id, orario_inizio, orario_fine);


--
-- Name: volontari volontari_email_key; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_email_key UNIQUE (email);


--
-- Name: volontari volontari_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_pkey PRIMARY KEY (id);


--
-- Name: volontari_postazioni_abilitate volontari_postazioni_abilitate_pkey; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari_postazioni_abilitate
    ADD CONSTRAINT volontari_postazioni_abilitate_pkey PRIMARY KEY (id);


--
-- Name: volontari_postazioni_abilitate volontari_postazioni_abilitate_volontario_id_postazione_id_key; Type: CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari_postazioni_abilitate
    ADD CONSTRAINT volontari_postazioni_abilitate_volontario_id_postazione_id_key UNIQUE (volontario_id, postazione_id);


--
-- Name: disponibilita_volontario_id_data_slot_orario_id_key; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE UNIQUE INDEX disponibilita_volontario_id_data_slot_orario_id_key ON public.disponibilita USING btree (volontario_id, data, slot_orario_id);


--
-- Name: idx_assegnazioni_data; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_assegnazioni_data ON public.assegnazioni USING btree (data_turno);


--
-- Name: idx_assegnazioni_postazione; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_assegnazioni_postazione ON public.assegnazioni USING btree (postazione_id);


--
-- Name: idx_disponibilita_volontario_data; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_disponibilita_volontario_data ON public.disponibilita USING btree (volontario_id, data);


--
-- Name: idx_gruppi_servizio_congregazione; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_gruppi_servizio_congregazione ON public.gruppi_servizio USING btree (congregazione_id);


--
-- Name: idx_notifications_admin_id; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_notifications_admin_id ON public.notifications USING btree (admin_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_timestamp; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_notifications_timestamp ON public.notifications USING btree ("timestamp");


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_postazioni_congregazione; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_postazioni_congregazione ON public.postazioni USING btree (congregazione_id);


--
-- Name: idx_slot_orari_postazione; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_slot_orari_postazione ON public.slot_orari USING btree (postazione_id);


--
-- Name: idx_volontari_congregazione; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_congregazione ON public.volontari USING btree (congregazione_id);


--
-- Name: idx_volontari_gruppo_servizio; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_gruppo_servizio ON public.volontari USING btree (gruppo_servizio_id);


--
-- Name: idx_volontari_nome_completo; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_nome_completo ON public.volontari USING btree (nome_completo);


--
-- Name: idx_volontari_postazioni_postazione; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_postazioni_postazione ON public.volontari_postazioni_abilitate USING btree (postazione_id);


--
-- Name: idx_volontari_postazioni_volontario; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_postazioni_volontario ON public.volontari_postazioni_abilitate USING btree (volontario_id);


--
-- Name: idx_volontari_sesso; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_sesso ON public.volontari USING btree (sesso);


--
-- Name: idx_volontari_stato; Type: INDEX; Schema: public; Owner: zy0n
--

CREATE INDEX idx_volontari_stato ON public.volontari USING btree (stato);


--
-- Name: volontari trigger_update_nome_completo; Type: TRIGGER; Schema: public; Owner: zy0n
--

CREATE TRIGGER trigger_update_nome_completo BEFORE INSERT OR UPDATE OF nome, cognome ON public.volontari FOR EACH ROW EXECUTE FUNCTION public.update_nome_completo();


--
-- Name: assegnazioni update_assegnazioni_updated_at; Type: TRIGGER; Schema: public; Owner: zy0n
--

CREATE TRIGGER update_assegnazioni_updated_at BEFORE UPDATE ON public.assegnazioni FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: postazioni update_postazioni_updated_at; Type: TRIGGER; Schema: public; Owner: zy0n
--

CREATE TRIGGER update_postazioni_updated_at BEFORE UPDATE ON public.postazioni FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: slot_orari update_slot_orari_updated_at; Type: TRIGGER; Schema: public; Owner: zy0n
--

CREATE TRIGGER update_slot_orari_updated_at BEFORE UPDATE ON public.slot_orari FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: volontari update_volontari_updated_at; Type: TRIGGER; Schema: public; Owner: zy0n
--

CREATE TRIGGER update_volontari_updated_at BEFORE UPDATE ON public.volontari FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assegnazioni assegnazioni_postazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_postazione_id_fkey FOREIGN KEY (postazione_id) REFERENCES public.postazioni(id) ON DELETE CASCADE;


--
-- Name: assegnazioni assegnazioni_slot_orario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_slot_orario_id_fkey FOREIGN KEY (slot_orario_id) REFERENCES public.slot_orari(id) ON DELETE CASCADE;


--
-- Name: assegnazioni_volontari assegnazioni_volontari_assegnazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_assegnazione_id_fkey FOREIGN KEY (assegnazione_id) REFERENCES public.assegnazioni(id) ON DELETE CASCADE;


--
-- Name: assegnazioni_volontari assegnazioni_volontari_volontario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_volontario_id_fkey FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- Name: disponibilita disponibilita_slot_orario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_slot_orario_id_fkey FOREIGN KEY (slot_orario_id) REFERENCES public.slot_orari(id) ON DELETE CASCADE;


--
-- Name: disponibilita disponibilita_volontario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_volontario_id_fkey FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- Name: gruppi_servizio fk_gruppi_servizio_sorvegliante; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.gruppi_servizio
    ADD CONSTRAINT fk_gruppi_servizio_sorvegliante FOREIGN KEY (sorvegliante_id) REFERENCES public.volontari(id);


--
-- Name: gruppi_servizio gruppi_servizio_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.gruppi_servizio
    ADD CONSTRAINT gruppi_servizio_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: notifiche notifiche_destinatario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.notifiche
    ADD CONSTRAINT notifiche_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- Name: postazioni postazioni_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.postazioni
    ADD CONSTRAINT postazioni_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: slot_orari slot_orari_postazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_postazione_id_fkey FOREIGN KEY (postazione_id) REFERENCES public.postazioni(id) ON DELETE CASCADE;


--
-- Name: volontari volontari_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id);


--
-- Name: volontari volontari_gruppo_servizio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_gruppo_servizio_id_fkey FOREIGN KEY (gruppo_servizio_id) REFERENCES public.gruppi_servizio(id);


--
-- Name: volontari_postazioni_abilitate volontari_postazioni_abilitate_postazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari_postazioni_abilitate
    ADD CONSTRAINT volontari_postazioni_abilitate_postazione_id_fkey FOREIGN KEY (postazione_id) REFERENCES public.postazioni(id) ON DELETE CASCADE;


--
-- Name: volontari_postazioni_abilitate volontari_postazioni_abilitate_volontario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zy0n
--

ALTER TABLE ONLY public.volontari_postazioni_abilitate
    ADD CONSTRAINT volontari_postazioni_abilitate_volontario_id_fkey FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

