import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';

interface PlayerStatusProps {
    level: number;
    rank: string;
    currentXp: number;
    maxXp: number;
    hpPercentage: number;
    streakDays: number;
    hasPenalty: boolean;
}

export const PlayerStatusHeader: React.FC<PlayerStatusProps> = ({
                                                                    level,
                                                                    rank,
                                                                    currentXp,
                                                                    maxXp,
                                                                    hpPercentage,
                                                                    streakDays,
                                                                    hasPenalty,
                                                                }) => {
    const xpWidth = useSharedValue(0);

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

    return (
        <View style={styles.headerWrapper}>
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

                <View style={styles.streakBadge}>
                    <Text style={styles.flameIcon}>▲</Text>
                    <Text style={styles.streakCount}>{streakDays}D</Text>
                </View>
            </View>

            {hasPenalty && (
                <View style={styles.penaltyAlert}>
                    <LinearGradient
                        colors={[Colors.crimsonGlow, 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.penaltyText}>
                        [УВАГА: АКТИВОВАНО ШТРАФНИЙ КВЕСТ]
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerWrapper: {
        paddingTop: 48,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: Colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderCard,
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
    streakBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
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
        marginTop: 12,
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
});