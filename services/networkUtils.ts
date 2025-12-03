/**
 * Network detection utilities
 * Health check for Supabase availability
 */

/**
 * Check if Supabase is currently reachable
 */
export async function checkSupabaseHealth(
  supabaseUrl: string,
  anonKey: string
): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    return response.status !== 503;
  } catch (error) {
    console.warn('[Network] Supabase health check failed:', error);
    return false;
  }
}
