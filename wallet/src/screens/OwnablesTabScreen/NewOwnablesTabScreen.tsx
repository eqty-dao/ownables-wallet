import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Button, Platform, Linking, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStaticServer } from '../../hooks/useStaticServer';
import { MainScreenContainer } from '../../components/MainScreenContainer';
import OverviewHeader from '../../components/OverviewHeader';
import { StyledImage } from '../../components/styles/OverviewHeader.styles';
import { logoTitle } from '../../utils/images';
import { Icon as RneIcons } from 'react-native-elements'
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import RNFS from 'react-native-fs';
import { Modal } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission, PermissionStatus } from 'react-native-permissions';
import { MessageContext } from '../../context/UserMessage.context';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

interface DownloadOwnableData {
    type: 'downloadOwnable';
    base64Data: string;
    filename: string;
}

interface SdkErrorData {
    type: 'sdkerror';
    data: any;
}

interface AddressData {
    type: 'address';
    data: any;
}

interface OpenInfoData {
    type: 'openInfo';
    data: any;
}

interface OpenExplorerData {
    type: 'openExplorer';
    data: any;
}

type WebViewMessage = DownloadOwnableData | SdkErrorData | AddressData | OpenInfoData | OpenExplorerData;

interface WebViewMessageEvent {
    nativeEvent: {
        data: string;
    };
}

interface WebViewRequest {
    url: string;
    loading?: boolean;
    title?: string;
    canGoBack?: boolean;
    canGoForward?: boolean;
    lockIdentifier?: number;
}

interface WebViewError {
    code?: number;
    description?: string;
    url?: string;
    loading?: boolean;
    title?: string;
    canGoBack?: boolean;
    canGoForward?: boolean;
    lockIdentifier?: number;
}

const NewOwnablesTabScreen = () => {
    const { url, loading: serverLoading, restartServer } = useStaticServer();
    const [webViewLoading, setWebViewLoading] = useState<boolean>(true);
    const [webViewError, setWebViewError] = useState<boolean>(false);
    const [webviewUrl, setWebviewUrl] = useState<string>('');
    const webViewRef = React.useRef<WebView>(null);
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

    const hasAndroidPermission = async () => {
        const getCheckPermissionPromise = () => {
            if (Number(Platform.Version) >= 33) {
                return Promise.all([
                    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
                    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
                ]).then(
                    ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
                        hasReadMediaImagesPermission && hasReadMediaVideoPermission,
                );
            } else {
                return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            }
        };

        const hasPermission = await getCheckPermissionPromise();
        if (hasPermission) {
            return true;
        }

        const getRequestPermissionPromise = () => {
            if (Number(Platform.Version) >= 33) {
                return PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
                    PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
                ]).then(
                    (statuses) =>
                        statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
                        PermissionsAndroid.RESULTS.GRANTED &&
                        statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
                        PermissionsAndroid.RESULTS.GRANTED,
                );
            } else {
                return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE)
                    .then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
            }
        };

        return await getRequestPermissionPromise();
    };

    const handleMessageFromWeb = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data) as WebViewMessage;
            console.log('data:', data);
            if (data.type === 'downloadOwnable') {
                const downloadOwnable = async (downloadData: DownloadOwnableData) => {
                    try {
                        const { base64Data, filename } = downloadData;
                        console.log('filename:', filename);
                        setShowDownloadModal(true);
                        setDownloadModalMessage('Requesting permissions...');

                        // Check and request permissions first
                        if (Platform.OS === 'ios') {
                            try {
                                const permission = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
                                console.log('Current permission status:', permission);
                                
                                if (permission === RESULTS.DENIED) {
                                    const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
                                    if (result !== RESULTS.GRANTED && result !== RESULTS.LIMITED) {
                                        setShowDownloadModal(true);
                                        setDownloadModalMessage('Photo library permission denied. Please enable in Settings.');
                                        setTimeout(() => {
                                            setShowDownloadModal(false);
                                            Linking.openSettings();
                                        }, 2000);
                                        return;
                                    }
                                } else if (permission === RESULTS.BLOCKED) {
                                    setShowDownloadModal(true);
                                    setDownloadModalMessage('Photo library access is blocked. Please enable in Settings.');
                                    setTimeout(() => {
                                        setShowDownloadModal(false);
                                        Linking.openSettings();
                                    }, 2000);
                                    return;
                                }
                            } catch (error) {
                                console.error('Permission check error:', error);
                                setDownloadModalMessage('Error checking permissions');
                                setMessageInfo('Error checking permissions');
                                setShowMessage(true);
                                return;
                            }
                        } else if (Platform.OS === 'android') {
                            const hasPermission = await hasAndroidPermission();
                            if (!hasPermission) {
                                setDownloadModalMessage('Storage permission denied');
                                setMessageInfo('Storage permission denied');
                                setShowMessage(true);
                                setTimeout(() => {
                                    setShowDownloadModal(false);
                                }, 2000);
                                return;
                            }
                        }

                        setDownloadModalMessage('Processing image...');

                        try {
                            // Validate and process base64 data
                            if (!base64Data || typeof base64Data !== 'string') {
                                throw new Error('Invalid image data');
                            }

                            // Clean and process the base64 string
                            let processedBase64 = base64Data;
                            if (!base64Data.startsWith('data:image')) {
                                // Remove any potential prefixes
                                processedBase64 = base64Data.replace(/^data:.*?;base64,/, '');
                                // Keep the original format (WebP)
                                processedBase64 = `data:image/webp;base64,${processedBase64}`;
                            } else {
                                // Fix any malformed data URI
                                processedBase64 = processedBase64.replace(/^data:image\/image\//, 'data:image/');
                            }

                            // Clean the base64 string
                            processedBase64 = processedBase64.trim();

                            // For debugging
                            console.log('Saving image with length:', processedBase64.length);
                            console.log('Base64 string starts with:', processedBase64.substring(0, 50));

                            setDownloadModalMessage('Saving image...');

                            // Create a proper filename
                            const cleanFilename = (filename || 'temp_image')
                                .replace(/\.[^/.]+$/, "") // Remove extension
                                .replace(/[^a-zA-Z0-9]/g, '_') // Replace any non-alphanumeric chars with underscore
                                .replace(/_+/g, '_') // Replace multiple underscores with single
                                .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

                            if (Platform.OS === 'ios') {
                                const photoDir = `${RNFS.DocumentDirectoryPath}/Photos`;
                                const finalPath = `${photoDir}/${cleanFilename}.jpg`;

                                // Create Photos directory if it doesn't exist
                                await RNFS.mkdir(photoDir).catch(() => { });

                                try {
                                    // Extract just the base64 data without the data URI prefix
                                    const base64Data = processedBase64.replace(/^data:image\/\w+;base64,/, '');

                                    // Save as JPEG directly
                                    await RNFS.writeFile(finalPath, base64Data, 'base64');

                                    // Verify file exists and has content
                                    const fileExists = await RNFS.exists(finalPath);
                                    if (!fileExists) {
                                        throw new Error('File was not created successfully');
                                    }

                                    const fileStats = await RNFS.stat(finalPath);
                                    console.log('File size:', fileStats.size);

                                    if (fileStats.size === 0) {
                                        throw new Error('File is empty');
                                    }

                                    // Save to photo library
                                    await CameraRoll.save(`file://${finalPath}`, {
                                        type: 'photo',
                                        album: 'LTO Wallet'
                                    });

                                    // Clean up temporary file
                                    await RNFS.unlink(finalPath).catch(() => { });
                                } catch (error: any) {
                                    console.error('Photo saving error:', error);
                                    // Try to clean up the file even if saving failed
                                    await RNFS.unlink(finalPath).catch(() => { });
                                    if (error?.message?.includes('permission')) {
                                        setShowDownloadModal(true);
                                        setDownloadModalMessage('Photo library permission required');
                                        setTimeout(() => {
                                            setShowDownloadModal(false);
                                            Linking.openSettings();
                                        }, 2000);
                                        return;
                                    }
                                    throw error;
                                }
                            } else {
                                // Android path
                                const finalPath = `${RNFS.PicturesDirectoryPath}/LTO Wallet/${cleanFilename}.webp`;
                                await RNFS.mkdir(`${RNFS.PicturesDirectoryPath}/LTO Wallet`).catch(() => { });
                                await RNFS.writeFile(finalPath, processedBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                            }

                            setDownloadModalMessage(`Saved to ${Platform.OS === 'ios' ? 'Photos' : 'Gallery'}`);
                            setMessageInfo(`Saved Ownable to ${Platform.OS === 'ios' ? 'Photos' : 'Gallery'}`);
                            setShowMessage(true);

                        } catch (saveError) {
                            console.error('Error saving to camera roll:', saveError);
                            setDownloadModalMessage('Failed to save image');
                            setMessageInfo('Failed to save image');
                            setShowMessage(true);
                        }
                    } catch (error) {
                        console.error('Error in downloadOwnable:', error);
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

    const handleShouldStartLoadWithRequest = (request: WebViewRequest): boolean => {
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
                        }}
                        onError={(syntheticEvent: { nativeEvent: WebViewError }) => {
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
