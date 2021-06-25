# Lovelace Timer Bar Card

A progress bar display for [Home Assistant][home-assistant] timers.

The card currently supports **timer** components and stations from [the opensprinkler integration][opensprinkler].

![Screenshots](https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/readme.png)

With a bit of work, you can also [configure the card](#use-with-unsupported-entities) to suppport other types of entities—even plain switches that have automations.

For numerical quantities or percentages, you may be interested in the unaffiliated [bar card](https://github.com/custom-cards/bar-card).

## Install

Timer Bar Card is available from [HACS][hacs]. If you don't have HACS installed, follow the [manual installation](#manual-installation) instructions.

## Options

| Name              | Type    | Requirement     | Description                                          |
| ----------------- | ------- | ------------    | -------------------------------------------          |
| type              | string  | **Required**    | `custom:timer-bar-card`                              |
| entity            | string  | **Optionalish** | Display a single entity, for use in `entities` cards |
| entities          | list    | **Optionalish** | Display multiple entities in a card                  |

Either `entity` or `entities` must be supplied. Use `entity` if you'd like to embed the timer inside a card, or `entities` if you would like to create your own card (and use the card options at the end of this section).

### Nonstandard Entity Config

<details>
<summary>Expand: Configure for entities that use a different set of status states</summary>

| Name          | Type           | Requirement  | Description                                    | Default                                             |
|---------------|----------------|--------------|------------------------------------------------|-----------------------------------------------------|
| active_state  | string or list | **Optional** | State(s) used to indicate a timer is running   | `active`, `on`, `manual`, `program`, `once-program` |
| paused_state  | string or list | **Optional** | State(s) used to indicate a timer is paused    | `paused`                                            |
| waiting_state | string or list | **Optional** | State(s) when a timer is scheduled for later † | `waiting`                                           |
| start_time    | dict           | **Optional** | How the timer's start time is found            | `{attribute: start_time}`                           |
| end_time      | dict           | **Optional** | How the timer's end time is found              | `{attribute: end_time}`                             |
| duration      | dict           | **Optional** | How the timer's duration is found              | `{attribute: duration}`                             |
| debug         | bool           | **Optional** | Show debugging info in card                    | false                                               |

† requires a `start_time` attribute to calculate when the timer will start.

</details>

### Customization

<details>
<summary>Expand: Optional properties to change icons, colors, and sizes.</summary>

| Name           | Type    | Requirement  | Description                                                                                                | Default           |
|----------------|---------|--------------|------------------------------------------------------------------------------------------------------------|-------------------|
| icon           | string  | **Optional** | Customize the icon to shown next to the timer                                                              | -                 |
| active_icon    | boolean | **Optional** | Override `icon` when timer is active                                                                       | -                 |
| text_width     | string  | **Optional** | Space alotted for the time remaining (i.e. right offset of bar)                                            | `3.5em`           |
| bar_width      | boolean | **Optional** | Width of progress bar (decrease if the entity name is cut off)                                             | `calc(70% - 7em)` |
| bar_height     | string  | **Optional** | Height of progress bar                                                                                     | `8px`             |
| bar_foreground | string  | **Optional** | Foreground color of progress bar                                                                           | primary color †   |
| bar_background | string  | **Optional** | Background color of progress bar                                                                           | `#eee`            |
| bar_direction  | string  | **Optional** | Override the direction of bar progress. Can be `ltr` or `rtl`                                              | -                 |
| modifications  | array   | **Optional** | Adjustments to make depending on percentage ([example](<#customize-appearance-based-on-timer-percentage>)) | -                 |
| translations   | dict    | **Optional** | Mapping of substitutions for status text                                                                   |                   |

† the primary color is taken from your theme using `var(--mdc-theme-primary, #6200ee);`

</details>

### Card options

<details>
<summary>Expand: Customize the header and display of entities within the card. To use the card, <code>entities</code> must be defined.</summary>

 | Name             | Type    | Requirement  | Description                                             | Default |
 |------------------|---------|--------------|---------------------------------------------------------|---------|
 | name             | string  | **Optional** | Card name / title                                       | -       |
 | compressed       | boolean | **Optional** | Decrease vertical spacing between entities              | `false` |
 | filter           | boolean | **Optional** | Only show non-idle timers and sort them by their status | `false` |
 | header_entity    | string  | **Optional** | Replace title with the icon & name of an entity †       | -       |
 | header_secondary | string  | **Optional** | Show additional information under header_entity ‡       | -       |

† If you specify `header_entity`, the `name` option will no longer have any effect. \
‡ See the `secondary_info` parameter in the [entities documentation](<https://www.home-assistant.io/lovelace/entities/#secondary_info>) for a list of possible values.

</details>

## Examples

### A Basic Example

<img alt="Screenshot" src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/basic.png" width="445" height="165" />

```yaml
type: custom:timer-bar-card
entities:
  - timer.alarm
  - timer.alarm_two
  - timer.alarm_three
```

### Receding progress bar

By default, the progress bar will extend from left to right. If you'd like the bar instead to shrink from right to left (as if it were counting down, rather than counting up), reverse the bar direction and invert the colors:

```yaml
bar_direction: rtl
bar_foreground: '#eee'
bar_background: 'var(--mdc-theme-primary, #6200ee)'
```

### Use with [OpenSprinkler integration][opensprinkler]

<img alt="Screenshot" src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/sprinkler.png" width="457" height="168" />

```yaml
entities:
  - sensor.s14_station_status
  - sensor.s15_station_status
  - sensor.s16_station_status
type: custom:timer-bar-card
name: Sprinkler
active_state: # This option isn't needed due to the defaults
  - manual
  - program
bar_width: 35%
compressed: true
filter: true # So only the running and scheduled stations are shown
```

### Use with unsupported entities

By default, the card will look for `duration`, `remaining`, `start_time`, or `end_time` attribute on your entity.

You can find a subset of these attributes in the entity popup, and a full list by going visiting the Developer Tools:

<img alt="Developer Tools Screenshot " src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/devtools.png" />

**STEP ONE**: Assign `active_state`, `paused_state`, and `waiting_state` if your entity's states are not included in the defaults (refererence the example above).

**STEP TWO**: Turn on card debug mode by adding `debug: true` to the yaml configuration.

**STEP THREE**: Then follow these steps in order to figure out what you need:

#### 1. My entity has an attribute that looks like `duration` (for example, `timespan`). Supply the following configuration:

```yaml
duration: { attribute: "timespan" }
debug: true
```

The entity's start time will be computed using the `last_changed` property (when the entity state last changed).

#### 2. The time last changed doesn't approximate the start time well enough, and my entity has a duration-looking attribute and a start time attribute (called `start`).

```yaml
duration: { attribute: "timespan" }
start_time: { attribute: "start" }
debug: true
```

#### 3. The entity has no duration attribute but it has start time  and end time (`finishes_at`) attributes.

```yaml
start_time: { attribute: "start" }
end_time: { attribute: "finishes_at" }
debug: true
```

Duration will be computed as the difference between these two times.

#### 4. My entity has no attributes!

Imagine we have a **switch**, that, through an automation, will always turn off **five minutes** later after it's turned on. *Timer bar card, can we do it? Yes we can!* All it needs is a fixed duration and some love. Always love.

<img alt="Screenshot " src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/switch.png" width="453" height="84" />

```yaml
type: custom:timer-bar-card
entities:
  - switch.my_switch
duration: { fixed: 0:05:00 } # 5 min
```

Like in step 1, there is no `start_time` configured so the card will use the time the switch was last toggled as the start time.

#### 5. If your entity doesn't meet these criteria...

🧡 please create an issue and tell me the entity so I can improve these instructions! ❤️️

> You may notice you cannot set `remaining`. This is because for Home Assistant timers, `remaining`  behaves much like `duration`, so to keep my own sanity I assume `remaining`=`duration`. Since they are equal, you don't need both! Just use `duration`!

### Embedded in an entities card

<img alt="Screenshot" src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/entities-card.png" width="462" height="231" />

```yaml
title: Timer
type: entities
entities:
  - entity: timer.alarm
    type: custom:timer-bar-card
  - entity: timer.alarm_two
    type: custom:timer-bar-card
  - entity: timer.alarm_three
    type: custom:timer-bar-card
```

### Icons and entity in card header

<img src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/header-icons.png" alt="Screenshot" width="477" height="243" />

```yaml
entities:
  - timer.water_timer
  - timer.water_timer2
  - timer.water_timer3
type: custom:timer-bar-card
icon: mdi:water-outline
active_icon: mdi:water
compressed: true
header_entity: binary_sensor.sprinklers
header_secondary: last-changed
```

Home Assistant `configuration.yaml`:

```yaml
timer:
  water_timer:
    name: Front Lawn
    duration: "00:15:00"
  water_timer_2:
    ...

template:
  - binary_sensor:
      - name: "Sprinklers"
        icon: mdi:sprinkler-variant
        state: "{{ states.timer| selectattr('state', 'in', ['paused', 'active'] ) | list | count }}"
```

[Go to the end for themes and multicolored icons](#themes)

### Style to your unique tastes

<img alt="Screenshot" src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/rainbow.png" width="424" height="130" />

```yaml
type: custom:timer-bar-card
entities:
- timer.alarm
- timer.alarm_two
bar_height: 20px
bar_background: '#222'
bar_foreground: 'linear-gradient(to right, red, orange, yellow, green, cyan, blue, violet)'
text_width: 6em
bar_width: 40%
```

### Customize appearance based on timer percentage

<img alt="screenshot" src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/modifications.gif" width="384" height="80" />

```yaml
type: custom:timer-bar-card
entities:
  - timer.alarm
modifications:
  - greater_than: 40
    bar_foreground: orange
    active_icon: mdi:fire
    bar_height: 12px
  - greater_than: 70
    bar_foreground: red
    active_icon: mdi:fire-alert
```

All modifications that match are applied, with the last modification having precedence. This means you'll likeley want to list them in increasing order of percentages, so that styles are overridden as the timer progresses farther.

For each modification, you have the option of using `greater_than` (percentage complete > condition) or `greater_than_eq` (percentage complete ≥ condition).

### Even more options

<img alt="Screenshot" src="https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/translation.png" width="475" height="130" />

Want to change the names of the entity statuses because they are in the wrong language or they just aren't cool enough for you? You can do that! Need to use different settings for each entity? You can do that too (replace the entity id with a YAML dict where the `entity` key is the ID, then you can add any other configuration option you like to change it for that entity).

```yaml
type: custom:timer-bar-card
entities:
  - timer.alarm
  - entity: timer.alarm_two
    icon: mdi:circle
    translations:
      idle: Gas, gas, gas!
```

## Manual installation

1. Download `timer-bar-card.js` from the [latest release][release] and move this file to the `config/www` folder.
2. Ensure you have advanced mode enabled (accessible via your username in the bottom left corner)
3. Go to Configuration -> Lovelace Dashboards -> Resources.
4. Add `/local/timer-bar-card.js` with type JS module.
5. Refresh the page? Or restart Home Assistant? The card should eventually be there.

## Using in your own custom cards

If you're publishing a custom card for Lovelace and would like to use the timer bar card inside of it, you can install the card via NPM as a dependency:

```fish
npm install --save lovelace-timer-bar-card
```

To avoid conflicts with the `timer-bar-card-entity-row` element this plugin defines, you'll need to give your custom element a different tag name.

```typescript
import { fillConfig, TimerBarEntityRow } from 'lovelace-timer-bar-card/src/timer-bar-entity-row';

// Assign the tag <my-card-timer-bar-entity-row> to the entity row element
window.customElements.define('my-card-timer-bar-entity-row', TimerBarEntityRow);

// Use like this
const config = fillConfig({
    // extra customization on top of default config
});
return html`<my-card-timer-bar-entity-row
              .config=${config} .hass=${hass}
            ></my-card-timer-bar-entity-row>`;
```

For an example of using the timer bar card as a dependency, you can view [the source code of the OpenSprinkler card](https://github.com/rianadon/opensprinkler-card/blob/main/src/opensprinkler-card.ts).

## Themes? Multicolored icons? Where?

The green and reddish-orange theme (which I called Earth) as well as the gradient theme can be found [here](https://gist.github.com/rianadon/b2b798cf27c6c609d19855abb9ed61f7). Neither are polished and both need work.

For multicolored icons, you can use this super-duper-hacky frontend module [here](https://gist.github.com/rianadon/83a341fbbf94c7dedd60d7f58b6d84e0) until some form of support officially lands in Home Assistant. I would not rely on my module. Its purpose is merely to produce pretty screenshots so everyone is convinced I have the best dashboards.

[home-assistant]: https://github.com/home-assistant/home-assistant
[opensprinkler]: https://github.com/vinteo/hass-opensprinkler
[hacs]: https://hacs.xyz/
[release]: https://github.com/rianadon/timer-bar-card/releases
