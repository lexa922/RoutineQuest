import { ChestType, InventoryItem, LootResult } from '@/types/loot';

export const ITEM_REGISTRY: Record<string, Omit<InventoryItem, 'id' | 'quantity'>> = {
    monarch_hourglass: {
        itemId: 'monarch_hourglass',
        name: 'Пісочний годинник Монарха',
        description: 'Заморожує Streak на 24 години у разі пропуску.',
        rarity: 'rare',
        icon: '⏳',
    },
    overload_elixir: {
        itemId: 'overload_elixir',
        name: 'Еліксир перевантаження',
        description: '+50% до всього отриманого XP на 3 години.',
        rarity: 'uncommon',
        icon: '🧪',
    },
    shadow_pass: {
        itemId: 'shadow_pass',
        name: 'Тіньовий дозвіл',
        description: 'Миттєво зараховує один Daily Quest без виконання.',
        rarity: 'epic',
        icon: '📜',
    },
    purification_stone: {
        itemId: 'purification_stone',
        name: 'Камінь очищення',
        description: 'Повністю скасовує активний Штрафний Квест без покарання.',
        rarity: 'rare',
        icon: '💎',
    },
    expansion_mirror: {
        itemId: 'expansion_mirror',
        name: 'Дзеркало розширення',
        description: 'Подвоює нагороду XP за всі підквести вибраного Main завдання.',
        rarity: 'legendary',
        icon: '🪞',
    },
};

export const openChestReward = (chestType: ChestType): LootResult => {
    const roll = Math.random() * 100;

    if (chestType === 'daily') {

        const crystals = Math.floor(Math.random() * 21) + 10;
        let selectedItem: InventoryItem | null = null;

        if (roll < 25) {
            const template = ITEM_REGISTRY.overload_elixir;
            selectedItem = { ...template, id: `loot_${Date.now()}`, quantity: 1 };
        } else if (roll < 35) {
            const template = roll < 30 ? ITEM_REGISTRY.monarch_hourglass : ITEM_REGISTRY.purification_stone;
            selectedItem = { ...template, id: `loot_${Date.now()}`, quantity: 1 };
        }

        return {
            chestType,
            manaCrystals: crystals,
            item: selectedItem,
        };
    }

    const crystals = Math.floor(Math.random() * 151) + 100;
    let chosenKey = 'monarch_hourglass';

    if (roll < 50) {
        chosenKey = roll < 25 ? 'monarch_hourglass' : 'purification_stone';
    } else if (roll < 85) {
        chosenKey = 'shadow_pass';
    } else {
        chosenKey = 'expansion_mirror';
    }

    const template = ITEM_REGISTRY[chosenKey];
    return {
        chestType,
        manaCrystals: crystals,
        item: { ...template, id: `loot_${Date.now()}`, quantity: 1 },
    };
};