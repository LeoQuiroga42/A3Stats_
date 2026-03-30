import { createAdminClient } from '@/lib/supabase/server';

async function testRpc() {
  const supabase = createAdminClient();

  console.log('=== RPC Test sin args ===');
  const { data: d1, error: e1 } = await supabase.rpc('get_player_stats');
  console.log('data length:', d1?.length ?? 'null');
  console.log('error:', e1 ? JSON.stringify(e1) : 'none');
  if (d1?.[0]) console.log('first row:', JSON.stringify(d1[0]));

  console.log('\n=== RPC Test con p_category_id null ===');
  const { data: d2, error: e2 } = await supabase.rpc('get_player_stats', { p_category_id: null });
  console.log('data length:', d2?.length ?? 'null');
  console.log('error:', e2 ? JSON.stringify(e2) : 'none');
}

testRpc().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
