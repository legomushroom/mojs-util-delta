import unitsRegexp from 'mojs-util-units-regexp';

const getRegexpUnit = (value) => {
  if (typeof value !== 'string') { return undefined; }
  const valueMatch = value.match(unitsRegexp);

  return (valueMatch !== null) ? valueMatch[0] : undefined;
};

/**
 * Function parse number delta.
 *
 * @param {String} Name of the property.
 * @param {Object} Object to parse.
 * @returns {Object} Parsed `delta`.
 */
const parseUnit = (name, object) => {
  const result = Object.assign({}, object, { type: 'unit', name });
  // get start and end units
  const startUnit = getRegexpUnit(result.start);
  const endUnit = getRegexpUnit(result.end);
  // get the unit for both with priority to startUnit
  result.unit = endUnit || startUnit || 'px';
  // parse the values in case we have strings there
  result.start = parseFloat(result.start);
  result.end = parseFloat(result.end);
  // calculate delta
  result.delta = result.end - result.start;

  return result;
};

export { parseUnit };
