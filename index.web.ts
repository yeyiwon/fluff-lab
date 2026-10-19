import { registerRootComponent } from 'expo';
import App from './src/App';
import Studio from './src/studio/Studio.web';
registerRootComponent(new URLSearchParams(window.location.search).has('studio') ? Studio : App);
