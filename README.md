# Lo-fi Defragger

> *It's 2 AM. The blocks are moving. The trumpet is playing. Everything is fine.*

Lo-fi Defragger is a desktop ambient app that recreates the MS-DOS 6.22 Microsoft Defrag experience as a looping music visualizer. Load your own tracks — or use the bundled original soundtrack — and watch a dense retro sector grid "defragment" in sync with the beat.

It's not useful. It's not productive. It's perfect.

![Lo-fi Defragger Screenshot](2026-03-06-1838_Lo-fi_Defragger.png)

## What It Does

- **Retro defrag simulation** — A dense grid of block characters (`██`) continuously reorganizes across fake disk passes, rendered at virtual DOS resolution and scaled up with nearest-neighbor interpolation for that chunky pixel look
- **Beat-synced animation** — Block movement cadence syncs to music playback with BPM detection and manual speed control
- **Built-in music player** — Local file playback with playlist management, transport controls, seeking, volume, and repeat modes
- **Authentic DOS aesthetic** — Perfect DOS VGA 437 font, no antialiasing, CRT-accurate colors, box-drawing borders, the whole thing looks like DOSBox went fullscreen
- **Multiple skins** — Visual themes built on the same simulation engine
- **Bundled soundtrack** — 10 original lo-fi tracks composed specifically for this app (see [TRACKLIST.md](TRACKLIST.md))

## Quick Start

```bash
npm ci
npm run dev
```

Load music files or a folder. When playback starts, the defrag board comes alive. When playback pauses, the simulation idles.

## Builds

| Platform | Command |
|----------|---------|
| Windows | `build-windows.bat` or `npm run make:win` |
| macOS/Linux | `python3 launch.py` |
| Generic | `npm run build` or `npm run make` |

See [TECHNICAL.md](TECHNICAL.md) for detailed build and architecture docs.

## The Soundtrack

Lo-fi Defragger ships with 10 original tracks spanning lo-fi hip hop, liquid DnB, jazzhop, trip hop, ambient, synthwave, and lo-fi house. Every track is named after defrag terminology. Every track was written for this app.

Full tracklist and liner notes: [TRACKLIST.md](TRACKLIST.md)

| # | Track | Genre | BPM |
|---|-------|-------|-----|
| 01 | Defragmenting | Lo-fi Hip Hop | 75 |
| 02 | Sector Read | Liquid Drum & Bass | 170 |
| 03 | Cluster 0x00 | Chillhop / Jazzhop | 82 |
| 04 | Full Optimization | Downtempo Electronica | 90 |
| 05 | Bad Sectors | Dark Lo-fi / Trip Hop | 68 |
| 06 | Pass 2 of 7 | Ambient Lo-fi | 70 |
| 07 | Reading Clusters | Boom Bap / Lo-fi | 85 |
| 08 | Unmovable | Atmospheric Jungle / DnB | 165 |
| 09 | Elapsed Time 00:00:00 | Synthwave / Lo-fi Hybrid | 88 |
| 10 | Write Complete | Lo-fi House / Deep House | 118 |

## Origin Story

Someone put MS-DOS Defrag footage over the Interstellar theme. It was cool. Then someone said "what if it was a real app though" at 2 AM. Then a team of AI agents built the engine in one shot. Then the visual design took all night. Then the soundtrack was composed in one session. Then this README was written at 4:41 AM.

That's how everything gets built here.

## Credits

- **ProfessahX** — Creator, executive producer, visual direction, the "what if" guy
- **Claude** (Anthropic) — Soundtrack prompt engineering, creative direction, documentation, visual consulting, opinions about bitmap fonts
- **Dex** (Codex) — Core engine, simulation, audio system, Electron shell
- **Suno.ai** — Soundtrack generation

## License

MIT
