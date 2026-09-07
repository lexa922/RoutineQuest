import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { PlayerStatusHeader } from '@/components/system/PlayerStatusHeader';
import { QuestCard } from '@/components/system/QuestCard';
import { QuestFilterTabs } from '@/components/system/QuestFilterTabs';
import { SystemActionFAB } from '@/components/system/SystemActionFAB';
import { CreateQuestModal} from '@/components/system/CreateQuestModal';

import { useQuestStore } from '@/stores/useQuestStore';
import { usePlayerStore } from '@/stores/usePlayerStore';

import { initDatabase } from '@/db/client';

export default function HomeScreen() {
    const router = useRouter();

    const quests = useQuestStore((state) => state.quests);
    const activeTab = useQuestStore((state) => state.activeTab);
    const isQuestsLoading = useQuestStore((state) => state.isLoading);
    const initQuests = useQuestStore((state) => state.initQuests);
    const setActiveTab = useQuestStore((state) => state.setActiveTab);
    const addQuest = useQuestStore((state) => state.addQuest);
    const toggleQuest = useQuestStore((state) => state.toggleQuest);

    const playerStats = usePlayerStore((state) => state.playerStats);
    const isPlayerLoading = usePlayerStore((state) => state.isLoading);
    const initPlayer = usePlayerStore((state) => state.initPlayer);
    const applyXpChange = usePlayerStore((state) => state.applyXpChange);

    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                await initDatabase();

                await Promise.all([
                    initQuests(),
                    initPlayer(),
                ]);
            } catch (e) {
                console.error('Bootstrap error:', e);
            }
        };

        bootstrap();
    }, []);

    useEffect(() => {
        if (!isPlayerLoading && playerStats && !playerStats.isRegistered) {
            router.replace('/register');
        }
    }, [isPlayerLoading, playerStats]);

    const handleToggleQuest = async (id: string) => {
        const updated = await toggleQuest(id);
        if (updated) {
            const diff = updated.isCompleted ? updated.xpReward : -updated.xpReward;
            await applyXpChange(diff);
        }
    };

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

    if (isQuestsLoading || isPlayerLoading || !playerStats) {
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
                nickname={playerStats.nickname}
                playerClass={playerStats.playerClass}
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
                    <QuestCard quest={item} onToggle={handleToggleQuest} />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <SystemActionFAB onPress={() => setIsModalVisible(true)} />

            <CreateQuestModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={addQuest}
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