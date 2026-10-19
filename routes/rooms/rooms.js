export default async function getRoomsConfig({config}) {
  return {
    path: '/rooms/',
    method: 'get',
    fn: async(req, res) => {
      res.json(config.rooms);
    },
  };
}
