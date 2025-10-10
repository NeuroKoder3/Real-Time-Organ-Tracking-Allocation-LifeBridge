--
-- PostgreSQL database dump
--

\restrict dYy6SIpH8X2FIkdDw75mCLnFqtyfkuivDkYaAw6BdzCAUzCedtUrtqu8eCmAmoV

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: allocation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.allocation_status AS ENUM (
    'proposed',
    'accepted',
    'declined',
    'expired'
);


--
-- Name: consent_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.consent_status AS ENUM (
    'pending',
    'consented',
    'withdrawn'
);


--
-- Name: donor_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.donor_status AS ENUM (
    'active',
    'inactive',
    'eligible',
    'ineligible',
    'unknown'
);


--
-- Name: organ_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.organ_status AS ENUM (
    'available',
    'allocated',
    'discarded',
    'transplanted'
);


--
-- Name: transport_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transport_mode AS ENUM (
    'ground',
    'commercial_flight',
    'charter_flight',
    'helicopter',
    'drone'
);


--
-- Name: transport_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transport_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'failed'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'coordinator',
    'surgeon',
    'transport'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organ_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    match_score numeric(5,2) NOT NULL,
    compatibility_data jsonb,
    status public.allocation_status DEFAULT 'proposed'::public.allocation_status NOT NULL,
    proposed_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    responded_by uuid,
    decline_reason text,
    priority integer DEFAULT 1 NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_email character varying,
    user_role character varying,
    user_name character varying,
    session_id character varying NOT NULL,
    ip_address character varying NOT NULL,
    user_agent text,
    http_method character varying,
    endpoint character varying,
    action character varying NOT NULL,
    action_category character varying NOT NULL,
    entity_type character varying,
    entity_id uuid,
    previous_values jsonb,
    new_values jsonb,
    changed_fields jsonb,
    query_params jsonb,
    result_count integer,
    success boolean DEFAULT true NOT NULL,
    error_message text,
    error_code character varying,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb,
    phi_accessed boolean DEFAULT false NOT NULL,
    export_format character varying,
    export_record_count integer
);


--
-- Name: auth_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    user_email character varying,
    attempted_email character varying,
    event_type character varying NOT NULL,
    event_status character varying NOT NULL,
    session_id character varying,
    ip_address character varying NOT NULL,
    user_agent text,
    failure_reason character varying,
    consecutive_failures integer DEFAULT 0,
    mfa_used boolean DEFAULT false,
    login_method character varying,
    previous_role character varying,
    new_role character varying,
    changed_by uuid,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


--
-- Name: custody_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custody_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organ_id uuid NOT NULL,
    action character varying NOT NULL,
    performed_by uuid NOT NULL,
    location character varying NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    temperature numeric(4,2),
    notes text,
    signature character varying
);


--
-- Name: donors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unos_id character varying,
    first_name character varying,
    last_name character varying,
    date_of_birth timestamp with time zone,
    blood_type character varying NOT NULL,
    age integer,
    weight numeric(5,2),
    height numeric(5,2),
    location character varying NOT NULL,
    hospital_id character varying,
    status public.donor_status DEFAULT 'active'::public.donor_status NOT NULL,
    consent_status public.consent_status DEFAULT 'pending'::public.consent_status NOT NULL,
    medical_history jsonb,
    hla_type jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    allocation_id uuid,
    transport_id uuid,
    sender_id uuid NOT NULL,
    message_type character varying NOT NULL,
    content text NOT NULL,
    attachment_url character varying,
    priority character varying DEFAULT 'normal'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_type character varying NOT NULL,
    organ_type character varying,
    value numeric(10,2) NOT NULL,
    period character varying NOT NULL,
    date timestamp with time zone NOT NULL,
    metadata jsonb
);


--
-- Name: organs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    donor_id uuid NOT NULL,
    organ_type character varying NOT NULL,
    blood_type character varying NOT NULL,
    status public.organ_status DEFAULT 'available'::public.organ_status NOT NULL,
    viability_hours integer NOT NULL,
    preservation_start_time timestamp with time zone NOT NULL,
    viability_deadline timestamp with time zone NOT NULL,
    current_location character varying,
    temperature numeric(4,2),
    preservation_solution character varying,
    quality_score character varying,
    biopsy_results jsonb,
    crossmatch_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unos_id character varying,
    first_name character varying,
    last_name character varying,
    blood_type character varying NOT NULL,
    organ_needed character varying NOT NULL,
    urgency_status character varying NOT NULL,
    waitlist_date timestamp with time zone NOT NULL,
    location character varying NOT NULL,
    hospital_id character varying,
    medical_data jsonb,
    hla_type jsonb,
    antibodies jsonb,
    meld_score integer,
    cpc_score integer,
    status character varying DEFAULT 'waiting'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp with time zone NOT NULL
);


--
-- Name: transports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organ_id uuid NOT NULL,
    allocation_id uuid,
    transport_mode public.transport_mode NOT NULL,
    status public.transport_status DEFAULT 'scheduled'::public.transport_status NOT NULL,
    origin_location character varying NOT NULL,
    destination_location character varying NOT NULL,
    scheduled_pickup timestamp with time zone NOT NULL,
    scheduled_delivery timestamp with time zone NOT NULL,
    actual_pickup timestamp with time zone,
    actual_delivery timestamp with time zone,
    courier_id uuid,
    carrier_info jsonb,
    tracking_number character varying,
    current_gps_lat numeric(9,6),
    current_gps_lng numeric(9,6),
    backup_plan jsonb,
    weather_impact character varying,
    cost_estimate numeric(10,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role public.user_role DEFAULT 'coordinator'::public.user_role NOT NULL,
    department character varying,
    organization character varying,
    hospital_id character varying,
    phone_number character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    password character varying
);


--
-- Name: allocations allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_audit_logs auth_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: custody_logs custody_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custody_logs
    ADD CONSTRAINT custody_logs_pkey PRIMARY KEY (id);


--
-- Name: donors donors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (id);


--
-- Name: donors donors_unos_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_unos_id_key UNIQUE (unos_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: metrics metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT metrics_pkey PRIMARY KEY (id);


--
-- Name: organs organs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organs
    ADD CONSTRAINT organs_pkey PRIMARY KEY (id);


--
-- Name: recipients recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipients
    ADD CONSTRAINT recipients_pkey PRIMARY KEY (id);


--
-- Name: recipients recipients_unos_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipients
    ADD CONSTRAINT recipients_unos_id_key UNIQUE (unos_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: transports transports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transports
    ADD CONSTRAINT transports_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_allocations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_status ON public.allocations USING btree (status);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_auth_audit_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_audit_timestamp ON public.auth_audit_logs USING btree ("timestamp");


--
-- Name: idx_donors_consent_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donors_consent_status ON public.donors USING btree (consent_status);


--
-- Name: idx_donors_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donors_status ON public.donors USING btree (status);


--
-- Name: idx_organs_blood_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organs_blood_type ON public.organs USING btree (blood_type);


--
-- Name: idx_organs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organs_status ON public.organs USING btree (status);


--
-- Name: idx_recipients_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipients_status ON public.recipients USING btree (status);


--
-- Name: idx_sessions_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expire ON public.sessions USING btree (expire);


--
-- Name: idx_transports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transports_status ON public.transports USING btree (status);


--
-- Name: allocations allocations_organ_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_organ_id_fkey FOREIGN KEY (organ_id) REFERENCES public.organs(id) ON DELETE CASCADE;


--
-- Name: allocations allocations_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.recipients(id) ON DELETE CASCADE;


--
-- Name: allocations allocations_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allocations
    ADD CONSTRAINT allocations_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: auth_audit_logs auth_audit_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: auth_audit_logs auth_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: custody_logs custody_logs_organ_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custody_logs
    ADD CONSTRAINT custody_logs_organ_id_fkey FOREIGN KEY (organ_id) REFERENCES public.organs(id) ON DELETE CASCADE;


--
-- Name: custody_logs custody_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custody_logs
    ADD CONSTRAINT custody_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: messages messages_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: messages messages_transport_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_transport_id_fkey FOREIGN KEY (transport_id) REFERENCES public.transports(id) ON DELETE CASCADE;


--
-- Name: organs organs_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organs
    ADD CONSTRAINT organs_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE CASCADE;


--
-- Name: transports transports_allocation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transports
    ADD CONSTRAINT transports_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES public.allocations(id) ON DELETE SET NULL;


--
-- Name: transports transports_courier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transports
    ADD CONSTRAINT transports_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES public.users(id);


--
-- Name: transports transports_organ_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transports
    ADD CONSTRAINT transports_organ_id_fkey FOREIGN KEY (organ_id) REFERENCES public.organs(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dYy6SIpH8X2FIkdDw75mCLnFqtyfkuivDkYaAw6BdzCAUzCedtUrtqu8eCmAmoV

