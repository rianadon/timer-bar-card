# Lovelace Timer Bar Card

A progress bar display for [Home Assistant][home-assistant] timers.

The card currently supports **timer** components and stations from [the opensprinkler integration][opensprinkler].

![Screenshots](https://raw.githubusercontent.com/rianadon/timer-bar-card/main/images/readme.png)

If your entity has `duration`, `remaining`, `start_time`, or `end_time` attributes, it may also work with this card.

For numerical quantities or percentages, you may be interested in the unaffiliated [bar card](https://github.com/custom-cards/bar-card).


## Install

I haven't published to [HACS][hacs] yet, so there's an extra step here:
1. Add this repository to custom repositories by clicking the rotated-90-degrees-ellipses icon in the upper right of HACS and selecting custom repositories. Enter https://github.com/rianadon/timer-bar-card as the url and Lovelace as the category.
2. Click add repositories and search for "timer bar card". Install the card.

If you don't have [HACS][hacs] installed, see [manual installation](#manual-installation).

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

<table> <thead> <tr> <th>Name</th> <th>Type</th> <th>Requirement</th> <th>Description</th> <th>Default</th> </tr> </thead> <tbody> <tr> <td>active_state</td> <td>string or list</td> <td><strong>Optional</strong></td> <td>State(s) used to indicate a timer is running</td> <td><code>active</code>, <code>manual</code>, <code>program</code></td> </tr> <tr> <td>paused_state</td> <td>string or list</td> <td><strong>Optional</strong></td> <td>State(s) used to indicate a timer is paused</td> <td><code>paused</code></td> </tr> <tr> <td>waiting_state</td> <td>string or list</td> <td><strong>Optional</strong></td> <td>State(s) when a timer is scheduled for some later time †</td> <td><code>waiting</code></td> </tr> </tbody> </table>

† requires a `start_time` attribute to calculate when the timer will start.
</details>


### Customization

<details>
<summary>Expand: Optional properties to change icons, colors, and sizes.</summary>
<table> <thead> <tr> <th>Name</th> <th>Type</th> <th>Requirement</th> <th>Description</th> <th>Default</th> </tr> </thead> <tbody> <tr> <td>icon</td> <td>string</td> <td><strong>Optional</strong></td> <td>Customize the icon to shown next to the timer</td> <td>-</td> </tr> <tr> <td>active_icon</td> <td>boolean</td> <td><strong>Optional</strong></td> <td>Override <code>icon</code> when timer is active</td> <td>-</td> </tr> <tr> <td>text_width</td> <td>string</td> <td><strong>Optional</strong></td> <td>Space alotted for the time remaining (i.e. right offset of bar)</td> <td><code>3.5em</code></td> </tr> <tr> <td>bar_width</td> <td>boolean</td> <td><strong>Optional</strong></td> <td>Width of progress bar (decrease if the entity name is cut off)</td> <td><code>calc(70% - 7em)</code></td> </tr> <tr> <td>bar_height</td> <td>string</td> <td><strong>Optional</strong></td> <td>Height of progress bar</td> <td><code>8px</code></td> </tr> <tr> <td>bar_foreground</td> <td>string</td> <td><strong>Optional</strong></td> <td>Foreground color of progress bar</td> <td>primary color †</td> </tr> <tr> <td>bar_background</td> <td>string</td> <td><strong>Optional</strong></td> <td>Background color of progress bar</td> <td><code>#eee</code></td> </tr> <tr> <td>modifications</td> <td>array</td> <td><strong>Optional</strong></td> <td>Adjustments to make depending on percentage (<a href="#customize-appearance-based-on-timer-percentage">example</a>)</td> <td>-</td> </tr> </tbody> </table>

† the primary color is taken from your theme using <code>var(--mdc-theme-primary, #6200ee);</code>
</details>

### Card options

<details>
<summary>Expand: Customize the header and display of entities within the card. To use the card, <code>entities</code> must be defined.</summary>
<table> <thead> <tr> <th>Name</th> <th>Type</th> <th>Requirement</th> <th>Description</th> <th>Default</th> </tr> </thead> <tbody> <tr> <td>name</td> <td>string</td> <td><strong>Optional</strong></td> <td>Card name / title</td> <td>-</td> </tr> <tr> <td>compressed</td> <td>boolean</td> <td><strong>Optional</strong></td> <td>Decrease vertical spacing between entities</td> <td><code>false</code></td> </tr> <tr> <td>filter</td> <td>boolean</td> <td><strong>Optional</strong></td> <td>Only show non-idle timers and sort them by their status</td> <td><code>false</code></td> </tr> <tr> <td>header_entity</td> <td>string</td> <td><strong>Optional</strong></td> <td>Replace title with the icon &amp; name of an entity †</td> <td>-</td> </tr> <tr> <td>header_secondary</td> <td>string</td> <td><strong>Optional</strong></td> <td> Show additional information under header_entity ‡</td> <td>-</td> </tr> </tbody> </table>

† If you specify <code>header_entity</code>, the <code>name</code> option will no longer have any effect. <br>
‡ See the <code>secondary_info</code> parameter in the <a href="https://www.home-assistant.io/lovelace/entities/#secondary_info">entities documentation</a> for a list of possible values.

</details>

## Examples

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
