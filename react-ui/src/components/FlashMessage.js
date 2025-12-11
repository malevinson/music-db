import React from 'react';
import classNames from 'classnames';

const FlashMessage = ({ showFlashMsg, flashMsg }) => {
  if (!showFlashMsg || !flashMsg) return null;

  return (
    <div className={classNames('flash-msg', { show: showFlashMsg }, { hide: !showFlashMsg })}>
      <div>{flashMsg}</div>
    </div>
  );
};

export default FlashMessage;

