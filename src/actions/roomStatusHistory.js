import backend from '../backend';
import client from '../lib/client';

export const ROOM_STATUS_HISTORY_REQUEST = 'ROOM_STATUS_HISTORY_REQUEST';
export const ROOM_STATUS_HISTORY_SUCCESS = 'ROOM_STATUS_HISTORY_SUCCESS';
export const ROOM_STATUS_HISTORY_ERROR   = 'ROOM_STATUS_HISTORY_ERROR';
export const ROOM_STATUS_HISTORY_CLEAR   = 'ROOM_STATUS_HISTORY_CLEAR';

export const getStatusHistory = roomId => async(dispatch, getStore) => {
  const store = getStore();

  if(!roomId) {
    return;
  }

  const storepart = (store.roomStatusHistory || {})[roomId] || {};

  console.log('getStatusHistory', roomId, JSON.stringify(storepart));

  if(storepart.loading || storepart.data || storepart.error) {
    return false;
  }

  dispatch({
    type: ROOM_STATUS_HISTORY_REQUEST,
    id: roomId,
  });

  try {
    const res = await client.get(`${backend.api}/room-status-history/${roomId}`);

    dispatch({
      type: ROOM_STATUS_HISTORY_SUCCESS,
      data: res.body,
      id: roomId,
    });
  } catch(err) {
    dispatch({
      type: ROOM_STATUS_HISTORY_ERROR,
      error: err,
      id: roomId,
    });
  }
};

export const clearStatusHistory = roomId => dispatch => {
  dispatch({
    type: ROOM_STATUS_HISTORY_CLEAR,
    id: roomId,
  });
};
