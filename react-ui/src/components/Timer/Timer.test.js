import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Timer from './Timer';

const time = { hours: 0, minutes: '24', seconds: '59', tenths: 9 };

describe('Timer', () => {
  it('shows Start and hides the stopwatch when stopped', () => {
    const { container } = render(
      <Timer timer={{ isStopped: true }} time={time} input={{ timer: '25' }} onInputChange={() => {}} onToggleTimer={() => {}} />
    );
    expect(screen.getByRole('button')).toHaveTextContent(/^Start\s*timer$/);
    expect(container.querySelector('.hideTimer')).not.toBeNull();
    expect(screen.getByPlaceholderText('25')).toHaveValue('25');
  });

  it('shows Stop and the running stopwatch when running', () => {
    const { container } = render(
      <Timer timer={{ isStopped: false }} time={time} input={{ timer: '25' }} onInputChange={() => {}} onToggleTimer={() => {}} />
    );
    expect(screen.getByRole('button')).toHaveTextContent(/^Stop\s*timer$/);
    expect(container.querySelector('.showTimer')).not.toBeNull();
    expect(container.querySelector('.stopwatch')).toHaveTextContent('0:24:59.9');
    expect(container.querySelectorAll('.bar')).toHaveLength(9);
  });

  it('forwards toggle clicks and input changes', () => {
    const onToggleTimer = vi.fn();
    const onInputChange = vi.fn();
    render(
      <Timer timer={{ isStopped: true }} time={time} input={{ timer: '25' }} onInputChange={onInputChange} onToggleTimer={onToggleTimer} />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByPlaceholderText('25'), { target: { value: '5' } });
    expect(onToggleTimer).toHaveBeenCalledTimes(1);
    expect(onInputChange).toHaveBeenCalledTimes(1);
  });
});
