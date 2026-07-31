# EPG Card Improved

A Home Assistant Lovelace card for displaying EPG (Electronic Program Guide) data from the [HomeAssistant-EPG](https://github.com/yohaybn/HomeAssistant-EPG) integration.

## Features

- **Vertical timeline layout** — time runs top-to-bottom, channels displayed as columns side by side
- **Fixed-width columns** — program titles always have enough horizontal space to be readable
- **Touch-friendly popups with navigation** — tap any program to see details, then navigate between programs and channels with ▲◀▶▼ arrows
- **Search with local fallback** — find programs by name; falls back to local search if the integration WS call fails
- **Time navigation** — scroll forward/backward through the day
- **Channel management** — show/hide channels dynamically
- **Visual customization** — colors, borders, column sizes via config
- **Dark/light mode** — falls back to HA theme colors

## Installation

### HACS (Recommended)

1. In HACS → Frontend → Custom Repositories, add: `https://github.com/SyFode/lovelace-epg-card-improved`
2. Search for "EPG Card Improved" and install
3. Add the card to your dashboard

### Manual

1. Copy the `epg-card-improved.js` file to `/config/www/community/epg-card-improved/`
2. Add to `configuration.yaml` or Dashboard Resources:

```yaml
lovelace:
  resources:
    - url: /local/community/epg-card-improved/epg-card-improved.js?v=2.0.0
      type: module
```

## Configuration

```yaml
type: custom:epg-card-improved
entities:
  - sensor.tf1
  - sensor.france_2
  - sensor.france_3
column_width: 160
min_program_height: 30
pixels_per_hour: 150
timeline_width: 60
default_hours_visible: 4
program_background_color: "#555555"
program_text_color: "#ffffff"
current_program_highlight: "#0056b3"
enable_search: true
enable_time_navigation: true
grid_options:
  columns: full
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entities` | list | required | EPG sensor entity IDs |
| `column_width` | int | 160 | Width of each channel column in pixels |
| `min_program_height` | int | 42 | Minimum program block height in pixels (should be ~42 to fit two-line titles) |
| `min_program_duration_minutes` | int | 15 | Programs shorter than this (in minutes) get an enlarged block so their title is readable |
| `pixels_per_hour` | int | 150 | Vertical height per hour of programming in pixels |
| `timeline_width` | int | 60 | Width of the left timeline column in pixels |
| `default_hours_visible` | int | 4 | Hours shown in the viewport |
| `program_background_color` | string | `#555555` | Program block background |
| `program_text_color` | string | `#ffffff` | Program title color |
| `current_program_highlight` | string | `#0056b3` | Currently airing program color |
| `program_border_radius` | int | 4 | Program block corner radius |
| `timeline_color` | string | `#cccccc` | Timeline text/divider color |
| `channel_name_color` | string | `#ffffff` | Channel name text color |
| `enable_search` | bool | true | Show search button |
| `enable_time_navigation` | bool | true | Show time navigation buttons |

### Migration from horizontal layout

If upgrading from the original horizontal layout version (pre-v0.9), remove these deprecated options:
- `row_height` — replaced by `pixels_per_hour` and `column_width`
- `min_program_width` — replaced by `min_program_height`

### CSS Custom Properties

All visual options are also available as CSS custom properties with the `--epg-` prefix for theme-level control:

`--epg-program-bg`, `--epg-program-text`, `--epg-program-current-bg`, `--epg-program-border-radius`, `--epg-program-border`, `--epg-channel-name-color`, `--epg-timeline-color`, `--epg-column-width`, `--epg-min-program-height`, `--epg-timeline-width`, `--epg-viewport-height`

## Popup Navigation

When viewing a program's details, use the navigation arrows to browse without closing the popup:
- **◀ ▶** — Previous/next channel (shows the program airing at the same time on the adjacent channel)
- **▲** — Earlier program on the same channel
- **▼** — Later program on the same channel
- **🕐 Now** — Jump to the currently airing program on the same channel
- **👁 Show** — Scroll the timeline to show this program's time slot

The viewport automatically scrolls to show programs that are off-screen.

### Time Navigation Limits

- **Earlier (▲):** Scrolls backward in time. Note: the EPG integration only provides current and future programs in the `today` attribute, so programs that have already ended will not appear.
- **Later (▼):** Scrolls forward through today and into tomorrow's schedule. Hours past midnight show a `+` suffix (e.g. `01:00+`).
- **Now (🕐):** Jumps back to the current time.

## Requirements

- [HomeAssistant-EPG](https://github.com/yohaybn/HomeAssistant-EPG) integration installed and configured
- Home Assistant 2023.11 or newer