# EPG Card Improved

A Home Assistant Lovelace card for displaying EPG (Electronic Program Guide) data from the [HomeAssistant-EPG](https://github.com/yohaybn/HomeAssistant-EPG) integration.

## Features

- **Readable short programs** — minimum width ensures text is never cut off
- **Touch-friendly** — tap any program to see details (no hover dependency)
- **Time navigation** — scroll forward/backward through the day
- **Search** — find programs by name using the `epg.search_program` service
- **Channel management** — show/hide channels dynamically
- **Visual customization** — colors, borders, and sizes via config or CSS custom properties
- **Dark/light mode** — falls back to HA theme colors

## Installation

### HACS (Recommended)

1. In HACS → Frontend → Custom Repositories, add: `https://github.com/<your-repo>/epg-card-improved`
2. Search for "EPG Card Improved" and install
3. Add the card to your dashboard

### Manual

1. Copy the `epg-card-improved` folder to `/config/www/community/epg-card-improved/`
2. Add to `configuration.yaml` or Dashboard Resources:

```yaml
lovelace:
  resources:
    - url: /local/community/epg-card-improved/epg-card-improved.js?v=1.0.0
      type: module
```

## Configuration

```yaml
type: custom:epg-card-improved
entities:
  - sensor.tf1
  - sensor.france_2
  - sensor.france_3
row_height: 139
min_program_width: 80
default_hours_visible: 4
program_background_color: "#555555"
program_text_color: "#ffffff"
current_program_highlight: "#0056b3"
enable_search: true
enable_time_navigation: true
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entities` | list | required | EPG sensor entity IDs |
| `row_height` | int | 100 | Row height in pixels |
| `min_program_width` | int | 80 | Minimum program block width in pixels |
| `default_hours_visible` | int | 4 | Hours shown in the viewport |
| `program_background_color` | string | `#555555` | Program block background |
| `program_text_color` | string | `#ffffff` | Program title color |
| `current_program_highlight` | string | `#0056b3` | Currently airing program color |
| `program_border_radius` | int | 4 | Program block corner radius |
| `timeline_color` | string | `#cccccc` | Timeline text/divider color |
| `channel_name_color` | string | `#ffffff` | Channel name text color |
| `enable_search` | bool | true | Show search button |
| `enable_time_navigation` | bool | true | Show time navigation buttons |

### CSS Custom Properties

All visual options are also available as CSS custom properties with the `--epg-` prefix for theme-level control:

`--epg-program-bg`, `--epg-program-text`, `--epg-program-current-bg`, `--epg-program-border-radius`, `--epg-program-border`, `--epg-channel-name-color`, `--epg-timeline-color`, `--epg-row-height`, `--epg-min-program-width`

## Requirements

- [HomeAssistant-EPG](https://github.com/yohaybn/HomeAssistant-EPG) integration installed and configured
- Home Assistant 2023.11 or newer