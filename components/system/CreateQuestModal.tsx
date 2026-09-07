import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import { TabType } from './QuestFilterTabs';

export interface NewQuestPayload {
    title: string;
    category: 'STR' | 'INT' | 'MND';
    type: TabType;
    xpReward: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (payload: NewQuestPayload) => void;
}

const CATEGORIES: { key: 'STR' | 'INT' | 'MND'; label: string }[] = [
    { key: 'STR', label: 'STR / ТІЛО' },
    { key: 'INT', label: 'INT / РОЗУМ' },
    { key: 'MND', label: 'MND / ПОБУТ' },
];

const QUEST_TYPES: { key: TabType; label: string }[] = [
    { key: 'daily', label: 'ЩОДЕННИЙ' },
    { key: 'main', label: 'ОСНОВНИЙ' },
    { key: 'regular', label: 'РЕГУЛЯРНИЙ' },
];

const XP_TIERS = [15, 25, 50, 100];

export const CreateQuestModal: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'STR' | 'INT' | 'MND'>('STR');
    const [type, setType] = useState<TabType>('daily');
    const [xpReward, setXpReward] = useState<number>(25);

    const handleSelectOption = (action: () => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
    };

    const handleCreate = () => {
        if (!title.trim()) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubmit({
            title: title.trim(),
            category,
            type,
            xpReward,
        });
        setTitle('');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.backdrop}
            >
                <View style={styles.modalBox}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.statusIndicator} />
                            <Text style={styles.headerText}>[SYSTEM: NEW DIRECTIVE]</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.sectionLabel}>ДИРЕКТИВА / НАЗВА</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Введіть суть квесту..."
                        placeholderTextColor={Colors.textMuted}
                        style={styles.input}
                        autoFocus
                    />

                    <Text style={styles.sectionLabel}>АТРИБУТ РОЗВИТКУ</Text>
                    <View style={styles.rowSelector}>
                        {CATEGORIES.map((c) => {
                            const active = category === c.key;
                            return (
                                <Pressable
                                    key={c.key}
                                    onPress={() => handleSelectOption(() => setCategory(c.key))}
                                    style={[styles.selectorBtn, active && styles.selectorBtnActive]}
                                >
                                    <Text style={[styles.selectorText, active && styles.selectorTextActive]}>
                                        {c.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionLabel}>ТИП ЗАВДАННЯ</Text>
                    <View style={styles.rowSelector}>
                        {QUEST_TYPES.map((t) => {
                            const active = type === t.key;
                            return (
                                <Pressable
                                    key={t.key}
                                    onPress={() => handleSelectOption(() => setType(t.key))}
                                    style={[styles.selectorBtn, active && styles.selectorBtnActive]}
                                >
                                    <Text style={[styles.selectorText, active && styles.selectorTextActive]}>
                                        {t.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.sectionLabel}>НАГОРОДА XP</Text>
                    <View style={styles.xpRow}>
                        {XP_TIERS.map((tier) => {
                            const active = xpReward === tier;
                            return (
                                <Pressable
                                    key={tier}
                                    onPress={() => handleSelectOption(() => setXpReward(tier))}
                                    style={[styles.xpBtn, active && styles.xpBtnActive]}
                                >
                                    <Text style={[styles.xpText, active && styles.xpTextActive]}>
                                        +{tier}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.actionsRow}>
                        <Pressable style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelText}>СКАСУВАТИ</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.submitBtn, !title.trim() && styles.submitBtnDisabled]}
                            onPress={handleCreate}
                            disabled={!title.trim()}
                        >
                            <Text style={styles.submitText}>[ ЗАРЕЄСТРУВАТИ ]</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(5, 7, 10, 0.85)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalBox: {
        backgroundColor: '#0F131D',
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        padding: 18,
        borderRadius: 2,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderCard,
        paddingBottom: 10,
        marginBottom: 14,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicator: {
        width: 6,
        height: 6,
        backgroundColor: Colors.neonBlue,
    },
    headerText: {
        color: Colors.neonBlue,
        fontSize: 12,
        fontFamily: 'monospace',
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    closeBtn: {
        padding: 4,
    },
    closeText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
    sectionLabel: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 6,
        marginTop: 10,
    },
    input: {
        backgroundColor: 'rgba(18, 22, 34, 0.8)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        color: Colors.textWhite,
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 2,
    },
    rowSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    selectorBtn: {
        flex: 1,
        backgroundColor: 'rgba(18, 22, 34, 0.8)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 2,
    },
    selectorBtnActive: {
        borderColor: Colors.neonBlue,
        backgroundColor: Colors.neonBlueDim,
    },
    selectorText: {
        color: Colors.textMuted,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    selectorTextActive: {
        color: Colors.neonBlue,
    },
    xpRow: {
        flexDirection: 'row',
        gap: 8,
    },
    xpBtn: {
        flex: 1,
        backgroundColor: 'rgba(18, 22, 34, 0.8)',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 2,
    },
    xpBtnActive: {
        borderColor: Colors.amberWarning,
        backgroundColor: 'rgba(255, 170, 0, 0.15)',
    },
    xpText: {
        color: Colors.textMuted,
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    xpTextActive: {
        color: Colors.amberWarning,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.borderCard,
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    cancelText: {
        color: Colors.textMuted,
        fontSize: 11,
        fontFamily: 'monospace',
    },
    submitBtn: {
        backgroundColor: Colors.neonBlueDim,
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 2,
    },
    submitBtnDisabled: {
        opacity: 0.35,
    },
    submitText: {
        color: Colors.neonBlue,
        fontSize: 11,
        fontFamily: 'monospace',
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});