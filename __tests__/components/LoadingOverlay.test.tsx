import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders nothing when not visible', async () => {
    const { queryByText } = await render(
      <LoadingOverlay visible={false} />
    );
    expect(queryByText('Saving...')).toBeNull();
  });

  it('renders with default message when visible', async () => {
    const { getByText } = await render(
      <LoadingOverlay visible={true} />
    );
    // Modal renders in a portal; check text exists
    expect(getByText('Saving...')).toBeTruthy();
  }, 10000);

  it('renders with custom message when visible', async () => {
    const { getByText } = await render(
      <LoadingOverlay visible={true} message="Creating preset..." />
    );
    expect(getByText('Creating preset...')).toBeTruthy();
  }, 10000);

  it('contains the loading text in the component tree', async () => {
    const { toJSON } = await render(
      <LoadingOverlay visible={true} />
    );
    const json = JSON.stringify(toJSON());
    expect(json).toContain('Saving...');
  }, 10000);
});
