import React, { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WalletStackScreenProps } from '../../../types';
import AccountLifecycleService from '../../services/AccountLifecycle.service';
import WalletPortfolioService, { TokenDetailsViewModel } from '../../services/WalletPortfolio.service';
import { useUserSettings } from '../../context/User.context';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Icon from '../../components/Icon';
import { useWalletFlowStyles } from './common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TokenDetailsScreen({ navigation, route }: WalletStackScreenProps<'TokenDetails'>) {
  const styles = useWalletFlowStyles();
  const insets = useSafeAreaInsets();
  const statusBarTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topInset = Math.max(insets.top, statusBarTop, 8);
  const { network } = useUserSettings();
  const token = route.params.token;
  const [viewModel, setViewModel] = useState<TokenDetailsViewModel>({
    symbol: token,
    name: token === 'ETH' ? 'Ethereum' : 'EQTY',
    amountLabel: token === 'ETH' ? '0.0000' : '0.00',
    fiatLabel: '$0.00',
    contractLabel: token === 'ETH' ? 'Native asset' : 'Not available',
    contractUrl: token === 'EQTY' ? 'https://basescan.org' : undefined,
    priceLabel: '—',
    activities: [],
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const account = await AccountLifecycleService.getAccount();
          const [overview, txs] = await Promise.all([
            WalletPortfolioService.getWalletOverview({
              address: account.address as `0x${string}`,
              network,
              currency: 'USD',
            }),
            WalletPortfolioService.getTokenTransactions({
              address: account.address,
              network,
              token,
            }),
          ]);

          setViewModel(
            WalletPortfolioService.buildTokenDetailsViewModel({
              token,
              overview,
              transactions: txs,
              walletAddress: account.address,
            }),
          );
        } catch (_error) {
          setViewModel({
            symbol: token,
            name: token === 'ETH' ? 'Ethereum' : 'EQTY',
            amountLabel: token === 'ETH' ? '0.0000' : '0.00',
            fiatLabel: '$0.00',
            contractLabel: token === 'ETH' ? 'Native asset' : 'Not available',
            contractUrl: token === 'EQTY' ? 'https://basescan.org' : undefined,
            priceLabel: '—',
            activities: [],
          });
        }
      };

      load();
    }, [network, token]),
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        style={styles.screen}
        contentContainerStyle={[styles.tokenDetailsContent, { paddingTop: topInset }]}
      >
        <View style={styles.tokenDetailsHeader}>
          <Pressable accessibilityLabel="Back" style={styles.tokenDetailsBackButton} onPress={() => navigation.goBack()}>
            <Icon icon="chevronLeft" size={18} color={styles.homeHeaderIcon.color} />
          </Pressable>
          <Text style={styles.tokenDetailsHeaderTitle}>{token}</Text>
          <View style={styles.tokenDetailsBackButton} />
        </View>

        <View style={styles.tokenDetailsHero}>
          <View style={styles.tokenDetailsBadge}>
            {token === 'ETH' ? (
              <Icon icon="diamond" size={16} color={styles.tokenIconText.color} />
            ) : (
              <Text style={styles.tokenDetailsBadgeText}>EQ</Text>
            )}
          </View>
          <Text style={styles.tokenDetailsTokenName}>{viewModel.name}</Text>
          <Text style={styles.tokenDetailsAmount}>{viewModel.amountLabel}</Text>
          <Text style={styles.tokenDetailsFiat}>{viewModel.fiatLabel}</Text>
        </View>

        <View style={styles.tokenDetailsActionsRow}>
          <Pressable accessibilityLabel="Send" style={styles.tokenDetailsPrimaryAction} onPress={() => navigation.navigate('SendToken', { token })}>
            <FontAwesome6 name="paper-plane" size={18} color="#ffffff" />
            <Text style={styles.tokenDetailsPrimaryActionText}>Send</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Receive"
            style={styles.tokenDetailsSecondaryAction}
            onPress={() => navigation.navigate('ReceiveToken', { token })}
          >
            <FontAwesome6 name="arrow-down" size={18} color="#615fff" />
            <Text style={styles.tokenDetailsSecondaryActionText}>Receive</Text>
          </Pressable>
        </View>

        <View style={styles.tokenDetailsSection}>
          <Text style={styles.tokenDetailsSectionTitle}>Token Information</Text>
          <View style={styles.tokenDetailsInfoCard}>
            <View style={styles.tokenDetailsInfoRow}>
              <Text style={styles.tokenDetailsInfoLabel}>Contract Address</Text>
              {!viewModel.contractUrl ? (
                <Text style={styles.tokenDetailsInfoValue}>{viewModel.contractLabel}</Text>
              ) : (
                <Pressable onPress={() => Linking.openURL(viewModel.contractUrl!)}>
                  <Text style={styles.tokenDetailsInfoValueLink}>{viewModel.contractLabel}</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.rowDivider} />
            <View style={styles.tokenDetailsInfoRow}>
              <Text style={styles.tokenDetailsInfoLabel}>Price</Text>
              <Text style={styles.tokenDetailsInfoValue}>{viewModel.priceLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tokenDetailsSection}>
          <Text style={styles.tokenDetailsSectionTitle}>Recent Activity</Text>
          {viewModel.activities.length === 0 ? (
            <Text style={styles.tokenDetailsEmptyText}>No transactions yet</Text>
          ) : (
            <View style={styles.tokenDetailsActivityCard}>
              {viewModel.activities.map((item, index) => {
                return (
                  <View key={item.hash}>
                    <View style={styles.tokenDetailsActivityRow}>
                      <View style={styles.tokenDetailsActivityLeft}>
                        <Text style={item.incoming ? styles.tokenDetailsPositiveAmount : styles.tokenDetailsNegativeAmount}>{item.amountLabel}</Text>
                        <Text style={styles.tokenDetailsActivityMeta}>{item.counterpartyLabel}</Text>
                      </View>
                      <Text style={styles.tokenDetailsActivityDate}>{item.dateLabel}</Text>
                    </View>
                    {index < viewModel.activities.length - 1 ? <View style={styles.rowDivider} /> : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
