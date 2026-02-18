-- 分析回数を保存するテーブル
CREATE TABLE IF NOT EXISTS analysis_count (
  id TEXT PRIMARY KEY DEFAULT 'total',
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analysis_count_updated_at BEFORE UPDATE ON analysis_count
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期レコードを挿入（存在しない場合のみ）
INSERT INTO analysis_count (id, count)
VALUES ('total', 0)
ON CONFLICT (id) DO NOTHING;
