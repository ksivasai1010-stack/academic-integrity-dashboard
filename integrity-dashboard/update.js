const fs = require('fs');
let code = fs.readFileSync('src/App.js', 'utf8');

// 1. MAIN BACKGROUND (Premium Look)
code = code.replace(/bg-\[#f4f7fb\]/g, 'bg-gradient-to-br from-[#0b0f1a] via-[#0f172a] to-[#020617]');

// 2. HEADER (Glow + Gradient)
code = code.replace(/bg-slate-950/g, 'bg-gradient-to-r from-[#020617] via-[#0f172a] to-[#020617]');

// 4. TEXT COLORS (Fix visibility)
code = code.replace(/text-slate-800/g, 'text-white');
code = code.replace(/text-slate-500/g, 'text-slate-400');

// 3. CARDS (Glass Effect)
// Careful not to replace existing bg-white/5
code = code.replace(/\bbg-white(?!\/[0-9])/g, 'bg-white/5 backdrop-blur-xl border border-white/10');
code = code.replace(/\bbg-white\/80(?!\/[0-9])/g, 'bg-white/5 backdrop-blur-xl border border-white/10');

// 6. BUTTON STYLE UPGRADE
code = code.replace(/bg-blue-600/g, 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition');

// 5. ADD GLOW EFFECTS
code = code.replace(
  /(<div className="min-h-screen[^"]*relative">)/,
  '$1\n      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.15),transparent_40%)] pointer-events-none"></div>'
);

// 7. CHART BACKGROUND
code = code.replace(/border border-slate-100 rounded-xl p-4 bg-white\/5 backdrop-blur-xl border border-white\/10 shadow-\[0_2px_10px_rgba\(0,0,0,0.02\)\]/g, 'bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4');
// In case the bg-white wasn't replaced on chart background yet or it matches exactly the original chart class
code = code.replace(/border border-slate-100 rounded-xl p-4 bg-white shadow-\[0_2px_10px_rgba\(0,0,0,0.02\)\]/g, 'bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4');


fs.writeFileSync('src/App.js', code);
