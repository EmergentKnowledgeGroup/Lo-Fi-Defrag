import {
  forwardRef,
  type ReactNode,
  type CSSProperties,
} from 'react';

import type { OverlayFrameConfig } from '../config/overlayPanels';

interface OverlayWindowProps {
  children: ReactNode;
  className?: string;
  footer?: string;
  frame: OverlayFrameConfig;
  onClose?: () => void;
  title: string;
}

export const OverlayWindow = forwardRef<HTMLDivElement, OverlayWindowProps>(
  function OverlayWindow(
    {
      children,
      className,
      footer,
      frame,
      onClose,
      title,
    }: OverlayWindowProps,
    ref,
  ) {
    const style: CSSProperties = {
      height: `${frame.height}px`,
      left: `${frame.x}px`,
      top: `${frame.y}px`,
      width: `${frame.width}px`,
    };

    return (
      <section
        ref={ref}
        className={`dos-overlay ${className ?? ''}`.trim()}
        style={style}
        role="dialog"
        aria-label={title}
        aria-modal={false}
      >
        <div className="dos-overlay__header" aria-hidden="true">
          <span className="dos-overlay__headerLine" />
          <span className="dos-overlay__title">{title}</span>
          <span className="dos-overlay__headerLine" />
        </div>
        {onClose ? (
          <button
            type="button"
            className="dos-overlay__close"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            [x]
          </button>
        ) : null}
        <div className="dos-overlay__body">{children}</div>
        {footer ? <div className="dos-overlay__footer">{footer}</div> : null}
      </section>
    );
  },
);
