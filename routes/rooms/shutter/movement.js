import _ from 'lodash';

import SHC from '@joachimhb/smart-home-common';

const {
  // MqttClient,
  topics,
} = SHC;

const {
  shutterUp,
  shutterDown,
  shutterStop,

  zigbeeSonoffShutterSet,
} = topics;

export default async function movement({mqttClient, logger, config}) {
  return {
    method: 'put',
    path: '/rooms/:room/shutter/:shutter/movement',
    fn: async(req, res, next) => {
      try {
        const {room, shutter} = req.params;

        const thisRoom = _.find(config.rooms, {id: room});

        if(!thisRoom) {
          throw new Error(`Room '${room}' not found`);
        }

        const direction = req.body.value;

        const thisShutter = _.find(thisRoom.shutters, {id: shutter});
        const zigbeeSonoffShutter = _.find(thisRoom.zigbee, {id: shutter, type: 'shutter', manufacturer: 'sonoff'});

        if(thisShutter) {
          logger.info(`${room} / ${shutter} - movement: ${direction}`);

          if(direction === 'up') {
            await mqttClient.publish(shutterUp(room, shutter), {value: direction});
          } else if(direction === 'down') {
            await mqttClient.publish(shutterDown(room, shutter), {value: direction});
          } else if(direction === 'stop') {
            await mqttClient.publish(shutterStop(room, shutter), {value: direction});
          }
        } else if(zigbeeSonoffShutter) {
          logger.info(`${room} / ${shutter} - zigbee / sonoff movement: ${direction}`);

          let state = 'STOP';

          if(direction === 'up') {
            state = 'OPEN';
          } else if(direction === 'down') {
            state = 'CLOSE';
          }

          await mqttClient.publish(zigbeeSonoffShutterSet(room, shutter), {state});
        } else {
          throw new Error(`Shutter ${shutter} in room '${room}' not found`);
        }

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
}
