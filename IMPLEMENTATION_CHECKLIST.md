# Implementation Checklist - Withdrawal System

## 📋 Pre-Implementation

- [ ] Backup database Supabase
- [ ] Backup server.ts
- [ ] Backup AdminDashboard.tsx
- [ ] Backup UserDashboard.tsx
- [ ] Verify Supabase connection working
- [ ] Verify Discord server access

## 🗄️ Step 1: Database Migration

### 1.1 Run Migration
- [ ] Buka Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Create new query
- [ ] Copy semua isi dari `migration_add_withdrawal_logs.sql`
- [ ] Paste ke SQL Editor
- [ ] Click "Run"
- [ ] Verify no errors

### 1.2 Verify Tables Created
- [ ] Go to Table Editor
- [ ] Check `withdrawal_logs` table exists
- [ ] Check columns: id, user_id, inventory_item_id, item_name, item_value, status, requested_at, completed_at, admin_id, admin_notes, discord_message_id, created_at, updated_at
- [ ] Check indexes created

### 1.3 Verify Site Content Updated
- [ ] Go to Table Editor
- [ ] Open `site_content` table
- [ ] Check `discord_webhook_url` row exists
- [ ] Check `discord_staff_channel_id` row exists
- [ ] Check `discord_invite_link` row exists

## 🔌 Step 2: Add Server Endpoints

### 2.1 Open server.ts
- [ ] Open `server.ts` in editor
- [ ] Find line: `app.delete('/api/admin/inventory/:itemId', authenticateUser, verifyStaff, async (req, res) => {`
- [ ] Go to end of that endpoint (find closing `});`)

### 2.2 Add Withdrawal Endpoints
- [ ] After the inventory delete endpoint, add blank line
- [ ] Copy all endpoints from `withdrawal_endpoints.ts`
- [ ] Paste into server.ts
- [ ] **IMPORTANT:** Uncomment all commented code (remove `//` at start of lines)
- [ ] Verify syntax is correct

### 2.3 Add Helper Functions
- [ ] After endpoints, add helper functions:
  - `sendDiscordWithdrawalNotification()`
  - `sendDiscordCompletionNotification()`
  - `sendDiscordRejectionNotification()`
- [ ] Uncomment all code

### 2.4 Verify Endpoints
- [ ] Check no syntax errors
- [ ] Check all endpoints have proper middleware (authenticateUser, verifyStaff)
- [ ] Check all endpoints have try-catch blocks
- [ ] Check all endpoints return proper JSON responses

### 2.5 Test Server
- [ ] Save server.ts
- [ ] Run: `npm run dev`
- [ ] Check no errors in console
- [ ] Verify server starts successfully

## 🎨 Step 3: Update AdminDashboard

### 3.1 Add Imports
- [ ] Open `src/components/AdminDashboard.tsx`
- [ ] At top, add: `import { WithdrawalLogs } from './WithdrawalLogs';`
- [ ] Check Clock icon is imported from lucide-react
- [ ] Check Check icon is imported from lucide-react

### 3.2 Add State
- [ ] Find: `const [activeTab, setActiveTab] = useState<'users' | 'games'>('users');`
- [ ] After that line, add: `const [showWithdrawalLogs, setShowWithdrawalLogs] = useState(false);`

### 3.3 Add Logs Button to Header
- [ ] Find header section with "STAFF DASHBOARD"
- [ ] Find button "KEMBALI KE GAMEPLAY"
- [ ] Before that button, add Withdrawal Logs button:
```typescript
<button
  onClick={() => setShowWithdrawalLogs(true)}
  className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs transition flex items-center gap-2 cursor-pointer"
  title="View withdrawal logs"
>
  <Clock className="w-4 h-4" />
  <span>Withdrawal Logs</span>
</button>
```

### 3.4 Add Publish Game Button
- [ ] Find game config section
- [ ] Find button "SIMPAN KONFIGURASI"
- [ ] After that button, add Publish Game button:
```typescript
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
```

### 3.5 Add Modal at End
- [ ] Find end of AdminDashboard component (before closing `</div>`)
- [ ] Add:
```typescript
{/* Withdrawal Logs Modal */}
{showWithdrawalLogs && (
  <WithdrawalLogs onClose={() => setShowWithdrawalLogs(false)} />
)}
```

### 3.6 Verify AdminDashboard
- [ ] Save file
- [ ] Check no syntax errors
- [ ] Verify component still renders
- [ ] Test Logs button appears
- [ ] Test Logs button opens modal
- [ ] Test Publish Game button appears

## 👤 Step 4: Update UserDashboard

### 4.1 Update Withdraw Handler
- [ ] Open `src/components/UserDashboard.tsx`
- [ ] Find function: `const handleWithdrawItem = async (item: InventoryItem) => {`
- [ ] Replace entire function with updated version from `USER_DASHBOARD_WITHDRAW_UPDATE.md`

### 4.2 Update Status Display
- [ ] Find where inventory items are rendered
- [ ] Update status badge to show:
  - "✅ Available" for available items
  - "⏳ Pending Withdrawal" for requested_withdraw items
  - "✔️ Withdrawn" for withdrawn items

### 4.3 Update Button Logic
- [ ] Find withdraw button
- [ ] Update disabled state to check: `item.status !== 'available'`
- [ ] Update button text based on status
- [ ] Add loading state when withdrawing

### 4.4 Verify UserDashboard
- [ ] Save file
- [ ] Check no syntax errors
- [ ] Test withdraw button works
- [ ] Test status displays correctly
- [ ] Test button disables for pending items

## 🔗 Step 5: Configure Discord Webhook

### 5.1 Create Discord Webhook
- [ ] Open Discord server
- [ ] Go to Settings → Webhooks
- [ ] Click "Create Webhook"
- [ ] Name it: "ReyaBet Withdrawal"
- [ ] Select channel for withdrawal notifications
- [ ] Click "Copy Webhook URL"

### 5.2 Update Supabase
- [ ] Go to Supabase Dashboard
- [ ] Open Table Editor
- [ ] Open `site_content` table
- [ ] Find row with `content_key = 'discord_webhook_url'`
- [ ] Update `content_value` with webhook URL
- [ ] Save

### 5.3 Verify Webhook
- [ ] Test webhook with curl:
```bash
curl -X POST https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"content":"Test message from ReyaBet"}'
```
- [ ] Check message appears in Discord channel

## ✅ Step 6: Testing

### 6.1 Test Player Withdrawal
- [ ] Login as player
- [ ] Open inventory
- [ ] Click withdraw on item
- [ ] Check withdrawal log created in database
- [ ] Check Discord notification sent
- [ ] Check item status changed to "Pending"
- [ ] Check withdraw button disabled

### 6.2 Test Admin Logs
- [ ] Login as admin
- [ ] Open Admin Dashboard
- [ ] Click "Withdrawal Logs" button
- [ ] Check modal opens
- [ ] Check pending withdrawals listed
- [ ] Test filter buttons
- [ ] Test expand details

### 6.3 Test Admin Approval
- [ ] In Withdrawal Logs modal
- [ ] Click "Complete" on pending withdrawal
- [ ] Check status changes to "Completed"
- [ ] Check item deleted from inventory
- [ ] Check Discord notification sent
- [ ] Check database updated

### 6.4 Test Admin Rejection
- [ ] In Withdrawal Logs modal
- [ ] Click "Reject" on pending withdrawal
- [ ] Enter rejection reason
- [ ] Check status changes to "Rejected"
- [ ] Check item back to "Available"
- [ ] Check Discord notification sent

### 6.5 Test Publish Game
- [ ] In Admin Dashboard, go to Games tab
- [ ] Make a small change to game config
- [ ] Click "Publish Game" button
- [ ] Confirm dialog
- [ ] Check success message
- [ ] Check config saved to database

## 🚀 Step 7: Deployment

### 7.1 Pre-Deployment
- [ ] All tests passed
- [ ] No console errors
- [ ] No database errors
- [ ] Discord webhook working
- [ ] All features working

### 7.2 Deploy
- [ ] Commit changes to git
- [ ] Push to repository
- [ ] Deploy to production
- [ ] Verify all endpoints working
- [ ] Verify Discord notifications working

### 7.3 Post-Deployment
- [ ] Monitor logs for errors
- [ ] Test withdrawal flow in production
- [ ] Test admin approval in production
- [ ] Verify Discord notifications in production
- [ ] Get user feedback

## 📊 Verification Checklist

### Database
- [ ] withdrawal_logs table exists
- [ ] All columns present
- [ ] Indexes created
- [ ] site_content updated with Discord config

### Server
- [ ] All endpoints added
- [ ] No syntax errors
- [ ] Server starts without errors
- [ ] Endpoints respond correctly

### AdminDashboard
- [ ] Logs button visible
- [ ] Logs button opens modal
- [ ] Publish Game button visible
- [ ] Publish Game button works
- [ ] Modal displays logs correctly

### UserDashboard
- [ ] Withdraw button works
- [ ] Status displays correctly
- [ ] Button disables for pending items
- [ ] Feedback messages show

### Discord
- [ ] Webhook URL configured
- [ ] Notifications sent on withdrawal
- [ ] Notifications sent on approval
- [ ] Notifications sent on rejection

## 🎯 Final Checklist

- [ ] All files created
- [ ] All migrations run
- [ ] All endpoints added
- [ ] All components updated
- [ ] All tests passed
- [ ] Discord configured
- [ ] Deployed to production
- [ ] Monitoring active
- [ ] Documentation complete

## 📝 Notes

- Keep backup of original files
- Test in development first
- Monitor logs after deployment
- Get user feedback
- Document any issues
- Plan for future improvements

## 🆘 If Something Goes Wrong

1. Check error message in console
2. Check database migration ran successfully
3. Check endpoints added correctly
4. Check components imported correctly
5. Check Discord webhook configured
6. Revert changes if needed
7. Try again from step that failed

## ✨ Success Criteria

- ✅ Player can withdraw items
- ✅ Withdrawal logs created
- ✅ Discord notifications sent
- ✅ Admin can view logs
- ✅ Admin can approve/reject
- ✅ Item status updates correctly
- ✅ Publish Game button works
- ✅ No errors in console
- ✅ All tests pass
- ✅ Production ready

---

**Status:** Ready for implementation 🚀

**Last Updated:** May 30, 2026

**Version:** 1.0.0
