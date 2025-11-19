import { render } from '@testing-library/react-native';
import React from 'react';
import { View, Text } from 'react-native';

// Simple test to verify setup
test('renders correctly', () => {
  const { getByText } = render(
    <View>
      <Text>Hello World</Text>
    </View>
  );
  expect(getByText('Hello World')).toBeTruthy();
});

