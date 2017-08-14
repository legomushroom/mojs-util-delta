import ClassProto, { extendClass, createClass } from 'mojs-util-class-proto';
import Tween from 'mojs-tween';
import parseStaggerProperty from 'mojs-util-parse-stagger-property';
import unitsRegexp from 'mojs-util-units-regexp';
import parseColorToRgba from 'mojs-util-parse-color-to-rgba';

import { splitDelta } from './split-delta.babel.js';
import { parseNumber } from './parse-number.babel.js';
import { parseUnit } from './parse-unit.babel.js';
import { parseColor } from './parse-color.babel.js';

/*
  TODO:
    - rename `target` to `el`
*/

// map that holds all available parsers
const parsersMap = {
  number: parseNumber,
  unit: parseUnit,
  color: parseColor,
};

/* ------------------ */
/* The `Delta` class  */
/* ------------------ */

const DeltaClass = extendClass(ClassProto);
const Super = ClassProto.__mojsClass;

/**
 * `init` - function init the class.
 *
 * @extends @ClassProto
 * @public
 */
DeltaClass.init = function (o = {}) {
  // super call
  Super.init.call(this, o);
  // save target
  const { target, supportProps, customProperties = {}, key } = this._props;
  // if the `isSkipRender` property is set, set the property on
  // `supportProps` otherwise set is as ususal on the `target` object
  this._target = (customProperties[key] && customProperties[key].isSkipRender)
    ? supportProps : target;
  // parse delta
  this._parseDelta();
  // set up the update function acording to the delta type
  this.update = this[`_upd_${this._delta.type}`];
  // set up the tween
  this._setupTween();
};

/**
 * `_upd_number` - function to update `number` delta.
 *
 * @private
 * @param {Number} Eased progress.
 * @param {Number} Progress.
 * @param {Boolean} If forward update direction.
 * @returns {Object} This delta.
 */
DeltaClass._upd_number = function (ep, p) {
  const { curve, delta, start } = this._delta;
  const { key } = this._props;

  this._target[key] = (curve === undefined)
    ? start + (ep * delta)
    : (curve(p) * start) + (p * delta);

  return this;
};

/**
 * `_upd_unit` - function to update `unit` delta.
 *
 * @private
 * @param {Number} Eased progress.
 * @param {Number} Progress.
 * @param {Boolean} If forward update direction.
 * @returns {Object} This delta.
 */
DeltaClass._upd_unit = function (ep, p) {
  const { curve, delta, start, unit } = this._delta;
  const { key } = this._props;

  const value = (curve === undefined)
    ? start + (ep * delta)
    : (curve(p) * start) + (p * delta);

  this._target[key] = `${value}${unit}`;

  return this;
};

/**
 * `_upd_color` - function to update `color` delta.
 *
 * @private
 * @param {Number} Eased progress.
 * @param {Number} Progress.
 * @param {Boolean} If forward update direction.
 * @returns {Object} This delta.
 */
DeltaClass._upd_color = function (ep, p) {
  const { curve, delta, start } = this._delta;
  const { key } = this._props;

  if (curve === undefined) {
    const r = start.r + (ep * delta.r);
    const g = start.g + (ep * delta.g);
    const b = start.b + (ep * delta.b);
    const a = start.a + (ep * delta.a);
    this._target[key] = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`;
  } else {
    const curveP = curve(p);
    const r = (curveP * start.r) + (p * delta.r);
    const g = (curveP * start.g) + (p * delta.g);
    const b = (curveP * start.b) + (p * delta.b);
    const a = (curveP * start.a) + (p * delta.a);
    this._target[key] = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`;
  }

  return this;
};

/**
 * `_setupTween` - function to set up tween if needed.
 */
DeltaClass._setupTween = function () {
  const { tweenOptions } = this._delta;
  // set up tween if `tweenOptions` is set
  if (tweenOptions === undefined) { return; }

  // create tween with tween options
  this.tween = new Tween(Object.assign({}, tweenOptions, {
    index: this.index,
    // send `onUpdate` function to call the `this.update` function
    // and envoke previous `onUpdate`
    onUpdate: (ep, p, isForward) => {
      this.update(ep, p, isForward);
      // envoke old `onUpdate` if is present
      if (tweenOptions.onUpdate !== undefined) {
        tweenOptions.onUpdate(ep, p, isForward);
      }
    },
  }));
};

/**
 * `_declareDefaults` - function to declare defaults.
 *
 * @extends @ClassProto
 * @private
 */
DeltaClass._declareDefaults = function () {
  this._defaults = {
    key: null,
    object: null,
    customProperties: {},
    target: null,
    supportProps: null,
  };
};

/**
 * `_parseDelta` - function to parse delta.
 *
 * @private
 */
DeltaClass._parseDelta = function () {
  const { key, customProperties } = this._props;
  const record = customProperties[key];

  return (record != null && record.type != null)
      ? this._parseByCustom()
      : this._parseByGuess();
};

/**
 * `_parseByGuess` - function to parse delta by guess.
 *
 * @private
 */
DeltaClass._parseByGuess = function () {
  const { key, object } = this._props;
  const split = this._getSplit(object);
  // try to parse `start`/`end` as colors first, if ok - this is a color delta
  const startColor = parseColorToRgba(split.start);
  const endColor = parseColorToRgba(split.end);
  if (!startColor.isError && !endColor.isError) {
    this._delta = parseColor(key, split);
    return;
  }
  // convert the delta properties to string and check if unit is present
  const isUnit = `${split.start}`.match(unitsRegexp) ||
                 `${split.end}`.toString().match(unitsRegexp);

  // parse regarding unit presence
  const parseType = (isUnit) ? 'unit' : 'number';
  this._delta = parsersMap[parseType](key, split);
};

/**
 * `_parseByCustom` - function to parse delta with help of customProperties.
 *
 * @private
 */
DeltaClass._parseByCustom = function () {
  const { key, object, customProperties } = this._props;

  const customProperty = customProperties[key];
  const { type } = customProperty;

  this._delta = parsersMap[type](key, this._getSplit(object));
};

/**
 * `_getSplit` - function to get options split
 *               and parse `stagger` in `start`/`end` properties.
 *
 * @param {Object} Object to split.
 * @return {Object} Split.
 */
DeltaClass._getSplit = function (object) {
  const split = splitDelta(object);
  // parse the `stagger` in `start`/`end` delta properties
  split.start = parseStaggerProperty(split.start, this.index, this._totalItemsInStagger);
  split.end = parseStaggerProperty(split.end, this.index, this._totalItemsInStagger);

  return split;
};

export const Delta = createClass(DeltaClass);

export default Delta;
