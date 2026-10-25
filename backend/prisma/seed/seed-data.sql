--
-- PostgreSQL database dump
--

\restrict jPqqhwtQbTbhWF20Cfi2Cl9Tk9wdJNKPn1kJE5kt8EvDqMnOu7UliGc4opBDSWE

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

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
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotions (promotion_id, code, promotion_name, discount_type, discount_value, min_amount, max_discount, start_at, end_at, is_active) FROM stdin;
e2a7b8c9-1111-4222-8333-000000000001	GIAM15K	Giảm 15k cho đơn từ 50k	fixed	15000	50000	15000	2026-09-30 17:00:00+00	2026-10-31 16:59:59+00	t
e2a7b8c9-1111-4222-8333-000000000002	GIAM20K	Giảm 20k cho đơn từ 100k	fixed	20000	100000	20000	2026-09-30 17:00:00+00	2026-10-31 16:59:59+00	t
e2a7b8c9-1111-4222-8333-000000000003	SALE10%	Giảm 10% tổng hóa đơn	percentage	10	50000	50000	2026-09-30 17:00:00+00	2026-10-31 16:59:59+00	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, name, phone, password, point, email) FROM stdin;
f47ac10b-58cc-4372-a567-0e02b2c3d479	Nguyen Van An	0910000001	DEMO_PASSWORD_01	50	user01@example.com
c9a646d3-9c61-4cd9-bc15-4581bf762d78	Tran Thi Binh	0910000002	DEMO_PASSWORD_02	120	user02@example.com
d3b07384-d113-4f44-9840-000000000001	Le Hoang Cuong	0910000003	DEMO_PASSWORD_03	80	user03@example.com
6ba7b810-9dad-11d1-80b4-00c04fd430c8	Pham Thu Dung	0910000004	DEMO_PASSWORD_04	200	user04@example.com
7d444840-9dc0-11d1-b245-5ffdce74fad2	Hoang Minh Duc	0910000005	DEMO_PASSWORD_05	15	user05@example.com
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (order_id, order_code, user_id, promotion_id, status, subtotal, discount, total, created) FROM stdin;
a1b2c3d4-0001-4000-8000-000000000001	ORD-20261001-0001	f47ac10b-58cc-4372-a567-0e02b2c3d479	\N	completed	50000	0	50000	2026-10-01 01:15:00+00
a1b2c3d4-0002-4000-8000-000000000002	ORD-20261001-0002	c9a646d3-9c61-4cd9-bc15-4581bf762d78	e2a7b8c9-1111-4222-8333-000000000001	completed	85000	15000	70000	2026-10-01 02:30:00+00
a1b2c3d4-0003-4000-8000-000000000003	ORD-20261002-0003	f47ac10b-58cc-4372-a567-0e02b2c3d479	\N	cancelled	40000	0	40000	2026-10-02 03:10:00+00
a1b2c3d4-0004-4000-8000-000000000004	ORD-20261002-0004	d3b07384-d113-4f44-9840-000000000001	e2a7b8c9-1111-4222-8333-000000000002	completed	120000	20000	100000	2026-10-02 04:45:00+00
\.


--
-- Data for Name: loyalty_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loyalty_transactions (loyalty_id, user_id, order_id, loyalty_point, type, description, created_at) FROM stdin;
e1b2c3d4-0001-4000-8000-000000000001	f47ac10b-58cc-4372-a567-0e02b2c3d479	a1b2c3d4-0001-4000-8000-000000000001	50	EARN	Cộng điểm khi hoàn thành đơn hàng	2026-10-22 10:28:38.755558+00
e1b2c3d4-0002-4000-8000-000000000002	c9a646d3-9c61-4cd9-bc15-4581bf762d78	a1b2c3d4-0002-4000-8000-000000000002	30	EARN	Cộng điểm khi hoàn thành đơn hàng	2026-10-22 10:28:38.755558+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (product_id, product_name, description, base_price, image_url, stock, version, is_active) FROM stdin;
11111111-1111-4111-8111-111111111101	Trà sữa truyền thống	Trà sữa vị truyền thống thơm ngon đậm vị trà	25000	https://example.com/images/ts-truyenthong.jpg	100	1	t
11111111-1111-4111-8111-111111111102	Trà sữa ô long	Trà sữa ô long thượng hạng thơm mát	28000	https://example.com/images/ts-olong.jpg	80	1	t
11111111-1111-4111-8111-111111111103	Trà sữa thái xanh	Trà sữa thái xanh béo ngậy đặc trưng	26000	https://example.com/images/ts-thaixanh.jpg	50	1	t
11111111-1111-4111-8111-111111111104	Trà sữa khoai môn	Trà sữa vị khoai môn ngọt dịu tự nhiên	30000	https://example.com/images/ts-khoaimon.jpg	60	1	t
11111111-1111-4111-8111-111111111105	Trà sữa matcha	Trà sữa vị matcha Nhật Bản thanh tao	32000	https://example.com/images/ts-matcha.jpg	45	1	t
11111111-1111-4111-8111-111111111106	Hồng trà kem trứng	Hồng trà kết hợp lớp kem trứng béo ngậy	35000	https://example.com/images/ht-kemtrung.jpg	30	1	t
11111111-1111-4111-8111-111111111107	Lục trà lài	Lục trà thanh mát hương hoa lài dịu nhẹ	22000	https://example.com/images/lt-lai.jpg	120	1	t
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (orderitem_id, order_id, product_id, product_name, size, unit_price, quantity, line_total) FROM stdin;
b1b2c3d4-0001-4000-8000-000000000001	a1b2c3d4-0001-4000-8000-000000000001	11111111-1111-4111-8111-111111111101	Trà sữa truyền thống	M	30000	1	30000
b1b2c3d4-0002-4000-8000-000000000002	a1b2c3d4-0002-4000-8000-000000000002	11111111-1111-4111-8111-111111111102	Trà sữa ô long	L	38000	2	76000
\.


--
-- Data for Name: toppings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.toppings (topping_id, topping_name, price, is_active) FROM stdin;
22222222-2222-4222-8222-222222222201	Trân châu đen	5000	t
22222222-2222-4222-8222-222222222202	Trân châu trắng	6000	t
22222222-2222-4222-8222-222222222203	Pudding trứng	7000	t
22222222-2222-4222-8222-222222222204	Kem cheese	10000	t
22222222-2222-4222-8222-222222222205	Thạch dừa	5000	t
\.


--
-- Data for Name: order_item_toppings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_item_toppings (oit_id, orderitem_id, topping_id, topping_name, price) FROM stdin;
d1b2c3d4-0001-4000-8000-000000000001	b1b2c3d4-0001-4000-8000-000000000001	22222222-2222-4222-8222-222222222201	Trân châu đen	5000
d1b2c3d4-0002-4000-8000-000000000002	b1b2c3d4-0002-4000-8000-000000000002	22222222-2222-4222-8222-222222222203	Pudding trứng	7000
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (payment_id, order_id, idempotency_key, amount, method, status, transaction_id, paid_at, created_at) FROM stdin;
c1b2c3d4-0001-4000-8000-000000000001	a1b2c3d4-0001-4000-8000-000000000001	idem-key-001	50000	cash	success	TXN-999001	2026-10-01 01:16:00+00	2026-10-22 10:28:38.755558+00
c1b2c3d4-0002-4000-8000-000000000002	a1b2c3d4-0002-4000-8000-000000000002	idem-key-002	70000	momo	success	TXN-999002	2026-10-01 02:31:00+00	2026-10-22 10:28:38.755558+00
\.


--
-- Data for Name: product_size; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_size (size_id, product_id, size, add_price) FROM stdin;
2c18cb74-3276-40c4-82b2-8ba7e894e104	11111111-1111-4111-8111-111111111101	S	0.00
8cb0456a-b673-460f-a0c9-a6c2c9b1da73	11111111-1111-4111-8111-111111111101	M	5000.00
ddcdf6a9-3e12-48f4-a351-f461040c37d0	11111111-1111-4111-8111-111111111101	L	10000.00
b00d9e80-3ba3-423d-b783-54001faa5502	11111111-1111-4111-8111-111111111102	S	0.00
acc191e7-7156-4cd5-a01b-e708eff6bf89	11111111-1111-4111-8111-111111111102	M	5000.00
4268fc3b-164d-41c8-9215-ef4b7784e7c7	11111111-1111-4111-8111-111111111102	L	10000.00
\.


--
-- Data for Name: product_toppings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_toppings (product_id, topping_id) FROM stdin;
11111111-1111-4111-8111-111111111101	22222222-2222-4222-8222-222222222201
11111111-1111-4111-8111-111111111101	22222222-2222-4222-8222-222222222202
11111111-1111-4111-8111-111111111102	22222222-2222-4222-8222-222222222203
11111111-1111-4111-8111-111111111106	22222222-2222-4222-8222-222222222204
\.


--
-- PostgreSQL database dump complete
--

\unrestrict jPqqhwtQbTbhWF20Cfi2Cl9Tk9wdJNKPn1kJE5kt8EvDqMnOu7UliGc4opBDSWE

