import _ from 'lodash-es';
import classNames from 'classnames';
import React from 'react';

import Light from './Light.jsx';
import Switch from './Switch.jsx';
import Fan from './Fan.jsx';
import Window from './Window.jsx';
import Shutter from './Shutter.jsx';

import humanDateDiff from '../lib/humanDateDiff.js';

import {
  updateShutterMovement,
  updateFanControl,
  updateFanSpeed,
  updateFanConfigValue,
  updateLightStatus,
  updateSwitchState,
  triggerHeatingBoost,
  triggerHeatingPause,
} from '../lib/controls.js';
import RoomHistory from '../containers/RoomHistory.jsx';
import humanDate from '../lib/humanDate.js';

const Room = function(props) {
  const {
    config = {},
    roomStatus = {},
    // detailed,
    full,
  } = props;

  const {id: roomId} = config;

  const onHeatingBoost = () => {
    triggerHeatingBoost(config.id);
  };

  const onHeatingPause = () => {
    triggerHeatingPause(config.id);
  };

  const classes = [
    'room',
    `room-${roomId}`,
  ];

  if(full) {
    classes.push('room--full');
  }

  let temperature = {};

  if(config.mainTemperature) {
    temperature = _.get(roomStatus, ['temperature', config.mainTemperature, 'status'], {});
  }

  let humidity = {};

  if(config.mainHumidity) {
    humidity = _.get(roomStatus, ['humidity', config.mainHumidity, 'status'], {});
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
        {full ? <div className='room__general-status__since'>seit {humanDate(since) || 'unbekannt'}</div> : null}
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
        {full ? <div className='room__general-status__since'>seit {humanDate(since) || 'unbekannt'}</div> : null}
      </div>
    );
  };

  const renderTemperatureStatus = () => {
    if(!config.heating) {
      return null;
    }

    const firstTrvId = Object.keys(roomStatus.heating_trv || {})[0];

    if(!firstTrvId) {
      return null;
    }

    const firstTrv = roomStatus.heating_trv[firstTrvId];
    const heatingSet = firstTrv.temperature_set.value;
    const heatingState = firstTrv.state.value;

    let color = 'gray';

    if(heatingSet > temperature.value) {
      color = 'orange';

      if(heatingState === 'heat') {
        color = 'red';
      }
    }

    return (
      <div className='room__general-status__heating__status' style={{color, marginLeft: '22px'}}>
        {heatingSet}C - {heatingState}
      </div>
    );
  };

  const renderTemperatureControl = () => {
    if(!config.heating) {
      return null;
    }

    if(_.get(roomStatus, ['heating', 'overall', 'boost', 'value']) === 'active') {
      return <div>boosting...</div>;
    }

    if(_.get(roomStatus, ['heating', 'overall', 'pause', 'value']) === 'active') {
      return <div>pausing...</div>;
    }

    return (
      <div className='room__general-status__heating__control'>
        <button style={{marginTop: '3px', marginLeft: '10px', paddingLeft: '4px', paddingRight: '4px'}} onClick={() => onHeatingBoost()}>boost</button>
        <button style={{marginTop: '3px', marginLeft: '8px', paddingLeft: '4px', paddingRight: '4px'}} onClick={() => onHeatingPause()}>pause</button>
      </div>
    );
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
          <td>{humanDateDiff(thisTemperature.since)}</td>
        </tr>
      );

      tempAndHumRows.push(
        <tr key={dht22.id + 'hum'}>
          <td>{dht22.label || dht22.id}</td>
          <td>Humidity</td>
          <td>{_.isNil(thisHumidity.value) ? '-' : thisHumidity.value}%</td>
          <td>{humanDateDiff(thisHumidity.since)}</td>
        </tr>
      );
    }

    for(const element of _.filter(config.zigbee || [], {type: 'roomthermostat'})) {
      const {
        type,
        manufacturer,
        id,
        label,
      } = element;
      const data = _.get(roomStatus, [`${manufacturer}-${type}`, id, 'info'], {});

      const since = humanDateDiff(data.since);

      for(const [key, value] of Object.entries(data)) {
        if(key === 'since') {
          continue;
        }

        if(_.isPlainObject(value)) {
          continue;
        }

        tempAndHumRows.push(
          <tr key={id + key}>
            {/* <td>{type}</td> */}
            <td>{label || id}</td>
            <td>{key}</td>
            <td>{value}</td>
            <td>{since}</td>
          </tr>
        );
      }

      // console.log(element, data);
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
          <td>{humanDateDiff(windowStatus.since)}</td>
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
          <td>{humanDateDiff(shutterStatus.since)}</td>
        </tr>
      );

      rows.push(
        <tr key={shutter.id + 'max'}>
          <td>{shutter.label || shutter.id}</td>
          <td>Max</td>
          <td>{_.isNil(shutterMax.value) ? '-' : shutterMax.value}%</td>
          <td>{humanDateDiff(shutterMax.since)}</td>
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

  const renderTrvDetails = () => {
    const rows = [];

    for(const element of _.filter(config.zigbee || [], {type: 'heatingthermostat'})) {
      const {
        type,
        manufacturer,
        id,
        label,
      } = element;
      const data = _.get(roomStatus, [`${manufacturer}-${type}`, id, 'info'], {});

      const since = humanDateDiff(data.since);

      for(const [key, value] of Object.entries(data)) {
        if(key === 'since') {
          continue;
        }

        if(_.isPlainObject(value)) {
          continue;
        }

        rows.push(
          <tr key={id + key}>
            {/* <td>{type}</td> */}
            <td>{label || id}</td>
            <td>{key}</td>
            <td>{value}</td>
            <td>{since}</td>
          </tr>
        );
      }

      // console.log(element, data);
    }

    if(!rows.length) {
      return null;
    }

    return (
      <div key='heating-details'>
        <div>Zigbee</div>
        <table>
          <thead>
            <tr>
              {/* <th>Type</th> */}
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
      <div style={{marginTop: '6px'}}>
        <RoomHistory id={roomId} config={config} />
        {renderTemperatureAndHumidityDetails()}
        {renderWindowDetails()}
        {renderShutterDetails()}
        {renderTrvDetails()}
        <div style={{overflow: 'auto'}}>
          <div>STATUS</div>
          <pre>{JSON.stringify(roomStatus, null, 2)}</pre>
          <div>CONFIG</div>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      </div>
    );
  };

  const switchAndLightElements = [];

  for(const light of config.lights || []) {
    switchAndLightElements.push(
      <Light
        key={light.id}
        detailed={full}
        config={light}
        status={_.get(roomStatus, ['light', light.id, 'status'])}
        onChange={value => {
          updateLightStatus(config.id, light.id, value);
        }}
      />
    );
  }

  // console.log(roomId, config.zigbee);

  for(const thisSwitch of _.filter(config.zigbee, {type: 'switch', wired: true})) {
    // console.log({roomStatus})
    switchAndLightElements.push(
      <Switch
        key={thisSwitch.id}
        detailed={full}
        config={thisSwitch}
        status={_.get(roomStatus, ['switch', thisSwitch.id, 'status'])}
        onChange={value => {
          updateSwitchState(config.id, thisSwitch.manufacturer, thisSwitch.id, value);
        }}
      />
    );
  }

  const renderStatus = () => {
    const fanElements = [];
    const windowElements = [];

    for(const fan of config.fans || []) {
      if(config.id === 'schlafzimmer') {
        continue;
      }

      fanElements.push(
        <Fan
          key={fan.id}
          detailed={full}
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
      const {id, shutterId, zigbeeShutterId} = windowConfig;

      let shutter = null;

      if(shutterId) {
        const shutterConfig = _.find(config.shutters || [], {id: shutterId});
        const shutterData = _.get(roomStatus, ['shutter', shutterId]);

        const shutterButton = _.find(config.buttons, button => {
          if(button.onClose && button.onClose.action === 'shutterToggle') {
            if(button.onClose.actionParams.includes(roomId) && button.onClose.actionParams.includes(shutterId)) {
              return true;
            }
          }
        });

        let buttonData = null;

        if(shutterButton) {
          buttonData = _.get(roomStatus, ['button', shutterButton.id]);
        }

        shutter = (
          <Shutter
            config={shutterConfig}
            data={shutterData}
            buttonData={buttonData}
            button={shutterButton}
            full={full}
            onMovementChange={direction => {
              updateShutterMovement(config.id, shutterId, direction);
            }}
          />
        );
      }

      windowElements.push(
        <Window
          key={id}
          detailed={full}
          config={windowConfig}
          status={_.get(roomStatus, ['window', id, 'status'])}
          shutter={shutter}
        />
      );
    }

    const renderFans = () => {
      if(fanElements.length) {
        return (
          <div className='room__status__fans'>
            {fanElements}
          </div>
        );
      }
    };

    const renderWindows = () => {
      if(windowElements.length) {
        return (
          <div className='room__status__windows'>
            {windowElements}
          </div>
        );
      }
    };

    const renderHeating = () => (
      <div className='room__general-status__heating'>
        {renderTemperatureStatus()}
        {renderTemperatureControl()}
      </div>
    );

    return (
      <div className='room__status'>
        {renderFans()}
        {renderWindows()}
        {renderHeating()}
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
        <div className='room__header__label' onClick={() => jumpToDetails()}>{config.label}</div>
      </div>
      <div className='room__header'>
        {renderTemperature(temperature || {})}
        {renderHumidity(humidity || {})}
        <div className='room__status__lights'>
          {switchAndLightElements}
        </div>
      </div>
      {renderStatus()}
    </div>
  );
};

export default Room;
