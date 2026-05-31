# Copy-Paste Ready Code

## 1. AdminDashboard.tsx - Imports

```typescript
import { WithdrawalLogs } from './WithdrawalLogs';
import { 
  Users, Bot, Sliders, ShieldAlert, Plus, Trash2, Edit, Save, 
  Coins, Package, ArrowLeft, RefreshCw, Layers, Check, Info, Settings, RotateCcw,
  Clock // Add this
} from 'lucide-react';
```

## 2. AdminDashboard.tsx - State

Add after `const [activeTab, setActiveTab] = useState<'users' | 'games'>('users');`:

```typescript
const [showWithdrawalLogs, setShowWithdrawalLogs] = useState(false);
```

## 3. AdminDashboard.tsx - Header Button

Replace the header section with this (find "STAFF DASHBOARD" section):

```typescript
{/* Brand Header */}
<div className="glass-panel-noir rounded-2xl p-5 border border-red-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center justify-center">
      <Sliders className="w-5 h-5 text-red-500 animate-pulse" />
    </div>
    <div>
      <h1 className="font-display font-black text-lg md:text-xl text-red-400">STAFF DASHBOARD</h1>
      <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Admin System Controller Mode</p>
    </div>
  </div>
  
  <div className="flex gap-2 flex-wrap">
    {/* Withdrawal Logs Button */}
    <button
      onClick={() => setShowWithdrawalLogs(true)}
      className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs transition flex items-center gap-2 cursor-pointer"
      title="View withdrawal logs"
    >
      <Clock className="w-4 h-4" />
      <span>Withdrawal Logs</span>
    </button>

    {/* Back Button */}
    <button
      onClick={onCloseAdmin}
      className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>KEMBALI KE GAMEPLAY</span>
    </button>
  </div>
</div>
```

## 4. AdminDashboard.tsx - Publish Game Buttons

Find the game config section and add these buttons (look for "SIMPAN KONFIGURASI"):

```typescript
{/* Save & Publish Buttons */}
<div className="flex gap-2 flex-wrap">
  <button
    onClick={handleSaveGameConfig}
    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
  >
    <Save className="w-4 h-4" />
    SIMPAN KONFIGURASI
  </button>
  
  <button
    onClick={async () => {
      if (!confirm(`Publish ${activeGameType} game ke production?`)) return;
      setErrorFeedback('');
      setFeedback('');
      try {
        await API.updateGameConfig(activeGameType, gameConfig);
        setFeedback(`✅ Game ${activeGameType} berhasil dipublish!`);
      } catch (e: any) {
        setErrorFeedback('Gagal publish game: ' + e.message);
      }
    }}
    className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
  >
    <Check className="w-4 h-4" />
    PUBLISH GAME
  </button>

  <button
    onClick={() => {
      if (!confirm(`Reset ${activeGameType} ke default?`)) return;
      setErrorFeedback('');
      setFeedback('');
      API.resetGameConfig(activeGameType)
        .then(resp => {
          setGameConfig(resp.config);
          setFeedback(`Config ${activeGameType} berhasil direset!`);
        })
        .catch(e => setErrorFeedback(e.message));
    }}
    className="py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
  >
    <RotateCcw className="w-4 h-4" />
    RESET DEFAULT
  </button>
</div>
```

## 5. AdminDashboard.tsx - Modal at End

Add before the last closing `</div>` of the component:

```typescript
{/* Withdrawal Logs Modal */}
{showWithdrawalLogs && (
  <WithdrawalLogs onClose={() => setShowWithdrawalLogs(false)} />
)}
```

## 6. UserDashboard.tsx - Updated Withdraw Handler

Replace the `handleWithdrawItem` function:

```typescript
const handleWithdrawItem = async (item: InventoryItem) => {
  if (item.status !== 'available') return;
  
  setErrorFeedback('');
  setFeedback('');
  setWithdrawingId(item.id);

  try {
    // Request withdraw
    const withdrawResp = await API.requestWithdraw(item.id);
    
    // Open Discord
    window.open(discordInviteLink, '_blank');
    
    // Show success feedback
    setFeedback(`✅ Withdrawal request created for ${item.item_name}!\n⏳ Status: PENDING\n📢 Check Discord for staff verification`);
    
    // Refresh data
    await new Promise(resolve => setTimeout(resolve, 1000));
    fetchUserData();
    
  } catch (err: any) {
    setErrorFeedback(`❌ Withdrawal failed: ${err.message || 'Unknown error'}`);
  } finally {
    setWithdrawingId(null);
  }
};
```

## 7. server.ts - Add After Inventory Delete Endpoint

Find this line:
```typescript
app.delete('/api/admin/inventory/:itemId', authenticateUser, verifyStaff, async (req, res) => {
```

After the closing `});` of that endpoint, add:

```typescript
// ─── WITHDRAWAL: Get All Logs (Admin) ──────────────────────────────────────────
app.get('/api/admin/withdrawals', authenticateUser, verifyStaff, async (req, res) => {
  const { status } = req.query;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('withdrawal_logs')
        .select('*')
        .order('requested_at', { ascending: false });

      if (status) {
        query = query.eq('status', status as string);
      }

      const { data: logs, error } = await query.limit(100);

      if (error) throw error;
      res.json(logs || []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json([]);
  }
});

// ─── WITHDRAWAL: Complete Withdrawal (Admin) ───────────────────────────────────
app.post('/api/admin/withdrawals/:withdrawalId/complete', authenticateUser, verifyStaff, async (req, res) => {
  const { withdrawalId } = req.params;
  const { notes } = req.body;
  const adminId = req.body._userId;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: withdrawal, error: getError } = await supabaseAdmin
        .from('withdrawal_logs')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (getError || !withdrawal) {
        return res.status(404).json({ error: 'Withdrawal log tidak ditemukan' });
      }

      const { error: updateLogError } = await supabaseAdmin
        .from('withdrawal_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          admin_id: adminId,
          admin_notes: notes || 'Completed by admin'
        })
        .eq('id', withdrawalId);

      if (updateLogError) throw updateLogError;

      const { error: updateInvError } = await supabaseAdmin
        .from('inventory')
        .update({ status: 'withdrawn' })
        .eq('id', withdrawal.inventory_item_id);

      if (updateInvError) throw updateInvError;

      await sendDiscordCompletionNotification(withdrawal, adminId);

      res.json({ success: true, message: 'Withdrawal berhasil diselesaikan!' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ success: true, message: 'Withdrawal completed (local mode)' });
  }
});

// ─── WITHDRAWAL: Reject Withdrawal (Admin) ─────────────────────────────────────
app.post('/api/admin/withdrawals/:withdrawalId/reject', authenticateUser, verifyStaff, async (req, res) => {
  const { withdrawalId } = req.params;
  const { reason } = req.body;
  const adminId = req.body._userId;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: withdrawal, error: getError } = await supabaseAdmin
        .from('withdrawal_logs')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (getError || !withdrawal) {
        return res.status(404).json({ error: 'Withdrawal log tidak ditemukan' });
      }

      const { error: updateLogError } = await supabaseAdmin
        .from('withdrawal_logs')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
          admin_id: adminId,
          admin_notes: reason
        })
        .eq('id', withdrawalId);

      if (updateLogError) throw updateLogError;

      const { error: updateInvError } = await supabaseAdmin
        .from('inventory')
        .update({ status: 'available' })
        .eq('id', withdrawal.inventory_item_id);

      if (updateInvError) throw updateInvError;

      await sendDiscordRejectionNotification(withdrawal, adminId, reason);

      res.json({ success: true, message: 'Withdrawal berhasil ditolak!' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ success: true, message: 'Withdrawal rejected (local mode)' });
  }
});

// ─── HELPER: Send Discord Completion Notification ────────────────────────────
async function sendDiscordCompletionNotification(withdrawal: any, adminId: string): Promise<void> {
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
      color: 3066993,
      fields: [
        { name: 'Item', value: withdrawal.item_name, inline: true },
        { name: 'Value', value: `$${withdrawal.item_value.toFixed(2)}`, inline: true },
        { name: 'Withdrawal ID', value: withdrawal.id, inline: true },
        { name: 'Completed By', value: `Admin (${adminId})`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'ReyaBet Withdrawal System' }
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

// ─── HELPER: Send Discord Rejection Notification ───────────────────────────────
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
      color: 15158332,
      fields: [
        { name: 'Item', value: withdrawal.item_name, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Withdrawal ID', value: withdrawal.id, inline: true },
        { name: 'Rejected By', value: `Admin (${adminId})`, inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'ReyaBet Withdrawal System' }
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

// ─── HELPER: Send Discord Withdrawal Request Notification ──────────────────────
async function sendDiscordWithdrawalNotification(
  itemName: string,
  itemValue: number,
  username: string,
  userId: string,
  withdrawalId: string
): Promise<void> {
  try {
    const { data: webhookConfig } = await supabaseAdmin
      .from('site_content')
      .select('content_value')
      .eq('content_key', 'discord_webhook_url')
      .single();

    if (!webhookConfig?.content_value || webhookConfig.content_value.includes('YOUR_WEBHOOK')) {
      console.warn('[DISCORD] Webhook URL not configured');
      return;
    }

    const webhookUrl = webhookConfig.content_value;

    const embed = {
      title: '🎁 New Withdrawal Request',
      description: `A player has requested to withdraw an item`,
      color: 3447003,
      fields: [
        { name: 'Player', value: `${username} (${userId})`, inline: true },
        { name: 'Item', value: itemName, inline: true },
        { name: 'Value', value: `$${itemValue.toFixed(2)}`, inline: true },
        { name: 'Withdrawal ID', value: withdrawalId, inline: true },
        { name: 'Status', value: '⏳ Pending', inline: true }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'ReyaBet Withdrawal System' }
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed],
        content: '@here New withdrawal request pending approval!'
      })
    });
  } catch (error) {
    console.error('[DISCORD] Error sending notification:', error);
  }
}
```

## 8. Supabase - Update Withdraw Endpoint

Find `/api/user/withdraw` endpoint and update it to call the helper:

```typescript
// After creating withdrawal log, add:
await sendDiscordWithdrawalNotification(
  item.item_name,
  item.value,
  user.username,
  userId,
  withdrawalLog.id
);
```

## 9. Discord Webhook Configuration

In Supabase, update `site_content` table:

```sql
UPDATE public.site_content 
SET content_value = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN'
WHERE content_key = 'discord_webhook_url';
```

---

**All code is ready to copy-paste!** 🚀
