import React, {useEffect, useState, useMemo, useRef} from 'react';
import { View, FlatList, StyleSheet, StatusBar, ActivityIndicator, AppState, AppStateStatus, Alert, Text} from 'react-native';
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

import {checkAndResetDailiesDB, initDatabase} from '@/db/client';

export default function HomeScreen() {
    const router = useRouter();
    const [isAppReady, setIsAppReady] = useState(false);
    const appState = useRef(AppState.currentState);

    const quests = useQuestStore((state) => state.quests);
    const activeTab = useQuestStore((state) => state.activeTab);
    const isQuestsLoading = useQuestStore((state) => state.isLoading);
    const initQuests = useQuestStore((state) => state.initQuests);
    const setActiveTab = useQuestStore((state) => state.setActiveTab);
    const addQuest = useQuestStore((state) => state.addQuest);
    const toggleQuest = useQuestStore((state) => state.toggleQuest);
    const deleteQuest = useQuestStore((state) => state.deleteQuest);
    const toggleSubQuest = useQuestStore((state) => state.toggleSubQuest);

    const playerStats = usePlayerStore((state) => state.playerStats);
    const isPlayerLoading = usePlayerStore((state) => state.isLoading);
    const initPlayer = usePlayerStore((state) => state.initPlayer);
    const applyXpChange = usePlayerStore((state) => state.applyXpChange);
    const clearPenalty = usePlayerStore((state) => state.clearPenalty);

    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        if (!isPlayerLoading && isAppReady) {
            if (!playerStats || !playerStats.isRegistered) {
                router.replace('/register');
            }
        }
    }, [isPlayerLoading, isAppReady, playerStats]);

    const syncSystemData = async () => {
        try {
            await checkAndResetDailiesDB();
            await initPlayer();
            await initQuests();
        } catch (error) {
            console.error('[SYSTEM SYNC ERROR]:', error);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const bootstrapApp = async () => {
            try {
                await initDatabase();
                await syncSystemData();
            } catch (e) {
                console.error('[BOOTSTRAP ERROR]:', e);
            } finally {
                if (isMounted) {
                    setIsAppReady(true);
                }
            }
        };

        bootstrapApp();

        const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                await syncSystemData();
            }
            appState.current = nextAppState;
        });

        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, []);

    const handleToggleQuest = async (id: string) => {
        const result = await toggleQuest(id);
        if (result && result.xpDiff !== 0) {
            await applyXpChange(result.xpDiff);
        }
    };

    const handleToggleSubQuest = async (questId: string, subQuestId: string) => {
        const result = await toggleSubQuest(questId, subQuestId);
        if (result) {
            await applyXpChange(result.xpDiff);
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

    if (!isAppReady || isQuestsLoading || isPlayerLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.neonBlue} />
            </View>
        );
    }

    if (!playerStats) {
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
                        onToggleSubQuest={handleToggleSubQuest}
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>[ АКТИВНИХ ДИРЕКТИВ НЕ ВИЯВЛЕНО ]</Text>
                        <Text style={styles.emptySubtitle}>
                            Створіть завдання кнопкою «+» нижче для початку прогресії.
                        </Text>
                    </View>
                )}
                contentContainerStyle={[
                    styles.listContent,
                    filteredQuests.length === 0 && styles.emptyListContent,
                ]}
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
    loadingContainer: {
        flex: 1,
        backgroundColor: '#05070A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    emptyTitle: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },
});