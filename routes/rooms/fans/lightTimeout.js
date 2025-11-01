import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {fanLightTimeout} = topics;

export default async function lightTimout({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/fans/:fan/lightTimeout',
    fn: async(req, res, next) => {
      try {
        const {room, fan} = req.params;

        await mqttClient.publish(fanLightTimeout(room, fan), {value: Number(req.body.value)}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
