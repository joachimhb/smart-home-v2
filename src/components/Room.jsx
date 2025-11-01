import _ from 'lodash-es';
import classNames from 'classnames';
import React, {
  useState,
} from 'react';

import Light from './Light.jsx';
import Fan from './Fan.jsx';
import Window from './Window.jsx';
import Shutter from './Shutter.jsx';

import humanDate from '../lib/humanDate';

import {
  updateShutterMovement,
  updateFanControl,
  updateFanSpeed,
  updateFanConfigValue,
  updateLightStatus,
  // updateButtonActive,
  // setShutterMoveTo,
} from '../lib/controls';
import RoomHistory from '../containers/RoomHistory.jsx';

const Room = function(props) {
  const {
    config = {},
    roomStatus = {},
    detailed,
    full,
  } = props;

  const {id: roomId} = config;

  const [_detailed, setDetailed] = useState(Boolean(detailed));
  const [_heatingTemperature, setHeatingTemperature] = useState(_.get(roomStatus, [roomId, 'heating', 'temperature'], 17));

  const classes = [
    'room',
    `room-${roomId}`,
  ];

  if(_detailed) {
    classes.push('room--detailed');
  }
  if(full) {
    classes.push('room--full');
  }

  let temperature = {};

  if(config.mainTemperature) {
    const {type, id} = config.mainTemperature;

    if(type === 'dht22') {
      temperature = _.get(roomStatus, ['temperature', id, 'status'], {});
    }
  }

  let humidity = {};

  if(config.mainHumidity) {
    const {type, id} = config.mainHumidity;

    if(type === 'dht22') {
      humidity = _.get(roomStatus, ['humidity', id, 'status'], {});
    }
  }

  const renderTemperature = () => {
    const {value, since} = temperature;

    if(!value) {
      return null;
    }

    const finalTemperature = value ? value.toFixed(1) : '-';

    return (
      <div className='room__general-status__temperature' title={`Seit: ${since || 'unbekannt'}`}>
        <div className='room__general-status__temperature__value'>{finalTemperature || '-'} C</div>
        {_detailed ? <div className='room__general-status__temperature__since'>seit {humanDate(since) || 'unbekannt'}</div> : null}
      </div>
    );
  };

  const renderHumidity = () => {
    const {value, since} = humidity;

    if(!value) {
      return null;
    }

    return (
      <div className='room__general-status__humidity' title={`Seit: ${since || 'unbekannt'}`}>
        <div className='room__general-status__humidity__value'>{value || '-'} %</div>
        {_detailed ? <div className='room__general-status__humidity__since'>seit {humanDate(since) || 'unbekannt'}</div> : null}
      </div>
    );
  };

  const onBoost = () => setHeatingTemperature(30);

  const renderTemperatureControl = () => {
    if(!config.heating) {
      return null;
    }

    const onPlus = () => setHeatingTemperature(_heatingTemperature + 0.5);
    const onMinus = () => setHeatingTemperature(_heatingTemperature - 0.5);

    let currentColor = null;

    if(temperature.value < _heatingTemperature && Math.abs(_heatingTemperature - temperature.value || 0) > 1) {
      currentColor = '#ad4d4d';
    } else if(temperature.value > _heatingTemperature && Math.abs(_heatingTemperature - temperature.value || 0) > 1) {
      currentColor = 'green';
    }

    return [
      <div key='control' className='room__general-status__heating__control'>
        <div className='room__general-status__heating__control__button' onClick={() => onMinus()}>-</div>
        <div className='room__general-status__heating__control__current-value' style={{color: currentColor}}>{_heatingTemperature}C</div>
        <div className='room__general-status__heating__control__button' onClick={() => onPlus()}>+</div>
      </div>,
      <div key='boost' className='room__general-status__heating__control'>
        <div style={{marginTop: '3px', marginLeft: '23px', paddingLeft: '4px', paddingRight: '4px'}} className='room__general-status__heating__control__button' onClick={() => onBoost()}>boost</div>
      </div>,
    ];
  };

  const renderTemperatureAndHumidityDetails = () => {
    const tempAndHumRows = [];

    for(const dht22 of config.dht22 || []) {
      const thisTemperature = _.get(roomStatus, ['temperature', dht22.id, 'status'], {});
      const thisHumidity = _.get(roomStatus, ['humidity', dht22.id, 'status'], {});

      tempAndHumRows.push(
        <tr key={dht22.id + 'temp'}>
          <td>{dht22.label || dht22.id}</td>
          <td>Temperature</td>
          <td>{_.isNil(thisTemperature.value) ? '-' : thisTemperature.value}C</td>
          <td>{humanDate(thisTemperature.since)}</td>
        </tr>
      );

      tempAndHumRows.push(
        <tr key={dht22.id + 'hum'}>
          <td>{dht22.label || dht22.id}</td>
          <td>Humidity</td>
          <td>{_.isNil(thisHumidity.value) ? '-' : thisHumidity.value}%</td>
          <td>{humanDate(thisHumidity.since)}</td>
        </tr>
      );
    }

    return (
      <div key='temp-humidity-details'>
        <div>Temperatur und Luftfeuchtigkeit</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>since</th>
            </tr>
          </thead>
          <tbody>
            {tempAndHumRows}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWindowDetails = () => {
    const rows = [];

    for(const window of config.windows || []) {
      const windowStatus = _.get(roomStatus, ['window', window.id, 'status'], {});

      rows.push(
        <tr key={window.id}>
          <td>{window.label || window.id}</td>
          <td>{_.isNil(windowStatus.value) ? '-' : windowStatus.value}</td>
          <td>{humanDate(windowStatus.since)}</td>
        </tr>
      );
    }

    if(!rows.length) {
      return null;
    }

    return (
      <div key='window-details'>
        <div>Fenster</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>since</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  };

  const renderShutterDetails = () => {
    const rows = [];

    for(const shutter of config.shutters || []) {
      const shutterStatus = _.get(roomStatus, ['shutter', shutter.id, 'status'], {});
      const shutterMax = _.get(roomStatus, ['shutter', shutter.id, 'max'], {});

      rows.push(
        <tr key={shutter.id + 'status'}>
          <td>{shutter.label || shutter.id}</td>
          <td>Status</td>
          <td>{_.isNil(shutterStatus.value) ? '-' : shutterStatus.value}%</td>
          <td>{humanDate(shutterStatus.since)}</td>
        </tr>
      );

      rows.push(
        <tr key={shutter.id + 'max'}>
          <td>{shutter.label || shutter.id}</td>
          <td>Max</td>
          <td>{_.isNil(shutterMax.value) ? '-' : shutterMax.value}%</td>
          <td>{humanDate(shutterMax.since)}</td>
        </tr>
      );
    }


    if(!rows.length) {
      return null;
    }

    return (
      <div key='shutter-details'>
        <div>Rollaeden</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>since</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHeatingTrvDetails = () => {
    const rows = [];

    for(const trv of _.get(config, ['heating', 'trvs'], [])) {
      const trvSetTemp = _.get(roomStatus, ['heating_trv', trv.id, 'temperature_set'], {});
      const trvActualTemp = _.get(roomStatus, ['heating_trv', trv.id, 'temperature_actual'], {});
      const trvSetValve = _.get(roomStatus, ['heating_trv', trv.id, 'valve_set'], {});
      const trvActualValve = _.get(roomStatus, ['heating_trv', trv.id, 'valve_actual'], {});

      rows.push(
        <tr key={trv.id + 'temp__set'}>
          <td>{trv.label || trv.id}</td>
          <td>Temperature Set</td>
          <td>{_.isNil(trvSetTemp.value) ? '-' : trvSetTemp.value}C</td>
          <td>{humanDate(trvSetTemp.since)}</td>
        </tr>
      );

      rows.push(
        <tr key={trv.id + 'temp__actual'}>
          <td>{trv.label || trv.id}</td>
          <td>Temperature Actual</td>
          <td>{_.isNil(trvActualTemp.value) ? '-' : trvActualTemp.value}C</td>
          <td>{humanDate(trvActualTemp.since)}</td>
        </tr>
      );

      rows.push(
        <tr key={trv.id + 'valve__set'}>
          <td>{trv.label || trv.id}</td>
          <td>Valve Set</td>
          <td>{_.isNil(trvSetValve.value) ? '-' : trvSetValve.value}%</td>
          <td>{humanDate(trvSetValve.since)}</td>
        </tr>
      );

      rows.push(
        <tr key={trv.id + 'valve__actual'}>
          <td>{trv.label || trv.id}</td>
          <td>Valve Actual</td>
          <td>{_.isNil(trvActualValve.value) ? '-' : trvActualValve.value}%</td>
          <td>{humanDate(trvActualValve.since)}</td>
        </tr>
      );
    }

    if(!rows.length) {
      return null;
    }

    return (
      <div key='heating-details'>
        <div>TRVs</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>since</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  };

  const renderFullDetails = () => {
    if(!full) {
      return null;
    }

    return (
      <div>
        <RoomHistory id={roomId} config={config} />
        <pre>{JSON.stringify(config, null, 2)}</pre>
        <pre>{JSON.stringify(roomStatus, null, 2)}</pre>
        {renderTemperatureAndHumidityDetails()}
        {renderWindowDetails()}
        {renderShutterDetails()}
        {renderHeatingTrvDetails()}
      </div>
    );
  };

  const renderGeneralStatus = () => (
    <div className='room__general-status'>
      {renderTemperature(temperature || {})}
      {renderHumidity(humidity || {})}
    </div>
  );

  const renderStatus = () => {
    const fanElements = [];
    const windowElements = [];

    for(const fan of config.fans || []) {
      if(config.id === 'schlafzimmer' && !_detailed) {
        continue;
      }

      fanElements.push(
        <Fan
          key={fan.id}
          detailed={_detailed}
          config={fan}
          status={_.get(roomStatus, ['fan', fan.id])}
          onControlChange={value => {
            updateFanControl(config.id, fan.id, value);
          }}
          onSpeedChange={value => {
            updateFanSpeed(config.id, fan.id, value);
          }}
          onConfigChange={(key, value) => {
            updateFanConfigValue(config.id, fan.id, key, value);
          }}
        />
      );
    }

    for(const windowConfig of config.windows || []) {
      const {id, shutterId} = windowConfig;

      let shutter = null;

      if(shutterId) {
        const shutterConfig = _.find(config.shutters || [], {id: shutterId});
        const shutterData = _.get(roomStatus, ['shutter', shutterId]);

        shutter = (
          <Shutter
            config={shutterConfig}
            data={shutterData}
            onMovementChange={direction => {
              updateShutterMovement(config.id, shutterId, direction);
            }}
          />
        );
      }

      windowElements.push(
        <Window
          key={id}
          detailed={_detailed}
          config={windowConfig}
          status={_.get(roomStatus, ['windows', id, 'status'])}
          shutter={shutter}
        />
      );
    }

    const lightElements = [];

    for(const light of config.lights || []) {
      lightElements.push(
        <Light
          key={light.id}
          detailed={_detailed}
          config={light}
          status={_.get(roomStatus, ['lights', light.id, 'status'])}
          onChange={value => {
            updateLightStatus(config.id, light.id, value);
          }}
        />
      );
    }

    return (
      <div className='room__status'>
        <div className='room__status__lights'>
          {lightElements}
        </div>
        <div className='room__status__fans'>
          {fanElements}
        </div>
        <div className='room__status__windows'>
          {windowElements}
        </div>
        <div className='room__general-status__heating'>
          {renderTemperatureControl()}
        </div>
        {renderFullDetails()}
      </div>
    );
  };

  // console.log(JSON.stringify({config, status}, null, 2));

  const style = {};

  if([
    'kinderzimmer',
    'arbeitszimmer',
    'schlafzimmer',
  ].includes(config.id)) {
    style.minWidth = '110px';
  }

  const jumpToDetails = () => {
    window.location.hash = `/room/${config.id}`;
  };

  const jumpToOverview = () => {
    window.location.hash = `/`;
  };

  return (
    <div className={classNames(classes)} style={style}>
      {full ? <div className='overview-link' onClick={jumpToOverview}>zurueck</div> : null}
      <div className='room__header'>
        <div className='room__header__label' onClick={() => setDetailed(!_detailed)}>{config.label}</div>
        {renderGeneralStatus()}
      </div>
      {renderStatus()}
      {full ? null : <div className='room-link' onClick={jumpToDetails}>details</div>}
    </div>
  );
};

export default Room;
