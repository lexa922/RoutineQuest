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

    return (
        <Pressable
            onPress={onOpen}
            style={[
                styles.bannerContainer,
                hasBoss ? styles.bannerBoss : styles.bannerDaily,
            ]}
        >
            <View style={styles.row}>
                <Text style={styles.iconPulse}>◈</Text>
                <Text style={styles.textMain}>
                    СИСТЕМА: ДОСТУПНА СКРИНЯ НАГОРОДИ ({count})
                </Text>
            </View>
            <Text style={styles.actionPrompt}>[ ВІДКРИТИ ]</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    bannerContainer: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 4,
        paddingVertical: 10,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
    },
    bannerDaily: {
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        borderColor: Colors.neonBlue,
    },
    bannerBoss: {
        backgroundColor: 'rgba(255, 170, 0, 0.12)',
        borderColor: Colors.amberWarning,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconPulse: {
        color: Colors.neonBlue,
        fontSize: 14,
        fontWeight: '900',
    },
    textMain: {
        color: Colors.textWhite,
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    actionPrompt: {
        color: Colors.neonBlue,
        fontFamily: 'monospace',
        fontSize: 11,
        fontWeight: '800',
    },
});