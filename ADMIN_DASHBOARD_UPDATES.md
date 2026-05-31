# Admin Dashboard Updates

## Changes Required

### 1. Import WithdrawalLogs Component

Di bagian atas `src/components/AdminDashboard.tsx`, tambahkan import:

```typescript
import { WithdrawalLogs } from './WithdrawalLogs';
import { Clock } from 'lucide-react'; // Tambahkan Clock icon
```

### 2. Add State for Withdrawal Logs Modal

Di dalam `AdminDashboard` component, tambahkan state baru:

```typescript
const [showWithdrawalLogs, setShowWithdrawalLogs] = useState(false);
```

### 3. Add Logs Button to Header

Cari section header dengan "STAFF DASHBOARD" dan tambahkan button sebelum "KEMBALI KE GAMEPLAY":

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

**Location:** Sebelum button "KEMBALI KE GAMEPLAY" di header section

### 4. Add Withdrawal Logs Modal at End

Di akhir component (sebelum closing `</div>`), tambahkan:

```typescript
{/* Withdrawal Logs Modal */}
{showWithdrawalLogs && (
  <WithdrawalLogs onClose={() => setShowWithdrawalLogs(false)} />
)}
```

### 5. Add Publish Game Button

Di section "GAMES CONFIGURATION", cari button "SIMPAN KONFIGURASI" dan tambahkan button "PUBLISH GAME" di sebelahnya.

**Location:** Di bagian game config buttons (setelah handleSaveGameConfig button)

```typescript
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

## Complete Code Snippet

### Header Section Update

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

### Game Config Buttons Update

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

### Modal at End of Component

```typescript
{/* Withdrawal Logs Modal */}
{showWithdrawalLogs && (
  <WithdrawalLogs onClose={() => setShowWithdrawalLogs(false)} />
)}
```

## Import Statements to Add

```typescript
import { WithdrawalLogs } from './WithdrawalLogs';
import { Clock, Check } from 'lucide-react'; // Add Clock and Check if not already imported
```

## State to Add

```typescript
const [showWithdrawalLogs, setShowWithdrawalLogs] = useState(false);
```

## Summary of Changes

| Component | Change | Type |
|-----------|--------|------|
| Header | Add Withdrawal Logs button | New Button |
| Header | Add Publish Game button | New Button |
| Game Config | Add Publish Game button | New Button |
| Game Config | Add Reset Default button | New Button |
| Modal | Add WithdrawalLogs modal | New Modal |
| State | Add showWithdrawalLogs | New State |
| Imports | Add WithdrawalLogs component | New Import |
| Imports | Add Clock, Check icons | New Icons |

## Testing Checklist

- [ ] Withdrawal Logs button appears in header
- [ ] Clicking Withdrawal Logs opens modal
- [ ] Modal shows pending withdrawals
- [ ] Can filter by status
- [ ] Can complete withdrawal
- [ ] Can reject withdrawal
- [ ] Publish Game button appears
- [ ] Clicking Publish Game saves config
- [ ] Reset Default button works
- [ ] All buttons have proper styling
- [ ] All buttons have proper hover effects
- [ ] Modal closes properly
