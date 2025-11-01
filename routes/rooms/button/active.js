import SHC from '@joachimhb/smart-home-common';

const {
  MqttClient,
  topics,
} = SHC;

const {buttonActive} = topics;

export default async function active({mqttClient, logger}) {
  return {
    method: 'put',
    path: '/rooms/:room/button/:button/active',
    fn: async(req, res, next) => {
      try {
        const {room, button} = req.params;

        logger.info(`${room} / ${button} - active: ${req.body.value}`);

        await mqttClient.publish(buttonActive(room, button), {value: req.body.value}, {retain: true});

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
}
