
import {
  ROOM_STATUS_HISTORY_REQUEST,
  ROOM_STATUS_HISTORY_SUCCESS,
  ROOM_STATUS_HISTORY_ERROR,
  ROOM_STATUS_HISTORY_CLEAR,
} from '../actions/roomStatusHistory';

const defaultStore = {};

const rooms = function(store = defaultStore, action) {
  const {
    type,
    data,
    error,
    id,
  } = action;

  if(type === ROOM_STATUS_HISTORY_REQUEST) {
    return {
      ...store,
      [id]: {
        ...store[id],
        loading: true,
      },
    };
  }

  if(type === ROOM_STATUS_HISTORY_SUCCESS) {
    return {
      ...store,
      [id]: {
        ...store[id],
        loading: false,
        data,
      },
    };
  }

  if(type === ROOM_STATUS_HISTORY_ERROR) {
    return {
      ...store,
      [id]: {
        ...store[id],
        loading: false,
        error,
      },
    };
  }

  if(type === ROOM_STATUS_HISTORY_CLEAR) {
    return {
      ...store,
      [id]: {},
    };
  }

  return store;
};

export default rooms;
