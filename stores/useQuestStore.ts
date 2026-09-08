import { create } from 'zustand';
import { Quest, TabType, QuestCategory } from '@/types/quest';
import {
    fetchQuestsFromDB,
    insertQuestToDB,
    updateQuestCompletionDB,
    checkAndResetDailiesDB
} from '@/db/client';

interface QuestState {
    quests: Quest[];
    activeTab: TabType;
    isLoading: boolean;

    initQuests: () => Promise<void>;
    setActiveTab: (tab: TabType) => void;
    addQuest: (payload: {
        title: string;
        category: QuestCategory;
        type: TabType;
        xpReward: number;
    }) => Promise<void>;
    toggleQuest: (id: string) => Promise<Quest | null>;
}

export const useQuestStore = create<QuestState>((set, get) => ({
    quests: [],
    activeTab: 'daily',
    isLoading: true,

    initQuests: async () => {
        try {
            await checkAndResetDailiesDB();
            const quests = await fetchQuestsFromDB();
            set({ quests, isLoading: false });
        } catch (error) {
            console.error('QuestStore init error:', error);
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
        const { quests } = get();
        const target = quests.find((q) => q.id === id);
        if (!target) return null;

        const nextCompleted = !target.isCompleted;
        const updatedQuest = { ...target, isCompleted: nextCompleted };

        set((state) => ({
            quests: state.quests.map((q) => (q.id === id ? updatedQuest : q)),
        }));

        await updateQuestCompletionDB(id, nextCompleted);
        return updatedQuest;
    },
}));