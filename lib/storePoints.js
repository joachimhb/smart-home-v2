import _ from 'lodash';
import {Point} from '@influxdata/influxdb-client';

const storePoints = async({
  influxDB,
  config,
  status,
  logger,
}) => {
  const writeApi = influxDB.getWriteApi(config.influxDb.org, config.influxDb.bucket, 'ns');
  const allRoomIds = Object.keys(status);

  const timestamp = new Date();

  let points = 0;

  const lines = [];

  for(const roomId of allRoomIds) {
    const areaData = status[roomId];
    const allTypes = Object.keys(areaData);

    // if(roomId === 'wohnzimmer') {
    //   console.log(JSON.stringify(areaData, null, 2))
    //   console.log({allTypes})
    // }

    for(const type of allTypes) {
      for(const id of Object.keys(areaData[type] || {})) {
        for(const valueType of Object.keys(areaData[type][id] || {})) {
          let known = false;

          const point = new Point('data')
            .tag('room', roomId)
            .tag('type', type)
            .tag('element_id', id)
            .timestamp(timestamp);

          if(valueType === 'info') {
            const data = _.get(areaData, [type, id, valueType], {});

            if(type === 'tuya-roomthermostat') {
              for(const key of ['battery', 'linkquality']) {
                if(!_.isNil(data[key])) {
                  point.floatField(key, data[key]);
                }
              }

              known = true;
            } else if(type === 'sonoff-heatingthermostat') {
              for(const key of [
                'occupied_heating_setpoint',
                'local_temperature',
                'external_temperature_input',
                'battery',
                'linkquality',
                'running_state',
                'system_mode',
              ]) {
                if(key === 'running_state') {
                  if(data[key] === 'heat') {
                    point.floatField('heat', 1);
                    point.floatField('idle', 0);
                  } else {
                    point.floatField('heat', 0);
                    point.floatField('idle', 1);
                  }
                } else if(key === 'system_mode') {
                  if(data[key] === 'auto') {
                    point.floatField('manual', 0);
                    point.floatField('auto', 1);
                  } else {
                    point.floatField('manual', 1);
                    point.floatField('auto', 0);
                  }
                } else if(_.isNumber(data[key])) {
                  point.floatField(key, data[key]);
                }
              }

              // if(data.open_window) {
              //   if(data.open_window === 'OFF') {
              //     point.floatField('window_open', 0);
              //     point.floatField('window_closed', 1);
              //   } else {
              //     point.floatField('window_open', 1);
              //     point.floatField('window_closed', 0);
              //   }
              // }

              known = true;
            }
          } else {
            const value = _.get(areaData, [type, id, valueType, 'value']);
            const since = _.get(areaData, [type, id, valueType, 'since']);

            lines.push(`${roomId.padEnd(16, ' ')} | ${type.padEnd(20, ' ')} | ${id.padEnd(25, ' ')} | ${valueType.padEnd(18, ' ')} | ${String(value).padEnd(10, ' ')} | ${since}`);

            if(_.isNil(value)) {
              continue;
            }

            if(value === 'unknown') {
              continue;
            }

            if(valueType === 'status') {
              if(['window', 'button'].includes(type)) {
                if(value === 'open') {
                  point.floatField('open', 100);
                  point.floatField('closed', 0);
                } else {
                  point.floatField('open', 0);
                  point.floatField('closed', 100);
                }

                known = true;
              } else if(type === 'light') {
                if(value === 'on') {
                  point.floatField('on', 100);
                  point.floatField('off', 0);
                } else {
                  point.floatField('on', 0);
                  point.floatField('off', 100);
                }

                known = true;
              } else if(['temperature', 'humidity'].includes(type)) {
                point.floatField(valueType, value);

                known = true;
              } else if(type === 'shutter') {
                point.floatField(valueType, value);

                known = true;
              }
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
                known = true;
              } else if(valueType === 'control') {
                if(value === 'auto') {
                  point.floatField('auto', 100);
                  point.floatField('manual', 0);
                } else {
                  point.floatField('auto', 0);
                  point.floatField('manual', 100);
                }
              }
              known = true;
            } else if(type === 'shutter') {
              if(['max'].includes(valueType)) {
                point.floatField(valueType, value);
              } else if([valueType].includes('movement')) {
                // ignore
              }

              known = true;
            } else if(['heating'].includes(type)) {
              if(valueType === 'boost') {
                if(value === 'active') {
                  point.floatField(valueType, 1);
                } else {
                  point.floatField(valueType, 0);
                }
              } else if(valueType === 'pause') {
                if(value === 'active') {
                  point.floatField(valueType, 1);
                } else {
                  point.floatField(valueType, 0);
                }
              } else if(valueType === 'mode') {
                if(value === 'auto') {
                  point.floatField('auto', 1);
                  point.floatField('manual', 0);
                } else {
                  point.floatField('auto', 0);
                  point.floatField('manual', 1);
                }
              } else if(valueType === 'state') {
                if(value === 'heat') {
                  point.floatField('heat', 1);
                  point.floatField('idle', 0);
                } else {
                  point.floatField('heat', 0);
                  point.floatField('idle', 1);
                }
              } else {
                if(_.isNumber(value)) {
                  point.floatField(valueType, value);
                } else {
                  logger.warn(`Not a number in [${roomId}]`, type, id, valueType, _.get(areaData, [type, id, valueType]));
                }
              }

              known = true;
            }
          }

          if(!known) {
            // logger.warn(`Unknown in [${roomId}]`, type, id, valueType, _.get(areaData, [type, id, valueType]));
            continue;
          }

          // console.log(point);
          writeApi.writePoint(point);
          points++;
        }
      }
    }
  }

  // lines.map(line => console.log(line));

  try {
    await writeApi.close();

    // logger.debug(`${points} points written `);
  } catch(err) {
    logger.error(`Failed to write ${points} points`, err);
  }
};

export default storePoints;
