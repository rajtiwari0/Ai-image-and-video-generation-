'use client';

import { Zap } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface Props {
  sessionCount: number;
  username?: string | null;
}

export function CreditsBadge({ sessionCount, username }: Props) {
  return (
    <Tooltip content="Credits are unlimited via Puter's User-Pays model. This shows images generated this session.">
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-zinc-400">
          {username && <span className="text-white font-medium">{username} · </span>}
          <span className="text-yellow-400 font-bold">{sessionCount}</span>
          <span className="text-zinc-500"> generated · ∞ credits</span>
        </span>
      </div>
    </Tooltip>
  );
}
