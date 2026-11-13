import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeContext';
import { lightColors, darkColors } from '../../src/theme/colors';

// Helper component that exposes theme values for testing
function ThemeConsumer() {
  const theme = useTheme();
  return (
    <>
      <Text testID="mode">{theme.mode}</Text>
      <Text testID="surface">{theme.colors.surface}</Text>
      <Text testID="statusBar">{theme.statusBarStyle}</Text>
      <Pressable testID="set-light" onPress={() => theme.setMode('light')} />
      <Pressable testID="set-dark" onPress={() => theme.setMode('dark')} />
      <Pressable testID="set-system" onPress={() => theme.setMode('system')} />
    </>
  );
}

// Control the useColorScheme mock
let mockColorScheme: 'light' | 'dark' | null = 'light';
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockColorScheme,
}));

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockColorScheme = 'light';
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('defaults to system mode', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(getByTestId('mode').props.children).toBe('system');
  });

  it('returns light colors when mode is light', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('set-light'));
    });

    expect(getByTestId('mode').props.children).toBe('light');
    expect(getByTestId('surface').props.children).toBe(lightColors.surface);
  });

  it('returns dark colors when mode is dark', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('set-dark'));
    });

    expect(getByTestId('mode').props.children).toBe('dark');
    expect(getByTestId('surface').props.children).toBe(darkColors.surface);
  });

  it('follows system preference when mode is system', async () => {
    mockColorScheme = 'dark';
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    // Default mode is 'system', and system is dark
    expect(getByTestId('mode').props.children).toBe('system');
    expect(getByTestId('surface').props.children).toBe(darkColors.surface);
  });

  it('persists theme choice to AsyncStorage', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('set-dark'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@medibuddy_theme_mode',
      'dark'
    );
  });

  it('loads saved theme on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');

    let result: ReturnType<typeof render> | undefined;
    await act(async () => {
      result = await render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );
    });

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@medibuddy_theme_mode');
    expect(result!.getByTestId('mode').props.children).toBe('dark');
    expect(result!.getByTestId('surface').props.children).toBe(darkColors.surface);
  });

  it('setMode cycles through light → dark → system', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    // Start at system
    expect(getByTestId('mode').props.children).toBe('system');

    // Switch to light
    await act(async () => {
      fireEvent.press(getByTestId('set-light'));
    });
    expect(getByTestId('mode').props.children).toBe('light');

    // Switch to dark
    await act(async () => {
      fireEvent.press(getByTestId('set-dark'));
    });
    expect(getByTestId('mode').props.children).toBe('dark');

    // Switch back to system
    await act(async () => {
      fireEvent.press(getByTestId('set-system'));
    });
    expect(getByTestId('mode').props.children).toBe('system');
  });

  it('provides correct statusBarStyle for each mode', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    // Light mode (header is dark bg → light status bar text)
    await act(async () => {
      fireEvent.press(getByTestId('set-light'));
    });
    expect(getByTestId('statusBar').props.children).toBe('light');

    // Dark mode (header is dark bg → light status bar text)
    await act(async () => {
      fireEvent.press(getByTestId('set-dark'));
    });
    expect(getByTestId('statusBar').props.children).toBe('light');
  });

  it('useTheme outside provider returns default context', async () => {
    // Render ThemeConsumer without wrapping in ThemeProvider
    const { getByTestId } = await render(<ThemeConsumer />);

    // Should get the default context values
    expect(getByTestId('mode').props.children).toBe('system');
    expect(getByTestId('surface').props.children).toBe(lightColors.surface);
    expect(getByTestId('statusBar').props.children).toBe('light');
  });
});
