type Resolution = "seconds" | "minutes" | "automatic" | "hm" | "hms" | "mm:ss";

const leftPad = (num: number) => {
  num = Math.abs(num);
  return (num < 10 ? `0${num}` : num);
};

/** Rounds away from zero. */
const roundUp = (num: number) => num > 0 ? Math.ceil(num) : Math.floor(num);

/** Returns "minutes" if seconds>=1hr, otherwise minutes. */
function automaticRes(seconds: number) {
  if (seconds >= 3600) return "hms"
  return "mm:ss"
}


export function formatFromResolution(seconds: number, resolution: Resolution): string {
  const resolved = resolution === "automatic" ? automaticRes(seconds) : resolution;
  switch (resolved) {
    case "seconds":
    case "hms":
       return "hms"
    case "minutes":
    case "mm:ss":
        return "mm:ss"
    case "hm": return "hm"
    default: return "hms"
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

const mmssTime = (d: number) => {
    const m = Math.trunc(d / 60);
    const s = Math.trunc(d % 60);
    return `${leftPad(m)}:${leftPad(s)}`;
}

/** Like Math.truncate(), but truncates `-.5` to `'-0'` */
function truncateWithSign(d: number): string {
  const result = Math.trunc(d);
  if (d < 0 && result === 0) return `-${-result}`;
  return result.toString();
}

// Corrected function to format with days, months, and years
function formatWithLargeUnits(seconds: number) {
    const SECONDS_IN_MINUTE = 60;
    const MINUTES_IN_HOUR = 60;
    const HOURS_IN_DAY = 24;
    const DAYS_IN_MONTH = 30.44;  // Average days in a month
    const DAYS_IN_YEAR = 365.25; // Average days in a year (accounting for leap years)

    let years = Math.floor(seconds / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_YEAR));
    seconds -= years * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_YEAR;

    let months = Math.floor(seconds / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH));
    seconds -= months * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY * DAYS_IN_MONTH;

    let days = Math.floor(seconds / (SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY));
    seconds -= days * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;

    const h = Math.trunc(seconds / 3600);
    seconds -= h * 3600
    const m = Math.trunc(seconds / 60);
    const s = Math.trunc(seconds % 60);

    let result = "";
    if (years > 0) result += `${years}y `;
    if (months > 0) result += `${months}m `;
    if (days > 0) result += `${days}d `;
    result += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`


    return result.trim();
}

export default function formatTime(d: number, format: string) {
    if (format === 'long') {
        return formatWithLargeUnits(d);
    }
    if (format == 'hms') return hmsTime(d)
    if (format == 'hm') return hmTime(d)
    if (format == 'mm:ss') return mmssTime(d);

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
        if (sl.startsWith('mm:ss')) return mmssTime(d) + S.substring(5);
        // 1 lowercase letter: round up
        // if (S.startsWith('d')) return Math.ceil(d / 24 / 3600) + S.substring(1)
        if (S.startsWith('h')) return Math.ceil(d / 3600) + S.substring(1)
        if (S.startsWith('m')) return Math.ceil(d / 60) + S.substring(1)
        if (S.startsWith('s')) return Math.ceil(d) + S.substring(1)
        // New format codes for years, months, days
        if (S.startsWith('YYYY')) return leftPad(Math.floor(d / (3600 * 24 * 365.25))) + S.substring(4);
        if (S.startsWith('YY')) return leftPad(Math.floor(d / (3600 * 24 * 365.25))) + S.substring(2); //maybe remove
        if (S.startsWith('Y')) return Math.floor(d / (3600 * 24 * 365.25)) + S.substring(1);
        if (S.startsWith('MONTHS')) return leftPad(Math.floor((d / (3600 * 24 * 30.44)) % 12)) + S.substring(6); // Corrected
        if (S.startsWith('MON')) return leftPad(Math.floor((d / (3600 * 24 * 30.44)) % 12)) + S.substring(3);    // Corrected
        if (S.startsWith('MO')) return Math.floor((d / (3600 * 24 * 30.44)) % 12) + S.substring(2);            // Corrected
        if (S.startsWith('DD')) return leftPad(Math.floor((d % (3600 * 24 * 30.44)) / (3600 * 24))) + S.substring(2);
        if (S.startsWith('D')) return Math.floor((d % (3600 * 24 * 30.44)) / (3600 * 24)) + S.substring(1);;
          // 2 capital letter: pad + round down
        if (S.startsWith('HH')) return leftPad(Math.trunc((d % (3600 * 24)) / 3600)) + S.substring(2)
        if (S.startsWith('MM')) return leftPad(Math.trunc((d % 3600) / 60)) + S.substring(2)
        if (S.startsWith('SS')) return leftPad(Math.trunc(d % 60)) + S.substring(2)
        // 1 capital letter: round down, always include sign (for next component)
        // if (S.startsWith('D')) return truncateWithSign(Math.floor(d / (3600 * 24))) + S.substring(1); // Corrected
        if (S.startsWith('H')) return truncateWithSign(Math.trunc((d % (3600 * 24)) / 3600)) + S.substring(1)
        if (S.startsWith('M')) return truncateWithSign(Math.trunc((d % 3600) / 60)) + S.substring(1)
        if (S.startsWith('S')) return truncateWithSign(Math.trunc(d % 60)) + S.substring(1)

        return match
    })
}