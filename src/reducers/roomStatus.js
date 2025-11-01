
import {ROOM_STATUS_UPDATE} from '../actions/roomStatus';

const defaultStore = {};

const roomStatus = function(store = defaultStore, action) {
  const {
    type,
    id,
    data,
  } = action;

  if(type === ROOM_STATUS_UPDATE) {
    return {
      ...store,
      [id]: data,
    };
  }

  return store;
};

export default roomStatus;
