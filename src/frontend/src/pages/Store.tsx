import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Coins, Loader2 } from "lucide-react";
import StoreItemCard from "../components/store/StoreItemCard";
import { storeCatalog } from "../components/store/storeCatalog";
import { useGetStoreStatus, usePurchaseItem } from "../hooks/useQueries";

export default function Store() {
  const navigate = useNavigate();
  const { data: storeStatus, isLoading } = useGetStoreStatus();
  const purchaseItem = usePurchaseItem();

  const handlePurchase = async (itemName: string, cost: number) => {
    if (!storeStatus) return;

    if (storeStatus.balance < BigInt(cost)) {
      return;
    }

    try {
      await purchaseItem.mutateAsync(itemName);
    } catch (error) {
      console.error("Purchase failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-neon-accent" />
      </div>
    );
  }

  const balance = storeStatus ? Number(storeStatus.balance) : 0;
  const ownedItems = storeStatus?.ownedItems || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/" })}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-text mb-2">Neon Store</h1>
            <p className="text-muted-foreground">
              Unlock exclusive neon lights with your XP
            </p>
          </div>
          <Card className="neon-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-neon-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Your XP</p>
                  <p className="text-2xl font-bold neon-text">{balance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <Card className="neon-card border-neon-accent/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-neon-accent" />
              How to Earn XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="neon-badge">
                  1 XP
                </Badge>
                <p className="text-sm">Common coins on track</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="neon-badge">
                  5 XP
                </Badge>
                <p className="text-sm">Hidden track locations</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="neon-badge">
                  10 XP
                </Badge>
                <p className="text-sm">After amazing stunts</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="neon-badge">
                  20 XP
                </Badge>
                <p className="text-sm">Rare stunt rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {storeCatalog.map((item) => {
          const isOwned = ownedItems.includes(item.id);
          const canAfford = balance >= item.cost;

          return (
            <StoreItemCard
              key={item.id}
              item={item}
              isOwned={isOwned}
              canAfford={canAfford}
              onPurchase={() => handlePurchase(item.id, item.cost)}
              isPurchasing={purchaseItem.isPending}
            />
          );
        })}
      </div>
    </div>
  );
}
