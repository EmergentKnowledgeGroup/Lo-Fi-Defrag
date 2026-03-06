import { useCallback } from 'react';

interface AsciiBarProps {
  value: number; // 0-1
  tiles: number;
  showHead?: boolean;
  onClick?: (value: number) => void;
  label?: string;
}

export function AsciiBar({ value, tiles, showHead, onClick, label }: AsciiBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const filledCount = Math.round(clamped * tiles);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!onClick) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      onClick(Math.max(0, Math.min(1, x / rect.width)));
    },
    [onClick],
  );

  return (
    <div
      className={`ascii-bar ${onClick ? 'ascii-bar--interactive' : ''}`}
      role={onClick ? 'slider' : 'meter'}
      aria-label={label}
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onClick={handleClick}
    >
      {Array.from({ length: tiles }, (_, i) => {
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
          />
        );
      })}
    </div>
  );
}
