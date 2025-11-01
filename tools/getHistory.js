import url from 'url';

import {processenv} from 'processenv';

import log4js     from 'log4js';

import {InfluxDB} from '@influxdata/influxdb-client';

const logger = log4js.getLogger();

logger.level = 'info';
logger.level = 'debug';

const configPath = processenv('SMART_HOME_CONFIG_PATH', '../smart-home-setup/shared/config.js');

(async function() {
  const config = (await import(url.pathToFileURL(configPath))).default;

  const influxDB = new InfluxDB({
    url: config.influxDb.url,
    token: config.influxDb.token,
  });

  const queryApi = influxDB.getQueryApi(config.influxDb.org);

  const room = 'wohnzimmer';

        // 24h-Mittelwerte stündlich
  const fluxQuery = `
from(bucket: "${config.influxDb.bucket}")
  |> range(start: -5m)
  |> filter(fn: (r) => r._measurement == "data")
  |> filter(fn: (r) => r.room == "${room}")
  |> group(columns: ["type", "element_id", "_field"])
  |> aggregateWindow(every: 5m, fn: mean)
  |> yield(name: "mean")
`;

  logger.info('📊 Aggregierte Query ...');

  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);

      console.log(o);

      // logger.info(`${o._time} ${o.room} ${o._field}: ${o._value.toFixed(2)}`)
    },
    error(err) { logger.error('❌ Fehler:', err) },
    complete() { logger.info('✅ Fertig') },
  });

})();
