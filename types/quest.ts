export type QuestCategory = 'STR' | 'INT' | 'MND';
export type TabType = 'daily' | 'main' | 'regular';
export type RepeatType = 'interval' | 'weekdays';

export interface SubQuest {
    id: string;
    questId: string;
    title: string;
    xpReward: number;
    isCompleted: boolean;
}

export interface Quest {
    id: string;
    title: string;
    category: QuestCategory;
    type: TabType;
    xpReward: number;
    isCompleted: boolean;
    createdAt: string;
    repeatType?: RepeatType;
    repeatIntervalDays?: number;
    repeatWeekdays?: number[];
    lastCompletedAt?: string | null;
    subQuests?: SubQuest[];
}

export interface PlayerStats {
    id?: number;
    nickname: string;
    playerClass: string;
    level: number;
    rank: string;
    currentXp: number;
    maxXp: number;
    hpPercentage: number;
    streakDays: number;
    hasPenalty: boolean;
    isRegistered?: boolean;
}