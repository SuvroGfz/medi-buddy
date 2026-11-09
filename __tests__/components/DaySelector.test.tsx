import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DaySelector } from '../../src/components/DaySelector';

describe('DaySelector', () => {
  it('renders all 7 days', async () => {
    const result = await render(
      <DaySelector selectedDays="1,2,3,4,5,6,7" onChange={() => {}} />
    );
    expect(result.getByText('Mon')).toBeTruthy();
    expect(result.getByText('Tue')).toBeTruthy();
    expect(result.getByText('Wed')).toBeTruthy();
    expect(result.getByText('Thu')).toBeTruthy();
    expect(result.getByText('Fri')).toBeTruthy();
    expect(result.getByText('Sat')).toBeTruthy();
    expect(result.getByText('Sun')).toBeTruthy();
  });

  it('calls onChange when a day is toggled off', async () => {
    const onChange = jest.fn();
    const result = await render(
      <DaySelector selectedDays="1,2,3,4,5,6,7" onChange={onChange} />
    );
    fireEvent.press(result.getByText('Sun'));
    expect(onChange).toHaveBeenCalledWith('1,2,3,4,5,6');
  });

  it('calls onChange when a day is toggled on', async () => {
    const onChange = jest.fn();
    const result = await render(
      <DaySelector selectedDays="1,3,5" onChange={onChange} />
    );
    fireEvent.press(result.getByText('Tue'));
    expect(onChange).toHaveBeenCalledWith('1,2,3,5');
  });

  it('keeps at least one day selected', async () => {
    const onChange = jest.fn();
    const result = await render(
      <DaySelector selectedDays="1" onChange={onChange} />
    );
    fireEvent.press(result.getByText('Mon'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('has correct accessibility roles', async () => {
    const result = await render(
      <DaySelector selectedDays="1,2,3" onChange={() => {}} />
    );
    const checkboxes = result.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(7);
  });
});
