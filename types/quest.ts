export type QuestCategory = 'STR' | 'INT' | 'MND';
export type TabType = 'daily' | 'main' | 'regular';

export interface Quest {
    id: string;
    title: string;
    category: QuestCategory;
    type: TabType;
    xpReward: number;
    isCompleted: boolean;
    createdAt: string;
}

export interface PlayerStats {
    level: number;
    rank: string;
    currentXp: number;
    maxXp: number;
    hpPercentage: number;
    streakDays: number;
    hasPenalty: boolean;
}