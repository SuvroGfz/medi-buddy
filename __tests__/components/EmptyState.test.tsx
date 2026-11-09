import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('renders title', async () => {
    const result = await render(<EmptyState title="No items" />);
    expect(result.getByText('No items')).toBeTruthy();
  });

  it('renders icon when provided', async () => {
    const result = await render(<EmptyState icon="💊" title="No medications" />);
    expect(result.getByText('💊')).toBeTruthy();
  });

  it('renders subtitle when provided', async () => {
    const result = await render(
      <EmptyState title="No items" subtitle="Add your first item" />
    );
    expect(result.getByText('Add your first item')).toBeTruthy();
  });

  it('renders children', async () => {
    const result = await render(
      <EmptyState title="Empty">
        <></>
      </EmptyState>
    );
    expect(result.getByText('Empty')).toBeTruthy();
  });
});
