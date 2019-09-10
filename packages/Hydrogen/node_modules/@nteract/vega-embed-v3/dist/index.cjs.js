'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var d3Request = require('d3-request');
var d3Dsv = require('d3-dsv');
var topojsonClient = require('topojson-client');
var d3TimeFormat = require('d3-time-format');
var d3Array = require('d3-array');
var d3Shape = require('d3-shape');
var d3Path = require('d3-path');
var $ = require('d3-scale');
var $$1 = require('d3-interpolate');
var _ = require('d3-scale-chromatic');
var d3Time = require('d3-time');
var d3Format = require('d3-format');
var d3Contour = require('d3-contour');
var d3Geo = require('d3-geo');
var d3Force = require('d3-force');
var d3Collection = require('d3-collection');
var d3Hierarchy = require('d3-hierarchy');
var d3Voronoi = require('d3-voronoi');
var d3Color = require('d3-color');
var tslib_1 = require('tslib');
var stableStringify = _interopDefault(require('json-stable-stringify'));
var d3 = require('d3-selection');
var stringify = _interopDefault(require('json-stringify-pretty-compact'));
var semver = require('semver');

function accessor(fn, fields, name) {
  fn.fields = fields || [];
  fn.fname = name;
  return fn;
}
function accessorName(fn) {
  return fn == null ? null : fn.fname;
}
function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}

function error(message) {
  throw Error(message);
}

function splitAccessPath(p) {
  var path = [],
      q = null,
      b = 0,
      n = p.length,
      s = '',
      i, j, c;
  p = p + '';
  function push() {
    path.push(s + p.substring(i, j));
    s = '';
    i = j + 1;
  }
  for (i=j=0; j<n; ++j) {
    c = p[j];
    if (c === '\\') {
      s += p.substring(i, j);
      i = ++j;
    } else if (c === q) {
      push();
      q = null;
      b = -1;
    } else if (q) {
      continue;
    } else if (i === b && c === '"') {
      i = j + 1;
      q = c;
    } else if (i === b && c === "'") {
      i = j + 1;
      q = c;
    } else if (c === '.' && !b) {
      if (j > i) {
        push();
      } else {
        i = j + 1;
      }
    } else if (c === '[') {
      if (j > i) push();
      b = i = j + 1;
    } else if (c === ']') {
      if (!b) error('Access path missing open bracket: ' + p);
      if (b > 0) push();
      b = 0;
      i = j + 1;
    }
  }
  if (b) error('Access path missing closing bracket: ' + p);
  if (q) error('Access path missing closing quote: ' + p);
  if (j > i) {
    j++;
    push();
  }
  return path;
}

var isArray = Array.isArray;

function isObject(_$$1) {
  return _$$1 === Object(_$$1);
}

function isString(_$$1) {
  return typeof _$$1 === 'string';
}

function $$2(x) {
  return isArray(x) ? '[' + x.map($$2) + ']'
    : isObject(x) || isString(x) ?
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

function field(field, name) {
  var path = splitAccessPath(field),
      code = 'return _[' + path.map($$2).join('][') + '];';
  return accessor(
    Function('_', code),
    [(field = path.length===1 ? path[0] : field)],
    name || field
  );
}

var empty = [];
var id = field('id');
var identity = accessor(function(_$$1) { return _$$1; }, empty, 'identity');
var zero = accessor(function() { return 0; }, empty, 'zero');
var one = accessor(function() { return 1; }, empty, 'one');
var truthy = accessor(function() { return true; }, empty, 'true');
var falsy = accessor(function() { return false; }, empty, 'false');

function log(method, level, input) {
  var msg = [level].concat([].slice.call(input));
  console[method](...msg);
}
var None  = 0;
var Error$1 = 1;
var Warn  = 2;
var Info  = 3;
var Debug = 4;
function logger(_$$1, method) {
  var level = _$$1 || None;
  return {
    level: function(_$$1) {
      if (arguments.length) {
        level = +_$$1;
        return this;
      } else {
        return level;
      }
    },
    error: function() {
      if (level >= Error$1) log(method || 'error', 'ERROR', arguments);
      return this;
    },
    warn: function() {
      if (level >= Warn) log(method || 'warn', 'WARN', arguments);
      return this;
    },
    info: function() {
      if (level >= Info) log(method || 'log', 'INFO', arguments);
      return this;
    },
    debug: function() {
      if (level >= Debug) log(method || 'log', 'DEBUG', arguments);
      return this;
    }
  }
}

function peek(array) {
  return array[array.length - 1];
}

function toNumber(_$$1) {
  return _$$1 == null || _$$1 === '' ? null : +_$$1;
}

function exp(sign) {
  return function(x) { return sign * Math.exp(x); };
}
function log$1(sign) {
  return function(x) { return Math.log(sign * x); };
}
function symlog(c) {
  return function(x) { return Math.sign(x) * Math.log1p(Math.abs(x / c)); };
}
function symexp(c) {
  return function(x) { return Math.sign(x) * Math.expm1(Math.abs(x)) * c; };
}
function pow(exponent) {
  return function(x) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  };
}
function pan(domain, delta, lift, ground) {
  var d0 = lift(domain[0]),
      d1 = lift(peek(domain)),
      dd = (d1 - d0) * delta;
  return [
    ground(d0 - dd),
    ground(d1 - dd)
  ];
}
function panLinear(domain, delta) {
  return pan(domain, delta, toNumber, identity);
}
function panLog(domain, delta) {
  var sign = Math.sign(domain[0]);
  return pan(domain, delta, log$1(sign), exp(sign));
}
function panPow(domain, delta, exponent) {
  return pan(domain, delta, pow(exponent), pow(1/exponent));
}
function panSymlog(domain, delta, constant) {
  return pan(domain, delta, symlog(constant), symexp(constant));
}
function zoom(domain, anchor, scale, lift, ground) {
  var d0 = lift(domain[0]),
      d1 = lift(peek(domain)),
      da = anchor != null ? lift(anchor) : (d0 + d1) / 2;
  return [
    ground(da + (d0 - da) * scale),
    ground(da + (d1 - da) * scale)
  ];
}
function zoomLinear(domain, anchor, scale) {
  return zoom(domain, anchor, scale, toNumber, identity);
}
function zoomLog(domain, anchor, scale) {
  var sign = Math.sign(domain[0]);
  return zoom(domain, anchor, scale, log$1(sign), exp(sign));
}
function zoomPow(domain, anchor, scale, exponent) {
  return zoom(domain, anchor, scale, pow(exponent), pow(1/exponent));
}
function zoomSymlog(domain, anchor, scale, constant) {
  return zoom(domain, anchor, scale, symlog(constant), symexp(constant));
}

function quarter(date) {
  return 1 + ~~(new Date(date).getMonth() / 3);
}
function utcquarter(date) {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}

function array(_$$1) {
  return _$$1 != null ? (isArray(_$$1) ? _$$1 : [_$$1]) : [];
}

function clampRange(range, min, max) {
  var lo = range[0],
      hi = range[1],
      span;
  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;
  return span >= (max - min)
    ? [min, max]
    : [
        (lo = Math.min(Math.max(lo, min), max - span)),
        lo + span
      ];
}

function isFunction(_$$1) {
  return typeof _$$1 === 'function';
}

function compare(fields, orders) {
  var idx = [],
      cmp = (fields = array(fields)).map(function(f, i) {
        if (f == null) {
          return null;
        } else {
          idx.push(i);
          return isFunction(f) ? f
            : splitAccessPath(f).map($$2).join('][');
        }
      }),
      n = idx.length - 1,
      ord = array(orders),
      code = 'var u,v;return ',
      i, j, f, u, v, d, t, lt, gt;
  if (n < 0) return null;
  for (j=0; j<=n; ++j) {
    i = idx[j];
    f = cmp[i];
    if (isFunction(f)) {
      d = 'f' + i;
      u = '(u=this.' + d + '(a))';
      v = '(v=this.' + d + '(b))';
      (t = t || {})[d] = f;
    } else {
      u = '(u=a['+f+'])';
      v = '(v=b['+f+'])';
    }
    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';
    if (ord[i] !== 'descending') {
      gt = 1;
      lt = -1;
    } else {
      gt = -1;
      lt = 1;
    }
    code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
      + ':(u>v||v==null)&&u!=null?' + gt
      + ':'+d+'!==u&&v===v?' + lt
      + ':v!==v&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }
  f = Function('a', 'b', code + ';');
  if (t) f = f.bind(t);
  fields = fields.reduce(function(map, field) {
    if (isFunction(field)) {
      (accessorFields(field) || []).forEach(function(_$$1) { map[_$$1] = 1; });
    } else if (field != null) {
      map[field + ''] = 1;
    }
    return map;
  }, {});
  return accessor(f, Object.keys(fields));
}

function constant(_$$1) {
  return isFunction(_$$1) ? _$$1 : function() { return _$$1; };
}

function debounce(delay, handler) {
  var tid, evt;
  function callback() {
    handler(evt);
    tid = evt = null;
  }
  return function(e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  };
}

function extend(_$$1) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _$$1[k] = x[k]; }
  }
  return _$$1;
}

function extent(array, f) {
  var i = 0, n, v, min, max;
  if (array && (n = array.length)) {
    if (f == null) {
      for (v = array[i]; v == null || v !== v; v = array[++i]);
      min = max = v;
      for (; i<n; ++i) {
        v = array[i];
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    } else {
      for (v = f(array[i]); v == null || v !== v; v = f(array[++i]));
      min = max = v;
      for (; i<n; ++i) {
        v = f(array[i]);
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
  }
  return [min, max];
}

function extentIndex(array, f) {
  var i = -1,
      n = array.length,
      a, b, c, u, v;
  if (f == null) {
    while (++i < n) {
      b = array[i];
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    u = v = i;
    while (++i < n) {
      b = array[i];
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  } else {
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    u = v = i;
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  }
  return [u, v];
}

var NULL = {};
function fastmap(input) {
  var obj = {},
      map,
      test;
  function has(key) {
    return obj.hasOwnProperty(key) && obj[key] !== NULL;
  }
  map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get: function(key) {
      return has(key) ? obj[key] : undefined;
    },
    set: function(key, value) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete: function(key) {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear: function() {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test: function(_$$1) {
      if (arguments.length) {
        test = _$$1;
        return map;
      } else {
        return test;
      }
    },
    clean: function() {
      var next = {},
          size = 0,
          key, value;
      for (key in obj) {
        value = obj[key];
        if (value !== NULL && (!test || !test(value))) {
          next[key] = value;
          ++size;
        }
      }
      map.size = size;
      map.empty = 0;
      map.object = (obj = next);
    }
  };
  if (input) Object.keys(input).forEach(function(key) {
    map.set(key, input[key]);
  });
  return map;
}

function flush(range, value, threshold, left, right, center) {
  if (!threshold && threshold !== 0) return center;
  var a = range[0],
      b = peek(range),
      t = +threshold,
      l, r;
  if (b < a) {
    l = a; a = b; b = l;
  }
  l = Math.abs(value - a);
  r = Math.abs(b - value);
  return l < r && l <= t ? left : r <= t ? right : center;
}

function inherits(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

function inrange(value, range, left, right) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  left = left === undefined || left;
  right = right === undefined || right;
  return (left ? r0 <= value : r0 < value) &&
    (right ? value <= r1 : value < r1);
}

function isBoolean(_$$1) {
  return typeof _$$1 === 'boolean';
}

function isDate(_$$1) {
  return Object.prototype.toString.call(_$$1) === '[object Date]';
}

function isNumber(_$$1) {
  return typeof _$$1 === 'number';
}

function isRegExp(_$$1) {
  return Object.prototype.toString.call(_$$1) === '[object RegExp]';
}

function key(fields, flat) {
  if (fields) {
    fields = flat
      ? array(fields).map(function(f) { return f.replace(/\\(.)/g, '$1'); })
      : array(fields);
  }
  var fn = !(fields && fields.length)
    ? function() { return ''; }
    : Function('_', 'return \'\'+' +
        fields.map(function(f) {
          return '_[' + (flat
              ? $$2(f)
              : splitAccessPath(f).map($$2).join('][')
            ) + ']';
        }).join('+\'|\'+') + ';');
  return accessor(fn, fields, 'key');
}

function lerp(array, frac) {
  const lo = array[0],
        hi = peek(array),
        f = +frac;
  return !f ? lo : f === 1 ? hi : lo + f * (hi - lo);
}

function merge(compare, array0, array1, output) {
  var n0 = array0.length,
      n1 = array1.length;
  if (!n1) return array0;
  if (!n0) return array1;
  var merged = output || new array0.constructor(n0 + n1),
      i0 = 0, i1 = 0, i = 0;
  for (; i0<n0 && i1<n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0
       ? array1[i1++]
       : array0[i0++];
  }
  for (; i0<n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }
  for (; i1<n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }
  return merged;
}

function repeat(str, reps) {
  var s = '';
  while (--reps >= 0) s += str;
  return s;
}

function pad(str, length, padchar, align) {
  var c = padchar || ' ',
      s = str + '',
      n = length - s.length;
  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
}

function span(array) {
  return (peek(array) - array[0]) || 0;
}

function toBoolean(_$$1) {
  return _$$1 == null || _$$1 === '' ? null : !_$$1 || _$$1 === 'false' || _$$1 === '0' ? false : !!_$$1;
}

function defaultParser(_$$1) {
  return isNumber(_$$1) ? _$$1 : isDate(_$$1) ? _$$1 : Date.parse(_$$1);
}
function toDate(_$$1, parser) {
  parser = parser || defaultParser;
  return _$$1 == null || _$$1 === '' ? null : parser(_$$1);
}

function toString(_$$1) {
  return _$$1 == null || _$$1 === '' ? null : _$$1 + '';
}

function toSet(_$$1) {
  for (var s={}, i=0, n=_$$1.length; i<n; ++i) s[_$$1[i]] = true;
  return s;
}

function truncate(str, length, align, ellipsis) {
  var e = ellipsis != null ? ellipsis : '\u2026',
      s = str + '',
      n = s.length,
      l = Math.max(0, length - e.length);
  return n <= length ? s
    : align === 'left' ? e + s.slice(n - l)
    : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
    : s.slice(0, l) + e;
}

function visitArray(array, filter, visitor) {
  if (array) {
    var i = 0, n = array.length, t;
    if (filter) {
      for (; i<n; ++i) {
        if (t = filter(array[i])) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}

function UniqueList(idFunc) {
  var $$$1 = idFunc || identity,
      list = [],
      ids = {};
  list.add = function(_$$1) {
    var id$$1 = $$$1(_$$1);
    if (!ids[id$$1]) {
      ids[id$$1] = 1;
      list.push(_$$1);
    }
    return list;
  };
  list.remove = function(_$$1) {
    var id$$1 = $$$1(_$$1), idx;
    if (ids[id$$1]) {
      ids[id$$1] = 0;
      if ((idx = list.indexOf(_$$1)) >= 0) {
        list.splice(idx, 1);
      }
    }
    return list;
  };
  return list;
}

var TUPLE_ID_KEY = Symbol('vega_id'),
    TUPLE_ID = 1;
function isTuple(t) {
  return !!(t && tupleid(t));
}
function tupleid(t) {
  return t[TUPLE_ID_KEY];
}
function setid(t, id) {
  t[TUPLE_ID_KEY] = id;
  return t;
}
function ingest(datum) {
  var t = (datum === Object(datum)) ? datum : {data: datum};
  return tupleid(t) ? t : setid(t, TUPLE_ID++);
}
function derive(t) {
  return rederive(t, ingest({}));
}
function rederive(t, d) {
  for (var k in t) d[k] = t[k];
  return d;
}
function replace(t, d) {
  return setid(d, tupleid(t));
}

function isChangeSet(v) {
  return v && v.constructor === changeset;
}
function changeset() {
  var add = [],
      rem = [],
      mod = [],
      remp = [],
      modp = [],
      reflow = false;
  return {
    constructor: changeset,
    insert: function(t) {
      var d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) add.push(d[i]);
      return this;
    },
    remove: function(t) {
      var a = isFunction(t) ? remp : rem,
          d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) a.push(d[i]);
      return this;
    },
    modify: function(t, field$$1, value) {
      var m = {field: field$$1, value: constant(value)};
      if (isFunction(t)) {
        m.filter = t;
        modp.push(m);
      } else {
        m.tuple = t;
        mod.push(m);
      }
      return this;
    },
    encode: function(t, set) {
      if (isFunction(t)) modp.push({filter: t, field: set});
      else mod.push({tuple: t, field: set});
      return this;
    },
    reflow: function() {
      reflow = true;
      return this;
    },
    pulse: function(pulse, tuples) {
      var out, i, n, m, f, t, id$$1;
      for (i=0, n=add.length; i<n; ++i) {
        pulse.add.push(ingest(add[i]));
      }
      for (out={}, i=0, n=rem.length; i<n; ++i) {
        t = rem[i];
        out[tupleid(t)] = t;
      }
      for (i=0, n=remp.length; i<n; ++i) {
        f = remp[i];
        tuples.forEach(function(t) {
          if (f(t)) out[tupleid(t)] = t;
        });
      }
      for (id$$1 in out) pulse.rem.push(out[id$$1]);
      function modify(t, f, v) {
        if (v) t[f] = v(t); else pulse.encode = f;
        if (!reflow) out[tupleid(t)] = t;
      }
      for (out={}, i=0, n=mod.length; i<n; ++i) {
        m = mod[i];
        modify(m.tuple, m.field, m.value);
        pulse.modifies(m.field);
      }
      for (i=0, n=modp.length; i<n; ++i) {
        m = modp[i];
        f = m.filter;
        tuples.forEach(function(t) {
          if (f(t)) modify(t, m.field, m.value);
        });
        pulse.modifies(m.field);
      }
      if (reflow) {
        pulse.mod = rem.length || remp.length
          ? tuples.filter(function(t) { return out.hasOwnProperty(tupleid(t)); })
          : tuples.slice();
      } else {
        for (id$$1 in out) pulse.mod.push(out[id$$1]);
      }
      return pulse;
    }
  };
}

var CACHE = '_:mod:_';
function Parameters() {
  Object.defineProperty(this, CACHE, {writable:true, value: {}});
}
var prototype = Parameters.prototype;
prototype.set = function(name, index, value, force) {
  var o = this,
      v = o[name],
      mod = o[CACHE];
  if (index != null && index >= 0) {
    if (v[index] !== value || force) {
      v[index] = value;
      mod[index + ':' + name] = -1;
      mod[name] = -1;
    }
  } else if (v !== value || force) {
    o[name] = value;
    mod[name] = isArray(value) ? 1 + value.length : -1;
  }
  return o;
};
prototype.modified = function(name, index) {
  var mod = this[CACHE], k;
  if (!arguments.length) {
    for (k in mod) { if (mod[k]) return true; }
    return false;
  } else if (isArray(name)) {
    for (k=0; k<name.length; ++k) {
      if (mod[name[k]]) return true;
    }
    return false;
  }
  return (index != null && index >= 0)
    ? (index + 1 < mod[name] || !!mod[index + ':' + name])
    : !!mod[name];
};
prototype.clear = function() {
  this[CACHE] = {};
  return this;
};

var OP_ID = 0;
var PULSE = 'pulse';
var NO_PARAMS = new Parameters();
var SKIP     = 1,
    MODIFIED = 2;
function Operator(init, update, params, react) {
  this.id = ++OP_ID;
  this.value = init;
  this.stamp = -1;
  this.rank = -1;
  this.qrank = -1;
  this.flags = 0;
  if (update) {
    this._update = update;
  }
  if (params) this.parameters(params, react);
}
var prototype$1 = Operator.prototype;
prototype$1.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};
prototype$1.set = function(value) {
  if (this.value !== value) {
    this.value = value;
    return 1;
  } else {
    return 0;
  }
};
function flag(bit) {
  return function(state) {
    var f = this.flags;
    if (arguments.length === 0) return !!(f & bit);
    this.flags = state ? (f | bit) : (f & ~bit);
    return this;
  };
}
prototype$1.skip = flag(SKIP);
prototype$1.modified = flag(MODIFIED);
prototype$1.parameters = function(params, react) {
  react = react !== false;
  var self = this,
      argval = (self._argval = self._argval || new Parameters()),
      argops = (self._argops = self._argops || []),
      deps = [],
      name, value, n, i;
  function add(name, index, value) {
    if (value instanceof Operator) {
      if (value !== self) {
        if (react) value.targets().add(self);
        deps.push(value);
      }
      argops.push({op:value, name:name, index:index});
    } else {
      argval.set(name, index, value);
    }
  }
  for (name in params) {
    value = params[name];
    if (name === PULSE) {
      array(value).forEach(function(op) {
        if (!(op instanceof Operator)) {
          error('Pulse parameters must be operator instances.');
        } else if (op !== self) {
          op.targets().add(self);
          deps.push(op);
        }
      });
      self.source = value;
    } else if (isArray(value)) {
      argval.set(name, -1, Array(n = value.length));
      for (i=0; i<n; ++i) add(name, i, value[i]);
    } else {
      add(name, -1, value);
    }
  }
  this.marshall().clear();
  return deps;
};
prototype$1.marshall = function(stamp) {
  var argval = this._argval || NO_PARAMS,
      argops = this._argops, item, i, n, op, mod;
  if (argops && (n = argops.length)) {
    for (i=0; i<n; ++i) {
      item = argops[i];
      op = item.op;
      mod = op.modified() && op.stamp === stamp;
      argval.set(item.name, item.index, op.value, mod);
    }
  }
  return argval;
};
prototype$1.evaluate = function(pulse) {
  if (this._update) {
    var params = this.marshall(pulse.stamp),
        v = this._update(params, pulse);
    params.clear();
    if (v !== this.value) {
      this.value = v;
    } else if (!this.modified()) {
      return pulse.StopPropagation;
    }
  }
};
prototype$1.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv;
  if (this.skip()) {
    this.skip(false);
    rv = 0;
  } else {
    rv = this.evaluate(pulse);
  }
  this.stamp = pulse.stamp;
  this.pulse = rv;
  return rv || pulse;
};

function add(init, update, params, react) {
  var shift = 1,
    op;
  if (init instanceof Operator) {
    op = init;
  } else if (init && init.prototype instanceof Operator) {
    op = new init();
  } else if (isFunction(init)) {
    op = new Operator(null, init);
  } else {
    shift = 0;
    op = new Operator(init, update);
  }
  this.rank(op);
  if (shift) {
    react = params;
    params = update;
  }
  if (params) this.connect(op, op.parameters(params, react));
  this.touch(op);
  return op;
}

function connect(target, sources) {
  var targetRank = target.rank, i, n;
  for (i=0, n=sources.length; i<n; ++i) {
    if (targetRank < sources[i].rank) {
      this.rerank(target);
      return;
    }
  }
}

var STREAM_ID = 0;
function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}
function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}
var prototype$2 = EventStream.prototype;
prototype$2._filter = truthy;
prototype$2._apply = identity;
prototype$2.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};
prototype$2.consume = function(_$$1) {
  if (!arguments.length) return !!this._consume;
  this._consume = !!_$$1;
  return this;
};
prototype$2.receive = function(evt) {
  if (this._filter(evt)) {
    var val = (this.value = this._apply(evt)),
        trg = this._targets,
        n = trg ? trg.length : 0,
        i = 0;
    for (; i<n; ++i) trg[i].receive(val);
    if (this._consume) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
};
prototype$2.filter = function(filter) {
  var s = stream(filter);
  this.targets().add(s);
  return s;
};
prototype$2.apply = function(apply) {
  var s = stream(null, apply);
  this.targets().add(s);
  return s;
};
prototype$2.merge = function() {
  var s = stream();
  this.targets().add(s);
  for (var i=0, n=arguments.length; i<n; ++i) {
    arguments[i].targets().add(s);
  }
  return s;
};
prototype$2.throttle = function(pause) {
  var t = -1;
  return this.filter(function() {
    var now = Date.now();
    if ((now - t) > pause) {
      t = now;
      return 1;
    } else {
      return 0;
    }
  });
};
prototype$2.debounce = function(delay) {
  var s = stream();
  this.targets().add(stream(null, null,
    debounce(delay, function(e) {
      var df = e.dataflow;
      s.receive(e);
      if (df && df.run) df.run();
    })
  ));
  return s;
};
prototype$2.between = function(a, b) {
  var active = false;
  a.targets().add(stream(null, null, function() { active = true; }));
  b.targets().add(stream(null, null, function() { active = false; }));
  return this.filter(function() { return active; });
};

function events(source, type, filter, apply) {
  var df = this,
      s = stream(filter, apply),
      send = function(e) {
        e.dataflow = df;
        try {
          s.receive(e);
        } catch (error$$1) {
          df.error(error$$1);
        } finally {
          df.run();
        }
      },
      sources;
  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array(source);
  }
  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }
  return s;
}

var protocol_re = /^([A-Za-z]+:)?\/\//;
var fileProtocol = 'file://';
var requestOptions = [
  'mimeType',
  'responseType',
  'user',
  'password'
];
function loader(options) {
  return {
    options: options || {},
    sanitize: sanitize,
    load: load,
    file: file,
    http: http
  };
}
function marshall(loader, options) {
  return extend({}, loader.options, options);
}
function load(uri, options) {
  var loader = this;
  return loader.sanitize(uri, options)
    .then(function(opt) {
      var url = opt.href;
      return opt.localFile
        ? loader.file(url)
        : loader.http(url, options);
    });
}
function sanitize(uri, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var result = {href: null},
        isFile, hasProtocol, loadFile, base;
    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + $$2(uri));
      return;
    }
    hasProtocol = protocol_re.test(uri);
    if ((base = options.baseURL) && !hasProtocol) {
      if (!startsWith(uri, '/') && base[base.length-1] !== '/') {
        uri = '/' + uri;
      }
      uri = base + uri;
    }
    loadFile = (isFile = startsWith(uri, fileProtocol))
      || options.mode === 'file'
      || options.mode !== 'http' && !hasProtocol && fs();
    if (isFile) {
      uri = uri.slice(fileProtocol.length);
    } else if (startsWith(uri, '//')) {
      if (options.defaultProtocol === 'file') {
        uri = uri.slice(2);
        loadFile = true;
      } else {
        uri = (options.defaultProtocol || 'http') + ':' + uri;
      }
    }
    Object.defineProperty(result, 'localFile', {value: !!loadFile});
    result.href = uri;
    if (options.target) {
      result.target = options.target + '';
    }
    accept(result);
  });
}
function http(url, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var req = d3Request.request(url),
        name;
    for (name in options.headers) {
      req.header(name, options.headers[name]);
    }
    requestOptions.forEach(function(name) {
      if (options[name]) req[name](options[name]);
    });
    req.on('error', function(error$$1) {
        reject(error$$1 || 'Error loading URL: ' + url);
      })
      .on('load', function(result) {
        var text = result && result.responseText;
        (!result || result.status === 0)
          ? reject(text || 'Error')
          : accept(text);
      })
      .get();
  });
}
function file(filename) {
  return new Promise(function(accept, reject) {
    var f = fs();
    f ? f.readFile(filename, function(error$$1, data) {
          if (error$$1) reject(error$$1);
          else accept(data);
        })
      : reject('No file system access for ' + filename);
  });
}
function fs() {
  var fs = typeof require === 'function' && require('fs');
  return fs && isFunction(fs.readFile) ? fs : null;
}
function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}

var typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number:  toNumber,
  date:    toDate,
  string:  toString,
  unknown: identity
};
var typeTests = [
  isBoolean$1,
  isInteger,
  isNumber$1,
  isDate$1
];
var typeList = [
  'boolean',
  'integer',
  'number',
  'date'
];
function inferType(values, field$$1) {
  if (!values || !values.length) return 'unknown';
  var tests = typeTests.slice(),
      value, i, n, j;
  for (i=0, n=values.length; i<n; ++i) {
    value = field$$1 ? values[i][field$$1] : values[i];
    for (j=0; j<tests.length; ++j) {
      if (isValid(value) && !tests[j](value)) {
        tests.splice(j, 1); --j;
      }
    }
    if (tests.length === 0) return 'string';
  }
  return typeList[typeTests.indexOf(tests[0])];
}
function inferTypes(data, fields) {
  return fields.reduce(function(types, field$$1) {
    types[field$$1] = inferType(data, field$$1);
    return types;
  }, {});
}
function isValid(_$$1) {
  return _$$1 != null && _$$1 === _$$1;
}
function isBoolean$1(_$$1) {
  return _$$1 === 'true' || _$$1 === 'false' || _$$1 === true || _$$1 === false;
}
function isDate$1(_$$1) {
  return !isNaN(Date.parse(_$$1));
}
function isNumber$1(_$$1) {
  return !isNaN(+_$$1) && !(_$$1 instanceof Date);
}
function isInteger(_$$1) {
  return isNumber$1(_$$1) && (_$$1=+_$$1) === ~~_$$1;
}

function delimitedFormat(delimiter) {
  return function(data, format) {
    var delim = {delimiter: delimiter};
    return dsv(data, format ? extend(format, delim) : delim);
  };
}
function dsv(data, format) {
  if (format.header) {
    data = format.header
      .map($$2)
      .join(format.delimiter) + '\n' + data;
  }
  return d3Dsv.dsvFormat(format.delimiter).parse(data+'');
}

function isBuffer(_$$1) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_$$1) : false;
}
function json(data, format) {
  var prop = (format && format.property) ? field(format.property) : identity;
  return isObject(data) && !isBuffer(data)
    ? parseJSON(prop(data))
    : prop(JSON.parse(data));
}
function parseJSON(data, format) {
  return (format && format.copy)
    ? JSON.parse(JSON.stringify(data))
    : data;
}

function topojson(data, format) {
  var method, object, property;
  data = json(data, format);
  method = (format && (property = format.feature)) ? topojsonClient.feature
    : (format && (property = format.mesh)) ? topojsonClient.mesh
    : error('Missing TopoJSON feature or mesh parameter.');
  object = (object = data.objects[property])
    ? method(data, object)
    : error('Invalid TopoJSON object: ' + property);
  return object && object.features || [object];
}

var formats = {
  dsv: dsv,
  csv: delimitedFormat(','),
  tsv: delimitedFormat('\t'),
  json: json,
  topojson: topojson
};
function formats$1(name, format) {
  if (arguments.length > 1) {
    formats[name] = format;
    return this;
  } else {
    return formats.hasOwnProperty(name) ? formats[name] : null;
  }
}

function read(data, schema, dateParse) {
  schema = schema || {};
  var reader = formats$1(schema.type || 'json');
  if (!reader) error('Unknown data format type: ' + schema.type);
  data = reader(data, schema);
  if (schema.parse) parse(data, schema.parse, dateParse);
  if (data.hasOwnProperty('columns')) delete data.columns;
  return data;
}
function parse(data, types, dateParse) {
  if (!data.length) return;
  dateParse = dateParse || d3TimeFormat.timeParse;
  var fields = data.columns || Object.keys(data[0]),
      parsers, datum, field$$1, i, j, n, m;
  if (types === 'auto') types = inferTypes(data, fields);
  fields = Object.keys(types);
  parsers = fields.map(function(field$$1) {
    var type = types[field$$1],
        parts, pattern;
    if (type && (type.indexOf('date:') === 0 || type.indexOf('utc:') === 0)) {
      parts = type.split(/:(.+)?/, 2);
      pattern = parts[1];
      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      }
      return parts[0] === 'utc' ? d3TimeFormat.utcParse(pattern) : dateParse(pattern);
    }
    if (!typeParsers[type]) {
      throw Error('Illegal format pattern: ' + field$$1 + ':' + type);
    }
    return typeParsers[type];
  });
  for (i=0, n=data.length, m=fields.length; i<n; ++i) {
    datum = data[i];
    for (j=0; j<m; ++j) {
      field$$1 = fields[j];
      datum[field$$1] = parsers[j](datum[field$$1]);
    }
  }
}

function ingest$1(target, data, format) {
  return this.pulse(target, this.changeset().insert(read(data, format)));
}
function loadPending(df) {
  var accept, reject,
      pending = new Promise(function(a, r) {
        accept = a;
        reject = r;
      });
  pending.requests = 0;
  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        try {
          df.run();
          accept(df);
        } catch (err) {
          reject(err);
        }
      });
    }
  };
  return (df._pending = pending);
}
function request(target, url, format) {
  var df = this,
      pending = df._pending || loadPending(df);
  pending.requests += 1;
  df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) { df.ingest(target, data, format); },
      function(error) { df.error('Loading failed', url, error); })
    .catch(
      function(error) { df.error('Data ingestion failed', url, error); })
    .then(pending.done, pending.done);
}

var SKIP$1 = {skip: true};
function on(source, target, update, params, options) {
  var fn = source instanceof Operator ? onOperator : onStream;
  fn(this, source, target, update, params, options);
  return this;
}
function onStream(df, stream, target, update, params, options) {
  var opt = extend({}, options, SKIP$1), func, op;
  if (!isFunction(target)) target = constant(target);
  if (update === undefined) {
    func = function(e) {
      df.touch(target(e));
    };
  } else if (isFunction(update)) {
    op = new Operator(null, update, params, false);
    func = function(e) {
      var v, t = target(e);
      op.evaluate(e);
      isChangeSet(v = op.value) ? df.pulse(t, v, options) : df.update(t, v, opt);
    };
  } else {
    func = function(e) {
      df.update(target(e), update, opt);
    };
  }
  stream.apply(func);
}
function onOperator(df, source, target, update, params, options) {
  var func, op;
  if (update === undefined) {
    op = target;
  } else {
    func = isFunction(update) ? update : constant(update);
    update = !target ? func : function(_$$1, pulse) {
      var value = func(_$$1, pulse);
      return target.skip()
        ? value
        : (target.skip(true).value = value);
    };
    op = new Operator(null, update, params, false);
    op.modified(options && options.force);
    op.rank = 0;
    if (target) {
      op.skip(true);
      op.value = target.value;
      op.targets().add(target);
    }
  }
  source.targets().add(op);
}

function rank(op) {
  op.rank = ++this._rank;
}
function rerank(op) {
  var queue = [op],
      cur, list, i;
  while (queue.length) {
    this.rank(cur = queue.pop());
    if (list = cur._targets) {
      for (i=list.length; --i >= 0;) {
        queue.push(cur = list[i]);
        if (cur === op) error('Cycle detected in dataflow graph.');
      }
    }
  }
}

var StopPropagation = {};
var ADD       = (1 << 0),
    REM       = (1 << 1),
    MOD       = (1 << 2),
    ADD_REM   = ADD | REM,
    ADD_MOD   = ADD | MOD,
    ALL       = ADD | REM | MOD,
    REFLOW    = (1 << 3),
    SOURCE    = (1 << 4),
    NO_SOURCE = (1 << 5),
    NO_FIELDS = (1 << 6);
function Pulse(dataflow, stamp, encode) {
  this.dataflow = dataflow;
  this.stamp = stamp == null ? -1 : stamp;
  this.add = [];
  this.rem = [];
  this.mod = [];
  this.fields = null;
  this.encode = encode || null;
}
var prototype$3 = Pulse.prototype;
prototype$3.StopPropagation = StopPropagation;
prototype$3.ADD = ADD;
prototype$3.REM = REM;
prototype$3.MOD = MOD;
prototype$3.ADD_REM = ADD_REM;
prototype$3.ADD_MOD = ADD_MOD;
prototype$3.ALL = ALL;
prototype$3.REFLOW = REFLOW;
prototype$3.SOURCE = SOURCE;
prototype$3.NO_SOURCE = NO_SOURCE;
prototype$3.NO_FIELDS = NO_FIELDS;
prototype$3.fork = function(flags) {
  return new Pulse(this.dataflow).init(this, flags);
};
prototype$3.clone = function() {
  var p = this.fork(ALL);
  p.add = p.add.slice();
  p.rem = p.rem.slice();
  p.mod = p.mod.slice();
  if (p.source) p.source = p.source.slice();
  return p.materialize(ALL | SOURCE);
};
prototype$3.addAll = function() {
  var p = this;
  if (!this.source || this.source.length === this.add.length) {
    return p;
  } else {
    p = new Pulse(this.dataflow).init(this);
    p.add = p.source;
    return p;
  }
};
prototype$3.init = function(src, flags) {
  var p = this;
  p.stamp = src.stamp;
  p.encode = src.encode;
  if (src.fields && !(flags & NO_FIELDS)) {
    p.fields = src.fields;
  }
  if (flags & ADD) {
    p.addF = src.addF;
    p.add = src.add;
  } else {
    p.addF = null;
    p.add = [];
  }
  if (flags & REM) {
    p.remF = src.remF;
    p.rem = src.rem;
  } else {
    p.remF = null;
    p.rem = [];
  }
  if (flags & MOD) {
    p.modF = src.modF;
    p.mod = src.mod;
  } else {
    p.modF = null;
    p.mod = [];
  }
  if (flags & NO_SOURCE) {
    p.srcF = null;
    p.source = null;
  } else {
    p.srcF = src.srcF;
    p.source = src.source;
  }
  return p;
};
prototype$3.runAfter = function(func) {
  this.dataflow.runAfter(func);
};
prototype$3.changed = function(flags) {
  var f = flags || ALL;
  return ((f & ADD) && this.add.length)
      || ((f & REM) && this.rem.length)
      || ((f & MOD) && this.mod.length);
};
prototype$3.reflow = function(fork) {
  if (fork) return this.fork(ALL).reflow();
  var len = this.add.length,
      src = this.source && this.source.length;
  if (src && src !== len) {
    this.mod = this.source;
    if (len) this.filter(MOD, filter(this, ADD));
  }
  return this;
};
prototype$3.modifies = function(_$$1) {
  var fields = array(_$$1),
      hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = true; });
  return this;
};
prototype$3.modified = function(_$$1) {
  var fields = this.fields;
  return !(this.mod.length && fields) ? false
    : !arguments.length ? !!fields
    : isArray(_$$1) ? _$$1.some(function(f) { return fields[f]; })
    : fields[_$$1];
};
prototype$3.filter = function(flags, filter) {
  var p = this;
  if (flags & ADD) p.addF = addFilter(p.addF, filter);
  if (flags & REM) p.remF = addFilter(p.remF, filter);
  if (flags & MOD) p.modF = addFilter(p.modF, filter);
  if (flags & SOURCE) p.srcF = addFilter(p.srcF, filter);
  return p;
};
function addFilter(a, b) {
  return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
}
prototype$3.materialize = function(flags) {
  flags = flags || ALL;
  var p = this;
  if ((flags & ADD) && p.addF) {
    p.add = materialize(p.add, p.addF);
    p.addF = null;
  }
  if ((flags & REM) && p.remF) {
    p.rem = materialize(p.rem, p.remF);
    p.remF = null;
  }
  if ((flags & MOD) && p.modF) {
    p.mod = materialize(p.mod, p.modF);
    p.modF = null;
  }
  if ((flags & SOURCE) && p.srcF) {
    p.source = p.source.filter(p.srcF);
    p.srcF = null;
  }
  return p;
};
function materialize(data, filter) {
  var out = [];
  visitArray(data, filter, function(_$$1) { out.push(_$$1); });
  return out;
}
function filter(pulse, flags) {
  var map = {};
  pulse.visit(flags, function(t) { map[tupleid(t)] = 1; });
  return function(t) { return map[tupleid(t)] ? null : t; };
}
prototype$3.visit = function(flags, visitor) {
  var p = this, v = visitor, src, sum;
  if (flags & SOURCE) {
    visitArray(p.source, p.srcF, v);
    return p;
  }
  if (flags & ADD) visitArray(p.add, p.addF, v);
  if (flags & REM) visitArray(p.rem, p.remF, v);
  if (flags & MOD) visitArray(p.mod, p.modF, v);
  if ((flags & REFLOW) && (src = p.source)) {
    sum = p.add.length + p.mod.length;
    if (sum === src.length) ; else if (sum) {
      visitArray(src, filter(p, ADD_MOD), v);
    } else {
      visitArray(src, p.srcF, v);
    }
  }
  return p;
};

function MultiPulse(dataflow, stamp, pulses, encode) {
  var p = this,
      c = 0,
      pulse, hash, i, n, f;
  this.dataflow = dataflow;
  this.stamp = stamp;
  this.fields = null;
  this.encode = encode || null;
  this.pulses = pulses;
  for (i=0, n=pulses.length; i<n; ++i) {
    pulse = pulses[i];
    if (pulse.stamp !== stamp) continue;
    if (pulse.fields) {
      hash = p.fields || (p.fields = {});
      for (f in pulse.fields) { hash[f] = 1; }
    }
    if (pulse.changed(p.ADD)) c |= p.ADD;
    if (pulse.changed(p.REM)) c |= p.REM;
    if (pulse.changed(p.MOD)) c |= p.MOD;
  }
  this.changes = c;
}
var prototype$4 = inherits(MultiPulse, Pulse);
prototype$4.fork = function(flags) {
  var p = new Pulse(this.dataflow).init(this, flags & this.NO_FIELDS);
  if (flags !== undefined) {
    if (flags & p.ADD) {
      this.visit(p.ADD, function(t) { return p.add.push(t); });
    }
    if (flags & p.REM) {
      this.visit(p.REM, function(t) { return p.rem.push(t); });
    }
    if (flags & p.MOD) {
      this.visit(p.MOD, function(t) { return p.mod.push(t); });
    }
  }
  return p;
};
prototype$4.changed = function(flags) {
  return this.changes & flags;
};
prototype$4.modified = function(_$$1) {
  var p = this, fields = p.fields;
  return !(fields && (p.changes & p.MOD)) ? 0
    : isArray(_$$1) ? _$$1.some(function(f) { return fields[f]; })
    : fields[_$$1];
};
prototype$4.filter = function() {
  error('MultiPulse does not support filtering.');
};
prototype$4.materialize = function() {
  error('MultiPulse does not support materialization.');
};
prototype$4.visit = function(flags, visitor) {
  var p = this,
      pulses = p.pulses,
      n = pulses.length,
      i = 0;
  if (flags & p.SOURCE) {
    for (; i<n; ++i) {
      pulses[i].visit(flags, visitor);
    }
  } else {
    for (; i<n; ++i) {
      if (pulses[i].stamp === p.stamp) {
        pulses[i].visit(flags, visitor);
      }
    }
  }
  return p;
};

function run(encode) {
  var df = this,
      count = 0,
      level = df.logLevel(),
      op, next, dt, error$$1;
  if (df._pending) {
    df.info('Awaiting requests, delaying dataflow run.');
    return 0;
  }
  if (df._pulse) {
    df.error('Dataflow invoked recursively. Use the runAfter method to queue invocation.');
    return 0;
  }
  if (!df._touched.length) {
    df.info('Dataflow invoked, but nothing to do.');
    return 0;
  }
  df._pulse = new Pulse(df, ++df._clock, encode);
  if (level >= Info) {
    dt = Date.now();
    df.debug('-- START PROPAGATION (' + df._clock + ') -----');
  }
  df._touched.forEach(function(op) { df._enqueue(op, true); });
  df._touched = UniqueList(id);
  try {
    while (df._heap.size() > 0) {
      op = df._heap.pop();
      if (op.rank !== op.qrank) { df._enqueue(op, true); continue; }
      next = op.run(df._getPulse(op, encode));
      if (level >= Debug) {
        df.debug(op.id, next === StopPropagation ? 'STOP' : next, op);
      }
      if (next !== StopPropagation) {
        df._pulse = next;
        if (op._targets) op._targets.forEach(function(op) { df._enqueue(op); });
      }
      ++count;
    }
  } catch (err) {
    error$$1 = err;
  }
  df._pulses = {};
  df._pulse = null;
  if (level >= Info) {
    dt = Date.now() - dt;
    df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
  }
  if (error$$1) {
    df._postrun = [];
    df.error(error$$1);
  }
  if (df._onrun) {
    try { df._onrun(df, count, error$$1); } catch (err) { df.error(err); }
  }
  if (df._postrun.length) {
    var postrun = df._postrun;
    df._postrun = [];
    postrun
      .sort(function(a, b) { return b.priority - a.priority; })
      .forEach(function(_$$1) { invokeCallback(df, _$$1.callback); });
  }
  return count;
}
function invokeCallback(df, callback) {
  try { callback(df); } catch (err) { df.error(err); }
}
function runAsync() {
  return this._pending || Promise.resolve(this.run());
}
function runAfter(callback, enqueue, priority) {
  if (this._pulse || enqueue) {
    this._postrun.push({
      priority: priority || 0,
      callback: callback
    });
  } else {
    invokeCallback(this, callback);
  }
}
function enqueue(op, force) {
  var p = !this._pulses[op.id];
  if (p) this._pulses[op.id] = this._pulse;
  if (p || force) {
    op.qrank = op.rank;
    this._heap.push(op);
  }
}
function getPulse(op, encode) {
  var s = op.source,
      stamp = this._clock,
      p;
  if (s && isArray(s)) {
    p = s.map(function(_$$1) { return _$$1.pulse; });
    return new MultiPulse(this, stamp, p, encode);
  }
  p = this._pulses[op.id];
  if (s) {
    s = s.pulse;
    if (!s || s === StopPropagation) {
      p.source = [];
    } else if (s.stamp === stamp && p.target !== op) {
      p = s;
    } else {
      p.source = s.source;
    }
  }
  return p;
}

var NO_OPT = {skip: false, force: false};
function touch(op, options) {
  var opt = options || NO_OPT;
  if (this._pulse) {
    this._enqueue(op);
  } else {
    this._touched.add(op);
  }
  if (opt.skip) op.skip(true);
  return this;
}
function update(op, value, options) {
  var opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
}
function pulse(op, changeset, options) {
  this.touch(op, options || NO_OPT);
  var p = new Pulse(this, this._clock + (this._pulse ? 0 : 1)),
      t = op.pulse && op.pulse.source || [];
  p.target = op;
  this._pulses[op.id] = changeset.pulse(p, t);
  return this;
}

function Heap(comparator) {
  this.cmp = comparator;
  this.nodes = [];
}
var prototype$5 = Heap.prototype;
prototype$5.size = function() {
  return this.nodes.length;
};
prototype$5.clear = function() {
  this.nodes = [];
  return this;
};
prototype$5.peek = function() {
  return this.nodes[0];
};
prototype$5.push = function(x) {
  var array = this.nodes;
  array.push(x);
  return siftdown(array, 0, array.length-1, this.cmp);
};
prototype$5.pop = function() {
  var array = this.nodes,
      last = array.pop(),
      item;
  if (array.length) {
    item = array[0];
    array[0] = last;
    siftup(array, 0, this.cmp);
  } else {
    item = last;
  }
  return item;
};
prototype$5.replace = function(item) {
  var array = this.nodes,
      retval = array[0];
  array[0] = item;
  siftup(array, 0, this.cmp);
  return retval;
};
prototype$5.pushpop = function(item) {
  var array = this.nodes, ref = array[0];
  if (array.length && this.cmp(ref, item) < 0) {
    array[0] = item;
    item = ref;
    siftup(array, 0, this.cmp);
  }
  return item;
};
function siftdown(array, start, idx, cmp) {
  var item, parent, pidx;
  item = array[idx];
  while (idx > start) {
    pidx = (idx - 1) >> 1;
    parent = array[pidx];
    if (cmp(item, parent) < 0) {
      array[idx] = parent;
      idx = pidx;
      continue;
    }
    break;
  }
  return (array[idx] = item);
}
function siftup(array, idx, cmp) {
  var start = idx,
      end = array.length,
      item = array[idx],
      cidx = 2 * idx + 1, ridx;
  while (cidx < end) {
    ridx = cidx + 1;
    if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
      cidx = ridx;
    }
    array[idx] = array[cidx];
    idx = cidx;
    cidx = 2 * idx + 1;
  }
  array[idx] = item;
  return siftdown(array, start, idx, cmp);
}

function Dataflow() {
  this._log = logger();
  this.logLevel(Error$1);
  this._clock = 0;
  this._rank = 0;
  try {
    this._loader = loader();
  } catch (e) {
  }
  this._touched = UniqueList(id);
  this._pulses = {};
  this._pulse = null;
  this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
  this._postrun = [];
}
var prototype$6 = Dataflow.prototype;
prototype$6.stamp = function() {
  return this._clock;
};
prototype$6.loader = function(_$$1) {
  if (arguments.length) {
    this._loader = _$$1;
    return this;
  } else {
    return this._loader;
  }
};
prototype$6.cleanThreshold = 1e4;
prototype$6.add = add;
prototype$6.connect = connect;
prototype$6.rank = rank;
prototype$6.rerank = rerank;
prototype$6.pulse = pulse;
prototype$6.touch = touch;
prototype$6.update = update;
prototype$6.changeset = changeset;
prototype$6.ingest = ingest$1;
prototype$6.request = request;
prototype$6.events = events;
prototype$6.on = on;
prototype$6.run = run;
prototype$6.runAsync = runAsync;
prototype$6.runAfter = runAfter;
prototype$6._enqueue = enqueue;
prototype$6._getPulse = getPulse;
function logMethod(method) {
  return function() {
    return this._log[method].apply(this, arguments);
  };
}
prototype$6.error = logMethod('error');
prototype$6.warn = logMethod('warn');
prototype$6.info = logMethod('info');
prototype$6.debug = logMethod('debug');
prototype$6.logLevel = logMethod('level');

function Transform(init, params) {
  Operator.call(this, init, null, params);
}
var prototype$7 = inherits(Transform, Operator);
prototype$7.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv;
  if (this.skip()) {
    this.skip(false);
  } else {
    rv = this.evaluate(pulse);
  }
  rv = rv || pulse;
  if (rv !== pulse.StopPropagation) this.pulse = rv;
  this.stamp = pulse.stamp;
  return rv;
};
prototype$7.evaluate = function(pulse) {
  var params = this.marshall(pulse.stamp),
      out = this.transform(params, pulse);
  params.clear();
  return out;
};
prototype$7.transform = function() {};

var transforms = {};
function definition(type) {
  var t = transform(type);
  return t && t.Definition || null;
}
function transform(type) {
  type = type && type.toLowerCase();
  return transforms.hasOwnProperty(type) ? transforms[type] : null;
}

function multikey(f) {
  return function(x) {
    var n = f.length,
        i = 1,
        k = String(f[0](x));
    for (; i<n; ++i) {
      k += '|' + f[i](x);
    }
    return k;
  };
}
function groupkey(fields) {
  return !fields || !fields.length ? function() { return ''; }
    : fields.length === 1 ? fields[0]
    : multikey(fields);
}

function measureName(op, field$$1, as) {
  return as || (op + (!field$$1 ? '' : '_' + field$$1));
}
var AggregateOps = {
  'values': measure({
    name: 'values',
    init: 'cell.store = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure({
    name: 'count',
    set:  'cell.num'
  }),
  '__count__': measure({
    name: 'count',
    set:  'this.missing + this.valid'
  }),
  'missing': measure({
    name: 'missing',
    set:  'this.missing'
  }),
  'valid': measure({
    name: 'valid',
    set:  'this.valid'
  }),
  'sum': measure({
    name: 'sum',
    init: 'this.sum = 0;',
    add:  'this.sum += v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
    set:  'this.mean'
  }),
  'average': measure({
    name: 'average',
    set:  'this.mean',
    req:  ['mean'], idx: 1
  }),
  'variance': measure({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : 0',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
    req:  ['variance'], idx: 2
  }),
  'stderr': measure({
    name: 'stderr',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : 0',
    req:  ['variance'], idx: 2
  }),
  'distinct': measure({
    name: 'distinct',
    set:  'cell.data.distinct(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci0': measure({
    name: 'ci0',
    set:  'cell.data.ci0(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci1': measure({
    name: 'ci1',
    set:  'cell.data.ci1(this.get)',
    req:  ['values'], idx: 3
  }),
  'median': measure({
    name: 'median',
    set:  'cell.data.q2(this.get)',
    req:  ['values'], idx: 3
  }),
  'q1': measure({
    name: 'q1',
    set:  'cell.data.q1(this.get)',
    req:  ['values'], idx: 3
  }),
  'q3': measure({
    name: 'q3',
    set:  'cell.data.q3(this.get)',
    req:  ['values'], idx: 3
  }),
  'argmin': measure({
    name: 'argmin',
    init: 'this.argmin = null;',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = null;',
    set:  'this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure({
    name: 'argmax',
    init: 'this.argmax = null;',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = null;',
    set:  'this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure({
    name: 'min',
    init: 'this.min = null;',
    add:  'if (v < this.min || this.min === null) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure({
    name: 'max',
    init: 'this.max = null;',
    add:  'if (v > this.max || this.max === null) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  })
};
var ValidAggregateOps = Object.keys(AggregateOps);
function createMeasure(op, name) {
  return AggregateOps[op](name);
}
function measure(base) {
  return function(out) {
    var m = extend({init:'', add:'', rem:'', idx:0}, base);
    m.out = out || base.name;
    return m;
  };
}
function compareIndex(a, b) {
  return a.idx - b.idx;
}
function resolve(agg, stream) {
  function collect(m, a) {
    function helper(r) { if (!m[r]) collect(m, m[r] = AggregateOps[r]()); }
    if (a.req) a.req.forEach(helper);
    if (stream && a.str) a.str.forEach(helper);
    return m;
  }
  var map = agg.reduce(
    collect,
    agg.reduce(function(m, a) {
      m[a.name] = a;
      return m;
    }, {})
  );
  var values = [], key$$1;
  for (key$$1 in map) values.push(map[key$$1]);
  return values.sort(compareIndex);
}
function compileMeasures(agg, field$$1) {
  var get = field$$1 || identity,
      all = resolve(agg, true),
      init = 'var cell = this.cell; this.valid = 0; this.missing = 0;',
      ctr = 'this.cell = cell; this.init();',
      add = 'if(v==null){++this.missing; return;} if(v!==v) return; ++this.valid;',
      rem = 'if(v==null){--this.missing; return;} if(v!==v) return; --this.valid;',
      set = 'var cell = this.cell;';
  all.forEach(function(a) {
    init += a.init;
    add += a.add;
    rem += a.rem;
  });
  agg.slice().sort(compareIndex).forEach(function(a) {
    set += 't[\'' + a.out + '\']=' + a.set + ';';
  });
  set += 'return t;';
  ctr = Function('cell', ctr);
  ctr.prototype.init = Function(init);
  ctr.prototype.add = Function('v', 't', add);
  ctr.prototype.rem = Function('v', 't', rem);
  ctr.prototype.set = Function('t', set);
  ctr.prototype.get = get;
  ctr.fields = agg.map(function(_$$1) { return _$$1.out; });
  return ctr;
}

function bin(_$$1) {
  var maxb = _$$1.maxbins || 20,
      base = _$$1.base || 10,
      logb = Math.log(base),
      div  = _$$1.divide || [5, 2],
      min  = _$$1.extent[0],
      max  = _$$1.extent[1],
      span = (max - min) || Math.abs(min) || 1,
      step, level, minstep, precision, v, i, n, eps;
  if (_$$1.step) {
    step = _$$1.step;
  } else if (_$$1.steps) {
    v = span / maxb;
    for (i=0, n=_$$1.steps.length; i < n && _$$1.steps[i] < v; ++i);
    step = _$$1.steps[Math.max(0, i-1)];
  } else {
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = _$$1.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );
    while (Math.ceil(span/step) > maxb) { step *= base; }
    for (i=0, n=div.length; i<n; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  if (_$$1.nice || _$$1.nice === undefined) {
    v = Math.floor(min / step + eps) * step;
    min = min < v ? v - step : v;
    max = Math.ceil(max / step) * step;
  }
  return {
    start: min,
    stop:  max === min ? min + step : max,
    step:  step
  };
}

function* numbers(values, valueof) {
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && (value = +value) >= value) {
        yield value;
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
        yield value;
      }
    }
  }
}

var random = Math.random;
function setRandom(r) {
  random = r;
}

function bootstrapCI(array, samples, alpha, f) {
  if (!array.length) return [undefined, undefined];
  var values = Float64Array.from(numbers(array, f)),
      n = values.length,
      m = samples,
      a, i, j, mu;
  for (j=0, mu=Array(m); j<m; ++j) {
    for (a=0, i=0; i<n; ++i) {
      a += values[~~(random() * n)];
    }
    mu[j] = a / n;
  }
  return [
    d3Array.quantile(mu.sort(d3Array.ascending), alpha/2),
    d3Array.quantile(mu, 1-(alpha/2))
  ];
}

function quartiles(array, f) {
  var values = Float64Array.from(numbers(array, f));
  return [
    d3Array.quantile(values.sort(d3Array.ascending), 0.25),
    d3Array.quantile(values, 0.50),
    d3Array.quantile(values, 0.75)
  ];
}

function lcg(seed) {
  return function() {
    seed = (1103515245 * seed + 12345) % 2147483647;
    return seed / 2147483647;
  };
}

function integer(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }
  var dist = {},
      a, b, d;
  dist.min = function(_$$1) {
    if (arguments.length) {
      a = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };
  dist.max = function(_$$1) {
    if (arguments.length) {
      b = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
  };
  dist.sample = function() {
    return a + Math.floor(d * random());
  };
  dist.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
  };
  dist.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };
  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
  };
  return dist.min(min).max(max);
}

function randomNormal(mean, stdev) {
  var mu,
      sigma,
      next = NaN,
      dist = {};
  dist.mean = function(_$$1) {
    if (arguments.length) {
      mu = _$$1 || 0;
      next = NaN;
      return dist;
    } else {
      return mu;
    }
  };
  dist.stdev = function(_$$1) {
    if (arguments.length) {
      sigma = _$$1 == null ? 1 : _$$1;
      next = NaN;
      return dist;
    } else {
      return sigma;
    }
  };
  dist.sample = function() {
    var x = 0, y = 0, rds, c;
    if (next === next) {
      x = next;
      next = NaN;
      return x;
    }
    do {
      x = random() * 2 - 1;
      y = random() * 2 - 1;
      rds = x * x + y * y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2 * Math.log(rds) / rds);
    next = mu + y * c * sigma;
    return mu + x * c * sigma;
  };
  dist.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mu, 2) / (-2 * Math.pow(sigma, 2)));
    return (1 / (sigma * Math.sqrt(2*Math.PI))) * exp;
  };
  dist.cdf = function(x) {
    var cd,
        z = (x - mu) / sigma,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };
  dist.icdf = function(p) {
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mu + sigma * Math.SQRT2 * s;
  };
  return dist.mean(mean).stdev(stdev);
}

function randomKDE(support, bandwidth) {
  var kernel = randomNormal(),
      dist = {},
      n = 0;
  dist.data = function(_$$1) {
    if (arguments.length) {
      support = _$$1;
      n = _$$1 ? _$$1.length : 0;
      return dist.bandwidth(bandwidth);
    } else {
      return support;
    }
  };
  dist.bandwidth = function(_$$1) {
    if (!arguments.length) return bandwidth;
    bandwidth = _$$1;
    if (!bandwidth && support) bandwidth = estimateBandwidth(support);
    return dist;
  };
  dist.sample = function() {
    return support[~~(random() * n)] + bandwidth * kernel.sample();
  };
  dist.pdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.pdf((x - support[i]) / bandwidth);
    }
    return y / bandwidth / n;
  };
  dist.cdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.cdf((x - support[i]) / bandwidth);
    }
    return y / n;
  };
  dist.icdf = function() {
    throw Error('KDE icdf not supported.');
  };
  return dist.data(support);
}
function estimateBandwidth(array) {
  var n = array.length,
      q = quartiles(array),
      h = (q[2] - q[0]) / 1.34;
  return 1.06 * Math.min(Math.sqrt(d3Array.variance(array)), h) * Math.pow(n, -0.2);
}

function randomMixture(dists, weights) {
  var dist = {}, m = 0, w;
  function normalize(x) {
    var w = [], sum = 0, i;
    for (i=0; i<m; ++i) { sum += (w[i] = (x[i]==null ? 1 : +x[i])); }
    for (i=0; i<m; ++i) { w[i] /= sum; }
    return w;
  }
  dist.weights = function(_$$1) {
    if (arguments.length) {
      w = normalize(weights = (_$$1 || []));
      return dist;
    }
    return weights;
  };
  dist.distributions = function(_$$1) {
    if (arguments.length) {
      if (_$$1) {
        m = _$$1.length;
        dists = _$$1;
      } else {
        m = 0;
        dists = [];
      }
      return dist.weights(weights);
    }
    return dists;
  };
  dist.sample = function() {
    var r = random(),
        d = dists[m-1],
        v = w[0],
        i = 0;
    for (; i<m-1; v += w[++i]) {
      if (r < v) { d = dists[i]; break; }
    }
    return d.sample();
  };
  dist.pdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].pdf(x);
    }
    return p;
  };
  dist.cdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].cdf(x);
    }
    return p;
  };
  dist.icdf = function() {
    throw Error('Mixture icdf not supported.');
  };
  return dist.distributions(dists).weights(weights);
}

function randomUniform(min, max) {
  if (max == null) {
    max = (min == null ? 1 : min);
    min = 0;
  }
  var dist = {},
      a, b, d;
  dist.min = function(_$$1) {
    if (arguments.length) {
      a = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };
  dist.max = function(_$$1) {
    if (arguments.length) {
      b = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
  };
  dist.sample = function() {
    return a + d * random();
  };
  dist.pdf = function(x) {
    return (x >= a && x <= b) ? 1 / d : 0;
  };
  dist.cdf = function(x) {
    return x < a ? 0 : x > b ? 1 : (x - a) / d;
  };
  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a + p * d : NaN;
  };
  return dist.min(min).max(max);
}

function ols(uX, uY, uXY, uX2) {
  const delta = uX2 - uX * uX,
        slope = Math.abs(delta) < 1e-24 ? 0 : (uXY - uX * uY) / delta,
        intercept = uY - slope * uX;
  return [intercept, slope];
}

function points(data, x, y, sort) {
  data = data.filter(d => {
    let u = x(d), v = y(d);
    return u != null && (u = +u) >= u && v != null && (v = +v) >= v;
  });
  if (sort) {
    data.sort((a, b) => x(a) - x(b));
  }
  const X = new Float64Array(data.length),
        Y = new Float64Array(data.length);
  let i = 0;
  for (let d of data) {
    X[i] = x(d);
    Y[i] = y(d);
    ++i;
  }
  return [X, Y];
}
function visitPoints(data, x, y, callback) {
  let index = -1, i = -1, u, v;
  for (let d of data) {
    u = x(d, ++index, data);
    v = y(d, index, data);
    if (u != null && (u = +u) >= u && v != null && (v = +v) >= v) {
      callback(u, v, ++i);
    }
  }
}

function rSquared(data, x, y, uY, predict) {
  let SSE = 0, SST = 0;
  visitPoints(data, x, y, (dx, dy) => {
    const sse = dy - predict(dx),
          sst = dy - uY;
    SSE += sse * sse;
    SST += sst * sst;
  });
  return 1 - SSE / SST;
}

function linear(data, x, y) {
  let X = 0, Y = 0, XY = 0, X2 = 0, n = 0;
  visitPoints(data, x, y, (dx, dy) => {
    X += dx;
    Y += dy;
    XY += dx * dy;
    X2 += dx * dx;
    ++n;
  });
  const coef = ols(X / n, Y / n, XY / n, X2 / n),
        predict = x => coef[0] + coef[1] * x;
  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y / n, predict)
  };
}

function log$2(data, x, y) {
  let X = 0, Y = 0, XY = 0, X2 = 0, n = 0;
  visitPoints(data, x, y, (dx, dy) => {
    dx = Math.log(dx);
    X += dx;
    Y += dy;
    XY += dx * dy;
    X2 += dx * dx;
    ++n;
  });
  const coef = ols(X / n, Y / n, XY / n, X2 / n),
        predict = x => coef[0] + coef[1] * Math.log(x);
  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y / n, predict)
  };
}

function exp$1(data, x, y) {
  let Y = 0, YL = 0, XY = 0, XYL = 0, X2Y = 0, n = 0;
  visitPoints(data, x, y, (dx, dy) => {
    const ly = Math.log(dy),
          xy = dx * dy;
    Y += dy;
    XY += xy;
    X2Y += dx * xy;
    YL += dy * ly;
    XYL += xy * ly;
    ++n;
  });
  const coef = ols(XY / Y, YL / Y, XYL / Y, X2Y / Y),
        predict = x => coef[0] * Math.exp(coef[1] * x);
  coef[0] = Math.exp(coef[0]);
  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y / n, predict)
  };
}

function pow$1(data, x, y) {
  let X = 0, Y = 0, XY = 0, X2 = 0, YS = 0, n = 0;
  visitPoints(data, x, y, (dx, dy) => {
    const lx = Math.log(dx),
          ly = Math.log(dy);
    X += lx;
    Y += ly;
    XY += lx * ly;
    X2 += lx * lx;
    YS += dy;
    ++n;
  });
  const coef = ols(X / n, Y / n, XY / n, X2 / n),
        predict = x => coef[0] * Math.pow(x, coef[1]);
  coef[0] = Math.exp(coef[0]);
  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, YS / n, predict)
  };
}

function quad(data, x, y) {
  let X = 0, Y = 0, X2 = 0, X3 = 0, X4 = 0, XY = 0, X2Y = 0, n = 0;
  visitPoints(data, x, y, (dx, dy) => {
    const x2 = dx * dx;
    X += dx;
    Y += dy;
    X2 += x2;
    X3 += x2 * dx;
    X4 += x2 * x2;
    XY += dx * dy;
    X2Y += x2 * dy;
    ++n;
  });
  Y = Y / n;
  XY = XY - X * Y;
  X2Y = X2Y - X2 * Y;
  const XX = X2 - X * X / n,
        XX2 = X3 - (X2 * X / n),
        X2X2 = X4 - (X2 * X2 / n),
        d = (XX * X2X2 - XX2 * XX2),
        a = (X2Y * XX - XY * XX2) / d,
        b = (XY * X2X2 - X2Y * XX2) / d,
        c = Y - (b * (X / n)) - (a * (X2 / n)),
        predict = x => a * x * x + b * x + c;
  return {
    coef: [c, b, a],
    predict: predict,
    rSquared: rSquared(data, x, y, Y, predict)
  };
}

function poly(data, x, y, order) {
  if (order === 1) return linear(data, x, y);
  if (order === 2) return quad(data, x, y);
  const [xv, yv] = points(data, x, y),
        n = xv.length,
        lhs = [],
        rhs = [],
        k = order + 1;
  let Y = 0, i, j, l, v, c;
  for (i = 0; i < n; ++i) {
    Y += yv[i];
  }
  for (i = 0; i < k; ++i) {
    for (l = 0, v = 0; l < n; ++l) {
      v += Math.pow(xv[l], i) * yv[l];
    }
    lhs.push(v);
    c = new Float64Array(k);
    for (j = 0; j < k; ++j) {
      for (l = 0, v = 0; l < n; ++l) {
        v += Math.pow(xv[l], i + j);
      }
      c[j] = v;
    }
    rhs.push(c);
  }
  rhs.push(lhs);
  const coef = gaussianElimination(rhs),
        predict = x => {
          let y = 0, i = 0, n = coef.length;
          for (; i < n; ++i) y += coef[i] * Math.pow(x, i);
          return y;
        };
  return {
    coef: coef,
    predict: predict,
    rSquared: rSquared(data, x, y, Y / n, predict)
  };
}
function gaussianElimination(matrix) {
  const n = matrix.length - 1,
        coef = [];
  let i, j, k, r, t;
  for (i = 0; i < n; ++i) {
    r = i;
    for (j = i + 1; j < n; ++j) {
      if (Math.abs(matrix[i][j]) > Math.abs(matrix[i][r])) {
        r = j;
      }
    }
    for (k = i; k < n + 1; ++k) {
      t = matrix[k][i];
      matrix[k][i] = matrix[k][r];
      matrix[k][r] = t;
    }
    for (j = i + 1; j < n; ++j) {
      for (k = n; k >= i; k--) {
        matrix[k][j] -= (matrix[k][i] * matrix[i][j]) / matrix[i][i];
      }
    }
  }
  for (j = n - 1; j >= 0; --j) {
    t = 0;
    for (k = j + 1; k < n; ++k) {
      t += matrix[k][j] * coef[k];
    }
    coef[j] = (matrix[n][j] - t) / matrix[j][j];
  }
  return coef;
}

const maxiters = 2,
      epsilon = 1e-12;
function loess(data, x, y, bandwidth) {
  const [xv, yv] = points(data, x, y, true),
        n = xv.length,
        bw = Math.max(2, ~~(bandwidth * n)),
        yhat = new Float64Array(n),
        residuals = new Float64Array(n),
        robustWeights = new Float64Array(n).fill(1);
  for (let iter = -1; ++iter <= maxiters; ) {
    const interval = [0, bw - 1];
    for (let i = 0; i < n; ++i) {
      const dx = xv[i],
            i0 = interval[0],
            i1 = interval[1],
            edge = (dx - xv[i0]) > (xv[i1] - dx) ? i0 : i1;
      let W = 0, X = 0, Y = 0, XY = 0, X2 = 0,
          denom = 1 / Math.abs(xv[edge] - dx || 1);
      for (let k = i0; k <= i1; ++k) {
        const xk = xv[k],
              yk = yv[k],
              w = tricube(Math.abs(dx - xk) * denom) * robustWeights[k],
              xkw = xk * w;
        W += w;
        X += xkw;
        Y += yk * w;
        XY += yk * xkw;
        X2 += xk * xkw;
      }
      const [a, b] = ols(X / W, Y / W, XY / W, X2 / W);
      yhat[i] = a + b * dx;
      residuals[i] = Math.abs(yv[i] - yhat[i]);
      updateInterval(xv, i + 1, interval);
    }
    if (iter === maxiters) {
      break;
    }
    const medianResidual = d3Array.median(residuals);
    if (Math.abs(medianResidual) < epsilon) break;
    for (let i = 0, arg, w; i < n; ++i){
      arg = residuals[i] / (6 * medianResidual);
      robustWeights[i] = (arg >= 1) ? epsilon : ((w = 1 - arg * arg) * w);
    }
  }
  return output(xv, yhat);
}
function tricube(x) {
  return (x = 1 - x * x * x) * x * x;
}
function updateInterval(xv, i, interval) {
  let val = xv[i],
      left = interval[0],
      right = interval[1] + 1;
  if (right >= xv.length) return;
  while (i > left && (xv[right] - val) <= (val - xv[left])) {
    interval[0] = ++left;
    interval[1] = right;
    ++right;
  }
}
function output(xv, yhat) {
  const n = xv.length,
        out = [];
  for (let i=0, cnt=0, prev=[], v; i<n; ++i) {
    v = xv[i];
    if (prev[0] === v) {
      prev[1] += (yhat[i] - prev[1]) / (++cnt);
    } else {
      cnt = 0;
      prev = [v, yhat[i]];
      out.push(prev);
    }
  }
  return out;
}

const MIN_RADIANS = 0.1 * Math.PI / 180;
function sampleCurve(f, extent, minSteps, maxSteps) {
  minSteps = minSteps || 25;
  maxSteps = Math.max(minSteps, maxSteps || 200);
  const point = x => [x, f(x)],
        minX = extent[0],
        maxX = extent[1],
        span = maxX - minX,
        stop = span / maxSteps,
        prev = [point(minX)],
        next = [];
  if (minSteps === maxSteps) {
    for (let i = 1; i < maxSteps; ++i) {
      prev.push(point(minX + (i / minSteps) * span));
    }
    prev.push(point(maxX));
    return prev;
  } else {
    next.push(point(maxX));
    for (let i = minSteps; --i > 0;) {
      next.push(point(minX + (i / minSteps) * span));
    }
  }
  let p0 = prev[0],
      p1 = next[next.length - 1];
  while (p1) {
    const pm = point((p0[0] + p1[0]) / 2);
    if (pm[0] - p0[0] >= stop && angleDelta(p0, pm, p1) > MIN_RADIANS) {
      next.push(pm);
    } else {
      p0 = p1;
      prev.push(p1);
      next.pop();
    }
    p1 = next[next.length - 1];
  }
  return prev;
}
function angleDelta(p, q, r) {
  const a0 = Math.atan2(r[1] - p[1], r[0] - p[0]),
        a1 = Math.atan2(q[1] - p[1], q[0] - p[0]);
  return Math.abs(a0 - a1);
}

function TupleStore(key$$1) {
  this._key = key$$1 ? field(key$$1) : tupleid;
  this.reset();
}
var prototype$8 = TupleStore.prototype;
prototype$8.reset = function() {
  this._add = [];
  this._rem = [];
  this._ext = null;
  this._get = null;
  this._q = null;
};
prototype$8.add = function(v) {
  this._add.push(v);
};
prototype$8.rem = function(v) {
  this._rem.push(v);
};
prototype$8.values = function() {
  this._get = null;
  if (this._rem.length === 0) return this._add;
  var a = this._add,
      r = this._rem,
      k = this._key,
      n = a.length,
      m = r.length,
      x = Array(n - m),
      map = {}, i, j, v;
  for (i=0; i<m; ++i) {
    map[k(r[i])] = 1;
  }
  for (i=0, j=0; i<n; ++i) {
    if (map[k(v = a[i])]) {
      map[k(v)] = 0;
    } else {
      x[j++] = v;
    }
  }
  this._rem = [];
  return (this._add = x);
};
prototype$8.distinct = function(get) {
  var v = this.values(),
      n = v.length,
      map = {},
      count = 0, s;
  while (--n >= 0) {
    s = get(v[n]) + '';
    if (!map.hasOwnProperty(s)) {
      map[s] = 1;
      ++count;
    }
  }
  return count;
};
prototype$8.extent = function(get) {
  if (this._get !== get || !this._ext) {
    var v = this.values(),
        i = extentIndex(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;
  }
  return this._ext;
};
prototype$8.argmin = function(get) {
  return this.extent(get)[0] || {};
};
prototype$8.argmax = function(get) {
  return this.extent(get)[1] || {};
};
prototype$8.min = function(get) {
  var m = this.extent(get)[0];
  return m != null ? get(m) : +Infinity;
};
prototype$8.max = function(get) {
  var m = this.extent(get)[1];
  return m != null ? get(m) : -Infinity;
};
prototype$8.quartile = function(get) {
  if (this._get !== get || !this._q) {
    this._q = quartiles(this.values(), get);
    this._get = get;
  }
  return this._q;
};
prototype$8.q1 = function(get) {
  return this.quartile(get)[0];
};
prototype$8.q2 = function(get) {
  return this.quartile(get)[1];
};
prototype$8.q3 = function(get) {
  return this.quartile(get)[2];
};
prototype$8.ci = function(get) {
  if (this._get !== get || !this._ci) {
    this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
    this._get = get;
  }
  return this._ci;
};
prototype$8.ci0 = function(get) {
  return this.ci(get)[0];
};
prototype$8.ci1 = function(get) {
  return this.ci(get)[1];
};

function Aggregate(params) {
  Transform.call(this, null, params);
  this._adds = [];
  this._mods = [];
  this._alen = 0;
  this._mlen = 0;
  this._drop = true;
  this._cross = false;
  this._dims = [];
  this._dnames = [];
  this._measures = [];
  this._countOnly = false;
  this._counts = null;
  this._prev = null;
  this._inputs = null;
  this._outputs = null;
}
Aggregate.Definition = {
  "type": "Aggregate",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
    { "name": "fields", "type": "field", "null": true, "array": true },
    { "name": "as", "type": "string", "null": true, "array": true },
    { "name": "drop", "type": "boolean", "default": true },
    { "name": "cross", "type": "boolean", "default": false },
    { "name": "key", "type": "field" }
  ]
};
var prototype$9 = inherits(Aggregate, Transform);
prototype$9.transform = function(_$$1, pulse) {
  var aggr = this,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      mod;
  this.stamp = out.stamp;
  if (this.value && ((mod = _$$1.modified()) || pulse.modified(this._inputs))) {
    this._prev = this.value;
    this.value = mod ? this.init(_$$1) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    this.value = this.value || this.init(_$$1);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }
  out.modifies(this._outputs);
  aggr._drop = _$$1.drop !== false;
  if (_$$1.cross && aggr._dims.length > 1) {
    aggr._drop = false;
    this.cross();
  }
  return aggr.changes(out);
};
prototype$9.cross = function() {
  var aggr = this,
      curr = aggr.value,
      dims = aggr._dnames,
      vals = dims.map(function() { return {}; }),
      n = dims.length;
  function collect(cells) {
    var key$$1, i, t, v;
    for (key$$1 in cells) {
      t = cells[key$$1].tuple;
      for (i=0; i<n; ++i) {
        vals[i][(v = t[dims[i]])] = v;
      }
    }
  }
  collect(aggr._prev);
  collect(curr);
  function generate(base, tuple, index) {
    var name = dims[index],
        v = vals[index++],
        k, key$$1;
    for (k in v) {
      tuple[name] = v[k];
      key$$1 = base ? base + '|' + k : k;
      if (index < n) generate(key$$1, tuple, index);
      else if (!curr[key$$1]) aggr.cell(key$$1, tuple);
    }
  }
  generate('', {}, 0);
};
prototype$9.init = function(_$$1) {
  var inputs = (this._inputs = []),
      outputs = (this._outputs = []),
      inputMap = {};
  function inputVisit(get) {
    var fields = array(accessorFields(get)),
        i = 0, n = fields.length, f;
    for (; i<n; ++i) {
      if (!inputMap[f=fields[i]]) {
        inputMap[f] = 1;
        inputs.push(f);
      }
    }
  }
  this._dims = array(_$$1.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = accessorName(d);
    inputVisit(d);
    outputs.push(dname);
    return dname;
  });
  this.cellkey = _$$1.key ? _$$1.key : groupkey(this._dims);
  this._countOnly = true;
  this._counts = [];
  this._measures = [];
  var fields = _$$1.fields || [null],
      ops = _$$1.ops || ['count'],
      as = _$$1.as || [],
      n = fields.length,
      map = {},
      field$$1, op, m, mname, outname, i;
  if (n !== ops.length) {
    error('Unmatched number of fields and aggregate ops.');
  }
  for (i=0; i<n; ++i) {
    field$$1 = fields[i];
    op = ops[i];
    if (field$$1 == null && op !== 'count') {
      error('Null aggregate field specified.');
    }
    mname = accessorName(field$$1);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);
    if (op === 'count') {
      this._counts.push(outname);
      continue;
    }
    m = map[mname];
    if (!m) {
      inputVisit(field$$1);
      m = (map[mname] = []);
      m.field = field$$1;
      this._measures.push(m);
    }
    if (op !== 'count') this._countOnly = false;
    m.push(createMeasure(op, outname));
  }
  this._measures = this._measures.map(function(m) {
    return compileMeasures(m, m.field);
  });
  return {};
};
prototype$9.cellkey = groupkey();
prototype$9.cell = function(key$$1, t) {
  var cell = this.value[key$$1];
  if (!cell) {
    cell = this.value[key$$1] = this.newcell(key$$1, t);
    this._adds[this._alen++] = cell;
  } else if (cell.num === 0 && this._drop && cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._adds[this._alen++] = cell;
  } else if (cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._mods[this._mlen++] = cell;
  }
  return cell;
};
prototype$9.newcell = function(key$$1, t) {
  var cell = {
    key:   key$$1,
    num:   0,
    agg:   null,
    tuple: this.newtuple(t, this._prev && this._prev[key$$1]),
    stamp: this.stamp,
    store: false
  };
  if (!this._countOnly) {
    var measures = this._measures,
        n = measures.length, i;
    cell.agg = Array(n);
    for (i=0; i<n; ++i) {
      cell.agg[i] = new measures[i](cell);
    }
  }
  if (cell.store) {
    cell.data = new TupleStore();
  }
  return cell;
};
prototype$9.newtuple = function(t, p) {
  var names = this._dnames,
      dims = this._dims,
      x = {}, i, n;
  for (i=0, n=dims.length; i<n; ++i) {
    x[names[i]] = dims[i](t);
  }
  return p ? replace(p.tuple, x) : ingest(x);
};
prototype$9.add = function(t) {
  var key$$1 = this.cellkey(t),
      cell = this.cell(key$$1, t),
      agg, i, n;
  cell.num += 1;
  if (this._countOnly) return;
  if (cell.store) cell.data.add(t);
  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].add(agg[i].get(t), t);
  }
};
prototype$9.rem = function(t) {
  var key$$1 = this.cellkey(t),
      cell = this.cell(key$$1, t),
      agg, i, n;
  cell.num -= 1;
  if (this._countOnly) return;
  if (cell.store) cell.data.rem(t);
  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].rem(agg[i].get(t), t);
  }
};
prototype$9.celltuple = function(cell) {
  var tuple = cell.tuple,
      counts = this._counts,
      agg, i, n;
  if (cell.store) {
    cell.data.values();
  }
  for (i=0, n=counts.length; i<n; ++i) {
    tuple[counts[i]] = cell.num;
  }
  if (!this._countOnly) {
    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].set(tuple);
    }
  }
  return tuple;
};
prototype$9.changes = function(out) {
  var adds = this._adds,
      mods = this._mods,
      prev = this._prev,
      drop = this._drop,
      add = out.add,
      rem = out.rem,
      mod = out.mod,
      cell, key$$1, i, n;
  if (prev) for (key$$1 in prev) {
    cell = prev[key$$1];
    if (!drop || cell.num) rem.push(cell.tuple);
  }
  for (i=0, n=this._alen; i<n; ++i) {
    add.push(this.celltuple(adds[i]));
    adds[i] = null;
  }
  for (i=0, n=this._mlen; i<n; ++i) {
    cell = mods[i];
    (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
    mods[i] = null;
  }
  this._alen = this._mlen = 0;
  this._prev = null;
  return out;
};

function Bin(params) {
  Transform.call(this, null, params);
}
Bin.Definition = {
  "type": "Bin",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "anchor", "type": "number" },
    { "name": "maxbins", "type": "number", "default": 20 },
    { "name": "base", "type": "number", "default": 10 },
    { "name": "divide", "type": "number", "array": true, "default": [5, 2] },
    { "name": "extent", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "step", "type": "number" },
    { "name": "steps", "type": "number", "array": true },
    { "name": "minstep", "type": "number", "default": 0 },
    { "name": "nice", "type": "boolean", "default": true },
    { "name": "name", "type": "string" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["bin0", "bin1"] }
  ]
};
var prototype$a = inherits(Bin, Transform);
prototype$a.transform = function(_$$1, pulse) {
  var bins = this._bins(_$$1),
      start = bins.start,
      step = bins.step,
      as = _$$1.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1],
      flag;
  if (_$$1.modified()) {
    pulse = pulse.reflow(true);
    flag = pulse.SOURCE;
  } else {
    flag = pulse.modified(accessorFields(_$$1.field)) ? pulse.ADD_MOD : pulse.ADD;
  }
  pulse.visit(flag, function(t) {
    var v = bins(t);
    t[b0] = v;
    t[b1] = v == null ? null : start + step * (1 + (v - start) / step);
  });
  return pulse.modifies(as);
};
prototype$a._bins = function(_$$1) {
  if (this.value && !_$$1.modified()) {
    return this.value;
  }
  var field$$1 = _$$1.field,
      bins  = bin(_$$1),
      start = bins.start,
      stop  = bins.stop,
      step  = bins.step,
      a, d;
  if ((a = _$$1.anchor) != null) {
    d = a - (start + step * Math.floor((a - start) / step));
    start += d;
    stop += d;
  }
  var f = function(t) {
    var v = field$$1(t);
    if (v == null) {
      return null;
    } else {
      v = Math.max(start, Math.min(+v, stop - step));
      return start + step * Math.floor((v - start) / step);
    }
  };
  f.start = start;
  f.stop = stop;
  f.step = step;
  return this.value = accessor(
    f,
    accessorFields(field$$1),
    _$$1.name || 'bin_' + accessorName(field$$1)
  );
};

function SortedList(idFunc, source, input) {
  var $$$1 = idFunc,
      data = source || [],
      add = input || [],
      rem = {},
      cnt = 0;
  return {
    add: function(t) { add.push(t); },
    remove: function(t) { rem[$$$1(t)] = ++cnt; },
    size: function() { return data.length; },
    data: function(compare$$1, resort) {
      if (cnt) {
        data = data.filter(function(t) { return !rem[$$$1(t)]; });
        rem = {};
        cnt = 0;
      }
      if (resort && compare$$1) {
        data.sort(compare$$1);
      }
      if (add.length) {
        data = compare$$1
          ? merge(compare$$1, data, add.sort(compare$$1))
          : data.concat(add);
        add = [];
      }
      return data;
    }
  }
}

function Collect(params) {
  Transform.call(this, [], params);
}
Collect.Definition = {
  "type": "Collect",
  "metadata": {"source": true},
  "params": [
    { "name": "sort", "type": "compare" }
  ]
};
var prototype$b = inherits(Collect, Transform);
prototype$b.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      list = SortedList(tupleid, this.value, out.materialize(out.ADD).add),
      sort = _$$1.sort,
      mod = pulse.changed() || (sort &&
            (_$$1.modified('sort') || pulse.modified(sort.fields)));
  out.visit(out.REM, list.remove);
  this.modified(mod);
  this.value = out.source = list.data(sort, mod);
  if (pulse.source && pulse.source.root) {
    this.value.root = pulse.source.root;
  }
  return out;
};

function Compare(params) {
  Operator.call(this, null, update$1, params);
}
inherits(Compare, Operator);
function update$1(_$$1) {
  return (this.value && !_$$1.modified())
    ? this.value
    : compare(_$$1.fields, _$$1.orders);
}

function CountPattern(params) {
  Transform.call(this, null, params);
}
CountPattern.Definition = {
  "type": "CountPattern",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "case", "type": "enum", "values": ["upper", "lower", "mixed"], "default": "mixed" },
    { "name": "pattern", "type": "string", "default": "[\\w\"]+" },
    { "name": "stopwords", "type": "string", "default": "" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["text", "count"] }
  ]
};
function tokenize(text, tcase, match) {
  switch (tcase) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(match);
}
var prototype$c = inherits(CountPattern, Transform);
prototype$c.transform = function(_$$1, pulse) {
  function process(update) {
    return function(tuple) {
      var tokens = tokenize(get(tuple), _$$1.case, match) || [], t;
      for (var i=0, n=tokens.length; i<n; ++i) {
        if (!stop.test(t = tokens[i])) update(t);
      }
    };
  }
  var init = this._parameterCheck(_$$1, pulse),
      counts = this._counts,
      match = this._match,
      stop = this._stop,
      get = _$$1.field,
      as = _$$1.as || ['text', 'count'],
      add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
      rem = process(function(t) { counts[t] -= 1; });
  if (init) {
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);
    pulse.visit(pulse.REM, rem);
  }
  return this._finish(pulse, as);
};
prototype$c._parameterCheck = function(_$$1, pulse) {
  var init = false;
  if (_$$1.modified('stopwords') || !this._stop) {
    this._stop = new RegExp('^' + (_$$1.stopwords || '') + '$', 'i');
    init = true;
  }
  if (_$$1.modified('pattern') || !this._match) {
    this._match = new RegExp((_$$1.pattern || '[\\w\']+'), 'g');
    init = true;
  }
  if (_$$1.modified('field') || pulse.modified(_$$1.field.fields)) {
    init = true;
  }
  if (init) this._counts = {};
  return init;
};
prototype$c._finish = function(pulse, as) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      text = as[0],
      count = as[1],
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      w, t, c;
  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = ingest({}));
      t[text] = w;
      t[count] = c;
      out.add.push(t);
    } else if (c === 0) {
      if (t) out.rem.push(t);
      counts[w] = null;
      tuples[w] = null;
    } else if (t[count] !== c) {
      t[count] = c;
      out.mod.push(t);
    }
  }
  return out.modifies(as);
};

function Cross(params) {
  Transform.call(this, null, params);
}
Cross.Definition = {
  "type": "Cross",
  "metadata": {"generates": true},
  "params": [
    { "name": "filter", "type": "expr" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
  ]
};
var prototype$d = inherits(Cross, Transform);
prototype$d.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      data = this.value,
      as = _$$1.as || ['a', 'b'],
      a = as[0], b = as[1],
      reset = !data
          || pulse.changed(pulse.ADD_REM)
          || _$$1.modified('as')
          || _$$1.modified('filter');
  if (reset) {
    if (data) out.rem = data;
    data = pulse.materialize(pulse.SOURCE).source;
    out.add = this.value = cross(data, a, b, _$$1.filter || truthy);
  } else {
    out.mod = data;
  }
  out.source = this.value;
  return out.modifies(as);
};
function cross(input, a, b, filter) {
  var data = [],
      t = {},
      n = input.length,
      i = 0,
      j, left;
  for (; i<n; ++i) {
    t[a] = left = input[i];
    for (j=0; j<n; ++j) {
      t[b] = input[j];
      if (filter(t)) {
        data.push(ingest(t));
        t = {};
        t[a] = left;
      }
    }
  }
  return data;
}

var Distributions = {
  kde:     randomKDE,
  mixture: randomMixture,
  normal:  randomNormal,
  uniform: randomUniform
};
var DISTRIBUTIONS = 'distributions',
    FUNCTION = 'function',
    FIELD = 'field';
function parse$1(def, data) {
  var func = def[FUNCTION];
  if (!Distributions.hasOwnProperty(func)) {
    error('Unknown distribution function: ' + func);
  }
  var d = Distributions[func]();
  for (var name in def) {
    if (name === FIELD) {
      d.data((def.from || data()).map(def[name]));
    }
    else if (name === DISTRIBUTIONS) {
      d[name](def[name].map(function(_$$1) { return parse$1(_$$1, data); }));
    }
    else if (typeof d[name] === FUNCTION) {
      d[name](def[name]);
    }
  }
  return d;
}

function Density(params) {
  Transform.call(this, null, params);
}
var distributions = [
  {
    "key": {"function": "normal"},
    "params": [
      { "name": "mean", "type": "number", "default": 0 },
      { "name": "stdev", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "uniform"},
    "params": [
      { "name": "min", "type": "number", "default": 0 },
      { "name": "max", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "kde"},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "from", "type": "data" },
      { "name": "bandwidth", "type": "number", "default": 0 }
    ]
  }
];
var mixture = {
  "key": {"function": "mixture"},
  "params": [
    { "name": "distributions", "type": "param", "array": true,
      "params": distributions },
    { "name": "weights", "type": "number", "array": true }
  ]
};
Density.Definition = {
  "type": "Density",
  "metadata": {"generates": true},
  "params": [
    { "name": "extent", "type": "number", "array": true, "length": 2 },
    { "name": "steps", "type": "number", "default": 100 },
    { "name": "method", "type": "string", "default": "pdf",
      "values": ["pdf", "cdf"] },
    { "name": "distribution", "type": "param",
      "params": distributions.concat(mixture) },
    { "name": "as", "type": "string", "array": true,
      "default": ["value", "density"] }
  ]
};
var prototype$e = inherits(Density, Transform);
prototype$e.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
  if (!this.value || pulse.changed() || _$$1.modified()) {
    var dist = parse$1(_$$1.distribution, source(pulse)),
        method = _$$1.method || 'pdf';
    if (method !== 'pdf' && method !== 'cdf') {
      error('Invalid density method: ' + method);
    }
    if (!_$$1.extent && !dist.data) {
      error('Missing density extent parameter.');
    }
    method = dist[method];
    var as = _$$1.as || ['value', 'density'],
        domain = _$$1.extent || d3Array.extent(dist.data()),
        step = (domain[1] - domain[0]) / (_$$1.steps || 100),
        values = d3Array.range(domain[0], domain[1] + step/2, step)
          .map(function(v) {
            var tuple = {};
            tuple[as[0]] = v;
            tuple[as[1]] = method(v);
            return ingest(tuple);
          });
    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
  }
  return out;
};
function source(pulse) {
  return function() { return pulse.materialize(pulse.SOURCE).source; };
}

function Extent(params) {
  Transform.call(this, [+Infinity, -Infinity], params);
}
Extent.Definition = {
  "type": "Extent",
  "metadata": {},
  "params": [
    { "name": "field", "type": "field", "required": true }
  ]
};
var prototype$f = inherits(Extent, Transform);
prototype$f.transform = function(_$$1, pulse) {
  var extent$$1 = this.value,
      field$$1 = _$$1.field,
      min = extent$$1[0],
      max = extent$$1[1],
      flag = pulse.ADD,
      mod;
  mod = pulse.changed()
     || pulse.modified(field$$1.fields)
     || _$$1.modified('field');
  if (mod) {
    flag = pulse.SOURCE;
    min = +Infinity;
    max = -Infinity;
  }
  pulse.visit(flag, function(t) {
    var v = field$$1(t);
    if (v != null) {
      v = +v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  });
  this.value = [min, max];
};

function Subflow(pulse, parent) {
  Operator.call(this, pulse);
  this.parent = parent;
}
var prototype$g = inherits(Subflow, Operator);
prototype$g.connect = function(target) {
  this.targets().add(target);
  return (target.source = this);
};
prototype$g.add = function(t) {
  this.value.add.push(t);
};
prototype$g.rem = function(t) {
  this.value.rem.push(t);
};
prototype$g.mod = function(t) {
  this.value.mod.push(t);
};
prototype$g.init = function(pulse) {
  this.value.init(pulse, pulse.NO_SOURCE);
};
prototype$g.evaluate = function() {
  return this.value;
};

function Facet(params) {
  Transform.call(this, {}, params);
  this._keys = fastmap();
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}
var prototype$h = inherits(Facet, Transform);
prototype$h.activate = function(flow) {
  this._targets[this._targets.active++] = flow;
};
prototype$h.subflow = function(key$$1, flow, pulse, parent) {
  var flows = this.value,
      sf = flows.hasOwnProperty(key$$1) && flows[key$$1],
      df, p;
  if (!sf) {
    p = parent || (p = this._group[key$$1]) && p.tuple;
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(pulse.NO_SOURCE), this))
      .connect(flow(df, key$$1, p));
    flows[key$$1] = sf;
    this.activate(sf);
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this.activate(sf);
  }
  return sf;
};
prototype$h.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      self = this,
      key$$1 = _$$1.key,
      flow = _$$1.subflow,
      cache = this._keys,
      rekey = _$$1.modified('key');
  function subflow(key$$1) {
    return self.subflow(key$$1, flow, pulse);
  }
  this._group = _$$1.group || {};
  this._targets.active = 0;
  pulse.visit(pulse.REM, function(t) {
    var id$$1 = tupleid(t),
        k = cache.get(id$$1);
    if (k !== undefined) {
      cache.delete(id$$1);
      subflow(k).rem(t);
    }
  });
  pulse.visit(pulse.ADD, function(t) {
    var k = key$$1(t);
    cache.set(tupleid(t), k);
    subflow(k).add(t);
  });
  if (rekey || pulse.modified(key$$1.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var id$$1 = tupleid(t),
          k0 = cache.get(id$$1),
          k1 = key$$1(t);
      if (k0 === k1) {
        subflow(k1).mod(t);
      } else {
        cache.set(id$$1, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  } else if (pulse.changed(pulse.MOD)) {
    pulse.visit(pulse.MOD, function(t) {
      subflow(cache.get(tupleid(t))).mod(t);
    });
  }
  if (rekey) {
    pulse.visit(pulse.REFLOW, function(t) {
      var id$$1 = tupleid(t),
          k0 = cache.get(id$$1),
          k1 = key$$1(t);
      if (k0 !== k1) {
        cache.set(id$$1, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  }
  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return pulse;
};

function Field(params) {
  Operator.call(this, null, update$2, params);
}
inherits(Field, Operator);
function update$2(_$$1) {
  return (this.value && !_$$1.modified()) ? this.value
    : isArray(_$$1.name) ? array(_$$1.name).map(function(f) { return field(f); })
    : field(_$$1.name, _$$1.as);
}

function Filter(params) {
  Transform.call(this, fastmap(), params);
}
Filter.Definition = {
  "type": "Filter",
  "metadata": {"changes": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true }
  ]
};
var prototype$i = inherits(Filter, Transform);
prototype$i.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      cache = this.value,
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod,
      test = _$$1.expr,
      isMod = true;
  pulse.visit(pulse.REM, function(t) {
    var id$$1 = tupleid(t);
    if (!cache.has(id$$1)) rem.push(t);
    else cache.delete(id$$1);
  });
  pulse.visit(pulse.ADD, function(t) {
    if (test(t, _$$1)) add.push(t);
    else cache.set(tupleid(t), 1);
  });
  function revisit(t) {
    var id$$1 = tupleid(t),
        b = test(t, _$$1),
        s = cache.get(id$$1);
    if (b && s) {
      cache.delete(id$$1);
      add.push(t);
    } else if (!b && !s) {
      cache.set(id$$1, 1);
      rem.push(t);
    } else if (isMod && b && !s) {
      mod.push(t);
    }
  }
  pulse.visit(pulse.MOD, revisit);
  if (_$$1.modified()) {
    isMod = false;
    pulse.visit(pulse.REFLOW, revisit);
  }
  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return output;
};

function fieldNames(fields, as) {
  if (!fields) return null;
  return fields.map(function(f, i) {
    return as[i] || accessorName(f);
  });
}

function Flatten(params) {
  Transform.call(this, [], params);
}
Flatten.Definition = {
  "type": "Flatten",
  "metadata": {"generates": true},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true }
  ]
};
var prototype$j = inherits(Flatten, Transform);
prototype$j.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      fields = _$$1.fields,
      as = fieldNames(fields, _$$1.as || []),
      m = as.length;
  out.rem = this.value;
  pulse.visit(pulse.SOURCE, function(t) {
    var arrays = fields.map(function(f) { return f(t); }),
        maxlen = arrays.reduce(function(l, a) { return Math.max(l, a.length); }, 0),
        i = 0, j, d, v;
    for (; i<maxlen; ++i) {
      d = derive(t);
      for (j=0; j<m; ++j) {
        d[as[j]] = (v = arrays[j][i]) == null ? null : v;
      }
      out.add.push(d);
    }
  });
  this.value = out.source = out.add;
  return out.modifies(as);
};

function Fold(params) {
  Transform.call(this, [], params);
}
Fold.Definition = {
  "type": "Fold",
  "metadata": {"generates": true},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
  ]
};
var prototype$k = inherits(Fold, Transform);
prototype$k.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      fields = _$$1.fields,
      fnames = fields.map(accessorName),
      as = _$$1.as || ['key', 'value'],
      k = as[0],
      v = as[1],
      n = fields.length;
  out.rem = this.value;
  pulse.visit(pulse.SOURCE, function(t) {
    for (var i=0, d; i<n; ++i) {
      d = derive(t);
      d[k] = fnames[i];
      d[v] = fields[i](t);
      out.add.push(d);
    }
  });
  this.value = out.source = out.add;
  return out.modifies(as);
};

function Formula(params) {
  Transform.call(this, null, params);
}
Formula.Definition = {
  "type": "Formula",
  "metadata": {"modifies": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true },
    { "name": "as", "type": "string", "required": true },
    { "name": "initonly", "type": "boolean" }
  ]
};
var prototype$l = inherits(Formula, Transform);
prototype$l.transform = function(_$$1, pulse) {
  var func = _$$1.expr,
      as = _$$1.as,
      mod = _$$1.modified(),
      flag = _$$1.initonly ? pulse.ADD
        : mod ? pulse.SOURCE
        : pulse.modified(func.fields) ? pulse.ADD_MOD
        : pulse.ADD;
  function set(t) {
    t[as] = func(t, _$$1);
  }
  if (mod) {
    pulse = pulse.materialize().reflow(true);
  }
  if (!_$$1.initonly) {
    pulse.modifies(as);
  }
  return pulse.visit(flag, set);
};

function Generate(params) {
  Transform.call(this, [], params);
}
var prototype$m = inherits(Generate, Transform);
prototype$m.transform = function(_$$1, pulse) {
  var data = this.value,
      out = pulse.fork(pulse.ALL),
      num = _$$1.size - data.length,
      gen = _$$1.generator,
      add, rem, t;
  if (num > 0) {
    for (add=[]; --num >= 0;) {
      add.push(t = ingest(gen(_$$1)));
      data.push(t);
    }
    out.add = out.add.length
      ? out.materialize(out.ADD).add.concat(add)
      : add;
  } else {
    rem = data.slice(0, -num);
    out.rem = out.rem.length
      ? out.materialize(out.REM).rem.concat(rem)
      : rem;
    data = data.slice(-num);
  }
  out.source = this.value = data;
  return out;
};

var Methods = {
  value: 'value',
  median: d3Array.median,
  mean: d3Array.mean,
  min: d3Array.min,
  max: d3Array.max
};
var Empty = [];
function Impute(params) {
  Transform.call(this, [], params);
}
Impute.Definition = {
  "type": "Impute",
  "metadata": {"changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "key", "type": "field", "required": true },
    { "name": "keyvals", "array": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "method", "type": "enum", "default": "value",
      "values": ["value", "mean", "median", "max", "min"] },
    { "name": "value", "default": 0 }
  ]
};
var prototype$n = inherits(Impute, Transform);
function getValue(_$$1) {
  var m = _$$1.method || Methods.value, v;
  if (Methods[m] == null) {
    error('Unrecognized imputation method: ' + m);
  } else if (m === Methods.value) {
    v = _$$1.value !== undefined ? _$$1.value : 0;
    return function() { return v; };
  } else {
    return Methods[m];
  }
}
function getField(_$$1) {
  var f = _$$1.field;
  return function(t) { return t ? f(t) : NaN; };
}
prototype$n.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      impute = getValue(_$$1),
      field$$1 = getField(_$$1),
      fName = accessorName(_$$1.field),
      kName = accessorName(_$$1.key),
      gNames = (_$$1.groupby || []).map(accessorName),
      groups = partition(pulse.source, _$$1.groupby, _$$1.key, _$$1.keyvals),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group, value, gVals, kVal, g, i, j, l, n, t;
  for (g=0, l=groups.length; g<l; ++g) {
    group = groups[g];
    gVals = group.values;
    value = NaN;
    for (j=0; j<m; ++j) {
      if (group[j] != null) continue;
      kVal = groups.domain[j];
      t = {_impute: true};
      for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
      t[kName] = kVal;
      t[fName] = isNaN(value) ? (value = impute(group, field$$1)) : value;
      curr.push(ingest(t));
    }
  }
  if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
  if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
  this.value = curr;
  return out;
};
function partition(data, groupby, key$$1, keyvals) {
  var get = function(f) { return f(t); },
      groups = [],
      domain = keyvals ? keyvals.slice() : [],
      kMap = {},
      gMap = {}, gVals, gKey,
      group, i, j, k, n, t;
  domain.forEach(function(k, i) { kMap[k] = i + 1; });
  for (i=0, n=data.length; i<n; ++i) {
    t = data[i];
    k = key$$1(t);
    j = kMap[k] || (kMap[k] = domain.push(k));
    gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
    if (!(group = gMap[gKey])) {
      group = (gMap[gKey] = []);
      groups.push(group);
      group.values = gVals;
    }
    group[j-1] = t;
  }
  groups.domain = domain;
  return groups;
}

function JoinAggregate(params) {
  Aggregate.call(this, params);
}
JoinAggregate.Definition = {
  "type": "JoinAggregate",
  "metadata": {"modifies": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "fields", "type": "field", "null": true, "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
    { "name": "as", "type": "string", "null": true, "array": true },
    { "name": "key", "type": "field" }
  ]
};
var prototype$o = inherits(JoinAggregate, Aggregate);
prototype$o.transform = function(_$$1, pulse) {
  var aggr = this,
      mod = _$$1.modified(),
      cells;
  if (aggr.value && (mod || pulse.modified(aggr._inputs))) {
    cells = aggr.value = mod ? aggr.init(_$$1) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    cells = aggr.value = aggr.value || this.init(_$$1);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }
  aggr.changes();
  pulse.visit(pulse.SOURCE, function(t) {
    extend(t, cells[aggr.cellkey(t)].tuple);
  });
  return pulse.reflow(mod).modifies(this._outputs);
};
prototype$o.changes = function() {
  var adds = this._adds,
      mods = this._mods,
      i, n;
  for (i=0, n=this._alen; i<n; ++i) {
    this.celltuple(adds[i]);
    adds[i] = null;
  }
  for (i=0, n=this._mlen; i<n; ++i) {
    this.celltuple(mods[i]);
    mods[i] = null;
  }
  this._alen = this._mlen = 0;
};

function Key(params) {
  Operator.call(this, null, update$3, params);
}
inherits(Key, Operator);
function update$3(_$$1) {
  return (this.value && !_$$1.modified()) ? this.value : key(_$$1.fields, _$$1.flat);
}

function Lookup(params) {
  Transform.call(this, {}, params);
}
Lookup.Definition = {
  "type": "Lookup",
  "metadata": {"modifies": true},
  "params": [
    { "name": "index", "type": "index", "params": [
        {"name": "from", "type": "data", "required": true },
        {"name": "key", "type": "field", "required": true }
      ] },
    { "name": "values", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true },
    { "name": "default", "default": null }
  ]
};
var prototype$p = inherits(Lookup, Transform);
prototype$p.transform = function(_$$1, pulse) {
  var out = pulse,
      as = _$$1.as,
      keys = _$$1.fields,
      index = _$$1.index,
      values = _$$1.values,
      defaultValue = _$$1.default==null ? null : _$$1.default,
      reset = _$$1.modified(),
      flag = reset ? pulse.SOURCE : pulse.ADD,
      n = keys.length,
      set, m, mods;
  if (values) {
    m = values.length;
    if (n > 1 && !as) {
      error('Multi-field lookup requires explicit "as" parameter.');
    }
    if (as && as.length !== n * m) {
      error('The "as" parameter has too few output field names.');
    }
    as = as || values.map(accessorName);
    set = function(t) {
      for (var i=0, k=0, j, v; i<n; ++i) {
        v = index.get(keys[i](t));
        if (v == null) for (j=0; j<m; ++j, ++k) t[as[k]] = defaultValue;
        else for (j=0; j<m; ++j, ++k) t[as[k]] = values[j](v);
      }
    };
  } else {
    if (!as) {
      error('Missing output field names.');
    }
    set = function(t) {
      for (var i=0, v; i<n; ++i) {
        v = index.get(keys[i](t));
        t[as[i]] = v==null ? defaultValue : v;
      }
    };
  }
  if (reset) {
    out = pulse.reflow(true);
  } else {
    mods = keys.some(function(k) { return pulse.modified(k.fields); });
    flag |= (mods ? pulse.MOD : 0);
  }
  pulse.visit(flag, set);
  return out.modifies(as);
};

function MultiExtent(params) {
  Operator.call(this, null, update$4, params);
}
inherits(MultiExtent, Operator);
function update$4(_$$1) {
  if (this.value && !_$$1.modified()) {
    return this.value;
  }
  var min = +Infinity,
      max = -Infinity,
      ext = _$$1.extents,
      i, n, e;
  for (i=0, n=ext.length; i<n; ++i) {
    e = ext[i];
    if (e[0] < min) min = e[0];
    if (e[1] > max) max = e[1];
  }
  return [min, max];
}

function MultiValues(params) {
  Operator.call(this, null, update$5, params);
}
inherits(MultiValues, Operator);
function update$5(_$$1) {
  return (this.value && !_$$1.modified())
    ? this.value
    : _$$1.values.reduce(function(data, _$$1) { return data.concat(_$$1); }, []);
}

function Params(params) {
  Transform.call(this, null, params);
}
inherits(Params, Transform);
Params.prototype.transform = function(_$$1, pulse) {
  this.modified(_$$1.modified());
  this.value = _$$1;
  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function Pivot(params) {
  Aggregate.call(this, params);
}
Pivot.Definition = {
  "type": "Pivot",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "field", "type": "field", "required": true },
    { "name": "value", "type": "field", "required": true },
    { "name": "op", "type": "enum", "values": ValidAggregateOps, "default": "sum" },
    { "name": "limit", "type": "number", "default": 0 },
    { "name": "key", "type": "field" }
  ]
};
var prototype$q = inherits(Pivot, Aggregate);
prototype$q._transform = prototype$q.transform;
prototype$q.transform = function(_$$1, pulse) {
  return this._transform(aggregateParams(_$$1, pulse), pulse);
};
function aggregateParams(_$$1, pulse) {
  var key$$1    = _$$1.field,
  value  = _$$1.value,
      op     = (_$$1.op === 'count' ? '__count__' : _$$1.op) || 'sum',
      fields = accessorFields(key$$1).concat(accessorFields(value)),
      keys   = pivotKeys(key$$1, _$$1.limit || 0, pulse);
  return {
    key:      _$$1.key,
    groupby:  _$$1.groupby,
    ops:      keys.map(function() { return op; }),
    fields:   keys.map(function(k) { return get(k, key$$1, value, fields); }),
    as:       keys.map(function(k) { return k + ''; }),
    modified: _$$1.modified.bind(_$$1)
  };
}
function get(k, key$$1, value, fields) {
  return accessor(
    function(d) { return key$$1(d) === k ? value(d) : NaN; },
    fields,
    k + ''
  );
}
function pivotKeys(key$$1, limit, pulse) {
  var map = {},
      list = [];
  pulse.visit(pulse.SOURCE, function(t) {
    var k = key$$1(t);
    if (!map[k]) {
      map[k] = 1;
      list.push(k);
    }
  });
  list.sort(function(u, v) {
    return (u<v||u==null) && v!=null ? -1
      : (u>v||v==null) && u!=null ? 1
      : ((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))!==u && v===v ? -1
      : v!==v && u===u ? 1 : 0;
  });
  return limit ? list.slice(0, limit) : list;
}

function PreFacet(params) {
  Facet.call(this, params);
}
var prototype$r = inherits(PreFacet, Facet);
prototype$r.transform = function(_$$1, pulse) {
  var self = this,
      flow = _$$1.subflow,
      field$$1 = _$$1.field;
  if (_$$1.modified('field') || field$$1 && pulse.modified(accessorFields(field$$1))) {
    error('PreFacet does not support field modification.');
  }
  this._targets.active = 0;
  pulse.visit(pulse.MOD, function(t) {
    var sf = self.subflow(tupleid(t), flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_$$1) { sf.mod(_$$1); }) : sf.mod(t);
  });
  pulse.visit(pulse.ADD, function(t) {
    var sf = self.subflow(tupleid(t), flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_$$1) { sf.add(ingest(_$$1)); }) : sf.add(t);
  });
  pulse.visit(pulse.REM, function(t) {
    var sf = self.subflow(tupleid(t), flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_$$1) { sf.rem(_$$1); }) : sf.rem(t);
  });
  return pulse;
};

function Project(params) {
  Transform.call(this, null, params);
}
Project.Definition = {
  "type": "Project",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "fields", "type": "field", "array": true },
    { "name": "as", "type": "string", "null": true, "array": true },
  ]
};
var prototype$s = inherits(Project, Transform);
prototype$s.transform = function(_$$1, pulse) {
  var fields = _$$1.fields,
      as = fieldNames(_$$1.fields, _$$1.as || []),
      derive$$1 = fields
        ? function(s, t) { return project(s, t, fields, as); }
        : rederive,
      out, lut;
  if (this.value) {
    lut = this.value;
  } else {
    pulse = pulse.addAll();
    lut = this.value = {};
  }
  out = pulse.fork(pulse.NO_SOURCE);
  pulse.visit(pulse.REM, function(t) {
    var id$$1 = tupleid(t);
    out.rem.push(lut[id$$1]);
    lut[id$$1] = null;
  });
  pulse.visit(pulse.ADD, function(t) {
    var dt = derive$$1(t, ingest({}));
    lut[tupleid(t)] = dt;
    out.add.push(dt);
  });
  pulse.visit(pulse.MOD, function(t) {
    out.mod.push(derive$$1(t, lut[tupleid(t)]));
  });
  return out;
};
function project(s, t, fields, as) {
  for (var i=0, n=fields.length; i<n; ++i) {
    t[as[i]] = fields[i](s);
  }
  return t;
}

function Proxy(params) {
  Transform.call(this, null, params);
}
var prototype$t = inherits(Proxy, Transform);
prototype$t.transform = function(_$$1, pulse) {
  this.value = _$$1.value;
  return _$$1.modified('value')
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

function Relay(params) {
  Transform.call(this, null, params);
}
var prototype$u = inherits(Relay, Transform);
prototype$u.transform = function(_$$1, pulse) {
  var out, lut;
  if (this.value) {
    lut = this.value;
  } else {
    out = pulse = pulse.addAll();
    lut = this.value = {};
  }
  if (_$$1.derive) {
    out = pulse.fork(pulse.NO_SOURCE);
    pulse.visit(pulse.REM, function(t) {
      var id$$1 = tupleid(t);
      out.rem.push(lut[id$$1]);
      lut[id$$1] = null;
    });
    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[tupleid(t)] = dt;
      out.add.push(dt);
    });
    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[tupleid(t)]));
    });
  }
  return out;
};

function Sample(params) {
  Transform.call(this, [], params);
  this.count = 0;
}
Sample.Definition = {
  "type": "Sample",
  "metadata": {},
  "params": [
    { "name": "size", "type": "number", "default": 1000 }
  ]
};
var prototype$v = inherits(Sample, Transform);
prototype$v.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      mod = _$$1.modified('size'),
      num = _$$1.size,
      res = this.value,
      cnt = this.count,
      cap = 0,
      map = res.reduce(function(m, t) {
        m[tupleid(t)] = 1;
        return m;
      }, {});
  function update(t) {
    var p, idx;
    if (res.length < num) {
      res.push(t);
    } else {
      idx = ~~((cnt + 1) * random());
      if (idx < res.length && idx >= cap) {
        p = res[idx];
        if (map[tupleid(p)]) out.rem.push(p);
        res[idx] = t;
      }
    }
    ++cnt;
  }
  if (pulse.rem.length) {
    pulse.visit(pulse.REM, function(t) {
      var id$$1 = tupleid(t);
      if (map[id$$1]) {
        map[id$$1] = -1;
        out.rem.push(t);
      }
      --cnt;
    });
    res = res.filter(function(t) { return map[tupleid(t)] !== -1; });
  }
  if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
    cap = cnt = res.length;
    pulse.visit(pulse.SOURCE, function(t) {
      if (!map[tupleid(t)]) update(t);
    });
    cap = -1;
  }
  if (mod && res.length > num) {
    for (var i=0, n=res.length-num; i<n; ++i) {
      map[tupleid(res[i])] = -1;
      out.rem.push(res[i]);
    }
    res = res.slice(n);
  }
  if (pulse.mod.length) {
    pulse.visit(pulse.MOD, function(t) {
      if (map[tupleid(t)]) out.mod.push(t);
    });
  }
  if (pulse.add.length) {
    pulse.visit(pulse.ADD, update);
  }
  if (pulse.add.length || cap < 0) {
    out.add = res.filter(function(t) { return !map[tupleid(t)]; });
  }
  this.count = cnt;
  this.value = out.source = res;
  return out;
};

function Sequence(params) {
  Transform.call(this, null, params);
}
Sequence.Definition = {
  "type": "Sequence",
  "metadata": {"changes": true},
  "params": [
    { "name": "start", "type": "number", "required": true },
    { "name": "stop", "type": "number", "required": true },
    { "name": "step", "type": "number", "default": 1 }
  ],
  "output": ["value"]
};
var prototype$w = inherits(Sequence, Transform);
prototype$w.transform = function(_$$1, pulse) {
  if (this.value && !_$$1.modified()) return;
  var out = pulse.materialize().fork(pulse.MOD);
  out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;
  this.value = d3Array.range(_$$1.start, _$$1.stop, _$$1.step || 1).map(ingest);
  out.add = pulse.add.concat(this.value);
  return out;
};

function Sieve(params) {
  Transform.call(this, null, params);
  this.modified(true);
}
var prototype$x = inherits(Sieve, Transform);
prototype$x.transform = function(_$$1, pulse) {
  this.value = pulse.source;
  return pulse.changed()
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

function TupleIndex(params) {
  Transform.call(this, fastmap(), params);
}
var prototype$y = inherits(TupleIndex, Transform);
prototype$y.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      field$$1 = _$$1.field,
      index = this.value,
      mod = true;
  function set(t) { index.set(field$$1(t), t); }
  if (_$$1.modified('field') || pulse.modified(field$$1.fields)) {
    index.clear();
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.REM, function(t) { index.delete(field$$1(t)); });
    pulse.visit(pulse.ADD, set);
  } else {
    mod = false;
  }
  this.modified(mod);
  if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
  return pulse.fork();
};

function Values(params) {
  Transform.call(this, null, params);
}
var prototype$z = inherits(Values, Transform);
prototype$z.transform = function(_$$1, pulse) {
  var run = !this.value
    || _$$1.modified('field')
    || _$$1.modified('sort')
    || pulse.changed()
    || (_$$1.sort && pulse.modified(_$$1.sort.fields));
  if (run) {
    this.value = (_$$1.sort
      ? pulse.source.slice().sort(_$$1.sort)
      : pulse.source).map(_$$1.field);
  }
};

function WindowOp(op, field$$1, param, as) {
  var fn = WindowOps[op](field$$1, param);
  return {
    init:   fn.init || zero,
    update: function(w, t) { t[as] = fn.next(w); }
  };
}
var WindowOps = {
  row_number: function() {
    return {
      next: function(w) { return w.index + 1; }
    };
  },
  rank: function() {
    var rank;
    return {
      init: function() { rank = 1; },
      next: function(w) {
        var i = w.index,
            data = w.data;
        return (i && w.compare(data[i - 1], data[i])) ? (rank = i + 1) : rank;
      }
    };
  },
  dense_rank: function() {
    var drank;
    return {
      init: function() { drank = 1; },
      next: function(w) {
        var i = w.index,
            d = w.data;
        return (i && w.compare(d[i - 1], d[i])) ? ++drank : drank;
      }
    };
  },
  percent_rank: function() {
    var rank = WindowOps.rank(),
        next = rank.next;
    return {
      init: rank.init,
      next: function(w) {
        return (next(w) - 1) / (w.data.length - 1);
      }
    };
  },
  cume_dist: function() {
    var cume;
    return {
      init: function() { cume = 0; },
      next: function(w) {
        var i = w.index,
            d = w.data,
            c = w.compare;
        if (cume < i) {
          while (i + 1 < d.length && !c(d[i], d[i + 1])) ++i;
          cume = i;
        }
        return (1 + cume) / d.length;
      }
    };
  },
  ntile: function(field$$1, num) {
    num = +num;
    if (!(num > 0)) error('ntile num must be greater than zero.');
    var cume = WindowOps.cume_dist(),
        next = cume.next;
    return {
      init: cume.init,
      next: function(w) { return Math.ceil(num * next(w)); }
    };
  },
  lag: function(field$$1, offset) {
    offset = +offset || 1;
    return {
      next: function(w) {
        var i = w.index - offset;
        return i >= 0 ? field$$1(w.data[i]) : null;
      }
    };
  },
  lead: function(field$$1, offset) {
    offset = +offset || 1;
    return {
      next: function(w) {
        var i = w.index + offset,
            d = w.data;
        return i < d.length ? field$$1(d[i]) : null;
      }
    };
  },
  first_value: function(field$$1) {
    return {
      next: function(w) { return field$$1(w.data[w.i0]); }
    };
  },
  last_value: function(field$$1) {
    return {
      next: function(w) { return field$$1(w.data[w.i1 - 1]); }
    }
  },
  nth_value: function(field$$1, nth) {
    nth = +nth;
    if (!(nth > 0)) error('nth_value nth must be greater than zero.');
    return {
      next: function(w) {
        var i = w.i0 + (nth - 1);
        return i < w.i1 ? field$$1(w.data[i]) : null;
      }
    }
  }
};
var ValidWindowOps = Object.keys(WindowOps);

function WindowState(_$$1) {
  var self = this,
      ops = array(_$$1.ops),
      fields = array(_$$1.fields),
      params = array(_$$1.params),
      as = array(_$$1.as),
      outputs = self.outputs = [],
      windows = self.windows = [],
      inputs = {},
      map = {},
      countOnly = true,
      counts = [],
      measures = [];
  function visitInputs(f) {
    array(accessorFields(f)).forEach(function(_$$1) { inputs[_$$1] = 1; });
  }
  visitInputs(_$$1.sort);
  ops.forEach(function(op, i) {
    var field$$1 = fields[i],
        mname = accessorName(field$$1),
        name = measureName(op, mname, as[i]);
    visitInputs(field$$1);
    outputs.push(name);
    if (WindowOps.hasOwnProperty(op)) {
      windows.push(WindowOp(op, fields[i], params[i], name));
    }
    else {
      if (field$$1 == null && op !== 'count') {
        error('Null aggregate field specified.');
      }
      if (op === 'count') {
        counts.push(name);
        return;
      }
      countOnly = false;
      var m = map[mname];
      if (!m) {
        m = (map[mname] = []);
        m.field = field$$1;
        measures.push(m);
      }
      m.push(createMeasure(op, name));
    }
  });
  if (counts.length || measures.length) {
    self.cell = cell(measures, counts, countOnly);
  }
  self.inputs = Object.keys(inputs);
}
var prototype$A = WindowState.prototype;
prototype$A.init = function() {
  this.windows.forEach(function(_$$1) { _$$1.init(); });
  if (this.cell) this.cell.init();
};
prototype$A.update = function(w, t) {
  var self = this,
      cell = self.cell,
      wind = self.windows,
      data = w.data,
      m = wind && wind.length,
      j;
  if (cell) {
    for (j=w.p0; j<w.i0; ++j) cell.rem(data[j]);
    for (j=w.p1; j<w.i1; ++j) cell.add(data[j]);
    cell.set(t);
  }
  for (j=0; j<m; ++j) wind[j].update(w, t);
};
function cell(measures, counts, countOnly) {
  measures = measures.map(function(m) {
    return compileMeasures(m, m.field);
  });
  var cell = {
    num:   0,
    agg:   null,
    store: false,
    count: counts
  };
  if (!countOnly) {
    var n = measures.length,
        a = cell.agg = Array(n),
        i = 0;
    for (; i<n; ++i) a[i] = new measures[i](cell);
  }
  if (cell.store) {
    var store = cell.data = new TupleStore();
  }
  cell.add = function(t) {
    cell.num += 1;
    if (countOnly) return;
    if (store) store.add(t);
    for (var i=0; i<n; ++i) {
      a[i].add(a[i].get(t), t);
    }
  };
  cell.rem = function(t) {
    cell.num -= 1;
    if (countOnly) return;
    if (store) store.rem(t);
    for (var i=0; i<n; ++i) {
      a[i].rem(a[i].get(t), t);
    }
  };
  cell.set = function(t) {
    var i, n;
    if (store) store.values();
    for (i=0, n=counts.length; i<n; ++i) t[counts[i]] = cell.num;
    if (!countOnly) for (i=0, n=a.length; i<n; ++i) a[i].set(t);
  };
  cell.init = function() {
    cell.num = 0;
    if (store) store.reset();
    for (var i=0; i<n; ++i) a[i].init();
  };
  return cell;
}

function Window(params) {
  Transform.call(this, {}, params);
  this._mlen = 0;
  this._mods = [];
}
Window.Definition = {
  "type": "Window",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sort", "type": "compare" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidWindowOps.concat(ValidAggregateOps) },
    { "name": "params", "type": "number", "null": true, "array": true },
    { "name": "fields", "type": "field", "null": true, "array": true },
    { "name": "as", "type": "string", "null": true, "array": true },
    { "name": "frame", "type": "number", "null": true, "array": true, "length": 2, "default": [null, 0] },
    { "name": "ignorePeers", "type": "boolean", "default": false }
  ]
};
var prototype$B = inherits(Window, Transform);
prototype$B.transform = function(_$$1, pulse) {
  var self = this,
      state = self.state,
      mod = _$$1.modified(),
      i, n;
  this.stamp = pulse.stamp;
  if (!state || mod) {
    state = self.state = new WindowState(_$$1);
  }
  var key$$1 = groupkey(_$$1.groupby);
  function group(t) { return self.group(key$$1(t)); }
  if (mod || pulse.modified(state.inputs)) {
    self.value = {};
    pulse.visit(pulse.SOURCE, function(t) { group(t).add(t); });
  } else {
    pulse.visit(pulse.REM, function(t) { group(t).remove(t); });
    pulse.visit(pulse.ADD, function(t) { group(t).add(t); });
  }
  for (i=0, n=self._mlen; i<n; ++i) {
    processPartition(self._mods[i], state, _$$1);
  }
  self._mlen = 0;
  self._mods = [];
  return pulse.reflow(mod).modifies(state.outputs);
};
prototype$B.group = function(key$$1) {
  var self = this,
      group = self.value[key$$1];
  if (!group) {
    group = self.value[key$$1] = SortedList(tupleid);
    group.stamp = -1;
  }
  if (group.stamp < self.stamp) {
    group.stamp = self.stamp;
    self._mods[self._mlen++] = group;
  }
  return group;
};
function processPartition(list, state, _$$1) {
  var sort = _$$1.sort,
      range = sort && !_$$1.ignorePeers,
      frame = _$$1.frame || [null, 0],
      data = list.data(sort),
      n = data.length,
      i = 0,
      b = range ? d3Array.bisector(sort) : null,
      w = {
        i0: 0, i1: 0, p0: 0, p1: 0, index: 0,
        data: data, compare: sort || constant(-1)
      };
  for (state.init(); i<n; ++i) {
    setWindow(w, frame, i, n);
    if (range) adjustRange(w, b);
    state.update(w, data[i]);
  }
}
function setWindow(w, f, i, n) {
  w.p0 = w.i0;
  w.p1 = w.i1;
  w.i0 = f[0] == null ? 0 : Math.max(0, i - Math.abs(f[0]));
  w.i1 = f[1] == null ? n : Math.min(n, i + Math.abs(f[1]) + 1);
  w.index = i;
}
function adjustRange(w, bisect) {
  var r0 = w.i0,
      r1 = w.i1 - 1,
      c = w.compare,
      d = w.data,
      n = d.length - 1;
  if (r0 > 0 && !c(d[r0], d[r0-1])) w.i0 = bisect.left(d, d[r0]);
  if (r1 < n && !c(d[r1], d[r1+1])) w.i1 = bisect.right(d, d[r1]);
}



var tx = /*#__PURE__*/Object.freeze({
  aggregate: Aggregate,
  bin: Bin,
  collect: Collect,
  compare: Compare,
  countpattern: CountPattern,
  cross: Cross,
  density: Density,
  extent: Extent,
  facet: Facet,
  field: Field,
  filter: Filter,
  flatten: Flatten,
  fold: Fold,
  formula: Formula,
  generate: Generate,
  impute: Impute,
  joinaggregate: JoinAggregate,
  key: Key,
  lookup: Lookup,
  multiextent: MultiExtent,
  multivalues: MultiValues,
  params: Params,
  pivot: Pivot,
  prefacet: PreFacet,
  project: Project,
  proxy: Proxy,
  relay: Relay,
  sample: Sample,
  sequence: Sequence,
  sieve: Sieve,
  subflow: Subflow,
  tupleindex: TupleIndex,
  values: Values,
  window: Window
});

function Bounds(b) {
  this.clear();
  if (b) this.union(b);
}
var prototype$C = Bounds.prototype;
prototype$C.clone = function() {
  return new Bounds(this);
};
prototype$C.clear = function() {
  this.x1 = +Number.MAX_VALUE;
  this.y1 = +Number.MAX_VALUE;
  this.x2 = -Number.MAX_VALUE;
  this.y2 = -Number.MAX_VALUE;
  return this;
};
prototype$C.empty = function() {
  return (
    this.x1 === +Number.MAX_VALUE &&
    this.y1 === +Number.MAX_VALUE &&
    this.x2 === -Number.MAX_VALUE &&
    this.y2 === -Number.MAX_VALUE
  );
};
prototype$C.set = function(x1, y1, x2, y2) {
  if (x2 < x1) {
    this.x2 = x1;
    this.x1 = x2;
  } else {
    this.x1 = x1;
    this.x2 = x2;
  }
  if (y2 < y1) {
    this.y2 = y1;
    this.y1 = y2;
  } else {
    this.y1 = y1;
    this.y2 = y2;
  }
  return this;
};
prototype$C.add = function(x, y) {
  if (x < this.x1) this.x1 = x;
  if (y < this.y1) this.y1 = y;
  if (x > this.x2) this.x2 = x;
  if (y > this.y2) this.y2 = y;
  return this;
};
prototype$C.expand = function(d) {
  this.x1 -= d;
  this.y1 -= d;
  this.x2 += d;
  this.y2 += d;
  return this;
};
prototype$C.round = function() {
  this.x1 = Math.floor(this.x1);
  this.y1 = Math.floor(this.y1);
  this.x2 = Math.ceil(this.x2);
  this.y2 = Math.ceil(this.y2);
  return this;
};
prototype$C.translate = function(dx, dy) {
  this.x1 += dx;
  this.x2 += dx;
  this.y1 += dy;
  this.y2 += dy;
  return this;
};
prototype$C.rotate = function(angle, x, y) {
  var cos = Math.cos(angle),
      sin = Math.sin(angle),
      cx = x - x*cos + y*sin,
      cy = y - x*sin - y*cos,
      x1 = this.x1, x2 = this.x2,
      y1 = this.y1, y2 = this.y2;
  return this.clear()
    .add(cos*x1 - sin*y1 + cx,  sin*x1 + cos*y1 + cy)
    .add(cos*x1 - sin*y2 + cx,  sin*x1 + cos*y2 + cy)
    .add(cos*x2 - sin*y1 + cx,  sin*x2 + cos*y1 + cy)
    .add(cos*x2 - sin*y2 + cx,  sin*x2 + cos*y2 + cy);
};
prototype$C.union = function(b) {
  if (b.x1 < this.x1) this.x1 = b.x1;
  if (b.y1 < this.y1) this.y1 = b.y1;
  if (b.x2 > this.x2) this.x2 = b.x2;
  if (b.y2 > this.y2) this.y2 = b.y2;
  return this;
};
prototype$C.intersect = function(b) {
  if (b.x1 > this.x1) this.x1 = b.x1;
  if (b.y1 > this.y1) this.y1 = b.y1;
  if (b.x2 < this.x2) this.x2 = b.x2;
  if (b.y2 < this.y2) this.y2 = b.y2;
  return this;
};
prototype$C.encloses = function(b) {
  return b && (
    this.x1 <= b.x1 &&
    this.x2 >= b.x2 &&
    this.y1 <= b.y1 &&
    this.y2 >= b.y2
  );
};
prototype$C.alignsWith = function(b) {
  return b && (
    this.x1 == b.x1 ||
    this.x2 == b.x2 ||
    this.y1 == b.y1 ||
    this.y2 == b.y2
  );
};
prototype$C.intersects = function(b) {
  return b && !(
    this.x2 < b.x1 ||
    this.x1 > b.x2 ||
    this.y2 < b.y1 ||
    this.y1 > b.y2
  );
};
prototype$C.contains = function(x, y) {
  return !(
    x < this.x1 ||
    x > this.x2 ||
    y < this.y1 ||
    y > this.y2
  );
};
prototype$C.width = function() {
  return this.x2 - this.x1;
};
prototype$C.height = function() {
  return this.y2 - this.y1;
};

var gradient_id = 0;
function Gradient(p0, p1) {
  var stops = [], gradient;
  return gradient = {
    id: 'gradient_' + (gradient_id++),
    x1: p0 ? p0[0] : 0,
    y1: p0 ? p0[1] : 0,
    x2: p1 ? p1[0] : 1,
    y2: p1 ? p1[1] : 0,
    stops: stops,
    stop: function(offset, color) {
      stops.push({offset: offset, color: color});
      return gradient;
    }
  };
}

function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
}

function GroupItem(mark) {
  Item.call(this, mark);
  this.items = (this.items || []);
}
inherits(GroupItem, Item);

function domCanvas(w, h) {
  if (typeof document !== 'undefined' && document.createElement) {
    var c = document.createElement('canvas');
    if (c && c.getContext) {
      c.width = w;
      c.height = h;
      return c;
    }
  }
  return null;
}
function domImage() {
  return typeof Image !== 'undefined' ? Image : null;
}

var NodeCanvas;
try {
  NodeCanvas = require('canvas');
  if (!(NodeCanvas && NodeCanvas.createCanvas)) {
    NodeCanvas = null;
  }
} catch (error) {
}
function nodeCanvas(w, h, type) {
  if (NodeCanvas) {
    try {
      return new NodeCanvas.Canvas(w, h, type);
    } catch (e) {
    }
  }
  return null;
}
function nodeImage() {
  return (NodeCanvas && NodeCanvas.Image) || null;
}

function canvas(w, h, type) {
  return domCanvas(w, h) || nodeCanvas(w, h, type) || null;
}
function image() {
  return domImage() || nodeImage() || null;
}

function ResourceLoader(customLoader) {
  this._pending = 0;
  this._loader = customLoader || loader();
}
var prototype$D = ResourceLoader.prototype;
prototype$D.pending = function() {
  return this._pending;
};
function increment(loader$$1) {
  loader$$1._pending += 1;
}
function decrement(loader$$1) {
  loader$$1._pending -= 1;
}
prototype$D.sanitizeURL = function(uri) {
  var loader$$1 = this;
  increment(loader$$1);
  return loader$$1._loader.sanitize(uri, {context:'href'})
    .then(function(opt) {
      decrement(loader$$1);
      return opt;
    })
    .catch(function() {
      decrement(loader$$1);
      return null;
    });
};
prototype$D.loadImage = function(uri) {
  var loader$$1 = this,
      Image = image();
  increment(loader$$1);
  return loader$$1._loader
    .sanitize(uri, {context: 'image'})
    .then(function(opt) {
      var url = opt.href;
      if (!url || !Image) throw {url: url};
      var img = new Image();
      img.onload = function() {
        decrement(loader$$1);
        img.loaded = true;
      };
      img.onerror = function() {
        decrement(loader$$1);
        img.loaded = false;
      };
      img.src = url;
      return img;
    })
    .catch(function(e) {
      decrement(loader$$1);
      return {loaded: false, width: 0, height: 0, src: e && e.url || ''};
    });
};
prototype$D.ready = function() {
  var loader$$1 = this;
  return new Promise(function(accept) {
    function poll(value) {
      if (!loader$$1.pending()) accept(value);
      else setTimeout(function() { poll(true); }, 10);
    }
    poll(false);
  });
};

var lookup = {
  'basis': {
    curve: d3Shape.curveBasis
  },
  'basis-closed': {
    curve: d3Shape.curveBasisClosed
  },
  'basis-open': {
    curve: d3Shape.curveBasisOpen
  },
  'bundle': {
    curve: d3Shape.curveBundle,
    tension: 'beta',
    value: 0.85
  },
  'cardinal': {
    curve: d3Shape.curveCardinal,
    tension: 'tension',
    value: 0
  },
  'cardinal-open': {
    curve: d3Shape.curveCardinalOpen,
    tension: 'tension',
    value: 0
  },
  'cardinal-closed': {
    curve: d3Shape.curveCardinalClosed,
    tension: 'tension',
    value: 0
  },
  'catmull-rom': {
    curve: d3Shape.curveCatmullRom,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-closed': {
    curve: d3Shape.curveCatmullRomClosed,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-open': {
    curve: d3Shape.curveCatmullRomOpen,
    tension: 'alpha',
    value: 0.5
  },
  'linear': {
    curve: d3Shape.curveLinear
  },
  'linear-closed': {
    curve: d3Shape.curveLinearClosed
  },
  'monotone': {
    horizontal: d3Shape.curveMonotoneY,
    vertical:   d3Shape.curveMonotoneX
  },
  'natural': {
    curve: d3Shape.curveNatural
  },
  'step': {
    curve: d3Shape.curveStep
  },
  'step-after': {
    curve: d3Shape.curveStepAfter
  },
  'step-before': {
    curve: d3Shape.curveStepBefore
  }
};
function curves(type, orientation, tension) {
  var entry = lookup.hasOwnProperty(type) && lookup[type],
      curve = null;
  if (entry) {
    curve = entry.curve || entry[orientation || 'vertical'];
    if (entry.tension && tension != null) {
      curve = curve[entry.tension](tension);
    }
  }
  return curve;
}

var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
    regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)([-+])/g, /\s|,|###/];
function pathParse(pathstr) {
  var result = [],
      path,
      curr,
      chunks,
      parsed, param,
      cmd, len, i, j, n, m;
  path = pathstr
    .slice()
    .replace(regexp[0], '###$1')
    .split(regexp[1])
    .slice(1);
  for (i=0, n=path.length; i<n; ++i) {
    curr = path[i];
    chunks = curr
      .slice(1)
      .trim()
      .replace(regexp[2],'$1###$2')
      .split(regexp[3]);
    cmd = curr.charAt(0);
    parsed = [cmd];
    for (j=0, m=chunks.length; j<m; ++j) {
      if ((param = +chunks[j]) === param) {
        parsed.push(param);
      }
    }
    len = cmdlen[cmd.toLowerCase()];
    if (parsed.length-1 > len) {
      for (j=1, m=parsed.length; j<m; j+=len) {
        result.push([cmd].concat(parsed.slice(j, j+len)));
      }
    }
    else {
      result.push(parsed);
    }
  }
  return result;
}

var segmentCache = {};
var bezierCache = {};
var join = [].join;
function segments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
  var key = join.call(arguments);
  if (segmentCache[key]) {
    return segmentCache[key];
  }
  var th = rotateX * (Math.PI/180);
  var sin_th = Math.sin(th);
  var cos_th = Math.cos(th);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
  var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
  var pl = (px*px) / (rx*rx) + (py*py) / (ry*ry);
  if (pl > 1) {
    pl = Math.sqrt(pl);
    rx *= pl;
    ry *= pl;
  }
  var a00 = cos_th / rx;
  var a01 = sin_th / rx;
  var a10 = (-sin_th) / ry;
  var a11 = (cos_th) / ry;
  var x0 = a00 * ox + a01 * oy;
  var y0 = a10 * ox + a11 * oy;
  var x1 = a00 * x + a01 * y;
  var y1 = a10 * x + a11 * y;
  var d = (x1-x0) * (x1-x0) + (y1-y0) * (y1-y0);
  var sfactor_sq = 1 / d - 0.25;
  if (sfactor_sq < 0) sfactor_sq = 0;
  var sfactor = Math.sqrt(sfactor_sq);
  if (sweep == large) sfactor = -sfactor;
  var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
  var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);
  var th0 = Math.atan2(y0-yc, x0-xc);
  var th1 = Math.atan2(y1-yc, x1-xc);
  var th_arc = th1-th0;
  if (th_arc < 0 && sweep === 1){
    th_arc += 2 * Math.PI;
  } else if (th_arc > 0 && sweep === 0) {
    th_arc -= 2 * Math.PI;
  }
  var segs = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
  var result = [];
  for (var i=0; i<segs; ++i) {
    var th2 = th0 + i * th_arc / segs;
    var th3 = th0 + (i+1) * th_arc / segs;
    result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
  }
  return (segmentCache[key] = result);
}
function bezier(params) {
  var key = join.call(params);
  if (bezierCache[key]) {
    return bezierCache[key];
  }
  var cx = params[0],
      cy = params[1],
      th0 = params[2],
      th1 = params[3],
      rx = params[4],
      ry = params[5],
      sin_th = params[6],
      cos_th = params[7];
  var a00 = cos_th * rx;
  var a01 = -sin_th * ry;
  var a10 = sin_th * rx;
  var a11 = cos_th * ry;
  var cos_th0 = Math.cos(th0);
  var sin_th0 = Math.sin(th0);
  var cos_th1 = Math.cos(th1);
  var sin_th1 = Math.sin(th1);
  var th_half = 0.5 * (th1 - th0);
  var sin_th_h2 = Math.sin(th_half * 0.5);
  var t = (8/3) * sin_th_h2 * sin_th_h2 / Math.sin(th_half);
  var x1 = cx + cos_th0 - t * sin_th0;
  var y1 = cy + sin_th0 + t * cos_th0;
  var x3 = cx + cos_th1;
  var y3 = cy + sin_th1;
  var x2 = x3 + t * sin_th1;
  var y2 = y3 - t * cos_th1;
  return (bezierCache[key] = [
    a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
    a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
    a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
  ]);
}

var temp = ['l', 0, 0, 0, 0, 0, 0, 0];
function scale(current, s) {
  var c = (temp[0] = current[0]);
  if (c === 'a' || c === 'A') {
    temp[1] = s * current[1];
    temp[2] = s * current[2];
    temp[6] = s * current[6];
    temp[7] = s * current[7];
  } else {
    for (var i=1, n=current.length; i<n; ++i) {
      temp[i] = s * current[i];
    }
  }
  return temp;
}
function pathRender(context, path, l, t, s) {
  var current,
      previous = null,
      x = 0,
      y = 0,
      controlX = 0,
      controlY = 0,
      tempX,
      tempY,
      tempControlX,
      tempControlY;
  if (l == null) l = 0;
  if (t == null) t = 0;
  if (s == null) s = 1;
  if (context.beginPath) context.beginPath();
  for (var i=0, len=path.length; i<len; ++i) {
    current = path[i];
    if (s !== 1) current = scale(current, s);
    switch (current[0]) {
      case 'l':
        x += current[1];
        y += current[2];
        context.lineTo(x + l, y + t);
        break;
      case 'L':
        x = current[1];
        y = current[2];
        context.lineTo(x + l, y + t);
        break;
      case 'h':
        x += current[1];
        context.lineTo(x + l, y + t);
        break;
      case 'H':
        x = current[1];
        context.lineTo(x + l, y + t);
        break;
      case 'v':
        y += current[1];
        context.lineTo(x + l, y + t);
        break;
      case 'V':
        y = current[1];
        context.lineTo(x + l, y + t);
        break;
      case 'm':
        x += current[1];
        y += current[2];
        context.moveTo(x + l, y + t);
        break;
      case 'M':
        x = current[1];
        y = current[2];
        context.moveTo(x + l, y + t);
        break;
      case 'c':
        tempX = x + current[5];
        tempY = y + current[6];
        controlX = x + current[3];
        controlY = y + current[4];
        context.bezierCurveTo(
          x + current[1] + l,
          y + current[2] + t,
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;
      case 'C':
        x = current[5];
        y = current[6];
        controlX = current[3];
        controlY = current[4];
        context.bezierCurveTo(
          current[1] + l,
          current[2] + t,
          controlX + l,
          controlY + t,
          x + l,
          y + t
        );
        break;
      case 's':
        tempX = x + current[3];
        tempY = y + current[4];
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          x + current[1] + l,
          y + current[2] + t,
          tempX + l,
          tempY + t
        );
        controlX = x + current[1];
        controlY = y + current[2];
        x = tempX;
        y = tempY;
        break;
      case 'S':
        tempX = current[3];
        tempY = current[4];
        controlX = 2*x - controlX;
        controlY = 2*y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = current[1];
        controlY = current[2];
        break;
      case 'q':
        tempX = x + current[3];
        tempY = y + current[4];
        controlX = x + current[1];
        controlY = y + current[2];
        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;
      case 'Q':
        tempX = current[3];
        tempY = current[4];
        context.quadraticCurveTo(
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = current[1];
        controlY = current[2];
        break;
      case 't':
        tempX = x + current[1];
        tempY = y + current[2];
        if (previous[0].match(/[QqTt]/) === null) {
          controlX = x;
          controlY = y;
        }
        else if (previous[0] === 't') {
          controlX = 2 * x - tempControlX;
          controlY = 2 * y - tempControlY;
        }
        else if (previous[0] === 'q') {
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
        }
        tempControlX = controlX;
        tempControlY = controlY;
        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = x + current[1];
        controlY = y + current[2];
        break;
      case 'T':
        tempX = current[1];
        tempY = current[2];
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;
      case 'a':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + x + l,
          current[7] + y + t
        ]);
        x += current[6];
        y += current[7];
        break;
      case 'A':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + l,
          current[7] + t
        ]);
        x = current[6];
        y = current[7];
        break;
      case 'z':
      case 'Z':
        context.closePath();
        break;
    }
    previous = current;
  }
}
function drawArc(context, x, y, coords) {
  var seg = segments(
    coords[5],
    coords[6],
    coords[0],
    coords[1],
    coords[3],
    coords[4],
    coords[2],
    x, y
  );
  for (var i=0; i<seg.length; ++i) {
    var bez = bezier(seg[i]);
    context.bezierCurveTo(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5]);
  }
}

var tau = 2 * Math.PI,
    halfSqrt3 = Math.sqrt(3) / 2;
var builtins = {
  'circle': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau);
    }
  },
  'cross': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          s = r / 2.5;
      context.moveTo(-r, -s);
      context.lineTo(-r, s);
      context.lineTo(-s, s);
      context.lineTo(-s, r);
      context.lineTo(s, r);
      context.lineTo(s, s);
      context.lineTo(r, s);
      context.lineTo(r, -s);
      context.lineTo(s, -s);
      context.lineTo(s, -r);
      context.lineTo(-s, -r);
      context.lineTo(-s, -s);
      context.closePath();
    }
  },
  'diamond': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(-r, 0);
      context.lineTo(0, -r);
      context.lineTo(r, 0);
      context.lineTo(0, r);
      context.closePath();
    }
  },
  'square': {
    draw: function(context, size) {
      var w = Math.sqrt(size),
          x = -w / 2;
      context.rect(x, x, w, w);
    }
  },
  'triangle-up': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, -h);
      context.lineTo(-r, h);
      context.lineTo(r, h);
      context.closePath();
    }
  },
  'triangle-down': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, h);
      context.lineTo(-r, -h);
      context.lineTo(r, -h);
      context.closePath();
    }
  },
  'triangle-right': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(h, 0);
      context.lineTo(-h, -r);
      context.lineTo(-h, r);
      context.closePath();
    }
  },
  'triangle-left': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(-h, 0);
      context.lineTo(h, -r);
      context.lineTo(h, r);
      context.closePath();
    }
  }
};
function symbols(_$$1) {
  return builtins.hasOwnProperty(_$$1) ? builtins[_$$1] : customSymbol(_$$1);
}
var custom = {};
function customSymbol(path) {
  if (!custom.hasOwnProperty(path)) {
    var parsed = pathParse(path);
    custom[path] = {
      draw: function(context, size) {
        pathRender(context, parsed, 0, 0, Math.sqrt(size) / 2);
      }
    };
  }
  return custom[path];
}

function rectangleX(d) {
  return d.x;
}
function rectangleY(d) {
  return d.y;
}
function rectangleWidth(d) {
  return d.width;
}
function rectangleHeight(d) {
  return d.height;
}
function constant$1(_$$1) {
  return function() { return _$$1; };
}
function vg_rect() {
  var x = rectangleX,
      y = rectangleY,
      width = rectangleWidth,
      height = rectangleHeight,
      cornerRadius = constant$1(0),
      context = null;
  function rectangle(_$$1, x0, y0) {
    var buffer,
        x1 = x0 != null ? x0 : +x.call(this, _$$1),
        y1 = y0 != null ? y0 : +y.call(this, _$$1),
        w  = +width.call(this, _$$1),
        h  = +height.call(this, _$$1),
        cr = +cornerRadius.call(this, _$$1);
    if (!context) context = buffer = d3Path.path();
    if (cr <= 0) {
      context.rect(x1, y1, w, h);
    } else {
      var x2 = x1 + w,
          y2 = y1 + h;
      context.moveTo(x1 + cr, y1);
      context.lineTo(x2 - cr, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + cr);
      context.lineTo(x2, y2 - cr);
      context.quadraticCurveTo(x2, y2, x2 - cr, y2);
      context.lineTo(x1 + cr, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - cr);
      context.lineTo(x1, y1 + cr);
      context.quadraticCurveTo(x1, y1, x1 + cr, y1);
      context.closePath();
    }
    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }
  rectangle.x = function(_$$1) {
    if (arguments.length) {
      x = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return x;
    }
  };
  rectangle.y = function(_$$1) {
    if (arguments.length) {
      y = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return y;
    }
  };
  rectangle.width = function(_$$1) {
    if (arguments.length) {
      width = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return width;
    }
  };
  rectangle.height = function(_$$1) {
    if (arguments.length) {
      height = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return height;
    }
  };
  rectangle.cornerRadius = function(_$$1) {
    if (arguments.length) {
      cornerRadius = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return cornerRadius;
    }
  };
  rectangle.context = function(_$$1) {
    if (arguments.length) {
      context = _$$1 == null ? null : _$$1;
      return rectangle;
    } else {
      return context;
    }
  };
  return rectangle;
}

var pi = Math.PI;
function vg_trail() {
  var x,
      y,
      size,
      defined,
      context = null,
      ready, x1, y1, r1;
  function point(x2, y2, w2) {
    var r2 = w2 / 2;
    if (ready) {
      var ux = y1 - y2,
          uy = x2 - x1;
      if (ux || uy) {
        var ud = Math.sqrt(ux * ux + uy * uy),
            rx = (ux /= ud) * r1,
            ry = (uy /= ud) * r1,
            t = Math.atan2(uy, ux);
        context.moveTo(x1 - rx, y1 - ry);
        context.lineTo(x2 - ux * r2, y2 - uy * r2);
        context.arc(x2, y2, r2, t - pi, t);
        context.lineTo(x1 + rx, y1 + ry);
        context.arc(x1, y1, r1, t, t + pi);
      } else {
        context.arc(x2, y2, r2, 0, 2*pi);
      }
      context.closePath();
    } else {
      ready = 1;
    }
    x1 = x2;
    y1 = y2;
    r1 = r2;
  }
  function trail(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;
    if (context == null) context = buffer = d3Path.path();
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) ready = 0;
      }
      if (defined0) point(+x(d, i, data), +y(d, i, data), +size(d, i, data));
    }
    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }
  trail.x = function(_$$1) {
    if (arguments.length) {
      x = _$$1;
      return trail;
    } else {
      return x;
    }
  };
  trail.y = function(_$$1) {
    if (arguments.length) {
      y = _$$1;
      return trail;
    } else {
      return y;
    }
  };
  trail.size = function(_$$1) {
    if (arguments.length) {
      size = _$$1;
      return trail;
    } else {
      return size;
    }
  };
  trail.defined = function(_$$1) {
    if (arguments.length) {
      defined = _$$1;
      return trail;
    } else {
      return defined;
    }
  };
  trail.context = function(_$$1) {
    if (arguments.length) {
      if (_$$1 == null) {
        context = null;
      } else {
        context = _$$1;
      }
      return trail;
    } else {
      return context;
    }
  };
  return trail;
}

function x(item)    { return item.x || 0; }
function y(item)    { return item.y || 0; }
function w(item)    { return item.width || 0; }
function ts(item)   { return item.size || 1; }
function h(item)    { return item.height || 0; }
function xw(item)   { return (item.x || 0) + (item.width || 0); }
function yh(item)   { return (item.y || 0) + (item.height || 0); }
function sa(item)   { return item.startAngle || 0; }
function ea(item)   { return item.endAngle || 0; }
function pa(item)   { return item.padAngle || 0; }
function ir(item)   { return item.innerRadius || 0; }
function or(item)   { return item.outerRadius || 0; }
function cr(item)   { return item.cornerRadius || 0; }
function def(item)  { return !(item.defined === false); }
function size(item) { return item.size == null ? 64 : item.size; }
function type(item) { return symbols(item.shape || 'circle'); }
var arcShape    = d3Shape.arc().startAngle(sa).endAngle(ea).padAngle(pa)
                          .innerRadius(ir).outerRadius(or).cornerRadius(cr),
    areavShape  = d3Shape.area().x(x).y1(y).y0(yh).defined(def),
    areahShape  = d3Shape.area().y(y).x1(x).x0(xw).defined(def),
    lineShape   = d3Shape.line().x(x).y(y).defined(def),
    rectShape   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr),
    symbolShape = d3Shape.symbol().type(type).size(size),
    trailShape  = vg_trail().x(x).y(y).defined(def).size(ts);
function arc(context, item) {
  return arcShape.context(context)(item);
}
function area(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return (item.orient === 'horizontal' ? areahShape : areavShape)
    .curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}
function line(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return lineShape.curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}
function rectangle(context, item, x, y) {
  return rectShape.context(context)(item, x, y);
}
function shape(context, item) {
  return (item.mark.shape || item.shape)
    .context(context)(item);
}
function symbol(context, item) {
  return symbolShape.context(context)(item);
}
function trail(context, items) {
  return trailShape.context(context)(items);
}

function boundStroke(bounds, item) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    bounds.expand(item.strokeWidth != null ? +item.strokeWidth : 1);
  }
  return bounds;
}

var bounds,
    tau$1 = Math.PI * 2,
    halfPi = tau$1 / 4,
    circleThreshold = tau$1 - 1e-8;
function context(_$$1) {
  bounds = _$$1;
  return context;
}
function noop() {}
function add$1(x, y) { bounds.add(x, y); }
context.beginPath = noop;
context.closePath = noop;
context.moveTo = add$1;
context.lineTo = add$1;
context.rect = function(x, y, w, h) {
  add$1(x, y);
  add$1(x + w, y + h);
};
context.quadraticCurveTo = function(x1, y1, x2, y2) {
  add$1(x1, y1);
  add$1(x2, y2);
};
context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  add$1(x1, y1);
  add$1(x2, y2);
  add$1(x3, y3);
};
context.arc = function(cx, cy, r, sa, ea, ccw) {
  if (Math.abs(ea - sa) > circleThreshold) {
    add$1(cx - r, cy - r);
    add$1(cx + r, cy + r);
    return;
  }
  var xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      s, i, x, y;
  function update(a) {
    x = r * Math.cos(a);
    y = r * Math.sin(a);
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }
  update(sa);
  update(ea);
  if (ea !== sa) {
    sa = sa % tau$1; if (sa < 0) sa += tau$1;
    ea = ea % tau$1; if (ea < 0) ea += tau$1;
    if (ea < sa) {
      ccw = !ccw;
      s = sa; sa = ea; ea = s;
    }
    if (ccw) {
      ea -= tau$1;
      s = sa - (sa % halfPi);
      for (i=0; i<4 && s>ea; ++i, s-=halfPi) update(s);
    } else {
      s = sa - (sa % halfPi) + halfPi;
      for (i=0; i<4 && s<ea; ++i, s=s+halfPi) update(s);
    }
  }
  add$1(cx + xmin, cy + ymin);
  add$1(cx + xmax, cy + ymax);
};

function gradient(context, gradient, bounds) {
  var w = bounds.width(),
      h = bounds.height(),
      x1 = bounds.x1 + gradient.x1 * w,
      y1 = bounds.y1 + gradient.y1 * h,
      x2 = bounds.x1 + gradient.x2 * w,
      y2 = bounds.y1 + gradient.y2 * h,
      stop = gradient.stops,
      i = 0,
      n = stop.length,
      linearGradient = context.createLinearGradient(x1, y1, x2, y2);
  for (; i<n; ++i) {
    linearGradient.addColorStop(stop[i].offset, stop[i].color);
  }
  return linearGradient;
}

function color(context, item, value) {
  return (value.id) ?
    gradient(context, value, item.bounds) :
    value;
}

function fill(context, item, opacity) {
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.fillStyle = color(context, item, item.fill);
    return true;
  } else {
    return false;
  }
}

var Empty$1 = [];
function stroke(context, item, opacity) {
  var lw = (lw = item.strokeWidth) != null ? lw : 1;
  if (lw <= 0) return false;
  opacity *= (item.strokeOpacity==null ? 1 : item.strokeOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.strokeStyle = color(context, item, item.stroke);
    context.lineWidth = lw;
    context.lineCap = item.strokeCap || 'butt';
    context.lineJoin = item.strokeJoin || 'miter';
    context.miterLimit = item.strokeMiterLimit || 10;
    if (context.setLineDash) {
      context.setLineDash(item.strokeDash || Empty$1);
      context.lineDashOffset = item.strokeDashOffset || 0;
    }
    return true;
  } else {
    return false;
  }
}

function compare$1(a, b) {
  return a.zindex - b.zindex || a.index - b.index;
}
function zorder(scene) {
  if (!scene.zdirty) return scene.zitems;
  var items = scene.items,
      output = [], item, i, n;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    item.index = i;
    if (item.zindex) output.push(item);
  }
  scene.zdirty = false;
  return scene.zitems = output.sort(compare$1);
}
function visit(scene, visitor) {
  var items = scene.items, i, n;
  if (!items || !items.length) return;
  var zitems = zorder(scene);
  if (zitems && zitems.length) {
    for (i=0, n=items.length; i<n; ++i) {
      if (!items[i].zindex) visitor(items[i]);
    }
    items = zitems;
  }
  for (i=0, n=items.length; i<n; ++i) {
    visitor(items[i]);
  }
}
function pickVisit(scene, visitor) {
  var items = scene.items, hit, i;
  if (!items || !items.length) return null;
  var zitems = zorder(scene);
  if (zitems && zitems.length) items = zitems;
  for (i=items.length; --i >= 0;) {
    if (hit = visitor(items[i])) return hit;
  }
  if (items === zitems) {
    for (items=scene.items, i=items.length; --i >= 0;) {
      if (!items[i].zindex) {
        if (hit = visitor(items[i])) return hit;
      }
    }
  }
  return null;
}

function drawAll(path) {
  return function(context, scene, bounds) {
    visit(scene, function(item) {
      if (!bounds || bounds.intersects(item.bounds)) {
        drawPath(path, context, item, item);
      }
    });
  };
}
function drawOne(path) {
  return function(context, scene, bounds) {
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      drawPath(path, context, scene.items[0], scene.items);
    }
  };
}
function drawPath(path, context, item, items) {
  var opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return;
  if (path(context, items)) return;
  if (item.fill && fill(context, item, opacity)) {
    context.fill();
  }
  if (item.stroke && stroke(context, item, opacity)) {
    context.stroke();
  }
}

var trueFunc = function() { return true; };
function pick(test) {
  if (!test) test = trueFunc;
  return function(context, scene, x, y, gx, gy) {
    x *= context.pixelRatio;
    y *= context.pixelRatio;
    return pickVisit(scene, function(item) {
      var b = item.bounds;
      if ((b && !b.contains(gx, gy)) || !b) return;
      if (test(context, item, x, y, gx, gy)) return item;
    });
  };
}
function hitPath(path, filled) {
  return function(context, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && context.isPointInStroke, lw, lc;
    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      context.lineWidth = lw != null ? lw : 1;
      context.lineCap   = lc != null ? lc : 'butt';
    }
    return path(context, o) ? false :
      (fill && context.isPointInPath(x, y)) ||
      (stroke && context.isPointInStroke(x, y));
  };
}
function pickPath(path) {
  return pick(hitPath(path));
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

function translateItem(item) {
  return translate(item.x || 0, item.y || 0);
}

function markItemPath(type, shape) {
  function attr(emit, item) {
    emit('transform', translateItem(item));
    emit('d', shape(null, item));
  }
  function bound(bounds, item) {
    shape(context(bounds), item);
    return boundStroke(bounds, item)
      .translate(item.x || 0, item.y || 0);
  }
  function draw(context$$1, item) {
    var x = item.x || 0,
        y = item.y || 0;
    context$$1.translate(x, y);
    context$$1.beginPath();
    shape(context$$1, item);
    context$$1.translate(-x, -y);
  }
  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound,
    draw:   drawAll(draw),
    pick:   pickPath(draw)
  };
}

var arc$1 = markItemPath('arc', arc);

function pickArea(a, p) {
  var v = a[0].orient === 'horizontal' ? p[1] : p[0],
      z = a[0].orient === 'horizontal' ? 'y' : 'x',
      lo = 0,
      hi = a.length;
  if (hi === 1) return a[0];
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (a[mid][z] < v) lo = mid + 1;
    else hi = mid;
  }
  lo = Math.max(0, lo - 1);
  hi = Math.min(a.length - 1, hi);
  return (v - a[lo][z]) < (a[hi][z] - v) ? a[lo] : a[hi];
}
function pickLine(a, p) {
  var t = Math.pow(a[0].strokeWidth || 1, 2),
      i = a.length, dx, dy, dd;
  while (--i >= 0) {
    if (a[i].defined === false) continue;
    dx = a[i].x - p[0];
    dy = a[i].y - p[1];
    dd = dx * dx + dy * dy;
    if (dd < t) return a[i];
  }
  return null;
}
function pickTrail(a, p) {
  var i = a.length, dx, dy, dd;
  while (--i >= 0) {
    if (a[i].defined === false) continue;
    dx = a[i].x - p[0];
    dy = a[i].y - p[1];
    dd = dx * dx + dy * dy;
    dx = a[i].size || 1;
    if (dd < dx*dx) return a[i];
  }
  return null;
}

function markMultiItemPath(type, shape, tip) {
  function attr(emit, item) {
    var items = item.mark.items;
    if (items.length) emit('d', shape(null, items));
  }
  function bound(bounds, mark) {
    var items = mark.items;
    if (items.length === 0) {
      return bounds;
    } else {
      shape(context(bounds), items);
      return boundStroke(bounds, items[0]);
    }
  }
  function draw(context$$1, items) {
    context$$1.beginPath();
    shape(context$$1, items);
  }
  var hit = hitPath(draw);
  function pick$$1(context$$1, scene, x, y, gx, gy) {
    var items = scene.items,
        b = scene.bounds;
    if (!items || !items.length || b && !b.contains(gx, gy)) {
      return null;
    }
    x *= context$$1.pixelRatio;
    y *= context$$1.pixelRatio;
    return hit(context$$1, items, x, y) ? items[0] : null;
  }
  return {
    type:   type,
    tag:    'path',
    nested: true,
    attr:   attr,
    bound:  bound,
    draw:   drawOne(draw),
    pick:   pick$$1,
    tip:    tip
  };
}

var area$1 = markMultiItemPath('area', area, pickArea);

var clip_id = 1;
function resetSVGClipId() {
  clip_id = 1;
}
function clip(renderer, item, size) {
  var clip = item.clip,
      defs = renderer._defs,
      id$$1 = item.clip_id || (item.clip_id = 'clip' + clip_id++),
      c = defs.clipping[id$$1] || (defs.clipping[id$$1] = {id: id$$1});
  if (isFunction(clip)) {
    c.path = clip(null);
  } else {
    c.width = size.width || 0;
    c.height = size.height || 0;
  }
  return 'url(#' + id$$1 + ')';
}

var StrokeOffset = 0.5;
function attr(emit, item) {
  emit('transform', translateItem(item));
}
function background(emit, item) {
  var offset = item.stroke ? StrokeOffset : 0;
  emit('class', 'background');
  emit('d', rectangle(null, item, offset, offset));
}
function foreground(emit, item, renderer) {
  var url = item.clip ? clip(renderer, item, item) : null;
  emit('clip-path', url);
}
function bound(bounds, group) {
  if (!group.clip && group.items) {
    var items = group.items;
    for (var j=0, m=items.length; j<m; ++j) {
      bounds.union(items[j].bounds);
    }
  }
  if (group.clip || group.width || group.height) {
    boundStroke(
      bounds.add(0, 0).add(group.width || 0, group.height || 0),
      group
    );
  }
  return bounds.translate(group.x || 0, group.y || 0);
}
function backgroundPath(context, group) {
  var offset = group.stroke ? StrokeOffset : 0;
  context.beginPath();
  rectangle(context, group, offset, offset);
}
var hitBackground = hitPath(backgroundPath);
function draw(context, scene, bounds) {
  var renderer = this;
  visit(scene, function(group) {
    var gx = group.x || 0,
        gy = group.y || 0,
        w = group.width || 0,
        h = group.height || 0,
        opacity;
    context.save();
    context.translate(gx, gy);
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        backgroundPath(context, group);
        if (group.fill && fill(context, group, opacity)) {
          context.fill();
        }
        if (group.stroke && stroke(context, group, opacity)) {
          context.stroke();
        }
      }
    }
    if (group.clip) {
      context.beginPath();
      context.rect(0, 0, w, h);
      context.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);
    visit(group, function(item) {
      renderer.draw(context, item, bounds);
    });
    if (bounds) bounds.translate(gx, gy);
    context.restore();
  });
}
function pick$1(context, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy) || !scene.items) {
    return null;
  }
  var handler = this,
      cx = x * context.pixelRatio,
      cy = y * context.pixelRatio;
  return pickVisit(scene, function(group) {
    var hit, dx, dy, b;
    b = group.bounds;
    if (b && !b.contains(gx, gy)) return;
    dx = (group.x || 0);
    dy = (group.y || 0);
    context.save();
    context.translate(dx, dy);
    dx = gx - dx;
    dy = gy - dy;
    hit = pickVisit(group, function(mark) {
      return pickMark(mark, dx, dy)
        ? handler.pick(mark, x, y, dx, dy)
        : null;
    });
    if (!hit && scene.interactive !== false
        && (group.fill || group.stroke)
        && hitBackground(context, group, cx, cy)) {
      hit = group;
    }
    context.restore();
    return hit || null;
  });
}
function pickMark(mark, x, y) {
  return (mark.interactive !== false || mark.marktype === 'group')
    && mark.bounds && mark.bounds.contains(x, y);
}
var group = {
  type:       'group',
  tag:        'g',
  nested:     false,
  attr:       attr,
  bound:      bound,
  draw:       draw,
  pick:       pick$1,
  background: background,
  foreground: foreground
};

function getImage(item, renderer) {
  var image = item.image;
  if (!image || image.url !== item.url) {
    image = {loaded: false, width: 0, height: 0};
    renderer.loadImage(item.url).then(function(image) {
      item.image = image;
      item.image.url = item.url;
    });
  }
  return image;
}
function imageXOffset(align, w) {
  return align === 'center' ? w / 2 : align === 'right' ? w : 0;
}
function imageYOffset(baseline, h) {
  return baseline === 'middle' ? h / 2 : baseline === 'bottom' ? h : 0;
}
function attr$1(emit, item, renderer) {
  var image = getImage(item, renderer),
      x = item.x || 0,
      y = item.y || 0,
      w = (item.width != null ? item.width : image.width) || 0,
      h = (item.height != null ? item.height : image.height) || 0,
      a = item.aspect === false ? 'none' : 'xMidYMid';
  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);
  emit('href', image.src || '', 'http://www.w3.org/1999/xlink', 'xlink:href');
  emit('transform', translate(x, y));
  emit('width', w);
  emit('height', h);
  emit('preserveAspectRatio', a);
}
function bound$1(bounds, item) {
  var image = item.image,
      x = item.x || 0,
      y = item.y || 0,
      w = (item.width != null ? item.width : (image && image.width)) || 0,
      h = (item.height != null ? item.height : (image && image.height)) || 0;
  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);
  return bounds.set(x, y, x + w, y + h);
}
function draw$1(context, scene, bounds) {
  var renderer = this;
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return;
    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = (item.width != null ? item.width : image.width) || 0,
        h = (item.height != null ? item.height : image.height) || 0,
        opacity, ar0, ar1, t;
    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);
    if (item.aspect !== false) {
      ar0 = image.width / image.height;
      ar1 = item.width / item.height;
      if (ar0 === ar0 && ar1 === ar1 && ar0 !== ar1) {
        if (ar1 < ar0) {
          t = w / ar0;
          y += (h - t) / 2;
          h = t;
        } else {
          t = h * ar0;
          x += (w - t) / 2;
          w = t;
        }
      }
    }
    if (image.loaded) {
      context.globalAlpha = (opacity = item.opacity) != null ? opacity : 1;
      context.drawImage(image, x, y, w, h);
    }
  });
}
var image$1 = {
  type:     'image',
  tag:      'image',
  nested:   false,
  attr:     attr$1,
  bound:    bound$1,
  draw:     draw$1,
  pick:     pick(),
  get:      getImage,
  xOffset:  imageXOffset,
  yOffset:  imageYOffset
};

var line$1 = markMultiItemPath('line', line, pickLine);

function attr$2(emit, item) {
  emit('transform', translateItem(item));
  emit('d', item.path);
}
function path(context$$1, item) {
  var path = item.path;
  if (path == null) return true;
  var cache = item.pathCache;
  if (!cache || cache.path !== path) {
    (item.pathCache = cache = pathParse(path)).path = path;
  }
  pathRender(context$$1, cache, item.x, item.y);
}
function bound$2(bounds, item) {
  return path(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item);
}
var path$1 = {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr$2,
  bound:  bound$2,
  draw:   drawAll(path),
  pick:   pickPath(path)
};

function attr$3(emit, item) {
  emit('d', rectangle(null, item));
}
function bound$3(bounds, item) {
  var x, y;
  return boundStroke(bounds.set(
    x = item.x || 0,
    y = item.y || 0,
    (x + item.width) || 0,
    (y + item.height) || 0
  ), item);
}
function draw$2(context, item) {
  context.beginPath();
  rectangle(context, item);
}
var rect = {
  type:   'rect',
  tag:    'path',
  nested: false,
  attr:   attr$3,
  bound:  bound$3,
  draw:   drawAll(draw$2),
  pick:   pickPath(draw$2)
};

function attr$4(emit, item) {
  emit('transform', translateItem(item));
  emit('x2', item.x2 != null ? item.x2 - (item.x||0) : 0);
  emit('y2', item.y2 != null ? item.y2 - (item.y||0) : 0);
}
function bound$4(bounds, item) {
  var x1, y1;
  return boundStroke(bounds.set(
    x1 = item.x || 0,
    y1 = item.y || 0,
    item.x2 != null ? item.x2 : x1,
    item.y2 != null ? item.y2 : y1
  ), item);
}
function path$2(context, item, opacity) {
  var x1, y1, x2, y2;
  if (item.stroke && stroke(context, item, opacity)) {
    x1 = item.x || 0;
    y1 = item.y || 0;
    x2 = item.x2 != null ? item.x2 : x1;
    y2 = item.y2 != null ? item.y2 : y1;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    return true;
  }
  return false;
}
function draw$3(context, scene, bounds) {
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return;
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity && path$2(context, item, opacity)) {
      context.stroke();
    }
  });
}
function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;
  return path$2(context, item, 1) && context.isPointInStroke(x, y);
}
var rule = {
  type:   'rule',
  tag:    'line',
  nested: false,
  attr:   attr$4,
  bound:  bound$4,
  draw:   draw$3,
  pick:   pick(hit)
};

var shape$1 = markItemPath('shape', shape);

var symbol$1 = markItemPath('symbol', symbol);

var context$1,
    fontHeight;
var textMetrics = {
  height: height,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: useCanvas
};
useCanvas(true);
function estimateWidth(item) {
  fontHeight = height(item);
  return estimate(textValue(item));
}
function estimate(text) {
  return ~~(0.8 * text.length * fontHeight);
}
function measureWidth(item) {
  context$1.font = font(item);
  return measure$1(textValue(item));
}
function measure$1(text) {
  return context$1.measureText(text).width;
}
function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}
function useCanvas(use) {
  context$1 = use && (context$1 = canvas(1,1)) ? context$1.getContext('2d') : null;
  textMetrics.width = context$1 ? measureWidth : estimateWidth;
}
function textValue(item) {
  var s = item.text;
  if (s == null) {
    return '';
  } else {
    return item.limit > 0 ? truncate$1(item) : s + '';
  }
}
function truncate$1(item) {
  var limit = +item.limit,
      text = item.text + '',
      width;
  if (context$1) {
    context$1.font = font(item);
    width = measure$1;
  } else {
    fontHeight = height(item);
    width = estimate;
  }
  if (width(text) < limit) return text;
  var ellipsis = item.ellipsis || '\u2026',
      rtl = item.dir === 'rtl',
      lo = 0,
      hi = text.length, mid;
  limit -= width(ellipsis);
  if (rtl) {
    while (lo < hi) {
      mid = (lo + hi >>> 1);
      if (width(text.slice(mid)) > limit) lo = mid + 1;
      else hi = mid;
    }
    return ellipsis + text.slice(lo);
  } else {
    while (lo < hi) {
      mid = 1 + (lo + hi >>> 1);
      if (width(text.slice(0, mid)) < limit) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo) + ellipsis;
  }
}
function font(item, quote) {
  var font = item.font;
  if (quote && font) {
    font = String(font).replace(/"/g, '\'');
  }
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    height(item) + 'px ' +
    (font || 'sans-serif');
}
function offset(item) {
  var baseline = item.baseline,
      h = height(item);
  return Math.round(
    baseline === 'top'    ?  0.79*h :
    baseline === 'middle' ?  0.30*h :
    baseline === 'bottom' ? -0.21*h : 0
  );
}

var textAlign = {
  'left':   'start',
  'center': 'middle',
  'right':  'end'
};
var tempBounds = new Bounds();
function attr$5(emit, item) {
  var dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item),
      x = item.x || 0,
      y = item.y || 0,
      a = item.angle || 0,
      r = item.radius || 0, t;
  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }
  emit('text-anchor', textAlign[item.align] || 'start');
  if (a) {
    t = translate(x, y) + ' rotate('+a+')';
    if (dx || dy) t += ' ' + translate(dx, dy);
  } else {
    t = translate(x + dx, y + dy);
  }
  emit('transform', t);
}
function bound$5(bounds, item, noRotate) {
  var h = textMetrics.height(item),
      a = item.align,
      r = item.radius || 0,
      x = item.x || 0,
      y = item.y || 0,
      dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item) - Math.round(0.8*h),
      w, t;
  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }
  w = textMetrics.width(item);
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  }
  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (item.angle && !noRotate) {
    bounds.rotate(item.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate || !w ? 0 : 1);
}
function draw$4(context, scene, bounds) {
  visit(scene, function(item) {
    var opacity, x, y, r, t, str;
    if (bounds && !bounds.intersects(item.bounds)) return;
    if (!(str = textValue(item))) return;
    opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity === 0) return;
    context.font = font(item);
    context.textAlign = item.align || 'left';
    x = item.x || 0;
    y = item.y || 0;
    if ((r = item.radius)) {
      t = (item.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }
    if (item.angle) {
      context.save();
      context.translate(x, y);
      context.rotate(item.angle * Math.PI/180);
      x = y = 0;
    }
    x += (item.dx || 0);
    y += (item.dy || 0) + offset(item);
    if (item.fill && fill(context, item, opacity)) {
      context.fillText(str, x, y);
    }
    if (item.stroke && stroke(context, item, opacity)) {
      context.strokeText(str, x, y);
    }
    if (item.angle) context.restore();
  });
}
function hit$1(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true;
  var b = bound$5(tempBounds, item, true),
      a = -item.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ix = item.x,
      iy = item.y,
      px = cos*gx - sin*gy + (ix - ix*cos + iy*sin),
      py = sin*gx + cos*gy + (iy - ix*sin - iy*cos);
  return b.contains(px, py);
}
var text = {
  type:   'text',
  tag:    'text',
  nested: false,
  attr:   attr$5,
  bound:  bound$5,
  draw:   draw$4,
  pick:   pick(hit$1)
};

var trail$1 = markMultiItemPath('trail', trail, pickTrail);

var Marks = {
  arc:     arc$1,
  area:    area$1,
  group:   group,
  image:   image$1,
  line:    line$1,
  path:    path$1,
  rect:    rect,
  rule:    rule,
  shape:   shape$1,
  symbol:  symbol$1,
  text:    text,
  trail:   trail$1
};

function boundItem(item, func, opt) {
  var type = Marks[item.mark.marktype],
      bound = func || type.bound;
  if (type.nested) item = item.mark;
  return bound(item.bounds || (item.bounds = new Bounds()), item, opt);
}

var DUMMY = {mark: null};
function boundMark(mark, bounds, opt) {
  var type  = Marks[mark.marktype],
      bound = type.bound,
      items = mark.items,
      hasItems = items && items.length,
      i, n, item, b;
  if (type.nested) {
    if (hasItems) {
      item = items[0];
    } else {
      DUMMY.mark = mark;
      item = DUMMY;
    }
    b = boundItem(item, bound, opt);
    bounds = bounds && bounds.union(b) || b;
    return bounds;
  }
  bounds = bounds
    || mark.bounds && mark.bounds.clear()
    || new Bounds();
  if (hasItems) {
    for (i=0, n=items.length; i<n; ++i) {
      bounds.union(boundItem(items[i], bound, opt));
    }
  }
  return mark.bounds = bounds;
}

var keys = [
  'marktype', 'name', 'role', 'interactive', 'clip', 'items', 'zindex',
  'x', 'y', 'width', 'height', 'align', 'baseline',
  'fill', 'fillOpacity', 'opacity',
  'stroke', 'strokeOpacity', 'strokeWidth', 'strokeCap',
  'strokeDash', 'strokeDashOffset',
  'startAngle', 'endAngle', 'innerRadius', 'outerRadius',
  'cornerRadius', 'padAngle',
  'interpolate', 'tension', 'orient', 'defined',
  'url',
  'path',
  'x2', 'y2',
  'size', 'shape',
  'text', 'angle', 'theta', 'radius', 'dx', 'dy',
  'font', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant'
];
function sceneToJSON(scene, indent) {
  return JSON.stringify(scene, keys, indent);
}
function sceneFromJSON(json) {
  var scene = (typeof json === 'string' ? JSON.parse(json) : json);
  return initialize(scene);
}
function initialize(scene) {
  var type = scene.marktype,
      items = scene.items,
      parent, i, n;
  if (items) {
    for (i=0, n=items.length; i<n; ++i) {
      parent = type ? 'mark' : 'group';
      items[i][parent] = scene;
      if (items[i].zindex) items[i][parent].zdirty = true;
      if ('group' === (type || parent)) initialize(items[i]);
    }
  }
  if (type) boundMark(scene);
  return scene;
}

function Scenegraph(scene) {
  if (arguments.length) {
    this.root = sceneFromJSON(scene);
  } else {
    this.root = createMark({
      marktype: 'group',
      name: 'root',
      role: 'frame'
    });
    this.root.items = [new GroupItem(this.root)];
  }
}
var prototype$E = Scenegraph.prototype;
prototype$E.toJSON = function(indent) {
  return sceneToJSON(this.root, indent || 0);
};
prototype$E.mark = function(markdef, group, index) {
  group = group || this.root.items[0];
  var mark = createMark(markdef, group);
  group.items[index] = mark;
  if (mark.zindex) mark.group.zdirty = true;
  return mark;
};
function createMark(def, group) {
  return {
    bounds:      new Bounds(),
    clip:        !!def.clip,
    group:       group,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype,
    name:        def.name || undefined,
    role:        def.role || undefined,
    zindex:      def.zindex || 0
  };
}

function domCreate(doc, tag, ns) {
  if (!doc && typeof document !== 'undefined' && document.createElement) {
    doc = document;
  }
  return doc
    ? (ns ? doc.createElementNS(ns, tag) : doc.createElement(tag))
    : null;
}
function domFind(el, tag) {
  tag = tag.toLowerCase();
  var nodes = el.childNodes, i = 0, n = nodes.length;
  for (; i<n; ++i) if (nodes[i].tagName.toLowerCase() === tag) {
    return nodes[i];
  }
}
function domChild(el, index, tag, ns) {
  var a = el.childNodes[index], b;
  if (!a || a.tagName.toLowerCase() !== tag.toLowerCase()) {
    b = a || null;
    a = domCreate(el.ownerDocument, tag, ns);
    el.insertBefore(a, b);
  }
  return a;
}
function domClear(el, index) {
  var nodes = el.childNodes,
      curr = nodes.length;
  while (curr > index) el.removeChild(nodes[--curr]);
  return el;
}
function cssClass(mark) {
  return 'mark-' + mark.marktype
    + (mark.role ? ' role-' + mark.role : '')
    + (mark.name ? ' ' + mark.name : '');
}

function point(event, el) {
  var rect = el.getBoundingClientRect();
  return [
    event.clientX - rect.left - (el.clientLeft || 0),
    event.clientY - rect.top - (el.clientTop || 0)
  ];
}

function resolveItem(item, event, el, origin) {
  var mark = item && item.mark,
      mdef, p;
  if (mark && (mdef = Marks[mark.marktype]).tip) {
    p = point(event, el);
    p[0] -= origin[0];
    p[1] -= origin[1];
    while (item = item.mark.group) {
      p[0] -= item.x || 0;
      p[1] -= item.y || 0;
    }
    item = mdef.tip(mark.items, p);
  }
  return item;
}

function Handler(customLoader, customTooltip) {
  this._active = null;
  this._handlers = {};
  this._loader = customLoader || loader();
  this._tooltip = customTooltip || defaultTooltip;
}
function defaultTooltip(handler, event, item, value) {
  handler.element().setAttribute('title', value || '');
}
var prototype$F = Handler.prototype;
prototype$F.initialize = function(el, origin, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.origin(origin);
};
prototype$F.element = function() {
  return this._el;
};
prototype$F.canvas = function() {
  return this._el && this._el.firstChild;
};
prototype$F.origin = function(origin) {
  if (arguments.length) {
    this._origin = origin || [0, 0];
    return this;
  } else {
    return this._origin.slice();
  }
};
prototype$F.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};
prototype$F.on = function(                 ) {};
prototype$F.off = function(                 ) {};
prototype$F._handlerIndex = function(h, type, handler) {
  for (var i = h ? h.length : 0; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      return i;
    }
  }
  return -1;
};
prototype$F.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};
prototype$F.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};
prototype$F.handleHref = function(event, item, href) {
  this._loader
    .sanitize(href, {context:'href'})
    .then(function(opt) {
      var e = new MouseEvent(event.type, event),
          a = domCreate(null, 'a');
      for (var name in opt) a.setAttribute(name, opt[name]);
      a.dispatchEvent(e);
    })
    .catch(function() {                  });
};
prototype$F.handleTooltip = function(event, item, show) {
  if (item && item.tooltip != null) {
    item = resolveItem(item, event, this.canvas(), this._origin);
    var value = (show && item && item.tooltip) || null;
    this._tooltip.call(this._obj, this, event, item, value);
  }
};
prototype$F.getItemBoundingClientRect = function(item) {
  if (!(el = this.canvas())) return;
  var el, rect = el.getBoundingClientRect(),
      origin = this._origin,
      itemBounds = item.bounds,
      x = itemBounds.x1 + origin[0] + rect.left,
      y = itemBounds.y1 + origin[1] + rect.top,
      w = itemBounds.width(),
      h = itemBounds.height();
  while (item.mark && (item = item.mark.group)) {
    x += item.x || 0;
    y += item.y || 0;
  }
  return {
    x:      x,
    y:      y,
    width:  w,
    height: h,
    left:   x,
    top:    y,
    right:  x + w,
    bottom: y + h
  };
};

function Renderer(loader) {
  this._el = null;
  this._bgcolor = null;
  this._loader = new ResourceLoader(loader);
}
var prototype$G = Renderer.prototype;
prototype$G.initialize = function(el, width, height, origin, scaleFactor) {
  this._el = el;
  return this.resize(width, height, origin, scaleFactor);
};
prototype$G.element = function() {
  return this._el;
};
prototype$G.canvas = function() {
  return this._el && this._el.firstChild;
};
prototype$G.scene = function() {
  return this.canvas();
};
prototype$G.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};
prototype$G.resize = function(width, height, origin, scaleFactor) {
  this._width = width;
  this._height = height;
  this._origin = origin || [0, 0];
  this._scale = scaleFactor || 1;
  return this;
};
prototype$G.dirty = function(        ) {
};
prototype$G.render = function(scene) {
  var r = this;
  r._call = function() { r._render(scene); };
  r._call();
  r._call = null;
  return r;
};
prototype$G._render = function(         ) {
};
prototype$G.renderAsync = function(scene) {
  var r = this.render(scene);
  return this._ready
    ? this._ready.then(function() { return r; })
    : Promise.resolve(r);
};
prototype$G._load = function(method, uri) {
  var r = this,
      p = r._loader[method](uri);
  if (!r._ready) {
    var call = r._call;
    r._ready = r._loader.ready()
      .then(function(redraw) {
        if (redraw) call();
        r._ready = null;
      });
  }
  return p;
};
prototype$G.sanitizeURL = function(uri) {
  return this._load('sanitizeURL', uri);
};
prototype$G.loadImage = function(uri) {
  return this._load('loadImage', uri);
};

var Events = [
  'keydown',
  'keypress',
  'keyup',
  'dragenter',
  'dragleave',
  'dragover',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];
var TooltipShowEvent = 'mousemove';
var TooltipHideEvent = 'mouseout';
var HrefEvent = 'click';

function CanvasHandler(loader, tooltip) {
  Handler.call(this, loader, tooltip);
  this._down = null;
  this._touch = null;
  this._first = true;
}
var prototype$H = inherits(CanvasHandler, Handler);
prototype$H.initialize = function(el, origin, obj) {
  var canvas = this._canvas = el && domFind(el, 'canvas');
  if (canvas) {
    var that = this;
    this.events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        if (prototype$H[type]) {
          prototype$H[type].call(that, evt);
        } else {
          that.fire(type, evt);
        }
      });
    });
  }
  return Handler.prototype.initialize.call(this, el, origin, obj);
};
prototype$H.canvas = function() {
  return this._canvas;
};
prototype$H.context = function() {
  return this._canvas.getContext('2d');
};
prototype$H.events = Events;
prototype$H.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};
function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    var a = this._active,
        p = this.pickEvent(evt);
    if (p === a) {
      this.fire(moveEvent, evt);
    } else {
      if (!a || !a.exit) {
        this.fire(outEvent, evt);
      }
      this._active = p;
      this.fire(overEvent, evt);
      this.fire(moveEvent, evt);
    }
  };
}
function inactive(type) {
  return function(evt) {
    this.fire(type, evt);
    this._active = null;
  };
}
prototype$H.mousemove = move('mousemove', 'mouseover', 'mouseout');
prototype$H.dragover  = move('dragover', 'dragenter', 'dragleave');
prototype$H.mouseout  = inactive('mouseout');
prototype$H.dragleave = inactive('dragleave');
prototype$H.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};
prototype$H.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};
prototype$H.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);
  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }
  this.fire('touchstart', evt, true);
};
prototype$H.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};
prototype$H.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};
prototype$H.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;
  evt.vegaType = type;
  if (type === HrefEvent && a && a.href) {
    this.handleHref(evt, a, a.href);
  } else if (type === TooltipShowEvent || type === TooltipHideEvent) {
    this.handleTooltip(evt, a, type !== TooltipHideEvent);
  }
  if (h) {
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};
prototype$H.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      i = this._handlerIndex(h[name], type, handler);
  if (i < 0) {
    (h[name] || (h[name] = [])).push({
      type:    type,
      handler: handler
    });
  }
  return this;
};
prototype$H.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name],
      i = this._handlerIndex(h, type, handler);
  if (i >= 0) {
    h.splice(i, 1);
  }
  return this;
};
prototype$H.pickEvent = function(evt) {
  var p = point(evt, this._canvas),
      o = this._origin;
  return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
};
prototype$H.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = Marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

function clip$1(context, scene) {
  var clip = scene.clip;
  context.save();
  context.beginPath();
  if (isFunction(clip)) {
    clip(context);
  } else {
    var group = scene.group;
    context.rect(0, 0, group.width || 0, group.height || 0);
  }
  context.clip();
}

function devicePixelRatio() {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}
var pixelRatio = devicePixelRatio();
function resize(canvas, width, height, origin, scaleFactor) {
  var inDOM = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;
  var context = canvas.getContext('2d'),
      ratio = inDOM ? pixelRatio : scaleFactor;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  if (inDOM && ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
  context.pixelRatio = ratio;
  context.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );
  return canvas;
}

function CanvasRenderer(loader) {
  Renderer.call(this, loader);
  this._redraw = false;
  this._dirty = new Bounds();
}
var prototype$I = inherits(CanvasRenderer, Renderer),
    base = Renderer.prototype,
    tempBounds$1 = new Bounds();
prototype$I.initialize = function(el, width, height, origin, scaleFactor) {
  this._canvas = canvas(1, 1);
  if (el) {
    domClear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  return base.initialize.call(this, el, width, height, origin, scaleFactor);
};
prototype$I.resize = function(width, height, origin, scaleFactor) {
  base.resize.call(this, width, height, origin, scaleFactor);
  resize(this._canvas, this._width, this._height, this._origin, this._scale);
  this._redraw = true;
  return this;
};
prototype$I.canvas = function() {
  return this._canvas;
};
prototype$I.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};
prototype$I.dirty = function(item) {
  var b = translate$1(item.bounds, item.mark.group);
  this._dirty.union(b);
};
function clipToBounds(g, b, origin) {
  b.expand(1).round();
  b.translate(-(origin[0] % 1), -(origin[1] % 1));
  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();
  return b;
}
function translate$1(bounds, group) {
  if (group == null) return bounds;
  var b = tempBounds$1.clear().union(bounds);
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}
prototype$I._render = function(scene) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b = this._dirty;
  g.save();
  if (this._redraw || b.empty()) {
    this._redraw = false;
    b = null;
  } else {
    b = clipToBounds(g, b, o);
  }
  this.clear(-o[0], -o[1], w, h);
  this.draw(g, scene, b);
  g.restore();
  this._dirty.clear();
  return this;
};
prototype$I.draw = function(ctx, scene, bounds) {
  var mark = Marks[scene.marktype];
  if (scene.clip) clip$1(ctx, scene);
  mark.draw.call(this, ctx, scene, bounds);
  if (scene.clip) ctx.restore();
};
prototype$I.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h);
  }
};

function SVGHandler(loader, tooltip) {
  Handler.call(this, loader, tooltip);
  var h = this;
  h._hrefHandler = listener(h, function(evt, item) {
    if (item && item.href) h.handleHref(evt, item, item.href);
  });
  h._tooltipHandler = listener(h, function(evt, item) {
    h.handleTooltip(evt, item, evt.type !== TooltipHideEvent);
  });
}
var prototype$J = inherits(SVGHandler, Handler);
prototype$J.initialize = function(el, origin, obj) {
  var svg = this._svg;
  if (svg) {
    svg.removeEventListener(HrefEvent, this._hrefHandler);
    svg.removeEventListener(TooltipShowEvent, this._tooltipHandler);
    svg.removeEventListener(TooltipHideEvent, this._tooltipHandler);
  }
  this._svg = svg = el && domFind(el, 'svg');
  if (svg) {
    svg.addEventListener(HrefEvent, this._hrefHandler);
    svg.addEventListener(TooltipShowEvent, this._tooltipHandler);
    svg.addEventListener(TooltipHideEvent, this._tooltipHandler);
  }
  return Handler.prototype.initialize.call(this, el, origin, obj);
};
prototype$J.canvas = function() {
  return this._svg;
};
function listener(context, handler) {
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(context._obj, evt, item);
  };
}
prototype$J.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      i = this._handlerIndex(h[name], type, handler);
  if (i < 0) {
    var x = {
      type:     type,
      handler:  handler,
      listener: listener(this, handler)
    };
    (h[name] || (h[name] = [])).push(x);
    if (this._svg) {
      this._svg.addEventListener(name, x.listener);
    }
  }
  return this;
};
prototype$J.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name],
      i = this._handlerIndex(h, type, handler);
  if (i >= 0) {
    if (this._svg) {
      this._svg.removeEventListener(name, h[i].listener);
    }
    h.splice(i, 1);
  }
  return this;
};

function openTag(tag, attr, raw) {
  var s = '<' + tag, key, val;
  if (attr) {
    for (key in attr) {
      val = attr[key];
      if (val != null) {
        s += ' ' + key + '="' + val + '"';
      }
    }
  }
  if (raw) s += ' ' + raw;
  return s + '>';
}
function closeTag(tag) {
  return '</' + tag + '>';
}

var metadata = {
  'version': '1.1',
  'xmlns': 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink'
};

var styles = {
  'fill':             'fill',
  'fillOpacity':      'fill-opacity',
  'stroke':           'stroke',
  'strokeOpacity':    'stroke-opacity',
  'strokeWidth':      'stroke-width',
  'strokeCap':        'stroke-linecap',
  'strokeJoin':       'stroke-linejoin',
  'strokeDash':       'stroke-dasharray',
  'strokeDashOffset': 'stroke-dashoffset',
  'strokeMiterLimit': 'stroke-miterlimit',
  'opacity':          'opacity'
};
var styleProperties = Object.keys(styles);

var ns = metadata.xmlns;
function SVGRenderer(loader) {
  Renderer.call(this, loader);
  this._dirtyID = 1;
  this._dirty = [];
  this._svg = null;
  this._root = null;
  this._defs = null;
}
var prototype$K = inherits(SVGRenderer, Renderer);
var base$1 = Renderer.prototype;
prototype$K.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = domChild(el, 0, 'svg', ns);
    this._svg.setAttribute('class', 'marks');
    domClear(el, 1);
    this._root = domChild(this._svg, 0, 'g', ns);
    domClear(this._svg, 1);
  }
  this._defs = {
    gradient: {},
    clipping: {}
  };
  this.background(this._bgcolor);
  return base$1.initialize.call(this, el, width, height, padding);
};
prototype$K.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base$1.background.apply(this, arguments);
};
prototype$K.resize = function(width, height, origin, scaleFactor) {
  base$1.resize.call(this, width, height, origin, scaleFactor);
  if (this._svg) {
    this._svg.setAttribute('width', this._width * this._scale);
    this._svg.setAttribute('height', this._height * this._scale);
    this._svg.setAttribute('viewBox', '0 0 ' + this._width + ' ' + this._height);
    this._root.setAttribute('transform', 'translate(' + this._origin + ')');
  }
  this._dirty = [];
  return this;
};
prototype$K.canvas = function() {
  return this._svg;
};
prototype$K.svg = function() {
  if (!this._svg) return null;
  var attr = {
    class:   'marks',
    width:   this._width * this._scale,
    height:  this._height * this._scale,
    viewBox: '0 0 ' + this._width + ' ' + this._height
  };
  for (var key$$1 in metadata) {
    attr[key$$1] = metadata[key$$1];
  }
  var bg = !this._bgcolor ? ''
    : (openTag('rect', {
        width:  this._width,
        height: this._height,
        style:  'fill: ' + this._bgcolor + ';'
      }) + closeTag('rect'));
  return openTag('svg', attr) + bg + this._svg.innerHTML + closeTag('svg');
};
prototype$K._render = function(scene) {
  if (this._dirtyCheck()) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene);
    domClear(this._root, 1);
  }
  this.updateDefs();
  this._dirty = [];
  ++this._dirtyID;
  return this;
};
prototype$K.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id$$1;
  for (id$$1 in defs.gradient) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id$$1], index++);
  }
  for (id$$1 in defs.clipping) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id$$1], index++);
  }
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      domClear(el, index);
    }
  }
};
function updateGradient(el, grad, index) {
  var i, n, stop;
  el = domChild(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);
  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = domChild(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  domClear(el, i);
}
function updateClipping(el, clip$$1, index) {
  var mask;
  el = domChild(el, index, 'clipPath', ns);
  el.setAttribute('id', clip$$1.id);
  if (clip$$1.path) {
    mask = domChild(el, 0, 'path', ns);
    mask.setAttribute('d', clip$$1.path);
  } else {
    mask = domChild(el, 0, 'rect', ns);
    mask.setAttribute('x', 0);
    mask.setAttribute('y', 0);
    mask.setAttribute('width', clip$$1.width);
    mask.setAttribute('height', clip$$1.height);
  }
}
prototype$K._resetDefs = function() {
  var def = this._defs;
  def.gradient = {};
  def.clipping = {};
};
prototype$K.dirty = function(item) {
  if (item.dirty !== this._dirtyID) {
    item.dirty = this._dirtyID;
    this._dirty.push(item);
  }
};
prototype$K.isDirty = function(item) {
  return this._dirtyAll
    || !item._svg
    || item.dirty === this._dirtyID;
};
prototype$K._dirtyCheck = function() {
  this._dirtyAll = true;
  var items = this._dirty;
  if (!items.length) return true;
  var id$$1 = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    if (mark.marktype !== type) {
      type = mark.marktype;
      mdef = Marks[type];
    }
    if (mark.zdirty && mark.dirty !== id$$1) {
      this._dirtyAll = false;
      dirtyParents(item, id$$1);
      mark.items.forEach(function(i) { i.dirty = id$$1; });
    }
    if (mark.zdirty) continue;
    if (item.exit) {
      if (mdef.nested && mark.items.length) {
        o = mark.items[0];
        if (o._svg) this._update(mdef, o._svg, o);
      } else if (item._svg) {
        o = item._svg.parentNode;
        if (o) o.removeChild(item._svg);
      }
      item._svg = null;
      continue;
    }
    item = (mdef.nested ? mark.items[0] : item);
    if (item._update === id$$1) continue;
    if (!item._svg || !item._svg.ownerSVGElement) {
      this._dirtyAll = false;
      dirtyParents(item, id$$1);
    } else {
      this._update(mdef, item._svg, item);
    }
    item._update = id$$1;
  }
  return !this._dirtyAll;
};
function dirtyParents(item, id$$1) {
  for (; item && item.dirty !== id$$1; item=item.mark.group) {
    item.dirty = id$$1;
    if (item.mark && item.mark.dirty !== id$$1) {
      item.mark.dirty = id$$1;
    } else return;
  }
}
prototype$K.draw = function(el, scene, prev) {
  if (!this.isDirty(scene)) return scene._svg;
  var renderer = this,
      svg = this._svg,
      mdef = Marks[scene.marktype],
      events = scene.interactive === false ? 'none' : null,
      isGroup = mdef.tag === 'g',
      sibling = null,
      i = 0,
      parent;
  parent = bind(scene, el, prev, 'g', svg);
  parent.setAttribute('class', cssClass(scene));
  if (!isGroup) {
    parent.style.setProperty('pointer-events', events);
  }
  if (scene.clip) {
    parent.setAttribute('clip-path', clip(renderer, scene, scene.group));
  } else {
    parent.removeAttribute('clip-path');
  }
  function process(item) {
    var dirty = renderer.isDirty(item),
        node = bind(item, parent, sibling, mdef.tag, svg);
    if (dirty) {
      renderer._update(mdef, node, item);
      if (isGroup) recurse(renderer, node, item);
    }
    sibling = node;
    ++i;
  }
  if (mdef.nested) {
    if (scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }
  domClear(parent, i);
  return parent;
};
function recurse(renderer, el, group) {
  el = el.lastChild;
  var prev, idx = 0;
  visit(group, function(item) {
    prev = renderer.draw(el, item, prev);
    ++idx;
  });
  domClear(el, 1 + idx);
}
function bind(item, el, sibling, tag, svg) {
  var node = item._svg, doc;
  if (!node) {
    doc = el.ownerDocument;
    node = domCreate(doc, tag, ns);
    item._svg = node;
    if (item.mark) {
      node.__data__ = item;
      node.__values__ = {fill: 'default'};
      if (tag === 'g') {
        var bg = domCreate(doc, 'path', ns);
        bg.setAttribute('class', 'background');
        node.appendChild(bg);
        bg.__data__ = item;
        var fg = domCreate(doc, 'g', ns);
        node.appendChild(fg);
        fg.__data__ = item;
      }
    }
  }
  if (node.ownerSVGElement !== svg || hasSiblings(item) && node.previousSibling !== sibling) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }
  return node;
}
function hasSiblings(item) {
  var parent = item.mark || item.group;
  return parent && parent.items.length > 1;
}
var element = null,
    values = null;
var mark_extras = {
  group: function(mdef, el, item) {
    values = el.__values__;
    element = el.childNodes[1];
    mdef.foreground(emit, item, this);
    element = el.childNodes[0];
    mdef.background(emit, item, this);
    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      element.style.setProperty('pointer-events', value);
      values.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = textValue(item);
    if (str !== values.text) {
      el.textContent = str;
      values.text = str;
    }
    str = font(item);
    if (str !== values.font) {
      el.style.setProperty('font', str);
      values.font = str;
    }
  }
};
prototype$K._update = function(mdef, el, item) {
  element = el;
  values = el.__values__;
  mdef.attr(emit, item, this);
  var extra = mark_extras[mdef.type];
  if (extra) extra.call(this, mdef, el, item);
  this.style(element, item);
};
function emit(name, value, ns) {
  if (value === values[name]) return;
  if (value != null) {
    if (ns) {
      element.setAttributeNS(ns, name, value);
    } else {
      element.setAttribute(name, value);
    }
  } else {
    if (ns) {
      element.removeAttributeNS(ns, name);
    } else {
      element.removeAttribute(name);
    }
  }
  values[name] = value;
}
prototype$K.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;
  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    value = o[prop];
    if (value === values[prop]) continue;
    name = styles[prop];
    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none');
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        this._defs.gradient[value.id] = value;
        value = 'url(' + href() + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }
    values[prop] = value;
  }
};
function href() {
  var loc;
  return typeof window === 'undefined' ? ''
    : (loc = window.location).hash ? loc.href.slice(0, -loc.hash.length)
    : loc.href;
}

function SVGStringRenderer(loader) {
  Renderer.call(this, loader);
  this._text = {
    head: '',
    bg:   '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };
  this._defs = {
    gradient: {},
    clipping: {}
  };
}
var prototype$L = inherits(SVGStringRenderer, Renderer);
var base$2 = Renderer.prototype;
prototype$L.resize = function(width, height, origin, scaleFactor) {
  base$2.resize.call(this, width, height, origin, scaleFactor);
  var o = this._origin,
      t = this._text;
  var attr = {
    class:   'marks',
    width:   this._width * this._scale,
    height:  this._height * this._scale,
    viewBox: '0 0 ' + this._width + ' ' + this._height
  };
  for (var key$$1 in metadata) {
    attr[key$$1] = metadata[key$$1];
  }
  t.head = openTag('svg', attr);
  var bg = this._bgcolor;
  if (bg === 'transparent' || bg === 'none') bg = null;
  if (bg) {
    t.bg = openTag('rect', {
      width:  this._width,
      height: this._height,
      style:  'fill: ' + bg + ';'
    }) + closeTag('rect');
  } else {
    t.bg = '';
  }
  t.root = openTag('g', {
    transform: 'translate(' + o + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');
  return this;
};
prototype$L.background = function() {
  var rv = base$2.background.apply(this, arguments);
  if (arguments.length && this._text.head) {
    this.resize(this._width, this._height, this._origin, this._scale);
  }
  return rv;
};
prototype$L.svg = function() {
  var t = this._text;
  return t.head + t.bg + t.defs + t.root + t.body + t.foot;
};
prototype$L._render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};
prototype$L.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id$$1, def, stops;
  for (id$$1 in all.gradient) {
    def = all.gradient[id$$1];
    stops = def.stops;
    defs += openTag('linearGradient', {
      id: id$$1,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });
    for (i=0; i<stops.length; ++i) {
      defs += openTag('stop', {
        offset: stops[i].offset,
        'stop-color': stops[i].color
      }) + closeTag('stop');
    }
    defs += closeTag('linearGradient');
  }
  for (id$$1 in all.clipping) {
    def = all.clipping[id$$1];
    defs += openTag('clipPath', {id: id$$1});
    if (def.path) {
      defs += openTag('path', {
        d: def.path
      }) + closeTag('path');
    } else {
      defs += openTag('rect', {
        x: 0,
        y: 0,
        width: def.width,
        height: def.height
      }) + closeTag('rect');
    }
    defs += closeTag('clipPath');
  }
  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};
var object;
function emit$1(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}
prototype$L.attributes = function(attr, item) {
  object = {};
  attr(emit$1, item, this);
  return object;
};
prototype$L.href = function(item) {
  var that = this,
      href = item.href,
      attr;
  if (href) {
    if (attr = that._hrefs && that._hrefs[href]) {
      return attr;
    } else {
      that.sanitizeURL(href).then(function(attr) {
        attr['xlink:href'] = attr.href;
        attr.href = null;
        (that._hrefs || (that._hrefs = {}))[href] = attr;
      });
    }
  }
  return null;
};
prototype$L.mark = function(scene) {
  var renderer = this,
      mdef = Marks[scene.marktype],
      tag  = mdef.tag,
      defs = this._defs,
      str = '',
      style;
  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }
  str += openTag('g', {
    'class': cssClass(scene),
    'clip-path': scene.clip ? clip(renderer, scene, scene.group) : null
  }, style);
  function process(item) {
    var href = renderer.href(item);
    if (href) str += openTag('a', href);
    style = (tag !== 'g') ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, renderer.attributes(mdef.attr, item), style);
    if (tag === 'text') {
      str += escape_text(textValue(item));
    } else if (tag === 'g') {
      str += openTag('path', renderer.attributes(mdef.background, item),
        applyStyles(item, scene, 'bgrect', defs)) + closeTag('path');
      str += openTag('g', renderer.attributes(mdef.foreground, item))
        + renderer.markGroup(item)
        + closeTag('g');
    }
    str += closeTag(tag);
    if (href) str += closeTag('a');
  }
  if (mdef.nested) {
    if (scene.items && scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }
  return str + closeTag('g');
};
prototype$L.markGroup = function(scene) {
  var renderer = this,
      str = '';
  visit(scene, function(item) {
    str += renderer.mark(item);
  });
  return str;
};
function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';
  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none; ';
  }
  if (tag === 'text') {
    s += 'font: ' + font(o) + '; ';
  }
  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];
    if (value == null) {
      if (name === 'fill') {
        s += 'fill: none; ';
      }
    } else if (value === 'transparent' && (name === 'fill' || name === 'stroke')) {
      s += name + ': none; ';
    } else {
      if (value.id) {
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += name + ': ' + value + '; ';
    }
  }
  return s ? 'style="' + s.trim() + '"' : null;
}
function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

var Canvas = 'canvas';
var PNG = 'png';
var SVG = 'svg';
var None$1 = 'none';
var RenderType = {
  Canvas: Canvas,
  PNG:    PNG,
  SVG:    SVG,
  None:   None$1
};
var modules = {};
modules[Canvas] = modules[PNG] = {
  renderer: CanvasRenderer,
  headless: CanvasRenderer,
  handler:  CanvasHandler
};
modules[SVG] = {
  renderer: SVGRenderer,
  headless: SVGStringRenderer,
  handler:  SVGHandler
};
modules[None$1] = {};
function renderModule(name, _$$1) {
  name = String(name || '').toLowerCase();
  if (arguments.length > 1) {
    modules[name] = _$$1;
    return this;
  } else {
    return modules[name];
  }
}

var clipBounds = new Bounds();
function boundClip(mark) {
  var clip = mark.clip;
  if (isFunction(clip)) {
    clip(context(clipBounds.clear()));
  } else if (clip) {
    clipBounds.set(0, 0, mark.group.width, mark.group.height);
  } else return;
  mark.bounds.intersect(clipBounds);
}

var TOLERANCE = 1e-9;
function sceneEqual(a, b, key$$1) {
  return (a === b) ? true
    : (key$$1 === 'path') ? pathEqual(a, b)
    : (a instanceof Date && b instanceof Date) ? +a === +b
    : (isNumber(a) && isNumber(b)) ? Math.abs(a - b) <= TOLERANCE
    : (!a || !b || !isObject(a) && !isObject(b)) ? a == b
    : (a == null || b == null) ? false
    : objectEqual(a, b);
}
function pathEqual(a, b) {
  return sceneEqual(pathParse(a), pathParse(b));
}
function objectEqual(a, b) {
  var ka = Object.keys(a),
      kb = Object.keys(b),
      key$$1, i;
  if (ka.length !== kb.length) return false;
  ka.sort();
  kb.sort();
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) return false;
  }
  for (i = ka.length - 1; i >= 0; i--) {
    key$$1 = ka[i];
    if (!sceneEqual(a[key$$1], b[key$$1], key$$1)) return false;
  }
  return typeof a === typeof b;
}

function Bound(params) {
  Transform.call(this, null, params);
}
var prototype$M = inherits(Bound, Transform);
prototype$M.transform = function(_$$1, pulse) {
  var view = pulse.dataflow,
      mark = _$$1.mark,
      type = mark.marktype,
      entry = Marks[type],
      bound = entry.bound,
      markBounds = mark.bounds, rebound;
  if (entry.nested) {
    if (mark.items.length) view.dirty(mark.items[0]);
    markBounds = boundItem$1(mark, bound);
    mark.items.forEach(function(item) {
      item.bounds.clear().union(markBounds);
    });
  }
  else if (type === 'group' || _$$1.modified()) {
    pulse.visit(pulse.MOD, function(item) { view.dirty(item); });
    markBounds.clear();
    mark.items.forEach(function(item) {
      markBounds.union(boundItem$1(item, bound));
    });
  }
  else {
    rebound = pulse.changed(pulse.REM);
    pulse.visit(pulse.ADD, function(item) {
      markBounds.union(boundItem$1(item, bound));
    });
    pulse.visit(pulse.MOD, function(item) {
      rebound = rebound || markBounds.alignsWith(item.bounds);
      view.dirty(item);
      markBounds.union(boundItem$1(item, bound));
    });
    if (rebound) {
      markBounds.clear();
      mark.items.forEach(function(item) { markBounds.union(item.bounds); });
    }
  }
  boundClip(mark);
  return pulse.modifies('bounds');
};
function boundItem$1(item, bound, opt) {
  return bound(item.bounds.clear(), item, opt);
}

var COUNTER_NAME = ':vega_identifier:';
function Identifier(params) {
  Transform.call(this, 0, params);
}
Identifier.Definition = {
  "type": "Identifier",
  "metadata": {"modifies": true},
  "params": [
    { "name": "as", "type": "string", "required": true }
  ]
};
var prototype$N = inherits(Identifier, Transform);
prototype$N.transform = function(_$$1, pulse) {
  var counter = getCounter(pulse.dataflow),
      id$$1 = counter.value,
      as = _$$1.as;
  pulse.visit(pulse.ADD, function(t) {
    if (!t[as]) t[as] = ++id$$1;
  });
  counter.set(this.value = id$$1);
  return pulse;
};
function getCounter(view) {
  var counter = view._signals[COUNTER_NAME];
  if (!counter) {
    view._signals[COUNTER_NAME] = (counter = view.add(0));
  }
  return counter;
}

function Mark(params) {
  Transform.call(this, null, params);
}
var prototype$O = inherits(Mark, Transform);
prototype$O.transform = function(_$$1, pulse) {
  var mark = this.value;
  if (!mark) {
    mark = pulse.dataflow.scenegraph().mark(_$$1.markdef, lookup$1(_$$1), _$$1.index);
    mark.group.context = _$$1.context;
    if (!_$$1.context.group) _$$1.context.group = mark.group;
    mark.source = this;
    mark.clip = _$$1.clip;
    mark.interactive = _$$1.interactive;
    this.value = mark;
  }
  var Init = mark.marktype === 'group' ? GroupItem : Item;
  pulse.visit(pulse.ADD, function(item) { Init.call(item, mark); });
  if (_$$1.modified('clip') || _$$1.modified('interactive')) {
    mark.clip = _$$1.clip;
    mark.interactive = !!_$$1.interactive;
    mark.zdirty = true;
    pulse.reflow();
  }
  mark.items = pulse.source;
  return pulse;
};
function lookup$1(_$$1) {
  var g = _$$1.groups, p = _$$1.parent;
  return g && g.size === 1 ? g.get(Object.keys(g.object)[0])
    : g && p ? g.lookup(p)
    : null;
}

var Top = 'top';
var Left = 'left';
var Right = 'right';
var Bottom = 'bottom';

function Overlap(params) {
  Transform.call(this, null, params);
}
var prototype$P = inherits(Overlap, Transform);
var methods = {
  parity: function(items) {
    return items.filter(function(item, i) {
      return i % 2 ? (item.opacity = 0) : 1;
    });
  },
  greedy: function(items) {
    var a;
    return items.filter(function(b, i) {
      if (!i || !intersect(a.bounds, b.bounds)) {
        a = b;
        return 1;
      } else {
        return b.opacity = 0;
      }
    });
  }
};
function intersect(a, b) {
  return !(
    a.x2 - 1 < b.x1 ||
    a.x1 + 1 > b.x2 ||
    a.y2 - 1 < b.y1 ||
    a.y1 + 1 > b.y2
  );
}
function hasOverlap(items) {
  for (var i=1, n=items.length, a=items[0].bounds, b; i<n; a=b, ++i) {
    if (intersect(a, b = items[i].bounds)) return true;
  }
}
function hasBounds(item) {
  var b = item.bounds;
  return b.width() > 1 && b.height() > 1;
}
function boundTest(scale, orient, tolerance) {
  var range = scale.range(),
      b = new Bounds();
  if (orient === Top || orient === Bottom) {
    b.set(range[0], -Infinity, range[1], +Infinity);
  } else {
    b.set(-Infinity, range[0], +Infinity, range[1]);
  }
  b.expand(tolerance || 1);
  return function(item) {
    return b.encloses(item.bounds);
  };
}
prototype$P.transform = function(_$$1, pulse) {
  var reduce = methods[_$$1.method] || methods.parity,
      source = pulse.materialize(pulse.SOURCE).source;
  if (!source) return;
  if (_$$1.sort) {
    source = source.slice().sort(_$$1.sort);
  }
  if (_$$1.method === 'greedy') {
    source = source.filter(hasBounds);
  }
  source.forEach(function(item) { item.opacity = 1; });
  var items = source;
  if (items.length >= 3 && hasOverlap(items)) {
    pulse = pulse.reflow(_$$1.modified()).modifies('opacity');
    do {
      items = reduce(items);
    } while (items.length >= 3 && hasOverlap(items));
    if (items.length < 3 && !peek(source).opacity) {
      if (items.length > 1) peek(items).opacity = 0;
      peek(source).opacity = 1;
    }
  }
  if (_$$1.boundScale) {
    var test = boundTest(_$$1.boundScale, _$$1.boundOrient, _$$1.boundTolerance);
    source.forEach(function(item) {
      if (!test(item)) item.opacity = 0;
    });
  }
  return pulse;
};

function Render(params) {
  Transform.call(this, null, params);
}
var prototype$Q = inherits(Render, Transform);
prototype$Q.transform = function(_$$1, pulse) {
  var view = pulse.dataflow;
  pulse.visit(pulse.ALL, function(item) { view.dirty(item); });
  if (pulse.fields && pulse.fields['zindex']) {
    var item = pulse.source && pulse.source[0];
    if (item) item.mark.zdirty = true;
  }
};

var AxisRole = 'axis',
    LegendRole = 'legend',
    RowHeader = 'row-header',
    RowFooter = 'row-footer',
    RowTitle  = 'row-title',
    ColHeader = 'column-header',
    ColFooter = 'column-footer',
    ColTitle  = 'column-title';
function extractGroups(group) {
  var groups = group.items,
      n = groups.length,
      i = 0, mark, items;
  var views = {
    marks:      [],
    rowheaders: [],
    rowfooters: [],
    colheaders: [],
    colfooters: [],
    rowtitle: null,
    coltitle: null
  };
  for (; i<n; ++i) {
    mark = groups[i];
    items = mark.items;
    if (mark.marktype === 'group') {
      switch (mark.role) {
        case AxisRole:
        case LegendRole:
          break;
        case RowHeader: addAll(items, views.rowheaders); break;
        case RowFooter: addAll(items, views.rowfooters); break;
        case ColHeader: addAll(items, views.colheaders); break;
        case ColFooter: addAll(items, views.colfooters); break;
        case RowTitle:  views.rowtitle = items[0]; break;
        case ColTitle:  views.coltitle = items[0]; break;
        default:        addAll(items, views.marks);
      }
    }
  }
  return views;
}
function addAll(items, array$$1) {
  for (var i=0, n=items.length; i<n; ++i) {
    array$$1.push(items[i]);
  }
}
function bboxFlush(item) {
  return {x1: 0, y1: 0, x2: item.width || 0, y2: item.height || 0};
}
function bboxFull(item) {
  var b = item.bounds.clone();
  return b.empty()
    ? b.set(0, 0, 0, 0)
    : b.translate(-(item.x||0), -(item.y||0));
}
function boundFlush(item, field$$1) {
  return field$$1 === 'x1' ? (item.x || 0)
    : field$$1 === 'y1' ? (item.y || 0)
    : field$$1 === 'x2' ? (item.x || 0) + (item.width || 0)
    : field$$1 === 'y2' ? (item.y || 0) + (item.height || 0)
    : undefined;
}
function boundFull(item, field$$1) {
  return item.bounds[field$$1];
}
function get$1(opt, key$$1, d) {
  var v = isObject(opt) ? opt[key$$1] : opt;
  return v != null ? v : (d !== undefined ? d : 0);
}
function offsetValue(v) {
  return v < 0 ? Math.ceil(-v) : 0;
}
function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush$$1 = opt.bounds === 'flush',
      bbox = flush$$1 ? bboxFlush : bboxFull,
      bounds = new Bounds(0, 0, 0, 0),
      alignCol = get$1(opt.align, 'column'),
      alignRow = get$1(opt.align, 'row'),
      padCol = get$1(opt.padding, 'column'),
      padRow = get$1(opt.padding, 'row'),
      off = opt.offset,
      ncols = group.columns || opt.columns || groups.length,
      nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
      cells = nrows * ncols,
      xOffset = [], xExtent = [], xInit = 0,
      yOffset = [], yExtent = [], yInit = 0,
      n = groups.length,
      m, i, c, r, b, g, px, py, x, y, band, extent$$1, offset;
  for (i=0; i<ncols; ++i) {
    xExtent[i] = 0;
  }
  for (i=0; i<nrows; ++i) {
    yExtent[i] = 0;
  }
  for (i=0; i<n; ++i) {
    b = bbox(groups[i]);
    c = i % ncols;
    r = ~~(i / ncols);
    px = c ? Math.ceil(bbox(groups[i-1]).x2): 0;
    py = r ? Math.ceil(bbox(groups[i-ncols]).y2): 0;
    xExtent[c] = Math.max(xExtent[c], px);
    yExtent[r] = Math.max(yExtent[r], py);
    xOffset.push(padCol + offsetValue(b.x1));
    yOffset.push(padRow + offsetValue(b.y1));
    view.dirty(groups[i]);
  }
  for (i=0; i<n; ++i) {
    if (i % ncols === 0) xOffset[i] = xInit;
    if (i < ncols) yOffset[i] = yInit;
  }
  if (alignCol === 'each') {
    for (c=1; c<ncols; ++c) {
      for (offset=0, i=c; i<n; i += ncols) {
        if (offset < xOffset[i]) offset = xOffset[i];
      }
      for (i=c; i<n; i += ncols) {
        xOffset[i] = offset + xExtent[c];
      }
    }
  } else if (alignCol === 'all') {
    for (extent$$1=0, c=1; c<ncols; ++c) {
      if (extent$$1 < xExtent[c]) extent$$1 = xExtent[c];
    }
    for (offset=0, i=0; i<n; ++i) {
      if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
    }
    for (i=0; i<n; ++i) {
      if (i % ncols) xOffset[i] = offset + extent$$1;
    }
  } else {
    for (c=1; c<ncols; ++c) {
      for (i=c; i<n; i += ncols) {
        xOffset[i] += xExtent[c];
      }
    }
  }
  if (alignRow === 'each') {
    for (r=1; r<nrows; ++r) {
      for (offset=0, i=r*ncols, m=i+ncols; i<m; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i=r*ncols; i<m; ++i) {
        yOffset[i] = offset + yExtent[r];
      }
    }
  } else if (alignRow === 'all') {
    for (extent$$1=0, r=1; r<nrows; ++r) {
      if (extent$$1 < yExtent[r]) extent$$1 = yExtent[r];
    }
    for (offset=0, i=ncols; i<n; ++i) {
      if (offset < yOffset[i]) offset = yOffset[i];
    }
    for (i=ncols; i<n; ++i) {
      yOffset[i] = offset + extent$$1;
    }
  } else {
    for (r=1; r<nrows; ++r) {
      for (i=r*ncols, m=i+ncols; i<m; ++i) {
        yOffset[i] += yExtent[r];
      }
    }
  }
  for (x=0, i=0; i<n; ++i) {
    g = groups[i];
    px = g.x || 0;
    g.x = (x = xOffset[i] + (i % ncols ? x : 0));
    g.bounds.translate(x - px, 0);
  }
  for (c=0; c<ncols; ++c) {
    for (y=0, i=c; i<n; i += ncols) {
      g = groups[i];
      py = g.y || 0;
      g.y = (y += yOffset[i]);
      g.bounds.translate(0, y - py);
    }
  }
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) {
    g = groups[i];
    view.dirty(g);
    bounds.union(g.mark.bounds.union(g.bounds));
  }
  function min(a, b) { return Math.floor(Math.min(a, b)); }
  function max(a, b) { return Math.ceil(Math.max(a, b)); }
  bbox = flush$$1 ? boundFlush : boundFull;
  band = get$1(opt.headerBand, 'row', null);
  x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get$1(off, 'rowHeader'),    min, 0, bbox, 'x1', 0, ncols, 1, band);
  band = get$1(opt.headerBand, 'column', null);
  y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get$1(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols, band);
  band = get$1(opt.footerBand, 'row', null);
  layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get$1(off, 'rowFooter'),    max, 0, bbox, 'x2', ncols-1, ncols, 1, band);
  band = get$1(opt.footerBand, 'column', null);
  layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get$1(off, 'columnFooter'), max, 1, bbox, 'y2', cells-ncols, 1, ncols, band);
  if (views.rowtitle) {
    offset = x - get$1(off, 'rowTitle');
    band = get$1(opt.titleBand, 'row', 0.5);
    layoutTitle(view, views.rowtitle, offset, 0, bounds, band);
  }
  if (views.coltitle) {
    offset = y - get$1(off, 'columnTitle');
    band = get$1(opt.titleBand, 'column', 0.5);
    layoutTitle(view, views.coltitle, offset, 1, bounds, band);
  }
}
function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back, band) {
  var n = groups.length,
      init = 0,
      edge = 0,
      i, j, k, m, b, h, g, x, y;
  if (!n) return init;
  for (i=start; i<n; i+=stride) {
    if (groups[i]) init = agg(init, bound(groups[i], bf));
  }
  if (!headers.length) return init;
  if (headers.length > limit) {
    view.warn('Grid headers exceed limit: ' + limit);
    headers = headers.slice(0, limit);
  }
  init += offset;
  for (j=0, m=headers.length; j<m; ++j) {
    view.dirty(headers[j]);
    headers[j].mark.bounds.clear();
  }
  for (i=start, j=0, m=headers.length; j<m; ++j, i+=stride) {
    h = headers[j];
    b = h.mark.bounds;
    for (k=i; k >= 0 && (g = groups[k]) == null; k-=back);
    if (isX) {
      x = band == null ? g.x : Math.round(g.bounds.x1 + band * g.bounds.width());
      y = init;
    } else {
      x = init;
      y = band == null ? g.y : Math.round(g.bounds.y1 + band * g.bounds.height());
    }
    b.union(h.bounds.translate(x - (h.x || 0), y - (h.y || 0)));
    h.x = x;
    h.y = y;
    view.dirty(h);
    edge = agg(edge, b[bf]);
  }
  return edge;
}
function layoutTitle(view, g, offset, isX, bounds, band) {
  if (!g) return;
  view.dirty(g);
  var x = offset, y = offset;
  isX
    ? (x = Math.round(bounds.x1 + band * bounds.width()))
    : (y = Math.round(bounds.y1 + band * bounds.height()));
  g.bounds.translate(x - (g.x || 0), y - (g.y || 0));
  g.mark.bounds.clear().union(g.bounds);
  g.x = x;
  g.y = y;
  view.dirty(g);
}

var Fit = 'fit',
    FitX = 'fit-x',
    FitY = 'fit-y',
    Pad = 'pad',
    None$2 = 'none',
    Padding = 'padding';
var AxisRole$1 = 'axis',
    TitleRole = 'title',
    FrameRole = 'frame',
    LegendRole$1 = 'legend',
    ScopeRole = 'scope',
    RowHeader$1 = 'row-header',
    RowFooter$1 = 'row-footer',
    ColHeader$1 = 'column-header',
    ColFooter$1 = 'column-footer';
var AxisOffset = 0.5,
    tempBounds$2 = new Bounds();
function ViewLayout(params) {
  Transform.call(this, null, params);
}
var prototype$R = inherits(ViewLayout, Transform);
prototype$R.transform = function(_$$1, pulse) {
  var view = pulse.dataflow;
  _$$1.mark.items.forEach(function(group) {
    if (_$$1.layout) gridLayout(view, group, _$$1.layout);
    layoutGroup(view, group, _$$1);
  });
  return pulse;
};
function layoutGroup(view, group, _$$1) {
  var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new Bounds().set(0, 0, width, height),
      axisBounds = viewBounds.clone(),
      xBounds = viewBounds.clone(),
      yBounds = viewBounds.clone(),
      legends = [], title,
      mark, flow, b, i, n;
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole$1:
        axisBounds.union(b = layoutAxis(view, mark, width, height));
        (isYAxis(mark) ? xBounds : yBounds).union(b);
        break;
      case TitleRole:
        title = mark; break;
      case LegendRole$1:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
      case RowHeader$1:
      case RowFooter$1:
      case ColHeader$1:
      case ColFooter$1:
        xBounds.union(mark.bounds);
        yBounds.union(mark.bounds);
        break;
      default:
        viewBounds.union(mark.bounds);
    }
  }
  if (title) {
    axisBounds.union(b = layoutTitle$1(view, title, axisBounds));
    (isYAxis(title) ? xBounds : yBounds).union(b);
  }
  if (legends.length) {
    flow = {left: 0, right: 0, top: 0, bottom: 0, margin: _$$1.legendMargin || 8};
    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(view, legends[i], flow, xBounds, yBounds, width, height);
      if (_$$1.autosize && _$$1.autosize.type === Fit) {
        var orient = legends[i].items[0].datum.orient;
        if (orient === Left || orient === Right) {
          viewBounds.add(b.x1, 0).add(b.x2, 0);
        } else if (orient === Top || orient === Bottom) {
          viewBounds.add(0, b.y1).add(0, b.y2);
        }
      } else {
        viewBounds.union(b);
      }
    }
  }
  viewBounds.union(xBounds).union(yBounds).union(axisBounds);
  layoutSize(view, group, viewBounds, _$$1);
}
function set(item, property, value) {
  if (item[property] === value) {
    return 0;
  } else {
    item[property] = value;
    return 1;
  }
}
function isYAxis(mark) {
  var orient = mark.items[0].datum.orient;
  return orient === Left || orient === Right;
}
function axisIndices(datum) {
  var index = +datum.grid;
  return [
    datum.ticks  ? index++ : -1,
    datum.labels ? index++ : -1,
    index + (+datum.domain)
  ];
}
function layoutAxis(view, axis, width, height) {
  var item = axis.items[0],
      datum = item.datum,
      orient = datum.orient,
      indices = axisIndices(datum),
      range = item.range,
      offset = item.offset,
      position = item.position,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[indices[2]].items[0],
      titlePadding = item.titlePadding,
      bounds = item.bounds,
      x = 0, y = 0, i, s;
  tempBounds$2.clear().union(bounds);
  bounds.clear();
  if ((i=indices[0]) > -1) bounds.union(item.items[i].bounds);
  if ((i=indices[1]) > -1) bounds.union(item.items[i].bounds);
  switch (orient) {
    case Top:
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 0, -1, bounds);
      bounds.add(0, -s).add(range, 0);
      break;
    case Left:
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 1, -1, bounds);
      bounds.add(-s, 0).add(0, range);
      break;
    case Right:
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 1, 1, bounds);
      bounds.add(0, 0).add(s, range);
      break;
    case Bottom:
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) s = layoutAxisTitle(title, s, titlePadding, 0, 1, bounds);
      bounds.add(0, 0).add(range, s);
      break;
    default:
      x = item.x;
      y = item.y;
  }
  boundStroke(bounds.translate(x, y), item);
  if (set(item, 'x', x + AxisOffset) | set(item, 'y', y + AxisOffset)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }
  return item.mark.bounds.clear().union(bounds);
}
function layoutAxisTitle(title, offset, pad$$1, isYAxis, sign, bounds) {
  var b = title.bounds, dx = 0, dy = 0;
  if (title.auto) {
    offset += pad$$1;
    isYAxis
      ? dx = (title.x || 0) - (title.x = sign * offset)
      : dy = (title.y || 0) - (title.y = sign * offset);
    b.translate(-dx, -dy);
    title.mark.bounds.set(b.x1, b.y1, b.x2, b.y2);
    if (isYAxis) {
      bounds.add(0, b.y1).add(0, b.y2);
      offset += b.width();
    } else {
      bounds.add(b.x1, 0).add(b.x2, 0);
      offset += b.height();
    }
  } else {
    bounds.union(b);
  }
  return offset;
}
function layoutTitle$1(view, title, axisBounds) {
  var item = title.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0, y = 0;
  tempBounds$2.clear().union(bounds);
  switch (orient) {
    case Top:
      x = item.x;
      y = axisBounds.y1 - offset;
      break;
    case Left:
      x = axisBounds.x1 - offset;
      y = item.y;
      break;
    case Right:
      x = axisBounds.x2 + offset;
      y = item.y;
      break;
    case Bottom:
      x = item.x;
      y = axisBounds.y2 + offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }
  bounds.translate(x - item.x, y - item.y);
  if (set(item, 'x', x) | set(item, 'y', y)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }
  return title.bounds.clear().union(bounds);
}
function layoutLegend(view, legend, flow, xBounds, yBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0,
      y = 0,
      w, h, axisBounds;
  if (orient === Top || orient === Bottom) {
    axisBounds = yBounds,
    x = flow[orient];
  } else if (orient === Left || orient === Right) {
    axisBounds = xBounds;
    y = flow[orient];
  }
  tempBounds$2.clear().union(bounds);
  bounds.clear();
  item.items.forEach(function(_$$1) { bounds.union(_$$1.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;
  switch (orient) {
    case Left:
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case Right:
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case Top:
      y -= h + offset - Math.floor(axisBounds.y1);
      flow.top += w + flow.margin;
      break;
    case Bottom:
      y += offset + Math.ceil(axisBounds.y2);
      flow.bottom += w + flow.margin;
      break;
    case 'top-left':
      x += offset;
      y += offset;
      break;
    case 'top-right':
      x += width - w - offset;
      y += offset;
      break;
    case 'bottom-left':
      x += offset;
      y += height - h - offset;
      break;
    case 'bottom-right':
      x += width - w - offset;
      y += height - h - offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }
  boundStroke(bounds.set(x, y, x + w, y + h), item);
  if (set(item, 'x', x) | set(item, 'width', w) |
      set(item, 'y', y) | set(item, 'height', h)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }
  return item.mark.bounds.clear().union(bounds);
}
function layoutSize(view, group, viewBounds, _$$1) {
  var auto = _$$1.autosize || {},
      type = auto.type,
      viewWidth = view._width,
      viewHeight = view._height,
      padding = view.padding();
  if (view._autosize < 1 || !type) return;
  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));
  if (auto.contains === Padding) {
    viewWidth -= padding.left + padding.right;
    viewHeight -= padding.top + padding.bottom;
  }
  if (type === None$2) {
    left = 0;
    top = 0;
    width = viewWidth;
    height = viewHeight;
  }
  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }
  else if (type === FitX) {
    width = Math.max(0, viewWidth - left - right);
    viewHeight = height + top + bottom;
  }
  else if (type === FitY) {
    viewWidth = width + left + right;
    height = Math.max(0, viewHeight - top - bottom);
  }
  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
  }
  view._resizeView(
    viewWidth, viewHeight,
    width, height,
    [left, top],
    auto.resize
  );
}



var vtx = /*#__PURE__*/Object.freeze({
  bound: Bound,
  identifier: Identifier,
  mark: Mark,
  overlap: Overlap,
  render: Render,
  viewlayout: ViewLayout
});

var Log = 'log';
var Pow = 'pow';
var Utc = 'utc';
var Sqrt = 'sqrt';
var Band = 'band';
var Time = 'time';
var Point = 'point';
var Linear = 'linear';
var Ordinal = 'ordinal';
var Quantile = 'quantile';
var Quantize = 'quantize';
var Threshold = 'threshold';
var BinLinear = 'bin-linear';
var BinOrdinal = 'bin-ordinal';
var Sequential = 'sequential';

function bandSpace(count, paddingInner, paddingOuter) {
  var space = count - paddingInner + paddingOuter * 2;
  return count ? (space > 0 ? space : 1) : 0;
}

function invertRange(scale) {
  return function(_$$1) {
    var lo = _$$1[0],
        hi = _$$1[1],
        t;
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    return [
      scale.invert(lo),
      scale.invert(hi)
    ];
  }
}

function invertRangeExtent(scale) {
  return function(_$$1) {
    var range = scale.range(),
        lo = _$$1[0],
        hi = _$$1[1],
        min = -1, max, t, i, n;
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    for (i=0, n=range.length; i<n; ++i) {
      if (range[i] >= lo && range[i] <= hi) {
        if (min < 0) min = i;
        max = i;
      }
    }
    if (min < 0) return undefined;
    lo = scale.invertExtent(range[min]);
    hi = scale.invertExtent(range[max]);
    return [
      lo[0] === undefined ? lo[1] : lo[0],
      hi[1] === undefined ? hi[0] : hi[1]
    ];
  }
}

function band() {
  var scale = $.scaleOrdinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;
  delete scale.unknown;
  function rescale() {
    var n = domain().length,
        reverse = range[1] < range[0],
        start = range[reverse - 0],
        stop = range[1 - reverse],
        space = bandSpace(n, paddingInner, paddingOuter);
    step = (stop - start) / (space || 1);
    if (round) {
      step = Math.floor(step);
    }
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) {
      start = Math.round(start);
      bandwidth = Math.round(bandwidth);
    }
    var values = d3Array.range(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }
  scale.domain = function(_$$1) {
    if (arguments.length) {
      domain(_$$1);
      return rescale();
    } else {
      return domain();
    }
  };
  scale.range = function(_$$1) {
    if (arguments.length) {
      range = [+_$$1[0], +_$$1[1]];
      return rescale();
    } else {
      return range.slice();
    }
  };
  scale.rangeRound = function(_$$1) {
    range = [+_$$1[0], +_$$1[1]];
    round = true;
    return rescale();
  };
  scale.bandwidth = function() {
    return bandwidth;
  };
  scale.step = function() {
    return step;
  };
  scale.round = function(_$$1) {
    if (arguments.length) {
      round = !!_$$1;
      return rescale();
    } else {
      return round;
    }
  };
  scale.padding = function(_$$1) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _$$1));
      paddingInner = paddingOuter;
      return rescale();
    } else {
      return paddingInner;
    }
  };
  scale.paddingInner = function(_$$1) {
    if (arguments.length) {
      paddingInner = Math.max(0, Math.min(1, _$$1));
      return rescale();
    } else {
      return paddingInner;
    }
  };
  scale.paddingOuter = function(_$$1) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _$$1));
      return rescale();
    } else {
      return paddingOuter;
    }
  };
  scale.align = function(_$$1) {
    if (arguments.length) {
      align = Math.max(0, Math.min(1, _$$1));
      return rescale();
    } else {
      return align;
    }
  };
  scale.invertRange = function(_$$1) {
    if (_$$1[0] == null || _$$1[1] == null) return;
    var lo = +_$$1[0],
        hi = +_$$1[1],
        reverse = range[1] < range[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1, a, b, t;
    if (lo !== lo || hi !== hi) return;
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    if (hi < values[0] || lo > range[1-reverse]) return;
    a = Math.max(0, d3Array.bisectRight(values, lo) - 1);
    b = lo===hi ? a : d3Array.bisectRight(values, hi) - 1;
    if (lo - values[a] > bandwidth + 1e-10) ++a;
    if (reverse) {
      t = a;
      a = n - b;
      b = n - t;
    }
    return (a > b) ? undefined : domain().slice(a, b+1);
  };
  scale.invert = function(_$$1) {
    var value = scale.invertRange([_$$1, _$$1]);
    return value ? value[0] : value;
  };
  scale.copy = function() {
    return band()
        .domain(domain())
        .range(range)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };
  return rescale();
}
function pointish(scale) {
  var copy = scale.copy;
  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  scale.copy = function() {
    return pointish(copy());
  };
  return scale;
}
function point$1() {
  return pointish(band().paddingInner(1));
}

var map = Array.prototype.map,
    slice = Array.prototype.slice;
function numbers$1(_$$1) {
  return map.call(_$$1, function(x) { return +x; });
}
function binLinear() {
  var linear = $.scaleLinear(),
      domain = [];
  function scale(x) {
    return linear(x);
  }
  function setDomain(_$$1) {
    domain = numbers$1(_$$1);
    linear.domain([domain[0], peek(domain)]);
  }
  scale.domain = function(_$$1) {
    return arguments.length ? (setDomain(_$$1), scale) : domain.slice();
  };
  scale.range = function(_$$1) {
    return arguments.length ? (linear.range(_$$1), scale) : linear.range();
  };
  scale.rangeRound = function(_$$1) {
    return arguments.length ? (linear.rangeRound(_$$1), scale) : linear.rangeRound();
  };
  scale.interpolate = function(_$$1) {
    return arguments.length ? (linear.interpolate(_$$1), scale) : linear.interpolate();
  };
  scale.invert = function(_$$1) {
    return linear.invert(_$$1);
  };
  scale.ticks = function(count) {
    var n = domain.length,
        stride = ~~(n / (count || n));
    return stride < 2
      ? scale.domain()
      : domain.filter(function(x, i) { return !(i % stride); });
  };
  scale.tickFormat = function() {
    return linear.tickFormat.apply(linear, arguments);
  };
  scale.copy = function() {
    return binLinear().domain(scale.domain()).range(scale.range());
  };
  return scale;
}
function binOrdinal() {
  var domain = [],
      range = [];
  function scale(x) {
    return x == null || x !== x
      ? undefined
      : range[(d3Array.bisect(domain, x) - 1) % range.length];
  }
  scale.domain = function(_$$1) {
    if (arguments.length) {
      domain = numbers$1(_$$1);
      return scale;
    } else {
      return domain.slice();
    }
  };
  scale.range = function(_$$1) {
    if (arguments.length) {
      range = slice.call(_$$1);
      return scale;
    } else {
      return range.slice();
    }
  };
  scale.tickFormat = function() {
    var linear = $.scaleLinear().domain([domain[0], peek(domain)]);
    return linear.tickFormat.apply(linear, arguments);
  };
  scale.copy = function() {
    return binOrdinal().domain(scale.domain()).range(scale.range());
  };
  return scale;
}

function sequential(interpolator) {
  var linear = $.scaleLinear(),
      x0 = 0,
      dx = 1,
      clamp = false;
  function update() {
    var domain = linear.domain();
    x0 = domain[0];
    dx = peek(domain) - x0;
  }
  function scale(x) {
    var t = (x - x0) / dx;
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }
  scale.clamp = function(_$$1) {
    if (arguments.length) {
      clamp = !!_$$1;
      return scale;
    } else {
      return clamp;
    }
  };
  scale.domain = function(_$$1) {
    return arguments.length ? (linear.domain(_$$1), update(), scale) : linear.domain();
  };
  scale.interpolator = function(_$$1) {
    if (arguments.length) {
      interpolator = _$$1;
      return scale;
    } else {
      return interpolator;
    }
  };
  scale.copy = function() {
    return sequential().domain(linear.domain()).clamp(clamp).interpolator(interpolator);
  };
  scale.ticks = function(count) {
    return linear.ticks(count);
  };
  scale.tickFormat = function(count, specifier) {
    return linear.tickFormat(count, specifier);
  };
  scale.nice = function(count) {
    return linear.nice(count), update(), scale;
  };
  return scale;
}

function create(type, constructor) {
  return function scale() {
    var s = constructor();
    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }
    s.type = type;
    return s;
  };
}
function scale$1(type, scale) {
  if (arguments.length > 1) {
    scales[type] = create(type, scale);
    return this;
  } else {
    return scales.hasOwnProperty(type) ? scales[type] : undefined;
  }
}
var scales = {
  identity:      $.scaleIdentity,
  linear:        $.scaleLinear,
  log:           $.scaleLog,
  ordinal:       $.scaleOrdinal,
  pow:           $.scalePow,
  sqrt:          $.scaleSqrt,
  quantile:      $.scaleQuantile,
  quantize:      $.scaleQuantize,
  threshold:     $.scaleThreshold,
  time:          $.scaleTime,
  utc:           $.scaleUtc,
  band:          band,
  point:         point$1,
  sequential:    sequential,
  'bin-linear':  binLinear,
  'bin-ordinal': binOrdinal
};
for (var key$1 in scales) {
  scale$1(key$1, scales[key$1]);
}

function interpolateRange(interpolator, range) {
  var start = range[0],
      span$$1 = peek(range) - start;
  return function(i) { return interpolator(start + i * span$$1); };
}
function scaleFraction(scale, min, max) {
  var delta = max - min;
  return !delta || !isFinite(delta) ? constant(0)
    : scale.type === 'linear' || scale.type === 'sequential'
      ? function(_$$1) { return (_$$1 - min) / delta; }
      : scale.copy().domain([min, max]).range([0, 1]).interpolate(lerp$1);
}
function lerp$1(a, b) {
  var span$$1 = b - a;
  return function(i) { return a + i * span$$1; }
}
function interpolate(type, gamma) {
  var interp = $$1[method(type)];
  return (gamma != null && interp && interp.gamma)
    ? interp.gamma(gamma)
    : interp;
}
function method(type) {
  return 'interpolate' + type.toLowerCase()
    .split('-')
    .map(function(s) { return s[0].toUpperCase() + s.slice(1); })
    .join('');
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}
var category20 = colors(
  '1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5'
);
var category20b = colors(
  '393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6'
);
var category20c = colors(
  '3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9'
);
var tableau10 = colors(
  '4c78a8f58518e4575672b7b254a24beeca3bb279a2ff9da69d755dbab0ac'
);
var tableau20 = colors(
  '4c78a89ecae9f58518ffbf7954a24b88d27ab79a20f2cf5b43989483bcb6e45756ff9d9879706ebab0acd67195fcbfd2b279a2d6a5c99e765fd8b5a5'
);
var blueOrange = new Array(3).concat(
  "67a9cff7f7f7f1a340",
  "0571b092c5defdb863e66101",
  "0571b092c5def7f7f7fdb863e66101",
  "2166ac67a9cfd1e5f0fee0b6f1a340b35806",
  "2166ac67a9cfd1e5f0f7f7f7fee0b6f1a340b35806",
  "2166ac4393c392c5ded1e5f0fee0b6fdb863e08214b35806",
  "2166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b35806",
  "0530612166ac4393c392c5ded1e5f0fee0b6fdb863e08214b358067f3b08",
  "0530612166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors);

var discretized = {
  blueorange:  blueOrange
};
var schemes = {
  category10:  _.schemeCategory10,
  accent:      _.schemeAccent,
  dark2:       _.schemeDark2,
  paired:      _.schemePaired,
  pastel1:     _.schemePastel1,
  pastel2:     _.schemePastel2,
  set1:        _.schemeSet1,
  set2:        _.schemeSet2,
  set3:        _.schemeSet3,
  category20:  category20,
  category20b: category20b,
  category20c: category20c,
  tableau10:   tableau10,
  tableau20:   tableau20,
  viridis:     _.interpolateViridis,
  magma:       _.interpolateMagma,
  inferno:     _.interpolateInferno,
  plasma:      _.interpolatePlasma,
  rainbow:     _.interpolateRainbow,
  sinebow:     _.interpolateSinebow,
  blueorange:  $$1.interpolateRgbBasis(peek(blueOrange))
};
function add$2(name, suffix) {
  schemes[name] = _['interpolate' + suffix];
  discretized[name] = _['scheme' + suffix];
}
add$2('blues',    'Blues');
add$2('greens',   'Greens');
add$2('greys',    'Greys');
add$2('purples',  'Purples');
add$2('reds',     'Reds');
add$2('oranges',  'Oranges');
add$2('brownbluegreen',    'BrBG');
add$2('purplegreen',       'PRGn');
add$2('pinkyellowgreen',   'PiYG');
add$2('purpleorange',      'PuOr');
add$2('redblue',           'RdBu');
add$2('redgrey',           'RdGy');
add$2('redyellowblue',     'RdYlBu');
add$2('redyellowgreen',    'RdYlGn');
add$2('spectral',          'Spectral');
add$2('bluegreen',         'BuGn');
add$2('bluepurple',        'BuPu');
add$2('greenblue',         'GnBu');
add$2('orangered',         'OrRd');
add$2('purplebluegreen',   'PuBuGn');
add$2('purpleblue',        'PuBu');
add$2('purplered',         'PuRd');
add$2('redpurple',         'RdPu');
add$2('yellowgreenblue',   'YlGnBu');
add$2('yellowgreen',       'YlGn');
add$2('yelloworangebrown', 'YlOrBr');
add$2('yelloworangered',   'YlOrRd');
function scheme(name, scheme) {
  if (arguments.length > 1) {
    schemes[name] = scheme;
    return this;
  }
  var part = name.split('-');
  name = part[0];
  part = +part[1] + 1;
  return part && discretized.hasOwnProperty(name) ? discretized[name][part-1]
    : !part && schemes.hasOwnProperty(name) ? schemes[name]
    : undefined;
}

var time = {
  millisecond: d3Time.timeMillisecond,
  second:      d3Time.timeSecond,
  minute:      d3Time.timeMinute,
  hour:        d3Time.timeHour,
  day:         d3Time.timeDay,
  week:        d3Time.timeWeek,
  month:       d3Time.timeMonth,
  year:        d3Time.timeYear
};
var utc = {
  millisecond: d3Time.utcMillisecond,
  second:      d3Time.utcSecond,
  minute:      d3Time.utcMinute,
  hour:        d3Time.utcHour,
  day:         d3Time.utcDay,
  week:        d3Time.utcWeek,
  month:       d3Time.utcMonth,
  year:        d3Time.utcYear
};
function timeInterval(name) {
  return time.hasOwnProperty(name) && time[name];
}
function utcInterval(name) {
  return utc.hasOwnProperty(name) && utc[name];
}

function tickCount(scale, count) {
  var step;
  if (isObject(count)) {
    step = count.step;
    count = count.interval;
  }
  if (isString(count)) {
    count = scale.type === 'time' ? timeInterval(count)
      : scale.type === 'utc' ? utcInterval(count)
      : error('Only time and utc scales accept interval strings.');
    if (step) count = count.every(step);
  }
  return count;
}
function validTicks(scale, ticks, count) {
  var range = scale.range(),
      lo = range[0],
      hi = peek(range);
  if (lo > hi) {
    range = hi;
    hi = lo;
    lo = range;
  }
  ticks = ticks.filter(function(v) {
    v = scale(v);
    return !(v < lo || v > hi)
  });
  if (count > 0 && ticks.length > 1) {
    var endpoints = [ticks[0], peek(ticks)];
    while (ticks.length > count && ticks.length >= 3) {
      ticks = ticks.filter(function(_$$1, i) { return !(i % 2); });
    }
    if (ticks.length < 3) {
      ticks = endpoints;
    }
  }
  return ticks;
}
function tickValues(scale, count) {
  return scale.ticks ? scale.ticks(count) : scale.domain();
}
function tickFormat(scale, count, specifier) {
  var format = scale.tickFormat
    ? scale.tickFormat(count, specifier)
    : String;
  return (scale.type === Log)
    ? filter$1(format, variablePrecision(specifier))
    : format;
}
function filter$1(sourceFormat, targetFormat) {
  return function(_$$1) {
    return sourceFormat(_$$1) ? targetFormat(_$$1) : '';
  };
}
function variablePrecision(specifier) {
  var s = d3Format.formatSpecifier(specifier || ',');
  if (s.precision == null) {
    s.precision = 12;
    switch (s.type) {
      case '%': s.precision -= 2; break;
      case 'e': s.precision -= 1; break;
    }
    return trimZeroes(
      d3Format.format(s),
      d3Format.format('.1f')(1)[1]
    );
  } else {
    return d3Format.format(s);
  }
}
function trimZeroes(format, decimalChar) {
  return function(x) {
    var str = format(x),
        dec = str.indexOf(decimalChar),
        idx, end;
    if (dec < 0) return str;
    idx = rightmostDigit(str, dec);
    end = idx < str.length ? str.slice(idx) : '';
    while (--idx > dec) if (str[idx] !== '0') { ++idx; break; }
    return str.slice(0, idx) + end;
  };
}
function rightmostDigit(str, dec) {
  var i = str.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=str.length; --i > dec;) {
    c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return i + 1;
  }
}

function AxisTicks(params) {
  Transform.call(this, null, params);
}
var prototype$S = inherits(AxisTicks, Transform);
prototype$S.transform = function(_$$1, pulse) {
  if (this.value && !_$$1.modified()) {
    return pulse.StopPropagation;
  }
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      ticks = this.value,
      scale = _$$1.scale,
      count = _$$1.count == null ? (_$$1.values ? _$$1.values.length : 10) : tickCount(scale, _$$1.count),
      format = _$$1.format || tickFormat(scale, count, _$$1.formatSpecifier),
      values = _$$1.values ? validTicks(scale, _$$1.values, count) : tickValues(scale, count);
  if (ticks) out.rem = ticks;
  ticks = values.map(function(value, i) {
    return ingest({
      index: i / (values.length - 1),
      value: value,
      label: format(value)
    });
  });
  if (_$$1.extra) {
    ticks.push(ingest({
      index: -1,
      extra: {value: ticks[0].value},
      label: ''
    }));
  }
  out.source = ticks;
  out.add = ticks;
  this.value = ticks;
  return out;
};

function DataJoin(params) {
  Transform.call(this, null, params);
}
var prototype$T = inherits(DataJoin, Transform);
function defaultItemCreate() {
  return ingest({});
}
function isExit(t) {
  return t.exit;
}
prototype$T.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _$$1.item || defaultItemCreate,
      key$$1 = _$$1.key || tupleid,
      map = this.value;
  if (isArray(out.encode)) {
    out.encode = null;
  }
  if (map && (_$$1.modified('key') || pulse.modified(key$$1))) {
    error('DataJoin does not support modified key function or fields.');
  }
  if (!map) {
    pulse = pulse.addAll();
    this.value = map = fastmap().test(isExit);
    map.lookup = function(t) { return map.get(key$$1(t)); };
  }
  pulse.visit(pulse.ADD, function(t) {
    var k = key$$1(t),
        x = map.get(k);
    if (x) {
      if (x.exit) {
        map.empty--;
        out.add.push(x);
      } else {
        out.mod.push(x);
      }
    } else {
      map.set(k, (x = item(t)));
      out.add.push(x);
    }
    x.datum = t;
    x.exit = false;
  });
  pulse.visit(pulse.MOD, function(t) {
    var k = key$$1(t),
        x = map.get(k);
    if (x) {
      x.datum = t;
      out.mod.push(x);
    }
  });
  pulse.visit(pulse.REM, function(t) {
    var k = key$$1(t),
        x = map.get(k);
    if (t === x.datum && !x.exit) {
      out.rem.push(x);
      x.exit = true;
      ++map.empty;
    }
  });
  if (pulse.changed(pulse.ADD_MOD)) out.modifies('datum');
  if (_$$1.clean && map.empty > df.cleanThreshold) df.runAfter(map.clean);
  return out;
};

function Encode(params) {
  Transform.call(this, null, params);
}
var prototype$U = inherits(Encode, Transform);
prototype$U.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      encoders = _$$1.encoders,
      encode = pulse.encode;
  if (isArray(encode)) {
    if (out.changed() || encode.every(function(e) { return encoders[e]; })) {
      encode = encode[0];
      out.encode = null;
    } else {
      return pulse.StopPropagation;
    }
  }
  var reenter = encode === 'enter',
      update = encoders.update || falsy,
      enter = encoders.enter || falsy,
      exit = encoders.exit || falsy,
      set = (encode && !reenter ? encoders[encode] : update) || falsy;
  if (pulse.changed(pulse.ADD)) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _$$1);
      update(t, _$$1);
      if (set !== falsy && set !== update) set(t, _$$1);
    });
    out.modifies(enter.output);
    out.modifies(update.output);
    if (set !== falsy && set !== update) out.modifies(set.output);
  }
  if (pulse.changed(pulse.REM) && exit !== falsy) {
    pulse.visit(pulse.REM, function(t) { exit(t, _$$1); });
    out.modifies(exit.output);
  }
  if (reenter || set !== falsy) {
    var flag = pulse.MOD | (_$$1.modified() ? pulse.REFLOW : 0);
    if (reenter) {
      pulse.visit(flag, function(t) {
        var mod = enter(t, _$$1);
        if (set(t, _$$1) || mod) out.mod.push(t);
      });
      if (out.mod.length) out.modifies(enter.output);
    } else {
      pulse.visit(flag, function(t) {
        if (set(t, _$$1)) out.mod.push(t);
      });
    }
    if (out.mod.length) out.modifies(set.output);
  }
  return out.changed() ? out : pulse.StopPropagation;
};

var discrete = {};
discrete[Quantile] = quantile;
discrete[Quantize] = quantize;
discrete[Threshold] = threshold;
discrete[BinLinear] = bin$1;
discrete[BinOrdinal] = bin$1;
function labelValues(scale, count, gradient) {
  if (gradient) return scale.domain();
  var values = discrete[scale.type];
  return values ? values(scale) : tickValues(scale, count);
}
function quantize(scale) {
  var domain = scale.domain(),
      x0 = domain[0],
      x1 = peek(domain),
      n = scale.range().length,
      values = new Array(n),
      i = 0;
  values[0] = -Infinity;
  while (++i < n) values[i] = (i * x1 - (i - n) * x0) / n;
  values.max = +Infinity;
  return values;
}
function quantile(scale) {
  var values = [-Infinity].concat(scale.quantiles());
  values.max = +Infinity;
  return values;
}
function threshold(scale) {
  var values = [-Infinity].concat(scale.domain());
  values.max = +Infinity;
  return values;
}
function bin$1(scale) {
  var values = scale.domain();
  values.max = values.pop();
  return values;
}
function labelFormat(scale, format) {
  return discrete[scale.type] ? formatRange(format) : formatPoint(format);
}
function formatRange(format) {
  return function(value, index, array$$1) {
    var limit = array$$1[index + 1] || array$$1.max || +Infinity,
        lo = formatValue(value, format),
        hi = formatValue(limit, format);
    return lo && hi ? lo + '\u2013' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };
}
function formatValue(value, format) {
  return isFinite(value) ? format(value) : null;
}
function formatPoint(format) {
  return function(value) {
    return format(value);
  };
}

function LegendEntries(params) {
  Transform.call(this, [], params);
}
var prototype$V = inherits(LegendEntries, Transform);
prototype$V.transform = function(_$$1, pulse) {
  if (this.value != null && !_$$1.modified()) {
    return pulse.StopPropagation;
  }
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      total = 0,
      items = this.value,
      grad  = _$$1.type === 'gradient',
      scale = _$$1.scale,
      count = _$$1.count == null ? 5 : tickCount(scale, _$$1.count),
      format = _$$1.format || tickFormat(scale, count, _$$1.formatSpecifier),
      values = _$$1.values || labelValues(scale, count, grad);
  format = labelFormat(scale, format);
  if (items) out.rem = items;
  if (grad) {
    var domain = _$$1.values ? scale.domain() : values,
        fraction = scaleFraction(scale, domain[0], peek(domain));
  } else {
    var size = _$$1.size,
        offset;
    if (isFunction(size)) {
      if (!_$$1.values && scale(values[0]) === 0) {
        values = values.slice(1);
      }
      offset = values.reduce(function(max, value) {
        return Math.max(max, size(value, _$$1));
      }, 0);
    } else {
      size = constant(offset = size || 8);
    }
  }
  items = values.map(function(value, index) {
    var t = ingest({
      index: index,
      label: format(value, index, values),
      value: value
    });
    if (grad) {
      t.perc = fraction(value);
    } else {
      t.offset = offset;
      t.size = size(value, _$$1);
      t.total = Math.round(total);
      total += t.size;
    }
    return t;
  });
  out.source = items;
  out.add = items;
  this.value = items;
  return out;
};

var Paths = fastmap({
  'line': line$2,
  'line-radial': lineR,
  'arc': arc$2,
  'arc-radial': arcR,
  'curve': curve,
  'curve-radial': curveR,
  'orthogonal-horizontal': orthoX,
  'orthogonal-vertical': orthoY,
  'orthogonal-radial': orthoR,
  'diagonal-horizontal': diagonalX,
  'diagonal-vertical': diagonalY,
  'diagonal-radial': diagonalR
});
function sourceX(t) { return t.source.x; }
function sourceY(t) { return t.source.y; }
function targetX(t) { return t.target.x; }
function targetY(t) { return t.target.y; }
function LinkPath(params) {
  Transform.call(this, {}, params);
}
LinkPath.Definition = {
  "type": "LinkPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sourceX", "type": "field", "default": "source.x" },
    { "name": "sourceY", "type": "field", "default": "source.y" },
    { "name": "targetX", "type": "field", "default": "target.x" },
    { "name": "targetY", "type": "field", "default": "target.y" },
    { "name": "orient", "type": "enum", "default": "vertical",
      "values": ["horizontal", "vertical", "radial"] },
    { "name": "shape", "type": "enum", "default": "line",
      "values": ["line", "arc", "curve", "diagonal", "orthogonal"] },
    { "name": "as", "type": "string", "default": "path" }
  ]
};
var prototype$W = inherits(LinkPath, Transform);
prototype$W.transform = function(_$$1, pulse) {
  var sx = _$$1.sourceX || sourceX,
      sy = _$$1.sourceY || sourceY,
      tx = _$$1.targetX || targetX,
      ty = _$$1.targetY || targetY,
      as = _$$1.as || 'path',
      orient = _$$1.orient || 'vertical',
      shape = _$$1.shape || 'line',
      path = Paths.get(shape + '-' + orient) || Paths.get(shape);
  if (!path) {
    error('LinkPath unsupported type: ' + _$$1.shape
      + (_$$1.orient ? '-' + _$$1.orient : ''));
  }
  pulse.visit(pulse.SOURCE, function(t) {
    t[as] = path(sx(t), sy(t), tx(t), ty(t));
  });
  return pulse.reflow(_$$1.modified()).modifies(as);
};
function line$2(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}
function lineR(sa, sr, ta, tr) {
  return line$2(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}
function arc$2(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      rr = Math.sqrt(dx * dx + dy * dy) / 2,
      ra = 180 * Math.atan2(dy, dx) / Math.PI;
  return 'M' + sx + ',' + sy +
         'A' + rr + ',' + rr +
         ' ' + ra + ' 0 1' +
         ' ' + tx + ',' + ty;
}
function arcR(sa, sr, ta, tr) {
  return arc$2(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}
function curve(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      ix = 0.2 * (dx + dy),
      iy = 0.2 * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}
function curveR(sa, sr, ta, tr) {
  return curve(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}
function orthoX(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'V' + ty + 'H' + tx;
}
function orthoY(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'H' + tx + 'V' + ty;
}
function orthoR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'A' + sr + ',' + sr + ' 0 0,' + (sf?1:0) +
         ' ' + (sr*tc) + ',' + (sr*ts) +
         'L' + (tr*tc) + ',' + (tr*ts);
}
function diagonalX(sx, sy, tx, ty) {
  var m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}
function diagonalY(sx, sy, tx, ty) {
  var m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
}
function diagonalR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      mr = (sr + tr) / 2;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'C' + (mr*sc) + ',' + (mr*ss) +
         ' ' + (mr*tc) + ',' + (mr*ts) +
         ' ' + (tr*tc) + ',' + (tr*ts);
}

function Pie(params) {
  Transform.call(this, null, params);
}
Pie.Definition = {
  "type": "Pie",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "startAngle", "type": "number", "default": 0 },
    { "name": "endAngle", "type": "number", "default": 6.283185307179586 },
    { "name": "sort", "type": "boolean", "default": false },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["startAngle", "endAngle"] }
  ]
};
var prototype$X = inherits(Pie, Transform);
prototype$X.transform = function(_$$1, pulse) {
  var as = _$$1.as || ['startAngle', 'endAngle'],
      startAngle = as[0],
      endAngle = as[1],
      field$$1 = _$$1.field || one,
      start = _$$1.startAngle || 0,
      stop = _$$1.endAngle != null ? _$$1.endAngle : 2 * Math.PI,
      data = pulse.source,
      values = data.map(field$$1),
      n = values.length,
      a = start,
      k = (stop - start) / d3Array.sum(values),
      index = d3Array.range(n),
      i, t, v;
  if (_$$1.sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }
  for (i=0; i<n; ++i) {
    v = values[index[i]];
    t = data[index[i]];
    t[startAngle] = a;
    t[endAngle] = (a += v * k);
  }
  this.value = values;
  return pulse.reflow(_$$1.modified()).modifies(as);
};

var DEFAULT_COUNT = 5;
var INCLUDE_ZERO = toSet([Linear, Pow, Sqrt]);
var INCLUDE_PAD = toSet([Linear, Log, Pow, Sqrt, Time, Utc]);
var SKIP$2 = toSet([
  'set', 'modified', 'clear', 'type', 'scheme', 'schemeExtent', 'schemeCount',
  'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'nice', 'zero',
  'range', 'rangeStep', 'round', 'reverse', 'interpolate', 'interpolateGamma'
]);
function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true);
}
var prototype$Y = inherits(Scale, Transform);
prototype$Y.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      scale$$1 = this.value,
      prop;
  if (!scale$$1 || _$$1.modified('type')) {
    this.value = scale$$1 = scale$1((_$$1.type || Linear).toLowerCase())();
  }
  for (prop in _$$1) if (!SKIP$2[prop]) {
    if (prop === 'padding' && INCLUDE_PAD[scale$$1.type]) continue;
    isFunction(scale$$1[prop])
      ? scale$$1[prop](_$$1[prop])
      : df.warn('Unsupported scale property: ' + prop);
  }
  configureRange(scale$$1, _$$1, configureDomain(scale$$1, _$$1, df));
  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};
function configureDomain(scale$$1, _$$1, df) {
  var raw = rawDomain(scale$$1, _$$1.domainRaw);
  if (raw > -1) return raw;
  var domain = _$$1.domain,
      type = scale$$1.type,
      zero$$1 = _$$1.zero || (_$$1.zero === undefined && INCLUDE_ZERO[type]),
      n, mid;
  if (!domain) return 0;
  if (INCLUDE_PAD[type] && _$$1.padding && domain[0] !== peek(domain)) {
    domain = padDomain(type, domain, _$$1.range, _$$1.padding, _$$1.exponent);
  }
  if (zero$$1 || _$$1.domainMin != null || _$$1.domainMax != null || _$$1.domainMid != null) {
    n = ((domain = domain.slice()).length - 1) || 1;
    if (zero$$1) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_$$1.domainMin != null) domain[0] = _$$1.domainMin;
    if (_$$1.domainMax != null) domain[n] = _$$1.domainMax;
    if (_$$1.domainMid != null) {
      mid = _$$1.domainMid;
      if (mid < domain[0] || mid > domain[n]) {
        df.warn('Scale domainMid exceeds domain min or max.', mid);
      }
      domain.splice(n, 0, mid);
    }
  }
  scale$$1.domain(domain);
  if (type === Ordinal) {
    scale$$1.unknown(undefined);
  }
  if (_$$1.nice && scale$$1.nice) {
    scale$$1.nice((_$$1.nice !== true && tickCount(scale$$1, _$$1.nice)) || null);
  }
  return domain.length;
}
function rawDomain(scale$$1, raw) {
  if (raw) {
    scale$$1.domain(raw);
    return raw.length;
  } else {
    return -1;
  }
}
function padDomain(type, domain, range, pad$$1, exponent) {
  var span$$1 = Math.abs(peek(range) - range[0]),
      frac = span$$1 / (span$$1 - 2 * pad$$1),
      d = type === Log  ? zoomLog(domain, null, frac)
        : type === Sqrt ? zoomPow(domain, null, frac, 0.5)
        : type === Pow  ? zoomPow(domain, null, frac, exponent)
        : zoomLinear(domain, null, frac);
  domain = domain.slice();
  domain[0] = d[0];
  domain[domain.length-1] = d[1];
  return domain;
}
function configureRange(scale$$1, _$$1, count) {
  var round = _$$1.round || false,
      range = _$$1.range;
  if (_$$1.rangeStep != null) {
    range = configureRangeStep(scale$$1.type, _$$1, count);
  }
  else if (_$$1.scheme) {
    range = configureScheme(scale$$1.type, _$$1, count);
    if (isFunction(range)) return scale$$1.interpolator(range);
  }
  else if (range && scale$$1.type === Sequential) {
    return scale$$1.interpolator($$1.interpolateRgbBasis(flip(range, _$$1.reverse)));
  }
  if (range && _$$1.interpolate && scale$$1.interpolate) {
    scale$$1.interpolate(interpolate(_$$1.interpolate, _$$1.interpolateGamma));
  } else if (isFunction(scale$$1.round)) {
    scale$$1.round(round);
  } else if (isFunction(scale$$1.rangeRound)) {
    scale$$1.interpolate(round ? $$1.interpolateRound : $$1.interpolate);
  }
  if (range) scale$$1.range(flip(range, _$$1.reverse));
}
function configureRangeStep(type, _$$1, count) {
  if (type !== Band && type !== Point) {
    error('Only band and point scales support rangeStep.');
  }
  var outer = (_$$1.paddingOuter != null ? _$$1.paddingOuter : _$$1.padding) || 0,
      inner = type === Point ? 1
            : ((_$$1.paddingInner != null ? _$$1.paddingInner : _$$1.padding) || 0);
  return [0, _$$1.rangeStep * bandSpace(count, inner, outer)];
}
function configureScheme(type, _$$1, count) {
  var name = _$$1.scheme.toLowerCase(),
      scheme$$1 = scheme(name),
      extent$$1 = _$$1.schemeExtent,
      discrete;
  if (!scheme$$1) {
    error('Unrecognized scheme name: ' + _$$1.scheme);
  }
  count = (type === Threshold) ? count + 1
    : (type === BinOrdinal) ? count - 1
    : (type === Quantile || type === Quantize) ? (+_$$1.schemeCount || DEFAULT_COUNT)
    : count;
  return type === Sequential ? adjustScheme(scheme$$1, extent$$1, _$$1.reverse)
    : !extent$$1 && (discrete = scheme(name + '-' + count)) ? discrete
    : isFunction(scheme$$1) ? quantize$1(adjustScheme(scheme$$1, extent$$1), count)
    : type === Ordinal ? scheme$$1 : scheme$$1.slice(0, count);
}
function adjustScheme(scheme$$1, extent$$1, reverse) {
  return (isFunction(scheme$$1) && (extent$$1 || reverse))
    ? interpolateRange(scheme$$1, flip(extent$$1 || [0, 1], reverse))
    : scheme$$1;
}
function flip(array$$1, reverse) {
  return reverse ? array$$1.slice().reverse() : array$$1;
}
function quantize$1(interpolator, count) {
  var samples = new Array(count),
      n = (count - 1) || 1;
  for (var i = 0; i < count; ++i) samples[i] = interpolator(i / n);
  return samples;
}

function SortItems(params) {
  Transform.call(this, null, params);
}
var prototype$Z = inherits(SortItems, Transform);
prototype$Z.transform = function(_$$1, pulse) {
  var mod = _$$1.modified('sort')
         || pulse.changed(pulse.ADD)
         || pulse.modified(_$$1.sort.fields)
         || pulse.modified('datum');
  if (mod) pulse.source.sort(_$$1.sort);
  this.modified(mod);
  return pulse;
};

var Center = 'center',
    Normalize = 'normalize';
function Stack(params) {
  Transform.call(this, null, params);
}
Stack.Definition = {
  "type": "Stack",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "sort", "type": "compare" },
    { "name": "offset", "type": "enum", "default": "zero", "values": ["zero", "center", "normalize"] },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["y0", "y1"] }
  ]
};
var prototype$_ = inherits(Stack, Transform);
prototype$_.transform = function(_$$1, pulse) {
  var as = _$$1.as || ['y0', 'y1'],
      y0 = as[0],
      y1 = as[1],
      field$$1 = _$$1.field || one,
      stack = _$$1.offset === Center ? stackCenter
            : _$$1.offset === Normalize ? stackNormalize
            : stackZero,
      groups, i, n, max;
  groups = partition$1(pulse.source, _$$1.groupby, _$$1.sort, field$$1);
  for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
    stack(groups[i], max, field$$1, y0, y1);
  }
  return pulse.reflow(_$$1.modified()).modifies(as);
};
function stackCenter(group, max, field$$1, y0, y1) {
  var last = (max - group.sum) / 2,
      m = group.length,
      j = 0, t;
  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = (last += Math.abs(field$$1(t)));
  }
}
function stackNormalize(group, max, field$$1, y0, y1) {
  var scale = 1 / group.sum,
      last = 0,
      m = group.length,
      j = 0, v = 0, t;
  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last = scale * (v += Math.abs(field$$1(t)));
  }
}
function stackZero(group, max, field$$1, y0, y1) {
  var lastPos = 0,
      lastNeg = 0,
      m = group.length,
      j = 0, v, t;
  for (; j<m; ++j) {
    t = group[j];
    v = field$$1(t);
    if (v < 0) {
      t[y0] = lastNeg;
      t[y1] = (lastNeg += v);
    } else {
      t[y0] = lastPos;
      t[y1] = (lastPos += v);
    }
  }
}
function partition$1(data, groupby, sort, field$$1) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, m, t, k, g, s, max;
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = (g = []);
        groups.push(g);
      }
      g.push(t);
    }
  }
  for (k=0, max=0, m=groups.length; k<m; ++k) {
    g = groups[k];
    for (i=0, s=0, n=g.length; i<n; ++i) {
      s += Math.abs(field$$1(g[i]));
    }
    g.sum = s;
    if (s > max) max = s;
    if (sort) g.sort(sort);
  }
  groups.max = max;
  return groups;
}



var encode = /*#__PURE__*/Object.freeze({
  axisticks: AxisTicks,
  datajoin: DataJoin,
  encode: Encode,
  legendentries: LegendEntries,
  linkpath: LinkPath,
  pie: Pie,
  scale: Scale,
  sortitems: SortItems,
  stack: Stack,
  validTicks: validTicks
});

var CONTOUR_PARAMS = ['size', 'smooth'];
var DENSITY_PARAMS = ['x', 'y', 'size', 'cellSize', 'bandwidth'];
function Contour(params) {
  Transform.call(this, null, params);
}
Contour.Definition = {
  "type": "Contour",
  "metadata": {"generates": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "values", "type": "number", "array": true },
    { "name": "x", "type": "field" },
    { "name": "y", "type": "field" },
    { "name": "cellSize", "type": "number" },
    { "name": "bandwidth", "type": "number" },
    { "name": "count", "type": "number" },
    { "name": "smooth", "type": "boolean" },
    { "name": "nice", "type": "boolean", "default": false },
    { "name": "thresholds", "type": "number", "array": true }
  ]
};
var prototype$10 = inherits(Contour, Transform);
prototype$10.transform = function(_$$1, pulse) {
  if (this.value && !pulse.changed() && !_$$1.modified())
    return pulse.StopPropagation;
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      count = _$$1.count || 10,
      contour, params, values;
  if (_$$1.values) {
    contour = d3Contour.contours();
    params = CONTOUR_PARAMS;
    values = _$$1.values;
  } else {
    contour = d3Contour.contourDensity();
    params = DENSITY_PARAMS;
    values = pulse.materialize(pulse.SOURCE).source;
  }
  contour.thresholds(_$$1.thresholds || (_$$1.nice ? count : quantize$2(count)));
  params.forEach(function(param) {
    if (_$$1[param] != null) contour[param](_$$1[param]);
  });
  if (this.value) out.rem = this.value;
  values = values && values.length ? contour(values).map(ingest) : [];
  this.value = out.source = out.add = values;
  return out;
};
function quantize$2(k) {
  return function(values) {
    var ex = d3Array.extent(values), x0 = ex[0], dx = ex[1] - x0,
        t = [], i = 1;
    for (; i<=k; ++i) t.push(x0 + dx * i / (k + 1));
    return t;
  };
}

var Feature = 'Feature';
var FeatureCollection = 'FeatureCollection';
var MultiPoint = 'MultiPoint';

function GeoJSON(params) {
  Transform.call(this, null, params);
}
GeoJSON.Definition = {
  "type": "GeoJSON",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "length": 2 },
    { "name": "geojson", "type": "field" },
  ]
};
var prototype$11 = inherits(GeoJSON, Transform);
prototype$11.transform = function(_$$1, pulse) {
  var features = this._features,
      points = this._points,
      fields = _$$1.fields,
      lon = fields && fields[0],
      lat = fields && fields[1],
      geojson = _$$1.geojson,
      flag = pulse.ADD,
      mod;
  mod = _$$1.modified()
    || pulse.changed(pulse.REM)
    || pulse.modified(accessorFields(geojson))
    || (lon && (pulse.modified(accessorFields(lon))))
    || (lat && (pulse.modified(accessorFields(lat))));
  if (!this.value || mod) {
    flag = pulse.SOURCE;
    this._features = (features = []);
    this._points = (points = []);
  }
  if (geojson) {
    pulse.visit(flag, function(t) {
      features.push(geojson(t));
    });
  }
  if (lon && lat) {
    pulse.visit(flag, function(t) {
      var x = lon(t),
          y = lat(t);
      if (x != null && y != null && (x = +x) === x && (y = +y) === y) {
        points.push([x, y]);
      }
    });
    features = features.concat({
      type: Feature,
      geometry: {
        type: MultiPoint,
        coordinates: points
      }
    });
  }
  this.value = {
    type: FeatureCollection,
    features: features
  };
};

var defaultPath = d3Geo.geoPath();
var projectionProperties = [
  'clipAngle',
  'clipExtent',
  'scale',
  'translate',
  'center',
  'rotate',
  'parallels',
  'precision',
  'reflectX',
  'reflectY',
  'coefficient',
  'distance',
  'fraction',
  'lobes',
  'parallel',
  'radius',
  'ratio',
  'spacing',
  'tilt'
];
function create$1(type, constructor) {
  return function projection() {
    var p = constructor();
    p.type = type;
    p.path = d3Geo.geoPath().projection(p);
    p.copy = p.copy || function() {
      var c = projection();
      projectionProperties.forEach(function(prop) {
        if (p.hasOwnProperty(prop)) c[prop](p[prop]());
      });
      c.path.pointRadius(p.path.pointRadius());
      return c;
    };
    return p;
  };
}
function projection(type, proj) {
  if (!type || typeof type !== 'string') {
    throw new Error('Projection type must be a name string.');
  }
  type = type.toLowerCase();
  if (arguments.length > 1) {
    projections[type] = create$1(type, proj);
    return this;
  } else {
    return projections.hasOwnProperty(type) ? projections[type] : null;
  }
}
function getProjectionPath(proj) {
  return (proj && proj.path) || defaultPath;
}
var projections = {
  albers:               d3Geo.geoAlbers,
  albersusa:            d3Geo.geoAlbersUsa,
  azimuthalequalarea:   d3Geo.geoAzimuthalEqualArea,
  azimuthalequidistant: d3Geo.geoAzimuthalEquidistant,
  conicconformal:       d3Geo.geoConicConformal,
  conicequalarea:       d3Geo.geoConicEqualArea,
  conicequidistant:     d3Geo.geoConicEquidistant,
  equirectangular:      d3Geo.geoEquirectangular,
  gnomonic:             d3Geo.geoGnomonic,
  identity:             d3Geo.geoIdentity,
  mercator:             d3Geo.geoMercator,
  naturalEarth1:        d3Geo.geoNaturalEarth1,
  orthographic:         d3Geo.geoOrthographic,
  stereographic:        d3Geo.geoStereographic,
  transversemercator:   d3Geo.geoTransverseMercator
};
for (var key$2 in projections) {
  projection(key$2, projections[key$2]);
}

function GeoPath(params) {
  Transform.call(this, null, params);
}
GeoPath.Definition = {
  "type": "GeoPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field" },
    { "name": "pointRadius", "type": "number", "expr": true },
    { "name": "as", "type": "string", "default": "path" }
  ]
};
var prototype$12 = inherits(GeoPath, Transform);
prototype$12.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      path = this.value,
      field$$1 = _$$1.field || identity,
      as = _$$1.as || 'path',
      flag = out.SOURCE;
  function set(t) { t[as] = path(field$$1(t)); }
  if (!path || _$$1.modified()) {
    this.value = path = getProjectionPath(_$$1.projection);
    out.materialize().reflow();
  } else {
    flag = field$$1 === identity || pulse.modified(field$$1.fields)
      ? out.ADD_MOD
      : out.ADD;
  }
  var prev = initPath(path, _$$1.pointRadius);
  out.visit(flag, set);
  path.pointRadius(prev);
  return out.modifies(as);
};
function initPath(path, pointRadius) {
  var prev = path.pointRadius();
  path.context(null);
  if (pointRadius != null) {
    path.pointRadius(pointRadius);
  }
  return prev;
}

function GeoPoint(params) {
  Transform.call(this, null, params);
}
GeoPoint.Definition = {
  "type": "GeoPoint",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "fields", "type": "field", "array": true, "required": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["x", "y"] }
  ]
};
var prototype$13 = inherits(GeoPoint, Transform);
prototype$13.transform = function(_$$1, pulse) {
  var proj = _$$1.projection,
      lon = _$$1.fields[0],
      lat = _$$1.fields[1],
      as = _$$1.as || ['x', 'y'],
      x = as[0],
      y = as[1],
      mod;
  function set(t) {
    var xy = proj([lon(t), lat(t)]);
    if (xy) {
      t[x] = xy[0];
      t[y] = xy[1];
    } else {
      t[x] = undefined;
      t[y] = undefined;
    }
  }
  if (_$$1.modified()) {
    pulse = pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }
  return pulse.modifies(as);
};

function GeoShape(params) {
  Transform.call(this, null, params);
}
GeoShape.Definition = {
  "type": "GeoShape",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field", "default": "datum" },
    { "name": "pointRadius", "type": "number", "expr": true },
    { "name": "as", "type": "string", "default": "shape" }
  ]
};
var prototype$14 = inherits(GeoShape, Transform);
prototype$14.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      shape = this.value,
      datum = _$$1.field || field('datum'),
      as = _$$1.as || 'shape',
      flag = out.ADD_MOD;
  if (!shape || _$$1.modified()) {
    this.value = shape = shapeGenerator(
      getProjectionPath(_$$1.projection),
      datum,
      _$$1.pointRadius
    );
    out.materialize().reflow();
    flag = out.SOURCE;
  }
  out.visit(flag, function(t) { t[as] = shape; });
  return out.modifies(as);
};
function shapeGenerator(path, field$$1, pointRadius) {
  var shape = pointRadius == null
    ? function(_$$1) { return path(field$$1(_$$1)); }
    : function(_$$1) {
      var prev = path.pointRadius(),
          value = path.pointRadius(pointRadius)(field$$1(_$$1));
      path.pointRadius(prev);
      return value;
    };
  shape.context = function(_$$1) {
    path.context(_$$1);
    return shape;
  };
  return shape;
}

function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = d3Geo.geoGraticule();
}
Graticule.Definition = {
  "type": "Graticule",
  "metadata": {"changes": true},
  "params": [
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMajor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMinor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "step", "type": "number", "array": true, "length": 2 },
    { "name": "stepMajor", "type": "number", "array": true, "length": 2, "default": [90, 360] },
    { "name": "stepMinor", "type": "number", "array": true, "length": 2, "default": [10, 10] },
    { "name": "precision", "type": "number", "default": 2.5 }
  ]
};
var prototype$15 = inherits(Graticule, Transform);
prototype$15.transform = function(_$$1, pulse) {
  var src = this.value,
      gen = this.generator, t;
  if (!src.length || _$$1.modified()) {
    for (var prop in _$$1) {
      if (isFunction(gen[prop])) {
        gen[prop](_$$1[prop]);
      }
    }
  }
  t = gen();
  if (src.length) {
    pulse.mod.push(replace(src[0], t));
  } else {
    pulse.add.push(ingest(t));
  }
  src[0] = t;
  return pulse;
};

function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true);
}
var prototype$16 = inherits(Projection, Transform);
prototype$16.transform = function(_$$1, pulse) {
  var proj = this.value;
  if (!proj || _$$1.modified('type')) {
    this.value = (proj = create$2(_$$1.type));
    projectionProperties.forEach(function(prop) {
      if (_$$1[prop] != null) set$1(proj, prop, _$$1[prop]);
    });
  } else {
    projectionProperties.forEach(function(prop) {
      if (_$$1.modified(prop)) set$1(proj, prop, _$$1[prop]);
    });
  }
  if (_$$1.pointRadius != null) proj.path.pointRadius(_$$1.pointRadius);
  if (_$$1.fit) fit(proj, _$$1);
  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};
function fit(proj, _$$1) {
  var data = collectGeoJSON(_$$1.fit);
  _$$1.extent ? proj.fitExtent(_$$1.extent, data)
    : _$$1.size ? proj.fitSize(_$$1.size, data) : 0;
}
function create$2(type) {
  var constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}
function set$1(proj, key$$1, value) {
   if (isFunction(proj[key$$1])) proj[key$$1](value);
}
function collectGeoJSON(features) {
  features = array(features);
  return features.length === 1
    ? features[0]
    : {
        type: FeatureCollection,
        features: features.reduce(function(list, f) {
            (f && f.type === FeatureCollection) ? list.push.apply(list, f.features)
              : isArray(f) ? list.push.apply(list, f)
              : list.push(f);
            return list;
          }, [])
      };
}



var geo = /*#__PURE__*/Object.freeze({
  contour: Contour,
  geojson: GeoJSON,
  geopath: GeoPath,
  geopoint: GeoPoint,
  geoshape: GeoShape,
  graticule: Graticule,
  projection: Projection
});

var ForceMap = {
  center: d3Force.forceCenter,
  collide: d3Force.forceCollide,
  nbody: d3Force.forceManyBody,
  link: d3Force.forceLink,
  x: d3Force.forceX,
  y: d3Force.forceY
};
var Forces = 'forces',
    ForceParams = [
      'alpha', 'alphaMin', 'alphaTarget',
      'velocityDecay', 'forces'
    ],
    ForceConfig = ['static', 'iterations'],
    ForceOutput = ['x', 'y', 'vx', 'vy'];
function Force(params) {
  Transform.call(this, null, params);
}
Force.Definition = {
  "type": "Force",
  "metadata": {"modifies": true},
  "params": [
    { "name": "static", "type": "boolean", "default": false },
    { "name": "restart", "type": "boolean", "default": false },
    { "name": "iterations", "type": "number", "default": 300 },
    { "name": "alpha", "type": "number", "default": 1 },
    { "name": "alphaMin", "type": "number", "default": 0.001 },
    { "name": "alphaTarget", "type": "number", "default": 0 },
    { "name": "velocityDecay", "type": "number", "default": 0.4 },
    { "name": "forces", "type": "param", "array": true,
      "params": [
        {
          "key": {"force": "center"},
          "params": [
            { "name": "x", "type": "number", "default": 0 },
            { "name": "y", "type": "number", "default": 0 }
          ]
        },
        {
          "key": {"force": "collide"},
          "params": [
            { "name": "radius", "type": "number", "expr": true },
            { "name": "strength", "type": "number", "default": 0.7 },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "nbody"},
          "params": [
            { "name": "strength", "type": "number", "default": -30 },
            { "name": "theta", "type": "number", "default": 0.9 },
            { "name": "distanceMin", "type": "number", "default": 1 },
            { "name": "distanceMax", "type": "number" }
          ]
        },
        {
          "key": {"force": "link"},
          "params": [
            { "name": "links", "type": "data" },
            { "name": "id", "type": "field" },
            { "name": "distance", "type": "number", "default": 30, "expr": true },
            { "name": "strength", "type": "number", "expr": true },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "x"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "x", "type": "field" }
          ]
        },
        {
          "key": {"force": "y"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "y", "type": "field" }
          ]
        }
      ] },
    {
      "name": "as", "type": "string", "array": true, "modify": false,
      "default": ForceOutput
    }
  ]
};
var prototype$17 = inherits(Force, Transform);
prototype$17.transform = function(_$$1, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _$$1.modified(ForceParams),
      iters = _$$1.iterations || 300;
  if (!sim) {
    this.value = sim = simulation(pulse.source, _$$1);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_$$1.static) {
      change = true;
      sim.tick();
    }
    pulse.modifies('index');
  } else {
    if (change) {
      pulse.modifies('index');
      sim.nodes(pulse.source);
    }
    if (params || pulse.changed(pulse.MOD)) {
      setup(sim, _$$1, 0, pulse);
    }
  }
  if (params || change || _$$1.modified(ForceConfig)
      || (pulse.changed() && _$$1.restart))
  {
    sim.alpha(Math.max(sim.alpha(), _$$1.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));
    if (_$$1.static) {
      for (sim.stop(); --iters >= 0;) sim.tick();
    } else {
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation;
    }
  }
  return this.finish(_$$1, pulse);
};
prototype$17.finish = function(_$$1, pulse) {
  var dataflow = pulse.dataflow;
  for (var args=this._argops, j=0, m=args.length, arg; j<m; ++j) {
    arg = args[j];
    if (arg.name !== Forces || arg.op._argval.force !== 'link') {
      continue;
    }
    for (var ops=arg.op._argops, i=0, n=ops.length, op; i<n; ++i) {
      if (ops[i].name === 'links' && (op = ops[i].op.source)) {
        dataflow.pulse(op, dataflow.changeset().reflow());
        break;
      }
    }
  }
  return pulse.reflow(_$$1.modified()).modifies(ForceOutput);
};
function rerun(df, op) {
  return function() { df.touch(op).run(); }
}
function simulation(nodes, _$$1) {
  var sim = d3Force.forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;
  sim.stopped = function() {
    return stopped;
  };
  sim.restart = function() {
    stopped = false;
    return restart();
  };
  sim.stop = function() {
    stopped = true;
    return stop();
  };
  return setup(sim, _$$1, true).on('end', function() { stopped = true; });
}
function setup(sim, _$$1, init, pulse) {
  var f = array(_$$1.forces), i, n, p, name;
  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _$$1.modified(p)) sim[p](_$$1[p]);
  }
  for (i=0, n=f.length; i<n; ++i) {
    name = Forces + i;
    p = init || _$$1.modified(Forces, i) ? getForce(f[i])
      : pulse && modified(f[i], pulse) ? sim.force(name)
      : null;
    if (p) sim.force(name, p);
  }
  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null);
  }
  sim.numForces = f.length;
  return sim;
}
function modified(f, pulse) {
  var k, v;
  for (k in f) {
    if (isFunction(v = f[k]) && pulse.modified(accessorFields(v)))
      return 1;
  }
  return 0;
}
function getForce(_$$1) {
  var f, p;
  if (!ForceMap.hasOwnProperty(_$$1.force)) {
    error('Unrecognized force: ' + _$$1.force);
  }
  f = ForceMap[_$$1.force]();
  for (p in _$$1) {
    if (isFunction(f[p])) setForceParam(f[p], _$$1[p], _$$1);
  }
  return f;
}
function setForceParam(f, v, _$$1) {
  f(isFunction(v) ? function(d) { return v(d, _$$1); } : v);
}



var force = /*#__PURE__*/Object.freeze({
  force: Force
});

function Nest(params) {
  Transform.call(this, null, params);
}
Nest.Definition = {
  "type": "Nest",
  "metadata": {"treesource": true, "changes": true},
  "params": [
    { "name": "keys", "type": "field", "array": true },
    { "name": "key", "type": "field" },
    { "name": "generate", "type": "boolean" }
  ]
};
var prototype$18 = inherits(Nest, Transform);
function children(n) {
  return n.values;
}
prototype$18.transform = function(_$$1, pulse) {
  if (!pulse.source) {
    error('Nest transform requires an upstream data source.');
  }
  var key$$1 = _$$1.key || tupleid,
      gen = _$$1.generate,
      mod = _$$1.modified(),
      out = pulse.clone(),
      root, tree, map;
  if (!this.value || mod || pulse.changed()) {
    if (gen && this.value) {
      this.value.each(function(node) {
        if (node.children) out.rem.push(node);
      });
    }
    root = array(_$$1.keys)
      .reduce(function(n, k) { n.key(k); return n; }, d3Collection.nest())
      .entries(out.source);
    this.value = tree = d3Hierarchy.hierarchy({values: root}, children);
    if (gen) {
      tree.each(function(node) {
        if (node.children) {
          node = ingest(node.data);
          out.add.push(node);
          out.source.push(node);
        }
      });
    }
    map = tree.lookup = {};
    tree.each(function(node) {
      if (tupleid(node.data) != null) {
        map[key$$1(node.data)] = node;
      }
    });
  }
  out.source.root = this.value;
  return out;
};

function HierarchyLayout(params) {
  Transform.call(this, null, params);
}
var prototype$19 = inherits(HierarchyLayout, Transform);
prototype$19.transform = function(_$$1, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error(this.constructor.name
      + ' transform requires a backing tree data source.');
  }
  var layout = this.layout(_$$1.method),
      fields = this.fields,
      root = pulse.source.root,
      as = _$$1.as || fields;
  if (_$$1.field) root.sum(_$$1.field);
  if (_$$1.sort) root.sort(_$$1.sort);
  setParams(layout, this.params, _$$1);
  try {
    this.value = layout(root);
  } catch (err) {
    error(err);
  }
  root.each(function(node) { setFields(node, fields, as); });
  return pulse.reflow(_$$1.modified()).modifies(as).modifies('leaf');
};
function setParams(layout, params, _$$1) {
  for (var p, i=0, n=params.length; i<n; ++i) {
    p = params[i];
    if (p in _$$1) layout[p](_$$1[p]);
  }
}
function setFields(node, fields, as) {
  var t = node.data;
  for (var i=0, n=fields.length-1; i<n; ++i) {
    t[as[i]] = node[fields[i]];
  }
  t[as[n]] = node.children ? node.children.length : 0;
}

var Output = ['x', 'y', 'r', 'depth', 'children'];
function Pack(params) {
  HierarchyLayout.call(this, params);
}
Pack.Definition = {
  "type": "Pack",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "radius", "type": "field", "default": null },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 3, "default": Output }
  ]
};
var prototype$1a = inherits(Pack, HierarchyLayout);
prototype$1a.layout = d3Hierarchy.pack;
prototype$1a.params = ['size', 'padding'];
prototype$1a.fields = Output;

var Output$1 = ["x0", "y0", "x1", "y1", "depth", "children"];
function Partition(params) {
  HierarchyLayout.call(this, params);
}
Partition.Definition = {
  "type": "Partition",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": Output$1 }
  ]
};
var prototype$1b = inherits(Partition, HierarchyLayout);
prototype$1b.layout = d3Hierarchy.partition;
prototype$1b.params = ['size', 'round', 'padding'];
prototype$1b.fields = Output$1;

function Stratify(params) {
  Transform.call(this, null, params);
}
Stratify.Definition = {
  "type": "Stratify",
  "metadata": {"treesource": true},
  "params": [
    { "name": "key", "type": "field", "required": true },
    { "name": "parentKey", "type": "field", "required": true  }
  ]
};
var prototype$1c = inherits(Stratify, Transform);
prototype$1c.transform = function(_$$1, pulse) {
  if (!pulse.source) {
    error('Stratify transform requires an upstream data source.');
  }
  var mod = _$$1.modified(), tree, map,
      out = pulse.fork(pulse.ALL).materialize(pulse.SOURCE),
      run = !this.value
         || mod
         || pulse.changed(pulse.ADD_REM)
         || pulse.modified(_$$1.key.fields)
         || pulse.modified(_$$1.parentKey.fields);
  out.source = out.source.slice();
  if (run) {
    tree = d3Hierarchy.stratify().id(_$$1.key).parentId(_$$1.parentKey)(out.source);
    map = tree.lookup = {};
    tree.each(function(node) { map[_$$1.key(node.data)] = node; });
    this.value = tree;
  }
  out.source.root = this.value;
  return out;
};

var Layouts = {
  tidy: d3Hierarchy.tree,
  cluster: d3Hierarchy.cluster
};
var Output$2 = ["x", "y", "depth", "children"];
function Tree(params) {
  HierarchyLayout.call(this, params);
}
Tree.Definition = {
  "type": "Tree",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "tidy", "values": ["tidy", "cluster"] },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "nodeSize", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": Output$2 }
  ]
};
var prototype$1d = inherits(Tree, HierarchyLayout);
prototype$1d.layout = function(method) {
  var m = method || 'tidy';
  if (Layouts.hasOwnProperty(m)) return Layouts[m]();
  else error('Unrecognized Tree layout method: ' + m);
};
prototype$1d.params = ['size', 'nodeSize', 'separation'];
prototype$1d.fields = Output$2;

function TreeLinks(params) {
  Transform.call(this, {}, params);
}
TreeLinks.Definition = {
  "type": "TreeLinks",
  "metadata": {"tree": true, "generates": true, "changes": true},
  "params": [
    { "name": "key", "type": "field" }
  ]
};
var prototype$1e = inherits(TreeLinks, Transform);
function parentTuple(node) {
  var p;
  return node.parent
      && (p=node.parent.data)
      && (tupleid(p) != null) && p;
}
prototype$1e.transform = function(_$$1, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error('TreeLinks transform requires a backing tree data source.');
  }
  var root = pulse.source.root,
      nodes = root.lookup,
      links = this.value,
      key$$1 = _$$1.key || tupleid,
      mods = {},
      out = pulse.fork();
  function modify(id$$1) {
    var link = links[id$$1];
    if (link) {
      mods[id$$1] = 1;
      out.mod.push(link);
    }
  }
  pulse.visit(pulse.REM, function(t) {
    var id$$1 = key$$1(t),
        link = links[id$$1];
    if (link) {
      delete links[id$$1];
      out.rem.push(link);
    }
  });
  pulse.visit(pulse.ADD, function(t) {
    var id$$1 = key$$1(t), p;
    if (p = parentTuple(nodes[id$$1])) {
      out.add.push(links[id$$1] = ingest({source: p, target: t}));
      mods[id$$1] = 1;
    }
  });
  pulse.visit(pulse.MOD, function(t) {
    var id$$1 = key$$1(t),
        node = nodes[id$$1],
        kids = node.children;
    modify(id$$1);
    if (kids) for (var i=0, n=kids.length; i<n; ++i) {
      if (!mods[(id$$1=key$$1(kids[i].data))]) modify(id$$1);
    }
  });
  return out;
};

var Tiles = {
  binary: d3Hierarchy.treemapBinary,
  dice: d3Hierarchy.treemapDice,
  slice: d3Hierarchy.treemapSlice,
  slicedice: d3Hierarchy.treemapSliceDice,
  squarify: d3Hierarchy.treemapSquarify,
  resquarify: d3Hierarchy.treemapResquarify
};
var Output$3 = ["x0", "y0", "x1", "y1", "depth", "children"];
function Treemap(params) {
  HierarchyLayout.call(this, params);
}
Treemap.Definition = {
  "type": "Treemap",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "squarify",
      "values": ["squarify", "resquarify", "binary", "dice", "slice", "slicedice"] },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "paddingInner", "type": "number", "default": 0 },
    { "name": "paddingOuter", "type": "number", "default": 0 },
    { "name": "paddingTop", "type": "number", "default": 0 },
    { "name": "paddingRight", "type": "number", "default": 0 },
    { "name": "paddingBottom", "type": "number", "default": 0 },
    { "name": "paddingLeft", "type": "number", "default": 0 },
    { "name": "ratio", "type": "number", "default": 1.618033988749895 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": Output$3 }
  ]
};
var prototype$1f = inherits(Treemap, HierarchyLayout);
prototype$1f.layout = function() {
  var x = d3Hierarchy.treemap();
  x.ratio = function(_$$1) {
    var t = x.tile();
    if (t.ratio) x.tile(t.ratio(_$$1));
  };
  x.method = function(_$$1) {
    if (Tiles.hasOwnProperty(_$$1)) x.tile(Tiles[_$$1]);
    else error('Unrecognized Treemap layout method: ' + _$$1);
  };
  return x;
};
prototype$1f.params = [
  'method', 'ratio', 'size', 'round',
  'padding', 'paddingInner', 'paddingOuter',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
];
prototype$1f.fields = Output$3;



var tree = /*#__PURE__*/Object.freeze({
  nest: Nest,
  pack: Pack,
  partition: Partition,
  stratify: Stratify,
  tree: Tree,
  treelinks: TreeLinks,
  treemap: Treemap
});

function Voronoi(params) {
  Transform.call(this, null, params);
}
Voronoi.Definition = {
  "type": "Voronoi",
  "metadata": {"modifies": true},
  "params": [
    { "name": "x", "type": "field", "required": true },
    { "name": "y", "type": "field", "required": true },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "default": [[-1e5, -1e5], [1e5, 1e5]],
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "as", "type": "string", "default": "path" }
  ]
};
var prototype$1g = inherits(Voronoi, Transform);
var defaultExtent = [[-1e5, -1e5], [1e5, 1e5]];
prototype$1g.transform = function(_$$1, pulse) {
  var as = _$$1.as || 'path',
      data = pulse.source,
      diagram, polygons, i, n;
  diagram = d3Voronoi.voronoi().x(_$$1.x).y(_$$1.y);
  if (_$$1.size) diagram.size(_$$1.size);
  else diagram.extent(_$$1.extent || defaultExtent);
  this.value = (diagram = diagram(data));
  polygons = diagram.polygons();
  for (i=0, n=data.length; i<n; ++i) {
    data[i][as] = polygons[i]
      ? 'M' + polygons[i].join('L') + 'Z'
      : null;
  }
  return pulse.reflow(_$$1.modified()).modifies(as);
};



var voronoi = /*#__PURE__*/Object.freeze({
  voronoi: Voronoi
});

var cloudRadians = Math.PI / 180,
    cw = 1 << 11 >> 5,
    ch = 1 << 11;
function cloud() {
  var size = [256, 256],
      text,
      font,
      fontSize,
      fontStyle,
      fontWeight,
      rotate,
      padding,
      spiral = archimedeanSpiral,
      words = [],
      random = Math.random,
      cloud = {};
  cloud.layout = function() {
    var contextAndRatio = getContext(canvas()),
        board = zeroArray((size[0] >> 5) * size[1]),
        bounds = null,
        n = words.length,
        i = -1,
        tags = [],
        data = words.map(function(d) {
          return {
            text: text(d),
            font: font(d),
            style: fontStyle(d),
            weight: fontWeight(d),
            rotate: rotate(d),
            size: ~~fontSize(d),
            padding: padding(d),
            xoff: 0,
            yoff: 0,
            x1: 0,
            y1: 0,
            x0: 0,
            y0: 0,
            hasText: false,
            sprite: null,
            datum: d
          };
        }).sort(function(a, b) { return b.size - a.size; });
    while (++i < n) {
      var d = data[i];
      d.x = (size[0] * (random() + .5)) >> 1;
      d.y = (size[1] * (random() + .5)) >> 1;
      cloudSprite(contextAndRatio, d, data, i);
      if (d.hasText && place(board, d, bounds)) {
        tags.push(d);
        if (bounds) cloudBounds(bounds, d);
        else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
        d.x -= size[0] >> 1;
        d.y -= size[1] >> 1;
      }
    }
    return tags;
  };
  function getContext(canvas$$1) {
    canvas$$1.width = canvas$$1.height = 1;
    var ratio = Math.sqrt(canvas$$1.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas$$1.width = (cw << 5) / ratio;
    canvas$$1.height = ch / ratio;
    var context = canvas$$1.getContext("2d");
    context.fillStyle = context.strokeStyle = "red";
    context.textAlign = "center";
    return {context: context, ratio: ratio};
  }
  function place(board, tag, bounds) {
    var startX = tag.x,
        startY = tag.y,
        maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
        s = spiral(size),
        dt = random() < .5 ? 1 : -1,
        t = -dt,
        dxdy,
        dx,
        dy;
    while (dxdy = s(t += dt)) {
      dx = ~~dxdy[0];
      dy = ~~dxdy[1];
      if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;
      tag.x = startX + dx;
      tag.y = startY + dy;
      if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
          tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
      if (!bounds || !cloudCollide(tag, board, size[0])) {
        if (!bounds || collideRects(tag, bounds)) {
          var sprite = tag.sprite,
              w = tag.width >> 5,
              sw = size[0] >> 5,
              lx = tag.x - (w << 4),
              sx = lx & 0x7f,
              msx = 32 - sx,
              h = tag.y1 - tag.y0,
              x = (tag.y + tag.y0) * sw + (lx >> 5),
              last;
          for (var j = 0; j < h; j++) {
            last = 0;
            for (var i = 0; i <= w; i++) {
              board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
            }
            x += sw;
          }
          tag.sprite = null;
          return true;
        }
      }
    }
    return false;
  }
  cloud.words = function(_$$1) {
    if (arguments.length) {
      words = _$$1;
      return cloud;
    } else {
      return words;
    }
  };
  cloud.size = function(_$$1) {
    if (arguments.length) {
      size = [+_$$1[0], +_$$1[1]];
      return cloud;
    } else {
      return size;
    }
  };
  cloud.font = function(_$$1) {
    if (arguments.length) {
      font = functor(_$$1);
      return cloud;
    } else {
      return font;
    }
  };
  cloud.fontStyle = function(_$$1) {
    if (arguments.length) {
      fontStyle = functor(_$$1);
      return cloud;
    } else {
      return fontStyle;
    }
  };
  cloud.fontWeight = function(_$$1) {
    if (arguments.length) {
      fontWeight = functor(_$$1);
      return cloud;
    } else {
      return fontWeight;
    }
  };
  cloud.rotate = function(_$$1) {
    if (arguments.length) {
      rotate = functor(_$$1);
      return cloud;
    } else {
      return rotate;
    }
  };
  cloud.text = function(_$$1) {
    if (arguments.length) {
      text = functor(_$$1);
      return cloud;
    } else {
      return text;
    }
  };
  cloud.spiral = function(_$$1) {
    if (arguments.length) {
      spiral = spirals[_$$1] || _$$1;
      return cloud;
    } else {
      return spiral;
    }
  };
  cloud.fontSize = function(_$$1) {
    if (arguments.length) {
      fontSize = functor(_$$1);
      return cloud;
    } else {
      return fontSize;
    }
  };
  cloud.padding = function(_$$1) {
    if (arguments.length) {
      padding = functor(_$$1);
      return cloud;
    } else {
      return padding;
    }
  };
  cloud.random = function(_$$1) {
    if (arguments.length) {
      random = _$$1;
      return cloud;
    } else {
      return random;
    }
  };
  return cloud;
}
function cloudSprite(contextAndRatio, d, data, di) {
  if (d.sprite) return;
  var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;
  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
  var x = 0,
      y = 0,
      maxh = 0,
      n = data.length,
      w, w32, h, i, j;
  --di;
  while (++di < n) {
    d = data[di];
    c.save();
    c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
    w = c.measureText(d.text + "m").width * ratio;
    h = d.size << 1;
    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = (w + 0x1f) >> 5 << 5;
    }
    if (h > maxh) maxh = h;
    if (x + w >= (cw << 5)) {
      x = 0;
      y += maxh;
      maxh = 0;
    }
    if (y + h >= ch) break;
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    c.fillText(d.text, 0, 0);
    if (d.padding) {
      c.lineWidth = 2 * d.padding;
      c.strokeText(d.text, 0, 0);
    }
    c.restore();
    d.width = w;
    d.height = h;
    d.xoff = x;
    d.yoff = y;
    d.x1 = w >> 1;
    d.y1 = h >> 1;
    d.x0 = -d.x1;
    d.y0 = -d.y1;
    d.hasText = true;
    x += w;
  }
  var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
  while (--di >= 0) {
    d = data[di];
    if (!d.hasText) continue;
    w = d.width;
    w32 = w >> 5;
    h = d.y1 - d.y0;
    for (i = 0; i < h * w32; i++) sprite[i] = 0;
    x = d.xoff;
    if (x == null) return;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (j = 0; j < h; j++) {
      for (i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;
      else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
  }
}
function cloudCollide(tag, board, sw) {
  sw >>= 5;
  var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
  for (var j = 0; j < h; j++) {
    last = 0;
    for (var i = 0; i <= w; i++) {
      if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
          & board[x + i]) return true;
    }
    x += sw;
  }
  return false;
}
function cloudBounds(bounds, d) {
  var b0 = bounds[0],
      b1 = bounds[1];
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
}
function collideRects(a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
}
function archimedeanSpiral(size) {
  var e = size[0] / size[1];
  return function(t) {
    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
  };
}
function rectangularSpiral(size) {
  var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
  return function(t) {
    var sign = t < 0 ? -1 : 1;
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:  x += dx; break;
      case 1:  y += dy; break;
      case 2:  x -= dx; break;
      default: y -= dy; break;
    }
    return [x, y];
  };
}
function zeroArray(n) {
  var a = [],
      i = -1;
  while (++i < n) a[i] = 0;
  return a;
}
function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}
var spirals = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
};

var Output$4 = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'angle'];
var Params$1 = ['text', 'font', 'rotate', 'fontSize', 'fontStyle', 'fontWeight'];
function Wordcloud(params) {
  Transform.call(this, cloud(), params);
}
Wordcloud.Definition = {
  "type": "Wordcloud",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "font", "type": "string", "expr": true, "default": "sans-serif" },
    { "name": "fontStyle", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontWeight", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontSize", "type": "number", "expr": true, "default": 14 },
    { "name": "fontSizeRange", "type": "number", "array": "nullable", "default": [10, 50] },
    { "name": "rotate", "type": "number", "expr": true, "default": 0 },
    { "name": "text", "type": "field" },
    { "name": "spiral", "type": "string", "values": ["archimedean", "rectangular"] },
    { "name": "padding", "type": "number", "expr": true },
    { "name": "as", "type": "string", "array": true, "length": 7, "default": Output$4 }
  ]
};
var prototype$1h = inherits(Wordcloud, Transform);
prototype$1h.transform = function(_$$1, pulse) {
  function modp(param) {
    var p = _$$1[param];
    return isFunction(p) && pulse.modified(p.fields);
  }
  var mod = _$$1.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params$1.some(modp))) return;
  var data = pulse.materialize(pulse.SOURCE).source,
      layout = this.value,
      as = _$$1.as || Output$4,
      fontSize = _$$1.fontSize || 14,
      range;
  isFunction(fontSize)
    ? (range = _$$1.fontSizeRange)
    : (fontSize = constant(fontSize));
  if (range) {
    var fsize = fontSize,
        sizeScale = scale$1('sqrt')()
          .domain(extent$1(fsize, data))
          .range(range);
    fontSize = function(x) { return sizeScale(fsize(x)); };
  }
  data.forEach(function(t) {
    t[as[0]] = NaN;
    t[as[1]] = NaN;
    t[as[3]] = 0;
  });
  var words = layout
    .words(data)
    .text(_$$1.text)
    .size(_$$1.size || [500, 500])
    .padding(_$$1.padding || 1)
    .spiral(_$$1.spiral || 'archimedean')
    .rotate(_$$1.rotate || 0)
    .font(_$$1.font || 'sans-serif')
    .fontStyle(_$$1.fontStyle || 'normal')
    .fontWeight(_$$1.fontWeight || 'normal')
    .fontSize(fontSize)
    .random(random)
    .layout();
  var size = layout.size(),
      dx = size[0] >> 1,
      dy = size[1] >> 1,
      i = 0,
      n = words.length,
      w, t;
  for (; i<n; ++i) {
    w = words[i];
    t = w.datum;
    t[as[0]] = w.x + dx;
    t[as[1]] = w.y + dy;
    t[as[2]] = w.font;
    t[as[3]] = w.size;
    t[as[4]] = w.style;
    t[as[5]] = w.weight;
    t[as[6]] = w.rotate;
  }
  return pulse.reflow(mod).modifies(as);
};
function extent$1(field$$1, data) {
  var min = +Infinity,
      max = -Infinity,
      i = 0,
      n = data.length,
      v;
  for (; i<n; ++i) {
    v = field$$1(data[i]);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
}



var wordcloud = /*#__PURE__*/Object.freeze({
  wordcloud: Wordcloud
});

function array8(n) { return new Uint8Array(n); }
function array16(n) { return new Uint16Array(n); }
function array32(n) { return new Uint32Array(n); }

function Bitmaps() {
  var width = 8,
      data = [],
      seen = array32(0),
      curr = array$1(0, width),
      prev = array$1(0, width);
  return {
    data: function() { return data; },
    seen: function() {
      return (seen = lengthen(seen, data.length));
    },
    add: function(array) {
      for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
        t = array[i];
        t._index = j++;
        data.push(t);
      }
    },
    remove: function(num, map) {
      var n = data.length,
          copy = Array(n - num),
          reindex = data,
          t, i, j;
      for (i=0; !map[i] && i<n; ++i) {
        copy[i] = data[i];
        reindex[i] = i;
      }
      for (j=i; i<n; ++i) {
        t = data[i];
        if (!map[i]) {
          reindex[i] = j;
          curr[j] = curr[i];
          prev[j] = prev[i];
          copy[j] = t;
          t._index = j++;
        } else {
          reindex[i] = -1;
        }
        curr[i] = 0;
      }
      data = copy;
      return reindex;
    },
    size: function() { return data.length; },
    curr: function() { return curr; },
    prev: function() { return prev; },
    reset: function(k) { prev[k] = curr[k]; },
    all: function() {
      return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
    },
    set: function(k, one) { curr[k] |= one; },
    clear: function(k, one) { curr[k] &= ~one; },
    resize: function(n, m) {
      var k = curr.length;
      if (n > k || m > width) {
        width = Math.max(m, width);
        curr = array$1(n, width, curr);
        prev = array$1(n, width);
      }
    }
  };
}
function lengthen(array, length, copy) {
  if (array.length >= length) return array;
  copy = copy || new array.constructor(length);
  copy.set(array);
  return copy;
}
function array$1(n, m, array) {
  var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
  if (array) copy.set(array);
  return copy;
}

function Dimension(index, i, query) {
  var bit = (1 << i);
  return {
    one:     bit,
    zero:    ~bit,
    range:   query.slice(),
    bisect:  index.bisect,
    index:   index.index,
    size:    index.size,
    onAdd: function(added, curr) {
      var dim = this,
          range = dim.bisect(dim.range, added.value),
          idx = added.index,
          lo = range[0],
          hi = range[1],
          n1 = idx.length, i;
      for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
      for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
      return dim;
    }
  };
}

function SortedIndex() {
  var index = array32(0),
      value = [],
      size = 0;
  function insert(key, data, base) {
    if (!data.length) return [];
    var n0 = size,
        n1 = data.length,
        addv = Array(n1),
        addi = array32(n1),
        oldv, oldi, i;
    for (i=0; i<n1; ++i) {
      addv[i] = key(data[i]);
      addi[i] = i;
    }
    addv = sort(addv, addi);
    if (n0) {
      oldv = value;
      oldi = index;
      value = Array(n0 + n1);
      index = array32(n0 + n1);
      merge$1(base, oldv, oldi, n0, addv, addi, n1, value, index);
    } else {
      if (base > 0) for (i=0; i<n1; ++i) {
        addi[i] += base;
      }
      value = addv;
      index = addi;
    }
    size = n0 + n1;
    return {index: addi, value: addv};
  }
  function remove(num, map) {
    var n = size,
        idx, i, j;
    for (i=0; !map[index[i]] && i<n; ++i);
    for (j=i; i<n; ++i) {
      if (!map[idx=index[i]]) {
        index[j] = idx;
        value[j] = value[i];
        ++j;
      }
    }
    size = n - num;
  }
  function reindex(map) {
    for (var i=0, n=size; i<n; ++i) {
      index[i] = map[index[i]];
    }
  }
  function bisect(range, array) {
    var n;
    if (array) {
      n = array.length;
    } else {
      array = value;
      n = size;
    }
    return [
      d3Array.bisectLeft(array, range[0], 0, n),
      d3Array.bisectRight(array, range[1], 0, n)
    ];
  }
  return {
    insert:  insert,
    remove:  remove,
    bisect:  bisect,
    reindex: reindex,
    index:   function() { return index; },
    size:    function() { return size; }
  };
}
function sort(values, index) {
  values.sort.call(index, function(a, b) {
    var x = values[a],
        y = values[b];
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return d3Array.permute(values, index);
}
function merge$1(base, value0, index0, n0, value1, index1, n1, value, index) {
  var i0 = 0, i1 = 0, i;
  for (i=0; i0 < n0 && i1 < n1; ++i) {
    if (value0[i0] < value1[i1]) {
      value[i] = value0[i0];
      index[i] = index0[i0++];
    } else {
      value[i] = value1[i1];
      index[i] = index1[i1++] + base;
    }
  }
  for (; i0 < n0; ++i0, ++i) {
    value[i] = value0[i0];
    index[i] = index0[i0];
  }
  for (; i1 < n1; ++i1, ++i) {
    value[i] = value1[i1];
    index[i] = index1[i1] + base;
  }
}

function CrossFilter(params) {
  Transform.call(this, Bitmaps(), params);
  this._indices = null;
  this._dims = null;
}
CrossFilter.Definition = {
  "type": "CrossFilter",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "query", "type": "array", "array": true, "required": true,
      "content": {"type": "number", "array": true, "length": 2} }
  ]
};
var prototype$1i = inherits(CrossFilter, Transform);
prototype$1i.transform = function(_$$1, pulse) {
  if (!this._dims) {
    return this.init(_$$1, pulse);
  } else {
    var init = _$$1.modified('fields')
          || _$$1.fields.some(function(f) { return pulse.modified(f.fields); });
    return init
      ? this.reinit(_$$1, pulse)
      : this.eval(_$$1, pulse);
  }
};
prototype$1i.init = function(_$$1, pulse) {
  var fields = _$$1.fields,
      query = _$$1.query,
      indices = this._indices = {},
      dims = this._dims = [],
      m = query.length,
      i = 0, key$$1, index;
  for (; i<m; ++i) {
    key$$1 = fields[i].fname;
    index = indices[key$$1] || (indices[key$$1] = SortedIndex());
    dims.push(Dimension(index, i, query[i]));
  }
  return this.eval(_$$1, pulse);
};
prototype$1i.reinit = function(_$$1, pulse) {
  var output = pulse.materialize().fork(),
      fields = _$$1.fields,
      query = _$$1.query,
      indices = this._indices,
      dims = this._dims,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all = bits.all(),
      out = (output.rem = output.add),
      mod = output.mod,
      m = query.length,
      adds = {}, add, index, key$$1,
      mods, remMap, modMap, i, n, f;
  prev.set(curr);
  if (pulse.rem.length) {
    remMap = this.remove(_$$1, pulse, output);
  }
  if (pulse.add.length) {
    bits.add(pulse.add);
  }
  if (pulse.mod.length) {
    modMap = {};
    for (mods=pulse.mod, i=0, n=mods.length; i<n; ++i) {
      modMap[mods[i]._index] = 1;
    }
  }
  for (i=0; i<m; ++i) {
    f = fields[i];
    if (!dims[i] || _$$1.modified('fields', i) || pulse.modified(f.fields)) {
      key$$1 = f.fname;
      if (!(add = adds[key$$1])) {
        indices[key$$1] = index = SortedIndex();
        adds[key$$1] = add = index.insert(f, pulse.source, 0);
      }
      dims[i] = Dimension(index, i, query[i]).onAdd(add, curr);
    }
  }
  for (i=0, n=bits.data().length; i<n; ++i) {
    if (remMap[i]) {
      continue;
    } else if (prev[i] !== curr[i]) {
      out.push(i);
    } else if (modMap[i] && curr[i] !== all) {
      mod.push(i);
    }
  }
  bits.mask = (1 << m) - 1;
  return output;
};
prototype$1i.eval = function(_$$1, pulse) {
  var output = pulse.materialize().fork(),
      m = this._dims.length,
      mask = 0;
  if (pulse.rem.length) {
    this.remove(_$$1, pulse, output);
    mask |= (1 << m) - 1;
  }
  if (_$$1.modified('query') && !_$$1.modified('fields')) {
    mask |= this.update(_$$1, pulse, output);
  }
  if (pulse.add.length) {
    this.insert(_$$1, pulse, output);
    mask |= (1 << m) - 1;
  }
  if (pulse.mod.length) {
    this.modify(pulse, output);
    mask |= (1 << m) - 1;
  }
  this.value.mask = mask;
  return output;
};
prototype$1i.insert = function(_$$1, pulse, output) {
  var tuples = pulse.add,
      bits = this.value,
      dims = this._dims,
      indices = this._indices,
      fields = _$$1.fields,
      adds = {},
      out = output.add,
      k = bits.size(),
      n = k + tuples.length,
      m = dims.length, j, key$$1, add;
  bits.resize(n, m);
  bits.add(tuples);
  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all();
  for (j=0; j<m; ++j) {
    key$$1 = fields[j].fname;
    add = adds[key$$1] || (adds[key$$1] = indices[key$$1].insert(fields[j], tuples, k));
    dims[j].onAdd(add, curr);
  }
  for (; k<n; ++k) {
    prev[k] = all;
    if (curr[k] !== all) out.push(k);
  }
};
prototype$1i.modify = function(pulse, output) {
  var out = output.mod,
      bits = this.value,
      curr = bits.curr(),
      all  = bits.all(),
      tuples = pulse.mod,
      i, n, k;
  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    if (curr[k] !== all) out.push(k);
  }
};
prototype$1i.remove = function(_$$1, pulse, output) {
  var indices = this._indices,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      map = {},
      out = output.rem,
      tuples = pulse.rem,
      i, n, k, f;
  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    map[k] = 1;
    prev[k] = (f = curr[k]);
    curr[k] = all;
    if (f !== all) out.push(k);
  }
  for (k in indices) {
    indices[k].remove(n, map);
  }
  this.reindex(pulse, n, map);
  return map;
};
prototype$1i.reindex = function(pulse, num, map) {
  var indices = this._indices,
      bits = this.value;
  pulse.runAfter(function() {
    var indexMap = bits.remove(num, map);
    for (var key$$1 in indices) indices[key$$1].reindex(indexMap);
  });
};
prototype$1i.update = function(_$$1, pulse, output) {
  var dims = this._dims,
      query = _$$1.query,
      stamp = pulse.stamp,
      m = dims.length,
      mask = 0, i, q;
  output.filters = 0;
  for (q=0; q<m; ++q) {
    if (_$$1.modified('query', q)) { i = q; ++mask; }
  }
  if (mask === 1) {
    mask = dims[i].one;
    this.incrementOne(dims[i], query[i], output.add, output.rem);
  } else {
    for (q=0, mask=0; q<m; ++q) {
      if (!_$$1.modified('query', q)) continue;
      mask |= dims[q].one;
      this.incrementAll(dims[q], query[q], stamp, output.add);
      output.rem = output.add;
    }
  }
  return mask;
};
prototype$1i.incrementAll = function(dim, query, stamp, out) {
  var bits = this.value,
      seen = bits.seen(),
      curr = bits.curr(),
      prev = bits.prev(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one$$1 = dim.one,
      i, j, k;
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  }
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  }
  dim.range = query.slice();
};
prototype$1i.incrementOne = function(dim, query, add, rem) {
  var bits = this.value,
      curr = bits.curr(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one$$1 = dim.one,
      i, j, k;
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      add.push(k);
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      rem.push(k);
    }
  }
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      add.push(k);
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      rem.push(k);
    }
  }
  dim.range = query.slice();
};

function ResolveFilter(params) {
  Transform.call(this, null, params);
}
ResolveFilter.Definition = {
  "type": "ResolveFilter",
  "metadata": {},
  "params": [
    { "name": "ignore", "type": "number", "required": true,
      "description": "A bit mask indicating which filters to ignore." },
    { "name": "filter", "type": "object", "required": true,
      "description": "Per-tuple filter bitmaps from a CrossFilter transform." }
  ]
};
var prototype$1j = inherits(ResolveFilter, Transform);
prototype$1j.transform = function(_$$1, pulse) {
  var ignore = ~(_$$1.ignore || 0),
      bitmap = _$$1.filter,
      mask = bitmap.mask;
  if ((mask & ignore) === 0) return pulse.StopPropagation;
  var output = pulse.fork(pulse.ALL),
      data = bitmap.data(),
      curr = bitmap.curr(),
      prev = bitmap.prev(),
      pass = function(k) {
        return !(curr[k] & ignore) ? data[k] : null;
      };
  output.filter(output.MOD, pass);
  if (!(mask & (mask-1))) {
    output.filter(output.ADD, pass);
    output.filter(output.REM, function(k) {
      return (curr[k] & ignore) === mask ? data[k] : null;
    });
  } else {
    output.filter(output.ADD, function(k) {
      var c = curr[k] & ignore,
          f = !c && (c ^ (prev[k] & ignore));
      return f ? data[k] : null;
    });
    output.filter(output.REM, function(k) {
      var c = curr[k] & ignore,
          f = c && !(c ^ (c ^ (prev[k] & ignore)));
      return f ? data[k] : null;
    });
  }
  return output.filter(output.SOURCE, function(t) { return pass(t._index); });
};



var xf = /*#__PURE__*/Object.freeze({
  crossfilter: CrossFilter,
  resolvefilter: ResolveFilter
});

var version = "3.3.1";

var Default = 'default';
function cursor(view) {
  var cursor = view._signals.cursor;
  if (!cursor) {
    view._signals.cursor = (cursor = view.add({user: Default, item: null}));
  }
  view.on(view.events('view', 'mousemove'), cursor,
    function(_$$1, event) {
      var value = cursor.value,
          user = value ? (isString(value) ? value : value.user) : Default,
          item = event.item && event.item.cursor || null;
      return (value && user === value.user && item == value.item) ? value
        : {user: user, item: item};
    }
  );
  view.add(null, function(_$$1) {
    var user = _$$1.cursor,
        item = this.value;
    if (!isString(user)) {
      item = user.item;
      user = user.user;
    }
    setCursor(user && user !== Default ? user : (item || user));
    return item;
  }, {cursor: cursor});
}
function setCursor(cursor) {
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = cursor;
  }
}

function dataref(view, name) {
  var data = view._runtime.data;
  if (!data.hasOwnProperty(name)) {
    error('Unrecognized data set: ' + name);
  }
  return data[name];
}
function data(name) {
  return dataref(this, name).values.value;
}
function change(name, changes) {
  if (!isChangeSet(changes)) {
    error('Second argument to changes must be a changeset.');
  }
  var dataset = dataref(this, name);
  dataset.modified = true;
  return this.pulse(dataset.input, changes);
}
function insert(name, _$$1) {
  return change.call(this, name, changeset().insert(_$$1));
}
function remove(name, _$$1) {
  return change.call(this, name, changeset().remove(_$$1));
}

function width(view) {
  var padding = view.padding();
  return Math.max(0, view._viewWidth + padding.left + padding.right);
}
function height$1(view) {
  var padding = view.padding();
  return Math.max(0, view._viewHeight + padding.top + padding.bottom);
}
function offset$1(view) {
  var padding = view.padding(),
      origin = view._origin;
  return [
    padding.left + origin[0],
    padding.top + origin[1]
  ];
}
function resizeRenderer(view) {
  var origin = offset$1(view),
      w = width(view),
      h = height$1(view);
  view._renderer.background(view._background);
  view._renderer.resize(w, h, origin);
  view._handler.origin(origin);
  view._resizeListeners.forEach(function(handler) {
    handler(w, h);
  });
}

function eventExtend(view, event, item) {
  var el = view._renderer.scene(),
      p, e, translate;
  if (el) {
    translate = offset$1(view);
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point(e, el);
    p[0] -= translate[0];
    p[1] -= translate[1];
  }
  event.dataflow = view;
  event.vega = extension(view, item, p);
  event.item = item;
  return event;
}
function extension(view, item, point$$1) {
  var itemGroup = item
    ? item.mark.marktype === 'group' ? item : item.mark.group
    : null;
  function group(name) {
    var g = itemGroup, i;
    if (name) for (i = item; i; i = i.mark.group) {
      if (i.mark.name === name) { g = i; break; }
    }
    return g && g.mark && g.mark.interactive ? g : {};
  }
  function xy(item) {
    if (!item) return point$$1;
    if (isString(item)) item = group(item);
    var p = point$$1.slice();
    while (item) {
      p[0] -= item.x || 0;
      p[1] -= item.y || 0;
      item = item.mark && item.mark.group;
    }
    return p;
  }
  return {
    view:  constant(view),
    item:  constant(item || {}),
    group: group,
    xy:    xy,
    x:     function(item) { return xy(item)[0]; },
    y:     function(item) { return xy(item)[1]; }
  };
}

var VIEW = 'view',
    WINDOW = 'window';
function initializeEventConfig(config) {
  config = extend({}, config);
  var def = config.defaults;
  if (def) {
    if (isArray(def.prevent)) {
      def.prevent = toSet(def.prevent);
    }
    if (isArray(def.allow)) {
      def.allow = toSet(def.allow);
    }
  }
  return config;
}
function prevent(view, type) {
  var def = view._eventConfig.defaults,
      prevent = def && def.prevent,
      allow = def && def.allow;
  return prevent === false || allow === true ? false
    : prevent === true || allow === false ? true
    : prevent ? prevent[type]
    : allow ? !allow[type]
    : view.preventDefault();
}
function events$1(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        if (source === VIEW && prevent(view, type)) {
          e.preventDefault();
        }
        try {
          s.receive(eventExtend(view, e, item));
        } catch (error$$1) {
          view.error(error$$1);
        } finally {
          view.run();
        }
      },
      sources;
  if (source === VIEW) {
    view.addEventListener(type, send);
    return s;
  }
  if (source === WINDOW) {
    if (typeof window !== 'undefined') sources = [window];
  } else if (typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  }
  if (!sources) {
    view.warn('Can not resolve event source: ' + source);
    return s;
  }
  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }
  view._eventListeners.push({
    type:    type,
    sources: sources,
    handler: send
  });
  return s;
}

function itemFilter(event) {
  return event.item;
}
function markTarget(event) {
  var source = event.item.mark.source;
  return source.source || source;
}
function invoke(name) {
  return function(_$$1, event) {
    return event.vega.view()
      .changeset()
      .encode(event.item, name);
  };
}
function hover(hoverSet, leaveSet) {
  hoverSet = [hoverSet || 'hover'];
  leaveSet = [leaveSet || 'update', hoverSet[0]];
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet)
  );
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet)
  );
  return this;
}

function finalize() {
  var listeners = this._eventListeners,
      n = listeners.length, m, e;
  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
}

function element$1(tag, attr, text) {
  var el = document.createElement(tag);
  for (var key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
}

var BindClass = 'vega-bind',
    NameClass = 'vega-bind-name',
    RadioClass = 'vega-bind-radio',
    OptionClass = 'vega-option-';
function bind$1(view, el, binding) {
  if (!el) return;
  var param = binding.param,
      bind = binding.state;
  if (!bind) {
    bind = binding.state = {
      elements: null,
      active: false,
      set: null,
      update: function(value) {
        bind.source = true;
        view.signal(param.signal, value).run();
      }
    };
    if (param.debounce) {
      bind.update = debounce(param.debounce, bind.update);
    }
  }
  generate(bind, el, param, view.signal(param.signal));
  if (!bind.active) {
    view.on(view._signals[param.signal], null, function() {
      bind.source
        ? (bind.source = false)
        : bind.set(view.signal(param.signal));
    });
    bind.active = true;
  }
  return bind;
}
function generate(bind, el, param, value) {
  var div = element$1('div', {'class': BindClass});
  div.appendChild(element$1('span',
    {'class': NameClass},
    (param.name || param.signal)
  ));
  el.appendChild(div);
  var input = form;
  switch (param.input) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range; break;
  }
  input(bind, div, param, value);
}
function form(bind, el, param, value) {
  var node = element$1('input');
  for (var key$$1 in param) {
    if (key$$1 !== 'signal' && key$$1 !== 'element') {
      node.setAttribute(key$$1 === 'input' ? 'type' : key$$1, param[key$$1]);
    }
  }
  node.setAttribute('name', param.signal);
  node.value = value;
  el.appendChild(node);
  node.addEventListener('input', function() {
    bind.update(node.value);
  });
  bind.elements = [node];
  bind.set = function(value) { node.value = value; };
}
function checkbox(bind, el, param, value) {
  var attr = {type: 'checkbox', name: param.signal};
  if (value) attr.checked = true;
  var node = element$1('input', attr);
  el.appendChild(node);
  node.addEventListener('change', function() {
    bind.update(node.checked);
  });
  bind.elements = [node];
  bind.set = function(value) { node.checked = !!value || null; };
}
function select(bind, el, param, value) {
  var node = element$1('select', {name: param.signal});
  param.options.forEach(function(option) {
    var attr = {value: option};
    if (valuesEqual(option, value)) attr.selected = true;
    node.appendChild(element$1('option', attr, option+''));
  });
  el.appendChild(node);
  node.addEventListener('change', function() {
    bind.update(param.options[node.selectedIndex]);
  });
  bind.elements = [node];
  bind.set = function(value) {
    for (var i=0, n=param.options.length; i<n; ++i) {
      if (valuesEqual(param.options[i], value)) {
        node.selectedIndex = i; return;
      }
    }
  };
}
function radio(bind, el, param, value) {
  var group = element$1('span', {'class': RadioClass});
  el.appendChild(group);
  bind.elements = param.options.map(function(option) {
    var id$$1 = OptionClass + param.signal + '-' + option;
    var attr = {
      id:    id$$1,
      type:  'radio',
      name:  param.signal,
      value: option
    };
    if (valuesEqual(option, value)) attr.checked = true;
    var input = element$1('input', attr);
    input.addEventListener('change', function() {
      bind.update(option);
    });
    group.appendChild(input);
    group.appendChild(element$1('label', {'for': id$$1}, option+''));
    return input;
  });
  bind.set = function(value) {
    var nodes = bind.elements,
        i = 0,
        n = nodes.length;
    for (; i<n; ++i) {
      if (valuesEqual(nodes[i].value, value)) nodes[i].checked = true;
    }
  };
}
function range(bind, el, param, value) {
  value = value !== undefined ? value : ((+param.max) + (+param.min)) / 2;
  var min = param.min || Math.min(0, +value) || 0,
      max = param.max || Math.max(100, +value) || 100,
      step = param.step || d3Array.tickStep(min, max, 100);
  var node = element$1('input', {
    type:  'range',
    name:  param.signal,
    min:   min,
    max:   max,
    step:  step
  });
  node.value = value;
  var label = element$1('label', {}, +value);
  el.appendChild(node);
  el.appendChild(label);
  function update() {
    label.textContent = node.value;
    bind.update(+node.value);
  }
  node.addEventListener('input', update);
  node.addEventListener('change', update);
  bind.elements = [node];
  bind.set = function(value) {
    node.value = value;
    label.textContent = value;
  };
}
function valuesEqual(a, b) {
  return a === b || (a+'' === b+'');
}

function initializeRenderer(view, r, el, constructor, scaleFactor) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width(view), height$1(view), offset$1(view), scaleFactor)
    .background(view._background);
}

function initializeHandler(view, prevHandler, el, constructor) {
  var handler = new constructor(view.loader(), tooltip(view))
    .scene(view.scenegraph().root)
    .initialize(el, offset$1(view), view);
  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }
  return handler;
}
function tooltip(view) {
  var handler = view.tooltip(),
      tooltip = null;
  if (handler) {
    tooltip = function() {
      try {
        handler.apply(this, arguments);
      } catch (error) {
        view.error(error);
      }
    };
  }
  return tooltip;
}

function initialize$1(el, elBind) {
  var view = this,
      type = view._renderType,
      module = renderModule(type),
      Handler$$1, Renderer$$1;
  el = view._el = el ? lookup$2(view, el) : null;
  if (!module) view.error('Unrecognized renderer type: ' + type);
  Handler$$1 = module.handler || CanvasHandler;
  Renderer$$1 = (el ? module.renderer : module.headless);
  view._renderer = !Renderer$$1 ? null
    : initializeRenderer(view, view._renderer, el, Renderer$$1);
  view._handler = initializeHandler(view, view._handler, el, Handler$$1);
  view._redraw = true;
  if (el) {
    elBind = elBind ? lookup$2(view, elBind)
      : el.appendChild(element$1('div', {'class': 'vega-bindings'}));
    view._bind.forEach(function(_$$1) {
      if (_$$1.param.element) {
        _$$1.element = lookup$2(view, _$$1.param.element);
      }
    });
    view._bind.forEach(function(_$$1) {
      bind$1(view, _$$1.element || elBind, _$$1);
    });
  }
  return view;
}
function lookup$2(view, el) {
  if (typeof el === 'string') {
    if (typeof document !== 'undefined') {
      el = document.querySelector(el);
      if (!el) {
        view.error('Signal bind element not found: ' + el);
        return null;
      }
    } else {
      view.error('DOM document instance not found.');
      return null;
    }
  }
  if (el) {
    try {
      el.innerHTML = '';
    } catch (e) {
      el = null;
      view.error(e);
    }
  }
  return el;
}

function renderHeadless(view, type, scaleFactor) {
  var module = renderModule(type),
      ctr = module && module.headless;
  return !ctr
    ? Promise.reject('Unrecognized renderer type: ' + type)
    : view.runAsync().then(function() {
        return initializeRenderer(view, null, null, ctr, scaleFactor)
          .renderAsync(view._scenegraph.root);
      });
}

function renderToImageURL(type, scaleFactor) {
  return (type !== RenderType.Canvas && type !== RenderType.SVG && type !== RenderType.PNG)
    ? Promise.reject('Unrecognized image type: ' + type)
    : renderHeadless(this, type, scaleFactor).then(function(renderer) {
        return type === RenderType.SVG
          ? toBlobURL(renderer.svg(), 'image/svg+xml')
          : renderer.canvas().toDataURL('image/png');
      });
}
function toBlobURL(data, mime) {
  var blob = new Blob([data], {type: mime});
  return window.URL.createObjectURL(blob);
}

function renderToCanvas(scaleFactor) {
  return renderHeadless(this, RenderType.Canvas, scaleFactor)
    .then(function(renderer) { return renderer.canvas(); });
}

function renderToSVG(scaleFactor) {
  return renderHeadless(this, RenderType.SVG, scaleFactor)
    .then(function(renderer) { return renderer.svg(); });
}

function parseAutosize(spec, config) {
  spec = spec || config.autosize;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = spec || 'pad';
    return {type: spec};
  }
}

function parsePadding(spec, config) {
  spec = spec || config.padding;
  return isObject(spec)
    ? {
        top:    number(spec.top),
        bottom: number(spec.bottom),
        left:   number(spec.left),
        right:  number(spec.right)
      }
    : paddingObject(number(spec));
}
function number(_$$1) {
  return +_$$1 || 0;
}
function paddingObject(_$$1) {
  return {top: _$$1, bottom: _$$1, left: _$$1, right: _$$1};
}

var OUTER = 'outer',
    OUTER_INVALID = ['value', 'update', 'react', 'bind'];
function outerError(prefix, name) {
  error(prefix + ' for "outer" push: ' + $$2(name));
}
function parseSignal(signal, scope) {
  var name = signal.name;
  if (signal.push === OUTER) {
    if (!scope.signals[name]) outerError('No prior signal definition', name);
    OUTER_INVALID.forEach(function(prop) {
      if (signal[prop] !== undefined) outerError('Invalid property ', prop);
    });
  } else {
    var op = scope.addSignal(name, signal.value);
    if (signal.react === false) op.react = false;
    if (signal.bind) scope.addBinding(name, signal.bind);
  }
}

var RawCode = 'RawCode';
var Literal = 'Literal';
var Property = 'Property';
var Identifier$1 = 'Identifier';
var ArrayExpression = 'ArrayExpression';
var BinaryExpression = 'BinaryExpression';
var CallExpression = 'CallExpression';
var ConditionalExpression = 'ConditionalExpression';
var LogicalExpression = 'LogicalExpression';
var MemberExpression = 'MemberExpression';
var ObjectExpression = 'ObjectExpression';
var UnaryExpression = 'UnaryExpression';
function ASTNode(type) {
  this.type = type;
}
ASTNode.prototype.visit = function(visitor) {
  var node = this, c, i, n;
  if (visitor(node)) return 1;
  for (c=children$1(node), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
};
function children$1(node) {
  switch (node.type) {
    case ArrayExpression:
      return node.elements;
    case BinaryExpression:
    case LogicalExpression:
      return [node.left, node.right];
    case CallExpression:
      var args = node.arguments.slice();
      args.unshift(node.callee);
      return args;
    case ConditionalExpression:
      return [node.test, node.consequent, node.alternate];
    case MemberExpression:
      return [node.object, node.property];
    case ObjectExpression:
      return node.properties;
    case Property:
      return [node.key, node.value];
    case UnaryExpression:
      return [node.argument];
    case Identifier$1:
    case Literal:
    case RawCode:
    default:
      return [];
  }
}

var TokenName,
    source$1,
    index,
    length,
    lookahead;
var TokenBooleanLiteral = 1,
    TokenEOF = 2,
    TokenIdentifier = 3,
    TokenKeyword = 4,
    TokenNullLiteral = 5,
    TokenNumericLiteral = 6,
    TokenPunctuator = 7,
    TokenStringLiteral = 8,
    TokenRegularExpression = 9;
TokenName = {};
TokenName[TokenBooleanLiteral] = 'Boolean';
TokenName[TokenEOF] = '<end>';
TokenName[TokenIdentifier] = 'Identifier';
TokenName[TokenKeyword] = 'Keyword';
TokenName[TokenNullLiteral] = 'Null';
TokenName[TokenNumericLiteral] = 'Numeric';
TokenName[TokenPunctuator] = 'Punctuator';
TokenName[TokenStringLiteral] = 'String';
TokenName[TokenRegularExpression] = 'RegularExpression';
var SyntaxArrayExpression = 'ArrayExpression',
    SyntaxBinaryExpression = 'BinaryExpression',
    SyntaxCallExpression = 'CallExpression',
    SyntaxConditionalExpression = 'ConditionalExpression',
    SyntaxIdentifier = 'Identifier',
    SyntaxLiteral = 'Literal',
    SyntaxLogicalExpression = 'LogicalExpression',
    SyntaxMemberExpression = 'MemberExpression',
    SyntaxObjectExpression = 'ObjectExpression',
    SyntaxProperty = 'Property',
    SyntaxUnaryExpression = 'UnaryExpression';
var MessageUnexpectedToken = 'Unexpected token %0',
    MessageUnexpectedNumber = 'Unexpected number',
    MessageUnexpectedString = 'Unexpected string',
    MessageUnexpectedIdentifier = 'Unexpected identifier',
    MessageUnexpectedReserved = 'Unexpected reserved word',
    MessageUnexpectedEOS = 'Unexpected end of input',
    MessageInvalidRegExp = 'Invalid regular expression',
    MessageUnterminatedRegExp = 'Invalid regular expression: missing /',
    MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.',
    MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';
var ILLEGAL = 'ILLEGAL',
    DISABLED = 'Disabled.';
  var RegexNonAsciiIdentifierStart = new RegExp("[\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]"),
      RegexNonAsciiIdentifierPart = new RegExp("[\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0300-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u0483-\\u0487\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0610-\\u061A\\u0620-\\u0669\\u066E-\\u06D3\\u06D5-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06FC\\u06FF\\u0710-\\u074A\\u074D-\\u07B1\\u07C0-\\u07F5\\u07FA\\u0800-\\u082D\\u0840-\\u085B\\u08A0-\\u08B2\\u08E4-\\u0963\\u0966-\\u096F\\u0971-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CE\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A01-\\u0A03\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A75\\u0A81-\\u0A83\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AD0\\u0AE0-\\u0AE3\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3C-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B63\\u0B66-\\u0B6F\\u0B71\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD0\\u0BD7\\u0BE6-\\u0BEF\\u0C00-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C58\\u0C59\\u0C60-\\u0C63\\u0C66-\\u0C6F\\u0C81-\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBC-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0-\\u0CE3\\u0CE6-\\u0CEF\\u0CF1\\u0CF2\\u0D01-\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4E\\u0D57\\u0D60-\\u0D63\\u0D66-\\u0D6F\\u0D7A-\\u0D7F\\u0D82\\u0D83\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DE6-\\u0DEF\\u0DF2\\u0DF3\\u0E01-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0EDC-\\u0EDF\\u0F00\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F6C\\u0F71-\\u0F84\\u0F86-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u1000-\\u1049\\u1050-\\u109D\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u135D-\\u135F\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1714\\u1720-\\u1734\\u1740-\\u1753\\u1760-\\u176C\\u176E-\\u1770\\u1772\\u1773\\u1780-\\u17D3\\u17D7\\u17DC\\u17DD\\u17E0-\\u17E9\\u180B-\\u180D\\u1810-\\u1819\\u1820-\\u1877\\u1880-\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1920-\\u192B\\u1930-\\u193B\\u1946-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u19D0-\\u19D9\\u1A00-\\u1A1B\\u1A20-\\u1A5E\\u1A60-\\u1A7C\\u1A7F-\\u1A89\\u1A90-\\u1A99\\u1AA7\\u1AB0-\\u1ABD\\u1B00-\\u1B4B\\u1B50-\\u1B59\\u1B6B-\\u1B73\\u1B80-\\u1BF3\\u1C00-\\u1C37\\u1C40-\\u1C49\\u1C4D-\\u1C7D\\u1CD0-\\u1CD2\\u1CD4-\\u1CF6\\u1CF8\\u1CF9\\u1D00-\\u1DF5\\u1DFC-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u200C\\u200D\\u203F\\u2040\\u2054\\u2071\\u207F\\u2090-\\u209C\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D7F-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2DE0-\\u2DFF\\u2E2F\\u3005-\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u3099\\u309A\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA62B\\uA640-\\uA66F\\uA674-\\uA67D\\uA67F-\\uA69D\\uA69F-\\uA6F1\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA827\\uA840-\\uA873\\uA880-\\uA8C4\\uA8D0-\\uA8D9\\uA8E0-\\uA8F7\\uA8FB\\uA900-\\uA92D\\uA930-\\uA953\\uA960-\\uA97C\\uA980-\\uA9C0\\uA9CF-\\uA9D9\\uA9E0-\\uA9FE\\uAA00-\\uAA36\\uAA40-\\uAA4D\\uAA50-\\uAA59\\uAA60-\\uAA76\\uAA7A-\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEF\\uAAF2-\\uAAF6\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABEA\\uABEC\\uABED\\uABF0-\\uABF9\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE00-\\uFE0F\\uFE20-\\uFE2D\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF3F\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]");
function assert(condition, message) {
  if (!condition) {
    throw new Error('ASSERT: ' + message);
  }
}
function isDecimalDigit(ch) {
  return (ch >= 0x30 && ch <= 0x39);
}
function isHexDigit(ch) {
  return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
}
function isOctalDigit(ch) {
  return '01234567'.indexOf(ch) >= 0;
}
function isWhiteSpace(ch) {
  return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
    (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
}
function isLineTerminator(ch) {
  return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
}
function isIdentifierStart(ch) {
  return (ch === 0x24) || (ch === 0x5F) ||
    (ch >= 0x41 && ch <= 0x5A) ||
    (ch >= 0x61 && ch <= 0x7A) ||
    (ch === 0x5C) ||
    ((ch >= 0x80) && RegexNonAsciiIdentifierStart.test(String.fromCharCode(ch)));
}
function isIdentifierPart(ch) {
  return (ch === 0x24) || (ch === 0x5F) ||
    (ch >= 0x41 && ch <= 0x5A) ||
    (ch >= 0x61 && ch <= 0x7A) ||
    (ch >= 0x30 && ch <= 0x39) ||
    (ch === 0x5C) ||
    ((ch >= 0x80) && RegexNonAsciiIdentifierPart.test(String.fromCharCode(ch)));
}
var keywords$1 = {
  'if':1, 'in':1, 'do':1,
  'var':1, 'for':1, 'new':1, 'try':1, 'let':1,
  'this':1, 'else':1, 'case':1, 'void':1, 'with':1, 'enum':1,
  'while':1, 'break':1, 'catch':1, 'throw':1, 'const':1, 'yield':1, 'class':1, 'super':1,
  'return':1, 'typeof':1, 'delete':1, 'switch':1, 'export':1, 'import':1, 'public':1, 'static':1,
  'default':1, 'finally':1, 'extends':1, 'package':1, 'private':1,
  'function':1, 'continue':1, 'debugger':1,
  'interface':1, 'protected':1,
  'instanceof':1, 'implements':1
};
function skipComment() {
  var ch;
  while (index < length) {
    ch = source$1.charCodeAt(index);
    if (isWhiteSpace(ch) || isLineTerminator(ch)) {
      ++index;
    } else {
      break;
    }
  }
}
function scanHexEscape(prefix) {
  var i, len, ch, code = 0;
  len = (prefix === 'u') ? 4 : 2;
  for (i = 0; i < len; ++i) {
    if (index < length && isHexDigit(source$1[index])) {
      ch = source$1[index++];
      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  return String.fromCharCode(code);
}
function scanUnicodeCodePointEscape() {
  var ch, code, cu1, cu2;
  ch = source$1[index];
  code = 0;
  if (ch === '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  while (index < length) {
    ch = source$1[index++];
    if (!isHexDigit(ch)) {
      break;
    }
    code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
  }
  if (code > 0x10FFFF || ch !== '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  if (code <= 0xFFFF) {
    return String.fromCharCode(code);
  }
  cu1 = ((code - 0x10000) >> 10) + 0xD800;
  cu2 = ((code - 0x10000) & 1023) + 0xDC00;
  return String.fromCharCode(cu1, cu2);
}
function getEscapedIdentifier() {
  var ch, id;
  ch = source$1.charCodeAt(index++);
  id = String.fromCharCode(ch);
  if (ch === 0x5C) {
    if (source$1.charCodeAt(index) !== 0x75) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    ++index;
    ch = scanHexEscape('u');
    if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    id = ch;
  }
  while (index < length) {
    ch = source$1.charCodeAt(index);
    if (!isIdentifierPart(ch)) {
      break;
    }
    ++index;
    id += String.fromCharCode(ch);
    if (ch === 0x5C) {
      id = id.substr(0, id.length - 1);
      if (source$1.charCodeAt(index) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      ++index;
      ch = scanHexEscape('u');
      if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      id += ch;
    }
  }
  return id;
}
function getIdentifier() {
  var start, ch;
  start = index++;
  while (index < length) {
    ch = source$1.charCodeAt(index);
    if (ch === 0x5C) {
      index = start;
      return getEscapedIdentifier();
    }
    if (isIdentifierPart(ch)) {
      ++index;
    } else {
      break;
    }
  }
  return source$1.slice(start, index);
}
function scanIdentifier() {
  var start, id, type;
  start = index;
  id = (source$1.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();
  if (id.length === 1) {
    type = TokenIdentifier;
  } else if (keywords$1.hasOwnProperty(id)) {
    type = TokenKeyword;
  } else if (id === 'null') {
    type = TokenNullLiteral;
  } else if (id === 'true' || id === 'false') {
    type = TokenBooleanLiteral;
  } else {
    type = TokenIdentifier;
  }
  return {
    type: type,
    value: id,
    start: start,
    end: index
  };
}
function scanPunctuator() {
  var start = index,
    code = source$1.charCodeAt(index),
    code2,
    ch1 = source$1[index],
    ch2,
    ch3,
    ch4;
  switch (code) {
    case 0x2E:
    case 0x28:
    case 0x29:
    case 0x3B:
    case 0x2C:
    case 0x7B:
    case 0x7D:
    case 0x5B:
    case 0x5D:
    case 0x3A:
    case 0x3F:
    case 0x7E:
      ++index;
      return {
        type: TokenPunctuator,
        value: String.fromCharCode(code),
        start: start,
        end: index
      };
    default:
      code2 = source$1.charCodeAt(index + 1);
      if (code2 === 0x3D) {
        switch (code) {
          case 0x2B:
          case 0x2D:
          case 0x2F:
          case 0x3C:
          case 0x3E:
          case 0x5E:
          case 0x7C:
          case 0x25:
          case 0x26:
          case 0x2A:
            index += 2;
            return {
              type: TokenPunctuator,
              value: String.fromCharCode(code) + String.fromCharCode(code2),
              start: start,
              end: index
            };
          case 0x21:
          case 0x3D:
            index += 2;
            if (source$1.charCodeAt(index) === 0x3D) {
              ++index;
            }
            return {
              type: TokenPunctuator,
              value: source$1.slice(start, index),
              start: start,
              end: index
            };
        }
      }
  }
  ch4 = source$1.substr(index, 4);
  if (ch4 === '>>>=') {
    index += 4;
    return {
      type: TokenPunctuator,
      value: ch4,
      start: start,
      end: index
    };
  }
  ch3 = ch4.substr(0, 3);
  if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
    index += 3;
    return {
      type: TokenPunctuator,
      value: ch3,
      start: start,
      end: index
    };
  }
  ch2 = ch3.substr(0, 2);
  if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
    index += 2;
    return {
      type: TokenPunctuator,
      value: ch2,
      start: start,
      end: index
    };
  }
  if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
    ++index;
    return {
      type: TokenPunctuator,
      value: ch1,
      start: start,
      end: index
    };
  }
  throwError({}, MessageUnexpectedToken, ILLEGAL);
}
function scanHexLiteral(start) {
  var number = '';
  while (index < length) {
    if (!isHexDigit(source$1[index])) {
      break;
    }
    number += source$1[index++];
  }
  if (number.length === 0) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  if (isIdentifierStart(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenNumericLiteral,
    value: parseInt('0x' + number, 16),
    start: start,
    end: index
  };
}
function scanOctalLiteral(start) {
  var number = '0' + source$1[index++];
  while (index < length) {
    if (!isOctalDigit(source$1[index])) {
      break;
    }
    number += source$1[index++];
  }
  if (isIdentifierStart(source$1.charCodeAt(index)) || isDecimalDigit(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenNumericLiteral,
    value: parseInt(number, 8),
    octal: true,
    start: start,
    end: index
  };
}
function scanNumericLiteral() {
  var number, start, ch;
  ch = source$1[index];
  assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
    'Numeric literal must start with a decimal digit or a decimal point');
  start = index;
  number = '';
  if (ch !== '.') {
    number = source$1[index++];
    ch = source$1[index];
    if (number === '0') {
      if (ch === 'x' || ch === 'X') {
        ++index;
        return scanHexLiteral(start);
      }
      if (isOctalDigit(ch)) {
        return scanOctalLiteral(start);
      }
      if (ch && isDecimalDigit(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }
    while (isDecimalDigit(source$1.charCodeAt(index))) {
      number += source$1[index++];
    }
    ch = source$1[index];
  }
  if (ch === '.') {
    number += source$1[index++];
    while (isDecimalDigit(source$1.charCodeAt(index))) {
      number += source$1[index++];
    }
    ch = source$1[index];
  }
  if (ch === 'e' || ch === 'E') {
    number += source$1[index++];
    ch = source$1[index];
    if (ch === '+' || ch === '-') {
      number += source$1[index++];
    }
    if (isDecimalDigit(source$1.charCodeAt(index))) {
      while (isDecimalDigit(source$1.charCodeAt(index))) {
        number += source$1[index++];
      }
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  if (isIdentifierStart(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenNumericLiteral,
    value: parseFloat(number),
    start: start,
    end: index
  };
}
function scanStringLiteral() {
  var str = '',
    quote, start, ch, code, octal = false;
  quote = source$1[index];
  assert((quote === '\'' || quote === '"'),
    'String literal must starts with a quote');
  start = index;
  ++index;
  while (index < length) {
    ch = source$1[index++];
    if (ch === quote) {
      quote = '';
      break;
    } else if (ch === '\\') {
      ch = source$1[index++];
      if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case 'u':
          case 'x':
            if (source$1[index] === '{') {
              ++index;
              str += scanUnicodeCodePointEscape();
            } else {
              str += scanHexEscape(ch);
            }
            break;
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;
          default:
            if (isOctalDigit(ch)) {
              code = '01234567'.indexOf(ch);
              if (code !== 0) {
                octal = true;
              }
              if (index < length && isOctalDigit(source$1[index])) {
                octal = true;
                code = code * 8 + '01234567'.indexOf(source$1[index++]);
                if ('0123'.indexOf(ch) >= 0 &&
                  index < length &&
                  isOctalDigit(source$1[index])) {
                  code = code * 8 + '01234567'.indexOf(source$1[index++]);
                }
              }
              str += String.fromCharCode(code);
            } else {
              str += ch;
            }
            break;
        }
      } else {
        if (ch === '\r' && source$1[index] === '\n') {
          ++index;
        }
      }
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      break;
    } else {
      str += ch;
    }
  }
  if (quote !== '') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenStringLiteral,
    value: str,
    octal: octal,
    start: start,
    end: index
  };
}
function testRegExp(pattern, flags) {
  var tmp = pattern;
  if (flags.indexOf('u') >= 0) {
    tmp = tmp
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, function($0, $1) {
        if (parseInt($1, 16) <= 0x10FFFF) {
          return 'x';
        }
        throwError({}, MessageInvalidRegExp);
      })
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
  }
  try {
  } catch (e) {
    throwError({}, MessageInvalidRegExp);
  }
  try {
    return new RegExp(pattern, flags);
  } catch (exception) {
    return null;
  }
}
function scanRegExpBody() {
  var ch, str, classMarker, terminated, body;
  ch = source$1[index];
  assert(ch === '/', 'Regular expression literal must start with a slash');
  str = source$1[index++];
  classMarker = false;
  terminated = false;
  while (index < length) {
    ch = source$1[index++];
    str += ch;
    if (ch === '\\') {
      ch = source$1[index++];
      if (isLineTerminator(ch.charCodeAt(0))) {
        throwError({}, MessageUnterminatedRegExp);
      }
      str += ch;
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      throwError({}, MessageUnterminatedRegExp);
    } else if (classMarker) {
      if (ch === ']') {
        classMarker = false;
      }
    } else {
      if (ch === '/') {
        terminated = true;
        break;
      } else if (ch === '[') {
        classMarker = true;
      }
    }
  }
  if (!terminated) {
    throwError({}, MessageUnterminatedRegExp);
  }
  body = str.substr(1, str.length - 2);
  return {
    value: body,
    literal: str
  };
}
function scanRegExpFlags() {
  var ch, str, flags;
  str = '';
  flags = '';
  while (index < length) {
    ch = source$1[index];
    if (!isIdentifierPart(ch.charCodeAt(0))) {
      break;
    }
    ++index;
    if (ch === '\\' && index < length) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    } else {
      flags += ch;
      str += ch;
    }
  }
  if (flags.search(/[^gimuy]/g) >= 0) {
    throwError({}, MessageInvalidRegExp, flags);
  }
  return {
    value: flags,
    literal: str
  };
}
function scanRegExp() {
  var start, body, flags, value;
  lookahead = null;
  skipComment();
  start = index;
  body = scanRegExpBody();
  flags = scanRegExpFlags();
  value = testRegExp(body.value, flags.value);
  return {
    literal: body.literal + flags.literal,
    value: value,
    regex: {
      pattern: body.value,
      flags: flags.value
    },
    start: start,
    end: index
  };
}
function isIdentifierName(token) {
  return token.type === TokenIdentifier ||
    token.type === TokenKeyword ||
    token.type === TokenBooleanLiteral ||
    token.type === TokenNullLiteral;
}
function advance() {
  var ch;
  skipComment();
  if (index >= length) {
    return {
      type: TokenEOF,
      start: index,
      end: index
    };
  }
  ch = source$1.charCodeAt(index);
  if (isIdentifierStart(ch)) {
    return scanIdentifier();
  }
  if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
    return scanPunctuator();
  }
  if (ch === 0x27 || ch === 0x22) {
    return scanStringLiteral();
  }
  if (ch === 0x2E) {
    if (isDecimalDigit(source$1.charCodeAt(index + 1))) {
      return scanNumericLiteral();
    }
    return scanPunctuator();
  }
  if (isDecimalDigit(ch)) {
    return scanNumericLiteral();
  }
  return scanPunctuator();
}
function lex() {
  var token;
  token = lookahead;
  index = token.end;
  lookahead = advance();
  index = token.end;
  return token;
}
function peek$1() {
  var pos;
  pos = index;
  lookahead = advance();
  index = pos;
}
function finishArrayExpression(elements) {
  var node = new ASTNode(SyntaxArrayExpression);
  node.elements = elements;
  return node;
}
function finishBinaryExpression(operator, left, right) {
  var node = new ASTNode((operator === '||' || operator === '&&') ? SyntaxLogicalExpression : SyntaxBinaryExpression);
  node.operator = operator;
  node.left = left;
  node.right = right;
  return node;
}
function finishCallExpression(callee, args) {
  var node = new ASTNode(SyntaxCallExpression);
  node.callee = callee;
  node.arguments = args;
  return node;
}
function finishConditionalExpression(test, consequent, alternate) {
  var node = new ASTNode(SyntaxConditionalExpression);
  node.test = test;
  node.consequent = consequent;
  node.alternate = alternate;
  return node;
}
function finishIdentifier(name) {
  var node = new ASTNode(SyntaxIdentifier);
  node.name = name;
  return node;
}
function finishLiteral(token) {
  var node = new ASTNode(SyntaxLiteral);
  node.value = token.value;
  node.raw = source$1.slice(token.start, token.end);
  if (token.regex) {
    if (node.raw === '//') {
      node.raw = '/(?:)/';
    }
    node.regex = token.regex;
  }
  return node;
}
function finishMemberExpression(accessor, object, property) {
  var node = new ASTNode(SyntaxMemberExpression);
  node.computed = accessor === '[';
  node.object = object;
  node.property = property;
  if (!node.computed) property.member = true;
  return node;
}
function finishObjectExpression(properties) {
  var node = new ASTNode(SyntaxObjectExpression);
  node.properties = properties;
  return node;
}
function finishProperty(kind, key, value) {
  var node = new ASTNode(SyntaxProperty);
  node.key = key;
  node.value = value;
  node.kind = kind;
  return node;
}
function finishUnaryExpression(operator, argument) {
  var node = new ASTNode(SyntaxUnaryExpression);
  node.operator = operator;
  node.argument = argument;
  node.prefix = true;
  return node;
}
function throwError(token, messageFormat) {
  var error,
    args = Array.prototype.slice.call(arguments, 2),
    msg = messageFormat.replace(
      /%(\d)/g,
      function(whole, index) {
        assert(index < args.length, 'Message reference must be in range');
        return args[index];
      }
    );
  error = new Error(msg);
  error.index = index;
  error.description = msg;
  throw error;
}
function throwUnexpected(token) {
  if (token.type === TokenEOF) {
    throwError(token, MessageUnexpectedEOS);
  }
  if (token.type === TokenNumericLiteral) {
    throwError(token, MessageUnexpectedNumber);
  }
  if (token.type === TokenStringLiteral) {
    throwError(token, MessageUnexpectedString);
  }
  if (token.type === TokenIdentifier) {
    throwError(token, MessageUnexpectedIdentifier);
  }
  if (token.type === TokenKeyword) {
    throwError(token, MessageUnexpectedReserved);
  }
  throwError(token, MessageUnexpectedToken, token.value);
}
function expect(value) {
  var token = lex();
  if (token.type !== TokenPunctuator || token.value !== value) {
    throwUnexpected(token);
  }
}
function match(value) {
  return lookahead.type === TokenPunctuator && lookahead.value === value;
}
function matchKeyword(keyword) {
  return lookahead.type === TokenKeyword && lookahead.value === keyword;
}
function parseArrayInitialiser() {
  var elements = [];
  index = lookahead.start;
  expect('[');
  while (!match(']')) {
    if (match(',')) {
      lex();
      elements.push(null);
    } else {
      elements.push(parseConditionalExpression());
      if (!match(']')) {
        expect(',');
      }
    }
  }
  lex();
  return finishArrayExpression(elements);
}
function parseObjectPropertyKey() {
  var token;
  index = lookahead.start;
  token = lex();
  if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
    if (token.octal) {
      throwError(token, MessageStrictOctalLiteral);
    }
    return finishLiteral(token);
  }
  return finishIdentifier(token.value);
}
function parseObjectProperty() {
  var token, key, id, value;
  index = lookahead.start;
  token = lookahead;
  if (token.type === TokenIdentifier) {
    id = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', id, value);
  }
  if (token.type === TokenEOF || token.type === TokenPunctuator) {
    throwUnexpected(token);
  } else {
    key = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', key, value);
  }
}
function parseObjectInitialiser() {
  var properties = [],
    property, name, key, map = {},
    toString = String;
  index = lookahead.start;
  expect('{');
  while (!match('}')) {
    property = parseObjectProperty();
    if (property.key.type === SyntaxIdentifier) {
      name = property.key.name;
    } else {
      name = toString(property.key.value);
    }
    key = '$' + name;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throwError({}, MessageStrictDuplicateProperty);
    } else {
      map[key] = true;
    }
    properties.push(property);
    if (!match('}')) {
      expect(',');
    }
  }
  expect('}');
  return finishObjectExpression(properties);
}
function parseGroupExpression() {
  var expr;
  expect('(');
  expr = parseExpression();
  expect(')');
  return expr;
}
var legalKeywords = {
  "if": 1,
  "this": 1
};
function parsePrimaryExpression() {
  var type, token, expr;
  if (match('(')) {
    return parseGroupExpression();
  }
  if (match('[')) {
    return parseArrayInitialiser();
  }
  if (match('{')) {
    return parseObjectInitialiser();
  }
  type = lookahead.type;
  index = lookahead.start;
  if (type === TokenIdentifier || legalKeywords[lookahead.value]) {
    expr = finishIdentifier(lex().value);
  } else if (type === TokenStringLiteral || type === TokenNumericLiteral) {
    if (lookahead.octal) {
      throwError(lookahead, MessageStrictOctalLiteral);
    }
    expr = finishLiteral(lex());
  } else if (type === TokenKeyword) {
    throw new Error(DISABLED);
  } else if (type === TokenBooleanLiteral) {
    token = lex();
    token.value = (token.value === 'true');
    expr = finishLiteral(token);
  } else if (type === TokenNullLiteral) {
    token = lex();
    token.value = null;
    expr = finishLiteral(token);
  } else if (match('/') || match('/=')) {
    expr = finishLiteral(scanRegExp());
    peek$1();
  } else {
    throwUnexpected(lex());
  }
  return expr;
}
function parseArguments() {
  var args = [];
  expect('(');
  if (!match(')')) {
    while (index < length) {
      args.push(parseConditionalExpression());
      if (match(')')) {
        break;
      }
      expect(',');
    }
  }
  expect(')');
  return args;
}
function parseNonComputedProperty() {
  var token;
  index = lookahead.start;
  token = lex();
  if (!isIdentifierName(token)) {
    throwUnexpected(token);
  }
  return finishIdentifier(token.value);
}
function parseNonComputedMember() {
  expect('.');
  return parseNonComputedProperty();
}
function parseComputedMember() {
  var expr;
  expect('[');
  expr = parseExpression();
  expect(']');
  return expr;
}
function parseLeftHandSideExpressionAllowCall() {
  var expr, args, property;
  expr = parsePrimaryExpression();
  for (;;) {
    if (match('.')) {
      property = parseNonComputedMember();
      expr = finishMemberExpression('.', expr, property);
    } else if (match('(')) {
      args = parseArguments();
      expr = finishCallExpression(expr, args);
    } else if (match('[')) {
      property = parseComputedMember();
      expr = finishMemberExpression('[', expr, property);
    } else {
      break;
    }
  }
  return expr;
}
function parsePostfixExpression() {
  var expr = parseLeftHandSideExpressionAllowCall();
  if (lookahead.type === TokenPunctuator) {
    if ((match('++') || match('--'))) {
      throw new Error(DISABLED);
    }
  }
  return expr;
}
function parseUnaryExpression() {
  var token, expr;
  if (lookahead.type !== TokenPunctuator && lookahead.type !== TokenKeyword) {
    expr = parsePostfixExpression();
  } else if (match('++') || match('--')) {
    throw new Error(DISABLED);
  } else if (match('+') || match('-') || match('~') || match('!')) {
    token = lex();
    expr = parseUnaryExpression();
    expr = finishUnaryExpression(token.value, expr);
  } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
    throw new Error(DISABLED);
  } else {
    expr = parsePostfixExpression();
  }
  return expr;
}
function binaryPrecedence(token) {
  var prec = 0;
  if (token.type !== TokenPunctuator && token.type !== TokenKeyword) {
    return 0;
  }
  switch (token.value) {
    case '||':
      prec = 1;
      break;
    case '&&':
      prec = 2;
      break;
    case '|':
      prec = 3;
      break;
    case '^':
      prec = 4;
      break;
    case '&':
      prec = 5;
      break;
    case '==':
    case '!=':
    case '===':
    case '!==':
      prec = 6;
      break;
    case '<':
    case '>':
    case '<=':
    case '>=':
    case 'instanceof':
    case 'in':
      prec = 7;
      break;
    case '<<':
    case '>>':
    case '>>>':
      prec = 8;
      break;
    case '+':
    case '-':
      prec = 9;
      break;
    case '*':
    case '/':
    case '%':
      prec = 11;
      break;
    default:
      break;
  }
  return prec;
}
function parseBinaryExpression() {
  var marker, markers, expr, token, prec, stack, right, operator, left, i;
  marker = lookahead;
  left = parseUnaryExpression();
  token = lookahead;
  prec = binaryPrecedence(token);
  if (prec === 0) {
    return left;
  }
  token.prec = prec;
  lex();
  markers = [marker, lookahead];
  right = parseUnaryExpression();
  stack = [left, token, right];
  while ((prec = binaryPrecedence(lookahead)) > 0) {
    while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
      right = stack.pop();
      operator = stack.pop().value;
      left = stack.pop();
      markers.pop();
      expr = finishBinaryExpression(operator, left, right);
      stack.push(expr);
    }
    token = lex();
    token.prec = prec;
    stack.push(token);
    markers.push(lookahead);
    expr = parseUnaryExpression();
    stack.push(expr);
  }
  i = stack.length - 1;
  expr = stack[i];
  markers.pop();
  while (i > 1) {
    markers.pop();
    expr = finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }
  return expr;
}
function parseConditionalExpression() {
  var expr, consequent, alternate;
  expr = parseBinaryExpression();
  if (match('?')) {
    lex();
    consequent = parseConditionalExpression();
    expect(':');
    alternate = parseConditionalExpression();
    expr = finishConditionalExpression(expr, consequent, alternate);
  }
  return expr;
}
function parseExpression() {
  var expr = parseConditionalExpression();
  if (match(',')) {
    throw new Error(DISABLED);
  }
  return expr;
}
function parse$2(code) {
  source$1 = code;
  index = 0;
  length = source$1.length;
  lookahead = null;
  peek$1();
  var expr = parseExpression();
  if (lookahead.type !== TokenEOF) {
    throw new Error("Unexpect token after expression.");
  }
  return expr;
}

var Constants = {
  NaN:       'NaN',
  E:         'Math.E',
  LN2:       'Math.LN2',
  LN10:      'Math.LN10',
  LOG2E:     'Math.LOG2E',
  LOG10E:    'Math.LOG10E',
  PI:        'Math.PI',
  SQRT1_2:   'Math.SQRT1_2',
  SQRT2:     'Math.SQRT2',
  MIN_VALUE: 'Number.MIN_VALUE',
  MAX_VALUE: 'Number.MAX_VALUE'
};

function Functions(codegen) {
  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + '(' + obj + ')';
      if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
    }
    return obj + '.' + name + (type < 0 ? '' : type === 0 ?
      '()' :
      '(' + args.slice(1).map(codegen).join(',') + ')');
  }
  function fn(name, cast, type) {
    return function(args) {
      return fncall(name, args, cast, type);
    };
  }
  var DATE = 'new Date',
      STRING = 'String',
      REGEXP = 'RegExp';
  return {
    isNaN:    'isNaN',
    isFinite: 'isFinite',
    abs:      'Math.abs',
    acos:     'Math.acos',
    asin:     'Math.asin',
    atan:     'Math.atan',
    atan2:    'Math.atan2',
    ceil:     'Math.ceil',
    cos:      'Math.cos',
    exp:      'Math.exp',
    floor:    'Math.floor',
    log:      'Math.log',
    max:      'Math.max',
    min:      'Math.min',
    pow:      'Math.pow',
    random:   'Math.random',
    round:    'Math.round',
    sin:      'Math.sin',
    sqrt:     'Math.sqrt',
    tan:      'Math.tan',
    clamp: function(args) {
      if (args.length < 3) error('Missing arguments to clamp function.');
      if (args.length > 3) error('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },
    now:             'Date.now',
    utc:             'Date.UTC',
    datetime:        DATE,
    date:            fn('getDate', DATE, 0),
    day:             fn('getDay', DATE, 0),
    year:            fn('getFullYear', DATE, 0),
    month:           fn('getMonth', DATE, 0),
    hours:           fn('getHours', DATE, 0),
    minutes:         fn('getMinutes', DATE, 0),
    seconds:         fn('getSeconds', DATE, 0),
    milliseconds:    fn('getMilliseconds', DATE, 0),
    time:            fn('getTime', DATE, 0),
    timezoneoffset:  fn('getTimezoneOffset', DATE, 0),
    utcdate:         fn('getUTCDate', DATE, 0),
    utcday:          fn('getUTCDay', DATE, 0),
    utcyear:         fn('getUTCFullYear', DATE, 0),
    utcmonth:        fn('getUTCMonth', DATE, 0),
    utchours:        fn('getUTCHours', DATE, 0),
    utcminutes:      fn('getUTCMinutes', DATE, 0),
    utcseconds:      fn('getUTCSeconds', DATE, 0),
    utcmilliseconds: fn('getUTCMilliseconds', DATE, 0),
    length:      fn('length', null, -1),
    join:        fn('join', null),
    indexof:     fn('indexOf', null),
    lastindexof: fn('lastIndexOf', null),
    slice:       fn('slice', null),
    reverse: function(args) {
      return '('+codegen(args[0])+').slice().reverse()';
    },
    parseFloat:  'parseFloat',
    parseInt:    'parseInt',
    upper:       fn('toUpperCase', STRING, 0),
    lower:       fn('toLowerCase', STRING, 0),
    substring:   fn('substring', STRING),
    split:       fn('split', STRING),
    replace:     fn('replace', STRING),
    trim:        fn('trim', STRING, 0),
    regexp:  REGEXP,
    test:    fn('test', REGEXP),
    if: function(args) {
        if (args.length < 3) error('Missing arguments to if function.');
        if (args.length > 3) error('Too many arguments to if function.');
        var a = args.map(codegen);
        return '('+a[0]+'?'+a[1]+':'+a[2]+')';
      }
  };
}

function stripQuotes(s) {
  var n = s && s.length - 1;
  return n && (
      (s[0]==='"' && s[n]==='"') ||
      (s[0]==='\'' && s[n]==='\'')
    ) ? s.slice(1, -1) : s;
}
function codegen(opt) {
  opt = opt || {};
  var whitelist = opt.whitelist ? toSet(opt.whitelist) : {},
      blacklist = opt.blacklist ? toSet(opt.blacklist) : {},
      constants = opt.constants || Constants,
      functions = (opt.functions || Functions)(visit),
      globalvar = opt.globalvar,
      fieldvar = opt.fieldvar,
      globals = {},
      fields = {},
      memberDepth = 0;
  var outputGlobal = isFunction(globalvar)
    ? globalvar
    : function (id$$1) { return globalvar + '["' + id$$1 + '"]'; };
  function visit(ast) {
    if (isString(ast)) return ast;
    var generator = Generators[ast.type];
    if (generator == null) error('Unsupported type: ' + ast.type);
    return generator(ast);
  }
  var Generators = {
    Literal: function(n) {
        return n.raw;
      },
    Identifier: function(n) {
      var id$$1 = n.name;
      if (memberDepth > 0) {
        return id$$1;
      } else if (blacklist.hasOwnProperty(id$$1)) {
        return error('Illegal identifier: ' + id$$1);
      } else if (constants.hasOwnProperty(id$$1)) {
        return constants[id$$1];
      } else if (whitelist.hasOwnProperty(id$$1)) {
        return id$$1;
      } else {
        globals[id$$1] = 1;
        return outputGlobal(id$$1);
      }
    },
    MemberExpression: function(n) {
        var d = !n.computed;
        var o = visit(n.object);
        if (d) memberDepth += 1;
        var p = visit(n.property);
        if (o === fieldvar) {
          fields[stripQuotes(p)] = 1;
        }
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },
    CallExpression: function(n) {
        if (n.callee.type !== 'Identifier') {
          error('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) error('Unrecognized function: ' + callee);
        return isFunction(fn)
          ? fn(args)
          : fn + '(' + args.map(visit).join(',') + ')';
      },
    ArrayExpression: function(n) {
        return '[' + n.elements.map(visit).join(',') + ']';
      },
    BinaryExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },
    UnaryExpression: function(n) {
        return '(' + n.operator + visit(n.argument) + ')';
      },
    ConditionalExpression: function(n) {
        return '(' + visit(n.test) +
          '?' + visit(n.consequent) +
          ':' + visit(n.alternate) +
          ')';
      },
    LogicalExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },
    ObjectExpression: function(n) {
        return '{' + n.properties.map(visit).join(',') + '}';
      },
    Property: function(n) {
        memberDepth += 1;
        var k = visit(n.key);
        memberDepth -= 1;
        return k + ':' + visit(n.value);
      }
  };
  function codegen(ast) {
    var result = {
      code:    visit(ast),
      globals: Object.keys(globals),
      fields:  Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }
  codegen.functions = functions;
  codegen.constants = constants;
  return codegen;
}

var formatCache = {};
function formatter(type, method, specifier) {
  var k = type + ':' + specifier,
      e = formatCache[k];
  if (!e || e[0] !== method) {
    formatCache[k] = (e = [method, method(specifier)]);
  }
  return e[1];
}
function format(_$$1, specifier) {
  return formatter('format', d3Format.format, specifier)(_$$1);
}
function timeFormat(_$$1, specifier) {
  return formatter('timeFormat', d3TimeFormat.timeFormat, specifier)(_$$1);
}
function utcFormat(_$$1, specifier) {
  return formatter('utcFormat', d3TimeFormat.utcFormat, specifier)(_$$1);
}
function timeParse(_$$1, specifier) {
  return formatter('timeParse', d3TimeFormat.timeParse, specifier)(_$$1);
}
function utcParse(_$$1, specifier) {
  return formatter('utcParse', d3TimeFormat.utcParse, specifier)(_$$1);
}
var dateObj = new Date(2000, 0, 1);
function time$1(month, day, specifier) {
  dateObj.setMonth(month);
  dateObj.setDate(day);
  return timeFormat(dateObj, specifier);
}
function monthFormat(month) {
  return time$1(month, 1, '%B');
}
function monthAbbrevFormat(month) {
  return time$1(month, 1, '%b');
}
function dayFormat(day) {
  return time$1(0, 2 + day, '%A');
}
function dayAbbrevFormat(day) {
  return time$1(0, 2 + day, '%a');
}

function quarter$1(date) {
  return 1 + ~~(new Date(date).getMonth() / 3);
}
function utcquarter$1(date) {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}

function log$3(df, method, args) {
  try {
    df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
  } catch (err) {
    df.warn(err);
  }
  return args[args.length-1];
}
function warn() {
  return log$3(this.context.dataflow, 'warn', arguments);
}
function info() {
  return log$3(this.context.dataflow, 'info', arguments);
}
function debug() {
  return log$3(this.context.dataflow, 'debug', arguments);
}

function inScope(item) {
  var group = this.context.group,
      value = false;
  if (group) while (item) {
    if (item === group) { value = true; break; }
    item = item.mark.group;
  }
  return value;
}

function clampRange$1(range, min, max) {
  var lo = range[0],
      hi = range[1],
      span;
  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;
  return span >= (max - min)
    ? [min, max]
    : [
        Math.min(Math.max(lo, min), max - span),
        Math.min(Math.max(hi, span), max)
      ];
}

function pinchDistance(event) {
  var t = event.touches,
      dx = t[0].clientX - t[1].clientX,
      dy = t[0].clientY - t[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
function pinchAngle(event) {
  var t = event.touches;
  return Math.atan2(
    t[0].clientY - t[1].clientY,
    t[0].clientX - t[1].clientX
  );
}

var _window = (typeof window !== 'undefined' && window) || null;
function screen() {
  return _window ? _window.screen : {};
}
function windowSize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}
function containerSize() {
  var view = this.context.dataflow,
      el = view.container && view.container();
  return el
    ? [el.clientWidth, el.clientHeight]
    : [undefined, undefined];
}

function flush$1(range, value, threshold, left, right, center) {
  var l = Math.abs(value - range[0]),
      r = Math.abs(peek(range) - value);
  return l < r && l <= threshold ? left
    : r <= threshold ? right
    : center;
}

function span$1(array) {
  return (array[array.length-1] - array[0]) || 0;
}

var Literal$1 = 'Literal';
var Identifier$2 = 'Identifier';

var indexPrefix  = '@';
var scalePrefix  = '%';
var dataPrefix   = ':';

function getScale(name, ctx) {
  var s;
  return isFunction(name) ? name
    : isString(name) ? (s = ctx.scales[name]) && s.value
    : undefined;
}
function addScaleDependency(scope, params, name) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    try {
      params[scaleName] = scope.scaleRef(name);
    } catch (err) {
    }
  }
}
function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal$1) {
    addScaleDependency(scope, params, args[0].value);
  }
  else if (args[0].type === Identifier$2) {
    for (name in scope.scales) {
      addScaleDependency(scope, params, name);
    }
  }
}
function range$1(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [];
}
function domain(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.domain() : [];
}
function bandwidth(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.bandwidth ? s.bandwidth() : 0;
}
function bandspace(count, paddingInner, paddingOuter) {
  return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
}
function copy(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.copy() : undefined;
}
function scale$2(name, value, group) {
  var s = getScale(name, (group || this).context);
  return s ? s(value) : undefined;
}
function invert(name, range, group) {
  var s = getScale(name, (group || this).context);
  return !s ? undefined
    : isArray(range) ? (s.invertRange || s.invert)(range)
    : (s.invert || s.invertExtent)(range);
}

function scaleGradient(scale, p0, p1, count, group) {
  scale = getScale(scale, (group || this).context);
  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min = stops[0],
      max = stops[stops.length-1],
      fraction = scaleFraction(scale, min, max);
  if (scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);
  }
  for (var i=0, n=stops.length; i<n; ++i) {
    gradient.stop(fraction(stops[i]), scale(stops[i]));
  }
  return gradient;
}

function geoMethod(methodName, globalMethod) {
  return function(projection, geojson, group) {
    if (projection) {
      var p = getScale(projection, (group || this).context);
      return p && p.path[methodName](geojson);
    } else {
      return globalMethod(geojson);
    }
  };
}
var geoArea = geoMethod('area', d3Geo.geoArea);
var geoBounds = geoMethod('bounds', d3Geo.geoBounds);
var geoCentroid = geoMethod('centroid', d3Geo.geoCentroid);

function geoShape(projection, geojson, group) {
  var p = getScale(projection, (group || this).context);
  return function(context$$1) {
    return p ? p.path.context(context$$1)(geojson) : '';
  }
}
function pathShape(path) {
  var p = null;
  return function(context$$1) {
    return context$$1
      ? pathRender(context$$1, (p = p || pathParse(path)))
      : path;
  };
}

function data$1(name) {
  var data = this.context.data[name];
  return data ? data.values.value : [];
}
function dataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal$1) {
    error('First argument to data functions must be a string literal.');
  }
  var data = args[0].value,
      dataName = dataPrefix + data;
  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}
function indata(name, field$$1, value) {
  var index = this.context.data[name]['index:' + field$$1],
      entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}
function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal$1) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal$1) error('Second argument to indata must be a string literal.');
  var data = args[0].value,
      field$$1 = args[1].value,
      indexName = indexPrefix + field$$1;
  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field$$1);
  }
}
function setdata(name, tuples) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input;
  df.pulse(input, df.changeset().remove(truthy).insert(tuples));
  return 1;
}

var EMPTY = {};
function datum(d) { return d.data; }
function treeNodes(name, context) {
  var tree = data$1.call(context, name);
  return tree.root && tree.root.lookup || EMPTY;
}
function treePath(name, source, target) {
  var nodes = treeNodes(name, this),
      s = nodes[source],
      t = nodes[target];
  return s && t ? s.path(t).map(datum) : undefined;
}
function treeAncestors(name, node) {
  var n = treeNodes(name, this)[node];
  return n ? n.ancestors().map(datum) : undefined;
}

function inrange$1(value, range, left, right) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  left = left === undefined || left;
  right = right === undefined || right;
  return (left ? r0 <= value : r0 < value) &&
    (right ? value <= r1 : value < r1);
}

function encode$1(item, name, retval) {
  if (item) {
    var df = this.context.dataflow,
        target = item.mark.source;
    df.pulse(target, df.changeset().encode(item, name));
  }
  return retval !== undefined ? retval : item;
}

function equal(a, b) {
  return a === b || a !== a && b !== b ? true
    : isArray(a) && isArray(b) && a.length === b.length ? equalArray(a, b)
    : false;
}
function equalArray(a, b) {
  for (var i=0, n=a.length; i<n; ++i) {
    if (!equal(a[i], b[i])) return false;
  }
  return true;
}
function removePredicate(props) {
  return function(_$$1) {
    for (var key$$1 in props) {
      if (!equal(_$$1[key$$1], props[key$$1])) return false;
    }
    return true;
  };
}
function modify(name, insert, remove, toggle, modify, values) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input,
      changes = data.changes,
      stamp = df.stamp(),
      predicate, key$$1;
  if (df._trigger === false || !(input.value.length || insert || toggle)) {
    return 0;
  }
  if (!changes || changes.stamp < stamp) {
    data.changes = (changes = df.changeset());
    changes.stamp = stamp;
    df.runAfter(function() {
      data.modified = true;
      df.pulse(input, changes).run();
    }, true, 1);
  }
  if (remove) {
    predicate = remove === true ? truthy
      : (isArray(remove) || isTuple(remove)) ? remove
      : removePredicate(remove);
    changes.remove(predicate);
  }
  if (insert) {
    changes.insert(insert);
  }
  if (toggle) {
    predicate = removePredicate(toggle);
    if (input.value.some(predicate)) {
      changes.remove(predicate);
    } else {
      changes.insert(toggle);
    }
  }
  if (modify) {
    for (key$$1 in values) {
      changes.modify(modify, key$$1, values[key$$1]);
    }
  }
  return 1;
}

var BIN = 'bin_',
    INTERSECT = 'intersect',
    UNION = 'union',
    UNIT_INDEX = 'index:unit';
function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      getter = entry.getter || (entry.getter = []),
      n = fields.length,
      i = 0, dval;
  for (; i<n; ++i) {
    getter[i] = getter[i] || field(fields[i]);
    dval = getter[i](datum);
    if (isDate(dval)) dval = toNumber(dval);
    if (isDate(values[i])) values[i] = toNumber(values[i]);
    if (entry[BIN + fields[i]]) {
      if (isDate(values[i][0])) values[i] = values[i].map(toNumber);
      if (!inrange$1(dval, values[i], true, false)) return false;
    } else if (dval !== values[i]) {
      return false;
    }
  }
  return true;
}
function testInterval(datum, entry) {
  var ivals = entry.intervals,
      n = ivals.length,
      i = 0,
      getter, extent$$1, value;
  for (; i<n; ++i) {
    extent$$1 = ivals[i].extent;
    getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
    value = getter(datum);
    if (!extent$$1 || extent$$1[0] === extent$$1[1]) return false;
    if (isDate(value)) value = toNumber(value);
    if (isDate(extent$$1[0])) extent$$1 = ivals[i].extent = extent$$1.map(toNumber);
    if (isNumber(extent$$1[0]) && !inrange$1(value, extent$$1)) return false;
    else if (isString(extent$$1[0]) && extent$$1.indexOf(value) < 0) return false;
  }
  return true;
}
function vlSelection(name, datum, op, test) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      unitIdx = data ? data[UNIT_INDEX] && data[UNIT_INDEX].value : undefined,
      intersect = op === INTERSECT,
      n = entries.length,
      i = 0,
      entry, miss, count, unit, b;
  for (; i<n; ++i) {
    entry = entries[i];
    if (unitIdx && intersect) {
      miss = miss || {};
      count = miss[unit=entry.unit] || 0;
      if (count === -1) continue;
      b = test(datum, entry);
      miss[unit] = b ? -1 : ++count;
      if (b && unitIdx.size === 1) return true;
      if (!b && count === unitIdx.get(unit).count) return false;
    } else {
      b = test(datum, entry);
      if (intersect ^ b) return b;
    }
  }
  return n && intersect;
}
function vlPoint(name, datum, op) {
  return vlSelection.call(this, name, datum, op, testPoint);
}
function vlInterval(name, datum, op) {
  return vlSelection.call(this, name, datum, op, testInterval);
}
function vlMultiVisitor(name, args, scope, params) {
  if (args[0].type !== Literal$1) error('First argument to indata must be a string literal.');
  var data = args[0].value,
      op = args.length >= 2 && args[args.length-1].value,
      field$$1 = 'unit',
      indexName = indexPrefix + field$$1;
  if (op === INTERSECT && !params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field$$1);
  }
  dataVisitor(name, args, scope, params);
}
function vlPointDomain(name, encoding, field$$1, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      unitIdx = data ? data[UNIT_INDEX] && data[UNIT_INDEX].value : undefined,
      entry = entries[0],
      i = 0, n, index, values, continuous, units;
  if (!entry) return undefined;
  for (n = encoding ? entry.encodings.length : entry.fields.length; i<n; ++i) {
    if ((encoding && entry.encodings[i] === encoding) ||
        (field$$1 && entry.fields[i] === field$$1)) {
      index = i;
      continuous = entry[BIN + entry.fields[i]];
      break;
    }
  }
  if (unitIdx && unitIdx.size === 1) {
    op = UNION;
  }
  if (unitIdx && op === INTERSECT) {
    units = entries.reduce(function(acc, entry) {
      var u = acc[entry.unit] || (acc[entry.unit] = []);
      u.push({unit: entry.unit, value: entry.values[index]});
      return acc;
    }, {});
    values = Object.keys(units).map(function(unit) {
      return {
        unit: unit,
        value: continuous
          ? continuousDomain(units[unit], UNION)
          : discreteDomain(units[unit], UNION)
      };
    });
  } else {
    values = entries.map(function(entry) {
      return {unit: entry.unit, value: entry.values[index]};
    });
  }
  return continuous ? continuousDomain(values, op) : discreteDomain(values, op);
}
function vlIntervalDomain(name, encoding, field$$1, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      entry = entries[0],
      i = 0, n, interval, index, values, discrete;
  if (!entry) return undefined;
  for (n = entry.intervals.length; i<n; ++i) {
    interval = entry.intervals[i];
    if ((encoding && interval.encoding === encoding) ||
        (field$$1 && interval.field === field$$1)) {
      if (!interval.extent) return undefined;
      index = i;
      discrete = interval.extent.length > 2;
      break;
    }
  }
  values = entries.reduce(function(acc, entry) {
    var extent$$1 = entry.intervals[index].extent,
        value = discrete
           ? extent$$1.map(function (d) { return {unit: entry.unit, value: d}; })
           : {unit: entry.unit, value: extent$$1};
    if (discrete) {
      acc.push.apply(acc, value);
    } else {
      acc.push(value);
    }
    return acc;
  }, []);
  return discrete ? discreteDomain(values, op) : continuousDomain(values, op);
}
function discreteDomain(entries, op) {
  var units = {}, count = 0,
      values = {}, domain = [],
      i = 0, n = entries.length,
      entry, unit, v, key$$1;
  for (; i<n; ++i) {
    entry = entries[i];
    unit  = entry.unit;
    key$$1   = entry.value;
    if (!units[unit]) units[unit] = ++count;
    if (!(v = values[key$$1])) {
      values[key$$1] = v = {value: key$$1, units: {}, count: 0};
    }
    if (!v.units[unit]) v.units[unit] = ++v.count;
  }
  for (key$$1 in values) {
    v = values[key$$1];
    if (op === INTERSECT && v.count !== count) continue;
    domain.push(v.value);
  }
  return domain.length ? domain : undefined;
}
function continuousDomain(entries, op) {
  var merge$$1 = op === INTERSECT ? intersectInterval : unionInterval,
      i = 0, n = entries.length,
      extent$$1, domain, lo, hi;
  for (; i<n; ++i) {
    extent$$1 = entries[i].value;
    if (isDate(extent$$1[0])) extent$$1 = extent$$1.map(toNumber);
    lo = extent$$1[0];
    hi = extent$$1[1];
    if (lo > hi) {
      hi = extent$$1[0];
      lo = extent$$1[1];
    }
    domain = domain ? merge$$1(domain, lo, hi) : [lo, hi];
  }
  return domain && domain.length && (+domain[0] !== +domain[1])
    ? domain
    : undefined;
}
function unionInterval(domain, lo, hi) {
  if (domain[0] > lo) domain[0] = lo;
  if (domain[1] < hi) domain[1] = hi;
  return domain;
}
function intersectInterval(domain, lo, hi) {
  if (hi < domain[0] || domain[1] < lo) {
    return [];
  } else {
    if (domain[0] < lo) domain[0] = lo;
    if (domain[1] > hi) domain[1] = hi;
  }
  return domain;
}

var functionContext = {
  random: function() { return random(); },
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  isTuple: isTuple,
  toBoolean: toBoolean,
  toDate: toDate,
  toNumber: toNumber,
  toString: toString,
  pad: pad,
  peek: peek,
  truncate: truncate,
  rgb: d3Color.rgb,
  lab: d3Color.lab,
  hcl: d3Color.hcl,
  hsl: d3Color.hsl,
  sequence: d3Array.range,
  format: format,
  utcFormat: utcFormat,
  utcParse: utcParse,
  timeFormat: timeFormat,
  timeParse: timeParse,
  monthFormat: monthFormat,
  monthAbbrevFormat: monthAbbrevFormat,
  dayFormat: dayFormat,
  dayAbbrevFormat: dayAbbrevFormat,
  quarter: quarter$1,
  utcquarter: utcquarter$1,
  warn: warn,
  info: info,
  debug: debug,
  inScope: inScope,
  clampRange: clampRange$1,
  pinchDistance: pinchDistance,
  pinchAngle: pinchAngle,
  screen: screen,
  containerSize: containerSize,
  windowSize: windowSize,
  span: span$1,
  flush: flush$1,
  bandspace: bandspace,
  inrange: inrange$1,
  setdata: setdata,
  pathShape: pathShape,
  panLinear: panLinear,
  panLog: panLog,
  panPow: panPow,
  zoomLinear: zoomLinear,
  zoomLog: zoomLog,
  zoomPow: zoomPow,
  encode: encode$1,
  modify: modify
};
var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'],
    eventPrefix = 'event.vega.',
    thisPrefix = 'this.',
    astVisitors = {};
function expressionFunction(name, fn, visitor) {
  if (arguments.length === 1) {
    return functionContext[name];
  }
  functionContext[name] = fn;
  if (visitor) astVisitors[name] = visitor;
  if (codeGenerator) codeGenerator.functions[name] = thisPrefix + name;
  return this;
}
expressionFunction('bandwidth', bandwidth, scaleVisitor);
expressionFunction('copy', copy, scaleVisitor);
expressionFunction('domain', domain, scaleVisitor);
expressionFunction('range', range$1, scaleVisitor);
expressionFunction('invert', invert, scaleVisitor);
expressionFunction('scale', scale$2, scaleVisitor);
expressionFunction('gradient', scaleGradient, scaleVisitor);
expressionFunction('geoArea', geoArea, scaleVisitor);
expressionFunction('geoBounds', geoBounds, scaleVisitor);
expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
expressionFunction('geoShape', geoShape, scaleVisitor);
expressionFunction('indata', indata, indataVisitor);
expressionFunction('data', data$1, dataVisitor);
expressionFunction('vlSingle', vlPoint, dataVisitor);
expressionFunction('vlSingleDomain', vlPointDomain, dataVisitor);
expressionFunction('vlMulti', vlPoint, vlMultiVisitor);
expressionFunction('vlMultiDomain', vlPointDomain, vlMultiVisitor);
expressionFunction('vlInterval', vlInterval, dataVisitor);
expressionFunction('vlIntervalDomain', vlIntervalDomain, dataVisitor);
expressionFunction('treePath', treePath, dataVisitor);
expressionFunction('treeAncestors', treeAncestors, dataVisitor);
function buildFunctions(codegen$$1) {
  var fn = Functions(codegen$$1);
  eventFunctions.forEach(function(name) { fn[name] = eventPrefix + name; });
  for (var name in functionContext) { fn[name] = thisPrefix + name; }
  return fn;
}
var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event', 'item'],
  fieldvar:   'datum',
  globalvar:  function(id$$1) { return '_[' + $$2('$' + id$$1) + ']'; },
  functions:  buildFunctions,
  constants:  Constants,
  visitors:   astVisitors
};
var codeGenerator = codegen(codegenParams);

var signalPrefix = '$';
function expression(expr, scope, preamble) {
  var params = {}, ast, gen;
  try {
    ast = parse$2(expr);
  } catch (err) {
    error('Expression parse error: ' + $$2(expr));
  }
  ast.visit(function visitor(node) {
    if (node.type !== 'CallExpression') return;
    var name = node.callee.name,
        visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });
  gen = codeGenerator(ast);
  gen.globals.forEach(function(name) {
    var signalName = signalPrefix + name;
    if (!params.hasOwnProperty(signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });
  return {
    $expr:   preamble ? preamble + 'return(' + gen.code + ');' : gen.code,
    $fields: gen.fields,
    $params: params
  };
}

function Entry(type, value, params, parent) {
  this.id = -1;
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}
function entry(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}
function operator(value, params) {
  return entry('operator', value, params);
}
function ref(op) {
  var ref = {$ref: op.id};
  if (op.id < 0) (op.refs = op.refs || []).push(ref);
  return ref;
}
var tupleidRef = {
  $tupleid: 1,
  toString: function() { return ':_tupleid_:'; }
};
function fieldRef(field$$1, name) {
  return name ? {$field: field$$1, $name: name} : {$field: field$$1};
}
var keyFieldRef = fieldRef('key');
function compareRef(fields, orders) {
  return {$compare: fields, $order: orders};
}
function keyRef(fields, flat) {
  var ref = {$key: fields};
  if (flat) ref.$flat = true;
  return ref;
}
var Ascending  = 'ascending';
var Descending = 'descending';
function sortKey(sort) {
  return !isObject(sort) ? ''
    : (sort.order === Descending ? '-' : '+')
      + aggrField(sort.op, sort.field);
}
function aggrField(op, field$$1) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field$$1 ? '_' : '')
    + (field$$1 && field$$1.signal ? '$' + field$$1.signal : field$$1 || '');
}
var Scope = 'scope';
var View = 'view';
function isSignal(_$$1) {
  return _$$1 && _$$1.signal;
}
function value(specValue, defaultValue) {
  return specValue != null ? specValue : defaultValue;
}

function parseStream(stream, scope) {
  return stream.signal ? scope.getSignal(stream.signal).id
    : stream.scale ? scope.getScale(stream.scale).id
    : parseStream$1(stream, scope);
}
function eventSource(source) {
   return source === Scope ? View : (source || View);
}
function parseStream$1(stream, scope) {
  var method = stream.merge ? mergeStream
    : stream.stream ? nestedStream
    : stream.type ? eventStream
    : error('Invalid stream specification: ' + $$2(stream));
  return method(stream, scope);
}
function mergeStream(stream, scope) {
  var list = stream.merge.map(function(s) {
    return parseStream$1(s, scope);
  });
  var entry$$1 = streamParameters({merge: list}, stream, scope);
  return scope.addStream(entry$$1).id;
}
function nestedStream(stream, scope) {
  var id$$1 = parseStream$1(stream.stream, scope),
      entry$$1 = streamParameters({stream: id$$1}, stream, scope);
  return scope.addStream(entry$$1).id;
}
function eventStream(stream, scope) {
  var id$$1 = scope.event(eventSource(stream.source), stream.type),
      entry$$1 = streamParameters({stream: id$$1}, stream, scope);
  return Object.keys(entry$$1).length === 1 ? id$$1
    : scope.addStream(entry$$1).id;
}
function streamParameters(entry$$1, stream, scope) {
  var param = stream.between;
  if (param) {
    if (param.length !== 2) {
      error('Stream "between" parameter must have 2 entries: ' + $$2(stream));
    }
    entry$$1.between = [
      parseStream$1(param[0], scope),
      parseStream$1(param[1], scope)
    ];
  }
  param = stream.filter ? array(stream.filter) : [];
  if (stream.marktype || stream.markname || stream.markrole) {
    param.push(filterMark(stream.marktype, stream.markname, stream.markrole));
  }
  if (stream.source === Scope) {
    param.push('inScope(event.item)');
  }
  if (param.length) {
    entry$$1.filter = expression('(' + param.join(')&&(') + ')').$expr;
  }
  if ((param = stream.throttle) != null) {
    entry$$1.throttle = +param;
  }
  if ((param = stream.debounce) != null) {
    entry$$1.debounce = +param;
  }
  if (stream.consume) {
    entry$$1.consume = true;
  }
  return entry$$1;
}
function filterMark(type, name, role) {
  var item = 'event.item';
  return item
    + (type && type !== '*' ? '&&' + item + '.mark.marktype===\'' + type + '\'' : '')
    + (role ? '&&' + item + '.mark.role===\'' + role + '\'' : '')
    + (name ? '&&' + item + '.mark.name===\'' + name + '\'' : '');
}

function selector(selector, source, marks) {
  DEFAULT_SOURCE = source || VIEW$1;
  MARKS = marks || DEFAULT_MARKS;
  return parseMerge(selector.trim()).map(parseSelector);
}
var VIEW$1    = 'view',
    LBRACK  = '[',
    RBRACK  = ']',
    LBRACE  = '{',
    RBRACE  = '}',
    COLON   = ':',
    COMMA   = ',',
    NAME    = '@',
    GT      = '>',
    ILLEGAL$1 = /[[\]{}]/,
    DEFAULT_SOURCE,
    MARKS,
    DEFAULT_MARKS = {
      '*': 1,
      arc: 1,
      area: 1,
      group: 1,
      image: 1,
      line: 1,
      path: 1,
      rect: 1,
      rule: 1,
      shape: 1,
      symbol: 1,
      text: 1,
      trail: 1
    };
function isMarkType(type) {
  return MARKS.hasOwnProperty(type);
}
function find(s, i, endChar, pushChar, popChar) {
  var count = 0,
      n = s.length,
      c;
  for (; i<n; ++i) {
    c = s[i];
    if (!count && c === endChar) return i;
    else if (popChar && popChar.indexOf(c) >= 0) --count;
    else if (pushChar && pushChar.indexOf(c) >= 0) ++count;
  }
  return i;
}
function parseMerge(s) {
  var output = [],
      start = 0,
      n = s.length,
      i = 0;
  while (i < n) {
    i = find(s, i, COMMA, LBRACK + LBRACE, RBRACK + RBRACE);
    output.push(s.substring(start, i).trim());
    start = ++i;
  }
  if (output.length === 0) {
    throw 'Empty event selector: ' + s;
  }
  return output;
}
function parseSelector(s) {
  return s[0] === '['
    ? parseBetween(s)
    : parseStream$2(s);
}
function parseBetween(s) {
  var n = s.length,
      i = 1,
      b, stream;
  i = find(s, i, RBRACK, LBRACK, RBRACK);
  if (i === n) {
    throw 'Empty between selector: ' + s;
  }
  b = parseMerge(s.substring(1, i));
  if (b.length !== 2) {
    throw 'Between selector must have two elements: ' + s;
  }
  s = s.slice(i + 1).trim();
  if (s[0] !== GT) {
    throw 'Expected \'>\' after between selector: ' + s;
  }
  b = b.map(parseSelector);
  stream = parseSelector(s.slice(1).trim());
  if (stream.between) {
    return {
      between: b,
      stream: stream
    };
  } else {
    stream.between = b;
  }
  return stream;
}
function parseStream$2(s) {
  var stream = {source: DEFAULT_SOURCE},
      source = [],
      throttle = [0, 0],
      markname = 0,
      start = 0,
      n = s.length,
      i = 0, j,
      filter;
  if (s[n-1] === RBRACE) {
    i = s.lastIndexOf(LBRACE);
    if (i >= 0) {
      try {
        throttle = parseThrottle(s.substring(i+1, n-1));
      } catch (e) {
        throw 'Invalid throttle specification: ' + s;
      }
      s = s.slice(0, i).trim();
      n = s.length;
    } else throw 'Unmatched right brace: ' + s;
    i = 0;
  }
  if (!n) throw s;
  if (s[0] === NAME) markname = ++i;
  j = find(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }
  i = find(s, i, LBRACK);
  if (i === n) {
    source.push(s.substring(start, n).trim());
  } else {
    source.push(s.substring(start, i).trim());
    filter = [];
    start = ++i;
    if (start === n) throw 'Unmatched left bracket: ' + s;
  }
  while (i < n) {
    i = find(s, i, RBRACK);
    if (i === n) throw 'Unmatched left bracket: ' + s;
    filter.push(s.substring(start, i).trim());
    if (i < n-1 && s[++i] !== LBRACK) throw 'Expected left bracket: ' + s;
    start = ++i;
  }
  if (!(n = source.length) || ILLEGAL$1.test(source[n-1])) {
    throw 'Invalid event selector: ' + s;
  }
  if (n > 1) {
    stream.type = source[1];
    if (markname) {
      stream.markname = source[0].slice(1);
    } else if (isMarkType(source[0])) {
      stream.marktype = source[0];
    } else {
      stream.source = source[0];
    }
  } else {
    stream.type = source[0];
  }
  if (stream.type.slice(-1) === '!') {
    stream.consume = true;
    stream.type = stream.type.slice(0, -1);
  }
  if (filter != null) stream.filter = filter;
  if (throttle[0]) stream.throttle = throttle[0];
  if (throttle[1]) stream.debounce = throttle[1];
  return stream;
}
function parseThrottle(s) {
  var a = s.split(COMMA);
  if (!s.length || a.length > 2) throw s;
  return a.map(function(_$$1) {
    var x = +_$$1;
    if (x !== x) throw s;
    return x;
  });
}

var preamble = 'var datum=event.item&&event.item.datum;';
function parseUpdate(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      encode = spec.encode,
      sources = [],
      value$$1 = '', entry$$1;
  if (!events) {
    error('Signal update missing events specification.');
  }
  if (isString(events)) {
    events = selector(events, scope.isSubscope() ? Scope : View);
  }
  events = array(events).filter(function(stream) {
    if (stream.signal || stream.scale) {
      sources.push(stream);
      return 0;
    } else {
      return 1;
    }
  });
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }
  if (encode != null) {
    if (update) error('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + $$2(encode) + ')';
  }
  value$$1 = isString(update) ? expression(update, scope, preamble)
    : update.expr != null ? expression(update.expr, scope, preamble)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr:   '_.value',
        $params: {value: scope.signalRef(update.signal)}
      }
    : error('Invalid signal update specification.');
  entry$$1 = {
    target: target,
    update: value$$1
  };
  if (spec.force) {
    entry$$1.options = {force: true};
  }
  sources.forEach(function(source) {
    source = {source: parseStream(source, scope)};
    scope.addUpdate(extend(source, entry$$1));
  });
}

function parseSignalUpdates(signal, scope) {
  var op = scope.getSignal(signal.name);
  if (signal.update) {
    var expr = expression(signal.update, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }
  if (signal.on) {
    signal.on.forEach(function(_$$1) {
      parseUpdate(_$$1, scope, op.id);
    });
  }
}

function transform$1(name) {
  return function(params, value$$1, parent) {
    return entry(name, value$$1, params || undefined, parent);
  };
}
var Aggregate$1 = transform$1('aggregate');
var AxisTicks$1 = transform$1('axisticks');
var Bound$1 = transform$1('bound');
var Collect$1 = transform$1('collect');
var Compare$1 = transform$1('compare');
var DataJoin$1 = transform$1('datajoin');
var Encode$1 = transform$1('encode');
var Facet$1 = transform$1('facet');
var Field$1 = transform$1('field');
var Key$1 = transform$1('key');
var LegendEntries$1 = transform$1('legendentries');
var Mark$1 = transform$1('mark');
var MultiExtent$1 = transform$1('multiextent');
var MultiValues$1 = transform$1('multivalues');
var Overlap$1 = transform$1('overlap');
var Params$2 = transform$1('params');
var PreFacet$1 = transform$1('prefacet');
var Projection$1 = transform$1('projection');
var Proxy$1 = transform$1('proxy');
var Relay$1 = transform$1('relay');
var Render$1 = transform$1('render');
var Scale$1 = transform$1('scale');
var Sieve$1 = transform$1('sieve');
var SortItems$1 = transform$1('sortitems');
var ViewLayout$1 = transform$1('viewlayout');
var Values$1 = transform$1('values');

var FIELD_REF_ID = 0;
var types = [
  'identity',
  'ordinal', 'band', 'point',
  'bin-linear', 'bin-ordinal',
  'linear', 'pow', 'sqrt', 'log', 'sequential',
  'time', 'utc',
  'quantize', 'quantile', 'threshold'
];
var allTypes = toSet(types),
    ordinalTypes = toSet(types.slice(1, 6));
function isOrdinal(type) {
  return ordinalTypes.hasOwnProperty(type);
}
function isQuantile(type) {
  return type === 'quantile';
}
function initScale(spec, scope) {
  var type = spec.type || 'linear';
  if (!allTypes.hasOwnProperty(type)) {
    error('Unrecognized scale type: ' + $$2(type));
  }
  scope.addScale(spec.name, {
    type:   type,
    domain: undefined
  });
}
function parseScale(spec, scope) {
  var params = scope.getScale(spec.name).params,
      key$$1;
  params.domain = parseScaleDomain(spec.domain, spec, scope);
  if (spec.range != null) {
    params.range = parseScaleRange(spec, scope, params);
  }
  if (spec.interpolate != null) {
    parseScaleInterpolate(spec.interpolate, params);
  }
  if (spec.nice != null) {
    parseScaleNice(spec.nice, params);
  }
  for (key$$1 in spec) {
    if (params.hasOwnProperty(key$$1) || key$$1 === 'name') continue;
    params[key$$1] = parseLiteral(spec[key$$1], scope);
  }
}
function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error('Unsupported object: ' + $$2(v));
}
function parseArray(v, scope) {
  return v.signal
    ? scope.signalRef(v.signal)
    : v.map(function(v) { return parseLiteral(v, scope); });
}
function dataLookupError(name) {
  error('Can not find data set: ' + $$2(name));
}
function parseScaleDomain(domain, spec, scope) {
  if (!domain) {
    if (spec.domainMin != null || spec.domainMax != null) {
      error('No scale domain defined for domainMin/domainMax to override.');
    }
    return;
  }
  return domain.signal ? scope.signalRef(domain.signal)
    : (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(domain, spec, scope);
}
function explicitDomain(domain, spec, scope) {
  return domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}
function singularDomain(domain, spec, scope) {
  var data = scope.getData(domain.data);
  if (!data) dataLookupError(domain.data);
  return isOrdinal(spec.type)
      ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false))
      : isQuantile(spec.type) ? data.domainRef(scope, domain.field)
      : data.extentRef(scope, domain.field);
}
function multipleDomain(domain, spec, scope) {
  var data = domain.data,
      fields = domain.fields.reduce(function(dom, d) {
        d = isString(d) ? {data: data, field: d}
          : (isArray(d) || d.signal) ? fieldRef$1(d, scope)
          : d;
        dom.push(d);
        return dom;
      }, []);
  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}
function fieldRef$1(data, scope) {
  var name = '_:vega:_' + (FIELD_REF_ID++),
      coll = Collect$1({});
  if (isArray(data)) {
    coll.value = {$ingest: data};
  } else if (data.signal) {
    var code = 'setdata(' + $$2(name) + ',' + data.signal + ')';
    coll.params.input = scope.signalRef(code);
  }
  scope.addDataPipeline(name, [coll, Sieve$1({})]);
  return {data: name, field: 'data'};
}
function ordinalMultipleDomain(domain, scope, fields) {
  var counts, a, c, v;
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.countsRef(scope, f.field);
  });
  a = scope.add(Aggregate$1({
    groupby: keyFieldRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));
  c = scope.add(Collect$1({pulse: ref(a)}));
  v = scope.add(Values$1({
    field: keyFieldRef,
    sort:  scope.sortRef(parseSort(domain.sort, true)),
    pulse: ref(c)
  }));
  return ref(v);
}
function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.field && !sort.op) {
      if (isObject(sort)) sort.field = 'key';
      else sort = {field: 'key'};
    } else if (!sort.field && sort.op !== 'count') {
      error('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      error('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error('Multiple domain scales support op count only.');
    }
  }
  return sort;
}
function quantileMultipleDomain(domain, scope, fields) {
  var values = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.domainRef(scope, f.field);
  });
  return ref(scope.add(MultiValues$1({values: values})));
}
function numericMultipleDomain(domain, scope, fields) {
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.extentRef(scope, f.field);
  });
  return ref(scope.add(MultiExtent$1({extents: extents})));
}
function parseScaleNice(nice, params) {
  params.nice = isObject(nice)
    ? {
        interval: parseLiteral(nice.interval),
        step: parseLiteral(nice.step)
      }
    : parseLiteral(nice);
}
function parseScaleInterpolate(interpolate, params) {
  params.interpolate = parseLiteral(interpolate.type || interpolate);
  if (interpolate.gamma != null) {
    params.interpolateGamma = parseLiteral(interpolate.gamma);
  }
}
function parseScaleRange(spec, scope, params) {
  var range = spec.range,
      config = scope.config.range;
  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (isString(range)) {
    if (config && config.hasOwnProperty(range)) {
      spec = extend({}, spec, {range: config[range]});
      return parseScaleRange(spec, scope, params);
    } else if (range === 'width') {
      range = [0, {signal: 'width'}];
    } else if (range === 'height') {
      range = isOrdinal(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0];
    } else {
      error('Unrecognized scale range value: ' + $$2(range));
    }
  } else if (range.scheme) {
    params.scheme = parseLiteral(range.scheme, scope);
    if (range.extent) params.schemeExtent = parseArray(range.extent, scope);
    if (range.count) params.schemeCount = parseLiteral(range.count, scope);
    return;
  } else if (range.step) {
    params.rangeStep = parseLiteral(range.step, scope);
    return;
  } else if (isOrdinal(spec.type) && !isArray(range)) {
    return parseScaleDomain(range, spec, scope);
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + $$2(range));
  }
  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function parseProjection(proj, scope) {
  var params = {};
  for (var name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], name, scope);
  }
  scope.addProjection(proj.name, params);
}
function parseParameter(_$$1, name, scope) {
  return isArray(_$$1) ? _$$1.map(function(_$$1) { return parseParameter(_$$1, name, scope); })
    : !isObject(_$$1) ? _$$1
    : _$$1.signal ? scope.signalRef(_$$1.signal)
    : name === 'fit' ? _$$1
    : error('Unsupported parameter object: ' + $$2(_$$1));
}

var Top$1 = 'top';
var Left$1 = 'left';
var Right$1 = 'right';
var Bottom$1 = 'bottom';
var Index  = 'index';
var Label  = 'label';
var Offset = 'offset';
var Perc   = 'perc';
var Size   = 'size';
var Total  = 'total';
var Value  = 'value';
var GuideLabelStyle = 'guide-label';
var GuideTitleStyle = 'guide-title';
var GroupTitleStyle = 'group-title';
var LegendScales = [
  'shape',
  'size',
  'fill',
  'stroke',
  'strokeDash',
  'opacity'
];
var Skip = {
  name: 1,
  interactive: 1
};

var Skip$1 = toSet(['rule']),
    Swap = toSet(['group', 'image', 'rect']);
function adjustSpatial(encode, marktype) {
  var code = '';
  if (Skip$1[marktype]) return code;
  if (encode.x2) {
    if (encode.x) {
      if (Swap[marktype]) {
        code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      }
      code += 'o.width=o.x2-o.x;';
    } else {
      code += 'o.x=o.x2-(o.width||0);';
    }
  }
  if (encode.xc) {
    code += 'o.x=o.xc-(o.width||0)/2;';
  }
  if (encode.y2) {
    if (encode.y) {
      if (Swap[marktype]) {
        code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      }
      code += 'o.height=o.y2-o.y;';
    } else {
      code += 'o.y=o.y2-(o.height||0);';
    }
  }
  if (encode.yc) {
    code += 'o.y=o.yc-(o.height||0)/2;';
  }
  return code;
}

function color$1(enc, scope, params, fields) {
  function color(type, x, y, z) {
    var a = entry$1(null, x, scope, params, fields),
        b = entry$1(null, y, scope, params, fields),
        c = entry$1(null, z, scope, params, fields);
    return 'this.' + type + '(' + [a, b, c].join(',') + ').toString()';
  }
  return (enc.c) ? color('hcl', enc.h, enc.c, enc.l)
    : (enc.h || enc.s) ? color('hsl', enc.h, enc.s, enc.l)
    : (enc.l || enc.a) ? color('lab', enc.l, enc.a, enc.b)
    : (enc.r || enc.g || enc.b) ? color('rgb', enc.r, enc.g, enc.b)
    : null;
}

function expression$1(code, scope, params, fields) {
  var expr = expression(code, scope);
  expr.$fields.forEach(function(name) { fields[name] = 1; });
  extend(params, expr.$params);
  return expr.$expr;
}

function field$1(ref, scope, params, fields) {
  return resolve$1(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
}
function resolve$1(ref, scope, params, fields) {
  var object, level, field$$1;
  if (ref.signal) {
    object = 'datum';
    field$$1 = expression$1(ref.signal, scope, params, fields);
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';
    while (level-- > 0) {
      object += '.mark.group';
    }
    if (ref.parent) {
      field$$1 = ref.parent;
      object += '.datum';
    } else {
      field$$1 = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field$$1 = ref.datum;
  } else {
    error('Invalid field reference: ' + $$2(ref));
  }
  if (!ref.signal) {
    if (isString(field$$1)) {
      fields[field$$1] = 1;
      field$$1 = splitAccessPath(field$$1).map($$2).join('][');
    } else {
      field$$1 = resolve$1(field$$1, scope, params, fields);
    }
  }
  return object + '[' + field$$1 + ']';
}

function scale$3(enc, value, scope, params, fields) {
  var scale = getScale$1(enc.scale, scope, params, fields),
      interp, func, flag;
  if (enc.range != null) {
    interp = +enc.range;
    func = scale + '.range()';
    value = (interp === 0) ? (func + '[0]')
      : '($=' + func + ',' + ((interp === 1) ? '$[$.length-1]'
      : '$[0]+' + interp + '*($[$.length-1]-$[0])') + ')';
  } else {
    if (value !== undefined) value = scale + '(' + value + ')';
    if (enc.band && (flag = hasBandwidth(enc.scale, scope))) {
      func = scale + '.bandwidth';
      interp = +enc.band;
      interp = func + '()' + (interp===1 ? '' : '*' + interp);
      if (flag < 0) interp = '(' + func + '?' + interp + ':0)';
      value = (value ? value + '+' : '') + interp;
      if (enc.extra) {
        value = '(datum.extra?' + scale + '(datum.extra.value):' + value + ')';
      }
    }
    if (value == null) value = '0';
  }
  return value;
}
function hasBandwidth(name, scope) {
  if (!isString(name)) return -1;
  var type = scope.scaleType(name);
  return type === 'band' || type === 'point' ? 1 : 0;
}
function getScale$1(name, scope, params, fields) {
  var scaleName;
  if (isString(name)) {
    scaleName = scalePrefix + name;
    if (!params.hasOwnProperty(scaleName)) {
      params[scaleName] = scope.scaleRef(name);
    }
    scaleName = $$2(scaleName);
  } else {
    for (scaleName in scope.scales) {
      params[scalePrefix + scaleName] = scope.scaleRef(scaleName);
    }
    scaleName = $$2(scalePrefix) + '+'
      + (name.signal
        ? '(' + expression$1(name.signal, scope, params, fields) + ')'
        : field$1(name, scope, params, fields));
  }
  return '_[' + scaleName + ']';
}

function gradient$1(enc, scope, params, fields) {
  return 'this.gradient('
    + getScale$1(enc.gradient, scope, params, fields)
    + ',' + $$2(enc.start)
    + ',' + $$2(enc.stop)
    + ',' + $$2(enc.count)
    + ')';
}

function property(property, scope, params, fields) {
  return isObject(property)
      ? '(' + entry$1(null, property, scope, params, fields) + ')'
      : property;
}

function entry$1(channel, enc, scope, params, fields) {
  if (enc.gradient != null) {
    return gradient$1(enc, scope, params, fields);
  }
  var value = enc.signal ? expression$1(enc.signal, scope, params, fields)
    : enc.color ? color$1(enc.color, scope, params, fields)
    : enc.field != null ? field$1(enc.field, scope, params, fields)
    : enc.value !== undefined ? $$2(enc.value)
    : undefined;
  if (enc.scale != null) {
    value = scale$3(enc, value, scope, params, fields);
  }
  if (value === undefined) {
    value = null;
  }
  if (enc.exponent != null) {
    value = 'Math.pow(' + value + ','
      + property(enc.exponent, scope, params, fields) + ')';
  }
  if (enc.mult != null) {
    value += '*' + property(enc.mult, scope, params, fields);
  }
  if (enc.offset != null) {
    value += '+' + property(enc.offset, scope, params, fields);
  }
  if (enc.round) {
    value = 'Math.round(' + value + ')';
  }
  return value;
}

function set$2(obj, key$$1, value) {
  return obj + '[' + $$2(key$$1) + ']=' + value + ';';
}

function rule$1(channel, rules, scope, params, fields) {
  var code = '';
  rules.forEach(function(rule) {
    var value = entry$1(channel, rule, scope, params, fields);
    code += rule.test
      ? expression$1(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });
  return set$2('o', channel, code);
}

function parseEncode(encode, marktype, params, scope) {
  var fields = {},
      code = 'var o=item,datum=o.datum,$;',
      channel, enc, value;
  for (channel in encode) {
    enc = encode[channel];
    if (isArray(enc)) {
      code += rule$1(channel, enc, scope, params, fields);
    } else {
      value = entry$1(channel, enc, scope, params, fields);
      code += set$2('o', channel, value);
    }
  }
  code += adjustSpatial(encode, marktype);
  code += 'return 1;';
  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(encode)
  };
}

var MarkRole = 'mark';
var FrameRole$1 = 'frame';
var ScopeRole$1 = 'scope';
var AxisRole$2 = 'axis';
var AxisDomainRole = 'axis-domain';
var AxisGridRole = 'axis-grid';
var AxisLabelRole = 'axis-label';
var AxisTickRole = 'axis-tick';
var AxisTitleRole = 'axis-title';
var LegendRole$2 = 'legend';
var LegendEntryRole = 'legend-entry';
var LegendGradientRole = 'legend-gradient';
var LegendLabelRole = 'legend-label';
var LegendSymbolRole = 'legend-symbol';
var LegendTitleRole = 'legend-title';
var TitleRole$1 = 'title';

function encoder(_$$1) {
  return isObject(_$$1) ? _$$1 : {value: _$$1};
}
function addEncode(object, name, value) {
  if (value != null) {
    object[name] = isObject(value) && !isArray(value) ? value : {value: value};
    return 1;
  } else {
    return 0;
  }
}
function extendEncode(encode, extra, skip) {
  for (var name in extra) {
    if (skip && skip.hasOwnProperty(name)) continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}
function encoders(encode, type, role, style, scope, params) {
  var enc, key$$1;
  params = params || {};
  params.encoders = {$encode: (enc = {})};
  encode = applyDefaults(encode, type, role, style, scope.config);
  for (key$$1 in encode) {
    enc[key$$1] = parseEncode(encode[key$$1], type, params, scope);
  }
  return params;
}
function applyDefaults(encode, type, role, style, config) {
  var enter = {}, key$$1, skip, props;
  if (role == 'legend' || String(role).indexOf('axis') === 0) {
    role = null;
  }
  props = role === FrameRole$1 ? config.group
    : (role === MarkRole) ? extend({}, config.mark, config[type])
    : null;
  for (key$$1 in props) {
    skip = has(key$$1, encode)
      || (key$$1 === 'fill' || key$$1 === 'stroke')
      && (has('fill', encode) || has('stroke', encode));
    if (!skip) enter[key$$1] = {value: props[key$$1]};
  }
  array(style).forEach(function(name) {
    var props = config.style && config.style[name];
    for (var key$$1 in props) {
      if (!has(key$$1, encode)) {
        enter[key$$1] = {value: props[key$$1]};
      }
    }
  });
  encode = extend({}, encode);
  encode.enter = extend(enter, encode.enter);
  return encode;
}
function has(key$$1, encode) {
  return encode && (
    (encode.enter && encode.enter[key$$1]) ||
    (encode.update && encode.update[key$$1])
  );
}

function guideMark(type, role, style, key, dataRef, encode, extras) {
  return {
    type:  type,
    name:  extras ? extras.name : undefined,
    role:  role,
    style: (extras && extras.style) || style,
    key:   key,
    from:  dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras, Skip)
  };
}

var GroupMark = 'group';
var RectMark = 'rect';
var RuleMark = 'rule';
var SymbolMark = 'symbol';
var TextMark = 'text';

function legendGradient(spec, scale, config, userEncode) {
  var zero = {value: 0},
      encode = {}, enter, update;
  encode.enter = enter = {
    opacity: zero,
    x: zero,
    y: zero
  };
  addEncode(enter, 'width', config.gradientWidth);
  addEncode(enter, 'height', config.gradientHeight);
  addEncode(enter, 'stroke', config.gradientStrokeColor);
  addEncode(enter, 'strokeWidth', config.gradientStrokeWidth);
  encode.exit = {
    opacity: zero
  };
  encode.update = update = {
    x: zero,
    y: zero,
    fill: {gradient: scale, start: [0,0], stop: [1,0]},
    opacity: {value: 1}
  };
  addEncode(update, 'width', config.gradientWidth);
  addEncode(update, 'height', config.gradientHeight);
  return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
}

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';
function legendGradientLabels(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'fontWeight', config.labelFontWeight);
  addEncode(enter, 'baseline', config.gradientLabelBaseline);
  addEncode(enter, 'limit', config.gradientLabelLimit);
  encode.exit = {
    opacity: zero
  };
  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };
  enter.x = update.x = {
    field: Perc,
    mult: config.gradientWidth
  };
  enter.y = update.y = {
    value: config.gradientHeight,
    offset: config.gradientLabelOffset
  };
  enter.align = update.align = {signal: alignExpr};
  return guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Perc, dataRef, encode, userEncode);
}

function legendLabels(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'align', config.labelAlign);
  addEncode(enter, 'baseline', config.labelBaseline);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'fontWeight', config.labelFontWeight);
  addEncode(enter, 'limit', config.labelLimit);
  encode.exit = {
    opacity: zero
  };
  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };
  enter.x = update.x = {
    field:  Offset,
    offset: config.labelOffset
  };
  enter.y = update.y = {
    field:  Size,
    mult:   0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };
  return guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
}

function legendSymbols(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'shape', config.symbolType);
  addEncode(enter, 'size', config.symbolSize);
  addEncode(enter, 'strokeWidth', config.symbolStrokeWidth);
  if (!spec.fill) {
    addEncode(enter, 'fill', config.symbolFillColor);
    addEncode(enter, 'stroke', config.symbolStrokeColor);
  }
  encode.exit = {
    opacity: zero
  };
  encode.update = update = {
    opacity: {value: 1}
  };
  enter.x = update.x = {
    field: Offset,
    mult:  0.5
  };
  enter.y = update.y = {
    field: Size,
    mult:  0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };
  LegendScales.forEach(function(scale) {
    if (spec[scale]) {
      update[scale] = enter[scale] = {scale: spec[scale], field: Value};
    }
  });
  return guideMark(SymbolMark, LegendSymbolRole, null, Value, dataRef, encode, userEncode);
}

function legendTitle(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      title = spec.title,
      encode = {}, enter;
  encode.enter = enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'baseline', config.titleBaseline);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);
  encode.exit = {
    opacity: zero
  };
  encode.update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };
  return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}

function guideGroup(role, style, name, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    name: name,
    role: role,
    style: style,
    from: dataRef,
    interactive: interactive || false,
    encode: encode,
    marks: marks
  };
}

function clip$2(clip, scope) {
  var expr;
  if (isObject(clip)) {
    if (clip.signal) {
      expr = clip.signal;
    } else if (clip.path) {
      expr = 'pathShape(' + param(clip.path) + ')';
    } else if (clip.sphere) {
      expr = 'geoShape(' + param(clip.sphere) + ', {type: "Sphere"})';
    }
  }
  return expr
    ? scope.signalRef(expr)
    : !!clip;
}
function param(value) {
  return isObject(value) && value.signal
    ? value.signal
    : $$2(value);
}

function role(spec) {
  var role = spec.role || '';
  return (!role.indexOf('axis') || !role.indexOf('legend'))
    ? role
    : spec.type === GroupMark ? ScopeRole$1 : (role || MarkRole);
}

function definition$1(spec) {
  return {
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        spec.role || role(spec),
    zindex:      +spec.zindex || undefined
  };
}

function interactive(spec, scope) {
  return spec && spec.signal ? scope.signalRef(spec.signal)
    : spec === false ? false
    : true;
}

function parseTransform(spec, scope) {
  var def = definition(spec.type);
  if (!def) error('Unrecognized transform type: ' + $$2(spec.type));
  var t = entry(def.type.toLowerCase(), null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
  t.metadata = def.metadata || {};
  return t;
}
function parseParameters(def, spec, scope) {
  var params = {}, pdef, i, n;
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    params[pdef.name] = parseParameter$1(pdef, spec, scope);
  }
  return params;
}
function parseParameter$1(def, spec, scope) {
  var type = def.type,
      value$$1 = spec[def.name];
  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (value$$1 === undefined) {
    if (def.required) {
      error('Missing required ' + $$2(spec.type)
          + ' parameter: ' + $$2(def.name));
    }
    return;
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  }
  return def.array && !isSignal(value$$1)
    ? value$$1.map(function(v) { return parameterValue(def, v, scope); })
    : parameterValue(def, value$$1, scope);
}
function parameterValue(def, value$$1, scope) {
  var type = def.type;
  if (isSignal(value$$1)) {
    return isExpr(type) ? error('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value$$1)
         : isCompare(type) ? scope.compareRef(value$$1)
         : scope.signalRef(value$$1.signal);
  } else {
    var expr = def.expr || isField(type);
    return expr && outerExpr(value$$1) ? expression(value$$1.expr, scope)
         : expr && outerField(value$$1) ? fieldRef(value$$1.field)
         : isExpr(type) ? expression(value$$1, scope)
         : isData(type) ? ref(scope.getData(value$$1).values)
         : isField(type) ? fieldRef(value$$1)
         : isCompare(type) ? scope.compareRef(value$$1)
         : value$$1;
  }
}
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}
function parseSubParameters(def, spec, scope) {
  var value$$1 = spec[def.name];
  if (def.array) {
    if (!isArray(value$$1)) {
      error('Expected an array of sub-parameters. Instead: ' + $$2(value$$1));
    }
    return value$$1.map(function(v) {
      return parseSubParameter(def, v, scope);
    });
  } else {
    return parseSubParameter(def, value$$1, scope);
  }
}
function parseSubParameter(def, value$$1, scope) {
  var params, pdef, k, i, n;
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    for (k in pdef.key) {
      if (pdef.key[k] !== value$$1[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  if (!pdef) error('Unsupported parameter: ' + $$2(value$$1));
  params = extend(parseParameters(pdef, value$$1, scope), pdef.key);
  return ref(scope.add(Params$2(params)));
}
function outerExpr(_$$1) {
  return _$$1 && _$$1.expr;
}
function outerField(_$$1) {
  return _$$1 && _$$1.field;
}
function isData(_$$1) {
  return _$$1 === 'data';
}
function isExpr(_$$1) {
  return _$$1 === 'expr';
}
function isField(_$$1) {
  return _$$1 === 'field';
}
function isCompare(_$$1) {
  return _$$1 === 'compare'
}

function parseData(from, group, scope) {
  var facet, key$$1, op, dataRef, parent;
  if (!from) {
    dataRef = ref(scope.add(Collect$1(null, [{}])));
  }
  else if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');
    if (facet.field != null) {
      dataRef = parent = ref(scope.getData(facet.data).output);
    } else {
      if (!from.data) {
        op = parseTransform(extend({
          type:    'aggregate',
          groupby: array(facet.groupby)
        }, facet.aggregate), scope);
        op.params.key = scope.keyRef(facet.groupby);
        op.params.pulse = ref(scope.getData(facet.data).output);
        dataRef = parent = ref(scope.add(op));
      } else {
        parent = ref(scope.getData(from.data).aggregate);
      }
      key$$1 = scope.keyRef(facet.groupby, true);
    }
  }
  if (!dataRef) {
    dataRef = from.$ref ? from
      : ref(scope.getData(from.data).output);
  }
  return {
    key: key$$1,
    pulse: dataRef,
    parent: parent
  };
}

function DataScope(scope, input, output, values, aggr) {
  this.scope = scope;
  this.input = input;
  this.output = output;
  this.values = values;
  this.aggregate = aggr;
  this.index = {};
}
DataScope.fromEntries = function(scope, entries) {
  var n = entries.length,
      i = 1,
      input  = entries[0],
      values = entries[n-1],
      output = entries[n-2],
      aggr = null;
  scope.add(entries[0]);
  for (; i<n; ++i) {
    entries[i].params.pulse = ref(entries[i-1]);
    scope.add(entries[i]);
    if (entries[i].type === 'aggregate') aggr = entries[i];
  }
  return new DataScope(scope, input, output, values, aggr);
};
var prototype$1k = DataScope.prototype;
prototype$1k.countsRef = function(scope, field$$1, sort) {
  var ds = this,
      cache = ds.counts || (ds.counts = {}),
      k = fieldKey(field$$1), v, a, p;
  if (k != null) {
    scope = ds.scope;
    v = cache[k];
  }
  if (!v) {
    p = {
      groupby: scope.fieldRef(field$$1, 'key'),
      pulse: ref(ds.output)
    };
    if (sort && sort.field) addSortField(scope, p, sort);
    a = scope.add(Aggregate$1(p));
    v = scope.add(Collect$1({pulse: ref(a)}));
    v = {agg: a, ref: ref(v)};
    if (k != null) cache[k] = v;
  } else if (sort && sort.field) {
    addSortField(scope, v.agg.params, sort);
  }
  return v.ref;
};
function fieldKey(field$$1) {
  return isString(field$$1) ? field$$1 : null;
}
function addSortField(scope, p, sort) {
  var as = aggrField(sort.op, sort.field), s;
  if (p.ops) {
    for (var i=0, n=p.as.length; i<n; ++i) {
      if (p.as[i] === as) return;
    }
  } else {
    p.ops = ['count'];
    p.fields = [null];
    p.as = ['count'];
  }
  if (sort.op) {
    p.ops.push((s=sort.op.signal) ? scope.signalRef(s) : sort.op);
    p.fields.push(scope.fieldRef(sort.field));
    p.as.push(as);
  }
}
function cache(scope, ds, name, optype, field$$1, counts, index) {
  var cache = ds[name] || (ds[name] = {}),
      sort = sortKey(counts),
      k = fieldKey(field$$1), v, op;
  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }
  if (!v) {
    var params = counts
      ? {field: keyFieldRef, pulse: ds.countsRef(scope, field$$1, counts)}
      : {field: scope.fieldRef(field$$1), pulse: ref(ds.output)};
    if (sort) params.sort = scope.sortRef(counts);
    op = scope.add(entry(optype, undefined, params));
    if (index) ds.index[field$$1] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}
prototype$1k.tuplesRef = function() {
  return ref(this.values);
};
prototype$1k.extentRef = function(scope, field$$1) {
  return cache(scope, this, 'extent', 'extent', field$$1, false);
};
prototype$1k.domainRef = function(scope, field$$1) {
  return cache(scope, this, 'domain', 'values', field$$1, false);
};
prototype$1k.valuesRef = function(scope, field$$1, sort) {
  return cache(scope, this, 'vals', 'values', field$$1, sort || true);
};
prototype$1k.lookupRef = function(scope, field$$1) {
  return cache(scope, this, 'lookup', 'tupleindex', field$$1, false);
};
prototype$1k.indataRef = function(scope, field$$1) {
  return cache(scope, this, 'indata', 'tupleindex', field$$1, true, true);
};

function parseFacet(spec, scope, group) {
  var facet = spec.from.facet,
      name = facet.name,
      data = ref(scope.getData(facet.data).output),
      subscope, source, values, op;
  if (!facet.name) {
    error('Facet must have a name: ' + $$2(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + $$2(facet));
  }
  if (facet.field) {
    op = scope.add(PreFacet$1({
      field: scope.fieldRef(facet.field),
      pulse: data
    }));
  } else if (facet.groupby) {
    op = scope.add(Facet$1({
      key:   scope.keyRef(facet.groupby),
      group: ref(scope.proxy(group.parent)),
      pulse: data
    }));
  } else {
    error('Facet must specify groupby or field: ' + $$2(facet));
  }
  subscope = scope.fork();
  source = subscope.add(Collect$1());
  values = subscope.add(Sieve$1({pulse: ref(source)}));
  subscope.addData(name, new DataScope(subscope, source, source, values));
  subscope.addSignal('parent', null);
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}

function parseSubflow(spec, scope, input) {
  var op = scope.add(PreFacet$1({pulse: input.pulse})),
      subscope = scope.fork();
  subscope.add(Sieve$1());
  subscope.addSignal('parent', null);
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}

function parseTrigger(spec, scope, name) {
  var remove = spec.remove,
      insert = spec.insert,
      toggle = spec.toggle,
      modify = spec.modify,
      values = spec.values,
      op = scope.add(operator()),
      update, expr;
  update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle, modify, values]
        .map(function(_$$1) { return _$$1 == null ? 'null' : _$$1; })
        .join(',')
    + '),0)';
  expr = expression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

function parseMark(spec, scope) {
  var role$$1 = role(spec),
      group = spec.type === GroupMark,
      facet = spec.from && spec.from.facet,
      layout = spec.layout || role$$1 === ScopeRole$1 || role$$1 === FrameRole$1,
      nested = role$$1 === MarkRole || layout || facet,
      overlap = spec.overlap,
      ops, op, input, store, bound, render, sieve, name,
      joinRef, markRef, encodeRef, layoutRef, boundRef;
  input = parseData(spec.from, group, scope);
  op = scope.add(DataJoin$1({
    key:   input.key || (spec.key ? fieldRef(spec.key) : undefined),
    pulse: input.pulse,
    clean: !group
  }));
  joinRef = ref(op);
  op = store = scope.add(Collect$1({pulse: joinRef}));
  op = scope.add(Mark$1({
    markdef:     definition$1(spec),
    interactive: interactive(spec.interactive, scope),
    clip:        clip$2(spec.clip, scope),
    context:     {$context: true},
    groups:      scope.lookup(),
    parent:      scope.signals.parent ? scope.signalRef('parent') : null,
    index:       scope.markpath(),
    pulse:       ref(op)
  }));
  markRef = ref(op);
  op = scope.add(Encode$1(
    encoders(spec.encode, spec.type, role$$1, spec.style, scope, {pulse: markRef})
  ));
  op.params.parent = scope.encode();
  if (spec.transform) {
    spec.transform.forEach(function(_$$1) {
      var tx = parseTransform(_$$1, scope);
      if (tx.metadata.generates || tx.metadata.changes) {
        error('Mark transforms should not generate new data.');
      }
      tx.params.pulse = ref(op);
      scope.add(op = tx);
    });
  }
  if (spec.sort) {
    op = scope.add(SortItems$1({
      sort:  scope.compareRef(spec.sort, true),
      pulse: ref(op)
    }));
  }
  encodeRef = ref(op);
  if (facet || layout) {
    layout = scope.add(ViewLayout$1({
      layout:       scope.objectProperty(spec.layout),
      legendMargin: scope.config.legendMargin,
      mark:         markRef,
      pulse:        encodeRef
    }));
    layoutRef = ref(layout);
  }
  bound = scope.add(Bound$1({mark: markRef, pulse: layoutRef || encodeRef}));
  boundRef = ref(bound);
  if (group) {
    if (nested) { ops = scope.operators; ops.pop(); if (layout) ops.pop(); }
    scope.pushState(encodeRef, layoutRef || boundRef, joinRef);
    facet ? parseFacet(spec, scope, input)
        : nested ? parseSubflow(spec, scope, input)
        : parseSpec(spec, scope);
    scope.popState();
    if (nested) { if (layout) ops.push(layout); ops.push(bound); }
  }
  if (overlap) {
    op = {
      method: overlap.method === true ? 'parity' : overlap.method,
      pulse:  boundRef
    };
    if (overlap.order) {
      op.sort = scope.compareRef({field: overlap.order});
    }
    if (overlap.bound) {
      op.boundScale = scope.scaleRef(overlap.bound.scale);
      op.boundOrient = overlap.bound.orient;
      op.boundTolerance = overlap.bound.tolerance;
    }
    boundRef = ref(scope.add(Overlap$1(op)));
  }
  render = scope.add(Render$1({pulse: boundRef}));
  sieve = scope.add(Sieve$1({pulse: ref(render)}, undefined, scope.parent()));
  if (spec.name != null) {
    name = spec.name;
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(function(on) {
      if (on.insert || on.remove || on.toggle) {
        error('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
}

function parseLegend(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      encode = spec.encode || {},
      legendEncode = encode.legend || {},
      name = legendEncode.name || undefined,
      interactive = legendEncode.interactive,
      style = legendEncode.style,
      datum, dataRef, entryRef, group, title,
      entryEncode, params, children;
  var scale = spec.size || spec.shape || spec.fill || spec.stroke
           || spec.strokeDash || spec.opacity;
  if (!scale) {
    error('Missing valid scale for legend.');
  }
  datum = {
    orient: value(spec.orient, config.orient),
    title:  spec.title != null
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));
  legendEncode = extendEncode({
    enter: legendEnter(config),
    update: {
      offset:       encoder(value(spec.offset, config.offset)),
      padding:      encoder(value(spec.padding, config.padding)),
      titlePadding: encoder(value(spec.titlePadding, config.titlePadding))
    }
  }, legendEncode, Skip);
  entryEncode = {
    update: {
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      entryPadding: encoder(value(spec.entryPadding, config.entryPadding))
    }
  };
  if (type === 'gradient') {
    entryRef = ref(scope.add(LegendEntries$1({
      type:   'gradient',
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));
    children = [
      legendGradient(spec, scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }
  else {
    entryRef = ref(scope.add(LegendEntries$1(params = {
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));
    children = [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ];
    params.size = sizeExpression(spec, scope, children);
  }
  children = [
    guideGroup(LegendEntryRole, null, null, dataRef, interactive, entryEncode, children)
  ];
  if (datum.title) {
    title = legendTitle(spec, config, encode.title, dataRef);
    entryEncode.update.y.offset = {
      field: {group: 'titlePadding'},
      offset: get$2('fontSize', title.encode, scope, GuideTitleStyle)
    };
    children.push(title);
  }
  group = guideGroup(LegendRole$2, style, name, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;
  return parseMark(group, scope);
}
function sizeExpression(spec, scope, marks) {
  var fontSize = get$2('fontSize', marks[1].encode, scope, GuideLabelStyle),
      symbolSize = spec.size
        ? 'scale("' + spec.size + '",datum)'
        : deref(get$2('size', marks[0].encode, scope)),
      expr = 'max(ceil(sqrt(' + symbolSize + ')),' + deref(fontSize) + ')';
  return expression(expr, scope);
}
function legendEnter(config) {
  var enter = {},
      count = addEncode(enter, 'fill', config.fillColor)
            + addEncode(enter, 'stroke', config.strokeColor)
            + addEncode(enter, 'strokeWidth', config.strokeWidth)
            + addEncode(enter, 'strokeDash', config.strokeDash)
            + addEncode(enter, 'cornerRadius', config.cornerRadius);
  return count ? enter : undefined;
}
function deref(v) {
  return v && v.signal || v;
}
function get$2(name, encode, scope, style) {
  var v = encode && (
    (encode.update && encode.update[name]) ||
    (encode.enter && encode.enter[name])
  );
  return v && v.signal ? v
    : v ? +v.value
    : ((v = scope.config.style[style]) && +v[name]);
}

function parseTitle(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;
  var config = scope.config.title,
      encode = extend({}, spec.encode),
      datum, dataRef, title;
  datum = {
    orient: spec.orient != null ? spec.orient : config.orient
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));
  encode.name = spec.name;
  encode.interactive = spec.interactive;
  title = buildTitle(spec, config, encode, dataRef);
  if (spec.zindex) title.zindex = spec.zindex;
  return parseMark(title, scope);
}
function buildTitle(spec, config, userEncode, dataRef) {
  var title = spec.text,
      orient = spec.orient || config.orient,
      anchor = spec.anchor || config.anchor,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      horizontal = (orient === Top$1 || orient === Bottom$1),
      extent$$1 = {group: (horizontal ? 'width' : 'height')},
      encode = {}, enter, update, pos, opp, mult, align;
  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'fill', config.color);
  addEncode(enter, 'font', config.font);
  addEncode(enter, 'fontSize', config.fontSize);
  addEncode(enter, 'fontWeight', config.fontWeight);
  encode.exit = {
    opacity: {value: 0}
  };
  encode.update = update = {
    opacity: {value: 1},
    text: isObject(title) ? title : {value: title + ''},
    offset: encoder((spec.offset != null ? spec.offset : config.offset) || 0)
  };
  if (anchor === 'start') {
    mult = 0;
    align = 'left';
  } else {
    if (anchor === 'end') {
      mult = 1;
      align = 'right';
    } else {
      mult = 0.5;
      align = 'center';
    }
  }
  pos = {field: extent$$1, mult: mult};
  opp = sign < 0 ? {value: 0}
    : horizontal ? {field: {group: 'height'}}
    : {field: {group: 'width'}};
  if (horizontal) {
    update.x = pos;
    update.y = opp;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
  } else {
    update.x = opp;
    update.y = pos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }
  update.align = {value: align};
  update.limit = {field: extent$$1};
  addEncode(update, 'angle', config.angle);
  addEncode(update, 'baseline', config.baseline);
  addEncode(update, 'limit', config.limit);
  return guideMark(TextMark, TitleRole$1, spec.style || GroupTitleStyle, null, dataRef, encode, userEncode);
}

function parseData$1(data, scope) {
  var transforms = [];
  if (data.transform) {
    data.transform.forEach(function(tx) {
      transforms.push(parseTransform(tx, scope));
    });
  }
  if (data.on) {
    data.on.forEach(function(on) {
      parseTrigger(on, scope, data.name);
    });
  }
  scope.addDataPipeline(data.name, analyze(data, scope, transforms));
}
function analyze(data, scope, ops) {
  var output = [],
      source = null,
      modify = false,
      generate = false,
      upstream, i, n, t, m;
  if (data.values) {
    output.push(source = collect({$ingest: data.values, $format: data.format}));
  } else if (data.url) {
    output.push(source = collect({$request: data.url, $format: data.format}));
  } else if (data.source) {
    source = upstream = array(data.source).map(function(d) {
      return ref(scope.getData(d).output);
    });
    output.push(null);
  }
  for (i=0, n=ops.length; i<n; ++i) {
    t = ops[i];
    m = t.metadata;
    if (!source && !m.source) {
      output.push(source = collect());
    }
    output.push(t);
    if (m.generates) generate = true;
    if (m.modifies && !generate) modify = true;
    if (m.source) source = t;
    else if (m.changes) source = null;
  }
  if (upstream) {
    n = upstream.length - 1;
    output[0] = Relay$1({
      derive: modify,
      pulse: n ? upstream : upstream[0]
    });
    if (modify || n) {
      output.splice(1, 0, collect());
    }
  }
  if (!source) output.push(collect());
  output.push(Sieve$1({}));
  return output;
}
function collect(values) {
  var s = Collect$1({}, values);
  s.metadata = {source: true};
  return s;
}

function axisConfig(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top$1 || orient === Bottom$1) ? config.axisX : config.axisY,
      or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;
  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
}

function axisDomain(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode = {}, enter, update, u, u2, v;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.domainColor);
  addEncode(enter, 'strokeWidth', config.domainWidth);
  encode.exit = {
    opacity: zero
  };
  encode.update = update = {
    opacity: {value: 1}
  };
  if (orient === Top$1 || orient === Bottom$1) {
    u = 'x';
    v = 'y';
  } else {
    u = 'y';
    v = 'x';
  }
  u2 = u + '2';
  enter[v] = zero;
  update[u] = enter[u] = position(spec, 0);
  update[u2] = enter[u2] = position(spec, 1);
  return guideMark(RuleMark, AxisDomainRole, null, null, dataRef, encode, userEncode);
}
function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}

function axisGrid(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      vscale = spec.gridScale,
      sign = (orient === Left$1 || orient === Top$1) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos, u, v, v2, s;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.gridColor);
  addEncode(enter, 'strokeWidth', config.gridWidth);
  addEncode(enter, 'strokeDash', config.gridDash);
  encode.exit = exit = {
    opacity: zero
  };
  encode.update = update = {};
  addEncode(update, 'opacity', config.gridOpacity);
  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra,
    offset: config.tickOffset
  };
  if (orient === Top$1 || orient === Bottom$1) {
    u = 'x';
    v = 'y';
    s = 'height';
  } else {
    u = 'y';
    v = 'x';
    s = 'width';
  }
  v2 = v + '2';
  update[u] = enter[u] = exit[u] = tickPos;
  if (vscale) {
    enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
    update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
  } else {
    enter[v] = {value: offset};
    update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
  }
  return guideMark(RuleMark, AxisGridRole, null, Value, dataRef, encode, userEncode);
}

function axisTicks(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.tickColor);
  addEncode(enter, 'strokeWidth', config.tickWidth);
  encode.exit = exit = {
    opacity: zero
  };
  encode.update = update = {
    opacity: {value: 1}
  };
  tickSize = encoder(size);
  tickSize.mult = sign;
  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra,
    offset: config.tickOffset
  };
  if (orient === Top$1 || orient === Bottom$1) {
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }
  return guideMark(RuleMark, AxisTickRole, null, Value, dataRef, encode, userEncode);
}

function flushExpr(scale, threshold, a, b, c) {
  return {
    signal: 'flush(range("' + scale + '"), '
      + 'scale("' + scale + '", datum.value), '
      + threshold + ',' + a + ',' + b + ',' + c + ')'
  };
}
function axisLabels(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      scale = spec.scale,
      pad = value(spec.labelPadding, config.labelPadding),
      bound = value(spec.labelBound, config.labelBound),
      flush = value(spec.labelFlush, config.labelFlush),
      flushOn = flush != null && flush !== false && (flush = +flush) === flush,
      flushOffset = +value(spec.labelFlushOffset, config.labelFlushOffset),
      overlap = value(spec.labelOverlap, config.labelOverlap),
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;
  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'angle', config.labelAngle);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'fontWeight', config.labelFontWeight);
  addEncode(enter, 'limit', config.labelLimit);
  encode.exit = exit = {
    opacity: zero
  };
  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };
  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(pad);
  tickSize.offset.mult = sign;
  tickPos = {
    scale:  scale,
    field:  Value,
    band:   0.5,
    offset: config.tickOffset
  };
  if (orient === Top$1 || orient === Bottom$1) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    addEncode(update, 'align', flushOn
      ? flushExpr(scale, flush, '"left"', '"right"', '"center"')
      : 'center');
    if (flushOn && flushOffset) {
      addEncode(update, 'dx', flushExpr(scale, flush, -flushOffset, flushOffset, 0));
    }
    addEncode(update, 'baseline', orient === Top$1 ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right$1 ? 'left' : 'right');
    addEncode(update, 'baseline', flushOn
      ? flushExpr(scale, flush, '"bottom"', '"top"', '"middle"')
      : 'middle');
    if (flushOn && flushOffset) {
      addEncode(update, 'dy', flushExpr(scale, flush, flushOffset, -flushOffset, 0));
    }
  }
  spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
  if (overlap || bound) {
    spec.overlap = {
      method: overlap,
      order:  'datum.index',
      bound:  bound ? {scale: scale, orient: orient, tolerance: +bound} : null
    };
  }
  return spec;
}

function axisTitle(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      title = spec.title,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      horizontal = (orient === Top$1 || orient === Bottom$1),
      encode = {}, enter, update, titlePos;
  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);
  encode.exit = {
    opacity: {value: 0}
  };
  encode.update = update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };
  titlePos = {
    scale: spec.scale,
    range: 0.5
  };
  if (horizontal) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }
  addEncode(update, 'angle', config.titleAngle);
  addEncode(update, 'baseline', config.titleBaseline);
  !addEncode(update, 'x', config.titleX)
    && horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});
  !addEncode(update, 'y', config.titleY)
    && !horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});
  return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
}

function parseAxis(spec, scope) {
  var config = axisConfig(spec, scope),
      encode = spec.encode || {},
      axisEncode = encode.axis || {},
      name = axisEncode.name || undefined,
      interactive = axisEncode.interactive,
      style = axisEncode.style,
      datum, dataRef, ticksRef, size, group, children;
  datum = {
    orient: spec.orient,
    ticks:  !!value(spec.ticks, config.ticks),
    labels: !!value(spec.labels, config.labels),
    grid:   !!value(spec.grid, config.grid),
    domain: !!value(spec.domain, config.domain),
    title:  !!value(spec.title, false)
  };
  dataRef = ref(scope.add(Collect$1({}, [datum])));
  axisEncode = extendEncode({
    update: {
      range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(value(spec.offset, 0)),
      position:     encoder(value(spec.position, 0)),
      titlePadding: encoder(value(spec.titlePadding, config.titlePadding)),
      minExtent:    encoder(value(spec.minExtent, config.minExtent)),
      maxExtent:    encoder(value(spec.maxExtent, config.maxExtent))
    }
  }, encode.axis, Skip);
  ticksRef = ref(scope.add(AxisTicks$1({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.objectProperty(spec.tickCount),
    values: scope.objectProperty(spec.values),
    formatSpecifier: scope.property(spec.format)
  })));
  children = [];
  if (datum.grid) {
    children.push(axisGrid(spec, config, encode.grid, ticksRef));
  }
  if (datum.ticks) {
    size = value(spec.tickSize, config.tickSize);
    children.push(axisTicks(spec, config, encode.ticks, ticksRef, size));
  }
  if (datum.labels) {
    size = datum.ticks ? size : 0;
    children.push(axisLabels(spec, config, encode.labels, ticksRef, size));
  }
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }
  group = guideGroup(AxisRole$2, style, name, dataRef, interactive, axisEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;
  return parseMark(group, scope);
}

function parseSpec(spec, scope, preprocessed) {
  var signals = array(spec.signals),
      scales = array(spec.scales);
  if (!preprocessed) signals.forEach(function(_$$1) {
    parseSignal(_$$1, scope);
  });
  array(spec.projections).forEach(function(_$$1) {
    parseProjection(_$$1, scope);
  });
  scales.forEach(function(_$$1) {
    initScale(_$$1, scope);
  });
  array(spec.data).forEach(function(_$$1) {
    parseData$1(_$$1, scope);
  });
  scales.forEach(function(_$$1) {
    parseScale(_$$1, scope);
  });
  signals.forEach(function(_$$1) {
    parseSignalUpdates(_$$1, scope);
  });
  array(spec.axes).forEach(function(_$$1) {
    parseAxis(_$$1, scope);
  });
  array(spec.marks).forEach(function(_$$1) {
    parseMark(_$$1, scope);
  });
  array(spec.legends).forEach(function(_$$1) {
    parseLegend(_$$1, scope);
  });
  if (spec.title) {
    parseTitle(spec.title, scope);
  }
  scope.parseLambdas();
  return scope;
}

var defined = toSet(['width', 'height', 'padding', 'autosize']);
function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root;
  scope.background = spec.background || config.background;
  scope.eventConfig = config.events;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || 0);
  scope.addSignal('height', spec.height || 0);
  scope.addSignal('padding', parsePadding(spec.padding, config));
  scope.addSignal('autosize', parseAutosize(spec.autosize, config));
  array(spec.signals).forEach(function(_$$1) {
    if (!defined[_$$1.name]) parseSignal(_$$1, scope);
  });
  input = scope.add(Collect$1());
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);
  encode = scope.add(Encode$1(
    encoders(encode, GroupMark, FrameRole$1, spec.style, scope, {pulse: ref(input)}))
  );
  parent = scope.add(ViewLayout$1({
    layout:       scope.objectProperty(spec.layout),
    legendMargin: config.legendMargin,
    autosize:     scope.signalRef('autosize'),
    mark:         root,
    pulse:        ref(encode)
  }));
  scope.operators.pop();
  scope.pushState(ref(encode), ref(parent), null);
  parseSpec(spec, scope, true);
  scope.operators.push(parent);
  op = scope.add(Bound$1({mark: root, pulse: ref(parent)}));
  op = scope.add(Render$1({pulse: ref(op)}));
  op = scope.add(Sieve$1({pulse: ref(op)}));
  scope.addData('root', new DataScope(scope, input, input, op));
  return scope;
}

function Scope$1(config) {
  this.config = config;
  this.bindings = [];
  this.field = {};
  this.signals = {};
  this.lambdas = {};
  this.scales = {};
  this.events = {};
  this.data = {};
  this.streams = [];
  this.updates = [];
  this.operators = [];
  this.background = null;
  this.eventConfig = null;
  this._id = 0;
  this._subid = 0;
  this._nextsub = [0];
  this._parent = [];
  this._encode = [];
  this._lookup = [];
  this._markpath = [];
}
function Subscope(scope) {
  this.config = scope.config;
  this.field = Object.create(scope.field);
  this.signals = Object.create(scope.signals);
  this.lambdas = Object.create(scope.lambdas);
  this.scales = Object.create(scope.scales);
  this.events = Object.create(scope.events);
  this.data = Object.create(scope.data);
  this.streams = [];
  this.updates = [];
  this.operators = [];
  this._id = 0;
  this._subid = ++scope._nextsub[0];
  this._nextsub = scope._nextsub;
  this._parent = scope._parent.slice();
  this._encode = scope._encode.slice();
  this._lookup = scope._lookup.slice();
  this._markpath = scope._markpath;
}
var prototype$1l = Scope$1.prototype = Subscope.prototype;
prototype$1l.fork = function() {
  return new Subscope(this);
};
prototype$1l.isSubscope = function() {
  return this._subid > 0;
};
prototype$1l.toRuntime = function() {
  this.finish();
  return {
    background:  this.background,
    operators:   this.operators,
    streams:     this.streams,
    updates:     this.updates,
    bindings:    this.bindings,
    eventConfig: this.eventConfig
  };
};
prototype$1l.id = function() {
  return (this._subid ? this._subid + ':' : 0) + this._id++;
};
prototype$1l.add = function(op) {
  this.operators.push(op);
  op.id = this.id();
  if (op.refs) {
    op.refs.forEach(function(ref$$1) { ref$$1.$ref = op.id; });
    op.refs = null;
  }
  return op;
};
prototype$1l.proxy = function(op) {
  var vref = op instanceof Entry ? ref(op) : op;
  return this.add(Proxy$1({value: vref}));
};
prototype$1l.addStream = function(stream) {
  this.streams.push(stream);
  stream.id = this.id();
  return stream;
};
prototype$1l.addUpdate = function(update) {
  this.updates.push(update);
  return update;
};
prototype$1l.finish = function() {
  var name, ds;
  if (this.root) this.root.root = true;
  for (name in this.signals) {
    this.signals[name].signal = name;
  }
  for (name in this.scales) {
    this.scales[name].scale = name;
  }
  function annotate(op, name, type) {
    var data, list;
    if (op) {
      data = op.data || (op.data = {});
      list = data[name] || (data[name] = []);
      list.push(type);
    }
  }
  for (name in this.data) {
    ds = this.data[name];
    annotate(ds.input,  name, 'input');
    annotate(ds.output, name, 'output');
    annotate(ds.values, name, 'values');
    for (var field$$1 in ds.index) {
      annotate(ds.index[field$$1], name, 'index:' + field$$1);
    }
  }
  return this;
};
prototype$1l.pushState = function(encode, parent, lookup) {
  this._encode.push(ref(this.add(Sieve$1({pulse: encode}))));
  this._parent.push(parent);
  this._lookup.push(lookup ? ref(this.proxy(lookup)) : null);
  this._markpath.push(-1);
};
prototype$1l.popState = function() {
  this._encode.pop();
  this._parent.pop();
  this._lookup.pop();
  this._markpath.pop();
};
prototype$1l.parent = function() {
  return peek(this._parent);
};
prototype$1l.encode = function() {
  return peek(this._encode);
};
prototype$1l.lookup = function() {
  return peek(this._lookup);
};
prototype$1l.markpath = function() {
  var p = this._markpath;
  return ++p[p.length-1];
};
prototype$1l.fieldRef = function(field$$1, name) {
  if (isString(field$$1)) return fieldRef(field$$1, name);
  if (!field$$1.signal) {
    error('Unsupported field reference: ' + $$2(field$$1));
  }
  var s = field$$1.signal,
      f = this.field[s],
      params;
  if (!f) {
    params = {name: this.signalRef(s)};
    if (name) params.as = name;
    this.field[s] = f = ref(this.add(Field$1(params)));
  }
  return f;
};
prototype$1l.compareRef = function(cmp, stable) {
  function check(_$$1) {
    if (isSignal(_$$1)) {
      signal = true;
      return ref(sig[_$$1.signal]);
    } else {
      return _$$1;
    }
  }
  var sig = this.signals,
      signal = false,
      fields = array(cmp.field).map(check),
      orders = array(cmp.order).map(check);
  if (stable) {
    fields.push(tupleidRef);
  }
  return signal
    ? ref(this.add(Compare$1({fields: fields, orders: orders})))
    : compareRef(fields, orders);
};
prototype$1l.keyRef = function(fields, flat) {
  function check(_$$1) {
    if (isSignal(_$$1)) {
      signal = true;
      return ref(sig[_$$1.signal]);
    } else {
      return _$$1;
    }
  }
  var sig = this.signals,
      signal = false;
  fields = array(fields).map(check);
  return signal
    ? ref(this.add(Key$1({fields: fields, flat: flat})))
    : keyRef(fields, flat);
};
prototype$1l.sortRef = function(sort) {
  if (!sort) return sort;
  var a = [aggrField(sort.op, sort.field), tupleidRef],
      o = sort.order || Ascending;
  return o.signal
    ? ref(this.add(Compare$1({
        fields: a,
        orders: [o = this.signalRef(o.signal), o]
      })))
    : compareRef(a, [o, o]);
};
prototype$1l.event = function(source, type) {
  var key$$1 = source + ':' + type;
  if (!this.events[key$$1]) {
    var id$$1 = this.id();
    this.streams.push({
      id: id$$1,
      source: source,
      type: type
    });
    this.events[key$$1] = id$$1;
  }
  return this.events[key$$1];
};
prototype$1l.addSignal = function(name, value$$1) {
  if (this.signals.hasOwnProperty(name)) {
    error('Duplicate signal name: ' + $$2(name));
  }
  var op = value$$1 instanceof Entry ? value$$1 : this.add(operator(value$$1));
  return this.signals[name] = op;
};
prototype$1l.getSignal = function(name) {
  if (!this.signals[name]) {
    error('Unrecognized signal name: ' + $$2(name));
  }
  return this.signals[name];
};
prototype$1l.signalRef = function(s) {
  if (this.signals[s]) {
    return ref(this.signals[s]);
  } else if (!this.lambdas.hasOwnProperty(s)) {
    this.lambdas[s] = this.add(operator(null));
  }
  return ref(this.lambdas[s]);
};
prototype$1l.parseLambdas = function() {
  var code = Object.keys(this.lambdas);
  for (var i=0, n=code.length; i<n; ++i) {
    var s = code[i],
        e = expression(s, this),
        op = this.lambdas[s];
    op.params = e.$params;
    op.update = e.$expr;
  }
};
prototype$1l.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};
prototype$1l.objectProperty = function(spec) {
  return (!spec || !isObject(spec)) ? spec
    : this.signalRef(spec.signal || propertyLambda(spec));
};
function propertyLambda(spec) {
  return (isArray(spec) ? arrayLambda : objectLambda)(spec);
}
function arrayLambda(array$$1) {
  var code = '[',
      i = 0,
      n = array$$1.length,
      value$$1;
  for (; i<n; ++i) {
    value$$1 = array$$1[i];
    code += (i > 0 ? ',' : '')
      + (isObject(value$$1)
        ? (value$$1.signal || propertyLambda(value$$1))
        : $$2(value$$1));
  }
  return code + ']';
}
function objectLambda(obj) {
  var code = '{',
      i = 0,
      key$$1, value$$1;
  for (key$$1 in obj) {
    value$$1 = obj[key$$1];
    code += (++i > 1 ? ',' : '')
      + $$2(key$$1) + ':'
      + (isObject(value$$1)
        ? (value$$1.signal || propertyLambda(value$$1))
        : $$2(value$$1));
  }
  return code + '}';
}
prototype$1l.addBinding = function(name, bind) {
  if (!this.bindings) {
    error('Nested signals do not support binding: ' + $$2(name));
  }
  this.bindings.push(extend({signal: name}, bind));
};
prototype$1l.addScaleProj = function(name, transform) {
  if (this.scales.hasOwnProperty(name)) {
    error('Duplicate scale or projection name: ' + $$2(name));
  }
  this.scales[name] = this.add(transform);
};
prototype$1l.addScale = function(name, params) {
  this.addScaleProj(name, Scale$1(params));
};
prototype$1l.addProjection = function(name, params) {
  this.addScaleProj(name, Projection$1(params));
};
prototype$1l.getScale = function(name) {
  if (!this.scales[name]) {
    error('Unrecognized scale name: ' + $$2(name));
  }
  return this.scales[name];
};
prototype$1l.projectionRef =
prototype$1l.scaleRef = function(name) {
  return ref(this.getScale(name));
};
prototype$1l.projectionType =
prototype$1l.scaleType = function(name) {
  return this.getScale(name).params.type;
};
prototype$1l.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + $$2(name));
  }
  return (this.data[name] = dataScope);
};
prototype$1l.getData = function(name) {
  if (!this.data[name]) {
    error('Undefined data set name: ' + $$2(name));
  }
  return this.data[name];
};
prototype$1l.addDataPipeline = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + $$2(name));
  }
  return this.addData(name, DataScope.fromEntries(this, entries));
};

function defaults(configs) {
  var output = defaults$1();
  (configs || []).forEach(function(config) {
    var key$$1, value, style;
    if (config) {
      for (key$$1 in config) {
        if (key$$1 === 'style') {
          style = output.style || (output.style = {});
          for (key$$1 in config.style) {
            style[key$$1] = extend(style[key$$1] || {}, config.style[key$$1]);
          }
        } else {
          value = config[key$$1];
          output[key$$1] = isObject(value) && !isArray(value)
            ? extend(isObject(output[key$$1]) ? output[key$$1] : {}, value)
            : value;
        }
      }
    }
  });
  return output;
}
var defaultFont = 'sans-serif',
    defaultSymbolSize = 30,
    defaultStrokeWidth = 2,
    defaultColor = '#4c78a8',
    black = "#000",
    gray = '#888',
    lightGray = '#ddd';
function defaults$1() {
  return {
    padding: 0,
    autosize: 'pad',
    background: null,
    events: {
      defaults: {allow: ['wheel']}
    },
    group: null,
    mark: null,
    arc: { fill: defaultColor },
    area: { fill: defaultColor },
    image: null,
    line: {
      stroke: defaultColor,
      strokeWidth: defaultStrokeWidth
    },
    path: { stroke: defaultColor },
    rect: { fill: defaultColor },
    rule: { stroke: black },
    shape: { stroke: defaultColor },
    symbol: {
      fill: defaultColor,
      size: 64
    },
    text: {
      fill: black,
      font: defaultFont,
      fontSize: 11
    },
    style: {
      "guide-label": {
        fill: black,
        font: defaultFont,
        fontSize: 10
      },
      "guide-title": {
        fill: black,
        font: defaultFont,
        fontSize: 11,
        fontWeight: 'bold'
      },
      "group-title": {
        fill: black,
        font: defaultFont,
        fontSize: 13,
        fontWeight: 'bold'
      },
      point: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'circle'
      },
      circle: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth
      },
      square: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'square'
      },
      cell: {
        fill: 'transparent',
        stroke: lightGray
      }
    },
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domain: true,
      domainWidth: 1,
      domainColor: gray,
      grid: false,
      gridWidth: 1,
      gridColor: lightGray,
      gridOpacity: 1,
      labels: true,
      labelAngle: 0,
      labelLimit: 180,
      labelPadding: 2,
      ticks: true,
      tickColor: gray,
      tickOffset: 0,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      titleAlign: 'center',
      titlePadding: 4
    },
    axisBand: {
      tickOffset: -1
    },
    legend: {
      orient: 'right',
      offset: 18,
      padding: 0,
      entryPadding: 5,
      titlePadding: 5,
      gradientWidth: 100,
      gradientHeight: 20,
      gradientStrokeColor: lightGray,
      gradientStrokeWidth: 0,
      gradientLabelBaseline: 'top',
      gradientLabelOffset: 2,
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelOffset: 8,
      labelLimit: 160,
      symbolType: 'circle',
      symbolSize: 100,
      symbolFillColor: 'transparent',
      symbolStrokeColor: gray,
      symbolStrokeWidth: 1.5,
      titleAlign: 'left',
      titleBaseline: 'top',
      titleLimit: 180
    },
    title: {
      orient: 'top',
      anchor: 'middle',
      offset: 4
    },
    range: {
      category: {
        scheme: 'tableau10'
      },
      ordinal: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      heatmap: {
        scheme: 'viridis'
      },
      ramp: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      diverging: {
        scheme: 'blueorange'
      },
      symbol: [
        'circle',
        'square',
        'triangle-up',
        'cross',
        'diamond',
        'triangle-right',
        'triangle-down',
        'triangle-left'
      ]
    }
  };
}

function parse$3(spec, config) {
  if (!isObject(spec)) error('Input Vega specification must be an object.');
  return parseView(spec, new Scope$1(defaults([config, spec.config])))
    .toRuntime();
}

function expression$2(args, code, ctx) {
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}
function operatorExpression(code, ctx) {
  return expression$2(['_'], code, ctx);
}
function parameterExpression(code, ctx) {
  return expression$2(['datum', '_'], code, ctx);
}
function eventExpression(code, ctx) {
  return expression$2(['event'], code, ctx);
}
function handlerExpression(code, ctx) {
  return expression$2(['_', 'event'], code, ctx);
}
function encodeExpression(code, ctx) {
  return expression$2(['item', '_'], code, ctx);
}

function parseParameters$1(spec, ctx, params) {
  params = params || {};
  var key$$1, value;
  for (key$$1 in spec) {
    value = spec[key$$1];
    if (value && value.$expr && value.$params) {
      parseParameters$1(value.$params, ctx, params);
    }
    params[key$$1] = isArray(value)
      ? value.map(function(v) { return parseParameter$2(v, ctx); })
      : parseParameter$2(value, ctx);
  }
  return params;
}
function parseParameter$2(spec, ctx) {
  if (!spec || !isObject(spec)) return spec;
  for (var i=0, n=PARSERS.length, p; i<n; ++i) {
    p = PARSERS[i];
    if (spec.hasOwnProperty(p.key)) {
      return p.parse(spec, ctx);
    }
  }
  return spec;
}
var PARSERS = [
  {key: '$ref',      parse: getOperator},
  {key: '$key',      parse: getKey},
  {key: '$expr',     parse: getExpression},
  {key: '$field',    parse: getField$1},
  {key: '$encode',   parse: getEncode},
  {key: '$compare',  parse: getCompare},
  {key: '$context',  parse: getContext},
  {key: '$subflow',  parse: getSubflow},
  {key: '$tupleid',  parse: getTupleId}
];
function getOperator(_$$1, ctx) {
  return ctx.get(_$$1.$ref) || error('Operator not defined: ' + _$$1.$ref);
}
function getExpression(_$$1, ctx) {
  var k = 'e:' + _$$1.$expr;
  return ctx.fn[k]
    || (ctx.fn[k] = accessor(parameterExpression(_$$1.$expr, ctx), _$$1.$fields, _$$1.$name));
}
function getKey(_$$1, ctx) {
  var k = 'k:' + _$$1.$key + '_' + (!!_$$1.$flat);
  return ctx.fn[k] || (ctx.fn[k] = key(_$$1.$key, _$$1.$flat));
}
function getField$1(_$$1, ctx) {
  if (!_$$1.$field) return null;
  var k = 'f:' + _$$1.$field + '_' + _$$1.$name;
  return ctx.fn[k] || (ctx.fn[k] = field(_$$1.$field, _$$1.$name));
}
function getCompare(_$$1, ctx) {
  var k = 'c:' + _$$1.$compare + '_' + _$$1.$order,
      c = array(_$$1.$compare).map(function(_$$1) {
        return (_$$1 && _$$1.$tupleid) ? tupleid : _$$1;
      });
  return ctx.fn[k] || (ctx.fn[k] = compare(c, _$$1.$order));
}
function getEncode(_$$1, ctx) {
  var spec = _$$1.$encode,
      encode = {}, name, enc;
  for (name in spec) {
    enc = spec[name];
    encode[name] = accessor(encodeExpression(enc.$expr, ctx), enc.$fields);
    encode[name].output = enc.$output;
  }
  return encode;
}
function getContext(_$$1, ctx) {
  return ctx;
}
function getSubflow(_$$1, ctx) {
  var spec = _$$1.$subflow;
  return function(dataflow, key$$1, parent) {
    var subctx = parseDataflow(spec, ctx.fork()),
        op = subctx.get(spec.operators[0].id),
        p = subctx.signals.parent;
    if (p) p.set(parent);
    return op;
  };
}
function getTupleId() {
  return tupleid;
}

function canonicalType(type) {
  return (type + '').toLowerCase();
}
function isOperator(type) {
   return canonicalType(type) === 'operator';
}
function isCollect(type) {
  return canonicalType(type) === 'collect';
}

function parseOperator(spec, ctx) {
  if (isOperator(spec.type) || !spec.type) {
    ctx.operator(spec,
      spec.update ? operatorExpression(spec.update, ctx) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
}
function parseOperatorParameters(spec, ctx) {
  var op, params;
  if (spec.params) {
    if (!(op = ctx.get(spec.id))) {
      error('Invalid operator id: ' + spec.id);
    }
    params = parseParameters$1(spec.params, ctx);
    ctx.dataflow.connect(op, op.parameters(params));
  }
}

function parseStream$3(spec, ctx) {
  var filter = spec.filter != null ? eventExpression(spec.filter, ctx) : undefined,
      stream = spec.stream != null ? ctx.get(spec.stream) : undefined,
      args;
  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  }
  else if (spec.merge) {
    args = spec.merge.map(ctx.get.bind(ctx));
    stream = args[0].merge.apply(args[0], args.slice(1));
  }
  if (spec.between) {
    args = spec.between.map(ctx.get.bind(ctx));
    stream = stream.between(args[0], args[1]);
  }
  if (spec.filter) {
    stream = stream.filter(filter);
  }
  if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }
  if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }
  if (stream == null) {
    error('Invalid stream definition: ' + JSON.stringify(spec));
  }
  if (spec.consume) stream.consume(true);
  ctx.stream(spec, stream);
}

function parseUpdate$1(spec, ctx) {
  var source = ctx.get(spec.source),
      target = null,
      update = spec.update,
      params = undefined;
  if (!source) error('Source not defined: ' + spec.source);
  if (spec.target && spec.target.$expr) {
    target = eventExpression(spec.target.$expr, ctx);
  } else {
    target = ctx.get(spec.target);
  }
  if (update && update.$expr) {
    if (update.$params) {
      params = parseParameters$1(update.$params, ctx);
    }
    update = handlerExpression(update.$expr, ctx);
  }
  ctx.update(spec, source, target, update, params);
}

function parseDataflow(spec, ctx) {
  var operators = spec.operators || [];
  if (spec.background) {
    ctx.background = spec.background;
  }
  if (spec.eventConfig) {
    ctx.eventConfig = spec.eventConfig;
  }
  operators.forEach(function(entry) {
    parseOperator(entry, ctx);
  });
  operators.forEach(function(entry) {
    parseOperatorParameters(entry, ctx);
  });
  (spec.streams || []).forEach(function(entry) {
    parseStream$3(entry, ctx);
  });
  (spec.updates || []).forEach(function(entry) {
    parseUpdate$1(entry, ctx);
  });
  return ctx.resolve();
}

var SKIP$3 = {skip: true};
function getState(options) {
  var ctx = this,
      state = {};
  if (options.signals) {
    var signals = (state.signals = {});
    Object.keys(ctx.signals).forEach(function(key$$1) {
      var op = ctx.signals[key$$1];
      if (options.signals(key$$1, op)) {
        signals[key$$1] = op.value;
      }
    });
  }
  if (options.data) {
    var data = (state.data = {});
    Object.keys(ctx.data).forEach(function(key$$1) {
      var dataset = ctx.data[key$$1];
      if (options.data(key$$1, dataset)) {
        data[key$$1] = dataset.input.value;
      }
    });
  }
  if (ctx.subcontext && options.recurse !== false) {
    state.subcontext = ctx.subcontext.map(function(ctx) {
      return ctx.getState(options);
    });
  }
  return state;
}
function setState(state) {
  var ctx = this,
      df = ctx.dataflow,
      data = state.data,
      signals = state.signals;
  Object.keys(signals || {}).forEach(function(key$$1) {
    df.update(ctx.signals[key$$1], signals[key$$1], SKIP$3);
  });
  Object.keys(data || {}).forEach(function(key$$1) {
    df.pulse(
      ctx.data[key$$1].input,
      df.changeset().remove(truthy).insert(data[key$$1])
    );
  });
  (state.subcontext  || []).forEach(function(substate, i) {
    var subctx = ctx.subcontext[i];
    if (subctx) subctx.setState(substate);
  });
}

function context$2(df, transforms, functions) {
  return new Context(df, transforms, functions);
}
function Context(df, transforms, functions) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.signals = {};
  this.scales = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
  if (functions) {
    this.functions = Object.create(functions);
    this.functions.context = this;
  }
}
function ContextFork(ctx) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.functions = ctx.functions;
  this.events = ctx.events;
  this.signals = Object.create(ctx.signals);
  this.scales = Object.create(ctx.scales);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
  if (ctx.functions) {
    this.functions = Object.create(ctx.functions);
    this.functions.context = this;
  }
}
Context.prototype = ContextFork.prototype = {
  fork: function() {
    var ctx = new ContextFork(this);
    (this.subcontext || (this.subcontext = [])).push(ctx);
    return ctx;
  },
  get: function(id) {
    return this.nodes[id];
  },
  set: function(id, node) {
    return this.nodes[id] = node;
  },
  add: function(spec, op) {
    var ctx = this,
        df = ctx.dataflow,
        data;
    ctx.set(spec.id, op);
    if (isCollect(spec.type) && (data = spec.value)) {
      if (data.$ingest) {
        df.ingest(op, data.$ingest, data.$format);
      } else if (data.$request) {
        df.request(op, data.$request, data.$format);
      } else {
        df.pulse(op, df.changeset().insert(data));
      }
    }
    if (spec.root) {
      ctx.root = op;
    }
    if (spec.parent) {
      var p = ctx.get(spec.parent.$ref);
      if (p) {
        df.connect(p, [op]);
        op.targets().add(p);
      } else {
        (ctx.unresolved = ctx.unresolved || []).push(function() {
          p = ctx.get(spec.parent.$ref);
          df.connect(p, [op]);
          op.targets().add(p);
        });
      }
    }
    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }
    if (spec.scale) {
      ctx.scales[spec.scale] = op;
    }
    if (spec.data) {
      for (var name in spec.data) {
        data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(function(role) { data[role] = op; });
      }
    }
  },
  resolve: function() {
    (this.unresolved || []).forEach(function(fn) { fn(); });
    delete this.unresolved;
    return this;
  },
  operator: function(spec, update, params) {
    this.add(spec, this.dataflow.add(spec.value, update, params, spec.react));
  },
  transform: function(spec, type, params) {
    this.add(spec, this.dataflow.add(this.transforms[canonicalType(type)], params));
  },
  stream: function(spec, stream) {
    this.set(spec.id, stream);
  },
  update: function(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  },
  getState: getState,
  setState: setState
};

function runtime(view, spec, functions) {
  var fn = functions || functionContext;
  return parseDataflow(spec, context$2(view, transforms, fn));
}

var Width = 'width',
    Height = 'height',
    Padding$1 = 'padding',
    Skip$2 = {skip: true};
function viewWidth(view, width) {
  var a = view.autosize(),
      p = view.padding();
  return width - (a && a.contains === Padding$1 ? p.left + p.right : 0);
}
function viewHeight(view, height) {
  var a = view.autosize(),
      p = view.padding();
  return height - (a && a.contains === Padding$1 ? p.top + p.bottom : 0);
}
function initializeResize(view) {
  var s = view._signals,
      w = s[Width],
      h = s[Height],
      p = s[Padding$1];
  function resetSize() {
    view._autosize = view._resize = 1;
  }
  view._resizeWidth = view.add(null,
    function(_$$1) {
      view._width = _$$1.size;
      view._viewWidth = viewWidth(view, _$$1.size);
      resetSize();
    },
    {size: w}
  );
  view._resizeHeight = view.add(null,
    function(_$$1) {
      view._height = _$$1.size;
      view._viewHeight = viewHeight(view, _$$1.size);
      resetSize();
    },
    {size: h}
  );
  var resizePadding = view.add(null, resetSize, {pad: p});
  view._resizeWidth.rank = w.rank + 1;
  view._resizeHeight.rank = h.rank + 1;
  resizePadding.rank = p.rank + 1;
}
function resizeView(viewWidth, viewHeight, width, height, origin, auto) {
  this.runAfter(function(view) {
    var rerun = 0;
    view._autosize = 0;
    if (view.width() !== width) {
      rerun = 1;
      view.signal(Width, width, Skip$2);
      view._resizeWidth.skip(true);
    }
    if (view.height() !== height) {
      rerun = 1;
      view.signal(Height, height, Skip$2);
      view._resizeHeight.skip(true);
    }
    if (view._viewWidth !== viewWidth) {
      view._resize = 1;
      view._viewWidth = viewWidth;
    }
    if (view._viewHeight !== viewHeight) {
      view._resize = 1;
      view._viewHeight = viewHeight;
    }
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }
    if (rerun) view.run('enter');
    if (auto) view.runAfter(function() { view.resize(); });
  }, false, 1);
}

function getState$1(options) {
  return this._runtime.getState(options || {
    data:    dataTest,
    signals: signalTest,
    recurse: true
  });
}
function dataTest(name, data) {
  return data.modified
      && isArray(data.input.value)
      && name.indexOf('_:vega:_');
}
function signalTest(name, op) {
  return !(name === 'parent' || op instanceof transforms.proxy);
}
function setState$1(state) {
  var view = this;
  view.runAfter(function() {
    view._trigger = false;
    view._runtime.setState(state);
    view.run().runAfter(function() { view._trigger = true; });
  });
  return this;
}

function defaultTooltip$1(handler, event, item, value) {
  handler.element().setAttribute('title', formatTooltip(value));
}
function formatTooltip(value) {
  return value == null ? ''
    : isArray(value) ? formatArray(value)
    : isObject(value) && !isDate(value) ? formatObject(value)
    : value + '';
}
function formatObject(obj) {
  return Object.keys(obj).map(function(key$$1) {
    var v = obj[key$$1];
    return key$$1 + ': ' + (isArray(v) ? formatArray(v) : formatValue$1(v));
  }).join('\n');
}
function formatArray(value) {
  return '[' + value.map(formatValue$1).join(', ') + ']';
}
function formatValue$1(value) {
  return isArray(value) ? '[\u2026]'
    : isObject(value) && !isDate(value) ? '{\u2026}'
    : value;
}

function View$1(spec, options) {
  var view = this;
  options = options || {};
  Dataflow.call(view);
  view.loader(options.loader || view._loader);
  view.logLevel(options.logLevel || 0);
  view._el = null;
  view._renderType = options.renderer || RenderType.Canvas;
  view._scenegraph = new Scenegraph();
  var root = view._scenegraph.root;
  view._renderer = null;
  view._tooltip = options.tooltip || defaultTooltip$1,
  view._redraw = true;
  view._handler = new CanvasHandler().scene(root);
  view._preventDefault = false;
  view._eventListeners = [];
  view._resizeListeners = [];
  var ctx = runtime(view, spec, options.functions);
  view._runtime = ctx;
  view._signals = ctx.signals;
  view._bind = (spec.bindings || []).map(function(_$$1) {
    return {
      state: null,
      param: extend({}, _$$1)
    };
  });
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  view.pulse(
    ctx.data.root.input,
    view.changeset().insert(root.items)
  );
  view._background = ctx.background || null;
  view._eventConfig = initializeEventConfig(ctx.eventConfig);
  view._width = view.width();
  view._height = view.height();
  view._viewWidth = viewWidth(view, view._width);
  view._viewHeight = viewHeight(view, view._height);
  view._origin = [0, 0];
  view._resize = 0;
  view._autosize = 1;
  initializeResize(view);
  cursor(view);
}
var prototype$1m = inherits(View$1, Dataflow);
prototype$1m.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);
  if (this._redraw || this._resize) {
    try {
      this.render();
    } catch (e) {
      this.error(e);
    }
  }
  return this;
};
prototype$1m.render = function() {
  if (this._renderer) {
    if (this._resize) {
      this._resize = 0;
      resizeRenderer(this);
    }
    this._renderer.render(this._scenegraph.root);
  }
  this._redraw = false;
  return this;
};
prototype$1m.dirty = function(item) {
  this._redraw = true;
  this._renderer && this._renderer.dirty(item);
};
prototype$1m.container = function() {
  return this._el;
};
prototype$1m.scenegraph = function() {
  return this._scenegraph;
};
prototype$1m.origin = function() {
  return this._origin.slice();
};
function lookupSignal(view, name) {
  return view._signals.hasOwnProperty(name)
    ? view._signals[name]
    : error('Unrecognized signal name: ' + $$2(name));
}
prototype$1m.signal = function(name, value, options) {
  var op = lookupSignal(this, name);
  return arguments.length === 1
    ? op.value
    : this.update(op, value, options);
};
prototype$1m.background = function(_$$1) {
  if (arguments.length) {
    this._background = _$$1;
    this._resize = 1;
    return this;
  } else {
    return this._background;
  }
};
prototype$1m.width = function(_$$1) {
  return arguments.length ? this.signal('width', _$$1) : this.signal('width');
};
prototype$1m.height = function(_$$1) {
  return arguments.length ? this.signal('height', _$$1) : this.signal('height');
};
prototype$1m.padding = function(_$$1) {
  return arguments.length ? this.signal('padding', _$$1) : this.signal('padding');
};
prototype$1m.autosize = function(_$$1) {
  return arguments.length ? this.signal('autosize', _$$1) : this.signal('autosize');
};
prototype$1m.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (!renderModule(type)) error('Unrecognized renderer type: ' + type);
  if (type !== this._renderType) {
    this._renderType = type;
    this._resetRenderer();
  }
  return this;
};
prototype$1m.tooltip = function(handler) {
  if (!arguments.length) return this._tooltip;
  if (handler !== this._tooltip) {
    this._tooltip = handler;
    this._resetRenderer();
  }
  return this;
};
prototype$1m.loader = function(loader) {
  if (!arguments.length) return this._loader;
  if (loader !== this._loader) {
    Dataflow.prototype.loader.call(this, loader);
    this._resetRenderer();
  }
  return this;
};
prototype$1m.resize = function() {
  this._autosize = 1;
  return this;
};
prototype$1m._resetRenderer = function() {
  if (this._renderer) {
    this._renderer = null;
    this.initialize(this._el);
  }
};
prototype$1m._resizeView = resizeView;
prototype$1m.addEventListener = function(type, handler) {
  this._handler.on(type, handler);
  return this;
};
prototype$1m.removeEventListener = function(type, handler) {
  this._handler.off(type, handler);
  return this;
};
prototype$1m.addResizeListener = function(handler) {
  var l = this._resizeListeners;
  if (l.indexOf(handler) < 0) {
    l.push(handler);
  }
  return this;
};
prototype$1m.removeResizeListener = function(handler) {
  var l = this._resizeListeners,
      i = l.indexOf(handler);
  if (i >= 0) {
    l.splice(i, 1);
  }
  return this;
};
function findHandler(signal, handler) {
  var t = signal._targets || [],
      h = t.filter(function(op) {
            var u = op._update;
            return u && u.handler === handler;
          });
  return h.length ? h[0] : null;
}
prototype$1m.addSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = findHandler(s, handler);
  if (!h) {
    h = function() { handler(name, s.value); };
    h.handler = handler;
    this.on(s, null, h);
  }
  return this;
};
prototype$1m.removeSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = findHandler(s, handler);
  if (h) s._targets.remove(h);
  return this;
};
prototype$1m.preventDefault = function(_$$1) {
  if (arguments.length) {
    this._preventDefault = _$$1;
    return this;
  } else {
    return this._preventDefault;
  }
};
prototype$1m.tooltipHandler = function(_$$1) {
  var h = this._handler;
  if (!arguments.length) {
    return h.handleTooltip;
  } else {
    h.handleTooltip = _$$1 || Handler.prototype.handleTooltip;
    return this;
  }
};
prototype$1m.events = events$1;
prototype$1m.finalize = finalize;
prototype$1m.hover = hover;
prototype$1m.data = data;
prototype$1m.change = change;
prototype$1m.insert = insert;
prototype$1m.remove = remove;
prototype$1m.initialize = initialize$1;
prototype$1m.toImageURL = renderToImageURL;
prototype$1m.toCanvas = renderToCanvas;
prototype$1m.toSVG = renderToSVG;
prototype$1m.getState = getState$1;
prototype$1m.setState = setState$1;

extend(transforms, tx, vtx, encode, geo, force, tree, voronoi, wordcloud, xf);

var vegaImport = /*#__PURE__*/Object.freeze({
  version: version,
  Dataflow: Dataflow,
  EventStream: EventStream,
  Parameters: Parameters,
  Pulse: Pulse,
  MultiPulse: MultiPulse,
  Operator: Operator,
  Transform: Transform,
  changeset: changeset,
  ingest: ingest,
  isTuple: isTuple,
  definition: definition,
  transform: transform,
  transforms: transforms,
  tupleid: tupleid,
  scale: scale$1,
  scheme: scheme,
  interpolate: interpolate,
  interpolateRange: interpolateRange,
  timeInterval: timeInterval,
  utcInterval: utcInterval,
  projection: projection,
  View: View$1,
  parse: parse$3,
  expressionFunction: expressionFunction,
  formatLocale: d3Format.formatDefaultLocale,
  timeFormatLocale: d3TimeFormat.timeFormatDefaultLocale,
  runtime: parseDataflow,
  runtimeContext: context$2,
  bin: bin,
  bootstrapCI: bootstrapCI,
  quartiles: quartiles,
  get random () { return random; },
  setRandom: setRandom,
  randomLCG: lcg,
  randomInteger: integer,
  randomKDE: randomKDE,
  randomMixture: randomMixture,
  randomNormal: randomNormal,
  randomUniform: randomUniform,
  regressionLinear: linear,
  regressionLog: log$2,
  regressionExp: exp$1,
  regressionPow: pow$1,
  regressionQuad: quad,
  regressionPoly: poly,
  regressionLoess: loess,
  sampleCurve: sampleCurve,
  accessor: accessor,
  accessorName: accessorName,
  accessorFields: accessorFields,
  id: id,
  identity: identity,
  zero: zero,
  one: one,
  truthy: truthy,
  falsy: falsy,
  logger: logger,
  None: None,
  Error: Error$1,
  Warn: Warn,
  Info: Info,
  Debug: Debug,
  panLinear: panLinear,
  panLog: panLog,
  panPow: panPow,
  panSymlog: panSymlog,
  zoomLinear: zoomLinear,
  zoomLog: zoomLog,
  zoomPow: zoomPow,
  zoomSymlog: zoomSymlog,
  quarter: quarter,
  utcquarter: utcquarter,
  array: array,
  clampRange: clampRange,
  compare: compare,
  constant: constant,
  debounce: debounce,
  error: error,
  extend: extend,
  extent: extent,
  extentIndex: extentIndex,
  fastmap: fastmap,
  field: field,
  flush: flush,
  inherits: inherits,
  inrange: inrange,
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isFunction: isFunction,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  key: key,
  lerp: lerp,
  merge: merge,
  pad: pad,
  peek: peek,
  repeat: repeat,
  span: span,
  splitAccessPath: splitAccessPath,
  stringValue: $$2,
  toBoolean: toBoolean,
  toDate: toDate,
  toNumber: toNumber,
  toString: toString,
  toSet: toSet,
  truncate: truncate,
  visitArray: visitArray,
  loader: loader,
  read: read,
  inferType: inferType,
  inferTypes: inferTypes,
  typeParsers: typeParsers,
  formats: formats$1,
  Bounds: Bounds,
  Gradient: Gradient,
  GroupItem: GroupItem,
  ResourceLoader: ResourceLoader,
  Item: Item,
  Scenegraph: Scenegraph,
  Handler: Handler,
  Renderer: Renderer,
  CanvasHandler: CanvasHandler,
  CanvasRenderer: CanvasRenderer,
  SVGHandler: SVGHandler,
  SVGRenderer: SVGRenderer,
  SVGStringRenderer: SVGStringRenderer,
  RenderType: RenderType,
  renderModule: renderModule,
  Marks: Marks,
  boundClip: boundClip,
  boundContext: context,
  boundStroke: boundStroke,
  boundItem: boundItem,
  boundMark: boundMark,
  pathCurves: curves,
  pathSymbols: symbols,
  pathRectangle: vg_rect,
  pathTrail: vg_trail,
  pathParse: pathParse,
  pathRender: pathRender,
  point: point,
  domCreate: domCreate,
  domFind: domFind,
  domChild: domChild,
  domClear: domClear,
  openTag: openTag,
  closeTag: closeTag,
  font: font,
  textMetrics: textMetrics,
  resetSVGClipId: resetSVGClipId,
  sceneEqual: sceneEqual,
  pathEqual: pathEqual,
  sceneToJSON: sceneToJSON,
  sceneFromJSON: sceneFromJSON,
  sceneZOrder: zorder,
  sceneVisit: visit,
  scenePickVisit: pickVisit
});

function isLogicalOr(op) {
    return !!op.or;
}
function isLogicalAnd(op) {
    return !!op.and;
}
function isLogicalNot(op) {
    return !!op.not;
}
function forEachLeaf(op, fn) {
    if (isLogicalNot(op)) {
        forEachLeaf(op.not, fn);
    }
    else if (isLogicalAnd(op)) {
        for (var _i = 0, _a = op.and; _i < _a.length; _i++) {
            var subop = _a[_i];
            forEachLeaf(subop, fn);
        }
    }
    else if (isLogicalOr(op)) {
        for (var _b = 0, _c = op.or; _b < _c.length; _b++) {
            var subop = _c[_b];
            forEachLeaf(subop, fn);
        }
    }
    else {
        fn(op);
    }
}
function normalizeLogicalOperand(op, normalizer) {
    if (isLogicalNot(op)) {
        return { not: normalizeLogicalOperand(op.not, normalizer) };
    }
    else if (isLogicalAnd(op)) {
        return { and: op.and.map(function (o) { return normalizeLogicalOperand(o, normalizer); }) };
    }
    else if (isLogicalOr(op)) {
        return { or: op.or.map(function (o) { return normalizeLogicalOperand(o, normalizer); }) };
    }
    else {
        return normalizer(op);
    }
}

function pick$2(obj, props) {
    var copy = {};
    for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
        var prop = props_1[_i];
        if (obj.hasOwnProperty(prop)) {
            copy[prop] = obj[prop];
        }
    }
    return copy;
}
function omit(obj, props) {
    var copy = tslib_1.__assign({}, obj);
    for (var _i = 0, props_2 = props; _i < props_2.length; _i++) {
        var prop = props_2[_i];
        delete copy[prop];
    }
    return copy;
}
var stringify$1 = stableStringify;
function hash(a) {
    if (isNumber(a)) {
        return a;
    }
    var str = isString(a) ? a : stableStringify(a);
    if (str.length < 100) {
        return str;
    }
    var h = 0;
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        h = ((h << 5) - h) + char;
        h = h & h;
    }
    return h;
}
function contains(array$$1, item) {
    return array$$1.indexOf(item) > -1;
}
function without(array$$1, excludedItems) {
    return array$$1.filter(function (item) { return !contains(excludedItems, item); });
}
function union(array$$1, other) {
    return array$$1.concat(without(other, array$$1));
}
function some(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (f(arr[k], k, i++)) {
            return true;
        }
    }
    return false;
}
function every(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (!f(arr[k], k, i++)) {
            return false;
        }
    }
    return true;
}
function flatten(arrays) {
    return [].concat.apply([], arrays);
}
function mergeDeep(dest) {
    var src = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        src[_i - 1] = arguments[_i];
    }
    for (var _a = 0, src_1 = src; _a < src_1.length; _a++) {
        var s = src_1[_a];
        dest = deepMerge_(dest, s);
    }
    return dest;
}
function deepMerge_(dest, src) {
    if (typeof src !== 'object' || src === null) {
        return dest;
    }
    for (var p in src) {
        if (!src.hasOwnProperty(p)) {
            continue;
        }
        if (src[p] === undefined) {
            continue;
        }
        if (typeof src[p] !== 'object' || isArray(src[p]) || src[p] === null) {
            dest[p] = src[p];
        }
        else if (typeof dest[p] !== 'object' || dest[p] === null) {
            dest[p] = mergeDeep(isArray(src[p].constructor) ? [] : {}, src[p]);
        }
        else {
            mergeDeep(dest[p], src[p]);
        }
    }
    return dest;
}
function unique(values, f) {
    var results = [];
    var u = {};
    var v;
    for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
        var val = values_1[_i];
        v = f(val);
        if (v in u) {
            continue;
        }
        u[v] = 1;
        results.push(val);
    }
    return results;
}
function differ(dict, other) {
    for (var key$$1 in dict) {
        if (dict.hasOwnProperty(key$$1)) {
            if (other[key$$1] && dict[key$$1] && other[key$$1] !== dict[key$$1]) {
                return true;
            }
        }
    }
    return false;
}
function hasIntersection(a, b) {
    for (var key$$1 in a) {
        if (key$$1 in b) {
            return true;
        }
    }
    return false;
}
function isNumeric(num) {
    return !isNaN(num);
}
function differArray(array$$1, other) {
    if (array$$1.length !== other.length) {
        return true;
    }
    array$$1.sort();
    other.sort();
    for (var i = 0; i < array$$1.length; i++) {
        if (other[i] !== array$$1[i]) {
            return true;
        }
    }
    return false;
}
var keys$1 = Object.keys;
function vals(x) {
    var _vals = [];
    for (var k in x) {
        if (x.hasOwnProperty(k)) {
            _vals.push(x[k]);
        }
    }
    return _vals;
}
function flagKeys(f) {
    return keys$1(f);
}
function duplicate(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function isBoolean$2(b) {
    return b === true || b === false;
}
function varName(s) {
    var alphanumericS = s.replace(/\W/g, '_');
    return (s.match(/^\d+/) ? '_' : '') + alphanumericS;
}
function logicalExpr(op, cb) {
    if (isLogicalNot(op)) {
        return '!(' + logicalExpr(op.not, cb) + ')';
    }
    else if (isLogicalAnd(op)) {
        return '(' + op.and.map(function (and) { return logicalExpr(and, cb); }).join(') && (') + ')';
    }
    else if (isLogicalOr(op)) {
        return '(' + op.or.map(function (or) { return logicalExpr(or, cb); }).join(') || (') + ')';
    }
    else {
        return cb(op);
    }
}
function deleteNestedProperty(obj, orderedProps) {
    if (orderedProps.length === 0) {
        return true;
    }
    var prop = orderedProps.shift();
    if (deleteNestedProperty(obj[prop], orderedProps)) {
        delete obj[prop];
    }
    return Object.keys(obj).length === 0;
}
function titlecase(s) {
    return s.charAt(0).toUpperCase() + s.substr(1);
}
function accessPathWithDatum(path, datum) {
    if (datum === void 0) { datum = 'datum'; }
    var pieces = splitAccessPath(path);
    var prefixes = [];
    for (var i = 1; i <= pieces.length; i++) {
        var prefix = "[" + pieces.slice(0, i).map($$2).join('][') + "]";
        prefixes.push("" + datum + prefix);
    }
    return prefixes.join(' && ');
}
function flatAccessWithDatum(path, datum) {
    if (datum === void 0) { datum = 'datum'; }
    return datum + "[" + $$2(splitAccessPath(path).join('.')) + "]";
}
function replacePathInField(path) {
    return "" + splitAccessPath(path).map(function (p) { return p.replace('.', '\\.'); }).join('\\.');
}
function removePathFromField(path) {
    return "" + splitAccessPath(path).join('.');
}
function accessPathDepth(path) {
    if (!path) {
        return 0;
    }
    return splitAccessPath(path).length;
}

var util = /*#__PURE__*/Object.freeze({
  pick: pick$2,
  omit: omit,
  stringify: stringify$1,
  hash: hash,
  contains: contains,
  without: without,
  union: union,
  some: some,
  every: every,
  flatten: flatten,
  mergeDeep: mergeDeep,
  unique: unique,
  differ: differ,
  hasIntersection: hasIntersection,
  isNumeric: isNumeric,
  differArray: differArray,
  keys: keys$1,
  vals: vals,
  flagKeys: flagKeys,
  duplicate: duplicate,
  isBoolean: isBoolean$2,
  varName: varName,
  logicalExpr: logicalExpr,
  deleteNestedProperty: deleteNestedProperty,
  titlecase: titlecase,
  accessPathWithDatum: accessPathWithDatum,
  flatAccessWithDatum: flatAccessWithDatum,
  replacePathInField: replacePathInField,
  removePathFromField: removePathFromField,
  accessPathDepth: accessPathDepth
});

var AGGREGATE_OP_INDEX = {
    argmax: 1,
    argmin: 1,
    average: 1,
    count: 1,
    distinct: 1,
    max: 1,
    mean: 1,
    median: 1,
    min: 1,
    missing: 1,
    q1: 1,
    q3: 1,
    ci0: 1,
    ci1: 1,
    stderr: 1,
    stdev: 1,
    stdevp: 1,
    sum: 1,
    valid: 1,
    values: 1,
    variance: 1,
    variancep: 1,
};
var AGGREGATE_OPS = flagKeys(AGGREGATE_OP_INDEX);
function isAggregateOp(a) {
    return !!AGGREGATE_OP_INDEX[a];
}
var COUNTING_OPS = ['count', 'valid', 'missing', 'distinct'];
function isCountingAggregateOp(aggregate) {
    return aggregate && contains(COUNTING_OPS, aggregate);
}
var SUM_OPS = [
    'count',
    'sum',
    'distinct',
    'valid',
    'missing'
];
var SHARED_DOMAIN_OPS = [
    'mean',
    'average',
    'median',
    'q1',
    'q3',
    'min',
    'max',
];
var SHARED_DOMAIN_OP_INDEX = toSet(SHARED_DOMAIN_OPS);

var aggregate = /*#__PURE__*/Object.freeze({
  AGGREGATE_OPS: AGGREGATE_OPS,
  isAggregateOp: isAggregateOp,
  COUNTING_OPS: COUNTING_OPS,
  isCountingAggregateOp: isCountingAggregateOp,
  SUM_OPS: SUM_OPS,
  SHARED_DOMAIN_OPS: SHARED_DOMAIN_OPS,
  SHARED_DOMAIN_OP_INDEX: SHARED_DOMAIN_OP_INDEX
});

var AXIS_PARTS = ['domain', 'grid', 'labels', 'ticks', 'title'];
var AXIS_PROPERTY_TYPE = {
    grid: 'grid',
    gridScale: 'grid',
    domain: 'main',
    labels: 'main',
    labelFlush: 'main',
    labelOverlap: 'main',
    minExtent: 'main',
    maxExtent: 'main',
    offset: 'main',
    ticks: 'main',
    title: 'main',
    values: 'both',
    scale: 'both',
    zindex: 'both'
};
var COMMON_AXIS_PROPERTIES_INDEX = {
    orient: 1,
    domain: 1,
    format: 1,
    grid: 1,
    labelBound: 1,
    labelFlush: 1,
    labelPadding: 1,
    labels: 1,
    labelOverlap: 1,
    maxExtent: 1,
    minExtent: 1,
    offset: 1,
    position: 1,
    tickCount: 1,
    ticks: 1,
    tickSize: 1,
    title: 1,
    titlePadding: 1,
    values: 1,
    zindex: 1,
};
var AXIS_PROPERTIES_INDEX = tslib_1.__assign({}, COMMON_AXIS_PROPERTIES_INDEX, { encoding: 1, labelAngle: 1, titleMaxLength: 1 });
var VG_AXIS_PROPERTIES_INDEX = tslib_1.__assign({ scale: 1 }, COMMON_AXIS_PROPERTIES_INDEX, { gridScale: 1, encode: 1 });
function isAxisProperty(prop) {
    return !!AXIS_PROPERTIES_INDEX[prop];
}
var VG_AXIS_PROPERTIES = flagKeys(VG_AXIS_PROPERTIES_INDEX);
var AXIS_PROPERTIES = flagKeys(AXIS_PROPERTIES_INDEX);

var axis = /*#__PURE__*/Object.freeze({
  AXIS_PARTS: AXIS_PARTS,
  AXIS_PROPERTY_TYPE: AXIS_PROPERTY_TYPE,
  isAxisProperty: isAxisProperty,
  VG_AXIS_PROPERTIES: VG_AXIS_PROPERTIES,
  AXIS_PROPERTIES: AXIS_PROPERTIES
});

var Channel;
(function (Channel) {
    Channel.ROW = 'row';
    Channel.COLUMN = 'column';
    Channel.X = 'x';
    Channel.Y = 'y';
    Channel.X2 = 'x2';
    Channel.Y2 = 'y2';
    Channel.LATITUDE = 'latitude';
    Channel.LONGITUDE = 'longitude';
    Channel.LATITUDE2 = 'latitude2';
    Channel.LONGITUDE2 = 'longitude2';
    Channel.COLOR = 'color';
    Channel.FILL = 'fill';
    Channel.STROKE = 'stroke';
    Channel.SHAPE = 'shape';
    Channel.SIZE = 'size';
    Channel.OPACITY = 'opacity';
    Channel.TEXT = 'text';
    Channel.ORDER = 'order';
    Channel.DETAIL = 'detail';
    Channel.KEY = 'key';
    Channel.TOOLTIP = 'tooltip';
    Channel.HREF = 'href';
})(Channel || (Channel = {}));
var X = Channel.X;
var Y = Channel.Y;
var X2 = Channel.X2;
var Y2 = Channel.Y2;
var LATITUDE = Channel.LATITUDE;
var LATITUDE2 = Channel.LATITUDE2;
var LONGITUDE = Channel.LONGITUDE;
var LONGITUDE2 = Channel.LONGITUDE2;
var ROW = Channel.ROW;
var COLUMN = Channel.COLUMN;
var SHAPE = Channel.SHAPE;
var SIZE = Channel.SIZE;
var COLOR = Channel.COLOR;
var FILL = Channel.FILL;
var STROKE = Channel.STROKE;
var TEXT = Channel.TEXT;
var DETAIL = Channel.DETAIL;
var KEY = Channel.KEY;
var ORDER = Channel.ORDER;
var OPACITY = Channel.OPACITY;
var TOOLTIP = Channel.TOOLTIP;
var HREF = Channel.HREF;
var GEOPOSITION_CHANNEL_INDEX = {
    longitude: 1,
    longitude2: 1,
    latitude: 1,
    latitude2: 1,
};
var GEOPOSITION_CHANNELS = flagKeys(GEOPOSITION_CHANNEL_INDEX);
var UNIT_CHANNEL_INDEX = tslib_1.__assign({
    x: 1, y: 1, x2: 1, y2: 1 }, GEOPOSITION_CHANNEL_INDEX, {
    color: 1, fill: 1, stroke: 1,
    opacity: 1, size: 1, shape: 1,
    order: 1, text: 1, detail: 1, key: 1, tooltip: 1, href: 1 });
function isColorChannel(channel) {
    return channel === 'color' || channel === 'fill' || channel === 'stroke';
}
var FACET_CHANNEL_INDEX = {
    row: 1,
    column: 1
};
var CHANNEL_INDEX = tslib_1.__assign({}, UNIT_CHANNEL_INDEX, FACET_CHANNEL_INDEX);
var CHANNELS = flagKeys(CHANNEL_INDEX);
var _o = CHANNEL_INDEX.order, _d = CHANNEL_INDEX.detail, SINGLE_DEF_CHANNEL_INDEX = tslib_1.__rest(CHANNEL_INDEX, ["order", "detail"]);
var SINGLE_DEF_CHANNELS = flagKeys(SINGLE_DEF_CHANNEL_INDEX);
function isChannel(str) {
    return !!CHANNEL_INDEX[str];
}
var UNIT_CHANNELS = flagKeys(UNIT_CHANNEL_INDEX);
var _x = UNIT_CHANNEL_INDEX.x, _y = UNIT_CHANNEL_INDEX.y,
_x2 = UNIT_CHANNEL_INDEX.x2, _y2 = UNIT_CHANNEL_INDEX.y2, _latitude = UNIT_CHANNEL_INDEX.latitude, _longitude = UNIT_CHANNEL_INDEX.longitude, _latitude2 = UNIT_CHANNEL_INDEX.latitude2, _longitude2 = UNIT_CHANNEL_INDEX.longitude2,
NONPOSITION_CHANNEL_INDEX = tslib_1.__rest(UNIT_CHANNEL_INDEX, ["x", "y", "x2", "y2", "latitude", "longitude", "latitude2", "longitude2"]);
var NONPOSITION_CHANNELS = flagKeys(NONPOSITION_CHANNEL_INDEX);
var POSITION_SCALE_CHANNEL_INDEX = { x: 1, y: 1 };
var POSITION_SCALE_CHANNELS = flagKeys(POSITION_SCALE_CHANNEL_INDEX);
var
_t = NONPOSITION_CHANNEL_INDEX.text, _tt = NONPOSITION_CHANNEL_INDEX.tooltip, _hr = NONPOSITION_CHANNEL_INDEX.href,
_dd = NONPOSITION_CHANNEL_INDEX.detail, _k = NONPOSITION_CHANNEL_INDEX.key, _oo = NONPOSITION_CHANNEL_INDEX.order, NONPOSITION_SCALE_CHANNEL_INDEX = tslib_1.__rest(NONPOSITION_CHANNEL_INDEX, ["text", "tooltip", "href", "detail", "key", "order"]);
var NONPOSITION_SCALE_CHANNELS = flagKeys(NONPOSITION_SCALE_CHANNEL_INDEX);
var SCALE_CHANNEL_INDEX = tslib_1.__assign({}, POSITION_SCALE_CHANNEL_INDEX, NONPOSITION_SCALE_CHANNEL_INDEX);
var SCALE_CHANNELS = flagKeys(SCALE_CHANNEL_INDEX);
function isScaleChannel(channel) {
    return !!SCALE_CHANNEL_INDEX[channel];
}
function supportMark(channel, mark) {
    return mark in getSupportedMark(channel);
}
function getSupportedMark(channel) {
    switch (channel) {
        case COLOR:
        case FILL:
        case STROKE:
        case DETAIL:
        case KEY:
        case TOOLTIP:
        case HREF:
        case ORDER:
        case OPACITY:
        case ROW:
        case COLUMN:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, rect: true, line: true, trail: true, area: true, text: true, geoshape: true
            };
        case X:
        case Y:
        case LATITUDE:
        case LONGITUDE:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, rect: true, line: true, trail: true, area: true, text: true
            };
        case X2:
        case Y2:
        case LATITUDE2:
        case LONGITUDE2:
            return {
                rule: true, bar: true, rect: true, area: true
            };
        case SIZE:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, text: true, line: true, trail: true
            };
        case SHAPE:
            return { point: true, geoshape: true };
        case TEXT:
            return { text: true };
    }
}
function rangeType(channel) {
    switch (channel) {
        case X:
        case Y:
        case SIZE:
        case OPACITY:
        case X2:
        case Y2:
            return 'continuous';
        case ROW:
        case COLUMN:
        case SHAPE:
        case TEXT:
        case TOOLTIP:
        case HREF:
            return 'discrete';
        case COLOR:
        case FILL:
        case STROKE:
            return 'flexible';
        case LATITUDE:
        case LONGITUDE:
        case LATITUDE2:
        case LONGITUDE2:
        case DETAIL:
        case KEY:
        case ORDER:
            return undefined;
    }
    throw new Error('rangeType not implemented for ' + channel);
}

var channel = /*#__PURE__*/Object.freeze({
  get Channel () { return Channel; },
  X: X,
  Y: Y,
  X2: X2,
  Y2: Y2,
  LATITUDE: LATITUDE,
  LATITUDE2: LATITUDE2,
  LONGITUDE: LONGITUDE,
  LONGITUDE2: LONGITUDE2,
  ROW: ROW,
  COLUMN: COLUMN,
  SHAPE: SHAPE,
  SIZE: SIZE,
  COLOR: COLOR,
  FILL: FILL,
  STROKE: STROKE,
  TEXT: TEXT,
  DETAIL: DETAIL,
  KEY: KEY,
  ORDER: ORDER,
  OPACITY: OPACITY,
  TOOLTIP: TOOLTIP,
  HREF: HREF,
  GEOPOSITION_CHANNEL_INDEX: GEOPOSITION_CHANNEL_INDEX,
  GEOPOSITION_CHANNELS: GEOPOSITION_CHANNELS,
  isColorChannel: isColorChannel,
  CHANNELS: CHANNELS,
  SINGLE_DEF_CHANNELS: SINGLE_DEF_CHANNELS,
  isChannel: isChannel,
  UNIT_CHANNELS: UNIT_CHANNELS,
  NONPOSITION_CHANNELS: NONPOSITION_CHANNELS,
  POSITION_SCALE_CHANNELS: POSITION_SCALE_CHANNELS,
  NONPOSITION_SCALE_CHANNELS: NONPOSITION_SCALE_CHANNELS,
  SCALE_CHANNELS: SCALE_CHANNELS,
  isScaleChannel: isScaleChannel,
  supportMark: supportMark,
  getSupportedMark: getSupportedMark,
  rangeType: rangeType
});

function binToString(bin) {
    if (isBoolean(bin)) {
        return 'bin';
    }
    return 'bin' + keys$1(bin).map(function (p) { return varName("_" + p + "_" + bin[p]); }).join('');
}
function isBinParams(bin) {
    return bin && !isBoolean(bin);
}
function autoMaxBins(channel) {
    switch (channel) {
        case ROW:
        case COLUMN:
        case SIZE:
        case COLOR:
        case FILL:
        case STROKE:
        case OPACITY:
        case SHAPE:
            return 6;
        default:
            return 10;
    }
}

var bin$3 = /*#__PURE__*/Object.freeze({
  binToString: binToString,
  isBinParams: isBinParams,
  autoMaxBins: autoMaxBins
});

var Mark$2;
(function (Mark) {
    Mark.AREA = 'area';
    Mark.BAR = 'bar';
    Mark.LINE = 'line';
    Mark.POINT = 'point';
    Mark.RECT = 'rect';
    Mark.RULE = 'rule';
    Mark.TEXT = 'text';
    Mark.TICK = 'tick';
    Mark.TRAIL = 'trail';
    Mark.CIRCLE = 'circle';
    Mark.SQUARE = 'square';
    Mark.GEOSHAPE = 'geoshape';
})(Mark$2 || (Mark$2 = {}));
var AREA = Mark$2.AREA;
var BAR = Mark$2.BAR;
var LINE = Mark$2.LINE;
var POINT = Mark$2.POINT;
var TEXT$1 = Mark$2.TEXT;
var TICK = Mark$2.TICK;
var TRAIL = Mark$2.TRAIL;
var RECT = Mark$2.RECT;
var RULE = Mark$2.RULE;
var GEOSHAPE = Mark$2.GEOSHAPE;
var CIRCLE = Mark$2.CIRCLE;
var SQUARE = Mark$2.SQUARE;
var MARK_INDEX = {
    area: 1,
    bar: 1,
    line: 1,
    point: 1,
    text: 1,
    tick: 1,
    trail: 1,
    rect: 1,
    geoshape: 1,
    rule: 1,
    circle: 1,
    square: 1
};
function isMark(m) {
    return !!MARK_INDEX[m];
}
function isPathMark(m) {
    return contains(['line', 'area', 'trail'], m);
}
var PRIMITIVE_MARKS = flagKeys(MARK_INDEX);
function isMarkDef(mark) {
    return mark['type'];
}
var PRIMITIVE_MARK_INDEX = toSet(PRIMITIVE_MARKS);
function isPrimitiveMark(mark) {
    var markType = isMarkDef(mark) ? mark.type : mark;
    return markType in PRIMITIVE_MARK_INDEX;
}
var STROKE_CONFIG = ['stroke', 'strokeWidth',
    'strokeDash', 'strokeDashOffset', 'strokeOpacity', 'strokeJoin', 'strokeMiterLimit'];
var FILL_CONFIG = ['fill', 'fillOpacity'];
var FILL_STROKE_CONFIG = [].concat(STROKE_CONFIG, FILL_CONFIG);
var VL_ONLY_MARK_CONFIG_PROPERTIES = ['filled', 'color'];
var VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX = {
    area: ['line', 'point'],
    bar: ['binSpacing', 'continuousBandSize', 'discreteBandSize'],
    line: ['point'],
    text: ['shortTimeLabels'],
    tick: ['bandSize', 'thickness']
};
var defaultMarkConfig = {
    color: '#4c78a8',
};
var defaultBarConfig = {
    binSpacing: 1,
    continuousBandSize: 5
};
var defaultTickConfig = {
    thickness: 1
};

var mark = /*#__PURE__*/Object.freeze({
  get Mark () { return Mark$2; },
  AREA: AREA,
  BAR: BAR,
  LINE: LINE,
  POINT: POINT,
  TEXT: TEXT$1,
  TICK: TICK,
  TRAIL: TRAIL,
  RECT: RECT,
  RULE: RULE,
  GEOSHAPE: GEOSHAPE,
  CIRCLE: CIRCLE,
  SQUARE: SQUARE,
  isMark: isMark,
  isPathMark: isPathMark,
  PRIMITIVE_MARKS: PRIMITIVE_MARKS,
  isMarkDef: isMarkDef,
  isPrimitiveMark: isPrimitiveMark,
  STROKE_CONFIG: STROKE_CONFIG,
  FILL_CONFIG: FILL_CONFIG,
  FILL_STROKE_CONFIG: FILL_STROKE_CONFIG,
  VL_ONLY_MARK_CONFIG_PROPERTIES: VL_ONLY_MARK_CONFIG_PROPERTIES,
  VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX: VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX,
  defaultMarkConfig: defaultMarkConfig,
  defaultBarConfig: defaultBarConfig,
  defaultTickConfig: defaultTickConfig
});

var main$1 = logger(Warn);
var current = main$1;
function set$3(newLogger) {
    current = newLogger;
    return current;
}
function reset$1() {
    current = main$1;
    return current;
}
function warn$1() {
    var _$$1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _$$1[_i] = arguments[_i];
    }
    current.warn.apply(current, arguments);
}
function debug$1() {
    var _$$1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        _$$1[_i] = arguments[_i];
    }
    current.debug.apply(current, arguments);
}
var message;
(function (message) {
    message.INVALID_SPEC = 'Invalid spec';
    message.FIT_NON_SINGLE = 'Autosize "fit" only works for single views and layered views.';
    message.CANNOT_FIX_RANGE_STEP_WITH_FIT = 'Cannot use a fixed value of "rangeStep" when "autosize" is "fit".';
    function cannotProjectOnChannelWithoutField(channel) {
        return "Cannot project a selection on encoding channel \"" + channel + "\", which has no field.";
    }
    message.cannotProjectOnChannelWithoutField = cannotProjectOnChannelWithoutField;
    function nearestNotSupportForContinuous(mark) {
        return "The \"nearest\" transform is not supported for " + mark + " marks.";
    }
    message.nearestNotSupportForContinuous = nearestNotSupportForContinuous;
    function selectionNotFound(name) {
        return "Cannot find a selection named \"" + name + "\"";
    }
    message.selectionNotFound = selectionNotFound;
    message.SCALE_BINDINGS_CONTINUOUS = 'Scale bindings are currently only supported for scales with unbinned, continuous domains.';
    function noSuchRepeatedValue(field$$1) {
        return "Unknown repeated value \"" + field$$1 + "\".";
    }
    message.noSuchRepeatedValue = noSuchRepeatedValue;
    message.CONCAT_CANNOT_SHARE_AXIS = 'Axes cannot be shared in concatenated views.';
    message.REPEAT_CANNOT_SHARE_AXIS = 'Axes cannot be shared in repeated views.';
    function cannotSetTitleAnchor(type) {
        return "Cannot set title \"anchor\" for a " + type + " spec";
    }
    message.cannotSetTitleAnchor = cannotSetTitleAnchor;
    function unrecognizedParse(p) {
        return "Unrecognized parse \"" + p + "\".";
    }
    message.unrecognizedParse = unrecognizedParse;
    function differentParse(field$$1, local, ancestor) {
        return "An ancestor parsed field \"" + field$$1 + "\" as " + ancestor + " but a child wants to parse the field as " + local + ".";
    }
    message.differentParse = differentParse;
    function invalidTransformIgnored(transform) {
        return "Ignoring an invalid transform: " + stringify$1(transform) + ".";
    }
    message.invalidTransformIgnored = invalidTransformIgnored;
    message.NO_FIELDS_NEEDS_AS = 'If "from.fields" is not specified, "as" has to be a string that specifies the key to be used for the data from the secondary source.';
    function encodingOverridden(channels) {
        return "Layer's shared " + channels.join(',') + " channel " + (channels.length === 1 ? 'is' : 'are') + " overriden";
    }
    message.encodingOverridden = encodingOverridden;
    function projectionOverridden(opt) {
        var parentProjection = opt.parentProjection, projection = opt.projection;
        return "Layer's shared projection " + stringify$1(parentProjection) + " is overridden by a child projection " + stringify$1(projection) + ".";
    }
    message.projectionOverridden = projectionOverridden;
    function primitiveChannelDef(channel, type, value) {
        return "Channel " + channel + " is a " + type + ". Converted to {value: " + stringify$1(value) + "}.";
    }
    message.primitiveChannelDef = primitiveChannelDef;
    function invalidFieldType(type) {
        return "Invalid field type \"" + type + "\"";
    }
    message.invalidFieldType = invalidFieldType;
    function nonZeroScaleUsedWithLengthMark(mark, channel, opt) {
        var scaleText = opt.scaleType ? opt.scaleType + " scale" :
            opt.zeroFalse ? 'scale with zero=false' :
                'scale with custom domain that excludes zero';
        return "A " + scaleText + " is used to encode " + mark + "'s " + channel + ". This can be misleading as the " + (channel === 'x' ? 'width' : 'height') + " of the " + mark + " can be arbitrary based on the scale domain. You may want to use point mark instead.";
    }
    message.nonZeroScaleUsedWithLengthMark = nonZeroScaleUsedWithLengthMark;
    function invalidFieldTypeForCountAggregate(type, aggregate) {
        return "Invalid field type \"" + type + "\" for aggregate: \"" + aggregate + "\", using \"quantitative\" instead.";
    }
    message.invalidFieldTypeForCountAggregate = invalidFieldTypeForCountAggregate;
    function invalidAggregate(aggregate) {
        return "Invalid aggregation operator \"" + aggregate + "\"";
    }
    message.invalidAggregate = invalidAggregate;
    function emptyOrInvalidFieldType(type, channel, newType) {
        return "Invalid field type \"" + type + "\" for channel \"" + channel + "\", using \"" + newType + "\" instead.";
    }
    message.emptyOrInvalidFieldType = emptyOrInvalidFieldType;
    function droppingColor(type, opt) {
        var fill = opt.fill, stroke = opt.stroke;
        return "Dropping color " + type + " as the plot also has " + (fill && stroke ? 'fill and stroke' : fill ? 'fill' : 'stroke');
    }
    message.droppingColor = droppingColor;
    function emptyFieldDef(fieldDef, channel) {
        return "Dropping " + stringify$1(fieldDef) + " from channel \"" + channel + "\" since it does not contain data field or value.";
    }
    message.emptyFieldDef = emptyFieldDef;
    function latLongDeprecated(channel, type, newChannel) {
        return channel + "-encoding with type " + type + " is deprecated. Replacing with " + newChannel + "-encoding.";
    }
    message.latLongDeprecated = latLongDeprecated;
    message.LINE_WITH_VARYING_SIZE = 'Line marks cannot encode size with a non-groupby field. You may want to use trail marks instead.';
    function incompatibleChannel(channel, markOrFacet, when) {
        return channel + " dropped as it is incompatible with \"" + markOrFacet + "\"" + (when ? " when " + when : '') + ".";
    }
    message.incompatibleChannel = incompatibleChannel;
    function invalidEncodingChannel(channel) {
        return channel + "-encoding is dropped as " + channel + " is not a valid encoding channel.";
    }
    message.invalidEncodingChannel = invalidEncodingChannel;
    function facetChannelShouldBeDiscrete(channel) {
        return channel + " encoding should be discrete (ordinal / nominal / binned).";
    }
    message.facetChannelShouldBeDiscrete = facetChannelShouldBeDiscrete;
    function discreteChannelCannotEncode(channel, type) {
        return "Using discrete channel \"" + channel + "\" to encode \"" + type + "\" field can be misleading as it does not encode " + (type === 'ordinal' ? 'order' : 'magnitude') + ".";
    }
    message.discreteChannelCannotEncode = discreteChannelCannotEncode;
    message.BAR_WITH_POINT_SCALE_AND_RANGESTEP_NULL = 'Bar mark should not be used with point scale when rangeStep is null. Please use band scale instead.';
    function lineWithRange(hasX2, hasY2) {
        var channels = hasX2 && hasY2 ? 'x2 and y2' : hasX2 ? 'x2' : 'y2';
        return "Line mark is for continuous lines and thus cannot be used with " + channels + ". We will use the rule mark (line segments) instead.";
    }
    message.lineWithRange = lineWithRange;
    function orientOverridden(original, actual) {
        return "Specified orient \"" + original + "\" overridden with \"" + actual + "\"";
    }
    message.orientOverridden = orientOverridden;
    message.CANNOT_UNION_CUSTOM_DOMAIN_WITH_FIELD_DOMAIN = 'custom domain scale cannot be unioned with default field-based domain';
    function cannotUseScalePropertyWithNonColor(prop) {
        return "Cannot use the scale property \"" + prop + "\" with non-color channel.";
    }
    message.cannotUseScalePropertyWithNonColor = cannotUseScalePropertyWithNonColor;
    function unaggregateDomainHasNoEffectForRawField(fieldDef) {
        return "Using unaggregated domain with raw field has no effect (" + stringify$1(fieldDef) + ").";
    }
    message.unaggregateDomainHasNoEffectForRawField = unaggregateDomainHasNoEffectForRawField;
    function unaggregateDomainWithNonSharedDomainOp(aggregate) {
        return "Unaggregated domain not applicable for \"" + aggregate + "\" since it produces values outside the origin domain of the source data.";
    }
    message.unaggregateDomainWithNonSharedDomainOp = unaggregateDomainWithNonSharedDomainOp;
    function unaggregatedDomainWithLogScale(fieldDef) {
        return "Unaggregated domain is currently unsupported for log scale (" + stringify$1(fieldDef) + ").";
    }
    message.unaggregatedDomainWithLogScale = unaggregatedDomainWithLogScale;
    function cannotApplySizeToNonOrientedMark(mark) {
        return "Cannot apply size to non-oriented mark \"" + mark + "\".";
    }
    message.cannotApplySizeToNonOrientedMark = cannotApplySizeToNonOrientedMark;
    function rangeStepDropped(channel) {
        return "rangeStep for \"" + channel + "\" is dropped as top-level " + (channel === 'x' ? 'width' : 'height') + " is provided.";
    }
    message.rangeStepDropped = rangeStepDropped;
    function scaleTypeNotWorkWithChannel(channel, scaleType, defaultScaleType) {
        return "Channel \"" + channel + "\" does not work with \"" + scaleType + "\" scale. We are using \"" + defaultScaleType + "\" scale instead.";
    }
    message.scaleTypeNotWorkWithChannel = scaleTypeNotWorkWithChannel;
    function scaleTypeNotWorkWithFieldDef(scaleType, defaultScaleType) {
        return "FieldDef does not work with \"" + scaleType + "\" scale. We are using \"" + defaultScaleType + "\" scale instead.";
    }
    message.scaleTypeNotWorkWithFieldDef = scaleTypeNotWorkWithFieldDef;
    function scalePropertyNotWorkWithScaleType(scaleType, propName, channel) {
        return channel + "-scale's \"" + propName + "\" is dropped as it does not work with " + scaleType + " scale.";
    }
    message.scalePropertyNotWorkWithScaleType = scalePropertyNotWorkWithScaleType;
    function scaleTypeNotWorkWithMark(mark, scaleType) {
        return "Scale type \"" + scaleType + "\" does not work with mark \"" + mark + "\".";
    }
    message.scaleTypeNotWorkWithMark = scaleTypeNotWorkWithMark;
    function mergeConflictingProperty(property, propertyOf, v1, v2) {
        return "Conflicting " + propertyOf.toString() + " property \"" + property.toString() + "\" (" + stringify$1(v1) + " and " + stringify$1(v2) + ").  Using " + stringify$1(v1) + ".";
    }
    message.mergeConflictingProperty = mergeConflictingProperty;
    function independentScaleMeansIndependentGuide(channel) {
        return "Setting the scale to be independent for \"" + channel + "\" means we also have to set the guide (axis or legend) to be independent.";
    }
    message.independentScaleMeansIndependentGuide = independentScaleMeansIndependentGuide;
    function domainSortDropped(sort) {
        return "Dropping sort property " + stringify$1(sort) + " as unioned domains only support boolean or op 'count'.";
    }
    message.domainSortDropped = domainSortDropped;
    message.UNABLE_TO_MERGE_DOMAINS = 'Unable to merge domains';
    message.MORE_THAN_ONE_SORT = 'Domains that should be unioned has conflicting sort properties. Sort will be set to true.';
    message.INVALID_CHANNEL_FOR_AXIS = 'Invalid channel for axis.';
    function cannotStackRangedMark(channel) {
        return "Cannot stack \"" + channel + "\" if there is already \"" + channel + "2\"";
    }
    message.cannotStackRangedMark = cannotStackRangedMark;
    function cannotStackNonLinearScale(scaleType) {
        return "Cannot stack non-linear scale (" + scaleType + ")";
    }
    message.cannotStackNonLinearScale = cannotStackNonLinearScale;
    function stackNonSummativeAggregate(aggregate) {
        return "Stacking is applied even though the aggregate function is non-summative (\"" + aggregate + "\")";
    }
    message.stackNonSummativeAggregate = stackNonSummativeAggregate;
    function invalidTimeUnit(unitName, value) {
        return "Invalid " + unitName + ": " + stringify$1(value);
    }
    message.invalidTimeUnit = invalidTimeUnit;
    function dayReplacedWithDate(fullTimeUnit) {
        return "Time unit \"" + fullTimeUnit + "\" is not supported. We are replacing it with " + fullTimeUnit.replace('day', 'date') + ".";
    }
    message.dayReplacedWithDate = dayReplacedWithDate;
    function droppedDay(d) {
        return "Dropping day from datetime " + stringify$1(d) + " as day cannot be combined with other units.";
    }
    message.droppedDay = droppedDay;
})(message || (message = {}));

var SUNDAY_YEAR = 2006;
function isDateTime(o) {
    return !!o && (!!o.year || !!o.quarter || !!o.month || !!o.date || !!o.day ||
        !!o.hours || !!o.minutes || !!o.seconds || !!o.milliseconds);
}
var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
var SHORT_MONTHS = MONTHS.map(function (m) { return m.substr(0, 3); });
var DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
var SHORT_DAYS = DAYS.map(function (d) { return d.substr(0, 3); });
function normalizeQuarter(q) {
    if (isNumber(q)) {
        if (q > 4) {
            warn$1(message.invalidTimeUnit('quarter', q));
        }
        return (q - 1) + '';
    }
    else {
        throw new Error(message.invalidTimeUnit('quarter', q));
    }
}
function normalizeMonth(m) {
    if (isNumber(m)) {
        return (m - 1) + '';
    }
    else {
        var lowerM = m.toLowerCase();
        var monthIndex = MONTHS.indexOf(lowerM);
        if (monthIndex !== -1) {
            return monthIndex + '';
        }
        var shortM = lowerM.substr(0, 3);
        var shortMonthIndex = SHORT_MONTHS.indexOf(shortM);
        if (shortMonthIndex !== -1) {
            return shortMonthIndex + '';
        }
        throw new Error(message.invalidTimeUnit('month', m));
    }
}
function normalizeDay(d) {
    if (isNumber(d)) {
        return (d % 7) + '';
    }
    else {
        var lowerD = d.toLowerCase();
        var dayIndex = DAYS.indexOf(lowerD);
        if (dayIndex !== -1) {
            return dayIndex + '';
        }
        var shortD = lowerD.substr(0, 3);
        var shortDayIndex = SHORT_DAYS.indexOf(shortD);
        if (shortDayIndex !== -1) {
            return shortDayIndex + '';
        }
        throw new Error(message.invalidTimeUnit('day', d));
    }
}
function dateTimeExpr(d, normalize) {
    if (normalize === void 0) { normalize = false; }
    var units = [];
    if (normalize && d.day !== undefined) {
        if (keys$1(d).length > 1) {
            warn$1(message.droppedDay(d));
            d = duplicate(d);
            delete d.day;
        }
    }
    if (d.year !== undefined) {
        units.push(d.year);
    }
    else if (d.day !== undefined) {
        units.push(SUNDAY_YEAR);
    }
    else {
        units.push(0);
    }
    if (d.month !== undefined) {
        var month = normalize ? normalizeMonth(d.month) : d.month;
        units.push(month);
    }
    else if (d.quarter !== undefined) {
        var quarter$$1 = normalize ? normalizeQuarter(d.quarter) : d.quarter;
        units.push(quarter$$1 + '*3');
    }
    else {
        units.push(0);
    }
    if (d.date !== undefined) {
        units.push(d.date);
    }
    else if (d.day !== undefined) {
        var day = normalize ? normalizeDay(d.day) : d.day;
        units.push(day + '+1');
    }
    else {
        units.push(1);
    }
    for (var _i = 0, _a = ['hours', 'minutes', 'seconds', 'milliseconds']; _i < _a.length; _i++) {
        var timeUnit = _a[_i];
        if (d[timeUnit] !== undefined) {
            units.push(d[timeUnit]);
        }
        else {
            units.push(0);
        }
    }
    if (d.utc) {
        return "utc(" + units.join(', ') + ")";
    }
    else {
        return "datetime(" + units.join(', ') + ")";
    }
}

var datetime = /*#__PURE__*/Object.freeze({
  isDateTime: isDateTime,
  MONTHS: MONTHS,
  SHORT_MONTHS: SHORT_MONTHS,
  DAYS: DAYS,
  SHORT_DAYS: SHORT_DAYS,
  dateTimeExpr: dateTimeExpr
});

var TimeUnit;
(function (TimeUnit) {
    TimeUnit.YEAR = 'year';
    TimeUnit.MONTH = 'month';
    TimeUnit.DAY = 'day';
    TimeUnit.DATE = 'date';
    TimeUnit.HOURS = 'hours';
    TimeUnit.MINUTES = 'minutes';
    TimeUnit.SECONDS = 'seconds';
    TimeUnit.MILLISECONDS = 'milliseconds';
    TimeUnit.YEARMONTH = 'yearmonth';
    TimeUnit.YEARMONTHDATE = 'yearmonthdate';
    TimeUnit.YEARMONTHDATEHOURS = 'yearmonthdatehours';
    TimeUnit.YEARMONTHDATEHOURSMINUTES = 'yearmonthdatehoursminutes';
    TimeUnit.YEARMONTHDATEHOURSMINUTESSECONDS = 'yearmonthdatehoursminutesseconds';
    TimeUnit.MONTHDATE = 'monthdate';
    TimeUnit.HOURSMINUTES = 'hoursminutes';
    TimeUnit.HOURSMINUTESSECONDS = 'hoursminutesseconds';
    TimeUnit.MINUTESSECONDS = 'minutesseconds';
    TimeUnit.SECONDSMILLISECONDS = 'secondsmilliseconds';
    TimeUnit.QUARTER = 'quarter';
    TimeUnit.YEARQUARTER = 'yearquarter';
    TimeUnit.QUARTERMONTH = 'quartermonth';
    TimeUnit.YEARQUARTERMONTH = 'yearquartermonth';
    TimeUnit.UTCYEAR = 'utcyear';
    TimeUnit.UTCMONTH = 'utcmonth';
    TimeUnit.UTCDAY = 'utcday';
    TimeUnit.UTCDATE = 'utcdate';
    TimeUnit.UTCHOURS = 'utchours';
    TimeUnit.UTCMINUTES = 'utcminutes';
    TimeUnit.UTCSECONDS = 'utcseconds';
    TimeUnit.UTCMILLISECONDS = 'utcmilliseconds';
    TimeUnit.UTCYEARMONTH = 'utcyearmonth';
    TimeUnit.UTCYEARMONTHDATE = 'utcyearmonthdate';
    TimeUnit.UTCYEARMONTHDATEHOURS = 'utcyearmonthdatehours';
    TimeUnit.UTCYEARMONTHDATEHOURSMINUTES = 'utcyearmonthdatehoursminutes';
    TimeUnit.UTCYEARMONTHDATEHOURSMINUTESSECONDS = 'utcyearmonthdatehoursminutesseconds';
    TimeUnit.UTCMONTHDATE = 'utcmonthdate';
    TimeUnit.UTCHOURSMINUTES = 'utchoursminutes';
    TimeUnit.UTCHOURSMINUTESSECONDS = 'utchoursminutesseconds';
    TimeUnit.UTCMINUTESSECONDS = 'utcminutesseconds';
    TimeUnit.UTCSECONDSMILLISECONDS = 'utcsecondsmilliseconds';
    TimeUnit.UTCQUARTER = 'utcquarter';
    TimeUnit.UTCYEARQUARTER = 'utcyearquarter';
    TimeUnit.UTCQUARTERMONTH = 'utcquartermonth';
    TimeUnit.UTCYEARQUARTERMONTH = 'utcyearquartermonth';
})(TimeUnit || (TimeUnit = {}));
var LOCAL_SINGLE_TIMEUNIT_INDEX = {
    year: 1,
    quarter: 1,
    month: 1,
    day: 1,
    date: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    milliseconds: 1
};
var TIMEUNIT_PARTS = flagKeys(LOCAL_SINGLE_TIMEUNIT_INDEX);
function isLocalSingleTimeUnit(timeUnit) {
    return !!LOCAL_SINGLE_TIMEUNIT_INDEX[timeUnit];
}
var UTC_SINGLE_TIMEUNIT_INDEX = {
    utcyear: 1,
    utcquarter: 1,
    utcmonth: 1,
    utcday: 1,
    utcdate: 1,
    utchours: 1,
    utcminutes: 1,
    utcseconds: 1,
    utcmilliseconds: 1
};
function isUtcSingleTimeUnit(timeUnit) {
    return !!UTC_SINGLE_TIMEUNIT_INDEX[timeUnit];
}
var LOCAL_MULTI_TIMEUNIT_INDEX = {
    yearquarter: 1,
    yearquartermonth: 1,
    yearmonth: 1,
    yearmonthdate: 1,
    yearmonthdatehours: 1,
    yearmonthdatehoursminutes: 1,
    yearmonthdatehoursminutesseconds: 1,
    quartermonth: 1,
    monthdate: 1,
    hoursminutes: 1,
    hoursminutesseconds: 1,
    minutesseconds: 1,
    secondsmilliseconds: 1
};
var UTC_MULTI_TIMEUNIT_INDEX = {
    utcyearquarter: 1,
    utcyearquartermonth: 1,
    utcyearmonth: 1,
    utcyearmonthdate: 1,
    utcyearmonthdatehours: 1,
    utcyearmonthdatehoursminutes: 1,
    utcyearmonthdatehoursminutesseconds: 1,
    utcquartermonth: 1,
    utcmonthdate: 1,
    utchoursminutes: 1,
    utchoursminutesseconds: 1,
    utcminutesseconds: 1,
    utcsecondsmilliseconds: 1
};
var UTC_TIMEUNIT_INDEX = tslib_1.__assign({}, UTC_SINGLE_TIMEUNIT_INDEX, UTC_MULTI_TIMEUNIT_INDEX);
function isUTCTimeUnit(t) {
    return !!UTC_TIMEUNIT_INDEX[t];
}
function getLocalTimeUnit(t) {
    return t.substr(3);
}
var TIMEUNIT_INDEX = tslib_1.__assign({}, LOCAL_SINGLE_TIMEUNIT_INDEX, UTC_SINGLE_TIMEUNIT_INDEX, LOCAL_MULTI_TIMEUNIT_INDEX, UTC_MULTI_TIMEUNIT_INDEX);
var TIMEUNITS = flagKeys(TIMEUNIT_INDEX);
function isTimeUnit(t) {
    return !!TIMEUNIT_INDEX[t];
}
var SET_DATE_METHOD = {
    year: 'setFullYear',
    month: 'setMonth',
    date: 'setDate',
    hours: 'setHours',
    minutes: 'setMinutes',
    seconds: 'setSeconds',
    milliseconds: 'setMilliseconds',
    quarter: null,
    day: null,
};
function convert(unit, date) {
    var isUTC = isUTCTimeUnit(unit);
    var result = isUTC ?
        new Date(Date.UTC(0, 0, 1, 0, 0, 0, 0)) :
        new Date(0, 0, 1, 0, 0, 0, 0);
    for (var _i = 0, TIMEUNIT_PARTS_1 = TIMEUNIT_PARTS; _i < TIMEUNIT_PARTS_1.length; _i++) {
        var timeUnitPart = TIMEUNIT_PARTS_1[_i];
        if (containsTimeUnit(unit, timeUnitPart)) {
            switch (timeUnitPart) {
                case TimeUnit.DAY:
                    throw new Error('Cannot convert to TimeUnits containing \'day\'');
                case TimeUnit.QUARTER: {
                    var _a = dateMethods('month', isUTC), getDateMethod_1 = _a.getDateMethod, setDateMethod_1 = _a.setDateMethod;
                    result[setDateMethod_1]((Math.floor(date[getDateMethod_1]() / 3)) * 3);
                    break;
                }
                default:
                    var _b = dateMethods(timeUnitPart, isUTC), getDateMethod = _b.getDateMethod, setDateMethod = _b.setDateMethod;
                    result[setDateMethod](date[getDateMethod]());
            }
        }
    }
    return result;
}
function dateMethods(singleUnit, isUtc) {
    var rawSetDateMethod = SET_DATE_METHOD[singleUnit];
    var setDateMethod = isUtc ? 'setUTC' + rawSetDateMethod.substr(3) : rawSetDateMethod;
    var getDateMethod = 'get' + (isUtc ? 'UTC' : '') + rawSetDateMethod.substr(3);
    return { setDateMethod: setDateMethod, getDateMethod: getDateMethod };
}
function getTimeUnitParts(timeUnit) {
    return TIMEUNIT_PARTS.reduce(function (parts, part) {
        if (containsTimeUnit(timeUnit, part)) {
            return parts.concat(part);
        }
        return parts;
    }, []);
}
function containsTimeUnit(fullTimeUnit, timeUnit) {
    var index = fullTimeUnit.indexOf(timeUnit);
    return index > -1 &&
        (timeUnit !== TimeUnit.SECONDS ||
            index === 0 ||
            fullTimeUnit.charAt(index - 1) !== 'i'
        );
}
function fieldExpr(fullTimeUnit, field) {
    var fieldRef = accessPathWithDatum(field);
    var utc = isUTCTimeUnit(fullTimeUnit) ? 'utc' : '';
    function func(timeUnit) {
        if (timeUnit === TimeUnit.QUARTER) {
            return "(" + utc + "quarter(" + fieldRef + ")-1)";
        }
        else {
            return "" + utc + timeUnit + "(" + fieldRef + ")";
        }
    }
    var d = TIMEUNIT_PARTS.reduce(function (dateExpr, tu) {
        if (containsTimeUnit(fullTimeUnit, tu)) {
            dateExpr[tu] = func(tu);
        }
        return dateExpr;
    }, {});
    return dateTimeExpr(d);
}
function formatExpression(timeUnit, field, shortTimeLabels, isUTCScale) {
    if (!timeUnit) {
        return undefined;
    }
    var dateComponents = [];
    var expression = '';
    var hasYear = containsTimeUnit(timeUnit, TimeUnit.YEAR);
    if (containsTimeUnit(timeUnit, TimeUnit.QUARTER)) {
        expression = "'Q' + quarter(" + field + ")";
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MONTH)) {
        dateComponents.push(shortTimeLabels !== false ? '%b' : '%B');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.DAY)) {
        dateComponents.push(shortTimeLabels ? '%a' : '%A');
    }
    else if (containsTimeUnit(timeUnit, TimeUnit.DATE)) {
        dateComponents.push('%d' + (hasYear ? ',' : ''));
    }
    if (hasYear) {
        dateComponents.push(shortTimeLabels ? '%y' : '%Y');
    }
    var timeComponents = [];
    if (containsTimeUnit(timeUnit, TimeUnit.HOURS)) {
        timeComponents.push('%H');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MINUTES)) {
        timeComponents.push('%M');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.SECONDS)) {
        timeComponents.push('%S');
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MILLISECONDS)) {
        timeComponents.push('%L');
    }
    var dateTimeComponents = [];
    if (dateComponents.length > 0) {
        dateTimeComponents.push(dateComponents.join(' '));
    }
    if (timeComponents.length > 0) {
        dateTimeComponents.push(timeComponents.join(':'));
    }
    if (dateTimeComponents.length > 0) {
        if (expression) {
            expression += " + ' ' + ";
        }
        if (isUTCScale) {
            expression += "utcFormat(" + field + ", '" + dateTimeComponents.join(' ') + "')";
        }
        else {
            expression += "timeFormat(" + field + ", '" + dateTimeComponents.join(' ') + "')";
        }
    }
    return expression || undefined;
}
function normalizeTimeUnit(timeUnit) {
    if (timeUnit !== 'day' && timeUnit.indexOf('day') >= 0) {
        warn$1(message.dayReplacedWithDate(timeUnit));
        return timeUnit.replace('day', 'date');
    }
    return timeUnit;
}

var timeunit = /*#__PURE__*/Object.freeze({
  get TimeUnit () { return TimeUnit; },
  TIMEUNIT_PARTS: TIMEUNIT_PARTS,
  isLocalSingleTimeUnit: isLocalSingleTimeUnit,
  isUtcSingleTimeUnit: isUtcSingleTimeUnit,
  isUTCTimeUnit: isUTCTimeUnit,
  getLocalTimeUnit: getLocalTimeUnit,
  TIMEUNITS: TIMEUNITS,
  isTimeUnit: isTimeUnit,
  convert: convert,
  getTimeUnitParts: getTimeUnitParts,
  containsTimeUnit: containsTimeUnit,
  fieldExpr: fieldExpr,
  formatExpression: formatExpression,
  normalizeTimeUnit: normalizeTimeUnit
});

var Type;
(function (Type) {
    Type.QUANTITATIVE = 'quantitative';
    Type.ORDINAL = 'ordinal';
    Type.TEMPORAL = 'temporal';
    Type.NOMINAL = 'nominal';
    Type.LATITUDE = 'latitude';
    Type.LONGITUDE = 'longitude';
    Type.GEOJSON = 'geojson';
})(Type || (Type = {}));
var TYPE_INDEX = {
    quantitative: 1,
    ordinal: 1,
    temporal: 1,
    nominal: 1,
    latitude: 1,
    longitude: 1,
    geojson: 1
};
function isType(t) {
    return !!TYPE_INDEX[t];
}
var QUANTITATIVE = Type.QUANTITATIVE;
var ORDINAL = Type.ORDINAL;
var TEMPORAL = Type.TEMPORAL;
var NOMINAL = Type.NOMINAL;
var GEOJSON = Type.GEOJSON;
function getFullName(type) {
    if (type) {
        type = type.toLowerCase();
        switch (type) {
            case 'q':
            case QUANTITATIVE:
                return 'quantitative';
            case 't':
            case TEMPORAL:
                return 'temporal';
            case 'o':
            case ORDINAL:
                return 'ordinal';
            case 'n':
            case NOMINAL:
                return 'nominal';
            case Type.LATITUDE:
                return 'latitude';
            case Type.LONGITUDE:
                return 'longitude';
            case GEOJSON:
                return 'geojson';
        }
    }
    return undefined;
}

var type$1 = /*#__PURE__*/Object.freeze({
  get Type () { return Type; },
  TYPE_INDEX: TYPE_INDEX,
  isType: isType,
  QUANTITATIVE: QUANTITATIVE,
  ORDINAL: ORDINAL,
  TEMPORAL: TEMPORAL,
  NOMINAL: NOMINAL,
  GEOJSON: GEOJSON,
  getFullName: getFullName
});

function isConditionalSelection(c) {
    return c['selection'];
}
function isRepeatRef(field$$1) {
    return field$$1 && !isString(field$$1) && 'repeat' in field$$1;
}
function toFieldDefBase(fieldDef) {
    var field$$1 = fieldDef.field, timeUnit = fieldDef.timeUnit, bin = fieldDef.bin, aggregate = fieldDef.aggregate;
    return tslib_1.__assign({}, (timeUnit ? { timeUnit: timeUnit } : {}), (bin ? { bin: bin } : {}), (aggregate ? { aggregate: aggregate } : {}), { field: field$$1 });
}
function isConditionalDef(channelDef) {
    return !!channelDef && !!channelDef.condition;
}
function hasConditionalFieldDef(channelDef) {
    return !!channelDef && !!channelDef.condition && !isArray(channelDef.condition) && isFieldDef(channelDef.condition);
}
function hasConditionalValueDef(channelDef) {
    return !!channelDef && !!channelDef.condition && (isArray(channelDef.condition) || isValueDef(channelDef.condition));
}
function isFieldDef(channelDef) {
    return !!channelDef && (!!channelDef['field'] || channelDef['aggregate'] === 'count');
}
function isStringFieldDef(fieldDef) {
    return isFieldDef(fieldDef) && isString(fieldDef.field);
}
function isValueDef(channelDef) {
    return channelDef && 'value' in channelDef && channelDef['value'] !== undefined;
}
function isScaleFieldDef(channelDef) {
    return !!channelDef && (!!channelDef['scale'] || !!channelDef['sort']);
}
function isOpFieldDef(fieldDef) {
    return !!fieldDef['op'];
}
function vgField(fieldDef, opt) {
    if (opt === void 0) { opt = {}; }
    var field$$1 = fieldDef.field;
    var prefix = opt.prefix;
    var suffix = opt.suffix;
    if (isCount(fieldDef)) {
        field$$1 = 'count_*';
    }
    else {
        var fn = undefined;
        if (!opt.nofn) {
            if (isOpFieldDef(fieldDef)) {
                fn = fieldDef.op;
            }
            else if (fieldDef.bin) {
                fn = binToString(fieldDef.bin);
                suffix = opt.binSuffix || '';
            }
            else if (fieldDef.aggregate) {
                fn = String(fieldDef.aggregate);
            }
            else if (fieldDef.timeUnit) {
                fn = String(fieldDef.timeUnit);
            }
        }
        if (fn) {
            field$$1 = field$$1 ? fn + "_" + field$$1 : fn;
        }
    }
    if (suffix) {
        field$$1 = field$$1 + "_" + suffix;
    }
    if (prefix) {
        field$$1 = prefix + "_" + field$$1;
    }
    if (opt.expr) {
        return flatAccessWithDatum(field$$1, opt.expr);
    }
    else {
        return replacePathInField(field$$1);
    }
}
function isDiscrete(fieldDef) {
    switch (fieldDef.type) {
        case 'nominal':
        case 'ordinal':
        case 'geojson':
            return true;
        case 'quantitative':
            return !!fieldDef.bin;
        case 'latitude':
        case 'longitude':
        case 'temporal':
            return false;
    }
    throw new Error(message.invalidFieldType(fieldDef.type));
}
function isContinuous(fieldDef) {
    return !isDiscrete(fieldDef);
}
function isCount(fieldDef) {
    return fieldDef.aggregate === 'count';
}
function verbalTitleFormatter(fieldDef, config) {
    var field$$1 = fieldDef.field, bin = fieldDef.bin, timeUnit = fieldDef.timeUnit, aggregate = fieldDef.aggregate;
    if (aggregate === 'count') {
        return config.countTitle;
    }
    else if (bin) {
        return field$$1 + " (binned)";
    }
    else if (timeUnit) {
        var units = getTimeUnitParts(timeUnit).join('-');
        return field$$1 + " (" + units + ")";
    }
    else if (aggregate) {
        return titlecase(aggregate) + " of " + field$$1;
    }
    return field$$1;
}
function functionalTitleFormatter(fieldDef, config) {
    var fn = fieldDef.aggregate || fieldDef.timeUnit || (fieldDef.bin && 'bin');
    if (fn) {
        return fn.toUpperCase() + '(' + fieldDef.field + ')';
    }
    else {
        return fieldDef.field;
    }
}
var defaultTitleFormatter = function (fieldDef, config) {
    switch (config.fieldTitle) {
        case 'plain':
            return fieldDef.field;
        case 'functional':
            return functionalTitleFormatter(fieldDef, config);
        default:
            return verbalTitleFormatter(fieldDef, config);
    }
};
var titleFormatter = defaultTitleFormatter;
function setTitleFormatter(formatter) {
    titleFormatter = formatter;
}
function resetTitleFormatter() {
    setTitleFormatter(defaultTitleFormatter);
}
function title(fieldDef, config) {
    return titleFormatter(fieldDef, config);
}
function defaultType(fieldDef, channel) {
    if (fieldDef.timeUnit) {
        return 'temporal';
    }
    if (fieldDef.bin) {
        return 'quantitative';
    }
    switch (rangeType(channel)) {
        case 'continuous':
            return 'quantitative';
        case 'discrete':
            return 'nominal';
        case 'flexible':
            return 'nominal';
        default:
            return 'quantitative';
    }
}
function getFieldDef(channelDef) {
    if (isFieldDef(channelDef)) {
        return channelDef;
    }
    else if (hasConditionalFieldDef(channelDef)) {
        return channelDef.condition;
    }
    return undefined;
}
function normalize(channelDef, channel) {
    if (isString(channelDef) || isNumber(channelDef) || isBoolean(channelDef)) {
        var primitiveType = isString(channelDef) ? 'string' :
            isNumber(channelDef) ? 'number' : 'boolean';
        warn$1(message.primitiveChannelDef(channel, primitiveType, channelDef));
        return { value: channelDef };
    }
    if (isFieldDef(channelDef)) {
        return normalizeFieldDef(channelDef, channel);
    }
    else if (hasConditionalFieldDef(channelDef)) {
        return tslib_1.__assign({}, channelDef, {
            condition: normalizeFieldDef(channelDef.condition, channel) });
    }
    return channelDef;
}
function normalizeFieldDef(fieldDef, channel) {
    if (fieldDef.aggregate && !isAggregateOp(fieldDef.aggregate)) {
        var aggregate = fieldDef.aggregate, fieldDefWithoutAggregate = tslib_1.__rest(fieldDef, ["aggregate"]);
        warn$1(message.invalidAggregate(fieldDef.aggregate));
        fieldDef = fieldDefWithoutAggregate;
    }
    if (fieldDef.timeUnit) {
        fieldDef = tslib_1.__assign({}, fieldDef, { timeUnit: normalizeTimeUnit(fieldDef.timeUnit) });
    }
    if (fieldDef.bin) {
        fieldDef = tslib_1.__assign({}, fieldDef, { bin: normalizeBin(fieldDef.bin, channel) });
    }
    if (fieldDef.type) {
        var fullType = getFullName(fieldDef.type);
        if (fieldDef.type !== fullType) {
            fieldDef = tslib_1.__assign({}, fieldDef, { type: fullType });
        }
        if (fieldDef.type !== 'quantitative') {
            if (isCountingAggregateOp(fieldDef.aggregate)) {
                warn$1(message.invalidFieldTypeForCountAggregate(fieldDef.type, fieldDef.aggregate));
                fieldDef = tslib_1.__assign({}, fieldDef, { type: 'quantitative' });
            }
        }
    }
    else {
        var newType = defaultType(fieldDef, channel);
        warn$1(message.emptyOrInvalidFieldType(fieldDef.type, channel, newType));
        fieldDef = tslib_1.__assign({}, fieldDef, { type: newType });
    }
    var _a = channelCompatibility(fieldDef, channel), compatible = _a.compatible, warning = _a.warning;
    if (!compatible) {
        warn$1(warning);
    }
    return fieldDef;
}
function normalizeBin(bin, channel) {
    if (isBoolean(bin)) {
        return { maxbins: autoMaxBins(channel) };
    }
    else if (!bin.maxbins && !bin.step) {
        return tslib_1.__assign({}, bin, { maxbins: autoMaxBins(channel) });
    }
    else {
        return bin;
    }
}
var COMPATIBLE = { compatible: true };
function channelCompatibility(fieldDef, channel) {
    var type = fieldDef.type;
    switch (channel) {
        case 'row':
        case 'column':
            if (isContinuous(fieldDef)) {
                return {
                    compatible: false,
                    warning: message.facetChannelShouldBeDiscrete(channel)
                };
            }
            return COMPATIBLE;
        case 'x':
        case 'y':
        case 'color':
        case 'fill':
        case 'stroke':
        case 'text':
        case 'detail':
        case 'key':
        case 'tooltip':
        case 'href':
            return COMPATIBLE;
        case 'longitude':
        case 'longitude2':
        case 'latitude':
        case 'latitude2':
            if (type !== QUANTITATIVE) {
                return {
                    compatible: false,
                    warning: "Channel " + channel + " should be used with a quantitative field only, not " + fieldDef.type + " field."
                };
            }
            return COMPATIBLE;
        case 'opacity':
        case 'size':
        case 'x2':
        case 'y2':
            if ((type === 'nominal' && !fieldDef['sort']) || type === 'geojson') {
                return {
                    compatible: false,
                    warning: "Channel " + channel + " should not be used with an unsorted discrete field."
                };
            }
            return COMPATIBLE;
        case 'shape':
            if (fieldDef.type !== 'nominal' && fieldDef.type !== 'geojson') {
                return {
                    compatible: false,
                    warning: 'Shape channel should be used with only either nominal or geojson data'
                };
            }
            return COMPATIBLE;
        case 'order':
            if (fieldDef.type === 'nominal' && !('sort' in fieldDef)) {
                return {
                    compatible: false,
                    warning: "Channel order is inappropriate for nominal field, which has no inherent order."
                };
            }
            return COMPATIBLE;
    }
    throw new Error('channelCompatability not implemented for channel ' + channel);
}
function isNumberFieldDef(fieldDef) {
    return fieldDef.type === 'quantitative' || !!fieldDef.bin;
}
function isTimeFieldDef(fieldDef) {
    return fieldDef.type === 'temporal' || !!fieldDef.timeUnit;
}
function valueExpr(v, _a) {
    var timeUnit = _a.timeUnit, type = _a.type, time = _a.time, undefinedIfExprNotRequired = _a.undefinedIfExprNotRequired;
    var _b;
    var expr = undefined;
    if (isDateTime(v)) {
        expr = dateTimeExpr(v, true);
    }
    else if (isString(v) || isNumber(v)) {
        if (timeUnit || type === 'temporal') {
            if (isLocalSingleTimeUnit(timeUnit)) {
                expr = dateTimeExpr((_b = {}, _b[timeUnit] = v, _b), true);
            }
            else if (isUtcSingleTimeUnit(timeUnit)) {
                expr = valueExpr(v, { timeUnit: getLocalTimeUnit(timeUnit) });
            }
            else {
                expr = "datetime(" + JSON.stringify(v) + ")";
            }
        }
    }
    if (expr) {
        return time ? "time(" + expr + ")" : expr;
    }
    return undefinedIfExprNotRequired ? undefined : JSON.stringify(v);
}
function valueArray(fieldDef, values) {
    var timeUnit = fieldDef.timeUnit, type = fieldDef.type;
    return values.map(function (v) {
        var expr = valueExpr(v, { timeUnit: timeUnit, type: type, undefinedIfExprNotRequired: true });
        if (expr !== undefined) {
            return { signal: expr };
        }
        return v;
    });
}

var fielddef = /*#__PURE__*/Object.freeze({
  isConditionalSelection: isConditionalSelection,
  isRepeatRef: isRepeatRef,
  toFieldDefBase: toFieldDefBase,
  isConditionalDef: isConditionalDef,
  hasConditionalFieldDef: hasConditionalFieldDef,
  hasConditionalValueDef: hasConditionalValueDef,
  isFieldDef: isFieldDef,
  isStringFieldDef: isStringFieldDef,
  isValueDef: isValueDef,
  isScaleFieldDef: isScaleFieldDef,
  vgField: vgField,
  isDiscrete: isDiscrete,
  isContinuous: isContinuous,
  isCount: isCount,
  verbalTitleFormatter: verbalTitleFormatter,
  functionalTitleFormatter: functionalTitleFormatter,
  defaultTitleFormatter: defaultTitleFormatter,
  setTitleFormatter: setTitleFormatter,
  resetTitleFormatter: resetTitleFormatter,
  title: title,
  defaultType: defaultType,
  getFieldDef: getFieldDef,
  normalize: normalize,
  normalizeFieldDef: normalizeFieldDef,
  normalizeBin: normalizeBin,
  channelCompatibility: channelCompatibility,
  isNumberFieldDef: isNumberFieldDef,
  isTimeFieldDef: isTimeFieldDef,
  valueExpr: valueExpr,
  valueArray: valueArray
});

function channelHasField(encoding, channel) {
    var channelDef = encoding && encoding[channel];
    if (channelDef) {
        if (isArray(channelDef)) {
            return some(channelDef, function (fieldDef) { return !!fieldDef.field; });
        }
        else {
            return isFieldDef(channelDef) || hasConditionalFieldDef(channelDef);
        }
    }
    return false;
}
function isAggregate(encoding) {
    return some(CHANNELS, function (channel) {
        if (channelHasField(encoding, channel)) {
            var channelDef = encoding[channel];
            if (isArray(channelDef)) {
                return some(channelDef, function (fieldDef) { return !!fieldDef.aggregate; });
            }
            else {
                var fieldDef = getFieldDef(channelDef);
                return fieldDef && !!fieldDef.aggregate;
            }
        }
        return false;
    });
}
function normalizeEncoding(encoding, mark) {
    return keys$1(encoding).reduce(function (normalizedEncoding, channel) {
        var _a;
        if (!isChannel(channel)) {
            warn$1(message.invalidEncodingChannel(channel));
            return normalizedEncoding;
        }
        if (!supportMark(channel, mark)) {
            warn$1(message.incompatibleChannel(channel, mark));
            return normalizedEncoding;
        }
        if (channel === 'size' && mark === 'line') {
            var fieldDef = getFieldDef(encoding[channel]);
            if (fieldDef && fieldDef.aggregate) {
                warn$1(message.LINE_WITH_VARYING_SIZE);
                return normalizedEncoding;
            }
        }
        if (channel === 'color' && ('fill' in encoding || 'stroke' in encoding)) {
            warn$1(message.droppingColor('encoding', { fill: 'fill' in encoding, stroke: 'stroke' in encoding }));
            return normalizedEncoding;
        }
        var channelDef = encoding[channel];
        if (channel === 'detail' ||
            (channel === 'order' && !isArray(channelDef) && !isValueDef(channelDef)) ||
            (channel === 'tooltip' && isArray(channelDef))) {
            if (channelDef) {
                normalizedEncoding[channel] = (isArray(channelDef) ? channelDef : [channelDef])
                    .reduce(function (defs, fieldDef) {
                    if (!isFieldDef(fieldDef)) {
                        warn$1(message.emptyFieldDef(fieldDef, channel));
                    }
                    else {
                        defs.push(normalizeFieldDef(fieldDef, channel));
                    }
                    return defs;
                }, []);
            }
        }
        else {
            var fieldDef = getFieldDef(encoding[channel]);
            if (fieldDef && contains([Type.LATITUDE, Type.LONGITUDE], fieldDef.type)) {
                var _b = channel, _$$1 = normalizedEncoding[_b], newEncoding = tslib_1.__rest(normalizedEncoding, [typeof _b === "symbol" ? _b : _b + ""]);
                var newChannel = channel === 'x' ? 'longitude' :
                    channel === 'y' ? 'latitude' :
                        channel === 'x2' ? 'longitude2' :
                            channel === 'y2' ? 'latitude2' : undefined;
                warn$1(message.latLongDeprecated(channel, fieldDef.type, newChannel));
                return tslib_1.__assign({}, newEncoding, (_a = {}, _a[newChannel] = tslib_1.__assign({}, normalize(fieldDef, channel), { type: 'quantitative' }), _a));
            }
            if (!isFieldDef(channelDef) && !isValueDef(channelDef) && !isConditionalDef(channelDef)) {
                warn$1(message.emptyFieldDef(channelDef, channel));
                return normalizedEncoding;
            }
            normalizedEncoding[channel] = normalize(channelDef, channel);
        }
        return normalizedEncoding;
    }, {});
}
function isRanged(encoding) {
    return encoding && ((!!encoding.x && !!encoding.x2) || (!!encoding.y && !!encoding.y2));
}
function fieldDefs(encoding) {
    var arr = [];
    CHANNELS.forEach(function (channel) {
        if (channelHasField(encoding, channel)) {
            var channelDef = encoding[channel];
            (isArray(channelDef) ? channelDef : [channelDef]).forEach(function (def) {
                if (isFieldDef(def)) {
                    arr.push(def);
                }
                else if (hasConditionalFieldDef(def)) {
                    arr.push(def.condition);
                }
            });
        }
    });
    return arr;
}
function forEach(mapping, f, thisArg) {
    if (!mapping) {
        return;
    }
    var _loop_1 = function (channel) {
        if (isArray(mapping[channel])) {
            mapping[channel].forEach(function (channelDef) {
                f.call(thisArg, channelDef, channel);
            });
        }
        else {
            f.call(thisArg, mapping[channel], channel);
        }
    };
    for (var _i = 0, _a = keys$1(mapping); _i < _a.length; _i++) {
        var channel = _a[_i];
        _loop_1(channel);
    }
}
function reduce(mapping, f, init, thisArg) {
    if (!mapping) {
        return init;
    }
    return keys$1(mapping).reduce(function (r, channel) {
        var map = mapping[channel];
        if (isArray(map)) {
            return map.reduce(function (r1, channelDef) {
                return f.call(thisArg, r1, channelDef, channel);
            }, r);
        }
        else {
            return f.call(thisArg, r, map, channel);
        }
    }, init);
}

var encoding = /*#__PURE__*/Object.freeze({
  channelHasField: channelHasField,
  isAggregate: isAggregate,
  normalizeEncoding: normalizeEncoding,
  isRanged: isRanged,
  fieldDefs: fieldDefs,
  forEach: forEach,
  reduce: reduce
});

function getMarkSpecificConfigMixins(markSpecificConfig, channel) {
    var _a;
    var value = markSpecificConfig[channel];
    return value !== undefined ? (_a = {}, _a[channel] = { value: value }, _a) : {};
}

var BOXPLOT = 'box-plot';
function isBoxPlotDef(mark) {
    return !!mark['type'];
}
var BOXPLOT_STYLES = ['boxWhisker', 'box', 'boxMid'];
var VL_ONLY_BOXPLOT_CONFIG_PROPERTY_INDEX = {
    box: ['size', 'color', 'extent'],
    boxWhisker: ['color'],
    boxMid: ['color']
};
var supportedChannels = ['x', 'y', 'color', 'detail', 'opacity', 'size'];
function filterUnsupportedChannels(spec) {
    return tslib_1.__assign({}, spec, { encoding: reduce(spec.encoding, function (newEncoding, fieldDef, channel) {
            if (supportedChannels.indexOf(channel) > -1) {
                newEncoding[channel] = fieldDef;
            }
            else {
                warn$1(message.incompatibleChannel(channel, BOXPLOT));
            }
            return newEncoding;
        }, {}) });
}
function normalizeBoxPlot(spec, config) {
    var _a, _b, _c, _d;
    spec = filterUnsupportedChannels(spec);
    var mark = spec.mark, encoding = spec.encoding, selection = spec.selection, _p = spec.projection, outerSpec = tslib_1.__rest(spec, ["mark", "encoding", "selection", "projection"]);
    var kIQRScalar = undefined;
    if (isNumber(config.box.extent)) {
        kIQRScalar = config.box.extent;
    }
    if (isBoxPlotDef(mark)) {
        if (mark.extent) {
            if (mark.extent === 'min-max') {
                kIQRScalar = undefined;
            }
        }
    }
    var orient = boxOrient(spec);
    var _e = boxParams(spec, orient, kIQRScalar), transform = _e.transform, continuousAxisChannelDef = _e.continuousAxisChannelDef, continuousAxis = _e.continuousAxis, encodingWithoutContinuousAxis = _e.encodingWithoutContinuousAxis;
    var size = encodingWithoutContinuousAxis.size, encodingWithoutSizeColorAndContinuousAxis = tslib_1.__rest(encodingWithoutContinuousAxis, ["color", "size"]);
    var sizeMixins = size ? { size: size } : getMarkSpecificConfigMixins(config.box, 'size');
    var continuousAxisScaleAndAxis = {};
    if (continuousAxisChannelDef.scale) {
        continuousAxisScaleAndAxis['scale'] = continuousAxisChannelDef.scale;
    }
    if (continuousAxisChannelDef.axis) {
        continuousAxisScaleAndAxis['axis'] = continuousAxisChannelDef.axis;
    }
    return tslib_1.__assign({}, outerSpec, { transform: transform, layer: [
            {
                mark: {
                    type: 'rule',
                    style: 'boxWhisker'
                },
                encoding: tslib_1.__assign((_a = {}, _a[continuousAxis] = tslib_1.__assign({ field: 'lower_whisker_' + continuousAxisChannelDef.field, type: continuousAxisChannelDef.type }, continuousAxisScaleAndAxis), _a[continuousAxis + '2'] = {
                    field: 'lower_box_' + continuousAxisChannelDef.field,
                    type: continuousAxisChannelDef.type
                }, _a), encodingWithoutSizeColorAndContinuousAxis, getMarkSpecificConfigMixins(config.boxWhisker, 'color'))
            }, {
                mark: {
                    type: 'rule',
                    style: 'boxWhisker'
                },
                encoding: tslib_1.__assign((_b = {}, _b[continuousAxis] = {
                    field: 'upper_box_' + continuousAxisChannelDef.field,
                    type: continuousAxisChannelDef.type
                }, _b[continuousAxis + '2'] = {
                    field: 'upper_whisker_' + continuousAxisChannelDef.field,
                    type: continuousAxisChannelDef.type
                }, _b), encodingWithoutSizeColorAndContinuousAxis, getMarkSpecificConfigMixins(config.boxWhisker, 'color'))
            },
            tslib_1.__assign({}, (selection ? { selection: selection } : {}), { mark: {
                    type: 'bar',
                    style: 'box'
                }, encoding: tslib_1.__assign((_c = {}, _c[continuousAxis] = {
                    field: 'lower_box_' + continuousAxisChannelDef.field,
                    type: continuousAxisChannelDef.type
                }, _c[continuousAxis + '2'] = {
                    field: 'upper_box_' + continuousAxisChannelDef.field,
                    type: continuousAxisChannelDef.type
                }, _c), encodingWithoutContinuousAxis, (encodingWithoutContinuousAxis.color ? {} : getMarkSpecificConfigMixins(config.box, 'color')), sizeMixins) }),
            {
                mark: {
                    type: 'tick',
                    style: 'boxMid'
                },
                encoding: tslib_1.__assign((_d = {}, _d[continuousAxis] = {
                    field: 'mid_box_' + continuousAxisChannelDef.field,
                    type: continuousAxisChannelDef.type
                }, _d), encodingWithoutSizeColorAndContinuousAxis, getMarkSpecificConfigMixins(config.boxMid, 'color'), sizeMixins)
            }
        ] });
}
function boxOrient(spec) {
    var mark = spec.mark, encoding = spec.encoding, _p = spec.projection, _outerSpec = tslib_1.__rest(spec, ["mark", "encoding", "projection"]);
    if (isFieldDef(encoding.x) && isContinuous(encoding.x)) {
        if (isFieldDef(encoding.y) && isContinuous(encoding.y)) {
            if (encoding.x.aggregate === undefined && encoding.y.aggregate === BOXPLOT) {
                return 'vertical';
            }
            else if (encoding.y.aggregate === undefined && encoding.x.aggregate === BOXPLOT) {
                return 'horizontal';
            }
            else if (encoding.x.aggregate === BOXPLOT && encoding.y.aggregate === BOXPLOT) {
                throw new Error('Both x and y cannot have aggregate');
            }
            else {
                if (isBoxPlotDef(mark) && mark.orient) {
                    return mark.orient;
                }
                return 'vertical';
            }
        }
        return 'horizontal';
    }
    else if (isFieldDef(encoding.y) && isContinuous(encoding.y)) {
        return 'vertical';
    }
    else {
        throw new Error('Need a valid continuous axis for boxplots');
    }
}
function boxContinousAxis(spec, orient) {
    var mark = spec.mark, encoding = spec.encoding, _p = spec.projection, _outerSpec = tslib_1.__rest(spec, ["mark", "encoding", "projection"]);
    var continuousAxisChannelDef;
    var continuousAxis;
    if (orient === 'vertical') {
        continuousAxis = 'y';
        continuousAxisChannelDef = encoding.y;
    }
    else {
        continuousAxis = 'x';
        continuousAxisChannelDef = encoding.x;
    }
    if (continuousAxisChannelDef && continuousAxisChannelDef.aggregate) {
        var aggregate = continuousAxisChannelDef.aggregate, continuousAxisWithoutAggregate = tslib_1.__rest(continuousAxisChannelDef, ["aggregate"]);
        if (aggregate !== BOXPLOT) {
            warn$1("Continuous axis should not have customized aggregation function " + aggregate);
        }
        continuousAxisChannelDef = continuousAxisWithoutAggregate;
    }
    return {
        continuousAxisChannelDef: continuousAxisChannelDef,
        continuousAxis: continuousAxis
    };
}
function boxParams(spec, orient, kIQRScalar) {
    var _a = boxContinousAxis(spec, orient), continuousAxisChannelDef = _a.continuousAxisChannelDef, continuousAxis = _a.continuousAxis;
    var encoding = spec.encoding;
    var isMinMax = kIQRScalar === undefined;
    var aggregate = [
        {
            op: 'q1',
            field: continuousAxisChannelDef.field,
            as: 'lower_box_' + continuousAxisChannelDef.field
        },
        {
            op: 'q3',
            field: continuousAxisChannelDef.field,
            as: 'upper_box_' + continuousAxisChannelDef.field
        },
        {
            op: 'median',
            field: continuousAxisChannelDef.field,
            as: 'mid_box_' + continuousAxisChannelDef.field
        }
    ];
    var postAggregateCalculates = [];
    aggregate.push({
        op: 'min',
        field: continuousAxisChannelDef.field,
        as: (isMinMax ? 'lower_whisker_' : 'min_') + continuousAxisChannelDef.field
    });
    aggregate.push({
        op: 'max',
        field: continuousAxisChannelDef.field,
        as: (isMinMax ? 'upper_whisker_' : 'max_') + continuousAxisChannelDef.field
    });
    if (!isMinMax) {
        postAggregateCalculates = [
            {
                calculate: "datum.upper_box_" + continuousAxisChannelDef.field + " - datum.lower_box_" + continuousAxisChannelDef.field,
                as: 'iqr_' + continuousAxisChannelDef.field
            },
            {
                calculate: "min(datum.upper_box_" + continuousAxisChannelDef.field + " + datum.iqr_" + continuousAxisChannelDef.field + " * " + kIQRScalar + ", datum.max_" + continuousAxisChannelDef.field + ")",
                as: 'upper_whisker_' + continuousAxisChannelDef.field
            },
            {
                calculate: "max(datum.lower_box_" + continuousAxisChannelDef.field + " - datum.iqr_" + continuousAxisChannelDef.field + " * " + kIQRScalar + ", datum.min_" + continuousAxisChannelDef.field + ")",
                as: 'lower_whisker_' + continuousAxisChannelDef.field
            }
        ];
    }
    var groupby = [];
    var bins = [];
    var timeUnits = [];
    var encodingWithoutContinuousAxis = {};
    forEach(encoding, function (channelDef, channel) {
        if (channel === continuousAxis) {
            return;
        }
        if (isFieldDef(channelDef)) {
            if (channelDef.aggregate && channelDef.aggregate !== BOXPLOT) {
                aggregate.push({
                    op: channelDef.aggregate,
                    field: channelDef.field,
                    as: vgField(channelDef)
                });
            }
            else if (channelDef.aggregate === undefined) {
                var transformedField = vgField(channelDef);
                var bin = channelDef.bin;
                if (bin) {
                    var field$$1 = channelDef.field;
                    bins.push({ bin: bin, field: field$$1, as: transformedField });
                }
                else if (channelDef.timeUnit) {
                    var timeUnit = channelDef.timeUnit, field$$1 = channelDef.field;
                    timeUnits.push({ timeUnit: timeUnit, field: field$$1, as: transformedField });
                }
                groupby.push(transformedField);
            }
            encodingWithoutContinuousAxis[channel] = {
                field: vgField(channelDef),
                type: channelDef.type
            };
        }
        else {
            encodingWithoutContinuousAxis[channel] = encoding[channel];
        }
    });
    return {
        transform: [].concat(bins, timeUnits, [{ aggregate: aggregate, groupby: groupby }], postAggregateCalculates),
        continuousAxisChannelDef: continuousAxisChannelDef,
        continuousAxis: continuousAxis,
        encodingWithoutContinuousAxis: encodingWithoutContinuousAxis
    };
}

var ERRORBAR = 'error-bar';
function normalizeErrorBar(spec) {
    var _m = spec.mark, _sel = spec.selection, _p = spec.projection, encoding = spec.encoding, outerSpec = tslib_1.__rest(spec, ["mark", "selection", "projection", "encoding"]);
    var _s = encoding.size, encodingWithoutSize = tslib_1.__rest(encoding, ["size"]);
    var _x2 = encoding.x2, _y2 = encoding.y2, encodingWithoutX2Y2 = tslib_1.__rest(encoding, ["x2", "y2"]);
    var _x = encodingWithoutX2Y2.x, _y = encodingWithoutX2Y2.y, encodingWithoutX_X2_Y_Y2 = tslib_1.__rest(encodingWithoutX2Y2, ["x", "y"]);
    if (!encoding.x2 && !encoding.y2) {
        throw new Error('Neither x2 or y2 provided');
    }
    return tslib_1.__assign({}, outerSpec, { layer: [
            {
                mark: 'rule',
                encoding: encodingWithoutSize
            }, {
                mark: 'tick',
                encoding: encodingWithoutX2Y2
            }, {
                mark: 'tick',
                encoding: encoding.x2 ? tslib_1.__assign({ x: encoding.x2, y: encoding.y }, encodingWithoutX_X2_Y_Y2) : tslib_1.__assign({ x: encoding.x, y: encoding.y2 }, encodingWithoutX_X2_Y_Y2)
            }
        ] });
}

var normalizerRegistry = {};
function add$3(mark, normalizer) {
    normalizerRegistry[mark] = normalizer;
}
function remove$1(mark) {
    delete normalizerRegistry[mark];
}
var COMPOSITE_MARK_STYLES = BOXPLOT_STYLES;
var VL_ONLY_COMPOSITE_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX = tslib_1.__assign({}, VL_ONLY_BOXPLOT_CONFIG_PROPERTY_INDEX);
add$3(BOXPLOT, normalizeBoxPlot);
add$3(ERRORBAR, normalizeErrorBar);
function normalize$1(
spec, config) {
    var mark = isMarkDef(spec.mark) ? spec.mark.type : spec.mark;
    var normalizer = normalizerRegistry[mark];
    if (normalizer) {
        return normalizer(spec, config);
    }
    throw new Error("Invalid mark type \"" + mark + "\"");
}

var index$1 = /*#__PURE__*/Object.freeze({
  add: add$3,
  remove: remove$1,
  COMPOSITE_MARK_STYLES: COMPOSITE_MARK_STYLES,
  VL_ONLY_COMPOSITE_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX: VL_ONLY_COMPOSITE_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX,
  normalize: normalize$1
});

var VL_ONLY_GUIDE_CONFIG = ['shortTimeLabels'];

var defaultLegendConfig = {};
var COMMON_LEGEND_PROPERTY_INDEX = {
    entryPadding: 1,
    format: 1,
    offset: 1,
    orient: 1,
    padding: 1,
    tickCount: 1,
    title: 1,
    type: 1,
    values: 1,
    zindex: 1
};
var VG_LEGEND_PROPERTY_INDEX = tslib_1.__assign({}, COMMON_LEGEND_PROPERTY_INDEX, {
    opacity: 1, shape: 1, stroke: 1, fill: 1, size: 1,
    encode: 1 });
var LEGEND_PROPERTIES = flagKeys(COMMON_LEGEND_PROPERTY_INDEX);
var VG_LEGEND_PROPERTIES = flagKeys(VG_LEGEND_PROPERTY_INDEX);

var legend = /*#__PURE__*/Object.freeze({
  defaultLegendConfig: defaultLegendConfig,
  LEGEND_PROPERTIES: LEGEND_PROPERTIES,
  VG_LEGEND_PROPERTIES: VG_LEGEND_PROPERTIES
});

var ScaleType;
(function (ScaleType) {
    ScaleType.LINEAR = 'linear';
    ScaleType.BIN_LINEAR = 'bin-linear';
    ScaleType.LOG = 'log';
    ScaleType.POW = 'pow';
    ScaleType.SQRT = 'sqrt';
    ScaleType.TIME = 'time';
    ScaleType.UTC = 'utc';
    ScaleType.SEQUENTIAL = 'sequential';
    ScaleType.QUANTILE = 'quantile';
    ScaleType.QUANTIZE = 'quantize';
    ScaleType.THRESHOLD = 'threshold';
    ScaleType.ORDINAL = 'ordinal';
    ScaleType.BIN_ORDINAL = 'bin-ordinal';
    ScaleType.POINT = 'point';
    ScaleType.BAND = 'band';
})(ScaleType || (ScaleType = {}));
var SCALE_CATEGORY_INDEX = {
    linear: 'numeric',
    log: 'numeric',
    pow: 'numeric',
    sqrt: 'numeric',
    'bin-linear': 'bin-linear',
    time: 'time',
    utc: 'time',
    sequential: 'sequential',
    ordinal: 'ordinal',
    'bin-ordinal': 'bin-ordinal',
    point: 'ordinal-position',
    band: 'ordinal-position'
};
var SCALE_TYPES = keys$1(SCALE_CATEGORY_INDEX);
function scaleCompatible(scaleType1, scaleType2) {
    var scaleCategory1 = SCALE_CATEGORY_INDEX[scaleType1];
    var scaleCategory2 = SCALE_CATEGORY_INDEX[scaleType2];
    return scaleCategory1 === scaleCategory2 ||
        (scaleCategory1 === 'ordinal-position' && scaleCategory2 === 'time') ||
        (scaleCategory2 === 'ordinal-position' && scaleCategory1 === 'time');
}
var SCALE_PRECEDENCE_INDEX = {
    linear: 0,
    log: 1,
    pow: 1,
    sqrt: 1,
    time: 0,
    utc: 0,
    point: 10,
    band: 11,
    'bin-linear': 0,
    sequential: 0,
    ordinal: 0,
    'bin-ordinal': 0,
};
function scaleTypePrecedence(scaleType) {
    return SCALE_PRECEDENCE_INDEX[scaleType];
}
var CONTINUOUS_TO_CONTINUOUS_SCALES = ['linear', 'bin-linear', 'log', 'pow', 'sqrt', 'time', 'utc'];
var CONTINUOUS_TO_CONTINUOUS_INDEX = toSet(CONTINUOUS_TO_CONTINUOUS_SCALES);
var CONTINUOUS_DOMAIN_SCALES = CONTINUOUS_TO_CONTINUOUS_SCALES.concat(['sequential'                                                  ]);
var CONTINUOUS_DOMAIN_INDEX = toSet(CONTINUOUS_DOMAIN_SCALES);
var DISCRETE_DOMAIN_SCALES = ['ordinal', 'bin-ordinal', 'point', 'band'];
var DISCRETE_DOMAIN_INDEX = toSet(DISCRETE_DOMAIN_SCALES);
var BIN_SCALES_INDEX = toSet(['bin-linear', 'bin-ordinal']);
var TIME_SCALE_TYPES = ['time', 'utc'];
function hasDiscreteDomain(type) {
    return type in DISCRETE_DOMAIN_INDEX;
}
function isBinScale(type) {
    return type in BIN_SCALES_INDEX;
}
function hasContinuousDomain(type) {
    return type in CONTINUOUS_DOMAIN_INDEX;
}
function isContinuousToContinuous(type) {
    return type in CONTINUOUS_TO_CONTINUOUS_INDEX;
}
var defaultScaleConfig = {
    textXRangeStep: 90,
    rangeStep: 21,
    pointPadding: 0.5,
    bandPaddingInner: 0.1,
    facetSpacing: 16,
    minBandSize: 2,
    minFontSize: 8,
    maxFontSize: 40,
    minOpacity: 0.3,
    maxOpacity: 0.8,
    minSize: 9,
    minStrokeWidth: 1,
    maxStrokeWidth: 4
};
function isExtendedScheme(scheme) {
    return scheme && !!scheme['name'];
}
function isSelectionDomain(domain) {
    return domain && domain['selection'];
}
var SCALE_PROPERTY_INDEX = {
    type: 1,
    domain: 1,
    range: 1,
    rangeStep: 1,
    scheme: 1,
    reverse: 1,
    round: 1,
    clamp: 1,
    nice: 1,
    base: 1,
    exponent: 1,
    interpolate: 1,
    zero: 1,
    padding: 1,
    paddingInner: 1,
    paddingOuter: 1
};
var SCALE_PROPERTIES = flagKeys(SCALE_PROPERTY_INDEX);
var NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTY_INDEX = tslib_1.__rest(SCALE_PROPERTY_INDEX, ["type", "domain", "range", "rangeStep", "scheme"]);
var NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES = flagKeys(NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTY_INDEX);
var SCALE_TYPE_INDEX = generateScaleTypeIndex();
function scaleTypeSupportProperty(scaleType, propName) {
    switch (propName) {
        case 'type':
        case 'domain':
        case 'reverse':
        case 'range':
            return true;
        case 'scheme':
            return contains(['sequential', 'ordinal', 'bin-ordinal', 'quantile', 'quantize'], scaleType);
        case 'interpolate':
            return contains(['linear', 'bin-linear', 'pow', 'log', 'sqrt', 'utc', 'time'], scaleType);
        case 'round':
            return isContinuousToContinuous(scaleType) || scaleType === 'band' || scaleType === 'point';
        case 'padding':
            return isContinuousToContinuous(scaleType) || contains(['point', 'band'], scaleType);
        case 'paddingOuter':
        case 'rangeStep':
            return contains(['point', 'band'], scaleType);
        case 'paddingInner':
            return scaleType === 'band';
        case 'clamp':
            return isContinuousToContinuous(scaleType) || scaleType === 'sequential';
        case 'nice':
            return isContinuousToContinuous(scaleType) || scaleType === 'sequential' || scaleType === 'quantize';
        case 'exponent':
            return scaleType === 'pow';
        case 'base':
            return scaleType === 'log';
        case 'zero':
            return hasContinuousDomain(scaleType) && !contains([
                'log',
                'time', 'utc',
                'bin-linear',
                'threshold',
                'quantile'
            ], scaleType);
    }
    throw new Error("Invalid scale property " + propName + ".");
}
function channelScalePropertyIncompatability(channel, propName) {
    switch (propName) {
        case 'interpolate':
        case 'scheme':
            if (!isColorChannel(channel)) {
                return message.cannotUseScalePropertyWithNonColor(channel);
            }
            return undefined;
        case 'type':
        case 'domain':
        case 'range':
        case 'base':
        case 'exponent':
        case 'nice':
        case 'padding':
        case 'paddingInner':
        case 'paddingOuter':
        case 'rangeStep':
        case 'reverse':
        case 'round':
        case 'clamp':
        case 'zero':
            return undefined;
    }
    throw new Error("Invalid scale property \"" + propName + "\".");
}
function scaleTypeSupportDataType(specifiedType, fieldDefType, bin) {
    if (contains([Type.ORDINAL, Type.NOMINAL], fieldDefType)) {
        return specifiedType === undefined || hasDiscreteDomain(specifiedType);
    }
    else if (fieldDefType === Type.TEMPORAL) {
        return contains([ScaleType.TIME, ScaleType.UTC, ScaleType.SEQUENTIAL, undefined], specifiedType);
    }
    else if (fieldDefType === Type.QUANTITATIVE) {
        if (bin) {
            return contains([ScaleType.BIN_LINEAR, ScaleType.BIN_ORDINAL, ScaleType.LINEAR], specifiedType);
        }
        return contains([ScaleType.LOG, ScaleType.POW, ScaleType.SQRT, ScaleType.QUANTILE, ScaleType.QUANTIZE, ScaleType.LINEAR, ScaleType.SEQUENTIAL, undefined], specifiedType);
    }
    return true;
}
function channelSupportScaleType(channel, scaleType) {
    switch (channel) {
        case Channel.X:
        case Channel.Y:
        case Channel.SIZE:
        case Channel.OPACITY:
            return isContinuousToContinuous(scaleType) || contains(['band', 'point'], scaleType);
        case Channel.COLOR:
        case Channel.FILL:
        case Channel.STROKE:
            return scaleType !== 'band';
        case Channel.SHAPE:
            return scaleType === 'ordinal';
    }
    return false;
}
function getSupportedScaleType(channel, fieldDefType, bin) {
    return SCALE_TYPE_INDEX[generateScaleTypeIndexKey(channel, fieldDefType, bin)];
}
function generateScaleTypeIndex() {
    var index = {};
    for (var _i = 0, CHANNELS_1 = CHANNELS; _i < CHANNELS_1.length; _i++) {
        var channel = CHANNELS_1[_i];
        for (var _a = 0, _b = keys$1(TYPE_INDEX); _a < _b.length; _a++) {
            var fieldDefType = _b[_a];
            for (var _c = 0, SCALE_TYPES_1 = SCALE_TYPES; _c < SCALE_TYPES_1.length; _c++) {
                var scaleType = SCALE_TYPES_1[_c];
                for (var _d = 0, _e = [false, true]; _d < _e.length; _d++) {
                    var bin = _e[_d];
                    var key$$1 = generateScaleTypeIndexKey(channel, fieldDefType, bin);
                    if (channelSupportScaleType(channel, scaleType) && scaleTypeSupportDataType(scaleType, fieldDefType, bin)) {
                        index[key$$1] = index[key$$1] || [];
                        index[key$$1].push(scaleType);
                    }
                }
            }
        }
    }
    return index;
}
function generateScaleTypeIndexKey(channel, fieldDefType, bin) {
    var key$$1 = channel + '_' + fieldDefType;
    return bin ? key$$1 + '_bin' : key$$1;
}

var scale$4 = /*#__PURE__*/Object.freeze({
  get ScaleType () { return ScaleType; },
  SCALE_TYPES: SCALE_TYPES,
  scaleCompatible: scaleCompatible,
  scaleTypePrecedence: scaleTypePrecedence,
  CONTINUOUS_TO_CONTINUOUS_SCALES: CONTINUOUS_TO_CONTINUOUS_SCALES,
  CONTINUOUS_DOMAIN_SCALES: CONTINUOUS_DOMAIN_SCALES,
  DISCRETE_DOMAIN_SCALES: DISCRETE_DOMAIN_SCALES,
  TIME_SCALE_TYPES: TIME_SCALE_TYPES,
  hasDiscreteDomain: hasDiscreteDomain,
  isBinScale: isBinScale,
  hasContinuousDomain: hasContinuousDomain,
  isContinuousToContinuous: isContinuousToContinuous,
  defaultScaleConfig: defaultScaleConfig,
  isExtendedScheme: isExtendedScheme,
  isSelectionDomain: isSelectionDomain,
  SCALE_PROPERTIES: SCALE_PROPERTIES,
  NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES: NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES,
  SCALE_TYPE_INDEX: SCALE_TYPE_INDEX,
  scaleTypeSupportProperty: scaleTypeSupportProperty,
  channelScalePropertyIncompatability: channelScalePropertyIncompatability,
  scaleTypeSupportDataType: scaleTypeSupportDataType,
  channelSupportScaleType: channelSupportScaleType,
  getSupportedScaleType: getSupportedScaleType
});

var SELECTION_ID = '_vgsid_';
var defaultConfig = {
    single: {
        on: 'click',
        fields: [SELECTION_ID],
        resolve: 'global',
        empty: 'all'
    },
    multi: {
        on: 'click',
        fields: [SELECTION_ID],
        toggle: 'event.shiftKey',
        resolve: 'global',
        empty: 'all'
    },
    interval: {
        on: '[mousedown, window:mouseup] > window:mousemove!',
        encodings: ['x', 'y'],
        translate: '[mousedown, window:mouseup] > window:mousemove!',
        zoom: 'wheel!',
        mark: { fill: '#333', fillOpacity: 0.125, stroke: 'white' },
        resolve: 'global'
    }
};

function extractTitleConfig(titleConfig) {
    var
    anchor = titleConfig.anchor, offset = titleConfig.offset, orient = titleConfig.orient,
    color = titleConfig.color,
    titleMarkConfig = tslib_1.__rest(titleConfig, ["anchor", "offset", "orient", "color"]);
    var mark = tslib_1.__assign({}, titleMarkConfig, color ? { fill: color } : {});
    var nonMark = tslib_1.__assign({}, anchor ? { anchor: anchor } : {}, offset ? { offset: offset } : {}, orient ? { orient: orient } : {});
    return { mark: mark, nonMark: nonMark };
}

var defaultViewConfig = {
    width: 200,
    height: 200
};
var defaultConfig$1 = {
    padding: 5,
    timeFormat: '',
    countTitle: 'Number of Records',
    invalidValues: 'filter',
    view: defaultViewConfig,
    mark: defaultMarkConfig,
    area: {},
    bar: defaultBarConfig,
    circle: {},
    geoshape: {},
    line: {},
    point: {},
    rect: {},
    rule: { color: 'black' },
    square: {},
    text: { color: 'black' },
    tick: defaultTickConfig,
    trail: {},
    box: { size: 14, extent: 1.5 },
    boxWhisker: {},
    boxMid: { color: 'white' },
    scale: defaultScaleConfig,
    projection: {},
    axis: {},
    axisX: {},
    axisY: { minExtent: 30 },
    axisLeft: {},
    axisRight: {},
    axisTop: {},
    axisBottom: {},
    axisBand: {},
    legend: defaultLegendConfig,
    selection: defaultConfig,
    style: {},
    title: {},
};
function initConfig(config) {
    return mergeDeep(duplicate(defaultConfig$1), config);
}
var MARK_STYLES = ['view'].concat(PRIMITIVE_MARKS, COMPOSITE_MARK_STYLES);
var VL_ONLY_CONFIG_PROPERTIES = [
    'padding', 'numberFormat', 'timeFormat', 'countTitle',
    'stack', 'scale', 'selection', 'invalidValues',
    'overlay'
];
var VL_ONLY_ALL_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX = tslib_1.__assign({ view: ['width', 'height'] }, VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX, VL_ONLY_COMPOSITE_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX);
function stripAndRedirectConfig(config) {
    config = duplicate(config);
    for (var _i = 0, VL_ONLY_CONFIG_PROPERTIES_1 = VL_ONLY_CONFIG_PROPERTIES; _i < VL_ONLY_CONFIG_PROPERTIES_1.length; _i++) {
        var prop = VL_ONLY_CONFIG_PROPERTIES_1[_i];
        delete config[prop];
    }
    if (config.axis) {
        for (var _a = 0, VL_ONLY_GUIDE_CONFIG_1 = VL_ONLY_GUIDE_CONFIG; _a < VL_ONLY_GUIDE_CONFIG_1.length; _a++) {
            var prop = VL_ONLY_GUIDE_CONFIG_1[_a];
            delete config.axis[prop];
        }
    }
    if (config.legend) {
        for (var _b = 0, VL_ONLY_GUIDE_CONFIG_2 = VL_ONLY_GUIDE_CONFIG; _b < VL_ONLY_GUIDE_CONFIG_2.length; _b++) {
            var prop = VL_ONLY_GUIDE_CONFIG_2[_b];
            delete config.legend[prop];
        }
    }
    if (config.mark) {
        for (var _c = 0, VL_ONLY_MARK_CONFIG_PROPERTIES_1 = VL_ONLY_MARK_CONFIG_PROPERTIES; _c < VL_ONLY_MARK_CONFIG_PROPERTIES_1.length; _c++) {
            var prop = VL_ONLY_MARK_CONFIG_PROPERTIES_1[_c];
            delete config.mark[prop];
        }
    }
    for (var _d = 0, MARK_STYLES_1 = MARK_STYLES; _d < MARK_STYLES_1.length; _d++) {
        var markType = MARK_STYLES_1[_d];
        for (var _e = 0, VL_ONLY_MARK_CONFIG_PROPERTIES_2 = VL_ONLY_MARK_CONFIG_PROPERTIES; _e < VL_ONLY_MARK_CONFIG_PROPERTIES_2.length; _e++) {
            var prop = VL_ONLY_MARK_CONFIG_PROPERTIES_2[_e];
            delete config[markType][prop];
        }
        var vlOnlyMarkSpecificConfigs = VL_ONLY_ALL_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX[markType];
        if (vlOnlyMarkSpecificConfigs) {
            for (var _f = 0, vlOnlyMarkSpecificConfigs_1 = vlOnlyMarkSpecificConfigs; _f < vlOnlyMarkSpecificConfigs_1.length; _f++) {
                var prop = vlOnlyMarkSpecificConfigs_1[_f];
                delete config[markType][prop];
            }
        }
        redirectConfig(config, markType);
    }
    redirectConfig(config, 'title', 'group-title');
    for (var prop in config) {
        if (isObject(config[prop]) && keys$1(config[prop]).length === 0) {
            delete config[prop];
        }
    }
    return keys$1(config).length > 0 ? config : undefined;
}
function redirectConfig(config, prop, toProp) {
    var propConfig = prop === 'title' ? extractTitleConfig(config.title).mark : config[prop];
    if (prop === 'view') {
        toProp = 'cell';
    }
    var style = tslib_1.__assign({}, propConfig, config.style[prop]);
    if (keys$1(style).length > 0) {
        config.style[toProp || prop] = style;
    }
    delete config[prop];
}

var config = /*#__PURE__*/Object.freeze({
  defaultViewConfig: defaultViewConfig,
  defaultConfig: defaultConfig$1,
  initConfig: initConfig,
  stripAndRedirectConfig: stripAndRedirectConfig
});

var STACK_OFFSET_INDEX = {
    zero: 1,
    center: 1,
    normalize: 1
};
function isStackOffset(s) {
    return !!STACK_OFFSET_INDEX[s];
}
var STACKABLE_MARKS = [BAR, AREA, RULE, POINT, CIRCLE, SQUARE, LINE, TEXT$1, TICK];
var STACK_BY_DEFAULT_MARKS = [BAR, AREA];
function potentialStackedChannel(encoding) {
    var xDef = encoding.x;
    var yDef = encoding.y;
    if (isFieldDef(xDef) && isFieldDef(yDef)) {
        if (xDef.type === 'quantitative' && yDef.type === 'quantitative') {
            if (xDef.stack) {
                return 'x';
            }
            else if (yDef.stack) {
                return 'y';
            }
            if ((!!xDef.aggregate) !== (!!yDef.aggregate)) {
                return xDef.aggregate ? 'x' : 'y';
            }
        }
        else if (xDef.type === 'quantitative') {
            return 'x';
        }
        else if (yDef.type === 'quantitative') {
            return 'y';
        }
    }
    else if (isFieldDef(xDef) && xDef.type === 'quantitative') {
        return 'x';
    }
    else if (isFieldDef(yDef) && yDef.type === 'quantitative') {
        return 'y';
    }
    return undefined;
}
function stack(m, encoding, stackConfig) {
    var mark = isMarkDef(m) ? m.type : m;
    if (!contains(STACKABLE_MARKS, mark)) {
        return null;
    }
    var fieldChannel = potentialStackedChannel(encoding);
    if (!fieldChannel) {
        return null;
    }
    var stackedFieldDef = encoding[fieldChannel];
    var stackedField = isStringFieldDef(stackedFieldDef) ? vgField(stackedFieldDef, {}) : undefined;
    var dimensionChannel = fieldChannel === 'x' ? 'y' : 'x';
    var dimensionDef = encoding[dimensionChannel];
    var dimensionField = isStringFieldDef(dimensionDef) ? vgField(dimensionDef, {}) : undefined;
    var stackBy = NONPOSITION_CHANNELS.reduce(function (sc, channel) {
        if (channelHasField(encoding, channel)) {
            var channelDef = encoding[channel];
            (isArray(channelDef) ? channelDef : [channelDef]).forEach(function (cDef) {
                var fieldDef = getFieldDef(cDef);
                if (fieldDef.aggregate) {
                    return;
                }
                var f = isStringFieldDef(fieldDef) ? vgField(fieldDef, {}) : undefined;
                if (
                !f ||
                    (f !== dimensionField && f !== stackedField)) {
                    sc.push({ channel: channel, fieldDef: fieldDef });
                }
            });
        }
        return sc;
    }, []);
    if (stackBy.length === 0) {
        return null;
    }
    var offset = undefined;
    if (stackedFieldDef.stack !== undefined) {
        offset = stackedFieldDef.stack;
    }
    else if (contains(STACK_BY_DEFAULT_MARKS, mark)) {
        offset = stackConfig === undefined ? 'zero' : stackConfig;
    }
    else {
        offset = stackConfig;
    }
    if (!offset || !isStackOffset(offset)) {
        return null;
    }
    if (stackedFieldDef.scale && stackedFieldDef.scale.type && stackedFieldDef.scale.type !== ScaleType.LINEAR) {
        warn$1(message.cannotStackNonLinearScale(stackedFieldDef.scale.type));
    }
    if (channelHasField(encoding, fieldChannel === X ? X2 : Y2)) {
        if (stackedFieldDef.stack !== undefined) {
            warn$1(message.cannotStackRangedMark(fieldChannel));
        }
        return null;
    }
    if (stackedFieldDef.aggregate && !contains(SUM_OPS, stackedFieldDef.aggregate)) {
        warn$1(message.stackNonSummativeAggregate(stackedFieldDef.aggregate));
    }
    return {
        groupbyChannel: dimensionDef ? dimensionChannel : undefined,
        fieldChannel: fieldChannel,
        impute: isPathMark(mark),
        stackBy: stackBy,
        offset: offset
    };
}

var stack$1 = /*#__PURE__*/Object.freeze({
  isStackOffset: isStackOffset,
  STACKABLE_MARKS: STACKABLE_MARKS,
  STACK_BY_DEFAULT_MARKS: STACK_BY_DEFAULT_MARKS,
  stack: stack
});

function isFacetSpec(spec) {
    return spec['facet'] !== undefined;
}
function isUnitSpec(spec) {
    return !!spec['mark'];
}
function isLayerSpec(spec) {
    return spec['layer'] !== undefined;
}
function isRepeatSpec(spec) {
    return spec['repeat'] !== undefined;
}
function isConcatSpec(spec) {
    return isVConcatSpec(spec) || isHConcatSpec(spec);
}
function isVConcatSpec(spec) {
    return spec['vconcat'] !== undefined;
}
function isHConcatSpec(spec) {
    return spec['hconcat'] !== undefined;
}
function normalize$2(spec, config) {
    if (isFacetSpec(spec)) {
        return normalizeFacet(spec, config);
    }
    if (isLayerSpec(spec)) {
        return normalizeLayer(spec, config);
    }
    if (isRepeatSpec(spec)) {
        return normalizeRepeat(spec, config);
    }
    if (isVConcatSpec(spec)) {
        return normalizeVConcat(spec, config);
    }
    if (isHConcatSpec(spec)) {
        return normalizeHConcat(spec, config);
    }
    if (isUnitSpec(spec)) {
        var hasRow = channelHasField(spec.encoding, ROW);
        var hasColumn = channelHasField(spec.encoding, COLUMN);
        if (hasRow || hasColumn) {
            return normalizeFacetedUnit(spec, config);
        }
        return normalizeNonFacetUnit(spec, config);
    }
    throw new Error(message.INVALID_SPEC);
}
function normalizeFacet(spec, config) {
    var subspec = spec.spec, rest = tslib_1.__rest(spec, ["spec"]);
    return tslib_1.__assign({}, rest, {
        spec: normalize$2(subspec, config) });
}
function mergeEncoding(opt) {
    var parentEncoding = opt.parentEncoding, encoding = opt.encoding;
    if (parentEncoding && encoding) {
        var overriden = keys$1(parentEncoding).reduce(function (o, key$$1) {
            if (encoding[key$$1]) {
                o.push(key$$1);
            }
            return o;
        }, []);
        if (overriden.length > 0) {
            warn$1(message.encodingOverridden(overriden));
        }
    }
    var merged = tslib_1.__assign({}, (parentEncoding || {}), (encoding || {}));
    return keys$1(merged).length > 0 ? merged : undefined;
}
function mergeProjection(opt) {
    var parentProjection = opt.parentProjection, projection = opt.projection;
    if (parentProjection && projection) {
        warn$1(message.projectionOverridden({ parentProjection: parentProjection, projection: projection }));
    }
    return projection || parentProjection;
}
function normalizeLayer(spec, config, parentEncoding, parentProjection) {
    var layer = spec.layer, encoding = spec.encoding, projection = spec.projection, rest = tslib_1.__rest(spec, ["layer", "encoding", "projection"]);
    var mergedEncoding = mergeEncoding({ parentEncoding: parentEncoding, encoding: encoding });
    var mergedProjection = mergeProjection({ parentProjection: parentProjection, projection: projection });
    return tslib_1.__assign({}, rest, { layer: layer.map(function (subspec) {
            if (isLayerSpec(subspec)) {
                return normalizeLayer(subspec, config, mergedEncoding, mergedProjection);
            }
            return normalizeNonFacetUnit(subspec, config, mergedEncoding, mergedProjection);
        }) });
}
function normalizeRepeat(spec, config) {
    var subspec = spec.spec, rest = tslib_1.__rest(spec, ["spec"]);
    return tslib_1.__assign({}, rest, { spec: normalize$2(subspec, config) });
}
function normalizeVConcat(spec, config) {
    var vconcat = spec.vconcat, rest = tslib_1.__rest(spec, ["vconcat"]);
    return tslib_1.__assign({}, rest, { vconcat: vconcat.map(function (subspec) { return normalize$2(subspec, config); }) });
}
function normalizeHConcat(spec, config) {
    var hconcat = spec.hconcat, rest = tslib_1.__rest(spec, ["hconcat"]);
    return tslib_1.__assign({}, rest, { hconcat: hconcat.map(function (subspec) { return normalize$2(subspec, config); }) });
}
function normalizeFacetedUnit(spec, config) {
    var _a = spec.encoding, row = _a.row, column = _a.column, encoding = tslib_1.__rest(_a, ["row", "column"]);
    var mark = spec.mark, width = spec.width, projection = spec.projection, height = spec.height, selection = spec.selection, _$$1 = spec.encoding, outerSpec = tslib_1.__rest(spec, ["mark", "width", "projection", "height", "selection", "encoding"]);
    return tslib_1.__assign({}, outerSpec, { facet: tslib_1.__assign({}, (row ? { row: row } : {}), (column ? { column: column } : {})), spec: normalizeNonFacetUnit(tslib_1.__assign({}, (projection ? { projection: projection } : {}), { mark: mark }, (width ? { width: width } : {}), (height ? { height: height } : {}), { encoding: encoding }, (selection ? { selection: selection } : {})), config) });
}
function isNonFacetUnitSpecWithPrimitiveMark(spec) {
    return isPrimitiveMark(spec.mark);
}
function getPointOverlay(markDef, markConfig, encoding) {
    if (markDef.point === 'transparent') {
        return { opacity: 0 };
    }
    else if (markDef.point) {
        return isObject(markDef.point) ? markDef.point : {};
    }
    else if (markDef.point !== undefined) {
        return null;
    }
    else {
        if (markConfig.point || encoding.shape) {
            return isObject(markConfig.point) ? markConfig.point : {};
        }
        return null;
    }
}
function getLineOverlay(markDef, markConfig) {
    if (markDef.line) {
        return markDef.line === true ? {} : markDef.line;
    }
    else if (markDef.line !== undefined) {
        return null;
    }
    else {
        if (markConfig.line) {
            return markConfig.line === true ? {} : markConfig.line;
        }
        return null;
    }
}
function normalizeNonFacetUnit(spec, config, parentEncoding, parentProjection) {
    var encoding = spec.encoding, projection = spec.projection;
    var mark = isMarkDef(spec.mark) ? spec.mark.type : spec.mark;
    if (parentEncoding || parentProjection) {
        var mergedProjection = mergeProjection({ parentProjection: parentProjection, projection: projection });
        var mergedEncoding = mergeEncoding({ parentEncoding: parentEncoding, encoding: encoding });
        return normalizeNonFacetUnit(tslib_1.__assign({}, spec, (mergedProjection ? { projection: mergedProjection } : {}), (mergedEncoding ? { encoding: mergedEncoding } : {})), config);
    }
    if (isNonFacetUnitSpecWithPrimitiveMark(spec)) {
        if (isRanged(encoding)) {
            return normalizeRangedUnit(spec);
        }
        if (mark === 'line' && (encoding.x2 || encoding.y2)) {
            warn$1(message.lineWithRange(!!encoding.x2, !!encoding.y2));
            return normalizeNonFacetUnit(tslib_1.__assign({ mark: 'rule' }, spec), config, parentEncoding, parentProjection);
        }
        if (isPathMark(mark)) {
            return normalizePathOverlay(spec, config);
        }
        return spec;
    }
    else {
        return normalize$1(spec, config);
    }
}
function normalizeRangedUnit(spec) {
    var hasX = channelHasField(spec.encoding, X);
    var hasY = channelHasField(spec.encoding, Y);
    var hasX2 = channelHasField(spec.encoding, X2);
    var hasY2 = channelHasField(spec.encoding, Y2);
    if ((hasX2 && !hasX) || (hasY2 && !hasY)) {
        var normalizedSpec = duplicate(spec);
        if (hasX2 && !hasX) {
            normalizedSpec.encoding.x = normalizedSpec.encoding.x2;
            delete normalizedSpec.encoding.x2;
        }
        if (hasY2 && !hasY) {
            normalizedSpec.encoding.y = normalizedSpec.encoding.y2;
            delete normalizedSpec.encoding.y2;
        }
        return normalizedSpec;
    }
    return spec;
}
function dropLineAndPoint(markDef) {
    var _point = markDef.point, _line = markDef.line, mark = tslib_1.__rest(markDef, ["point", "line"]);
    return keys$1(mark).length > 1 ? mark : mark.type;
}
function normalizePathOverlay(spec, config) {
    if (config === void 0) { config = {}; }
    var _a;
    var selection = spec.selection, projection = spec.projection, encoding = spec.encoding, mark = spec.mark, outerSpec = tslib_1.__rest(spec, ["selection", "projection", "encoding", "mark"]);
    var markDef = isMarkDef(mark) ? mark : { type: mark };
    var pointOverlay = getPointOverlay(markDef, config[markDef.type], encoding);
    var lineOverlay = markDef.type === 'area' && getLineOverlay(markDef, config[markDef.type]);
    if (!pointOverlay && !lineOverlay) {
        return tslib_1.__assign({}, spec, {
            mark: dropLineAndPoint(markDef) });
    }
    var layer = [tslib_1.__assign({}, (selection ? { selection: selection } : {}), {
            mark: dropLineAndPoint(tslib_1.__assign({}, markDef, (markDef.type === 'area' ? { opacity: 0.7 } : {}))),
            encoding: omit(encoding, ['shape']) })];
    var stackProps = stack(markDef, encoding, config ? config.stack : undefined);
    var overlayEncoding = encoding;
    if (stackProps) {
        var stackFieldChannel = stackProps.fieldChannel, offset = stackProps.offset;
        overlayEncoding = tslib_1.__assign({}, encoding, (_a = {}, _a[stackFieldChannel] = tslib_1.__assign({}, encoding[stackFieldChannel], (offset ? { stack: offset } : {})), _a));
    }
    if (lineOverlay) {
        layer.push(tslib_1.__assign({}, (projection ? { projection: projection } : {}), { mark: tslib_1.__assign({ type: 'line' }, pick$2(markDef, ['clip', 'interpolate']), lineOverlay), encoding: overlayEncoding }));
    }
    if (pointOverlay) {
        layer.push(tslib_1.__assign({}, (projection ? { projection: projection } : {}), { mark: tslib_1.__assign({ type: 'point', opacity: 1, filled: true }, pick$2(markDef, ['clip']), pointOverlay), encoding: overlayEncoding }));
    }
    return tslib_1.__assign({}, outerSpec, { layer: layer });
}
function accumulate(dict, defs) {
    defs.forEach(function (fieldDef) {
        var pureFieldDef = ['field', 'type', 'value', 'timeUnit', 'bin', 'aggregate'].reduce(function (f, key$$1) {
            if (fieldDef[key$$1] !== undefined) {
                f[key$$1] = fieldDef[key$$1];
            }
            return f;
        }, {});
        var key$$1 = hash(pureFieldDef);
        dict[key$$1] = dict[key$$1] || fieldDef;
    });
    return dict;
}
function fieldDefIndex(spec, dict) {
    if (dict === void 0) { dict = {}; }
    if (isLayerSpec(spec)) {
        spec.layer.forEach(function (layer) {
            if (isUnitSpec(layer)) {
                accumulate(dict, fieldDefs(layer.encoding));
            }
            else {
                fieldDefIndex(layer, dict);
            }
        });
    }
    else if (isFacetSpec(spec)) {
        accumulate(dict, fieldDefs(spec.facet));
        fieldDefIndex(spec.spec, dict);
    }
    else if (isRepeatSpec(spec)) {
        fieldDefIndex(spec.spec, dict);
    }
    else if (isConcatSpec(spec)) {
        var childSpec = isVConcatSpec(spec) ? spec.vconcat : spec.hconcat;
        childSpec.forEach(function (child) { return fieldDefIndex(child, dict); });
    }
    else {
        accumulate(dict, fieldDefs(spec.encoding));
    }
    return dict;
}
function fieldDefs$1(spec) {
    return vals(fieldDefIndex(spec));
}
function isStacked(spec, config) {
    config = config || spec.config;
    if (isPrimitiveMark(spec.mark)) {
        return stack(spec.mark, spec.encoding, config ? config.stack : undefined) !== null;
    }
    return false;
}

var spec = /*#__PURE__*/Object.freeze({
  isFacetSpec: isFacetSpec,
  isUnitSpec: isUnitSpec,
  isLayerSpec: isLayerSpec,
  isRepeatSpec: isRepeatSpec,
  isConcatSpec: isConcatSpec,
  isVConcatSpec: isVConcatSpec,
  isHConcatSpec: isHConcatSpec,
  normalize: normalize$2,
  fieldDefs: fieldDefs$1,
  isStacked: isStacked
});

function extractCompositionLayout(layout) {
    var _a = layout || {}, _b = _a.align, align = _b === void 0 ? undefined : _b, _c = _a.center, center = _c === void 0 ? undefined : _c, _d = _a.bounds, bounds = _d === void 0 ? undefined : _d, _e = _a.spacing, spacing = _e === void 0 ? undefined : _e;
    return { align: align, bounds: bounds, center: center, spacing: spacing };
}
function _normalizeAutoSize(autosize) {
    return isString(autosize) ? { type: autosize } : autosize || {};
}
function normalizeAutoSize(topLevelAutosize, configAutosize, isUnitOrLayer) {
    if (isUnitOrLayer === void 0) { isUnitOrLayer = true; }
    var autosize = tslib_1.__assign({ type: 'pad' }, _normalizeAutoSize(configAutosize), _normalizeAutoSize(topLevelAutosize));
    if (autosize.type === 'fit') {
        if (!isUnitOrLayer) {
            warn$1(message.FIT_NON_SINGLE);
            autosize.type = 'pad';
        }
    }
    return autosize;
}
var TOP_LEVEL_PROPERTIES = [
    'background', 'padding', 'datasets'
];
function extractTopLevelProperties(t) {
    return TOP_LEVEL_PROPERTIES.reduce(function (o, p) {
        if (t && t[p] !== undefined) {
            o[p] = t[p];
        }
        return o;
    }, {});
}

function isUrlData(data) {
    return !!data['url'];
}
function isInlineData(data) {
    return !!data['values'];
}
function isNamedData(data) {
    return !!data['name'] && !isUrlData(data) && !isInlineData(data);
}
var MAIN = 'main';
var RAW = 'raw';

var data$2 = /*#__PURE__*/Object.freeze({
  isUrlData: isUrlData,
  isInlineData: isInlineData,
  isNamedData: isNamedData,
  MAIN: MAIN,
  RAW: RAW
});

function isVgSignalRef(o) {
    return !!o['signal'];
}
function isVgRangeStep(range) {
    return !!range['step'];
}
function isDataRefUnionedDomain(domain) {
    if (!isArray(domain)) {
        return 'fields' in domain && !('data' in domain);
    }
    return false;
}
function isFieldRefUnionDomain(domain) {
    if (!isArray(domain)) {
        return 'fields' in domain && 'data' in domain;
    }
    return false;
}
function isDataRefDomain(domain) {
    if (!isArray(domain)) {
        return 'field' in domain && 'data' in domain;
    }
    return false;
}
var VG_MARK_CONFIG_INDEX = {
    opacity: 1,
    fill: 1,
    fillOpacity: 1,
    stroke: 1,
    strokeCap: 1,
    strokeWidth: 1,
    strokeOpacity: 1,
    strokeDash: 1,
    strokeDashOffset: 1,
    strokeJoin: 1,
    strokeMiterLimit: 1,
    size: 1,
    shape: 1,
    interpolate: 1,
    tension: 1,
    orient: 1,
    align: 1,
    baseline: 1,
    text: 1,
    dir: 1,
    dx: 1,
    dy: 1,
    ellipsis: 1,
    limit: 1,
    radius: 1,
    theta: 1,
    angle: 1,
    font: 1,
    fontSize: 1,
    fontWeight: 1,
    fontStyle: 1,
    cursor: 1,
    href: 1,
    tooltip: 1,
    cornerRadius: 1,
};
var VG_MARK_CONFIGS = flagKeys(VG_MARK_CONFIG_INDEX);

function assembleTitle(title$$1, config) {
    if (isArray(title$$1)) {
        return title$$1.map(function (fieldDef) { return title(fieldDef, config); }).join(', ');
    }
    return title$$1;
}
function assembleAxis(axisCmpt, kind, config, opt) {
    if (opt === void 0) { opt = { header: false }; }
    var _a = axisCmpt.combine(), orient = _a.orient, scale = _a.scale, title$$1 = _a.title, zindex = _a.zindex, axis = tslib_1.__rest(_a, ["orient", "scale", "title", "zindex"]);
    keys$1(axis).forEach(function (key$$1) {
        var propType = AXIS_PROPERTY_TYPE[key$$1];
        if (propType && propType !== kind && propType !== 'both') {
            delete axis[key$$1];
        }
    });
    if (kind === 'grid') {
        if (!axis.grid) {
            return undefined;
        }
        if (axis.encode) {
            var grid = axis.encode.grid;
            axis.encode = tslib_1.__assign({}, (grid ? { grid: grid } : {}));
            if (keys$1(axis.encode).length === 0) {
                delete axis.encode;
            }
        }
        return tslib_1.__assign({ scale: scale,
            orient: orient }, axis, { domain: false, labels: false,
            maxExtent: 0, minExtent: 0, ticks: false, zindex: zindex !== undefined ? zindex : 0
         });
    }
    else {
        if (!opt.header && axisCmpt.mainExtracted) {
            return undefined;
        }
        if (axis.encode) {
            for (var _i = 0, AXIS_PARTS_1 = AXIS_PARTS; _i < AXIS_PARTS_1.length; _i++) {
                var part = AXIS_PARTS_1[_i];
                if (!axisCmpt.hasAxisPart(part)) {
                    delete axis.encode[part];
                }
            }
            if (keys$1(axis.encode).length === 0) {
                delete axis.encode;
            }
        }
        var titleString = assembleTitle(title$$1, config);
        return tslib_1.__assign({ scale: scale,
            orient: orient, grid: false }, (titleString ? { title: titleString } : {}), axis, { zindex: zindex !== undefined ? zindex : 1
         });
    }
}
function assembleAxes(axisComponents, config) {
    var _a = axisComponents.x, x = _a === void 0 ? [] : _a, _b = axisComponents.y, y = _b === void 0 ? [] : _b;
    return x.map(function (a) { return assembleAxis(a, 'main', config); }).concat(x.map(function (a) { return assembleAxis(a, 'grid', config); }), y.map(function (a) { return assembleAxis(a, 'main', config); }), y.map(function (a) { return assembleAxis(a, 'grid', config); })).filter(function (a) { return a; });
}

var HEADER_TITLE_PROPERTIES_MAP = {
    titleAnchor: 'anchor',
    titleAngle: 'angle',
    titleBaseline: 'baseline',
    titleColor: 'color',
    titleFont: 'font',
    titleFontSize: 'fontSize',
    titleFontWeight: 'fontWeight',
    titleLimit: 'limit'
};
var HEADER_LABEL_PROPERTIES_MAP = {
    labelAngle: 'angle',
    labelColor: 'color',
    labelFont: 'font',
    labelFontSize: 'fontSize',
    labelLimit: 'limit',
};
var HEADER_TITLE_PROPERTIES = Object.keys(HEADER_TITLE_PROPERTIES_MAP);
var HEADER_LABEL_PROPERTIES = Object.keys(HEADER_LABEL_PROPERTIES_MAP);

var header = /*#__PURE__*/Object.freeze({
  HEADER_TITLE_PROPERTIES_MAP: HEADER_TITLE_PROPERTIES_MAP,
  HEADER_LABEL_PROPERTIES_MAP: HEADER_LABEL_PROPERTIES_MAP,
  HEADER_TITLE_PROPERTIES: HEADER_TITLE_PROPERTIES,
  HEADER_LABEL_PROPERTIES: HEADER_LABEL_PROPERTIES
});

function isSortField(sort) {
    return !!sort && (sort['op'] === 'count' || !!sort['field']) && !!sort['op'];
}
function isSortArray(sort) {
    return !!sort && isArray(sort);
}

var sort$1 = /*#__PURE__*/Object.freeze({
  isSortField: isSortField,
  isSortArray: isSortArray
});

function position$1(channel, channelDef, scaleName, scale, stack, defaultRef) {
    if (isFieldDef(channelDef) && stack && channel === stack.fieldChannel) {
        return fieldRef$2(channelDef, scaleName, { suffix: 'end' });
    }
    return midPoint(channel, channelDef, scaleName, scale, stack, defaultRef);
}
function position2(channel, aFieldDef, a2fieldDef, scaleName, scale, stack, defaultRef) {
    if (isFieldDef(aFieldDef) && stack &&
        channel.charAt(0) === stack.fieldChannel.charAt(0)) {
        return fieldRef$2(aFieldDef, scaleName, { suffix: 'start' });
    }
    return midPoint(channel, a2fieldDef, scaleName, scale, stack, defaultRef);
}
function getOffset(channel, markDef) {
    var offsetChannel = channel + 'Offset';
    var markDefOffsetValue = markDef[offsetChannel];
    if (markDefOffsetValue) {
        return markDefOffsetValue;
    }
    return undefined;
}
function bin$4(fieldDef, scaleName, side, offset) {
    var binSuffix = side === 'start' ? undefined : 'end';
    return fieldRef$2(fieldDef, scaleName, { binSuffix: binSuffix }, offset ? { offset: offset } : {});
}
function fieldRef$2(fieldDef, scaleName, opt, mixins) {
    var ref = tslib_1.__assign({}, (scaleName ? { scale: scaleName } : {}), { field: vgField(fieldDef, opt) });
    if (mixins) {
        return tslib_1.__assign({}, ref, mixins);
    }
    return ref;
}
function bandRef(scaleName, band) {
    if (band === void 0) { band = true; }
    return {
        scale: scaleName,
        band: band
    };
}
function binMidSignal(fieldDef, scaleName) {
    return {
        signal: "(" +
            ("scale(\"" + scaleName + "\", " + vgField(fieldDef, { expr: 'datum' }) + ")") +
            " + " +
            ("scale(\"" + scaleName + "\", " + vgField(fieldDef, { binSuffix: 'end', expr: 'datum' }) + ")") +
            ")/2"
    };
}
function midPoint(channel, channelDef, scaleName, scale, stack, defaultRef) {
    if (channelDef) {
        if (isFieldDef(channelDef)) {
            if (channelDef.bin) {
                if (contains([X, Y], channel) && channelDef.type === QUANTITATIVE) {
                    if (stack && stack.impute) {
                        return fieldRef$2(channelDef, scaleName, { binSuffix: 'mid' });
                    }
                    return binMidSignal(channelDef, scaleName);
                }
                return fieldRef$2(channelDef, scaleName, binRequiresRange(channelDef, channel) ? { binSuffix: 'range' } : {});
            }
            if (scale) {
                var scaleType = scale.get('type');
                if (hasDiscreteDomain(scaleType)) {
                    if (scaleType === 'band') {
                        return fieldRef$2(channelDef, scaleName, { binSuffix: 'range' }, { band: 0.5 });
                    }
                    return fieldRef$2(channelDef, scaleName, { binSuffix: 'range' });
                }
            }
            return fieldRef$2(channelDef, scaleName, {});
        }
        else if (isValueDef(channelDef)) {
            var value = channelDef.value;
            if (contains(['x', 'x2'], channel) && value === 'width') {
                return { field: { group: 'width' } };
            }
            else if (contains(['y', 'y2'], channel) && value === 'height') {
                return { field: { group: 'height' } };
            }
            return { value: value };
        }
    }
    return isFunction(defaultRef) ? defaultRef() : defaultRef;
}
function text$1(textDef, config) {
    if (textDef) {
        if (isFieldDef(textDef)) {
            return formatSignalRef(textDef, textDef.format, 'datum', config);
        }
        else if (isValueDef(textDef)) {
            return { value: textDef.value };
        }
    }
    return undefined;
}
function mid(sizeRef) {
    return tslib_1.__assign({}, sizeRef, { mult: 0.5 });
}
function domainDefinitelyIncludeZero(scale) {
    if (scale.get('zero') !== false) {
        return true;
    }
    var domains = scale.domains;
    if (isArray(domains)) {
        return some(domains, function (d) { return isArray(d) && d.length === 2 && d[0] <= 0 && d[1] >= 0; });
    }
    return false;
}
function getDefaultRef(defaultRef, channel, scaleName, scale, mark) {
    return function () {
        if (isString(defaultRef)) {
            if (scaleName) {
                var scaleType = scale.get('type');
                if (contains([ScaleType.LOG, ScaleType.TIME, ScaleType.UTC], scaleType)) {
                    if (mark === 'bar' || mark === 'area') {
                        warn$1(message.nonZeroScaleUsedWithLengthMark(mark, channel, { scaleType: scaleType }));
                    }
                }
                else {
                    if (domainDefinitelyIncludeZero(scale)) {
                        return {
                            scale: scaleName,
                            value: 0
                        };
                    }
                    if (mark === 'bar' || mark === 'area') {
                        warn$1(message.nonZeroScaleUsedWithLengthMark(mark, channel, { zeroFalse: scale.explicit.zero === false }));
                    }
                }
            }
            if (defaultRef === 'zeroOrMin') {
                return channel === 'x' ? { value: 0 } : { field: { group: 'height' } };
            }
            else {
                return channel === 'x' ? { field: { group: 'width' } } : { value: 0 };
            }
        }
        return defaultRef;
    };
}

function color$2(model, opt) {
    if (opt === void 0) { opt = { valueOnly: false }; }
    var _a, _b;
    var markDef = model.markDef, encoding = model.encoding, config = model.config;
    var filled = markDef.filled, markType = markDef.type;
    var configValue = {
        fill: getMarkConfig('fill', markDef, config),
        stroke: getMarkConfig('stroke', markDef, config),
        color: getMarkConfig('color', markDef, config)
    };
    var transparentIfNeeded = contains(['bar', 'point', 'circle', 'square', 'geoshape'], markType) ? 'transparent' : undefined;
    var defaultValue = {
        fill: markDef.fill || configValue.fill ||
            transparentIfNeeded,
        stroke: markDef.stroke || configValue.stroke
    };
    var colorVgChannel = filled ? 'fill' : 'stroke';
    var fillStrokeMarkDefAndConfig = tslib_1.__assign({}, (defaultValue.fill ? {
        fill: { value: defaultValue.fill }
    } : {}), (defaultValue.stroke ? {
        stroke: { value: defaultValue.stroke }
    } : {}));
    if (encoding.fill || encoding.stroke) {
        if (markDef.color) {
            warn$1(message.droppingColor('property', { fill: 'fill' in encoding, stroke: 'stroke' in encoding }));
        }
        return tslib_1.__assign({}, nonPosition('fill', model, { defaultValue: defaultValue.fill || transparentIfNeeded }), nonPosition('stroke', model, { defaultValue: defaultValue.stroke }));
    }
    else if (encoding.color) {
        return tslib_1.__assign({}, fillStrokeMarkDefAndConfig, nonPosition('color', model, {
            vgChannel: colorVgChannel,
            defaultValue: markDef[colorVgChannel] || markDef.color || configValue[colorVgChannel] || configValue.color || (filled ? transparentIfNeeded : undefined)
        }));
    }
    else if (markDef.fill || markDef.stroke) {
        if (markDef.color) {
            warn$1(message.droppingColor('property', { fill: 'fill' in markDef, stroke: 'stroke' in markDef }));
        }
        return fillStrokeMarkDefAndConfig;
    }
    else if (markDef.color) {
        return tslib_1.__assign({}, fillStrokeMarkDefAndConfig, (_a = {}, _a[colorVgChannel] = { value: markDef.color }, _a));
    }
    else if (configValue.fill || configValue.stroke) {
        return fillStrokeMarkDefAndConfig;
    }
    else if (configValue.color) {
        return tslib_1.__assign({}, (transparentIfNeeded ? { fill: { value: 'transparent' } } : {}), (_b = {}, _b[colorVgChannel] = { value: configValue.color }, _b));
    }
    return {};
}
function baseEncodeEntry(model, ignore) {
    return tslib_1.__assign({}, markDefProperties(model.markDef, ignore), color$2(model), nonPosition('opacity', model), tooltip$1(model), text$2(model, 'href'));
}
function markDefProperties(mark, ignore) {
    return VG_MARK_CONFIGS.reduce(function (m, prop) {
        if (mark[prop] !== undefined && ignore[prop] !== 'ignore') {
            m[prop] = { value: mark[prop] };
        }
        return m;
    }, {});
}
function valueIfDefined(prop, value) {
    var _a;
    if (value !== undefined) {
        return _a = {}, _a[prop] = { value: value }, _a;
    }
    return undefined;
}
function validPredicate(vgRef) {
    return vgRef + " !== null && !isNaN(" + vgRef + ")";
}
function defined$1(model) {
    if (model.config.invalidValues === 'filter') {
        var fields = ['x', 'y'].map(function (channel) {
            var scaleComponent = model.getScaleComponent(channel);
            if (scaleComponent) {
                var scaleType = scaleComponent.get('type');
                if (hasContinuousDomain(scaleType)) {
                    return model.vgField(channel, { expr: 'datum' });
                }
            }
            return undefined;
        })
            .filter(function (field$$1) { return !!field$$1; })
            .map(validPredicate);
        if (fields.length > 0) {
            return {
                defined: { signal: fields.join(' && ') }
            };
        }
    }
    return {};
}
function nonPosition(channel, model, opt) {
    if (opt === void 0) { opt = {}; }
    var defaultValue = opt.defaultValue, vgChannel = opt.vgChannel;
    var defaultRef = opt.defaultRef || (defaultValue !== undefined ? { value: defaultValue } : undefined);
    var channelDef = model.encoding[channel];
    return wrapCondition(model, channelDef, vgChannel || channel, function (cDef) {
        return midPoint(channel, cDef, model.scaleName(channel), model.getScaleComponent(channel), null,
        defaultRef);
    });
}
function wrapCondition(model, channelDef, vgChannel, refFn) {
    var _a, _b;
    var condition = channelDef && channelDef.condition;
    var valueRef = refFn(channelDef);
    if (condition) {
        var conditions = isArray(condition) ? condition : [condition];
        var vgConditions = conditions.map(function (c) {
            var conditionValueRef = refFn(c);
            var test = isConditionalSelection(c) ? selectionPredicate(model, c.selection) : expression$3(model, c.test);
            return tslib_1.__assign({ test: test }, conditionValueRef);
        });
        return _a = {},
            _a[vgChannel] = vgConditions.concat((valueRef !== undefined ? [valueRef] : [])),
            _a;
    }
    else {
        return valueRef !== undefined ? (_b = {}, _b[vgChannel] = valueRef, _b) : {};
    }
}
function tooltip$1(model) {
    var channel = 'tooltip';
    var channelDef = model.encoding[channel];
    if (isArray(channelDef)) {
        var keyValues = channelDef.map(function (fieldDef) {
            var key$$1 = fieldDef.title !== undefined ? fieldDef.title : vgField(fieldDef, { binSuffix: 'range' });
            var value = text$1(fieldDef, model.config).signal;
            return "\"" + key$$1 + "\": " + value;
        });
        return { tooltip: { signal: "{" + keyValues.join(', ') + "}" } };
    }
    else {
        return textCommon(model, channel, channelDef);
    }
}
function text$2(model, channel) {
    if (channel === void 0) { channel = 'text'; }
    var channelDef = model.encoding[channel];
    return textCommon(model, channel, channelDef);
}
function textCommon(model, channel, channelDef) {
    return wrapCondition(model, channelDef, channel, function (cDef) { return text$1(cDef, model.config); });
}
function bandPosition(fieldDef, channel, model) {
    var _a, _b, _c;
    var scaleName = model.scaleName(channel);
    var sizeChannel = channel === 'x' ? 'width' : 'height';
    if (model.encoding.size || model.markDef.size !== undefined) {
        var orient = model.markDef.orient;
        if (orient) {
            var centeredBandPositionMixins = (_a = {},
                _a[channel + 'c'] = fieldRef$2(fieldDef, scaleName, {}, { band: 0.5 }),
                _a);
            if (getFieldDef(model.encoding.size)) {
                return tslib_1.__assign({}, centeredBandPositionMixins, nonPosition('size', model, { vgChannel: sizeChannel }));
            }
            else if (isValueDef(model.encoding.size)) {
                return tslib_1.__assign({}, centeredBandPositionMixins, nonPosition('size', model, { vgChannel: sizeChannel }));
            }
            else if (model.markDef.size !== undefined) {
                return tslib_1.__assign({}, centeredBandPositionMixins, (_b = {}, _b[sizeChannel] = { value: model.markDef.size }, _b));
            }
        }
        else {
            warn$1(message.cannotApplySizeToNonOrientedMark(model.markDef.type));
        }
    }
    return _c = {},
        _c[channel] = fieldRef$2(fieldDef, scaleName, { binSuffix: 'range' }),
        _c[sizeChannel] = bandRef(scaleName),
        _c;
}
function centeredBandPosition(channel, model, defaultPosRef, defaultSizeRef) {
    var centerChannel = channel === 'x' ? 'xc' : 'yc';
    var sizeChannel = channel === 'x' ? 'width' : 'height';
    return tslib_1.__assign({}, pointPosition(channel, model, defaultPosRef, centerChannel), nonPosition('size', model, { defaultRef: defaultSizeRef, vgChannel: sizeChannel }));
}
function binnedPosition(fieldDef, channel, scaleName, spacing, reverse) {
    if (channel === 'x') {
        return {
            x2: bin$4(fieldDef, scaleName, 'start', reverse ? 0 : spacing),
            x: bin$4(fieldDef, scaleName, 'end', reverse ? spacing : 0)
        };
    }
    else {
        return {
            y2: bin$4(fieldDef, scaleName, 'start', reverse ? spacing : 0),
            y: bin$4(fieldDef, scaleName, 'end', reverse ? 0 : spacing)
        };
    }
}
function pointPosition(channel, model, defaultRef, vgChannel) {
    var _a;
    var encoding = model.encoding, mark = model.mark, stack = model.stack;
    var channelDef = encoding[channel];
    var scaleName = model.scaleName(channel);
    var scale = model.getScaleComponent(channel);
    var offset = getOffset(channel, model.markDef);
    var valueRef = !channelDef && (encoding.latitude || encoding.longitude) ?
        { field: model.getName(channel) } : tslib_1.__assign({}, position$1(channel, encoding[channel], scaleName, scale, stack, getDefaultRef(defaultRef, channel, scaleName, scale, mark)), (offset ? { offset: offset } : {}));
    return _a = {},
        _a[vgChannel || channel] = valueRef,
        _a;
}
function pointPosition2(model, defaultRef, channel) {
    var _a;
    var encoding = model.encoding, mark = model.mark, stack = model.stack;
    var baseChannel = channel === 'x2' ? 'x' : 'y';
    var channelDef = encoding[baseChannel];
    var scaleName = model.scaleName(baseChannel);
    var scale = model.getScaleComponent(baseChannel);
    var offset = getOffset(channel, model.markDef);
    var valueRef = !channelDef && (encoding.latitude || encoding.longitude) ?
        { field: model.getName(channel) } : tslib_1.__assign({}, position2(channel, channelDef, encoding[channel], scaleName, scale, stack, getDefaultRef(defaultRef, baseChannel, scaleName, scale, mark)), (offset ? { offset: offset } : {}));
    return _a = {}, _a[channel] = valueRef, _a;
}

function applyMarkConfig(e, model, propsList) {
    for (var _i = 0, propsList_2 = propsList; _i < propsList_2.length; _i++) {
        var property = propsList_2[_i];
        var value = getMarkConfig(property, model.markDef, model.config);
        if (value !== undefined) {
            e[property] = { value: value };
        }
    }
    return e;
}
function getStyles(mark) {
    return [].concat(mark.type, mark.style || []);
}
function getMarkConfig(prop, mark, config) {
    var value = config.mark[prop];
    var markSpecificConfig = config[mark.type];
    if (markSpecificConfig[prop] !== undefined) {
        value = markSpecificConfig[prop];
    }
    var styles = getStyles(mark);
    for (var _i = 0, styles_1 = styles; _i < styles_1.length; _i++) {
        var style = styles_1[_i];
        var styleConfig = config.style[style];
        var p = prop;
        if (styleConfig && styleConfig[p] !== undefined) {
            value = styleConfig[p];
        }
    }
    return value;
}
function formatSignalRef(fieldDef, specifiedFormat, expr, config) {
    var format = numberFormat(fieldDef, specifiedFormat, config);
    if (fieldDef.bin) {
        var startField = vgField(fieldDef, { expr: expr });
        var endField = vgField(fieldDef, { expr: expr, binSuffix: 'end' });
        return {
            signal: binFormatExpression(startField, endField, format, config)
        };
    }
    else if (fieldDef.type === 'quantitative') {
        return {
            signal: "" + formatExpr(vgField(fieldDef, { expr: expr, binSuffix: 'range' }), format)
        };
    }
    else if (isTimeFieldDef(fieldDef)) {
        var isUTCScale = isScaleFieldDef(fieldDef) && fieldDef['scale'] && fieldDef['scale'].type === ScaleType.UTC;
        return {
            signal: timeFormatExpression(vgField(fieldDef, { expr: expr }), fieldDef.timeUnit, specifiedFormat, config.text.shortTimeLabels, config.timeFormat, isUTCScale, true)
        };
    }
    else {
        return {
            signal: "''+" + vgField(fieldDef, { expr: expr })
        };
    }
}
function getSpecifiedOrDefaultValue(specifiedValue, defaultValue) {
    if (specifiedValue !== undefined) {
        return specifiedValue;
    }
    return defaultValue;
}
function numberFormat(fieldDef, specifiedFormat, config) {
    if (fieldDef.type === QUANTITATIVE) {
        if (specifiedFormat) {
            return specifiedFormat;
        }
        return config.numberFormat;
    }
    return undefined;
}
function formatExpr(field$$1, format) {
    return "format(" + field$$1 + ", \"" + (format || '') + "\")";
}
function numberFormatExpr(field$$1, specifiedFormat, config) {
    return formatExpr(field$$1, specifiedFormat || config.numberFormat);
}
function binFormatExpression(startField, endField, format, config) {
    return startField + " === null || isNaN(" + startField + ") ? \"null\" : " + numberFormatExpr(startField, format, config) + " + \" - \" + " + numberFormatExpr(endField, format, config);
}
function timeFormatExpression(field$$1, timeUnit, format, shortTimeLabels, timeFormatConfig, isUTCScale, alwaysReturn) {
    if (alwaysReturn === void 0) { alwaysReturn = false; }
    if (!timeUnit || format) {
        format = format || timeFormatConfig;
        if (format || alwaysReturn) {
            return (isUTCScale ? 'utc' : 'time') + "Format(" + field$$1 + ", '" + format + "')";
        }
        else {
            return undefined;
        }
    }
    else {
        return formatExpression(timeUnit, field$$1, shortTimeLabels, isUTCScale);
    }
}
function sortParams(orderDef, fieldRefOption) {
    return (isArray(orderDef) ? orderDef : [orderDef]).reduce(function (s, orderChannelDef) {
        s.field.push(vgField(orderChannelDef, fieldRefOption));
        s.order.push(orderChannelDef.sort || 'ascending');
        return s;
    }, { field: [], order: [] });
}
function mergeTitleFieldDefs(f1, f2) {
    var merged = f1.slice();
    f2.forEach(function (fdToMerge) {
        for (var _i = 0, merged_1 = merged; _i < merged_1.length; _i++) {
            var fieldDef1 = merged_1[_i];
            if (stringify$1(fieldDef1) === stringify$1(fdToMerge)) {
                return;
            }
        }
        merged.push(fdToMerge);
    });
    return merged;
}
function mergeTitle(title1, title2) {
    return title1 === title2 ?
        title1 :
        title1 + ', ' + title2;
}
function mergeTitleComponent(v1, v2) {
    if (isArray(v1.value) && isArray(v2.value)) {
        return {
            explicit: v1.explicit,
            value: mergeTitleFieldDefs(v1.value, v2.value)
        };
    }
    else if (!isArray(v1.value) && !isArray(v2.value)) {
        return {
            explicit: v1.explicit,
            value: mergeTitle(v1.value, v2.value)
        };
    }
    throw new Error('It should never reach here');
}
function binRequiresRange(fieldDef, channel) {
    if (!fieldDef.bin) {
        console.warn('Only use this method with binned field defs');
        return false;
    }
    return isScaleChannel(channel) && contains(['ordinal', 'nominal'], fieldDef.type);
}
function guideEncodeEntry(encoding, model) {
    return keys$1(encoding).reduce(function (encode, channel) {
        var valueDef = encoding[channel];
        return tslib_1.__assign({}, encode, wrapCondition(model, valueDef, channel, function (x) { return ({ value: x.value }); }));
    }, {});
}

var DataFlowNode =               (function () {
    function DataFlowNode(parent, debugName) {
        this.debugName = debugName;
        this._children = [];
        this._parent = null;
        if (parent) {
            this.parent = parent;
        }
    }
    DataFlowNode.prototype.clone = function () {
        throw new Error('Cannot clone node');
    };
    DataFlowNode.prototype.producedFields = function () {
        return {};
    };
    DataFlowNode.prototype.dependentFields = function () {
        return {};
    };
    Object.defineProperty(DataFlowNode.prototype, "parent", {
        get: function () {
            return this._parent;
        },
        set: function (parent) {
            this._parent = parent;
            parent.addChild(this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DataFlowNode.prototype, "children", {
        get: function () {
            return this._children;
        },
        enumerable: true,
        configurable: true
    });
    DataFlowNode.prototype.numChildren = function () {
        return this._children.length;
    };
    DataFlowNode.prototype.addChild = function (child) {
        this._children.push(child);
    };
    DataFlowNode.prototype.removeChild = function (oldChild) {
        this._children.splice(this._children.indexOf(oldChild), 1);
    };
    DataFlowNode.prototype.remove = function () {
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parent = this._parent;
        }
        this._parent.removeChild(this);
    };
    DataFlowNode.prototype.insertAsParentOf = function (other) {
        var parent = other.parent;
        parent.removeChild(this);
        this.parent = parent;
        other.parent = this;
    };
    DataFlowNode.prototype.swapWithParent = function () {
        var parent = this._parent;
        var newParent = parent.parent;
        for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parent = parent;
        }
        this._children = [];
        parent.removeChild(this);
        parent.parent.removeChild(parent);
        this.parent = newParent;
        parent.parent = this;
    };
    return DataFlowNode;
}());
var OutputNode =               (function (_super) {
    tslib_1.__extends(OutputNode, _super);
    function OutputNode(parent, source, type, refCounts) {
        var _this = _super.call(this, parent, source) || this;
        _this.type = type;
        _this.refCounts = refCounts;
        _this._source = _this._name = source;
        if (_this.refCounts && !(_this._name in _this.refCounts)) {
            _this.refCounts[_this._name] = 0;
        }
        return _this;
    }
    OutputNode.prototype.clone = function () {
        var cloneObj = new this.constructor;
        cloneObj.debugName = 'clone_' + this.debugName;
        cloneObj._source = this._source;
        cloneObj._name = 'clone_' + this._name;
        cloneObj.type = this.type;
        cloneObj.refCounts = this.refCounts;
        cloneObj.refCounts[cloneObj._name] = 0;
        return cloneObj;
    };
    OutputNode.prototype.getSource = function () {
        this.refCounts[this._name]++;
        return this._source;
    };
    OutputNode.prototype.isRequired = function () {
        return !!this.refCounts[this._name];
    };
    OutputNode.prototype.setSource = function (source) {
        this._source = source;
    };
    return OutputNode;
}(DataFlowNode));

var CalculateNode =               (function (_super) {
    tslib_1.__extends(CalculateNode, _super);
    function CalculateNode(parent, transform) {
        var _this = _super.call(this, parent) || this;
        _this.transform = transform;
        return _this;
    }
    CalculateNode.prototype.clone = function () {
        return new CalculateNode(null, duplicate(this.transform));
    };
    CalculateNode.parseAllForSortIndex = function (parent, model) {
        model.forEachFieldDef(function (fieldDef, channel) {
            if (!isScaleFieldDef(fieldDef)) {
                return;
            }
            if (isSortArray(fieldDef.sort)) {
                var field_1 = fieldDef.field, timeUnit_1 = fieldDef.timeUnit;
                var sort = fieldDef.sort;
                var calculate = sort.map(function (sortValue, i) {
                    return fieldFilterExpression({ field: field_1, timeUnit: timeUnit_1, equal: sortValue }) + " ? " + i + " : ";
                }).join('') + sort.length;
                parent = new CalculateNode(parent, {
                    calculate: calculate,
                    as: sortArrayIndexField(fieldDef, channel)
                });
            }
        });
        return parent;
    };
    CalculateNode.prototype.producedFields = function () {
        var out = {};
        out[this.transform.as] = true;
        return out;
    };
    CalculateNode.prototype.assemble = function () {
        return {
            type: 'formula',
            expr: this.transform.calculate,
            as: this.transform.as
        };
    };
    return CalculateNode;
}(DataFlowNode));
function sortArrayIndexField(fieldDef, channel, expr) {
    return vgField(fieldDef, { prefix: channel, suffix: 'sort_index', expr: expr });
}

var HEADER_CHANNELS = ['row', 'column'];
var HEADER_TYPES = ['header', 'footer'];
function getHeaderType(orient) {
    if (orient === 'top' || orient === 'left') {
        return 'header';
    }
    return 'footer';
}
function getTitleGroup(model, channel) {
    var title$$1 = model.component.layoutHeaders[channel].title;
    var textOrient = channel === 'row' ? 'left' : undefined;
    var config = model.config ? model.config : undefined;
    var facetFieldDef = model.component.layoutHeaders[channel].facetFieldDef ? model.component.layoutHeaders[channel].facetFieldDef : undefined;
    return {
        name: channel + "-title",
        type: 'group',
        role: channel + "-title",
        title: tslib_1.__assign({ text: title$$1, offset: 10, orient: textOrient, style: 'guide-title' }, getHeaderProperties(config, facetFieldDef, HEADER_TITLE_PROPERTIES, HEADER_TITLE_PROPERTIES_MAP))
    };
}
function getHeaderGroups(model, channel) {
    var layoutHeader = model.component.layoutHeaders[channel];
    var groups = [];
    for (var _i = 0, HEADER_TYPES_1 = HEADER_TYPES; _i < HEADER_TYPES_1.length; _i++) {
        var headerType = HEADER_TYPES_1[_i];
        if (layoutHeader[headerType]) {
            for (var _a = 0, _b = layoutHeader[headerType]; _a < _b.length; _a++) {
                var headerCmpt = _b[_a];
                groups.push(getHeaderGroup(model, channel, headerType, layoutHeader, headerCmpt));
            }
        }
    }
    return groups;
}
function labelAlign(angle) {
    angle = ((angle % 360) + 360) % 360;
    if ((angle + 90) % 180 === 0) {
        return {};
    }
    else if (angle < 90 || 270 < angle) {
        return { align: { value: 'right' } };
    }
    else if (135 <= angle && angle < 225) {
        return { align: { value: 'left' } };
    }
    return {};
}
function getSort(facetFieldDef, channel) {
    var sort = facetFieldDef.sort;
    if (isSortField(sort)) {
        return {
            field: vgField(sort, { expr: 'datum' }),
            order: sort.order || 'ascending'
        };
    }
    else if (isArray(sort)) {
        return {
            field: sortArrayIndexField(facetFieldDef, channel, 'datum'),
            order: 'ascending'
        };
    }
    else {
        return {
            field: vgField(facetFieldDef, { expr: 'datum' }),
            order: sort || 'ascending'
        };
    }
}
function getHeaderGroup(model, channel, headerType, layoutHeader, headerCmpt) {
    var _a;
    if (headerCmpt) {
        var title$$1 = null;
        var facetFieldDef = layoutHeader.facetFieldDef;
        if (facetFieldDef && headerCmpt.labels) {
            var _b = facetFieldDef.header, header = _b === void 0 ? {} : _b;
            var format = header.format, labelAngle = header.labelAngle;
            var config = model.config ? model.config : undefined;
            var update = tslib_1.__assign({}, labelAlign(labelAngle));
            title$$1 = tslib_1.__assign({ text: formatSignalRef(facetFieldDef, format, 'parent', model.config), offset: 10, orient: channel === 'row' ? 'left' : 'top', style: 'guide-label' }, getHeaderProperties(config, facetFieldDef, HEADER_LABEL_PROPERTIES, HEADER_LABEL_PROPERTIES_MAP), (keys$1(update).length > 0 ? { encode: { update: update } } : {}));
        }
        var axes = headerCmpt.axes;
        var hasAxes = axes && axes.length > 0;
        if (title$$1 || hasAxes) {
            var sizeChannel = channel === 'row' ? 'height' : 'width';
            return tslib_1.__assign({ name: model.getName(channel + "_" + headerType), type: 'group', role: channel + "-" + headerType }, (layoutHeader.facetFieldDef ? {
                from: { data: model.getName(channel + '_domain') },
                sort: getSort(facetFieldDef, channel)
            } : {}), (title$$1 ? { title: title$$1 } : {}), (headerCmpt.sizeSignal ? {
                encode: {
                    update: (_a = {},
                        _a[sizeChannel] = headerCmpt.sizeSignal,
                        _a)
                }
            } : {}), (hasAxes ? { axes: axes } : {}));
        }
    }
    return null;
}
function getHeaderProperties(config, facetFieldDef, properties, propertiesMap) {
    var props = {};
    for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
        var prop = properties_1[_i];
        if (config && config.header) {
            if (config.header[prop]) {
                props[propertiesMap[prop]] = config.header[prop];
            }
        }
        if (facetFieldDef && facetFieldDef.header) {
            if (facetFieldDef.header[prop]) {
                props[propertiesMap[prop]] = facetFieldDef.header[prop];
            }
        }
    }
    return props;
}

function assembleLayoutSignals(model) {
    return [].concat(sizeSignals(model, 'width'), sizeSignals(model, 'height'));
}
function sizeSignals(model, sizeType) {
    var channel = sizeType === 'width' ? 'x' : 'y';
    var size = model.component.layoutSize.get(sizeType);
    if (!size || size === 'merged') {
        return [];
    }
    var name = model.getSizeSignalRef(sizeType).signal;
    if (size === 'range-step') {
        var scaleComponent = model.getScaleComponent(channel);
        if (scaleComponent) {
            var type = scaleComponent.get('type');
            var range = scaleComponent.get('range');
            if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                var scaleName = model.scaleName(channel);
                if (isFacetModel(model.parent)) {
                    var parentResolve = model.parent.component.resolve;
                    if (parentResolve.scale[channel] === 'independent') {
                        return [stepSignal(scaleName, range)];
                    }
                }
                return [
                    stepSignal(scaleName, range),
                    {
                        name: name,
                        update: sizeExpr(scaleName, scaleComponent, "domain('" + scaleName + "').length")
                    }
                ];
            }
        }
        throw new Error('layout size is range step although there is no rangeStep.');
    }
    else {
        return [{
                name: name,
                value: size
            }];
    }
}
function stepSignal(scaleName, range) {
    return {
        name: scaleName + '_step',
        value: range.step,
    };
}
function sizeExpr(scaleName, scaleComponent, cardinality) {
    var type = scaleComponent.get('type');
    var padding = scaleComponent.get('padding');
    var paddingOuter = scaleComponent.get('paddingOuter');
    paddingOuter = paddingOuter !== undefined ? paddingOuter : padding;
    var paddingInner = scaleComponent.get('paddingInner');
    paddingInner = type === 'band' ?
        (paddingInner !== undefined ? paddingInner : padding) :
        1;
    return "bandspace(" + cardinality + ", " + paddingInner + ", " + paddingOuter + ") * " + scaleName + "_step";
}

function defaultScaleResolve(channel, model) {
    if (isLayerModel(model) || isFacetModel(model)) {
        return 'shared';
    }
    else if (isConcatModel(model) || isRepeatModel(model)) {
        return contains(POSITION_SCALE_CHANNELS, channel) ? 'independent' : 'shared';
    }
    throw new Error('invalid model type for resolve');
}
function parseGuideResolve(resolve, channel) {
    var channelScaleResolve = resolve.scale[channel];
    var guide = contains(POSITION_SCALE_CHANNELS, channel) ? 'axis' : 'legend';
    if (channelScaleResolve === 'independent') {
        if (resolve[guide][channel] === 'shared') {
            warn$1(message.independentScaleMeansIndependentGuide(channel));
        }
        return 'independent';
    }
    return resolve[guide][channel] || 'shared';
}

var Split =               (function () {
    function Split(explicit, implicit) {
        if (explicit === void 0) { explicit = {}; }
        if (implicit === void 0) { implicit = {}; }
        this.explicit = explicit;
        this.implicit = implicit;
    }
    Split.prototype.clone = function () {
        return new Split(duplicate(this.explicit), duplicate(this.implicit));
    };
    Split.prototype.combine = function () {
        return tslib_1.__assign({}, this.explicit, this.implicit);
    };
    Split.prototype.get = function (key) {
        return this.explicit[key] !== undefined ? this.explicit[key] : this.implicit[key];
    };
    Split.prototype.getWithExplicit = function (key) {
        if (this.explicit[key] !== undefined) {
            return { explicit: true, value: this.explicit[key] };
        }
        else if (this.implicit[key] !== undefined) {
            return { explicit: false, value: this.implicit[key] };
        }
        return { explicit: false, value: undefined };
    };
    Split.prototype.setWithExplicit = function (key, value) {
        if (value.value !== undefined) {
            this.set(key, value.value, value.explicit);
        }
    };
    Split.prototype.set = function (key, value, explicit) {
        delete this[explicit ? 'implicit' : 'explicit'][key];
        this[explicit ? 'explicit' : 'implicit'][key] = value;
        return this;
    };
    Split.prototype.copyKeyFromSplit = function (key, s) {
        if (s.explicit[key] !== undefined) {
            this.set(key, s.explicit[key], true);
        }
        else if (s.implicit[key] !== undefined) {
            this.set(key, s.implicit[key], false);
        }
    };
    Split.prototype.copyKeyFromObject = function (key, s) {
        if (s[key] !== undefined) {
            this.set(key, s[key], true);
        }
    };
    Split.prototype.copyAll = function (other) {
        for (var _i = 0, _a = keys$1(other.combine()); _i < _a.length; _i++) {
            var key = _a[_i];
            var val = other.getWithExplicit(key);
            this.setWithExplicit(key, val);
        }
    };
    return Split;
}());
function makeExplicit(value) {
    return {
        explicit: true,
        value: value
    };
}
function makeImplicit(value) {
    return {
        explicit: false,
        value: value
    };
}
function tieBreakByComparing(compare) {
    return function (v1, v2, property, propertyOf) {
        var diff = compare(v1.value, v2.value);
        if (diff > 0) {
            return v1;
        }
        else if (diff < 0) {
            return v2;
        }
        return defaultTieBreaker(v1, v2, property, propertyOf);
    };
}
function defaultTieBreaker(v1, v2, property, propertyOf) {
    if (v1.explicit && v2.explicit) {
        warn$1(message.mergeConflictingProperty(property, propertyOf, v1.value, v2.value));
    }
    return v1;
}
function mergeValuesWithExplicit(v1, v2, property, propertyOf, tieBreaker) {
    if (tieBreaker === void 0) { tieBreaker = defaultTieBreaker; }
    if (v1 === undefined || v1.value === undefined) {
        return v2;
    }
    if (v1.explicit && !v2.explicit) {
        return v1;
    }
    else if (v2.explicit && !v1.explicit) {
        return v2;
    }
    else if (stringify$1(v1.value) === stringify$1(v2.value)) {
        return v1;
    }
    else {
        return tieBreaker(v1, v2, property, propertyOf);
    }
}

var LegendComponent =               (function (_super) {
    tslib_1.__extends(LegendComponent, _super);
    function LegendComponent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return LegendComponent;
}(Split));

function symbols$1(fieldDef, symbolsSpec, model, channel, type) {
    if (type === 'gradient') {
        return undefined;
    }
    var out = tslib_1.__assign({}, applyMarkConfig({}, model, FILL_STROKE_CONFIG), color$2(model));
    switch (model.mark) {
        case BAR:
        case TICK:
        case TEXT$1:
            out.shape = { value: 'square' };
            break;
        case CIRCLE:
        case SQUARE:
            out.shape = { value: model.mark };
            break;
        case POINT:
        case LINE:
        case GEOSHAPE:
        case AREA:
            break;
    }
    var markDef = model.markDef, encoding = model.encoding;
    var filled = markDef.filled;
    if (out.fill) {
        if (channel === 'fill' || (filled && channel === COLOR)) {
            delete out.fill;
        }
        else {
            if (out.fill['field']) {
                delete out.fill;
            }
            else if (isArray(out.fill)) {
                var fill = getFirstConditionValue(encoding.fill || encoding.color) || markDef.fill || (filled && markDef.color);
                if (fill) {
                    out.fill = { value: fill };
                }
            }
        }
    }
    if (out.stroke) {
        if (channel === 'stroke' || (!filled && channel === COLOR)) {
            delete out.stroke;
        }
        else {
            if (out.stroke['field']) {
                delete out.stroke;
            }
            else if (isArray(out.stroke)) {
                var stroke = getFirstConditionValue(encoding.stroke || encoding.color) || markDef.stroke || (!filled && markDef.color);
                if (stroke) {
                    out.stroke = { value: stroke };
                }
            }
        }
    }
    if (out.fill && out.fill['value'] !== 'transparent' && !out.stroke) {
        out.stroke = { value: 'transparent' };
    }
    if (channel !== SHAPE) {
        var shape = getFirstConditionValue(encoding.shape) || markDef.shape;
        if (shape) {
            out.shape = { value: shape };
        }
    }
    if (channel !== OPACITY) {
        var opacity = getMaxValue(encoding.opacity) || markDef.opacity;
        if (opacity) {
            out.opacity = { value: opacity };
        }
    }
    out = tslib_1.__assign({}, out, symbolsSpec);
    return keys$1(out).length > 0 ? out : undefined;
}
function gradient$2(fieldDef, gradientSpec, model, channel, type) {
    var out = {};
    if (type === 'gradient') {
        var opacity = getMaxValue(model.encoding.opacity) || model.markDef.opacity;
        if (opacity) {
            out.opacity = { value: opacity };
        }
    }
    out = tslib_1.__assign({}, out, gradientSpec);
    return keys$1(out).length > 0 ? out : undefined;
}
function labels(fieldDef, labelsSpec, model, channel, type) {
    var legend = model.legend(channel);
    var config = model.config;
    var out = {};
    if (isTimeFieldDef(fieldDef)) {
        var isUTCScale = model.getScaleComponent(channel).get('type') === ScaleType.UTC;
        var expr = timeFormatExpression('datum.value', fieldDef.timeUnit, legend.format, config.legend.shortTimeLabels, config.timeFormat, isUTCScale);
        labelsSpec = tslib_1.__assign({}, (expr ? { text: { signal: expr } } : {}), labelsSpec);
    }
    out = tslib_1.__assign({}, out, labelsSpec);
    return keys$1(out).length > 0 ? out : undefined;
}
function getMaxValue(channelDef) {
    return getConditionValue(channelDef, function (v, conditionalDef) { return Math.max(v, conditionalDef.value); });
}
function getFirstConditionValue(channelDef) {
    return getConditionValue(channelDef, function (v, conditionalDef) { return v !== undefined ? v : conditionalDef.value; });
}
function getConditionValue(channelDef, reducer) {
    if (hasConditionalValueDef(channelDef)) {
        return (isArray(channelDef.condition) ? channelDef.condition : [channelDef.condition])
            .reduce(reducer, channelDef.value);
    }
    else if (isValueDef(channelDef)) {
        return channelDef.value;
    }
    return undefined;
}

var encode$2 = /*#__PURE__*/Object.freeze({
  symbols: symbols$1,
  gradient: gradient$2,
  labels: labels
});

function values$1(legend, fieldDef) {
    var vals$$1 = legend.values;
    if (vals$$1) {
        return valueArray(fieldDef, vals$$1);
    }
    return undefined;
}
function type$3(t, channel, scaleType) {
    if (isColorChannel(channel) && ((t === 'quantitative' && !isBinScale(scaleType)) ||
        (t === 'temporal' && contains(['time', 'utc'], scaleType)))) {
        return 'gradient';
    }
    return undefined;
}

function parseLegend$1(model) {
    if (isUnitModel(model)) {
        model.component.legends = parseUnitLegend(model);
    }
    else {
        model.component.legends = parseNonUnitLegend(model);
    }
}
function parseUnitLegend(model) {
    var encoding = model.encoding;
    return [COLOR, FILL, STROKE, SIZE, SHAPE, OPACITY].reduce(function (legendComponent, channel) {
        var def = encoding[channel];
        if (model.legend(channel) && model.getScaleComponent(channel) && !(isFieldDef(def) && (channel === SHAPE && def.type === GEOJSON))) {
            legendComponent[channel] = parseLegendForChannel(model, channel);
        }
        return legendComponent;
    }, {});
}
function getLegendDefWithScale(model, channel) {
    var _a;
    switch (channel) {
        case COLOR:
            var scale = model.scaleName(COLOR);
            return model.markDef.filled ? { fill: scale } : { stroke: scale };
        case FILL:
        case STROKE:
        case SIZE:
        case SHAPE:
        case OPACITY:
            return _a = {}, _a[channel] = model.scaleName(channel), _a;
    }
}
function parseLegendForChannel(model, channel) {
    var fieldDef = model.fieldDef(channel);
    var legend = model.legend(channel);
    var legendCmpt = new LegendComponent({}, getLegendDefWithScale(model, channel));
    LEGEND_PROPERTIES.forEach(function (property) {
        var value = getProperty(property, legend, channel, model);
        if (value !== undefined) {
            var explicit =
            property === 'values' ? !!legend.values :
                property === 'title' && value === model.fieldDef(channel).title ? true :
                    value === legend[property];
            if (explicit || model.config.legend[property] === undefined) {
                legendCmpt.set(property, value, explicit);
            }
        }
    });
    var legendEncoding = legend.encoding || {};
    var legendEncode = ['labels', 'legend', 'title', 'symbols', 'gradient'].reduce(function (e, part) {
        var legendEncodingPart = guideEncodeEntry(legendEncoding[part] || {}, model);
        var value = encode$2[part] ?
            encode$2[part](fieldDef, legendEncodingPart, model, channel, legendCmpt.get('type')) :
            legendEncodingPart;
        if (value !== undefined && keys$1(value).length > 0) {
            e[part] = { update: value };
        }
        return e;
    }, {});
    if (keys$1(legendEncode).length > 0) {
        legendCmpt.set('encode', legendEncode, !!legend.encoding);
    }
    return legendCmpt;
}
function getProperty(property, specifiedLegend, channel, model) {
    var fieldDef = model.fieldDef(channel);
    switch (property) {
        case 'format':
            return numberFormat(fieldDef, specifiedLegend.format, model.config);
        case 'title':
            var specifiedTitle = fieldDef.title !== undefined ? fieldDef.title :
                specifiedLegend.title || (specifiedLegend.title === undefined ? undefined : null);
            return getSpecifiedOrDefaultValue(specifiedTitle, title(fieldDef, model.config)) || undefined;
        case 'values':
            return values$1(specifiedLegend, fieldDef);
        case 'type':
            return getSpecifiedOrDefaultValue(specifiedLegend.type, type$3(fieldDef.type, channel, model.getScaleComponent(channel).get('type')));
    }
    return specifiedLegend[property];
}
function parseNonUnitLegend(model) {
    var _a = model.component, legends = _a.legends, resolve = _a.resolve;
    var _loop_1 = function (child) {
        parseLegend$1(child);
        keys$1(child.component.legends).forEach(function (channel) {
            resolve.legend[channel] = parseGuideResolve(model.component.resolve, channel);
            if (resolve.legend[channel] === 'shared') {
                legends[channel] = mergeLegendComponent(legends[channel], child.component.legends[channel]);
                if (!legends[channel]) {
                    resolve.legend[channel] = 'independent';
                    delete legends[channel];
                }
            }
        });
    };
    for (var _i = 0, _b = model.children; _i < _b.length; _i++) {
        var child = _b[_i];
        _loop_1(child);
    }
    keys$1(legends).forEach(function (channel) {
        for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (!child.component.legends[channel]) {
                continue;
            }
            if (resolve.legend[channel] === 'shared') {
                delete child.component.legends[channel];
            }
        }
    });
    return legends;
}
function mergeLegendComponent(mergedLegend, childLegend) {
    if (!mergedLegend) {
        return childLegend.clone();
    }
    var mergedOrient = mergedLegend.getWithExplicit('orient');
    var childOrient = childLegend.getWithExplicit('orient');
    if (mergedOrient.explicit && childOrient.explicit && mergedOrient.value !== childOrient.value) {
        return undefined;
    }
    var typeMerged = false;
    var _loop_2 = function (prop) {
        var mergedValueWithExplicit = mergeValuesWithExplicit(mergedLegend.getWithExplicit(prop), childLegend.getWithExplicit(prop), prop, 'legend',
        function (v1, v2) {
            switch (prop) {
                case 'title':
                    return mergeTitleComponent(v1, v2);
                case 'type':
                    typeMerged = true;
                    return makeImplicit('symbol');
            }
            return defaultTieBreaker(v1, v2, prop, 'legend');
        });
        mergedLegend.setWithExplicit(prop, mergedValueWithExplicit);
    };
    for (var _i = 0, VG_LEGEND_PROPERTIES_1 = VG_LEGEND_PROPERTIES; _i < VG_LEGEND_PROPERTIES_1.length; _i++) {
        var prop = VG_LEGEND_PROPERTIES_1[_i];
        _loop_2(prop);
    }
    if (typeMerged) {
        if (((mergedLegend.implicit || {}).encode || {}).gradient) {
            deleteNestedProperty(mergedLegend.implicit, ['encode', 'gradient']);
        }
        if (((mergedLegend.explicit || {}).encode || {}).gradient) {
            deleteNestedProperty(mergedLegend.explicit, ['encode', 'gradient']);
        }
    }
    return mergedLegend;
}

function assembleLegends(model) {
    var legendComponentIndex = model.component.legends;
    var legendByDomain = {};
    for (var _i = 0, _a = keys$1(legendComponentIndex); _i < _a.length; _i++) {
        var channel = _a[_i];
        var scaleComponent = model.getScaleComponent(channel);
        var domainHash = stringify$1(scaleComponent.domains);
        if (legendByDomain[domainHash]) {
            for (var _b = 0, _c = legendByDomain[domainHash]; _b < _c.length; _b++) {
                var mergedLegendComponent = _c[_b];
                var merged = mergeLegendComponent(mergedLegendComponent, legendComponentIndex[channel]);
                if (!merged) {
                    legendByDomain[domainHash].push(legendComponentIndex[channel]);
                }
            }
        }
        else {
            legendByDomain[domainHash] = [legendComponentIndex[channel].clone()];
        }
    }
    return flatten(vals(legendByDomain)).map(function (legendCmpt) { return legendCmpt.combine(); });
}

function assembleProjections(model) {
    if (isLayerModel(model) || isConcatModel(model) || isRepeatModel(model)) {
        return assembleProjectionsForModelAndChildren(model);
    }
    else {
        return assembleProjectionForModel(model);
    }
}
function assembleProjectionsForModelAndChildren(model) {
    return model.children.reduce(function (projections, child) {
        return projections.concat(child.assembleProjections());
    }, assembleProjectionForModel(model));
}
function assembleProjectionForModel(model) {
    var component = model.component.projection;
    if (!component || component.merged) {
        return [];
    }
    var projection = component.combine();
    var name = projection.name, rest = tslib_1.__rest(projection, ["name"]);
    var size = {
        signal: "[" + component.size.map(function (ref) { return ref.signal; }).join(', ') + "]"
    };
    var fit = component.data.reduce(function (sources, data) {
        var source = isVgSignalRef(data) ? data.signal : "data('" + model.lookupDataSource(data) + "')";
        if (!contains(sources, source)) {
            sources.push(source);
        }
        return sources;
    }, []);
    if (fit.length <= 0) {
        throw new Error("Projection's fit didn't find any data sources");
    }
    return [tslib_1.__assign({ name: name,
            size: size, fit: {
                signal: fit.length > 1 ? "[" + fit.join(', ') + "]" : fit[0]
            } }, rest)];
}

var PROJECTION_PROPERTIES = [
    'type',
    'clipAngle',
    'clipExtent',
    'center',
    'rotate',
    'precision',
    'coefficient',
    'distance',
    'fraction',
    'lobes',
    'parallel',
    'radius',
    'ratio',
    'spacing',
    'tilt'
];

var ProjectionComponent =               (function (_super) {
    tslib_1.__extends(ProjectionComponent, _super);
    function ProjectionComponent(name, specifiedProjection, size, data) {
        var _this = _super.call(this, tslib_1.__assign({}, specifiedProjection),
        { name: name }
        ) || this;
        _this.specifiedProjection = specifiedProjection;
        _this.size = size;
        _this.data = data;
        _this.merged = false;
        return _this;
    }
    return ProjectionComponent;
}(Split));

function parseProjection$1(model) {
    if (isUnitModel(model)) {
        model.component.projection = parseUnitProjection(model);
    }
    else {
        model.component.projection = parseNonUnitProjections(model);
    }
}
function parseUnitProjection(model) {
    var specifiedProjection = model.specifiedProjection, config = model.config, hasProjection = model.hasProjection;
    if (hasProjection) {
        var data_1 = [];
        [[LONGITUDE, LATITUDE], [LONGITUDE2, LATITUDE2]].forEach(function (posssiblePair) {
            if (model.channelHasField(posssiblePair[0]) || model.channelHasField(posssiblePair[1])) {
                data_1.push({
                    signal: model.getName("geojson_" + data_1.length)
                });
            }
        });
        if (model.channelHasField(SHAPE) && model.fieldDef(SHAPE).type === GEOJSON) {
            data_1.push({
                signal: model.getName("geojson_" + data_1.length)
            });
        }
        if (data_1.length === 0) {
            data_1.push(model.requestDataName(MAIN));
        }
        return new ProjectionComponent(model.projectionName(true), tslib_1.__assign({}, (config.projection || {}), (specifiedProjection || {})), [model.getSizeSignalRef('width'), model.getSizeSignalRef('height')], data_1);
    }
    return undefined;
}
function mergeIfNoConflict(first, second) {
    var allPropertiesShared = every(PROJECTION_PROPERTIES, function (prop) {
        if (!first.explicit.hasOwnProperty(prop) &&
            !second.explicit.hasOwnProperty(prop)) {
            return true;
        }
        if (first.explicit.hasOwnProperty(prop) &&
            second.explicit.hasOwnProperty(prop) &&
            stringify$1(first.get(prop)) === stringify$1(second.get(prop))) {
            return true;
        }
        return false;
    });
    var size = stringify$1(first.size) === stringify$1(second.size);
    if (size) {
        if (allPropertiesShared) {
            return first;
        }
        else if (stringify$1(first.explicit) === stringify$1({})) {
            return second;
        }
        else if (stringify$1(second.explicit) === stringify$1({})) {
            return first;
        }
    }
    return null;
}
function parseNonUnitProjections(model) {
    if (model.children.length === 0) {
        return undefined;
    }
    var nonUnitProjection;
    var mergable = every(model.children, function (child) {
        parseProjection$1(child);
        var projection = child.component.projection;
        if (!projection) {
            return true;
        }
        else if (!nonUnitProjection) {
            nonUnitProjection = projection;
            return true;
        }
        else {
            var merge = mergeIfNoConflict(nonUnitProjection, projection);
            if (merge) {
                nonUnitProjection = merge;
            }
            return !!merge;
        }
    });
    if (nonUnitProjection && mergable) {
        var name_1 = model.projectionName(true);
        var modelProjection_1 = new ProjectionComponent(name_1, nonUnitProjection.specifiedProjection, nonUnitProjection.size, duplicate(nonUnitProjection.data));
        model.children.forEach(function (child) {
            if (child.component.projection) {
                modelProjection_1.data = modelProjection_1.data.concat(child.component.projection.data);
                child.renameProjection(child.component.projection.get('name'), name_1);
                child.component.projection.merged = true;
            }
        });
        return modelProjection_1;
    }
    return undefined;
}

function addDimension(dims, channel, fieldDef) {
    if (fieldDef.bin) {
        dims[vgField(fieldDef, {})] = true;
        dims[vgField(fieldDef, { binSuffix: 'end' })] = true;
        if (binRequiresRange(fieldDef, channel)) {
            dims[vgField(fieldDef, { binSuffix: 'range' })] = true;
        }
    }
    else {
        dims[vgField(fieldDef)] = true;
    }
    return dims;
}
function mergeMeasures(parentMeasures, childMeasures) {
    for (var f in childMeasures) {
        if (childMeasures.hasOwnProperty(f)) {
            var ops = childMeasures[f];
            for (var op in ops) {
                if (ops.hasOwnProperty(op)) {
                    if (f in parentMeasures) {
                        parentMeasures[f][op] = ops[op];
                    }
                    else {
                        parentMeasures[f] = { op: ops[op] };
                    }
                }
            }
        }
    }
}
var AggregateNode =               (function (_super) {
    tslib_1.__extends(AggregateNode, _super);
    function AggregateNode(parent, dimensions, measures) {
        var _this = _super.call(this, parent) || this;
        _this.dimensions = dimensions;
        _this.measures = measures;
        return _this;
    }
    AggregateNode.prototype.clone = function () {
        return new AggregateNode(null, tslib_1.__assign({}, this.dimensions), duplicate(this.measures));
    };
    AggregateNode.makeFromEncoding = function (parent, model) {
        var isAggregate = false;
        model.forEachFieldDef(function (fd) {
            if (fd.aggregate) {
                isAggregate = true;
            }
        });
        var meas = {};
        var dims = {};
        if (!isAggregate) {
            return null;
        }
        model.forEachFieldDef(function (fieldDef, channel) {
            var aggregate = fieldDef.aggregate, field = fieldDef.field;
            if (aggregate) {
                if (aggregate === 'count') {
                    meas['*'] = meas['*'] || {};
                    meas['*']['count'] = vgField(fieldDef);
                }
                else {
                    meas[field] = meas[field] || {};
                    meas[field][aggregate] = vgField(fieldDef);
                    if (isScaleChannel(channel) && model.scaleDomain(channel) === 'unaggregated') {
                        meas[field]['min'] = vgField({ field: field, aggregate: 'min' });
                        meas[field]['max'] = vgField({ field: field, aggregate: 'max' });
                    }
                }
            }
            else {
                addDimension(dims, channel, fieldDef);
            }
        });
        if ((keys$1(dims).length + keys$1(meas).length) === 0) {
            return null;
        }
        return new AggregateNode(parent, dims, meas);
    };
    AggregateNode.makeFromTransform = function (parent, t) {
        var dims = {};
        var meas = {};
        for (var _i = 0, _a = t.aggregate; _i < _a.length; _i++) {
            var s = _a[_i];
            var op = s.op, field = s.field, as = s.as;
            if (op) {
                if (op === 'count') {
                    meas['*'] = meas['*'] || {};
                    meas['*']['count'] = as || vgField(s);
                }
                else {
                    meas[field] = meas[field] || {};
                    meas[field][op] = as || vgField(s);
                }
            }
        }
        for (var _b = 0, _c = t.groupby || []; _b < _c.length; _b++) {
            var s = _c[_b];
            dims[s] = true;
        }
        if ((keys$1(dims).length + keys$1(meas).length) === 0) {
            return null;
        }
        return new AggregateNode(parent, dims, meas);
    };
    AggregateNode.prototype.merge = function (other) {
        if (!differ(this.dimensions, other.dimensions)) {
            mergeMeasures(this.measures, other.measures);
            other.remove();
        }
        else {
            debug$1('different dimensions, cannot merge');
        }
    };
    AggregateNode.prototype.addDimensions = function (fields) {
        var _this = this;
        fields.forEach(function (f) { return _this.dimensions[f] = true; });
    };
    AggregateNode.prototype.dependentFields = function () {
        var out = {};
        keys$1(this.dimensions).forEach(function (f) { return out[f] = true; });
        keys$1(this.measures).forEach(function (m) { return out[m] = true; });
        return out;
    };
    AggregateNode.prototype.producedFields = function () {
        var _this = this;
        var out = {};
        keys$1(this.measures).forEach(function (field) {
            keys$1(_this.measures[field]).forEach(function (op) {
                out[op + "_" + field] = true;
            });
        });
        return out;
    };
    AggregateNode.prototype.assemble = function () {
        var ops = [];
        var fields = [];
        var as = [];
        for (var _i = 0, _a = keys$1(this.measures); _i < _a.length; _i++) {
            var field = _a[_i];
            for (var _b = 0, _c = keys$1(this.measures[field]); _b < _c.length; _b++) {
                var op = _c[_b];
                as.push(this.measures[field][op]);
                ops.push(op);
                fields.push(field);
            }
        }
        var result = {
            type: 'aggregate',
            groupby: keys$1(this.dimensions),
            ops: ops,
            fields: fields,
            as: as
        };
        return result;
    };
    return AggregateNode;
}(DataFlowNode));

var FacetNode =               (function (_super) {
    tslib_1.__extends(FacetNode, _super);
    function FacetNode(parent, model, name, data) {
        var _this = _super.call(this, parent) || this;
        _this.model = model;
        _this.name = name;
        _this.data = data;
        for (var _i = 0, _a = [COLUMN, ROW]; _i < _a.length; _i++) {
            var channel = _a[_i];
            var fieldDef = model.facet[channel];
            if (fieldDef) {
                var bin = fieldDef.bin, sort = fieldDef.sort;
                _this[channel] = tslib_1.__assign({ name: model.getName(channel + "_domain"), fields: [
                        vgField(fieldDef)
                    ].concat((bin ? [vgField(fieldDef, { binSuffix: 'end' })] : [])) }, (isSortField(sort) ? { sortField: sort } :
                    isArray(sort) ? { sortIndexField: sortArrayIndexField(fieldDef, channel) } :
                        {}));
            }
        }
        _this.childModel = model.child;
        return _this;
    }
    Object.defineProperty(FacetNode.prototype, "fields", {
        get: function () {
            return ((this.column && this.column.fields) || []).concat((this.row && this.row.fields) || []);
        },
        enumerable: true,
        configurable: true
    });
    FacetNode.prototype.getSource = function () {
        return this.name;
    };
    FacetNode.prototype.getChildIndependentFieldsWithStep = function () {
        var childIndependentFieldsWithStep = {};
        for (var _i = 0, _a = ['x', 'y']; _i < _a.length; _i++) {
            var channel = _a[_i];
            var childScaleComponent = this.childModel.component.scales[channel];
            if (childScaleComponent && !childScaleComponent.merged) {
                var type = childScaleComponent.get('type');
                var range = childScaleComponent.get('range');
                if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                    var domain = assembleDomain(this.childModel, channel);
                    var field$$1 = getFieldFromDomain(domain);
                    if (field$$1) {
                        childIndependentFieldsWithStep[channel] = field$$1;
                    }
                    else {
                        warn$1('Unknown field for ${channel}.  Cannot calculate view size.');
                    }
                }
            }
        }
        return childIndependentFieldsWithStep;
    };
    FacetNode.prototype.assembleRowColumnData = function (channel, crossedDataName, childIndependentFieldsWithStep) {
        var childChannel = channel === 'row' ? 'y' : 'x';
        var fields = [];
        var ops = [];
        var as = [];
        if (childIndependentFieldsWithStep[childChannel]) {
            if (crossedDataName) {
                fields.push("distinct_" + childIndependentFieldsWithStep[childChannel]);
                ops.push('max');
            }
            else {
                fields.push(childIndependentFieldsWithStep[childChannel]);
                ops.push('distinct');
            }
            as.push("distinct_" + childIndependentFieldsWithStep[childChannel]);
        }
        var _a = this[channel], sortField = _a.sortField, sortIndexField = _a.sortIndexField;
        if (sortField) {
            var op = sortField.op, field$$1 = sortField.field;
            fields.push(field$$1);
            ops.push(op);
            as.push(vgField(sortField));
        }
        else if (sortIndexField) {
            fields.push(sortIndexField);
            ops.push('max');
            as.push(sortIndexField);
        }
        return {
            name: this[channel].name,
            source: crossedDataName || this.data,
            transform: [tslib_1.__assign({ type: 'aggregate', groupby: this[channel].fields }, (fields.length ? {
                    fields: fields, ops: ops, as: as
                } : {}))]
        };
    };
    FacetNode.prototype.assemble = function () {
        var data = [];
        var crossedDataName = null;
        var childIndependentFieldsWithStep = this.getChildIndependentFieldsWithStep();
        if (this.column && this.row && (childIndependentFieldsWithStep.x || childIndependentFieldsWithStep.y)) {
            crossedDataName = "cross_" + this.column.name + "_" + this.row.name;
            var fields = [].concat(childIndependentFieldsWithStep.x ? [childIndependentFieldsWithStep.x] : [], childIndependentFieldsWithStep.y ? [childIndependentFieldsWithStep.y] : []);
            var ops = fields.map(function () { return 'distinct'; });
            data.push({
                name: crossedDataName,
                source: this.data,
                transform: [{
                        type: 'aggregate',
                        groupby: this.column.fields.concat(this.row.fields),
                        fields: fields,
                        ops: ops
                    }]
            });
        }
        for (var _i = 0, _a = [COLUMN, ROW]; _i < _a.length; _i++) {
            var channel = _a[_i];
            if (this[channel]) {
                data.push(this.assembleRowColumnData(channel, crossedDataName, childIndependentFieldsWithStep));
            }
        }
        return data;
    };
    return FacetNode;
}(DataFlowNode));

var FilterInvalidNode =               (function (_super) {
    tslib_1.__extends(FilterInvalidNode, _super);
    function FilterInvalidNode(parent, fieldDefs) {
        var _this = _super.call(this, parent) || this;
        _this.fieldDefs = fieldDefs;
        return _this;
    }
    FilterInvalidNode.prototype.clone = function () {
        return new FilterInvalidNode(null, tslib_1.__assign({}, this.fieldDefs));
    };
    FilterInvalidNode.make = function (parent, model) {
        var config = model.config, mark = model.mark;
        if (config.invalidValues !== 'filter') {
            return null;
        }
        var filter = model.reduceFieldDef(function (aggregator, fieldDef, channel) {
            var scaleComponent = isScaleChannel(channel) && model.getScaleComponent(channel);
            if (scaleComponent) {
                var scaleType = scaleComponent.get('type');
                if (hasContinuousDomain(scaleType) && !fieldDef.aggregate && !isPathMark(mark)) {
                    aggregator[fieldDef.field] = fieldDef;
                }
            }
            return aggregator;
        }, {});
        if (!keys$1(filter).length) {
            return null;
        }
        return new FilterInvalidNode(parent, filter);
    };
    Object.defineProperty(FilterInvalidNode.prototype, "filter", {
        get: function () {
            return this.fieldDefs;
        },
        enumerable: true,
        configurable: true
    });
    FilterInvalidNode.prototype.assemble = function () {
        var _this = this;
        var filters = keys$1(this.filter).reduce(function (vegaFilters, field) {
            var fieldDef = _this.fieldDefs[field];
            var ref = vgField(fieldDef, { expr: 'datum' });
            if (fieldDef !== null) {
                vegaFilters.push(ref + " !== null");
                vegaFilters.push("!isNaN(" + ref + ")");
            }
            return vegaFilters;
        }, []);
        return filters.length > 0 ?
            {
                type: 'filter',
                expr: filters.join(' && ')
            } : null;
    };
    return FilterInvalidNode;
}(DataFlowNode));

function parseExpression$1(field$$1, parse) {
    var f = accessPathWithDatum(field$$1);
    if (parse === 'number') {
        return "toNumber(" + f + ")";
    }
    else if (parse === 'boolean') {
        return "toBoolean(" + f + ")";
    }
    else if (parse === 'string') {
        return "toString(" + f + ")";
    }
    else if (parse === 'date') {
        return "toDate(" + f + ")";
    }
    else if (parse === 'flatten') {
        return f;
    }
    else if (parse.indexOf('date:') === 0) {
        var specifier = parse.slice(5, parse.length);
        return "timeParse(" + f + "," + specifier + ")";
    }
    else if (parse.indexOf('utc:') === 0) {
        var specifier = parse.slice(4, parse.length);
        return "utcParse(" + f + "," + specifier + ")";
    }
    else {
        warn$1(message.unrecognizedParse(parse));
        return null;
    }
}
var ParseNode =               (function (_super) {
    tslib_1.__extends(ParseNode, _super);
    function ParseNode(parent, parse) {
        var _this = _super.call(this, parent) || this;
        _this._parse = parse;
        return _this;
    }
    ParseNode.prototype.clone = function () {
        return new ParseNode(null, duplicate(this._parse));
    };
    ParseNode.makeExplicit = function (parent, model, ancestorParse) {
        var explicit = {};
        var data = model.data;
        if (data && data.format && data.format.parse) {
            explicit = data.format.parse;
        }
        return this.makeWithAncestors(parent, explicit, {}, ancestorParse);
    };
    ParseNode.makeImplicitFromFilterTransform = function (parent, transform, ancestorParse) {
        var parse = {};
        forEachLeaf(transform.filter, function (filter) {
            if (isFieldPredicate(filter)) {
                var val = null;
                if (isFieldEqualPredicate(filter)) {
                    val = filter.equal;
                }
                else if (isFieldRangePredicate(filter)) {
                    val = filter.range[0];
                }
                else if (isFieldOneOfPredicate(filter)) {
                    val = (filter.oneOf || filter['in'])[0];
                }
                if (val) {
                    if (isDateTime(val)) {
                        parse[filter.field] = 'date';
                    }
                    else if (isNumber(val)) {
                        parse[filter.field] = 'number';
                    }
                    else if (isString(val)) {
                        parse[filter.field] = 'string';
                    }
                }
                if (filter.timeUnit) {
                    parse[filter.field] = 'date';
                }
            }
        });
        if (keys$1(parse).length === 0) {
            return null;
        }
        return this.makeWithAncestors(parent, {}, parse, ancestorParse);
    };
    ParseNode.makeImplicitFromEncoding = function (parent, model, ancestorParse) {
        var implicit = {};
        if (isUnitModel(model) || isFacetModel(model)) {
            model.forEachFieldDef(function (fieldDef) {
                if (isTimeFieldDef(fieldDef)) {
                    implicit[fieldDef.field] = 'date';
                }
                else if (isNumberFieldDef(fieldDef)) {
                    if (!isCountingAggregateOp(fieldDef.aggregate)) {
                        implicit[fieldDef.field] = 'number';
                    }
                }
                else if (accessPathDepth(fieldDef.field) > 1) {
                    if (!(fieldDef.field in implicit)) {
                        implicit[fieldDef.field] = 'flatten';
                    }
                }
                else if (isScaleFieldDef(fieldDef) && isSortField(fieldDef.sort) && accessPathDepth(fieldDef.sort.field) > 1) {
                    if (!(fieldDef.sort.field in implicit)) {
                        implicit[fieldDef.sort.field] = 'flatten';
                    }
                }
            });
        }
        return this.makeWithAncestors(parent, {}, implicit, ancestorParse);
    };
    ParseNode.makeWithAncestors = function (parent, explicit, implicit, ancestorParse) {
        for (var _i = 0, _a = keys$1(implicit); _i < _a.length; _i++) {
            var field$$1 = _a[_i];
            var parsedAs = ancestorParse.getWithExplicit(field$$1);
            if (parsedAs.value !== undefined) {
                if (parsedAs.explicit || parsedAs.value === implicit[field$$1] || parsedAs.value === 'derived' || implicit[field$$1] === 'flatten') {
                    delete implicit[field$$1];
                }
                else {
                    warn$1(message.differentParse(field$$1, implicit[field$$1], parsedAs.value));
                }
            }
        }
        for (var _b = 0, _c = keys$1(explicit); _b < _c.length; _b++) {
            var field$$1 = _c[_b];
            var parsedAs = ancestorParse.get(field$$1);
            if (parsedAs !== undefined) {
                if (parsedAs === explicit[field$$1]) {
                    delete explicit[field$$1];
                }
                else {
                    warn$1(message.differentParse(field$$1, explicit[field$$1], parsedAs));
                }
            }
        }
        var parse = new Split(explicit, implicit);
        ancestorParse.copyAll(parse);
        var p = {};
        for (var _d = 0, _e = keys$1(parse.combine()); _d < _e.length; _d++) {
            var key$$1 = _e[_d];
            var val = parse.get(key$$1);
            if (val !== null) {
                p[key$$1] = val;
            }
        }
        if (keys$1(p).length === 0 || ancestorParse.parseNothing) {
            return null;
        }
        return new ParseNode(parent, p);
    };
    Object.defineProperty(ParseNode.prototype, "parse", {
        get: function () {
            return this._parse;
        },
        enumerable: true,
        configurable: true
    });
    ParseNode.prototype.merge = function (other) {
        this._parse = tslib_1.__assign({}, this._parse, other.parse);
        other.remove();
    };
    ParseNode.prototype.assembleFormatParse = function () {
        var formatParse = {};
        for (var _i = 0, _a = keys$1(this._parse); _i < _a.length; _i++) {
            var field$$1 = _a[_i];
            var p = this._parse[field$$1];
            if (accessPathDepth(field$$1) === 1) {
                formatParse[field$$1] = p;
            }
        }
        return formatParse;
    };
    ParseNode.prototype.producedFields = function () {
        return toSet(keys$1(this._parse));
    };
    ParseNode.prototype.dependentFields = function () {
        return toSet(keys$1(this._parse));
    };
    ParseNode.prototype.assembleTransforms = function (onlyNested) {
        var _this = this;
        if (onlyNested === void 0) { onlyNested = false; }
        return keys$1(this._parse)
            .filter(function (field$$1) { return onlyNested ? accessPathDepth(field$$1) > 1 : true; })
            .map(function (field$$1) {
            var expr = parseExpression$1(field$$1, _this._parse[field$$1]);
            if (!expr) {
                return null;
            }
            var formula = {
                type: 'formula',
                expr: expr,
                as: removePathFromField(field$$1)
            };
            return formula;
        }).filter(function (t) { return t !== null; });
    };
    return ParseNode;
}(DataFlowNode));

var SourceNode =               (function (_super) {
    tslib_1.__extends(SourceNode, _super);
    function SourceNode(data) {
        var _this = _super.call(this, null) || this;
        data = data || { name: 'source' };
        if (isInlineData(data)) {
            _this._data = { values: data.values };
        }
        else if (isUrlData(data)) {
            _this._data = { url: data.url };
            if (!data.format) {
                data.format = {};
            }
            if (!data.format || !data.format.type) {
                var defaultExtension = /(?:\.([^.]+))?$/.exec(data.url)[1];
                if (!contains(['json', 'csv', 'tsv', 'dsv', 'topojson'], defaultExtension)) {
                    defaultExtension = 'json';
                }
                data.format.type = defaultExtension;
            }
        }
        else if (isNamedData(data)) {
            _this._data = {};
        }
        if (data.name) {
            _this._name = data.name;
        }
        if (data.format) {
            var _a = data.format, _b = _a.parse, format = tslib_1.__rest(_a, ["parse"]);
            _this._data.format = format;
        }
        return _this;
    }
    Object.defineProperty(SourceNode.prototype, "data", {
        get: function () {
            return this._data;
        },
        enumerable: true,
        configurable: true
    });
    SourceNode.prototype.hasName = function () {
        return !!this._name;
    };
    Object.defineProperty(SourceNode.prototype, "dataName", {
        get: function () {
            return this._name;
        },
        set: function (name) {
            this._name = name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SourceNode.prototype, "parent", {
        set: function (parent) {
            throw new Error('Source nodes have to be roots.');
        },
        enumerable: true,
        configurable: true
    });
    SourceNode.prototype.remove = function () {
        throw new Error('Source nodes are roots and cannot be removed.');
    };
    SourceNode.prototype.hash = function () {
        if (isInlineData(this._data)) {
            if (!this._hash) {
                this._hash = hash(this._data);
            }
            return this._hash;
        }
        else if (isUrlData(this._data)) {
            return hash([this._data.url, this._data.format]);
        }
        else {
            return this._name;
        }
    };
    SourceNode.prototype.assemble = function () {
        return tslib_1.__assign({ name: this._name }, this._data, { transform: [] });
    };
    return SourceNode;
}(DataFlowNode));

var TimeUnitNode =               (function (_super) {
    tslib_1.__extends(TimeUnitNode, _super);
    function TimeUnitNode(parent, formula) {
        var _this = _super.call(this, parent) || this;
        _this.formula = formula;
        return _this;
    }
    TimeUnitNode.prototype.clone = function () {
        return new TimeUnitNode(null, duplicate(this.formula));
    };
    TimeUnitNode.makeFromEncoding = function (parent, model) {
        var formula = model.reduceFieldDef(function (timeUnitComponent, fieldDef) {
            if (fieldDef.timeUnit) {
                var f = vgField(fieldDef);
                timeUnitComponent[f] = {
                    as: f,
                    timeUnit: fieldDef.timeUnit,
                    field: fieldDef.field
                };
            }
            return timeUnitComponent;
        }, {});
        if (keys$1(formula).length === 0) {
            return null;
        }
        return new TimeUnitNode(parent, formula);
    };
    TimeUnitNode.makeFromTransform = function (parent, t) {
        var _a;
        return new TimeUnitNode(parent, (_a = {},
            _a[t.field] = {
                as: t.as,
                timeUnit: t.timeUnit,
                field: t.field
            },
            _a));
    };
    TimeUnitNode.prototype.merge = function (other) {
        this.formula = tslib_1.__assign({}, this.formula, other.formula);
        other.remove();
    };
    TimeUnitNode.prototype.producedFields = function () {
        var out = {};
        vals(this.formula).forEach(function (f) {
            out[f.as] = true;
        });
        return out;
    };
    TimeUnitNode.prototype.dependentFields = function () {
        var out = {};
        vals(this.formula).forEach(function (f) {
            out[f.field] = true;
        });
        return out;
    };
    TimeUnitNode.prototype.assemble = function () {
        return vals(this.formula).map(function (c) {
            return {
                type: 'formula',
                as: c.as,
                expr: fieldExpr(c.timeUnit, c.field)
            };
        });
    };
    return TimeUnitNode;
}(DataFlowNode));

function iterateFromLeaves(f) {
    function optimizeNextFromLeaves(node) {
        if (node instanceof SourceNode) {
            return;
        }
        var next = node.parent;
        if (f(node)) {
            optimizeNextFromLeaves(next);
        }
    }
    return optimizeNextFromLeaves;
}
function moveParseUp(node) {
    var parent = node.parent;
    if (node instanceof ParseNode) {
        if (parent instanceof SourceNode) {
            return false;
        }
        if (parent.numChildren() > 1) {
            return true;
        }
        if (parent instanceof ParseNode) {
            parent.merge(node);
        }
        else {
            if (hasIntersection(parent.producedFields(), node.dependentFields())) {
                return true;
            }
            node.swapWithParent();
        }
    }
    return true;
}
function removeUnusedSubtrees(node) {
    if (node instanceof OutputNode || node.numChildren() > 0 || node instanceof FacetNode) {
        return false;
    }
    else {
        node.remove();
    }
    return true;
}
function removeDuplicateTimeUnits(leaf) {
    var fields = {};
    return iterateFromLeaves(function (node) {
        if (node instanceof TimeUnitNode) {
            var pfields = node.producedFields();
            var dupe = keys$1(pfields).every(function (k) { return !!fields[k]; });
            if (dupe) {
                node.remove();
            }
            else {
                fields = tslib_1.__assign({}, fields, pfields);
            }
        }
        return true;
    })(leaf);
}

function getStackByFields(model) {
    return model.stack.stackBy.reduce(function (fields, by) {
        var fieldDef = by.fieldDef;
        var _field = vgField(fieldDef);
        if (_field) {
            fields.push(_field);
        }
        return fields;
    }, []);
}
function isValidAsArray(as) {
    return isArray(as) && as.every(function (s) { return isString(s); }) && as.length > 1;
}
var StackNode =               (function (_super) {
    tslib_1.__extends(StackNode, _super);
    function StackNode(parent, stack) {
        var _this = _super.call(this, parent) || this;
        _this._stack = stack;
        return _this;
    }
    StackNode.prototype.clone = function () {
        return new StackNode(null, duplicate(this._stack));
    };
    StackNode.makeFromTransform = function (parent, stackTransform) {
        var stack = stackTransform.stack, groupby = stackTransform.groupby, as = stackTransform.as, _a = stackTransform.offset, offset = _a === void 0 ? 'zero' : _a;
        var sortFields = [];
        var sortOrder = [];
        if (stackTransform.sort !== undefined) {
            for (var _i = 0, _b = stackTransform.sort; _i < _b.length; _i++) {
                var sortField = _b[_i];
                sortFields.push(sortField.field);
                sortOrder.push(sortField.order === undefined ? 'ascending' : sortField.order);
            }
        }
        var sort = {
            field: sortFields,
            order: sortOrder,
        };
        var normalizedAs;
        if (isValidAsArray(as)) {
            normalizedAs = as;
        }
        else if (isString(as)) {
            normalizedAs = [as, as + '_end'];
        }
        else {
            normalizedAs = [stackTransform.stack + '_start', stackTransform.stack + '_end'];
        }
        return new StackNode(parent, {
            stackField: stack,
            groupby: groupby,
            offset: offset,
            sort: sort,
            facetby: [],
            as: normalizedAs
        });
    };
    StackNode.makeFromEncoding = function (parent, model) {
        var stackProperties = model.stack;
        if (!stackProperties) {
            return null;
        }
        var dimensionFieldDef;
        if (stackProperties.groupbyChannel) {
            dimensionFieldDef = model.fieldDef(stackProperties.groupbyChannel);
        }
        var stackby = getStackByFields(model);
        var orderDef = model.encoding.order;
        var sort;
        if (isArray(orderDef) || isFieldDef(orderDef)) {
            sort = sortParams(orderDef);
        }
        else {
            sort = stackby.reduce(function (s, field$$1) {
                s.field.push(field$$1);
                s.order.push('descending');
                return s;
            }, { field: [], order: [] });
        }
        var field$$1 = model.vgField(stackProperties.fieldChannel);
        return new StackNode(parent, {
            dimensionFieldDef: dimensionFieldDef,
            stackField: field$$1,
            facetby: [],
            stackby: stackby,
            sort: sort,
            offset: stackProperties.offset,
            impute: stackProperties.impute,
            as: [field$$1 + '_start', field$$1 + '_end']
        });
    };
    Object.defineProperty(StackNode.prototype, "stack", {
        get: function () {
            return this._stack;
        },
        enumerable: true,
        configurable: true
    });
    StackNode.prototype.addDimensions = function (fields) {
        this._stack.facetby = this._stack.facetby.concat(fields);
    };
    StackNode.prototype.dependentFields = function () {
        var out = {};
        out[this._stack.stackField] = true;
        this.getGroupbyFields().forEach(function (f) { return out[f] = true; });
        this._stack.facetby.forEach(function (f) { return out[f] = true; });
        var field$$1 = this._stack.sort.field;
        isArray(field$$1) ? field$$1.forEach(function (f) { return out[f] = true; }) : out[field$$1] = true;
        return out;
    };
    StackNode.prototype.producedFields = function () {
        return this._stack.as.reduce(function (result, item) {
            result[item] = true;
            return result;
        }, {});
    };
    StackNode.prototype.getGroupbyFields = function () {
        var _a = this._stack, dimensionFieldDef = _a.dimensionFieldDef, impute = _a.impute, groupby = _a.groupby;
        if (dimensionFieldDef) {
            if (dimensionFieldDef.bin) {
                if (impute) {
                    return [vgField(dimensionFieldDef, { binSuffix: 'mid' })];
                }
                return [
                    vgField(dimensionFieldDef, {}),
                    vgField(dimensionFieldDef, { binSuffix: 'end' })
                ];
            }
            return [vgField(dimensionFieldDef)];
        }
        return groupby || [];
    };
    StackNode.prototype.assemble = function () {
        var transform = [];
        var _a = this._stack, facetby = _a.facetby, dimensionFieldDef = _a.dimensionFieldDef, field$$1 = _a.stackField, stackby = _a.stackby, sort = _a.sort, offset = _a.offset, impute = _a.impute, as = _a.as;
        if (impute && dimensionFieldDef) {
            var dimensionField = dimensionFieldDef ? vgField(dimensionFieldDef, { binSuffix: 'mid' }) : undefined;
            if (dimensionFieldDef.bin) {
                transform.push({
                    type: 'formula',
                    expr: '(' +
                        vgField(dimensionFieldDef, { expr: 'datum' }) +
                        '+' +
                        vgField(dimensionFieldDef, { expr: 'datum', binSuffix: 'end' }) +
                        ')/2',
                    as: dimensionField
                });
            }
            transform.push({
                type: 'impute',
                field: field$$1,
                groupby: stackby,
                key: dimensionField,
                method: 'value',
                value: 0
            });
        }
        transform.push({
            type: 'stack',
            groupby: this.getGroupbyFields().concat(facetby),
            field: field$$1,
            sort: sort,
            as: as,
            offset: offset
        });
        return transform;
    };
    return StackNode;
}(DataFlowNode));

var FACET_SCALE_PREFIX = 'scale_';
function cloneSubtree(facet) {
    function clone(node) {
        if (!(node instanceof FacetNode)) {
            var copy_1 = node.clone();
            if (copy_1 instanceof OutputNode) {
                var newName = FACET_SCALE_PREFIX + copy_1.getSource();
                copy_1.setSource(newName);
                facet.model.component.data.outputNodes[newName] = copy_1;
            }
            else if (copy_1 instanceof AggregateNode || copy_1 instanceof StackNode) {
                copy_1.addDimensions(facet.fields);
            }
            flatten(node.children.map(clone)).forEach(function (n) { return n.parent = copy_1; });
            return [copy_1];
        }
        return flatten(node.children.map(clone));
    }
    return clone;
}
function moveFacetDown(node) {
    if (node instanceof FacetNode) {
        if (node.numChildren() === 1 && !(node.children[0] instanceof OutputNode)) {
            var child = node.children[0];
            if (child instanceof AggregateNode || child instanceof StackNode) {
                child.addDimensions(node.fields);
            }
            child.swapWithParent();
            moveFacetDown(node);
        }
        else {
            moveMainDownToFacet(node.model.component.data.main);
            var copy = flatten(node.children.map(cloneSubtree(node)));
            copy.forEach(function (c) { return c.parent = node.model.component.data.main; });
        }
    }
    else {
        node.children.forEach(moveFacetDown);
    }
}
function moveMainDownToFacet(node) {
    if (node instanceof OutputNode && node.type === MAIN) {
        if (node.numChildren() === 1) {
            var child = node.children[0];
            if (!(child instanceof FacetNode)) {
                child.swapWithParent();
                moveMainDownToFacet(node);
            }
        }
    }
}
function removeUnnecessaryNodes(node) {
    if (node instanceof FilterInvalidNode && every(vals(node.filter), function (f) { return f === null; })) {
        node.remove();
    }
    if (node instanceof OutputNode && !node.isRequired()) {
        node.remove();
    }
    node.children.forEach(removeUnnecessaryNodes);
}
function getLeaves(roots) {
    var leaves = [];
    function append(node) {
        if (node.numChildren() === 0) {
            leaves.push(node);
        }
        else {
            node.children.forEach(append);
        }
    }
    roots.forEach(append);
    return leaves;
}
function optimizeDataflow(dataComponent) {
    var roots = vals(dataComponent.sources);
    roots.forEach(removeUnnecessaryNodes);
    roots = roots.filter(function (r) { return r.numChildren() > 0; });
    getLeaves(roots).forEach(iterateFromLeaves(removeUnusedSubtrees));
    roots = roots.filter(function (r) { return r.numChildren() > 0; });
    getLeaves(roots).forEach(iterateFromLeaves(moveParseUp));
    getLeaves(roots).forEach(removeDuplicateTimeUnits);
    roots.forEach(moveFacetDown);
    keys$1(dataComponent.sources).forEach(function (s) {
        if (dataComponent.sources[s].numChildren() === 0) {
            delete dataComponent.sources[s];
        }
    });
}

function parseScaleDomain$1(model) {
    if (isUnitModel(model)) {
        parseUnitScaleDomain(model);
    }
    else {
        parseNonUnitScaleDomain(model);
    }
}
function parseUnitScaleDomain(model) {
    var scales = model.specifiedScales;
    var localScaleComponents = model.component.scales;
    keys$1(localScaleComponents).forEach(function (channel) {
        var specifiedScale = scales[channel];
        var specifiedDomain = specifiedScale ? specifiedScale.domain : undefined;
        var domains = parseDomainForChannel(model, channel);
        var localScaleCmpt = localScaleComponents[channel];
        localScaleCmpt.domains = domains;
        if (isSelectionDomain(specifiedDomain)) {
            localScaleCmpt.set('domainRaw', {
                signal: SELECTION_DOMAIN + hash(specifiedDomain)
            }, true);
        }
        if (model.component.data.isFaceted) {
            var facetParent = model;
            while (!isFacetModel(facetParent) && facetParent.parent) {
                facetParent = facetParent.parent;
            }
            var resolve = facetParent.component.resolve.scale[channel];
            if (resolve === 'shared') {
                for (var _i = 0, domains_1 = domains; _i < domains_1.length; _i++) {
                    var domain = domains_1[_i];
                    if (isDataRefDomain(domain)) {
                        domain.data = FACET_SCALE_PREFIX + domain.data.replace(FACET_SCALE_PREFIX, '');
                    }
                }
            }
        }
    });
}
function parseNonUnitScaleDomain(model) {
    for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
        var child = _a[_i];
        parseScaleDomain$1(child);
    }
    var localScaleComponents = model.component.scales;
    keys$1(localScaleComponents).forEach(function (channel) {
        var domains;
        var domainRaw = null;
        for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var childComponent = child.component.scales[channel];
            if (childComponent) {
                if (domains === undefined) {
                    domains = childComponent.domains;
                }
                else {
                    domains = domains.concat(childComponent.domains);
                }
                var dr = childComponent.get('domainRaw');
                if (domainRaw && dr && domainRaw.signal !== dr.signal) {
                    warn$1('The same selection must be used to override scale domains in a layered view.');
                }
                domainRaw = dr;
            }
        }
        localScaleComponents[channel].domains = domains;
        if (domainRaw) {
            localScaleComponents[channel].set('domainRaw', domainRaw, true);
        }
    });
}
function normalizeUnaggregatedDomain(domain, fieldDef, scaleType, scaleConfig) {
    if (domain === 'unaggregated') {
        var _a = canUseUnaggregatedDomain(fieldDef, scaleType), valid = _a.valid, reason = _a.reason;
        if (!valid) {
            warn$1(reason);
            return undefined;
        }
    }
    else if (domain === undefined && scaleConfig.useUnaggregatedDomain) {
        var valid = canUseUnaggregatedDomain(fieldDef, scaleType).valid;
        if (valid) {
            return 'unaggregated';
        }
    }
    return domain;
}
function parseDomainForChannel(model, channel) {
    var scaleType = model.getScaleComponent(channel).get('type');
    var domain = normalizeUnaggregatedDomain(model.scaleDomain(channel), model.fieldDef(channel), scaleType, model.config.scale);
    if (domain !== model.scaleDomain(channel)) {
        model.specifiedScales[channel] = tslib_1.__assign({}, model.specifiedScales[channel], { domain: domain });
    }
    if (channel === 'x' && model.channelHasField('x2')) {
        if (model.channelHasField('x')) {
            return parseSingleChannelDomain(scaleType, domain, model, 'x').concat(parseSingleChannelDomain(scaleType, domain, model, 'x2'));
        }
        else {
            return parseSingleChannelDomain(scaleType, domain, model, 'x2');
        }
    }
    else if (channel === 'y' && model.channelHasField('y2')) {
        if (model.channelHasField('y')) {
            return parseSingleChannelDomain(scaleType, domain, model, 'y').concat(parseSingleChannelDomain(scaleType, domain, model, 'y2'));
        }
        else {
            return parseSingleChannelDomain(scaleType, domain, model, 'y2');
        }
    }
    return parseSingleChannelDomain(scaleType, domain, model, channel);
}
function mapDomainToDataSignal(domain, type, timeUnit) {
    return domain.map(function (v) {
        var data = valueExpr(v, { timeUnit: timeUnit, type: type });
        return { signal: "{data: " + data + "}" };
    });
}
function parseSingleChannelDomain(scaleType, domain, model, channel) {
    var fieldDef = model.fieldDef(channel);
    if (domain && domain !== 'unaggregated' && !isSelectionDomain(domain)) {
        var type = fieldDef.type, timeUnit = fieldDef.timeUnit;
        if (type === 'temporal' || timeUnit) {
            return mapDomainToDataSignal(domain, type, timeUnit);
        }
        return [domain];
    }
    var stack = model.stack;
    if (stack && channel === stack.fieldChannel) {
        if (stack.offset === 'normalize') {
            return [[0, 1]];
        }
        var data = model.requestDataName(MAIN);
        return [{
                data: data,
                field: model.vgField(channel, { suffix: 'start' })
            }, {
                data: data,
                field: model.vgField(channel, { suffix: 'end' })
            }];
    }
    var sort = isScaleChannel(channel) ? domainSort(model, channel, scaleType) : undefined;
    if (domain === 'unaggregated') {
        var data = model.requestDataName(MAIN);
        var field$$1 = fieldDef.field;
        return [{
                data: data,
                field: vgField({ field: field$$1, aggregate: 'min' })
            }, {
                data: data,
                field: vgField({ field: field$$1, aggregate: 'max' })
            }];
    }
    else if (fieldDef.bin) {
        if (isBinScale(scaleType)) {
            var signal = model.getName(binToString(fieldDef.bin) + "_" + fieldDef.field + "_bins");
            return [{ signal: "sequence(" + signal + ".start, " + signal + ".stop + " + signal + ".step, " + signal + ".step)" }];
        }
        if (hasDiscreteDomain(scaleType)) {
            return [{
                    data: isBoolean$2(sort) ? model.requestDataName(MAIN) : model.requestDataName(RAW),
                    field: model.vgField(channel, binRequiresRange(fieldDef, channel) ? { binSuffix: 'range' } : {}),
                    sort: sort === true || !isSortField(sort) ? {
                        field: model.vgField(channel, {}),
                        op: 'min'
                    } : sort
                }];
        }
        else {
            if (channel === 'x' || channel === 'y') {
                if (isBinParams(fieldDef.bin) && fieldDef.bin.extent) {
                    return [fieldDef.bin.extent];
                }
                var data = model.requestDataName(MAIN);
                return [{
                        data: data,
                        field: model.vgField(channel, {})
                    }, {
                        data: data,
                        field: model.vgField(channel, { binSuffix: 'end' })
                    }];
            }
            else {
                return [{
                        data: model.requestDataName(MAIN),
                        field: model.vgField(channel, {})
                    }];
            }
        }
    }
    else if (sort) {
        return [{
                data: isBoolean$2(sort) ? model.requestDataName(MAIN) : model.requestDataName(RAW),
                field: model.vgField(channel),
                sort: sort
            }];
    }
    else {
        return [{
                data: model.requestDataName(MAIN),
                field: model.vgField(channel)
            }];
    }
}
function domainSort(model, channel, scaleType) {
    if (!hasDiscreteDomain(scaleType)) {
        return undefined;
    }
    var fieldDef = model.fieldDef(channel);
    var sort = fieldDef.sort;
    if (isSortArray(sort)) {
        return {
            op: 'min',
            field: sortArrayIndexField(fieldDef, channel),
            order: 'ascending'
        };
    }
    if (isSortField(sort)) {
        return tslib_1.__assign({}, sort, (sort.field ? { field: replacePathInField(sort.field) } : {}));
    }
    if (sort === 'descending') {
        return {
            op: 'min',
            field: model.vgField(channel),
            order: 'descending'
        };
    }
    if (contains(['ascending', undefined                        ], sort)) {
        return true;
    }
    return undefined;
}
function canUseUnaggregatedDomain(fieldDef, scaleType) {
    if (!fieldDef.aggregate) {
        return {
            valid: false,
            reason: message.unaggregateDomainHasNoEffectForRawField(fieldDef)
        };
    }
    if (!SHARED_DOMAIN_OP_INDEX[fieldDef.aggregate]) {
        return {
            valid: false,
            reason: message.unaggregateDomainWithNonSharedDomainOp(fieldDef.aggregate)
        };
    }
    if (fieldDef.type === 'quantitative') {
        if (scaleType === 'log') {
            return {
                valid: false,
                reason: message.unaggregatedDomainWithLogScale(fieldDef)
            };
        }
    }
    return { valid: true };
}
function mergeDomains(domains) {
    var uniqueDomains = unique(domains.map(function (domain) {
        if (isDataRefDomain(domain)) {
            var _s = domain.sort, domainWithoutSort = tslib_1.__rest(domain, ["sort"]);
            return domainWithoutSort;
        }
        return domain;
    }), hash);
    var sorts = unique(domains.map(function (d) {
        if (isDataRefDomain(d)) {
            var s = d.sort;
            if (s !== undefined && !isBoolean$2(s)) {
                if (s.op === 'count') {
                    delete s.field;
                }
                if (s.order === 'ascending') {
                    delete s.order;
                }
            }
            return s;
        }
        return undefined;
    }).filter(function (s) { return s !== undefined; }), hash);
    if (uniqueDomains.length === 1) {
        var domain = domains[0];
        if (isDataRefDomain(domain) && sorts.length > 0) {
            var sort_1 = sorts[0];
            if (sorts.length > 1) {
                warn$1(message.MORE_THAN_ONE_SORT);
                sort_1 = true;
            }
            return tslib_1.__assign({}, domain, { sort: sort_1 });
        }
        return domain;
    }
    var simpleSorts = unique(sorts.map(function (s) {
        if (s === true) {
            return s;
        }
        if (s.op === 'count') {
            return s;
        }
        warn$1(message.domainSortDropped(s));
        return true;
    }), hash);
    var sort = undefined;
    if (simpleSorts.length === 1) {
        sort = simpleSorts[0];
    }
    else if (simpleSorts.length > 1) {
        warn$1(message.MORE_THAN_ONE_SORT);
        sort = true;
    }
    var allData = unique(domains.map(function (d) {
        if (isDataRefDomain(d)) {
            return d.data;
        }
        return null;
    }), function (x) { return x; });
    if (allData.length === 1 && allData[0] !== null) {
        var domain = tslib_1.__assign({ data: allData[0], fields: uniqueDomains.map(function (d) { return d.field; }) }, (sort ? { sort: sort } : {}));
        return domain;
    }
    return tslib_1.__assign({ fields: uniqueDomains }, (sort ? { sort: sort } : {}));
}
function getFieldFromDomain(domain) {
    if (isDataRefDomain(domain) && isString(domain.field)) {
        return domain.field;
    }
    else if (isDataRefUnionedDomain(domain)) {
        var field$$1 = void 0;
        for (var _i = 0, _a = domain.fields; _i < _a.length; _i++) {
            var nonUnionDomain = _a[_i];
            if (isDataRefDomain(nonUnionDomain) && isString(nonUnionDomain.field)) {
                if (!field$$1) {
                    field$$1 = nonUnionDomain.field;
                }
                else if (field$$1 !== nonUnionDomain.field) {
                    warn$1('Detected faceted independent scales that union domain of multiple fields from different data sources.  We will use the first field.  The result view size may be incorrect.');
                    return field$$1;
                }
            }
        }
        warn$1('Detected faceted independent scales that union domain of identical fields from different source detected.  We will assume that this is the same field from a different fork of the same data source.  However, if this is not case, the result view size maybe incorrect.');
        return field$$1;
    }
    else if (isFieldRefUnionDomain(domain)) {
        warn$1('Detected faceted independent scales that union domain of multiple fields from the same data source.  We will use the first field.  The result view size may be incorrect.');
        var field$$1 = domain.fields[0];
        return isString(field$$1) ? field$$1 : undefined;
    }
    return undefined;
}
function assembleDomain(model, channel) {
    var scaleComponent = model.component.scales[channel];
    var domains = scaleComponent.domains.map(function (domain) {
        if (isDataRefDomain(domain)) {
            domain.data = model.lookupDataSource(domain.data);
        }
        return domain;
    });
    return mergeDomains(domains);
}

function assembleScales(model) {
    if (isLayerModel(model) || isConcatModel(model) || isRepeatModel(model)) {
        return model.children.reduce(function (scales, child) {
            return scales.concat(assembleScales(child));
        }, assembleScalesForModel(model));
    }
    else {
        return assembleScalesForModel(model);
    }
}
function assembleScalesForModel(model) {
    return keys$1(model.component.scales).reduce(function (scales, channel) {
        var scaleComponent = model.component.scales[channel];
        if (scaleComponent.merged) {
            return scales;
        }
        var scale = scaleComponent.combine();
        var domainRaw = scale.domainRaw, range = scale.range;
        var name = scale.name, type = scale.type, _d = scale.domainRaw, _r = scale.range, otherScaleProps = tslib_1.__rest(scale, ["name", "type", "domainRaw", "range"]);
        range = assembleScaleRange(range, name, model, channel);
        if (domainRaw && isRawSelectionDomain(domainRaw)) {
            domainRaw = selectionScaleDomain(model, domainRaw);
        }
        scales.push(tslib_1.__assign({ name: name,
            type: type, domain: assembleDomain(model, channel) }, (domainRaw ? { domainRaw: domainRaw } : {}), { range: range }, otherScaleProps));
        return scales;
    }, []);
}
function assembleScaleRange(scaleRange, scaleName, model, channel) {
    if (channel === 'x' || channel === 'y') {
        if (isVgRangeStep(scaleRange)) {
            return {
                step: { signal: scaleName + '_step' }
            };
        }
        else if (isArray(scaleRange) && scaleRange.length === 2) {
            var r0 = scaleRange[0];
            var r1 = scaleRange[1];
            if (r0 === 0 && isVgSignalRef(r1)) {
                return [0, { signal: model.getSizeName(r1.signal) }];
            }
            else if (isVgSignalRef(r0) && r1 === 0) {
                return [{ signal: model.getSizeName(r0.signal) }, 0];
            }
        }
    }
    return scaleRange;
}

var ScaleComponent =               (function (_super) {
    tslib_1.__extends(ScaleComponent, _super);
    function ScaleComponent(name, typeWithExplicit) {
        var _this = _super.call(this, {},
        { name: name }
        ) || this;
        _this.merged = false;
        _this.domains = [];
        _this.setWithExplicit('type', typeWithExplicit);
        return _this;
    }
    return ScaleComponent;
}(Split));

var RANGE_PROPERTIES = ['range', 'rangeStep', 'scheme'];
function parseScaleRange$1(model) {
    if (isUnitModel(model)) {
        parseUnitScaleRange(model);
    }
    else {
        parseNonUnitScaleProperty(model, 'range');
    }
}
function parseUnitScaleRange(model) {
    var localScaleComponents = model.component.scales;
    SCALE_CHANNELS.forEach(function (channel) {
        var localScaleCmpt = localScaleComponents[channel];
        if (!localScaleCmpt) {
            return;
        }
        var mergedScaleCmpt = model.getScaleComponent(channel);
        var specifiedScale = model.specifiedScales[channel];
        var fieldDef = model.fieldDef(channel);
        var sizeType = channel === 'x' ? 'width' : channel === 'y' ? 'height' : undefined;
        var sizeSpecified = sizeType ? !!model.component.layoutSize.get(sizeType) : undefined;
        var scaleType = mergedScaleCmpt.get('type');
        var rangeStep = contains(['point', 'band'], scaleType) || !!specifiedScale.rangeStep;
        if (sizeType && model.fit && !sizeSpecified && rangeStep) {
            warn$1(message.CANNOT_FIX_RANGE_STEP_WITH_FIT);
            sizeSpecified = true;
        }
        var xyRangeSteps = getXYRangeStep(model);
        var rangeWithExplicit = parseRangeForChannel(channel, scaleType, fieldDef.type, specifiedScale, model.config, localScaleCmpt.get('zero'), model.mark, sizeSpecified, model.getName(sizeType), xyRangeSteps);
        localScaleCmpt.setWithExplicit('range', rangeWithExplicit);
    });
}
function getXYRangeStep(model) {
    var xyRangeSteps = [];
    var xScale = model.getScaleComponent('x');
    var xRange = xScale && xScale.get('range');
    if (xRange && isVgRangeStep(xRange) && isNumber(xRange.step)) {
        xyRangeSteps.push(xRange.step);
    }
    var yScale = model.getScaleComponent('y');
    var yRange = yScale && yScale.get('range');
    if (yRange && isVgRangeStep(yRange) && isNumber(yRange.step)) {
        xyRangeSteps.push(yRange.step);
    }
    return xyRangeSteps;
}
function parseRangeForChannel(channel, scaleType, type, specifiedScale, config, zero$$1, mark, sizeSpecified, sizeSignal, xyRangeSteps) {
    var noRangeStep = sizeSpecified || specifiedScale.rangeStep === null;
    for (var _i = 0, RANGE_PROPERTIES_1 = RANGE_PROPERTIES; _i < RANGE_PROPERTIES_1.length; _i++) {
        var property = RANGE_PROPERTIES_1[_i];
        if (specifiedScale[property] !== undefined) {
            var supportedByScaleType = scaleTypeSupportProperty(scaleType, property);
            var channelIncompatability = channelScalePropertyIncompatability(channel, property);
            if (!supportedByScaleType) {
                warn$1(message.scalePropertyNotWorkWithScaleType(scaleType, property, channel));
            }
            else if (channelIncompatability) {
                warn$1(channelIncompatability);
            }
            else {
                switch (property) {
                    case 'range':
                        return makeExplicit(specifiedScale[property]);
                    case 'scheme':
                        return makeExplicit(parseScheme(specifiedScale[property]));
                    case 'rangeStep':
                        var rangeStep = specifiedScale[property];
                        if (rangeStep !== null) {
                            if (!sizeSpecified) {
                                return makeExplicit({ step: rangeStep });
                            }
                            else {
                                warn$1(message.rangeStepDropped(channel));
                            }
                        }
                }
            }
        }
    }
    return makeImplicit(defaultRange(channel, scaleType, type, config, zero$$1, mark, sizeSignal, xyRangeSteps, noRangeStep));
}
function parseScheme(scheme) {
    if (isExtendedScheme(scheme)) {
        var r = { scheme: scheme.name };
        if (scheme.count) {
            r.count = scheme.count;
        }
        if (scheme.extent) {
            r.extent = scheme.extent;
        }
        return r;
    }
    return { scheme: scheme };
}
function defaultRange(channel, scaleType, type, config, zero$$1, mark, sizeSignal, xyRangeSteps, noRangeStep) {
    switch (channel) {
        case X:
        case Y:
            if (contains(['point', 'band'], scaleType) && !noRangeStep) {
                if (channel === X && mark === 'text') {
                    if (config.scale.textXRangeStep) {
                        return { step: config.scale.textXRangeStep };
                    }
                }
                else {
                    if (config.scale.rangeStep) {
                        return { step: config.scale.rangeStep };
                    }
                }
            }
            if (channel === Y && hasContinuousDomain(scaleType)) {
                return [{ signal: sizeSignal }, 0];
            }
            else {
                return [0, { signal: sizeSignal }];
            }
        case SIZE:
            var rangeMin = sizeRangeMin(mark, zero$$1, config);
            var rangeMax = sizeRangeMax(mark, xyRangeSteps, config);
            return [rangeMin, rangeMax];
        case SHAPE:
            return 'symbol';
        case COLOR:
        case FILL:
        case STROKE:
            if (scaleType === 'ordinal') {
                return type === 'nominal' ? 'category' : 'ordinal';
            }
            return mark === 'rect' || mark === 'geoshape' ? 'heatmap' : 'ramp';
        case OPACITY:
            return [config.scale.minOpacity, config.scale.maxOpacity];
    }
    throw new Error("Scale range undefined for channel " + channel);
}
function sizeRangeMin(mark, zero$$1, config) {
    if (zero$$1) {
        return 0;
    }
    switch (mark) {
        case 'bar':
        case 'tick':
            return config.scale.minBandSize;
        case 'line':
        case 'trail':
        case 'rule':
            return config.scale.minStrokeWidth;
        case 'text':
            return config.scale.minFontSize;
        case 'point':
        case 'square':
        case 'circle':
            return config.scale.minSize;
    }
    throw new Error(message.incompatibleChannel('size', mark));
}
function sizeRangeMax(mark, xyRangeSteps, config) {
    var scaleConfig = config.scale;
    switch (mark) {
        case 'bar':
        case 'tick':
            if (config.scale.maxBandSize !== undefined) {
                return config.scale.maxBandSize;
            }
            return minXYRangeStep(xyRangeSteps, config.scale) - 1;
        case 'line':
        case 'trail':
        case 'rule':
            return config.scale.maxStrokeWidth;
        case 'text':
            return config.scale.maxFontSize;
        case 'point':
        case 'square':
        case 'circle':
            if (config.scale.maxSize) {
                return config.scale.maxSize;
            }
            var pointStep = minXYRangeStep(xyRangeSteps, scaleConfig);
            return (pointStep - 2) * (pointStep - 2);
    }
    throw new Error(message.incompatibleChannel('size', mark));
}
function minXYRangeStep(xyRangeSteps, scaleConfig) {
    if (xyRangeSteps.length > 0) {
        return Math.min.apply(null, xyRangeSteps);
    }
    if (scaleConfig.rangeStep) {
        return scaleConfig.rangeStep;
    }
    return 21;
}

function parseScaleProperty(model, property) {
    if (isUnitModel(model)) {
        parseUnitScaleProperty(model, property);
    }
    else {
        parseNonUnitScaleProperty(model, property);
    }
}
function parseUnitScaleProperty(model, property) {
    var localScaleComponents = model.component.scales;
    keys$1(localScaleComponents).forEach(function (channel) {
        var specifiedScale = model.specifiedScales[channel];
        var localScaleCmpt = localScaleComponents[channel];
        var mergedScaleCmpt = model.getScaleComponent(channel);
        var fieldDef = model.fieldDef(channel);
        var config = model.config;
        var specifiedValue = specifiedScale[property];
        var sType = mergedScaleCmpt.get('type');
        var supportedByScaleType = scaleTypeSupportProperty(sType, property);
        var channelIncompatability = channelScalePropertyIncompatability(channel, property);
        if (specifiedValue !== undefined) {
            if (!supportedByScaleType) {
                warn$1(message.scalePropertyNotWorkWithScaleType(sType, property, channel));
            }
            else if (channelIncompatability) {
                warn$1(channelIncompatability);
            }
        }
        if (supportedByScaleType && channelIncompatability === undefined) {
            if (specifiedValue !== undefined) {
                localScaleCmpt.copyKeyFromObject(property, specifiedScale);
            }
            else {
                var value = getDefaultValue(property, channel, fieldDef, mergedScaleCmpt.get('type'), mergedScaleCmpt.get('padding'), mergedScaleCmpt.get('paddingInner'), specifiedScale.domain, model.markDef, config);
                if (value !== undefined) {
                    localScaleCmpt.set(property, value, false);
                }
            }
        }
    });
}
function getDefaultValue(property, channel, fieldDef, scaleType, scalePadding, scalePaddingInner, specifiedDomain, markDef, config) {
    var scaleConfig = config.scale;
    switch (property) {
        case 'nice':
            return nice(scaleType, channel, fieldDef);
        case 'padding':
            return padding(channel, scaleType, scaleConfig, fieldDef, markDef, config.bar);
        case 'paddingInner':
            return paddingInner(scalePadding, channel, scaleConfig);
        case 'paddingOuter':
            return paddingOuter(scalePadding, channel, scaleType, scalePaddingInner, scaleConfig);
        case 'reverse':
            return reverse(scaleType, fieldDef.sort);
        case 'zero':
            return zero$1(channel, fieldDef, specifiedDomain, markDef);
    }
    return scaleConfig[property];
}
function parseNonUnitScaleProperty(model, property) {
    var localScaleComponents = model.component.scales;
    for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
        var child = _a[_i];
        if (property === 'range') {
            parseScaleRange$1(child);
        }
        else {
            parseScaleProperty(child, property);
        }
    }
    keys$1(localScaleComponents).forEach(function (channel) {
        var valueWithExplicit;
        for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var childComponent = child.component.scales[channel];
            if (childComponent) {
                var childValueWithExplicit = childComponent.getWithExplicit(property);
                valueWithExplicit = mergeValuesWithExplicit(valueWithExplicit, childValueWithExplicit, property, 'scale', tieBreakByComparing(function (v1, v2) {
                    switch (property) {
                        case 'range':
                            if (v1.step && v2.step) {
                                return v1.step - v2.step;
                            }
                            return 0;
                    }
                    return 0;
                }));
            }
        }
        localScaleComponents[channel].setWithExplicit(property, valueWithExplicit);
    });
}
function nice(scaleType, channel, fieldDef) {
    if (fieldDef.bin || contains([ScaleType.TIME, ScaleType.UTC], scaleType)) {
        return undefined;
    }
    return contains([X, Y], channel);
}
function padding(channel, scaleType, scaleConfig, fieldDef, markDef, barConfig) {
    if (contains([X, Y], channel)) {
        if (isContinuousToContinuous(scaleType)) {
            if (scaleConfig.continuousPadding !== undefined) {
                return scaleConfig.continuousPadding;
            }
            var type = markDef.type, orient = markDef.orient;
            if (type === 'bar' && !fieldDef.bin) {
                if ((orient === 'vertical' && channel === 'x') ||
                    (orient === 'horizontal' && channel === 'y')) {
                    return barConfig.continuousBandSize;
                }
            }
        }
        if (scaleType === ScaleType.POINT) {
            return scaleConfig.pointPadding;
        }
    }
    return undefined;
}
function paddingInner(paddingValue, channel, scaleConfig) {
    if (paddingValue !== undefined) {
        return undefined;
    }
    if (contains([X, Y], channel)) {
        return scaleConfig.bandPaddingInner;
    }
    return undefined;
}
function paddingOuter(paddingValue, channel, scaleType, paddingInnerValue, scaleConfig) {
    if (paddingValue !== undefined) {
        return undefined;
    }
    if (contains([X, Y], channel)) {
        if (scaleType === ScaleType.BAND) {
            if (scaleConfig.bandPaddingOuter !== undefined) {
                return scaleConfig.bandPaddingOuter;
            }
            return paddingInnerValue / 2;
        }
    }
    return undefined;
}
function reverse(scaleType, sort) {
    if (hasContinuousDomain(scaleType) && sort === 'descending') {
        return true;
    }
    return undefined;
}
function zero$1(channel, fieldDef, specifiedScale, markDef) {
    var hasCustomDomain = !!specifiedScale && specifiedScale !== 'unaggregated';
    if (hasCustomDomain) {
        return false;
    }
    if (channel === 'size' && fieldDef.type === 'quantitative') {
        return true;
    }
    if (!fieldDef.bin && contains([X, Y], channel)) {
        var orient = markDef.orient, type = markDef.type;
        if (contains(['bar', 'area', 'line', 'trail'], type)) {
            if ((orient === 'horizontal' && channel === 'y') ||
                (orient === 'vertical' && channel === 'x')) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function scaleType(specifiedType, channel, fieldDef, mark, scaleConfig) {
    var defaultScaleType = defaultType$1(channel, fieldDef, mark, scaleConfig);
    if (!isScaleChannel(channel)) {
        return null;
    }
    if (specifiedType !== undefined) {
        if (!channelSupportScaleType(channel, specifiedType)) {
            warn$1(message.scaleTypeNotWorkWithChannel(channel, specifiedType, defaultScaleType));
            return defaultScaleType;
        }
        if (!scaleTypeSupportDataType(specifiedType, fieldDef.type, fieldDef.bin)) {
            warn$1(message.scaleTypeNotWorkWithFieldDef(specifiedType, defaultScaleType));
            return defaultScaleType;
        }
        return specifiedType;
    }
    return defaultScaleType;
}
function defaultType$1(channel, fieldDef, mark, scaleConfig) {
    switch (fieldDef.type) {
        case 'nominal':
        case 'ordinal':
            if (isColorChannel(channel) || rangeType(channel) === 'discrete') {
                if (channel === 'shape' && fieldDef.type === 'ordinal') {
                    warn$1(message.discreteChannelCannotEncode(channel, 'ordinal'));
                }
                return 'ordinal';
            }
            if (contains(['x', 'y'], channel)) {
                if (contains(['rect', 'bar', 'rule'], mark)) {
                    return 'band';
                }
                if (mark === 'bar') {
                    return 'band';
                }
            }
            return 'point';
        case 'temporal':
            if (isColorChannel(channel)) {
                return 'sequential';
            }
            else if (rangeType(channel) === 'discrete') {
                warn$1(message.discreteChannelCannotEncode(channel, 'temporal'));
                return 'ordinal';
            }
            return 'time';
        case 'quantitative':
            if (isColorChannel(channel)) {
                if (fieldDef.bin) {
                    return 'bin-ordinal';
                }
                return 'sequential';
            }
            else if (rangeType(channel) === 'discrete') {
                warn$1(message.discreteChannelCannotEncode(channel, 'quantitative'));
                return 'ordinal';
            }
            if (fieldDef.bin && channel !== 'x' && channel !== 'y') {
                return 'bin-linear';
            }
            return 'linear';
        case 'latitude':
        case 'longitude':
        case 'geojson':
            return undefined;
    }
    throw new Error(message.invalidFieldType(fieldDef.type));
}

function parseScale$1(model) {
    parseScaleCore(model);
    parseScaleDomain$1(model);
    for (var _i = 0, NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES_1 = NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES; _i < NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES_1.length; _i++) {
        var prop = NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES_1[_i];
        parseScaleProperty(model, prop);
    }
    parseScaleRange$1(model);
}
function parseScaleCore(model) {
    if (isUnitModel(model)) {
        model.component.scales = parseUnitScaleCore(model);
    }
    else {
        model.component.scales = parseNonUnitScaleCore(model);
    }
}
function parseUnitScaleCore(model) {
    var encoding = model.encoding, config = model.config, mark = model.mark;
    return SCALE_CHANNELS.reduce(function (scaleComponents, channel) {
        var fieldDef;
        var specifiedScale = undefined;
        var channelDef = encoding[channel];
        if (isFieldDef(channelDef) && mark === GEOSHAPE &&
            channel === SHAPE && channelDef.type === GEOJSON) {
            return scaleComponents;
        }
        if (isFieldDef(channelDef)) {
            fieldDef = channelDef;
            specifiedScale = channelDef.scale;
        }
        else if (hasConditionalFieldDef(channelDef)) {
            fieldDef = channelDef.condition;
            specifiedScale = channelDef.condition['scale'];
        }
        else if (channel === X) {
            fieldDef = getFieldDef(encoding.x2);
        }
        else if (channel === Y) {
            fieldDef = getFieldDef(encoding.y2);
        }
        if (fieldDef && specifiedScale !== null && specifiedScale !== false) {
            specifiedScale = specifiedScale || {};
            var specifiedScaleType = specifiedScale.type;
            var sType = scaleType(specifiedScale.type, channel, fieldDef, mark, config.scale);
            scaleComponents[channel] = new ScaleComponent(model.scaleName(channel + '', true), { value: sType, explicit: specifiedScaleType === sType });
        }
        return scaleComponents;
    }, {});
}
var scaleTypeTieBreaker = tieBreakByComparing(function (st1, st2) { return (scaleTypePrecedence(st1) - scaleTypePrecedence(st2)); });
function parseNonUnitScaleCore(model) {
    var scaleComponents = model.component.scales = {};
    var scaleTypeWithExplicitIndex = {};
    var resolve = model.component.resolve;
    var _loop_1 = function (child) {
        parseScaleCore(child);
        keys$1(child.component.scales).forEach(function (channel) {
            resolve.scale[channel] = resolve.scale[channel] || defaultScaleResolve(channel, model);
            if (resolve.scale[channel] === 'shared') {
                var explicitScaleType = scaleTypeWithExplicitIndex[channel];
                var childScaleType = child.component.scales[channel].getWithExplicit('type');
                if (explicitScaleType) {
                    if (scaleCompatible(explicitScaleType.value, childScaleType.value)) {
                        scaleTypeWithExplicitIndex[channel] = mergeValuesWithExplicit(explicitScaleType, childScaleType, 'type', 'scale', scaleTypeTieBreaker);
                    }
                    else {
                        resolve.scale[channel] = 'independent';
                        delete scaleTypeWithExplicitIndex[channel];
                    }
                }
                else {
                    scaleTypeWithExplicitIndex[channel] = childScaleType;
                }
            }
        });
    };
    for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
        var child = _a[_i];
        _loop_1(child);
    }
    keys$1(scaleTypeWithExplicitIndex).forEach(function (channel) {
        var name = model.scaleName(channel, true);
        var typeWithExplicit = scaleTypeWithExplicitIndex[channel];
        scaleComponents[channel] = new ScaleComponent(name, typeWithExplicit);
        for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var childScale = child.component.scales[channel];
            if (childScale) {
                child.renameScale(childScale.get('name'), name);
                childScale.merged = true;
            }
        }
    });
    return scaleComponents;
}

var NameMap =               (function () {
    function NameMap() {
        this.nameMap = {};
    }
    NameMap.prototype.rename = function (oldName, newName) {
        this.nameMap[oldName] = newName;
    };
    NameMap.prototype.has = function (name) {
        return this.nameMap[name] !== undefined;
    };
    NameMap.prototype.get = function (name) {
        while (this.nameMap[name] && name !== this.nameMap[name]) {
            name = this.nameMap[name];
        }
        return name;
    };
    return NameMap;
}());
function isUnitModel(model) {
    return model && model.type === 'unit';
}
function isFacetModel(model) {
    return model && model.type === 'facet';
}
function isRepeatModel(model) {
    return model && model.type === 'repeat';
}
function isConcatModel(model) {
    return model && model.type === 'concat';
}
function isLayerModel(model) {
    return model && model.type === 'layer';
}
var Model =               (function () {
    function Model(spec, parent, parentGivenName, config, repeater, resolve) {
        var _this = this;
        this.children = [];
        this.correctDataNames = function (mark) {
            if (mark.from && mark.from.data) {
                mark.from.data = _this.lookupDataSource(mark.from.data);
            }
            if (mark.from && mark.from.facet && mark.from.facet.data) {
                mark.from.facet.data = _this.lookupDataSource(mark.from.facet.data);
            }
            return mark;
        };
        this.parent = parent;
        this.config = config;
        this.repeater = repeater;
        this.name = spec.name || parentGivenName;
        this.title = isString(spec.title) ? { text: spec.title } : spec.title;
        this.scaleNameMap = parent ? parent.scaleNameMap : new NameMap();
        this.projectionNameMap = parent ? parent.projectionNameMap : new NameMap();
        this.layoutSizeNameMap = parent ? parent.layoutSizeNameMap : new NameMap();
        this.data = spec.data;
        this.description = spec.description;
        this.transforms = normalizeTransform(spec.transform || []);
        this.layout = isUnitSpec(spec) || isLayerSpec(spec) ? undefined : extractCompositionLayout(spec);
        this.component = {
            data: {
                sources: parent ? parent.component.data.sources : {},
                outputNodes: parent ? parent.component.data.outputNodes : {},
                outputNodeRefCounts: parent ? parent.component.data.outputNodeRefCounts : {},
                isFaceted: isFacetSpec(spec) || (parent && parent.component.data.isFaceted && !spec.data)
            },
            layoutSize: new Split(),
            layoutHeaders: { row: {}, column: {} },
            mark: null,
            resolve: tslib_1.__assign({ scale: {}, axis: {}, legend: {} }, (resolve || {})),
            selection: null,
            scales: null,
            projection: null,
            axes: {},
            legends: {},
        };
    }
    Object.defineProperty(Model.prototype, "width", {
        get: function () {
            return this.getSizeSignalRef('width');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Model.prototype, "height", {
        get: function () {
            return this.getSizeSignalRef('height');
        },
        enumerable: true,
        configurable: true
    });
    Model.prototype.initSize = function (size) {
        var width = size.width, height = size.height;
        if (width) {
            this.component.layoutSize.set('width', width, true);
        }
        if (height) {
            this.component.layoutSize.set('height', height, true);
        }
    };
    Model.prototype.parse = function () {
        this.parseScale();
        this.parseLayoutSize();
        this.renameTopLevelLayoutSize();
        this.parseSelection();
        this.parseProjection();
        this.parseData();
        this.parseAxisAndHeader();
        this.parseLegend();
        this.parseMarkGroup();
    };
    Model.prototype.parseScale = function () {
        parseScale$1(this);
    };
    Model.prototype.parseProjection = function () {
        parseProjection$1(this);
    };
    Model.prototype.renameTopLevelLayoutSize = function () {
        if (this.getName('width') !== 'width') {
            this.renameLayoutSize(this.getName('width'), 'width');
        }
        if (this.getName('height') !== 'height') {
            this.renameLayoutSize(this.getName('height'), 'height');
        }
    };
    Model.prototype.parseLegend = function () {
        parseLegend$1(this);
    };
    Model.prototype.assembleGroupStyle = function () {
        if (this.type === 'unit' || this.type === 'layer') {
            return 'cell';
        }
        return undefined;
    };
    Model.prototype.assembleLayoutSize = function () {
        if (this.type === 'unit' || this.type === 'layer') {
            return {
                width: this.getSizeSignalRef('width'),
                height: this.getSizeSignalRef('height')
            };
        }
        return undefined;
    };
    Model.prototype.assembleLayout = function () {
        if (!this.layout) {
            return undefined;
        }
        var _a = this.layout, align = _a.align, bounds = _a.bounds, center = _a.center, _b = _a.spacing, spacing = _b === void 0 ? {} : _b;
        return tslib_1.__assign({ padding: isNumber(spacing) ? spacing : {
                row: spacing.row || 10,
                column: spacing.column || 10
            } }, this.assembleDefaultLayout(), (align ? { align: align } : {}), (bounds ? { bounds: bounds } : {}), (center ? { center: center } : {}));
    };
    Model.prototype.assembleDefaultLayout = function () {
        return {};
    };
    Model.prototype.assembleHeaderMarks = function () {
        var layoutHeaders = this.component.layoutHeaders;
        var headerMarks = [];
        for (var _i = 0, HEADER_CHANNELS_1 = HEADER_CHANNELS; _i < HEADER_CHANNELS_1.length; _i++) {
            var channel = HEADER_CHANNELS_1[_i];
            if (layoutHeaders[channel].title) {
                headerMarks.push(getTitleGroup(this, channel));
            }
        }
        for (var _a = 0, HEADER_CHANNELS_2 = HEADER_CHANNELS; _a < HEADER_CHANNELS_2.length; _a++) {
            var channel = HEADER_CHANNELS_2[_a];
            headerMarks = headerMarks.concat(getHeaderGroups(this, channel));
        }
        return headerMarks;
    };
    Model.prototype.assembleAxes = function () {
        return assembleAxes(this.component.axes, this.config);
    };
    Model.prototype.assembleLegends = function () {
        return assembleLegends(this);
    };
    Model.prototype.assembleProjections = function () {
        return assembleProjections(this);
    };
    Model.prototype.assembleTitle = function () {
        var title$$1 = tslib_1.__assign({}, extractTitleConfig(this.config.title).nonMark, this.title);
        if (title$$1.text) {
            if (!contains(['unit', 'layer'], this.type)) {
                if (title$$1.anchor && title$$1.anchor !== 'start') {
                    warn$1(message.cannotSetTitleAnchor(this.type));
                }
                title$$1.anchor = 'start';
            }
            return keys$1(title$$1).length > 0 ? title$$1 : undefined;
        }
        return undefined;
    };
    Model.prototype.assembleGroup = function (signals) {
        if (signals === void 0) { signals = []; }
        var group = {};
        signals = signals.concat(this.assembleSelectionSignals());
        if (signals.length > 0) {
            group.signals = signals;
        }
        var layout = this.assembleLayout();
        if (layout) {
            group.layout = layout;
        }
        group.marks = [].concat(this.assembleHeaderMarks(), this.assembleMarks());
        var scales = (!this.parent || isFacetModel(this.parent)) ? assembleScales(this) : [];
        if (scales.length > 0) {
            group.scales = scales;
        }
        var axes = this.assembleAxes();
        if (axes.length > 0) {
            group.axes = axes;
        }
        var legends = this.assembleLegends();
        if (legends.length > 0) {
            group.legends = legends;
        }
        return group;
    };
    Model.prototype.hasDescendantWithFieldOnChannel = function (channel) {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            if (isUnitModel(child)) {
                if (child.channelHasField(channel)) {
                    return true;
                }
            }
            else {
                if (child.hasDescendantWithFieldOnChannel(channel)) {
                    return true;
                }
            }
        }
        return false;
    };
    Model.prototype.getName = function (text) {
        return varName((this.name ? this.name + '_' : '') + text);
    };
    Model.prototype.requestDataName = function (name) {
        var fullName = this.getName(name);
        var refCounts = this.component.data.outputNodeRefCounts;
        refCounts[fullName] = (refCounts[fullName] || 0) + 1;
        return fullName;
    };
    Model.prototype.getSizeSignalRef = function (sizeType) {
        if (isFacetModel(this.parent)) {
            var channel = sizeType === 'width' ? 'x' : 'y';
            var scaleComponent = this.component.scales[channel];
            if (scaleComponent && !scaleComponent.merged) {
                var type = scaleComponent.get('type');
                var range = scaleComponent.get('range');
                if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                    var scaleName = scaleComponent.get('name');
                    var domain = assembleDomain(this, channel);
                    var field$$1 = getFieldFromDomain(domain);
                    if (field$$1) {
                        var fieldRef = vgField({ aggregate: 'distinct', field: field$$1 }, { expr: 'datum' });
                        return {
                            signal: sizeExpr(scaleName, scaleComponent, fieldRef)
                        };
                    }
                    else {
                        warn$1('Unknown field for ${channel}.  Cannot calculate view size.');
                        return null;
                    }
                }
            }
        }
        return {
            signal: this.layoutSizeNameMap.get(this.getName(sizeType))
        };
    };
    Model.prototype.lookupDataSource = function (name) {
        var node = this.component.data.outputNodes[name];
        if (!node) {
            return name;
        }
        return node.getSource();
    };
    Model.prototype.getSizeName = function (oldSizeName) {
        return this.layoutSizeNameMap.get(oldSizeName);
    };
    Model.prototype.renameLayoutSize = function (oldName, newName) {
        this.layoutSizeNameMap.rename(oldName, newName);
    };
    Model.prototype.renameScale = function (oldName, newName) {
        this.scaleNameMap.rename(oldName, newName);
    };
    Model.prototype.renameProjection = function (oldName, newName) {
        this.projectionNameMap.rename(oldName, newName);
    };
    Model.prototype.scaleName = function (originalScaleName, parse) {
        if (parse) {
            return this.getName(originalScaleName);
        }
        if (
        (isChannel(originalScaleName) && isScaleChannel(originalScaleName) && this.component.scales[originalScaleName]) ||
            this.scaleNameMap.has(this.getName(originalScaleName))) {
            return this.scaleNameMap.get(this.getName(originalScaleName));
        }
        return undefined;
    };
    Model.prototype.projectionName = function (parse) {
        if (parse) {
            return this.getName('projection');
        }
        if ((this.component.projection && !this.component.projection.merged) || this.projectionNameMap.has(this.getName('projection'))) {
            return this.projectionNameMap.get(this.getName('projection'));
        }
        return undefined;
    };
    Model.prototype.getScaleComponent = function (channel) {
        if (!this.component.scales) {
            throw new Error('getScaleComponent cannot be called before parseScale().  Make sure you have called parseScale or use parseUnitModelWithScale().');
        }
        var localScaleComponent = this.component.scales[channel];
        if (localScaleComponent && !localScaleComponent.merged) {
            return localScaleComponent;
        }
        return (this.parent ? this.parent.getScaleComponent(channel) : undefined);
    };
    Model.prototype.getSelectionComponent = function (variableName, origName) {
        var sel = this.component.selection[variableName];
        if (!sel && this.parent) {
            sel = this.parent.getSelectionComponent(variableName, origName);
        }
        if (!sel) {
            throw new Error(message.selectionNotFound(origName));
        }
        return sel;
    };
    return Model;
}());
var ModelWithField =               (function (_super) {
    tslib_1.__extends(ModelWithField, _super);
    function ModelWithField() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ModelWithField.prototype.vgField = function (channel, opt) {
        if (opt === void 0) { opt = {}; }
        var fieldDef = this.fieldDef(channel);
        if (!fieldDef) {
            return undefined;
        }
        return vgField(fieldDef, opt);
    };
    ModelWithField.prototype.reduceFieldDef = function (f, init, t) {
        return reduce(this.getMapping(), function (acc, cd, c) {
            var fieldDef = getFieldDef(cd);
            if (fieldDef) {
                return f(acc, fieldDef, c);
            }
            return acc;
        }, init, t);
    };
    ModelWithField.prototype.forEachFieldDef = function (f, t) {
        forEach(this.getMapping(), function (cd, c) {
            var fieldDef = getFieldDef(cd);
            if (fieldDef) {
                f(fieldDef, c);
            }
        }, t);
    };
    return ModelWithField;
}(Model));

var scaleBindings = {
    has: function (selCmpt) {
        return selCmpt.type === 'interval' && selCmpt.resolve === 'global' &&
            selCmpt.bind && selCmpt.bind === 'scales';
    },
    parse: function (model, selDef, selCmpt) {
        var bound = selCmpt.scales = [];
        selCmpt.project.forEach(function (p) {
            var channel = p.channel;
            var scale = model.getScaleComponent(channel);
            var scaleType = scale ? scale.get('type') : undefined;
            if (!scale || !hasContinuousDomain(scaleType) || isBinScale(scaleType)) {
                warn$1(message.SCALE_BINDINGS_CONTINUOUS);
                return;
            }
            scale.set('domainRaw', { signal: channelSignalName(selCmpt, channel, 'data') }, true);
            bound.push(channel);
            if (model.repeater && model.repeater.row === model.repeater.column) {
                var scale2 = model.getScaleComponent(channel === X ? Y : X);
                scale2.set('domainRaw', { signal: channelSignalName(selCmpt, channel, 'data') }, true);
            }
        });
    },
    topLevelSignals: function (model, selCmpt, signals) {
        if (!model.parent) {
            return signals;
        }
        var channels = selCmpt.scales.filter(function (channel) {
            return !(signals.filter(function (s) { return s.name === channelSignalName(selCmpt, channel, 'data'); }).length);
        });
        return signals.concat(channels.map(function (channel) {
            return { name: channelSignalName(selCmpt, channel, 'data') };
        }));
    },
    signals: function (model, selCmpt, signals) {
        if (model.parent) {
            selCmpt.scales.forEach(function (channel) {
                var signal = signals.filter(function (s) { return s.name === channelSignalName(selCmpt, channel, 'data'); })[0];
                signal.push = 'outer';
                delete signal.value;
                delete signal.update;
            });
        }
        return signals;
    }
};
function domain$2(model, channel) {
    var scale = $$2(model.scaleName(channel));
    return "domain(" + scale + ")";
}

var BRUSH = '_brush';
var SCALE_TRIGGER = '_scale_trigger';
var interval = {
    predicate: 'vlInterval',
    scaleDomain: 'vlIntervalDomain',
    signals: function (model, selCmpt) {
        var name = selCmpt.name;
        var hasScales = scaleBindings.has(selCmpt);
        var signals = [];
        var intervals = [];
        var tupleTriggers = [];
        var scaleTriggers = [];
        if (selCmpt.translate && !hasScales) {
            var filterExpr_1 = "!event.item || event.item.mark.name !== " + $$2(name + BRUSH);
            events$2(selCmpt, function (_$$1, evt) {
                var filters = evt.between[0].filter || (evt.between[0].filter = []);
                if (filters.indexOf(filterExpr_1) < 0) {
                    filters.push(filterExpr_1);
                }
            });
        }
        selCmpt.project.forEach(function (p) {
            var channel = p.channel;
            if (channel !== X && channel !== Y) {
                warn$1('Interval selections only support x and y encoding channels.');
                return;
            }
            var cs = channelSignals(model, selCmpt, channel);
            var dname = channelSignalName(selCmpt, channel, 'data');
            var vname = channelSignalName(selCmpt, channel, 'visual');
            var scaleStr = $$2(model.scaleName(channel));
            var scaleType = model.getScaleComponent(channel).get('type');
            var toNum = hasContinuousDomain(scaleType) ? '+' : '';
            signals.push.apply(signals, cs);
            tupleTriggers.push(dname);
            intervals.push("{encoding: " + $$2(channel) + ", " +
                ("field: " + $$2(p.field) + ", extent: " + dname + "}"));
            scaleTriggers.push({
                scaleName: model.scaleName(channel),
                expr: "(!isArray(" + dname + ") || " +
                    ("(" + toNum + "invert(" + scaleStr + ", " + vname + ")[0] === " + toNum + dname + "[0] && ") +
                    (toNum + "invert(" + scaleStr + ", " + vname + ")[1] === " + toNum + dname + "[1]))")
            });
        });
        if (!hasScales) {
            signals.push({
                name: name + SCALE_TRIGGER,
                update: scaleTriggers.map(function (t) { return t.expr; }).join(' && ') +
                    (" ? " + (name + SCALE_TRIGGER) + " : {}")
            });
        }
        return signals.concat({
            name: name + TUPLE,
            on: [{
                    events: tupleTriggers.map(function (t) { return ({ signal: t }); }),
                    update: tupleTriggers.join(' && ') +
                        (" ? {unit: " + unitName(model) + ", intervals: [" + intervals.join(', ') + "]} : null")
                }]
        });
    },
    modifyExpr: function (model, selCmpt) {
        var tpl = selCmpt.name + TUPLE;
        return tpl + ', ' +
            (selCmpt.resolve === 'global' ? 'true' : "{unit: " + unitName(model) + "}");
    },
    marks: function (model, selCmpt, marks) {
        var name = selCmpt.name;
        var _a = positionalProjections(selCmpt), xi = _a.xi, yi = _a.yi;
        var store = "data(" + $$2(selCmpt.name + STORE) + ")";
        if (scaleBindings.has(selCmpt)) {
            return marks;
        }
        var update = {
            x: xi !== null ? { signal: name + "_x[0]" } : { value: 0 },
            y: yi !== null ? { signal: name + "_y[0]" } : { value: 0 },
            x2: xi !== null ? { signal: name + "_x[1]" } : { field: { group: 'width' } },
            y2: yi !== null ? { signal: name + "_y[1]" } : { field: { group: 'height' } }
        };
        if (selCmpt.resolve === 'global') {
            for (var _i = 0, _b = keys$1(update); _i < _b.length; _i++) {
                var key$$1 = _b[_i];
                update[key$$1] = [tslib_1.__assign({ test: store + ".length && " + store + "[0].unit === " + unitName(model) }, update[key$$1]), { value: 0 }];
            }
        }
        var _c = selCmpt.mark, fill = _c.fill, fillOpacity = _c.fillOpacity, stroke = tslib_1.__rest(_c, ["fill", "fillOpacity"]);
        var vgStroke = keys$1(stroke).reduce(function (def, k) {
            def[k] = [{
                    test: [
                        xi !== null && name + "_x[0] !== " + name + "_x[1]",
                        yi != null && name + "_y[0] !== " + name + "_y[1]",
                    ].filter(function (x) { return x; }).join(' && '),
                    value: stroke[k]
                }, { value: null }];
            return def;
        }, {});
        return [{
                name: name + BRUSH + '_bg',
                type: 'rect',
                clip: true,
                encode: {
                    enter: {
                        fill: { value: fill },
                        fillOpacity: { value: fillOpacity }
                    },
                    update: update
                }
            }].concat(marks, {
            name: name + BRUSH,
            type: 'rect',
            clip: true,
            encode: {
                enter: {
                    fill: { value: 'transparent' }
                },
                update: tslib_1.__assign({}, update, vgStroke)
            }
        });
    }
};
function channelSignals(model, selCmpt, channel) {
    var vname = channelSignalName(selCmpt, channel, 'visual');
    var dname = channelSignalName(selCmpt, channel, 'data');
    var hasScales = scaleBindings.has(selCmpt);
    var scaleName = model.scaleName(channel);
    var scaleStr = $$2(scaleName);
    var scale = model.getScaleComponent(channel);
    var scaleType = scale ? scale.get('type') : undefined;
    var size = model.getSizeSignalRef(channel === X ? 'width' : 'height').signal;
    var coord = channel + "(unit)";
    var on = events$2(selCmpt, function (def, evt) {
        return def.concat({ events: evt.between[0], update: "[" + coord + ", " + coord + "]" },
        { events: evt, update: "[" + vname + "[0], clamp(" + coord + ", 0, " + size + ")]" }
        );
    });
    on.push({
        events: { signal: selCmpt.name + SCALE_TRIGGER },
        update: hasContinuousDomain(scaleType) && !isBinScale(scaleType) ?
            "[scale(" + scaleStr + ", " + dname + "[0]), scale(" + scaleStr + ", " + dname + "[1])]" : "[0, 0]"
    });
    return hasScales ? [{ name: dname, on: [] }] : [{
            name: vname, value: [], on: on
        }, {
            name: dname,
            on: [{ events: { signal: vname }, update: vname + "[0] === " + vname + "[1] ? null : invert(" + scaleStr + ", " + vname + ")" }]
        }];
}
function events$2(selCmpt, cb) {
    return selCmpt.events.reduce(function (on, evt) {
        if (!evt.between) {
            warn$1(evt + " is not an ordered event stream for interval selections");
            return on;
        }
        return cb(on, evt);
    }, []);
}

var VORONOI = 'voronoi';
var nearest = {
    has: function (selCmpt) {
        return selCmpt.type !== 'interval' && selCmpt.nearest;
    },
    marks: function (model, selCmpt, marks) {
        var _a = positionalProjections(selCmpt), x = _a.x, y = _a.y;
        var markType = model.mark;
        if (isPathMark(markType)) {
            warn$1(message.nearestNotSupportForContinuous(markType));
            return marks;
        }
        var cellDef = {
            name: model.getName(VORONOI),
            type: 'path',
            from: { data: model.getName('marks') },
            encode: {
                enter: {
                    fill: { value: 'transparent' },
                    strokeWidth: { value: 0.35 },
                    stroke: { value: 'transparent' },
                    isVoronoi: { value: true }
                }
            },
            transform: [{
                    type: 'voronoi',
                    x: { expr: (x || (!x && !y)) ? 'datum.datum.x || 0' : '0' },
                    y: { expr: (y || (!x && !y)) ? 'datum.datum.y || 0' : '0' },
                    size: [model.getSizeSignalRef('width'), model.getSizeSignalRef('height')]
                }]
        };
        var index = 0;
        var exists = false;
        marks.forEach(function (mark, i) {
            var name = mark.name || '';
            if (name === model.component.mark[0].name) {
                index = i;
            }
            else if (name.indexOf(VORONOI) >= 0) {
                exists = true;
            }
        });
        if (!exists) {
            marks.splice(index + 1, 0, cellDef);
        }
        return marks;
    }
};

function signals(model, selCmpt) {
    var proj = selCmpt.project;
    var datum = nearest.has(selCmpt) ?
        '(item().isVoronoi ? datum.datum : datum)' : 'datum';
    var bins = [];
    var encodings = proj.map(function (p) { return $$2(p.channel); }).filter(function (e) { return e; }).join(', ');
    var fields = proj.map(function (p) { return $$2(p.field); }).join(', ');
    var values = proj.map(function (p) {
        var channel = p.channel;
        var fieldDef = model.fieldDef(channel);
        return (fieldDef && fieldDef.bin) ? (bins.push(p.field),
            "[" + accessPathWithDatum(model.vgField(channel, {}), datum) + ", " +
                (accessPathWithDatum(model.vgField(channel, { binSuffix: 'end' }), datum) + "]")) :
            "" + accessPathWithDatum(p.field, datum);
    }).join(', ');
    return [{
            name: selCmpt.name + TUPLE,
            value: {},
            on: [{
                    events: selCmpt.events,
                    update: "datum && item().mark.marktype !== 'group' ? " +
                        ("{unit: " + unitName(model) + ", encodings: [" + encodings + "], ") +
                        ("fields: [" + fields + "], values: [" + values + "]") +
                        (bins.length ? ', ' + bins.map(function (b) { return $$2('bin_' + b) + ": 1"; }).join(', ') : '') +
                        '} : null',
                    force: true
                }]
        }];
}
var multi = {
    predicate: 'vlMulti',
    scaleDomain: 'vlMultiDomain',
    signals: signals,
    modifyExpr: function (model, selCmpt) {
        var tpl = selCmpt.name + TUPLE;
        return tpl + ', ' +
            (selCmpt.resolve === 'global' ? 'null' : "{unit: " + unitName(model) + "}");
    }
};

var single = {
    predicate: 'vlSingle',
    scaleDomain: 'vlSingleDomain',
    signals: signals,
    topLevelSignals: function (model, selCmpt, signals$$1) {
        var hasSignal = signals$$1.filter(function (s) { return s.name === selCmpt.name; });
        var data = "data(" + $$2(selCmpt.name + STORE) + ")";
        var values = data + "[0].values";
        return hasSignal.length ? signals$$1 : signals$$1.concat({
            name: selCmpt.name,
            update: data + ".length && {" +
                selCmpt.project.map(function (p, i) { return p.field + ": " + values + "[" + i + "]"; }).join(', ') + '}'
        });
    },
    modifyExpr: function (model, selCmpt) {
        var tpl = selCmpt.name + TUPLE;
        return tpl + ', ' +
            (selCmpt.resolve === 'global' ? 'true' : "{unit: " + unitName(model) + "}");
    }
};

var inputBindings = {
    has: function (selCmpt) {
        return selCmpt.type === 'single' && selCmpt.resolve === 'global' &&
            selCmpt.bind && selCmpt.bind !== 'scales';
    },
    topLevelSignals: function (model, selCmpt, signals) {
        var name = selCmpt.name;
        var proj = selCmpt.project;
        var bind = selCmpt.bind;
        var datum = nearest.has(selCmpt) ?
            '(item().isVoronoi ? datum.datum : datum)' : 'datum';
        proj.forEach(function (p) {
            var sgname = varName(name + "_" + p.field);
            var hasSignal = signals.filter(function (s) { return s.name === sgname; });
            if (!hasSignal.length) {
                signals.unshift({
                    name: sgname,
                    value: '',
                    on: [{
                            events: selCmpt.events,
                            update: "datum && item().mark.marktype !== 'group' ? " + accessPathWithDatum(p.field, datum) + " : null"
                        }],
                    bind: bind[p.field] || bind[p.channel] || bind
                });
            }
        });
        return signals;
    },
    signals: function (model, selCmpt, signals) {
        var name = selCmpt.name;
        var proj = selCmpt.project;
        var signal = signals.filter(function (s) { return s.name === name + TUPLE; })[0];
        var fields = proj.map(function (p) { return $$2(p.field); }).join(', ');
        var values = proj.map(function (p) { return varName(name + "_" + p.field); });
        if (values.length) {
            signal.update = values.join(' && ') + " ? {fields: [" + fields + "], values: [" + values.join(', ') + "]} : null";
        }
        delete signal.value;
        delete signal.on;
        return signals;
    }
};

var project$1 = {
    has: function (selDef) {
        var def = selDef;
        return def.fields !== undefined || def.encodings !== undefined;
    },
    parse: function (model, selDef, selCmpt) {
        var channels = {};
        var timeUnits = {};
        (selDef.fields || []).forEach(function (field) { return channels[field] = null; });
        (selDef.encodings || []).forEach(function (channel) {
            var fieldDef = model.fieldDef(channel);
            if (fieldDef) {
                if (fieldDef.timeUnit) {
                    var tuField = model.vgField(channel);
                    channels[tuField] = channel;
                    timeUnits[tuField] = {
                        as: tuField,
                        field: fieldDef.field,
                        timeUnit: fieldDef.timeUnit
                    };
                }
                else {
                    channels[fieldDef.field] = channel;
                }
            }
            else {
                warn$1(message.cannotProjectOnChannelWithoutField(channel));
            }
        });
        var projection = selCmpt.project || (selCmpt.project = []);
        for (var field in channels) {
            if (channels.hasOwnProperty(field)) {
                projection.push({ field: field, channel: channels[field] });
            }
        }
        var fields = selCmpt.fields || (selCmpt.fields = {});
        projection.filter(function (p) { return p.channel; }).forEach(function (p) { return fields[p.channel] = p.field; });
        if (keys$1(timeUnits).length) {
            selCmpt.timeUnit = new TimeUnitNode(null, timeUnits);
        }
    }
};

var TOGGLE = '_toggle';
var toggle = {
    has: function (selCmpt) {
        return selCmpt.type === 'multi' && selCmpt.toggle;
    },
    signals: function (model, selCmpt, signals) {
        return signals.concat({
            name: selCmpt.name + TOGGLE,
            value: false,
            on: [{ events: selCmpt.events, update: selCmpt.toggle }]
        });
    },
    modifyExpr: function (model, selCmpt, expr) {
        var tpl = selCmpt.name + TUPLE;
        var signal = selCmpt.name + TOGGLE;
        return signal + " ? null : " + tpl + ", " +
            (selCmpt.resolve === 'global' ?
                signal + " ? null : true, " :
                signal + " ? null : {unit: " + unitName(model) + "}, ") +
            (signal + " ? " + tpl + " : null");
    }
};

var ANCHOR = '_translate_anchor';
var DELTA = '_translate_delta';
var translate$2 = {
    has: function (selCmpt) {
        return selCmpt.type === 'interval' && selCmpt.translate;
    },
    signals: function (model, selCmpt, signals) {
        var name = selCmpt.name;
        var hasScales = scaleBindings.has(selCmpt);
        var anchor = name + ANCHOR;
        var _a = positionalProjections(selCmpt), x = _a.x, y = _a.y;
        var events = selector(selCmpt.translate, 'scope');
        if (!hasScales) {
            events = events.map(function (e) { return (e.between[0].markname = name + BRUSH, e); });
        }
        signals.push({
            name: anchor,
            value: {},
            on: [{
                    events: events.map(function (e) { return e.between[0]; }),
                    update: '{x: x(unit), y: y(unit)' +
                        (x !== null ? ', extent_x: ' + (hasScales ? domain$2(model, X) :
                            "slice(" + channelSignalName(selCmpt, 'x', 'visual') + ")") : '') +
                        (y !== null ? ', extent_y: ' + (hasScales ? domain$2(model, Y) :
                            "slice(" + channelSignalName(selCmpt, 'y', 'visual') + ")") : '') + '}'
                }]
        }, {
            name: name + DELTA,
            value: {},
            on: [{
                    events: events,
                    update: "{x: " + anchor + ".x - x(unit), y: " + anchor + ".y - y(unit)}"
                }]
        });
        if (x !== null) {
            onDelta(model, selCmpt, X, 'width', signals);
        }
        if (y !== null) {
            onDelta(model, selCmpt, Y, 'height', signals);
        }
        return signals;
    }
};
function onDelta(model, selCmpt, channel, size, signals) {
    var name = selCmpt.name;
    var hasScales = scaleBindings.has(selCmpt);
    var signal = signals.filter(function (s) {
        return s.name === channelSignalName(selCmpt, channel, hasScales ? 'data' : 'visual');
    })[0];
    var anchor = name + ANCHOR;
    var delta = name + DELTA;
    var sizeSg = model.getSizeSignalRef(size).signal;
    var scaleCmpt = model.getScaleComponent(channel);
    var scaleType = scaleCmpt.get('type');
    var sign = hasScales && channel === X ? '-' : '';
    var extent = anchor + ".extent_" + channel;
    var offset = "" + sign + delta + "." + channel + " / " + (hasScales ? "" + sizeSg : "span(" + extent + ")");
    var panFn = !hasScales ? 'panLinear' :
        scaleType === 'log' ? 'panLog' :
            scaleType === 'pow' ? 'panPow' : 'panLinear';
    var update = panFn + "(" + extent + ", " + offset +
        (hasScales && scaleType === 'pow' ? ", " + (scaleCmpt.get('exponent') || 1) : '') + ')';
    signal.on.push({
        events: { signal: delta },
        update: hasScales ? update : "clampRange(" + update + ", 0, " + sizeSg + ")"
    });
}

var ANCHOR$1 = '_zoom_anchor';
var DELTA$1 = '_zoom_delta';
var zoom$1 = {
    has: function (selCmpt) {
        return selCmpt.type === 'interval' && selCmpt.zoom;
    },
    signals: function (model, selCmpt, signals) {
        var name = selCmpt.name;
        var hasScales = scaleBindings.has(selCmpt);
        var delta = name + DELTA$1;
        var _a = positionalProjections(selCmpt), x = _a.x, y = _a.y;
        var sx = $$2(model.scaleName(X));
        var sy = $$2(model.scaleName(Y));
        var events = selector(selCmpt.zoom, 'scope');
        if (!hasScales) {
            events = events.map(function (e) { return (e.markname = name + BRUSH, e); });
        }
        signals.push({
            name: name + ANCHOR$1,
            on: [{
                    events: events,
                    update: !hasScales ? "{x: x(unit), y: y(unit)}" :
                        '{' + [
                            (sx ? "x: invert(" + sx + ", x(unit))" : ''),
                            (sy ? "y: invert(" + sy + ", y(unit))" : '')
                        ].filter(function (expr) { return !!expr; }).join(', ') + '}'
                }]
        }, {
            name: delta,
            on: [{
                    events: events,
                    force: true,
                    update: 'pow(1.001, event.deltaY * pow(16, event.deltaMode))'
                }]
        });
        if (x !== null) {
            onDelta$1(model, selCmpt, 'x', 'width', signals);
        }
        if (y !== null) {
            onDelta$1(model, selCmpt, 'y', 'height', signals);
        }
        return signals;
    }
};
function onDelta$1(model, selCmpt, channel, size, signals) {
    var name = selCmpt.name;
    var hasScales = scaleBindings.has(selCmpt);
    var signal = signals.filter(function (s) {
        return s.name === channelSignalName(selCmpt, channel, hasScales ? 'data' : 'visual');
    })[0];
    var sizeSg = model.getSizeSignalRef(size).signal;
    var scaleCmpt = model.getScaleComponent(channel);
    var scaleType = scaleCmpt.get('type');
    var base = hasScales ? domain$2(model, channel) : signal.name;
    var delta = name + DELTA$1;
    var anchor = "" + name + ANCHOR$1 + "." + channel;
    var zoomFn = !hasScales ? 'zoomLinear' :
        scaleType === 'log' ? 'zoomLog' :
            scaleType === 'pow' ? 'zoomPow' : 'zoomLinear';
    var update = zoomFn + "(" + base + ", " + anchor + ", " + delta +
        (hasScales && scaleType === 'pow' ? ", " + (scaleCmpt.get('exponent') || 1) : '') + ')';
    signal.on.push({
        events: { signal: delta },
        update: hasScales ? update : "clampRange(" + update + ", 0, " + sizeSg + ")"
    });
}

var compilers = { project: project$1, toggle: toggle, scales: scaleBindings,
    translate: translate$2, zoom: zoom$1, inputs: inputBindings, nearest: nearest };
function forEachTransform(selCmpt, cb) {
    for (var t in compilers) {
        if (compilers[t].has(selCmpt)) {
            cb(compilers[t]);
        }
    }
}

var STORE = '_store';
var TUPLE = '_tuple';
var MODIFY = '_modify';
var SELECTION_DOMAIN = '_selection_domain_';
function parseUnitSelection(model, selDefs) {
    var selCmpts = {};
    var selectionConfig = model.config.selection;
    var _loop_1 = function (name_1) {
        if (!selDefs.hasOwnProperty(name_1)) {
            return "continue";
        }
        var selDef = selDefs[name_1];
        var cfg = selectionConfig[selDef.type];
        for (var key$$1 in cfg) {
            if ((key$$1 === 'encodings' && selDef.fields) || (key$$1 === 'fields' && selDef.encodings)) {
                continue;
            }
            if (key$$1 === 'mark') {
                selDef[key$$1] = tslib_1.__assign({}, cfg[key$$1], selDef[key$$1]);
            }
            if (selDef[key$$1] === undefined || selDef[key$$1] === true) {
                selDef[key$$1] = cfg[key$$1] || selDef[key$$1];
            }
        }
        name_1 = varName(name_1);
        var selCmpt = selCmpts[name_1] = tslib_1.__assign({}, selDef, { name: name_1, events: isString(selDef.on) ? selector(selDef.on, 'scope') : selDef.on });
        forEachTransform(selCmpt, function (txCompiler) {
            if (txCompiler.parse) {
                txCompiler.parse(model, selDef, selCmpt);
            }
        });
    };
    for (var name_1 in selDefs) {
        _loop_1(name_1);
    }
    return selCmpts;
}
function assembleUnitSelectionSignals(model, signals$$1) {
    forEachSelection(model, function (selCmpt, selCompiler) {
        var name = selCmpt.name;
        var modifyExpr = selCompiler.modifyExpr(model, selCmpt);
        signals$$1.push.apply(signals$$1, selCompiler.signals(model, selCmpt));
        forEachTransform(selCmpt, function (txCompiler) {
            if (txCompiler.signals) {
                signals$$1 = txCompiler.signals(model, selCmpt, signals$$1);
            }
            if (txCompiler.modifyExpr) {
                modifyExpr = txCompiler.modifyExpr(model, selCmpt, modifyExpr);
            }
        });
        signals$$1.push({
            name: name + MODIFY,
            on: [{
                    events: { signal: name + TUPLE },
                    update: "modify(" + $$2(selCmpt.name + STORE) + ", " + modifyExpr + ")"
                }]
        });
    });
    var facetModel = getFacetModel(model);
    if (signals$$1.length && facetModel) {
        var name_2 = $$2(facetModel.getName('cell'));
        signals$$1.unshift({
            name: 'facet',
            value: {},
            on: [{
                    events: selector('mousemove', 'scope'),
                    update: "isTuple(facet) ? facet : group(" + name_2 + ").datum"
                }]
        });
    }
    return signals$$1;
}
function assembleTopLevelSignals(model, signals$$1) {
    var needsUnit = false;
    forEachSelection(model, function (selCmpt, selCompiler) {
        if (selCompiler.topLevelSignals) {
            signals$$1 = selCompiler.topLevelSignals(model, selCmpt, signals$$1);
        }
        forEachTransform(selCmpt, function (txCompiler) {
            if (txCompiler.topLevelSignals) {
                signals$$1 = txCompiler.topLevelSignals(model, selCmpt, signals$$1);
            }
        });
        needsUnit = true;
    });
    if (needsUnit) {
        var hasUnit = signals$$1.filter(function (s) { return s.name === 'unit'; });
        if (!(hasUnit.length)) {
            signals$$1.unshift({
                name: 'unit',
                value: {},
                on: [{ events: 'mousemove', update: 'isTuple(group()) ? group() : unit' }]
            });
        }
    }
    return signals$$1;
}
function assembleUnitSelectionData(model, data) {
    forEachSelection(model, function (selCmpt) {
        var contains$$1 = data.filter(function (d) { return d.name === selCmpt.name + STORE; });
        if (!contains$$1.length) {
            data.push({ name: selCmpt.name + STORE });
        }
    });
    return data;
}
function assembleUnitSelectionMarks(model, marks) {
    forEachSelection(model, function (selCmpt, selCompiler) {
        marks = selCompiler.marks ? selCompiler.marks(model, selCmpt, marks) : marks;
        forEachTransform(selCmpt, function (txCompiler) {
            if (txCompiler.marks) {
                marks = txCompiler.marks(model, selCmpt, marks);
            }
        });
    });
    return marks;
}
function assembleLayerSelectionMarks(model, marks) {
    model.children.forEach(function (child) {
        if (isUnitModel(child)) {
            marks = assembleUnitSelectionMarks(child, marks);
        }
    });
    return marks;
}
function selectionPredicate(model, selections, dfnode) {
    var stores = [];
    function expr(name) {
        var vname = varName(name);
        var selCmpt = model.getSelectionComponent(vname, name);
        var store = $$2(vname + STORE);
        if (selCmpt.timeUnit) {
            var child = dfnode || model.component.data.raw;
            var tunode = selCmpt.timeUnit.clone();
            if (child.parent) {
                tunode.insertAsParentOf(child);
            }
            else {
                child.parent = tunode;
            }
        }
        if (selCmpt.empty !== 'none') {
            stores.push(store);
        }
        return compiler(selCmpt.type).predicate + ("(" + store + ", datum") +
            (selCmpt.resolve === 'global' ? ')' : ", " + $$2(selCmpt.resolve) + ")");
    }
    var predicateStr = logicalExpr(selections, expr);
    return (stores.length
        ? '!(' + stores.map(function (s) { return "length(data(" + s + "))"; }).join(' || ') + ') || '
        : '') + ("(" + predicateStr + ")");
}
function isRawSelectionDomain(domainRaw) {
    return domainRaw.signal.indexOf(SELECTION_DOMAIN) >= 0;
}
function selectionScaleDomain(model, domainRaw) {
    var selDomain = JSON.parse(domainRaw.signal.replace(SELECTION_DOMAIN, ''));
    var name = varName(selDomain.selection);
    var selCmpt = model.component.selection && model.component.selection[name];
    if (selCmpt) {
        warn$1('Use "bind": "scales" to setup a binding for scales and selections within the same view.');
    }
    else {
        selCmpt = model.getSelectionComponent(name, selDomain.selection);
        if (!selDomain.encoding && !selDomain.field) {
            selDomain.field = selCmpt.project[0].field;
            if (selCmpt.project.length > 1) {
                warn$1('A "field" or "encoding" must be specified when using a selection as a scale domain. ' +
                    ("Using \"field\": " + $$2(selDomain.field) + "."));
            }
        }
        return {
            signal: compiler(selCmpt.type).scaleDomain +
                ("(" + $$2(name + STORE) + ", " + $$2(selDomain.encoding || null) + ", ") +
                $$2(selDomain.field || null) +
                (selCmpt.resolve === 'global' ? ')' : ", " + $$2(selCmpt.resolve) + ")")
        };
    }
    return { signal: 'null' };
}
function forEachSelection(model, cb) {
    var selections = model.component.selection;
    for (var name_3 in selections) {
        if (selections.hasOwnProperty(name_3)) {
            var sel = selections[name_3];
            cb(sel, compiler(sel.type));
        }
    }
}
function compiler(type) {
    switch (type) {
        case 'single':
            return single;
        case 'multi':
            return multi;
        case 'interval':
            return interval;
    }
    return null;
}
function getFacetModel(model) {
    var parent = model.parent;
    while (parent) {
        if (isFacetModel(parent)) {
            break;
        }
        parent = parent.parent;
    }
    return parent;
}
function unitName(model) {
    var name = $$2(model.name);
    var facet = getFacetModel(model);
    if (facet) {
        name += (facet.facet.row ? " + '_' + (" + accessPathWithDatum(facet.vgField('row'), 'facet') + ")" : '')
            + (facet.facet.column ? " + '_' + (" + accessPathWithDatum(facet.vgField('column'), 'facet') + ")" : '');
    }
    return name;
}
function requiresSelectionId(model) {
    var identifier = false;
    forEachSelection(model, function (selCmpt) {
        identifier = identifier || selCmpt.project.some(function (proj) { return proj.field === SELECTION_ID; });
    });
    return identifier;
}
function channelSignalName(selCmpt, channel, range) {
    var sgNames = selCmpt._signalNames || (selCmpt._signalNames = {});
    if (sgNames[channel] && sgNames[channel][range]) {
        return sgNames[channel][range];
    }
    sgNames[channel] = sgNames[channel] || {};
    var basename = varName(selCmpt.name + '_' + (range === 'visual' ? channel : selCmpt.fields[channel]));
    var name = basename;
    var counter = 1;
    while (sgNames[name]) {
        name = basename + "_" + counter++;
    }
    return (sgNames[name] = sgNames[channel][range] = name);
}
function positionalProjections(selCmpt) {
    var x = null;
    var xi = null;
    var y = null;
    var yi = null;
    selCmpt.project.forEach(function (p, i) {
        if (p.channel === X) {
            x = p;
            xi = i;
        }
        else if (p.channel === Y) {
            y = p;
            yi = i;
        }
    });
    return { x: x, xi: xi, y: y, yi: yi };
}

function isSelectionPredicate(predicate) {
    return predicate && predicate['selection'];
}
function isFieldEqualPredicate(predicate) {
    return predicate && !!predicate.field && predicate.equal !== undefined;
}
function isFieldLTPredicate(predicate) {
    return predicate && !!predicate.field && predicate.lt !== undefined;
}
function isFieldLTEPredicate(predicate) {
    return predicate && !!predicate.field && predicate.lte !== undefined;
}
function isFieldGTPredicate(predicate) {
    return predicate && !!predicate.field && predicate.gt !== undefined;
}
function isFieldGTEPredicate(predicate) {
    return predicate && !!predicate.field && predicate.gte !== undefined;
}
function isFieldRangePredicate(predicate) {
    if (predicate && predicate.field) {
        if (isArray(predicate.range) && predicate.range.length === 2) {
            return true;
        }
    }
    return false;
}
function isFieldOneOfPredicate(predicate) {
    return predicate && !!predicate.field && (isArray(predicate.oneOf) ||
        isArray(predicate.in)
    );
}
function isFieldPredicate(predicate) {
    return isFieldOneOfPredicate(predicate) || isFieldEqualPredicate(predicate) || isFieldRangePredicate(predicate) || isFieldLTPredicate(predicate) || isFieldGTPredicate(predicate) || isFieldLTEPredicate(predicate) || isFieldGTEPredicate(predicate);
}
function expression$3(model, filterOp, node) {
    return logicalExpr(filterOp, function (predicate) {
        if (isString(predicate)) {
            return predicate;
        }
        else if (isSelectionPredicate(predicate)) {
            return selectionPredicate(model, predicate.selection, node);
        }
        else {
            return fieldFilterExpression(predicate);
        }
    });
}
function predicateValueExpr(v, timeUnit) {
    return valueExpr(v, { timeUnit: timeUnit, time: true });
}
function predicateValuesExpr(vals$$1, timeUnit) {
    return vals$$1.map(function (v) { return predicateValueExpr(v, timeUnit); });
}
function fieldFilterExpression(predicate, useInRange) {
    if (useInRange === void 0) { useInRange = true; }
    var field$$1 = predicate.field, timeUnit = predicate.timeUnit;
    var fieldExpr$$1 = timeUnit ?
        ('time(' + fieldExpr(timeUnit, field$$1) + ')') :
        vgField(predicate, { expr: 'datum' });
    if (isFieldEqualPredicate(predicate)) {
        return fieldExpr$$1 + '===' + predicateValueExpr(predicate.equal, timeUnit);
    }
    else if (isFieldLTPredicate(predicate)) {
        var upper = predicate.lt;
        return fieldExpr$$1 + "<" + predicateValueExpr(upper, timeUnit);
    }
    else if (isFieldGTPredicate(predicate)) {
        var lower = predicate.gt;
        return fieldExpr$$1 + ">" + predicateValueExpr(lower, timeUnit);
    }
    else if (isFieldLTEPredicate(predicate)) {
        var upper = predicate.lte;
        return fieldExpr$$1 + "<=" + predicateValueExpr(upper, timeUnit);
    }
    else if (isFieldGTEPredicate(predicate)) {
        var lower = predicate.gte;
        return fieldExpr$$1 + ">=" + predicateValueExpr(lower, timeUnit);
    }
    else if (isFieldOneOfPredicate(predicate)) {
        var oneOf = predicate.oneOf;
        oneOf = oneOf || predicate['in'];
        return 'indexof([' +
            predicateValuesExpr(oneOf, timeUnit).join(',') +
            '], ' + fieldExpr$$1 + ') !== -1';
    }
    else if (isFieldRangePredicate(predicate)) {
        var lower = predicate.range[0];
        var upper = predicate.range[1];
        if (lower !== null && upper !== null && useInRange) {
            return 'inrange(' + fieldExpr$$1 + ', [' +
                predicateValueExpr(lower, timeUnit) + ', ' +
                predicateValueExpr(upper, timeUnit) + '])';
        }
        var exprs = [];
        if (lower !== null) {
            exprs.push(fieldExpr$$1 + " >= " + predicateValueExpr(lower, timeUnit));
        }
        if (upper !== null) {
            exprs.push(fieldExpr$$1 + " <= " + predicateValueExpr(upper, timeUnit));
        }
        return exprs.length > 0 ? exprs.join(' && ') : 'true';
    }
    throw new Error("Invalid field predicate: " + JSON.stringify(predicate));
}
function normalizePredicate(f) {
    if (isFieldPredicate(f) && f.timeUnit) {
        return tslib_1.__assign({}, f, { timeUnit: normalizeTimeUnit(f.timeUnit) });
    }
    return f;
}

function isFilter(t) {
    return t['filter'] !== undefined;
}
function isLookup(t) {
    return t['lookup'] !== undefined;
}
function isWindow(t) {
    return t['window'] !== undefined;
}
function isCalculate(t) {
    return t['calculate'] !== undefined;
}
function isBin(t) {
    return !!t['bin'];
}
function isTimeUnit$1(t) {
    return t['timeUnit'] !== undefined;
}
function isAggregate$1(t) {
    return t['aggregate'] !== undefined;
}
function isStack(t) {
    return t['stack'] !== undefined;
}
function normalizeTransform(transform) {
    return transform.map(function (t) {
        if (isFilter(t)) {
            return {
                filter: normalizeLogicalOperand(t.filter, normalizePredicate)
            };
        }
        return t;
    });
}

var transform$2 = /*#__PURE__*/Object.freeze({
  isFilter: isFilter,
  isLookup: isLookup,
  isWindow: isWindow,
  isCalculate: isCalculate,
  isBin: isBin,
  isTimeUnit: isTimeUnit$1,
  isAggregate: isAggregate$1,
  isStack: isStack,
  normalizeTransform: normalizeTransform
});

function rangeFormula(model, fieldDef, channel, config) {
    if (binRequiresRange(fieldDef, channel)) {
        var guide = isUnitModel(model) ? (model.axis(channel) || model.legend(channel) || {}) : {};
        var startField = vgField(fieldDef, { expr: 'datum', });
        var endField = vgField(fieldDef, { expr: 'datum', binSuffix: 'end' });
        return {
            formulaAs: vgField(fieldDef, { binSuffix: 'range' }),
            formula: binFormatExpression(startField, endField, guide.format, config)
        };
    }
    return {};
}
function binKey(bin, field$$1) {
    return binToString(bin) + "_" + field$$1;
}
function getSignalsFromModel(model, key$$1) {
    return {
        signal: model.getName(key$$1 + "_bins"),
        extentSignal: model.getName(key$$1 + "_extent")
    };
}
function isBinTransform(t) {
    return 'as' in t;
}
function createBinComponent(t, model) {
    var as;
    if (isBinTransform(t)) {
        as = isString(t.as) ? [t.as, t.as + "_end"] : [t.as[0], t.as[1]];
    }
    else {
        as = [vgField(t, {}), vgField(t, { binSuffix: 'end' })];
    }
    var bin = normalizeBin(t.bin, undefined) || {};
    var key$$1 = binKey(bin, t.field);
    var _a = getSignalsFromModel(model, key$$1), signal = _a.signal, extentSignal = _a.extentSignal;
    var binComponent = tslib_1.__assign({ bin: bin, field: t.field, as: as }, signal ? { signal: signal } : {}, extentSignal ? { extentSignal: extentSignal } : {});
    return { key: key$$1, binComponent: binComponent };
}
var BinNode =               (function (_super) {
    tslib_1.__extends(BinNode, _super);
    function BinNode(parent, bins) {
        var _this = _super.call(this, parent) || this;
        _this.bins = bins;
        return _this;
    }
    BinNode.prototype.clone = function () {
        return new BinNode(null, duplicate(this.bins));
    };
    BinNode.makeFromEncoding = function (parent, model) {
        var bins = model.reduceFieldDef(function (binComponentIndex, fieldDef, channel) {
            if (fieldDef.bin) {
                var _a = createBinComponent(fieldDef, model), key$$1 = _a.key, binComponent = _a.binComponent;
                binComponentIndex[key$$1] = tslib_1.__assign({}, binComponent, binComponentIndex[key$$1], rangeFormula(model, fieldDef, channel, model.config));
            }
            return binComponentIndex;
        }, {});
        if (keys$1(bins).length === 0) {
            return null;
        }
        return new BinNode(parent, bins);
    };
    BinNode.makeFromTransform = function (parent, t, model) {
        var _a;
        var _b = createBinComponent(t, model), key$$1 = _b.key, binComponent = _b.binComponent;
        return new BinNode(parent, (_a = {},
            _a[key$$1] = binComponent,
            _a));
    };
    BinNode.prototype.merge = function (other) {
        this.bins = tslib_1.__assign({}, this.bins, other.bins);
        other.remove();
    };
    BinNode.prototype.producedFields = function () {
        var out = {};
        vals(this.bins).forEach(function (c) {
            c.as.forEach(function (f) { return out[f] = true; });
        });
        return out;
    };
    BinNode.prototype.dependentFields = function () {
        var out = {};
        vals(this.bins).forEach(function (c) {
            out[c.field] = true;
        });
        return out;
    };
    BinNode.prototype.assemble = function () {
        return flatten(vals(this.bins).map(function (bin) {
            var transform = [];
            var binTrans = tslib_1.__assign({ type: 'bin', field: bin.field, as: bin.as, signal: bin.signal }, bin.bin);
            if (!bin.bin.extent && bin.extentSignal) {
                transform.push({
                    type: 'extent',
                    field: bin.field,
                    signal: bin.extentSignal
                });
                binTrans.extent = { signal: bin.extentSignal };
            }
            transform.push(binTrans);
            if (bin.formula) {
                transform.push({
                    type: 'formula',
                    expr: bin.formula,
                    as: bin.formulaAs
                });
            }
            return transform;
        }));
    };
    return BinNode;
}(DataFlowNode));

var FilterNode =               (function (_super) {
    tslib_1.__extends(FilterNode, _super);
    function FilterNode(parent, model, filter) {
        var _this = _super.call(this, parent) || this;
        _this.model = model;
        _this.filter = filter;
        _this.expr = expression$3(_this.model, _this.filter, _this);
        return _this;
    }
    FilterNode.prototype.clone = function () {
        return new FilterNode(null, this.model, duplicate(this.filter));
    };
    FilterNode.prototype.assemble = function () {
        return {
            type: 'filter',
            expr: this.expr
        };
    };
    return FilterNode;
}(DataFlowNode));

var GeoJSONNode =               (function (_super) {
    tslib_1.__extends(GeoJSONNode, _super);
    function GeoJSONNode(parent, fields, geojson, signal) {
        var _this = _super.call(this, parent) || this;
        _this.fields = fields;
        _this.geojson = geojson;
        _this.signal = signal;
        return _this;
    }
    GeoJSONNode.prototype.clone = function () {
        return new GeoJSONNode(null, duplicate(this.fields), this.geojson, this.signal);
    };
    GeoJSONNode.parseAll = function (parent, model) {
        var geoJsonCounter = 0;
        [[LONGITUDE, LATITUDE], [LONGITUDE2, LATITUDE2]].forEach(function (coordinates) {
            var pair = coordinates.map(function (channel) { return model.channelHasField(channel) ? model.fieldDef(channel).field : undefined; });
            if (pair[0] || pair[1]) {
                parent = new GeoJSONNode(parent, pair, null, model.getName("geojson_" + geoJsonCounter++));
            }
        });
        if (model.channelHasField(SHAPE)) {
            var fieldDef = model.fieldDef(SHAPE);
            if (fieldDef.type === GEOJSON) {
                parent = new GeoJSONNode(parent, null, fieldDef.field, model.getName("geojson_" + geoJsonCounter++));
            }
        }
        return parent;
    };
    GeoJSONNode.prototype.assemble = function () {
        return tslib_1.__assign({ type: 'geojson' }, (this.fields ? { fields: this.fields } : {}), (this.geojson ? { geojson: this.geojson } : {}), { signal: this.signal });
    };
    return GeoJSONNode;
}(DataFlowNode));

var GeoPointNode =               (function (_super) {
    tslib_1.__extends(GeoPointNode, _super);
    function GeoPointNode(parent, projection, fields, as) {
        var _this = _super.call(this, parent) || this;
        _this.projection = projection;
        _this.fields = fields;
        _this.as = as;
        return _this;
    }
    GeoPointNode.prototype.clone = function () {
        return new GeoPointNode(null, this.projection, duplicate(this.fields), duplicate(this.as));
    };
    GeoPointNode.parseAll = function (parent, model) {
        if (!model.projectionName()) {
            return parent;
        }
        [[LONGITUDE, LATITUDE], [LONGITUDE2, LATITUDE2]].forEach(function (coordinates) {
            var pair = coordinates.map(function (channel) { return model.channelHasField(channel) ? model.fieldDef(channel).field : undefined; });
            var suffix = coordinates[0] === LONGITUDE2 ? '2' : '';
            if (pair[0] || pair[1]) {
                parent = new GeoPointNode(parent, model.projectionName(), pair, [model.getName('x' + suffix), model.getName('y' + suffix)]);
            }
        });
        return parent;
    };
    GeoPointNode.prototype.assemble = function () {
        return {
            type: 'geopoint',
            projection: this.projection,
            fields: this.fields,
            as: this.as
        };
    };
    return GeoPointNode;
}(DataFlowNode));

var IdentifierNode =               (function (_super) {
    tslib_1.__extends(IdentifierNode, _super);
    function IdentifierNode(parent) {
        return _super.call(this, parent) || this;
    }
    IdentifierNode.prototype.clone = function () {
        return new IdentifierNode(null);
    };
    IdentifierNode.prototype.producedFields = function () {
        var _a;
        return _a = {}, _a[SELECTION_ID] = true, _a;
    };
    IdentifierNode.prototype.assemble = function () {
        return { type: 'identifier', as: SELECTION_ID };
    };
    return IdentifierNode;
}(DataFlowNode));

var AncestorParse =               (function (_super) {
    tslib_1.__extends(AncestorParse, _super);
    function AncestorParse(explicit, implicit, parseNothing) {
        if (explicit === void 0) { explicit = {}; }
        if (implicit === void 0) { implicit = {}; }
        if (parseNothing === void 0) { parseNothing = false; }
        var _this = _super.call(this, explicit, implicit) || this;
        _this.explicit = explicit;
        _this.implicit = implicit;
        _this.parseNothing = parseNothing;
        return _this;
    }
    AncestorParse.prototype.clone = function () {
        var clone = _super.prototype.clone.call(this);
        clone.parseNothing = this.parseNothing;
        return clone;
    };
    return AncestorParse;
}(Split));

var LookupNode =               (function (_super) {
    tslib_1.__extends(LookupNode, _super);
    function LookupNode(parent, transform, secondary) {
        var _this = _super.call(this, parent) || this;
        _this.transform = transform;
        _this.secondary = secondary;
        return _this;
    }
    LookupNode.make = function (parent, model, transform, counter) {
        var sources = model.component.data.sources;
        var s = new SourceNode(transform.from.data);
        var fromSource = sources[s.hash()];
        if (!fromSource) {
            sources[s.hash()] = s;
            fromSource = s;
        }
        var fromOutputName = model.getName("lookup_" + counter);
        var fromOutputNode = new OutputNode(fromSource, fromOutputName, 'lookup', model.component.data.outputNodeRefCounts);
        model.component.data.outputNodes[fromOutputName] = fromOutputNode;
        return new LookupNode(parent, transform, fromOutputNode.getSource());
    };
    LookupNode.prototype.producedFields = function () {
        return toSet(this.transform.from.fields || ((this.transform.as instanceof Array) ? this.transform.as : [this.transform.as]));
    };
    LookupNode.prototype.assemble = function () {
        var foreign;
        if (this.transform.from.fields) {
            foreign = tslib_1.__assign({ values: this.transform.from.fields }, this.transform.as ? { as: ((this.transform.as instanceof Array) ? this.transform.as : [this.transform.as]) } : {});
        }
        else {
            var asName = this.transform.as;
            if (!isString(asName)) {
                warn$1(message.NO_FIELDS_NEEDS_AS);
                asName = '_lookup';
            }
            foreign = {
                as: [asName]
            };
        }
        return tslib_1.__assign({ type: 'lookup', from: this.secondary, key: this.transform.from.key, fields: [this.transform.lookup] }, foreign, (this.transform.default ? { default: this.transform.default } : {}));
    };
    return LookupNode;
}(DataFlowNode));

function makeWalkTree(data) {
    var datasetIndex = 0;
    function walkTree(node, dataSource) {
        if (node instanceof SourceNode) {
            if (!isUrlData(node.data)) {
                data.push(dataSource);
                var newData = {
                    name: null,
                    source: dataSource.name,
                    transform: []
                };
                dataSource = newData;
            }
        }
        if (node instanceof ParseNode) {
            if (node.parent instanceof SourceNode && !dataSource.source) {
                dataSource.format = tslib_1.__assign({}, dataSource.format || {}, { parse: node.assembleFormatParse() });
                dataSource.transform = dataSource.transform.concat(node.assembleTransforms(true));
            }
            else {
                dataSource.transform = dataSource.transform.concat(node.assembleTransforms());
            }
        }
        if (node instanceof FacetNode) {
            if (!dataSource.name) {
                dataSource.name = "data_" + datasetIndex++;
            }
            if (!dataSource.source || dataSource.transform.length > 0) {
                data.push(dataSource);
                node.data = dataSource.name;
            }
            else {
                node.data = dataSource.source;
            }
            node.assemble().forEach(function (d) { return data.push(d); });
            return;
        }
        if (node instanceof FilterNode ||
            node instanceof CalculateNode ||
            node instanceof GeoPointNode ||
            node instanceof GeoJSONNode ||
            node instanceof AggregateNode ||
            node instanceof LookupNode ||
            node instanceof WindowTransformNode ||
            node instanceof IdentifierNode) {
            dataSource.transform.push(node.assemble());
        }
        if (node instanceof FilterInvalidNode ||
            node instanceof BinNode ||
            node instanceof TimeUnitNode ||
            node instanceof StackNode) {
            dataSource.transform = dataSource.transform.concat(node.assemble());
        }
        if (node instanceof AggregateNode) {
            if (!dataSource.name) {
                dataSource.name = "data_" + datasetIndex++;
            }
        }
        if (node instanceof OutputNode) {
            if (dataSource.source && dataSource.transform.length === 0) {
                node.setSource(dataSource.source);
            }
            else if (node.parent instanceof OutputNode) {
                node.setSource(dataSource.name);
            }
            else {
                if (!dataSource.name) {
                    dataSource.name = "data_" + datasetIndex++;
                }
                node.setSource(dataSource.name);
                if (node.numChildren() === 1) {
                    data.push(dataSource);
                    var newData = {
                        name: null,
                        source: dataSource.name,
                        transform: []
                    };
                    dataSource = newData;
                }
            }
        }
        switch (node.numChildren()) {
            case 0:
                if (node instanceof OutputNode && (!dataSource.source || dataSource.transform.length > 0)) {
                    data.push(dataSource);
                }
                break;
            case 1:
                walkTree(node.children[0], dataSource);
                break;
            default:
                if (!dataSource.name) {
                    dataSource.name = "data_" + datasetIndex++;
                }
                var source_1 = dataSource.name;
                if (!dataSource.source || dataSource.transform.length > 0) {
                    data.push(dataSource);
                }
                else {
                    source_1 = dataSource.source;
                }
                node.children.forEach(function (child) {
                    var newData = {
                        name: null,
                        source: source_1,
                        transform: []
                    };
                    walkTree(child, newData);
                });
                break;
        }
    }
    return walkTree;
}
function assembleFacetData(root) {
    var data = [];
    var walkTree = makeWalkTree(data);
    root.children.forEach(function (child) { return walkTree(child, {
        source: root.name,
        name: null,
        transform: []
    }); });
    return data;
}
function assembleRootData(dataComponent, datasets) {
    var roots = vals(dataComponent.sources);
    var data = [];
    var walkTree = makeWalkTree(data);
    var sourceIndex = 0;
    roots.forEach(function (root) {
        if (!root.hasName()) {
            root.dataName = "source_" + sourceIndex++;
        }
        var newData = root.assemble();
        walkTree(root, newData);
    });
    data.forEach(function (d) {
        if (d.transform.length === 0) {
            delete d.transform;
        }
    });
    var whereTo = 0;
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        if ((d.transform || []).length === 0 && !d.source) {
            data.splice(whereTo++, 0, data.splice(i, 1)[0]);
        }
    }
    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
        var d = data_1[_i];
        for (var _a = 0, _b = d.transform || []; _a < _b.length; _a++) {
            var t = _b[_a];
            if (t.type === 'lookup') {
                t.from = dataComponent.outputNodes[t.from].getSource();
            }
        }
    }
    for (var _c = 0, data_2 = data; _c < data_2.length; _c++) {
        var d = data_2[_c];
        if (d.name in datasets) {
            d.values = datasets[d.name];
        }
    }
    return data;
}

function parseLayerLayoutSize(model) {
    parseChildrenLayoutSize(model);
    var layoutSizeCmpt = model.component.layoutSize;
    layoutSizeCmpt.setWithExplicit('width', parseNonUnitLayoutSizeForChannel(model, 'width'));
    layoutSizeCmpt.setWithExplicit('height', parseNonUnitLayoutSizeForChannel(model, 'height'));
}
var parseRepeatLayoutSize = parseLayerLayoutSize;
function parseConcatLayoutSize(model) {
    parseChildrenLayoutSize(model);
    var layoutSizeCmpt = model.component.layoutSize;
    var sizeTypeToMerge = model.isVConcat ? 'width' : 'height';
    layoutSizeCmpt.setWithExplicit(sizeTypeToMerge, parseNonUnitLayoutSizeForChannel(model, sizeTypeToMerge));
}
function parseChildrenLayoutSize(model) {
    for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
        var child = _a[_i];
        child.parseLayoutSize();
    }
}
function parseNonUnitLayoutSizeForChannel(model, sizeType) {
    var channel = sizeType === 'width' ? 'x' : 'y';
    var resolve = model.component.resolve;
    var mergedSize;
    for (var _i = 0, _a = model.children; _i < _a.length; _i++) {
        var child = _a[_i];
        var childSize = child.component.layoutSize.getWithExplicit(sizeType);
        var scaleResolve = resolve.scale[channel];
        if (scaleResolve === 'independent' && childSize.value === 'range-step') {
            mergedSize = undefined;
            break;
        }
        if (mergedSize) {
            if (scaleResolve === 'independent' && mergedSize.value !== childSize.value) {
                mergedSize = undefined;
                break;
            }
            mergedSize = mergeValuesWithExplicit(mergedSize, childSize, sizeType, '');
        }
        else {
            mergedSize = childSize;
        }
    }
    if (mergedSize) {
        for (var _b = 0, _c = model.children; _b < _c.length; _b++) {
            var child = _c[_b];
            model.renameLayoutSize(child.getName(sizeType), model.getName(sizeType));
            child.component.layoutSize.set(sizeType, 'merged', false);
        }
        return mergedSize;
    }
    else {
        return {
            explicit: false,
            value: undefined
        };
    }
}
function parseUnitLayoutSize(model) {
    var layoutSizeComponent = model.component.layoutSize;
    if (!layoutSizeComponent.explicit.width) {
        var width = defaultUnitSize(model, 'width');
        layoutSizeComponent.set('width', width, false);
    }
    if (!layoutSizeComponent.explicit.height) {
        var height = defaultUnitSize(model, 'height');
        layoutSizeComponent.set('height', height, false);
    }
}
function defaultUnitSize(model, sizeType) {
    var channel = sizeType === 'width' ? 'x' : 'y';
    var config = model.config;
    var scaleComponent = model.getScaleComponent(channel);
    if (scaleComponent) {
        var scaleType = scaleComponent.get('type');
        var range = scaleComponent.get('range');
        if (hasDiscreteDomain(scaleType) && isVgRangeStep(range)) {
            return 'range-step';
        }
        else {
            return config.view[sizeType];
        }
    }
    else if (model.hasProjection) {
        return config.view[sizeType];
    }
    else {
        if (sizeType === 'width' && model.mark === 'text') {
            return config.scale.textXRangeStep;
        }
        return config.scale.rangeStep || defaultScaleConfig.rangeStep;
    }
}

function replaceRepeaterInFacet(facet, repeater) {
    return replaceRepeater(facet, repeater);
}
function replaceRepeaterInEncoding(encoding, repeater) {
    return replaceRepeater(encoding, repeater);
}
function replaceRepeat(o, repeater) {
    if (isRepeatRef(o.field)) {
        if (o.field.repeat in repeater) {
            return tslib_1.__assign({}, o, { field: repeater[o.field.repeat] });
        }
        else {
            warn$1(message.noSuchRepeatedValue(o.field.repeat));
            return undefined;
        }
    }
    return o;
}
function replaceRepeaterInFieldDef(fieldDef, repeater) {
    fieldDef = replaceRepeat(fieldDef, repeater);
    if (fieldDef === undefined) {
        return undefined;
    }
    if (fieldDef.sort && isSortField(fieldDef.sort)) {
        var sort = replaceRepeat(fieldDef.sort, repeater);
        fieldDef = tslib_1.__assign({}, fieldDef, (sort ? { sort: sort } : {}));
    }
    return fieldDef;
}
function replaceRepeaterInChannelDef(channelDef, repeater) {
    if (isFieldDef(channelDef)) {
        var fd = replaceRepeaterInFieldDef(channelDef, repeater);
        if (fd) {
            return fd;
        }
        else if (isConditionalDef(channelDef)) {
            return { condition: channelDef.condition };
        }
    }
    else {
        if (hasConditionalFieldDef(channelDef)) {
            var fd = replaceRepeaterInFieldDef(channelDef.condition, repeater);
            if (fd) {
                return tslib_1.__assign({}, channelDef, { condition: fd });
            }
            else {
                var condition = channelDef.condition, channelDefWithoutCondition = tslib_1.__rest(channelDef, ["condition"]);
                return channelDefWithoutCondition;
            }
        }
        return channelDef;
    }
    return undefined;
}
function replaceRepeater(mapping, repeater) {
    var out = {};
    for (var channel in mapping) {
        if (mapping.hasOwnProperty(channel)) {
            var channelDef = mapping[channel];
            if (isArray(channelDef)) {
                out[channel] = channelDef.map(function (cd) { return replaceRepeaterInChannelDef(cd, repeater); })
                    .filter(function (cd) { return cd; });
            }
            else {
                var cd = replaceRepeaterInChannelDef(channelDef, repeater);
                if (cd) {
                    out[channel] = cd;
                }
            }
        }
    }
    return out;
}

function facetSortFieldName(fieldDef, sort, expr) {
    return vgField(sort, { expr: expr, suffix: "by_" + vgField(fieldDef) });
}
var FacetModel =               (function (_super) {
    tslib_1.__extends(FacetModel, _super);
    function FacetModel(spec, parent, parentGivenName, repeater, config) {
        var _this = _super.call(this, spec, parent, parentGivenName, config, repeater, spec.resolve) || this;
        _this.type = 'facet';
        _this.child = buildModel(spec.spec, _this, _this.getName('child'), undefined, repeater, config, false);
        _this.children = [_this.child];
        var facet = replaceRepeaterInFacet(spec.facet, repeater);
        _this.facet = _this.initFacet(facet);
        return _this;
    }
    FacetModel.prototype.initFacet = function (facet) {
        return reduce(facet, function (normalizedFacet, fieldDef, channel) {
            if (!contains([ROW, COLUMN], channel)) {
                warn$1(message.incompatibleChannel(channel, 'facet'));
                return normalizedFacet;
            }
            if (fieldDef.field === undefined) {
                warn$1(message.emptyFieldDef(fieldDef, channel));
                return normalizedFacet;
            }
            normalizedFacet[channel] = normalize(fieldDef, channel);
            return normalizedFacet;
        }, {});
    };
    FacetModel.prototype.channelHasField = function (channel) {
        return !!this.facet[channel];
    };
    FacetModel.prototype.fieldDef = function (channel) {
        return this.facet[channel];
    };
    FacetModel.prototype.parseData = function () {
        this.component.data = parseData$2(this);
        this.child.parseData();
    };
    FacetModel.prototype.parseLayoutSize = function () {
        parseChildrenLayoutSize(this);
    };
    FacetModel.prototype.parseSelection = function () {
        this.child.parseSelection();
        this.component.selection = this.child.component.selection;
    };
    FacetModel.prototype.parseMarkGroup = function () {
        this.child.parseMarkGroup();
    };
    FacetModel.prototype.parseAxisAndHeader = function () {
        this.child.parseAxisAndHeader();
        this.parseHeader('column');
        this.parseHeader('row');
        this.mergeChildAxis('x');
        this.mergeChildAxis('y');
    };
    FacetModel.prototype.parseHeader = function (channel) {
        if (this.channelHasField(channel)) {
            var fieldDef = this.facet[channel];
            var header = fieldDef.header || {};
            var title$$1 = fieldDef.title !== undefined ? fieldDef.title :
                header.title !== undefined ? header.title : title(fieldDef, this.config);
            if (this.child.component.layoutHeaders[channel].title) {
                title$$1 += ' / ' + this.child.component.layoutHeaders[channel].title;
                this.child.component.layoutHeaders[channel].title = null;
            }
            this.component.layoutHeaders[channel] = {
                title: title$$1,
                facetFieldDef: fieldDef,
                header: [this.makeHeaderComponent(channel, true)]
            };
        }
    };
    FacetModel.prototype.makeHeaderComponent = function (channel, labels) {
        var sizeType = channel === 'row' ? 'height' : 'width';
        return {
            labels: labels,
            sizeSignal: this.child.component.layoutSize.get(sizeType) ? this.child.getSizeSignalRef(sizeType) : undefined,
            axes: []
        };
    };
    FacetModel.prototype.mergeChildAxis = function (channel) {
        var child = this.child;
        if (child.component.axes[channel]) {
            var _a = this.component, layoutHeaders = _a.layoutHeaders, resolve = _a.resolve;
            resolve.axis[channel] = parseGuideResolve(resolve, channel);
            if (resolve.axis[channel] === 'shared') {
                var headerChannel = channel === 'x' ? 'column' : 'row';
                var layoutHeader = layoutHeaders[headerChannel];
                for (var _i = 0, _b = child.component.axes[channel]; _i < _b.length; _i++) {
                    var axisComponent = _b[_i];
                    var headerType = getHeaderType(axisComponent.get('orient'));
                    layoutHeader[headerType] = layoutHeader[headerType] ||
                        [this.makeHeaderComponent(headerChannel, false)];
                    var mainAxis = assembleAxis(axisComponent, 'main', this.config, { header: true });
                    layoutHeader[headerType][0].axes.push(mainAxis);
                    axisComponent.mainExtracted = true;
                }
            }
        }
    };
    FacetModel.prototype.assembleSelectionTopLevelSignals = function (signals) {
        return this.child.assembleSelectionTopLevelSignals(signals);
    };
    FacetModel.prototype.assembleSelectionSignals = function () {
        this.child.assembleSelectionSignals();
        return [];
    };
    FacetModel.prototype.assembleSelectionData = function (data) {
        return this.child.assembleSelectionData(data);
    };
    FacetModel.prototype.getHeaderLayoutMixins = function () {
        var _this = this;
        var layoutMixins = {};
        ['row', 'column'].forEach(function (channel) {
            ['header', 'footer'].forEach(function (headerType) {
                var layoutHeaderComponent = _this.component.layoutHeaders[channel];
                var headerComponent = layoutHeaderComponent[headerType];
                if (headerComponent && headerComponent[0]) {
                    var sizeType = channel === 'row' ? 'height' : 'width';
                    var bandType = headerType === 'header' ? 'headerBand' : 'footerBand';
                    if (!_this.child.component.layoutSize.get(sizeType)) {
                        layoutMixins[bandType] = layoutMixins[bandType] || {};
                        layoutMixins[bandType][channel] = 0.5;
                    }
                    if (layoutHeaderComponent.title) {
                        layoutMixins.offset = layoutMixins.offset || {};
                        layoutMixins.offset[channel === 'row' ? 'rowTitle' : 'columnTitle'] = 10;
                    }
                }
            });
        });
        return layoutMixins;
    };
    FacetModel.prototype.assembleDefaultLayout = function () {
        var columns = this.channelHasField('column') ? this.columnDistinctSignal() : 1;
        return tslib_1.__assign({}, this.getHeaderLayoutMixins(), { columns: columns, bounds: 'full', align: 'all' });
    };
    FacetModel.prototype.assembleLayoutSignals = function () {
        return this.child.assembleLayoutSignals();
    };
    FacetModel.prototype.columnDistinctSignal = function () {
        if (this.parent && (this.parent instanceof FacetModel)) {
            return undefined;
        }
        else {
            var facetLayoutDataName = this.getName('column_domain');
            return { signal: "length(data('" + facetLayoutDataName + "'))" };
        }
    };
    FacetModel.prototype.assembleGroup = function (signals) {
        if (this.parent && (this.parent instanceof FacetModel)) {
            return tslib_1.__assign({}, (this.channelHasField('column') ? {
                encode: {
                    update: {
                        columns: { field: vgField(this.facet.column, { prefix: 'distinct' }) }
                    }
                }
            } : {}), _super.prototype.assembleGroup.call(this, signals));
        }
        return _super.prototype.assembleGroup.call(this, signals);
    };
    FacetModel.prototype.getCardinalityAggregateForChild = function () {
        var fields = [];
        var ops = [];
        var as = [];
        if (this.child instanceof FacetModel) {
            if (this.child.channelHasField('column')) {
                var field$$1 = vgField(this.child.facet.column);
                fields.push(field$$1);
                ops.push('distinct');
                as.push("distinct_" + field$$1);
            }
        }
        else {
            for (var _i = 0, _a = ['x', 'y']; _i < _a.length; _i++) {
                var channel = _a[_i];
                var childScaleComponent = this.child.component.scales[channel];
                if (childScaleComponent && !childScaleComponent.merged) {
                    var type = childScaleComponent.get('type');
                    var range = childScaleComponent.get('range');
                    if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                        var domain = assembleDomain(this.child, channel);
                        var field$$1 = getFieldFromDomain(domain);
                        if (field$$1) {
                            fields.push(field$$1);
                            ops.push('distinct');
                            as.push("distinct_" + field$$1);
                        }
                        else {
                            warn$1('Unknown field for ${channel}.  Cannot calculate view size.');
                        }
                    }
                }
            }
        }
        return { fields: fields, ops: ops, as: as };
    };
    FacetModel.prototype.assembleFacet = function () {
        var _this = this;
        var _a = this.component.data.facetRoot, name = _a.name, data = _a.data;
        var _b = this.facet, row = _b.row, column = _b.column;
        var _c = this.getCardinalityAggregateForChild(), fields = _c.fields, ops = _c.ops, as = _c.as;
        var groupby = [];
        ['row', 'column'].forEach(function (channel) {
            var fieldDef = _this.facet[channel];
            if (fieldDef) {
                groupby.push(vgField(fieldDef));
                var sort = fieldDef.sort;
                if (isSortField(sort)) {
                    var field$$1 = sort.field, op = sort.op;
                    var outputName = facetSortFieldName(fieldDef, sort);
                    if (row && column) {
                        fields.push(outputName);
                        ops.push('max');
                        as.push(outputName);
                    }
                    else {
                        fields.push(field$$1);
                        ops.push(op);
                        as.push(outputName);
                    }
                }
                else if (isArray(sort)) {
                    var outputName = sortArrayIndexField(fieldDef, channel);
                    fields.push(outputName);
                    ops.push('max');
                    as.push(outputName);
                }
            }
        });
        var cross = !!row && !!column;
        return tslib_1.__assign({ name: name,
            data: data,
            groupby: groupby }, (cross || fields.length ? {
            aggregate: tslib_1.__assign({}, (cross ? { cross: cross } : {}), (fields.length ? { fields: fields, ops: ops, as: as } : {}))
        } : {}));
    };
    FacetModel.prototype.headerSortFields = function (channel) {
        var facet = this.facet;
        var fieldDef = facet[channel];
        if (fieldDef) {
            if (isSortField(fieldDef.sort)) {
                return [facetSortFieldName(fieldDef, fieldDef.sort, 'datum')];
            }
            else if (isArray(fieldDef.sort)) {
                return [sortArrayIndexField(fieldDef, channel, 'datum')];
            }
            return [vgField(fieldDef, { expr: 'datum' })];
        }
        return [];
    };
    FacetModel.prototype.headerSortOrder = function (channel) {
        var facet = this.facet;
        var fieldDef = facet[channel];
        if (fieldDef) {
            var sort = fieldDef.sort;
            var order = (isSortField(sort) ? sort.order : !isArray(sort) && sort) || 'ascending';
            return [order];
        }
        return [];
    };
    FacetModel.prototype.assembleMarks = function () {
        var child = this.child;
        var facetRoot = this.component.data.facetRoot;
        var data = assembleFacetData(facetRoot);
        var layoutSizeEncodeEntry = child.assembleLayoutSize();
        var title$$1 = child.assembleTitle();
        var style = child.assembleGroupStyle();
        var markGroup = tslib_1.__assign({ name: this.getName('cell'), type: 'group' }, (title$$1 ? { title: title$$1 } : {}), (style ? { style: style } : {}), { from: {
                facet: this.assembleFacet()
            },
            sort: {
                field: this.headerSortFields('row').concat(this.headerSortFields('column')),
                order: this.headerSortOrder('row').concat(this.headerSortOrder('column'))
            } }, (data.length > 0 ? { data: data } : {}), (layoutSizeEncodeEntry ? { encode: { update: layoutSizeEncodeEntry } } : {}), child.assembleGroup());
        return [markGroup];
    };
    FacetModel.prototype.getMapping = function () {
        return this.facet;
    };
    return FacetModel;
}(ModelWithField));

var WindowTransformNode =               (function (_super) {
    tslib_1.__extends(WindowTransformNode, _super);
    function WindowTransformNode(parent, transform) {
        var _this = _super.call(this, parent) || this;
        _this.transform = transform;
        return _this;
    }
    WindowTransformNode.makeFromFacet = function (parent, facet) {
        var row = facet.row, column = facet.column;
        if (row && column) {
            var newParent = null;
            for (var _i = 0, _a = [row, column]; _i < _a.length; _i++) {
                var fieldDef = _a[_i];
                if (isSortField(fieldDef.sort)) {
                    var _b = fieldDef.sort, field = _b.field, op = _b.op;
                    parent = newParent = new WindowTransformNode(parent, {
                        window: [{
                                op: op,
                                field: field,
                                as: facetSortFieldName(fieldDef, fieldDef.sort)
                            }],
                        groupby: [vgField(fieldDef)],
                        frame: [null, null]
                    });
                }
            }
            return newParent;
        }
        return null;
    };
    WindowTransformNode.prototype.clone = function () {
        return new WindowTransformNode(this.parent, duplicate(this.transform));
    };
    WindowTransformNode.prototype.producedFields = function () {
        var _this = this;
        var out = {};
        this.transform.window.forEach(function (windowFieldDef) {
            out[_this.getDefaultName(windowFieldDef)] = true;
        });
        return out;
    };
    WindowTransformNode.prototype.getDefaultName = function (windowFieldDef) {
        return windowFieldDef.as || vgField(windowFieldDef);
    };
    WindowTransformNode.prototype.assemble = function () {
        var fields = [];
        var ops = [];
        var as = [];
        var params = [];
        for (var _i = 0, _a = this.transform.window; _i < _a.length; _i++) {
            var window_1 = _a[_i];
            ops.push(window_1.op);
            as.push(this.getDefaultName(window_1));
            params.push(window_1.param === undefined ? null : window_1.param);
            fields.push(window_1.field === undefined ? null : window_1.field);
        }
        var frame = this.transform.frame;
        var groupby = this.transform.groupby;
        var sortFields = [];
        var sortOrder = [];
        if (this.transform.sort !== undefined) {
            for (var _b = 0, _c = this.transform.sort; _b < _c.length; _b++) {
                var sortField = _c[_b];
                sortFields.push(sortField.field);
                sortOrder.push(sortField.order || 'ascending');
            }
        }
        var sort = {
            field: sortFields,
            order: sortOrder,
        };
        var ignorePeers = this.transform.ignorePeers;
        var result = {
            type: 'window',
            params: params,
            as: as,
            ops: ops,
            fields: fields,
            sort: sort,
        };
        if (ignorePeers !== undefined) {
            result.ignorePeers = ignorePeers;
        }
        if (groupby !== undefined) {
            result.groupby = groupby;
        }
        if (frame !== undefined) {
            result.frame = frame;
        }
        return result;
    };
    return WindowTransformNode;
}(DataFlowNode));

function parseRoot(model, sources) {
    if (model.data || !model.parent) {
        var source = new SourceNode(model.data);
        var hash$$1 = source.hash();
        if (hash$$1 in sources) {
            return sources[hash$$1];
        }
        else {
            sources[hash$$1] = source;
            return source;
        }
    }
    else {
        return model.parent.component.data.facetRoot ? model.parent.component.data.facetRoot : model.parent.component.data.main;
    }
}
function parseTransformArray(head, model, ancestorParse) {
    var lookupCounter = 0;
    model.transforms.forEach(function (t) {
        if (isCalculate(t)) {
            head = new CalculateNode(head, t);
            ancestorParse.set(t.as, 'derived', false);
        }
        else if (isFilter(t)) {
            head = ParseNode.makeImplicitFromFilterTransform(head, t, ancestorParse) || head;
            head = new FilterNode(head, model, t.filter);
        }
        else if (isBin(t)) {
            var bin = head = BinNode.makeFromTransform(head, t, model);
            for (var _i = 0, _a = keys$1(bin.producedFields()); _i < _a.length; _i++) {
                var field = _a[_i];
                ancestorParse.set(field, 'number', false);
            }
        }
        else if (isTimeUnit$1(t)) {
            head = TimeUnitNode.makeFromTransform(head, t);
            ancestorParse.set(t.as, 'date', false);
        }
        else if (isAggregate$1(t)) {
            var agg = head = AggregateNode.makeFromTransform(head, t);
            if (requiresSelectionId(model)) {
                head = new IdentifierNode(head);
            }
            for (var _b = 0, _c = keys$1(agg.producedFields()); _b < _c.length; _b++) {
                var field = _c[_b];
                ancestorParse.set(field, 'derived', false);
            }
        }
        else if (isLookup(t)) {
            var lookup = head = LookupNode.make(head, model, t, lookupCounter++);
            for (var _d = 0, _e = keys$1(lookup.producedFields()); _d < _e.length; _d++) {
                var field = _e[_d];
                ancestorParse.set(field, 'derived', false);
            }
        }
        else if (isWindow(t)) {
            var window_1 = head = new WindowTransformNode(head, t);
            for (var _f = 0, _g = keys$1(window_1.producedFields()); _f < _g.length; _f++) {
                var field = _g[_f];
                ancestorParse.set(field, 'derived', false);
            }
        }
        else if (isStack(t)) {
            var stack = head = StackNode.makeFromTransform(head, t);
            for (var _h = 0, _j = keys$1(stack.producedFields()); _h < _j.length; _h++) {
                var field = _j[_h];
                ancestorParse.set(field, 'derived', false);
            }
        }
        else {
            warn$1(message.invalidTransformIgnored(t));
            return;
        }
    });
    return head;
}
function parseData$2(model) {
    var head = parseRoot(model, model.component.data.sources);
    var _a = model.component.data, outputNodes = _a.outputNodes, outputNodeRefCounts = _a.outputNodeRefCounts;
    var ancestorParse = model.parent ? model.parent.component.data.ancestorParse.clone() : new AncestorParse();
    if (model.data && model.data.format && model.data.format.parse === null) {
        ancestorParse.parseNothing = true;
    }
    head = ParseNode.makeExplicit(head, model, ancestorParse) || head;
    if (requiresSelectionId(model) && (isUnitModel(model) || isLayerModel(model))) {
        head = new IdentifierNode(head);
    }
    var parentIsLayer = model.parent && isLayerModel(model.parent);
    if (isUnitModel(model) || isFacetModel(model)) {
        if (parentIsLayer) {
            head = BinNode.makeFromEncoding(head, model) || head;
        }
    }
    if (model.transforms.length > 0) {
        head = parseTransformArray(head, model, ancestorParse);
    }
    head = ParseNode.makeImplicitFromEncoding(head, model, ancestorParse) || head;
    if (isUnitModel(model)) {
        head = GeoJSONNode.parseAll(head, model);
        head = GeoPointNode.parseAll(head, model);
    }
    if (isUnitModel(model) || isFacetModel(model)) {
        if (!parentIsLayer) {
            head = BinNode.makeFromEncoding(head, model) || head;
        }
        head = TimeUnitNode.makeFromEncoding(head, model) || head;
        head = CalculateNode.parseAllForSortIndex(head, model);
    }
    var rawName = model.getName(RAW);
    var raw = new OutputNode(head, rawName, RAW, outputNodeRefCounts);
    outputNodes[rawName] = raw;
    head = raw;
    if (isUnitModel(model)) {
        var agg = AggregateNode.makeFromEncoding(head, model);
        if (agg) {
            head = agg;
            if (requiresSelectionId(model)) {
                head = new IdentifierNode(head);
            }
        }
        head = StackNode.makeFromEncoding(head, model) || head;
    }
    if (isUnitModel(model)) {
        head = FilterInvalidNode.make(head, model) || head;
    }
    var mainName = model.getName(MAIN);
    var main = new OutputNode(head, mainName, MAIN, outputNodeRefCounts);
    outputNodes[mainName] = main;
    head = main;
    var facetRoot = null;
    if (isFacetModel(model)) {
        var facetName = model.getName('facet');
        head = CalculateNode.parseAllForSortIndex(head, model);
        head = WindowTransformNode.makeFromFacet(head, model.facet) || head;
        facetRoot = new FacetNode(head, model, facetName, main.getSource());
        outputNodes[facetName] = facetRoot;
        head = facetRoot;
    }
    return tslib_1.__assign({}, model.component.data, { outputNodes: outputNodes,
        outputNodeRefCounts: outputNodeRefCounts,
        raw: raw,
        main: main,
        facetRoot: facetRoot,
        ancestorParse: ancestorParse });
}

var BaseConcatModel =               (function (_super) {
    tslib_1.__extends(BaseConcatModel, _super);
    function BaseConcatModel(spec, parent, parentGivenName, config, repeater, resolve) {
        return _super.call(this, spec, parent, parentGivenName, config, repeater, resolve) || this;
    }
    BaseConcatModel.prototype.parseData = function () {
        this.component.data = parseData$2(this);
        this.children.forEach(function (child) {
            child.parseData();
        });
    };
    BaseConcatModel.prototype.parseSelection = function () {
        var _this = this;
        this.component.selection = {};
        var _loop_1 = function (child) {
            child.parseSelection();
            keys$1(child.component.selection).forEach(function (key) {
                _this.component.selection[key] = child.component.selection[key];
            });
        };
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            _loop_1(child);
        }
    };
    BaseConcatModel.prototype.parseMarkGroup = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parseMarkGroup();
        }
    };
    BaseConcatModel.prototype.parseAxisAndHeader = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parseAxisAndHeader();
        }
    };
    BaseConcatModel.prototype.assembleSelectionTopLevelSignals = function (signals) {
        return this.children.reduce(function (sg, child) { return child.assembleSelectionTopLevelSignals(sg); }, signals);
    };
    BaseConcatModel.prototype.assembleSelectionSignals = function () {
        this.children.forEach(function (child) { return child.assembleSelectionSignals(); });
        return [];
    };
    BaseConcatModel.prototype.assembleLayoutSignals = function () {
        return this.children.reduce(function (signals, child) {
            return signals.concat(child.assembleLayoutSignals());
        }, assembleLayoutSignals(this));
    };
    BaseConcatModel.prototype.assembleSelectionData = function (data) {
        return this.children.reduce(function (db, child) { return child.assembleSelectionData(db); }, data);
    };
    BaseConcatModel.prototype.assembleMarks = function () {
        return this.children.map(function (child) {
            var title = child.assembleTitle();
            var style = child.assembleGroupStyle();
            var layoutSizeEncodeEntry = child.assembleLayoutSize();
            return tslib_1.__assign({ type: 'group', name: child.getName('group') }, (title ? { title: title } : {}), (style ? { style: style } : {}), (layoutSizeEncodeEntry ? {
                encode: {
                    update: layoutSizeEncodeEntry
                }
            } : {}), child.assembleGroup());
        });
    };
    return BaseConcatModel;
}(Model));

var ConcatModel =               (function (_super) {
    tslib_1.__extends(ConcatModel, _super);
    function ConcatModel(spec, parent, parentGivenName, repeater, config) {
        var _this = _super.call(this, spec, parent, parentGivenName, config, repeater, spec.resolve) || this;
        _this.type = 'concat';
        if (spec.resolve && spec.resolve.axis && (spec.resolve.axis.x === 'shared' || spec.resolve.axis.y === 'shared')) {
            warn$1(message.CONCAT_CANNOT_SHARE_AXIS);
        }
        _this.isVConcat = isVConcatSpec(spec);
        _this.children = (isVConcatSpec(spec) ? spec.vconcat : spec.hconcat).map(function (child, i) {
            return buildModel(child, _this, _this.getName('concat_' + i), undefined, repeater, config, false);
        });
        return _this;
    }
    ConcatModel.prototype.parseLayoutSize = function () {
        parseConcatLayoutSize(this);
    };
    ConcatModel.prototype.parseAxisGroup = function () {
        return null;
    };
    ConcatModel.prototype.assembleDefaultLayout = function () {
        return tslib_1.__assign({}, (this.isVConcat ? { columns: 1 } : {}), { bounds: 'full',
            align: 'each' });
    };
    return ConcatModel;
}(BaseConcatModel));

function isFalseOrNull(v) {
    return v === false || v === null;
}
var AxisComponent =               (function (_super) {
    tslib_1.__extends(AxisComponent, _super);
    function AxisComponent(explicit, implicit, mainExtracted) {
        if (explicit === void 0) { explicit = {}; }
        if (implicit === void 0) { implicit = {}; }
        if (mainExtracted === void 0) { mainExtracted = false; }
        var _this = _super.call(this) || this;
        _this.explicit = explicit;
        _this.implicit = implicit;
        _this.mainExtracted = mainExtracted;
        return _this;
    }
    AxisComponent.prototype.clone = function () {
        return new AxisComponent(duplicate(this.explicit), duplicate(this.implicit), this.mainExtracted);
    };
    AxisComponent.prototype.hasAxisPart = function (part) {
        if (part === 'axis') {
            return true;
        }
        if (part === 'grid' || part === 'title') {
            return !!this.get(part);
        }
        return !isFalseOrNull(this.get(part));
    };
    return AxisComponent;
}(Split));

function getAxisConfig(property, config, channel, orient, scaleType) {
    if (orient === void 0) { orient = ''; }
    var configTypes = (scaleType === 'band' ? ['axisBand'] : []).concat([
        channel === 'x' ? 'axisX' : 'axisY',
        'axis' + orient.substr(0, 1).toUpperCase() + orient.substr(1),
        'axis'
    ]);
    for (var _i = 0, configTypes_1 = configTypes; _i < configTypes_1.length; _i++) {
        var configType = configTypes_1[_i];
        if (config[configType] && config[configType][property] !== undefined) {
            return config[configType][property];
        }
    }
    return undefined;
}

function labels$1(model, channel, specifiedLabelsSpec, orient) {
    var fieldDef = model.fieldDef(channel) ||
        (channel === 'x' ? model.fieldDef('x2') :
            channel === 'y' ? model.fieldDef('y2') :
                undefined);
    var axis = model.axis(channel);
    var config = model.config;
    var labelsSpec = {};
    if (isTimeFieldDef(fieldDef)) {
        var isUTCScale = model.getScaleComponent(channel).get('type') === ScaleType.UTC;
        var expr = timeFormatExpression('datum.value', fieldDef.timeUnit, axis.format, config.axis.shortTimeLabels, config.timeFormat, isUTCScale);
        if (expr) {
            labelsSpec.text = { signal: expr };
        }
    }
    var angle = getAxisConfig('labelAngle', model.config, channel, orient, model.getScaleComponent(channel).get('type'));
    if (angle === undefined) {
        angle = labelAngle(axis, channel, fieldDef);
        if (angle) {
            labelsSpec.angle = { value: angle };
        }
    }
    if (angle !== undefined) {
        var align = labelAlign$1(angle, orient);
        if (align) {
            labelsSpec.align = { value: align };
        }
        labelsSpec.baseline = labelBaseline$1(angle, orient);
    }
    labelsSpec = tslib_1.__assign({}, labelsSpec, specifiedLabelsSpec);
    return keys$1(labelsSpec).length === 0 ? undefined : labelsSpec;
}
function labelBaseline$1(angle, orient) {
    if (orient === 'top' || orient === 'bottom') {
        if (angle <= 45 || 315 <= angle) {
            return { value: orient === 'top' ? 'bottom' : 'top' };
        }
        else if (135 <= angle && angle <= 225) {
            return { value: orient === 'top' ? 'top' : 'bottom' };
        }
        else {
            return { value: 'middle' };
        }
    }
    else {
        if ((angle <= 45 || 315 <= angle) || (135 <= angle && angle <= 225)) {
            return { value: 'middle' };
        }
        else if (45 <= angle && angle <= 135) {
            return { value: orient === 'left' ? 'top' : 'bottom' };
        }
        else {
            return { value: orient === 'left' ? 'bottom' : 'top' };
        }
    }
}
function labelAngle(axis, channel, fieldDef) {
    if (axis.labelAngle !== undefined) {
        return ((axis.labelAngle % 360) + 360) % 360;
    }
    else {
        if (channel === X && contains([NOMINAL, ORDINAL], fieldDef.type)) {
            return 270;
        }
    }
    return undefined;
}
function labelAlign$1(angle, orient) {
    angle = ((angle % 360) + 360) % 360;
    if (orient === 'top' || orient === 'bottom') {
        if (angle % 180 === 0) {
            return 'center';
        }
        else if (0 < angle && angle < 180) {
            return orient === 'top' ? 'right' : 'left';
        }
        else {
            return orient === 'top' ? 'left' : 'right';
        }
    }
    else {
        if ((angle + 90) % 180 === 0) {
            return 'center';
        }
        else if (90 <= angle && angle < 270) {
            return orient === 'left' ? 'left' : 'right';
        }
        else {
            return orient === 'left' ? 'right' : 'left';
        }
    }
}

function grid(scaleType, fieldDef) {
    return !hasDiscreteDomain(scaleType) && !fieldDef.bin;
}
function gridScale(model, channel) {
    var gridChannel = channel === 'x' ? 'y' : 'x';
    if (model.getScaleComponent(gridChannel)) {
        return model.scaleName(gridChannel);
    }
    return undefined;
}
function labelFlush(fieldDef, channel, specifiedAxis) {
    if (specifiedAxis.labelFlush !== undefined) {
        return specifiedAxis.labelFlush;
    }
    if (channel === 'x' && contains(['quantitative', 'temporal'], fieldDef.type)) {
        return true;
    }
    return undefined;
}
function labelOverlap(fieldDef, specifiedAxis, channel, scaleType) {
    if (specifiedAxis.labelOverlap !== undefined) {
        return specifiedAxis.labelOverlap;
    }
    if (fieldDef.type !== 'nominal') {
        if (scaleType === 'log') {
            return 'greedy';
        }
        return true;
    }
    return undefined;
}
function orient(channel) {
    switch (channel) {
        case X:
            return 'bottom';
        case Y:
            return 'left';
    }
    throw new Error(message.INVALID_CHANNEL_FOR_AXIS);
}
function tickCount$1(channel, fieldDef, scaleType, size) {
    if (!hasDiscreteDomain(scaleType) && scaleType !== 'log' && !contains(['month', 'hours', 'day', 'quarter'], fieldDef.timeUnit)) {
        if (fieldDef.bin) {
            return { signal: "ceil(" + size.signal + "/20)" };
        }
        return { signal: "ceil(" + size.signal + "/40)" };
    }
    return undefined;
}
function values$2(specifiedAxis, model, fieldDef, channel) {
    var vals$$1 = specifiedAxis.values;
    if (vals$$1) {
        return valueArray(fieldDef, vals$$1);
    }
    if (fieldDef.bin && fieldDef.type === QUANTITATIVE) {
        var domain = model.scaleDomain(channel);
        if (domain && domain !== 'unaggregated' && !isSelectionDomain(domain)) {
            return undefined;
        }
        var signal = model.getName(binToString(fieldDef.bin) + "_" + fieldDef.field + "_bins");
        return { signal: "sequence(" + signal + ".start, " + signal + ".stop + " + signal + ".step, " + signal + ".step)" };
    }
    return undefined;
}

function parseUnitAxis(model) {
    return POSITION_SCALE_CHANNELS.reduce(function (axis, channel) {
        if (model.component.scales[channel] && model.axis(channel)) {
            axis[channel] = [parseAxis$1(channel, model)];
        }
        return axis;
    }, {});
}
var OPPOSITE_ORIENT = {
    bottom: 'top',
    top: 'bottom',
    left: 'right',
    right: 'left'
};
function parseLayerAxis(model) {
    var _a = model.component, axes = _a.axes, resolve = _a.resolve;
    var axisCount = { top: 0, bottom: 0, right: 0, left: 0 };
    for (var _i = 0, _b = model.children; _i < _b.length; _i++) {
        var child = _b[_i];
        child.parseAxisAndHeader();
        for (var _c = 0, _d = keys$1(child.component.axes); _c < _d.length; _c++) {
            var channel = _d[_c];
            resolve.axis[channel] = parseGuideResolve(model.component.resolve, channel);
            if (resolve.axis[channel] === 'shared') {
                axes[channel] = mergeAxisComponents(axes[channel], child.component.axes[channel]);
                if (!axes[channel]) {
                    resolve.axis[channel] = 'independent';
                    delete axes[channel];
                }
            }
        }
    }
    for (var _e = 0, _f = [X, Y]; _e < _f.length; _e++) {
        var channel = _f[_e];
        for (var _g = 0, _h = model.children; _g < _h.length; _g++) {
            var child = _h[_g];
            if (!child.component.axes[channel]) {
                continue;
            }
            if (resolve.axis[channel] === 'independent') {
                axes[channel] = (axes[channel] || []).concat(child.component.axes[channel]);
                for (var _j = 0, _k = child.component.axes[channel]; _j < _k.length; _j++) {
                    var axisComponent = _k[_j];
                    var _l = axisComponent.getWithExplicit('orient'), orient$$1 = _l.value, explicit = _l.explicit;
                    if (axisCount[orient$$1] > 0 && !explicit) {
                        var oppositeOrient = OPPOSITE_ORIENT[orient$$1];
                        if (axisCount[orient$$1] > axisCount[oppositeOrient]) {
                            axisComponent.set('orient', oppositeOrient, false);
                        }
                    }
                    axisCount[orient$$1]++;
                }
            }
            delete child.component.axes[channel];
        }
    }
}
function mergeAxisComponents(mergedAxisCmpts, childAxisCmpts) {
    if (mergedAxisCmpts) {
        if (mergedAxisCmpts.length !== childAxisCmpts.length) {
            return undefined;
        }
        var length_1 = mergedAxisCmpts.length;
        for (var i = 0; i < length_1; i++) {
            var merged = mergedAxisCmpts[i];
            var child = childAxisCmpts[i];
            if ((!!merged) !== (!!child)) {
                return undefined;
            }
            else if (merged && child) {
                var mergedOrient = merged.getWithExplicit('orient');
                var childOrient = child.getWithExplicit('orient');
                if (mergedOrient.explicit && childOrient.explicit && mergedOrient.value !== childOrient.value) {
                    return undefined;
                }
                else {
                    mergedAxisCmpts[i] = mergeAxisComponent(merged, child);
                }
            }
        }
    }
    else {
        return childAxisCmpts.map(function (axisComponent) { return axisComponent.clone(); });
    }
    return mergedAxisCmpts;
}
function mergeAxisComponent(merged, child) {
    var _loop_1 = function (prop) {
        var mergedValueWithExplicit = mergeValuesWithExplicit(merged.getWithExplicit(prop), child.getWithExplicit(prop), prop, 'axis',
        function (v1, v2) {
            switch (prop) {
                case 'title':
                    return mergeTitleComponent(v1, v2);
                case 'gridScale':
                    return {
                        explicit: v1.explicit,
                        value: v1.value || v2.value
                    };
            }
            return defaultTieBreaker(v1, v2, prop, 'axis');
        });
        merged.setWithExplicit(prop, mergedValueWithExplicit);
    };
    for (var _i = 0, VG_AXIS_PROPERTIES_1 = VG_AXIS_PROPERTIES; _i < VG_AXIS_PROPERTIES_1.length; _i++) {
        var prop = VG_AXIS_PROPERTIES_1[_i];
        _loop_1(prop);
    }
    return merged;
}
function getFieldDefTitle(model, channel) {
    var channel2 = channel === 'x' ? 'x2' : 'y2';
    var fieldDef = model.fieldDef(channel);
    var fieldDef2 = model.fieldDef(channel2);
    var title1 = fieldDef ? fieldDef.title : undefined;
    var title2 = fieldDef2 ? fieldDef2.title : undefined;
    if (title1 && title2) {
        return mergeTitle(title1, title2);
    }
    else if (title1) {
        return title1;
    }
    else if (title2) {
        return title2;
    }
    else if (title1 !== undefined) {
        return title1;
    }
    else if (title2 !== undefined) {
        return title2;
    }
    return undefined;
}
function parseAxis$1(channel, model) {
    var axis = model.axis(channel);
    var axisComponent = new AxisComponent();
    VG_AXIS_PROPERTIES.forEach(function (property) {
        var value = getProperty$1(property, axis, channel, model);
        if (value !== undefined) {
            var explicit =
            property === 'values' ? !!axis.values :
                property === 'encode' ? !!axis.encoding || !!axis.labelAngle :
                    property === 'title' && value === getFieldDefTitle(model, channel) ? true :
                        value === axis[property];
            var configValue = getAxisConfig(property, model.config, channel, axisComponent.get('orient'), model.getScaleComponent(channel).get('type'));
            if (explicit || configValue === undefined) {
                axisComponent.set(property, value, explicit);
            }
            else if (property === 'grid' && configValue) {
                axisComponent.set(property, configValue, false);
            }
        }
    });
    var axisEncoding = axis.encoding || {};
    var axisEncode = AXIS_PARTS.reduce(function (e, part) {
        if (!axisComponent.hasAxisPart(part)) {
            return e;
        }
        var axisEncodingPart = guideEncodeEntry(axisEncoding[part] || {}, model);
        var value = part === 'labels' ?
            labels$1(model, channel, axisEncodingPart, axisComponent.get('orient')) :
            axisEncodingPart;
        if (value !== undefined && keys$1(value).length > 0) {
            e[part] = { update: value };
        }
        return e;
    }, {});
    if (keys$1(axisEncode).length > 0) {
        axisComponent.set('encode', axisEncode, !!axis.encoding || axis.labelAngle !== undefined);
    }
    return axisComponent;
}
function getProperty$1(property, specifiedAxis, channel, model) {
    var fieldDef = model.fieldDef(channel);
    switch (property) {
        case 'scale':
            return model.scaleName(channel);
        case 'gridScale':
            return gridScale(model, channel);
        case 'format':
            return numberFormat(fieldDef, specifiedAxis.format, model.config);
        case 'grid': {
            var scaleType = model.getScaleComponent(channel).get('type');
            return getSpecifiedOrDefaultValue(specifiedAxis.grid, grid(scaleType, fieldDef));
        }
        case 'labelFlush':
            return labelFlush(fieldDef, channel, specifiedAxis);
        case 'labelOverlap': {
            var scaleType = model.getScaleComponent(channel).get('type');
            return labelOverlap(fieldDef, specifiedAxis, channel, scaleType);
        }
        case 'orient':
            return getSpecifiedOrDefaultValue(specifiedAxis.orient, orient(channel));
        case 'tickCount': {
            var scaleType = model.getScaleComponent(channel).get('type');
            var sizeType = channel === 'x' ? 'width' : channel === 'y' ? 'height' : undefined;
            var size = sizeType ? model.getSizeSignalRef(sizeType)
                : undefined;
            return getSpecifiedOrDefaultValue(specifiedAxis.tickCount, tickCount$1(channel, fieldDef, scaleType, size));
        }
        case 'title':
            var channel2 = channel === 'x' ? 'x2' : 'y2';
            var fieldDef2 = model.fieldDef(channel2);
            var fieldDefTitle = getFieldDefTitle(model, channel);
            var specifiedTitle = fieldDefTitle !== undefined ? fieldDefTitle :
                specifiedAxis.title === undefined ? undefined : specifiedAxis.title;
            return getSpecifiedOrDefaultValue(specifiedTitle,
            mergeTitleFieldDefs([toFieldDefBase(fieldDef)], fieldDef2 ? [toFieldDefBase(fieldDef2)] : []));
        case 'values':
            return values$2(specifiedAxis, model, fieldDef, channel);
    }
    return isAxisProperty(property) ? specifiedAxis[property] : undefined;
}

function normalizeMarkDef(mark, encoding, config) {
    var markDef = isMarkDef(mark) ? tslib_1.__assign({}, mark) : { type: mark };
    var specifiedOrient = markDef.orient || getMarkConfig('orient', markDef, config);
    markDef.orient = orient$1(markDef.type, encoding, specifiedOrient);
    if (specifiedOrient !== undefined && specifiedOrient !== markDef.orient) {
        warn$1(message.orientOverridden(markDef.orient, specifiedOrient));
    }
    var specifiedOpacity = markDef.opacity !== undefined ? markDef.opacity : getMarkConfig('opacity', markDef, config);
    if (specifiedOpacity === undefined) {
        markDef.opacity = opacity(markDef.type, encoding);
    }
    var specifiedFilled = markDef.filled;
    if (specifiedFilled === undefined) {
        markDef.filled = filled(markDef, config);
    }
    var specifiedCursor = markDef.cursor || getMarkConfig('cursor', markDef, config);
    if (specifiedCursor === undefined) {
        markDef.cursor = cursor$1(markDef, encoding, config);
    }
    return markDef;
}
function cursor$1(markDef, encoding, config) {
    if (encoding.href || markDef.href || getMarkConfig('href', markDef, config)) {
        return 'pointer';
    }
    return markDef.cursor;
}
function opacity(mark, encoding) {
    if (contains([POINT, TICK, CIRCLE, SQUARE], mark)) {
        if (!isAggregate(encoding)) {
            return 0.7;
        }
    }
    return undefined;
}
function filled(markDef, config) {
    var filledConfig = getMarkConfig('filled', markDef, config);
    var mark = markDef.type;
    return filledConfig !== undefined ? filledConfig : mark !== POINT && mark !== LINE && mark !== RULE;
}
function orient$1(mark, encoding, specifiedOrient) {
    switch (mark) {
        case POINT:
        case CIRCLE:
        case SQUARE:
        case TEXT$1:
        case RECT:
            return undefined;
    }
    var yIsRange = encoding.y2;
    var xIsRange = encoding.x2;
    switch (mark) {
        case BAR:
            if (yIsRange || xIsRange) {
                if (specifiedOrient) {
                    return specifiedOrient;
                }
                var xDef = encoding.x;
                if (!xIsRange && isFieldDef(xDef) && xDef.type === QUANTITATIVE && !xDef.bin) {
                    return 'horizontal';
                }
                var yDef = encoding.y;
                if (!yIsRange && isFieldDef(yDef) && yDef.type === QUANTITATIVE && !yDef.bin) {
                    return 'vertical';
                }
            }
        case RULE:
            if (xIsRange && yIsRange) {
                return undefined;
            }
        case AREA:
            if (yIsRange) {
                return 'vertical';
            }
            else if (xIsRange) {
                return 'horizontal';
            }
            else if (mark === RULE) {
                if (encoding.x && !encoding.y) {
                    return 'vertical';
                }
                else if (encoding.y && !encoding.x) {
                    return 'horizontal';
                }
            }
        case LINE:
        case TICK:
            var xIsContinuous = isFieldDef(encoding.x) && isContinuous(encoding.x);
            var yIsContinuous = isFieldDef(encoding.y) && isContinuous(encoding.y);
            if (xIsContinuous && !yIsContinuous) {
                return mark !== 'tick' ? 'horizontal' : 'vertical';
            }
            else if (!xIsContinuous && yIsContinuous) {
                return mark !== 'tick' ? 'vertical' : 'horizontal';
            }
            else if (xIsContinuous && yIsContinuous) {
                var xDef = encoding.x;
                var yDef = encoding.y;
                var xIsTemporal = xDef.type === TEMPORAL;
                var yIsTemporal = yDef.type === TEMPORAL;
                if (xIsTemporal && !yIsTemporal) {
                    return mark !== 'tick' ? 'vertical' : 'horizontal';
                }
                else if (!xIsTemporal && yIsTemporal) {
                    return mark !== 'tick' ? 'horizontal' : 'vertical';
                }
                if (!xDef.aggregate && yDef.aggregate) {
                    return mark !== 'tick' ? 'vertical' : 'horizontal';
                }
                else if (xDef.aggregate && !yDef.aggregate) {
                    return mark !== 'tick' ? 'horizontal' : 'vertical';
                }
                if (specifiedOrient) {
                    return specifiedOrient;
                }
                return 'vertical';
            }
            else {
                if (specifiedOrient) {
                    return specifiedOrient;
                }
                return undefined;
            }
    }
    return 'vertical';
}

var area$2 = {
    vgMark: 'area',
    encodeEntry: function (model) {
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'include' }), pointPosition('x', model, 'zeroOrMin'), pointPosition('y', model, 'zeroOrMin'), pointPosition2(model, 'zeroOrMin', model.markDef.orient === 'horizontal' ? 'x2' : 'y2'), defined$1(model));
    }
};

var bar = {
    vgMark: 'rect',
    encodeEntry: function (model) {
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }), x$1(model), y$1(model));
    }
};
function x$1(model) {
    var config = model.config, encoding = model.encoding, markDef = model.markDef, width = model.width;
    var orient = markDef.orient;
    var sizeDef = encoding.size;
    var xDef = encoding.x;
    var x2Def = encoding.x2;
    var xScaleName = model.scaleName(X);
    var xScale = model.getScaleComponent(X);
    if (orient === 'horizontal' || x2Def) {
        return tslib_1.__assign({}, pointPosition('x', model, 'zeroOrMin'), pointPosition2(model, 'zeroOrMin', 'x2'));
    }
    else {
        if (isFieldDef(xDef)) {
            var xScaleType = xScale.get('type');
            if (xDef.bin && !sizeDef && !hasDiscreteDomain(xScaleType)) {
                return binnedPosition(xDef, 'x', model.scaleName('x'), markDef.binSpacing === undefined ? config.bar.binSpacing : markDef.binSpacing, xScale.get('reverse'));
            }
            else {
                if (xScaleType === ScaleType.BAND) {
                    return bandPosition(xDef, 'x', model);
                }
            }
        }
        return centeredBandPosition('x', model, tslib_1.__assign({}, mid(width)), defaultSizeRef(markDef, xScaleName, xScale, config));
    }
}
function y$1(model) {
    var config = model.config, encoding = model.encoding, height = model.height, markDef = model.markDef;
    var orient = markDef.orient;
    var sizeDef = encoding.size;
    var yDef = encoding.y;
    var y2Def = encoding.y2;
    var yScaleName = model.scaleName(Y);
    var yScale = model.getScaleComponent(Y);
    if (orient === 'vertical' || y2Def) {
        return tslib_1.__assign({}, pointPosition('y', model, 'zeroOrMin'), pointPosition2(model, 'zeroOrMin', 'y2'));
    }
    else {
        if (isFieldDef(yDef)) {
            var yScaleType = yScale.get('type');
            if (yDef.bin && !sizeDef && !hasDiscreteDomain(yScaleType)) {
                return binnedPosition(yDef, 'y', model.scaleName('y'), markDef.binSpacing === undefined ? config.bar.binSpacing : markDef.binSpacing, yScale.get('reverse'));
            }
            else if (yScaleType === ScaleType.BAND) {
                return bandPosition(yDef, 'y', model);
            }
        }
        return centeredBandPosition('y', model, mid(height), defaultSizeRef(markDef, yScaleName, yScale, config));
    }
}
function defaultSizeRef(markDef, scaleName, scale, config) {
    if (markDef.size !== undefined) {
        return { value: markDef.size };
    }
    else if (config.bar.discreteBandSize) {
        return { value: config.bar.discreteBandSize };
    }
    else if (scale) {
        var scaleType = scale.get('type');
        if (scaleType === ScaleType.POINT) {
            var scaleRange = scale.get('range');
            if (isVgRangeStep(scaleRange) && isNumber(scaleRange.step)) {
                return { value: scaleRange.step - 1 };
            }
            warn$1(message.BAR_WITH_POINT_SCALE_AND_RANGESTEP_NULL);
        }
        else if (scaleType === ScaleType.BAND) {
            return bandRef(scaleName);
        }
        else {
            return { value: config.bar.continuousBandSize };
        }
    }
    else if (config.scale.rangeStep && config.scale.rangeStep !== null) {
        return { value: config.scale.rangeStep - 1 };
    }
    return { value: 20 };
}

var geoshape = {
    vgMark: 'shape',
    encodeEntry: function (model) {
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }));
    },
    postEncodingTransform: function (model) {
        var encoding = model.encoding;
        var shapeDef = encoding.shape;
        var transform = tslib_1.__assign({ type: 'geoshape', projection: model.projectionName() }, (shapeDef && isFieldDef(shapeDef) && shapeDef.type === GEOJSON ? { field: vgField(shapeDef, { expr: 'datum' }) } : {}));
        return [transform];
    }
};

var line$3 = {
    vgMark: 'line',
    encodeEntry: function (model) {
        var width = model.width, height = model.height;
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }), pointPosition('x', model, mid(width)), pointPosition('y', model, mid(height)), nonPosition('size', model, {
            vgChannel: 'strokeWidth'
        }), defined$1(model));
    }
};
var trail$2 = {
    vgMark: 'trail',
    encodeEntry: function (model) {
        var width = model.width, height = model.height;
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'include', orient: 'ignore' }), pointPosition('x', model, mid(width)), pointPosition('y', model, mid(height)), nonPosition('size', model), defined$1(model));
    }
};

function encodeEntry(model, fixedShape) {
    var config = model.config, width = model.width, height = model.height;
    return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'include', orient: 'ignore' }), pointPosition('x', model, mid(width)), pointPosition('y', model, mid(height)), nonPosition('size', model), shapeMixins(model, config, fixedShape));
}
function shapeMixins(model, config, fixedShape) {
    if (fixedShape) {
        return { shape: { value: fixedShape } };
    }
    return nonPosition('shape', model, { defaultValue: getMarkConfig('shape', model.markDef, config) });
}
var point$2 = {
    vgMark: 'symbol',
    encodeEntry: function (model) {
        return encodeEntry(model);
    }
};
var circle = {
    vgMark: 'symbol',
    encodeEntry: function (model) {
        return encodeEntry(model, 'circle');
    }
};
var square = {
    vgMark: 'symbol',
    encodeEntry: function (model) {
        return encodeEntry(model, 'square');
    }
};

var rect$1 = {
    vgMark: 'rect',
    encodeEntry: function (model) {
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }), x$2(model), y$2(model));
    }
};
function x$2(model) {
    var xDef = model.encoding.x;
    var x2Def = model.encoding.x2;
    var xScale = model.getScaleComponent(X);
    var xScaleType = xScale ? xScale.get('type') : undefined;
    if (isFieldDef(xDef) && xDef.bin && !x2Def) {
        return binnedPosition(xDef, 'x', model.scaleName('x'), 0, xScale.get('reverse'));
    }
    else if (isFieldDef(xDef) && xScale && hasDiscreteDomain(xScaleType)) {
        if (xScaleType === ScaleType.BAND) {
            return bandPosition(xDef, 'x', model);
        }
        else {
            throw new Error(message.scaleTypeNotWorkWithMark(RECT, xScaleType));
        }
    }
    else {
        return tslib_1.__assign({}, pointPosition('x', model, 'zeroOrMax'), pointPosition2(model, 'zeroOrMin', 'x2'));
    }
}
function y$2(model) {
    var yDef = model.encoding.y;
    var y2Def = model.encoding.y2;
    var yScale = model.getScaleComponent(Y);
    var yScaleType = yScale ? yScale.get('type') : undefined;
    if (isFieldDef(yDef) && yDef.bin && !y2Def) {
        return binnedPosition(yDef, 'y', model.scaleName('y'), 0, yScale.get('reverse'));
    }
    else if (isFieldDef(yDef) && yScale && hasDiscreteDomain(yScaleType)) {
        if (yScaleType === ScaleType.BAND) {
            return bandPosition(yDef, 'y', model);
        }
        else {
            throw new Error(message.scaleTypeNotWorkWithMark(RECT, yScaleType));
        }
    }
    else {
        return tslib_1.__assign({}, pointPosition('y', model, 'zeroOrMax'), pointPosition2(model, 'zeroOrMin', 'y2'));
    }
}

var rule$2 = {
    vgMark: 'rule',
    encodeEntry: function (model) {
        var _config = model.config, markDef = model.markDef, width = model.width, height = model.height;
        var orient = markDef.orient;
        if (!model.encoding.x && !model.encoding.y && !model.encoding.latitude && !model.encoding.longitude) {
            return {};
        }
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }), pointPosition('x', model, orient === 'horizontal' ? 'zeroOrMin' : mid(width)), pointPosition('y', model, orient === 'vertical' ? 'zeroOrMin' : mid(height)), (orient !== 'vertical' ? pointPosition2(model, 'zeroOrMax', 'x2') : {}), (orient !== 'horizontal' ? pointPosition2(model, 'zeroOrMax', 'y2') : {}), nonPosition('size', model, {
            vgChannel: 'strokeWidth',
            defaultValue: markDef.size
        }));
    }
};

var text$3 = {
    vgMark: 'text',
    encodeEntry: function (model) {
        var config = model.config, encoding = model.encoding, width = model.width, height = model.height, markDef = model.markDef;
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }), pointPosition('x', model, mid(width)), pointPosition('y', model, mid(height)), text$2(model), nonPosition('size', model, tslib_1.__assign({}, (markDef.size ? { defaultValue: markDef.size } : {}), { vgChannel: 'fontSize'
         })), valueIfDefined('align', align(model.markDef, encoding, config)));
    }
};
function align(markDef, encoding, config) {
    var a = markDef.align || getMarkConfig('align', markDef, config);
    if (a === undefined) {
        return 'center';
    }
    return undefined;
}

var tick = {
    vgMark: 'rect',
    encodeEntry: function (model) {
        var _a;
        var config = model.config, markDef = model.markDef, width = model.width, height = model.height;
        var orient = markDef.orient;
        var vgSizeChannel = orient === 'horizontal' ? 'width' : 'height';
        var vgThicknessChannel = orient === 'horizontal' ? 'height' : 'width';
        return tslib_1.__assign({}, baseEncodeEntry(model, { size: 'ignore', orient: 'ignore' }), pointPosition('x', model, mid(width), 'xc'), pointPosition('y', model, mid(height), 'yc'), nonPosition('size', model, {
            defaultValue: defaultSize(model),
            vgChannel: vgSizeChannel
        }), (_a = {}, _a[vgThicknessChannel] = { value: markDef.thickness || config.tick.thickness }, _a));
    }
};
function defaultSize(model) {
    var config = model.config, markDef = model.markDef;
    var orient = markDef.orient;
    var scale = model.getScaleComponent(orient === 'horizontal' ? 'x' : 'y');
    if (markDef.size !== undefined) {
        return markDef.size;
    }
    else if (config.tick.bandSize !== undefined) {
        return config.tick.bandSize;
    }
    else {
        var scaleRange = scale ? scale.get('range') : undefined;
        var rangeStep = scaleRange && isVgRangeStep(scaleRange) ?
            scaleRange.step :
            config.scale.rangeStep;
        if (typeof rangeStep !== 'number') {
            throw new Error('Function does not handle non-numeric rangeStep');
        }
        return rangeStep / 1.5;
    }
}

var markCompiler = {
    area: area$2,
    bar: bar,
    circle: circle,
    geoshape: geoshape,
    line: line$3,
    point: point$2,
    rect: rect$1,
    rule: rule$2,
    square: square,
    text: text$3,
    tick: tick,
    trail: trail$2
};
function parseMarkGroup(model) {
    if (contains([LINE, AREA, TRAIL], model.mark)) {
        return parsePathMark(model);
    }
    else {
        return getMarkGroups(model);
    }
}
var FACETED_PATH_PREFIX = 'faceted_path_';
function parsePathMark(model) {
    var details = pathGroupingFields(model.mark, model.encoding);
    var pathMarks = getMarkGroups(model, {
        fromPrefix: (details.length > 0 ? FACETED_PATH_PREFIX : '')
    });
    if (details.length > 0) {
        return [{
                name: model.getName('pathgroup'),
                type: 'group',
                from: {
                    facet: {
                        name: FACETED_PATH_PREFIX + model.requestDataName(MAIN),
                        data: model.requestDataName(MAIN),
                        groupby: details,
                    }
                },
                encode: {
                    update: {
                        width: { field: { group: 'width' } },
                        height: { field: { group: 'height' } }
                    }
                },
                marks: pathMarks
            }];
    }
    else {
        return pathMarks;
    }
}
function getSort$1(model) {
    var encoding = model.encoding, stack = model.stack, mark = model.mark, markDef = model.markDef;
    var order = encoding.order;
    if (!isArray(order) && isValueDef(order)) {
        return undefined;
    }
    else if ((isArray(order) || isFieldDef(order)) && !stack) {
        return sortParams(order, { expr: 'datum' });
    }
    else if (isPathMark(mark)) {
        var dimensionChannelDef = encoding[markDef.orient === 'horizontal' ? 'y' : 'x'];
        if (isFieldDef(dimensionChannelDef)) {
            var s = dimensionChannelDef.sort;
            var sortField = isSortField(s) ?
                vgField({
                    aggregate: isAggregate(model.encoding) ? s.op : undefined,
                    field: s.field
                }, { expr: 'datum' }) :
                vgField(dimensionChannelDef, {
                    binSuffix: model.stack && model.stack.impute ? 'mid' : undefined,
                    expr: 'datum'
                });
            return {
                field: sortField,
                order: 'descending'
            };
        }
        return undefined;
    }
    return undefined;
}
function getMarkGroups(model, opt) {
    if (opt === void 0) { opt = { fromPrefix: '' }; }
    var mark = model.mark;
    var clip = model.markDef.clip !== undefined ?
        !!model.markDef.clip : scaleClip(model);
    var style = getStyles(model.markDef);
    var key$$1 = model.encoding.key;
    var sort = getSort$1(model);
    var postEncodingTransform = markCompiler[mark].postEncodingTransform ? markCompiler[mark].postEncodingTransform(model) : null;
    return [tslib_1.__assign({ name: model.getName('marks'), type: markCompiler[mark].vgMark }, (clip ? { clip: true } : {}), (style ? { style: style } : {}), (key$$1 ? { key: { field: key$$1.field } } : {}), (sort ? { sort: sort } : {}), { from: { data: opt.fromPrefix + model.requestDataName(MAIN) }, encode: {
                update: markCompiler[mark].encodeEntry(model)
            } }, (postEncodingTransform ? {
            transform: postEncodingTransform
        } : {}))];
}
function pathGroupingFields(mark, encoding) {
    return keys$1(encoding).reduce(function (details, channel) {
        switch (channel) {
            case 'x':
            case 'y':
            case 'order':
            case 'tooltip':
            case 'href':
            case 'x2':
            case 'y2':
            case 'latitude':
            case 'longitude':
            case 'latitude2':
            case 'longitude2':
            case 'text':
            case 'shape':
                return details;
            case 'detail':
            case 'key':
                var channelDef = encoding[channel];
                if (channelDef) {
                    (isArray(channelDef) ? channelDef : [channelDef]).forEach(function (fieldDef) {
                        if (!fieldDef.aggregate) {
                            details.push(vgField(fieldDef, {}));
                        }
                    });
                }
                return details;
            case 'size':
                if (mark === 'trail') {
                    return details;
                }
            case 'color':
            case 'fill':
            case 'stroke':
            case 'opacity':
                var fieldDef = getFieldDef(encoding[channel]);
                if (fieldDef && !fieldDef.aggregate) {
                    details.push(vgField(fieldDef, {}));
                }
                return details;
            default:
                throw new Error("Bug: Channel " + channel + " unimplemented for line mark");
        }
    }, []);
}
function scaleClip(model) {
    var xScale = model.getScaleComponent('x');
    var yScale = model.getScaleComponent('y');
    return (xScale && xScale.get('domainRaw')) ||
        (yScale && yScale.get('domainRaw')) ? true : false;
}

var UnitModel =               (function (_super) {
    tslib_1.__extends(UnitModel, _super);
    function UnitModel(spec, parent, parentGivenName, parentGivenSize, repeater, config, fit) {
        if (parentGivenSize === void 0) { parentGivenSize = {}; }
        var _this = _super.call(this, spec, parent, parentGivenName, config, repeater, undefined) || this;
        _this.fit = fit;
        _this.type = 'unit';
        _this.specifiedScales = {};
        _this.specifiedAxes = {};
        _this.specifiedLegends = {};
        _this.specifiedProjection = {};
        _this.selection = {};
        _this.children = [];
        _this.initSize(tslib_1.__assign({}, parentGivenSize, (spec.width ? { width: spec.width } : {}), (spec.height ? { height: spec.height } : {})));
        var mark = isMarkDef(spec.mark) ? spec.mark.type : spec.mark;
        var encoding = _this.encoding = normalizeEncoding(replaceRepeaterInEncoding(spec.encoding || {}, repeater), mark);
        _this.markDef = normalizeMarkDef(spec.mark, encoding, config);
        _this.stack = stack(mark, encoding, _this.config.stack);
        _this.specifiedScales = _this.initScales(mark, encoding);
        _this.specifiedAxes = _this.initAxes(encoding);
        _this.specifiedLegends = _this.initLegend(encoding);
        _this.specifiedProjection = spec.projection;
        _this.selection = spec.selection;
        return _this;
    }
    Object.defineProperty(UnitModel.prototype, "hasProjection", {
        get: function () {
            var encoding = this.encoding;
            var isGeoShapeMark = this.mark === GEOSHAPE;
            var hasGeoPosition = encoding && GEOPOSITION_CHANNELS.some(function (channel) { return isFieldDef(encoding[channel]); });
            return isGeoShapeMark || hasGeoPosition;
        },
        enumerable: true,
        configurable: true
    });
    UnitModel.prototype.scaleDomain = function (channel) {
        var scale = this.specifiedScales[channel];
        return scale ? scale.domain : undefined;
    };
    UnitModel.prototype.axis = function (channel) {
        return this.specifiedAxes[channel];
    };
    UnitModel.prototype.legend = function (channel) {
        return this.specifiedLegends[channel];
    };
    UnitModel.prototype.initScales = function (mark, encoding) {
        return SCALE_CHANNELS.reduce(function (scales, channel) {
            var fieldDef;
            var specifiedScale;
            var channelDef = encoding[channel];
            if (isFieldDef(channelDef)) {
                fieldDef = channelDef;
                specifiedScale = channelDef.scale;
            }
            else if (hasConditionalFieldDef(channelDef)) {
                fieldDef = channelDef.condition;
                specifiedScale = channelDef.condition['scale'];
            }
            else if (channel === 'x') {
                fieldDef = getFieldDef(encoding.x2);
            }
            else if (channel === 'y') {
                fieldDef = getFieldDef(encoding.y2);
            }
            if (fieldDef) {
                scales[channel] = specifiedScale || {};
            }
            return scales;
        }, {});
    };
    UnitModel.prototype.initAxes = function (encoding) {
        return [X, Y].reduce(function (_axis, channel) {
            var channelDef = encoding[channel];
            if (isFieldDef(channelDef) ||
                (channel === X && isFieldDef(encoding.x2)) ||
                (channel === Y && isFieldDef(encoding.y2))) {
                var axisSpec = isFieldDef(channelDef) ? channelDef.axis : null;
                if (axisSpec !== null && axisSpec !== false) {
                    _axis[channel] = tslib_1.__assign({}, axisSpec);
                }
            }
            return _axis;
        }, {});
    };
    UnitModel.prototype.initLegend = function (encoding) {
        return NONPOSITION_SCALE_CHANNELS.reduce(function (_legend, channel) {
            var channelDef = encoding[channel];
            if (channelDef) {
                var legend = isFieldDef(channelDef) ? channelDef.legend :
                    (hasConditionalFieldDef(channelDef)) ? channelDef.condition['legend'] : null;
                if (legend !== null && legend !== false) {
                    _legend[channel] = tslib_1.__assign({}, legend);
                }
            }
            return _legend;
        }, {});
    };
    UnitModel.prototype.parseData = function () {
        this.component.data = parseData$2(this);
    };
    UnitModel.prototype.parseLayoutSize = function () {
        parseUnitLayoutSize(this);
    };
    UnitModel.prototype.parseSelection = function () {
        this.component.selection = parseUnitSelection(this, this.selection);
    };
    UnitModel.prototype.parseMarkGroup = function () {
        this.component.mark = parseMarkGroup(this);
    };
    UnitModel.prototype.parseAxisAndHeader = function () {
        this.component.axes = parseUnitAxis(this);
    };
    UnitModel.prototype.assembleSelectionTopLevelSignals = function (signals) {
        return assembleTopLevelSignals(this, signals);
    };
    UnitModel.prototype.assembleSelectionSignals = function () {
        return assembleUnitSelectionSignals(this, []);
    };
    UnitModel.prototype.assembleSelectionData = function (data) {
        return assembleUnitSelectionData(this, data);
    };
    UnitModel.prototype.assembleLayout = function () {
        return null;
    };
    UnitModel.prototype.assembleLayoutSignals = function () {
        return assembleLayoutSignals(this);
    };
    UnitModel.prototype.assembleMarks = function () {
        var marks = this.component.mark || [];
        if (!this.parent || !isLayerModel(this.parent)) {
            marks = assembleUnitSelectionMarks(this, marks);
        }
        return marks.map(this.correctDataNames);
    };
    UnitModel.prototype.assembleLayoutSize = function () {
        return {
            width: this.getSizeSignalRef('width'),
            height: this.getSizeSignalRef('height')
        };
    };
    UnitModel.prototype.getMapping = function () {
        return this.encoding;
    };
    UnitModel.prototype.toSpec = function (excludeConfig, excludeData) {
        var encoding = duplicate(this.encoding);
        var spec;
        spec = {
            mark: this.markDef,
            encoding: encoding
        };
        if (!excludeConfig) {
            spec.config = duplicate(this.config);
        }
        if (!excludeData) {
            spec.data = duplicate(this.data);
        }
        return spec;
    };
    Object.defineProperty(UnitModel.prototype, "mark", {
        get: function () {
            return this.markDef.type;
        },
        enumerable: true,
        configurable: true
    });
    UnitModel.prototype.channelHasField = function (channel) {
        return channelHasField(this.encoding, channel);
    };
    UnitModel.prototype.fieldDef = function (channel) {
        var channelDef = this.encoding[channel];
        return getFieldDef(channelDef);
    };
    return UnitModel;
}(ModelWithField));

var LayerModel =               (function (_super) {
    tslib_1.__extends(LayerModel, _super);
    function LayerModel(spec, parent, parentGivenName, parentGivenSize, repeater, config, fit) {
        var _this = _super.call(this, spec, parent, parentGivenName, config, repeater, spec.resolve) || this;
        _this.type = 'layer';
        var layoutSize = tslib_1.__assign({}, parentGivenSize, (spec.width ? { width: spec.width } : {}), (spec.height ? { height: spec.height } : {}));
        _this.initSize(layoutSize);
        _this.children = spec.layer.map(function (layer, i) {
            if (isLayerSpec(layer)) {
                return new LayerModel(layer, _this, _this.getName('layer_' + i), layoutSize, repeater, config, fit);
            }
            if (isUnitSpec(layer)) {
                return new UnitModel(layer, _this, _this.getName('layer_' + i), layoutSize, repeater, config, fit);
            }
            throw new Error(message.INVALID_SPEC);
        });
        return _this;
    }
    LayerModel.prototype.parseData = function () {
        this.component.data = parseData$2(this);
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parseData();
        }
    };
    LayerModel.prototype.parseLayoutSize = function () {
        parseLayerLayoutSize(this);
    };
    LayerModel.prototype.parseSelection = function () {
        var _this = this;
        this.component.selection = {};
        var _loop_1 = function (child) {
            child.parseSelection();
            keys$1(child.component.selection).forEach(function (key) {
                _this.component.selection[key] = child.component.selection[key];
            });
        };
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            _loop_1(child);
        }
    };
    LayerModel.prototype.parseMarkGroup = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parseMarkGroup();
        }
    };
    LayerModel.prototype.parseAxisAndHeader = function () {
        parseLayerAxis(this);
    };
    LayerModel.prototype.assembleSelectionTopLevelSignals = function (signals) {
        return this.children.reduce(function (sg, child) { return child.assembleSelectionTopLevelSignals(sg); }, signals);
    };
    LayerModel.prototype.assembleSelectionSignals = function () {
        return this.children.reduce(function (signals, child) {
            return signals.concat(child.assembleSelectionSignals());
        }, []);
    };
    LayerModel.prototype.assembleLayoutSignals = function () {
        return this.children.reduce(function (signals, child) {
            return signals.concat(child.assembleLayoutSignals());
        }, assembleLayoutSignals(this));
    };
    LayerModel.prototype.assembleSelectionData = function (data) {
        return this.children.reduce(function (db, child) { return child.assembleSelectionData(db); }, data);
    };
    LayerModel.prototype.assembleTitle = function () {
        var title = _super.prototype.assembleTitle.call(this);
        if (title) {
            return title;
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            title = child.assembleTitle();
            if (title) {
                return title;
            }
        }
        return undefined;
    };
    LayerModel.prototype.assembleLayout = function () {
        return null;
    };
    LayerModel.prototype.assembleMarks = function () {
        return assembleLayerSelectionMarks(this, flatten(this.children.map(function (child) {
            return child.assembleMarks();
        })));
    };
    LayerModel.prototype.assembleLegends = function () {
        return this.children.reduce(function (legends, child) {
            return legends.concat(child.assembleLegends());
        }, assembleLegends(this));
    };
    return LayerModel;
}(Model));

var RepeatModel =               (function (_super) {
    tslib_1.__extends(RepeatModel, _super);
    function RepeatModel(spec, parent, parentGivenName, repeatValues, config) {
        var _this = _super.call(this, spec, parent, parentGivenName, config, repeatValues, spec.resolve) || this;
        _this.type = 'repeat';
        if (spec.resolve && spec.resolve.axis && (spec.resolve.axis.x === 'shared' || spec.resolve.axis.y === 'shared')) {
            warn$1(message.REPEAT_CANNOT_SHARE_AXIS);
        }
        _this.repeat = spec.repeat;
        _this.children = _this._initChildren(spec, _this.repeat, repeatValues, config);
        return _this;
    }
    RepeatModel.prototype._initChildren = function (spec, repeat, repeater, config) {
        var children = [];
        var row = repeat.row || [repeater ? repeater.row : null];
        var column = repeat.column || [repeater ? repeater.column : null];
        for (var _i = 0, row_1 = row; _i < row_1.length; _i++) {
            var rowField = row_1[_i];
            for (var _a = 0, column_1 = column; _a < column_1.length; _a++) {
                var columnField = column_1[_a];
                var name_1 = (rowField ? '_' + rowField : '') + (columnField ? '_' + columnField : '');
                var childRepeat = {
                    row: rowField,
                    column: columnField
                };
                children.push(buildModel(spec.spec, this, this.getName('child' + name_1), undefined, childRepeat, config, false));
            }
        }
        return children;
    };
    RepeatModel.prototype.parseLayoutSize = function () {
        parseRepeatLayoutSize(this);
    };
    RepeatModel.prototype.assembleDefaultLayout = function () {
        return {
            columns: this.repeat && this.repeat.column ? this.repeat.column.length : 1,
            bounds: 'full',
            align: 'all'
        };
    };
    return RepeatModel;
}(BaseConcatModel));

function buildModel(spec, parent, parentGivenName, unitSize, repeater, config, fit) {
    if (isFacetSpec(spec)) {
        return new FacetModel(spec, parent, parentGivenName, repeater, config);
    }
    if (isLayerSpec(spec)) {
        return new LayerModel(spec, parent, parentGivenName, unitSize, repeater, config, fit);
    }
    if (isUnitSpec(spec)) {
        return new UnitModel(spec, parent, parentGivenName, unitSize, repeater, config, fit);
    }
    if (isRepeatSpec(spec)) {
        return new RepeatModel(spec, parent, parentGivenName, repeater, config);
    }
    if (isConcatSpec(spec)) {
        return new ConcatModel(spec, parent, parentGivenName, repeater, config);
    }
    throw new Error(message.INVALID_SPEC);
}

function compile(inputSpec, opt) {
    if (opt === void 0) { opt = {}; }
    if (opt.logger) {
        set$3(opt.logger);
    }
    if (opt.fieldTitle) {
        setTitleFormatter(opt.fieldTitle);
    }
    try {
        var config = initConfig(mergeDeep({}, opt.config, inputSpec.config));
        var spec = normalize$2(inputSpec, config);
        var autosize = normalizeAutoSize(inputSpec.autosize, config.autosize, isLayerSpec(spec) || isUnitSpec(spec));
        var model = buildModel(spec, null, '', undefined, undefined, config, autosize.type === 'fit');
        model.parse();
        optimizeDataflow(model.component.data);
        return assembleTopLevelModel(model, getTopLevelProperties(inputSpec, config, autosize));
    }
    finally {
        if (opt.logger) {
            reset$1();
        }
        if (opt.fieldTitle) {
            resetTitleFormatter();
        }
    }
}
function getTopLevelProperties(topLevelSpec, config, autosize) {
    return tslib_1.__assign({ autosize: keys$1(autosize).length === 1 && autosize.type ? autosize.type : autosize }, extractTopLevelProperties(config), extractTopLevelProperties(topLevelSpec));
}
function assembleTopLevelModel(model, topLevelProperties) {
    var vgConfig = model.config ? stripAndRedirectConfig(model.config) : undefined;
    var data = [].concat(model.assembleSelectionData([]),
    assembleRootData(model.component.data, topLevelProperties.datasets || {}));
    delete topLevelProperties.datasets;
    var projections = model.assembleProjections();
    var title$$1 = model.assembleTitle();
    var style = model.assembleGroupStyle();
    var layoutSignals = model.assembleLayoutSignals();
    layoutSignals = layoutSignals.filter(function (signal) {
        if ((signal.name === 'width' || signal.name === 'height') && signal.value !== undefined) {
            topLevelProperties[signal.name] = +signal.value;
            return false;
        }
        return true;
    });
    var output = tslib_1.__assign({ $schema: 'https://vega.github.io/schema/vega/v3.json' }, (model.description ? { description: model.description } : {}), topLevelProperties, (title$$1 ? { title: title$$1 } : {}), (style ? { style: style } : {}), { data: data }, (projections.length > 0 ? { projections: projections } : {}), model.assembleGroup(layoutSignals.concat(model.assembleSelectionTopLevelSignals([]))), (vgConfig ? { config: vgConfig } : {}));
    return {
        spec: output
    };
}



var facet = /*#__PURE__*/Object.freeze({

});

var DEFAULT_REQUIRED_CHANNEL_MAP = {
    text: ['text'],
    line: ['x', 'y'],
    trail: ['x', 'y'],
    area: ['x', 'y']
};
var DEFAULT_SUPPORTED_CHANNEL_TYPE = {
    bar: toSet(['row', 'column', 'x', 'y', 'size', 'color', 'fill', 'stroke', 'detail']),
    line: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'color', 'detail']),
    trail: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'color', 'detail', 'size']),
    area: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'detail']),
    tick: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'detail']),
    circle: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'size', 'detail']),
    square: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'size', 'detail']),
    point: toSet(['row', 'column', 'x', 'y', 'color', 'fill', 'stroke', 'size', 'detail', 'shape']),
    geoshape: toSet(['row', 'column', 'color', 'fill', 'stroke', 'detail', 'shape']),
    text: toSet(['row', 'column', 'size', 'color', 'fill', 'stroke', 'text'])
};
function getEncodingMappingError(spec, requiredChannelMap, supportedChannelMap) {
    if (requiredChannelMap === void 0) { requiredChannelMap = DEFAULT_REQUIRED_CHANNEL_MAP; }
    if (supportedChannelMap === void 0) { supportedChannelMap = DEFAULT_SUPPORTED_CHANNEL_TYPE; }
    var mark = isMarkDef(spec.mark) ? spec.mark.type : spec.mark;
    var encoding = spec.encoding;
    var requiredChannels = requiredChannelMap[mark];
    var supportedChannels = supportedChannelMap[mark];
    for (var i in requiredChannels) {
        if (!(requiredChannels[i] in encoding)) {
            return 'Missing encoding channel \"' + requiredChannels[i] +
                '\" for mark \"' + mark + '\"';
        }
    }
    for (var channel in encoding) {
        if (!supportedChannels[channel]) {
            return 'Encoding channel \"' + channel +
                '\" is not supported by mark type \"' + mark + '\"';
        }
    }
    if (mark === BAR && !encoding.x && !encoding.y) {
        return 'Missing both x and y for bar';
    }
    return null;
}

var validate = /*#__PURE__*/Object.freeze({
  DEFAULT_REQUIRED_CHANNEL_MAP: DEFAULT_REQUIRED_CHANNEL_MAP,
  DEFAULT_SUPPORTED_CHANNEL_TYPE: DEFAULT_SUPPORTED_CHANNEL_TYPE,
  getEncodingMappingError: getEncodingMappingError
});

var name$1 = "vega-lite";
var author$1 = "Jeffrey Heer, Dominik Moritz, Kanit \"Ham\" Wongsuphasawat";
var version$1 = "2.6.0";
var collaborators = [
	"Kanit Wongsuphasawat <kanitw@gmail.com> (http://kanitw.yellowpigz.com)",
	"Dominik Moritz <domoritz@cs.washington.edu> (https://www.domoritz.de)",
	"Jeffrey Heer <jheer@uw.edu> (http://jheer.org)"
];
var homepage = "https://vega.github.io/vega-lite/";
var description$1 = "Vega-Lite is a concise high-level language for interactive visualization.";
var main$2 = "build/vega-lite.js";
var unpkg$1 = "build/vega-lite.min.js";
var jsdelivr$1 = "build/vega-lite.min.js";
var module$2 = "build/src/index";
var types$1 = "build/src/index.d.ts";
var bin$5 = {
	vl2png: "./bin/vl2png",
	vl2svg: "./bin/vl2svg",
	vl2vg: "./bin/vl2vg"
};
var directories = {
	test: "test"
};
var scripts$1 = {
	prebuild: "mkdir -p build/src",
	build: "npm run build:only",
	"build:only": "tsc && rollup -c",
	postbuild: "uglifyjs build/vega-lite.js -cm --source-map content=build/vega-lite.js.map,filename=build/vega-lite.min.js.map -o build/vega-lite.min.js && npm run schema",
	"build:examples": "npm run data && TZ=America/Los_Angeles scripts/build-examples.sh",
	"build:examples-full": "TZ=America/Los_Angeles scripts/build-examples.sh 1",
	"build:example": "TZ=America/Los_Angeles scripts/build-example.sh",
	"build:toc": "bundle exec jekyll build -q && scripts/generate-toc",
	"build:site": "tsc -p site && webpack --config site/webpack.config.js",
	"build:versions": "scripts/update-version.sh",
	"check:examples": "scripts/check-examples.sh",
	"check:schema": "scripts/check-schema.sh",
	clean: "rm -rf build && rm -f examples/compiled/*.png && find site/examples ! -name 'index.md' -type f -delete",
	data: "rsync -r node_modules/vega-datasets/data/* data",
	deploy: "scripts/deploy.sh",
	"deploy:gh": "scripts/deploy-gh.sh",
	"deploy:schema": "scripts/deploy-schema.sh",
	preschema: "npm run prebuild",
	schema: "node --stack-size=1200 ./node_modules/.bin/ts-json-schema-generator --path tsconfig.json --type TopLevelSpec > build/vega-lite-schema.json && npm run renameschema && cp build/vega-lite-schema.json _data/",
	renameschema: "scripts/rename-schema.sh",
	presite: "npm run prebuild && npm run data && npm run build:site && npm run build:toc && npm run build:versions && scripts/create-example-pages",
	site: "bundle exec jekyll serve --incremental",
	lint: "tslint -p . -e 'package.json'",
	test: "jest test/ && npm run lint && npm run schema && jest examples/ && npm run test:runtime",
	"test:inspect": "node --inspect-brk ./node_modules/.bin/jest --runInBand test",
	"test:runtime": "TZ=America/Los_Angeles TS_NODE_COMPILER_OPTIONS='{\"module\":\"commonjs\"}' wdio wdio.conf.js",
	"test:runtime:generate": "rm -Rf test-runtime/resources && VL_GENERATE_TESTS=true npm run test:runtime",
	"watch:build": "npm run build:only && concurrently --kill-others -n Typescript,Rollup 'tsc -w' 'rollup -c -w'",
	"watch:site": "concurrently --kill-others -n Typescript,Webpack 'tsc -p site --watch' 'webpack --config site/webpack.config.js --mode development --watch'",
	"watch:test": "jest --watch"
};
var repository$1 = {
	type: "git",
	url: "https://github.com/vega/vega-lite.git"
};
var license$1 = "BSD-3-Clause";
var bugs = {
	url: "https://github.com/vega/vega-lite/issues"
};
var devDependencies$1 = {
	"@types/chai": "^4.1.4",
	"@types/d3": "^5.0.0",
	"@types/highlight.js": "^9.12.3",
	"@types/jest": "^23.1.1",
	"@types/mkdirp": "^0.5.2",
	"@types/node": "^9.0.0",
	"@types/webdriverio": "^4.10.2",
	ajv: "^6.5.1",
	chai: "^4.1.2",
	cheerio: "^1.0.0-rc.2",
	chromedriver: "^2.40.0",
	codecov: "^3.0.2",
	concurrently: "^3.6.0",
	d3: "^5.5.0",
	"highlight.js": "^9.12.0",
	jest: "^23.1.0",
	mkdirp: "^0.5.1",
	rollup: "^0.59.4",
	"rollup-plugin-commonjs": "^9.1.3",
	"rollup-plugin-json": "^3.0.0",
	"rollup-plugin-node-resolve": "^3.3.0",
	"rollup-plugin-sourcemaps": "^0.4.2",
	"source-map-support": "^0.5.6",
	"svg2png-many": "^0.0.7",
	"ts-jest": "^22.4.6",
	"ts-json-schema-generator": "^0.28.0",
	"ts-node": "^6.1.1",
	tslint: "5.10.0",
	"tslint-eslint-rules": "^5.3.1",
	typescript: "^2.9.2",
	"uglify-js": "^3.4.1",
	vega: "^4.0.0-rc.3",
	"vega-datasets": "^1.19.0",
	"vega-embed": "^3.16.0",
	"vega-tooltip": "^0.11.0",
	"wdio-chromedriver-service": "^0.1.3",
	"wdio-dot-reporter": "0.0.9",
	"wdio-mocha-framework": "^0.5.13",
	"wdio-static-server-service": "^1.0.1",
	webdriverio: "^4.13.0",
	webpack: "^4.12.0",
	"webpack-cli": "^3.0.8",
	"yaml-front-matter": "^4.0.0"
};
var dependencies$1 = {
	"@types/json-stable-stringify": "^1.0.32",
	"json-stable-stringify": "^1.0.1",
	tslib: "^1.9.2",
	"vega-event-selector": "^2.0.0",
	"vega-typings": "^0.3.17",
	"vega-util": "^1.7.0",
	yargs: "^11.0.0"
};
var jest = {
	transform: {
		"^.+\\.tsx?$": "ts-jest"
	},
	testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
	moduleFileExtensions: [
		"ts",
		"tsx",
		"js",
		"jsx",
		"json",
		"node"
	],
	testPathIgnorePatterns: [
		"node_modules",
		"test-runtime",
		"<rootDir>/build",
		"_site",
		"src"
	],
	coverageDirectory: "./coverage/",
	collectCoverage: false
};
var pkg = {
	name: name$1,
	author: author$1,
	version: version$1,
	collaborators: collaborators,
	homepage: homepage,
	description: description$1,
	main: main$2,
	unpkg: unpkg$1,
	jsdelivr: jsdelivr$1,
	module: module$2,
	types: types$1,
	bin: bin$5,
	directories: directories,
	scripts: scripts$1,
	repository: repository$1,
	license: license$1,
	bugs: bugs,
	devDependencies: devDependencies$1,
	dependencies: dependencies$1,
	jest: jest
};

var version$2 = pkg.version;

var vlImport = /*#__PURE__*/Object.freeze({
  aggregate: aggregate,
  axis: axis,
  bin: bin$3,
  channel: channel,
  compositeMark: index$1,
  config: config,
  data: data$2,
  datetime: datetime,
  encoding: encoding,
  facet: facet,
  fieldDef: fielddef,
  header: header,
  legend: legend,
  mark: mark,
  scale: scale$4,
  sort: sort$1,
  spec: spec,
  stack: stack$1,
  timeUnit: timeunit,
  transform: transform$2,
  type: type$1,
  util: util,
  validate: validate,
  version: version$2,
  compile: compile
});

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var vegaSchemaUrlParser = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(url) {
    var regex = /\/schema\/([\w-]+)\/([\w\.\-]+)\.json$/g;
    var _a = regex.exec(url).slice(1, 3), library = _a[0], version = _a[1];
    return { library: library, version: version };
}
exports.default = default_1;
});
var schemaParser = unwrapExports(vegaSchemaUrlParser);

const markColor = '#4572a7';
const excelTheme = {
    background: '#fff',
    arc: { fill: markColor },
    area: { fill: markColor },
    line: { stroke: markColor, strokeWidth: 2 },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    symbol: { fill: markColor, strokeWidth: 1.5, size: 50 },
    axis: {
        bandPosition: 0.5,
        grid: true,
        gridColor: '#000000',
        gridOpacity: 1,
        gridWidth: 0.5,
        labelPadding: 10,
        tickSize: 5,
        tickWidth: 0.5,
    },
    axisBand: {
        grid: false,
        tickExtra: true,
    },
    legend: {
        labelBaseline: 'middle',
        labelFontSize: 11,
        symbolSize: 50,
        symbolType: 'square',
    },
    range: {
        category: [
            '#4572a7',
            '#aa4643',
            '#8aa453',
            '#71598e',
            '#4598ae',
            '#d98445',
            '#94aace',
            '#d09393',
            '#b9cc98',
            '#a99cbc',
        ],
    },
};

const markColor$1 = '#000';
const ggplot2Theme = {
    group: {
        fill: '#e5e5e5',
    },
    arc: { fill: markColor$1 },
    area: { fill: markColor$1 },
    line: { stroke: markColor$1 },
    path: { stroke: markColor$1 },
    rect: { fill: markColor$1 },
    shape: { stroke: markColor$1 },
    symbol: { fill: markColor$1, size: 40 },
    axis: {
        domain: false,
        grid: true,
        gridColor: '#FFFFFF',
        gridOpacity: 1,
        labelColor: '#7F7F7F',
        labelPadding: 4,
        tickColor: '#7F7F7F',
        tickSize: 5.67,
        titleFontSize: 16,
        titleFontWeight: 'normal',
    },
    legend: {
        labelBaseline: 'middle',
        labelFontSize: 11,
        symbolSize: 40,
    },
    range: {
        category: [
            '#000000',
            '#7F7F7F',
            '#1A1A1A',
            '#999999',
            '#333333',
            '#B0B0B0',
            '#4D4D4D',
            '#C9C9C9',
            '#666666',
            '#DCDCDC',
        ],
    },
};

const markColor$2 = '#ab5787';
const axisColor = '#979797';
const quartzTheme = {
    background: '#f9f9f9',
    arc: { fill: markColor$2 },
    area: { fill: markColor$2 },
    line: { stroke: markColor$2 },
    path: { stroke: markColor$2 },
    rect: { fill: markColor$2 },
    shape: { stroke: markColor$2 },
    symbol: { fill: markColor$2, size: 30 },
    axis: {
        domainColor: axisColor,
        domainWidth: 0.5,
        gridWidth: 0.2,
        labelColor: axisColor,
        tickColor: axisColor,
        tickWidth: 0.2,
        titleColor: axisColor,
    },
    axisBand: {
        grid: false,
    },
    axisX: {
        grid: true,
        tickSize: 10,
    },
    axisY: {
        domain: false,
        grid: true,
        tickSize: 0,
    },
    legend: {
        labelFontSize: 11,
        padding: 1,
        symbolSize: 30,
        symbolType: 'square',
    },
    range: {
        category: [
            '#ab5787',
            '#51b2e5',
            '#703c5c',
            '#168dd9',
            '#d190b6',
            '#00609f',
            '#d365ba',
            '#154866',
            '#666666',
            '#c4c4c4',
        ],
    },
};

const markColor$3 = '#3e5c69';
const voxTheme = {
    background: '#fff',
    arc: { fill: markColor$3 },
    area: { fill: markColor$3 },
    line: { stroke: markColor$3 },
    path: { stroke: markColor$3 },
    rect: { fill: markColor$3 },
    shape: { stroke: markColor$3 },
    symbol: { fill: markColor$3 },
    axis: {
        domainWidth: 0.5,
        grid: true,
        labelPadding: 2,
        tickSize: 5,
        tickWidth: 0.5,
        titleFontWeight: 'normal',
    },
    axisBand: {
        grid: false,
    },
    axisX: {
        gridWidth: 0.2,
    },
    axisY: {
        gridDash: [3],
        gridWidth: 0.4,
    },
    legend: {
        labelFontSize: 11,
        padding: 1,
        symbolType: 'square',
    },
    range: {
        category: [
            '#3e5c69',
            '#6793a6',
            '#182429',
            '#0570b0',
            '#3690c0',
            '#74a9cf',
            '#a6bddb',
            '#e2ddf2',
        ],
    },
};

const lightColor = '#fff';
const medColor = '#888';
const darkTheme = {
    background: '#333',
    title: { color: lightColor },
    style: {
        'guide-label': {
            fill: lightColor,
        },
        'guide-title': {
            fill: lightColor,
        },
    },
    axis: {
        domainColor: lightColor,
        gridColor: medColor,
        tickColor: lightColor,
    },
};

const markColor$4 = '#30a2da';
const axisColor$1 = '#cbcbcb';
const guideLabelColor = '#999';
const backgroundColor = '#f0f0f0';
const blackTitle = '#333';
const fiveThirtyEightTheme = {
    arc: { fill: markColor$4 },
    area: { fill: markColor$4 },
    axisBand: {
        grid: false,
    },
    axisBottom: {
        domain: false,
        domainColor: blackTitle,
        domainWidth: 3,
        grid: true,
        gridColor: axisColor$1,
        gridWidth: 1,
        labelColor: guideLabelColor,
        labelFontSize: 10,
        labelPadding: 4,
        tickColor: axisColor$1,
        tickSize: 10,
        titleFontSize: 14,
        titlePadding: 10,
    },
    axisLeft: {
        domainColor: axisColor$1,
        domainWidth: 1,
        grid: true,
        gridColor: axisColor$1,
        gridWidth: 1,
        labelColor: guideLabelColor,
        labelFontSize: 10,
        labelPadding: 4,
        tickColor: axisColor$1,
        tickSize: 10,
        ticks: true,
        titleFontSize: 14,
        titlePadding: 10,
    },
    axisRight: {
        domainColor: blackTitle,
        domainWidth: 1,
        grid: true,
        gridColor: axisColor$1,
        gridWidth: 1,
        labelColor: guideLabelColor,
        labelFontSize: 10,
        labelPadding: 4,
        tickColor: axisColor$1,
        tickSize: 10,
        ticks: true,
        titleFontSize: 14,
        titlePadding: 10,
    },
    axisTop: {
        domain: false,
        domainColor: blackTitle,
        domainWidth: 3,
        grid: true,
        gridColor: axisColor$1,
        gridWidth: 1,
        labelColor: guideLabelColor,
        labelFontSize: 10,
        labelPadding: 4,
        tickColor: axisColor$1,
        tickSize: 10,
        titleFontSize: 14,
        titlePadding: 10,
    },
    background: backgroundColor,
    group: {
        fill: backgroundColor,
    },
    legend: {
        labelColor: blackTitle,
        labelFontSize: 11,
        padding: 1,
        symbolSize: 30,
        symbolType: 'square',
        titleColor: blackTitle,
        titleFontSize: 14,
        titlePadding: 10,
    },
    line: {
        stroke: markColor$4,
        strokeWidth: 2,
    },
    path: { stroke: markColor$4, strokeWidth: 0.5 },
    rect: { fill: markColor$4 },
    range: {
        category: [
            '#30a2da',
            '#fc4f30',
            '#e5ae38',
            '#6d904f',
            '#8b8b8b',
            '#b96db8',
            '#ff9e27',
            '#56cc60',
            '#52d2ca',
            '#52689e',
            '#545454',
            '#9fe4f8',
        ],
        diverging: [
            '#cc0020',
            '#e77866',
            '#f6e7e1',
            '#d6e8ed',
            '#91bfd9',
            '#1d78b5',
        ],
        heatmap: ['#d6e8ed', '#cee0e5', '#91bfd9', '#549cc6', '#1d78b5'],
    },
    symbol: {
        filled: true,
        shape: 'circle',
    },
    shape: { stroke: markColor$4 },
    style: {
        bar: {
            binSpacing: 2,
            fill: markColor$4,
            stroke: null,
        },
    },
    title: {
        anchor: 'start',
        fontSize: 24,
        fontWeight: 600,
        offset: 20,
    },
};

const headlineFontSize = 22;
const headlineFontWeight = 'normal';
const labelFont = 'Benton Gothic, sans';
const labelFontSize = 11.5;
const labelFontWeight = 'normal';
const markColor$5 = '#82c6df';
const titleFont = 'Benton Gothic Bold, sans';
const titleFontWeight = 'normal';
const titleFontSize = 13;
const colorSchemes = {
    'category-6': [
        '#ec8431',
        '#829eb1',
        '#c89d29',
        '#3580b1',
        '#adc839',
        '#ab7fb4',
    ],
    'fire-7': [
        '#fbf2c7',
        '#f9e39c',
        '#f8d36e',
        '#f4bb6a',
        '#e68a4f',
        '#d15a40',
        '#ab4232',
    ],
    'fireandice-6': [
        '#e68a4f',
        '#f4bb6a',
        '#f9e39c',
        '#dadfe2',
        '#a6b7c6',
        '#849eae',
    ],
    'ice-7': [
        '#edefee',
        '#dadfe2',
        '#c4ccd2',
        '#a6b7c6',
        '#849eae',
        '#607785',
        '#47525d',
    ],
};
const latimesTheme = {
    background: '#ffffff',
    title: {
        anchor: 'start',
        font: titleFont,
        fontColor: '#000000',
        fontSize: headlineFontSize,
        fontWeight: headlineFontWeight,
    },
    arc: { fill: markColor$5 },
    area: { fill: markColor$5 },
    line: { stroke: markColor$5, strokeWidth: 2 },
    path: { stroke: markColor$5 },
    rect: { fill: markColor$5 },
    shape: { stroke: markColor$5 },
    symbol: { fill: markColor$5, size: 30 },
    axis: {
        labelFont,
        labelFontSize,
        labelFontWeight,
        titleFont,
        titleFontSize,
        titleFontWeight,
    },
    axisX: {
        labelAngle: 0,
        labelPadding: 4,
        tickSize: 3,
    },
    axisY: {
        labelBaseline: 'middle',
        maxExtent: 45,
        minExtent: 45,
        tickSize: 2,
        titleAlign: 'left',
        titleAngle: 0,
        titleX: -45,
        titleY: -11,
    },
    legend: {
        labelFont,
        labelFontSize,
        symbolType: 'square',
        titleFont,
        titleFontSize,
        titleFontWeight,
    },
    range: {
        category: colorSchemes['category-6'],
        diverging: colorSchemes['fireandice-6'],
        heatmap: colorSchemes['fire-7'],
        ordinal: colorSchemes['fire-7'],
        ramp: colorSchemes['fire-7'],
    },
};



var themes = /*#__PURE__*/Object.freeze({
  excel: excelTheme,
  ggplot2: ggplot2Theme,
  quartz: quartzTheme,
  vox: voxTheme,
  dark: darkTheme,
  fivethirtyeight: fiveThirtyEightTheme,
  latimes: latimesTheme
});

var defaultStyle = `#vg-tooltip-element {
  visibility: hidden;
  padding: 8px;
  position: fixed;
  z-index: 1000;
  font-family: sans-serif;
  font-size: 11px;
  border-radius: 3px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  /* The default theme is the light theme. */
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #d9d9d9;
  color: black; }
  #vg-tooltip-element.visible {
    visibility: visible; }
  #vg-tooltip-element h2 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 13px; }
  #vg-tooltip-element table {
    border-spacing: 0; }
    #vg-tooltip-element table tr {
      border: none; }
      #vg-tooltip-element table tr td {
        overflow: hidden;
        text-overflow: ellipsis;
        padding-top: 2px;
        padding-bottom: 2px; }
        #vg-tooltip-element table tr td.key {
          color: #808080;
          max-width: 150px;
          text-align: right;
          padding-right: 4px; }
        #vg-tooltip-element table tr td.value {
          display: block;
          max-width: 300px;
          max-height: 7em;
          text-align: left; }
  #vg-tooltip-element.dark-theme {
    background-color: rgba(32, 32, 32, 0.9);
    border: 1px solid #f5f5f5;
    color: white; }
    #vg-tooltip-element.dark-theme td.key {
      color: #bfbfbf; }
`;

const EL_ID = 'vg-tooltip-element';
const DEFAULT_OPTIONS = {
    offsetX: 10,
    offsetY: 10,
    id: EL_ID,
    styleId: 'vega-tooltip-style',
    theme: 'light',
    disableDefaultStyle: false,
    sanitize: escapeHTML,
    maxDepth: 2
};
function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;');
}
function createDefaultStyle(id) {
    if (!/^[A-Za-z]+[-:.\w]*$/.test(id)) {
        throw new Error('Invalid HTML ID');
    }
    return defaultStyle.toString().replace(EL_ID, id);
}

var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
function formatValue$2(value, valueToHtml, maxDepth) {
    if (isArray(value)) {
        return `[${value.map(v => valueToHtml(isString(v) ? v : stringify$2(v, maxDepth))).join(', ')}]`;
    }
    if (isObject(value)) {
        let content = '';
        const _a = value, { title } = _a, rest = __rest(_a, ["title"]);
        if (title) {
            content += `<h2>${valueToHtml(title)}</h2>`;
        }
        const keys = Object.keys(rest);
        if (keys.length > 0) {
            content += '<table>';
            for (const key$$1 of keys) {
                let val = rest[key$$1];
                if (isObject(val)) {
                    val = stringify$2(val, maxDepth);
                }
                content += `<tr><td class="key">${valueToHtml(key$$1)}:</td><td class="value">${valueToHtml(val)}</td></tr>`;
            }
            content += `</table>`;
        }
        return content || '{}';
    }
    return valueToHtml(value);
}
function replacer(maxDepth) {
    const stack = [];
    return function (key$$1, value) {
        if (typeof value !== 'object' || value === null) {
            return value;
        }
        const pos = stack.indexOf(this) + 1;
        stack.length = pos;
        if (stack.length > maxDepth) {
            return '[Object]';
        }
        if (stack.indexOf(value) >= 0) {
            return '[Circular]';
        }
        stack.push(value);
        return value;
    };
}
function stringify$2(obj, maxDepth) {
    return JSON.stringify(obj, replacer(maxDepth));
}

function calculatePosition(event, tooltipBox, offsetX, offsetY) {
    let x = event.clientX + offsetX;
    if (x + tooltipBox.width > window.innerWidth) {
        x = +event.clientX - offsetX - tooltipBox.width;
    }
    let y = event.clientY + offsetY;
    if (y + tooltipBox.height > window.innerHeight) {
        y = +event.clientY - offsetY - tooltipBox.height;
    }
    return { x, y };
}

class Handler$1 {
    constructor(options) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        const elementId = this.options.id;
        this.call = this.tooltip_handler.bind(this);
        if (!this.options.disableDefaultStyle && !document.getElementById(this.options.styleId)) {
            const style = document.createElement('style');
            style.setAttribute('id', this.options.styleId);
            style.innerHTML = createDefaultStyle(elementId);
            const head = document.head;
            if (head.childNodes.length > 0) {
                head.insertBefore(style, head.childNodes[0]);
            }
            else {
                head.appendChild(style);
            }
        }
        this.el = document.getElementById(elementId);
        if (!this.el) {
            this.el = document.createElement('div');
            this.el.setAttribute('id', elementId);
            this.el.classList.add('vg-tooltip');
            document.body.appendChild(this.el);
        }
    }
    tooltip_handler(handler, event, item, value) {
        if (value == null || value === '') {
            this.el.classList.remove('visible', `${this.options.theme}-theme`);
            return;
        }
        this.el.innerHTML = formatValue$2(value, this.options.sanitize, this.options.maxDepth);
        this.el.classList.add('visible', `${this.options.theme}-theme`);
        const { x, y } = calculatePosition(event, this.el.getBoundingClientRect(), this.options.offsetX, this.options.offsetY);
        this.el.setAttribute('style', `top: ${y}px; left: ${x}px`);
    }
}

function post (window, url, data) {
    const editor = window.open(url);
    const wait = 10000;
    const step = 250;
    let count = ~~(wait / step);
    function listen(evt) {
        if (evt.source === editor) {
            count = 0;
            window.removeEventListener('message', listen, false);
        }
    }
    window.addEventListener('message', listen, false);
    function send() {
        if (count <= 0) {
            return;
        }
        editor.postMessage(data, '*');
        setTimeout(send, step);
        count -= 1;
    }
    setTimeout(send, step);
}

var embedStyle = `.vega-embed {
  position: relative;
  display: inline-block;
  padding-right: 38px; }
  .vega-embed details:not([open]) > :not(summary) {
    display: none !important; }
  .vega-embed summary {
    list-style: none;
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    padding: 6px;
    z-index: 1000;
    background: white;
    box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
    color: #1b1e23;
    border: 1px solid #aaa;
    border-radius: 999px;
    opacity: 0.2;
    transition: opacity 0.4s ease-in;
    outline: none;
    cursor: pointer; }
    .vega-embed summary::-webkit-details-marker {
      display: none; }
  .vega-embed details[open] summary {
    opacity: 0.7; }
  .vega-embed:hover summary,
  .vega-embed:focus summary {
    opacity: 1 !important;
    transition: opacity 0.2s ease; }
  .vega-embed .vega-actions {
    position: absolute;
    top: 35px;
    right: -9px;
    display: flex;
    flex-direction: column;
    padding-bottom: 8px;
    padding-top: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);
    border: 1px solid #d9d9d9;
    background: white;
    animation-duration: 0.15s;
    animation-name: scale-in;
    animation-timing-function: cubic-bezier(0.2, 0, 0.13, 1.5); }
    .vega-embed .vega-actions a {
      padding: 8px 16px;
      font-family: sans-serif;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      color: #434a56;
      text-decoration: none; }
      .vega-embed .vega-actions a:hover {
        background-color: #f7f7f9;
        color: black; }
    .vega-embed .vega-actions::before, .vega-embed .vega-actions::after {
      content: "";
      display: inline-block;
      position: absolute; }
    .vega-embed .vega-actions::before {
      left: auto;
      right: 14px;
      top: -16px;
      border: 8px solid #0000;
      border-bottom-color: #d9d9d9; }
    .vega-embed .vega-actions::after {
      left: auto;
      right: 15px;
      top: -14px;
      border: 7px solid #0000;
      border-bottom-color: #fff; }

.vega-embed-wrapper {
  max-width: 100%;
  overflow: scroll;
  padding-right: 14px; }

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.6); }
  to {
    opacity: 1;
    transform: scale(1); } }
`;

function deepMerge_$1(dest, src) {
    if (typeof src !== 'object' || src === null) {
        return dest;
    }
    for (const p in src) {
        if (!src.hasOwnProperty(p)) {
            continue;
        }
        if (src[p] === undefined) {
            continue;
        }
        if (typeof src[p] !== 'object' || isArray(src[p]) || src[p] === null) {
            dest[p] = src[p];
        }
        else if (typeof dest[p] !== 'object' || dest[p] === null) {
            dest[p] = mergeDeep$1(isArray(src[p].constructor) ? [] : {}, src[p]);
        }
        else {
            mergeDeep$1(dest[p], src[p]);
        }
    }
    return dest;
}
function mergeDeep$1(dest, ...src) {
    for (const s of src) {
        dest = deepMerge_$1(dest, s);
    }
    return dest;
}
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (search, pos) {
        return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
    };
}

const vega = vegaImport;
const vl = vlImport;
const I18N = {
    CLICK_TO_VIEW_ACTIONS: 'Click to view actions',
    COMPILED_ACTION: 'View Compiled Vega',
    EDITOR_ACTION: 'Open in Vega Editor',
    PNG_ACTION: 'Save as PNG',
    SOURCE_ACTION: 'View Source',
    SVG_ACTION: 'Save as SVG'
};
const NAMES = {
    vega: 'Vega',
    'vega-lite': 'Vega-Lite'
};
const VERSION = {
    vega: vega.version,
    'vega-lite': vl ? vl.version : 'not available'
};
const PREPROCESSOR = {
    vega: vgjson => vgjson,
    'vega-lite': (vljson, config$$1) => vl.compile(vljson, { config: config$$1 }).spec
};
const SVG_CIRCLES = `
<svg viewBox="0 0 16 16" fill="currentColor" stroke="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
  <circle r="2" cy="8" cx="2"></circle>
  <circle r="2" cy="8" cx="8"></circle>
  <circle r="2" cy="8" cx="14"></circle>
</svg>`;
function isTooltipHandler(h) {
    return typeof h === 'function';
}
function viewSource(source, sourceHeader, sourceFooter, mode) {
    const header$$1 = `<html><head>${sourceHeader}</head><body><pre><code class="json">`;
    const footer = `</code></pre>${sourceFooter}</body></html>`;
    const win = window.open('');
    win.document.write(header$$1 + source + footer);
    win.document.title = `${NAMES[mode]} JSON Source`;
}
function guessMode(spec$$1, providedMode) {
    if (spec$$1.$schema) {
        const parsed = schemaParser(spec$$1.$schema);
        if (providedMode && providedMode !== parsed.library) {
            console.warn(`The given visualization spec is written in ${NAMES[parsed.library]}, but mode argument sets ${NAMES[providedMode] || providedMode}.`);
        }
        const mode = parsed.library;
        if (!semver.satisfies(VERSION[mode], `^${parsed.version.slice(1)}`)) {
            console.warn(`The input spec uses ${mode} ${parsed.version}, but the current version of ${NAMES[mode]} is ${VERSION[mode]}.`);
        }
        return mode;
    }
    if ('mark' in spec$$1 ||
        'encoding' in spec$$1 ||
        'layer' in spec$$1 ||
        'hconcat' in spec$$1 ||
        'vconcat' in spec$$1 ||
        'facet' in spec$$1 ||
        'repeat' in spec$$1) {
        return 'vega-lite';
    }
    if ('marks' in spec$$1 || 'signals' in spec$$1 || 'scales' in spec$$1 || 'axes' in spec$$1) {
        return 'vega';
    }
    return providedMode || 'vega';
}
function isLoader(o) {
    return !!(o && 'load' in o);
}
function embed(el, spec$$1, opt = {}) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const loader$$1 = isLoader(opt.loader) ? opt.loader : vega.loader(opt.loader);
        if (vega.isString(spec$$1)) {
            const data = yield loader$$1.load(spec$$1);
            return embed(el, JSON.parse(data), opt);
        }
        opt = mergeDeep$1(opt, spec$$1.usermeta && spec$$1.usermeta['embedOptions']);
        const patch = opt.patch || opt.onBeforeParse;
        const actions = opt.actions === true || opt.actions === false
            ? opt.actions
            : mergeDeep$1({}, { export: { svg: true, png: true }, source: true, compiled: true, editor: true }, opt.actions || {});
        const i18n = Object.assign({}, I18N, opt.i18n);
        const renderer = opt.renderer || 'canvas';
        const logLevel = opt.logLevel || vega.Warn;
        const downloadFileName = opt.downloadFileName || 'visualization';
        let config$$1 = opt.config || {};
        if (vega.isString(config$$1)) {
            const data = yield loader$$1.load(config$$1);
            return embed(el, spec$$1, Object.assign({}, opt, { config: JSON.parse(data) }));
        }
        if (opt.defaultStyle !== false) {
            const ID = 'vega-embed-style';
            if (!document.getElementById(ID)) {
                const style = document.createElement('style');
                style.id = ID;
                style.innerText =
                    opt.defaultStyle === undefined || opt.defaultStyle === true ? (embedStyle).toString() : opt.defaultStyle;
                document.head.appendChild(style);
            }
        }
        if (opt.theme) {
            config$$1 = mergeDeep$1({}, themes[opt.theme], config$$1);
        }
        const mode = guessMode(spec$$1, opt.mode);
        let vgSpec = PREPROCESSOR[mode](spec$$1, config$$1);
        if (mode === 'vega-lite') {
            if (vgSpec.$schema) {
                const parsed = schemaParser(vgSpec.$schema);
                if (!semver.satisfies(VERSION.vega, `^${parsed.version.slice(1)}`)) {
                    console.warn(`The compiled spec uses Vega ${parsed.version}, but current version is ${VERSION.vega}.`);
                }
            }
        }
        const div = d3.select(el)
            .classed('vega-embed', true)
            .html('');
        if (patch) {
            if (patch instanceof Function) {
                vgSpec = patch(vgSpec);
            }
            else if (vega.isString(patch)) {
                const patchString = yield loader$$1.load(patch);
                vgSpec = mergeDeep$1(vgSpec, JSON.parse(patchString));
            }
            else {
                vgSpec = mergeDeep$1(vgSpec, patch);
            }
        }
        const runtime = vega.parse(vgSpec, mode === 'vega-lite' ? {} : config$$1);
        const view = new vega.View(runtime, {
            loader: loader$$1,
            logLevel,
            renderer
        });
        if (opt.tooltip !== false) {
            let handler;
            if (isTooltipHandler(opt.tooltip)) {
                handler = opt.tooltip;
            }
            else {
                handler = new Handler$1(opt.tooltip === true ? {} : opt.tooltip).call;
            }
            view.tooltip(handler);
        }
        let { hover } = opt;
        if (hover === undefined) {
            hover = mode !== 'vega-lite';
        }
        if (hover) {
            const { hoverSet, updateSet } = (typeof hover === 'boolean' ? {} : hover);
            view.hover(hoverSet, updateSet);
        }
        if (opt) {
            if (opt.width) {
                view.width(opt.width);
            }
            if (opt.height) {
                view.height(opt.height);
            }
            if (opt.padding) {
                view.padding(opt.padding);
            }
        }
        yield view.initialize(el).runAsync();
        if (actions !== false) {
            let wrapper = div;
            if (opt.defaultStyle !== false) {
                const details = div.append('details').attr('title', i18n.CLICK_TO_VIEW_ACTIONS);
                wrapper = details;
                const summary = details.insert('summary');
                summary.html(SVG_CIRCLES);
                const dn = details.node();
                document.addEventListener('click', evt => {
                    if (!dn.contains(evt.target)) {
                        dn.removeAttribute('open');
                    }
                });
            }
            const ctrl = wrapper.insert('div').attr('class', 'vega-actions');
            if (actions === true || actions.export !== false) {
                for (const ext of ['svg', 'png']) {
                    if (actions === true || actions.export === true || actions.export[ext]) {
                        const i18nExportAction = i18n[`${ext.toUpperCase()}_ACTION`];
                        ctrl
                            .append('a')
                            .text(i18nExportAction)
                            .attr('href', '#')
                            .attr('target', '_blank')
                            .attr('download', `${downloadFileName}.${ext}`)
                            .on('mousedown', function () {
                            view
                                .toImageURL(ext, opt.scaleFactor)
                                .then(url => {
                                this.href = url;
                            })
                                .catch(error$$1 => {
                                throw error$$1;
                            });
                            d3.event.preventDefault();
                        });
                    }
                }
            }
            if (actions === true || actions.source !== false) {
                ctrl
                    .append('a')
                    .text(i18n.SOURCE_ACTION)
                    .attr('href', '#')
                    .on('mousedown', () => {
                    viewSource(stringify(spec$$1), opt.sourceHeader || '', opt.sourceFooter || '', mode);
                    d3.event.preventDefault();
                });
            }
            if (mode === 'vega-lite' && (actions === true || actions.compiled !== false)) {
                ctrl
                    .append('a')
                    .text(i18n.COMPILED_ACTION)
                    .attr('href', '#')
                    .on('mousedown', () => {
                    viewSource(stringify(vgSpec), opt.sourceHeader || '', opt.sourceFooter || '', 'vega');
                    d3.event.preventDefault();
                });
            }
            if (actions === true || actions.editor !== false) {
                const editorUrl = opt.editorUrl || 'https://vega.github.io/editor/';
                ctrl
                    .append('a')
                    .text(i18n.EDITOR_ACTION)
                    .attr('href', '#')
                    .on('mousedown', () => {
                    post(window, editorUrl, {
                        config: config$$1,
                        mode,
                        renderer,
                        spec: stringify(spec$$1)
                    });
                    d3.event.preventDefault();
                });
            }
        }
        return { view, spec: spec$$1, vgSpec };
    });
}

var vegaEmbedV3 = embed;

module.exports = vegaEmbedV3;
