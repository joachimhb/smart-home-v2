// import _ from 'lodash-es';

import check       from 'check-types-2';


import {Cron} from 'croner';

import SHC from '@joachimhb/smart-home-common';
import millisecond from 'millisecond';

const {
  topics,
} = SHC;

const {
  zigbeeSonoffHeatingthermostatSet,
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

  async init() {
    await this.setHeatingSchedule();

    if(this.room.mainTemperature) {
      await this.sendToTrvs({temperature_sensor_select: 'external'});
    }

    this.setAutoJob = new Cron('0 22 * * *', async() => {
      await this.setAuto();
    });

    this.setAntiCalcJob = new Cron('0 12 1 * *', async() => {
      await this.antiCalc();
    });
  }

  async antiCalc() {
    this.calcMaxTimeout = setTimeout(() => {
      this.setManual(10);
    }, millisecond('20s'));

    this.calcMinTimeout = setTimeout(() => {
      this.setAuto();
    }, millisecond('40s'));

    await this.setManual(30);
  }

  async setManual(temperature) {
    const payload = {
      system_mode: 'heat',
    };

    if(temperature) {
      payload.occupied_heating_setpoint = temperature;
    }

    await this.sendToTrvs(payload);
  }

  async setAuto() {
    const payload = {
      system_mode: 'auto',
    };

    await this.sendToTrvs(payload);
  }

  async setMode(mode) {
    if(mode === 'auto') {
      return await this.setAuto();
    }
    if(mode === 'manual') {
      return await this.setManual();
    }
  }

  async setHeatingSchedule() {
    if(this.room.heating.schedule) {
      const payload = {
        weekly_schedule: this.room.heating.schedule,
        child_lock: 'LOCK',
      };

      await this.sendToTrvs(payload);
    }
  }

  async setHeatingTemperature(temperature) {
    await this.setManual(temperature);
  }

  async setExternalTemperature(temperature) {
    const payload = {
      external_temperature_input: temperature,
    };

    await this.sendToTrvs(payload);
  }

  async sendToTrvs(payload) {
    for(const zigbeeElement of this.room.zigbee || []) {
      if(zigbeeElement.type === 'heatingthermostat' && zigbeeElement.manufacturer === 'sonoff') {
        this.logger.debug(`heating - ${this.room.id} sending to ${zigbeeElement.id}`, payload);
        await this.mqttClient.publish(zigbeeSonoffHeatingthermostatSet(this.room.id, zigbeeElement.id), payload);
      }
    }
  }
}

export default Heating;
