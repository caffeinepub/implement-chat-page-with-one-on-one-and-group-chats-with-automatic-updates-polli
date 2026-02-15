export interface StoreItemData {
  id: string;
  name: string;
  cost: number;
  description: string;
  image: string;
  color: string;
}

export const storeCatalog: StoreItemData[] = [
  {
    id: 'neon-white',
    name: 'White Neon',
    cost: 25,
    description: 'Classic white neon light - perfect for beginners',
    image: '/assets/generated/neon-light-white.dim_256x256.png',
    color: '#FFFFFF',
  },
  {
    id: 'neon-red',
    name: 'Red Neon',
    cost: 100,
    description: 'Intense red neon light for aggressive racers',
    image: '/assets/generated/neon-light-red.dim_256x256.png',
    color: '#FF0000',
  },
  {
    id: 'neon-blue',
    name: 'Blue Neon',
    cost: 100,
    description: 'Cool blue neon light with electric vibes',
    image: '/assets/generated/neon-light-blue.dim_256x256.png',
    color: '#0080FF',
  },
  {
    id: 'neon-yellow',
    name: 'Yellow Neon',
    cost: 100,
    description: 'Bright yellow neon light that stands out',
    image: '/assets/generated/neon-light-yellow.dim_256x256.png',
    color: '#FFFF00',
  },
  {
    id: 'neon-purple',
    name: 'Purple Neon',
    cost: 100,
    description: 'Mysterious purple neon light',
    image: '/assets/generated/neon-light-purple.dim_256x256.png',
    color: '#8000FF',
  },
  {
    id: 'neon-orange',
    name: 'Orange Neon',
    cost: 100,
    description: 'Vibrant orange neon light',
    image: '/assets/generated/neon-light-orange.dim_256x256.png',
    color: '#FF8000',
  },
  {
    id: 'neon-multicolor',
    name: 'Multicolor Neon',
    cost: 1000,
    description: 'Rare multicolor neon light - the ultimate prize',
    image: '/assets/generated/neon-light-multicolor.dim_256x256.png',
    color: 'rainbow',
  },
];
