interface PlaylistLauncherPanelProps {
  currentTrackTitle: string | null;
  isOpen: boolean;
  onToggle: () => void;
  playlistCount: number;
}

export function PlaylistLauncherPanel({
  currentTrackTitle,
  isOpen,
  onToggle,
  playlistCount,
}: PlaylistLauncherPanelProps) {
  const buttonLabel =
    playlistCount === 0
      ? 'Playlist'
      : `Playlist (${playlistCount})`;
  const metaLabel =
    playlistCount === 0
      ? 'No tracks loaded'
      : currentTrackTitle ?? `${playlistCount} track(s)`;

  return (
    <section className="panel panel--playlist-launcher">
      <div className="playlist-launcher-row">
        <button
          type="button"
          className={`button playlist-launcher-row__button ${
            isOpen ? 'button--primary' : ''
          }`}
          onClick={onToggle}
        >
          {buttonLabel}
        </button>
        <span className="playlist-launcher-row__meta">{metaLabel}</span>
      </div>
    </section>
  );
}
