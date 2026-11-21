// notifications.js reads its channel config from env at import time, so each test loads a fresh copy.
const mail = vi.hoisted(() => ({ sendMail: vi.fn(), createTransport: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: mail.createTransport } }));

const load = async (env = {}) => {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import('./notifications.js');
};

const ok = (body = {}) => ({ ok: true, statusText: 'OK', json: () => Promise.resolve(body) });
const fail = () => ({ ok: false, statusText: 'Bad Request', json: () => Promise.resolve({}) });

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve(ok()));
  vi.stubGlobal('fetch', fetchMock);
  mail.sendMail.mockResolvedValue({});
  mail.createTransport.mockReturnValue({ sendMail: mail.sendMail });
});

const callsTo = (url) => fetchMock.mock.calls.filter(([u]) => u === url);
const bodyTo = (url) => JSON.parse(callsTo(url)[0][1].body);

describe('getClientIp', () => {
  let getClientIp;
  beforeEach(async () => ({ getClientIp } = await load()));

  it('uses the first x-forwarded-for address', () => {
    expect(getClientIp({ headers: { 'x-forwarded-for': ' 8.8.8.8 , 10.0.0.1' } })).toBe('8.8.8.8');
  });

  it('falls back through x-real-ip, connection, socket and req.ip', () => {
    expect(getClientIp({ headers: { 'x-real-ip': '1.1.1.1' } })).toBe('1.1.1.1');
    expect(getClientIp({ headers: {}, connection: { remoteAddress: '2.2.2.2' } })).toBe('2.2.2.2');
    expect(getClientIp({ headers: {}, socket: { remoteAddress: '3.3.3.3' } })).toBe('3.3.3.3');
    expect(getClientIp({ headers: {}, ip: '4.4.4.4' })).toBe('4.4.4.4');
  });

  it('returns Unknown when nothing is available', () => {
    expect(getClientIp({ headers: {} })).toBe('Unknown');
  });
});

describe('getIpInfo', () => {
  it.each(['127.0.0.1', '192.168.1.5', '10.1.2.3', '172.16.0.1'])('skips the lookup for private IP %s', async (ip) => {
    const { getIpInfo } = await load();
    await expect(getIpInfo({ headers: { 'x-forwarded-for': ip } })).resolves.toEqual({ ip, location: 'Local/Private IP' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the lookup when the IP is unknown', async () => {
    const { getIpInfo } = await load();
    await expect(getIpInfo({ headers: {} })).resolves.toEqual({ ip: 'Unknown', location: 'Local/Private IP' });
  });

  it('looks up public IPs with ip-api.com', async () => {
    fetchMock.mockResolvedValue(ok({
      status: 'success', city: 'Raleigh', regionName: 'North Carolina', country: 'United States',
      lat: 35.78, lon: -78.64, isp: 'Comcast',
    }));
    const { getIpInfo } = await load();
    const info = await getIpInfo({ headers: { 'x-forwarded-for': '8.8.8.8' } });

    expect(fetchMock.mock.calls[0][0]).toBe('http://ip-api.com/json/8.8.8.8?fields=status,country,regionName,city,lat,lon,isp');
    expect(info).toEqual({
      ip: '8.8.8.8',
      location: 'Raleigh, North Carolina, United States',
      country: 'United States',
      city: 'Raleigh',
      region: 'North Carolina',
      coordinates: '35.78, -78.64',
      isp: 'Comcast',
    });
  });

  it('fills in Unknown for missing fields', async () => {
    fetchMock.mockResolvedValue(ok({ status: 'success', country: 'France' }));
    const { getIpInfo } = await load();
    const info = await getIpInfo({ headers: { 'x-forwarded-for': '8.8.8.8' } });
    expect(info).toMatchObject({ city: 'Unknown', region: 'Unknown', isp: 'Unknown', coordinates: null });
  });

  // KNOWN BUG: the cleanup regex only strips one leading ", ", so a lookup with no city/region
  // yields ", France". Remove `.fails` once getLocationFromIp joins only the non-empty parts.
  it.fails('formats a location with only a country cleanly', async () => {
    fetchMock.mockResolvedValue(ok({ status: 'success', country: 'France' }));
    const { getIpInfo } = await load();
    const info = await getIpInfo({ headers: { 'x-forwarded-for': '8.8.8.8' } });
    expect(info.location).toBe('France');
  });

  it('reports "Unable to determine" when the lookup fails', async () => {
    fetchMock.mockResolvedValue(ok({ status: 'fail' }));
    const { getIpInfo } = await load();
    await expect(getIpInfo({ headers: { 'x-forwarded-for': '8.8.8.8' } }))
      .resolves.toEqual({ ip: '8.8.8.8', location: 'Unable to determine' });
  });

  it('reports "Unable to determine" when the lookup throws', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { getIpInfo } = await load();
    await expect(getIpInfo({ headers: { 'x-forwarded-for': '8.8.8.8' } }))
      .resolves.toEqual({ ip: '8.8.8.8', location: 'Unable to determine' });
  });
});

describe('sendNotification', () => {
  it('does nothing when no channels are configured', async () => {
    const { sendNotification } = await load();
    await sendNotification('Subject', 'Body');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mail.createTransport).not.toHaveBeenCalled();
  });

  it('posts to Slack, Discord and a custom webhook when configured', async () => {
    const { sendNotification } = await load({
      SLACK_WEBHOOK_URL: 'https://slack.test/hook',
      DISCORD_WEBHOOK_URL: 'https://discord.test/hook',
      CUSTOM_WEBHOOK_URL: 'https://custom.test/hook',
    });
    await sendNotification('Subject', 'Body', { extra: 1 });

    expect(bodyTo('https://slack.test/hook')).toEqual({ text: 'Subject\n\nBody' });
    expect(bodyTo('https://discord.test/hook')).toEqual({ content: 'Subject\n\nBody' });
    expect(bodyTo('https://custom.test/hook')).toEqual({ subject: 'Subject', message: 'Body', extra: 1 });
    callsTo('https://slack.test/hook').forEach(([, opts]) => {
      expect(opts.method).toBe('POST');
      expect(opts.headers['Content-Type']).toBe('application/json');
    });
  });

  it('never throws when channels fail', async () => {
    const { sendNotification } = await load({
      SLACK_WEBHOOK_URL: 'https://slack.test/hook',
      DISCORD_WEBHOOK_URL: 'https://discord.test/hook',
      CUSTOM_WEBHOOK_URL: 'https://custom.test/hook',
    });
    fetchMock.mockImplementation((url) => (url.includes('slack') ? Promise.reject(new Error('x')) : Promise.resolve(fail())));
    await expect(sendNotification('S', 'B')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  describe('email', () => {
    const smtp = {
      NOTIFICATION_EMAIL: 'me@x.com',
      SMTP_HOST: 'smtp.test',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
    };

    it('sends an email when SMTP is configured', async () => {
      const { sendNotification } = await load({ ...smtp, SMTP_PORT: '465', SMTP_SECURE: 'true', SMTP_FROM: 'bot@x.com' });
      await sendNotification('Subject', 'line1\nline2');

      expect(mail.createTransport).toHaveBeenCalledWith(expect.objectContaining({
        host: 'smtp.test', port: 465, secure: true, auth: { user: 'user', pass: 'pass' },
      }));
      expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'bot@x.com',
        to: 'me@x.com',
        subject: 'Subject',
        text: 'line1\nline2',
        html: expect.stringContaining('line1<br>line2'),
      }));
    });

    it('defaults to port 587, insecure, from the SMTP user', async () => {
      const { sendNotification } = await load(smtp);
      await sendNotification('S', 'B');
      expect(mail.createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 587, secure: false }));
      expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: 'user' }));
    });

    it('skips email when SMTP settings are incomplete', async () => {
      const { sendNotification } = await load({ NOTIFICATION_EMAIL: 'me@x.com', SMTP_HOST: 'smtp.test' });
      await sendNotification('S', 'B');
      expect(mail.createTransport).not.toHaveBeenCalled();
    });

    it('swallows send failures', async () => {
      mail.sendMail.mockRejectedValue(new Error('auth failed'));
      const { sendNotification } = await load(smtp);
      await expect(sendNotification('S', 'B')).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('Error sending email notification:', 'auth failed');
    });
  });
});

describe('notifyNewUser / notifyDemoAccountChange', () => {
  const env = { CUSTOM_WEBHOOK_URL: 'https://custom.test/hook' };
  const ipInfo = { ip: '8.8.8.8', location: 'Raleigh, NC', country: 'US', city: 'Raleigh', isp: 'Unknown' };

  it('describes a new user, including known location fields', async () => {
    const { notifyNewUser } = await load(env);
    await notifyNewUser('new@x.com', ipInfo);
    const body = bodyTo('https://custom.test/hook');

    expect(body.subject).toBe('🎉 New User Registered');
    expect(body.message).toContain('Email: new@x.com');
    expect(body.message).toContain('IP Address: 8.8.8.8');
    expect(body.message).toContain('Country: US');
    expect(body.message).toContain('City: Raleigh');
    expect(body.message).not.toContain('ISP:'); // Unknown values are left out
    expect(body).toMatchObject({ type: 'new_user', email: 'new@x.com', ip: '8.8.8.8' });
  });

  it('works without location info', async () => {
    const { notifyNewUser } = await load(env);
    await notifyNewUser('new@x.com');
    expect(bodyTo('https://custom.test/hook').message).not.toContain('IP Address');
  });

  it('describes demo account changes', async () => {
    const { notifyDemoAccountChange } = await load(env);
    await notifyDemoAccountChange('Artist Deleted', { artistId: 'a1' }, { ...ipInfo, isp: 'Comcast' });
    const body = bodyTo('https://custom.test/hook');

    expect(body.subject).toBe('🔔 Demo Account Change: Artist Deleted');
    expect(body.message).toContain('The demo@test.com account was modified');
    expect(body.message).toContain('"artistId": "a1"');
    expect(body.message).toContain('ISP: Comcast');
    expect(body).toMatchObject({ type: 'demo_account_change', action: 'Artist Deleted', artistId: 'a1' });
  });
});
