import React, { useContext, useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View, Share, Alert } from 'react-native';
import { RootStackScreenProps } from '../../../types';
import { Container } from '../LockedScreen/LockedScreen.styles';
import { QRCodeScanner } from '../../components/QRCodeScanner';
import { Button, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import Spinner from '../../components/Spinner';
import LTOService from '../../services/LTO.service';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { Input } from 'react-native-elements';
import { MessageContext } from '../../context/UserMessage.context';
import { LTO_REPRESENTATION } from '../../constants/Quantities';
import { TypedDetails } from '../../interfaces/TypedDetails';
import { Transfer as TransferTx } from '@ltonetwork/lto';
import { formatNumber } from '../../utils/formatNumber';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { confirmationMessage } from '../../utils/confirmationMessage';
import { TypedTransaction } from '../../interfaces/TypedTransaction';
import { TransferModal } from '../../components/TransferModal';
import { BottomModal } from '../../components/BottomModal';
import DeviceInfo from 'react-native-device-info';

const QrReaderScreen = ({ navigation, route }: RootStackScreenProps<'QrReader'>) => {
    const [showCamera, setShowCamera] = useState(false);
    const [showCelebrationModal, setShowCelebrationModal] = useState(false);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [promotionCode, setPromotionCode] = useState('');
    const [address, setAddress] = useState('');
    const { width } = Dimensions.get('window');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amountText, setAmountText] = useState('');
    const [amount, setAmount] = useState<number | null>(null);
    const [attachment, setAttachment] = useState('');
    const [details, setDetails] = useState<TypedDetails>({} as TypedDetails);
    const [tx, setTx] = useState<TransferTx | undefined>();
    const [dialogVisible, setDialogVisible] = useState(false);
    const { setShowMessage, setMessageInfo } = useContext(MessageContext);
    const isEmulator = DeviceInfo.isEmulatorSync();
    const [pendingPromoCode, setPendingPromoCode] = useState('');
    const [pendingApiBody, setPendingApiBody] = useState<any>(null);

    // $LARRY
    const larryRegex = /\$LARRY$/;
    const handleCodeScanned = async (value: string) => {
        console.log('value', value);
        setShowCamera(false);

        // Check if it's a promotional URL
        if (value.startsWith('https://blog.ltonetwork.com/rwa-ownables?code=') && !isEmulator) {
            let code = value.split('code=')[1];
            try {
                const deviceId = await DeviceInfo.getUniqueId();
                const body = {
                    body: {
                        wallet: address,
                        code: code,
                        installationId: deviceId,
                        secret: 'OnlyWeKnow21fhj&&'
                    }
                }
                setPendingPromoCode(code);
                setPendingApiBody(body);
                setShowConfirmationModal(true);
                return;
            } catch (error) {
                console.error(error);
                setMessageInfo('Failed to process QR code');
                setShowMessage(true);
                return;
            }
        }

        // Handle regular wallet address scanning
        const isValid = await LTOService.isValidAddress(value);
        if (isValid) {
            setRecipientAddress(value);
            setShowTransferModal(true);
        } else {
            setMessageInfo('Invalid wallet address scanned');
            setShowMessage(true);
            return;
        }
    };

    useEffect(() => {
        if (amountText === '') {
            setAmount(0);
        } else if (!amountText.match(/^\d+(\.\d+)?$/)) {
            setAmount(null);
        } else {
            setAmount(Math.floor(parseFloat(amountText) * LTO_REPRESENTATION));
        }
    }, [amountText]);

    const getAccountAddress = async () => {
        try {
            const account = await LTOService.getAccount();
            setAddress(account.address);
            const accountDetails = await LTOService.getBalance(account.address);
            setDetails(accountDetails);
        } catch (error) {
            console.error(error);
            setMessageInfo('Error retrieving account data');
            setShowMessage(true);
            return;
        }
    };

    useEffect(() => {
        getAccountAddress();
    }, []);

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: address,
                title: 'Share LTO Wallet Address',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleSend = () => {
        const errorMessage = getErrorMessage();
        if (errorMessage !== '') {
            setMessageInfo(errorMessage);
            setShowMessage(true);
            return;
        }
        if (amount === null || amount <= 0) {
            setMessageInfo('Amount must be a valid value');
            setShowMessage(true);
            return;
        }
        if (amount > details.available) {
            setMessageInfo('Insufficient balance');
            setShowMessage(true);
            return;
        }
        if (!LTOService.isValidAddress(recipientAddress)) {
            setMessageInfo('Invalid recipient address');
            setShowMessage(true);
            return;
        }
        console.log('amount', amount);
        setTx(new TransferTx(recipientAddress, amount, attachment));
        setDialogVisible(true);
        setShowTransferModal(false);
    };

    const sendTx = async () => {
        try {
            if (!tx) throw new Error('Transaction is not defined');
            const account = await LTOService.getAccount();
            const signedTx = tx.signWith(account);
            await LTOService.broadcast(signedTx);
            setMessageInfo('Transaction sent successfully!');
            setShowMessage(true);
            navigation.goBack();
        } catch (error) {
            console.error(error);
            setMessageInfo('Failed to send transaction. Please try again later');
            setShowMessage(true);
        }
    };

    const handleCancel = () => {
        setTx(undefined);
        setDialogVisible(false);
        navigation.goBack();
    };

    const availableLTOText = formatNumber(Math.max(details.available - LTO_REPRESENTATION, 0));
    const getErrorMessage = () => {
        if (amount === null || amount < 0) return 'Invalid amount';
        if (amount > details.available) return 'Insufficient balance';
        return '';
    };

    const handleConfirmPromotion = async () => {
        setShowConfirmationModal(false);
        try {
            const response = await fetch('https://ownables-swap.lto.network/code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'OnlyWeKnow21fhj&&'
                },
                body: JSON.stringify(pendingApiBody)
            });
            console.log('response', response);
            const _response = await response.json();
            console.log('_response', _response);
            if (_response?.statusCode) {
                const status = _response.statusCode;
                console.log('status', status);
                if (status === 200 || status === 201) {
                    setPromotionCode(pendingPromoCode);
                    setShowCelebrationModal(true);
                } else if (status === 401 || status === 400) {
                    const message = _response.message;
                    if (message === 'Invalid Code') {
                        setMessageInfo("Invalid code");
                        setShowMessage(true);
                        return;
                    }
                    setMessageInfo("Thank you, your entry has been received already");
                    setShowMessage(true);
                    return;
                } else {
                    setMessageInfo('Invalid or expired QR code');
                    setShowMessage(true);
                    return;
                }
            } else {
                console.log('response.ok', response.ok);
                setMessageInfo('Invalid or expired QR code');
                setShowMessage(true);
                return;
            }
        } catch (error) {
            console.error(error);
            setMessageInfo('Failed to process QR code');
            setShowMessage(true);
        }
    };

    return (
        <Container style={styles.container}>
            <View style={{
                backgroundColor: 'transparent',
                alignItems: 'flex-end',
                justifyContent: 'center',
                width: '100%',
                height: 50,
            }}>
                <FontAwesome6 name="xmark" size={24} color="#FFFFFF" onPress={() => navigation.goBack()} style={{ paddingRight: 10 }} />
            </View>
            {showCamera ? (
                <View style={styles.cameraContainer}>
                    <QRCodeScanner onCodeScanned={handleCodeScanned} onBack={() => setShowCamera(false)} />

                </View>
            ) : (
                <View style={styles.qrContainer}>
                    <Text style={styles.title}>Your Wallet Address</Text>
                    {address ? (
                        <>
                            <QRCode value={address} size={200} />
                            <View style={styles.addressContainer}>
                                <Input
                                    placeholder="Address"
                                    value={address}
                                    editable={false}
                                    inputContainerStyle={{ borderBottomWidth: 0 }}
                                    inputStyle={styles.addressInput}
                                    style={styles.addressInputContainer}
                                    label=""
                                />
                                <FontAwesome6
                                    name="share-square"
                                    onPress={handleShare}
                                    size={18}
                                    color="#909092"
                                    style={styles.shareIcon}
                                />
                            </View>
                        </>
                    ) : (
                        <Spinner />
                    )}
                    <Button mode="contained" onPress={() => setShowCamera(true)} style={styles.button}>
                        Scan QR Code
                    </Button>
                </View>
            )}

            <BottomModal
                visible={showCelebrationModal}
                onCancel={() => {
                    setShowCelebrationModal(false);
                    navigation.goBack();
                }}
                title="🎉 Congratulations!"
                body={[
                    { text: "You've successfully claimed your promotion!", heading: true },
                    { text: `Promotion code: ${promotionCode}` }
                ]}
                submitText="Done"
                submitButtonType="primary"
                onSubmit={() => {
                    setShowCelebrationModal(false);
                    navigation.goBack();
                }}
                copyText={promotionCode}
            />

            <TransferModal
                visible={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                onSubmit={handleSend}
                amount={amountText}
                onAmountChange={setAmountText}
                note={attachment}
                onNoteChange={setAttachment}
                balance={availableLTOText}
                isValid={getErrorMessage() === ''}
                errorMessage={getErrorMessage()}
                recipientAddress={recipientAddress}
            />

            <ConfirmationDialog
                visible={dialogVisible}
                message={tx ? confirmationMessage(tx.toJSON() as TypedTransaction) : ''}
                onPress={sendTx}
                onCancel={handleCancel}
            />

            <BottomModal
                visible={showConfirmationModal}
                onCancel={() => {
                    setShowConfirmationModal(false);
                    navigation.goBack();
                }}
                title="🎟️ Claim QR Code"
                body={[
                    { text: "Would you like to claim this QR code?", heading: true },
                    { text: "This will redeem your QR code and an ownable will be sent to your wallet." }
                ]}
                submitText="Yes, Claim It"
                cancelText="No, Cancel"
                submitButtonType="primary"
                onSubmit={handleConfirmPromotion}
            />
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    qrContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
        justifyContent: 'space-evenly',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#FFFFFF',
    },
    addressContainer: {
        flexDirection: 'row',
        width: '95%',
        marginTop: 30,
        alignItems: 'center',
    },
    addressInput: {
        color: '#FFFFFF',
        fontSize: Dimensions.get('window').width * 0.035,
    },
    addressInputContainer: {
        width: '110%',
        backgroundColor: '#656565',
        borderRadius: 10,
        paddingLeft: 10,
        marginBottom: 10,
    },
    shareIcon: {
        position: 'absolute',
        right: -15,
        top: 10,
    },
    button: {
        width: '80%',
        marginTop: 20,
    },
});

export default QrReaderScreen;