import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../../src/services/userProfile', () => ({
  saveUserProfile: jest.fn().mockResolvedValue(undefined),
}));

import OnboardingScreen from '../../app/onboarding';
import { saveUserProfile } from '../../src/services/userProfile';
import { router } from 'expo-router';

describe('OnboardingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the welcome title and form inputs', async () => {
    const { getByText, getByTestId } = await render(<OnboardingScreen />);

    expect(getByText('Welcome to MediBuddy')).toBeTruthy();
    expect(getByText("What's your name?")).toBeTruthy();
    expect(getByText('How old are you?')).toBeTruthy();
    expect(getByTestId('name-input')).toBeTruthy();
    expect(getByTestId('age-input')).toBeTruthy();
  });

  it('shows the Get Started button', async () => {
    const { getByText } = await render(<OnboardingScreen />);
    expect(getByText(/Get Started/)).toBeTruthy();
  });

  it('saves profile and navigates on valid submission', async () => {
    const { getByTestId, getByText } = await render(<OnboardingScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('name-input'), 'Bob');
      fireEvent.changeText(getByTestId('age-input'), '25');
    });

    await act(async () => {
      fireEvent.press(getByText(/Get Started/));
    });

    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalledWith({ name: 'Bob', age: 25 });
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  it('only allows numeric input for age', async () => {
    const { getByTestId } = await render(<OnboardingScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('age-input'), '12abc34');
    });

    expect(getByTestId('age-input').props.value).toBe('1234');
  });

  it('trims whitespace from name before saving', async () => {
    const { getByTestId, getByText } = await render(<OnboardingScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('name-input'), '  Carol  ');
      fireEvent.changeText(getByTestId('age-input'), '40');
    });

    await act(async () => {
      fireEvent.press(getByText(/Get Started/));
    });

    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalledWith({ name: 'Carol', age: 40 });
    });
  });
});
