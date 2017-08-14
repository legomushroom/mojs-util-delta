import parseColorToRgba from 'mojs-util-parse-color-to-rgba';

/**
 * Function parse color delta.
 *
 * @param {String} Name of the property.
 * @param {Object} Object to parse.
 * @returns {Object} Parsed `delta`.
 */
export const parseColor = (name, object) => {
  const start = parseColorToRgba(object.start);
  const end = parseColorToRgba(object.end);

  const delta = {
    r: end.r - start.r,
    g: end.g - start.g,
    b: end.b - start.b,
    a: end.a - start.a,
  };

  return Object.assign({}, object, {
    type: 'color',
    name,
    start,
    end,
    delta,
  });
};

export default parseColor;
