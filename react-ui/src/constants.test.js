import { uiMap, sortMap } from './constants';

describe('constants', () => {
  it('maps every sortable UI label to an artist field', () => {
    Object.values(uiMap)
      .filter((label) => label !== 'Shuffle')
      .forEach((label) => expect(sortMap[label]).toBeDefined());
  });

  it('sorts Date by createdAt', () => {
    expect(sortMap.Date).toBe('createdAt');
  });
});
