import http from 'http';
import url from 'url';

import _          from 'lodash-es';
import log4js     from 'log4js';
import express    from 'express';
import bodyParser from 'body-parser';
import morgan     from 'morgan';
import {processenv} from 'processenv';
import WebSocket, {
  WebSocketServer,
}  from 'ws';

import {InfluxDB} from '@influxdata/influxdb-client';

import registerRoutes from './lib/registerRoutes.js';

import millisecond from 'millisecond';

import SHC from '@joachimhb/smart-home-common';
import Heating from './lib/Heating.js';
import storePoints from './lib/storePoints.js';

const {
  MqttClient,
  topics,
} = SHC;

// import config from '../smart-home-setup/shared/config.js';

// console.log(config);
const configPath = processenv('SMART_HOME_CONFIG_PATH', '../smart-home-setup/shared/config.js');
const port = processenv('SMART_HOME_CONFIG_PORT', 3000);
const wsPort = processenv('SMART_HOME_CONFIG_WEBSOCKET_PORT', 3001);

const {
  shutterMovement,
  shutterStatus,
  shutterToggle,
  shutterMax,

  buttonOpen,
  buttonClose,
  buttonActive,
  buttonStatus,

  fanControl,
  fanSpeed,
  fanTrailingTime,
  fanMinRunTime,
  fanLightTimeout,
  fanMinHumidityThreshold,
  fanMaxHumidityThreshold,

  lightStatus,
  windowStatus,

  temperatureStatus,
  humidityStatus,

  automationInit,

  roomTemperatureStatus,
  roomHumidityStatus,

  heatingSetTemperature,
  heatingTriggerBoost,
  heatingTriggerPause,
  heatingSetMode,
  heatingBoost,
  heatingPause,

  heatingTrvSetTemperature,
  heatingTrvLocalTemperature,
  heatingTrvExternalTemperature,
  heatingTrvBattery,
  heatingTrvLinkQuality,
  heatingTrvCurrentValve,
  heatingTrvState,
  heatingTrvMode,
  roomThermostatBattery,
  roomThermostatLinkQuality,

  tuyaRoomthermostatInfo,
  sonoffHeatingthermostatInfo,

  zigbeeTuyaRoomthermostat,
  zigbeeSonoffHeatingthermostat,
  // zigbeeSonoffHeatingthermostatSet,

  zigbeeTuyaSceneSwitch,
  zigbeeSonoffSwitch,
  zigbeeSonoffSwitchSet,

  zigbeeSonoffShutter,
} = topics;

const logger = log4js.getLogger();

logger.level = 'info';
logger.level = 'debug';

(async function() {
  const config = (await import(url.pathToFileURL(configPath))).default;

  const influxDB = new InfluxDB({
    url: config.influxDb.url,
    token: config.influxDb.token,
  });
  const status = {
    room: {},
    automation: {},
  };

  const heatingMap = {};

  const app = express();

  app.use(bodyParser.json());
  app.set('json spaces', 2);
  app.use(express.urlencoded({
    extended: true,
  }));

  app.use(express.static('dist'));

  app.use(morgan('dev'));

  const wss = new WebSocketServer({port: wsPort});

  const raspis = ['kammer', 'arbeitszimmer'];

  const clientsBroadcast = function(data) {
    for(const client of wss.clients) {
      if(client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  };

  const clientConnected = client => {
    logger.info(`Client connected...`, status);

    for(const id of Object.keys(status.room || {})) {
      const data = {
        type: 'room',
        id,
        status: status.room[id],
      };

      client.send(JSON.stringify(data));
    }

    for(const id of raspis) {
      const data = {
        type: 'automation',
        id,
        status: status.automation[id] || {value: 'unknown'},
      };

      client.send(JSON.stringify(data));
    }
  };

  const mqttClient = new MqttClient({
    url: config.mqttBroker,
    logger,
  });

  const handleZigbeeMessage = async(topic, data) => {
    const [, finalTopic] = topic.split('/');

    const [
      areaId,
      manufacturer,
      elementType,
      elementId,
    ] = finalTopic.split('~');

    // logger.debug(`${topic}: `, {areaId, manufacturer, elementType, elementId}, data);
    if(manufacturer === 'tuya' && elementType === 'roomthermostat') {
      const {
        temperature,
        humidity,
        battery,
        linkquality,
      } = data;

      logger.debug(`${topic}: `, {areaId, manufacturer, elementType, elementId}, {
        temperature,
        humidity,
        battery,
        linkquality,
      });

      await mqttClient.publish(temperatureStatus(areaId, elementId), temperature, {retain: true});
      await mqttClient.publish(humidityStatus(areaId, elementId), humidity, {retain: true});
      await mqttClient.publish(roomThermostatBattery(areaId, elementId), battery, {retain: true});
      await mqttClient.publish(roomThermostatLinkQuality(areaId, elementId), linkquality, {retain: true});
      await mqttClient.publish(tuyaRoomthermostatInfo(areaId, elementId), data);
    }

    if(manufacturer === 'sonoff' && elementType === 'heatingthermostat') {
      const {
        local_temperature,
        occupied_heating_setpoint,
        external_temperature_input,
        battery,
        linkquality,
        running_state,
        system_mode,
      } = data;

      // logger.debug(`${topic}: `, {areaId, manufacturer, elementType, elementId}, {
      //   local_temperature,
      //   occupied_heating_setpoint,
      //   external_temperature_input,
      //   battery,
      //   linkquality,
      //   running_state,
      //   system_mode,
      // });

      await mqttClient.publish(heatingTrvSetTemperature(areaId, elementId), occupied_heating_setpoint, {retain: true});
      await mqttClient.publish(heatingTrvLocalTemperature(areaId, elementId), local_temperature, {retain: true});
      await mqttClient.publish(heatingTrvExternalTemperature(areaId, elementId), external_temperature_input, {retain: true});
      await mqttClient.publish(heatingTrvBattery(areaId, elementId), battery, {retain: true});
      await mqttClient.publish(heatingTrvLinkQuality(areaId, elementId), linkquality, {retain: true});
      await mqttClient.publish(heatingTrvState(areaId, elementId), running_state, {retain: true});
      await mqttClient.publish(heatingTrvMode(areaId, elementId), system_mode, {retain: true});
      await mqttClient.publish(sonoffHeatingthermostatInfo(areaId, elementId), data);
    }

    if(manufacturer === 'tuya' && elementType === 'sceneswitch') {
      const {
        action,
      } = data;

      const room = _.find(config.rooms, {id: areaId});

      const zigbeeElement = _.find(room.zigbee || [], {manufacturer, type: elementType});

      if(zigbeeElement) {
        const actions = zigbeeElement.actions || {};
        const actionConfig = actions[action];

        if(actionConfig && topics[actionConfig.action]) {
          await mqttClient.publish(topics[actionConfig.action](...actionConfig.actionParams));
        }
      }
    }

    if(manufacturer === 'sonoff' && elementType === 'switch') {
      const {
        state,
      } = data;

      logger.debug(`${topic}: `, {areaId, manufacturer, elementType, elementId, data});

      const room = _.find(config.rooms, {id: areaId});

      if(!room) {
        return;
      }

      const zigbeeElement = _.find(room.zigbee || [], {manufacturer, type: elementType, id: elementId});

      if(zigbeeElement) {
        const sourcePath = [
          'room',
          areaId,
          elementType,
          elementId,
          'status',
        ].filter(Boolean);

        const sourceLabel = zigbeeElement.label || `${areaId}: ${elementId}`;

        const current = _.get(status, sourcePath, {value: 'unknown'});

        logger.debug(`${sourceLabel} changed from '${current.value}' to '${state}'`, zigbeeElement);

        if(current.value !== state) {
          if(zigbeeElement.onChange && zigbeeElement.onChange.action === 'switchToggle') {
            const {
              room: dRoom,
              id: dId,
              manufacturer: dManufacturer,
              type: dType,
            } = zigbeeElement.onChange;

            const destinationRoom = _.find(config.rooms, {id: dRoom});

            if(destinationRoom) {
              const destinationElement = _.find(destinationRoom.zigbee || [], {manufacturer: dManufacturer, type: dType, id: dId});

              if(destinationElement) {
                const destinationPath = [
                  'room',
                  dRoom,
                  dType,
                  dId,
                  'status',
                  'value',
                ];

                const destinationValue = _.get(status, destinationPath);

                const destinationLabel = destinationElement.label || `${dRoom}: ${destinationElement.id}`;

                const thisTopic = zigbeeSonoffSwitchSet(dRoom, dId);

                let newState = 'OFF';

                if(destinationValue === 'OFF') {
                  newState = 'ON';
                }

                logger.info(`Setting ${destinationLabel} state to ${newState} with topic '${thisTopic}'`, destinationElement);
                await mqttClient.publish(thisTopic, {state: newState});
              }
            }
          } else {
            logger.debug(`No action defined for ${sourceLabel}`);
          }

          _.set(status, sourcePath, {value: state, since: new Date()});

          const updated = {
            type: 'room',
            id: areaId,
            status: status.room[areaId],
          };

          clientsBroadcast(updated);
        }
      }
    }

    if(manufacturer === 'sonoff' && elementType === 'shutter') {
      const {
        position,
        motor_run_status,
      } = data;

      logger.debug(`${topic}: `, {areaId, manufacturer, elementType, elementId, data});

      const room = _.find(config.rooms, {id: areaId});

      if(!room) {
        return;
      }

      const zigbeeElement = _.find(room.zigbee || [], {manufacturer, type: elementType, id: elementId});

      if(zigbeeElement) {
        let movement = 'stop';

        if(position !== 0 && position !== 100) {
          if(motor_run_status === 'Reverse') {
            movement = 'up';
          } else if(motor_run_status === 'Forward') {
            movement = 'down';
          }
        }

        const closedPercent = 100 - position;

        await mqttClient.publish(shutterStatus(areaId, elementId), {value: closedPercent}, {retain: true});
        await mqttClient.publish(shutterMovement(areaId, elementId), {value: movement});

        // const sourcePath = [
        //   'room',
        //   areaId,
        //   elementType,
        //   elementId,
        //   'status',
        // ].filter(Boolean);

        // const sourceLabel = zigbeeElement.label || `${areaId}: ${elementId}`;

        // const current = _.get(status, sourcePath, {value: 'unknown'});

        // console.log(sourceLabel, current, state);
      }
    }
  };

  const handleAutomationMessage = async(topic, data) => {
    const [
      area,
      areaId,
    ] = topic.split('/');

    const finalPath = [area, areaId];

    const current = _.get(status, finalPath, {value: 'unknown'});

    _.set(status, finalPath, data);

    if(current.value !== data.value) {
      logger.debug(topic, current, data);

      const updated = {
        type: 'automation',
        id: areaId,
        status: status.automation[areaId],
      };

      clientsBroadcast(updated);
    }
  };

  const handleMqttMessage = async(topic, data) => {
    const [
      area,
      areaId,
      element,
      elementId,
      subArea,
    ] = topic.split('/');

    // console.log(topic);

    if(area === 'zigbee2mqtt') {
      return handleZigbeeMessage(topic, data);
    }

    if(area === 'automation') {
      return handleAutomationMessage(topic, data);
    }

    if(area === 'room') {
      const finalPath = [
        area,
        areaId,
        element,
        elementId,
        subArea,
      ].filter(Boolean);

      const current = _.get(status, finalPath, {value: 'unknown'});
      const room = _.find(config.rooms, {id: areaId});

      if(!room) {
        return;
      }

      _.set(status, finalPath, data);

      if(current.value !== data.value) {
        // logger.debug(topic, current, data);

        const updated = {
          type: 'room',
          id: areaId,
          status: status.room[areaId],
        };

        clientsBroadcast(updated);
      }

      if(element === 'window') {
        const window = _.find(room.windows || [], {id: elementId});

        if(window) {
          if(window.shutterId) {
            if(data.value === 'opened') {
              await mqttClient.publish(shutterMax(areaId, window.shutterId), {value: 80}, {retain: true});
            } else if(data.value === 'closed') {
              await mqttClient.publish(shutterMax(areaId, window.shutterId), {value: 100}, {retain: true});
            }
          }

          if(heatingMap[areaId]) {
            if(data.value === 'opened') {
              await heatingMap[areaId].setManual(16);
            } else if(data.value === 'closed') {
              setTimeout(async () => {
                await heatingMap[areaId].setAuto();
              }, millisecond('5m'));
            }
          }
        }
      }

      if(element === 'temperature') {
        const mainTemperatureId =  _.get(room, ['mainTemperature']);

        if(mainTemperatureId === elementId) {
          await mqttClient.publish(roomTemperatureStatus(areaId), data.value, {retain: true});
        }
      }

      if(element === 'humidity') {
        const mainHumidityId =  _.get(room, ['mainHumidity']);

        if(mainHumidityId === elementId) {
          await mqttClient.publish(roomHumidityStatus(areaId), data.value, {retain: true});
        }
      }

      if(topic === roomTemperatureStatus(areaId) && heatingMap[areaId]) {
        await heatingMap[areaId].setExternalTemperature(data.value);
      }

      if(topic === heatingSetMode(areaId) && heatingMap[areaId]) {
        await heatingMap[areaId].setMode(data.value);
      }

      // if(topic === heatingSetTemperature(areaId) && heatingMap[areaId]) {
      //   await heatingMap[areaId].setHeatingTemperature(data.value);
      // }

      if(topic === heatingTriggerBoost(areaId) && heatingMap[areaId]) {
        const roomStatus = _.get(status, ['room', areaId], {});

        if(_.get(roomStatus, ['heating', 'overall', 'boost', 'value']) === 'active') {
          return;
        }
        if(_.get(roomStatus, ['heating', 'overall', 'pause', 'value']) === 'active') {
          return;
        }

        await mqttClient.publish(heatingBoost(areaId), 'active');

        await heatingMap[areaId].setHeatingTemperature(27);

        setTimeout(async () => {
          await mqttClient.publish(heatingBoost(areaId), 'inactive');
          await heatingMap[areaId].setAuto();
        }, millisecond('10m'));
      }

      if(topic === heatingTriggerPause(areaId) && heatingMap[areaId]) {
        const roomStatus = _.get(status, ['room', areaId], {});

        if(_.get(roomStatus, ['heating', 'overall', 'boost', 'value']) === 'active') {
          return;
        }
        if(_.get(roomStatus, ['heating', 'overall', 'pause', 'value']) === 'active') {
          return;
        }

        await mqttClient.publish(heatingPause(areaId), 'active');

        await heatingMap[areaId].setHeatingTemperature(17);

        setTimeout(async () => {
          await mqttClient.publish(heatingPause(areaId), 'inactive');
          await heatingMap[areaId].setAuto();
        }, millisecond('5m'));
      }
    }
  };

  await mqttClient.init(handleMqttMessage);

  for(const room of config.rooms) {
    if(room.heating) {
      heatingMap[room.id] = new Heating({
        status: status.room[room.id],
        room,
        logger,
        mqttClient,
      });

      heatingMap[room.id].init();
    }
  }

  registerRoutes(app, {
    mqttClient,
    logger,
    config,
    influxDB,
    heatingMap,
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error(err.message);
  });

  const server = http.createServer(app);

  server.on('error', err => {
    logger.error('Server error', err);
  });

  server.listen(port);

  logger.info(`Server started at ${port}`);

  wss.on('connection', client => {
    logger.debug('ws [connection]');

    client.isAlive = true;

    client.on('pong', () => {
      logger.debug('ws [pong]');
      client.isAlive = true;
    });

    client.on('message', data => {
      logger.debug('ws [message]', data);
    });

    logger.debug('ws [open]');

    clientConnected(client);
  });

  const interval = setInterval(() => {
    for(const client of wss.clients) {
      if(client.isAlive === false) {
        return client.terminate();
      }

      client.isAlive = false;
      client.ping(_.noop);
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // await mqttClient.subscribe('#');

  for(const raspi of raspis) {
    await mqttClient.subscribe(automationInit(raspi));
  }

  for(const room of config.rooms) {
    await mqttClient.subscribe(roomTemperatureStatus(room.id));
    await mqttClient.subscribe(roomHumidityStatus(room.id));

    for(const shutter of room.shutters || []) {
      await mqttClient.subscribe(shutterMovement(room.id, shutter.id));
      await mqttClient.subscribe(shutterStatus(room.id, shutter.id));
      await mqttClient.subscribe(shutterToggle(room.id, shutter.id));
      await mqttClient.subscribe(shutterMax(room.id, shutter.id));
    }

    for(const window of room.windows || []) {
      await mqttClient.subscribe(windowStatus(room.id, window.id));
    }

    for(const button of room.buttons || []) {
      await mqttClient.subscribe(buttonActive(room.id, button.id));
      await mqttClient.subscribe(buttonClose(room.id, button.id));
      await mqttClient.subscribe(buttonOpen(room.id, button.id));
      await mqttClient.subscribe(buttonStatus(room.id, button.id));
    }

    for(const fan of room.fans || []) {
      await mqttClient.subscribe(fanControl(room.id, fan.id));
      await mqttClient.subscribe(fanSpeed(room.id, fan.id));
      await mqttClient.subscribe(fanTrailingTime(room.id, fan.id));
      await mqttClient.subscribe(fanMinRunTime(room.id, fan.id));
      await mqttClient.subscribe(fanMinHumidityThreshold(room.id, fan.id));
      await mqttClient.subscribe(fanMaxHumidityThreshold(room.id, fan.id));
      await mqttClient.subscribe(fanLightTimeout(room.id, fan.id));
    }

    for(const light of room.lights || []) {
      await mqttClient.subscribe(lightStatus(room.id, light.id));
    }

    for(const dht22 of room.dht22 || []) {
      await mqttClient.subscribe(humidityStatus(room.id, dht22.id));
      await mqttClient.subscribe(temperatureStatus(room.id, dht22.id));
    }

    for(const element of room.zigbee || []) {
      const {
        type,
        manufacturer,
        id,
      } = element;

      if(manufacturer === 'tuya' && type === 'roomthermostat') {
        await mqttClient.subscribe(zigbeeTuyaRoomthermostat(room.id, id));
        await mqttClient.subscribe(tuyaRoomthermostatInfo(room.id, id));
        await mqttClient.subscribe(roomThermostatBattery(room.id, id));
        await mqttClient.subscribe(roomThermostatLinkQuality(room.id, id));

        await mqttClient.subscribe(temperatureStatus(room.id, id));
        await mqttClient.subscribe(humidityStatus(room.id, id));
      }

      if(manufacturer === 'sonoff' && type === 'heatingthermostat') {
        await mqttClient.subscribe(heatingTrvSetTemperature(room.id, id));
        await mqttClient.subscribe(heatingTrvLocalTemperature(room.id, id));
        await mqttClient.subscribe(heatingTrvExternalTemperature(room.id, id));
        await mqttClient.subscribe(heatingTrvBattery(room.id, id));
        await mqttClient.subscribe(heatingTrvLinkQuality(room.id, id));
        await mqttClient.subscribe(heatingTrvState(room.id, id));
        await mqttClient.subscribe(heatingTrvMode(room.id, id));
        await mqttClient.subscribe(zigbeeSonoffHeatingthermostat(room.id, id));
        await mqttClient.subscribe(sonoffHeatingthermostatInfo(room.id, id));

        await mqttClient.subscribe(heatingTrvCurrentValve(room.id, id));
      }

      if(manufacturer === 'tuya' && type === 'sceneswitch') {
        await mqttClient.subscribe(zigbeeTuyaSceneSwitch(room.id, id));
      }

      if(manufacturer === 'sonoff' && type === 'switch') {
        await mqttClient.subscribe(zigbeeSonoffSwitch(room.id, id));
      }

      if(manufacturer === 'sonoff' && type === 'shutter') {
        await mqttClient.subscribe(zigbeeSonoffShutter(room.id, id));

        await mqttClient.subscribe(shutterMovement(room.id, id));
        await mqttClient.subscribe(shutterStatus(room.id, id));
      }
    }

    if(room.heating) {
      await mqttClient.subscribe(heatingSetTemperature(room.id));
      await mqttClient.subscribe(heatingTriggerBoost(room.id));
      await mqttClient.subscribe(heatingTriggerPause(room.id));
      await mqttClient.subscribe(heatingBoost(room.id));
      await mqttClient.subscribe(heatingPause(room.id));
      await mqttClient.subscribe(heatingSetMode(room.id));

      await mqttClient.publish(heatingBoost(room.id), 'inactive');
      await mqttClient.publish(heatingPause(room.id), 'inactive');
      await mqttClient.publish(heatingSetMode(room.id), 'auto');
    }
  }

  await storePoints({influxDB, config, status: status.room, logger});

  setInterval(async () => {
    await storePoints({influxDB, config, status: status.room, logger});
  }, 10000);
})();
