declare module 'react-native-qr-scanner' {
  import { Component } from 'react';

  interface QRScannerProps {
    onRead: (data: string) => void;
    renderBottomView: () => React.ReactNode;
    style?: any;
    hintText?: string;
    rectHeight?: number;
    rectWidth?: number;
    cornerOffsetSize?: number;
    cornerColor?: string;
    cornerBorderWidth?: number;
    cornerBorderLength?: number;
    isCornerOffset?: boolean;
    bottomHeight?: number;
    scanBarAnimateTime?: number;
    scanBarColor?: string;
    scanBarHeight?: number;
    scanBarMargin?: number;
    hintTextPosition?: number;
  }
  
  export default class QRScanner extends Component<QRScannerProps> {}
} 