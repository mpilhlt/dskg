var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/webcola/dist/src/powergraph.js
var require_powergraph = __commonJS({
  "node_modules/webcola/dist/src/powergraph.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PowerEdge = /* @__PURE__ */ function() {
      function PowerEdge2(source, target, type) {
        this.source = source;
        this.target = target;
        this.type = type;
      }
      return PowerEdge2;
    }();
    exports.PowerEdge = PowerEdge;
    var Configuration = function() {
      function Configuration2(n, edges, linkAccessor, rootGroup) {
        var _this = this;
        this.linkAccessor = linkAccessor;
        this.modules = new Array(n);
        this.roots = [];
        if (rootGroup) {
          this.initModulesFromGroup(rootGroup);
        } else {
          this.roots.push(new ModuleSet());
          for (var i = 0; i < n; ++i)
            this.roots[0].add(this.modules[i] = new Module(i));
        }
        this.R = edges.length;
        edges.forEach(function(e) {
          var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
          s.outgoing.add(type, t);
          t.incoming.add(type, s);
        });
      }
      Configuration2.prototype.initModulesFromGroup = function(group) {
        var moduleSet = new ModuleSet();
        this.roots.push(moduleSet);
        for (var i = 0; i < group.leaves.length; ++i) {
          var node = group.leaves[i];
          var module2 = new Module(node.id);
          this.modules[node.id] = module2;
          moduleSet.add(module2);
        }
        if (group.groups) {
          for (var j = 0; j < group.groups.length; ++j) {
            var child = group.groups[j];
            var definition = {};
            for (var prop in child)
              if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                definition[prop] = child[prop];
            moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
          }
        }
        return moduleSet;
      };
      Configuration2.prototype.merge = function(a, b, k) {
        if (k === void 0) {
          k = 0;
        }
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        var children = new ModuleSet();
        children.add(a);
        children.add(b);
        var m = new Module(this.modules.length, outInt, inInt, children);
        this.modules.push(m);
        var update = function(s, i, o) {
          s.forAll(function(ms, linktype) {
            ms.forAll(function(n) {
              var nls = n[i];
              nls.add(linktype, m);
              nls.remove(linktype, a);
              nls.remove(linktype, b);
              a[o].remove(linktype, n);
              b[o].remove(linktype, n);
            });
          });
        };
        update(outInt, "incoming", "outgoing");
        update(inInt, "outgoing", "incoming");
        this.R -= inInt.count() + outInt.count();
        this.roots[k].remove(a);
        this.roots[k].remove(b);
        this.roots[k].add(m);
        return m;
      };
      Configuration2.prototype.rootMerges = function(k) {
        if (k === void 0) {
          k = 0;
        }
        var rs = this.roots[k].modules();
        var n = rs.length;
        var merges = new Array(n * (n - 1));
        var ctr = 0;
        for (var i = 0, i_ = n - 1; i < i_; ++i) {
          for (var j = i + 1; j < n; ++j) {
            var a = rs[i], b = rs[j];
            merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a, b };
            ctr++;
          }
        }
        return merges;
      };
      Configuration2.prototype.greedyMerge = function() {
        for (var i = 0; i < this.roots.length; ++i) {
          if (this.roots[i].modules().length < 2)
            continue;
          var ms = this.rootMerges(i).sort(function(a, b) {
            return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges;
          });
          var m = ms[0];
          if (m.nEdges >= this.R)
            continue;
          this.merge(m.a, m.b, i);
          return true;
        }
      };
      Configuration2.prototype.nEdges = function(a, b) {
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        return this.R - inInt.count() - outInt.count();
      };
      Configuration2.prototype.getGroupHierarchy = function(retargetedEdges) {
        var _this = this;
        var groups = [];
        var root = {};
        toGroups(this.roots[0], root, groups);
        var es = this.allEdges();
        es.forEach(function(e) {
          var a = _this.modules[e.source];
          var b = _this.modules[e.target];
          retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
        });
        return groups;
      };
      Configuration2.prototype.allEdges = function() {
        var es = [];
        Configuration2.getEdges(this.roots[0], es);
        return es;
      };
      Configuration2.getEdges = function(modules, es) {
        modules.forAll(function(m) {
          m.getEdges(es);
          Configuration2.getEdges(m.children, es);
        });
      };
      return Configuration2;
    }();
    exports.Configuration = Configuration;
    function toGroups(modules, group, groups) {
      modules.forAll(function(m) {
        if (m.isLeaf()) {
          if (!group.leaves)
            group.leaves = [];
          group.leaves.push(m.id);
        } else {
          var g = group;
          m.gid = groups.length;
          if (!m.isIsland() || m.isPredefined()) {
            g = { id: m.gid };
            if (m.isPredefined())
              for (var prop in m.definition)
                g[prop] = m.definition[prop];
            if (!group.groups)
              group.groups = [];
            group.groups.push(m.gid);
            groups.push(g);
          }
          toGroups(m.children, g, groups);
        }
      });
    }
    var Module = function() {
      function Module2(id, outgoing, incoming, children, definition) {
        if (outgoing === void 0) {
          outgoing = new LinkSets();
        }
        if (incoming === void 0) {
          incoming = new LinkSets();
        }
        if (children === void 0) {
          children = new ModuleSet();
        }
        this.id = id;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.children = children;
        this.definition = definition;
      }
      Module2.prototype.getEdges = function(es) {
        var _this = this;
        this.outgoing.forAll(function(ms, edgetype) {
          ms.forAll(function(target) {
            es.push(new PowerEdge(_this.id, target.id, edgetype));
          });
        });
      };
      Module2.prototype.isLeaf = function() {
        return this.children.count() === 0;
      };
      Module2.prototype.isIsland = function() {
        return this.outgoing.count() === 0 && this.incoming.count() === 0;
      };
      Module2.prototype.isPredefined = function() {
        return typeof this.definition !== "undefined";
      };
      return Module2;
    }();
    exports.Module = Module;
    function intersection(m, n) {
      var i = {};
      for (var v in m)
        if (v in n)
          i[v] = m[v];
      return i;
    }
    var ModuleSet = function() {
      function ModuleSet2() {
        this.table = {};
      }
      ModuleSet2.prototype.count = function() {
        return Object.keys(this.table).length;
      };
      ModuleSet2.prototype.intersection = function(other) {
        var result = new ModuleSet2();
        result.table = intersection(this.table, other.table);
        return result;
      };
      ModuleSet2.prototype.intersectionCount = function(other) {
        return this.intersection(other).count();
      };
      ModuleSet2.prototype.contains = function(id) {
        return id in this.table;
      };
      ModuleSet2.prototype.add = function(m) {
        this.table[m.id] = m;
      };
      ModuleSet2.prototype.remove = function(m) {
        delete this.table[m.id];
      };
      ModuleSet2.prototype.forAll = function(f) {
        for (var mid in this.table) {
          f(this.table[mid]);
        }
      };
      ModuleSet2.prototype.modules = function() {
        var vs = [];
        this.forAll(function(m) {
          if (!m.isPredefined())
            vs.push(m);
        });
        return vs;
      };
      return ModuleSet2;
    }();
    exports.ModuleSet = ModuleSet;
    var LinkSets = function() {
      function LinkSets2() {
        this.sets = {};
        this.n = 0;
      }
      LinkSets2.prototype.count = function() {
        return this.n;
      };
      LinkSets2.prototype.contains = function(id) {
        var result = false;
        this.forAllModules(function(m) {
          if (!result && m.id == id) {
            result = true;
          }
        });
        return result;
      };
      LinkSets2.prototype.add = function(linktype, m) {
        var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
        s.add(m);
        ++this.n;
      };
      LinkSets2.prototype.remove = function(linktype, m) {
        var ms = this.sets[linktype];
        ms.remove(m);
        if (ms.count() === 0) {
          delete this.sets[linktype];
        }
        --this.n;
      };
      LinkSets2.prototype.forAll = function(f) {
        for (var linktype in this.sets) {
          f(this.sets[linktype], Number(linktype));
        }
      };
      LinkSets2.prototype.forAllModules = function(f) {
        this.forAll(function(ms, lt) {
          return ms.forAll(f);
        });
      };
      LinkSets2.prototype.intersection = function(other) {
        var result = new LinkSets2();
        this.forAll(function(ms, lt) {
          if (lt in other.sets) {
            var i = ms.intersection(other.sets[lt]), n = i.count();
            if (n > 0) {
              result.sets[lt] = i;
              result.n += n;
            }
          }
        });
        return result;
      };
      return LinkSets2;
    }();
    exports.LinkSets = LinkSets;
    function getGroups(nodes, links, la, rootGroup) {
      var n = nodes.length, c = new Configuration(n, links, la, rootGroup);
      while (c.greedyMerge())
        ;
      var powerEdges = [];
      var g = c.getGroupHierarchy(powerEdges);
      powerEdges.forEach(function(e) {
        var f = function(end) {
          var g2 = e[end];
          if (typeof g2 == "number")
            e[end] = nodes[g2];
        };
        f("source");
        f("target");
      });
      return { groups: g, powerEdges };
    }
    exports.getGroups = getGroups;
  }
});

// node_modules/webcola/dist/src/linklengths.js
var require_linklengths = __commonJS({
  "node_modules/webcola/dist/src/linklengths.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function unionCount(a, b) {
      var u = {};
      for (var i in a)
        u[i] = {};
      for (var i in b)
        u[i] = {};
      return Object.keys(u).length;
    }
    function intersectionCount(a, b) {
      var n = 0;
      for (var i in a)
        if (typeof b[i] !== "undefined")
          ++n;
      return n;
    }
    function getNeighbours(links, la) {
      var neighbours = {};
      var addNeighbours = function(u, v) {
        if (typeof neighbours[u] === "undefined")
          neighbours[u] = {};
        neighbours[u][v] = {};
      };
      links.forEach(function(e) {
        var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
        addNeighbours(u, v);
        addNeighbours(v, u);
      });
      return neighbours;
    }
    function computeLinkLengths(links, w, f, la) {
      var neighbours = getNeighbours(links, la);
      links.forEach(function(l) {
        var a = neighbours[la.getSourceIndex(l)];
        var b = neighbours[la.getTargetIndex(l)];
        la.setLength(l, 1 + w * f(a, b));
      });
    }
    function symmetricDiffLinkLengths(links, la, w) {
      if (w === void 0) {
        w = 1;
      }
      computeLinkLengths(links, w, function(a, b) {
        return Math.sqrt(unionCount(a, b) - intersectionCount(a, b));
      }, la);
    }
    exports.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
    function jaccardLinkLengths(links, la, w) {
      if (w === void 0) {
        w = 1;
      }
      computeLinkLengths(links, w, function(a, b) {
        return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
      }, la);
    }
    exports.jaccardLinkLengths = jaccardLinkLengths;
    function generateDirectedEdgeConstraints(n, links, axis, la) {
      var components = stronglyConnectedComponents(n, links, la);
      var nodes = {};
      components.forEach(function(c, i) {
        return c.forEach(function(v) {
          return nodes[v] = i;
        });
      });
      var constraints = [];
      links.forEach(function(l) {
        var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
        if (u !== v) {
          constraints.push({
            axis,
            left: ui,
            right: vi,
            gap: la.getMinSeparation(l)
          });
        }
      });
      return constraints;
    }
    exports.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
    function stronglyConnectedComponents(numVertices, edges, la) {
      var nodes = [];
      var index = 0;
      var stack = [];
      var components = [];
      function strongConnect(v2) {
        v2.index = v2.lowlink = index++;
        stack.push(v2);
        v2.onStack = true;
        for (var _i2 = 0, _a2 = v2.out; _i2 < _a2.length; _i2++) {
          var w2 = _a2[_i2];
          if (typeof w2.index === "undefined") {
            strongConnect(w2);
            v2.lowlink = Math.min(v2.lowlink, w2.lowlink);
          } else if (w2.onStack) {
            v2.lowlink = Math.min(v2.lowlink, w2.index);
          }
        }
        if (v2.lowlink === v2.index) {
          var component = [];
          while (stack.length) {
            w2 = stack.pop();
            w2.onStack = false;
            component.push(w2);
            if (w2 === v2)
              break;
          }
          components.push(component.map(function(v3) {
            return v3.id;
          }));
        }
      }
      for (var i = 0; i < numVertices; i++) {
        nodes.push({ id: i, out: [] });
      }
      for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var e = edges_1[_i];
        var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
        v_1.out.push(w);
      }
      for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
        var v = nodes_1[_a];
        if (typeof v.index === "undefined")
          strongConnect(v);
      }
      return components;
    }
    exports.stronglyConnectedComponents = stronglyConnectedComponents;
  }
});

// node_modules/webcola/dist/src/descent.js
var require_descent = __commonJS({
  "node_modules/webcola/dist/src/descent.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Locks = function() {
      function Locks2() {
        this.locks = {};
      }
      Locks2.prototype.add = function(id, x) {
        this.locks[id] = x;
      };
      Locks2.prototype.clear = function() {
        this.locks = {};
      };
      Locks2.prototype.isEmpty = function() {
        for (var l in this.locks)
          return false;
        return true;
      };
      Locks2.prototype.apply = function(f) {
        for (var l in this.locks) {
          f(Number(l), this.locks[l]);
        }
      };
      return Locks2;
    }();
    exports.Locks = Locks;
    var Descent = function() {
      function Descent2(x, D, G) {
        if (G === void 0) {
          G = null;
        }
        this.D = D;
        this.G = G;
        this.threshold = 1e-4;
        this.numGridSnapNodes = 0;
        this.snapGridSize = 100;
        this.snapStrength = 1e3;
        this.scaleSnapByMaxH = false;
        this.random = new PseudoRandom();
        this.project = null;
        this.x = x;
        this.k = x.length;
        var n = this.n = x[0].length;
        this.H = new Array(this.k);
        this.g = new Array(this.k);
        this.Hd = new Array(this.k);
        this.a = new Array(this.k);
        this.b = new Array(this.k);
        this.c = new Array(this.k);
        this.d = new Array(this.k);
        this.e = new Array(this.k);
        this.ia = new Array(this.k);
        this.ib = new Array(this.k);
        this.xtmp = new Array(this.k);
        this.locks = new Locks();
        this.minD = Number.MAX_VALUE;
        var i = n, j;
        while (i--) {
          j = n;
          while (--j > i) {
            var d = D[i][j];
            if (d > 0 && d < this.minD) {
              this.minD = d;
            }
          }
        }
        if (this.minD === Number.MAX_VALUE)
          this.minD = 1;
        i = this.k;
        while (i--) {
          this.g[i] = new Array(n);
          this.H[i] = new Array(n);
          j = n;
          while (j--) {
            this.H[i][j] = new Array(n);
          }
          this.Hd[i] = new Array(n);
          this.a[i] = new Array(n);
          this.b[i] = new Array(n);
          this.c[i] = new Array(n);
          this.d[i] = new Array(n);
          this.e[i] = new Array(n);
          this.ia[i] = new Array(n);
          this.ib[i] = new Array(n);
          this.xtmp[i] = new Array(n);
        }
      }
      Descent2.createSquareMatrix = function(n, f) {
        var M = new Array(n);
        for (var i = 0; i < n; ++i) {
          M[i] = new Array(n);
          for (var j = 0; j < n; ++j) {
            M[i][j] = f(i, j);
          }
        }
        return M;
      };
      Descent2.prototype.offsetDir = function() {
        var _this = this;
        var u = new Array(this.k);
        var l = 0;
        for (var i = 0; i < this.k; ++i) {
          var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
          l += x * x;
        }
        l = Math.sqrt(l);
        return u.map(function(x2) {
          return x2 *= _this.minD / l;
        });
      };
      Descent2.prototype.computeDerivatives = function(x) {
        var _this = this;
        var n = this.n;
        if (n < 1)
          return;
        var i;
        var d = new Array(this.k);
        var d2 = new Array(this.k);
        var Huu = new Array(this.k);
        var maxH = 0;
        for (var u = 0; u < n; ++u) {
          for (i = 0; i < this.k; ++i)
            Huu[i] = this.g[i][u] = 0;
          for (var v = 0; v < n; ++v) {
            if (u === v)
              continue;
            var maxDisplaces = n;
            while (maxDisplaces--) {
              var sd2 = 0;
              for (i = 0; i < this.k; ++i) {
                var dx = d[i] = x[i][u] - x[i][v];
                sd2 += d2[i] = dx * dx;
              }
              if (sd2 > 1e-9)
                break;
              var rd = this.offsetDir();
              for (i = 0; i < this.k; ++i)
                x[i][v] += rd[i];
            }
            var l = Math.sqrt(sd2);
            var D = this.D[u][v];
            var weight = this.G != null ? this.G[u][v] : 1;
            if (weight > 1 && l > D || !isFinite(D)) {
              for (i = 0; i < this.k; ++i)
                this.H[i][u][v] = 0;
              continue;
            }
            if (weight > 1) {
              weight = 1;
            }
            var D2 = D * D;
            var gs = 2 * weight * (l - D) / (D2 * l);
            var l3 = l * l * l;
            var hs = 2 * -weight / (D2 * l3);
            if (!isFinite(gs))
              console.log(gs);
            for (i = 0; i < this.k; ++i) {
              this.g[i][u] += d[i] * gs;
              Huu[i] -= this.H[i][u][v] = hs * (l3 + D * (d2[i] - sd2) + l * sd2);
            }
          }
          for (i = 0; i < this.k; ++i)
            maxH = Math.max(maxH, this.H[i][u][u] = Huu[i]);
        }
        var r = this.snapGridSize / 2;
        var g = this.snapGridSize;
        var w = this.snapStrength;
        var k = w / (r * r);
        var numNodes = this.numGridSnapNodes;
        for (var u = 0; u < numNodes; ++u) {
          for (i = 0; i < this.k; ++i) {
            var xiu = this.x[i][u];
            var m = xiu / g;
            var f = m % 1;
            var q = m - f;
            var a = Math.abs(f);
            var dx = a <= 0.5 ? xiu - q * g : xiu > 0 ? xiu - (q + 1) * g : xiu - (q - 1) * g;
            if (-r < dx && dx <= r) {
              if (this.scaleSnapByMaxH) {
                this.g[i][u] += maxH * k * dx;
                this.H[i][u][u] += maxH * k;
              } else {
                this.g[i][u] += k * dx;
                this.H[i][u][u] += k;
              }
            }
          }
        }
        if (!this.locks.isEmpty()) {
          this.locks.apply(function(u2, p) {
            for (i = 0; i < _this.k; ++i) {
              _this.H[i][u2][u2] += maxH;
              _this.g[i][u2] -= maxH * (p[i] - x[i][u2]);
            }
          });
        }
      };
      Descent2.dotProd = function(a, b) {
        var x = 0, i = a.length;
        while (i--)
          x += a[i] * b[i];
        return x;
      };
      Descent2.rightMultiply = function(m, v, r) {
        var i = m.length;
        while (i--)
          r[i] = Descent2.dotProd(m[i], v);
      };
      Descent2.prototype.computeStepSize = function(d) {
        var numerator = 0, denominator = 0;
        for (var i = 0; i < this.k; ++i) {
          numerator += Descent2.dotProd(this.g[i], d[i]);
          Descent2.rightMultiply(this.H[i], d[i], this.Hd[i]);
          denominator += Descent2.dotProd(d[i], this.Hd[i]);
        }
        if (denominator === 0 || !isFinite(denominator))
          return 0;
        return 1 * numerator / denominator;
      };
      Descent2.prototype.reduceStress = function() {
        this.computeDerivatives(this.x);
        var alpha = this.computeStepSize(this.g);
        for (var i = 0; i < this.k; ++i) {
          this.takeDescentStep(this.x[i], this.g[i], alpha);
        }
        return this.computeStress();
      };
      Descent2.copy = function(a, b) {
        var m = a.length, n = b[0].length;
        for (var i = 0; i < m; ++i) {
          for (var j = 0; j < n; ++j) {
            b[i][j] = a[i][j];
          }
        }
      };
      Descent2.prototype.stepAndProject = function(x0, r, d, stepSize) {
        Descent2.copy(x0, r);
        this.takeDescentStep(r[0], d[0], stepSize);
        if (this.project)
          this.project[0](x0[0], x0[1], r[0]);
        this.takeDescentStep(r[1], d[1], stepSize);
        if (this.project)
          this.project[1](r[0], x0[1], r[1]);
        for (var i = 2; i < this.k; i++)
          this.takeDescentStep(r[i], d[i], stepSize);
      };
      Descent2.mApply = function(m, n, f) {
        var i = m;
        while (i-- > 0) {
          var j = n;
          while (j-- > 0)
            f(i, j);
        }
      };
      Descent2.prototype.matrixApply = function(f) {
        Descent2.mApply(this.k, this.n, f);
      };
      Descent2.prototype.computeNextPosition = function(x0, r) {
        var _this = this;
        this.computeDerivatives(x0);
        var alpha = this.computeStepSize(this.g);
        this.stepAndProject(x0, r, this.g, alpha);
        if (this.project) {
          this.matrixApply(function(i, j) {
            return _this.e[i][j] = x0[i][j] - r[i][j];
          });
          var beta = this.computeStepSize(this.e);
          beta = Math.max(0.2, Math.min(beta, 1));
          this.stepAndProject(x0, r, this.e, beta);
        }
      };
      Descent2.prototype.run = function(iterations) {
        var stress = Number.MAX_VALUE, converged = false;
        while (!converged && iterations-- > 0) {
          var s = this.rungeKutta();
          converged = Math.abs(stress / s - 1) < this.threshold;
          stress = s;
        }
        return stress;
      };
      Descent2.prototype.rungeKutta = function() {
        var _this = this;
        this.computeNextPosition(this.x, this.a);
        Descent2.mid(this.x, this.a, this.ia);
        this.computeNextPosition(this.ia, this.b);
        Descent2.mid(this.x, this.b, this.ib);
        this.computeNextPosition(this.ib, this.c);
        this.computeNextPosition(this.c, this.d);
        var disp = 0;
        this.matrixApply(function(i, j) {
          var x = (_this.a[i][j] + 2 * _this.b[i][j] + 2 * _this.c[i][j] + _this.d[i][j]) / 6, d = _this.x[i][j] - x;
          disp += d * d;
          _this.x[i][j] = x;
        });
        return disp;
      };
      Descent2.mid = function(a, b, m) {
        Descent2.mApply(a.length, a[0].length, function(i, j) {
          return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2;
        });
      };
      Descent2.prototype.takeDescentStep = function(x, d, stepSize) {
        for (var i = 0; i < this.n; ++i) {
          x[i] = x[i] - stepSize * d[i];
        }
      };
      Descent2.prototype.computeStress = function() {
        var stress = 0;
        for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
          for (var v = u + 1, n = this.n; v < n; ++v) {
            var l = 0;
            for (var i = 0; i < this.k; ++i) {
              var dx = this.x[i][u] - this.x[i][v];
              l += dx * dx;
            }
            l = Math.sqrt(l);
            var d = this.D[u][v];
            if (!isFinite(d))
              continue;
            var rl = d - l;
            var d2 = d * d;
            stress += rl * rl / d2;
          }
        }
        return stress;
      };
      Descent2.zeroDistance = 1e-10;
      return Descent2;
    }();
    exports.Descent = Descent;
    var PseudoRandom = function() {
      function PseudoRandom2(seed) {
        if (seed === void 0) {
          seed = 1;
        }
        this.seed = seed;
        this.a = 214013;
        this.c = 2531011;
        this.m = 2147483648;
        this.range = 32767;
      }
      PseudoRandom2.prototype.getNext = function() {
        this.seed = (this.seed * this.a + this.c) % this.m;
        return (this.seed >> 16) / this.range;
      };
      PseudoRandom2.prototype.getNextBetween = function(min, max) {
        return min + this.getNext() * (max - min);
      };
      return PseudoRandom2;
    }();
    exports.PseudoRandom = PseudoRandom;
  }
});

// node_modules/webcola/dist/src/vpsc.js
var require_vpsc = __commonJS({
  "node_modules/webcola/dist/src/vpsc.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PositionStats = function() {
      function PositionStats2(scale) {
        this.scale = scale;
        this.AB = 0;
        this.AD = 0;
        this.A2 = 0;
      }
      PositionStats2.prototype.addVariable = function(v) {
        var ai = this.scale / v.scale;
        var bi = v.offset / v.scale;
        var wi = v.weight;
        this.AB += wi * ai * bi;
        this.AD += wi * ai * v.desiredPosition;
        this.A2 += wi * ai * ai;
      };
      PositionStats2.prototype.getPosn = function() {
        return (this.AD - this.AB) / this.A2;
      };
      return PositionStats2;
    }();
    exports.PositionStats = PositionStats;
    var Constraint = function() {
      function Constraint2(left, right, gap, equality) {
        if (equality === void 0) {
          equality = false;
        }
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
        this.active = false;
        this.unsatisfiable = false;
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
      }
      Constraint2.prototype.slack = function() {
        return this.unsatisfiable ? Number.MAX_VALUE : this.right.scale * this.right.position() - this.gap - this.left.scale * this.left.position();
      };
      return Constraint2;
    }();
    exports.Constraint = Constraint;
    var Variable = function() {
      function Variable2(desiredPosition, weight, scale) {
        if (weight === void 0) {
          weight = 1;
        }
        if (scale === void 0) {
          scale = 1;
        }
        this.desiredPosition = desiredPosition;
        this.weight = weight;
        this.scale = scale;
        this.offset = 0;
      }
      Variable2.prototype.dfdv = function() {
        return 2 * this.weight * (this.position() - this.desiredPosition);
      };
      Variable2.prototype.position = function() {
        return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
      };
      Variable2.prototype.visitNeighbours = function(prev, f) {
        var ff = function(c, next) {
          return c.active && prev !== next && f(c, next);
        };
        this.cOut.forEach(function(c) {
          return ff(c, c.right);
        });
        this.cIn.forEach(function(c) {
          return ff(c, c.left);
        });
      };
      return Variable2;
    }();
    exports.Variable = Variable;
    var Block = function() {
      function Block2(v) {
        this.vars = [];
        v.offset = 0;
        this.ps = new PositionStats(v.scale);
        this.addVariable(v);
      }
      Block2.prototype.addVariable = function(v) {
        v.block = this;
        this.vars.push(v);
        this.ps.addVariable(v);
        this.posn = this.ps.getPosn();
      };
      Block2.prototype.updateWeightedPosition = function() {
        this.ps.AB = this.ps.AD = this.ps.A2 = 0;
        for (var i = 0, n = this.vars.length; i < n; ++i)
          this.ps.addVariable(this.vars[i]);
        this.posn = this.ps.getPosn();
      };
      Block2.prototype.compute_lm = function(v, u, postAction) {
        var _this = this;
        var dfdv = v.dfdv();
        v.visitNeighbours(u, function(c, next) {
          var _dfdv = _this.compute_lm(next, v, postAction);
          if (next === c.right) {
            dfdv += _dfdv * c.left.scale;
            c.lm = _dfdv;
          } else {
            dfdv += _dfdv * c.right.scale;
            c.lm = -_dfdv;
          }
          postAction(c);
        });
        return dfdv / v.scale;
      };
      Block2.prototype.populateSplitBlock = function(v, prev) {
        var _this = this;
        v.visitNeighbours(prev, function(c, next) {
          next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
          _this.addVariable(next);
          _this.populateSplitBlock(next, v);
        });
      };
      Block2.prototype.traverse = function(visit, acc, v, prev) {
        var _this = this;
        if (v === void 0) {
          v = this.vars[0];
        }
        if (prev === void 0) {
          prev = null;
        }
        v.visitNeighbours(prev, function(c, next) {
          acc.push(visit(c));
          _this.traverse(visit, acc, next, v);
        });
      };
      Block2.prototype.findMinLM = function() {
        var m = null;
        this.compute_lm(this.vars[0], null, function(c) {
          if (!c.equality && (m === null || c.lm < m.lm))
            m = c;
        });
        return m;
      };
      Block2.prototype.findMinLMBetween = function(lv, rv) {
        this.compute_lm(lv, null, function() {
        });
        var m = null;
        this.findPath(lv, null, rv, function(c, next) {
          if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
            m = c;
        });
        return m;
      };
      Block2.prototype.findPath = function(v, prev, to, visit) {
        var _this = this;
        var endFound = false;
        v.visitNeighbours(prev, function(c, next) {
          if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
            endFound = true;
            visit(c, next);
          }
        });
        return endFound;
      };
      Block2.prototype.isActiveDirectedPathBetween = function(u, v) {
        if (u === v)
          return true;
        var i = u.cOut.length;
        while (i--) {
          var c = u.cOut[i];
          if (c.active && this.isActiveDirectedPathBetween(c.right, v))
            return true;
        }
        return false;
      };
      Block2.split = function(c) {
        c.active = false;
        return [Block2.createSplitBlock(c.left), Block2.createSplitBlock(c.right)];
      };
      Block2.createSplitBlock = function(startVar) {
        var b = new Block2(startVar);
        b.populateSplitBlock(startVar, null);
        return b;
      };
      Block2.prototype.splitBetween = function(vl, vr) {
        var c = this.findMinLMBetween(vl, vr);
        if (c !== null) {
          var bs = Block2.split(c);
          return { constraint: c, lb: bs[0], rb: bs[1] };
        }
        return null;
      };
      Block2.prototype.mergeAcross = function(b, c, dist) {
        c.active = true;
        for (var i = 0, n = b.vars.length; i < n; ++i) {
          var v = b.vars[i];
          v.offset += dist;
          this.addVariable(v);
        }
        this.posn = this.ps.getPosn();
      };
      Block2.prototype.cost = function() {
        var sum = 0, i = this.vars.length;
        while (i--) {
          var v = this.vars[i], d = v.position() - v.desiredPosition;
          sum += d * d * v.weight;
        }
        return sum;
      };
      return Block2;
    }();
    exports.Block = Block;
    var Blocks = function() {
      function Blocks2(vs) {
        this.vs = vs;
        var n = vs.length;
        this.list = new Array(n);
        while (n--) {
          var b = new Block(vs[n]);
          this.list[n] = b;
          b.blockInd = n;
        }
      }
      Blocks2.prototype.cost = function() {
        var sum = 0, i = this.list.length;
        while (i--)
          sum += this.list[i].cost();
        return sum;
      };
      Blocks2.prototype.insert = function(b) {
        b.blockInd = this.list.length;
        this.list.push(b);
      };
      Blocks2.prototype.remove = function(b) {
        var last = this.list.length - 1;
        var swapBlock = this.list[last];
        this.list.length = last;
        if (b !== swapBlock) {
          this.list[b.blockInd] = swapBlock;
          swapBlock.blockInd = b.blockInd;
        }
      };
      Blocks2.prototype.merge = function(c) {
        var l = c.left.block, r = c.right.block;
        var dist = c.right.offset - c.left.offset - c.gap;
        if (l.vars.length < r.vars.length) {
          r.mergeAcross(l, c, dist);
          this.remove(l);
        } else {
          l.mergeAcross(r, c, -dist);
          this.remove(r);
        }
      };
      Blocks2.prototype.forEach = function(f) {
        this.list.forEach(f);
      };
      Blocks2.prototype.updateBlockPositions = function() {
        this.list.forEach(function(b) {
          return b.updateWeightedPosition();
        });
      };
      Blocks2.prototype.split = function(inactive) {
        var _this = this;
        this.updateBlockPositions();
        this.list.forEach(function(b) {
          var v = b.findMinLM();
          if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
            b = v.left.block;
            Block.split(v).forEach(function(nb) {
              return _this.insert(nb);
            });
            _this.remove(b);
            inactive.push(v);
          }
        });
      };
      return Blocks2;
    }();
    exports.Blocks = Blocks;
    var Solver = function() {
      function Solver2(vs, cs) {
        this.vs = vs;
        this.cs = cs;
        this.vs = vs;
        vs.forEach(function(v) {
          v.cIn = [], v.cOut = [];
        });
        this.cs = cs;
        cs.forEach(function(c) {
          c.left.cOut.push(c);
          c.right.cIn.push(c);
        });
        this.inactive = cs.map(function(c) {
          c.active = false;
          return c;
        });
        this.bs = null;
      }
      Solver2.prototype.cost = function() {
        return this.bs.cost();
      };
      Solver2.prototype.setStartingPositions = function(ps) {
        this.inactive = this.cs.map(function(c) {
          c.active = false;
          return c;
        });
        this.bs = new Blocks(this.vs);
        this.bs.forEach(function(b, i) {
          return b.posn = ps[i];
        });
      };
      Solver2.prototype.setDesiredPositions = function(ps) {
        this.vs.forEach(function(v, i) {
          return v.desiredPosition = ps[i];
        });
      };
      Solver2.prototype.mostViolated = function() {
        var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
        for (var i = 0; i < n; ++i) {
          var c = l[i];
          if (c.unsatisfiable)
            continue;
          var slack = c.slack();
          if (c.equality || slack < minSlack) {
            minSlack = slack;
            v = c;
            deletePoint = i;
            if (c.equality)
              break;
          }
        }
        if (deletePoint !== n && (minSlack < Solver2.ZERO_UPPERBOUND && !v.active || v.equality)) {
          l[deletePoint] = l[n - 1];
          l.length = n - 1;
        }
        return v;
      };
      Solver2.prototype.satisfy = function() {
        if (this.bs == null) {
          this.bs = new Blocks(this.vs);
        }
        this.bs.split(this.inactive);
        var v = null;
        while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver2.ZERO_UPPERBOUND && !v.active)) {
          var lb = v.left.block, rb = v.right.block;
          if (lb !== rb) {
            this.bs.merge(v);
          } else {
            if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
              v.unsatisfiable = true;
              continue;
            }
            var split = lb.splitBetween(v.left, v.right);
            if (split !== null) {
              this.bs.insert(split.lb);
              this.bs.insert(split.rb);
              this.bs.remove(lb);
              this.inactive.push(split.constraint);
            } else {
              v.unsatisfiable = true;
              continue;
            }
            if (v.slack() >= 0) {
              this.inactive.push(v);
            } else {
              this.bs.merge(v);
            }
          }
        }
      };
      Solver2.prototype.solve = function() {
        this.satisfy();
        var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
        while (Math.abs(lastcost - cost) > 1e-4) {
          this.satisfy();
          lastcost = cost;
          cost = this.bs.cost();
        }
        return cost;
      };
      Solver2.LAGRANGIAN_TOLERANCE = -1e-4;
      Solver2.ZERO_UPPERBOUND = -1e-10;
      return Solver2;
    }();
    exports.Solver = Solver;
    function removeOverlapInOneDimension(spans, lowerBound, upperBound) {
      var vs = spans.map(function(s) {
        return new Variable(s.desiredCenter);
      });
      var cs = [];
      var n = spans.length;
      for (var i = 0; i < n - 1; i++) {
        var left = spans[i], right = spans[i + 1];
        cs.push(new Constraint(vs[i], vs[i + 1], (left.size + right.size) / 2));
      }
      var leftMost = vs[0], rightMost = vs[n - 1], leftMostSize = spans[0].size / 2, rightMostSize = spans[n - 1].size / 2;
      var vLower = null, vUpper = null;
      if (lowerBound) {
        vLower = new Variable(lowerBound, leftMost.weight * 1e3);
        vs.push(vLower);
        cs.push(new Constraint(vLower, leftMost, leftMostSize));
      }
      if (upperBound) {
        vUpper = new Variable(upperBound, rightMost.weight * 1e3);
        vs.push(vUpper);
        cs.push(new Constraint(rightMost, vUpper, rightMostSize));
      }
      var solver = new Solver(vs, cs);
      solver.solve();
      return {
        newCenters: vs.slice(0, spans.length).map(function(v) {
          return v.position();
        }),
        lowerBound: vLower ? vLower.position() : leftMost.position() - leftMostSize,
        upperBound: vUpper ? vUpper.position() : rightMost.position() + rightMostSize
      };
    }
    exports.removeOverlapInOneDimension = removeOverlapInOneDimension;
  }
});

// node_modules/webcola/dist/src/rbtree.js
var require_rbtree = __commonJS({
  "node_modules/webcola/dist/src/rbtree.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    var TreeBase = function() {
      function TreeBase2() {
        this.findIter = function(data) {
          var res = this._root;
          var iter = this.iterator();
          while (res !== null) {
            var c = this._comparator(data, res.data);
            if (c === 0) {
              iter._cursor = res;
              return iter;
            } else {
              iter._ancestors.push(res);
              res = res.get_child(c > 0);
            }
          }
          return null;
        };
      }
      TreeBase2.prototype.clear = function() {
        this._root = null;
        this.size = 0;
      };
      ;
      TreeBase2.prototype.find = function(data) {
        var res = this._root;
        while (res !== null) {
          var c = this._comparator(data, res.data);
          if (c === 0) {
            return res.data;
          } else {
            res = res.get_child(c > 0);
          }
        }
        return null;
      };
      ;
      TreeBase2.prototype.lowerBound = function(data) {
        return this._bound(data, this._comparator);
      };
      ;
      TreeBase2.prototype.upperBound = function(data) {
        var cmp = this._comparator;
        function reverse_cmp(a, b) {
          return cmp(b, a);
        }
        return this._bound(data, reverse_cmp);
      };
      ;
      TreeBase2.prototype.min = function() {
        var res = this._root;
        if (res === null) {
          return null;
        }
        while (res.left !== null) {
          res = res.left;
        }
        return res.data;
      };
      ;
      TreeBase2.prototype.max = function() {
        var res = this._root;
        if (res === null) {
          return null;
        }
        while (res.right !== null) {
          res = res.right;
        }
        return res.data;
      };
      ;
      TreeBase2.prototype.iterator = function() {
        return new Iterator(this);
      };
      ;
      TreeBase2.prototype.each = function(cb) {
        var it = this.iterator(), data;
        while ((data = it.next()) !== null) {
          cb(data);
        }
      };
      ;
      TreeBase2.prototype.reach = function(cb) {
        var it = this.iterator(), data;
        while ((data = it.prev()) !== null) {
          cb(data);
        }
      };
      ;
      TreeBase2.prototype._bound = function(data, cmp) {
        var cur = this._root;
        var iter = this.iterator();
        while (cur !== null) {
          var c = this._comparator(data, cur.data);
          if (c === 0) {
            iter._cursor = cur;
            return iter;
          }
          iter._ancestors.push(cur);
          cur = cur.get_child(c > 0);
        }
        for (var i = iter._ancestors.length - 1; i >= 0; --i) {
          cur = iter._ancestors[i];
          if (cmp(data, cur.data) > 0) {
            iter._cursor = cur;
            iter._ancestors.length = i;
            return iter;
          }
        }
        iter._ancestors.length = 0;
        return iter;
      };
      ;
      return TreeBase2;
    }();
    exports.TreeBase = TreeBase;
    var Iterator = function() {
      function Iterator2(tree) {
        this._tree = tree;
        this._ancestors = [];
        this._cursor = null;
      }
      Iterator2.prototype.data = function() {
        return this._cursor !== null ? this._cursor.data : null;
      };
      ;
      Iterator2.prototype.next = function() {
        if (this._cursor === null) {
          var root = this._tree._root;
          if (root !== null) {
            this._minNode(root);
          }
        } else {
          if (this._cursor.right === null) {
            var save;
            do {
              save = this._cursor;
              if (this._ancestors.length) {
                this._cursor = this._ancestors.pop();
              } else {
                this._cursor = null;
                break;
              }
            } while (this._cursor.right === save);
          } else {
            this._ancestors.push(this._cursor);
            this._minNode(this._cursor.right);
          }
        }
        return this._cursor !== null ? this._cursor.data : null;
      };
      ;
      Iterator2.prototype.prev = function() {
        if (this._cursor === null) {
          var root = this._tree._root;
          if (root !== null) {
            this._maxNode(root);
          }
        } else {
          if (this._cursor.left === null) {
            var save;
            do {
              save = this._cursor;
              if (this._ancestors.length) {
                this._cursor = this._ancestors.pop();
              } else {
                this._cursor = null;
                break;
              }
            } while (this._cursor.left === save);
          } else {
            this._ancestors.push(this._cursor);
            this._maxNode(this._cursor.left);
          }
        }
        return this._cursor !== null ? this._cursor.data : null;
      };
      ;
      Iterator2.prototype._minNode = function(start) {
        while (start.left !== null) {
          this._ancestors.push(start);
          start = start.left;
        }
        this._cursor = start;
      };
      ;
      Iterator2.prototype._maxNode = function(start) {
        while (start.right !== null) {
          this._ancestors.push(start);
          start = start.right;
        }
        this._cursor = start;
      };
      ;
      return Iterator2;
    }();
    exports.Iterator = Iterator;
    var Node = function() {
      function Node2(data) {
        this.data = data;
        this.left = null;
        this.right = null;
        this.red = true;
      }
      Node2.prototype.get_child = function(dir) {
        return dir ? this.right : this.left;
      };
      ;
      Node2.prototype.set_child = function(dir, val) {
        if (dir) {
          this.right = val;
        } else {
          this.left = val;
        }
      };
      ;
      return Node2;
    }();
    var RBTree = function(_super) {
      __extends(RBTree2, _super);
      function RBTree2(comparator) {
        var _this = _super.call(this) || this;
        _this._root = null;
        _this._comparator = comparator;
        _this.size = 0;
        return _this;
      }
      RBTree2.prototype.insert = function(data) {
        var ret = false;
        if (this._root === null) {
          this._root = new Node(data);
          ret = true;
          this.size++;
        } else {
          var head = new Node(void 0);
          var dir = false;
          var last = false;
          var gp = null;
          var ggp = head;
          var p = null;
          var node = this._root;
          ggp.right = this._root;
          while (true) {
            if (node === null) {
              node = new Node(data);
              p.set_child(dir, node);
              ret = true;
              this.size++;
            } else if (RBTree2.is_red(node.left) && RBTree2.is_red(node.right)) {
              node.red = true;
              node.left.red = false;
              node.right.red = false;
            }
            if (RBTree2.is_red(node) && RBTree2.is_red(p)) {
              var dir2 = ggp.right === gp;
              if (node === p.get_child(last)) {
                ggp.set_child(dir2, RBTree2.single_rotate(gp, !last));
              } else {
                ggp.set_child(dir2, RBTree2.double_rotate(gp, !last));
              }
            }
            var cmp = this._comparator(node.data, data);
            if (cmp === 0) {
              break;
            }
            last = dir;
            dir = cmp < 0;
            if (gp !== null) {
              ggp = gp;
            }
            gp = p;
            p = node;
            node = node.get_child(dir);
          }
          this._root = head.right;
        }
        this._root.red = false;
        return ret;
      };
      ;
      RBTree2.prototype.remove = function(data) {
        if (this._root === null) {
          return false;
        }
        var head = new Node(void 0);
        var node = head;
        node.right = this._root;
        var p = null;
        var gp = null;
        var found = null;
        var dir = true;
        while (node.get_child(dir) !== null) {
          var last = dir;
          gp = p;
          p = node;
          node = node.get_child(dir);
          var cmp = this._comparator(data, node.data);
          dir = cmp > 0;
          if (cmp === 0) {
            found = node;
          }
          if (!RBTree2.is_red(node) && !RBTree2.is_red(node.get_child(dir))) {
            if (RBTree2.is_red(node.get_child(!dir))) {
              var sr = RBTree2.single_rotate(node, dir);
              p.set_child(last, sr);
              p = sr;
            } else if (!RBTree2.is_red(node.get_child(!dir))) {
              var sibling = p.get_child(!last);
              if (sibling !== null) {
                if (!RBTree2.is_red(sibling.get_child(!last)) && !RBTree2.is_red(sibling.get_child(last))) {
                  p.red = false;
                  sibling.red = true;
                  node.red = true;
                } else {
                  var dir2 = gp.right === p;
                  if (RBTree2.is_red(sibling.get_child(last))) {
                    gp.set_child(dir2, RBTree2.double_rotate(p, last));
                  } else if (RBTree2.is_red(sibling.get_child(!last))) {
                    gp.set_child(dir2, RBTree2.single_rotate(p, last));
                  }
                  var gpc = gp.get_child(dir2);
                  gpc.red = true;
                  node.red = true;
                  gpc.left.red = false;
                  gpc.right.red = false;
                }
              }
            }
          }
        }
        if (found !== null) {
          found.data = node.data;
          p.set_child(p.right === node, node.get_child(node.left === null));
          this.size--;
        }
        this._root = head.right;
        if (this._root !== null) {
          this._root.red = false;
        }
        return found !== null;
      };
      ;
      RBTree2.is_red = function(node) {
        return node !== null && node.red;
      };
      RBTree2.single_rotate = function(root, dir) {
        var save = root.get_child(!dir);
        root.set_child(!dir, save.get_child(dir));
        save.set_child(dir, root);
        root.red = true;
        save.red = false;
        return save;
      };
      RBTree2.double_rotate = function(root, dir) {
        root.set_child(!dir, RBTree2.single_rotate(root.get_child(!dir), !dir));
        return RBTree2.single_rotate(root, dir);
      };
      return RBTree2;
    }(TreeBase);
    exports.RBTree = RBTree;
  }
});

// node_modules/webcola/dist/src/rectangle.js
var require_rectangle = __commonJS({
  "node_modules/webcola/dist/src/rectangle.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    var vpsc_1 = require_vpsc();
    var rbtree_1 = require_rbtree();
    function computeGroupBounds(g) {
      g.bounds = typeof g.leaves !== "undefined" ? g.leaves.reduce(function(r, c) {
        return c.bounds.union(r);
      }, Rectangle.empty()) : Rectangle.empty();
      if (typeof g.groups !== "undefined")
        g.bounds = g.groups.reduce(function(r, c) {
          return computeGroupBounds(c).union(r);
        }, g.bounds);
      g.bounds = g.bounds.inflate(g.padding);
      return g.bounds;
    }
    exports.computeGroupBounds = computeGroupBounds;
    var Rectangle = function() {
      function Rectangle2(x, X, y, Y) {
        this.x = x;
        this.X = X;
        this.y = y;
        this.Y = Y;
      }
      Rectangle2.empty = function() {
        return new Rectangle2(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY);
      };
      Rectangle2.prototype.cx = function() {
        return (this.x + this.X) / 2;
      };
      Rectangle2.prototype.cy = function() {
        return (this.y + this.Y) / 2;
      };
      Rectangle2.prototype.overlapX = function(r) {
        var ux = this.cx(), vx = r.cx();
        if (ux <= vx && r.x < this.X)
          return this.X - r.x;
        if (vx <= ux && this.x < r.X)
          return r.X - this.x;
        return 0;
      };
      Rectangle2.prototype.overlapY = function(r) {
        var uy = this.cy(), vy = r.cy();
        if (uy <= vy && r.y < this.Y)
          return this.Y - r.y;
        if (vy <= uy && this.y < r.Y)
          return r.Y - this.y;
        return 0;
      };
      Rectangle2.prototype.setXCentre = function(cx) {
        var dx = cx - this.cx();
        this.x += dx;
        this.X += dx;
      };
      Rectangle2.prototype.setYCentre = function(cy) {
        var dy = cy - this.cy();
        this.y += dy;
        this.Y += dy;
      };
      Rectangle2.prototype.width = function() {
        return this.X - this.x;
      };
      Rectangle2.prototype.height = function() {
        return this.Y - this.y;
      };
      Rectangle2.prototype.union = function(r) {
        return new Rectangle2(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
      };
      Rectangle2.prototype.lineIntersections = function(x1, y1, x2, y2) {
        var sides = [
          [this.x, this.y, this.X, this.y],
          [this.X, this.y, this.X, this.Y],
          [this.X, this.Y, this.x, this.Y],
          [this.x, this.Y, this.x, this.y]
        ];
        var intersections = [];
        for (var i = 0; i < 4; ++i) {
          var r = Rectangle2.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
          if (r !== null)
            intersections.push({ x: r.x, y: r.y });
        }
        return intersections;
      };
      Rectangle2.prototype.rayIntersection = function(x2, y2) {
        var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
        return ints.length > 0 ? ints[0] : null;
      };
      Rectangle2.prototype.vertices = function() {
        return [
          { x: this.x, y: this.y },
          { x: this.X, y: this.y },
          { x: this.X, y: this.Y },
          { x: this.x, y: this.Y }
        ];
      };
      Rectangle2.lineIntersection = function(x1, y1, x2, y2, x3, y3, x4, y4) {
        var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
        if (denominator == 0)
          return null;
        var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
          return {
            x: x1 + a * dx12,
            y: y1 + a * dy12
          };
        }
        return null;
      };
      Rectangle2.prototype.inflate = function(pad) {
        return new Rectangle2(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
      };
      return Rectangle2;
    }();
    exports.Rectangle = Rectangle;
    function makeEdgeBetween(source, target, ah) {
      var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
      return {
        sourceIntersection: si,
        targetIntersection: ti,
        arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
      };
    }
    exports.makeEdgeBetween = makeEdgeBetween;
    function makeEdgeTo(s, target, ah) {
      var ti = target.rayIntersection(s.x, s.y);
      if (!ti)
        ti = { x: target.cx(), y: target.cy() };
      var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
      return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
    }
    exports.makeEdgeTo = makeEdgeTo;
    var Node = /* @__PURE__ */ function() {
      function Node2(v, r, pos) {
        this.v = v;
        this.r = r;
        this.pos = pos;
        this.prev = makeRBTree();
        this.next = makeRBTree();
      }
      return Node2;
    }();
    var Event = /* @__PURE__ */ function() {
      function Event2(isOpen, v, pos) {
        this.isOpen = isOpen;
        this.v = v;
        this.pos = pos;
      }
      return Event2;
    }();
    function compareEvents(a, b) {
      if (a.pos > b.pos) {
        return 1;
      }
      if (a.pos < b.pos) {
        return -1;
      }
      if (a.isOpen) {
        return -1;
      }
      if (b.isOpen) {
        return 1;
      }
      return 0;
    }
    function makeRBTree() {
      return new rbtree_1.RBTree(function(a, b) {
        return a.pos - b.pos;
      });
    }
    var xRect = {
      getCentre: function(r) {
        return r.cx();
      },
      getOpen: function(r) {
        return r.y;
      },
      getClose: function(r) {
        return r.Y;
      },
      getSize: function(r) {
        return r.width();
      },
      makeRect: function(open, close, center, size) {
        return new Rectangle(center - size / 2, center + size / 2, open, close);
      },
      findNeighbours: findXNeighbours
    };
    var yRect = {
      getCentre: function(r) {
        return r.cy();
      },
      getOpen: function(r) {
        return r.x;
      },
      getClose: function(r) {
        return r.X;
      },
      getSize: function(r) {
        return r.height();
      },
      makeRect: function(open, close, center, size) {
        return new Rectangle(open, close, center - size / 2, center + size / 2);
      },
      findNeighbours: findYNeighbours
    };
    function generateGroupConstraints(root, f, minSep, isContained) {
      if (isContained === void 0) {
        isContained = false;
      }
      var padding = root.padding, gn = typeof root.groups !== "undefined" ? root.groups.length : 0, ln = typeof root.leaves !== "undefined" ? root.leaves.length : 0, childConstraints = !gn ? [] : root.groups.reduce(function(ccs, g) {
        return ccs.concat(generateGroupConstraints(g, f, minSep, true));
      }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function(r, v) {
        rs[i] = r;
        vs[i++] = v;
      };
      if (isContained) {
        var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
        root.minVar.desiredPosition = min;
        add(f.makeRect(open, close, min, padding), root.minVar);
        root.maxVar.desiredPosition = max;
        add(f.makeRect(open, close, max, padding), root.maxVar);
      }
      if (ln)
        root.leaves.forEach(function(l) {
          return add(l.bounds, l.variable);
        });
      if (gn)
        root.groups.forEach(function(g) {
          var b2 = g.bounds;
          add(f.makeRect(f.getOpen(b2), f.getClose(b2), f.getCentre(b2), f.getSize(b2)), g.minVar);
        });
      var cs = generateConstraints(rs, vs, f, minSep);
      if (gn) {
        vs.forEach(function(v) {
          v.cOut = [], v.cIn = [];
        });
        cs.forEach(function(c2) {
          c2.left.cOut.push(c2), c2.right.cIn.push(c2);
        });
        root.groups.forEach(function(g) {
          var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
          g.minVar.cIn.forEach(function(c2) {
            return c2.gap += gapAdjustment;
          });
          g.minVar.cOut.forEach(function(c2) {
            c2.left = g.maxVar;
            c2.gap += gapAdjustment;
          });
        });
      }
      return childConstraints.concat(cs);
    }
    function generateConstraints(rs, vars, rect, minSep) {
      var i, n = rs.length;
      var N = 2 * n;
      console.assert(vars.length >= n);
      var events = new Array(N);
      for (i = 0; i < n; ++i) {
        var r = rs[i];
        var v = new Node(vars[i], r, rect.getCentre(r));
        events[i] = new Event(true, v, rect.getOpen(r));
        events[i + n] = new Event(false, v, rect.getClose(r));
      }
      events.sort(compareEvents);
      var cs = new Array();
      var scanline = makeRBTree();
      for (i = 0; i < N; ++i) {
        var e = events[i];
        var v = e.v;
        if (e.isOpen) {
          scanline.insert(v);
          rect.findNeighbours(v, scanline);
        } else {
          scanline.remove(v);
          var makeConstraint = function(l, r2) {
            var sep = (rect.getSize(l.r) + rect.getSize(r2.r)) / 2 + minSep;
            cs.push(new vpsc_1.Constraint(l.v, r2.v, sep));
          };
          var visitNeighbours = function(forward, reverse, mkcon) {
            var u, it = v[forward].iterator();
            while ((u = it[forward]()) !== null) {
              mkcon(u, v);
              u[reverse].remove(v);
            }
          };
          visitNeighbours("prev", "next", function(u, v2) {
            return makeConstraint(u, v2);
          });
          visitNeighbours("next", "prev", function(u, v2) {
            return makeConstraint(v2, u);
          });
        }
      }
      console.assert(scanline.size === 0);
      return cs;
    }
    function findXNeighbours(v, scanline) {
      var f = function(forward, reverse) {
        var it = scanline.findIter(v);
        var u;
        while ((u = it[forward]()) !== null) {
          var uovervX = u.r.overlapX(v.r);
          if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
            v[forward].insert(u);
            u[reverse].insert(v);
          }
          if (uovervX <= 0) {
            break;
          }
        }
      };
      f("next", "prev");
      f("prev", "next");
    }
    function findYNeighbours(v, scanline) {
      var f = function(forward, reverse) {
        var u = scanline.findIter(v)[forward]();
        if (u !== null && u.r.overlapX(v.r) > 0) {
          v[forward].insert(u);
          u[reverse].insert(v);
        }
      };
      f("next", "prev");
      f("prev", "next");
    }
    function generateXConstraints(rs, vars) {
      return generateConstraints(rs, vars, xRect, 1e-6);
    }
    exports.generateXConstraints = generateXConstraints;
    function generateYConstraints(rs, vars) {
      return generateConstraints(rs, vars, yRect, 1e-6);
    }
    exports.generateYConstraints = generateYConstraints;
    function generateXGroupConstraints(root) {
      return generateGroupConstraints(root, xRect, 1e-6);
    }
    exports.generateXGroupConstraints = generateXGroupConstraints;
    function generateYGroupConstraints(root) {
      return generateGroupConstraints(root, yRect, 1e-6);
    }
    exports.generateYGroupConstraints = generateYGroupConstraints;
    function removeOverlaps(rs) {
      var vs = rs.map(function(r) {
        return new vpsc_1.Variable(r.cx());
      });
      var cs = generateXConstraints(rs, vs);
      var solver = new vpsc_1.Solver(vs, cs);
      solver.solve();
      vs.forEach(function(v, i) {
        return rs[i].setXCentre(v.position());
      });
      vs = rs.map(function(r) {
        return new vpsc_1.Variable(r.cy());
      });
      cs = generateYConstraints(rs, vs);
      solver = new vpsc_1.Solver(vs, cs);
      solver.solve();
      vs.forEach(function(v, i) {
        return rs[i].setYCentre(v.position());
      });
    }
    exports.removeOverlaps = removeOverlaps;
    var IndexedVariable = function(_super) {
      __extends(IndexedVariable2, _super);
      function IndexedVariable2(index, w) {
        var _this = _super.call(this, 0, w) || this;
        _this.index = index;
        return _this;
      }
      return IndexedVariable2;
    }(vpsc_1.Variable);
    exports.IndexedVariable = IndexedVariable;
    var Projection = function() {
      function Projection2(nodes, groups, rootGroup, constraints, avoidOverlaps) {
        var _this = this;
        if (rootGroup === void 0) {
          rootGroup = null;
        }
        if (constraints === void 0) {
          constraints = null;
        }
        if (avoidOverlaps === void 0) {
          avoidOverlaps = false;
        }
        this.nodes = nodes;
        this.groups = groups;
        this.rootGroup = rootGroup;
        this.avoidOverlaps = avoidOverlaps;
        this.variables = nodes.map(function(v, i2) {
          return v.variable = new IndexedVariable(i2, 1);
        });
        if (constraints)
          this.createConstraints(constraints);
        if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== "undefined") {
          nodes.forEach(function(v) {
            if (!v.width || !v.height) {
              v.bounds = new Rectangle(v.x, v.x, v.y, v.y);
              return;
            }
            var w2 = v.width / 2, h2 = v.height / 2;
            v.bounds = new Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
          });
          computeGroupBounds(rootGroup);
          var i = nodes.length;
          groups.forEach(function(g) {
            _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
            _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
          });
        }
      }
      Projection2.prototype.createSeparation = function(c) {
        return new vpsc_1.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
      };
      Projection2.prototype.makeFeasible = function(c) {
        var _this = this;
        if (!this.avoidOverlaps)
          return;
        var axis = "x", dim = "width";
        if (c.axis === "x")
          axis = "y", dim = "height";
        var vs = c.offsets.map(function(o) {
          return _this.nodes[o.node];
        }).sort(function(a, b) {
          return a[axis] - b[axis];
        });
        var p = null;
        vs.forEach(function(v) {
          if (p) {
            var nextPos = p[axis] + p[dim];
            if (nextPos > v[axis]) {
              v[axis] = nextPos;
            }
          }
          p = v;
        });
      };
      Projection2.prototype.createAlignment = function(c) {
        var _this = this;
        var u = this.nodes[c.offsets[0].node].variable;
        this.makeFeasible(c);
        var cs = c.axis === "x" ? this.xConstraints : this.yConstraints;
        c.offsets.slice(1).forEach(function(o) {
          var v = _this.nodes[o.node].variable;
          cs.push(new vpsc_1.Constraint(u, v, o.offset, true));
        });
      };
      Projection2.prototype.createConstraints = function(constraints) {
        var _this = this;
        var isSep = function(c) {
          return typeof c.type === "undefined" || c.type === "separation";
        };
        this.xConstraints = constraints.filter(function(c) {
          return c.axis === "x" && isSep(c);
        }).map(function(c) {
          return _this.createSeparation(c);
        });
        this.yConstraints = constraints.filter(function(c) {
          return c.axis === "y" && isSep(c);
        }).map(function(c) {
          return _this.createSeparation(c);
        });
        constraints.filter(function(c) {
          return c.type === "alignment";
        }).forEach(function(c) {
          return _this.createAlignment(c);
        });
      };
      Projection2.prototype.setupVariablesAndBounds = function(x0, y0, desired, getDesired) {
        this.nodes.forEach(function(v, i) {
          if (v.fixed) {
            v.variable.weight = v.fixedWeight ? v.fixedWeight : 1e3;
            desired[i] = getDesired(v);
          } else {
            v.variable.weight = 1;
          }
          var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
          var ix = x0[i], iy = y0[i];
          v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
        });
      };
      Projection2.prototype.xProject = function(x0, y0, x) {
        if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
          return;
        this.project(x0, y0, x0, x, function(v) {
          return v.px;
        }, this.xConstraints, generateXGroupConstraints, function(v) {
          return v.bounds.setXCentre(x[v.variable.index] = v.variable.position());
        }, function(g) {
          var xmin = x[g.minVar.index] = g.minVar.position();
          var xmax = x[g.maxVar.index] = g.maxVar.position();
          var p2 = g.padding / 2;
          g.bounds.x = xmin - p2;
          g.bounds.X = xmax + p2;
        });
      };
      Projection2.prototype.yProject = function(x0, y0, y) {
        if (!this.rootGroup && !this.yConstraints)
          return;
        this.project(x0, y0, y0, y, function(v) {
          return v.py;
        }, this.yConstraints, generateYGroupConstraints, function(v) {
          return v.bounds.setYCentre(y[v.variable.index] = v.variable.position());
        }, function(g) {
          var ymin = y[g.minVar.index] = g.minVar.position();
          var ymax = y[g.maxVar.index] = g.maxVar.position();
          var p2 = g.padding / 2;
          g.bounds.y = ymin - p2;
          ;
          g.bounds.Y = ymax + p2;
        });
      };
      Projection2.prototype.projectFunctions = function() {
        var _this = this;
        return [
          function(x0, y0, x) {
            return _this.xProject(x0, y0, x);
          },
          function(x0, y0, y) {
            return _this.yProject(x0, y0, y);
          }
        ];
      };
      Projection2.prototype.project = function(x0, y0, start, desired, getDesired, cs, generateConstraints2, updateNodeBounds, updateGroupBounds) {
        this.setupVariablesAndBounds(x0, y0, desired, getDesired);
        if (this.rootGroup && this.avoidOverlaps) {
          computeGroupBounds(this.rootGroup);
          cs = cs.concat(generateConstraints2(this.rootGroup));
        }
        this.solve(this.variables, cs, start, desired);
        this.nodes.forEach(updateNodeBounds);
        if (this.rootGroup && this.avoidOverlaps) {
          this.groups.forEach(updateGroupBounds);
          computeGroupBounds(this.rootGroup);
        }
      };
      Projection2.prototype.solve = function(vs, cs, starting, desired) {
        var solver = new vpsc_1.Solver(vs, cs);
        solver.setStartingPositions(starting);
        solver.setDesiredPositions(desired);
        solver.solve();
      };
      return Projection2;
    }();
    exports.Projection = Projection;
  }
});

// node_modules/webcola/dist/src/pqueue.js
var require_pqueue = __commonJS({
  "node_modules/webcola/dist/src/pqueue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PairingHeap = function() {
      function PairingHeap2(elem) {
        this.elem = elem;
        this.subheaps = [];
      }
      PairingHeap2.prototype.toString = function(selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
          var subheap = this.subheaps[i];
          if (!subheap.elem) {
            needComma = false;
            continue;
          }
          if (needComma) {
            str = str + ",";
          }
          str = str + subheap.toString(selector);
          needComma = true;
        }
        if (str !== "") {
          str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
      };
      PairingHeap2.prototype.forEach = function(f) {
        if (!this.empty()) {
          f(this.elem, this);
          this.subheaps.forEach(function(s) {
            return s.forEach(f);
          });
        }
      };
      PairingHeap2.prototype.count = function() {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function(n, h) {
          return n + h.count();
        }, 0);
      };
      PairingHeap2.prototype.min = function() {
        return this.elem;
      };
      PairingHeap2.prototype.empty = function() {
        return this.elem == null;
      };
      PairingHeap2.prototype.contains = function(h) {
        if (this === h)
          return true;
        for (var i = 0; i < this.subheaps.length; i++) {
          if (this.subheaps[i].contains(h))
            return true;
        }
        return false;
      };
      PairingHeap2.prototype.isHeap = function(lessThan) {
        var _this = this;
        return this.subheaps.every(function(h) {
          return lessThan(_this.elem, h.elem) && h.isHeap(lessThan);
        });
      };
      PairingHeap2.prototype.insert = function(obj, lessThan) {
        return this.merge(new PairingHeap2(obj), lessThan);
      };
      PairingHeap2.prototype.merge = function(heap2, lessThan) {
        if (this.empty())
          return heap2;
        else if (heap2.empty())
          return this;
        else if (lessThan(this.elem, heap2.elem)) {
          this.subheaps.push(heap2);
          return this;
        } else {
          heap2.subheaps.push(this);
          return heap2;
        }
      };
      PairingHeap2.prototype.removeMin = function(lessThan) {
        if (this.empty())
          return null;
        else
          return this.mergePairs(lessThan);
      };
      PairingHeap2.prototype.mergePairs = function(lessThan) {
        if (this.subheaps.length == 0)
          return new PairingHeap2(null);
        else if (this.subheaps.length == 1) {
          return this.subheaps[0];
        } else {
          var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
          var remaining = this.mergePairs(lessThan);
          return firstPair.merge(remaining, lessThan);
        }
      };
      PairingHeap2.prototype.decreaseKey = function(subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
          setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap2(newValue);
        if (setHeapNode !== null) {
          setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
      };
      return PairingHeap2;
    }();
    exports.PairingHeap = PairingHeap;
    var PriorityQueue = function() {
      function PriorityQueue2(lessThan) {
        this.lessThan = lessThan;
      }
      PriorityQueue2.prototype.top = function() {
        if (this.empty()) {
          return null;
        }
        return this.root.elem;
      };
      PriorityQueue2.prototype.push = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
          pairingNode = new PairingHeap(arg);
          this.root = this.empty() ? pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
      };
      PriorityQueue2.prototype.empty = function() {
        return !this.root || !this.root.elem;
      };
      PriorityQueue2.prototype.isHeap = function() {
        return this.root.isHeap(this.lessThan);
      };
      PriorityQueue2.prototype.forEach = function(f) {
        this.root.forEach(f);
      };
      PriorityQueue2.prototype.pop = function() {
        if (this.empty()) {
          return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
      };
      PriorityQueue2.prototype.reduceKey = function(heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) {
          setHeapNode = null;
        }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
      };
      PriorityQueue2.prototype.toString = function(selector) {
        return this.root.toString(selector);
      };
      PriorityQueue2.prototype.count = function() {
        return this.root.count();
      };
      return PriorityQueue2;
    }();
    exports.PriorityQueue = PriorityQueue;
  }
});

// node_modules/webcola/dist/src/shortestpaths.js
var require_shortestpaths = __commonJS({
  "node_modules/webcola/dist/src/shortestpaths.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var pqueue_1 = require_pqueue();
    var Neighbour = /* @__PURE__ */ function() {
      function Neighbour2(id, distance) {
        this.id = id;
        this.distance = distance;
      }
      return Neighbour2;
    }();
    var Node = /* @__PURE__ */ function() {
      function Node2(id) {
        this.id = id;
        this.neighbours = [];
      }
      return Node2;
    }();
    var QueueEntry = /* @__PURE__ */ function() {
      function QueueEntry2(node, prev, d) {
        this.node = node;
        this.prev = prev;
        this.d = d;
      }
      return QueueEntry2;
    }();
    var Calculator = function() {
      function Calculator2(n, es, getSourceIndex, getTargetIndex, getLength) {
        this.n = n;
        this.es = es;
        this.neighbours = new Array(this.n);
        var i = this.n;
        while (i--)
          this.neighbours[i] = new Node(i);
        i = this.es.length;
        while (i--) {
          var e = this.es[i];
          var u = getSourceIndex(e), v = getTargetIndex(e);
          var d = getLength(e);
          this.neighbours[u].neighbours.push(new Neighbour(v, d));
          this.neighbours[v].neighbours.push(new Neighbour(u, d));
        }
      }
      Calculator2.prototype.DistanceMatrix = function() {
        var D = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
          D[i] = this.dijkstraNeighbours(i);
        }
        return D;
      };
      Calculator2.prototype.DistancesFromNode = function(start) {
        return this.dijkstraNeighbours(start);
      };
      Calculator2.prototype.PathFromNodeToNode = function(start, end) {
        return this.dijkstraNeighbours(start, end);
      };
      Calculator2.prototype.PathFromNodeToNodeWithPrevCost = function(start, end, prevCost) {
        var q = new pqueue_1.PriorityQueue(function(a, b) {
          return a.d <= b.d;
        }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
        q.push(qu);
        while (!q.empty()) {
          qu = q.pop();
          u = qu.node;
          if (u.id === end) {
            break;
          }
          var i = u.neighbours.length;
          while (i--) {
            var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
            if (qu.prev && v.id === qu.prev.node.id)
              continue;
            var viduid = v.id + "," + u.id;
            if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
              continue;
            var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
            visitedFrom[viduid] = t;
            q.push(new QueueEntry(v, qu, t));
          }
        }
        var path = [];
        while (qu.prev) {
          qu = qu.prev;
          path.push(qu.node.id);
        }
        return path;
      };
      Calculator2.prototype.dijkstraNeighbours = function(start, dest) {
        if (dest === void 0) {
          dest = -1;
        }
        var q = new pqueue_1.PriorityQueue(function(a, b) {
          return a.d <= b.d;
        }), i = this.neighbours.length, d = new Array(i);
        while (i--) {
          var node = this.neighbours[i];
          node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
          node.q = q.push(node);
        }
        while (!q.empty()) {
          var u = q.pop();
          d[u.id] = u.d;
          if (u.id === dest) {
            var path = [];
            var v = u;
            while (typeof v.prev !== "undefined") {
              path.push(v.prev.id);
              v = v.prev;
            }
            return path;
          }
          i = u.neighbours.length;
          while (i--) {
            var neighbour = u.neighbours[i];
            var v = this.neighbours[neighbour.id];
            var t = u.d + neighbour.distance;
            if (u.d !== Number.MAX_VALUE && v.d > t) {
              v.d = t;
              v.prev = u;
              q.reduceKey(v.q, v, function(e, q2) {
                return e.q = q2;
              });
            }
          }
        }
        return d;
      };
      return Calculator2;
    }();
    exports.Calculator = Calculator;
  }
});

// node_modules/webcola/dist/src/geom.js
var require_geom = __commonJS({
  "node_modules/webcola/dist/src/geom.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    var rectangle_1 = require_rectangle();
    var Point = /* @__PURE__ */ function() {
      function Point2() {
      }
      return Point2;
    }();
    exports.Point = Point;
    var LineSegment = /* @__PURE__ */ function() {
      function LineSegment2(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
      }
      return LineSegment2;
    }();
    exports.LineSegment = LineSegment;
    var PolyPoint = function(_super) {
      __extends(PolyPoint2, _super);
      function PolyPoint2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return PolyPoint2;
    }(Point);
    exports.PolyPoint = PolyPoint;
    function isLeft(P0, P1, P2) {
      return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
    }
    exports.isLeft = isLeft;
    function above(p, vi, vj) {
      return isLeft(p, vi, vj) > 0;
    }
    function below(p, vi, vj) {
      return isLeft(p, vi, vj) < 0;
    }
    function ConvexHull(S) {
      var P = S.slice(0).sort(function(a, b) {
        return a.x !== b.x ? b.x - a.x : b.y - a.y;
      });
      var n = S.length, i;
      var minmin = 0;
      var xmin = P[0].x;
      for (i = 1; i < n; ++i) {
        if (P[i].x !== xmin)
          break;
      }
      var minmax = i - 1;
      var H = [];
      H.push(P[minmin]);
      if (minmax === n - 1) {
        if (P[minmax].y !== P[minmin].y)
          H.push(P[minmax]);
      } else {
        var maxmin, maxmax = n - 1;
        var xmax = P[n - 1].x;
        for (i = n - 2; i >= 0; i--)
          if (P[i].x !== xmax)
            break;
        maxmin = i + 1;
        i = minmax;
        while (++i <= maxmin) {
          if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
            continue;
          while (H.length > 1) {
            if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
              break;
            else
              H.length -= 1;
          }
          if (i != minmin)
            H.push(P[i]);
        }
        if (maxmax != maxmin)
          H.push(P[maxmax]);
        var bot = H.length;
        i = maxmin;
        while (--i >= minmax) {
          if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
            continue;
          while (H.length > bot) {
            if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
              break;
            else
              H.length -= 1;
          }
          if (i != minmin)
            H.push(P[i]);
        }
      }
      return H;
    }
    exports.ConvexHull = ConvexHull;
    function clockwiseRadialSweep(p, P, f) {
      P.slice(0).sort(function(a, b) {
        return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x);
      }).forEach(f);
    }
    exports.clockwiseRadialSweep = clockwiseRadialSweep;
    function tangent_PointPolyC(P, V) {
      var Vclosed = V.slice(0);
      Vclosed.push(V[0]);
      return { rtan: Rtangent_PointPolyC(P, Vclosed), ltan: Ltangent_PointPolyC(P, Vclosed) };
    }
    function Rtangent_PointPolyC(P, V) {
      var n = V.length - 1;
      var a, b, c;
      var upA, dnC;
      if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
        return 0;
      for (a = 0, b = n; ; ) {
        if (b - a === 1)
          if (above(P, V[a], V[b]))
            return a;
          else
            return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (dnC && !above(P, V[c - 1], V[c]))
          return c;
        upA = above(P, V[a + 1], V[a]);
        if (upA) {
          if (dnC)
            b = c;
          else {
            if (above(P, V[a], V[c]))
              b = c;
            else
              a = c;
          }
        } else {
          if (!dnC)
            a = c;
          else {
            if (below(P, V[a], V[c]))
              b = c;
            else
              a = c;
          }
        }
      }
    }
    function Ltangent_PointPolyC(P, V) {
      var n = V.length - 1;
      var a, b, c;
      var dnA, dnC;
      if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
        return 0;
      for (a = 0, b = n; ; ) {
        if (b - a === 1)
          if (below(P, V[a], V[b]))
            return a;
          else
            return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (above(P, V[c - 1], V[c]) && !dnC)
          return c;
        dnA = below(P, V[a + 1], V[a]);
        if (dnA) {
          if (!dnC)
            b = c;
          else {
            if (below(P, V[a], V[c]))
              b = c;
            else
              a = c;
          }
        } else {
          if (dnC)
            a = c;
          else {
            if (above(P, V[a], V[c]))
              b = c;
            else
              a = c;
          }
        }
      }
    }
    function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
      var ix1, ix2;
      ix1 = t1(W[0], V);
      ix2 = t2(V[ix1], W);
      var done = false;
      while (!done) {
        done = true;
        while (true) {
          if (ix1 === V.length - 1)
            ix1 = 0;
          if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
            break;
          ++ix1;
        }
        while (true) {
          if (ix2 === 0)
            ix2 = W.length - 1;
          if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
            break;
          --ix2;
          done = false;
        }
      }
      return { t1: ix1, t2: ix2 };
    }
    exports.tangent_PolyPolyC = tangent_PolyPolyC;
    function LRtangent_PolyPolyC(V, W) {
      var rl = RLtangent_PolyPolyC(W, V);
      return { t1: rl.t2, t2: rl.t1 };
    }
    exports.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
    function RLtangent_PolyPolyC(V, W) {
      return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
    }
    exports.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
    function LLtangent_PolyPolyC(V, W) {
      return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
    }
    exports.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
    function RRtangent_PolyPolyC(V, W) {
      return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
    }
    exports.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
    var BiTangent = /* @__PURE__ */ function() {
      function BiTangent2(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
      }
      return BiTangent2;
    }();
    exports.BiTangent = BiTangent;
    var BiTangents = /* @__PURE__ */ function() {
      function BiTangents2() {
      }
      return BiTangents2;
    }();
    exports.BiTangents = BiTangents;
    var TVGPoint = function(_super) {
      __extends(TVGPoint2, _super);
      function TVGPoint2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return TVGPoint2;
    }(Point);
    exports.TVGPoint = TVGPoint;
    var VisibilityVertex = /* @__PURE__ */ function() {
      function VisibilityVertex2(id, polyid, polyvertid, p) {
        this.id = id;
        this.polyid = polyid;
        this.polyvertid = polyvertid;
        this.p = p;
        p.vv = this;
      }
      return VisibilityVertex2;
    }();
    exports.VisibilityVertex = VisibilityVertex;
    var VisibilityEdge = function() {
      function VisibilityEdge2(source, target) {
        this.source = source;
        this.target = target;
      }
      VisibilityEdge2.prototype.length = function() {
        var dx = this.source.p.x - this.target.p.x;
        var dy = this.source.p.y - this.target.p.y;
        return Math.sqrt(dx * dx + dy * dy);
      };
      return VisibilityEdge2;
    }();
    exports.VisibilityEdge = VisibilityEdge;
    var TangentVisibilityGraph = function() {
      function TangentVisibilityGraph2(P, g0) {
        this.P = P;
        this.V = [];
        this.E = [];
        if (!g0) {
          var n = P.length;
          for (var i = 0; i < n; i++) {
            var p = P[i];
            for (var j = 0; j < p.length; ++j) {
              var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
              this.V.push(vv);
              if (j > 0)
                this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
            }
            if (p.length > 1)
              this.E.push(new VisibilityEdge(p[0].vv, p[p.length - 1].vv));
          }
          for (var i = 0; i < n - 1; i++) {
            var Pi = P[i];
            for (var j = i + 1; j < n; j++) {
              var Pj = P[j], t = tangents(Pi, Pj);
              for (var q in t) {
                var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                this.addEdgeIfVisible(source, target, i, j);
              }
            }
          }
        } else {
          this.V = g0.V.slice(0);
          this.E = g0.E.slice(0);
        }
      }
      TangentVisibilityGraph2.prototype.addEdgeIfVisible = function(u, v, i1, i2) {
        if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
          this.E.push(new VisibilityEdge(u.vv, v.vv));
        }
      };
      TangentVisibilityGraph2.prototype.addPoint = function(p, i1) {
        var n = this.P.length;
        this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
        for (var i = 0; i < n; ++i) {
          if (i === i1)
            continue;
          var poly = this.P[i], t = tangent_PointPolyC(p, poly);
          this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
          this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
        }
        return p.vv;
      };
      TangentVisibilityGraph2.prototype.intersectsPolys = function(l, i1, i2) {
        for (var i = 0, n = this.P.length; i < n; ++i) {
          if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
            return true;
          }
        }
        return false;
      };
      return TangentVisibilityGraph2;
    }();
    exports.TangentVisibilityGraph = TangentVisibilityGraph;
    function intersects(l, P) {
      var ints = [];
      for (var i = 1, n = P.length; i < n; ++i) {
        var int = rectangle_1.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
        if (int)
          ints.push(int);
      }
      return ints;
    }
    function tangents(V, W) {
      var m = V.length - 1, n = W.length - 1;
      var bt = new BiTangents();
      for (var i = 0; i < m; ++i) {
        for (var j = 0; j < n; ++j) {
          var v1 = V[i == 0 ? m - 1 : i - 1];
          var v2 = V[i];
          var v3 = V[i + 1];
          var w1 = W[j == 0 ? n - 1 : j - 1];
          var w2 = W[j];
          var w3 = W[j + 1];
          var v1v2w2 = isLeft(v1, v2, w2);
          var v2w1w2 = isLeft(v2, w1, w2);
          var v2w2w3 = isLeft(v2, w2, w3);
          var w1w2v2 = isLeft(w1, w2, v2);
          var w2v1v2 = isLeft(w2, v1, v2);
          var w2v2v3 = isLeft(w2, v2, v3);
          if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0 && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
            bt.ll = new BiTangent(i, j);
          } else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0 && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
            bt.rr = new BiTangent(i, j);
          } else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0 && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
            bt.rl = new BiTangent(i, j);
          } else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0 && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
            bt.lr = new BiTangent(i, j);
          }
        }
      }
      return bt;
    }
    exports.tangents = tangents;
    function isPointInsidePoly(p, poly) {
      for (var i = 1, n = poly.length; i < n; ++i)
        if (below(poly[i - 1], poly[i], p))
          return false;
      return true;
    }
    function isAnyPInQ(p, q) {
      return !p.every(function(v) {
        return !isPointInsidePoly(v, q);
      });
    }
    function polysOverlap(p, q) {
      if (isAnyPInQ(p, q))
        return true;
      if (isAnyPInQ(q, p))
        return true;
      for (var i = 1, n = p.length; i < n; ++i) {
        var v = p[i], u = p[i - 1];
        if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
          return true;
      }
      return false;
    }
    exports.polysOverlap = polysOverlap;
  }
});

// node_modules/webcola/dist/src/handledisconnected.js
var require_handledisconnected = __commonJS({
  "node_modules/webcola/dist/src/handledisconnected.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var packingOptions = {
      PADDING: 10,
      GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
      FLOAT_EPSILON: 1e-4,
      MAX_INERATIONS: 100
    };
    function applyPacking(graphs, w, h, node_size, desired_ratio, centerGraph) {
      if (desired_ratio === void 0) {
        desired_ratio = 1;
      }
      if (centerGraph === void 0) {
        centerGraph = true;
      }
      var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== "undefined" ? desired_ratio : 1, node_size = typeof node_size !== "undefined" ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
      if (graphs.length == 0)
        return;
      calculate_bb(graphs);
      apply(graphs, desired_ratio);
      if (centerGraph) {
        put_nodes_to_right_positions(graphs);
      }
      function calculate_bb(graphs2) {
        graphs2.forEach(function(g) {
          calculate_single_bb(g);
        });
        function calculate_single_bb(graph) {
          var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
          graph.array.forEach(function(v) {
            var w2 = typeof v.width !== "undefined" ? v.width : node_size;
            var h2 = typeof v.height !== "undefined" ? v.height : node_size;
            w2 /= 2;
            h2 /= 2;
            max_x = Math.max(v.x + w2, max_x);
            min_x = Math.min(v.x - w2, min_x);
            max_y = Math.max(v.y + h2, max_y);
            min_y = Math.min(v.y - h2, min_y);
          });
          graph.width = max_x - min_x;
          graph.height = max_y - min_y;
        }
      }
      function put_nodes_to_right_positions(graphs2) {
        graphs2.forEach(function(g) {
          var center = { x: 0, y: 0 };
          g.array.forEach(function(node) {
            center.x += node.x;
            center.y += node.y;
          });
          center.x /= g.array.length;
          center.y /= g.array.length;
          var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
          var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
          g.array.forEach(function(node) {
            node.x += offset.x;
            node.y += offset.y;
          });
        });
      }
      function apply(data, desired_ratio2) {
        var curr_best_f = Number.POSITIVE_INFINITY;
        var curr_best = 0;
        data.sort(function(a, b) {
          return b.height - a.height;
        });
        min_width = data.reduce(function(a, b) {
          return a.width < b.width ? a.width : b.width;
        });
        var left = x1 = min_width;
        var right = x2 = get_entire_width(data);
        var iterationCounter = 0;
        var f_x1 = Number.MAX_VALUE;
        var f_x2 = Number.MAX_VALUE;
        var flag = -1;
        var dx = Number.MAX_VALUE;
        var df = Number.MAX_VALUE;
        while (dx > min_width || df > packingOptions.FLOAT_EPSILON) {
          if (flag != 1) {
            var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
            var f_x1 = step(data, x1);
          }
          if (flag != 0) {
            var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
            var f_x2 = step(data, x2);
          }
          dx = Math.abs(x1 - x2);
          df = Math.abs(f_x1 - f_x2);
          if (f_x1 < curr_best_f) {
            curr_best_f = f_x1;
            curr_best = x1;
          }
          if (f_x2 < curr_best_f) {
            curr_best_f = f_x2;
            curr_best = x2;
          }
          if (f_x1 > f_x2) {
            left = x1;
            x1 = x2;
            f_x1 = f_x2;
            flag = 1;
          } else {
            right = x2;
            x2 = x1;
            f_x2 = f_x1;
            flag = 0;
          }
          if (iterationCounter++ > 100) {
            break;
          }
        }
        step(data, curr_best);
      }
      function step(data, max_width) {
        line = [];
        real_width = 0;
        real_height = 0;
        global_bottom = init_y;
        for (var i = 0; i < data.length; i++) {
          var o = data[i];
          put_rect(o, max_width);
        }
        return Math.abs(get_real_ratio() - desired_ratio);
      }
      function put_rect(rect, max_width) {
        var parent = void 0;
        for (var i = 0; i < line.length; i++) {
          if (line[i].space_left >= rect.height && line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width <= packingOptions.FLOAT_EPSILON) {
            parent = line[i];
            break;
          }
        }
        line.push(rect);
        if (parent !== void 0) {
          rect.x = parent.x + parent.width + packingOptions.PADDING;
          rect.y = parent.bottom;
          rect.space_left = rect.height;
          rect.bottom = rect.y;
          parent.space_left -= rect.height + packingOptions.PADDING;
          parent.bottom += rect.height + packingOptions.PADDING;
        } else {
          rect.y = global_bottom;
          global_bottom += rect.height + packingOptions.PADDING;
          rect.x = init_x;
          rect.bottom = rect.y;
          rect.space_left = rect.height;
        }
        if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
          real_height = rect.y + rect.height - init_y;
        if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
          real_width = rect.x + rect.width - init_x;
      }
      ;
      function get_entire_width(data) {
        var width = 0;
        data.forEach(function(d) {
          return width += d.width + packingOptions.PADDING;
        });
        return width;
      }
      function get_real_ratio() {
        return real_width / real_height;
      }
    }
    exports.applyPacking = applyPacking;
    function separateGraphs(nodes, links) {
      var marks = {};
      var ways = {};
      var graphs = [];
      var clusters = 0;
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var n1 = link.source;
        var n2 = link.target;
        if (ways[n1.index])
          ways[n1.index].push(n2);
        else
          ways[n1.index] = [n2];
        if (ways[n2.index])
          ways[n2.index].push(n1);
        else
          ways[n2.index] = [n1];
      }
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (marks[node.index])
          continue;
        explore_node(node, true);
      }
      function explore_node(n, is_new) {
        if (marks[n.index] !== void 0)
          return;
        if (is_new) {
          clusters++;
          graphs.push({ array: [] });
        }
        marks[n.index] = clusters;
        graphs[clusters - 1].array.push(n);
        var adjacent = ways[n.index];
        if (!adjacent)
          return;
        for (var j = 0; j < adjacent.length; j++) {
          explore_node(adjacent[j], false);
        }
      }
      return graphs;
    }
    exports.separateGraphs = separateGraphs;
  }
});

// node_modules/webcola/dist/src/layout.js
var require_layout = __commonJS({
  "node_modules/webcola/dist/src/layout.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var powergraph = require_powergraph();
    var linklengths_1 = require_linklengths();
    var descent_1 = require_descent();
    var rectangle_1 = require_rectangle();
    var shortestpaths_1 = require_shortestpaths();
    var geom_1 = require_geom();
    var handledisconnected_1 = require_handledisconnected();
    var EventType;
    (function(EventType2) {
      EventType2[EventType2["start"] = 0] = "start";
      EventType2[EventType2["tick"] = 1] = "tick";
      EventType2[EventType2["end"] = 2] = "end";
    })(EventType = exports.EventType || (exports.EventType = {}));
    function isGroup(g) {
      return typeof g.leaves !== "undefined" || typeof g.groups !== "undefined";
    }
    var Layout = function() {
      function Layout2() {
        var _this = this;
        this._canvasSize = [1, 1];
        this._linkDistance = 20;
        this._defaultNodeSize = 10;
        this._linkLengthCalculator = null;
        this._linkType = null;
        this._avoidOverlaps = false;
        this._handleDisconnected = true;
        this._running = false;
        this._nodes = [];
        this._groups = [];
        this._rootGroup = null;
        this._links = [];
        this._constraints = [];
        this._distanceMatrix = null;
        this._descent = null;
        this._directedLinkConstraints = null;
        this._threshold = 0.01;
        this._visibilityGraph = null;
        this._groupCompactness = 1e-6;
        this.event = null;
        this.linkAccessor = {
          getSourceIndex: Layout2.getSourceIndex,
          getTargetIndex: Layout2.getTargetIndex,
          setLength: Layout2.setLinkLength,
          getType: function(l) {
            return typeof _this._linkType === "function" ? _this._linkType(l) : 0;
          }
        };
      }
      Layout2.prototype.on = function(e, listener) {
        if (!this.event)
          this.event = {};
        if (typeof e === "string") {
          this.event[EventType[e]] = listener;
        } else {
          this.event[e] = listener;
        }
        return this;
      };
      Layout2.prototype.trigger = function(e) {
        if (this.event && typeof this.event[e.type] !== "undefined") {
          this.event[e.type](e);
        }
      };
      Layout2.prototype.kick = function() {
        while (!this.tick())
          ;
      };
      Layout2.prototype.tick = function() {
        if (this._alpha < this._threshold) {
          this._running = false;
          this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
          return true;
        }
        var n = this._nodes.length, m = this._links.length;
        var o, i;
        this._descent.locks.clear();
        for (i = 0; i < n; ++i) {
          o = this._nodes[i];
          if (o.fixed) {
            if (typeof o.px === "undefined" || typeof o.py === "undefined") {
              o.px = o.x;
              o.py = o.y;
            }
            var p = [o.px, o.py];
            this._descent.locks.add(i, p);
          }
        }
        var s1 = this._descent.rungeKutta();
        if (s1 === 0) {
          this._alpha = 0;
        } else if (typeof this._lastStress !== "undefined") {
          this._alpha = s1;
        }
        this._lastStress = s1;
        this.updateNodePositions();
        this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
        return false;
      };
      Layout2.prototype.updateNodePositions = function() {
        var x = this._descent.x[0], y = this._descent.x[1];
        var o, i = this._nodes.length;
        while (i--) {
          o = this._nodes[i];
          o.x = x[i];
          o.y = y[i];
        }
      };
      Layout2.prototype.nodes = function(v) {
        if (!v) {
          if (this._nodes.length === 0 && this._links.length > 0) {
            var n = 0;
            this._links.forEach(function(l) {
              n = Math.max(n, l.source, l.target);
            });
            this._nodes = new Array(++n);
            for (var i = 0; i < n; ++i) {
              this._nodes[i] = {};
            }
          }
          return this._nodes;
        }
        this._nodes = v;
        return this;
      };
      Layout2.prototype.groups = function(x) {
        var _this = this;
        if (!x)
          return this._groups;
        this._groups = x;
        this._rootGroup = {};
        this._groups.forEach(function(g) {
          if (typeof g.padding === "undefined")
            g.padding = 1;
          if (typeof g.leaves !== "undefined") {
            g.leaves.forEach(function(v, i) {
              if (typeof v === "number")
                (g.leaves[i] = _this._nodes[v]).parent = g;
            });
          }
          if (typeof g.groups !== "undefined") {
            g.groups.forEach(function(gi, i) {
              if (typeof gi === "number")
                (g.groups[i] = _this._groups[gi]).parent = g;
            });
          }
        });
        this._rootGroup.leaves = this._nodes.filter(function(v) {
          return typeof v.parent === "undefined";
        });
        this._rootGroup.groups = this._groups.filter(function(g) {
          return typeof g.parent === "undefined";
        });
        return this;
      };
      Layout2.prototype.powerGraphGroups = function(f) {
        var g = powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
        this.groups(g.groups);
        f(g);
        return this;
      };
      Layout2.prototype.avoidOverlaps = function(v) {
        if (!arguments.length)
          return this._avoidOverlaps;
        this._avoidOverlaps = v;
        return this;
      };
      Layout2.prototype.handleDisconnected = function(v) {
        if (!arguments.length)
          return this._handleDisconnected;
        this._handleDisconnected = v;
        return this;
      };
      Layout2.prototype.flowLayout = function(axis, minSeparation) {
        if (!arguments.length)
          axis = "y";
        this._directedLinkConstraints = {
          axis,
          getMinSeparation: typeof minSeparation === "number" ? function() {
            return minSeparation;
          } : minSeparation
        };
        return this;
      };
      Layout2.prototype.links = function(x) {
        if (!arguments.length)
          return this._links;
        this._links = x;
        return this;
      };
      Layout2.prototype.constraints = function(c) {
        if (!arguments.length)
          return this._constraints;
        this._constraints = c;
        return this;
      };
      Layout2.prototype.distanceMatrix = function(d) {
        if (!arguments.length)
          return this._distanceMatrix;
        this._distanceMatrix = d;
        return this;
      };
      Layout2.prototype.size = function(x) {
        if (!x)
          return this._canvasSize;
        this._canvasSize = x;
        return this;
      };
      Layout2.prototype.defaultNodeSize = function(x) {
        if (!x)
          return this._defaultNodeSize;
        this._defaultNodeSize = x;
        return this;
      };
      Layout2.prototype.groupCompactness = function(x) {
        if (!x)
          return this._groupCompactness;
        this._groupCompactness = x;
        return this;
      };
      Layout2.prototype.linkDistance = function(x) {
        if (!x) {
          return this._linkDistance;
        }
        this._linkDistance = typeof x === "function" ? x : +x;
        this._linkLengthCalculator = null;
        return this;
      };
      Layout2.prototype.linkType = function(f) {
        this._linkType = f;
        return this;
      };
      Layout2.prototype.convergenceThreshold = function(x) {
        if (!x)
          return this._threshold;
        this._threshold = typeof x === "function" ? x : +x;
        return this;
      };
      Layout2.prototype.alpha = function(x) {
        if (!arguments.length)
          return this._alpha;
        else {
          x = +x;
          if (this._alpha) {
            if (x > 0)
              this._alpha = x;
            else
              this._alpha = 0;
          } else if (x > 0) {
            if (!this._running) {
              this._running = true;
              this.trigger({ type: EventType.start, alpha: this._alpha = x });
              this.kick();
            }
          }
          return this;
        }
      };
      Layout2.prototype.getLinkLength = function(link) {
        return typeof this._linkDistance === "function" ? +this._linkDistance(link) : this._linkDistance;
      };
      Layout2.setLinkLength = function(link, length) {
        link.length = length;
      };
      Layout2.prototype.getLinkType = function(link) {
        return typeof this._linkType === "function" ? this._linkType(link) : 0;
      };
      Layout2.prototype.symmetricDiffLinkLengths = function(idealLength, w) {
        var _this = this;
        if (w === void 0) {
          w = 1;
        }
        this.linkDistance(function(l) {
          return idealLength * l.length;
        });
        this._linkLengthCalculator = function() {
          return linklengths_1.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w);
        };
        return this;
      };
      Layout2.prototype.jaccardLinkLengths = function(idealLength, w) {
        var _this = this;
        if (w === void 0) {
          w = 1;
        }
        this.linkDistance(function(l) {
          return idealLength * l.length;
        });
        this._linkLengthCalculator = function() {
          return linklengths_1.jaccardLinkLengths(_this._links, _this.linkAccessor, w);
        };
        return this;
      };
      Layout2.prototype.start = function(initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning, centerGraph) {
        var _this = this;
        if (initialUnconstrainedIterations === void 0) {
          initialUnconstrainedIterations = 0;
        }
        if (initialUserConstraintIterations === void 0) {
          initialUserConstraintIterations = 0;
        }
        if (initialAllConstraintsIterations === void 0) {
          initialAllConstraintsIterations = 0;
        }
        if (gridSnapIterations === void 0) {
          gridSnapIterations = 0;
        }
        if (keepRunning === void 0) {
          keepRunning = true;
        }
        if (centerGraph === void 0) {
          centerGraph = true;
        }
        var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
        var x = new Array(N), y = new Array(N);
        var G = null;
        var ao = this._avoidOverlaps;
        this._nodes.forEach(function(v, i2) {
          v.index = i2;
          if (typeof v.x === "undefined") {
            v.x = w / 2, v.y = h / 2;
          }
          x[i2] = v.x, y[i2] = v.y;
        });
        if (this._linkLengthCalculator)
          this._linkLengthCalculator();
        var distances;
        if (this._distanceMatrix) {
          distances = this._distanceMatrix;
        } else {
          distances = new shortestpaths_1.Calculator(N, this._links, Layout2.getSourceIndex, Layout2.getTargetIndex, function(l) {
            return _this.getLinkLength(l);
          }).DistanceMatrix();
          G = descent_1.Descent.createSquareMatrix(N, function() {
            return 2;
          });
          this._links.forEach(function(l) {
            if (typeof l.source == "number")
              l.source = _this._nodes[l.source];
            if (typeof l.target == "number")
              l.target = _this._nodes[l.target];
          });
          this._links.forEach(function(e) {
            var u = Layout2.getSourceIndex(e), v = Layout2.getTargetIndex(e);
            G[u][v] = G[v][u] = e.weight || 1;
          });
        }
        var D = descent_1.Descent.createSquareMatrix(N, function(i2, j2) {
          return distances[i2][j2];
        });
        if (this._rootGroup && typeof this._rootGroup.groups !== "undefined") {
          var i = n;
          var addAttraction = function(i2, j2, strength, idealDistance) {
            G[i2][j2] = G[j2][i2] = strength;
            D[i2][j2] = D[j2][i2] = idealDistance;
          };
          this._groups.forEach(function(g) {
            addAttraction(i, i + 1, _this._groupCompactness, 0.1);
            x[i] = 0, y[i++] = 0;
            x[i] = 0, y[i++] = 0;
          });
        } else
          this._rootGroup = { leaves: this._nodes, groups: [] };
        var curConstraints = this._constraints || [];
        if (this._directedLinkConstraints) {
          this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
          curConstraints = curConstraints.concat(linklengths_1.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, this.linkAccessor));
        }
        this.avoidOverlaps(false);
        this._descent = new descent_1.Descent([x, y], D);
        this._descent.locks.clear();
        for (var i = 0; i < n; ++i) {
          var o = this._nodes[i];
          if (o.fixed) {
            o.px = o.x;
            o.py = o.y;
            var p = [o.x, o.y];
            this._descent.locks.add(i, p);
          }
        }
        this._descent.threshold = this._threshold;
        this.initialLayout(initialUnconstrainedIterations, x, y);
        if (curConstraints.length > 0)
          this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
        this._descent.run(initialUserConstraintIterations);
        this.separateOverlappingComponents(w, h, centerGraph);
        this.avoidOverlaps(ao);
        if (ao) {
          this._nodes.forEach(function(v, i2) {
            v.x = x[i2], v.y = y[i2];
          });
          this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
          this._nodes.forEach(function(v, i2) {
            x[i2] = v.x, y[i2] = v.y;
          });
        }
        this._descent.G = G;
        this._descent.run(initialAllConstraintsIterations);
        if (gridSnapIterations) {
          this._descent.snapStrength = 1e3;
          this._descent.snapGridSize = this._nodes[0].width;
          this._descent.numGridSnapNodes = n;
          this._descent.scaleSnapByMaxH = n != N;
          var G0 = descent_1.Descent.createSquareMatrix(N, function(i2, j2) {
            if (i2 >= n || j2 >= n)
              return G[i2][j2];
            return 0;
          });
          this._descent.G = G0;
          this._descent.run(gridSnapIterations);
        }
        this.updateNodePositions();
        this.separateOverlappingComponents(w, h, centerGraph);
        return keepRunning ? this.resume() : this;
      };
      Layout2.prototype.initialLayout = function(iterations, x, y) {
        if (this._groups.length > 0 && iterations > 0) {
          var n = this._nodes.length;
          var edges = this._links.map(function(e) {
            return { source: e.source.index, target: e.target.index };
          });
          var vs = this._nodes.map(function(v) {
            return { index: v.index };
          });
          this._groups.forEach(function(g, i) {
            vs.push({ index: g.index = n + i });
          });
          this._groups.forEach(function(g, i) {
            if (typeof g.leaves !== "undefined")
              g.leaves.forEach(function(v) {
                return edges.push({ source: g.index, target: v.index });
              });
            if (typeof g.groups !== "undefined")
              g.groups.forEach(function(gg) {
                return edges.push({ source: g.index, target: gg.index });
              });
          });
          new Layout2().size(this.size()).nodes(vs).links(edges).avoidOverlaps(false).linkDistance(this.linkDistance()).symmetricDiffLinkLengths(5).convergenceThreshold(1e-4).start(iterations, 0, 0, 0, false);
          this._nodes.forEach(function(v) {
            x[v.index] = vs[v.index].x;
            y[v.index] = vs[v.index].y;
          });
        } else {
          this._descent.run(iterations);
        }
      };
      Layout2.prototype.separateOverlappingComponents = function(width, height, centerGraph) {
        var _this = this;
        if (centerGraph === void 0) {
          centerGraph = true;
        }
        if (!this._distanceMatrix && this._handleDisconnected) {
          var x_1 = this._descent.x[0], y_1 = this._descent.x[1];
          this._nodes.forEach(function(v, i) {
            v.x = x_1[i], v.y = y_1[i];
          });
          var graphs = handledisconnected_1.separateGraphs(this._nodes, this._links);
          handledisconnected_1.applyPacking(graphs, width, height, this._defaultNodeSize, 1, centerGraph);
          this._nodes.forEach(function(v, i) {
            _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
            if (v.bounds) {
              v.bounds.setXCentre(v.x);
              v.bounds.setYCentre(v.y);
            }
          });
        }
      };
      Layout2.prototype.resume = function() {
        return this.alpha(0.1);
      };
      Layout2.prototype.stop = function() {
        return this.alpha(0);
      };
      Layout2.prototype.prepareEdgeRouting = function(nodeMargin) {
        if (nodeMargin === void 0) {
          nodeMargin = 0;
        }
        this._visibilityGraph = new geom_1.TangentVisibilityGraph(this._nodes.map(function(v) {
          return v.bounds.inflate(-nodeMargin).vertices();
        }));
      };
      Layout2.prototype.routeEdge = function(edge, ah, draw) {
        if (ah === void 0) {
          ah = 5;
        }
        var lineData = [];
        var vg2 = new geom_1.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
        vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
        if (typeof draw !== "undefined") {
          draw(vg2);
        }
        var sourceInd = function(e) {
          return e.source.id;
        }, targetInd = function(e) {
          return e.target.id;
        }, length = function(e) {
          return e.length();
        }, spCalc = new shortestpaths_1.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
        if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
          var route = rectangle_1.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, ah);
          lineData = [route.sourceIntersection, route.arrowStart];
        } else {
          var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
          for (var i = n; i >= 0; --i)
            lineData.push(vg2.V[shortestPath[i]].p);
          lineData.push(rectangle_1.makeEdgeTo(q, edge.target.innerBounds, ah));
        }
        return lineData;
      };
      Layout2.getSourceIndex = function(e) {
        return typeof e.source === "number" ? e.source : e.source.index;
      };
      Layout2.getTargetIndex = function(e) {
        return typeof e.target === "number" ? e.target : e.target.index;
      };
      Layout2.linkId = function(e) {
        return Layout2.getSourceIndex(e) + "-" + Layout2.getTargetIndex(e);
      };
      Layout2.dragStart = function(d) {
        if (isGroup(d)) {
          Layout2.storeOffset(d, Layout2.dragOrigin(d));
        } else {
          Layout2.stopNode(d);
          d.fixed |= 2;
        }
      };
      Layout2.stopNode = function(v) {
        v.px = v.x;
        v.py = v.y;
      };
      Layout2.storeOffset = function(d, origin) {
        if (typeof d.leaves !== "undefined") {
          d.leaves.forEach(function(v) {
            v.fixed |= 2;
            Layout2.stopNode(v);
            v._dragGroupOffsetX = v.x - origin.x;
            v._dragGroupOffsetY = v.y - origin.y;
          });
        }
        if (typeof d.groups !== "undefined") {
          d.groups.forEach(function(g) {
            return Layout2.storeOffset(g, origin);
          });
        }
      };
      Layout2.dragOrigin = function(d) {
        if (isGroup(d)) {
          return {
            x: d.bounds.cx(),
            y: d.bounds.cy()
          };
        } else {
          return d;
        }
      };
      Layout2.drag = function(d, position) {
        if (isGroup(d)) {
          if (typeof d.leaves !== "undefined") {
            d.leaves.forEach(function(v) {
              d.bounds.setXCentre(position.x);
              d.bounds.setYCentre(position.y);
              v.px = v._dragGroupOffsetX + position.x;
              v.py = v._dragGroupOffsetY + position.y;
            });
          }
          if (typeof d.groups !== "undefined") {
            d.groups.forEach(function(g) {
              return Layout2.drag(g, position);
            });
          }
        } else {
          d.px = position.x;
          d.py = position.y;
        }
      };
      Layout2.dragEnd = function(d) {
        if (isGroup(d)) {
          if (typeof d.leaves !== "undefined") {
            d.leaves.forEach(function(v) {
              Layout2.dragEnd(v);
              delete v._dragGroupOffsetX;
              delete v._dragGroupOffsetY;
            });
          }
          if (typeof d.groups !== "undefined") {
            d.groups.forEach(Layout2.dragEnd);
          }
        } else {
          d.fixed &= ~6;
        }
      };
      Layout2.mouseOver = function(d) {
        d.fixed |= 4;
        d.px = d.x, d.py = d.y;
      };
      Layout2.mouseOut = function(d) {
        d.fixed &= ~4;
      };
      return Layout2;
    }();
    exports.Layout = Layout;
  }
});

// node_modules/webcola/dist/src/adaptor.js
var require_adaptor = __commonJS({
  "node_modules/webcola/dist/src/adaptor.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    var layout_1 = require_layout();
    var LayoutAdaptor = function(_super) {
      __extends(LayoutAdaptor2, _super);
      function LayoutAdaptor2(options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var o = options;
        if (o.trigger) {
          _this.trigger = o.trigger;
        }
        if (o.kick) {
          _this.kick = o.kick;
        }
        if (o.drag) {
          _this.drag = o.drag;
        }
        if (o.on) {
          _this.on = o.on;
        }
        _this.dragstart = _this.dragStart = layout_1.Layout.dragStart;
        _this.dragend = _this.dragEnd = layout_1.Layout.dragEnd;
        return _this;
      }
      LayoutAdaptor2.prototype.trigger = function(e) {
      };
      ;
      LayoutAdaptor2.prototype.kick = function() {
      };
      ;
      LayoutAdaptor2.prototype.drag = function() {
      };
      ;
      LayoutAdaptor2.prototype.on = function(eventType, listener) {
        return this;
      };
      ;
      return LayoutAdaptor2;
    }(layout_1.Layout);
    exports.LayoutAdaptor = LayoutAdaptor;
    function adaptor(options) {
      return new LayoutAdaptor(options);
    }
    exports.adaptor = adaptor;
  }
});

// node_modules/webcola/dist/src/d3v3adaptor.js
var require_d3v3adaptor = __commonJS({
  "node_modules/webcola/dist/src/d3v3adaptor.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    var layout_1 = require_layout();
    var D3StyleLayoutAdaptor = function(_super) {
      __extends(D3StyleLayoutAdaptor2, _super);
      function D3StyleLayoutAdaptor2() {
        var _this = _super.call(this) || this;
        _this.event = d3.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function() {
          if (!drag2) {
            var drag2 = d3.behavior.drag().origin(layout_1.Layout.dragOrigin).on("dragstart.d3adaptor", layout_1.Layout.dragStart).on("drag.d3adaptor", function(d) {
              layout_1.Layout.drag(d, d3.event);
              d3layout.resume();
            }).on("dragend.d3adaptor", layout_1.Layout.dragEnd);
          }
          if (!arguments.length)
            return drag2;
          this.call(drag2);
        };
        return _this;
      }
      D3StyleLayoutAdaptor2.prototype.trigger = function(e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event[d3event.type](d3event);
      };
      D3StyleLayoutAdaptor2.prototype.kick = function() {
        var _this = this;
        d3.timer(function() {
          return _super.prototype.tick.call(_this);
        });
      };
      D3StyleLayoutAdaptor2.prototype.on = function(eventType, listener) {
        if (typeof eventType === "string") {
          this.event.on(eventType, listener);
        } else {
          this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
      };
      return D3StyleLayoutAdaptor2;
    }(layout_1.Layout);
    exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
    function d3adaptor() {
      return new D3StyleLayoutAdaptor();
    }
    exports.d3adaptor = d3adaptor;
  }
});

// node_modules/webcola/dist/src/d3v4adaptor.js
var require_d3v4adaptor = __commonJS({
  "node_modules/webcola/dist/src/d3v4adaptor.js"(exports) {
    "use strict";
    var __extends = exports && exports.__extends || /* @__PURE__ */ function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (b2.hasOwnProperty(p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    }();
    Object.defineProperty(exports, "__esModule", { value: true });
    var layout_1 = require_layout();
    var D3StyleLayoutAdaptor = function(_super) {
      __extends(D3StyleLayoutAdaptor2, _super);
      function D3StyleLayoutAdaptor2(d3Context) {
        var _this = _super.call(this) || this;
        _this.d3Context = d3Context;
        _this.event = d3Context.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function() {
          if (!drag2) {
            var drag2 = d3Context.drag().subject(layout_1.Layout.dragOrigin).on("start.d3adaptor", layout_1.Layout.dragStart).on("drag.d3adaptor", function(d) {
              layout_1.Layout.drag(d, d3Context.event);
              d3layout.resume();
            }).on("end.d3adaptor", layout_1.Layout.dragEnd);
          }
          if (!arguments.length)
            return drag2;
          arguments[0].call(drag2);
        };
        return _this;
      }
      D3StyleLayoutAdaptor2.prototype.trigger = function(e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event.call(d3event.type, d3event);
      };
      D3StyleLayoutAdaptor2.prototype.kick = function() {
        var _this = this;
        var t = this.d3Context.timer(function() {
          return _super.prototype.tick.call(_this) && t.stop();
        });
      };
      D3StyleLayoutAdaptor2.prototype.on = function(eventType, listener) {
        if (typeof eventType === "string") {
          this.event.on(eventType, listener);
        } else {
          this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
      };
      return D3StyleLayoutAdaptor2;
    }(layout_1.Layout);
    exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
  }
});

// node_modules/webcola/dist/src/d3adaptor.js
var require_d3adaptor = __commonJS({
  "node_modules/webcola/dist/src/d3adaptor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var d3v3 = require_d3v3adaptor();
    var d3v4 = require_d3v4adaptor();
    function d3adaptor(d3Context) {
      if (!d3Context || isD3V3(d3Context)) {
        return new d3v3.D3StyleLayoutAdaptor();
      }
      return new d3v4.D3StyleLayoutAdaptor(d3Context);
    }
    exports.d3adaptor = d3adaptor;
    function isD3V3(d3Context) {
      var v3exp = /^3\./;
      return d3Context.version && d3Context.version.match(v3exp) !== null;
    }
  }
});

// node_modules/webcola/dist/src/gridrouter.js
var require_gridrouter = __commonJS({
  "node_modules/webcola/dist/src/gridrouter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var rectangle_1 = require_rectangle();
    var vpsc_1 = require_vpsc();
    var shortestpaths_1 = require_shortestpaths();
    var NodeWrapper = /* @__PURE__ */ function() {
      function NodeWrapper2(id, rect, children) {
        this.id = id;
        this.rect = rect;
        this.children = children;
        this.leaf = typeof children === "undefined" || children.length === 0;
      }
      return NodeWrapper2;
    }();
    exports.NodeWrapper = NodeWrapper;
    var Vert = /* @__PURE__ */ function() {
      function Vert2(id, x, y, node, line) {
        if (node === void 0) {
          node = null;
        }
        if (line === void 0) {
          line = null;
        }
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = node;
        this.line = line;
      }
      return Vert2;
    }();
    exports.Vert = Vert;
    var LongestCommonSubsequence = function() {
      function LongestCommonSubsequence2(s, t) {
        this.s = s;
        this.t = t;
        var mf = LongestCommonSubsequence2.findMatch(s, t);
        var tr = t.slice(0).reverse();
        var mr = LongestCommonSubsequence2.findMatch(s, tr);
        if (mf.length >= mr.length) {
          this.length = mf.length;
          this.si = mf.si;
          this.ti = mf.ti;
          this.reversed = false;
        } else {
          this.length = mr.length;
          this.si = mr.si;
          this.ti = t.length - mr.ti - mr.length;
          this.reversed = true;
        }
      }
      LongestCommonSubsequence2.findMatch = function(s, t) {
        var m = s.length;
        var n = t.length;
        var match = { length: 0, si: -1, ti: -1 };
        var l = new Array(m);
        for (var i = 0; i < m; i++) {
          l[i] = new Array(n);
          for (var j = 0; j < n; j++)
            if (s[i] === t[j]) {
              var v = l[i][j] = i === 0 || j === 0 ? 1 : l[i - 1][j - 1] + 1;
              if (v > match.length) {
                match.length = v;
                match.si = i - v + 1;
                match.ti = j - v + 1;
              }
              ;
            } else
              l[i][j] = 0;
        }
        return match;
      };
      LongestCommonSubsequence2.prototype.getSequence = function() {
        return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
      };
      return LongestCommonSubsequence2;
    }();
    exports.LongestCommonSubsequence = LongestCommonSubsequence;
    var GridRouter = function() {
      function GridRouter2(originalnodes, accessor, groupPadding) {
        var _this = this;
        if (groupPadding === void 0) {
          groupPadding = 12;
        }
        this.originalnodes = originalnodes;
        this.groupPadding = groupPadding;
        this.leaves = null;
        this.nodes = originalnodes.map(function(v, i) {
          return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v));
        });
        this.leaves = this.nodes.filter(function(v) {
          return v.leaf;
        });
        this.groups = this.nodes.filter(function(g) {
          return !g.leaf;
        });
        this.cols = this.getGridLines("x");
        this.rows = this.getGridLines("y");
        this.groups.forEach(function(v) {
          return v.children.forEach(function(c) {
            return _this.nodes[c].parent = v;
          });
        });
        this.root = { children: [] };
        this.nodes.forEach(function(v) {
          if (typeof v.parent === "undefined") {
            v.parent = _this.root;
            _this.root.children.push(v.id);
          }
          v.ports = [];
        });
        this.backToFront = this.nodes.slice(0);
        this.backToFront.sort(function(x, y) {
          return _this.getDepth(x) - _this.getDepth(y);
        });
        var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function(g) {
          return !g.leaf;
        });
        frontToBackGroups.forEach(function(v) {
          var r = rectangle_1.Rectangle.empty();
          v.children.forEach(function(c) {
            return r = r.union(_this.nodes[c].rect);
          });
          v.rect = r.inflate(_this.groupPadding);
        });
        var colMids = this.midPoints(this.cols.map(function(r) {
          return r.pos;
        }));
        var rowMids = this.midPoints(this.rows.map(function(r) {
          return r.pos;
        }));
        var rowx = colMids[0], rowX = colMids[colMids.length - 1];
        var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
        var hlines = this.rows.map(function(r) {
          return { x1: rowx, x2: rowX, y1: r.pos, y2: r.pos };
        }).concat(rowMids.map(function(m) {
          return { x1: rowx, x2: rowX, y1: m, y2: m };
        }));
        var vlines = this.cols.map(function(c) {
          return { x1: c.pos, x2: c.pos, y1: coly, y2: colY };
        }).concat(colMids.map(function(m) {
          return { x1: m, x2: m, y1: coly, y2: colY };
        }));
        var lines = hlines.concat(vlines);
        lines.forEach(function(l) {
          return l.verts = [];
        });
        this.verts = [];
        this.edges = [];
        hlines.forEach(function(h) {
          return vlines.forEach(function(v) {
            var p = new Vert(_this.verts.length, v.x1, h.y1);
            h.verts.push(p);
            v.verts.push(p);
            _this.verts.push(p);
            var i = _this.backToFront.length;
            while (i-- > 0) {
              var node = _this.backToFront[i], r = node.rect;
              var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
              if (dx < r.width() / 2 && dy < r.height() / 2) {
                p.node = node;
                break;
              }
            }
          });
        });
        lines.forEach(function(l, li) {
          _this.nodes.forEach(function(v2, i2) {
            v2.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function(intersect, j) {
              var p = new Vert(_this.verts.length, intersect.x, intersect.y, v2, l);
              _this.verts.push(p);
              l.verts.push(p);
              v2.ports.push(p);
            });
          });
          var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
          var delta = function(a, b) {
            return isHoriz ? b.x - a.x : b.y - a.y;
          };
          l.verts.sort(delta);
          for (var i = 1; i < l.verts.length; i++) {
            var u = l.verts[i - 1], v = l.verts[i];
            if (u.node && u.node === v.node && u.node.leaf)
              continue;
            _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
          }
        });
      }
      GridRouter2.prototype.avg = function(a) {
        return a.reduce(function(x, y) {
          return x + y;
        }) / a.length;
      };
      GridRouter2.prototype.getGridLines = function(axis) {
        var columns = [];
        var ls = this.leaves.slice(0, this.leaves.length);
        while (ls.length > 0) {
          var overlapping = ls.filter(function(v) {
            return v.rect["overlap" + axis.toUpperCase()](ls[0].rect);
          });
          var col = {
            nodes: overlapping,
            pos: this.avg(overlapping.map(function(v) {
              return v.rect["c" + axis]();
            }))
          };
          columns.push(col);
          col.nodes.forEach(function(v) {
            return ls.splice(ls.indexOf(v), 1);
          });
        }
        columns.sort(function(a, b) {
          return a.pos - b.pos;
        });
        return columns;
      };
      GridRouter2.prototype.getDepth = function(v) {
        var depth = 0;
        while (v.parent !== this.root) {
          depth++;
          v = v.parent;
        }
        return depth;
      };
      GridRouter2.prototype.midPoints = function(a) {
        var gap = a[1] - a[0];
        var mids = [a[0] - gap / 2];
        for (var i = 1; i < a.length; i++) {
          mids.push((a[i] + a[i - 1]) / 2);
        }
        mids.push(a[a.length - 1] + gap / 2);
        return mids;
      };
      GridRouter2.prototype.findLineage = function(v) {
        var lineage = [v];
        do {
          v = v.parent;
          lineage.push(v);
        } while (v !== this.root);
        return lineage.reverse();
      };
      GridRouter2.prototype.findAncestorPathBetween = function(a, b) {
        var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
        while (aa[i] === ba[i])
          i++;
        return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
      };
      GridRouter2.prototype.siblingObstacles = function(a, b) {
        var _this = this;
        var path = this.findAncestorPathBetween(a, b);
        var lineageLookup = {};
        path.lineages.forEach(function(v) {
          return lineageLookup[v.id] = {};
        });
        var obstacles = path.commonAncestor.children.filter(function(v) {
          return !(v in lineageLookup);
        });
        path.lineages.filter(function(v) {
          return v.parent !== path.commonAncestor;
        }).forEach(function(v) {
          return obstacles = obstacles.concat(v.parent.children.filter(function(c) {
            return c !== v.id;
          }));
        });
        return obstacles.map(function(v) {
          return _this.nodes[v];
        });
      };
      GridRouter2.getSegmentSets = function(routes, x, y) {
        var vsegments = [];
        for (var ei = 0; ei < routes.length; ei++) {
          var route = routes[ei];
          for (var si = 0; si < route.length; si++) {
            var s = route[si];
            s.edgeid = ei;
            s.i = si;
            var sdx = s[1][x] - s[0][x];
            if (Math.abs(sdx) < 0.1) {
              vsegments.push(s);
            }
          }
        }
        vsegments.sort(function(a, b) {
          return a[0][x] - b[0][x];
        });
        var vsegmentsets = [];
        var segmentset = null;
        for (var i = 0; i < vsegments.length; i++) {
          var s = vsegments[i];
          if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
            segmentset = { pos: s[0][x], segments: [] };
            vsegmentsets.push(segmentset);
          }
          segmentset.segments.push(s);
        }
        return vsegmentsets;
      };
      GridRouter2.nudgeSegs = function(x, y, routes, segments, leftOf, gap) {
        var n = segments.length;
        if (n <= 1)
          return;
        var vs = segments.map(function(s) {
          return new vpsc_1.Variable(s[0][x]);
        });
        var cs = [];
        for (var i = 0; i < n; i++) {
          for (var j = 0; j < n; j++) {
            if (i === j)
              continue;
            var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
            if (x == "x") {
              if (leftOf(e1, e2)) {
                if (s1[0][y] < s1[1][y]) {
                  lind = j, rind = i;
                } else {
                  lind = i, rind = j;
                }
              }
            } else {
              if (leftOf(e1, e2)) {
                if (s1[0][y] < s1[1][y]) {
                  lind = i, rind = j;
                } else {
                  lind = j, rind = i;
                }
              }
            }
            if (lind >= 0) {
              cs.push(new vpsc_1.Constraint(vs[lind], vs[rind], gap));
            }
          }
        }
        var solver = new vpsc_1.Solver(vs, cs);
        solver.solve();
        vs.forEach(function(v, i2) {
          var s = segments[i2];
          var pos = v.position();
          s[0][x] = s[1][x] = pos;
          var route = routes[s.edgeid];
          if (s.i > 0)
            route[s.i - 1][1][x] = pos;
          if (s.i < route.length - 1)
            route[s.i + 1][0][x] = pos;
        });
      };
      GridRouter2.nudgeSegments = function(routes, x, y, leftOf, gap) {
        var vsegmentsets = GridRouter2.getSegmentSets(routes, x, y);
        for (var i = 0; i < vsegmentsets.length; i++) {
          var ss = vsegmentsets[i];
          var events = [];
          for (var j = 0; j < ss.segments.length; j++) {
            var s = ss.segments[j];
            events.push({ type: 0, s, pos: Math.min(s[0][y], s[1][y]) });
            events.push({ type: 1, s, pos: Math.max(s[0][y], s[1][y]) });
          }
          events.sort(function(a, b) {
            return a.pos - b.pos + a.type - b.type;
          });
          var open = [];
          var openCount = 0;
          events.forEach(function(e) {
            if (e.type === 0) {
              open.push(e.s);
              openCount++;
            } else {
              openCount--;
            }
            if (openCount == 0) {
              GridRouter2.nudgeSegs(x, y, routes, open, leftOf, gap);
              open = [];
            }
          });
        }
      };
      GridRouter2.prototype.routeEdges = function(edges, nudgeGap, source, target) {
        var _this = this;
        var routePaths = edges.map(function(e) {
          return _this.route(source(e), target(e));
        });
        var order = GridRouter2.orderEdges(routePaths);
        var routes = routePaths.map(function(e) {
          return GridRouter2.makeSegments(e);
        });
        GridRouter2.nudgeSegments(routes, "x", "y", order, nudgeGap);
        GridRouter2.nudgeSegments(routes, "y", "x", order, nudgeGap);
        GridRouter2.unreverseEdges(routes, routePaths);
        return routes;
      };
      GridRouter2.unreverseEdges = function(routes, routePaths) {
        routes.forEach(function(segments, i) {
          var path = routePaths[i];
          if (path.reversed) {
            segments.reverse();
            segments.forEach(function(segment) {
              segment.reverse();
            });
          }
        });
      };
      GridRouter2.angleBetween2Lines = function(line1, line2) {
        var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
        var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
        var diff = angle1 - angle2;
        if (diff > Math.PI || diff < -Math.PI) {
          diff = angle2 - angle1;
        }
        return diff;
      };
      GridRouter2.isLeft = function(a, b, c) {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 0;
      };
      GridRouter2.getOrder = function(pairs) {
        var outgoing = {};
        for (var i = 0; i < pairs.length; i++) {
          var p = pairs[i];
          if (typeof outgoing[p.l] === "undefined")
            outgoing[p.l] = {};
          outgoing[p.l][p.r] = true;
        }
        return function(l, r) {
          return typeof outgoing[l] !== "undefined" && outgoing[l][r];
        };
      };
      GridRouter2.orderEdges = function(edges) {
        var edgeOrder = [];
        for (var i = 0; i < edges.length - 1; i++) {
          for (var j = i + 1; j < edges.length; j++) {
            var e = edges[i], f = edges[j], lcs = new LongestCommonSubsequence(e, f);
            var u, vi, vj;
            if (lcs.length === 0)
              continue;
            if (lcs.reversed) {
              f.reverse();
              f.reversed = true;
              lcs = new LongestCommonSubsequence(e, f);
            }
            if ((lcs.si <= 0 || lcs.ti <= 0) && (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
              edgeOrder.push({ l: i, r: j });
              continue;
            }
            if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
              u = e[lcs.si + 1];
              vj = e[lcs.si - 1];
              vi = f[lcs.ti - 1];
            } else {
              u = e[lcs.si + lcs.length - 2];
              vi = e[lcs.si + lcs.length];
              vj = f[lcs.ti + lcs.length];
            }
            if (GridRouter2.isLeft(u, vi, vj)) {
              edgeOrder.push({ l: j, r: i });
            } else {
              edgeOrder.push({ l: i, r: j });
            }
          }
        }
        return GridRouter2.getOrder(edgeOrder);
      };
      GridRouter2.makeSegments = function(path) {
        function copyPoint(p) {
          return { x: p.x, y: p.y };
        }
        var isStraight = function(a2, b2, c2) {
          return Math.abs((b2.x - a2.x) * (c2.y - a2.y) - (b2.y - a2.y) * (c2.x - a2.x)) < 1e-3;
        };
        var segments = [];
        var a = copyPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
          var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
          if (!c || !isStraight(a, b, c)) {
            segments.push([a, b]);
            a = b;
          }
        }
        return segments;
      };
      GridRouter2.prototype.route = function(s, t) {
        var _this = this;
        var source = this.nodes[s], target = this.nodes[t];
        this.obstacles = this.siblingObstacles(source, target);
        var obstacleLookup = {};
        this.obstacles.forEach(function(o) {
          return obstacleLookup[o.id] = o;
        });
        this.passableEdges = this.edges.filter(function(e) {
          var u2 = _this.verts[e.source], v2 = _this.verts[e.target];
          return !(u2.node && u2.node.id in obstacleLookup || v2.node && v2.node.id in obstacleLookup);
        });
        for (var i = 1; i < source.ports.length; i++) {
          var u = source.ports[0].id;
          var v = source.ports[i].id;
          this.passableEdges.push({
            source: u,
            target: v,
            length: 0
          });
        }
        for (var i = 1; i < target.ports.length; i++) {
          var u = target.ports[0].id;
          var v = target.ports[i].id;
          this.passableEdges.push({
            source: u,
            target: v,
            length: 0
          });
        }
        var getSource = function(e) {
          return e.source;
        }, getTarget = function(e) {
          return e.target;
        }, getLength = function(e) {
          return e.length;
        };
        var shortestPathCalculator = new shortestpaths_1.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
        var bendPenalty = function(u2, v2, w) {
          var a = _this.verts[u2], b = _this.verts[v2], c = _this.verts[w];
          var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
          if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
            return 0;
          return dx > 1 && dy > 1 ? 1e3 : 0;
        };
        var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
        var pathPoints = shortestPath.reverse().map(function(vi) {
          return _this.verts[vi];
        });
        pathPoints.push(this.nodes[target.id].ports[0]);
        return pathPoints.filter(function(v2, i2) {
          return !(i2 < pathPoints.length - 1 && pathPoints[i2 + 1].node === source && v2.node === source || i2 > 0 && v2.node === target && pathPoints[i2 - 1].node === target);
        });
      };
      GridRouter2.getRoutePath = function(route, cornerradius, arrowwidth, arrowheight) {
        var result = {
          routepath: "M " + route[0][0].x + " " + route[0][0].y + " ",
          arrowpath: ""
        };
        if (route.length > 1) {
          for (var i = 0; i < route.length; i++) {
            var li = route[i];
            var x = li[1].x, y = li[1].y;
            var dx = x - li[0].x;
            var dy = y - li[0].y;
            if (i < route.length - 1) {
              if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * cornerradius;
              } else {
                y -= dy / Math.abs(dy) * cornerradius;
              }
              result.routepath += "L " + x + " " + y + " ";
              var l = route[i + 1];
              var x0 = l[0].x, y0 = l[0].y;
              var x1 = l[1].x;
              var y1 = l[1].y;
              dx = x1 - x0;
              dy = y1 - y0;
              var angle = GridRouter2.angleBetween2Lines(li, l) < 0 ? 1 : 0;
              var x2, y2;
              if (Math.abs(dx) > 0) {
                x2 = x0 + dx / Math.abs(dx) * cornerradius;
                y2 = y0;
              } else {
                x2 = x0;
                y2 = y0 + dy / Math.abs(dy) * cornerradius;
              }
              var cx = Math.abs(x2 - x);
              var cy = Math.abs(y2 - y);
              result.routepath += "A " + cx + " " + cy + " 0 0 " + angle + " " + x2 + " " + y2 + " ";
            } else {
              var arrowtip = [x, y];
              var arrowcorner1, arrowcorner2;
              if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * arrowheight;
                arrowcorner1 = [x, y + arrowwidth];
                arrowcorner2 = [x, y - arrowwidth];
              } else {
                y -= dy / Math.abs(dy) * arrowheight;
                arrowcorner1 = [x + arrowwidth, y];
                arrowcorner2 = [x - arrowwidth, y];
              }
              result.routepath += "L " + x + " " + y + " ";
              if (arrowheight > 0) {
                result.arrowpath = "M " + arrowtip[0] + " " + arrowtip[1] + " L " + arrowcorner1[0] + " " + arrowcorner1[1] + " L " + arrowcorner2[0] + " " + arrowcorner2[1];
              }
            }
          }
        } else {
          var li = route[0];
          var x = li[1].x, y = li[1].y;
          var dx = x - li[0].x;
          var dy = y - li[0].y;
          var arrowtip = [x, y];
          var arrowcorner1, arrowcorner2;
          if (Math.abs(dx) > 0) {
            x -= dx / Math.abs(dx) * arrowheight;
            arrowcorner1 = [x, y + arrowwidth];
            arrowcorner2 = [x, y - arrowwidth];
          } else {
            y -= dy / Math.abs(dy) * arrowheight;
            arrowcorner1 = [x + arrowwidth, y];
            arrowcorner2 = [x - arrowwidth, y];
          }
          result.routepath += "L " + x + " " + y + " ";
          if (arrowheight > 0) {
            result.arrowpath = "M " + arrowtip[0] + " " + arrowtip[1] + " L " + arrowcorner1[0] + " " + arrowcorner1[1] + " L " + arrowcorner2[0] + " " + arrowcorner2[1];
          }
        }
        return result;
      };
      return GridRouter2;
    }();
    exports.GridRouter = GridRouter;
  }
});

// node_modules/webcola/dist/src/layout3d.js
var require_layout3d = __commonJS({
  "node_modules/webcola/dist/src/layout3d.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var shortestpaths_1 = require_shortestpaths();
    var descent_1 = require_descent();
    var rectangle_1 = require_rectangle();
    var linklengths_1 = require_linklengths();
    var Link3D = function() {
      function Link3D2(source, target) {
        this.source = source;
        this.target = target;
      }
      Link3D2.prototype.actualLength = function(x) {
        var _this = this;
        return Math.sqrt(x.reduce(function(c, v) {
          var dx = v[_this.target] - v[_this.source];
          return c + dx * dx;
        }, 0));
      };
      return Link3D2;
    }();
    exports.Link3D = Link3D;
    var Node3D = /* @__PURE__ */ function() {
      function Node3D2(x, y, z) {
        if (x === void 0) {
          x = 0;
        }
        if (y === void 0) {
          y = 0;
        }
        if (z === void 0) {
          z = 0;
        }
        this.x = x;
        this.y = y;
        this.z = z;
      }
      return Node3D2;
    }();
    exports.Node3D = Node3D;
    var Layout3D = function() {
      function Layout3D2(nodes, links, idealLinkLength) {
        var _this = this;
        if (idealLinkLength === void 0) {
          idealLinkLength = 1;
        }
        this.nodes = nodes;
        this.links = links;
        this.idealLinkLength = idealLinkLength;
        this.constraints = null;
        this.useJaccardLinkLengths = true;
        this.result = new Array(Layout3D2.k);
        for (var i = 0; i < Layout3D2.k; ++i) {
          this.result[i] = new Array(nodes.length);
        }
        nodes.forEach(function(v, i2) {
          for (var _i = 0, _a = Layout3D2.dims; _i < _a.length; _i++) {
            var dim = _a[_i];
            if (typeof v[dim] == "undefined")
              v[dim] = Math.random();
          }
          _this.result[0][i2] = v.x;
          _this.result[1][i2] = v.y;
          _this.result[2][i2] = v.z;
        });
      }
      ;
      Layout3D2.prototype.linkLength = function(l) {
        return l.actualLength(this.result);
      };
      Layout3D2.prototype.start = function(iterations) {
        var _this = this;
        if (iterations === void 0) {
          iterations = 100;
        }
        var n = this.nodes.length;
        var linkAccessor = new LinkAccessor();
        if (this.useJaccardLinkLengths)
          linklengths_1.jaccardLinkLengths(this.links, linkAccessor, 1.5);
        this.links.forEach(function(e) {
          return e.length *= _this.idealLinkLength;
        });
        var distanceMatrix = new shortestpaths_1.Calculator(n, this.links, function(e) {
          return e.source;
        }, function(e) {
          return e.target;
        }, function(e) {
          return e.length;
        }).DistanceMatrix();
        var D = descent_1.Descent.createSquareMatrix(n, function(i2, j) {
          return distanceMatrix[i2][j];
        });
        var G = descent_1.Descent.createSquareMatrix(n, function() {
          return 2;
        });
        this.links.forEach(function(_a) {
          var source = _a.source, target = _a.target;
          return G[source][target] = G[target][source] = 1;
        });
        this.descent = new descent_1.Descent(this.result, D);
        this.descent.threshold = 1e-3;
        this.descent.G = G;
        if (this.constraints)
          this.descent.project = new rectangle_1.Projection(this.nodes, null, null, this.constraints).projectFunctions();
        for (var i = 0; i < this.nodes.length; i++) {
          var v = this.nodes[i];
          if (v.fixed) {
            this.descent.locks.add(i, [v.x, v.y, v.z]);
          }
        }
        this.descent.run(iterations);
        return this;
      };
      Layout3D2.prototype.tick = function() {
        this.descent.locks.clear();
        for (var i = 0; i < this.nodes.length; i++) {
          var v = this.nodes[i];
          if (v.fixed) {
            this.descent.locks.add(i, [v.x, v.y, v.z]);
          }
        }
        return this.descent.rungeKutta();
      };
      Layout3D2.dims = ["x", "y", "z"];
      Layout3D2.k = Layout3D2.dims.length;
      return Layout3D2;
    }();
    exports.Layout3D = Layout3D;
    var LinkAccessor = function() {
      function LinkAccessor2() {
      }
      LinkAccessor2.prototype.getSourceIndex = function(e) {
        return e.source;
      };
      LinkAccessor2.prototype.getTargetIndex = function(e) {
        return e.target;
      };
      LinkAccessor2.prototype.getLength = function(e) {
        return e.length;
      };
      LinkAccessor2.prototype.setLength = function(e, l) {
        e.length = l;
      };
      return LinkAccessor2;
    }();
  }
});

// node_modules/webcola/dist/src/batch.js
var require_batch = __commonJS({
  "node_modules/webcola/dist/src/batch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var layout_1 = require_layout();
    var gridrouter_1 = require_gridrouter();
    function gridify(pgLayout, nudgeGap, margin, groupMargin) {
      pgLayout.cola.start(0, 0, 0, 10, false);
      var gridrouter = route(pgLayout.cola.nodes(), pgLayout.cola.groups(), margin, groupMargin);
      return gridrouter.routeEdges(pgLayout.powerGraph.powerEdges, nudgeGap, function(e) {
        return e.source.routerNode.id;
      }, function(e) {
        return e.target.routerNode.id;
      });
    }
    exports.gridify = gridify;
    function route(nodes, groups, margin, groupMargin) {
      nodes.forEach(function(d) {
        d.routerNode = {
          name: d.name,
          bounds: d.bounds.inflate(-margin)
        };
      });
      groups.forEach(function(d) {
        d.routerNode = {
          bounds: d.bounds.inflate(-groupMargin),
          children: (typeof d.groups !== "undefined" ? d.groups.map(function(c) {
            return nodes.length + c.id;
          }) : []).concat(typeof d.leaves !== "undefined" ? d.leaves.map(function(c) {
            return c.index;
          }) : [])
        };
      });
      var gridRouterNodes = nodes.concat(groups).map(function(d, i) {
        d.routerNode.id = i;
        return d.routerNode;
      });
      return new gridrouter_1.GridRouter(gridRouterNodes, {
        getChildren: function(v) {
          return v.children;
        },
        getBounds: function(v) {
          return v.bounds;
        }
      }, margin - groupMargin);
    }
    function powerGraphGridLayout(graph, size, grouppadding) {
      var powerGraph;
      graph.nodes.forEach(function(v, i) {
        return v.index = i;
      });
      new layout_1.Layout().avoidOverlaps(false).nodes(graph.nodes).links(graph.links).powerGraphGroups(function(d) {
        powerGraph = d;
        powerGraph.groups.forEach(function(v) {
          return v.padding = grouppadding;
        });
      });
      var n = graph.nodes.length;
      var edges = [];
      var vs = graph.nodes.slice(0);
      vs.forEach(function(v, i) {
        return v.index = i;
      });
      powerGraph.groups.forEach(function(g) {
        var sourceInd = g.index = g.id + n;
        vs.push(g);
        if (typeof g.leaves !== "undefined")
          g.leaves.forEach(function(v) {
            return edges.push({ source: sourceInd, target: v.index });
          });
        if (typeof g.groups !== "undefined")
          g.groups.forEach(function(gg) {
            return edges.push({ source: sourceInd, target: gg.id + n });
          });
      });
      powerGraph.powerEdges.forEach(function(e) {
        edges.push({ source: e.source.index, target: e.target.index });
      });
      new layout_1.Layout().size(size).nodes(vs).links(edges).avoidOverlaps(false).linkDistance(30).symmetricDiffLinkLengths(5).convergenceThreshold(1e-4).start(100, 0, 0, 0, false);
      return {
        cola: new layout_1.Layout().convergenceThreshold(1e-3).size(size).avoidOverlaps(true).nodes(graph.nodes).links(graph.links).groupCompactness(1e-4).linkDistance(30).symmetricDiffLinkLengths(5).powerGraphGroups(function(d) {
          powerGraph = d;
          powerGraph.groups.forEach(function(v) {
            v.padding = grouppadding;
          });
        }).start(50, 0, 100, 0, false),
        powerGraph
      };
    }
    exports.powerGraphGridLayout = powerGraphGridLayout;
  }
});

// node_modules/webcola/dist/index.js
var require_dist = __commonJS({
  "node_modules/webcola/dist/index.js"(exports) {
    "use strict";
    function __export(m) {
      for (var p in m)
        if (!exports.hasOwnProperty(p))
          exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(require_adaptor());
    __export(require_d3adaptor());
    __export(require_descent());
    __export(require_geom());
    __export(require_gridrouter());
    __export(require_handledisconnected());
    __export(require_layout());
    __export(require_layout3d());
    __export(require_linklengths());
    __export(require_powergraph());
    __export(require_pqueue());
    __export(require_rbtree());
    __export(require_rectangle());
    __export(require_shortestpaths());
    __export(require_vpsc());
    __export(require_batch());
  }
});

// node_modules/cytoscape-cola/cytoscape-cola.js
var require_cytoscape_cola = __commonJS({
  "node_modules/cytoscape-cola/cytoscape-cola.js"(exports, module) {
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports === "object" && typeof module === "object")
        module.exports = factory(require_dist());
      else if (typeof define === "function" && define.amd)
        define(["webcola"], factory);
      else if (typeof exports === "object")
        exports["cytoscapeCola"] = factory(require_dist());
      else
        root["cytoscapeCola"] = factory(root["webcola"]);
    })(exports, function(__WEBPACK_EXTERNAL_MODULE_5__) {
      return (
        /******/
        function(modules) {
          var installedModules = {};
          function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) {
              return installedModules[moduleId].exports;
            }
            var module2 = installedModules[moduleId] = {
              /******/
              i: moduleId,
              /******/
              l: false,
              /******/
              exports: {}
              /******/
            };
            modules[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
            module2.l = true;
            return module2.exports;
          }
          __webpack_require__.m = modules;
          __webpack_require__.c = installedModules;
          __webpack_require__.i = function(value) {
            return value;
          };
          __webpack_require__.d = function(exports2, name, getter) {
            if (!__webpack_require__.o(exports2, name)) {
              Object.defineProperty(exports2, name, {
                /******/
                configurable: false,
                /******/
                enumerable: true,
                /******/
                get: getter
                /******/
              });
            }
          };
          __webpack_require__.n = function(module2) {
            var getter = module2 && module2.__esModule ? (
              /******/
              function getDefault() {
                return module2["default"];
              }
            ) : (
              /******/
              function getModuleExports() {
                return module2;
              }
            );
            __webpack_require__.d(getter, "a", getter);
            return getter;
          };
          __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
          };
          __webpack_require__.p = "";
          return __webpack_require__(__webpack_require__.s = 3);
        }([
          /* 0 */
          /***/
          function(module2, exports2, __webpack_require__) {
            "use strict";
            var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
              return typeof obj;
            } : function(obj) {
              return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            var assign = __webpack_require__(1);
            var defaults = __webpack_require__(2);
            var cola = __webpack_require__(5) || (typeof window !== "undefined" ? window.cola : null);
            var raf = __webpack_require__(4);
            var isString = function isString2(o) {
              return (typeof o === "undefined" ? "undefined" : _typeof(o)) === _typeof("");
            };
            var isNumber = function isNumber2(o) {
              return (typeof o === "undefined" ? "undefined" : _typeof(o)) === _typeof(0);
            };
            var isObject = function isObject2(o) {
              return o != null && (typeof o === "undefined" ? "undefined" : _typeof(o)) === _typeof({});
            };
            var isFunction = function isFunction2(o) {
              return o != null && (typeof o === "undefined" ? "undefined" : _typeof(o)) === _typeof(function() {
              });
            };
            var nop = function nop2() {
            };
            var getOptVal = function getOptVal2(val, ele) {
              if (isFunction(val)) {
                var fn = val;
                return fn.apply(ele, [ele]);
              } else {
                return val;
              }
            };
            function ColaLayout(options) {
              this.options = assign({}, defaults, options);
            }
            ColaLayout.prototype.run = function() {
              var layout = this;
              var options = this.options;
              layout.manuallyStopped = false;
              var cy = options.cy;
              var eles = options.eles;
              var nodes = eles.nodes();
              var edges = eles.edges();
              var ready = false;
              var isParent = function isParent2(ele) {
                return ele.isParent();
              };
              var parentNodes = nodes.filter(isParent);
              var nonparentNodes = nodes.subtract(parentNodes);
              var bb = options.boundingBox || { x1: 0, y1: 0, w: cy.width(), h: cy.height() };
              if (bb.x2 === void 0) {
                bb.x2 = bb.x1 + bb.w;
              }
              if (bb.w === void 0) {
                bb.w = bb.x2 - bb.x1;
              }
              if (bb.y2 === void 0) {
                bb.y2 = bb.y1 + bb.h;
              }
              if (bb.h === void 0) {
                bb.h = bb.y2 - bb.y1;
              }
              var updateNodePositions = function updateNodePositions2() {
                for (var i = 0; i < nodes.length; i++) {
                  var node = nodes[i];
                  var dimensions = node.layoutDimensions(options);
                  var scratch = node.scratch("cola");
                  if (!scratch.updatedDims) {
                    var padding = getOptVal(options.nodeSpacing, node);
                    scratch.width = dimensions.w + 2 * padding;
                    scratch.height = dimensions.h + 2 * padding;
                  }
                }
                nodes.positions(function(node2) {
                  var scratch2 = node2.scratch().cola;
                  var retPos = void 0;
                  if (!node2.grabbed() && nonparentNodes.contains(node2)) {
                    retPos = {
                      x: bb.x1 + scratch2.x,
                      y: bb.y1 + scratch2.y
                    };
                    if (!isNumber(retPos.x) || !isNumber(retPos.y)) {
                      retPos = void 0;
                    }
                  }
                  return retPos;
                });
                nodes.updateCompoundBounds();
                if (!ready) {
                  onReady();
                  ready = true;
                }
                if (options.fit) {
                  cy.fit(options.padding);
                }
              };
              var onDone = function onDone2() {
                if (options.ungrabifyWhileSimulating) {
                  grabbableNodes.grabify();
                }
                cy.off("destroy", destroyHandler);
                nodes.off("grab free position", grabHandler);
                nodes.off("lock unlock", lockHandler);
                layout.one("layoutstop", options.stop);
                layout.trigger({ type: "layoutstop", layout });
              };
              var onReady = function onReady2() {
                layout.one("layoutready", options.ready);
                layout.trigger({ type: "layoutready", layout });
              };
              var ticksPerFrame = options.refresh;
              if (options.refresh < 0) {
                ticksPerFrame = 1;
              } else {
                ticksPerFrame = Math.max(1, ticksPerFrame);
              }
              var adaptor = layout.adaptor = cola.adaptor({
                trigger: function trigger(e) {
                  var TICK = cola.EventType ? cola.EventType.tick : null;
                  var END = cola.EventType ? cola.EventType.end : null;
                  switch (e.type) {
                    case "tick":
                    case TICK:
                      if (options.animate) {
                        updateNodePositions();
                      }
                      break;
                    case "end":
                    case END:
                      updateNodePositions();
                      if (!options.infinite) {
                        onDone();
                      }
                      break;
                  }
                },
                kick: function kick() {
                  var firstTick = true;
                  var inftick = function inftick2() {
                    if (layout.manuallyStopped) {
                      onDone();
                      return true;
                    }
                    var ret = adaptor.tick();
                    if (!options.infinite && !firstTick) {
                      adaptor.convergenceThreshold(options.convergenceThreshold);
                    }
                    firstTick = false;
                    if (ret && options.infinite) {
                      adaptor.resume();
                    }
                    return ret;
                  };
                  var multitick = function multitick2() {
                    var ret = void 0;
                    for (var i = 0; i < ticksPerFrame && !ret; i++) {
                      ret = ret || inftick();
                    }
                    return ret;
                  };
                  if (options.animate) {
                    var frame = function frame2() {
                      if (multitick()) {
                        return;
                      }
                      raf(frame2);
                    };
                    raf(frame);
                  } else {
                    while (!inftick()) {
                    }
                  }
                },
                on: nop,
                // dummy; not needed
                drag: nop
                // not needed for our case
              });
              layout.adaptor = adaptor;
              var grabbableNodes = nodes.filter(":grabbable");
              if (options.ungrabifyWhileSimulating) {
                grabbableNodes.ungrabify();
              }
              var destroyHandler = void 0;
              cy.one("destroy", destroyHandler = function destroyHandler2() {
                layout.stop();
              });
              var grabHandler = void 0;
              nodes.on("grab free position", grabHandler = function grabHandler2(e) {
                var node = this;
                var scrCola = node.scratch().cola;
                var pos = node.position();
                var nodeIsTarget = e.cyTarget === node || e.target === node;
                if (!nodeIsTarget) {
                  return;
                }
                switch (e.type) {
                  case "grab":
                    adaptor.dragstart(scrCola);
                    break;
                  case "free":
                    adaptor.dragend(scrCola);
                    break;
                  case "position":
                    if (scrCola.px !== pos.x - bb.x1 || scrCola.py !== pos.y - bb.y1) {
                      scrCola.px = pos.x - bb.x1;
                      scrCola.py = pos.y - bb.y1;
                    }
                    break;
                }
              });
              var lockHandler = void 0;
              nodes.on("lock unlock", lockHandler = function lockHandler2() {
                var node = this;
                var scrCola = node.scratch().cola;
                scrCola.fixed = node.locked();
                if (node.locked()) {
                  adaptor.dragstart(scrCola);
                } else {
                  adaptor.dragend(scrCola);
                }
              });
              adaptor.nodes(nonparentNodes.map(function(node, i) {
                var padding = getOptVal(options.nodeSpacing, node);
                var pos = node.position();
                var dimensions = node.layoutDimensions(options);
                var struct = node.scratch().cola = {
                  x: options.randomize && !node.locked() || pos.x === void 0 ? Math.round(Math.random() * bb.w) : pos.x,
                  y: options.randomize && !node.locked() || pos.y === void 0 ? Math.round(Math.random() * bb.h) : pos.y,
                  width: dimensions.w + 2 * padding,
                  height: dimensions.h + 2 * padding,
                  index: i,
                  fixed: node.locked()
                };
                return struct;
              }));
              var constraints = [];
              if (options.alignment) {
                if (options.alignment.vertical) {
                  var verticalAlignments = options.alignment.vertical;
                  verticalAlignments.forEach(function(alignment) {
                    var offsetsX = [];
                    alignment.forEach(function(nodeData) {
                      var node = nodeData.node;
                      var scrCola = node.scratch().cola;
                      var index = scrCola.index;
                      offsetsX.push({
                        node: index,
                        offset: nodeData.offset ? nodeData.offset : 0
                      });
                    });
                    constraints.push({
                      type: "alignment",
                      axis: "x",
                      offsets: offsetsX
                    });
                  });
                }
                if (options.alignment.horizontal) {
                  var horizontalAlignments = options.alignment.horizontal;
                  horizontalAlignments.forEach(function(alignment) {
                    var offsetsY = [];
                    alignment.forEach(function(nodeData) {
                      var node = nodeData.node;
                      var scrCola = node.scratch().cola;
                      var index = scrCola.index;
                      offsetsY.push({
                        node: index,
                        offset: nodeData.offset ? nodeData.offset : 0
                      });
                    });
                    constraints.push({
                      type: "alignment",
                      axis: "y",
                      offsets: offsetsY
                    });
                  });
                }
              }
              if (options.gapInequalities) {
                options.gapInequalities.forEach(function(inequality) {
                  var leftIndex = inequality.left.scratch().cola.index;
                  var rightIndex = inequality.right.scratch().cola.index;
                  constraints.push({
                    axis: inequality.axis,
                    left: leftIndex,
                    right: rightIndex,
                    gap: inequality.gap,
                    equality: inequality.equality
                  });
                });
              }
              if (constraints.length > 0) {
                adaptor.constraints(constraints);
              }
              adaptor.groups(parentNodes.map(function(node, i) {
                var optPadding = getOptVal(options.nodeSpacing, node);
                var getPadding = function getPadding2(d) {
                  return parseFloat(node.style("padding-" + d));
                };
                var pleft = getPadding("left") + optPadding;
                var pright = getPadding("right") + optPadding;
                var ptop = getPadding("top") + optPadding;
                var pbottom = getPadding("bottom") + optPadding;
                node.scratch().cola = {
                  index: i,
                  padding: Math.max(pleft, pright, ptop, pbottom),
                  // leaves should only contain direct descendants (children),
                  // not the leaves of nested compound nodes or any nodes that are compounds themselves
                  leaves: node.children().intersection(nonparentNodes).map(function(child) {
                    return child[0].scratch().cola.index;
                  }),
                  fixed: node.locked()
                };
                return node;
              }).map(function(node) {
                node.scratch().cola.groups = node.children().intersection(parentNodes).map(function(child) {
                  return child.scratch().cola.index;
                });
                return node.scratch().cola;
              }));
              var length = void 0;
              var lengthFnName = void 0;
              if (options.edgeLength != null) {
                length = options.edgeLength;
                lengthFnName = "linkDistance";
              } else if (options.edgeSymDiffLength != null) {
                length = options.edgeSymDiffLength;
                lengthFnName = "symmetricDiffLinkLengths";
              } else if (options.edgeJaccardLength != null) {
                length = options.edgeJaccardLength;
                lengthFnName = "jaccardLinkLengths";
              } else {
                length = 100;
                lengthFnName = "linkDistance";
              }
              var lengthGetter = function lengthGetter2(link) {
                return link.calcLength;
              };
              adaptor.links(edges.stdFilter(function(edge) {
                return nonparentNodes.contains(edge.source()) && nonparentNodes.contains(edge.target());
              }).map(function(edge) {
                var c = edge.scratch().cola = {
                  source: edge.source()[0].scratch().cola.index,
                  target: edge.target()[0].scratch().cola.index
                };
                if (length != null) {
                  c.calcLength = getOptVal(length, edge);
                }
                return c;
              }));
              adaptor.size([bb.w, bb.h]);
              if (length != null) {
                adaptor[lengthFnName](lengthGetter);
              }
              if (options.flow) {
                var flow = void 0;
                var defAxis = "y";
                var defMinSep = 50;
                if (isString(options.flow)) {
                  flow = {
                    axis: options.flow,
                    minSeparation: defMinSep
                  };
                } else if (isNumber(options.flow)) {
                  flow = {
                    axis: defAxis,
                    minSeparation: options.flow
                  };
                } else if (isObject(options.flow)) {
                  flow = options.flow;
                  flow.axis = flow.axis || defAxis;
                  flow.minSeparation = flow.minSeparation != null ? flow.minSeparation : defMinSep;
                } else {
                  flow = {
                    axis: defAxis,
                    minSeparation: defMinSep
                  };
                }
                adaptor.flowLayout(flow.axis, flow.minSeparation);
              }
              layout.trigger({ type: "layoutstart", layout });
              adaptor.avoidOverlaps(options.avoidOverlap).handleDisconnected(options.handleDisconnected).start(
                options.unconstrIter,
                options.userConstIter,
                options.allConstIter,
                void 0,
                // gridSnapIterations = 0
                void 0,
                // keepRunning = true
                options.centerGraph
              );
              if (!options.infinite) {
                setTimeout(function() {
                  if (!layout.manuallyStopped) {
                    adaptor.stop();
                  }
                }, options.maxSimulationTime);
              }
              return this;
            };
            ColaLayout.prototype.stop = function() {
              if (this.adaptor) {
                this.manuallyStopped = true;
                this.adaptor.stop();
              }
              return this;
            };
            module2.exports = ColaLayout;
          },
          /* 1 */
          /***/
          function(module2, exports2, __webpack_require__) {
            "use strict";
            module2.exports = Object.assign != null ? Object.assign.bind(Object) : function(tgt) {
              for (var _len = arguments.length, srcs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                srcs[_key - 1] = arguments[_key];
              }
              srcs.filter(function(src) {
                return src != null;
              }).forEach(function(src) {
                Object.keys(src).forEach(function(k) {
                  return tgt[k] = src[k];
                });
              });
              return tgt;
            };
          },
          /* 2 */
          /***/
          function(module2, exports2, __webpack_require__) {
            "use strict";
            var defaults = {
              animate: true,
              // whether to show the layout as it's running
              refresh: 1,
              // number of ticks per frame; higher is faster but more jerky
              maxSimulationTime: 4e3,
              // max length in ms to run the layout
              ungrabifyWhileSimulating: false,
              // so you can't drag nodes during layout
              fit: true,
              // on every layout reposition of nodes, fit the viewport
              padding: 30,
              // padding around the simulation
              boundingBox: void 0,
              // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
              nodeDimensionsIncludeLabels: false,
              // whether labels should be included in determining the space used by a node
              // layout event callbacks
              ready: function ready() {
              },
              // on layoutready
              stop: function stop() {
              },
              // on layoutstop
              // positioning options
              randomize: false,
              // use random node positions at beginning of layout
              avoidOverlap: true,
              // if true, prevents overlap of node bounding boxes
              handleDisconnected: true,
              // if true, avoids disconnected components from overlapping
              convergenceThreshold: 0.01,
              // when the alpha value (system energy) falls below this value, the layout stops
              nodeSpacing: function nodeSpacing(node) {
                return 10;
              },
              // extra spacing around nodes
              flow: void 0,
              // use DAG/tree flow layout if specified, e.g. { axis: 'y', minSeparation: 30 }
              alignment: void 0,
              // relative alignment constraints on nodes, e.g. function( node ){ return { x: 0, y: 1 } }
              gapInequalities: void 0,
              // list of inequality constraints for the gap between the nodes, e.g. [{"axis":"y", "left":node1, "right":node2, "gap":25}]
              centerGraph: true,
              // adjusts the node positions initially to center the graph (pass false if you want to start the layout from the current position)
              // different methods of specifying edge length
              // each can be a constant numerical value or a function like `function( edge ){ return 2; }`
              edgeLength: void 0,
              // sets edge length directly in simulation
              edgeSymDiffLength: void 0,
              // symmetric diff edge length in simulation
              edgeJaccardLength: void 0,
              // jaccard edge length in simulation
              // iterations of cola algorithm; uses default values on undefined
              unconstrIter: void 0,
              // unconstrained initial layout iterations
              userConstIter: void 0,
              // initial layout iterations with user-specified constraints
              allConstIter: void 0,
              // initial layout iterations with all constraints including non-overlap
              // infinite layout options
              infinite: false
              // overrides all other options for a forces-all-the-time mode
            };
            module2.exports = defaults;
          },
          /* 3 */
          /***/
          function(module2, exports2, __webpack_require__) {
            "use strict";
            var impl = __webpack_require__(0);
            var register = function register2(cytoscape2) {
              if (!cytoscape2) {
                return;
              }
              cytoscape2("layout", "cola", impl);
            };
            if (typeof cytoscape !== "undefined") {
              register(cytoscape);
            }
            module2.exports = register;
          },
          /* 4 */
          /***/
          function(module2, exports2, __webpack_require__) {
            "use strict";
            var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
              return typeof obj;
            } : function(obj) {
              return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            var raf = void 0;
            if ((typeof window === "undefined" ? "undefined" : _typeof(window)) !== (true ? "undefined" : _typeof(void 0))) {
              raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(fn) {
                return setTimeout(fn, 16);
              };
            } else {
              raf = function raf2(cb) {
                cb();
              };
            }
            module2.exports = raf;
          },
          /* 5 */
          /***/
          function(module2, exports2) {
            module2.exports = __WEBPACK_EXTERNAL_MODULE_5__;
          }
          /******/
        ])
      );
    });
  }
});
export default require_cytoscape_cola();
