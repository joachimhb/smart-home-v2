export const SMART_HOME_WEBSOCKET_CONNECTION = 'SMART_HOME_WEBSOCKET_CONNECTION';

export const setWebsocketConnection = value => dispatch => {
  dispatch({
    type: SMART_HOME_WEBSOCKET_CONNECTION,
    value,
  });
};
