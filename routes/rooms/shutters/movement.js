import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {
  shutterUp,
  shutterDown,
  shutterStop,
} = topics;

export default async function movement({mqttClient, logger}) {
  return {
    method: 'put',
    path: '/rooms/:room/shutters/:shutter/movement',
    fn: async(req, res, next) => {
      try {
        const {room, shutter} = req.params;

        logger.info(`${room} / ${shutter} - movement: ${req.body.value}`);

        if(req.body.value === 'up') {
          await mqttClient.publish(shutterUp(room, shutter), {value: req.body.value});
        } else if(req.body.value === 'down') {
          await mqttClient.publish(shutterDown(room, shutter), {value: req.body.value});
        } else if(req.body.value === 'stop') {
          await mqttClient.publish(shutterStop(room, shutter), {value: req.body.value});
        }

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
