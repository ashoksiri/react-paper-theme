import * as React from 'react';
import { I18nManager } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme, InitialState,
    NavigationContainer
} from '@react-navigation/native';

import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';

import {
    adaptNavigationTheme, MD2DarkTheme,
    MD2LightTheme,
    MD2Theme, MD3DarkTheme,
    MD3LightTheme, MD3Theme, Provider as PaperProvider, useTheme
} from 'react-native-paper';

import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { isWeb } from '../utils';
import DrawerItems from './DrawerItems';
import App from './RootNavigator';

const PERSISTENCE_KEY: string = 'NAVIGATION_STATE';
const PREFERENCES_KEY: string = 'APP_PREFERENCES';

export const PreferencesContext: React.Context<any> = React.createContext<any>(null);

export const useExampleTheme = () => useTheme<MD2Theme | MD3Theme>();

const DrawerContent = (): JSX.Element => {
    return (
        <PreferencesContext.Consumer>
            {preferences => (
                <DrawerItems
                    toggleTheme={preferences.toggleTheme}
                    toggleRTL={preferences.toggleRtl}
                    toggleThemeVersion={preferences.toggleThemeVersion}
                    toggleCollapsed={preferences.toggleCollapsed}
                    collapsed={preferences.collapsed}
                    isRTL={preferences.rtl}
                    isDarkTheme={preferences.theme.dark}
                />
            )}
        </PreferencesContext.Consumer>
    );
};

const Drawer = createDrawerNavigator<{ Home: undefined }>();

export default function PaperExample(): (JSX.Element | null) {
    useKeepAwake();

    const [isReady, setIsReady] = React.useState(false);
    const [initialState, setInitialState] = React.useState<
        InitialState | undefined
    >();

    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [themeVersion, setThemeVersion] = React.useState<2 | 3>(3);
    const [rtl, setRtl] = React.useState<boolean>(
        I18nManager.getConstants().isRTL
    );
    const [collapsed, setCollapsed] = React.useState(false);

    const themeMode = isDarkMode ? 'dark' : 'light';

    const theme: (MD2Theme | MD3Theme) = {
        2: {
            light: MD2LightTheme,
            dark: MD2DarkTheme,
        },
        3: {
            light: MD3LightTheme,
            dark: MD3DarkTheme,
        },
    }[themeVersion][themeMode];

    React.useEffect(() => {
        const restoreState = async (): Promise<void> => {
            try {
                const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
                const state = JSON.parse(savedStateString || '');

                setInitialState(state);
            } catch (e) {
                // ignore error
            } finally {
                setIsReady(true);
            }
        };

        if (!isReady) {
            restoreState();
        }
    }, [isReady]);

    React.useEffect(() => {
        const restorePrefs = async (): Promise<void> => {
            try {
                const prefString = await AsyncStorage.getItem(PREFERENCES_KEY);
                const preferences = JSON.parse(prefString || '');

                if (preferences) {
                    setIsDarkMode(preferences.theme === 'dark');

                    if (typeof preferences.rtl === 'boolean') {
                        setRtl(preferences.rtl);
                    }
                }
            } catch (e) {
                // ignore error
            }
        };

        restorePrefs();
    }, []);

    React.useEffect(() => {
        const savePrefs = async (): Promise<void> => {
            try {
                await AsyncStorage.setItem(
                    PREFERENCES_KEY,
                    JSON.stringify({
                        theme: themeMode,
                        rtl,
                    })
                );
            } catch (e) {
                // ignore error
            }

            if (I18nManager.getConstants().isRTL !== rtl) {
                I18nManager.forceRTL(rtl);
                if (!isWeb) {
                    Updates.reloadAsync();
                }
            }
        };

        savePrefs();
    }, [rtl, themeMode]);

    const preferences = React.useMemo(
        () => ({
            toggleTheme: () => setIsDarkMode((oldValue) => !oldValue),
            toggleRtl: () => setRtl((rtl) => !rtl),
            toggleCollapsed: () => setCollapsed(!collapsed),
            toggleThemeVersion: () =>
                setThemeVersion((oldThemeVersion) => (oldThemeVersion === 2 ? 3 : 2)),
            collapsed,
            rtl,
            theme,
        }),
        [rtl, theme, collapsed]
    );

    if (!isReady) {
        return null;
    }

    const { LightTheme, DarkTheme } = adaptNavigationTheme({
        reactNavigationLight: NavigationDefaultTheme,
        reactNavigationDark: NavigationDarkTheme,
    });

    const CombinedDefaultTheme = {
        ...MD3LightTheme,
        ...LightTheme,
        colors: {
            ...MD3LightTheme.colors,
            ...LightTheme.colors,
        },
    };

    const CombinedDarkTheme = {
        ...MD3DarkTheme,
        ...DarkTheme,
        colors: {
            ...MD3DarkTheme.colors,
            ...DarkTheme.colors,
        },
    };

    const combinedTheme = isDarkMode ? CombinedDarkTheme : CombinedDefaultTheme;

    return (
        <PaperProvider theme={theme}>
            <PreferencesContext.Provider value={preferences}>
                <React.Fragment>
                    <NavigationContainer
                        initialState={initialState}
                        theme={combinedTheme}
                        onStateChange={(state) =>
                            AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
                        }>
                        {isWeb
                            ? <App />
                            : <SafeAreaInsetsContext.Consumer>
                                {insets => {
                                    const { left, right } = insets || { left: 0, right: 0 };
                                    const collapsedDrawerWidth = 80 + Math.max(left, right);

                                    return (
                                        <Drawer.Navigator
                                            screenOptions={{
                                                drawerStyle: collapsed && {
                                                    width: collapsedDrawerWidth,
                                                },
                                            }}
                                            drawerContent={() => <DrawerContent />}
                                        >
                                            <Drawer.Screen
                                                name="Home"
                                                component={App}
                                                options={{ headerShown: false }}
                                            />
                                        </Drawer.Navigator>
                                    );
                                }}
                            </SafeAreaInsetsContext.Consumer>
                        }
                        <StatusBar style={!theme.isV3 || theme.dark ? 'light' : 'dark'} />
                    </NavigationContainer>
                </React.Fragment>
            </PreferencesContext.Provider>
        </PaperProvider>
    );
}
