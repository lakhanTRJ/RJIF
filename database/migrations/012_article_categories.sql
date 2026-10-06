ALTER TABLE articles
  ADD COLUMN category VARCHAR(120) NOT NULL DEFAULT 'Industry Insights' AFTER excerpt,
  ADD INDEX idx_articles_category (category);
