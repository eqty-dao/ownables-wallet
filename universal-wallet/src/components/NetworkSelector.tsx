import React from 'react';
import { useUserSettings } from '../context/User.context';
import { Modal, RadioButton } from 'react-native-paper';

export default function NetworkSelector({ showNetworkSelector, setShowNetworkSelector }) {
    const { setNetwork, network } = useUserSettings();

    return (

        <Modal
            visible={showNetworkSelector}
            onDismiss={() => setShowNetworkSelector(false)}
            contentContainerStyle={{ backgroundColor: '#141414', padding: 20, borderRadius: 8 }}>
            <RadioButton.Group
                onValueChange={value => {
                    setNetwork(value);
                    setShowNetworkSelector(false);
                }}
                value={network}
            >
                <RadioButton.Item label="Mainnet" value="L" color='white' labelStyle={{ color: 'white' }} />
                <RadioButton.Item label="Testnet" value="T" color='white' labelStyle={{ color: 'white' }} />
            </RadioButton.Group>
        </Modal>
    );
}
