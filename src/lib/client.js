import superagent from 'superagent';

const client = {
  get: (url, options) => new Promise((resolve, reject) => {
    superagent.get(url, options)
      .end((err, res) => {
        if(err) {
          return reject(err);
        }

        resolve(res);
      });
  }),
  put: (url, data, options) => new Promise((resolve, reject) => {
    superagent.put(url, data, options)
      .end((err, res) => {
        if(err) {
          return reject(err);
        }

        resolve(res);
      });
  }),

  post: (url, data, options) => new Promise((resolve, reject) => {
    superagent.post(url, data, options)
      .end((err, res) => {
        if(err) {
          return reject(err);
        }

        resolve(res);
      });
  }),
};

export default client;
