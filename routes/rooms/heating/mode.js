import SHC from '@joachimhb/smart-home-common';

const {
  topics,
} = SHC;

const {
  heatingSetMode,
} = topics;

export default async function temperature({mqttClient, logger}) {
  return {
    method: 'put',
    path: '/rooms/:room/heating/mode',
    fn: async(req, res, next) => {
      try {
        const {room} = req.params;
        const {value} = req.body;

        logger.info(`${room} - heating mode`, {value});

        await mqttClient.publish(heatingSetMode(room), value, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
};
