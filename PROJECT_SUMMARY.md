# ReyaBet - Project Summary

## Overview
ReyaBet adalah platform gacha online dengan sistem fishing AFK yang lengkap. Project ini menggunakan React + TypeScript untuk frontend dan Express.js untuk backend, dengan Supabase sebagai database.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Icons**: Lucide React

## Key Features

### 1. Case Opening System
- 15 different chests dengan berbagai tema
- Rarity system: Common, Rare, Epic, Legendary, Mythic
- Animated spinning wheel
- Real-time balance deduction

### 2. Crash Game
- Multiplier-based betting game
- Real-time chart visualization
- Auto cashout feature
- Prize rewards based on multiplier

### 3. Fishing AFK System V3
- **Server-side fishing bot** (afk-fishing-worker.ts)
- **Bait system**: Required untuk fishing (-1 per catch)
- **Rod system**: EZ Rod (free), Lico Rod, Golden Rod, Thanksgiving Rod
- **Price tiers**: 5 tiers based on fish weight (LB)
- **Admin panel**: Grant access, rods, and bait
- **Real-time logs**: View fishing history and statistics

### 4. Admin Dashboard
- User management (balance, inventory)
- Fishing access management
- Rod access management
- Bait management
- Price configuration
- Game config editor

### 5. Global Chat
- Real-time messaging
- Staff badges
- Message history

## Project Structure

```
reyagachav2/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminFishingManagement.tsx
│   │   ├── FishingGameV3.tsx
│   │   ├── FishingAFKLogs.tsx
│   │   ├── UserDashboard.tsx
│   │   └── Lobby.tsx
│   ├── data/
│   │   ├── chests.json
│   │   ├── fishing.json
│   │   └── permainan.json
│   └── utils/
│       └── api.ts
├── api/
│   └── index.ts (Vercel serverless function)
├── server.ts (Development server)
├── afk-fishing-worker.ts (Fishing bot)
├── SCHEMA_COMPLETE.sql (Database schema)
└── DATABASE_SETUP.md (Setup guide)
```

## Database Schema

### Core Tables
- `users` - User accounts with balance and staff status
- `inventory` - Items won from games
- `game_configs` - Configuration for cases and crash game

### Fishing Tables
- `afk_access` - Fishing access permissions
- `user_fishing_inventory` - User fishing stats and bait balance
- `user_rod_access` - Rod ownership
- `fish_inventory` - Caught fish (unsold)
- `fishing_logs` - Complete fishing history
- `afk_fishing_sessions` - Active AFK sessions
- `bait_transactions` - Bait grant/consume history
- `fishing_price_config` - Price tiers for fish

### Functions
- `grant_bait()` - Admin grant bait to users
- `consume_bait()` - Use bait for fishing
- `increment_fishing_saldo()` - Add WL earnings
- `increment_fish_caught()` - Track fish count
- `update_equipped_rod()` - Change active rod
- `create_fishing_inventory_on_access()` - Auto-setup on access grant

## Admin Credentials
- **Username**: nanddev
- **Password**: nanda900
- **Email**: satriarizkyananda27@gmail.com
- **Auth ID**: e44ca573-fcf3-47fa-b73e-283747bd21bb

## Environment Variables
```env
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_role_key>
PORT=3000
```

## Setup Instructions

### 1. Database Setup
```bash
# Run in Supabase SQL Editor
# Copy content from SCHEMA_COMPLETE.sql
# Paste and execute
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### User
- `GET /api/user/profile` - Get user profile
- `GET /api/user/inventory` - Get user inventory
- `POST /api/user/deduct` - Deduct balance
- `POST /api/user/add-win` - Add winning item

### Fishing
- `GET /api/fishing/inventory` - Get fishing inventory
- `GET /api/fishing/logs` - Get fishing logs
- `POST /api/fishing/afk/start` - Start AFK fishing
- `POST /api/fishing/afk/stop` - Stop AFK fishing
- `GET /api/fishing/afk/status` - Get AFK status

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/fishing/grant-access` - Grant fishing access
- `POST /api/admin/fishing/grant-rod` - Grant rod access
- `POST /api/admin/fishing/grant-bait` - Grant bait
- `GET /api/admin/fishing/access-list` - Get access list
- `GET /api/admin/fishing/price-config` - Get price config
- `POST /api/admin/fishing/price-config` - Update price config

## Key Features Implementation

### Bait System
- Users need bait to fish (1 bait per catch)
- Admin grants bait via admin panel
- Bait balance shown in fishing logs
- Transaction history tracked

### Rod System
- EZ Rod: Free starter rod (auto-granted)
- Premium Rods: Lico, Golden, Thanksgiving (admin-granted)
- Each rod has different catch rates and bonuses
- Rod access managed via admin panel

### Price Tiers
- 5 tiers based on fish weight (LB)
- Configurable by admin
- Higher tiers = more WL per LB
- Encourages using better rods

### AFK Fishing Bot
- Server-side worker (afk-fishing-worker.ts)
- Catches fish automatically every 5-10 seconds
- Consumes bait per catch
- Stops when bait runs out
- Logs all catches

## Recent Fixes

### ✅ Token Expiration
- Added better error handling
- Clear messages for expired sessions
- Token refresh endpoint

### ✅ Grant Bait 404 Error
- Added endpoints to api/index.ts
- Fixed Vercel routing
- Both dev and prod working

### ✅ RLS Policy Errors
- Fixed user_fishing_inventory insert policy
- Changed to system-level insert (WITH CHECK TRUE)
- Allows grant_bait function to work

### ✅ Schema Cleanup
- Consolidated all schemas into SCHEMA_COMPLETE.sql
- Removed 37+ duplicate SQL files
- Removed 80+ duplicate MD files
- Reduced project size significantly

## File Cleanup Summary

### Removed Files
- **SQL Files**: 37 files deleted (migrations, fixes, old schemas)
- **MD Files**: 80+ documentation files deleted
- **Total Size Saved**: ~5-10 MB

### Remaining Files
- `SCHEMA_COMPLETE.sql` - Single source of truth for database
- `DATABASE_SETUP.md` - Setup instructions
- `PROJECT_SUMMARY.md` - This file

## Deployment

### Vercel Configuration
```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.ts" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/
```

## Known Issues & Solutions

### Issue: "Profil tidak ditemukan"
**Solution**: User ID in database must match Supabase Auth ID

### Issue: "Token expired"
**Solution**: Logout and login again to get fresh token

### Issue: "RLS policy violation"
**Solution**: Re-run SCHEMA_COMPLETE.sql to fix policies

### Issue: "Column does not exist"
**Solution**: Schema uses correct column names (bait_balance, not bait_count)

## Performance Optimizations
- Indexed all foreign keys
- Indexed frequently queried columns
- RLS policies optimized for performance
- Service role bypasses RLS for admin operations

## Security Features
- Row Level Security (RLS) enabled on all tables
- Password hashing (SHA-256)
- JWT token authentication
- Service role for admin operations
- Input validation on all endpoints

## Future Enhancements
- [ ] Bulk bait grant to multiple users
- [ ] Scheduled bait grants
- [ ] Bait purchase with WL
- [ ] Fishing leaderboard
- [ ] Rod upgrade system
- [ ] Fish trading between users
- [ ] Fishing tournaments

## Support
For issues or questions:
1. Check DATABASE_SETUP.md
2. Review Supabase logs
3. Check server console
4. Verify Auth user ID matches

## Version
**Current Version**: 1.0.0
**Last Updated**: 2026-06-01

## License
Private project - All rights reserved

## Credits
- Developer: nanddev
- Project: ReyaBet
- Platform: ReyaPs
