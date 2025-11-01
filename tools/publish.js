import url from 'url';

import {processenv} from 'processenv';

import log4js     from 'log4js';

import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

// import config from '../smart-home-setup/shared/config.js';

// console.log(config);
const configPath = processenv('SMART_HOME_CONFIG_PATH', '../smart-home-setup/shared/config.js');

const {
  shutterUp,
  shutterDown,
  shutterStop,
  shutterMovement,
  shutterStatus,
  shutterToggle,
  shutterMax,

  buttonOpen,
  buttonClose,
  buttonActive,

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

  heatingSetTemperature,

  heatingTrvSetTemperature,
} = topics;

const logger = log4js.getLogger();

logger.level = 'info';
logger.level = 'debug';

(async function() {
  const config = (await import(url.pathToFileURL(configPath))).default;

  const mqttClient = new MqttClient({
    url: config.mqttBroker,
    logger,
  });

  const handleMqttMessage = async(topic, data) => {
    logger.debug('handleMqttMessage', topic, data);
  };

  await mqttClient.init(handleMqttMessage);

  await mqttClient.subscribe('#');

  // await mqttClient.publish(heatingTrvSetTemperature('arbeitszimmer', 'main'), {value: 20}, {retain: true});

  // await mqttClient.publish(heatingSetTemperature('wohnzimmer'), 22, {retain: true});

  await mqttClient.publish(windowStatus('arbeitszimmer', 'fenster'), 'opened', {retain: true});

  setTimeout(() => {
    process.exit(0);
  }, 1000);
})();
