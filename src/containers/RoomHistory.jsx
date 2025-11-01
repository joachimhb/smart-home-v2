import React, {useEffect} from 'react';

import {connect} from 'react-redux';

import moment from 'moment';

import {
  ComposedChart,
  XAxis,
  YAxis,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  // ReferenceLine,
  // Label,
  Bar,
  Area,
  Legend,
  Tooltip,
} from 'recharts';

import {getStatusHistory} from '../actions/roomStatusHistory';
import _ from 'lodash-es';

const RoomHistoryChart = function(props) {
  const {
    dispatch,
    id,
    config,
    roomStatusHistory = {},
  } = props;

  // console.log(roomStatusHistory);

  const storePart = roomStatusHistory[id] || {};

  useEffect(() => {
    dispatch(getStatusHistory(id));
  }, [id, dispatch]);

  const {
    data = [],
    error,
  } = storePart;

  if(error) {
    return <div className='error'>Status history error: {error.message}</div>;
  }

  const renderHeatingChart = () => {
    if(!config.heating) {
      return;
    }

    const chartData = data.map(rec => ({x: moment(rec.timestamp).valueOf(), ...rec}));

    const tickFormatter = value => moment(value).format('HH:mm');

    const generatedElements = [];

    for(const trv of config.heating.trvs) {
      generatedElements.push(
        <Line
          key={`heating_trv_${trv.id}_valve_set`}
          name={`TRV Ventil ${trv.label || trv.id} soll`}
          dot={false}
          strokeWidth={0.5}
          type='monotone'
          dataKey={`heating_trv_${trv.id}_valve_set`}
          stroke='SeaGreen'
          yAxisId='right'
        />
      );

      generatedElements.push(
        <Line
          key={`heating_trv_${trv.id}_valve_current`}
          name={`TRV Ventil ${trv.label || trv.id} ist`}
          dot={false}
          strokeWidth={0.5}
          type='monotone'
          dataKey={`heating_trv_${trv.id}_valve_current`}
          stroke='Indigo'
          yAxisId='right'
        />
      );
    }

    return (
      <div className='room__history-chart' key='heating-chart'>
        <ResponsiveContainer width='98%' height={300}>
          <ComposedChart
            data={chartData}
            margin={{top: 5, right: -30, left: -30, bottom: 0}}
          >
            <XAxis dataKey='x' tickFormatter={tickFormatter} type='number' domain={['dataMin', 'dataMax']} tickCount={24} tick={false} />
            <CartesianGrid stroke='#f5f5f5' />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} yAxisId='left' allowDecimals={false} unit='°C' />
            <YAxis domain={[0, 100]} yAxisId='right' orientation='right' allowDecimals={false} unit='%' />
            <Line
              dot={false}
              strokeWidth={0.5}
              type='monotone'
              name='Heizung Temperatur'
              dataKey='temperature_overall_status'
              stroke='SteelBlue'
              yAxisId='left'
            />
            <Line
              dot={false}
              strokeWidth={0.5}
              type='monotone'
              name='Raum Temperatur'
              dataKey='heating_overall_temperature_set'
              stroke='DarkSlateGray'
              yAxisId='left'
            />
            {generatedElements}
            <Legend verticalAlign='bottom' />
            <Tooltip />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderTemperatureHumidityChart = () => {
    const chartData = data.map(rec => ({x: moment(rec.timestamp).valueOf(), ...rec}));

    const tickFormatter = value => moment(value).format('HH:mm');

    const generatedElements = [];

    console.log(config.lights);

    for(const light of config.lights || []) {
      generatedElements.push(
        <Area
          key={`light_${light.id}_on`}
          name={`${light.label || light.id} an`}
          dataKey={`light_${light.id}_on`}
          fill='Khaki'
          stroke='Khaki'
          type='monotone'
          yAxisId='right'
        />
      );

      console.log({generatedElements});
    }

    for(const fan of config.fans || []) {
      generatedElements.push(
        <Bar
          key={`fan_${fan.id}_max`}
          name={`${fan.label || fan.id} max`}
          dataKey={`fan_${fan.id}_max`}
          fill='Crimson'
          type='monotone'
          stackId='fanSpeed'
          yAxisId='right'
        />
      );

      generatedElements.push(
        <Bar
          key={`fan_${fan.id}_min`}
          name={`${fan.label || fan.id} min`}
          dataKey={`fan_${fan.id}_min`}
          fill='Tomato'
          type='monotone'
          stackId='fanSpeed'
          yAxisId='right'
        />
      );
    }

    for(const window of config.windows || []) {
      generatedElements.push(
        <Area
          key={`window_${window.id}_open`}
          name={`${window.label || window.id} offen`}
          dataKey={`window_${window.id}_open`}
          fill='Silver'
          stroke='Gray'
          type='monotone'
          yAxisId='right'
        />
      );
    }

    for(const dht22 of config.dht22 || []) {
      generatedElements.push(
        <Line
          key={`temperature_${dht22.id}_status`}
          name={`Temperatur ${dht22.label || dht22.id}`}
          dot={false}
          strokeWidth={0.5}
          type='monotone'
          dataKey={`temperature_${dht22.id}_status`}
          stroke='lightblue'
          yAxisId='left'
        />
      );

      generatedElements.push(
        <Line
          key={`humidity_${dht22.id}_status`}
          name={`Luftfeuchtigkeit ${dht22.label || dht22.id}`}
          dot={false}
          strokeWidth={0.5}
          type='monotone'
          dataKey={`humidity_${dht22.id}_status`}
          stroke='MidnightBlue'
          yAxisId='right'
        />
      );
    }

    return (
      <div className='room__history-chart' key='heating-chart'>
        <ResponsiveContainer width='98%' height={300}>
          <ComposedChart
            data={chartData}
            margin={{top: 5, right: -30, left: -30, bottom: 0}}
          >
            <XAxis dataKey='x' tickFormatter={tickFormatter} type='number' domain={['dataMin', 'dataMax']} tickCount={24} tick={false} />
            <CartesianGrid stroke='#f5f5f5' />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} yAxisId='left' allowDecimals={false} unit='°C' />
            <YAxis domain={[0, 100]} yAxisId='right' orientation='right' allowDecimals={false} unit='%' />
            {generatedElements}
            <Line
              dot={false}
              strokeWidth={0.5}
              type='monotone'
              name='Raum Temperatur'
              dataKey='temperature_overall_status'
              stroke='SteelBlue'
              yAxisId='left'
            />
            <Legend verticalAlign='bottom' />
            <Tooltip />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return [
    renderHeatingChart(),
    renderTemperatureHumidityChart(),
    <pre key='debug'>{JSON.stringify(_.last(data || []), null, 2)}</pre>,
  ];
};

const mapStateToProps = state => ({
  roomStatusHistory: state.roomStatusHistory,
});

export default connect(mapStateToProps)(RoomHistoryChart);
