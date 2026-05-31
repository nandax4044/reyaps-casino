/**
 * WITHDRAWAL ENDPOINTS - Tambahkan ke server.ts sebelum app.listen()
 * Copy-paste semua endpoint ini ke server.ts
 */

// ─── WITHDRAWAL: Get All Logs (Admin) ──────────────────────────────────────────
// app.get('/api/admin/withdrawals', authenticateUser, verifyStaff, async (req, res) => {
//   const { status } = req.query;
//
//   if (isSupabaseConfigured && supabaseAdmin) {
//     try {
//       let query = supabaseAdmin
//         .from('withdrawal_logs')
//         .select('*')
//         .order('requested_at', { ascending: false });
//
//       if (status) {
//         query = query.eq('status', status as string);
//       }
//
//       const { data: logs, error } = await query.limit(100);
//
//       if (error) throw error;
//       res.json(logs || []);
//     } catch (e: any) {
//       res.status(500).json({ error: e.message });
//     }
//   } else {
//     // Local memory fallback
//     res.json([]);
//   }
// });

// ─── WITHDRAWAL: Complete Withdrawal (Admin) ───────────────────────────────────
// app.post('/api/admin/withdrawals/:withdrawalId/complete', authenticateUser, verifyStaff, async (req, res) => {
//   const { withdrawalId } = req.params;
//   const { notes } = req.body;
//   const adminId = req.body._userId;
//
//   if (isSupabaseConfigured && supabaseAdmin) {
//     try {
//       // Get withdrawal log
//       const { data: withdrawal, error: getError } = await supabaseAdmin
//         .from('withdrawal_logs')
//         .select('*')
//         .eq('id', withdrawalId)
//         .single();
//
//       if (getError || !withdrawal) {
//         return res.status(404).json({ error: 'Withdrawal log tidak ditemukan' });
//       }
//
//       // Update withdrawal log
//       const { error: updateLogError } = await supabaseAdmin
//         .from('withdrawal_logs')
//         .update({
//           status: 'completed',
//           completed_at: new Date().toISOString(),
//           admin_id: adminId,
//           admin_notes: notes || 'Completed by admin'
//         })
//         .eq('id', withdrawalId);
//
//       if (updateLogError) throw updateLogError;
//
//       // Update inventory item status
//       const { error: updateInvError } = await supabaseAdmin
//         .from('inventory')
//         .update({ status: 'withdrawn' })
//         .eq('id', withdrawal.inventory_item_id);
//
//       if (updateInvError) throw updateInvError;
//
//       // Send Discord notification
//       await sendDiscordCompletionNotification(withdrawal, adminId);
//
//       res.json({ success: true, message: 'Withdrawal berhasil diselesaikan!' });
//     } catch (e: any) {
//       res.status(500).json({ error: e.message });
//     }
//   } else {
//     res.json({ success: true, message: 'Withdrawal completed (local mode)' });
//   }
// });

// ─── WITHDRAWAL: Reject Withdrawal (Admin) ─────────────────────────────────────
// app.post('/api/admin/withdrawals/:withdrawalId/reject', authenticateUser, verifyStaff, async (req, res) => {
//   const { withdrawalId } = req.params;
//   const { reason } = req.body;
//   const adminId = req.body._userId;
//
//   if (isSupabaseConfigured && supabaseAdmin) {
//     try {
//       // Get withdrawal log
//       const { data: withdrawal, error: getError } = await supabaseAdmin
//         .from('withdrawal_logs')
//         .select('*')
//         .eq('id', withdrawalId)
//         .single();
//
//       if (getError || !withdrawal) {
//         return res.status(404).json({ error: 'Withdrawal log tidak ditemukan' });
//       }
//
//       // Update withdrawal log
//       const { error: updateLogError } = await supabaseAdmin
//         .from('withdrawal_logs')
//         .update({
//           status: 'rejected',
//           completed_at: new Date().toISOString(),
//           admin_id: adminId,
//           admin_notes: reason
//         })
//         .eq('id', withdrawalId);
//
//       if (updateLogError) throw updateLogError;
//
//       // Revert inventory item status
//       const { error: updateInvError } = await supabaseAdmin
//         .from('inventory')
//         .update({ status: 'available' })
//         .eq('id', withdrawal.inventory_item_id);
//
//       if (updateInvError) throw updateInvError;
//
//       // Send Discord notification
//       await sendDiscordRejectionNotification(withdrawal, adminId, reason);
//
//       res.json({ success: true, message: 'Withdrawal berhasil ditolak!' });
//     } catch (e: any) {
//       res.status(500).json({ error: e.message });
//     }
//   } else {
//     res.json({ success: true, message: 'Withdrawal rejected (local mode)' });
//   }
// });

// ─── HELPER: Send Discord Completion Notification ────────────────────────────
// async function sendDiscordCompletionNotification(withdrawal: any, adminId: string): Promise<void> {
//   try {
//     const { data: webhookConfig } = await supabaseAdmin
//       .from('site_content')
//       .select('content_value')
//       .eq('content_key', 'discord_webhook_url')
//       .single();
//
//     if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
//       return;
//     }
//
//     const webhookUrl = webhookConfig.content_value;
//
//     const embed = {
//       title: '✅ Withdrawal Completed',
//       description: `Withdrawal has been processed and completed`,
//       color: 3066993, // Green
//       fields: [
//         { name: 'Item', value: withdrawal.item_name, inline: true },
//         { name: 'Value', value: `$${withdrawal.item_value.toFixed(2)}`, inline: true },
//         { name: 'Withdrawal ID', value: withdrawal.id, inline: true },
//         { name: 'Completed By', value: `Admin (${adminId})`, inline: true }
//       ],
//       timestamp: new Date().toISOString(),
//       footer: { text: 'ReyaBet Withdrawal System' }
//     };
//
//     await fetch(webhookUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ embeds: [embed] })
//     });
//   } catch (error) {
//     console.error('[DISCORD] Error sending completion notification:', error);
//   }
// }

// ─── HELPER: Send Discord Rejection Notification ───────────────────────────────
// async function sendDiscordRejectionNotification(
//   withdrawal: any,
//   adminId: string,
//   reason: string
// ): Promise<void> {
//   try {
//     const { data: webhookConfig } = await supabaseAdmin
//       .from('site_content')
//       .select('content_value')
//       .eq('content_key', 'discord_webhook_url')
//       .single();
//
//     if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
//       return;
//     }
//
//     const webhookUrl = webhookConfig.content_value;
//
//     const embed = {
//       title: '❌ Withdrawal Rejected',
//       description: `Withdrawal request has been rejected`,
//       color: 15158332, // Red
//       fields: [
//         { name: 'Item', value: withdrawal.item_name, inline: true },
//         { name: 'Reason', value: reason, inline: true },
//         { name: 'Withdrawal ID', value: withdrawal.id, inline: true },
//         { name: 'Rejected By', value: `Admin (${adminId})`, inline: true }
//       ],
//       timestamp: new Date().toISOString(),
//       footer: { text: 'ReyaBet Withdrawal System' }
//     };
//
//     await fetch(webhookUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ embeds: [embed] })
//     });
//   } catch (error) {
//     console.error('[DISCORD] Error sending rejection notification:', error);
//   }
// }

// ─── HELPER: Send Discord Withdrawal Request Notification ──────────────────────
// async function sendDiscordWithdrawalNotification(
//   itemName: string,
//   itemValue: number,
//   username: string,
//   userId: string,
//   withdrawalId: string
// ): Promise<void> {
//   try {
//     const { data: webhookConfig } = await supabaseAdmin
//       .from('site_content')
//       .select('content_value')
//       .eq('content_key', 'discord_webhook_url')
//       .single();
//
//     if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
//       console.warn('[DISCORD] Webhook URL not configured');
//       return;
//     }
//
//     const webhookUrl = webhookConfig.content_value;
//
//     const embed = {
//       title: '🎁 New Withdrawal Request',
//       description: `A player has requested to withdraw an item`,
//       color: 3447003, // Blue
//       fields: [
//         { name: 'Player', value: `${username} (${userId})`, inline: true },
//         { name: 'Item', value: itemName, inline: true },
//         { name: 'Value', value: `$${itemValue.toFixed(2)}`, inline: true },
//         { name: 'Withdrawal ID', value: withdrawalId, inline: true },
//         { name: 'Status', value: '⏳ Pending', inline: true }
//       ],
//       timestamp: new Date().toISOString(),
//       footer: { text: 'ReyaBet Withdrawal System' }
//     };
//
//     await fetch(webhookUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         embeds: [embed],
//         content: '@here New withdrawal request pending approval!'
//       })
//     });
//   } catch (error) {
//     console.error('[DISCORD] Error sending notification:', error);
//   }
// }
