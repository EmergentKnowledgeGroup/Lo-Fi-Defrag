import { forwardRef } from 'react';

import { overlayPanels } from '../config/overlayPanels';
import type { PlaylistItem } from '../../shared/types';
import { formatDuration } from '../formatters';
import { OverlayWindow } from './OverlayWindow';

interface PlaylistPanelProps {
  currentTrackId: string | null;
  isOpen: boolean;
  outsideCloseWarning: boolean;
  onClose: () => void;
  onMoveDown: (trackId: string) => void;
  onMoveUp: (trackId: string) => void;
  onRemove: (trackId: string) => void;
  onSelect: (trackId: string) => void;
  playlist: PlaylistItem[];
}

export const PlaylistPanel = forwardRef<HTMLDivElement, PlaylistPanelProps>(
  function PlaylistPanel(
    {
      currentTrackId,
      isOpen,
      outsideCloseWarning,
      onClose,
      onMoveDown,
      onMoveUp,
      onRemove,
      onSelect,
      playlist,
    }: PlaylistPanelProps,
    ref,
  ) {
    if (!isOpen) {
      return null;
    }

    const playlistConfig = overlayPanels.playlist;
    const footer = outsideCloseWarning
      ? 'Click outside one more time to close, or use [x].'
      : playlistConfig.footer;

    return (
      <OverlayWindow
        ref={ref}
        className="dos-overlay--playlist"
        footer={footer}
        frame={playlistConfig.frame}
        onClose={onClose}
        title={playlistConfig.title}
      >
        <div className="playlist-overlay">
          <div className="playlist-overlay__header">
            <span>{playlistConfig.columns.title}</span>
            <span>{playlistConfig.columns.length}</span>
          </div>

          {playlist.length === 0 ? (
            <p className="playlist-overlay__empty">{playlistConfig.emptyMessage}</p>
          ) : (
            <ul className="playlist-overlay__list">
              {playlist.map((track) => {
                const displayTitle = track.missing
                  ? `${track.title} [MISSING]`
                  : track.title;
                const needsScroll = displayTitle.length > 26;

                return (
                  <li
                    key={track.id}
                    className={`playlist-overlay__item ${
                      currentTrackId === track.id ? 'playlist-overlay__item--active' : ''
                    } ${track.missing ? 'playlist-overlay__item--missing' : ''}`}
                  >
                    <button
                      type="button"
                      className="playlist-overlay__main"
                      title={displayTitle}
                      onClick={() => onSelect(track.id)}
                    >
                      <span className="playlist-overlay__marker">
                        {currentTrackId === track.id ? '>' : '\u00A0'}
                      </span>
                      <span className="playlist-overlay__titleViewport">
                        <span
                          className={`playlist-overlay__titleRail ${
                            needsScroll ? 'playlist-overlay__titleRail--scroll' : ''
                          }`}
                        >
                          <span>{displayTitle}</span>
                          {needsScroll ? <span aria-hidden="true">{displayTitle}</span> : null}
                        </span>
                      </span>
                      <span className="playlist-overlay__length">
                        {formatDuration(track.duration)}
                      </span>
                    </button>
                    <span className="playlist-overlay__actions">
                      <button
                        type="button"
                        className="button button--ghost"
                        aria-label={`Move ${track.title} up`}
                        onClick={() => onMoveUp(track.id)}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        aria-label={`Move ${track.title} down`}
                        onClick={() => onMoveDown(track.id)}
                      >
                        Dn
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        aria-label={`Remove ${track.title}`}
                        onClick={() => onRemove(track.id)}
                      >
                        X
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </OverlayWindow>
    );
  },
);
