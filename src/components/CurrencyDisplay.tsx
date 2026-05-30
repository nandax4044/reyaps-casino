import React from 'react';

interface CurrencyDisplayProps {
  balance: number | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showAllIfZero?: boolean;
  className?: string;
  inline?: boolean;
}

export function parseLocks(bal: number | string) {
  let rem = Math.floor(parseFloat(bal as string));
  if (isNaN(rem) || rem < 0) {
    return { ll: 0, bgl: 0, dl: 0, wl: 0 };
  }

  const ll = Math.floor(rem / 1000000);
  rem = rem % 1000000;

  const bgl = Math.floor(rem / 10000);
  rem = rem % 10000;

  const dl = Math.floor(rem / 100);
  const wl = rem % 100;

  return { ll, bgl, dl, wl };
}

export default function CurrencyDisplay({
  balance,
  size = 'sm',
  showAllIfZero = false,
  className = '',
  inline = false
}: CurrencyDisplayProps) {
  const { ll, bgl, dl, wl } = parseLocks(balance);

  // Determine size classes
  const imgSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8 font-black'
  };

  const textSizes = {
    xs: 'text-[9px] font-mono',
    sm: 'text-[11px] font-mono',
    md: 'text-sm font-mono',
    lg: 'text-lg font-mono font-black'
  };

  const badgePadding = {
    xs: 'px-1 py-0.5 rounded-md gap-0.5',
    sm: 'px-1.5 py-0.5 rounded-lg gap-1 border',
    md: 'px-2 py-1 rounded-xl gap-1.5 border-2',
    lg: 'px-3 py-1.5 rounded-2xl gap-2 border-2'
  };

  const activeLocks: { type: string; value: number; label: string; image: string; style: string; textStyle: string }[] = [];

  if (ll > 0) {
    activeLocks.push({
      type: 'll',
      value: ll,
      label: 'LL',
      image: '/images/lotus_lock.png',
      style: 'bg-rose-950/40 border-rose-500/30 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.15)]',
      textStyle: 'text-rose-400 font-extrabold'
    });
  }

  if (bgl > 0) {
    activeLocks.push({
      type: 'bgl',
      value: bgl,
      label: 'BGL',
      image: '/images/blue_gem_lock.png',
      style: 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.15)]',
      textStyle: 'text-indigo-400 font-extrabold'
    });
  }

  if (dl > 0) {
    activeLocks.push({
      type: 'dl',
      value: dl,
      label: 'DL',
      image: '/images/diamond_lock.png',
      style: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
      textStyle: 'text-cyan-400 font-extrabold'
    });
  }

  // Always show WL if it belongs to a non-zero balance and other locks aren't fully filling it,
  // or if balance is 0 and showAllIfZero or simply empty list
  if (wl > 0 || activeLocks.length === 0) {
    activeLocks.push({
      type: 'wl',
      value: wl,
      label: 'WL',
      image: '/images/world_lock.png',
      style: 'bg-amber-950/40 border-amber-500/30 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
      textStyle: 'text-yellow-500 font-extrabold'
    });
  }

  // If user selected showAllIfZero, show placeholders for all
  const renderList = showAllIfZero ? [
    { type: 'll', value: ll, label: 'LL', image: '/images/lotus_lock.png', style: 'bg-rose-950/20 border-rose-500/10 text-rose-300/45', textStyle: 'text-rose-400/80 font-bold' },
    { type: 'bgl', value: bgl, label: 'BGL', image: '/images/blue_gem_lock.png', style: 'bg-indigo-950/20 border-indigo-500/10 text-indigo-300/45', textStyle: 'text-indigo-400/80 font-bold' },
    { type: 'dl', value: dl, label: 'DL', image: '/images/diamond_lock.png', style: 'bg-cyan-950/20 border-cyan-500/10 text-cyan-300/45', textStyle: 'text-cyan-400/80 font-bold' },
    { type: 'wl', value: wl, label: 'WL', image: '/images/world_lock.png', style: 'bg-amber-950/20 border-amber-500/10 text-amber-300/45', textStyle: 'text-yellow-500/80 font-bold' }
  ] : activeLocks;

  return (
    <div className={`${inline ? 'inline-flex' : 'flex'} flex-wrap items-center gap-1.5 md:gap-2 select-none ${className}`}>
      {renderList.map((lock, i) => (
        <span
          key={lock.type + i}
          className={`flex items-center shrink-0 font-mono transition-transform duration-200 hover:scale-[1.03] ${badgePadding[size]} ${lock.style}`}
          title={`${lock.value.toLocaleString()} ${lock.label}`}
        >
          <img
            src={lock.image}
            alt={lock.label}
            className={`${imgSizes[size]} object-contain`}
            referrerPolicy="no-referrer"
          />
          <span className={`${textSizes[size]} leading-none`}>
            <span className={`${lock.textStyle} mr-0.5`}>{lock.value}</span>
            <span className="text-[9px] text-slate-400 font-sans tracking-wide font-black uppercase">{lock.label}</span>
          </span>
        </span>
      ))}
    </div>
  );
}
