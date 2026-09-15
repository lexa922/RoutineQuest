import {ChestType} from "@/types/loot";

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
    lastDailyReset?: string;
    manaCrystals: number;
    pendingChests: ChestType[];
}