# HA BBQ Probe Card

A Lovelace custom card for an Inkbird IBT-4XS or similar four-probe BBQ thermometer.

The card reads live probe sensors, applies per-probe calibration offsets, and controls per-probe target temperatures through Home Assistant `input_number` helpers.

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

## Placeholder Readings

Some Inkbird probes report `32°F` when a probe is not inserted. Add `placeholder_value: 32` to any probe that should render that reading as empty/null instead of a real temperature:

```yaml
probes:
  - name: Probe 3
    entity: sensor.ibbq_7f50_temperature_probe_3
    target_entity: input_number.bbq_probe_3_target_temp
    offset_entity: input_number.bbq_probe_3_offset
    placeholder_value: 32
```

This is per-probe on purpose. If probe 2 is in an ice bath, leave `placeholder_value` off probe 2 so `32°F` still displays as a real reading.

## Ice Bath Calibration

If probe 2 reads `36°F` in an ice bath, set `input_number.bbq_probe_2_offset` to `-4`. The card will display the adjusted probe value as `32°F` while still showing the raw reading when `show_raw_temperature` is enabled.

## Local Demo

```bash
npx http-server . -p 4177
```

Open `http://localhost:4177/demo/`.
