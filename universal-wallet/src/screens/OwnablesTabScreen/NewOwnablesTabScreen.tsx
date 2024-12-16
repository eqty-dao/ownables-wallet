import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Button } from 'react-native';
import { WebView } from 'react-native-webview';
import { useStaticServer } from '../../hooks/useStaticServer';
import { MainScreenContainer } from '../../components/MainScreenContainer';
import OverviewHeader from '../../components/OverviewHeader';
import { StyledImage } from '../../components/styles/OverviewHeader.styles';
import { logoTitle } from '../../utils/images';
import { useNavigation } from '@react-navigation/native';
import { Icon as RneIcons } from 'react-native-elements'
import { InAppBrowser } from 'react-native-inappbrowser-reborn';


const NewOwnablesTabScreen = () => {
    const { url, loading: serverLoading, restartServer } = useStaticServer();
    const [webViewLoading, setWebViewLoading] = useState<boolean>(true);
    const [webViewError, setWebViewError] = useState<boolean>(false);
    const [webviewUrl, setWebviewUrl] = useState<string>('');
    const webViewRef = React.useRef<WebView>(null);
    const navigation = useNavigation();
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [sdkError, setSdkError] = useState<boolean>(false);

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
        const data = sanitizeData(JSON.parse(event.nativeEvent.data));
        if (data.type === 'sdkerror') {
            console.log('SDK error:', data.data);
            setSdkError(true);
            // setWebViewError(true);
            // setErrorMessage(JSON.stringify(data));
            // if (webViewRef.current) {
            //     webViewRef.current.stopLoading();
            //     webViewRef.current.reload();
            // }
            // restartServer();
        }

        if (data.type === 'address') {
            console.log('Address:', data.data);
            setWebviewUrl(url);
            setWebViewLoading(false);
        }
        if (data.type === 'openInfo') {
            console.log('Open Info:', data.data);
            InAppBrowser.open('https://lto.network');
        }

    }

    const handleShouldStartLoadWithRequest = (request: any): boolean => {
        console.log('handleShouldStartLoadWithRequest', request.url);
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
                            //@ts-ignore
                            cacheMode: 'LOAD_CACHE_ELSE_NETWORK',
                            cacheEnabled: true
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
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: 'transparent',
                                zIndex: 1,
                                height: '100%',
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