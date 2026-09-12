import { create } from 'zustand';
import {Quest, TabType, QuestCategory, RepeatType, SubQuest} from '@/types/quest';
import {
    fetchQuestsFromDB,
    insertQuestToDB,
    updateQuestCompletionDB,
    checkAndResetDailiesDB,
    deleteQuestFromDB,
    updateSubQuestCompletionDB,
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
    toggleQuest: (id: string) => Promise<{ updatedQuest: Quest; xpDiff: number } | null>;
    deleteQuest: (id: string) => Promise<void>;
    toggleSubQuest: (questId: string, subQuestId: string) => Promise<{ xpDiff: number } | null>;
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
        subQuests?: SubQuest[];
    }) => {
        const questId = String(Date.now());

        const formattedSubQuests = payload.subQuests?.map((s, index) => ({
            ...s,
            id: s.id || `${questId}_sub_${index}`,
            questId: questId,
        }));
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
            subQuests: formattedSubQuests,
        };

        set((state) => ({
            quests: [newQuest, ...state.quests],
            activeTab: payload.type,
        }));

        await insertQuestToDB(newQuest);
    },

    toggleQuest: async (id: string): Promise<{ updatedQuest: Quest; xpDiff: number } | null> => {
        const { quests } = get();
        const target = quests.find((q) => q.id === id);
        if (!target) return null;

        const nextCompleted = !target.isCompleted;
        let xpDiff = 0;

        let updatedSubs = target.subQuests;

        if (target.subQuests && target.subQuests.length > 0) {
            if (nextCompleted) {
                const uncompletedSubs = target.subQuests.filter((s) => !s.isCompleted);
                const gainedFromSubs = uncompletedSubs.reduce((acc, s) => acc + s.xpReward, 0);
                xpDiff = gainedFromSubs + target.xpReward;

                updatedSubs = target.subQuests.map((s) => ({ ...s, isCompleted: true }));
            } else {
                const completedSubs = target.subQuests.filter((s) => s.isCompleted);
                const lostFromSubs = completedSubs.reduce((acc, s) => acc + s.xpReward, 0);
                xpDiff = -(lostFromSubs + (target.isCompleted ? target.xpReward : 0));

                updatedSubs = target.subQuests.map((s) => ({ ...s, isCompleted: false }));
            }

            for (const sub of updatedSubs) {
                await updateSubQuestCompletionDB(sub.id, nextCompleted);
            }
        } else {
            xpDiff = nextCompleted ? target.xpReward : -target.xpReward;
        }

        const nowIso = nextCompleted ? new Date().toISOString() : null;
        const updatedQuest: Quest = {
            ...target,
            isCompleted: nextCompleted,
            subQuests: updatedSubs,
            lastCompletedAt: nowIso,
        };

        set((state) => ({
            quests: state.quests.map((q) => (q.id === id ? updatedQuest : q)),
        }));

        await updateQuestCompletionDB(id, nextCompleted, nowIso);

        return { updatedQuest, xpDiff };
    },
    deleteQuest: async (id: string) => {
        set((state) => ({
            quests: state.quests.filter((q) => q.id !== id),
        }));

        await deleteQuestFromDB(id);
    },
    toggleSubQuest: async (questId: string, subQuestId: string) => {
        const { quests } = get();
        const parent = quests.find((q) => q.id === questId);
        if (!parent || !parent.subQuests) return null;

        const sub = parent.subQuests.find((s) => s.id === subQuestId);
        if (!sub) return null;

        const nextSubCompleted = !sub.isCompleted;
        let totalXpDiff = nextSubCompleted ? sub.xpReward : -sub.xpReward;

        const updatedSubs = parent.subQuests.map((s) =>
            s.id === subQuestId ? { ...s, isCompleted: nextSubCompleted } : s
        );

        const allSubsCompleted = updatedSubs.length > 0 && updatedSubs.every((s) => s.isCompleted);
        const parentCompletionChanged = parent.isCompleted !== allSubsCompleted;

        if (parentCompletionChanged) {
            if (allSubsCompleted) {
                totalXpDiff += parent.xpReward;
            } else {
                totalXpDiff -= parent.xpReward;
            }
        }

        const updatedParent: Quest = {
            ...parent,
            isCompleted: allSubsCompleted,
            subQuests: updatedSubs,
        };

        set((state) => ({
            quests: state.quests.map((q) => (q.id === questId ? updatedParent : q)),
        }));

        await updateSubQuestCompletionDB(subQuestId, nextSubCompleted);

        if (parentCompletionChanged) {
            await updateQuestCompletionDB(
                questId,
                allSubsCompleted,
                allSubsCompleted ? new Date().toISOString() : null
            );
        }

        return { xpDiff: totalXpDiff };
    },
}));