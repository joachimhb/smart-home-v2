import classNames from 'classnames';
// import _ from 'lodash-es';

import React, {
  useContext,
} from 'react';
import WebsocketConnectionContext from '../contexts/WebsocketConnection';
// import humanDate from '../lib/humanDate';

const Shutter = function(props) {
  const {
    // config  = {},
    button = {},
    data = {},
    full,
  } = props;

  const {value: statusValue,       since: statusSince}       = data.status || {};
  const {value: movementValue,     since: movementSince}     = data.movement || {};
  const {value: switchActiveValue, since: switchActiveSince} = data.switchActive || {};

  const websocketConnected = useContext(WebsocketConnectionContext);

  const onUpClick     = () => props.onMovementChange('up');
  const onStopClick   = () => props.onMovementChange('stop');
  const onDownClick   = () => props.onMovementChange('down');
  const onLockClick   = () => props.onSwitchActiveStatus('toggle');

  const buttonClasses = [
    'window__shutter__controls__button',
  ];

  if(!websocketConnected) {
    buttonClasses.push('disabled');
  }

  const upButtonClasses = [
    ...buttonClasses,
    'window__shutter__controls__button--up',
    movementValue === 'up' ? 'active' : '',
  ];

  const stopButtonClasses = [
    ...buttonClasses,
    'window__shutter__controls__button--stop',
    movementValue === 'stop' ? 'active' : '',
  ];

  const downButtonClasses = [
    ...buttonClasses,
    'window__shutter__controls__button--down',
    movementValue === 'down' ? 'active' : '',
  ];

  const renderSwitch = () => {
    if(!full || !button) {
      return;
    }

    return (
      <div className='window__switch__controls'>
        <button disabled={!websocketConnected} onClick={onLockClick}>
          <div className='lock'><div />L</div>
        </button>
      </div>
    );
  };

  return (
    <div className='window__shutter'>
      <div className='window__shutter__status' title={`Seit: ${statusSince}`}>
        <div className='window__shutter__status__value' style={{height: `${statusValue}%`}} />
      </div>
      <div className='window__shutter__controls' title={`Seit: ${movementSince}`}>
        <button disabled={!websocketConnected} className={classNames(upButtonClasses)} onClick={onUpClick}>
          <div className='arrow'><span /></div>
        </button>
        <button disabled={!websocketConnected} className={classNames(stopButtonClasses)} onClick={onStopClick}>
          <div className='pause'><div /><div /></div>
        </button>
        <button disabled={!websocketConnected} className={classNames(downButtonClasses)} onClick={onDownClick}>
          <div className='arrow'><span /></div>
        </button>
      </div>
      {renderSwitch()}
    </div>
  );
};

export default Shutter;
