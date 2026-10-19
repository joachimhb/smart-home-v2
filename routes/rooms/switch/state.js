import SHC from '@joachimhb/smart-home-common';

const {
  topics,
} = SHC;

const {zigbeeSonoffSwitchSet} = topics;

export default async function toggle({mqttClient}) {
  return {
    method: 'put',
    path: '/rooms/:room/switch/:manufacturer/:id/state',
    fn: async(req, res, next) => {
      try {
        const {room, manufacturer, id} = req.params;

        if(manufacturer === 'sonoff') {
          await mqttClient.publish(zigbeeSonoffSwitchSet(room, id), {state: req.body.state});
        }

        res.json({handled: true});
      } catch(err) {
        return next(err);
      }
    },
  };
}
