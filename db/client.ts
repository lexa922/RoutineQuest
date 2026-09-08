import * as SQLite from 'expo-sqlite';
import { Quest, PlayerStats } from '@/types/quest';

const DB_NAME = 'routine_quest.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return dbInstance;
};

export const initDatabase = async () => {
    const db = await getDB();

    await db.execAsync('PRAGMA journal_mode = WAL;');

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        is_completed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS player_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            nickname TEXT DEFAULT 'Hunter',
            player_class TEXT DEFAULT 'Shadow Striker',
            level INTEGER DEFAULT 1,
            rank TEXT DEFAULT 'E-Rank',
            current_xp INTEGER DEFAULT 0,
            max_xp INTEGER DEFAULT 1000,
            hp_percentage INTEGER DEFAULT 100,
            streak_days INTEGER DEFAULT 0,
            has_penalty INTEGER DEFAULT 0,
            is_registered INTEGER DEFAULT 0,
            last_daily_reset TEXT DEFAULT ''
            );
    `);
};

export const checkAndResetDailiesDB = async (): Promise<boolean> => {
    const db = await getDB();
    const today = new Date().toISOString().split('T')[0]; // Рядок виду "YYYY-MM-DD"

    const player = await db.getFirstAsync<{ last_daily_reset: string | null }>(
        'SELECT last_daily_reset FROM player_stats WHERE id = 1;'
    );

    if (!player) return false;

    if (player.last_daily_reset === today) {
        return false;
    }

    await db.runAsync(`
    UPDATE quests 
    SET is_completed = 0 
    WHERE type = 'daily';
  `);

    await db.runAsync(`
    UPDATE player_stats 
    SET last_daily_reset = ? 
    WHERE id = 1;
  `, [today]);

    return true;
};

export const fetchQuestsFromDB = async (): Promise<Quest[]> => {
    const db = await getDB();
    const rows = await db.getAllAsync<{
        id: string;
        title: string;
        category: Quest['category'];
        type: Quest['type'];
        xp_reward: number;
        is_completed: number;
        created_at: string;
    }>('SELECT * FROM quests ORDER BY created_at DESC;');

    return rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        type: r.type,
        xpReward: r.xp_reward,
        isCompleted: Boolean(r.is_completed),
        createdAt: r.created_at,
    }));
};

export const insertQuestToDB = async (quest: Quest) => {
    const db = await getDB();
    await db.runAsync(
        `INSERT INTO quests (id, title, category, type, xp_reward, is_completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
            quest.id,
            quest.title,
            quest.category,
            quest.type,
            quest.xpReward,
            quest.isCompleted ? 1 : 0,
            quest.createdAt,
        ]
    );
};

export const updateQuestCompletionDB = async (id: string, isCompleted: boolean) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE quests SET is_completed = ? WHERE id = ?;',
        [isCompleted ? 1 : 0, id]
    );
};

export const fetchPlayerStatsFromDB = async (): Promise<PlayerStats> => {
    const db = await getDB();
    const row = await db.getFirstAsync<{
        nickname: string;
        player_class: string;
        level: number;
        rank: string;
        current_xp: number;
        max_xp: number;
        hp_percentage: number;
        streak_days: number;
        has_penalty: number;
        is_registered: number;
    }>('SELECT * FROM player_stats WHERE id = 1;');

    if (!row) {
        return {
            nickname: 'Hunter',
            playerClass: 'Novice',
            level: 1,
            rank: 'E-Rank',
            currentXp: 0,
            maxXp: 1000,
            hpPercentage: 100,
            streakDays: 0,
            hasPenalty: false,
            isRegistered: false,
        };
    }

    return {
        nickname: row.nickname,
        playerClass: row.player_class,
        level: row.level,
        rank: row.rank,
        currentXp: row.current_xp,
        maxXp: row.max_xp,
        hpPercentage: row.hp_percentage,
        streakDays: row.streak_days,
        hasPenalty: Boolean(row.has_penalty),
        isRegistered: Boolean(row.is_registered),
    };
};

export const updatePlayerXpDB = async (newXp: number, level: number, maxXp: number) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE player_stats SET current_xp = ?, level = ?, max_xp = ? WHERE id = 1;',
        [newXp, level, maxXp]
    );
};

export const registerPlayerDB = async (nickname: string, playerClass: string) => {
    const db = await getDB();
    await db.runAsync(
        `INSERT OR REPLACE INTO player_stats (
      id, nickname, player_class, level, rank, current_xp, max_xp, hp_percentage, streak_days, has_penalty, is_registered
    ) VALUES (
      1, ?, ?, 1, 'E-Rank', 0, 1000, 100, 1, 0, 1
    );`,
        [nickname, playerClass]
    );
};