# HA BBQ Probe Card

A Lovelace custom card for an Inkbird IBT-4XS or similar four-probe BBQ thermometer.

The card reads live probe sensors, applies per-probe calibration offsets, and controls per-probe target temperatures through Home Assistant `input_number` helpers.

Target temperatures are set with sliders and quick presets. Probe offsets use small +/- controls for calibration nudges.

## What HACS Installs

HACS installs the dashboard card JavaScript only. Home Assistant helpers are part of your Home Assistant configuration, so you still need to add the `input_number` helpers from [examples/helpers.yaml](examples/helpers.yaml).

## Current Home Assistant Context

From the local Home Assistant config checkout, the existing thermometer entities are:

- `sensor.ibbq_7f50_temperature_probe_1`
- `sensor.ibbq_7f50_temperature_probe_2`
- `sensor.ibbq_7f50_temperature_probe_3`
- `sensor.ibbq_7f50_temperature_probe_4`

Your Home Assistant entity UI shows these under the Inkbird device `34:14:B5:AB:7F:50 7F50` with display names `Temperature Probe 1` through `Temperature Probe 4`.

The live Home Assistant MCP search available to Codex did not return these entities by display name or by the older entity IDs, so the first version is intentionally entity-config driven.

The old setup uses one shared helper, `input_number.bbq_target_temp`, and automations in `automations.yaml`. This card is designed around per-probe targets and per-probe offsets, so the next HA-side step is adding eight helpers.

## Install

### HACS Custom Repository

Add this as a HACS custom repository:

```text
https://github.com/potseeslc/ha-bbq-probe-card
```

Use category **Dashboard**. HACS calls dashboard cards "plugin" repositories internally, so this repo ships one dashboard plugin file:

```text
dist/ha-bbq-probe-card.js
```

After installing through HACS:

1. Add the helper YAML from [examples/helpers.yaml](examples/helpers.yaml) to `configuration.yaml`, or merge the keys under your existing `input_number:` section.
2. Restart Home Assistant, or reload the `input_number` integration if your setup supports it.
3. Add the card config from [examples/card.yaml](examples/card.yaml) to a dashboard.

Minimal card config:

```yaml
type: custom:ha-bbq-probe-card
```

### Manual Install

Copy `dist/ha-bbq-probe-card.js` into Home Assistant, for example:

```text
/config/www/community/ha-bbq-probe-card/ha-bbq-probe-card.js
```

Add a Lovelace resource:

```yaml
url: /local/community/ha-bbq-probe-card/ha-bbq-probe-card.js
type: module
```

## Helper YAML

See [examples/helpers.yaml](examples/helpers.yaml) for the complete helper configuration.

```yaml
input_number:
  bbq_probe_1_target_temp:
    name: BBQ Probe 1 Target Temp
    min: 0
    max: 250
    step: 1
    mode: box
    unit_of_measurement: °F
    icon: mdi:target
    initial: 0
  bbq_probe_2_target_temp:
    name: BBQ Probe 2 Target Temp
    min: 0
    max: 250
    step: 1
    mode: box
    unit_of_measurement: °F
    icon: mdi:target
    initial: 0
  # Continue with probes 3-4 and offset helpers from examples/helpers.yaml.
```

## Card Config

See [examples/card.yaml](examples/card.yaml) for a complete four-probe card config.

```yaml
type: custom:ha-bbq-probe-card
title: Smoke Session
probes:
  - name: Probe 1
    entity: sensor.ibbq_7f50_temperature_probe_1
    target_entity: input_number.bbq_probe_1_target_temp
    offset_entity: input_number.bbq_probe_1_offset
  - name: Probe 2
    entity: sensor.ibbq_7f50_temperature_probe_2
    target_entity: input_number.bbq_probe_2_target_temp
    offset_entity: input_number.bbq_probe_2_offset
```

If your Inkbird entity IDs differ, replace the `entity:` values with your own probe sensor IDs. Keep the helper entity IDs aligned with the helper YAML unless you intentionally rename them.

Optional card-level target range:

```yaml
min_target: 80
max_target: 250
target_step: 1
```

You can also override `min_target` and `max_target` on an individual probe.

## Placeholder Readings

Some Inkbird probes report `32°F` when a probe is not inserted. By default, the card treats a raw `32°F` reading as not inserted when that probe has target `off` and offset `0`.

You can also add `placeholder_value: 32` to any probe that should always render that reading as empty/null instead of a real temperature:

```yaml
probes:
  - name: Probe 3
    entity: sensor.ibbq_7f50_temperature_probe_3
    target_entity: input_number.bbq_probe_3_target_temp
    offset_entity: input_number.bbq_probe_3_offset
    placeholder_value: 32
```

If a probe really needs to display unadjusted `32°F` readings while target is off and offset is `0`, disable automatic placeholders for that probe:

```yaml
probes:
  - name: Probe 2
    entity: sensor.ibbq_7f50_temperature_probe_2
    target_entity: input_number.bbq_probe_2_target_temp
    offset_entity: input_number.bbq_probe_2_offset
    placeholder_value: false
```

During ice-bath calibration, a cheap probe usually reads above `32°F` and the offset brings the adjusted display down to `32°F`, so the automatic placeholder rule will not hide it.

## Ice Bath Calibration

If probe 2 reads `36°F` in an ice bath, set `input_number.bbq_probe_2_offset` to `-4`. The card will display the adjusted probe value as `32°F` while still showing the raw reading when `show_raw_temperature` is enabled.

## Local Demo

```bash
npx http-server . -p 4177
```

Open `http://localhost:4177/demo/`.
