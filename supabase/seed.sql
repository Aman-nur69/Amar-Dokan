-- ==============================================================================
-- MudiDokan (মুদিদোকান) Seed Dataset
-- Location: Mirpur 10, Dhaka
-- ==============================================================================

-- 1. Create Demo Store
INSERT INTO stores (id, name, proprietor, phone, address, bkash_number, nagad_number, currency_symbol)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'ভাই ভাই স্টোর (Bhai Bhai Store)',
    'মোঃ রফিকুল ইসলাম (Rafiqul Islam)',
    '01711998877',
    'দোকান নং ১২, মীরপুর-১০ গোলচত্বর বাজার, ঢাকা-১২১৬',
    '01711998877',
    '01811998877',
    '৳'
) ON CONFLICT (id) DO NOTHING;

-- 2. Categories
INSERT INTO categories (id, store_id, name_bn, name_en, icon) VALUES
('b1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'নিত্যপ্রয়োজনীয় (Daily Essentials)', 'Daily Essentials', 'shopping-bag'),
('b2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'তেল ও ঘি (Oil & Ghee)', 'Oil & Ghee', 'droplet'),
('b3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'চাল ও ডাল (Rice & Pulses)', 'Rice & Pulses', 'wheat'),
('b4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মশলা ও আদা-রসুন (Spices)', 'Spices', 'sparkles'),
('b5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'স্ন্যাকস ও বিস্কুট (Snacks & Bakery)', 'Snacks & Bakery', 'cookie'),
('b6666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'টয়লেট্রিজ ও সাবান (Toiletries)', 'Toiletries', 'shield-check')
ON CONFLICT (id) DO NOTHING;

-- 3. Products (Unbarcoded Bulk & Fast Items + Barcoded packaged FMCG)
INSERT INTO products (id, store_id, category_id, barcode, name_bn, name_en, unit, cost_price, selling_price, stock_quantity, min_stock_alert, is_quick_item) VALUES
-- Fast unbarcoded items for POS touch grid
('c1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b2222222-2222-2222-2222-222222222222', NULL, 'খোলা সয়াবিন তেল', 'Loose Soybean Oil', 'litre', 160.00, 175.00, 120.000, 20.000, TRUE),
('c2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'দেশি সাদা চিনি', 'White Sugar', 'kg', 125.00, 138.00, 85.500, 15.000, TRUE),
('c3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b3333333-3333-3333-3333-333333333333', NULL, 'মসুর ডাল (চিকন)', 'Red Lentil (Fine)', 'kg', 130.00, 145.00, 65.000, 10.000, TRUE),
('c4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'ফার্মের লাল ডিম (১ হালি)', 'Farm Red Eggs (4 pcs)', 'hali', 42.00, 48.00, 150.000, 25.000, TRUE),
('c5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'নতুন গোল আলু', 'Fresh Potato', 'kg', 32.00, 40.00, 250.000, 40.000, TRUE),
('c6666666-6666-6666-6666-666666666666', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', NULL, 'দেশি পেঁয়াজ', 'Local Onion', 'kg', 60.00, 75.00, 95.000, 20.000, TRUE),
('c7777777-7777-7777-7777-777777777777', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b3333333-3333-3333-3333-333333333333', NULL, 'মিনিকেট চাল (৫০ কেজি বস্তা খোলা)', 'Miniket Rice Loose', 'kg', 68.00, 76.00, 320.000, 50.000, TRUE),
('c8888888-8888-8888-8888-888888888888', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b4444444-4444-4444-4444-444444444444', NULL, 'দেশি রসুন', 'Local Garlic', 'kg', 180.00, 210.00, 30.000, 8.000, TRUE),

-- Packaged items with barcodes
('c9999999-9999-9999-9999-999999999999', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b2222222-2222-2222-2222-222222222222', '8941100501123', 'রূপচাঁদা সয়াবিন তেল (২ লিটার)', 'Rupchanda Soybean Oil 2L', 'packet', 350.00, 375.00, 18.000, 5.000, FALSE),
('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b5555555-5555-5555-5555-555555555555', '8941100332211', 'ম্যাগি ২-মিনিট নুডুলস (৮ প্যাক)', 'Maggi 2-Min Noodles (8 pack)', 'packet', 135.00, 150.00, 4.000, 8.000, FALSE), -- Low stock alert
('cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b6666666-6666-6666-6666-666666666666', '8941100778899', 'লাইফবয় টোটাল সাবান (১০০ গ্রাম)', 'Lifebuoy Total Soap 100g', 'piece', 42.00, 50.00, 0.000, 10.000, FALSE), -- Out of stock alert
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b1111111-1111-1111-1111-111111111111', '8941100445566', 'তীর আটা (২ কেজি প্যাকেট)', 'Teer Atta 2kg Packet', 'packet', 115.00, 128.00, 35.000, 10.000, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Regular Credit Customers (Bakir Khata)
INSERT INTO customers (id, store_id, name, phone, address, current_balance, credit_limit) VALUES
('d1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'হাজী শামসুল হক (বাড়িয়ালা)', '01819234567', 'বাড়ি নং ৪২, রোড ৭, মীরপুর ১০', 2450.00, 10000.00),
('d2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মাওলানা আব্দুর রশিদ', '01712345678', 'বায়তুল আমান মসজিদ গলি', 850.00, 5000.00),
('d3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'মোঃ কবির হোসেন (রিকশাচালক)', '01918765432', 'পূর্ব বস্তি, মিরপুর ১০', 320.00, 1500.00),
('d4444444-4444-4444-4444-444444444444', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'সুমন আহমেদ (চাকরিজীবী)', '01611223344', 'ফ্ল্যাট ৩বি, মীম টাওয়ার', 0.00, 8000.00),
('d5555555-5555-5555-5555-555555555555', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'নাসরীন আক্তার (গৃহিণী)', '01511998844', 'হাউজিং স্টাফ কোয়ার্টার', 1420.00, 5000.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Historical Baki Transactions
INSERT INTO baki_transactions (id, store_id, customer_id, type, amount, payment_method, note, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd1111111-1111-1111-1111-111111111111', 'DEBIT', 3450.00, 'CASH', 'মাসের শুরুর বড় সওদা', NOW() - INTERVAL '4 days'),
('e2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd1111111-1111-1111-1111-111111111111', 'CREDIT', 1000.00, 'BKASH', 'বিকাশে আংশিক বকেয়া পরিশোধ', NOW() - INTERVAL '1 day'),
('e3333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd2222222-2222-2222-2222-222222222222', 'DEBIT', 850.00, 'CASH', 'তেল ও ডাল বাকিতে ক্রয়', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Sample Expenses
INSERT INTO expenses (id, store_id, category, amount, note, expense_date) VALUES
('f1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'দোকানের চা-নাস্তা', 120.00, 'গ্রাহক ও কর্মীদের চা বিস্কুট', CURRENT_DATE),
('f2222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'পরিবহন খরচ (ভ্যান)', 250.00, 'কারওয়ান বাজার থেকে মাল আনা', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;
