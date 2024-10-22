const sendRNPostMessage = (data: string) => window.ReactNativeWebView.postMessage(data);

export {
    sendRNPostMessage
}