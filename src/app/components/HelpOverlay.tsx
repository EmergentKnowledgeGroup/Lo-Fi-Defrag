import { forwardRef } from 'react';

import { overlayPanels } from '../config/overlayPanels';
import { OverlayWindow } from './OverlayWindow';

interface HelpOverlayProps {
  isOpen: boolean;
}

export const HelpOverlay = forwardRef<HTMLDivElement, HelpOverlayProps>(
  function HelpOverlay({ isOpen }: HelpOverlayProps, ref) {
    if (!isOpen) {
      return null;
    }

    const helpConfig = overlayPanels.help;

    return (
      <OverlayWindow
        ref={ref}
        className="dos-overlay--help"
        footer={helpConfig.footer}
        frame={helpConfig.frame}
        title={helpConfig.title}
      >
        <div className="help-overlay">
          {helpConfig.items.map((item) => (
            <div key={item.label} className="help-overlay__item">
              <div className="help-overlay__labelBox">{item.label}</div>
              <div className="help-overlay__description">{item.description}</div>
            </div>
          ))}
        </div>
      </OverlayWindow>
    );
  },
);
