// favicon.js keeps module-level state (original title/icon, last drawn second),
// so each test imports a fresh copy.
const load = async () => {
  vi.resetModules();
  return import('./favicon');
};

describe('favicon timer indicators', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="shortcut icon" href="/Music-icon.png">';
    document.title = 'Music Dashboard';
  });

  const iconHref = () => document.querySelector('link[rel~="icon"]').getAttribute('href');

  it('shows the remaining time in the tab title', async () => {
    const { updateTimerIndicators } = await load();
    updateTimerIndicators(754, 1500);
    expect(document.title).toBe('12:34 – Music Dashboard');
  });

  it('includes hours when more than an hour remains', async () => {
    const { updateTimerIndicators } = await load();
    updateTimerIndicators(3723, 7200);
    expect(document.title).toBe('1:02:03 – Music Dashboard');
  });

  it('rounds partial seconds up', async () => {
    const { updateTimerIndicators } = await load();
    updateTimerIndicators(59.2, 60);
    expect(document.title).toBe('1:00 – Music Dashboard');
  });

  it("shows time's up at zero (and for negative values)", async () => {
    const { updateTimerIndicators } = await load();
    updateTimerIndicators(-3, 60);
    expect(document.title).toBe("⏰ Time's up! – Music Dashboard");
  });

  it('replaces the favicon with a drawn image', async () => {
    const { updateTimerIndicators } = await load();
    updateTimerIndicators(100, 200);
    expect(iconHref()).toBe('data:image/png;base64,TEST');
  });

  it('only redraws when the whole second changes', async () => {
    const { updateTimerIndicators } = await load();
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;

    updateTimerIndicators(10.9, 60);
    updateTimerIndicators(10.5, 60);
    updateTimerIndicators(10.1, 60);
    expect(toDataURL).toHaveBeenCalledTimes(1);

    updateTimerIndicators(9.9, 60);
    expect(toDataURL).toHaveBeenCalledTimes(2);
  });

  it('draws the minutes left (seconds in the last minute)', async () => {
    const { updateTimerIndicators } = await load();
    const ctx = { beginPath: vi.fn(), arc: vi.fn(), stroke: vi.fn(), fill: vi.fn(), fillText: vi.fn() };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx);

    updateTimerIndicators(301, 600);
    expect(ctx.fillText).toHaveBeenLastCalledWith('6', expect.any(Number), expect.any(Number));

    updateTimerIndicators(45, 600);
    expect(ctx.fillText).toHaveBeenLastCalledWith('45', expect.any(Number), expect.any(Number));
  });

  it('turns the ring red in the final minute', async () => {
    const { updateTimerIndicators } = await load();
    const strokes = [];
    const ctx = {
      beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), fillText: vi.fn(),
      stroke: vi.fn(function () { strokes.push(this.strokeStyle); }),
    };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx);

    updateTimerIndicators(120, 600);
    expect(strokes.pop()).toBe('#43a047');
    updateTimerIndicators(30, 600);
    expect(strokes.pop()).toBe('#e53935');
  });

  it('draws a "!" badge when time is up', async () => {
    const { updateTimerIndicators } = await load();
    const ctx = { beginPath: vi.fn(), arc: vi.fn(), stroke: vi.fn(), fill: vi.fn(), fillText: vi.fn() };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx);

    updateTimerIndicators(0, 600);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith('!', expect.any(Number), expect.any(Number));
  });

  it('restores the original icon and title on reset', async () => {
    const { updateTimerIndicators, resetTimerIndicators } = await load();
    updateTimerIndicators(100, 200);
    resetTimerIndicators();

    expect(document.title).toBe('Music Dashboard');
    expect(iconHref()).toMatch(/Music-icon\.png$/);
  });

  it('redraws after a reset even for the same second', async () => {
    const { updateTimerIndicators, resetTimerIndicators } = await load();
    updateTimerIndicators(100, 200);
    resetTimerIndicators();
    updateTimerIndicators(100, 200);
    expect(document.title).toBe('1:40 – Music Dashboard');
  });

  it('creates an icon link if the page has none', async () => {
    document.head.innerHTML = '';
    const { updateTimerIndicators } = await load();
    updateTimerIndicators(5, 10);
    expect(document.querySelector('link[rel="icon"]')).not.toBeNull();
  });
});
