const ForecastChecker = require('../../../core/bonus/engine/forecastChecker');

describe('ForecastChecker', ()=>{
test('returns true when revenue is above threshold', () => {
    const checker = new ForecastChecker(90, 10000);
    expect(checker.isForecastMet(9500)).toBe(true);
});

test('returns true when revenue is equal to threshold', () =>{
    const checker = new ForecastChecker(90, 10000);
    expect(checker.isForecastMet(9000)).toBe(true);
});

test('returns false when revenue is below threshold', () => {
    const checker = new ForecastChecker(90, 10000);
    expect(checker.isForecastMet(6000)).toBe(false);
});

test('returns false when revenue is zero', () => {
    const checker = new ForecastChecker(90, 10000);
    expect(checker.isForecastMet(0)).toBe(false);
});

test('returns true when monthly forecast is zero', ()=>{
    const checker = new ForecastChecker(90, 0);
    expect(checker.isForecastMet(3000)).toBe(true)
});
})