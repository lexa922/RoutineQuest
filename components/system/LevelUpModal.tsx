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

interface LevelUpModalProps {
    visible: boolean;
    newLevel: number;
    rank: string;
    onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
                                                              visible,
                                                              newLevel,
                                                              rank,
                                                              onClose,
                                                          }) => {
    const scanScaleX = useSharedValue(0.05);
    const scanScaleY = useSharedValue(0.02);
    const hudOpacity = useSharedValue(0);
    const glitchOffset = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            hudOpacity.value = withTiming(1, { duration: 80 });

            scanScaleX.value = withTiming(1, { duration: 160 });

            scanScaleY.value = withDelay(140, withTiming(1, { duration: 180 }));

            glitchOffset.value = withDelay(
                320,
                withSequence(
                    withTiming(-8, { duration: 40 }),
                    withTiming(8, { duration: 40 }),
                    withTiming(-4, { duration: 30 }),
                    withTiming(3, { duration: 30 }),
                    withTiming(0, { duration: 40 })
                )
            );
        } else {
            scanScaleX.value = 0.05;
            scanScaleY.value = 0.02;
            hudOpacity.value = 0;
            glitchOffset.value = 0;
        }
    }, [visible]);

    const handleConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        scanScaleY.value = withTiming(0.02, { duration: 120 });
        hudOpacity.value = withDelay(100, withTiming(0, { duration: 80 }, () => {
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
                <Animated.View style={[styles.modalBox, animatedContainerStyle]}>
                    <View style={styles.badgeHeader}>
                        <View style={styles.statusDot} />
                        <Text style={styles.systemTag}>SYSTEM NOTIFICATION</Text>
                    </View>

                    <Text style={styles.title}>РІВЕНЬ ПІДВИЩЕНО</Text>
                    <View style={styles.divider} />

                    <View style={styles.levelContainer}>
                        <Text style={styles.levelLabel}>ПОТОЧНИЙ РІВЕНЬ</Text>
                        <Text style={styles.levelNumber}>LVL. {newLevel}</Text>
                    </View>

                    <View style={styles.rankRow}>
                        <Text style={styles.rankLabel}>СТАТУС РАНГУ:</Text>
                        <Text style={styles.rankValue}>[{rank}]</Text>
                    </View>

                    <Text style={styles.subtext}>
                        Всі характеристики гравця оновлено. Отримано повне відновлення витривалості (HP).
                    </Text>

                    <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                        <Text style={styles.confirmText}>[ ПРИЙНЯТИ ЗМІНИ ]</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(3, 5, 8, 0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalBox: {
        width: '100%',
        backgroundColor: '#070A10',
        borderWidth: 1.5,
        borderColor: Colors.neonBlue,
        padding: 24,
        borderRadius: 0,
        borderLeftWidth: 4,
        shadowColor: Colors.neonBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: 14,
        elevation: 20,
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
        backgroundColor: Colors.neonBlue,
    },
    systemTag: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 11,
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
        backgroundColor: 'rgba(0, 240, 255, 0.25)',
        marginVertical: 14,
    },
    levelContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    levelLabel: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        letterSpacing: 1.5,
    },
    levelNumber: {
        color: Colors.amberWarning,
        fontSize: 42,
        fontWeight: '900',
        fontFamily: 'monospace',
        letterSpacing: 2,
        marginVertical: 4,
    },
    rankRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    rankLabel: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 11,
    },
    rankValue: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '800',
    },
    subtext: {
        color: Colors.textMuted,
        fontSize: 11,
        fontFamily: 'monospace',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 20,
    },
    confirmBtn: {
        backgroundColor: Colors.neonBlueDim,
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 2,
    },
    confirmText: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});