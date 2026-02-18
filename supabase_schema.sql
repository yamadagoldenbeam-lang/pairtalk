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

-- 日ごとの分析回数を記録するテーブル
CREATE TABLE IF NOT EXISTS analysis_daily (
  date DATE PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 日ごとのテーブルの更新日時を自動更新するトリガー
CREATE TRIGGER update_analysis_daily_updated_at BEFORE UPDATE ON analysis_daily
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 日ごとのデータをインクリメントする関数
CREATE OR REPLACE FUNCTION increment_daily_analysis(target_date DATE)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  INSERT INTO analysis_daily (date, count)
  VALUES (target_date, 1)
  ON CONFLICT (date) DO UPDATE
  SET count = analysis_daily.count + 1,
      updated_at = NOW()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- 関数の実行権限を付与
GRANT EXECUTE ON FUNCTION increment_daily_analysis(DATE) TO anon, authenticated;
