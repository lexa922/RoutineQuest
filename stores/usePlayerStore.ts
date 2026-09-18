import { create } from 'zustand';
import { PlayerStats } from '@/types/player';
import {
    clearPenaltyDB,
    fetchPlayerStatsFromDB,
    registerPlayerDB,
    updatePlayerStatsDB,
    consumeInventoryItemDB,
    updatePlayerBuffsDB
} from '@/db/client';

import { ChestType, LootResult, InventoryItem } from '@/types/loot';
import { openChestReward } from '@/services/lootEngine';
import {
    updatePlayerLootStateDB,
    saveItemToInventoryDB,
    fetchInventoryFromDB
} from '@/db/client';

export interface XpChangeResult {
    didLevelUp: boolean;
    didRankUp: boolean;
    newLevel: number;
    newRank: string;
    oldRank: string;
}

interface PlayerState {
    playerStats: PlayerStats | null;
    isLoading: boolean;

    initPlayer: () => Promise<void>;
    registerPlayer: (nickname: string, playerClass: string) => Promise<void>;
    applyXpChange: (xpDiff: number) => Promise<XpChangeResult | null>;
    clearPenalty: () => Promise<void>;
    inventory: InventoryItem[];
    loadInventory: () => Promise<void>;
    awardChest: (chestType: ChestType) => Promise<void>;
    claimNextChest: () => Promise<LootResult | null>;
    useInventoryItem: (item: InventoryItem) => Promise<{ success: boolean; message: string }>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    playerStats: null,
    isLoading: true,
    inventory: [],

    initPlayer: async () => {
        try {
            const stats = await fetchPlayerStatsFromDB();
            set({ playerStats: stats, isLoading: false });
        } catch (error) {
            console.error('[PLAYER_STORE ERROR]:', error);
            set({ isLoading: false });
        }
    },

    registerPlayer: async (nickname: string, playerClass: string) => {
        try {
            await registerPlayerDB(nickname, playerClass);
            const updated = await fetchPlayerStatsFromDB();
            set({ playerStats: updated, isLoading: false });
        } catch (error) {
            console.error('Error during player registration:', error);
        }
    },

    applyXpChange: async (xpDiff: number) => {
        const { playerStats } = get();
        if (!playerStats) return null;

        let effectiveXpDiff = xpDiff;

        let currentXp = playerStats.currentXp + effectiveXpDiff;
        let level = playerStats.level;
        let maxXp = playerStats.maxXp;
        let didLevelUp = false;

        if (xpDiff > 0 && playerStats.xpBoostUntil) {
            const expiresAt = new Date(playerStats.xpBoostUntil).getTime();
            if (Date.now() < expiresAt) {
                effectiveXpDiff = Math.round(xpDiff * 1.5);
            }
        }

        while (currentXp >= maxXp) {
            currentXp -= maxXp;
            level += 1;
            maxXp = Math.floor(maxXp * 1.25);
            didLevelUp = true;
        }
        if (currentXp < 0) {
            currentXp = 0;
        }

        const oldRank = playerStats.rank;
        const newRank = calculateRank(level);
        const didRankUp = didLevelUp && oldRank !== newRank;

        const updatedStats = {
            ...playerStats,
            currentXp,
            level,
            maxXp,
            rank: newRank,
            hpPercentage: didLevelUp ? 100 : playerStats.hpPercentage,
        };

        set({ playerStats: updatedStats });

        await updatePlayerStatsDB(updatedStats);

        return {
            didLevelUp,
            didRankUp,
            newLevel: level,
            newRank,
            oldRank,
        };
    },
    clearPenalty: async () => {
        await clearPenaltyDB();
        set((state) => ({
            playerStats: state.playerStats
                ? { ...state.playerStats, hasPenalty: false, hpPercentage: 100 }
                : null,
        }));
    },
    loadInventory: async () => {
        const items = await fetchInventoryFromDB();
        set({ inventory: items });
    },
    awardChest: async (chestType: ChestType) => {
        const { playerStats } = get();
        if (!playerStats) return;

        const updatedChests = [...playerStats.pendingChests, chestType];
        const updatedStats = { ...playerStats, pendingChests: updatedChests };

        set({ playerStats: updatedStats });
        await updatePlayerLootStateDB(updatedStats.manaCrystals, updatedChests);
    },

    claimNextChest: async () => {
        const { playerStats, loadInventory } = get();
        if (!playerStats || playerStats.pendingChests.length === 0) return null;

        const nextChestType = playerStats.pendingChests[0];
        const remainingChests = playerStats.pendingChests.slice(1);

        const loot = openChestReward(nextChestType);
        const updatedCrystals = playerStats.manaCrystals + loot.manaCrystals;

        const updatedStats = {
            ...playerStats,
            manaCrystals: updatedCrystals,
            pendingChests: remainingChests,
        };

        set({ playerStats: updatedStats });

        await updatePlayerLootStateDB(updatedCrystals, remainingChests);

        if (loot.item) {
            await saveItemToInventoryDB(loot.item);
            await loadInventory();
        }

        return loot;
    },
    useInventoryItem: async (item: InventoryItem) => {
        const { playerStats, loadInventory } = get();
        if (!playerStats) return { success: false, message: 'ПОМИЛКА СИНХРОНІЗАЦІЇ' };

        let message = '';
        let updatedStats = { ...playerStats };

        switch (item.itemId) {
            case 'purification_stone': {
                if (!playerStats.hasPenalty) {
                    return { success: false, message: 'НЕМАЄ АКТИВНОГО ШТРАФУ' };
                }
                updatedStats.hasPenalty = false;
                message = 'ШТРАФНИЙ СТАТУС АНУЛЬОВАНО';
                break;
            }

            case 'overload_elixir': {
                const durationMs = 3 * 60 * 60 * 1000;
                const boostUntil = new Date(Date.now() + durationMs).toISOString();
                updatedStats.xpBoostUntil = boostUntil;
                message = 'АКТИВОВАНО БУСТ XP +50% НА 3 ГОДИНИ';
                break;
            }

            case 'monarch_hourglass': {
                if (playerStats.isStreakFrozen) {
                    return { success: false, message: 'СТРІК ВЖЕ ПІД ЗАХИСТОМ' };
                }
                updatedStats.isStreakFrozen = true;
                message = 'СТРІК ЗАМОРОЖЕНО НА 24 ГОДИНИ';
                break;
            }

            default:
                return { success: false, message: 'НЕВІДОМИЙ ТИП АРТЕФАКТУ' };
        }

        set({ playerStats: updatedStats });
        await updatePlayerBuffsDB(
            updatedStats.xpBoostUntil || '',
            Boolean(updatedStats.isStreakFrozen),
            updatedStats.hasPenalty
        );
        await consumeInventoryItemDB(item.itemId);
        await loadInventory();

        return { success: true, message };
    },
}));

export const calculateRank = (level: number): string => {
    if (level >= 70) return 'S-Rank';
    if (level >= 50) return 'A-Rank';
    if (level >= 35) return 'B-Rank';
    if (level >= 20) return 'C-Rank';
    if (level >= 10) return 'D-Rank';
    return 'E-Rank';
};