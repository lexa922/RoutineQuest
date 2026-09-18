import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { ChestType } from '@/types/loot';

interface ChestBannerProps {
    chests: ChestType[];
    onOpen: () => void;
}

export const ChestBanner: React.FC<ChestBannerProps> = ({ chests, onOpen }) => {
    if (!chests || chests.length === 0) return null;

    const hasBoss = chests.includes('boss');
    const count = chests.length;
    const accentColor = hasBoss ? Colors.amberWarning : Colors.neonBlue;

    return (
        <Pressable
            onPress={onOpen}
            style={[
                styles.bannerContainer,
                {
                    borderColor: accentColor,
                    backgroundColor: hasBoss
                        ? 'rgba(255, 170, 0, 0.1)'
                        : 'rgba(0, 240, 255, 0.08)',
                },
            ]}
        >
            <View style={styles.leftGroup}>
                <Text style={[styles.iconPulse, { color: accentColor }]}>◈</Text>
                <View style={styles.textWrapper}>
                    <Text style={styles.titleText} numberOfLines={1}>
                        СИСТЕМА: ДОСТУПНА СКРИНЯ ({count})
                    </Text>
                    <Text style={styles.subtitleText}>
                        {hasBoss ? 'CRITICAL BOSS REWARD' : 'DAILY DIRECTIVE COMPLETE'}
                    </Text>
                </View>
            </View>

            <View style={[styles.actionBadge, { borderColor: accentColor }]}>
                <Text style={[styles.actionPrompt, { color: accentColor }]}>
                    ВІДКРИТИ
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderLeftWidth: 4,
        gap: 8,
    },
    leftGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconPulse: {
        fontSize: 16,
        fontWeight: '900',
    },
    textWrapper: {
        flex: 1,
    },
    titleText: {
        color: Colors.textWhite,
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    subtitleText: {
        color: Colors.textMuted,
        fontFamily: 'monospace',
        fontSize: 8,
        letterSpacing: 0.8,
        marginTop: 1,
    },
    actionBadge: {
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(7, 10, 16, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionPrompt: {
        fontFamily: 'monospace',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
});