CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(120) NULL,
  password_hash VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  google_id VARCHAR(190) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  balance DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  email_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email),
  UNIQUE KEY users_google_id_unique (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  platform VARCHAR(60) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(160) NOT NULL,
  min_quantity_step INT UNSIGNED NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY service_categories_slug_unique (slug),
  KEY service_categories_platform_index (platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  external_service_id BIGINT UNSIGNED NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  platform VARCHAR(60) NOT NULL,
  name VARCHAR(220) NOT NULL,
  service_type VARCHAR(120) NULL,
  rate DECIMAL(12, 6) NOT NULL DEFAULT 0.000000,
  min_quantity INT UNSIGNED NOT NULL DEFAULT 100,
  max_quantity INT UNSIGNED NOT NULL DEFAULT 1000,
  quantity_step INT UNSIGNED NOT NULL DEFAULT 100,
  refill_supported TINYINT(1) NOT NULL DEFAULT 0,
  cancel_supported TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  raw_payload JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY services_external_service_id_unique (external_service_id),
  KEY services_category_id_index (category_id),
  KEY services_platform_index (platform),
  CONSTRAINT services_category_id_fk FOREIGN KEY (category_id)
    REFERENCES service_categories(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  service_id BIGINT UNSIGNED NOT NULL,
  external_order_id BIGINT UNSIGNED NULL,
  link VARCHAR(700) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  charge DECIMAL(12, 4) NOT NULL DEFAULT 0.0000,
  status ENUM('pending', 'processing', 'completed', 'partial', 'canceled', 'failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY orders_user_id_index (user_id),
  KEY orders_service_id_index (service_id),
  CONSTRAINT orders_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT orders_service_id_fk FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
