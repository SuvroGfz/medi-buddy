import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../src/components/Button';

describe('Button', () => {
  it('renders title text', async () => {
    const result = await render(<Button title="Test Button" onPress={() => {}} />);
    expect(result.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const result = await render(<Button title="Click Me" onPress={onPress} />);
    fireEvent.press(result.getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    const result = await render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(result.getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders icon when provided', async () => {
    const result = await render(<Button title="Save" onPress={() => {}} icon="💊" />);
    expect(result.getByText('💊')).toBeTruthy();
    expect(result.getByText('Save')).toBeTruthy();
  });

  it('has accessibility role button', async () => {
    const result = await render(<Button title="Accessible" onPress={() => {}} />);
    expect(result.getByRole('button')).toBeTruthy();
  });
});
