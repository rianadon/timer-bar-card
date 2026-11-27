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

/** Options for formatTime. */
export interface FormatOptions {
  /** Total duration of the timer in seconds, if known. Needed for %dur:, %ela: and %perc. */
  duration?: number;
  /**
   * Every time value the formatter fills in (but not the format's own text) is passed through
   * `num`, e.g. to replace its digits when computing the text's shape.
   */
  num?: (n: string) => string;
}

/** Format one interpolated component (S is the part after %), or return undefined if unknown. */
function formatComponent(d: number, S: string, num: (n: string) => string): string | undefined {
  const sl = S.toLowerCase()
  if (sl.startsWith('hms')) return num(hmsTime(d)) + S.substring(3)
  if (sl.startsWith('hm')) return num(hmTime(d)) + S.substring(2)
  // 1 lowercase letter: round up
  if (S.startsWith('d')) return num('' + Math.ceil(d / 24 / 3600)) + S.substring(1)
  if (S.startsWith('h')) return num('' + Math.ceil(d / 3600)) + S.substring(1)
  if (S.startsWith('m')) return num('' + Math.ceil(d / 60)) + S.substring(1)
  if (S.startsWith('s')) return num('' + Math.ceil(d)) + S.substring(1)
  // 2 capital letter: pad + round down
  if (S.startsWith('HH')) return num('' + leftPad(Math.trunc((d % (3600 * 24)) / 3600))) + S.substring(2)
  if (S.startsWith('MM')) return num('' + leftPad(Math.trunc((d % 3600) / 60))) + S.substring(2)
  if (S.startsWith('SS')) return num('' + leftPad(Math.trunc(d % 60))) + S.substring(2)
  // 1 capital letter: round down, always include sign (for next component)
  if (S.startsWith('D')) return num(truncateWithSign(d / 24 / 3600)) + S.substring(1)
  if (S.startsWith('H')) return num(truncateWithSign((d % (3600 * 24)) / 3600)) + S.substring(1)
  if (S.startsWith('M')) return num(truncateWithSign((d % 3600) / 60)) + S.substring(1)
  if (S.startsWith('S')) return num(truncateWithSign(d % 60)) + S.substring(1)
  return undefined
}

/**
 * Formats the remaining time `d` (seconds).
 * Interpolated formats may also use:
 *   %dur:<token>      total duration, e.g. %hms / %dur:hms
 *   %ela:<token>      time elapsed (duration - remaining), e.g. %ela:hms
 *   %perc             percent of the duration elapsed, rounded down
 * These need the duration; without it they are left as-is.
 */
export default function formatTime(d: number, format: string, { duration, num = (n: string) => n }: FormatOptions = {}) {
  if (format == 'hms') return num(hmsTime(d))
  if (format == 'hm') return num(hmTime(d))

  // When rendering a single component, always round up to count consistent whole units.
  if (format == 'd') return num('' + Math.ceil(d / 24 / 3600))
  if (format == 'h') return num('' + Math.ceil(d / 3600))
  if (format == 'm') return num('' + Math.ceil(d / 60))
  if (format == 's') return num('' + Math.ceil(d))


  // When rendering multiple components, round towards zero because the fraction should
  // be represented by the next unit.
  return format.replace(/%(?:(ela|dur):)?(\w+)/g, (match, which, S) => {
    if (!which && S.startsWith('perc')) {
      if (!duration) return match
      const percent = Math.min(Math.max((duration - d) / duration * 100, 0), 100)
      return num('' + Math.floor(percent)) + S.substring(4)
    }
    let t = d
    if (which) {
      if (duration == undefined) return match
      t = which === 'dur' ? duration : Math.max(duration - d, 0)
    }
    return formatComponent(t, S, num) ?? match
  })
}
