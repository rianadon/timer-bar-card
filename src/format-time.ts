/** secondsToDuration is adapted from the custom-card-helpers library,
    which in turn was adapted from Home Assistant.

    https://github.com/home-assistant/frontend/blob/dev/src/common/datetime/seconds_to_duration.ts

    I've added the configurable resolution.

    EDIT: This has been turned into a general-purpose time formatting library.
*/

type Resolution = "seconds"|"minutes"|"automatic";


const leftPad = (num: number) => (num < 10 ? `0${num}` : num);

/** Returns "minutes" if seconds>=1hr, otherwise minutes. */
function automaticRes(seconds: number) {
    if (seconds >= 3600) return "minutes"
    return "seconds"
}


export function formatFromResolution(seconds: number, resolution: Resolution): string {
  switch (resolution === "automatic" ? automaticRes(seconds) : resolution) {
    case "seconds": return "hms"
    case "minutes": return "hm"
  }
}

function joinWithColons(h: number, m: number, s: number): string {
  if (h > 0) return `${h}:${leftPad(m)}:${leftPad(s)}`;
  if (m > 0) return `${m}:${leftPad(s)}`;
  return "" + s;
}
const hmsTime = (d: number) => {
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = Math.floor((d % 3600) % 60);
  return joinWithColons(h, m, s);
}
const hmTime = (d: number) => {
  const h = Math.floor(d / 3600);
  const m = Math.ceil((d % 3600) / 60); // Round up the minutes (#86)
  return joinWithColons(0, h, m);
}

export default function formatTime(d: number, format: string) {
  if (format == 'hms') return hmsTime(d)
  if (format == 'hm') return hmTime(d)
  if (format == 'h') return ''+Math.ceil(d / 3600)
  if (format == 'm') return ''+Math.ceil(d / 60)
  if (format == 's') return ''+Math.ceil(d)

  return format.replace(/%(\w+)/, (match, S) => {
    const s = S.toLowerCase()
    if (s.startsWith('hms')) return hmsTime(d) + s.substring(3)
    if (s.startsWith('hm')) return hmTime(d) + s.substring(2)
    if (s.startsWith('h')) return Math.ceil(d / 3600) + s.substring(1)
    if (s.startsWith('m')) return Math.ceil(d / 60) + s.substring(1)
    if (s.startsWith('s')) return Math.ceil(d) + s.substring(1)
    return match
  })
}
