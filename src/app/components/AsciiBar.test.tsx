import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { AsciiBar } from './AsciiBar';

describe('AsciiBar', () => {
  it('renders correct number of tiles', () => {
    const { container } = render(<AsciiBar value={0.5} tiles={10} />);
    const tiles = container.querySelectorAll('.ascii-bar__tile');
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

  it('clamps value between 0 and 1', () => {
    const { container } = render(<AsciiBar value={1.5} tiles={10} />);
    const filled = container.querySelectorAll('.ascii-bar__tile--filled');
    expect(filled.length).toBe(10);
  });
});
