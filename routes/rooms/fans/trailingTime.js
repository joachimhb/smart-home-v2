import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {fanTrailingTime} = topics;

export default async function trailingTime({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/fans/:fan/trailingTime',
    fn: async(req, res, next) => {
      try {
        const {room, fan} = req.params;

        await mqttClient.publish(fanTrailingTime(room, fan), {value: Number(req.body.value)}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
