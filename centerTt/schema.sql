-- Mumbai Local (Central Line) Timetable Schema
-- Generated from Central Railway CSMT-Kalyan-Khopoli-Kasara "Down" timetable PDF

CREATE TABLE stations (
    station_id   INTEGER PRIMARY KEY,
    station_name TEXT NOT NULL UNIQUE,
    seq_order    INTEGER NOT NULL,      -- position along CSMT -> Kasara/Khopoli corridor
    branch       TEXT DEFAULT 'main'    -- 'main' (Kasara branch) or 'khopoli' (after Kalyan)
);

CREATE TABLE trains (
    train_no     TEXT PRIMARY KEY,      -- official train number, e.g. '96301'
    link_code    TEXT,                  -- internal railway crew/rake link code (not passenger-facing)
    service_type TEXT,                  -- 'AC' | 'FAST' | 'SLOW' (derived from flags, see notes)
    direction    TEXT DEFAULT 'DOWN',   -- DOWN = CSMT -> Kasara/Khopoli, UP = reverse (separate PDF)
    source_page  INTEGER                -- page number in source PDF, for traceability/debugging
);

CREATE TABLE stop_times (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    train_no     TEXT NOT NULL REFERENCES trains(train_no),
    station_id   INTEGER NOT NULL REFERENCES stations(station_id),
    scheduled_time TEXT NOT NULL,        -- 'HH:MM', 24hr where possible (see notes on am/pm ambiguity)
    UNIQUE(train_no, station_id)
);

CREATE INDEX idx_stop_times_train ON stop_times(train_no);
CREATE INDEX idx_stop_times_station ON stop_times(station_id);
