import backend from '../backend';
import client from '../lib/client';

export const ROOMS_REQUEST = 'ROOMS_REQUEST';
export const ROOMS_SUCCESS = 'ROOMS_SUCCESS';
export const ROOMS_ERROR   = 'ROOMS_ERROR';
export const ROOMS_CLEAR   = 'ROOMS_CLEAR';

export const getRooms = () => async(dispatch, getStore) => {
  const store = getStore();

  if(store.rooms) {
    if(store.rooms.loading || store.rooms.data || store.rooms.error) {
      return false;
    }
  }

  dispatch({
    type: ROOMS_REQUEST,
  });

  try {
    const res = await client.get(`${backend.api}/rooms/`);

    dispatch({
      type: ROOMS_SUCCESS,
      data: res.body,
    });
  } catch(err) {
    dispatch({
      type: ROOMS_SUCCESS,
      error: err,
    });
  }
};

export const clearRooms = () => dispatch => {
  dispatch({
    type: ROOMS_CLEAR,
  });
};
