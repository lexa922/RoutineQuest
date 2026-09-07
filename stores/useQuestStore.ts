import { create } from 'zustand';
import { Quest, PlayerStats, TabType, QuestCategory } from '@/types/quest';
import {
    initDatabase,
    fetchQuestsFromDB,
    insertQuestToDB,
    updateQuestCompletionDB,
    fetchPlayerStatsFromDB,
    updatePlayerXpDB,
} from '@/db/client';

interface QuestState {
    quests: Quest[];
    playerStats: PlayerStats | null;
    activeTab: TabType;
    isLoading: boolean;

    init: () => Promise<void>;
    setActiveTab: (tab: TabType) => void;
    addQuest: (payload: { title: string; category: QuestCategory; type: TabType; xpReward: number }) => Promise<void>;
    toggleQuest: (id: string) => Promise<void>;
}

export const useQuestStore = create<QuestState>((set, get) => ({
    quests: [],
    playerStats: null,
    activeTab: 'daily',
    isLoading: true,

    init: async () => {
        try {
            await initDatabase();
            const quests = await fetchQuestsFromDB();
            const playerStats = await fetchPlayerStatsFromDB();
            set({ quests, playerStats, isLoading: false });
        } catch (e) {
            console.error('Database init error:', e);
            set({ isLoading: false });
        }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    addQuest: async ({ title, category, type, xpReward }) => {
        const newQuest: Quest = {
            id: Date.now().toString(),
            title,
            category,
            type,
            xpReward,
            isCompleted: false,
            createdAt: new Date().toISOString(),
        };

        set((state) => ({
            quests: [newQuest, ...state.quests],
            activeTab: type,
        }));

        await insertQuestToDB(newQuest);
    },

    toggleQuest: async (id: string) => {
        const { quests, playerStats } = get();
        const targetQuest = quests.find((q) => q.id === id);
        if (!targetQuest || !playerStats) return;

        const nextCompleted = !targetQuest.isCompleted;
        const xpDiff = nextCompleted ? targetQuest.xpReward : -targetQuest.xpReward;

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

        const updatedStats: PlayerStats = {
            ...playerStats,
            currentXp: Math.max(0, nextXp),
            level: nextLevel,
            maxXp: nextMaxXp,
        };

        set((state) => ({
            quests: state.quests.map((q) => (q.id === id ? { ...q, isCompleted: nextCompleted } : q)),
            playerStats: updatedStats,
        }));

        await Promise.all([
            updateQuestCompletionDB(id, nextCompleted),
            updatePlayerXpDB(updatedStats.currentXp, updatedStats.level, updatedStats.maxXp),
        ]);
    },
}));