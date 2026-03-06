import type { KeyboardEvent, MouseEvent } from 'react';

interface AsciiBarProps {
  value: number;
  tiles: number;
  showHead?: boolean;
  onChange?: (value: number) => void;
  label?: string;
}

function clampNormalizedValue(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function normalizeTileCount(tiles: number): number {
  return Math.max(1, Math.floor(tiles));
}

function getKeyboardValue(
  key: string,
  value: number,
  step: number,
): number | null {
  if (key === 'Home') {
    return 0;
  }
  if (key === 'End') {
    return 1;
  }
  if (key === 'ArrowLeft' || key === 'ArrowDown') {
    return clampNormalizedValue(value - step);
  }
  if (key === 'ArrowRight' || key === 'ArrowUp') {
    return clampNormalizedValue(value + step);
  }
  return null;
}

export function AsciiBar({
  value,
  tiles,
  showHead,
  onChange,
  label,
}: AsciiBarProps) {
  const safeTiles = normalizeTileCount(tiles);
  const clampedValue = clampNormalizedValue(value);
  const filledCount = Math.round(clampedValue * safeTiles);
  const isInteractive = typeof onChange === 'function';
  const keyboardStep = 1 / safeTiles;

  const commitValue = (nextValue: number) => {
    onChange?.(clampNormalizedValue(nextValue));
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    commitValue(x / rect.width);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) {
      return;
    }

    const nextValue = getKeyboardValue(event.key, clampedValue, keyboardStep);
    if (nextValue === null) {
      return;
    }

    event.preventDefault();
    commitValue(nextValue);
  };

  return (
    <div
      className={`ascii-bar ${
        isInteractive ? 'ascii-bar--interactive' : 'ascii-bar--static'
      }`}
      role={isInteractive ? 'slider' : 'meter'}
      aria-label={label}
      aria-orientation={isInteractive ? 'horizontal' : undefined}
      aria-valuenow={Math.round(clampedValue * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(clampedValue * 100)}%`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {Array.from({ length: safeTiles }, (_, i) => {
        const isFilled = i < filledCount;
        const isHead = showHead && i === filledCount - 1 && filledCount > 0;
        return (
          <span
            key={i}
            className={`ascii-bar__tile ${
              isHead
                ? 'ascii-bar__tile--head'
                : isFilled
                  ? 'ascii-bar__tile--filled'
                  : 'ascii-bar__tile--empty'
            }`}
          >
            {isHead ? '\u2588' : isFilled ? '\u2588' : '\u2591'}
          </span>
        );
      })}
    </div>
  );
}
