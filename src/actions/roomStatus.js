export const ROOM_STATUS_UPDATE  = 'ROOM_STATUS_UPDATE';

export const updateRoomStatus = (id, data) => dispatch => {
  dispatch({
    type: ROOM_STATUS_UPDATE,
    id,
    data,
  });
};
