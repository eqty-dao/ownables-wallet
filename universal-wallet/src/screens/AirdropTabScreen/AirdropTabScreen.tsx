import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScreenContainer } from '../../components/ScreenContainer';
import { StyledButton } from '../../components/StyledButton';
import Recaptcha, { RecaptchaRef } from 'react-native-recaptcha-that-works';
import { FormContainer } from '../../components/styles/FormContainer.styles';
import { InputField } from '../../components/InputField';
import { RootStackScreenProps } from '../../../types';

import { BackButton } from '../../components/BackButton';
import { StyledSubtitle, StyledTitle } from '../../components/styles/Title.styles';
const YOUR_SITE_KEY_HERE = '6LfBGbAqAAAAAAevXwEQmpzboS-AKk2J_cVeVsan'
import DeviceInfo from 'react-native-device-info';
import { encryptData, decryptData } from '../../hooks/useStaticServer';
// 6LcwFrAqAAAAAI0BR2-22nORffweEDVf_5CFZHaK
import valid_decoded_values from './valid_decoded_values.json';
import LTOService from '../../services/LTO.service';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from 'react-native-paper';
import { Container } from '../LockedScreen/LockedScreen.styles';

const AirdropTabScreen = ({ navigation }: RootStackScreenProps<'Airdrop'>) => {
    const [state, setState] = useState({
        installationId: '',
        isCaptchaValid: false,
        canValidate: true,
        accountAddress: '',
        alreadyClaimed: false,
        isLoading: false,
        success: false
    });

    const recaptcha = useRef<RecaptchaRef>(null);

    useFocusEffect(
        useCallback(() => {
            resetState();
        }, [])
    );

    const resetState = useCallback(() => {
        setState({
            installationId: '',
            isCaptchaValid: false,
            canValidate: true,
            accountAddress: '',
            alreadyClaimed: false,
            isLoading: false,
            success: false
        });
    }, []);

    const checkIfAlreadyClaimed = useCallback(async () => {
        const response = await LTOService.checkIfAlreadyClaimed(state.accountAddress);
        setState(prev => ({ ...prev, alreadyClaimed: response }));
    }, [state.accountAddress]);

    useFocusEffect(
        useCallback(() => {
            resetState();
            Promise.all([getAccountAddress(), getInitialData()])
                .catch(error => console.error('Initialization error:', error));
        }, [])
    );

    const getAccountAddress = useCallback(async () => {
        try {
            const account = await LTOService.getAccount();
            setState(prev => ({ ...prev, accountAddress: account.address }));
            return account.address;
        } catch (error) {
            console.error('Error retrieving account:', error);
            throw error;
        }
    }, []);

    const getInitialData = useCallback(async () => {
        try {
            let id = `${await DeviceInfo.getUniqueId()}-652`;
            const validId = !valid_decoded_values.includes(id);
            const isEmulator = !DeviceInfo.isEmulatorSync();
            if (isEmulator) {
                id = `${id}-1`;
            }
            await checkIfAlreadyClaimed();
            await checkIfAlreadyClaimed();
            const encryptedId = encryptData(id);
            setState(prev => ({
                ...prev,
                installationId: encryptedId.toString(),
                canValidate: validId && !isEmulator
            }));
        } catch (error) {
            console.error('Error getting initial data:', error);
            throw error;
        }
    }, []);

    useEffect(() => {
        if (!state.accountAddress) return;

        const checkClaimStatus = async () => {
            try {
                const response = await LTOService.checkIfAlreadyClaimed(state.accountAddress);
                setState(prev => ({ ...prev, alreadyClaimed: response }));
            } catch (error) {
                console.error('Error checking claim status:', error);
            }
        };

        checkClaimStatus();
    }, [state.accountAddress]);

    const handleCaptchaVerify = useCallback((token: string) => {
        setState(prev => ({ ...prev, isCaptchaValid: true }));
    }, []);

    const handleValidate = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        console.log('handleValidate', state.isCaptchaValid);

        try {
            const response = await LTOService.validateAirdrop(
                state.installationId,
                state.accountAddress
            );
            console.log('validateAirdrop', response);
            if (response.statusCode > 200) {
                setState(prev => ({ ...prev, alreadyClaimed: true }));
            }
            else {
                setState(prev => ({ ...prev, alreadyClaimed: false }));
            }
            setState(prev => ({ ...prev, success: true }));
        } catch (error) {
            console.error('Validation error:', error);
            // Add proper error handling here
        }
        setState(prev => ({ ...prev, isLoading: false }));
    }, [state.isCaptchaValid, state.installationId, state.accountAddress, navigation]);

    return (
        <Container
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                width: '100%'
            }}
        >
            {state.canValidate ? (
                state.alreadyClaimed ? (
                    <StyledSubtitle>
                        Airdrop claimed successfully
                    </StyledSubtitle>
                ) : (
                    <FormContainer>
                        <Recaptcha
                            ref={recaptcha}
                            siteKey={YOUR_SITE_KEY_HERE}
                            baseUrl="https://www.ltonetwork.com"
                            onVerify={handleCaptchaVerify}
                            size="invisible"

                        />
                        <StyledButton
                            text='Validate Airdrop'
                            onPress={handleValidate}
                            disabled={!state.installationId || state.isLoading}
                        />
                    </FormContainer>
                )
            ) : (
                <StyledSubtitle>
                    Not eligible for airdrop
                </StyledSubtitle>
            )}
        </Container>
    );
};

export default AirdropTabScreen;