import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Button, Platform, Linking, Share } from 'react-native';
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
import { MessageContext } from '../../context/UserMessage.context';
import LTOService from '../../services/LTO.service';

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

    const openFileLocation = async (path: string) => {
        if (Platform.OS === 'ios') {
            try {
                // Use Share API instead of direct file opening on iOS
                await Share.share({
                    url: path,
                    message: 'Your ownable has been downloaded'
                });
            } catch (error) {
                console.error('Error sharing file:', error);
            }
        } else {
            // Keep existing behavior for Android
            Linking.openURL(`file://${path}`)
                .then(() => console.log('File opened successfully'))
                .catch((error: any) => console.error('Error opening file:', error));
        }
    }

    const downloadOwnable = async (data: any) => {
        const { base64Data, filename } = data;
        const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
        setDownloadModalMessage(`Downloading ${filename}...`);
        try {
            await RNFS.writeFile(path, base64Data, 'base64');
            console.log('File written to', path);
            setDownloadModalMessage(`Downloaded ${filename} successfully!`);
            setMessageInfo(`Downloaded Ownable to ${Platform.OS === 'android' ? 'Downloads' : 'Files'}`);
            setShowMessage(true);
            openFileLocation(path);
        } catch (error: any) {
            console.error('Error writing file:', error);
            setDownloadModalMessage(`Error downloading ${filename}. Please try again.`);
        } finally {
            setTimeout(() => {
                setShowDownloadModal(false);
            }, 3000);
        }
    }

    const downloadImage = async (data: any) => {
        const { image, filename } = data;
        const path = `${RNFS.DocumentDirectoryPath}/${filename}`;
        setDownloadModalMessage(`Downloading ${filename}...`);
        try {
            await RNFS.writeFile(path, image, 'base64');
            console.log('File written to', path);
            setDownloadModalMessage(`Downloaded ${filename} successfully!`);
            setMessageInfo(`Downloaded Image to ${Platform.OS === 'android' ? 'Downloads' : 'Files'}`);
            setShowMessage(true);
            openFileLocation(path);
        } catch (error: any) {
            console.error('Error writing file:', error);
            setDownloadModalMessage(`Error downloading ${filename}. Please try again.`);
        } finally {
            setTimeout(() => {
                setShowDownloadModal(false);
            }, 3000);
        }
    }

    const handleMessageFromWeb = (event: any) => {
        try {
            // console.log('url:', url);
            // console.log('Message from WebView', event.nativeEvent.data);
            const data = JSON.parse(event.nativeEvent.data);
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

            if (data.type === 'downloadOwnable') {
                downloadOwnable(data);
                return;

            }

            if (data.type === 'downloadImage') {
                downloadImage(data);
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
            console.error('Error parsing message from WebView:', error);
        }

    }

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
                    icon={'menu'}
                    onPress={() => navigation.navigate('Menu')}
                    hideQR={true}
                    input={<StyledImage testID="logo-title" source={logoTitle} />}
                />
                <>
                    {!sdkError && <WebView
                        ref={webViewRef}
                        backgroundColor="#0D0D0D"
                        source={{
                            uri: webviewUrl,
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'Expires': '0',
                            },

                        }}
                        allowsUnsecureHttps={true}
                        originWhitelist={['*']}
                        allowUniversalAccessFromFileURLs={true}
                        allowFileAccessFromFileURLs={true}
                        incognito={false}
                        onMessage={handleMessageFromWeb}
                        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
                        onLoadStart={() => {
                            setWebViewLoading(true);
                        }}
                        onLoadEnd={() => {
                            setWebViewLoading(false);
                            const seed = LTOService.getSeed();
                            if (!seed) {
                                navigation.navigate('Root');
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
                        style={{ flex: 1, backgroundColor: '#0D0D0D' }}
                    />}
                </>
                {
                    sdkError && (
                        <View style={
                            {
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 10,
                                borderRadius: 10,
                                top: "50%",
                            }
                        }>
                            <View style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <RneIcons
                                    name="warning"
                                    type='font-awesome'
                                    color={'white'}
                                    size={15}
                                    style={{ backgroundColor: '#35363b', borderRadius: 100, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}
                                />
                                <Text style={{ color: 'white', fontSize: 14 }}> Ownable Module Timeout</Text>
                            </View>
                            <Button
                                title="Relaunch"
                                onPress={() => {
                                    setSdkError(false);
                                    setWebViewError(false);
                                    setWebViewLoading(true);
                                    setWebviewUrl('');
                                    restartServer();
                                }}
                            />
                        </View>
                    )
                }
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