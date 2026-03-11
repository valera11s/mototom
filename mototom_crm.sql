--
-- PostgreSQL database dump
--

\restrict zJO65f4gKR6If1BYJl9oRUdeupCj90NfqhPgN2BbIdSeLpgwkHFvjyYdRp4f3d1

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: ai_job_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ai_job_status AS ENUM (
    'queued',
    'running',
    'done',
    'failed'
);


ALTER TYPE public.ai_job_status OWNER TO postgres;

--
-- Name: ai_job_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ai_job_type AS ENUM (
    'generate_description',
    'generate_images'
);


ALTER TYPE public.ai_job_type OWNER TO postgres;

--
-- Name: inventory_event_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inventory_event_type AS ENUM (
    'create',
    'manual_adjust',
    'reserve',
    'sale',
    'cancel_reserve',
    'return',
    'archive'
);


ALTER TYPE public.inventory_event_type OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'draft',
    'new',
    'confirmed',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'returned'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: product_condition; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_condition AS ENUM (
    'new',
    'used'
);


ALTER TYPE public.product_condition OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'owner',
    'admin',
    'manager',
    'viewer'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.touch_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_generation_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_generation_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_type public.ai_job_type NOT NULL,
    status public.ai_job_status DEFAULT 'queued'::public.ai_job_status NOT NULL,
    template_id uuid,
    product_id uuid,
    prompt text,
    result_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    error_message text,
    requested_by uuid,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_generation_jobs OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    before_data jsonb,
    after_data jsonb,
    ip inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: blocked_ips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_ips (
    id integer NOT NULL,
    ip_address character varying(45) NOT NULL,
    reason text,
    blocked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    blocked_by character varying(255),
    request_count bigint DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blocked_ips OWNER TO postgres;

--
-- Name: blocked_ips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.blocked_ips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blocked_ips_id_seq OWNER TO postgres;

--
-- Name: blocked_ips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.blocked_ips_id_seq OWNED BY public.blocked_ips.id;


--
-- Name: brand_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brand_categories (
    brand_id uuid NOT NULL,
    category_id uuid NOT NULL
);


ALTER TABLE public.brand_categories OWNER TO postgres;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name public.citext NOT NULL,
    slug text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sort_order integer DEFAULT 0,
    popular boolean DEFAULT false
);


ALTER TABLE public.brands OWNER TO postgres;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    session_id text NOT NULL,
    product_id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    level integer DEFAULT 0,
    product_name_prefix character varying(255)
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    label text,
    recipient_name text,
    phone text,
    country text DEFAULT 'ђ®ббЁп'::text,
    city text,
    region text,
    postal_code text,
    address_line1 text NOT NULL,
    address_line2 text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    phone text,
    email public.citext,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_movements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    event_type public.inventory_event_type NOT NULL,
    delta_qty integer NOT NULL,
    reason text,
    related_order_id uuid,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventory_movements OWNER TO postgres;

--
-- Name: look_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.look_items (
    look_id uuid NOT NULL,
    template_id uuid,
    product_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    note text,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    CONSTRAINT chk_look_item_target CHECK (((template_id IS NOT NULL) OR (product_id IS NOT NULL)))
);


ALTER TABLE public.look_items OWNER TO postgres;

--
-- Name: looks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.looks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    cover_image_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    look_category text DEFAULT 'Город'::text NOT NULL,
    look_categories text[] DEFAULT ARRAY['Город'::text] NOT NULL
);


ALTER TABLE public.looks OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50),
    email character varying(255),
    message text NOT NULL,
    message_type character varying(32) DEFAULT 'feedback'::character varying,
    status character varying(50) DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    template_id uuid,
    sku_snapshot text,
    title_snapshot text NOT NULL,
    brand_snapshot text,
    category_snapshot text,
    condition_snapshot public.product_condition,
    qty integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_items_line_total_check CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT order_items_qty_check CHECK ((qty > 0)),
    CONSTRAINT order_items_unit_price_check CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    old_status public.order_status,
    new_status public.order_status NOT NULL,
    changed_by uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.order_status_history OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    customer_id uuid,
    status public.order_status DEFAULT 'new'::public.order_status NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_amount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    payment_method text,
    payment_status text,
    paid_at timestamp with time zone,
    shipping_method text,
    shipping_address jsonb DEFAULT '{}'::jsonb NOT NULL,
    customer_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    comment text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    archived boolean DEFAULT false,
    client_ip character varying(45)
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: product_archives; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_archives (
    id bigint NOT NULL,
    source_product_id text NOT NULL,
    snapshot jsonb NOT NULL,
    reason text,
    deleted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_archives OWNER TO postgres;

--
-- Name: product_archives_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_archives_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_archives_id_seq OWNER TO postgres;

--
-- Name: product_archives_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_archives_id_seq OWNED BY public.product_archives.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_main boolean DEFAULT false NOT NULL,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- Name: product_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_id uuid NOT NULL,
    category_id uuid NOT NULL,
    model_name text NOT NULL,
    model_key text NOT NULL,
    base_title text NOT NULL,
    description text,
    default_specs jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_description text,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_templates OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    sku text NOT NULL,
    barcode text,
    title text NOT NULL,
    slug text NOT NULL,
    condition public.product_condition NOT NULL,
    color text,
    size text,
    price numeric(12,2) NOT NULL,
    old_price numeric(12,2),
    stock_qty integer DEFAULT 0 NOT NULL,
    reserved_qty integer DEFAULT 0 NOT NULL,
    description_override text,
    specs_override jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    published_at timestamp with time zone,
    sold_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text,
    description text,
    original_price numeric(12,2),
    image_url text,
    images text[] DEFAULT '{}'::text[],
    category_id uuid,
    subcategory_id uuid,
    subsubcategory_id uuid,
    category_id_2 uuid,
    brand text,
    in_stock boolean DEFAULT true,
    featured boolean DEFAULT false,
    popular boolean DEFAULT false,
    on_sale boolean DEFAULT false,
    rating numeric(3,2),
    specs jsonb DEFAULT '{}'::jsonb,
    is_archived boolean DEFAULT false NOT NULL,
    archived_at timestamp without time zone,
    auto_delete_at timestamp without time zone,
    CONSTRAINT chk_used_stock CHECK (((condition <> 'used'::public.product_condition) OR (stock_qty <= 1))),
    CONSTRAINT products_old_price_check CHECK ((old_price >= (0)::numeric)),
    CONSTRAINT products_price_check CHECK ((price >= (0)::numeric)),
    CONSTRAINT products_reserved_qty_check CHECK ((reserved_qty >= 0)),
    CONSTRAINT products_stock_qty_check CHECK ((stock_qty >= 0))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: template_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_main boolean DEFAULT false NOT NULL,
    source text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.template_images OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    full_name text NOT NULL,
    role public.user_role DEFAULT 'manager'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: blocked_ips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips ALTER COLUMN id SET DEFAULT nextval('public.blocked_ips_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: product_archives id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_archives ALTER COLUMN id SET DEFAULT nextval('public.product_archives_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Data for Name: ai_generation_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_generation_jobs (id, job_type, status, template_id, product_id, prompt, result_payload, error_message, requested_by, started_at, finished_at, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, actor_user_id, action, entity_type, entity_id, before_data, after_data, ip, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: blocked_ips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.blocked_ips (id, ip_address, reason, blocked_at, blocked_by, request_count, created_at) FROM stdin;
\.


--
-- Data for Name: brand_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brand_categories (brand_id, category_id) FROM stdin;
0de06905-2b5b-4470-be7b-98a2a56b3878	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2
2c6f0ca0-8afc-42ec-8053-abce4ad70679	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2
a45858cf-0919-4a75-8e67-3442180337fb	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2
accd4a21-d05b-421a-8d92-d7da0d6933fc	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2
ba66677c-51f8-45ea-9ab8-264b87cd680e	f360e60d-0543-47dd-8e35-913069eb87a1
ba66677c-51f8-45ea-9ab8-264b87cd680e	2616dcf4-5603-4979-bf1b-d83c02cee6a3
ba66677c-51f8-45ea-9ab8-264b87cd680e	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
ba66677c-51f8-45ea-9ab8-264b87cd680e	1112b5bd-b5ea-4e3d-a44a-6606da40812e
1e47ef44-3c10-4f2e-a167-1d4e61468458	f360e60d-0543-47dd-8e35-913069eb87a1
1e47ef44-3c10-4f2e-a167-1d4e61468458	2616dcf4-5603-4979-bf1b-d83c02cee6a3
1e47ef44-3c10-4f2e-a167-1d4e61468458	1112b5bd-b5ea-4e3d-a44a-6606da40812e
36ba239a-e064-4dc9-a3b3-3aa72728e531	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
528474cd-fc75-46a1-a416-cccc4446c4d5	996aad3a-b88b-4264-b999-ed42ac852b86
8f57393e-72c8-4ba8-b8aa-7b7e1128dffe	f360e60d-0543-47dd-8e35-913069eb87a1
d72faae9-6c39-4692-8ad0-2f0978c338ea	5bf0e363-16c1-4c1a-82ca-789ace47b1b0
a45858cf-0919-4a75-8e67-3442180337fb	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
2dad1445-3f4f-43eb-a892-6397d581d046	996aad3a-b88b-4264-b999-ed42ac852b86
da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b
0a1adb23-d14c-43cf-b6ff-4024d1003d3c	1ac52608-791b-4334-b0ff-a36ad2d21c4b
ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b
8f57393e-72c8-4ba8-b8aa-7b7e1128dffe	1ac52608-791b-4334-b0ff-a36ad2d21c4b
da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86
5fbac148-1d5b-4c7c-874b-af626e2c9ecc	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
da6e21bb-3947-4d75-a8fc-b3e21e48dee7	1ac52608-791b-4334-b0ff-a36ad2d21c4b
accd4a21-d05b-421a-8d92-d7da0d6933fc	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
3e6b1335-c12a-48fe-ab01-5103949b1f46	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
820c692f-3a71-4f22-bb39-8440616d6c5a	996aad3a-b88b-4264-b999-ed42ac852b86
2094ec9b-bbd2-463f-808a-0617894fa3ef	1ac52608-791b-4334-b0ff-a36ad2d21c4b
1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b
99a62bed-b8fb-4452-a059-b2156dc3b449	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
950e2b15-ac4d-4c0f-8a5f-f4c76f6c572a	996aad3a-b88b-4264-b999-ed42ac852b86
b17da17b-94ed-4e7b-8abd-66343eec2c3a	1ac52608-791b-4334-b0ff-a36ad2d21c4b
da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
2dad1445-3f4f-43eb-a892-6397d581d046	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
98918958-25db-40b0-91ce-b3b61dc40d68	1ac52608-791b-4334-b0ff-a36ad2d21c4b
7f09f721-6114-4c7f-977b-f3c47386942a	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
0786e513-c7b2-43f3-9768-a069acc2c1eb	1ac52608-791b-4334-b0ff-a36ad2d21c4b
da0c823a-835c-411c-a043-c8ef734ae643	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2
56489432-b6c3-453c-b26b-a3fdb8514415	1ac52608-791b-4334-b0ff-a36ad2d21c4b
c45d939e-64aa-4291-9d3a-f4b54f6c61ae	1ac52608-791b-4334-b0ff-a36ad2d21c4b
2c6f0ca0-8afc-42ec-8053-abce4ad70679	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5
0a287469-e09b-406c-92a2-2f0332ae587c	1ac52608-791b-4334-b0ff-a36ad2d21c4b
0de06905-2b5b-4470-be7b-98a2a56b3878	996aad3a-b88b-4264-b999-ed42ac852b86
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.brands (id, name, slug, is_active, created_at, updated_at, sort_order, popular) FROM stdin;
0de06905-2b5b-4470-be7b-98a2a56b3878	Shoei	shoei	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
2c6f0ca0-8afc-42ec-8053-abce4ad70679	AGV	agv	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
a45858cf-0919-4a75-8e67-3442180337fb	Arai	arai	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
accd4a21-d05b-421a-8d92-d7da0d6933fc	HJC	hjc	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
ba66677c-51f8-45ea-9ab8-264b87cd680e	Alpinestars	alpinestars	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
1e47ef44-3c10-4f2e-a167-1d4e61468458	Dainese	dainese	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
36ba239a-e064-4dc9-a3b3-3aa72728e531	TCX	tcx	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
528474cd-fc75-46a1-a416-cccc4446c4d5	Cardo	cardo	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
8f57393e-72c8-4ba8-b8aa-7b7e1128dffe	REV'IT!	revit	t	2026-03-07 15:42:12.343029+03	2026-03-07 15:42:12.343029+03	0	f
d72faae9-6c39-4692-8ad0-2f0978c338ea	123	123	t	2026-03-07 19:20:21.869912+03	2026-03-07 19:20:21.869912+03	0	f
57b47b84-9067-458c-9489-e72da619de4b	fsdfs	fsdfs	t	2026-03-08 01:51:15.138155+03	2026-03-08 01:51:15.138155+03	0	f
2dad1445-3f4f-43eb-a892-6397d581d046	Icon	icon	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
da0c823a-835c-411c-a043-c8ef734ae643	BMW	bmw	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
0a1adb23-d14c-43cf-b6ff-4024d1003d3c	Spidi	spidi	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
5fbac148-1d5b-4c7c-874b-af626e2c9ecc	LS2	ls2	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
da6e21bb-3947-4d75-a8fc-b3e21e48dee7	RST	rst	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
3e6b1335-c12a-48fe-ab01-5103949b1f46	Schuberth	schuberth	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
820c692f-3a71-4f22-bb39-8440616d6c5a	Yamaha	yamaha	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
2094ec9b-bbd2-463f-808a-0617894fa3ef	Triumph	triumph	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
99a62bed-b8fb-4452-a059-b2156dc3b449	Shark	shark	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
950e2b15-ac4d-4c0f-8a5f-f4c76f6c572a	Rugged	rugged	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
b17da17b-94ed-4e7b-8abd-66343eec2c3a	Proof	proof	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
98918958-25db-40b0-91ce-b3b61dc40d68	Harley-Davidson	harley-davidson	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
7f09f721-6114-4c7f-977b-f3c47386942a	Touratech	touratech	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
0786e513-c7b2-43f3-9768-a069acc2c1eb	Ducati	ducati	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
56489432-b6c3-453c-b26b-a3fdb8514415	IXS	ixs	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
c45d939e-64aa-4291-9d3a-f4b54f6c61ae	HolyFreedom	holyfreedom	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
0a287469-e09b-406c-92a2-2f0332ae587c	Shima	shima	t	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03	999	f
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, session_id, product_id, quantity, created_at, updated_at) FROM stdin;
1	guest_1768628869159	16d3295d-3ead-44e4-a094-c5404366a8cb	1	2026-03-11 01:37:39.068445+03	2026-03-11 01:37:39.068445+03
2	guest_1768628869159	c13758e7-438a-42e2-b506-9eaa3cd2fd5a	2	2026-03-11 01:52:16.269706+03	2026-03-11 01:52:48.630541+03
3	guest_1768628869159	de7b6bf7-0fa2-485d-9032-da9a31c65d5a	1	2026-03-11 01:57:16.148414+03	2026-03-11 01:57:16.148414+03
4	guest_1768628869159	5dc836a4-a9a2-4c45-a7f4-0c7e5daf5c11	1	2026-03-11 02:08:00.216799+03	2026-03-11 02:08:00.216799+03
6	guest_1768628869159	4f7dcd70-f382-4f7d-ac5e-5bb32677b7e5	5	2026-03-11 02:10:53.175823+03	2026-03-11 02:16:48.678881+03
7	guest_1768628869159	632b398e-f044-4a36-bffe-9d10d2641900	5	2026-03-11 02:21:20.747455+03	2026-03-11 02:24:26.405111+03
5	guest_1768628869159	4807a7e1-9fb9-4107-8c27-3cceaed87643	5	2026-03-11 02:08:07.079274+03	2026-03-11 02:27:45.87404+03
8	guest_1768628869159	6fb5e1ed-78b8-4471-a204-80b7e9efd4af	4	2026-03-11 02:28:48.294851+03	2026-03-11 02:28:54.742894+03
9	guest_1768628869159	b0ab6d18-be90-4c3c-9989-90ef317c0d7c	2	2026-03-11 02:29:20.13953+03	2026-03-11 02:29:26.717578+03
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, parent_id, name, slug, sort_order, is_active, created_at, updated_at, level, product_name_prefix) FROM stdin;
7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	Шлемы	helmets	10	t	2026-03-07 15:37:30.945789+03	2026-03-07 18:23:52.287951+03	0	\N
f360e60d-0543-47dd-8e35-913069eb87a1	\N	Моторубашки	moto-shirts	20	t	2026-03-07 15:37:30.945789+03	2026-03-07 18:23:52.287951+03	0	\N
2616dcf4-5603-4979-bf1b-d83c02cee6a3	\N	Перчатки	gloves	30	t	2026-03-07 15:37:30.945789+03	2026-03-07 18:23:52.287951+03	0	\N
5bf0e363-16c1-4c1a-82ca-789ace47b1b0	1112b5bd-b5ea-4e3d-a44a-6606da40812e	Супер	super	0	t	2026-03-08 01:34:47.838949+03	2026-03-08 01:35:15.358934+03	1	\N
12ffe10d-7738-4c3d-a85e-68a1b67d69c2	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	суперрр	superrr	0	t	2026-03-08 01:35:59.370363+03	2026-03-08 01:35:59.370363+03	1	\N
e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	Ботинки	botinki	40	t	2026-03-07 15:37:30.945789+03	2026-03-09 03:37:18.63037+03	0	\N
8dcc8dfe-fe1b-48fb-9f7b-ce1a9d6e70ab	996aad3a-b88b-4264-b999-ed42ac852b86	123	123	0	t	2026-03-09 03:37:14.2639+03	2026-03-09 03:37:29.710265+03	1	\N
996aad3a-b88b-4264-b999-ed42ac852b86	\N	Аксессуары	aksessuary	60	t	2026-03-07 15:37:30.945789+03	2026-03-09 03:37:42.525206+03	0	\N
1112b5bd-b5ea-4e3d-a44a-6606da40812e	\N	Защита	zaschita	50	t	2026-03-07 15:37:30.945789+03	2026-03-10 15:35:17.820997+03	0	\N
e91201f1-b995-4b52-bbc1-bfb2e6e65389	5bf0e363-16c1-4c1a-82ca-789ace47b1b0	zzzzz	zzzzz	0	t	2026-03-10 15:35:39.649698+03	2026-03-10 15:35:39.649698+03	2	\N
1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	Куртки	куртки	20	t	2026-03-10 16:20:49.507696+03	2026-03-10 16:20:49.507696+03	0	\N
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_addresses (id, customer_id, label, recipient_name, phone, country, city, region, postal_code, address_line1, address_line2, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, full_name, phone, email, note, created_at, updated_at) FROM stdin;
ad21d1c5-4bff-40f4-8434-371884e782a0	Иван	+7 (099) 999-99-99	\N	\N	2026-03-11 00:19:09.115064+03	2026-03-11 00:19:09.115064+03
62c65d1a-e0a6-47b2-813d-45e03816fdef	Иван	+7 (777) 777-77-77	\N	\N	2026-03-11 01:37:09.364321+03	2026-03-11 01:37:09.364321+03
9ddc5567-dba5-415b-9747-26b52909a0a6	Иван	+7 (999) 999-99-99	\N	\N	2026-03-11 01:45:12.512633+03	2026-03-11 01:45:12.512633+03
9f697f81-5ce4-4131-be9d-73ff1f97666c	Иван	+7 (676) 777-77-77	\N	\N	2026-03-11 03:54:08.460368+03	2026-03-11 03:54:08.460368+03
\.


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_movements (id, product_id, event_type, delta_qty, reason, related_order_id, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: look_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.look_items (look_id, template_id, product_id, sort_order, note, id) FROM stdin;
d9e7c521-c894-425a-95f1-ed2d3b3725ff	3f9d7bcf-94a0-41f4-9379-8ef61603a02a	\N	3	Boots	0066510d-e6dc-4c13-a69b-26de6bb9c84c
d9e7c521-c894-425a-95f1-ed2d3b3725ff	07e33a5a-4e7a-4206-ad02-6ca97d84a14b	\N	2	Top	58ca7864-db8c-4742-a150-9afdc90bfaef
d9e7c521-c894-425a-95f1-ed2d3b3725ff	8b5fe852-04a7-4348-9ed9-af1c1eee7ce2	\N	1	Helmet	c6c4f79a-b74e-4888-97f4-9a53858e51ae
3c492508-1877-43bd-8b3b-30b5cf11d609	07e33a5a-4e7a-4206-ad02-6ca97d84a14b	\N	2	Top	d3b8f370-044a-48c4-bd5d-e5248d30a094
3c492508-1877-43bd-8b3b-30b5cf11d609	46ffe0c7-619f-4b97-9abc-54bfdf07e0c4	\N	1	Helmet	ff1ddf5c-a93b-4844-ae92-e24cb15bb8ec
eab57e3b-f913-476c-8f1b-e4a6bc2b9702	\N	632b398e-f044-4a36-bffe-9d10d2641900	0	\N	d847e91a-09b5-4ee3-b846-5c59164b4ab5
eab57e3b-f913-476c-8f1b-e4a6bc2b9702	\N	4f7dcd70-f382-4f7d-ac5e-5bb32677b7e5	1	\N	c4806b34-889e-44c7-8d21-f721454ba9b6
eab57e3b-f913-476c-8f1b-e4a6bc2b9702	\N	5dc836a4-a9a2-4c45-a7f4-0c7e5daf5c11	2	\N	aedc0ec9-eb0e-4a2c-aaf9-0bcbda44b945
f1806bd5-9797-4438-8dd4-e729cb393699	\N	f6571a37-4517-44f5-acfa-ad4ae7f53edc	0	\N	26de9587-4e1b-4907-88cc-0337bf29fa1b
f1806bd5-9797-4438-8dd4-e729cb393699	\N	f2828b48-a1ad-4c6b-93e5-c84e4c9dee1c	1	\N	68e0c48a-fcce-49a7-b868-b434b72d39f7
f1806bd5-9797-4438-8dd4-e729cb393699	\N	ab7ecdc2-28a4-49d9-9476-e6402980d086	2	\N	60c15e89-587b-4efd-be60-2a4c02bfc5de
522d2e28-dbd9-4c98-b89a-ab33f07bec16	\N	9c7cd6f4-c5c6-4e7c-ba86-d9d1960b9bd7	0	\N	07c4c5d7-6f15-4ff6-bbd6-97a23a809473
522d2e28-dbd9-4c98-b89a-ab33f07bec16	\N	fbe760ad-faaf-4e76-9467-343715af4ae3	1	\N	87c56d64-6971-4f85-836c-3f9d5e8a1af9
522d2e28-dbd9-4c98-b89a-ab33f07bec16	\N	50ca7511-e593-4776-8648-1b2721393b09	2	\N	360b687e-db0e-4065-ad55-f83315eba1b5
99c8ff0d-3555-4696-a75d-559b5d6fabd2	\N	ba327720-48d3-4996-a1b3-45aac35a9f0b	0	\N	960cf8e2-f4cd-403d-ad77-e5bacbaa29ea
99c8ff0d-3555-4696-a75d-559b5d6fabd2	\N	7ce90805-925e-40c7-bf20-2e0173005293	1	\N	8952904c-80bc-410e-badd-7c657ba04d66
99c8ff0d-3555-4696-a75d-559b5d6fabd2	\N	fa091e82-82e3-4db4-b96c-4dc1c850bf5e	2	\N	5fcd6862-5ffb-41b6-baf0-a84945521dce
90451247-5362-4647-a491-5d506ca1d6bf	\N	52ad3e5b-3930-4806-84a4-75c1f54c8005	0	\N	553088ce-5a27-4b0c-bdb5-a155933d9e8e
90451247-5362-4647-a491-5d506ca1d6bf	\N	ec86723c-0dd9-4588-87a1-72e61f353e6f	1	\N	169ef00c-0d59-4dd9-9792-a1f71ce72a29
90451247-5362-4647-a491-5d506ca1d6bf	\N	303e6498-e159-4f2a-8006-01af705bd9ac	2	\N	76e499c5-8d5b-4349-b99e-2471464ffd95
7a2c7fb4-2051-460c-af3d-a9718d9d54e7	\N	88b8d360-2696-4f62-a9e8-2c5be22f1d7a	0	\N	e7b5656a-0c36-4b8a-8a26-d33cb467b345
7a2c7fb4-2051-460c-af3d-a9718d9d54e7	\N	16d3295d-3ead-44e4-a094-c5404366a8cb	1	\N	c612aa7c-08ec-4ee8-9197-5930785d0999
7a2c7fb4-2051-460c-af3d-a9718d9d54e7	\N	550696bc-6e33-4787-b7bc-933a5d6e10aa	2	\N	1f68b394-c273-4138-a4b1-bbe1e1d35300
d9ec9e02-1a3d-435d-bbbf-5d22987b9497	\N	84bdd096-d4ea-47c5-80ef-fbb5551ef223	0	\N	e91b6ddc-eadb-414c-857b-92bb09f666b3
d9ec9e02-1a3d-435d-bbbf-5d22987b9497	\N	54361a20-1a27-4a7e-911e-b5a2a10100c8	1	\N	1cbe459c-0dc9-4a7f-bd6e-594302974d2b
d9ec9e02-1a3d-435d-bbbf-5d22987b9497	\N	8fc43509-30a5-43ad-8882-187e75f09f53	2	\N	951f53d9-8e5d-457a-88a3-57af8ca5e1ab
d15e9c58-63f4-4b98-bb51-19b03de55d1e	\N	6133c9e7-799d-4a14-b9c6-8454ca927e76	0	\N	fdc3e636-9b4b-42dd-b75e-890908bf883e
d15e9c58-63f4-4b98-bb51-19b03de55d1e	\N	2b0c77d6-fc61-4383-847e-dfffebe8ba42	1	\N	37c25876-05c9-4765-b294-149624ca461a
d15e9c58-63f4-4b98-bb51-19b03de55d1e	\N	423988d8-13b2-4454-87da-55562b795e7a	2	\N	72ccaa39-618b-4aa9-86ae-1a5f499a587a
\.


--
-- Data for Name: looks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.looks (id, name, slug, description, cover_image_url, is_active, created_by, created_at, updated_at, look_category, look_categories) FROM stdin;
d9e7c521-c894-425a-95f1-ed2d3b3725ff	Dark Rider	dark-rider	Urban dark setup with safety focus.	/uploads/imported/looks/look-dark-rider.jpg	t	\N	2026-03-07 15:42:36.084085+03	2026-03-10 16:16:35.724076+03	Город	{Город}
3c492508-1877-43bd-8b3b-30b5cf11d609	Urban Warrior	urban-warrior	Universal urban riding setup.	/uploads/imported/looks/look-urban-warrior.jpg	t	\N	2026-03-07 15:42:36.084085+03	2026-03-10 16:16:35.724076+03	Город	{Город}
eab57e3b-f913-476c-8f1b-e4a6bc2b9702	Шлемы Look 1	avito-look-1	Собранный образ из импортированных товаров (Шлемы)	/uploads/imported/avito/7704730307/7704730307-1-116083e4dcd3.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
f1806bd5-9797-4438-8dd4-e729cb393699	Куртки Look 2	avito-look-2	Собранный образ из импортированных товаров (Куртки)	/uploads/imported/avito/7960457938/7960457938-1-e514b7890ed1.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
522d2e28-dbd9-4c98-b89a-ab33f07bec16	Куртки Look 3	avito-look-3	Собранный образ из импортированных товаров (Куртки)	/uploads/imported/avito/7608798392/7608798392-1-2f2be234fd01.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
99c8ff0d-3555-4696-a75d-559b5d6fabd2	Перчатки Look 4	avito-look-4	Собранный образ из импортированных товаров (Перчатки)	/uploads/imported/avito/7736258176/7736258176-1-93a2c923f3cb.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
90451247-5362-4647-a491-5d506ca1d6bf	Ботинки Look 5	avito-look-5	Собранный образ из импортированных товаров (Ботинки)	/uploads/imported/avito/7736067660/7736067660-1-3d56416558fb.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
7a2c7fb4-2051-460c-af3d-a9718d9d54e7	Ботинки Look 6	avito-look-6	Собранный образ из импортированных товаров (Ботинки)	/uploads/imported/avito/7704768455/7704768455-1-bcc94d2fdf29.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
d9ec9e02-1a3d-435d-bbbf-5d22987b9497	Аксессуары Look 7	avito-look-7	Собранный образ из импортированных товаров (Аксессуары)	/uploads/imported/avito/7320334642/7320334642-1-c496e1927bb5.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
d15e9c58-63f4-4b98-bb51-19b03de55d1e	Аксессуары Look 8	avito-look-8	Собранный образ из импортированных товаров (Аксессуары)	/uploads/imported/avito/7640778058/7640778058-1-76e91b80c30c.jpg	t	\N	2026-03-10 16:48:10.432188+03	2026-03-10 16:48:10.432188+03	Город	{Город}
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, name, phone, email, message, message_type, status, created_at, updated_at) FROM stdin;
1	папа	956756756	\N	рапра	feedback	new	2026-03-11 03:34:36.425098	2026-03-11 03:34:36.425098
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, template_id, sku_snapshot, title_snapshot, brand_snapshot, category_snapshot, condition_snapshot, qty, unit_price, line_total, created_at) FROM stdin;
d20c3455-4b95-4922-9606-8aced11dd22d	ce09bd44-d3b4-4974-8d8e-9da33c9848f2	de7b6bf7-0fa2-485d-9032-da9a31c65d5a	8b073719-562f-4c29-901c-972bc19881c4	AVITO-7960907134	Мотошлем Shoei GT-Air 2 Tesseract TC-5, S, 2XL	Shoei	Ботинки	new	5	46800.00	234000.00	2026-03-11 00:19:09.115064+03
1e7b7e2e-5b83-4acc-a60e-79b4e6a3de50	88ddf2e9-d5a6-4bb9-b77e-abe39ddfa431	16d3295d-3ead-44e4-a094-c5404366a8cb	4d5f103c-40e7-4915-980e-a412719cd5a0	AVITO-7608101725	Мотошлем Schuberth J2, все размеры	Schuberth	Ботинки	new	1	56800.00	56800.00	2026-03-11 01:37:09.364321+03
1b24f3c8-3da2-4d06-9335-6ebf227bc013	44eda373-d08f-47a2-91b9-7b3abbc77e50	b0ab6d18-be90-4c3c-9989-90ef317c0d7c	46ffe0c7-619f-4b97-9abc-54bfdf07e0c4	MT-AGV-K6S-RED-L-001	AGV K6 S Red L	AGV	Шлемы	new	1	47500.00	47500.00	2026-03-11 01:45:12.512633+03
96c5ab8c-a379-4141-9153-a28e527c7907	44eda373-d08f-47a2-91b9-7b3abbc77e50	5dc836a4-a9a2-4c45-a7f4-0c7e5daf5c11	db21c757-ddfc-42ea-a54e-7d7d0d9f9dab	AVITO-7640685575	Визор и Pinlock AGV K3 GT6-1, размер XS-L, оригина	AGV	Шлемы	new	4	9800.00	39200.00	2026-03-11 01:45:12.512633+03
d75e914e-0872-41e5-bf38-61d153f0cd74	27fd3661-c6a7-4eae-b931-e8e904ce90c4	b0ab6d18-be90-4c3c-9989-90ef317c0d7c	46ffe0c7-619f-4b97-9abc-54bfdf07e0c4	MT-AGV-K6S-RED-L-001	AGV K6 S Red L	AGV	Шлемы	new	1	47500.00	47500.00	2026-03-11 03:54:08.460368+03
3dcc7924-d168-4d9f-8d99-b78982bac97b	27fd3661-c6a7-4eae-b931-e8e904ce90c4	423988d8-13b2-4454-87da-55562b795e7a	2e6bfe24-157b-4e90-ac18-207cfd2b6b3e	AVITO-7960742640	BMW Motorrad Soulor GTX, 42, 43	BMW	Аксессуары	new	1	39800.00	39800.00	2026-03-11 03:54:08.460368+03
359e67ee-e755-4107-ad99-b475ada1ee80	27fd3661-c6a7-4eae-b931-e8e904ce90c4	c13758e7-438a-42e2-b506-9eaa3cd2fd5a	1991fe2b-067b-4b74-8dba-a1d451245a28	AVITO-7960499118	Мотоботинки BMW Motorrad Ginza Sneaker, 42, 43, 44	BMW	Ботинки	new	5	32800.00	164000.00	2026-03-11 03:54:08.460368+03
aae8395a-bcee-4c5f-9b1c-9abe867af244	27fd3661-c6a7-4eae-b931-e8e904ce90c4	5dc836a4-a9a2-4c45-a7f4-0c7e5daf5c11	db21c757-ddfc-42ea-a54e-7d7d0d9f9dab	AVITO-7640685575	Визор и Pinlock AGV K3 GT6-1, размер XS-L, оригина	AGV	Шлемы	new	1	9800.00	9800.00	2026-03-11 03:54:08.460368+03
f3111ac6-2df2-4f25-9f27-1daf85464db7	27fd3661-c6a7-4eae-b931-e8e904ce90c4	4f7dcd70-f382-4f7d-ac5e-5bb32677b7e5	ae2dc7d1-98bf-4f61-a1e6-7c2737ce4605	AVITO-7544361936	Фотохромный визор Shoei CWR-1 на X-Spirit III/NXR	Shoei	Шлемы	new	2	17800.00	35600.00	2026-03-11 03:54:08.460368+03
91bed708-3d21-4c7e-b075-cabebd80c024	27fd3661-c6a7-4eae-b931-e8e904ce90c4	54361a20-1a27-4a7e-911e-b5a2a10100c8	20dba213-9b39-48b2-8ea5-1d2c9068dfdc	AVITO-7960364332	Мотошлем Shoei Neotec 3 Sharpen, под заказ	Shoei	Аксессуары	new	1	74800.00	74800.00	2026-03-11 03:54:08.460368+03
1a84fff5-a79d-45ea-a753-1ba6dc649870	27fd3661-c6a7-4eae-b931-e8e904ce90c4	54361a20-1a27-4a7e-911e-b5a2a10100c8	20dba213-9b39-48b2-8ea5-1d2c9068dfdc	AVITO-7960364332	Мотошлем Shoei Neotec 3 Sharpen, под заказ	Shoei	Аксессуары	new	1	74800.00	74800.00	2026-03-11 03:54:08.460368+03
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_status_history (id, order_id, old_status, new_status, changed_by, note, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, customer_id, status, currency, subtotal, shipping_amount, discount_amount, total_amount, payment_method, payment_status, paid_at, shipping_method, shipping_address, customer_snapshot, comment, created_by, created_at, updated_at, archived, client_ip) FROM stdin;
ce09bd44-d3b4-4974-8d8e-9da33c9848f2	MT-20260311-4580	ad21d1c5-4bff-40f4-8434-371884e782a0	new	RUB	234000.00	0.00	0.00	252720.00	\N	pending	\N	pickup	{"city": "Москва", "phone": "+7 (099) 999-99-99", "region": null, "address": "Самовывоз: г. Москва, ул. Дубининская, д. 22", "full_name": "Иван", "postal_code": null, "delivery_method": "pickup"}	{"email": null, "phone": "+7 (099) 999-99-99", "full_name": "Иван"}	\N	\N	2026-03-11 00:19:09.115064+03	2026-03-11 00:19:09.115064+03	f	\N
88ddf2e9-d5a6-4bb9-b77e-abe39ddfa431	MT-20260311-3000	62c65d1a-e0a6-47b2-813d-45e03816fdef	new	RUB	56800.00	0.00	0.00	61344.00	\N	pending	\N	pickup	{"city": "Москва", "phone": "+7 (777) 777-77-77", "region": null, "address": "Самовывоз: г. Москва, ул. Дубининская, д. 22", "full_name": "Иван", "postal_code": null, "delivery_method": "pickup"}	{"email": null, "phone": "+7 (777) 777-77-77", "full_name": "Иван"}	\N	\N	2026-03-11 01:37:09.364321+03	2026-03-11 01:37:09.364321+03	f	\N
44eda373-d08f-47a2-91b9-7b3abbc77e50	MT-20260311-8286	9ddc5567-dba5-415b-9747-26b52909a0a6	new	RUB	86700.00	0.00	0.00	86700.00	\N	pending	\N	pickup	{"city": "Москва", "phone": "+7 (999) 999-99-99", "region": null, "address": "Самовывоз: г. Москва, ул. Дубининская, д. 22", "full_name": "Иван", "postal_code": null, "delivery_method": "pickup"}	{"email": null, "phone": "+7 (999) 999-99-99", "full_name": "Иван"}	\N	\N	2026-03-11 01:45:12.512633+03	2026-03-11 01:45:12.512633+03	f	\N
27fd3661-c6a7-4eae-b931-e8e904ce90c4	MT-20260311-3107	9f697f81-5ce4-4131-be9d-73ff1f97666c	new	RUB	446300.00	0.00	0.00	446300.00	\N	pending	\N	pickup	{"city": "Москва", "phone": "+7 (676) 777-77-77", "region": null, "address": "Самовывоз: г. Москва, ул. Дубининская, д. 22", "full_name": "Иван", "postal_code": null, "delivery_method": "pickup"}	{"email": null, "phone": "+7 (676) 777-77-77", "full_name": "Иван"}	\N	\N	2026-03-11 03:54:08.460368+03	2026-03-11 03:54:08.460368+03	f	\N
\.


--
-- Data for Name: product_archives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_archives (id, source_product_id, snapshot, reason, deleted_at) FROM stdin;
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_images (id, product_id, image_url, sort_order, is_main, source, created_at) FROM stdin;
dcb0ee30-5de3-41d4-a316-ac675c8d9c5d	7f2c5696-70bd-415e-8203-bcc2f0e8e0b0	/uploads/imported/avito/7863986141/7863986141-1-3c9501ad469d.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
68a6fe87-d1f0-41b1-81b3-05eec1a8c960	6ac39973-6e37-4fd4-8e82-d093efe27b69	/uploads/imported/avito/7864461570/7864461570-1-241284cee4c7.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d7acb24d-70df-4a0c-be54-bfaa01bda6b5	4874cf5d-38af-4df3-a07e-cf8420725b0e	/uploads/imported/avito/7448496323/7448496323-1-fb9361194390.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8c4c0f06-341c-47d3-89b7-1a974df97621	4f7dcd70-f382-4f7d-ac5e-5bb32677b7e5	/uploads/imported/avito/7544361936/7544361936-1-b767fdac7246.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
96e9173a-1c7a-4185-921e-b964fbf99773	09fcca86-53f1-488e-acd8-0a2ecd51cab8	/uploads/imported/avito/7608421278/7608421278-1-6c96fce2c53b.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
72432175-d515-472a-aca0-f3fccef6dc81	b92b6794-895a-4f89-aac2-9d1a005247ab	/uploads/imported/avito/7864273688/7864273688-1-a5a70f688bb4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4a1da22a-93eb-4a0f-9e62-340853c8416b	f2828b48-a1ad-4c6b-93e5-c84e4c9dee1c	/uploads/imported/avito/7864054360/7864054360-1-71bb24f26f48.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3fa3e462-d8f4-4940-95f0-1acfe2dad7b0	7ce90805-925e-40c7-bf20-2e0173005293	/uploads/imported/avito/4473331797/4473331797-1-794cdcaf28d4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5fc45fee-b549-415c-b863-892f54c87d6f	94b382e4-b3c7-4a76-8e26-6023074b02be	/uploads/imported/avito/7544453382/7544453382-1-fe8d810b449c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
84db5ecf-961c-4488-8cc9-795fc00652dd	08461e31-a05f-4bdd-bbe6-98b26096658a	/uploads/imported/avito/7704396758/7704396758-1-477c044fc26a.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6c777e2d-399a-4fa7-b313-00c46cbc9edd	97a94449-9690-4b57-a646-0834090bd9ed	/uploads/imported/avito/7704797542/7704797542-1-d26b2ede3536.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3947b6f7-84b9-4d75-9b36-ffb8f0257e9a	4e8b7014-85cd-439d-b370-23652cde1ec2	/uploads/imported/avito/7704901896/7704901896-1-99d2efa38e04.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
081a081f-7482-4c44-a705-2f4d12b0c16f	10ad38c4-c565-442b-b709-774781c4daf0	/uploads/imported/avito/7863942280/7863942280-1-896434d5cece.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4c15cfe7-c3d3-458d-8891-118eeb5ca22e	34174d30-8d5c-4244-b0a4-b1fff0676c91	/uploads/imported/avito/7863945378/7863945378-1-14904ae91212.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
43a9a705-4c39-4c17-bc15-0d81ffe0ccf2	dca855ca-8e5e-4816-a9dd-e0e779bec83a	/uploads/imported/avito/7864136477/7864136477-1-ddacb84d967d.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8bbe634f-05be-412d-9ebc-155d18ac566c	fa091e82-82e3-4db4-b96c-4dc1c850bf5e	/uploads/imported/avito/7864407855/7864407855-1-e819d218db42.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ccef26f9-43a2-42be-b9ba-a757811b8803	6a686e80-a096-4ec7-ac49-97021b416cb2	/uploads/imported/avito/7864416598/7864416598-1-a975c2ac761c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1424121f-03f9-42c1-8582-9ee897c78a20	6422131e-761f-4224-9481-ba5b23ef2021	/uploads/imported/avito/7864747181/7864747181-1-16199e10e8a0.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
bdf390e1-bcae-4e74-ac9a-c5097828459c	099c94c3-94a3-47e2-8d43-d5ef811e04de	/uploads/imported/avito/7864913050/7864913050-1-3550f95556c0.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d54c8926-0534-44b6-a790-3c5eaebabd4c	f57775b1-72b2-43b9-85fc-c9e14ffc24e3	/uploads/imported/avito/4664489546/4664489546-1-08fb4022ed88.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
2176a003-aceb-49e2-bd6b-c1e99ba45a02	ab7ecdc2-28a4-49d9-9476-e6402980d086	/uploads/imported/avito/7480889427/7480889427-1-04417423ab0a.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7c66181c-7899-48e5-a3ca-04fd21a57fe7	ec86723c-0dd9-4588-87a1-72e61f353e6f	/uploads/imported/avito/7544068246/7544068246-1-08387cdb6d29.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
053903f3-d810-4a3f-a511-4fa15ca5e7d6	4774f0d3-e98e-47ea-b4cf-8a305e4763bc	/uploads/imported/avito/7863934628/7863934628-1-fae41f042dc9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7406e469-faea-4d70-963d-797867c4c6f9	6133c9e7-799d-4a14-b9c6-8454ca927e76	/uploads/imported/avito/7640778058/7640778058-1-76e91b80c30c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
18b97f2e-1289-4d37-864c-690e3516ce1e	16d3295d-3ead-44e4-a094-c5404366a8cb	/uploads/imported/avito/7608101725/7608101725-1-c9a784b0565f.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
e0d472e7-8882-4842-88ef-c91a226ce78c	bac74040-d97d-4641-9017-004aa426679f	/uploads/imported/avito/7864065607/7864065607-1-3c38193f377e.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b3d26caf-dea9-4740-9155-ad9dcbf0aff2	f9e4f491-66cf-421d-b2ea-d4d1605d0f44	/uploads/imported/avito/7864252625/7864252625-1-b4cbda8b97d1.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
56e8e1e9-360d-4310-ba13-0df978cd364a	8fc43509-30a5-43ad-8882-187e75f09f53	/uploads/imported/avito/7736588848/7736588848-1-af583bb431f8.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
a249085b-b224-417f-8777-7e2231e58ccf	550696bc-6e33-4787-b7bc-933a5d6e10aa	/uploads/imported/avito/7864101220/7864101220-1-5779dbffe4f8.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f3b54218-fb58-4c7f-91b8-2163f141f1aa	df1cdace-d172-4d73-a392-2d0fc0ef4f10	/uploads/imported/avito/7864466629/7864466629-1-cb65ef161f41.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
20810923-08b6-4210-a6c6-bcb3a12e0017	10bc01bd-1919-433e-8947-635685bacca3	/uploads/imported/avito/7864502540/7864502540-1-fd0912c26e58.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c2782a6f-af09-4792-8c70-187799529d91	68018010-001c-42d8-a2da-d9388de51449	/uploads/imported/avito/7320336373/7320336373-1-92f35e7c7047.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
956e7b90-c0fc-4404-82ca-9ac3a3eedc9d	d873f2d6-8eb1-46b0-8647-286cb5239c08	/uploads/imported/avito/7608520369/7608520369-1-55c5c95da450.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8bf1ebba-e977-4de4-9c29-bdd37ed78520	0ba32bc3-cec0-4457-b8e2-375bd1868e0d	/uploads/imported/avito/7672147000/7672147000-1-7ca06ca57160.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6d50690f-695f-45d3-b5e8-54c79715ea90	805dfef2-daeb-4140-966a-015bde913f5d	/uploads/imported/avito/7672670790/7672670790-1-3c4a3f9375db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b8636469-188e-4c06-84f5-3e7ea22c0afd	6025023d-a89f-4202-bad7-c8a31b7b79e7	/uploads/imported/avito/7800818731/7800818731-1-db14304a3f98.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
67a96c66-15e4-4164-ae50-2a0cb236729b	451617b3-8343-44d6-8fa5-d5ae5ead8e1d	/uploads/imported/avito/7928019018/7928019018-1-f58b40a66504.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d459502c-0e66-43f1-a873-5641d62aa113	303e6498-e159-4f2a-8006-01af705bd9ac	/uploads/imported/avito/7544725927/7544725927-1-b44cb28508e1.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f5da80df-0df0-4582-b37b-f27e379008bd	2b0c77d6-fc61-4383-847e-dfffebe8ba42	/uploads/imported/avito/7672297983/7672297983-1-d0a9c9cb37dc.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7e75dcc0-97ba-4a80-80ad-d25aa011da17	78f81cec-4e98-4979-90e5-65805a955ba9	/uploads/imported/avito/7736349737/7736349737-1-87e9496e7ea6.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c3914bf7-6e2f-4239-9eb9-2295a4b3b819	13bc48bc-fdbf-4bf0-af9e-078ceed25309	/uploads/imported/avito/4632740420/4632740420-1-84c17b909b53.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c804c4c5-d7bf-4318-b388-fda1fe974eff	aca7f310-d9e6-4038-a133-24400984645e	/uploads/imported/avito/7704176875/7704176875-1-6ce55a6b6cc7.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
00532bcd-280d-4aff-845a-2332932e1ef8	4a7bb41f-6287-4baa-ae97-7f98c844ca86	/uploads/imported/avito/7512205252/7512205252-1-ea5a626d62b9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7256a4f6-e7d6-4f6d-96ae-073d62e0ec2a	d4953b56-6724-45c4-b5e6-38f72179c3ac	/uploads/imported/avito/7512781280/7512781280-1-b36de0a64e43.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b537fac7-d440-450e-90fe-f6c61481f264	bcea8f74-56dd-4682-a11e-647be25b33ce	/uploads/imported/avito/7544624011/7544624011-1-f05a2c6db016.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3a2d0b4b-f1b2-41fc-b921-5083b17e738c	9cdde859-b3d8-4b2b-b6b2-afcbf881f568	/uploads/imported/avito/7544755600/7544755600-1-9ed321e6845c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
509673a3-2469-4ded-b91b-c143e24767bf	52ad3e5b-3930-4806-84a4-75c1f54c8005	/uploads/imported/avito/7736067660/7736067660-1-3d56416558fb.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8dca3844-d541-42d4-9095-11e7e5036647	ba327720-48d3-4996-a1b3-45aac35a9f0b	/uploads/imported/avito/7736258176/7736258176-1-93a2c923f3cb.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
a1590696-a7d7-4021-884e-8f8fd0f14a69	943c67b6-23ee-44af-a5bf-1a6a86a03b57	/uploads/imported/avito/7512214475/7512214475-1-a77766fe2db9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b1972dde-46f4-4c02-8062-61fa7f0bec08	5dc836a4-a9a2-4c45-a7f4-0c7e5daf5c11	/uploads/imported/avito/7640685575/7640685575-1-df8302cb4189.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3419611e-e3f7-402f-9f3b-baf36050dd87	c21d6ba4-3d58-446e-8bb2-1f45f70ca9f2	/uploads/imported/avito/7736830684/7736830684-1-25445c030c2f.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6aed5501-79f0-4bc3-9a7c-c81ce79751b9	32590089-2833-4a30-8a5f-a370c52b406d	/uploads/imported/avito/7672007868/7672007868-1-b6b2f93d1353.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9d606e02-4e6a-4e46-8424-d10c5c5e79f8	faabc688-e735-48c0-b0e9-9382adc5f3b8	/uploads/imported/avito/4537431286/4537431286-1-750a741a4937.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4ca27524-c810-4d60-860d-1e20e09c2a5f	ea01403a-1c86-4918-8306-dfa3a092f6ff	/uploads/imported/avito/7768422676/7768422676-1-79472c561541.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f1c786e5-e8e1-48d1-8b20-2fd90886e7e8	56405cfe-62df-43e3-9fcc-1e1b8567edcb	/uploads/imported/avito/7320173682/7320173682-1-7158a677f6e0.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c60c161b-c7e3-4051-9f94-80e936d875d7	84bdd096-d4ea-47c5-80ef-fbb5551ef223	/uploads/imported/avito/7320334642/7320334642-1-c496e1927bb5.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1988a78b-9a22-49b6-ac97-fb5a5d917302	1b86cf75-ddb1-4ad9-ac56-ffb1592968a4	/uploads/imported/avito/7320538670/7320538670-1-3a63177be9db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9d4791a7-4d3a-4a25-9767-cac75b2da2bc	9e0f49b4-bcb1-44b8-951e-b985d2247d5b	/uploads/imported/avito/7352095298/7352095298-1-4b59a09e2fe7.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d729bb63-2677-4838-9712-b82f7c49bba0	8724dd1f-8b77-4dde-b828-1654f947ef5d	/uploads/imported/avito/7352220119/7352220119-1-73e6959e3259.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
e46bb43b-78fb-4b21-a0a5-3b9e70080c21	41b64525-95e7-4a23-b65b-3266d45f308a	/uploads/imported/avito/7384018177/7384018177-1-193989cac34b.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
723ebac1-7744-4b77-a767-d008645c2a16	7343b8f6-90c8-465d-8f11-46ae7f02625d	/uploads/imported/avito/7704124165/7704124165-1-1e943d49dd1c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b30f9756-5907-4b8d-a632-4124fda0f990	84ac3134-fd2d-45d0-93fb-4e403e04461c	/uploads/imported/avito/7704307642/7704307642-1-576fb538ac62.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4cfd1adf-cd0d-4bcc-8b1c-815e33b2a5a6	1ebd696e-dda3-4263-8c5c-42e34f65e55a	/uploads/imported/avito/7704345074/7704345074-1-7011250beb8e.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ced718c6-b10f-4301-a11b-9436261bd604	3c1e1a31-a2f0-42b0-81d9-dadc4be4ac5c	/uploads/imported/avito/7704370492/7704370492-1-6957f619d9d5.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
cb582f84-a94e-4737-8067-9efa99e7c7ea	49f25d0b-d106-40f3-9c92-6d5dfdc3f782	/uploads/imported/avito/7704413276/7704413276-1-e68a0329eb48.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
fece97bb-6e09-4a62-903d-98759bc8d312	817712f9-59cc-4cdd-9f31-7f2d0522d0b8	/uploads/imported/avito/7704416305/7704416305-1-c1e9c765a93b.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
e8983c21-bb6c-43bf-84cc-dd26e784b4ff	632b398e-f044-4a36-bffe-9d10d2641900	/uploads/imported/avito/7704730307/7704730307-1-116083e4dcd3.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
220890ee-5b3b-4b06-bd2e-c9a83448e274	88b8d360-2696-4f62-a9e8-2c5be22f1d7a	/uploads/imported/avito/7704768455/7704768455-1-bcc94d2fdf29.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
acfc2d84-ebad-4d4b-a13e-79e053f2fe5f	1c3f350d-b965-42b0-83fd-6b38bd0a6789	/uploads/imported/avito/7736754113/7736754113-1-acf6d8659014.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4b5ab08b-28d5-424f-b5af-2771138cb506	3c8790d0-8e36-4d1a-8daf-4e9198c0e268	/uploads/imported/avito/7768033759/7768033759-1-3d884041e8d9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ea2c462c-b132-4590-b5ec-e7516c220b61	9c7cd6f4-c5c6-4e7c-ba86-d9d1960b9bd7	/uploads/imported/avito/7608798392/7608798392-1-2f2be234fd01.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b3fff3cd-1bff-4097-8633-fff20de70d0d	a47d5b69-3f55-4659-aeb8-04d02ca0a81d	/uploads/imported/avito/7640131998/7640131998-1-401b7731cd55.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1fe7ec3d-78d5-4787-84c5-0392e1703a03	d035bc81-a7e7-4101-97fc-9212b814788b	/uploads/imported/avito/7448184351/7448184351-1-9f011e90c2fd.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
42cc7370-3581-4332-b83f-0a68b413d0af	83468281-ba60-44c4-9d9e-e8e8d2c82d39	/uploads/imported/avito/7448566160/7448566160-1-823f6d19dc56.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
a0cdf2b7-5add-4aa1-8b2d-b1ecf8d736e2	c3a1a2e2-eed2-422c-9e90-7dbd5e104587	/uploads/imported/avito/7448586310/7448586310-1-eee99047488e.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
dbaffe74-f366-4723-8f4b-87de005439c5	747c8b72-8b76-441d-9848-1338d9a3a105	/uploads/imported/avito/7512174969/7512174969-1-b60177a3aa38.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
44ca960b-acd7-4c89-9751-2d864b6ca037	1bca3b57-26d6-4d93-ad61-889d235d53a1	/uploads/imported/avito/7544181655/7544181655-1-81bfa872c6db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4db3eaff-267d-40d4-8d6f-b12e0de49857	4628194b-4a19-430c-b96e-1c17b90a32b7	/uploads/imported/avito/7544833478/7544833478-1-9768f0453763.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
55b4cd4a-59b4-4f66-925e-6db20a3907ec	a438d7c2-332b-43b7-ade4-7b9769e53407	/uploads/imported/avito/7608031301/7608031301-1-92aec162ebd9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
836098e8-b5d7-4f0d-995f-ba3fc0c401a6	7900489b-ef86-42c0-b9bc-688aa76f7e1c	/uploads/imported/avito/7608404013/7608404013-1-698fe2201d5f.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8a208b16-1d57-4a98-b99c-0e0ad95031e3	03cfe7b3-6a95-4063-bb95-afeb24af5866	/uploads/imported/avito/7608679589/7608679589-1-24d2486139ac.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ea79a838-f095-460f-acf2-c18a241eb27e	76bed372-a0b9-48d6-94c6-8a0c343e991c	/uploads/imported/avito/7640660738/7640660738-1-e7db86fca5e4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1dbd3ca7-f895-42f8-a3b2-431cea812141	3dc4190e-a41d-49cd-88de-363ea8da0568	/uploads/imported/avito/7672506758/7672506758-1-cfe2c8da76a2.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5382e2b4-ce04-40cf-ae86-3e6c7b45b4b3	0948061c-1030-4da9-8f38-714167c908f1	/uploads/imported/avito/7703966270/7703966270-1-30727351fd2c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
2842e5fd-3a50-42dc-9ea9-a1c721979cf9	1cdaceb6-21ee-4445-a53c-522a2e208b5e	/uploads/imported/avito/7736502568/7736502568-1-fa268bcaf297.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
e68a8d08-6a71-41bd-9436-3105031289f5	40c5e931-37eb-46a8-9588-b1f20765de5e	/uploads/imported/avito/7736543866/7736543866-1-b55d42cf3573.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7a8a5ef8-95c7-483d-af4c-bfbfef9e8a63	847d18e5-ffea-412e-8d67-da230ef98679	/uploads/imported/avito/7736617671/7736617671-1-5f9815e8a450.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ec80eabc-f8d7-4b8c-a9ec-838bd2f7749d	fe67f84b-9d6c-4f93-8a52-5905b1f8d9d1	/uploads/imported/avito/7544068978/7544068978-1-16d8ad62b4ee.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ea8285b8-31fe-4fda-8a66-baab94a5c765	0ad99c61-0a92-48bb-ba1f-a7ff03051404	/uploads/imported/avito/4472548492/4472548492-1-a6c77a8e9970.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
de62cca2-ea9a-4d40-a09e-bd7abe357f57	38e5df8e-128d-46ba-88bb-16e470adf01d	/uploads/imported/avito/7928131471/7928131471-1-0501986bcbdf.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8ad9ae45-12d2-495a-85ff-16e012be6178	799895d5-b8c4-44c7-8182-b2177048ce40	/uploads/imported/avito/7928660461/7928660461-1-57f6b20088c6.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
bfb91903-f9c8-4daa-bdc4-e7dd53d49d00	56d1cf89-2d91-4a9c-9173-879804f72c66	/uploads/imported/avito/7928827958/7928827958-1-dabf709131de.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
dd333b5b-e607-49c3-b3dc-e5fbedf531fa	fbe760ad-faaf-4e76-9467-343715af4ae3	/uploads/imported/avito/7928106347/7928106347-1-56de2eec60ab.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5ddf1fc2-0d24-4458-81f1-332c4077b012	7bb08243-eb55-4dbf-9da0-e376a65dca9d	/uploads/imported/avito/7928535833/7928535833-1-274a65500d82.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7177c74d-b6bf-4063-af6d-7c21f9a77391	3350ec81-a652-4996-a806-505c7e6d9d3a	/uploads/imported/avito/7928223307/7928223307-1-21a42ecc9962.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d6f59912-a41b-451b-b253-c1558105ce4f	36d905d5-a12d-4935-bc80-c2e58e2d607d	/uploads/imported/avito/7928697980/7928697980-1-37de629abc34.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0301dd7d-0ea1-4071-8184-f5155ff0e023	6fb5e1ed-78b8-4471-a204-80b7e9efd4af	/uploads/imported/avito/7640719968/7640719968-1-2aab8e83ba06.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1e102eb8-83cf-49aa-8076-43049378d3ce	9c484644-ee8b-4e48-8c8b-dffb81a58f15	/uploads/imported/avito/7672381094/7672381094-1-81d5af0f10db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9f8e9fd0-5dfb-41f1-825a-5b3c77f8bde9	76d01878-0ff4-499c-81f7-b3c7624aace8	/uploads/imported/avito/7672566789/7672566789-1-c43a505801ca.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6c70da31-277c-42c0-ad05-5acbf5a4e906	54361a20-1a27-4a7e-911e-b5a2a10100c8	/uploads/imported/avito/7960364332/7960364332-1-133deaa30c81.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
25c22610-1895-4f63-aad7-e4a9c52ee5ba	c13758e7-438a-42e2-b506-9eaa3cd2fd5a	/uploads/imported/avito/7960499118/7960499118-1-e1fbc1ab323c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0afc2445-4b05-4989-945c-56512355a230	836aae86-26ec-478e-ae96-7bf6cb7b1e79	/uploads/imported/avito/7959942347/7959942347-1-3eee8c31bfd2.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
01bd8775-a4dd-40bd-9546-66b94498ff40	33900540-acce-46d3-ae99-94eccf6aac17	/uploads/imported/avito/7960092751/7960092751-1-7d97d3642f25.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9c03766e-66cc-4b13-9b9e-3a6ad66a920e	423988d8-13b2-4454-87da-55562b795e7a	/uploads/imported/avito/7960742640/7960742640-1-c6f8197e61a2.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
68f825c7-f372-46c0-ba7c-28306c1636b2	f6571a37-4517-44f5-acfa-ad4ae7f53edc	/uploads/imported/avito/7960457938/7960457938-1-e514b7890ed1.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
532fbd54-486e-4a5d-af55-a39c53f8517f	65882d28-e141-4f53-b867-799decee9349	/uploads/imported/avito/7960603553/7960603553-1-8e727866400c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b4c7ad87-b0d3-410d-ba75-8ba70f919196	50ca7511-e593-4776-8648-1b2721393b09	/uploads/imported/avito/7960878613/7960878613-1-3f137679b7b4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b70b7f7f-9961-43c0-8374-15752f4173d4	de7b6bf7-0fa2-485d-9032-da9a31c65d5a	/uploads/imported/avito/7960907134/7960907134-1-fd52b30c97e9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
\.


--
-- Data for Name: product_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_templates (id, brand_id, category_id, model_name, model_key, base_title, description, default_specs, ai_description, is_active, created_by, created_at, updated_at) FROM stdin;
8b5fe852-04a7-4348-9ed9-af1c1eee7ce2	0de06905-2b5b-4470-be7b-98a2a56b3878	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	Shoei RF-1400	shoei-rf-1400	Shoei RF-1400	Premium full-face helmet for city and highway.	{"type": "integral", "material": "AIM+", "certification": "ECE"}	\N	t	\N	2026-03-07 15:42:23.394357+03	2026-03-07 15:42:23.394357+03
46ffe0c7-619f-4b97-9abc-54bfdf07e0c4	2c6f0ca0-8afc-42ec-8053-abce4ad70679	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	AGV K6 S	agv-k6-s	AGV K6 S	Light sport-touring helmet.	{"type": "integral", "weight": "~1250g", "certification": "ECE 22.06"}	\N	t	\N	2026-03-07 15:42:23.394357+03	2026-03-07 15:42:23.394357+03
07e33a5a-4e7a-4206-ad02-6ca97d84a14b	ba66677c-51f8-45ea-9ab8-264b87cd680e	f360e60d-0543-47dd-8e35-913069eb87a1	Alpinestars Halo Drystar	alpinestars-halo-drystar	Alpinestars Halo Drystar	Protective moto shirt/jacket for urban riding.	{"type": "moto-shirt", "season": "mid-season", "protection": "elbows/shoulders"}	\N	t	\N	2026-03-07 15:42:23.394357+03	2026-03-07 15:42:23.394357+03
3f9d7bcf-94a0-41f4-9379-8ef61603a02a	36ba239a-e064-4dc9-a3b3-3aa72728e531	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	TCX Street 3	tcx-street-3	TCX Street 3	Urban riding boots for daily use.	{"type": "urban", "material": "leather", "protection": "ankle"}	\N	t	\N	2026-03-07 15:42:23.394357+03	2026-03-07 15:42:23.394357+03
e6b4f7d5-2681-41a4-b652-b4acef191075	528474cd-fc75-46a1-a416-cccc4446c4d5	996aad3a-b88b-4264-b999-ed42ac852b86	Cardo Packtalk Edge	cardo-packtalk-edge	Cardo Packtalk Edge	Premium helmet intercom.	{"mesh": "yes", "type": "intercom", "bluetooth": "5.x"}	\N	t	\N	2026-03-07 15:42:23.394357+03	2026-03-07 15:42:23.394357+03
d7a508e6-2260-4517-ae90-74430305f032	2dad1445-3f4f-43eb-a892-6397d581d046	996aad3a-b88b-4264-b999-ed42ac852b86	Мотошлем Icon Airframe Pro Construct, 2XL (60-62)	avito-7448496323	Мотошлем Icon Airframe Pro Construct, 2XL (60-62)	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Icon", "source": "avito", "avitoId": 7448496323, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
bce676f0-5180-48e9-85fe-ea64ab8c27b7	d72faae9-6c39-4692-8ad0-2f0978c338ea	996aad3a-b88b-4264-b999-ed42ac852b86	k1	k1	123 k1	\N	{}	\N	t	\N	2026-03-09 03:23:58.526239+03	2026-03-09 03:23:58.526239+03
a98fdb6f-c056-450b-b6ba-19e5d5125f27	2c6f0ca0-8afc-42ec-8053-abce4ad70679	996aad3a-b88b-4264-b999-ed42ac852b86	СуперПушка	superpushka	СуперПушка	\N	{}	\N	t	\N	2026-03-09 03:29:10.906164+03	2026-03-09 03:29:10.906164+03
ae2dc7d1-98bf-4f61-a1e6-7c2737ce4605	0de06905-2b5b-4470-be7b-98a2a56b3878	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	Фотохромный визор Shoei CWR-1 на X-Spirit III/NXR	avito-7544361936	Фотохромный визор Shoei CWR-1 на X-Spirit III/NXR	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Shoei", "source": "avito", "avitoId": 7544361936, "category": "Шлемы"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
71a17ec9-7860-44b6-ba63-ea119a06ce6c	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad Rallye, 54/56	avito-7608421278	Мотокуртка BMW Motorrad Rallye, 54/56	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7608421278, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
149fd703-b963-4d68-9052-1b9362d790da	0a1adb23-d14c-43cf-b6ff-4024d1003d3c	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм летний Spidi Air, 56/58	avito-7864273688	Мотокостюм летний Spidi Air, 56/58	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "Spidi", "source": "avito", "avitoId": 7864273688, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
de628ac6-aee8-4daf-9dc6-4edc218344c2	0a1adb23-d14c-43cf-b6ff-4024d1003d3c	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм Spidi 4 Seasons v3 H2Out Lady, 44/46	avito-7864054360	Мотокостюм Spidi 4 Seasons v3 H2Out Lady, 44/46	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "Spidi", "source": "avito", "avitoId": 7864054360, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
6534ef00-09e0-4dd8-b05e-c680486382cd	ba66677c-51f8-45ea-9ab8-264b87cd680e	2616dcf4-5603-4979-bf1b-d83c02cee6a3	Мотоперчатки Alpinestars GP-Tech, XL и 3XL	avito-4473331797	Мотоперчатки Alpinestars GP-Tech, XL и 3XL	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nПрофессиональный подбор экипировки под Ваши задачи и мотоцикл.\n\nВесь ассортимент представлен в шоуруме в Москве и наших пабликах Mototom_ club (ссылки пришлем по запр...	{"brand": "Alpinestars", "source": "avito", "avitoId": 4473331797, "category": "Перчатки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
19dd5042-79b7-4e7e-9172-ac0224394a5f	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Alpinestars Monteira Drystar, 50/52	avito-7544453382	Мотокуртка Alpinestars Monteira Drystar, 50/52	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7544453382, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
fcaf622c-debc-4519-a469-13e8f508cbdd	8f57393e-72c8-4ba8-b8aa-7b7e1128dffe	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны Revit Eclipce Air, 46/48	avito-7704396758	Мотоштаны Revit Eclipce Air, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "REV'IT!", "source": "avito", "avitoId": 7704396758, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
8b258d7d-3410-43af-be57-a87d707941aa	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	Термо белье BMW Motorrad Skin ST, 50/52	avito-7704797542	Термо белье BMW Motorrad Skin ST, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7704797542, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
cf06f2d1-cf59-4645-9dd3-18b7ce594eb1	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Утепленная термокуртка BMW Motorrad Stepp, 40/42	avito-7704901896	Утепленная термокуртка BMW Motorrad Stepp, 40/42	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7704901896, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
5d7a853e-f904-4476-a4db-b49d9cab796c	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны Bmw Motorrad Rallye comp, 50/52	avito-7863942280	Мотоштаны Bmw Motorrad Rallye comp, 50/52	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "BMW", "source": "avito", "avitoId": 7863942280, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
57c96127-2d6e-4046-80ef-790f3f43f3d1	8f57393e-72c8-4ba8-b8aa-7b7e1128dffe	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка туринговая Revit Sand, 42/44	avito-7863945378	Мотокуртка туринговая Revit Sand, 42/44	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "REV'IT!", "source": "avito", "avitoId": 7863945378, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
e23c37c4-bf8a-4fd8-9b5c-57ce92c46765	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei X-Spirit 3 KTM, L (58-59 см)	avito-7864136477	Мотошлем Shoei X-Spirit 3 KTM, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7864136477, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
5b78f337-e4d5-476a-99f5-10446881d4d0	ba66677c-51f8-45ea-9ab8-264b87cd680e	2616dcf4-5603-4979-bf1b-d83c02cee6a3	Мотоперчатки Alpinestars SMX-1 Air V2, M/9	avito-7864407855	Мотоперчатки Alpinestars SMX-1 Air V2, M/9	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7864407855, "category": "Перчатки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
63b9f46a-1c8d-42a9-8ab3-7f8a6cf367c7	5fbac148-1d5b-4c7c-874b-af626e2c9ecc	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботинки LS2 Zoe Men, 39/40	avito-7864416598	Мотоботинки LS2 Zoe Men, 39/40	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "LS2", "source": "avito", "avitoId": 7864416598, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
ea7adf5e-caa7-4a3f-a451-e4493dc40955	5fbac148-1d5b-4c7c-874b-af626e2c9ecc	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	avito-7864747181	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "LS2", "source": "avito", "avitoId": 7864747181, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
7e5000d8-eaae-489d-a170-b380f5d50f1f	da6e21bb-3947-4d75-a8fc-b3e21e48dee7	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка RST Isle of Men TT, 48/50	avito-7864913050	Мотокуртка RST Isle of Men TT, 48/50	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "RST", "source": "avito", "avitoId": 7864913050, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
87bf6089-0d89-4c6e-a1e3-d7be3c195459	528474cd-fc75-46a1-a416-cccc4446c4d5	996aad3a-b88b-4264-b999-ed42ac852b86	Установочный комплект Cardo Packtalk Edge, оригина	avito-4664489546	Установочный комплект Cardo Packtalk Edge, оригина	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зaчeт пpи покупке н...	{"brand": "Cardo", "source": "avito", "avitoId": 4664489546, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
025548d5-4d92-4d6e-ae1b-f9946c42d518	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм BMW Motorrad GS Rallye Air 2025, 48/50	avito-7480889427	Мотокостюм BMW Motorrad GS Rallye Air 2025, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7480889427, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
5fd1e3a9-2a79-4aca-b542-220b8de3798a	accd4a21-d05b-421a-8d92-d7da0d6933fc	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем HJC rpha 12 quartararo, L (58-59 см)	avito-7544068246	Мотошлем HJC rpha 12 quartararo, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "HJC", "source": "avito", "avitoId": 7544068246, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
6e186d2e-ff7d-4fdd-9fe8-b97a5a9df966	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei EX-Zero Equation, L (59-60 см)	avito-7863934628	Мотошлем Shoei EX-Zero Equation, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7863934628, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
ce72ec2a-4d2c-4679-a20d-e5c9ff8d3a74	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	Защитные дуги Touratech для BMW для R 1300 GS/ADV	avito-7640778058	Защитные дуги Touratech для BMW для R 1300 GS/ADV	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "BMW", "source": "avito", "avitoId": 7640778058, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
4d5f103c-40e7-4915-980e-a412719cd5a0	3e6b1335-c12a-48fe-ab01-5103949b1f46	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Schuberth J2, все размеры	avito-7608101725	Мотошлем Schuberth J2, все размеры	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Schuberth", "source": "avito", "avitoId": 7608101725, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
84686881-c03d-4620-bd77-5f006a8f52c2	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Alpinestars Motegi Perf., 46/48	avito-7864065607	Мотокуртка Alpinestars Motegi Perf., 46/48	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7864065607, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
71f9b076-07de-4b9f-a725-0c0fc0747770	ba66677c-51f8-45ea-9ab8-264b87cd680e	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботы Alpinestars SMX-6 V2 Drystar, 43/44	avito-7864252625	Мотоботы Alpinestars SMX-6 V2 Drystar, 43/44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7864252625, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
b954b6b1-fb7c-44c8-b659-5d3ae2334567	820c692f-3a71-4f22-bb39-8440616d6c5a	996aad3a-b88b-4264-b999-ed42ac852b86	Боковые кофры/крепеж на Yamaha Tracer 9 GT/GT+	avito-7736588848	Боковые кофры/крепеж на Yamaha Tracer 9 GT/GT+	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Yamaha", "source": "avito", "avitoId": 7736588848, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
778189bf-0b0d-49a0-a072-9303a927fb43	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei Hornet ADV Invigorate, L (58-59 см)	avito-7864101220	Мотошлем Shoei Hornet ADV Invigorate, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7864101220, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
f49122f7-3734-4c3a-96ba-b1947a4552ca	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei Neotec 2 Matt Black, M (56-57 см)	avito-7864466629	Мотошлем Shoei Neotec 2 Matt Black, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7864466629, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
76baeed6-b9c0-4c40-9967-f0aa34a05329	2094ec9b-bbd2-463f-808a-0617894fa3ef	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Triumph Leith Khaki, 48/50	avito-7864502540	Мотокуртка Triumph Leith Khaki, 48/50	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "Triumph", "source": "avito", "avitoId": 7864502540, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
c299af0d-9a79-438f-a197-388256e03940	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм Dainese Laguna Seca D1 Perf., 52/54	avito-7320336373	Мотокостюм Dainese Laguna Seca D1 Perf., 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7320336373, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
325f3f7e-8c58-4d72-95c7-a85be087cb73	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Dainese Agile, 46/48	avito-7608520369	Мотокуртка Dainese Agile, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7608520369, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
2e8abc01-d04b-4d60-a3b9-7718cf4cd88a	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Dainese Agile, 46/48 и 48/50	avito-7672147000	Мотокуртка Dainese Agile, 46/48 и 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7672147000, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
2b45e4f8-b581-4023-be95-ce1e75b4fc2a	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм Dainese Mig Tex Suit, 48/50	avito-7672670790	Мотокостюм Dainese Mig Tex Suit, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7672670790, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
325dc02c-1649-4172-a9b5-893feeeabd2f	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	Мотокеды BMW Motorrad Seoul GTX, все размеры	avito-7800818731	Мотокеды BMW Motorrad Seoul GTX, все размеры	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7800818731, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
de77c51a-c013-4e43-903b-75441d26d607	99a62bed-b8fb-4452-a059-b2156dc3b449	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shark Skwal I30 Hellcat, L (59-60 см)	avito-7928019018	Мотошлем Shark Skwal I30 Hellcat, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shark", "source": "avito", "avitoId": 7928019018, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
a07a0919-887c-4057-b5b3-905b936653a1	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei X-Spirit Pro, 2XL (63-64 см)	avito-7544725927	Мотошлем Shoei X-Spirit Pro, 2XL (63-64 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7544725927, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
0f33f3a9-6ceb-40c3-82c7-17a9b04d4d67	950e2b15-ac4d-4c0f-8a5f-f4c76f6c572a	996aad3a-b88b-4264-b999-ed42ac852b86	Кофры Rugged leather bag set, оригинал	avito-7672297983	Кофры Rugged leather bag set, оригинал	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Rugged", "source": "avito", "avitoId": 7672297983, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
17fdfdba-6df9-440d-b590-3c3096bdc5ed	2094ec9b-bbd2-463f-808a-0617894fa3ef	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Triumph Braddan Sport, 50/52	avito-7736349737	Мотокуртка Triumph Braddan Sport, 50/52	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Triumph", "source": "avito", "avitoId": 7736349737, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
43cc4520-3b2f-4bf5-9c8e-c45f34953b43	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Ducati Speed EVO C1 Alpinestars, 46/48	avito-4632740420	Мотокуртка Ducati Speed EVO C1 Alpinestars, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Alpinestars", "source": "avito", "avitoId": 4632740420, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
02c5203f-ddcd-4710-99f9-d8ed50480785	b17da17b-94ed-4e7b-8abd-66343eec2c3a	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Дождевик Proof, 44/46	avito-7704176875	Дождевик Proof, 44/46	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Proof", "source": "avito", "avitoId": 7704176875, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
0ea76a0d-4aa4-48cf-b9fe-84bce5e5b79e	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны Alpinestar Stella Courmayeur GTX, 46/48	avito-7512205252	Мотоштаны Alpinestar Stella Courmayeur GTX, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7512205252, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
a9983f68-73bf-4d3d-ac7e-dfc91cb39e9d	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	Мотокеды Bmw Motorrad Seoul GTX, 42/43	avito-7512781280	Мотокеды Bmw Motorrad Seoul GTX, 42/43	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7512781280, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
20304a36-e0fd-4236-8a80-845e2cc83ed7	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad Swartberg Air, 46-56	avito-7544624011	Мотокуртка BMW Motorrad Swartberg Air, 46-56	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7544624011, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
9cffadd3-fb41-4835-a01f-dff2468bd4ac	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботы BMW Motorrad Gotthard GTX, 42/43 и 44/45	avito-7544755600	Мотоботы BMW Motorrad Gotthard GTX, 42/43 и 44/45	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7544755600, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
c18cc3c7-c1e5-4003-b3dc-56cdbbdf6d68	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei Neotec 3 Anthem TC-10, по заказ	avito-7736067660	Мотошлем Shoei Neotec 3 Anthem TC-10, по заказ	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7736067660, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
c341e36d-0c07-4daf-b14e-31781fee646f	1e47ef44-3c10-4f2e-a167-1d4e61468458	2616dcf4-5603-4979-bf1b-d83c02cee6a3	Мотоперчатки Dainese Full Metall 7, L/9,5	avito-7736258176	Мотоперчатки Dainese Full Metall 7, L/9,5	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7736258176, "category": "Перчатки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
50fa2ad3-72ce-4856-893e-f91fe7f96d2b	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны Bmw Motorrad GS Rallye, 42/44	avito-7512214475	Мотоштаны Bmw Motorrad GS Rallye, 42/44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7512214475, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
db21c757-ddfc-42ea-a54e-7d7d0d9f9dab	2c6f0ca0-8afc-42ec-8053-abce4ad70679	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	Визор и Pinlock AGV K3 GT6-1, размер XS-L, оригина	avito-7640685575	Визор и Pinlock AGV K3 GT6-1, размер XS-L, оригина	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"brand": "AGV", "source": "avito", "avitoId": 7640685575, "category": "Шлемы"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
d58bc6e7-f7e3-4e32-aad2-77d4fecfa7ad	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем BMW Sao Paulo Urban, L (58-60 см)	avito-7736830684	Мотошлем BMW Sao Paulo Urban, L (58-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7736830684, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
28da7917-910b-4f6d-981d-157a7c370b62	2dad1445-3f4f-43eb-a892-6397d581d046	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Icon Airflite bugoid Blue, M (56-57 см)	avito-7672007868	Мотошлем Icon Airflite bugoid Blue, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Icon", "source": "avito", "avitoId": 7672007868, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
713fa632-6be8-4202-9f72-24a9ab02c93b	5fbac148-1d5b-4c7c-874b-af626e2c9ecc	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	avito-4537431286	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "LS2", "source": "avito", "avitoId": 4537431286, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
df717577-f335-4759-aad3-40fd37132b0f	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотодождевик BMW Motorrad Rainlock, все размеры	avito-7768422676	Мотодождевик BMW Motorrad Rainlock, все размеры	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7768422676, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
36dfda30-2d73-4a52-a921-a6bcea302917	2dad1445-3f4f-43eb-a892-6397d581d046	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Icon Airflite El Centro, M (56-57 см)	avito-7320173682	Мотошлем Icon Airflite El Centro, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Icon", "source": "avito", "avitoId": 7320173682, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
0e06d121-776a-49ee-bc19-cb952499ac7a	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	Комплект кофров BMW Motorrad Atacama, оригинал	avito-7320334642	Комплект кофров BMW Motorrad Atacama, оригинал	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7320334642, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
e88ec078-1649-4b2a-911f-198b953cd6a7	0a1adb23-d14c-43cf-b6ff-4024d1003d3c	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Spidi Ring, 52/54	avito-7320538670	Мотокуртка Spidi Ring, 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Spidi", "source": "avito", "avitoId": 7320538670, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
49d4e790-2ce3-4b9a-aa27-f5eae530eab5	3e6b1335-c12a-48fe-ab01-5103949b1f46	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Schuberth S2 Sport Redux, L (58-59 см)	avito-7352095298	Мотошлем Schuberth S2 Sport Redux, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Schuberth", "source": "avito", "avitoId": 7352095298, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
f2e10d46-43c4-47fe-be4b-914540f5d743	a45858cf-0919-4a75-8e67-3442180337fb	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Arai RX-7 GP Matt Black, M (57-58 см)	avito-7352220119	Мотошлем Arai RX-7 GP Matt Black, M (57-58 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Arai", "source": "avito", "avitoId": 7352220119, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
3d2db6d7-cf99-4882-9d37-9ca7fbf2e51c	3e6b1335-c12a-48fe-ab01-5103949b1f46	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Schuberth S2 + Sena, XL (60-62 см)	avito-7384018177	Мотошлем Schuberth S2 + Sena, XL (60-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Schuberth", "source": "avito", "avitoId": 7384018177, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
4bb9d8a4-6dbb-49e2-8e04-b8b2f10360ad	98918958-25db-40b0-91ce-b3b61dc40d68	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка сетка Harley-Davidson Mesh Air Lady, 48	avito-7704124165	Мотокуртка сетка Harley-Davidson Mesh Air Lady, 48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Harley-Davidson", "source": "avito", "avitoId": 7704124165, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
9c652937-d5d4-49ba-b6ab-5e1a9a1717c9	0a1adb23-d14c-43cf-b6ff-4024d1003d3c	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны Spidi Traveler 3, 46/48	avito-7704307642	Мотоштаны Spidi Traveler 3, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Spidi", "source": "avito", "avitoId": 7704307642, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
ebb40545-94f5-452d-a7fd-8d8412118e81	3e6b1335-c12a-48fe-ab01-5103949b1f46	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Schuberth R2, S (54-56 см)	avito-7704345074	Мотошлем Schuberth R2, S (54-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Schuberth", "source": "avito", "avitoId": 7704345074, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
4d1e8b59-c9a0-4167-a80b-5a86e83419a3	ba66677c-51f8-45ea-9ab8-264b87cd680e	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботы Alpinestars Fastback 2 Drystar WP, 39/40	avito-7704370492	Мотоботы Alpinestars Fastback 2 Drystar WP, 39/40	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7704370492, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
da79cf44-abf5-426c-8412-bf84621a685d	7f09f721-6114-4c7f-977b-f3c47386942a	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботы Touratech Destino Adventure, 42/43	avito-7704413276	Мотоботы Touratech Destino Adventure, 42/43	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Touratech", "source": "avito", "avitoId": 7704413276, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
e154af78-9f05-4fb8-8f95-a014b4d89c7d	0786e513-c7b2-43f3-9768-a069acc2c1eb	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Ducati 80S 14 Black, 42/44	avito-7704416305	Мотокуртка Ducati 80S 14 Black, 42/44	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Ducati", "source": "avito", "avitoId": 7704416305, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
ec25bc27-a069-450f-b06c-38db10b5e658	da0c823a-835c-411c-a043-c8ef734ae643	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	Мотошлем с гарнитурой BMW Motorrad System 7, L	avito-7704730307	Мотошлем с гарнитурой BMW Motorrad System 7, L	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7704730307, "category": "Шлемы"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
0278e095-4605-4fe8-b5ab-c610e34bcb98	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем BMW Motorrad GS Carbon Evo, XL (59-61 см)	avito-7704768455	Мотошлем BMW Motorrad GS Carbon Evo, XL (59-61 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7704768455, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
26aa5ce3-0c77-4747-8722-d41b0843e267	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei Hornet ADV V2 KTM, S (54-56 см)	avito-7736754113	Мотошлем Shoei Hornet ADV V2 KTM, S (54-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7736754113, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
783989dd-2c10-465b-b9b1-937457ff807b	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм BMW Motorrad Airflow, 48/50	avito-7768033759	Мотокостюм BMW Motorrad Airflow, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7768033759, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
0bb3456d-817e-4bf8-8422-856074115072	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм BMW Motorrad GS Adrar, 52/54	avito-7608798392	Мотокостюм BMW Motorrad GS Adrar, 52/54	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7608798392, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
611361e8-3728-47a8-9264-59ff592a6ed8	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	Защита фары Touratech для BMW R 1300 GS ADV	avito-7640131998	Защита фары Touratech для BMW R 1300 GS ADV	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7640131998, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
eff90c64-7ce9-4189-b643-8e5b0d6ce46b	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei GT-Air 2 Panorama TC-8, L (59-60 см	avito-7448184351	Мотошлем Shoei GT-Air 2 Panorama TC-8, L (59-60 см	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7448184351, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
3141ee39-04f8-4ce1-8ede-5b33d55f3380	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем BMW Motorrad System 7 Carbon, XS/53-54 см	avito-7448566160	Мотошлем BMW Motorrad System 7 Carbon, XS/53-54 см	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7448566160, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
8b7285c1-8729-4391-8d1a-5d355a9205a5	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei GT Air 2 Matt Black, S (55-56 см)	avito-7448586310	Мотошлем Shoei GT Air 2 Matt Black, S (55-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7448586310, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
e1f9e8a9-1973-47f7-8a63-a950912c2bfa	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем BMW Motorrad Street X, М (57-58 см)	avito-7512174969	Мотошлем BMW Motorrad Street X, М (57-58 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7512174969, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
042e4e03-5a9a-47a6-bb3e-79008e753e19	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei Neotec 2 Matt Black, XL (61-62 см)	avito-7544181655	Мотошлем Shoei Neotec 2 Matt Black, XL (61-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7544181655, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
4d2e06ad-52cf-4b20-88d6-938badafad9a	56489432-b6c3-453c-b26b-a3fdb8514415	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка IXS Tour Lorin-ST, 48, 50, 52, 54, 56	avito-7544833478	Мотокуртка IXS Tour Lorin-ST, 48, 50, 52, 54, 56	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "IXS", "source": "avito", "avitoId": 7544833478, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
b02c6fe2-3a9f-44ab-92c9-1485f08e6b69	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Dainese Rapida Lady, 46/48	avito-7608031301	Мотокуртка Dainese Rapida Lady, 46/48	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Dainese", "source": "avito", "avitoId": 7608031301, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
9e117f9e-6c43-49cf-8736-6abbe4a632b3	c45d939e-64aa-4291-9d3a-f4b54f6c61ae	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка HolyFreedom Quattro Evolution, 52/54	avito-7608404013	Мотокуртка HolyFreedom Quattro Evolution, 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "HolyFreedom", "source": "avito", "avitoId": 7608404013, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
a337f56e-f70f-492e-a780-16859238939c	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны Alpinestars Bogota Pro Drystar, 48/50	avito-7608679589	Мотоштаны Alpinestars Bogota Pro Drystar, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки на вторичном рынке с крупнейшим выбором.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зaчeт пpи покупке н...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7608679589, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
97039ad1-5b91-48f9-85e1-064f1841c38e	2dad1445-3f4f-43eb-a892-6397d581d046	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Icon Airflite Fayder Red, L (58-59 см)	avito-7640660738	Мотошлем Icon Airflite Fayder Red, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Icon", "source": "avito", "avitoId": 7640660738, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
44f54390-ddf5-4c64-8dfe-649545a892f0	2c6f0ca0-8afc-42ec-8053-abce4ad70679	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем AGV K6 Flash, S (55-56 см)	avito-7672506758	Мотошлем AGV K6 Flash, S (55-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "AGV", "source": "avito", "avitoId": 7672506758, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
85ab82eb-cd4e-479d-9869-b585c54d55b6	2dad1445-3f4f-43eb-a892-6397d581d046	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Icon Airform Manik'RR mips, М (57-58 см)	avito-7703966270	Мотошлем Icon Airform Manik'RR mips, М (57-58 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Icon", "source": "avito", "avitoId": 7703966270, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
44137d9a-e821-409e-98a4-1ed2d421863d	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотоштаны кожаные Dainese Delta Pro, 54/56	avito-7736502568	Мотоштаны кожаные Dainese Delta Pro, 54/56	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7736502568, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
0887cb1a-7784-4839-b7e3-e7906f4f0e1e	0a287469-e09b-406c-92a2-2f0332ae587c	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм Shima Jet, 48/50	avito-7736543866	Мотокостюм Shima Jet, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Shima", "source": "avito", "avitoId": 7736543866, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
b1400cb4-9f05-4bc0-a752-56a59e3943a5	2094ec9b-bbd2-463f-808a-0617894fa3ef	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Triumph Braddan Blue, 48/50	avito-7736617671	Мотокуртка Triumph Braddan Blue, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Triumph", "source": "avito", "avitoId": 7736617671, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
936cf4fc-9d29-4f76-b9cb-64c466d5aeee	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei Neotec 2 + Sena SRL, XL (61-62 см)	avito-7544068978	Мотошлем Shoei Neotec 2 + Sena SRL, XL (61-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7544068978, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
1c4c9b42-22f1-43e3-883d-37d633ac73a9	ba66677c-51f8-45ea-9ab8-264b87cd680e	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботы Alpinestars Faster-3 Rideknit KTM, 41/42	avito-4472548492	Мотоботы Alpinestars Faster-3 Rideknit KTM, 41/42	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Alpinestars", "source": "avito", "avitoId": 4472548492, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
29af24f5-c6ce-4ce6-be4f-4d96944bf132	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad Rallye, 48/50	avito-7928131471	Мотокуртка BMW Motorrad Rallye, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7928131471, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
92b9cda5-3049-4228-8186-5790cfea28a3	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad Glandon Air Grey, 50/52	avito-7928660461	Мотокуртка BMW Motorrad Glandon Air Grey, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7928660461, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
1317eb21-b9d4-49af-928d-ec6ae0222913	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad Glandon Air Grey, 48/50	avito-7928827958	Мотокуртка BMW Motorrad Glandon Air Grey, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7928827958, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
4feffbf6-17cd-42f6-b903-df5f950e4897	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокостюм Alpinestars Motegi v2 2PC, 52/54	avito-7928106347	Мотокостюм Alpinestars Motegi v2 2PC, 52/54	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7928106347, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
bf694020-d068-4cdf-ae41-543c9738be41	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотожилет защитный BMW Protector Vest, L, XL	avito-7928535833	Мотожилет защитный BMW Protector Vest, L, XL	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7928535833, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
fb0b8c57-a3be-4fa2-9620-16976969bd31	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad Fleece, 50/52	avito-7928223307	Мотокуртка BMW Motorrad Fleece, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7928223307, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
4bbdfbcf-1325-4534-80d3-d7e189bd944c	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Куртка-софтшелл BMW Motorrad Softshell, 48/50	avito-7928697980	Куртка-софтшелл BMW Motorrad Softshell, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7928697980, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
b4935ee6-3025-428f-b035-1286093e2180	0de06905-2b5b-4470-be7b-98a2a56b3878	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	Визор CNS-1C+Pinlock для Shoei GT Air 3, оригин	avito-7640719968	Визор CNS-1C+Pinlock для Shoei GT Air 3, оригин	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Shoei", "source": "avito", "avitoId": 7640719968, "category": "Шлемы"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
2976ff70-15bd-4202-ba43-a7db0dfc4737	ba66677c-51f8-45ea-9ab8-264b87cd680e	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Alpinestars GP Plus R V3, 52/54	avito-7672381094	Мотокуртка Alpinestars GP Plus R V3, 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Alpinestars", "source": "avito", "avitoId": 7672381094, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
54452e02-37b0-4a9a-bf52-7b16edfdf530	1e47ef44-3c10-4f2e-a167-1d4e61468458	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Dainese Agile Black, 46/48	avito-7672566789	Мотокуртка Dainese Agile Black, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"brand": "Dainese", "source": "avito", "avitoId": 7672566789, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
20dba213-9b39-48b2-8ea5-1d2c9068dfdc	0de06905-2b5b-4470-be7b-98a2a56b3878	996aad3a-b88b-4264-b999-ed42ac852b86	Мотошлем Shoei Neotec 3 Sharpen, под заказ	avito-7960364332	Мотошлем Shoei Neotec 3 Sharpen, под заказ	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОперативная доставка под заказ из Европы.\n\nАвито доставка возможна только по...	{"brand": "Shoei", "source": "avito", "avitoId": 7960364332, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
1991fe2b-067b-4b74-8dba-a1d451245a28	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботинки BMW Motorrad Ginza Sneaker, 42, 43, 44	avito-7960499118	Мотоботинки BMW Motorrad Ginza Sneaker, 42, 43, 44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7960499118, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
48cd31ad-9037-481b-b721-b378597358a8	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботинки BMW Motorrad Nitrous, 43, 44, 45	avito-7959942347	Мотоботинки BMW Motorrad Nitrous, 43, 44, 45	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7959942347, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
dff5b8de-e6c5-4640-99e6-471e50e0a70b	da0c823a-835c-411c-a043-c8ef734ae643	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотоботинки BMW Motorrad Takyr GTX, 41, 42, 43, 44	avito-7960092751	Мотоботинки BMW Motorrad Takyr GTX, 41, 42, 43, 44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7960092751, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
2e6bfe24-157b-4e90-ac18-207cfd2b6b3e	da0c823a-835c-411c-a043-c8ef734ae643	996aad3a-b88b-4264-b999-ed42ac852b86	BMW Motorrad Soulor GTX, 42, 43	avito-7960742640	BMW Motorrad Soulor GTX, 42, 43	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7960742640, "category": "Аксессуары"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
2a07319a-4496-4824-9e13-67a27868bb94	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка Bmw Motorrad GS Rallye GTX, под заказ	avito-7960457938	Мотокуртка Bmw Motorrad GS Rallye GTX, под заказ	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОперативная доставка под заказ из Европы.\n\nАвито доставка возможна только по...	{"brand": "BMW", "source": "avito", "avitoId": 7960457938, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
86050792-54b1-4d16-9195-7c2e0819272c	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка BMW Motorrad RoadCrafted, 50/52	avito-7960603553	Мотокуртка BMW Motorrad RoadCrafted, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "BMW", "source": "avito", "avitoId": 7960603553, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
c94bc350-b912-43e7-bb53-4ca285bd4d86	da0c823a-835c-411c-a043-c8ef734ae643	1ac52608-791b-4334-b0ff-a36ad2d21c4b	Мотокуртка женская BMW Motorrad Bavella, 44/46	avito-7960878613	Мотокуртка женская BMW Motorrad Bavella, 44/46	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"brand": "BMW", "source": "avito", "avitoId": 7960878613, "category": "Куртки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
8b073719-562f-4c29-901c-972bc19881c4	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei GT-Air 2 Tesseract TC-5, S, 2XL	avito-7960907134	Мотошлем Shoei GT-Air 2 Tesseract TC-5, S, 2XL	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7960907134, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
6fbf4bdc-ecf2-499d-8a5b-32437f4edb98	a45858cf-0919-4a75-8e67-3442180337fb	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Arai V-Cross 4, XL (60-62 см)	avito-7863986141	Мотошлем Arai V-Cross 4, XL (60-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Arai", "source": "avito", "avitoId": 7863986141, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
5a1d6abe-3df5-4a96-9c91-a06150306daf	0de06905-2b5b-4470-be7b-98a2a56b3878	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	Мотошлем Shoei GT-Air 2 Pearl White, M (56-57 см)	avito-7864461570	Мотошлем Shoei GT-Air 2 Pearl White, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"brand": "Shoei", "source": "avito", "avitoId": 7864461570, "category": "Ботинки"}	\N	t	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:37:04.460888+03
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, template_id, sku, barcode, title, slug, condition, color, size, price, old_price, stock_qty, reserved_qty, description_override, specs_override, is_active, published_at, sold_at, created_by, created_at, updated_at, name, description, original_price, image_url, images, category_id, subcategory_id, subsubcategory_id, category_id_2, brand, in_stock, featured, popular, on_sale, rating, specs, is_archived, archived_at, auto_delete_at) FROM stdin;
86a39b06-c962-4c8f-b266-dafa9e06d328	07e33a5a-4e7a-4206-ad02-6ca97d84a14b	MT-ALP-HALO-GRY-L-001	\N	Alpinestars Halo Drystar Grey L	alpinestars-halo-drystar-grey-l-001	new	Grey	L	38900.00	\N	4	0	\N	{}	t	2026-03-07 15:42:32.243699+03	\N	\N	2026-03-07 15:42:32.243699+03	2026-03-10 16:16:35.724076+03	Alpinestars Halo Drystar Grey L		\N	/uploads/imported/templates/tpl-07e33a5a-4e7a-4206-ad02-6ca97d84a14b-d38a330f-a147-461c-8d1e-3ab4ccb12fbe.jpg	\N	f360e60d-0543-47dd-8e35-913069eb87a1	\N	\N	\N	Alpinestars	t	f	f	f	4.80	{}	f	\N	\N
7fe5f041-d1c3-4638-8bff-a549ab1d5dde	3f9d7bcf-94a0-41f4-9379-8ef61603a02a	MT-TCX-ST3-BRN-43-001	\N	TCX Street 3 Brown 43	tcx-street-3-brown-43-001	new	Brown	43	21900.00	\N	2	0	\N	{}	t	2026-03-07 15:42:32.243699+03	\N	\N	2026-03-07 15:42:32.243699+03	2026-03-10 16:16:35.724076+03	TCX Street 3 Brown 43		\N	/uploads/imported/templates/tpl-3f9d7bcf-94a0-41f4-9379-8ef61603a02a-ae83ec22-40dc-4304-8781-c0e7821e3b8d.jpg	\N	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	TCX	t	f	f	f	4.80	{}	f	\N	\N
16d3295d-3ead-44e4-a094-c5404366a8cb	4d5f103c-40e7-4915-980e-a412719cd5a0	AVITO-7608101725	\N	Мотошлем Schuberth J2, все размеры	motoshlem-schuberth-j2-vse-razmery-7608101725	new	\N	\N	56800.00	\N	4	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7608101725, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_schuberth_j2_vse_razmery_7608101725?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 01:37:09.364321+03	Мотошлем Schuberth J2, все размеры	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7608101725/7608101725-1-c9a784b0565f.jpg	{/uploads/imported/avito/7608101725/7608101725-1-c9a784b0565f.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Schuberth	t	f	t	f	\N	{"source": "avito", "avitoId": 7608101725}	f	\N	\N
6ac39973-6e37-4fd4-8e82-d093efe27b69	5a1d6abe-3df5-4a96-9c91-a06150306daf	AVITO-7864461570	\N	Мотошлем Shoei GT-Air 2 Pearl White, M (56-57 см)	motoshlem-shoei-gt-air-2-pearl-white-m-56-57-sm-7864461570	new	\N	M	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864461570, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_gt-air_2_pearl_white_m_56-57_sm_7864461570?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei GT-Air 2 Pearl White, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864461570/7864461570-1-241284cee4c7.jpg	{/uploads/imported/avito/7864461570/7864461570-1-241284cee4c7.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7864461570}	f	\N	\N
b0ab6d18-be90-4c3c-9989-90ef317c0d7c	46ffe0c7-619f-4b97-9abc-54bfdf07e0c4	MT-AGV-K6S-RED-L-001	\N	AGV K6 S Red L	agv-k6-s-red-l-001	new	Red	L	47500.00	\N	1	0	\N	{}	t	2026-03-07 15:42:32.243699+03	\N	\N	2026-03-07 15:42:32.243699+03	2026-03-11 03:54:08.460368+03	AGV K6 S Red L		\N	/uploads/imported/templates/tpl-46ffe0c7-619f-4b97-9abc-54bfdf07e0c4-1a6af3ef-2104-4f23-9d1e-5d7eb2cb6b29.jpg	\N	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	AGV	t	f	f	f	4.80	{}	f	\N	\N
a4639466-6cc8-4cf9-a62f-7ebae6a28876	bce676f0-5180-48e9-85fe-ea64ab8c27b7	123-K1-838529	\N	123 k1	123-k1	new	\N	\N	15555.00	15555.00	1	0	\N	{}	t	\N	\N	\N	2026-03-09 03:23:58.531394+03	2026-03-09 03:25:02.391924+03	123 k1		15555.00	\N	{}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	123	t	t	t	t	\N	{}	f	\N	\N
c7b5c080-840d-4562-8adb-ef67117fcf86	a98fdb6f-c056-450b-b6ba-19e5d5125f27	AGV-SUPERPUS-150910	\N	СуперПушка	superpushka	new	\N	\N	12222.00	\N	1	0	\N	{}	t	\N	\N	\N	2026-03-09 03:29:10.911434+03	2026-03-09 03:29:10.911434+03	СуперПушка	\N	\N	\N	{}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	AGV	t	f	f	f	\N	{}	f	\N	\N
dfd31622-5e2b-4993-8420-a184f87cd6b3	8b5fe852-04a7-4348-9ed9-af1c1eee7ce2	MT-SHOEI-RF1400-USED-WHT-M-001	\N	Shoei RF-1400 Used White M	shoei-rf-1400-used-white-m-001	used	White	M	32900.00	\N	1	0	\N	{}	t	2026-03-07 15:42:32.243699+03	\N	\N	2026-03-07 15:42:32.243699+03	2026-03-10 16:16:35.724076+03	Shoei RF-1400 Used White M		\N	/uploads/imported/templates/tpl-8b5fe852-04a7-4348-9ed9-af1c1eee7ce2-371a86e4-aca1-463b-9ba0-0133089e47ed.jpg	\N	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	Shoei	t	f	f	f	4.80	{}	f	\N	\N
4807a7e1-9fb9-4107-8c27-3cceaed87643	8b5fe852-04a7-4348-9ed9-af1c1eee7ce2	MT-SHOEI-RF1400-BLK-M-001	\N	Shoei RF-1400 Black M	shoei-rf-1400-black-m-001	new	Black	M	54900.00	59900.00	5	0	\N	{}	t	2026-03-07 15:42:32.243699+03	\N	\N	2026-03-07 15:42:32.243699+03	2026-03-10 16:16:35.724076+03	Shoei RF-1400 Black M		59900.00	/uploads/imported/templates/tpl-8b5fe852-04a7-4348-9ed9-af1c1eee7ce2-371a86e4-aca1-463b-9ba0-0133089e47ed.jpg	\N	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	Shoei	t	f	f	f	4.80	{}	f	\N	\N
423988d8-13b2-4454-87da-55562b795e7a	2e6bfe24-157b-4e90-ac18-207cfd2b6b3e	AVITO-7960742640	\N	BMW Motorrad Soulor GTX, 42, 43	bmw-motorrad-soulor-gtx-42-43-7960742640	new	\N	\N	39800.00	\N	4	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7960742640, "urlPath": "/moskva/zapchasti_i_aksessuary/bmw_motorrad_soulor_gtx_42_43_7960742640?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 03:54:08.460368+03	BMW Motorrad Soulor GTX, 42, 43	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7960742640/7960742640-1-c6f8197e61a2.jpg	{/uploads/imported/avito/7960742640/7960742640-1-c6f8197e61a2.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7960742640}	f	\N	\N
c13758e7-438a-42e2-b506-9eaa3cd2fd5a	1991fe2b-067b-4b74-8dba-a1d451245a28	AVITO-7960499118	\N	Мотоботинки BMW Motorrad Ginza Sneaker, 42, 43, 44	motobotinki-bmw-motorrad-ginza-sneaker-42-43-44-7960499118	new	\N	\N	32800.00	\N	0	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7960499118, "urlPath": "/moskva/zapchasti_i_aksessuary/motobotinki_bmw_motorrad_ginza_sneaker_42_43_44_7960499118?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 03:54:08.460368+03	Мотоботинки BMW Motorrad Ginza Sneaker, 42, 43, 44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7960499118/7960499118-1-e1fbc1ab323c.jpg	{/uploads/imported/avito/7960499118/7960499118-1-e1fbc1ab323c.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7960499118}	f	\N	\N
5dc836a4-a9a2-4c45-a7f4-0c7e5daf5c11	db21c757-ddfc-42ea-a54e-7d7d0d9f9dab	AVITO-7640685575	\N	Визор и Pinlock AGV K3 GT6-1, размер XS-L, оригина	vizor-i-pinlock-agv-k3-gt6-1-razmer-xs-l-origina-7640685575	new	\N	XS	9800.00	\N	0	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7640685575, "urlPath": "/moskva/zapchasti_i_aksessuary/vizor_i_pinlock_agv_k3_gt6-1_razmer_xs-l_origina_7640685575?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 03:54:08.460368+03	Визор и Pinlock AGV K3 GT6-1, размер XS-L, оригина	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7640685575/7640685575-1-df8302cb4189.jpg	{/uploads/imported/avito/7640685575/7640685575-1-df8302cb4189.jpg}	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	AGV	t	f	t	f	\N	{"source": "avito", "avitoId": 7640685575}	f	\N	\N
4f7dcd70-f382-4f7d-ac5e-5bb32677b7e5	ae2dc7d1-98bf-4f61-a1e6-7c2737ce4605	AVITO-7544361936	\N	Фотохромный визор Shoei CWR-1 на X-Spirit III/NXR	fotohromnyy-vizor-shoei-cwr-1-na-x-spirit-iii-nxr-7544361936	new	\N	\N	17800.00	\N	3	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7544361936, "urlPath": "/moskva/zapchasti_i_aksessuary/fotohromnyy_vizor_shoei_cwr-1_na_x-spirit_iiinxr_7544361936?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 03:54:08.460368+03	Фотохромный визор Shoei CWR-1 на X-Spirit III/NXR	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7544361936/7544361936-1-b767fdac7246.jpg	{/uploads/imported/avito/7544361936/7544361936-1-b767fdac7246.jpg}	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7544361936}	f	\N	\N
54361a20-1a27-4a7e-911e-b5a2a10100c8	20dba213-9b39-48b2-8ea5-1d2c9068dfdc	AVITO-7960364332	\N	Мотошлем Shoei Neotec 3 Sharpen, под заказ	motoshlem-shoei-neotec-3-sharpen-pod-zakaz-7960364332	new	\N	\N	74800.00	\N	3	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОперативная доставка под заказ из Европы.\n\nАвито доставка возможна только по...	{"source": "avito", "avitoId": 7960364332, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_neotec_3_sharpen_pod_zakaz_7960364332?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 03:54:08.460368+03	Мотошлем Shoei Neotec 3 Sharpen, под заказ	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОперативная доставка под заказ из Европы.\n\nАвито доставка возможна только по...	\N	/uploads/imported/avito/7960364332/7960364332-1-133deaa30c81.jpg	{/uploads/imported/avito/7960364332/7960364332-1-133deaa30c81.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7960364332}	f	\N	\N
7f2c5696-70bd-415e-8203-bcc2f0e8e0b0	6fbf4bdc-ecf2-499d-8a5b-32437f4edb98	AVITO-7863986141	\N	Мотошлем Arai V-Cross 4, XL (60-62 см)	motoshlem-arai-v-cross-4-xl-60-62-sm-7863986141	new	\N	XL	34800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7863986141, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_arai_v-cross_4_xl_60-62_sm_7863986141?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Arai V-Cross 4, XL (60-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7863986141/7863986141-1-3c9501ad469d.jpg	{/uploads/imported/avito/7863986141/7863986141-1-3c9501ad469d.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Arai	t	f	t	f	\N	{"source": "avito", "avitoId": 7863986141}	f	\N	\N
4874cf5d-38af-4df3-a07e-cf8420725b0e	d7a508e6-2260-4517-ae90-74430305f032	AVITO-7448496323	\N	Мотошлем Icon Airframe Pro Construct, 2XL (60-62)	motoshlem-icon-airframe-pro-construct-2xl-60-62-7448496323	new	\N	2XL	24800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7448496323, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_icon_airframe_pro_construct_2xl_60-62_7448496323?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Icon Airframe Pro Construct, 2XL (60-62)	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7448496323/7448496323-1-fb9361194390.jpg	{/uploads/imported/avito/7448496323/7448496323-1-fb9361194390.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	Icon	t	f	t	f	\N	{"source": "avito", "avitoId": 7448496323}	f	\N	\N
09fcca86-53f1-488e-acd8-0a2ecd51cab8	71a17ec9-7860-44b6-ba63-ea119a06ce6c	AVITO-7608421278	\N	Мотокуртка BMW Motorrad Rallye, 54/56	motokurtka-bmw-motorrad-rallye-54-56-7608421278	new	\N	54/56	44800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7608421278, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_rallye_5456_7608421278?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad Rallye, 54/56	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7608421278/7608421278-1-6c96fce2c53b.jpg	{/uploads/imported/avito/7608421278/7608421278-1-6c96fce2c53b.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7608421278}	f	\N	\N
b92b6794-895a-4f89-aac2-9d1a005247ab	149fd703-b963-4d68-9052-1b9362d790da	AVITO-7864273688	\N	Мотокостюм летний Spidi Air, 56/58	motokostyum-letniy-spidi-air-56-58-7864273688	new	\N	56/58	18800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7864273688, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_letniy_spidi_air_5658_7864273688?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм летний Spidi Air, 56/58	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7864273688/7864273688-1-a5a70f688bb4.jpg	{/uploads/imported/avito/7864273688/7864273688-1-a5a70f688bb4.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Spidi	t	f	t	f	\N	{"source": "avito", "avitoId": 7864273688}	f	\N	\N
f2828b48-a1ad-4c6b-93e5-c84e4c9dee1c	de628ac6-aee8-4daf-9dc6-4edc218344c2	AVITO-7864054360	\N	Мотокостюм Spidi 4 Seasons v3 H2Out Lady, 44/46	motokostyum-spidi-4-seasons-v3-h2out-lady-44-46-7864054360	new	\N	44/46	96800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7864054360, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_spidi_4_seasons_v3_h2out_lady_4446_7864054360?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм Spidi 4 Seasons v3 H2Out Lady, 44/46	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7864054360/7864054360-1-71bb24f26f48.jpg	{/uploads/imported/avito/7864054360/7864054360-1-71bb24f26f48.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Spidi	t	f	t	f	\N	{"source": "avito", "avitoId": 7864054360}	f	\N	\N
7ce90805-925e-40c7-bf20-2e0173005293	6534ef00-09e0-4dd8-b05e-c680486382cd	AVITO-4473331797	\N	Мотоперчатки Alpinestars GP-Tech, XL и 3XL	motoperchatki-alpinestars-gp-tech-xl-i-3xl-4473331797	new	\N	XL	15800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nПрофессиональный подбор экипировки под Ваши задачи и мотоцикл.\n\nВесь ассортимент представлен в шоуруме в Москве и наших пабликах Mototom_ club (ссылки пришлем по запр...	{"source": "avito", "avitoId": 4473331797, "urlPath": "/moskva/zapchasti_i_aksessuary/motoperchatki_alpinestars_gp-tech_xl_i_3xl_4473331797?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоперчатки Alpinestars GP-Tech, XL и 3XL	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nПрофессиональный подбор экипировки под Ваши задачи и мотоцикл.\n\nВесь ассортимент представлен в шоуруме в Москве и наших пабликах Mototom_ club (ссылки пришлем по запр...	\N	/uploads/imported/avito/4473331797/4473331797-1-794cdcaf28d4.jpg	{/uploads/imported/avito/4473331797/4473331797-1-794cdcaf28d4.jpg}	2616dcf4-5603-4979-bf1b-d83c02cee6a3	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 4473331797}	f	\N	\N
94b382e4-b3c7-4a76-8e26-6023074b02be	19dd5042-79b7-4e7e-9172-ac0224394a5f	AVITO-7544453382	\N	Мотокуртка Alpinestars Monteira Drystar, 50/52	motokurtka-alpinestars-monteira-drystar-50-52-7544453382	new	\N	50/52	47800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7544453382, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_alpinestars_monteira_drystar_5052_7544453382?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Alpinestars Monteira Drystar, 50/52	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7544453382/7544453382-1-fe8d810b449c.jpg	{/uploads/imported/avito/7544453382/7544453382-1-fe8d810b449c.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7544453382}	f	\N	\N
08461e31-a05f-4bdd-bbe6-98b26096658a	fcaf622c-debc-4519-a469-13e8f508cbdd	AVITO-7704396758	\N	Мотоштаны Revit Eclipce Air, 46/48	motoshtany-revit-eclipce-air-46-48-7704396758	new	\N	46/48	17800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7704396758, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_revit_eclipce_air_4648_7704396758?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны Revit Eclipce Air, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7704396758/7704396758-1-477c044fc26a.jpg	{/uploads/imported/avito/7704396758/7704396758-1-477c044fc26a.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	REV'IT!	t	f	t	f	\N	{"source": "avito", "avitoId": 7704396758}	f	\N	\N
97a94449-9690-4b57-a646-0834090bd9ed	8b258d7d-3410-43af-be57-a87d707941aa	AVITO-7704797542	\N	Термо белье BMW Motorrad Skin ST, 50/52	termo-bele-bmw-motorrad-skin-st-50-52-7704797542	new	\N	50/52	15800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7704797542, "urlPath": "/moskva/zapchasti_i_aksessuary/termo_bele_bmw_motorrad_skin_st_5052_7704797542?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Термо белье BMW Motorrad Skin ST, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7704797542/7704797542-1-d26b2ede3536.jpg	{/uploads/imported/avito/7704797542/7704797542-1-d26b2ede3536.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7704797542}	f	\N	\N
4e8b7014-85cd-439d-b370-23652cde1ec2	cf06f2d1-cf59-4645-9dd3-18b7ce594eb1	AVITO-7704901896	\N	Утепленная термокуртка BMW Motorrad Stepp, 40/42	uteplennaya-termokurtka-bmw-motorrad-stepp-40-42-7704901896	new	\N	40/42	22800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7704901896, "urlPath": "/moskva/zapchasti_i_aksessuary/uteplennaya_termokurtka_bmw_motorrad_stepp_4042_7704901896?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI2cUt2VEREcW1ZVG83NWdFIjt9xwJAZz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Утепленная термокуртка BMW Motorrad Stepp, 40/42	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7704901896/7704901896-1-99d2efa38e04.jpg	{/uploads/imported/avito/7704901896/7704901896-1-99d2efa38e04.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7704901896}	f	\N	\N
10ad38c4-c565-442b-b709-774781c4daf0	5d7a853e-f904-4476-a4db-b49d9cab796c	AVITO-7863942280	\N	Мотоштаны Bmw Motorrad Rallye comp, 50/52	motoshtany-bmw-motorrad-rallye-comp-50-52-7863942280	new	\N	50/52	28800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7863942280, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_bmw_motorrad_rallye_comp_5052_7863942280?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны Bmw Motorrad Rallye comp, 50/52	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7863942280/7863942280-1-896434d5cece.jpg	{/uploads/imported/avito/7863942280/7863942280-1-896434d5cece.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7863942280}	f	\N	\N
34174d30-8d5c-4244-b0a4-b1fff0676c91	57c96127-2d6e-4046-80ef-790f3f43f3d1	AVITO-7863945378	\N	Мотокуртка туринговая Revit Sand, 42/44	motokurtka-turingovaya-revit-sand-42-44-7863945378	new	\N	42/44	24800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7863945378, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_turingovaya_revit_sand_4244_7863945378?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка туринговая Revit Sand, 42/44	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7863945378/7863945378-1-14904ae91212.jpg	{/uploads/imported/avito/7863945378/7863945378-1-14904ae91212.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	REV'IT!	t	f	t	f	\N	{"source": "avito", "avitoId": 7863945378}	f	\N	\N
dca855ca-8e5e-4816-a9dd-e0e779bec83a	e23c37c4-bf8a-4fd8-9b5c-57ce92c46765	AVITO-7864136477	\N	Мотошлем Shoei X-Spirit 3 KTM, L (58-59 см)	motoshlem-shoei-x-spirit-3-ktm-l-58-59-sm-7864136477	new	\N	L	44800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864136477, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_x-spirit_3_ktm_l_58-59_sm_7864136477?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei X-Spirit 3 KTM, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864136477/7864136477-1-ddacb84d967d.jpg	{/uploads/imported/avito/7864136477/7864136477-1-ddacb84d967d.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7864136477}	f	\N	\N
fa091e82-82e3-4db4-b96c-4dc1c850bf5e	5b78f337-e4d5-476a-99f5-10446881d4d0	AVITO-7864407855	\N	Мотоперчатки Alpinestars SMX-1 Air V2, M/9	motoperchatki-alpinestars-smx-1-air-v2-m-9-7864407855	new	\N	M	11800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7864407855, "urlPath": "/moskva/zapchasti_i_aksessuary/motoperchatki_alpinestars_smx-1_air_v2_m9_7864407855?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоперчатки Alpinestars SMX-1 Air V2, M/9	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7864407855/7864407855-1-e819d218db42.jpg	{/uploads/imported/avito/7864407855/7864407855-1-e819d218db42.jpg}	2616dcf4-5603-4979-bf1b-d83c02cee6a3	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7864407855}	f	\N	\N
6a686e80-a096-4ec7-ac49-97021b416cb2	63b9f46a-1c8d-42a9-8ab3-7f8a6cf367c7	AVITO-7864416598	\N	Мотоботинки LS2 Zoe Men, 39/40	motobotinki-ls2-zoe-men-39-40-7864416598	new	\N	39/40	12800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864416598, "urlPath": "/moskva/zapchasti_i_aksessuary/motobotinki_ls2_zoe_men_3940_7864416598?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботинки LS2 Zoe Men, 39/40	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864416598/7864416598-1-a975c2ac761c.jpg	{/uploads/imported/avito/7864416598/7864416598-1-a975c2ac761c.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	LS2	t	f	t	f	\N	{"source": "avito", "avitoId": 7864416598}	f	\N	\N
6422131e-761f-4224-9481-ba5b23ef2021	ea7adf5e-caa7-4a3f-a451-e4493dc40955	AVITO-7864747181	\N	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	motoshlem-ls2-ff320-stream-evo-l-59-60-sm-7864747181	new	\N	L	10800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864747181, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_ls2_ff320_stream_evo_l_59-60_sm_7864747181?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864747181/7864747181-1-16199e10e8a0.jpg	{/uploads/imported/avito/7864747181/7864747181-1-16199e10e8a0.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	LS2	t	f	t	f	\N	{"source": "avito", "avitoId": 7864747181}	f	\N	\N
099c94c3-94a3-47e2-8d43-d5ef811e04de	7e5000d8-eaae-489d-a170-b380f5d50f1f	AVITO-7864913050	\N	Мотокуртка RST Isle of Men TT, 48/50	motokurtka-rst-isle-of-men-tt-48-50-7864913050	new	\N	48/50	34800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7864913050, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_rst_isle_of_men_tt_4850_7864913050?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка RST Isle of Men TT, 48/50	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7864913050/7864913050-1-3550f95556c0.jpg	{/uploads/imported/avito/7864913050/7864913050-1-3550f95556c0.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	RST	t	f	t	f	\N	{"source": "avito", "avitoId": 7864913050}	f	\N	\N
f57775b1-72b2-43b9-85fc-c9e14ffc24e3	87bf6089-0d89-4c6e-a1e3-d7be3c195459	AVITO-4664489546	\N	Установочный комплект Cardo Packtalk Edge, оригина	ustanovochnyy-komplekt-cardo-packtalk-edge-origina-4664489546	new	\N	\N	15800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зaчeт пpи покупке н...	{"source": "avito", "avitoId": 4664489546, "urlPath": "/moskva/zapchasti_i_aksessuary/ustanovochnyy_komplekt_cardo_packtalk_edge_origina_4664489546?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Установочный комплект Cardo Packtalk Edge, оригина	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зaчeт пpи покупке н...	\N	/uploads/imported/avito/4664489546/4664489546-1-08fb4022ed88.jpg	{/uploads/imported/avito/4664489546/4664489546-1-08fb4022ed88.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	Cardo	t	f	t	f	\N	{"source": "avito", "avitoId": 4664489546}	f	\N	\N
ab7ecdc2-28a4-49d9-9476-e6402980d086	025548d5-4d92-4d6e-ae1b-f9946c42d518	AVITO-7480889427	\N	Мотокостюм BMW Motorrad GS Rallye Air 2025, 48/50	motokostyum-bmw-motorrad-gs-rallye-air-2025-48-50-7480889427	new	\N	48/50	86800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7480889427, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_bmw_motorrad_gs_rallye_air_2025_4850_7480889427?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм BMW Motorrad GS Rallye Air 2025, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7480889427/7480889427-1-04417423ab0a.jpg	{/uploads/imported/avito/7480889427/7480889427-1-04417423ab0a.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7480889427}	f	\N	\N
ec86723c-0dd9-4588-87a1-72e61f353e6f	5fd1e3a9-2a79-4aca-b542-220b8de3798a	AVITO-7544068246	\N	Мотошлем HJC rpha 12 quartararo, L (58-59 см)	motoshlem-hjc-rpha-12-quartararo-l-58-59-sm-7544068246	new	\N	L	66800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7544068246, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_hjc_rpha_12_quartararo_l_58-59_sm_7544068246?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем HJC rpha 12 quartararo, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7544068246/7544068246-1-08387cdb6d29.jpg	{/uploads/imported/avito/7544068246/7544068246-1-08387cdb6d29.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	HJC	t	f	t	f	\N	{"source": "avito", "avitoId": 7544068246}	f	\N	\N
4774f0d3-e98e-47ea-b4cf-8a305e4763bc	6e186d2e-ff7d-4fdd-9fe8-b97a5a9df966	AVITO-7863934628	\N	Мотошлем Shoei EX-Zero Equation, L (59-60 см)	motoshlem-shoei-ex-zero-equation-l-59-60-sm-7863934628	new	\N	L	44800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7863934628, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_ex-zero_equation_l_59-60_sm_7863934628?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei EX-Zero Equation, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7863934628/7863934628-1-fae41f042dc9.jpg	{/uploads/imported/avito/7863934628/7863934628-1-fae41f042dc9.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7863934628}	f	\N	\N
6133c9e7-799d-4a14-b9c6-8454ca927e76	ce72ec2a-4d2c-4679-a20d-e5c9ff8d3a74	AVITO-7640778058	\N	Защитные дуги Touratech для BMW для R 1300 GS/ADV	zaschitnye-dugi-touratech-dlya-bmw-dlya-r-1300-gs-adv-7640778058	new	\N	\N	54800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7640778058, "urlPath": "/moskva/zapchasti_i_aksessuary/zaschitnye_dugi_touratech_dlya_bmw_dlya_r_1300_gsadv_7640778058?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJRRmg0Z1pMczV6Wnd5WnJCIjt9807fHz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Защитные дуги Touratech для BMW для R 1300 GS/ADV	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7640778058/7640778058-1-76e91b80c30c.jpg	{/uploads/imported/avito/7640778058/7640778058-1-76e91b80c30c.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7640778058}	f	\N	\N
bac74040-d97d-4641-9017-004aa426679f	84686881-c03d-4620-bd77-5f006a8f52c2	AVITO-7864065607	\N	Мотокуртка Alpinestars Motegi Perf., 46/48	motokurtka-alpinestars-motegi-perf-46-48-7864065607	new	\N	46/48	24800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7864065607, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_alpinestars_motegi_perf._4648_7864065607?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Alpinestars Motegi Perf., 46/48	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7864065607/7864065607-1-3c38193f377e.jpg	{/uploads/imported/avito/7864065607/7864065607-1-3c38193f377e.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7864065607}	f	\N	\N
f9e4f491-66cf-421d-b2ea-d4d1605d0f44	71f9b076-07de-4b9f-a725-0c0fc0747770	AVITO-7864252625	\N	Мотоботы Alpinestars SMX-6 V2 Drystar, 43/44	motoboty-alpinestars-smx-6-v2-drystar-43-44-7864252625	new	\N	43/44	28800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864252625, "urlPath": "/moskva/zapchasti_i_aksessuary/motoboty_alpinestars_smx-6_v2_drystar_4344_7864252625?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботы Alpinestars SMX-6 V2 Drystar, 43/44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864252625/7864252625-1-b4cbda8b97d1.jpg	{/uploads/imported/avito/7864252625/7864252625-1-b4cbda8b97d1.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7864252625}	f	\N	\N
8fc43509-30a5-43ad-8882-187e75f09f53	b954b6b1-fb7c-44c8-b659-5d3ae2334567	AVITO-7736588848	\N	Боковые кофры/крепеж на Yamaha Tracer 9 GT/GT+	bokovye-kofry-krepezh-na-yamaha-tracer-9-gt-gt-7736588848	new	\N	\N	69800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7736588848, "urlPath": "/moskva/zapchasti_i_aksessuary/bokovye_kofrykrepezh_na_yamaha_tracer_9_gtgt_7736588848?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Боковые кофры/крепеж на Yamaha Tracer 9 GT/GT+	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7736588848/7736588848-1-af583bb431f8.jpg	{/uploads/imported/avito/7736588848/7736588848-1-af583bb431f8.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	Yamaha	t	f	t	f	\N	{"source": "avito", "avitoId": 7736588848}	f	\N	\N
550696bc-6e33-4787-b7bc-933a5d6e10aa	778189bf-0b0d-49a0-a072-9303a927fb43	AVITO-7864101220	\N	Мотошлем Shoei Hornet ADV Invigorate, L (58-59 см)	motoshlem-shoei-hornet-adv-invigorate-l-58-59-sm-7864101220	new	\N	L	56800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864101220, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_hornet_adv_invigorate_l_58-59_sm_7864101220?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei Hornet ADV Invigorate, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864101220/7864101220-1-5779dbffe4f8.jpg	{/uploads/imported/avito/7864101220/7864101220-1-5779dbffe4f8.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7864101220}	f	\N	\N
df1cdace-d172-4d73-a392-2d0fc0ef4f10	f49122f7-3734-4c3a-96ba-b1947a4552ca	AVITO-7864466629	\N	Мотошлем Shoei Neotec 2 Matt Black, M (56-57 см)	motoshlem-shoei-neotec-2-matt-black-m-56-57-sm-7864466629	new	\N	M	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7864466629, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_neotec_2_matt_black_m_56-57_sm_7864466629?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei Neotec 2 Matt Black, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7864466629/7864466629-1-cb65ef161f41.jpg	{/uploads/imported/avito/7864466629/7864466629-1-cb65ef161f41.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7864466629}	f	\N	\N
10bc01bd-1919-433e-8947-635685bacca3	76baeed6-b9c0-4c40-9967-f0aa34a05329	AVITO-7864502540	\N	Мотокуртка Triumph Leith Khaki, 48/50	motokurtka-triumph-leith-khaki-48-50-7864502540	new	\N	48/50	41800.00	\N	5	0	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	{"source": "avito", "avitoId": 7864502540, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_triumph_leith_khaki_4850_7864502540?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Triumph Leith Khaki, 48/50	Мототом — магазин брендовой мотоэкипировки.\n\nПоможем подобрать экипировку под Ваши задачи.\nВыкупим Baш экип или возьмем в зачёт пpи покупке наших позиций.\nⓂ Приобрести экипировку и запчасти Вы можете в шоуруме, дистанционно или через Авито доставку.\n...	\N	/uploads/imported/avito/7864502540/7864502540-1-fd0912c26e58.jpg	{/uploads/imported/avito/7864502540/7864502540-1-fd0912c26e58.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Triumph	t	f	t	f	\N	{"source": "avito", "avitoId": 7864502540}	f	\N	\N
68018010-001c-42d8-a2da-d9388de51449	c299af0d-9a79-438f-a197-388256e03940	AVITO-7320336373	\N	Мотокостюм Dainese Laguna Seca D1 Perf., 52/54	motokostyum-dainese-laguna-seca-d1-perf-52-54-7320336373	new	\N	52/54	36800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7320336373, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_dainese_laguna_seca_d1_perf._5254_7320336373?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм Dainese Laguna Seca D1 Perf., 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7320336373/7320336373-1-92f35e7c7047.jpg	{/uploads/imported/avito/7320336373/7320336373-1-92f35e7c7047.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7320336373}	f	\N	\N
d873f2d6-8eb1-46b0-8647-286cb5239c08	325f3f7e-8c58-4d72-95c7-a85be087cb73	AVITO-7608520369	\N	Мотокуртка Dainese Agile, 46/48	motokurtka-dainese-agile-46-48-7608520369	new	\N	46/48	34800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7608520369, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_dainese_agile_4648_7608520369?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Dainese Agile, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7608520369/7608520369-1-55c5c95da450.jpg	{/uploads/imported/avito/7608520369/7608520369-1-55c5c95da450.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7608520369}	f	\N	\N
0ba32bc3-cec0-4457-b8e2-375bd1868e0d	2e8abc01-d04b-4d60-a3b9-7718cf4cd88a	AVITO-7672147000	\N	Мотокуртка Dainese Agile, 46/48 и 48/50	motokurtka-dainese-agile-46-48-i-48-50-7672147000	new	\N	46/48	38800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7672147000, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_dainese_agile_4648_i_4850_7672147000?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Dainese Agile, 46/48 и 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7672147000/7672147000-1-7ca06ca57160.jpg	{/uploads/imported/avito/7672147000/7672147000-1-7ca06ca57160.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7672147000}	f	\N	\N
805dfef2-daeb-4140-966a-015bde913f5d	2b45e4f8-b581-4023-be95-ce1e75b4fc2a	AVITO-7672670790	\N	Мотокостюм Dainese Mig Tex Suit, 48/50	motokostyum-dainese-mig-tex-suit-48-50-7672670790	new	\N	48/50	38800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7672670790, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_dainese_mig_tex_suit_4850_7672670790?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм Dainese Mig Tex Suit, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7672670790/7672670790-1-3c4a3f9375db.jpg	{/uploads/imported/avito/7672670790/7672670790-1-3c4a3f9375db.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7672670790}	f	\N	\N
6025023d-a89f-4202-bad7-c8a31b7b79e7	325dc02c-1649-4172-a9b5-893feeeabd2f	AVITO-7800818731	\N	Мотокеды BMW Motorrad Seoul GTX, все размеры	motokedy-bmw-motorrad-seoul-gtx-vse-razmery-7800818731	new	\N	\N	29800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7800818731, "urlPath": "/moskva/zapchasti_i_aksessuary/motokedy_bmw_motorrad_seoul_gtx_vse_razmery_7800818731?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJEUlJHNDFxd0VvMXBSVnJ3Ijt9eCflYz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокеды BMW Motorrad Seoul GTX, все размеры	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7800818731/7800818731-1-db14304a3f98.jpg	{/uploads/imported/avito/7800818731/7800818731-1-db14304a3f98.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7800818731}	f	\N	\N
451617b3-8343-44d6-8fa5-d5ae5ead8e1d	de77c51a-c013-4e43-903b-75441d26d607	AVITO-7928019018	\N	Мотошлем Shark Skwal I30 Hellcat, L (59-60 см)	motoshlem-shark-skwal-i30-hellcat-l-59-60-sm-7928019018	new	\N	L	32800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928019018, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shark_skwal_i30_hellcat_l_59-60_sm_7928019018?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shark Skwal I30 Hellcat, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928019018/7928019018-1-f58b40a66504.jpg	{/uploads/imported/avito/7928019018/7928019018-1-f58b40a66504.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shark	t	f	t	f	\N	{"source": "avito", "avitoId": 7928019018}	f	\N	\N
303e6498-e159-4f2a-8006-01af705bd9ac	a07a0919-887c-4057-b5b3-905b936653a1	AVITO-7544725927	\N	Мотошлем Shoei X-Spirit Pro, 2XL (63-64 см)	motoshlem-shoei-x-spirit-pro-2xl-63-64-sm-7544725927	new	\N	2XL	64800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7544725927, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_x-spirit_pro_2xl_63-64_sm_7544725927?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei X-Spirit Pro, 2XL (63-64 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7544725927/7544725927-1-b44cb28508e1.jpg	{/uploads/imported/avito/7544725927/7544725927-1-b44cb28508e1.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7544725927}	f	\N	\N
2b0c77d6-fc61-4383-847e-dfffebe8ba42	0f33f3a9-6ceb-40c3-82c7-17a9b04d4d67	AVITO-7672297983	\N	Кофры Rugged leather bag set, оригинал	kofry-rugged-leather-bag-set-original-7672297983	new	\N	\N	39800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7672297983, "urlPath": "/moskva/zapchasti_i_aksessuary/kofry_rugged_leather_bag_set_original_7672297983?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Кофры Rugged leather bag set, оригинал	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7672297983/7672297983-1-d0a9c9cb37dc.jpg	{/uploads/imported/avito/7672297983/7672297983-1-d0a9c9cb37dc.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	Rugged	t	f	t	f	\N	{"source": "avito", "avitoId": 7672297983}	f	\N	\N
78f81cec-4e98-4979-90e5-65805a955ba9	17fdfdba-6df9-440d-b590-3c3096bdc5ed	AVITO-7736349737	\N	Мотокуртка Triumph Braddan Sport, 50/52	motokurtka-triumph-braddan-sport-50-52-7736349737	new	\N	50/52	52800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7736349737, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_triumph_braddan_sport_5052_7736349737?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Triumph Braddan Sport, 50/52	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7736349737/7736349737-1-87e9496e7ea6.jpg	{/uploads/imported/avito/7736349737/7736349737-1-87e9496e7ea6.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Triumph	t	f	t	f	\N	{"source": "avito", "avitoId": 7736349737}	f	\N	\N
13bc48bc-fdbf-4bf0-af9e-078ceed25309	43cc4520-3b2f-4bf5-9c8e-c45f34953b43	AVITO-4632740420	\N	Мотокуртка Ducati Speed EVO C1 Alpinestars, 46/48	motokurtka-ducati-speed-evo-c1-alpinestars-46-48-4632740420	new	\N	46/48	38800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 4632740420, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_ducati_speed_evo_c1_alpinestars_4648_4632740420?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Ducati Speed EVO C1 Alpinestars, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/4632740420/4632740420-1-84c17b909b53.jpg	{/uploads/imported/avito/4632740420/4632740420-1-84c17b909b53.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 4632740420}	f	\N	\N
aca7f310-d9e6-4038-a133-24400984645e	02c5203f-ddcd-4710-99f9-d8ed50480785	AVITO-7704176875	\N	Дождевик Proof, 44/46	dozhdevik-proof-44-46-7704176875	new	\N	44/46	5800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7704176875, "urlPath": "/moskva/zapchasti_i_aksessuary/dozhdevik_proof_4446_7704176875?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Дождевик Proof, 44/46	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7704176875/7704176875-1-6ce55a6b6cc7.jpg	{/uploads/imported/avito/7704176875/7704176875-1-6ce55a6b6cc7.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Proof	t	f	t	f	\N	{"source": "avito", "avitoId": 7704176875}	f	\N	\N
4a7bb41f-6287-4baa-ae97-7f98c844ca86	0ea76a0d-4aa4-48cf-b9fe-84bce5e5b79e	AVITO-7512205252	\N	Мотоштаны Alpinestar Stella Courmayeur GTX, 46/48	motoshtany-alpinestar-stella-courmayeur-gtx-46-48-7512205252	new	\N	46/48	6800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7512205252, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_alpinestar_stella_courmayeur_gtx_4648_7512205252?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны Alpinestar Stella Courmayeur GTX, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7512205252/7512205252-1-ea5a626d62b9.jpg	{/uploads/imported/avito/7512205252/7512205252-1-ea5a626d62b9.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7512205252}	f	\N	\N
d4953b56-6724-45c4-b5e6-38f72179c3ac	a9983f68-73bf-4d3d-ac7e-dfc91cb39e9d	AVITO-7512781280	\N	Мотокеды Bmw Motorrad Seoul GTX, 42/43	motokedy-bmw-motorrad-seoul-gtx-42-43-7512781280	new	\N	42/43	29800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7512781280, "urlPath": "/moskva/zapchasti_i_aksessuary/motokedy_bmw_motorrad_seoul_gtx_4243_7512781280?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокеды Bmw Motorrad Seoul GTX, 42/43	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7512781280/7512781280-1-b36de0a64e43.jpg	{/uploads/imported/avito/7512781280/7512781280-1-b36de0a64e43.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7512781280}	f	\N	\N
bcea8f74-56dd-4682-a11e-647be25b33ce	20304a36-e0fd-4236-8a80-845e2cc83ed7	AVITO-7544624011	\N	Мотокуртка BMW Motorrad Swartberg Air, 46-56	motokurtka-bmw-motorrad-swartberg-air-46-56-7544624011	new	\N	\N	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7544624011, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_swartberg_air_46-56_7544624011?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad Swartberg Air, 46-56	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7544624011/7544624011-1-f05a2c6db016.jpg	{/uploads/imported/avito/7544624011/7544624011-1-f05a2c6db016.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7544624011}	f	\N	\N
9cdde859-b3d8-4b2b-b6b2-afcbf881f568	9cffadd3-fb41-4835-a01f-dff2468bd4ac	AVITO-7544755600	\N	Мотоботы BMW Motorrad Gotthard GTX, 42/43 и 44/45	motoboty-bmw-motorrad-gotthard-gtx-42-43-i-44-45-7544755600	new	\N	42/43	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7544755600, "urlPath": "/moskva/zapchasti_i_aksessuary/motoboty_bmw_motorrad_gotthard_gtx_4243_i_4445_7544755600?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботы BMW Motorrad Gotthard GTX, 42/43 и 44/45	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7544755600/7544755600-1-9ed321e6845c.jpg	{/uploads/imported/avito/7544755600/7544755600-1-9ed321e6845c.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7544755600}	f	\N	\N
52ad3e5b-3930-4806-84a4-75c1f54c8005	c18cc3c7-c1e5-4003-b3dc-56cdbbdf6d68	AVITO-7736067660	\N	Мотошлем Shoei Neotec 3 Anthem TC-10, по заказ	motoshlem-shoei-neotec-3-anthem-tc-10-po-zakaz-7736067660	new	\N	\N	69800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7736067660, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_neotec_3_anthem_tc-10_po_zakaz_7736067660?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei Neotec 3 Anthem TC-10, по заказ	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7736067660/7736067660-1-3d56416558fb.jpg	{/uploads/imported/avito/7736067660/7736067660-1-3d56416558fb.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7736067660}	f	\N	\N
ba327720-48d3-4996-a1b3-45aac35a9f0b	c341e36d-0c07-4daf-b14e-31781fee646f	AVITO-7736258176	\N	Мотоперчатки Dainese Full Metall 7, L/9,5	motoperchatki-dainese-full-metall-7-l-9-5-7736258176	new	\N	L	36800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7736258176, "urlPath": "/moskva/zapchasti_i_aksessuary/motoperchatki_dainese_full_metall_7_l95_7736258176?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJQdXdGbnBLS0ZSNHo0OUFlIjt9EDwKmj8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоперчатки Dainese Full Metall 7, L/9,5	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7736258176/7736258176-1-93a2c923f3cb.jpg	{/uploads/imported/avito/7736258176/7736258176-1-93a2c923f3cb.jpg}	2616dcf4-5603-4979-bf1b-d83c02cee6a3	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7736258176}	f	\N	\N
943c67b6-23ee-44af-a5bf-1a6a86a03b57	50fa2ad3-72ce-4856-893e-f91fe7f96d2b	AVITO-7512214475	\N	Мотоштаны Bmw Motorrad GS Rallye, 42/44	motoshtany-bmw-motorrad-gs-rallye-42-44-7512214475	new	\N	42/44	24800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7512214475, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_bmw_motorrad_gs_rallye_4244_7512214475?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны Bmw Motorrad GS Rallye, 42/44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7512214475/7512214475-1-a77766fe2db9.jpg	{/uploads/imported/avito/7512214475/7512214475-1-a77766fe2db9.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7512214475}	f	\N	\N
c21d6ba4-3d58-446e-8bb2-1f45f70ca9f2	d58bc6e7-f7e3-4e32-aad2-77d4fecfa7ad	AVITO-7736830684	\N	Мотошлем BMW Sao Paulo Urban, L (58-60 см)	motoshlem-bmw-sao-paulo-urban-l-58-60-sm-7736830684	new	\N	L	34800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7736830684, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_bmw_sao_paulo_urban_l_58-60_sm_7736830684?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем BMW Sao Paulo Urban, L (58-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7736830684/7736830684-1-25445c030c2f.jpg	{/uploads/imported/avito/7736830684/7736830684-1-25445c030c2f.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7736830684}	f	\N	\N
32590089-2833-4a30-8a5f-a370c52b406d	28da7917-910b-4f6d-981d-157a7c370b62	AVITO-7672007868	\N	Мотошлем Icon Airflite bugoid Blue, M (56-57 см)	motoshlem-icon-airflite-bugoid-blue-m-56-57-sm-7672007868	new	\N	M	28800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7672007868, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_icon_airflite_bugoid_blue_m_56-57_sm_7672007868?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Icon Airflite bugoid Blue, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7672007868/7672007868-1-b6b2f93d1353.jpg	{/uploads/imported/avito/7672007868/7672007868-1-b6b2f93d1353.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Icon	t	f	t	f	\N	{"source": "avito", "avitoId": 7672007868}	f	\N	\N
faabc688-e735-48c0-b0e9-9382adc5f3b8	713fa632-6be8-4202-9f72-24a9ab02c93b	AVITO-4537431286	\N	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	motoshlem-ls2-ff320-stream-evo-l-59-60-sm-4537431286	new	\N	L	10800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 4537431286, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_ls2_ff320_stream_evo_l_59-60_sm_4537431286?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем LS2 FF320 stream EVO, L (59-60 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/4537431286/4537431286-1-750a741a4937.jpg	{/uploads/imported/avito/4537431286/4537431286-1-750a741a4937.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	LS2	t	f	t	f	\N	{"source": "avito", "avitoId": 4537431286}	f	\N	\N
ea01403a-1c86-4918-8306-dfa3a092f6ff	df717577-f335-4759-aad3-40fd37132b0f	AVITO-7768422676	\N	Мотодождевик BMW Motorrad Rainlock, все размеры	motodozhdevik-bmw-motorrad-rainlock-vse-razmery-7768422676	new	\N	\N	34800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7768422676, "urlPath": "/moskva/zapchasti_i_aksessuary/motodozhdevik_bmw_motorrad_rainlock_vse_razmery_7768422676?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотодождевик BMW Motorrad Rainlock, все размеры	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7768422676/7768422676-1-79472c561541.jpg	{/uploads/imported/avito/7768422676/7768422676-1-79472c561541.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7768422676}	f	\N	\N
56405cfe-62df-43e3-9fcc-1e1b8567edcb	36dfda30-2d73-4a52-a921-a6bcea302917	AVITO-7320173682	\N	Мотошлем Icon Airflite El Centro, M (56-57 см)	motoshlem-icon-airflite-el-centro-m-56-57-sm-7320173682	new	\N	M	26800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7320173682, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_icon_airflite_el_centro_m_56-57_sm_7320173682?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Icon Airflite El Centro, M (56-57 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7320173682/7320173682-1-7158a677f6e0.jpg	{/uploads/imported/avito/7320173682/7320173682-1-7158a677f6e0.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Icon	t	f	t	f	\N	{"source": "avito", "avitoId": 7320173682}	f	\N	\N
84bdd096-d4ea-47c5-80ef-fbb5551ef223	0e06d121-776a-49ee-bc19-cb952499ac7a	AVITO-7320334642	\N	Комплект кофров BMW Motorrad Atacama, оригинал	komplekt-kofrov-bmw-motorrad-atacama-original-7320334642	new	\N	\N	148800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7320334642, "urlPath": "/moskva/zapchasti_i_aksessuary/komplekt_kofrov_bmw_motorrad_atacama_original_7320334642?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Комплект кофров BMW Motorrad Atacama, оригинал	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7320334642/7320334642-1-c496e1927bb5.jpg	{/uploads/imported/avito/7320334642/7320334642-1-c496e1927bb5.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7320334642}	f	\N	\N
1b86cf75-ddb1-4ad9-ac56-ffb1592968a4	e88ec078-1649-4b2a-911f-198b953cd6a7	AVITO-7320538670	\N	Мотокуртка Spidi Ring, 52/54	motokurtka-spidi-ring-52-54-7320538670	new	\N	52/54	18800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7320538670, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_spidi_ring_5254_7320538670?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Spidi Ring, 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7320538670/7320538670-1-3a63177be9db.jpg	{/uploads/imported/avito/7320538670/7320538670-1-3a63177be9db.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Spidi	t	f	t	f	\N	{"source": "avito", "avitoId": 7320538670}	f	\N	\N
9e0f49b4-bcb1-44b8-951e-b985d2247d5b	49d4e790-2ce3-4b9a-aa27-f5eae530eab5	AVITO-7352095298	\N	Мотошлем Schuberth S2 Sport Redux, L (58-59 см)	motoshlem-schuberth-s2-sport-redux-l-58-59-sm-7352095298	new	\N	L	29800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7352095298, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_schuberth_s2_sport_redux_l_58-59_sm_7352095298?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Schuberth S2 Sport Redux, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7352095298/7352095298-1-4b59a09e2fe7.jpg	{/uploads/imported/avito/7352095298/7352095298-1-4b59a09e2fe7.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Schuberth	t	f	t	f	\N	{"source": "avito", "avitoId": 7352095298}	f	\N	\N
8724dd1f-8b77-4dde-b828-1654f947ef5d	f2e10d46-43c4-47fe-be4b-914540f5d743	AVITO-7352220119	\N	Мотошлем Arai RX-7 GP Matt Black, M (57-58 см)	motoshlem-arai-rx-7-gp-matt-black-m-57-58-sm-7352220119	new	\N	M	27800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7352220119, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_arai_rx-7_gp_matt_black_m_57-58_sm_7352220119?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Arai RX-7 GP Matt Black, M (57-58 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7352220119/7352220119-1-73e6959e3259.jpg	{/uploads/imported/avito/7352220119/7352220119-1-73e6959e3259.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Arai	t	f	t	f	\N	{"source": "avito", "avitoId": 7352220119}	f	\N	\N
41b64525-95e7-4a23-b65b-3266d45f308a	3d2db6d7-cf99-4882-9d37-9ca7fbf2e51c	AVITO-7384018177	\N	Мотошлем Schuberth S2 + Sena, XL (60-62 см)	motoshlem-schuberth-s2-sena-xl-60-62-sm-7384018177	new	\N	XL	29800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7384018177, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_schuberth_s2_sena_xl_60-62_sm_7384018177?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJNekkwMTVNSlR5bVBCbHlKIjt9xKvt1T8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Schuberth S2 + Sena, XL (60-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7384018177/7384018177-1-193989cac34b.jpg	{/uploads/imported/avito/7384018177/7384018177-1-193989cac34b.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Schuberth	t	f	t	f	\N	{"source": "avito", "avitoId": 7384018177}	f	\N	\N
7343b8f6-90c8-465d-8f11-46ae7f02625d	4bb9d8a4-6dbb-49e2-8e04-b8b2f10360ad	AVITO-7704124165	\N	Мотокуртка сетка Harley-Davidson Mesh Air Lady, 48	motokurtka-setka-harley-davidson-mesh-air-lady-48-7704124165	new	\N	\N	16800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7704124165, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_setka_harley-davidson_mesh_air_lady_48_7704124165?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка сетка Harley-Davidson Mesh Air Lady, 48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7704124165/7704124165-1-1e943d49dd1c.jpg	{/uploads/imported/avito/7704124165/7704124165-1-1e943d49dd1c.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Harley-Davidson	t	f	t	f	\N	{"source": "avito", "avitoId": 7704124165}	f	\N	\N
84ac3134-fd2d-45d0-93fb-4e403e04461c	9c652937-d5d4-49ba-b6ab-5e1a9a1717c9	AVITO-7704307642	\N	Мотоштаны Spidi Traveler 3, 46/48	motoshtany-spidi-traveler-3-46-48-7704307642	new	\N	46/48	21800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7704307642, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_spidi_traveler_3_4648_7704307642?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны Spidi Traveler 3, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7704307642/7704307642-1-576fb538ac62.jpg	{/uploads/imported/avito/7704307642/7704307642-1-576fb538ac62.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Spidi	t	f	t	f	\N	{"source": "avito", "avitoId": 7704307642}	f	\N	\N
1ebd696e-dda3-4263-8c5c-42e34f65e55a	ebb40545-94f5-452d-a7fd-8d8412118e81	AVITO-7704345074	\N	Мотошлем Schuberth R2, S (54-56 см)	motoshlem-schuberth-r2-s-54-56-sm-7704345074	new	\N	S	29800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7704345074, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_schuberth_r2_s_54-56_sm_7704345074?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Schuberth R2, S (54-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7704345074/7704345074-1-7011250beb8e.jpg	{/uploads/imported/avito/7704345074/7704345074-1-7011250beb8e.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Schuberth	t	f	t	f	\N	{"source": "avito", "avitoId": 7704345074}	f	\N	\N
3c1e1a31-a2f0-42b0-81d9-dadc4be4ac5c	4d1e8b59-c9a0-4167-a80b-5a86e83419a3	AVITO-7704370492	\N	Мотоботы Alpinestars Fastback 2 Drystar WP, 39/40	motoboty-alpinestars-fastback-2-drystar-wp-39-40-7704370492	new	\N	39/40	16800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7704370492, "urlPath": "/moskva/zapchasti_i_aksessuary/motoboty_alpinestars_fastback_2_drystar_wp_3940_7704370492?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботы Alpinestars Fastback 2 Drystar WP, 39/40	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7704370492/7704370492-1-6957f619d9d5.jpg	{/uploads/imported/avito/7704370492/7704370492-1-6957f619d9d5.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7704370492}	f	\N	\N
49f25d0b-d106-40f3-9c92-6d5dfdc3f782	da79cf44-abf5-426c-8412-bf84621a685d	AVITO-7704413276	\N	Мотоботы Touratech Destino Adventure, 42/43	motoboty-touratech-destino-adventure-42-43-7704413276	new	\N	42/43	36800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7704413276, "urlPath": "/moskva/zapchasti_i_aksessuary/motoboty_touratech_destino_adventure_4243_7704413276?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботы Touratech Destino Adventure, 42/43	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7704413276/7704413276-1-e68a0329eb48.jpg	{/uploads/imported/avito/7704413276/7704413276-1-e68a0329eb48.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Touratech	t	f	t	f	\N	{"source": "avito", "avitoId": 7704413276}	f	\N	\N
817712f9-59cc-4cdd-9f31-7f2d0522d0b8	e154af78-9f05-4fb8-8f95-a014b4d89c7d	AVITO-7704416305	\N	Мотокуртка Ducati 80S 14 Black, 42/44	motokurtka-ducati-80s-14-black-42-44-7704416305	new	\N	42/44	24800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7704416305, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_ducati_80s_14_black_4244_7704416305?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Ducati 80S 14 Black, 42/44	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7704416305/7704416305-1-c1e9c765a93b.jpg	{/uploads/imported/avito/7704416305/7704416305-1-c1e9c765a93b.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Ducati	t	f	t	f	\N	{"source": "avito", "avitoId": 7704416305}	f	\N	\N
632b398e-f044-4a36-bffe-9d10d2641900	ec25bc27-a069-450f-b06c-38db10b5e658	AVITO-7704730307	\N	Мотошлем с гарнитурой BMW Motorrad System 7, L	motoshlem-s-garnituroy-bmw-motorrad-system-7-l-7704730307	new	\N	L	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7704730307, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_s_garnituroy_bmw_motorrad_system_7_l_7704730307?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем с гарнитурой BMW Motorrad System 7, L	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7704730307/7704730307-1-116083e4dcd3.jpg	{/uploads/imported/avito/7704730307/7704730307-1-116083e4dcd3.jpg}	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7704730307}	f	\N	\N
88b8d360-2696-4f62-a9e8-2c5be22f1d7a	0278e095-4605-4fe8-b5ab-c610e34bcb98	AVITO-7704768455	\N	Мотошлем BMW Motorrad GS Carbon Evo, XL (59-61 см)	motoshlem-bmw-motorrad-gs-carbon-evo-xl-59-61-sm-7704768455	new	\N	XL	59800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7704768455, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_bmw_motorrad_gs_carbon_evo_xl_59-61_sm_7704768455?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем BMW Motorrad GS Carbon Evo, XL (59-61 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7704768455/7704768455-1-bcc94d2fdf29.jpg	{/uploads/imported/avito/7704768455/7704768455-1-bcc94d2fdf29.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7704768455}	f	\N	\N
1c3f350d-b965-42b0-83fd-6b38bd0a6789	26aa5ce3-0c77-4747-8722-d41b0843e267	AVITO-7736754113	\N	Мотошлем Shoei Hornet ADV V2 KTM, S (54-56 см)	motoshlem-shoei-hornet-adv-v2-ktm-s-54-56-sm-7736754113	new	\N	S	44800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7736754113, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_hornet_adv_v2_ktm_s_54-56_sm_7736754113?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei Hornet ADV V2 KTM, S (54-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7736754113/7736754113-1-acf6d8659014.jpg	{/uploads/imported/avito/7736754113/7736754113-1-acf6d8659014.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7736754113}	f	\N	\N
3c8790d0-8e36-4d1a-8daf-4e9198c0e268	783989dd-2c10-465b-b9b1-937457ff807b	AVITO-7768033759	\N	Мотокостюм BMW Motorrad Airflow, 48/50	motokostyum-bmw-motorrad-airflow-48-50-7768033759	new	\N	48/50	44800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7768033759, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_bmw_motorrad_airflow_4850_7768033759?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм BMW Motorrad Airflow, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7768033759/7768033759-1-3d884041e8d9.jpg	{/uploads/imported/avito/7768033759/7768033759-1-3d884041e8d9.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7768033759}	f	\N	\N
9c7cd6f4-c5c6-4e7c-ba86-d9d1960b9bd7	0bb3456d-817e-4bf8-8422-856074115072	AVITO-7608798392	\N	Мотокостюм BMW Motorrad GS Adrar, 52/54	motokostyum-bmw-motorrad-gs-adrar-52-54-7608798392	new	\N	52/54	78800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7608798392, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_bmw_motorrad_gs_adrar_5254_7608798392?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм BMW Motorrad GS Adrar, 52/54	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7608798392/7608798392-1-2f2be234fd01.jpg	{/uploads/imported/avito/7608798392/7608798392-1-2f2be234fd01.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7608798392}	f	\N	\N
a47d5b69-3f55-4659-aeb8-04d02ca0a81d	611361e8-3728-47a8-9264-59ff592a6ed8	AVITO-7640131998	\N	Защита фары Touratech для BMW R 1300 GS ADV	zaschita-fary-touratech-dlya-bmw-r-1300-gs-adv-7640131998	new	\N	\N	18800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7640131998, "urlPath": "/moskva/zapchasti_i_aksessuary/zaschita_fary_touratech_dlya_bmw_r_1300_gs_adv_7640131998?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJpVmdNWnF3aDhIOUM5dVVkIjt9fHn5YT8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Защита фары Touratech для BMW R 1300 GS ADV	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7640131998/7640131998-1-401b7731cd55.jpg	{/uploads/imported/avito/7640131998/7640131998-1-401b7731cd55.jpg}	996aad3a-b88b-4264-b999-ed42ac852b86	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7640131998}	f	\N	\N
d035bc81-a7e7-4101-97fc-9212b814788b	eff90c64-7ce9-4189-b643-8e5b0d6ce46b	AVITO-7448184351	\N	Мотошлем Shoei GT-Air 2 Panorama TC-8, L (59-60 см	motoshlem-shoei-gt-air-2-panorama-tc-8-l-59-60-sm-7448184351	new	\N	L	44800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7448184351, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_gt-air_2_panorama_tc-8_l_59-60_sm_7448184351?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei GT-Air 2 Panorama TC-8, L (59-60 см	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7448184351/7448184351-1-9f011e90c2fd.jpg	{/uploads/imported/avito/7448184351/7448184351-1-9f011e90c2fd.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7448184351}	f	\N	\N
83468281-ba60-44c4-9d9e-e8e8d2c82d39	3141ee39-04f8-4ce1-8ede-5b33d55f3380	AVITO-7448566160	\N	Мотошлем BMW Motorrad System 7 Carbon, XS/53-54 см	motoshlem-bmw-motorrad-system-7-carbon-xs-53-54-sm-7448566160	new	\N	XS	33800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7448566160, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_bmw_motorrad_system_7_carbon_xs53-54_sm_7448566160?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем BMW Motorrad System 7 Carbon, XS/53-54 см	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7448566160/7448566160-1-823f6d19dc56.jpg	{/uploads/imported/avito/7448566160/7448566160-1-823f6d19dc56.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7448566160}	f	\N	\N
c3a1a2e2-eed2-422c-9e90-7dbd5e104587	8b7285c1-8729-4391-8d1a-5d355a9205a5	AVITO-7448586310	\N	Мотошлем Shoei GT Air 2 Matt Black, S (55-56 см)	motoshlem-shoei-gt-air-2-matt-black-s-55-56-sm-7448586310	new	\N	S	36800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7448586310, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_gt_air_2_matt_black_s_55-56_sm_7448586310?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei GT Air 2 Matt Black, S (55-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7448586310/7448586310-1-eee99047488e.jpg	{/uploads/imported/avito/7448586310/7448586310-1-eee99047488e.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7448586310}	f	\N	\N
747c8b72-8b76-441d-9848-1338d9a3a105	e1f9e8a9-1973-47f7-8a63-a950912c2bfa	AVITO-7512174969	\N	Мотошлем BMW Motorrad Street X, М (57-58 см)	motoshlem-bmw-motorrad-street-x-m-57-58-sm-7512174969	new	\N	57-58	26800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7512174969, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_bmw_motorrad_street_x_m_57-58_sm_7512174969?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем BMW Motorrad Street X, М (57-58 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7512174969/7512174969-1-b60177a3aa38.jpg	{/uploads/imported/avito/7512174969/7512174969-1-b60177a3aa38.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7512174969}	f	\N	\N
1bca3b57-26d6-4d93-ad61-889d235d53a1	042e4e03-5a9a-47a6-bb3e-79008e753e19	AVITO-7544181655	\N	Мотошлем Shoei Neotec 2 Matt Black, XL (61-62 см)	motoshlem-shoei-neotec-2-matt-black-xl-61-62-sm-7544181655	new	\N	XL	41800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7544181655, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_neotec_2_matt_black_xl_61-62_sm_7544181655?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei Neotec 2 Matt Black, XL (61-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7544181655/7544181655-1-81bfa872c6db.jpg	{/uploads/imported/avito/7544181655/7544181655-1-81bfa872c6db.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7544181655}	f	\N	\N
4628194b-4a19-430c-b96e-1c17b90a32b7	4d2e06ad-52cf-4b20-88d6-938badafad9a	AVITO-7544833478	\N	Мотокуртка IXS Tour Lorin-ST, 48, 50, 52, 54, 56	motokurtka-ixs-tour-lorin-st-48-50-52-54-56-7544833478	new	\N	\N	20800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7544833478, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_ixs_tour_lorin-st_48_50_52_54_56_7544833478?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка IXS Tour Lorin-ST, 48, 50, 52, 54, 56	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7544833478/7544833478-1-9768f0453763.jpg	{/uploads/imported/avito/7544833478/7544833478-1-9768f0453763.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	IXS	t	f	t	f	\N	{"source": "avito", "avitoId": 7544833478}	f	\N	\N
a438d7c2-332b-43b7-ade4-7b9769e53407	b02c6fe2-3a9f-44ab-92c9-1485f08e6b69	AVITO-7608031301	\N	Мотокуртка Dainese Rapida Lady, 46/48	motokurtka-dainese-rapida-lady-46-48-7608031301	new	\N	46/48	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7608031301, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_dainese_rapida_lady_4648_7608031301?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Dainese Rapida Lady, 46/48	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7608031301/7608031301-1-92aec162ebd9.jpg	{/uploads/imported/avito/7608031301/7608031301-1-92aec162ebd9.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7608031301}	f	\N	\N
7900489b-ef86-42c0-b9bc-688aa76f7e1c	9e117f9e-6c43-49cf-8736-6abbe4a632b3	AVITO-7608404013	\N	Мотокуртка HolyFreedom Quattro Evolution, 52/54	motokurtka-holyfreedom-quattro-evolution-52-54-7608404013	new	\N	52/54	38800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7608404013, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_holyfreedom_quattro_evolution_5254_7608404013?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка HolyFreedom Quattro Evolution, 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7608404013/7608404013-1-698fe2201d5f.jpg	{/uploads/imported/avito/7608404013/7608404013-1-698fe2201d5f.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	HolyFreedom	t	f	t	f	\N	{"source": "avito", "avitoId": 7608404013}	f	\N	\N
03cfe7b3-6a95-4063-bb95-afeb24af5866	a337f56e-f70f-492e-a780-16859238939c	AVITO-7608679589	\N	Мотоштаны Alpinestars Bogota Pro Drystar, 48/50	motoshtany-alpinestars-bogota-pro-drystar-48-50-7608679589	new	\N	48/50	28800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки на вторичном рынке с крупнейшим выбором.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зaчeт пpи покупке н...	{"source": "avito", "avitoId": 7608679589, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_alpinestars_bogota_pro_drystar_4850_7608679589?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны Alpinestars Bogota Pro Drystar, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки на вторичном рынке с крупнейшим выбором.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зaчeт пpи покупке н...	\N	/uploads/imported/avito/7608679589/7608679589-1-24d2486139ac.jpg	{/uploads/imported/avito/7608679589/7608679589-1-24d2486139ac.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7608679589}	f	\N	\N
76bed372-a0b9-48d6-94c6-8a0c343e991c	97039ad1-5b91-48f9-85e1-064f1841c38e	AVITO-7640660738	\N	Мотошлем Icon Airflite Fayder Red, L (58-59 см)	motoshlem-icon-airflite-fayder-red-l-58-59-sm-7640660738	new	\N	L	26800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7640660738, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_icon_airflite_fayder_red_l_58-59_sm_7640660738?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Icon Airflite Fayder Red, L (58-59 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7640660738/7640660738-1-e7db86fca5e4.jpg	{/uploads/imported/avito/7640660738/7640660738-1-e7db86fca5e4.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Icon	t	f	t	f	\N	{"source": "avito", "avitoId": 7640660738}	f	\N	\N
3dc4190e-a41d-49cd-88de-363ea8da0568	44f54390-ddf5-4c64-8dfe-649545a892f0	AVITO-7672506758	\N	Мотошлем AGV K6 Flash, S (55-56 см)	motoshlem-agv-k6-flash-s-55-56-sm-7672506758	new	\N	S	36800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7672506758, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_agv_k6_flash_s_55-56_sm_7672506758?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем AGV K6 Flash, S (55-56 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7672506758/7672506758-1-cfe2c8da76a2.jpg	{/uploads/imported/avito/7672506758/7672506758-1-cfe2c8da76a2.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	AGV	t	f	t	f	\N	{"source": "avito", "avitoId": 7672506758}	f	\N	\N
0948061c-1030-4da9-8f38-714167c908f1	85ab82eb-cd4e-479d-9869-b585c54d55b6	AVITO-7703966270	\N	Мотошлем Icon Airform Manik'RR mips, М (57-58 см)	motoshlem-icon-airform-manik-rr-mips-m-57-58-sm-7703966270	new	\N	57-58	21800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7703966270, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_icon_airform_manikrr_mips_m_57-58_sm_7703966270?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiI0Z0dWNEMxd0k4RGlEbkhxIjt9n0_HOz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Icon Airform Manik'RR mips, М (57-58 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7703966270/7703966270-1-30727351fd2c.jpg	{/uploads/imported/avito/7703966270/7703966270-1-30727351fd2c.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Icon	t	f	t	f	\N	{"source": "avito", "avitoId": 7703966270}	f	\N	\N
1cdaceb6-21ee-4445-a53c-522a2e208b5e	44137d9a-e821-409e-98a4-1ed2d421863d	AVITO-7736502568	\N	Мотоштаны кожаные Dainese Delta Pro, 54/56	motoshtany-kozhanye-dainese-delta-pro-54-56-7736502568	new	\N	54/56	19800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7736502568, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshtany_kozhanye_dainese_delta_pro_5456_7736502568?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоштаны кожаные Dainese Delta Pro, 54/56	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7736502568/7736502568-1-fa268bcaf297.jpg	{/uploads/imported/avito/7736502568/7736502568-1-fa268bcaf297.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7736502568}	f	\N	\N
40c5e931-37eb-46a8-9588-b1f20765de5e	0887cb1a-7784-4839-b7e3-e7906f4f0e1e	AVITO-7736543866	\N	Мотокостюм Shima Jet, 48/50	motokostyum-shima-jet-48-50-7736543866	new	\N	48/50	36800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7736543866, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_shima_jet_4850_7736543866?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм Shima Jet, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7736543866/7736543866-1-b55d42cf3573.jpg	{/uploads/imported/avito/7736543866/7736543866-1-b55d42cf3573.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Shima	t	f	t	f	\N	{"source": "avito", "avitoId": 7736543866}	f	\N	\N
847d18e5-ffea-412e-8d67-da230ef98679	b1400cb4-9f05-4bc0-a752-56a59e3943a5	AVITO-7736617671	\N	Мотокуртка Triumph Braddan Blue, 48/50	motokurtka-triumph-braddan-blue-48-50-7736617671	new	\N	48/50	52800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7736617671, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_triumph_braddan_blue_4850_7736617671?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Triumph Braddan Blue, 48/50	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7736617671/7736617671-1-5f9815e8a450.jpg	{/uploads/imported/avito/7736617671/7736617671-1-5f9815e8a450.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Triumph	t	f	t	f	\N	{"source": "avito", "avitoId": 7736617671}	f	\N	\N
fe67f84b-9d6c-4f93-8a52-5905b1f8d9d1	936cf4fc-9d29-4f76-b9cb-64c466d5aeee	AVITO-7544068978	\N	Мотошлем Shoei Neotec 2 + Sena SRL, XL (61-62 см)	motoshlem-shoei-neotec-2-sena-srl-xl-61-62-sm-7544068978	new	\N	XL	36800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7544068978, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_neotec_2_sena_srl_xl_61-62_sm_7544068978?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотошлем Shoei Neotec 2 + Sena SRL, XL (61-62 см)	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7544068978/7544068978-1-16d8ad62b4ee.jpg	{/uploads/imported/avito/7544068978/7544068978-1-16d8ad62b4ee.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7544068978}	f	\N	\N
0ad99c61-0a92-48bb-ba1f-a7ff03051404	1c4c9b42-22f1-43e3-883d-37d633ac73a9	AVITO-4472548492	\N	Мотоботы Alpinestars Faster-3 Rideknit KTM, 41/42	motoboty-alpinestars-faster-3-rideknit-ktm-41-42-4472548492	new	\N	41/42	14800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 4472548492, "urlPath": "/moskva/zapchasti_i_aksessuary/motoboty_alpinestars_faster-3_rideknit_ktm_4142_4472548492?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботы Alpinestars Faster-3 Rideknit KTM, 41/42	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/4472548492/4472548492-1-a6c77a8e9970.jpg	{/uploads/imported/avito/4472548492/4472548492-1-a6c77a8e9970.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 4472548492}	f	\N	\N
38e5df8e-128d-46ba-88bb-16e470adf01d	29af24f5-c6ce-4ce6-be4f-4d96944bf132	AVITO-7928131471	\N	Мотокуртка BMW Motorrad Rallye, 48/50	motokurtka-bmw-motorrad-rallye-48-50-7928131471	new	\N	48/50	48800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928131471, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_rallye_4850_7928131471?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad Rallye, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928131471/7928131471-1-0501986bcbdf.jpg	{/uploads/imported/avito/7928131471/7928131471-1-0501986bcbdf.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7928131471}	f	\N	\N
799895d5-b8c4-44c7-8182-b2177048ce40	92b9cda5-3049-4228-8186-5790cfea28a3	AVITO-7928660461	\N	Мотокуртка BMW Motorrad Glandon Air Grey, 50/52	motokurtka-bmw-motorrad-glandon-air-grey-50-52-7928660461	new	\N	50/52	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928660461, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_glandon_air_grey_5052_7928660461?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad Glandon Air Grey, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928660461/7928660461-1-57f6b20088c6.jpg	{/uploads/imported/avito/7928660461/7928660461-1-57f6b20088c6.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7928660461}	f	\N	\N
56d1cf89-2d91-4a9c-9173-879804f72c66	1317eb21-b9d4-49af-928d-ec6ae0222913	AVITO-7928827958	\N	Мотокуртка BMW Motorrad Glandon Air Grey, 48/50	motokurtka-bmw-motorrad-glandon-air-grey-48-50-7928827958	new	\N	48/50	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928827958, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_glandon_air_grey_4850_7928827958?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad Glandon Air Grey, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928827958/7928827958-1-dabf709131de.jpg	{/uploads/imported/avito/7928827958/7928827958-1-dabf709131de.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7928827958}	f	\N	\N
fbe760ad-faaf-4e76-9467-343715af4ae3	4feffbf6-17cd-42f6-b903-df5f950e4897	AVITO-7928106347	\N	Мотокостюм Alpinestars Motegi v2 2PC, 52/54	motokostyum-alpinestars-motegi-v2-2pc-52-54-7928106347	new	\N	52/54	69800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928106347, "urlPath": "/moskva/zapchasti_i_aksessuary/motokostyum_alpinestars_motegi_v2_2pc_5254_7928106347?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокостюм Alpinestars Motegi v2 2PC, 52/54	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928106347/7928106347-1-56de2eec60ab.jpg	{/uploads/imported/avito/7928106347/7928106347-1-56de2eec60ab.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7928106347}	f	\N	\N
7bb08243-eb55-4dbf-9da0-e376a65dca9d	bf694020-d068-4cdf-ae41-543c9738be41	AVITO-7928535833	\N	Мотожилет защитный BMW Protector Vest, L, XL	motozhilet-zaschitnyy-bmw-protector-vest-l-xl-7928535833	new	\N	L	18800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928535833, "urlPath": "/moskva/zapchasti_i_aksessuary/motozhilet_zaschitnyy_bmw_protector_vest_l_xl_7928535833?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотожилет защитный BMW Protector Vest, L, XL	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928535833/7928535833-1-274a65500d82.jpg	{/uploads/imported/avito/7928535833/7928535833-1-274a65500d82.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7928535833}	f	\N	\N
3350ec81-a652-4996-a806-505c7e6d9d3a	fb0b8c57-a3be-4fa2-9620-16976969bd31	AVITO-7928223307	\N	Мотокуртка BMW Motorrad Fleece, 50/52	motokurtka-bmw-motorrad-fleece-50-52-7928223307	new	\N	50/52	14800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928223307, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_fleece_5052_7928223307?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad Fleece, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928223307/7928223307-1-21a42ecc9962.jpg	{/uploads/imported/avito/7928223307/7928223307-1-21a42ecc9962.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7928223307}	f	\N	\N
36d905d5-a12d-4935-bc80-c2e58e2d607d	4bbdfbcf-1325-4534-80d3-d7e189bd944c	AVITO-7928697980	\N	Куртка-софтшелл BMW Motorrad Softshell, 48/50	kurtka-softshell-bmw-motorrad-softshell-48-50-7928697980	new	\N	48/50	16800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7928697980, "urlPath": "/moskva/zapchasti_i_aksessuary/kurtka-softshell_bmw_motorrad_softshell_4850_7928697980?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJwS1BFTFo5dEl3RWZDdDRrIjt9Kysezz8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Куртка-софтшелл BMW Motorrad Softshell, 48/50	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7928697980/7928697980-1-37de629abc34.jpg	{/uploads/imported/avito/7928697980/7928697980-1-37de629abc34.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7928697980}	f	\N	\N
6fb5e1ed-78b8-4471-a204-80b7e9efd4af	b4935ee6-3025-428f-b035-1286093e2180	AVITO-7640719968	\N	Визор CNS-1C+Pinlock для Shoei GT Air 3, оригин	vizor-cns-1c-pinlock-dlya-shoei-gt-air-3-origin-7640719968	new	\N	\N	8800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7640719968, "urlPath": "/moskva/zapchasti_i_aksessuary/vizor_cns-1cpinlock_dlya_shoei_gt_air_3_origin_7640719968?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Визор CNS-1C+Pinlock для Shoei GT Air 3, оригин	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7640719968/7640719968-1-2aab8e83ba06.jpg	{/uploads/imported/avito/7640719968/7640719968-1-2aab8e83ba06.jpg}	7ca777fd-cfba-49e4-93ce-d3bcfaf940f2	\N	\N	\N	Shoei	t	f	t	f	\N	{"source": "avito", "avitoId": 7640719968}	f	\N	\N
9c484644-ee8b-4e48-8c8b-dffb81a58f15	2976ff70-15bd-4202-ba43-a7db0dfc4737	AVITO-7672381094	\N	Мотокуртка Alpinestars GP Plus R V3, 52/54	motokurtka-alpinestars-gp-plus-r-v3-52-54-7672381094	new	\N	52/54	48800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7672381094, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_alpinestars_gp_plus_r_v3_5254_7672381094?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Alpinestars GP Plus R V3, 52/54	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7672381094/7672381094-1-81d5af0f10db.jpg	{/uploads/imported/avito/7672381094/7672381094-1-81d5af0f10db.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Alpinestars	t	f	t	f	\N	{"source": "avito", "avitoId": 7672381094}	f	\N	\N
76d01878-0ff4-499c-81f7-b3c7624aace8	54452e02-37b0-4a9a-bf52-7b16edfdf530	AVITO-7672566789	\N	Мотокуртка Dainese Agile Black, 46/48	motokurtka-dainese-agile-black-46-48-7672566789	new	\N	46/48	39800.00	\N	5	0	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	{"source": "avito", "avitoId": 7672566789, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_dainese_agile_black_4648_7672566789?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Dainese Agile Black, 46/48	Мототом.\n\nШоурум брендовой мотоэкипировки с крупнейшим выбором на вторичном рынке.\n\nВесь ассортимент представлен в шоуруме в Москве и пpoфилe на Авито.\n\nПоможем подобрать экипировку под Ваши задачи.\n\nВыкупим Baш экип или возьмем в зачёт пpи покупке н...	\N	/uploads/imported/avito/7672566789/7672566789-1-c43a505801ca.jpg	{/uploads/imported/avito/7672566789/7672566789-1-c43a505801ca.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	Dainese	t	f	t	f	\N	{"source": "avito", "avitoId": 7672566789}	f	\N	\N
836aae86-26ec-478e-ae96-7bf6cb7b1e79	48cd31ad-9037-481b-b721-b378597358a8	AVITO-7959942347	\N	Мотоботинки BMW Motorrad Nitrous, 43, 44, 45	motobotinki-bmw-motorrad-nitrous-43-44-45-7959942347	new	\N	\N	32800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7959942347, "urlPath": "/moskva/zapchasti_i_aksessuary/motobotinki_bmw_motorrad_nitrous_43_44_45_7959942347?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботинки BMW Motorrad Nitrous, 43, 44, 45	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7959942347/7959942347-1-3eee8c31bfd2.jpg	{/uploads/imported/avito/7959942347/7959942347-1-3eee8c31bfd2.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7959942347}	f	\N	\N
33900540-acce-46d3-ae99-94eccf6aac17	dff5b8de-e6c5-4640-99e6-471e50e0a70b	AVITO-7960092751	\N	Мотоботинки BMW Motorrad Takyr GTX, 41, 42, 43, 44	motobotinki-bmw-motorrad-takyr-gtx-41-42-43-44-7960092751	new	\N	\N	39800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7960092751, "urlPath": "/moskva/zapchasti_i_aksessuary/motobotinki_bmw_motorrad_takyr_gtx_41_42_43_44_7960092751?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотоботинки BMW Motorrad Takyr GTX, 41, 42, 43, 44	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7960092751/7960092751-1-7d97d3642f25.jpg	{/uploads/imported/avito/7960092751/7960092751-1-7d97d3642f25.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7960092751}	f	\N	\N
f6571a37-4517-44f5-acfa-ad4ae7f53edc	2a07319a-4496-4824-9e13-67a27868bb94	AVITO-7960457938	\N	Мотокуртка Bmw Motorrad GS Rallye GTX, под заказ	motokurtka-bmw-motorrad-gs-rallye-gtx-pod-zakaz-7960457938	new	\N	\N	129800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОперативная доставка под заказ из Европы.\n\nАвито доставка возможна только по...	{"source": "avito", "avitoId": 7960457938, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_gs_rallye_gtx_pod_zakaz_7960457938?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка Bmw Motorrad GS Rallye GTX, под заказ	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОперативная доставка под заказ из Европы.\n\nАвито доставка возможна только по...	\N	/uploads/imported/avito/7960457938/7960457938-1-e514b7890ed1.jpg	{/uploads/imported/avito/7960457938/7960457938-1-e514b7890ed1.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7960457938}	f	\N	\N
65882d28-e141-4f53-b867-799decee9349	86050792-54b1-4d16-9195-7c2e0819272c	AVITO-7960603553	\N	Мотокуртка BMW Motorrad RoadCrafted, 50/52	motokurtka-bmw-motorrad-roadcrafted-50-52-7960603553	new	\N	50/52	38800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7960603553, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_bmw_motorrad_roadcrafted_5052_7960603553?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка BMW Motorrad RoadCrafted, 50/52	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7960603553/7960603553-1-8e727866400c.jpg	{/uploads/imported/avito/7960603553/7960603553-1-8e727866400c.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7960603553}	f	\N	\N
50ca7511-e593-4776-8648-1b2721393b09	c94bc350-b912-43e7-bb53-4ca285bd4d86	AVITO-7960878613	\N	Мотокуртка женская BMW Motorrad Bavella, 44/46	motokurtka-zhenskaya-bmw-motorrad-bavella-44-46-7960878613	new	\N	44/46	64800.00	\N	5	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	{"source": "avito", "avitoId": 7960878613, "urlPath": "/moskva/zapchasti_i_aksessuary/motokurtka_zhenskaya_bmw_motorrad_bavella_4446_7960878613?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-10 16:48:10.432188+03	Мотокуртка женская BMW Motorrad Bavella, 44/46	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Москве.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\nОплата любым удобным способом.\n\nОперативная доставка под заказ из Европы.\n\nА...	\N	/uploads/imported/avito/7960878613/7960878613-1-3f137679b7b4.jpg	{/uploads/imported/avito/7960878613/7960878613-1-3f137679b7b4.jpg}	1ac52608-791b-4334-b0ff-a36ad2d21c4b	\N	\N	\N	BMW	t	f	t	f	\N	{"source": "avito", "avitoId": 7960878613}	f	\N	\N
de7b6bf7-0fa2-485d-9032-da9a31c65d5a	8b073719-562f-4c29-901c-972bc19881c4	AVITO-7960907134	\N	Мотошлем Shoei GT-Air 2 Tesseract TC-5, S, 2XL	motoshlem-shoei-gt-air-2-tesseract-tc-5-s-2xl-7960907134	new	\N	S	46800.00	\N	0	0	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	{"source": "avito", "avitoId": 7960907134, "urlPath": "/moskva/zapchasti_i_aksessuary/motoshlem_shoei_gt-air_2_tesseract_tc-5_s_2xl_7960907134?slocation=621540&context=H4sIAAAAAAAA_wE_AMD_YToyOntzOjEzOiJsb2NhbFByaW9yaXR5IjtiOjA7czoxOiJ4IjtzOjE2OiJtM0hESEkzY1dpdm5heHVKIjt98QtU6z8AAAA"}	t	2026-03-10 16:37:04.460888+03	\N	\N	2026-03-10 16:37:04.460888+03	2026-03-11 00:25:30.285334+03	Мотошлем Shoei GT-Air 2 Tesseract TC-5, S, 2XL	Мототом — шоурум мультибрендовой экипировки и запчастей!\n\nНовая и б/у экипировка.\n\nПерсональный подбор.\n\nПримерка в Шоу-руме в Москве (м. Ботанический сад).\n\nЧасы работы:\n\nпн-пт: 12-20; сб-вс: 11-19.\n\nОтправка в регионы.\n\nВыкуп, трейд-ин, комиссия.\n\n...	\N	/uploads/imported/avito/7960907134/7960907134-1-fd52b30c97e9.jpg	{/uploads/imported/avito/7960907134/7960907134-1-fd52b30c97e9.jpg}	e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5	\N	\N	\N	Shoei	f	f	t	f	\N	{"source": "avito", "avitoId": 7960907134}	f	\N	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, description, created_at, updated_at) FROM stdin;
1	site_name	MOTOTOM	Название сайта	2026-03-08 01:33:56.682238	2026-03-08 01:33:56.682238
2	phone	+7 (495) 129-90-77	Телефон на сайте	2026-03-08 01:33:56.687449	2026-03-08 01:33:56.687449
3	phone_link	+74951299077	Телефон для tel: ссылки	2026-03-08 01:33:56.688238	2026-03-08 01:33:56.688238
4	address	Москва, ул. Дубининская, д. 22	Адрес магазина	2026-03-08 01:33:56.689396	2026-03-08 01:33:56.689396
5	email	sales@mototom.ru	Email магазина	2026-03-08 01:33:56.690159	2026-03-08 01:33:56.690159
6	working_hours	Пн-Пт: 10:00 - 20:00	Режим работы	2026-03-08 01:33:56.690744	2026-03-08 01:33:56.690744
619	category_images	{"byId":{"7ca777fd-cfba-49e4-93ce-d3bcfaf940f2":"/uploads/imported/categories/helmets-7ca777fd.jpg","1ac52608-791b-4334-b0ff-a36ad2d21c4b":"/uploads/imported/categories/куртки-1ac52608.jpg","f360e60d-0543-47dd-8e35-913069eb87a1":"/uploads/imported/categories/moto-shirts-f360e60d.jpg","2616dcf4-5603-4979-bf1b-d83c02cee6a3":"/uploads/imported/categories/gloves-2616dcf4.jpg","e1203fb5-78bb-4171-ac36-a9e3bfbf2ea5":"/uploads/imported/categories/botinki-e1203fb5.jpg","1112b5bd-b5ea-4e3d-a44a-6606da40812e":"/uploads/imported/categories/zaschita-1112b5bd.jpg","996aad3a-b88b-4264-b999-ed42ac852b86":"/uploads/imported/categories/aksessuary-996aad3a.jpg"},"byName":{"шлемы":"/uploads/imported/categories/helmets-7ca777fd.jpg","куртки":"/uploads/imported/categories/куртки-1ac52608.jpg","моторубашки":"/uploads/imported/categories/moto-shirts-f360e60d.jpg","перчатки":"/uploads/imported/categories/gloves-2616dcf4.jpg","ботинки":"/uploads/imported/categories/botinki-e1203fb5.jpg","защита":"/uploads/imported/categories/zaschita-1112b5bd.jpg","аксессуары":"/uploads/imported/categories/aksessuary-996aad3a.jpg"}}	Category images mapping for storefront	2026-03-10 16:20:49.507696	2026-03-10 16:20:49.507696
\.


--
-- Data for Name: template_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_images (id, template_id, image_url, sort_order, is_main, source, created_at) FROM stdin;
cc521824-e83f-45ce-8416-147e6e18573b	8b5fe852-04a7-4348-9ed9-af1c1eee7ce2	https://images.unsplash.com/photo-1558980394-34764db95d98?auto=format&fit=crop&w=1200&q=80	1	f	seed	2026-03-07 15:42:27.257967+03
371a86e4-aca1-463b-9ba0-0133089e47ed	8b5fe852-04a7-4348-9ed9-af1c1eee7ce2	/uploads/imported/templates/tpl-8b5fe852-04a7-4348-9ed9-af1c1eee7ce2-371a86e4-aca1-463b-9ba0-0133089e47ed.jpg	0	t	seed	2026-03-07 15:42:27.257967+03
1a6af3ef-2104-4f23-9d1e-5d7eb2cb6b29	46ffe0c7-619f-4b97-9abc-54bfdf07e0c4	/uploads/imported/templates/tpl-46ffe0c7-619f-4b97-9abc-54bfdf07e0c4-1a6af3ef-2104-4f23-9d1e-5d7eb2cb6b29.jpg	0	t	seed	2026-03-07 15:42:27.257967+03
d38a330f-a147-461c-8d1e-3ab4ccb12fbe	07e33a5a-4e7a-4206-ad02-6ca97d84a14b	/uploads/imported/templates/tpl-07e33a5a-4e7a-4206-ad02-6ca97d84a14b-d38a330f-a147-461c-8d1e-3ab4ccb12fbe.jpg	0	t	seed	2026-03-07 15:42:27.257967+03
ae83ec22-40dc-4304-8781-c0e7821e3b8d	3f9d7bcf-94a0-41f4-9379-8ef61603a02a	/uploads/imported/templates/tpl-3f9d7bcf-94a0-41f4-9379-8ef61603a02a-ae83ec22-40dc-4304-8781-c0e7821e3b8d.jpg	0	t	seed	2026-03-07 15:42:27.257967+03
0173b541-e566-4279-9765-d213e29b7e12	e6b4f7d5-2681-41a4-b652-b4acef191075	/uploads/imported/templates/tpl-e6b4f7d5-2681-41a4-b652-b4acef191075-0173b541-e566-4279-9765-d213e29b7e12.jpg	0	t	seed	2026-03-07 15:42:27.257967+03
bba5c658-b782-484a-bf84-5e99b8d2121e	6fbf4bdc-ecf2-499d-8a5b-32437f4edb98	/uploads/imported/avito/7863986141/7863986141-1-3c9501ad469d.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
fb44e510-8f2e-4621-ac6e-01c2ee1db355	5a1d6abe-3df5-4a96-9c91-a06150306daf	/uploads/imported/avito/7864461570/7864461570-1-241284cee4c7.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
408d7d2e-3875-4bb4-8f91-e9d0741702b7	d7a508e6-2260-4517-ae90-74430305f032	/uploads/imported/avito/7448496323/7448496323-1-fb9361194390.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5cc71dca-e1f2-43b1-ac47-ded176588d07	ae2dc7d1-98bf-4f61-a1e6-7c2737ce4605	/uploads/imported/avito/7544361936/7544361936-1-b767fdac7246.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f000b44d-63e7-4be0-a18b-a1d9d2e1e449	71a17ec9-7860-44b6-ba63-ea119a06ce6c	/uploads/imported/avito/7608421278/7608421278-1-6c96fce2c53b.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
941feb83-cb9e-43a3-a236-6695c1f759dd	149fd703-b963-4d68-9052-1b9362d790da	/uploads/imported/avito/7864273688/7864273688-1-a5a70f688bb4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9a737f6f-8af9-4f40-930b-61422aebddfa	de628ac6-aee8-4daf-9dc6-4edc218344c2	/uploads/imported/avito/7864054360/7864054360-1-71bb24f26f48.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
332ddb5a-9a00-44f9-a94a-0ada516f6d5f	6534ef00-09e0-4dd8-b05e-c680486382cd	/uploads/imported/avito/4473331797/4473331797-1-794cdcaf28d4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1a85b148-ba2f-4f3a-b712-9541c3a15b1f	19dd5042-79b7-4e7e-9172-ac0224394a5f	/uploads/imported/avito/7544453382/7544453382-1-fe8d810b449c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5b661cf9-6564-45f7-8f7f-ab2f10b3296f	fcaf622c-debc-4519-a469-13e8f508cbdd	/uploads/imported/avito/7704396758/7704396758-1-477c044fc26a.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f10254bf-67e8-4d4e-8cae-606c038fb8aa	8b258d7d-3410-43af-be57-a87d707941aa	/uploads/imported/avito/7704797542/7704797542-1-d26b2ede3536.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
53809d73-9fa3-4400-8a1f-aea8aa002b10	cf06f2d1-cf59-4645-9dd3-18b7ce594eb1	/uploads/imported/avito/7704901896/7704901896-1-99d2efa38e04.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0627be90-199d-463a-ad9e-4497658ff8f6	5d7a853e-f904-4476-a4db-b49d9cab796c	/uploads/imported/avito/7863942280/7863942280-1-896434d5cece.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0e61bf9d-acee-4dc7-a0f0-d8181ff46e83	57c96127-2d6e-4046-80ef-790f3f43f3d1	/uploads/imported/avito/7863945378/7863945378-1-14904ae91212.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
613bb170-d07f-428e-b61f-bd9662bdda06	e23c37c4-bf8a-4fd8-9b5c-57ce92c46765	/uploads/imported/avito/7864136477/7864136477-1-ddacb84d967d.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9f90a8f8-89ac-4c5e-aa02-d57cda03c1f6	5b78f337-e4d5-476a-99f5-10446881d4d0	/uploads/imported/avito/7864407855/7864407855-1-e819d218db42.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d6096718-1f7d-4cd2-9ffa-e283e91f943a	63b9f46a-1c8d-42a9-8ab3-7f8a6cf367c7	/uploads/imported/avito/7864416598/7864416598-1-a975c2ac761c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c5816d64-d9e5-4674-b35f-74382556232e	ea7adf5e-caa7-4a3f-a451-e4493dc40955	/uploads/imported/avito/7864747181/7864747181-1-16199e10e8a0.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0e53489b-3ca7-4522-90eb-020f70b5be8c	7e5000d8-eaae-489d-a170-b380f5d50f1f	/uploads/imported/avito/7864913050/7864913050-1-3550f95556c0.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
13b0c03f-20fa-4542-86bd-f021fa01b5c9	87bf6089-0d89-4c6e-a1e3-d7be3c195459	/uploads/imported/avito/4664489546/4664489546-1-08fb4022ed88.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8816a8b0-ad2c-4bfa-9bc4-19c913f7845d	025548d5-4d92-4d6e-ae1b-f9946c42d518	/uploads/imported/avito/7480889427/7480889427-1-04417423ab0a.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c7906e2b-22f4-4fc0-8729-6aba1574e780	5fd1e3a9-2a79-4aca-b542-220b8de3798a	/uploads/imported/avito/7544068246/7544068246-1-08387cdb6d29.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b8ab6465-8b79-48ef-81d1-33e0d8ce5ac2	6e186d2e-ff7d-4fdd-9fe8-b97a5a9df966	/uploads/imported/avito/7863934628/7863934628-1-fae41f042dc9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
06ca91a4-15ed-488a-a873-1cd0b5a11ee2	ce72ec2a-4d2c-4679-a20d-e5c9ff8d3a74	/uploads/imported/avito/7640778058/7640778058-1-76e91b80c30c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d308f7c6-9263-434e-a247-0167ae6745f8	4d5f103c-40e7-4915-980e-a412719cd5a0	/uploads/imported/avito/7608101725/7608101725-1-c9a784b0565f.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5d7bc5d6-e094-404e-8015-5af7bcfdfcaf	84686881-c03d-4620-bd77-5f006a8f52c2	/uploads/imported/avito/7864065607/7864065607-1-3c38193f377e.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
984cae54-9390-4b26-92f8-85205919272c	71f9b076-07de-4b9f-a725-0c0fc0747770	/uploads/imported/avito/7864252625/7864252625-1-b4cbda8b97d1.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9d339c6c-4953-4300-be34-96a46043eb6b	b954b6b1-fb7c-44c8-b659-5d3ae2334567	/uploads/imported/avito/7736588848/7736588848-1-af583bb431f8.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
87681927-5049-4ef0-9d2a-e21dd1ee674a	778189bf-0b0d-49a0-a072-9303a927fb43	/uploads/imported/avito/7864101220/7864101220-1-5779dbffe4f8.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9d4d12d7-12e1-44a5-8d72-849194112692	f49122f7-3734-4c3a-96ba-b1947a4552ca	/uploads/imported/avito/7864466629/7864466629-1-cb65ef161f41.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d79c05ff-acc6-4d84-9b3b-ac4556dd2e8b	76baeed6-b9c0-4c40-9967-f0aa34a05329	/uploads/imported/avito/7864502540/7864502540-1-fd0912c26e58.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
029f575b-0e3d-4b51-b152-41ad647a4667	c299af0d-9a79-438f-a197-388256e03940	/uploads/imported/avito/7320336373/7320336373-1-92f35e7c7047.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
15fd0e57-fcb0-4c00-9b63-38ef8a2dfc92	325f3f7e-8c58-4d72-95c7-a85be087cb73	/uploads/imported/avito/7608520369/7608520369-1-55c5c95da450.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
e8afec2d-e72c-4bfa-a109-175993ef766a	2e8abc01-d04b-4d60-a3b9-7718cf4cd88a	/uploads/imported/avito/7672147000/7672147000-1-7ca06ca57160.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
82f32f2b-121b-4740-9986-f607ebc2828f	2b45e4f8-b581-4023-be95-ce1e75b4fc2a	/uploads/imported/avito/7672670790/7672670790-1-3c4a3f9375db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6b2aba00-9b76-4325-a8df-bebf0a359cce	325dc02c-1649-4172-a9b5-893feeeabd2f	/uploads/imported/avito/7800818731/7800818731-1-db14304a3f98.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3b198ea1-df61-4045-aa61-e00b00edf110	de77c51a-c013-4e43-903b-75441d26d607	/uploads/imported/avito/7928019018/7928019018-1-f58b40a66504.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9a4177df-8ca2-4bb3-98dc-18e141158eb3	a07a0919-887c-4057-b5b3-905b936653a1	/uploads/imported/avito/7544725927/7544725927-1-b44cb28508e1.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9e714e8e-700a-440a-a404-a5fb23239a8e	0f33f3a9-6ceb-40c3-82c7-17a9b04d4d67	/uploads/imported/avito/7672297983/7672297983-1-d0a9c9cb37dc.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
dda26440-fb6c-4f8a-a7bc-cff0b34e43b3	17fdfdba-6df9-440d-b590-3c3096bdc5ed	/uploads/imported/avito/7736349737/7736349737-1-87e9496e7ea6.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
39de5ae8-3be8-427a-9bf2-9c48c36aa61f	43cc4520-3b2f-4bf5-9c8e-c45f34953b43	/uploads/imported/avito/4632740420/4632740420-1-84c17b909b53.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
fca0fe61-4960-4fba-b00f-9f964b1cd53d	02c5203f-ddcd-4710-99f9-d8ed50480785	/uploads/imported/avito/7704176875/7704176875-1-6ce55a6b6cc7.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
546b3e4f-3fb8-4585-9c25-fa63a2b6d266	0ea76a0d-4aa4-48cf-b9fe-84bce5e5b79e	/uploads/imported/avito/7512205252/7512205252-1-ea5a626d62b9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1a590902-2e2f-4376-87da-dc7f9c2510ce	a9983f68-73bf-4d3d-ac7e-dfc91cb39e9d	/uploads/imported/avito/7512781280/7512781280-1-b36de0a64e43.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6e5a04b9-8e8c-42a4-ab60-ce18e5bb4d13	20304a36-e0fd-4236-8a80-845e2cc83ed7	/uploads/imported/avito/7544624011/7544624011-1-f05a2c6db016.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c1ed5b51-9c2f-4687-892a-f4524b5ff17a	9cffadd3-fb41-4835-a01f-dff2468bd4ac	/uploads/imported/avito/7544755600/7544755600-1-9ed321e6845c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
56591e27-7665-4c7f-8ff6-66930245a8fe	c18cc3c7-c1e5-4003-b3dc-56cdbbdf6d68	/uploads/imported/avito/7736067660/7736067660-1-3d56416558fb.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
80f755e8-80e3-425d-ab63-309b51054239	c341e36d-0c07-4daf-b14e-31781fee646f	/uploads/imported/avito/7736258176/7736258176-1-93a2c923f3cb.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
e6e72da3-737f-489b-b36f-add83dd1f712	50fa2ad3-72ce-4856-893e-f91fe7f96d2b	/uploads/imported/avito/7512214475/7512214475-1-a77766fe2db9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b1b61ac3-57eb-4fef-a7a7-e47755a71e5e	db21c757-ddfc-42ea-a54e-7d7d0d9f9dab	/uploads/imported/avito/7640685575/7640685575-1-df8302cb4189.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
610234b6-7f88-4aeb-9320-e597a851e443	d58bc6e7-f7e3-4e32-aad2-77d4fecfa7ad	/uploads/imported/avito/7736830684/7736830684-1-25445c030c2f.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
930f56db-89d2-411c-aa52-b652af724ea0	28da7917-910b-4f6d-981d-157a7c370b62	/uploads/imported/avito/7672007868/7672007868-1-b6b2f93d1353.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c2d46a45-7b28-4f5a-9d85-609061fd72fe	713fa632-6be8-4202-9f72-24a9ab02c93b	/uploads/imported/avito/4537431286/4537431286-1-750a741a4937.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
213a1828-70dd-4e04-931b-2c5c9031e642	df717577-f335-4759-aad3-40fd37132b0f	/uploads/imported/avito/7768422676/7768422676-1-79472c561541.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0ef09e7b-fc30-46a9-b6a0-a77b73f040e7	36dfda30-2d73-4a52-a921-a6bcea302917	/uploads/imported/avito/7320173682/7320173682-1-7158a677f6e0.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8f627635-bbe7-40a4-a427-061649f80c41	0e06d121-776a-49ee-bc19-cb952499ac7a	/uploads/imported/avito/7320334642/7320334642-1-c496e1927bb5.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9ad56349-fdc5-4d23-a54f-a5f6777c9c70	e88ec078-1649-4b2a-911f-198b953cd6a7	/uploads/imported/avito/7320538670/7320538670-1-3a63177be9db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
dd274d65-8ecc-400b-a3c8-e8966638a5fb	49d4e790-2ce3-4b9a-aa27-f5eae530eab5	/uploads/imported/avito/7352095298/7352095298-1-4b59a09e2fe7.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
96e34344-4ab3-4117-90c2-b41ddd0ec99a	f2e10d46-43c4-47fe-be4b-914540f5d743	/uploads/imported/avito/7352220119/7352220119-1-73e6959e3259.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
2afe5f6f-354c-420b-910a-32cb5a3d2eff	3d2db6d7-cf99-4882-9d37-9ca7fbf2e51c	/uploads/imported/avito/7384018177/7384018177-1-193989cac34b.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ae41efb3-3c3b-4803-9b28-662036b74ba5	4bb9d8a4-6dbb-49e2-8e04-b8b2f10360ad	/uploads/imported/avito/7704124165/7704124165-1-1e943d49dd1c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f407008f-75e7-46ca-934d-5f7453e3ecb5	9c652937-d5d4-49ba-b6ab-5e1a9a1717c9	/uploads/imported/avito/7704307642/7704307642-1-576fb538ac62.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3c623733-7ea0-4697-909a-c5d5593dc606	ebb40545-94f5-452d-a7fd-8d8412118e81	/uploads/imported/avito/7704345074/7704345074-1-7011250beb8e.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3a1f5620-f15a-4765-84ce-f87d05c801e0	4d1e8b59-c9a0-4167-a80b-5a86e83419a3	/uploads/imported/avito/7704370492/7704370492-1-6957f619d9d5.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ac645c8e-3367-4761-8a8b-fe5e2211b305	da79cf44-abf5-426c-8412-bf84621a685d	/uploads/imported/avito/7704413276/7704413276-1-e68a0329eb48.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
799e2679-7768-4477-be44-665e86ecde00	e154af78-9f05-4fb8-8f95-a014b4d89c7d	/uploads/imported/avito/7704416305/7704416305-1-c1e9c765a93b.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
beb79e8e-e68a-4e6c-a0c1-7fba7925dd00	ec25bc27-a069-450f-b06c-38db10b5e658	/uploads/imported/avito/7704730307/7704730307-1-116083e4dcd3.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8868a00f-31f2-432f-b7fc-235e5a79b53b	0278e095-4605-4fe8-b5ab-c610e34bcb98	/uploads/imported/avito/7704768455/7704768455-1-bcc94d2fdf29.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f6a53aac-476c-4eb0-9e58-1dd7c1b8f043	26aa5ce3-0c77-4747-8722-d41b0843e267	/uploads/imported/avito/7736754113/7736754113-1-acf6d8659014.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4711d67d-b7c2-4f97-95f9-620351f4a6b0	783989dd-2c10-465b-b9b1-937457ff807b	/uploads/imported/avito/7768033759/7768033759-1-3d884041e8d9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f70df43c-6f37-47b9-81ab-4d33f7df6971	0bb3456d-817e-4bf8-8422-856074115072	/uploads/imported/avito/7608798392/7608798392-1-2f2be234fd01.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b6b04414-2526-452d-a0d5-b20f0d8df3c8	611361e8-3728-47a8-9264-59ff592a6ed8	/uploads/imported/avito/7640131998/7640131998-1-401b7731cd55.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b4056488-e99d-41a2-9b9d-d87209b278da	eff90c64-7ce9-4189-b643-8e5b0d6ce46b	/uploads/imported/avito/7448184351/7448184351-1-9f011e90c2fd.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
647dddb1-fbbc-47f7-8e6d-c600580e9734	3141ee39-04f8-4ce1-8ede-5b33d55f3380	/uploads/imported/avito/7448566160/7448566160-1-823f6d19dc56.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9ddad0a1-3ff6-4c67-84a1-0da5cd4001ab	8b7285c1-8729-4391-8d1a-5d355a9205a5	/uploads/imported/avito/7448586310/7448586310-1-eee99047488e.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
28c4f19b-c598-4467-9326-47f9d456faf0	e1f9e8a9-1973-47f7-8a63-a950912c2bfa	/uploads/imported/avito/7512174969/7512174969-1-b60177a3aa38.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ea48629b-b0d9-475a-af8d-47a2718d05db	042e4e03-5a9a-47a6-bb3e-79008e753e19	/uploads/imported/avito/7544181655/7544181655-1-81bfa872c6db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ffe4be59-1c1e-4109-9749-c8f253dab314	4d2e06ad-52cf-4b20-88d6-938badafad9a	/uploads/imported/avito/7544833478/7544833478-1-9768f0453763.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ec2d0271-7a71-4da2-bd9f-01a219790086	b02c6fe2-3a9f-44ab-92c9-1485f08e6b69	/uploads/imported/avito/7608031301/7608031301-1-92aec162ebd9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9d9772b7-8fcb-48ea-a52b-cae8e4d7dce2	9e117f9e-6c43-49cf-8736-6abbe4a632b3	/uploads/imported/avito/7608404013/7608404013-1-698fe2201d5f.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f64a967a-2ede-4df7-990b-9621377ef709	a337f56e-f70f-492e-a780-16859238939c	/uploads/imported/avito/7608679589/7608679589-1-24d2486139ac.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
7b675c53-3147-4d16-9d1e-eb9621d8b7ea	97039ad1-5b91-48f9-85e1-064f1841c38e	/uploads/imported/avito/7640660738/7640660738-1-e7db86fca5e4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
af45ba1e-8a12-4c43-b2c6-5f649dfdee31	44f54390-ddf5-4c64-8dfe-649545a892f0	/uploads/imported/avito/7672506758/7672506758-1-cfe2c8da76a2.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
3255b897-72bc-4767-9066-8edf1205f042	85ab82eb-cd4e-479d-9869-b585c54d55b6	/uploads/imported/avito/7703966270/7703966270-1-30727351fd2c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f4e8cf9c-c8f8-48df-a98b-cff3cd0b4190	44137d9a-e821-409e-98a4-1ed2d421863d	/uploads/imported/avito/7736502568/7736502568-1-fa268bcaf297.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5b2923b3-74b3-48a1-9bd9-f0ea2bf6ddf8	0887cb1a-7784-4839-b7e3-e7906f4f0e1e	/uploads/imported/avito/7736543866/7736543866-1-b55d42cf3573.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
1bba0a99-d627-4f65-9509-fad70621765f	b1400cb4-9f05-4bc0-a752-56a59e3943a5	/uploads/imported/avito/7736617671/7736617671-1-5f9815e8a450.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
78ba6ada-c09e-4b7b-a9fe-5018bcd1658b	936cf4fc-9d29-4f76-b9cb-64c466d5aeee	/uploads/imported/avito/7544068978/7544068978-1-16d8ad62b4ee.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4cf9e31f-09cc-4b4b-b7d3-c169b399c278	1c4c9b42-22f1-43e3-883d-37d633ac73a9	/uploads/imported/avito/4472548492/4472548492-1-a6c77a8e9970.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4a03b519-c1ea-4db6-b764-b52c87653840	29af24f5-c6ce-4ce6-be4f-4d96944bf132	/uploads/imported/avito/7928131471/7928131471-1-0501986bcbdf.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5c675a69-49d3-41c4-b47b-c61a117c6836	92b9cda5-3049-4228-8186-5790cfea28a3	/uploads/imported/avito/7928660461/7928660461-1-57f6b20088c6.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
8342cb38-360d-4c04-a1cf-3e824cbb2526	1317eb21-b9d4-49af-928d-ec6ae0222913	/uploads/imported/avito/7928827958/7928827958-1-dabf709131de.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
4bc4e62d-271b-40d9-9fc4-23bd58addc9d	4feffbf6-17cd-42f6-b903-df5f950e4897	/uploads/imported/avito/7928106347/7928106347-1-56de2eec60ab.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
bfc5dd79-6e3c-4ef7-87a1-b9ffac7622b3	bf694020-d068-4cdf-ae41-543c9738be41	/uploads/imported/avito/7928535833/7928535833-1-274a65500d82.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
9a84f12a-162e-4274-bc97-3232c96cb219	fb0b8c57-a3be-4fa2-9620-16976969bd31	/uploads/imported/avito/7928223307/7928223307-1-21a42ecc9962.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d32ca802-c1bf-4433-9340-a01515f6c910	4bbdfbcf-1325-4534-80d3-d7e189bd944c	/uploads/imported/avito/7928697980/7928697980-1-37de629abc34.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
d5129805-1283-428c-95af-70f116588887	b4935ee6-3025-428f-b035-1286093e2180	/uploads/imported/avito/7640719968/7640719968-1-2aab8e83ba06.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f8240703-8983-432a-a1b0-4b95319fdaf5	2976ff70-15bd-4202-ba43-a7db0dfc4737	/uploads/imported/avito/7672381094/7672381094-1-81d5af0f10db.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
0415ed53-ea84-4978-a258-5c1dfda7b861	54452e02-37b0-4a9a-bf52-7b16edfdf530	/uploads/imported/avito/7672566789/7672566789-1-c43a505801ca.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
f4fe7faf-74ac-4563-812b-1fb69bf46e64	20dba213-9b39-48b2-8ea5-1d2c9068dfdc	/uploads/imported/avito/7960364332/7960364332-1-133deaa30c81.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
b539d9b3-8bae-4c67-8edc-fd778c610b7e	1991fe2b-067b-4b74-8dba-a1d451245a28	/uploads/imported/avito/7960499118/7960499118-1-e1fbc1ab323c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
6c80508a-8e75-4ce6-b2ec-6b76c85bff2e	48cd31ad-9037-481b-b721-b378597358a8	/uploads/imported/avito/7959942347/7959942347-1-3eee8c31bfd2.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
ff8fd6c5-190a-4dc4-af89-f6658dd55324	dff5b8de-e6c5-4640-99e6-471e50e0a70b	/uploads/imported/avito/7960092751/7960092751-1-7d97d3642f25.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
c8f7a61e-bd1e-4a22-8827-01397364638d	2e6bfe24-157b-4e90-ac18-207cfd2b6b3e	/uploads/imported/avito/7960742640/7960742640-1-c6f8197e61a2.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
5cbf0dc2-3f29-41f2-8b86-2cfbeda33f6d	2a07319a-4496-4824-9e13-67a27868bb94	/uploads/imported/avito/7960457938/7960457938-1-e514b7890ed1.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
fd78cb12-8e87-429b-937e-785ae73564bf	86050792-54b1-4d16-9195-7c2e0819272c	/uploads/imported/avito/7960603553/7960603553-1-8e727866400c.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
441be98d-cdc3-4c53-8ca4-1032579f16f8	c94bc350-b912-43e7-bb53-4ca285bd4d86	/uploads/imported/avito/7960878613/7960878613-1-3f137679b7b4.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
a3a93672-6877-4603-a7fe-dd67f3fdfa07	8b073719-562f-4c29-901c-972bc19881c4	/uploads/imported/avito/7960907134/7960907134-1-fd52b30c97e9.jpg	0	t	avito-import	2026-03-10 16:48:10.432188+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: blocked_ips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.blocked_ips_id_seq', 1, false);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 9, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, true);


--
-- Name: product_archives_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_archives_id_seq', 1, false);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 973, true);


--
-- Name: ai_generation_jobs ai_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_jobs
    ADD CONSTRAINT ai_generation_jobs_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: blocked_ips blocked_ips_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_ip_address_key UNIQUE (ip_address);


--
-- Name: blocked_ips blocked_ips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_ips
    ADD CONSTRAINT blocked_ips_pkey PRIMARY KEY (id);


--
-- Name: brand_categories brand_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_categories
    ADD CONSTRAINT brand_categories_pkey PRIMARY KEY (brand_id, category_id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: look_items look_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.look_items
    ADD CONSTRAINT look_items_pkey PRIMARY KEY (id);


--
-- Name: looks looks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.looks
    ADD CONSTRAINT looks_pkey PRIMARY KEY (id);


--
-- Name: looks looks_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.looks
    ADD CONSTRAINT looks_slug_key UNIQUE (slug);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_archives product_archives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_archives
    ADD CONSTRAINT product_archives_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_templates product_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: settings settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_key UNIQUE (key);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: template_images template_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_images
    ADD CONSTRAINT template_images_pkey PRIMARY KEY (id);


--
-- Name: brands uq_brands_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT uq_brands_name UNIQUE (name);


--
-- Name: product_templates uq_template_brand_modelkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT uq_template_brand_modelkey UNIQUE (brand_id, model_key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cart_items_session_product_uidx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cart_items_session_product_uidx ON public.cart_items USING btree (session_id, product_id);


--
-- Name: idx_ai_jobs_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_jobs_status_created ON public.ai_generation_jobs USING btree (status, created_at DESC);


--
-- Name: idx_audit_actor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_actor ON public.audit_log USING btree (actor_user_id, created_at DESC);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_entity ON public.audit_log USING btree (entity_type, entity_id, created_at DESC);


--
-- Name: idx_blocked_ips_ip_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips USING btree (ip_address);


--
-- Name: idx_brand_categories_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_categories_category ON public.brand_categories USING btree (category_id);


--
-- Name: idx_brands_sort_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brands_sort_order ON public.brands USING btree (sort_order);


--
-- Name: idx_customer_addresses_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_addresses_customer ON public.customer_addresses USING btree (customer_id);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_inventory_product_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_product_created ON public.inventory_movements USING btree (product_id, created_at DESC);


--
-- Name: idx_look_items_look; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_look_items_look ON public.look_items USING btree (look_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_status ON public.messages USING btree (status);


--
-- Name: idx_messages_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_type ON public.messages USING btree (message_type);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_order_status_history_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_status_history_order ON public.order_status_history USING btree (order_id, created_at DESC);


--
-- Name: idx_orders_archived; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_archived ON public.orders USING btree (archived);


--
-- Name: idx_orders_client_ip; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_client_ip ON public.orders USING btree (client_ip);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_status_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status_created ON public.orders USING btree (status, created_at DESC);


--
-- Name: idx_product_archives_source_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_archives_source_product_id ON public.product_archives USING btree (source_product_id);


--
-- Name: idx_product_images_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--
-- Name: idx_products_active_condition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_active_condition ON public.products USING btree (is_active, condition);


--
-- Name: idx_products_stock; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_stock ON public.products USING btree (stock_qty);


--
-- Name: idx_products_stock_qty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_stock_qty ON public.products USING btree (stock_qty);


--
-- Name: idx_products_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_template ON public.products USING btree (template_id);


--
-- Name: idx_template_images_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_template_images_template ON public.template_images USING btree (template_id);


--
-- Name: idx_templates_brand_model; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_brand_model ON public.product_templates USING btree (brand_id, model_key);


--
-- Name: idx_templates_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_category ON public.product_templates USING btree (category_id);


--
-- Name: idx_templates_model_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_templates_model_name ON public.product_templates USING btree (model_name);


--
-- Name: uq_look_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_look_items_product ON public.look_items USING btree (look_id, product_id) WHERE (product_id IS NOT NULL);


--
-- Name: uq_look_items_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_look_items_template ON public.look_items USING btree (look_id, template_id) WHERE (template_id IS NOT NULL);


--
-- Name: brands trg_brands_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: categories trg_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: customer_addresses trg_customer_addresses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customer_addresses_updated_at BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: customers trg_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: looks trg_looks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_looks_updated_at BEFORE UPDATE ON public.looks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: product_templates trg_product_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_product_templates_updated_at BEFORE UPDATE ON public.product_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: products trg_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: ai_generation_jobs ai_generation_jobs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_jobs
    ADD CONSTRAINT ai_generation_jobs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: ai_generation_jobs ai_generation_jobs_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_jobs
    ADD CONSTRAINT ai_generation_jobs_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ai_generation_jobs ai_generation_jobs_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_generation_jobs
    ADD CONSTRAINT ai_generation_jobs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.product_templates(id) ON DELETE CASCADE;


--
-- Name: audit_log audit_log_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: brand_categories brand_categories_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_categories
    ADD CONSTRAINT brand_categories_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;


--
-- Name: brand_categories brand_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_categories
    ADD CONSTRAINT brand_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: inventory_movements inventory_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory_movements inventory_movements_related_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_related_order_id_fkey FOREIGN KEY (related_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: look_items look_items_look_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.look_items
    ADD CONSTRAINT look_items_look_id_fkey FOREIGN KEY (look_id) REFERENCES public.looks(id) ON DELETE CASCADE;


--
-- Name: look_items look_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.look_items
    ADD CONSTRAINT look_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: look_items look_items_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.look_items
    ADD CONSTRAINT look_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.product_templates(id) ON DELETE SET NULL;


--
-- Name: looks looks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.looks
    ADD CONSTRAINT looks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.product_templates(id) ON DELETE SET NULL;


--
-- Name: order_status_history order_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_templates product_templates_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE RESTRICT;


--
-- Name: product_templates product_templates_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;


--
-- Name: product_templates product_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_templates
    ADD CONSTRAINT product_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: products products_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: products products_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.product_templates(id) ON DELETE RESTRICT;


--
-- Name: template_images template_images_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_images
    ADD CONSTRAINT template_images_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.product_templates(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zJO65f4gKR6If1BYJl9oRUdeupCj90NfqhPgN2BbIdSeLpgwkHFvjyYdRp4f3d1

