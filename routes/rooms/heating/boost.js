import SHC from '@joachimhb/smart-home-common';

const {
  topics,
} = SHC;

const {
  heatingTriggerBoost,
} = topics;

export default async function boost({mqttClient, logger, heatingMap}) {
  return {
    method: 'post',
    path: '/rooms/:room/heating/boost',
    fn: async(req, res, next) => {
      try {
        const {room} = req.params;

        logger.info(`${room} - heating trigger boost`);

        await mqttClient.publish(heatingTriggerBoost(room));

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
