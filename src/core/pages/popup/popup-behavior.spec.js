import { initialGeneralSettings } from '../../reducers/defaults.js';

describe('popup defaults', function () {
  it('should default to showing tabs in most recently used order on popup open', function () {
    expect(initialGeneralSettings.shouldSortByMostRecentlyUsedOnPopup).to.equal(true);
  });
});
