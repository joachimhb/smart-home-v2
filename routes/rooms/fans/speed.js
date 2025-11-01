import {setTimeout as delay} from 'timers/promises';

import SHC from '@joachimhb/smart-home-common';

const {
  topics,
} = SHC;

const {
  fanControl,
  fanSpeed,
} = topics;

export default async function speed({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/fans/:fan/speed',
    fn: async(req, res, next) => {
      try {
        const {room, fan} = req.params;

        await mqttClient.publish(fanControl(room, fan), {value: 'manual'}, {retain: true});
        await delay(500);
        await mqttClient.publish(fanSpeed(room, fan), {value: req.body.value}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
}
