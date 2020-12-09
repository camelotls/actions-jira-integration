const NpmAudit = require('../jsonParsers/NpmAudit');
const jsonParser = { NpmAudit };

module.exports = {
  createParser (type, input, ...attributes) {
    const ParserType = jsonParser[type];
    return new ParserType(input, ...attributes);
  }
};
