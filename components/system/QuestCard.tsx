import React, {useEffect} from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    useSharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { Quest } from '@/types/quest';

interface QuestProps {
    quest: Quest;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleSubQuest?: (questId: string, subQuestId: string) => void;
}

const getScheduleLabel = (quest: Quest): string | null => {
    if (quest.type === 'regular') {
        if (quest.repeatType === 'interval' && quest.repeatIntervalDays) {
            return `КОЖНІ ${quest.repeatIntervalDays} ДН.`;
        }
        if (quest.repeatType === 'weekdays' && quest.repeatWeekdays && quest.repeatWeekdays.length > 0) {
            const daysMap = ['', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'];
            return quest.repeatWeekdays.map((d) => daysMap[d]).join('.');
        }
    }
    return null;
};

export const QuestCard: React.FC<QuestProps> = ({ quest, onToggle, onDelete, onToggleSubQuest }) => {
    const checkScale = useSharedValue(quest.isCompleted ? 1 : 0);
    const cardOpacity = useSharedValue(quest.isCompleted ? 0.45 : 1);

    useEffect(() => {
        checkScale.value = withSpring(quest.isCompleted ? 1 : 0);
        cardOpacity.value = withTiming(quest.isCompleted ? 0.45 : 1, { duration: 200 });
    }, [quest.isCompleted]);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle(quest.id);
    };

    const handleDelete = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            '[ ДИРЕКТИВА: ВИДАЛЕННЯ ]',
            `Ви впевнені, що хочете остаточно ліквідувати квест "${quest.title}"?`,
            [
                { text: 'ВІДМІНА', style: 'cancel' },
                {
                    text: 'ЛІКВІДУВАТИ',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        onDelete(quest.id);
                    },
                },
            ]
        );
    };

    const animatedCheckStyle = useAnimatedStyle(() => ({
        transform: [{ scale: checkScale.value }],
        opacity: checkScale.value,
    }));

    const animatedCardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
    }));

    const scheduleLabel = getScheduleLabel(quest);

    return (
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
            <View style={styles.cardContent}>
                {/* Головний чекбокс */}
                <Pressable onPress={handlePress} style={styles.rhombusHitArea} hitSlop={6}>
                    <View style={styles.rhombusOutline}>
                        <Animated.View style={[styles.rhombusFill, animatedCheckStyle]} />
                    </View>
                </Pressable>

                {/* Центральна колонка */}
                <View style={styles.centerBlock}>
                    <Pressable onPress={handlePress}>
                        <View style={styles.tagRow}>
                            <Text style={[styles.categoryTag, styles[`tag_${quest.category}`]]}>
                                [{quest.category}]
                            </Text>
                            {scheduleLabel && (
                                <Text style={styles.cooldownText}>RESET: {scheduleLabel}</Text>
                            )}
                        </View>
                        <Text
                            style={[styles.questTitle, quest.isCompleted && styles.completedTitle]}
                            numberOfLines={2}
                        >
                            {quest.title}
                        </Text>
                    </Pressable>

                    {/* Підквести тепер знаходяться всередині вертикального потоку */}
                    {quest.subQuests && quest.subQuests.length > 0 && (
                        <View style={styles.subListContainer}>
                            {quest.subQuests.map((sub) => (
                                <Pressable
                                    key={sub.id}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        onToggleSubQuest?.(quest.id, sub.id);
                                    }}
                                    style={styles.subItemRow}
                                    hitSlop={4}
                                >
                                    <View style={[styles.subMiniBox, sub.isCompleted && styles.subMiniBoxDone]} />
                                    <Text
                                        style={[styles.subItemText, sub.isCompleted && styles.completedTitle]}
                                        numberOfLines={1}
                                    >
                                        {sub.title}
                                    </Text>
                                    <Text style={styles.subItemXp}>+{sub.xpReward} XP</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>

                {/* Блок XP */}
                <View style={styles.rewardBlock}>
                    <Text style={styles.rewardXp}>+{quest.xpReward}</Text>
                    <Text style={styles.rewardLabel}>XP</Text>
                </View>

                {/* Кнопка видалення */}
                <Pressable
                    onPress={handleDelete}
                    hitSlop={8}
                    style={styles.deleteButton}
                >
                    <Text style={styles.deleteText}>✕</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.bgCard,
        borderColor: Colors.borderCard,
        borderWidth: 1,
        marginVertical: 5,
        marginHorizontal: 16,
        borderRadius: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    rhombusHitArea: {
        marginRight: 14,
        paddingTop: 2,
    },
    rhombusOutline: {
        width: 20,
        height: 20,
        borderWidth: 1.5,
        borderColor: Colors.neonBlue,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
    },
    rhombusFill: {
        width: 12,
        height: 12,
        backgroundColor: Colors.neonBlue,
    },
    centerBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    categoryTag: {
        fontSize: 10,
        letterSpacing: 1.2,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    tag_STR: { color: Colors.crimsonRed },
    tag_INT: { color: Colors.neonBlue },
    tag_MND: { color: '#A78BFA' },
    cooldownText: {
        fontSize: 10,
        color: Colors.textMuted,
        fontFamily: 'monospace',
    },
    questTitle: {
        color: Colors.textWhite,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    completedTitle: {
        textDecorationLine: 'line-through',
        color: Colors.textMuted,
    },
    subListContainer: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(30, 38, 56, 0.6)',
        gap: 6,
    },
    subItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 2,
    },
    subMiniBox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: Colors.neonBlue,
    },
    subMiniBoxDone: {
        backgroundColor: Colors.neonBlue,
    },
    subItemText: {
        flex: 1,
        color: Colors.textMuted,
        fontSize: 11,
        fontFamily: 'monospace',
    },
    subItemXp: {
        color: Colors.amberWarning,
        fontSize: 9,
        fontFamily: 'monospace',
    },
    rewardBlock: {
        alignItems: 'flex-end',
        minWidth: 44,
        marginLeft: 8,
        marginRight: 10,
        paddingTop: 2,
    },
    rewardXp: {
        color: Colors.neonBlue,
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    rewardLabel: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
    },
    deleteButton: {
        padding: 6,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(30, 38, 56, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2,
    },
    deleteText: {
        color: Colors.textMuted,
        fontSize: 13,
        fontWeight: 'bold',
    },
});