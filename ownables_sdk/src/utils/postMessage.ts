const sendRNPostMessage = (data: string) => {
  if (window?.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(data);
  }else{
    console.log('window.ReactNativeWebView not found', data);
  }
};
export {
    sendRNPostMessage
}
