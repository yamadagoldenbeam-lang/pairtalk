import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // analysis_countテーブルから現在のカウントを取得してインクリメント
    const { data, error } = await supabase
      .from('analysis_count')
      .select('count')
      .eq('id', 'total')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
      console.error('Error fetching count:', error);
      return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
    }

    const currentCount = data?.count || 0;
    const newCount = currentCount + 1;

    // レコードが存在しない場合は作成、存在する場合は更新
    const { error: upsertError } = await supabase
      .from('analysis_count')
      .upsert({ id: 'total', count: newCount }, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error updating count:', upsertError);
      return NextResponse.json({ error: 'Failed to update count' }, { status: 500 });
    }

    // 日ごとの分析回数もインクリメント
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
    const { error: dailyError } = await supabase.rpc('increment_daily_analysis', {
      target_date: today
    });

    if (dailyError) {
      console.error('Error incrementing daily count:', dailyError);
      // 日ごとの記録エラーは無視して続行（総計は更新済み）
    }

    return NextResponse.json({ count: newCount });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { searchParams } = new URL(request.url);
    const daily = searchParams.get('daily') === 'true';

    if (daily) {
      // 日ごとのデータを取得（過去30日分）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('analysis_daily')
        .select('date, count')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching daily data:', error);
        return NextResponse.json({ error: 'Failed to fetch daily data' }, { status: 500 });
      }

      // 日付ごとのデータを整形（欠けている日は0で埋める）
      const dailyData: { date: string; count: number }[] = [];
      const dataMap = new Map((data || []).map(d => [d.date, d.count]));
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split('T')[0];
        dailyData.push({
          date: dateStr,
          count: dataMap.get(dateStr) || 0
        });
      }

      // MAU（過去30日間のユニークユーザー数）を計算
      // ここでは簡易的に、過去30日間の合計分析回数を使用
      const mau = dailyData.reduce((sum, d) => sum + d.count, 0);

      return NextResponse.json({ 
        daily: dailyData,
        mau: mau
      });
    } else {
      // 総計のみ取得
      const { data, error } = await supabase
        .from('analysis_count')
        .select('count')
        .eq('id', 'total')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ count: 0 });
        }
        console.error('Error fetching count:', error);
        return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
      }

      return NextResponse.json({ count: data?.count || 0 });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
