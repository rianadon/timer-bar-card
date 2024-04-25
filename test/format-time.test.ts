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
    expect(formatTime(-d, 'hm')).toBe('-2')
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
    expect(formatTime(-d, 'hm')).toBe('-2:47')
    expect(formatTime(-d, 'h')).toBe('-2')
});
