# Database Setup Guide

## Quick Start

### 1. Run Schema in Supabase

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to your project: `rwngqiakigebtwxohiri`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy entire content from `SCHEMA_COMPLETE.sql`
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for success message

### 2. Verify Installation

Check console output for:
```
✅ SCHEMA CREATED SUCCESSFULLY!
📊 Tables Created: 13
🔧 Functions Created: 6
🔒 RLS Policies: Enabled
```

### 3. Test Login

**Admin Credentials:**
- Username: `nanddev`
- Password: `nanda900`
- Email: `satriarizkyananda27@gmail.com`

## What's Included

### Tables (13)
1. `users` - User accounts
2. `inventory` - User items from games
3. `game_configs` - Game configuration (cases, crash)
4. `afk_access` - Fishing access management
5. `user_fishing_inventory` - User fishing stats and bait
6. `user_rod_access` - Rod ownership
7. `fish_inventory` - Caught fish (unsold)
8. `fishing_logs` - Fishing history
9. `afk_fishing_sessions` - Active AFK sessions
10. `bait_transactions` - Bait grant/consume history
11. `fishing_price_config` - Fish price tiers
12. `schema_version` - Schema version tracking

### Functions (6)
1. `create_fishing_inventory_on_access()` - Auto-create inventory when access granted
2. `increment_fishing_saldo()` - Add WL to fishing balance
3. `increment_fish_caught()` - Increment fish count
4. `update_equipped_rod()` - Change equipped rod
5. `consume_bait()` - Use 1 bait for fishing
6. `grant_bait()` - Admin grant bait to user

### Features
- ✅ Complete fishing system with bait
- ✅ Admin panel for access/rod/bait management
- ✅ Row Level Security (RLS) enabled
- ✅ Automatic inventory creation
- ✅ Price tier configuration
- ✅ Transaction logging

## Troubleshooting

### Error: "User not found"
- Run schema again to recreate admin user
- Check Auth user ID matches: `e44ca573-fcf3-47fa-b73e-283747bd21bb`

### Error: "RLS policy violation"
- Schema includes proper RLS policies
- Service role has full access
- User policies allow own data access

### Error: "Function does not exist"
- Re-run schema to create all functions
- Check Supabase logs for errors

## Important Notes

1. **Admin User ID**: Must match Supabase Auth ID
   - Current ID: `e44ca573-fcf3-47fa-b73e-283747bd21bb`
   - If different, update in schema before running

2. **Bait System**: 
   - Column name is `bait_balance` (not `bait_count`)
   - Default: 0 bait
   - Admin can grant via admin panel

3. **Rod System**:
   - Table name is `user_rod_access` (not `user_rods`)
   - EZ Rod is free starter rod
   - Other rods granted by admin

4. **Fishing Logs**:
   - No `is_claimed` column (removed)
   - Tracks all caught fish
   - Includes sold/unsold status

## Schema Version

Current Version: **1.0.0**
Last Updated: 2026-06-01

## Support

If you encounter issues:
1. Check Supabase logs
2. Verify Auth user ID
3. Re-run schema if needed
4. Check server console for errors

## Files

- `SCHEMA_COMPLETE.sql` - Complete database schema (ONLY file needed)
- `DATABASE_SETUP.md` - This guide

All other SQL and MD files have been removed to reduce project size.
