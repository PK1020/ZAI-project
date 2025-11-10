-- Tabela użytkowników
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       username VARCHAR(100) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL -- Hash z bcrypt
);

-- Tabela serii pomiarowych
CREATE TABLE series (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        min_value NUMERIC(10, 2) NOT NULL,
                        max_value NUMERIC(10, 2) NOT NULL,
                        color VARCHAR(7) DEFAULT '#000000',
                        icon VARCHAR(50) DEFAULT 'default'
);

-- Tabela pomiarów temperatury
CREATE TABLE measurements (
                              id SERIAL PRIMARY KEY,
                              value NUMERIC(10, 2) NOT NULL,
                              "timestamp" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
                              series_id INT NOT NULL,

                              CONSTRAINT fk_series
                                  FOREIGN KEY(series_id)
                                      REFERENCES series(id)
                                      ON DELETE CASCADE
);