import { parseTimestamp } from "../src/helpers";

const NOON_UTC = Date.UTC(2024, 0, 1, 12); // 2024-01-01 12:00:00 UTC
const NOON_LOCAL = new Date(2024, 0, 1, 12).getTime(); // 2024-01-01 12:00:00 in the local timezone

it.each([
  // datetime.isoformat(), how Home Assistant sends datetime attributes
  ["2024-01-01T12:00:00+00:00", NOON_UTC],
  ["2024-01-01T13:00:00+01:00", NOON_UTC],
  ["2024-01-01T06:30:00-05:30", NOON_UTC],
  ["2024-01-01T13:00:00.123456+01:00", NOON_UTC + 123],
  // str(datetime), how Home Assistant templates render datetimes
  ["2024-01-01 13:00:00+01:00", NOON_UTC],
  ["2024-01-01 13:00:00.123456+01:00", NOON_UTC + 123],
  // Naive datetimes have no offset, so they are local time
  ["2024-01-01T12:00:00", NOON_LOCAL],
  ["2024-01-01 12:00:00", NOON_LOCAL],
  ["2024-01-01 12:00:00.123456", NOON_LOCAL + 123],
  // date.isoformat()
  ["2024-01-01", Date.UTC(2024, 0, 1)],
  // Unix timestamps in seconds
  [1704110400, NOON_UTC],
  ["1704110400", NOON_UTC],
  ["1704110400.5", NOON_UTC + 500],
  // Other formats Date.parse understands
  ["2024-01-01T12:00:00Z", NOON_UTC],
  ["2024-01-01T12:00:00.123Z", NOON_UTC + 123],
  ["2024-01-01T12:00", NOON_LOCAL],
  ["Mon, 01 Jan 2024 12:00:00 GMT", NOON_UTC],
  ["Mon Jan 01 2024 13:00:00 GMT+0100", NOON_UTC],
  ["January 1, 2024 12:00:00", NOON_LOCAL],
])("parses %p", (input, expected) => {
  expect(Math.floor(parseTimestamp(input))).toBe(expected); // Whole milliseconds, like Date.parse
});
