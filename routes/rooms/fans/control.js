import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {fanControl} = topics;

export default async function control({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/fans/:fan/control',
    fn: async(req, res, next) => {
      try {
        const {room, fan} = req.params;

        await mqttClient.publish(fanControl(room, fan), {value: req.body.value}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
