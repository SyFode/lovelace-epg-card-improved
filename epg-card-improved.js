/**
 * EPG Card Improved
 * A Home Assistant Lovelace card for displaying EPG data from the HomeAssistant-EPG integration.
 * Features: touch-friendly popups, search, time navigation, channel management, visual customization.
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
      .epg-timeline-bar {
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
      .epg-timeline-hours {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      .epg-timeline-hour {
        flex: 1;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        color: var(--epg-timeline-color, #cccccc);
        border-right: 1px solid var(--epg-timeline-color, #cccccc);
        padding: 4px 0;
        min-width: 60px;
      }
      .epg-grid {
        display: flex;
        flex-direction: column;
        position: relative;
      }
      .epg-channel-row {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        height: var(--epg-row-height, 100px);
      }
      .epg-channel-name {
        width: 12%;
        min-width: 80px;
        max-width: 120px;
        font-weight: bold;
        text-align: right;
        padding-right: 8px;
        color: var(--epg-channel-name-color, #ffffff);
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .epg-programs-container {
        flex: 1;
        position: relative;
        height: var(--epg-row-height, 100px);
        overflow-x: auto;
        overflow-y: hidden;
      }
      .epg-programs-inner {
        position: relative;
        height: 100%;
        min-width: 100%;
      }
      .epg-program {
        position: absolute;
        height: calc(var(--epg-row-height, 100px) - 8px);
        top: 4px;
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
      .epg-now-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background-color: red;
        z-index: 10;
      }
      .epg-now-dot {
        position: absolute;
        top: -4px;
        width: 8px;
        height: 8px;
        background-color: red;
        border-radius: 50%;
        z-index: 10;
        transform: translateX(-3px);
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
      row_height: config.row_height || 100,
      min_program_width: config.min_program_width || 80,
      default_hours_visible: config.default_hours_visible || 4,
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
    for (const entityId of this.config.entities) {
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
   * Calculate a program's left position and width as percentages of the viewport.
   */
  _getProgramPosition(program, viewport) {
    const viewportDuration = viewport.end.getTime() - viewport.start.getTime();
    const programStart = Math.max(program.startDate.getTime(), viewport.start.getTime());
    const programEnd = Math.min(program.endDate.getTime(), viewport.end.getTime());
    const programDuration = programEnd - programStart;

    const left = ((programStart - viewport.start.getTime()) / viewportDuration) * 100;
    const width = (programDuration / viewportDuration) * 100;

    return { left, width };
  }

  /**
   * Calculate the effective width, respecting min_program_width.
   */
  _getEffectiveWidth(widthPercent, containerWidth) {
    const minPx = this.config.min_program_width || 80;
    const minWidthPercent = (minPx / containerWidth) * 100;
    return Math.max(widthPercent, minWidthPercent);
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
    this._selectedProgram = { ...program, channelName: channel.name };
    this.requestUpdate();
  }

  _closeProgramDetail() {
    this._selectedProgram = null;
    this.requestUpdate();
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

    try {
      // Use callWS to get service response data (callService doesn't return response)
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
      this._searchResults = Array.isArray(searchResults) ? searchResults : [];
    } catch (e) {
      console.error("EPG search failed:", e);
      this._searchResults = [];
    }
    this.requestUpdate();
  }

  _handleSearchInput(ev) {
    this._searchQuery = ev.target.value;
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(() => this._executeSearch(), 500);
  }

  _navigateToResult(result) {
    const startHour = parseInt(result.start_time?.split(":")[0] || "0", 10);
    this._viewportStartHour = Math.max(0, startHour - 1);
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

  /**
   * Estimate the pixel width of the programs container.
   */
  _estimateContainerWidth() {
    const cardWidth = this.clientWidth || 800;
    const channelNameWidth = Math.min(120, cardWidth * 0.12);
    return cardWidth - channelNameWidth;
  }

  render() {
    if (!this.hass || !this.config) {
      return html`<div class="epg-container">Loading...</div>`;
    }

    const rowHeight = this.config.row_height || 100;
    const minProgramWidth = this.config.min_program_width || 80;
    const allChannels = this._getEpgData();
    const visibleChannels = allChannels.filter((c) => c.visible);
    const viewport = this._getViewport();
    const timelineHours = this._getTimelineHours();

    return html`
      <style>
        .epg-container {
          --epg-row-height: ${rowHeight}px;
          --epg-min-program-width: ${minProgramWidth}px;
          --epg-program-bg: ${this.config.program_background_color || "#555555"};
          --epg-program-text: ${this.config.program_text_color || "#ffffff"};
          --epg-program-current-bg: ${this.config.current_program_highlight || "#0056b3"};
          --epg-program-border-radius: ${this.config.program_border_radius || 4}px;
          --epg-timeline-color: ${this.config.timeline_color || "#cccccc"};
          --epg-channel-name-color: ${this.config.channel_name_color || "#ffffff"};
        }
      </style>
      <div class="epg-container">
        ${this._renderTimeNavBar(timelineHours)}
        <div class="epg-grid">
          ${visibleChannels.map((channel) => this._renderChannelRow(channel, viewport))}
        </div>
        ${this._renderChannelsBar(allChannels)}
        ${this._selectedProgram ? this._renderPopup() : ""}
        ${this._searchVisible ? this._renderSearchOverlay() : ""}
      </div>
    `;
  }

  _renderTimeNavBar(timelineHours) {
    if (!this.config.enable_time_navigation && !this.config.enable_search) {
      return html`
        <div class="epg-timeline-bar">
          <div class="epg-timeline-hours">
            ${timelineHours.map((h) => html`<div class="epg-timeline-hour">${h}</div>`)}
          </div>
        </div>
      `;
    }

    return html`
      <div class="epg-timeline-bar">
        ${this.config.enable_time_navigation
          ? html`
              <button class="epg-nav-btn" @click=${this._navigateBack} title="Previous">
                ◀
              </button>
            `
          : ""}
        <div class="epg-timeline-hours">
          ${timelineHours.map((h) => html`<div class="epg-timeline-hour">${h}</div>`)}
        </div>
        ${this.config.enable_time_navigation
          ? html`
              <button class="epg-nav-btn" @click=${this._navigateForward} title="Next">
                ▶
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

  _renderChannelRow(channel, viewport) {
    const visiblePrograms = this._getVisiblePrograms(channel.programs, viewport);
    const containerWidth = this._estimateContainerWidth();

    return html`
      <div class="epg-channel-row">
        <div class="epg-channel-name">${channel.name}</div>
        <div class="epg-programs-container">
          <div class="epg-programs-inner">
            ${this._renderNowLine(viewport)}
            ${visiblePrograms.map((program) =>
              this._renderProgramBlock(program, viewport, containerWidth, channel)
            )}
          </div>
        </div>
      </div>
    `;
  }

  _renderProgramBlock(program, viewport, containerWidth, channel) {
    const pos = this._getProgramPosition(program, viewport);
    const effectiveWidth = this._getEffectiveWidth(pos.width, containerWidth);
    const isCurrent = program.isCurrent;

    return html`
      <div
        class="epg-program ${isCurrent ? "current" : ""}"
        style="left: ${pos.left}%; width: ${effectiveWidth}%;"
        @click=${() => this._showProgramDetail(program, channel)}
      >
        ${program.title}
      </div>
    `;
  }

  _renderNowLine(viewport) {
    const now = new Date();
    if (now < viewport.start || now > viewport.end) {
      return html``;
    }
    const viewportDuration = viewport.end.getTime() - viewport.start.getTime();
    const nowPosition = ((now.getTime() - viewport.start.getTime()) / viewportDuration) * 100;

    return html`
      <div class="epg-now-line" style="left: ${nowPosition}%;"></div>
      <div class="epg-now-dot" style="left: ${nowPosition}%;"></div>
    `;
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
                        ${r.channel_name} • ${r.start_time} - ${r.end_time}
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
            name: "row_height",
            selector: {
              number: { min: 50, max: 300, unit_of_measurement: "px" },
            },
          },
          {
            name: "min_program_width",
            selector: {
              number: { min: 40, max: 200, unit_of_measurement: "px" },
            },
          },
          {
            name: "default_hours_visible",
            selector: {
              number: { min: 1, max: 24, unit_of_measurement: "hours" },
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
  description: "An improved EPG card with touch-friendly popups, search, and time navigation.",
  documentationURL: "https://github.com/yohaybn/lovelace-epg-card",
});