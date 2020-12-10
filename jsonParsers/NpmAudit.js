const NpmAudit = function (inputJson, advisoryId) {
  // eslint-disable-next-line camelcase
  const { id, module_name, vulnerable_versions, patched_versions, overview, recommendation, references, severity, cwe, url } = inputJson[advisoryId];

  this.id = id;
  this.module_name = module_name; // eslint-disable-line camelcase
  this.vulnerable_versions = vulnerable_versions; // eslint-disable-line camelcase
  this.patched_versions = patched_versions; // eslint-disable-line camelcase
  this.overview = overview;
  this.recommendation = recommendation;
  this.references = references;
  this.severity = severity;
  this.cwe = cwe;
  this.url = url;
};

module.exports = NpmAudit;
