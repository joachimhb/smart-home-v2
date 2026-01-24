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
    if(topic.startsWith('zigbee2mqtt')) {
      logger.debug('handleMqttMessage', topic, data);
    }
  };

  await mqttClient.init(handleMqttMessage);

  await mqttClient.subscribe('#');
})();
