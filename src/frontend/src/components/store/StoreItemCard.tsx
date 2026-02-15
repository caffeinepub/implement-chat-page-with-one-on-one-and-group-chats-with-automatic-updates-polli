import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Coins } from 'lucide-react';
import type { StoreItemData } from './storeCatalog';

interface StoreItemCardProps {
  item: StoreItemData;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: () => void;
  isPurchasing: boolean;
}

export default function StoreItemCard({ item, isOwned, canAfford, onPurchase, isPurchasing }: StoreItemCardProps) {
  return (
    <Card className={`neon-card transition-all ${isOwned ? 'border-neon-accent' : ''}`}>
      <CardHeader>
        <div className="relative">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-48 object-contain rounded-lg mb-2"
            style={{
              filter: isOwned ? 'drop-shadow(0 0 20px currentColor)' : 'grayscale(50%)',
            }}
          />
          {isOwned && (
            <Badge className="absolute top-2 right-2 neon-badge bg-neon-accent/20">
              <Check className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          )}
        </div>
        <CardTitle className="neon-text">{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-neon-accent" />
          <span className="text-xl font-bold neon-text">{item.cost} XP</span>
        </div>
      </CardContent>
      <CardFooter>
        {isOwned ? (
          <Button disabled className="w-full" variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Owned
          </Button>
        ) : (
          <Button
            onClick={onPurchase}
            disabled={!canAfford || isPurchasing}
            className="w-full neon-button"
          >
            {!canAfford ? (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Not Enough XP
              </>
            ) : isPurchasing ? (
              'Purchasing...'
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Buy Now
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
