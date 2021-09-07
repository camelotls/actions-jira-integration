const { kickOffAction } = require('./helpers/foundation');
const { getInput } = require('./utils/helper');

(async() => {
    await kickOffAction(getInput('INPUT_JSON'));
})();
