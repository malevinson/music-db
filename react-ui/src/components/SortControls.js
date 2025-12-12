import React from 'react';
import Button from './Button';
import Input from './Input';
import classNames from 'classnames';
import { uiMap } from '../constants';

const SortControls = ({ activeSort, sortUp, input, onSort, onInputChange }) => {
  return (
    <div className="controls">
      <div className="button-wrapper">
     
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
          <div className="filter">
            <Input
              name="filter"
              value={input}
              handleChange={onInputChange}
              style={{
                marginLeft: '10px',
                ...(input.filter && input.filter.length ? { border: '4px dashed red' } : { })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortControls;

