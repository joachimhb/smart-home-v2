import {updateAutomationStatus}  from '../actions/automationStatus.js';
import {updateRoomStatus}        from '../actions/roomStatus.js';
import {setWebsocketConnection}  from '../actions/smartHome.js';

const wsHost = `ws://localhost:3001`;

const connectWebsocket = function({store}) {
  const ws = new WebSocket(wsHost);

  ws.onopen = function() {
    store.dispatch(setWebsocketConnection(true));
  };

  ws.onclose = function() {
    store.dispatch(setWebsocketConnection(false));
  };

  // setInterval(() => {
  //   console.log(ws.readyState);

  // }, 1000);

  ws.onmessage = function(event) {
    try {
      const received = JSON.parse(event.data);

      const {type, id, status} = received;

      console.log('MESSAGE', type, id, status);

      if(type === 'room') {
        store.dispatch(updateRoomStatus(id, status));
      }

      if(type === 'automation') {
        store.dispatch(updateAutomationStatus(id, status));
      }

      // console.log(event);
      // console.log(JSON.stringify({type, id, status, statusHistory}, null, 2));
    } catch(err) {
      console.warn('Websocket', err);
    }
  };
};

export default connectWebsocket;
