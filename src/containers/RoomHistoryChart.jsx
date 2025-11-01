import React, {useEffect} from 'react';

import {connect} from 'react-redux';

import millisecond from 'millisecond';

import moment from 'moment';

import {
  LineChart,
  XAxis,
  YAxis,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';

import {getStatusHistory} from '../actions/roomStatusHistory';
import _ from 'lodash-es';

const RoomHistoryChart = function(props) {
  const {
    dispatch,
    id,
    roomStatusHistory = {},
  } = props;

  // console.log(roomStatusHistory);

  const dataByDay = {};

  const storePart = roomStatusHistory[id] || {};

  useEffect(() => {
    dispatch(getStatusHistory(id));
  }, [id])

  if(storePart.loading) {
    return <div>Loading chart data</div>;
  }

  const zeroValue = 12;

  const fanStatusValue = {
    'min': 20,
    'max': 24,
    'off': zeroValue,
  }

  const windowStatusValue = {
    'open': 28,
    'closed': zeroValue,
  }

  const longData = _.get(storePart, ['data', 'long'], []);

  for(const rec of longData) {
    if(!rec.temperature || !rec.humidity || rec.humidity > 100) {
      continue;
    }

    const day = moment(rec.time).format('YYYY-MM-DD');

    dataByDay[day] = dataByDay[day] || {
      humiditySum: 0,
      temperatureSum: 0,
      count: 0,
    };

    dataByDay[day].count++;
    dataByDay[day].humiditySum += rec.humidity;
    dataByDay[day].temperatureSum += rec.temperature;
  };


  const renderChart = (type, filter) => {
    const data = _.get(storePart, ['data', type], []);

    const key = `${type}_${filter}`;

    let max = null;

    if(filter) {
      max = moment().valueOf() - millisecond(filter);
    }

    if(!data.length) {
      return <div key={key}>No {type} data</div>;
    }

    const chartData = [];

    let temperatureSum = 0;
    let humiditySum = 0;

    let usedPoints = 0;

    for(const rec of data) {
      if(!rec.temperature || !rec.humidity || rec.humidity > 100) {
        continue;
      }

      const pointInMs = moment(rec.time).valueOf();

      if(max) {
        if(pointInMs < max) {
          continue;
        }
      }

      chartData.push({
        // x: rec.time,
        // x: new Date(rec.time).valueOf(),
        x: pointInMs,
        fanStatus: fanStatusValue[rec.fan] || zeroValue,
        windowStatus: windowStatusValue[rec.window] || zeroValue,
        temperature: rec.temperature,
        humidity: rec.humidity,
      })

      temperatureSum += rec.temperature;
      humiditySum += rec.humidity;
      usedPoints++;
    }

    const temperatureAvg = Math.round((temperatureSum * 10 / usedPoints)) / 10;
    const humidityAvg = Math.round(humiditySum / usedPoints);

    const tickFormatter = value => moment(value).format('HH:mm');

    const dayLines = [];
    const hourLines = [];

    let mom = moment(moment().format('YYYY-MM-DD'));

      // console.log({mom}, mom)

    while(dayLines.length < 28) {
      const label = mom.format('DD.MM.');

      const x = mom.valueOf();

      dayLines.push(
        <ReferenceLine 
          yAxisId='left' 
          key={`${x}_day`} 
          x={x} 
          // segment={[{x, y: 12}, {x, y: 30}]}
          stroke='slategray' 
          strokeWidth={0.2}
        >
          <Label value={label} position='insideTop' />
        </ReferenceLine>
      );

      mom = mom.subtract(1, 'day');
    }

    if(type === 'recent' || filter === '24h') {
      let mom = moment(moment().format('YYYY-MM-DD HH'));

      // console.log({mom}, mom)

      while(hourLines.length < 24) {
        const label = mom.format('HH:MM');

        const x = mom.valueOf();

        hourLines.push(
          <ReferenceLine 
            yAxisId='left' 
            key={x} 
            x={x} 
            // segment={[{x, y: 12}, {x, y: 30}]}
            stroke='slategray' 
            strokeWidth={0.2}
          >
            <Label value={label} position='insideBottom' />
          </ReferenceLine>
        );

        mom.subtract(1, 'hour');
      }
    }
  
    return (
      <div className='room__history-chart' key={key}>
        <ResponsiveContainer width='98%' height={300}>
          <LineChart
            data={chartData}
            margin={{top: 5, right: -30, left: -30, bottom: 0}}
          >
            <XAxis dataKey='x' tickFormatter={tickFormatter} type='number' domain={['dataMin', 'dataMax']} tickCount={24} tick={false}/>
            <CartesianGrid stroke='#f5f5f5' />
            <YAxis yAxisId='left' domain={['dataMin - 2', 'dataMax']} allowDecimals={false} />
            <YAxis yAxisId='right' orientation='right' domain={['dataMin - 2', 'dataMax']} allowDecimals={false} />
            <Line dot={false} strokeWidth={0.5} type='monotone' dataKey='temperature' stroke='red' yAxisId='left' />
            <Line dot={false} strokeWidth={0.5} type='monotone' dataKey='fanStatus' stroke='green' yAxisId='left' />
            <Line dot={false} strokeWidth={0.5} type='monotone' dataKey='windowStatus' stroke='cyan' yAxisId='left' />
            <Line dot={false} strokeWidth={0.5} type='monotone' dataKey='humidity' stroke='blue' yAxisId='right' />
            {dayLines}
            {hourLines}
            <ReferenceLine yAxisId='left' y={temperatureAvg} label={`Avg: ${temperatureAvg}C`} stroke='red' strokeDasharray='3 3' strokeWidth={0.2} />
            <ReferenceLine yAxisId='right' y={humidityAvg} label={`Avg: ${humidityAvg}%`} stroke='blue' strokeDasharray='3 3' strokeWidth={0.2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderStats = () => {
    const rows = [];

    for(const day of Object.keys(dataByDay).sort().reverse()) {
      rows.push(
        <tr key={day}>
          <td>{day}</td>
          <td>{(Math.round(dataByDay[day].temperatureSum * 10 / dataByDay[day].count) / 10).toFixed(1)}C</td>
          <td>{(Math.round(dataByDay[day].humiditySum / dataByDay[day].count).toFixed(1))}%</td>
        </tr>
      );
    }

    return (
      <table style={{maxWidth: 160}}>
        <thead>
          <tr>
            <th colSpan={3}>Day history</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    )
  }

  return [
    <div key='header1'>Last 6h</div>,
    renderChart('recent'),
    <div key='header2'>Last 24h</div>,
    renderChart('long', '24h'),
    <div key='header3'>Max</div>,
    renderChart('long'),
    renderStats(),
  ]
};
  
const mapStateToProps = state => ({
  roomStatusHistory: state.roomStatusHistory,
});

export default connect(mapStateToProps)(RoomHistoryChart);
