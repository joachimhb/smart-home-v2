import _ from 'lodash-es';

import React, {
  useEffect,
} from 'react';
import {connect} from 'react-redux';

import {getRooms} from '../actions/rooms.js';
import Room from '../components/Room.jsx';

const RoomFullSize = function(props) {
  const {
    dispatch,
    id,
    rooms,
    roomStatus = {},
  } = props;

  useEffect(() => {
    dispatch(getRooms());
  });

  // console.log({roomStatus, roomStatusHistory});

  if(rooms.error) {
    return <div className='ui-error'>{rooms.error.message}</div>;
  }

  if(rooms.loading || !rooms.data) {
    return <div className='spinner'>Loading rooms...</div>;
  }

  const room          = _.find(rooms.data, {id});

  if(!room) {
    return <div>Room {id} not found</div>;
  }

  return (
    <Room
      key={id}
      config={room}
      roomStatus={roomStatus[id] || {}}
      full={true}
    />
  );
};

const mapStateToProps = state => ({
  roomStatus: state.roomStatus,
  rooms: state.rooms,
});

export default connect(mapStateToProps)(RoomFullSize);
