
import {
  ROOMS_REQUEST,
  ROOMS_SUCCESS,
  ROOMS_ERROR,
  ROOMS_CLEAR,
} from '../actions/rooms';

const defaultStore = {};

const rooms = function(store = defaultStore, action) {
  const {
    type,
    data,
    error,
  } = action;

  if(type === ROOMS_REQUEST) {
    return {
      ...store,
      loading: true,
    };
  }

  if(type === ROOMS_SUCCESS) {
    return {
      ...store,
      loading: false,
      data,
    };
  }

  if(type === ROOMS_ERROR) {
    return {
      ...store,
      loading: false,
      error,
    };
  }

  if(type === ROOMS_CLEAR) {
    return defaultStore;
  }

  return store;
};

export default rooms;
