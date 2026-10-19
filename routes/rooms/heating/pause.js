import SHC from '@joachimhb/smart-home-common';

const {
  topics,
} = SHC;

const {
  heatingTriggerPause,
} = topics;

export default async function pause({mqttClient, logger}) {
  return {
    method: 'post',
    path: '/rooms/:room/heating/pause',
    fn: async(req, res, next) => {
      try {
        const {room} = req.params;

        logger.info(`${room} - heating trigger boost`);

        await mqttClient.publish(heatingTriggerPause(room));

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
}
