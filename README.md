# HA BBQ Probe Card

A Lovelace custom card for an Inkbird IBT-4XS or similar four-probe BBQ thermometer.

The card reads live probe sensors, applies per-probe calibration offsets, and controls per-probe target temperatures through Home Assistant `input_number` helpers.

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

After installing through HACS, add the card to a dashboard with:

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

```yaml
input_number:
  bbq_probe_1_target_temp:
    name: BBQ Probe 1 Target Temp
    min: 0
    max: 250
    step: 1
    unit_of_measurement: °F
    icon: mdi:target
  bbq_probe_2_target_temp:
    name: BBQ Probe 2 Target Temp
    min: 0
    max: 250
    step: 1
    unit_of_measurement: °F
    icon: mdi:target
  bbq_probe_3_target_temp:
    name: BBQ Probe 3 Target Temp
    min: 0
    max: 250
    step: 1
    unit_of_measurement: °F
    icon: mdi:target
  bbq_probe_4_target_temp:
    name: BBQ Probe 4 Target Temp
    min: 0
    max: 250
    step: 1
    unit_of_measurement: °F
    icon: mdi:target
  bbq_probe_1_offset:
    name: BBQ Probe 1 Offset
    min: -20
    max: 20
    step: 0.5
    unit_of_measurement: °F
    icon: mdi:tune-variant
  bbq_probe_2_offset:
    name: BBQ Probe 2 Offset
    min: -20
    max: 20
    step: 0.5
    unit_of_measurement: °F
    icon: mdi:tune-variant
  bbq_probe_3_offset:
    name: BBQ Probe 3 Offset
    min: -20
    max: 20
    step: 0.5
    unit_of_measurement: °F
    icon: mdi:tune-variant
  bbq_probe_4_offset:
    name: BBQ Probe 4 Offset
    min: -20
    max: 20
    step: 0.5
    unit_of_measurement: °F
    icon: mdi:tune-variant
```

## Card Config

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
  - name: Probe 3
    entity: sensor.ibbq_7f50_temperature_probe_3
    target_entity: input_number.bbq_probe_3_target_temp
    offset_entity: input_number.bbq_probe_3_offset
  - name: Probe 4
    entity: sensor.ibbq_7f50_temperature_probe_4
    target_entity: input_number.bbq_probe_4_target_temp
    offset_entity: input_number.bbq_probe_4_offset
```

## Ice Bath Calibration

If probe 2 reads `36°F` in an ice bath, set `input_number.bbq_probe_2_offset` to `-4`. The card will display the adjusted probe value as `32°F` while still showing the raw reading when `show_raw_temperature` is enabled.

## Local Demo

```bash
npx http-server . -p 4177
```

Open `http://localhost:4177/demo/`.
