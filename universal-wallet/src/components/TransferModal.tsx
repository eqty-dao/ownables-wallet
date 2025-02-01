import React from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Input } from 'react-native-elements';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

interface TransferModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: () => void;
    amount: string;
    onAmountChange: (text: string) => void;
    note: string;
    onNoteChange: (text: string) => void;
    balance: string;
    isValid: boolean;
    errorMessage?: string;
    recipientAddress: string;
}
export const TransferModal: React.FC<TransferModalProps> = ({
    visible,
    onClose,
    onSubmit,
    amount,
    onAmountChange,
    note,
    onNoteChange,
    balance,
    isValid,
    errorMessage,
    recipientAddress
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Send LTO</Text>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome6 name="xmark" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.balanceText}>Available Balance: {balance} LTO</Text>
                    <Text style={styles.balanceText}>Recipient Address: {recipientAddress}</Text>

                    <Input
                        label="Amount"
                        placeholder="Enter amount"
                        value={amount}
                        onChangeText={onAmountChange}
                        keyboardType="numeric"
                        errorMessage={errorMessage}
                        labelStyle={styles.label}
                        inputStyle={styles.input}
                        containerStyle={styles.inputContainer}
                    />

                    <Input
                        label="Note (optional)"
                        placeholder="Add a note"
                        value={note}
                        onChangeText={onNoteChange}
                        multiline
                        maxLength={100}
                        labelStyle={styles.label}
                        inputStyle={styles.input}
                        containerStyle={styles.inputContainer}
                    />

                    <View style={styles.feeContainer}>
                        <Text style={styles.feeText}>Network Fee:</Text>
                        <Text style={styles.feeAmount}>0.08 LTO</Text>
                    </View>

                    <Button
                        onPress={onSubmit}
                        disabled={!isValid}
                        style={[styles.button, !isValid && styles.buttonDisabled]}
                        mode="contained"
                        contentStyle={{
                            height: 50,
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={styles.buttonText}>Send LTO</Text>
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: '50%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    balanceText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 20,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    input: {
        color: '#FFFFFF',
    },
    inputContainer: {
        marginBottom: 15,
    },
    feeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2E2E2E',
        padding: 15,
        borderRadius: 10,
        marginVertical: 15,
    },
    feeText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    feeAmount: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    button: {
        marginTop: 20,
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 