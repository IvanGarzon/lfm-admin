import { describe, it, expect } from 'vitest';
import { UAParser } from 'ua-parser-js';

const userAgents = [
  {
    device: 'iPhone',
    os: 'iOS',
    browser: 'Mobile Safari',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
  },
  {
    device: 'iPhone',
    os: 'iOS',
    browser: 'Mobile Chrome',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.93 Mobile Safari/537.36',
  },
  {
    device: 'SM-G991B',
    os: 'Android',
    browser: 'Mobile Chrome',
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36',
  },
  {
    device: 'Pixel 4',
    os: 'Android',
    browser: 'Firefox',
    userAgent:
      'Mozilla/5.0 (Android 10; Pixel 4 Build/QP1A.190711.020) Gecko/20100101 Firefox/88.0',
  },
  {
    device: 'Macintosh',
    os: 'macOS',
    browser: 'Safari',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/13.0 Safari/537.36',
  },
  {
    device: undefined,
    os: 'Windows',
    browser: 'Chrome',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
];

describe('User Agent Tests', () => {
  userAgents.forEach(({ device, os, browser, userAgent }) => {
    it(`should correctly parse the user agent for ${device}`, () => {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      // Check that device information is parsed correctly
      expect(result.device.model).toBe(device);
      expect(result.os.name).toBe(os);
      expect(result.browser.name).toBe(browser);
    });
  });
});

describe('User Agent Parsing', () => {
  it('should parse iPhone user agent', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1';
    const parser = new UAParser(ua);
    const result = parser.getResult();

    expect(result.device.model).toBe('iPhone');
    expect(result.os.name).toBe('iOS');
    expect(result.os.version).toBe('16.3');
  });
});
