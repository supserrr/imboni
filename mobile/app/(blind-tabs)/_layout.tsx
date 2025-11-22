import { withLayoutContext } from 'expo-router';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useCall } from '../../context/CallContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { Navigator } = createNativeBottomTabNavigator();

const NativeTabs = withLayoutContext(Navigator);

export default function BlindTabLayout() {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const { isCallActive } = useCall();
  const insets = useSafeAreaInsets();

  const defaultTabBarStyle = {
    backgroundColor: 'transparent',
    position: 'absolute' as const,
  };

  const hiddenTabBarStyle = {
    position: 'absolute' as const,
    bottom: -200, // Move completely off screen
    height: 0,
    width: 0,
    opacity: 0,
    pointerEvents: 'none' as const,
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 0,
  };

  return (
    <NativeTabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: dark ? '#8E8E93' : 'rgba(232, 212, 232, 0.6)',
        tabBarBlurEffect: dark ? 'systemMaterialDark' : 'systemMaterial',
        tabBarStyle: isCallActive ? hiddenTabBarStyle : defaultTabBarStyle,
      }}
    >
      <NativeTabs.Screen
        name="home"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => 
            Platform.OS === 'ios'
              ? {
                  type: 'sfSymbol',
                  name: focused ? 'eye.fill' : 'eye',
                  // @ts-ignore: internal incompatibility between bottom-tabs and react-native-screens
                  sfSymbolName: focused ? 'eye.fill' : 'eye',
                }
              : undefined,
        }}
      />
      <NativeTabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ focused }) =>
            Platform.OS === 'ios'
              ? {
                  type: 'sfSymbol',
                  name: focused ? 'gearshape.fill' : 'gearshape',
                  // @ts-ignore: internal incompatibility between bottom-tabs and react-native-screens
                  sfSymbolName: focused ? 'gearshape.fill' : 'gearshape',
                }
              : undefined,
        }}
      />
    </NativeTabs>
  );
}

