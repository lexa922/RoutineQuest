import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/theme';

interface FabProps {
    onPress: () => void;
}

export const SystemActionFAB: React.FC<FabProps> = ({ onPress }) => {
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onPress();
    };

    return (
        <Pressable style={styles.fabButton} onPress={handlePress}>
            <Text style={styles.bracket}>[</Text>
            <Text style={styles.fabIcon}>+</Text>
            <Text style={styles.fabText}>НОВИЙ КВЕСТ</Text>
            <Text style={styles.bracket}>]</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    fabButton: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F131D',
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        paddingVertical: 12,
        paddingHorizontal: 22,
        gap: 6,
        // Світловий неоновий ефект
        elevation: 8,
    },
    fabIcon: {
        color: Colors.neonBlue,
        fontSize: 16,
        fontWeight: 'bold',
    },
    fabText: {
        color: Colors.textWhite,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    bracket: {
        color: Colors.neonBlue,
        fontSize: 14,
        fontWeight: '300',
    },
});