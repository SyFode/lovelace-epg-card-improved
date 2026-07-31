/**
 * EPG Card Improved
 * A Home Assistant Lovelace card for displaying EPG data from the HomeAssistant-EPG integration.
 * Features: vertical timeline, touch-friendly popups with navigation, search, time navigation, channel management, visual customization.
 */

// HA provides LitElement globally — no import needed
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class EpgCardImproved extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _viewportStartHour: { state: true },
      _selectedProgram: { state: true },
      _searchVisible: { state: true },
      _searchQuery: { state: true },
      _searchResults: { state: true },
      _channelVisibility: { state: true },
      _channelsPanelOpen: { state: true },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .epg-container {
        font-family: var(--ha-font-family, inherit);
        padding: 16px;
      }
      /* Navigation bar */
      .epg-nav-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding: 0 4px;
      }
      .epg-nav-btn {
        background: var(--epg-timeline-color, #cccccc);
        border: none;
        border-radius: 4px;
        color: var(--epg-program-text, #ffffff);
        cursor: pointer;
        font-size: 16px;
        padding: 4px 10px;
        min-width: 32px;
        text-align: center;
      }
      .epg-nav-btn:hover {
        opacity: 0.8;
      }
      /* Grid wrapper: timeline column + channels area */
      .epg-grid-wrapper {
        display: flex;
        position: relative;
      }
      /* Timeline column (left side) */
      .epg-timeline-col {
        position: relative;
        flex-shrink: 0;
        background: var(--ha-card-background, #1c1c1e);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
      .epg-timeline-label {
        position: absolute;
        left: 0;
        right: 0;
        text-align: right;
        padding-right: 8px;
        font-size: 11px;
        font-weight: bold;
        color: var(--epg-timeline-color, #cccccc);
        transform: translateY(-50%);
      }
      /* Channels area (right of timeline) */
      .epg-channels-area {
        display: flex;
        flex: 1;
        overflow-x: auto;
      }
      /* Individual channel column */
      .epg-channel-col {
        position: relative;
        flex-shrink: 0;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
      }
      .epg-channel-header {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 13px;
        color: var(--epg-channel-name-color, #ffffff);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0 4px;
      }
      .epg-programs-col {
        position: relative;
        overflow: hidden;
      }
      /* Program blocks */
      .epg-program {
        position: absolute;
        width: calc(var(--epg-column-width) - 8px);
        left: 4px;
        background-color: var(--epg-program-bg, #555555);
        color: var(--epg-program-text, #ffffff);
        border-radius: var(--epg-program-border-radius, 4px);
        padding: 4px 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
        font-size: 13px;
        box-sizing: border-box;
        border: var(--epg-program-border, none);
        transition: background-color 0.15s;
      }
      .epg-program:hover {
        opacity: 0.85;
      }
      .epg-program.current {
        background-color: var(--epg-program-current-bg, #0056b3);
      }
      /* Now line (horizontal) */
      .epg-now-line {
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        background-color: red;
        z-index: 10;
      }
      .epg-now-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background-color: red;
        border-radius: 50%;
        z-index: 10;
        transform: translate(-4px, -4px);
      }
      /* Popup styles */
      .epg-popup-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .epg-popup {
        background: var(--ha-card-background, #1c1c1e);
        border-radius: 12px;
        padding: 20px 24px;
        max-width: 320px;
        width: 90%;
        color: var(--epg-program-text, #ffffff);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }
      .epg-popup-channel {
        font-size: 12px;
        color: var(--epg-timeline-color, #cccccc);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .epg-popup-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 12px;
      }
      .epg-popup-time {
        font-size: 14px;
        color: var(--epg-timeline-color, #cccccc);
        margin-bottom: 8px;
      }
      .epg-popup-desc {
        font-size: 14px;
        line-height: 1.4;
        color: var(--epg-program-text, #ffffff);
        opacity: 0.9;
        margin-bottom: 16px;
      }
      .epg-popup-nav {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
      }
      .epg-popup-nav-btn {
        background: transparent;
        border: 1px solid var(--epg-timeline-color, #cccccc);
        color: var(--epg-program-text, #ffffff);
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 16px;
        flex: 1;
        text-align: center;
      }
      .epg-popup-nav-btn:hover {
        opacity: 0.8;
      }
      .epg-popup-nav-btn:disabled {
        opacity: 0.3;
        cursor: default;
      }
      .epg-popup-close {
        display: block;
        margin-left: auto;
        background: transparent;
        border: 1px solid var(--epg-timeline-color, #cccccc);
        color: var(--epg-program-text, #ffffff);
        border-radius: 6px;
        padding: 6px 16px;
        cursor: pointer;
        font-size: 14px;
      }
      .epg-popup-close:hover {
        opacity: 0.8;
      }
      /* Search overlay styles */
      .epg-search-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1100;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 80px;
      }
      .epg-search-panel {
        background: var(--ha-card-background, #1c1c1e);
        border-radius: 12px;
        padding: 16px 20px;
        max-width: 400px;
        width: 90%;
        max-height: 60vh;
        display: flex;
        flex-direction: column;
        color: var(--epg-program-text, #ffffff);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }
      .epg-search-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .epg-search-input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid var(--epg-timeline-color, #cccccc);
        background: transparent;
        color: var(--epg-program-text, #ffffff);
        font-size: 14px;
      }
      .epg-search-input:focus {
        outline: 2px solid var(--epg-program-current-bg, #0056b3);
      }
      .epg-search-close {
        background: transparent;
        border: none;
        color: var(--epg-program-text, #ffffff);
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
      }
      .epg-search-results {
        overflow-y: auto;
        flex: 1;
      }
      .epg-search-result {
        padding: 10px 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        border-radius: 4px;
      }
      .epg-search-result:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      .epg-search-result-title {
        font-weight: bold;
        font-size: 14px;
      }
      .epg-search-result-meta {
        font-size: 12px;
        color: var(--epg-timeline-color, #cccccc);
        margin-top: 2px;
      }
      .epg-search-no-results {
        text-align: center;
        color: var(--epg-timeline-color, #cccccc);
        padding: 20px 0;
        font-size: 14px;
      }
      /* Channel toggle styles */
      .epg-channels-bar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-top: 8px;
        padding: 0 4px;
      }
      .epg-channels-toggle-btn {
        background: transparent;
        border: 1px solid var(--epg-timeline-color, #cccccc);
        color: var(--epg-program-text, #ffffff);
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 13px;
      }
      .epg-channels-toggle-btn:hover {
        opacity: 0.8;
      }
      .epg-channels-panel {
        margin-top: 8px;
        padding: 12px;
        background: var(--ha-card-background, #1c1c1e);
        border-radius: 8px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }
      .epg-channels-panel-item {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 13px;
        color: var(--epg-program-text, #ffffff);
      }
      .epg-channels-panel-item input[type="checkbox"] {
        cursor: pointer;
      }
    `;
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities) || config.entities.length === 0) {
      throw new Error("You need to define at least one entity.");
    }
    this.config = {
      entities: config.entities,
      column_width: config.column_width || 160,
      min_program_height: config.min_program_height || 30,
      default_hours_visible: config.default_hours_visible || 4,
      pixels_per_hour: config.pixels_per_hour || 150,
      timeline_width: config.timeline_width || 60,
      program_background_color: this._rgbToHex(config.program_background_color) || "#555555",
      program_text_color: this._rgbToHex(config.program_text_color) || "#ffffff",
      program_border_radius: config.program_border_radius || 4,
      current_program_highlight: this._rgbToHex(config.current_program_highlight) || "#0056b3",
      timeline_color: this._rgbToHex(config.timeline_color) || "#cccccc",
      channel_name_color: this._rgbToHex(config.channel_name_color) || "#ffffff",
      enable_search: config.enable_search !== undefined ? config.enable_search : true,
      enable_time_navigation: config.enable_time_navigation !== undefined ? config.enable_time_navigation : true,
    };
    // Initialize viewport to current hour
    const now = new Date();
    this._viewportStartHour = now.getHours();
    this._selectedProgram = null;
    this._searchVisible = false;
    this._searchQuery = "";
    this._searchResults = [];
    this._channelVisibility = null;
    this._channelsPanelOpen = false;
    // Load persisted channel visibility
    this._loadChannelVisibility();
  }

  getCardSize() {
    return 5;
  }

  /**
   * Convert HA color_rgb value to hex string.
   * HA's color_rgb selector returns [r, g, b] array or a hex string.
   * This normalizes both formats to hex strings.
   */
  _rgbToHex(value) {
    if (!value) return value;
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length === 3) {
      const [r, g, b] = value;
      return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
    }
    return value;
  }

  // ===== Data Layer Methods =====

  /**
   * Parse EPG data from all configured sensor entities.
   * Returns array of channel objects with programs.
   */
  _getEpgData() {
    if (!this.hass || !this.config) return [];

    const channels = [];
    for (const entityId of [...this.config.entities].sort()) {
      const state = this.hass.states[entityId];
      if (!state) {
        console.warn(`EPG Card: Entity ${entityId} not found`);
        continue;
      }

      const channelName = state.attributes.friendly_name || entityId;
      const channelIcon = state.attributes.channel_icon || "";
      const todayPrograms = state.attributes.today || {};
      const tomorrowPrograms = state.attributes.tomorrow || {};

      if (Object.keys(todayPrograms).length === 0) {
        console.warn(`EPG Card: No program data for ${entityId}`);
        continue;
      }

      const programs = this._parsePrograms(todayPrograms, tomorrowPrograms);
      channels.push({
        entityId,
        name: channelName,
        icon: channelIcon,
        visible: this._isChannelVisible(entityId),
        programs,
      });
    }
    return channels;
  }

  /**
   * Parse program dictionaries into sorted array with computed end times.
   */
  _parsePrograms(todayPrograms, tomorrowPrograms) {
    const programs = [];
    const now = new Date();

    // Parse today's programs
    const todayKeys = Object.keys(todayPrograms).sort();
    for (let i = 0; i < todayKeys.length; i++) {
      const startStr = todayKeys[i];
      const prog = todayPrograms[startStr];
      const endStr = prog.end || (todayKeys[i + 1] ? todayKeys[i + 1] : "24:00");

      const startTime = this._timeToDate(startStr, 0);
      const endTime = this._timeToDate(endStr, 0);

      programs.push({
        title: prog.title || "Unknown",
        desc: prog.desc || "",
        sub_title: prog.sub_title || "",
        start: startStr,
        end: endStr,
        startDate: startTime,
        endDate: endTime,
        dayOffset: 0,
        isCurrent: startTime <= now && endTime >= now,
      });
    }

    // Parse tomorrow's programs if available
    const tomorrowKeys = Object.keys(tomorrowPrograms).sort();
    for (let i = 0; i < tomorrowKeys.length; i++) {
      const startStr = tomorrowKeys[i];
      const prog = tomorrowPrograms[startStr];
      const endStr = prog.end || (tomorrowKeys[i + 1] ? tomorrowKeys[i + 1] : "24:00");

      const startTime = this._timeToDate(startStr, 1);
      const endTime = this._timeToDate(endStr, 1);

      programs.push({
        title: prog.title || "Unknown",
        desc: prog.desc || "",
        sub_title: prog.sub_title || "",
        start: startStr,
        end: endStr,
        startDate: startTime,
        endDate: endTime,
        dayOffset: 1,
        isCurrent: startTime <= now && endTime >= now,
      });
    }

    return programs;
  }

  /**
   * Convert "HH:MM" string to Date object for today (+ dayOffset).
   */
  _timeToDate(timeStr, dayOffset = 0) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  /**
   * Get the viewport time range based on _viewportStartHour and default_hours_visible.
   */
  _getViewport() {
    const hoursVisible = this.config.default_hours_visible || 4;
    const startHour = Math.min(this._viewportStartHour, 24 - hoursVisible);
    const start = new Date();
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start.getTime() + hoursVisible * 60 * 60 * 1000);
    return { start, end, hoursVisible };
  }

  /**
   * Filter programs to only those visible in the current viewport.
   */
  _getVisiblePrograms(programs, viewport) {
    return programs.filter(
      (p) => p.endDate > viewport.start && p.startDate < viewport.end
    );
  }

  /**
   * Calculate a program's top position and height as percentages of the viewport.
   */
  _getProgramPosition(program, viewport) {
    const viewportDuration = viewport.end.getTime() - viewport.start.getTime();
    const programStart = Math.max(program.startDate.getTime(), viewport.start.getTime());
    const programEnd = Math.min(program.endDate.getTime(), viewport.end.getTime());
    const programDuration = programEnd - programStart;

    const top = ((programStart - viewport.start.getTime()) / viewportDuration) * 100;
    const height = (programDuration / viewportDuration) * 100;

    return { top, height };
  }

  /**
   * Calculate the effective height, respecting min_program_height.
   */
  _getEffectiveHeight(heightPercent) {
    const containerHeight = (this.config.pixels_per_hour || 150) * (this.config.default_hours_visible || 4);
    const minPx = this.config.min_program_height || 30;
    const minHeightPercent = (minPx / containerHeight) * 100;
    return Math.max(heightPercent, minHeightPercent);
  }

  /**
   * Generate timeline hour labels for the current viewport.
   */
  _getTimelineHours() {
    const viewport = this._getViewport();
    const hours = [];
    const startHour = viewport.start.getHours();
    const hoursVisible = viewport.hoursVisible;
    for (let i = 0; i <= hoursVisible; i++) {
      const hour = (startHour + i) % 24;
      hours.push(hour.toString().padStart(2, "0") + ":00");
    }
    return hours;
  }

  /**
   * Check if a channel is visible.
   */
  _isChannelVisible(entityId) {
    if (this._channelVisibility === null) return true;
    return this._channelVisibility[entityId] !== false;
  }

  /**
   * Toggle channel visibility.
   */
  _toggleChannelVisibility(entityId) {
    if (this._channelVisibility === null) {
      this._channelVisibility = {};
      for (const eId of this.config.entities) {
        this._channelVisibility[eId] = true;
      }
    }
    this._channelVisibility[entityId] = !this._channelVisibility[entityId];
    const key = "epg-channels-" + [...this.config.entities].sort().join(",");
    localStorage.setItem(key, JSON.stringify(this._channelVisibility));
    this.requestUpdate();
  }

  /**
   * Load channel visibility from localStorage.
   */
  _loadChannelVisibility() {
    const key = "epg-channels-" + [...this.config.entities].sort().join(",");
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        this._channelVisibility = JSON.parse(stored);
      } catch (e) {
        this._channelVisibility = null;
      }
    }
  }

  // ===== Navigation Methods =====

  _navigateBack() {
    const hours = this.config.default_hours_visible || 4;
    this._viewportStartHour = Math.max(0, this._viewportStartHour - hours);
    this.requestUpdate();
  }

  _navigateForward() {
    const hours = this.config.default_hours_visible || 4;
    const maxStart = Math.max(0, 24 - hours);
    this._viewportStartHour = Math.min(maxStart, this._viewportStartHour + hours);
    this.requestUpdate();
  }

  _navigateNow() {
    this._viewportStartHour = new Date().getHours();
    this.requestUpdate();
  }

  // ===== Popup Methods =====

  _showProgramDetail(program, channel) {
    const allChannels = this._getEpgData();
    const visibleChannels = allChannels.filter((c) => c.visible);
    const channelIndex = visibleChannels.findIndex((c) => c.entityId === channel.entityId);
    this._selectedProgram = {
      ...program,
      channelName: channel.name,
      channelEntityId: channel.entityId,
      channelIndex,
    };
    this.requestUpdate();
  }

  _closeProgramDetail() {
    this._selectedProgram = null;
    this.requestUpdate();
  }

  // ===== Popup Navigation Methods =====

  _navigatePopupPrev() {
    const channels = this._getEpgData().filter((c) => c.visible);
    const channel = channels.find((c) => c.entityId === this._selectedProgram.channelEntityId);
    if (!channel) return;
    const programs = channel.programs;
    const currentIdx = programs.findIndex(
      (p) => p.start === this._selectedProgram.start && p.title === this._selectedProgram.title
    );
    if (currentIdx > 0) {
      const prevProgram = programs[currentIdx - 1];
      this._selectedProgram = {
        ...prevProgram,
        channelName: channel.name,
        channelEntityId: channel.entityId,
        channelIndex: this._selectedProgram.channelIndex,
      };
      this._ensureProgramVisible(prevProgram);
      this.requestUpdate();
    }
  }

  _navigatePopupNext() {
    const channels = this._getEpgData().filter((c) => c.visible);
    const channel = channels.find((c) => c.entityId === this._selectedProgram.channelEntityId);
    if (!channel) return;
    const programs = channel.programs;
    const currentIdx = programs.findIndex(
      (p) => p.start === this._selectedProgram.start && p.title === this._selectedProgram.title
    );
    if (currentIdx < programs.length - 1) {
      const nextProgram = programs[currentIdx + 1];
      this._selectedProgram = {
        ...nextProgram,
        channelName: channel.name,
        channelEntityId: channel.entityId,
        channelIndex: this._selectedProgram.channelIndex,
      };
      this._ensureProgramVisible(nextProgram);
      this.requestUpdate();
    }
  }

  _navigatePopupUp() {
    const channels = this._getEpgData().filter((c) => c.visible);
    const currentIdx = channels.findIndex((c) => c.entityId === this._selectedProgram.channelEntityId);
    if (currentIdx > 0) {
      const prevChannel = channels[currentIdx - 1];
      const currentStart = this._selectedProgram.startDate;
      const currentEnd = this._selectedProgram.endDate;
      const matchingProgram = prevChannel.programs.find(
        (p) => p.startDate < currentEnd && p.endDate > currentStart
      );
      if (matchingProgram) {
        this._selectedProgram = {
          ...matchingProgram,
          channelName: prevChannel.name,
          channelEntityId: prevChannel.entityId,
          channelIndex: currentIdx - 1,
        };
        this._ensureProgramVisible(matchingProgram);
        this.requestUpdate();
      }
    }
  }

  _navigatePopupDown() {
    const channels = this._getEpgData().filter((c) => c.visible);
    const currentIdx = channels.findIndex((c) => c.entityId === this._selectedProgram.channelEntityId);
    if (currentIdx < channels.length - 1) {
      const nextChannel = channels[currentIdx + 1];
      const currentStart = this._selectedProgram.startDate;
      const currentEnd = this._selectedProgram.endDate;
      const matchingProgram = nextChannel.programs.find(
        (p) => p.startDate < currentEnd && p.endDate > currentStart
      );
      if (matchingProgram) {
        this._selectedProgram = {
          ...matchingProgram,
          channelName: nextChannel.name,
          channelEntityId: nextChannel.entityId,
          channelIndex: currentIdx + 1,
        };
        this._ensureProgramVisible(matchingProgram);
        this.requestUpdate();
      }
    }
  }

  _canNavigatePrev() {
    if (!this._selectedProgram) return false;
    const channels = this._getEpgData().filter((c) => c.visible);
    const channel = channels.find((c) => c.entityId === this._selectedProgram.channelEntityId);
    if (!channel) return false;
    const currentIdx = channel.programs.findIndex(
      (p) => p.start === this._selectedProgram.start && p.title === this._selectedProgram.title
    );
    return currentIdx > 0;
  }

  _canNavigateNext() {
    if (!this._selectedProgram) return false;
    const channels = this._getEpgData().filter((c) => c.visible);
    const channel = channels.find((c) => c.entityId === this._selectedProgram.channelEntityId);
    if (!channel) return false;
    const currentIdx = channel.programs.findIndex(
      (p) => p.start === this._selectedProgram.start && p.title === this._selectedProgram.title
    );
    return currentIdx < channel.programs.length - 1;
  }

  _canNavigateUp() {
    if (!this._selectedProgram) return false;
    const channels = this._getEpgData().filter((c) => c.visible);
    const currentIdx = channels.findIndex((c) => c.entityId === this._selectedProgram.channelEntityId);
    return currentIdx > 0;
  }

  _canNavigateDown() {
    if (!this._selectedProgram) return false;
    const channels = this._getEpgData().filter((c) => c.visible);
    const currentIdx = channels.findIndex((c) => c.entityId === this._selectedProgram.channelEntityId);
    return currentIdx < channels.length - 1;
  }

  _ensureProgramVisible(program) {
    const viewport = this._getViewport();
    if (program.startDate < viewport.start || program.startDate >= viewport.end) {
      this._viewportStartHour = Math.max(0, program.startDate.getHours() - 1);
    }
  }

  // ===== Search Methods =====

  _toggleSearch() {
    this._searchVisible = !this._searchVisible;
    this._searchResults = [];
    this._searchQuery = "";
    this.requestUpdate();
  }

  async _executeSearch() {
    if (!this._searchQuery || this._searchQuery.trim().length < 2) {
      this._searchResults = [];
      this.requestUpdate();
      return;
    }

    // Try WS search first
    try {
      const results = await this.hass.callWS({
        type: "call_service",
        domain: "epg",
        service: "search_program",
        service_data: {
          title: this._searchQuery,
        },
        return_response: true,
      });
      const searchResults = results?.response?.results || results?.results || results || [];
      if (Array.isArray(searchResults) && searchResults.length > 0) {
        this._searchResults = searchResults;
        this.requestUpdate();
        return;
      }
    } catch (e) {
      console.warn("EPG WS search failed, falling back to local search:", e);
    }

    // Local fallback
    this._searchResults = this._searchLocally(this._searchQuery);
    this.requestUpdate();
  }

  /**
   * Search through locally loaded program data.
   */
  _searchLocally(query) {
    const channels = this._getEpgData();
    const q = query.toLowerCase().trim();
    const results = [];
    for (const channel of channels) {
      for (const program of channel.programs) {
        if (
          program.title.toLowerCase().includes(q) ||
          (program.desc && program.desc.toLowerCase().includes(q))
        ) {
          results.push({
            title: program.title,
            channel_name: channel.name,
            start_time: program.start,
            end_time: program.end,
            program: program,
            channel: channel,
          });
        }
      }
    }
    return results;
  }

  _handleSearchInput(ev) {
    this._searchQuery = ev.target.value;
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(() => this._executeSearch(), 500);
  }

  _navigateToResult(result) {
    const startHour = parseInt((result.start_time || result.start || "0").split(":")[0], 10);
    this._viewportStartHour = Math.max(0, startHour - 1);
    // If local result with full program data, open the popup
    if (result.program && result.channel) {
      this._selectedProgram = {
        ...result.program,
        channelName: result.channel.name,
        channelEntityId: result.channel.entityId,
      };
    }
    this._searchVisible = false;
    this._searchResults = [];
    this._searchQuery = "";
    this.requestUpdate();
  }

  _closeSearchBackdrop() {
    this._searchVisible = false;
    this._searchResults = [];
    this._searchQuery = "";
    this.requestUpdate();
  }

  // ===== Channel Toggle Method =====

  _toggleChannelsPanel() {
    this._channelsPanelOpen = !this._channelsPanelOpen;
    this.requestUpdate();
  }

  // ===== Rendering Methods =====

  render() {
    if (!this.hass || !this.config) {
      return html`<div class="epg-container">Loading...</div>`;
    }

    const allChannels = this._getEpgData();
    const visibleChannels = allChannels.filter((c) => c.visible);
    const viewport = this._getViewport();
    const columnWidth = this.config.column_width || 160;
    const pixelsPerHour = this.config.pixels_per_hour || 150;
    const hoursVisible = this.config.default_hours_visible || 4;
    const timelineWidth = this.config.timeline_width || 60;
    const programAreaHeight = pixelsPerHour * hoursVisible;

    return html`
      <style>
        .epg-container {
          --epg-column-width: ${columnWidth}px;
          --epg-min-program-height: ${this.config.min_program_height || 30}px;
          --epg-program-bg: ${this.config.program_background_color || "#555555"};
          --epg-program-text: ${this.config.program_text_color || "#ffffff"};
          --epg-program-current-bg: ${this.config.current_program_highlight || "#0056b3"};
          --epg-program-border-radius: ${this.config.program_border_radius || 4}px;
          --epg-timeline-color: ${this.config.timeline_color || "#cccccc"};
          --epg-channel-name-color: ${this.config.channel_name_color || "#ffffff"};
          --epg-timeline-width: ${timelineWidth}px;
          --epg-viewport-height: ${programAreaHeight}px;
        }
      </style>
      <div class="epg-container">
        ${this._renderNavBar()}
        <div class="epg-grid-wrapper">
          ${this._renderTimelineCol(viewport, programAreaHeight)}
          <div class="epg-channels-area">
            ${visibleChannels.map((channel) => this._renderChannelCol(channel, viewport, programAreaHeight))}
          </div>
        </div>
        ${this._renderChannelsBar(allChannels)}
        ${this._selectedProgram ? this._renderPopup() : ""}
        ${this._searchVisible ? this._renderSearchOverlay() : ""}
      </div>
    `;
  }

  _renderNavBar() {
    return html`
      <div class="epg-nav-bar">
        ${this.config.enable_time_navigation
          ? html`
              <button class="epg-nav-btn" @click=${this._navigateBack} title="Earlier">
                ▲
              </button>
              <button class="epg-nav-btn" @click=${this._navigateForward} title="Later">
                ▼
              </button>
              <button class="epg-nav-btn" @click=${this._navigateNow} title="Now">
                🕐
              </button>
            `
          : ""}
        ${this.config.enable_search
          ? html`
              <button class="epg-nav-btn" @click=${this._toggleSearch} title="Search">
                🔍
              </button>
            `
          : ""}
      </div>
    `;
  }

  _renderTimelineCol(viewport, programAreaHeight) {
    const hoursVisible = this.config.default_hours_visible || 4;
    const timelineHours = this._getTimelineHours();
    const viewportDuration = viewport.end.getTime() - viewport.start.getTime();

    // Render time labels at each hour mark (skip the last one which is the boundary)
    const timeLabels = timelineHours.slice(0, -1).map((h, i) => {
      const topPercent = (i / hoursVisible) * 100;
      return html`<div class="epg-timeline-label" style="top: ${topPercent}%">${h}</div>`;
    });

    // Render "now" dot on timeline
    const now = new Date();
    let nowDot = html``;
    if (now >= viewport.start && now <= viewport.end) {
      const nowPercent = ((now.getTime() - viewport.start.getTime()) / viewportDuration) * 100;
      nowDot = html`<div class="epg-now-dot" style="top: ${nowPercent}%"></div>`;
    }

    return html`
      <div class="epg-timeline-col" style="height: ${programAreaHeight}px">
        ${timeLabels}
        ${nowDot}
      </div>
    `;
  }

  _renderChannelCol(channel, viewport, programAreaHeight) {
    const visiblePrograms = this._getVisiblePrograms(channel.programs, viewport);

    return html`
      <div class="epg-channel-col">
        <div class="epg-channel-header">${channel.name}</div>
        <div class="epg-programs-col" style="height: ${programAreaHeight}px">
          ${this._renderNowLineInColumn(viewport)}
          ${visiblePrograms.map((program) =>
            this._renderProgramBlock(program, viewport, channel)
          )}
        </div>
      </div>
    `;
  }

  _renderProgramBlock(program, viewport, channel) {
    const pos = this._getProgramPosition(program, viewport);
    const effectiveHeight = this._getEffectiveHeight(pos.height);
    const isCurrent = program.isCurrent;

    return html`
      <div
        class="epg-program ${isCurrent ? "current" : ""}"
        style="top: ${pos.top}%; height: ${effectiveHeight}%;"
        @click=${() => this._showProgramDetail(program, channel)}
      >
        ${program.title}
      </div>
    `;
  }

  _renderNowLineInColumn(viewport) {
    const now = new Date();
    if (now < viewport.start || now > viewport.end) return html``;
    const viewportDuration = viewport.end.getTime() - viewport.start.getTime();
    const nowPercent = ((now.getTime() - viewport.start.getTime()) / viewportDuration) * 100;
    return html`<div class="epg-now-line" style="top: ${nowPercent}%"></div>`;
  }

  _renderPopup() {
    const p = this._selectedProgram;
    return html`
      <div class="epg-popup-backdrop" @click=${this._closeProgramDetail}>
        <div class="epg-popup" @click=${(e) => e.stopPropagation()}>
          <div class="epg-popup-channel">${p.channelName}</div>
          <div class="epg-popup-title">${p.title}</div>
          <div class="epg-popup-time">${p.start} → ${p.end}</div>
          ${p.desc ? html`<div class="epg-popup-desc">${p.desc}</div>` : ""}
          <div class="epg-popup-nav">
            <button class="epg-popup-nav-btn" @click=${this._navigatePopupUp} ?disabled=${!this._canNavigateUp()} title="Previous channel">▲</button>
            <button class="epg-popup-nav-btn" @click=${this._navigatePopupPrev} ?disabled=${!this._canNavigatePrev()} title="Earlier program">◀</button>
            <button class="epg-popup-nav-btn" @click=${this._navigatePopupNext} ?disabled=${!this._canNavigateNext()} title="Later program">▶</button>
            <button class="epg-popup-nav-btn" @click=${this._navigatePopupDown} ?disabled=${!this._canNavigateDown()} title="Next channel">▼</button>
          </div>
          <button class="epg-popup-close" @click=${this._closeProgramDetail}>Close</button>
        </div>
      </div>
    `;
  }

  _renderSearchOverlay() {
    return html`
      <div class="epg-search-overlay" @click=${this._closeSearchBackdrop}>
        <div class="epg-search-panel" @click=${(e) => e.stopPropagation()}>
          <div class="epg-search-header">
            <input
              class="epg-search-input"
              type="text"
              placeholder="Search programs..."
              .value=${this._searchQuery}
              @input=${this._handleSearchInput}
            />
            <button class="epg-search-close" @click=${this._toggleSearch}>✕</button>
          </div>
          <div class="epg-search-results">
            ${this._searchResults.length === 0 && this._searchQuery.length >= 2
              ? html`<div class="epg-search-no-results">No results found</div>`
              : this._searchResults.map(
                  (r) => html`
                    <div class="epg-search-result" @click=${() => this._navigateToResult(r)}>
                      <div class="epg-search-result-title">${r.title}</div>
                      <div class="epg-search-result-meta">
                        ${r.channel_name} • ${r.start_time || r.start} - ${r.end_time || r.end}
                      </div>
                    </div>
                  `
                )}
          </div>
        </div>
      </div>
    `;
  }

  _renderChannelsBar(channels) {
    return html`
      <div class="epg-channels-bar">
        <button class="epg-channels-toggle-btn" @click=${this._toggleChannelsPanel}>
          📺 Channels ▾
        </button>
      </div>
      ${this._channelsPanelOpen
        ? html`
            <div class="epg-channels-panel">
              ${channels.map(
                (channel) => html`
                  <label class="epg-channels-panel-item">
                    <input
                      type="checkbox"
                      .checked=${channel.visible}
                      @change=${() => this._toggleChannelVisibility(channel.entityId)}
                    />
                    ${channel.name}
                  </label>
                `
              )}
            </div>
          `
        : ""}
    `;
  }
}

class EpgCardImprovedEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
      }
    `;
  }

  setConfig(config) {
    this.config = { ...config };
  }

  _valueChanged(ev) {
    const detail = ev.detail.value;
    this.config = { ...this.config, ...detail };
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this.config } })
    );
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this.config}
        .schema=${[
          {
            name: "entities",
            selector: {
              entity: { domain: "sensor", multiple: true },
            },
          },
          {
            name: "column_width",
            selector: {
              number: { min: 80, max: 400, unit_of_measurement: "px" },
            },
          },
          {
            name: "min_program_height",
            selector: {
              number: { min: 15, max: 100, unit_of_measurement: "px" },
            },
          },
          {
            name: "pixels_per_hour",
            selector: {
              number: { min: 50, max: 500, unit_of_measurement: "px" },
            },
          },
          {
            name: "default_hours_visible",
            selector: {
              number: { min: 1, max: 24, unit_of_measurement: "hours" },
            },
          },
          {
            name: "timeline_width",
            selector: {
              number: { min: 30, max: 120, unit_of_measurement: "px" },
            },
          },
          {
            name: "program_background_color",
            selector: { color_rgb: {} },
          },
          {
            name: "program_text_color",
            selector: { color_rgb: {} },
          },
          {
            name: "current_program_highlight",
            selector: { color_rgb: {} },
          },
          {
            name: "timeline_color",
            selector: { color_rgb: {} },
          },
          {
            name: "channel_name_color",
            selector: { color_rgb: {} },
          },
          {
            name: "enable_search",
            selector: { boolean: {} },
          },
          {
            name: "enable_time_navigation",
            selector: { boolean: {} },
          },
        ]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

customElements.define("epg-card-improved", EpgCardImproved);
customElements.define("epg-card-improved-editor", EpgCardImprovedEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "epg-card-improved",
  name: "EPG Card Improved",
  preview: false,
  description: "An improved EPG card with vertical timeline, touch-friendly popups with navigation, search, and time navigation.",
  documentationURL: "https://github.com/yohaybn/lovelace-epg-card",
});