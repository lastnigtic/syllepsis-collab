const path = require('path');

const PORT = 8000;
const MAX_STEP_HISTORY = 5000;
const SAVE_FILE = path.resolve(__dirname, 'data.json');
const TIME_OUT = 5 * 1000;
const CONTROLLER_PATH = path.resolve(__dirname, './controllers');

const SUCCESS_CODE = 0;
const ERROR_CODE = 1;
const BAD_VERSION_CODE = 410;

module.exports = {
  PORT,
  SAVE_FILE,
  MAX_STEP_HISTORY,
  TIME_OUT,
  CONTROLLER_PATH,
  BAD_VERSION_CODE,
  ERROR_CODE,
  SUCCESS_CODE,
};
