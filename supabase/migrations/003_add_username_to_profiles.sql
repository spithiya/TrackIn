-- Add username column to profiles for username-based login
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON profiles (lower(username));
