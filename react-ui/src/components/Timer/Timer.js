import React from 'react';
import Input from '../Input';
import Button from '../Button';
import classNames from 'classnames';

const Timer = ({ timer, time, input, onInputChange, onToggleTimer }) => {
  return (
    <div className="inline-block2">
      <div className="timer-wrapper">
        <div className="timer-active">
          <div className={classNames({ showTimer: !timer.isStopped }, { hideTimer: timer.isStopped })}>
            <div id="bars">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bar movement" />
              ))}
            </div>
            <div className="stopwatch">
              <span>{time.hours}:</span>
              <span>{time.minutes}:</span>
              <span>{time.seconds}.</span>
              <span>{time.tenths}</span>
            </div>
          </div>
        </div>
        Mins
        <Input
          name="timer"
          className="timer-form"
          value={input}
          placeholder="25"
          handleChange={onInputChange}
        />
        <Button onClick={onToggleTimer} className="button timer">
          {timer.isStopped ? <span>Start</span> : <span>Stop</span>}
          timer
        </Button>
      </div>
    </div>
  );
};

export default Timer;

