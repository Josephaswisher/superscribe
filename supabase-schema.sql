-- SuperScribe Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  original_signout TEXT,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_last_modified ON documents(last_modified DESC);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (optional - enable if you want user isolation)
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy for users to only see their own documents (uncomment if using RLS)
-- CREATE POLICY "Users can view their own documents"
--   ON documents FOR SELECT
--   USING (user_id = auth.uid()::text OR user_id IS NULL);

-- CREATE POLICY "Users can insert their own documents"
--   ON documents FOR INSERT
--   WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL);

-- CREATE POLICY "Users can update their own documents"
--   ON documents FOR UPDATE
--   USING (user_id = auth.uid()::text OR user_id IS NULL);

-- CREATE POLICY "Users can delete their own documents"
--   ON documents FOR DELETE
--   USING (user_id = auth.uid()::text OR user_id IS NULL);
