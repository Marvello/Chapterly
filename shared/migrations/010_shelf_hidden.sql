-- "Continue reading" dismissal: the read_at that was current when the user hid the novel from the shelf.
-- Hidden while read_at still equals it; reading further changes read_at, so the novel comes back.
ALTER TABLE reading_progress ADD COLUMN shelf_hidden_read_at TEXT;
