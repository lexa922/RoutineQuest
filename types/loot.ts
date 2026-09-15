export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ChestType = 'daily' | 'boss';

export interface InventoryItem {
    id: string;
    itemId: string;
    name: string;
    description: string;
    rarity: ItemRarity;
    quantity: number;
    icon: string;
}

export interface LootResult {
    manaCrystals: number;
    item: InventoryItem | null;
    chestType: ChestType;
}