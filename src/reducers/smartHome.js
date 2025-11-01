import {SMART_HOME_WEBSOCKET_CONNECTION} from '../actions/smartHome';

const defaultStore = {
  websocketConnection: null,
};

const smartHome = function(store = defaultStore, action) {
  const {
    type,
    value,
  } = action;

  if(type === SMART_HOME_WEBSOCKET_CONNECTION) {
    return {
      ...store,
      websocketConnection: value
    };
  }

  return store;
};

export default smartHome;

