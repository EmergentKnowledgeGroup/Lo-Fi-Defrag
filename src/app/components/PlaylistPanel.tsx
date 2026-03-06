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
        <p className="playlist-empty">Import files or a folder to start.</p>
      ) : (
        <ul className="playlist-list">
          {playlist.map((track) => (
            <li
              key={track.id}
              className={`playlist-item ${currentTrackId === track.id ? 'playlist-item--active' : ''}`}
            >
              <button
                className="playlist-item__main"
                onClick={() => onSelect(track.id)}
              >
                <span className="playlist-item__marker">
                  {currentTrackId === track.id ? '>' : '\u00A0'}
                </span>
                <span className="playlist-item__title">{track.title}</span>
                <span className="playlist-item__meta">
                  {track.artist || 'Unknown'} ({formatDuration(track.duration)})
                </span>
              </button>
              <span className="playlist-item__actions">
                <button className="button button--ghost" onClick={() => onMoveUp(track.id)}>Up</button>
                <button className="button button--ghost" onClick={() => onMoveDown(track.id)}>Dn</button>
                <button className="button button--ghost" onClick={() => onRemove(track.id)}>X</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
