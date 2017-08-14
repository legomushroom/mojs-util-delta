import ClassProto from 'mojs-util-class-proto';
import easing from 'mojs-easing';

import Delta from '../src/delta.babel.js';
import { parseNumber } from '../src/parse-number.babel.js';
import { parseUnit } from '../src/parse-unit.babel.js';
import { parseColor } from '../src/parse-color.babel.js';
import { splitDelta } from '../src/split-delta.babel.js';

const staggerStep = (base, step) => {
  const result = (i, total) => {
    return base + (i*step);
  };

  result.__mojs__isStaggerFunction = true;

  return result;
}

var key = 'x';
var options = {
  '5': 10, duration: 200
};

describe('`delta` ->', function () {
  describe('extension ->', function() {
    it('should extend `ClassProto`', function () {
      var delta = Delta({ key: key, object: options });
      expect(ClassProto.__mojsClass.isPrototypeOf(delta)).toBe(true);
    });

    it('should have defaults', function () {
      var delta = Delta({ key: key, object: options });
      expect(delta._defaults.key).toBe(null);
      expect(delta._defaults.object).toBe(null);
      expect(delta._defaults.customProperties).toEqual({});
    });

    it('should decide target #target', function () {
      var target = {};
      var delta = Delta({ key: key, object: options, target: target });
      expect(delta._target).toBe(target);
    });

    it('should decide target #supportProps', function () {
      var customProperties = {};
      customProperties[key] = {
        type: 'unit',
        isSkipRender: true
      };

      var target = {};
      var supportProps = {};
      var delta = Delta({
        key: key,
        object: options,
        target: target,
        customProperties: customProperties,
        supportProps: supportProps
      });
      expect(delta._target).toBe(supportProps);
    });
  });

  describe('delta parsing ->', function() {
    it('should parse delta according to custom properties', function () {
      const customProperties = {
        x: {
          type: 'unit',
          default: 0
        }
      }
      var key = 'x';
      var options = {
        '20': 30, duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        customProperties: customProperties
      });

      expect(delta._delta).toEqual(parseUnit(key, splitDelta(options)));
    });

    it('should parse delta according to custom properties #number', function () {
      const customProperties = {
        x: {
          type: 'number',
          default: 0
        }
      }
      var key = 'x';
      var options = {
        '20': 30, duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        customProperties: customProperties
      });

      expect(delta._delta).toEqual(parseNumber(key, splitDelta(options)));
    });

    it('should parse delta according to custom properties #color', function () {
      const customProperties = {
        x: {
          type: 'color',
          default: 'cyan'
        }
      }
      var key = 'x';
      var options = {
        '20': 30,
        duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        customProperties: customProperties
      });

      expect(delta._delta).toEqual(parseColor(key, splitDelta(options)));
    });

    it('should parse delta according to custom properties #without type', function () {
      const customProperties = {
        x: {
          isSkipRender: true
        }
      }
      var key = 'x';
      var options = {
        '20': 30, duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        customProperties: customProperties
      });

      expect(delta._delta).toEqual(parseNumber(key, splitDelta(options)));
    });

    it('should parse delta #number', function () {
      var key = 'x';
      var options = {
        '20': 30, duration: 2000
      };

      var delta = Delta({ key: key, object: options });
      expect(delta._delta).toEqual(parseNumber(key, splitDelta(options)));
    });

    it('should parse delta #unit', function () {
      var key = 'y';
      var options = {
        '20': '30rem',
        delay: 200
      };

      var delta = Delta({ key: key, object: options });
      expect(delta._delta).toEqual(parseUnit(key, splitDelta(options)));
    });

    it('should parse delta #color', function () {
      var key = 'y';
      var options = {
        'cyan': 'rgba(230, 17, 1, .35)',
        delay: 200
      };

      var delta = Delta({ key: key, object: options, isIt: 1 });
      expect(delta._delta).toEqual(parseColor(key, splitDelta(options)));
    });

    it('should parse delta #from #to', function () {
      var key = 'x';
      var options = {
        from: 20,
        to: 30,
        duration: 2000
      };

      var delta = Delta({ key: key, object: options });
      expect(delta._delta).toEqual(parseNumber(key, splitDelta(options)));
    });

    it('should parse stagger #custom', function () {
      const customProperties = {
        x: {
          type: 'number',
          default: 0
        }
      }
      var key = 'x';
      var index = 3;
      var options = {
        2: staggerStep(25, 200),
        duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        customProperties: customProperties,
        index: index,
      });

      expect(delta._delta.start).toBe(2);
      expect(delta._delta.end).toBe(25 + index*200);
    });

    it('should parse stagger delta #number', function () {
      var key = 'x';
      var index = 2;
      var options = {
        3: staggerStep(200, 300),
        duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        index: index,
      });
      expect(delta._delta.start).toBe(3);
      expect(delta._delta.end).toBe(200 + 300*index);
    });

    it('should parse `path` easing', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': 30,
        duration: 2000,
        curve: 'M0,100 L100, 0'
      };
      var delta = Delta({ key: key, object: options, target: target });

      expect(typeof delta._delta.curve).toBe('function');
      expect(delta._delta.curve(.5)).toBeCloseTo(.5, 3);
    });
  });

  describe('update ->', function() {
    it('should be set accirding to delta type #number', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': 30,
        duration: 2000
      };
      var delta = Delta({ key: key, object: options, target: target });
      expect(delta.update).toBe(delta._upd_number);
    });

    it('should be set accirding to delta type #unit', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30%',
        duration: 2000
      };
      var delta = Delta({ key: key, object: options, target: target });
      expect(delta.update).toBe(delta._upd_unit);
    });

    it('should be set accirding to delta type #color', function () {
      var key = 'z';
      var target = {};
      var options = {
        'cyan': 'yellow',
        duration: 2000
      };
      var delta = Delta({ key: key, object: options, target: target });
      expect(delta.update).toBe(delta._upd_color);
    });
  });

  describe('`_upd_number` function ->', function() {
    it('should set current delta state', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': 30,
        duration: 2000
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .5;
      delta._upd_number(progress, progress, true, false);

      expect(target[key]).toBe(25);
    });

    it('should set current delta state regarding curve', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': 30,
        duration: 2000,
        curve: easing.pow(3).out
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .5;
      delta._upd_number(progress, progress, true, false);

      expect(target[key]).toBe(easing.pow(3).out(progress)*20 + progress*10);
    });

    it('should return `this`', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem', curve: easing.pow(3).in
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .75;
      const result = delta._upd_number(progress, progress, true, false);

      expect(result).toBe(delta);
    });
  });

  describe('`_upd_unit` function ->', function() {
    it('should set current delta state', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30%', duration: 2000
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .25;
      delta._upd_unit(progress, progress, true, false);

      expect(target[key]).toBe((20 + progress*10) + '%');
    });
    it('should set current delta state regarding curve', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem', curve: easing.pow(3).in
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .75;
      delta._upd_unit(progress, progress, true, false);

      expect(target[key]).toBe((easing.pow(3).in(progress)*20 + progress*10) + 'rem');
    });

    it('should return `this`', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem', curve: easing.pow(3).out
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .75;
      const result = delta._upd_unit(progress, progress, true, false);

      expect(result).toBe(delta);
    });
  });

  describe('`_upd_color` function ->', function() {
    it('should set current delta state', function () {
      var key = 'z';
      var target = {};
      var options = {
        'cyan': 'hotpink',
        duration: 2000
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .5;
      delta._upd_color(progress, progress, true, false);

      expect(target[key]).toBe('rgba(127, 180, 217, 1)');
    });
    it('should set current delta state regarding curve', function () {
      var key = 'z';
      var target = {};
      var options = {
        'deeppink': 'yellow',
        duration: 2000,
        curve: easing.pow(2).out
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .5;
      delta._upd_color(progress, progress, true, false);

      expect(target[key]).toBe('rgba(191, 132, 36, 0.75)');
    });

    it('should return `this`', function () {
      var key = 'z';
      var target = {};
      var options = {
        'purple': 'rgba(0, 20, 12, 1)', curve: 'M0, 100 L100, 0'
      };
      var delta = Delta({ key: key, object: options, target: target });

      var progress = .75;
      const result = delta._upd_color(progress, progress, true, false);

      expect(result).toBe(delta);
    });
  });

  describe('tween creation ->', function() {
    it('should create tween if any tween property is used', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem', duration: 2000
      };

      var delta = Delta({ key: key, object: options });

      expect(delta.tween).toBeDefined();
      expect(delta.tween._props.duration).toBe(options.duration);
    });

    it('should pass `update` as `onUpdate` callback', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem', duration: 2000
      };

      var delta = Delta({ key: key, object: options });

      spyOn(delta, 'update');

      var progress = Math.random();
      var isForward = true;
      delta.tween._props.onUpdate(progress, progress, isForward);

      expect(delta.update).toHaveBeenCalledWith(progress, progress, isForward);
    });

    it('should call previous `onUpdate`', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem',
        duration: 2000,
        onUpdate: function() {}
      };

      var delta = Delta({ key: key, object: options, target: target });

      spyOn(delta._delta.tweenOptions, 'onUpdate');

      var progress = Math.random();
      var isForward = true;

      delta.tween._props.onUpdate(progress, progress, isForward);
      expect(delta._delta.tweenOptions.onUpdate).toHaveBeenCalledWith(progress, progress, isForward);
    });

    it('should not create tween if no tween property is used', function () {
      var key = 'z';
      var target = {};
      var options = {
        '20': '30rem'
      };

      var delta = Delta({ key: key, object: options });
      expect(delta.tween).not.toBeDefined();
    });

    it('should pass `index`', function () {
      var index = parseInt(Math.random()*10, 10);
      var target = {};
      var options = {
        '20': '30rem',
        duration: 2000
      };

      var delta = Delta({
        key: key,
        object: options,
        index: index
      });

      expect(delta.tween.index).toBe(index);
    });

  });

  describe('`index` ->', function() {
    it('should get index from options', function () {
      var index = parseInt(Math.random()*10);
      var delta = Delta({
        key: 'z',
        object: { '20': '30%', duration: 2000 },
        target: {},
        index: index
      });

      delta._parseDelta();

      expect(delta.index).toBe(index);
    });

    it('should fallback to `0`', function () {
      var delta = Delta({
        key: 'z',
        object: { '20': '30%', duration: 2000 },
        target: {}
      });

      delta._parseDelta();

      expect(delta.index).toBe(0);
    });

    it('should fallback to `0`', function () {
      var delta = Delta({
        key: 'z',
        object: { '20': '30%', duration: 2000 },
        target: {}
      });

      delta._parseDelta();

      expect(delta.index).toBe(0);
      expect(delta._o.index).not.toBeDefined();
      expect(delta._props.index).not.toBeDefined();
    });
  });

});
