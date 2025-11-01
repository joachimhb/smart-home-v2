import _ from 'lodash';

import check       from 'check-types-2';

import SHC from '@joachimhb/smart-home-common';

const {
  topics,
} = SHC;

const {
  heatingTrvSetValve,
  // heatingTrvSetTemperature,
} = topics;

class Heating {
  constructor(params) {
    check.assert.object(params, 'params is not an object');
    check.assert.object(params.logger, 'params.logger is not an object');
    check.assert.object(params.mqttClient, 'params.mqttClient is not an object');
    check.assert.object(params.room, 'params.room is not an object');
    check.assert.maybe.object(params.status, 'params.status is not an object');

    Object.assign(this, params);
  }

  init() {
    setInterval(() => {
      this.updateTrvs();
    }, 5000);
  }

  async updateTrvs() {
    const {room, logger, status, mqttClient} = this;

    const {heating = {}} = room;
    const {trvs = []} = heating;

    logger.trace('Heating.updateTrvs', JSON.stringify(status, null, 2));

    const roomTemperature = _.get(status, ['temperature', 'overall', 'status', 'value'], 18);
    const setTemperature =  _.get(status, ['heating', 'overall', 'temperature_set', 'value'], 18);

    if(_.isNumber(roomTemperature) && _.isNumber(setTemperature)) {
      let newValvePosition = 0;

      if(roomTemperature < setTemperature) {
        const diff = Math.abs(roomTemperature - setTemperature);

        if(diff > 3) {
          newValvePosition = 75;
        } else if(diff > 2) {
          newValvePosition = 50;
        } else if(diff > 1) {
          newValvePosition = 25;
        }
      }

      for(const trv of trvs) {
        const location = `${room.label}/${trv.label}`;

        const trvSetTemperature       = _.get(status, ['heating_trv', trv.id, 'temperature_set', 'value'], 18);
        const trvCurrentTemperature   = _.get(status, ['heating_trv', trv.id, 'temperature_current', 'value'], 18);
        const trvSetValvePosition     = _.get(status, ['heating_trv', trv.id, 'valve_set', 'value'], 0);
        const trvCurrentValvePosition = _.get(status, ['heating_trv', trv.id, 'valve_current', 'value'], 0);

        this.logger.trace({location, roomTemperature, setTemperature, trvSetTemperature, trvCurrentTemperature, trvSetValvePosition, trvCurrentValvePosition});

        if(trvSetValvePosition !== newValvePosition) {
          await mqttClient.publish(heatingTrvSetValve(room.id, trv.id), newValvePosition, {retain: true});
        }
      }
    }
  }
}

export default Heating;
