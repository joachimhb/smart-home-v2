import logger  from 'redux-logger';
import {thunk} from 'redux-thunk';
import {combineReducers} from 'redux';
import {configureStore}  from '@reduxjs/toolkit';

import * as reducers from './reducers/index.js';

import connectWebsocket from './lib/connectWebsocket.js';

const middlewares = [
  thunk,
  // logger,
];

const store = configureStore({
  reducer: combineReducers({...reducers}),
  middleware: () => middlewares,
});

connectWebsocket({store});

export default store;
