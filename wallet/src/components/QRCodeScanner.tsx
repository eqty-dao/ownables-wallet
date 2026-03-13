import React, { useState, useEffect } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { Camera, useCameraPermission, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

interface QRCodeScannerProps {
  onCodeScanned: (value: string) => void;
  enabled?: boolean;
  onBack: () => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onCodeScanned,
  enabled = true,
  onBack
}) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [isActive, setIsActive] = useState(false);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      console.log('codes', codes);
      if (codes[0]?.value) {
        onCodeScanned(codes[0].value);
      }
    },
  });

  useEffect(() => {
    const initializeCamera = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
      setTimeout(() => setIsActive(true), 300);
    };

    initializeCamera();
  }, [hasPermission, requestPermission]);
  
  const { width, height } = useWindowDimensions();

  if (!enabled || !hasPermission || !device) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        width: width,
        height: height,
      }}>
        <Text>No permission</Text>
        <TouchableOpacity onPress={onBack} style={{
       marginTop: 20,
      }}>
        <FontAwesome6 name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={{
       marginTop: 20,
      }}>
        <FontAwesome6 name="arrow-left" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      <Camera
        style={{
          marginTop: 20,
          width: width * 0.9,
          height: height * 0.9,
        }}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
