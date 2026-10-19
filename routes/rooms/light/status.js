import SHC from '@joachimhb/smart-home-common';

const {
  // MqttClient,
  topics,
} = SHC;

const {lightStatus} = topics;

export default async function status({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/light/:light/status',
    fn: async(req, res, next) => {
      try {
        const {room, light} = req.params;

        await mqttClient.publish(lightStatus(room, light), {value: req.body.value}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
}
