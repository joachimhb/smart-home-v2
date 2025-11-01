import React, {
  useEffect,
  // useState,
} from 'react';
import {connect} from 'react-redux';

import prettyMs from 'pretty-ms';

import {getRooms} from '../actions/rooms.js';
import Room from '../components/Room.jsx';

const Overview = function(props) {
  const {
    dispatch,
    rooms,
    roomStatus = {},
    automationStatus = {},
  } = props;

  useEffect(() => {
    dispatch(getRooms());
  });

  if(rooms.error) {
    return <div className='ui-error'>{rooms.error.message}</div>;
  }

  if(rooms.loading || !rooms.data) {
    return <div className='spinner'>Loading rooms...</div>;
  }

  // console.log('Overview', {roomStatus});

  const renderRoom = room => (
    <Room
      key={room.id}
      config={room}
      roomStatus={roomStatus[room.id] || {}}
    />
  );

  const renderControlInfo = () => {
    const elements = [];

    for(const raspi of ['arbeitszimmer', 'kammer', 'wohnzimmer']) {
      const status = automationStatus[raspi] || {};

      if(status.since) {
        elements.push(
          <div key={raspi} style={{display: 'flex'}}>
            <div style={{minWidth: '90px'}}>{raspi}</div>
            <div>Rolladen start: {prettyMs(Date.now() - new Date(status.since))}</div>
          </div>
        );
      }
    }

    return (
      <div key='control-info' style={{marginTop: '8px'}}>
        {elements}
      </div>
    );
  };

  return [
    <div key='overview' className='overview'>
      {rooms.data.map(room => renderRoom(room))}
    </div>,
    renderControlInfo(),
  ];
};

const mapStateToProps = state => ({
  roomStatus: state.roomStatus,
  automationStatus: state.automationStatus,
  roomStatusHistory: state.roomStatusHistory,
  rooms: state.rooms,
});

export default connect(mapStateToProps)(Overview);
