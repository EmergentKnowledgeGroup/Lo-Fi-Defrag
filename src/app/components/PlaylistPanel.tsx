import type { PlaylistItem } from '../../shared/types';
import { formatDuration } from '../formatters';

interface PlaylistPanelProps {
  currentTrackId: string | null;
  onMoveDown: (trackId: string) => void;
  onMoveUp: (trackId: string) => void;
  onRemove: (trackId: string) => void;
  onSelect: (trackId: string) => void;
  playlist: PlaylistItem[];
}

export function PlaylistPanel({
  currentTrackId,
  onMoveDown,
  onMoveUp,
  onRemove,
  onSelect,
  playlist,
}: PlaylistPanelProps) {
  return (
    <section className="panel panel--playlist">
      <div className="panel__titlebar">
        <span className="panel__title">Playlist</span>
        <span className="panel__meta">{playlist.length} track(s)</span>
      </div>

      {playlist.length === 0 ? (
        <div className="playlist-empty">
          <p>Import a folder or a few files to start the ambient loop.</p>
          <p>The defragger animation keeps running whether music is loaded or not.</p>
        </div>
      ) : (
        <ul className="playlist-list">
          {playlist.map((track) => (
            <li
              key={track.id}
              className={`playlist-list__item ${
                currentTrackId === track.id ? 'playlist-list__item--active' : ''
              } ${track.missing ? 'playlist-list__item--missing' : ''}`}
            >
              <button
                className="playlist-list__main"
                onClick={() => onSelect(track.id)}
              >
                <span className="playlist-list__title">{track.title}</span>
                <span className="playlist-list__meta">
                  {track.artist || 'Unknown artist'} • {formatDuration(track.duration)}
                </span>
              </button>
              <div className="playlist-list__actions">
                <button
                  className="button button--ghost"
                  onClick={() => onMoveUp(track.id)}
                >
                  Up
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => onMoveDown(track.id)}
                >
                  Dn
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => onRemove(track.id)}
                >
                  Del
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
