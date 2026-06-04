ALTER TABLE orders
  ADD COLUMN payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER charge;

CREATE TABLE IF NOT EXISTS recharges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(12, 4) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'usd',
  status ENUM('pending', 'paid', 'failed', 'canceled') NOT NULL DEFAULT 'pending',
  provider VARCHAR(40) NOT NULL DEFAULT 'stripe',
  stripe_checkout_session_id VARCHAR(255) NULL,
  stripe_payment_intent_id VARCHAR(255) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY recharges_stripe_checkout_session_unique (stripe_checkout_session_id),
  KEY recharges_user_id_index (user_id),
  KEY recharges_status_index (status),
  CONSTRAINT recharges_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('recharge', 'order_debit', 'refund') NOT NULL,
  amount DECIMAL(12, 4) NOT NULL,
  balance_before DECIMAL(12, 4) NOT NULL,
  balance_after DECIMAL(12, 4) NOT NULL,
  reference_type VARCHAR(40) NULL,
  reference_id BIGINT UNSIGNED NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY wallet_transactions_user_id_index (user_id),
  KEY wallet_transactions_reference_index (reference_type, reference_id),
  CONSTRAINT wallet_transactions_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
