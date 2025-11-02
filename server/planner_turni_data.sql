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
-- Data for Name: postazioni; Type: TABLE DATA; Schema: public; Owner: zy0n
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.postazioni DISABLE TRIGGER ALL;

COPY public.postazioni (id, luogo, indirizzo, giorni_settimana, stato, created_at, updated_at, max_proclamatori) FROM stdin;
16	Piazza Giotto	Piazza Giotto, Milano	{1,2,3,4,5}	attiva	2025-07-24 16:03:52.736018	2025-07-24 16:03:52.736018	3
17	Stazione Notarbartolo	Via Notarbartolo, Milano	{1,2,3,4,5}	attiva	2025-07-24 16:03:59.77177	2025-07-24 16:03:59.77177	2
18	Stazione Centrale	Piazza Duca d'Aosta, Milano	{1,2,3,4,5,6}	attiva	2025-07-24 16:04:07.459818	2025-07-24 16:04:07.459818	3
\.


ALTER TABLE public.postazioni ENABLE TRIGGER ALL;

--
-- Data for Name: slot_orari; Type: TABLE DATA; Schema: public; Owner: zy0n
--

ALTER TABLE public.slot_orari DISABLE TRIGGER ALL;

COPY public.slot_orari (id, postazione_id, orario_inizio, orario_fine, max_volontari, stato, created_at, updated_at) FROM stdin;
35	16	09:00:00	11:00:00	3	attivo	2025-07-24 16:03:52.736018	2025-07-24 16:03:52.736018
36	16	14:00:00	16:00:00	3	attivo	2025-07-24 16:03:52.736018	2025-07-24 16:03:52.736018
37	17	10:00:00	12:00:00	2	attivo	2025-07-24 16:03:59.77177	2025-07-24 16:03:59.77177
38	17	15:00:00	17:00:00	2	attivo	2025-07-24 16:03:59.77177	2025-07-24 16:03:59.77177
39	18	08:00:00	10:00:00	3	attivo	2025-07-24 16:04:07.459818	2025-07-24 16:04:07.459818
40	18	13:00:00	15:00:00	3	attivo	2025-07-24 16:04:07.459818	2025-07-24 16:04:07.459818
41	18	16:00:00	18:00:00	3	attivo	2025-07-24 16:04:07.459818	2025-07-24 16:04:07.459818
\.


ALTER TABLE public.slot_orari ENABLE TRIGGER ALL;

--
-- Data for Name: assegnazioni; Type: TABLE DATA; Schema: public; Owner: zy0n
--

ALTER TABLE public.assegnazioni DISABLE TRIGGER ALL;

COPY public.assegnazioni (id, postazione_id, data_turno, orario_inizio, orario_fine, stato, note, created_at, updated_at, slot_orario_id) FROM stdin;
\.


ALTER TABLE public.assegnazioni ENABLE TRIGGER ALL;

--
-- Data for Name: volontari; Type: TABLE DATA; Schema: public; Owner: zy0n
--

ALTER TABLE public.volontari DISABLE TRIGGER ALL;

COPY public.volontari (id, nome, cognome, sesso, stato, ultima_assegnazione, email, password_hash, ruolo, created_at, updated_at, telefono) FROM stdin;
8	Sofia	Rossi	F	attivo	\N	sofia.rossi@email.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	volontario	2025-07-23 02:37:47.059513	2025-07-23 02:37:47.083987	\N
9	Luca	Bianchi	M	attivo	2025-07-22 00:00:00	luca.bianchi@email.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	volontario	2025-07-23 02:37:47.059513	2025-07-23 02:37:47.083987	\N
10	Elena	Verdi	F	attivo	\N	elena.verdi@email.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	volontario	2025-07-23 02:37:47.059513	2025-07-23 02:37:47.083987	\N
12	Giovanni	Neri	M	attivo	2025-07-22 00:00:00	giovanni.neri@email.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	volontario	2025-07-23 02:37:47.059513	2025-07-23 02:37:47.083987	\N
1	Admin	Sistema	M	attivo	\N	admin@planner.com	$2a$10$oT.zUhLkPKGOloCbRYxgr.GcZ6ldJcYqRnpxozS5wGWN5NQ3OqYr6	admin	2025-07-23 02:37:44.08635	2025-07-23 02:39:43.185906	\N
16	Laura	Bianchi	F	attivo	\N	laura.bianchi@test.com	$2a$10$zI.D3lMD0pXWhd/IH55LMOLfu7J6FtySlrzV583wStRrlATAoZfg2	volontario	2025-07-23 12:17:48.453104	2025-07-23 12:17:48.453104	234567890
17	Giuseppe	Verdi	M	attivo	\N	giuseppe.verdi@test.com	$2a$10$hOz4m29oCShFjYc.gKab4ukfXgeG.RwDw.hXnhQ0MFihXXJT5Kf0S	volontario	2025-07-23 12:17:55.310963	2025-07-23 12:17:55.310963	345678901
18	Sofia	Neri	F	attivo	\N	sofia.neri@test.com	$2a$10$w6O6J6ABnvj4joYKZk7yYuC3z7oafi9aqbkjYp6gxfZiD6fFT/Q3u	volontario	2025-07-23 12:18:00.778004	2025-07-23 12:18:00.778004	456789012
19	Alessandro	Gialli	M	attivo	\N	alessandro.gialli@test.com	$2a$10$1A6ywTtBGt4VJL9S0eLwq.yJt/PWZlfeEBWQKAORic0KzF4nb6uO2	volontario	2025-07-23 12:18:06.06034	2025-07-23 12:18:06.06034	567890123
20	Elena	Blu	F	attivo	\N	elena.blu@test.com	$2a$10$ymp/IOqViGfn89t.i1BzDOQpiXly9gTVjtDOBKvyJir9D9b2w0W66	volontario	2025-07-23 12:18:11.630321	2025-07-23 12:18:11.630321	678901234
21	Roberto	Marrone	M	attivo	\N	roberto.marrone@test.com	$2a$10$l24QZhsAu.C8N/nHDAioj.Fj5BA1ERHXct6OOOkDfy6mgJetX2hzu	volontario	2025-07-23 12:18:17.040668	2025-07-23 12:18:17.040668	789012345
22	Chiara	Rosa	F	attivo	\N	chiara.rosa@test.com	$2a$10$GsaCOywLWqpmuudA5GgGguSMGbWbjWt.dM79OStXB.TdOvf6V.A6e	volontario	2025-07-23 12:18:27.708904	2025-07-23 12:18:27.708904	890123456
23	Davide	Grigio	M	attivo	\N	davide.grigio@test.com	$2a$10$qpu/B.t515gzo0MqYUeW2.kBWfOK/3DjnKlbVTME1dGpZ4ld0WM4G	volontario	2025-07-23 12:18:33.53843	2025-07-23 12:18:33.53843	901234567
24	Valentina	Viola	F	attivo	\N	valentina.viola@test.com	$2a$10$elZRP83N3MqL.t12K/erIuzPzWAj7vNUqA3C6kuK6D9CSA9CxMic.	volontario	2025-07-23 12:18:38.510309	2025-07-23 12:18:38.510309	012345678
25	Euly	Test	F	attivo	\N	euly.test@email.com	\N	volontario	2025-07-23 12:22:31.712729	2025-07-23 12:22:31.712729	123456789
4	Anna	Bianca	F	attivo	\N	anna.bianchi@email.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	volontario	2025-07-23 02:37:47.059513	2025-07-23 12:46:44.060483	1234567893
7	Paolo	Neri	M	attivo	2025-07-25 00:00:00	paolo.neri@email.com	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	volontario	2025-07-23 02:37:47.059513	2025-07-24 15:28:03.443675	\N
\.


ALTER TABLE public.volontari ENABLE TRIGGER ALL;

--
-- Data for Name: assegnazioni_volontari; Type: TABLE DATA; Schema: public; Owner: zy0n
--

ALTER TABLE public.assegnazioni_volontari DISABLE TRIGGER ALL;

COPY public.assegnazioni_volontari (id, assegnazione_id, volontario_id, ruolo_turno, created_at) FROM stdin;
\.


ALTER TABLE public.assegnazioni_volontari ENABLE TRIGGER ALL;

--
-- Data for Name: disponibilita; Type: TABLE DATA; Schema: public; Owner: zy0n
--

ALTER TABLE public.disponibilita DISABLE TRIGGER ALL;

COPY public.disponibilita (id, volontario_id, data, orario_inizio, orario_fine, stato, note, created_at, postazione_id) FROM stdin;
\.


ALTER TABLE public.disponibilita ENABLE TRIGGER ALL;

--
-- Data for Name: notifiche; Type: TABLE DATA; Schema: public; Owner: zy0n
--

ALTER TABLE public.notifiche DISABLE TRIGGER ALL;

COPY public.notifiche (id, tipo, titolo, messaggio, destinatario_id, letta, created_at) FROM stdin;
\.


ALTER TABLE public.notifiche ENABLE TRIGGER ALL;

--
-- Name: assegnazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.assegnazioni_id_seq', 38, true);


--
-- Name: assegnazioni_volontari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.assegnazioni_volontari_id_seq', 71, true);


--
-- Name: disponibilita_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.disponibilita_id_seq', 1350, true);


--
-- Name: notifiche_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.notifiche_id_seq', 1, false);


--
-- Name: postazioni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.postazioni_id_seq', 18, true);


--
-- Name: slot_orari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.slot_orari_id_seq', 41, true);


--
-- Name: volontari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zy0n
--

SELECT pg_catalog.setval('public.volontari_id_seq', 25, true);


--
-- PostgreSQL database dump complete
--

