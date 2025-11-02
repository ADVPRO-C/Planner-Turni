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
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: get_giorno_settimana(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_giorno_settimana(data_input date) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN CASE 
        WHEN EXTRACT(DOW FROM data_input) = 0 THEN 7  -- Domenica
        WHEN EXTRACT(DOW FROM data_input) = 1 THEN 1  -- Lunedì
        WHEN EXTRACT(DOW FROM data_input) = 2 THEN 2  -- Martedì
        WHEN EXTRACT(DOW FROM data_input) = 3 THEN 3  -- Mercoledì
        WHEN EXTRACT(DOW FROM data_input) = 4 THEN 4  -- Giovedì
        WHEN EXTRACT(DOW FROM data_input) = 5 THEN 5  -- Venerdì
        WHEN EXTRACT(DOW FROM data_input) = 6 THEN 6  -- Sabato
    END;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assegnazioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assegnazioni (
    id integer NOT NULL,
    postazione_id integer,
    congregazione_id integer NOT NULL,
    slot_orario_id integer,
    data_turno date NOT NULL,
    stato character varying(20) DEFAULT 'assegnato'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT assegnazioni_stato_check CHECK (((stato)::text = ANY ((ARRAY['assegnato'::character varying, 'completato'::character varying, 'cancellato'::character varying])::text[])))
);


--
-- Name: assegnazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assegnazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assegnazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assegnazioni_id_seq OWNED BY public.assegnazioni.id;


--
-- Name: assegnazioni_volontari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assegnazioni_volontari (
    id integer NOT NULL,
    assegnazione_id integer,
    volontario_id integer,
    congregazione_id integer NOT NULL,
    ruolo_turno character varying(50) DEFAULT 'volontario'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: assegnazioni_volontari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assegnazioni_volontari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assegnazioni_volontari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assegnazioni_volontari_id_seq OWNED BY public.assegnazioni_volontari.id;


--
-- Name: disponibilita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disponibilita (
    id integer NOT NULL,
    volontario_id integer,
    congregazione_id integer NOT NULL,
    data date NOT NULL,
    stato character varying(20) DEFAULT 'disponibile'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    slot_orario_id integer NOT NULL,
    CONSTRAINT disponibilita_stato_check CHECK (((stato)::text = ANY ((ARRAY['disponibile'::character varying, 'non_disponibile'::character varying])::text[])))
);


--
-- Name: disponibilita_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.disponibilita_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: disponibilita_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.disponibilita_id_seq OWNED BY public.disponibilita.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: notifiche; Type: TABLE; Schema: public; Owner: -
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

--
-- Name: congregazioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.congregazioni (
    id integer NOT NULL,
    codice character varying(3) NOT NULL,
    nome character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT congregazioni_codice_check CHECK ((codice ~ '^[0-9]{3}$'::text))
);


--
-- Name: congregazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.congregazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: congregazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.congregazioni_id_seq OWNED BY public.congregazioni.id;




--
-- Name: notifiche_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifiche_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifiche_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifiche_id_seq OWNED BY public.notifiche.id;


--
-- Name: postazioni; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postazioni (
    id integer NOT NULL,
    congregazione_id integer NOT NULL,
    luogo character varying(255) NOT NULL,
    indirizzo text,
    giorni_settimana integer[] DEFAULT '{1,2,3,4,5,6,7}'::integer[],
    stato character varying(20) DEFAULT 'attiva'::character varying,
    max_proclamatori integer DEFAULT 3,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT postazioni_stato_check CHECK (((stato)::text = ANY ((ARRAY['attiva'::character varying, 'inattiva'::character varying])::text[])))
);


--
-- Name: postazioni_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.postazioni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: postazioni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.postazioni_id_seq OWNED BY public.postazioni.id;


--
-- Name: slot_orari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slot_orari (
    id integer NOT NULL,
    postazione_id integer,
    congregazione_id integer NOT NULL,
    orario_inizio time without time zone NOT NULL,
    orario_fine time without time zone NOT NULL,
    max_volontari integer DEFAULT 3,
    stato character varying(20) DEFAULT 'attivo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT slot_orari_stato_check CHECK (((stato)::text = ANY ((ARRAY['attivo'::character varying, 'inattivo'::character varying])::text[])))
);


--
-- Name: slot_orari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.slot_orari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: slot_orari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.slot_orari_id_seq OWNED BY public.slot_orari.id;


--
-- Name: volontari; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volontari (
    id integer NOT NULL,
    congregazione_id integer NOT NULL,
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
    CONSTRAINT volontari_ruolo_check CHECK (((ruolo)::text = ANY ((ARRAY['volontario'::character varying, 'admin'::character varying, 'super_admin'::character varying])::text[]))),
    CONSTRAINT volontari_sesso_check CHECK ((sesso = ANY (ARRAY['M'::bpchar, 'F'::bpchar]))),
    CONSTRAINT volontari_stato_check CHECK (((stato)::text = ANY ((ARRAY['attivo'::character varying, 'non_attivo'::character varying])::text[])))
);


--
-- Name: volontari_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.volontari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: volontari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.volontari_id_seq OWNED BY public.volontari.id;


--
-- Name: assegnazioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni ALTER COLUMN id SET DEFAULT nextval('public.assegnazioni_id_seq'::regclass);


--
-- Name: assegnazioni_volontari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni_volontari ALTER COLUMN id SET DEFAULT nextval('public.assegnazioni_volontari_id_seq'::regclass);


--
-- Name: disponibilita id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilita ALTER COLUMN id SET DEFAULT nextval('public.disponibilita_id_seq'::regclass);


--
-- Name: congregazioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.congregazioni ALTER COLUMN id SET DEFAULT nextval('public.congregazioni_id_seq'::regclass);


--
-- Name: notifiche id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifiche ALTER COLUMN id SET DEFAULT nextval('public.notifiche_id_seq'::regclass);


--
-- Name: postazioni id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postazioni ALTER COLUMN id SET DEFAULT nextval('public.postazioni_id_seq'::regclass);


--
-- Name: slot_orari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slot_orari ALTER COLUMN id SET DEFAULT nextval('public.slot_orari_id_seq'::regclass);


--
-- Name: volontari id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volontari ALTER COLUMN id SET DEFAULT nextval('public.volontari_id_seq'::regclass);


--
-- Name: congregazioni congregazioni_codice_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.congregazioni
    ADD CONSTRAINT congregazioni_codice_key UNIQUE (codice);


--
-- Name: congregazioni congregazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.congregazioni
    ADD CONSTRAINT congregazioni_pkey PRIMARY KEY (id);


--
-- Name: assegnazioni assegnazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_pkey PRIMARY KEY (id);


--
-- Name: assegnazioni_volontari assegnazioni_volontari_assegnazione_id_volontario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_assegnazione_id_volontario_id_key UNIQUE (assegnazione_id, volontario_id);


--
-- Name: assegnazioni_volontari assegnazioni_volontari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_pkey PRIMARY KEY (id);


--
-- Name: disponibilita disponibilita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: notifiche notifiche_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifiche
    ADD CONSTRAINT notifiche_pkey PRIMARY KEY (id);


--
-- Name: postazioni postazioni_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postazioni
    ADD CONSTRAINT postazioni_pkey PRIMARY KEY (id);


--
-- Name: slot_orari slot_orari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_pkey PRIMARY KEY (id);


--
-- Name: slot_orari slot_orari_postazione_id_orario_inizio_orario_fine_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_postazione_id_orario_inizio_orario_fine_key UNIQUE (postazione_id, orario_inizio, orario_fine);


--
-- Name: volontari volontari_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_email_key UNIQUE (email);


--
-- Name: volontari volontari_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_pkey PRIMARY KEY (id);


--
-- Name: disponibilita_volontario_id_data_slot_orario_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX disponibilita_volontario_id_data_slot_orario_id_key ON public.disponibilita USING btree (volontario_id, data, slot_orario_id);


--
-- Name: idx_assegnazioni_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assegnazioni_data ON public.assegnazioni USING btree (data_turno);


--
-- Name: idx_assegnazioni_postazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assegnazioni_postazione ON public.assegnazioni USING btree (postazione_id);


--
-- Name: idx_disponibilita_volontario_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disponibilita_volontario_data ON public.disponibilita USING btree (volontario_id, data);


--
-- Name: idx_notifications_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_admin_id ON public.notifications USING btree (admin_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_timestamp ON public.notifications USING btree ("timestamp");


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_slot_orari_postazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slot_orari_postazione ON public.slot_orari USING btree (postazione_id);


--
-- Name: idx_volontari_sesso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volontari_sesso ON public.volontari USING btree (sesso);


--
-- Name: idx_assegnazioni_congregazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assegnazioni_congregazione ON public.assegnazioni USING btree (congregazione_id);


--
-- Name: idx_assegnazioni_volontari_congregazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assegnazioni_volontari_congregazione ON public.assegnazioni_volontari USING btree (congregazione_id);


--
-- Name: idx_disponibilita_congregazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disponibilita_congregazione ON public.disponibilita USING btree (congregazione_id);


--
-- Name: idx_postazioni_congregazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_postazioni_congregazione ON public.postazioni USING btree (congregazione_id);


--
-- Name: idx_slot_orari_congregazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_slot_orari_congregazione ON public.slot_orari USING btree (congregazione_id);


--
-- Name: idx_volontari_congregazione; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volontari_congregazione ON public.volontari USING btree (congregazione_id);


--
-- Name: idx_volontari_stato; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volontari_stato ON public.volontari USING btree (stato);


--
-- Name: assegnazioni update_assegnazioni_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assegnazioni_updated_at BEFORE UPDATE ON public.assegnazioni FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: congregazioni update_congregazioni_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_congregazioni_updated_at BEFORE UPDATE ON public.congregazioni FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: postazioni update_postazioni_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_postazioni_updated_at BEFORE UPDATE ON public.postazioni FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: slot_orari update_slot_orari_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_slot_orari_updated_at BEFORE UPDATE ON public.slot_orari FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: volontari update_volontari_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_volontari_updated_at BEFORE UPDATE ON public.volontari FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assegnazioni assegnazioni_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: assegnazioni_volontari assegnazioni_volontari_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: disponibilita disponibilita_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: postazioni postazioni_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postazioni
    ADD CONSTRAINT postazioni_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: slot_orari slot_orari_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: volontari volontari_congregazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volontari
    ADD CONSTRAINT volontari_congregazione_id_fkey FOREIGN KEY (congregazione_id) REFERENCES public.congregazioni(id) ON DELETE CASCADE;


--
-- Name: assegnazioni assegnazioni_postazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_postazione_id_fkey FOREIGN KEY (postazione_id) REFERENCES public.postazioni(id) ON DELETE CASCADE;


--
-- Name: assegnazioni assegnazioni_slot_orario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni
    ADD CONSTRAINT assegnazioni_slot_orario_id_fkey FOREIGN KEY (slot_orario_id) REFERENCES public.slot_orari(id) ON DELETE CASCADE;


--
-- Name: assegnazioni_volontari assegnazioni_volontari_assegnazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_assegnazione_id_fkey FOREIGN KEY (assegnazione_id) REFERENCES public.assegnazioni(id) ON DELETE CASCADE;


--
-- Name: assegnazioni_volontari assegnazioni_volontari_volontario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assegnazioni_volontari
    ADD CONSTRAINT assegnazioni_volontari_volontario_id_fkey FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- Name: disponibilita disponibilita_slot_orario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_slot_orario_id_fkey FOREIGN KEY (slot_orario_id) REFERENCES public.slot_orari(id) ON DELETE CASCADE;


--
-- Name: disponibilita disponibilita_volontario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disponibilita
    ADD CONSTRAINT disponibilita_volontario_id_fkey FOREIGN KEY (volontario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- Name: notifiche notifiche_destinatario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifiche
    ADD CONSTRAINT notifiche_destinatario_id_fkey FOREIGN KEY (destinatario_id) REFERENCES public.volontari(id) ON DELETE CASCADE;


--
-- Name: slot_orari slot_orari_postazione_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slot_orari
    ADD CONSTRAINT slot_orari_postazione_id_fkey FOREIGN KEY (postazione_id) REFERENCES public.postazioni(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

