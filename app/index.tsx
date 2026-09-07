import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, StatusBar } from 'react-native';
import { Colors } from '@/constants/theme';
import { PlayerStatusHeader } from '@/components/system/PlayerStatusHeader';
import { QuestCard } from '@/components/system/QuestCard';
import { QuestFilterTabs, TabType } from '@/components/system/QuestFilterTabs';
import { SystemActionFAB } from '@/components/system/SystemActionFAB';
import { CreateQuestModal, NewQuestPayload } from '@/components/system/CreateQuestModal';

interface QuestItem {
    id: string;
    title: string;
    category: 'STR' | 'INT' | 'MND';
    type: TabType;
    xpReward: number;
    cooldown?: string;
    isCompleted: boolean;
}

const INITIAL_QUESTS: QuestItem[] = [
    {
        id: '1',
        title: 'Підтягування в гравітроні: 4 підходи',
        category: 'STR',
        type: 'daily',
        xpReward: 35,
        cooldown: '23:45:10',
        isCompleted: false,
    },
    {
        id: '2',
        title: "З'їсти порцію білка (курятина / м'ясо)",
    category: 'STR',
    type: 'daily',
    xpReward: 20,
    cooldown: '12:00:00',
    isCompleted: true,
},
{
    id: '3',
        title: 'Скетч кульковою ручкою в блокноті',
    category: 'MND',
    type: 'daily',
    xpReward: 25,
    cooldown: '18:10:00',
    isCompleted: false,
},
{
    id: '4',
        title: 'Розробити архітектуру модуля SQLite',
    category: 'INT',
    type: 'main',
    xpReward: 120,
    isCompleted: false,
},
{
    id: '5',
        title: 'Моделювання базового меша в Blender',
    category: 'INT',
    type: 'main',
    xpReward: 80,
    isCompleted: false,
},
{
    id: '6',
        title: 'Синхронізація заміток у Obsidian',
    category: 'MND',
    type: 'regular',
    xpReward: 15,
    isCompleted: true,
},
{
    id: '7',
        title: 'Прибирання робочого місця',
    category: 'MND',
    type: 'regular',
    xpReward: 15,
    isCompleted: false,
},
];

export default function HomeScreen() {
    const [quests, setQuests] = useState<QuestItem[]>(INITIAL_QUESTS);
    const [activeTab, setActiveTab] = useState<TabType>('daily');
    const [currentXp, setCurrentXp] = useState(740);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleCreateQuest = (payload: NewQuestPayload) => {
        const newQuest: QuestItem = {
            id: Date.now().toString(),
            title: payload.title,
            category: payload.category,
            type: payload.type,
            xpReward: payload.xpReward,
            isCompleted: false,
        };
        setQuests((prev) => [newQuest, ...prev]);
        setActiveTab(payload.type);
    };

    const counts = useMemo(() => {
        const calc = (type: TabType) => {
            const list = quests.filter((q) => q.type === type);
            return {
                completed: list.filter((q) => q.isCompleted).length,
                total: list.length,
            };
        };
        return {
            daily: calc('daily'),
            main: calc('main'),
            regular: calc('regular'),
        };
    }, [quests]);

    const toggleQuest = (id: string) => {
        setQuests((prev) =>
            prev.map((q) => {
                if (q.id === id) {
                    const nextState = !q.isCompleted;
                    setCurrentXp((xp) => xp + (nextState ? q.xpReward : -q.xpReward));
                    return { ...q, isCompleted: nextState };
                }
                return q;
            })
        );
    };

    const filteredQuests = useMemo(() => {
        return quests.filter((q) => q.type === activeTab);
    }, [quests, activeTab]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

            <PlayerStatusHeader
                level={12}
                rank="E-Rank"
                currentXp={currentXp}
                maxXp={1000}
                hpPercentage={85}
                streakDays={4}
                hasPenalty={false}
            />

            <QuestFilterTabs
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                counts={counts}
            />

            <FlatList
                data={filteredQuests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <QuestCard quest={item} onToggle={toggleQuest} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <SystemActionFAB onPress={() => setIsModalVisible(true)} />

            <CreateQuestModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleCreateQuest}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgPrimary,
    },
    listContent: {
        paddingBottom: 90,
    },
});
