import prettyMilliseconds from 'pretty-ms';
import moment from 'moment';

const humanDate = date => {
  if(date) {
    return prettyMilliseconds(Date.now() - moment.utc(date));
  }

  return '';
};

export default humanDate;
