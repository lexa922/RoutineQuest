import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Modal } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';

interface PromotionModalProps {
    visible: boolean;
    newLevel: number;
    rank: string;
    oldRank?: string;
    isRankUp?: boolean;
    onClose: () => void;
}

export const LevelUpModal: React.FC<PromotionModalProps> = ({
                                                                visible,
                                                                newLevel,
                                                                rank,
                                                                oldRank,
                                                                isRankUp = false,
                                                                onClose,
                                                            }) => {
    const scanScaleX = useSharedValue(0.05);
    const scanScaleY = useSharedValue(0.02);
    const hudOpacity = useSharedValue(0);
    const glitchOffset = useSharedValue(0);

    const accentColor = isRankUp ? Colors.amberWarning : Colors.neonBlue;

    useEffect(() => {
        if (visible) {
            if (isRankUp) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
                setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 350);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            hudOpacity.value = withTiming(1, { duration: 60 });
            scanScaleX.value = withTiming(1, { duration: 150 });
            scanScaleY.value = withDelay(130, withTiming(1, { duration: 180 }));

            glitchOffset.value = withDelay(
                300,
                isRankUp
                    ? withSequence(
                        withTiming(-16, { duration: 35 }),
                        withTiming(14, { duration: 35 }),
                        withTiming(-10, { duration: 30 }),
                        withTiming(8, { duration: 30 }),
                        withTiming(-4, { duration: 25 }),
                        withTiming(0, { duration: 30 })
                    )
                    : withSequence(
                        withTiming(-8, { duration: 40 }),
                        withTiming(8, { duration: 40 }),
                        withTiming(-4, { duration: 30 }),
                        withTiming(0, { duration: 40 })
                    )
            );
        } else {
            scanScaleX.value = 0.05;
            scanScaleY.value = 0.02;
            hudOpacity.value = 0;
            glitchOffset.value = 0;
        }
    }, [visible, isRankUp]);

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        scanScaleY.value = withTiming(0.02, { duration: 100 });
        hudOpacity.value = withDelay(80, withTiming(0, { duration: 60 }, () => {
            runOnJS(onClose)();
        }));
    };

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: hudOpacity.value,
        transform: [
            { scaleX: scanScaleX.value },
            { scaleY: scanScaleY.value },
            { translateX: glitchOffset.value },
        ],
    }));

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.backdrop}>
                <Animated.View
                    style={[
                        styles.modalBox,
                        { borderColor: accentColor, shadowColor: accentColor },
                        animatedContainerStyle,
                    ]}
                >
                    <View style={styles.badgeHeader}>
                        <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
                        <Text style={[styles.systemTag, { color: accentColor }]}>
                            {isRankUp ? 'CRITICAL SYSTEM PROMOTION' : 'SYSTEM NOTIFICATION'}
                        </Text>
                    </View>

                    <Text style={styles.title}>
                        {isRankUp ? 'РАНГ ПІДВИЩЕНО' : 'РІВЕНЬ ПІДВИЩЕНО'}
                    </Text>

                    <View style={[styles.divider, { backgroundColor: isRankUp ? 'rgba(255, 170, 0, 0.3)' : 'rgba(0, 240, 255, 0.3)' }]} />

                    {isRankUp ? (
                        <View style={styles.rankUpContainer}>
                            <Text style={styles.rankSub}>КАТЕГОРІЯ МИСЛИВЦЯ ОНОВЛЕНА</Text>
                            <View style={styles.rankTransitionRow}>
                                <Text style={styles.oldRankText}>{oldRank || 'E-Rank'}</Text>
                                <Text style={[styles.arrowText, { color: accentColor }]}>▶▶▶</Text>
                                <Text style={[styles.newRankText, { color: accentColor }]}>{rank}</Text>
                            </View>
                            <Text style={styles.levelNotice}>[ СИНХРОНІЗОВАНО З LVL. {newLevel} ]</Text>
                        </View>
                    ) : (
                        <View style={styles.levelContainer}>
                            <Text style={styles.levelLabel}>ПОТОЧНИЙ РІВЕНЬ</Text>
                            <Text style={[styles.levelNumber, { color: accentColor }]}>LVL. {newLevel}</Text>
                            <View style={styles.rankRow}>
                                <Text style={styles.rankLabel}>СТАТУС РАНГУ:</Text>
                                <Text style={[styles.rankValue, { color: Colors.neonBlue }]}>[{rank}]</Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.subtext}>
                        {isRankUp
                            ? 'Авторитет мисливця в Системі зріс. Доступ до нових протоколів та максимальну витривалість відновлено.'
                            : 'Всі характеристики гравця оновлено. Отримано повне відновлення витривалості (HP).'}
                    </Text>

                    <Pressable
                        style={[
                            styles.confirmBtn,
                            {
                                borderColor: accentColor,
                                backgroundColor: isRankUp ? 'rgba(255, 170, 0, 0.12)' : Colors.neonBlueDim,
                            },
                        ]}
                        onPress={handleConfirm}
                    >
                        <Text style={[styles.confirmText, { color: accentColor }]}>
                            {isRankUp ? '[ ПРИЙНЯТИ НОВИЙ РАНГ ]' : '[ ПРИЙНЯТИ ЗМІНИ ]'}
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(2, 4, 7, 0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalBox: {
        width: '100%',
        backgroundColor: '#070A10',
        borderWidth: 1.5,
        borderLeftWidth: 4,
        padding: 24,
        borderRadius: 0,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 18,
        elevation: 22,
    },
    badgeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 10,
    },
    statusDot: {
        width: 6,
        height: 6,
    },
    systemTag: {
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: '800',
    },
    title: {
        color: Colors.textWhite,
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: 1.5,
        fontFamily: 'monospace',
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    levelContainer: {
        alignItems: 'center',
        marginVertical: 8,
    },
    levelLabel: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 1.5,
    },
    levelNumber: {
        fontSize: 40,
        fontWeight: '900',
        fontFamily: 'monospace',
        letterSpacing: 2,
        marginVertical: 2,
    },
    rankRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    rankLabel: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 11,
    },
    rankValue: {
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '800',
    },
    rankUpContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },
    rankSub: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    rankTransitionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    oldRankText: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 18,
        textDecorationLine: 'line-through',
    },
    arrowText: {
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: '900',
    },
    newRankText: {
        fontFamily: 'monospace',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 1.2,
    },
    levelNotice: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 10,
        marginTop: 8,
    },
    subtext: {
        color: Colors.textMuted,
        fontSize: 11,
        fontFamily: 'monospace',
        textAlign: 'center',
        lineHeight: 16,
        marginVertical: 16,
    },
    confirmBtn: {
        borderWidth: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 0,
    },
    confirmText: {
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});