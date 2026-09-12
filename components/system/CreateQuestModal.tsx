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
    ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/theme';
import {TabType, QuestCategory, RepeatType, SubQuest} from '@/types/quest';

export interface NewQuestPayload {
    title: string;
    category: QuestCategory;
    type: TabType;
    xpReward: number;
    repeatType?: RepeatType;
    repeatIntervalDays?: number;
    repeatWeekdays?: number[];
    subQuests?: SubQuest[];
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (payload: NewQuestPayload) => void;
}

const CATEGORIES: { key: QuestCategory; label: string }[] = [
    { key: 'STR', label: 'STR / ТІЛО' },
    { key: 'INT', label: 'INT / РОЗУМ' },
    { key: 'MND', label: 'MND / ПОБУТ' },
];

const QUEST_TYPES: { key: TabType; label: string }[] = [
    { key: 'daily', label: 'ЩОДЕННИЙ' },
    { key: 'main', label: 'ОСНОВНИЙ' },
    { key: 'regular', label: 'РЕГУЛЯРНИЙ' },
];

const WEEKDAYS = [
    { id: 1, label: 'ПН' },
    { id: 2, label: 'ВТ' },
    { id: 3, label: 'СР' },
    { id: 4, label: 'ЧТ' },
    { id: 5, label: 'ПТ' },
    { id: 6, label: 'СБ' },
    { id: 7, label: 'НД' },
];

const INTERVAL_OPTIONS = [2, 3, 5, 7, 14];
const XP_TIERS = [15, 25, 50, 100];

export const CreateQuestModal: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<QuestCategory>('STR');
    const [type, setType] = useState<TabType>('daily');
    const [xpReward, setXpReward] = useState<number>(25);

    const [repeatMode, setRepeatMode] = useState<RepeatType>('weekdays');
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3, 5]);
    const [intervalDays, setIntervalDays] = useState<number>(3);

    const [subQuestsInput, setSubQuestsInput] = useState<{ title: string; xp: number }[]>([]);
    const [tempSubTitle, setTempSubTitle] = useState('');
    const [tempSubXp, setTempSubXp] = useState(15);

    const toggleWeekday = (dayId: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedWeekdays((prev) =>
            prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort()
        );
    };

    const handleCreate = () => {
        if (!title.trim()) return;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const generatedSubQuests: SubQuest[] = subQuestsInput.map((s, index) => ({
            id: `${Date.now()}_sub_${index}`,
            questId: '',
            title: s.title,
            xpReward: s.xp,
            isCompleted: false,
        }));

        const payload: NewQuestPayload = {
            title: title.trim(),
            category,
            type,
            xpReward,
            ...(type === 'regular' && {
                repeatType: repeatMode,
                repeatIntervalDays: repeatMode === 'interval' ? intervalDays : undefined,
                repeatWeekdays: repeatMode === 'weekdays' ? selectedWeekdays : undefined,
            }),
            subQuests: type === 'main' && generatedSubQuests.length > 0 ? generatedSubQuests : undefined,
        };


        onSubmit(payload);
        setTitle('');
        onClose();
    };

    const handleAddSubQuest = () => {
        if (!tempSubTitle.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSubQuestsInput((prev) => [
            ...prev,
            { title: tempSubTitle.trim(), xp: tempSubXp },
        ]);
        setTempSubTitle('');
    };

    const handleRemoveSubQuest = (idx: number) => {
        setSubQuestsInput((prev) => prev.filter((_, i) => i !== idx));
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

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionLabel}>ДИРЕКТИВА / НАЗВА</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Введіть суть квесту..."
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                        />

                        <Text style={styles.sectionLabel}>АТРИБУТ РОЗВИТКУ</Text>
                        <View style={styles.rowSelector}>
                            {CATEGORIES.map((c) => {
                                const active = category === c.key;
                                return (
                                    <Pressable
                                        key={c.key}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setCategory(c.key);
                                        }}
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
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setType(t.key);
                                        }}
                                        style={[styles.selectorBtn, active && styles.selectorBtnActive]}
                                    >
                                        <Text style={[styles.selectorText, active && styles.selectorTextActive]}>
                                            {t.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {type === 'regular' && (
                            <View style={styles.regularContainer}>
                                <Text style={styles.subSectionLabel}>// РЕЖИМ ПОВТОРЕННЯ</Text>
                                <View style={styles.rowSelector}>
                                    <Pressable
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setRepeatMode('weekdays');
                                        }}
                                        style={[
                                            styles.subModeBtn,
                                            repeatMode === 'weekdays' && styles.subModeBtnActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.subModeText,
                                                repeatMode === 'weekdays' && styles.subModeTextActive,
                                            ]}
                                        >
                                            ДНІ ТИЖНЯ
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setRepeatMode('interval');
                                        }}
                                        style={[
                                            styles.subModeBtn,
                                            repeatMode === 'interval' && styles.subModeBtnActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.subModeText,
                                                repeatMode === 'interval' && styles.subModeTextActive,
                                            ]}
                                        >
                                            ІНТЕРВАЛ ДНІВ
                                        </Text>
                                    </Pressable>
                                </View>

                                {repeatMode === 'weekdays' ? (
                                    <View style={styles.weekdaysRow}>
                                        {WEEKDAYS.map((w) => {
                                            const active = selectedWeekdays.includes(w.id);
                                            return (
                                                <Pressable
                                                    key={w.id}
                                                    onPress={() => toggleWeekday(w.id)}
                                                    style={[styles.weekdayBtn, active && styles.weekdayBtnActive]}
                                                >
                                                    <Text style={[styles.weekdayText, active && styles.weekdayTextActive]}>
                                                        {w.label}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <View style={styles.rowSelector}>
                                        {INTERVAL_OPTIONS.map((days) => {
                                            const active = intervalDays === days;
                                            return (
                                                <Pressable
                                                    key={days}
                                                    onPress={() => {
                                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                        setIntervalDays(days);
                                                    }}
                                                    style={[styles.selectorBtn, active && styles.selectorBtnActive]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.selectorText,
                                                            active && styles.selectorTextActive,
                                                        ]}
                                                    >
                                                        +{days}Д
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        {type === 'main' && (
                            <View style={styles.mainSubContainer}>
                                <Text style={styles.subSectionLabel}>// ДИРЕКТИВИ ЕТАПІВ (ПІДКВЕСТИ)</Text>

                                {subQuestsInput.map((item, idx) => (
                                    <View key={idx} style={styles.subQuestItem}>
                                        <Text style={styles.subQuestBullet}>▶</Text>
                                        <Text style={styles.subQuestItemTitle} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.subQuestItemXp}>+{item.xp} XP</Text>
                                        <Pressable onPress={() => handleRemoveSubQuest(idx)} hitSlop={6}>
                                            <Text style={styles.subQuestDelete}>✕</Text>
                                        </Pressable>
                                    </View>
                                ))}

                                <View style={styles.addSubRow}>
                                    <TextInput
                                        value={tempSubTitle}
                                        onChangeText={setTempSubTitle}
                                        placeholder="Назва етапу..."
                                        placeholderTextColor={Colors.textMuted}
                                        style={[styles.input, { flex: 1, paddingVertical: 6 }]}
                                    />
                                    <Pressable
                                        onPress={() => setTempSubXp((prev) => (prev === 15 ? 25 : prev === 25 ? 50 : 15))}
                                        style={styles.subXpSelector}
                                    >
                                        <Text style={styles.subXpSelectorText}>+{tempSubXp} XP</Text>
                                    </Pressable>
                                    <Pressable onPress={handleAddSubQuest} style={styles.addSubBtn}>
                                        <Text style={styles.addSubBtnText}>+ ДОДАТИ</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}

                        <Text style={styles.sectionLabel}>НАГОРОДА XP</Text>
                        <View style={styles.xpRow}>
                            {XP_TIERS.map((tier) => {
                                const active = xpReward === tier;
                                return (
                                    <Pressable
                                        key={tier}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setXpReward(tier);
                                        }}
                                        style={[styles.xpBtn, active && styles.xpBtnActive]}
                                    >
                                        <Text style={[styles.xpText, active && styles.xpTextActive]}>
                                            +{tier}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </ScrollView>

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
        paddingHorizontal: 16,
    },
    modalBox: {
        maxHeight: '85%',
        backgroundColor: '#0F131D',
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        padding: 16,
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
        marginBottom: 8,
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
        gap: 6,
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
    regularContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'rgba(18, 22, 34, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(30, 38, 56, 0.8)',
        gap: 8,
    },
    subSectionLabel: {
        color: Colors.neonBlue,
        fontSize: 8,
        fontFamily: 'monospace',
        fontWeight: '700',
        letterSpacing: 1,
    },
    subModeBtn: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderCard,
    },
    subModeBtnActive: {
        borderColor: Colors.neonBlue,
        backgroundColor: Colors.neonBlueDim,
    },
    subModeText: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    subModeTextActive: {
        color: Colors.neonBlue,
    },
    weekdaysRow: {
        flexDirection: 'row',
        gap: 4,
    },
    weekdayBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderCard,
        backgroundColor: 'rgba(18, 22, 34, 0.8)',
    },
    weekdayBtnActive: {
        borderColor: Colors.amberWarning,
        backgroundColor: 'rgba(255, 170, 0, 0.15)',
    },
    weekdayText: {
        color: Colors.textMuted,
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    weekdayTextActive: {
        color: Colors.amberWarning,
    },
    xpRow: {
        flexDirection: 'row',
        gap: 6,
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
        marginTop: 14,
        paddingTop: 12,
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
    mainSubContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'rgba(18, 22, 34, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.2)',
        gap: 8,
    },
    subQuestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        gap: 8,
    },
    subQuestBullet: {
        color: Colors.neonBlue,
        fontSize: 10,
    },
    subQuestItemTitle: {
        flex: 1,
        color: Colors.textWhite,
        fontSize: 12,
        fontFamily: 'monospace',
    },
    subQuestItemXp: {
        color: Colors.amberWarning,
        fontSize: 10,
        fontFamily: 'monospace',
    },
    subQuestDelete: {
        color: Colors.crimsonRed,
        fontSize: 12,
        paddingHorizontal: 4,
    },
    addSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    subXpSelector: {
        paddingHorizontal: 8,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: Colors.borderCard,
        backgroundColor: '#121622',
    },
    subXpSelectorText: {
        color: Colors.amberWarning,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: '700',
    },
    addSubBtn: {
        backgroundColor: Colors.neonBlueDim,
        borderWidth: 1,
        borderColor: Colors.neonBlue,
        paddingVertical: 7,
        paddingHorizontal: 10,
    },
    addSubBtnText: {
        color: Colors.neonBlue,
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: '800',
    },
});