import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {fanMinRunTime} = topics;

export default async function minRunTime({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/fans/:fan/minRunTime',
    fn: async(req, res, next) => {
      try {
        const {room, fan} = req.params;

        await mqttClient.publish(fanMinRunTime(room, fan), {value: Number(req.body.value)}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
