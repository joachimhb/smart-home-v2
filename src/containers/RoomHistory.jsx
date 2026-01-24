import React, {
  useEffect,
  useState,
} from 'react';

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
  // Tooltip,
} from 'recharts';

import {clearStatusHistory, getStatusHistory} from '../actions/roomStatusHistory';
import _ from 'lodash-es';

const RoomHistoryChart = function(props) {
  const {
    dispatch,
    id,
    config,
    roomStatusHistory = {},
  } = props;

  // console.log(roomStatusHistory);

  const ranges = ['2h', '6h', '12h', '24h', '48h', '7d'];

  const [_range, setRange] = useState('6h');

  const storePart = roomStatusHistory[id] || {};

  useEffect(() => {
    dispatch(getStatusHistory(id, {range: _range}));
  });

  useEffect(() => {
    dispatch(clearStatusHistory(id));
  }, [_range, dispatch, id]);

  const {
    data = [],
    error,
  } = storePart;

  if(error) {
    return <div className='error'>Status history error: {error.message}</div>;
  }

  const renderDateRangePicker = () => (
    <div key='range-picker' className='room__history-range-picker'>
      {ranges.map(range => <div key={range} className={`room__history-range-picker__value ${range === _range ? 'room__history-range-picker__value--active' : ''}`} onClick={() => setRange(range)}>{range}</div>)}
    </div>
  );

  const chartData = data.map(rec => ({x: moment(rec.timestamp).valueOf(), ...rec})).filter(rec => {
    if(['wohnzimmer', 'schlafzimmer'].includes(id)) {
      if(!rec.temperature_overall_status) {
        return false;
      }
    }

    return true;
  });

  const humidityLines = [];
  const temperatureLines = [];
  const windowAreas = [];
  const lightAreas = [];
  const fanBars = [];
  const heatingAreas = [];


  for(const light of config.lights || []) {
    lightAreas.push(
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
  }

  for(const fan of config.fans || []) {
    fanBars.push(
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

    fanBars.push(
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
    windowAreas.push(
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
    temperatureLines.push(
      <Line
        key={`temperature_${dht22.id}_status`}
        name={`Temperatur ${dht22.label || dht22.id}`}
        dot={false}
        strokeWidth={1}
        type='monotone'
        dataKey={`temperature_${dht22.id}_status`}
        stroke='blue'
        yAxisId='left'
      />
    );

    humidityLines.push(
      <Line
        key={`humidity_${dht22.id}_status`}
        name={`Luftfeuchtigkeit ${dht22.label || dht22.id}`}
        dot={false}
        strokeWidth={1}
        type='monotone'
        dataKey={`humidity_${dht22.id}_status`}
        stroke='MidnightBlue'
        yAxisId='right'
      />
    );
  }

  for(const trv of _.filter(config.zigbee || [], {manufacturer: 'sonoff', type: 'heatingthermostat'}).slice(0, 1)) {
    temperatureLines.push(
      <Line
        key={`heating_trv_${trv.id}_temperature_set`}
        name={`Heizung Temperatur ${trv.label || trv.id}`}
        dot={false}
        strokeWidth={1}
        type='monotone'
        dataKey={`sonoff-heatingthermostat_${trv.id}_occupied_heating_setpoint`}
        stroke='darkred'
        yAxisId='left'
      />
    );

    heatingAreas.push(
      <Area
        key={`sonoff-heatingthermostat_${trv.id}_heat`}
        name={`${trv.label || trv.id} heating`}
        dataKey={`sonoff-heatingthermostat_${trv.id}_heat`}
        fill='Tomato'
        stroke='Tomato'
        type='monotone'
        stackId='heat'
        yAxisId='right'
      />
    );

    // heatingAreas.push(
    //   <Bar
    //     key={`sonoff-heatingthermostat_${trv.id}_idle`}
    //     name={`${trv.label || trv.id} idle`}
    //     dataKey={`sonoff-heatingthermostat_${trv.id}_idle`}
    //     fill='gray'
    //     type='monotone'
    //     stackId='idle'
    //     yAxisId='right'
    //   />
    // );
  }

  for(const roomThermostat of _.filter(config.zigbee || [], {type: 'roomthermostat'})) {
    temperatureLines.push(
      <Line
        key={`temperature_${roomThermostat.id}_status`}
        name={`Temperatur ${roomThermostat.label || roomThermostat.id}`}
        dot={false}
        strokeWidth={1}
        type='monotone'
        dataKey={`temperature_${roomThermostat.id}_status`}
        stroke='darkgreen'
        yAxisId='left'
      />
    );

    humidityLines.push(
      <Line
        key={`humidity_${roomThermostat.id}_status`}
        name={`Luftfeuchtigkeit ${roomThermostat.label || roomThermostat.id}`}
        dot={false}
        strokeWidth={1}
        type='monotone'
        dataKey={`humidity_${roomThermostat.id}_status`}
        stroke='MidnightBlue'
        yAxisId='right'
      />
    );
  }

  const tickFormatter = value => {
    const label = moment(value).format('HH:mm');

    return label;
  };

  const renderChart = (key, lines, secondYAxisDomain = [0, 100]) => (
    <div className='room__history-chart' key={key}>
      <ResponsiveContainer width='95%' height={350} margin={{left: 0, top: 0, bottom: 0, right: 20}}>
        <ComposedChart
          data={chartData}
          padding={{top: 5, right: 0, left: 0, bottom: 10}}
        >
          <XAxis dataKey='x' tickFormatter={tickFormatter} type='number' domain={['dataMin', 'dataMax']} tickCount={24} />
          <CartesianGrid stroke='#f5f5f5' />
          <YAxis domain={['dataMin - 1', 'dataMax + 2']} yAxisId='left' allowDecimals={false} unit='°C' />
          <YAxis domain={secondYAxisDomain} yAxisId='right' orientation='right' allowDecimals={false} unit='%' />
          {lines}
          {/* <Line
            dot={false}
            strokeWidth={2}
            type='monotone'
            name='Raum Temperatur'
            dataKey='temperature_overall_status'
            stroke='SteelBlue'
            yAxisId='left'
          />
          <Line
            dot={false}
            strokeWidth={2}
            type='monotone'
            name='Raum Luftfeuchtigkeit'
            dataKey='humidity_overall_status'
            stroke='SteelBlue'
            yAxisId='left'
          /> */}
          <Legend  />
          {/* <Tooltip /> */}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  const mainTempLine = (
    <Line
      key='main-temp'
      dot={false}
      strokeWidth={2}
      type='monotone'
      name='Raum Temperatur'
      dataKey='temperature_overall_status'
      stroke='SteelBlue'
      yAxisId='left'
    />
  );

  return [
    renderDateRangePicker(),
    // renderHeatingChart(),
    renderChart('heating', [...temperatureLines, ...heatingAreas], [0, 3]),
    renderChart('humidity', [...humidityLines, ...fanBars, ...windowAreas, ...lightAreas, mainTempLine]),
    // <pre key='debug'>{JSON.stringify((data || [])[(data || []).length - 1], null, 2)}</pre>,
  ];
};

const mapStateToProps = state => ({
  roomStatusHistory: state.roomStatusHistory,
});

export default connect(mapStateToProps)(RoomHistoryChart);
