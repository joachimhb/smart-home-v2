import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {fanMinHumidityThreshold} = topics;

export default async function minHumidityThreshold({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/fans/:fan/minHumidityThreshold',
    fn: async(req, res, next) => {
      try {
        const {room, fan} = req.params;

        await mqttClient.publish(fanMinHumidityThreshold(room, fan), {value: Number(req.body.value)}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
