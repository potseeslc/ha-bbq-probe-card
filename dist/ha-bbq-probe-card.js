class HaBbqProbeCard extends HTMLElement {
  static getStubConfig() {
    return {
      type: "custom:ha-bbq-probe-card",
      title: "IBT-4XS",
      probes: [1, 2, 3, 4].map((number) => ({
        name: `Probe ${number}`,
        entity: `sensor.ibbq_7f50_temperature_probe_${number}`,
        target_entity: `input_number.bbq_probe_${number}_target_temp`,
        offset_entity: `input_number.bbq_probe_${number}_offset`,
      })),
    };
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.probes) || config.probes.length === 0) {
      throw new Error("ha-bbq-probe-card requires a probes array");
    }

    this.config = {
      title: "BBQ Probes",
      unit: "°F",
      min_target: 80,
      max_target: 250,
      target_step: 1,
      offset_step: 0.5,
      show_raw_temperature: true,
      ...config,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 5;
  }

  _state(entityId) {
    return entityId && this._hass?.states ? this._hass.states[entityId] : undefined;
  }

  _num(entityId, fallback = 0) {
    const state = this._state(entityId)?.state;
    const value = Number.parseFloat(state);
    return Number.isFinite(value) ? value : fallback;
  }

  _unit(entityId) {
    return this._state(entityId)?.attributes?.unit_of_measurement || this.config.unit;
  }

  _displayTemp(value, unit = this.config.unit) {
    if (!Number.isFinite(value)) return "--";
    return `${Math.round(value)}${unit}`;
  }

  _asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  _isPlaceholderReading(probe, raw) {
    if (!Number.isFinite(raw)) return false;
    const values = [
      ...this._asArray(this.config.placeholder_values),
      ...this._asArray(probe.placeholder_values),
      ...this._asArray(probe.placeholder_value),
    ];

    return values.some((value) => {
      const numeric = Number.parseFloat(value);
      return Number.isFinite(numeric) && Math.abs(raw - numeric) < 0.05;
    });
  }

  _probeData(probe, index) {
    const rawState = this._state(probe.entity);
    const raw = Number.parseFloat(rawState?.state);
    const offset = this._num(probe.offset_entity, Number.parseFloat(probe.offset || 0) || 0);
    const placeholder = this._isPlaceholderReading(probe, raw);
    const adjusted = Number.isFinite(raw) && !placeholder ? raw + offset : Number.NaN;
    const target = this._num(probe.target_entity, Number.parseFloat(probe.target || 0) || 0);
    const unit = rawState?.attributes?.unit_of_measurement || this.config.unit;
    const remaining = Number.isFinite(adjusted) && target > 0 ? target - adjusted : Number.NaN;
    const progress = target > 0 && Number.isFinite(adjusted)
      ? Math.max(0, Math.min(100, (adjusted / target) * 100))
      : 0;

    return {
      index,
      name: probe.name || rawState?.attributes?.friendly_name || `Probe ${index + 1}`,
      entity: probe.entity,
      targetEntity: probe.target_entity,
      offsetEntity: probe.offset_entity,
      raw,
      adjusted,
      target,
      offset,
      unit,
      progress,
      remaining,
      placeholder,
      unavailable: placeholder || !rawState || ["unknown", "unavailable", "none"].includes(String(rawState.state).toLowerCase()),
    };
  }

  _statusLabel(data) {
    if (data.placeholder) return "not inserted";
    if (data.unavailable) return "offline";
    if (data.target <= 0) return "monitoring";
    if (data.remaining <= 0) return "ready";
    if (data.remaining <= 10) return "close";
    return `${Math.round(data.remaining)}${data.unit} to go`;
  }

  _callSetValue(entityId, value) {
    if (!this._hass || !entityId || !Number.isFinite(value)) return;
    this._hass.callService("input_number", "set_value", {
      entity_id: entityId,
      value,
    });
  }

  _adjust(entityId, current, delta) {
    this._callSetValue(entityId, Number((current + delta).toFixed(1)));
  }

  _targetPreset(temp) {
    this.config.probes.forEach((probe) => {
      if (probe.target_entity) this._callSetValue(probe.target_entity, temp);
    });
  }

  _render() {
    if (!this.shadowRoot || !this.config) return;

    const probes = this.config.probes.map((probe, index) => this._probeData(probe, index));
    const active = probes.find((probe) => !probe.unavailable) || probes[0];
    const heroUnit = active?.unit || this.config.unit;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --bbq-ink: var(--primary-text-color, #f6f3ed);
          --bbq-muted: var(--secondary-text-color, #a8aca2);
          --bbq-panel: color-mix(in srgb, var(--card-background-color, #171914) 88%, #10110e);
          --bbq-line: color-mix(in srgb, var(--divider-color, #ffffff) 24%, transparent);
          --bbq-ember: #f05a28;
          --bbq-gold: #f7bd44;
          --bbq-smoke: #2d332c;
          display: block;
        }

        ha-card {
          overflow: hidden;
          color: var(--bbq-ink);
          background:
            radial-gradient(circle at 16% 8%, rgba(240, 90, 40, .24), transparent 28%),
            radial-gradient(circle at 84% 18%, rgba(247, 189, 68, .16), transparent 24%),
            linear-gradient(145deg, #171913, #0f110e 62%, #181510);
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: var(--ha-card-border-radius, 8px);
          box-shadow: var(--ha-card-box-shadow, 0 18px 52px rgba(0, 0, 0, .34));
        }

        .wrap {
          padding: 18px;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 136px;
          gap: 16px;
          align-items: center;
          margin-bottom: 18px;
        }

        .eyebrow {
          color: var(--bbq-gold);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        h2 {
          margin: 4px 0 10px;
          font-size: 28px;
          line-height: 1;
          letter-spacing: 0;
        }

        .hero-temp {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .temp {
          font-variant-numeric: tabular-nums;
          font-size: 44px;
          font-weight: 850;
          line-height: 1;
        }

        .status {
          color: var(--bbq-muted);
          font-size: 13px;
          line-height: 1.3;
        }

        .device {
          position: relative;
          height: 96px;
          border-radius: 8px;
          background: linear-gradient(155deg, #2d302b, #0c0d0b 72%);
          border: 1px solid rgba(255, 255, 255, .14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12), 0 18px 34px rgba(0, 0, 0, .32);
        }

        .screen {
          position: absolute;
          inset: 16px 16px 18px;
          border-radius: 6px;
          background: linear-gradient(180deg, #b5d7a7, #78956f);
          color: #182214;
          display: grid;
          place-items: center;
          font-size: 30px;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 1px rgba(255, 255, 255, .32);
        }

        .probe-list {
          display: grid;
          gap: 10px;
        }

        .probe {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, .09);
          border-radius: 8px;
          background: rgba(255, 255, 255, .045);
        }

        .probe.offline {
          opacity: .56;
        }

        .probe-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
          margin-bottom: 8px;
        }

        .probe-name {
          font-size: 14px;
          font-weight: 800;
        }

        .probe-reading {
          font-size: 22px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .meta {
          color: var(--bbq-muted);
          font-size: 12px;
          line-height: 1.35;
        }

        .bar {
          height: 7px;
          margin-top: 8px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(255, 255, 255, .1);
        }

        .fill {
          height: 100%;
          width: var(--progress);
          border-radius: inherit;
          background: linear-gradient(90deg, var(--bbq-ember), var(--bbq-gold));
        }

        .controls {
          display: grid;
          gap: 8px;
          min-width: 158px;
        }

        .control {
          display: grid;
          grid-template-columns: 26px minmax(48px, 1fr) 26px;
          align-items: center;
          gap: 6px;
        }

        button {
          width: 26px;
          height: 26px;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, .14);
          border-radius: 6px;
          background: rgba(255, 255, 255, .08);
          color: var(--bbq-ink);
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
        }

        button:hover {
          background: rgba(255, 255, 255, .14);
        }

        .control-label {
          color: var(--bbq-muted);
          font-size: 11px;
          text-align: center;
          white-space: nowrap;
        }

        .presets {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .preset {
          width: auto;
          min-width: 46px;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 800;
        }

        @media (max-width: 520px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .device {
            height: 76px;
          }

          .probe {
            grid-template-columns: 1fr;
          }

          .controls {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      </style>
      <ha-card>
        <div class="wrap">
          <section class="hero">
            <div>
              <div class="eyebrow">Inkbird IBT-4XS</div>
              <h2>${this.config.title}</h2>
              <div class="hero-temp">
                <div class="temp">${this._displayTemp(active?.adjusted, heroUnit)}</div>
                <div class="status">${active ? `${active.name} ${this._statusLabel(active)}` : "waiting for probes"}</div>
              </div>
            </div>
            <div class="device" aria-hidden="true">
              <div class="screen">${this._displayTemp(active?.adjusted, heroUnit)}</div>
            </div>
          </section>

          <section class="probe-list">
            ${probes.map((probe) => `
              <article class="probe ${probe.unavailable ? "offline" : ""}">
                <div>
                  <div class="probe-head">
                    <div>
                      <div class="probe-name">${probe.name}</div>
                      <div class="meta">${this._statusLabel(probe)}</div>
                    </div>
                    <div class="probe-reading">${this._displayTemp(probe.adjusted, probe.unit)}</div>
                  </div>
                  <div class="meta">
                    Target ${probe.target > 0 ? this._displayTemp(probe.target, probe.unit) : "off"}
                    ${this.config.show_raw_temperature ? ` · Raw ${probe.placeholder ? "null" : this._displayTemp(probe.raw, probe.unit)}` : ""}
                    · Offset ${probe.offset > 0 ? "+" : ""}${probe.offset}${probe.unit}
                  </div>
                  <div class="bar"><div class="fill" style="--progress:${probe.progress}%"></div></div>
                </div>
                <div class="controls">
                  <div class="control">
                    <button type="button" data-action="target-down" data-index="${probe.index}" title="Lower target">−</button>
                    <div class="control-label">Target ${probe.target || "off"}</div>
                    <button type="button" data-action="target-up" data-index="${probe.index}" title="Raise target">+</button>
                  </div>
                  <div class="control">
                    <button type="button" data-action="offset-down" data-index="${probe.index}" title="Lower offset">−</button>
                    <div class="control-label">Offset ${probe.offset > 0 ? "+" : ""}${probe.offset}</div>
                    <button type="button" data-action="offset-up" data-index="${probe.index}" title="Raise offset">+</button>
                  </div>
                </div>
              </article>
            `).join("")}
          </section>

          <div class="presets">
            ${(this.config.presets || [120, 145, 165, 203]).map((temp) => `
              <button type="button" class="preset" data-action="preset" data-temp="${temp}">${temp}${this.config.unit}</button>
            `).join("")}
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.action;
        const index = Number.parseInt(event.currentTarget.dataset.index || "-1", 10);
        const probe = probes[index];
        if (action === "preset") {
          this._targetPreset(Number.parseFloat(event.currentTarget.dataset.temp));
        } else if (probe && action === "target-down") {
          this._adjust(probe.targetEntity, probe.target, -this.config.target_step);
        } else if (probe && action === "target-up") {
          this._adjust(probe.targetEntity, probe.target, this.config.target_step);
        } else if (probe && action === "offset-down") {
          this._adjust(probe.offsetEntity, probe.offset, -this.config.offset_step);
        } else if (probe && action === "offset-up") {
          this._adjust(probe.offsetEntity, probe.offset, this.config.offset_step);
        }
      });
    });
  }
}

customElements.define("ha-bbq-probe-card", HaBbqProbeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-bbq-probe-card",
  name: "BBQ Probe Card",
  description: "Four-probe BBQ thermometer card with target and calibration controls.",
});
