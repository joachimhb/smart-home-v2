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

import {InfluxDB, Point} from '@influxdata/influxdb-client';

import registerRoutes from './lib/registerRoutes.js';

import SHC from '@joachimhb/smart-home-common';
import Heating from './lib/Heating.js';

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
  // shutterUp,
  // shutterDown,
  // shutterStop,
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

  heatingSetTemperature,
  heatingTriggerBoost,
  heatingTrvSetTemperature,
  heatingTrvCurrentTemperature,
  heatingTrvSetValve,
  heatingTrvCurrentValve,
} = topics;

const logger = log4js.getLogger();

logger.level = 'info';
logger.level = 'debug';

const storePoints = async(influxDB, config, roomStatus) => {
  const writeApi = influxDB.getWriteApi(config.influxDb.org, config.influxDb.bucket, 'ns');
  const allRoomIds = Object.keys(roomStatus);

  const timestamp = new Date();

  let points = 0;

  for(const roomId of allRoomIds) {
    const areaData = roomStatus[roomId];

    for(const type of Object.keys(areaData)) {
      for(const id of Object.keys(areaData[type] || {})) {
        for(const valueType of Object.keys(areaData[type][id] || {})) {
          const value = _.get(areaData, [type, id, valueType, 'value']);

          // console.log([type, id, valueType], _.get(areaData, [type, id, valueType]));

          if(_.isNil(value)) {
            continue;
          }

          if(value === 'unknown') {
            continue;
          }

          const point = new Point('data')
            .tag('room', roomId)
            .tag('type', type)
            .tag('element_id', id)
            .timestamp(timestamp);

          if(['window', 'button'].includes(type) && valueType === 'status') {
            if(value === 'open') {
              point.floatField('open', 100);
              point.floatField('closed', 0);
            } else {
              point.floatField('open', 0);
              point.floatField('closed', 100);
            }
          } else if(type === 'light' && valueType === 'status') {
            if(value === 'on') {
              point.floatField('on', 100);
              point.floatField('off', 0);
            } else {
              point.floatField('on', 0);
              point.floatField('off', 100);
            }
          } else if(['temperature', 'humidity'].includes(type) && valueType === 'status') {
            point.floatField(valueType, value);
          } else if(['heating', 'heating_trv'].includes(type)) {
            point.floatField(valueType, value);
          } else if(type === 'fan') {
            if(valueType === 'speed') {
              if(value === 'max') {
                point.floatField('max', 100);
                point.floatField('min', 0);
                point.floatField('off', 0);
              } else if(value === 'min') {
                point.floatField('max', 0);
                point.floatField('min', 100);
                point.floatField('off', 0);
              } else {
                point.floatField('max', 0);
                point.floatField('min', 0);
                point.floatField('off', 100);
              }
            } else if(valueType === 'control') {
              if(value === 'auto') {
                point.floatField('auto', 100);
                point.floatField('manual', 0);
              } else {
                point.floatField('auto', 0);
                point.floatField('manual', 100);
              }
            }
          } else if(type === 'shutter') {
            if(['status', 'max'].includes(valueType)) {
              point.floatField(valueType, value);
            } else if([valueType].includes('movement')) {
              // ignore
            } else {
              logger.warn(`Unknown`, type, id, valueType, _.get(areaData, [type, id, valueType]));
              continue;
            }
          } else {
            logger.warn(`Unknown`, type, id, valueType, _.get(areaData, [type, id, valueType]));
            continue;
          }


          // console.log(point);
          writeApi.writePoint(point);
          points++;
        }
      }
    }
  }


  try {
    await writeApi.close();

    logger.info(`${points} points written `);
  } catch(err) {
    logger.error(`Failed to write ${points} points`, err);
  }
};

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

  const app = express();

  app.use(bodyParser.json());
  app.set('json spaces', 2);
  app.use(express.urlencoded({
    extended: true,
  }));

  app.use(express.static('dist'));

  app.use(morgan('dev'));

  const wss = new WebSocketServer({port: wsPort});

  const raspis = ['kammer', 'arbeitszimmer', 'wohnzimmer'];

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

  const handleMqttMessage = async(topic, data) => {
    const [
      area,
      areaId,
      element,
      elementId,
      subArea,
    ] = topic.split('/');

    if(['room', 'automation'].includes(area)) {
      if(area === 'automation') {
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

        _.set(status, finalPath, data);

        if(current.value !== data.value) {
          logger.debug(topic, current, data);

          const updated = {
            type: 'room',
            id: areaId,
            status: status.room[areaId],
          };

          clientsBroadcast(updated);
        }

        if(element === 'window') {
          const room = _.find(config.rooms, {id: areaId});

          if(room) {
            const window = _.find(room.windows || [], {id: elementId});

            if(window && window.shutterId) {
              if(data.value === 'opened') {
                await mqttClient.publish(shutterMax(areaId, window.shutterId), {value: 80}, {retain: true});
              } else if(data.value === 'closed') {
                await mqttClient.publish(shutterMax(areaId, window.shutterId), {value: 100}, {retain: true});
              }
            }
          }
        }

        if(element === 'temperature') {
          const room = _.find(config.rooms, {id: areaId});
          const mainTemperatureId =  _.get(room, ['mainTemperature', 'id']);

          if(mainTemperatureId === elementId) {
            await mqttClient.publish(roomTemperatureStatus(areaId), data.value, {retain: true});
          }
        }
      }
    }
  };

  await mqttClient.init(handleMqttMessage);

  registerRoutes(app, {
    mqttClient,
    logger,
    config,
    influxDB,
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

    if(room.heating) {
      await mqttClient.subscribe(heatingSetTemperature(room.id));
      await mqttClient.subscribe(heatingTriggerBoost(room.id));

      for(const trv of room.heating.trvs || []) {
        await mqttClient.subscribe(heatingTrvSetTemperature(room.id, trv.id));
        await mqttClient.subscribe(heatingTrvCurrentTemperature(room.id, trv.id));
        await mqttClient.subscribe(heatingTrvSetValve(room.id, trv.id));
        await mqttClient.subscribe(heatingTrvCurrentValve(room.id, trv.id));
      }

      const heating = new Heating({
        status: status.room[room.id],
        room,
        logger,
        mqttClient,
      });

      heating.init();
    }
  }

  await storePoints(influxDB, config, status.room);

  setInterval(async () => {
    await storePoints(influxDB, config, status.room);
  }, 30000);
})();
