import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { InventoryItem, ItemRarity } from '@/types/loot';

interface InventoryModalProps {
    visible: boolean;
    manaCrystals: number;
    items: InventoryItem[];
    onClose: () => void;
    onUseItem?: (item: InventoryItem) => void;
}

const RARITY_COLORS: Record<ItemRarity, string> = {
    common: '#94A3B8',
    uncommon: '#22C55E',
    rare: '#00F0FF',
    epic: '#A855F7',
    legendary: '#F59E0B',
};

const TOTAL_SLOTS = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SLOT_SIZE = (SCREEN_WIDTH - 48 - 24) / 4;

export const InventoryModal: React.FC<InventoryModalProps> = ({
   visible,
   manaCrystals,
   items,
   onClose,
   onUseItem,
}) => {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const hudScaleX = useSharedValue(0.05);
    const hudScaleY = useSharedValue(0.02);
    const hudOpacity = useSharedValue(0);
    const glitchOffset = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            setSelectedItem(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            hudOpacity.value = withTiming(1, { duration: 60 });
            hudScaleX.value = withTiming(1, { duration: 150 });
            hudScaleY.value = withDelay(130, withTiming(1, { duration: 180 }));

            glitchOffset.value = withDelay(
                300,
                withSequence(
                    withTiming(-8, { duration: 40 }),
                    withTiming(8, { duration: 40 }),
                    withTiming(-4, { duration: 30 }),
                    withTiming(0, { duration: 40 })
                )
            );
        } else {
            hudScaleX.value = 0.05;
            hudScaleY.value = 0.02;
            hudOpacity.value = 0;
            glitchOffset.value = 0;
        }
    }, [visible]);

    const handleCloseTerminal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        hudScaleY.value = withTiming(0.02, { duration: 160 });
        hudScaleX.value = withDelay(100, withTiming(0.05, { duration: 120 }));
        hudOpacity.value = withDelay(140, withTiming(0, { duration: 100 }));

        setTimeout(() => {
            onClose();
        }, 240);
    };

    const handleSelectSlot = (item: InventoryItem | null) => {
        Haptics.selectionAsync();
        setSelectedItem(item);
    };

    const handleUseItem = () => {
        if (!selectedItem || !onUseItem) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onUseItem(selectedItem);
        setSelectedItem(null);
    };

    const animatedTerminalStyle = useAnimatedStyle(() => ({
        opacity: hudOpacity.value,
        transform: [
            { scaleX: hudScaleX.value },
            { scaleY: hudScaleY.value },
            { translateX: glitchOffset.value },
        ],
    }));

    if (!visible) return null;

    const gridSlots = Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
        return items[index] || null;
    });

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.backdrop}>
                <Animated.View style={[styles.terminalContainer, animatedTerminalStyle]}>
                    <View style={styles.headerRow}>
                        <View style={styles.titleWrapper}>
                            <View style={styles.statusDot} />
                            <Text style={styles.headerTag}>SYSTEM // HUNTER VAULT</Text>
                        </View>
                        <Pressable onPress={handleCloseTerminal} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>[✕]</Text>
                        </Pressable>
                    </View>

                    <View style={styles.currencyBar}>
                        <View style={styles.manaRow}>
                            <Text style={styles.manaIcon}>💎</Text>
                            <Text style={styles.manaValue}>{manaCrystals}</Text>
                            <Text style={styles.manaUnit}>КРИСТАЛІВ МАНИ</Text>
                        </View>
                        <Text style={styles.capacityLabel}>
                            {items.length}/{TOTAL_SLOTS} SLOTS
                        </Text>
                    </View>

                    <View style={styles.gridContainer}>
                        {gridSlots.map((item, idx) => {
                            const isSelected = selectedItem && item && selectedItem.id === item.id;
                            const rarityColor = item ? RARITY_COLORS[item.rarity] : 'transparent';

                            return (
                                <Pressable
                                    key={idx}
                                    style={[
                                        styles.slotBox,
                                        item ? { borderColor: rarityColor } : styles.slotEmpty,
                                        isSelected && styles.slotSelected,
                                    ]}
                                    onPress={() => handleSelectSlot(item)}
                                >
                                    {item ? (
                                        <>
                                            <Text style={styles.itemEmoji}>{item.icon}</Text>
                                            {item.quantity > 1 && (
                                                <View style={styles.qtyBadge}>
                                                    <Text style={styles.qtyText}>x{item.quantity}</Text>
                                                </View>
                                            )}
                                        </>
                                    ) : (
                                        <Text style={styles.emptySlotRune}>+</Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.inspectPanel}>
                        {selectedItem ? (
                            <View style={styles.inspectContent}>
                                <View style={styles.inspectHeader}>
                                    <Text
                                        style={[
                                            styles.inspectRarity,
                                            { color: RARITY_COLORS[selectedItem.rarity] },
                                        ]}
                                    >
                                        [{selectedItem.rarity.toUpperCase()}]
                                    </Text>
                                    <Text style={styles.inspectName} numberOfLines={1}>
                                        {selectedItem.name}
                                    </Text>
                                </View>
                                <Text style={styles.inspectDesc}>{selectedItem.description}</Text>

                                <Pressable
                                    style={[
                                        styles.actionBtn,
                                        { borderColor: RARITY_COLORS[selectedItem.rarity] },
                                    ]}
                                    onPress={handleUseItem}
                                >
                                    <Text
                                        style={[
                                            styles.actionBtnText,
                                            { color: RARITY_COLORS[selectedItem.rarity] },
                                        ]}
                                    >
                                        [ ВИКОРИСТАТИ АРТЕФАКТ ]
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.inspectPlaceholder}>
                                <Text style={styles.placeholderText}>
                                    // ОБЕРІТЬ ПРЕДМЕТ ДЛЯ ПЕРЕГЛЯДУ ХАРАКТЕРИСТИК
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>
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
    terminalContainer: {
        width: '100%',
        backgroundColor: '#070A10',
        borderWidth: 1.5,
        borderLeftWidth: 4,
        borderColor: Colors.neonBlue,
        padding: 16,
        borderRadius: 0,
        shadowColor: Colors.neonBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 18,
        elevation: 22,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        backgroundColor: Colors.neonBlue,
    },
    headerTag: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    closeBtn: {
        padding: 4,
    },
    closeBtnText: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: '800',
    },
    currencyBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(18, 22, 34, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.2)',
        marginBottom: 16,
    },
    manaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    manaIcon: {
        fontSize: 16,
    },
    manaValue: {
        color: Colors.neonBlue,
        fontSize: 15,
        fontWeight: '900',
        fontFamily: 'monospace',
    },
    manaUnit: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        letterSpacing: 0.8,
    },
    capacityLabel: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    slotBox: {
        width: SLOT_SIZE,
        height: SLOT_SIZE,
        backgroundColor: 'rgba(18, 22, 34, 0.85)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    slotEmpty: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(10, 14, 22, 0.5)',
    },
    slotSelected: {
        borderColor: Colors.textWhite,
        backgroundColor: 'rgba(0, 240, 255, 0.15)',
    },
    itemEmoji: {
        fontSize: 26,
    },
    emptySlotRune: {
        color: 'rgba(255, 255, 255, 0.1)',
        fontFamily: 'monospace',
        fontSize: 16,
    },
    qtyBadge: {
        position: 'absolute',
        bottom: 2,
        right: 4,
    },
    qtyText: {
        color: Colors.textWhite,
        fontFamily: 'monospace',
        fontSize: 9,
        fontWeight: '700',
    },
    inspectPanel: {
        minHeight: 120,
        backgroundColor: 'rgba(12, 16, 26, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 12,
    },
    inspectContent: {
        flex: 1,
    },
    inspectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    inspectRarity: {
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: '800',
    },
    inspectName: {
        color: Colors.textWhite,
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    inspectDesc: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 16,
        marginBottom: 12,
    },
    actionBtn: {
        borderWidth: 1,
        paddingVertical: 8,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 240, 255, 0.05)',
    },
    actionBtnText: {
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    inspectPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: 'rgba(255, 255, 255, 0.25)',
        fontFamily: 'monospace',
        fontSize: 10,
        textAlign: 'center',
    },
});