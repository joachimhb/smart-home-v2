import classNames from 'classnames';
import _ from 'lodash-es';

import React from 'react';
import humanDate from '../lib/humanDate';

const Window = function(props) {
  const {
    config  = {},
   
    status  = {},
    shutter = null,
    detailed
  } = props;

  const {value, since} = status;

  let windowHumanValue = '???';

  if(!_.isNil(value)) {
    windowHumanValue = value === 'open' ? 'offen' : 'geschlossen';
  }

  const renderDetails = () => {
    if(!detailed) {
      return null;
    }

    return <div className='window__since'>seit {humanDate(since) || 'unbekannt'}</div>;
  };

  return (
    <div className='window'>
      <div className='window__label'>{config.label}</div>
      <div className='window__status'>{windowHumanValue}</div>
      {renderDetails()}
      {shutter}
    </div>
  );
};

export default Window;
