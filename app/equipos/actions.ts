'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function createTeam(formData: FormData, playerUids: string[]) {
  if (cookies().get('a3stats_session')?.value !== 'true') return { success: false, error: 'Unauthorized' };
  const supabase = createAdminClient();
  const name = formData.get('name') as string;
  const tag = formData.get('tag') as string;
  const logo_url = formData.get('logo_url') as string;

  try {
    // Insert Team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([{ name, tag, logo_url }])
      .select('id')
      .single();

    if (teamError) throw teamError;

    // Insert Team Players
    if (playerUids && playerUids.length > 0) {
      await supabase.from('team_players').delete().in('player_uid', playerUids);

      const teamPlayers = playerUids.map(uid => ({
        team_id: team.id,
        player_uid: uid
      }));

      const { error: membersError } = await supabase
        .from('team_players')
        .insert(teamPlayers);

      if (membersError) throw membersError;
    }

    revalidatePath('/equipos');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating team:', error.message);
    return { success: false, error: error.message };
  }
}

export async function updateTeam(teamId: string, formData: FormData, playerUids: string[]) {
  if (cookies().get('a3stats_session')?.value !== 'true') return { success: false, error: 'Unauthorized' };
  const supabase = createAdminClient();
  const name = formData.get('name') as string;
  const tag = formData.get('tag') as string;
  const logo_url = formData.get('logo_url') as string;

  try {
    // 1. Validar y actualizar los campos base del equipo
    const { error: teamError } = await supabase
      .from('teams')
      .update({ name, tag, logo_url })
      .eq('id', teamId);

    if (teamError) throw teamError;

    // 2. Eliminar referencias pasadas de team_players
    const { error: deleteError } = await supabase
      .from('team_players')
      .delete()
      .eq('team_id', teamId);
    
    if (deleteError) throw deleteError;

    // 3. Re-insertar la nueva lista de miembros
    if (playerUids && playerUids.length > 0) {
      await supabase.from('team_players').delete().in('player_uid', playerUids);

      const teamPlayers = playerUids.map(uid => ({
        team_id: teamId,
        player_uid: uid
      }));

      const { error: membersError } = await supabase
        .from('team_players')
        .insert(teamPlayers);

      if (membersError) throw membersError;
    }

    revalidatePath('/equipos');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating team:', error.message);
    return { success: false, error: error.message };
  }
}
