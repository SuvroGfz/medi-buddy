import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { typography, spacing, useTheme, ThemeColors } from '../theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Saving...' }: LoadingOverlayProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      alignItems: 'center',
      justifyContent: 'center',
    },
    box: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.xxl,
      alignItems: 'center',
      gap: spacing.lg,
      minWidth: 160,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    text: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
  });
