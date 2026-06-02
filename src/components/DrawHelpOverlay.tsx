import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, radii, spacing } from '@/lib/theme';
import { t, type Lang } from '@/lib/i18n';

type Props = {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
};

/**
 * One-time coach overlay that explains the polygon-drawing flow.
 * Shown the first time a user starts drawing; re-openable via the "?" button.
 */
export default function DrawHelpOverlay({ visible, lang, onClose }: Props) {
  const steps = [
    t(lang, 'draw_help_step1'),
    t(lang, 'draw_help_step2'),
    t(lang, 'draw_help_step3'),
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.center} pointerEvents="box-none">
        <View style={s.card}>
          <Text style={s.title}>{t(lang, 'draw_help_title')}</Text>

          {steps.map((text, i) => (
            <View key={i} style={s.step}>
              <View style={s.num}>
                <Text style={s.numText}>{i + 1}</Text>
              </View>
              <Text style={s.stepText}>{text}</Text>
            </View>
          ))}

          <Pressable style={s.cta} onPress={onClose}>
            <Text style={s.ctaText}>{t(lang, 'draw_help_cta')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.panel,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
