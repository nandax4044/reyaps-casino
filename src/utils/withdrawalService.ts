/**
 * Withdrawal Service
 * Handles withdrawal requests, Discord notifications, and logging
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://rwngqiakigebtwxohiri.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Send Discord Notification ────────────────────────────────────────────────
export async function sendDiscordNotification(
  itemName: string,
  itemValue: number,
  username: string,
  userId: string,
  withdrawalId: string
): Promise<string | null> {
  try {
    // Get Discord webhook URL from site_content
    const { data: webhookConfig } = await supabaseAdmin
      .from('site_content')
      .select('content_value')
      .eq('content_key', 'discord_webhook_url')
      .single();

    if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
      console.warn('[DISCORD] Webhook URL not configured');
      return null;
    }

    const webhookUrl = webhookConfig.content_value;

    const embed = {
      title: '🎁 New Withdrawal Request',
      description: `A player has requested to withdraw an item`,
      color: 3447003, // Blue
      fields: [
        {
          name: 'Player',
          value: `${username} (${userId})`,
          inline: true
        },
        {
          name: 'Item',
          value: itemName,
          inline: true
        },
        {
          name: 'Value',
          value: `$${itemValue.toFixed(2)}`,
          inline: true
        },
        {
          name: 'Withdrawal ID',
          value: withdrawalId,
          inline: true
        },
        {
          name: 'Status',
          value: '⏳ Pending',
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ReyaBet Withdrawal System'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
        content: '@here New withdrawal request pending approval!'
      })
    });

    if (!response.ok) {
      console.error('[DISCORD] Failed to send notification:', response.statusText);
      return null;
    }

    // Extract message ID from response if available
    const data = await response.json();
    return data.id || withdrawalId;
  } catch (error) {
    console.error('[DISCORD] Error sending notification:', error);
    return null;
  }
}

// ─── Create Withdrawal Log ────────────────────────────────────────────────────
export async function createWithdrawalLog(
  userId: string,
  inventoryItemId: string,
  itemName: string,
  itemValue: number
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawal_logs')
      .insert({
        user_id: userId,
        inventory_item_id: inventoryItemId,
        item_name: itemName,
        item_value: itemValue,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('[WITHDRAWAL LOG] Error creating log:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('[WITHDRAWAL LOG] Exception:', error);
    return null;
  }
}

// ─── Complete Withdrawal (Admin Action) ────────────────────────────────────────
export async function completeWithdrawal(
  withdrawalId: string,
  adminId: string,
  adminNotes?: string
): Promise<boolean> {
  try {
    // Get withdrawal log
    const { data: withdrawal, error: getError } = await supabaseAdmin
      .from('withdrawal_logs')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (getError || !withdrawal) {
      console.error('[WITHDRAWAL] Log not found:', withdrawalId);
      return false;
    }

    // Update withdrawal log status
    const { error: updateLogError } = await supabaseAdmin
      .from('withdrawal_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_id: adminId,
        admin_notes: adminNotes || 'Completed by admin'
      })
      .eq('id', withdrawalId);

    if (updateLogError) {
      console.error('[WITHDRAWAL] Error updating log:', updateLogError);
      return false;
    }

    // Update inventory item status
    const { error: updateInvError } = await supabaseAdmin
      .from('inventory')
      .update({ status: 'withdrawn' })
      .eq('id', withdrawal.inventory_item_id);

    if (updateInvError) {
      console.error('[WITHDRAWAL] Error updating inventory:', updateInvError);
      return false;
    }

    // Send Discord completion notification
    await sendDiscordCompletionNotification(withdrawal, adminId);

    return true;
  } catch (error) {
    console.error('[WITHDRAWAL] Exception completing withdrawal:', error);
    return false;
  }
}

// ─── Reject Withdrawal (Admin Action) ──────────────────────────────────────────
export async function rejectWithdrawal(
  withdrawalId: string,
  adminId: string,
  reason: string
): Promise<boolean> {
  try {
    // Get withdrawal log
    const { data: withdrawal, error: getError } = await supabaseAdmin
      .from('withdrawal_logs')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (getError || !withdrawal) {
      console.error('[WITHDRAWAL] Log not found:', withdrawalId);
      return false;
    }

    // Update withdrawal log status
    const { error: updateLogError } = await supabaseAdmin
      .from('withdrawal_logs')
      .update({
        status: 'rejected',
        completed_at: new Date().toISOString(),
        admin_id: adminId,
        admin_notes: reason
      })
      .eq('id', withdrawalId);

    if (updateLogError) {
      console.error('[WITHDRAWAL] Error updating log:', updateLogError);
      return false;
    }

    // Revert inventory item status back to available
    const { error: updateInvError } = await supabaseAdmin
      .from('inventory')
      .update({ status: 'available' })
      .eq('id', withdrawal.inventory_item_id);

    if (updateInvError) {
      console.error('[WITHDRAWAL] Error updating inventory:', updateInvError);
      return false;
    }

    // Send Discord rejection notification
    await sendDiscordRejectionNotification(withdrawal, adminId, reason);

    return true;
  } catch (error) {
    console.error('[WITHDRAWAL] Exception rejecting withdrawal:', error);
    return false;
  }
}

// ─── Send Discord Completion Notification ─────────────────────────────────────
async function sendDiscordCompletionNotification(
  withdrawal: any,
  adminId: string
): Promise<void> {
  try {
    const { data: webhookConfig } = await supabaseAdmin
      .from('site_content')
      .select('content_value')
      .eq('content_key', 'discord_webhook_url')
      .single();

    if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
      return;
    }

    const webhookUrl = webhookConfig.content_value;

    const embed = {
      title: '✅ Withdrawal Completed',
      description: `Withdrawal has been processed and completed`,
      color: 3066993, // Green
      fields: [
        {
          name: 'Item',
          value: withdrawal.item_name,
          inline: true
        },
        {
          name: 'Value',
          value: `$${withdrawal.item_value.toFixed(2)}`,
          inline: true
        },
        {
          name: 'Withdrawal ID',
          value: withdrawal.id,
          inline: true
        },
        {
          name: 'Completed By',
          value: `Admin (${adminId})`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ReyaBet Withdrawal System'
      }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('[DISCORD] Error sending completion notification:', error);
  }
}

// ─── Send Discord Rejection Notification ──────────────────────────────────────
async function sendDiscordRejectionNotification(
  withdrawal: any,
  adminId: string,
  reason: string
): Promise<void> {
  try {
    const { data: webhookConfig } = await supabaseAdmin
      .from('site_content')
      .select('content_value')
      .eq('content_key', 'discord_webhook_url')
      .single();

    if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
      return;
    }

    const webhookUrl = webhookConfig.content_value;

    const embed = {
      title: '❌ Withdrawal Rejected',
      description: `Withdrawal request has been rejected`,
      color: 15158332, // Red
      fields: [
        {
          name: 'Item',
          value: withdrawal.item_name,
          inline: true
        },
        {
          name: 'Reason',
          value: reason,
          inline: true
        },
        {
          name: 'Withdrawal ID',
          value: withdrawal.id,
          inline: true
        },
        {
          name: 'Rejected By',
          value: `Admin (${adminId})`,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'ReyaBet Withdrawal System'
      }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('[DISCORD] Error sending rejection notification:', error);
  }
}

// ─── Get All Withdrawal Logs (Admin) ───────────────────────────────────────────
export async function getWithdrawalLogs(
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('withdrawal_logs')
      .select('*')
      .order('requested_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[WITHDRAWAL LOGS] Error fetching:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[WITHDRAWAL LOGS] Exception:', error);
    return [];
  }
}

// ─── Get User Withdrawal History ──────────────────────────────────────────────
export async function getUserWithdrawalHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawal_logs')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('[WITHDRAWAL HISTORY] Error fetching:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[WITHDRAWAL HISTORY] Exception:', error);
    return [];
  }
}
