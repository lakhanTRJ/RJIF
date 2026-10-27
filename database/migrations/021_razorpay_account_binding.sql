-- Bind orders to the immutable public Key ID, never to a secret or mutable label.
-- The cutover script backfills existing rows using the previous account's Key ID.
ALTER TABLE commerce_orders ADD COLUMN razorpay_key_id VARCHAR(100) NULL;
