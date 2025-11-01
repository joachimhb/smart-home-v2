import _ from 'lodash-es';

export default async function moveTo({influxDB, config}) {
  return {
    method: 'get',
    path: '/room-status-history/:room/',
    fn: async(req, res, next) => {
      try {
        const {room} = req.params;

        const queryApi = influxDB.getQueryApi(config.influxDb.org);

        // 24h-Mittelwerte stündlich
        // |> filter(fn: (r) => r.type == "temperature" or r.type == "heating_overall" or r.type == "heating_trv" or r.type == "humidity" or r.type == "fan" or r.type == "window")
        const fluxQuery = `
from(bucket: "${config.influxDb.bucket}")
  |> range(start: -6h)
  |> filter(fn: (r) => r._measurement == "data")
  |> filter(fn: (r) => r.room == "${room}")

  |> group(columns: ["type", "element_id", "_field"])
  |> aggregateWindow(every: 1m, fn: mean)
  |> yield(name: "mean")
`;

        const byTimeStamp = {};

        queryApi.queryRows(fluxQuery, {
          next(row, tableMeta) {
            const obj = tableMeta.toObject(row);
            // console.log(`${o._time} ${o.room} ${o._field}: ${o._value.toFixed(2)}`)

            _.set(byTimeStamp, [obj._time, `${obj.type}_${obj.element_id}_${obj._field}`], obj._value);
          },
          error(err) {
            next(err);
          },
          complete() {
            const records = [];

            for(const timestamp of Object.keys(byTimeStamp).sort()) {
              records.push({
                timestamp,
                ...byTimeStamp[timestamp],
              });
            }

            res.json(records);
          },
        });
      } catch(err) {
        return next(err);
      }
    },
  };
}
