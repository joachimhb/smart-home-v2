import moment from 'moment';

const humanDate = date => {
  if(date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  }

  return '';
};

export default humanDate;
