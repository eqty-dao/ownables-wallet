import { useUserSettings } from './../context/User.context';
import StaticServer from '@dr.pogodin/react-native-static-server';
import { useState, useEffect } from 'react';
import RNFS from 'react-native-fs';
import LTOService from '../services/LTO.service';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';
// import { SECURE_KEY } from '@env';

export const ASSETS_FOLDER_NAME: string = 'build';
export const DOCUMENT_FOLDER_PATH: string = `${RNFS.DocumentDirectoryPath}/${ASSETS_FOLDER_NAME}`;


const debugUrl = Platform.OS == "ios" ? 'http://localhost:3001/' : 'http://10.0.0.53:3001';
const SECURE_KEY = 'asdsadsada324e23jen32jkbr2kbr2k4';

export const encryptData = (data: string): string => {
  const key = SECURE_KEY;
  return CryptoJS.AES.encrypt(data, key).toString().replace('==', '');
};

export const decryptData = (encryptedData: string): string => {
  const key = SECURE_KEY;
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  const _ = bytes.toString(CryptoJS.enc.Utf8);
  //console.log('decryptedData:', _);
  return _;
};

const useStaticServer = () => {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [server, setServer] = useState<StaticServer | null>(null);
  const navigation = useNavigation();
  const { network, env } = useUserSettings();

  const restartServer = async () => {
    if (server) {
      setUrl('');
      await server.stop();
      startServer();
    } else {
      startServer();
    }
  }

  const startServer = async (): Promise<void> => {
    console.log('startServer');
    if (Platform.OS === 'android') {
      try {
        await copyAssetsFolderContents(ASSETS_FOLDER_NAME, DOCUMENT_FOLDER_PATH);
      } catch (error) {
        console.error('Failed to copy assets folder contents:', error);
        return;
      }
    }
    const path: string = Platform.OS === 'ios' ? RNFS.MainBundlePath + '/build' : DOCUMENT_FOLDER_PATH;
    const _server = new StaticServer(9090, path, { localOnly: true, keepAlive: true });
    setServer(_server);
    try {
      const seed = LTOService.getSeed();
      console.log('seed:', seed);
      // const encryptedSeed = encryptData(seed);
      if (!seed) {
        navigation.navigate('Root');
        return;
      }
      const serverUrl = debugUrl ? debugUrl : await _server.start();
      console.log('Server started at:', serverUrl);
      setUrl(`${serverUrl}?seed=${seed}&network=${network}&env=${env}`);
    } catch (error) {
      console.error('Failed to start server:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startServer();
    return () => {
      //@ts-ignore
      server?.stop();
    };
  }, []);

  useEffect(() => {
    if (!server) return;
    if (debugUrl) {
      return;
    }
    if (Platform.OS === 'android') {
      return;
    }
    // server.isRunning().then((running: boolean) => {
    //   console.log('server.isRunning:', running);
    //   if (!running) {
    //     setUrl('');
    //     setLoading(true);
    //     startServer();
    //   }
    // });
  }, [server?.isRunning()]);
  return { url, loading, restartServer };
};

export { useStaticServer };





export const copyAssetsFolderContents = async (
  sourcePath: string,
  targetPath: string,
): Promise<void> => {
  try {
    console.log('sourcePath:', sourcePath);
    console.log('targetPath:', targetPath);
    const items = await RNFS.readDirAssets(sourcePath);
    const targetExists = await RNFS.exists(targetPath);
    if (!targetExists) {
      await RNFS.mkdir(targetPath);
    }


    for (const item of items) {
      const sourceItemPath = `${sourcePath}/${item.name}`;
      const targetItemPath = `${targetPath}/${item.name}`;


      if (item.isDirectory()) {
        await copyAssetsFolderContents(sourceItemPath, targetItemPath);
      } else {
        await RNFS.copyFileAssets(sourceItemPath, targetItemPath);
      }
    }
  } catch (error) {
    console.error('Failed to copy assets folder contents:', error);
    throw error;
  }
};
