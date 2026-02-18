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
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
