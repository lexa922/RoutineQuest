import { create } from 'zustand';
import { Quest, TabType, QuestCategory, RepeatType } from '@/types/quest';
import {
    fetchQuestsFromDB,
    insertQuestToDB,
    updateQuestCompletionDB,
    checkAndResetDailiesDB,
    deleteQuestFromDB
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
    deleteQuest: (id: string) => Promise<void>;
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
            set({ isLoading: false });
        }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    addQuest: async (payload: {
        title: string;
        category: QuestCategory;
        type: TabType;
        xpReward: number;
        repeatType?: RepeatType;
        repeatIntervalDays?: number;
        repeatWeekdays?: number[];
    }) => {
        const newQuest: Quest = {
            id: String(Date.now()),
            title: payload.title,
            category: payload.category,
            type: payload.type,
            xpReward: payload.xpReward,
            isCompleted: false,
            createdAt: new Date().toISOString(),
            repeatType: payload.repeatType,
            repeatIntervalDays: payload.repeatIntervalDays,
            repeatWeekdays: payload.repeatWeekdays,
        };

        set((state) => ({
            quests: [newQuest, ...state.quests],
            activeTab: payload.type,
        }));

        await insertQuestToDB(newQuest);
    },

    toggleQuest: async (id: string) => {
        const { quests } = get();
        const target = quests.find((q) => q.id === id);
        if (!target) return null;

        const nextCompleted = !target.isCompleted;
        const nowIso = nextCompleted ? new Date().toISOString() : null;

        const updatedQuest: Quest = { ...target, isCompleted: nextCompleted, lastCompletedAt: nowIso ?? target.lastCompletedAt };

        set((state) => ({
            quests: state.quests.map((q) => (q.id === id ? updatedQuest : q)),
        }));

        await updateQuestCompletionDB(id, nextCompleted, updatedQuest.lastCompletedAt);
        return updatedQuest;
    },
    deleteQuest: async (id: string) => {
        set((state) => ({
            quests: state.quests.filter((q) => q.id !== id),
        }));

        await deleteQuestFromDB(id);
    },
}));