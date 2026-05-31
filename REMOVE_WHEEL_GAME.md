# 🗑️ Remove Wheel Game - Complete Removal

## ✅ Files to Delete

### Component Files:
- `src/components/PrizeWheel.tsx` - Main wheel component
- `src/components/PrizeManager.tsx` - Prize management UI
- `src/components/Confetti.tsx` - Confetti effect (if only used by wheel)

### Data Files:
- `src/data/roda.json` - Wheel configuration
- `api/roda.json` - API wheel data

### Utility Files:
- Check `src/utils/defaults.ts` for DEFAULT_PRIZES

## ✅ Code to Remove from Existing Files

### 1. src/components/Lobby.tsx
- ✅ DONE: Removed wheel game card from games array
- ✅ DONE: Removed Sparkles icon import

### 2. src/components/ResponsiveNavbar.tsx
- ✅ DONE: Removed wheel from navLinks
- ✅ DONE: Removed wheel maintenance check
- ✅ DONE: Removed Trophy icon import

### 3. src/App.tsx (MAJOR CHANGES)
Need to remove:
- Import PrizeWheel component
- Import PrizeManager component
- Import Confetti component (if only for wheel)
- Import DEFAULT_PRIZES from defaults
- Import Prize, SpinSettings, SpinHistory types
- State: wheelError
- State: wheelPublished
- State: prizes
- State: settings
- State: history
- State: showSettings
- Function: loadWheelConfig()
- Function: handleAddPrize()
- Function: handleUpdatePrize()
- Function: handleDeletePrize()
- Function: handleReorderPrizes()
- Function: handleResetPrizes()
- Function: handleClearPrizes()
- Function: handleSpinStart()
- Function: handleSpinComplete()
- Constant: WHEEL_SPIN_COST
- All wheel-related useEffect hooks
- All wheel-related localStorage operations
- Wheel game JSX section
- Remove 'wheel' from activeGame type
- Remove wheel from gamesPublished prop

### 4. src/types.ts
Check and remove if only used by wheel:
- Prize type
- SpinSettings type
- SpinHistory type

### 5. server.ts
- Keep wheel config endpoints (for backward compatibility)
- Or remove if not needed

---

## 🚀 Execution Plan

### Phase 1: Update Lobby & Navbar ✅
- ✅ Remove wheel from Lobby games array
- ✅ Remove wheel from Navbar links

### Phase 2: Update App.tsx (Current)
- Remove all wheel-related imports
- Remove all wheel-related state
- Remove all wheel-related functions
- Remove wheel JSX section
- Update types

### Phase 3: Delete Files
- Delete component files
- Delete data files
- Clean up unused utilities

### Phase 4: Test
- Verify app loads without errors
- Verify navigation works
- Verify other games still work

