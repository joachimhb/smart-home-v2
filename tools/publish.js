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
  zigbeeSonoffSwitch,
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

  // await mqttClient.publish(heatingSetTemperature('wohnzimmer'), 26, {retain: true});

  // await mqttClient.publish(windowStatus('arbeitszimmer', 'fenster'), 'opened', {retain: true});

  // await mqttClient.publish(zigbeeSonoffHeatingthermostatSet('wohnzimmer', 'front'), {
  //   // occupied_heating_setpoint: 25,
  //   // external_temperature_input: 12
  //   system_mode: 'auto',
  // });
  await mqttClient.publish(zigbeeSonoffSwitch('wohnzimmer', 'licht-essbereich'), {
    value: 'OFF',
    "delayed_power_on_state": false,
    "delayed_power_on_time": 34,
    "detach_relay_mode": false,
    "external_trigger_mode": "edge",
    "linkquality": 48,
    "network_indicator": true,
    "turbo_mode": false,
  });

  setTimeout(() => {
    process.exit(0);
  }, 2000);
})();
