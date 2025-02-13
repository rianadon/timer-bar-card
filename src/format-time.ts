type Resolution = "seconds" | "minutes" | "automatic" | "hm" | "hms" | "mm:ss"; // Corrected type

const leftPad = (num: number) => {
  num = Math.abs(num);
  return (num < 10 ? `0${num}` : num);
};

/** Rounds away from zero. */
const roundUp = (num: number) => num > 0 ? Math.ceil(num) : Math.floor(num);

/** Returns "minutes" if seconds>=1hr, otherwise minutes. */
// Changed to return hms or mm:ss
function automaticRes(seconds: number) {
  if (seconds >= 3600) return "hms" // Use hms for >= 1 hour
  return "mm:ss" // Use mm:ss for < 1 hour
}


export function formatFromResolution(seconds: number, resolution: Resolution): string { // Specify return type
  const resolved = resolution === "automatic" ? automaticRes(seconds) : resolution;
  switch (resolved) {
    case "seconds":
    case "hms": // Added hms case.
       return "hms"
    case "minutes":
    case "mm:ss": // Added mm:ss case
        return "mm:ss" // Return mm:ss format
    case "hm": return "hm" //keep the original hm format
    default: return "hms" //Default case
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

// Added mmssTime function
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

export default function formatTime(d: number, format: string) {
  if (format == 'hms') return hmsTime(d)
  if (format == 'hm') return hmTime(d)
  if (format == 'mm:ss') return mmssTime(d); // Added mm:ss handling

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
     // Added mm:ss handling
    if (sl.startsWith('mm:ss')) return mmssTime(d) + S.substring(5);
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