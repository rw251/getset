// {
//   preserveOrder: false,
//   original: 'hip dislocation',
//   regexes: ['\\bhip\\b', '\\bdislocation\\b'],
// }

/**
 * Escapes all characters apart from '*' in a regex string. From https://stackoverflow.com/a/6969486/596639
 * @param {String} str The string to escape for regex
 * @returns {String} The escaped string
 */
const escapeRegExp = str => str.replace(/[-[\]/{}()+?.\\^$|]/g, '\\$&');

/**
 * Takes into account the wildcards at start or end to determine whether to
 * search for word breaks or not
 * @param {Object} term The term to search for. Term.term is the text
 * @returns {String} the regexed string.
 */
const getRegexForTerm = (term) => {
  let regexTerm = escapeRegExp(term);

  // if doesn't start with wildcard then add word boundary
  if (regexTerm[0] !== '*') regexTerm = `\\b${regexTerm}`;
  else regexTerm = regexTerm.substr(1);

  // if doesn't end with wildcard then add word boundary
  if (regexTerm[regexTerm.length - 1] !== '*') regexTerm = `${regexTerm}\\b`;
  else regexTerm = regexTerm.slice(0, -1);

  // convert wildcard in middle to regex wildcard
  regexTerm = regexTerm.replace('*', '.*');

  return regexTerm;
};

// inclustionTerm like:
//  'total knee replac*'
//  'MI'
//  '"type 2" diabet*'
const getObject = (inclusionTerm) => {
  const term = {
    preserveOrder: false,
    original: inclusionTerm,
    regexes: [],
  };

  let currentTerm = '';
  let isInsideQuotes = false;
  inclusionTerm.split('').forEach((c) => {
    switch (c) {
      case '"':
        if (currentTerm.length > 0) term.regexes.push(getRegexForTerm(currentTerm));
        isInsideQuotes = !isInsideQuotes;
        currentTerm = '';
        break;
      case ' ':
        if (!isInsideQuotes && currentTerm.length > 0) {
          term.regexes.push(getRegexForTerm(currentTerm));
          currentTerm = '';
        } else if (isInsideQuotes) {
          currentTerm += c;
        }
        break;
      default:
        currentTerm += c;
    }
  });
  if (currentTerm.length > 0) term.regexes.push(getRegexForTerm(currentTerm));
  return term;
};

exports.getObject = (inclusionTerm) => {
  // "list of terms"
  // all bits get ANDed
  // "s to match exact
  // * wildcard
  if (Array.isArray(inclusionTerm)) {
    return inclusionTerm.map(getObject);
  }
  return getObject(inclusionTerm);
};

exports.terminologies = ['Readv2', 'SNOMED CT'];
