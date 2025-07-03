/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import {main} from "./main/Main";

AppRegistry.registerComponent(appName, () => main);
