import { AppRegistry } from 'react-native';
import { View } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

const MainComponent = () => {
    return (
        <View style={{flex:1}}>
            <App />
        </View>
    )
}

AppRegistry.registerComponent(appName, () => MainComponent);
