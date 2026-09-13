import { create } from 'zustand';
import { PlayerStats } from '@/types/quest';
import {
    clearPenaltyDB,
    fetchPlayerStatsFromDB,
    registerPlayerDB,
    updatePlayerXpDB,
} from '@/db/client';

interface PlayerState {
    playerStats: PlayerStats | null;
    isLoading: boolean;

    initPlayer: () => Promise<void>;
    registerPlayer: (nickname: string, playerClass: string) => Promise<void>;
    applyXpChange: (xpDiff: number) => Promise<{ didLevelUp: boolean; newLevel: number } | null>;
    clearPenalty: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    playerStats: null,
    isLoading: true,

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

        let currentXp = playerStats.currentXp + xpDiff;
        let level = playerStats.level;
        let maxXp = playerStats.maxXp;
        let didLevelUp = false;

        while (currentXp >= maxXp) {
            currentXp -= maxXp;
            level += 1;
            maxXp = Math.floor(maxXp * 1.25);
            didLevelUp = true;
        }
        if (currentXp < 0) {
            currentXp = 0;
        }

        const updatedStats = {
            ...playerStats,
            currentXp,
            level,
            maxXp,
            hpPercentage: didLevelUp ? 100 : playerStats.hpPercentage,
        };

        set({ playerStats: updatedStats });

        await updatePlayerXpDB(currentXp, level, maxXp);

        return { didLevelUp, newLevel: level };
    },
    clearPenalty: async () => {
        await clearPenaltyDB();
        set((state) => ({
            playerStats: state.playerStats
                ? { ...state.playerStats, hasPenalty: false, hpPercentage: 100 }
                : null,
        }));
    },
}));