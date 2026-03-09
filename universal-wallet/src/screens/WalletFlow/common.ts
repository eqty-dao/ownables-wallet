import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import useEffectiveColorScheme from '../../hooks/useEffectiveColorScheme';

const palettes = {
  dark: {
    screen: '#0c0f19',
    title: '#ffffff',
    subtitle: '#9ca7bd',
    heroCard: '#151a2a',
    heroBorder: '#232a44',
    heroLabel: '#a7b2ce',
    heroSub: '#97a4c4',
    section: '#c7d2ee',
    rowBg: '#14192a',
    rowBorder: '#232a44',
    rowActiveBg: '#1a1f34',
    rowTitle: '#ffffff',
    rowSub: '#a7b2ce',
    rowValue: '#d4dcf7',
    actionSecondary: '#252d45',
    inputBorder: '#334063',
    inputBg: '#14192a',
    inputText: '#ffffff',
    helper: '#9ca7bd',
    chipBorder: '#25304a',
    chipBg: '#111626',
    chipIndex: '#7c8ab0',
    chipWord: '#f6f8ff',
  },
  light: {
    screen: '#f4f7ff',
    title: '#1a2240',
    subtitle: '#516089',
    heroCard: '#ffffff',
    heroBorder: '#d7def3',
    heroLabel: '#5f6f98',
    heroSub: '#5f6f98',
    section: '#4c5f92',
    rowBg: '#ffffff',
    rowBorder: '#d7def3',
    rowActiveBg: '#eef0ff',
    rowTitle: '#1a2240',
    rowSub: '#62739f',
    rowValue: '#334d9c',
    actionSecondary: '#cfd8f5',
    inputBorder: '#c5d0ee',
    inputBg: '#ffffff',
    inputText: '#1a2240',
    helper: '#5f6f98',
    chipBorder: '#d7def3',
    chipBg: '#ffffff',
    chipIndex: '#6d7aa3',
    chipWord: '#1c2550',
  },
};

const buildStyles = (scheme: 'light' | 'dark') => {
  const p = palettes[scheme];

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.screen,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 28,
    },
    title: {
      color: p.title,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: p.subtitle,
      fontSize: 14,
      marginBottom: 18,
    },
    heroCard: {
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      backgroundColor: p.heroCard,
      borderWidth: 1,
      borderColor: p.heroBorder,
    },
    heroLabel: {
      color: p.heroLabel,
      fontSize: 13,
      marginBottom: 8,
    },
    heroValue: {
      color: p.title,
      fontSize: 28,
      fontWeight: '700',
    },
    heroSubValue: {
      color: p.heroSub,
      fontSize: 14,
      marginTop: 6,
    },
    sectionTitle: {
      color: p.section,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 6,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    row: {
      backgroundColor: p.rowBg,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.rowBorder,
    },
    rowActive: {
      borderColor: '#615fff',
      backgroundColor: p.rowActiveBg,
    },
    rowTitle: {
      color: p.rowTitle,
      fontSize: 16,
      fontWeight: '600',
    },
    rowSubTitle: {
      color: p.rowSub,
      fontSize: 13,
      marginTop: 4,
    },
    rowValue: {
      color: p.rowValue,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 6,
    },
    actionButton: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: '#615fff',
      marginBottom: 10,
      alignItems: 'center',
    },
    actionButtonDanger: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: '#ad284f',
      marginBottom: 10,
      alignItems: 'center',
    },
    actionButtonSecondary: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: p.actionSecondary,
      marginBottom: 10,
      alignItems: 'center',
    },
    actionText: {
      color: scheme === 'light' ? '#1a2240' : '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    input: {
      borderRadius: 12,
      borderColor: p.inputBorder,
      borderWidth: 1,
      color: p.inputText,
      backgroundColor: p.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
    },
    helper: {
      color: p.helper,
      fontSize: 12,
      marginBottom: 12,
    },
    error: {
      color: '#ff7f9d',
      fontSize: 12,
      marginBottom: 10,
    },
    twoColumnWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    chip: {
      width: '48%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.chipBorder,
      backgroundColor: p.chipBg,
      padding: 10,
      marginBottom: 8,
    },
    chipIndex: {
      color: p.chipIndex,
      fontSize: 11,
      marginBottom: 2,
    },
    chipWord: {
      color: p.chipWord,
      fontSize: 14,
      fontWeight: '600',
    },
    txAmountPositive: {
      color: '#24a86b',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 6,
    },
    txAmountNegative: {
      color: '#e04a73',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 6,
    },
  });
};

export const useWalletFlowStyles = () => {
  const scheme = useEffectiveColorScheme();
  return useMemo(() => buildStyles(scheme), [scheme]);
};
