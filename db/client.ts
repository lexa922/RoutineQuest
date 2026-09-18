import * as SQLite from 'expo-sqlite';
import {Quest, SubQuest} from '@/types/quest';
import {PlayerStats} from '@/types/player'
import { InventoryItem, ChestType } from '@/types/loot';

const DB_NAME = 'routine_quest.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return dbInstance;
};

let initExecuted = false;

export const initDatabase = async () => {
    if (initExecuted) return;

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
            last_completed_at TEXT,
            reward_claimed INTEGER DEFAULT 0,
            is_boosted INTEGER DEFAULT 0
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sub_quests (
            id TEXT PRIMARY KEY NOT NULL,
            quest_id TEXT NOT NULL,
            title TEXT NOT NULL,
            xp_reward INTEGER NOT NULL,
            is_completed INTEGER DEFAULT 0,
            FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS inventory (
           id TEXT PRIMARY KEY NOT NULL,
           item_id TEXT NOT NULL UNIQUE,
           name TEXT NOT NULL,
           description TEXT NOT NULL,
           rarity TEXT NOT NULL,
           quantity INTEGER DEFAULT 1,
           icon TEXT NOT NULL
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
            last_daily_reset TEXT DEFAULT '',
            mana_crystals INTEGER DEFAULT 0,
            pending_chests TEXT DEFAULT '[]',
            last_daily_chest_claimed TEXT DEFAULT '',
            xp_boost_until TEXT DEFAULT '',
            is_streak_frozen INTEGER DEFAULT 0
        );
    `);
};

export const checkAndResetDailiesDB = async (): Promise<boolean> => {
    const db = await getDB();
    const today = new Date().toISOString().split('T')[0];

    const player = await db.getFirstAsync<{
        last_daily_reset: string | null;
        hp_percentage: number;
        streak_days: number;
        has_penalty: number;
    }>('SELECT last_daily_reset, hp_percentage, streak_days, has_penalty FROM player_stats WHERE id = 1;');

    if (!player) return false;

    if (player.last_daily_reset === today) {
        return false;
    }

    if (!player.last_daily_reset) {
        await db.runAsync(
            'UPDATE player_stats SET last_daily_reset = ? WHERE id = 1;',
            [today]
        );
        return false;
    }

    const uncompletedDailies = await db.getAllAsync<{ id: string }>(
        "SELECT id FROM quests WHERE type = 'daily' AND is_completed = 0;"
    );

    const completedDailies = await db.getAllAsync<{ id: string }>(
        "SELECT id FROM quests WHERE type = 'daily' AND is_completed = 1;"
    );

    let hpDamage = 0;
    let newStreak = player.streak_days;
    let penaltyActivated = player.has_penalty;

    if (uncompletedDailies.length > 0) {
        hpDamage += uncompletedDailies.length * 15;
        newStreak = 0;
        penaltyActivated = 1;
    } else if (completedDailies.length > 0) {
        newStreak += 1;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDayOfWeek = yesterday.getDay() === 0 ? 7 : yesterday.getDay();

    const regularDamage = await checkYesterdayRegularPenalties(db, yesterdayDayOfWeek);
    hpDamage += regularDamage;
    if (regularDamage > 0) {
        penaltyActivated = 1;
    }

    const finalHp = Math.max(0, player.hp_percentage - hpDamage);

    await db.runAsync(`
    UPDATE player_stats 
    SET hp_percentage = ?, streak_days = ?, has_penalty = ?, last_daily_reset = ? 
    WHERE id = 1;
  `, [finalHp, newStreak, penaltyActivated, today]);

    await db.runAsync("UPDATE quests SET is_completed = 0 WHERE type = 'daily';");
    await checkAndResetRegularQuestsDB();

    return true;
};

const checkYesterdayRegularPenalties = async (
    db: any,
    yesterdayDayOfWeek: number
): Promise<number> => {
    const quests = await fetchQuestsFromDB();
    let damage = 0;

    for (const q of quests) {
        if (q.type !== 'regular') continue;

        if (q.repeatType === 'weekdays' && q.repeatWeekdays?.includes(yesterdayDayOfWeek)) {
            if (!q.isCompleted) {
                damage += 10;
            }
        }
    }

    return damage;
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
    const rows = await db.getAllAsync<any>('SELECT * FROM quests ORDER BY created_at DESC;');
    const subRows = await db.getAllAsync<any>('SELECT * FROM sub_quests;');

    return rows.map((r) => {
        const subs: SubQuest[] = subRows
            .filter((s) => s.quest_id === r.id)
            .map((s) => ({
                id: s.id,
                questId: s.quest_id,
                title: s.title,
                xpReward: s.xp_reward,
                isCompleted: Boolean(s.is_completed),
            }));

        return {
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
            rewardClaimed: Boolean(r.reward_claimed),
            subQuests: subs,
            isBoosted: Boolean(r.is_boosted)
        };
    });
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

    if (quest.subQuests && quest.subQuests.length > 0) {
        for (const sub of quest.subQuests) {
            await db.runAsync(
                `INSERT INTO sub_quests (id, quest_id, title, xp_reward, is_completed)
         VALUES (?, ?, ?, ?, ?);`,
                [sub.id, quest.id, sub.title, sub.xpReward, sub.isCompleted ? 1 : 0]
            );
        }
    }
};

export const updateSubQuestCompletionDB = async (subQuestId: string, isCompleted: boolean) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE sub_quests SET is_completed = ? WHERE id = ?;',
        [isCompleted ? 1 : 0, subQuestId]
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

export const fetchPlayerStatsFromDB = async (): Promise<PlayerStats | null> => {
    const db = await getDB();
    const row = await db.getFirstAsync<any>('SELECT * FROM player_stats WHERE id = 1;');
    if (!row) return null;

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
        lastDailyReset: row.last_daily_reset,
        lastDailyChestClaimed: row.last_daily_chest_claimed || '',
        manaCrystals: row.mana_crystals ?? 0,
        pendingChests: row.pending_chests ? JSON.parse(row.pending_chests) : [],
        xpBoostUntil: row.xp_boost_until || '',
        isStreakFrozen: Boolean(row.is_streak_frozen),
    };
};

export const updatePlayerStatsDB = async (stats: PlayerStats) => {
    const db = await getDB();

    await db.runAsync(
        `UPDATE player_stats 
     SET 
       current_xp = ?, 
       level = ?, 
       max_xp = ?, 
       hp_percentage = ?, 
       rank = ?,
       streak_days = ?,
       has_penalty = ?
     WHERE id = 1;`,
        [
            stats.currentXp,
            stats.level,
            stats.maxXp,
            stats.hpPercentage,
            stats.rank,
            stats.streakDays,
            stats.hasPenalty ? 1 : 0,
        ]
    );
};

export const registerPlayerDB = async (nickname: string, playerClass: string) => {
    const db = await getDB();
    await db.runAsync(
        `INSERT OR REPLACE INTO player_stats (
      id, nickname, player_class, level, rank, current_xp, max_xp, hp_percentage, streak_days, has_penalty, is_registered
    ) VALUES (
      1, ?, ?, 1, 'E-Rank', 0, 1000, 100, 0, 0, 1
    );`,
        [nickname, playerClass]
    );
};

export const deleteQuestFromDB = async (id: string) => {
    const db = await getDB();
    await db.runAsync('DELETE FROM quests WHERE id = ?;', [id]);
};

export const clearPenaltyDB = async () => {
    const db = await getDB();
    await db.runAsync(`
    UPDATE player_stats 
    SET has_penalty = 0, hp_percentage = 100 
    WHERE id = 1;
  `);
};

export const fetchInventoryFromDB = async (): Promise<InventoryItem[]> => {
    const db = await getDB();
    const rows = await db.getAllAsync<any>('SELECT * FROM inventory ORDER BY rarity DESC;');
    return rows.map((r) => ({
        id: r.id,
        itemId: r.item_id,
        name: r.name,
        description: r.description,
        rarity: r.rarity,
        quantity: r.quantity,
        icon: r.icon,
    }));
};

export const saveItemToInventoryDB = async (item: InventoryItem) => {
    const db = await getDB();
    await db.runAsync(
        `INSERT INTO inventory (id, item_id, name, description, rarity, quantity, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(item_id) DO UPDATE SET quantity = quantity + 1;`,
        [item.id, item.itemId, item.name, item.description, item.rarity, item.quantity, item.icon]
    );
};

export const updatePlayerLootStateDB = async (
    manaCrystals: number,
    pendingChests: ChestType[]
) => {
    const db = await getDB();
    await db.runAsync(
        'UPDATE player_stats SET mana_crystals = ?, pending_chests = ? WHERE id = 1;',
        [manaCrystals, JSON.stringify(pendingChests)]
    );
};

export const markQuestRewardClaimedDB = async (questId: string) => {
    const db = await getDB();
    await db.runAsync('UPDATE quests SET reward_claimed = 1 WHERE id = 1;', [questId]);
};

export const updateDailyChestClaimDateDB = async (dateStr: string) => {
    const db = await getDB();
    await db.runAsync('UPDATE player_stats SET last_daily_chest_claimed = ? WHERE id = 1;', [dateStr]);
};

export const consumeInventoryItemDB = async (itemId: string) => {
    const db = await getDB();
    const row = await db.getFirstAsync<any>(
        'SELECT quantity FROM inventory WHERE item_id = ?;',
        [itemId]
    );

    if (!row) return;

    if (row.quantity > 1) {
        await db.runAsync(
            'UPDATE inventory SET quantity = quantity - 1 WHERE item_id = ?;',
            [itemId]
        );
    } else {
        await db.runAsync('DELETE FROM inventory WHERE item_id = ?;', [itemId]);
    }
};

export const updatePlayerBuffsDB = async (
    xpBoostUntil: string,
    isStreakFrozen: boolean,
    hasPenalty: boolean
) => {
    const db = await getDB();
    await db.runAsync(
        `UPDATE player_stats 
     SET xp_boost_until = ?, is_streak_frozen = ?, has_penalty = ? 
     WHERE id = 1;`,
        [xpBoostUntil, isStreakFrozen ? 1 : 0, hasPenalty ? 1 : 0]
    );
};

export const applyMirrorBoostDB = async (questId: string) => {
    const db = await getDB();
    await db.runAsync('UPDATE quests SET is_boosted = 1 WHERE id = ?;', [questId]);
    await db.runAsync(
        'UPDATE sub_quests SET xp_reward = xp_reward * 2 WHERE quest_id = ? AND is_completed = 0;',
        [questId]
    );
};