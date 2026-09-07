import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { usePlayerStore } from '@/stores/usePlayerStore';

const CLASSES = [
    { id: 'Shadow Striker', tag: 'STR / MND', desc: 'Фокус на дисципліні тіла та побуту' },
    { id: 'Neural Architect', tag: 'INT / STR', desc: 'Фокус на навчанні, кодингу та проєктах' },
    { id: 'Void Walker', tag: 'BALANCED', desc: 'Рівномірний розвиток усіх гілок' },
];

export default function RegisterScreen() {
    const router = useRouter();
    const registerPlayer = usePlayerStore((state) => state.registerPlayer);

    const [nickname, setNickname] = useState('');
    const [selectedClass, setSelectedClass] = useState(CLASSES[0].id);

    const handleRegister = async () => {
        if (!nickname.trim()) return;

        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await registerPlayer(nickname.trim(), selectedClass);

            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        } catch (err) {
            console.error('Failed to submit registration:', err);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

            <View style={styles.terminalCard}>
                <View style={styles.header}>
                    <Text style={styles.systemTag}>[ SYSTEM AWAKENING PROTOCOL ]</Text>
                    <Text style={styles.subTag}>VER. 1.0.4 // INITIALIZE PLAYER PROFILE</Text>
                </View>
                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>PLAYER CALLSIGN / ПОЗИВНИЙ</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Введіть нікнейм гравця..."
                        placeholderTextColor={Colors.textMuted}
                        value={nickname}
                        onChangeText={setNickname}
                        autoFocus
                    />
                </View>

                <View style={styles.fieldBlock}>
                    <Text style={styles.label}>SPECIALIZATION / КЛАС</Text>
                    <View style={styles.classesList}>
                        {CLASSES.map((cls) => {
                            const active = selectedClass === cls.id;
                            return (
                                <Pressable
                                    key={cls.id}
                                    style={[styles.classItem, active && styles.classItemActive]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedClass(cls.id);
                                    }}
                                >
                                    <View style={styles.classHeader}>
                                        <Text style={[styles.className, active && styles.textNeon]}>
                                            {cls.id}
                                        </Text>
                                        <Text style={styles.classTag}>[{cls.tag}]</Text>
                                    </View>
                                    <Text style={styles.classDesc}>{cls.desc}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <Pressable
                    style={[styles.actionBtn, !nickname.trim() && styles.actionBtnDisabled]}
                    onPress={handleRegister}
                    disabled={!nickname.trim()}
                >
                    <Text style={styles.actionBtnText}>[ ПРИЙНЯТИ ДИРЕКТИВУ СИСТЕМИ ]</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgPrimary,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    terminalCard: {
        backgroundColor: '#0F131D',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        padding: 20,
        gap: 18,
        elevation: 8,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderCard,
        paddingBottom: 12,
    },
    systemTag: {
        color: Colors.neonBlue,
        fontSize: 14,
        fontFamily: 'monospace',
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    subTag: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        marginTop: 4,
    },
    fieldBlock: {
        gap: 8,
    },
    label: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: 'rgba(18, 22, 34, 0.8)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        color: Colors.textWhite,
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 2,
        fontFamily: 'monospace',
    },
    classesList: {
        gap: 8,
    },
    classItem: {
        backgroundColor: 'rgba(18, 22, 34, 0.6)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        padding: 12,
        borderRadius: 2,
    },
    classItemActive: {
        borderColor: Colors.neonBlue,
        backgroundColor: Colors.neonBlueDim,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    className: {
        color: Colors.textWhite,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    textNeon: {
        color: Colors.neonBlue,
    },
    classTag: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
    },
    classDesc: {
        color: Colors.textMuted,
        fontSize: 11,
        marginTop: 4,
    },
    actionBtn: {
        backgroundColor: Colors.neonBlueDim,
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 2,
        marginTop: 8,
    },
    actionBtnDisabled: {
        opacity: 0.35,
    },
    actionBtnText: {
        color: Colors.neonBlue,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '800',
        letterSpacing: 1.4,
    },
});