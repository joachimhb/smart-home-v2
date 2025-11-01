import React from 'react';
import {Provider} from 'react-redux';
import {Route, Routes, HashRouter} from 'react-router';

import App from './containers/App.jsx';
import store from './store.js';

const Root = function() {
  // return (<div>hi</div>);
  console.log('Root.jsx');

  return (
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route path='/room/:id' exact={true} element={<App />} />
          <Route path='*' element={<App />} />
        </Routes>
      </HashRouter>
    </Provider>
  );
};

export default Root;
