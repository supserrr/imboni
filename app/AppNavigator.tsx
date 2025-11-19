import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from './context/AuthContext';
import { Login } from './screens/auth/Login';
import { SignUp } from './screens/auth/SignUp';
import { LiveMode } from './screens/user/LiveMode';
import { Settings as UserSettings } from './screens/user/Settings';
import { Home } from './screens/volunteer/Home';
import { VideoCall } from './screens/volunteer/VideoCall';
import { Settings as VolunteerSettings } from './screens/user/Settings';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * User bottom tab navigator.
 * Contains Live and Settings tabs.
 */
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tab.Screen
        name="Live"
        component={LiveMode}
        options={{
          tabBarLabel: 'Live',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={UserSettings}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Volunteer bottom tab navigator.
 * Contains Home and Settings tabs.
 */
function VolunteerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={VolunteerSettings}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Main app navigator.
 * Handles authentication flow and role-based navigation.
 */
export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
          </>
        ) : user.role === 'user' ? (
          <Stack.Screen name="UserTabs" component={UserTabs} />
        ) : user.role === 'volunteer' ? (
          <>
            <Stack.Screen name="VolunteerTabs" component={VolunteerTabs} />
            <Stack.Screen
              name="VideoCall"
              component={VideoCall}
              options={{ presentation: 'fullScreenModal' }}
            />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

