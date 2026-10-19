ALTER TABLE commerce_orders
  ADD COLUMN payment_method VARCHAR(30) NULL,
  ADD COLUMN payment_reference VARCHAR(190) NULL,
  ADD COLUMN payment_notes TEXT NULL,
  ADD COLUMN recorded_by BIGINT UNSIGNED NULL,
  ADD UNIQUE KEY uq_manual_payment_reference (payment_method,payment_reference);
