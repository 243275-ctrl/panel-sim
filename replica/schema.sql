-- panel-sim schema (SQLite dialect, app.db)
-- Access rules: local single-user app; filesystem permissions only.
-- Project content lives in versioned .psim JSON files (structure below);
-- app.db holds only app-level rows.

create table if not exists settings (
  key         text primary key,
  value       text not null,
  updated_at  text not null default (datetime('now'))
);

create table if not exists recent_projects (
  path          text primary key,          -- absolute path to .psim file
  name          text not null,
  last_opened_at text not null default (datetime('now')),
  pinned        integer not null default 0 check (pinned in (0, 1))
);
create index if not exists idx_recent_opened on recent_projects (last_opened_at desc);

-- Reserved for Pro licensing (own design; NOT the original's scheme).
-- Money, when it arrives: integer minor units + currency code.
create table if not exists licenses (
  id             text primary key,          -- license key id (opaque)
  tier           text not null check (tier in ('free', 'pro')),
  expires_at     text,                      -- timestamptz UTC; null = free
  currency       text,                      -- ISO-4217, paid tiers only
  amount_minor   integer,                   -- paid tiers only
  created_at     text not null default (datetime('now')),
  updated_at     text not null default (datetime('now'))
);

-- ---------------------------------------------------------------------------
-- .psim project file (JSON, versioned). One file = one project.
-- Validated on load and save; referential checks are fail-closed.
-- ---------------------------------------------------------------------------
-- {
--   "schema_version": 1,
--   "meta":   { "id": "uuid", "name": "text",
--               "created_at": "iso8601", "updated_at": "iso8601" },
--   "devices": [
--     { "id": "uuid",                      -- unique per project
--       "typeKey": "text",                 -- key into shipped device catalog
--       "name": "text",
--       "x": number, "y": number, "rotation": 0|90|180|270,
--       "params": { ... } }                -- nameplate: power, voltage,
--                                           -- connection: 6|9|12 (motors),
--                                           -- trip settings, etc.
--   ],
--   "wires": [
--     { "id": "uuid",
--       "from": { "deviceId": "uuid", "terminal": "text" },
--       "to":   { "deviceId": "uuid", "terminal": "text" } }
--   ],                                     -- both ends must exist in devices
--   "ladderPrograms": [ ... ],             -- phase 2 (S07)
--   "annotations": [ { "id", "x", "y", "text" } ]
-- }
--
-- Hard constraints enforced by the loader/validator:
--   * unique device ids; wire endpoints reference existing devices+terminals
--   * motor params.connection in (6, 9, 12)
--   * atomic save: write <file>.tmp then rename over <file>
--   * schema_version migrated forward, or load refused with a clear error
