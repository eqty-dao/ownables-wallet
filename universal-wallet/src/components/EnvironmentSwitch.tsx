import React, { useState } from 'react';
import { Env, useUserSettings } from '../context/User.context';
import { Modal, RadioButton } from 'react-native-paper';

export default function EnvironmentSelectionSwitch({ showEnvironmentSelector, setShowEnvironmentSelector }: { showEnvironmentSelector: boolean, setShowEnvironmentSelector: (show: boolean) => void }) {
    const { env, setEnv } = useUserSettings();
    return (
        <Modal
            visible={showEnvironmentSelector}
            onDismiss={() => setShowEnvironmentSelector(false)}
            contentContainerStyle={{ backgroundColor: '#141414', padding: 20, borderRadius: 8 }}>
            <RadioButton.Group
                onValueChange={value => {
                    setEnv(value as Env);
                    setShowEnvironmentSelector(false);
                }}
                value={env}
            >
                <RadioButton.Item label="Production" value={Env.PROD} color='white' labelStyle={{ color: 'white' }} />
                <RadioButton.Item label="Staging" value={Env.STAGING} color='white' labelStyle={{ color: 'white' }} />
            </RadioButton.Group>
        </Modal>
    );
}
