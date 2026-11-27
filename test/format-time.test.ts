/*
 * Time formats (the card's `format` option)
 * ==========================================
 *
 * `format` can be one of these presets, which show the time remaining:
 *
 *   hms   hours:minutes:seconds, dropping leading zero units (1:40, 2:46:40)
 *   hm    hours:minutes, minutes rounded up (2:47)
 *   d     whole days, rounded up
 *   h     whole hours, rounded up
 *   m     whole minutes, rounded up
 *   s     whole seconds, rounded up
 *
 * Or it can be any text with %tokens interpolated, such as "%m minutes" or "%H:%MM:%SS".
 * Text that isn't a token is shown as-is.
 *
 *   %hms                 hours:minutes:seconds, dropping leading zero units (1:40, 2:46:40)
 *   %hm                  hours:minutes, minutes rounded up (2:47)
 *   %d, %h, %m, %s       the total time in days/hours/minutes/seconds, rounded up
 *   %D, %H, %M, %S       one component of the time (days, hours of the day, minutes of the
 *                        hour, seconds of the minute), rounded down. Use these together,
 *                        e.g. "%D days %H:%M:%S"
 *   %HH, %MM, %SS        like %H/%M/%S but padded to two digits, e.g. "%H:%MM:%SS"
 *
 * Any of these tokens can be prefixed to show a time other than the time remaining:
 *
 *   %dur:<token>         the timer's total duration, e.g. "%MM:%SS / %dur:MM:%dur:SS"
 *                        shows 03:20 / 05:00, and "%hms / %dur:hms" shows 3:20 / 5:00
 *   %ela:<token>         the time elapsed (duration - remaining), e.g. "%ela:hms elapsed"
 *
 * And %perc shows the percent of the duration elapsed, rounded down (e.g. "%perc%" -> 33%).
 *
 * %dur:, %ela: and %perc need the card to know the timer's duration; if it doesn't, they are
 * left as-is. Longer formats may need a larger `text_width`.
 *
 * The tests below show examples of each.
 */
import formatTime from "../src/format-time";

it("Doesn't replace the wrong thing", () => {
    expect(formatTime(0, 'the time is hms!')).toBe('the time is hms!')
    expect(formatTime(0, 'this %% hat m%akes sense')).toBe('this %% hat m%akes sense')
});

it("Can render short times", () => {
    const d = 10
    expect(formatTime(d, 'hms')).toBe('10')
    expect(formatTime(d, 'hm')).toBe('1')
    expect(formatTime(d, 'd')).toBe('1')
    expect(formatTime(d, 'h')).toBe('1')
    expect(formatTime(d, 'm')).toBe('1')
    expect(formatTime(d, 's')).toBe('10')
    expect(formatTime(d, 'the time is %hms!')).toBe('the time is 10!')
    expect(formatTime(d, 'the time is %m!')).toBe('the time is 1!')
    expect(formatTime(d, 'the time is %s!')).toBe('the time is 10!')
});

it("Can render longer times", () => {
    const d = 100
    expect(formatTime(d, 'hms')).toBe('1:40')
    expect(formatTime(d, 'hm')).toBe('2')
    expect(formatTime(d, 'd')).toBe('1')
    expect(formatTime(d, 'h')).toBe('1')
    expect(formatTime(d, 'm')).toBe('2')
    expect(formatTime(d, 's')).toBe('100')
    expect(formatTime(d, 'the time is %hms!')).toBe('the time is 1:40!')
    expect(formatTime(d, 'the time is %hm!')).toBe('the time is 2!')

    expect(formatTime(-d, 'hms')).toBe('-1:40')
    expect(formatTime(-d, 'hm')).toBe('-1')
    expect(formatTime(-d, 'd')).toBe('0')
});

it("Can render long times", () => {
    const d = 10000
    expect(formatTime(d, 'hms')).toBe('2:46:40')
    expect(formatTime(d, 'hm')).toBe('2:47')
    expect(formatTime(d, 'h')).toBe('3')
    expect(formatTime(d, 'm')).toBe('167')
    expect(formatTime(d, 's')).toBe('10000')
    expect(formatTime(d, 'the time is %d days')).toBe('the time is 1 days')
    expect(formatTime(d, 'the time is %h hours')).toBe('the time is 3 hours')
    expect(formatTime(d, 'the time is %m minutes')).toBe('the time is 167 minutes')
    expect(formatTime(d, 'the time is %s seconds')).toBe('the time is 10000 seconds')
    expect(formatTime(d, 'the time is %D:%H:%M:%S')).toBe('the time is 0:2:46:40')
    expect(formatTime(d, 'the time is %D:%HH:%MM:%SS')).toBe('the time is 0:02:46:40')

    expect(formatTime(-d, 'hms')).toBe('-2:46:40')
    expect(formatTime(-d, 'hm')).toBe('-2:46')
    expect(formatTime(-d, 'h')).toBe('-2')
    expect(formatTime(-d, 'm')).toBe('-166')
    expect(formatTime(-d, 'the time is %d days')).toBe('the time is 0 days')
    expect(formatTime(-d, 'the time is %m minutes')).toBe('the time is -166 minutes')
    expect(formatTime(-d, 'the time is %D:%HH:%MM:%SS')).toBe('the time is -0:02:46:40')
    expect(formatTime(-d, 'the time is %H:%MM:%SS')).toBe('the time is -2:46:40')
});

it('can render negative times', () => {
    expect(formatTime(-30, 'hms')).toBe('-30')
    expect(formatTime(-60, 'hms')).toBe('-1:00')
    expect(formatTime(-90, 'hms')).toBe('-1:30')
});

it('can render tricky times', () => {
  expect(formatTime(59 + 59*60 + 1*60*60, 'hm')).toBe('2:00')
});

test('duration, elapsed and percent tokens', () => {
  const duration = 300
  expect(formatTime(200, '%MM:%SS / %dur:MM:%dur:SS', { duration })).toBe('03:20 / 05:00')
  expect(formatTime(200, '%hms / %dur:hms', { duration })).toBe('3:20 / 5:00')
  expect(formatTime(200, '%ela:hms elapsed', { duration })).toBe('1:40 elapsed')
  expect(formatTime(200, '%perc%', { duration })).toBe('33%')
  expect(formatTime(0, '%perc%', { duration })).toBe('100%')
  expect(formatTime(-10, '%ela:s s', { duration })).toBe('310 s')
  expect(formatTime(-10, '%perc%', { duration })).toBe('100%')
  // %d is still days, not the duration
  expect(formatTime(200, '%d days', { duration })).toBe('1 days')
})

// Tests for internals:

test('num only transforms filled-in time values', () => {
  const placeholder = (n: string) => n.replace(/\d/g, '4')
  expect(formatTime(2684, 'hms', { num: placeholder })).toBe('44:44')
  expect(formatTime(4000, 'hm', { num: placeholder })).toBe('4:44')
  expect(formatTime(605, '%m min %SS s (x2)', { num: placeholder })).toBe('44 min 44 s (x2)')
  expect(formatTime(-30, '%M:%SS', { num: placeholder })).toBe('-4:44')
})

test('duration tokens are left as-is without a duration', () => {
  expect(formatTime(200, '%hms / %dur:hms')).toBe('3:20 / %dur:hms')
  expect(formatTime(200, '%ela:MM %perc%')).toBe('%ela:MM %perc%')
  expect(formatTime(200, '%perc', { duration: 0 })).toBe('%perc')
})

test('num transforms duration tokens too', () => {
  const placeholder = (n: string) => n.replace(/\d/g, '4')
  expect(formatTime(200, '%hms / %dur:hms (%perc%)', { duration: 300, num: placeholder })).toBe('4:44 / 4:44 (44%)')
})
