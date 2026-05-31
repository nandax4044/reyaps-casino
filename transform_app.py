#!/usr/bin/env python3
"""
Script to transform App.tsx to add Lobby page with proper structure:
- Auth -> Lobby (with Chat & Online Players)
- Lobby -> Game (NO Chat & Online Players)
- Dashboard (NO Chat & Online Players)
"""

import re

# Read the current App.tsx
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.content()

# 1. Add Lobby import
content = content.replace(
    "import { GlobalChat } from './components/GlobalChat';",
    "import { GlobalChat } from './components/GlobalChat';\nimport { Lobby } from './components/Lobby';"
)

# 2. Change activeGame state to include 'lobby' and default to 'lobby'
content = re.sub(
    r"const \[activeGame, setActiveGame\] = useState<'wheel' \| 'crash' \| 'cases' \| 'profile' \| 'admin'>\('cases'\);",
    "const [activeGame, setActiveGame] = useState<'lobby' | 'wheel' | 'crash' | 'cases' | 'profile' | 'admin'>('lobby');",
    content
)

# 3. Update logout to go to lobby
content = content.replace(
    "setActiveGame('cases');",
    "setActiveGame('lobby');"
)

# 4. Update dashboard close actions
content = content.replace(
    "onCloseDashboard={() => setActiveGame('cases')}",
    "onCloseDashboard={() => setActiveGame('lobby')}"
)
content = content.replace(
    "onCloseAdmin={() => setActiveGame('cases')}",
    "onCloseAdmin={() => setActiveGame('lobby')}"
)

# 5. Add Lobby button to header navigation (after the opening div of game selector)
lobby_button = '''            <button
              onClick={() => {
                setActiveGame('lobby');
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeGame === 'lobby'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-900/40'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Lobby</span>
            </button>
'''

# Find the game selector div and add lobby button
content = re.sub(
    r'(<div className="flex bg-\[#070915\].*?glass-panel-dark">)',
    r'\1\n' + lobby_button,
    content,
    flags=re.DOTALL
)

# 6. Replace the main layout structure
# Find the MAIN LAYOUT BODY section and replace it
old_main_start = '      {/* MAIN LAYOUT BODY */}'
new_main_structure = '''      {/* MAIN LAYOUT BODY */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-6 lg:p-8 relative z-10 flex flex-col justify-start">
        {/* LOBBY PAGE - Show only when activeGame is 'lobby' */}
        {activeGame === 'lobby' && (
          <Lobby 
            user={user}
            onSelectGame={(game) => setActiveGame(game)}
            onOpenProfile={() => setActiveGame('profile')}
            onOpenAdmin={() => setActiveGame('admin')}
            onLogout={handleLogout}
          />
        )}

        {/* GAME PAGES - Full width, NO sidebar */}
        {(activeGame === 'cases' || activeGame === 'wheel' || activeGame === 'crash') && (
          <div className="w-full max-w-6xl mx-auto">'''

# Find and replace the main section
content = re.sub(
    r'      {/\* MAIN LAYOUT BODY \*/}\s+<main className="flex-1.*?<div className="w-full grid grid-cols-1 lg:grid-cols-12.*?{/\* CENTER COLUMN: ACTIVE GAME OR DASHBOARD MODULES \*/}\s+<div className="lg:col-span-6 col-span-12 flex flex-col gap-4 md:gap-6 w-full">',
    new_main_structure,
    content,
    flags=re.DOTALL
)

# 7. Close the game pages div and add dashboard pages with NO sidebar
dashboard_structure = '''
          </div>
        )}

        {/* DASHBOARD PAGES - Full width, NO sidebar */}
        {(activeGame === 'profile' || activeGame === 'admin') && (
          <div className="w-full max-w-6xl mx-auto">
            {activeGame === 'profile' && (
              <div className="w-full animate-fade-in">
                <UserDashboard 
                  user={user} 
                  onLogout={handleLogout} 
                  onCloseDashboard={() => setActiveGame('lobby')} 
                />
              </div>
            )}

            {activeGame === 'admin' && user.is_staff && (
              <div className="w-full animate-fade-in">
                <AdminDashboard onCloseAdmin={() => setActiveGame('lobby')} />
              </div>
            )}
          </div>
        )}
      </main>'''

# Find where the games end and replace with new structure
# This is tricky, we need to find the end of the wheel game section
content = re.sub(
    r'({activeGame === \'profile\' &&.*?</div>\s+\)}\s+{activeGame === \'admin\'.*?</div>\s+\)}\s+{activeGame === \'wheel\')',
    r'\1',
    content,
    flags=re.DOTALL
)

# Write the transformed content
with open('src/App_new.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Transformation complete! Check src/App_new.tsx")
print("⚠️  Please review the file before replacing App.tsx")
