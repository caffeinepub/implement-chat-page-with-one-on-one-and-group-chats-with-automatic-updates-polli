import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Coins, Zap } from 'lucide-react';

interface XPGain {
  id: string;
  amount: number;
  timestamp: number;
}

interface RaceXPHUDProps {
  currentXP: number;
  recentGains: XPGain[];
}

export default function RaceXPHUD({ currentXP, recentGains }: RaceXPHUDProps) {
  const [visibleGains, setVisibleGains] = useState<XPGain[]>([]);

  useEffect(() => {
    setVisibleGains(recentGains.slice(-3));
  }, [recentGains]);

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      <Badge className="neon-badge bg-background/80 backdrop-blur-sm px-4 py-2">
        <Coins className="h-4 w-4 mr-2 text-neon-accent" />
        <span className="text-lg font-bold neon-text">{currentXP} XP</span>
      </Badge>

      <div className="space-y-1">
        {visibleGains.map((gain) => (
          <div
            key={gain.id}
            className="animate-in slide-in-from-right fade-in duration-300"
          >
            <Badge className="neon-badge bg-neon-accent/20 backdrop-blur-sm px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              +{gain.amount} XP
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
