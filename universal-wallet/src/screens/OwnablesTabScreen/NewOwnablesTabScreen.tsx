import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Button, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStaticServer } from '../../hooks/useStaticServer';
import { MainScreenContainer } from '../../components/MainScreenContainer';
import OverviewHeader from '../../components/OverviewHeader';
import { StyledImage } from '../../components/styles/OverviewHeader.styles';
import { logoTitle } from '../../utils/images';
import { useNavigation } from '@react-navigation/native';
import { Icon as RneIcons } from 'react-native-elements'
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import RNFS from 'react-native-fs';
import { Modal } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { MessageContext } from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

const NewOwnablesTabScreen = () => {
    const { url, loading: serverLoading, restartServer } = useStaticServer();
    const [webViewLoading, setWebViewLoading] = useState<boolean>(true);
    const [webViewError, setWebViewError] = useState<boolean>(false);
    const [webviewUrl, setWebviewUrl] = useState<string>('');
    const webViewRef = React.useRef<WebView>(null);
    const navigation = useNavigation();
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [sdkError, setSdkError] = useState<boolean>(false);
    const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
    const [downloadModalMessage, setDownloadModalMessage] = useState<string>('');
    const { showMessage, setShowMessage, setMessageInfo, messageInfo } = useContext(MessageContext);

    useEffect(() => {
        setWebviewUrl(url);
    }, [url]);

    if (serverLoading) {
        console.log('serverLoading:', serverLoading);
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!url) {
        console.log('url:', url);
        return (
            <View style={styles.errorContainer}>
                <Text>Error: Unable to start server.</Text>
            </View>
        );
    }

    const sanitizeData = (data: any) => {
        return data.replace(/\\/g, '');
    }

    const handleMessageFromWeb = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            
            if (data.type === 'downloadOwnable') {
                const downloadOwnable = async (data: any) => {
                    try {
                        const { base64Data, filename } = data;
                        setShowDownloadModal(true);
                        setDownloadModalMessage('Requesting permissions...');
                        
                        // Check and request permissions first
                        if (Platform.OS === 'ios') {
                            const permission = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
                            if (permission !== RESULTS.GRANTED) {
                                //try to request permission
                                try {
                                    const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
                                    if (result !== RESULTS.GRANTED) {
                                        setDownloadModalMessage('Photo library permission denied');
                                        setMessageInfo('Photo library permission denied');
                                        setShowMessage(true);
                                        return;
                                    }
                                } catch (error) {
                                    console.error('Error requesting permission:', error);
                                    setDownloadModalMessage('Error requesting permission');
                                    setMessageInfo('Error requesting permission');
                                    setShowMessage(true);
                                    return;
                                }
                                setDownloadModalMessage('Please allow access to save photos');
                                const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
                                if (result !== RESULTS.GRANTED) {
                                    setDownloadModalMessage('Photo library permission denied');
                                    setMessageInfo('Photo library permission denied');
                                    setShowMessage(true);
                                    return;
                                }
                            }
                        } else if (Platform.OS === 'android') {
                            const permission = await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
                            if (permission !== RESULTS.GRANTED) {
                                setDownloadModalMessage('Please allow access to storage');
                                const result = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
                                if (result !== RESULTS.GRANTED) {
                                    setDownloadModalMessage('Storage permission denied');
                                    setMessageInfo('Storage permission denied');
                                    setShowMessage(true);
                                    return;
                                }
                            }
                        }

                        setDownloadModalMessage('Saving image...');

                        // Ensure base64 data has the correct prefix
                        let processedBase64 = base64Data;
                        if (!base64Data.startsWith('data:image')) {
                            processedBase64 = `data:image/jpeg;base64,${base64Data}`;
                        }

                        // Save to camera roll
                        await CameraRoll.save(processedBase64, {
                            type: 'photo',
                            album: 'LTO Ownables'
                        });
                        
                        setDownloadModalMessage(`Saved ${filename} to ${Platform.OS === 'ios' ? 'Photos' : 'Gallery'}`);
                        setMessageInfo(`Saved Ownable to ${Platform.OS === 'ios' ? 'Photos' : 'Gallery'}`);
                        setShowMessage(true);
                    } catch (error) {
                        console.error('Error saving image:', error);
                        setDownloadModalMessage('Error saving image');
                        setMessageInfo('Failed to save image');
                        setShowMessage(true);
                    } finally {
                        setTimeout(() => {
                            setShowDownloadModal(false);
                        }, 2000);
                    }
                };

                setShowDownloadModal(true);
                downloadOwnable(data);
            }

            if (data.type === 'sdkerror') {
                console.log('SDK error:', data.data);
                setSdkError(true);
                setWebViewError(true);
                setErrorMessage(JSON.stringify(data));
                if (webViewRef.current) {
                    webViewRef.current.stopLoading();
                    webViewRef.current.reload();
                }
                setTimeout(() => {
                    setSdkError(false);
                    setWebViewError(false);
                    setWebViewLoading(true);
                    setWebviewUrl('');
                    restartServer();
                }, 5000);
            }

            if (data.type === 'address') {
                console.log('Address:', data.data);
                setWebviewUrl(url);
                setWebViewLoading(false);
            }

            if (data.type === 'openInfo') {
                console.log('Open Info:', data.data);
                InAppBrowser.open('https://docs.ltonetwork.com/ownables/what-are-ownables');
            }
            
            if (data.type === 'openExplorer') {
                InAppBrowser.open(data.data);
            }
        } catch (error) {
            console.error('Error handling WebView message:', error);
        }
    };

    const handleShouldStartLoadWithRequest = (request: any): boolean => {
        // console.log('handleShouldStartLoadWithRequest', request.url);
        if (request.url.startsWith('data:application/zip;base64,')) {
            return false;
        }
        return true;
    };

    return (
        <View style={{ flex: 1 }}>
            {webViewLoading && !sdkError && (
                <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="large" />
                    <Button
                        title="Reload"
                        onPress={() => {
                            setWebViewLoading(true);
                            setWebviewUrl('');
                            restartServer();
                        }}
                    />
                </View>
            )}
            <MainScreenContainer disableScroll={true}>
                <OverviewHeader
                    icon="menu"
                    onPress={() => navigation.navigate('Menu' as never)}
                    hideQR={true}
                    input={<StyledImage testID="logo-title" source={logoTitle} />}
                />
                <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
                    <WebView
                        ref={webViewRef}
                        style={{ flex: 1 }}
                        source={{
                            uri: webviewUrl,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'Expires': '0',
                            },
                        }}
                        originWhitelist={['*']}
                        allowUniversalAccessFromFileURLs={true}
                        allowFileAccessFromFileURLs={true}
                        onMessage={handleMessageFromWeb}
                        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                        onLoadStart={() => {
                            setWebViewLoading(true);
                        }}
                        onLoadEnd={() => {
                            setWebViewLoading(false);
                            const seed = LTOService.getSeed();
                            if (!seed) {
                                navigation.navigate('Root' as never);
                                return;
                            }
                            if (webViewRef.current) {
                                webViewRef.current.injectJavaScript(`window.localStorage.setItem('@seed', '${seed}')`);
                            }
                        }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn('WebView error: ', nativeEvent);
                            setErrorMessage(JSON.stringify(nativeEvent));
                            setWebViewError(true);
                            restartServer();
                        }}
                    />
                </View>
            </MainScreenContainer>
            <Modal
                animationType="slide"
                transparent={true}
                visible={showDownloadModal}
                onRequestClose={() => {
                    setShowDownloadModal(false);
                }}
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: 20,
                }}>
                    <ActivityIndicator size="large" />
                    <Text style={{ color: 'white' }}>{downloadModalMessage}</Text>
                </View>
            </Modal>
            {/* BT: Left it here for debugging purposes */}
            {/* {webViewError && (
                <View style={styles.errorOverlay}>
                    <Text style={styles.errorText}>Error from Ownable SDK</Text>
                    <Button
                        title="Retry"
                        onPress={() => {
                            setWebViewError(false);
                            setWebViewLoading(true);
                            setWebviewUrl('');
                            restartServer();
                        }}
                    />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            )} */}

        </View>
    );
};

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    loaderOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        padding: 16,
        zIndex: 1,
    },
    errorText: {
        marginBottom: 8,
        fontSize: 16,
        color: 'red',
    },
});

export default NewOwnablesTabScreen;