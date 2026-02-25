import React from 'react';
import { Network, useUserSettings } from '../context/User.context';
import { Modal, RadioButton } from 'react-native-paper';

export default function NetworkSelector({ showNetworkSelector, setShowNetworkSelector }: { showNetworkSelector: boolean, setShowNetworkSelector: (show: boolean) => void }) {
    const { setNetwork, network } = useUserSettings();

    return (
        <Modal
            visible={showNetworkSelector}
            onDismiss={() => setShowNetworkSelector(false)}
            contentContainerStyle={{ backgroundColor: '#141414', padding: 20, borderRadius: 8 }}>
            <RadioButton.Group
                onValueChange={value => {
                    setNetwork(value as Network);
                    setShowNetworkSelector(false);
                }}
                value={network}
            >
                <RadioButton.Item label="Base Mainnet" value={Network.MAINNET} color='white' labelStyle={{ color: 'white' }} />
                <RadioButton.Item label="Base Sepolia" value={Network.TESTNET} color='white' labelStyle={{ color: 'white' }} />
            </RadioButton.Group>
        </Modal>
    );
}
