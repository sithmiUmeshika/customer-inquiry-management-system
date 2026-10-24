CREATE TABLE IF NOT EXISTS users (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inquiries (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 customer_name VARCHAR(120) NOT NULL,
 contact_details VARCHAR(200) NOT NULL,
 subject VARCHAR(160) NOT NULL,
 description TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'New' CHECK(status IN ('New','In Progress','Resolved')),
 version INTEGER NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK(length(trim(description)) >= 10)
);
CREATE INDEX IF NOT EXISTS inquiries_owner_updated_idx ON inquiries(created_by, updated_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_owner_status_idx ON inquiries(created_by, status);
