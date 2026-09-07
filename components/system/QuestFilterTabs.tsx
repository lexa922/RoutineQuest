import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';

export type TabType = 'daily' | 'main' | 'regular';

interface Props {
    activeTab: TabType;
    onSelectTab: (tab: TabType) => void;
    counts: {
        daily: { completed: number; total: number };
        main: { completed: number; total: number };
        regular: { completed: number; total: number };
    };
}

export const QuestFilterTabs: React.FC<Props> = ({ activeTab, onSelectTab, counts }) => {
    const tabs: { key: TabType; label: string; count: { completed: number; total: number } }[] = [
        { key: 'daily', label: 'ЩОДЕННІ', count: counts.daily },
        { key: 'main', label: 'ОСНОВНІ', count: counts.main },
        { key: 'regular', label: 'РЕГУЛЯРНІ', count: counts.regular },
    ];

    const handlePress = (key: TabType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectTab(key);
    };

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => handlePress(tab.key)}
                        style={[styles.tabButton, isActive && styles.activeTabButton]}
                    >
                        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                            {tab.label} [{tab.count.completed}/{tab.count.total}]
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderCard,
        backgroundColor: Colors.bgPrimary,
        marginHorizontal: 16,
        marginVertical: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: Colors.neonBlue,
        backgroundColor: Colors.neonBlueDim,
    },
    tabText: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    activeTabText: {
        color: Colors.neonBlue,
    },
});