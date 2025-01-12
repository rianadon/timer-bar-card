/** secondsToDuration is adapted from the custom-card-helpers library,
    which in turn was adapted from Home Assistant.

    https://github.com/home-assistant/frontend/blob/dev/src/common/datetime/seconds_to_duration.ts

    I've added the configurable resolution.

    EDIT: This has been turned into a general-purpose time formatting library.
*/

type Resolution = "seconds" | "minutes" | "automatic";


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
  let h = Math.trunc(d / 3600);
  let m = Math.ceil((d % 3600) / 60); // Round up the minutes (#86)
  if (m == 60) {
    // Edge case: minutes rounded up to 60, so I need to carry to the hours
    h += 1;
    m = 0;
  }
  return joinWithColons(0, h, m);
}

/** Like Math.truncate(), but truncates `-.5` to `'-0'` */
function truncateWithSign(d: number): string {
  const result = Math.trunc(d);
  if (d < 0 && result === 0) return `-${-result}`;
  return result.toString();
}

export default function formatTime(d: number, format: string) {
  if (format == 'hms') return hmsTime(d)
  if (format == 'hm') return hmTime(d)

  // When rendering a single component, always round up to count consistent whole units.
  if (format == 'd') return '' + Math.ceil(d / 24 / 3600)
  if (format == 'h') return '' + Math.ceil(d / 3600)
  if (format == 'm') return '' + Math.ceil(d / 60)
  if (format == 's') return '' + Math.ceil(d)


  // When rendering multiple components, round towards zero because the fraction should
  // be represented by the next unit.
  return format.replace(/%(\w+)/g, (match, S) => {
    const sl = S.toLowerCase()
    if (sl.startsWith('hms')) return hmsTime(d) + S.substring(3)
    if (sl.startsWith('hm')) return hmTime(d) + S.substring(2)
    // 1 lowercase letter: round up
    if (S.startsWith('d')) return Math.ceil(d / 24 / 3600) + S.substring(1)
    if (S.startsWith('h')) return Math.ceil(d / 3600) + S.substring(1)
    if (S.startsWith('m')) return Math.ceil(d / 60) + S.substring(1)
    if (S.startsWith('s')) return Math.ceil(d) + S.substring(1)
    // 2 capital letter: pad + round down
    if (S.startsWith('HH')) return leftPad(Math.trunc((d % (3600 * 24)) / 3600)) + S.substring(2)
    if (S.startsWith('MM')) return leftPad(Math.trunc((d % 3600) / 60)) + S.substring(2)
    if (S.startsWith('SS')) return leftPad(Math.trunc(d % 60)) + S.substring(2)
    // 1 capital letter: round down, always include sign (for next component)
    if (S.startsWith('D')) return truncateWithSign(d / 24 / 3600) + S.substring(1)
    if (S.startsWith('H')) return truncateWithSign((d % (3600 * 24)) / 3600) + S.substring(1)
    if (S.startsWith('M')) return truncateWithSign((d % 3600) / 60) + S.substring(1)
    if (S.startsWith('S')) return truncateWithSign(d % 60) + S.substring(1)
    return match
  })
}
