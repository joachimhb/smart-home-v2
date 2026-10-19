// import _ from 'lodash-es';
// import classNames from 'classnames';
import React from 'react';
import humanDate from '../lib/humanDate';

const Light = function(props) {
  const {config = {}, status = {}, detailed} = props;

  return [
    <div key='value' className='light'>
      <div className='light__label'>{config.label}</div>
      <div className='light__value' title={`Seit: ${status.since || 'unbekannt'}`}>{status.value === 'on' ? 'an' : 'aus'}</div>
    </div>,
    <div key='detail' className='light light-detail'>
      {detailed ? <div className='light__since'>seit {humanDate(status.since) || 'unbekannt'}</div> : null}
    </div>,
  ];
};

export default Light;
