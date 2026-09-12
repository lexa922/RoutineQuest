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
            created_at TEXT NOT NULL,
            repeat_type TEXT,
            repeat_interval_days INTEGER,
            repeat_weekdays TEXT,
            last_completed_at TEXT
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
    const today = new Date().toISOString().split('T')[0];

    const player = await db.getFirstAsync<{ last_daily_reset: string | null }>(
        'SELECT last_daily_reset FROM player_stats WHERE id = 1;'
    );

    if (!player) {
        await db.runAsync(`
      INSERT OR IGNORE INTO player_stats (id, last_daily_reset)
      VALUES (1, ?);
    `, [today]);
        return false;
    }

    if (!player.last_daily_reset) {
        await db.runAsync(
            'UPDATE player_stats SET last_daily_reset = ? WHERE id = 1;',
            [today]
        );
        return false;
    }

    if (player.last_daily_reset === today) {
        return false;
    }

    await db.runAsync(`
    UPDATE quests 
    SET is_completed = 0 
    WHERE type = 'daily';
  `);

    await checkAndResetRegularQuestsDB();

    await db.runAsync(
        'UPDATE player_stats SET last_daily_reset = ? WHERE id = 1;',
        [today]
    );

    return true;
};

export const checkAndResetRegularQuestsDB = async () => {
    const db = await getDB();
    const quests = await fetchQuestsFromDB();
    const now = new Date();

    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const todayStr = now.toISOString().split('T')[0];

    for (const q of quests) {
        if (q.type !== 'regular' || !q.isCompleted) continue;

        let shouldReset = false;

        if (q.repeatType === 'weekdays' && q.repeatWeekdays && q.repeatWeekdays.length > 0) {
            const isDayMatch = q.repeatWeekdays.includes(currentDayOfWeek);
            const doneToday = q.lastCompletedAt?.startsWith(todayStr);

            if (isDayMatch && !doneToday) {
                shouldReset = true;
            }
        } else if (q.repeatType === 'interval' && q.repeatIntervalDays && q.lastCompletedAt) {
            const lastDate = new Date(q.lastCompletedAt);
            const diffTime = now.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= q.repeatIntervalDays) {
                shouldReset = true;
            }
        }

        if (shouldReset) {
            await db.runAsync(
                'UPDATE quests SET is_completed = 0 WHERE id = ?;',
                [q.id]
            );
        }
    }
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
        repeat_type: Quest['repeatType'];
        repeat_interval_days: number | null;
        repeat_weekdays: string | null;
        last_completed_at: string | null;
    }>('SELECT * FROM quests ORDER BY created_at DESC;');

    return rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        type: r.type,
        xpReward: r.xp_reward,
        isCompleted: Boolean(r.is_completed),
        createdAt: r.created_at,
        repeatType: r.repeat_type,
        repeatIntervalDays: r.repeat_interval_days ?? undefined,
        repeatWeekdays: r.repeat_weekdays ? JSON.parse(r.repeat_weekdays) : undefined,
        lastCompletedAt: r.last_completed_at,
    }));
};

export const insertQuestToDB = async (quest: Quest) => {
    const db = await getDB();
    await db.runAsync(
        `INSERT INTO quests (
            id, title, category, type, xp_reward, is_completed, created_at,
            repeat_type, repeat_interval_days, repeat_weekdays, last_completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
            quest.id,
            quest.title,
            quest.category,
            quest.type,
            quest.xpReward,
            quest.isCompleted ? 1 : 0,
            quest.createdAt,
            quest.repeatType || null,
            quest.repeatIntervalDays || null,
            quest.repeatWeekdays ? JSON.stringify(quest.repeatWeekdays) : null,
            quest.lastCompletedAt || null,
        ]
    );
};

export const updateQuestCompletionDB = async (
    id: string,
    isCompleted: boolean,
    lastCompletedAt?: string | null
) => {
    const db = await getDB();

    const completedInt = isCompleted ? 1 : 0;
    const completedDate = isCompleted ? (lastCompletedAt || new Date().toISOString()) : null;

    const result = await db.runAsync(
        `UPDATE quests 
     SET is_completed = ?, last_completed_at = ? 
     WHERE id = ?;`,
        [completedInt, completedDate, id]
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

export const deleteQuestFromDB = async (id: string) => {
    const db = await getDB();
    await db.runAsync('DELETE FROM quests WHERE id = ?;', [id]);
};