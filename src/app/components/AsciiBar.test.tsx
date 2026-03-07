import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AsciiBar } from './AsciiBar';

describe('AsciiBar', () => {
  it('renders correct number of tiles', () => {
    const { container, getByRole } = render(<AsciiBar value={0.5} tiles={10} />);
    const tiles = container.querySelectorAll('[class^="ascii-bar__tile"]');

    expect(getByRole('meter')).toHaveAttribute('aria-valuenow', '50');
    expect(tiles.length).toBe(10);
  });

  it('fills correct number of tiles based on value', () => {
    const { container } = render(<AsciiBar value={0.3} tiles={10} />);
    const filled = container.querySelectorAll('.ascii-bar__tile--filled');
    const empty = container.querySelectorAll('.ascii-bar__tile--empty');
    expect(filled.length).toBe(3);
    expect(empty.length).toBe(7);
  });

  it('renders highlight tile at fill boundary', () => {
    const { container } = render(<AsciiBar value={0.5} tiles={10} showHead />);
    const head = container.querySelectorAll('.ascii-bar__tile--head');
    expect(head.length).toBe(1);
  });

  it('calls onChange when the bar is clicked', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <AsciiBar value={0.25} tiles={10} onChange={handleChange} />,
    );

    const bar = getByRole('slider');
    Object.defineProperty(bar, 'getBoundingClientRect', {
      value: () => ({
        bottom: 10,
        height: 10,
        left: 0,
        right: 100,
        top: 0,
        width: 100,
        x: 0,
        y: 0,
      }),
    });

    fireEvent.click(bar, { clientX: 50 });
    expect(bar).toHaveAttribute('aria-valuenow', '25');
    expect(handleChange).toHaveBeenCalledWith(0.5);
  });

  it('supports keyboard updates when interactive', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <AsciiBar value={0.5} tiles={10} onChange={handleChange} />,
    );

    fireEvent.keyDown(getByRole('slider'), { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith(0.6);
  });

  it('clamps value between 0 and 1', () => {
    const { container } = render(<AsciiBar value={1.5} tiles={10} />);
    const filled = container.querySelectorAll('.ascii-bar__tile--filled');
    expect(filled.length).toBe(10);
  });
});
