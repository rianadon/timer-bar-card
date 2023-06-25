/** secondsToDuration is adapted from the custom-card-helpers library,
    which in turn was adapted from Home Assistant.

    https://github.com/home-assistant/frontend/blob/dev/src/common/datetime/seconds_to_duration.ts

    I've added the configurable resolution.
*/

type Resolution = "seconds"|"minutes"|"automatic";

const leftPad = (num: number) => (num < 10 ? `0${num}` : num);

/** Returns "minutes" if seconds>=1hr, otherwise minutes. */
function automaticRes(seconds: number) {
    if (seconds >= 3600) return "minutes"
    return "seconds"
}

/** Returns the h:m:s components as numbers. */
function toHMS(d: number, resolution: Resolution) {
    switch(resolution === "automatic" ? automaticRes(d) : resolution) {
        case "seconds": {
            const h = Math.floor(d / 3600);
            const m = Math.floor((d % 3600) / 60);
            const s = Math.floor((d % 3600) % 60);
            return [h,m,s];
        }
        case "minutes": {
            const h = Math.floor(d / 3600);
            const m = Math.ceil((d % 3600) / 60); // Round up the minutes (#86)
            return [0,h,m];
        }
    }
}

/** Convert some number of seconds into a duration string. */
export default function secondsToDuration(d: number, resolution: Resolution) {
  const [h, m, s] = toHMS(d, resolution)

  if (h > 0) {
    return `${h}:${leftPad(m)}:${leftPad(s)}`;
  }
  if (m > 0) {
    return `${m}:${leftPad(s)}`;
  }
  if (s > 0) {
    return "" + s;
  }
  return null;
}
