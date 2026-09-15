import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { LootResult, ItemRarity } from '@/types/loot';

interface SystemChestModalProps {
    visible: boolean;
    loot: LootResult | null;
    onClose: () => void;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
    common: '#94A3B8',
    uncommon: '#22C55E',
    rare: '#00F0FF',
    epic: '#A855F7',
    legendary: '#F59E0B',
};

export const SystemChestModal: React.FC<SystemChestModalProps> = ({
    visible,
    loot,
    onClose,
}) => {
    const [isOpened, setIsOpened] = useState(false);

    const cubeScale = useSharedValue(0.8);
    const cubeRotate = useSharedValue(0);
    const cubeShake = useSharedValue(0);
    const crackGlow = useSharedValue(0);

    const hudScaleX = useSharedValue(0.05);
    const hudScaleY = useSharedValue(0.02);
    const hudOpacity = useSharedValue(0);
    const glitchOffset = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            setIsOpened(false);
            crackGlow.value = 0;
            cubeRotate.value = 0;
            hudOpacity.value = 0;
            hudScaleX.value = 0.05;
            hudScaleY.value = 0.02;
            glitchOffset.value = 0;

            cubeScale.value = withSpring(1, { damping: 14 });
            cubeRotate.value = withRepeat(
                withSequence(
                    withTiming(4, { duration: 1500 }),
                    withTiming(-4, { duration: 1500 })
                ),
                -1,
                true
            );
        }
    }, [visible]);

    useEffect(() => {
        if (isOpened) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            hudOpacity.value = withTiming(1, { duration: 60 });
            hudScaleX.value = withTiming(1, { duration: 150 });
            hudScaleY.value = withDelay(130, withTiming(1, { duration: 180 }));

            const isHighTier =
                loot?.item && (loot.item.rarity === 'epic' || loot.item.rarity === 'legendary');

            glitchOffset.value = withDelay(
                300,
                isHighTier
                    ? withSequence(
                        withTiming(-14, { duration: 35 }),
                        withTiming(14, { duration: 35 }),
                        withTiming(-8, { duration: 30 }),
                        withTiming(8, { duration: 30 }),
                        withTiming(-3, { duration: 25 }),
                        withTiming(0, { duration: 30 })
                    )
                    : withSequence(
                        withTiming(-8, { duration: 40 }),
                        withTiming(8, { duration: 40 }),
                        withTiming(-4, { duration: 30 }),
                        withTiming(0, { duration: 40 })
                    )
            );
        }
    }, [isOpened]);

    const handleOpenChest = () => {
        if (isOpened || !loot) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        cubeShake.value = withSequence(
            withTiming(-12, { duration: 40 }),
            withTiming(12, { duration: 40 }),
            withTiming(-8, { duration: 35 }),
            withTiming(8, { duration: 35 }),
            withTiming(-4, { duration: 30 }),
            withTiming(0, { duration: 30 })
        );

        crackGlow.value = withTiming(1, { duration: 250 });

        setTimeout(() => {
            setIsOpened(true);
        }, 250);
    };

    const handleCloseReward = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        hudScaleY.value = withTiming(0.02, { duration: 160 });
        hudScaleX.value = withDelay(100, withTiming(0.05, { duration: 120 }));
        hudOpacity.value = withDelay(140, withTiming(0, { duration: 100 }));

        setTimeout(() => {
            onClose();
        }, 250);
    };

    const animatedCubeStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: cubeScale.value },
            { rotateZ: `${cubeRotate.value}deg` },
            { translateX: cubeShake.value },
        ],
    }));

    const animatedGlowStyle = useAnimatedStyle(() => ({
        opacity: crackGlow.value,
    }));

    const animatedRewardStyle = useAnimatedStyle(() => ({
        opacity: hudOpacity.value,
        transform: [
            { scaleX: hudScaleX.value },
            { scaleY: hudScaleY.value },
            { translateX: glitchOffset.value },
        ],
    }));

    if (!visible || !loot) return null;

    const accentColor = loot.item
        ? RARITY_COLORS[loot.item.rarity]
        : Colors.neonBlue;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.backdrop}>
                {!isOpened ? (
                    <View style={styles.cubeStage}>
                        <Text style={styles.directiveLabel}>
                            [ СИСТЕМНИЙ КОНТЕЙНЕР НАГОРОДИ ]
                        </Text>
                        <Text style={styles.chestTypeSubtitle}>
                            {loot.chestType === 'boss' ? 'CRITICAL BOSS CACHE' : 'DAILY DIRECTIVE REWARD'}
                        </Text>

                        <Pressable onPress={handleOpenChest} style={styles.cubeHitArea}>
                            <Animated.View style={[styles.monolithCube, animatedCubeStyle]}>
                                <View style={styles.cubeInnerCore}>
                                    <Text style={styles.cubeRuneSymbol}>◈</Text>
                                </View>
                                <Animated.View
                                    style={[
                                        styles.crackGlowOverlay,
                                        { backgroundColor: accentColor },
                                        animatedGlowStyle,
                                    ]}
                                />
                            </Animated.View>
                        </Pressable>

                        <Text style={styles.hintTap}>ТОРКНІТЬСЯ ДЛЯ РОЗКОЛУ ПЕЧАТКИ</Text>
                    </View>
                ) : (
                    <Animated.View
                        style={[
                            styles.rewardCard,
                            { borderColor: accentColor, shadowColor: accentColor },
                            animatedRewardStyle,
                        ]}
                    >
                        <View style={styles.rewardHeader}>
                            <View style={[styles.glowDot, { backgroundColor: accentColor }]} />
                            <Text style={[styles.rewardTag, { color: accentColor }]}>
                                SYSTEM PROTOCOL // DECRYPTED
                            </Text>
                        </View>

                        <Text style={styles.rewardMainTitle}>
                            {loot.item && (loot.item.rarity === 'epic' || loot.item.rarity === 'legendary')
                                ? 'АРТЕФАКТ ВИЯВЛЕНО'
                                : 'НАГОРОДА ОТРИМАНА'}
                        </Text>
                        <View style={[styles.separator, { backgroundColor: `${accentColor}40` }]} />

                        <View style={styles.manaRow}>
                            <Text style={styles.manaIcon}>💎</Text>
                            <View>
                                <Text style={[styles.manaAmount, { color: accentColor }]}>
                                    +{loot.manaCrystals}
                                </Text>
                                <Text style={styles.manaLabel}>КРИСТАЛИ МАНИ</Text>
                            </View>
                        </View>

                        {loot.item ? (
                            <View style={[styles.itemContainer, { borderColor: accentColor }]}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemEmoji}>{loot.item.icon}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemRarityTag, { color: accentColor }]}>
                                            [{loot.item.rarity.toUpperCase()}]
                                        </Text>
                                        <Text style={styles.itemName} numberOfLines={1}>
                                            {loot.item.name}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.itemDesc}>{loot.item.description}</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyItemContainer}>
                                <Text style={styles.emptyItemText}>
                                    // ДОДАТКОВИХ АРТЕФАКТІВ НЕ ВИЯВЛЕНО
                                </Text>
                            </View>
                        )}

                        <Pressable
                            style={[
                                styles.claimBtn,
                                {
                                    borderColor: accentColor,
                                    backgroundColor: `${accentColor}1A`,
                                },
                            ]}
                            onPress={handleCloseReward}
                        >
                            <Text style={[styles.claimBtnText, { color: accentColor }]}>
                                [ ДОДАТИ ДО ІНВЕНТАРЮ ]
                            </Text>
                        </Pressable>
                    </Animated.View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(2, 4, 8, 0.94)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    cubeStage: {
        alignItems: 'center',
    },
    directiveLabel: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    chestTypeSubtitle: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: 1,
        marginTop: 4,
        marginBottom: 40,
    },
    cubeHitArea: {
        padding: 20,
    },
    monolithCube: {
        width: 140,
        height: 140,
        backgroundColor: '#090D16',
        borderWidth: 2,
        borderColor: Colors.neonBlue,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.neonBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 20,
        elevation: 20,
        overflow: 'hidden',
    },
    cubeInnerCore: {
        width: 60,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cubeRuneSymbol: {
        color: Colors.neonBlue,
        fontSize: 28,
    },
    crackGlowOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    hintTap: {
        marginTop: 50,
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 11,
        letterSpacing: 1.2,
    },
    rewardCard: {
        width: '100%',
        backgroundColor: '#070A10',
        borderWidth: 1.5,
        borderLeftWidth: 4,
        borderRadius: 0,
        padding: 24,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 16,
        elevation: 22,
    },
    rewardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
    },
    glowDot: {
        width: 6,
        height: 6,
    },
    rewardTag: {
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    rewardMainTitle: {
        color: Colors.textWhite,
        fontSize: 20,
        fontWeight: '900',
        fontFamily: 'monospace',
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    separator: {
        height: 1,
        marginVertical: 14,
    },
    manaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(18, 22, 34, 0.6)',
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.2)',
        marginBottom: 12,
    },
    manaIcon: {
        fontSize: 24,
    },
    manaAmount: {
        fontSize: 18,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    manaLabel: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: 1,
    },
    itemContainer: {
        backgroundColor: 'rgba(18, 22, 34, 0.8)',
        borderWidth: 1,
        padding: 12,
        marginBottom: 20,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    itemEmoji: {
        fontSize: 26,
    },
    itemRarityTag: {
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '800',
        letterSpacing: 1,
    },
    itemName: {
        color: Colors.textWhite,
        fontSize: 14,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    itemDesc: {
        color: Colors.textMuted,
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 16,
    },
    emptyItemContainer: {
        padding: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyItemText: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
    },
    claimBtn: {
        borderWidth: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    claimBtnText: {
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});