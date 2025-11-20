import { withLayoutContext } from 'expo-router';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

const { Navigator } = createNativeBottomTabNavigator();

const NativeTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs screenOptions={{ headerShown: false }}>
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
