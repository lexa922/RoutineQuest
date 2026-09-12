import React, {useEffect, useState, useMemo} from 'react';
import { View, FlatList, StyleSheet, StatusBar, ActivityIndicator, AppState, AppStateStatus, Alert} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { PlayerStatusHeader } from '@/components/system/PlayerStatusHeader';
import { QuestCard } from '@/components/system/QuestCard';
import { QuestFilterTabs } from '@/components/system/QuestFilterTabs';
import { SystemActionFAB } from '@/components/system/SystemActionFAB';
import { CreateQuestModal} from '@/components/system/CreateQuestModal';
import * as Haptics from 'expo-haptics';

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
    const deleteQuest = useQuestStore((state) => state.deleteQuest);

    const playerStats = usePlayerStore((state) => state.playerStats);
    const isPlayerLoading = usePlayerStore((state) => state.isLoading);
    const initPlayer = usePlayerStore((state) => state.initPlayer);
    const applyXpChange = usePlayerStore((state) => state.applyXpChange);
    const clearPenalty = usePlayerStore((state) => state.clearPenalty);

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

    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                await initQuests();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

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

    const handleResolvePenalty = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            '[ СИСТЕМНЕ ПОКАРАННЯ ]',
            'Пропущено щоденні обов\'язки. Для зняття штрафу та відновлення HP виконайте:\n\n• 50 відтискань або 30 хв глибокої концентрації без телефона.',
            [
                { text: 'ВІДКЛАСТИ', style: 'cancel' },
                {
                    text: 'ШТРАФ ВИКОНАНО',
                    style: 'default',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        await clearPenalty();
                    },
                },
            ]
        );
    };

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
                onResolvePenalty={handleResolvePenalty}
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
                    <QuestCard
                        quest={item}
                        onToggle={handleToggleQuest}
                        onDelete={deleteQuest}
                    />
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