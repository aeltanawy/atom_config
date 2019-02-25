import datalib from 'datalib';
import d3 from 'd3';
import load from 'datalib/src/import/load';
import d3Cloud from 'd3-cloud';
import jsonStableStringify from 'json-stable-stringify';
import util from 'datalib/src/util';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

var Dependencies = createCommonjsModule(function (module) {
var deps = module.exports = {
  ALL: ['data', 'fields', 'scales', 'signals']
};
deps.ALL.forEach(function(k) { deps[k.toUpperCase()] = k; });
});
var Dependencies_1 = Dependencies.ALL;

var DEPS = Dependencies.ALL;
function create(cs, reflow) {
  var out = {};
  copy(cs, out);
  out.add = [];
  out.mod = [];
  out.rem = [];
  out.reflow = reflow;
  return out;
}
function copy(a, b) {
  b.stamp = a ? a.stamp : 0;
  b.sort  = a ? a.sort  : null;
  b.facet = a ? a.facet : null;
  b.trans = a ? a.trans : null;
  b.dirty = a ? a.dirty : [];
  b.request = a ? a.request : null;
  for (var d, i=0, n=DEPS.length; i<n; ++i) {
    b[d=DEPS[i]] = a ? a[d] : {};
  }
}
var ChangeSet = {
  create: create,
  copy: copy
};

var ts = Date.now();
function write(msg) {
  console.log('[Vega Log]', msg);
}
function error(msg) {
  console.error('[Vega Err]', msg);
}
function debug(input, args) {
  if (!debug.enable) return;
  var log = Function.prototype.bind.call(console.log, console);
  var state = {
    prevTime:  Date.now() - ts,
    stamp: input.stamp
  };
  if (input.add) {
    state.add = input.add.length;
    state.mod = input.mod.length;
    state.rem = input.rem.length;
    state.reflow = !!input.reflow;
  }
  log.apply(console, (args.push(JSON.stringify(state)), args));
  ts = Date.now();
}
var vegaLogging = {
  log:   write,
  error: error,
  debug: (debug.enable = false, debug)
};

var tupleID = 0;
function ingest(datum) {
  datum = (datum === Object(datum)) ? datum : {data: datum};
  datum._id = ++tupleID;
  if (datum._prev) datum._prev = null;
  return datum;
}
function idMap(a, ids) {
  ids = ids || {};
  for (var i=0, n=a.length; i<n; ++i) {
    ids[a[i]._id] = 1;
  }
  return ids;
}
function copy$1(t, c) {
  c = c || {};
  for (var k in t) {
    if (k !== '_prev' && k !== '_id') c[k] = t[k];
  }
  return c;
}
var Tuple = {
  ingest: ingest,
  idMap: idMap,
  derive: function(d) {
    return ingest(copy$1(d));
  },
  rederive: function(d, t) {
    return copy$1(d, t);
  },
  set: function(t, k, v) {
    return t[k] === v ? 0 : (t[k] = v, 1);
  },
  prev: function(t) {
    return t._prev || t;
  },
  prev_init: function(t) {
    if (!t._prev) { t._prev = {_id: t._id}; }
  },
  prev_update: function(t) {
    var p = t._prev, k, v;
    if (p) for (k in t) {
      if (k !== '_prev' && k !== '_id') {
        p[k] = ((v=t[k]) instanceof Object && v._prev) ? v._prev : v;
      }
    }
  },
  reset: function() { tupleID = 0; },
  idFilter: function(data) {
    var ids = {};
    for (var i=arguments.length; --i>0;) {
      idMap(arguments[i], ids);
    }
    return data.filter(function(x) { return !ids[x._id]; });
  }
};

var DEPS$1 = Dependencies.ALL,
    nodeID = 0;
function Node(graph) {
  if (graph) this.init(graph);
}
var Flags = Node.Flags = {
  Router:     0x01,
  Collector:  0x02,
  Produces:   0x04,
  Mutates:    0x08,
  Reflows:    0x10,
  Batch:      0x20
};
var prototype = Node.prototype;
prototype.init = function(graph) {
  this._id = ++nodeID;
  this._graph = graph;
  this._rank  = graph.rank();
  this._qrank = null;
  this._stamp = 0;
  this._listeners = [];
  this._listeners._ids = {};
  this._deps = {};
  for (var i=0, n=DEPS$1.length; i<n; ++i) {
    this._deps[DEPS$1[i]] = [];
  }
  this._flags = 0;
  return this;
};
prototype.rank = function() {
  return this._rank;
};
prototype.rerank = function() {
  var g = this._graph,
      q = [this],
      cur;
  while (q.length) {
    cur = q.shift();
    cur._rank = g.rank();
    q.unshift.apply(q, cur.listeners());
  }
  return this;
};
prototype.qrank = function(         ) {
  if (!arguments.length) return this._qrank;
  return (this._qrank = this._rank, this);
};
prototype.last = function(stamp) {
  if (!arguments.length) return this._stamp;
  return (this._stamp = stamp, this);
};
prototype._setf = function(v, b) {
  if (b) { this._flags |= v; } else { this._flags &= ~v; }
  return this;
};
prototype.router = function(state) {
  if (!arguments.length) return (this._flags & Flags.Router);
  return this._setf(Flags.Router, state);
};
prototype.collector = function(state) {
  if (!arguments.length) return (this._flags & Flags.Collector);
  return this._setf(Flags.Collector, state);
};
prototype.produces = function(state) {
  if (!arguments.length) return (this._flags & Flags.Produces);
  return this._setf(Flags.Produces, state);
};
prototype.mutates = function(state) {
  if (!arguments.length) return (this._flags & Flags.Mutates);
  return this._setf(Flags.Mutates, state);
};
prototype.reflows = function(state) {
  if (!arguments.length) return (this._flags & Flags.Reflows);
  return this._setf(Flags.Reflows, state);
};
prototype.batch = function(state) {
  if (!arguments.length) return (this._flags & Flags.Batch);
  return this._setf(Flags.Batch, state);
};
prototype.dependency = function(type, deps) {
  var d = this._deps[type],
      n = d._names || (d._names = {});
  if (arguments.length === 1) {
    return d;
  }
  if (deps === null) {
    d.splice(0, d.length);
    d._names = {};
  } else if (!Array.isArray(deps)) {
    if (n[deps]) return this;
    d.push(deps);
    n[deps] = 1;
  } else {
    for (var i=0, len=deps.length, dep; i<len; ++i) {
      dep = deps[i];
      if (n[dep]) continue;
      d.push(dep);
      n[dep] = 1;
    }
  }
  return this;
};
prototype.listeners = function() {
  return this._listeners;
};
prototype.addListener = function(l) {
  if (!(l instanceof Node)) {
    throw Error('Listener is not a Node');
  }
  if (this._listeners._ids[l._id]) return this;
  this._listeners.push(l);
  this._listeners._ids[l._id] = 1;
  if (this._rank > l._rank) {
    l.rerank();
  }
  return this;
};
prototype.removeListener = function(l) {
  if (!this._listeners._ids[l._id]) return false;
  var idx = this._listeners.indexOf(l),
      b = idx >= 0;
  if (b) {
    this._listeners.splice(idx, 1);
    this._listeners._ids[l._id] = null;
  }
  return b;
};
prototype.disconnect = function() {
  this._listeners = [];
  this._listeners._ids = {};
};
prototype.evaluate = function(pulse) {
  return pulse;
};
prototype.reevaluate = function(pulse) {
  var prop, dep, i, n, j, m;
  for (i=0, n=DEPS$1.length; i<n; ++i) {
    prop = DEPS$1[i];
    dep = this._deps[prop];
    for (j=0, m=dep.length; j<m; ++j) {
      if (pulse[prop][dep[j]]) return true;
    }
  }
  return false;
};
Node.reset = function() { nodeID = 0; };
var Node_1 = Node;

var Base = Node_1.prototype;
function Collector(graph) {
  Base.init.call(this, graph);
  this._data = [];
  this.router(true).collector(true);
}
var prototype$1 = (Collector.prototype = Object.create(Base));
prototype$1.constructor = Collector;
prototype$1.data = function() {
  return this._data;
};
prototype$1.evaluate = function(input) {
  vegaLogging.debug(input, ["collecting"]);
  var output = ChangeSet.create(input);
  if (input.rem.length) {
    this._data = Tuple.idFilter(this._data, input.rem);
    output.rem = input.rem.slice(0);
  }
  if (input.add.length) {
    this._data = this._data.concat(input.add);
    output.add = input.add.slice(0);
  }
  if (input.mod.length) {
    output.mod = input.mod.slice(0);
  }
  if (input.sort) {
    this._data.sort(input.sort);
  }
  if (input.reflow) {
    output.mod = output.mod.concat(
      Tuple.idFilter(this._data, output.add, output.mod, output.rem));
    output.reflow = false;
  }
  return output;
};
var Collector_1 = Collector;

function DataSource(graph, name, facet) {
  this._graph = graph;
  this._name = name;
  this._data = [];
  this._source = null;
  this._facet  = facet;
  this._input  = ChangeSet.create();
  this._output = null;
  this._indexes = {};
  this._indexFields = [];
  this._inputNode  = null;
  this._outputNode = null;
  this._pipeline  = null;
  this._collector = null;
  this._mutates = false;
}
var prototype$2 = DataSource.prototype;
prototype$2.name = function(name) {
  if (!arguments.length) return this._name;
  return (this._name = name, this);
};
prototype$2.source = function(src) {
  if (!arguments.length) return this._source;
  return (this._source = this._graph.data(src));
};
prototype$2.insert = function(tuples) {
  this._input.add = this._input.add.concat(tuples.map(Tuple.ingest));
  return this;
};
prototype$2.remove = function(where) {
  var remove = this._data.filter(where);
  this._input.rem = this._input.rem.concat(remove);
  return this;
};
prototype$2.update = function(where, field, func) {
  var mod = this._input.mod,
      ids = Tuple.idMap(mod);
  this._input.fields[field] = 1;
  this._data.filter(where).forEach(function(x) {
    var prev = x[field],
        next = func(x);
    if (prev !== next) {
      Tuple.set(x, field, next);
      if (ids[x._id] !== 1) {
        mod.push(x);
        ids[x._id] = 1;
      }
    }
  });
  return this;
};
prototype$2.values = function(data) {
  if (!arguments.length) return this._collector.data();
  this._input.rem = this._data.slice();
  if (data) { this.insert(data); }
  return this;
};
prototype$2.mutates = function(m) {
  if (!arguments.length) return this._mutates;
  this._mutates = this._mutates || m;
  return this;
};
prototype$2.last = function() {
  return this._output;
};
prototype$2.fire = function(input) {
  if (input) this._input = input;
  this._graph.propagate(this._input, this._pipeline[0]);
  return this;
};
prototype$2.pipeline = function(pipeline) {
  if (!arguments.length) return this._pipeline;
  var graph = this._graph,
      status;
  pipeline.unshift(this._inputNode = DataSourceInput(this));
  status = graph.preprocess(pipeline);
  if (status.router) {
    pipeline.push(status.collector = new Collector_1(graph));
  }
  pipeline.push(this._outputNode = DataSourceOutput(this));
  this._collector = status.collector;
  this._mutates = !!status.mutates;
  graph.connect(this._pipeline = pipeline);
  return this;
};
prototype$2.synchronize = function() {
  this._graph.synchronize(this._pipeline);
  return this;
};
prototype$2.getIndex = function(field) {
  var data = this.values(),
      indexes = this._indexes,
      fields  = this._indexFields,
      f = datalib.$(field),
      index, i, len, value;
  if (!indexes[field]) {
    indexes[field] = index = {};
    fields.push(field);
    for (i=0, len=data.length; i<len; ++i) {
      value = f(data[i]);
      index[value] = (index[value] || 0) + 1;
      Tuple.prev_init(data[i]);
    }
  }
  return indexes[field];
};
prototype$2.listener = function() {
  return DataSourceListener(this).addListener(this._inputNode);
};
prototype$2.addListener = function(l) {
  if (l instanceof DataSource) {
    this._collector.addListener(l.listener());
  } else {
    this._outputNode.addListener(l);
  }
  return this;
};
prototype$2.removeListener = function(l) {
  this._outputNode.removeListener(l);
};
prototype$2.listeners = function(ds) {
  return (ds ? this._collector : this._outputNode).listeners();
};
function DataSourceInput(ds) {
  var input = new Node_1(ds._graph)
    .router(true)
    .collector(true);
  input.data = function() {
    return ds._data;
  };
  input.evaluate = function(input) {
    vegaLogging.debug(input, ['input', ds._name]);
    var delta = ds._input,
        out = ChangeSet.create(input), f;
    for (f in delta.fields) {
      out.fields[f] = 1;
    }
    if (delta.rem.length) {
      ds._data = Tuple.idFilter(ds._data, delta.rem);
    }
    if (delta.add.length) {
      ds._data = ds._data.concat(delta.add);
    }
    if (delta.sort) {
      ds._data.sort(delta.sort);
    }
    if (input.reflow) {
      delta.mod = delta.mod.concat(
        Tuple.idFilter(ds._data, delta.add, delta.mod, delta.rem));
    }
    ds._input = ChangeSet.create();
    out.add = delta.add;
    out.mod = delta.mod;
    out.rem = delta.rem;
    out.facet = ds._facet;
    return out;
  };
  return input;
}
function DataSourceOutput(ds) {
  var output = new Node_1(ds._graph)
    .router(true)
    .reflows(true)
    .collector(true);
  function updateIndices(pulse) {
    var fields = ds._indexFields,
        i, j, f, key, index, value;
    for (i=0; i<fields.length; ++i) {
      key = fields[i];
      index = ds._indexes[key];
      f = datalib.$(key);
      for (j=0; j<pulse.add.length; ++j) {
        value = f(pulse.add[j]);
        Tuple.prev_init(pulse.add[j]);
        index[value] = (index[value] || 0) + 1;
      }
      for (j=0; j<pulse.rem.length; ++j) {
        value = f(pulse.rem[j]);
        index[value] = (index[value] || 0) - 1;
      }
      for (j=0; j<pulse.mod.length; ++j) {
        value = f(pulse.mod[j]._prev);
        index[value] = (index[value] || 0) - 1;
        value = f(pulse.mod[j]);
        index[value] = (index[value] || 0) + 1;
      }
    }
  }
  output.data = function() {
    return ds._collector ? ds._collector.data() : ds._data;
  };
  output.evaluate = function(input) {
    vegaLogging.debug(input, ['output', ds._name]);
    updateIndices(input);
    var out = ChangeSet.create(input, true);
    if (ds._facet) {
      ds._facet.values = ds.values();
      input.facet = null;
    }
    ds._output = input;
    out.data[ds._name] = 1;
    return out;
  };
  return output;
}
function DataSourceListener(ds) {
  var l = new Node_1(ds._graph).router(true);
  l.evaluate = function(input) {
    if (ds.mutates()) {
      var map = ds._srcMap || (ds._srcMap = {}),
          output = ChangeSet.create(input);
      output.add = input.add.map(function(t) {
        return (map[t._id] = Tuple.derive(t));
      });
      output.mod = input.mod.map(function(t) {
        return Tuple.rederive(t, map[t._id]);
      });
      output.rem = input.rem.map(function(t) {
        var o = map[t._id];
        return (map[t._id] = null, o);
      });
      return (ds._input = output);
    } else {
      return (ds._input = input);
    }
  };
  return l;
}
var DataSource_1 = DataSource;

function Heap(comparator) {
  this.cmp = comparator;
  this.nodes = [];
}
var prototype$3 = Heap.prototype;
prototype$3.size = function() {
  return this.nodes.length;
};
prototype$3.clear = function() {
  return (this.nodes = [], this);
};
prototype$3.peek = function() {
  return this.nodes[0];
};
prototype$3.push = function(x) {
  var array = this.nodes;
  array.push(x);
  return _siftdown(array, 0, array.length-1, this.cmp);
};
prototype$3.pop = function() {
  var array = this.nodes,
      last = array.pop(),
      item;
  if (array.length) {
    item = array[0];
    array[0] = last;
    _siftup(array, 0, this.cmp);
  } else {
    item = last;
  }
  return item;
};
prototype$3.replace = function(item) {
  var array = this.nodes,
      retval = array[0];
  array[0] = item;
  _siftup(array, 0, this.cmp);
  return retval;
};
prototype$3.pushpop = function(item) {
  var array = this.nodes, ref = array[0];
  if (array.length && this.cmp(ref, item) < 0) {
    array[0] = item;
    item = ref;
    _siftup(array, 0, this.cmp);
  }
  return item;
};
function _siftdown(array, start, idx, cmp) {
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
function _siftup(array, idx, cmp) {
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
  return _siftdown(array, start, idx, cmp);
}
var Heap_1 = Heap;

var Base$1 = Node_1.prototype;
function Signal(graph, name, initialValue) {
  Base$1.init.call(this, graph);
  this._name  = name;
  this._value = initialValue;
  this._verbose = false;
  this._handlers = [];
  return this;
}
var prototype$4 = (Signal.prototype = Object.create(Base$1));
prototype$4.constructor = Signal;
prototype$4.name = function() {
  return this._name;
};
prototype$4.value = function(val) {
  if (!arguments.length) return this._value;
  return (this._value = val, this);
};
prototype$4.values = prototype$4.value;
prototype$4.verbose = function(v) {
  if (!arguments.length) return this._verbose;
  return (this._verbose = !!v, this);
};
prototype$4.evaluate = function(input) {
  return input.signals[this._name] ? input : this._graph.doNotPropagate;
};
prototype$4.fire = function(cs) {
  if (!cs) cs = ChangeSet.create(null, true);
  cs.signals[this._name] = 1;
  this._graph.propagate(cs, this);
};
prototype$4.on = function(handler) {
  var signal = this,
      node = new Node_1(this._graph);
  node.evaluate = function(input) {
    handler(signal.name(), signal.value());
    return input;
  };
  this._handlers.push({
    handler: handler,
    node: node
  });
  return this.addListener(node);
};
prototype$4.off = function(handler) {
  var h = this._handlers, i, x;
  for (i=h.length; --i>=0;) {
    if (!handler || h[i].handler === handler) {
      x = h.splice(i, 1)[0];
      this.removeListener(x.node);
    }
  }
  return this;
};
var Signal_1 = Signal;

function Graph() {
}
var prototype$5 = Graph.prototype;
prototype$5.init = function() {
  this._stamp = 0;
  this._rank  = 0;
  this._data = {};
  this._signals = {};
  this._requestedIndexes = {};
  this.doNotPropagate = {};
};
prototype$5.rank = function() {
  return ++this._rank;
};
prototype$5.values = function(type, names, hash) {
  var data = (type === Dependencies.SIGNALS ? this._signals : this._data),
      n = (names !== undefined ? names : datalib.keys(data)),
      vals, i;
  if (Array.isArray(n)) {
    vals = hash || {};
    for (i=0; i<n.length; ++i) {
      vals[n[i]] = data[n[i]].values();
    }
    return vals;
  } else {
    return data[n].values();
  }
};
prototype$5.dataValues = function(names) {
  return this.values(Dependencies.DATA, names);
};
prototype$5.signalValues = function(names) {
  return this.values(Dependencies.SIGNALS, names);
};
prototype$5.data = function(name, pipeline, facet) {
  var db = this._data;
  if (!arguments.length) {
    var all = [], key;
    for (key in db) { all.push(db[key]); }
    return all;
  } else if (arguments.length === 1) {
    return db[name];
  } else {
    return (db[name] = new DataSource_1(this, name, facet).pipeline(pipeline));
  }
};
prototype$5.signal = function(name, init) {
  if (arguments.length === 1) {
    var m = this;
    return Array.isArray(name) ?
      name.map(function(n) { return m._signals[n]; }) :
      this._signals[name];
  } else {
    return (this._signals[name] = new Signal_1(this, name, init));
  }
};
prototype$5.signalRef = function(ref) {
  if (!Array.isArray(ref)) {
    ref = datalib.field(ref);
  }
  var value = this.signal(ref[0]).value();
  if (ref.length > 1) {
    for (var i=1, n=ref.length; i<n; ++i) {
      value = value[ref[i]];
    }
  }
  return value;
};
prototype$5.requestIndex = function(data, field) {
  var ri  = this._requestedIndexes,
      reg = ri[data] || (ri[data] = {});
  return (reg[field] = true, this);
};
prototype$5.buildIndexes = function() {
  var ri = this._requestedIndexes,
      data = datalib.keys(ri),
      i, len, j, jlen, d, src, fields, f;
  for (i=0, len=data.length; i<len; ++i) {
    src = this.data(d=data[i]);
    if (!src) throw Error('Data source '+datalib.str(d)+' does not exist.');
    fields = datalib.keys(ri[d]);
    for (j=0, jlen=fields.length; j<jlen; ++j) {
      if ((f=fields[j]) === null) continue;
      src.getIndex(f);
      ri[d][f] = null;
    }
  }
  return this;
};
prototype$5.propagate = function(pulse, node, stamp, skipSignals) {
  var pulses = {},
      listeners, next, nplse, tpls, ntpls, i, len, isSg;
  var pq = new Heap_1(function(a, b) {
    return a._qrank - b._qrank;
  });
  if (pulse.stamp) throw Error('Pulse already has a non-zero stamp.');
  pulse.stamp = stamp || ++this._stamp;
  pulses[node._id] = pulse;
  pq.push(node.qrank(true));
  while (pq.size() > 0) {
    node  = pq.peek();
    isSg  = node instanceof Signal_1;
    pulse = pulses[node._id];
    if (node.rank() !== node.qrank()) {
      pq.replace(node.qrank(true));
    } else {
      pq.pop();
      pulses[node._id] = null;
      listeners = node._listeners;
      if (!isSg || (isSg && !skipSignals)) {
        pulse = this.evaluate(pulse, node);
      }
      if (pulse !== this.doNotPropagate) {
        if (!pulse.reflow && node.reflows()) {
          pulse = ChangeSet.create(pulse, true);
        }
        for (i=0, len=listeners.length; i<len; ++i) {
          next = listeners[i];
          if ((nplse = pulses[next._id]) !== undefined) {
            if (nplse === null) throw Error('Already propagated to node.');
            if (nplse === pulse) continue;
            tpls  = pulse.add.length || pulse.mod.length || pulse.rem.length;
            ntpls = nplse.add.length || nplse.mod.length || nplse.rem.length;
            if (tpls && ntpls) throw Error('Multiple changeset pulses to same node');
            pulses[next._id] = tpls ? pulse : nplse;
            pulses[next._id].reflow = pulse.reflow || nplse.reflow;
          } else {
            pq.push(next.qrank(true));
            pulses[next._id] = pulse;
          }
        }
      }
    }
  }
  return this.done(pulse);
};
prototype$5.done = function(pulse) {
  vegaLogging.debug(pulse, ['bookkeeping']);
  for (var d in pulse.data) { this.data(d).synchronize(); }
  return this;
};
prototype$5.preprocess = function(branch) {
  var graph = this,
      mutates = 0,
      node, router, collector, collects;
  for (var i=0; i<branch.length; ++i) {
    node = branch[i];
    if (node.batch() && !node._collector) {
      if (router || !collector) {
        node = new Collector_1(graph);
        branch.splice(i, 0, node);
        router = false;
      } else {
        node._collector = collector;
      }
    }
    if ((collects = node.collector())) collector = node;
    router  = router  || node.router() && !collects;
    mutates = mutates || node.mutates();
    if (node.produces()) {
      branch.splice(i+1, 0, new Collector_1(graph));
      router = false;
    }
  }
  return {router: router, collector: collector, mutates: mutates};
};
prototype$5.connect = function(branch) {
  var collector, node, data, signals, i, n, j, m, x, y;
  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (node.collector()) collector = node;
    data = node.dependency(Dependencies.DATA);
    for (j=0, m=data.length; j<m; ++j) {
      if (!(x=this.data(y=data[j]))) {
        throw new Error('Unknown data source ' + datalib.str(y));
      }
      x.addListener(collector);
    }
    signals = node.dependency(Dependencies.SIGNALS);
    for (j=0, m=signals.length; j<m; ++j) {
      if (!(x=this.signal(y=signals[j]))) {
        throw new Error('Unknown signal ' + datalib.str(y));
      }
      x.addListener(collector);
    }
    if (i > 0) branch[i-1].addListener(node);
  }
  return branch;
};
prototype$5.disconnect = function(branch) {
  var collector, node, data, signals, i, n, j, m;
  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (node.collector()) collector = node;
    data = node.dependency(Dependencies.DATA);
    for (j=0, m=data.length; j<m; ++j) {
      this.data(data[j]).removeListener(collector);
    }
    signals = node.dependency(Dependencies.SIGNALS);
    for (j=0, m=signals.length; j<m; ++j) {
      this.signal(signals[j]).removeListener(collector);
    }
    node.disconnect();
  }
  return branch;
};
prototype$5.synchronize = function(branch) {
  var ids = {},
      node, data, i, n, j, m, d, id;
  for (i=0, n=branch.length; i<n; ++i) {
    node = branch[i];
    if (!node.collector()) continue;
    for (j=0, data=node.data(), m=data.length; j<m; ++j) {
      id = (d = data[j])._id;
      if (ids[id]) continue;
      Tuple.prev_update(d);
      ids[id] = 1;
    }
  }
  return this;
};
prototype$5.reevaluate = function(pulse, node) {
  var reflowed = pulse.reflow && node.last() >= pulse.stamp,
      run = node.router() || pulse.add.length || pulse.rem.length;
  return run || !reflowed || node.reevaluate(pulse);
};
prototype$5.evaluate = function(pulse, node) {
  if (!this.reevaluate(pulse, node)) return pulse;
  pulse = node.evaluate(pulse);
  node.last(pulse.stamp);
  return pulse;
};
var Graph_1 = Graph;

var src = {
  ChangeSet:    ChangeSet,
  Collector:    Collector_1,
  DataSource:   DataSource_1,
  Dependencies: Dependencies,
  Graph:        Graph_1,
  Node:         Node_1,
  Signal:       Signal_1,
  Tuple:        Tuple,
  debug:        vegaLogging.debug
};

var Tuple$1 = src.Tuple;
var DEPS$2 = ["signals", "scales", "data", "fields"];
function properties(model, mark, spec) {
  var config = model.config(),
      code = "",
      names = datalib.keys(spec),
      exprs = [],
      i, len, name, ref, vars = {},
      deps = {
        signals: {},
        scales:  {},
        data:    {},
        fields:  {},
        nested:  [],
        _nRefs:  {},
        reflow:  false
      };
  code += "var o = trans ? {} : item, d=0, exprs=this.exprs, set=this.tpl.set, tmpl=signals||{}, t;\n" +
          "tmpl.datum  = item.datum;\n" +
          "tmpl.group  = group;\n" +
          "tmpl.parent = group.datum;\n";
  function handleDep(p) {
    if (ref[p] == null) return;
    var k = datalib.array(ref[p]), i, n;
    for (i=0, n=k.length; i<n; ++i) {
      deps[p][k[i]] = 1;
    }
  }
  function handleNestedRefs(r) {
    var k = (r.parent ? "parent_" : "group_")+r.level;
    deps._nRefs[k] = r;
  }
  parseShape(model, config, spec);
  for (i=0, len=names.length; i<len; ++i) {
    ref = spec[name = names[i]];
    code += (i > 0) ? "\n  " : "  ";
    if (ref.rule) {
      ref = rule(model, name, ref.rule, exprs);
      code += "\n  " + ref.code;
    } else if (datalib.isArray(ref)) {
      ref = rule(model, name, ref, exprs);
      code += "\n  " + ref.code;
    } else {
      ref = valueRef(config, name, ref);
      code += "d += set(o, "+datalib.str(name)+", "+ref.val+");";
    }
    vars[name] = true;
    DEPS$2.forEach(handleDep);
    deps.reflow = deps.reflow || ref.reflow;
    if (ref.nested.length) ref.nested.forEach(handleNestedRefs);
  }
  datalib.keys(deps._nRefs).forEach(function(k) { deps.nested.push(deps._nRefs[k]); });
  deps.nested.sort(function(a, b) {
    a = a.level;
    b = b.level;
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  });
  if (vars.x2) {
    if (vars.x) {
      code += "\n  if (o.x > o.x2) { " +
              "\n    t = o.x;" +
              "\n    d += set(o, 'x', o.x2);" +
              "\n    d += set(o, 'x2', t); " +
              "\n  };";
      code += "\n  d += set(o, 'width', (o.x2 - o.x));";
    } else if (vars.width) {
      code += "\n  d += set(o, 'x', (o.x2 - o.width));";
    } else {
      code += "\n  d += set(o, 'x', o.x2);";
    }
  }
  if (vars.xc) {
    if (vars.width) {
      code += "\n  d += set(o, 'x', (o.xc - o.width/2));" ;
    } else {
      code += "\n  d += set(o, 'x', o.xc);" ;
    }
  }
  if (vars.y2) {
    if (vars.y) {
      code += "\n  if (o.y > o.y2) { " +
              "\n    t = o.y;" +
              "\n    d += set(o, 'y', o.y2);" +
              "\n    d += set(o, 'y2', t);" +
              "\n  };";
      code += "\n  d += set(o, 'height', (o.y2 - o.y));";
    } else if (vars.height) {
      code += "\n  d += set(o, 'y', (o.y2 - o.height));";
    } else {
      code += "\n  d += set(o, 'y', o.y2);";
    }
  }
  if (vars.yc) {
    if (vars.height) {
      code += "\n  d += set(o, 'y', (o.yc - o.height/2));" ;
    } else {
      code += "\n  d += set(o, 'y', o.yc);" ;
    }
  }
  if (hasPath(mark, vars)) code += "\n  d += (item.touch(), 1);";
  code += "\n  if (trans) trans.interpolate(item, o);";
  code += "\n  return d > 0;";
  try {
    var encoder = Function('item', 'group', 'trans', 'db',
      'signals', 'predicates', code);
    encoder.tpl  = Tuple$1;
    encoder.exprs = exprs;
    encoder.util = datalib;
    encoder.d3   = d3;
    datalib.extend(encoder, datalib.template.context);
    return {
      encode:  encoder,
      signals: datalib.keys(deps.signals),
      scales:  datalib.keys(deps.scales),
      data:    datalib.keys(deps.data),
      fields:  datalib.keys(deps.fields),
      nested:  deps.nested,
      reflow:  deps.reflow
    };
  } catch (e) {
    vegaLogging.error(e);
    vegaLogging.log(code);
  }
}
function dependencies(a, b) {
  if (!datalib.isObject(a)) {
    a = {reflow: false, nested: []};
    DEPS$2.forEach(function(d) { a[d] = []; });
  }
  if (datalib.isObject(b)) {
    a.reflow = a.reflow || b.reflow;
    a.nested.push.apply(a.nested, b.nested);
    DEPS$2.forEach(function(d) { a[d].push.apply(a[d], b[d]); });
  }
  return a;
}
function hasPath(mark, vars) {
  return vars.path ||
    ((mark==='area' || mark==='line') &&
      (vars.x || vars.x2 || vars.width ||
       vars.y || vars.y2 || vars.height ||
       vars.tension || vars.interpolate));
}
var hb = /{{(.*?)}}/g;
function parseShape(model, config, spec) {
  var shape = spec.shape,
      last = 0,
      value, match;
  if (shape && (value = shape.value)) {
    if (config.shape && config.shape[value]) {
      value = config.shape[value];
    }
    shape = '';
    while ((match = hb.exec(value)) !== null) {
      shape += value.substring(last, match.index);
      shape += model.expr(match[1]).fn();
      last = hb.lastIndex;
    }
    spec.shape.value = shape + value.substring(last);
  }
}
function rule(model, name, rules, exprs) {
  var config  = model.config(),
      deps = dependencies(),
      inputs  = [],
      code = '';
  (rules||[]).forEach(function(r, i) {
    var ref = valueRef(config, name, r);
    dependencies(deps, ref);
    if (r.test) {
      var exprFn = model.expr(r.test);
      deps.signals.push.apply(deps.signals, exprFn.globals);
      deps.data.push.apply(deps.data, exprFn.dataSources);
      code += "if (exprs[" + exprs.length + "](item.datum, item.mark.group.datum, null)) {" +
          "\n    d += set(o, "+datalib.str(name)+", " +ref.val+");";
      code += rules[i+1] ? "\n  } else " : "  }";
      exprs.push(exprFn.fn);
    } else {
      var def = r.predicate,
          predName = def && (def.name || def),
          pred = model.predicate(predName),
          p = 'predicates['+datalib.str(predName)+']',
          input = [], args = name+'_arg'+i;
      if (datalib.isObject(def)) {
        datalib.keys(def).forEach(function(k) {
          if (k === 'name') return;
          var ref = valueRef(config, i, def[k], true);
          input.push(datalib.str(k)+': '+ref.val);
          dependencies(deps, ref);
        });
      }
      if (predName) {
        deps.signals.push.apply(deps.signals, pred.signals);
        deps.data.push.apply(deps.data, pred.data);
        inputs.push(args+" = {\n    "+input.join(",\n    ")+"\n  }");
        code += "if ("+p+".call("+p+","+args+", db, signals, predicates)) {" +
          "\n    d += set(o, "+datalib.str(name)+", "+ref.val+");";
        code += rules[i+1] ? "\n  } else " : "  }";
      } else {
        code += "{" +
          "\n    d += set(o, "+datalib.str(name)+", "+ref.val+");"+
          "\n  }\n";
      }
    }
  });
  if (inputs.length) code = "var " + inputs.join(",\n      ") + ";\n  " + code;
  return (deps.code = code, deps);
}
function valueRef(config, name, ref, predicateArg) {
  if (ref == null) return null;
  if (name==='fill' || name==='stroke') {
    if (ref.c) {
      return colorRef(config, 'hcl', ref.h, ref.c, ref.l);
    } else if (ref.h || ref.s) {
      return colorRef(config, 'hsl', ref.h, ref.s, ref.l);
    } else if (ref.l || ref.a) {
      return colorRef(config, 'lab', ref.l, ref.a, ref.b);
    } else if (ref.r || ref.g || ref.b) {
      return colorRef(config, 'rgb', ref.r, ref.g, ref.b);
    }
  }
  var val = null, scale = null,
      deps = dependencies(),
      sgRef = null, fRef = null, sRef = null, tmpl = {};
  if (ref.template !== undefined) {
    val = datalib.template.source(ref.template, 'tmpl', tmpl);
    datalib.keys(tmpl).forEach(function(k) {
      var f = datalib.field(k),
          a = f.shift();
      if (a === 'parent' || a === 'group') {
        deps.nested.push({
          parent: a === 'parent',
          group:  a === 'group',
          level:  1
        });
      } else if (a === 'datum') {
        deps.fields.push(f[0]);
      } else {
        deps.signals.push(a);
      }
    });
  }
  if (ref.value !== undefined) {
    val = datalib.str(ref.value);
  }
  if (ref.signal !== undefined) {
    sgRef = datalib.field(ref.signal);
    val = 'signals['+sgRef.map(datalib.str).join('][')+']';
    deps.signals.push(sgRef.shift());
  }
  if (ref.field !== undefined) {
    ref.field = datalib.isString(ref.field) ? {datum: ref.field} : ref.field;
    fRef = fieldRef(ref.field);
    val  = fRef.val;
    dependencies(deps, fRef);
  }
  if (ref.scale !== undefined) {
    sRef  = scaleRef(ref.scale);
    scale = sRef.val;
    dependencies(deps, sRef);
    deps.scales.push(ref.scale.name || ref.scale);
    if (val !== null || ref.band || ref.mult || ref.offset || !predicateArg) {
      val = scale + (ref.band ? '.rangeBand()' :
        '('+(val !== null ? val : 'item.datum.data')+')');
    } else if (predicateArg) {
      val = scale;
    }
  }
  val = '(' + (ref.mult?(datalib.number(ref.mult)+' * '):'') + val + ')' +
        (ref.offset ? ' + ' + datalib.number(ref.offset) : '');
  return (deps.val = val, deps);
}
function colorRef(config, type, x, y, z) {
  var xx = x ? valueRef(config, '', x) : config.color[type][0],
      yy = y ? valueRef(config, '', y) : config.color[type][1],
      zz = z ? valueRef(config, '', z) : config.color[type][2],
      deps = dependencies();
  [xx, yy, zz].forEach(function(v) {
    if (datalib.isArray) return;
    dependencies(deps, v);
  });
  var val = '(this.d3.' + type + '(' + [xx.val, yy.val, zz.val].join(',') + ') + "")';
  return (deps.val = val, deps);
}
function fieldRef(ref) {
  if (datalib.isString(ref)) {
    return {val: datalib.field(ref).map(datalib.str).join('][')};
  }
  var l = ref.level || 1,
      nested = (ref.group || ref.parent) && l,
      scope = nested ? Array(l).join('group.mark.') : '',
      r = fieldRef(ref.datum || ref.group || ref.parent || ref.signal),
      val = r.val,
      deps = dependencies(null, r);
  if (ref.datum) {
    val = 'item.datum['+val+']';
    deps.fields.push(ref.datum);
  } else if (ref.group) {
    val = scope+'group['+val+']';
    deps.nested.push({ level: l, group: true });
  } else if (ref.parent) {
    val = scope+'group.datum['+val+']';
    deps.nested.push({ level: l, parent: true });
  } else if (ref.signal) {
    val = 'signals['+val+']';
    deps.signals.push(datalib.field(ref.signal)[0]);
    deps.reflow = true;
  }
  return (deps.val = val, deps);
}
function scaleRef(ref) {
  var scale = null,
      fr = null,
      deps = dependencies();
  if (datalib.isString(ref)) {
    scale = datalib.str(ref);
  } else if (ref.name) {
    scale = datalib.isString(ref.name) ? datalib.str(ref.name) : (fr = fieldRef(ref.name)).val;
  } else {
    scale = (fr = fieldRef(ref)).val;
  }
  scale = '(item.mark._scaleRefs['+scale+'] = 1, group.scale('+scale+'))';
  if (ref.invert) scale += '.invert';
  if (fr) fr.nested.forEach(function(g) { g.scale = true; });
  return fr ? (fr.val = scale, fr) : (deps.val = scale, deps);
}
var properties_1 = properties;
function valueSchema(type) {
  type = datalib.isArray(type) ? {"enum": type} : {"type": type};
  var modType = type.type === "number" && type.type || "string";
  var valRef  = {
    "type": "object",
    "allOf": [{"$ref": "#/refs/" + modType + "Modifiers"}, {
      "oneOf": [{
        "$ref": "#/refs/signal",
        "required": ["signal"]
      }, {
        "properties": {"value": type},
        "required": ["value"]
      }, {
        "properties": {"field": {"$ref": "#/refs/field"}},
        "required": ["field"]
      }, {
        "properties": {"band": {"type": "boolean"}},
        "required": ["band"]
      }]
    }]
  };
  if (type.type === "string") {
    valRef.allOf[1].oneOf.push({
      "properties": {"template": {"type": "string"}},
      "required": ["template"]
    });
  }
  return {
    "oneOf": [{
      "type": "object",
      "properties": {
        "rule": {
          "type": "array",
          "items": {
            "allOf": [{"$ref": "#/defs/rule"}, valRef]
          }
        }
      },
      "additionalProperties": false,
      "required": ["rule"]
    },
    {
      "type": "array",
      "items": {
        "allOf": [{"$ref": "#/defs/rule"}, valRef]
      }
    },
    valRef]
  };
}
properties.schema = {
  "refs": {
    "field": {
      "title": "FieldRef",
      "oneOf": [
        {"type": "string"},
        {
          "oneOf": [
            {"$ref": "#/refs/signal"},
            {
              "type": "object",
              "properties": {"datum": {"$ref": "#/refs/field"}},
              "required": ["datum"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "group": {"$ref": "#/refs/field"},
                "level": {"type": "number"}
              },
              "required": ["group"],
              "additionalProperties": false
            },
            {
              "type": "object",
              "properties": {
                "parent": {"$ref": "#/refs/field"},
                "level": {"type": "number"}
              },
              "required": ["parent"],
              "additionalProperties": false
            }
          ]
        }
      ]
    },
    "scale": {
      "title": "ScaleRef",
      "oneOf": [
        {"$ref": "#/refs/field"},
        {
          "type": "object",
          "properties": {
            "name": {"$ref": "#/refs/field"},
            "invert": {"type": "boolean", "default": false}
          },
          "required": ["name"]
        }
      ]
    },
    "stringModifiers": {
      "properties": {
        "scale": {"$ref": "#/refs/scale"}
      }
    },
    "numberModifiers": {
      "properties": {
        "mult": {"type": "number"},
        "offset": {"type": "number"},
        "scale": {"$ref": "#/refs/scale"}
      }
    },
    "value": valueSchema({}, "value"),
    "numberValue": valueSchema("number", "numberValue"),
    "stringValue": valueSchema("string", "stringValue"),
    "booleanValue": valueSchema("boolean", "booleanValue"),
    "arrayValue": valueSchema("array", "arrayValue"),
    "colorValue": {
      "title": "ColorRef",
      "oneOf": [{"$ref": "#/refs/stringValue"}, {
        "type": "object",
        "properties": {
          "r": {"$ref": "#/refs/numberValue"},
          "g": {"$ref": "#/refs/numberValue"},
          "b": {"$ref": "#/refs/numberValue"}
        },
        "required": ["r", "g", "b"]
      }, {
        "type": "object",
        "properties": {
          "h": {"$ref": "#/refs/numberValue"},
          "s": {"$ref": "#/refs/numberValue"},
          "l": {"$ref": "#/refs/numberValue"}
        },
        "required": ["h", "s", "l"]
      }, {
        "type": "object",
        "properties": {
          "l": {"$ref": "#/refs/numberValue"},
          "a": {"$ref": "#/refs/numberValue"},
          "b": {"$ref": "#/refs/numberValue"}
        },
        "required": ["l", "a", "b"]
      }, {
        "type": "object",
        "properties": {
          "h": {"$ref": "#/refs/numberValue"},
          "c": {"$ref": "#/refs/numberValue"},
          "l": {"$ref": "#/refs/numberValue"}
        },
        "required": ["h", "c", "l"]
      }]
    }
  },
  "defs": {
    "rule": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "predicate": {
              "oneOf": [
                {"type": "string"},
                {
                  "type": "object",
                  "properties": {"name": { "type": "string" }},
                  "required": ["name"]
                }
              ]
            }
          }
        },
        {
          "type": "object",
          "properties": {"test": {"type": "string"}}
        }
      ]
    },
    "propset": {
      "title": "Mark property set",
      "type": "object",
      "properties": {
        "x": {"$ref": "#/refs/numberValue"},
        "x2": {"$ref": "#/refs/numberValue"},
        "xc": {"$ref": "#/refs/numberValue"},
        "width": {"$ref": "#/refs/numberValue"},
        "y": {"$ref": "#/refs/numberValue"},
        "y2": {"$ref": "#/refs/numberValue"},
        "yc": {"$ref": "#/refs/numberValue"},
        "height": {"$ref": "#/refs/numberValue"},
        "opacity": {"$ref": "#/refs/numberValue"},
        "fill": {"$ref": "#/refs/colorValue"},
        "fillOpacity": {"$ref": "#/refs/numberValue"},
        "stroke": {"$ref": "#/refs/colorValue"},
        "strokeWidth": {"$ref": "#/refs/numberValue"},
        "strokeOpacity": {"$ref": "#/refs/numberValue"},
        "strokeDash": {"$ref": "#/refs/arrayValue"},
        "strokeDashOffset": {"$ref": "#/refs/numberValue"},
        "cursor": {"$ref": "#/refs/stringValue"},
        "clip": {"$ref": "#/refs/booleanValue"},
        "size": {"$ref": "#/refs/numberValue"},
        "shape": {
          "anyOf": [
            valueSchema(["circle", "square", "cross", "diamond",
              "triangle-up", "triangle-down"]),
            {"$ref": "#/refs/stringValue"}
          ]
        },
        "path": {"$ref": "#/refs/stringValue"},
        "innerRadius": {"$ref": "#/refs/numberValue"},
        "outerRadius": {"$ref": "#/refs/numberValue"},
        "startAngle": {"$ref": "#/refs/numberValue"},
        "endAngle": {"$ref": "#/refs/numberValue"},
        "interpolate": valueSchema(["linear", "linear-closed",
          "step", "step-before", "step-after",
          "basis", "basis-open", "basis-closed",
          "cardinal", "cardinal-open", "cardinal-closed",
          "bundle", "monotone"]),
        "tension": {"$ref": "#/refs/numberValue"},
        "orient": valueSchema(["horizontal", "vertical"]),
        "url": {"$ref": "#/refs/stringValue"},
        "align": valueSchema(["left", "right", "center"]),
        "baseline": valueSchema(["top", "middle", "bottom", "alphabetic"]),
        "text": {"$ref": "#/refs/stringValue"},
        "dx": {"$ref": "#/refs/numberValue"},
        "dy": {"$ref": "#/refs/numberValue"},
        "radius":{"$ref": "#/refs/numberValue"},
        "theta": {"$ref": "#/refs/numberValue"},
        "angle": {"$ref": "#/refs/numberValue"},
        "font": {"$ref": "#/refs/stringValue"},
        "fontSize": {"$ref": "#/refs/numberValue"},
        "fontWeight": {"$ref": "#/refs/stringValue"},
        "fontStyle": {"$ref": "#/refs/stringValue"}
      },
      "additionalProperties": false
    }
  }
};

function parseMark(model, mark, applyDefaults) {
  var props = mark.properties || (applyDefaults && (mark.properties = {})),
      enter = props.enter || (applyDefaults && (props.enter = {})),
      group = mark.marks,
      config = model.config().marks || {};
  if (applyDefaults) {
    if (mark.type === 'symbol' && !enter.size && config.symbolSize) {
        enter.size = {value: config.symbolSize};
    }
    var colorMap = {
      arc: 'fill', area: 'fill', rect: 'fill', symbol: 'fill', text: 'fill',
      line: 'stroke', path: 'stroke', rule: 'stroke'
    };
    var colorProp = colorMap[mark.type];
    if (!enter[colorProp] && config.color) {
      enter[colorProp] = {value: config.color};
    }
  }
  datalib.keys(props).forEach(function(k) {
    props[k] = properties_1(model, mark.type, props[k]);
  });
  if (mark.delay) {
    mark.delay = properties_1(model, mark.type, {delay: mark.delay});
  }
  if (group) {
    mark.marks = group.map(function(g) { return parseMark(model, g, true); });
  }
  return mark;
}
var mark = parseMark;
parseMark.schema = {
  "defs": {
    "mark": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "key": {"type": "string"},
        "type": {"enum": ["rect", "symbol", "path", "arc",
          "area", "line", "rule", "image", "text", "group"]},
        "from": {
          "type": "object",
          "properties": {
            "data": {"type": "string"},
            "mark": {"type": "string"},
            "transform": {"$ref": "#/defs/transform"}
          },
          "additionalProperties": false
        },
        "delay": {"$ref": "#/refs/numberValue"},
        "ease": {
          "enum": ["linear", "quad", "cubic", "sin",
            "exp", "circle", "bounce"].reduce(function(acc, e) {
              ["in", "out", "in-out", "out-in"].forEach(function(m) {
                acc.push(e+"-"+m);
              });
              return acc;
          }, [])
        },
        "interactive": {"type": "boolean"},
        "properties": {
          "type": "object",
          "properties": {
            "enter":  {"$ref": "#/defs/propset"},
            "update": {"$ref": "#/defs/propset"},
            "exit":   {"$ref": "#/defs/propset"},
            "hover":  {"$ref": "#/defs/propset"}
          },
          "additionalProperties": false,
          "anyOf": [{"required": ["enter"]}, {"required": ["update"]}]
        }
      },
      "required": ["type"]
    }
  }
};

var TIME    = 'time',
    UTC     = 'utc',
    STRING  = 'string',
    ORDINAL = 'ordinal',
    NUMBER  = 'number';
function getTickFormat(scale, tickCount, tickFormatType, tickFormatString) {
  var formatType = tickFormatType || inferFormatType(scale);
  return getFormatter(scale, tickCount, formatType, tickFormatString);
}
function inferFormatType(scale) {
  switch (scale.type) {
    case TIME:    return TIME;
    case UTC:     return UTC;
    case ORDINAL: return STRING;
    default:      return NUMBER;
  }
}
function logFilter(scale, domain, count, f) {
  if (count == null) return f;
  var base = scale.base(),
      k = Math.min(base, scale.ticks().length / count),
      v = domain[0] > 0 ? (e = 1e-12, Math.ceil) : (e = -1e-12, Math.floor),
      e;
  function log(x) {
    return (domain[0] < 0 ?
      -Math.log(x > 0 ? 0 : -x) :
      Math.log(x < 0 ? 0 : x)) / Math.log(base);
  }
  function pow(x) {
    return domain[0] < 0 ? -Math.pow(base, -x) : Math.pow(base, x);
  }
  return function(d) {
    return pow(v(log(d) + e)) / d >= k ? f(d) : '';
  };
}
function getFormatter(scale, tickCount, formatType, str) {
  var fmt = datalib.format,
      log = scale.type === 'log',
      domain;
  switch (formatType) {
    case NUMBER:
      domain = scale.domain();
      return log ?
        logFilter(scale, domain, tickCount, fmt.auto.number(str || null)) :
        fmt.auto.linear(domain, tickCount, str || null);
    case TIME: return (str ? fmt : fmt.auto).time(str);
    case UTC:  return (str ? fmt : fmt.auto).utc(str);
    default:   return String;
  }
}
var format = {
  getTickFormat: getTickFormat
};

var u  = {};
datalib.extend(u, format);
var util$1 = datalib.extend(u, datalib);

var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
    regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)([-+])/g, /\s|,|###/];
var parse = function(pathstr) {
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
};

var segmentCache = {},
    bezierCache = {},
    join = [].join;
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
var arc = {
  segments: segments,
  bezier: bezier,
  cache: {
    segments: segmentCache,
    bezier: bezierCache
  }
};

var render = function(g, path, l, t) {
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
  g.beginPath();
  for (var i=0, len=path.length; i<len; ++i) {
    current = path[i];
    switch (current[0]) {
      case 'l':
        x += current[1];
        y += current[2];
        g.lineTo(x + l, y + t);
        break;
      case 'L':
        x = current[1];
        y = current[2];
        g.lineTo(x + l, y + t);
        break;
      case 'h':
        x += current[1];
        g.lineTo(x + l, y + t);
        break;
      case 'H':
        x = current[1];
        g.lineTo(x + l, y + t);
        break;
      case 'v':
        y += current[1];
        g.lineTo(x + l, y + t);
        break;
      case 'V':
        y = current[1];
        g.lineTo(x + l, y + t);
        break;
      case 'm':
        x += current[1];
        y += current[2];
        g.moveTo(x + l, y + t);
        break;
      case 'M':
        x = current[1];
        y = current[2];
        g.moveTo(x + l, y + t);
        break;
      case 'c':
        tempX = x + current[5];
        tempY = y + current[6];
        controlX = x + current[3];
        controlY = y + current[4];
        g.bezierCurveTo(
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
        g.bezierCurveTo(
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
        g.bezierCurveTo(
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
        g.bezierCurveTo(
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
        g.quadraticCurveTo(
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
        g.quadraticCurveTo(
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
        g.quadraticCurveTo(
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
        g.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;
      case 'a':
        drawArc(g, x + l, y + t, [
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
        drawArc(g, x + l, y + t, [
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
        g.closePath();
        break;
    }
    previous = current;
  }
};
function drawArc(g, x, y, coords) {
  var seg = arc.segments(
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
    var bez = arc.bezier(seg[i]);
    g.bezierCurveTo.apply(g, bez);
  }
}

var path = {
  parse:  parse,
  render: render
};

function create$1(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}
function remove(el) {
  if (!el) return;
  var p = el.parentNode;
  if (p) {
    p.removeChild(el);
    if (!p.childNodes || !p.childNodes.length) remove(p);
  }
}
var dom = {
  find: function(el, tag) {
    tag = tag.toLowerCase();
    for (var i=0, n=el.childNodes.length; i<n; ++i) {
      if (el.childNodes[i].tagName.toLowerCase() === tag) {
        return el.childNodes[i];
      }
    }
  },
  child: function(el, index, tag, ns, className, insert) {
    var a, b;
    a = b = el.childNodes[index];
    if (!a || insert ||
        a.tagName.toLowerCase() !== tag.toLowerCase() ||
        className && a.getAttribute('class') != className) {
      a = create$1(el.ownerDocument, tag, ns);
      el.insertBefore(a, b || null);
      if (className) a.setAttribute('class', className);
    }
    return a;
  },
  clear: function(el, index) {
    var curr = el.childNodes.length;
    while (curr > index) {
      el.removeChild(el.childNodes[--curr]);
    }
    return el;
  },
  remove: remove,
  cssClass: function(mark) {
    return 'mark-' + mark.marktype + (mark.name ? ' '+mark.name : '');
  },
  openTag: function(tag, attr, raw) {
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
  },
  closeTag: function(tag) {
    return '</' + tag + '>';
  }
};

function Handler() {
  this._active = null;
  this._handlers = {};
}
var prototype$6 = Handler.prototype;
prototype$6.initialize = function(el, pad, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.padding(pad);
};
prototype$6.element = function() {
  return this._el;
};
prototype$6.padding = function(pad) {
  this._padding = pad || {top:0, left:0, bottom:0, right:0};
  return this;
};
prototype$6.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};
prototype$6.on = function(                 ) {};
prototype$6.off = function(                 ) {};
prototype$6.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};
prototype$6.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};
var Handler_1 = Handler;

function drawPathOne(path, g, o, items) {
  if (path(g, items)) return;
  var opac = o.opacity == null ? 1 : o.opacity;
  if (opac===0) return;
  if (o.fill && fill(g, o, opac)) { g.fill(); }
  if (o.stroke && stroke(g, o, opac)) { g.stroke(); }
}
function drawPathAll(path, g, scene, bounds) {
  var i, len, item;
  for (i=0, len=scene.items.length; i<len; ++i) {
    item = scene.items[i];
    if (!bounds || bounds.intersects(item.bounds)) {
      drawPathOne(path, g, item, item);
    }
  }
}
function drawAll(pathFunc) {
  return function(g, scene, bounds) {
    drawPathAll(pathFunc, g, scene, bounds);
  };
}
function drawOne(pathFunc) {
  return function(g, scene, bounds) {
    if (!scene.items.length) return;
    if (!bounds || bounds.intersects(scene.bounds)) {
      drawPathOne(pathFunc, g, scene.items[0], scene.items);
    }
  };
}
var trueFunc = function() { return true; };
function pick(test) {
  if (!test) test = trueFunc;
  return function(g, scene, x, y, gx, gy) {
    if (!scene.items.length) return null;
    var o, b, i;
    if (g.pixelratio != null && g.pixelratio !== 1) {
      x *= g.pixelratio;
      y *= g.pixelratio;
    }
    for (i=scene.items.length; --i >= 0;) {
      o = scene.items[i]; b = o.bounds;
      if ((b && !b.contains(gx, gy)) || !b) continue;
      if (test(g, o, x, y, gx, gy)) return o;
    }
    return null;
  };
}
function testPath(path, filled) {
  return function(g, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && g.isPointInStroke, lw, lc;
    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      g.lineWidth = lw != null ? lw : 1;
      g.lineCap   = lc != null ? lc : 'butt';
    }
    return path(g, o) ? false :
      (fill && g.isPointInPath(x, y)) ||
      (stroke && g.isPointInStroke(x, y));
  };
}
function pickPath(path) {
  return pick(testPath(path));
}
function fill(g, o, opacity) {
  opacity *= (o.fillOpacity==null ? 1 : o.fillOpacity);
  if (opacity > 0) {
    g.globalAlpha = opacity;
    g.fillStyle = color(g, o, o.fill);
    return true;
  } else {
    return false;
  }
}
function stroke(g, o, opacity) {
  var lw = (lw = o.strokeWidth) != null ? lw : 1, lc;
  if (lw <= 0) return false;
  opacity *= (o.strokeOpacity==null ? 1 : o.strokeOpacity);
  if (opacity > 0) {
    g.globalAlpha = opacity;
    g.strokeStyle = color(g, o, o.stroke);
    g.lineWidth = lw;
    g.lineCap = (lc = o.strokeCap) != null ? lc : 'butt';
    g.vgLineDash(o.strokeDash || null);
    g.vgLineDashOffset(o.strokeDashOffset || 0);
    return true;
  } else {
    return false;
  }
}
function color(g, o, value) {
  return (value.id) ?
    gradient(g, value, o.bounds) :
    value;
}
function gradient(g, p, b) {
  var w = b.width(),
      h = b.height(),
      x1 = b.x1 + p.x1 * w,
      y1 = b.y1 + p.y1 * h,
      x2 = b.x1 + p.x2 * w,
      y2 = b.y1 + p.y2 * h,
      grad = g.createLinearGradient(x1, y1, x2, y2),
      stop = p.stops,
      i, n;
  for (i=0, n=stop.length; i<n; ++i) {
    grad.addColorStop(stop[i].offset, stop[i].color);
  }
  return grad;
}
var util$2 = {
  drawOne:  drawOne,
  drawAll:  drawAll,
  pick:     pick,
  pickPath: pickPath,
  testPath: testPath,
  stroke:   stroke,
  fill:     fill,
  color:    color,
  gradient: gradient
};

var halfpi = Math.PI / 2;
function path$1(g, o) {
  var x = o.x || 0,
      y = o.y || 0,
      ir = o.innerRadius || 0,
      or = o.outerRadius || 0,
      sa = (o.startAngle || 0) - halfpi,
      ea = (o.endAngle || 0) - halfpi;
  g.beginPath();
  if (ir === 0) g.moveTo(x, y);
  else g.arc(x, y, ir, sa, ea, 0);
  g.arc(x, y, or, ea, sa, 1);
  g.closePath();
}
var arc$1 = {
  draw: util$2.drawAll(path$1),
  pick: util$2.pickPath(path$1)
};

var d3_svg = d3.svg;
function x(o)     { return o.x || 0; }
function y(o)     { return o.y || 0; }
function xw(o)    { return (o.x || 0) + (o.width || 0); }
function yh(o)    { return (o.y || 0) + (o.height || 0); }
function size(o)  { return o.size == null ? 100 : o.size; }
function shape(o) { return o.shape || 'circle'; }
var areav = d3_svg.area().x(x).y1(y).y0(yh),
    areah = d3_svg.area().y(y).x1(x).x0(xw),
    line  = d3_svg.line().x(x).y(y);
var svg = {
  metadata: {
    'version': '1.1',
    'xmlns': 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink'
  },
  path: {
    arc: d3_svg.arc(),
    symbol: d3_svg.symbol().type(shape).size(size),
    area: function(items) {
      var o = items[0];
      return (o.orient === 'horizontal' ? areah : areav)
        .interpolate(o.interpolate || 'linear')
        .tension(o.tension || 0.7)
        (items);
    },
    line: function(items) {
      var o = items[0];
      return line
        .interpolate(o.interpolate || 'linear')
        .tension(o.tension || 0.7)
        (items);
    },
    resize: function(pathStr, size) {
      var path = parse(pathStr),
          newPath = '',
          command, current, index, i, n, j, m;
      size = Math.sqrt(size);
      for (i=0, n=path.length; i<n; ++i) {
        for (command=path[i], j=0, m=command.length; j<m; ++j) {
          if (command[j] === 'Z') break;
          if ((current = +command[j]) === current) {
            index = pathStr.indexOf(current);
            newPath += pathStr.substring(0, index) + (current * size);
            pathStr  = pathStr.substring(index + (current+'').length);
          }
        }
      }
      return newPath + 'Z';
    }
  },
  symbolTypes: datalib.toMap(d3_svg.symbolTypes),
  textAlign: {
    'left':   'start',
    'center': 'middle',
    'right':  'end'
  },
  textBaseline: {
    'top':    'before-edge',
    'bottom': 'after-edge',
    'middle': 'central'
  },
  styles: {
    'fill':             'fill',
    'fillOpacity':      'fill-opacity',
    'stroke':           'stroke',
    'strokeWidth':      'stroke-width',
    'strokeOpacity':    'stroke-opacity',
    'strokeCap':        'stroke-linecap',
    'strokeDash':       'stroke-dasharray',
    'strokeDashOffset': 'stroke-dashoffset',
    'opacity':          'opacity'
  },
  styleProperties: [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'strokeCap',
    'strokeDash',
    'strokeDashOffset',
    'opacity'
  ]
};

var areaPath = svg.path.area;
function path$2(g, items) {
  var o = items[0],
      p = o.pathCache || (o.pathCache = parse(areaPath(items)));
  render(g, p);
}
function pick$1(g, scene, x, y, gx, gy) {
  var items = scene.items,
      b = scene.bounds;
  if (!items || !items.length || b && !b.contains(gx, gy)) {
    return null;
  }
  if (g.pixelratio != null && g.pixelratio !== 1) {
    x *= g.pixelratio;
    y *= g.pixelratio;
  }
  return hit(g, items, x, y) ? items[0] : null;
}
var hit = util$2.testPath(path$2);
var area = {
  draw: util$2.drawOne(path$2),
  pick: pick$1,
  nested: true
};

var EMPTY = [];
function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;
  var groups = scene.items,
      renderer = this,
      group, items, axes, legends, gx, gy, w, h, opac, i, n, j, m;
  for (i=0, n=groups.length; i<n; ++i) {
    group = groups[i];
    axes = group.axisItems || EMPTY;
    items = group.items || EMPTY;
    legends = group.legendItems || EMPTY;
    gx = group.x || 0;
    gy = group.y || 0;
    w = group.width || 0;
    h = group.height || 0;
    if (group.stroke || group.fill) {
      opac = group.opacity == null ? 1 : group.opacity;
      if (opac > 0) {
        if (group.fill && util$2.fill(g, group, opac)) {
          g.fillRect(gx, gy, w, h);
        }
        if (group.stroke && util$2.stroke(g, group, opac)) {
          g.strokeRect(gx, gy, w, h);
        }
      }
    }
    g.save();
    g.translate(gx, gy);
    if (group.clip) {
      g.beginPath();
      g.rect(0, 0, w, h);
      g.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer === 'back') {
        renderer.draw(g, axes[j], bounds);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(g, items[j], bounds);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer !== 'back') {
        renderer.draw(g, axes[j], bounds);
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      renderer.draw(g, legends[j], bounds);
    }
    if (bounds) bounds.translate(gx, gy);
    g.restore();
  }
}
function pick$2(g, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy)) {
    return null;
  }
  var groups = scene.items || EMPTY, subscene,
      group, axes, items, legends, hits, dx, dy, i, j, b;
  for (i=groups.length; --i>=0;) {
    group = groups[i];
    b = group.bounds;
    if (b && !b.contains(gx, gy)) continue;
    axes = group.axisItems || EMPTY;
    items = group.items || EMPTY;
    legends = group.legendItems || EMPTY;
    dx = (group.x || 0);
    dy = (group.y || 0);
    g.save();
    g.translate(dx, dy);
    dx = gx - dx;
    dy = gy - dy;
    for (j=legends.length; --j>=0;) {
      subscene = legends[j];
      if (subscene.interactive !== false) {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    for (j=axes.length; --j>=0;) {
      subscene = axes[j];
      if (subscene.interactive !== false && subscene.layer !== 'back') {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    for (j=items.length; --j>=0;) {
      subscene = items[j];
      if (subscene.interactive !== false) {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    for (j=axes.length; --j>=0;) {
      subscene = axes[j];
      if (subscene.interative !== false && subscene.layer === 'back') {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    g.restore();
    if (scene.interactive !== false && (group.fill || group.stroke) &&
        dx >= 0 && dx <= group.width && dy >= 0 && dy <= group.height) {
      return group;
    }
  }
  return null;
}
var group = {
  draw: draw,
  pick: pick$2
};

function draw$1(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;
  var renderer = this,
      items = scene.items, o;
  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue;
    if (!(o.image && o.image.url === o.url)) {
      o.image = renderer.loadImage(o.url);
      o.image.url = o.url;
    }
    var x = o.x || 0,
        y = o.y || 0,
        w = o.width || (o.image && o.image.width) || 0,
        h = o.height || (o.image && o.image.height) || 0,
        opac;
    x = x - (o.align==='center' ? w/2 : o.align==='right' ? w : 0);
    y = y - (o.baseline==='middle' ? h/2 : o.baseline==='bottom' ? h : 0);
    if (o.image.loaded) {
      g.globalAlpha = (opac = o.opacity) != null ? opac : 1;
      g.drawImage(o.image, x, y, w, h);
    }
  }
}
var image = {
  draw: draw$1,
  pick: util$2.pick()
};

var linePath = svg.path.line;
function path$3(g, items) {
  var o = items[0],
      p = o.pathCache || (o.pathCache = parse(linePath(items)));
  render(g, p);
}
function pick$3(g, scene, x, y, gx, gy) {
  var items = scene.items,
      b = scene.bounds;
  if (!items || !items.length || b && !b.contains(gx, gy)) {
    return null;
  }
  if (g.pixelratio != null && g.pixelratio !== 1) {
    x *= g.pixelratio;
    y *= g.pixelratio;
  }
  return hit$1(g, items, x, y) ? items[0] : null;
}
var hit$1 = util$2.testPath(path$3, false);
var line$1 = {
  draw: util$2.drawOne(path$3),
  pick: pick$3,
  nested: true
};

function path$4(g, o) {
  if (o.path == null) return true;
  var p = o.pathCache || (o.pathCache = parse(o.path));
  render(g, p, o.x, o.y);
}
var path_1$1 = {
  draw: util$2.drawAll(path$4),
  pick: util$2.pickPath(path$4)
};

function draw$2(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;
  var items = scene.items,
      o, opac, x, y, w, h;
  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue;
    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;
    x = o.x || 0;
    y = o.y || 0;
    w = o.width || 0;
    h = o.height || 0;
    if (o.fill && util$2.fill(g, o, opac)) {
      g.fillRect(x, y, w, h);
    }
    if (o.stroke && util$2.stroke(g, o, opac)) {
      g.strokeRect(x, y, w, h);
    }
  }
}
var rect = {
  draw: draw$2,
  pick: util$2.pick()
};

function draw$3(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;
  var items = scene.items,
      o, opac, x1, y1, x2, y2;
  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue;
    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;
    x1 = o.x || 0;
    y1 = o.y || 0;
    x2 = o.x2 != null ? o.x2 : x1;
    y2 = o.y2 != null ? o.y2 : y1;
    if (o.stroke && util$2.stroke(g, o, opac)) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
  }
}
function stroke$1(g, o) {
  var x1 = o.x || 0,
      y1 = o.y || 0,
      x2 = o.x2 != null ? o.x2 : x1,
      y2 = o.y2 != null ? o.y2 : y1,
      lw = o.strokeWidth,
      lc = o.strokeCap;
  g.lineWidth = lw != null ? lw : 1;
  g.lineCap   = lc != null ? lc : 'butt';
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
}
function hit$2(g, o, x, y) {
  if (!g.isPointInStroke) return false;
  stroke$1(g, o);
  return g.isPointInStroke(x, y);
}
var rule$1 = {
  draw: draw$3,
  pick: util$2.pick(hit$2)
};

var sqrt3 = Math.sqrt(3),
    tan30 = Math.tan(30 * Math.PI / 180);
function path$5(g, o) {
  var size = o.size != null ? o.size : 100,
      x = o.x, y = o.y, r, t, rx, ry;
  g.beginPath();
  if (o.shape == null || o.shape === 'circle') {
    r = Math.sqrt(size / Math.PI);
    g.arc(x, y, r, 0, 2*Math.PI, 0);
    g.closePath();
    return;
  }
  switch (o.shape) {
    case 'cross':
      r = Math.sqrt(size / 5) / 2;
      t = 3*r;
      g.moveTo(x-t, y-r);
      g.lineTo(x-r, y-r);
      g.lineTo(x-r, y-t);
      g.lineTo(x+r, y-t);
      g.lineTo(x+r, y-r);
      g.lineTo(x+t, y-r);
      g.lineTo(x+t, y+r);
      g.lineTo(x+r, y+r);
      g.lineTo(x+r, y+t);
      g.lineTo(x-r, y+t);
      g.lineTo(x-r, y+r);
      g.lineTo(x-t, y+r);
      break;
    case 'diamond':
      ry = Math.sqrt(size / (2 * tan30));
      rx = ry * tan30;
      g.moveTo(x, y-ry);
      g.lineTo(x+rx, y);
      g.lineTo(x, y+ry);
      g.lineTo(x-rx, y);
      break;
    case 'square':
      t = Math.sqrt(size);
      r = t / 2;
      g.rect(x-r, y-r, t, t);
      break;
    case 'triangle-down':
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      g.moveTo(x, y+ry);
      g.lineTo(x+rx, y-ry);
      g.lineTo(x-rx, y-ry);
      break;
    case 'triangle-up':
      rx = Math.sqrt(size / sqrt3);
      ry = rx * sqrt3 / 2;
      g.moveTo(x, y-ry);
      g.lineTo(x+rx, y+ry);
      g.lineTo(x-rx, y+ry);
      break;
    default:
      var pathArray = resize(parse(o.shape), size);
      render(g, pathArray, x, y);
  }
  g.closePath();
}
function resize(path, size) {
  var sz = Math.sqrt(size),
      i, n, j, m, curr;
  for (i=0, n=path.length; i<n; ++i) {
    for (curr=path[i], j=1, m=curr.length; j<m; ++j) {
      curr[j] *= sz;
    }
  }
  return path;
}
var symbol = {
  draw: util$2.drawAll(path$5),
  pick: util$2.pickPath(path$5)
};

function Bounds(b) {
  this.clear();
  if (b) this.union(b);
}
var prototype$7 = Bounds.prototype;
prototype$7.clone = function() {
  return new Bounds(this);
};
prototype$7.clear = function() {
  this.x1 = +Number.MAX_VALUE;
  this.y1 = +Number.MAX_VALUE;
  this.x2 = -Number.MAX_VALUE;
  this.y2 = -Number.MAX_VALUE;
  return this;
};
prototype$7.set = function(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  return this;
};
prototype$7.add = function(x, y) {
  if (x < this.x1) this.x1 = x;
  if (y < this.y1) this.y1 = y;
  if (x > this.x2) this.x2 = x;
  if (y > this.y2) this.y2 = y;
  return this;
};
prototype$7.expand = function(d) {
  this.x1 -= d;
  this.y1 -= d;
  this.x2 += d;
  this.y2 += d;
  return this;
};
prototype$7.round = function() {
  this.x1 = Math.floor(this.x1);
  this.y1 = Math.floor(this.y1);
  this.x2 = Math.ceil(this.x2);
  this.y2 = Math.ceil(this.y2);
  return this;
};
prototype$7.translate = function(dx, dy) {
  this.x1 += dx;
  this.x2 += dx;
  this.y1 += dy;
  this.y2 += dy;
  return this;
};
prototype$7.rotate = function(angle, x, y) {
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
prototype$7.union = function(b) {
  if (b.x1 < this.x1) this.x1 = b.x1;
  if (b.y1 < this.y1) this.y1 = b.y1;
  if (b.x2 > this.x2) this.x2 = b.x2;
  if (b.y2 > this.y2) this.y2 = b.y2;
  return this;
};
prototype$7.encloses = function(b) {
  return b && (
    this.x1 <= b.x1 &&
    this.x2 >= b.x2 &&
    this.y1 <= b.y1 &&
    this.y2 >= b.y2
  );
};
prototype$7.alignsWith = function(b) {
  return b && (
    this.x1 == b.x1 ||
    this.x2 == b.x2 ||
    this.y1 == b.y1 ||
    this.y2 == b.y2
  );
};
prototype$7.intersects = function(b) {
  return b && !(
    this.x2 < b.x1 ||
    this.x1 > b.x2 ||
    this.y2 < b.y1 ||
    this.y1 > b.y2
  );
};
prototype$7.contains = function(x, y) {
  return !(
    x < this.x1 ||
    x > this.x2 ||
    y < this.y1 ||
    y > this.y2
  );
};
prototype$7.width = function() {
  return this.x2 - this.x1;
};
prototype$7.height = function() {
  return this.y2 - this.y1;
};
var Bounds_1 = Bounds;

var BoundsContext = function(b) {
  function noop() { }
  function add(x,y) { b.add(x, y); }
  return {
    bounds: function(_) {
      if (!arguments.length) return b;
      return (b = _, this);
    },
    beginPath: noop,
    closePath: noop,
    moveTo: add,
    lineTo: add,
    quadraticCurveTo: function(x1, y1, x2, y2) {
      b.add(x1, y1);
      b.add(x2, y2);
    },
    bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
      b.add(x1, y1);
      b.add(x2, y2);
      b.add(x3, y3);
    }
  };
};

function instance(w, h) {
  w = w || 1;
  h = h || 1;
  var canvas;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  } else {
    var Canvas = require('canvas');
    if (!Canvas.prototype) return null;
    canvas = new Canvas(w, h);
  }
  return lineDash(canvas);
}
function resize$1(canvas, w, h, p, retina) {
  var g = this._ctx = canvas.getContext('2d'),
      s = 1;
  canvas.width = w + p.left + p.right;
  canvas.height = h + p.top + p.bottom;
  if (retina && typeof HTMLElement !== 'undefined' &&
      canvas instanceof HTMLElement)
  {
    g.pixelratio = (s = pixelRatio(canvas) || 1);
  }
  g.setTransform(s, 0, 0, s, s*p.left, s*p.top);
  return canvas;
}
function pixelRatio(canvas) {
  var g = canvas.getContext('2d');
  var devicePixelRatio = window && window.devicePixelRatio || 1,
      backingStoreRatio = (
        g.webkitBackingStorePixelRatio ||
        g.mozBackingStorePixelRatio ||
        g.msBackingStorePixelRatio ||
        g.oBackingStorePixelRatio ||
        g.backingStorePixelRatio) || 1,
      ratio = devicePixelRatio / backingStoreRatio;
  if (devicePixelRatio !== backingStoreRatio) {
    var w = canvas.width,
        h = canvas.height;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
  return ratio;
}
function lineDash(canvas) {
  var g = canvas.getContext('2d');
  if (g.vgLineDash) return;
  var NOOP = function() {},
      NODASH = [];
  if (g.setLineDash) {
    g.vgLineDash = function(dash) { this.setLineDash(dash || NODASH); };
    g.vgLineDashOffset = function(off) { this.lineDashOffset = off; };
  } else if (g.webkitLineDash !== undefined) {
  	g.vgLineDash = function(dash) { this.webkitLineDash = dash || NODASH; };
    g.vgLineDashOffset = function(off) { this.webkitLineDashOffset = off; };
  } else if (g.mozDash !== undefined) {
    g.vgLineDash = function(dash) { this.mozDash = dash; };
    g.vgLineDashOffset = NOOP;
  } else {
    g.vgLineDash = NOOP;
    g.vgLineDashOffset = NOOP;
  }
  return canvas;
}
var canvas = {
  instance:   instance,
  resize:     resize$1,
  lineDash:   lineDash
};

function size$1(item) {
  return item.fontSize != null ? item.fontSize : 11;
}
var text = {
  size: size$1,
  value: function(s) {
    return s != null ? String(s) : '';
  },
  font: function(item, quote) {
    var font = item.font;
    if (quote && font) {
      font = String(font).replace(/\"/g, '\'');
    }
    return '' +
      (item.fontStyle ? item.fontStyle + ' ' : '') +
      (item.fontVariant ? item.fontVariant + ' ' : '') +
      (item.fontWeight ? item.fontWeight + ' ' : '') +
      size$1(item) + 'px ' +
      (font || 'sans-serif');
  },
  offset: function(item) {
    var baseline = item.baseline,
        h = size$1(item);
    return Math.round(
      baseline === 'top'    ?  0.93*h :
      baseline === 'middle' ?  0.30*h :
      baseline === 'bottom' ? -0.21*h : 0
    );
  }
};

var parse$1 = path.parse,
    drawPath = path.render,
    areaPath$1 = svg.path.area,
    linePath$1 = svg.path.line,
    halfpi$1 = Math.PI / 2,
    sqrt3$1 = Math.sqrt(3),
    tan30$1 = Math.tan(30 * Math.PI / 180),
    g2D = null,
    bc = BoundsContext();
function context() {
  return g2D || (g2D = canvas.instance(1,1).getContext('2d'));
}
function strokeBounds(o, bounds) {
  if (o.stroke && o.opacity !== 0 && o.stokeOpacity !== 0) {
    bounds.expand(o.strokeWidth != null ? o.strokeWidth : 1);
  }
  return bounds;
}
function pathBounds(o, path$$1, bounds, x, y) {
  if (path$$1 == null) {
    bounds.set(0, 0, 0, 0);
  } else {
    drawPath(bc.bounds(bounds), path$$1, x, y);
    strokeBounds(o, bounds);
  }
  return bounds;
}
function path$6(o, bounds) {
  var p = o.path ? o.pathCache || (o.pathCache = parse$1(o.path)) : null;
  return pathBounds(o, p, bounds, o.x, o.y);
}
function area$1(mark, bounds) {
  if (mark.items.length === 0) return bounds;
  var items = mark.items,
      item = items[0],
      p = item.pathCache || (item.pathCache = parse$1(areaPath$1(items)));
  return pathBounds(item, p, bounds);
}
function line$2(mark, bounds) {
  if (mark.items.length === 0) return bounds;
  var items = mark.items,
      item = items[0],
      p = item.pathCache || (item.pathCache = parse$1(linePath$1(items)));
  return pathBounds(item, p, bounds);
}
function rect$1(o, bounds) {
  var x, y;
  return strokeBounds(o, bounds.set(
    x = o.x || 0,
    y = o.y || 0,
    (x + o.width) || 0,
    (y + o.height) || 0
  ));
}
function image$1(o, bounds) {
  var x = o.x || 0,
      y = o.y || 0,
      w = o.width || 0,
      h = o.height || 0;
  x = x - (o.align === 'center' ? w/2 : (o.align === 'right' ? w : 0));
  y = y - (o.baseline === 'middle' ? h/2 : (o.baseline === 'bottom' ? h : 0));
  return bounds.set(x, y, x+w, y+h);
}
function rule$2(o, bounds) {
  var x1, y1;
  return strokeBounds(o, bounds.set(
    x1 = o.x || 0,
    y1 = o.y || 0,
    o.x2 != null ? o.x2 : x1,
    o.y2 != null ? o.y2 : y1
  ));
}
function arc$2(o, bounds) {
  var cx = o.x || 0,
      cy = o.y || 0,
      ir = o.innerRadius || 0,
      or = o.outerRadius || 0,
      sa = (o.startAngle || 0) - halfpi$1,
      ea = (o.endAngle || 0) - halfpi$1,
      xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      a, i, n, x, y, ix, iy, ox, oy;
  var angles = [sa, ea],
      s = sa - (sa % halfpi$1);
  for (i=0; i<4 && s<ea; ++i, s+=halfpi$1) {
    angles.push(s);
  }
  for (i=0, n=angles.length; i<n; ++i) {
    a = angles[i];
    x = Math.cos(a); ix = ir*x; ox = or*x;
    y = Math.sin(a); iy = ir*y; oy = or*y;
    xmin = Math.min(xmin, ix, ox);
    xmax = Math.max(xmax, ix, ox);
    ymin = Math.min(ymin, iy, oy);
    ymax = Math.max(ymax, iy, oy);
  }
  return strokeBounds(o, bounds.set(
    cx + xmin,
    cy + ymin,
    cx + xmax,
    cy + ymax
  ));
}
function symbol$1(o, bounds) {
  var size = o.size != null ? o.size : 100,
      x = o.x || 0,
      y = o.y || 0,
      r, t, rx, ry;
  switch (o.shape) {
    case 'cross':
      t = 3 * Math.sqrt(size / 5) / 2;
      bounds.set(x-t, y-t, x+t, y+t);
      break;
    case 'diamond':
      ry = Math.sqrt(size / (2 * tan30$1));
      rx = ry * tan30$1;
      bounds.set(x-rx, y-ry, x+rx, y+ry);
      break;
    case 'square':
      t = Math.sqrt(size);
      r = t / 2;
      bounds.set(x-r, y-r, x+r, y+r);
      break;
    case 'triangle-down':
      rx = Math.sqrt(size / sqrt3$1);
      ry = rx * sqrt3$1 / 2;
      bounds.set(x-rx, y-ry, x+rx, y+ry);
      break;
    case 'triangle-up':
      rx = Math.sqrt(size / sqrt3$1);
      ry = rx * sqrt3$1 / 2;
      bounds.set(x-rx, y-ry, x+rx, y+ry);
      break;
    default:
      r = Math.sqrt(size/Math.PI);
      bounds.set(x-r, y-r, x+r, y+r);
  }
  return strokeBounds(o, bounds);
}
function textMark(o, bounds, noRotate) {
  var g = context(),
      h = text.size(o),
      a = o.align,
      r = o.radius || 0,
      x = (o.x || 0),
      y = (o.y || 0),
      dx = (o.dx || 0),
      dy = (o.dy || 0) + text.offset(o) - Math.round(0.8*h),
      w, t;
  if (r) {
    t = (o.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }
  g.font = text.font(o);
  w = g.measureText(text.value(o.text)).width;
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  }
  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (o.angle && !noRotate) {
    bounds.rotate(o.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate ? 0 : 1);
}
function group$1(g, bounds, includeLegends) {
  var axes = g.axisItems || [],
      items = g.items || [],
      legends = g.legendItems || [],
      j, m;
  if (!g.clip) {
    for (j=0, m=axes.length; j<m; ++j) {
      bounds.union(axes[j].bounds);
    }
    for (j=0, m=items.length; j<m; ++j) {
      if (items[j].bounds) bounds.union(items[j].bounds);
    }
    if (includeLegends) {
      for (j=0, m=legends.length; j<m; ++j) {
        bounds.union(legends[j].bounds);
      }
    }
  }
  if (g.clip || g.width || g.height) {
    strokeBounds(g, bounds
      .add(0, 0)
      .add(g.width || 0, g.height || 0));
  }
  return bounds.translate(g.x || 0, g.y || 0);
}
var methods = {
  group:  group$1,
  symbol: symbol$1,
  image:  image$1,
  rect:   rect$1,
  rule:   rule$2,
  arc:    arc$2,
  text:   textMark,
  path:   path$6,
  area:   area$1,
  line:   line$2
};
methods.area.nest = true;
methods.line.nest = true;
function itemBounds(item, func, opt) {
  var type = item.mark.marktype;
  func = func || methods[type];
  if (func.nest) item = item.mark;
  var curr = item.bounds,
      prev = item['bounds:prev'] || (item['bounds:prev'] = new Bounds_1());
  if (curr) {
    prev.clear().union(curr);
    curr.clear();
  } else {
    item.bounds = new Bounds_1();
  }
  func(item, item.bounds, opt);
  if (!curr) prev.clear().union(item.bounds);
  return item.bounds;
}
var DUMMY_ITEM = {mark: null};
function markBounds(mark, bounds, opt) {
  var type  = mark.marktype,
      func  = methods[type],
      items = mark.items,
      hasi  = items && items.length,
      i, n, o, b;
  if (func.nest) {
    o = hasi ? items[0]
      : (DUMMY_ITEM.mark = mark, DUMMY_ITEM);
    b = itemBounds(o, func, opt);
    bounds = bounds && bounds.union(b) || b;
    return bounds;
  }
  bounds = bounds || mark.bounds && mark.bounds.clear() || new Bounds_1();
  if (hasi) {
    for (i=0, n=items.length; i<n; ++i) {
      bounds.union(itemBounds(items[i], func, opt));
    }
  }
  return (mark.bounds = bounds);
}
var bound = {
  mark:  markBounds,
  item:  itemBounds,
  text:  textMark,
  group: group$1
};

var textBounds = bound.text,
    tempBounds = new Bounds_1();
function draw$4(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;
  var items = scene.items,
      o, opac, x, y, r, t, str;
  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue;
    str = text.value(o.text);
    if (!str) continue;
    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;
    g.font = text.font(o);
    g.textAlign = o.align || 'left';
    x = (o.x || 0);
    y = (o.y || 0);
    if ((r = o.radius)) {
      t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }
    if (o.angle) {
      g.save();
      g.translate(x, y);
      g.rotate(o.angle * Math.PI/180);
      x = y = 0;
    }
    x += (o.dx || 0);
    y += (o.dy || 0) + text.offset(o);
    if (o.fill && util$2.fill(g, o, opac)) {
      g.fillText(str, x, y);
    }
    if (o.stroke && util$2.stroke(g, o, opac)) {
      g.strokeText(str, x, y);
    }
    if (o.angle) g.restore();
  }
}
function hit$3(g, o, x, y, gx, gy) {
  if (o.fontSize <= 0) return false;
  if (!o.angle) return true;
  var b = textBounds(o, tempBounds, true),
      a = -o.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ox = o.x,
      oy = o.y,
      px = cos*gx - sin*gy + (ox - ox*cos + oy*sin),
      py = sin*gx + cos*gy + (oy - ox*sin - oy*cos);
  return b.contains(px, py);
}
var text_1$1 = {
  draw: draw$4,
  pick: util$2.pick(hit$3)
};

var marks = {
  arc:    arc$1,
  area:   area,
  group:  group,
  image:  image,
  line:   line$1,
  path:   path_1$1,
  rect:   rect,
  rule:   rule$1,
  symbol: symbol,
  text:   text_1$1
};

function CanvasHandler() {
  Handler_1.call(this);
  this._down = null;
  this._touch = null;
  this._first = true;
}
var base = Handler_1.prototype;
var prototype$8 = (CanvasHandler.prototype = Object.create(base));
prototype$8.constructor = CanvasHandler;
prototype$8.initialize = function(el, pad, obj) {
  var canvas = this._canvas = dom.find(el, 'canvas');
  if (canvas) {
    var that = this;
    this.events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        if (prototype$8[type]) {
          prototype$8[type].call(that, evt);
        } else {
          that.fire(type, evt);
        }
      });
    });
  }
  return base.initialize.call(this, el, pad, obj);
};
prototype$8.canvas = function() {
  return this._canvas;
};
prototype$8.context = function() {
  return this._canvas.getContext('2d');
};
prototype$8.events = [
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
prototype$8.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};
function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    var a = this._active,
        p = this.pickEvent(evt);
    if (p === a) {
      this.fire(moveEvent, evt);
    } else {
      this.fire(outEvent, evt);
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
prototype$8.mousemove = move('mousemove', 'mouseover', 'mouseout');
prototype$8.dragover  = move('dragover', 'dragenter', 'dragleave');
prototype$8.mouseout  = inactive('mouseout');
prototype$8.dragleave = inactive('dragleave');
prototype$8.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};
prototype$8.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};
prototype$8.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);
  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }
  this.fire('touchstart', evt, true);
};
prototype$8.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};
prototype$8.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};
prototype$8.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;
  if (h) {
    evt.vegaType = type;
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};
prototype$8.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers;
  (h[name] || (h[name] = [])).push({
    type: type,
    handler: handler
  });
  return this;
};
prototype$8.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type !== type) continue;
    if (!handler || h[i].handler === handler) h.splice(i, 1);
  }
  return this;
};
prototype$8.pickEvent = function(evt) {
  var rect = this._canvas.getBoundingClientRect(),
      pad = this._padding, x, y;
  return this.pick(this._scene,
    x = (evt.clientX - rect.left),
    y = (evt.clientY - rect.top),
    x - pad.left, y - pad.top);
};
prototype$8.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};
var CanvasHandler_1 = CanvasHandler;

function ImageLoader(loadConfig) {
  this._pending = 0;
  this._config = loadConfig || ImageLoader.Config;
}
ImageLoader.Config = null;
var prototype$9 = ImageLoader.prototype;
prototype$9.pending = function() {
  return this._pending;
};
prototype$9.params = function(uri) {
  var p = {url: uri}, k;
  for (k in this._config) { p[k] = this._config[k]; }
  return p;
};
prototype$9.imageURL = function(uri) {
  return load.sanitizeUrl(this.params(uri));
};
function browser(uri, callback) {
  var url = load.sanitizeUrl(this.params(uri));
  if (!url) {
    if (callback) callback(uri, null);
    return null;
  }
  var loader = this,
      image = new Image();
  loader._pending += 1;
  image.onload = function() {
    loader._pending -= 1;
    image.loaded = true;
    if (callback) callback(null, image);
  };
  image.src = url;
  return image;
}
function server(uri, callback) {
  var loader = this,
      image = new (require('canvas').Image)();
  loader._pending += 1;
  load(this.params(uri), function(err, data) {
    loader._pending -= 1;
    if (err) {
      if (callback) callback(err, null);
      return null;
    }
    image.src = data;
    image.loaded = true;
    if (callback) callback(null, image);
  });
  return image;
}
prototype$9.loadImage = function(uri, callback) {
  return load.useXHR ?
    browser.call(this, uri, callback) :
    server.call(this, uri, callback);
};
var ImageLoader_1 = ImageLoader;

function Renderer() {
  this._el = null;
  this._bgcolor = null;
}
var prototype$a = Renderer.prototype;
prototype$a.initialize = function(el, width, height, padding) {
  this._el = el;
  return this.resize(width, height, padding);
};
prototype$a.element = function() {
  return this._el;
};
prototype$a.scene = function() {
  return this._el && this._el.firstChild;
};
prototype$a.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};
prototype$a.resize = function(width, height, padding) {
  this._width = width;
  this._height = height;
  this._padding = padding || {top:0, left:0, bottom:0, right:0};
  return this;
};
prototype$a.render = function(                ) {
  return this;
};
var Renderer_1 = Renderer;

function CanvasRenderer(loadConfig) {
  Renderer_1.call(this);
  this._loader = new ImageLoader_1(loadConfig);
}
CanvasRenderer.RETINA = true;
var base$1 = Renderer_1.prototype;
var prototype$b = (CanvasRenderer.prototype = Object.create(base$1));
prototype$b.constructor = CanvasRenderer;
prototype$b.initialize = function(el, width, height, padding) {
  this._canvas = canvas.instance(width, height);
  if (el) {
    dom.clear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  return base$1.initialize.call(this, el, width, height, padding);
};
prototype$b.resize = function(width, height, padding) {
  base$1.resize.call(this, width, height, padding);
  canvas.resize(this._canvas, this._width, this._height,
    this._padding, CanvasRenderer.RETINA);
  return this;
};
prototype$b.canvas = function() {
  return this._canvas;
};
prototype$b.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};
prototype$b.pendingImages = function() {
  return this._loader.pending();
};
function clipToBounds(g, items) {
  if (!items) return null;
  var b = new Bounds_1(), i, n, item, mark, group;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    group = mark.group;
    item = marks[mark.marktype].nested ? mark : item;
    b.union(translate(item.bounds, group));
    if (item['bounds:prev']) {
      b.union(translate(item['bounds:prev'], group));
    }
  }
  b.round();
  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();
  return b;
}
function translate(bounds, group) {
  if (group == null) return bounds;
  var b = bounds.clone();
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}
prototype$b.render = function(scene, items) {
  var g = this.context(),
      p = this._padding,
      w = this._width + p.left + p.right,
      h = this._height + p.top + p.bottom,
      b;
  this._scene = scene;
  g.save();
  b = clipToBounds(g, items);
  this.clear(-p.left, -p.top, w, h);
  this.draw(g, scene, b);
  g.restore();
  this._scene = null;
  return this;
};
prototype$b.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  mark.draw.call(this, ctx, scene, bounds);
};
prototype$b.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h);
  }
};
prototype$b.loadImage = function(uri) {
  var renderer = this,
      scene = this._scene;
  return this._loader.loadImage(uri, function() {
    renderer.renderAsync(scene);
  });
};
prototype$b.renderAsync = function(scene) {
  var renderer = this;
  if (renderer._async_id) {
    clearTimeout(renderer._async_id);
  }
  renderer._async_id = setTimeout(function() {
    renderer.render(scene);
    delete renderer._async_id;
  }, 10);
};
var CanvasRenderer_1 = CanvasRenderer;

var canvas$1 = {
  Handler:  CanvasHandler_1,
  Renderer: CanvasRenderer_1
};

function SVGHandler() {
  Handler_1.call(this);
}
var base$2 = Handler_1.prototype;
var prototype$c = (SVGHandler.prototype = Object.create(base$2));
prototype$c.constructor = SVGHandler;
prototype$c.initialize = function(el, pad, obj) {
  this._svg = dom.find(el, 'svg');
  return base$2.initialize.call(this, el, pad, obj);
};
prototype$c.svg = function() {
  return this._svg;
};
prototype$c.listener = function(handler) {
  var that = this;
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(that._obj, evt, item);
  };
};
prototype$c.on = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: this.listener(handler)
      };
  (h[name] || (h[name] = [])).push(x);
  svg.addEventListener(name, x.listener);
  return this;
};
prototype$c.off = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      svg.removeEventListener(name, h[i].listener);
      h.splice(i, 1);
    }
  }
  return this;
};
var SVGHandler_1 = SVGHandler;

var symbolTypes = svg.symbolTypes,
    textAlign = svg.textAlign,
    path$7 = svg.path;
function translateItem(o) {
  return translate$1(o.x || 0, o.y || 0);
}
function translate$1(x, y) {
  return 'translate(' + x + ',' + y + ')';
}
var marks$1 = {
  arc: {
    tag:  'path',
    type: 'arc',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', path$7.arc(o));
    }
  },
  area: {
    tag:  'path',
    type: 'area',
    nest: true,
    attr: function(emit, o) {
      var items = o.mark.items;
      if (items.length) emit('d', path$7.area(items));
    }
  },
  group: {
    tag:  'g',
    type: 'group',
    attr: function(emit, o, renderer) {
      var id = null, defs, c;
      emit('transform', translateItem(o));
      if (o.clip) {
        defs = renderer._defs;
        id = o.clip_id || (o.clip_id = 'clip' + defs.clip_id++);
        c = defs.clipping[id] || (defs.clipping[id] = {id: id});
        c.width = o.width || 0;
        c.height = o.height || 0;
      }
      emit('clip-path', id ? ('url(#' + id + ')') : null);
    },
    background: function(emit, o) {
      emit('class', 'background');
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  image: {
    tag:  'image',
    type: 'image',
    attr: function(emit, o, renderer) {
      var x = o.x || 0,
          y = o.y || 0,
          w = o.width || 0,
          h = o.height || 0,
          url = renderer.imageURL(o.url);
      x = x - (o.align === 'center' ? w/2 : o.align === 'right' ? w : 0);
      y = y - (o.baseline === 'middle' ? h/2 : o.baseline === 'bottom' ? h : 0);
      emit('href', url, 'http://www.w3.org/1999/xlink', 'xlink:href');
      emit('transform', translate$1(x, y));
      emit('width', w);
      emit('height', h);
    }
  },
  line: {
    tag:  'path',
    type: 'line',
    nest: true,
    attr: function(emit, o) {
      var items = o.mark.items;
      if (items.length) emit('d', path$7.line(items));
    }
  },
  path: {
    tag:  'path',
    type: 'path',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('d', o.path);
    }
  },
  rect: {
    tag:  'rect',
    type: 'rect',
    nest: false,
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('width', o.width || 0);
      emit('height', o.height || 0);
    }
  },
  rule: {
    tag:  'line',
    type: 'rule',
    attr: function(emit, o) {
      emit('transform', translateItem(o));
      emit('x2', o.x2 != null ? o.x2 - (o.x||0) : 0);
      emit('y2', o.y2 != null ? o.y2 - (o.y||0) : 0);
    }
  },
  symbol: {
    tag:  'path',
    type: 'symbol',
    attr: function(emit, o) {
      var pathStr = !o.shape || symbolTypes[o.shape] ?
        path$7.symbol(o) : path$7.resize(o.shape, o.size);
      emit('transform', translateItem(o));
      emit('d', pathStr);
    }
  },
  text: {
    tag:  'text',
    type: 'text',
    nest: false,
    attr: function(emit, o) {
      var dx = (o.dx || 0),
          dy = (o.dy || 0) + text.offset(o),
          x = (o.x || 0),
          y = (o.y || 0),
          a = o.angle || 0,
          r = o.radius || 0, t;
      if (r) {
        t = (o.theta || 0) - Math.PI/2;
        x += r * Math.cos(t);
        y += r * Math.sin(t);
      }
      emit('text-anchor', textAlign[o.align] || 'start');
      if (a) {
        t = translate$1(x, y) + ' rotate('+a+')';
        if (dx || dy) t += ' ' + translate$1(dx, dy);
      } else {
        t = translate$1(x+dx, y+dy);
      }
      emit('transform', t);
    }
  }
};

var ns = svg.metadata.xmlns;
function SVGRenderer(loadConfig) {
  Renderer_1.call(this);
  this._loader = new ImageLoader_1(loadConfig);
  this._dirtyID = 0;
}
var base$3 = Renderer_1.prototype;
var prototype$d = (SVGRenderer.prototype = Object.create(base$3));
prototype$d.constructor = SVGRenderer;
prototype$d.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = dom.child(el, 0, 'svg', ns, 'marks');
    dom.clear(el, 1);
    this._root = dom.child(this._svg, 0, 'g', ns);
    dom.clear(this._svg, 1);
  }
  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };
  this.background(this._bgcolor);
  return base$3.initialize.call(this, el, width, height, padding);
};
prototype$d.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base$3.background.apply(this, arguments);
};
prototype$d.resize = function(width, height, padding) {
  base$3.resize.call(this, width, height, padding);
  if (this._svg) {
    var w = this._width,
        h = this._height,
        p = this._padding;
    this._svg.setAttribute('width', w + p.left + p.right);
    this._svg.setAttribute('height', h + p.top + p.bottom);
    this._root.setAttribute('transform', 'translate('+p.left+','+p.top+')');
  }
  return this;
};
prototype$d.svg = function() {
  if (!this._svg) return null;
  var attr = {
    'class':  'marks',
    'width':  this._width + this._padding.left + this._padding.right,
    'height': this._height + this._padding.top + this._padding.bottom,
  };
  for (var key in svg.metadata) {
    attr[key] = svg.metadata[key];
  }
  return dom.openTag('svg', attr) + this._svg.innerHTML + dom.closeTag('svg');
};
prototype$d.imageURL = function(url) {
  return this._loader.imageURL(url);
};
prototype$d.render = function(scene, items) {
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene, -1);
    dom.clear(this._root, 1);
  }
  this.updateDefs();
  return this;
};
prototype$d.draw = function(el, scene, index) {
  this.drawMark(el, scene, index, marks$1[scene.marktype]);
};
prototype$d.updateDefs = function() {
  var svg$$1 = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id;
  for (id in defs.gradient) {
    if (!el) el = (defs.el = dom.child(svg$$1, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id], index++);
  }
  for (id in defs.clipping) {
    if (!el) el = (defs.el = dom.child(svg$$1, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id], index++);
  }
  if (el) {
    if (index === 0) {
      svg$$1.removeChild(el);
      defs.el = null;
    } else {
      dom.clear(el, index);
    }
  }
};
function updateGradient(el, grad, index) {
  var i, n, stop;
  el = dom.child(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);
  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = dom.child(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  dom.clear(el, i);
}
function updateClipping(el, clip, index) {
  var rect;
  el = dom.child(el, index, 'clipPath', ns);
  el.setAttribute('id', clip.id);
  rect = dom.child(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip.width);
  rect.setAttribute('height', clip.height);
}
prototype$d._resetDefs = function() {
  var def = this._defs;
  def.clip_id = 1;
  def.gradient = {};
  def.clipping = {};
};
prototype$d.isDirty = function(item) {
  return this._dirtyAll || item.dirty === this._dirtyID;
};
prototype$d._dirtyCheck = function(items) {
  this._dirtyAll = true;
  if (!items) return true;
  var id = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    if (mark.marktype !== type) {
      type = mark.marktype;
      mdef = marks$1[type];
    }
    if (item.status === 'exit') {
      if (item._svg) {
        if (mdef.nest && item.mark.items.length) {
          this._update(mdef, item._svg, item.mark.items[0]);
          o = item.mark.items[0];
          o._svg = item._svg;
          o._update = id;
        } else {
          dom.remove(item._svg);
        }
        item._svg = null;
      }
      continue;
    }
    item = (mdef.nest ? mark.items[0] : item);
    if (item._update === id) {
      continue;
    } else if (item._svg) {
      this._update(mdef, item._svg, item);
    } else {
      this._dirtyAll = false;
      dirtyParents(item, id);
    }
    item._update = id;
  }
  return !this._dirtyAll;
};
function dirtyParents(item, id) {
  for (; item && item.dirty !== id; item=item.mark.group) {
    item.dirty = id;
    if (item.mark && item.mark.dirty !== id) {
      item.mark.dirty = id;
    } else return;
  }
}
prototype$d.drawMark = function(el, scene, index, mdef) {
  if (!this.isDirty(scene)) return;
  var items = mdef.nest ?
        (scene.items && scene.items.length ? [scene.items[0]] : []) :
        scene.items || [],
      events = scene.interactive === false ? 'none' : null,
      isGroup = (mdef.tag === 'g'),
      className = dom.cssClass(scene),
      p, i, n, c, d, insert;
  p = dom.child(el, index+1, 'g', ns, className);
  p.setAttribute('class', className);
  scene._svg = p;
  if (!isGroup && events) {
    p.style.setProperty('pointer-events', events);
  }
  for (i=0, n=items.length; i<n; ++i) {
    if (this.isDirty(d = items[i])) {
      insert = !(this._dirtyAll || d._svg);
      c = bind(p, mdef, d, i, insert);
      this._update(mdef, c, d);
      if (isGroup) {
        if (insert) this._dirtyAll = true;
        this._recurse(c, d);
        if (insert) this._dirtyAll = false;
      }
    }
  }
  dom.clear(p, i);
  return p;
};
prototype$d._recurse = function(el, group) {
  var items = group.items || [],
      legends = group.legendItems || [],
      axes = group.axisItems || [],
      idx = 0, j, m;
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      this.drawMark(el, axes[j], idx++, marks$1.group);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    this.draw(el, items[j], idx++);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      this.drawMark(el, axes[j], idx++, marks$1.group);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    this.drawMark(el, legends[j], idx++, marks$1.group);
  }
  dom.clear(el, 1 + idx);
};
function bind(el, mdef, item, index, insert) {
  var node = dom.child(el, index, mdef.tag, ns, null, insert);
  node.__data__ = item;
  node.__values__ = {fill: 'default'};
  if (mdef.tag === 'g') {
    var bg = dom.child(node, 0, 'rect', ns, 'background');
    bg.__data__ = item;
  }
  return (item._svg = node);
}
var element = null,
    values = null;
var mark_extras = {
  group: function(mdef, el, item) {
    element = el.childNodes[0];
    values = el.__values__;
    mdef.background(emit, item, this);
    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      element.style.setProperty('pointer-events', value);
      values.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = text.value(item.text);
    if (str !== values.text) {
      el.textContent = str;
      values.text = str;
    }
    str = text.font(item);
    if (str !== values.font) {
      el.style.setProperty('font', str);
      values.font = str;
    }
  }
};
prototype$d._update = function(mdef, el, item) {
  element = el;
  values = el.__values__;
  mdef.attr(emit, item, this);
  var extra = mark_extras[mdef.type];
  if (extra) extra(mdef, el, item);
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
prototype$d.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;
  for (i=0, n=svg.styleProperties.length; i<n; ++i) {
    prop = svg.styleProperties[i];
    value = o[prop];
    if (value === values[prop]) continue;
    name = svg.styles[prop];
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
  return typeof window !== 'undefined' ? window.location.href : '';
}
var SVGRenderer_1 = SVGRenderer;

var openTag = dom.openTag,
    closeTag = dom.closeTag;
function SVGStringRenderer(loadConfig) {
  Renderer_1.call(this);
  this._loader = new ImageLoader_1(loadConfig);
  this._text = {
    head: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };
  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };
}
var base$4 = Renderer_1.prototype;
var prototype$e = (SVGStringRenderer.prototype = Object.create(base$4));
prototype$e.constructor = SVGStringRenderer;
prototype$e.resize = function(width, height, padding) {
  base$4.resize.call(this, width, height, padding);
  var p = this._padding,
      t = this._text;
  var attr = {
    'class':  'marks',
    'width':  this._width + p.left + p.right,
    'height': this._height + p.top + p.bottom,
  };
  for (var key in svg.metadata) {
    attr[key] = svg.metadata[key];
  }
  t.head = openTag('svg', attr);
  t.root = openTag('g', {
    transform: 'translate(' + p.left + ',' + p.top + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');
  return this;
};
prototype$e.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};
prototype$e.render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};
prototype$e.reset = function() {
  this._defs.clip_id = 0;
  return this;
};
prototype$e.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id, def, stops;
  for (id in all.gradient) {
    def = all.gradient[id];
    stops = def.stops;
    defs += openTag('linearGradient', {
      id: id,
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
  for (id in all.clipping) {
    def = all.clipping[id];
    defs += openTag('clipPath', {id: id});
    defs += openTag('rect', {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + closeTag('rect');
    defs += closeTag('clipPath');
  }
  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};
prototype$e.imageURL = function(url) {
  return this._loader.imageURL(url);
};
var object;
function emit$1(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}
prototype$e.attributes = function(attr, item) {
  object = {};
  attr(emit$1, item, this);
  return object;
};
prototype$e.mark = function(scene) {
  var mdef = marks$1[scene.marktype],
      tag  = mdef.tag,
      attr = mdef.attr,
      nest = mdef.nest || false,
      data = nest ?
          (scene.items && scene.items.length ? [scene.items[0]] : []) :
          (scene.items || []),
      defs = this._defs,
      str = '',
      style, i, item;
  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }
  str += openTag('g', {
    'class': dom.cssClass(scene)
  }, style);
  for (i=0; i<data.length; ++i) {
    item = data[i];
    style = (tag !== 'g') ? styles(item, scene, tag, defs) : null;
    str += openTag(tag, this.attributes(attr, item), style);
    if (tag === 'text') {
      str += escape_text(text.value(item.text));
    } else if (tag === 'g') {
      str += openTag('rect',
        this.attributes(mdef.background, item),
        styles(item, scene, 'bgrect', defs)) + closeTag('rect');
      str += this.markGroup(item);
    }
    str += closeTag(tag);
  }
  return str + closeTag('g');
};
prototype$e.markGroup = function(scene) {
  var str = '',
      axes = scene.axisItems || [],
      items = scene.items || [],
      legends = scene.legendItems || [],
      j, m;
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer === 'back') {
      str += this.mark(axes[j]);
    }
  }
  for (j=0, m=items.length; j<m; ++j) {
    str += this.mark(items[j]);
  }
  for (j=0, m=axes.length; j<m; ++j) {
    if (axes[j].layer !== 'back') {
      str += this.mark(axes[j]);
    }
  }
  for (j=0, m=legends.length; j<m; ++j) {
    str += this.mark(legends[j]);
  }
  return str;
};
function styles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';
  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }
  if (tag === 'text') {
    s += 'font: ' + text.font(o) + ';';
  }
  for (i=0, n=svg.styleProperties.length; i<n; ++i) {
    prop = svg.styleProperties[i];
    name = svg.styles[prop];
    value = o[prop];
    if (value == null) {
      if (name === 'fill') {
        s += (s.length ? ' ' : '') + 'fill: none;';
      }
    } else {
      if (value.id) {
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';';
    }
  }
  return s ? 'style="' + s + '"' : null;
}
function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}
var SVGStringRenderer_1 = SVGStringRenderer;

var svg$1 = {
  Handler:  SVGHandler_1,
  Renderer: SVGRenderer_1,
  string: {
    Renderer : SVGStringRenderer_1
  }
};

var render$1 = {
  'canvas': canvas$1,
  'svg':    svg$1
};

function Item(mark) {
  this.mark = mark;
}
var prototype$f = Item.prototype;
prototype$f.hasPropertySet = function(name) {
  var props = this.mark.def.properties;
  return props && props[name] != null;
};
prototype$f.cousin = function(offset, index) {
  if (offset === 0) return this;
  offset = offset || -1;
  var mark = this.mark,
      group = mark.group,
      iidx = index==null ? mark.items.indexOf(this) : index,
      midx = group.items.indexOf(mark) + offset;
  return group.items[midx].items[iidx];
};
prototype$f.sibling = function(offset) {
  if (offset === 0) return this;
  offset = offset || -1;
  var mark = this.mark,
      iidx = mark.items.indexOf(this) + offset;
  return mark.items[iidx];
};
prototype$f.remove = function() {
  var item = this,
      list = item.mark.items,
      i = list.indexOf(item);
  if (i >= 0) {
    if (i===list.length-1) {
      list.pop();
    } else {
      list.splice(i, 1);
    }
  }
  return item;
};
prototype$f.touch = function() {
  if (this.pathCache) this.pathCache = null;
};
var Item_1 = Item;

var gradient_id = 0;
function Gradient(type) {
  this.id = 'gradient_' + (gradient_id++);
  this.type = type || 'linear';
  this.stops = [];
  this.x1 = 0;
  this.x2 = 1;
  this.y1 = 0;
  this.y2 = 0;
}
var prototype$g = Gradient.prototype;
prototype$g.stop = function(offset, color) {
  this.stops.push({
    offset: offset,
    color: color
  });
  return this;
};
var Gradient_1 = Gradient;

var sets = [
  'items',
  'axisItems',
  'legendItems'
];
var keys = [
  'marktype', 'name', 'interactive', 'clip',
  'items', 'axisItems', 'legendItems', 'layer',
  'x', 'y', 'width', 'height', 'align', 'baseline',
  'fill', 'fillOpacity', 'opacity',
  'stroke', 'strokeOpacity', 'strokeWidth', 'strokeCap',
  'strokeDash', 'strokeDashOffset',
  'startAngle', 'endAngle', 'innerRadius', 'outerRadius',
  'interpolate', 'tension', 'orient',
  'url',
  'path',
  'x2', 'y2',
  'size', 'shape',
  'text', 'angle', 'theta', 'radius', 'dx', 'dy',
  'font', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant'
];
function toJSON(scene, indent) {
  return JSON.stringify(scene, keys, indent);
}
function fromJSON(json) {
  var scene = (typeof json === 'string' ? JSON.parse(json) : json);
  return initialize(scene);
}
function initialize(scene) {
  var type = scene.marktype,
      i, n, s, m, items;
  for (s=0, m=sets.length; s<m; ++s) {
    if ((items = scene[sets[s]])) {
      for (i=0, n=items.length; i<n; ++i) {
        items[i][type ? 'mark' : 'group'] = scene;
        if (!type || type === 'group') {
          initialize(items[i]);
        }
      }
    }
  }
  if (type) bound.mark(scene);
  return scene;
}
var scene = {
  toJSON:   toJSON,
  fromJSON: fromJSON
};

var src$1 = {
  path:       path,
  render:     render$1,
  Item:       Item_1,
  bound:      bound,
  Bounds:     Bounds_1,
  canvas:     canvas,
  Gradient:   Gradient_1,
  toJSON:     scene.toJSON,
  fromJSON:   scene.fromJSON
};

var Tuple$2 = src.Tuple;
var axisBounds = new (src$1.Bounds)();
var ORDINAL$1 = 'ordinal';
function axs(model, config) {
  var scale,
      orient = config.orient,
      offset = 0,
      titleOffset = config.titleOffset,
      axisDef = {},
      layer = 'front',
      grid = false,
      title = null,
      tickMajorSize = config.tickSize,
      tickMinorSize = config.tickSize,
      tickEndSize = config.tickSize,
      tickPadding = config.tickPadding || config.padding,
      tickValues = null,
      tickFormatString = null,
      tickFormatType = null,
      tickSubdivide = 0,
      tickCount = config.ticks,
      gridLineStyle = {},
      tickLabelStyle = {},
      majorTickStyle = {},
      minorTickStyle = {},
      titleStyle = {},
      domainStyle = {},
      m = {
        gridLines:  {},
        majorTicks: {},
        minorTicks: {},
        tickLabels: {},
        domain: {},
        title:  {}
      };
  var axis = {};
  function reset() {
    axisDef.type = null;
  }
  function ingest(d) {
    return {data: d};
  }
  function getTicks(format) {
    var major = tickValues || (scale.ticks ? scale.ticks(tickCount) : scale.domain()),
        minor = axisSubdivide(scale, major, tickSubdivide).map(ingest);
    major = major.map(function(d) { return (d = ingest(d), d.label = format(d.data), d); });
    return [major, minor];
  }
  axis.def = function() {
    if (!axisDef.type) axis_def(scale);
    var format = util$1.getTickFormat(scale, tickCount, tickFormatType, tickFormatString),
        ticks  = getTicks(format),
        tdata  = title ? [title].map(ingest) : [];
    axisDef.marks[0].from = function() { return grid ? ticks[0] : []; };
    axisDef.marks[1].from = function() { return ticks[0]; };
    axisDef.marks[2].from = function() { return ticks[1]; };
    axisDef.marks[3].from = axisDef.marks[1].from;
    axisDef.marks[4].from = function() { return [1]; };
    axisDef.marks[5].from = function() { return tdata; };
    axisDef.offset = offset;
    axisDef.orient = orient;
    axisDef.layer = layer;
    if (titleOffset === 'auto') titleAutoOffset(axisDef);
    return axisDef;
  };
  function titleAutoOffset(axisDef) {
    var orient = axisDef.orient,
        update = axisDef.marks[5].properties.update,
        fn = update.encode,
        min = config.titleOffsetAutoMin,
        max = config.titleOffsetAutoMax,
        pad = config.titleOffsetAutoMargin;
    update.encode = function(item, group, trans, db, signals, preds) {
      var dirty = fn.call(fn, item, group, trans, db, signals, preds),
          field = (orient==='bottom' || orient==='top') ? 'y' : 'x';
      if (titleStyle[field] != null) return dirty;
      axisBounds.clear()
        .union(group.items[3].bounds)
        .union(group.items[4].bounds);
      var o = trans ? {} : item,
          method = (orient==='left' || orient==='right') ? 'width' : 'height',
          sign = (orient==='top' || orient==='left') ? -1 : 1,
          off = ~~(axisBounds[method]() + item.fontSize/2 + pad);
      Tuple$2.set(o, field, sign * Math.min(Math.max(min, off), max));
      if (trans) trans.interpolate(item, o);
      return true;
    };
  }
  function axis_def(scale) {
    var newScale, oldScale, range;
    if (scale.type === ORDINAL$1) {
      newScale = {scale: scale.scaleName, offset: 0.5 + scale.rangeBand()/2};
      oldScale = newScale;
    } else {
      newScale = {scale: scale.scaleName, offset: 0.5};
      oldScale = {scale: scale.scaleName+':prev', offset: 0.5};
    }
    range = axisScaleRange(scale);
    datalib.extend(m.gridLines, axisTicks(config));
    datalib.extend(m.majorTicks, axisTicks(config));
    datalib.extend(m.minorTicks, axisTicks(config));
    datalib.extend(m.tickLabels, axisTickLabels(config));
    datalib.extend(m.domain, axisDomain(config));
    datalib.extend(m.title, axisTitle(config));
    m.gridLines.properties.enter.stroke = {value: config.gridColor};
    m.gridLines.properties.enter.strokeOpacity = {value: config.gridOpacity};
    m.gridLines.properties.enter.strokeWidth = {value: config.gridWidth};
    m.gridLines.properties.enter.strokeDash = {value: config.gridDash};
    axisTicksExtend(orient, m.gridLines, oldScale, newScale, Infinity, scale, config, offset);
    axisTicksExtend(orient, m.majorTicks, oldScale, newScale, tickMajorSize, scale, config);
    axisTicksExtend(orient, m.minorTicks, oldScale, newScale, tickMinorSize, scale, config);
    axisLabelExtend(orient, m.tickLabels, oldScale, newScale, tickMajorSize, tickPadding);
    axisDomainExtend(orient, m.domain, range, tickEndSize);
    axisTitleExtend(orient, m.title, range, +titleOffset || -1);
    datalib.extend(m.gridLines.properties.update, gridLineStyle);
    datalib.extend(m.majorTicks.properties.update, majorTickStyle);
    datalib.extend(m.minorTicks.properties.update, minorTickStyle);
    datalib.extend(m.tickLabels.properties.update, tickLabelStyle);
    datalib.extend(m.domain.properties.update, domainStyle);
    datalib.extend(m.title.properties.update, titleStyle);
    var marks = [m.gridLines, m.majorTicks, m.minorTicks, m.tickLabels, m.domain, m.title];
    datalib.extend(axisDef, {
      type: 'group',
      interactive: false,
      properties: {
        enter: {
          encode: axisUpdate,
          scales: [scale.scaleName],
          signals: [], data: []
        },
        update: {
          encode: axisUpdate,
          scales: [scale.scaleName],
          signals: [], data: []
        }
      }
    });
    axisDef.marks = marks.map(function(m) { return mark(model, m); });
  }
  axis.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale !== x) { scale = x; reset(); }
    return axis;
  };
  axis.orient = function(x) {
    if (!arguments.length) return orient;
    if (orient !== x) {
      orient = x in axisOrients ? x + '' : config.orient;
      reset();
    }
    return axis;
  };
  axis.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return axis;
  };
  axis.tickCount = function(x) {
    if (!arguments.length) return tickCount;
    tickCount = x;
    return axis;
  };
  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };
  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormatString;
    if (tickFormatString !== x) {
      tickFormatString = x;
      reset();
    }
    return axis;
  };
  axis.tickFormatType = function(x) {
    if (!arguments.length) return tickFormatType;
    if (tickFormatType !== x) {
      tickFormatType = x;
      reset();
    }
    return axis;
  };
  axis.tickSize = function(x, y) {
    if (!arguments.length) return tickMajorSize;
    var n = arguments.length - 1,
        major = +x,
        minor = n > 1 ? +y : tickMajorSize,
        end   = n > 0 ? +arguments[n] : tickMajorSize;
    if (tickMajorSize !== major ||
        tickMinorSize !== minor ||
        tickEndSize !== end) {
      reset();
    }
    tickMajorSize = major;
    tickMinorSize = minor;
    tickEndSize = end;
    return axis;
  };
  axis.tickSubdivide = function(x) {
    if (!arguments.length) return tickSubdivide;
    tickSubdivide = +x;
    return axis;
  };
  axis.offset = function(x) {
    if (!arguments.length) return offset;
    offset = datalib.isObject(x) ? x : +x;
    return axis;
  };
  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    if (tickPadding !== +x) { tickPadding = +x; reset(); }
    return axis;
  };
  axis.titleOffset = function(x) {
    if (!arguments.length) return titleOffset;
    if (titleOffset !== x) { titleOffset = x; reset(); }
    return axis;
  };
  axis.layer = function(x) {
    if (!arguments.length) return layer;
    if (layer !== x) { layer = x; reset(); }
    return axis;
  };
  axis.grid = function(x) {
    if (!arguments.length) return grid;
    if (grid !== x) { grid = x; reset(); }
    return axis;
  };
  axis.gridLineProperties = function(x) {
    if (!arguments.length) return gridLineStyle;
    if (gridLineStyle !== x) { gridLineStyle = x; }
    return axis;
  };
  axis.majorTickProperties = function(x) {
    if (!arguments.length) return majorTickStyle;
    if (majorTickStyle !== x) { majorTickStyle = x; }
    return axis;
  };
  axis.minorTickProperties = function(x) {
    if (!arguments.length) return minorTickStyle;
    if (minorTickStyle !== x) { minorTickStyle = x; }
    return axis;
  };
  axis.tickLabelProperties = function(x) {
    if (!arguments.length) return tickLabelStyle;
    if (tickLabelStyle !== x) { tickLabelStyle = x; }
    return axis;
  };
  axis.titleProperties = function(x) {
    if (!arguments.length) return titleStyle;
    if (titleStyle !== x) { titleStyle = x; }
    return axis;
  };
  axis.domainProperties = function(x) {
    if (!arguments.length) return domainStyle;
    if (domainStyle !== x) { domainStyle = x; }
    return axis;
  };
  axis.reset = function() {
    reset();
    return axis;
  };
  return axis;
}
var axisOrients = {top: 1, right: 1, bottom: 1, left: 1};
function axisSubdivide(scale, ticks, m) {
  var subticks = [];
  if (m && ticks.length > 1) {
    var extent = axisScaleExtent(scale.domain()),
        i = -1,
        n = ticks.length,
        d = (ticks[1] - ticks[0]) / ++m,
        j,
        v;
    while (++i < n) {
      for (j = m; --j > 0;) {
        if ((v = +ticks[i] - j * d) >= extent[0]) {
          subticks.push(v);
        }
      }
    }
    for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
      subticks.push(v);
    }
  }
  return subticks;
}
function axisScaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}
function axisScaleRange(scale) {
  return scale.rangeExtent ?
    scale.rangeExtent() :
    axisScaleExtent(scale.range());
}
var axisAlign = {
  bottom: 'center',
  top: 'center',
  left: 'right',
  right: 'left'
};
var axisBaseline = {
  bottom: 'top',
  top: 'bottom',
  left: 'middle',
  right: 'middle'
};
function axisLabelExtend(orient, labels, oldScale, newScale, size, pad) {
  size = Math.max(size, 0) + pad;
  if (orient === 'left' || orient === 'top') {
    size *= -1;
  }
  if (orient === 'top' || orient === 'bottom') {
    datalib.extend(labels.properties.enter, {
      x: oldScale,
      y: {value: size},
    });
    datalib.extend(labels.properties.update, {
      x: newScale,
      y: {value: size},
      align: {value: 'center'},
      baseline: {value: axisBaseline[orient]}
    });
  } else {
    datalib.extend(labels.properties.enter, {
      x: {value: size},
      y: oldScale,
    });
    datalib.extend(labels.properties.update, {
      x: {value: size},
      y: newScale,
      align: {value: axisAlign[orient]},
      baseline: {value: 'middle'}
    });
  }
}
function axisTicksExtend(orient, ticks, oldRef, newRef, size, scale, config, offset) {
  var sign = (orient === 'left' || orient === 'top') ? -1 : 1;
  if (size === Infinity) {
    size = (orient === 'top' || orient === 'bottom') ?
      {field: {group: 'height', level: 2}, mult: -sign, offset: offset*-sign} :
      {field: {group: 'width',  level: 2}, mult: -sign, offset: offset*-sign};
  } else {
    size = {value: sign * size, offset: offset};
  }
  if (config.tickPlacement === 'between' && scale.type === ORDINAL$1) {
    var rng = scale.range(),
        tickOffset = 0.5 + (scale.rangeBand() || (rng[1] - rng[0]) / 2);
    newRef = oldRef = datalib.duplicate(newRef);
    newRef.offset = oldRef.offset = tickOffset;
  }
  if (orient === 'top' || orient === 'bottom') {
    datalib.extend(ticks.properties.enter, {
      x:  oldRef,
      y:  {value: 0},
      y2: size
    });
    datalib.extend(ticks.properties.update, {
      x:  newRef,
      y:  {value: 0},
      y2: size
    });
    datalib.extend(ticks.properties.exit, {
      x:  newRef,
    });
  } else {
    datalib.extend(ticks.properties.enter, {
      x:  {value: 0},
      x2: size,
      y:  oldRef
    });
    datalib.extend(ticks.properties.update, {
      x:  {value: 0},
      x2: size,
      y:  newRef
    });
    datalib.extend(ticks.properties.exit, {
      y:  newRef,
    });
  }
}
function axisTitleExtend(orient, title, range, offset) {
  var update = title.properties.update,
      mid = ~~((range[0] + range[1]) / 2),
      sign = (orient === 'top' || orient === 'left') ? -1 : 1;
  if (orient === 'bottom' || orient === 'top') {
    update.x = {value: mid};
    update.angle = {value: 0};
    if (offset >= 0) update.y = {value: sign * offset};
  } else {
    update.y = {value: mid};
    update.angle = {value: orient === 'left' ? -90 : 90};
    if (offset >= 0) update.x = {value: sign * offset};
  }
}
function axisDomainExtend(orient, domain, range, size) {
  var path;
  if (orient === 'top' || orient === 'left') {
    size = -1 * size;
  }
  if (orient === 'bottom' || orient === 'top') {
    path = 'M' + range[0] + ',' + size + 'V0H' + range[1] + 'V' + size;
  } else {
    path = 'M' + size + ',' + range[0] + 'H0V' + range[1] + 'H' + size;
  }
  domain.properties.update.path = {value: path};
}
function axisUpdate(item, group, trans) {
  var o = trans ? {} : item,
      offset = item.mark.def.offset,
      orient = item.mark.def.orient,
      width  = group.width,
      height = group.height;
  if (datalib.isArray(offset)) {
    var ofx = offset[0],
        ofy = offset[1];
    switch (orient) {
      case 'left':   { Tuple$2.set(o, 'x', -ofx); Tuple$2.set(o, 'y', ofy); break; }
      case 'right':  { Tuple$2.set(o, 'x', width + ofx); Tuple$2.set(o, 'y', ofy); break; }
      case 'bottom': { Tuple$2.set(o, 'x', ofx); Tuple$2.set(o, 'y', height + ofy); break; }
      case 'top':    { Tuple$2.set(o, 'x', ofx); Tuple$2.set(o, 'y', -ofy); break; }
      default:       { Tuple$2.set(o, 'x', ofx); Tuple$2.set(o, 'y', ofy); }
    }
  } else {
    if (datalib.isObject(offset)) {
      offset = -group.scale(offset.scale)(offset.value);
    }
    switch (orient) {
      case 'left':   { Tuple$2.set(o, 'x', -offset); Tuple$2.set(o, 'y', 0); break; }
      case 'right':  { Tuple$2.set(o, 'x', width + offset); Tuple$2.set(o, 'y', 0); break; }
      case 'bottom': { Tuple$2.set(o, 'x', 0); Tuple$2.set(o, 'y', height + offset); break; }
      case 'top':    { Tuple$2.set(o, 'x', 0); Tuple$2.set(o, 'y', -offset); break; }
      default:       { Tuple$2.set(o, 'x', 0); Tuple$2.set(o, 'y', 0); }
    }
  }
  if (trans) trans.interpolate(item, o);
  return true;
}
function axisTicks(config) {
  return {
    type: 'rule',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        stroke: {value: config.tickColor},
        strokeWidth: {value: config.tickWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}
function axisTickLabels(config) {
  return {
    type: 'text',
    interactive: true,
    key: 'data',
    properties: {
      enter: {
        fill: {value: config.tickLabelColor},
        font: {value: config.tickLabelFont},
        fontSize: {value: config.tickLabelFontSize},
        opacity: {value: 1e-6},
        text: {field: 'label'}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}
function axisTitle(config) {
  return {
    type: 'text',
    interactive: true,
    properties: {
      enter: {
        font: {value: config.titleFont},
        fontSize: {value: config.titleFontSize},
        fontWeight: {value: config.titleFontWeight},
        fill: {value: config.titleColor},
        align: {value: 'center'},
        baseline: {value: 'middle'},
        text: {field: 'data'}
      },
      update: {}
    }
  };
}
function axisDomain(config) {
  return {
    type: 'path',
    interactive: false,
    properties: {
      enter: {
        x: {value: 0.5},
        y: {value: 0.5},
        stroke: {value: config.axisColor},
        strokeWidth: {value: config.axisWidth}
      },
      update: {}
    }
  };
}
var axis = axs;

var themeVal = function(def, config, property, defaultVal) {
  if (def[property] !== undefined) {
    return def[property];
  } else if (config !== undefined && config[property] !== undefined) {
    return config[property];
  } else if (defaultVal !== undefined) {
    return defaultVal;
  }
  return undefined;
};

var ORIENT = {
  "x":      "bottom",
  "y":      "left",
  "top":    "top",
  "bottom": "bottom",
  "left":   "left",
  "right":  "right"
};
function parseAxes(model, spec, axes, group) {
  var cfg = config(model);
  (spec || []).forEach(function(def, index) {
    axes[index] = axes[index] || axis(model, cfg[def.type]);
    parseAxis(cfg[def.type], def, index, axes[index], group);
  });
}
function parseAxis(config, def, index, axis$$1, group) {
  var scale;
  if (def.scale !== undefined) {
    axis$$1.scale(scale = group.scale(def.scale));
  }
  var grid = config.grid;
  if (datalib.isObject(grid)) {
    config.grid = grid[scale.type] !== undefined ? grid[scale.type] : grid.default;
  }
  axis$$1.orient(themeVal(def, config, 'orient', ORIENT[def.type]));
  axis$$1.offset(themeVal(def, config, 'offset', 0));
  axis$$1.layer(themeVal(def, config, 'layer', 'front'));
  axis$$1.grid(themeVal(def, config, 'grid', false));
  axis$$1.title(def.title || null);
  axis$$1.titleOffset(themeVal(def, config, 'titleOffset'));
  axis$$1.tickValues(def.values || null);
  axis$$1.tickFormat(def.format || null);
  axis$$1.tickFormatType(def.formatType || null);
  axis$$1.tickSubdivide(def.subdivide || 0);
  axis$$1.tickPadding(themeVal(def, config, 'tickPadding', config.padding));
  var ts = themeVal(def, config, 'tickSize'),
      size = [ts, ts, ts];
  size[0] = themeVal(def, config, 'tickSizeMajor', size[0]);
  size[1] = themeVal(def, config, 'tickSizeMinor', size[1]);
  size[2] = themeVal(def, config, 'tickSizeEnd', size[2]);
  if (size.length) {
    axis$$1.tickSize.apply(axis$$1, size);
  }
  axis$$1.tickCount(themeVal(def, config, 'ticks'));
  var p = def.properties;
  if (p && p.ticks) {
    axis$$1.majorTickProperties(p.majorTicks ?
      datalib.extend({}, p.ticks, p.majorTicks) : p.ticks);
    axis$$1.minorTickProperties(p.minorTicks ?
      datalib.extend({}, p.ticks, p.minorTicks) : p.ticks);
  } else {
    axis$$1.majorTickProperties(p && p.majorTicks || {});
    axis$$1.minorTickProperties(p && p.minorTicks || {});
  }
  axis$$1.tickLabelProperties(p && p.labels || {});
  axis$$1.titleProperties(p && p.title || {});
  axis$$1.gridLineProperties(p && p.grid || {});
  axis$$1.domainProperties(p && p.axis || {});
}
function config(model) {
  var cfg  = model.config(),
      axis$$1 = cfg.axis;
  return {
    x: datalib.extend(datalib.duplicate(axis$$1), cfg.axis_x),
    y: datalib.extend(datalib.duplicate(axis$$1), cfg.axis_y)
  };
}
var axes = parseAxes;
parseAxes.schema = {
  "defs": {
    "axis": {
      "type": "object",
      "properties": {
        "type": {"enum": ["x", "y"]},
        "scale": {"type": "string"},
        "orient": {"enum": ["top", "bottom", "left", "right"]},
        "title": {"type": "string"},
        "titleOffset": {"type": "number"},
        "format": {"type": "string"},
        "formatType": {"enum": ["time", "utc", "string", "number"]},
        "ticks": {"type": "number"},
        "values": {
          "type": "array",
          "items": {"type": ["string", "number"]}
        },
        "subdivide": {"type": "number"},
        "tickPadding": {"type": "number"},
        "tickSize": {"type": "number"},
        "tickSizeMajor": {"type": "number"},
        "tickSizeMinor": {"type": "number"},
        "tickSizeEnd": {"type": "number"},
        "offset": {
          "oneOf": [{"type": "number"}, {
            "type": "object",
            "properties": {
              "scale": {"type": "string"},
              "value": {"type": ["string", "number"]}
            },
            "required": ["scale", "value"],
            "additionalProperties": false
          }]
        },
        "layer": {"enum": ["front", "back"], "default": "front"},
        "grid": {"type": "boolean"},
        "properties": {
          "type": "object",
          "properties": {
            "ticks": {"$ref": "#/defs/propset"},
            "majorTicks": {"$ref": "#/defs/propset"},
            "minorTicks": {"$ref": "#/defs/propset"},
            "labels": {"$ref": "#/defs/propset"},
            "title": {"$ref": "#/defs/propset"},
            "grid": {"$ref": "#/defs/propset"},
            "axis": {"$ref": "#/defs/propset"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "required": ["type", "scale"]
    }
  }
};

function parseBg(bg) {
  if (bg == null) return null;
  return d3.rgb(bg) + '';
}
var background = parseBg;
parseBg.schema = {"defs": {"background": {"type": "string"}}};

var Deps = src.Dependencies;
var arrayType = /array/i,
    dataType  = /data/i,
    fieldType = /field/i,
    exprType  = /expr/i,
    valType   = /value/i;
function Parameter(name, type, transform) {
  this._name = name;
  this._type = type;
  this._transform = transform;
  this._value = [];
  this._accessors = [];
  this._resolution = false;
  this._signals = [];
}
var prototype$h = Parameter.prototype;
function get() {
  var isArray = arrayType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);
  var val = isArray ? this._value : this._value[0],
      acc = isArray ? this._accessors : this._accessors[0];
  if (!datalib.isValid(acc) && valType.test(this._type)) {
    return val;
  } else {
    return isData ? { name: val, source: acc } :
    isField ? { field: val, accessor: acc } : val;
  }
}
prototype$h.get = function() {
  var graph = this._transform._graph,
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type),
      i, n, sig, idx, val;
  if (!this._resolution) return get.call(this);
  if (isData) {
    this._accessors = this._value.map(function(v) { return graph.data(v); });
    return get.call(this);
  }
  for (i=0, n=this._signals.length; i<n; ++i) {
    sig = this._signals[i];
    idx = sig.index;
    val = sig.value(graph);
    if (isField) {
      this._accessors[idx] = this._value[idx] != val ?
        datalib.accessor(val) : this._accessors[idx];
    }
    this._value[idx] = val;
  }
  return get.call(this);
};
prototype$h.set = function(value) {
  var p = this,
      graph = p._transform._graph,
      isExpr = exprType.test(this._type),
      isData  = dataType.test(this._type),
      isField = fieldType.test(this._type);
  p._signals = [];
  this._value = datalib.array(value).map(function(v, i) {
    var e;
    if (datalib.isString(v)) {
      if (isExpr) {
        e = graph.expr(v);
        p._transform.dependency(Deps.FIELDS,  e.fields);
        p._transform.dependency(Deps.SIGNALS, e.globals);
        p._transform.dependency(Deps.DATA,    e.dataSources);
        return e.fn;
      } else if (isField) {
        p._accessors[i] = datalib.accessor(v);
        p._transform.dependency(Deps.FIELDS, datalib.field(v));
      } else if (isData) {
        p._resolution = true;
        p._transform.dependency(Deps.DATA, v);
      }
      return v;
    } else if (v.value !== undefined) {
      return v.value;
    } else if (v.field !== undefined) {
      p._accessors[i] = datalib.accessor(v.field);
      p._transform.dependency(Deps.FIELDS, datalib.field(v.field));
      return v.field;
    } else if (v.signal !== undefined) {
      p._resolution = true;
      p._transform.dependency(Deps.SIGNALS, datalib.field(v.signal)[0]);
      p._signals.push({
        index: i,
        value: function(graph) { return graph.signalRef(v.signal); }
      });
      return v.signal;
    } else if (v.expr !== undefined) {
      p._resolution = true;
      e = graph.expr(v.expr);
      p._transform.dependency(Deps.SIGNALS, e.globals);
      p._signals.push({
        index: i,
        value: function() { return e.fn(); }
      });
      return v.expr;
    }
    return v;
  });
  return p._transform;
};
var Parameter_1 = Parameter;
Parameter.schema = {
  "type": "object",
  "oneOf": [{
    "properties": {"field": {"type": "string"}},
    "required": ["field"]
  }, {
    "properties": {"value": {"type": "string"}},
    "required": ["value"]
  }]
};

var Base$2 = src.Node.prototype,
    Deps$1 = src.Dependencies;
function Transform(graph) {
  if (graph) Base$2.init.call(this, graph);
}
Transform.addParameters = function(proto, params) {
  proto._parameters = proto._parameters || {};
  for (var name in params) {
    var p = params[name],
        param = new Parameter_1(name, p.type, proto);
    proto._parameters[name] = param;
    if (p.type === 'custom') {
      if (p.set) param.set = p.set.bind(param);
      if (p.get) param.get = p.get.bind(param);
    }
    if (p.hasOwnProperty('default')) param.set(p.default);
  }
};
var prototype$i = (Transform.prototype = Object.create(Base$2));
prototype$i.constructor = Transform;
prototype$i.param = function(name, value) {
  var param = this._parameters[name];
  return (param === undefined) ? this :
    (arguments.length === 1) ? param.get() : param.set(value);
};
prototype$i.transform = function(input            ) {
  return input;
};
prototype$i.evaluate = function(input) {
  var reset = this._stamp < input.stamp &&
    this.dependency(Deps$1.SIGNALS).reduce(function(c, s) {
      return c += input.signals[s] ? 1 : 0;
    }, 0);
  return this.transform(input, reset);
};
prototype$i.output = function(map) {
  for (var key in this._output) {
    if (map[key] !== undefined) {
      this._output[key] = map[key];
    }
  }
  return this;
};
var Transform_1 = Transform;

var Aggregator = datalib.Aggregator,
    Base$3 = Aggregator.prototype,
    Tuple$3 = src.Tuple,
    facetID = 0;
function Facetor() {
  Aggregator.call(this);
  this._facet = null;
  this._facetID = ++facetID;
}
var prototype$j = (Facetor.prototype = Object.create(Base$3));
prototype$j.constructor = Facetor;
prototype$j.facet = function(f) {
  return arguments.length ? (this._facet = f, this) : this._facet;
};
prototype$j._ingest = function(t) {
  return Tuple$3.ingest(t, null);
};
prototype$j._assign = Tuple$3.set;
function disconnect_cell(facet) {
  vegaLogging.debug({}, ['disconnecting cell', this.tuple._id]);
  var pipeline = this.ds.pipeline();
  facet.removeListener(pipeline[0]);
  facet._graph.removeListener(pipeline[0]);
  facet._graph.disconnect(pipeline);
}
prototype$j._newcell = function(x, key) {
  var cell  = Base$3._newcell.call(this, x, key),
      facet = this._facet;
  if (facet) {
    var graph = facet._graph,
        tuple = cell.tuple,
        pipeline = facet.param('transform');
    cell.ds = graph.data(tuple._facetID, pipeline, tuple);
    cell.disconnect = disconnect_cell;
    facet.addListener(pipeline[0]);
  }
  return cell;
};
prototype$j._newtuple = function(x, key) {
  var t = Base$3._newtuple.call(this, x);
  if (this._facet) {
    Tuple$3.set(t, 'key', key);
    Tuple$3.set(t, '_facetID', this._facetID + '_' + key);
  }
  return t;
};
prototype$j.clear = function() {
  if (this._facet) {
    for (var k in this._cells) {
      this._cells[k].disconnect(this._facet);
    }
  }
  return Base$3.clear.call(this);
};
prototype$j._on_add = function(x, cell) {
  if (this._facet) cell.ds._input.add.push(x);
};
prototype$j._on_rem = function(x, cell) {
  if (this._facet) cell.ds._input.rem.push(x);
};
prototype$j._on_mod = function(x, prev, cell0, cell1) {
  if (this._facet) {
    if (cell0 === cell1) {
      cell0.ds._input.mod.push(x);
    } else {
      cell0.ds._input.rem.push(x);
      cell1.ds._input.add.push(x);
    }
  }
};
prototype$j._on_drop = function(cell) {
  if (this._facet) cell.disconnect(this._facet);
};
prototype$j._on_keep = function(cell) {
  if (this._facet) src.ChangeSet.copy(this._input, cell.ds._input);
};
var Facetor_1 = Facetor;

var ChangeSet$1 = src.ChangeSet,
    Tuple$4 = src.Tuple,
    Deps$2 = src.Dependencies;
function Aggregate(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    groupby: {type: 'array<field>'},
    summarize: {
      type: 'custom',
      set: function(summarize) {
        var signalDeps = {},
            tx = this._transform,
            i, len, f, fields, name, ops;
        if (!datalib.isArray(fields = summarize)) {
          fields = [];
          for (name in summarize) {
            ops = datalib.array(summarize[name]);
            fields.push({field: name, ops: ops});
          }
        }
        function sg(x) { if (x.signal) signalDeps[x.signal] = 1; }
        for (i=0, len=fields.length; i<len; ++i) {
          f = fields[i];
          if (f.field.signal) { signalDeps[f.field.signal] = 1; }
          datalib.array(f.ops).forEach(sg);
          datalib.array(f.as).forEach(sg);
        }
        tx._fields = fields;
        tx._aggr = null;
        tx.dependency(Deps$2.SIGNALS, datalib.keys(signalDeps));
        return tx;
      }
    }
  });
  this._aggr  = null;
  this._input = null;
  this._args  = null;
  this._fields = [];
  this._out = [];
  this._type = TYPES.TUPLE;
  this._acc = {groupby: datalib.true, value: datalib.true};
  return this.router(true).produces(true);
}
var prototype$k = (Aggregate.prototype = Object.create(Transform_1.prototype));
prototype$k.constructor = Aggregate;
var TYPES = Aggregate.TYPES = {
  VALUE: 1,
  TUPLE: 2,
  MULTI: 3
};
Aggregate.VALID_OPS = [
  'values', 'count', 'valid', 'missing', 'distinct',
  'sum', 'mean', 'average', 'variance', 'variancep', 'stdev',
  'stdevp', 'median', 'q1', 'q3', 'modeskew', 'min', 'max',
  'argmin', 'argmax'
];
prototype$k.type = function(type) {
  return (this._type = type, this);
};
prototype$k.accessors = function(groupby, value) {
  var acc = this._acc;
  acc.groupby = datalib.$(groupby) || datalib.true;
  acc.value = datalib.$(value) || datalib.true;
};
prototype$k.aggr = function() {
  if (this._aggr) return this._aggr;
  var g = this._graph,
      hasGetter = false,
      args = [],
      groupby = this.param('groupby').field,
      value = function(x) { return x.signal ? g.signalRef(x.signal) : x; };
  var fields = this._fields.map(function(f) {
    var field = {
      name: value(f.field),
      as:   datalib.array(f.as),
      ops:  datalib.array(value(f.ops)).map(value),
      get:  f.get
    };
    hasGetter = hasGetter || field.get != null;
    args.push(field.name);
    return field;
  });
  groupby.forEach(function(g) {
    if (g.get) hasGetter = true;
    args.push(g.name || g);
  });
  this._args = hasGetter || !fields.length ? null : args;
  if (!fields.length) fields = {'*': 'values'};
  var aggr = this._aggr = new Facetor_1()
    .groupby(groupby)
    .stream(true)
    .summarize(fields);
  this._out = getFields(aggr);
  if (this._type !== TYPES.VALUE) { aggr.key('_id'); }
  return aggr;
};
function getFields(aggr) {
  var f = [], i, n, j, m, dims, vals, meas;
  dims = aggr._dims;
  for (i=0, n=dims.length; i<n; ++i) {
    f.push(dims[i].name);
  }
  vals = aggr._aggr;
  for (i=0, n=vals.length; i<n; ++i) {
    meas = vals[i].measures.fields;
    for (j=0, m=meas.length; j<m; ++j) {
      f.push(meas[j]);
    }
  }
  return f;
}
prototype$k.transform = function(input, reset) {
  vegaLogging.debug(input, ['aggregate']);
  var output = ChangeSet$1.create(input),
      aggr = this.aggr(),
      out = this._out,
      args = this._args,
      reeval = true,
      p = Tuple$4.prev,
      add, rem, mod, mark, i;
  if (reset) {
    output.rem.push.apply(output.rem, aggr.result());
    aggr.clear();
    this._aggr = null;
    aggr = this.aggr();
  }
  if (this._type === TYPES.TUPLE) {
    add  = function(x) { aggr._add(x); Tuple$4.prev_init(x); };
    rem  = function(x) { aggr._rem(p(x)); };
    mod  = function(x) { aggr._mod(x, p(x)); };
    mark = function(x) { aggr._markMod(x, p(x)); };
  } else {
    var gby = this._acc.groupby,
        val = this._acc.value,
        get = this._type === TYPES.VALUE ? val : function(x) {
          return { _id: x._id, groupby: gby(x), value: val(x) };
        };
    add  = function(x) { aggr._add(get(x)); Tuple$4.prev_init(x); };
    rem  = function(x) { aggr._rem(get(p(x))); };
    mod  = function(x) { aggr._mod(get(x), get(p(x))); };
    mark = function(x) { aggr._mark(get(x), get(p(x))); };
  }
  input.add.forEach(add);
  if (reset) {
    input.mod.forEach(add);
  } else {
    input.rem.forEach(rem);
    if (args) for (i=0, reeval=false; i<args.length; ++i) {
      if (input.fields[args[i]]) { reeval = true; break; }
    }
    input.mod.forEach(reeval ? mod : mark);
  }
  for (i=0; i<out.length; ++i) {
    output.fields[out[i]] = 1;
  }
  return (aggr._input = input, aggr.changes(output));
};
var Aggregate_1 = Aggregate;
var VALID_OPS = Aggregate.VALID_OPS;
Aggregate.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Aggregate transform",
  "description": "Compute summary aggregate statistics",
  "type": "object",
  "properties": {
    "type": {"enum": ["aggregate"]},
    "groupby": {
      "type": "array",
      "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]},
      "description": "A list of fields to split the data into groups."
    },
    "summarize": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "description": "An array of aggregate functions.",
            "items": {"oneOf": [{"enum": VALID_OPS}, {"$ref": "#/refs/signal"}]}
          }
        },
        {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "field": {
                "description": "The name of the field to aggregate.",
                "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
              },
              "ops": {
                "type": "array",
                "description": "An array of aggregate functions.",
                "items": {"oneOf": [{"enum": VALID_OPS}, {"$ref": "#/refs/signal"}]}
              },
              "as": {
                "type": "array",
                "description": "An optional array of names to use for the output fields.",
                "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
              }
            },
            "additionalProperties": false,
            "required": ["field", "ops"]
          }
        }
      ]
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

var Base$4 = Transform_1.prototype;
function BatchTransform() {
  this._collector = null;
}
var prototype$l = (BatchTransform.prototype = Object.create(Base$4));
prototype$l.constructor = BatchTransform;
prototype$l.init = function(graph) {
  Base$4.init.call(this, graph);
  return this.batch(true);
};
prototype$l.transform = function(input, reset) {
  return this.batchTransform(input, this._collector.data(), reset);
};
prototype$l.batchTransform = function(                        ) {
};
var BatchTransform_1 = BatchTransform;

var Tuple$5 = src.Tuple;
function Bin(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    field: {type: 'field'},
    min: {type: 'value'},
    max: {type: 'value'},
    base: {type: 'value', default: 10},
    maxbins: {type: 'value', default: 20},
    step: {type: 'value'},
    steps: {type: 'value'},
    minstep: {type: 'value'},
    div: {type: 'array<value>', default: [5, 2]}
  });
  this._output = {
    start: 'bin_start',
    end:   'bin_end',
    mid:   'bin_mid'
  };
  return this.mutates(true);
}
var prototype$m = (Bin.prototype = Object.create(BatchTransform_1.prototype));
prototype$m.constructor = Bin;
prototype$m.extent = function(data) {
  var e = [this.param('min'), this.param('max')], d;
  if (e[0] == null || e[1] == null) {
    d = datalib.extent(data, this.param('field').accessor);
    if (e[0] == null) e[0] = d[0];
    if (e[1] == null) e[1] = d[1];
  }
  return e;
};
prototype$m.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['binning']);
  var extent  = this.extent(data),
      output  = this._output,
      step    = this.param('step'),
      steps   = this.param('steps'),
      minstep = this.param('minstep'),
      get     = this.param('field').accessor,
      opt = {
        min: extent[0],
        max: extent[1],
        base: this.param('base'),
        maxbins: this.param('maxbins'),
        div: this.param('div')
      };
  if (step) opt.step = step;
  if (steps) opt.steps = steps;
  if (minstep) opt.minstep = minstep;
  var b = datalib.bins(opt),
      s = b.step;
  function update(d) {
    var v = get(d);
    v = v == null ? null
      : b.start + s * ~~((v - b.start) / s);
    Tuple$5.set(d, output.start, v);
    Tuple$5.set(d, output.end, v + s);
    Tuple$5.set(d, output.mid, v + s/2);
  }
  input.add.forEach(update);
  input.mod.forEach(update);
  input.rem.forEach(update);
  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};
var Bin_1 = Bin;
Bin.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Bin transform",
  "description": "Bins values into quantitative bins (e.g., for a histogram).",
  "type": "object",
  "properties": {
    "type": {"enum": ["bin"]},
    "field": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The name of the field to bin values from."
    },
    "min": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The minimum bin value to consider."
    },
    "max": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The maximum bin value to consider."
    },
    "base": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The number base to use for automatic bin determination.",
      "default": 10
    },
    "maxbins": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The maximum number of allowable bins.",
      "default": 20
    },
    "step": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "An exact step size to use between bins. If provided, options such as maxbins will be ignored."
    },
    "steps": {
      "description": "An array of allowable step sizes to choose from.",
      "oneOf": [
        {
          "type": "array",
          "items": {"type": "number"}
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "minstep": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "A minimum allowable step size (particularly useful for integer values)."
    },
    "div": {
      "description": "An array of scale factors indicating allowable subdivisions.",
      "oneOf": [
        {
          "type": "array",
          "items": {"type": "number"},
          "default": [5, 2]
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "start": {"type": "string", "default": "bin_start"},
        "end": {"type": "string", "default": "bin_end"},
        "mid": {"type": "string", "default": "bin_mid"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "field"]
};

var ChangeSet$2 = src.ChangeSet,
    Tuple$6 = src.Tuple;
function Cross(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    with: {type: 'data'},
    diagonal: {type: 'value', default: 'true'},
    filter: {type: 'expr'}
  });
  this._output = {'left': 'a', 'right': 'b'};
  this._lastWith = null;
  this._cids  = {};
  this._cache = {};
  return this.router(true).produces(true);
}
var prototype$n = (Cross.prototype = Object.create(BatchTransform_1.prototype));
prototype$n.constructor = Cross;
function _cache(x, t) {
  var c = this._cache,
      cross = c[x._id] || (c[x._id] = {c: [], f: false});
  cross.c.push(t);
}
function _cid(left, x, y) {
  return left ? x._id+'_'+y._id : y._id+'_'+x._id;
}
function add(output, left, data, diag, test, mids, x) {
  var as = this._output,
      cache = this._cache,
      cids  = this._cids,
      oadd  = output.add,
      fltrd = false,
      i = 0, len = data.length,
      t = {}, y, cid;
  for (; i<len; ++i) {
    y = data[i];
    cid = _cid(left, x, y);
    if (cids[cid]) continue;
    if (x._id === y._id && !diag) continue;
    Tuple$6.set(t, as.left, left ? x : y);
    Tuple$6.set(t, as.right, left ? y : x);
    if (!test || test(t)) {
      oadd.push(t=Tuple$6.ingest(t));
      _cache.call(this, x, t);
      if (x._id !== y._id) _cache.call(this, y, t);
      mids[t._id] = 1;
      cids[cid] = true;
      t = {};
    } else {
      if (cache[y._id]) cache[y._id].f = true;
      fltrd = true;
    }
  }
  if (cache[x._id]) cache[x._id].f = fltrd;
}
function mod(output, left, data, diag, test, mids, rids, x) {
  var as = this._output,
      cache = this._cache,
      cids  = this._cids,
      cross = cache[x._id],
      tpls  = cross && cross.c,
      fltrd = !cross || cross.f,
      omod  = output.mod,
      orem  = output.rem,
      i, t, y, l, cid;
  if (tpls) {
    for (i=tpls.length-1; i>=0; --i) {
      t = tpls[i];
      l = x === t[as.left];
      y = l ? t[as.right] : t[as.left];
      cid = _cid(l, x, y);
      if (!cache[y._id]) {
        cids[cid] = false;
        tpls.splice(i, 1);
        continue;
      }
      if (!test || test(t)) {
        if (mids[t._id]) continue;
        omod.push(t);
        mids[t._id] = 1;
      } else {
        if (!rids[t._id]) orem.push.apply(orem, tpls.splice(i, 1));
        rids[t._id] = 1;
        cids[cid] = false;
        cross.f = true;
      }
    }
  }
  if (test && fltrd) add.call(this, output, left, data, diag, test, mids, x);
}
function rem(output, left, rids, x) {
  var as = this._output,
      cross = this._cache[x._id],
      cids  = this._cids,
      orem  = output.rem,
      i, len, t, y, l;
  if (!cross) return;
  for (i=0, len=cross.c.length; i<len; ++i) {
    t = cross.c[i];
    l = x === t[as.left];
    y = l ? t[as.right] : t[as.left];
    cids[_cid(l, x, y)] = false;
    if (!rids[t._id]) {
      orem.push(t);
      rids[t._id] = 1;
    }
  }
  this._cache[x._id] = null;
}
function purge(output, rids) {
  var cache = this._cache,
      keys  = datalib.keys(cache),
      rem = output.rem,
      i, len, j, jlen, cross, t;
  for (i=0, len=keys.length; i<len; ++i) {
    cross = cache[keys[i]];
    for (j=0, jlen=cross.c.length; j<jlen; ++j) {
      t = cross.c[j];
      if (rids[t._id]) continue;
      rem.push(t);
      rids[t._id] = 1;
    }
  }
  this._cache = {};
  this._cids = {};
  this._lastWith = null;
}
prototype$n.batchTransform = function(input, data, reset) {
  vegaLogging.debug(input, ['crossing']);
  var w = this.param('with'),
      diag = this.param('diagonal'),
      as = this._output,
      test = this.param('filter') || null,
      selfCross = (!w.name),
      woutput = selfCross ? input : w.source.last(),
      wdata   = selfCross ? data : w.source.values(),
      output  = ChangeSet$2.create(input),
      mids = {}, rids = {};
  if (reset) {
    purge.call(this, output, rids);
    data.forEach(add.bind(this, output, true, wdata, diag, test, mids));
    this._lastWith = woutput.stamp;
  } else {
    input.rem.forEach(rem.bind(this, output, true, rids));
    input.add.forEach(add.bind(this, output, true, wdata, diag, test, mids));
    if (woutput.stamp > this._lastWith) {
      woutput.rem.forEach(rem.bind(this, output, false, rids));
      woutput.add.forEach(add.bind(this, output, false, data, diag, test, mids));
      woutput.mod.forEach(mod.bind(this, output, false, data, diag, test, mids, rids));
      this._lastWith = woutput.stamp;
    }
    input.mod.forEach(mod.bind(this, output, true, wdata, diag, test, mids, rids));
  }
  output.fields[as.left]  = 1;
  output.fields[as.right] = 1;
  return output;
};
var Cross_1 = Cross;
Cross.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Cross transform",
  "description": "Compute the cross-product of two data sets.",
  "type": "object",
  "properties": {
    "type": {"enum": ["cross"]},
    "with": {
      "type": "string",
      "description": "The name of the secondary data set to cross with the primary data. " +
        "If unspecified, the primary data is crossed with itself."
    },
    "diagonal": {
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "description": "If false, items along the \"diagonal\" of the cross-product " +
        "(those elements with the same index in their respective array) " +
        "will not be included in the output.",
      "default": true
    },
    "filter": {
      "type": "string",
      "description": "A string containing an expression (in JavaScript syntax) " +
        "to filter the resulting data elements."
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "left": {"type": "string", "default": "a"},
        "right": {"type": "string", "default": "b"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

var Tuple$7 = src.Tuple;
function CountPattern(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    field:     {type: 'field', default: 'data'},
    pattern:   {type: 'value', default: '[\\w\']+'},
    case:      {type: 'value', default: 'lower'},
    stopwords: {type: 'value', default: ''}
  });
  this._output = {text: 'text', count: 'count'};
  return this.router(true).produces(true);
}
var prototype$o = (CountPattern.prototype = Object.create(Transform_1.prototype));
prototype$o.constructor = CountPattern;
prototype$o.transform = function(input, reset) {
  vegaLogging.debug(input, ['countpattern']);
  var get = this.param('field').accessor,
      pattern = this.param('pattern'),
      stop = this.param('stopwords'),
      rem = false;
  if (this._stop !== stop) {
    this._stop = stop;
    this._stop_re = new RegExp('^' + stop + '$', 'i');
    reset = true;
  }
  if (this._pattern !== pattern) {
    this._pattern = pattern;
    this._match = new RegExp(this._pattern, 'g');
    reset = true;
  }
  if (reset) this._counts = {};
  function curr(t) { return (Tuple$7.prev_init(t), get(t)); }
  function prev(t) { return get(Tuple$7.prev(t)); }
  this._add(input.add, curr);
  if (!reset) this._rem(input.rem, prev);
  if (reset || (rem = input.fields[get.field])) {
    if (rem) this._rem(input.mod, prev);
    this._add(input.mod, curr);
  }
  return this._changeset(input);
};
prototype$o._changeset = function(input) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      change = src.ChangeSet.create(input),
      out = this._output, w, t, c;
  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = Tuple$7.ingest({}));
      t[out.text] = w;
      t[out.count] = c;
      change.add.push(t);
    } else if (c === 0) {
      if (t) change.rem.push(t);
      delete counts[w];
      delete tuples[w];
    } else if (t[out.count] !== c) {
      Tuple$7.set(t, out.count, c);
      change.mod.push(t);
    }
  }
  return change;
};
prototype$o._tokenize = function(text) {
  switch (this.param('case')) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(this._match);
};
prototype$o._add = function(tuples, get) {
  var counts = this._counts,
      stop = this._stop_re,
      tok, i, j, t;
  for (j=0; j<tuples.length; ++j) {
    tok = this._tokenize(get(tuples[j]));
    for (i=0; i<tok.length; ++i) {
      if (!stop.test(t=tok[i])) {
        counts[t] = 1 + (counts[t] || 0);
      }
    }
  }
};
prototype$o._rem = function(tuples, get) {
  var counts = this._counts,
      stop = this._stop_re,
      tok, i, j, t;
  for (j=0; j<tuples.length; ++j) {
    tok = this._tokenize(get(tuples[j]));
    for (i=0; i<tok.length; ++i) {
      if (!stop.test(t=tok[i])) {
        counts[t] -= 1;
      }
    }
  }
};
var CountPattern_1 = CountPattern;
CountPattern.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "CountPattern transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["countpattern"]},
    "field": {
      "description": "The field containing the text to analyze.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": 'data'
    },
    "pattern": {
      "description": "A regexp pattern for matching words in text.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "[\\w\']+"
    },
    "case": {
      "description": "Text case transformation to apply.",
      "oneOf": [{"enum": ["lower", "upper", "none"]}, {"$ref": "#/refs/signal"}],
      "default": "lower"
    },
    "stopwords": {
      "description": "A regexp pattern for matching stopwords to omit.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": ""
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "text": {"type": "string", "default": "text"},
        "count": {"type": "string", "default": "count"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

var Tuple$8 = src.Tuple;
function LinkPath(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    sourceX:  {type: 'field', default: '_source.layout_x'},
    sourceY:  {type: 'field', default: '_source.layout_y'},
    targetX:  {type: 'field', default: '_target.layout_x'},
    targetY:  {type: 'field', default: '_target.layout_y'},
    tension:  {type: 'value', default: 0.2},
    shape:    {type: 'value', default: 'line'}
  });
  this._output = {'path': 'layout_path'};
  return this.mutates(true);
}
var prototype$p = (LinkPath.prototype = Object.create(Transform_1.prototype));
prototype$p.constructor = LinkPath;
function line$3(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}
function curve(sx, sy, tx, ty, tension) {
  var dx = tx - sx,
      dy = ty - sy,
      ix = tension * (dx + dy),
      iy = tension * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}
function cornerX(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'V' + ty + 'H' + tx;
}
function cornerY(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'H' + tx + 'V' + ty;
}
function cornerR(sa, sr, ta, tr) {
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
var shapes = {
  line:      line$3,
  curve:     curve,
  cornerX:   cornerX,
  cornerY:   cornerY,
  cornerR:   cornerR,
  diagonalX: diagonalX,
  diagonalY: diagonalY,
  diagonalR: diagonalR
};
prototype$p.transform = function(input) {
  vegaLogging.debug(input, ['linkpath']);
  var output = this._output,
      shape = shapes[this.param('shape')] || shapes.line,
      sourceX = this.param('sourceX').accessor,
      sourceY = this.param('sourceY').accessor,
      targetX = this.param('targetX').accessor,
      targetY = this.param('targetY').accessor,
      tension = this.param('tension');
  function set(t) {
    var path = shape(sourceX(t), sourceY(t), targetX(t), targetY(t), tension);
    Tuple$8.set(t, output.path, path);
  }
  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }
  input.fields[output.path] = 1;
  return input;
};
var LinkPath_1 = LinkPath;
LinkPath.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "LinkPath transform",
  "description": "Computes a path definition for connecting nodes within a node-link network or tree diagram.",
  "type": "object",
  "properties": {
    "type": {"enum": ["linkpath"]},
    "sourceX": {
      "description": "The data field that references the source x-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_source"
    },
    "sourceY": {
      "description": "The data field that references the source y-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_source"
    },
    "targetX": {
      "description": "The data field that references the target x-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_target"
    },
    "targetY": {
      "description": "The data field that references the target y-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_target"
    },
    "tension": {
      "description": "A tension parameter for the \"tightness\" of \"curve\"-shaped links.",
      "oneOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": 0.2
    },
    "shape": {
      "description": "The path shape to use",
      "oneOf": [
        {"enum": ["line", "curve", "cornerX", "cornerY", "cornerR", "diagonalX", "diagonalY", "diagonalR"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "line"
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "path": {"type": "string", "default": "layout_path"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

function Facet(graph) {
  Transform_1.addParameters(this, {
    transform: {
      type: "custom",
      set: function(pipeline) {
        return (this._transform._pipeline = pipeline, this._transform);
      },
      get: function() {
        var parse = transforms_1$1,
            facet = this._transform;
        return facet._pipeline.map(function(t) {
          return parse(facet._graph, t);
        });
      }
    }
  });
  this._pipeline = [];
  return Aggregate_1.call(this, graph);
}
var prototype$q = (Facet.prototype = Object.create(Aggregate_1.prototype));
prototype$q.constructor = Facet;
prototype$q.aggr = function() {
  return Aggregate_1.prototype.aggr.call(this).facet(this);
};
prototype$q.transform = function(input, reset) {
  var output  = Aggregate_1.prototype.transform.call(this, input, reset);
  if (input.add.length) {
    this.listeners()[0].rerank();
  }
  return output;
};
var Facet_1 = Facet;
Facet.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Facet transform",
  "description": "A special aggregate transform that organizes a data set into groups or \"facets\".",
  "type": "object",
  "properties": datalib.extend({}, Aggregate_1.schema.properties, {
    "type": {"enum": ["facet"]},
    "transform": {"$ref": "#/defs/transform"}
  }),
  "additionalProperties": false,
  "required": ["type"]
};

function Filter(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {test: {type: 'expr'}});
  this._skip = {};
  return this.router(true);
}
var prototype$r = (Filter.prototype = Object.create(Transform_1.prototype));
prototype$r.constructor = Filter;
prototype$r.transform = function(input) {
  vegaLogging.debug(input, ['filtering']);
  var output = src.ChangeSet.create(input),
      skip = this._skip,
      test = this.param('test');
  input.rem.forEach(function(x) {
    if (skip[x._id] !== 1) output.rem.push(x);
    else skip[x._id] = 0;
  });
  input.add.forEach(function(x) {
    if (test(x)) output.add.push(x);
    else skip[x._id] = 1;
  });
  input.mod.forEach(function(x) {
    var b = test(x),
        s = (skip[x._id] === 1);
    if (b && s) {
      skip[x._id] = 0;
      output.add.push(x);
    } else if (b && !s) {
      output.mod.push(x);
    } else if (!b && s) ; else {
      output.rem.push(x);
      skip[x._id] = 1;
    }
  });
  return output;
};
var Filter_1 = Filter;
Filter.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Filter transform",
  "description": "Filters elements from a data set to remove unwanted items.",
  "type": "object",
  "properties": {
    "type": {"enum": ["filter"]},
    "test": {
      "type": "string",
      "description": "A string containing an expression (in JavaScript syntax) for the filter predicate."
    }
  },
  "additionalProperties": false,
  "required": ["type", "test"]
};

var Tuple$9 = src.Tuple;
function Fold(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    fields: {type: 'array<field>'}
  });
  this._output = {key: 'key', value: 'value'};
  this._cache = {};
  return this.router(true).produces(true);
}
var prototype$s = (Fold.prototype = Object.create(Transform_1.prototype));
prototype$s.constructor = Fold;
prototype$s._reset = function(input, output) {
  for (var id in this._cache) {
    output.rem.push.apply(output.rem, this._cache[id]);
  }
  this._cache = {};
};
prototype$s._tuple = function(x, i, len) {
  var list = this._cache[x._id] || (this._cache[x._id] = Array(len));
  return list[i] ? Tuple$9.rederive(x, list[i]) : (list[i] = Tuple$9.derive(x));
};
prototype$s._fn = function(data, on, out) {
  var i, j, n, m, d, t;
  for (i=0, n=data.length; i<n; ++i) {
    d = data[i];
    for (j=0, m=on.field.length; j<m; ++j) {
      t = this._tuple(d, j, m);
      Tuple$9.set(t, this._output.key, on.field[j]);
      Tuple$9.set(t, this._output.value, on.accessor[j](d));
      out.push(t);
    }
  }
};
prototype$s.transform = function(input, reset) {
  vegaLogging.debug(input, ['folding']);
  var fold = this,
      on = this.param('fields'),
      output = src.ChangeSet.create(input);
  if (reset) this._reset(input, output);
  this._fn(input.add, on, output.add);
  this._fn(input.mod, on, reset ? output.add : output.mod);
  input.rem.forEach(function(x) {
    output.rem.push.apply(output.rem, fold._cache[x._id]);
    fold._cache[x._id] = null;
  });
  if (input.add.length || input.rem.length ||
      on.field.some(function(f) { return !!input.fields[f]; })) {
    output.fields[this._output.key] = 1;
    output.fields[this._output.value] = 1;
  }
  return output;
};
var Fold_1 = Fold;
Fold.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Fold transform",
  "description": "Collapse (\"fold\") one or more data properties into two properties.",
  "type": "object",
  "properties": {
    "type": {"enum": ["fold"]},
    "fields": {
      "oneOf": [
        {
          "type": "array",
          "description": "An array of field references indicating the data properties to fold.",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]},
          "minItems": 1,
          "uniqueItems": true
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "key": {"type": "string", "default": "key"},
        "value": {"type": "string", "default": "value"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "fields"]
};

var screen = {
  size:   [{signal: 'width'}, {signal: 'height'}],
  mid:    [{expr: 'width/2'}, {expr: 'height/2'}],
  extent: [
    {expr: '[-padding.left, -padding.top]'},
    {expr: '[width+padding.right, height+padding.bottom]'}
  ]
};

var Tuple$a = src.Tuple,
    ChangeSet$3 = src.ChangeSet;
function Force(graph) {
  Transform_1.prototype.init.call(this, graph);
  this._prev = null;
  this._interactive = false;
  this._setup = true;
  this._nodes  = [];
  this._links = [];
  this._layout = d3.layout.force();
  Transform_1.addParameters(this, {
    size: {type: 'array<value>', default: screen.size},
    bound: {type: 'value', default: true},
    links: {type: 'data'},
    linkStrength: {type: 'value', default: 1},
    linkDistance: {type: 'value', default: 20},
    charge: {type: 'value', default: -30},
    chargeDistance: {type: 'value', default: Infinity},
    friction: {type: 'value', default: 0.9},
    theta: {type: 'value', default: 0.8},
    gravity: {type: 'value', default: 0.1},
    alpha: {type: 'value', default: 0.1},
    iterations: {type: 'value', default: 500},
    interactive: {type: 'value', default: this._interactive},
    active: {type: 'value', default: this._prev},
    fixed: {type: 'data'}
  });
  this._output = {
    'x': 'layout_x',
    'y': 'layout_y'
  };
  return this.mutates(true);
}
var prototype$t = (Force.prototype = Object.create(Transform_1.prototype));
prototype$t.constructor = Force;
prototype$t.transform = function(nodeInput, reset) {
  vegaLogging.debug(nodeInput, ['force']);
  reset = reset - (nodeInput.signals.active ? 1 : 0);
  var interactive = this.param('interactive'),
      linkSource = this.param('links').source,
      linkInput = linkSource.last(),
      active = this.param('active'),
      output = this._output,
      layout = this._layout,
      nodes = this._nodes,
      links = this._links;
  if (linkInput.stamp < nodeInput.stamp) linkInput = null;
  this.configure(nodeInput, linkInput, interactive, reset);
  if (!interactive) {
    var iterations = this.param('iterations');
    for (var i=0; i<iterations; ++i) layout.tick();
    layout.stop();
  }
  this.update(active);
  if (reset || active !== this._prev && active && active.update) {
    layout.alpha(this.param('alpha'));
  }
  if (active !== this._prev) {
    this._prev = active;
  }
  if (nodeInput.rem.length) {
    layout.nodes(this._nodes = Tuple$a.idFilter(nodes, nodeInput.rem));
  }
  if (linkInput && linkInput.rem.length) {
    layout.links(this._links = Tuple$a.idFilter(links, linkInput.rem));
  }
  nodeInput.fields[output.x] = 1;
  nodeInput.fields[output.y] = 1;
  return nodeInput;
};
prototype$t.configure = function(nodeInput, linkInput, interactive, reset) {
  var layout = this._layout,
      update = this._setup || nodeInput.add.length ||
            linkInput && linkInput.add.length ||
            interactive !== this._interactive ||
            this.param('charge') !== layout.charge() ||
            this.param('linkStrength') !== layout.linkStrength() ||
            this.param('linkDistance') !== layout.linkDistance();
  if (update || reset) {
    layout
      .size(this.param('size'))
      .chargeDistance(this.param('chargeDistance'))
      .theta(this.param('theta'))
      .gravity(this.param('gravity'))
      .friction(this.param('friction'));
  }
  if (!update) return;
  this._setup = false;
  this._interactive = interactive;
  var force = this,
      graph = this._graph,
      nodes = this._nodes,
      links = this._links, a, i;
  for (a=nodeInput.add, i=0; i<a.length; ++i) {
    nodes.push({tuple: a[i]});
  }
  if (linkInput) for (a=linkInput.add, i=0; i<a.length; ++i) {
    links.push({
      tuple:  a[i],
      source: nodes[a[i].source],
      target: nodes[a[i].target]
    });
  }
  var tickHandler = !interactive ? null : function() {
    graph.propagate(ChangeSet$3.create(null, true), force);
  };
  layout
    .linkStrength(this.param('linkStrength'))
    .linkDistance(this.param('linkDistance'))
    .charge(this.param('charge'))
    .nodes(nodes)
    .links(links)
    .on('tick', tickHandler)
    .start().alpha(this.param('alpha'));
};
prototype$t.update = function(active) {
  var output = this._output,
      bound = this.param('bound'),
      fixed = this.param('fixed'),
      size = this.param('size'),
      nodes = this._nodes,
      lut = {}, id, i, n, t, x, y;
  if (fixed && fixed.source) {
    fixed = fixed.source.values();
    for (i=0, n=fixed.length; i<n; ++i) {
      lut[fixed[i].id] = 1;
    }
  }
  for (i=0; i<nodes.length; ++i) {
    n = nodes[i];
    t = n.tuple;
    id = t._id;
    if (active && active.id === id) {
      n.fixed = 1;
      if (active.update) {
        n.x = n.px = active.x;
        n.y = n.py = active.y;
      }
    } else {
      n.fixed = lut[id] || 0;
    }
    x = bound ? Math.max(0, Math.min(n.x, size[0])) : n.x;
    y = bound ? Math.max(0, Math.min(n.y, size[1])) : n.y;
    Tuple$a.set(t, output.x, x);
    Tuple$a.set(t, output.y, y);
  }
};
var Force_1 = Force;
Force.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Force transform",
  "description": "Performs force-directed layout for network data.",
  "type": "object",
  "properties": {
    "type": {"enum": ["force"]},
    "size": {
      "description": "The dimensions [width, height] of this force layout.",
      "oneOf": [
        {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [500, 500]
    },
    "links": {
      "type": "string",
      "description": "The name of the link (edge) data set."
    },
    "linkDistance": {
      "description": "Determines the length of edges, in pixels.",
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": 20
    },
    "linkStrength": {
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "Determines the tension of edges (the spring constant).",
      "default": 1
    },
    "charge": {
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The strength of the charge each node exerts.",
      "default": -30
    },
    "chargeDistance": {
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "description": "The maximum distance over which charge forces are applied.",
      "default": Infinity
    },
    "iterations": {
      "description": "The number of iterations to run the force directed layout.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 500
    },
    "friction": {
      "description": "The strength of the friction force used to stabilize the layout.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.9
    },
    "theta": {
      "description": "The theta parameter for the Barnes-Hut algorithm, which is used to compute charge forces between nodes.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.8
    },
    "gravity": {
      "description": "The strength of the pseudo-gravity force that pulls nodes towards the center of the layout area.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.1
    },
    "alpha": {
      "description": "A \"temperature\" parameter that determines how much node positions are adjusted at each step.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.1
    },
    "interactive": {
      "description": "Enables an interactive force-directed layout.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "active": {
      "description": "A signal representing the active node.",
      "$ref": "#/refs/signal"
    },
    "fixed": {
      "description": "The name of a datasource containing the IDs of nodes with fixed positions.",
      "type": "string"
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "links"]
};

var Tuple$b = src.Tuple;
function Formula(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    field: {type: 'value'},
    expr:  {type: 'expr'}
  });
  return this.mutates(true);
}
var prototype$u = (Formula.prototype = Object.create(Transform_1.prototype));
prototype$u.constructor = Formula;
prototype$u.transform = function(input) {
  vegaLogging.debug(input, ['formulating']);
  var field = this.param('field'),
      expr = this.param('expr'),
      updated = false;
  function set(x) {
    Tuple$b.set(x, field, expr(x));
    updated = true;
  }
  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }
  if (updated) input.fields[field] = 1;
  return input;
};
var Formula_1 = Formula;
Formula.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Formula transform",
  "description": "Extends data elements with new values according to a calculation formula.",
  "type": "object",
  "properties": {
    "type": {"enum": ["formula"]},
    "field": {
      "type": "string",
      "description": "The property name in which to store the computed formula value."
    },
    "expr": {
      "type": "string",
      "description": "A string containing an expression (in JavaScript syntax) for the formula."
    }
  },
  "required": ["type", "field", "expr"]
};

var Tuple$c = src.Tuple;
function Geo(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, Geo.Parameters);
  Transform_1.addParameters(this, {
    lon: {type: 'field'},
    lat: {type: 'field'}
  });
  this._output = {
    'x': 'layout_x',
    'y': 'layout_y'
  };
  return this.mutates(true);
}
Geo.Parameters = {
  projection: {type: 'value', default: 'mercator'},
  center:     {type: 'array<value>'},
  translate:  {type: 'array<value>', default: screen.center},
  rotate:     {type: 'array<value>'},
  scale:      {type: 'value'},
  precision:  {type: 'value'},
  clipAngle:  {type: 'value'},
  clipExtent: {type: 'value'}
};
Geo.d3Projection = function() {
  var p = this.param('projection'),
      param = Geo.Parameters,
      proj, name, value;
  if (p !== this._mode) {
    this._mode = p;
    this._projection = d3.geo[p]();
  }
  proj = this._projection;
  for (name in param) {
    if (name === 'projection' || !proj[name]) continue;
    value = this.param(name);
    if (value === undefined || (datalib.isArray(value) && value.length === 0)) {
      continue;
    }
    if (value !== proj[name]()) {
      proj[name](value);
    }
  }
  return proj;
};
var prototype$v = (Geo.prototype = Object.create(Transform_1.prototype));
prototype$v.constructor = Geo;
prototype$v.transform = function(input) {
  vegaLogging.debug(input, ['geo']);
  var output = this._output,
      lon = this.param('lon').accessor,
      lat = this.param('lat').accessor,
      proj = Geo.d3Projection.call(this);
  function set(t) {
    var ll = [lon(t), lat(t)];
    var xy = proj(ll) || [null, null];
    Tuple$c.set(t, output.x, xy[0]);
    Tuple$c.set(t, output.y, xy[1]);
  }
  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  return input;
};
var Geo_1 = Geo;
Geo.baseSchema = {
  "projection": {
    "description": "The type of cartographic projection to use.",
    "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
    "default": "mercator"
  },
  "center": {
    "description": "The center of the projection.",
    "oneOf": [
      {
        "type": "array",
        "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
        "minItems": 2,
        "maxItems": 2
      },
      {"$ref": "#/refs/signal"}
    ]
  },
  "translate": {
    "description": "The translation of the projection.",
    "oneOf": [
      {
        "type": "array",
        "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
        "minItems": 2,
        "maxItems": 2
      },
      {"$ref": "#/refs/signal"}
    ]
  },
  "rotate": {
    "description": "The rotation of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "scale": {
    "description": "The scale of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "precision": {
    "description": "The desired precision of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "clipAngle": {
    "description": "The clip angle of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  },
  "clipExtent": {
    "description": "The clip extent of the projection.",
    "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
  }
};
Geo.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Geo transform",
  "description": "Performs a cartographic projection. Given longitude and latitude values, sets corresponding x and y properties for a mark.",
  "type": "object",
  "properties": datalib.extend({
    "type": {"enum": ["geo"]},
    "lon": {
      "description": "The input longitude values.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "lat": {
      "description": "The input latitude values.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"}
      },
      "additionalProperties": false
    }
  }, Geo.baseSchema),
  "required": ["type", "lon", "lat"],
  "additionalProperties": false
};

var Tuple$d = src.Tuple;
function GeoPath(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, Geo_1.Parameters);
  Transform_1.addParameters(this, {
    field: {type: 'field', default: null},
  });
  this._output = {
    'path': 'layout_path'
  };
  return this.mutates(true);
}
var prototype$w = (GeoPath.prototype = Object.create(Transform_1.prototype));
prototype$w.constructor = GeoPath;
prototype$w.transform = function(input) {
  vegaLogging.debug(input, ['geopath']);
  var output = this._output,
      geojson = this.param('field').accessor || datalib.identity,
      proj = Geo_1.d3Projection.call(this),
      path = d3.geo.path().projection(proj);
  function set(t) {
    Tuple$d.set(t, output.path, path(geojson(t)));
  }
  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }
  input.fields[output.path] = 1;
  return input;
};
var GeoPath_1 = GeoPath;
GeoPath.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "GeoPath transform",
  "description": "Creates paths for geographic regions, such as countries, states and counties.",
  "type": "object",
  "properties": datalib.extend({
    "type": {"enum": ["geopath"]},
    "field": {
      "description": "The data field containing GeoJSON Feature data.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "path": {"type": "string", "default": "layout_path"}
      },
      "additionalProperties": false
    }
  }, Geo_1.baseSchema),
  "required": ["type"],
  "additionalProperties": false
};

var Tuple$e = src.Tuple;
function Hierarchy(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    sort: {type: 'array<field>', default: null},
    children: {type: 'field', default: 'children'},
    parent: {type: 'field', default: 'parent'},
    field: {type: 'value', default: null},
    mode: {type: 'value', default: 'tidy'},
    size: {type: 'array<value>', default: screen.size},
    nodesize: {type: 'array<value>', default: null},
    orient: {type: 'value', default: 'cartesian'}
  });
  this._mode = null;
  this._output = {
    'x':      'layout_x',
    'y':      'layout_y',
    'width':  'layout_width',
    'height': 'layout_height',
    'depth':  'layout_depth'
  };
  return this.mutates(true);
}
var PARTITION = 'partition';
var SEPARATION = {
  cartesian: function(a, b) { return (a.parent === b.parent ? 1 : 2); },
  radial: function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; }
};
var prototype$x = (Hierarchy.prototype = Object.create(BatchTransform_1.prototype));
prototype$x.constructor = Hierarchy;
prototype$x.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['hierarchy layout']);
  var layout = this._layout,
      output = this._output,
      mode   = this.param('mode'),
      sort   = this.param('sort'),
      nodesz = this.param('nodesize'),
      parent = this.param('parent').accessor,
      root = data.filter(function(d) { return parent(d) === null; })[0];
  if (mode !== this._mode) {
    this._mode = mode;
    if (mode === 'tidy') mode = 'tree';
    layout = (this._layout = d3.layout[mode]());
  }
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.depth] = 1;
  if (mode === PARTITION) {
    input.fields[output.width] = 1;
    input.fields[output.height] = 1;
    layout.value(this.param('field').accessor);
  } else {
    layout.separation(SEPARATION[this.param('orient')]);
  }
  if (nodesz.length && mode !== PARTITION) {
    layout.nodeSize(nodesz);
  } else {
    layout.size(this.param('size'));
  }
  layout
    .sort(sort.field.length ? datalib.comparator(sort.field) : null)
    .children(this.param('children').accessor)
    .nodes(root);
  data.forEach(function(n) {
    Tuple$e.set(n, output.x, n.x);
    Tuple$e.set(n, output.y, n.y);
    Tuple$e.set(n, output.depth, n.depth);
    if (mode === PARTITION) {
      Tuple$e.set(n, output.width, n.dx);
      Tuple$e.set(n, output.height, n.dy);
    }
  });
  return input;
};
var Hierarchy_1 = Hierarchy;
Hierarchy.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Hierarchy transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["hierarchy"]},
    "sort": {
      "description": "A list of fields to use as sort criteria for sibling nodes.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "children": {
      "description": "The data field for the children node array",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "children"
    },
    "parent": {
      "description": "The data field for the parent node",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "parent"
    },
    "field": {
      "description": "The value for the area of each leaf-level node for partition layouts.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "mode": {
      "description": "The layout algorithm mode to use.",
      "oneOf": [
        {"enum": ["tidy", "cluster", "partition"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "tidy"
    },
    "orient": {
      "description": "The layout orientation to use.",
      "oneOf": [
        {"enum": ["cartesian", "radial"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "cartesian"
    },
    "size": {
      "description": "The dimensions of the tree layout",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [500, 500]
    },
    "nodesize": {
      "description": "Sets a fixed x,y size for each node (overrides the size parameter)",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": null
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"},
        "width": {"type": "string", "default": "layout_width"},
        "height": {"type": "string", "default": "layout_height"},
        "depth": {"type": "string", "default": "layout_depth"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

var Tuple$f = src.Tuple;
function Impute(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    groupby: {type: 'array<field>'},
    orderby: {type: 'array<field>'},
    field:   {type: 'field'},
    method:  {type: 'value', default: 'value'},
    value:   {type: 'value', default: 0}
  });
  return this.router(true).produces(true);
}
var prototype$y = (Impute.prototype = Object.create(BatchTransform_1.prototype));
prototype$y.constructor = Impute;
prototype$y.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['imputing']);
  var groupby = this.param('groupby'),
      orderby = this.param('orderby'),
      method = this.param('method'),
      value = this.param('value'),
      field = this.param('field'),
      get = field.accessor,
      name = field.field,
      prev = this._imputed || [], curr = [],
      groups = partition(data, groupby.accessor, orderby.accessor),
      domain = groups.domain,
      group, i, j, n, m, t;
  function getval(x) {
    return x == null ? null : get(x);
  }
  for (j=0, m=groups.length; j<m; ++j) {
    group = groups[j];
    if (method !== 'value') {
      value = datalib[method](group, getval);
    }
    for (i=0, n=group.length; i<n; ++i) {
      if (group[i] == null) {
        t = tuple(groupby.field, group.values, orderby.field, domain[i]);
        t[name] = value;
        curr.push(t);
      }
    }
  }
  for (i=0, n=curr.length; i<n; ++i) {
    input.add.push(curr[i]);
  }
  for (i=0, n=prev.length; i<n; ++i) {
    input.rem.push(prev[i]);
  }
  this._imputed = curr;
  return input;
};
function tuple(gb, gv, ob, ov) {
  var t = {_imputed: true}, i;
  for (i=0; i<gv.length; ++i) t[gb[i]] = gv[i];
  for (i=0; i<ov.length; ++i) t[ob[i]] = ov[i];
  return Tuple$f.ingest(t);
}
function partition(data, groupby, orderby) {
  var groups = [],
      get = function(f) { return f(x); },
      val = function(d) { return (x=d, orderby.map(get)); },
      map, i, x, k, g, domain, lut, N;
  domain = groups.domain = datalib.unique(data, val);
  N = domain.length;
  lut = domain.reduce(function(m, d, i) {
    return (m[d] = {value:d, index:i}, m);
  }, {});
  for (map={}, i=0; i<data.length; ++i) {
    x = data[i];
    k = groupby == null ? [] : groupby.map(get);
    g = map[k] || (groups.push(map[k] = Array(N)), map[k].values = k, map[k]);
    g[lut[val(x)].index] = x;
  }
  return groups;
}
var Impute_1 = Impute;
Impute.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Impute transform",
  "description": "Performs imputation of missing values.",
  "type": "object",
  "properties": {
    "type": {"enum": ["impute"]},
    "method": {
      "description": "The imputation method to use.",
      "oneOf": [
        {"enum": ["value", "mean", "median", "min", "max"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "value"
    },
    "value": {
      "description": "The value to use for missing data if the method is 'value'.",
      "oneOf": [
        {"type": "number"},
        {"type": "string"},
        {"type": "boolean"},
        {"type": "null"},
        {"$ref": "#/refs/signal"}
      ],
      "default": 0
    },
    "field": {
      "description": "The data field to impute.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "groupby": {
      "description": "A list of fields to group the data into series.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    },
    "orderby": {
      "description": "A list of fields to determine ordering within series.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby", "orderby", "field"]
};

var Tuple$g = src.Tuple;
function Lookup(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    on:      {type: 'data'},
    onKey:   {type: 'field', default: null},
    as:      {type: 'array<value>'},
    keys:    {type: 'array<field>', default: ['data']},
    default: {type: 'value'}
  });
  return this.mutates(true);
}
var prototype$z = (Lookup.prototype = Object.create(Transform_1.prototype));
prototype$z.constructor = Lookup;
prototype$z.transform = function(input, reset) {
  vegaLogging.debug(input, ['lookup']);
  var on = this.param('on'),
      onLast = on.source.last(),
      onData = on.source.values(),
      onKey = this.param('onKey'),
      onF = onKey.field,
      keys = this.param('keys'),
      get = keys.accessor,
      as = this.param('as'),
      defaultValue = this.param('default'),
      lut = this._lut,
      i, v;
  if (lut == null || this._on !== onF || onF && onLast.fields[onF] ||
      onLast.add.length || onLast.rem.length)
  {
    if (onF) {
      onKey = onKey.accessor;
      for (lut={}, i=0; i<onData.length; ++i) {
        lut[onKey(v = onData[i])] = v;
      }
    } else {
      lut = onData;
    }
    this._lut = lut;
    this._on = onF;
    reset = true;
  }
  function set(t) {
    for (var i=0; i<get.length; ++i) {
      var v = lut[get[i](t)] || defaultValue;
      Tuple$g.set(t, as[i], v);
    }
  }
  input.add.forEach(set);
  var run = keys.field.some(function(f) { return input.fields[f]; });
  if (run || reset) {
    input.mod.forEach(set);
    input.rem.forEach(set);
  }
  as.forEach(function(k) { input.fields[k] = 1; });
  return input;
};
var Lookup_1 = Lookup;
Lookup.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Lookup transform",
  "description": "Extends a data set by looking up values in another data set.",
  "type": "object",
  "properties": {
    "type": {"enum": ["lookup"]},
    "on": {
      "type": "string",
      "description": "The name of the secondary data set on which to lookup values."
    },
    "onKey": {
      "description": "The key field to lookup, or null for index-based lookup.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "keys": {
      "description": "One or more fields in the primary data set to match against the secondary data set.",
      "type": "array",
      "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
    },
    "as": {
      "type": "array",
      "description": "The names of the fields in which to store looked-up values.",
      "items": {"type": "string"}
    },
    "default": {
      "description": "The default value to use if a lookup match fails."
    }
  },
  "required": ["type", "on", "as", "keys"],
  "additionalProperties": false
};

var Tuple$h = src.Tuple;
function Pie(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    field:      {type: 'field', default: null},
    startAngle: {type: 'value', default: 0},
    endAngle:   {type: 'value', default: 2 * Math.PI},
    sort:       {type: 'value', default: false}
  });
  this._output = {
    'start': 'layout_start',
    'end':   'layout_end',
    'mid':   'layout_mid'
  };
  return this.mutates(true);
}
var prototype$A = (Pie.prototype = Object.create(BatchTransform_1.prototype));
prototype$A.constructor = Pie;
function ones() { return 1; }
prototype$A.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['pie']);
  var output = this._output,
      field = this.param('field').accessor || ones,
      start = this.param('startAngle'),
      stop = this.param('endAngle'),
      sort = this.param('sort');
  var values = data.map(field),
      a = start,
      k = (stop - start) / datalib.sum(values),
      index = datalib.range(data.length),
      i, t, v;
  if (sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }
  for (i=0; i<index.length; ++i) {
    t = data[index[i]];
    v = values[index[i]];
    Tuple$h.set(t, output.start, a);
    Tuple$h.set(t, output.mid, (a + 0.5 * v * k));
    Tuple$h.set(t, output.end, (a += v * k));
  }
  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};
var Pie_1 = Pie;
Pie.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Pie transform",
  "description": "Computes a pie chart layout.",
  "type": "object",
  "properties": {
    "type": {"enum": ["pie"]},
    "field": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The data values to encode as angular spans. " +
        "If this property is omitted, all pie slices will have equal spans."
    },
    "startAngle": {
      "oneOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 2 * Math.PI
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": 0
    },
    "endAngle": {
      "oneOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 2 * Math.PI
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": 2 * Math.PI,
    },
    "sort": {
      "description": " If true, will sort the data prior to computing angles.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "start": {"type": "string", "default": "layout_start"},
        "end": {"type": "string", "default": "layout_end"},
        "mid": {"type": "string", "default": "layout_mid"}
      }
    }
  },
  "required": ["type"]
};

var Tuple$i = src.Tuple;
function Rank(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    field: {type: 'field', default: null},
    normalize: {type: 'value', default: false}
  });
  this._output = {
    'rank': 'rank'
  };
  return this.mutates(true);
}
var prototype$B = (Rank.prototype = Object.create(BatchTransform_1.prototype));
prototype$B.constructor = Rank;
prototype$B.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['rank']);
  var rank  = this._output.rank,
      norm  = this.param('normalize'),
      field = this.param('field').accessor,
      keys = {},
      i, len = data.length, klen, d, f;
  if (field) {
    for (i=0, klen=0; i<len; ++i) {
      d = data[i];
      keys[f=field(d)] = keys[f] || (keys[f] = ++klen);
    }
  }
  for (i=0; i<len && (d=data[i]); ++i) {
    if (field && (f=field(d))) {
      Tuple$i.set(d, rank, norm ? keys[f] / klen : keys[f]);
    } else {
      Tuple$i.set(d, rank, norm ? (i+1) / len : (i+1));
    }
  }
  input.fields[rank] = 1;
  return input;
};
var Rank_1 = Rank;
Rank.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Rank transform",
  "description": "Computes ascending rank scores for data tuples.",
  "type": "object",
  "properties": {
    "type": {"enum": ["rank"]},
    "field": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "A key field to used to rank tuples. " +
        "If undefined, tuples will be ranked in their observed order."
    },
    "normalize": {
      "description": "If true, values of the output field will lie in the range [0, 1].",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "rank": {"type": "string", "default": "rank"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

function Sort(graph) {
  Transform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {by: {type: 'array<field>'} });
  this.router(true);
}
var prototype$C = (Sort.prototype = Object.create(Transform_1.prototype));
prototype$C.constructor = Sort;
prototype$C.transform = function(input) {
  vegaLogging.debug(input, ['sorting']);
  if (input.add.length || input.mod.length || input.rem.length) {
    input.sort = datalib.comparator(this.param('by').field);
  }
  return input;
};
var Sort_1 = Sort;
Sort.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Sort transform",
  "description": "Sorts the values of a data set.",
  "type": "object",
  "properties": {
    "type": {"enum": ["sort"]},
    "by": {
      "oneOf": [
        {"type": "string"},
        {"type": "array", "items": {"type": "string"}}
      ],
      "description": "A list of fields to use as sort criteria."
    }
  },
  "required": ["type", "by"]
};

var Tuple$j = src.Tuple;
function Stack(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    groupby: {type: 'array<field>'},
    sortby: {type: 'array<field>'},
    field: {type: 'field'},
    offset: {type: 'value', default: 'zero'}
  });
  this._output = {
    'start': 'layout_start',
    'end':   'layout_end',
    'mid':   'layout_mid'
  };
  return this.mutates(true);
}
var prototype$D = (Stack.prototype = Object.create(BatchTransform_1.prototype));
prototype$D.constructor = Stack;
prototype$D.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['stacking']);
  var groupby = this.param('groupby').accessor,
      sortby = datalib.comparator(this.param('sortby').field),
      field = this.param('field').accessor,
      offset = this.param('offset'),
      output = this._output;
  var groups = partition$1(data, groupby, sortby, field);
  for (var i=0, max=groups.max; i<groups.length; ++i) {
    var group = groups[i],
        sum = group.sum,
        off = offset==='center' ? (max - sum)/2 : 0,
        scale = offset==='normalize' ? (1/sum) : 1,
        j, x, a, b = off, v = 0;
    for (j=0; j<group.length; ++j) {
      x = group[j];
      a = b;
      v += field(x);
      b = scale * v + off;
      Tuple$j.set(x, output.start, a);
      Tuple$j.set(x, output.end, b);
      Tuple$j.set(x, output.mid, 0.5 * (a + b));
    }
  }
  input.fields[output.start] = 1;
  input.fields[output.end] = 1;
  input.fields[output.mid] = 1;
  return input;
};
function partition$1(data, groupby, sortby, field) {
  var groups = [],
      get = function(f) { return f(x); },
      map, i, x, k, g, s, max;
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0; i<data.length; ++i) {
      x = data[i];
      k = groupby.map(get);
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(x);
    }
  }
  for (k=0, max=0; k<groups.length; ++k) {
    g = groups[k];
    for (i=0, s=0; i<g.length; ++i) {
      s += field(g[i]);
    }
    g.sum = s;
    if (s > max) max = s;
    if (sortby != null) g.sort(sortby);
  }
  groups.max = max;
  return groups;
}
var Stack_1 = Stack;
Stack.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Stack transform",
  "description": "Computes layout values for stacked graphs, as in stacked bar charts or stream graphs.",
  "type": "object",
  "properties": {
    "type": {"enum": ["stack"]},
    "groupby": {
      "description": "A list of fields to split the data into groups (stacks).",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    },
    "sortby": {
      "description": "A list of fields to determine the sort order of stacks.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
    },
    "field": {
      "description": "The data field that determines the thickness/height of stacks.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "offset": {
      "description": "The baseline offset",
      "oneOf": [{"enum": ["zero", "center", "normalize"]}, {"$ref": "#/refs/signal"}],
      "default": "zero"
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "start": {"type": "string", "default": "layout_start"},
        "end": {"type": "string", "default": "layout_end"},
        "mid": {"type": "string", "default": "layout_mid"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby", "field"]
};

var Tuple$k = src.Tuple;
function Treeify(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    groupby: {type: 'array<field>'}
  });
  this._output = {
    'children': 'children',
    'parent':   'parent'
  };
  return this.router(true).produces(true);
}
var prototype$E = (Treeify.prototype = Object.create(BatchTransform_1.prototype));
prototype$E.constructor = Treeify;
prototype$E.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['treeifying']);
  var fields = this.param('groupby').field,
      childField = this._output.children,
      parentField = this._output.parent,
      summary = [{name:'*', ops: ['values'], as: [childField]}],
      aggrs = fields.map(function(f) {
        return datalib.groupby(f).summarize(summary);
      }),
      prev = this._internal || [], curr = [], i, n;
  function level(index, node, values) {
    var vals = aggrs[index].execute(values);
    node[childField] = vals;
    vals.forEach(function(n) {
      n[parentField] = node;
      curr.push(Tuple$k.ingest(n));
      if (index+1 < fields.length) level(index+1, n, n[childField]);
      else n[childField].forEach(function(c) { c[parentField] = n; });
    });
  }
  var root = Tuple$k.ingest({});
  root[parentField] = null;
  curr.push(root);
  level(0, root, data);
  for (i=0, n=curr.length; i<n; ++i) {
    input.add.push(curr[i]);
  }
  for (i=0, n=prev.length; i<n; ++i) {
    input.rem.push(prev[i]);
  }
  this._internal = curr;
  return input;
};
var Treeify_1 = Treeify;
Treeify.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Treeify transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["treeify"]},
    "groupby": {
      "description": "An ordered list of fields by which to group tuples into a tree.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "children": {"type": "string", "default": "children"},
        "parent": {"type": "string", "default": "parent"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby"]
};

var Tuple$l = src.Tuple;
var defaultRatio = 0.5 * (1 + Math.sqrt(5));
function Treemap(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    sort: {type: 'array<field>', default: ['-value']},
    children: {type: 'field', default: 'children'},
    parent: {type: 'field', default: 'parent'},
    field: {type: 'field', default: 'value'},
    size: {type: 'array<value>', default: screen.size},
    round: {type: 'value', default: true},
    sticky: {type: 'value', default: false},
    ratio: {type: 'value', default: defaultRatio},
    padding: {type: 'value', default: null},
    mode: {type: 'value', default: 'squarify'}
  });
  this._layout = d3.layout.treemap();
  this._output = {
    'x':      'layout_x',
    'y':      'layout_y',
    'width':  'layout_width',
    'height': 'layout_height',
    'depth':  'layout_depth',
  };
  return this.mutates(true);
}
var prototype$F = (Treemap.prototype = Object.create(BatchTransform_1.prototype));
prototype$F.constructor = Treemap;
prototype$F.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['treemap']);
  var layout = this._layout,
      output = this._output,
      sticky = this.param('sticky'),
      parent = this.param('parent').accessor,
      root = data.filter(function(d) { return parent(d) === null; })[0];
  if (layout.sticky() !== sticky) { layout.sticky(sticky); }
  layout
    .sort(datalib.comparator(this.param('sort').field))
    .children(this.param('children').accessor)
    .value(this.param('field').accessor)
    .size(this.param('size'))
    .round(this.param('round'))
    .ratio(this.param('ratio'))
    .padding(this.param('padding'))
    .mode(this.param('mode'))
    .nodes(root);
  data.forEach(function(n) {
    Tuple$l.set(n, output.x, n.x);
    Tuple$l.set(n, output.y, n.y);
    Tuple$l.set(n, output.width, n.dx);
    Tuple$l.set(n, output.height, n.dy);
    Tuple$l.set(n, output.depth, n.depth);
  });
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.width] = 1;
  input.fields[output.height] = 1;
  input.fields[output.depth] = 1;
  return input;
};
var Treemap_1 = Treemap;
Treemap.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Treemap transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["treemap"]},
    "sort": {
      "description": "A list of fields to use as sort criteria for sibling nodes.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": ["-value"]
    },
    "children": {
      "description": "The data field for the children node array",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "children"
    },
    "parent": {
      "description": "The data field for the parent node",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "parent"
    },
    "field": {
      "description": "The values to use to determine the area of each leaf-level treemap cell.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "mode": {
      "description": "The treemap layout algorithm to use.",
      "oneOf": [
        {"enum": ["squarify", "slice", "dice", "slice-dice"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "squarify"
    },
    "size": {
      "description": "The dimensions of the treemap layout",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [500, 500]
    },
    "round": {
      "description": "If true, treemap cell dimensions will be rounded to integer pixels.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": true
    },
    "sticky": {
      "description": "If true, repeated runs of the treemap will use cached partition boundaries.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "ratio": {
      "description": "The target aspect ratio for the layout to optimize.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": defaultRatio
    },
    "padding": {
      "oneOf": [
        {"type": "number"},
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 4,
          "maxItems": 4
        },
        {"$ref": "#/refs/signal"}
      ],
      "description": "he padding (in pixels) to provide around internal nodes in the treemap."
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"},
        "width": {"type": "string", "default": "layout_width"},
        "height": {"type": "string", "default": "layout_height"},
        "depth": {"type": "string", "default": "layout_depth"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

function Voronoi(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    clipExtent: {type: 'array<value>', default: screen.extent},
    x: {type: 'field', default: 'layout_x'},
    y: {type: 'field', default: 'layout_y'}
  });
  this._layout = d3.geom.voronoi();
  this._output = {'path': 'layout_path'};
  return this.mutates(true);
}
var prototype$G = (Voronoi.prototype = Object.create(BatchTransform_1.prototype));
prototype$G.constructor = Voronoi;
prototype$G.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['voronoi']);
  var pathname = this._output.path;
  var polygons = this._layout
    .clipExtent(this.param('clipExtent'))
    .x(this.param('x').accessor)
    .y(this.param('y').accessor)
    (data);
  for (var i=0; i<data.length; ++i) {
    if (polygons[i]) Tuple.set(data[i], pathname, 'M' + polygons[i].join('L') + 'Z');
  }
  input.fields[pathname] = 1;
  return input;
};
var Voronoi_1 = Voronoi;
Voronoi.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Voronoi transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["voronoi"]},
    "clipExtent": {
      "description": "The min and max points at which to clip the voronoi diagram.",
      "oneOf": [
        {
          "type": "array",
          "items": {
            "oneOf": [
              {
                "type": "array",
                "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
                "minItems": 2,
                "maxItems": 2
              },
              {"$ref": "#/refs/signal"}
            ]
          },
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [[-1e5,-1e5],[1e5,1e5]]
    },
    "x": {
      "description": "The input x coordinates.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "y": {
      "description": "The input y coordinates.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "path": {"type": "string", "default": "layout_path"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

var canvas$2 = src$1.canvas;
function Wordcloud(graph) {
  BatchTransform_1.prototype.init.call(this, graph);
  Transform_1.addParameters(this, {
    size: {type: 'array<value>', default: screen.size},
    text: {type: 'field', default: 'data'},
    rotate: {type: 'field|value', default: 0},
    font: {type: 'field|value', default: {value: 'sans-serif'}},
    fontSize: {type: 'field|value', default: 14},
    fontStyle: {type: 'field|value', default: {value: 'normal'}},
    fontWeight: {type: 'field|value', default: {value: 'normal'}},
    fontScale: {type: 'array<value>', default: [10, 50]},
    padding: {type: 'value', default: 1},
    spiral: {type: 'value', default: 'archimedean'}
  });
  this._layout = d3Cloud().canvas(canvas$2.instance);
  this._output = {
    'x':          'layout_x',
    'y':          'layout_y',
    'font':       'layout_font',
    'fontSize':   'layout_fontSize',
    'fontStyle':  'layout_fontStyle',
    'fontWeight': 'layout_fontWeight',
    'rotate':     'layout_rotate',
  };
  return this.mutates(true);
}
var prototype$H = (Wordcloud.prototype = Object.create(BatchTransform_1.prototype));
prototype$H.constructor = Wordcloud;
function get$1(p) {
  return (p && p.accessor) || p;
}
function wrap(tuple) {
  var x = Object.create(tuple);
  x._tuple = tuple;
  return x;
}
prototype$H.batchTransform = function(input, data) {
  vegaLogging.debug(input, ['wordcloud']);
  var layout = this._layout,
      output = this._output,
      fontSize = this.param('fontSize'),
      range = fontSize.accessor && this.param('fontScale'),
      size, scale;
  fontSize = fontSize.accessor || d3.functor(fontSize);
  if (range.length) {
    scale = d3.scale.sqrt()
      .domain(datalib.extent(data, size=fontSize))
      .range(range);
    fontSize = function(x) { return scale(size(x)); };
  }
  layout
    .size(this.param('size'))
    .text(get$1(this.param('text')))
    .padding(this.param('padding'))
    .spiral(this.param('spiral'))
    .rotate(get$1(this.param('rotate')))
    .font(get$1(this.param('font')))
    .fontStyle(get$1(this.param('fontStyle')))
    .fontWeight(get$1(this.param('fontWeight')))
    .fontSize(fontSize)
    .words(data.map(wrap))
    .on('end', function(words) {
      var size = layout.size(),
          dx = size[0] >> 1,
          dy = size[1] >> 1,
          w, t, i, len;
      for (i=0, len=words.length; i<len; ++i) {
        w = words[i];
        t = w._tuple;
        Tuple.set(t, output.x, w.x + dx);
        Tuple.set(t, output.y, w.y + dy);
        Tuple.set(t, output.font, w.font);
        Tuple.set(t, output.fontSize, w.size);
        Tuple.set(t, output.fontStyle, w.style);
        Tuple.set(t, output.fontWeight, w.weight);
        Tuple.set(t, output.rotate, w.rotate);
      }
    })
    .start();
  for (var key in output) input.fields[output[key]] = 1;
  return input;
};
var Wordcloud_1 = Wordcloud;
Wordcloud.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Wordcloud transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["wordcloud"]},
    "size": {
      "description": "The dimensions of the wordcloud layout",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [900, 500]
    },
    "font": {
      "description": "The font face to use for a word.",
      "oneOf": [{"type": "string"}, Parameter_1.schema, {"$ref": "#/refs/signal"}],
      "default": "sans-serif"
    },
    "fontStyle": {
      "description": "The font style to use for a word.",
      "oneOf": [{"type": "string"}, Parameter_1.schema, {"$ref": "#/refs/signal"}],
      "default": "normal"
    },
    "fontWeight": {
      "description": "The font weight to use for a word.",
      "oneOf": [{"type": "string"}, Parameter_1.schema, {"$ref": "#/refs/signal"}],
      "default": "normal"
    },
    "fontSize": {
      "description": "The font size to use for a word.",
      "oneOf": [{"type": "number"}, Parameter_1.schema, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": 14
    },
    "fontScale": {
      "description": "The minimum and maximum scaled font sizes, or null to prevent scaling.",
      "oneOf": [
        { "type": "null" },
        {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {"oneOf": [{"type":"number"}, {"$ref": "#/refs/signal"}]}
        }
      ],
      "default": [10, 50]
    },
    "rotate": {
      "description": "The field or number to set the roration angle (in degrees).",
      "oneOf": [
        {"type": "number"}, {"type": "string"},
        Parameter_1.schema, {"$ref": "#/refs/signal"}
      ],
      "default": 0
    },
    "text": {
      "description": "The field containing the text to use for each word.",
      "oneOf": [{"type": "string"}, Parameter_1.schema, {"$ref": "#/refs/signal"}],
      "default": 'data'
    },
    "spiral": {
      "description": "The type of spiral used for positioning words, either 'archimedean' or 'rectangular'.",
      "oneOf": [{"enum": ["archimedean", "rectangular"]}, Parameter_1.schema, {"$ref": "#/refs/signal"}],
      "default": "archimedean"
    },
    "padding": {
      "description": "The padding around each word.",
      "oneOf": [{"type": "number"}, Parameter_1.schema, {"$ref": "#/refs/signal"}],
      "default": 1
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"},
        "font": {"type": "string", "default": "layout_font"},
        "fontSize": {"type": "string", "default": "layout_fontSize"},
        "fontStyle": {"type": "string", "default": "layout_fontStyle"},
        "fontWeight": {"type": "string", "default": "layout_fontWeight"},
        "rotate": {"type": "string", "default": "layout_rotate"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};

var transforms = {
  aggregate:    Aggregate_1,
  bin:          Bin_1,
  cross:        Cross_1,
  countpattern: CountPattern_1,
  linkpath:     LinkPath_1,
  facet:        Facet_1,
  filter:       Filter_1,
  fold:         Fold_1,
  force:        Force_1,
  formula:      Formula_1,
  geo:          Geo_1,
  geopath:      GeoPath_1,
  hierarchy:    Hierarchy_1,
  impute:       Impute_1,
  lookup:       Lookup_1,
  pie:          Pie_1,
  rank:         Rank_1,
  sort:         Sort_1,
  stack:        Stack_1,
  treeify:      Treeify_1,
  treemap:      Treemap_1,
  voronoi:      Voronoi_1,
  wordcloud:    Wordcloud_1
};

function parseTransforms(model, def) {
  var transform = transforms[def.type],
      tx;
  if (!transform) throw new Error('"' + def.type + '" is not a valid transformation');
  tx = new transform(model);
  if(def.output) tx.output(def.output);
  datalib.keys(def).forEach(function(k) {
    if(k === 'type' || k === 'output') return;
    tx.param(k, def[k]);
  });
  return tx;
}
var transforms_1$1 = parseTransforms;
var keys$1 = datalib.keys(transforms)
  .filter(function(k) { return transforms[k].schema; });
var defs = keys$1.reduce(function(acc, k) {
  return (acc[k+'Transform'] = transforms[k].schema, acc);
}, {});
parseTransforms.schema = {
  "defs": datalib.extend(defs, {
    "transform": {
      "type": "array",
      "items": {
        "oneOf": keys$1.map(function(k) {
          return {"$ref": "#/defs/"+k+"Transform"};
        })
      }
    }
  })
};

var Node$1 = src.Node,
    Tuple$m = src.Tuple,
    Deps$3 = src.Dependencies;
var Types = {
  INSERT: "insert",
  REMOVE: "remove",
  UPSERT: "upsert",
  TOGGLE: "toggle",
  CLEAR:  "clear"
};
var EMPTY$1 = [];
function filter(fields, value, src$$1, dest) {
  var splice = true, len = fields.length, i, j, f, v;
  for (i = src$$1.length - 1; i >= 0; --i) {
    for (j=0; j<len; ++j) {
      f = fields[j];
      v = value && f(value) || value;
      if (f(src$$1[i]) !== v) {
        splice = false;
        break;
      }
    }
    if (splice) dest.push.apply(dest, src$$1.splice(i, 1));
    splice = true;
  }
}
function insert(input, datum, source) {
  var t = Tuple$m.ingest(datum);
  input.add.push(t);
  source._data.push(t);
}
function parseModify(model, def, ds) {
  var signal = def.signal ? datalib.field(def.signal) : null,
      signalName  = signal ? signal[0] : null,
      predicate   = def.predicate ? model.predicate(def.predicate.name || def.predicate) : null,
      exprTrigger = def.test ? model.expr(def.test) : null,
      reeval  = (predicate === null && exprTrigger === null),
      isClear = def.type === Types.CLEAR,
      fields  = datalib.array(def.field || 'data'),
      getters = fields.map(datalib.accessor),
      setters = fields.map(datalib.mutator),
      node = new Node$1(model).router(isClear);
  node.evaluate = function(input) {
    var db, sg;
    if (predicate !== null) {
      db = model.values(Deps$3.DATA, predicate.data || EMPTY$1);
      sg = model.values(Deps$3.SIGNALS, predicate.signals || EMPTY$1);
      reeval = predicate.call(predicate, {}, db, sg, model._predicates);
    }
    if (exprTrigger !== null) {
      sg = model.values(Deps$3.SIGNALS, exprTrigger.globals || EMPTY$1);
      reeval = exprTrigger.fn();
    }
    vegaLogging.debug(input, [def.type+"ing", reeval]);
    if (!reeval || (!isClear && !input.signals[signalName])) return input;
    var value = signal ? model.signalRef(def.signal) : null,
        d = model.data(ds.name),
        t = null, add = [], rem = [], up = 0, datum;
    if (datalib.isObject(value)) {
      datum = value;
      if (!def.field) {
        fields = datalib.keys(datum);
        getters = fields.map(datalib.accessor);
        setters = fields.map(datalib.mutator);
      }
    } else {
      datum = {};
      setters.forEach(function(f) { f(datum, value); });
    }
    if (def.type === Types.INSERT) {
      insert(input, datum, d);
    } else if (def.type === Types.REMOVE) {
      filter(getters, value, input.mod, input.rem);
      filter(getters, value, input.add, rem);
      filter(getters, value, d._data, rem);
    } else if (def.type === Types.UPSERT) {
      input.mod.forEach(function(x) {
        var every = getters.every(function(f) {
          return f(x) === f(datum);
        });
        if (every) up = (datalib.extend(x, datum), up+1);
      });
      if (up === 0) insert(input, datum, d);
    } else if (def.type === Types.TOGGLE) {
      filter(getters, value, input.mod, rem);
      input.rem.push.apply(input.rem, rem);
      filter(getters, value, input.add, add);
      if (add.length || rem.length) {
        d._data = d._data.filter(function(x) {
          return rem.indexOf(x) < 0 && add.indexOf(x) < 0;
        });
      } else {
        input.add.push(t=Tuple$m.ingest(datum));
        d._data.push(t);
      }
    } else if (def.type === Types.CLEAR) {
      input.rem.push.apply(input.rem, input.mod.splice(0));
      input.add.splice(0);
      d._data.splice(0);
    }
    fields.forEach(function(f) { input.fields[f] = 1; });
    return input;
  };
  if (signalName) node.dependency(Deps$3.SIGNALS, signalName);
  if (predicate) {
    node.dependency(Deps$3.DATA, predicate.data);
    node.dependency(Deps$3.SIGNALS, predicate.signals);
  }
  if (exprTrigger) {
    node.dependency(Deps$3.SIGNALS, exprTrigger.globals);
    node.dependency(Deps$3.DATA,    exprTrigger.dataSources);
  }
  return node;
}
var modify = parseModify;
parseModify.schema = {
  "defs": {
    "modify": {
      "type": "array",
      "items": {
        "type": "object",
        "oneOf": [{
          "properties": {
            "type": {"enum": [
              Types.INSERT, Types.REMOVE, Types.UPSERT, Types.TOGGLE
            ]},
            "signal": {"type": "string"},
            "field": {"type": "string"}
          },
          "required": ["type", "signal"]
        }, {
          "properties": {
            "type": {"enum": [Types.CLEAR]},
            "predicate": {"type": "string"}
          },
          "required": ["type", "predicate"]
        },
        {
          "properties": {
            "type": {"enum": [Types.CLEAR]},
            "test": {"type": "string"}
          },
          "required": ["type", "test"]
        }]
      }
    }
  }
};

function parseData(model, spec, callback) {
  var config = model.config(),
      count = 0;
  function onError(error, d) {
    vegaLogging.error('PARSE DATA FAILED: ' + d.name + ' ' + error);
    count = -1;
    callback(error);
  }
  function onLoad(d) {
    return function(error, data) {
      if (error) {
        onError(error, d);
      } else if (count > 0) {
        try {
          model.data(d.name).values(datalib.read(data, d.format));
          if (--count === 0) callback();
        } catch (err) {
          onError(err, d);
        }
      }
    };
  }
  (spec || []).forEach(function(d) {
    if (d.url) {
      count += 1;
      datalib.load(datalib.extend({url: d.url}, config.load), onLoad(d));
    }
    try {
      parseData.datasource(model, d);
    } catch (err) {
      onError(err, d);
    }
  });
  if (count === 0) setTimeout(callback, 1);
  return spec;
}
parseData.datasource = function(model, d) {
  var transform = (d.transform || []).map(function(t) {
        return transforms_1$1(model, t);
      }),
      mod = (d.modify || []).map(function(m) {
        return modify(model, m, d);
      }),
      ds = model.data(d.name, mod.concat(transform));
  if (d.values) {
    ds.values(datalib.read(d.values, d.format));
  } else if (d.source) {
    ds.source(d.source).addListener(ds);
    model.removeListener(ds.pipeline()[0]);
  }
  return ds;
};
var data = parseData;
var parseDef = {
  "oneOf": [
    {"enum": ["auto"]},
    {
      "type": "object",
      "additionalProperties": {
        "enum": ["number", "boolean", "date", "string"]
      }
    }
  ]
};
parseData.schema = {
  "defs": {
    "data": {
      "title": "Input data set definition",
      "type": "object",
      "allOf": [{
        "properties": {
          "name": {"type": "string"},
          "transform": {"$ref": "#/defs/transform"},
          "modify": {"$ref": "#/defs/modify"},
          "format": {
            "type": "object",
            "oneOf": [{
              "properties": {
                "type": {"enum": ["json"]},
                "parse": parseDef,
                "property": {"type": "string"}
              },
              "additionalProperties": false
            }, {
              "properties": {
                "type": {"enum": ["csv", "tsv"]},
                "parse": parseDef
              },
              "additionalProperties": false
            }, {
              "oneOf": [{
                "properties": {
                  "type": {"enum": ["topojson"]},
                  "feature": {"type": "string"}
                },
                "additionalProperties": false
              }, {
                "properties": {
                  "type": {"enum": ["topojson"]},
                  "mesh": {"type": "string"}
                },
                "additionalProperties": false
              }]
            }, {
              "properties": {
                "type": {"enum": ["treejson"]},
                "children": {"type": "string"},
                "parse": parseDef
              },
              "additionalProperties": false
            }]
          }
        },
        "required": ["name"]
      }, {
        "anyOf": [{
          "required": ["name", "modify"]
        }, {
          "oneOf": [{
            "properties": {"source": {"type": "string"}},
            "required": ["source"]
          }, {
            "properties": {"values": {"type": "array"}},
            "required": ["values"]
          }, {
            "properties": {"url": {"type": "string"}},
            "required": ["url"]
          }]
        }]
      }]
    }
  }
};

var vegaEventSelector = (function() {
  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }
  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }
  peg$subclass(peg$SyntaxError, Error);
  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        peg$FAILED = {},
        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,
        peg$c0 = ",",
        peg$c1 = { type: "literal", value: ",", description: "\",\"" },
        peg$c2 = function(o, m) { return [o].concat(m); },
        peg$c3 = function(o) { return [o]; },
        peg$c4 = "[",
        peg$c5 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c6 = "]",
        peg$c7 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c8 = ">",
        peg$c9 = { type: "literal", value: ">", description: "\">\"" },
        peg$c10 = function(f1, f2, o) {
            return {
              start: f1, middle: o, end: f2,
              str: '['+f1.str+', '+f2.str+'] > '+o.str};
            },
        peg$c11 = function(s, f) {
            s.filters = f;
            s.str += f.map(function(x) { return '['+x+']'; }).join('');
            return s;
          },
        peg$c12 = function(s) { return s; },
        peg$c13 = "(",
        peg$c14 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c15 = ")",
        peg$c16 = { type: "literal", value: ")", description: "\")\"" },
        peg$c17 = function(m) {
            return {
              stream: m,
              str: '('+m.map(function(m) { return m.str; }).join(', ')+')'
            };
          },
        peg$c18 = "@",
        peg$c19 = { type: "literal", value: "@", description: "\"@\"" },
        peg$c20 = ":",
        peg$c21 = { type: "literal", value: ":", description: "\":\"" },
        peg$c22 = function(n, e) { return {event: e, name: n, str: '@'+n+':'+e}; },
        peg$c23 = function(m, e) { return {event: e, mark: m, str: m+':'+e}; },
        peg$c24 = function(t, e) { return {event: e, target: t, str: t+':'+e}; },
        peg$c25 = function(e) { return {event: e, str: e}; },
        peg$c26 = function(s) { return {signal: s, str: s}; },
        peg$c27 = "rect",
        peg$c28 = { type: "literal", value: "rect", description: "\"rect\"" },
        peg$c29 = "symbol",
        peg$c30 = { type: "literal", value: "symbol", description: "\"symbol\"" },
        peg$c31 = "path",
        peg$c32 = { type: "literal", value: "path", description: "\"path\"" },
        peg$c33 = "arc",
        peg$c34 = { type: "literal", value: "arc", description: "\"arc\"" },
        peg$c35 = "area",
        peg$c36 = { type: "literal", value: "area", description: "\"area\"" },
        peg$c37 = "line",
        peg$c38 = { type: "literal", value: "line", description: "\"line\"" },
        peg$c39 = "rule",
        peg$c40 = { type: "literal", value: "rule", description: "\"rule\"" },
        peg$c41 = "image",
        peg$c42 = { type: "literal", value: "image", description: "\"image\"" },
        peg$c43 = "text",
        peg$c44 = { type: "literal", value: "text", description: "\"text\"" },
        peg$c45 = "group",
        peg$c46 = { type: "literal", value: "group", description: "\"group\"" },
        peg$c47 = "mousedown",
        peg$c48 = { type: "literal", value: "mousedown", description: "\"mousedown\"" },
        peg$c49 = "mouseup",
        peg$c50 = { type: "literal", value: "mouseup", description: "\"mouseup\"" },
        peg$c51 = "click",
        peg$c52 = { type: "literal", value: "click", description: "\"click\"" },
        peg$c53 = "dblclick",
        peg$c54 = { type: "literal", value: "dblclick", description: "\"dblclick\"" },
        peg$c55 = "wheel",
        peg$c56 = { type: "literal", value: "wheel", description: "\"wheel\"" },
        peg$c57 = "keydown",
        peg$c58 = { type: "literal", value: "keydown", description: "\"keydown\"" },
        peg$c59 = "keypress",
        peg$c60 = { type: "literal", value: "keypress", description: "\"keypress\"" },
        peg$c61 = "keyup",
        peg$c62 = { type: "literal", value: "keyup", description: "\"keyup\"" },
        peg$c63 = "mousewheel",
        peg$c64 = { type: "literal", value: "mousewheel", description: "\"mousewheel\"" },
        peg$c65 = "mousemove",
        peg$c66 = { type: "literal", value: "mousemove", description: "\"mousemove\"" },
        peg$c67 = "mouseout",
        peg$c68 = { type: "literal", value: "mouseout", description: "\"mouseout\"" },
        peg$c69 = "mouseover",
        peg$c70 = { type: "literal", value: "mouseover", description: "\"mouseover\"" },
        peg$c71 = "mouseenter",
        peg$c72 = { type: "literal", value: "mouseenter", description: "\"mouseenter\"" },
        peg$c73 = "touchstart",
        peg$c74 = { type: "literal", value: "touchstart", description: "\"touchstart\"" },
        peg$c75 = "touchmove",
        peg$c76 = { type: "literal", value: "touchmove", description: "\"touchmove\"" },
        peg$c77 = "touchend",
        peg$c78 = { type: "literal", value: "touchend", description: "\"touchend\"" },
        peg$c79 = "dragenter",
        peg$c80 = { type: "literal", value: "dragenter", description: "\"dragenter\"" },
        peg$c81 = "dragover",
        peg$c82 = { type: "literal", value: "dragover", description: "\"dragover\"" },
        peg$c83 = "dragleave",
        peg$c84 = { type: "literal", value: "dragleave", description: "\"dragleave\"" },
        peg$c85 = function(e) { return e; },
        peg$c86 = /^[a-zA-Z0-9_\-]/,
        peg$c87 = { type: "class", value: "[a-zA-Z0-9_-]", description: "[a-zA-Z0-9_-]" },
        peg$c88 = function(n) { return n.join(''); },
        peg$c89 = /^[a-zA-Z0-9\-_  #.>+~[\]=|\^$*]/,
        peg$c90 = { type: "class", value: "[a-zA-Z0-9-_  #\\.\\>\\+~\\[\\]=|\\^\\$\\*]", description: "[a-zA-Z0-9-_  #\\.\\>\\+~\\[\\]=|\\^\\$\\*]" },
        peg$c91 = function(c) { return c.join(''); },
        peg$c92 = /^['"a-zA-Z0-9_().><=! \t-&|~]/,
        peg$c93 = { type: "class", value: "['\"a-zA-Z0-9_\\(\\)\\.\\>\\<\\=\\! \\t-&|~]", description: "['\"a-zA-Z0-9_\\(\\)\\.\\>\\<\\=\\! \\t-&|~]" },
        peg$c94 = function(v) { return v.join(''); },
        peg$c95 = /^[ \t\r\n]/,
        peg$c96 = { type: "class", value: "[ \\t\\r\\n]", description: "[ \\t\\r\\n]" },
        peg$currPos          = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$result;
    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }
      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;
      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }
        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };
        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
          p++;
        }
        peg$posDetailsCache[pos] = details;
        return details;
      }
    }
    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);
      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }
    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }
      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }
      peg$maxFailExpected.push(expected);
    }
    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;
        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });
        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }
      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }
          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }
        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;
        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }
        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];
        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";
        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }
      if (expected !== null) {
        cleanupExpected(expected);
      }
      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }
    function peg$parsestart() {
      var s0;
      s0 = peg$parsemerged();
      return s0;
    }
    function peg$parsemerged() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      s1 = peg$parseordered();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesep();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c0;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            { peg$fail(peg$c1); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesep();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsemerged();
              if (s5 !== peg$FAILED) {
                s1 = peg$c2(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseordered();
        if (s1 !== peg$FAILED) {
          s1 = peg$c3(s1);
        }
        s0 = s1;
      }
      return s0;
    }
    function peg$parseordered() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c4;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        { peg$fail(peg$c5); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesep();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefiltered();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesep();
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s5 = peg$c0;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                { peg$fail(peg$c1); }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsesep();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsefiltered();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsesep();
                    if (s8 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 93) {
                        s9 = peg$c6;
                        peg$currPos++;
                      } else {
                        s9 = peg$FAILED;
                        { peg$fail(peg$c7); }
                      }
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parsesep();
                        if (s10 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 62) {
                            s11 = peg$c8;
                            peg$currPos++;
                          } else {
                            s11 = peg$FAILED;
                            { peg$fail(peg$c9); }
                          }
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parsesep();
                            if (s12 !== peg$FAILED) {
                              s13 = peg$parseordered();
                              if (s13 !== peg$FAILED) {
                                s1 = peg$c10(s3, s7, s13);
                                s0 = s1;
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsefiltered();
      }
      return s0;
    }
    function peg$parsefiltered() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      s1 = peg$parsestream();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefilter();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsefilter();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = peg$c11(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsestream();
        if (s1 !== peg$FAILED) {
          s1 = peg$c12(s1);
        }
        s0 = s1;
      }
      return s0;
    }
    function peg$parsestream() {
      var s0, s1, s2, s3, s4;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c13;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        { peg$fail(peg$c14); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsemerged();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 41) {
            s3 = peg$c15;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            { peg$fail(peg$c16); }
          }
          if (s3 !== peg$FAILED) {
            s1 = peg$c17(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 64) {
          s1 = peg$c18;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          { peg$fail(peg$c19); }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parsename();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s3 = peg$c20;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              { peg$fail(peg$c21); }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseeventType();
              if (s4 !== peg$FAILED) {
                s1 = peg$c22(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsemarkType();
          if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s2 = peg$c20;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              { peg$fail(peg$c21); }
            }
            if (s2 !== peg$FAILED) {
              s3 = peg$parseeventType();
              if (s3 !== peg$FAILED) {
                s1 = peg$c23(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsecss();
            if (s1 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 58) {
                s2 = peg$c20;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                { peg$fail(peg$c21); }
              }
              if (s2 !== peg$FAILED) {
                s3 = peg$parseeventType();
                if (s3 !== peg$FAILED) {
                  s1 = peg$c24(s1, s3);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseeventType();
              if (s1 !== peg$FAILED) {
                s1 = peg$c25(s1);
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsename();
                if (s1 !== peg$FAILED) {
                  s1 = peg$c26(s1);
                }
                s0 = s1;
              }
            }
          }
        }
      }
      return s0;
    }
    function peg$parsemarkType() {
      var s0;
      if (input.substr(peg$currPos, 4) === peg$c27) {
        s0 = peg$c27;
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        { peg$fail(peg$c28); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 6) === peg$c29) {
          s0 = peg$c29;
          peg$currPos += 6;
        } else {
          s0 = peg$FAILED;
          { peg$fail(peg$c30); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 4) === peg$c31) {
            s0 = peg$c31;
            peg$currPos += 4;
          } else {
            s0 = peg$FAILED;
            { peg$fail(peg$c32); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c33) {
              s0 = peg$c33;
              peg$currPos += 3;
            } else {
              s0 = peg$FAILED;
              { peg$fail(peg$c34); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 4) === peg$c35) {
                s0 = peg$c35;
                peg$currPos += 4;
              } else {
                s0 = peg$FAILED;
                { peg$fail(peg$c36); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 4) === peg$c37) {
                  s0 = peg$c37;
                  peg$currPos += 4;
                } else {
                  s0 = peg$FAILED;
                  { peg$fail(peg$c38); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 4) === peg$c39) {
                    s0 = peg$c39;
                    peg$currPos += 4;
                  } else {
                    s0 = peg$FAILED;
                    { peg$fail(peg$c40); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c41) {
                      s0 = peg$c41;
                      peg$currPos += 5;
                    } else {
                      s0 = peg$FAILED;
                      { peg$fail(peg$c42); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 4) === peg$c43) {
                        s0 = peg$c43;
                        peg$currPos += 4;
                      } else {
                        s0 = peg$FAILED;
                        { peg$fail(peg$c44); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 5) === peg$c45) {
                          s0 = peg$c45;
                          peg$currPos += 5;
                        } else {
                          s0 = peg$FAILED;
                          { peg$fail(peg$c46); }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return s0;
    }
    function peg$parseeventType() {
      var s0;
      if (input.substr(peg$currPos, 9) === peg$c47) {
        s0 = peg$c47;
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        { peg$fail(peg$c48); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c49) {
          s0 = peg$c49;
          peg$currPos += 7;
        } else {
          s0 = peg$FAILED;
          { peg$fail(peg$c50); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c51) {
            s0 = peg$c51;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            { peg$fail(peg$c52); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c53) {
              s0 = peg$c53;
              peg$currPos += 8;
            } else {
              s0 = peg$FAILED;
              { peg$fail(peg$c54); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c55) {
                s0 = peg$c55;
                peg$currPos += 5;
              } else {
                s0 = peg$FAILED;
                { peg$fail(peg$c56); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 7) === peg$c57) {
                  s0 = peg$c57;
                  peg$currPos += 7;
                } else {
                  s0 = peg$FAILED;
                  { peg$fail(peg$c58); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 8) === peg$c59) {
                    s0 = peg$c59;
                    peg$currPos += 8;
                  } else {
                    s0 = peg$FAILED;
                    { peg$fail(peg$c60); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c61) {
                      s0 = peg$c61;
                      peg$currPos += 5;
                    } else {
                      s0 = peg$FAILED;
                      { peg$fail(peg$c62); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 10) === peg$c63) {
                        s0 = peg$c63;
                        peg$currPos += 10;
                      } else {
                        s0 = peg$FAILED;
                        { peg$fail(peg$c64); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 9) === peg$c65) {
                          s0 = peg$c65;
                          peg$currPos += 9;
                        } else {
                          s0 = peg$FAILED;
                          { peg$fail(peg$c66); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 8) === peg$c67) {
                            s0 = peg$c67;
                            peg$currPos += 8;
                          } else {
                            s0 = peg$FAILED;
                            { peg$fail(peg$c68); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 9) === peg$c69) {
                              s0 = peg$c69;
                              peg$currPos += 9;
                            } else {
                              s0 = peg$FAILED;
                              { peg$fail(peg$c70); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 10) === peg$c71) {
                                s0 = peg$c71;
                                peg$currPos += 10;
                              } else {
                                s0 = peg$FAILED;
                                { peg$fail(peg$c72); }
                              }
                              if (s0 === peg$FAILED) {
                                if (input.substr(peg$currPos, 10) === peg$c73) {
                                  s0 = peg$c73;
                                  peg$currPos += 10;
                                } else {
                                  s0 = peg$FAILED;
                                  { peg$fail(peg$c74); }
                                }
                                if (s0 === peg$FAILED) {
                                  if (input.substr(peg$currPos, 9) === peg$c75) {
                                    s0 = peg$c75;
                                    peg$currPos += 9;
                                  } else {
                                    s0 = peg$FAILED;
                                    { peg$fail(peg$c76); }
                                  }
                                  if (s0 === peg$FAILED) {
                                    if (input.substr(peg$currPos, 8) === peg$c77) {
                                      s0 = peg$c77;
                                      peg$currPos += 8;
                                    } else {
                                      s0 = peg$FAILED;
                                      { peg$fail(peg$c78); }
                                    }
                                    if (s0 === peg$FAILED) {
                                      if (input.substr(peg$currPos, 9) === peg$c79) {
                                        s0 = peg$c79;
                                        peg$currPos += 9;
                                      } else {
                                        s0 = peg$FAILED;
                                        { peg$fail(peg$c80); }
                                      }
                                      if (s0 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 8) === peg$c81) {
                                          s0 = peg$c81;
                                          peg$currPos += 8;
                                        } else {
                                          s0 = peg$FAILED;
                                          { peg$fail(peg$c82); }
                                        }
                                        if (s0 === peg$FAILED) {
                                          if (input.substr(peg$currPos, 9) === peg$c83) {
                                            s0 = peg$c83;
                                            peg$currPos += 9;
                                          } else {
                                            s0 = peg$FAILED;
                                            { peg$fail(peg$c84); }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return s0;
    }
    function peg$parsefilter() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c4;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        { peg$fail(peg$c5); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpr();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 93) {
            s3 = peg$c6;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            { peg$fail(peg$c7); }
          }
          if (s3 !== peg$FAILED) {
            s1 = peg$c85(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parsename() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c86.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        { peg$fail(peg$c87); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c86.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            { peg$fail(peg$c87); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s1 = peg$c88(s1);
      }
      s0 = s1;
      return s0;
    }
    function peg$parsecss() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c89.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        { peg$fail(peg$c90); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c89.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            { peg$fail(peg$c90); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s1 = peg$c91(s1);
      }
      s0 = s1;
      return s0;
    }
    function peg$parseexpr() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = [];
      if (peg$c92.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        { peg$fail(peg$c93); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c92.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            { peg$fail(peg$c93); }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s1 = peg$c94(s1);
      }
      s0 = s1;
      return s0;
    }
    function peg$parsesep() {
      var s0, s1;
      s0 = [];
      if (peg$c95.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        { peg$fail(peg$c96); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c95.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          { peg$fail(peg$c96); }
        }
      }
      return s0;
    }
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }
      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }
  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

var parser = (function() {
  var Token,
      TokenName,
      Syntax,
      PropertyKind,
      Messages,
      Regex,
      source,
      strict,
      index,
      lineNumber,
      lineStart,
      length,
      lookahead,
      state,
      extra;
  Token = {
      BooleanLiteral: 1,
      EOF: 2,
      Identifier: 3,
      Keyword: 4,
      NullLiteral: 5,
      NumericLiteral: 6,
      Punctuator: 7,
      StringLiteral: 8,
      RegularExpression: 9
  };
  TokenName = {};
  TokenName[Token.BooleanLiteral] = 'Boolean';
  TokenName[Token.EOF] = '<end>';
  TokenName[Token.Identifier] = 'Identifier';
  TokenName[Token.Keyword] = 'Keyword';
  TokenName[Token.NullLiteral] = 'Null';
  TokenName[Token.NumericLiteral] = 'Numeric';
  TokenName[Token.Punctuator] = 'Punctuator';
  TokenName[Token.StringLiteral] = 'String';
  TokenName[Token.RegularExpression] = 'RegularExpression';
  Syntax = {
      AssignmentExpression: 'AssignmentExpression',
      ArrayExpression: 'ArrayExpression',
      BinaryExpression: 'BinaryExpression',
      CallExpression: 'CallExpression',
      ConditionalExpression: 'ConditionalExpression',
      ExpressionStatement: 'ExpressionStatement',
      Identifier: 'Identifier',
      Literal: 'Literal',
      LogicalExpression: 'LogicalExpression',
      MemberExpression: 'MemberExpression',
      ObjectExpression: 'ObjectExpression',
      Program: 'Program',
      Property: 'Property',
      UnaryExpression: 'UnaryExpression'
  };
  PropertyKind = {
      Data: 1,
      Get: 2,
      Set: 4
  };
  Messages = {
      UnexpectedToken:  'Unexpected token %0',
      UnexpectedNumber:  'Unexpected number',
      UnexpectedString:  'Unexpected string',
      UnexpectedIdentifier:  'Unexpected identifier',
      UnexpectedReserved:  'Unexpected reserved word',
      UnexpectedEOS:  'Unexpected end of input',
      NewlineAfterThrow:  'Illegal newline after throw',
      InvalidRegExp: 'Invalid regular expression',
      UnterminatedRegExp:  'Invalid regular expression: missing /',
      InvalidLHSInAssignment:  'Invalid left-hand side in assignment',
      InvalidLHSInForIn:  'Invalid left-hand side in for-in',
      MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
      NoCatchOrFinally:  'Missing catch or finally after try',
      UnknownLabel: 'Undefined label \'%0\'',
      Redeclaration: '%0 \'%1\' has already been declared',
      IllegalContinue: 'Illegal continue statement',
      IllegalBreak: 'Illegal break statement',
      IllegalReturn: 'Illegal return statement',
      StrictModeWith:  'Strict mode code may not include a with statement',
      StrictCatchVariable:  'Catch variable may not be eval or arguments in strict mode',
      StrictVarName:  'Variable name may not be eval or arguments in strict mode',
      StrictParamName:  'Parameter name eval or arguments is not allowed in strict mode',
      StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
      StrictFunctionName:  'Function name may not be eval or arguments in strict mode',
      StrictOctalLiteral:  'Octal literals are not allowed in strict mode.',
      StrictDelete:  'Delete of an unqualified identifier in strict mode.',
      StrictDuplicateProperty:  'Duplicate data property in object literal not allowed in strict mode',
      AccessorDataProperty:  'Object literal may not have data and accessor property with the same name',
      AccessorGetSet:  'Object literal may not have multiple get/set accessors with the same name',
      StrictLHSAssignment:  'Assignment to eval or arguments is not allowed in strict mode',
      StrictLHSPostfix:  'Postfix increment/decrement may not have eval or arguments operand in strict mode',
      StrictLHSPrefix:  'Prefix increment/decrement may not have eval or arguments operand in strict mode',
      StrictReservedWord:  'Use of future reserved word in strict mode'
  };
  Regex = {
      NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
      NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
  };
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
          ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
  }
  function isIdentifierPart(ch) {
      return (ch === 0x24) || (ch === 0x5F) ||
          (ch >= 0x41 && ch <= 0x5A) ||
          (ch >= 0x61 && ch <= 0x7A) ||
          (ch >= 0x30 && ch <= 0x39) ||
          (ch === 0x5C) ||
          ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
  }
  function isFutureReservedWord(id) {
      switch (id) {
      case 'class':
      case 'enum':
      case 'export':
      case 'extends':
      case 'import':
      case 'super':
          return true;
      default:
          return false;
      }
  }
  function isStrictModeReservedWord(id) {
      switch (id) {
      case 'implements':
      case 'interface':
      case 'package':
      case 'private':
      case 'protected':
      case 'public':
      case 'static':
      case 'yield':
      case 'let':
          return true;
      default:
          return false;
      }
  }
  function isKeyword(id) {
      if (strict && isStrictModeReservedWord(id)) {
          return true;
      }
      switch (id.length) {
      case 2:
          return (id === 'if') || (id === 'in') || (id === 'do');
      case 3:
          return (id === 'var') || (id === 'for') || (id === 'new') ||
              (id === 'try') || (id === 'let');
      case 4:
          return (id === 'this') || (id === 'else') || (id === 'case') ||
              (id === 'void') || (id === 'with') || (id === 'enum');
      case 5:
          return (id === 'while') || (id === 'break') || (id === 'catch') ||
              (id === 'throw') || (id === 'const') || (id === 'yield') ||
              (id === 'class') || (id === 'super');
      case 6:
          return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
              (id === 'switch') || (id === 'export') || (id === 'import');
      case 7:
          return (id === 'default') || (id === 'finally') || (id === 'extends');
      case 8:
          return (id === 'function') || (id === 'continue') || (id === 'debugger');
      case 10:
          return (id === 'instanceof');
      default:
          return false;
      }
  }
  function skipComment() {
      var ch;
      while (index < length) {
          ch = source.charCodeAt(index);
          if (isWhiteSpace(ch)) {
              ++index;
          } else if (isLineTerminator(ch)) {
              ++index;
              if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                  ++index;
              }
              ++lineNumber;
              lineStart = index;
          } else {
              break;
          }
      }
  }
  function scanHexEscape(prefix) {
      var i, len, ch, code = 0;
      len = (prefix === 'u') ? 4 : 2;
      for (i = 0; i < len; ++i) {
          if (index < length && isHexDigit(source[index])) {
              ch = source[index++];
              code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
          } else {
              return '';
          }
      }
      return String.fromCharCode(code);
  }
  function scanUnicodeCodePointEscape() {
      var ch, code, cu1, cu2;
      ch = source[index];
      code = 0;
      if (ch === '}') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }
      while (index < length) {
          ch = source[index++];
          if (!isHexDigit(ch)) {
              break;
          }
          code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
      }
      if (code > 0x10FFFF || ch !== '}') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
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
      ch = source.charCodeAt(index++);
      id = String.fromCharCode(ch);
      if (ch === 0x5C) {
          if (source.charCodeAt(index) !== 0x75) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          ++index;
          ch = scanHexEscape('u');
          if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
          id = ch;
      }
      while (index < length) {
          ch = source.charCodeAt(index);
          if (!isIdentifierPart(ch)) {
              break;
          }
          ++index;
          id += String.fromCharCode(ch);
          if (ch === 0x5C) {
              id = id.substr(0, id.length - 1);
              if (source.charCodeAt(index) !== 0x75) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
              ++index;
              ch = scanHexEscape('u');
              if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
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
          ch = source.charCodeAt(index);
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
      return source.slice(start, index);
  }
  function scanIdentifier() {
      var start, id, type;
      start = index;
      id = (source.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();
      if (id.length === 1) {
          type = Token.Identifier;
      } else if (isKeyword(id)) {
          type = Token.Keyword;
      } else if (id === 'null') {
          type = Token.NullLiteral;
      } else if (id === 'true' || id === 'false') {
          type = Token.BooleanLiteral;
      } else {
          type = Token.Identifier;
      }
      return {
          type: type,
          value: id,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }
  function scanPunctuator() {
      var start = index,
          code = source.charCodeAt(index),
          code2,
          ch1 = source[index],
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
          if (extra.tokenize) {
              if (code === 0x28) {
                  extra.openParenToken = extra.tokens.length;
              } else if (code === 0x7B) {
                  extra.openCurlyToken = extra.tokens.length;
              }
          }
          return {
              type: Token.Punctuator,
              value: String.fromCharCode(code),
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      default:
          code2 = source.charCodeAt(index + 1);
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
                      type: Token.Punctuator,
                      value: String.fromCharCode(code) + String.fromCharCode(code2),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      start: start,
                      end: index
                  };
              case 0x21:
              case 0x3D:
                  index += 2;
                  if (source.charCodeAt(index) === 0x3D) {
                      ++index;
                  }
                  return {
                      type: Token.Punctuator,
                      value: source.slice(start, index),
                      lineNumber: lineNumber,
                      lineStart: lineStart,
                      start: start,
                      end: index
                  };
              }
          }
      }
      ch4 = source.substr(index, 4);
      if (ch4 === '>>>=') {
          index += 4;
          return {
              type: Token.Punctuator,
              value: ch4,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }
      ch3 = ch4.substr(0, 3);
      if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
          index += 3;
          return {
              type: Token.Punctuator,
              value: ch3,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }
      ch2 = ch3.substr(0, 2);
      if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
          index += 2;
          return {
              type: Token.Punctuator,
              value: ch2,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }
      if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
          ++index;
          return {
              type: Token.Punctuator,
              value: ch1,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }
      throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
  }
  function scanHexLiteral(start) {
      var number = '';
      while (index < length) {
          if (!isHexDigit(source[index])) {
              break;
          }
          number += source[index++];
      }
      if (number.length === 0) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }
      if (isIdentifierStart(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }
      return {
          type: Token.NumericLiteral,
          value: parseInt('0x' + number, 16),
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }
  function scanOctalLiteral(start) {
      var number = '0' + source[index++];
      while (index < length) {
          if (!isOctalDigit(source[index])) {
              break;
          }
          number += source[index++];
      }
      if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }
      return {
          type: Token.NumericLiteral,
          value: parseInt(number, 8),
          octal: true,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }
  function scanNumericLiteral() {
      var number, start, ch;
      ch = source[index];
      assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
          'Numeric literal must start with a decimal digit or a decimal point');
      start = index;
      number = '';
      if (ch !== '.') {
          number = source[index++];
          ch = source[index];
          if (number === '0') {
              if (ch === 'x' || ch === 'X') {
                  ++index;
                  return scanHexLiteral(start);
              }
              if (isOctalDigit(ch)) {
                  return scanOctalLiteral(start);
              }
              if (ch && isDecimalDigit(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
          }
          while (isDecimalDigit(source.charCodeAt(index))) {
              number += source[index++];
          }
          ch = source[index];
      }
      if (ch === '.') {
          number += source[index++];
          while (isDecimalDigit(source.charCodeAt(index))) {
              number += source[index++];
          }
          ch = source[index];
      }
      if (ch === 'e' || ch === 'E') {
          number += source[index++];
          ch = source[index];
          if (ch === '+' || ch === '-') {
              number += source[index++];
          }
          if (isDecimalDigit(source.charCodeAt(index))) {
              while (isDecimalDigit(source.charCodeAt(index))) {
                  number += source[index++];
              }
          } else {
              throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
          }
      }
      if (isIdentifierStart(source.charCodeAt(index))) {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }
      return {
          type: Token.NumericLiteral,
          value: parseFloat(number),
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }
  function scanStringLiteral() {
      var str = '', quote, start, ch, code, unescaped, restore, octal = false, startLineNumber, startLineStart;
      startLineNumber = lineNumber;
      startLineStart = lineStart;
      quote = source[index];
      assert((quote === '\'' || quote === '"'),
          'String literal must starts with a quote');
      start = index;
      ++index;
      while (index < length) {
          ch = source[index++];
          if (ch === quote) {
              quote = '';
              break;
          } else if (ch === '\\') {
              ch = source[index++];
              if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                  switch (ch) {
                  case 'u':
                  case 'x':
                      if (source[index] === '{') {
                          ++index;
                          str += scanUnicodeCodePointEscape();
                      } else {
                          restore = index;
                          unescaped = scanHexEscape(ch);
                          if (unescaped) {
                              str += unescaped;
                          } else {
                              index = restore;
                              str += ch;
                          }
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
                          if (index < length && isOctalDigit(source[index])) {
                              octal = true;
                              code = code * 8 + '01234567'.indexOf(source[index++]);
                              if ('0123'.indexOf(ch) >= 0 &&
                                      index < length &&
                                      isOctalDigit(source[index])) {
                                  code = code * 8 + '01234567'.indexOf(source[index++]);
                              }
                          }
                          str += String.fromCharCode(code);
                      } else {
                          str += ch;
                      }
                      break;
                  }
              } else {
                  ++lineNumber;
                  if (ch ===  '\r' && source[index] === '\n') {
                      ++index;
                  }
                  lineStart = index;
              }
          } else if (isLineTerminator(ch.charCodeAt(0))) {
              break;
          } else {
              str += ch;
          }
      }
      if (quote !== '') {
          throwError({}, Messages.UnexpectedToken, 'ILLEGAL');
      }
      return {
          type: Token.StringLiteral,
          value: str,
          octal: octal,
          startLineNumber: startLineNumber,
          startLineStart: startLineStart,
          lineNumber: lineNumber,
          lineStart: lineStart,
          start: start,
          end: index
      };
  }
  function testRegExp(pattern, flags) {
      var tmp = pattern;
      if (flags.indexOf('u') >= 0) {
          tmp = tmp
              .replace(/\\u\{([0-9a-fA-F]+)\}/g, function ($0, $1) {
                  if (parseInt($1, 16) <= 0x10FFFF) {
                      return 'x';
                  }
                  throwError({}, Messages.InvalidRegExp);
              })
              .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
      }
      try {
      } catch (e) {
          throwError({}, Messages.InvalidRegExp);
      }
      try {
          return new RegExp(pattern, flags);
      } catch (exception) {
          return null;
      }
  }
  function scanRegExpBody() {
      var ch, str, classMarker, terminated, body;
      ch = source[index];
      assert(ch === '/', 'Regular expression literal must start with a slash');
      str = source[index++];
      classMarker = false;
      terminated = false;
      while (index < length) {
          ch = source[index++];
          str += ch;
          if (ch === '\\') {
              ch = source[index++];
              if (isLineTerminator(ch.charCodeAt(0))) {
                  throwError({}, Messages.UnterminatedRegExp);
              }
              str += ch;
          } else if (isLineTerminator(ch.charCodeAt(0))) {
              throwError({}, Messages.UnterminatedRegExp);
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
          throwError({}, Messages.UnterminatedRegExp);
      }
      body = str.substr(1, str.length - 2);
      return {
          value: body,
          literal: str
      };
  }
  function scanRegExpFlags() {
      var ch, str, flags, restore;
      str = '';
      flags = '';
      while (index < length) {
          ch = source[index];
          if (!isIdentifierPart(ch.charCodeAt(0))) {
              break;
          }
          ++index;
          if (ch === '\\' && index < length) {
              ch = source[index];
              if (ch === 'u') {
                  ++index;
                  restore = index;
                  ch = scanHexEscape('u');
                  if (ch) {
                      flags += ch;
                      for (str += '\\u'; restore < index; ++restore) {
                          str += source[restore];
                      }
                  } else {
                      index = restore;
                      flags += 'u';
                      str += '\\u';
                  }
                  throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
              } else {
                  str += '\\';
                  throwErrorTolerant({}, Messages.UnexpectedToken, 'ILLEGAL');
              }
          } else {
              flags += ch;
              str += ch;
          }
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
      if (extra.tokenize) {
          return {
              type: Token.RegularExpression,
              value: value,
              regex: {
                  pattern: body.value,
                  flags: flags.value
              },
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: start,
              end: index
          };
      }
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
  function collectRegex() {
      var pos, loc, regex, token;
      skipComment();
      pos = index;
      loc = {
          start: {
              line: lineNumber,
              column: index - lineStart
          }
      };
      regex = scanRegExp();
      loc.end = {
          line: lineNumber,
          column: index - lineStart
      };
      if (!extra.tokenize) {
          if (extra.tokens.length > 0) {
              token = extra.tokens[extra.tokens.length - 1];
              if (token.range[0] === pos && token.type === 'Punctuator') {
                  if (token.value === '/' || token.value === '/=') {
                      extra.tokens.pop();
                  }
              }
          }
          extra.tokens.push({
              type: 'RegularExpression',
              value: regex.literal,
              regex: regex.regex,
              range: [pos, index],
              loc: loc
          });
      }
      return regex;
  }
  function isIdentifierName(token) {
      return token.type === Token.Identifier ||
          token.type === Token.Keyword ||
          token.type === Token.BooleanLiteral ||
          token.type === Token.NullLiteral;
  }
  function advanceSlash() {
      var prevToken,
          checkToken;
      prevToken = extra.tokens[extra.tokens.length - 1];
      if (!prevToken) {
          return collectRegex();
      }
      if (prevToken.type === 'Punctuator') {
          if (prevToken.value === ']') {
              return scanPunctuator();
          }
          if (prevToken.value === ')') {
              checkToken = extra.tokens[extra.openParenToken - 1];
              if (checkToken &&
                      checkToken.type === 'Keyword' &&
                      (checkToken.value === 'if' ||
                       checkToken.value === 'while' ||
                       checkToken.value === 'for' ||
                       checkToken.value === 'with')) {
                  return collectRegex();
              }
              return scanPunctuator();
          }
          if (prevToken.value === '}') {
              if (extra.tokens[extra.openCurlyToken - 3] &&
                      extra.tokens[extra.openCurlyToken - 3].type === 'Keyword') {
                  checkToken = extra.tokens[extra.openCurlyToken - 4];
                  if (!checkToken) {
                      return scanPunctuator();
                  }
              } else if (extra.tokens[extra.openCurlyToken - 4] &&
                      extra.tokens[extra.openCurlyToken - 4].type === 'Keyword') {
                  checkToken = extra.tokens[extra.openCurlyToken - 5];
                  if (!checkToken) {
                      return collectRegex();
                  }
              } else {
                  return scanPunctuator();
              }
              return scanPunctuator();
          }
          return collectRegex();
      }
      if (prevToken.type === 'Keyword' && prevToken.value !== 'this') {
          return collectRegex();
      }
      return scanPunctuator();
  }
  function advance() {
      var ch;
      skipComment();
      if (index >= length) {
          return {
              type: Token.EOF,
              lineNumber: lineNumber,
              lineStart: lineStart,
              start: index,
              end: index
          };
      }
      ch = source.charCodeAt(index);
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
          if (isDecimalDigit(source.charCodeAt(index + 1))) {
              return scanNumericLiteral();
          }
          return scanPunctuator();
      }
      if (isDecimalDigit(ch)) {
          return scanNumericLiteral();
      }
      if (extra.tokenize && ch === 0x2F) {
          return advanceSlash();
      }
      return scanPunctuator();
  }
  function collectToken() {
      var loc, token, value, entry;
      skipComment();
      loc = {
          start: {
              line: lineNumber,
              column: index - lineStart
          }
      };
      token = advance();
      loc.end = {
          line: lineNumber,
          column: index - lineStart
      };
      if (token.type !== Token.EOF) {
          value = source.slice(token.start, token.end);
          entry = {
              type: TokenName[token.type],
              value: value,
              range: [token.start, token.end],
              loc: loc
          };
          if (token.regex) {
              entry.regex = {
                  pattern: token.regex.pattern,
                  flags: token.regex.flags
              };
          }
          extra.tokens.push(entry);
      }
      return token;
  }
  function lex() {
      var token;
      token = lookahead;
      index = token.end;
      lineNumber = token.lineNumber;
      lineStart = token.lineStart;
      lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
      index = token.end;
      lineNumber = token.lineNumber;
      lineStart = token.lineStart;
      return token;
  }
  function peek() {
      var pos, line, start;
      pos = index;
      line = lineNumber;
      start = lineStart;
      lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
      index = pos;
      lineNumber = line;
      lineStart = start;
  }
  function Position() {
      this.line = lineNumber;
      this.column = index - lineStart;
  }
  function SourceLocation() {
      this.start = new Position();
      this.end = null;
  }
  function WrappingSourceLocation(startToken) {
      if (startToken.type === Token.StringLiteral) {
          this.start = {
              line: startToken.startLineNumber,
              column: startToken.start - startToken.startLineStart
          };
      } else {
          this.start = {
              line: startToken.lineNumber,
              column: startToken.start - startToken.lineStart
          };
      }
      this.end = null;
  }
  function Node() {
      index = lookahead.start;
      if (lookahead.type === Token.StringLiteral) {
          lineNumber = lookahead.startLineNumber;
          lineStart = lookahead.startLineStart;
      } else {
          lineNumber = lookahead.lineNumber;
          lineStart = lookahead.lineStart;
      }
      if (extra.range) {
          this.range = [index, 0];
      }
      if (extra.loc) {
          this.loc = new SourceLocation();
      }
  }
  function WrappingNode(startToken) {
      if (extra.range) {
          this.range = [startToken.start, 0];
      }
      if (extra.loc) {
          this.loc = new WrappingSourceLocation(startToken);
      }
  }
  WrappingNode.prototype = Node.prototype = {
      finish: function () {
          if (extra.range) {
              this.range[1] = index;
          }
          if (extra.loc) {
              this.loc.end = new Position();
              if (extra.source) {
                  this.loc.source = extra.source;
              }
          }
      },
      finishArrayExpression: function (elements) {
          this.type = Syntax.ArrayExpression;
          this.elements = elements;
          this.finish();
          return this;
      },
      finishAssignmentExpression: function (operator, left, right) {
          this.type = Syntax.AssignmentExpression;
          this.operator = operator;
          this.left = left;
          this.right = right;
          this.finish();
          return this;
      },
      finishBinaryExpression: function (operator, left, right) {
          this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
          this.operator = operator;
          this.left = left;
          this.right = right;
          this.finish();
          return this;
      },
      finishCallExpression: function (callee, args) {
          this.type = Syntax.CallExpression;
          this.callee = callee;
          this.arguments = args;
          this.finish();
          return this;
      },
      finishConditionalExpression: function (test, consequent, alternate) {
          this.type = Syntax.ConditionalExpression;
          this.test = test;
          this.consequent = consequent;
          this.alternate = alternate;
          this.finish();
          return this;
      },
      finishExpressionStatement: function (expression) {
          this.type = Syntax.ExpressionStatement;
          this.expression = expression;
          this.finish();
          return this;
      },
      finishIdentifier: function (name) {
          this.type = Syntax.Identifier;
          this.name = name;
          this.finish();
          return this;
      },
      finishLiteral: function (token) {
          this.type = Syntax.Literal;
          this.value = token.value;
          this.raw = source.slice(token.start, token.end);
          if (token.regex) {
              if (this.raw == '//') {
                this.raw = '/(?:)/';
              }
              this.regex = token.regex;
          }
          this.finish();
          return this;
      },
      finishMemberExpression: function (accessor, object, property) {
          this.type = Syntax.MemberExpression;
          this.computed = accessor === '[';
          this.object = object;
          this.property = property;
          this.finish();
          return this;
      },
      finishObjectExpression: function (properties) {
          this.type = Syntax.ObjectExpression;
          this.properties = properties;
          this.finish();
          return this;
      },
      finishProgram: function (body) {
          this.type = Syntax.Program;
          this.body = body;
          this.finish();
          return this;
      },
      finishProperty: function (kind, key, value) {
          this.type = Syntax.Property;
          this.key = key;
          this.value = value;
          this.kind = kind;
          this.finish();
          return this;
      },
      finishUnaryExpression: function (operator, argument) {
          this.type = Syntax.UnaryExpression;
          this.operator = operator;
          this.argument = argument;
          this.prefix = true;
          this.finish();
          return this;
      }
  };
  function peekLineTerminator() {
      var pos, line, start, found;
      pos = index;
      line = lineNumber;
      start = lineStart;
      skipComment();
      found = lineNumber !== line;
      index = pos;
      lineNumber = line;
      lineStart = start;
      return found;
  }
  function throwError(token, messageFormat) {
      var error,
          args = Array.prototype.slice.call(arguments, 2),
          msg = messageFormat.replace(
              /%(\d)/g,
              function (whole, index) {
                  assert(index < args.length, 'Message reference must be in range');
                  return args[index];
              }
          );
      if (typeof token.lineNumber === 'number') {
          error = new Error('Line ' + token.lineNumber + ': ' + msg);
          error.index = token.start;
          error.lineNumber = token.lineNumber;
          error.column = token.start - lineStart + 1;
      } else {
          error = new Error('Line ' + lineNumber + ': ' + msg);
          error.index = index;
          error.lineNumber = lineNumber;
          error.column = index - lineStart + 1;
      }
      error.description = msg;
      throw error;
  }
  function throwErrorTolerant() {
      try {
          throwError.apply(null, arguments);
      } catch (e) {
          if (extra.errors) {
              extra.errors.push(e);
          } else {
              throw e;
          }
      }
  }
  function throwUnexpected(token) {
      if (token.type === Token.EOF) {
          throwError(token, Messages.UnexpectedEOS);
      }
      if (token.type === Token.NumericLiteral) {
          throwError(token, Messages.UnexpectedNumber);
      }
      if (token.type === Token.StringLiteral) {
          throwError(token, Messages.UnexpectedString);
      }
      if (token.type === Token.Identifier) {
          throwError(token, Messages.UnexpectedIdentifier);
      }
      if (token.type === Token.Keyword) {
          if (isFutureReservedWord(token.value)) {
              throwError(token, Messages.UnexpectedReserved);
          } else if (strict && isStrictModeReservedWord(token.value)) {
              throwErrorTolerant(token, Messages.StrictReservedWord);
              return;
          }
          throwError(token, Messages.UnexpectedToken, token.value);
      }
      throwError(token, Messages.UnexpectedToken, token.value);
  }
  function expect(value) {
      var token = lex();
      if (token.type !== Token.Punctuator || token.value !== value) {
          throwUnexpected(token);
      }
  }
  function expectTolerant(value) {
      if (extra.errors) {
          var token = lookahead;
          if (token.type !== Token.Punctuator && token.value !== value) {
              throwErrorTolerant(token, Messages.UnexpectedToken, token.value);
          } else {
              lex();
          }
      } else {
          expect(value);
      }
  }
  function match(value) {
      return lookahead.type === Token.Punctuator && lookahead.value === value;
  }
  function matchKeyword(keyword) {
      return lookahead.type === Token.Keyword && lookahead.value === keyword;
  }
  function consumeSemicolon() {
      var line;
      if (source.charCodeAt(index) === 0x3B || match(';')) {
          lex();
          return;
      }
      line = lineNumber;
      skipComment();
      if (lineNumber !== line) {
          return;
      }
      if (lookahead.type !== Token.EOF && !match('}')) {
          throwUnexpected(lookahead);
      }
  }
  function parseArrayInitialiser() {
      var elements = [], node = new Node();
      expect('[');
      while (!match(']')) {
          if (match(',')) {
              lex();
              elements.push(null);
          } else {
              elements.push(parseAssignmentExpression());
              if (!match(']')) {
                  expect(',');
              }
          }
      }
      lex();
      return node.finishArrayExpression(elements);
  }
  function parseObjectPropertyKey() {
      var token, node = new Node();
      token = lex();
      if (token.type === Token.StringLiteral || token.type === Token.NumericLiteral) {
          if (strict && token.octal) {
              throwErrorTolerant(token, Messages.StrictOctalLiteral);
          }
          return node.finishLiteral(token);
      }
      return node.finishIdentifier(token.value);
  }
  function parseObjectProperty() {
      var token, key, id, value, node = new Node();
      token = lookahead;
      if (token.type === Token.Identifier) {
          id = parseObjectPropertyKey();
          expect(':');
          value = parseAssignmentExpression();
          return node.finishProperty('init', id, value);
      }
      if (token.type === Token.EOF || token.type === Token.Punctuator) {
          throwUnexpected(token);
      } else {
          key = parseObjectPropertyKey();
          expect(':');
          value = parseAssignmentExpression();
          return node.finishProperty('init', key, value);
      }
  }
  function parseObjectInitialiser() {
      var properties = [], property, name, key, kind, map = {}, toString = String, node = new Node();
      expect('{');
      while (!match('}')) {
          property = parseObjectProperty();
          if (property.key.type === Syntax.Identifier) {
              name = property.key.name;
          } else {
              name = toString(property.key.value);
          }
          kind = (property.kind === 'init') ? PropertyKind.Data : (property.kind === 'get') ? PropertyKind.Get : PropertyKind.Set;
          key = '$' + name;
          if (Object.prototype.hasOwnProperty.call(map, key)) {
              if (map[key] === PropertyKind.Data) {
                  if (strict && kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.StrictDuplicateProperty);
                  } else if (kind !== PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                  }
              } else {
                  if (kind === PropertyKind.Data) {
                      throwErrorTolerant({}, Messages.AccessorDataProperty);
                  } else if (map[key] & kind) {
                      throwErrorTolerant({}, Messages.AccessorGetSet);
                  }
              }
              map[key] |= kind;
          } else {
              map[key] = kind;
          }
          properties.push(property);
          if (!match('}')) {
              expectTolerant(',');
          }
      }
      expect('}');
      return node.finishObjectExpression(properties);
  }
  function parseGroupExpression() {
      var expr;
      expect('(');
      ++state.parenthesisCount;
      expr = parseExpression();
      expect(')');
      return expr;
  }
  var legalKeywords = {"if":1, "this":1};
  function parsePrimaryExpression() {
      var type, token, expr, node;
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
      node = new Node();
      if (type === Token.Identifier || legalKeywords[lookahead.value]) {
          expr = node.finishIdentifier(lex().value);
      } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
          if (strict && lookahead.octal) {
              throwErrorTolerant(lookahead, Messages.StrictOctalLiteral);
          }
          expr = node.finishLiteral(lex());
      } else if (type === Token.Keyword) {
          throw new Error("Disabled.");
      } else if (type === Token.BooleanLiteral) {
          token = lex();
          token.value = (token.value === 'true');
          expr = node.finishLiteral(token);
      } else if (type === Token.NullLiteral) {
          token = lex();
          token.value = null;
          expr = node.finishLiteral(token);
      } else if (match('/') || match('/=')) {
          if (typeof extra.tokens !== 'undefined') {
              expr = node.finishLiteral(collectRegex());
          } else {
              expr = node.finishLiteral(scanRegExp());
          }
          peek();
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
              args.push(parseAssignmentExpression());
              if (match(')')) {
                  break;
              }
              expectTolerant(',');
          }
      }
      expect(')');
      return args;
  }
  function parseNonComputedProperty() {
      var token, node = new Node();
      token = lex();
      if (!isIdentifierName(token)) {
          throwUnexpected(token);
      }
      return node.finishIdentifier(token.value);
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
      var expr, args, property, startToken, previousAllowIn = state.allowIn;
      startToken = lookahead;
      state.allowIn = true;
      expr = parsePrimaryExpression();
      for (;;) {
          if (match('.')) {
              property = parseNonComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
          } else if (match('(')) {
              args = parseArguments();
              expr = new WrappingNode(startToken).finishCallExpression(expr, args);
          } else if (match('[')) {
              property = parseComputedMember();
              expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
          } else {
              break;
          }
      }
      state.allowIn = previousAllowIn;
      return expr;
  }
  function parsePostfixExpression() {
      var expr = parseLeftHandSideExpressionAllowCall();
      if (lookahead.type === Token.Punctuator) {
          if ((match('++') || match('--')) && !peekLineTerminator()) {
              throw new Error("Disabled.");
          }
      }
      return expr;
  }
  function parseUnaryExpression() {
      var token, expr, startToken;
      if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
          expr = parsePostfixExpression();
      } else if (match('++') || match('--')) {
          throw new Error("Disabled.");
      } else if (match('+') || match('-') || match('~') || match('!')) {
          startToken = lookahead;
          token = lex();
          expr = parseUnaryExpression();
          expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
      } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
          throw new Error("Disabled.");
      } else {
          expr = parsePostfixExpression();
      }
      return expr;
  }
  function binaryPrecedence(token, allowIn) {
      var prec = 0;
      if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
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
          prec = 7;
          break;
      case 'in':
          prec = allowIn ? 7 : 0;
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
      prec = binaryPrecedence(token, state.allowIn);
      if (prec === 0) {
          return left;
      }
      token.prec = prec;
      lex();
      markers = [marker, lookahead];
      right = parseUnaryExpression();
      stack = [left, token, right];
      while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {
          while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
              right = stack.pop();
              operator = stack.pop().value;
              left = stack.pop();
              markers.pop();
              expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
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
          expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
          i -= 2;
      }
      return expr;
  }
  function parseConditionalExpression() {
      var expr, previousAllowIn, consequent, alternate, startToken;
      startToken = lookahead;
      expr = parseBinaryExpression();
      if (match('?')) {
          lex();
          previousAllowIn = state.allowIn;
          state.allowIn = true;
          consequent = parseAssignmentExpression();
          state.allowIn = previousAllowIn;
          expect(':');
          alternate = parseAssignmentExpression();
          expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
      }
      return expr;
  }
  function parseAssignmentExpression() {
      var oldParenthesisCount, expr;
      oldParenthesisCount = state.parenthesisCount;
      expr = parseConditionalExpression();
      return expr;
  }
  function parseExpression() {
      var expr = parseAssignmentExpression();
      if (match(',')) {
          throw new Error("Disabled.");
      }
      return expr;
  }
  function parseExpressionStatement(node) {
      var expr = parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
  }
  function parseStatement() {
      var type = lookahead.type,
          expr,
          node;
      if (type === Token.EOF) {
          throwUnexpected(lookahead);
      }
      if (type === Token.Punctuator && lookahead.value === '{') {
          throw new Error("Disabled.");
      }
      node = new Node();
      if (type === Token.Punctuator) {
          switch (lookahead.value) {
          case ';':
              throw new Error("Disabled.");
          case '(':
              return parseExpressionStatement(node);
          default:
              break;
          }
      } else if (type === Token.Keyword) {
          throw new Error("Disabled.");
      }
      expr = parseExpression();
      consumeSemicolon();
      return node.finishExpressionStatement(expr);
  }
  function parseSourceElement() {
      if (lookahead.type === Token.Keyword) {
          switch (lookahead.value) {
          case 'const':
          case 'let':
              throw new Error("Disabled.");
          case 'function':
              throw new Error("Disabled.");
          default:
              return parseStatement();
          }
      }
      if (lookahead.type !== Token.EOF) {
          return parseStatement();
      }
  }
  function parseSourceElements() {
      var sourceElement, sourceElements = [], token, directive, firstRestricted;
      while (index < length) {
          token = lookahead;
          if (token.type !== Token.StringLiteral) {
              break;
          }
          sourceElement = parseSourceElement();
          sourceElements.push(sourceElement);
          if (sourceElement.expression.type !== Syntax.Literal) {
              break;
          }
          directive = source.slice(token.start + 1, token.end - 1);
          if (directive === 'use strict') {
              strict = true;
              if (firstRestricted) {
                  throwErrorTolerant(firstRestricted, Messages.StrictOctalLiteral);
              }
          } else {
              if (!firstRestricted && token.octal) {
                  firstRestricted = token;
              }
          }
      }
      while (index < length) {
          sourceElement = parseSourceElement();
          if (typeof sourceElement === 'undefined') {
              break;
          }
          sourceElements.push(sourceElement);
      }
      return sourceElements;
  }
  function parseProgram() {
      var body, node;
      skipComment();
      peek();
      node = new Node();
      strict = true;
      body = parseSourceElements();
      return node.finishProgram(body);
  }
  function filterTokenLocation() {
      var i, entry, token, tokens = [];
      for (i = 0; i < extra.tokens.length; ++i) {
          entry = extra.tokens[i];
          token = {
              type: entry.type,
              value: entry.value
          };
          if (entry.regex) {
              token.regex = {
                  pattern: entry.regex.pattern,
                  flags: entry.regex.flags
              };
          }
          if (extra.range) {
              token.range = entry.range;
          }
          if (extra.loc) {
              token.loc = entry.loc;
          }
          tokens.push(token);
      }
      extra.tokens = tokens;
  }
  function tokenize(code, options) {
      var toString,
          tokens;
      toString = String;
      if (typeof code !== 'string' && !(code instanceof String)) {
          code = toString(code);
      }
      source = code;
      index = 0;
      lineNumber = (source.length > 0) ? 1 : 0;
      lineStart = 0;
      length = source.length;
      lookahead = null;
      state = {
          allowIn: true,
          labelSet: {},
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false,
          lastCommentStart: -1
      };
      extra = {};
      options = options || {};
      options.tokens = true;
      extra.tokens = [];
      extra.tokenize = true;
      extra.openParenToken = -1;
      extra.openCurlyToken = -1;
      extra.range = (typeof options.range === 'boolean') && options.range;
      extra.loc = (typeof options.loc === 'boolean') && options.loc;
      if (typeof options.tolerant === 'boolean' && options.tolerant) {
          extra.errors = [];
      }
      try {
          peek();
          if (lookahead.type === Token.EOF) {
              return extra.tokens;
          }
          lex();
          while (lookahead.type !== Token.EOF) {
              try {
                  lex();
              } catch (lexError) {
                  if (extra.errors) {
                      extra.errors.push(lexError);
                      break;
                  } else {
                      throw lexError;
                  }
              }
          }
          filterTokenLocation();
          tokens = extra.tokens;
          if (typeof extra.errors !== 'undefined') {
              tokens.errors = extra.errors;
          }
      } catch (e) {
          throw e;
      } finally {
          extra = {};
      }
      return tokens;
  }
  function parse(code, options) {
      var program, toString;
      toString = String;
      if (typeof code !== 'string' && !(code instanceof String)) {
          code = toString(code);
      }
      source = code;
      index = 0;
      lineNumber = (source.length > 0) ? 1 : 0;
      lineStart = 0;
      length = source.length;
      lookahead = null;
      state = {
          allowIn: true,
          labelSet: {},
          parenthesisCount: 0,
          inFunctionBody: false,
          inIteration: false,
          inSwitch: false,
          lastCommentStart: -1
      };
      extra = {};
      if (typeof options !== 'undefined') {
          extra.range = (typeof options.range === 'boolean') && options.range;
          extra.loc = (typeof options.loc === 'boolean') && options.loc;
          if (extra.loc && options.source !== null && options.source !== undefined) {
              extra.source = toString(options.source);
          }
          if (typeof options.tokens === 'boolean' && options.tokens) {
              extra.tokens = [];
          }
          if (typeof options.tolerant === 'boolean' && options.tolerant) {
              extra.errors = [];
          }
      }
      try {
          program = parseProgram();
          if (typeof extra.tokens !== 'undefined') {
              filterTokenLocation();
              program.tokens = extra.tokens;
          }
          if (typeof extra.errors !== 'undefined') {
              program.errors = extra.errors;
          }
      } catch (e) {
          throw e;
      } finally {
          extra = {};
      }
      return program;
  }
  return {
    tokenize: tokenize,
    parse: parse
  };
})();

var constants = {
  'NaN':     'NaN',
  'E':       'Math.E',
  'LN2':     'Math.LN2',
  'LN10':    'Math.LN10',
  'LOG2E':   'Math.LOG2E',
  'LOG10E':  'Math.LOG10E',
  'PI':      'Math.PI',
  'SQRT1_2': 'Math.SQRT1_2',
  'SQRT2':   'Math.SQRT2'
};

var functions = function(codegen) {
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
    'isNaN':    'isNaN',
    'isFinite': 'isFinite',
    'abs':      'Math.abs',
    'acos':     'Math.acos',
    'asin':     'Math.asin',
    'atan':     'Math.atan',
    'atan2':    'Math.atan2',
    'ceil':     'Math.ceil',
    'cos':      'Math.cos',
    'exp':      'Math.exp',
    'floor':    'Math.floor',
    'log':      'Math.log',
    'max':      'Math.max',
    'min':      'Math.min',
    'pow':      'Math.pow',
    'random':   'Math.random',
    'round':    'Math.round',
    'sin':      'Math.sin',
    'sqrt':     'Math.sqrt',
    'tan':      'Math.tan',
    'clamp': function(args) {
      if (args.length < 3)
        throw new Error('Missing arguments to clamp function.');
      if (args.length > 3)
        throw new Error('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },
    'now':             'Date.now',
    'utc':             'Date.UTC',
    'datetime':        DATE,
    'date':            fn('getDate', DATE, 0),
    'day':             fn('getDay', DATE, 0),
    'year':            fn('getFullYear', DATE, 0),
    'month':           fn('getMonth', DATE, 0),
    'hours':           fn('getHours', DATE, 0),
    'minutes':         fn('getMinutes', DATE, 0),
    'seconds':         fn('getSeconds', DATE, 0),
    'milliseconds':    fn('getMilliseconds', DATE, 0),
    'time':            fn('getTime', DATE, 0),
    'timezoneoffset':  fn('getTimezoneOffset', DATE, 0),
    'utcdate':         fn('getUTCDate', DATE, 0),
    'utcday':          fn('getUTCDay', DATE, 0),
    'utcyear':         fn('getUTCFullYear', DATE, 0),
    'utcmonth':        fn('getUTCMonth', DATE, 0),
    'utchours':        fn('getUTCHours', DATE, 0),
    'utcminutes':      fn('getUTCMinutes', DATE, 0),
    'utcseconds':      fn('getUTCSeconds', DATE, 0),
    'utcmilliseconds': fn('getUTCMilliseconds', DATE, 0),
    'length':      fn('length', null, -1),
    'indexof':     fn('indexOf', null),
    'lastindexof': fn('lastIndexOf', null),
    'parseFloat':  'parseFloat',
    'parseInt':    'parseInt',
    'upper':       fn('toUpperCase', STRING, 0),
    'lower':       fn('toLowerCase', STRING, 0),
    'slice':       fn('slice', STRING),
    'substring':   fn('substring', STRING),
    'replace':     fn('replace', STRING),
    'regexp':  REGEXP,
    'test':    fn('test', REGEXP),
    'if': function(args) {
        if (args.length < 3)
          throw new Error('Missing arguments to if function.');
        if (args.length > 3)
          throw new Error('Too many arguments to if function.');
        var a = args.map(codegen);
        return '('+a[0]+'?'+a[1]+':'+a[2]+')';
      }
  };
};

function toMap(list) {
  var map = {}, i, n;
  for (i=0, n=list.length; i<n; ++i) map[list[i]] = 1;
  return map;
}
function keys$2(object) {
  var list = [], k;
  for (k in object) list.push(k);
  return list;
}
var codegen = function(opt) {
  opt = opt || {};
  var constants$$1 = opt.constants || constants,
      functions$$1 = (opt.functions || functions)(codegen),
      functionDefs = opt.functionDefs ? opt.functionDefs(codegen) : {},
      idWhiteList = opt.idWhiteList ? toMap(opt.idWhiteList) : null,
      idBlackList = opt.idBlackList ? toMap(opt.idBlackList) : null,
      memberDepth = 0,
      FIELD_VAR = opt.fieldVar || 'datum',
      GLOBAL_VAR = opt.globalVar || 'signals',
      globals = {},
      fields = {},
      dataSources = {};
  function codegen_wrap(ast) {
    var retval = {
      code: codegen(ast),
      globals: keys$2(globals),
      fields: keys$2(fields),
      dataSources: keys$2(dataSources),
      defs: functionDefs
    };
    globals = {};
    fields = {};
    dataSources = {};
    return retval;
  }
  var lookupGlobal = typeof GLOBAL_VAR === 'function' ? GLOBAL_VAR :
    function (id) {
      return GLOBAL_VAR + '["' + id + '"]';
    };
  function codegen(ast) {
    if (typeof ast === 'string') return ast;
    var generator = CODEGEN_TYPES[ast.type];
    if (generator == null) {
      throw new Error('Unsupported type: ' + ast.type);
    }
    return generator(ast);
  }
  var CODEGEN_TYPES = {
    'Literal': function(n) {
        return n.raw;
      },
    'Identifier': function(n) {
        var id = n.name;
        if (memberDepth > 0) {
          return id;
        }
        if (constants$$1.hasOwnProperty(id)) {
          return constants$$1[id];
        }
        if (idWhiteList) {
          if (idWhiteList.hasOwnProperty(id)) {
            return id;
          } else {
            globals[id] = 1;
            return lookupGlobal(id);
          }
        }
        if (idBlackList && idBlackList.hasOwnProperty(id)) {
          throw new Error('Illegal identifier: ' + id);
        }
        return id;
      },
    'Program': function(n) {
        return n.body.map(codegen).join('\n');
      },
    'MemberExpression': function(n) {
        var d = !n.computed;
        var o = codegen(n.object);
        if (d) memberDepth += 1;
        var p = codegen(n.property);
        if (o === FIELD_VAR) { fields[p] = 1; }
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },
    'CallExpression': function(n) {
        if (n.callee.type !== 'Identifier') {
          throw new Error('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions$$1.hasOwnProperty(callee) && functions$$1[callee];
        if (!fn) throw new Error('Unrecognized function: ' + callee);
        return fn instanceof Function ?
          fn(args, globals, fields, dataSources) :
          fn + '(' + args.map(codegen).join(',') + ')';
      },
    'ArrayExpression': function(n) {
        return '[' + n.elements.map(codegen).join(',') + ']';
      },
    'BinaryExpression': function(n) {
        return '(' + codegen(n.left) + n.operator + codegen(n.right) + ')';
      },
    'UnaryExpression': function(n) {
        return '(' + n.operator + codegen(n.argument) + ')';
      },
    'ConditionalExpression': function(n) {
        return '(' + codegen(n.test) +
          '?' + codegen(n.consequent) +
          ':' + codegen(n.alternate) +
          ')';
      },
    'LogicalExpression': function(n) {
        return '(' + codegen(n.left) + n.operator + codegen(n.right) + ')';
      },
    'ObjectExpression': function(n) {
        return '{' + n.properties.map(codegen).join(',') + '}';
      },
    'Property': function(n) {
        memberDepth += 1;
        var k = codegen(n.key);
        memberDepth -= 1;
        return k + ':' + codegen(n.value);
      },
    'ExpressionStatement': function(n) {
        return codegen(n.expression);
      }
  };
  codegen_wrap.functions = functions$$1;
  codegen_wrap.functionDefs = functionDefs;
  codegen_wrap.constants = constants$$1;
  return codegen_wrap;
};

var src$2 = createCommonjsModule(function (module) {
var expr = module.exports = {
  parse: function(input, opt) {
      return parser.parse('('+input+')', opt);
    },
  code: function(opt) {
      return codegen(opt);
    },
  compiler: function(args, opt) {
      args = args.slice();
      var generator = codegen(opt),
          len = args.length,
          compile = function(str) {
            var value = generator(expr.parse(str));
            args[len] = '"use strict"; return (' + value.code + ');';
            var fn = Function.apply(null, args);
            value.fn = (args.length > 8) ?
              function() { return fn.apply(value, arguments); } :
              function(a, b, c, d, e, f, g) {
                return fn.call(value, a, b, c, d, e, f, g);
              };
            return value;
          };
      compile.codegen = generator;
      return compile;
    },
  functions: functions,
  constants: constants
};
});
var src_1$2 = src$2.parse;
var src_2$2 = src$2.code;
var src_3$2 = src$2.compiler;
var src_4$2 = src$2.functions;
var src_5$2 = src$2.constants;

var template = datalib.template,
    args = ['datum', 'parent', 'event', 'signals'];
var compile = src$2.compiler(args, {
  idWhiteList: args,
  fieldVar:    args[0],
  globalVar:   function(id) {
    return 'this.sig[' + datalib.str(id) + ']._value';
  },
  functions:   function(codegen) {
    var fn = src$2.functions(codegen);
    fn.eventItem  = 'event.vg.getItem';
    fn.eventGroup = 'event.vg.getGroup';
    fn.eventX     = 'event.vg.getX';
    fn.eventY     = 'event.vg.getY';
    fn.open       = openGen(codegen);
    fn.scale      = scaleGen(codegen, false);
    fn.iscale     = scaleGen(codegen, true);
    fn.inrange    = 'this.defs.inrange';
    fn.indata     = indataGen(codegen);
    fn.format     = 'this.defs.format';
    fn.timeFormat = 'this.defs.timeFormat';
    fn.utcFormat  = 'this.defs.utcFormat';
    return fn;
  },
  functionDefs: function(           ) {
    return {
      'scale':      scale,
      'inrange':    inrange,
      'indata':     indata,
      'format':     numberFormat,
      'timeFormat': timeFormat,
      'utcFormat':  utcFormat,
      'open':       windowOpen
    };
  }
});
function openGen(codegen) {
  return function (args) {
    args = args.map(codegen);
    var n = args.length;
    if (n < 1 || n > 2) {
      throw Error("open takes exactly 1 or 2 arguments.");
    }
    return 'this.defs.open(this.model, ' +
      args[0] + (n > 1 ? ',' + args[1] : '') + ')';
  };
}
function windowOpen(model, url, name) {
  if (typeof window !== 'undefined' && window && window.open) {
    var opt = datalib.extend({type: 'open', url: url, name: name}, model.config().load),
        uri = datalib.load.sanitizeUrl(opt);
    if (uri) {
      window.open(uri, name);
    } else {
      throw Error('Invalid URL: ' + opt.url);
    }
  } else {
    throw Error('Open function can only be invoked in a browser.');
  }
}
function scaleGen(codegen, invert) {
  return function(args) {
    args = args.map(codegen);
    var n = args.length;
    if (n < 2 || n > 3) {
      throw Error("scale takes exactly 2 or 3 arguments.");
    }
    return 'this.defs.scale(this.model, ' + invert + ', ' +
      args[0] + ',' + args[1] + (n > 2 ? ',' + args[2] : '') + ')';
  };
}
function scale(model, invert, name, value, scope) {
  if (!scope || !scope.scale) {
    scope = (scope && scope.mark) ? scope.mark.group : model.scene().items[0];
  }
  if (model.group(scope._id) !== scope) {
    throw Error('Scope for scale "'+name+'" is not a valid group item.');
  }
  var s = scope.scale(name);
  return !s ? value : (invert ? s.invert(value) : s(value));
}
function inrange(val, a, b, exclusive) {
  var min = a, max = b;
  if (a > b) { min = b; max = a; }
  return exclusive ?
    (min < val && max > val) :
    (min <= val && max >= val);
}
function indataGen(codegen) {
  return function(args, globals, fields, dataSources) {
    var data;
    if (args.length !== 3) {
      throw Error("indata takes 3 arguments.");
    }
    if (args[0].type !== 'Literal') {
      throw Error("Data source name must be a literal for indata.");
    }
    data = args[0].value;
    dataSources[data] = 1;
    if (args[2].type === 'Literal') {
      indataGen.model.requestIndex(data, args[2].value);
    }
    args = args.map(codegen);
    return 'this.defs.indata(this.model,' +
      args[0] + ',' + args[1] + ',' + args[2] + ')';
  };
}
function indata(model, dataname, val, field) {
  var data = model.data(dataname),
      index = data.getIndex(field);
  return index[val] > 0;
}
function numberFormat(specifier, v) {
  return template.format(specifier, 'number')(v);
}
function timeFormat(specifier, d) {
  return template.format(specifier, 'time')(d);
}
function utcFormat(specifier, d) {
  return template.format(specifier, 'utc')(d);
}
function wrap$1(model) {
  return function(str) {
    indataGen.model = model;
    var x = compile(str);
    x.model = model;
    x.sig = model ? model._signals : {};
    return x;
  };
}
wrap$1.scale = scale;
wrap$1.codegen = compile.codegen;
var expr_1 = wrap$1;

var Gradient$1 = src$1.Gradient;
function lgnd(model) {
  var size  = null,
      shape = null,
      fill  = null,
      stroke  = null,
      opacity = null,
      spacing = null,
      values  = null,
      formatString = null,
      formatType   = null,
      title  = null,
      config = model.config().legend,
      orient = config.orient,
      offset = config.offset,
      padding = config.padding,
      tickArguments = [5],
      legendStyle = {},
      symbolStyle = {},
      gradientStyle = {},
      titleStyle = {},
      labelStyle = {},
      m = {
        titles:  {},
        symbols: {},
        labels:  {},
        gradient: {}
      };
  var legend = {},
      legendDef = {};
  function reset() { legendDef.type = null; }
  function ingest(d, i) { return {data: d, index: i}; }
  legend.def = function() {
    var scale = size || shape || fill || stroke || opacity;
    if (!legendDef.type) {
      legendDef = (scale===fill || scale===stroke) && !discrete(scale.type) ?
        quantDef(scale) : ordinalDef(scale);
    }
    legendDef.orient = orient;
    legendDef.offset = offset;
    legendDef.padding = padding;
    legendDef.margin = config.margin;
    return legendDef;
  };
  function discrete(type) {
    return type==='ordinal' || type==='quantize' ||
           type==='quantile' || type==='threshold';
  }
  function ordinalDef(scale) {
    var def = o_legend_def(size, shape, fill, stroke, opacity);
    var data = (values == null ?
      (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) :
      values).map(ingest);
    var fmt = util$1.getTickFormat(scale, data.length, formatType, formatString);
    var fs, range, offset, pad=5, domain = d3.range(data.length);
    if (size) {
      range = data.map(function(x) { return Math.sqrt(size(x.data)); });
      offset = d3.max(range);
      range = range.reduce(function(a,b,i,z) {
          if (i > 0) a[i] = a[i-1] + z[i-1]/2 + pad;
          return (a[i] += b/2, a); }, [0]).map(Math.round);
    } else {
      offset = Math.round(Math.sqrt(config.symbolSize));
      range = spacing ||
        (fs = labelStyle.fontSize) && (fs.value + pad) ||
        (config.labelFontSize + pad);
      range = domain.map(function(d,i) {
        return Math.round(offset/2 + i*range);
      });
    }
    var sz = padding, ts;
    if (title) {
      ts = titleStyle.fontSize;
      sz += 5 + ((ts && ts.value) || config.titleFontSize);
    }
    for (var i=0, n=range.length; i<n; ++i) range[i] += sz;
    def.scales = def.scales || [{}];
    datalib.extend(def.scales[0], {
      name: 'legend',
      type: 'ordinal',
      points: true,
      domain: domain,
      range: range
    });
    var tdata = (title ? [title] : []).map(ingest);
    data.forEach(function(d) {
      d.label = fmt(d.data);
      d.offset = offset;
    });
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return data; };
    def.marks[2].from = def.marks[1].from;
    return def;
  }
  function o_legend_def(size, shape, fill, stroke, opacity) {
    var titles  = datalib.extend(m.titles, legendTitle(config)),
        symbols = datalib.extend(m.symbols, legendSymbols(config)),
        labels  = datalib.extend(m.labels, vLegendLabels(config));
    legendSymbolExtend(symbols, size, shape, fill, stroke, opacity);
    datalib.extend(titles.properties.update,  titleStyle);
    datalib.extend(symbols.properties.update, symbolStyle);
    datalib.extend(labels.properties.update,  labelStyle);
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    labels.properties.enter.x.offset += padding + 1;
    symbols.properties.enter.x.offset = padding + 1;
    labels.properties.update.x.offset += padding + 1;
    symbols.properties.update.x.offset = padding + 1;
    datalib.extend(legendDef, {
      type: 'group',
      interactive: false,
      properties: {
        enter: properties_1(model, 'group', legendStyle),
        legendPosition: {
          encode: legendPosition.bind(null, config),
          signals: [], scales:[], data: [], fields: []
        }
      }
    });
    legendDef.marks = [titles, symbols, labels].map(function(m) { return mark(model, m); });
    return legendDef;
  }
  function quantDef(scale) {
    var def = q_legend_def(scale),
        dom = scale.domain(),
        data  = (values == null ? dom : values).map(ingest),
        width = (gradientStyle.width && gradientStyle.width.value) || config.gradientWidth,
        fmt = util$1.getTickFormat(scale, data.length, formatType, formatString);
    def.scales = def.scales || [{}];
    var layoutSpec = datalib.extend(def.scales[0], {
      name: 'legend',
      type: scale.type,
      round: true,
      zero: false,
      domain: [dom[0], dom[dom.length-1]],
      range: [padding, width+padding]
    });
    if (scale.type==='pow') layoutSpec.exponent = scale.exponent();
    var tdata = (title ? [title] : []).map(ingest);
    data.forEach(function(d,i) {
      d.label = fmt(d.data);
      d.align = i==(data.length-1) ? 'right' : i===0 ? 'left' : 'center';
    });
    def.marks[0].from = function() { return tdata; };
    def.marks[1].from = function() { return [1]; };
    def.marks[2].from = function() { return data; };
    return def;
  }
  function q_legend_def(scale) {
    var titles = datalib.extend(m.titles, legendTitle(config)),
        gradient = datalib.extend(m.gradient, legendGradient(config)),
        labels = datalib.extend(m.labels, hLegendLabels(config)),
        grad = new Gradient$1();
    var dom = scale.domain(),
        min = dom[0],
        max = dom[dom.length-1],
        f = scale.copy().domain([min, max]).range([0,1]);
    var stops = (scale.type !== 'linear' && scale.ticks) ?
      scale.ticks.call(scale, 15) : dom;
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);
    for (var i=0, n=stops.length; i<n; ++i) {
      grad.stop(f(stops[i]), scale(stops[i]));
    }
    gradient.properties.enter.fill = {value: grad};
    datalib.extend(titles.properties.update, titleStyle);
    datalib.extend(gradient.properties.update, gradientStyle);
    datalib.extend(labels.properties.update, labelStyle);
    var gp = gradient.properties, gh = gradientStyle.height,
        hh = (gh && gh.value) || gp.enter.height.value;
    labels.properties.enter.y.value = hh;
    labels.properties.update.y.value = hh;
    if (title) {
      var tp = titles.properties, fs = titleStyle.fontSize,
          sz = 4 + ((fs && fs.value) || tp.enter.fontSize.value);
      gradient.properties.enter.y.value += sz;
      labels.properties.enter.y.value += sz;
      gradient.properties.update.y.value += sz;
      labels.properties.update.y.value += sz;
    }
    titles.properties.enter.x.value += padding;
    titles.properties.enter.y.value += padding;
    gradient.properties.enter.x.value += padding;
    gradient.properties.enter.y.value += padding;
    labels.properties.enter.y.value += padding;
    gradient.properties.update.x.value += padding;
    gradient.properties.update.y.value += padding;
    labels.properties.update.y.value += padding;
    datalib.extend(legendDef, {
      type: 'group',
      interactive: false,
      properties: {
        enter: properties_1(model, 'group', legendStyle),
        legendPosition: {
          encode: legendPosition.bind(null, config),
          signals: [], scales: [], data: [], fields: []
        }
      }
    });
    legendDef.marks = [titles, gradient, labels].map(function(m) { return mark(model, m); });
    return legendDef;
  }
  legend.size = function(x) {
    if (!arguments.length) return size;
    if (size !== x) { size = x; reset(); }
    return legend;
  };
  legend.shape = function(x) {
    if (!arguments.length) return shape;
    if (shape !== x) { shape = x; reset(); }
    return legend;
  };
  legend.fill = function(x) {
    if (!arguments.length) return fill;
    if (fill !== x) { fill = x; reset(); }
    return legend;
  };
  legend.stroke = function(x) {
    if (!arguments.length) return stroke;
    if (stroke !== x) { stroke = x; reset(); }
    return legend;
  };
  legend.opacity = function(x) {
    if (!arguments.length) return opacity;
    if (opacity !== x) { opacity = x; reset(); }
    return legend;
  };
  legend.title = function(x) {
    if (!arguments.length) return title;
    if (title !== x) { title = x; reset(); }
    return legend;
  };
  legend.format = function(x) {
    if (!arguments.length) return formatString;
    if (formatString !== x) {
      formatString = x;
      reset();
    }
    return legend;
  };
  legend.formatType = function(x) {
    if (!arguments.length) return formatType;
    if (formatType !== x) {
      formatType = x;
      reset();
    }
    return legend;
  };
  legend.spacing = function(x) {
    if (!arguments.length) return spacing;
    if (spacing !== +x) { spacing = +x; reset(); }
    return legend;
  };
  legend.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x in LEGEND_ORIENT ? x + '' : config.orient;
    return legend;
  };
  legend.offset = function(x) {
    if (!arguments.length) return offset;
    offset = +x;
    return legend;
  };
  legend.values = function(x) {
    if (!arguments.length) return values;
    values = x;
    return legend;
  };
  legend.legendProperties = function(x) {
    if (!arguments.length) return legendStyle;
    legendStyle = x;
    return legend;
  };
  legend.symbolProperties = function(x) {
    if (!arguments.length) return symbolStyle;
    symbolStyle = x;
    return legend;
  };
  legend.gradientProperties = function(x) {
    if (!arguments.length) return gradientStyle;
    gradientStyle = x;
    return legend;
  };
  legend.labelProperties = function(x) {
    if (!arguments.length) return labelStyle;
    labelStyle = x;
    return legend;
  };
  legend.titleProperties = function(x) {
    if (!arguments.length) return titleStyle;
    titleStyle = x;
    return legend;
  };
  legend.reset = function() {
    reset();
    return legend;
  };
  return legend;
}
var LEGEND_ORIENT = {
  'left': 'x1',
  'right': 'x2',
  'top-left': 'x1',
  'top-right': 'x2',
  'bottom-left': 'x1',
  'bottom-right': 'x2'
};
function legendPosition(config, item, group, trans, db, signals, predicates) {
  var o = trans ? {} : item, i,
      def = item.mark.def,
      offset = def.offset,
      orient = def.orient,
      pad = def.padding * 2,
      ao  = orient === 'left' ? 0 : group.width,
      lw  = ~~item.bounds.width() + (item.width ? 0 : pad),
      lh  = ~~item.bounds.height() + (item.height ? 0 : pad),
      pos = group._legendPositions ||
        (group._legendPositions = {right: 0.5, left: 0.5});
  o.x = 0.5;
  o.y = 0.5;
  o.width = lw;
  o.height = lh;
  if (orient === 'left' || orient === 'right') {
    o.y = pos[orient];
    pos[orient] += lh + def.margin;
    var axes  = group.axes,
        items = group.axisItems,
        bound = LEGEND_ORIENT[orient];
    for (i=0; i<axes.length; ++i) {
      if (axes[i].orient() === orient) {
        ao = Math.max(ao, Math.abs(items[i].bounds[bound]));
      }
    }
  }
  switch (orient) {
    case 'left':
      o.x -= ao + offset + lw;
      break;
    case 'right':
      o.x += ao + offset;
      break;
    case 'top-left':
      o.x += offset;
      o.y += offset;
      break;
    case 'top-right':
      o.x += group.width - lw - offset;
      o.y += offset;
      break;
    case 'bottom-left':
      o.x += offset;
      o.y += group.height - lh - offset;
      break;
    case 'bottom-right':
      o.x += group.width - lw - offset;
      o.y += group.height - lh - offset;
      break;
  }
  var baseline = config.baseline,
      totalHeight = 0;
  for (i=0; i<group.legendItems.length; i++) {
    var currItem = group.legendItems[i];
    totalHeight += currItem.bounds.height() + (item.height ? 0 : pad);
  }
  if (baseline === 'middle') {
    o.y += offset + (group.height / 2) - (totalHeight / 2);
  } else if (baseline === 'bottom') {
    o.y += offset + group.height - totalHeight;
  }
  if (trans) trans.interpolate(item, o);
  var enc = item.mark.def.properties.enter.encode;
  enc.call(enc, item, group, trans, db, signals, predicates);
  return true;
}
function legendSymbolExtend(mark$$1, size, shape, fill, stroke, opacity) {
  var e = mark$$1.properties.enter,
      u = mark$$1.properties.update;
  if (size)    e.size    = u.size    = {scale: size.scaleName,   field: 'data'};
  if (shape)   e.shape   = u.shape   = {scale: shape.scaleName,  field: 'data'};
  if (fill)    e.fill    = u.fill    = {scale: fill.scaleName,   field: 'data'};
  if (stroke)  e.stroke  = u.stroke  = {scale: stroke.scaleName, field: 'data'};
  if (opacity) u.opacity = {scale: opacity.scaleName, field: 'data'};
}
function legendTitle(config) {
  return {
    type: 'text',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {value: 0},
        y: {value: 0},
        fill: {value: config.titleColor},
        font: {value: config.titleFont},
        fontSize: {value: config.titleFontSize},
        fontWeight: {value: config.titleFontWeight},
        baseline: {value: 'top'},
        text: {field: 'data'},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: { opacity: {value: 1} }
    }
  };
}
function legendSymbols(config) {
  return {
    type: 'symbol',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {field: 'offset', mult: 0.5},
        y: {scale: 'legend', field: 'index'},
        shape: {value: config.symbolShape},
        size: {value: config.symbolSize},
        stroke: {value: config.symbolColor},
        strokeWidth: {value: config.symbolStrokeWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {field: 'offset', mult: 0.5},
        y: {scale: 'legend', field: 'index'},
        opacity: {value: 1}
      }
    }
  };
}
function vLegendLabels(config) {
  return {
    type: 'text',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {field: 'offset', offset: 5},
        y: {scale: 'legend', field: 'index'},
        fill: {value: config.labelColor},
        font: {value: config.labelFont},
        fontSize: {value: config.labelFontSize},
        align: {value: config.labelAlign},
        baseline: {value: config.labelBaseline},
        text: {field: 'label'},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        opacity: {value: 1},
        x: {field: 'offset', offset: 5},
        y: {scale: 'legend', field: 'index'},
      }
    }
  };
}
function legendGradient(config) {
  return {
    type: 'rect',
    interactive: false,
    properties: {
      enter: {
        x: {value: 0},
        y: {value: 0},
        width: {value: config.gradientWidth},
        height: {value: config.gradientHeight},
        stroke: {value: config.gradientStrokeColor},
        strokeWidth: {value: config.gradientStrokeWidth},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {value: 0},
        y: {value: 0},
        opacity: {value: 1}
      }
    }
  };
}
function hLegendLabels(config) {
  return {
    type: 'text',
    interactive: false,
    key: 'data',
    properties: {
      enter: {
        x: {scale: 'legend', field: 'data'},
        y: {value: 20},
        dy: {value: 2},
        fill: {value: config.labelColor},
        font: {value: config.labelFont},
        fontSize: {value: config.labelFontSize},
        align: {field: 'align'},
        baseline: {value: 'top'},
        text: {field: 'label'},
        opacity: {value: 1e-6}
      },
      exit: { opacity: {value: 1e-6} },
      update: {
        x: {scale: 'legend', field: 'data'},
        y: {value: 20},
        opacity: {value: 1}
      }
    }
  };
}
var legend = lgnd;

function parseLegends(model, spec, legends, group) {
  (spec || []).forEach(function(def, index) {
    legends[index] = legends[index] || legend(model);
    parseLegend(def, index, legends[index], group);
  });
}
function parseLegend(def, index, legend$$1, group) {
  legend$$1.size   (def.size    ? group.scale(def.size)    : null);
  legend$$1.shape  (def.shape   ? group.scale(def.shape)   : null);
  legend$$1.fill   (def.fill    ? group.scale(def.fill)    : null);
  legend$$1.stroke (def.stroke  ? group.scale(def.stroke)  : null);
  legend$$1.opacity(def.opacity ? group.scale(def.opacity) : null);
  if (def.orient) legend$$1.orient(def.orient);
  if (def.offset != null) legend$$1.offset(def.offset);
  legend$$1.title(def.title || null);
  legend$$1.values(def.values || null);
  legend$$1.format(def.format !== undefined ? def.format : null);
  legend$$1.formatType(def.formatType || null);
  var p = def.properties;
  legend$$1.titleProperties(p && p.title || {});
  legend$$1.labelProperties(p && p.labels || {});
  legend$$1.legendProperties(p && p.legend || {});
  legend$$1.symbolProperties(p && p.symbols || {});
  legend$$1.gradientProperties(p && p.gradient || {});
}
var legends = parseLegends;
parseLegends.schema = {
  "defs": {
    "legend": {
      "type": "object",
      "properties": {
        "size": {"type": "string"},
        "shape": {"type": "string"},
        "fill": {"type": "string"},
        "stroke": {"type": "string"},
        "opacity": {"type": "string"},
        "orient": {"enum": ["left", "right"], "default": "right"},
        "offset": {"type": "number"},
        "title": {"type": "string"},
        "values": {"type": "array"},
        "format": {"type": "string"},
        "formatType": {"enum": ["time", "utc", "string", "number"]},
        "properties": {
          "type": "object",
          "properties": {
            "title": {"$ref": "#/defs/propset"},
            "labels": {"$ref": "#/defs/propset"},
            "legend": {"$ref": "#/defs/propset"},
            "symbols": {"$ref": "#/defs/propset"},
            "gradient": {"$ref": "#/defs/propset"}
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false,
      "anyOf": [
        {"required": ["size"]},
        {"required": ["shape"]},
        {"required": ["fill"]},
        {"required": ["stroke"]},
        {"required": ["opacity"]}
      ]
    }
  }
};

function parseRootMark(model, spec, width, height) {
  return {
    type:       'group',
    width:      width,
    height:     height,
    properties: defaults(spec.scene || {}, model),
    scales:     spec.scales  || [],
    axes:       spec.axes    || [],
    legends:    spec.legends || [],
    marks:      (spec.marks || []).map(function(m) { return mark(model, m, true); })
  };
}
var PROPERTIES = [
  'fill', 'fillOpacity', 'stroke', 'strokeOpacity',
  'strokeWidth', 'strokeDash', 'strokeDashOffset'
];
function defaults(spec, model) {
  var config = model.config().scene,
      props = {}, i, n, m, p, s;
  for (i=0, n=m=PROPERTIES.length; i<n; ++i) {
    p = PROPERTIES[i];
    if ((s=spec[p]) !== undefined) {
      props[p] = s.signal ? s : {value: s};
    } else if (config[p]) {
      props[p] = {value: config[p]};
    } else {
      --m;
    }
  }
  return m ? {update: properties_1(model, 'group', props)} : {};
}
var marks$2 = parseRootMark;
parseRootMark.schema = {
  "defs": {
    "container": {
      "type": "object",
      "properties": {
        "scene": {
          "type": "object",
          "properties": {
            "fill": {
              "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
            },
            "fillOpacity": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
            "stroke": {
              "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
            },
            "strokeOpacity": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
            "strokeWidth": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
            "strokeDash": {
              "oneOf": [
                {"type": "array", "items": {"type": "number"}},
                {"$ref": "#/refs/signal"}
              ]
            },
            "strokeDashOffset": {
              "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]
            },
          }
        },
        "scales": {
          "type": "array",
          "items": {"$ref": "#/defs/scale"}
        },
        "axes": {
          "type": "array",
          "items": {"$ref": "#/defs/axis"}
        },
        "legends": {
          "type": "array",
          "items": {"$ref": "#/defs/legend"}
        },
        "marks": {
          "type": "array",
          "items": {"oneOf":[{"$ref": "#/defs/groupMark"}, {"$ref": "#/defs/visualMark"}]}
        }
      }
    },
    "groupMark": {
      "allOf": [
        {
          "properties": { "type": {"enum": ["group"]} },
          "required": ["type"]
        },
        {"$ref": "#/defs/mark"},
        {"$ref": "#/defs/container"}
      ]
    },
    "visualMark": {
      "allOf": [
        {
          "not": { "properties": { "type": {"enum": ["group"]} } },
        },
        {"$ref": "#/defs/mark"}
      ]
    }
  }
};

function parsePadding(pad) {
  return pad == null ? 'auto' :
    datalib.isObject(pad) ? pad :
    datalib.isNumber(pad) ? {top:pad, left:pad, right:pad, bottom:pad} :
    pad === 'strict' ? pad : 'auto';
}
var padding = parsePadding;
parsePadding.schema = {
  "defs": {
    "padding": {
      "oneOf": [{
        "enum": ["strict", "auto"]
      }, {
        "type": "number"
      }, {
        "type": "object",
        "properties": {
          "top": {"type": "number"},
          "bottom": {"type": "number"},
          "left": {"type": "number"},
          "right": {"type": "number"}
        },
        "additionalProperties": false
      }]
    }
  }
};

var types = {
  '=':   parseComparator,
  '==':  parseComparator,
  '!=':  parseComparator,
  '>':   parseComparator,
  '>=':  parseComparator,
  '<':   parseComparator,
  '<=':  parseComparator,
  'and': parseLogical,
  '&&':  parseLogical,
  'or':  parseLogical,
  '||':  parseLogical,
  'in':  parseIn
};
var nullScale = function() { return 0; };
nullScale.invert = nullScale;
function parsePredicates(model, spec) {
  (spec || []).forEach(function(s) {
    var parse = types[s.type](model, s);
    var pred  = Function("args", "db", "signals", "predicates", parse.code);
    pred.root = function() { return model.scene().items[0]; };
    pred.nullScale = nullScale;
    pred.isFunction = datalib.isFunction;
    pred.signals = parse.signals;
    pred.data = parse.data;
    model.predicate(s.name, pred);
  });
  return spec;
}
function parseSignal(signal, signals) {
  var s = datalib.field(signal),
      code = "signals["+s.map(datalib.str).join("][")+"]";
  signals[s[0]] = 1;
  return code;
}
function parseOperands(model, operands) {
  var decl = [], defs = [],
      signals = {}, db = {};
  function setSignal(s) { signals[s] = 1; }
  function setData(d) { db[d] = 1; }
  datalib.array(operands).forEach(function(o, i) {
    var name = "o" + i,
        def = "";
    if (o.value !== undefined) {
      def = datalib.str(o.value);
    } else if (o.arg) {
      def = "args["+datalib.str(o.arg)+"]";
    } else if (o.signal) {
      def = parseSignal(o.signal, signals);
    } else if (o.predicate) {
      var ref = o.predicate,
          predName = ref && (ref.name || ref),
          pred = model.predicate(predName),
          p = "predicates["+datalib.str(predName)+"]";
      pred.signals.forEach(setSignal);
      pred.data.forEach(setData);
      if (datalib.isObject(ref)) {
        datalib.keys(ref).forEach(function(k) {
          if (k === "name") return;
          var i = ref[k];
          def += "args["+datalib.str(k)+"] = ";
          if (i.signal) {
            def += parseSignal(i.signal, signals);
          } else if (i.arg) {
            def += "args["+datalib.str(i.arg)+"]";
          }
          def += ", ";
        });
      }
      def += p+".call("+p+", args, db, signals, predicates)";
    }
    decl.push(name);
    defs.push(name+"=("+def+")");
  });
  return {
    code: "var " + decl.join(", ") + ";\n" + defs.join(";\n") + ";\n",
    signals: datalib.keys(signals),
    data: datalib.keys(db)
  };
}
function parseComparator(model, spec) {
  var ops = parseOperands(model, spec.operands);
  if (spec.type === '=') spec.type = '==';
  ops.code += "o0 = o0 instanceof Date ? o0.getTime() : o0;\n" +
    "o1 = o1 instanceof Date ? o1.getTime() : o1;\n";
  return {
    code: ops.code + "return " + ["o0", "o1"].join(spec.type) + ";",
    signals: ops.signals,
    data: ops.data
  };
}
function parseLogical(model, spec) {
  var ops = parseOperands(model, spec.operands),
      o = [], i = 0, len = spec.operands.length;
  while (o.push("o"+i++) < len);
  if (spec.type === 'and') spec.type = '&&';
  else if (spec.type === 'or') spec.type = '||';
  return {
    code: ops.code + "return " + o.join(spec.type) + ";",
    signals: ops.signals,
    data: ops.data
  };
}
function parseIn(model, spec) {
  var o = [spec.item], code = "";
  if (spec.range) o.push.apply(o, spec.range);
  if (spec.scale) {
    code = parseScale(spec.scale, o);
  }
  var ops = parseOperands(model, o);
  code = ops.code + code + "\n  var ordSet = null;\n";
  if (spec.data) {
    var field = datalib.field(spec.field).map(datalib.str);
    code += "var where = function(d) { return d["+field.join("][")+"] == o0 };\n";
    code += "return db["+datalib.str(spec.data)+"].filter(where).length > 0;";
  } else if (spec.range) {
    if (spec.scale) {
      code += "if (scale.length == 2) {\n" +
        "  ordSet = scale(o1, o2);\n" +
        "} else {\n" +
        "  o1 = scale(o1);\no2 = scale(o2);\n" +
        "}";
    }
    code += "return ordSet !== null ? ordSet.indexOf(o0) !== -1 :\n" +
      "  o1 < o2 ? o1 <= o0 && o0 <= o2 : o2 <= o0 && o0 <= o1;";
  }
  return {
    code: code,
    signals: ops.signals,
    data: ops.data.concat(spec.data ? [spec.data] : [])
  };
}
function parseScale(spec, ops) {
  var code = "var scale = ",
      idx  = ops.length;
  if (datalib.isString(spec)) {
    ops.push({ value: spec });
    code += "this.root().scale(o"+idx+")";
  } else if (spec.arg) {
    ops.push(spec);
    code += "o"+idx;
  } else if (spec.name) {
    ops.push(datalib.isString(spec.name) ? {value: spec.name} : spec.name);
    code += "(this.isFunction(o"+idx+") ? o"+idx+" : ";
    if (spec.scope) {
      ops.push(spec.scope);
      code += "((o"+(idx+1)+".scale || this.root().scale)(o"+idx+") || this.nullScale)";
    } else {
      code += "this.root().scale(o"+idx+")";
    }
    code += ")";
  }
  if (spec.invert === true) {
    code += ".invert";
  }
  return code+";\n";
}
var predicates = parsePredicates;
parsePredicates.schema = {
  "refs": {
    "operand": {
      "type": "object",
      "oneOf": [
        {
          "properties": {"value": {}},
          "required": ["value"]
        },
        {
          "properties": {"arg": {"type": "string"}},
          "required": ["arg"]
        },
        {"$ref": "#/refs/signal"},
        {
          "properties": {
            "predicate": {
              "oneOf": [
                {"type": "string"},
                {
                  "type": "object",
                  "properties": {"name": {"type": "string"}},
                  "required": ["name"]
                }
              ]
            }
          },
          "required": ["predicate"]
        }
      ]
    }
  },
  "defs": {
    "predicate": {
      "type": "object",
      "oneOf": [{
        "properties": {
          "name": {"type": "string"},
          "type": {"enum": ["==", "!=", ">", "<", ">=", "<="]},
          "operands": {
            "type": "array",
            "items": {"$ref": "#/refs/operand"},
            "minItems": 2,
            "maxItems": 2
          }
        },
        "required": ["name", "type", "operands"]
      }, {
        "properties": {
          "name": {"type": "string"},
          "type": {"enum": ["and", "&&", "or", "||"]},
          "operands": {
            "type": "array",
            "items": {"$ref": "#/refs/operand"},
            "minItems": 2
          }
        },
        "required": ["name", "type", "operands"]
      }, {
        "properties": {
          "name": {"type": "string"},
          "type": {"enum": ["in"]},
          "item": {"$ref": "#/refs/operand"}
        },
        "oneOf": [
          {
            "properties": {
              "range": {
                "type": "array",
                "items": {"$ref": "#/refs/operand"},
                "minItems": 2
              },
              "scale": {"$ref": "#/refs/scopedScale"}
            },
            "required": ["range"]
          },
          {
            "properties": {
              "data": {"type": "string"},
              "field": {"type": "string"}
            },
            "required": ["data", "field"]
          }
        ],
        "required": ["name", "type", "item"]
      }]
    }
  }
};

var SIGNALS = src.Dependencies.SIGNALS;
var RESERVED = ['datum', 'event', 'signals', 'width', 'height', 'padding']
    .concat(datalib.keys(expr_1.codegen.functions));
function parseSignals(model, spec) {
  (spec || []).forEach(function(s) {
    if (RESERVED.indexOf(s.name) !== -1) {
      throw Error('Signal name "'+s.name+'" is a '+
        'reserved keyword ('+RESERVED.join(', ')+').');
    }
    var signal = model.signal(s.name, s.init)
      .verbose(s.verbose);
    if (s.init && s.init.expr) {
      s.init.expr = model.expr(s.init.expr);
      signal.value(exprVal(model, s.init));
    }
    if (s.expr) {
      s.expr = model.expr(s.expr);
      signal.evaluate = function(input) {
        var val = exprVal(model, s),
            sg  = input.signals;
        if (val !== signal.value() || signal.verbose()) {
          signal.value(val);
          sg[s.name] = 1;
        }
        return sg[s.name] ? input : model.doNotPropagate;
      };
      signal.dependency(SIGNALS, s.expr.globals);
      s.expr.globals.forEach(function(dep) {
        model.signal(dep).addListener(signal);
      });
    }
  });
  return spec;
}
function exprVal(model, spec) {
  var e = spec.expr, v = e.fn();
  return spec.scale ? parseSignals.scale(model, spec, v) : v;
}
parseSignals.scale = function scale(model, spec, value, datum, evt) {
  var def = spec.scale,
      name  = def.name || def.signal || def,
      scope = def.scope, e;
  if (scope) {
    if (scope.signal) {
      scope = model.signalRef(scope.signal);
    } else if (datalib.isString(scope)) {
      e = def._expr = (def._expr || model.expr(scope));
      scope = e.fn(datum, evt);
    }
  }
  return expr_1.scale(model, def.invert, name, value, scope);
};
var signals = parseSignals;
parseSignals.schema = {
  "refs": {
    "signal": {
      "title": "SignalRef",
      "type": "object",
      "properties": {"signal": {"type": "string"}},
      "required": ["signal"]
    },
    "scopedScale": {
      "oneOf": [
        {"type": "string"},
        {
          "type": "object",
          "properties": {
            "name": {
              "oneOf": [{"$ref": "#/refs/signal"}, {"type": "string"}]
            },
            "scope": {
              "oneOf": [
                {"$ref": "#/refs/signal"},
                {"type": "string"}
              ]
            },
            "invert": {"type": "boolean", "default": false}
          },
          "additionalProperties": false,
          "required": ["name"]
        }
      ]
    }
  },
  "defs": {
    "signal": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "not": {"enum": RESERVED}
        },
        "init": {},
        "verbose": {"type": "boolean", "default": false},
        "expr": {"type": "string"},
        "scale": {"$ref": "#/refs/scopedScale"},
        "streams": {"$ref": "#/defs/streams"}
      },
      "additionalProperties": false,
      "required": ["name"]
    }
  }
};

var Node$2 = src.Node,
    Deps$4 = src.Dependencies,
    bound$1 = src$1.bound;
var EMPTY$2 = {};
function Encoder(graph, mark, builder) {
  var props  = mark.def.properties || {},
      enter  = props.enter,
      update = props.update,
      exit   = props.exit;
  Node$2.prototype.init.call(this, graph);
  this._mark = mark;
  this._builder = builder;
  var s = this._scales = [];
  if (enter) s.push.apply(s, enter.scales);
  if (update) {
    this.dependency(Deps$4.DATA, update.data);
    this.dependency(Deps$4.SIGNALS, update.signals);
    this.dependency(Deps$4.FIELDS, update.fields);
    this.dependency(Deps$4.SCALES, update.scales);
    s.push.apply(s, update.scales);
  }
  if (exit) s.push.apply(s, exit.scales);
  return this.mutates(true);
}
var proto = (Encoder.prototype = new Node$2());
proto.evaluate = function(input) {
  vegaLogging.debug(input, ['encoding', this._mark.def.type]);
  var graph = this._graph,
      props = this._mark.def.properties || {},
      items = this._mark.items,
      enter  = props.enter,
      update = props.update,
      exit   = props.exit,
      dirty  = input.dirty,
      preds  = graph.predicates(),
      req = input.request,
      group = this._mark.group,
      guide = group && (group.mark.axis || group.mark.legend),
      db = EMPTY$2, sg = EMPTY$2, i, len, item, prop;
  if (req && !guide) {
    if ((prop = props[req]) && input.mod.length) {
      db = prop.data ? graph.values(Deps$4.DATA, prop.data) : null;
      sg = prop.signals ? graph.values(Deps$4.SIGNALS, prop.signals) : null;
      for (i=0, len=input.mod.length; i<len; ++i) {
        item = input.mod[i];
        encode.call(this, prop, item, input.trans, db, sg, preds, dirty);
      }
    }
    return input;
  }
  db = values$1(Deps$4.DATA, graph, input, props);
  sg = values$1(Deps$4.SIGNALS, graph, input, props);
  for (i=0, len=input.rem.length; i<len; ++i) {
    item = input.rem[i];
    if (exit) encode.call(this, exit, item, input.trans, db, sg, preds, dirty);
    if (input.trans && !exit) input.trans.interpolate(item, EMPTY$2);
    else if (!input.trans) items.pop();
  }
  var update_status = Builder_1.STATUS.UPDATE;
  for (i=0, len=input.add.length; i<len; ++i) {
    item = input.add[i];
    if (enter)  encode.call(this, enter,  item, input.trans, db, sg, preds, dirty);
    if (update) encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    item.status = update_status;
  }
  if (update) {
    for (i=0, len=input.mod.length; i<len; ++i) {
      item = input.mod[i];
      encode.call(this, update, item, input.trans, db, sg, preds, dirty);
    }
  }
  return input;
};
function values$1(type, graph, input, props) {
  var p, x, o, add = input.add.length;
  if ((p=props.enter) && (x=p[type]).length && add) {
    o = graph.values(type, x, (o=o||{}));
  }
  if ((p=props.exit) && (x=p[type]).length && input.rem.length) {
    o = graph.values(type, x, (o=o||{}));
  }
  if ((p=props.update) && (x=p[type]).length && (add || input.mod.length)) {
    o = graph.values(type, x, (o=o||{}));
  }
  return o || EMPTY$2;
}
function encode(prop, item, trans, db, sg, preds, dirty) {
  var enc = prop.encode,
      wasDirty = item._dirty,
      isDirty  = enc.call(enc, item, item.mark.group||item, trans, db, sg, preds);
  item._dirty = isDirty || wasDirty;
  if (isDirty && !wasDirty) dirty.push(item);
}
proto.reevaluate = function(pulse) {
  var def = this._mark.def,
      props = def.properties || {},
      reeval = datalib.isFunction(def.from) || def.orient || pulse.request ||
        Node$2.prototype.reevaluate.call(this, pulse);
  return reeval || (props.update ? nestedRefs.call(this) : false);
};
function nestedRefs() {
  var refs = this._mark.def.properties.update.nested,
      parent = this._builder,
      level = 0,
      i = 0, len = refs.length,
      ref, ds, stamp;
  for (; i<len; ++i) {
    ref = refs[i];
    if (ref.scale) continue;
    for (; level<ref.level; ++level) {
      parent = parent.parent();
      ds = parent.ds();
    }
    stamp = (ref.group ? parent.encoder() : ds.last())._stamp;
    if (stamp > this._stamp) return true;
  }
  return false;
}
Encoder.update = function(graph, trans, request, items, dirty) {
  items = datalib.array(items);
  var preds = graph.predicates(),
      db = graph.values(Deps$4.DATA),
      sg = graph.values(Deps$4.SIGNALS),
      i, len, item, props, prop;
  for (i=0, len=items.length; i<len; ++i) {
    item = items[i];
    props = item.mark.def.properties;
    prop = props && props[request];
    if (prop) {
      encode.call(null, prop, item, trans, db, sg, preds, dirty);
      bound$1.item(item);
    }
  }
};
var Encoder_1 = Encoder;

var Node$3 = src.Node,
    bound$2 = src$1.bound,
    Bounds$1 = src$1.Bounds;
function Bounder(graph, mark) {
  this._mark = mark;
  return Node$3.prototype.init.call(this, graph)
    .router(true)
    .reflows(true)
    .mutates(true);
}
var proto$1 = (Bounder.prototype = new Node$3());
proto$1.evaluate = function(input) {
  vegaLogging.debug(input, ['bounds', this._mark.marktype]);
  var mark  = this._mark,
      type  = mark.marktype,
      isGrp = type === 'group',
      items = mark.items,
      hasLegends = datalib.array(mark.def.legends).length > 0,
      bounds  = mark.bounds,
      rebound = !bounds || input.rem.length,
      i, ilen, j, jlen, group, legend;
  if (type === 'line' || type === 'area') {
    bound$2.mark(mark, null, isGrp && !hasLegends);
  } else {
    input.add.forEach(function(item) {
      bound$2.item(item);
      rebound = rebound || (bounds && !bounds.encloses(item.bounds));
    });
    input.mod.forEach(function(item) {
      rebound = rebound || (bounds && bounds.alignsWith(item.bounds));
      bound$2.item(item);
    });
    if (rebound) {
      bounds = mark.bounds && mark.bounds.clear() || (mark.bounds = new Bounds$1());
      for (i=0, ilen=items.length; i<ilen; ++i) bounds.union(items[i].bounds);
    }
  }
  if (isGrp && hasLegends) {
    for (i=0, ilen=items.length; i<ilen; ++i) {
      group = items[i];
      group._legendPositions = null;
      for (j=0, jlen=group.legendItems.length; j<jlen; ++j) {
        legend = group.legendItems[j];
        Encoder_1.update(this._graph, input.trans, 'legendPosition', legend.items, input.dirty);
        bound$2.mark(legend, null, false);
      }
    }
    bound$2.mark(mark, null, true);
  }
  return src.ChangeSet.create(input, true);
};
var Bounder_1 = Bounder;

var Item$1 = src$1.Item,
    Node$4 = src.Node,
    Deps$5 = src.Dependencies,
    Tuple$n = src.Tuple,
    ChangeSet$4 = src.ChangeSet,
    Sentinel = {};
function Builder() {
  return arguments.length ? this.init.apply(this, arguments) : this;
}
var Status = Builder.STATUS = {
  ENTER:  'enter',
  UPDATE: 'update',
  EXIT:   'exit'
};
var CONNECTED = 1, DISCONNECTED = 2;
var proto$2 = (Builder.prototype = new Node$4());
proto$2.init = function(graph, def, mark, parent, parent_id, inheritFrom) {
  Node$4.prototype.init.call(this, graph)
    .router(true)
    .collector(true);
  this._def   = def;
  this._mark  = mark;
  this._from  = (def.from ? def.from.data : null) || inheritFrom;
  this._ds    = datalib.isString(this._from) ? graph.data(this._from) : null;
  this._map   = {};
  this._status = null;
  mark.def = def;
  mark.marktype = def.type;
  mark.interactive = (def.interactive !== false);
  mark.items = [];
  if (datalib.isValid(def.name)) mark.name = def.name;
  this._parent = parent;
  this._parent_id = parent_id;
  if (def.from && (def.from.mark || def.from.transform || def.from.modify)) {
    inlineDs.call(this);
  }
  this._isSuper = (this._def.type !== 'group');
  this._encoder = new Encoder_1(this._graph, this._mark, this);
  this._bounder = new Bounder_1(this._graph, this._mark);
  this._output  = null;
  if (this._ds) { this._encoder.dependency(Deps$5.DATA, this._from); }
  this.dependency(Deps$5.DATA, this._encoder.dependency(Deps$5.DATA));
  this.dependency(Deps$5.SCALES, this._encoder.dependency(Deps$5.SCALES));
  this.dependency(Deps$5.SIGNALS, this._encoder.dependency(Deps$5.SIGNALS));
  return this;
};
function inlineDs() {
  var from = this._def.from,
      geom = from.mark,
      src$$1, name, spec, sibling, output, input, node;
  if (geom) {
    sibling = this.sibling(geom);
    src$$1  = sibling._isSuper ? sibling : sibling._bounder;
    name = ['vg', this._parent_id, geom, src$$1.listeners(true).length].join('_');
    spec = {
      name: name,
      transform: from.transform,
      modify: from.modify
    };
  } else {
    src$$1 = this._graph.data(this._from);
    if (!src$$1) throw Error('Data source "'+this._from+'" is not defined.');
    name = ['vg', this._from, this._def.type, src$$1.listeners(true).length].join('_');
    spec = {
      name: name,
      source: this._from,
      transform: from.transform,
      modify: from.modify
    };
  }
  this._from = name;
  this._ds = data.datasource(this._graph, spec);
  if (geom) {
    node = new Node$4(this._graph).addListener(this._ds.listener());
    node.evaluate = function(input) {
      var out  = ChangeSet$4.create(input),
          sout = sibling._output;
      out.add = sout.add;
      out.mod = sout.mod;
      out.rem = sout.rem;
      return out;
    };
    src$$1.addListener(node);
  } else {
    output = this._ds.source().last();
    input  = ChangeSet$4.create(output);
    input.add = output.add;
    input.mod = output.mod;
    input.rem = output.rem;
    input.stamp = null;
    this._graph.propagate(input, this._ds.listener(), output.stamp);
  }
}
proto$2.ds = function() { return this._ds; };
proto$2.parent   = function() { return this._parent; };
proto$2.encoder  = function() { return this._encoder; };
proto$2.pipeline = function() { return [this]; };
proto$2.connect = function() {
  var builder = this;
  this._graph.connect(this.pipeline());
  this._encoder._scales.forEach(function(s) {
    if (!(s = builder._parent.scale(s))) return;
    s.addListener(builder);
  });
  if (this._parent) {
    if (this._isSuper) this.addListener(this._parent._collector);
    else this._bounder.addListener(this._parent._collector);
  }
  return (this._status = CONNECTED, this);
};
proto$2.disconnect = function() {
  var builder = this;
  if (!this._listeners.length) return this;
  function disconnectScales(scales) {
    for(var i=0, len=scales.length, s; i<len; ++i) {
      if (!(s = builder._parent.scale(scales[i]))) continue;
      s.removeListener(builder);
    }
  }
  Node$4.prototype.disconnect.call(this);
  this._graph.disconnect(this.pipeline());
  disconnectScales(this._encoder._scales);
  disconnectScales(datalib.keys(this._mark._scaleRefs));
  return (this._status = DISCONNECTED, this);
};
proto$2.sibling = function(name) {
  return this._parent.child(name, this._parent_id);
};
proto$2.evaluate = function(input) {
  vegaLogging.debug(input, ['building', (this._from || this._def.from), this._def.type]);
  var self = this,
      def = this._mark.def,
      props  = def.properties || {},
      update = props.update   || {},
      output = ChangeSet$4.create(input),
      fullUpdate, fcs, data$$1, name;
  if (this._ds) {
    data$$1 = output.data[(name=this._ds.name())];
    output.data[name] = null;
    fullUpdate = this._encoder.reevaluate(output);
    output.data[name] = data$$1;
    fcs = this._ds.last();
    if (!fcs) throw Error('Builder evaluated before backing DataSource.');
    if (fcs.stamp > this._stamp) {
      join$1.call(this, fcs, output, this._ds.values(), true, fullUpdate);
    } else if (fullUpdate) {
      output.mod = this._mark.items.slice();
    }
  } else {
    data$$1 = datalib.isFunction(this._def.from) ? this._def.from() : [Sentinel];
    join$1.call(this, input, output, data$$1);
  }
  this._output = output = this._graph.evaluate(output, this._encoder);
  if (update.nested && update.nested.length && this._status === CONNECTED) {
    datalib.keys(this._mark._scaleRefs).forEach(function(s) {
      var scale = self._parent.scale(s);
      if (!scale) return;
      scale.addListener(self);
      self.dependency(Deps$5.SCALES, s);
      self._encoder.dependency(Deps$5.SCALES, s);
    });
  }
  if (this._isSuper) {
    output.mod = output.mod.filter(function(x) { return x._dirty; });
    output = this._graph.evaluate(output, this._bounder);
  }
  return output;
};
function newItem() {
  var item = Tuple$n.ingest(new Item$1(this._mark));
  if (this._def.width)  Tuple$n.set(item, 'width',  this._def.width);
  if (this._def.height) Tuple$n.set(item, 'height', this._def.height);
  return item;
}
function join$1(input, output, data$$1, ds, fullUpdate) {
  var keyf = keyFunction(this._def.key || (ds ? '_id' : null)),
      prev = this._mark.items || [],
      rem  = ds ? input.rem : prev,
      mod  = Tuple$n.idMap((!ds || fullUpdate) ? data$$1 : input.mod),
      next = [],
      i, key, len, item, datum, enter, diff;
  for (i=0, len=rem.length; i<len; ++i) {
    item = (rem[i] === prev[i]) ? prev[i] :
      keyf ? this._map[keyf(rem[i])] : rem[i];
    item.status = Status.EXIT;
  }
  for(i=0, len=data$$1.length; i<len; ++i) {
    datum = data$$1[i];
    item  = keyf ? this._map[key = keyf(datum)] : prev[i];
    enter = item ? false : (item = newItem.call(this), true);
    item.status = enter ? Status.ENTER : Status.UPDATE;
    diff = !enter && item.datum !== datum;
    item.datum = datum;
    if (keyf) {
      Tuple$n.set(item, 'key', key);
      this._map[key] = item;
    }
    if (enter) {
      output.add.push(item);
    } else if (diff || mod[datum._id]) {
      output.mod.push(item);
    }
    next.push(item);
  }
  for (i=0, len=rem.length; i<len; ++i) {
    item = (rem[i] === prev[i]) ? prev[i] :
      keyf ? this._map[key = keyf(rem[i])] : rem[i];
    if (item.status === Status.EXIT) {
      item._dirty = true;
      input.dirty.push(item);
      next.push(item);
      output.rem.push(item);
      if (keyf) this._map[key] = null;
    }
  }
  return (this._mark.items = next, output);
}
function keyFunction(key) {
  if (key == null) return null;
  var f = datalib.array(key).map(datalib.accessor);
  return function(d) {
    for (var s='', i=0, n=f.length; i<n; ++i) {
      if (i>0) s += '|';
      s += String(f[i](d));
    }
    return s;
  };
}
var Builder_1 = Builder;

var Node$5 = src.Node,
    Deps$6 = src.Dependencies;
var Properties = {
  width: 1,
  height: 1
};
var Types$1 = {
  LINEAR: 'linear',
  ORDINAL: 'ordinal',
  LOG: 'log',
  POWER: 'pow',
  SQRT: 'sqrt',
  TIME: 'time',
  TIME_UTC: 'utc',
  QUANTILE: 'quantile',
  QUANTIZE: 'quantize',
  THRESHOLD: 'threshold'
};
var DataRef = {
  DOMAIN: 'domain',
  RANGE: 'range',
  COUNT: 'count',
  GROUPBY: 'groupby',
  MIN: 'min',
  MAX: 'max',
  VALUE: 'value',
  ASC: 'asc',
  DESC: 'desc'
};
function Scale(graph, def, parent) {
  this._def     = def;
  this._parent  = parent;
  this._updated = false;
  return Node$5.prototype.init.call(this, graph).reflows(true);
}
var proto$3 = (Scale.prototype = new Node$5());
proto$3.evaluate = function(input) {
  var self = this,
      fn = function(group) { scale$1.call(self, group); };
  this._updated = false;
  input.add.forEach(fn);
  input.mod.forEach(fn);
  if (this._updated) {
    input.scales[this._def.name] = 1;
    vegaLogging.debug(input, ["scale", this._def.name]);
  }
  return src.ChangeSet.create(input, true);
};
proto$3.dependency = function(type, deps) {
  if (arguments.length == 2) {
    var method = (type === Deps$6.DATA ? 'data' : 'signal');
    deps = datalib.array(deps);
    for (var i=0, len=deps.length; i<len; ++i) {
      this._graph[method](deps[i]).addListener(this._parent);
    }
  }
  return Node$5.prototype.dependency.call(this, type, deps);
};
function scale$1(group) {
  var name = this._def.name,
      prev = name + ':prev',
      s = instance$1.call(this, group.scale(name)),
      m = s.type===Types$1.ORDINAL ? ordinal : quantitative,
      rng = range.call(this, group);
  m.call(this, s, rng, group);
  group.scale(name, s);
  group.scale(prev, group.scale(prev) || s);
  return s;
}
function instance$1(scale) {
  var config = this._graph.config(),
      type = this._def.type || Types$1.LINEAR;
  if (!scale || type !== scale.type) {
    var ctor = config.scale[type] || d3.scale[type];
    if (!ctor) throw Error('Unrecognized scale type: ' + type);
    (scale = ctor()).type = scale.type || type;
    scale.scaleName = this._def.name;
    scale._prev = {};
  }
  return scale;
}
function ordinal(scale, rng, group) {
  var def = this._def,
      prev = scale._prev,
      dataDrivenRange = false,
      pad = signal.call(this, def.padding) || 0,
      outer  = def.outerPadding == null ? pad : signal.call(this, def.outerPadding),
      points = def.points && signal.call(this, def.points),
      round  = signal.call(this, def.round) || def.round == null,
      domain, str, spatial=true;
  if (datalib.isObject(def.range) && !datalib.isArray(def.range)) {
    dataDrivenRange = true;
    rng = dataRef.call(this, DataRef.RANGE, def.range, scale, group);
  }
  domain = dataRef.call(this, DataRef.DOMAIN, def.domain, scale, group);
  if (domain && !datalib.equal(prev.domain, domain)) {
    scale.domain(domain);
    prev.domain = domain;
    this._updated = true;
  }
  if (!datalib.equal(prev.range, rng)) {
    if (def.bandSize) {
      var bw = signal.call(this, def.bandSize),
          len = domain.length,
          space = def.points ? (pad*bw) : (pad*bw*(len-1) + 2*outer),
          start;
      if (rng[0] > rng[1]) {
        start = rng[1] || 0;
        rng = [start + (bw * len + space), start];
      } else {
        start = rng[0] || 0;
        rng = [start, start + (bw * len + space)];
      }
      if (def.reverse) rng = rng.reverse();
    }
    str = typeof rng[0] === 'string';
    if (str || rng.length > 2 || rng.length===1 || dataDrivenRange) {
      scale.range(rng);
      spatial = false;
    } else if (points && round) {
      scale.rangeRoundPoints(rng, pad);
    } else if (points) {
      scale.rangePoints(rng, pad);
    } else if (round) {
      scale.rangeRoundBands(rng, pad, outer);
    } else {
      scale.rangeBands(rng, pad, outer);
    }
    prev.range = rng;
    this._updated = true;
  }
  if (!scale.invert && spatial) invertOrdinal(scale);
}
var bisect = d3.bisector(datalib.numcmp).right,
    findAsc = function(a, x) { return bisect(a,x) - 1; },
    findDsc = d3.bisector(function(a,b) { return -1 * datalib.numcmp(a,b); }).left;
function invertOrdinal(scale) {
  scale.invert = function(x, y) {
    var rng = scale.range(),
        asc = rng[0] < rng[1],
        find = asc ? findAsc : findDsc;
    if (arguments.length === 1) {
      if (!datalib.isNumber(x)) {
        throw Error('Ordinal scale inversion is only supported for numeric input ('+x+').');
      }
      return scale.domain()[find(rng, x)];
    } else if (arguments.length === 2) {
      if (!datalib.isNumber(x) || !datalib.isNumber(y)) {
        throw Error('Extents to ordinal invert are not numbers ('+x+', '+y+').');
      }
      var domain = scale.domain(),
          a = find(rng, x),
          b = find(rng, y),
          n = rng.length - 1;
      if (b < a) { a = b; b = a; }
      if (a < 0) a = 0;
      if (b > n) b = n;
      return (asc ? datalib.range(a, b+1) : datalib.range(b, a-1, -1))
        .map(function(i) { return domain[i]; });
    }
  };
}
function quantitative(scale, rng, group) {
  var def = this._def,
      prev = scale._prev,
      round = signal.call(this, def.round),
      exponent = signal.call(this, def.exponent),
      clamp = signal.call(this, def.clamp),
      nice = signal.call(this, def.nice),
      domain, interval;
  domain = (def.type === Types$1.QUANTILE) ?
    dataRef.call(this, DataRef.DOMAIN, def.domain, scale, group) :
    domainMinMax.call(this, scale, group);
  if (domain && !datalib.equal(prev.domain, domain)) {
    scale.domain(domain);
    prev.domain = domain;
    this._updated = true;
  }
  if (signal.call(this, def.range) === 'height') rng = rng.reverse();
  if (rng && !datalib.equal(prev.range, rng)) {
    scale[round && scale.rangeRound ? 'rangeRound' : 'range'](rng);
    prev.range = rng;
    this._updated = true;
  }
  if (exponent && def.type===Types$1.POWER) scale.exponent(exponent);
  if (clamp) scale.clamp(true);
  if (nice) {
    if (def.type === Types$1.TIME) {
      interval = d3.time[nice];
      if (!interval) vegaLogging.error('Unrecognized interval: ' + interval);
      scale.nice(interval);
    } else {
      scale.nice();
    }
  }
}
function isUniques(scale) {
  return scale.type === Types$1.ORDINAL || scale.type === Types$1.QUANTILE;
}
function getRefs(def) {
  return def.fields || datalib.array(def);
}
function inherits(refs) {
  return refs.some(function(r) {
    if (!r.data) return true;
    return r.data && datalib.array(r.field).some(function(f) {
      return f.parent;
    });
  });
}
function getFields$1(ref, group) {
  return datalib.array(ref.field).map(function(f) {
    return f.parent ?
      datalib.accessor(f.parent)(group.datum) :
      f;
  });
}
function aggrType(def, scale) {
  var refs = getRefs(def);
  if (refs.length == 1 && datalib.array(refs[0].field).length == 1) {
    return Aggregate_1.TYPES.TUPLE;
  }
  if (!isUniques(scale)) return Aggregate_1.TYPES.VALUE;
  if (!datalib.isObject(def.sort)) return Aggregate_1.TYPES.VALUE;
  return Aggregate_1.TYPES.MULTI;
}
function getCache(which, def, scale, group) {
  var refs = getRefs(def),
      inherit = inherits(refs),
      atype = aggrType(def, scale),
      uniques = isUniques(scale),
      sort = def.sort,
      ck = '_'+which,
      fields = getFields$1(refs[0], group);
  if (scale[ck] || this[ck]) return scale[ck] || this[ck];
  var cache = new Aggregate_1(this._graph).type(atype),
      groupby, summarize;
  if (inherit) {
    scale[ck] = cache;
  } else {
    this[ck]  = cache;
  }
  if (uniques) {
    if (atype === Aggregate_1.TYPES.VALUE) {
      groupby = [{ name: DataRef.GROUPBY, get: datalib.identity }];
      summarize = {'*': DataRef.COUNT};
    } else if (atype === Aggregate_1.TYPES.TUPLE) {
      groupby = [{ name: DataRef.GROUPBY, get: datalib.$(fields[0]) }];
      summarize = datalib.isObject(sort) ? [{
        field: DataRef.VALUE,
        get:  datalib.$(sort.field),
        ops: [sort.op]
      }] : {'*': DataRef.COUNT};
    } else {
      groupby   = DataRef.GROUPBY;
      summarize = [{ field: DataRef.VALUE, ops: [sort.op] }];
    }
  } else {
    groupby = [];
    summarize = [{
      field: DataRef.VALUE,
      get: (atype == Aggregate_1.TYPES.TUPLE) ? datalib.$(fields[0]) : datalib.identity,
      ops: [DataRef.MIN, DataRef.MAX],
      as:  [DataRef.MIN, DataRef.MAX]
    }];
  }
  cache.param('groupby', groupby)
    .param('summarize', summarize);
  return (cache._lastUpdate = -1, cache);
}
function dataRef(which, def, scale, group) {
  if (def == null) { return []; }
  if (datalib.isArray(def)) return def.map(signal.bind(this));
  var self = this, graph = this._graph,
      refs = getRefs(def),
      inherit = inherits(refs),
      atype = aggrType(def, scale),
      cache = getCache.apply(this, arguments),
      sort  = def.sort,
      uniques = isUniques(scale),
      i, rlen, j, flen, ref, fields, field, data, from, cmp;
  function addDep(s) {
    self.dependency(Deps$6.SIGNALS, s);
  }
  if (inherit || (!inherit && cache._lastUpdate < this._stamp)) {
    for (i=0, rlen=refs.length; i<rlen; ++i) {
      ref = refs[i];
      from = ref.data || group.datum._facetID;
      data = graph.data(from).last();
      if (data.stamp <= this._stamp) continue;
      fields = getFields$1(ref, group);
      for (j=0, flen=fields.length; j<flen; ++j) {
        field = fields[j];
        if (atype === Aggregate_1.TYPES.VALUE) {
          cache.accessors(null, field);
        } else if (atype === Aggregate_1.TYPES.MULTI) {
          cache.accessors(field, ref.sort || sort.field);
        }
        cache.evaluate(data);
      }
      this.dependency(Deps$6.DATA, from);
      cache.dependency(Deps$6.SIGNALS).forEach(addDep);
    }
    cache._lastUpdate = this._stamp;
    data = cache.aggr().result();
    if (uniques) {
      if (datalib.isObject(sort)) {
        cmp = sort.op + '_' + DataRef.VALUE;
        cmp = datalib.comparator(cmp);
      } else if (sort === true) {
        cmp = datalib.comparator(DataRef.GROUPBY);
      }
      if (cmp) data = data.sort(cmp);
      cache._values = data.map(function(d) { return d[DataRef.GROUPBY]; });
    } else {
      data = data[0];
      cache._values = !datalib.isValid(data) ? [] : [data[DataRef.MIN], data[DataRef.MAX]];
    }
  }
  return cache._values;
}
function signal(v) {
  if (!v || !v.signal) return v;
  var s = v.signal, ref;
  this.dependency(Deps$6.SIGNALS, (ref = datalib.field(s))[0]);
  return this._graph.signalRef(ref);
}
function domainMinMax(scale, group) {
  var def = this._def,
      domain = [null, null], s, z;
  if (def.domain !== undefined) {
    domain = (!datalib.isObject(def.domain)) ? domain :
      dataRef.call(this, DataRef.DOMAIN, def.domain, scale, group);
  }
  z = domain.length - 1;
  if (def.domainMin !== undefined) {
    if (datalib.isObject(def.domainMin)) {
      if (def.domainMin.signal) {
        domain[0] = datalib.isValid(s=signal.call(this, def.domainMin)) ? s : domain[0];
      } else {
        domain[0] = dataRef.call(this, DataRef.DOMAIN+DataRef.MIN, def.domainMin, scale, group)[0];
      }
    } else {
      domain[0] = def.domainMin;
    }
  }
  if (def.domainMax !== undefined) {
    if (datalib.isObject(def.domainMax)) {
      if (def.domainMax.signal) {
        domain[z] = datalib.isValid(s=signal.call(this, def.domainMax)) ? s : domain[z];
      } else {
        domain[z] = dataRef.call(this, DataRef.DOMAIN+DataRef.MAX, def.domainMax, scale, group)[1];
      }
    } else {
      domain[z] = def.domainMax;
    }
  }
  if (def.type !== Types$1.LOG && def.type !== Types$1.TIME && def.type !== Types$1.TIME_UTC && (def.zero || def.zero===undefined)) {
    domain[0] = Math.min(0, domain[0]);
    domain[z] = Math.max(0, domain[z]);
  }
  return domain;
}
function range(group) {
  var def = this._def,
      config = this._graph.config(),
      rangeVal = signal.call(this, def.range),
      rng = [null, null];
  if (rangeVal !== undefined) {
    if (typeof rangeVal === 'string') {
      if (Properties[rangeVal]) {
        rng = [0, group[rangeVal]];
      } else if (config.range[rangeVal]) {
        rng = config.range[rangeVal];
      } else {
        vegaLogging.error('Unrecogized range: ' + rangeVal);
        return rng;
      }
    } else if (datalib.isArray(rangeVal)) {
      rng = datalib.duplicate(rangeVal).map(signal.bind(this));
    } else if (datalib.isObject(rangeVal)) {
      return null;
    } else {
      rng = [0, rangeVal];
    }
  }
  if (def.rangeMin !== undefined) {
    rng[0] = def.rangeMin.signal ?
      signal.call(this, def.rangeMin) :
      def.rangeMin;
  }
  if (def.rangeMax !== undefined) {
    rng[rng.length-1] = def.rangeMax.signal ?
      signal.call(this, def.rangeMax) :
      def.rangeMax;
  }
  if (def.reverse !== undefined) {
    var rev = signal.call(this, def.reverse);
    if (datalib.isObject(rev)) {
      rev = datalib.accessor(rev.field)(group.datum);
    }
    if (rev) rng = rng.reverse();
  }
  var start = rng[0], end = rng[rng.length-1];
  if (start === null && end !== null || start !== null && end === null) {
    vegaLogging.error('Range is underspecified. Please ensure either the ' +
      '"range" property or both "rangeMin" and "rangeMax" are specified.');
  }
  return rng;
}
var Scale_1 = Scale;
var rangeDef = [
  {"enum": ["width", "height", "shapes", "category10", "category20", "category20b", "category20c"]},
  {
    "type": "array",
    "items": {"oneOf": [{"type":"string"}, {"type": "number"}, {"$ref": "#/refs/signal"}]}
  },
  {"$ref": "#/refs/signal"}
];
Scale.schema = {
  "refs": {
    "data": {
      "type": "object",
      "properties": {
        "data": {
          "oneOf": [
            {"type": "string"},
            {
              "type": "object",
              "properties": {
                "fields": {
                  "type": "array",
                  "items": {"$ref": "#/refs/data"}
                }
              },
              "required": ["fields"]
            }
          ]
        },
        "field": {
          "oneOf": [
            {"type": "string"},
            {
              "type": "array",
              "items": {"type": "string"}
            },
            {
              "type": "object",
              "properties": {
                "parent": {"type": "string"}
              },
              "required": ["parent"]
            },
            {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "parent": {"type": "string"}
                },
                "required": ["parent"]
              }
            }
          ]
        },
        "sort": {
          "oneOf": [{"type": "boolean"}, {
            "type": "object",
            "properties": {
              "field": {"type": "string"},
              "op": {"enum": Aggregate_1.VALID_OPS}
            }
          }]
        }
      },
      "additionalProperties": false
    }
  },
  "defs": {
    "scale": {
      "title": "Scale function",
      "type": "object",
      "allOf": [{
        "properties": {
          "name": {"type": "string"},
          "type": {
            "enum": [Types$1.LINEAR, Types$1.ORDINAL, Types$1.TIME, Types$1.TIME_UTC, Types$1.LOG,
              Types$1.POWER, Types$1.SQRT, Types$1.QUANTILE, Types$1.QUANTIZE, Types$1.THRESHOLD],
            "default": Types$1.LINEAR
          },
          "domain": {
            "oneOf": [
              {
                "type": "array",
                "items": {
                  "oneOf": [
                    {"type":"string"},
                    {"type": "number"},
                    {"$ref": "#/refs/signal"}
                  ]
                }
              },
              {"$ref": "#/refs/data"},
              {
                "type": "object",
                "properties": {
                  "fields": {
                    "type": "array",
                    "items": {"$ref": "#/refs/data"}
                  }
                },
                "required": ["fields"],
              }
            ]
          },
          "domainMin": {
            "oneOf": [
              {"type": "number"},
              {"$ref": "#/refs/data"},
              {"$ref": "#/refs/signal"}
            ]
          },
          "domainMax": {
            "oneOf": [
              {"type": "number"},
              {"$ref": "#/refs/data"},
              {"$ref": "#/refs/signal"}
            ]
          },
          "rangeMin": {
            "oneOf": [
              {"type":"string"},
              {"type": "number"},
              {"$ref": "#/refs/signal"}
            ]
          },
          "rangeMax": {
            "oneOf": [
              {"type":"string"},
              {"type": "number"},
              {"$ref": "#/refs/signal"}
            ]
          },
          "reverse": {
            "oneOf": [
              {"type": "boolean"},
              {"$ref": "#/refs/data"}
            ],
          },
          "round": {"type": "boolean"}
        },
        "required": ["name"]
      }, {
        "oneOf": [{
          "properties": {
            "type": {"enum": [Types$1.ORDINAL]},
            "range": {
              "oneOf": rangeDef.concat({"$ref": "#/refs/data"})
            },
            "points": {"oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}]},
            "padding": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
            "outerPadding": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
            "bandSize": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]}
          },
          "required": ["type"]
        }, {
          "properties": {
            "type": {"enum": [Types$1.TIME, Types$1.TIME_UTC]},
            "range": {"oneOf": rangeDef},
            "clamp": {"oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}]},
            "nice": {"oneOf": [{"enum": ["second", "minute", "hour",
              "day", "week", "month", "year"]}, {"$ref": "#/refs/signal"}]}
          },
          "required": ["type"]
        }, {
          "anyOf": [{
            "properties": {
              "type": {"enum": [Types$1.LINEAR, Types$1.LOG, Types$1.POWER, Types$1.SQRT,
                Types$1.QUANTILE, Types$1.QUANTIZE, Types$1.THRESHOLD], "default": Types$1.LINEAR},
              "range": {"oneOf": rangeDef},
              "clamp": {"oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}]},
              "nice": {"oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}]},
              "zero": {"oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}]}
            }
          }, {
            "properties": {
              "type": {"enum": [Types$1.POWER]},
              "exponent": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]}
            },
            "required": ["type"]
          }]
        }]
      }]
    }
  }
};

var Node$6  = src.Node,
    Deps$7  = src.Dependencies,
    Tuple$o = src.Tuple,
    Collector$1 = src.Collector;
function GroupBuilder() {
  this._children = {};
  this._scaler = null;
  this._recursor = null;
  this._scales = {};
  this.scale = scale$2.bind(this);
  return arguments.length ? this.init.apply(this, arguments) : this;
}
var Types$2 = GroupBuilder.TYPES = {
  GROUP:  "group",
  MARK:   "mark",
  AXIS:   "axis",
  LEGEND: "legend"
};
var proto$4 = (GroupBuilder.prototype = new Builder_1());
proto$4.init = function(graph, def) {
  var builder = this, name;
  this._scaler = new Node$6(graph);
  (def.scales||[]).forEach(function(s) {
    s = builder.scale((name=s.name), new Scale_1(graph, s, builder));
    builder.scale(name+":prev", s);
    builder._scaler.addListener(s);
  });
  this._recursor = new Node$6(graph);
  this._recursor.evaluate = recurse.bind(this);
  var scales = (def.axes||[]).reduce(function(acc, x) {
    acc[x.scale] = 1;
    return acc;
  }, {});
  scales = (def.legends||[]).reduce(function(acc, x) {
    acc[x.size || x.shape || x.fill || x.stroke || x.opacity] = 1;
    return acc;
  }, scales);
  this._recursor.dependency(Deps$7.SCALES, datalib.keys(scales));
  this._collector = new Collector$1(graph);
  return Builder_1.prototype.init.apply(this, arguments);
};
proto$4.evaluate = function() {
  var output  = Builder_1.prototype.evaluate.apply(this, arguments),
      model   = this._graph,
      builder = this,
      scales = this._scales,
      items  = this._mark.items;
  if (output.mod.length < items.length) {
    var fullUpdate = datalib.keys(scales).some(function(s) {
      return scales[s].reevaluate(output);
    });
    if (!fullUpdate && this._def.axes) {
      fullUpdate = this._def.axes.reduce(function(acc, a) {
        return acc || output.scales[a.scale];
      }, false);
    }
    if (!fullUpdate && this._def.legends) {
      fullUpdate = this._def.legends.reduce(function(acc, l) {
        return acc || output.scales[l.size || l.shape || l.fill || l.stroke];
      }, false);
    }
    if (fullUpdate) {
      output.mod = output.mod.concat(Tuple$o.idFilter(items,
          output.mod, output.add, output.rem));
    }
  }
  output.add.forEach(function(group) { buildGroup.call(builder, output, group); });
  output.rem.forEach(function(group) { model.group(group._id, null); });
  return output;
};
proto$4.pipeline = function() {
  return [this, this._scaler, this._recursor, this._collector, this._bounder];
};
proto$4.disconnect = function() {
  var builder = this;
  datalib.keys(builder._children).forEach(function(group_id) {
    builder._children[group_id].forEach(function(c) {
      builder._recursor.removeListener(c.builder);
      c.builder.disconnect();
    });
  });
  builder._children = {};
  return Builder_1.prototype.disconnect.call(this);
};
proto$4.child = function(name, group_id) {
  var children = this._children[group_id],
      i = 0, len = children.length,
      child;
  for (; i<len; ++i) {
    child = children[i];
    if (child.type == Types$2.MARK && child.builder._def.name == name) break;
  }
  return child.builder;
};
function recurse(input) {
  var builder = this,
      hasMarks = datalib.array(this._def.marks).length > 0,
      hasAxes = datalib.array(this._def.axes).length > 0,
      hasLegends = datalib.array(this._def.legends).length > 0,
      i, j, c, len, group, pipeline, def, inline = false;
  for (i=0, len=input.add.length; i<len; ++i) {
    group = input.add[i];
    if (hasMarks) buildMarks.call(this, input, group);
    if (hasAxes)  buildAxes.call(this, input, group);
    if (hasLegends) buildLegends.call(this, input, group);
  }
  for (i=input.add.length-1; i>=0; --i) {
    group = input.add[i];
    for (j=this._children[group._id].length-1; j>=0; --j) {
      c = this._children[group._id][j];
      c.builder.connect();
      pipeline = c.builder.pipeline();
      def = c.builder._def;
      inline = (def.type !== Types$2.GROUP);
      inline = inline && (this._graph.data(c.from) !== undefined);
      inline = inline && (pipeline[pipeline.length-1].listeners().length === 1);
      inline = inline && (def.from && !def.from.mark);
      c.inline = inline;
      if (inline) this._graph.evaluate(input, c.builder);
      else this._recursor.addListener(c.builder);
    }
  }
  function removeTemp(c) {
    if (c.type == Types$2.MARK && !c.inline &&
        builder._graph.data(c.from) !== undefined) {
      builder._recursor.removeListener(c.builder);
    }
  }
  function updateAxis(a) {
    var scale = a.scale();
    if (!input.scales[scale.scaleName]) return;
    a.reset().def();
  }
  function updateLegend(l) {
    var scale = l.size() || l.shape() || l.fill() || l.stroke() || l.opacity();
    if (!input.scales[scale.scaleName]) return;
    l.reset().def();
  }
  for (i=0, len=input.mod.length; i<len; ++i) {
    group = input.mod[i];
    if (hasMarks) builder._children[group._id].forEach(removeTemp);
    if (hasAxes) group.axes.forEach(updateAxis);
    if (hasLegends) group.legends.forEach(updateLegend);
  }
  function disconnectChildren(c) {
    builder._recursor.removeListener(c.builder);
    c.builder.disconnect();
  }
  for (i=0, len=input.rem.length; i<len; ++i) {
    group = input.rem[i];
    builder._children[group._id].forEach(disconnectChildren);
    delete builder._children[group._id];
  }
  return input;
}
function scale$2(name, x) {
  var group = this, s = null;
  if (arguments.length === 2) return (group._scales[name] = x, x);
  while (s == null) {
    s = group._scales[name];
    group = group.mark ? group.mark.group : group._parent;
    if (!group) break;
  }
  return s;
}
function buildGroup(input, group) {
  vegaLogging.debug(input, ["building group", group._id]);
  group._scales = group._scales || {};
  group.scale = scale$2.bind(group);
  group.items = group.items || [];
  this._children[group._id] = this._children[group._id] || [];
  group.axes = group.axes || [];
  group.axisItems = group.axisItems || [];
  group.legends = group.legends || [];
  group.legendItems = group.legendItems || [];
  this._graph.group(group._id, group);
}
function buildMarks(input, group) {
  vegaLogging.debug(input, ["building children marks #"+group._id]);
  var marks = this._def.marks,
      mark, from, inherit, i, len, b;
  for (i=0, len=marks.length; i<len; ++i) {
    mark = marks[i];
    from = mark.from || {};
    inherit = group.datum._facetID;
    group.items[i] = {group: group, _scaleRefs: {}};
    b = (mark.type === Types$2.GROUP) ? new GroupBuilder() : new Builder_1();
    b.init(this._graph, mark, group.items[i], this, group._id, inherit);
    this._children[group._id].push({
      builder: b,
      from: from.data || (from.mark ? ("vg_" + group._id + "_" + from.mark) : inherit),
      type: Types$2.MARK
    });
  }
}
function buildAxes(input, group) {
  var axes$$1 = group.axes,
      axisItems = group.axisItems,
      builder = this;
  axes(this._graph, this._def.axes, axes$$1, group);
  axes$$1.forEach(function(a, i) {
    var scale = builder._def.axes[i].scale,
        def = a.def(),
        b = null;
    axisItems[i] = {group: group, axis: a, layer: def.layer};
    b = (def.type === Types$2.GROUP) ? new GroupBuilder() : new Builder_1();
    b.init(builder._graph, def, axisItems[i], builder)
      .dependency(Deps$7.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: Types$2.AXIS, scale: scale });
  });
}
function buildLegends(input, group) {
  var legends$$1 = group.legends,
      legendItems = group.legendItems,
      builder = this;
  legends(this._graph, this._def.legends, legends$$1, group);
  legends$$1.forEach(function(l, i) {
    var scale = l.size() || l.shape() || l.fill() || l.stroke() || l.opacity(),
        def = l.def(),
        b = null;
    legendItems[i] = {group: group, legend: l};
    b = (def.type === Types$2.GROUP) ? new GroupBuilder() : new Builder_1();
    b.init(builder._graph, def, legendItems[i], builder)
      .dependency(Deps$7.SCALES, scale);
    builder._children[group._id].push({ builder: b, type: Types$2.LEGEND, scale: scale });
  });
}
var GroupBuilder_1 = GroupBuilder;

var visit = function visit(node, func) {
  var i, n, s, m, items;
  if (func(node)) return true;
  var sets = ['items', 'axisItems', 'legendItems'];
  for (s=0, m=sets.length; s<m; ++s) {
    if ((items = node[sets[s]])) {
      for (i=0, n=items.length; i<n; ++i) {
        if (visit(items[i], func)) return true;
      }
    }
  }
};

var config$1 = {};
config$1.load = {
  baseURL: '',
  domainWhiteList: false
};
config$1.autopadInset = 5;
config$1.scale = {
  time: d3.time.scale,
  utc:  d3.time.scale.utc
};
config$1.render = {
  retina: true
};
config$1.scene = {
  fill: undefined,
  fillOpacity: undefined,
  stroke: undefined,
  strokeOpacity: undefined,
  strokeWidth: undefined,
  strokeDash: undefined,
  strokeDashOffset: undefined
};
config$1.axis = {
  layer: 'back',
  ticks: 10,
  padding: 3,
  axisColor: '#000',
  axisWidth: 1,
  gridColor: '#000',
  gridOpacity: 0.15,
  tickColor: '#000',
  tickLabelColor: '#000',
  tickWidth: 1,
  tickSize: 6,
  tickLabelFontSize: 11,
  tickLabelFont: 'sans-serif',
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold',
  titleOffset: 'auto',
  titleOffsetAutoMin: 30,
  titleOffsetAutoMax: 10000,
  titleOffsetAutoMargin: 4
};
config$1.legend = {
  orient: 'right',
  offset: 20,
  padding: 3,
  margin: 2,
  gradientStrokeColor: '#888',
  gradientStrokeWidth: 1,
  gradientHeight: 16,
  gradientWidth: 100,
  labelColor: '#000',
  labelFontSize: 10,
  labelFont: 'sans-serif',
  labelAlign: 'left',
  labelBaseline: 'middle',
  labelOffset: 8,
  symbolShape: 'circle',
  symbolSize: 50,
  symbolColor: '#888',
  symbolStrokeWidth: 1,
  titleColor: '#000',
  titleFont: 'sans-serif',
  titleFontSize: 11,
  titleFontWeight: 'bold'
};
config$1.color = {
  rgb: [128, 128, 128],
  lab: [50, 0, 0],
  hcl: [0, 0, 50],
  hsl: [0, 0, 0.5]
};
config$1.range = {
  category10:  d3.scale.category10().range(),
  category20:  d3.scale.category20().range(),
  category20b: d3.scale.category20b().range(),
  category20c: d3.scale.category20c().range(),
  shapes: [
    'circle',
    'cross',
    'diamond',
    'square',
    'triangle-down',
    'triangle-up'
  ]
};
var config_1 = config$1;

var ChangeSet$5 = src.ChangeSet,
    Base$5 = src.Graph.prototype,
    Node$7  = src.Node;
function Model(cfg) {
  this._defs = {};
  this._predicates = {};
  this._scene  = null;
  this._groups = null;
  this._node = null;
  this._builder = null;
  this._reset = {axes: false, legends: false};
  this.config(cfg);
  this.expr = expr_1(this);
  Base$5.init.call(this);
}
var prototype$I = (Model.prototype = Object.create(Base$5));
prototype$I.constructor = Model;
prototype$I.defs = function(defs) {
  if (!arguments.length) return this._defs;
  this._defs = defs;
  return this;
};
prototype$I.config = function(cfg) {
  if (!arguments.length) return this._config;
  this._config = Object.create(config_1);
  for (var name in cfg) {
    var x = cfg[name], y = this._config[name];
    if (datalib.isObject(x) && datalib.isObject(y)) {
      this._config[name] = datalib.extend({}, y, x);
    } else {
      this._config[name] = x;
    }
  }
  return this;
};
prototype$I.width = function(width) {
  if (this._defs) this._defs.width = width;
  if (this._defs && this._defs.marks) this._defs.marks.width = width;
  if (this._scene) {
    this._scene.items[0].width = width;
    this._scene.items[0]._dirty = true;
  }
  this._reset.axes = true;
  return this;
};
prototype$I.height = function(height) {
  if (this._defs) this._defs.height = height;
  if (this._defs && this._defs.marks) this._defs.marks.height = height;
  if (this._scene) {
    this._scene.items[0].height = height;
    this._scene.items[0]._dirty = true;
  }
  this._reset.axes = true;
  return this;
};
prototype$I.node = function() {
  return this._node || (this._node = new Node$7(this));
};
prototype$I.data = function() {
  var data = Base$5.data.apply(this, arguments);
  if (arguments.length > 1) {
    this.node().addListener(data.pipeline()[0]);
  }
  return data;
};
function predicates$1(name) {
  var m = this, pred = {};
  if (!datalib.isArray(name)) return this._predicates[name];
  name.forEach(function(n) { pred[n] = m._predicates[n]; });
  return pred;
}
prototype$I.predicate = function(name, predicate) {
  if (arguments.length === 1) return predicates$1.call(this, name);
  return (this._predicates[name] = predicate);
};
prototype$I.predicates = function() { return this._predicates; };
prototype$I.scene = function(renderer) {
  if (!arguments.length) return this._scene;
  if (this._builder) {
    this.node().removeListener(this._builder);
    this._builder._groupBuilder.disconnect();
  }
  var m = this,
      b = this._builder = new Node$7(this);
  b.evaluate = function(input) {
    if (b._groupBuilder) return input;
    var gb = b._groupBuilder = new GroupBuilder_1(m, m._defs.marks, m._scene={}),
        p  = gb.pipeline();
    m._groups = {};
    this.addListener(gb.connect());
    p[p.length-1].addListener(renderer);
    return input;
  };
  this.addListener(b);
  return this;
};
prototype$I.group = function(id, item) {
  var groups = this._groups;
  if (arguments.length === 1) return groups[id];
  return (groups[id] = item, this);
};
prototype$I.reset = function() {
  if (this._scene && this._reset.axes) {
    visit(this._scene, function(item) {
      if (item.axes) item.axes.forEach(function(axis) { axis.reset(); });
    });
    this._reset.axes = false;
  }
  if (this._scene && this._reset.legends) {
    visit(this._scene, function(item) {
      if (item.legends) item.legends.forEach(function(l) { l.reset(); });
    });
    this._reset.legends = false;
  }
  return this;
};
prototype$I.addListener = function(l) {
  this.node().addListener(l);
};
prototype$I.removeListener = function(l) {
  this.node().removeListener(l);
};
prototype$I.fire = function(cs) {
  if (!cs) cs = ChangeSet$5.create();
  this.propagate(cs, this.node());
};
var Model_1 = Model;

var GATEKEEPER = '_vgGATEKEEPER',
    EVALUATOR  = '_vgEVALUATOR';
var vgEvent = {
  getItem: function() { return this.item; },
  getGroup: function(name) {
    var group = name ? this.name[name] : this.group,
        mark = group && group.mark,
        interactive = mark && (mark.interactive || mark.interactive === undefined);
    return interactive ? group : {};
  },
  getXY: function(item) {
      var p = {x: this.x, y: this.y};
      if (typeof item === 'string') {
        item = this.name[item];
      }
      for (; item; item = item.mark && item.mark.group) {
        p.x -= item.x || 0;
        p.y -= item.y || 0;
      }
      return p;
    },
  getX: function(item) { return this.getXY(item).x; },
  getY: function(item) { return this.getXY(item).y; }
};
function parseStreams(view) {
  var model = view.model(),
      trueFn  = model.expr('true'),
      falseFn = model.expr('false'),
      spec    = model.defs().signals,
      registry = {handlers: {}, nodes: {}},
      internal = datalib.duplicate(registry),
      external = datalib.duplicate(registry);
  datalib.array(spec).forEach(function(sig) {
    var signal = model.signal(sig.name);
    if (sig.expr) return;
    datalib.array(sig.streams).forEach(function(stream) {
      var sel = vegaEventSelector.parse(stream.type),
          exp = model.expr(stream.expr);
      mergedStream(signal, sel, exp, stream);
    });
  });
  datalib.keys(internal.handlers).forEach(function(type) {
    view.on(type, function(evt, item) {
      evt.preventDefault();
      extendEvent(evt, item);
      fire(internal, type, (item && item.datum) || {}, (item && item.mark && item.mark.group && item.mark.group.datum) || {}, evt);
    });
  });
  datalib.keys(external.handlers).forEach(function(type) {
    if (typeof window === 'undefined') return;
    var h = external.handlers[type],
        t = type.split(':'),
        elt = (t[0] === 'window') ? [window] :
              window.document.querySelectorAll(t[0]);
    function handler(evt) {
      extendEvent(evt);
      fire(external, type, d3.select(this).datum(), this.parentNode && d3.select(this.parentNode).datum(), evt);
    }
    for (var i=0; i<elt.length; ++i) {
      elt[i].addEventListener(t[1], handler);
    }
    h.elements = elt;
    h.listener = handler;
  });
  external.detach = function() {
    datalib.keys(external.handlers).forEach(function(type) {
      var h = external.handlers[type],
          t = type.split(':'),
          elt = datalib.array(h.elements);
      for (var i=0; i<elt.length; ++i) {
        elt[i].removeEventListener(t[1], h.listener);
      }
    });
  };
  return external.detach;
  function extendEvent(evt, item) {
    var mouse = d3.mouse((d3.event=evt, view.renderer().scene())),
        pad = view.padding(),
        names = {}, mark, group, i;
    if (item) {
      mark = item.mark;
      group = mark.marktype === 'group' ? item : mark.group;
      for (i=item; i!=null; i=i.mark.group) {
        if (i.mark.def.name) {
          names[i.mark.def.name] = i;
        }
      }
    }
    names.root = view.model().scene().items[0];
    evt.vg = Object.create(vgEvent);
    evt.vg.group = group;
    evt.vg.item = item || {};
    evt.vg.name = names;
    evt.vg.x = mouse[0] - pad.left;
    evt.vg.y = mouse[1] - pad.top;
  }
  function fire(registry, type, datum, parent, evt) {
    var handlers = registry.handlers[type],
        node = registry.nodes[type],
        cs = src.ChangeSet.create(null, true),
        filtered = false,
        val, i, n, h;
    function invoke(f) {
      return !f.fn(datum, parent, evt);
    }
    for (i=0, n=handlers.length; i<n; ++i) {
      h = handlers[i];
      filtered = h.filters.some(invoke);
      if (filtered) continue;
      val = h.exp.fn(datum, parent, evt);
      if (h.spec.scale) {
        val = signals.scale(model, h.spec, val, datum, evt);
      }
      if (val !== h.signal.value() || h.signal.verbose()) {
        h.signal.value(val);
        cs.signals[h.signal.name()] = 1;
      }
    }
    model.propagate(cs, node);
  }
  function mergedStream(sig, selector, exp, spec) {
    selector.forEach(function(s) {
      if (s.event)       domEvent(sig, s, exp, spec);
      else if (s.signal) signal(sig, s, exp, spec);
      else if (s.start)  orderedStream(sig, s, exp, spec);
      else if (s.stream) {
        if (s.filters) s.stream.forEach(function(ms) {
          ms.filters = datalib.array(ms.filters).concat(s.filters);
        });
        mergedStream(sig, s.stream, exp, spec);
      }
    });
  }
  function domEvent(sig, selector, exp, spec) {
    var evt = selector.event,
        name = selector.name,
        mark = selector.mark,
        target   = selector.target,
        filters  = datalib.array(selector.filters),
        registry = target ? external : internal,
        type = target ? target+':'+evt : evt,
        node = registry.nodes[type] || (registry.nodes[type] = new src.Node(model)),
        handlers = registry.handlers[type] || (registry.handlers[type] = []);
    if (name) {
      filters.push('!!event.vg.name["' + name + '"]');
    } else if (mark) {
      filters.push('event.vg.item.mark && event.vg.item.mark.marktype==='+datalib.str(mark));
    }
    handlers.push({
      signal: sig,
      exp: exp,
      spec: spec,
      filters: filters.map(function(f) { return model.expr(f); })
    });
    node.addListener(sig);
  }
  function signal(sig, selector, exp, spec) {
    var n = sig.name(), s = model.signal(n+EVALUATOR, null);
    s.evaluate = function(input) {
      if (!input.signals[selector.signal]) return model.doNotPropagate;
      var val = exp.fn();
      if (spec.scale) {
        val = signals.scale(model, spec, val);
      }
      if (val !== sig.value() || sig.verbose()) {
        sig.value(val);
        input.signals[n] = 1;
        input.reflow = true;
      }
      return input;
    };
    s.dependency(src.Dependencies.SIGNALS, selector.signal);
    s.addListener(sig);
    model.signal(selector.signal).addListener(s);
  }
  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(),
        gk = name + GATEKEEPER,
        middle  = selector.middle,
        filters = middle.filters || (middle.filters = []),
        gatekeeper = model.signal(gk) || model.signal(gk, false);
    mergedStream(gatekeeper, [selector.start], trueFn, {});
    mergedStream(gatekeeper, [selector.end], falseFn, {});
    filters.push(gatekeeper.name());
    mergedStream(sig, [selector.middle], exp, spec);
  }
}
var streams = parseStreams;
parseStreams.schema = {
  "defs": {
    "streams": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string"},
          "expr": {"type": "string"},
          "scale": {"$ref": "#/refs/scopedScale"}
        },
        "additionalProperties": false,
        "required": ["type", "expr"]
      }
    }
  }
};

var bound$3 = src$1.bound,
    Tuple$p = src.Tuple,
    Status$1 = Builder_1.STATUS;
function Transition(duration, ease) {
  this.duration = duration || 500;
  this.ease = ease && d3.ease(ease) || d3.ease('cubic-in-out');
  this.updates = {next: null};
}
var prototype$J = Transition.prototype;
var skip = {
  'text': 1,
  'url':  1
};
prototype$J.interpolate = function(item, values) {
  var key, curr, next, interp, list = null;
  for (key in values) {
    curr = item[key];
    next = values[key];
    if (curr !== next) {
      if (skip[key] || curr === undefined) {
        Tuple$p.set(item, key, next);
      } else if (typeof curr === 'number' && !isFinite(curr)) {
        Tuple$p.set(item, key, next);
      } else {
        interp = d3.interpolate(curr, next);
        interp.property = key;
        (list || (list=[])).push(interp);
      }
    }
  }
  if (list === null && item.status === Status$1.EXIT) {
    list = [];
  }
  if (list != null) {
    list.item = item;
    list.ease = item.mark.ease || this.ease;
    list.next = this.updates.next;
    this.updates.next = list;
  }
  return this;
};
prototype$J.start = function(callback) {
  var t = this, prev = t.updates, curr = prev.next;
  for (; curr!=null; prev=curr, curr=prev.next) {
    if (curr.item.status === Status$1.EXIT) {
      curr.item.status = Status$1.UPDATE;
      curr.remove = true;
    }
  }
  t.callback = callback;
  d3.timer(function(elapsed) { return step.call(t, elapsed); });
};
function step(elapsed) {
  var list = this.updates, prev = list, curr = prev.next,
      duration = this.duration,
      item, delay, f, e, i, n, stop = true;
  for (; curr!=null; prev=curr, curr=prev.next) {
    item = curr.item;
    delay = item.delay || 0;
    f = (elapsed - delay) / duration;
    if (f < 0) { stop = false; continue; }
    if (f > 1) f = 1;
    e = curr.ease(f);
    for (i=0, n=curr.length; i<n; ++i) {
      item[curr[i].property] = curr[i](e);
    }
    item.touch();
    bound$3.item(item);
    if (f === 1) {
      if (curr.remove) {
        item.status = Status$1.EXIT;
        item.remove();
      }
      prev.next = curr.next;
      curr = prev;
    } else {
      stop = false;
    }
  }
  this.callback();
  return stop;
}
var Transition_1 = Transition;

var sg = src$1.render,
    canvas$3 = sg.canvas,
    svg$2 = sg.svg.string;
function HeadlessView(width, height, model) {
  View_1.call(this, width, height, model);
  this._type = 'canvas';
  this._renderers = {canvas: canvas$3, svg: svg$2};
}
var prototype$K = (HeadlessView.prototype = new View());
prototype$K.renderer = function(type) {
  if(type) this._type = type;
  return View_1.prototype.renderer.apply(this, arguments);
};
prototype$K.canvas = function() {
  return (this._type === 'canvas') ? this._renderer.canvas() : null;
};
prototype$K.canvasAsync = function(callback) {
  var r = this._renderer, view = this;
  function wait() {
    if (r.pendingImages() === 0) {
      view.render();
      callback(view.canvas());
    } else {
      setTimeout(wait, 10);
    }
  }
  if (this._type !== 'canvas') return null;
  if (r.pendingImages() > 0) { wait(); } else { callback(this.canvas()); }
};
prototype$K.svg = function() {
  return (this._type === 'svg') ? this._renderer.svg() : null;
};
prototype$K.initialize = function() {
  var w = this._width,
      h = this._height,
      bg  = this._bgcolor,
      pad = this._padding,
      config = this.model().config();
  if (this._viewport) {
    w = this._viewport[0] - (pad ? pad.left + pad.right : 0);
    h = this._viewport[1] - (pad ? pad.top + pad.bottom : 0);
  }
  this._renderer = (this._renderer || new this._io.Renderer(config.load))
    .initialize(null, w, h, pad)
    .background(bg);
  return (this._repaint = true, this);
};
var HeadlessView_1 = HeadlessView;

var sg$1 = src$1.render,
    bound$4 = src$1.bound,
    Deps$8 = src.Dependencies;
function View(el, width, height) {
  this._el    = null;
  this._model = null;
  this._width   = this.__width = width || 500;
  this._height  = this.__height = height || 300;
  this._bgcolor = null;
  this._cursor  = true;
  this._autopad = 1;
  this._padding = {top:0, left:0, bottom:0, right:0};
  this._viewport = null;
  this._renderer = null;
  this._handler  = null;
  this._streamer = null;
  this._skipSignals = false;
  this._changeset = null;
  this._repaint = true;
  this._renderers = sg$1;
  this._io  = null;
  this._api = {};
}
var prototype$L = View.prototype;
prototype$L.model = function(model) {
  if (!arguments.length) return this._model;
  if (this._model !== model) {
    this._model = model;
    this._streamer = new src.Node(model);
    this._streamer._rank = -1;
    this._changeset = src.ChangeSet.create();
    if (this._handler) this._handler.model(model);
  }
  return this;
};
function streaming(src$$1) {
  var view = this,
      ds = this._model.data(src$$1);
  if (!ds) return vegaLogging.error('Data source "'+src$$1+'" is not defined.');
  var listener = ds.pipeline()[0],
      streamer = this._streamer,
      api = {};
  if (this._api[src$$1]) return this._api[src$$1];
  api.insert = function(vals) {
    ds.insert(datalib.duplicate(vals));
    streamer.addListener(listener);
    view._changeset.data[src$$1] = 1;
    return api;
  };
  api.update = function() {
    streamer.addListener(listener);
    view._changeset.data[src$$1] = 1;
    return (ds.update.apply(ds, arguments), api);
  };
  api.remove = function() {
    streamer.addListener(listener);
    view._changeset.data[src$$1] = 1;
    return (ds.remove.apply(ds, arguments), api);
  };
  api.values = function() { return ds.values(); };
  return (this._api[src$$1] = api);
}
prototype$L.data = function(data) {
  var v = this;
  if (!arguments.length) return v._model.values();
  else if (datalib.isString(data)) return streaming.call(v, data);
  else if (datalib.isObject(data)) {
    datalib.keys(data).forEach(function(k) {
      var api = streaming.call(v, k);
      data[k](api);
    });
  }
  return this;
};
var VIEW_SIGNALS = datalib.toMap(['width', 'height', 'padding']);
prototype$L.signal = function(name, value, skip) {
  var m = this._model,
      key, values;
  if (!arguments.length) {
    return m.values(Deps$8.SIGNALS);
  } else if (arguments.length === 1 && datalib.isString(name)) {
    return m.values(Deps$8.SIGNALS, name);
  }
  if (datalib.isObject(name)) {
    values = name;
    skip = value;
  } else {
    values = {};
    values[name] = value;
  }
  for (key in values) {
    if (VIEW_SIGNALS[key]) {
      this[key](values[key]);
    } else {
      setSignal.call(this, key, values[key]);
    }
  }
  return (this._skipSignals = skip, this);
};
function setSignal(name, value) {
  var cs = this._changeset,
      sg = this._model.signal(name);
  if (!sg) return vegaLogging.error('Signal "'+name+'" is not defined.');
  this._streamer.addListener(sg.value(value));
  cs.signals[name] = 1;
  cs.reflow = true;
}
prototype$L.width = function(width) {
  if (!arguments.length) return this.__width;
  if (this.__width !== width) {
    this._width = this.__width = width;
    this.model().width(width);
    this.initialize();
    if (this._strict) this._autopad = 1;
    setSignal.call(this, 'width', width);
  }
  return this;
};
prototype$L.height = function(height) {
  if (!arguments.length) return this.__height;
  if (this.__height !== height) {
    this._height = this.__height = height;
    this.model().height(height);
    this.initialize();
    if (this._strict) this._autopad = 1;
    setSignal.call(this, 'height', height);
  }
  return this;
};
prototype$L.background = function(bgcolor) {
  if (!arguments.length) return this._bgcolor;
  if (this._bgcolor !== bgcolor) {
    this._bgcolor = bgcolor;
    this.initialize();
  }
  return this;
};
prototype$L.padding = function(pad) {
  if (!arguments.length) return this._padding;
  if (this._padding !== pad) {
    if (datalib.isString(pad)) {
      this._autopad = 1;
      this._padding = {top:0, left:0, bottom:0, right:0};
      this._strict = (pad === 'strict');
    } else {
      this._autopad = 0;
      this._padding = pad;
      this._strict = false;
    }
    if (this._renderer) this._renderer.resize(this._width, this._height, this._padding);
    if (this._handler)  this._handler.padding(this._padding);
    setSignal.call(this, 'padding', this._padding);
  }
  return (this._repaint = true, this);
};
function viewBounds() {
  var s = this.model().scene(),
      legends = s.items[0].legendItems,
      i = 0, len = legends.length,
      b, lb;
  if (this._strict) {
    b = bound$4.mark(s, null, false);
    for (; i<len; ++i) {
      lb = legends[i].bounds;
      b.add(lb.x1, 0).add(lb.x2, 0);
    }
    return b;
  }
  return s.bounds;
}
prototype$L.autopad = function(opt) {
  if (this._autopad < 1) return this;
  else this._autopad = 0;
  var b = viewBounds.call(this),
      pad = this._padding,
      config = this.model().config(),
      inset = config.autopadInset,
      l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
      t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
      r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0;
  b = b.y2 > this._height ? Math.ceil(+b.y2 - this._height) + inset : 0;
  pad = {left:l, top:t, right:r, bottom:b};
  if (this._strict) {
    this._autopad = 0;
    this._padding = pad;
    this._width = Math.max(0, this.__width - (l+r));
    this._height = Math.max(0, this.__height - (t+b));
    this._model.width(this._width).height(this._height).reset();
    setSignal.call(this, 'width', this._width);
    setSignal.call(this, 'height', this._height);
    setSignal.call(this, 'padding', pad);
    this.initialize().update({props:'enter'}).update({props:'update'});
  } else {
    this.padding(pad).update(opt);
  }
  return this;
};
prototype$L.viewport = function(size) {
  if (!arguments.length) return this._viewport;
  if (this._viewport !== size) {
    this._viewport = size;
    this.initialize();
  }
  return this;
};
prototype$L.renderer = function(type) {
  if (!arguments.length) return this._renderer;
  if (this._renderers[type]) type = this._renderers[type];
  else if (datalib.isString(type)) throw new Error('Unknown renderer: ' + type);
  else if (!type) throw new Error('No renderer specified');
  if (this._io !== type) {
    this._io = type;
    this._renderer = null;
    this.initialize();
    if (this._build) this.render();
  }
  return this;
};
prototype$L.initialize = function(el) {
  var v = this, prevHandler,
      w = v._width, h = v._height, pad = v._padding, bg = v._bgcolor,
      config = this.model().config();
  if (!arguments.length || el === null) {
    el = this._el ? this._el.parentNode : null;
    if (!el) return this;
  }
  d3.select(el).select('div.vega').remove();
  this._el = el = d3.select(el)
    .append('div')
    .attr('class', 'vega')
    .style('position', 'relative')
    .node();
  if (v._viewport) {
    d3.select(el)
      .style('width',  (v._viewport[0] || w)+'px')
      .style('height', (v._viewport[1] || h)+'px')
      .style('overflow', 'auto');
  }
  sg$1.canvas.Renderer.RETINA = config.render.retina;
  v._renderer = (v._renderer || new this._io.Renderer(config.load))
    .initialize(el, w, h, pad)
    .background(bg);
  prevHandler = v._handler;
  v._handler = new this._io.Handler()
    .initialize(el, pad, v);
  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      v._handler.on(h.type, h.handler);
    });
  } else {
    v._detach = streams(this);
  }
  return (this._repaint = true, this);
};
prototype$L.destroy = function() {
  if (this._detach) this._detach();
};
function build() {
  var v = this;
  v._renderNode = new src.Node(v._model)
    .router(true);
  v._renderNode.evaluate = function(input) {
    vegaLogging.debug(input, ['rendering']);
    var s = v._model.scene(),
        h = v._handler;
    if (h && h.scene) h.scene(s);
    if (input.trans) {
      input.trans.start(function(items) { v._renderer.render(s, items); });
    } else if (v._repaint) {
      v._renderer.render(s);
    } else if (input.dirty.length) {
      v._renderer.render(s, input.dirty);
    }
    if (input.dirty.length) {
      input.dirty.forEach(function(i) { i._dirty = false; });
      s.items[0]._dirty = false;
    }
    v._repaint = v._skipSignals = false;
    return input;
  };
  return (v._model.scene(v._renderNode), true);
}
prototype$L.update = function(opt) {
  opt = opt || {};
  var v = this,
      model = this._model,
      streamer = this._streamer,
      cs = this._changeset,
      trans = opt.duration ? new Transition_1(opt.duration, opt.ease) : null;
  if (trans) cs.trans = trans;
  if (opt.props !== undefined) {
    if (datalib.keys(cs.data).length > 0) {
      throw Error(
        'New data values are not reflected in the visualization.' +
        ' Please call view.update() before updating a specified property set.'
      );
    }
    cs.reflow  = true;
    cs.request = opt.props;
  }
  var built = v._build;
  v._build = v._build || build.call(this);
  if (opt.items && built) {
    Encoder_1.update(model, opt.trans, opt.props, opt.items, cs.dirty);
    v._renderNode.evaluate(cs);
  } else if (streamer.listeners().length && built) {
    if (this._repaint) streamer.addListener(model.node());
    model.propagate(cs, streamer, null, this._skipSignals);
    streamer.disconnect();
  } else {
    model.fire(cs);
  }
  v._changeset = src.ChangeSet.create();
  return v.autopad(opt);
};
prototype$L.toImageURL = function(type) {
  var v = this, Renderer;
  switch (type || 'png') {
    case 'canvas':
    case 'png':
      Renderer = sg$1.canvas.Renderer; break;
    case 'svg':
      Renderer = sg$1.svg.string.Renderer; break;
    default: throw Error('Unrecognized renderer type: ' + type);
  }
  var retina = sg$1.canvas.Renderer.RETINA;
  sg$1.canvas.Renderer.RETINA = false;
  var ren = new Renderer(v._model.config.load)
    .initialize(null, v._width, v._height, v._padding)
    .background(v._bgcolor)
    .render(v._model.scene());
  sg$1.canvas.Renderer.RETINA = retina;
  if (type === 'svg') {
    var blob = new Blob([ren.svg()], {type: 'image/svg+xml'});
    return window.URL.createObjectURL(blob);
  } else {
    return ren.canvas().toDataURL('image/png');
  }
};
prototype$L.render = function(items) {
  this._renderer.render(this._model.scene(), items);
  return this;
};
prototype$L.on = function() {
  this._handler.on.apply(this._handler, arguments);
  return this;
};
prototype$L.onSignal = function(name, handler) {
  var sg = this._model.signal(name);
  return (sg ?
    sg.on(handler) : vegaLogging.error('Signal "'+name+'" is not defined.'), this);
};
prototype$L.off = function() {
  this._handler.off.apply(this._handler, arguments);
  return this;
};
prototype$L.offSignal = function(name, handler) {
  var sg = this._model.signal(name);
  return (sg ?
    sg.off(handler) : vegaLogging.error('Signal "'+name+'" is not defined.'), this);
};
View.factory = function(model) {
  var HeadlessView = HeadlessView_1;
  return function(opt) {
    opt = opt || {};
    var defs = model.defs();
    var v = (opt.el ? new View() : new HeadlessView())
      .model(model)
      .renderer(opt.renderer || 'canvas')
      .width(defs.width)
      .height(defs.height)
      .background(defs.background)
      .padding(defs.padding)
      .viewport(defs.viewport)
      .initialize(opt.el);
    if (opt.data) v.data(opt.data);
    if (opt.el) {
      if (opt.hover !== false) {
        v.on('mouseover', function(evt, item) {
          if (item && item.hasPropertySet('hover')) {
            this.update({props:'hover', items:item});
          }
        })
        .on('mouseout', function(evt, item) {
          if (item && item.hasPropertySet('hover')) {
            this.update({props:'update', items:item});
          }
        });
      }
      if (opt.cursor !== false) {
        v.onSignal('cursor', function(name, value) {
          var body = d3.select('body');
          if (datalib.isString(value)) {
            v._cursor = value === 'default';
            body.style('cursor', value);
          } else if (datalib.isObject(value) && v._cursor) {
            body.style('cursor', value.default);
          }
        });
      }
    }
    return v;
  };
};
var View_1 = View;

function parseSpec(spec                                         ) {
  var arglen = arguments.length,
      argidx = 2,
      cb = arguments[arglen-1],
      model = new Model_1(),
      viewFactory = View_1.factory,
      config;
  if (arglen > argidx && datalib.isFunction(arguments[arglen - argidx])) {
    viewFactory = arguments[arglen - argidx];
    ++argidx;
  }
  if (arglen > argidx && datalib.isObject(arguments[arglen - argidx])) {
    model.config(arguments[arglen - argidx]);
  }
  config = model.config();
  if (datalib.isObject(spec)) {
    parse(spec);
  } else if (datalib.isString(spec)) {
    var opts = datalib.extend({url: spec}, config.load);
    datalib.json(opts, function(err, spec) {
      if (err) done('SPECIFICATION LOAD FAILED: ' + err);
      else parse(spec);
    });
  } else {
    done('INVALID SPECIFICATION: Must be a valid JSON object or URL.');
  }
  function parse(spec) {
    try {
      spec = datalib.duplicate(spec);
      var parsers = parse$2,
          width   = themeVal(spec, config, 'width', 500),
          height  = themeVal(spec, config, 'height', 500),
          padding = parsers.padding(themeVal(spec, config, 'padding')),
          background = themeVal(spec, config, 'background');
      model.signal('width', width);
      model.signal('height', height);
      model.signal('padding', padding);
      cursor(spec);
      model.defs({
        width:      width,
        height:     height,
        padding:    padding,
        viewport:   spec.viewport || null,
        background: parsers.background(background),
        signals:    parsers.signals(model, spec.signals),
        predicates: parsers.predicates(model, spec.predicates),
        marks:      parsers.marks(model, spec, width, height),
        data:       parsers.data(model, spec.data, done)
      });
    } catch (err) { done(err); }
  }
  function cursor(spec) {
    var signals = spec.signals || (spec.signals=[]),  def;
    signals.some(function(sg) {
      return (sg.name === 'cursor') ? (def=sg, true) : false;
    });
    if (!def) signals.push(def={name: 'cursor', streams: []});
    def.init = def.init || {};
    def.streams.unshift({
      type: 'mousemove',
      expr: 'eventItem().cursor === cursor.default ? cursor : {default: eventItem().cursor}'
    });
  }
  function done(err) {
    var view;
    if (err) {
      vegaLogging.error(err);
    } else {
      view = viewFactory(model.buildIndexes());
    }
    if (cb) {
      if (cb.length > 1) cb(err, view);
      else if (!err) cb(view);
      cb = null;
    }
  }
}
var spec = parseSpec;
parseSpec.schema = {
  "defs": {
    "spec": {
      "title": "Vega visualization specification",
      "type": "object",
      "allOf": [{"$ref": "#/defs/container"}, {
        "properties": {
          "width": {"type": "number"},
          "height": {"type": "number"},
          "viewport": {
            "type": "array",
            "items": {"type": "number"},
            "maxItems": 2
          },
          "background": {"$ref": "#/defs/background"},
          "padding": {"$ref": "#/defs/padding"},
          "signals": {
            "type": "array",
            "items": {"$ref": "#/defs/signal"}
          },
          "predicates": {
            "type": "array",
            "items": {"$ref": "#/defs/predicate"}
          },
          "data": {
            "type": "array",
            "items": {"$ref": "#/defs/data"}
          }
        }
      }]
    }
  }
};

var parse$2 = {
  axes:       axes,
  background: background,
  data:       data,
  events:     vegaEventSelector,
  expr:       expr_1,
  legends:    legends,
  mark:       mark,
  marks:      marks$2,
  modify:     modify,
  padding:    padding,
  predicates: predicates,
  properties: properties_1,
  signals:    signals,
  spec:       spec,
  streams:    streams,
  transforms: transforms_1$1
};

function compile$1(module, opt, schema) {
  var s = module.schema;
  if (!s) return;
  if (s.refs) datalib.extend(schema.refs, s.refs);
  if (s.defs) datalib.extend(schema.defs, s.defs);
}
var schema = function(opt) {
  var schema = null;
  opt = opt || {};
  if (opt.url) {
    schema = datalib.json(datalib.extend({url: opt.url}, config_1.load));
  } else {
    schema = {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "title": "Vega Visualization Specification Language",
      "defs": {},
      "refs": {},
      "$ref": "#/defs/spec"
    };
    datalib.keys(parse$2).forEach(function(k) { compile$1(parse$2[k], opt, schema); });
    compile$1(Scale_1, opt, schema);
  }
  if (opt.properties) datalib.keys(opt.properties).forEach(function(k) {
    schema.defs.propset.properties[k] = {"$ref": "#/refs/"+opt.properties[k]+"Value"};
  });
  if (opt.propertySets) datalib.keys(opt.propertySets).forEach(function(k) {
    schema.defs.mark.properties.properties.properties[k] = {"$ref": "#/defs/propset"};
  });
  return schema;
};

var vega = {
  version: '__VERSION__',
  dataflow: src,
  parse: parse$2,
  scene: {
    Bounder: Bounder_1,
    Builder: Builder_1,
    Encoder: Encoder_1,
    GroupBuilder: GroupBuilder_1,
    visit: visit
  },
  transforms: transforms,
  Transform: Transform_1,
  BatchTransform: BatchTransform_1,
  Parameter: Parameter_1,
  schema: schema,
  config: config_1,
  util: util$1,
  logging: vegaLogging,
  debug: vegaLogging.debug
};

var axis$1 = createCommonjsModule(function (module, exports) {
(function (AxisOrient) {
    AxisOrient[AxisOrient["TOP"] = 'top'] = "TOP";
    AxisOrient[AxisOrient["RIGHT"] = 'right'] = "RIGHT";
    AxisOrient[AxisOrient["LEFT"] = 'left'] = "LEFT";
    AxisOrient[AxisOrient["BOTTOM"] = 'bottom'] = "BOTTOM";
})(exports.AxisOrient || (exports.AxisOrient = {}));
var AxisOrient = exports.AxisOrient;
exports.defaultAxisConfig = {
    offset: undefined,
    grid: undefined,
    labels: true,
    labelMaxLength: 25,
    tickSize: undefined,
    characterWidth: 6
};
exports.defaultFacetAxisConfig = {
    axisWidth: 0,
    labels: true,
    grid: false,
    tickSize: 0
};
});
var axis_1 = axis$1.AxisOrient;
var axis_2 = axis$1.defaultAxisConfig;
var axis_3 = axis$1.defaultFacetAxisConfig;

var aggregate = createCommonjsModule(function (module, exports) {
(function (AggregateOp) {
    AggregateOp[AggregateOp["VALUES"] = 'values'] = "VALUES";
    AggregateOp[AggregateOp["COUNT"] = 'count'] = "COUNT";
    AggregateOp[AggregateOp["VALID"] = 'valid'] = "VALID";
    AggregateOp[AggregateOp["MISSING"] = 'missing'] = "MISSING";
    AggregateOp[AggregateOp["DISTINCT"] = 'distinct'] = "DISTINCT";
    AggregateOp[AggregateOp["SUM"] = 'sum'] = "SUM";
    AggregateOp[AggregateOp["MEAN"] = 'mean'] = "MEAN";
    AggregateOp[AggregateOp["AVERAGE"] = 'average'] = "AVERAGE";
    AggregateOp[AggregateOp["VARIANCE"] = 'variance'] = "VARIANCE";
    AggregateOp[AggregateOp["VARIANCEP"] = 'variancep'] = "VARIANCEP";
    AggregateOp[AggregateOp["STDEV"] = 'stdev'] = "STDEV";
    AggregateOp[AggregateOp["STDEVP"] = 'stdevp'] = "STDEVP";
    AggregateOp[AggregateOp["MEDIAN"] = 'median'] = "MEDIAN";
    AggregateOp[AggregateOp["Q1"] = 'q1'] = "Q1";
    AggregateOp[AggregateOp["Q3"] = 'q3'] = "Q3";
    AggregateOp[AggregateOp["MODESKEW"] = 'modeskew'] = "MODESKEW";
    AggregateOp[AggregateOp["MIN"] = 'min'] = "MIN";
    AggregateOp[AggregateOp["MAX"] = 'max'] = "MAX";
    AggregateOp[AggregateOp["ARGMIN"] = 'argmin'] = "ARGMIN";
    AggregateOp[AggregateOp["ARGMAX"] = 'argmax'] = "ARGMAX";
})(exports.AggregateOp || (exports.AggregateOp = {}));
var AggregateOp = exports.AggregateOp;
exports.AGGREGATE_OPS = [
    AggregateOp.VALUES,
    AggregateOp.COUNT,
    AggregateOp.VALID,
    AggregateOp.MISSING,
    AggregateOp.DISTINCT,
    AggregateOp.SUM,
    AggregateOp.MEAN,
    AggregateOp.AVERAGE,
    AggregateOp.VARIANCE,
    AggregateOp.VARIANCEP,
    AggregateOp.STDEV,
    AggregateOp.STDEVP,
    AggregateOp.MEDIAN,
    AggregateOp.Q1,
    AggregateOp.Q3,
    AggregateOp.MODESKEW,
    AggregateOp.MIN,
    AggregateOp.MAX,
    AggregateOp.ARGMIN,
    AggregateOp.ARGMAX,
];
exports.SUM_OPS = [
    AggregateOp.COUNT,
    AggregateOp.SUM,
    AggregateOp.DISTINCT,
    AggregateOp.VALID,
    AggregateOp.MISSING
];
exports.SHARED_DOMAIN_OPS = [
    AggregateOp.MEAN,
    AggregateOp.AVERAGE,
    AggregateOp.STDEV,
    AggregateOp.STDEVP,
    AggregateOp.MEDIAN,
    AggregateOp.Q1,
    AggregateOp.Q3,
    AggregateOp.MIN,
    AggregateOp.MAX,
];
});
var aggregate_1 = aggregate.AggregateOp;
var aggregate_2 = aggregate.AGGREGATE_OPS;
var aggregate_3 = aggregate.SUM_OPS;
var aggregate_4 = aggregate.SHARED_DOMAIN_OPS;

var keys$3 = util.keys;
var extend = util.extend;
var duplicate = util.duplicate;
var isArray = util.isArray;
var vals = util.vals;
var truncate = util.truncate;
var toMap$1 = util.toMap;
var isObject = util.isObject;
var isString = util.isString;
var isNumber = util.isNumber;
var isBoolean = util.isBoolean;
var util_2$1 = util;
var util_3$1 = util;
function pick$4(obj, props) {
    var copy = {};
    props.forEach(function (prop) {
        if (obj.hasOwnProperty(prop)) {
            copy[prop] = obj[prop];
        }
    });
    return copy;
}
var pick_1 = pick$4;
function range$1(start, stop, step) {
    if (arguments.length < 3) {
        step = 1;
        if (arguments.length < 2) {
            stop = start;
            start = 0;
        }
    }
    if ((stop - start) / step === Infinity) {
        throw new Error('Infinite range');
    }
    var range = [], i = -1, j;
    if (step < 0) {
        while ((j = start + step * ++i) > stop) {
            range.push(j);
        }
    }
    else {
        while ((j = start + step * ++i) < stop) {
            range.push(j);
        }
    }
    return range;
}
var range_1 = range$1;
function omit(obj, props) {
    var copy = util_2$1.duplicate(obj);
    props.forEach(function (prop) {
        delete copy[prop];
    });
    return copy;
}
var omit_1 = omit;
function hash(a) {
    if (util_3$1.isString(a) || util_3$1.isNumber(a) || util_3$1.isBoolean(a)) {
        return String(a);
    }
    return jsonStableStringify(a);
}
var hash_1 = hash;
function contains(array, item) {
    return array.indexOf(item) > -1;
}
var contains_1 = contains;
function without(array, excludedItems) {
    return array.filter(function (item) {
        return !contains(excludedItems, item);
    });
}
var without_1 = without;
function union(array, other) {
    return array.concat(without(other, array));
}
var union_1 = union;
function forEach(obj, f, thisArg) {
    if (obj.forEach) {
        obj.forEach.call(thisArg, f);
    }
    else {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                f.call(thisArg, obj[k], k, obj);
            }
        }
    }
}
var forEach_1 = forEach;
function reduce(obj, f, init, thisArg) {
    if (obj.reduce) {
        return obj.reduce.call(thisArg, f, init);
    }
    else {
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                init = f.call(thisArg, init, obj[k], k, obj);
            }
        }
        return init;
    }
}
var reduce_1 = reduce;
function map(obj, f, thisArg) {
    if (obj.map) {
        return obj.map.call(thisArg, f);
    }
    else {
        var output = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                output.push(f.call(thisArg, obj[k], k, obj));
            }
        }
        return output;
    }
}
var map_1 = map;
function some(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (f(arr[k], k, i++)) {
            return true;
        }
    }
    return false;
}
var some_1 = some;
function every(arr, f) {
    var i = 0;
    for (var k = 0; k < arr.length; k++) {
        if (!f(arr[k], k, i++)) {
            return false;
        }
    }
    return true;
}
var every_1 = every;
function flatten(arrays) {
    return [].concat.apply([], arrays);
}
var flatten_1 = flatten;
function mergeDeep(dest) {
    var src = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        src[_i - 1] = arguments[_i];
    }
    for (var i = 0; i < src.length; i++) {
        dest = deepMerge_(dest, src[i]);
    }
    return dest;
}
var mergeDeep_1 = mergeDeep;
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
        if (typeof src[p] !== 'object' || src[p] === null) {
            dest[p] = src[p];
        }
        else if (typeof dest[p] !== 'object' || dest[p] === null) {
            dest[p] = mergeDeep(src[p].constructor === Array ? [] : {}, src[p]);
        }
        else {
            mergeDeep(dest[p], src[p]);
        }
    }
    return dest;
}
function unique(values, f) {
    var results = [];
    var u = {}, v, i, n;
    for (i = 0, n = values.length; i < n; ++i) {
        v = f ? f(values[i]) : values[i];
        if (v in u) {
            continue;
        }
        u[v] = 1;
        results.push(values[i]);
    }
    return results;
}
var unique_1 = unique;
function warning(message) {
    console.warn('[VL Warning]', message);
}
var warning_1 = warning;
function error$1(message) {
    console.error('[VL Error]', message);
}
var error_1 = error$1;
function differ(dict, other) {
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            if (other[key] && dict[key] && other[key] !== dict[key]) {
                return true;
            }
        }
    }
    return false;
}
var differ_1 = differ;
var util$3 = {
	keys: keys$3,
	extend: extend,
	duplicate: duplicate,
	isArray: isArray,
	vals: vals,
	truncate: truncate,
	toMap: toMap$1,
	isObject: isObject,
	isString: isString,
	isNumber: isNumber,
	isBoolean: isBoolean,
	pick: pick_1,
	range: range_1,
	omit: omit_1,
	hash: hash_1,
	contains: contains_1,
	without: without_1,
	union: union_1,
	forEach: forEach_1,
	reduce: reduce_1,
	map: map_1,
	some: some_1,
	every: every_1,
	flatten: flatten_1,
	mergeDeep: mergeDeep_1,
	unique: unique_1,
	warning: warning_1,
	error: error_1,
	differ: differ_1
};

var channel = createCommonjsModule(function (module, exports) {
(function (Channel) {
    Channel[Channel["X"] = 'x'] = "X";
    Channel[Channel["Y"] = 'y'] = "Y";
    Channel[Channel["X2"] = 'x2'] = "X2";
    Channel[Channel["Y2"] = 'y2'] = "Y2";
    Channel[Channel["ROW"] = 'row'] = "ROW";
    Channel[Channel["COLUMN"] = 'column'] = "COLUMN";
    Channel[Channel["SHAPE"] = 'shape'] = "SHAPE";
    Channel[Channel["SIZE"] = 'size'] = "SIZE";
    Channel[Channel["COLOR"] = 'color'] = "COLOR";
    Channel[Channel["TEXT"] = 'text'] = "TEXT";
    Channel[Channel["DETAIL"] = 'detail'] = "DETAIL";
    Channel[Channel["LABEL"] = 'label'] = "LABEL";
    Channel[Channel["PATH"] = 'path'] = "PATH";
    Channel[Channel["ORDER"] = 'order'] = "ORDER";
    Channel[Channel["OPACITY"] = 'opacity'] = "OPACITY";
})(exports.Channel || (exports.Channel = {}));
var Channel = exports.Channel;
exports.X = Channel.X;
exports.Y = Channel.Y;
exports.X2 = Channel.X2;
exports.Y2 = Channel.Y2;
exports.ROW = Channel.ROW;
exports.COLUMN = Channel.COLUMN;
exports.SHAPE = Channel.SHAPE;
exports.SIZE = Channel.SIZE;
exports.COLOR = Channel.COLOR;
exports.TEXT = Channel.TEXT;
exports.DETAIL = Channel.DETAIL;
exports.LABEL = Channel.LABEL;
exports.PATH = Channel.PATH;
exports.ORDER = Channel.ORDER;
exports.OPACITY = Channel.OPACITY;
exports.CHANNELS = [exports.X, exports.Y, exports.X2, exports.Y2, exports.ROW, exports.COLUMN, exports.SIZE, exports.SHAPE, exports.COLOR, exports.PATH, exports.ORDER, exports.OPACITY, exports.TEXT, exports.DETAIL, exports.LABEL];
exports.UNIT_CHANNELS = util$3.without(exports.CHANNELS, [exports.ROW, exports.COLUMN]);
exports.UNIT_SCALE_CHANNELS = util$3.without(exports.UNIT_CHANNELS, [exports.PATH, exports.ORDER, exports.DETAIL, exports.TEXT, exports.LABEL, exports.X2, exports.Y2]);
exports.NONSPATIAL_CHANNELS = util$3.without(exports.UNIT_CHANNELS, [exports.X, exports.Y, exports.X2, exports.Y2]);
exports.NONSPATIAL_SCALE_CHANNELS = util$3.without(exports.UNIT_SCALE_CHANNELS, [exports.X, exports.Y, exports.X2, exports.Y2]);
exports.STACK_GROUP_CHANNELS = [exports.COLOR, exports.DETAIL, exports.ORDER, exports.OPACITY, exports.SIZE];
function supportMark(channel, mark) {
    return !!getSupportedMark(channel)[mark];
}
exports.supportMark = supportMark;
function getSupportedMark(channel) {
    switch (channel) {
        case exports.X:
        case exports.Y:
        case exports.COLOR:
        case exports.DETAIL:
        case exports.ORDER:
        case exports.OPACITY:
        case exports.ROW:
        case exports.COLUMN:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, line: true, area: true, text: true
            };
        case exports.X2:
        case exports.Y2:
            return {
                rule: true, bar: true, area: true
            };
        case exports.SIZE:
            return {
                point: true, tick: true, rule: true, circle: true, square: true,
                bar: true, text: true
            };
        case exports.SHAPE:
            return { point: true };
        case exports.TEXT:
            return { text: true };
        case exports.PATH:
            return { line: true };
    }
    return {};
}
exports.getSupportedMark = getSupportedMark;
function getSupportedRole(channel) {
    switch (channel) {
        case exports.X:
        case exports.Y:
        case exports.COLOR:
        case exports.OPACITY:
        case exports.LABEL:
        case exports.DETAIL:
            return {
                measure: true,
                dimension: true
            };
        case exports.ROW:
        case exports.COLUMN:
        case exports.SHAPE:
            return {
                measure: false,
                dimension: true
            };
        case exports.X2:
        case exports.Y2:
        case exports.SIZE:
        case exports.TEXT:
            return {
                measure: true,
                dimension: false
            };
        case exports.PATH:
            return {
                measure: false,
                dimension: true
            };
    }
    throw new Error('Invalid encoding channel' + channel);
}
exports.getSupportedRole = getSupportedRole;
function hasScale(channel) {
    return !util$3.contains([exports.DETAIL, exports.PATH, exports.TEXT, exports.LABEL, exports.ORDER], channel);
}
exports.hasScale = hasScale;
});
var channel_1 = channel.Channel;
var channel_2 = channel.X;
var channel_3 = channel.Y;
var channel_4 = channel.X2;
var channel_5 = channel.Y2;
var channel_6 = channel.ROW;
var channel_7 = channel.COLUMN;
var channel_8 = channel.SHAPE;
var channel_9 = channel.SIZE;
var channel_10 = channel.COLOR;
var channel_11 = channel.TEXT;
var channel_12 = channel.DETAIL;
var channel_13 = channel.LABEL;
var channel_14 = channel.PATH;
var channel_15 = channel.ORDER;
var channel_16 = channel.OPACITY;
var channel_17 = channel.CHANNELS;
var channel_18 = channel.UNIT_CHANNELS;
var channel_19 = channel.UNIT_SCALE_CHANNELS;
var channel_20 = channel.NONSPATIAL_CHANNELS;
var channel_21 = channel.NONSPATIAL_SCALE_CHANNELS;
var channel_22 = channel.STACK_GROUP_CHANNELS;
var channel_23 = channel.supportMark;
var channel_24 = channel.getSupportedMark;
var channel_25 = channel.getSupportedRole;
var channel_26 = channel.hasScale;

function autoMaxBins(channel$$1) {
    switch (channel$$1) {
        case channel.ROW:
        case channel.COLUMN:
        case channel.SIZE:
        case channel.SHAPE:
            return 6;
        default:
            return 10;
    }
}
var autoMaxBins_1 = autoMaxBins;
var bin = {
	autoMaxBins: autoMaxBins_1
};

var type = createCommonjsModule(function (module, exports) {
(function (Type) {
    Type[Type["QUANTITATIVE"] = 'quantitative'] = "QUANTITATIVE";
    Type[Type["ORDINAL"] = 'ordinal'] = "ORDINAL";
    Type[Type["TEMPORAL"] = 'temporal'] = "TEMPORAL";
    Type[Type["NOMINAL"] = 'nominal'] = "NOMINAL";
})(exports.Type || (exports.Type = {}));
var Type = exports.Type;
exports.QUANTITATIVE = Type.QUANTITATIVE;
exports.ORDINAL = Type.ORDINAL;
exports.TEMPORAL = Type.TEMPORAL;
exports.NOMINAL = Type.NOMINAL;
exports.SHORT_TYPE = {
    quantitative: 'Q',
    temporal: 'T',
    nominal: 'N',
    ordinal: 'O'
};
exports.TYPE_FROM_SHORT_TYPE = {
    Q: exports.QUANTITATIVE,
    T: exports.TEMPORAL,
    O: exports.ORDINAL,
    N: exports.NOMINAL
};
function getFullName(type) {
    var typeString = type;
    return exports.TYPE_FROM_SHORT_TYPE[typeString.toUpperCase()] ||
        typeString.toLowerCase();
}
exports.getFullName = getFullName;
});
var type_1 = type.Type;
var type_2 = type.QUANTITATIVE;
var type_3 = type.ORDINAL;
var type_4 = type.TEMPORAL;
var type_5 = type.NOMINAL;
var type_6 = type.SHORT_TYPE;
var type_7 = type.TYPE_FROM_SHORT_TYPE;
var type_8 = type.getFullName;

var data$1 = createCommonjsModule(function (module, exports) {
(function (DataFormatType) {
    DataFormatType[DataFormatType["JSON"] = 'json'] = "JSON";
    DataFormatType[DataFormatType["CSV"] = 'csv'] = "CSV";
    DataFormatType[DataFormatType["TSV"] = 'tsv'] = "TSV";
    DataFormatType[DataFormatType["TOPOJSON"] = 'topojson'] = "TOPOJSON";
})(exports.DataFormatType || (exports.DataFormatType = {}));
var DataFormatType = exports.DataFormatType;
(function (DataTable) {
    DataTable[DataTable["SOURCE"] = 'source'] = "SOURCE";
    DataTable[DataTable["SUMMARY"] = 'summary'] = "SUMMARY";
    DataTable[DataTable["STACKED_SCALE"] = 'stacked_scale'] = "STACKED_SCALE";
    DataTable[DataTable["LAYOUT"] = 'layout'] = "LAYOUT";
})(exports.DataTable || (exports.DataTable = {}));
var DataTable = exports.DataTable;
exports.SUMMARY = DataTable.SUMMARY;
exports.SOURCE = DataTable.SOURCE;
exports.STACKED_SCALE = DataTable.STACKED_SCALE;
exports.LAYOUT = DataTable.LAYOUT;
exports.types = {
    'boolean': type.Type.NOMINAL,
    'number': type.Type.QUANTITATIVE,
    'integer': type.Type.QUANTITATIVE,
    'date': type.Type.TEMPORAL,
    'string': type.Type.NOMINAL
};
});
var data_1 = data$1.DataFormatType;
var data_2 = data$1.DataTable;
var data_3 = data$1.SUMMARY;
var data_4 = data$1.SOURCE;
var data_5 = data$1.STACKED_SCALE;
var data_6 = data$1.LAYOUT;
var data_7 = data$1.types;

var scale$3 = createCommonjsModule(function (module, exports) {
(function (ScaleType) {
    ScaleType[ScaleType["LINEAR"] = 'linear'] = "LINEAR";
    ScaleType[ScaleType["LOG"] = 'log'] = "LOG";
    ScaleType[ScaleType["POW"] = 'pow'] = "POW";
    ScaleType[ScaleType["SQRT"] = 'sqrt'] = "SQRT";
    ScaleType[ScaleType["QUANTILE"] = 'quantile'] = "QUANTILE";
    ScaleType[ScaleType["QUANTIZE"] = 'quantize'] = "QUANTIZE";
    ScaleType[ScaleType["ORDINAL"] = 'ordinal'] = "ORDINAL";
    ScaleType[ScaleType["TIME"] = 'time'] = "TIME";
    ScaleType[ScaleType["UTC"] = 'utc'] = "UTC";
})(exports.ScaleType || (exports.ScaleType = {}));
var ScaleType = exports.ScaleType;
(function (NiceTime) {
    NiceTime[NiceTime["SECOND"] = 'second'] = "SECOND";
    NiceTime[NiceTime["MINUTE"] = 'minute'] = "MINUTE";
    NiceTime[NiceTime["HOUR"] = 'hour'] = "HOUR";
    NiceTime[NiceTime["DAY"] = 'day'] = "DAY";
    NiceTime[NiceTime["WEEK"] = 'week'] = "WEEK";
    NiceTime[NiceTime["MONTH"] = 'month'] = "MONTH";
    NiceTime[NiceTime["YEAR"] = 'year'] = "YEAR";
})(exports.NiceTime || (exports.NiceTime = {}));
var NiceTime = exports.NiceTime;
(function (BandSize) {
    BandSize[BandSize["FIT"] = 'fit'] = "FIT";
})(exports.BandSize || (exports.BandSize = {}));
var BandSize = exports.BandSize;
exports.BANDSIZE_FIT = BandSize.FIT;
exports.defaultScaleConfig = {
    round: true,
    textBandWidth: 90,
    bandSize: 21,
    padding: 0.1,
    useRawDomain: false,
    opacity: [0.3, 0.8],
    nominalColorRange: 'category10',
    sequentialColorRange: ['#AFC6A3', '#09622A'],
    shapeRange: 'shapes',
    fontSizeRange: [8, 40],
    ruleSizeRange: [1, 5],
    tickSizeRange: [1, 20]
};
exports.defaultFacetScaleConfig = {
    round: true,
    padding: 16
};
});
var scale_1 = scale$3.ScaleType;
var scale_2 = scale$3.NiceTime;
var scale_3 = scale$3.BandSize;
var scale_4 = scale$3.BANDSIZE_FIT;
var scale_5 = scale$3.defaultScaleConfig;
var scale_6 = scale$3.defaultFacetScaleConfig;

var defaultLegendConfig = {
    orient: undefined,
};
var legend$1 = {
	defaultLegendConfig: defaultLegendConfig
};

var config$2 = createCommonjsModule(function (module, exports) {
exports.defaultCellConfig = {
    width: 200,
    height: 200
};
exports.defaultFacetCellConfig = {
    stroke: '#ccc',
    strokeWidth: 1
};
var defaultFacetGridConfig = {
    color: '#000000',
    opacity: 0.4,
    offset: 0
};
exports.defaultFacetConfig = {
    scale: scale$3.defaultFacetScaleConfig,
    axis: axis$1.defaultFacetAxisConfig,
    grid: defaultFacetGridConfig,
    cell: exports.defaultFacetCellConfig
};
(function (FontWeight) {
    FontWeight[FontWeight["NORMAL"] = 'normal'] = "NORMAL";
    FontWeight[FontWeight["BOLD"] = 'bold'] = "BOLD";
})(exports.FontWeight || (exports.FontWeight = {}));
var FontWeight = exports.FontWeight;
(function (Shape) {
    Shape[Shape["CIRCLE"] = 'circle'] = "CIRCLE";
    Shape[Shape["SQUARE"] = 'square'] = "SQUARE";
    Shape[Shape["CROSS"] = 'cross'] = "CROSS";
    Shape[Shape["DIAMOND"] = 'diamond'] = "DIAMOND";
    Shape[Shape["TRIANGLEUP"] = 'triangle-up'] = "TRIANGLEUP";
    Shape[Shape["TRIANGLEDOWN"] = 'triangle-down'] = "TRIANGLEDOWN";
})(exports.Shape || (exports.Shape = {}));
var Shape = exports.Shape;
(function (Orient) {
    Orient[Orient["HORIZONTAL"] = 'horizontal'] = "HORIZONTAL";
    Orient[Orient["VERTICAL"] = 'vertical'] = "VERTICAL";
})(exports.Orient || (exports.Orient = {}));
var Orient = exports.Orient;
(function (HorizontalAlign) {
    HorizontalAlign[HorizontalAlign["LEFT"] = 'left'] = "LEFT";
    HorizontalAlign[HorizontalAlign["RIGHT"] = 'right'] = "RIGHT";
    HorizontalAlign[HorizontalAlign["CENTER"] = 'center'] = "CENTER";
})(exports.HorizontalAlign || (exports.HorizontalAlign = {}));
var HorizontalAlign = exports.HorizontalAlign;
(function (VerticalAlign) {
    VerticalAlign[VerticalAlign["TOP"] = 'top'] = "TOP";
    VerticalAlign[VerticalAlign["MIDDLE"] = 'middle'] = "MIDDLE";
    VerticalAlign[VerticalAlign["BOTTOM"] = 'bottom'] = "BOTTOM";
})(exports.VerticalAlign || (exports.VerticalAlign = {}));
var VerticalAlign = exports.VerticalAlign;
(function (FontStyle) {
    FontStyle[FontStyle["NORMAL"] = 'normal'] = "NORMAL";
    FontStyle[FontStyle["ITALIC"] = 'italic'] = "ITALIC";
})(exports.FontStyle || (exports.FontStyle = {}));
var FontStyle = exports.FontStyle;
(function (Interpolate) {
    Interpolate[Interpolate["LINEAR"] = 'linear'] = "LINEAR";
    Interpolate[Interpolate["LINEAR_CLOSED"] = 'linear-closed'] = "LINEAR_CLOSED";
    Interpolate[Interpolate["STEP"] = 'step'] = "STEP";
    Interpolate[Interpolate["STEP_BEFORE"] = 'step-before'] = "STEP_BEFORE";
    Interpolate[Interpolate["STEP_AFTER"] = 'step-after'] = "STEP_AFTER";
    Interpolate[Interpolate["BASIS"] = 'basis'] = "BASIS";
    Interpolate[Interpolate["BASIS_OPEN"] = 'basis-open'] = "BASIS_OPEN";
    Interpolate[Interpolate["BASIS_CLOSED"] = 'basis-closed'] = "BASIS_CLOSED";
    Interpolate[Interpolate["CARDINAL"] = 'cardinal'] = "CARDINAL";
    Interpolate[Interpolate["CARDINAL_OPEN"] = 'cardinal-open'] = "CARDINAL_OPEN";
    Interpolate[Interpolate["CARDINAL_CLOSED"] = 'cardinal-closed'] = "CARDINAL_CLOSED";
    Interpolate[Interpolate["BUNDLE"] = 'bundle'] = "BUNDLE";
    Interpolate[Interpolate["MONOTONE"] = 'monotone'] = "MONOTONE";
})(exports.Interpolate || (exports.Interpolate = {}));
var Interpolate = exports.Interpolate;
(function (AreaOverlay) {
    AreaOverlay[AreaOverlay["LINE"] = 'line'] = "LINE";
    AreaOverlay[AreaOverlay["LINEPOINT"] = 'linepoint'] = "LINEPOINT";
    AreaOverlay[AreaOverlay["NONE"] = 'none'] = "NONE";
})(exports.AreaOverlay || (exports.AreaOverlay = {}));
var AreaOverlay = exports.AreaOverlay;
exports.defaultOverlayConfig = {
    line: false,
    pointStyle: { filled: true },
    lineStyle: {}
};
exports.defaultMarkConfig = {
    color: '#4682b4',
    shape: Shape.CIRCLE,
    strokeWidth: 2,
    size: 30,
    barThinSize: 2,
    ruleSize: 1,
    tickThickness: 1,
    fontSize: 10,
    baseline: VerticalAlign.MIDDLE,
    text: 'Abc',
    applyColorToBackground: false
};
exports.defaultConfig = {
    numberFormat: 's',
    timeFormat: '%b %d, %Y',
    countTitle: 'Number of Records',
    cell: exports.defaultCellConfig,
    mark: exports.defaultMarkConfig,
    overlay: exports.defaultOverlayConfig,
    scale: scale$3.defaultScaleConfig,
    axis: axis$1.defaultAxisConfig,
    legend: legend$1.defaultLegendConfig,
    facet: exports.defaultFacetConfig,
};
});
var config_1$1 = config$2.defaultCellConfig;
var config_2 = config$2.defaultFacetCellConfig;
var config_3 = config$2.defaultFacetConfig;
var config_4 = config$2.FontWeight;
var config_5 = config$2.Shape;
var config_6 = config$2.Orient;
var config_7 = config$2.HorizontalAlign;
var config_8 = config$2.VerticalAlign;
var config_9 = config$2.FontStyle;
var config_10 = config$2.Interpolate;
var config_11 = config$2.AreaOverlay;
var config_12 = config$2.defaultOverlayConfig;
var config_13 = config$2.defaultMarkConfig;
var config_14 = config$2.defaultConfig;

function countRetinal(encoding) {
    var count = 0;
    if (encoding.color) {
        count++;
    }
    if (encoding.opacity) {
        count++;
    }
    if (encoding.size) {
        count++;
    }
    if (encoding.shape) {
        count++;
    }
    return count;
}
var countRetinal_1 = countRetinal;
function channels(encoding) {
    return channel.CHANNELS.filter(function (channel$$1) {
        return has(encoding, channel$$1);
    });
}
var channels_1 = channels;
function has(encoding, channel$$1) {
    var channelEncoding = encoding && encoding[channel$$1];
    return channelEncoding && (channelEncoding.field !== undefined ||
        (util$3.isArray(channelEncoding) && channelEncoding.length > 0));
}
var has_1 = has;
function isAggregate(encoding) {
    return util$3.some(channel.CHANNELS, function (channel$$1) {
        if (has(encoding, channel$$1) && encoding[channel$$1].aggregate) {
            return true;
        }
        return false;
    });
}
var isAggregate_1 = isAggregate;
function isRanged(encoding) {
    return encoding && ((!!encoding.x && !!encoding.x2) || (!!encoding.y && !!encoding.y2));
}
var isRanged_1 = isRanged;
function fieldDefs(encoding) {
    var arr = [];
    channel.CHANNELS.forEach(function (channel$$1) {
        if (has(encoding, channel$$1)) {
            if (util$3.isArray(encoding[channel$$1])) {
                encoding[channel$$1].forEach(function (fieldDef) {
                    arr.push(fieldDef);
                });
            }
            else {
                arr.push(encoding[channel$$1]);
            }
        }
    });
    return arr;
}
var fieldDefs_1 = fieldDefs;
function forEach$1(encoding, f, thisArg) {
    channelMappingForEach(channel.CHANNELS, encoding, f, thisArg);
}
var forEach_1$1 = forEach$1;
function channelMappingForEach(channels, mapping, f, thisArg) {
    var i = 0;
    channels.forEach(function (channel$$1) {
        if (has(mapping, channel$$1)) {
            if (util$3.isArray(mapping[channel$$1])) {
                mapping[channel$$1].forEach(function (fieldDef) {
                    f.call(thisArg, fieldDef, channel$$1, i++);
                });
            }
            else {
                f.call(thisArg, mapping[channel$$1], channel$$1, i++);
            }
        }
    });
}
var channelMappingForEach_1 = channelMappingForEach;
function map$1(encoding, f, thisArg) {
    return channelMappingMap(channel.CHANNELS, encoding, f, thisArg);
}
var map_1$1 = map$1;
function channelMappingMap(channels, mapping, f, thisArg) {
    var arr = [];
    channels.forEach(function (channel$$1) {
        if (has(mapping, channel$$1)) {
            if (util$3.isArray(mapping[channel$$1])) {
                mapping[channel$$1].forEach(function (fieldDef) {
                    arr.push(f.call(thisArg, fieldDef, channel$$1));
                });
            }
            else {
                arr.push(f.call(thisArg, mapping[channel$$1], channel$$1));
            }
        }
    });
    return arr;
}
var channelMappingMap_1 = channelMappingMap;
function reduce$1(encoding, f, init, thisArg) {
    return channelMappingReduce(channel.CHANNELS, encoding, f, init, thisArg);
}
var reduce_1$1 = reduce$1;
function channelMappingReduce(channels, mapping, f, init, thisArg) {
    var r = init;
    channel.CHANNELS.forEach(function (channel$$1) {
        if (has(mapping, channel$$1)) {
            if (util$3.isArray(mapping[channel$$1])) {
                mapping[channel$$1].forEach(function (fieldDef) {
                    r = f.call(thisArg, r, fieldDef, channel$$1);
                });
            }
            else {
                r = f.call(thisArg, r, mapping[channel$$1], channel$$1);
            }
        }
    });
    return r;
}
var channelMappingReduce_1 = channelMappingReduce;
var encoding = {
	countRetinal: countRetinal_1,
	channels: channels_1,
	has: has_1,
	isAggregate: isAggregate_1,
	isRanged: isRanged_1,
	fieldDefs: fieldDefs_1,
	forEach: forEach_1$1,
	channelMappingForEach: channelMappingForEach_1,
	map: map_1$1,
	channelMappingMap: channelMappingMap_1,
	reduce: reduce_1$1,
	channelMappingReduce: channelMappingReduce_1
};

var mark$1 = createCommonjsModule(function (module, exports) {
(function (Mark) {
    Mark[Mark["AREA"] = 'area'] = "AREA";
    Mark[Mark["BAR"] = 'bar'] = "BAR";
    Mark[Mark["LINE"] = 'line'] = "LINE";
    Mark[Mark["POINT"] = 'point'] = "POINT";
    Mark[Mark["TEXT"] = 'text'] = "TEXT";
    Mark[Mark["TICK"] = 'tick'] = "TICK";
    Mark[Mark["RULE"] = 'rule'] = "RULE";
    Mark[Mark["CIRCLE"] = 'circle'] = "CIRCLE";
    Mark[Mark["SQUARE"] = 'square'] = "SQUARE";
    Mark[Mark["ERRORBAR"] = 'errorBar'] = "ERRORBAR";
})(exports.Mark || (exports.Mark = {}));
var Mark = exports.Mark;
exports.AREA = Mark.AREA;
exports.BAR = Mark.BAR;
exports.LINE = Mark.LINE;
exports.POINT = Mark.POINT;
exports.TEXT = Mark.TEXT;
exports.TICK = Mark.TICK;
exports.RULE = Mark.RULE;
exports.CIRCLE = Mark.CIRCLE;
exports.SQUARE = Mark.SQUARE;
exports.ERRORBAR = Mark.ERRORBAR;
exports.PRIMITIVE_MARKS = [exports.AREA, exports.BAR, exports.LINE, exports.POINT, exports.TEXT, exports.TICK, exports.RULE, exports.CIRCLE, exports.SQUARE];
});
var mark_1 = mark$1.Mark;
var mark_2 = mark$1.AREA;
var mark_3 = mark$1.BAR;
var mark_4 = mark$1.LINE;
var mark_5 = mark$1.POINT;
var mark_6 = mark$1.TEXT;
var mark_7 = mark$1.TICK;
var mark_8 = mark$1.RULE;
var mark_9 = mark$1.CIRCLE;
var mark_10 = mark$1.SQUARE;
var mark_11 = mark$1.ERRORBAR;
var mark_12 = mark$1.PRIMITIVE_MARKS;

var stack_1 = createCommonjsModule(function (module, exports) {
(function (StackOffset) {
    StackOffset[StackOffset["ZERO"] = 'zero'] = "ZERO";
    StackOffset[StackOffset["CENTER"] = 'center'] = "CENTER";
    StackOffset[StackOffset["NORMALIZE"] = 'normalize'] = "NORMALIZE";
    StackOffset[StackOffset["NONE"] = 'none'] = "NONE";
})(exports.StackOffset || (exports.StackOffset = {}));
var StackOffset = exports.StackOffset;
function stack(mark, encoding$$1, stacked) {
    if (util$3.contains([StackOffset.NONE, null, false], stacked)) {
        return null;
    }
    if (!util$3.contains([mark$1.BAR, mark$1.AREA, mark$1.POINT, mark$1.CIRCLE, mark$1.SQUARE, mark$1.LINE, mark$1.TEXT, mark$1.TICK], mark)) {
        return null;
    }
    if (!encoding.isAggregate(encoding$$1)) {
        return null;
    }
    var stackByChannels = channel.STACK_GROUP_CHANNELS.reduce(function (sc, channel$$1) {
        if (encoding.has(encoding$$1, channel$$1) && !encoding$$1[channel$$1].aggregate) {
            sc.push(channel$$1);
        }
        return sc;
    }, []);
    if (stackByChannels.length === 0) {
        return null;
    }
    var hasXField = encoding.has(encoding$$1, channel.X);
    var hasYField = encoding.has(encoding$$1, channel.Y);
    var xIsAggregate = hasXField && !!encoding$$1.x.aggregate;
    var yIsAggregate = hasYField && !!encoding$$1.y.aggregate;
    if (xIsAggregate !== yIsAggregate) {
        var fieldChannel = xIsAggregate ? channel.X : channel.Y;
        var fieldChannelAggregate = encoding$$1[fieldChannel].aggregate;
        var fieldChannelScale = encoding$$1[fieldChannel].scale;
        if (fieldChannelScale && fieldChannelScale.type && fieldChannelScale.type !== scale$3.ScaleType.LINEAR) {
            console.warn('Cannot stack non-linear (' + fieldChannelScale.type + ') scale');
            return null;
        }
        if (util$3.contains(aggregate.SUM_OPS, fieldChannelAggregate)) {
            if (util$3.contains([mark$1.BAR, mark$1.AREA], mark)) {
                stacked = stacked === undefined ? StackOffset.ZERO : stacked;
            }
        }
        else {
            console.warn('Cannot stack when the aggregate function is ' + fieldChannelAggregate + '(non-summative).');
            return null;
        }
        if (!stacked) {
            return null;
        }
        return {
            groupbyChannel: xIsAggregate ? (hasYField ? channel.Y : null) : (hasXField ? channel.X : null),
            fieldChannel: fieldChannel,
            stackByChannels: stackByChannels,
            offset: stacked
        };
    }
    return null;
}
exports.stack = stack;
});
var stack_2 = stack_1.StackOffset;
var stack_3 = stack_1.stack;

var vlEncoding = encoding;
function isSomeFacetSpec(spec) {
    return spec['facet'] !== undefined;
}
var isSomeFacetSpec_1 = isSomeFacetSpec;
function isExtendedUnitSpec(spec) {
    if (isSomeUnitSpec(spec)) {
        var hasRow = encoding.has(spec.encoding, channel.ROW);
        var hasColumn = encoding.has(spec.encoding, channel.COLUMN);
        return hasRow || hasColumn;
    }
    return false;
}
var isExtendedUnitSpec_1 = isExtendedUnitSpec;
function isUnitSpec(spec) {
    if (isSomeUnitSpec(spec)) {
        return !isExtendedUnitSpec(spec);
    }
    return false;
}
var isUnitSpec_1 = isUnitSpec;
function isSomeUnitSpec(spec) {
    return spec['mark'] !== undefined;
}
var isSomeUnitSpec_1 = isSomeUnitSpec;
function isLayerSpec(spec) {
    return spec['layers'] !== undefined;
}
var isLayerSpec_1 = isLayerSpec;
function normalize(spec) {
    if (isExtendedUnitSpec(spec)) {
        return normalizeExtendedUnitSpec(spec);
    }
    if (isUnitSpec(spec)) {
        return normalizeUnitSpec(spec);
    }
    return spec;
}
var normalize_1 = normalize;
function normalizeExtendedUnitSpec(spec) {
    var hasRow = encoding.has(spec.encoding, channel.ROW);
    var hasColumn = encoding.has(spec.encoding, channel.COLUMN);
    var encoding$$1 = util$3.duplicate(spec.encoding);
    delete encoding$$1.column;
    delete encoding$$1.row;
    return util$3.extend(spec.name ? { name: spec.name } : {}, spec.description ? { description: spec.description } : {}, { data: spec.data }, spec.transform ? { transform: spec.transform } : {}, {
        facet: util$3.extend(hasRow ? { row: spec.encoding.row } : {}, hasColumn ? { column: spec.encoding.column } : {}),
        spec: normalizeUnitSpec(util$3.extend(spec.width ? { width: spec.width } : {}, spec.height ? { height: spec.height } : {}, {
            mark: spec.mark,
            encoding: encoding$$1
        }, spec.config ? { config: spec.config } : {}))
    }, spec.config ? { config: spec.config } : {});
}
var normalizeExtendedUnitSpec_1 = normalizeExtendedUnitSpec;
function normalizeUnitSpec(spec) {
    var config = spec.config;
    var overlayConfig = config && config.overlay;
    var overlayWithLine = overlayConfig && spec.mark === mark$1.AREA &&
        util$3.contains([config$2.AreaOverlay.LINEPOINT, config$2.AreaOverlay.LINE], overlayConfig.area);
    var overlayWithPoint = overlayConfig && ((overlayConfig.line && spec.mark === mark$1.LINE) ||
        (overlayConfig.area === config$2.AreaOverlay.LINEPOINT && spec.mark === mark$1.AREA));
    if (spec.mark === mark$1.ERRORBAR) {
        return normalizeErrorBarUnitSpec(spec);
    }
    if (encoding.isRanged(spec.encoding)) {
        return normalizeRangedUnitSpec(spec);
    }
    if (overlayWithPoint || overlayWithLine) {
        return normalizeOverlay(spec, overlayWithPoint, overlayWithLine);
    }
    return spec;
}
var normalizeUnitSpec_1 = normalizeUnitSpec;
function normalizeRangedUnitSpec(spec) {
    if (spec.encoding) {
        var hasX = encoding.has(spec.encoding, channel.X);
        var hasY = encoding.has(spec.encoding, channel.Y);
        var hasX2 = encoding.has(spec.encoding, channel.X2);
        var hasY2 = encoding.has(spec.encoding, channel.Y2);
        if ((hasX2 && !hasX) || (hasY2 && !hasY)) {
            var normalizedSpec = util$3.duplicate(spec);
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
    }
    return spec;
}
var normalizeRangedUnitSpec_1 = normalizeRangedUnitSpec;
function normalizeErrorBarUnitSpec(spec) {
    var layerSpec = util$3.extend(spec.name ? { name: spec.name } : {}, spec.description ? { description: spec.description } : {}, spec.data ? { data: spec.data } : {}, spec.transform ? { transform: spec.transform } : {}, spec.config ? { config: spec.config } : {}, { layers: [] });
    if (!spec.encoding) {
        return layerSpec;
    }
    if (spec.mark === mark$1.ERRORBAR) {
        var ruleSpec = {
            mark: mark$1.RULE,
            encoding: util$3.extend(spec.encoding.x ? { x: util$3.duplicate(spec.encoding.x) } : {}, spec.encoding.y ? { y: util$3.duplicate(spec.encoding.y) } : {}, spec.encoding.x2 ? { x2: util$3.duplicate(spec.encoding.x2) } : {}, spec.encoding.y2 ? { y2: util$3.duplicate(spec.encoding.y2) } : {}, {})
        };
        var lowerTickSpec = {
            mark: mark$1.TICK,
            encoding: util$3.extend(spec.encoding.x ? { x: util$3.duplicate(spec.encoding.x) } : {}, spec.encoding.y ? { y: util$3.duplicate(spec.encoding.y) } : {}, spec.encoding.size ? { size: util$3.duplicate(spec.encoding.size) } : {}, {})
        };
        var upperTickSpec = {
            mark: mark$1.TICK,
            encoding: util$3.extend({
                x: spec.encoding.x2 ? util$3.duplicate(spec.encoding.x2) : util$3.duplicate(spec.encoding.x),
                y: spec.encoding.y2 ? util$3.duplicate(spec.encoding.y2) : util$3.duplicate(spec.encoding.y)
            }, spec.encoding.size ? { size: util$3.duplicate(spec.encoding.size) } : {})
        };
        layerSpec.layers.push(normalizeUnitSpec(ruleSpec));
        layerSpec.layers.push(normalizeUnitSpec(lowerTickSpec));
        layerSpec.layers.push(normalizeUnitSpec(upperTickSpec));
    }
    return layerSpec;
}
var normalizeErrorBarUnitSpec_1 = normalizeErrorBarUnitSpec;
function normalizeOverlay(spec, overlayWithPoint, overlayWithLine) {
    var outerProps = ['name', 'description', 'data', 'transform'];
    var baseSpec = util$3.omit(spec, outerProps.concat('config'));
    var baseConfig = util$3.duplicate(spec.config);
    delete baseConfig.overlay;
    var stacked = stack_1.stack(spec.mark, spec.encoding, spec.config && spec.config.mark ? spec.config.mark.stacked : undefined);
    var layerSpec = util$3.extend(util$3.pick(spec, outerProps), { layers: [baseSpec] }, util$3.keys(baseConfig).length > 0 ? { config: baseConfig } : {});
    if (overlayWithLine) {
        var lineSpec = util$3.duplicate(baseSpec);
        lineSpec.mark = mark$1.LINE;
        var markConfig = util$3.extend({}, config$2.defaultOverlayConfig.lineStyle, spec.config.overlay.lineStyle, stacked ? { stacked: stacked.offset } : null);
        if (util$3.keys(markConfig).length > 0) {
            lineSpec.config = { mark: markConfig };
        }
        layerSpec.layers.push(lineSpec);
    }
    if (overlayWithPoint) {
        var pointSpec = util$3.duplicate(baseSpec);
        pointSpec.mark = mark$1.POINT;
        var markConfig = util$3.extend({}, config$2.defaultOverlayConfig.pointStyle, spec.config.overlay.pointStyle, stacked ? { stacked: stacked.offset } : null);
        if (util$3.keys(markConfig).length > 0) {
            pointSpec.config = { mark: markConfig };
        }
        layerSpec.layers.push(pointSpec);
    }
    return layerSpec;
}
var normalizeOverlay_1 = normalizeOverlay;
function accumulate(dict, fieldDefs) {
    fieldDefs.forEach(function (fieldDef) {
        var pureFieldDef = ['field', 'type', 'value', 'timeUnit', 'bin', 'aggregate'].reduce(function (f, key) {
            if (fieldDef[key] !== undefined) {
                f[key] = fieldDef[key];
            }
            return f;
        }, {});
        var key = util$3.hash(pureFieldDef);
        dict[key] = dict[key] || fieldDef;
    });
    return dict;
}
function fieldDefIndex(spec, dict) {
    if (dict === void 0) { dict = {}; }
    if (isLayerSpec(spec)) {
        spec.layers.forEach(function (layer) {
            accumulate(dict, vlEncoding.fieldDefs(layer.encoding));
        });
    }
    else if (isSomeFacetSpec(spec)) {
        accumulate(dict, vlEncoding.fieldDefs(spec.facet));
        fieldDefIndex(spec.spec, dict);
    }
    else {
        accumulate(dict, vlEncoding.fieldDefs(spec.encoding));
    }
    return dict;
}
function fieldDefs$1(spec) {
    return util$3.vals(fieldDefIndex(spec));
}
var fieldDefs_1$1 = fieldDefs$1;
function isStacked(spec) {
    return stack_1.stack(spec.mark, spec.encoding, (spec.config && spec.config.mark) ? spec.config.mark.stacked : undefined) !== null;
}
var isStacked_1 = isStacked;
var spec$1 = {
	isSomeFacetSpec: isSomeFacetSpec_1,
	isExtendedUnitSpec: isExtendedUnitSpec_1,
	isUnitSpec: isUnitSpec_1,
	isSomeUnitSpec: isSomeUnitSpec_1,
	isLayerSpec: isLayerSpec_1,
	normalize: normalize_1,
	normalizeExtendedUnitSpec: normalizeExtendedUnitSpec_1,
	normalizeUnitSpec: normalizeUnitSpec_1,
	normalizeRangedUnitSpec: normalizeRangedUnitSpec_1,
	normalizeErrorBarUnitSpec: normalizeErrorBarUnitSpec_1,
	normalizeOverlay: normalizeOverlay_1,
	fieldDefs: fieldDefs_1$1,
	isStacked: isStacked_1
};

function field(fieldDef, opt) {
    if (opt === void 0) { opt = {}; }
    var field = fieldDef.field;
    var prefix = opt.prefix;
    var suffix = opt.suffix;
    if (isCount(fieldDef)) {
        field = 'count';
    }
    else {
        var fn = opt.fn;
        if (!opt.nofn) {
            if (fieldDef.bin) {
                fn = 'bin';
                suffix = opt.binSuffix || (opt.scaleType === scale$3.ScaleType.ORDINAL ?
                    'range' :
                    'start');
            }
            else if (!opt.noAggregate && fieldDef.aggregate) {
                fn = String(fieldDef.aggregate);
            }
            else if (fieldDef.timeUnit) {
                fn = String(fieldDef.timeUnit);
            }
        }
        if (!!fn) {
            field = fn + "_" + field;
        }
    }
    if (!!suffix) {
        field = field + "_" + suffix;
    }
    if (!!prefix) {
        field = prefix + "_" + field;
    }
    if (opt.datum) {
        field = "datum[\"" + field + "\"]";
    }
    return field;
}
var field_1 = field;
function _isFieldDimension(fieldDef) {
    if (util$3.contains([type.NOMINAL, type.ORDINAL], fieldDef.type)) {
        return true;
    }
    else if (!!fieldDef.bin) {
        return true;
    }
    else if (fieldDef.type === type.TEMPORAL) {
        return !!fieldDef.timeUnit;
    }
    return false;
}
function isDimension(fieldDef) {
    return fieldDef && fieldDef.field && _isFieldDimension(fieldDef);
}
var isDimension_1 = isDimension;
function isMeasure(fieldDef) {
    return fieldDef && fieldDef.field && !_isFieldDimension(fieldDef);
}
var isMeasure_1 = isMeasure;
function count() {
    return { field: '*', aggregate: aggregate.AggregateOp.COUNT, type: type.QUANTITATIVE };
}
var count_1 = count;
function isCount(fieldDef) {
    return fieldDef.aggregate === aggregate.AggregateOp.COUNT;
}
var isCount_1 = isCount;
function title(fieldDef, config) {
    if (fieldDef.title != null) {
        return fieldDef.title;
    }
    if (isCount(fieldDef)) {
        return config.countTitle;
    }
    var fn = fieldDef.aggregate || fieldDef.timeUnit || (fieldDef.bin && 'bin');
    if (fn) {
        return fn.toString().toUpperCase() + '(' + fieldDef.field + ')';
    }
    else {
        return fieldDef.field;
    }
}
var title_1 = title;
var fielddef = {
	field: field_1,
	isDimension: isDimension_1,
	isMeasure: isMeasure_1,
	count: count_1,
	isCount: isCount_1,
	title: title_1
};

var sort = createCommonjsModule(function (module, exports) {
(function (SortOrder) {
    SortOrder[SortOrder["ASCENDING"] = 'ascending'] = "ASCENDING";
    SortOrder[SortOrder["DESCENDING"] = 'descending'] = "DESCENDING";
    SortOrder[SortOrder["NONE"] = 'none'] = "NONE";
})(exports.SortOrder || (exports.SortOrder = {}));
var SortOrder = exports.SortOrder;
function isSortField(sort) {
    return !!sort && !!sort['field'] && !!sort['op'];
}
exports.isSortField = isSortField;
});
var sort_1 = sort.SortOrder;
var sort_2 = sort.isSortField;

var datetime = createCommonjsModule(function (module, exports) {
var SUNDAY_YEAR = 2006;
function isDateTime(o) {
    return !!o && (!!o.year || !!o.quarter || !!o.month || !!o.date || !!o.day ||
        !!o.hours || !!o.minutes || !!o.seconds || !!o.milliseconds);
}
exports.isDateTime = isDateTime;
exports.MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
exports.SHORT_MONTHS = exports.MONTHS.map(function (m) { return m.substr(0, 3); });
exports.DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
exports.SHORT_DAYS = exports.DAYS.map(function (d) { return d.substr(0, 3); });
function normalizeQuarter(q) {
    if (util$3.isNumber(q)) {
        return (q - 1) + '';
    }
    else {
        console.warn('Potentially invalid quarter', q);
        return q;
    }
}
function normalizeMonth(m) {
    if (util$3.isNumber(m)) {
        return (m - 1) + '';
    }
    else {
        var lowerM = m.toLowerCase();
        var monthIndex = exports.MONTHS.indexOf(lowerM);
        if (monthIndex !== -1) {
            return monthIndex + '';
        }
        var shortM = lowerM.substr(0, 3);
        var shortMonthIndex = exports.SHORT_MONTHS.indexOf(shortM);
        if (shortMonthIndex !== -1) {
            return shortMonthIndex + '';
        }
        console.warn('Potentially invalid month', m);
        return m;
    }
}
function normalizeDay(d) {
    if (util$3.isNumber(d)) {
        return (d % 7) + '';
    }
    else {
        var lowerD = d.toLowerCase();
        var dayIndex = exports.DAYS.indexOf(lowerD);
        if (dayIndex !== -1) {
            return dayIndex + '';
        }
        var shortD = lowerD.substr(0, 3);
        var shortDayIndex = exports.SHORT_DAYS.indexOf(shortD);
        if (shortDayIndex !== -1) {
            return shortDayIndex + '';
        }
        console.warn('Potentially invalid day', d);
        return d;
    }
}
function timestamp(d, normalize) {
    var date = new Date(0, 0, 1, 0, 0, 0, 0);
    if (d.day !== undefined) {
        if (util$3.keys(d).length > 1) {
            console.warn('Dropping day from datetime', JSON.stringify(d), 'as day cannot be combined with other units.');
            d = util$3.duplicate(d);
            delete d.day;
        }
        else {
            date.setFullYear(SUNDAY_YEAR);
            var day = normalize ? normalizeDay(d.day) : d.day;
            date.setDate(+day + 1);
        }
    }
    if (d.year !== undefined) {
        date.setFullYear(d.year);
    }
    if (d.quarter !== undefined) {
        var quarter = normalize ? normalizeQuarter(d.quarter) : d.quarter;
        date.setMonth(+quarter * 3);
    }
    if (d.month !== undefined) {
        var month = normalize ? normalizeMonth(d.month) : d.month;
        date.setMonth(+month);
    }
    if (d.date !== undefined) {
        date.setDate(d.date);
    }
    if (d.hours !== undefined) {
        date.setHours(d.hours);
    }
    if (d.minutes !== undefined) {
        date.setMinutes(d.minutes);
    }
    if (d.seconds !== undefined) {
        date.setSeconds(d.seconds);
    }
    if (d.milliseconds !== undefined) {
        date.setMilliseconds(d.milliseconds);
    }
    return date.getTime();
}
exports.timestamp = timestamp;
function dateTimeExpr(d, normalize) {
    if (normalize === void 0) { normalize = false; }
    var units = [];
    if (normalize && d.day !== undefined) {
        if (util$3.keys(d).length > 1) {
            console.warn('Dropping day from datetime', JSON.stringify(d), 'as day cannot be combined with other units.');
            d = util$3.duplicate(d);
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
        var quarter = normalize ? normalizeQuarter(d.quarter) : d.quarter;
        units.push(quarter + '*3');
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
    return 'datetime(' + units.join(', ') + ')';
}
exports.dateTimeExpr = dateTimeExpr;
});
var datetime_1 = datetime.isDateTime;
var datetime_2 = datetime.MONTHS;
var datetime_3 = datetime.SHORT_MONTHS;
var datetime_4 = datetime.DAYS;
var datetime_5 = datetime.SHORT_DAYS;
var datetime_6 = datetime.timestamp;
var datetime_7 = datetime.dateTimeExpr;

var axis$2 = createCommonjsModule(function (module, exports) {
function parseAxisComponent(model, axisChannels) {
    return axisChannels.reduce(function (axis, channel$$1) {
        if (model.axis(channel$$1)) {
            axis[channel$$1] = parseAxis(channel$$1, model);
        }
        return axis;
    }, {});
}
exports.parseAxisComponent = parseAxisComponent;
function parseInnerAxis(channel$$1, model) {
    var isCol = channel$$1 === channel.COLUMN, isRow = channel$$1 === channel.ROW, type$$1 = isCol ? 'x' : isRow ? 'y' : channel$$1;
    var def = {
        type: type$$1,
        scale: model.scaleName(channel$$1),
        grid: true,
        tickSize: 0,
        properties: {
            labels: {
                text: { value: '' }
            },
            axis: {
                stroke: { value: 'transparent' }
            }
        }
    };
    var axis = model.axis(channel$$1);
    ['layer', 'ticks', 'values', 'subdivide'].forEach(function (property) {
        var method;
        var value = (method = exports[property]) ?
            method(model, channel$$1, def) :
            axis[property];
        if (value !== undefined) {
            def[property] = value;
        }
    });
    var props = model.axis(channel$$1).properties || {};
    ['grid'].forEach(function (group) {
        var value = properties[group] ?
            properties[group](model, channel$$1, props[group] || {}, def) :
            props[group];
        if (value !== undefined && util$3.keys(value).length > 0) {
            def.properties = def.properties || {};
            def.properties[group] = value;
        }
    });
    return def;
}
exports.parseInnerAxis = parseInnerAxis;
function parseAxis(channel$$1, model) {
    var isCol = channel$$1 === channel.COLUMN, isRow = channel$$1 === channel.ROW, type$$1 = isCol ? 'x' : isRow ? 'y' : channel$$1;
    var axis = model.axis(channel$$1);
    var def = {
        type: type$$1,
        scale: model.scaleName(channel$$1)
    };
    [
        'format', 'grid', 'layer', 'offset', 'orient', 'tickSize', 'ticks', 'tickSizeEnd', 'title', 'titleOffset', 'values',
        'tickPadding', 'tickSize', 'tickSizeMajor', 'tickSizeMinor', 'subdivide'
    ].forEach(function (property) {
        var method;
        var value = (method = exports[property]) ?
            method(model, channel$$1, def) :
            axis[property];
        if (value !== undefined) {
            def[property] = value;
        }
    });
    var props = model.axis(channel$$1).properties || {};
    [
        'axis', 'labels',
        'grid', 'title', 'ticks', 'majorTicks', 'minorTicks'
    ].forEach(function (group) {
        var value = properties[group] ?
            properties[group](model, channel$$1, props[group] || {}, def) :
            props[group];
        if (value !== undefined && util$3.keys(value).length > 0) {
            def.properties = def.properties || {};
            def.properties[group] = value;
        }
    });
    return def;
}
exports.parseAxis = parseAxis;
function format(model, channel$$1) {
    return common.numberFormat(model.fieldDef(channel$$1), model.axis(channel$$1).format, model.config(), channel$$1);
}
exports.format = format;
function offset(model, channel$$1) {
    return model.axis(channel$$1).offset;
}
exports.offset = offset;
function gridShow(model, channel$$1) {
    var grid = model.axis(channel$$1).grid;
    if (grid !== undefined) {
        return grid;
    }
    return !model.isOrdinalScale(channel$$1) && !model.fieldDef(channel$$1).bin;
}
exports.gridShow = gridShow;
function grid(model, channel$$1) {
    if (channel$$1 === channel.ROW || channel$$1 === channel.COLUMN) {
        return undefined;
    }
    return gridShow(model, channel$$1) && ((channel$$1 === channel.Y || channel$$1 === channel.X) && !(model.parent() && model.parent().isFacet()));
}
exports.grid = grid;
function layer(model, channel$$1, def) {
    var layer = model.axis(channel$$1).layer;
    if (layer !== undefined) {
        return layer;
    }
    if (def.grid) {
        return 'back';
    }
    return undefined;
}
exports.layer = layer;
function orient(model, channel$$1) {
    var orient = model.axis(channel$$1).orient;
    if (orient) {
        return orient;
    }
    else if (channel$$1 === channel.COLUMN) {
        return axis$1.AxisOrient.TOP;
    }
    return undefined;
}
exports.orient = orient;
function ticks(model, channel$$1) {
    var ticks = model.axis(channel$$1).ticks;
    if (ticks !== undefined) {
        return ticks;
    }
    if (channel$$1 === channel.X && !model.fieldDef(channel$$1).bin) {
        return 5;
    }
    return undefined;
}
exports.ticks = ticks;
function tickSize(model, channel$$1) {
    var tickSize = model.axis(channel$$1).tickSize;
    if (tickSize !== undefined) {
        return tickSize;
    }
    return undefined;
}
exports.tickSize = tickSize;
function tickSizeEnd(model, channel$$1) {
    var tickSizeEnd = model.axis(channel$$1).tickSizeEnd;
    if (tickSizeEnd !== undefined) {
        return tickSizeEnd;
    }
    return undefined;
}
exports.tickSizeEnd = tickSizeEnd;
function title(model, channel$$1) {
    var axis = model.axis(channel$$1);
    if (axis.title !== undefined) {
        return axis.title;
    }
    var fieldTitle = fielddef.title(model.fieldDef(channel$$1), model.config());
    var maxLength;
    if (axis.titleMaxLength) {
        maxLength = axis.titleMaxLength;
    }
    else if (channel$$1 === channel.X && !model.isOrdinalScale(channel.X)) {
        var unitModel = model;
        maxLength = unitModel.width / model.axis(channel.X).characterWidth;
    }
    else if (channel$$1 === channel.Y && !model.isOrdinalScale(channel.Y)) {
        var unitModel = model;
        maxLength = unitModel.height / model.axis(channel.Y).characterWidth;
    }
    return maxLength ? util$3.truncate(fieldTitle, maxLength) : fieldTitle;
}
exports.title = title;
function titleOffset(model, channel$$1) {
    var titleOffset = model.axis(channel$$1).titleOffset;
    if (titleOffset !== undefined) {
        return titleOffset;
    }
    return undefined;
}
exports.titleOffset = titleOffset;
function values(model, channel$$1) {
    var vals = model.axis(channel$$1).values;
    if (vals && datetime.isDateTime(vals[0])) {
        return vals.map(function (dt) {
            return datetime.timestamp(dt, true);
        });
    }
    return vals;
}
exports.values = values;
var properties;
(function (properties) {
    function axis(model, channel$$1, axisPropsSpec) {
        var axis = model.axis(channel$$1);
        return util$3.extend(axis.axisColor !== undefined ?
            { stroke: { value: axis.axisColor } } :
            {}, axis.axisWidth !== undefined ?
            { strokeWidth: { value: axis.axisWidth } } :
            {}, axisPropsSpec || {});
    }
    properties.axis = axis;
    function grid(model, channel$$1, gridPropsSpec) {
        var axis = model.axis(channel$$1);
        return util$3.extend(axis.gridColor !== undefined ? { stroke: { value: axis.gridColor } } : {}, axis.gridOpacity !== undefined ? { strokeOpacity: { value: axis.gridOpacity } } : {}, axis.gridWidth !== undefined ? { strokeWidth: { value: axis.gridWidth } } : {}, axis.gridDash !== undefined ? { strokeDashOffset: { value: axis.gridDash } } : {}, gridPropsSpec || {});
    }
    properties.grid = grid;
    function labels(model, channel$$1, labelsSpec, def) {
        var fieldDef = model.fieldDef(channel$$1);
        var axis = model.axis(channel$$1);
        var config = model.config();
        if (!axis.labels) {
            return util$3.extend({
                text: ''
            }, labelsSpec);
        }
        if (util$3.contains([type.NOMINAL, type.ORDINAL], fieldDef.type) && axis.labelMaxLength) {
            labelsSpec = util$3.extend({
                text: {
                    template: '{{ datum["data"] | truncate:' + axis.labelMaxLength + ' }}'
                }
            }, labelsSpec || {});
        }
        else if (fieldDef.type === type.TEMPORAL) {
            labelsSpec = util$3.extend({
                text: {
                    template: common.timeTemplate('datum["data"]', fieldDef.timeUnit, axis.format, axis.shortTimeLabels, config)
                }
            }, labelsSpec);
        }
        if (axis.labelAngle !== undefined) {
            labelsSpec.angle = { value: axis.labelAngle };
        }
        else {
            if (channel$$1 === channel.X && (util$3.contains([type.NOMINAL, type.ORDINAL], fieldDef.type) || !!fieldDef.bin || fieldDef.type === type.TEMPORAL)) {
                labelsSpec.angle = { value: 270 };
            }
        }
        if (axis.labelAlign !== undefined) {
            labelsSpec.align = { value: axis.labelAlign };
        }
        else {
            if (labelsSpec.angle) {
                if (labelsSpec.angle.value === 270) {
                    labelsSpec.align = {
                        value: def.orient === 'top' ? 'left' :
                            def.type === 'x' ? 'right' :
                                'center'
                    };
                }
                else if (labelsSpec.angle.value === 90) {
                    labelsSpec.align = { value: 'center' };
                }
            }
        }
        if (axis.labelBaseline !== undefined) {
            labelsSpec.baseline = { value: axis.labelBaseline };
        }
        else {
            if (labelsSpec.angle) {
                if (labelsSpec.angle.value === 270) {
                    labelsSpec.baseline = { value: def.type === 'x' ? 'middle' : 'bottom' };
                }
                else if (labelsSpec.angle.value === 90) {
                    labelsSpec.baseline = { value: 'bottom' };
                }
            }
        }
        if (axis.tickLabelColor !== undefined) {
            labelsSpec.fill = { value: axis.tickLabelColor };
        }
        if (axis.tickLabelFont !== undefined) {
            labelsSpec.font = { value: axis.tickLabelFont };
        }
        if (axis.tickLabelFontSize !== undefined) {
            labelsSpec.fontSize = { value: axis.tickLabelFontSize };
        }
        return util$3.keys(labelsSpec).length === 0 ? undefined : labelsSpec;
    }
    properties.labels = labels;
    function ticks(model, channel$$1, ticksPropsSpec) {
        var axis = model.axis(channel$$1);
        return util$3.extend(axis.tickColor !== undefined ? { stroke: { value: axis.tickColor } } : {}, axis.tickWidth !== undefined ? { strokeWidth: { value: axis.tickWidth } } : {}, ticksPropsSpec || {});
    }
    properties.ticks = ticks;
    function title(model, channel$$1, titlePropsSpec) {
        var axis = model.axis(channel$$1);
        return util$3.extend(axis.titleColor !== undefined ? { fill: { value: axis.titleColor } } : {}, axis.titleFont !== undefined ? { font: { value: axis.titleFont } } : {}, axis.titleFontSize !== undefined ? { fontSize: { value: axis.titleFontSize } } : {}, axis.titleFontWeight !== undefined ? { fontWeight: { value: axis.titleFontWeight } } : {}, titlePropsSpec || {});
    }
    properties.title = title;
})(properties = exports.properties || (exports.properties = {}));
});
var axis_2$1 = axis$2.parseAxisComponent;
var axis_3$1 = axis$2.parseInnerAxis;
var axis_4 = axis$2.parseAxis;
var axis_5 = axis$2.format;
var axis_6 = axis$2.offset;
var axis_7 = axis$2.gridShow;
var axis_8 = axis$2.grid;
var axis_9 = axis$2.layer;
var axis_10 = axis$2.orient;
var axis_11 = axis$2.ticks;
var axis_12 = axis$2.tickSize;
var axis_13 = axis$2.tickSizeEnd;
var axis_14 = axis$2.title;
var axis_15 = axis$2.titleOffset;
var axis_16 = axis$2.values;
var axis_17 = axis$2.properties;

var nullfilter = createCommonjsModule(function (module, exports) {
var DEFAULT_NULL_FILTERS = {
    nominal: false,
    ordinal: false,
    quantitative: true,
    temporal: true
};
var nullFilter;
(function (nullFilter) {
    function parse(model) {
        var filterInvalid = model.filterInvalid();
        return model.reduce(function (aggregator, fieldDef) {
            if (fieldDef.field !== '*') {
                if (filterInvalid ||
                    (filterInvalid === undefined && fieldDef.field && DEFAULT_NULL_FILTERS[fieldDef.type])) {
                    aggregator[fieldDef.field] = fieldDef;
                }
                else {
                    aggregator[fieldDef.field] = null;
                }
            }
            return aggregator;
        }, {});
    }
    nullFilter.parseUnit = parse;
    function parseFacet(model) {
        var nullFilterComponent = parse(model);
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source) {
            util$3.extend(nullFilterComponent, childDataComponent.nullFilter);
            delete childDataComponent.nullFilter;
        }
        return nullFilterComponent;
    }
    nullFilter.parseFacet = parseFacet;
    function parseLayer(model) {
        var nullFilterComponent = parse(model);
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (model.compatibleSource(child) && !util$3.differ(childDataComponent.nullFilter, nullFilterComponent)) {
                util$3.extend(nullFilterComponent, childDataComponent.nullFilter);
                delete childDataComponent.nullFilter;
            }
        });
        return nullFilterComponent;
    }
    nullFilter.parseLayer = parseLayer;
    function assemble(component) {
        var filters = util$3.keys(component.nullFilter).reduce(function (_filters, field) {
            var fieldDef = component.nullFilter[field];
            if (fieldDef !== null) {
                _filters.push('datum["' + fieldDef.field + '"] !== null');
                if (util$3.contains([type.QUANTITATIVE, type.TEMPORAL], fieldDef.type)) {
                    _filters.push('!isNaN(datum["' + fieldDef.field + '"])');
                }
            }
            return _filters;
        }, []);
        return filters.length > 0 ?
            [{
                    type: 'filter',
                    test: filters.join(' && ')
                }] : [];
    }
    nullFilter.assemble = assemble;
})(nullFilter = exports.nullFilter || (exports.nullFilter = {}));
});
var nullfilter_1 = nullfilter.nullFilter;

var timeunit = createCommonjsModule(function (module, exports) {
(function (TimeUnit) {
    TimeUnit[TimeUnit["YEAR"] = 'year'] = "YEAR";
    TimeUnit[TimeUnit["MONTH"] = 'month'] = "MONTH";
    TimeUnit[TimeUnit["DAY"] = 'day'] = "DAY";
    TimeUnit[TimeUnit["DATE"] = 'date'] = "DATE";
    TimeUnit[TimeUnit["HOURS"] = 'hours'] = "HOURS";
    TimeUnit[TimeUnit["MINUTES"] = 'minutes'] = "MINUTES";
    TimeUnit[TimeUnit["SECONDS"] = 'seconds'] = "SECONDS";
    TimeUnit[TimeUnit["MILLISECONDS"] = 'milliseconds'] = "MILLISECONDS";
    TimeUnit[TimeUnit["YEARMONTH"] = 'yearmonth'] = "YEARMONTH";
    TimeUnit[TimeUnit["YEARMONTHDATE"] = 'yearmonthdate'] = "YEARMONTHDATE";
    TimeUnit[TimeUnit["YEARMONTHDATEHOURS"] = 'yearmonthdatehours'] = "YEARMONTHDATEHOURS";
    TimeUnit[TimeUnit["YEARMONTHDATEHOURSMINUTES"] = 'yearmonthdatehoursminutes'] = "YEARMONTHDATEHOURSMINUTES";
    TimeUnit[TimeUnit["YEARMONTHDATEHOURSMINUTESSECONDS"] = 'yearmonthdatehoursminutesseconds'] = "YEARMONTHDATEHOURSMINUTESSECONDS";
    TimeUnit[TimeUnit["MONTHDATE"] = 'monthdate'] = "MONTHDATE";
    TimeUnit[TimeUnit["HOURSMINUTES"] = 'hoursminutes'] = "HOURSMINUTES";
    TimeUnit[TimeUnit["HOURSMINUTESSECONDS"] = 'hoursminutesseconds'] = "HOURSMINUTESSECONDS";
    TimeUnit[TimeUnit["MINUTESSECONDS"] = 'minutesseconds'] = "MINUTESSECONDS";
    TimeUnit[TimeUnit["SECONDSMILLISECONDS"] = 'secondsmilliseconds'] = "SECONDSMILLISECONDS";
    TimeUnit[TimeUnit["QUARTER"] = 'quarter'] = "QUARTER";
    TimeUnit[TimeUnit["YEARQUARTER"] = 'yearquarter'] = "YEARQUARTER";
    TimeUnit[TimeUnit["QUARTERMONTH"] = 'quartermonth'] = "QUARTERMONTH";
    TimeUnit[TimeUnit["YEARQUARTERMONTH"] = 'yearquartermonth'] = "YEARQUARTERMONTH";
})(exports.TimeUnit || (exports.TimeUnit = {}));
var TimeUnit = exports.TimeUnit;
exports.SINGLE_TIMEUNITS = [
    TimeUnit.YEAR,
    TimeUnit.QUARTER,
    TimeUnit.MONTH,
    TimeUnit.DAY,
    TimeUnit.DATE,
    TimeUnit.HOURS,
    TimeUnit.MINUTES,
    TimeUnit.SECONDS,
    TimeUnit.MILLISECONDS,
];
var SINGLE_TIMEUNIT_INDEX = exports.SINGLE_TIMEUNITS.reduce(function (d, timeUnit) {
    d[timeUnit] = true;
    return d;
}, {});
function isSingleTimeUnit(timeUnit) {
    return !!SINGLE_TIMEUNIT_INDEX[timeUnit];
}
exports.isSingleTimeUnit = isSingleTimeUnit;
function convert(unit, date) {
    var result = new Date(0, 0, 1, 0, 0, 0, 0);
    exports.SINGLE_TIMEUNITS.forEach(function (singleUnit) {
        if (containsTimeUnit(unit, singleUnit)) {
            switch (singleUnit) {
                case TimeUnit.DAY:
                    throw new Error('Cannot convert to TimeUnits containing \'day\'');
                case TimeUnit.YEAR:
                    result.setFullYear(date.getFullYear());
                    break;
                case TimeUnit.QUARTER:
                    result.setMonth((Math.floor(date.getMonth() / 3)) * 3);
                    break;
                case TimeUnit.MONTH:
                    result.setMonth(date.getMonth());
                    break;
                case TimeUnit.DATE:
                    result.setDate(date.getDate());
                    break;
                case TimeUnit.HOURS:
                    result.setHours(date.getHours());
                    break;
                case TimeUnit.MINUTES:
                    result.setMinutes(date.getMinutes());
                    break;
                case TimeUnit.SECONDS:
                    result.setSeconds(date.getSeconds());
                    break;
                case TimeUnit.MILLISECONDS:
                    result.setMilliseconds(date.getMilliseconds());
                    break;
            }
        }
    });
    return result;
}
exports.convert = convert;
exports.MULTI_TIMEUNITS = [
    TimeUnit.YEARQUARTER,
    TimeUnit.YEARQUARTERMONTH,
    TimeUnit.YEARMONTH,
    TimeUnit.YEARMONTHDATE,
    TimeUnit.YEARMONTHDATEHOURS,
    TimeUnit.YEARMONTHDATEHOURSMINUTES,
    TimeUnit.YEARMONTHDATEHOURSMINUTESSECONDS,
    TimeUnit.QUARTERMONTH,
    TimeUnit.HOURSMINUTES,
    TimeUnit.HOURSMINUTESSECONDS,
    TimeUnit.MINUTESSECONDS,
    TimeUnit.SECONDSMILLISECONDS,
];
var MULTI_TIMEUNIT_INDEX = exports.MULTI_TIMEUNITS.reduce(function (d, timeUnit) {
    d[timeUnit] = true;
    return d;
}, {});
function isMultiTimeUnit(timeUnit) {
    return !!MULTI_TIMEUNIT_INDEX[timeUnit];
}
exports.isMultiTimeUnit = isMultiTimeUnit;
exports.TIMEUNITS = exports.SINGLE_TIMEUNITS.concat(exports.MULTI_TIMEUNITS);
function containsTimeUnit(fullTimeUnit, timeUnit) {
    var fullTimeUnitStr = fullTimeUnit.toString();
    var timeUnitStr = timeUnit.toString();
    var index = fullTimeUnitStr.indexOf(timeUnitStr);
    return index > -1 &&
        (timeUnit !== TimeUnit.SECONDS ||
            index === 0 ||
            fullTimeUnitStr.charAt(index - 1) !== 'i');
}
exports.containsTimeUnit = containsTimeUnit;
function defaultScaleType(timeUnit) {
    switch (timeUnit) {
        case TimeUnit.HOURS:
        case TimeUnit.DAY:
        case TimeUnit.MONTH:
        case TimeUnit.QUARTER:
            return scale$3.ScaleType.ORDINAL;
    }
    return scale$3.ScaleType.TIME;
}
exports.defaultScaleType = defaultScaleType;
function fieldExpr(fullTimeUnit, field) {
    var fieldRef = 'datum["' + field + '"]';
    function func(timeUnit) {
        if (timeUnit === TimeUnit.QUARTER) {
            return 'floor(month(' + fieldRef + ')' + '/3)';
        }
        else {
            return timeUnit + '(' + fieldRef + ')';
        }
    }
    var d = exports.SINGLE_TIMEUNITS.reduce(function (_d, tu) {
        if (containsTimeUnit(fullTimeUnit, tu)) {
            _d[tu] = func(tu);
        }
        return _d;
    }, {});
    if (d.day && util$3.keys(d).length > 1) {
        console.warn('Time unit "' + fullTimeUnit + '" is not supported. We are replacing it with ', (fullTimeUnit + '').replace('day', 'date') + '.');
        delete d.day;
        d.date = func(TimeUnit.DATE);
    }
    return datetime.dateTimeExpr(d);
}
exports.fieldExpr = fieldExpr;
function imputedDomain(timeUnit, channel$$1) {
    if (util$3.contains([channel.ROW, channel.COLUMN, channel.SHAPE, channel.COLOR], channel$$1)) {
        return null;
    }
    switch (timeUnit) {
        case TimeUnit.SECONDS:
            return util$3.range(0, 60);
        case TimeUnit.MINUTES:
            return util$3.range(0, 60);
        case TimeUnit.HOURS:
            return util$3.range(0, 24);
        case TimeUnit.DAY:
            return util$3.range(0, 7);
        case TimeUnit.DATE:
            return util$3.range(1, 32);
        case TimeUnit.MONTH:
            return util$3.range(0, 12);
        case TimeUnit.QUARTER:
            return [0, 1, 2, 3];
    }
    return null;
}
exports.imputedDomain = imputedDomain;
function smallestUnit(timeUnit) {
    if (!timeUnit) {
        return undefined;
    }
    if (containsTimeUnit(timeUnit, TimeUnit.SECONDS)) {
        return 'second';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MINUTES)) {
        return 'minute';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.HOURS)) {
        return 'hour';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.DAY) ||
        containsTimeUnit(timeUnit, TimeUnit.DATE)) {
        return 'day';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.MONTH)) {
        return 'month';
    }
    if (containsTimeUnit(timeUnit, TimeUnit.YEAR)) {
        return 'year';
    }
    return undefined;
}
exports.smallestUnit = smallestUnit;
function template(timeUnit, field, shortTimeLabels) {
    if (!timeUnit) {
        return undefined;
    }
    var dateComponents = [];
    var template = '';
    var hasYear = containsTimeUnit(timeUnit, TimeUnit.YEAR);
    if (containsTimeUnit(timeUnit, TimeUnit.QUARTER)) {
        template = 'Q{{' + field + ' | quarter}}';
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
        if (template) {
            template += ' ';
        }
        template += '{{' + field + ' | time:\'' + dateTimeComponents.join(' ') + '\'}}';
    }
    return template || undefined;
}
exports.template = template;
});
var timeunit_1 = timeunit.TimeUnit;
var timeunit_2 = timeunit.SINGLE_TIMEUNITS;
var timeunit_3 = timeunit.isSingleTimeUnit;
var timeunit_4 = timeunit.convert;
var timeunit_5 = timeunit.MULTI_TIMEUNITS;
var timeunit_6 = timeunit.isMultiTimeUnit;
var timeunit_7 = timeunit.TIMEUNITS;
var timeunit_8 = timeunit.containsTimeUnit;
var timeunit_9 = timeunit.defaultScaleType;
var timeunit_10 = timeunit.fieldExpr;
var timeunit_11 = timeunit.imputedDomain;
var timeunit_12 = timeunit.smallestUnit;
var timeunit_13 = timeunit.template;

function isEqualFilter(filter) {
    return filter && !!filter.field && filter.equal !== undefined;
}
var isEqualFilter_1 = isEqualFilter;
function isRangeFilter(filter) {
    if (filter && !!filter.field) {
        if (util$3.isArray(filter.range) && filter.range.length === 2) {
            return true;
        }
    }
    return false;
}
var isRangeFilter_1 = isRangeFilter;
function isOneOfFilter(filter) {
    return filter && !!filter.field && (util$3.isArray(filter.oneOf) ||
        util$3.isArray(filter.in));
}
var isOneOfFilter_1 = isOneOfFilter;
function expression(filter) {
    if (util$3.isString(filter)) {
        return filter;
    }
    else {
        var fieldExpr = filter.timeUnit ?
            ('time(' + timeunit.fieldExpr(filter.timeUnit, filter.field) + ')') :
            fielddef.field(filter, { datum: true });
        if (isEqualFilter(filter)) {
            return fieldExpr + '===' + valueExpr(filter.equal, filter.timeUnit);
        }
        else if (isOneOfFilter(filter)) {
            var oneOf = filter.oneOf || filter['in'];
            return 'indexof([' +
                oneOf.map(function (v) { return valueExpr(v, filter.timeUnit); }).join(',') +
                '], ' + fieldExpr + ') !== -1';
        }
        else if (isRangeFilter(filter)) {
            var lower = filter.range[0];
            var upper = filter.range[1];
            if (lower !== null && upper !== null) {
                return 'inrange(' + fieldExpr + ', ' +
                    valueExpr(lower, filter.timeUnit) + ', ' +
                    valueExpr(upper, filter.timeUnit) + ')';
            }
            else if (lower !== null) {
                return fieldExpr + ' >= ' + lower;
            }
            else if (upper !== null) {
                return fieldExpr + ' <= ' + upper;
            }
        }
    }
    return undefined;
}
var expression_1 = expression;
function valueExpr(v, timeUnit) {
    if (datetime.isDateTime(v)) {
        var expr = datetime.dateTimeExpr(v, true);
        return 'time(' + expr + ')';
    }
    if (timeunit.isSingleTimeUnit(timeUnit)) {
        var datetime$$1 = {};
        datetime$$1[timeUnit] = v;
        var expr = datetime.dateTimeExpr(datetime$$1, true);
        return 'time(' + expr + ')';
    }
    return JSON.stringify(v);
}
var filter$1 = {
	isEqualFilter: isEqualFilter_1,
	isRangeFilter: isRangeFilter_1,
	isOneOfFilter: isOneOfFilter_1,
	expression: expression_1
};

var filter_2 = createCommonjsModule(function (module, exports) {
var filter;
(function (filter_2) {
    function parse(model) {
        var filter = model.filter();
        if (util$3.isArray(filter)) {
            return '(' +
                filter.map(function (f) { return filter$1.expression(f); })
                    .filter(function (f) { return f !== undefined; })
                    .join(') && (') +
                ')';
        }
        else if (filter) {
            return filter$1.expression(filter);
        }
        return undefined;
    }
    filter_2.parse = parse;
    filter_2.parseUnit = parse;
    function parseFacet(model) {
        var filterComponent = parse(model);
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source && childDataComponent.filter) {
            filterComponent =
                (filterComponent ? filterComponent + ' && ' : '') +
                    childDataComponent.filter;
            delete childDataComponent.filter;
        }
        return filterComponent;
    }
    filter_2.parseFacet = parseFacet;
    function parseLayer(model) {
        var filterComponent = parse(model);
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (model.compatibleSource(child) && childDataComponent.filter && childDataComponent.filter === filterComponent) {
                delete childDataComponent.filter;
            }
        });
        return filterComponent;
    }
    filter_2.parseLayer = parseLayer;
    function assemble(component) {
        var filter = component.filter;
        return filter ? [{
                type: 'filter',
                test: filter
            }] : [];
    }
    filter_2.assemble = assemble;
})(filter = exports.filter || (exports.filter = {}));
});
var filter_3 = filter_2.filter;

var bin_2 = createCommonjsModule(function (module, exports) {
var bin$$1;
(function (bin_2) {
    function numberFormatExpr(format, expr) {
        return "format('" + format + "', " + expr + ")";
    }
    function parse(model) {
        return model.reduce(function (binComponent, fieldDef, channel$$1) {
            var bin$$1 = model.fieldDef(channel$$1).bin;
            if (bin$$1) {
                var binTrans = util$3.extend({
                    type: 'bin',
                    field: fieldDef.field,
                    output: {
                        start: fielddef.field(fieldDef, { binSuffix: 'start' }),
                        mid: fielddef.field(fieldDef, { binSuffix: 'mid' }),
                        end: fielddef.field(fieldDef, { binSuffix: 'end' })
                    }
                }, typeof bin$$1 === 'boolean' ? {} : bin$$1);
                if (!binTrans.maxbins && !binTrans.step) {
                    binTrans.maxbins = bin.autoMaxBins(channel$$1);
                }
                var transform = [binTrans];
                var isOrdinalColor = model.isOrdinalScale(channel$$1) || channel$$1 === channel.COLOR;
                if (isOrdinalColor) {
                    var format = (model.axis(channel$$1) || model.legend(channel$$1) || {}).format ||
                        model.config().numberFormat;
                    var startField = fielddef.field(fieldDef, { datum: true, binSuffix: 'start' });
                    var endField = fielddef.field(fieldDef, { datum: true, binSuffix: 'end' });
                    transform.push({
                        type: 'formula',
                        field: fielddef.field(fieldDef, { binSuffix: 'range' }),
                        expr: numberFormatExpr(format, startField) +
                            ' + \'-\' + ' +
                            numberFormatExpr(format, endField)
                    });
                }
                var key = util$3.hash(bin$$1) + '_' + fieldDef.field + 'oc:' + isOrdinalColor;
                binComponent[key] = transform;
            }
            return binComponent;
        }, {});
    }
    bin_2.parseUnit = parse;
    function parseFacet(model) {
        var binComponent = parse(model);
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source) {
            util$3.extend(binComponent, childDataComponent.bin);
            delete childDataComponent.bin;
        }
        return binComponent;
    }
    bin_2.parseFacet = parseFacet;
    function parseLayer(model) {
        var binComponent = parse(model);
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (!childDataComponent.source) {
                util$3.extend(binComponent, childDataComponent.bin);
                delete childDataComponent.bin;
            }
        });
        return binComponent;
    }
    bin_2.parseLayer = parseLayer;
    function assemble(component) {
        return util$3.flatten(util$3.vals(component.bin));
    }
    bin_2.assemble = assemble;
})(bin$$1 = exports.bin || (exports.bin = {}));
});
var bin_3 = bin_2.bin;

var formula_1 = createCommonjsModule(function (module, exports) {
var formula;
(function (formula_1) {
    function parse(model) {
        return (model.calculate() || []).reduce(function (formulaComponent, formula) {
            formulaComponent[util$3.hash(formula)] = formula;
            return formulaComponent;
        }, {});
    }
    formula_1.parseUnit = parse;
    function parseFacet(model) {
        var formulaComponent = parse(model);
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source) {
            util$3.extend(formulaComponent, childDataComponent.calculate);
            delete childDataComponent.calculate;
        }
        return formulaComponent;
    }
    formula_1.parseFacet = parseFacet;
    function parseLayer(model) {
        var formulaComponent = parse(model);
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (!childDataComponent.source && childDataComponent.calculate) {
                util$3.extend(formulaComponent || {}, childDataComponent.calculate);
                delete childDataComponent.calculate;
            }
        });
        return formulaComponent;
    }
    formula_1.parseLayer = parseLayer;
    function assemble(component) {
        return util$3.vals(component.calculate).reduce(function (transform, formula) {
            transform.push(util$3.extend({ type: 'formula' }, formula));
            return transform;
        }, []);
    }
    formula_1.assemble = assemble;
})(formula = exports.formula || (exports.formula = {}));
});
var formula_2 = formula_1.formula;

var timeunit$1 = createCommonjsModule(function (module, exports) {
var timeUnit;
(function (timeUnit) {
    function parse(model) {
        return model.reduce(function (timeUnitComponent, fieldDef, channel) {
            if (fieldDef.type === type.TEMPORAL && fieldDef.timeUnit) {
                var hash = fielddef.field(fieldDef);
                timeUnitComponent[hash] = {
                    type: 'formula',
                    field: fielddef.field(fieldDef),
                    expr: timeunit.fieldExpr(fieldDef.timeUnit, fieldDef.field)
                };
            }
            return timeUnitComponent;
        }, {});
    }
    timeUnit.parseUnit = parse;
    function parseFacet(model) {
        var timeUnitComponent = parse(model);
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source) {
            util$3.extend(timeUnitComponent, childDataComponent.timeUnit);
            delete childDataComponent.timeUnit;
        }
        return timeUnitComponent;
    }
    timeUnit.parseFacet = parseFacet;
    function parseLayer(model) {
        var timeUnitComponent = parse(model);
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (!childDataComponent.source) {
                util$3.extend(timeUnitComponent, childDataComponent.timeUnit);
                delete childDataComponent.timeUnit;
            }
        });
        return timeUnitComponent;
    }
    timeUnit.parseLayer = parseLayer;
    function assemble(component) {
        return util$3.vals(component.timeUnit);
    }
    timeUnit.assemble = assemble;
})(timeUnit = exports.timeUnit || (exports.timeUnit = {}));
});
var timeunit_2$1 = timeunit$1.timeUnit;

var source_1 = createCommonjsModule(function (module, exports) {
var source;
(function (source) {
    function parse(model) {
        var data = model.data();
        if (data) {
            var sourceData = { name: model.dataName(data$1.SOURCE) };
            if (data.values && data.values.length > 0) {
                sourceData.values = data.values;
                sourceData.format = { type: 'json' };
            }
            else if (data.url) {
                sourceData.url = data.url;
                var defaultExtension = /(?:\.([^.]+))?$/.exec(sourceData.url)[1];
                if (!util$3.contains(['json', 'csv', 'tsv', 'topojson'], defaultExtension)) {
                    defaultExtension = 'json';
                }
                var dataFormat = data.format || {};
                var formatType = dataFormat.type || data['formatType'];
                sourceData.format =
                    util$3.extend({ type: formatType ? formatType : defaultExtension }, dataFormat.property ? { property: dataFormat.property } : {}, dataFormat.feature ?
                        { feature: dataFormat.feature } :
                        dataFormat.mesh ?
                            { mesh: dataFormat.mesh } :
                            {});
            }
            return sourceData;
        }
        else if (!model.parent()) {
            return { name: model.dataName(data$1.SOURCE) };
        }
        return undefined;
    }
    source.parseUnit = parse;
    function parseFacet(model) {
        var sourceData = parse(model);
        if (!model.child().component.data.source) {
            model.child().renameData(model.child().dataName(data$1.SOURCE), model.dataName(data$1.SOURCE));
        }
        return sourceData;
    }
    source.parseFacet = parseFacet;
    function parseLayer(model) {
        var sourceData = parse(model);
        model.children().forEach(function (child) {
            var childData = child.component.data;
            if (model.compatibleSource(child)) {
                var canMerge = !childData.filter && !childData.formatParse && !childData.nullFilter;
                if (canMerge) {
                    child.renameData(child.dataName(data$1.SOURCE), model.dataName(data$1.SOURCE));
                    delete childData.source;
                }
                else {
                    childData.source = {
                        name: child.dataName(data$1.SOURCE),
                        source: model.dataName(data$1.SOURCE)
                    };
                }
            }
        });
        return sourceData;
    }
    source.parseLayer = parseLayer;
    function assemble(model, component) {
        if (component.source) {
            var sourceData = component.source;
            if (component.formatParse) {
                component.source.format = component.source.format || {};
                component.source.format.parse = component.formatParse;
            }
            sourceData.transform = [].concat(formula_1.formula.assemble(component), nullfilter.nullFilter.assemble(component), filter_2.filter.assemble(component), bin_2.bin.assemble(component), timeunit$1.timeUnit.assemble(component));
            return sourceData;
        }
        return null;
    }
    source.assemble = assemble;
})(source = exports.source || (exports.source = {}));
});
var source_2 = source_1.source;

var formatparse = createCommonjsModule(function (module, exports) {
var formatParse;
(function (formatParse) {
    function parse(model) {
        var calcFieldMap = (model.calculate() || []).reduce(function (fieldMap, formula) {
            fieldMap[formula.field] = true;
            return fieldMap;
        }, {});
        var parseComponent = {};
        var filter = model.filter();
        if (!util$3.isArray(filter)) {
            filter = [filter];
        }
        filter.forEach(function (f) {
            var val = null;
            if (filter$1.isEqualFilter(f)) {
                val = f.equal;
            }
            else if (filter$1.isRangeFilter(f)) {
                val = f.range[0];
            }
            else if (filter$1.isOneOfFilter(f)) {
                val = (f.oneOf || f['in'])[0];
            }
            if (!!val) {
                if (datetime.isDateTime(val)) {
                    parseComponent[f['field']] = 'date';
                }
                else if (util$3.isNumber(val)) {
                    parseComponent[f['field']] = 'number';
                }
                else if (util$3.isString(val)) {
                    parseComponent[f['field']] = 'string';
                }
            }
        });
        model.forEach(function (fieldDef) {
            if (fieldDef.type === type.TEMPORAL) {
                parseComponent[fieldDef.field] = 'date';
            }
            else if (fieldDef.type === type.QUANTITATIVE) {
                if (fielddef.isCount(fieldDef) || calcFieldMap[fieldDef.field]) {
                    return;
                }
                parseComponent[fieldDef.field] = 'number';
            }
        });
        var data = model.data();
        if (data && data.format && data.format.parse) {
            var parse_1 = data.format.parse;
            util$3.keys(parse_1).forEach(function (field) {
                parseComponent[field] = parse_1[field];
            });
        }
        return parseComponent;
    }
    formatParse.parseUnit = parse;
    function parseFacet(model) {
        var parseComponent = parse(model);
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source && childDataComponent.formatParse) {
            util$3.extend(parseComponent, childDataComponent.formatParse);
            delete childDataComponent.formatParse;
        }
        return parseComponent;
    }
    formatParse.parseFacet = parseFacet;
    function parseLayer(model) {
        var parseComponent = parse(model);
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (model.compatibleSource(child) && !util$3.differ(childDataComponent.formatParse, parseComponent)) {
                util$3.extend(parseComponent, childDataComponent.formatParse);
                delete childDataComponent.formatParse;
            }
        });
        return parseComponent;
    }
    formatParse.parseLayer = parseLayer;
})(formatParse = exports.formatParse || (exports.formatParse = {}));
});
var formatparse_1 = formatparse.formatParse;

var nonpositivenullfilter = createCommonjsModule(function (module, exports) {
var nonPositiveFilter;
(function (nonPositiveFilter_1) {
    function parseUnit(model) {
        return model.channels().reduce(function (nonPositiveComponent, channel) {
            var scale = model.scale(channel);
            if (!model.field(channel) || !scale) {
                return nonPositiveComponent;
            }
            nonPositiveComponent[model.field(channel)] = scale.type === scale$3.ScaleType.LOG;
            return nonPositiveComponent;
        }, {});
    }
    nonPositiveFilter_1.parseUnit = parseUnit;
    function parseFacet(model) {
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source) {
            var nonPositiveFilterComponent = childDataComponent.nonPositiveFilter;
            delete childDataComponent.nonPositiveFilter;
            return nonPositiveFilterComponent;
        }
        return {};
    }
    nonPositiveFilter_1.parseFacet = parseFacet;
    function parseLayer(model) {
        var nonPositiveFilter = {};
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (model.compatibleSource(child) && !util$3.differ(childDataComponent.nonPositiveFilter, nonPositiveFilter)) {
                util$3.extend(nonPositiveFilter, childDataComponent.nonPositiveFilter);
                delete childDataComponent.nonPositiveFilter;
            }
        });
        return nonPositiveFilter;
    }
    nonPositiveFilter_1.parseLayer = parseLayer;
    function assemble(component) {
        return util$3.keys(component.nonPositiveFilter).filter(function (field) {
            return component.nonPositiveFilter[field];
        }).map(function (field) {
            return {
                type: 'filter',
                test: 'datum["' + field + '"] > 0'
            };
        });
    }
    nonPositiveFilter_1.assemble = assemble;
})(nonPositiveFilter = exports.nonPositiveFilter || (exports.nonPositiveFilter = {}));
});
var nonpositivenullfilter_1 = nonpositivenullfilter.nonPositiveFilter;

var summary_1 = createCommonjsModule(function (module, exports) {
var summary;
(function (summary) {
    function addDimension(dims, fieldDef) {
        if (fieldDef.bin) {
            dims[fielddef.field(fieldDef, { binSuffix: 'start' })] = true;
            dims[fielddef.field(fieldDef, { binSuffix: 'mid' })] = true;
            dims[fielddef.field(fieldDef, { binSuffix: 'end' })] = true;
            dims[fielddef.field(fieldDef, { binSuffix: 'range' })] = true;
        }
        else {
            dims[fielddef.field(fieldDef)] = true;
        }
        return dims;
    }
    function parseUnit(model) {
        var dims = {};
        var meas = {};
        model.forEach(function (fieldDef, channel) {
            if (fieldDef.aggregate) {
                if (fieldDef.aggregate === aggregate.AggregateOp.COUNT) {
                    meas['*'] = meas['*'] || {};
                    meas['*']['count'] = true;
                }
                else {
                    meas[fieldDef.field] = meas[fieldDef.field] || {};
                    meas[fieldDef.field][fieldDef.aggregate] = true;
                }
            }
            else {
                addDimension(dims, fieldDef);
            }
        });
        return [{
                name: model.dataName(data$1.SUMMARY),
                dimensions: dims,
                measures: meas
            }];
    }
    summary.parseUnit = parseUnit;
    function parseFacet(model) {
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source && childDataComponent.summary) {
            var summaryComponents = childDataComponent.summary.map(function (summaryComponent) {
                summaryComponent.dimensions = model.reduce(addDimension, summaryComponent.dimensions);
                var summaryNameWithoutPrefix = summaryComponent.name.substr(model.child().name('').length);
                model.child().renameData(summaryComponent.name, summaryNameWithoutPrefix);
                summaryComponent.name = summaryNameWithoutPrefix;
                return summaryComponent;
            });
            delete childDataComponent.summary;
            return summaryComponents;
        }
        return [];
    }
    summary.parseFacet = parseFacet;
    function mergeMeasures(parentMeasures, childMeasures) {
        for (var field_1 in childMeasures) {
            if (childMeasures.hasOwnProperty(field_1)) {
                var ops = childMeasures[field_1];
                for (var op in ops) {
                    if (ops.hasOwnProperty(op)) {
                        if (field_1 in parentMeasures) {
                            parentMeasures[field_1][op] = true;
                        }
                        else {
                            parentMeasures[field_1] = { op: true };
                        }
                    }
                }
            }
        }
    }
    function parseLayer(model) {
        var summaries = {};
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (!childDataComponent.source && childDataComponent.summary) {
                childDataComponent.summary.forEach(function (childSummary) {
                    var key = util$3.hash(childSummary.dimensions);
                    if (key in summaries) {
                        mergeMeasures(summaries[key].measures, childSummary.measures);
                    }
                    else {
                        childSummary.name = model.dataName(data$1.SUMMARY) + '_' + util$3.keys(summaries).length;
                        summaries[key] = childSummary;
                    }
                    child.renameData(child.dataName(data$1.SUMMARY), summaries[key].name);
                    delete childDataComponent.summary;
                });
            }
        });
        return util$3.vals(summaries);
    }
    summary.parseLayer = parseLayer;
    function assemble(component, model) {
        if (!component.summary) {
            return [];
        }
        return component.summary.reduce(function (summaryData, summaryComponent) {
            var dims = summaryComponent.dimensions;
            var meas = summaryComponent.measures;
            var groupby = util$3.keys(dims);
            var summarize = util$3.reduce(meas, function (aggregator, fnDictSet, field) {
                aggregator[field] = util$3.keys(fnDictSet);
                return aggregator;
            }, {});
            if (util$3.keys(meas).length > 0) {
                summaryData.push({
                    name: summaryComponent.name,
                    source: model.dataName(data$1.SOURCE),
                    transform: [{
                            type: 'aggregate',
                            groupby: groupby,
                            summarize: summarize
                        }]
                });
            }
            return summaryData;
        }, []);
    }
    summary.assemble = assemble;
})(summary = exports.summary || (exports.summary = {}));
});
var summary_2 = summary_1.summary;

var stackscale = createCommonjsModule(function (module, exports) {
var stackScale;
(function (stackScale) {
    function parseUnit(model) {
        var stackProps = model.stack();
        if (stackProps) {
            var groupbyChannel = stackProps.groupbyChannel;
            var fieldChannel = stackProps.fieldChannel;
            var fields = [];
            var field_1 = model.field(groupbyChannel);
            if (field_1) {
                fields.push(field_1);
            }
            return {
                name: model.dataName(data$1.STACKED_SCALE),
                source: model.dataName(data$1.SUMMARY),
                transform: [util$3.extend({
                        type: 'aggregate',
                        summarize: [{ ops: ['sum'], field: model.field(fieldChannel) }]
                    }, fields.length > 0 ? {
                        groupby: fields
                    } : {})]
            };
        }
        return null;
    }
    stackScale.parseUnit = parseUnit;
    function parseFacet(model) {
        var child = model.child();
        var childDataComponent = child.component.data;
        if (!childDataComponent.source && childDataComponent.stackScale) {
            var stackComponent = childDataComponent.stackScale;
            var newName = model.dataName(data$1.STACKED_SCALE);
            child.renameData(stackComponent.name, newName);
            stackComponent.name = newName;
            stackComponent.source = model.dataName(data$1.SUMMARY);
            stackComponent.transform[0].groupby = model.reduce(function (groupby, fieldDef) {
                groupby.push(fielddef.field(fieldDef));
                return groupby;
            }, stackComponent.transform[0].groupby);
            delete childDataComponent.stackScale;
            return stackComponent;
        }
        return null;
    }
    stackScale.parseFacet = parseFacet;
    function parseLayer(model) {
        return null;
    }
    stackScale.parseLayer = parseLayer;
    function assemble(component) {
        return component.stackScale;
    }
    stackScale.assemble = assemble;
})(stackScale = exports.stackScale || (exports.stackScale = {}));
});
var stackscale_1 = stackscale.stackScale;

var timeunitdomain = createCommonjsModule(function (module, exports) {
var timeUnitDomain;
(function (timeUnitDomain) {
    function parse(model) {
        return model.reduce(function (timeUnitDomainMap, fieldDef, channel) {
            if (fieldDef.timeUnit) {
                var domain = timeunit.imputedDomain(fieldDef.timeUnit, channel);
                if (domain) {
                    timeUnitDomainMap[fieldDef.timeUnit] = true;
                }
            }
            return timeUnitDomainMap;
        }, {});
    }
    timeUnitDomain.parseUnit = parse;
    function parseFacet(model) {
        return util$3.extend(parse(model), model.child().component.data.timeUnitDomain);
    }
    timeUnitDomain.parseFacet = parseFacet;
    function parseLayer(model) {
        return util$3.extend(parse(model), model.children().forEach(function (child) {
            return child.component.data.timeUnitDomain;
        }));
    }
    timeUnitDomain.parseLayer = parseLayer;
    function assemble(component) {
        return util$3.keys(component.timeUnitDomain).reduce(function (timeUnitData, tu) {
            var timeUnit = tu;
            var domain = timeunit.imputedDomain(timeUnit, null);
            if (domain) {
                var datetime$$1 = {};
                datetime$$1[timeUnit] = 'datum["data"]';
                timeUnitData.push({
                    name: timeUnit,
                    values: domain,
                    transform: [{
                            type: 'formula',
                            field: 'date',
                            expr: datetime.dateTimeExpr(datetime$$1)
                        }]
                });
            }
            return timeUnitData;
        }, []);
    }
    timeUnitDomain.assemble = assemble;
})(timeUnitDomain = exports.timeUnitDomain || (exports.timeUnitDomain = {}));
});
var timeunitdomain_1 = timeunitdomain.timeUnitDomain;

var colorrank = createCommonjsModule(function (module, exports) {
var colorRank;
(function (colorRank) {
    function parseUnit(model) {
        var colorRankComponent = {};
        if (model.has(channel.COLOR) && model.encoding().color.type === type.ORDINAL) {
            colorRankComponent[model.field(channel.COLOR)] = [{
                    type: 'sort',
                    by: model.field(channel.COLOR)
                }, {
                    type: 'rank',
                    field: model.field(channel.COLOR),
                    output: {
                        rank: model.field(channel.COLOR, { prefix: 'rank' })
                    }
                }];
        }
        return colorRankComponent;
    }
    colorRank.parseUnit = parseUnit;
    function parseFacet(model) {
        var childDataComponent = model.child().component.data;
        if (!childDataComponent.source) {
            var colorRankComponent = childDataComponent.colorRank;
            delete childDataComponent.colorRank;
            return colorRankComponent;
        }
        return {};
    }
    colorRank.parseFacet = parseFacet;
    function parseLayer(model) {
        var colorRankComponent = {};
        model.children().forEach(function (child) {
            var childDataComponent = child.component.data;
            if (!childDataComponent.source) {
                util$3.extend(colorRankComponent, childDataComponent.colorRank);
                delete childDataComponent.colorRank;
            }
        });
        return colorRankComponent;
    }
    colorRank.parseLayer = parseLayer;
    function assemble(component) {
        return util$3.flatten(util$3.vals(component.colorRank));
    }
    colorRank.assemble = assemble;
})(colorRank = exports.colorRank || (exports.colorRank = {}));
});
var colorrank_1 = colorrank.colorRank;

function parseUnitData(model) {
    return {
        formatParse: formatparse.formatParse.parseUnit(model),
        nullFilter: nullfilter.nullFilter.parseUnit(model),
        filter: filter_2.filter.parseUnit(model),
        nonPositiveFilter: nonpositivenullfilter.nonPositiveFilter.parseUnit(model),
        source: source_1.source.parseUnit(model),
        bin: bin_2.bin.parseUnit(model),
        calculate: formula_1.formula.parseUnit(model),
        timeUnit: timeunit$1.timeUnit.parseUnit(model),
        timeUnitDomain: timeunitdomain.timeUnitDomain.parseUnit(model),
        summary: summary_1.summary.parseUnit(model),
        stackScale: stackscale.stackScale.parseUnit(model),
        colorRank: colorrank.colorRank.parseUnit(model)
    };
}
var parseUnitData_1 = parseUnitData;
function parseFacetData(model) {
    return {
        formatParse: formatparse.formatParse.parseFacet(model),
        nullFilter: nullfilter.nullFilter.parseFacet(model),
        filter: filter_2.filter.parseFacet(model),
        nonPositiveFilter: nonpositivenullfilter.nonPositiveFilter.parseFacet(model),
        source: source_1.source.parseFacet(model),
        bin: bin_2.bin.parseFacet(model),
        calculate: formula_1.formula.parseFacet(model),
        timeUnit: timeunit$1.timeUnit.parseFacet(model),
        timeUnitDomain: timeunitdomain.timeUnitDomain.parseFacet(model),
        summary: summary_1.summary.parseFacet(model),
        stackScale: stackscale.stackScale.parseFacet(model),
        colorRank: colorrank.colorRank.parseFacet(model)
    };
}
var parseFacetData_1 = parseFacetData;
function parseLayerData(model) {
    return {
        filter: filter_2.filter.parseLayer(model),
        formatParse: formatparse.formatParse.parseLayer(model),
        nullFilter: nullfilter.nullFilter.parseLayer(model),
        nonPositiveFilter: nonpositivenullfilter.nonPositiveFilter.parseLayer(model),
        source: source_1.source.parseLayer(model),
        bin: bin_2.bin.parseLayer(model),
        calculate: formula_1.formula.parseLayer(model),
        timeUnit: timeunit$1.timeUnit.parseLayer(model),
        timeUnitDomain: timeunitdomain.timeUnitDomain.parseLayer(model),
        summary: summary_1.summary.parseLayer(model),
        stackScale: stackscale.stackScale.parseLayer(model),
        colorRank: colorrank.colorRank.parseLayer(model)
    };
}
var parseLayerData_1 = parseLayerData;
function assembleData(model, data) {
    var component = model.component.data;
    var sourceData = source_1.source.assemble(model, component);
    if (sourceData) {
        data.push(sourceData);
    }
    summary_1.summary.assemble(component, model).forEach(function (summaryData) {
        data.push(summaryData);
    });
    if (data.length > 0) {
        var dataTable = data[data.length - 1];
        var colorRankTransform = colorrank.colorRank.assemble(component);
        if (colorRankTransform.length > 0) {
            dataTable.transform = (dataTable.transform || []).concat(colorRankTransform);
        }
        var nonPositiveFilterTransform = nonpositivenullfilter.nonPositiveFilter.assemble(component);
        if (nonPositiveFilterTransform.length > 0) {
            dataTable.transform = (dataTable.transform || []).concat(nonPositiveFilterTransform);
        }
    }
    else {
        if (util$3.keys(component.colorRank).length > 0) {
            throw new Error('Invalid colorRank not merged');
        }
        else if (util$3.keys(component.nonPositiveFilter).length > 0) {
            throw new Error('Invalid nonPositiveFilter not merged');
        }
    }
    var stackData = stackscale.stackScale.assemble(component);
    if (stackData) {
        data.push(stackData);
    }
    timeunitdomain.timeUnitDomain.assemble(component).forEach(function (timeUnitDomainData) {
        data.push(timeUnitDomainData);
    });
    return data;
}
var assembleData_1 = assembleData;
var data$2 = {
	parseUnitData: parseUnitData_1,
	parseFacetData: parseFacetData_1,
	parseLayerData: parseLayerData_1,
	assembleData: assembleData_1
};

function assembleLayout(model, layoutData) {
    var layoutComponent = model.component.layout;
    if (!layoutComponent.width && !layoutComponent.height) {
        return layoutData;
    }
    {
        var distinctFields = util$3.keys(util$3.extend(layoutComponent.width.distinct, layoutComponent.height.distinct));
        var formula = layoutComponent.width.formula.concat(layoutComponent.height.formula)
            .map(function (formula) {
            return util$3.extend({ type: 'formula' }, formula);
        });
        return [
            distinctFields.length > 0 ? {
                name: model.dataName(data$1.LAYOUT),
                source: model.dataTable(),
                transform: [{
                        type: 'aggregate',
                        summarize: distinctFields.map(function (field) {
                            return { field: field, ops: ['distinct'] };
                        })
                    }].concat(formula)
            } : {
                name: model.dataName(data$1.LAYOUT),
                values: [{}],
                transform: formula
            }
        ];
    }
}
var assembleLayout_1 = assembleLayout;
function parseUnitLayout(model) {
    return {
        width: parseUnitSizeLayout(model, channel.X),
        height: parseUnitSizeLayout(model, channel.Y)
    };
}
var parseUnitLayout_1 = parseUnitLayout;
function parseUnitSizeLayout(model, channel$$1) {
    return {
        distinct: getDistinct(model, channel$$1),
        formula: [{
                field: model.channelSizeName(channel$$1),
                expr: unitSizeExpr(model, channel$$1)
            }]
    };
}
function unitSizeExpr(model, channel$$1) {
    var scale = model.scale(channel$$1);
    if (scale) {
        if (scale.type === scale$3.ScaleType.ORDINAL && scale.bandSize !== scale$3.BANDSIZE_FIT) {
            return '(' + cardinalityExpr(model, channel$$1) +
                ' + ' + 1 +
                ') * ' + scale.bandSize;
        }
    }
    return (channel$$1 === channel.X ? model.width : model.height) + '';
}
var unitSizeExpr_1 = unitSizeExpr;
function parseFacetLayout(model) {
    return {
        width: parseFacetSizeLayout(model, channel.COLUMN),
        height: parseFacetSizeLayout(model, channel.ROW)
    };
}
var parseFacetLayout_1 = parseFacetLayout;
function parseFacetSizeLayout(model, channel$$1) {
    var childLayoutComponent = model.child().component.layout;
    var sizeType = channel$$1 === channel.ROW ? 'height' : 'width';
    var childSizeComponent = childLayoutComponent[sizeType];
    {
        var distinct = util$3.extend(getDistinct(model, channel$$1), childSizeComponent.distinct);
        var formula = childSizeComponent.formula.concat([{
                field: model.channelSizeName(channel$$1),
                expr: facetSizeFormula(model, channel$$1, model.child().channelSizeName(channel$$1))
            }]);
        delete childLayoutComponent[sizeType];
        return {
            distinct: distinct,
            formula: formula
        };
    }
}
function facetSizeFormula(model, channel$$1, innerSize) {
    var scale = model.scale(channel$$1);
    if (model.has(channel$$1)) {
        return '(datum["' + innerSize + '"] + ' + scale.padding + ')' + ' * ' + cardinalityExpr(model, channel$$1);
    }
    else {
        return 'datum["' + innerSize + '"] + ' + model.config().facet.scale.padding;
    }
}
function parseLayerLayout(model) {
    return {
        width: parseLayerSizeLayout(model, channel.X),
        height: parseLayerSizeLayout(model, channel.Y)
    };
}
var parseLayerLayout_1 = parseLayerLayout;
function parseLayerSizeLayout(model, channel$$1) {
    {
        var childLayoutComponent = model.children()[0].component.layout;
        var sizeType_1 = channel$$1 === channel.Y ? 'height' : 'width';
        var childSizeComponent = childLayoutComponent[sizeType_1];
        var distinct = childSizeComponent.distinct;
        var formula = [{
                field: model.channelSizeName(channel$$1),
                expr: childSizeComponent.formula[0].expr
            }];
        model.children().forEach(function (child) {
            delete child.component.layout[sizeType_1];
        });
        return {
            distinct: distinct,
            formula: formula
        };
    }
}
function getDistinct(model, channel$$1) {
    if (model.has(channel$$1) && model.isOrdinalScale(channel$$1)) {
        var scale = model.scale(channel$$1);
        if (scale.type === scale$3.ScaleType.ORDINAL && !(scale.domain instanceof Array)) {
            var distinctField = model.field(channel$$1);
            var distinct = {};
            distinct[distinctField] = true;
            return distinct;
        }
    }
    return {};
}
function cardinalityExpr(model, channel$$1) {
    var scale = model.scale(channel$$1);
    if (scale.domain instanceof Array) {
        return scale.domain.length;
    }
    var timeUnit = model.fieldDef(channel$$1).timeUnit;
    var timeUnitDomain = timeUnit ? timeunit.imputedDomain(timeUnit, channel$$1) : null;
    return timeUnitDomain !== null ? timeUnitDomain.length :
        model.field(channel$$1, { datum: true, prefix: 'distinct' });
}
var cardinalityExpr_1 = cardinalityExpr;
var layout = {
	assembleLayout: assembleLayout_1,
	parseUnitLayout: parseUnitLayout_1,
	unitSizeExpr: unitSizeExpr_1,
	parseFacetLayout: parseFacetLayout_1,
	parseLayerLayout: parseLayerLayout_1,
	cardinalityExpr: cardinalityExpr_1
};

var scale$4 = createCommonjsModule(function (module, exports) {
exports.COLOR_LEGEND = 'color_legend';
exports.COLOR_LEGEND_LABEL = 'color_legend_label';
function parseScaleComponent(model) {
    return model.channels().reduce(function (scale, channel$$1) {
        if (model.scale(channel$$1)) {
            var fieldDef = model.fieldDef(channel$$1);
            var scales = {
                main: parseMainScale(model, fieldDef, channel$$1)
            };
            if (channel$$1 === channel.COLOR && model.legend(channel.COLOR) && (fieldDef.type === type.ORDINAL || fieldDef.bin || fieldDef.timeUnit)) {
                scales.colorLegend = parseColorLegendScale(model, fieldDef);
                if (fieldDef.bin) {
                    scales.binColorLegend = parseBinColorLegendLabel(model, fieldDef);
                }
            }
            scale[channel$$1] = scales;
        }
        return scale;
    }, {});
}
exports.parseScaleComponent = parseScaleComponent;
function parseMainScale(model, fieldDef, channel$$1) {
    var scale = model.scale(channel$$1);
    var sort$$1 = model.sort(channel$$1);
    var scaleDef = {
        name: model.scaleName(channel$$1 + '', true),
        type: scale.type,
    };
    if (channel$$1 === channel.X && model.has(channel.X2)) {
        if (model.has(channel.X)) {
            scaleDef.domain = { fields: [domain(scale, model, channel.X), domain(scale, model, channel.X2)] };
        }
        else {
            scaleDef.domain = domain(scale, model, channel.X2);
        }
    }
    else if (channel$$1 === channel.Y && model.has(channel.Y2)) {
        if (model.has(channel.Y)) {
            scaleDef.domain = { fields: [domain(scale, model, channel.Y), domain(scale, model, channel.Y2)] };
        }
        else {
            scaleDef.domain = domain(scale, model, channel.Y2);
        }
    }
    else {
        scaleDef.domain = domain(scale, model, channel$$1);
    }
    util$3.extend(scaleDef, rangeMixins(scale, model, channel$$1));
    if (sort$$1 && (sort.isSortField(sort$$1) ? sort$$1.order : sort$$1) === sort.SortOrder.DESCENDING) {
        scaleDef.reverse = true;
    }
    [
        'round',
        'clamp', 'nice',
        'exponent', 'zero',
        'points',
        'padding'
    ].forEach(function (property) {
        var value = exports[property](scale, channel$$1, fieldDef, model, scaleDef);
        if (value !== undefined) {
            scaleDef[property] = value;
        }
    });
    return scaleDef;
}
function parseColorLegendScale(model, fieldDef) {
    return {
        name: model.scaleName(exports.COLOR_LEGEND, true),
        type: scale$3.ScaleType.ORDINAL,
        domain: {
            data: model.dataTable(),
            field: model.field(channel.COLOR, (fieldDef.bin || fieldDef.timeUnit) ? {} : { prefix: 'rank' }),
            sort: true
        },
        range: { data: model.dataTable(), field: model.field(channel.COLOR), sort: true }
    };
}
function parseBinColorLegendLabel(model, fieldDef) {
    return {
        name: model.scaleName(exports.COLOR_LEGEND_LABEL, true),
        type: scale$3.ScaleType.ORDINAL,
        domain: {
            data: model.dataTable(),
            field: model.field(channel.COLOR),
            sort: true
        },
        range: {
            data: model.dataTable(),
            field: fielddef.field(fieldDef, { binSuffix: 'range' }),
            sort: {
                field: model.field(channel.COLOR, { binSuffix: 'start' }),
                op: 'min'
            }
        }
    };
}
function scaleType(scale, fieldDef, channel$$1, mark) {
    if (!channel.hasScale(channel$$1)) {
        return null;
    }
    if (util$3.contains([channel.ROW, channel.COLUMN, channel.SHAPE], channel$$1)) {
        if (scale && scale.type !== undefined && scale.type !== scale$3.ScaleType.ORDINAL) {
            console.warn('Channel', channel$$1, 'does not work with scale type =', scale.type);
        }
        return scale$3.ScaleType.ORDINAL;
    }
    if (scale.type !== undefined) {
        return scale.type;
    }
    switch (fieldDef.type) {
        case type.NOMINAL:
            return scale$3.ScaleType.ORDINAL;
        case type.ORDINAL:
            if (channel$$1 === channel.COLOR) {
                return scale$3.ScaleType.LINEAR;
            }
            return scale$3.ScaleType.ORDINAL;
        case type.TEMPORAL:
            if (channel$$1 === channel.COLOR) {
                return scale$3.ScaleType.TIME;
            }
            if (fieldDef.timeUnit) {
                return timeunit.defaultScaleType(fieldDef.timeUnit);
            }
            return scale$3.ScaleType.TIME;
        case type.QUANTITATIVE:
            if (fieldDef.bin) {
                return util$3.contains([channel.X, channel.Y, channel.COLOR], channel$$1) ? scale$3.ScaleType.LINEAR : scale$3.ScaleType.ORDINAL;
            }
            return scale$3.ScaleType.LINEAR;
    }
    return null;
}
exports.scaleType = scaleType;
function scaleBandSize(scaleType, bandSize, scaleConfig, topLevelSize, mark, channel$$1) {
    if (scaleType === scale$3.ScaleType.ORDINAL) {
        if (topLevelSize === undefined) {
            if (bandSize) {
                return bandSize;
            }
            else if (channel$$1 === channel.X && mark === mark$1.TEXT) {
                return scaleConfig.textBandWidth;
            }
            else {
                return scaleConfig.bandSize;
            }
        }
        else {
            if (bandSize) {
                console.warn('bandSize for', channel$$1, 'overridden as top-level', channel$$1 === channel.X ? 'width' : 'height', 'is provided.');
            }
            return scale$3.BANDSIZE_FIT;
        }
    }
    else {
        return undefined;
    }
}
exports.scaleBandSize = scaleBandSize;
function domain(scale, model, channel$$1) {
    var fieldDef = model.fieldDef(channel$$1);
    if (scale.domain) {
        if (datetime.isDateTime(scale.domain[0])) {
            return scale.domain.map(function (dt) {
                return datetime.timestamp(dt, true);
            });
        }
        return scale.domain;
    }
    if (fieldDef.type === type.TEMPORAL) {
        if (timeunit.imputedDomain(fieldDef.timeUnit, channel$$1)) {
            return {
                data: fieldDef.timeUnit,
                field: 'date'
            };
        }
        return {
            data: model.dataTable(),
            field: model.field(channel$$1),
            sort: {
                field: model.field(channel$$1),
                op: 'min'
            }
        };
    }
    var stack = model.stack();
    if (stack && channel$$1 === stack.fieldChannel) {
        if (stack.offset === stack_1.StackOffset.NORMALIZE) {
            return [0, 1];
        }
        return {
            data: model.dataName(data$1.STACKED_SCALE),
            field: model.field(channel$$1, { prefix: 'sum' })
        };
    }
    var useRawDomain = _useRawDomain(scale, model, channel$$1), sort$$1 = domainSort(model, channel$$1, scale.type);
    if (useRawDomain) {
        return {
            data: data$1.SOURCE,
            field: model.field(channel$$1, { noAggregate: true })
        };
    }
    else if (fieldDef.bin) {
        if (scale.type === scale$3.ScaleType.ORDINAL) {
            return {
                data: model.dataTable(),
                field: model.field(channel$$1, { binSuffix: 'range' }),
                sort: {
                    field: model.field(channel$$1, { binSuffix: 'start' }),
                    op: 'min'
                }
            };
        }
        else if (channel$$1 === channel.COLOR) {
            return {
                data: model.dataTable(),
                field: model.field(channel$$1, { binSuffix: 'start' })
            };
        }
        else {
            return {
                data: model.dataTable(),
                field: [
                    model.field(channel$$1, { binSuffix: 'start' }),
                    model.field(channel$$1, { binSuffix: 'end' })
                ]
            };
        }
    }
    else if (sort$$1) {
        return {
            data: sort$$1.op ? data$1.SOURCE : model.dataTable(),
            field: (fieldDef.type === type.ORDINAL && channel$$1 === channel.COLOR) ? model.field(channel$$1, { prefix: 'rank' }) : model.field(channel$$1),
            sort: sort$$1
        };
    }
    else {
        return {
            data: model.dataTable(),
            field: (fieldDef.type === type.ORDINAL && channel$$1 === channel.COLOR) ? model.field(channel$$1, { prefix: 'rank' }) : model.field(channel$$1),
        };
    }
}
exports.domain = domain;
function domainSort(model, channel$$1, scaleType) {
    if (scaleType !== scale$3.ScaleType.ORDINAL) {
        return undefined;
    }
    var sort$$1 = model.sort(channel$$1);
    if (sort.isSortField(sort$$1)) {
        return {
            op: sort$$1.op,
            field: sort$$1.field
        };
    }
    if (util$3.contains([sort.SortOrder.ASCENDING, sort.SortOrder.DESCENDING, undefined], sort$$1)) {
        return true;
    }
    return undefined;
}
exports.domainSort = domainSort;
function _useRawDomain(scale, model, channel$$1) {
    var fieldDef = model.fieldDef(channel$$1);
    return scale.useRawDomain &&
        fieldDef.aggregate &&
        aggregate.SHARED_DOMAIN_OPS.indexOf(fieldDef.aggregate) >= 0 &&
        ((fieldDef.type === type.QUANTITATIVE && !fieldDef.bin && scale.type !== scale$3.ScaleType.LOG) ||
            (fieldDef.type === type.TEMPORAL && util$3.contains([scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], scale.type)));
}
function rangeMixins(scale, model, channel$$1) {
    var fieldDef = model.fieldDef(channel$$1);
    var scaleConfig = model.config().scale;
    if (scale.type === scale$3.ScaleType.ORDINAL && scale.bandSize && scale.bandSize !== scale$3.BANDSIZE_FIT && util$3.contains([channel.X, channel.Y], channel$$1)) {
        return { bandSize: scale.bandSize };
    }
    if (scale.range && !util$3.contains([channel.X, channel.Y, channel.ROW, channel.COLUMN], channel$$1)) {
        return { range: scale.range };
    }
    switch (channel$$1) {
        case channel.ROW:
            return { range: 'height' };
        case channel.COLUMN:
            return { range: 'width' };
    }
    var unitModel = model;
    switch (channel$$1) {
        case channel.X:
            return {
                rangeMin: 0,
                rangeMax: unitModel.width
            };
        case channel.Y:
            return {
                rangeMin: unitModel.height,
                rangeMax: 0
            };
        case channel.SIZE:
            if (unitModel.mark() === mark$1.BAR) {
                if (scaleConfig.barSizeRange !== undefined) {
                    return { range: scaleConfig.barSizeRange };
                }
                var dimension = model.config().mark.orient === config$2.Orient.HORIZONTAL ? channel.Y : channel.X;
                return { range: [model.config().mark.barThinSize, model.scale(dimension).bandSize] };
            }
            else if (unitModel.mark() === mark$1.TEXT) {
                return { range: scaleConfig.fontSizeRange };
            }
            else if (unitModel.mark() === mark$1.RULE) {
                return { range: scaleConfig.ruleSizeRange };
            }
            else if (unitModel.mark() === mark$1.TICK) {
                return { range: scaleConfig.tickSizeRange };
            }
            if (scaleConfig.pointSizeRange !== undefined) {
                return { range: scaleConfig.pointSizeRange };
            }
            var bandSize = pointBandSize(unitModel);
            return { range: [9, (bandSize - 2) * (bandSize - 2)] };
        case channel.SHAPE:
            return { range: scaleConfig.shapeRange };
        case channel.COLOR:
            if (fieldDef.type === type.NOMINAL) {
                return { range: scaleConfig.nominalColorRange };
            }
            return { range: scaleConfig.sequentialColorRange };
        case channel.OPACITY:
            return { range: scaleConfig.opacity };
    }
    return {};
}
exports.rangeMixins = rangeMixins;
function pointBandSize(model) {
    var scaleConfig = model.config().scale;
    var hasX = model.has(channel.X);
    var hasY = model.has(channel.Y);
    var xIsMeasure = fielddef.isMeasure(model.encoding().x);
    var yIsMeasure = fielddef.isMeasure(model.encoding().y);
    if (hasX && hasY) {
        return xIsMeasure !== yIsMeasure ?
            model.scale(xIsMeasure ? channel.Y : channel.X).bandSize :
            Math.min(model.scale(channel.X).bandSize || scaleConfig.bandSize, model.scale(channel.Y).bandSize || scaleConfig.bandSize);
    }
    else if (hasY) {
        return yIsMeasure ? model.config().scale.bandSize : model.scale(channel.Y).bandSize;
    }
    else if (hasX) {
        return xIsMeasure ? model.config().scale.bandSize : model.scale(channel.X).bandSize;
    }
    return model.config().scale.bandSize;
}
function clamp(scale) {
    if (util$3.contains([scale$3.ScaleType.LINEAR, scale$3.ScaleType.POW, scale$3.ScaleType.SQRT,
        scale$3.ScaleType.LOG, scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], scale.type)) {
        return scale.clamp;
    }
    return undefined;
}
exports.clamp = clamp;
function exponent(scale) {
    if (scale.type === scale$3.ScaleType.POW) {
        return scale.exponent;
    }
    return undefined;
}
exports.exponent = exponent;
function nice(scale, channel$$1, fieldDef) {
    if (util$3.contains([scale$3.ScaleType.LINEAR, scale$3.ScaleType.POW, scale$3.ScaleType.SQRT, scale$3.ScaleType.LOG,
        scale$3.ScaleType.TIME, scale$3.ScaleType.UTC, scale$3.ScaleType.QUANTIZE], scale.type)) {
        if (scale.nice !== undefined) {
            return scale.nice;
        }
        if (util$3.contains([scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], scale.type)) {
            return timeunit.smallestUnit(fieldDef.timeUnit);
        }
        return util$3.contains([channel.X, channel.Y], channel$$1);
    }
    return undefined;
}
exports.nice = nice;
function padding(scale, channel$$1, __, ___, scaleDef) {
    if (scale.type === scale$3.ScaleType.ORDINAL && util$3.contains([channel.X, channel.Y], channel$$1)) {
        return scaleDef.points ? 1 : scale.padding;
    }
    return undefined;
}
exports.padding = padding;
function points(scale, channel$$1, __, model) {
    if (scale.type === scale$3.ScaleType.ORDINAL && util$3.contains([channel.X, channel.Y], channel$$1)) {
        return model.mark() === mark$1.BAR && scale.bandSize === scale$3.BANDSIZE_FIT ? undefined : true;
    }
    return undefined;
}
exports.points = points;
function round(scale, channel$$1) {
    if (util$3.contains([channel.X, channel.Y, channel.ROW, channel.COLUMN, channel.SIZE], channel$$1) && scale.round !== undefined) {
        return scale.round;
    }
    return undefined;
}
exports.round = round;
function zero(scale, channel$$1, fieldDef) {
    if (!util$3.contains([scale$3.ScaleType.TIME, scale$3.ScaleType.UTC, scale$3.ScaleType.ORDINAL], scale.type)) {
        if (scale.zero !== undefined) {
            return scale.zero;
        }
        return !scale.domain && !fieldDef.bin && util$3.contains([channel.X, channel.Y], channel$$1);
    }
    return undefined;
}
exports.zero = zero;
});
var scale_2$1 = scale$4.COLOR_LEGEND;
var scale_3$1 = scale$4.COLOR_LEGEND_LABEL;
var scale_4$1 = scale$4.parseScaleComponent;
var scale_5$1 = scale$4.scaleType;
var scale_6$1 = scale$4.scaleBandSize;
var scale_7 = scale$4.domain;
var scale_8 = scale$4.domainSort;
var scale_9 = scale$4.rangeMixins;
var scale_10 = scale$4.clamp;
var scale_11 = scale$4.exponent;
var scale_12 = scale$4.nice;
var scale_13 = scale$4.padding;
var scale_14 = scale$4.points;
var scale_15 = scale$4.round;
var scale_16 = scale$4.zero;

var NameMap = (function () {
    function NameMap() {
        this._nameMap = {};
    }
    NameMap.prototype.rename = function (oldName, newName) {
        this._nameMap[oldName] = newName;
    };
    NameMap.prototype.has = function (name) {
        return this._nameMap[name] !== undefined;
    };
    NameMap.prototype.get = function (name) {
        while (this._nameMap[name]) {
            name = this._nameMap[name];
        }
        return name;
    };
    return NameMap;
}());
var Model$1 = (function () {
    function Model(spec, parent, parentGivenName) {
        this._warnings = [];
        this._parent = parent;
        this._name = spec.name || parentGivenName;
        this._dataNameMap = parent ? parent._dataNameMap : new NameMap();
        this._scaleNameMap = parent ? parent._scaleNameMap : new NameMap();
        this._sizeNameMap = parent ? parent._sizeNameMap : new NameMap();
        this._data = spec.data;
        this._description = spec.description;
        this._transform = spec.transform;
        if (spec.transform) {
            if (spec.transform.filterInvalid === undefined &&
                spec.transform['filterNull'] !== undefined) {
                spec.transform.filterInvalid = spec.transform['filterNull'];
                console.warn('filterNull is deprecated. Please use filterInvalid instead.');
            }
        }
        this.component = { data: null, layout: null, mark: null, scale: null, axis: null, axisGroup: null, gridGroup: null, legend: null };
    }
    Model.prototype.parse = function () {
        this.parseData();
        this.parseSelectionData();
        this.parseLayoutData();
        this.parseScale();
        this.parseAxis();
        this.parseLegend();
        this.parseAxisGroup();
        this.parseGridGroup();
        this.parseMark();
    };
    Model.prototype.assembleScales = function () {
        return util$3.flatten(util$3.vals(this.component.scale).map(function (scales) {
            var arr = [scales.main];
            if (scales.colorLegend) {
                arr.push(scales.colorLegend);
            }
            if (scales.binColorLegend) {
                arr.push(scales.binColorLegend);
            }
            return arr;
        }));
    };
    Model.prototype.assembleAxes = function () {
        return util$3.vals(this.component.axis);
    };
    Model.prototype.assembleLegends = function () {
        return util$3.vals(this.component.legend);
    };
    Model.prototype.assembleGroup = function () {
        var group = {};
        group.marks = this.assembleMarks();
        var scales = this.assembleScales();
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
    Model.prototype.reduce = function (f, init, t) {
        return encoding.channelMappingReduce(this.channels(), this.mapping(), f, init, t);
    };
    Model.prototype.forEach = function (f, t) {
        encoding.channelMappingForEach(this.channels(), this.mapping(), f, t);
    };
    Model.prototype.parent = function () {
        return this._parent;
    };
    Model.prototype.name = function (text, delimiter) {
        if (delimiter === void 0) { delimiter = '_'; }
        return (this._name ? this._name + delimiter : '') + text;
    };
    Model.prototype.description = function () {
        return this._description;
    };
    Model.prototype.data = function () {
        return this._data;
    };
    Model.prototype.renameData = function (oldName, newName) {
        this._dataNameMap.rename(oldName, newName);
    };
    Model.prototype.dataName = function (dataSourceType) {
        return this._dataNameMap.get(this.name(String(dataSourceType)));
    };
    Model.prototype.renameSize = function (oldName, newName) {
        this._sizeNameMap.rename(oldName, newName);
    };
    Model.prototype.channelSizeName = function (channel$$1) {
        return this.sizeName(channel$$1 === channel.X || channel$$1 === channel.COLUMN ? 'width' : 'height');
    };
    Model.prototype.sizeName = function (size) {
        return this._sizeNameMap.get(this.name(size, '_'));
    };
    Model.prototype.calculate = function () {
        return this._transform ? this._transform.calculate : undefined;
    };
    Model.prototype.filterInvalid = function () {
        var transform = this._transform || {};
        if (transform.filterInvalid === undefined) {
            return this.parent() ? this.parent().filterInvalid() : undefined;
        }
        return transform.filterInvalid;
    };
    Model.prototype.filter = function () {
        return this._transform ? this._transform.filter : undefined;
    };
    Model.prototype.field = function (channel$$1, opt) {
        if (opt === void 0) { opt = {}; }
        var fieldDef = this.fieldDef(channel$$1);
        if (fieldDef.bin) {
            opt = util$3.extend({
                binSuffix: this.scale(channel$$1).type === scale$3.ScaleType.ORDINAL ? 'range' : 'start'
            }, opt);
        }
        return fielddef.field(fieldDef, opt);
    };
    Model.prototype.scale = function (channel$$1) {
        return this._scale[channel$$1];
    };
    Model.prototype.isOrdinalScale = function (channel$$1) {
        var scale = this.scale(channel$$1);
        return scale && scale.type === scale$3.ScaleType.ORDINAL;
    };
    Model.prototype.renameScale = function (oldName, newName) {
        this._scaleNameMap.rename(oldName, newName);
    };
    Model.prototype.scaleName = function (originalScaleName, parse) {
        var channel$$1 = util$3.contains([scale$4.COLOR_LEGEND, scale$4.COLOR_LEGEND_LABEL], originalScaleName) ? 'color' : originalScaleName;
        if (parse) {
            return this.name(originalScaleName + '');
        }
        if ((this._scale && this._scale[channel$$1]) ||
            this._scaleNameMap.has(this.name(originalScaleName + ''))) {
            return this._scaleNameMap.get(this.name(originalScaleName + ''));
        }
        return undefined;
    };
    Model.prototype.sort = function (channel$$1) {
        return (this.mapping()[channel$$1] || {}).sort;
    };
    Model.prototype.axis = function (channel$$1) {
        return this._axis[channel$$1];
    };
    Model.prototype.legend = function (channel$$1) {
        return this._legend[channel$$1];
    };
    Model.prototype.config = function () {
        return this._config;
    };
    Model.prototype.addWarning = function (message) {
        util$3.warning(message);
        this._warnings.push(message);
    };
    Model.prototype.warnings = function () {
        return this._warnings;
    };
    Model.prototype.isUnit = function () {
        return false;
    };
    Model.prototype.isFacet = function () {
        return false;
    };
    Model.prototype.isLayer = function () {
        return false;
    };
    return Model;
}());
var Model_1$1 = Model$1;
var model = {
	Model: Model_1$1
};

var __extends = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var FacetModel = (function (_super) {
    __extends(FacetModel, _super);
    function FacetModel(spec, parent, parentGivenName) {
        _super.call(this, spec, parent, parentGivenName);
        var config = this._config = this._initConfig(spec.config, parent);
        var child = this._child = common.buildModel(spec.spec, this, this.name('child'));
        var facet = this._facet = this._initFacet(spec.facet);
        this._scale = this._initScale(facet, config, child);
        this._axis = this._initAxis(facet, config, child);
    }
    FacetModel.prototype._initConfig = function (specConfig, parent) {
        return util$3.mergeDeep(util$3.duplicate(config$2.defaultConfig), parent ? parent.config() : {}, specConfig);
    };
    FacetModel.prototype._initFacet = function (facet) {
        facet = util$3.duplicate(facet);
        var model$$1 = this;
        encoding.channelMappingForEach(this.channels(), facet, function (fieldDef, channel$$1) {
            if (fieldDef.type) {
                fieldDef.type = type.getFullName(fieldDef.type);
            }
            if (!fielddef.isDimension(fieldDef)) {
                model$$1.addWarning(channel$$1 + ' encoding should be ordinal.');
            }
        });
        return facet;
    };
    FacetModel.prototype._initScale = function (facet, config, child) {
        return [channel.ROW, channel.COLUMN].reduce(function (_scale, channel$$1) {
            if (facet[channel$$1]) {
                var scaleSpec = facet[channel$$1].scale || {};
                _scale[channel$$1] = util$3.extend({
                    type: scale$3.ScaleType.ORDINAL,
                    round: config.facet.scale.round,
                    padding: (channel$$1 === channel.ROW && child.has(channel.Y)) || (channel$$1 === channel.COLUMN && child.has(channel.X)) ?
                        config.facet.scale.padding : 0
                }, scaleSpec);
            }
            return _scale;
        }, {});
    };
    FacetModel.prototype._initAxis = function (facet, config, child) {
        return [channel.ROW, channel.COLUMN].reduce(function (_axis, channel$$1) {
            if (facet[channel$$1]) {
                var axisSpec = facet[channel$$1].axis;
                if (axisSpec !== false) {
                    var modelAxis = _axis[channel$$1] = util$3.extend({}, config.facet.axis, axisSpec === true ? {} : axisSpec || {});
                    if (channel$$1 === channel.ROW) {
                        var yAxis = child.axis(channel.Y);
                        if (yAxis && yAxis.orient !== axis$1.AxisOrient.RIGHT && !modelAxis.orient) {
                            modelAxis.orient = axis$1.AxisOrient.RIGHT;
                        }
                        if (child.has(channel.X) && !modelAxis.labelAngle) {
                            modelAxis.labelAngle = modelAxis.orient === axis$1.AxisOrient.RIGHT ? 90 : 270;
                        }
                    }
                }
            }
            return _axis;
        }, {});
    };
    FacetModel.prototype.facet = function () {
        return this._facet;
    };
    FacetModel.prototype.has = function (channel$$1) {
        return !!this._facet[channel$$1];
    };
    FacetModel.prototype.child = function () {
        return this._child;
    };
    FacetModel.prototype.hasSummary = function () {
        var summary = this.component.data.summary;
        for (var i = 0; i < summary.length; i++) {
            if (util$3.keys(summary[i].measures).length > 0) {
                return true;
            }
        }
        return false;
    };
    FacetModel.prototype.dataTable = function () {
        return (this.hasSummary() ? data$1.SUMMARY : data$1.SOURCE) + '';
    };
    FacetModel.prototype.fieldDef = function (channel$$1) {
        return this.facet()[channel$$1];
    };
    FacetModel.prototype.stack = function () {
        return null;
    };
    FacetModel.prototype.parseData = function () {
        this.child().parseData();
        this.component.data = data$2.parseFacetData(this);
    };
    FacetModel.prototype.parseSelectionData = function () {
    };
    FacetModel.prototype.parseLayoutData = function () {
        this.child().parseLayoutData();
        this.component.layout = layout.parseFacetLayout(this);
    };
    FacetModel.prototype.parseScale = function () {
        var child = this.child();
        var model$$1 = this;
        child.parseScale();
        var scaleComponent = this.component.scale = scale$4.parseScaleComponent(this);
        util$3.keys(child.component.scale).forEach(function (channel$$1) {
            {
                scaleComponent[channel$$1] = child.component.scale[channel$$1];
                util$3.vals(scaleComponent[channel$$1]).forEach(function (scale) {
                    var scaleNameWithoutPrefix = scale.name.substr(child.name('').length);
                    var newName = model$$1.scaleName(scaleNameWithoutPrefix, true);
                    child.renameScale(scale.name, newName);
                    scale.name = newName;
                });
                delete child.component.scale[channel$$1];
            }
        });
    };
    FacetModel.prototype.parseMark = function () {
        this.child().parseMark();
        this.component.mark = util$3.extend({
            name: this.name('cell'),
            type: 'group',
            from: util$3.extend(this.dataTable() ? { data: this.dataTable() } : {}, {
                transform: [{
                        type: 'facet',
                        groupby: [].concat(this.has(channel.ROW) ? [this.field(channel.ROW)] : [], this.has(channel.COLUMN) ? [this.field(channel.COLUMN)] : [])
                    }]
            }),
            properties: {
                update: getFacetGroupProperties(this)
            }
        }, this.child().assembleGroup());
    };
    FacetModel.prototype.parseAxis = function () {
        this.child().parseAxis();
        this.component.axis = axis$2.parseAxisComponent(this, [channel.ROW, channel.COLUMN]);
    };
    FacetModel.prototype.parseAxisGroup = function () {
        var xAxisGroup = parseAxisGroup(this, channel.X);
        var yAxisGroup = parseAxisGroup(this, channel.Y);
        this.component.axisGroup = util$3.extend(xAxisGroup ? { x: xAxisGroup } : {}, yAxisGroup ? { y: yAxisGroup } : {});
    };
    FacetModel.prototype.parseGridGroup = function () {
        var child = this.child();
        this.component.gridGroup = util$3.extend(!child.has(channel.X) && this.has(channel.COLUMN) ? { column: getColumnGridGroups(this) } : {}, !child.has(channel.Y) && this.has(channel.ROW) ? { row: getRowGridGroups(this) } : {});
    };
    FacetModel.prototype.parseLegend = function () {
        this.child().parseLegend();
        this.component.legend = this._child.component.legend;
        this._child.component.legend = {};
    };
    FacetModel.prototype.assembleParentGroupProperties = function () {
        return null;
    };
    FacetModel.prototype.assembleData = function (data) {
        data$2.assembleData(this, data);
        return this._child.assembleData(data);
    };
    FacetModel.prototype.assembleLayout = function (layoutData) {
        this._child.assembleLayout(layoutData);
        return layout.assembleLayout(this, layoutData);
    };
    FacetModel.prototype.assembleMarks = function () {
        return [].concat(util$3.vals(this.component.axisGroup), util$3.flatten(util$3.vals(this.component.gridGroup)), this.component.mark);
    };
    FacetModel.prototype.channels = function () {
        return [channel.ROW, channel.COLUMN];
    };
    FacetModel.prototype.mapping = function () {
        return this.facet();
    };
    FacetModel.prototype.isFacet = function () {
        return true;
    };
    return FacetModel;
}(model.Model));
var FacetModel_1 = FacetModel;
function getFacetGroupProperties(model$$1) {
    var child = model$$1.child();
    var mergedCellConfig = util$3.extend({}, child.config().cell, child.config().facet.cell);
    return util$3.extend({
        x: model$$1.has(channel.COLUMN) ? {
            scale: model$$1.scaleName(channel.COLUMN),
            field: model$$1.field(channel.COLUMN),
            offset: model$$1.scale(channel.COLUMN).padding / 2
        } : { value: model$$1.config().facet.scale.padding / 2 },
        y: model$$1.has(channel.ROW) ? {
            scale: model$$1.scaleName(channel.ROW),
            field: model$$1.field(channel.ROW),
            offset: model$$1.scale(channel.ROW).padding / 2
        } : { value: model$$1.config().facet.scale.padding / 2 },
        width: { field: { parent: model$$1.child().sizeName('width') } },
        height: { field: { parent: model$$1.child().sizeName('height') } }
    }, child.assembleParentGroupProperties(mergedCellConfig));
}
function parseAxisGroup(model$$1, channel$$1) {
    var axisGroup = null;
    var child = model$$1.child();
    if (child.has(channel$$1)) {
        if (child.axis(channel$$1)) {
            {
                axisGroup = channel$$1 === channel.X ? getXAxesGroup(model$$1) : getYAxesGroup(model$$1);
                if (child.axis(channel$$1) && axis$2.gridShow(child, channel$$1)) {
                    child.component.axis[channel$$1] = axis$2.parseInnerAxis(channel$$1, child);
                }
                else {
                    delete child.component.axis[channel$$1];
                }
            }
        }
    }
    return axisGroup;
}
function getXAxesGroup(model$$1) {
    var hasCol = model$$1.has(channel.COLUMN);
    return util$3.extend({
        name: model$$1.name('x-axes'),
        type: 'group'
    }, hasCol ? {
        from: {
            data: model$$1.dataTable(),
            transform: [{
                    type: 'aggregate',
                    groupby: [model$$1.field(channel.COLUMN)],
                    summarize: { '*': ['count'] }
                }]
        }
    } : {}, {
        properties: {
            update: {
                width: { field: { parent: model$$1.child().sizeName('width') } },
                height: {
                    field: { group: 'height' }
                },
                x: hasCol ? {
                    scale: model$$1.scaleName(channel.COLUMN),
                    field: model$$1.field(channel.COLUMN),
                    offset: model$$1.scale(channel.COLUMN).padding / 2
                } : {
                    value: model$$1.config().facet.scale.padding / 2
                }
            }
        },
        axes: [axis$2.parseAxis(channel.X, model$$1.child())]
    });
}
function getYAxesGroup(model$$1) {
    var hasRow = model$$1.has(channel.ROW);
    return util$3.extend({
        name: model$$1.name('y-axes'),
        type: 'group'
    }, hasRow ? {
        from: {
            data: model$$1.dataTable(),
            transform: [{
                    type: 'aggregate',
                    groupby: [model$$1.field(channel.ROW)],
                    summarize: { '*': ['count'] }
                }]
        }
    } : {}, {
        properties: {
            update: {
                width: {
                    field: { group: 'width' }
                },
                height: { field: { parent: model$$1.child().sizeName('height') } },
                y: hasRow ? {
                    scale: model$$1.scaleName(channel.ROW),
                    field: model$$1.field(channel.ROW),
                    offset: model$$1.scale(channel.ROW).padding / 2
                } : {
                    value: model$$1.config().facet.scale.padding / 2
                }
            }
        },
        axes: [axis$2.parseAxis(channel.Y, model$$1.child())]
    });
}
function getRowGridGroups(model$$1) {
    var facetGridConfig = model$$1.config().facet.grid;
    var rowGrid = {
        name: model$$1.name('row-grid'),
        type: 'rule',
        from: {
            data: model$$1.dataTable(),
            transform: [{ type: 'facet', groupby: [model$$1.field(channel.ROW)] }]
        },
        properties: {
            update: {
                y: {
                    scale: model$$1.scaleName(channel.ROW),
                    field: model$$1.field(channel.ROW)
                },
                x: { value: 0, offset: -facetGridConfig.offset },
                x2: { field: { group: 'width' }, offset: facetGridConfig.offset },
                stroke: { value: facetGridConfig.color },
                strokeOpacity: { value: facetGridConfig.opacity },
                strokeWidth: { value: 0.5 }
            }
        }
    };
    return [rowGrid, {
            name: model$$1.name('row-grid-end'),
            type: 'rule',
            properties: {
                update: {
                    y: { field: { group: 'height' } },
                    x: { value: 0, offset: -facetGridConfig.offset },
                    x2: { field: { group: 'width' }, offset: facetGridConfig.offset },
                    stroke: { value: facetGridConfig.color },
                    strokeOpacity: { value: facetGridConfig.opacity },
                    strokeWidth: { value: 0.5 }
                }
            }
        }];
}
function getColumnGridGroups(model$$1) {
    var facetGridConfig = model$$1.config().facet.grid;
    var columnGrid = {
        name: model$$1.name('column-grid'),
        type: 'rule',
        from: {
            data: model$$1.dataTable(),
            transform: [{ type: 'facet', groupby: [model$$1.field(channel.COLUMN)] }]
        },
        properties: {
            update: {
                x: {
                    scale: model$$1.scaleName(channel.COLUMN),
                    field: model$$1.field(channel.COLUMN)
                },
                y: { value: 0, offset: -facetGridConfig.offset },
                y2: { field: { group: 'height' }, offset: facetGridConfig.offset },
                stroke: { value: facetGridConfig.color },
                strokeOpacity: { value: facetGridConfig.opacity },
                strokeWidth: { value: 0.5 }
            }
        }
    };
    return [columnGrid, {
            name: model$$1.name('column-grid-end'),
            type: 'rule',
            properties: {
                update: {
                    x: { field: { group: 'width' } },
                    y: { value: 0, offset: -facetGridConfig.offset },
                    y2: { field: { group: 'height' }, offset: facetGridConfig.offset },
                    stroke: { value: facetGridConfig.color },
                    strokeOpacity: { value: facetGridConfig.opacity },
                    strokeWidth: { value: 0.5 }
                }
            }
        }];
}
var facet = {
	FacetModel: FacetModel_1
};

function isUnionedDomain(domain) {
    if (!util$3.isArray(domain)) {
        return 'fields' in domain;
    }
    return false;
}
var isUnionedDomain_1 = isUnionedDomain;
function isDataRefDomain(domain) {
    if (!util$3.isArray(domain)) {
        return 'data' in domain;
    }
    return false;
}
var isDataRefDomain_1 = isDataRefDomain;
var vega_schema = {
	isUnionedDomain: isUnionedDomain_1,
	isDataRefDomain: isDataRefDomain_1
};

var __extends$1 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LayerModel = (function (_super) {
    __extends$1(LayerModel, _super);
    function LayerModel(spec, parent, parentGivenName) {
        var _this = this;
        _super.call(this, spec, parent, parentGivenName);
        this._width = spec.width;
        this._height = spec.height;
        this._config = this._initConfig(spec.config, parent);
        this._children = spec.layers.map(function (layer, i) {
            return common.buildModel(layer, _this, _this.name('layer_' + i));
        });
    }
    LayerModel.prototype._initConfig = function (specConfig, parent) {
        return util$3.mergeDeep(util$3.duplicate(config$2.defaultConfig), specConfig, parent ? parent.config() : {});
    };
    Object.defineProperty(LayerModel.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LayerModel.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    LayerModel.prototype.has = function (channel) {
        return false;
    };
    LayerModel.prototype.children = function () {
        return this._children;
    };
    LayerModel.prototype.isOrdinalScale = function (channel) {
        return this._children[0].isOrdinalScale(channel);
    };
    LayerModel.prototype.dataTable = function () {
        return this._children[0].dataTable();
    };
    LayerModel.prototype.fieldDef = function (channel) {
        return null;
    };
    LayerModel.prototype.stack = function () {
        return null;
    };
    LayerModel.prototype.parseData = function () {
        this._children.forEach(function (child) {
            child.parseData();
        });
        this.component.data = data$2.parseLayerData(this);
    };
    LayerModel.prototype.parseSelectionData = function () {
    };
    LayerModel.prototype.parseLayoutData = function () {
        this._children.forEach(function (child, i) {
            child.parseLayoutData();
        });
        this.component.layout = layout.parseLayerLayout(this);
    };
    LayerModel.prototype.parseScale = function () {
        var model$$1 = this;
        var scaleComponent = this.component.scale = {};
        this._children.forEach(function (child) {
            child.parseScale();
            {
                util$3.keys(child.component.scale).forEach(function (channel) {
                    var childScales = child.component.scale[channel];
                    if (!childScales) {
                        return;
                    }
                    var modelScales = scaleComponent[channel];
                    if (modelScales && modelScales.main) {
                        var modelDomain = modelScales.main.domain;
                        var childDomain = childScales.main.domain;
                        if (util$3.isArray(modelDomain)) {
                            if (util$3.isArray(childScales.main.domain)) {
                                modelScales.main.domain = modelDomain.concat(childDomain);
                            }
                            else {
                                model$$1.addWarning('custom domain scale cannot be unioned with default field-based domain');
                            }
                        }
                        else {
                            var unionedFields = vega_schema.isUnionedDomain(modelDomain) ? modelDomain.fields : [modelDomain];
                            if (util$3.isArray(childDomain)) {
                                model$$1.addWarning('custom domain scale cannot be unioned with default field-based domain');
                            }
                            var fields = vega_schema.isDataRefDomain(childDomain) ? unionedFields.concat([childDomain]) :
                                vega_schema.isUnionedDomain(childDomain) ? unionedFields.concat(childDomain.fields) :
                                    unionedFields;
                            fields = util$3.unique(fields, util$3.hash);
                            if (fields.length > 1) {
                                modelScales.main.domain = { fields: fields };
                            }
                            else {
                                modelScales.main.domain = fields[0];
                            }
                        }
                        modelScales.colorLegend = modelScales.colorLegend ? modelScales.colorLegend : childScales.colorLegend;
                        modelScales.binColorLegend = modelScales.binColorLegend ? modelScales.binColorLegend : childScales.binColorLegend;
                    }
                    else {
                        scaleComponent[channel] = childScales;
                    }
                    util$3.vals(childScales).forEach(function (scale) {
                        var scaleNameWithoutPrefix = scale.name.substr(child.name('').length);
                        var newName = model$$1.scaleName(scaleNameWithoutPrefix, true);
                        child.renameScale(scale.name, newName);
                        scale.name = newName;
                    });
                    delete childScales[channel];
                });
            }
        });
    };
    LayerModel.prototype.parseMark = function () {
        this._children.forEach(function (child) {
            child.parseMark();
        });
    };
    LayerModel.prototype.parseAxis = function () {
        var axisComponent = this.component.axis = {};
        this._children.forEach(function (child) {
            child.parseAxis();
            {
                util$3.keys(child.component.axis).forEach(function (channel) {
                    if (!axisComponent[channel]) {
                        axisComponent[channel] = child.component.axis[channel];
                    }
                });
            }
        });
    };
    LayerModel.prototype.parseAxisGroup = function () {
        return null;
    };
    LayerModel.prototype.parseGridGroup = function () {
        return null;
    };
    LayerModel.prototype.parseLegend = function () {
        var legendComponent = this.component.legend = {};
        this._children.forEach(function (child) {
            child.parseLegend();
            {
                util$3.keys(child.component.legend).forEach(function (channel) {
                    if (!legendComponent[channel]) {
                        legendComponent[channel] = child.component.legend[channel];
                    }
                });
            }
        });
    };
    LayerModel.prototype.assembleParentGroupProperties = function () {
        return null;
    };
    LayerModel.prototype.assembleData = function (data) {
        data$2.assembleData(this, data);
        this._children.forEach(function (child) {
            child.assembleData(data);
        });
        return data;
    };
    LayerModel.prototype.assembleLayout = function (layoutData) {
        this._children.forEach(function (child) {
            child.assembleLayout(layoutData);
        });
        return layout.assembleLayout(this, layoutData);
    };
    LayerModel.prototype.assembleMarks = function () {
        return util$3.flatten(this._children.map(function (child) {
            return child.assembleMarks();
        }));
    };
    LayerModel.prototype.channels = function () {
        return [];
    };
    LayerModel.prototype.mapping = function () {
        return null;
    };
    LayerModel.prototype.isLayer = function () {
        return true;
    };
    LayerModel.prototype.compatibleSource = function (child) {
        var data = this.data();
        var childData = child.component.data;
        var compatible = !childData.source || (data && data.url === childData.source.url);
        return compatible;
    };
    return LayerModel;
}(model.Model));
var LayerModel_1 = LayerModel;
var layer = {
	LayerModel: LayerModel_1
};

function initMarkConfig(mark, encoding$$1, stacked, config) {
    return util$3.extend(['filled', 'opacity', 'orient', 'align'].reduce(function (cfg, property) {
        var value = config.mark[property];
        switch (property) {
            case 'filled':
                if (value === undefined) {
                    cfg[property] = mark !== mark$1.POINT && mark !== mark$1.LINE && mark !== mark$1.RULE;
                }
                break;
            case 'opacity':
                if (value === undefined) {
                    if (util$3.contains([mark$1.POINT, mark$1.TICK, mark$1.CIRCLE, mark$1.SQUARE], mark)) {
                        if (!encoding.isAggregate(encoding$$1) || encoding.has(encoding$$1, channel.DETAIL)) {
                            cfg[property] = 0.7;
                        }
                    }
                    if (mark === mark$1.BAR && !stacked) {
                        if (encoding.has(encoding$$1, channel.COLOR) || encoding.has(encoding$$1, channel.DETAIL) || encoding.has(encoding$$1, channel.SIZE)) {
                            cfg[property] = 0.7;
                        }
                    }
                    if (mark === mark$1.AREA) {
                        cfg[property] = 0.7;
                    }
                }
                break;
            case 'orient':
                cfg[property] = orient(mark, encoding$$1, config.mark);
                break;
            case 'align':
                if (value === undefined) {
                    cfg[property] = encoding.has(encoding$$1, channel.X) ? 'center' : 'right';
                }
        }
        return cfg;
    }, {}), config.mark);
}
var initMarkConfig_1 = initMarkConfig;
function orient(mark, encoding$$1, markConfig) {
    if (markConfig === void 0) { markConfig = {}; }
    switch (mark) {
        case mark$1.POINT:
        case mark$1.CIRCLE:
        case mark$1.SQUARE:
        case mark$1.TEXT:
            return undefined;
    }
    var yIsRange = encoding$$1.y && encoding$$1.y2;
    var xIsRange = encoding$$1.x && encoding$$1.x2;
    switch (mark) {
        case mark$1.TICK:
            var xScaleType = encoding$$1.x ? scale$4.scaleType(encoding$$1.x.scale || {}, encoding$$1.x, channel.X, mark) : null;
            var yScaleType = encoding$$1.y ? scale$4.scaleType(encoding$$1.y.scale || {}, encoding$$1.y, channel.Y, mark) : null;
            if (xScaleType !== scale$3.ScaleType.ORDINAL && (!encoding$$1.y ||
                yScaleType === scale$3.ScaleType.ORDINAL) ||
                encoding$$1.y.bin) {
                return config$2.Orient.VERTICAL;
            }
            return config$2.Orient.HORIZONTAL;
        case mark$1.RULE:
            if (xIsRange) {
                return config$2.Orient.HORIZONTAL;
            }
            if (yIsRange) {
                return config$2.Orient.VERTICAL;
            }
            if (encoding$$1.y) {
                return config$2.Orient.HORIZONTAL;
            }
            if (encoding$$1.x) {
                return config$2.Orient.VERTICAL;
            }
            return undefined;
        case mark$1.BAR:
        case mark$1.AREA:
            if (yIsRange) {
                return config$2.Orient.VERTICAL;
            }
            if (xIsRange) {
                return config$2.Orient.HORIZONTAL;
            }
        case mark$1.LINE:
            var xIsMeasure = fielddef.isMeasure(encoding$$1.x) || fielddef.isMeasure(encoding$$1.x2);
            var yIsMeasure = fielddef.isMeasure(encoding$$1.y) || fielddef.isMeasure(encoding$$1.y2);
            if (xIsMeasure && !yIsMeasure) {
                return config$2.Orient.HORIZONTAL;
            }
            else if (!xIsMeasure && yIsMeasure) {
                return config$2.Orient.VERTICAL;
            }
            else if (xIsMeasure && yIsMeasure) {
                if (encoding$$1.x.type === type.TEMPORAL) {
                    return config$2.Orient.VERTICAL;
                }
                else if (encoding$$1.y.type === type.TEMPORAL) {
                    return config$2.Orient.HORIZONTAL;
                }
            }
            return config$2.Orient.VERTICAL;
    }
    console.warn('orient unimplemented for mark', mark);
    return config$2.Orient.VERTICAL;
}
var orient_1 = orient;
var config$3 = {
	initMarkConfig: initMarkConfig_1,
	orient: orient_1
};

var legend$2 = createCommonjsModule(function (module, exports) {
function parseLegendComponent(model) {
    return [channel.COLOR, channel.SIZE, channel.SHAPE, channel.OPACITY].reduce(function (legendComponent, channel$$1) {
        if (model.legend(channel$$1)) {
            legendComponent[channel$$1] = parseLegend(model, channel$$1);
        }
        return legendComponent;
    }, {});
}
exports.parseLegendComponent = parseLegendComponent;
function getLegendDefWithScale(model, channel$$1) {
    switch (channel$$1) {
        case channel.COLOR:
            var fieldDef = model.encoding().color;
            var scale = model.scaleName(useColorLegendScale(fieldDef) ?
                scale$4.COLOR_LEGEND :
                channel.COLOR);
            return model.config().mark.filled ? { fill: scale } : { stroke: scale };
        case channel.SIZE:
            return { size: model.scaleName(channel.SIZE) };
        case channel.SHAPE:
            return { shape: model.scaleName(channel.SHAPE) };
        case channel.OPACITY:
            return { opacity: model.scaleName(channel.OPACITY) };
    }
    return null;
}
function parseLegend(model, channel$$1) {
    var fieldDef = model.fieldDef(channel$$1);
    var legend = model.legend(channel$$1);
    var config = model.config();
    var def = getLegendDefWithScale(model, channel$$1);
    def.title = title(legend, fieldDef, config);
    var format = common.numberFormat(fieldDef, legend.format, config, channel$$1);
    if (format) {
        def.format = format;
    }
    var vals = values(legend);
    if (vals) {
        def.values = vals;
    }
    ['offset', 'orient'].forEach(function (property) {
        var value = legend[property];
        if (value !== undefined) {
            def[property] = value;
        }
    });
    var props = (typeof legend !== 'boolean' && legend.properties) || {};
    ['title', 'symbols', 'legend', 'labels'].forEach(function (group) {
        var value = properties[group] ?
            properties[group](fieldDef, props[group], model, channel$$1) :
            props[group];
        if (value !== undefined && util$3.keys(value).length > 0) {
            def.properties = def.properties || {};
            def.properties[group] = value;
        }
    });
    return def;
}
exports.parseLegend = parseLegend;
function title(legend, fieldDef, config) {
    if (legend.title !== undefined) {
        return legend.title;
    }
    return fielddef.title(fieldDef, config);
}
exports.title = title;
function values(legend) {
    var vals = legend.values;
    if (vals && datetime.isDateTime(vals[0])) {
        return vals.map(function (dt) {
            return datetime.timestamp(dt, true);
        });
    }
    return vals;
}
exports.values = values;
function useColorLegendScale(fieldDef) {
    return fieldDef.type === type.ORDINAL || fieldDef.bin || fieldDef.timeUnit;
}
exports.useColorLegendScale = useColorLegendScale;
var properties;
(function (properties) {
    function symbols(fieldDef, symbolsSpec, model, channel$$1) {
        var symbols = {};
        var mark = model.mark();
        var legend = model.legend(channel$$1);
        switch (mark) {
            case mark$1.BAR:
            case mark$1.TICK:
            case mark$1.TEXT:
                symbols.shape = { value: 'square' };
                break;
            case mark$1.CIRCLE:
            case mark$1.SQUARE:
                symbols.shape = { value: mark };
                break;
            case mark$1.POINT:
            case mark$1.LINE:
            case mark$1.AREA:
                break;
        }
        var cfg = model.config();
        var filled = cfg.mark.filled;
        var config = channel$$1 === channel.COLOR ?
            util$3.without(common.FILL_STROKE_CONFIG, [filled ? 'fill' : 'stroke', 'strokeDash', 'strokeDashOffset']) :
            util$3.without(common.FILL_STROKE_CONFIG, ['strokeDash', 'strokeDashOffset']);
        config = util$3.without(config, ['strokeDash', 'strokeDashOffset']);
        common.applyMarkConfig(symbols, model, config);
        if (filled) {
            symbols.strokeWidth = { value: 0 };
        }
        if (channel$$1 === channel.OPACITY) {
            delete symbols.opacity;
        }
        var value;
        if (model.has(channel.COLOR) && channel$$1 === channel.COLOR) {
            if (useColorLegendScale(fieldDef)) {
                value = { scale: model.scaleName(channel.COLOR), field: 'data' };
            }
        }
        else if (model.encoding().color && model.encoding().color.value) {
            value = { value: model.encoding().color.value };
        }
        if (value !== undefined) {
            if (filled) {
                symbols.fill = value;
            }
            else {
                symbols.stroke = value;
            }
        }
        else if (channel$$1 !== channel.COLOR) {
            symbols[filled ? 'fill' : 'stroke'] = symbols[filled ? 'fill' : 'stroke'] ||
                { value: cfg.mark.color };
        }
        if (legend.symbolColor !== undefined) {
            symbols.fill = { value: legend.symbolColor };
        }
        else if (symbols.fill === undefined) {
            if (cfg.mark.fill !== undefined) {
                symbols.fill = { value: cfg.mark.fill };
            }
            else if (cfg.mark.stroke !== undefined) {
                symbols.stroke = { value: cfg.mark.stroke };
            }
        }
        if (channel$$1 !== channel.SHAPE) {
            if (legend.symbolShape !== undefined) {
                symbols.shape = { value: legend.symbolShape };
            }
            else if (cfg.mark.shape !== undefined) {
                symbols.shape = { value: cfg.mark.shape };
            }
        }
        if (channel$$1 !== channel.SIZE) {
            if (legend.symbolSize !== undefined) {
                symbols.size = { value: legend.symbolSize };
            }
        }
        if (legend.symbolStrokeWidth !== undefined) {
            symbols.strokeWidth = { value: legend.symbolStrokeWidth };
        }
        symbols = util$3.extend(symbols, symbolsSpec || {});
        return util$3.keys(symbols).length > 0 ? symbols : undefined;
    }
    properties.symbols = symbols;
    function labels(fieldDef, labelsSpec, model, channel$$1) {
        var legend = model.legend(channel$$1);
        var config = model.config();
        var labels = {};
        if (channel$$1 === channel.COLOR) {
            if (fieldDef.type === type.ORDINAL) {
                labelsSpec = util$3.extend({
                    text: {
                        scale: model.scaleName(scale$4.COLOR_LEGEND),
                        field: 'data'
                    }
                }, labelsSpec || {});
            }
            else if (fieldDef.bin) {
                labelsSpec = util$3.extend({
                    text: {
                        scale: model.scaleName(scale$4.COLOR_LEGEND_LABEL),
                        field: 'data'
                    }
                }, labelsSpec || {});
            }
            else if (fieldDef.type === type.TEMPORAL) {
                labelsSpec = util$3.extend({
                    text: {
                        template: common.timeTemplate('datum["data"]', fieldDef.timeUnit, legend.format, legend.shortTimeLabels, config)
                    }
                }, labelsSpec || {});
            }
        }
        if (legend.labelAlign !== undefined) {
            labels.align = { value: legend.labelAlign };
        }
        if (legend.labelColor !== undefined) {
            labels.fill = { value: legend.labelColor };
        }
        if (legend.labelFont !== undefined) {
            labels.font = { value: legend.labelFont };
        }
        if (legend.labelFontSize !== undefined) {
            labels.fontSize = { value: legend.labelFontSize };
        }
        if (legend.labelBaseline !== undefined) {
            labels.baseline = { value: legend.labelBaseline };
        }
        labels = util$3.extend(labels, labelsSpec || {});
        return util$3.keys(labels).length > 0 ? labels : undefined;
    }
    properties.labels = labels;
    function title(fieldDef, titleSpec, model, channel$$1) {
        var legend = model.legend(channel$$1);
        var titles = {};
        if (legend.titleColor !== undefined) {
            titles.fill = { value: legend.titleColor };
        }
        if (legend.titleFont !== undefined) {
            titles.font = { value: legend.titleFont };
        }
        if (legend.titleFontSize !== undefined) {
            titles.fontSize = { value: legend.titleFontSize };
        }
        if (legend.titleFontWeight !== undefined) {
            titles.fontWeight = { value: legend.titleFontWeight };
        }
        titles = util$3.extend(titles, titleSpec || {});
        return util$3.keys(titles).length > 0 ? titles : undefined;
    }
    properties.title = title;
})(properties = exports.properties || (exports.properties = {}));
});
var legend_1 = legend$2.parseLegendComponent;
var legend_2 = legend$2.parseLegend;
var legend_3 = legend$2.title;
var legend_4 = legend$2.values;
var legend_5 = legend$2.useColorLegendScale;
var legend_6 = legend$2.properties;

var area_1$1 = createCommonjsModule(function (module, exports) {
var area;
(function (area) {
    function markType() {
        return 'area';
    }
    area.markType = markType;
    function properties(model) {
        var p = {};
        var config = model.config();
        var orient = config.mark.orient;
        p.orient = { value: orient };
        var stack = model.stack();
        p.x = x(model.encoding().x, model.scaleName(channel.X), model.scale(channel.X), orient, stack);
        p.y = y(model.encoding().y, model.scaleName(channel.Y), model.scale(channel.Y), orient, stack);
        var _x2 = x2(model.encoding().x, model.encoding().x2, model.scaleName(channel.X), model.scale(channel.X), orient, stack);
        if (_x2) {
            p.x2 = _x2;
        }
        var _y2 = y2(model.encoding().y, model.encoding().y2, model.scaleName(channel.Y), model.scale(channel.Y), orient, stack);
        if (_y2) {
            p.y2 = _y2;
        }
        common.applyColorAndOpacity(p, model);
        common.applyMarkConfig(p, model, ['interpolate', 'tension']);
        return p;
    }
    area.properties = properties;
    function x(fieldDef, scaleName, scale, orient, stack) {
        if (stack && channel.X === stack.fieldChannel) {
            return {
                scale: scaleName,
                field: fielddef.field(fieldDef, { suffix: 'start' })
            };
        }
        else if (fieldDef) {
            if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
            else if (fieldDef.value) {
                return {
                    scale: scaleName,
                    value: fieldDef.value
                };
            }
        }
        return { value: 0 };
    }
    area.x = x;
    function x2(xFieldDef, x2FieldDef, scaleName, scale, orient, stack) {
        if (orient === config$2.Orient.HORIZONTAL) {
            if (stack && channel.X === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(xFieldDef, { suffix: 'end' })
                };
            }
            else if (x2FieldDef) {
                if (x2FieldDef.field) {
                    return {
                        scale: scaleName,
                        field: fielddef.field(x2FieldDef)
                    };
                }
                else if (x2FieldDef.value) {
                    return {
                        scale: scaleName,
                        value: x2FieldDef.value
                    };
                }
            }
            if (util$3.contains([scale$3.ScaleType.LOG, scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], scale.type) || scale.zero === false) {
                return {
                    value: 0
                };
            }
            return {
                scale: scaleName,
                value: 0
            };
        }
        return undefined;
    }
    area.x2 = x2;
    function y(fieldDef, scaleName, scale, orient, stack) {
        if (stack && channel.Y === stack.fieldChannel) {
            return {
                scale: scaleName,
                field: fielddef.field(fieldDef, { suffix: 'start' })
            };
        }
        else if (fieldDef) {
            if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
            else if (fieldDef.value) {
                return {
                    scale: scaleName,
                    value: fieldDef.value
                };
            }
        }
        return { value: 0 };
    }
    area.y = y;
    function y2(yFieldDef, y2FieldDef, scaleName, scale, orient, stack) {
        if (orient !== config$2.Orient.HORIZONTAL) {
            if (stack && channel.Y === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(yFieldDef, { suffix: 'end' })
                };
            }
            else if (y2FieldDef) {
                if (y2FieldDef.field) {
                    return {
                        scale: scaleName,
                        field: fielddef.field(y2FieldDef)
                    };
                }
                else if (y2FieldDef.value) {
                    return {
                        scale: scaleName,
                        value: y2FieldDef.value
                    };
                }
            }
            if (util$3.contains([scale$3.ScaleType.LOG, scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], scale.type) || scale.zero === false) {
                return {
                    field: { group: 'height' }
                };
            }
            return {
                scale: scaleName,
                value: 0
            };
        }
        return undefined;
    }
    area.y2 = y2;
})(area = exports.area || (exports.area = {}));
});
var area_2$1 = area_1$1.area;

var bar_1 = createCommonjsModule(function (module, exports) {
var bar;
(function (bar) {
    function markType() {
        return 'rect';
    }
    bar.markType = markType;
    function properties(model) {
        var p = {};
        var orient = model.config().mark.orient;
        var stack = model.stack();
        var xFieldDef = model.encoding().x;
        var x2FieldDef = model.encoding().x2;
        var xIsMeasure = fielddef.isMeasure(xFieldDef) || fielddef.isMeasure(x2FieldDef);
        if (stack && channel.X === stack.fieldChannel) {
            p.x = {
                scale: model.scaleName(channel.X),
                field: model.field(channel.X, { suffix: 'start' })
            };
            p.x2 = {
                scale: model.scaleName(channel.X),
                field: model.field(channel.X, { suffix: 'end' })
            };
        }
        else if (xIsMeasure) {
            if (orient === config$2.Orient.HORIZONTAL) {
                if (model.has(channel.X)) {
                    p.x = {
                        scale: model.scaleName(channel.X),
                        field: model.field(channel.X)
                    };
                }
                else {
                    p.x = {
                        scale: model.scaleName(channel.X),
                        value: 0
                    };
                }
                if (model.has(channel.X2)) {
                    p.x2 = {
                        scale: model.scaleName(channel.X),
                        field: model.field(channel.X2)
                    };
                }
                else {
                    if (util$3.contains([scale$3.ScaleType.LOG, scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], model.scale(channel.X).type) ||
                        model.scale(channel.X).zero === false) {
                        p.x2 = { value: 0 };
                    }
                    else {
                        p.x2 = {
                            scale: model.scaleName(channel.X),
                            value: 0
                        };
                    }
                }
            }
            else {
                p.xc = {
                    scale: model.scaleName(channel.X),
                    field: model.field(channel.X)
                };
                p.width = { value: sizeValue(model, channel.X) };
            }
        }
        else {
            if (model.has(channel.X)) {
                if (model.encoding().x.bin) {
                    if (model.has(channel.SIZE) && orient !== config$2.Orient.HORIZONTAL) {
                        p.xc = {
                            scale: model.scaleName(channel.X),
                            field: model.field(channel.X, { binSuffix: 'mid' })
                        };
                        p.width = {
                            scale: model.scaleName(channel.SIZE),
                            field: model.field(channel.SIZE)
                        };
                    }
                    else {
                        p.x = {
                            scale: model.scaleName(channel.X),
                            field: model.field(channel.X, { binSuffix: 'start' }),
                            offset: 1
                        };
                        p.x2 = {
                            scale: model.scaleName(channel.X),
                            field: model.field(channel.X, { binSuffix: 'end' })
                        };
                    }
                }
                else if (model.scale(channel.X).bandSize === scale$3.BANDSIZE_FIT) {
                    p.x = {
                        scale: model.scaleName(channel.X),
                        field: model.field(channel.X),
                        offset: 0.5
                    };
                }
                else {
                    p.xc = {
                        scale: model.scaleName(channel.X),
                        field: model.field(channel.X)
                    };
                }
            }
            else {
                p.x = { value: 0, offset: 2 };
            }
            p.width = model.has(channel.X) && model.scale(channel.X).bandSize === scale$3.BANDSIZE_FIT ? {
                scale: model.scaleName(channel.X),
                band: true,
                offset: -0.5
            } : model.has(channel.SIZE) && orient !== config$2.Orient.HORIZONTAL ? {
                scale: model.scaleName(channel.SIZE),
                field: model.field(channel.SIZE)
            } : {
                value: sizeValue(model, (channel.X))
            };
        }
        var yFieldDef = model.encoding().y;
        var y2FieldDef = model.encoding().y2;
        var yIsMeasure = fielddef.isMeasure(yFieldDef) || fielddef.isMeasure(y2FieldDef);
        if (stack && channel.Y === stack.fieldChannel) {
            p.y = {
                scale: model.scaleName(channel.Y),
                field: model.field(channel.Y, { suffix: 'start' })
            };
            p.y2 = {
                scale: model.scaleName(channel.Y),
                field: model.field(channel.Y, { suffix: 'end' })
            };
        }
        else if (yIsMeasure) {
            if (orient !== config$2.Orient.HORIZONTAL) {
                if (model.has(channel.Y)) {
                    p.y = {
                        scale: model.scaleName(channel.Y),
                        field: model.field(channel.Y)
                    };
                }
                else {
                    p.y = {
                        scale: model.scaleName(channel.Y),
                        value: 0
                    };
                }
                if (model.has(channel.Y2)) {
                    p.y2 = {
                        scale: model.scaleName(channel.Y),
                        field: model.field(channel.Y2)
                    };
                }
                else {
                    if (util$3.contains([scale$3.ScaleType.LOG, scale$3.ScaleType.TIME, scale$3.ScaleType.UTC], model.scale(channel.Y).type) ||
                        model.scale(channel.Y).zero === false) {
                        p.y2 = {
                            field: { group: 'height' }
                        };
                    }
                    else {
                        p.y2 = {
                            scale: model.scaleName(channel.Y),
                            value: 0
                        };
                    }
                }
            }
            else {
                p.yc = {
                    scale: model.scaleName(channel.Y),
                    field: model.field(channel.Y)
                };
                p.height = { value: sizeValue(model, channel.Y) };
            }
        }
        else {
            if (model.has(channel.Y)) {
                if (model.encoding().y.bin) {
                    if (model.has(channel.SIZE) && orient === config$2.Orient.HORIZONTAL) {
                        p.yc = {
                            scale: model.scaleName(channel.Y),
                            field: model.field(channel.Y, { binSuffix: 'mid' })
                        };
                        p.height = {
                            scale: model.scaleName(channel.SIZE),
                            field: model.field(channel.SIZE)
                        };
                    }
                    else {
                        p.y = {
                            scale: model.scaleName(channel.Y),
                            field: model.field(channel.Y, { binSuffix: 'start' })
                        };
                        p.y2 = {
                            scale: model.scaleName(channel.Y),
                            field: model.field(channel.Y, { binSuffix: 'end' }),
                            offset: 1
                        };
                    }
                }
                else if (model.scale(channel.Y).bandSize === scale$3.BANDSIZE_FIT) {
                    p.y = {
                        scale: model.scaleName(channel.Y),
                        field: model.field(channel.Y),
                        offset: 0.5
                    };
                }
                else {
                    p.yc = {
                        scale: model.scaleName(channel.Y),
                        field: model.field(channel.Y)
                    };
                }
            }
            else {
                p.y2 = {
                    field: { group: 'height' },
                    offset: -1
                };
            }
            p.height = model.has(channel.Y) && model.scale(channel.Y).bandSize === scale$3.BANDSIZE_FIT ? {
                scale: model.scaleName(channel.Y),
                band: true,
                offset: -0.5
            } : model.has(channel.SIZE) && orient === config$2.Orient.HORIZONTAL ? {
                scale: model.scaleName(channel.SIZE),
                field: model.field(channel.SIZE)
            } : {
                value: sizeValue(model, channel.Y)
            };
        }
        common.applyColorAndOpacity(p, model);
        return p;
    }
    bar.properties = properties;
    function sizeValue(model, channel$$1) {
        var fieldDef = model.encoding().size;
        if (fieldDef && fieldDef.value !== undefined) {
            return fieldDef.value;
        }
        var markConfig = model.config().mark;
        if (markConfig.barSize) {
            return markConfig.barSize;
        }
        return model.isOrdinalScale(channel$$1) ?
            model.scale(channel$$1).bandSize - 1 :
            !model.has(channel$$1) ?
                model.config().scale.bandSize - 1 :
                markConfig.barThinSize;
    }
})(bar = exports.bar || (exports.bar = {}));
});
var bar_2 = bar_1.bar;

var line_1$1 = createCommonjsModule(function (module, exports) {
var line;
(function (line) {
    function markType() {
        return 'line';
    }
    line.markType = markType;
    function properties(model) {
        var p = {};
        var config = model.config();
        var stack = model.stack();
        p.x = x(model.encoding().x, model.scaleName(channel.X), stack, config);
        p.y = y(model.encoding().y, model.scaleName(channel.Y), stack, config);
        var _size = size(model.encoding().size, config);
        if (_size) {
            p.strokeWidth = _size;
        }
        common.applyColorAndOpacity(p, model);
        common.applyMarkConfig(p, model, ['interpolate', 'tension']);
        return p;
    }
    line.properties = properties;
    function x(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.X === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
        }
        return { value: 0 };
    }
    function y(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.Y === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
        }
        return { field: { group: 'height' } };
    }
    function size(fieldDef, config) {
        if (fieldDef && fieldDef.value !== undefined) {
            return { value: fieldDef.value };
        }
        return { value: config.mark.lineSize };
    }
})(line = exports.line || (exports.line = {}));
});
var line_2$1 = line_1$1.line;

var point_1 = createCommonjsModule(function (module, exports) {
var point;
(function (point) {
    function markType() {
        return 'symbol';
    }
    point.markType = markType;
    function properties(model, fixedShape) {
        var p = {};
        var config = model.config();
        var stack = model.stack();
        p.x = x(model.encoding().x, model.scaleName(channel.X), stack, config);
        p.y = y(model.encoding().y, model.scaleName(channel.Y), stack, config);
        p.size = size(model.encoding().size, model.scaleName(channel.SIZE), model.scale(channel.SIZE), config);
        p.shape = shape(model.encoding().shape, model.scaleName(channel.SHAPE), model.scale(channel.SHAPE), config, fixedShape);
        common.applyColorAndOpacity(p, model);
        return p;
    }
    point.properties = properties;
    function x(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.X === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
        }
        return { value: config.scale.bandSize / 2 };
    }
    function y(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.Y === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
        }
        return { value: config.scale.bandSize / 2 };
    }
    function size(fieldDef, scaleName, scale, config) {
        if (fieldDef) {
            if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { scaleType: scale.type })
                };
            }
            else if (fieldDef.value !== undefined) {
                return { value: fieldDef.value };
            }
        }
        return { value: config.mark.size };
    }
    function shape(fieldDef, scaleName, scale, config, fixedShape) {
        if (fixedShape) {
            return { value: fixedShape };
        }
        else if (fieldDef) {
            if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { scaleType: scale.type })
                };
            }
            else if (fieldDef.value) {
                return { value: fieldDef.value };
            }
        }
        return { value: config.mark.shape };
    }
})(point = exports.point || (exports.point = {}));
var circle;
(function (circle) {
    function markType() {
        return 'symbol';
    }
    circle.markType = markType;
    function properties(model) {
        return point.properties(model, 'circle');
    }
    circle.properties = properties;
})(circle = exports.circle || (exports.circle = {}));
var square;
(function (square) {
    function markType() {
        return 'symbol';
    }
    square.markType = markType;
    function properties(model) {
        return point.properties(model, 'square');
    }
    square.properties = properties;
})(square = exports.square || (exports.square = {}));
});
var point_2 = point_1.point;
var point_3 = point_1.circle;
var point_4 = point_1.square;

var rule_1$1 = createCommonjsModule(function (module, exports) {
var rule;
(function (rule) {
    function markType() {
        return 'rule';
    }
    rule.markType = markType;
    function properties(model) {
        var p = {};
        if (model.config().mark.orient === config$2.Orient.VERTICAL) {
            if (model.has(channel.X)) {
                p.x = {
                    scale: model.scaleName(channel.X),
                    field: model.field(channel.X, { binSuffix: 'mid' })
                };
            }
            else {
                p.x = { value: 0 };
            }
            if (model.has(channel.Y)) {
                p.y = {
                    scale: model.scaleName(channel.Y),
                    field: model.field(channel.Y, { binSuffix: 'mid' })
                };
            }
            else {
                p.y = { field: { group: 'height' } };
            }
            if (model.has(channel.Y2)) {
                p.y2 = {
                    scale: model.scaleName(channel.Y),
                    field: model.field(channel.Y2, { binSuffix: 'mid' })
                };
            }
            else {
                p.y2 = { value: 0 };
            }
        }
        else {
            if (model.has(channel.Y)) {
                p.y = {
                    scale: model.scaleName(channel.Y),
                    field: model.field(channel.Y, { binSuffix: 'mid' })
                };
            }
            else {
                p.y = { value: 0 };
            }
            if (model.has(channel.X)) {
                p.x = {
                    scale: model.scaleName(channel.X),
                    field: model.field(channel.X, { binSuffix: 'mid' })
                };
            }
            else {
                p.x = { value: 0 };
            }
            if (model.has(channel.X2)) {
                p.x2 = {
                    scale: model.scaleName(channel.X),
                    field: model.field(channel.X2, { binSuffix: 'mid' })
                };
            }
            else {
                p.x2 = { field: { group: 'width' } };
            }
        }
        common.applyColorAndOpacity(p, model);
        if (model.has(channel.SIZE)) {
            p.strokeWidth = {
                scale: model.scaleName(channel.SIZE),
                field: model.field(channel.SIZE)
            };
        }
        else {
            p.strokeWidth = { value: sizeValue(model) };
        }
        return p;
    }
    rule.properties = properties;
    function sizeValue(model) {
        var fieldDef = model.encoding().size;
        if (fieldDef && fieldDef.value !== undefined) {
            return fieldDef.value;
        }
        return model.config().mark.ruleSize;
    }
})(rule = exports.rule || (exports.rule = {}));
});
var rule_2$1 = rule_1$1.rule;

var text_1$2 = createCommonjsModule(function (module, exports) {
var text;
(function (text_1) {
    function markType() {
        return 'text';
    }
    text_1.markType = markType;
    function background(model) {
        return {
            x: { value: 0 },
            y: { value: 0 },
            width: { field: { group: 'width' } },
            height: { field: { group: 'height' } },
            fill: {
                scale: model.scaleName(channel.COLOR),
                field: model.field(channel.COLOR, model.encoding().color.type === type.ORDINAL ? { prefix: 'rank' } : {})
            }
        };
    }
    text_1.background = background;
    function properties(model) {
        var p = {};
        common.applyMarkConfig(p, model, ['angle', 'align', 'baseline', 'dx', 'dy', 'font', 'fontWeight',
            'fontStyle', 'radius', 'theta', 'text']);
        var config = model.config();
        var stack = model.stack();
        var textFieldDef = model.encoding().text;
        p.x = x(model.encoding().x, model.scaleName(channel.X), stack, config, textFieldDef);
        p.y = y(model.encoding().y, model.scaleName(channel.Y), stack, config);
        p.fontSize = size(model.encoding().size, model.scaleName(channel.SIZE), config);
        p.text = text(textFieldDef, model.scaleName(channel.TEXT), config);
        if (model.config().mark.applyColorToBackground && !model.has(channel.X) && !model.has(channel.Y)) {
            p.fill = { value: 'black' };
            var opacity = model.config().mark.opacity;
            if (opacity) {
                p.opacity = { value: opacity };
            }
        }
        else {
            common.applyColorAndOpacity(p, model);
        }
        return p;
    }
    text_1.properties = properties;
    function x(fieldDef, scaleName, stack, config, textFieldDef) {
        if (fieldDef) {
            if (stack && channel.X === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
        }
        if (textFieldDef && textFieldDef.type === type.QUANTITATIVE) {
            return { field: { group: 'width' }, offset: -5 };
        }
        else {
            return { value: config.scale.textBandWidth / 2 };
        }
    }
    function y(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.Y === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
        }
        return { value: config.scale.bandSize / 2 };
    }
    function size(sizeFieldDef, scaleName, config) {
        if (sizeFieldDef) {
            if (sizeFieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(sizeFieldDef)
                };
            }
            if (sizeFieldDef.value) {
                return { value: sizeFieldDef.value };
            }
        }
        return { value: config.mark.fontSize };
    }
    function text(textFieldDef, scaleName, config) {
        if (textFieldDef) {
            if (textFieldDef.field) {
                if (type.QUANTITATIVE === textFieldDef.type) {
                    var format = common.numberFormat(textFieldDef, config.mark.format, config, channel.TEXT);
                    var filter = 'number' + (format ? ':\'' + format + '\'' : '');
                    return {
                        template: '{{' + fielddef.field(textFieldDef, { datum: true }) + ' | ' + filter + '}}'
                    };
                }
                else if (type.TEMPORAL === textFieldDef.type) {
                    return {
                        template: common.timeTemplate(fielddef.field(textFieldDef, { datum: true }), textFieldDef.timeUnit, config.mark.format, config.mark.shortTimeLabels, config)
                    };
                }
                else {
                    return { field: textFieldDef.field };
                }
            }
            else if (textFieldDef.value) {
                return { value: textFieldDef.value };
            }
        }
        return { value: config.mark.text };
    }
})(text = exports.text || (exports.text = {}));
});
var text_2$2 = text_1$2.text;

var tick_1 = createCommonjsModule(function (module, exports) {
var tick;
(function (tick) {
    function markType() {
        return 'rect';
    }
    tick.markType = markType;
    function properties(model) {
        var p = {};
        var config = model.config();
        var stack = model.stack();
        p.xc = x(model.encoding().x, model.scaleName(channel.X), stack, config);
        p.yc = y(model.encoding().y, model.scaleName(channel.Y), stack, config);
        if (config.mark.orient === config$2.Orient.HORIZONTAL) {
            p.width = size(model.encoding().size, model.scaleName(channel.SIZE), config, (model.scale(channel.X) || {}).bandSize);
            p.height = { value: config.mark.tickThickness };
        }
        else {
            p.width = { value: config.mark.tickThickness };
            p.height = size(model.encoding().size, model.scaleName(channel.SIZE), config, (model.scale(channel.Y) || {}).bandSize);
        }
        common.applyColorAndOpacity(p, model);
        return p;
    }
    tick.properties = properties;
    function x(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.X === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
            else if (fieldDef.value) {
                return { value: fieldDef.value };
            }
        }
        return { value: config.scale.bandSize / 2 };
    }
    function y(fieldDef, scaleName, stack, config) {
        if (fieldDef) {
            if (stack && channel.Y === stack.fieldChannel) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { suffix: 'end' })
                };
            }
            else if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fielddef.field(fieldDef, { binSuffix: 'mid' })
                };
            }
            else if (fieldDef.value) {
                return { value: fieldDef.value };
            }
        }
        return { value: config.scale.bandSize / 2 };
    }
    function size(fieldDef, scaleName, config, scaleBandSize) {
        if (fieldDef) {
            if (fieldDef.field) {
                return {
                    scale: scaleName,
                    field: fieldDef.field
                };
            }
            else if (fieldDef.value !== undefined) {
                return { value: fieldDef.value };
            }
        }
        if (config.mark.tickSize) {
            return { value: config.mark.tickSize };
        }
        var bandSize = scaleBandSize !== undefined ?
            scaleBandSize :
            config.scale.bandSize;
        return { value: bandSize / 1.5 };
    }
})(tick = exports.tick || (exports.tick = {}));
});
var tick_2 = tick_1.tick;

var markCompiler = {
    area: area_1$1.area,
    bar: bar_1.bar,
    line: line_1$1.line,
    point: point_1.point,
    text: text_1$2.text,
    tick: tick_1.tick,
    rule: rule_1$1.rule,
    circle: point_1.circle,
    square: point_1.square
};
function parseMark$1(model) {
    if (util$3.contains([mark$1.LINE, mark$1.AREA], model.mark())) {
        return parsePathMark(model);
    }
    else {
        return parseNonPathMark(model);
    }
}
var parseMark_1 = parseMark$1;
function parsePathMark(model) {
    var mark = model.mark();
    var isFaceted = model.parent() && model.parent().isFacet();
    var dataFrom = { data: model.dataTable() };
    var details = detailFields(model);
    var pathMarks = [
        {
            name: model.name('marks'),
            type: markCompiler[mark].markType(),
            from: util$3.extend(isFaceted || details.length > 0 ? {} : dataFrom, { transform: [{ type: 'sort', by: sortPathBy(model) }] }),
            properties: { update: markCompiler[mark].properties(model) }
        }
    ];
    if (details.length > 0) {
        var facetTransform = { type: 'facet', groupby: details };
        var transform = model.stack() ?
            stackTransforms(model, true).concat(facetTransform) :
            [].concat(facetTransform, model.has(channel.ORDER) ? [{ type: 'sort', by: sortBy(model) }] : []);
        return [{
                name: model.name('pathgroup'),
                type: 'group',
                from: util$3.extend(isFaceted ? {} : dataFrom, { transform: transform }),
                properties: {
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
function parseNonPathMark(model) {
    var mark = model.mark();
    var isFaceted = model.parent() && model.parent().isFacet();
    var dataFrom = { data: model.dataTable() };
    var marks = [];
    if (mark === mark$1.TEXT &&
        model.has(channel.COLOR) &&
        model.config().mark.applyColorToBackground && !model.has(channel.X) && !model.has(channel.Y)) {
        marks.push(util$3.extend({
            name: model.name('background'),
            type: 'rect'
        }, isFaceted ? {} : { from: dataFrom }, { properties: { update: text_1$2.text.background(model) } }));
    }
    marks.push(util$3.extend({
        name: model.name('marks'),
        type: markCompiler[mark].markType()
    }, (!isFaceted || model.stack() || model.has(channel.ORDER)) ? {
        from: util$3.extend(isFaceted ? {} : dataFrom, model.stack() ?
            { transform: stackTransforms(model, false) } :
            model.has(channel.ORDER) ?
                { transform: [{ type: 'sort', by: sortBy(model) }] } :
                {})
    } : {}, { properties: { update: markCompiler[mark].properties(model) } }));
    return marks;
}
function sortBy(model) {
    if (model.has(channel.ORDER)) {
        var channelDef = model.encoding().order;
        if (channelDef instanceof Array) {
            return channelDef.map(common.sortField);
        }
        else {
            return common.sortField(channelDef);
        }
    }
    return null;
}
function sortPathBy(model) {
    if (model.mark() === mark$1.LINE && model.has(channel.PATH)) {
        var channelDef = model.encoding().path;
        if (channelDef instanceof Array) {
            return channelDef.map(common.sortField);
        }
        else {
            return common.sortField(channelDef);
        }
    }
    else {
        var dimensionChannel = model.config().mark.orient === config$2.Orient.HORIZONTAL ? channel.Y : channel.X;
        var sort$$1 = model.sort(dimensionChannel);
        if (sort.isSortField(sort$$1)) {
            return '-' + fielddef.field({
                aggregate: encoding.isAggregate(model.encoding()) ? sort$$1.op : undefined,
                field: sort$$1.field
            });
        }
        else {
            return '-' + model.field(dimensionChannel, { binSuffix: 'mid' });
        }
    }
}
function detailFields(model) {
    return [channel.COLOR, channel.DETAIL, channel.OPACITY, channel.SHAPE].reduce(function (details, channel$$1) {
        if (model.has(channel$$1) && !model.fieldDef(channel$$1).aggregate) {
            details.push(model.field(channel$$1));
        }
        return details;
    }, []);
}
function stackTransforms(model, impute) {
    var stackByFields = getStackByFields(model);
    if (impute) {
        return [imputeTransform(model, stackByFields), stackTransform(model, stackByFields)];
    }
    return [stackTransform(model, stackByFields)];
}
function getStackByFields(model) {
    var encoding$$1 = model.encoding();
    return channel.STACK_GROUP_CHANNELS.reduce(function (fields, channel$$1) {
        var channelEncoding = encoding$$1[channel$$1];
        if (encoding.has(encoding$$1, channel$$1)) {
            if (util$3.isArray(channelEncoding)) {
                channelEncoding.forEach(function (fieldDef) {
                    fields.push(fielddef.field(fieldDef));
                });
            }
            else {
                var fieldDef = channelEncoding;
                var scale = model.scale(channel$$1);
                var _field = fielddef.field(fieldDef, {
                    binSuffix: scale && scale.type === scale$3.ScaleType.ORDINAL ? 'range' : 'start'
                });
                if (!!_field) {
                    fields.push(_field);
                }
            }
        }
        return fields;
    }, []);
}
function imputeTransform(model, stackFields) {
    var stack = model.stack();
    return {
        type: 'impute',
        field: model.field(stack.fieldChannel),
        groupby: stackFields,
        orderby: [model.field(stack.groupbyChannel, { binSuffix: 'mid' })],
        method: 'value',
        value: 0
    };
}
function stackTransform(model, stackFields) {
    var stack = model.stack();
    var encoding$$1 = model.encoding();
    var sortby = model.has(channel.ORDER) ?
        (util$3.isArray(encoding$$1[channel.ORDER]) ? encoding$$1[channel.ORDER] : [encoding$$1[channel.ORDER]]).map(common.sortField) :
        stackFields.map(function (field) {
            return '-' + field;
        });
    var valName = model.field(stack.fieldChannel);
    var transform = {
        type: 'stack',
        groupby: [model.field(stack.groupbyChannel, { binSuffix: 'mid' }) || 'undefined'],
        field: model.field(stack.fieldChannel),
        sortby: sortby,
        output: {
            start: valName + '_start',
            end: valName + '_end'
        }
    };
    if (stack.offset) {
        transform.offset = stack.offset;
    }
    return transform;
}
var mark$2 = {
	parseMark: parseMark_1
};

var __extends$2 = (commonjsGlobal && commonjsGlobal.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var UnitModel = (function (_super) {
    __extends$2(UnitModel, _super);
    function UnitModel(spec, parent, parentGivenName) {
        _super.call(this, spec, parent, parentGivenName);
        var providedWidth = spec.width !== undefined ? spec.width :
            parent ? parent['width'] : undefined;
        var providedHeight = spec.height !== undefined ? spec.height :
            parent ? parent['height'] : undefined;
        var mark = this._mark = spec.mark;
        var encoding$$1 = this._encoding = this._initEncoding(mark, spec.encoding || {});
        this._stack = stack_1.stack(mark, encoding$$1, ((spec.config || {}).mark || {}).stacked);
        var config = this._config = this._initConfig(spec.config, parent, mark, encoding$$1, this._stack);
        this._scale = this._initScale(mark, encoding$$1, config, providedWidth, providedHeight);
        this._axis = this._initAxis(encoding$$1, config);
        this._legend = this._initLegend(encoding$$1, config);
        this._initSize(mark, this._scale, providedWidth, providedHeight, config.cell, config.scale);
    }
    UnitModel.prototype._initEncoding = function (mark, encoding$$1) {
        encoding$$1 = util$3.duplicate(encoding$$1);
        encoding.forEach(encoding$$1, function (fieldDef, channel$$1) {
            if (!channel.supportMark(channel$$1, mark)) {
                console.warn(channel$$1, 'dropped as it is incompatible with', mark);
                delete fieldDef.field;
                return;
            }
            if (fieldDef.type) {
                fieldDef.type = type.getFullName(fieldDef.type);
            }
            if ((channel$$1 === channel.PATH || channel$$1 === channel.ORDER) && !fieldDef.aggregate && fieldDef.type === type.QUANTITATIVE) {
                fieldDef.aggregate = aggregate.AggregateOp.MIN;
            }
        });
        return encoding$$1;
    };
    UnitModel.prototype._initConfig = function (specConfig, parent, mark, encoding$$1, stack) {
        var config = util$3.mergeDeep(util$3.duplicate(config$2.defaultConfig), parent ? parent.config() : {}, specConfig);
        var hasFacetParent = false;
        while (parent !== null) {
            if (parent.isFacet()) {
                hasFacetParent = true;
                break;
            }
            parent = parent.parent();
        }
        if (hasFacetParent) {
            config.cell = util$3.extend({}, config.cell, config.facet.cell);
        }
        config.mark = config$3.initMarkConfig(mark, encoding$$1, stack, config);
        return config;
    };
    UnitModel.prototype._initScale = function (mark, encoding$$1, config, topLevelWidth, topLevelHeight) {
        return channel.UNIT_SCALE_CHANNELS.reduce(function (_scale, channel$$1) {
            if (encoding.has(encoding$$1, channel$$1) ||
                (channel$$1 === channel.X && encoding.has(encoding$$1, channel.X2)) ||
                (channel$$1 === channel.Y && encoding.has(encoding$$1, channel.Y2))) {
                var channelDef = encoding$$1[channel$$1];
                var scaleSpec = (channelDef || {}).scale || {};
                var _scaleType = scale$4.scaleType(scaleSpec, channelDef, channel$$1, mark);
                var scale = _scale[channel$$1] = util$3.extend({
                    type: _scaleType,
                    round: config.scale.round,
                    padding: config.scale.padding,
                    useRawDomain: config.scale.useRawDomain
                }, scaleSpec);
                scale.bandSize = scale$4.scaleBandSize(scale.type, scale.bandSize, config.scale, channel$$1 === channel.X ? topLevelWidth : topLevelHeight, mark, channel$$1);
            }
            return _scale;
        }, {});
    };
    UnitModel.prototype._initSize = function (mark, scale, width, height, cellConfig, scaleConfig) {
        if (width !== undefined) {
            this._width = width;
        }
        else if (scale[channel.X]) {
            if (scale[channel.X].type !== scale$3.ScaleType.ORDINAL || scale[channel.X].bandSize === scale$3.BANDSIZE_FIT) {
                this._width = cellConfig.width;
            }
        }
        else {
            if (mark === mark$1.TEXT) {
                this._width = scaleConfig.textBandWidth;
            }
            else {
                this._width = scaleConfig.bandSize;
            }
        }
        if (height !== undefined) {
            this._height = height;
        }
        else if (scale[channel.Y]) {
            if (scale[channel.Y].type !== scale$3.ScaleType.ORDINAL || scale[channel.Y].bandSize === scale$3.BANDSIZE_FIT) {
                this._height = cellConfig.height;
            }
        }
        else {
            this._height = scaleConfig.bandSize;
        }
    };
    UnitModel.prototype._initAxis = function (encoding$$1, config) {
        return [channel.X, channel.Y].reduce(function (_axis, channel$$1) {
            if (encoding.has(encoding$$1, channel$$1) ||
                (channel$$1 === channel.X && encoding.has(encoding$$1, channel.X2)) ||
                (channel$$1 === channel.Y && encoding.has(encoding$$1, channel.Y2))) {
                var axisSpec = (encoding$$1[channel$$1] || {}).axis;
                if (axisSpec !== null && axisSpec !== false) {
                    _axis[channel$$1] = util$3.extend({}, config.axis, axisSpec === true ? {} : axisSpec || {});
                }
            }
            return _axis;
        }, {});
    };
    UnitModel.prototype._initLegend = function (encoding$$1, config) {
        return channel.NONSPATIAL_SCALE_CHANNELS.reduce(function (_legend, channel$$1) {
            if (encoding.has(encoding$$1, channel$$1)) {
                var legendSpec = encoding$$1[channel$$1].legend;
                if (legendSpec !== null && legendSpec !== false) {
                    _legend[channel$$1] = util$3.extend({}, config.legend, legendSpec === true ? {} : legendSpec || {});
                }
            }
            return _legend;
        }, {});
    };
    Object.defineProperty(UnitModel.prototype, "width", {
        get: function () {
            return this._width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UnitModel.prototype, "height", {
        get: function () {
            return this._height;
        },
        enumerable: true,
        configurable: true
    });
    UnitModel.prototype.parseData = function () {
        this.component.data = data$2.parseUnitData(this);
    };
    UnitModel.prototype.parseSelectionData = function () {
    };
    UnitModel.prototype.parseLayoutData = function () {
        this.component.layout = layout.parseUnitLayout(this);
    };
    UnitModel.prototype.parseScale = function () {
        this.component.scale = scale$4.parseScaleComponent(this);
    };
    UnitModel.prototype.parseMark = function () {
        this.component.mark = mark$2.parseMark(this);
    };
    UnitModel.prototype.parseAxis = function () {
        this.component.axis = axis$2.parseAxisComponent(this, [channel.X, channel.Y]);
    };
    UnitModel.prototype.parseAxisGroup = function () {
        return null;
    };
    UnitModel.prototype.parseGridGroup = function () {
        return null;
    };
    UnitModel.prototype.parseLegend = function () {
        this.component.legend = legend$2.parseLegendComponent(this);
    };
    UnitModel.prototype.assembleData = function (data) {
        return data$2.assembleData(this, data);
    };
    UnitModel.prototype.assembleLayout = function (layoutData) {
        return layout.assembleLayout(this, layoutData);
    };
    UnitModel.prototype.assembleMarks = function () {
        return this.component.mark;
    };
    UnitModel.prototype.assembleParentGroupProperties = function (cellConfig) {
        return common.applyConfig({}, cellConfig, common.FILL_STROKE_CONFIG.concat(['clip']));
    };
    UnitModel.prototype.channels = function () {
        return channel.UNIT_CHANNELS;
    };
    UnitModel.prototype.mapping = function () {
        return this.encoding();
    };
    UnitModel.prototype.stack = function () {
        return this._stack;
    };
    UnitModel.prototype.toSpec = function (excludeConfig, excludeData) {
        var encoding$$1 = util$3.duplicate(this._encoding);
        var spec;
        spec = {
            mark: this._mark,
            encoding: encoding$$1
        };
        if (!excludeConfig) {
            spec.config = util$3.duplicate(this._config);
        }
        if (!excludeData) {
            spec.data = util$3.duplicate(this._data);
        }
        return spec;
    };
    UnitModel.prototype.mark = function () {
        return this._mark;
    };
    UnitModel.prototype.has = function (channel$$1) {
        return encoding.has(this._encoding, channel$$1);
    };
    UnitModel.prototype.encoding = function () {
        return this._encoding;
    };
    UnitModel.prototype.fieldDef = function (channel$$1) {
        return this._encoding[channel$$1] || {};
    };
    UnitModel.prototype.field = function (channel$$1, opt) {
        if (opt === void 0) { opt = {}; }
        var fieldDef = this.fieldDef(channel$$1);
        if (fieldDef.bin) {
            opt = util$3.extend({
                binSuffix: this.scale(channel$$1).type === scale$3.ScaleType.ORDINAL ? 'range' : 'start'
            }, opt);
        }
        return fielddef.field(fieldDef, opt);
    };
    UnitModel.prototype.dataTable = function () {
        return this.dataName(encoding.isAggregate(this._encoding) ? data$1.SUMMARY : data$1.SOURCE);
    };
    UnitModel.prototype.isUnit = function () {
        return true;
    };
    return UnitModel;
}(model.Model));
var UnitModel_1 = UnitModel;
var unit = {
	UnitModel: UnitModel_1
};

var common = createCommonjsModule(function (module, exports) {
function buildModel(spec, parent, parentGivenName) {
    if (spec$1.isSomeFacetSpec(spec)) {
        return new facet.FacetModel(spec, parent, parentGivenName);
    }
    if (spec$1.isLayerSpec(spec)) {
        return new layer.LayerModel(spec, parent, parentGivenName);
    }
    if (spec$1.isUnitSpec(spec)) {
        return new unit.UnitModel(spec, parent, parentGivenName);
    }
    console.error('Invalid spec.');
    return null;
}
exports.buildModel = buildModel;
exports.STROKE_CONFIG = ['stroke', 'strokeWidth',
    'strokeDash', 'strokeDashOffset', 'strokeOpacity', 'opacity'];
exports.FILL_CONFIG = ['fill', 'fillOpacity',
    'opacity'];
exports.FILL_STROKE_CONFIG = util$3.union(exports.STROKE_CONFIG, exports.FILL_CONFIG);
function applyColorAndOpacity(p, model) {
    var filled = model.config().mark.filled;
    var colorFieldDef = model.encoding().color;
    var opacityFieldDef = model.encoding().opacity;
    if (filled) {
        applyMarkConfig(p, model, exports.FILL_CONFIG);
    }
    else {
        applyMarkConfig(p, model, exports.STROKE_CONFIG);
    }
    var colorValue;
    var opacityValue;
    if (model.has(channel.COLOR)) {
        colorValue = {
            scale: model.scaleName(channel.COLOR),
            field: model.field(channel.COLOR, colorFieldDef.type === type.ORDINAL ? { prefix: 'rank' } : {})
        };
    }
    else if (colorFieldDef && colorFieldDef.value) {
        colorValue = { value: colorFieldDef.value };
    }
    if (model.has(channel.OPACITY)) {
        opacityValue = {
            scale: model.scaleName(channel.OPACITY),
            field: model.field(channel.OPACITY, opacityFieldDef.type === type.ORDINAL ? { prefix: 'rank' } : {})
        };
    }
    else if (opacityFieldDef && opacityFieldDef.value) {
        opacityValue = { value: opacityFieldDef.value };
    }
    if (colorValue !== undefined) {
        if (filled) {
            p.fill = colorValue;
        }
        else {
            p.stroke = colorValue;
        }
    }
    else {
        p[filled ? 'fill' : 'stroke'] = p[filled ? 'fill' : 'stroke'] ||
            { value: model.config().mark.color };
    }
    if (!p.fill && util$3.contains([mark$1.BAR, mark$1.POINT, mark$1.CIRCLE, mark$1.SQUARE], model.mark())) {
        p.fill = { value: 'transparent' };
    }
    if (opacityValue !== undefined) {
        p.opacity = opacityValue;
    }
}
exports.applyColorAndOpacity = applyColorAndOpacity;
function applyConfig(properties, config, propsList) {
    propsList.forEach(function (property) {
        var value = config[property];
        if (value !== undefined) {
            properties[property] = { value: value };
        }
    });
    return properties;
}
exports.applyConfig = applyConfig;
function applyMarkConfig(marksProperties, model, propsList) {
    return applyConfig(marksProperties, model.config().mark, propsList);
}
exports.applyMarkConfig = applyMarkConfig;
function numberFormat(fieldDef, format, config, channel$$1) {
    if (fieldDef.type === type.QUANTITATIVE && !fieldDef.bin) {
        if (format) {
            return format;
        }
        else if (fieldDef.aggregate === aggregate.AggregateOp.COUNT && channel$$1 === channel.TEXT) {
            return 'd';
        }
        return config.numberFormat;
    }
    return undefined;
}
exports.numberFormat = numberFormat;
function sortField(orderChannelDef) {
    return (orderChannelDef.sort === sort.SortOrder.DESCENDING ? '-' : '') +
        fielddef.field(orderChannelDef, { binSuffix: 'mid' });
}
exports.sortField = sortField;
function timeTemplate(templateField, timeUnit, format, shortTimeLabels, config) {
    if (!timeUnit || format) {
        var _format = format || config.timeFormat;
        return '{{' + templateField + ' | time:\'' + _format + '\'}}';
    }
    else {
        return timeunit.template(timeUnit, templateField, shortTimeLabels);
    }
}
exports.timeTemplate = timeTemplate;
});
var common_1 = common.buildModel;
var common_2 = common.STROKE_CONFIG;
var common_3 = common.FILL_CONFIG;
var common_4 = common.FILL_STROKE_CONFIG;
var common_5 = common.applyColorAndOpacity;
var common_6 = common.applyConfig;
var common_7 = common.applyMarkConfig;
var common_8 = common.numberFormat;
var common_9 = common.sortField;
var common_10 = common.timeTemplate;

function compile$2(inputSpec) {
    var spec = spec$1.normalize(inputSpec);
    var model = common.buildModel(spec, null, '');
    model.parse();
    return assemble(model);
}
var compile_2 = compile$2;
function assemble(model) {
    var config = model.config();
    var output = util$3.extend({
        width: 1,
        height: 1,
        padding: 'auto'
    }, config.viewport ? { viewport: config.viewport } : {}, config.background ? { background: config.background } : {}, {
        data: [].concat(model.assembleData([]), model.assembleLayout([])),
        marks: [assembleRootGroup(model)]
    });
    return {
        spec: output
    };
}
function assembleRootGroup(model) {
    var rootGroup = util$3.extend({
        name: model.name('root'),
        type: 'group',
    }, model.description() ? { description: model.description() } : {}, {
        from: { data: model.name(data$1.LAYOUT + '') },
        properties: {
            update: util$3.extend({
                width: { field: model.name('width') },
                height: { field: model.name('height') }
            }, model.assembleParentGroupProperties(model.config().cell))
        }
    });
    return util$3.extend(rootGroup, model.assembleGroup());
}
var assembleRootGroup_1 = assembleRootGroup;
var compile_1 = {
	compile: compile_2,
	assembleRootGroup: assembleRootGroup_1
};



var facet$1 = /*#__PURE__*/Object.freeze({

});

var shorthand = createCommonjsModule(function (module, exports) {
exports.DELIM = '|';
exports.ASSIGN = '=';
exports.TYPE = ',';
exports.FUNC = '_';
function shorten(spec) {
    return 'mark' + exports.ASSIGN + spec.mark +
        exports.DELIM + shortenEncoding(spec.encoding);
}
exports.shorten = shorten;
function parse(shorthand, data, config) {
    var split = shorthand.split(exports.DELIM), mark = split.shift().split(exports.ASSIGN)[1].trim(), encoding$$1 = parseEncoding(split.join(exports.DELIM));
    var spec = {
        mark: mark$1.Mark[mark],
        encoding: encoding$$1
    };
    if (data !== undefined) {
        spec.data = data;
    }
    if (config !== undefined) {
        spec.config = config;
    }
    return spec;
}
exports.parse = parse;
function shortenEncoding(encoding$$1) {
    return encoding.map(encoding$$1, function (fieldDef, channel) {
        return channel + exports.ASSIGN + shortenFieldDef(fieldDef);
    }).join(exports.DELIM);
}
exports.shortenEncoding = shortenEncoding;
function parseEncoding(encodingShorthand) {
    return encodingShorthand.split(exports.DELIM).reduce(function (m, e) {
        var split = e.split(exports.ASSIGN), enctype = split[0].trim(), fieldDefShorthand = split[1];
        m[enctype] = parseFieldDef(fieldDefShorthand);
        return m;
    }, {});
}
exports.parseEncoding = parseEncoding;
function shortenFieldDef(fieldDef) {
    return (fieldDef.aggregate ? fieldDef.aggregate + exports.FUNC : '') +
        (fieldDef.timeUnit ? fieldDef.timeUnit + exports.FUNC : '') +
        (fieldDef.bin ? 'bin' + exports.FUNC : '') +
        (fieldDef.field || '') + exports.TYPE + type.SHORT_TYPE[fieldDef.type];
}
exports.shortenFieldDef = shortenFieldDef;
function shortenFieldDefs(fieldDefs, delim) {
    if (delim === void 0) { delim = exports.DELIM; }
    return fieldDefs.map(shortenFieldDef).join(delim);
}
exports.shortenFieldDefs = shortenFieldDefs;
function parseFieldDef(fieldDefShorthand) {
    var split = fieldDefShorthand.split(exports.TYPE);
    var fieldDef = {
        field: split[0].trim(),
        type: type.TYPE_FROM_SHORT_TYPE[split[1].trim()]
    };
    for (var i = 0; i < aggregate.AGGREGATE_OPS.length; i++) {
        var a = aggregate.AGGREGATE_OPS[i];
        if (fieldDef.field.indexOf(a + '_') === 0) {
            fieldDef.field = fieldDef.field.substr(a.toString().length + 1);
            if (a === aggregate.AggregateOp.COUNT && fieldDef.field.length === 0) {
                fieldDef.field = '*';
            }
            fieldDef.aggregate = a;
            break;
        }
    }
    for (var i = 0; i < timeunit.TIMEUNITS.length; i++) {
        var tu = timeunit.TIMEUNITS[i];
        if (fieldDef.field && fieldDef.field.indexOf(tu + '_') === 0) {
            fieldDef.field = fieldDef.field.substr(fieldDef.field.length + 1);
            fieldDef.timeUnit = tu;
            break;
        }
    }
    if (fieldDef.field && fieldDef.field.indexOf('bin_') === 0) {
        fieldDef.field = fieldDef.field.substr(4);
        fieldDef.bin = true;
    }
    return fieldDef;
}
exports.parseFieldDef = parseFieldDef;
});
var shorthand_1 = shorthand.DELIM;
var shorthand_2 = shorthand.ASSIGN;
var shorthand_3 = shorthand.TYPE;
var shorthand_4 = shorthand.FUNC;
var shorthand_5 = shorthand.shorten;
var shorthand_6 = shorthand.parse;
var shorthand_7 = shorthand.shortenEncoding;
var shorthand_8 = shorthand.parseEncoding;
var shorthand_9 = shorthand.shortenFieldDef;
var shorthand_10 = shorthand.shortenFieldDefs;
var shorthand_11 = shorthand.parseFieldDef;



var transform = /*#__PURE__*/Object.freeze({

});

var validate = createCommonjsModule(function (module, exports) {
exports.DEFAULT_REQUIRED_CHANNEL_MAP = {
    text: ['text'],
    line: ['x', 'y'],
    area: ['x', 'y']
};
exports.DEFAULT_SUPPORTED_CHANNEL_TYPE = {
    bar: util$3.toMap(['row', 'column', 'x', 'y', 'size', 'color', 'detail']),
    line: util$3.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    area: util$3.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    tick: util$3.toMap(['row', 'column', 'x', 'y', 'color', 'detail']),
    circle: util$3.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail']),
    square: util$3.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail']),
    point: util$3.toMap(['row', 'column', 'x', 'y', 'color', 'size', 'detail', 'shape']),
    text: util$3.toMap(['row', 'column', 'size', 'color', 'text'])
};
function getEncodingMappingError(spec, requiredChannelMap, supportedChannelMap) {
    if (requiredChannelMap === void 0) { requiredChannelMap = exports.DEFAULT_REQUIRED_CHANNEL_MAP; }
    if (supportedChannelMap === void 0) { supportedChannelMap = exports.DEFAULT_SUPPORTED_CHANNEL_TYPE; }
    var mark = spec.mark;
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
    if (mark === mark$1.BAR && !encoding.x && !encoding.y) {
        return 'Missing both x and y for bar';
    }
    return null;
}
exports.getEncodingMappingError = getEncodingMappingError;
});
var validate_1 = validate.DEFAULT_REQUIRED_CHANNEL_MAP;
var validate_2 = validate.DEFAULT_SUPPORTED_CHANNEL_TYPE;
var validate_3 = validate.getEncodingMappingError;

var name = "vega-lite";
var author = "Jeffrey Heer, Dominik Moritz, Kanit \"Ham\" Wongsuphasawat";
var version = "1.3.1";
var collaborators = [
	"Kanit Wongsuphasawat <kanitw@gmail.com> (http://kanitw.yellowpigz.com)",
	"Dominik Moritz <domoritz@cs.washington.edu> (http://www.domoritz.de)",
	"Jeffrey Heer <jheer@uw.edu> (http://jheer.org)"
];
var description = "Vega-lite provides a higher-level grammar for visual analysis, comparable to ggplot or Tableau, that generates complete Vega specifications.";
var main = "src/vl.js";
var types$1 = "src/vl.d.ts";
var bin$1 = {
	vl2png: "./bin/vl2png",
	vl2svg: "./bin/vl2svg",
	vl2vg: "./bin/vl2vg"
};
var directories = {
	test: "test"
};
var scripts = {
	build: "browserify src/vl.ts -p tsify -d -s vl | exorcist vega-lite.js.map > vega-lite.js ",
	postbuild: "uglifyjs vega-lite.js -cm --source-map vega-lite.min.js.map > vega-lite.min.js && npm run schema",
	"build:all": "npm run clean && npm run data && npm run build && npm test && npm run lint && npm run build:images",
	"build:images": "npm run data && scripts/generate-images.sh",
	"build:toc": "bundle exec jekyll build --incremental -q && scripts/generate-toc",
	cover: "npm run pretest && istanbul cover node_modules/.bin/_mocha -- --recursive",
	clean: "rm -f vega-lite.* vega-lite-schema.json & find -E src test site -regex '.*\\.(js|js.map|d.ts)' -delete & rm -rf examples/_diff examples/_original examples/_output examples/images && rm -rf data",
	data: "rsync -r node_modules/vega-datasets/data/* data",
	deploy: "scripts/deploy.sh",
	"deploy:gh": "scripts/deploy-gh.sh",
	lint: "tslint -c tslint.json 'src/**/*.ts' 'test/**/*.ts' --exclude '**/*.d.ts'",
	prestart: "npm run build && npm run data && scripts/index-examples",
	start: "npm run watch & browser-sync start --server --files 'vega-lite.js' --index 'test-gallery.html'",
	poststart: "rm examples/all-examples.json",
	schema: "typescript-json-schema --required true src/spec.ts ExtendedSpec > vega-lite-schema.json",
	presite: "tsc && npm run build && bower install && npm run data && npm run build:toc",
	site: "bundle exec jekyll serve --incremental",
	pretest: "tsc && npm run data",
	test: "npm run schema && mocha --recursive --require source-map-support/register test examples",
	"test:debug": "npm run schema && mocha --debug-brk --recursive --require source-map-support/register test examples",
	"watch:build": "watchify src/vl.ts -p tsify -v -d -s vl -o 'exorcist vega-lite.js.map > vega-lite.js'",
	"watch:test": "nodemon -x 'npm test && npm run lint'",
	watch: "nodemon -x 'npm run build && npm test && npm run lint'",
	"x-compile": "./scripts/examples-compile.sh",
	"x-diff": "./scripts/examples-diff.sh"
};
var repository = {
	type: "git",
	url: "https://github.com/vega/vega-lite.git"
};
var license = "BSD-3-Clause";
var bugs = {
	url: "https://github.com/vega/vega-lite/issues"
};
var homepage = "https://github.com/vega/vega-lite";
var devDependencies = {
	"@types/chai": "^3.4.34",
	"@types/d3": "^3.5.36",
	"@types/json-stable-stringify": "^1.0.29",
	"@types/mocha": "^2.2.32",
	"@types/node": "^6.0.45",
	"browser-sync": "~2.17.3",
	browserify: "~13.1.0",
	chai: "~3.5.0",
	cheerio: "~0.22.0",
	exorcist: "~0.4.0",
	istanbul: "~0.4.5",
	mocha: "~3.1.2",
	nodemon: "~1.11.0",
	"source-map-support": "~0.4.2",
	tsify: "~2.0.2",
	tslint: "~3.15.1",
	typescript: "^2.0.3",
	"typescript-json-schema": "~0.2.0",
	"uglify-js": "~2.7.3",
	vega: "~2.6.3",
	"vega-datasets": "vega/vega-datasets#gh-pages",
	watchify: "~3.7.0",
	"yaml-front-matter": "~3.4.0",
	"z-schema": "~3.18.0"
};
var dependencies$1 = {
	datalib: "~1.7.2",
	"json-stable-stringify": "~1.0.1",
	yargs: "~6.3.0"
};
var _package = {
	name: name,
	author: author,
	version: version,
	collaborators: collaborators,
	description: description,
	main: main,
	types: types$1,
	bin: bin$1,
	directories: directories,
	scripts: scripts,
	repository: repository,
	license: license,
	bugs: bugs,
	homepage: homepage,
	devDependencies: devDependencies,
	dependencies: dependencies$1
};

var _package$1 = /*#__PURE__*/Object.freeze({
	name: name,
	author: author,
	version: version,
	collaborators: collaborators,
	description: description,
	main: main,
	types: types$1,
	bin: bin$1,
	directories: directories,
	scripts: scripts,
	repository: repository,
	license: license,
	bugs: bugs,
	homepage: homepage,
	devDependencies: devDependencies,
	dependencies: dependencies$1,
	default: _package
});

var require$$23 = getCjsExportFromNamespace(_package$1);

var axis$3 = axis$1;
var aggregate$1 = aggregate;
var bin$2 = bin;
var channel$1 = channel;
var compile$3 = compile_1.compile;
var config$4 = config$2;
var data$3 = data$1;
var datetime$1 = datetime;
var encoding$1 = encoding;
var facet$2 = facet$1;
var fieldDef = fielddef;
var legend$3 = legend$1;
var mark$3 = mark$1;
var scale$5 = scale$3;
var shorthand$1 = shorthand;
var sort$1 = sort;
var spec$2 = spec$1;
var stack = stack_1;
var timeUnit = timeunit;
var transform$1 = transform;
var type$1 = type;
var util$4 = util$3;
var validate$1 = validate;
var version$1 = require$$23.version;
var vl = {
	axis: axis$3,
	aggregate: aggregate$1,
	bin: bin$2,
	channel: channel$1,
	compile: compile$3,
	config: config$4,
	data: data$3,
	datetime: datetime$1,
	encoding: encoding$1,
	facet: facet$2,
	fieldDef: fieldDef,
	legend: legend$3,
	mark: mark$3,
	scale: scale$5,
	shorthand: shorthand$1,
	sort: sort$1,
	spec: spec$2,
	stack: stack,
	timeUnit: timeUnit,
	transform: transform$1,
	type: type$1,
	util: util$4,
	validate: validate$1,
	version: version$1
};

var $ = vega.util.mutator;
var parameter = {
  init: function(el, param, spec) {
    return (rewrite(param, spec), handle(el, param));
  },
  bind: function(param, view) {
    param.dom.forEach(function(el) { el.__vega__ = view; });
    view.onSignal(param.dom[0].name, function(k, v) { param.set(v); });
  }
};
function rewrite(param, spec) {
  var sg = spec.signals || (spec.signals = []);
  for (var i=0; i<sg.length; ++i) {
    if (sg[i].name === param.signal) break;
  }
  if (i === sg.length) {
    sg.push({
      name: param.signal,
      init: param.value
    });
  }
  (param.rewrite || []).forEach(function(path) {
    $(path)(spec, {signal: param.signal});
  });
}
function handle(el, param) {
  var p = el.append('div')
    .attr('class', 'vega-param');
  p.append('span')
    .attr('class', 'vega-param-name')
    .text(param.name || param.signal);
  var input = form;
  switch (param.type) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range$2; break;
  }
  return input(p, param);
}
function form(el, param) {
  var fm = el.append('input')
    .on('input', update);
  for (var key in param) {
    if (key === 'signal' || key === 'rewrite') continue;
    fm.attr(key, param[key]);
  }
  fm.attr('name', param.signal);
  var node = fm.node();
  return {
    dom: [node],
    set: function(value) { node.value = value; }
  };
}
function checkbox(el, param) {
  var cb = el.append('input')
    .on('change', function() { update.call(this, this.checked); })
    .attr('type', 'checkbox')
    .attr('name', param.signal)
    .attr('checked', param.value || null)
    .node();
  return {
    dom: [cb],
    set: function(value) { cb.checked = !!value || null; }
  };
}
function select(el, param) {
  var sl = el.append('select')
    .attr('name', param.signal)
    .on('change', function() {
      update.call(this, this.options[this.selectedIndex].__data__);
    });
  sl.selectAll('option')
    .data(param.options)
   .enter().append('option')
    .attr('value', vg.util.identity)
    .attr('selected', function(x) { return x === param.value || null; })
    .text(vg.util.identity);
  var node = sl.node();
  return {
    dom: [node],
    set: function(value) {
      var idx = param.options.indexOf(value);
      node.selectedIndex = idx;
    }
  };
}
function radio(el, param) {
  var rg = el.append('span')
    .attr('class', 'vega-param-radio');
  var nodes = param.options.map(function(option) {
    var id = 'vega-option-' + param.signal + '-' + option;
    var rb = rg.append('input')
      .datum(option)
      .on('change', update)
      .attr('id', id)
      .attr('type', 'radio')
      .attr('name', param.signal)
      .attr('value', option)
      .attr('checked', option === param.value || null);
    rg.append('label')
      .attr('for', id)
      .text(option);
    return rb.node();
  });
  return {
    dom: nodes,
    set: function(value) {
      for (var i=0; i<nodes.length; ++i) {
        if (nodes[i].value === value) {
          nodes[i].checked = true;
        }
      }
    }
  };
}
function range$2(el, param) {
  var val = param.value !== undefined ? param.value :
    ((+param.max) + (+param.min)) / 2;
  var rn = el.append('input')
    .on('input', function() {
      lbl.text(this.value);
      update.call(this, +this.value);
    })
    .attr('type', 'range')
    .attr('name', param.signal)
    .attr('value', val)
    .attr('min', param.min)
    .attr('max', param.max)
    .attr('step', param.step || vg.util.bins({
      min: param.min,
      max: param.max,
      maxbins: 100
    }).step);
  var lbl = el.append('label')
    .attr('class', 'vega-range')
    .text(val);
  var node = rn.node();
  return {
    dom: [node],
    set: function(value) {
      node.value = value;
      lbl.text(value);
    }
  };
}
function update(value) {
  if (value === undefined) value = this.__data__ || d3.event.target.value;
  this.__vega__.signal(this.name, value).update();
}

var post = function(window, url, data) {
  var editor = window.open(url),
      wait = 10000,
      step = 250,
      count = ~~(wait/step);
  function listen(evt) {
    if (evt.source === editor) {
      count = 0;
      window.removeEventListener('message', listen, false);
    }
  }
  window.addEventListener('message', listen, false);
  function send() {
    if (count <= 0) return;
    editor.postMessage(data, '*');
    setTimeout(send, step);
    count -= 1;
  }
  setTimeout(send, step);
};

var config$5 = {
  editor_url: 'http://vega.github.io/vega-editor/',
  source_header: '',
  source_footer: ''
};
var MODES = {
  'vega':      'vega',
  'vega-lite': 'vega-lite'
};
var PREPROCESSOR = {
  'vega':      function(vgjson) { return vgjson; },
  'vega-lite': function(vljson) { return vl.compile(vljson).spec; }
};
function load$1(url, arg, prop, el, callback) {
  vega.util.load({url: url}, function(err, data) {
    var opt;
    if (err || !data) {
      console.error(err || ('No data found at ' + url));
    } else {
      if (!arg) {
        opt = JSON.parse(data);
      } else {
        opt = vega.util.extend({}, arg);
        opt[prop] = prop === 'source' ? data : JSON.parse(data);
      }
      embed(el, opt, callback);
    }
  });
}
function embed(el, opt, callback) {
  var cb = callback || function(){},
      params = [], source, spec, mode, config;
  try {
    if (vega.util.isString(opt)) {
      return load$1(opt, null, null, el, callback);
    } else if (opt.source) {
      source = opt.source;
      spec = JSON.parse(source);
    } else if (opt.spec) {
      spec = opt.spec;
      source = JSON.stringify(spec, null, 2);
    } else if (opt.url) {
      return load$1(opt.url, opt, 'source', el, callback);
    } else {
      spec = opt;
      source = JSON.stringify(spec, null, 2);
      opt = {spec: spec, actions: false};
    }
    mode = MODES[opt.mode] || MODES.vega;
    spec = PREPROCESSOR[mode](spec);
    if (vega.util.isString(opt.config)) {
      return load$1(opt.config, opt, 'config', el, callback);
    } else if (opt.config) {
      config = opt.config;
    }
    var div = d3.select(el)
      .classed('vega-embed', true)
      .html('');
    if (opt.parameters) {
      var elp = opt.parameter_el ? d3.select(opt.parameter_el) : div;
      var pdiv = elp.append('div')
        .attr('class', 'vega-params');
      params = opt.parameters.map(function(p) {
        return parameter.init(pdiv, p, spec);
      });
    }
  } catch (err) { cb(err); }
  vega.parse.spec(spec, config, function(error, chart) {
    if (error) { cb(error); return; }
    try {
      var renderer = opt.renderer || 'canvas',
          actions  = opt.actions || {};
      var view = chart({
        el: el,
        data: opt.data || undefined,
        renderer: renderer
      });
      if (opt.actions !== false) {
        var ctrl = div.append('div')
          .attr('class', 'vega-actions');
        if (actions.export !== false) {
          var ext = (renderer==='canvas' ? 'png' : 'svg');
          ctrl.append('a')
            .text('Export as ' + ext.toUpperCase())
            .attr('href', '#')
            .attr('target', '_blank')
            .attr('download', (spec.name || 'vega') + '.' + ext)
            .on('mousedown', function() {
              this.href = view.toImageURL(ext);
              d3.event.preventDefault();
            });
        }
        if (actions.source !== false) {
          ctrl.append('a')
            .text('View Source')
            .attr('href', '#')
            .on('click', function() {
              viewSource(source);
              d3.event.preventDefault();
            });
        }
        if (actions.editor !== false) {
          ctrl.append('a')
            .text('Open in Vega Editor')
            .attr('href', '#')
            .on('click', function() {
              post(window, embed.config.editor_url, {spec: source, mode: mode});
              d3.event.preventDefault();
            });
        }
      }
      params.forEach(function(p) { parameter.bind(p, view); });
      view.update();
      cb(null, {view: view, spec: spec});
    } catch (err) { cb(err); }
  });
}
function viewSource(source) {
  var header = '<html><head>' + config$5.source_header + '</head>' + '<body><pre><code class="json">';
  var footer = '</code></pre>' + config$5.source_footer + '</body></html>';
  var win = window.open('');
  win.document.write(header + source + footer);
  win.document.title = 'Vega JSON Source';
}
embed.config = config$5;
var embed_1 = embed;

var vegaEmbedAll = embed_1;

export default vegaEmbedAll;
