# UserDashboard Withdraw Handler Update

## Current Implementation

Saat ini, `handleWithdrawItem` di `UserDashboard.tsx` hanya:
1. Update inventory status ke `requested_withdraw`
2. Buka Discord link

## Updated Implementation

Perlu ditambahkan:
1. Create withdrawal log di database
2. Send Discord notification
3. Update inventory status
4. Show pending status

## Code Update

### Replace handleWithdrawItem Function

Cari function `handleWithdrawItem` di `src/components/UserDashboard.tsx` dan ganti dengan:

```typescript
const handleWithdrawItem = async (item: InventoryItem) => {
  if (item.status !== 'available') return;
  
  setErrorFeedback('');
  setFeedback('');
  setWithdrawingId(item.id);

  try {
    // 1. Request withdraw (update inventory status)
    const withdrawResp = await API.requestWithdraw(item.id);
    
    // 2. Create withdrawal log
    // Note: This will be handled by backend when requestWithdraw is called
    // The backend should create the log and send Discord notification
    
    // 3. Open Discord link in new tab
    window.open(discordInviteLink, '_blank');
    
    // 4. Show feedback
    setFeedback(`✅ Withdrawal request created for ${item.item_name}!\n⏳ Status: PENDING\n📢 Check Discord for staff verification`);
    
    // 5. Refresh inventory
    await new Promise(resolve => setTimeout(resolve, 1000));
    fetchUserData();
    
  } catch (err: any) {
    setErrorFeedback(`❌ Withdrawal failed: ${err.message || 'Unknown error'}`);
  } finally {
    setWithdrawingId(null);
  }
};
```

## Backend Update Required

Di `server.ts`, update endpoint `/api/user/withdraw` untuk:

1. Create withdrawal log
2. Send Discord notification
3. Update inventory status

### Updated Endpoint

```typescript
// ─── WITHDRAW REQUEST WITH LOGGING ────────────────────────────────────────────
app.post('/api/user/withdraw', authenticateUser, async (req, res) => {
  const { itemId } = req.body;
  const userId = req.body._userId;
  const user = req.body._user;

  if (!itemId) {
    return res.status(400).json({ error: 'Item ID wajib dilampirkan' });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Get item details
      const { data: item, error: getError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (getError || !item) {
        return res.status(404).json({ error: 'Item tidak ditemukan di inventory Anda!' });
      }

      if (item.status !== 'available') {
        return res.status(400).json({ error: 'Status item ini sudah dalam proses WD!' });
      }

      // 2. Update inventory status
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory')
        .update({ status: 'requested_withdraw' })
        .eq('id', itemId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // 3. Create withdrawal log (if table exists)
      try {
        const { data: withdrawalLog, error: logError } = await supabaseAdmin
          .from('withdrawal_logs')
          .insert({
            user_id: userId,
            inventory_item_id: itemId,
            item_name: item.item_name,
            item_value: item.value,
            status: 'pending',
            requested_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (!logError && withdrawalLog) {
          console.log('[WITHDRAWAL] Log created:', withdrawalLog.id);
          
          // 4. Send Discord notification
          await sendDiscordWithdrawalNotification(
            item.item_name,
            item.value,
            user.username,
            userId,
            withdrawalLog.id
          );
        }
      } catch (logErr) {
        console.warn('[WITHDRAWAL] Could not create log or send notification:', logErr);
        // Don't fail the request if logging fails
      }

      res.json({ 
        success: true, 
        item: updatedItem,
        message: 'Withdrawal request created. Check Discord for staff verification.'
      });
      
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    // Local memory fallback
    const item = localDb.inventory.find(i => i.id === itemId && i.user_id === userId);
    if (!item) return res.status(404).json({ error: 'Item tidak ditemukan di inventory Anda' });
    if (item.status !== 'available') return res.status(400).json({ error: 'Status item ini sudah dalam proses WD!' });
    item.status = 'requested_withdraw';
    res.json({ success: true, item, message: 'Withdrawal request created (local mode)' });
  }
});
```

## Inventory Item Status Display

Update tampilan status di inventory list untuk menunjukkan pending withdrawal:

```typescript
// Di UserDashboard, update status badge rendering:

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'available':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: '✅ Available' };
    case 'requested_withdraw':
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: '⏳ Pending Withdrawal' };
    case 'withdrawn':
      return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: '✔️ Withdrawn' };
    default:
      return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', label: status };
  }
};

// Usage in JSX:
{inventory.map(item => {
  const statusBadge = getStatusBadge(item.status);
  return (
    <div key={item.id} className={`${statusBadge.bg} border ${statusBadge.border} ${statusBadge.text} px-3 py-1 rounded-lg text-xs font-semibold`}>
      {statusBadge.label}
    </div>
  );
})}
```

## Withdraw Button Disable Logic

Update button disable logic untuk pending withdrawals:

```typescript
// Di inventory item render, update withdraw button:

<button
  onClick={() => handleWithdrawItem(item)}
  disabled={item.status !== 'available' || withdrawingId === item.id}
  className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
    item.status !== 'available'
      ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
      : withdrawingId === item.id
      ? 'bg-yellow-600 text-white cursor-wait'
      : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
  }`}
>
  {withdrawingId === item.id ? (
    <>
      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
      Processing...
    </>
  ) : item.status === 'requested_withdraw' ? (
    <>
      <Clock className="w-4 h-4 inline mr-2" />
      Pending Approval
    </>
  ) : item.status === 'withdrawn' ? (
    <>
      <Check className="w-4 h-4 inline mr-2" />
      Completed
    </>
  ) : (
    <>
      <CircleArrowUp className="w-4 h-4 inline mr-2" />
      Withdraw
    </>
  )}
</button>
```

## Feedback Messages

Update feedback messages untuk lebih informatif:

```typescript
// Success message
setFeedback(`
  ✅ Withdrawal request created!
  
  Item: ${item.item_name}
  Value: $${item.value.toFixed(2)}
  Status: ⏳ PENDING
  
  📢 Check Discord for staff verification
  ⏱️ Usually processed within 24 hours
`);

// Error message
setErrorFeedback(`
  ❌ Withdrawal failed
  
  Reason: ${err.message}
  
  Please try again or contact support
`);
```

## Complete Updated Component Section

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

## Testing Checklist

- [ ] Click withdraw button on item
- [ ] Withdrawal log created in database
- [ ] Discord notification sent
- [ ] Item status changes to "Pending Withdrawal"
- [ ] Withdraw button disabled for pending items
- [ ] Success message shows
- [ ] Discord link opens in new tab
- [ ] Admin can see withdrawal in logs
- [ ] Admin can complete withdrawal
- [ ] Admin can reject withdrawal
- [ ] Item status updates correctly

## Files to Update

| File | Changes |
|------|---------|
| src/components/UserDashboard.tsx | Update handleWithdrawItem function |
| server.ts | Update /api/user/withdraw endpoint |
| src/components/UserDashboard.tsx | Update status badge display |
| src/components/UserDashboard.tsx | Update button disable logic |

## Notes

- Withdrawal log creation is optional (won't fail if table doesn't exist)
- Discord notification is optional (won't fail if webhook not configured)
- Item status update is required (will fail if inventory table has issues)
- All changes are backward compatible
