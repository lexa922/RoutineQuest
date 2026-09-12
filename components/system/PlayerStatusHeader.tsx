import React, { useEffect } from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    interpolateColor,
    Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';

interface PlayerStatusProps {
    nickname: string;
    playerClass: string;
    level: number;
    rank: string;
    currentXp: number;
    maxXp: number;
    hpPercentage: number;
    streakDays: number;
    hasPenalty: boolean;
    onResolvePenalty?: () => void;
}

export const PlayerStatusHeader: React.FC<PlayerStatusProps> = ({
    nickname,
    playerClass,
    level,
    rank,
    currentXp,
    maxXp,
    hpPercentage,
    streakDays,
    hasPenalty,
    onResolvePenalty,
    }) => {
    const xpWidth = useSharedValue(0);

    const prevStreak = React.useRef<number | null>(null);
    const flashAnim = useSharedValue(0);
    const streakGlow = useSharedValue(0);

    useEffect(() => {
        const targetWidth = Math.min((currentXp / maxXp) * 100, 100);
        xpWidth.value = withTiming(targetWidth, {
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [currentXp, maxXp]);

    const animatedXpStyle = useAnimatedStyle(() => ({
        width: `${xpWidth.value}%`,
    }));

    const animatedStreakBackground = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            flashAnim.value,
            [0, 1],
            ['rgba(18, 22, 34, 0.8)', 'rgba(255, 170, 0, 0.28)']
        );

        const borderColor = interpolateColor(
            flashAnim.value,
            [0, 1],
            [Colors.borderCard, Colors.amberWarning]
        );

        return {
            backgroundColor,
            borderColor,
        };
    });

    useEffect(() => {
        if (streakDays > 0) {
            flashAnim.value = withSequence(
                withTiming(1, { duration: 150 }),
                withTiming(0, { duration: 350 })
            );
        }
    }, [streakDays]);

    const animatedGlowTextStyle = useAnimatedStyle(() => ({
        color: streakGlow.value > 0.5 ? '#00FFFF' : Colors.amberWarning,
    }));

    return (
        <View style={styles.headerWrapper}>
            <View style={styles.identityRow}>
                <View style={styles.callsignBlock}>
                    <Text style={styles.callsignPrefix}>OPERATOR // </Text>
                    <Text style={styles.nicknameText}>{nickname.toUpperCase()}</Text>
                </View>
                <Text style={styles.classBadge}>[{playerClass.toUpperCase()}]</Text>
            </View>

            <View style={styles.topRow}>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>[{rank}]</Text>
                    <Text style={styles.levelText}>LVL {level}</Text>
                </View>

                <View style={styles.barsContainer}>
                    <View style={styles.barBlock}>
                        <View style={styles.barLabelRow}>
                            <Text style={styles.barLabel}>DISCIPLINE (HP)</Text>
                            <Text style={styles.barValue}>{hpPercentage}%</Text>
                        </View>
                        <View style={styles.barTrack}>
                            <View
                                style={[
                                    styles.hpFill,
                                    { width: `${hpPercentage}%` }
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.barBlock}>
                        <View style={styles.barLabelRow}>
                            <Text style={[styles.barLabel, { color: Colors.neonBlue }]}>
                                SYSTEM SYNC (XP)
                            </Text>
                            <Text style={styles.barValue}>
                                {currentXp} / {maxXp}
                            </Text>
                        </View>
                        <View style={styles.barTrack}>
                            <Animated.View style={[styles.xpFill, animatedXpStyle]} />
                        </View>
                    </View>
                </View>

                <View style={styles.streakContainer}>
                    <Text style={styles.streakLabel}>STREAK:</Text>
                    <Animated.View style={[styles.streakBadge, animatedStreakBackground]}>
                        <Text style={styles.streakIcon}>🔥</Text>
                        <Text style={styles.streakValue}>{streakDays} D</Text>
                    </Animated.View>
                </View>
            </View>

            {hasPenalty && (
                <Pressable
                    style={styles.penaltyAlert}
                    onPress={onResolvePenalty}
                >
                    <LinearGradient
                        colors={[Colors.crimsonGlow, 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.penaltyContent}>
                        <Text style={styles.penaltyText}>
                            [УВАГА: АКТИВОВАНО ШТРАФНИЙ КВЕСТ]
                        </Text>
                        <Text style={styles.penaltyAction}>
                            ВИКОНАТИ СПОКУТУ ▶
                        </Text>
                    </View>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerWrapper: {
        paddingTop: 46,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: Colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderCard,
    },
    identityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(30, 38, 56, 0.5)',
    },
    callsignBlock: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    callsignPrefix: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    nicknameText: {
        color: Colors.textWhite,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    classBadge: {
        color: Colors.neonBlue,
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rankBadge: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        backgroundColor: Colors.neonBlueDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        color: Colors.neonBlue,
        fontSize: 12,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    levelText: {
        color: Colors.textWhite,
        fontSize: 10,
        fontFamily: 'monospace',
        marginTop: 2,
    },
    barsContainer: {
        flex: 1,
        gap: 6,
    },
    barBlock: {
        gap: 2,
    },
    barLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    barLabel: {
        color: Colors.crimsonRed,
        fontSize: 8,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    barValue: {
        color: Colors.textMuted,
        fontSize: 8,
        fontFamily: 'monospace',
    },
    barTrack: {
        height: 5,
        backgroundColor: '#161B26',
        borderRadius: 1,
        overflow: 'hidden',
    },
    hpFill: {
        height: '100%',
        backgroundColor: Colors.crimsonRed,
    },
    xpFill: {
        height: '100%',
        backgroundColor: Colors.neonBlue,
    },
    flameIcon: {
        color: Colors.amberWarning,
        fontSize: 14,
        marginBottom: 2,
    },
    streakCount: {
        color: Colors.amberWarning,
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    penaltyAlert: {
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderLeftWidth: 3,
        borderLeftColor: Colors.crimsonRed,
        backgroundColor: 'rgba(255, 42, 85, 0.08)',
        overflow: 'hidden',
    },
    penaltyText: {
        color: Colors.crimsonRed,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1.1,
    },
    penaltyContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    penaltyAction: {
        color: Colors.crimsonRed,
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '800',
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    streakLabel: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderRadius: 2,
        minWidth: 54,
        justifyContent: 'center',
    },
    streakIcon: {
        fontSize: 12,
    },
    streakValue: {
        color: Colors.amberWarning,
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    streakUnit: {
        color: Colors.amberWarning,
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
});