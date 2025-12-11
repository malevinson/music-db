import React from 'react';
import Button from './Button';
import Input from './Input';
import classNames from 'classnames';
import { uiMap } from '../constants';

const SortControls = ({ activeSort, sortUp, input, onSort, onInputChange }) => {
  return (
    <div className="controls">
      <div className="button-wrapper">
        <div className="column">
          <label>
            YouTube Music
            <input name="googleMusic" type="checkbox" />
          </label>
          <label>
            Spotify
            <input name="spotify" type="checkbox" />
          </label>
          <label>
            Pandora
            <input name="pandora" type="checkbox" />
          </label>
        </div>
        {Object.keys(uiMap).map((key) => {
          const buttonName = uiMap[key];
          const isActive = activeSort === buttonName;

          return (
            <Button
              key={buttonName}
              className={classNames({ active: isActive })}
              onClick={() => onSort(buttonName)}
            >
              <i className={classNames({ show: isActive && sortUp && buttonName !== 'Shuffle' }, 'fas fa-arrow-up')} />
              {buttonName}
              <i className={classNames({ show: isActive && !sortUp && buttonName !== 'Shuffle' }, 'fas fa-arrow-down')} />
            </Button>
          );
        })}
        <div>
          <div className="filter" style={input?.filter?.length ? { border: '3px dashed red' } : {}}>
            <Input
              name="filter"
              value={input}
              handleChange={onInputChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortControls;

