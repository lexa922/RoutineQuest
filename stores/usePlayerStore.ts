import { create } from 'zustand';
import { PlayerStats } from '@/types/quest';
import {
    fetchPlayerStatsFromDB,
    registerPlayerDB,
    updatePlayerXpDB,
} from '@/db/client';

interface PlayerState {
    playerStats: PlayerStats | null;
    isLoading: boolean;

    initPlayer: () => Promise<void>;
    registerPlayer: (nickname: string, playerClass: string) => Promise<void>;
    applyXpChange: (xpDiff: number) => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    playerStats: null,
    isLoading: true,

    initPlayer: async () => {
        try {
            const stats = await fetchPlayerStatsFromDB();
            set({ playerStats: stats, isLoading: false });
        } catch (error) {
            console.error('PlayerStore init error:', error);
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
        if (!playerStats) return;

        let nextXp = playerStats.currentXp + xpDiff;
        let nextLevel = playerStats.level;
        let nextMaxXp = playerStats.maxXp;

        if (nextXp >= nextMaxXp) {
            nextXp -= nextMaxXp;
            nextLevel += 1;
            nextMaxXp = Math.round(nextMaxXp * 1.25);
        } else if (nextXp < 0 && nextLevel > 1) {
            nextLevel -= 1;
            nextMaxXp = Math.round(nextMaxXp / 1.25);
            nextXp = nextMaxXp + nextXp;
        }

        const updated: PlayerStats = {
            ...playerStats,
            currentXp: Math.max(0, nextXp),
            level: nextLevel,
            maxXp: nextMaxXp,
        };

        set({ playerStats: updated });
        await updatePlayerXpDB(updated.currentXp, updated.level, updated.maxXp);
    },
}));