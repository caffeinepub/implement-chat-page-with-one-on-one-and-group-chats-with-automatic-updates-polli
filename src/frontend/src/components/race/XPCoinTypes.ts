export interface XPCoinData {
  value: 1 | 5 | 10 | 20;
  image: string;
  color: string;
  rarity: "common" | "uncommon" | "rare" | "epic";
}

export const XP_COINS: Record<number, XPCoinData> = {
  1: {
    value: 1,
    image: "/assets/generated/xp-coin-1.dim_128x128.png",
    color: "#FFD700",
    rarity: "common",
  },
  5: {
    value: 5,
    image: "/assets/generated/xp-coin-5.dim_128x128.png",
    color: "#00FF00",
    rarity: "uncommon",
  },
  10: {
    value: 10,
    image: "/assets/generated/xp-coin-10.dim_128x128.png",
    color: "#FF00FF",
    rarity: "rare",
  },
  20: {
    value: 20,
    image: "/assets/generated/xp-coin-20.dim_128x128.png",
    color: "#00FFFF",
    rarity: "epic",
  },
};

export function getCoinImage(value: 1 | 5 | 10 | 20): string {
  return XP_COINS[value].image;
}

export function getCoinColor(value: 1 | 5 | 10 | 20): string {
  return XP_COINS[value].color;
}
