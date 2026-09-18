export type QuestCategory = 'STR' | 'INT' | 'MND';
export type TabType = 'daily' | 'main' | 'regular'| 'side';
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
    rewardClaimed?: boolean;
    createdAt: string;
    repeatType?: RepeatType;
    repeatIntervalDays?: number;
    repeatWeekdays?: number[];
    lastCompletedAt?: string | null;
    subQuests?: SubQuest[];
}
