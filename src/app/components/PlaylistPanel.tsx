import {
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react';

import { overlayPanels } from '../config/overlayPanels';
import type { PlaylistItem } from '../../shared/types';
import { formatDuration } from '../formatters';
import { OverlayWindow } from './OverlayWindow';

const SCROLL_STEP = 64;
const SCROLLBAR_TRACK_CELLS = Array.from({ length: 64 }, (_, index) => index);
const SHADE_GLYPH = '\u2591';

interface PlaylistPanelProps {
  currentTrackId: string | null;
  isOpen: boolean;
  outsideCloseWarning: boolean;
  onClose: () => void;
  onImportFiles: () => void;
  onImportFolder: () => void;
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
      onImportFiles,
      onImportFolder,
      onMoveDown,
      onMoveUp,
      onRemove,
      onSelect,
      playlist,
    }: PlaylistPanelProps,
    ref,
  ) {
    const listRef = useRef<HTMLUListElement | null>(null);
    const [scrollMetrics, setScrollMetrics] = useState({
      clientHeight: 1,
      scrollHeight: 1,
      scrollTop: 0,
    });

    const syncScrollMetrics = () => {
      const list = listRef.current;
      if (!list) {
        return;
      }

      setScrollMetrics({
        clientHeight: list.clientHeight,
        scrollHeight: list.scrollHeight,
        scrollTop: list.scrollTop,
      });
    };

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      syncScrollMetrics();
      window.addEventListener('resize', syncScrollMetrics);
      return () => {
        window.removeEventListener('resize', syncScrollMetrics);
      };
    }, [isOpen, playlist.length]);

    if (!isOpen) {
      return null;
    }

    const playlistConfig = overlayPanels.playlist;
    const footer = outsideCloseWarning
      ? 'Click outside one more time to close, or use [x].'
      : playlistConfig.footer;
    const maxScrollTop = Math.max(
      0,
      scrollMetrics.scrollHeight - scrollMetrics.clientHeight,
    );
    const hasScrollableList = maxScrollTop > 0;
    const thumbHeight = hasScrollableList
      ? Math.max(
          18,
          Math.min(
            42,
            Math.round(
              (scrollMetrics.clientHeight / scrollMetrics.scrollHeight) * 100,
            ),
          ),
        )
      : 100;
    const thumbTop = hasScrollableList
      ? Math.round(
          (scrollMetrics.scrollTop / maxScrollTop) * (100 - thumbHeight),
        )
      : 0;
    const scrollPlaylist = (direction: -1 | 1) => {
      listRef.current?.scrollBy({
        behavior: 'smooth',
        top: direction * SCROLL_STEP,
      });
    };
    const handleListScroll = () => {
      syncScrollMetrics();
    };

    return (
      <OverlayWindow
        ref={ref}
        className="dos-overlay--playlist"
        footer={footer}
        frame={playlistConfig.frame}
        headerActions={
          <>
            <button
              type="button"
              className="dos-overlay__headerButton"
              onClick={onImportFiles}
            >
              Import
            </button>
            <button
              type="button"
              className="dos-overlay__headerButton"
              onClick={onImportFolder}
            >
              Folder
            </button>
          </>
        }
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
            <div className="playlist-overlay__scrollArea">
              <ul
                ref={listRef}
                className="playlist-overlay__list"
                onScroll={handleListScroll}
              >
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
              <div className="playlist-scrollbar" aria-hidden="true">
                <button
                  type="button"
                  className="playlist-scrollbar__button playlist-scrollbar__button--up"
                  tabIndex={-1}
                  onClick={() => scrollPlaylist(-1)}
                />
                <div className="playlist-scrollbar__track">
                  <span className="playlist-scrollbar__trackPattern">
                    {SCROLLBAR_TRACK_CELLS.map((cell) => (
                      <span key={cell}>{SHADE_GLYPH}</span>
                    ))}
                  </span>
                  <span
                    className="playlist-scrollbar__thumb"
                    style={{
                      height: `${thumbHeight}%`,
                      top: `${thumbTop}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="playlist-scrollbar__button playlist-scrollbar__button--down"
                  tabIndex={-1}
                  onClick={() => scrollPlaylist(1)}
                />
              </div>
            </div>
          )}
        </div>
      </OverlayWindow>
    );
  },
);
