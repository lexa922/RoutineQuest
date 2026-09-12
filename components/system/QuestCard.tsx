import React from 'react';
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

export const QuestCard: React.FC<QuestProps> = ({ quest, onToggle, onDelete }) => {
    const checkScale = useSharedValue(quest.isCompleted ? 1 : 0);
    const cardOpacity = useSharedValue(quest.isCompleted ? 0.45 : 1);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const nextState = !quest.isCompleted;
        checkScale.value = withSpring(nextState ? 1 : 0);
        cardOpacity.value = withTiming(nextState ? 0.45 : 1, { duration: 200 });
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
            <Pressable onPress={handlePress} style={styles.cardContent}>
                <View style={styles.rhombusOutline}>
                    <Animated.View style={[styles.rhombusFill, animatedCheckStyle]} />
                </View>

                <View style={styles.centerBlock}>
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
                        numberOfLines={1}
                    >
                        {quest.title}
                    </Text>
                </View>

                <View style={styles.rewardBlock}>
                    <Text style={styles.rewardXp}>+{quest.xpReward}</Text>
                    <Text style={styles.rewardLabel}>XP</Text>
                </View>

                <Pressable
                    onPress={handleDelete}
                    hitSlop={8}
                    style={styles.deleteButton}
                >
                    <Text style={styles.deleteText}>✕</Text>
                </Pressable>
            </Pressable>
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
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    rhombusOutline: {
        width: 22,
        height: 22,
        borderWidth: 1.5,
        borderColor: Colors.neonBlue,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rhombusFill: {
        width: 14,
        height: 14,
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
    rewardBlock: {
        alignItems: 'flex-end',
        minWidth: 44,
        marginRight: 12,
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
    },
    deleteText: {
        color: Colors.textMuted,
        fontSize: 13,
        fontWeight: 'bold',
    },
});