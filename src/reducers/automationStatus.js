
import {AUTOMATION_STATUS_UPDATE} from '../actions/automationStatus.js';

const defaultStore = {};

const automationStatus = function(store = defaultStore, action) {
  const {
    type,
    id,
    data,
  } = action;

  if(type === AUTOMATION_STATUS_UPDATE) {
    return {
      ...store,
      [id]: data,
    };
  }

  return store;
};

export default automationStatus;
