/** secondsToDuration is adapted from the custom-card-helpers library,
    which in turn was adapted from Home Assistant.

    https://github.com/home-assistant/frontend/blob/dev/src/common/datetime/seconds_to_duration.ts

    I've added the configurable resolution.

    EDIT: This has been turned into a general-purpose time formatting library.
*/

type Resolution = "seconds"|"minutes"|"automatic";


const leftPad = (num: number) => {
  num = Math.abs(num);
  return (num < 10 ? `0${num}` : num);
};


/** Rounds away from zero. */
const roundUp = (num: number) => num > 0 ? Math.ceil(num) : Math.floor(num);

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
  if (h) return `${h}:${leftPad(m)}:${leftPad(s)}`;
  if (m) return `${m}:${leftPad(s)}`;
  return "" + s;
}
const hmsTime = (d: number) => {
  const h = Math.trunc(d / 3600);
  const m = Math.trunc((d % 3600) / 60);
  const s = Math.trunc((d % 3600) % 60);
  return joinWithColons(h, m, s);
}
const hmTime = (d: number) => {
  const h = Math.trunc(d / 3600);
  const m = Math.ceil((d % 3600) / 60); // Round up the minutes (#86)
  return joinWithColons(0, h, m);
}

export default function formatTime(d: number, format: string) {
  if (format == 'hms') return hmsTime(d)
  if (format == 'hm') return hmTime(d)
  if (format == 'd') return ''+roundUp(d / 24 / 3600)
  if (format == 'h') return ''+roundUp(d / 3600)
  if (format == 'm') return ''+roundUp(d / 60)
  if (format == 's') return ''+roundUp(d)

  return format.replace(/%(\w+)/g, (match, S) => {
    const sl = S.toLowerCase()
    if (sl.startsWith('hms')) return hmsTime(d) + S.substring(3)
    if (sl.startsWith('hm')) return hmTime(d) + S.substring(2)
    // 1 lowercase letter: round up
    if (S.startsWith('d')) return roundUp(d / 24 / 3600) + S.substring(1)
    if (S.startsWith('h')) return roundUp(d / 3600) + S.substring(1)
    if (S.startsWith('m')) return roundUp(d / 60) + S.substring(1)
    if (S.startsWith('s')) return roundUp(d) + S.substring(1)
    // 2 capital letter: pad + round down
    if (S.startsWith('HH')) return leftPad(Math.trunc((d % (3600 * 24)) / 3600)) + S.substring(2)
    if (S.startsWith('MM')) return leftPad(Math.trunc((d % 3600) / 60)) + S.substring(2)
    if (S.startsWith('SS')) return leftPad(Math.trunc(d % 60)) + S.substring(2)
    // 1 capital letter: round down
    if (S.startsWith('D')) return Math.trunc(d / 24 / 3600) + S.substring(1)
    if (S.startsWith('H')) return Math.trunc((d % (3600 * 24)) / 3600) + S.substring(1)
    if (S.startsWith('M')) return Math.trunc((d % 3600) / 60) + S.substring(1)
    if (S.startsWith('S')) return Math.trunc(d % 60) + S.substring(1)
    return match
  })
}
