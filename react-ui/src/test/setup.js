import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import React from 'react';

// react-hover-image ships a webpack CJS bundle that doesn't interop with ESM imports under Vitest.
// Swap in a plain <img> that keeps the props the app relies on (src, hoverSrc, onClick).
vi.mock('react-hover-image', () => ({
  default: ({ src, hoverSrc, onClick }) =>
    React.createElement('img', { src, 'data-hover-src': hoverSrc, onClick, alt: '' }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

beforeEach(() => {
  // Keep test output readable; the app logs heavily.
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  // jsdom has no Notification API; give every test a controllable stub.
  const NotificationMock = vi.fn();
  NotificationMock.permission = 'granted';
  NotificationMock.requestPermission = vi.fn(() => Promise.resolve('granted'));
  vi.stubGlobal('Notification', NotificationMock);

  // jsdom canvas has no 2D context; stub just enough for the favicon drawing.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,TEST');
});
