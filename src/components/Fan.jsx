import _ from 'lodash-es';
import classNames from 'classnames';
import React, {
  useContext,
  useState,
} from 'react';
import WebsocketConnectionContext from '../contexts/WebsocketConnection.js';

import humanDate from '../lib/humanDate.js';

const Fan = function(props) {
  const {config = {}, status = {}} = props;

  const [_detailed, setDetailed] = useState(false);

  const {value: speedValue, since: speedSince} = status.speed || {};
  const {value: controlValue, since: controlSince} = status.control || {};

  const websocketConnected = useContext(WebsocketConnectionContext);

  const onAutoClick = () => props.onControlChange('auto');
  const onOffClick  = () => props.onSpeedChange('off');
  const onMinClick  = () => props.onSpeedChange('min');
  const onMaxClick  = () => props.onSpeedChange('max');

  const buttonClasses = [
    'fan__controls__button',
  ];

  if(!websocketConnected) {
    buttonClasses.push('disabled');
  }

  const autoButtonClasses = [
    ...buttonClasses,
    'fan__controls__button--auto',
  ];

  const offButtonClasses = [
    ...buttonClasses,
    'fan__controls__button--off',
  ];

  const minButtonClasses = [
    ...buttonClasses,
    'fan__controls__button--min',
  ];

  const maxButtonClasses = [
    ...buttonClasses,
    'fan__controls__button--max',
  ];

  const renderDetails = () => {
    if(!_detailed) {
      return null;
    }

    return (
      <div className='fan__details'>
        <div className='fan__details__control'>[{controlValue}] seit {humanDate(controlSince) || 'unbekannt'}</div>
        <div className='fan__details__control'>[{speedValue}]   seit {humanDate(speedSince) || 'unbekannt'}</div>
      </div>
    );
  };

  return (
    <div className='fan'>
      <div className='fan__header'>
        <div className='fan__header__label' onClick={() => setDetailed(!_detailed)}>
          {config.label}
        </div>
        <div className='fan__header__status'>
          <div className={`fan__header__status__control fan__header__status__control--${controlValue}`} title={`Seit: ${controlSince}`}>
            {controlValue}
          </div>
          <div>:</div>
          <div className={`fan__header__status__value  fan__header__status__value--${speedValue}`} title={`Seit: ${speedSince}`}>
            {speedValue}
          </div>
        </div>
      </div>
      <div className='fan__controls'>
        <button disabled={!websocketConnected} className={classNames(autoButtonClasses)} onClick={onAutoClick}>auto</button>
        <button disabled={!websocketConnected} className={classNames(offButtonClasses)}  onClick={onOffClick}>off</button>
      </div>
      <div className='fan__controls'>
        <button disabled={!websocketConnected} className={classNames(minButtonClasses)}  onClick={onMinClick}>min</button>
        <button disabled={!websocketConnected} className={classNames(maxButtonClasses)}  onClick={onMaxClick}>max</button>
      </div>
      {renderDetails()}
    </div>
  );
};

export default Fan;
