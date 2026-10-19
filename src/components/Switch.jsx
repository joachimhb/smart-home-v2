import _ from 'lodash-es';
// import classNames from 'classnames';
import React from 'react';
import humanDate from '../lib/humanDate';

const Switch = function(props) {
  const {
    config = {},
    status = {},
    detailed,
    onChange = _.noop,
  } = props;

  const newValue = status.value === 'ON' ? 'OFF' : 'ON';

  return [
    <div key='value' className='switch'>
      <button onClick={() => onChange(newValue)} className='button header-switch'>{config.label}</button>
      {/* <div className='switch__label'>{config.label}:</div> */}
      <div className='switch__value' title={`Seit: ${status.since || 'unbekannt'}`}>{status.value === 'ON' ? 'an' : 'aus'}</div>
    </div>,
    <div key='detailed' className='switch switch-detail'>
      {detailed ? <div className='switch__since'>seit {humanDate(status.since) || 'unbekannt'}</div> : null}
    </div>,
  ];
};

export default Switch;
