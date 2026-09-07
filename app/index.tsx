import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';
import { PlayerStatusHeader } from '@/components/system/PlayerStatusHeader';
import { QuestCard } from '@/components/system/QuestCard';
import { QuestFilterTabs } from '@/components/system/QuestFilterTabs';
import { SystemActionFAB } from '@/components/system/SystemActionFAB';
import { CreateQuestModal, NewQuestPayload } from '@/components/system/CreateQuestModal';
import { useQuestStore } from '@/stores/useQuestStore';

export default function HomeScreen() {
    const { quests, playerStats, activeTab, isLoading, init, setActiveTab, addQuest, toggleQuest } = useQuestStore();
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const counts = useMemo(() => {
        const calc = (type: 'daily' | 'main' | 'regular') => {
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

    const filteredQuests = useMemo(() => {
        return quests.filter((q) => q.type === activeTab);
    }, [quests, activeTab]);

    const handleCreateQuest = async (payload: NewQuestPayload) => {
        await addQuest(payload);
    };

    if (isLoading || !playerStats) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.neonBlue} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

            <PlayerStatusHeader
                level={playerStats.level}
                rank={playerStats.rank}
                currentXp={playerStats.currentXp}
                maxXp={playerStats.maxXp}
                hpPercentage={playerStats.hpPercentage}
                streakDays={playerStats.streakDays}
                hasPenalty={playerStats.hasPenalty}
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
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingBottom: 90,
    },
});