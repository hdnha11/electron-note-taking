const { marked } = require('marked');

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatAMPM(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  let displayHours = hours % 12;
  displayHours = displayHours > 0 ? displayHours : 12; // the hour '0' should be '12'

  return `${padNumber(displayHours)}:${padNumber(minutes)} ${ampm}`;
}

function padNumber(number) {
  return String(number).padStart(2, '0');
}

exports.formatDate = function (d) {
  const year = d.getFullYear();
  const date = d.getDate();
  const month = months[d.getMonth()];
  const day = days[d.getDay()];

  return `${day}, ${month} ${padNumber(date)}, ${year}, ${formatAMPM(d)}`;
};

exports.mdToHtml = function (md) {
  return marked.parse(md);
};
