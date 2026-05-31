# Withdrawal System - Quick Reference

## 🎯 What Was Built

### 1. Withdrawal Logs System
- Database table untuk track withdrawal requests
- Status: pending → completed/rejected
- Admin dapat approve atau reject

### 2. Discord Integration
- Automatic notification saat player withdraw
- Notification saat admin approve/reject
- Webhook-based (configurable)

### 3. Admin Dashboard Updates
- "Withdrawal Logs" button untuk view semua requests
- "Publish Game" button untuk publish game updates
- Filter by status (pending, completed, rejected)

### 4. Player Withdrawal Flow
- Click withdraw → create log → send Discord → show pending

## 📁 Files Created

```
✅ migration_add_withdrawal_logs.sql
✅ src/utils/withdrawalService.ts
✅ src/components/WithdrawalLogs.tsx
✅ src/utils/api.ts (updated)
✅ withdrawal_endpoints.ts
✅ WITHDRAWAL_IMPLEMENTATION_GUIDE.md
✅ ADMIN_DASHBOARD_UPDATES.md
✅ USER_DASHBOARD_WITHDRAW_UPDATE.md
✅ WITHDRAWAL_SYSTEM_SUMMARY.md
✅ IMPLEMENTATION_CHECKLIST.md
✅ QUICK_REFERENCE.md (this file)
```

## 🚀 Quick Start (3 Steps)

### Step 1: Database
```sql
-- Supabase SQL Editor
-- Copy & paste migration_add_withdrawal_logs.sql
-- Click Run
```

### Step 2: Server
```typescript
// server.ts
// Find: app.delete('/api/admin/inventory/:itemId', ...)
// After that endpoint, paste all code from withdrawal_endpoints.ts
// Uncomment everything
```

### Step 3: Components
```typescript
// AdminDashboard.tsx
// 1. Import WithdrawalLogs
// 2. Add state: showWithdrawalLogs
// 3. Add Logs button
// 4. Add Publish Game button
// 5. Add modal at end

// UserDashboard.tsx
// Update handleWithdrawItem function
```

## 🔗 API Endpoints

```
GET  /api/admin/withdrawals?status=pending
POST /api/admin/withdrawals/:id/complete
POST /api/admin/withdrawals/:id/reject
```

## 📊 Database Schema

```sql
withdrawal_logs {
  id UUID
  user_id UUID
  inventory_item_id UUID
  item_name VARCHAR
  item_value NUMERIC
  status VARCHAR (pending|completed|rejected)
  requested_at TIMESTAMPTZ
  completed_at TIMESTAMPTZ
  admin_id UUID
  admin_notes TEXT
  discord_message_id VARCHAR
}
```

## 🎮 UI Components

### WithdrawalLogs Modal
- Filter buttons
- Withdrawal list
- Expandable details
- Complete/Reject buttons

### AdminDashboard
- Logs button (blue)
- Publish Game button (green)
- Reset Default button (gray)

### UserDashboard
- Status badge (Available/Pending/Withdrawn)
- Withdraw button (disabled for pending)

## 🔐 Discord Setup

1. Create webhook in Discord
2. Copy webhook URL
3. Update Supabase site_content:
   - content_key: `discord_webhook_url`
   - content_value: `https://discord.com/api/webhooks/...`

## ✅ Testing

```
Player Withdrawal:
1. Click withdraw
2. Check log created
3. Check Discord notification
4. Check status = pending

Admin Approval:
1. Open Logs
2. Click Complete
3. Check status = completed
4. Check item deleted
5. Check Discord notification

Admin Rejection:
1. Open Logs
2. Click Reject
3. Enter reason
4. Check status = rejected
5. Check item available again
```

## 📝 Key Files to Edit

| File | Changes |
|------|---------|
| server.ts | Add endpoints |
| AdminDashboard.tsx | Add buttons & modal |
| UserDashboard.tsx | Update withdraw handler |
| Supabase | Run migration |
| Discord | Create webhook |

## 🎯 Features

✅ Withdrawal requests with pending status
✅ Discord notifications
✅ Admin approval/rejection
✅ Automatic item deletion
✅ Audit logs
✅ Publish game button
✅ Status tracking
✅ Error handling

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Discord not working | Check webhook URL in site_content |
| Logs not showing | Check migration ran, check is_staff=true |
| Button not appearing | Check imports, check state added |
| Endpoint 404 | Check endpoints added to server.ts |

## 📞 Documentation

- `WITHDRAWAL_IMPLEMENTATION_GUIDE.md` - Full guide
- `ADMIN_DASHBOARD_UPDATES.md` - AdminDashboard changes
- `USER_DASHBOARD_WITHDRAW_UPDATE.md` - UserDashboard changes
- `IMPLEMENTATION_CHECKLIST.md` - Step-by-step checklist
- `WITHDRAWAL_SYSTEM_SUMMARY.md` - Complete overview

## 🎉 Status

✅ All files created
✅ All code ready
✅ Documentation complete
⏳ Ready for implementation

## 🚀 Next Steps

1. Run migration
2. Add endpoints to server.ts
3. Update AdminDashboard
4. Update UserDashboard
5. Configure Discord
6. Test everything
7. Deploy

---

**Need help?** Check the detailed guides above!
