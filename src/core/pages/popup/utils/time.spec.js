import { formatLastAccessedLabel, formatLastAccessedTooltip } from './time.js';

describe('last accessed time formatting', function () {
  it('should format recent activity as a relative label', function () {
    const now = Date.UTC(2026, 3, 7, 16, 0, 0);
    const lastAccessed = now - (5 * 60 * 1000);

    const label = formatLastAccessedLabel(lastAccessed, now);

    expect(label).to.equal('5m ago');
  });

  it('should format older activity as a month and day label', function () {
    const now = Date.UTC(2026, 3, 7, 16, 0, 0);
    const lastAccessed = Date.UTC(2026, 2, 24, 10, 30, 0);

    const label = formatLastAccessedLabel(lastAccessed, now);

    expect(label).to.equal('Mar 24');
  });

  it('should create an accessible tooltip for the timestamp', function () {
    const tooltip = formatLastAccessedTooltip(Date.UTC(2026, 3, 7, 16, 5, 0));

    expect(tooltip).to.match(/^Last accessed /);
    expect(tooltip).to.include('2026');
  });
});
