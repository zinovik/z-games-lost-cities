import { LostCities } from '../src';

test('create new game instance', () => {
  const lostCities = LostCities.Instance;
  expect(lostCities).not.toBeNull();
  expect(lostCities).not.toBeUndefined();
});
