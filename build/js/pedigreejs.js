var pedigreejs = (function (exports) {
  'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  //store a history of pedigree
  var max_limit = 25;
  var dict_cache = {}; // test if browser storage is supported

  function has_browser_storage(opts) {
    try {
      if (opts.store_type === 'array') return false;
      if (opts.store_type !== 'local' && opts.store_type !== 'session' && opts.store_type !== undefined) return false;
      var mod = 'test';
      localStorage.setItem(mod, mod);
      localStorage.removeItem(mod);
      return true;
    } catch (e) {
      return false;
    }
  }

  function get_prefix(opts) {
    return "PEDIGREE_" + opts.btn_target + "_";
  } // use dict_cache to store cache as an array


  function get_arr(opts) {
    return dict_cache[get_prefix(opts)];
  }

  function get_browser_store(opts, item) {
    if (opts.store_type === 'local') return localStorage.getItem(item);else return sessionStorage.getItem(item);
  }

  function set_browser_store(opts, name, item) {
    if (opts.store_type === 'local') return localStorage.setItem(name, item);else return sessionStorage.setItem(name, item);
  } // clear all storage items


  function clear_browser_store(opts) {
    if (opts.store_type === 'local') return localStorage.clear();else return sessionStorage.clear();
  } // remove all storage items with keys that have the pedigree history prefix


  function clear_pedigree_data(opts) {
    var prefix = get_prefix(opts);
    var store = opts.store_type === 'local' ? localStorage : sessionStorage;
    var items = [];

    for (var i = 0; i < store.length; i++) {
      if (store.key(i).indexOf(prefix) == 0) items.push(store.key(i));
    }

    for (var _i = 0; _i < items.length; _i++) {
      store.removeItem(items[_i]);
    }
  }
  function get_count(opts) {
    var count;
    if (has_browser_storage(opts)) count = get_browser_store(opts, get_prefix(opts) + 'COUNT');else count = dict_cache[get_prefix(opts) + 'COUNT'];
    if (count !== null && count !== undefined) return count;
    return 0;
  }

  function set_count(opts, count) {
    if (has_browser_storage(opts)) set_browser_store(opts, get_prefix(opts) + 'COUNT', count);else dict_cache[get_prefix(opts) + 'COUNT'] = count;
  }

  function init_cache(opts) {
    if (!opts.dataset) return;
    var count = get_count(opts);

    if (has_browser_storage(opts)) {
      // local storage
      set_browser_store(opts, get_prefix(opts) + count, JSON.stringify(opts.dataset));
    } else {
      // TODO :: array cache
      console.warn('Local storage not found/supported for this browser!', opts.store_type);
      max_limit = 500;
      if (get_arr(opts) === undefined) dict_cache[get_prefix(opts)] = [];
      get_arr(opts).push(JSON.stringify(opts.dataset));
    }

    if (count < max_limit) count++;else count = 0;
    set_count(opts, count);
  }
  function nstore(opts) {
    if (has_browser_storage(opts)) {
      for (var i = max_limit; i > 0; i--) {
        if (get_browser_store(opts, get_prefix(opts) + (i - 1)) !== null) return i;
      }
    } else {
      return get_arr(opts) && get_arr(opts).length > 0 ? get_arr(opts).length : -1;
    }

    return -1;
  }
  function current(opts) {
    var current = get_count(opts) - 1;
    if (current == -1) current = max_limit;
    if (has_browser_storage(opts)) return JSON.parse(get_browser_store(opts, get_prefix(opts) + current));else if (get_arr(opts)) return JSON.parse(get_arr(opts)[current]);
  }
  function last(opts) {
    if (has_browser_storage(opts)) {
      for (var i = max_limit; i > 0; i--) {
        var it = get_browser_store(opts, get_prefix(opts) + (i - 1));

        if (it !== null) {
          set_count(opts, i);
          return JSON.parse(it);
        }
      }
    } else {
      var arr = get_arr(opts);
      if (arr) return JSON.parse(arr(arr.length - 1));
    }

    return undefined;
  }
  function previous(opts, previous) {
    if (previous === undefined) previous = get_count(opts) - 2;

    if (previous < 0) {
      var _nstore = _nstore(opts);

      if (_nstore < max_limit) previous = _nstore - 1;else previous = max_limit - 1;
    }

    set_count(opts, previous + 1);
    if (has_browser_storage(opts)) return JSON.parse(get_browser_store(opts, get_prefix(opts) + previous));else return JSON.parse(get_arr(opts)[previous]);
  }
  function next(opts, next) {
    if (next === undefined) next = get_count(opts);
    if (next >= max_limit) next = 0;
    set_count(opts, parseInt(next) + 1);
    if (has_browser_storage(opts)) return JSON.parse(get_browser_store(opts, get_prefix(opts) + next));else return JSON.parse(get_arr(opts)[next]);
  }
  function clear(opts) {
    if (has_browser_storage(opts)) clear_browser_store(opts);
    dict_cache = {};
  } // zoom - store translation coords

  function setposition(opts, x, y, zoom) {
    if (has_browser_storage(opts)) {
      set_browser_store(opts, get_prefix(opts) + '_X', x);
      set_browser_store(opts, get_prefix(opts) + '_Y', y);
      if (zoom) set_browser_store(opts, get_prefix(opts) + '_ZOOM', zoom);
    }
  }
  function getposition(opts) {
    if (!has_browser_storage(opts) || localStorage.getItem(get_prefix(opts) + '_X') === null && sessionStorage.getItem(get_prefix(opts) + '_X') === null) return [null, null];
    var pos = [parseInt(get_browser_store(opts, get_prefix(opts) + '_X')), parseInt(get_browser_store(opts, get_prefix(opts) + '_Y'))];
    if (get_browser_store(get_prefix(opts) + '_ZOOM') !== null) pos.push(parseFloat(get_browser_store(opts, get_prefix(opts) + '_ZOOM')));
    return pos;
  }

  var pedcache = /*#__PURE__*/Object.freeze({
    __proto__: null,
    clear_pedigree_data: clear_pedigree_data,
    get_count: get_count,
    init_cache: init_cache,
    nstore: nstore,
    current: current,
    last: last,
    previous: previous,
    next: next,
    clear: clear,
    setposition: setposition,
    getposition: getposition
  });

  function isIE() {
    var ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/

    return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
  }
  function isEdge() {
    return navigator.userAgent.match(/Edge/g);
  }
  function copy_dataset(dataset) {
    if (dataset[0].id) {
      // sort by id
      dataset.sort(function (a, b) {
        return !a.id || !b.id ? 0 : a.id > b.id ? 1 : b.id > a.id ? -1 : 0;
      });
    }

    var disallowed = ["id", "parent_node"];
    var newdataset = [];

    for (var i = 0; i < dataset.length; i++) {
      var obj = {};

      for (var key in dataset[i]) {
        if (disallowed.indexOf(key) == -1) obj[key] = dataset[i][key];
      }

      newdataset.push(obj);
    }

    return newdataset;
  }
  /**
   *  Get formatted time or data & time
   */

  function getFormattedDate(time) {
    var d = new Date();
    if (time) return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);else return d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
  }
  /**
   * Show message or confirmation dialog.
   * @param title	 - dialog window title
   * @param msg	   - message to diasplay
   * @param onConfirm - function to call in a confirmation dialog
   * @param opts	  - pedigreejs options
   * @param dataset	- pedigree dataset
   */

  function messages(title, msg, onConfirm, opts, dataset) {
    if (onConfirm) {
      $('<div id="msgDialog">' + msg + '</div>').dialog({
        modal: true,
        title: title,
        width: 350,
        buttons: {
          "Yes": function Yes() {
            $(this).dialog('close');
            onConfirm(opts, dataset);
          },
          "No": function No() {
            $(this).dialog('close');
          }
        }
      });
    } else {
      $('<div id="msgDialog">' + msg + '</div>').dialog({
        title: title,
        width: 350,
        buttons: [{
          text: "OK",
          click: function click() {
            $(this).dialog("close");
          }
        }]
      });
    }
  }
  /**
   * Validate age and yob is consistent with current year. The sum of age and
   * yob should not be greater than or equal to current year. If alive the
   * absolute difference between the sum of age and year of birth and the
   * current year should be <= 1.
   * @param age	- age in years.
   * @param yob	- year of birth.
   * @param status - 0 = alive, 1 = dead.
   * @return true if age and yob are consistent with current year otherwise false.
   */

  function validate_age_yob(age, yob, status) {
    var year = new Date().getFullYear();
    var sum = parseInt(age) + parseInt(yob);

    if (status == 1) {
      // deceased
      return year >= sum;
    }

    return Math.abs(year - sum) <= 1 && year >= sum;
  }
  function capitaliseFirstLetter$1(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  function makeid(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
  function buildTree(opts, person, root, partnerLinks, id) {
    if (_typeof(person.children) === ("undefined" )) person.children = getChildren(opts.dataset, person);

    if (_typeof(partnerLinks) === ("undefined" )) {
      partnerLinks = [];
      id = 1;
    }

    var nodes = flatten(root); //console.log('NAME='+person.name+' NO. CHILDREN='+person.children.length);

    var partners = [];
    $.each(person.children, function (i, child) {
      $.each(opts.dataset, function (j, p) {
        if ((child.name === p.mother || child.name === p.father) && child.id === undefined) {
          var m = getNodeByName(nodes, p.mother);
          var f = getNodeByName(nodes, p.father);
          m = m !== undefined ? m : getNodeByName(opts.dataset, p.mother);
          f = f !== undefined ? f : getNodeByName(opts.dataset, p.father);
          if (!contains_parent(partners, m, f)) partners.push({
            'mother': m,
            'father': f
          });
        }
      });
    });
    $.merge(partnerLinks, partners);
    $.each(partners, function (i, ptr) {
      var mother = ptr.mother;
      var father = ptr.father;
      mother.children = [];
      var parent = {
        name: makeid(4),
        hidden: true,
        parent: null,
        father: father,
        mother: mother,
        children: getChildren(opts.dataset, mother, father)
      };
      var midx = getIdxByName(opts.dataset, mother.name);
      var fidx = getIdxByName(opts.dataset, father.name);
      if (!('id' in father) && !('id' in mother)) id = setChildrenId(person.children, id); // look at grandparents index

      var gp = get_grandparents_idx(opts.dataset, midx, fidx);

      if (gp.fidx < gp.midx) {
        father.id = id++;
        parent.id = id++;
        mother.id = id++;
      } else {
        mother.id = id++;
        parent.id = id++;
        father.id = id++;
      }

      id = updateParent(mother, parent, id, nodes, opts);
      id = updateParent(father, parent, id, nodes, opts);
      person.children.push(parent);
    });
    id = setChildrenId(person.children, id);
    $.each(person.children, function (i, p) {
      id = buildTree(opts, p, root, partnerLinks, id)[1];
    });
    return [partnerLinks, id];
  } // update parent node and sort twins

  function updateParent(p, parent, id, nodes, opts) {
    // add to parent node
    if ('parent_node' in p) p.parent_node.push(parent);else p.parent_node = [parent]; // check twins lie next to each other

    if (p.mztwin || p.dztwins) {
      var twins = getTwins(opts.dataset, p);

      for (var i = 0; i < twins.length; i++) {
        var twin = getNodeByName(nodes, twins[i].name);
        if (twin) twin.id = id++;
      }
    }

    return id;
  }

  function setChildrenId(children, id) {
    // sort twins to lie next to each other
    children.sort(function (a, b) {
      if (a.mztwin && b.mztwin && a.mztwin == b.mztwin) return 0;else if (a.dztwin && b.dztwin && a.dztwin == b.dztwin) return 0;else if (a.mztwin || b.mztwin || a.dztwin || b.dztwin) return 1;
      return 0;
    });
    $.each(children, function (i, p) {
      if (p.id === undefined) p.id = id++;
    });
    return id;
  }

  function isProband(obj) {
    return _typeof($(obj).attr('proband')) !== ("undefined" ) && $(obj).attr('proband') !== false;
  }
  function setProband(dataset, name, is_proband) {
    $.each(dataset, function (i, p) {
      if (name === p.name) p.proband = is_proband;else delete p.proband;
    });
  } //combine arrays ignoring duplicates

  function combineArrays(arr1, arr2) {
    for (var i = 0; i < arr2.length; i++) {
      if ($.inArray(arr2[i], arr1) == -1) arr1.push(arr2[i]);
    }
  }

  function include_children(connected, p, dataset) {
    if ($.inArray(p.name, connected) == -1) return;
    combineArrays(connected, get_partners(dataset, p));
    var children = getAllChildren(dataset, p);
    $.each(children, function (child_idx, child) {
      if ($.inArray(child.name, connected) == -1) {
        connected.push(child.name);
        combineArrays(connected, get_partners(dataset, child));
      }
    });
  } //get the partners for a given node


  function get_partners(dataset, anode) {
    var ptrs = [];

    for (var i = 0; i < dataset.length; i++) {
      var bnode = dataset[i];
      if (anode.name === bnode.mother && $.inArray(bnode.father, ptrs) == -1) ptrs.push(bnode.father);else if (anode.name === bnode.father && $.inArray(bnode.mother, ptrs) == -1) ptrs.push(bnode.mother);
    }

    return ptrs;
  } //return a list of individuals that aren't connected to the target

  function unconnected(dataset) {
    var target = dataset[getProbandIndex(dataset)];

    if (!target) {
      console.warn("No target defined");

      if (dataset.length == 0) {
        throw "empty pedigree data set";
      }

      target = dataset[0];
    }

    var connected = [target.name];
    var change = true;
    var ii = 0;

    while (change && ii < 200) {
      ii++;
      var nconnect = connected.length;
      $.each(dataset, function (idx, p) {
        if ($.inArray(p.name, connected) != -1) {
          // check if this person or a partner has a parent
          var ptrs = get_partners(dataset, p);
          var has_parent = p.name === target.name || !p.noparents;

          for (var i = 0; i < ptrs.length; i++) {
            if (!getNodeByName(dataset, ptrs[i]).noparents) has_parent = true;
          }

          if (has_parent) {
            if (p.mother && $.inArray(p.mother, connected) == -1) connected.push(p.mother);
            if (p.father && $.inArray(p.father, connected) == -1) connected.push(p.father);
          }
        } else if (!p.noparents && (p.mother && $.inArray(p.mother, connected) != -1 || p.father && $.inArray(p.father, connected) != -1)) {
          connected.push(p.name);
        } // include any children


        include_children(connected, p, dataset);
      });
      change = nconnect != connected.length;
    }

    var names = $.map(dataset, function (val, _i) {
      return val.name;
    });
    return $.map(names, function (name, _i) {
      return $.inArray(name, connected) == -1 ? name : null;
    });
  }
  function getProbandIndex(dataset) {
    var proband;
    $.each(dataset, function (i, val) {
      if (isProband(val)) {
        proband = i;
        return proband;
      }
    });
    return proband;
  }
  function getChildren(dataset, mother, father) {
    var children = [];
    var names = [];
    if (mother.sex === 'F') $.each(dataset, function (i, p) {
      if (mother.name === p.mother) if (!father || father.name == p.father) {
        if ($.inArray(p.name, names) === -1) {
          children.push(p);
          names.push(p.name);
        }
      }
    });
    return children;
  }

  function contains_parent(arr, m, f) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].mother === m && arr[i].father === f) return true;
    }

    return false;
  } // get the siblings of a given individual - sex is an optional parameter
  // for only returning brothers or sisters


  function getSiblings(dataset, person, sex) {
    if (person === undefined || !person.mother || person.noparents) return [];
    return $.map(dataset, function (p, _i) {
      return p.name !== person.name && !('noparents' in p) && p.mother && p.mother === person.mother && p.father === person.father && (!sex || p.sex == sex) ? p : null;
    });
  } // get the siblings + adopted siblings

  function getAllSiblings(dataset, person, sex) {
    return $.map(dataset, function (p, _i) {
      return p.name !== person.name && !('noparents' in p) && p.mother && p.mother === person.mother && p.father === person.father && (!sex || p.sex == sex) ? p : null;
    });
  } // get the mono/di-zygotic twin(s)

  function getTwins(dataset, person) {
    var sibs = getSiblings(dataset, person);
    var twin_type = person.mztwin ? "mztwin" : "dztwin";
    return $.map(sibs, function (p, _i) {
      return p.name !== person.name && p[twin_type] == person[twin_type] ? p : null;
    });
  } // get the adopted siblings of a given individual

  function getAdoptedSiblings(dataset, person) {
    return $.map(dataset, function (p, _i) {
      return p.name !== person.name && 'noparents' in p && p.mother === person.mother && p.father === person.father ? p : null;
    });
  }
  function getAllChildren(dataset, person, sex) {
    return $.map(dataset, function (p, _i) {
      return !('noparents' in p) && (p.mother === person.name || p.father === person.name) && (!sex || p.sex === sex) ? p : null;
    });
  } // get the depth of the given person from the root

  function getDepth(dataset, name) {
    var idx = getIdxByName(dataset, name);
    var depth = 1;

    while (idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)) {
      idx = getIdxByName(dataset, dataset[idx].mother);
      depth++;
    }

    return depth;
  } // given an array of people get an index for a given person

  function getIdxByName(arr, name) {
    var idx = -1;
    $.each(arr, function (i, p) {
      if (name === p.name) {
        idx = i;
        return idx;
      }
    });
    return idx;
  } // get the nodes at a given depth sorted by their x position

  function getNodesAtDepth(fnodes, depth, exclude_names) {
    return $.map(fnodes, function (p, _i) {
      return p.depth == depth && !p.data.hidden && $.inArray(p.data.name, exclude_names) == -1 ? p : null;
    }).sort(function (a, b) {
      return a.x - b.x;
    });
  } // convert the partner names into corresponding tree nodes

  function linkNodes(flattenNodes, partners) {
    var links = [];

    for (var i = 0; i < partners.length; i++) {
      links.push({
        'mother': getNodeByName(flattenNodes, partners[i].mother.name),
        'father': getNodeByName(flattenNodes, partners[i].father.name)
      });
    }

    return links;
  } // get ancestors of a node

  function ancestors(dataset, node) {
    var ancestors = [];

    function recurse(node) {
      if (node.data) node = node.data;

      if ('mother' in node && 'father' in node && !('noparents' in node)) {
        recurse(getNodeByName(dataset, node.mother));
        recurse(getNodeByName(dataset, node.father));
      }

      ancestors.push(node);
    }

    recurse(node);
    return ancestors;
  } // test if two nodes are consanguinous partners

  function consanguity(node1, node2, opts) {
    if (node1.depth !== node2.depth) // parents at different depths
      return true;
    var ancestors1 = ancestors(opts.dataset, node1);
    var ancestors2 = ancestors(opts.dataset, node2);
    var names1 = $.map(ancestors1, function (ancestor, _i) {
      return ancestor.name;
    });
    var names2 = $.map(ancestors2, function (ancestor, _i) {
      return ancestor.name;
    });
    var consanguity = false;
    $.each(names1, function (index, name) {
      if ($.inArray(name, names2) !== -1) {
        consanguity = true;
        return false;
      }
    });
    return consanguity;
  } // return a flattened representation of the tree

  function flatten(root) {
    var flat = [];

    function recurse(node) {
      if (node.children) node.children.forEach(recurse);
      flat.push(node);
    }

    recurse(root);
    return flat;
  } // Adjust D3 layout positioning.
  // Position hidden parent node centring them between father and mother nodes. Remove kinks
  // from links - e.g. where there is a single child plus a hidden child

  function adjust_coords(opts, root, flattenNodes) {
    function recurse(node) {
      if (node.children) {
        node.children.forEach(recurse);

        if (node.data.father !== undefined) {
          // hidden nodes
          var father = getNodeByName(flattenNodes, node.data.father.name);
          var mother = getNodeByName(flattenNodes, node.data.mother.name);
          var xmid = (father.x + mother.x) / 2;

          if (!overlap(opts, root.descendants(), xmid, node.depth, [node.data.name])) {
            node.x = xmid; // centralise parent nodes

            var diff = node.x - xmid;

            if (node.children.length == 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
              if (!(node.children[0].data.hidden && node.children[1].data.hidden)) {
                var child1 = node.children[0].data.hidden ? node.children[1] : node.children[0];
                var child2 = node.children[0].data.hidden ? node.children[0] : node.children[1];

                if ((child1.x < child2.x && xmid < child2.x || child1.x > child2.x && xmid > child2.x) && !overlap(opts, root.descendants(), xmid, child1.depth, [child1.data.name])) {
                  child1.x = xmid;
                }
              }
            } else if (node.children.length == 1 && !node.children[0].data.hidden) {
              if (!overlap(opts, root.descendants(), xmid, node.children[0].depth, [node.children[0].data.name])) node.children[0].x = xmid;
            } else {
              if (diff !== 0 && !nodesOverlap(opts, node, diff, root)) {
                if (node.children.length == 1) {
                  node.children[0].x = xmid;
                } else {
                  var descendants = node.descendants();
                  if (opts.DEBUG) console.log('ADJUSTING ' + node.data.name + ' NO. DESCENDANTS ' + descendants.length + ' diff=' + diff);

                  for (var i = 0; i < descendants.length; i++) {
                    if (node.data.name !== descendants[i].data.name) descendants[i].x -= diff;
                  }
                }
              }
            }
          } else if (node.x < father.x && node.x < mother.x || node.x > father.x && node.x > mother.x) {
            node.x = xmid; // centralise parent nodes if it doesn't lie between mother and father
          }
        }
      }
    }

    recurse(root);
    recurse(root);
  } // test if moving siblings by diff overlaps with other nodes

  function nodesOverlap(opts, node, diff, root) {
    var descendants = node.descendants();
    var descendantsNames = $.map(descendants, function (descendant, _i) {
      return descendant.data.name;
    });
    var nodes = root.descendants();

    for (var i = 0; i < descendants.length; i++) {
      var descendant = descendants[i];

      if (node.data.name !== descendant.data.name) {
        var xnew = descendant.x - diff;
        if (overlap(opts, nodes, xnew, descendant.depth, descendantsNames)) return true;
      }
    }

    return false;
  } // test if x position overlaps a node at the same depth


  function overlap(opts, nodes, xnew, depth, exclude_names) {
    for (var n = 0; n < nodes.length; n++) {
      if (depth == nodes[n].depth && $.inArray(nodes[n].data.name, exclude_names) == -1) {
        if (Math.abs(xnew - nodes[n].x) < opts.symbol_size * 1.15) return true;
      }
    }

    return false;
  } // given a persons name return the corresponding d3 tree node

  function getNodeByName(nodes, name) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].data && name === nodes[i].data.name) return nodes[i];else if (name === nodes[i].name) return nodes[i];
    }
  } // given the name of a url param get the value

  function urlParam(name) {
    var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results === null) return null;else return results[1] || 0;
  } // get grandparents index

  function get_grandparents_idx(dataset, midx, fidx) {
    var gmidx = midx;
    var gfidx = fidx;

    while ('mother' in dataset[gmidx] && 'mother' in dataset[gfidx] && !('noparents' in dataset[gmidx]) && !('noparents' in dataset[gfidx])) {
      gmidx = getIdxByName(dataset, dataset[gmidx].mother);
      gfidx = getIdxByName(dataset, dataset[gfidx].mother);
    }

    return {
      'midx': gmidx,
      'fidx': gfidx
    };
  } // Set or remove proband attributes.
  // If a value is not provided the attribute is removed from the proband.
  // 'key' can be a list of keys or a single key.

  function proband_attr(opts, keys, value) {
    var proband = opts.dataset[getProbandIndex(opts.dataset)];
    node_attr(opts, proband.name, keys, value);
  } // Set or remove node attributes.
  // If a value is not provided the attribute is removed.
  // 'key' can be a list of keys or a single key.

  function node_attr(opts, name, keys, value) {
    var newdataset = copy_dataset(current(opts));
    var node = getNodeByName(newdataset, name);

    if (!node) {
      console.warn("No person defined");
      return;
    }

    if (!$.isArray(keys)) {
      keys = [keys];
    }

    if (value) {
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i]; //console.log('VALUE PROVIDED', k, value, (k in node));

        if (k in node && keys.length === 1) {
          if (node[k] === value) return;

          try {
            if (JSON.stringify(node[k]) === JSON.stringify(value)) return;
          } catch (e) {// continue regardless of error
          }
        }

        node[k] = value;
      }
    } else {
      var found = false;

      for (var _i2 = 0; _i2 < keys.length; _i2++) {
        var _k = keys[_i2]; //console.log('NO VALUE PROVIDED', k, (k in node));

        if (_k in node) {
          delete node[_k];
          found = true;
        }
      }

      if (!found) return;
    }

    syncTwins(newdataset, node);
    opts.dataset = newdataset;
    rebuild(opts);
  } // add a child to the proband; giveb sex, age, yob and breastfeeding months (optional)

  function proband_add_child(opts, sex, age, yob, breastfeeding) {
    var newdataset = copy_dataset(current(opts));
    var proband = newdataset[getProbandIndex(newdataset)];

    if (!proband) {
      console.warn("No proband defined");
      return;
    }

    var newchild = addchild(newdataset, proband, sex, 1)[0];
    newchild.age = age;
    newchild.yob = yob;
    if (breastfeeding !== undefined) newchild.breastfeeding = breastfeeding;
    opts.dataset = newdataset;
    rebuild(opts);
    return newchild.name;
  } // delete node using the name

  function delete_node_by_name(opts, name) {
    function onDone(opts, dataset) {
      // assign new dataset and rebuild pedigree
      opts.dataset = dataset;
      rebuild(opts);
    }

    var newdataset = copy_dataset(current(opts));
    var node = getNodeByName(current(opts), name);

    if (!node) {
      console.warn("No node defined");
      return;
    }

    delete_node_dataset(newdataset, node, opts, onDone);
  } // check by name if the individual exists

  function exists(opts, name) {
    return getNodeByName(current(opts), name) !== undefined;
  } // print options and dataset

  function print_opts(opts) {
    $("#pedigree_data").remove();
    $("body").append("<div id='pedigree_data'></div>");
    var key;

    for (var i = 0; i < opts.dataset.length; i++) {
      var person = "<div class='row'><strong class='col-md-1 text-right'>" + opts.dataset[i].name + "</strong><div class='col-md-11'>";

      for (key in opts.dataset[i]) {
        if (key === 'name') continue;
        if (key === 'parent') person += "<span>" + key + ":" + opts.dataset[i][key].name + "; </span>";else if (key === 'children') {
          if (opts.dataset[i][key][0] !== undefined) person += "<span>" + key + ":" + opts.dataset[i][key][0].name + "; </span>";
        } else person += "<span>" + key + ":" + opts.dataset[i][key] + "; </span>";
      }

      $("#pedigree_data").append(person + "</div></div>");
    }

    $("#pedigree_data").append("<br /><br />");

    for (key in opts) {
      if (key === 'dataset') continue;
      $("#pedigree_data").append("<span>" + key + ":" + opts[key] + "; </span>");
    }
  }

  var pedigree_utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    isIE: isIE,
    isEdge: isEdge,
    copy_dataset: copy_dataset,
    getFormattedDate: getFormattedDate,
    messages: messages,
    validate_age_yob: validate_age_yob,
    capitaliseFirstLetter: capitaliseFirstLetter$1,
    makeid: makeid,
    buildTree: buildTree,
    isProband: isProband,
    setProband: setProband,
    get_partners: get_partners,
    unconnected: unconnected,
    getProbandIndex: getProbandIndex,
    getChildren: getChildren,
    getSiblings: getSiblings,
    getAllSiblings: getAllSiblings,
    getTwins: getTwins,
    getAdoptedSiblings: getAdoptedSiblings,
    getAllChildren: getAllChildren,
    getDepth: getDepth,
    getIdxByName: getIdxByName,
    getNodesAtDepth: getNodesAtDepth,
    linkNodes: linkNodes,
    ancestors: ancestors,
    consanguity: consanguity,
    flatten: flatten,
    adjust_coords: adjust_coords,
    overlap: overlap,
    getNodeByName: getNodeByName,
    urlParam: urlParam,
    get_grandparents_idx: get_grandparents_idx,
    proband_attr: proband_attr,
    node_attr: node_attr,
    proband_add_child: proband_add_child,
    delete_node_by_name: delete_node_by_name,
    exists: exists,
    print_opts: print_opts
  });

  // undo, redo, reset buttons
  function add$1(options) {
    var opts = $.extend({
      // defaults
      btn_target: 'pedigree_history'
    }, options);
    var btns = [{
      "fa": "fa-undo",
      "title": "undo"
    }, {
      "fa": "fa-repeat",
      "title": "redo"
    }, {
      "fa": "fa-refresh",
      "title": "reset"
    }, {
      "fa": "fa-arrows-alt",
      "title": "fullscreen"
    }];
    var lis = "";

    for (var i = 0; i < btns.length; i++) {
      lis += '<li">';
      lis += '&nbsp;<i class="fa fa-lg ' + btns[i].fa + '" ' + (btns[i].fa == "fa-arrows-alt" ? 'id="fullscreen" ' : '') + ' aria-hidden="true" title="' + btns[i].title + '"></i>';
      lis += '</li>';
    }

    $("#" + opts.btn_target).append(lis);
    click(opts);
  }
  function is_fullscreen() {
    return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
  }

  function click(opts) {
    // fullscreen
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function (_e) {
      var local_dataset = current(opts);

      if (local_dataset !== undefined && local_dataset !== null) {
        opts.dataset = local_dataset;
      }

      rebuild(opts);
    });
    $('#fullscreen').on('click', function (_e) {
      if (!document.mozFullScreen && !document.webkitFullScreen) {
        var target = $("#" + opts.targetDiv)[0];
        if (target.mozRequestFullScreen) target.mozRequestFullScreen();else target.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
      } else {
        if (document.mozCancelFullScreen) document.mozCancelFullScreen();else document.webkitCancelFullScreen();
      }
    }); // undo/redo/reset

    $("#" + opts.btn_target).on("click", function (e) {
      e.stopPropagation();
      if ($(e.target).hasClass("disabled")) return false;

      if ($(e.target).hasClass('fa-undo')) {
        opts.dataset = previous(opts);
        $("#" + opts.targetDiv).empty();
        build(opts);
      } else if ($(e.target).hasClass('fa-repeat')) {
        opts.dataset = next(opts);
        $("#" + opts.targetDiv).empty();
        build(opts);
      } else if ($(e.target).hasClass('fa-refresh')) {
        $('<div id="msgDialog">Resetting the pedigree may result in loss of some data.</div>').dialog({
          title: 'Confirm Reset',
          resizable: false,
          height: "auto",
          width: 400,
          modal: true,
          buttons: {
            Continue: function Continue() {
              reset(opts, opts.keep_proband_on_reset);
              $(this).dialog("close");
            },
            Cancel: function Cancel() {
              $(this).dialog("close");
              return;
            }
          }
        });
      } // trigger fhChange event


      $(document).trigger('fhChange', [opts]);
    });
  } // reset pedigree and clear the history


  function reset(opts, keep_proband) {
    var proband;

    if (keep_proband) {
      var local_dataset = current(opts);
      var newdataset = copy_dataset(local_dataset);
      proband = newdataset[getProbandIndex(newdataset)]; //let children = pedigree_util.getChildren(newdataset, proband);

      proband.name = "ch1";
      proband.mother = "f21";
      proband.father = "m21"; // clear pedigree data but keep proband data and risk factors

      clear_pedigree_data(opts);
    } else {
      proband = {
        "name": "ch1",
        "sex": "F",
        "mother": "f21",
        "father": "m21",
        "proband": true,
        "status": "0",
        "display_name": "me"
      };
      clear(opts); // clear all storage data
    }

    delete opts.dataset;
    var selected = $("input[name='default_fam']:checked");

    if (selected.length > 0 && selected.val() == 'extended2') {
      // secondary relatives
      opts.dataset = [{
        "name": "wZA",
        "sex": "M",
        "top_level": true,
        "status": "0",
        "display_name": "paternal grandfather"
      }, {
        "name": "MAk",
        "sex": "F",
        "top_level": true,
        "status": "0",
        "display_name": "paternal grandmother"
      }, {
        "name": "zwB",
        "sex": "M",
        "top_level": true,
        "status": "0",
        "display_name": "maternal grandfather"
      }, {
        "name": "dOH",
        "sex": "F",
        "top_level": true,
        "status": "0",
        "display_name": "maternal grandmother"
      }, {
        "name": "MKg",
        "sex": "F",
        "mother": "MAk",
        "father": "wZA",
        "status": "0",
        "display_name": "paternal aunt"
      }, {
        "name": "xsm",
        "sex": "M",
        "mother": "MAk",
        "father": "wZA",
        "status": "0",
        "display_name": "paternal uncle"
      }, {
        "name": "m21",
        "sex": "M",
        "mother": "MAk",
        "father": "wZA",
        "status": "0",
        "display_name": "father"
      }, {
        "name": "f21",
        "sex": "F",
        "mother": "dOH",
        "father": "zwB",
        "status": "0",
        "display_name": "mother"
      }, {
        "name": "aOH",
        "sex": "F",
        "mother": "f21",
        "father": "m21",
        "status": "0",
        "display_name": "sister"
      }, {
        "name": "Vha",
        "sex": "M",
        "mother": "f21",
        "father": "m21",
        "status": "0",
        "display_name": "brother"
      }, {
        "name": "Spj",
        "sex": "M",
        "mother": "f21",
        "father": "m21",
        "noparents": true,
        "status": "0",
        "display_name": "partner"
      }, proband, {
        "name": "zhk",
        "sex": "F",
        "mother": "ch1",
        "father": "Spj",
        "status": "0",
        "display_name": "daughter"
      }, {
        "name": "Knx",
        "display_name": "son",
        "sex": "M",
        "mother": "ch1",
        "father": "Spj",
        "status": "0"
      }, {
        "name": "uuc",
        "display_name": "maternal aunt",
        "sex": "F",
        "mother": "dOH",
        "father": "zwB",
        "status": "0"
      }, {
        "name": "xIw",
        "display_name": "maternal uncle",
        "sex": "M",
        "mother": "dOH",
        "father": "zwB",
        "status": "0"
      }];
    } else if (selected.length > 0 && selected.val() == 'extended1') {
      // primary relatives
      opts.dataset = [{
        "name": "m21",
        "sex": "M",
        "mother": null,
        "father": null,
        "status": "0",
        "display_name": "father",
        "noparents": true
      }, {
        "name": "f21",
        "sex": "F",
        "mother": null,
        "father": null,
        "status": "0",
        "display_name": "mother",
        "noparents": true
      }, {
        "name": "aOH",
        "sex": "F",
        "mother": "f21",
        "father": "m21",
        "status": "0",
        "display_name": "sister"
      }, {
        "name": "Vha",
        "sex": "M",
        "mother": "f21",
        "father": "m21",
        "status": "0",
        "display_name": "brother"
      }, {
        "name": "Spj",
        "sex": "M",
        "mother": "f21",
        "father": "m21",
        "noparents": true,
        "status": "0",
        "display_name": "partner"
      }, proband, {
        "name": "zhk",
        "sex": "F",
        "mother": "ch1",
        "father": "Spj",
        "status": "0",
        "display_name": "daughter"
      }, {
        "name": "Knx",
        "display_name": "son",
        "sex": "M",
        "mother": "ch1",
        "father": "Spj",
        "status": "0"
      }];
    } else {
      opts.dataset = [{
        "name": "m21",
        "display_name": "father",
        "sex": "M",
        "top_level": true
      }, {
        "name": "f21",
        "display_name": "mother",
        "sex": "F",
        "top_level": true
      }, proband];
    }

    rebuild(opts);
  }
  function updateButtons(opts) {
    var current = get_count(opts);
    var nstore$1 = nstore(opts);
    var id = "#" + opts.btn_target;
    if (nstore$1 <= current) $(id + " .fa-repeat").addClass('disabled');else $(id + " .fa-repeat").removeClass('disabled');
    if (current > 1) $(id + " .fa-undo").removeClass('disabled');else $(id + " .fa-undo").addClass('disabled');
  }

  // pedigree I/O

  var cancers = {
    'breast_cancer': 'breast_cancer_diagnosis_age',
    'breast_cancer2': 'breast_cancer2_diagnosis_age',
    'ovarian_cancer': 'ovarian_cancer_diagnosis_age',
    'prostate_cancer': 'prostate_cancer_diagnosis_age',
    'pancreatic_cancer': 'pancreatic_cancer_diagnosis_age'
  };
  var genetic_test = ['brca1', 'brca2', 'palb2', 'atm', 'chek2', 'rad51d', 'rad51c', 'brip1'];
  var pathology_tests = ['er', 'pr', 'her2', 'ck14', 'ck56']; // get breast and ovarian PRS values

  function get_prs_values() {
    var prs = {};

    if (hasInput("breast_prs_a") && hasInput("breast_prs_z")) {
      prs['breast_cancer_prs'] = {
        'alpha': parseFloat($('#breast_prs_a').val()),
        'zscore': parseFloat($('#breast_prs_z').val()),
        'percent': parseFloat($('#breast_prs_percent').val())
      };
    }

    if (hasInput("ovarian_prs_a") && hasInput("ovarian_prs_z")) {
      prs['ovarian_cancer_prs'] = {
        'alpha': parseFloat($('#ovarian_prs_a').val()),
        'zscore': parseFloat($('#ovarian_prs_z').val()),
        'percent': parseFloat($('#ovarian_prs_percent').val())
      };
    }

    console.log(prs);
    return isEmpty(prs) ? 0 : prs;
  } // check if input has a value

  function hasInput(id) {
    return $.trim($('#' + id).val()).length !== 0;
  } // return true if the object is empty

  var isEmpty = function isEmpty(myObj) {
    for (var key in myObj) {
      if (Object.prototype.hasOwnProperty.call(myObj, key)) {
        return false;
      }
    }

    return true;
  };

  function get_surgical_ops() {
    var meta = "";

    if (!$('#A6_4_3_check').parent().hasClass("off")) {
      meta += ";OVARY2=y";
    }

    if (!$('#A6_4_7_check').parent().hasClass("off")) {
      meta += ";MAST2=y";
    }

    return meta;
  }
  function add(opts) {
    $('#load').change(function (e) {
      load(e, opts);
    });
    $('#save').click(function (_e) {
      save$1(opts);
    });
    $('#save_canrisk').click(function (_e) {
      var meta = get_surgical_ops();
      var prs;

      try {
        prs = get_prs_values();

        if (prs.breast_cancer_prs && prs.breast_cancer_prs.alpha !== 0 && prs.breast_cancer_prs.zscore !== 0) {
          meta += "\n##PRS_BC=alpha=" + prs.breast_cancer_prs.alpha + ",zscore=" + prs.breast_cancer_prs.zscore;
        }

        if (prs.ovarian_cancer_prs && prs.ovarian_cancer_prs.alpha !== 0 && prs.ovarian_cancer_prs.zscore !== 0) {
          meta += "\n##PRS_OC=alpha=" + prs.ovarian_cancer_prs.alpha + ",zscore=" + prs.ovarian_cancer_prs.zscore;
        }
      } catch (err) {
        console.warn("PRS", prs);
      }

      save_canrisk(opts, meta);
    });
    $('#print').click(function (_e) {
      print(get_printable_svg(opts));
    });
    $('#svg_download').click(function (_e) {
      svg_download(get_printable_svg(opts));
    });
    $('#png_download').click(function (_e) {
      var deferred = svg2img($('svg'), "pedigree");
      $.when.apply($, [deferred]).done(function () {
        var obj = getByName(arguments, "pedigree");

        if (isEdge() || isIE()) {
          var html = "<img src='" + obj.img + "' alt='canvas image'/>";
          var newTab = window.open(); // pop-ups need to be enabled

          newTab.document.write(html);
        } else {
          var a = document.createElement('a');
          a.href = obj.img;
          a.download = 'plot.png';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    });
  }
  /**
   * Get object from array by the name attribute.
   */

  function getByName(arr, name) {
    return $.grep(arr, function (o) {
      return o && o.name == name;
    })[0];
  }
  /**
   * Given a SVG document element convert to image (e.g. jpeg, png - default png).
   */


  function svg2img(svg, deferred_name, options) {
    var defaults = {
      iscanvg: false,
      resolution: 1,
      img_type: "image/png"
    };
    if (!options) options = defaults;
    $.each(defaults, function (key, value) {
      if (!(key in options)) {
        options[key] = value;
      }
    }); // set SVG background to white - fix for jpeg creation

    if (svg.find(".pdf-white-bg").length === 0) {
      var d3obj = d3.select(svg.get(0));
      d3obj.append("rect").attr("width", "100%").attr("height", "100%").attr("class", "pdf-white-bg").attr("fill", "white");
      d3obj.select(".pdf-white-bg").lower();
    }

    var deferred = $.Deferred();
    var svgStr;

    if (typeof window.XMLSerializer != "undefined") {
      svgStr = new XMLSerializer().serializeToString(svg.get(0));
    } else if (typeof svg.xml != "undefined") {
      svgStr = svg.get(0).xml;
    }

    var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr))); // convert SVG string to data URL

    var canvas = document.createElement("canvas");
    canvas.width = svg.width() * options.resolution;
    canvas.height = svg.height() * options.resolution;
    var context = canvas.getContext("2d");
    var img = document.createElement("img");

    img.onload = function () {
      if (isIE()) {
        // change font so it isn't tiny
        svgStr = svgStr.replace(/ font-size="\d?.\d*em"/g, '');
        svgStr = svgStr.replace(/<text /g, '<text font-size="12px" ');
        var v = canvg.Canvg.fromString(context, svgStr, {
          scaleWidth: canvas.width,
          scaleHeight: canvas.height,
          ignoreDimensions: true
        });
        v.start();
        console.log(deferred_name, options.img_type, "use canvg to create image");
      } else {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log(deferred_name, options.img_type);
      }

      deferred.resolve({
        'name': deferred_name,
        'resolution': options.resolution,
        'img': canvas.toDataURL(options.img_type, 1),
        'w': canvas.width,
        'h': canvas.height
      });
    };

    img.src = imgsrc;
    return deferred.promise();
  }

  function getMatches(str, myRegexp) {
    var matches = [];
    var match;
    var c = 0;
    myRegexp.lastIndex = 0;

    while (match = myRegexp.exec(str)) {
      c++;

      if (c > 400) {
        console.error("getMatches: counter exceeded 800");
        return -1;
      }

      matches.push(match);

      if (myRegexp.lastIndex === match.index) {
        myRegexp.lastIndex++;
      }
    }

    return matches;
  } // find all url's to make unique


  function unique_urls(svg_html) {
    var matches = getMatches(svg_html, /url\((&quot;|"|'){0,1}#(.*?)(&quot;|"|'){0,1}\)/g);
    if (matches === -1) return "ERROR DISPLAYING PEDIGREE";
    $.each(matches, function (index, match) {
      var quote = match[1] ? match[1] : "";
      var val = match[2];
      var m1 = "id=\"" + val + "\"";
      var m2 = "url\\(" + quote + "#" + val + quote + "\\)";
      var newval = val + makeid(2);
      svg_html = svg_html.replace(new RegExp(m1, 'g'), "id=\"" + newval + "\"");
      svg_html = svg_html.replace(new RegExp(m2, 'g'), "url(#" + newval + ")");
    });
    return svg_html;
  } // return a copy pedigree svg


  function copy_svg(opts) {
    var svg_node = get_printable_svg(opts);
    var d3obj = d3.select(svg_node.get(0)); // remove unused elements

    d3obj.selectAll(".popup_selection, .indi_rect, .addsibling, .addpartner, .addchild, .addparents, .delete, .line_drag_selection").remove();
    d3obj.selectAll("text").filter(function () {
      return d3.select(this).text().length === 0;
    }).remove();
    return $(unique_urls(svg_node.html()));
  } // get printable svg div, adjust size to tree dimensions and scale to fit

  function get_printable_svg(opts) {
    var local_dataset = current(opts); // get current dataset

    if (local_dataset !== undefined && local_dataset !== null) {
      opts.dataset = local_dataset;
    }

    var tree_dimensions = get_tree_dimensions(opts);
    var svg_div = $('<div></div>'); // create a new div

    var svg = $('#' + opts.targetDiv).find('svg').clone().appendTo(svg_div);

    if (opts.width < tree_dimensions.width || opts.height < tree_dimensions.height || tree_dimensions.width > 595 || tree_dimensions.height > 842) {
      var wid = tree_dimensions.width;
      var hgt = tree_dimensions.height + 100;
      var scale = 1.0;

      if (tree_dimensions.width > 595 || tree_dimensions.height > 842) {
        // scale to fit A4
        if (tree_dimensions.width > 595) wid = 595;
        if (tree_dimensions.height > 842) hgt = 842;
        var xscale = wid / tree_dimensions.width;
        var yscale = hgt / tree_dimensions.height;
        scale = xscale < yscale ? xscale : yscale;
      }

      svg.attr('width', wid); // adjust dimensions

      svg.attr('height', hgt);
      var ytransform = -opts.symbol_size * 1.5 * scale;
      svg.find(".diagram").attr("transform", "translate(0, " + ytransform + ") scale(" + scale + ")");
    }

    return svg_div;
  } // download the SVG to a file

  function svg_download(svg) {
    var a = document.createElement('a');
    a.href = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg.html())));
    a.download = 'plot.svg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } // open print window for a given element

  function print(el, id) {
    if (el.constructor !== Array) el = [el];
    var width = $(window).width() * 0.9;
    var height = $(window).height() - 10;
    var cssFiles = ['/static/css/canrisk.css', 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'];
    var printWindow = window.open('', 'PrintMap', 'width=' + width + ',height=' + height);
    var headContent = '';

    for (var i = 0; i < cssFiles.length; i++) {
      headContent += '<link href="' + cssFiles[i] + '" rel="stylesheet" type="text/css" media="all">';
    }

    headContent += "<style>body {font-size: " + $("body").css('font-size') + ";}</style>";
    var html = "";

    for (var _i2 = 0; _i2 < el.length; _i2++) {
      if (_i2 === 0 && id) html += id;
      html += $(el[_i2]).html();
      if (_i2 < el.length - 1) html += '<div class="page-break"> </div>';
    }

    printWindow.document.write(headContent);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function () {
      printWindow.print();
      printWindow.close();
    }, 300);
  } // save content to a file

  function save_file(opts, content, filename, type) {
    if (opts.DEBUG) console.log(content);
    if (!filename) filename = "ped.txt";
    if (!type) type = "text/plain";
    var file = new Blob([content], {
      type: type
    });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);else {
      // other browsers
      var a = document.createElement("a");
      var url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  }
  function save$1(opts) {
    var content = JSON.stringify(current(opts));
    save_file(opts, content);
  }
  function save_canrisk(opts, meta) {
    save_file(opts, run_prediction.get_non_anon_pedigree(current(opts), meta), "canrisk.txt");
  }
  function canrisk_validation(opts) {
    $.each(opts.dataset, function (idx, p) {
      if (!p.hidden && p.sex === 'M' && !isProband(p)) {
        if (p[cancers['breast_cancer2']]) {
          var msg = 'Male family member (' + p.display_name + ') with contralateral breast cancer found. ' + 'Please note that as the risk models do not take this into account the second ' + 'breast cancer is ignored.';
          console.error(msg);
          delete p[cancers['breast_cancer2']];
          messages("Warning", msg);
        }
      }
    });
  }
  function load(e, opts) {
    var f = e.target.files[0];

    if (f) {
      var risk_factors;
      var reader = new FileReader();

      reader.onload = function (e) {
        if (opts.DEBUG) console.log(e.target.result);

        try {
          if (e.target.result.startsWith("BOADICEA import pedigree file format 4.0")) {
            opts.dataset = readBoadiceaV4(e.target.result, 4);
            canrisk_validation(opts);
          } else if (e.target.result.startsWith("BOADICEA import pedigree file format 2.0")) {
            opts.dataset = readBoadiceaV4(e.target.result, 2);
            canrisk_validation(opts);
          } else if (e.target.result.startsWith("##") && e.target.result.indexOf("CanRisk") !== -1) {
            var canrisk_data = readCanRiskV1(e.target.result);
            risk_factors = canrisk_data[0];
            opts.dataset = canrisk_data[1];
            canrisk_validation(opts);
          } else {
            try {
              opts.dataset = JSON.parse(e.target.result);
            } catch (err) {
              opts.dataset = readLinkage(e.target.result);
            }
          }

          validate_pedigree(opts);
        } catch (err1) {
          console.error(err1, e.target.result);
          messages("File Error", err1.message ? err1.message : err1);
          return;
        }

        console.log(opts.dataset);

        try {
          rebuild(opts);

          if (risk_factors !== undefined) {
            console.log(risk_factors); // load risk factors - fire riskfactorChange event

            $(document).trigger('riskfactorChange', [opts, risk_factors]);
          }

          $(document).trigger('fhChange', [opts]); // trigger fhChange event

          try {
            // update FH section
            acc_FamHist_ticked();
            acc_FamHist_Leave();
            RESULT.FLAG_FAMILY_MODAL = true;
          } catch (err3) {// ignore error
          }
        } catch (err2) {
          messages("File Error", err2.message ? err2.message : err2);
        }
      };

      reader.onerror = function (event) {
        messages("File Error", "File could not be read! Code " + event.target.error.code);
      };

      reader.readAsText(f);
    } else {
      console.error("File could not be read!");
    }

    $("#load")[0].value = ''; // reset value
  } //
  // https://www.cog-genomics.org/plink/1.9/formats#ped
  // https://www.cog-genomics.org/plink/1.9/formats#fam
  //	1. Family ID ('FID')
  //	2. Within-family ID ('IID'; cannot be '0')
  //	3. Within-family ID of father ('0' if father isn't in dataset)
  //	4. Within-family ID of mother ('0' if mother isn't in dataset)
  //	5. Sex code ('1' = male, '2' = female, '0' = unknown)
  //	6. Phenotype value ('1' = control, '2' = case, '-9'/'0'/non-numeric = missing data if case/control)
  //  7. Genotypes (column 7 onwards);
  //	 columns 7 & 8 are allele calls for first variant ('0' = no call); colummns 9 & 10 are calls for second variant etc.

  function readLinkage(boadicea_lines) {
    var lines = boadicea_lines.trim().split('\n');
    var ped = [];
    var famid;

    for (var i = 0; i < lines.length; i++) {
      var attr = $.map(lines[i].trim().split(/\s+/), function (val, _i) {
        return val.trim();
      });
      if (attr.length < 5) throw 'unknown format';
      var sex = attr[4] == '1' ? 'M' : attr[4] == '2' ? 'F' : 'U';
      var indi = {
        'famid': attr[0],
        'display_name': attr[1],
        'name': attr[1],
        'sex': sex
      };
      if (attr[2] !== "0") indi.father = attr[2];
      if (attr[3] !== "0") indi.mother = attr[3];

      if (typeof famid != 'undefined' && famid !== indi.famid) {
        console.error('multiple family IDs found only using famid = ' + famid);
        break;
      }

      if (attr[5] == "2") indi.affected = 2; // add genotype columns

      if (attr.length > 6) {
        indi.alleles = "";

        for (var j = 6; j < attr.length; j += 2) {
          indi.alleles += attr[j] + "/" + attr[j + 1] + ";";
        }
      }

      ped.unshift(indi);
      famid = attr[0];
    }

    return process_ped(ped);
  }
  function readCanRiskV1(boadicea_lines) {
    var lines = boadicea_lines.trim().split('\n');
    var ped = [];
    var hdr = []; // collect risk factor header lines
    // assumes two line header

    var _loop = function _loop(i) {
      var ln = lines[i].trim();

      if (ln.startsWith("##")) {
        if (ln.startsWith("##CanRisk") && ln.indexOf(";") > -1) {
          // contains surgical op data
          var ops = ln.split(";");

          for (var j = 1; j < ops.length; j++) {
            var opdata = ops[j].split("=");

            if (opdata.length === 2) {
              hdr.push(ops[j]);
            }
          }
        }

        if (ln.indexOf("CanRisk") === -1 && !ln.startsWith("##FamID")) {
          hdr.push(ln.replace("##", ""));
        }

        return "continue";
      }

      var delim = /\t/;

      if (ln.indexOf('\t') < 0) {
        delim = /\s+/;
        console.log("NOT TAB DELIM");
      }

      var attr = $.map(ln.split(delim), function (val, _i) {
        return val.trim();
      });

      if (attr.length > 1) {
        var indi = {
          'famid': attr[0],
          'display_name': attr[1],
          'name': attr[3],
          'sex': attr[6],
          'status': attr[8]
        };
        if (attr[2] == 1) indi.proband = true;
        if (attr[4] !== "0") indi.father = attr[4];
        if (attr[5] !== "0") indi.mother = attr[5];
        if (attr[7] !== "0") indi.mztwin = attr[7];
        if (attr[9] !== "0") indi.age = attr[9];
        if (attr[10] !== "0") indi.yob = attr[10];
        var idx = 11;
        $.each(cancers, function (cancer, diagnosis_age) {
          // Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
          if (attr[idx] !== "0") {
            indi[diagnosis_age] = attr[idx];
          }

          idx++;
        });
        if (attr[idx++] !== "0") indi.ashkenazi = 1; // BRCA1, BRCA2, PALB2, ATM, CHEK2, .... genetic tests
        // genetic test type, 0 = untested, S = mutation search, T = direct gene test
        // genetic test result, 0 = untested, P = positive, N = negative

        for (var _j = 0; _j < genetic_test.length; _j++) {
          var gene_test = attr[idx].split(":");

          if (gene_test[0] !== '0') {
            if ((gene_test[0] === 'S' || gene_test[0] === 'T') && (gene_test[1] === 'P' || gene_test[1] === 'N')) indi[genetic_test[_j] + '_gene_test'] = {
              'type': gene_test[0],
              'result': gene_test[1]
            };else console.warn('UNRECOGNISED GENE TEST ON LINE ' + (i + 1) + ": " + gene_test[0] + " " + gene_test[1]);
          }

          idx++;
        } // status, 0 = unspecified, N = negative, P = positive


        var path_test = attr[idx].split(":");

        for (var _j2 = 0; _j2 < path_test.length; _j2++) {
          if (path_test[_j2] !== '0') {
            if (path_test[_j2] === 'N' || path_test[_j2] === 'P') indi[pathology_tests[_j2] + '_bc_pathology'] = path_test[_j2];else console.warn('UNRECOGNISED PATHOLOGY ON LINE ' + (i + 1) + ": " + pathology_tests[_j2] + " " + path_test[_j2]);
          }
        }

        ped.unshift(indi);
      }
    };

    for (var i = 0; i < lines.length; i++) {
      var _ret = _loop(i);

      if (_ret === "continue") continue;
    }

    try {
      return [hdr, process_ped(ped)];
    } catch (e) {
      console.error(e);
      return [hdr, ped];
    }
  } // read boadicea format v4 & v2

  function readBoadiceaV4(boadicea_lines, version) {
    var lines = boadicea_lines.trim().split('\n');
    var ped = []; // assumes two line header

    var _loop2 = function _loop2(i) {
      var attr = $.map(lines[i].trim().split(/\s+/), function (val, _i) {
        return val.trim();
      });

      if (attr.length > 1) {
        var indi = {
          'famid': attr[0],
          'display_name': attr[1],
          'name': attr[3],
          'sex': attr[6],
          'status': attr[8]
        };
        if (attr[2] == 1) indi.proband = true;
        if (attr[4] !== "0") indi.father = attr[4];
        if (attr[5] !== "0") indi.mother = attr[5];
        if (attr[7] !== "0") indi.mztwin = attr[7];
        if (attr[9] !== "0") indi.age = attr[9];
        if (attr[10] !== "0") indi.yob = attr[10];
        var idx = 11;
        $.each(cancers, function (cancer, diagnosis_age) {
          // Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
          if (attr[idx] !== "0") {
            indi[diagnosis_age] = attr[idx];
          }

          idx++;
        });

        if (version === 4) {
          if (attr[idx++] !== "0") indi.ashkenazi = 1; // BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
          // genetic test type, 0 = untested, S = mutation search, T = direct gene test
          // genetic test result, 0 = untested, P = positive, N = negative

          for (var j = 0; j < 5; j++) {
            idx += 2;

            if (attr[idx - 2] !== '0') {
              if ((attr[idx - 2] === 'S' || attr[idx - 2] === 'T') && (attr[idx - 1] === 'P' || attr[idx - 1] === 'N')) indi[genetic_test[j] + '_gene_test'] = {
                'type': attr[idx - 2],
                'result': attr[idx - 1]
              };else console.warn('UNRECOGNISED GENE TEST ON LINE ' + (i + 1) + ": " + attr[idx - 2] + " " + attr[idx - 1]);
            }
          }
        } else if (version === 2) {
          // genetic test BRCA1, BRCA2
          // type, 0 = untested, S = mutation search, T = direct gene test
          // result, 0 = untested, N = no mutation, 1 = BRCA1 positive, 2 = BRCA2 positive, 3 = BRCA1/2 positive
          idx += 2; // gtest

          if (attr[idx - 2] !== '0') {
            if (attr[idx - 2] === 'S' || attr[idx - 2] === 'T') {
              if (attr[idx - 1] === 'N') {
                indi['brca1_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'N'
                };
                indi['brca2_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'N'
                };
              } else if (attr[idx - 1] === '1') {
                indi['brca1_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'P'
                };
                indi['brca2_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'N'
                };
              } else if (attr[idx - 1] === '2') {
                indi['brca1_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'N'
                };
                indi['brca2_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'P'
                };
              } else if (attr[idx - 1] === '3') {
                indi['brca1_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'P'
                };
                indi['brca2_gene_test'] = {
                  'type': attr[idx - 2],
                  'result': 'P'
                };
              }
            } else {
              console.warn('UNRECOGNISED GENE TEST ON LINE ' + (i + 1) + ": " + attr[idx - 2] + " " + attr[idx - 1]);
            }
          }

          if (attr[idx++] !== "0") indi.ashkenazi = 1;
        } // status, 0 = unspecified, N = negative, P = positive


        for (var _j3 = 0; _j3 < pathology_tests.length; _j3++) {
          if (attr[idx] !== '0') {
            if (attr[idx] === 'N' || attr[idx] === 'P') indi[pathology_tests[_j3] + '_bc_pathology'] = attr[idx];else console.warn('UNRECOGNISED PATHOLOGY ON LINE ' + (i + 1) + ": " + pathology_tests[_j3] + " " + attr[idx]);
          }

          idx++;
        }

        ped.unshift(indi);
      }
    };

    for (var i = 2; i < lines.length; i++) {
      _loop2(i);
    }

    try {
      return process_ped(ped);
    } catch (e) {
      console.error(e);
      return ped;
    }
  }

  function process_ped(ped) {
    // find the level of individuals in the pedigree
    for (var j = 0; j < 2; j++) {
      for (var i = 0; i < ped.length; i++) {
        getLevel(ped, ped[i].name);
      }
    } // find the max level (i.e. top_level)


    var max_level = 0;

    for (var _i3 = 0; _i3 < ped.length; _i3++) {
      if (ped[_i3].level && ped[_i3].level > max_level) max_level = ped[_i3].level;
    } // identify top_level and other nodes without parents


    for (var _i4 = 0; _i4 < ped.length; _i4++) {
      if (getDepth(ped, ped[_i4].name) == 1) {
        if (ped[_i4].level && ped[_i4].level == max_level) {
          ped[_i4].top_level = true;
        } else {
          ped[_i4].noparents = true; // 1. look for partners parents

          var pidx = getPartnerIdx(ped, ped[_i4]);

          if (pidx > -1) {
            if (ped[pidx].mother) {
              ped[_i4].mother = ped[pidx].mother;
              ped[_i4].father = ped[pidx].father;
            }
          } // 2. or adopt parents from level above


          if (!ped[_i4].mother) {
            for (var _j4 = 0; _j4 < ped.length; _j4++) {
              if (ped[_i4].level == ped[_j4].level - 1) {
                pidx = getPartnerIdx(ped, ped[_j4]);

                if (pidx > -1) {
                  ped[_i4].mother = ped[_j4].sex === 'F' ? ped[_j4].name : ped[pidx].name;
                  ped[_i4].father = ped[_j4].sex === 'M' ? ped[_j4].name : ped[pidx].name;
                }
              }
            }
          }
        }
      } else {
        delete ped[_i4].top_level;
      }
    }

    return ped;
  } // get the partners for a given node


  function getPartnerIdx(dataset, anode) {
    for (var i = 0; i < dataset.length; i++) {
      var bnode = dataset[i];
      if (anode.name === bnode.mother) return getIdxByName(dataset, bnode.father);else if (anode.name === bnode.father) return getIdxByName(dataset, bnode.mother);
    }

    return -1;
  } // for a given individual assign levels to a parents ancestors


  function getLevel(dataset, name) {
    var idx = getIdxByName(dataset, name);
    var level = dataset[idx].level ? dataset[idx].level : 0;
    update_parents_level(idx, level, dataset);
  } // recursively update parents levels


  function update_parents_level(idx, level, dataset) {
    var parents = ['mother', 'father'];
    level++;

    for (var i = 0; i < parents.length; i++) {
      var pidx = getIdxByName(dataset, dataset[idx][parents[i]]);

      if (pidx >= 0) {
        var ma = dataset[getIdxByName(dataset, dataset[idx].mother)];
        var pa = dataset[getIdxByName(dataset, dataset[idx].father)];

        if (!dataset[pidx].level || dataset[pidx].level < level) {
          ma.level = level;
          pa.level = level;
        }

        if (ma.level < pa.level) {
          ma.level = pa.level;
        } else if (pa.level < ma.level) {
          pa.level = ma.level;
        }

        update_parents_level(pidx, level, dataset);
      }
    }
  }

  var io = /*#__PURE__*/Object.freeze({
    __proto__: null,
    cancers: cancers,
    genetic_test: genetic_test,
    pathology_tests: pathology_tests,
    get_prs_values: get_prs_values,
    hasInput: hasInput,
    get_surgical_ops: get_surgical_ops,
    add: add,
    svg2img: svg2img,
    copy_svg: copy_svg,
    get_printable_svg: get_printable_svg,
    svg_download: svg_download,
    print: print,
    save_file: save_file,
    save: save$1,
    save_canrisk: save_canrisk,
    canrisk_validation: canrisk_validation,
    load: load,
    readLinkage: readLinkage,
    readCanRiskV1: readCanRiskV1,
    readBoadiceaV4: readBoadiceaV4
  });

  $("#select_all_gene_tests").on('change', function (_e) {
    if (this.value === "S") {
      // select all mutation search to be negative
      $("#gene_test").find("select[name$='_gene_test']").val("S").change();
      $("#gene_test").find("select[name$='_gene_test_result']").val("N").change();
    } else if (this.value === "T") {
      // select all direct gene tests to be negative
      $("#gene_test").find("select[name$='_gene_test']").val("T").change();
      $("#gene_test").find("select[name$='_gene_test_result']").val("N").change();
    } else if (this.value === "N") {
      // select all gene tests to be negative
      $("#gene_test").find("select[name$='_gene_test_result']").val("N").change();
    } else if (this.value === "reset") {
      $("#gene_test").find("select[name$='_gene_test']").val("-").change();
      $("#gene_test").find("select[name$='_gene_test_result']").val("-").change();
    }
  });
  $('#acc_FamHist_div').on('click', '#id_proband, #id_exclude', function (_e) {
    var name = $('#id_name').val();

    if ($(this).attr("id") === 'id_proband' && $(this).is(':checked')) {
      var msg = $("#proband_switch_dialog").text();
      $('<div id="msgDialog">' + msg + '</div>').dialog({
        title: $("#proband_switch_dialog").data("title"),
        width: 350,
        buttons: [{
          text: $("#proband_switch_dialog").data("continue"),
          click: function click() {
            $(this).dialog('close');
            var dataset = current(opts);
            opts.dataset = copy_dataset(dataset);
            setProband(opts.dataset, name, true);
            rebuild(opts);
            reset_n_sync(opts);
            $('#id_proband').prop("disabled", true);
          }
        }, {
          text: $("#proband_switch_dialog").data("cancel"),
          click: function click() {
            $(this).dialog('close');
            $("#id_proband").prop('checked', false);
            $('#id_proband').prop("disabled", false);
          }
        }]
      });
    } else if ($(this).attr("id") === 'id_exclude') {
      var dataset = current(opts);
      opts.dataset = copy_dataset(dataset);
      var idx = getIdxByName(opts.dataset, name);
      if ($(this).is(':checked')) opts.dataset[idx].exclude = true;else delete opts.dataset[idx].exclude;
      rebuild(opts);
    }
  });
  function update(opts) {
    $('.node_save').click(function () {
      save(opts);
    }); // advanced options - model parameters

    $("input[id$='_mut_sensitivity'], input[id$='_mut_frequency']").prop('disabled', true);
    $('#id_use_custom_mutation_sensitivities').change(function () {
      $("input[id$='_mut_sensitivity']").prop('disabled', !$(this).is(":checked"));
    });
    $('#id_mutation_frequencies').change(function () {
      $("input[id$='_mut_frequency']").prop('disabled', this.value !== 'Custom'); // note pedigree_form.mutation_frequencies is set in the view see pedigree_section_js.html

      if (pedigree_form.bc_mutation_frequencies && this.value !== 'Custom') {
        var bcmfreq = pedigree_form.bc_mutation_frequencies[this.value];

        for (var gene in bcmfreq) {
          $('#id_' + gene.toLowerCase() + '_bc_mut_frequency').val(bcmfreq[gene]);
        }

        var obcmfreq = pedigree_form.oc_mutation_frequencies[this.value];

        for (var _gene in obcmfreq) {
          $('#id_' + _gene.toLowerCase() + '_oc_mut_frequency').val(obcmfreq[_gene]);
        }
      }

      if (this.value === 'Ashkenazi') {
        // update canrisk FH radio settings
        $('#orig_ashk').prop("checked", true);
      } else {
        $('#orig_unk').prop("checked", true);
      }

      save_ashkn(opts); // save ashkenazi updates
    });
  } // handle family history change events (undo/redo/delete)

  $(document).on('fhChange', function (e, opts) {
    try {
      var id = $('#id_name').val(); // get name from hidden field

      var node = getNodeByName(current(opts), id);
      if (node === undefined) $('form > fieldset').prop("disabled", true);else $('form > fieldset').prop('disabled', false);
    } catch (err) {
      console.warn(err);
    }
  }); // update status field and age label - 0 = alive, 1 = dead

  function update_ashkn(newdataset) {
    // Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
    if ($('#orig_ashk').is(':checked')) {
      $.each(newdataset, function (i, p) {
        if (p.proband) p.ashkenazi = 1;
      });
    } else {
      $.each(newdataset, function (i, p) {
        delete p.ashkenazi;
      });
    }
  } // Save Ashkenazi status


  function save_ashkn(opts) {
    var dataset = current(opts);
    var newdataset = copy_dataset(dataset);
    update_ashkn(newdataset);
    opts.dataset = newdataset;
    rebuild(opts);
  }
  function save(opts) {
    var dataset = current(opts);
    var name = $('#id_name').val();
    var newdataset = copy_dataset(dataset);
    var person = getNodeByName(newdataset, name);

    if (!person) {
      console.warn('person not found when saving details');
      return;
    }

    $("#" + opts.targetDiv).empty(); // individual's personal and clinical details

    var yob = $('#id_yob_0').val();

    if (yob && yob !== '') {
      person.yob = yob;
    } else {
      delete person.yob;
    } // current status: 0 = alive, 1 = dead


    var status = $('#id_status').find("input[type='radio']:checked");

    if (status.length > 0) {
      person.status = status.val();
    } // booleans switches


    var switches = ["miscarriage", "adopted_in", "adopted_out", "termination", "stillbirth"];

    for (var iswitch = 0; iswitch < switches.length; iswitch++) {
      var attr = switches[iswitch];
      var s = $('#id_' + attr);

      if (s.length > 0) {
        console.log(s.is(":checked"));
        if (s.is(":checked")) person[attr] = true;else delete person[attr];
      }
    } // current sex


    var sex = $('#id_sex').find("input[type='radio']:checked");

    if (sex.length > 0) {
      person.sex = sex.val();
      update_cancer_by_sex(person);
    } // Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi


    update_ashkn(newdataset);
    if ($('#id_approx').is(':checked')) // approximate diagnosis age
      person.approx_diagnosis_age = true;else delete person.approx_diagnosis_age;
    $("#person_details select[name*='_diagnosis_age']:visible, #person_details input[type=text]:visible, #person_details input[type=number]:visible").each(function () {
      var name = this.name.indexOf("_diagnosis_age") > -1 ? this.name.substring(0, this.name.length - 2) : this.name;

      if ($(this).val()) {
        var val = $(this).val();
        if (name.indexOf("_diagnosis_age") > -1 && $("#id_approx").is(':checked')) val = round5(val);
        person[name] = val;
      } else {
        delete person[name];
      }
    }); // cancer checkboxes

    $('#person_details input[type="checkbox"][name$="cancer"],input[type="checkbox"][name$="cancer2"]').each(function () {
      if (this.checked) person[$(this).attr('name')] = true;else delete person[$(this).attr('name')];
    }); // pathology tests

    $('#person_details select[name$="_bc_pathology"]').each(function () {
      if ($(this).val() !== '-') {
        person[$(this).attr('name')] = $(this).val();
      } else {
        delete person[$(this).attr('name')];
      }
    }); // genetic tests

    $('#person_details select[name$="_gene_test"]').each(function () {
      if ($(this).val() !== '-') {
        var tres = $('select[name="' + $(this).attr('name') + '_result"]');
        person[$(this).attr('name')] = {
          'type': $(this).val(),
          'result': $(tres).val()
        };
      } else {
        delete person[$(this).attr('name')];
      }
    });

    try {
      $('#person_details').find('form').valid();
    } catch (err) {
      console.warn('valid() not found');
    }

    syncTwins(newdataset, person);
    opts.dataset = newdataset;
    rebuild(opts);
  }

  function update_cancer_by_sex(node) {
    $('#cancer .row').show();

    if (node.sex === 'M') {
      delete node.ovarian_cancer_diagnosis_age;
      $("[id^='id_ovarian_cancer_diagnosis_age']").closest('.row').hide();
      $("[id^='id_breast_cancer2_diagnosis_age']").prop('disabled', true);
    } else if (node.sex === 'F') {
      delete node.prostate_cancer_diagnosis_age;
      $("[id^='id_prostate_cancer_diagnosis_age']").closest('.row').hide();
      $("[id^='id_breast_cancer2_diagnosis_age']").prop('disabled', false);
    }
  } // round to 5, 15, 25, 35 ....


  function round5(x1) {
    var x2 = Math.round((x1 - 1) / 10) * 10;
    return x1 < x2 ? x2 - 5 : x2 + 5;
  }

  // pedigree widgets
  var dragging;
  var last_mouseover; //
  // Add widgets to nodes and bind events

  function addWidgets(opts, node) {
    // popup gender selection box
    var font_size = parseInt($("body").css('font-size'));
    var popup_selection = d3.select('.diagram');
    popup_selection.append("rect").attr("class", "popup_selection").attr("rx", 6).attr("ry", 6).attr("transform", "translate(-1000,-100)").style("opacity", 0).attr("width", font_size * 7.9).attr("height", font_size * 2).style("stroke", "darkgrey").attr("fill", "white");
    var square = popup_selection.append("text") // male
    .attr('font-family', 'FontAwesome').style("opacity", 0).attr('font-size', '1.em').attr("class", "popup_selection fa-lg fa-square persontype").attr("transform", "translate(-1000,-100)").attr("x", font_size / 3).attr("y", font_size * 1.5).text("\uF096 ");
    var square_title = square.append("svg:title").text("add male");
    var circle = popup_selection.append("text") // female
    .attr('font-family', 'FontAwesome').style("opacity", 0).attr('font-size', '1.em').attr("class", "popup_selection fa-lg fa-circle persontype").attr("transform", "translate(-1000,-100)").attr("x", font_size * 1.7).attr("y", font_size * 1.5).text("\uF10C ");
    var circle_title = circle.append("svg:title").text("add female");
    var unspecified = popup_selection.append("text") // unspecified
    .attr('font-family', 'FontAwesome').style("opacity", 0).attr('font-size', '1.em').attr("transform", "translate(-1000,-100)").attr("class", "popup_selection fa-lg fa-unspecified popup_selection_rotate45 persontype").text("\uF096 ");
    unspecified.append("svg:title").text("add unspecified");
    var dztwin = popup_selection.append("text") // dizygotic twins
    .attr('font-family', 'FontAwesome').style("opacity", 0).attr("transform", "translate(-1000,-100)").attr("class", "popup_selection fa-2x fa-angle-up persontype dztwin").attr("x", font_size * 4.6).attr("y", font_size * 1.5).text("\uF106 ");
    dztwin.append("svg:title").text("add dizygotic/fraternal twins");
    var mztwin = popup_selection.append("text") // monozygotic twins
    .attr('font-family', 'FontAwesome').style("opacity", 0).attr("transform", "translate(-1000,-100)").attr("class", "popup_selection fa-2x fa-caret-up persontype mztwin").attr("x", font_size * 6.2).attr("y", font_size * 1.5).text("\uF0D8");
    mztwin.append("svg:title").text("add monozygotic/identical twins");
    var add_person = {}; // click the person type selection

    d3.selectAll(".persontype").on("click", function () {
      var newdataset = copy_dataset(current(opts));
      var mztwin = d3.select(this).classed("mztwin");
      var dztwin = d3.select(this).classed("dztwin");
      var twin_type;
      var sex;

      if (mztwin || dztwin) {
        sex = add_person.node.datum().data.sex;
        twin_type = mztwin ? "mztwin" : "dztwin";
      } else {
        sex = d3.select(this).classed("fa-square") ? 'M' : d3.select(this).classed("fa-circle") ? 'F' : 'U';
      }

      if (add_person.type === 'addsibling') addsibling(newdataset, add_person.node.datum().data, sex, false, twin_type);else if (add_person.type === 'addchild') addchild(newdataset, add_person.node.datum().data, twin_type ? 'U' : sex, twin_type ? 2 : 1, twin_type);else return;
      opts.dataset = newdataset;
      rebuild(opts);
      d3.selectAll('.popup_selection').style("opacity", 0);
      add_person = {};
    }).on("mouseover", function () {
      if (add_person.node) add_person.node.select('rect').style("opacity", 0.2);
      d3.selectAll('.popup_selection').style("opacity", 1); // add tooltips to font awesome widgets

      if (add_person.type === 'addsibling') {
        if (d3.select(this).classed("fa-square")) square_title.text("add brother");else circle_title.text("add sister");
      } else if (add_person.type === 'addchild') {
        if (d3.select(this).classed("fa-square")) square_title.text("add son");else circle_title.text("add daughter");
      }
    }); // handle mouse out of popup selection

    d3.selectAll(".popup_selection").on("mouseout", function () {
      // hide rect and popup selection
      if (add_person.node !== undefined && highlight.indexOf(add_person.node.datum()) == -1) add_person.node.select('rect').style("opacity", 0);
      d3.selectAll('.popup_selection').style("opacity", 0);
    }); // drag line between nodes to create partners

    drag_handle(opts); // rectangle used to highlight on mouse over

    node.append("rect").filter(function (d) {
      return d.data.hidden && !opts.DEBUG ? false : true;
    }).attr("class", 'indi_rect').attr("rx", 6).attr("ry", 6).attr("x", function (_d) {
      return -0.75 * opts.symbol_size;
    }).attr("y", function (_d) {
      return -opts.symbol_size;
    }).attr("width", 1.5 * opts.symbol_size + 'px').attr("height", 2 * opts.symbol_size + 'px').style("stroke", "black").style("stroke-width", 0.7).style("opacity", 0).attr("fill", "lightgrey"); // widgets

    var fx = function fx(_d) {
      return off - 0.75 * opts.symbol_size;
    };

    var fy = opts.symbol_size - 2;
    var off = 0;
    var widgets = {
      'addchild': {
        'text': "\uF063",
        'title': 'add child',
        'fx': fx,
        'fy': fy
      },
      'addsibling': {
        'text': "\uF234",
        'title': 'add sibling',
        'fx': fx,
        'fy': fy
      },
      'addpartner': {
        'text': "\uF0C1",
        'title': 'add partner',
        'fx': fx,
        'fy': fy
      },
      'addparents': {
        'text': "\uF062",
        'title': 'add parents',
        'fx': -0.75 * opts.symbol_size,
        'fy': -opts.symbol_size + 11
      },
      'delete': {
        'text': 'X',
        'title': 'delete',
        'fx': opts.symbol_size / 2 - 1,
        'fy': -opts.symbol_size + 12,
        'styles': {
          "font-weight": "bold",
          "fill": "darkred",
          "font-family": "monospace"
        }
      }
    };

    if (opts.edit) {
      widgets.settings = {
        'text': "\uF013",
        'title': 'settings',
        'fx': -font_size / 2 + 2,
        'fy': -opts.symbol_size + 11
      };
    }

    var _loop = function _loop(key) {
      var widget = node.append("text").filter(function (d) {
        return (d.data.hidden && !opts.DEBUG ? false : true) && !((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') && !(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') && !(d.data.parent_node === undefined && key === 'addchild') && !(d.data.noparents === undefined && d.data.top_level === undefined && key === 'addparents');
      }).attr("class", key).style("opacity", 0).attr('font-family', 'FontAwesome').attr("xx", function (d) {
        return d.x;
      }).attr("yy", function (d) {
        return d.y;
      }).attr("x", widgets[key].fx).attr("y", widgets[key].fy).attr('font-size', '0.9em').text(widgets[key].text);
      if ('styles' in widgets[key]) for (var style in widgets[key].styles) {
        widget.attr(style, widgets[key].styles[style]);
      }
      widget.append("svg:title").text(widgets[key].title);
      off += 17;
    };

    for (var key in widgets) {
      _loop(key);
    } // add sibling or child


    d3.selectAll(".addsibling, .addchild").on("mouseover", function () {
      var type = d3.select(this).attr('class');
      d3.selectAll('.popup_selection').style("opacity", 1);
      add_person = {
        'node': d3.select(this.parentNode),
        'type': type
      }; //let translate = getTranslation(d3.select('.diagram').attr("transform"));

      var x = parseInt(d3.select(this).attr("xx")) + parseInt(d3.select(this).attr("x"));
      var y = parseInt(d3.select(this).attr("yy")) + parseInt(d3.select(this).attr("y"));
      d3.selectAll('.popup_selection').attr("transform", "translate(" + x + "," + (y + 2) + ")");
      d3.selectAll('.popup_selection_rotate45').attr("transform", "translate(" + (x + 3 * font_size) + "," + (y + font_size * 1.2) + ") rotate(45)");
    }); // handle widget clicks

    d3.selectAll(".addchild, .addpartner, .addparents, .delete, .settings").on("click", function () {
      d3.event.stopPropagation();
      var opt = d3.select(this).attr('class');
      var d = d3.select(this.parentNode).datum();

      if (opts.DEBUG) {
        console.log(opt);
      }

      var newdataset;

      if (opt === 'settings') {
        if (typeof opts.edit === 'function') {
          opts.edit(opts, d);
        } else {
          openEditDialog(opts, d);
        }
      } else if (opt === 'delete') {
        newdataset = copy_dataset(current(opts));
        delete_node_dataset(newdataset, d.data, opts, onDone);
      } else if (opt === 'addparents') {
        newdataset = copy_dataset(current(opts));
        opts.dataset = newdataset;
        addparents(opts, newdataset, d.data.name);
        rebuild(opts);
      } else if (opt === 'addpartner') {
        newdataset = copy_dataset(current(opts));
        addpartner(opts, newdataset, d.data.name);
        opts.dataset = newdataset;
        rebuild(opts);
      } // trigger fhChange event


      $(document).trigger('fhChange', [opts]);
    }); // other mouse events

    var highlight = [];
    node.filter(function (d) {
      return !d.data.hidden;
    }).on("click", function (d) {
      if (d3.event.ctrlKey) {
        if (highlight.indexOf(d) == -1) highlight.push(d);else highlight.splice(highlight.indexOf(d), 1);
      } else highlight = [d];

      if ('nodeclick' in opts) {
        opts.nodeclick(d.data);
        d3.selectAll(".indi_rect").style("opacity", 0);
        d3.selectAll('.indi_rect').filter(function (d) {
          return highlight.indexOf(d) != -1;
        }).style("opacity", 0.5);
      }
    }).on("mouseover", function (d) {
      d3.event.stopPropagation();
      last_mouseover = d;

      if (dragging) {
        if (dragging.data.name !== last_mouseover.data.name && dragging.data.sex !== last_mouseover.data.sex) {
          d3.select(this).select('rect').style("opacity", 0.2);
        }

        return;
      }

      d3.select(this).select('rect').style("opacity", 0.2);
      d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 1);
      d3.select(this).selectAll('.indi_details').style("opacity", 0);
      setLineDragPosition(opts.symbol_size - 10, 0, opts.symbol_size - 2, 0, d.x + "," + (d.y + 2));
    }).on("mouseout", function (d) {
      if (dragging) return;
      d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 0);
      if (highlight.indexOf(d) == -1) d3.select(this).select('rect').style("opacity", 0);
      d3.select(this).selectAll('.indi_details').style("opacity", 1); // hide popup if it looks like the mouse is moving north

      if (d3.mouse(this)[1] < 0.8 * opts.symbol_size) d3.selectAll('.popup_selection').style("opacity", 0);

      if (!dragging) {
        // hide popup if it looks like the mouse is moving north, south or west
        if (Math.abs(d3.mouse(this)[1]) > 0.25 * opts.symbol_size || Math.abs(d3.mouse(this)[1]) < -0.25 * opts.symbol_size || d3.mouse(this)[0] < 0.2 * opts.symbol_size) {
          setLineDragPosition(0, 0, 0, 0);
        }
      }
    });
  }

  function onDone(opts, dataset) {
    // assign new dataset and rebuild pedigree
    opts.dataset = dataset;
    rebuild(opts);
  } // drag line between nodes to create partners


  function drag_handle(opts) {
    var line_drag_selection = d3.select('.diagram');
    var dline = line_drag_selection.append("line").attr("class", 'line_drag_selection').attr("stroke-width", 6).style("stroke-dasharray", "2, 1").attr("stroke", "black").call(d3.drag().on("start", dragstart).on("drag", drag).on("end", dragstop));
    dline.append("svg:title").text("drag to create consanguineous partners");
    setLineDragPosition(0, 0, 0, 0);

    function dragstart(_d) {
      d3.event.sourceEvent.stopPropagation();
      dragging = last_mouseover;
      d3.selectAll('.line_drag_selection').attr("stroke", "darkred");
    }

    function dragstop(_d) {
      if (last_mouseover && dragging.data.name !== last_mouseover.data.name && dragging.data.sex !== last_mouseover.data.sex) {
        // make partners
        var child = {
          "name": makeid(4),
          "sex": 'U',
          "mother": dragging.data.sex === 'F' ? dragging.data.name : last_mouseover.data.name,
          "father": dragging.data.sex === 'F' ? last_mouseover.data.name : dragging.data.name
        };
        var newdataset = copy_dataset(opts.dataset);
        opts.dataset = newdataset;
        var idx = getIdxByName(opts.dataset, dragging.data.name) + 1;
        opts.dataset.splice(idx, 0, child);
        rebuild(opts);
      }

      setLineDragPosition(0, 0, 0, 0);
      d3.selectAll('.line_drag_selection').attr("stroke", "black");
      dragging = undefined;
      return;
    }

    function drag(_d) {
      d3.event.sourceEvent.stopPropagation();
      var dx = d3.event.dx;
      var dy = d3.event.dy;
      var xnew = parseFloat(d3.select(this).attr('x2')) + dx;
      var ynew = parseFloat(d3.select(this).attr('y2')) + dy;
      setLineDragPosition(opts.symbol_size - 10, 0, xnew, ynew);
    }
  }

  function setLineDragPosition(x1, y1, x2, y2, translate) {
    if (translate) d3.selectAll('.line_drag_selection').attr("transform", "translate(" + translate + ")");
    d3.selectAll('.line_drag_selection').attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
  }

  function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  } // if opt.edit is set true (rather than given a function) this is called to edit node attributes


  function openEditDialog(opts, d) {
    $('#node_properties').dialog({
      autoOpen: false,
      title: d.data.display_name,
      width: $(window).width() > 400 ? 450 : $(window).width() - 30
    });
    var table = "<table id='person_details' class='table'>";
    table += "<tr><td style='text-align:right'>Unique ID</td><td><input class='form-control' type='text' id='id_name' name='name' value=" + (d.data.name ? d.data.name : "") + "></td></tr>";
    table += "<tr><td style='text-align:right'>Name</td><td><input class='form-control' type='text' id='id_display_name' name='display_name' value=" + (d.data.display_name ? d.data.display_name : "") + "></td></tr>";
    table += "<tr><td style='text-align:right'>Age</td><td><input class='form-control' type='number' id='id_age' min='0' max='120' name='age' style='width:7em' value=" + (d.data.age ? d.data.age : "") + "></td></tr>";
    table += "<tr><td style='text-align:right'>Year Of Birth</td><td><input class='form-control' type='number' id='id_yob' min='1900' max='2050' name='yob' style='width:7em' value=" + (d.data.yob ? d.data.yob : "") + "></td></tr>";
    table += '<tr><td colspan="2" id="id_sex">' + '<label class="radio-inline"><input type="radio" name="sex" value="M" ' + (d.data.sex === 'M' ? "checked" : "") + '>Male</label>' + '<label class="radio-inline"><input type="radio" name="sex" value="F" ' + (d.data.sex === 'F' ? "checked" : "") + '>Female</label>' + '<label class="radio-inline"><input type="radio" name="sex" value="U">Unknown</label>' + '</td></tr>'; // alive status = 0; dead status = 1

    table += '<tr><td colspan="2" id="id_status">' + '<label class="checkbox-inline"><input type="radio" name="status" value="0" ' + (parseInt(d.data.status) === 0 ? "checked" : "") + '>&thinsp;Alive</label>' + '<label class="checkbox-inline"><input type="radio" name="status" value="1" ' + (parseInt(d.data.status) === 1 ? "checked" : "") + '>&thinsp;Deceased</label>' + '</td></tr>';
    $("#id_status input[value='" + d.data.status + "']").prop('checked', true); // switches

    var switches = ["adopted_in", "adopted_out", "miscarriage", "stillbirth", "termination"];
    table += '<tr><td colspan="2"><strong>Reproduction:</strong></td></tr>';
    table += '<tr><td colspan="2">';

    for (var iswitch = 0; iswitch < switches.length; iswitch++) {
      var attr = switches[iswitch];
      if (iswitch === 2) table += '</td></tr><tr><td colspan="2">';
      table += '<label class="checkbox-inline"><input type="checkbox" id="id_' + attr + '" name="' + attr + '" value="0" ' + (d.data[attr] ? "checked" : "") + '>&thinsp;' + capitaliseFirstLetter(attr.replace('_', ' ')) + '</label>';
    }

    table += '</td></tr>'; //

    var exclude = ["children", "name", "parent_node", "top_level", "id", "noparents", "level", "age", "sex", "status", "display_name", "mother", "father", "yob", "mztwin", "dztwin"];
    $.merge(exclude, switches);
    table += '<tr><td colspan="2"><strong>Age of Diagnosis:</strong></td></tr>';
    $.each(opts.diseases, function (k, v) {
      exclude.push(v.type + "_diagnosis_age");
      var disease_colour = '&thinsp;<span style="padding-left:5px;background:' + opts.diseases[k].colour + '"></span>';
      var diagnosis_age = d.data[v.type + "_diagnosis_age"];
      table += "<tr><td style='text-align:right'>" + capitaliseFirstLetter(v.type.replace("_", " ")) + disease_colour + "&nbsp;</td><td>" + "<input class='form-control' id='id_" + v.type + "_diagnosis_age_0' max='110' min='0' name='" + v.type + "_diagnosis_age_0' style='width:5em' type='number' value='" + (diagnosis_age !== undefined ? diagnosis_age : "") + "'></td></tr>";
    });
    table += '<tr><td colspan="2" style="line-height:1px;"></td></tr>';
    $.each(d.data, function (k, v) {
      if ($.inArray(k, exclude) == -1) {
        var kk = capitaliseFirstLetter(k);

        if (v === true || v === false) {
          table += "<tr><td style='text-align:right'>" + kk + "&nbsp;</td><td><input type='checkbox' id='id_" + k + "' name='" + k + "' value=" + v + " " + (v ? "checked" : "") + "></td></tr>";
        } else if (k.length > 0) {
          table += "<tr><td style='text-align:right'>" + kk + "&nbsp;</td><td><input type='text' id='id_" + k + "' name='" + k + "' value=" + v + "></td></tr>";
        }
      }
    });
    table += "</table>";
    $('#node_properties').html(table);
    $('#node_properties').dialog('open'); //$('#id_name').closest('tr').toggle();

    $('#node_properties input[type=radio], #node_properties input[type=checkbox], #node_properties input[type=text], #node_properties input[type=number]').change(function () {
      save(opts);
    });
    update(opts);
    return;
  }

  var roots = {};
  function build(options) {
    var opts = $.extend({
      // defaults
      targetDiv: 'pedigree_edit',
      dataset: [{
        "name": "m21",
        "display_name": "father",
        "sex": "M",
        "top_level": true
      }, {
        "name": "f21",
        "display_name": "mother",
        "sex": "F",
        "top_level": true
      }, {
        "name": "ch1",
        "display_name": "me",
        "sex": "F",
        "mother": "f21",
        "father": "m21",
        "proband": true
      }],
      width: 600,
      height: 400,
      symbol_size: 35,
      zoomIn: 1.0,
      zoomOut: 1.0,
      diseases: [{
        'type': 'breast_cancer',
        'colour': '#F68F35'
      }, {
        'type': 'breast_cancer2',
        'colour': 'pink'
      }, {
        'type': 'ovarian_cancer',
        'colour': '#4DAA4D'
      }, {
        'type': 'pancreatic_cancer',
        'colour': '#4289BA'
      }, {
        'type': 'prostate_cancer',
        'colour': '#D5494A'
      }],
      labels: ['stillbirth', 'age', 'yob', 'alleles'],
      keep_proband_on_reset: false,
      font_size: '.75em',
      font_family: 'Helvetica',
      font_weight: 700,
      background: "#EEE",
      node_background: '#fdfdfd',
      validate: true,
      DEBUG: false
    }, options);

    if ($("#fullscreen").length === 0) {
      // add undo, redo, fullscreen buttons and event listeners once
      add$1(opts);
      add(opts);
    }

    if (nstore(opts) == -1) init_cache(opts);
    updateButtons(opts); // validate pedigree data

    validate_pedigree(opts); // group top level nodes by partners

    opts.dataset = group_top_level(opts.dataset);
    if (opts.DEBUG) print_opts(opts);
    var svg_dimensions = get_svg_dimensions(opts);
    var svg = d3.select("#" + opts.targetDiv).append("svg:svg").attr("width", svg_dimensions.width).attr("height", svg_dimensions.height);
    svg.append("rect").attr("width", "100%").attr("height", "100%").attr("rx", 6).attr("ry", 6).style("stroke", "darkgrey").style("fill", opts.background) // or none
    .style("stroke-width", 1);
    var xytransform = getposition(opts); // cached position

    var xtransform = xytransform[0];
    var ytransform = xytransform[1];
    var zoom = 1;

    if (xytransform.length == 3) {
      zoom = xytransform[2];
    }

    if (xtransform === null || ytransform === null) {
      xtransform = opts.symbol_size / 2;
      ytransform = -opts.symbol_size * 2.5;
    }

    var ped = svg.append("g").attr("class", "diagram").attr("transform", "translate(" + xtransform + "," + ytransform + ") scale(" + zoom + ")");
    var top_level = $.map(opts.dataset, function (val, _i) {
      return 'top_level' in val && val.top_level ? val : null;
    });
    var hidden_root = {
      name: 'hidden_root',
      id: 0,
      hidden: true,
      children: top_level
    };
    var partners = buildTree(opts, hidden_root, hidden_root)[0];
    var root = d3.hierarchy(hidden_root);
    roots[opts.targetDiv] = root; // / get score at each depth used to adjust node separation

    var tree_dimensions = get_tree_dimensions(opts);
    if (opts.DEBUG) console.log('opts.width=' + svg_dimensions.width + ' width=' + tree_dimensions.width + ' opts.height=' + svg_dimensions.height + ' height=' + tree_dimensions.height);
    var treemap = d3.tree().separation(function (a, b) {
      return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
    }).size([tree_dimensions.width, tree_dimensions.height]);
    var nodes = treemap(root.sort(function (a, b) {
      return a.data.id - b.data.id;
    }));
    var flattenNodes = nodes.descendants(); // check the number of visible nodes equals the size of the pedigree dataset

    var vis_nodes = $.map(opts.dataset, function (p, _i) {
      return p.hidden ? null : p;
    });

    if (vis_nodes.length != opts.dataset.length) {
      throw create_err('NUMBER OF VISIBLE NODES DIFFERENT TO NUMBER IN THE DATASET');
    }

    adjust_coords(opts, nodes, flattenNodes);
    var ptrLinkNodes = linkNodes(flattenNodes, partners);
    check_ptr_links(opts, ptrLinkNodes); // check for crossing of partner lines

    var node = ped.selectAll(".node").data(nodes.descendants()).enter().append("g").attr("transform", function (d, _i) {
      return "translate(" + d.x + "," + d.y + ")";
    }); // provide a border to the node

    node.append("path").filter(function (d) {
      return !d.data.hidden;
    }).attr("shape-rendering", "geometricPrecision").attr("transform", function (d) {
      return d.data.sex == "U" && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";
    }).attr("d", d3.symbol().size(function (_d) {
      return opts.symbol_size * opts.symbol_size + 2;
    }).type(function (d) {
      if (d.data.miscarriage || d.data.termination) return d3.symbolTriangle;
      return d.data.sex == "F" ? d3.symbolCircle : d3.symbolSquare;
    })).style("stroke", function (d) {
      return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
    }).style("stroke-width", function (d) {
      return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
    }).style("stroke-dasharray", function (d) {
      return !d.data.exclude ? null : "3, 3";
    }).style("fill", "none"); // set a clippath

    node.append("clipPath").attr("id", function (d) {
      return d.data.name;
    }).append("path").filter(function (d) {
      return !(d.data.hidden && !opts.DEBUG);
    }).attr("class", "node").attr("transform", function (d) {
      return d.data.sex == "U" && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";
    }).attr("d", d3.symbol().size(function (d) {
      if (d.data.hidden) return opts.symbol_size * opts.symbol_size / 5;
      return opts.symbol_size * opts.symbol_size;
    }).type(function (d) {
      if (d.data.miscarriage || d.data.termination) return d3.symbolTriangle;
      return d.data.sex == "F" ? d3.symbolCircle : d3.symbolSquare;
    })); // pie plots for disease colours

    var pienode = node.selectAll("pienode").data(function (d) {
      // set the disease data for the pie plot
      var ncancers = 0;
      var cancers = $.map(opts.diseases, function (val, i) {
        if (prefixInObj(opts.diseases[i].type, d.data)) {
          ncancers++;
          return 1;
        } else return 0;
      });
      if (ncancers === 0) cancers = [1];
      return [$.map(cancers, function (val, _i) {
        return {
          'cancer': val,
          'ncancers': ncancers,
          'id': d.data.name,
          'sex': d.data.sex,
          'proband': d.data.proband,
          'hidden': d.data.hidden,
          'affected': d.data.affected,
          'exclude': d.data.exclude
        };
      })];
    }).enter().append("g");
    pienode.selectAll("path").data(d3.pie().value(function (d) {
      return d.cancer;
    })).enter().append("path").attr("clip-path", function (d) {
      return "url(#" + d.data.id + ")";
    }) // clip the rectangle
    .attr("class", "pienode").attr("d", d3.arc().innerRadius(0).outerRadius(opts.symbol_size)).style("fill", function (d, i) {
      if (d.data.exclude) return 'lightgrey';

      if (d.data.ncancers === 0) {
        if (d.data.affected) return 'darkgrey';
        return opts.node_background;
      }

      return opts.diseases[i].colour;
    }); // adopted in/out brackets

    node.append("path").filter(function (d) {
      return !d.data.hidden && (d.data.adopted_in || d.data.adopted_out);
    }).attr("d", function (_d) {
      {
        var dx = -(opts.symbol_size * 0.66);
        var dy = -(opts.symbol_size * 0.64);
        var indent = opts.symbol_size / 4;
        return get_bracket(dx, dy, indent, opts) + get_bracket(-dx, dy, -indent, opts);
      }
    }).style("stroke", function (d) {
      return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
    }).style("stroke-width", function (_d) {
      return ".1em";
    }).style("stroke-dasharray", function (d) {
      return !d.data.exclude ? null : "3, 3";
    }).style("fill", "none"); // alive status = 0; dead status = 1

    node.append('line').filter(function (d) {
      return d.data.status == 1;
    }).style("stroke", "black").attr("x1", function (_d, _i) {
      return -0.6 * opts.symbol_size;
    }).attr("y1", function (_d, _i) {
      return 0.6 * opts.symbol_size;
    }).attr("x2", function (_d, _i) {
      return 0.6 * opts.symbol_size;
    }).attr("y2", function (_d, _i) {
      return -0.6 * opts.symbol_size;
    }); // names of individuals

    addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), -(0.1 * opts.symbol_size), function (d) {
      if (opts.DEBUG) return ('display_name' in d.data ? d.data.display_name : d.data.name) + '  ' + d.data.id;
      return 'display_name' in d.data ? d.data.display_name : '';
    });
    /*
     * let warn = node.filter(function (d) { return (!d.data.age || !d.data.yob) && !d.data.hidden; }).append("text") .attr('font-family', 'FontAwesome')
     * .attr("x", ".25em") .attr("y", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size)) .html("\uf071"); warn.append("svg:title").text("incomplete");
     */

    var font_size = parseInt(getPx(opts)) + 4; // display label defined in opts.labels e.g. alleles/genotype data

    var _loop = function _loop(ilab) {
      var label = opts.labels[ilab];
      addLabel(opts, node, ".25em", -(0.7 * opts.symbol_size), function (d) {
        if (!d.data[label]) return;
        d.y_offset = ilab === 0 || !d.y_offset ? font_size * 2.25 : d.y_offset + font_size;
        return d.y_offset;
      }, function (d) {
        if (d.data[label]) {
          if (label === 'alleles') {
            var alleles = "";
            var vars = d.data.alleles.split(';');

            for (var ivar = 0; ivar < vars.length; ivar++) {
              if (vars[ivar] !== "") alleles += vars[ivar] + ';';
            }

            return alleles;
          } else if (label === 'age') {
            return d.data[label] + 'y';
          } else if (label === 'stillbirth') {
            return "SB";
          }

          return d.data[label];
        }
      }, 'indi_details');
    };

    for (var ilab = 0; ilab < opts.labels.length; ilab++) {
      _loop(ilab);
    } // individuals disease details


    var _loop2 = function _loop2(i) {
      var disease = opts.diseases[i].type;
      addLabel(opts, node, ".25em", -opts.symbol_size, function (d) {
        var y_offset = d.y_offset ? d.y_offset + font_size : font_size * 2.2;

        for (var j = 0; j < opts.diseases.length; j++) {
          if (disease === opts.diseases[j].type) break;
          if (prefixInObj(opts.diseases[j].type, d.data)) y_offset += font_size - 1;
        }

        return y_offset;
      }, function (d) {
        var dis = disease.replace('_', ' ').replace('cancer', 'ca.');
        return disease + '_diagnosis_age' in d.data ? dis + ": " + d.data[disease + '_diagnosis_age'] : '';
      }, 'indi_details');
    };

    for (var i = 0; i < opts.diseases.length; i++) {
      _loop2(i);
    } //


    addWidgets(opts, node); // links between partners

    var clash_depth = {}; // get path looping over node(s)

    var draw_path = function draw_path(clash, dx, dy1, dy2, parent_node, cshift) {
      var extend = function extend(i, l) {
        if (i + 1 < l) // && Math.abs(clash[i] - clash[i+1]) < (opts.symbol_size*1.25)
          return extend(++i);
        return i;
      };

      var path = "";

      for (var j = 0; j < clash.length; j++) {
        var k = extend(j, clash.length);
        var dx1 = clash[j] - dx - cshift;
        var dx2 = clash[k] + dx + cshift;
        if (parent_node.x > dx1 && parent_node.x < dx2) parent_node.y = dy2;
        path += "L" + dx1 + "," + (dy1 - cshift) + "L" + dx1 + "," + (dy2 - cshift) + "L" + dx2 + "," + (dy2 - cshift) + "L" + dx2 + "," + (dy1 - cshift);
        j = k;
      }

      return path;
    };

    partners = ped.selectAll(".partner").data(ptrLinkNodes).enter().insert("path", "g").attr("fill", "none").attr("stroke", "#000").attr("shape-rendering", "auto").attr('d', function (d, _i) {
      var node1 = getNodeByName(flattenNodes, d.mother.data.name);
      var node2 = getNodeByName(flattenNodes, d.father.data.name);
      var consanguity$1 = consanguity(node1, node2, opts);
      var divorced = d.mother.data.divorced && d.mother.data.divorced === d.father.data.name;
      var x1 = d.mother.x < d.father.x ? d.mother.x : d.father.x;
      var x2 = d.mother.x < d.father.x ? d.father.x : d.mother.x;
      var dy1 = d.mother.y;
      var dy2, dx, parent_node; // identify clashes with other nodes at the same depth

      var clash = check_ptr_link_clashes(opts, d);
      var path = "";

      if (clash) {
        if (d.mother.depth in clash_depth) clash_depth[d.mother.depth] += 4;else clash_depth[d.mother.depth] = 4;
        dy1 -= clash_depth[d.mother.depth];
        dx = clash_depth[d.mother.depth] + opts.symbol_size / 2 + 2;
        var parent_nodes = d.mother.data.parent_node;
        var parent_node_name = parent_nodes[0];

        for (var ii = 0; ii < parent_nodes.length; ii++) {
          if (parent_nodes[ii].father.name === d.father.data.name && parent_nodes[ii].mother.name === d.mother.data.name) parent_node_name = parent_nodes[ii].name;
        }

        parent_node = getNodeByName(flattenNodes, parent_node_name);
        parent_node.y = dy1; // adjust hgt of parent node

        clash.sort(function (a, b) {
          return a - b;
        });
        dy2 = dy1 - opts.symbol_size / 2 - 3;
        path = draw_path(clash, dx, dy1, dy2, parent_node, 0);
      }

      var divorce_path = "";
      if (divorced && !clash) divorce_path = "M" + (x1 + (x2 - x1) * .66 + 6) + "," + (dy1 - 6) + "L" + (x1 + (x2 - x1) * .66 - 6) + "," + (dy1 + 6) + "M" + (x1 + (x2 - x1) * .66 + 10) + "," + (dy1 - 6) + "L" + (x1 + (x2 - x1) * .66 - 2) + "," + (dy1 + 6);

      if (consanguity$1) {
        // consanguinous, draw double line between partners
        dy1 = d.mother.x < d.father.x ? d.mother.y : d.father.y;
        dy2 = d.mother.x < d.father.x ? d.father.y : d.mother.y;
        var cshift = 3;

        if (Math.abs(dy1 - dy2) > 0.1) {
          // DIFFERENT LEVEL
          return "M" + x1 + "," + dy1 + "L" + x2 + "," + dy2 + "M" + x1 + "," + (dy1 - cshift) + "L" + x2 + "," + (dy2 - cshift);
        } else {
          // SAME LEVEL
          var path2 = clash ? draw_path(clash, dx, dy1, dy2, parent_node, cshift) : "";
          return "M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + "M" + x1 + "," + (dy1 - cshift) + path2 + "L" + x2 + "," + (dy1 - cshift) + divorce_path;
        }
      }

      return "M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + divorce_path;
    }); // links to children

    ped.selectAll(".link").data(root.links(nodes.descendants())).enter().filter(function (d) {
      // filter unless debug is set
      return opts.DEBUG || d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden;
    }).insert("path", "g").attr("fill", "none").attr("stroke-width", function (d, _i) {
      if (d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden) return 1;
      return opts.DEBUG ? 2 : 1;
    }).attr("stroke", function (d, _i) {
      if (d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden) return 'pink';
      return "#000";
    }).attr("stroke-dasharray", function (d, _i) {
      if (!d.target.data.adopted_in) return null;
      var dash_len = Math.abs(d.source.y - (d.source.y + d.target.y) / 2);
      var dash_array = [dash_len, 0, Math.abs(d.source.x - d.target.x), 0];
      var twins = getTwins(opts.dataset, d.target.data);
      if (twins.length >= 1) dash_len = dash_len * 3;

      for (var usedlen = 0; usedlen < dash_len; usedlen += 10) {
        $.merge(dash_array, [5, 5]);
      }

      return dash_array;
    }).attr("shape-rendering", function (d, _i) {
      if (d.target.data.mztwin || d.target.data.dztwin) return "geometricPrecision";
      return "auto";
    }).attr("d", function (d, _i) {
      if (d.target.data.mztwin || d.target.data.dztwin) {
        // get twin position
        var twins = getTwins(opts.dataset, d.target.data);

        if (twins.length >= 1) {
          var twinx = 0;
          var xmin = d.target.x;
          d.target.x;

          for (var t = 0; t < twins.length; t++) {
            var thisx = getNodeByName(flattenNodes, twins[t].name).x;
            if (xmin > thisx) xmin = thisx;
            twinx += thisx;
          }

          var xmid = (d.target.x + twinx) / (twins.length + 1);
          var ymid = (d.source.y + d.target.y) / 2;
          var xhbar = "";

          if (xmin === d.target.x && d.target.data.mztwin) {
            // horizontal bar for mztwins
            var xx = (xmid + d.target.x) / 2;
            var yy = (ymid + (d.target.y - opts.symbol_size / 2)) / 2;
            xhbar = "M" + xx + "," + yy + "L" + (xmid + (xmid - xx)) + " " + yy;
          }

          return "M" + d.source.x + "," + d.source.y + "V" + ymid + "H" + xmid + "L" + d.target.x + " " + (d.target.y - opts.symbol_size / 2) + xhbar;
        }
      }

      if (d.source.data.mother) {
        // check parents depth to see if they are at the same level in the tree
        var ma = getNodeByName(flattenNodes, d.source.data.mother.name);
        var pa = getNodeByName(flattenNodes, d.source.data.father.name);

        if (ma.depth !== pa.depth) {
          return "M" + d.source.x + "," + (ma.y + pa.y) / 2 + "H" + d.target.x + "V" + d.target.y;
        }
      }

      return "M" + d.source.x + "," + d.source.y + "V" + (d.source.y + d.target.y) / 2 + "H" + d.target.x + "V" + d.target.y;
    }); // draw proband arrow

    var probandIdx = getProbandIndex(opts.dataset);

    if (typeof probandIdx !== 'undefined') {
      var probandNode = getNodeByName(flattenNodes, opts.dataset[probandIdx].name);
      var triid = "triangle" + makeid(3);
      ped.append("svg:defs").append("svg:marker") // arrow head
      .attr("id", triid).attr("refX", 6).attr("refY", 6).attr("markerWidth", 20).attr("markerHeight", 20).attr("orient", "auto").append("path").attr("d", "M 0 0 12 6 0 12 3 6").style("fill", "black");
      ped.append("line").attr("x1", probandNode.x - opts.symbol_size).attr("y1", probandNode.y + opts.symbol_size).attr("x2", probandNode.x - opts.symbol_size / 2).attr("y2", probandNode.y + opts.symbol_size / 2).attr("stroke-width", 1).attr("stroke", "black").attr("marker-end", "url(#" + triid + ")");
    } // drag and zoom


    zoom = d3.zoom().scaleExtent([opts.zoomIn, opts.zoomOut]).on('zoom', zoomFn);

    function zoomFn() {
      var t = d3.event.transform;
      if (isIE() && t.x.toString().length > 10) // IE fix for drag off screen
        return;
      var pos = [t.x + parseInt(xtransform), t.y + parseInt(ytransform)];

      if (t.k == 1) {
        setposition(opts, pos[0], pos[1]);
      } else {
        setposition(opts, pos[0], pos[1], t.k);
      }

      ped.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ') scale(' + t.k + ')');
    }

    svg.call(zoom);
    return opts;
  }

  function create_err(err) {
    console.error(err);
    return new Error(err);
  } // validate pedigree data


  function validate_pedigree(opts) {
    if (opts.validate) {
      if (typeof opts.validate == 'function') {
        if (opts.DEBUG) console.log('CALLING CONFIGURED VALIDATION FUNCTION');
        return opts.validate.call(this, opts);
      } // check consistency of parents sex


      var uniquenames = [];
      var famids = [];
      var display_name;

      for (var p = 0; p < opts.dataset.length; p++) {
        if (!p.hidden) {
          if (opts.dataset[p].mother || opts.dataset[p].father) {
            display_name = opts.dataset[p].display_name;
            if (!display_name) display_name = 'unnamed';
            display_name += ' (IndivID: ' + opts.dataset[p].name + ')';
            var mother = opts.dataset[p].mother;
            var father = opts.dataset[p].father;

            if (!mother || !father) {
              throw create_err('Missing parent for ' + display_name);
            }

            var midx = getIdxByName(opts.dataset, mother);
            var fidx = getIdxByName(opts.dataset, father);
            if (midx === -1) throw create_err('The mother (IndivID: ' + mother + ') of family member ' + display_name + ' is missing from the pedigree.');
            if (fidx === -1) throw create_err('The father (IndivID: ' + father + ') of family member ' + display_name + ' is missing from the pedigree.');
            if (opts.dataset[midx].sex !== "F") throw create_err("The mother of family member " + display_name + " is not specified as female. All mothers in the pedigree must have sex specified as 'F'.");
            if (opts.dataset[fidx].sex !== "M") throw create_err("The father of family member " + display_name + " is not specified as male. All fathers in the pedigree must have sex specified as 'M'.");
          }
        }

        if (!opts.dataset[p].name) throw create_err(display_name + ' has no IndivID.');
        if ($.inArray(opts.dataset[p].name, uniquenames) > -1) throw create_err('IndivID for family member ' + display_name + ' is not unique.');
        uniquenames.push(opts.dataset[p].name);

        if ($.inArray(opts.dataset[p].famid, famids) === -1 && opts.dataset[p].famid) {
          famids.push(opts.dataset[p].famid);
        }
      }

      if (famids.length > 1) {
        throw create_err('More than one family found: ' + famids.join(", ") + '.');
      } // warn if there is a break in the pedigree


      var uc = unconnected(opts.dataset);
      if (uc.length > 0) console.warn("individuals unconnected to pedigree ", uc);
    }
  } //adopted in/out brackets

  function get_bracket(dx, dy, indent, opts) {
    return "M" + (dx + indent) + "," + dy + "L" + dx + " " + dy + "L" + dx + " " + (dy + opts.symbol_size * 1.28) + "L" + dx + " " + (dy + opts.symbol_size * 1.28) + "L" + (dx + indent) + "," + (dy + opts.symbol_size * 1.28);
  } // check if the object contains a key with a given prefix


  function prefixInObj(prefix, obj) {
    var found = false;
    if (obj) $.each(obj, function (k, _n) {
      if (k.indexOf(prefix + "_") === 0 || k === prefix) {
        found = true;
        return found;
      }
    });
    return found;
  } // check for crossing of partner lines


  function check_ptr_links(opts, ptrLinkNodes) {
    for (var a = 0; a < ptrLinkNodes.length; a++) {
      var clash = check_ptr_link_clashes(opts, ptrLinkNodes[a]);
      if (clash) console.log("CLASH :: " + ptrLinkNodes[a].mother.data.name + " " + ptrLinkNodes[a].father.data.name, clash);
    }
  }

  function check_ptr_link_clashes(opts, anode) {
    var root = roots[opts.targetDiv];
    var flattenNodes = flatten(root);
    var mother, father;

    if ('name' in anode) {
      anode = getNodeByName(flattenNodes, anode.name);
      if (!('mother' in anode.data)) return null;
      mother = getNodeByName(flattenNodes, anode.data.mother);
      father = getNodeByName(flattenNodes, anode.data.father);
    } else {
      mother = anode.mother;
      father = anode.father;
    }

    var x1 = mother.x < father.x ? mother.x : father.x;
    var x2 = mother.x < father.x ? father.x : mother.x;
    var dy = mother.y; // identify clashes with other nodes at the same depth

    var clash = $.map(flattenNodes, function (bnode, _i) {
      return !bnode.data.hidden && bnode.data.name !== mother.data.name && bnode.data.name !== father.data.name && bnode.y == dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
    });
    return clash.length > 0 ? clash : null;
  }

  function get_svg_dimensions(opts) {
    return {
      'width': is_fullscreen() ? window.innerWidth : opts.width,
      'height': is_fullscreen() ? window.innerHeight : opts.height
    };
  }

  function get_tree_dimensions(opts) {
    // / get score at each depth used to adjust node separation
    var svg_dimensions = get_svg_dimensions(opts);
    var maxscore = 0;
    var generation = {};

    for (var i = 0; i < opts.dataset.length; i++) {
      var depth = getDepth(opts.dataset, opts.dataset[i].name);
      var children = getAllChildren(opts.dataset, opts.dataset[i]); // score based on no. of children and if parent defined

      var score = 1 + (children.length > 0 ? 0.55 + children.length * 0.25 : 0) + (opts.dataset[i].father ? 0.25 : 0);
      if (depth in generation) generation[depth] += score;else generation[depth] = score;
      if (generation[depth] > maxscore) maxscore = generation[depth];
    }

    var max_depth = Object.keys(generation).length * opts.symbol_size * 3.5;
    var tree_width = svg_dimensions.width - opts.symbol_size > maxscore * opts.symbol_size * 1.65 ? svg_dimensions.width - opts.symbol_size : maxscore * opts.symbol_size * 1.65;
    var tree_height = svg_dimensions.height - opts.symbol_size > max_depth ? svg_dimensions.height - opts.symbol_size : max_depth;
    return {
      'width': tree_width,
      'height': tree_height
    };
  } // group top_level nodes by their partners

  function group_top_level(dataset) {
    // let top_level = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
    // calculate top_level nodes
    for (var i = 0; i < dataset.length; i++) {
      if (getDepth(dataset, dataset[i].name) == 2) dataset[i].top_level = true;
    }

    var top_level = [];
    var top_level_seen = [];

    for (var _i2 = 0; _i2 < dataset.length; _i2++) {
      var node = dataset[_i2];

      if ('top_level' in node && $.inArray(node.name, top_level_seen) == -1) {
        top_level_seen.push(node.name);
        top_level.push(node);
        var ptrs = get_partners(dataset, node);

        for (var j = 0; j < ptrs.length; j++) {
          if ($.inArray(ptrs[j], top_level_seen) == -1) {
            top_level_seen.push(ptrs[j]);
            top_level.push(getNodeByName(dataset, ptrs[j]));
          }
        }
      }
    }

    var newdataset = $.map(dataset, function (val, _i) {
      return 'top_level' in val && val.top_level ? null : val;
    });

    for (var _i3 = top_level.length; _i3 > 0; --_i3) {
      newdataset.unshift(top_level[_i3 - 1]);
    }

    return newdataset;
  } // get height in pixels


  function getPx(opts) {
    var emVal = opts.font_size;
    if (emVal === parseInt(emVal, 10)) // test if integer
      return emVal;
    if (emVal.indexOf("px") > -1) return emVal.replace('px', '');else if (emVal.indexOf("em") === -1) return emVal;
    emVal = parseFloat(emVal.replace('em', ''));
    return parseFloat(getComputedStyle($('#' + opts.targetDiv).get(0)).fontSize) * emVal - 1.0;
  } // Add label


  function addLabel(opts, node, size, fx, fy, ftext, class_label) {
    node.filter(function (d) {
      return d.data.hidden && !opts.DEBUG ? false : true;
    }).append("text").attr("class", class_label + ' ped_label' || "ped_label").attr("x", fx).attr("y", fy) // .attr("dy", size)
    .attr("font-family", opts.font_family).attr("font-size", opts.font_size).attr("font-weight", opts.font_weight).text(ftext);
  }

  function rebuild(opts) {
    $("#" + opts.targetDiv).empty();
    init_cache(opts);

    try {
      build(opts);
    } catch (e) {
      console.error(e);
      throw e;
    }

    try {
      templates.update(opts);
    } catch (e) {// templates not declared
    }
  } // add children to a given node

  function addchild(dataset, node, sex, nchild, twin_type) {
    if (twin_type && $.inArray(twin_type, ["mztwin", "dztwin"]) === -1) return new Error("INVALID TWIN TYPE SET: " + twin_type);
    if (_typeof(nchild) === ("undefined" )) nchild = 1;
    var children = getAllChildren(dataset, node);
    var ptr_name, idx;

    if (children.length === 0) {
      var partner = addsibling(dataset, node, node.sex === 'F' ? 'M' : 'F', node.sex === 'F');
      partner.noparents = true;
      ptr_name = partner.name;
      idx = getIdxByName(dataset, node.name) + 1;
    } else {
      var c = children[0];
      ptr_name = c.father === node.name ? c.mother : c.father;
      idx = getIdxByName(dataset, c.name);
    }

    var twin_id;
    if (twin_type) twin_id = getUniqueTwinID(dataset, twin_type);
    var newchildren = [];

    for (var i = 0; i < nchild; i++) {
      var child = {
        "name": makeid(4),
        "sex": sex,
        "mother": node.sex === 'F' ? node.name : ptr_name,
        "father": node.sex === 'F' ? ptr_name : node.name
      };
      dataset.splice(idx, 0, child);
      if (twin_type) child[twin_type] = twin_id;
      newchildren.push(child);
    }

    return newchildren;
  } //

  function addsibling(dataset, node, sex, add_lhs, twin_type) {
    if (twin_type && $.inArray(twin_type, ["mztwin", "dztwin"]) === -1) return new Error("INVALID TWIN TYPE SET: " + twin_type);
    var newbie = {
      "name": makeid(4),
      "sex": sex
    };

    if (node.top_level) {
      newbie.top_level = true;
    } else {
      newbie.mother = node.mother;
      newbie.father = node.father;
    }

    var idx = getIdxByName(dataset, node.name);

    if (twin_type) {
      setMzTwin(dataset, dataset[idx], newbie, twin_type);
    }

    if (add_lhs) {
      // add to LHS
      if (idx > 0) idx--;
    } else idx++;

    dataset.splice(idx, 0, newbie);
    return newbie;
  } // set two siblings as twins

  function setMzTwin(dataset, d1, d2, twin_type) {
    if (!d1[twin_type]) {
      d1[twin_type] = getUniqueTwinID(dataset, twin_type);
      if (!d1[twin_type]) return false;
    }

    d2[twin_type] = d1[twin_type];
    if (d1.yob) d2.yob = d1.yob;
    if (d1.age && (d1.status == 0 || !d1.status)) d2.age = d1.age;
    return true;
  } // get a new unique twins ID, max of 10 twins in a pedigree


  function getUniqueTwinID(dataset, twin_type) {
    var mz = [1, 2, 3, 4, 5, 6, 7, 8, 9, "A"];

    for (var i = 0; i < dataset.length; i++) {
      if (dataset[i][twin_type]) {
        var idx = mz.indexOf(dataset[i][twin_type]);
        if (idx > -1) mz.splice(idx, 1);
      }
    }

    if (mz.length > 0) return mz[0];
    return undefined;
  } // sync attributes of twins


  function syncTwins(dataset, d1) {
    if (!d1.mztwin && !d1.dztwin) return;
    var twin_type = d1.mztwin ? "mztwin" : "dztwin";

    for (var i = 0; i < dataset.length; i++) {
      var d2 = dataset[i];

      if (d2[twin_type] && d1[twin_type] == d2[twin_type] && d2.name !== d1.name) {
        if (twin_type === "mztwin") d2.sex = d1.sex;
        if (d1.yob) d2.yob = d1.yob;
        if (d1.age && (d1.status == 0 || !d1.status)) d2.age = d1.age;
      }
    }
  } // check integrity twin settings

  function checkTwins(dataset) {
    var twin_types = ["mztwin", "dztwin"];

    for (var i = 0; i < dataset.length; i++) {
      for (var j = 0; j < twin_types.length; j++) {
        var twin_type = twin_types[j];

        if (dataset[i][twin_type]) {
          var count = 0;

          for (var _j = 0; _j < dataset.length; _j++) {
            if (dataset[_j][twin_type] == dataset[i][twin_type]) count++;
          }

          if (count < 2) delete dataset[i][[twin_type]];
        }
      }
    }
  } // add parents to the 'node'


  function addparents(opts, dataset, name) {
    var mother, father;
    var root = roots[opts.targetDiv];
    var flat_tree = flatten(root);
    var tree_node = getNodeByName(flat_tree, name);
    var node = tree_node.data;
    var depth = tree_node.depth; // depth of the node in relation to the root (depth = 1 is a top_level node)

    var pid = -101;
    var ptr_name;
    var children = getAllChildren(dataset, node);

    if (children.length > 0) {
      ptr_name = children[0].mother == node.name ? children[0].father : children[0].mother;
      pid = getNodeByName(flat_tree, ptr_name).data.id;
    }

    var i;

    if (depth == 1) {
      mother = {
        "name": makeid(4),
        "sex": "F",
        "top_level": true
      };
      father = {
        "name": makeid(4),
        "sex": "M",
        "top_level": true
      };
      dataset.splice(0, 0, mother);
      dataset.splice(0, 0, father);

      for (i = 0; i < dataset.length; i++) {
        if (dataset[i].top_level && dataset[i].name !== mother.name && dataset[i].name !== father.name) {
          delete dataset[i].top_level;
          dataset[i].noparents = true;
          dataset[i].mother = mother.name;
          dataset[i].father = father.name;
        }
      }
    } else {
      var node_mother = getNodeByName(flat_tree, tree_node.data.mother);
      var node_father = getNodeByName(flat_tree, tree_node.data.father);
      var node_sibs = getAllSiblings(dataset, node); // lhs & rhs id's for siblings of this node

      var rid = 10000;
      var lid = tree_node.data.id;

      for (i = 0; i < node_sibs.length; i++) {
        var sid = getNodeByName(flat_tree, node_sibs[i].name).data.id;
        if (sid < rid && sid > tree_node.data.id) rid = sid;
        if (sid < lid) lid = sid;
      }

      var add_lhs = lid >= tree_node.data.id || pid == lid && rid < 10000;
      if (opts.DEBUG) console.log('lid=' + lid + ' rid=' + rid + ' nid=' + tree_node.data.id + ' ADD_LHS=' + add_lhs);
      var midx;
      if (!add_lhs && node_father.data.id > node_mother.data.id || add_lhs && node_father.data.id < node_mother.data.id) midx = getIdxByName(dataset, node.father);else midx = getIdxByName(dataset, node.mother);
      var parent = dataset[midx];
      father = addsibling(dataset, parent, 'M', add_lhs);
      mother = addsibling(dataset, parent, 'F', add_lhs);
      var faidx = getIdxByName(dataset, father.name);
      var moidx = getIdxByName(dataset, mother.name);

      if (faidx > moidx) {
        // switch to ensure father on lhs of mother
        var tmpfa = dataset[faidx];
        dataset[faidx] = dataset[moidx];
        dataset[moidx] = tmpfa;
      }

      var orphans = getAdoptedSiblings(dataset, node);
      var nid = tree_node.data.id;

      for (i = 0; i < orphans.length; i++) {
        var oid = getNodeByName(flat_tree, orphans[i].name).data.id;
        if (opts.DEBUG) console.log('ORPHAN=' + i + ' ' + orphans[i].name + ' ' + (nid < oid && oid < rid) + ' nid=' + nid + ' oid=' + oid + ' rid=' + rid);

        if ((add_lhs || nid < oid) && oid < rid) {
          var oidx = getIdxByName(dataset, orphans[i].name);
          dataset[oidx].mother = mother.name;
          dataset[oidx].father = father.name;
        }
      }
    }

    if (depth == 2) {
      mother.top_level = true;
      father.top_level = true;
    } else if (depth > 2) {
      mother.noparents = true;
      father.noparents = true;
    }

    var idx = getIdxByName(dataset, node.name);
    dataset[idx].mother = mother.name;
    dataset[idx].father = father.name;
    delete dataset[idx].noparents;

    if ('parent_node' in node) {
      var ptr_node = dataset[getIdxByName(dataset, ptr_name)];

      if ('noparents' in ptr_node) {
        ptr_node.mother = mother.name;
        ptr_node.father = father.name;
      }
    }
  } // add partner

  function addpartner(opts, dataset, name) {
    var root = roots[opts.targetDiv];
    var flat_tree = flatten(root);
    var tree_node = getNodeByName(flat_tree, name);
    var partner = addsibling(dataset, tree_node.data, tree_node.data.sex === 'F' ? 'M' : 'F', tree_node.data.sex === 'F');
    partner.noparents = true;
    var child = {
      "name": makeid(4),
      "sex": "M"
    };
    child.mother = tree_node.data.sex === 'F' ? tree_node.data.name : partner.name;
    child.father = tree_node.data.sex === 'F' ? partner.name : tree_node.data.name;
    var idx = getIdxByName(dataset, tree_node.data.name) + 2;
    dataset.splice(idx, 0, child);
  } // get adjacent nodes at the same depth

  function adjacent_nodes(root, node, excludes) {
    var dnodes = getNodesAtDepth(flatten(root), node.depth, excludes);
    var lhs_node, rhs_node;

    for (var i = 0; i < dnodes.length; i++) {
      if (dnodes[i].x < node.x) lhs_node = dnodes[i];
      if (!rhs_node && dnodes[i].x > node.x) rhs_node = dnodes[i];
    }

    return [lhs_node, rhs_node];
  } // delete a node and descendants


  function delete_node_dataset(dataset, node, opts, onDone) {
    var root = roots[opts.targetDiv];
    var fnodes = flatten(root);
    var deletes = [];
    var i, j; // get d3 data node

    if (node.id === undefined) {
      var d3node = getNodeByName(fnodes, node.name);
      if (d3node !== undefined) node = d3node.data;
    }

    if (node.parent_node) {
      for (i = 0; i < node.parent_node.length; i++) {
        var parent = node.parent_node[i];
        var ps = [getNodeByName(dataset, parent.mother.name), getNodeByName(dataset, parent.father.name)]; // delete parents

        for (j = 0; j < ps.length; j++) {
          if (ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
            dataset.splice(getIdxByName(dataset, ps[j].name), 1);
            deletes.push(ps[j]);
          }
        }

        var children = parent.children;
        var children_names = $.map(children, function (p, _i) {
          return p.name;
        });

        for (j = 0; j < children.length; j++) {
          var child = getNodeByName(dataset, children[j].name);

          if (child) {
            child.noparents = true;
            var ptrs = get_partners(dataset, child);
            var ptr = void 0;
            if (ptrs.length > 0) ptr = getNodeByName(dataset, ptrs[0]);

            if (ptr && ptr.mother !== child.mother) {
              child.mother = ptr.mother;
              child.father = ptr.father;
            } else if (ptr) {
              var child_node = getNodeByName(fnodes, child.name);
              var adj = adjacent_nodes(root, child_node, children_names);
              child.mother = adj[0] ? adj[0].data.mother : adj[1] ? adj[1].data.mother : null;
              child.father = adj[0] ? adj[0].data.father : adj[1] ? adj[1].data.father : null;
            } else {
              dataset.splice(getIdxByName(dataset, child.name), 1);
            }
          }
        }
      }
    } else {
      dataset.splice(getIdxByName(dataset, node.name), 1);
    } // delete ancestors


    console.log(deletes);

    for (i = 0; i < deletes.length; i++) {
      var del = deletes[i];
      var sibs = getAllSiblings(dataset, del);
      console.log('DEL', del.name, sibs);

      if (sibs.length < 1) {
        console.log('del sibs', del.name, sibs);
        var data_node = getNodeByName(fnodes, del.name);
        var ancestors = data_node.ancestors();

        for (j = 0; j < ancestors.length; j++) {
          console.log(ancestors[i]);

          if (ancestors[j].data.mother) {
            console.log('DELETE ', ancestors[j].data.mother, ancestors[j].data.father);
            dataset.splice(getIdxByName(dataset, ancestors[j].data.mother.name), 1);
            dataset.splice(getIdxByName(dataset, ancestors[j].data.father.name), 1);
          }
        }
      }
    } // check integrity of mztwins settings


    checkTwins(dataset);
    var uc;

    try {
      // validate new pedigree dataset
      var newopts = $.extend({}, opts);
      newopts.dataset = copy_dataset(dataset);
      validate_pedigree(newopts); // check if pedigree is split

      uc = unconnected(dataset);
    } catch (err) {
      messages('Warning', 'Deletion of this pedigree member is disallowed.');
      throw err;
    }

    if (uc.length > 0) {
      // check & warn only if this is a new split
      if (unconnected(opts.dataset).length === 0) {
        console.error("individuals unconnected to pedigree ", uc);
        messages("Warning", "Deleting this will split the pedigree. Continue?", onDone, opts, dataset);
        return;
      }
    }

    if (onDone) {
      onDone(opts, dataset);
    }

    return dataset;
  }

  var pedigree = /*#__PURE__*/Object.freeze({
    __proto__: null,
    roots: roots,
    build: build,
    validate_pedigree: validate_pedigree,
    check_ptr_link_clashes: check_ptr_link_clashes,
    get_tree_dimensions: get_tree_dimensions,
    rebuild: rebuild,
    addchild: addchild,
    addsibling: addsibling,
    syncTwins: syncTwins,
    addparents: addparents,
    addpartner: addpartner,
    delete_node_dataset: delete_node_dataset
  });

  exports.io = io;
  exports.pedcache = pedcache;
  exports.pedigree_utils = pedigree_utils;
  exports.pedigreejs = pedigree;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVkaWdyZWVqcy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vZXMvcGVkY2FjaGUuanMiLCIuLi8uLi9lcy9wZWRpZ3JlZV91dGlscy5qcyIsIi4uLy4uL2VzL3BidXR0b25zLmpzIiwiLi4vLi4vZXMvaW8uanMiLCIuLi8uLi9lcy9wZWRpZ3JlZV9mb3JtLmpzIiwiLi4vLi4vZXMvd2lkZ2V0cy5qcyIsIi4uLy4uL2VzL3BlZGlncmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vc3RvcmUgYSBoaXN0b3J5IG9mIHBlZGlncmVlXG5cbmxldCBtYXhfbGltaXQgPSAyNTtcbmxldCBkaWN0X2NhY2hlID0ge307XG5cbi8vIHRlc3QgaWYgYnJvd3NlciBzdG9yYWdlIGlzIHN1cHBvcnRlZFxuZnVuY3Rpb24gaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSB7XG5cdHRyeSB7XG5cdFx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnYXJyYXknKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0aWYob3B0cy5zdG9yZV90eXBlICE9PSAnbG9jYWwnICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gJ3Nlc3Npb24nICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0bGV0IG1vZCA9ICd0ZXN0Jztcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShtb2QsIG1vZCk7XG5cdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obW9kKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldF9wcmVmaXgob3B0cykge1xuXHRyZXR1cm4gXCJQRURJR1JFRV9cIitvcHRzLmJ0bl90YXJnZXQrXCJfXCI7XG59XG5cbi8vIHVzZSBkaWN0X2NhY2hlIHRvIHN0b3JlIGNhY2hlIGFzIGFuIGFycmF5XG5mdW5jdGlvbiBnZXRfYXJyKG9wdHMpIHtcblx0cmV0dXJuIGRpY3RfY2FjaGVbZ2V0X3ByZWZpeChvcHRzKV07XG59XG5cbmZ1bmN0aW9uIGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGl0ZW0pIHtcblx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnbG9jYWwnKVxuXHRcdHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKTtcblx0ZWxzZVxuXHRcdHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGl0ZW0pO1xufVxuXG5mdW5jdGlvbiBzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBuYW1lLCBpdGVtKSB7XG5cdGlmKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJylcblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLnNldEl0ZW0obmFtZSwgaXRlbSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBpdGVtKTtcbn1cblxuLy8gY2xlYXIgYWxsIHN0b3JhZ2UgaXRlbXNcbmZ1bmN0aW9uIGNsZWFyX2Jyb3dzZXJfc3RvcmUob3B0cykge1xuXHRpZihvcHRzLnN0b3JlX3R5cGUgPT09ICdsb2NhbCcpXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIHNlc3Npb25TdG9yYWdlLmNsZWFyKCk7XG59XG5cbi8vIHJlbW92ZSBhbGwgc3RvcmFnZSBpdGVtcyB3aXRoIGtleXMgdGhhdCBoYXZlIHRoZSBwZWRpZ3JlZSBoaXN0b3J5IHByZWZpeFxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyX3BlZGlncmVlX2RhdGEob3B0cykge1xuXHRsZXQgcHJlZml4ID0gZ2V0X3ByZWZpeChvcHRzKTtcblx0bGV0IHN0b3JlID0gKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJyA/IGxvY2FsU3RvcmFnZSA6IHNlc3Npb25TdG9yYWdlKTtcblx0bGV0IGl0ZW1zID0gW107XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBzdG9yZS5sZW5ndGg7IGkrKyl7XG5cdFx0aWYoc3RvcmUua2V5KGkpLmluZGV4T2YocHJlZml4KSA9PSAwKVxuXHRcdFx0aXRlbXMucHVzaChzdG9yZS5rZXkoaSkpO1xuXHR9XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKylcblx0XHRzdG9yZS5yZW1vdmVJdGVtKGl0ZW1zW2ldKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9jb3VudChvcHRzKSB7XG5cdGxldCBjb3VudDtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y291bnQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydDT1VOVCcpO1xuXHRlbHNlXG5cdFx0Y291bnQgPSBkaWN0X2NhY2hlW2dldF9wcmVmaXgob3B0cykrJ0NPVU5UJ107XG5cdGlmKGNvdW50ICE9PSBudWxsICYmIGNvdW50ICE9PSB1bmRlZmluZWQpXG5cdFx0cmV0dXJuIGNvdW50O1xuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gc2V0X2NvdW50KG9wdHMsIGNvdW50KSB7XG5cdGlmIChoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHNldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ0NPVU5UJywgY291bnQpO1xuXHRlbHNlXG5cdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpKydDT1VOVCddID0gY291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0X2NhY2hlKG9wdHMpIHtcblx0aWYoIW9wdHMuZGF0YXNldClcblx0XHRyZXR1cm47XG5cdGxldCBjb3VudCA9IGdldF9jb3VudChvcHRzKTtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpIHsgICAvLyBsb2NhbCBzdG9yYWdlXG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKStjb3VudCwgSlNPTi5zdHJpbmdpZnkob3B0cy5kYXRhc2V0KSk7XG5cdH0gZWxzZSB7ICAgLy8gVE9ETyA6OiBhcnJheSBjYWNoZVxuXHRcdGNvbnNvbGUud2FybignTG9jYWwgc3RvcmFnZSBub3QgZm91bmQvc3VwcG9ydGVkIGZvciB0aGlzIGJyb3dzZXIhJywgb3B0cy5zdG9yZV90eXBlKTtcblx0XHRtYXhfbGltaXQgPSA1MDA7XG5cdFx0aWYoZ2V0X2FycihvcHRzKSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpXSA9IFtdO1xuXHRcdGdldF9hcnIob3B0cykucHVzaChKU09OLnN0cmluZ2lmeShvcHRzLmRhdGFzZXQpKTtcblx0fVxuXHRpZihjb3VudCA8IG1heF9saW1pdClcblx0XHRjb3VudCsrO1xuXHRlbHNlXG5cdFx0Y291bnQgPSAwO1xuXHRzZXRfY291bnQob3B0cywgY291bnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbnN0b3JlKG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRpZihnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKSAhPT0gbnVsbClcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAoZ2V0X2FycihvcHRzKSAmJiBnZXRfYXJyKG9wdHMpLmxlbmd0aCA+IDAgPyBnZXRfYXJyKG9wdHMpLmxlbmd0aCA6IC0xKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50KG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBnZXRfY291bnQob3B0cyktMTtcblx0aWYoY3VycmVudCA9PSAtMSlcblx0XHRjdXJyZW50ID0gbWF4X2xpbWl0O1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrY3VycmVudCkpO1xuXHRlbHNlIGlmKGdldF9hcnIob3B0cykpXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtjdXJyZW50XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0KG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRsZXQgaXQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKTtcblx0XHRcdGlmKGl0ICE9PSBudWxsKSB7XG5cdFx0XHRcdHNldF9jb3VudChvcHRzLCBpKTtcblx0XHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoaXQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZXQgYXJyID0gZ2V0X2FycihvcHRzKTtcblx0XHRpZihhcnIpXG5cdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShhcnIoYXJyLmxlbmd0aC0xKSk7XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXZpb3VzKG9wdHMsIHByZXZpb3VzKSB7XG5cdGlmKHByZXZpb3VzID09PSB1bmRlZmluZWQpXG5cdFx0cHJldmlvdXMgPSBnZXRfY291bnQob3B0cykgLSAyO1xuXG5cdGlmKHByZXZpb3VzIDwgMCkge1xuXHRcdGxldCBuc3RvcmUgPSBuc3RvcmUob3B0cyk7XG5cdFx0aWYobnN0b3JlIDwgbWF4X2xpbWl0KVxuXHRcdFx0cHJldmlvdXMgPSBuc3RvcmUgLSAxO1xuXHRcdGVsc2Vcblx0XHRcdHByZXZpb3VzID0gbWF4X2xpbWl0IC0gMTtcblx0fVxuXHRzZXRfY291bnQob3B0cywgcHJldmlvdXMgKyAxKTtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSlcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpK3ByZXZpb3VzKSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYXJyKG9wdHMpW3ByZXZpb3VzXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0KG9wdHMsIG5leHQpIHtcblx0aWYobmV4dCA9PT0gdW5kZWZpbmVkKVxuXHRcdG5leHQgPSBnZXRfY291bnQob3B0cyk7XG5cdGlmKG5leHQgPj0gbWF4X2xpbWl0KVxuXHRcdG5leHQgPSAwO1xuXG5cdHNldF9jb3VudChvcHRzLCBwYXJzZUludChuZXh0KSArIDEpO1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrbmV4dCkpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtuZXh0XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcihvcHRzKSB7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y2xlYXJfYnJvd3Nlcl9zdG9yZShvcHRzKTtcblx0ZGljdF9jYWNoZSA9IHt9O1xufVxuXG4vLyB6b29tIC0gc3RvcmUgdHJhbnNsYXRpb24gY29vcmRzXG5leHBvcnQgZnVuY3Rpb24gc2V0cG9zaXRpb24ob3B0cywgeCwgeSwgem9vbSkge1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKSB7XG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1gnLCB4KTtcblx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWScsIHkpO1xuXHRcdGlmKHpvb20pXG5cdFx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWk9PTScsIHpvb20pO1xuXHR9IGVsc2Uge1xuXHRcdC8vVE9ET1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRwb3NpdGlvbihvcHRzKSB7XG5cdGlmKCFoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpIHx8XG5cdFx0KGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldF9wcmVmaXgob3B0cykrJ19YJykgPT09IG51bGwgJiZcblx0XHQgc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShnZXRfcHJlZml4KG9wdHMpKydfWCcpID09PSBudWxsKSlcblx0XHRyZXR1cm4gW251bGwsIG51bGxdO1xuXHRsZXQgcG9zID0gWyBwYXJzZUludChnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWCcpKSxcblx0XHRcdFx0cGFyc2VJbnQoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1knKSkgXTtcblx0aWYoZ2V0X2Jyb3dzZXJfc3RvcmUoZ2V0X3ByZWZpeChvcHRzKSsnX1pPT00nKSAhPT0gbnVsbClcblx0XHRwb3MucHVzaChwYXJzZUZsb2F0KGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19aT09NJykpKTtcblx0cmV0dXJuIHBvcztcbn1cbiIsIi8vIFBlZGlncmVlIFRyZWUgVXRpbHNcblxuaW1wb3J0IHtzeW5jVHdpbnMsIHJlYnVpbGQsIGFkZGNoaWxkLCBkZWxldGVfbm9kZV9kYXRhc2V0fSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCAqIGFzIHBlZGNhY2hlIGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJRSgpIHtcblx0IGxldCB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG5cdCAvKiBNU0lFIHVzZWQgdG8gZGV0ZWN0IG9sZCBicm93c2VycyBhbmQgVHJpZGVudCB1c2VkIHRvIG5ld2VyIG9uZXMqL1xuXHQgcmV0dXJuIHVhLmluZGV4T2YoXCJNU0lFIFwiKSA+IC0xIHx8IHVhLmluZGV4T2YoXCJUcmlkZW50L1wiKSA+IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFZGdlKCkge1xuXHQgcmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0VkZ2UvZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3B5X2RhdGFzZXQoZGF0YXNldCkge1xuXHRpZihkYXRhc2V0WzBdLmlkKSB7IC8vIHNvcnQgYnkgaWRcblx0XHRkYXRhc2V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gKCFhLmlkIHx8ICFiLmlkID8gMDogKGEuaWQgPiBiLmlkKSA/IDEgOiAoKGIuaWQgPiBhLmlkKSA/IC0xIDogMCkpO30pO1xuXHR9XG5cblx0bGV0IGRpc2FsbG93ZWQgPSBbXCJpZFwiLCBcInBhcmVudF9ub2RlXCJdO1xuXHRsZXQgbmV3ZGF0YXNldCA9IFtdO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKXtcblx0XHRsZXQgb2JqID0ge307XG5cdFx0Zm9yKGxldCBrZXkgaW4gZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoZGlzYWxsb3dlZC5pbmRleE9mKGtleSkgPT0gLTEpXG5cdFx0XHRcdG9ialtrZXldID0gZGF0YXNldFtpXVtrZXldO1xuXHRcdH1cblx0XHRuZXdkYXRhc2V0LnB1c2gob2JqKTtcblx0fVxuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLyoqXG4gKiAgR2V0IGZvcm1hdHRlZCB0aW1lIG9yIGRhdGEgJiB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGb3JtYXR0ZWREYXRlKHRpbWUpe1xuXHRsZXQgZCA9IG5ldyBEYXRlKCk7XG5cdGlmKHRpbWUpXG5cdFx0cmV0dXJuICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIjpcIiArICgnMCcgKyBkLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArIFwiLVwiICsgKCcwJyArIChkLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpICsgXCItXCIgKyAoJzAnICsgZC5nZXREYXRlKCkpLnNsaWNlKC0yKSArIFwiIFwiICsgKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gfVxuXG4vKipcbiAqIFNob3cgbWVzc2FnZSBvciBjb25maXJtYXRpb24gZGlhbG9nLlxuICogQHBhcmFtIHRpdGxlXHQgLSBkaWFsb2cgd2luZG93IHRpdGxlXG4gKiBAcGFyYW0gbXNnXHQgICAtIG1lc3NhZ2UgdG8gZGlhc3BsYXlcbiAqIEBwYXJhbSBvbkNvbmZpcm0gLSBmdW5jdGlvbiB0byBjYWxsIGluIGEgY29uZmlybWF0aW9uIGRpYWxvZ1xuICogQHBhcmFtIG9wdHNcdCAgLSBwZWRpZ3JlZWpzIG9wdGlvbnNcbiAqIEBwYXJhbSBkYXRhc2V0XHQtIHBlZGlncmVlIGRhdGFzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VzKHRpdGxlLCBtc2csIG9uQ29uZmlybSwgb3B0cywgZGF0YXNldCkge1xuXHRpZihvbkNvbmZpcm0pIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHRcdG1vZGFsOiB0cnVlLFxuXHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdHdpZHRoOiAzNTAsXG5cdFx0XHRcdGJ1dHRvbnM6IHtcblx0XHRcdFx0XHRcIlllc1wiOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHRcdG9uQ29uZmlybShvcHRzLCBkYXRhc2V0KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwiTm9cIjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHR3aWR0aDogMzUwLFxuXHRcdFx0YnV0dG9uczogW3tcblx0XHRcdFx0dGV4dDogXCJPS1wiLFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7ICQoIHRoaXMgKS5kaWFsb2coIFwiY2xvc2VcIiApO31cblx0XHRcdH1dXG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhZ2UgYW5kIHlvYiBpcyBjb25zaXN0ZW50IHdpdGggY3VycmVudCB5ZWFyLiBUaGUgc3VtIG9mIGFnZSBhbmRcbiAqIHlvYiBzaG91bGQgbm90IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBjdXJyZW50IHllYXIuIElmIGFsaXZlIHRoZVxuICogYWJzb2x1dGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgYWdlIGFuZCB5ZWFyIG9mIGJpcnRoIGFuZCB0aGVcbiAqIGN1cnJlbnQgeWVhciBzaG91bGQgYmUgPD0gMS5cbiAqIEBwYXJhbSBhZ2VcdC0gYWdlIGluIHllYXJzLlxuICogQHBhcmFtIHlvYlx0LSB5ZWFyIG9mIGJpcnRoLlxuICogQHBhcmFtIHN0YXR1cyAtIDAgPSBhbGl2ZSwgMSA9IGRlYWQuXG4gKiBAcmV0dXJuIHRydWUgaWYgYWdlIGFuZCB5b2IgYXJlIGNvbnNpc3RlbnQgd2l0aCBjdXJyZW50IHllYXIgb3RoZXJ3aXNlIGZhbHNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfYWdlX3lvYihhZ2UsIHlvYiwgc3RhdHVzKSB7XG5cdGxldCB5ZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuXHRsZXQgc3VtID0gcGFyc2VJbnQoYWdlKSArIHBhcnNlSW50KHlvYik7XG5cdGlmKHN0YXR1cyA9PSAxKSB7ICAgLy8gZGVjZWFzZWRcblx0XHRyZXR1cm4geWVhciA+PSBzdW07XG5cdH1cblx0cmV0dXJuIE1hdGguYWJzKHllYXIgLSBzdW0pIDw9IDEgJiYgeWVhciA+PSBzdW07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG5cdHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VpZChsZW4pIHtcblx0bGV0IHRleHQgPSBcIlwiO1xuXHRsZXQgcG9zc2libGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcblx0Zm9yKCBsZXQgaT0wOyBpIDwgbGVuOyBpKysgKVxuXHRcdHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVHJlZShvcHRzLCBwZXJzb24sIHJvb3QsIHBhcnRuZXJMaW5rcywgaWQpIHtcblx0aWYgKHR5cGVvZiBwZXJzb24uY2hpbGRyZW4gPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0cGVyc29uLmNoaWxkcmVuID0gZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBwZXJzb24pO1xuXG5cdGlmICh0eXBlb2YgcGFydG5lckxpbmtzID09PSB0eXBlb2YgdW5kZWZpbmVkKSB7XG5cdFx0cGFydG5lckxpbmtzID0gW107XG5cdFx0aWQgPSAxO1xuXHR9XG5cblx0bGV0IG5vZGVzID0gZmxhdHRlbihyb290KTtcblx0Ly9jb25zb2xlLmxvZygnTkFNRT0nK3BlcnNvbi5uYW1lKycgTk8uIENISUxEUkVOPScrcGVyc29uLmNoaWxkcmVuLmxlbmd0aCk7XG5cdGxldCBwYXJ0bmVycyA9IFtdO1xuXHQkLmVhY2gocGVyc29uLmNoaWxkcmVuLCBmdW5jdGlvbihpLCBjaGlsZCkge1xuXHRcdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGosIHApIHtcblx0XHRcdGlmICgoKGNoaWxkLm5hbWUgPT09IHAubW90aGVyKSB8fCAoY2hpbGQubmFtZSA9PT0gcC5mYXRoZXIpKSAmJiBjaGlsZC5pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGxldCBtID0gZ2V0Tm9kZUJ5TmFtZShub2RlcywgcC5tb3RoZXIpO1xuXHRcdFx0XHRsZXQgZiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHAuZmF0aGVyKTtcblx0XHRcdFx0bSA9IChtICE9PSB1bmRlZmluZWQ/IG0gOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5tb3RoZXIpKTtcblx0XHRcdFx0ZiA9IChmICE9PSB1bmRlZmluZWQ/IGYgOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5mYXRoZXIpKTtcblx0XHRcdFx0aWYoIWNvbnRhaW5zX3BhcmVudChwYXJ0bmVycywgbSwgZikpXG5cdFx0XHRcdFx0cGFydG5lcnMucHVzaCh7J21vdGhlcic6IG0sICdmYXRoZXInOiBmfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXHQkLm1lcmdlKHBhcnRuZXJMaW5rcywgcGFydG5lcnMpO1xuXG5cdCQuZWFjaChwYXJ0bmVycywgZnVuY3Rpb24oaSwgcHRyKSB7XG5cdFx0bGV0IG1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0bGV0IGZhdGhlciA9IHB0ci5mYXRoZXI7XG5cdFx0bW90aGVyLmNoaWxkcmVuID0gW107XG5cdFx0bGV0IHBhcmVudCA9IHtcblx0XHRcdFx0bmFtZSA6IG1ha2VpZCg0KSxcblx0XHRcdFx0aGlkZGVuIDogdHJ1ZSxcblx0XHRcdFx0cGFyZW50IDogbnVsbCxcblx0XHRcdFx0ZmF0aGVyIDogZmF0aGVyLFxuXHRcdFx0XHRtb3RoZXIgOiBtb3RoZXIsXG5cdFx0XHRcdGNoaWxkcmVuIDogZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBtb3RoZXIsIGZhdGhlcilcblx0XHR9O1xuXG5cdFx0bGV0IG1pZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIubmFtZSk7XG5cdFx0bGV0IGZpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0aWYoISgnaWQnIGluIGZhdGhlcikgJiYgISgnaWQnIGluIG1vdGhlcikpXG5cdFx0XHRpZCA9IHNldENoaWxkcmVuSWQocGVyc29uLmNoaWxkcmVuLCBpZCk7XG5cblx0XHQvLyBsb29rIGF0IGdyYW5kcGFyZW50cyBpbmRleFxuXHRcdGxldCBncCA9IGdldF9ncmFuZHBhcmVudHNfaWR4KG9wdHMuZGF0YXNldCwgbWlkeCwgZmlkeCk7XG5cdFx0aWYoZ3AuZmlkeCA8IGdwLm1pZHgpIHtcblx0XHRcdGZhdGhlci5pZCA9IGlkKys7XG5cdFx0XHRwYXJlbnQuaWQgPSBpZCsrO1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHRcdHBhcmVudC5pZCA9IGlkKys7XG5cdFx0XHRmYXRoZXIuaWQgPSBpZCsrO1xuXHRcdH1cblx0XHRpZCA9IHVwZGF0ZVBhcmVudChtb3RoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRpZCA9IHVwZGF0ZVBhcmVudChmYXRoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRwZXJzb24uY2hpbGRyZW4ucHVzaChwYXJlbnQpO1xuXHR9KTtcblx0aWQgPSBzZXRDaGlsZHJlbklkKHBlcnNvbi5jaGlsZHJlbiwgaWQpO1xuXG5cdCQuZWFjaChwZXJzb24uY2hpbGRyZW4sIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZCA9IGJ1aWxkVHJlZShvcHRzLCBwLCByb290LCBwYXJ0bmVyTGlua3MsIGlkKVsxXTtcblx0fSk7XG5cdHJldHVybiBbcGFydG5lckxpbmtzLCBpZF07XG59XG5cbi8vIHVwZGF0ZSBwYXJlbnQgbm9kZSBhbmQgc29ydCB0d2luc1xuZnVuY3Rpb24gdXBkYXRlUGFyZW50KHAsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKSB7XG5cdC8vIGFkZCB0byBwYXJlbnQgbm9kZVxuXHRpZigncGFyZW50X25vZGUnIGluIHApXG5cdFx0cC5wYXJlbnRfbm9kZS5wdXNoKHBhcmVudCk7XG5cdGVsc2Vcblx0XHRwLnBhcmVudF9ub2RlID0gW3BhcmVudF07XG5cblx0Ly8gY2hlY2sgdHdpbnMgbGllIG5leHQgdG8gZWFjaCBvdGhlclxuXHRpZihwLm16dHdpbiB8fCBwLmR6dHdpbnMpIHtcblx0XHRsZXQgdHdpbnMgPSBnZXRUd2lucyhvcHRzLmRhdGFzZXQsIHApO1xuXHRcdGZvcihsZXQgaT0wOyBpPHR3aW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgdHdpbiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHR3aW5zW2ldLm5hbWUpO1xuXHRcdFx0aWYodHdpbilcblx0XHRcdFx0dHdpbi5pZCA9IGlkKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBpZDtcbn1cblxuZnVuY3Rpb24gc2V0Q2hpbGRyZW5JZChjaGlsZHJlbiwgaWQpIHtcblx0Ly8gc29ydCB0d2lucyB0byBsaWUgbmV4dCB0byBlYWNoIG90aGVyXG5cdGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHRcdGlmKGEubXp0d2luICYmIGIubXp0d2luICYmIGEubXp0d2luID09IGIubXp0d2luKVxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0ZWxzZSBpZihhLmR6dHdpbiAmJiBiLmR6dHdpbiAmJiBhLmR6dHdpbiA9PSBiLmR6dHdpbilcblx0XHRcdHJldHVybiAwO1xuXHRcdGVsc2UgaWYoYS5tenR3aW4gfHwgYi5tenR3aW4gfHwgYS5kenR3aW4gfHwgYi5kenR3aW4pXG5cdFx0XHRyZXR1cm4gMTtcblx0XHRyZXR1cm4gMDtcblx0fSk7XG5cblx0JC5lYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYocC5pZCA9PT0gdW5kZWZpbmVkKSBwLmlkID0gaWQrKztcblx0fSk7XG5cdHJldHVybiBpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvYmFuZChvYmopIHtcblx0cmV0dXJuIHR5cGVvZiAkKG9iaikuYXR0cigncHJvYmFuZCcpICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmICQob2JqKS5hdHRyKCdwcm9iYW5kJykgIT09IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJvYmFuZChkYXRhc2V0LCBuYW1lLCBpc19wcm9iYW5kKSB7XG5cdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYgKG5hbWUgPT09IHAubmFtZSlcblx0XHRcdHAucHJvYmFuZCA9IGlzX3Byb2JhbmQ7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHAucHJvYmFuZDtcblx0fSk7XG59XG5cbi8vY29tYmluZSBhcnJheXMgaWdub3JpbmcgZHVwbGljYXRlc1xuZnVuY3Rpb24gY29tYmluZUFycmF5cyhhcnIxLCBhcnIyKSB7XG5cdGZvcihsZXQgaT0wOyBpPGFycjIubGVuZ3RoOyBpKyspXG5cdFx0aWYoJC5pbkFycmF5KCBhcnIyW2ldLCBhcnIxICkgPT0gLTEpIGFycjEucHVzaChhcnIyW2ldKTtcbn1cblxuZnVuY3Rpb24gaW5jbHVkZV9jaGlsZHJlbihjb25uZWN0ZWQsIHAsIGRhdGFzZXQpIHtcblx0aWYoJC5pbkFycmF5KCBwLm5hbWUsIGNvbm5lY3RlZCApID09IC0xKVxuXHRcdHJldHVybjtcblx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBwKSk7XG5cdGxldCBjaGlsZHJlbiA9IGdldEFsbENoaWxkcmVuKGRhdGFzZXQsIHApO1xuXHQkLmVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKCBjaGlsZF9pZHgsIGNoaWxkICkge1xuXHRcdGlmKCQuaW5BcnJheSggY2hpbGQubmFtZSwgY29ubmVjdGVkICkgPT0gLTEpIHtcblx0XHRcdGNvbm5lY3RlZC5wdXNoKGNoaWxkLm5hbWUpO1xuXHRcdFx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCkpO1xuXHRcdH1cblx0fSk7XG59XG5cbi8vZ2V0IHRoZSBwYXJ0bmVycyBmb3IgYSBnaXZlbiBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIGFub2RlKSB7XG5cdGxldCBwdHJzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgYm5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGFub2RlLm5hbWUgPT09IGJub2RlLm1vdGhlciAmJiAkLmluQXJyYXkoYm5vZGUuZmF0aGVyLCBwdHJzKSA9PSAtMSlcblx0XHRcdHB0cnMucHVzaChibm9kZS5mYXRoZXIpO1xuXHRcdGVsc2UgaWYoYW5vZGUubmFtZSA9PT0gYm5vZGUuZmF0aGVyICYmICQuaW5BcnJheShibm9kZS5tb3RoZXIsIHB0cnMpID09IC0xKVxuXHRcdFx0cHRycy5wdXNoKGJub2RlLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHB0cnM7XG59XG5cbi8vcmV0dXJuIGEgbGlzdCBvZiBpbmRpdmlkdWFscyB0aGF0IGFyZW4ndCBjb25uZWN0ZWQgdG8gdGhlIHRhcmdldFxuZXhwb3J0IGZ1bmN0aW9uIHVuY29ubmVjdGVkKGRhdGFzZXQpe1xuXHRsZXQgdGFyZ2V0ID0gZGF0YXNldFsgZ2V0UHJvYmFuZEluZGV4KGRhdGFzZXQpIF07XG5cdGlmKCF0YXJnZXQpe1xuXHRcdGNvbnNvbGUud2FybihcIk5vIHRhcmdldCBkZWZpbmVkXCIpO1xuXHRcdGlmKGRhdGFzZXQubGVuZ3RoID09IDApIHtcblx0XHRcdHRocm93IFwiZW1wdHkgcGVkaWdyZWUgZGF0YSBzZXRcIjtcblx0XHR9XG5cdFx0dGFyZ2V0ID0gZGF0YXNldFswXTtcblx0fVxuXHRsZXQgY29ubmVjdGVkID0gW3RhcmdldC5uYW1lXTtcblx0bGV0IGNoYW5nZSA9IHRydWU7XG5cdGxldCBpaSA9IDA7XG5cdHdoaWxlKGNoYW5nZSAmJiBpaSA8IDIwMCkge1xuXHRcdGlpKys7XG5cdFx0bGV0IG5jb25uZWN0ID0gY29ubmVjdGVkLmxlbmd0aDtcblx0XHQkLmVhY2goZGF0YXNldCwgZnVuY3Rpb24oIGlkeCwgcCApIHtcblx0XHRcdGlmKCQuaW5BcnJheSggcC5uYW1lLCBjb25uZWN0ZWQgKSAhPSAtMSkge1xuXHRcdFx0XHQvLyBjaGVjayBpZiB0aGlzIHBlcnNvbiBvciBhIHBhcnRuZXIgaGFzIGEgcGFyZW50XG5cdFx0XHRcdGxldCBwdHJzID0gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIHApO1xuXHRcdFx0XHRsZXQgaGFzX3BhcmVudCA9IChwLm5hbWUgPT09IHRhcmdldC5uYW1lIHx8ICFwLm5vcGFyZW50cyk7XG5cdFx0XHRcdGZvcihsZXQgaT0wOyBpPHB0cnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdGlmKCFnZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbaV0pLm5vcGFyZW50cylcblx0XHRcdFx0XHRcdGhhc19wYXJlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoaGFzX3BhcmVudCl7XG5cdFx0XHRcdFx0aWYocC5tb3RoZXIgJiYgJC5pbkFycmF5KCBwLm1vdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLm1vdGhlcik7XG5cdFx0XHRcdFx0aWYocC5mYXRoZXIgJiYgJC5pbkFycmF5KCBwLmZhdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLmZhdGhlcik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiggIXAubm9wYXJlbnRzICYmXG5cdFx0XHRcdFx0ICAoKHAubW90aGVyICYmICQuaW5BcnJheSggcC5tb3RoZXIsIGNvbm5lY3RlZCApICE9IC0xKSB8fFxuXHRcdFx0XHRcdCAgIChwLmZhdGhlciAmJiAkLmluQXJyYXkoIHAuZmF0aGVyLCBjb25uZWN0ZWQgKSAhPSAtMSkpKXtcblx0XHRcdFx0Y29ubmVjdGVkLnB1c2gocC5uYW1lKTtcblx0XHRcdH1cblx0XHRcdC8vIGluY2x1ZGUgYW55IGNoaWxkcmVuXG5cdFx0XHRpbmNsdWRlX2NoaWxkcmVuKGNvbm5lY3RlZCwgcCwgZGF0YXNldCk7XG5cdFx0fSk7XG5cdFx0Y2hhbmdlID0gKG5jb25uZWN0ICE9IGNvbm5lY3RlZC5sZW5ndGgpO1xuXHR9XG5cdGxldCBuYW1lcyA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwubmFtZTt9KTtcblx0cmV0dXJuICQubWFwKG5hbWVzLCBmdW5jdGlvbihuYW1lLCBfaSl7cmV0dXJuICQuaW5BcnJheShuYW1lLCBjb25uZWN0ZWQpID09IC0xID8gbmFtZSA6IG51bGw7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9iYW5kSW5kZXgoZGF0YXNldCkge1xuXHRsZXQgcHJvYmFuZDtcblx0JC5lYWNoKGRhdGFzZXQsIGZ1bmN0aW9uKGksIHZhbCkge1xuXHRcdGlmIChpc1Byb2JhbmQodmFsKSkge1xuXHRcdFx0cHJvYmFuZCA9IGk7XG5cdFx0XHRyZXR1cm4gcHJvYmFuZDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gcHJvYmFuZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkcmVuKGRhdGFzZXQsIG1vdGhlciwgZmF0aGVyKSB7XG5cdGxldCBjaGlsZHJlbiA9IFtdO1xuXHRsZXQgbmFtZXMgPSBbXTtcblx0aWYobW90aGVyLnNleCA9PT0gJ0YnKVxuXHRcdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihtb3RoZXIubmFtZSA9PT0gcC5tb3RoZXIpXG5cdFx0XHRcdGlmKCFmYXRoZXIgfHwgZmF0aGVyLm5hbWUgPT0gcC5mYXRoZXIpIHtcblx0XHRcdFx0XHRpZigkLmluQXJyYXkocC5uYW1lLCBuYW1lcykgPT09IC0xKXtcblx0XHRcdFx0XHRcdGNoaWxkcmVuLnB1c2gocCk7XG5cdFx0XHRcdFx0XHRuYW1lcy5wdXNoKHAubmFtZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBjaGlsZHJlbjtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNfcGFyZW50KGFyciwgbSwgZikge1xuXHRmb3IobGV0IGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspXG5cdFx0aWYoYXJyW2ldLm1vdGhlciA9PT0gbSAmJiBhcnJbaV0uZmF0aGVyID09PSBmKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gZ2V0IHRoZSBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWwgLSBzZXggaXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyXG4vLyBmb3Igb25seSByZXR1cm5pbmcgYnJvdGhlcnMgb3Igc2lzdGVyc1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbiwgc2V4KSB7XG5cdGlmKHBlcnNvbiA9PT0gdW5kZWZpbmVkIHx8ICFwZXJzb24ubW90aGVyIHx8IHBlcnNvbi5ub3BhcmVudHMpXG5cdFx0cmV0dXJuIFtdO1xuXG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgcC5tb3RoZXIgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09IHNleCkgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgc2libGluZ3MgKyBhZG9wdGVkIHNpYmxpbmdzXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgcGVyc29uLCBzZXgpIHtcblx0cmV0dXJuICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gIHAubmFtZSAhPT0gcGVyc29uLm5hbWUgJiYgISgnbm9wYXJlbnRzJyBpbiBwKSAmJiBwLm1vdGhlciAmJlxuXHRcdFx0ICAgKHAubW90aGVyID09PSBwZXJzb24ubW90aGVyICYmIHAuZmF0aGVyID09PSBwZXJzb24uZmF0aGVyKSAmJlxuXHRcdFx0ICAgKCFzZXggfHwgcC5zZXggPT0gc2V4KSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuLy8gZ2V0IHRoZSBtb25vL2RpLXp5Z290aWMgdHdpbihzKVxuZXhwb3J0IGZ1bmN0aW9uIGdldFR3aW5zKGRhdGFzZXQsIHBlcnNvbikge1xuXHRsZXQgc2licyA9IGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbik7XG5cdGxldCB0d2luX3R5cGUgPSAocGVyc29uLm16dHdpbiA/IFwibXp0d2luXCIgOiBcImR6dHdpblwiKTtcblx0cmV0dXJuICQubWFwKHNpYnMsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gcC5uYW1lICE9PSBwZXJzb24ubmFtZSAmJiBwW3R3aW5fdHlwZV0gPT0gcGVyc29uW3R3aW5fdHlwZV0gPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgYWRvcHRlZCBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWxcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZG9wdGVkU2libGluZ3MoZGF0YXNldCwgcGVyc29uKSB7XG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICdub3BhcmVudHMnIGluIHAgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxDaGlsZHJlbihkYXRhc2V0LCBwZXJzb24sIHNleCkge1xuXHRyZXR1cm4gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe1xuXHRcdHJldHVybiAhKCdub3BhcmVudHMnIGluIHApICYmXG5cdFx0XHQgICAocC5tb3RoZXIgPT09IHBlcnNvbi5uYW1lIHx8IHAuZmF0aGVyID09PSBwZXJzb24ubmFtZSkgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09PSBzZXgpID8gcCA6IG51bGw7XG5cdH0pO1xufVxuXG4vLyBnZXQgdGhlIGRlcHRoIG9mIHRoZSBnaXZlbiBwZXJzb24gZnJvbSB0aGUgcm9vdFxuZXhwb3J0IGZ1bmN0aW9uIGdldERlcHRoKGRhdGFzZXQsIG5hbWUpIHtcblx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGRlcHRoID0gMTtcblxuXHR3aGlsZShpZHggPj0gMCAmJiAoJ21vdGhlcicgaW4gZGF0YXNldFtpZHhdIHx8IGRhdGFzZXRbaWR4XS50b3BfbGV2ZWwpKXtcblx0XHRpZHggPSBnZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLm1vdGhlcik7XG5cdFx0ZGVwdGgrKztcblx0fVxuXHRyZXR1cm4gZGVwdGg7XG59XG5cbi8vIGdpdmVuIGFuIGFycmF5IG9mIHBlb3BsZSBnZXQgYW4gaW5kZXggZm9yIGEgZ2l2ZW4gcGVyc29uXG5leHBvcnQgZnVuY3Rpb24gZ2V0SWR4QnlOYW1lKGFyciwgbmFtZSkge1xuXHRsZXQgaWR4ID0gLTE7XG5cdCQuZWFjaChhcnIsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZiAobmFtZSA9PT0gcC5uYW1lKSB7XG5cdFx0XHRpZHggPSBpO1xuXHRcdFx0cmV0dXJuIGlkeDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gaWR4O1xufVxuXG4vLyBnZXQgdGhlIG5vZGVzIGF0IGEgZ2l2ZW4gZGVwdGggc29ydGVkIGJ5IHRoZWlyIHggcG9zaXRpb25cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2Rlc0F0RGVwdGgoZm5vZGVzLCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRyZXR1cm4gJC5tYXAoZm5vZGVzLCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuIHAuZGVwdGggPT0gZGVwdGggJiYgIXAuZGF0YS5oaWRkZW4gJiYgJC5pbkFycmF5KHAuZGF0YS5uYW1lLCBleGNsdWRlX25hbWVzKSA9PSAtMSA/IHAgOiBudWxsO1xuXHR9KS5zb3J0KGZ1bmN0aW9uIChhLGIpIHtyZXR1cm4gYS54IC0gYi54O30pO1xufVxuXG4vLyBjb252ZXJ0IHRoZSBwYXJ0bmVyIG5hbWVzIGludG8gY29ycmVzcG9uZGluZyB0cmVlIG5vZGVzXG5leHBvcnQgZnVuY3Rpb24gbGlua05vZGVzKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnMpIHtcblx0bGV0IGxpbmtzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPCBwYXJ0bmVycy5sZW5ndGg7IGkrKylcblx0XHRsaW5rcy5wdXNoKHsnbW90aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLm1vdGhlci5uYW1lKSxcblx0XHRcdFx0XHQnZmF0aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLmZhdGhlci5uYW1lKX0pO1xuXHRyZXR1cm4gbGlua3M7XG59XG5cbi8vIGdldCBhbmNlc3RvcnMgb2YgYSBub2RlXG5leHBvcnQgZnVuY3Rpb24gYW5jZXN0b3JzKGRhdGFzZXQsIG5vZGUpIHtcblx0bGV0IGFuY2VzdG9ycyA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmRhdGEpIG5vZGUgPSBub2RlLmRhdGE7XG5cdFx0aWYoJ21vdGhlcicgaW4gbm9kZSAmJiAnZmF0aGVyJyBpbiBub2RlICYmICEoJ25vcGFyZW50cycgaW4gbm9kZSkpe1xuXHRcdFx0cmVjdXJzZShnZXROb2RlQnlOYW1lKGRhdGFzZXQsIG5vZGUubW90aGVyKSk7XG5cdFx0XHRyZWN1cnNlKGdldE5vZGVCeU5hbWUoZGF0YXNldCwgbm9kZS5mYXRoZXIpKTtcblx0XHR9XG5cdFx0YW5jZXN0b3JzLnB1c2gobm9kZSk7XG5cdH1cblx0cmVjdXJzZShub2RlKTtcblx0cmV0dXJuIGFuY2VzdG9ycztcbn1cblxuLy8gdGVzdCBpZiB0d28gbm9kZXMgYXJlIGNvbnNhbmd1aW5vdXMgcGFydG5lcnNcbmV4cG9ydCBmdW5jdGlvbiBjb25zYW5ndWl0eShub2RlMSwgbm9kZTIsIG9wdHMpIHtcblx0aWYobm9kZTEuZGVwdGggIT09IG5vZGUyLmRlcHRoKSAvLyBwYXJlbnRzIGF0IGRpZmZlcmVudCBkZXB0aHNcblx0XHRyZXR1cm4gdHJ1ZTtcblx0bGV0IGFuY2VzdG9yczEgPSBhbmNlc3RvcnMob3B0cy5kYXRhc2V0LCBub2RlMSk7XG5cdGxldCBhbmNlc3RvcnMyID0gYW5jZXN0b3JzKG9wdHMuZGF0YXNldCwgbm9kZTIpO1xuXHRsZXQgbmFtZXMxID0gJC5tYXAoYW5jZXN0b3JzMSwgZnVuY3Rpb24oYW5jZXN0b3IsIF9pKXtyZXR1cm4gYW5jZXN0b3IubmFtZTt9KTtcblx0bGV0IG5hbWVzMiA9ICQubWFwKGFuY2VzdG9yczIsIGZ1bmN0aW9uKGFuY2VzdG9yLCBfaSl7cmV0dXJuIGFuY2VzdG9yLm5hbWU7fSk7XG5cdGxldCBjb25zYW5ndWl0eSA9IGZhbHNlO1xuXHQkLmVhY2gobmFtZXMxLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XG5cdFx0aWYoJC5pbkFycmF5KG5hbWUsIG5hbWVzMikgIT09IC0xKXtcblx0XHRcdGNvbnNhbmd1aXR5ID0gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gY29uc2FuZ3VpdHk7XG59XG5cbi8vIHJldHVybiBhIGZsYXR0ZW5lZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJlZVxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4ocm9vdCkge1xuXHRsZXQgZmxhdCA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmNoaWxkcmVuKVxuXHRcdFx0bm9kZS5jaGlsZHJlbi5mb3JFYWNoKHJlY3Vyc2UpO1xuXHRcdGZsYXQucHVzaChub2RlKTtcblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZXR1cm4gZmxhdDtcbn1cblxuLy8gQWRqdXN0IEQzIGxheW91dCBwb3NpdGlvbmluZy5cbi8vIFBvc2l0aW9uIGhpZGRlbiBwYXJlbnQgbm9kZSBjZW50cmluZyB0aGVtIGJldHdlZW4gZmF0aGVyIGFuZCBtb3RoZXIgbm9kZXMuIFJlbW92ZSBraW5rc1xuLy8gZnJvbSBsaW5rcyAtIGUuZy4gd2hlcmUgdGhlcmUgaXMgYSBzaW5nbGUgY2hpbGQgcGx1cyBhIGhpZGRlbiBjaGlsZFxuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdF9jb29yZHMob3B0cywgcm9vdCwgZmxhdHRlbk5vZGVzKSB7XG5cdGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuXHRcdGlmIChub2RlLmNoaWxkcmVuKSB7XG5cdFx0XHRub2RlLmNoaWxkcmVuLmZvckVhY2gocmVjdXJzZSk7XG5cblx0XHRcdGlmKG5vZGUuZGF0YS5mYXRoZXIgIT09IHVuZGVmaW5lZCkgeyBcdC8vIGhpZGRlbiBub2Rlc1xuXHRcdFx0XHRsZXQgZmF0aGVyID0gZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIG5vZGUuZGF0YS5mYXRoZXIubmFtZSk7XG5cdFx0XHRcdGxldCBtb3RoZXIgPSBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2Rlcywgbm9kZS5kYXRhLm1vdGhlci5uYW1lKTtcblx0XHRcdFx0bGV0IHhtaWQgPSAoZmF0aGVyLnggKyBtb3RoZXIueCkgLzI7XG5cdFx0XHRcdGlmKCFvdmVybGFwKG9wdHMsIHJvb3QuZGVzY2VuZGFudHMoKSwgeG1pZCwgbm9kZS5kZXB0aCwgW25vZGUuZGF0YS5uYW1lXSkpIHtcblx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzXG5cdFx0XHRcdFx0bGV0IGRpZmYgPSBub2RlLnggLSB4bWlkO1xuXHRcdFx0XHRcdGlmKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDIgJiYgKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gfHwgbm9kZS5jaGlsZHJlblsxXS5kYXRhLmhpZGRlbikpIHtcblx0XHRcdFx0XHRcdGlmKCEobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiAmJiBub2RlLmNoaWxkcmVuWzFdLmRhdGEuaGlkZGVuKSkge1xuXHRcdFx0XHRcdFx0XHRsZXQgY2hpbGQxID0gKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gPyBub2RlLmNoaWxkcmVuWzFdIDogbm9kZS5jaGlsZHJlblswXSk7XG5cdFx0XHRcdFx0XHRcdGxldCBjaGlsZDIgPSAobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiA/IG5vZGUuY2hpbGRyZW5bMF0gOiBub2RlLmNoaWxkcmVuWzFdKTtcblx0XHRcdFx0XHRcdFx0aWYoICgoY2hpbGQxLnggPCBjaGlsZDIueCAmJiB4bWlkIDwgY2hpbGQyLngpIHx8IChjaGlsZDEueCA+IGNoaWxkMi54ICYmIHhtaWQgPiBjaGlsZDIueCkpICYmXG5cdFx0XHRcdFx0XHRcdFx0IW92ZXJsYXAob3B0cywgcm9vdC5kZXNjZW5kYW50cygpLCB4bWlkLCBjaGlsZDEuZGVwdGgsIFtjaGlsZDEuZGF0YS5uYW1lXSkpe1xuXHRcdFx0XHRcdFx0XHRcdGNoaWxkMS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxICYmICFub2RlLmNoaWxkcmVuWzBdLmRhdGEuaGlkZGVuKSB7XG5cdFx0XHRcdFx0XHRpZighb3ZlcmxhcChvcHRzLCByb290LmRlc2NlbmRhbnRzKCksIHhtaWQsIG5vZGUuY2hpbGRyZW5bMF0uZGVwdGgsIFtub2RlLmNoaWxkcmVuWzBdLmRhdGEubmFtZV0pKVxuXHRcdFx0XHRcdFx0XHRub2RlLmNoaWxkcmVuWzBdLnggPSB4bWlkO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZihkaWZmICE9PSAwICYmICFub2Rlc092ZXJsYXAob3B0cywgbm9kZSwgZGlmZiwgcm9vdCkpe1xuXHRcdFx0XHRcdFx0XHRpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0bm9kZS5jaGlsZHJlblswXS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZGVzY2VuZGFudHMgPSBub2RlLmRlc2NlbmRhbnRzKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdBREpVU1RJTkcgJytub2RlLmRhdGEubmFtZSsnIE5PLiBERVNDRU5EQU5UUyAnK2Rlc2NlbmRhbnRzLmxlbmd0aCsnIGRpZmY9JytkaWZmKTtcblx0XHRcdFx0XHRcdFx0XHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYobm9kZS5kYXRhLm5hbWUgIT09IGRlc2NlbmRhbnRzW2ldLmRhdGEubmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVzY2VuZGFudHNbaV0ueCAtPSBkaWZmO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmKChub2RlLnggPCBmYXRoZXIueCAmJiBub2RlLnggPCBtb3RoZXIueCkgfHwgKG5vZGUueCA+IGZhdGhlci54ICYmIG5vZGUueCA+IG1vdGhlci54KSl7XG5cdFx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzIGlmIGl0IGRvZXNuJ3QgbGllIGJldHdlZW4gbW90aGVyIGFuZCBmYXRoZXJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZWN1cnNlKHJvb3QpO1xufVxuXG4vLyB0ZXN0IGlmIG1vdmluZyBzaWJsaW5ncyBieSBkaWZmIG92ZXJsYXBzIHdpdGggb3RoZXIgbm9kZXNcbmZ1bmN0aW9uIG5vZGVzT3ZlcmxhcChvcHRzLCBub2RlLCBkaWZmLCByb290KSB7XG5cdGxldCBkZXNjZW5kYW50cyA9IG5vZGUuZGVzY2VuZGFudHMoKTtcblx0bGV0IGRlc2NlbmRhbnRzTmFtZXMgPSAkLm1hcChkZXNjZW5kYW50cywgZnVuY3Rpb24oZGVzY2VuZGFudCwgX2kpe3JldHVybiBkZXNjZW5kYW50LmRhdGEubmFtZTt9KTtcblx0bGV0IG5vZGVzID0gcm9vdC5kZXNjZW5kYW50cygpO1xuXHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKyl7XG5cdFx0bGV0IGRlc2NlbmRhbnQgPSBkZXNjZW5kYW50c1tpXTtcblx0XHRpZihub2RlLmRhdGEubmFtZSAhPT0gZGVzY2VuZGFudC5kYXRhLm5hbWUpe1xuXHRcdFx0bGV0IHhuZXcgPSBkZXNjZW5kYW50LnggLSBkaWZmO1xuXHRcdFx0aWYob3ZlcmxhcChvcHRzLCBub2RlcywgeG5ldywgZGVzY2VuZGFudC5kZXB0aCwgZGVzY2VuZGFudHNOYW1lcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8vIHRlc3QgaWYgeCBwb3NpdGlvbiBvdmVybGFwcyBhIG5vZGUgYXQgdGhlIHNhbWUgZGVwdGhcbmV4cG9ydCBmdW5jdGlvbiBvdmVybGFwKG9wdHMsIG5vZGVzLCB4bmV3LCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRmb3IobGV0IG49MDsgbjxub2Rlcy5sZW5ndGg7IG4rKykge1xuXHRcdGlmKGRlcHRoID09IG5vZGVzW25dLmRlcHRoICYmICQuaW5BcnJheShub2Rlc1tuXS5kYXRhLm5hbWUsIGV4Y2x1ZGVfbmFtZXMpID09IC0xKXtcblx0XHRcdGlmKE1hdGguYWJzKHhuZXcgLSBub2Rlc1tuXS54KSA8IChvcHRzLnN5bWJvbF9zaXplKjEuMTUpKVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vLyBnaXZlbiBhIHBlcnNvbnMgbmFtZSByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgZDMgdHJlZSBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUJ5TmFtZShub2RlcywgbmFtZSkge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYobm9kZXNbaV0uZGF0YSAmJiBuYW1lID09PSBub2Rlc1tpXS5kYXRhLm5hbWUpXG5cdFx0XHRyZXR1cm4gbm9kZXNbaV07XG5cdFx0ZWxzZSBpZiAobmFtZSA9PT0gbm9kZXNbaV0ubmFtZSlcblx0XHRcdHJldHVybiBub2Rlc1tpXTtcblx0fVxufVxuXG4vLyBnaXZlbiB0aGUgbmFtZSBvZiBhIHVybCBwYXJhbSBnZXQgdGhlIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gdXJsUGFyYW0obmFtZSl7XG5cdGxldCByZXN1bHRzID0gbmV3IFJlZ0V4cCgnWz8mXScgKyBuYW1lICsgJz0oW14mI10qKScpLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRpZiAocmVzdWx0cz09PW51bGwpXG5cdCAgIHJldHVybiBudWxsO1xuXHRlbHNlXG5cdCAgIHJldHVybiByZXN1bHRzWzFdIHx8IDA7XG59XG5cbi8vIGdldCBncmFuZHBhcmVudHMgaW5kZXhcbmV4cG9ydCBmdW5jdGlvbiBnZXRfZ3JhbmRwYXJlbnRzX2lkeChkYXRhc2V0LCBtaWR4LCBmaWR4KSB7XG5cdGxldCBnbWlkeCA9IG1pZHg7XG5cdGxldCBnZmlkeCA9IGZpZHg7XG5cdHdoaWxlKCAgJ21vdGhlcicgaW4gZGF0YXNldFtnbWlkeF0gJiYgJ21vdGhlcicgaW4gZGF0YXNldFtnZmlkeF0gJiZcblx0XHQgICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnbWlkeF0pICYmICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnZmlkeF0pKXtcblx0XHRnbWlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2dtaWR4XS5tb3RoZXIpO1xuXHRcdGdmaWR4ID0gZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbZ2ZpZHhdLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHsnbWlkeCc6IGdtaWR4LCAnZmlkeCc6IGdmaWR4fTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBwcm9iYW5kIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSB0aGUgcHJvYmFuZC5cbi8vICdrZXknIGNhbiBiZSBhIGxpc3Qgb2Yga2V5cyBvciBhIHNpbmdsZSBrZXkuXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hdHRyKG9wdHMsIGtleXMsIHZhbHVlKXtcblx0bGV0IHByb2JhbmQgPSBvcHRzLmRhdGFzZXRbIGdldFByb2JhbmRJbmRleChvcHRzLmRhdGFzZXQpIF07XG5cdG5vZGVfYXR0cihvcHRzLCBwcm9iYW5kLm5hbWUsIGtleXMsIHZhbHVlKTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBub2RlIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQuXG4vLyAna2V5JyBjYW4gYmUgYSBsaXN0IG9mIGtleXMgb3IgYSBzaW5nbGUga2V5LlxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVfYXR0cihvcHRzLCBuYW1lLCBrZXlzLCB2YWx1ZSl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUobmV3ZGF0YXNldCwgbmFtZSk7XG5cdGlmKCFub2RlKXtcblx0XHRjb25zb2xlLndhcm4oXCJObyBwZXJzb24gZGVmaW5lZFwiKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZighJC5pc0FycmF5KGtleXMpKSB7XG5cdFx0a2V5cyA9IFtrZXlzXTtcblx0fVxuXG5cdGlmKHZhbHVlKSB7XG5cdFx0Zm9yKGxldCBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGsgPSBrZXlzW2ldO1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnVkFMVUUgUFJPVklERUQnLCBrLCB2YWx1ZSwgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlICYmIGtleXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdGlmKG5vZGVba10gPT09IHZhbHVlKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0ICAgaWYoSlNPTi5zdHJpbmdpZnkobm9kZVtrXSkgPT09IEpTT04uc3RyaW5naWZ5KHZhbHVlKSlcblx0XHRcdFx0XHQgICByZXR1cm47XG5cdFx0XHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRcdFx0Ly8gY29udGludWUgcmVnYXJkbGVzcyBvZiBlcnJvclxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRub2RlW2tdID0gdmFsdWU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBmb3VuZCA9IGZhbHNlO1xuXHRcdGZvcihsZXQgaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBrID0ga2V5c1tpXTtcblx0XHRcdC8vY29uc29sZS5sb2coJ05PIFZBTFVFIFBST1ZJREVEJywgaywgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlKSB7XG5cdFx0XHRcdGRlbGV0ZSBub2RlW2tdO1xuXHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCFmb3VuZClcblx0XHRcdHJldHVybjtcblx0fVxuXHRzeW5jVHdpbnMobmV3ZGF0YXNldCwgbm9kZSk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbi8vIGFkZCBhIGNoaWxkIHRvIHRoZSBwcm9iYW5kOyBnaXZlYiBzZXgsIGFnZSwgeW9iIGFuZCBicmVhc3RmZWVkaW5nIG1vbnRocyAob3B0aW9uYWwpXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hZGRfY2hpbGQob3B0cywgc2V4LCBhZ2UsIHlvYiwgYnJlYXN0ZmVlZGluZyl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgcHJvYmFuZCA9IG5ld2RhdGFzZXRbIGdldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KSBdO1xuXHRpZighcHJvYmFuZCl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gcHJvYmFuZCBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgbmV3Y2hpbGQgPSBhZGRjaGlsZChuZXdkYXRhc2V0LCBwcm9iYW5kLCBzZXgsIDEpWzBdO1xuXHRuZXdjaGlsZC5hZ2UgPSBhZ2U7XG5cdG5ld2NoaWxkLnlvYiA9IHlvYjtcblx0aWYoYnJlYXN0ZmVlZGluZyAhPT0gdW5kZWZpbmVkKVxuXHRcdG5ld2NoaWxkLmJyZWFzdGZlZWRpbmcgPSBicmVhc3RmZWVkaW5nO1xuXHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRyZWJ1aWxkKG9wdHMpO1xuXHRyZXR1cm4gbmV3Y2hpbGQubmFtZTtcbn1cblxuLy8gZGVsZXRlIG5vZGUgdXNpbmcgdGhlIG5hbWVcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVfbm9kZV9ieV9uYW1lKG9wdHMsIG5hbWUpe1xuXHRmdW5jdGlvbiBvbkRvbmUob3B0cywgZGF0YXNldCkge1xuXHRcdC8vIGFzc2lnbiBuZXcgZGF0YXNldCBhbmQgcmVidWlsZCBwZWRpZ3JlZVxuXHRcdG9wdHMuZGF0YXNldCA9IGRhdGFzZXQ7XG5cdFx0cmVidWlsZChvcHRzKTtcblx0fVxuXHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZS5jdXJyZW50KG9wdHMpKTtcblx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlLmN1cnJlbnQob3B0cyksIG5hbWUpO1xuXHRpZighbm9kZSl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gbm9kZSBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRkZWxldGVfbm9kZV9kYXRhc2V0KG5ld2RhdGFzZXQsIG5vZGUsIG9wdHMsIG9uRG9uZSk7XG59XG5cbi8vIGNoZWNrIGJ5IG5hbWUgaWYgdGhlIGluZGl2aWR1YWwgZXhpc3RzXG5leHBvcnQgZnVuY3Rpb24gZXhpc3RzKG9wdHMsIG5hbWUpe1xuXHRyZXR1cm4gZ2V0Tm9kZUJ5TmFtZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBuYW1lKSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBwcmludCBvcHRpb25zIGFuZCBkYXRhc2V0XG5leHBvcnQgZnVuY3Rpb24gcHJpbnRfb3B0cyhvcHRzKXtcblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLnJlbW92ZSgpO1xuXHQkKFwiYm9keVwiKS5hcHBlbmQoXCI8ZGl2IGlkPSdwZWRpZ3JlZV9kYXRhJz48L2Rpdj5cIiApO1xuXHRsZXQga2V5O1xuXHRmb3IobGV0IGk9MDsgaTxvcHRzLmRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGVyc29uID0gXCI8ZGl2IGNsYXNzPSdyb3cnPjxzdHJvbmcgY2xhc3M9J2NvbC1tZC0xIHRleHQtcmlnaHQnPlwiK29wdHMuZGF0YXNldFtpXS5uYW1lK1wiPC9zdHJvbmc+PGRpdiBjbGFzcz0nY29sLW1kLTExJz5cIjtcblx0XHRmb3Ioa2V5IGluIG9wdHMuZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoa2V5ID09PSAnbmFtZScpIGNvbnRpbnVlO1xuXHRcdFx0aWYoa2V5ID09PSAncGFyZW50Jylcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHRlbHNlIGlmIChrZXkgPT09ICdjaGlsZHJlbicpIHtcblx0XHRcdFx0aWYgKG9wdHMuZGF0YXNldFtpXVtrZXldWzBdICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XVswXS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHR9IGVsc2Vcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XStcIjsgPC9zcGFuPlwiO1xuXHRcdH1cblx0XHQkKFwiI3BlZGlncmVlX2RhdGFcIikuYXBwZW5kKHBlcnNvbiArIFwiPC9kaXY+PC9kaXY+XCIpO1xuXG5cdH1cblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLmFwcGVuZChcIjxiciAvPjxiciAvPlwiKTtcblx0Zm9yKGtleSBpbiBvcHRzKSB7XG5cdFx0aWYoa2V5ID09PSAnZGF0YXNldCcpIGNvbnRpbnVlO1xuXHRcdCQoXCIjcGVkaWdyZWVfZGF0YVwiKS5hcHBlbmQoXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHNba2V5XStcIjsgPC9zcGFuPlwiKTtcblx0fVxufVxuIiwiLy8gdW5kbywgcmVkbywgcmVzZXQgYnV0dG9uc1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge3JlYnVpbGQsIGJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Y29weV9kYXRhc2V0LCBnZXRQcm9iYW5kSW5kZXh9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdGlvbnMpIHtcblx0bGV0IG9wdHMgPSAkLmV4dGVuZCh7XG4gICAgICAgIC8vIGRlZmF1bHRzXG5cdFx0YnRuX3RhcmdldDogJ3BlZGlncmVlX2hpc3RvcnknXG4gICAgfSwgb3B0aW9ucyApO1xuXG5cdGxldCBidG5zID0gW3tcImZhXCI6IFwiZmEtdW5kb1wiLCBcInRpdGxlXCI6IFwidW5kb1wifSxcblx0XHRcdFx0e1wiZmFcIjogXCJmYS1yZXBlYXRcIiwgXCJ0aXRsZVwiOiBcInJlZG9cIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtcmVmcmVzaFwiLCBcInRpdGxlXCI6IFwicmVzZXRcIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtYXJyb3dzLWFsdFwiLCBcInRpdGxlXCI6IFwiZnVsbHNjcmVlblwifV07XG5cdGxldCBsaXMgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxidG5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGlzICs9ICc8bGlcIj4nO1xuXHRcdGxpcyArPSAnJm5ic3A7PGkgY2xhc3M9XCJmYSBmYS1sZyAnICsgYnRuc1tpXS5mYSArICdcIiAnICtcblx0XHQgICAgICAgICAgICAgICAoYnRuc1tpXS5mYSA9PSBcImZhLWFycm93cy1hbHRcIiA/ICdpZD1cImZ1bGxzY3JlZW5cIiAnIDogJycpICtcblx0XHQgICAgICAgICAgICAgICAnIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRpdGxlPVwiJysgYnRuc1tpXS50aXRsZSArJ1wiPjwvaT4nO1xuXHRcdGxpcyArPSAnPC9saT4nO1xuXHR9XG5cdCQoIFwiI1wiK29wdHMuYnRuX3RhcmdldCApLmFwcGVuZChsaXMpO1xuXHRjbGljayhvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzX2Z1bGxzY3JlZW4oKXtcblx0cmV0dXJuIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrKG9wdHMpIHtcblx0Ly8gZnVsbHNjcmVlblxuICAgICQoZG9jdW1lbnQpLm9uKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlIG1vemZ1bGxzY3JlZW5jaGFuZ2UgZnVsbHNjcmVlbmNoYW5nZSBNU0Z1bGxzY3JlZW5DaGFuZ2UnLCBmdW5jdGlvbihfZSkgIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0aWYgKGxvY2FsX2RhdGFzZXQgIT09IHVuZGVmaW5lZCAmJiBsb2NhbF9kYXRhc2V0ICE9PSBudWxsKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBsb2NhbF9kYXRhc2V0O1xuXHRcdH1cblx0XHRyZWJ1aWxkKG9wdHMpO1xuICAgIH0pO1xuXG5cdCQoJyNmdWxsc2NyZWVuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oX2UpIHtcblx0XHRpZiAoIWRvY3VtZW50Lm1vekZ1bGxTY3JlZW4gJiYgIWRvY3VtZW50LndlYmtpdEZ1bGxTY3JlZW4pIHtcblx0XHRcdGxldCB0YXJnZXQgPSAkKFwiI1wiK29wdHMudGFyZ2V0RGl2KVswXTtcblx0XHRcdGlmKHRhcmdldC5tb3pSZXF1ZXN0RnVsbFNjcmVlbilcblx0XHRcdFx0dGFyZ2V0Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRhcmdldC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbihFbGVtZW50LkFMTE9XX0tFWUJPQVJEX0lOUFVUKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbilcblx0XHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuKCk7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyB1bmRvL3JlZG8vcmVzZXRcblx0JCggXCIjXCIrb3B0cy5idG5fdGFyZ2V0ICkub24oIFwiY2xpY2tcIiwgZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0aWYoJChlLnRhcmdldCkuaGFzQ2xhc3MoXCJkaXNhYmxlZFwiKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdGlmKCQoZS50YXJnZXQpLmhhc0NsYXNzKCdmYS11bmRvJykpIHtcblx0XHRcdG9wdHMuZGF0YXNldCA9IHBlZGNhY2hlLnByZXZpb3VzKG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlcGVhdCcpKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBwZWRjYWNoZS5uZXh0KG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlZnJlc2gnKSkge1xuXHRcdFx0JCgnPGRpdiBpZD1cIm1zZ0RpYWxvZ1wiPlJlc2V0dGluZyB0aGUgcGVkaWdyZWUgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIHNvbWUgZGF0YS48L2Rpdj4nKS5kaWFsb2coe1xuXHRcdFx0XHR0aXRsZTogJ0NvbmZpcm0gUmVzZXQnLFxuXHRcdFx0XHRyZXNpemFibGU6IGZhbHNlLFxuXHRcdFx0XHRoZWlnaHQ6IFwiYXV0b1wiLFxuXHRcdFx0XHR3aWR0aDogNDAwLFxuXHRcdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdFx0YnV0dG9uczoge1xuXHRcdFx0XHRcdENvbnRpbnVlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHJlc2V0KG9wdHMsIG9wdHMua2VlcF9wcm9iYW5kX29uX3Jlc2V0KTtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCBcImNsb3NlXCIgKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdENhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZyggXCJjbG9zZVwiICk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pO1xuXHR9KTtcbn1cblxuLy8gcmVzZXQgcGVkaWdyZWUgYW5kIGNsZWFyIHRoZSBoaXN0b3J5XG5leHBvcnQgZnVuY3Rpb24gcmVzZXQob3B0cywga2VlcF9wcm9iYW5kKSB7XG5cdGxldCBwcm9iYW5kO1xuXHRpZihrZWVwX3Byb2JhbmQpIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0bGV0IG5ld2RhdGFzZXQgPSAgY29weV9kYXRhc2V0KGxvY2FsX2RhdGFzZXQpO1xuXHRcdHByb2JhbmQgPSBuZXdkYXRhc2V0W2dldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KV07XG5cdFx0Ly9sZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlsLmdldENoaWxkcmVuKG5ld2RhdGFzZXQsIHByb2JhbmQpO1xuXHRcdHByb2JhbmQubmFtZSA9IFwiY2gxXCI7XG5cdFx0cHJvYmFuZC5tb3RoZXIgPSBcImYyMVwiO1xuXHRcdHByb2JhbmQuZmF0aGVyID0gXCJtMjFcIjtcblx0XHQvLyBjbGVhciBwZWRpZ3JlZSBkYXRhIGJ1dCBrZWVwIHByb2JhbmQgZGF0YSBhbmQgcmlzayBmYWN0b3JzXG5cdFx0cGVkY2FjaGUuY2xlYXJfcGVkaWdyZWVfZGF0YShvcHRzKVxuXHR9IGVsc2Uge1xuXHRcdHByb2JhbmQgPSB7XG5cdFx0XHRcIm5hbWVcIjpcImNoMVwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInByb2JhbmRcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1lXCJcblx0XHR9O1xuXHRcdHBlZGNhY2hlLmNsZWFyKG9wdHMpOyAvLyBjbGVhciBhbGwgc3RvcmFnZSBkYXRhXG5cdH1cblxuXHRkZWxldGUgb3B0cy5kYXRhc2V0O1xuXG5cdGxldCBzZWxlY3RlZCA9ICQoXCJpbnB1dFtuYW1lPSdkZWZhdWx0X2ZhbSddOmNoZWNrZWRcIik7XG5cdGlmKHNlbGVjdGVkLmxlbmd0aCA+IDAgJiYgc2VsZWN0ZWQudmFsKCkgPT0gJ2V4dGVuZGVkMicpIHsgICAgLy8gc2Vjb25kYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIndaQVwiLFwic2V4XCI6XCJNXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGdyYW5kZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUFrXCIsXCJzZXhcIjpcIkZcIixcInRvcF9sZXZlbFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgZ3JhbmRtb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ6d0JcIixcInNleFwiOlwiTVwiLFwidG9wX2xldmVsXCI6dHJ1ZSxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJtYXRlcm5hbCBncmFuZGZhdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImRPSFwiLFwic2V4XCI6XCJGXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGdyYW5kbW90aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUtnXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiTUFrXCIsXCJmYXRoZXJcIjpcIndaQVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGF1bnRcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4c21cIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgdW5jbGVcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJtMjFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiZE9IXCIsXCJmYXRoZXJcIjpcInp3QlwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImFPSFwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJzaXN0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJWaGFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiYnJvdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIlNwalwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcIm5vcGFyZW50c1wiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGFydG5lclwifSxcblx0XHRcdHByb2JhbmQsXG5cdFx0XHR7XCJuYW1lXCI6XCJ6aGtcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJjaDFcIixcImZhdGhlclwiOlwiU3BqXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZGF1Z2h0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJLbnhcIixcImRpc3BsYXlfbmFtZVwiOlwic29uXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwidXVjXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGF1bnRcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4SXdcIixcImRpc3BsYXlfbmFtZVwiOlwibWF0ZXJuYWwgdW5jbGVcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn1dO1xuXHR9IGVsc2UgaWYoc2VsZWN0ZWQubGVuZ3RoID4gMCAmJiBzZWxlY3RlZC52YWwoKSA9PSAnZXh0ZW5kZWQxJykgeyAgICAvLyBwcmltYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIm0yMVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpudWxsLFwiZmF0aGVyXCI6bnVsbCxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJmYXRoZXJcIixcIm5vcGFyZW50c1wiOnRydWV9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOm51bGwsXCJmYXRoZXJcIjpudWxsLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwiLFwibm9wYXJlbnRzXCI6dHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6XCJhT0hcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwic2lzdGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiVmhhXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImJyb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJTcGpcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJub3BhcmVudHNcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhcnRuZXJcIn0sXG5cdFx0XHRwcm9iYW5kLFxuXHRcdFx0e1wibmFtZVwiOlwiemhrXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImRhdWdodGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiS254XCIsXCJkaXNwbGF5X25hbWVcIjpcInNvblwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImNoMVwiLFwiZmF0aGVyXCI6XCJTcGpcIixcInN0YXR1c1wiOlwiMFwifV07XG5cdH0gZWxzZSB7XG5cdFx0b3B0cy5kYXRhc2V0ID0gW1xuXHRcdFx0e1wibmFtZVwiOiBcIm0yMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcImZhdGhlclwiLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6IFwiZjIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibW90aGVyXCIsIFwic2V4XCI6IFwiRlwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdHByb2JhbmRdO1xuXHR9XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVCdXR0b25zKG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBwZWRjYWNoZS5nZXRfY291bnQob3B0cyk7XG5cdGxldCBuc3RvcmUgPSBwZWRjYWNoZS5uc3RvcmUob3B0cyk7XG5cdGxldCBpZCA9IFwiI1wiK29wdHMuYnRuX3RhcmdldDtcblx0aWYobnN0b3JlIDw9IGN1cnJlbnQpXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRlbHNlXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG5cdGlmKGN1cnJlbnQgPiAxKVxuXHRcdCQoaWQrXCIgLmZhLXVuZG9cIikucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdGVsc2Vcblx0XHQkKGlkK1wiIC5mYS11bmRvXCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xufVxuIiwiLy8gcGVkaWdyZWUgSS9PXG5pbXBvcnQgKiBhcyBwZWRpZ3JlZV91dGlsIGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge2dldF90cmVlX2RpbWVuc2lvbnMsIHZhbGlkYXRlX3BlZGlncmVlLCByZWJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcblxuLy8gY2FuY2VycywgZ2VuZXRpYyAmIHBhdGhvbG9neSB0ZXN0c1xuZXhwb3J0IGxldCBjYW5jZXJzID0ge1xuXHRcdCdicmVhc3RfY2FuY2VyJzogJ2JyZWFzdF9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J2JyZWFzdF9jYW5jZXIyJzogJ2JyZWFzdF9jYW5jZXIyX2RpYWdub3Npc19hZ2UnLFxuXHRcdCdvdmFyaWFuX2NhbmNlcic6ICdvdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlJyxcblx0XHQncHJvc3RhdGVfY2FuY2VyJzogJ3Byb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlJyxcblx0XHQncGFuY3JlYXRpY19jYW5jZXInOiAncGFuY3JlYXRpY19jYW5jZXJfZGlhZ25vc2lzX2FnZSdcblx0fTtcbmV4cG9ydCBsZXQgZ2VuZXRpY190ZXN0ID0gWydicmNhMScsICdicmNhMicsICdwYWxiMicsICdhdG0nLCAnY2hlazInLCAncmFkNTFkJyxcdCdyYWQ1MWMnLCAnYnJpcDEnXTtcbmV4cG9ydCBsZXQgcGF0aG9sb2d5X3Rlc3RzID0gWydlcicsICdwcicsICdoZXIyJywgJ2NrMTQnLCAnY2s1NiddO1xuXG4vLyBnZXQgYnJlYXN0IGFuZCBvdmFyaWFuIFBSUyB2YWx1ZXNcbmV4cG9ydCBmdW5jdGlvbiBnZXRfcHJzX3ZhbHVlcygpIHtcblx0bGV0IHBycyA9IHt9O1xuXHRpZihoYXNJbnB1dChcImJyZWFzdF9wcnNfYVwiKSAmJiBoYXNJbnB1dChcImJyZWFzdF9wcnNfelwiKSkge1xuXHRcdHByc1snYnJlYXN0X2NhbmNlcl9wcnMnXSA9IHtcblx0XHRcdCdhbHBoYSc6IHBhcnNlRmxvYXQoJCgnI2JyZWFzdF9wcnNfYScpLnZhbCgpKSxcblx0XHRcdCd6c2NvcmUnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX3onKS52YWwoKSksXG5cdFx0XHQncGVyY2VudCc6IHBhcnNlRmxvYXQoJCgnI2JyZWFzdF9wcnNfcGVyY2VudCcpLnZhbCgpKVxuXHRcdH07XG5cdH1cblx0aWYoaGFzSW5wdXQoXCJvdmFyaWFuX3Byc19hXCIpICYmIGhhc0lucHV0KFwib3Zhcmlhbl9wcnNfelwiKSkge1xuXHRcdHByc1snb3Zhcmlhbl9jYW5jZXJfcHJzJ10gPSB7XG5cdFx0XHQnYWxwaGEnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc19hJykudmFsKCkpLFxuXHRcdFx0J3pzY29yZSc6IHBhcnNlRmxvYXQoJCgnI292YXJpYW5fcHJzX3onKS52YWwoKSksXG5cdFx0XHQncGVyY2VudCc6IHBhcnNlRmxvYXQoJCgnI292YXJpYW5fcHJzX3BlcmNlbnQnKS52YWwoKSlcblx0XHR9O1xuXHR9XG5cdGNvbnNvbGUubG9nKHBycyk7XG5cdHJldHVybiAoaXNFbXB0eShwcnMpID8gMCA6IHBycyk7XG59XG5cbi8vIGNoZWNrIGlmIGlucHV0IGhhcyBhIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gaGFzSW5wdXQoaWQpIHtcblx0cmV0dXJuICQudHJpbSgkKCcjJytpZCkudmFsKCkpLmxlbmd0aCAhPT0gMDtcbn1cblxuLy8gcmV0dXJuIHRydWUgaWYgdGhlIG9iamVjdCBpcyBlbXB0eVxubGV0IGlzRW1wdHkgPSBmdW5jdGlvbihteU9iaikge1xuXHRmb3IobGV0IGtleSBpbiBteU9iaikge1xuXHRcdGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobXlPYmosIGtleSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfc3VyZ2ljYWxfb3BzKCkge1xuXHRsZXQgbWV0YSA9IFwiXCI7XG5cdGlmKCEkKCcjQTZfNF8zX2NoZWNrJykucGFyZW50KCkuaGFzQ2xhc3MoXCJvZmZcIikpIHtcblx0XHRtZXRhICs9IFwiO09WQVJZMj15XCI7XG5cdH1cblx0aWYoISQoJyNBNl80XzdfY2hlY2snKS5wYXJlbnQoKS5oYXNDbGFzcyhcIm9mZlwiKSkge1xuXHRcdG1ldGEgKz0gXCI7TUFTVDI9eVwiO1xuXHR9XG5cdHJldHVybiBtZXRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdHMpIHtcblx0JCgnI2xvYWQnKS5jaGFuZ2UoZnVuY3Rpb24oZSkge1xuXHRcdGxvYWQoZSwgb3B0cyk7XG5cdH0pO1xuXG5cdCQoJyNzYXZlJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRzYXZlKG9wdHMpO1xuXHR9KTtcblxuXHQkKCcjc2F2ZV9jYW5yaXNrJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRsZXQgbWV0YSA9IGdldF9zdXJnaWNhbF9vcHMoKTtcblx0XHRsZXQgcHJzO1xuXHRcdHRyeSB7XG5cdFx0XHRwcnMgPSBnZXRfcHJzX3ZhbHVlcygpO1xuXHRcdFx0aWYocHJzLmJyZWFzdF9jYW5jZXJfcHJzICYmIHBycy5icmVhc3RfY2FuY2VyX3Bycy5hbHBoYSAhPT0gMCAmJiBwcnMuYnJlYXN0X2NhbmNlcl9wcnMuenNjb3JlICE9PSAwKSB7XG5cdFx0XHRcdG1ldGEgKz0gXCJcXG4jI1BSU19CQz1hbHBoYT1cIitwcnMuYnJlYXN0X2NhbmNlcl9wcnMuYWxwaGErXCIsenNjb3JlPVwiK3Bycy5icmVhc3RfY2FuY2VyX3Bycy56c2NvcmU7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHBycy5vdmFyaWFuX2NhbmNlcl9wcnMgJiYgcHJzLm92YXJpYW5fY2FuY2VyX3Bycy5hbHBoYSAhPT0gMCAmJiBwcnMub3Zhcmlhbl9jYW5jZXJfcHJzLnpzY29yZSAhPT0gMCkge1xuXHRcdFx0XHRtZXRhICs9IFwiXFxuIyNQUlNfT0M9YWxwaGE9XCIrcHJzLm92YXJpYW5fY2FuY2VyX3Bycy5hbHBoYStcIix6c2NvcmU9XCIrcHJzLm92YXJpYW5fY2FuY2VyX3Bycy56c2NvcmU7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaChlcnIpIHsgY29uc29sZS53YXJuKFwiUFJTXCIsIHBycyk7IH1cblx0XHRzYXZlX2NhbnJpc2sob3B0cywgbWV0YSk7XG5cdH0pO1xuXG5cdCQoJyNwcmludCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0cHJpbnQoZ2V0X3ByaW50YWJsZV9zdmcob3B0cykpO1xuXHR9KTtcblxuXHQkKCcjc3ZnX2Rvd25sb2FkJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRzdmdfZG93bmxvYWQoZ2V0X3ByaW50YWJsZV9zdmcob3B0cykpO1xuXHR9KTtcblxuXHQkKCcjcG5nX2Rvd25sb2FkJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRsZXQgZGVmZXJyZWQgPSBzdmcyaW1nKCQoJ3N2ZycpLCBcInBlZGlncmVlXCIpO1xuXHRcdCQud2hlbi5hcHBseSgkLFtkZWZlcnJlZF0pLmRvbmUoZnVuY3Rpb24oKSB7XG5cdFx0XHRsZXQgb2JqID0gZ2V0QnlOYW1lKGFyZ3VtZW50cywgXCJwZWRpZ3JlZVwiKTtcblx0XHRcdGlmKHBlZGlncmVlX3V0aWwuaXNFZGdlKCkgfHwgcGVkaWdyZWVfdXRpbC5pc0lFKCkpIHtcblx0XHRcdFx0bGV0IGh0bWw9XCI8aW1nIHNyYz0nXCIrb2JqLmltZytcIicgYWx0PSdjYW52YXMgaW1hZ2UnLz5cIjtcblx0XHRcdFx0bGV0IG5ld1RhYiA9IHdpbmRvdy5vcGVuKCk7XHRcdC8vIHBvcC11cHMgbmVlZCB0byBiZSBlbmFibGVkXG5cdFx0XHRcdG5ld1RhYi5kb2N1bWVudC53cml0ZShodG1sKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxldCBhXHQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRcdFx0XHRhLmhyZWZcdCA9IG9iai5pbWc7XG5cdFx0XHRcdGEuZG93bmxvYWQgPSAncGxvdC5wbmcnO1xuXHRcdFx0XHRhLnRhcmdldCAgID0gJ19ibGFuayc7XG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG5cbi8qKlxuICogR2V0IG9iamVjdCBmcm9tIGFycmF5IGJ5IHRoZSBuYW1lIGF0dHJpYnV0ZS5cbiAqL1xuZnVuY3Rpb24gZ2V0QnlOYW1lKGFyciwgbmFtZSkge1xuXHRyZXR1cm4gJC5ncmVwKGFyciwgZnVuY3Rpb24obyl7IHJldHVybiBvICYmIG8ubmFtZSA9PSBuYW1lOyB9KVswXTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIFNWRyBkb2N1bWVudCBlbGVtZW50IGNvbnZlcnQgdG8gaW1hZ2UgKGUuZy4ganBlZywgcG5nIC0gZGVmYXVsdCBwbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3ZnMmltZyhzdmcsIGRlZmVycmVkX25hbWUsIG9wdGlvbnMpIHtcblx0bGV0IGRlZmF1bHRzID0ge2lzY2Fudmc6IGZhbHNlLCByZXNvbHV0aW9uOiAxLCBpbWdfdHlwZTogXCJpbWFnZS9wbmdcIn07XG5cdGlmKCFvcHRpb25zKSBvcHRpb25zID0gZGVmYXVsdHM7XG5cdCQuZWFjaChkZWZhdWx0cywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdGlmKCEoa2V5IGluIG9wdGlvbnMpKSB7b3B0aW9uc1trZXldID0gdmFsdWU7fVxuXHR9KTtcblxuXHQvLyBzZXQgU1ZHIGJhY2tncm91bmQgdG8gd2hpdGUgLSBmaXggZm9yIGpwZWcgY3JlYXRpb25cblx0aWYgKHN2Zy5maW5kKFwiLnBkZi13aGl0ZS1iZ1wiKS5sZW5ndGggPT09IDApe1xuXHRcdGxldCBkM29iaiA9IGQzLnNlbGVjdChzdmcuZ2V0KDApKTtcblx0XHRkM29iai5hcHBlbmQoXCJyZWN0XCIpXG5cdFx0XHQuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicGRmLXdoaXRlLWJnXCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCJ3aGl0ZVwiKTtcblx0XHRkM29iai5zZWxlY3QoXCIucGRmLXdoaXRlLWJnXCIpLmxvd2VyKCk7XG5cdH1cblxuXHRsZXQgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdGxldCBzdmdTdHI7XG5cdGlmICh0eXBlb2Ygd2luZG93LlhNTFNlcmlhbGl6ZXIgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHN2Z1N0ciA9IChuZXcgWE1MU2VyaWFsaXplcigpKS5zZXJpYWxpemVUb1N0cmluZyhzdmcuZ2V0KDApKTtcblx0fSBlbHNlIGlmICh0eXBlb2Ygc3ZnLnhtbCAhPSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c3ZnU3RyID0gc3ZnLmdldCgwKS54bWw7XG5cdH1cblxuXHRsZXQgaW1nc3JjID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJysgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3ZnU3RyKSkpOyAvLyBjb252ZXJ0IFNWRyBzdHJpbmcgdG8gZGF0YSBVUkxcblx0bGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG5cdGNhbnZhcy53aWR0aCA9IHN2Zy53aWR0aCgpKm9wdGlvbnMucmVzb2x1dGlvbjtcblx0Y2FudmFzLmhlaWdodCA9IHN2Zy5oZWlnaHQoKSpvcHRpb25zLnJlc29sdXRpb247XG5cdGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblx0bGV0IGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG5cdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZihwZWRpZ3JlZV91dGlsLmlzSUUoKSkge1xuXHRcdFx0Ly8gY2hhbmdlIGZvbnQgc28gaXQgaXNuJ3QgdGlueVxuXHRcdFx0c3ZnU3RyID0gc3ZnU3RyLnJlcGxhY2UoLyBmb250LXNpemU9XCJcXGQ/LlxcZCplbVwiL2csICcnKTtcblx0XHRcdHN2Z1N0ciA9IHN2Z1N0ci5yZXBsYWNlKC88dGV4dCAvZywgJzx0ZXh0IGZvbnQtc2l6ZT1cIjEycHhcIiAnKTtcblx0XHRcdGxldCB2ID0gY2FudmcuQ2FudmcuZnJvbVN0cmluZyhjb250ZXh0LCBzdmdTdHIsIHtcblx0XHRcdFx0c2NhbGVXaWR0aDogY2FudmFzLndpZHRoLFxuXHRcdFx0XHRzY2FsZUhlaWdodDogY2FudmFzLmhlaWdodCxcblx0XHRcdFx0aWdub3JlRGltZW5zaW9uczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0XHR2LnN0YXJ0KCk7XG5cdFx0XHRjb25zb2xlLmxvZyhkZWZlcnJlZF9uYW1lLCBvcHRpb25zLmltZ190eXBlLCBcInVzZSBjYW52ZyB0byBjcmVhdGUgaW1hZ2VcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdGNvbnNvbGUubG9nKGRlZmVycmVkX25hbWUsIG9wdGlvbnMuaW1nX3R5cGUpO1xuXHRcdH1cblx0XHRkZWZlcnJlZC5yZXNvbHZlKHsnbmFtZSc6IGRlZmVycmVkX25hbWUsICdyZXNvbHV0aW9uJzogb3B0aW9ucy5yZXNvbHV0aW9uLCAnaW1nJzpjYW52YXMudG9EYXRhVVJMKG9wdGlvbnMuaW1nX3R5cGUsIDEpLCAndyc6Y2FudmFzLndpZHRoLCAnaCc6Y2FudmFzLmhlaWdodH0pO1xuXHR9O1xuXHRpbWcuc3JjID0gaW1nc3JjO1xuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xufVxuXG5mdW5jdGlvbiBnZXRNYXRjaGVzKHN0ciwgbXlSZWdleHApIHtcblx0bGV0IG1hdGNoZXMgPSBbXTtcblx0bGV0IG1hdGNoO1xuXHRsZXQgYyA9IDA7XG5cdG15UmVnZXhwLmxhc3RJbmRleCA9IDA7XG5cdHdoaWxlICgobWF0Y2ggPSBteVJlZ2V4cC5leGVjKHN0cikpKSB7XG5cdFx0YysrO1xuXHRcdGlmKGMgPiA0MDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJnZXRNYXRjaGVzOiBjb3VudGVyIGV4Y2VlZGVkIDgwMFwiKTtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cdFx0bWF0Y2hlcy5wdXNoKG1hdGNoKTtcblx0XHRpZiAobXlSZWdleHAubGFzdEluZGV4ID09PSBtYXRjaC5pbmRleCkge1xuXHRcdFx0bXlSZWdleHAubGFzdEluZGV4Kys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBtYXRjaGVzO1xufVxuXG4vLyBmaW5kIGFsbCB1cmwncyB0byBtYWtlIHVuaXF1ZVxuZnVuY3Rpb24gdW5pcXVlX3VybHMoc3ZnX2h0bWwpIHtcblx0bGV0IG1hdGNoZXMgPSBnZXRNYXRjaGVzKHN2Z19odG1sLCAvdXJsXFwoKCZxdW90O3xcInwnKXswLDF9IyguKj8pKCZxdW90O3xcInwnKXswLDF9XFwpL2cpO1xuXHRpZihtYXRjaGVzID09PSAtMSlcblx0XHRyZXR1cm4gXCJFUlJPUiBESVNQTEFZSU5HIFBFRElHUkVFXCJcblxuXHQkLmVhY2gobWF0Y2hlcywgZnVuY3Rpb24oaW5kZXgsIG1hdGNoKSB7XG5cdFx0bGV0IHF1b3RlID0gKG1hdGNoWzFdID8gbWF0Y2hbMV0gOiBcIlwiKTtcblx0XHRsZXQgdmFsID0gbWF0Y2hbMl07XG5cdFx0bGV0IG0xID0gXCJpZD1cXFwiXCIgKyB2YWwgKyBcIlxcXCJcIjtcblx0XHRsZXQgbTIgPSBcInVybFxcXFwoXCIgKyBxdW90ZSArIFwiI1wiICsgdmFsICsgcXVvdGUgKyBcIlxcXFwpXCI7XG5cblx0XHRsZXQgbmV3dmFsID0gdmFsK3BlZGlncmVlX3V0aWwubWFrZWlkKDIpO1xuXHRcdHN2Z19odG1sID0gc3ZnX2h0bWwucmVwbGFjZShuZXcgUmVnRXhwKG0xLCAnZycpLCBcImlkPVxcXCJcIituZXd2YWwrXCJcXFwiXCIgKTtcblx0XHRzdmdfaHRtbCA9IHN2Z19odG1sLnJlcGxhY2UobmV3IFJlZ0V4cChtMiwgJ2cnKSwgXCJ1cmwoI1wiK25ld3ZhbCtcIilcIiApO1xuICAgfSk7XG5cdHJldHVybiBzdmdfaHRtbDtcbn1cblxuLy8gcmV0dXJuIGEgY29weSBwZWRpZ3JlZSBzdmdcbmV4cG9ydCBmdW5jdGlvbiBjb3B5X3N2ZyhvcHRzKSB7XG5cdGxldCBzdmdfbm9kZSA9IGdldF9wcmludGFibGVfc3ZnKG9wdHMpO1xuXHRsZXQgZDNvYmogPSBkMy5zZWxlY3Qoc3ZnX25vZGUuZ2V0KDApKTtcblxuXHQvLyByZW1vdmUgdW51c2VkIGVsZW1lbnRzXG5cdGQzb2JqLnNlbGVjdEFsbChcIi5wb3B1cF9zZWxlY3Rpb24sIC5pbmRpX3JlY3QsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZGNoaWxkLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLmxpbmVfZHJhZ19zZWxlY3Rpb25cIikucmVtb3ZlKCk7XG5cdGQzb2JqLnNlbGVjdEFsbChcInRleHRcIilcblx0ICAuZmlsdGVyKGZ1bmN0aW9uKCl7XG5cdFx0IHJldHVybiBkMy5zZWxlY3QodGhpcykudGV4dCgpLmxlbmd0aCA9PT0gMFxuXHQgIH0pLnJlbW92ZSgpO1xuXHRyZXR1cm4gJCh1bmlxdWVfdXJscyhzdmdfbm9kZS5odG1sKCkpKTtcbn1cblxuLy8gZ2V0IHByaW50YWJsZSBzdmcgZGl2LCBhZGp1c3Qgc2l6ZSB0byB0cmVlIGRpbWVuc2lvbnMgYW5kIHNjYWxlIHRvIGZpdFxuZXhwb3J0IGZ1bmN0aW9uIGdldF9wcmludGFibGVfc3ZnKG9wdHMpIHtcblx0bGV0IGxvY2FsX2RhdGFzZXQgPSBwZWRjYWNoZS5jdXJyZW50KG9wdHMpOyAvLyBnZXQgY3VycmVudCBkYXRhc2V0XG5cdGlmIChsb2NhbF9kYXRhc2V0ICE9PSB1bmRlZmluZWQgJiYgbG9jYWxfZGF0YXNldCAhPT0gbnVsbCkge1xuXHRcdG9wdHMuZGF0YXNldCA9IGxvY2FsX2RhdGFzZXQ7XG5cdH1cblxuXHRsZXQgdHJlZV9kaW1lbnNpb25zID0gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IHN2Z19kaXYgPSAkKCc8ZGl2PjwvZGl2PicpOyAgXHRcdFx0XHQvLyBjcmVhdGUgYSBuZXcgZGl2XG5cdGxldCBzdmcgPSAkKCcjJytvcHRzLnRhcmdldERpdikuZmluZCgnc3ZnJykuY2xvbmUoKS5hcHBlbmRUbyhzdmdfZGl2KTtcblx0aWYob3B0cy53aWR0aCA8IHRyZWVfZGltZW5zaW9ucy53aWR0aCB8fCBvcHRzLmhlaWdodCA8IHRyZWVfZGltZW5zaW9ucy5oZWlnaHQgfHxcblx0ICAgdHJlZV9kaW1lbnNpb25zLndpZHRoID4gNTk1IHx8IHRyZWVfZGltZW5zaW9ucy5oZWlnaHQgPiA4NDIpIHtcblx0XHRsZXQgd2lkID0gdHJlZV9kaW1lbnNpb25zLndpZHRoO1xuXHRcdGxldCBoZ3QgPSB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ICsgMTAwO1xuXHRcdGxldCBzY2FsZSA9IDEuMDtcblxuXHRcdGlmKHRyZWVfZGltZW5zaW9ucy53aWR0aCA+IDU5NSB8fCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSB7ICAgLy8gc2NhbGUgdG8gZml0IEE0XG5cdFx0XHRpZih0cmVlX2RpbWVuc2lvbnMud2lkdGggPiA1OTUpICB3aWQgPSA1OTU7XG5cdFx0XHRpZih0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSBoZ3QgPSA4NDI7XG5cdFx0XHRsZXQgeHNjYWxlID0gd2lkL3RyZWVfZGltZW5zaW9ucy53aWR0aDtcblx0XHRcdGxldCB5c2NhbGUgPSBoZ3QvdHJlZV9kaW1lbnNpb25zLmhlaWdodDtcblx0XHRcdHNjYWxlID0gKHhzY2FsZSA8IHlzY2FsZSA/IHhzY2FsZSA6IHlzY2FsZSk7XG5cdFx0fVxuXG5cdFx0c3ZnLmF0dHIoJ3dpZHRoJywgd2lkKTtcdFx0Ly8gYWRqdXN0IGRpbWVuc2lvbnNcblx0XHRzdmcuYXR0cignaGVpZ2h0JywgaGd0KTtcblxuXHRcdGxldCB5dHJhbnNmb3JtID0gKC1vcHRzLnN5bWJvbF9zaXplKjEuNSpzY2FsZSk7XG5cdFx0c3ZnLmZpbmQoXCIuZGlhZ3JhbVwiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsIFwiK3l0cmFuc2Zvcm0rXCIpIHNjYWxlKFwiK3NjYWxlK1wiKVwiKTtcblx0fVxuXHRyZXR1cm4gc3ZnX2Rpdjtcbn1cblxuLy8gZG93bmxvYWQgdGhlIFNWRyB0byBhIGZpbGVcbmV4cG9ydCBmdW5jdGlvbiBzdmdfZG93bmxvYWQoc3ZnKXtcblx0bGV0IGFcdCAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdGEuaHJlZlx0ID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJysgYnRvYSggdW5lc2NhcGUoIGVuY29kZVVSSUNvbXBvbmVudCggc3ZnLmh0bWwoKSApICkgKTtcblx0YS5kb3dubG9hZCA9ICdwbG90LnN2Zyc7XG5cdGEudGFyZ2V0ICAgPSAnX2JsYW5rJztcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygpOyBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xufVxuXG4vLyBvcGVuIHByaW50IHdpbmRvdyBmb3IgYSBnaXZlbiBlbGVtZW50XG5leHBvcnQgZnVuY3Rpb24gcHJpbnQoZWwsIGlkKXtcblx0aWYoZWwuY29uc3RydWN0b3IgIT09IEFycmF5KVxuXHRcdGVsID0gW2VsXTtcblxuXHRsZXQgd2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSowLjk7XG5cdGxldCBoZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCktMTA7XG5cdGxldCBjc3NGaWxlcyA9IFtcblx0XHQnL3N0YXRpYy9jc3MvY2Fucmlzay5jc3MnLFxuXHRcdCdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2ZvbnQtYXdlc29tZUA0LjcuMC9jc3MvZm9udC1hd2Vzb21lLm1pbi5jc3MnXG5cdF07XG5cdGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCcnLCAnUHJpbnRNYXAnLCAnd2lkdGg9JyArIHdpZHRoICsgJyxoZWlnaHQ9JyArIGhlaWdodCk7XG5cdGxldCBoZWFkQ29udGVudCA9ICcnO1xuXHRmb3IobGV0IGk9MDsgaTxjc3NGaWxlcy5sZW5ndGg7IGkrKylcblx0XHRoZWFkQ29udGVudCArPSAnPGxpbmsgaHJlZj1cIicrY3NzRmlsZXNbaV0rJ1wiIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBtZWRpYT1cImFsbFwiPic7XG5cdGhlYWRDb250ZW50ICs9IFwiPHN0eWxlPmJvZHkge2ZvbnQtc2l6ZTogXCIgKyAkKFwiYm9keVwiKS5jc3MoJ2ZvbnQtc2l6ZScpICsgXCI7fTwvc3R5bGU+XCI7XG5cblx0bGV0IGh0bWwgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxlbC5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGkgPT09IDAgJiYgaWQpXG5cdFx0XHRodG1sICs9IGlkO1xuXHRcdGh0bWwgKz0gJChlbFtpXSkuaHRtbCgpO1xuXHRcdGlmKGkgPCBlbC5sZW5ndGgtMSlcblx0XHRcdGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJwYWdlLWJyZWFrXCI+IDwvZGl2Pic7XG5cdH1cblxuXHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShoZWFkQ29udGVudCk7XG5cdHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGh0bWwpO1xuXHRwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuXG5cdHByaW50V2luZG93LmZvY3VzKCk7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0cHJpbnRXaW5kb3cucHJpbnQoKTtcblx0XHRwcmludFdpbmRvdy5jbG9zZSgpO1xuXHR9LCAzMDApO1xufVxuXG4vLyBzYXZlIGNvbnRlbnQgdG8gYSBmaWxlXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9maWxlKG9wdHMsIGNvbnRlbnQsIGZpbGVuYW1lLCB0eXBlKXtcblx0aWYob3B0cy5ERUJVRylcblx0XHRjb25zb2xlLmxvZyhjb250ZW50KTtcblx0aWYoIWZpbGVuYW1lKSBmaWxlbmFtZSA9IFwicGVkLnR4dFwiO1xuXHRpZighdHlwZSkgdHlwZSA9IFwidGV4dC9wbGFpblwiO1xuXG4gICBsZXQgZmlsZSA9IG5ldyBCbG9iKFtjb250ZW50XSwge3R5cGU6IHR5cGV9KTtcbiAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIFx0Ly8gSUUxMCtcblx0ICAgd2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKGZpbGUsIGZpbGVuYW1lKTtcbiAgIGVsc2UgeyBcdFx0XHRcdFx0XHRcdFx0XHQvLyBvdGhlciBicm93c2Vyc1xuXHQgICBsZXQgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXHQgICBsZXQgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcblx0ICAgYS5ocmVmID0gdXJsO1xuXHQgICBhLmRvd25sb2FkID0gZmlsZW5hbWU7XG5cdCAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XG5cdCAgIGEuY2xpY2soKTtcblx0ICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHQgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xuXHRcdCAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG5cdFx0fSwgMCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmUob3B0cyl7XG5cdGxldCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocGVkY2FjaGUuY3VycmVudChvcHRzKSk7XG5cdHNhdmVfZmlsZShvcHRzLCBjb250ZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfY2FucmlzayhvcHRzLCBtZXRhKXtcblx0c2F2ZV9maWxlKG9wdHMsIHJ1bl9wcmVkaWN0aW9uLmdldF9ub25fYW5vbl9wZWRpZ3JlZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBtZXRhKSwgXCJjYW5yaXNrLnR4dFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKSB7XG5cdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGlkeCwgcCkge1xuXHRcdGlmKCFwLmhpZGRlbiAmJiBwLnNleCA9PT0gJ00nICYmICFwZWRpZ3JlZV91dGlsLmlzUHJvYmFuZChwKSkge1xuXHRcdFx0aWYocFtjYW5jZXJzWydicmVhc3RfY2FuY2VyMiddXSkge1xuXHRcdFx0XHRsZXQgbXNnID0gJ01hbGUgZmFtaWx5IG1lbWJlciAoJytwLmRpc3BsYXlfbmFtZSsnKSB3aXRoIGNvbnRyYWxhdGVyYWwgYnJlYXN0IGNhbmNlciBmb3VuZC4gJytcblx0XHRcdFx0XHRcdCAgJ1BsZWFzZSBub3RlIHRoYXQgYXMgdGhlIHJpc2sgbW9kZWxzIGRvIG5vdCB0YWtlIHRoaXMgaW50byBhY2NvdW50IHRoZSBzZWNvbmQgJytcblx0XHRcdFx0XHRcdCAgJ2JyZWFzdCBjYW5jZXIgaXMgaWdub3JlZC4nXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IobXNnKTtcblx0XHRcdFx0ZGVsZXRlIHBbY2FuY2Vyc1snYnJlYXN0X2NhbmNlcjInXV07XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJXYXJuaW5nXCIsIG1zZyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoZSwgb3B0cykge1xuXHRsZXQgZiA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRpZihmKSB7XG5cdFx0bGV0IHJpc2tfZmFjdG9ycztcblx0XHRsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmKGUudGFyZ2V0LnJlc3VsdC5zdGFydHNXaXRoKFwiQk9BRElDRUEgaW1wb3J0IHBlZGlncmVlIGZpbGUgZm9ybWF0IDQuMFwiKSkge1xuXHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRCb2FkaWNlYVY0KGUudGFyZ2V0LnJlc3VsdCwgNCk7XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2UgaWYoZS50YXJnZXQucmVzdWx0LnN0YXJ0c1dpdGgoXCJCT0FESUNFQSBpbXBvcnQgcGVkaWdyZWUgZmlsZSBmb3JtYXQgMi4wXCIpKSB7XG5cdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gcmVhZEJvYWRpY2VhVjQoZS50YXJnZXQucmVzdWx0LCAyKTtcblx0XHRcdFx0XHRjYW5yaXNrX3ZhbGlkYXRpb24ob3B0cyk7XG5cdFx0XHRcdH0gZWxzZSBpZihlLnRhcmdldC5yZXN1bHQuc3RhcnRzV2l0aChcIiMjXCIpICYmIGUudGFyZ2V0LnJlc3VsdC5pbmRleE9mKFwiQ2FuUmlza1wiKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRsZXQgY2Fucmlza19kYXRhID0gcmVhZENhblJpc2tWMShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdHJpc2tfZmFjdG9ycyA9IGNhbnJpc2tfZGF0YVswXTtcblx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBjYW5yaXNrX2RhdGFbMV07XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBKU09OLnBhcnNlKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdFx0fSBjYXRjaChlcnIpIHtcblx0XHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRMaW5rYWdlKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHZhbGlkYXRlX3BlZGlncmVlKG9wdHMpO1xuXHRcdFx0fSBjYXRjaChlcnIxKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyMSwgZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdFx0cGVkaWdyZWVfdXRpbC5tZXNzYWdlcyhcIkZpbGUgRXJyb3JcIiwgKCBlcnIxLm1lc3NhZ2UgPyBlcnIxLm1lc3NhZ2UgOiBlcnIxKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKG9wdHMuZGF0YXNldCk7XG5cdFx0XHR0cnl7XG5cdFx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0XHRcdGlmKHJpc2tfZmFjdG9ycyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmlza19mYWN0b3JzKTtcblx0XHRcdFx0XHQvLyBsb2FkIHJpc2sgZmFjdG9ycyAtIGZpcmUgcmlza2ZhY3RvckNoYW5nZSBldmVudFxuXHRcdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ3Jpc2tmYWN0b3JDaGFuZ2UnLCBbb3B0cywgcmlza19mYWN0b3JzXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pOyBcdC8vIHRyaWdnZXIgZmhDaGFuZ2UgZXZlbnRcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSBGSCBzZWN0aW9uXG5cdFx0XHRcdFx0YWNjX0ZhbUhpc3RfdGlja2VkKCk7XG5cdFx0XHRcdFx0YWNjX0ZhbUhpc3RfTGVhdmUoKTtcblx0XHRcdFx0XHRSRVNVTFQuRkxBR19GQU1JTFlfTU9EQUwgPSB0cnVlO1xuXHRcdFx0XHR9IGNhdGNoKGVycjMpIHtcblx0XHRcdFx0XHQvLyBpZ25vcmUgZXJyb3Jcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaChlcnIyKSB7XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsICggZXJyMi5tZXNzYWdlID8gZXJyMi5tZXNzYWdlIDogZXJyMikpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0cmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0cGVkaWdyZWVfdXRpbC5tZXNzYWdlcyhcIkZpbGUgRXJyb3JcIiwgXCJGaWxlIGNvdWxkIG5vdCBiZSByZWFkISBDb2RlIFwiICsgZXZlbnQudGFyZ2V0LmVycm9yLmNvZGUpO1xuXHRcdH07XG5cdFx0cmVhZGVyLnJlYWRBc1RleHQoZik7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5lcnJvcihcIkZpbGUgY291bGQgbm90IGJlIHJlYWQhXCIpO1xuXHR9XG5cdCQoXCIjbG9hZFwiKVswXS52YWx1ZSA9ICcnOyAvLyByZXNldCB2YWx1ZVxufVxuXG4vL1xuLy8gaHR0cHM6Ly93d3cuY29nLWdlbm9taWNzLm9yZy9wbGluay8xLjkvZm9ybWF0cyNwZWRcbi8vIGh0dHBzOi8vd3d3LmNvZy1nZW5vbWljcy5vcmcvcGxpbmsvMS45L2Zvcm1hdHMjZmFtXG4vL1x0MS4gRmFtaWx5IElEICgnRklEJylcbi8vXHQyLiBXaXRoaW4tZmFtaWx5IElEICgnSUlEJzsgY2Fubm90IGJlICcwJylcbi8vXHQzLiBXaXRoaW4tZmFtaWx5IElEIG9mIGZhdGhlciAoJzAnIGlmIGZhdGhlciBpc24ndCBpbiBkYXRhc2V0KVxuLy9cdDQuIFdpdGhpbi1mYW1pbHkgSUQgb2YgbW90aGVyICgnMCcgaWYgbW90aGVyIGlzbid0IGluIGRhdGFzZXQpXG4vL1x0NS4gU2V4IGNvZGUgKCcxJyA9IG1hbGUsICcyJyA9IGZlbWFsZSwgJzAnID0gdW5rbm93bilcbi8vXHQ2LiBQaGVub3R5cGUgdmFsdWUgKCcxJyA9IGNvbnRyb2wsICcyJyA9IGNhc2UsICctOScvJzAnL25vbi1udW1lcmljID0gbWlzc2luZyBkYXRhIGlmIGNhc2UvY29udHJvbClcbi8vICA3LiBHZW5vdHlwZXMgKGNvbHVtbiA3IG9ud2FyZHMpO1xuLy9cdCBjb2x1bW5zIDcgJiA4IGFyZSBhbGxlbGUgY2FsbHMgZm9yIGZpcnN0IHZhcmlhbnQgKCcwJyA9IG5vIGNhbGwpOyBjb2x1bW1ucyA5ICYgMTAgYXJlIGNhbGxzIGZvciBzZWNvbmQgdmFyaWFudCBldGMuXG5leHBvcnQgZnVuY3Rpb24gcmVhZExpbmthZ2UoYm9hZGljZWFfbGluZXMpIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHRsZXQgZmFtaWQ7XG5cdGZvcihsZXQgaSA9IDA7aSA8IGxpbmVzLmxlbmd0aDtpKyspe1xuXHQgICBsZXQgYXR0ciA9ICQubWFwKGxpbmVzW2ldLnRyaW0oKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gdmFsLnRyaW0oKTt9KTtcblx0ICAgaWYoYXR0ci5sZW5ndGggPCA1KVxuXHRcdCAgIHRocm93KCd1bmtub3duIGZvcm1hdCcpO1xuXHQgICBsZXQgc2V4ID0gKGF0dHJbNF0gPT0gJzEnID8gJ00nIDogKGF0dHJbNF0gPT0gJzInID8gJ0YnIDogJ1UnKSk7XG5cdCAgIGxldCBpbmRpID0ge1xuXHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdCdkaXNwbGF5X25hbWUnOiBhdHRyWzFdLFxuXHRcdFx0J25hbWUnOlx0YXR0clsxXSxcblx0XHRcdCdzZXgnOiBzZXhcblx0XHR9O1xuXHRcdGlmKGF0dHJbMl0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbMl07XG5cdFx0aWYoYXR0clszXSAhPT0gXCIwXCIpIGluZGkubW90aGVyID0gYXR0clszXTtcblxuXHRcdGlmICh0eXBlb2YgZmFtaWQgIT0gJ3VuZGVmaW5lZCcgJiYgZmFtaWQgIT09IGluZGkuZmFtaWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ211bHRpcGxlIGZhbWlseSBJRHMgZm91bmQgb25seSB1c2luZyBmYW1pZCA9ICcrZmFtaWQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdGlmKGF0dHJbNV0gPT0gXCIyXCIpIGluZGkuYWZmZWN0ZWQgPSAyO1xuXHRcdC8vIGFkZCBnZW5vdHlwZSBjb2x1bW5zXG5cdFx0aWYoYXR0ci5sZW5ndGggPiA2KSB7XG5cdFx0XHRpbmRpLmFsbGVsZXMgPSBcIlwiO1xuXHRcdFx0Zm9yKGxldCBqPTY7IGo8YXR0ci5sZW5ndGg7IGorPTIpIHtcblx0XHRcdFx0aW5kaS5hbGxlbGVzICs9IGF0dHJbal0gKyBcIi9cIiArIGF0dHJbaisxXSArIFwiO1wiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHBlZC51bnNoaWZ0KGluZGkpO1xuXHRcdGZhbWlkID0gYXR0clswXTtcblx0fVxuXHRyZXR1cm4gcHJvY2Vzc19wZWQocGVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRDYW5SaXNrVjEoYm9hZGljZWFfbGluZXMpIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHRsZXQgaGRyID0gW107ICAvLyBjb2xsZWN0IHJpc2sgZmFjdG9yIGhlYWRlciBsaW5lc1xuXHQvLyBhc3N1bWVzIHR3byBsaW5lIGhlYWRlclxuXHRmb3IobGV0IGkgPSAwO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0XHRsZXQgbG4gPSBsaW5lc1tpXS50cmltKCk7XG5cdFx0aWYobG4uc3RhcnRzV2l0aChcIiMjXCIpKSB7XG5cdFx0XHRpZihsbi5zdGFydHNXaXRoKFwiIyNDYW5SaXNrXCIpICYmIGxuLmluZGV4T2YoXCI7XCIpID4gLTEpIHsgICAvLyBjb250YWlucyBzdXJnaWNhbCBvcCBkYXRhXG5cdFx0XHRcdGxldCBvcHMgPSBsbi5zcGxpdChcIjtcIik7XG5cdFx0XHRcdGZvcihsZXQgaj0xOyBqPG9wcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGxldCBvcGRhdGEgPSBvcHNbal0uc3BsaXQoXCI9XCIpO1xuXHRcdFx0XHRcdGlmKG9wZGF0YS5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0XHRcdGhkci5wdXNoKG9wc1tqXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihsbi5pbmRleE9mKFwiQ2FuUmlza1wiKSA9PT0gLTEgJiYgIWxuLnN0YXJ0c1dpdGgoXCIjI0ZhbUlEXCIpKSB7XG5cdFx0XHRcdGhkci5wdXNoKGxuLnJlcGxhY2UoXCIjI1wiLCBcIlwiKSk7XG5cdFx0XHR9XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRsZXQgZGVsaW0gPSAvXFx0Lztcblx0XHRpZihsbi5pbmRleE9mKCdcXHQnKSA8IDApIHtcblx0XHRcdGRlbGltID0gL1xccysvO1xuXHRcdFx0Y29uc29sZS5sb2coXCJOT1QgVEFCIERFTElNXCIpO1xuXHRcdH1cblx0XHRsZXQgYXR0ciA9ICQubWFwKGxuLnNwbGl0KGRlbGltKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cblx0XHRpZihhdHRyLmxlbmd0aCA+IDEpIHtcblx0XHRcdGxldCBpbmRpID0ge1xuXHRcdFx0XHQnZmFtaWQnOiBhdHRyWzBdLFxuXHRcdFx0XHQnZGlzcGxheV9uYW1lJzogYXR0clsxXSxcblx0XHRcdFx0J25hbWUnOlx0YXR0clszXSxcblx0XHRcdFx0J3NleCc6IGF0dHJbNl0sXG5cdFx0XHRcdCdzdGF0dXMnOiBhdHRyWzhdXG5cdFx0XHR9O1xuXHRcdFx0aWYoYXR0clsyXSA9PSAxKSBpbmRpLnByb2JhbmQgPSB0cnVlO1xuXHRcdFx0aWYoYXR0cls0XSAhPT0gXCIwXCIpIGluZGkuZmF0aGVyID0gYXR0cls0XTtcblx0XHRcdGlmKGF0dHJbNV0gIT09IFwiMFwiKSBpbmRpLm1vdGhlciA9IGF0dHJbNV07XG5cdFx0XHRpZihhdHRyWzddICE9PSBcIjBcIikgaW5kaS5tenR3aW4gPSBhdHRyWzddO1xuXHRcdFx0aWYoYXR0cls5XSAhPT0gXCIwXCIpIGluZGkuYWdlID0gYXR0cls5XTtcblx0XHRcdGlmKGF0dHJbMTBdICE9PSBcIjBcIikgaW5kaS55b2IgPSBhdHRyWzEwXTtcblxuXHRcdFx0bGV0IGlkeCA9IDExO1xuXHRcdFx0JC5lYWNoKGNhbmNlcnMsIGZ1bmN0aW9uKGNhbmNlciwgZGlhZ25vc2lzX2FnZSkge1xuXHRcdFx0XHQvLyBBZ2UgYXQgMXN0IGNhbmNlciBvciAwID0gdW5hZmZlY3RlZCwgQVUgPSB1bmtub3duIGFnZSBhdCBkaWFnbm9zaXMgKGFmZmVjdGVkIHVua25vd24pXG5cdFx0XHRcdGlmKGF0dHJbaWR4XSAhPT0gXCIwXCIpIHtcblx0XHRcdFx0XHRpbmRpW2RpYWdub3Npc19hZ2VdID0gYXR0cltpZHhdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmKGF0dHJbaWR4KytdICE9PSBcIjBcIikgaW5kaS5hc2hrZW5hemkgPSAxO1xuXHRcdFx0Ly8gQlJDQTEsIEJSQ0EyLCBQQUxCMiwgQVRNLCBDSEVLMiwgLi4uLiBnZW5ldGljIHRlc3RzXG5cdFx0XHQvLyBnZW5ldGljIHRlc3QgdHlwZSwgMCA9IHVudGVzdGVkLCBTID0gbXV0YXRpb24gc2VhcmNoLCBUID0gZGlyZWN0IGdlbmUgdGVzdFxuXHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHJlc3VsdCwgMCA9IHVudGVzdGVkLCBQID0gcG9zaXRpdmUsIE4gPSBuZWdhdGl2ZVxuXHRcdFx0Zm9yKGxldCBqPTA7IGo8Z2VuZXRpY190ZXN0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGxldCBnZW5lX3Rlc3QgPSBhdHRyW2lkeF0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0XHRpZihnZW5lX3Rlc3RbMF0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKChnZW5lX3Rlc3RbMF0gPT09ICdTJyB8fCBnZW5lX3Rlc3RbMF0gPT09ICdUJykgJiYgKGdlbmVfdGVzdFsxXSA9PT0gJ1AnIHx8IGdlbmVfdGVzdFsxXSA9PT0gJ04nKSlcblx0XHRcdFx0XHRcdGluZGlbZ2VuZXRpY190ZXN0W2pdICsgJ19nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGdlbmVfdGVzdFswXSwgJ3Jlc3VsdCc6IGdlbmVfdGVzdFsxXX07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBnZW5lX3Rlc3RbMF0gKyBcIiBcIiArIGdlbmVfdGVzdFsxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9XG5cdFx0XHQvLyBzdGF0dXMsIDAgPSB1bnNwZWNpZmllZCwgTiA9IG5lZ2F0aXZlLCBQID0gcG9zaXRpdmVcblx0XHRcdGxldCBwYXRoX3Rlc3QgPSBhdHRyW2lkeF0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cGF0aF90ZXN0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHBhdGhfdGVzdFtqXSAhPT0gJzAnKSB7XG5cdFx0XHRcdFx0aWYocGF0aF90ZXN0W2pdID09PSAnTicgfHwgcGF0aF90ZXN0W2pdID09PSAnUCcpXG5cdFx0XHRcdFx0XHRpbmRpW3BhdGhvbG9neV90ZXN0c1tqXSArICdfYmNfcGF0aG9sb2d5J10gPSBwYXRoX3Rlc3Rbal07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgUEFUSE9MT0dZIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgK3BhdGhvbG9neV90ZXN0c1tqXSArIFwiIFwiICtwYXRoX3Rlc3Rbal0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBbaGRyLCBwcm9jZXNzX3BlZChwZWQpXTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRyZXR1cm4gW2hkciwgcGVkXTtcblx0fVxufVxuXG4vLyByZWFkIGJvYWRpY2VhIGZvcm1hdCB2NCAmIHYyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEJvYWRpY2VhVjQoYm9hZGljZWFfbGluZXMsIHZlcnNpb24pIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHQvLyBhc3N1bWVzIHR3byBsaW5lIGhlYWRlclxuXHRmb3IobGV0IGkgPSAyO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0ICAgbGV0IGF0dHIgPSAkLm1hcChsaW5lc1tpXS50cmltKCkuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cdFx0aWYoYXR0ci5sZW5ndGggPiAxKSB7XG5cdFx0XHRsZXQgaW5kaSA9IHtcblx0XHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdFx0J2Rpc3BsYXlfbmFtZSc6IGF0dHJbMV0sXG5cdFx0XHRcdCduYW1lJzpcdGF0dHJbM10sXG5cdFx0XHRcdCdzZXgnOiBhdHRyWzZdLFxuXHRcdFx0XHQnc3RhdHVzJzogYXR0cls4XVxuXHRcdFx0fTtcblx0XHRcdGlmKGF0dHJbMl0gPT0gMSkgaW5kaS5wcm9iYW5kID0gdHJ1ZTtcblx0XHRcdGlmKGF0dHJbNF0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbNF07XG5cdFx0XHRpZihhdHRyWzVdICE9PSBcIjBcIikgaW5kaS5tb3RoZXIgPSBhdHRyWzVdO1xuXHRcdFx0aWYoYXR0cls3XSAhPT0gXCIwXCIpIGluZGkubXp0d2luID0gYXR0cls3XTtcblx0XHRcdGlmKGF0dHJbOV0gIT09IFwiMFwiKSBpbmRpLmFnZSA9IGF0dHJbOV07XG5cdFx0XHRpZihhdHRyWzEwXSAhPT0gXCIwXCIpIGluZGkueW9iID0gYXR0clsxMF07XG5cblx0XHRcdGxldCBpZHggPSAxMTtcblx0XHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdFx0Ly8gQWdlIGF0IDFzdCBjYW5jZXIgb3IgMCA9IHVuYWZmZWN0ZWQsIEFVID0gdW5rbm93biBhZ2UgYXQgZGlhZ25vc2lzIChhZmZlY3RlZCB1bmtub3duKVxuXHRcdFx0XHRpZihhdHRyW2lkeF0gIT09IFwiMFwiKSB7XG5cdFx0XHRcdFx0aW5kaVtkaWFnbm9zaXNfYWdlXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZHgrKztcblx0XHRcdH0pO1xuXG5cdFx0XHRpZih2ZXJzaW9uID09PSA0KSB7XG5cdFx0XHRcdGlmKGF0dHJbaWR4KytdICE9PSBcIjBcIikgaW5kaS5hc2hrZW5hemkgPSAxO1xuXHRcdFx0XHQvLyBCUkNBMSwgQlJDQTIsIFBBTEIyLCBBVE0sIENIRUsyIGdlbmV0aWMgdGVzdHNcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHR5cGUsIDAgPSB1bnRlc3RlZCwgUyA9IG11dGF0aW9uIHNlYXJjaCwgVCA9IGRpcmVjdCBnZW5lIHRlc3Rcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHJlc3VsdCwgMCA9IHVudGVzdGVkLCBQID0gcG9zaXRpdmUsIE4gPSBuZWdhdGl2ZVxuXHRcdFx0XHRmb3IobGV0IGo9MDsgajw1OyBqKyspIHtcblx0XHRcdFx0XHRpZHgrPTI7XG5cdFx0XHRcdFx0aWYoYXR0cltpZHgtMl0gIT09ICcwJykge1xuXHRcdFx0XHRcdFx0aWYoKGF0dHJbaWR4LTJdID09PSAnUycgfHwgYXR0cltpZHgtMl0gPT09ICdUJykgJiYgKGF0dHJbaWR4LTFdID09PSAnUCcgfHwgYXR0cltpZHgtMV0gPT09ICdOJykpXG5cdFx0XHRcdFx0XHRcdGluZGlbZ2VuZXRpY190ZXN0W2pdICsgJ19nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogYXR0cltpZHgtMV19O1xuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1VOUkVDT0dOSVNFRCBHRU5FIFRFU1QgT04gTElORSAnKyAoaSsxKSArIFwiOiBcIiArIGF0dHJbaWR4LTJdICsgXCIgXCIgKyBhdHRyW2lkeC0xXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHZlcnNpb24gPT09IDIpIHtcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IEJSQ0ExLCBCUkNBMlxuXHRcdFx0XHQvLyB0eXBlLCAwID0gdW50ZXN0ZWQsIFMgPSBtdXRhdGlvbiBzZWFyY2gsIFQgPSBkaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdC8vIHJlc3VsdCwgMCA9IHVudGVzdGVkLCBOID0gbm8gbXV0YXRpb24sIDEgPSBCUkNBMSBwb3NpdGl2ZSwgMiA9IEJSQ0EyIHBvc2l0aXZlLCAzID0gQlJDQTEvMiBwb3NpdGl2ZVxuXHRcdFx0XHRpZHgrPTI7IFx0Ly8gZ3Rlc3Rcblx0XHRcdFx0aWYoYXR0cltpZHgtMl0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKChhdHRyW2lkeC0yXSA9PT0gJ1MnIHx8IGF0dHJbaWR4LTJdID09PSAnVCcpKSB7XG5cdFx0XHRcdFx0XHRpZihhdHRyW2lkeC0xXSA9PT0gJ04nKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnTid9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzEnKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnUCd9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzInKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnTid9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzMnKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnUCd9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBhdHRyW2lkeC0yXSArIFwiIFwiICsgYXR0cltpZHgtMV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gc3RhdHVzLCAwID0gdW5zcGVjaWZpZWQsIE4gPSBuZWdhdGl2ZSwgUCA9IHBvc2l0aXZlXG5cdFx0XHRmb3IobGV0IGo9MDsgajxwYXRob2xvZ3lfdGVzdHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoYXR0cltpZHhdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZihhdHRyW2lkeF0gPT09ICdOJyB8fCBhdHRyW2lkeF0gPT09ICdQJylcblx0XHRcdFx0XHRcdGluZGlbcGF0aG9sb2d5X3Rlc3RzW2pdICsgJ19iY19wYXRob2xvZ3knXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1VOUkVDT0dOSVNFRCBQQVRIT0xPR1kgT04gTElORSAnKyAoaSsxKSArIFwiOiBcIiArcGF0aG9sb2d5X3Rlc3RzW2pdICsgXCIgXCIgK2F0dHJbaWR4XSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9XG5cdFx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBwcm9jZXNzX3BlZChwZWQpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdHJldHVybiBwZWQ7XG5cdH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc19wZWQocGVkKSB7XG5cdC8vIGZpbmQgdGhlIGxldmVsIG9mIGluZGl2aWR1YWxzIGluIHRoZSBwZWRpZ3JlZVxuXHRmb3IobGV0IGo9MDtqPDI7aisrKSB7XG5cdFx0Zm9yKGxldCBpPTA7aTxwZWQubGVuZ3RoO2krKykge1xuXHRcdFx0Z2V0TGV2ZWwocGVkLCBwZWRbaV0ubmFtZSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gZmluZCB0aGUgbWF4IGxldmVsIChpLmUuIHRvcF9sZXZlbClcblx0bGV0IG1heF9sZXZlbCA9IDA7XG5cdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRbaV0ubGV2ZWwgJiYgcGVkW2ldLmxldmVsID4gbWF4X2xldmVsKVxuXHRcdFx0bWF4X2xldmVsID0gcGVkW2ldLmxldmVsO1xuXHR9XG5cblx0Ly8gaWRlbnRpZnkgdG9wX2xldmVsIGFuZCBvdGhlciBub2RlcyB3aXRob3V0IHBhcmVudHNcblx0Zm9yKGxldCBpPTA7aTxwZWQubGVuZ3RoO2krKykge1xuXHRcdGlmKHBlZGlncmVlX3V0aWwuZ2V0RGVwdGgocGVkLCBwZWRbaV0ubmFtZSkgPT0gMSkge1xuXHRcdFx0aWYocGVkW2ldLmxldmVsICYmIHBlZFtpXS5sZXZlbCA9PSBtYXhfbGV2ZWwpIHtcblx0XHRcdFx0cGVkW2ldLnRvcF9sZXZlbCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwZWRbaV0ubm9wYXJlbnRzID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyAxLiBsb29rIGZvciBwYXJ0bmVycyBwYXJlbnRzXG5cdFx0XHRcdGxldCBwaWR4ID0gZ2V0UGFydG5lcklkeChwZWQsIHBlZFtpXSk7XG5cdFx0XHRcdGlmKHBpZHggPiAtMSkge1xuXHRcdFx0XHRcdGlmKHBlZFtwaWR4XS5tb3RoZXIpIHtcblx0XHRcdFx0XHRcdHBlZFtpXS5tb3RoZXIgPSBwZWRbcGlkeF0ubW90aGVyO1xuXHRcdFx0XHRcdFx0cGVkW2ldLmZhdGhlciA9IHBlZFtwaWR4XS5mYXRoZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gMi4gb3IgYWRvcHQgcGFyZW50cyBmcm9tIGxldmVsIGFib3ZlXG5cdFx0XHRcdGlmKCFwZWRbaV0ubW90aGVyKXtcblx0XHRcdFx0XHRmb3IobGV0IGo9MDsgajxwZWQubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRcdGlmKHBlZFtpXS5sZXZlbCA9PSAocGVkW2pdLmxldmVsLTEpKSB7XG5cdFx0XHRcdFx0XHRcdHBpZHggPSBnZXRQYXJ0bmVySWR4KHBlZCwgcGVkW2pdKTtcblx0XHRcdFx0XHRcdFx0aWYocGlkeCA+IC0xKSB7XG5cdFx0XHRcdFx0XHRcdFx0cGVkW2ldLm1vdGhlciA9IChwZWRbal0uc2V4ID09PSAnRicgPyBwZWRbal0ubmFtZSA6IHBlZFtwaWR4XS5uYW1lKTtcblx0XHRcdFx0XHRcdFx0XHRwZWRbaV0uZmF0aGVyID0gKHBlZFtqXS5zZXggPT09ICdNJyA/IHBlZFtqXS5uYW1lIDogcGVkW3BpZHhdLm5hbWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSBwZWRbaV0udG9wX2xldmVsO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcGVkO1xufVxuXG4vLyBnZXQgdGhlIHBhcnRuZXJzIGZvciBhIGdpdmVuIG5vZGVcbmZ1bmN0aW9uIGdldFBhcnRuZXJJZHgoZGF0YXNldCwgYW5vZGUpIHtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBibm9kZSA9IGRhdGFzZXRbaV07XG5cdFx0aWYoYW5vZGUubmFtZSA9PT0gYm5vZGUubW90aGVyKVxuXHRcdFx0cmV0dXJuIHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGJub2RlLmZhdGhlcik7XG5cdFx0ZWxzZSBpZihhbm9kZS5uYW1lID09PSBibm9kZS5mYXRoZXIpXG5cdFx0XHRyZXR1cm4gcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgYm5vZGUubW90aGVyKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbi8vIGZvciBhIGdpdmVuIGluZGl2aWR1YWwgYXNzaWduIGxldmVscyB0byBhIHBhcmVudHMgYW5jZXN0b3JzXG5mdW5jdGlvbiBnZXRMZXZlbChkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGxldmVsID0gKGRhdGFzZXRbaWR4XS5sZXZlbCA/IGRhdGFzZXRbaWR4XS5sZXZlbCA6IDApO1xuXHR1cGRhdGVfcGFyZW50c19sZXZlbChpZHgsIGxldmVsLCBkYXRhc2V0KTtcbn1cblxuLy8gcmVjdXJzaXZlbHkgdXBkYXRlIHBhcmVudHMgbGV2ZWxzXG5mdW5jdGlvbiB1cGRhdGVfcGFyZW50c19sZXZlbChpZHgsIGxldmVsLCBkYXRhc2V0KSB7XG5cdGxldCBwYXJlbnRzID0gWydtb3RoZXInLCAnZmF0aGVyJ107XG5cdGxldmVsKys7XG5cdGZvcihsZXQgaT0wOyBpPHBhcmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGlkeCA9IHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XVtwYXJlbnRzW2ldXSk7XG5cdFx0aWYocGlkeCA+PSAwKSB7XG5cdFx0XHRsZXQgbWEgPSBkYXRhc2V0W3BlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XS5tb3RoZXIpXTtcblx0XHRcdGxldCBwYSA9IGRhdGFzZXRbcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLmZhdGhlcildO1xuXHRcdFx0aWYoIWRhdGFzZXRbcGlkeF0ubGV2ZWwgfHwgZGF0YXNldFtwaWR4XS5sZXZlbCA8IGxldmVsKSB7XG5cdFx0XHRcdG1hLmxldmVsID0gbGV2ZWw7XG5cdFx0XHRcdHBhLmxldmVsID0gbGV2ZWw7XG5cdFx0XHR9XG5cblx0XHRcdGlmKG1hLmxldmVsIDwgcGEubGV2ZWwpIHtcblx0XHRcdFx0bWEubGV2ZWwgPSBwYS5sZXZlbDtcblx0XHRcdH0gZWxzZSBpZihwYS5sZXZlbCA8IG1hLmxldmVsKSB7XG5cdFx0XHRcdHBhLmxldmVsID0gbWEubGV2ZWw7XG5cdFx0XHR9XG5cdFx0XHR1cGRhdGVfcGFyZW50c19sZXZlbChwaWR4LCBsZXZlbCwgZGF0YXNldCk7XG5cdFx0fVxuXHR9XG59XG4iLCIvLyBwZWRpZ3JlZSBmb3JtXG5pbXBvcnQge3JlYnVpbGQsIHN5bmNUd2luc30gZnJvbSAnLi9wZWRpZ3JlZS5qcyc7XG5pbXBvcnQge2NvcHlfZGF0YXNldCwgc2V0UHJvYmFuZCwgZ2V0SWR4QnlOYW1lLCBnZXROb2RlQnlOYW1lfSBmcm9tICcuL3BlZGlncmVlX3V0aWxzLmpzJztcbmltcG9ydCB7Y3VycmVudCBhcyBwZWRjYWNoZV9jdXJyZW50fSBmcm9tICcuL3BlZGNhY2hlLmpzJztcblxuJChcIiNzZWxlY3RfYWxsX2dlbmVfdGVzdHNcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uIChfZSkge1xuXHRpZih0aGlzLnZhbHVlID09PSBcIlNcIikge1xuXHRcdC8vIHNlbGVjdCBhbGwgbXV0YXRpb24gc2VhcmNoIHRvIGJlIG5lZ2F0aXZlXG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdCddXCIpLnZhbChcIlNcIikuY2hhbmdlKCk7XG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdF9yZXN1bHQnXVwiKS52YWwoXCJOXCIpLmNoYW5nZSgpO1xuXHR9IGVsc2UgaWYodGhpcy52YWx1ZSA9PT0gXCJUXCIpIHtcblx0XHQvLyBzZWxlY3QgYWxsIGRpcmVjdCBnZW5lIHRlc3RzIHRvIGJlIG5lZ2F0aXZlXG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdCddXCIpLnZhbChcIlRcIikuY2hhbmdlKCk7XG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdF9yZXN1bHQnXVwiKS52YWwoXCJOXCIpLmNoYW5nZSgpO1xuXHR9IGVsc2UgaWYodGhpcy52YWx1ZSA9PT0gXCJOXCIpIHtcblx0XHQvLyBzZWxlY3QgYWxsIGdlbmUgdGVzdHMgdG8gYmUgbmVnYXRpdmVcblx0XHQkKFwiI2dlbmVfdGVzdFwiKS5maW5kKFwic2VsZWN0W25hbWUkPSdfZ2VuZV90ZXN0X3Jlc3VsdCddXCIpLnZhbChcIk5cIikuY2hhbmdlKCk7XG5cdH0gZWxzZSBpZih0aGlzLnZhbHVlID09PSBcInJlc2V0XCIpIHtcblx0XHQkKFwiI2dlbmVfdGVzdFwiKS5maW5kKFwic2VsZWN0W25hbWUkPSdfZ2VuZV90ZXN0J11cIikudmFsKFwiLVwiKS5jaGFuZ2UoKTtcblx0XHQkKFwiI2dlbmVfdGVzdFwiKS5maW5kKFwic2VsZWN0W25hbWUkPSdfZ2VuZV90ZXN0X3Jlc3VsdCddXCIpLnZhbChcIi1cIikuY2hhbmdlKCk7XG5cdH1cbn0pO1xuXG4kKCcjYWNjX0ZhbUhpc3RfZGl2Jykub24oJ2NsaWNrJywgJyNpZF9wcm9iYW5kLCAjaWRfZXhjbHVkZScsIGZ1bmN0aW9uKF9lKSB7XG5cdGxldCBuYW1lID0gJCgnI2lkX25hbWUnKS52YWwoKTtcblx0aWYoJCh0aGlzKS5hdHRyKFwiaWRcIikgPT09ICdpZF9wcm9iYW5kJyAmJiAkKHRoaXMpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0bGV0IG1zZyA9ICQoXCIjcHJvYmFuZF9zd2l0Y2hfZGlhbG9nXCIpLnRleHQoKTtcblxuXHRcdCQoJzxkaXYgaWQ9XCJtc2dEaWFsb2dcIj4nK21zZysnPC9kaXY+JykuZGlhbG9nKHtcblx0XHRcdHRpdGxlOiAkKFwiI3Byb2JhbmRfc3dpdGNoX2RpYWxvZ1wiKS5kYXRhKFwidGl0bGVcIiksXG5cdFx0XHR3aWR0aDogMzUwLFxuXHRcdFx0YnV0dG9uczogW3tcblx0XHRcdFx0XHR0ZXh0OiAkKFwiI3Byb2JhbmRfc3dpdGNoX2RpYWxvZ1wiKS5kYXRhKFwiY29udGludWVcIiksXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJyk7XG5cdFx0XHRcdFx0XHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdFx0XHRcdFx0XHRzZXRQcm9iYW5kKG9wdHMuZGF0YXNldCwgbmFtZSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdFx0XHRcdFx0cmVzZXRfbl9zeW5jKG9wdHMpO1xuXHRcdFx0XHRcdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LHtcblx0XHRcdFx0XHR0ZXh0OiAkKFwiI3Byb2JhbmRfc3dpdGNoX2RpYWxvZ1wiKS5kYXRhKFwiY2FuY2VsXCIpLFxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCAkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHRcdCAkKFwiI2lkX3Byb2JhbmRcIikucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHRcdFx0XHRcdCAkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XVxuXHRcdH0pO1xuXHR9IGVsc2UgaWYoJCh0aGlzKS5hdHRyKFwiaWRcIikgPT09ICdpZF9leGNsdWRlJykge1xuXHRcdGxldCBkYXRhc2V0ID0gcGVkY2FjaGVfY3VycmVudChvcHRzKTtcblx0XHRvcHRzLmRhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdFx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIG5hbWUpO1xuXHRcdGlmKCQodGhpcykuaXMoJzpjaGVja2VkJykpXG5cdFx0XHRvcHRzLmRhdGFzZXRbaWR4XS5leGNsdWRlID0gdHJ1ZTtcblx0XHRlbHNlXG5cdFx0XHRkZWxldGUgb3B0cy5kYXRhc2V0W2lkeF0uZXhjbHVkZTtcblx0XHRyZWJ1aWxkKG9wdHMpO1xuXHR9XG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZShvcHRzKSB7XG5cdCQoJy5ub2RlX3NhdmUnKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRzYXZlKG9wdHMpO1xuXHR9KTtcblxuXHQvLyBhZHZhbmNlZCBvcHRpb25zIC0gbW9kZWwgcGFyYW1ldGVyc1xuXHQkKFwiaW5wdXRbaWQkPSdfbXV0X3NlbnNpdGl2aXR5J10sIGlucHV0W2lkJD0nX211dF9mcmVxdWVuY3knXVwiKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHQkKCcjaWRfdXNlX2N1c3RvbV9tdXRhdGlvbl9zZW5zaXRpdml0aWVzJykuY2hhbmdlKGZ1bmN0aW9uKCkge1xuXHRcdCQoXCJpbnB1dFtpZCQ9J19tdXRfc2Vuc2l0aXZpdHknXVwiKS5wcm9wKCdkaXNhYmxlZCcsICEkKHRoaXMpLmlzKFwiOmNoZWNrZWRcIikpO1xuXHR9KTtcblxuXHQkKCcjaWRfbXV0YXRpb25fZnJlcXVlbmNpZXMnKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0JChcImlucHV0W2lkJD0nX211dF9mcmVxdWVuY3knXVwiKS5wcm9wKCdkaXNhYmxlZCcsICh0aGlzLnZhbHVlICE9PSAnQ3VzdG9tJykpO1xuXHRcdC8vIG5vdGUgcGVkaWdyZWVfZm9ybS5tdXRhdGlvbl9mcmVxdWVuY2llcyBpcyBzZXQgaW4gdGhlIHZpZXcgc2VlIHBlZGlncmVlX3NlY3Rpb25fanMuaHRtbFxuXHRcdGlmKHBlZGlncmVlX2Zvcm0uYmNfbXV0YXRpb25fZnJlcXVlbmNpZXMgJiYgdGhpcy52YWx1ZSAhPT0gJ0N1c3RvbScpIHtcblx0XHRcdGxldCBiY21mcmVxID0gcGVkaWdyZWVfZm9ybS5iY19tdXRhdGlvbl9mcmVxdWVuY2llc1t0aGlzLnZhbHVlXTtcblx0XHRcdGZvciAobGV0IGdlbmUgaW4gYmNtZnJlcSlcblx0XHRcdFx0JCgnI2lkXycrZ2VuZS50b0xvd2VyQ2FzZSgpKydfYmNfbXV0X2ZyZXF1ZW5jeScpLnZhbChiY21mcmVxW2dlbmVdKTtcblxuXHRcdFx0bGV0IG9iY21mcmVxID0gcGVkaWdyZWVfZm9ybS5vY19tdXRhdGlvbl9mcmVxdWVuY2llc1t0aGlzLnZhbHVlXTtcblx0XHRcdGZvciAobGV0IGdlbmUgaW4gb2JjbWZyZXEpXG5cdFx0XHRcdCQoJyNpZF8nK2dlbmUudG9Mb3dlckNhc2UoKSsnX29jX211dF9mcmVxdWVuY3knKS52YWwob2JjbWZyZXFbZ2VuZV0pO1xuXHRcdH1cblxuXHRcdGlmKHRoaXMudmFsdWUgPT09ICdBc2hrZW5hemknKSB7ICAvLyB1cGRhdGUgY2FucmlzayBGSCByYWRpbyBzZXR0aW5nc1xuXHRcdFx0JCgnI29yaWdfYXNoaycpLnByb3AoIFwiY2hlY2tlZFwiLCB0cnVlICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQoJyNvcmlnX3VuaycpLnByb3AoIFwiY2hlY2tlZFwiLCB0cnVlICk7XG5cdFx0fVxuXHRcdHNhdmVfYXNoa24ob3B0cyk7IC8vIHNhdmUgYXNoa2VuYXppIHVwZGF0ZXNcblx0fSk7XG59XG5cbi8vIGhhbmRsZSBmYW1pbHkgaGlzdG9yeSBjaGFuZ2UgZXZlbnRzICh1bmRvL3JlZG8vZGVsZXRlKVxuJChkb2N1bWVudCkub24oJ2ZoQ2hhbmdlJywgZnVuY3Rpb24oZSwgb3B0cyl7XG5cdHRyeSB7XG5cdFx0bGV0IGlkID0gJCgnI2lkX25hbWUnKS52YWwoKTsgIC8vIGdldCBuYW1lIGZyb20gaGlkZGVuIGZpZWxkXG5cdFx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlX2N1cnJlbnQob3B0cyksIGlkKVxuXHRcdGlmKG5vZGUgPT09IHVuZGVmaW5lZClcblx0XHRcdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcblx0XHRlbHNlXG5cdFx0XHQkKCdmb3JtID4gZmllbGRzZXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oZXJyKTtcblx0fVxufSlcblxuLy8gdXBkYXRlIHN0YXR1cyBmaWVsZCBhbmQgYWdlIGxhYmVsIC0gMCA9IGFsaXZlLCAxID0gZGVhZFxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhzdGF0dXMpIHtcblx0JCgnI2FnZV95b2JfbG9jaycpLnJlbW92ZUNsYXNzKCdmYS1sb2NrIGZhLXVubG9jay1hbHQnKTtcblx0KHN0YXR1cyA9PSAxID8gJCgnI2FnZV95b2JfbG9jaycpLmFkZENsYXNzKCdmYS11bmxvY2stYWx0JykgOiAkKCcjYWdlX3lvYl9sb2NrJykuYWRkQ2xhc3MoJ2ZhLWxvY2snKSk7XG5cdCQoJyNpZF9hZ2VfJytzdGF0dXMpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuXHQkKCcjaWRfYWdlXycrKHN0YXR1cyA9PSAxID8gJzAnIDogJzEnKSkuYWRkQ2xhc3MoXCJoaWRkZW5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlY2xpY2sobm9kZSkge1xuXHQkKCdmb3JtID4gZmllbGRzZXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblx0Ly8gY2xlYXIgdmFsdWVzXG5cdCQoJyNwZXJzb25fZGV0YWlscycpLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLCBpbnB1dFt0eXBlPW51bWJlcl1cIikudmFsKFwiXCIpO1xuXHQkKCcjcGVyc29uX2RldGFpbHMgc2VsZWN0JykudmFsKCcnKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXG5cdC8vIGFzc2lnbiB2YWx1ZXMgdG8gaW5wdXQgZmllbGRzIGluIGZvcm1cblx0aWYobm9kZS5zZXggPT09ICdNJyB8fCBub2RlLnNleCA9PT0gJ0YnKVxuXHRcdCQoJ2lucHV0W25hbWU9c2V4XVt2YWx1ZT1cIicrbm9kZS5zZXgrJ1wiXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcblx0ZWxzZVxuXHRcdCQoJ2lucHV0W25hbWU9c2V4XScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdHVwZGF0ZV9jYW5jZXJfYnlfc2V4KG5vZGUpO1xuXG5cdGlmKCEoJ3N0YXR1cycgaW4gbm9kZSkpXG5cdFx0bm9kZS5zdGF0dXMgPSAwO1xuXHQkKCdpbnB1dFtuYW1lPXN0YXR1c11bdmFsdWU9XCInK25vZGUuc3RhdHVzKydcIl0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cdC8vIHNob3cgbG9jayBzeW1ib2wgZm9yIGFnZSBhbmQgeW9iIHN5bmNocm9uaXNhdGlvblxuXHR1cGRhdGVTdGF0dXMobm9kZS5zdGF0dXMpO1xuXG5cdGlmKCdwcm9iYW5kJyBpbiBub2RlKSB7XG5cdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKCdjaGVja2VkJywgbm9kZS5wcm9iYW5kKTtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcblx0fSBlbHNlIHtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKFwiZGlzYWJsZWRcIiwgISgneW9iJyBpbiBub2RlKSlcblx0fVxuXG5cdGlmKCdleGNsdWRlJyBpbiBub2RlKSB7XG5cdFx0JCgnI2lkX2V4Y2x1ZGUnKS5wcm9wKCdjaGVja2VkJywgbm9kZS5leGNsdWRlKTtcblx0fSBlbHNlIHtcblx0XHQkKCcjaWRfZXhjbHVkZScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdH1cblxuLypcdFx0aWYoJ2FzaGtlbmF6aScgaW4gbm9kZSkge1xuXHRcdFx0JCgnI2lkX2FzaGtlbmF6aScpLnByb3AoJ2NoZWNrZWQnLCAobm9kZS5wcm9iYW5kID09IDEgPyB0cnVlOiBmYWxzZSkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkKCcjaWRfYXNoa2VuYXppJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHR9Ki9cblxuXHQvLyB5ZWFyIG9mIGJpcnRoXG5cdGlmKCd5b2InIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfeW9iXzAnKS52YWwobm9kZS55b2IpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF95b2JfMCcpLnZhbCgnLScpO1xuXHR9XG5cblx0Ly8gY2xlYXIgcGF0aG9sb2d5XG5cdCQoJ3NlbGVjdFtuYW1lJD1cIl9iY19wYXRob2xvZ3lcIl0nKS52YWwoJy0nKTtcblx0Ly8gY2xlYXIgZ2VuZSB0ZXN0c1xuXHQkKCdzZWxlY3RbbmFtZSo9XCJfZ2VuZV90ZXN0XCJdJykudmFsKCctJyk7XG5cblx0Ly8gZGlzYWJsZSBzZXggcmFkaW8gYnV0dG9ucyBpZiB0aGUgcGVyc29uIGhhcyBhIHBhcnRuZXJcblx0JChcImlucHV0W2lkXj0naWRfc2V4XyddXCIpLnByb3AoXCJkaXNhYmxlZFwiLCAobm9kZS5wYXJlbnRfbm9kZSAmJiBub2RlLnNleCAhPT0gJ1UnID8gdHJ1ZSA6IGZhbHNlKSk7XG5cblx0Ly8gZGlzYWJsZSBwYXRob2xvZ3kgZm9yIG1hbGUgcmVsYXRpdmVzIChhcyBub3QgdXNlZCBieSBtb2RlbClcblx0Ly8gYW5kIGlmIG5vIGJyZWFzdCBjYW5jZXIgYWdlIG9mIGRpYWdub3Npc1xuXHQkKFwic2VsZWN0W2lkJD0nX2JjX3BhdGhvbG9neSddXCIpLnByb3AoXCJkaXNhYmxlZFwiLFxuXHRcdFx0KG5vZGUuc2V4ID09PSAnTScgfHwgKG5vZGUuc2V4ID09PSAnRicgJiYgISgnYnJlYXN0X2NhbmNlcl9kaWFnbm9zaXNfYWdlJyBpbiBub2RlKSkgPyB0cnVlIDogZmFsc2UpKTtcblxuXHQvLyBhcHByb3hpbWF0ZSBkaWFnbm9zaXMgYWdlXG5cdCQoJyNpZF9hcHByb3gnKS5wcm9wKCdjaGVja2VkJywgKG5vZGUuYXBwcm94X2RpYWdub3Npc19hZ2UgPyB0cnVlOiBmYWxzZSkpO1xuXHR1cGRhdGVfZGlhZ25vc2lzX2FnZV93aWRnZXQoKTtcblxuXHRmb3IobGV0IGtleSBpbiBub2RlKSB7XG5cdFx0aWYoa2V5ICE9PSAncHJvYmFuZCcgJiYga2V5ICE9PSAnc2V4Jykge1xuXHRcdFx0aWYoJCgnI2lkXycra2V5KS5sZW5ndGgpIHtcdC8vIGlucHV0IHZhbHVlXG5cdFx0XHRcdGlmKGtleS5pbmRleE9mKCdfZ2VuZV90ZXN0JykgICE9PSAtMSAmJiBub2RlW2tleV0gIT09IG51bGwgJiYgdHlwZW9mIG5vZGVba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkpLnZhbChub2RlW2tleV0udHlwZSk7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KydfcmVzdWx0JykudmFsKG5vZGVba2V5XS5yZXN1bHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSkudmFsKG5vZGVba2V5XSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihrZXkuaW5kZXhPZignX2RpYWdub3Npc19hZ2UnKSAhPT0gLTEpIHtcblx0XHRcdFx0aWYoJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpIHtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkrJ18xJykudmFsKHJvdW5kNShub2RlW2tleV0pKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSsnXzAnKS52YWwobm9kZVtrZXldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRyeSB7XG5cdFx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZCgnZm9ybScpLnZhbGlkKCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0Y29uc29sZS53YXJuKCd2YWxpZCgpIG5vdCBmb3VuZCcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KSB7XG5cdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdGlmKCQoJyNvcmlnX2FzaGsnKS5pcygnOmNoZWNrZWQnKSkge1xuXHRcdCQuZWFjaChuZXdkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihwLnByb2JhbmQpXG5cdFx0XHRcdHAuYXNoa2VuYXppID0gMTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkLmVhY2gobmV3ZGF0YXNldCwgZnVuY3Rpb24oaSwgcCkge1xuXHRcdFx0ZGVsZXRlIHAuYXNoa2VuYXppO1xuXHRcdH0pO1xuXHR9XG59XG5cbi8vIFNhdmUgQXNoa2VuYXppIHN0YXR1c1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfYXNoa24ob3B0cykge1xuXHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHR1cGRhdGVfYXNoa24obmV3ZGF0YXNldCk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9wdHMpIHtcblx0bGV0IGRhdGFzZXQgPSBwZWRjYWNoZV9jdXJyZW50KG9wdHMpO1xuXHRsZXQgbmFtZSA9ICQoJyNpZF9uYW1lJykudmFsKCk7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHRsZXQgcGVyc29uID0gZ2V0Tm9kZUJ5TmFtZShuZXdkYXRhc2V0LCBuYW1lKTtcblx0aWYoIXBlcnNvbikge1xuXHRcdGNvbnNvbGUud2FybigncGVyc29uIG5vdCBmb3VuZCB3aGVuIHNhdmluZyBkZXRhaWxzJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdCQoXCIjXCIrb3B0cy50YXJnZXREaXYpLmVtcHR5KCk7XG5cblx0Ly8gaW5kaXZpZHVhbCdzIHBlcnNvbmFsIGFuZCBjbGluaWNhbCBkZXRhaWxzXG5cdGxldCB5b2IgPSAkKCcjaWRfeW9iXzAnKS52YWwoKTtcblx0aWYoeW9iICYmIHlvYiAhPT0gJycpIHtcblx0XHRwZXJzb24ueW9iID0geW9iO1xuXHR9IGVsc2Uge1xuXHRcdGRlbGV0ZSBwZXJzb24ueW9iO1xuXHR9XG5cblx0Ly8gY3VycmVudCBzdGF0dXM6IDAgPSBhbGl2ZSwgMSA9IGRlYWRcblx0bGV0IHN0YXR1cyA9ICQoJyNpZF9zdGF0dXMnKS5maW5kKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIpO1xuXHRpZihzdGF0dXMubGVuZ3RoID4gMCl7XG5cdFx0cGVyc29uLnN0YXR1cyA9IHN0YXR1cy52YWwoKTtcblx0fVxuXG5cdC8vIGJvb2xlYW5zIHN3aXRjaGVzXG5cdGxldCBzd2l0Y2hlcyA9IFtcIm1pc2NhcnJpYWdlXCIsIFwiYWRvcHRlZF9pblwiLCBcImFkb3B0ZWRfb3V0XCIsIFwidGVybWluYXRpb25cIiwgXCJzdGlsbGJpcnRoXCJdO1xuXHRmb3IobGV0IGlzd2l0Y2g9MDsgaXN3aXRjaDxzd2l0Y2hlcy5sZW5ndGg7IGlzd2l0Y2grKyl7XG5cdFx0bGV0IGF0dHIgPSBzd2l0Y2hlc1tpc3dpdGNoXTtcblx0XHRsZXQgcyA9ICQoJyNpZF8nK2F0dHIpO1xuXHRcdGlmKHMubGVuZ3RoID4gMCl7XG5cdFx0XHRjb25zb2xlLmxvZyhzLmlzKFwiOmNoZWNrZWRcIikpO1xuXHRcdFx0aWYocy5pcyhcIjpjaGVja2VkXCIpKVxuXHRcdFx0XHRwZXJzb25bYXR0cl0gPSB0cnVlO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkZWxldGUgcGVyc29uW2F0dHJdO1xuXHRcdH1cblx0fVxuXG5cdC8vIGN1cnJlbnQgc2V4XG5cdGxldCBzZXggPSAkKCcjaWRfc2V4JykuZmluZChcImlucHV0W3R5cGU9J3JhZGlvJ106Y2hlY2tlZFwiKTtcblx0aWYoc2V4Lmxlbmd0aCA+IDApe1xuXHRcdHBlcnNvbi5zZXggPSBzZXgudmFsKCk7XG5cdFx0dXBkYXRlX2NhbmNlcl9ieV9zZXgocGVyc29uKTtcblx0fVxuXG5cdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KTtcblxuXHRpZigkKCcjaWRfYXBwcm94JykuaXMoJzpjaGVja2VkJykpIC8vIGFwcHJveGltYXRlIGRpYWdub3NpcyBhZ2Vcblx0XHRwZXJzb24uYXBwcm94X2RpYWdub3Npc19hZ2UgPSB0cnVlO1xuXHRlbHNlXG5cdFx0ZGVsZXRlIHBlcnNvbi5hcHByb3hfZGlhZ25vc2lzX2FnZTtcblxuXHQkKFwiI3BlcnNvbl9kZXRhaWxzIHNlbGVjdFtuYW1lKj0nX2RpYWdub3Npc19hZ2UnXTp2aXNpYmxlLCAjcGVyc29uX2RldGFpbHMgaW5wdXRbdHlwZT10ZXh0XTp2aXNpYmxlLCAjcGVyc29uX2RldGFpbHMgaW5wdXRbdHlwZT1udW1iZXJdOnZpc2libGVcIikuZWFjaChmdW5jdGlvbigpIHtcblx0XHRsZXQgbmFtZSA9ICh0aGlzLm5hbWUuaW5kZXhPZihcIl9kaWFnbm9zaXNfYWdlXCIpPi0xID8gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpOiB0aGlzLm5hbWUpO1xuXG5cdFx0aWYoJCh0aGlzKS52YWwoKSkge1xuXHRcdFx0bGV0IHZhbCA9ICQodGhpcykudmFsKCk7XG5cdFx0XHRpZihuYW1lLmluZGV4T2YoXCJfZGlhZ25vc2lzX2FnZVwiKSA+IC0xICYmICQoXCIjaWRfYXBwcm94XCIpLmlzKCc6Y2hlY2tlZCcpKVxuXHRcdFx0XHR2YWwgPSByb3VuZDUodmFsKTtcblx0XHRcdHBlcnNvbltuYW1lXSA9IHZhbDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHBlcnNvbltuYW1lXTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGNhbmNlciBjaGVja2JveGVzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZSQ9XCJjYW5jZXJcIl0saW5wdXRbdHlwZT1cImNoZWNrYm94XCJdW25hbWUkPVwiY2FuY2VyMlwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5jaGVja2VkKVxuXHRcdFx0cGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXSA9IHRydWU7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV07XG5cdH0pO1xuXG5cdC8vIHBhdGhvbG9neSB0ZXN0c1xuXHQkKCcjcGVyc29uX2RldGFpbHMgc2VsZWN0W25hbWUkPVwiX2JjX3BhdGhvbG9neVwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJy0nKSB7XG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0gJCh0aGlzKS52YWwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV07XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBnZW5ldGljIHRlc3RzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3RbbmFtZSQ9XCJfZ2VuZV90ZXN0XCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZigkKHRoaXMpLnZhbCgpICE9PSAnLScpIHtcblx0XHRcdGxldCB0cmVzID0gJCgnc2VsZWN0W25hbWU9XCInKyQodGhpcykuYXR0cignbmFtZScpKydfcmVzdWx0XCJdJyk7XG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0geyd0eXBlJzogJCh0aGlzKS52YWwoKSwgJ3Jlc3VsdCc6ICQodHJlcykudmFsKCl9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0XHR9XG5cdH0pO1xuXG5cdHRyeSB7XG5cdFx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZCgnZm9ybScpLnZhbGlkKCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0Y29uc29sZS53YXJuKCd2YWxpZCgpIG5vdCBmb3VuZCcpO1xuXHR9XG5cblx0c3luY1R3aW5zKG5ld2RhdGFzZXQsIHBlcnNvbik7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfZGlhZ25vc2lzX2FnZV93aWRnZXQoKSB7XG5cdGlmKCQoXCIjaWRfYXBwcm94XCIpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzAnXVwiKS5lYWNoKGZ1bmN0aW9uKCBfaSApIHtcblx0XHRcdGlmKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG5cdFx0XHRcdGxldCBuYW1lID0gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpO1xuXHRcdFx0XHQkKFwiI2lkX1wiK25hbWUrXCJfMVwiKS52YWwocm91bmQ1KCQodGhpcykudmFsKCkpKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzAnXVwiKS5oaWRlKCk7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzEnXVwiKS5zaG93KCk7XG5cdH0gZWxzZSB7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzEnXVwiKS5lYWNoKGZ1bmN0aW9uKCBfaSApIHtcblx0XHRcdGlmKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG5cdFx0XHRcdGxldCBuYW1lID0gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpO1xuXHRcdFx0XHQkKFwiI2lkX1wiK25hbWUrXCJfMFwiKS52YWwoJCh0aGlzKS52YWwoKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLnNob3coKTtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLmhpZGUoKTtcblx0fVxufVxuXG4vLyBtYWxlcyBzaG91bGQgbm90IGhhdmUgb3ZhcmlhbiBjYW5jZXIgYW5kIGZlbWFsZXMgc2hvdWxkIG5vdCBoYXZlIHByb3N0YXRlIGNhbmNlclxuZnVuY3Rpb24gdXBkYXRlX2NhbmNlcl9ieV9zZXgobm9kZSkge1xuXHQkKCcjY2FuY2VyIC5yb3cnKS5zaG93KCk7XG5cdGlmKG5vZGUuc2V4ID09PSAnTScpIHtcblx0XHRkZWxldGUgbm9kZS5vdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlO1xuXHRcdCQoXCJbaWRePSdpZF9vdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlJ11cIikuY2xvc2VzdCgnLnJvdycpLmhpZGUoKTtcblx0XHQkKFwiW2lkXj0naWRfYnJlYXN0X2NhbmNlcjJfZGlhZ25vc2lzX2FnZSddXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdH0gZWxzZSBpZihub2RlLnNleCA9PT0gJ0YnKSB7XG5cdFx0ZGVsZXRlIG5vZGUucHJvc3RhdGVfY2FuY2VyX2RpYWdub3Npc19hZ2U7XG5cdFx0JChcIltpZF49J2lkX3Byb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlJ11cIikuY2xvc2VzdCgnLnJvdycpLmhpZGUoKTtcblx0XHQkKFwiW2lkXj0naWRfYnJlYXN0X2NhbmNlcjJfZGlhZ25vc2lzX2FnZSddXCIpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHR9XG59XG5cbi8vIHJvdW5kIHRvIDUsIDE1LCAyNSwgMzUgLi4uLlxuZnVuY3Rpb24gcm91bmQ1KHgxKSB7XG5cdGxldCB4MiA9IChNYXRoLnJvdW5kKCh4MS0xKSAvIDEwKSAqIDEwKTtcblx0cmV0dXJuICh4MSA8IHgyID8geDIgLSA1IDogeDIgKyA1KTtcbn1cblxuIiwiLy8gcGVkaWdyZWUgd2lkZ2V0c1xuaW1wb3J0IHthZGRzaWJsaW5nLCBhZGRjaGlsZCwgYWRkcGFyZW50cywgYWRkcGFydG5lciwgcmVidWlsZCwgZGVsZXRlX25vZGVfZGF0YXNldH0gZnJvbSAnLi9wZWRpZ3JlZS5qcyc7XG5pbXBvcnQge2NvcHlfZGF0YXNldCwgbWFrZWlkLCBnZXRJZHhCeU5hbWV9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0IHtzYXZlLCB1cGRhdGV9IGZyb20gJy4vcGVkaWdyZWVfZm9ybS5qcyc7XG5pbXBvcnQge2N1cnJlbnQgYXMgcGVkY2FjaGVfY3VycmVudH0gZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5cbmxldCBkcmFnZ2luZztcbmxldCBsYXN0X21vdXNlb3Zlcjtcbi8vXG4vLyBBZGQgd2lkZ2V0cyB0byBub2RlcyBhbmQgYmluZCBldmVudHNcbmV4cG9ydCBmdW5jdGlvbiBhZGRXaWRnZXRzKG9wdHMsIG5vZGUpIHtcblxuXHQvLyBwb3B1cCBnZW5kZXIgc2VsZWN0aW9uIGJveFxuXHRsZXQgZm9udF9zaXplID0gcGFyc2VJbnQoJChcImJvZHlcIikuY3NzKCdmb250LXNpemUnKSk7XG5cdGxldCBwb3B1cF9zZWxlY3Rpb24gPSBkMy5zZWxlY3QoJy5kaWFncmFtJyk7XG5cdHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvblwiKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcInJ4XCIsIDYpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwicnlcIiwgNilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHRcdFx0XHRcdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcIndpZHRoXCIsICBmb250X3NpemUqNy45KVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcImhlaWdodFwiLCBmb250X3NpemUqMilcblx0XHRcdFx0XHRcdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiZGFya2dyZXlcIilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwid2hpdGVcIik7XG5cblx0bGV0IHNxdWFyZSA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBtYWxlXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoJ2ZvbnQtc2l6ZScsICcxLmVtJyApXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS1zcXVhcmUgcGVyc29udHlwZVwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZS8zKVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjA5NiBcIik7XG5cdGxldCBzcXVhcmVfdGl0bGUgPSBzcXVhcmUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgbWFsZVwiKTtcblxuXHRsZXQgY2lyY2xlID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIGZlbWFsZVxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtbGcgZmEtY2lyY2xlIHBlcnNvbnR5cGVcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdC5hdHRyKFwieFwiLCBmb250X3NpemUqMS43KVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjEwYyBcIik7XG5cdGxldCBjaXJjbGVfdGl0bGUgPSBjaXJjbGUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgZmVtYWxlXCIpO1xuXG5cdGxldCB1bnNwZWNpZmllZCA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyB1bnNwZWNpZmllZFxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS11bnNwZWNpZmllZCBwb3B1cF9zZWxlY3Rpb25fcm90YXRlNDUgcGVyc29udHlwZVwiKVxuXHRcdC50ZXh0KFwiXFx1ZjA5NiBcIik7XG5cdHVuc3BlY2lmaWVkLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIHVuc3BlY2lmaWVkXCIpO1xuXG5cdGxldCBkenR3aW4gPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gZGl6eWdvdGljIHR3aW5zXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLTJ4IGZhLWFuZ2xlLXVwIHBlcnNvbnR5cGUgZHp0d2luXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSo0LjYpXG5cdFx0LmF0dHIoXCJ5XCIsIGZvbnRfc2l6ZSoxLjUpXG5cdFx0LnRleHQoXCJcXHVmMTA2IFwiKTtcblx0ZHp0d2luLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIGRpenlnb3RpYy9mcmF0ZXJuYWwgdHdpbnNcIik7XG5cblx0bGV0IG16dHdpbiA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBtb25venlnb3RpYyB0d2luc1xuXHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtMnggZmEtY2FyZXQtdXAgcGVyc29udHlwZSBtenR3aW5cIilcblx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSo2LjIpXG5cdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHQudGV4dChcIlxcdWYwZDhcIik7XG5cdG16dHdpbi5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCBtb25venlnb3RpYy9pZGVudGljYWwgdHdpbnNcIik7XG5cblx0bGV0IGFkZF9wZXJzb24gPSB7fTtcblx0Ly8gY2xpY2sgdGhlIHBlcnNvbiB0eXBlIHNlbGVjdGlvblxuXHRkMy5zZWxlY3RBbGwoXCIucGVyc29udHlwZVwiKVxuXHQgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRsZXQgbXp0d2luID0gZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJtenR3aW5cIik7XG5cdFx0bGV0IGR6dHdpbiA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHp0d2luXCIpO1xuXHRcdGxldCB0d2luX3R5cGU7XG5cdFx0bGV0IHNleDtcblx0XHRpZihtenR3aW4gfHwgZHp0d2luKSB7XG5cdFx0XHRzZXggPSBhZGRfcGVyc29uLm5vZGUuZGF0dW0oKS5kYXRhLnNleDtcblx0XHRcdHR3aW5fdHlwZSA9IChtenR3aW4gPyBcIm16dHdpblwiIDogXCJkenR3aW5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNleCA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtc3F1YXJlXCIpID8gJ00nIDogKGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtY2lyY2xlXCIpID8gJ0YnIDogJ1UnKTtcblx0XHR9XG5cblx0XHRpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRzaWJsaW5nJylcblx0XHRcdGFkZHNpYmxpbmcobmV3ZGF0YXNldCwgYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkuZGF0YSwgc2V4LCBmYWxzZSwgdHdpbl90eXBlKTtcblx0XHRlbHNlIGlmKGFkZF9wZXJzb24udHlwZSA9PT0gJ2FkZGNoaWxkJylcblx0XHRcdGFkZGNoaWxkKG5ld2RhdGFzZXQsIGFkZF9wZXJzb24ubm9kZS5kYXR1bSgpLmRhdGEsICh0d2luX3R5cGUgPyAnVScgOiBzZXgpLCAodHdpbl90eXBlID8gMiA6IDEpLCB0d2luX3R5cGUpO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybjtcblx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0ZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGFkZF9wZXJzb24gPSB7fTtcblx0ICB9KVxuXHQgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbigpIHtcblx0XHQgIGlmKGFkZF9wZXJzb24ubm9kZSlcblx0XHRcdCAgYWRkX3BlcnNvbi5ub2RlLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjIpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdCAgLy8gYWRkIHRvb2x0aXBzIHRvIGZvbnQgYXdlc29tZSB3aWRnZXRzXG5cdFx0ICBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRzaWJsaW5nJyl7XG5cdFx0XHQgaWYoZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJmYS1zcXVhcmVcIikpXG5cdFx0XHRcdCAgc3F1YXJlX3RpdGxlLnRleHQoXCJhZGQgYnJvdGhlclwiKTtcblx0XHRcdCAgZWxzZVxuXHRcdFx0XHQgIGNpcmNsZV90aXRsZS50ZXh0KFwiYWRkIHNpc3RlclwiKTtcblx0XHQgIH0gZWxzZSBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRjaGlsZCcpe1xuXHRcdFx0ICBpZihkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImZhLXNxdWFyZVwiKSlcblx0XHRcdFx0ICBzcXVhcmVfdGl0bGUudGV4dChcImFkZCBzb25cIik7XG5cdFx0XHQgIGVsc2Vcblx0XHRcdFx0ICBjaXJjbGVfdGl0bGUudGV4dChcImFkZCBkYXVnaHRlclwiKTtcblx0XHQgIH1cblx0ICB9KTtcblxuXHQvLyBoYW5kbGUgbW91c2Ugb3V0IG9mIHBvcHVwIHNlbGVjdGlvblxuXHRkMy5zZWxlY3RBbGwoXCIucG9wdXBfc2VsZWN0aW9uXCIpLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKCkge1xuXHRcdC8vIGhpZGUgcmVjdCBhbmQgcG9wdXAgc2VsZWN0aW9uXG5cdFx0aWYoYWRkX3BlcnNvbi5ub2RlICE9PSB1bmRlZmluZWQgJiYgaGlnaGxpZ2h0LmluZGV4T2YoYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkpID09IC0xKVxuXHRcdFx0YWRkX3BlcnNvbi5ub2RlLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdH0pO1xuXG5cblx0Ly8gZHJhZyBsaW5lIGJldHdlZW4gbm9kZXMgdG8gY3JlYXRlIHBhcnRuZXJzXG5cdGRyYWdfaGFuZGxlKG9wdHMpO1xuXG5cdC8vIHJlY3RhbmdsZSB1c2VkIHRvIGhpZ2hsaWdodCBvbiBtb3VzZSBvdmVyXG5cdG5vZGUuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIGQuZGF0YS5oaWRkZW4gJiYgIW9wdHMuREVCVUcgPyBmYWxzZSA6IHRydWU7XG5cdFx0fSlcblx0XHQuYXR0cihcImNsYXNzXCIsICdpbmRpX3JlY3QnKVxuXHRcdC5hdHRyKFwicnhcIiwgNilcblx0XHQuYXR0cihcInJ5XCIsIDYpXG5cdFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKF9kKSB7IHJldHVybiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZTsgfSlcblx0XHQuYXR0cihcInlcIiwgZnVuY3Rpb24oX2QpIHsgcmV0dXJuIC0gb3B0cy5zeW1ib2xfc2l6ZTsgfSlcblx0XHQuYXR0cihcIndpZHRoXCIsICAoMS41ICogb3B0cy5zeW1ib2xfc2l6ZSkrJ3B4Jylcblx0XHQuYXR0cihcImhlaWdodFwiLCAoMiAqIG9wdHMuc3ltYm9sX3NpemUpKydweCcpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMC43KVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cihcImZpbGxcIiwgXCJsaWdodGdyZXlcIik7XG5cblx0Ly8gd2lkZ2V0c1xuXHRsZXQgZnggPSBmdW5jdGlvbihfZCkge3JldHVybiBvZmYgLSAwLjc1Km9wdHMuc3ltYm9sX3NpemU7fTtcblx0bGV0IGZ5ID0gb3B0cy5zeW1ib2xfc2l6ZSAtMjtcblx0bGV0IG9mZiA9IDA7XG5cdGxldCB3aWRnZXRzID0ge1xuXHRcdCdhZGRjaGlsZCc6ICAgeyd0ZXh0JzogJ1xcdWYwNjMnLCAndGl0bGUnOiAnYWRkIGNoaWxkJywgICAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRzaWJsaW5nJzogeyd0ZXh0JzogJ1xcdWYyMzQnLCAndGl0bGUnOiAnYWRkIHNpYmxpbmcnLCAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRwYXJ0bmVyJzogeyd0ZXh0JzogJ1xcdWYwYzEnLCAndGl0bGUnOiAnYWRkIHBhcnRuZXInLCAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRwYXJlbnRzJzoge1xuXHRcdFx0J3RleHQnOiAnXFx1ZjA2MicsICd0aXRsZSc6ICdhZGQgcGFyZW50cycsXG5cdFx0XHQnZngnOiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZSxcblx0XHRcdCdmeSc6IC0gb3B0cy5zeW1ib2xfc2l6ZSArIDExXG5cdFx0fSxcblx0XHQnZGVsZXRlJzoge1xuXHRcdFx0J3RleHQnOiAnWCcsICd0aXRsZSc6ICdkZWxldGUnLFxuXHRcdFx0J2Z4Jzogb3B0cy5zeW1ib2xfc2l6ZS8yIC0gMSxcblx0XHRcdCdmeSc6IC0gb3B0cy5zeW1ib2xfc2l6ZSArIDEyLFxuXHRcdFx0J3N0eWxlcyc6IHtcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLCBcImZpbGxcIjogXCJkYXJrcmVkXCIsIFwiZm9udC1mYW1pbHlcIjogXCJtb25vc3BhY2VcIn1cblx0XHR9XG5cdH07XG5cblx0aWYob3B0cy5lZGl0KSB7XG5cdFx0d2lkZ2V0cy5zZXR0aW5ncyA9IHsndGV4dCc6ICdcXHVmMDEzJywgJ3RpdGxlJzogJ3NldHRpbmdzJywgJ2Z4JzogLWZvbnRfc2l6ZS8yKzIsICdmeSc6IC1vcHRzLnN5bWJvbF9zaXplICsgMTF9O1xuXHR9XG5cblx0Zm9yKGxldCBrZXkgaW4gd2lkZ2V0cykge1xuXHRcdGxldCB3aWRnZXQgPSBub2RlLmFwcGVuZChcInRleHRcIilcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuICAoZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyA/IGZhbHNlIDogdHJ1ZSkgJiZcblx0XHRcdFx0XHRcdCEoKGQuZGF0YS5tb3RoZXIgPT09IHVuZGVmaW5lZCB8fCBkLmRhdGEubm9wYXJlbnRzKSAmJiBrZXkgPT09ICdhZGRzaWJsaW5nJykgJiZcblx0XHRcdFx0XHRcdCEoZC5kYXRhLnBhcmVudF9ub2RlICE9PSB1bmRlZmluZWQgJiYgZC5kYXRhLnBhcmVudF9ub2RlLmxlbmd0aCA+IDEgJiYga2V5ID09PSAnYWRkcGFydG5lcicpICYmXG5cdFx0XHRcdFx0XHQhKGQuZGF0YS5wYXJlbnRfbm9kZSA9PT0gdW5kZWZpbmVkICYmIGtleSA9PT0gJ2FkZGNoaWxkJykgJiZcblx0XHRcdFx0XHRcdCEoKGQuZGF0YS5ub3BhcmVudHMgPT09IHVuZGVmaW5lZCAmJiBkLmRhdGEudG9wX2xldmVsID09PSB1bmRlZmluZWQpICYmIGtleSA9PT0gJ2FkZHBhcmVudHMnKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGtleSlcblx0XHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0XHQuYXR0cihcInh4XCIsIGZ1bmN0aW9uKGQpe3JldHVybiBkLng7fSlcblx0XHRcdC5hdHRyKFwieXlcIiwgZnVuY3Rpb24oZCl7cmV0dXJuIGQueTt9KVxuXHRcdFx0LmF0dHIoXCJ4XCIsIHdpZGdldHNba2V5XS5meClcblx0XHRcdC5hdHRyKFwieVwiLCB3aWRnZXRzW2tleV0uZnkpXG5cdFx0XHQuYXR0cignZm9udC1zaXplJywgJzAuOWVtJyApXG5cdFx0XHQudGV4dCh3aWRnZXRzW2tleV0udGV4dCk7XG5cblx0XHRpZignc3R5bGVzJyBpbiB3aWRnZXRzW2tleV0pXG5cdFx0XHRmb3IobGV0IHN0eWxlIGluIHdpZGdldHNba2V5XS5zdHlsZXMpe1xuXHRcdFx0XHR3aWRnZXQuYXR0cihzdHlsZSwgd2lkZ2V0c1trZXldLnN0eWxlc1tzdHlsZV0pO1xuXHRcdFx0fVxuXG5cdFx0d2lkZ2V0LmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KHdpZGdldHNba2V5XS50aXRsZSk7XG5cdFx0b2ZmICs9IDE3O1xuXHR9XG5cblx0Ly8gYWRkIHNpYmxpbmcgb3IgY2hpbGRcblx0ZDMuc2VsZWN0QWxsKFwiLmFkZHNpYmxpbmcsIC5hZGRjaGlsZFwiKVxuXHQgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICBsZXQgdHlwZSA9IGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdCAgYWRkX3BlcnNvbiA9IHsnbm9kZSc6IGQzLnNlbGVjdCh0aGlzLnBhcmVudE5vZGUpLCAndHlwZSc6IHR5cGV9O1xuXG5cdFx0ICAvL2xldCB0cmFuc2xhdGUgPSBnZXRUcmFuc2xhdGlvbihkMy5zZWxlY3QoJy5kaWFncmFtJykuYXR0cihcInRyYW5zZm9ybVwiKSk7XG5cdFx0ICBsZXQgeCA9IHBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwieHhcIikpICsgcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ4XCIpKTtcblx0XHQgIGxldCB5ID0gcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ5eVwiKSkgKyBwYXJzZUludChkMy5zZWxlY3QodGhpcykuYXR0cihcInlcIikpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiKyh5KzIpK1wiKVwiKTtcblx0XHQgIGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbl9yb3RhdGU0NScpXG5cdFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIisoeCszKmZvbnRfc2l6ZSkrXCIsXCIrKHkrKGZvbnRfc2l6ZSoxLjIpKStcIikgcm90YXRlKDQ1KVwiKTtcblx0ICB9KTtcblxuXHQvLyBoYW5kbGUgd2lkZ2V0IGNsaWNrc1xuXHRkMy5zZWxlY3RBbGwoXCIuYWRkY2hpbGQsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzXCIpXG5cdCAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdGQzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGxldCBvcHQgPSBkMy5zZWxlY3QodGhpcykuYXR0cignY2xhc3MnKTtcblx0XHRsZXQgZCA9IGQzLnNlbGVjdCh0aGlzLnBhcmVudE5vZGUpLmRhdHVtKCk7XG5cdFx0aWYob3B0cy5ERUJVRykge1xuXHRcdFx0Y29uc29sZS5sb2cob3B0KTtcblx0XHR9XG5cblx0XHRsZXQgbmV3ZGF0YXNldDtcblx0XHRpZihvcHQgPT09ICdzZXR0aW5ncycpIHtcblx0XHRcdGlmKHR5cGVvZiBvcHRzLmVkaXQgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0b3B0cy5lZGl0KG9wdHMsIGQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3BlbkVkaXREaWFsb2cob3B0cywgZCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmKG9wdCA9PT0gJ2RlbGV0ZScpIHtcblx0XHRcdG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGVfY3VycmVudChvcHRzKSk7XG5cdFx0XHRkZWxldGVfbm9kZV9kYXRhc2V0KG5ld2RhdGFzZXQsIGQuZGF0YSwgb3B0cywgb25Eb25lKTtcblx0XHR9IGVsc2UgaWYob3B0ID09PSAnYWRkcGFyZW50cycpIHtcblx0XHRcdG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGVfY3VycmVudChvcHRzKSk7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdFx0YWRkcGFyZW50cyhvcHRzLCBuZXdkYXRhc2V0LCBkLmRhdGEubmFtZSk7XG5cdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZihvcHQgPT09ICdhZGRwYXJ0bmVyJykge1xuXHRcdFx0bmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRcdGFkZHBhcnRuZXIob3B0cywgbmV3ZGF0YXNldCwgZC5kYXRhLm5hbWUpO1xuXHRcdFx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0fVxuXHRcdC8vIHRyaWdnZXIgZmhDaGFuZ2UgZXZlbnRcblx0XHQkKGRvY3VtZW50KS50cmlnZ2VyKCdmaENoYW5nZScsIFtvcHRzXSk7XG5cdH0pO1xuXG5cdC8vIG90aGVyIG1vdXNlIGV2ZW50c1xuXHRsZXQgaGlnaGxpZ2h0ID0gW107XG5cblx0bm9kZS5maWx0ZXIoZnVuY3Rpb24gKGQpIHsgcmV0dXJuICFkLmRhdGEuaGlkZGVuOyB9KVxuXHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkMy5ldmVudC5jdHJsS2V5KSB7XG5cdFx0XHRpZihoaWdobGlnaHQuaW5kZXhPZihkKSA9PSAtMSlcblx0XHRcdFx0aGlnaGxpZ2h0LnB1c2goZCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGhpZ2hsaWdodC5zcGxpY2UoaGlnaGxpZ2h0LmluZGV4T2YoZCksIDEpO1xuXHRcdH0gZWxzZVxuXHRcdFx0aGlnaGxpZ2h0ID0gW2RdO1xuXG5cdFx0aWYoJ25vZGVjbGljaycgaW4gb3B0cykge1xuXHRcdFx0b3B0cy5ub2RlY2xpY2soZC5kYXRhKTtcblx0XHRcdGQzLnNlbGVjdEFsbChcIi5pbmRpX3JlY3RcIikuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdFx0ZDMuc2VsZWN0QWxsKCcuaW5kaV9yZWN0JykuZmlsdGVyKGZ1bmN0aW9uKGQpIHtyZXR1cm4gaGlnaGxpZ2h0LmluZGV4T2YoZCkgIT0gLTE7fSkuc3R5bGUoXCJvcGFjaXR5XCIsIDAuNSk7XG5cdFx0fVxuXHR9KVxuXHQub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCl7XG5cdFx0ZDMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0bGFzdF9tb3VzZW92ZXIgPSBkO1xuXHRcdGlmKGRyYWdnaW5nKSB7XG5cdFx0XHRpZihkcmFnZ2luZy5kYXRhLm5hbWUgIT09IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSAmJlxuXHRcdFx0ICAgZHJhZ2dpbmcuZGF0YS5zZXggIT09IGxhc3RfbW91c2VvdmVyLmRhdGEuc2V4KSB7XG5cdFx0XHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMC4yKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjIpO1xuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5hZGRjaGlsZCwgLmFkZHNpYmxpbmcsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5pbmRpX2RldGFpbHMnKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0c2V0TGluZURyYWdQb3NpdGlvbihvcHRzLnN5bWJvbF9zaXplLTEwLCAwLCBvcHRzLnN5bWJvbF9zaXplLTIsIDAsIGQueCtcIixcIisoZC55KzIpKTtcblx0fSlcblx0Lm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCl7XG5cdFx0aWYoZHJhZ2dpbmcpXG5cdFx0XHRyZXR1cm47XG5cblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuYWRkY2hpbGQsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5zZXR0aW5ncycpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRpZihoaWdobGlnaHQuaW5kZXhPZihkKSA9PSAtMSlcblx0XHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLmluZGlfZGV0YWlscycpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcblx0XHQvLyBoaWRlIHBvcHVwIGlmIGl0IGxvb2tzIGxpa2UgdGhlIG1vdXNlIGlzIG1vdmluZyBub3J0aFxuXHRcdGlmKGQzLm1vdXNlKHRoaXMpWzFdIDwgMC44Km9wdHMuc3ltYm9sX3NpemUpXG5cdFx0XHRkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0aWYoIWRyYWdnaW5nKSB7XG5cdFx0XHQvLyBoaWRlIHBvcHVwIGlmIGl0IGxvb2tzIGxpa2UgdGhlIG1vdXNlIGlzIG1vdmluZyBub3J0aCwgc291dGggb3Igd2VzdFxuXHRcdFx0aWYoIE1hdGguYWJzKGQzLm1vdXNlKHRoaXMpWzFdKSA+IDAuMjUqb3B0cy5zeW1ib2xfc2l6ZSB8fFxuXHRcdFx0XHRNYXRoLmFicyhkMy5tb3VzZSh0aGlzKVsxXSkgPCAtMC4yNSpvcHRzLnN5bWJvbF9zaXplIHx8XG5cdFx0XHRcdGQzLm1vdXNlKHRoaXMpWzBdIDwgMC4yKm9wdHMuc3ltYm9sX3NpemUpe1xuXHRcdFx0XHRcdHNldExpbmVEcmFnUG9zaXRpb24oMCwgMCwgMCwgMCk7XG5cdFx0XHR9XG4gICAgICAgIH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIG9uRG9uZShvcHRzLCBkYXRhc2V0KSB7XG5cdC8vIGFzc2lnbiBuZXcgZGF0YXNldCBhbmQgcmVidWlsZCBwZWRpZ3JlZVxuXHRvcHRzLmRhdGFzZXQgPSBkYXRhc2V0O1xuXHRyZWJ1aWxkKG9wdHMpO1xufVxuXG4vLyBkcmFnIGxpbmUgYmV0d2VlbiBub2RlcyB0byBjcmVhdGUgcGFydG5lcnNcbmZ1bmN0aW9uIGRyYWdfaGFuZGxlKG9wdHMpIHtcblx0bGV0IGxpbmVfZHJhZ19zZWxlY3Rpb24gPSBkMy5zZWxlY3QoJy5kaWFncmFtJyk7XG5cdGxldCBkbGluZSA9IGxpbmVfZHJhZ19zZWxlY3Rpb24uYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgJ2xpbmVfZHJhZ19zZWxlY3Rpb24nKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCA2KVxuICAgICAgICAuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIChcIjIsIDFcIikpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsXCJibGFja1wiKVxuICAgICAgICAuY2FsbChkMy5kcmFnKClcbiAgICAgICAgICAgICAgICAub24oXCJzdGFydFwiLCBkcmFnc3RhcnQpXG4gICAgICAgICAgICAgICAgLm9uKFwiZHJhZ1wiLCBkcmFnKVxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCBkcmFnc3RvcCkpO1xuXHRkbGluZS5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImRyYWcgdG8gY3JlYXRlIGNvbnNhbmd1aW5lb3VzIHBhcnRuZXJzXCIpO1xuXG5cdHNldExpbmVEcmFnUG9zaXRpb24oMCwgMCwgMCwgMCk7XG5cblx0ZnVuY3Rpb24gZHJhZ3N0YXJ0KF9kKSB7XG5cdFx0ZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0ZHJhZ2dpbmcgPSBsYXN0X21vdXNlb3Zlcjtcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsXCJkYXJrcmVkXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ3N0b3AoX2QpIHtcblx0XHRpZihsYXN0X21vdXNlb3ZlciAmJlxuXHRcdCAgIGRyYWdnaW5nLmRhdGEubmFtZSAhPT0gbGFzdF9tb3VzZW92ZXIuZGF0YS5uYW1lICYmXG5cdFx0ICAgZHJhZ2dpbmcuZGF0YS5zZXggICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLnNleCkge1xuXHRcdFx0Ly8gbWFrZSBwYXJ0bmVyc1xuXHRcdFx0bGV0IGNoaWxkID0ge1wibmFtZVwiOiBtYWtlaWQoNCksIFwic2V4XCI6ICdVJyxcblx0XHRcdFx0ICAgICBcIm1vdGhlclwiOiAoZHJhZ2dpbmcuZGF0YS5zZXggPT09ICdGJyA/IGRyYWdnaW5nLmRhdGEubmFtZSA6IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSksXG5cdFx0XHQgICAgICAgICBcImZhdGhlclwiOiAoZHJhZ2dpbmcuZGF0YS5zZXggPT09ICdGJyA/IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSA6IGRyYWdnaW5nLmRhdGEubmFtZSl9O1xuXHRcdFx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQob3B0cy5kYXRhc2V0KTtcblx0XHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cblx0XHRcdGxldCBpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBkcmFnZ2luZy5kYXRhLm5hbWUpKzE7XG5cdFx0XHRvcHRzLmRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xuXHRcdFx0cmVidWlsZChvcHRzKTtcblx0XHR9XG5cdFx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsXCJibGFja1wiKTtcblx0XHRkcmFnZ2luZyA9IHVuZGVmaW5lZDtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRmdW5jdGlvbiBkcmFnKF9kKSB7XG5cdFx0ZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0bGV0IGR4ID0gZDMuZXZlbnQuZHg7XG5cdFx0bGV0IGR5ID0gZDMuZXZlbnQuZHk7XG4gICAgICAgIGxldCB4bmV3ID0gcGFyc2VGbG9hdChkMy5zZWxlY3QodGhpcykuYXR0cigneDInKSkrIGR4O1xuICAgICAgICBsZXQgeW5ldyA9IHBhcnNlRmxvYXQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ3kyJykpKyBkeTtcbiAgICAgICAgc2V0TGluZURyYWdQb3NpdGlvbihvcHRzLnN5bWJvbF9zaXplLTEwLCAwLCB4bmV3LCB5bmV3KTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRMaW5lRHJhZ1Bvc2l0aW9uKHgxLCB5MSwgeDIsIHkyLCB0cmFuc2xhdGUpIHtcblx0aWYodHJhbnNsYXRlKVxuXHRcdGQzLnNlbGVjdEFsbCgnLmxpbmVfZHJhZ19zZWxlY3Rpb24nKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3RyYW5zbGF0ZStcIilcIik7XG5cdGQzLnNlbGVjdEFsbCgnLmxpbmVfZHJhZ19zZWxlY3Rpb24nKVxuXHRcdC5hdHRyKFwieDFcIiwgeDEpXG5cdFx0LmF0dHIoXCJ5MVwiLCB5MSlcblx0XHQuYXR0cihcIngyXCIsIHgyKVxuXHRcdC5hdHRyKFwieTJcIiwgeTIpO1xufVxuXG5mdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbn1cblxuLy8gaWYgb3B0LmVkaXQgaXMgc2V0IHRydWUgKHJhdGhlciB0aGFuIGdpdmVuIGEgZnVuY3Rpb24pIHRoaXMgaXMgY2FsbGVkIHRvIGVkaXQgbm9kZSBhdHRyaWJ1dGVzXG5mdW5jdGlvbiBvcGVuRWRpdERpYWxvZyhvcHRzLCBkKSB7XG5cdCQoJyNub2RlX3Byb3BlcnRpZXMnKS5kaWFsb2coe1xuXHQgICAgYXV0b09wZW46IGZhbHNlLFxuXHQgICAgdGl0bGU6IGQuZGF0YS5kaXNwbGF5X25hbWUsXG5cdCAgICB3aWR0aDogKCQod2luZG93KS53aWR0aCgpID4gNDAwID8gNDUwIDogJCh3aW5kb3cpLndpZHRoKCktIDMwKVxuXHR9KTtcblxuXHRsZXQgdGFibGUgPSBcIjx0YWJsZSBpZD0ncGVyc29uX2RldGFpbHMnIGNsYXNzPSd0YWJsZSc+XCI7XG5cblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5VbmlxdWUgSUQ8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0ndGV4dCcgaWQ9J2lkX25hbWUnIG5hbWU9J25hbWUnIHZhbHVlPVwiK1xuXHQoZC5kYXRhLm5hbWUgPyBkLmRhdGEubmFtZSA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5OYW1lPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J3RleHQnIGlkPSdpZF9kaXNwbGF5X25hbWUnIG5hbWU9J2Rpc3BsYXlfbmFtZScgdmFsdWU9XCIrXG5cdFx0XHQoZC5kYXRhLmRpc3BsYXlfbmFtZSA/IGQuZGF0YS5kaXNwbGF5X25hbWUgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5BZ2U8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0nbnVtYmVyJyBpZD0naWRfYWdlJyBtaW49JzAnIG1heD0nMTIwJyBuYW1lPSdhZ2UnIHN0eWxlPSd3aWR0aDo3ZW0nIHZhbHVlPVwiK1xuXHRcdFx0KGQuZGF0YS5hZ2UgPyBkLmRhdGEuYWdlIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+WWVhciBPZiBCaXJ0aDwvdGQ+PHRkPjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyB0eXBlPSdudW1iZXInIGlkPSdpZF95b2InIG1pbj0nMTkwMCcgbWF4PScyMDUwJyBuYW1lPSd5b2InIHN0eWxlPSd3aWR0aDo3ZW0nIHZhbHVlPVwiK1xuXHRcdChkLmRhdGEueW9iID8gZC5kYXRhLnlvYiA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblxuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiIGlkPVwiaWRfc2V4XCI+JyArXG5cdFx0XHQgJzxsYWJlbCBjbGFzcz1cInJhZGlvLWlubGluZVwiPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2V4XCIgdmFsdWU9XCJNXCIgJysoZC5kYXRhLnNleCA9PT0gJ00nID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPk1hbGU8L2xhYmVsPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJyYWRpby1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNleFwiIHZhbHVlPVwiRlwiICcrKGQuZGF0YS5zZXggPT09ICdGJyA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz5GZW1hbGU8L2xhYmVsPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJyYWRpby1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNleFwiIHZhbHVlPVwiVVwiPlVua25vd248L2xhYmVsPicgK1xuXHRcdFx0ICc8L3RkPjwvdHI+JztcblxuXHQvLyBhbGl2ZSBzdGF0dXMgPSAwOyBkZWFkIHN0YXR1cyA9IDFcblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIiBpZD1cImlkX3N0YXR1c1wiPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJjaGVja2JveC1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInN0YXR1c1wiIHZhbHVlPVwiMFwiICcrKHBhcnNlSW50KGQuZGF0YS5zdGF0dXMpID09PSAwID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPiZ0aGluc3A7QWxpdmU8L2xhYmVsPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJjaGVja2JveC1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInN0YXR1c1wiIHZhbHVlPVwiMVwiICcrKHBhcnNlSW50KGQuZGF0YS5zdGF0dXMpID09PSAxID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPiZ0aGluc3A7RGVjZWFzZWQ8L2xhYmVsPicgK1xuXHRcdFx0ICc8L3RkPjwvdHI+Jztcblx0JChcIiNpZF9zdGF0dXMgaW5wdXRbdmFsdWU9J1wiK2QuZGF0YS5zdGF0dXMrXCInXVwiKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cblx0Ly8gc3dpdGNoZXNcblx0bGV0IHN3aXRjaGVzID0gW1wiYWRvcHRlZF9pblwiLCBcImFkb3B0ZWRfb3V0XCIsIFwibWlzY2FycmlhZ2VcIiwgXCJzdGlsbGJpcnRoXCIsIFwidGVybWluYXRpb25cIl07XG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCI+PHN0cm9uZz5SZXByb2R1Y3Rpb246PC9zdHJvbmc+PC90ZD48L3RyPic7XG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCI+Jztcblx0Zm9yKGxldCBpc3dpdGNoPTA7IGlzd2l0Y2g8c3dpdGNoZXMubGVuZ3RoOyBpc3dpdGNoKyspe1xuXHRcdGxldCBhdHRyID0gc3dpdGNoZXNbaXN3aXRjaF07XG5cdFx0aWYoaXN3aXRjaCA9PT0gMilcblx0XHRcdHRhYmxlICs9ICc8L3RkPjwvdHI+PHRyPjx0ZCBjb2xzcGFuPVwiMlwiPic7XG5cdFx0dGFibGUgKz1cblx0XHQgJzxsYWJlbCBjbGFzcz1cImNoZWNrYm94LWlubGluZVwiPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImlkXycrYXR0ciArXG5cdFx0ICAgICdcIiBuYW1lPVwiJythdHRyKydcIiB2YWx1ZT1cIjBcIiAnKyhkLmRhdGFbYXR0cl0gPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+JnRoaW5zcDsnICtcblx0XHQgICAgY2FwaXRhbGlzZUZpcnN0TGV0dGVyKGF0dHIucmVwbGFjZSgnXycsICcgJykpKyc8L2xhYmVsPidcblx0fVxuXHR0YWJsZSArPSAnPC90ZD48L3RyPic7XG5cblx0Ly9cblx0bGV0IGV4Y2x1ZGUgPSBbXCJjaGlsZHJlblwiLCBcIm5hbWVcIiwgXCJwYXJlbnRfbm9kZVwiLCBcInRvcF9sZXZlbFwiLCBcImlkXCIsIFwibm9wYXJlbnRzXCIsXG5cdFx0ICAgICAgICAgICBcImxldmVsXCIsIFwiYWdlXCIsIFwic2V4XCIsIFwic3RhdHVzXCIsIFwiZGlzcGxheV9uYW1lXCIsIFwibW90aGVyXCIsIFwiZmF0aGVyXCIsXG5cdFx0ICAgICAgICAgICBcInlvYlwiLCBcIm16dHdpblwiLCBcImR6dHdpblwiXTtcblx0JC5tZXJnZShleGNsdWRlLCBzd2l0Y2hlcyk7XG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCI+PHN0cm9uZz5BZ2Ugb2YgRGlhZ25vc2lzOjwvc3Ryb25nPjwvdGQ+PC90cj4nO1xuXHQkLmVhY2gob3B0cy5kaXNlYXNlcywgZnVuY3Rpb24oaywgdikge1xuXHRcdGV4Y2x1ZGUucHVzaCh2LnR5cGUrXCJfZGlhZ25vc2lzX2FnZVwiKTtcblxuXHRcdGxldCBkaXNlYXNlX2NvbG91ciA9ICcmdGhpbnNwOzxzcGFuIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweDtiYWNrZ3JvdW5kOicrb3B0cy5kaXNlYXNlc1trXS5jb2xvdXIrJ1wiPjwvc3Bhbj4nO1xuXHRcdGxldCBkaWFnbm9zaXNfYWdlID0gZC5kYXRhW3YudHlwZSArIFwiX2RpYWdub3Npc19hZ2VcIl07XG5cblx0XHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlwiK2NhcGl0YWxpc2VGaXJzdExldHRlcih2LnR5cGUucmVwbGFjZShcIl9cIiwgXCIgXCIpKStcblx0XHRcdFx0XHRkaXNlYXNlX2NvbG91citcIiZuYnNwOzwvdGQ+PHRkPlwiICtcblx0XHRcdFx0XHRcIjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyBpZD0naWRfXCIgK1xuXHRcdFx0XHRcdHYudHlwZSArIFwiX2RpYWdub3Npc19hZ2VfMCcgbWF4PScxMTAnIG1pbj0nMCcgbmFtZT0nXCIgK1xuXHRcdFx0XHRcdHYudHlwZSArIFwiX2RpYWdub3Npc19hZ2VfMCcgc3R5bGU9J3dpZHRoOjVlbScgdHlwZT0nbnVtYmVyJyB2YWx1ZT0nXCIgK1xuXHRcdFx0XHRcdChkaWFnbm9zaXNfYWdlICE9PSB1bmRlZmluZWQgPyBkaWFnbm9zaXNfYWdlIDogXCJcIikgK1wiJz48L3RkPjwvdHI+XCI7XG5cdH0pO1xuXG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCIgc3R5bGU9XCJsaW5lLWhlaWdodDoxcHg7XCI+PC90ZD48L3RyPic7XG5cdCQuZWFjaChkLmRhdGEsIGZ1bmN0aW9uKGssIHYpIHtcblx0XHRpZigkLmluQXJyYXkoaywgZXhjbHVkZSkgPT0gLTEpIHtcblx0XHRcdGxldCBrayA9IGNhcGl0YWxpc2VGaXJzdExldHRlcihrKTtcblx0XHRcdGlmKHYgPT09IHRydWUgfHwgdiA9PT0gZmFsc2UpIHtcblx0XHRcdFx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5cIitraytcIiZuYnNwOzwvdGQ+PHRkPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2lkX1wiICsgayArIFwiJyBuYW1lPSdcIiArXG5cdFx0XHRcdFx0XHRrK1wiJyB2YWx1ZT1cIit2K1wiIFwiKyh2ID8gXCJjaGVja2VkXCIgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cdFx0XHR9IGVsc2UgaWYoay5sZW5ndGggPiAwKXtcblx0XHRcdFx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5cIitraytcIiZuYnNwOzwvdGQ+PHRkPjxpbnB1dCB0eXBlPSd0ZXh0JyBpZD0naWRfXCIgK1xuXHRcdFx0XHRcdFx0aytcIicgbmFtZT0nXCIraytcIicgdmFsdWU9XCIrditcIj48L3RkPjwvdHI+XCI7XG5cdFx0XHR9XG5cdFx0fVxuICAgIH0pO1xuXHR0YWJsZSArPSBcIjwvdGFibGU+XCI7XG5cblx0JCgnI25vZGVfcHJvcGVydGllcycpLmh0bWwodGFibGUpO1xuXHQkKCcjbm9kZV9wcm9wZXJ0aWVzJykuZGlhbG9nKCdvcGVuJyk7XG5cblx0Ly8kKCcjaWRfbmFtZScpLmNsb3Nlc3QoJ3RyJykudG9nZ2xlKCk7XG5cdCQoJyNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1yYWRpb10sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1jaGVja2JveF0sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT10ZXh0XSwgI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPW51bWJlcl0nKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0c2F2ZShvcHRzKTtcbiAgICB9KTtcblx0dXBkYXRlKG9wdHMpO1xuXHRyZXR1cm47XG59XG4iLCIvLyBQZWRpZ3JlZSBUcmVlIEJ1aWxkZXJcbmltcG9ydCAgKiBhcyBwZWRpZ3JlZV91dGlscyBmcm9tICcuL3BlZGlncmVlX3V0aWxzLmpzJztcbmltcG9ydCAqIGFzIHBidXR0b25zIGZyb20gJy4vcGJ1dHRvbnMuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQgKiBhcyBpbyBmcm9tICcuL2lvLmpzJztcbmltcG9ydCB7YWRkV2lkZ2V0c30gZnJvbSAnLi93aWRnZXRzLmpzJztcblxuZXhwb3J0IGxldCByb290cyA9IHt9O1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkKG9wdGlvbnMpIHtcblx0bGV0IG9wdHMgPSAkLmV4dGVuZCh7IC8vIGRlZmF1bHRzXG5cdFx0dGFyZ2V0RGl2OiAncGVkaWdyZWVfZWRpdCcsXG5cdFx0ZGF0YXNldDogWyB7XCJuYW1lXCI6IFwibTIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwiZmF0aGVyXCIsIFwic2V4XCI6IFwiTVwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdFx0ICAge1wibmFtZVwiOiBcImYyMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcIm1vdGhlclwiLCBcInNleFwiOiBcIkZcIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHRcdCAgIHtcIm5hbWVcIjogXCJjaDFcIiwgXCJkaXNwbGF5X25hbWVcIjogXCJtZVwiLCBcInNleFwiOiBcIkZcIiwgXCJtb3RoZXJcIjogXCJmMjFcIiwgXCJmYXRoZXJcIjogXCJtMjFcIiwgXCJwcm9iYW5kXCI6IHRydWV9XSxcblx0XHR3aWR0aDogNjAwLFxuXHRcdGhlaWdodDogNDAwLFxuXHRcdHN5bWJvbF9zaXplOiAzNSxcblx0XHR6b29tSW46IDEuMCxcblx0XHR6b29tT3V0OiAxLjAsXG5cdFx0ZGlzZWFzZXM6IFtcdHsndHlwZSc6ICdicmVhc3RfY2FuY2VyJywgJ2NvbG91cic6ICcjRjY4RjM1J30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ2JyZWFzdF9jYW5jZXIyJywgJ2NvbG91cic6ICdwaW5rJ30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ292YXJpYW5fY2FuY2VyJywgJ2NvbG91cic6ICcjNERBQTREJ30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ3BhbmNyZWF0aWNfY2FuY2VyJywgJ2NvbG91cic6ICcjNDI4OUJBJ30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ3Byb3N0YXRlX2NhbmNlcicsICdjb2xvdXInOiAnI0Q1NDk0QSd9XSxcblx0XHRsYWJlbHM6IFsnc3RpbGxiaXJ0aCcsICdhZ2UnLCAneW9iJywgJ2FsbGVsZXMnXSxcblx0XHRrZWVwX3Byb2JhbmRfb25fcmVzZXQ6IGZhbHNlLFxuXHRcdGZvbnRfc2l6ZTogJy43NWVtJyxcblx0XHRmb250X2ZhbWlseTogJ0hlbHZldGljYScsXG5cdFx0Zm9udF93ZWlnaHQ6IDcwMCxcblx0XHRiYWNrZ3JvdW5kOiBcIiNFRUVcIixcblx0XHRub2RlX2JhY2tncm91bmQ6ICcjZmRmZGZkJyxcblx0XHR2YWxpZGF0ZTogdHJ1ZSxcblx0XHRERUJVRzogZmFsc2V9LCBvcHRpb25zICk7XG5cblx0aWYgKCAkKCBcIiNmdWxsc2NyZWVuXCIgKS5sZW5ndGggPT09IDAgKSB7XG5cdFx0Ly8gYWRkIHVuZG8sIHJlZG8sIGZ1bGxzY3JlZW4gYnV0dG9ucyBhbmQgZXZlbnQgbGlzdGVuZXJzIG9uY2Vcblx0XHRwYnV0dG9ucy5hZGQob3B0cyk7XG5cdFx0aW8uYWRkKG9wdHMpO1xuXHR9XG5cblx0aWYocGVkY2FjaGUubnN0b3JlKG9wdHMpID09IC0xKVxuXHRcdHBlZGNhY2hlLmluaXRfY2FjaGUob3B0cyk7XG5cblx0cGJ1dHRvbnMudXBkYXRlQnV0dG9ucyhvcHRzKTtcblxuXHQvLyB2YWxpZGF0ZSBwZWRpZ3JlZSBkYXRhXG5cdHZhbGlkYXRlX3BlZGlncmVlKG9wdHMpO1xuXHQvLyBncm91cCB0b3AgbGV2ZWwgbm9kZXMgYnkgcGFydG5lcnNcblx0b3B0cy5kYXRhc2V0ID0gZ3JvdXBfdG9wX2xldmVsKG9wdHMuZGF0YXNldCk7XG5cblx0aWYob3B0cy5ERUJVRylcblx0XHRwZWRpZ3JlZV91dGlscy5wcmludF9vcHRzKG9wdHMpO1xuXHRsZXQgc3ZnX2RpbWVuc2lvbnMgPSBnZXRfc3ZnX2RpbWVuc2lvbnMob3B0cyk7XG5cdGxldCBzdmcgPSBkMy5zZWxlY3QoXCIjXCIrb3B0cy50YXJnZXREaXYpXG5cdFx0XHRcdCAuYXBwZW5kKFwic3ZnOnN2Z1wiKVxuXHRcdFx0XHQgLmF0dHIoXCJ3aWR0aFwiLCBzdmdfZGltZW5zaW9ucy53aWR0aClcblx0XHRcdFx0IC5hdHRyKFwiaGVpZ2h0XCIsIHN2Z19kaW1lbnNpb25zLmhlaWdodCk7XG5cblx0c3ZnLmFwcGVuZChcInJlY3RcIilcblx0XHQuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuXHRcdC5hdHRyKFwicnhcIiwgNilcblx0XHQuYXR0cihcInJ5XCIsIDYpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiZGFya2dyZXlcIilcblx0XHQuc3R5bGUoXCJmaWxsXCIsIG9wdHMuYmFja2dyb3VuZCkgLy8gb3Igbm9uZVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxKTtcblxuXHRsZXQgeHl0cmFuc2Zvcm0gPSBwZWRjYWNoZS5nZXRwb3NpdGlvbihvcHRzKTsgIC8vIGNhY2hlZCBwb3NpdGlvblxuXHRsZXQgeHRyYW5zZm9ybSA9IHh5dHJhbnNmb3JtWzBdO1xuXHRsZXQgeXRyYW5zZm9ybSA9IHh5dHJhbnNmb3JtWzFdO1xuXHRsZXQgem9vbSA9IDE7XG5cdGlmKHh5dHJhbnNmb3JtLmxlbmd0aCA9PSAzKXtcblx0XHR6b29tID0geHl0cmFuc2Zvcm1bMl07XG5cdH1cblxuXHRpZih4dHJhbnNmb3JtID09PSBudWxsIHx8IHl0cmFuc2Zvcm0gPT09IG51bGwpIHtcblx0XHR4dHJhbnNmb3JtID0gb3B0cy5zeW1ib2xfc2l6ZS8yO1xuXHRcdHl0cmFuc2Zvcm0gPSAoLW9wdHMuc3ltYm9sX3NpemUqMi41KTtcblx0fVxuXHRsZXQgcGVkID0gc3ZnLmFwcGVuZChcImdcIilcblx0XHRcdCAuYXR0cihcImNsYXNzXCIsIFwiZGlhZ3JhbVwiKVxuXHRcdFx0IC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3h0cmFuc2Zvcm0rXCIsXCIgKyB5dHJhbnNmb3JtICsgXCIpIHNjYWxlKFwiK3pvb20rXCIpXCIpO1xuXG5cdGxldCB0b3BfbGV2ZWwgPSAkLm1hcChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiAndG9wX2xldmVsJyBpbiB2YWwgJiYgdmFsLnRvcF9sZXZlbCA/IHZhbCA6IG51bGw7fSk7XG5cdGxldCBoaWRkZW5fcm9vdCA9IHtcblx0XHRuYW1lIDogJ2hpZGRlbl9yb290Jyxcblx0XHRpZCA6IDAsXG5cdFx0aGlkZGVuIDogdHJ1ZSxcblx0XHRjaGlsZHJlbiA6IHRvcF9sZXZlbFxuXHR9O1xuXG5cdGxldCBwYXJ0bmVycyA9IHBlZGlncmVlX3V0aWxzLmJ1aWxkVHJlZShvcHRzLCBoaWRkZW5fcm9vdCwgaGlkZGVuX3Jvb3QpWzBdO1xuXHRsZXQgcm9vdCA9IGQzLmhpZXJhcmNoeShoaWRkZW5fcm9vdCk7XG5cdHJvb3RzW29wdHMudGFyZ2V0RGl2XSA9IHJvb3Q7XG5cblx0Ly8gLyBnZXQgc2NvcmUgYXQgZWFjaCBkZXB0aCB1c2VkIHRvIGFkanVzdCBub2RlIHNlcGFyYXRpb25cblx0bGV0IHRyZWVfZGltZW5zaW9ucyA9IGdldF90cmVlX2RpbWVuc2lvbnMob3B0cyk7XG5cdGlmKG9wdHMuREVCVUcpXG5cdFx0Y29uc29sZS5sb2coJ29wdHMud2lkdGg9JytzdmdfZGltZW5zaW9ucy53aWR0aCsnIHdpZHRoPScrdHJlZV9kaW1lbnNpb25zLndpZHRoK1xuXHRcdFx0XHRcdCcgb3B0cy5oZWlnaHQ9JytzdmdfZGltZW5zaW9ucy5oZWlnaHQrJyBoZWlnaHQ9Jyt0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0KTtcblxuXHRsZXQgdHJlZW1hcCA9IGQzLnRyZWUoKS5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRyZXR1cm4gYS5wYXJlbnQgPT09IGIucGFyZW50IHx8IGEuZGF0YS5oaWRkZW4gfHwgYi5kYXRhLmhpZGRlbiA/IDEuMiA6IDIuMjtcblx0fSkuc2l6ZShbdHJlZV9kaW1lbnNpb25zLndpZHRoLCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0XSk7XG5cblx0bGV0IG5vZGVzID0gdHJlZW1hcChyb290LnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5kYXRhLmlkIC0gYi5kYXRhLmlkOyB9KSk7XG5cdGxldCBmbGF0dGVuTm9kZXMgPSBub2Rlcy5kZXNjZW5kYW50cygpO1xuXG5cdC8vIGNoZWNrIHRoZSBudW1iZXIgb2YgdmlzaWJsZSBub2RlcyBlcXVhbHMgdGhlIHNpemUgb2YgdGhlIHBlZGlncmVlIGRhdGFzZXRcblx0bGV0IHZpc19ub2RlcyA9ICQubWFwKG9wdHMuZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe3JldHVybiBwLmhpZGRlbiA/IG51bGwgOiBwO30pO1xuXHRpZih2aXNfbm9kZXMubGVuZ3RoICE9IG9wdHMuZGF0YXNldC5sZW5ndGgpIHtcblx0XHR0aHJvdyBjcmVhdGVfZXJyKCdOVU1CRVIgT0YgVklTSUJMRSBOT0RFUyBESUZGRVJFTlQgVE8gTlVNQkVSIElOIFRIRSBEQVRBU0VUJyk7XG5cdH1cblxuXHRwZWRpZ3JlZV91dGlscy5hZGp1c3RfY29vcmRzKG9wdHMsIG5vZGVzLCBmbGF0dGVuTm9kZXMpO1xuXG5cdGxldCBwdHJMaW5rTm9kZXMgPSBwZWRpZ3JlZV91dGlscy5saW5rTm9kZXMoZmxhdHRlbk5vZGVzLCBwYXJ0bmVycyk7XG5cdGNoZWNrX3B0cl9saW5rcyhvcHRzLCBwdHJMaW5rTm9kZXMpOyAgIC8vIGNoZWNrIGZvciBjcm9zc2luZyBvZiBwYXJ0bmVyIGxpbmVzXG5cblx0bGV0IG5vZGUgPSBwZWQuc2VsZWN0QWxsKFwiLm5vZGVcIilcblx0XHRcdFx0ICAuZGF0YShub2Rlcy5kZXNjZW5kYW50cygpKVxuXHRcdFx0XHQgIC5lbnRlcigpXG5cdFx0XHRcdCAgLmFwcGVuZChcImdcIilcblx0XHRcdFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjtcblx0XHRcdFx0XHR9KTtcblxuXHQvLyBwcm92aWRlIGEgYm9yZGVyIHRvIHRoZSBub2RlXG5cdG5vZGUuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gIWQuZGF0YS5oaWRkZW47fSlcblx0XHQuYXR0cihcInNoYXBlLXJlbmRlcmluZ1wiLCBcImdlb21ldHJpY1ByZWNpc2lvblwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5kYXRhLnNleCA9PSBcIlVcIiAmJiAhKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pID8gXCJyb3RhdGUoNDUpXCIgOiBcIlwiO30pXG5cdFx0LmF0dHIoXCJkXCIsIGQzLnN5bWJvbCgpLnNpemUoZnVuY3Rpb24oX2QpIHsgcmV0dXJuIChvcHRzLnN5bWJvbF9zaXplICogb3B0cy5zeW1ib2xfc2l6ZSkgKyAyO30pXG5cdFx0XHRcdC50eXBlKGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0XHRpZihkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKVxuXHRcdFx0XHRcdFx0cmV0dXJuIGQzLnN5bWJvbFRyaWFuZ2xlO1xuXHRcdFx0XHRcdHJldHVybiBkLmRhdGEuc2V4ID09IFwiRlwiID8gZDMuc3ltYm9sQ2lyY2xlIDogZDMuc3ltYm9sU3F1YXJlO30pKVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0cmV0dXJuIGQuZGF0YS5hZ2UgJiYgZC5kYXRhLnlvYiAmJiAhZC5kYXRhLmV4Y2x1ZGUgPyBcIiMzMDMwMzBcIiA6IFwiZ3JleVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRyZXR1cm4gZC5kYXRhLmFnZSAmJiBkLmRhdGEueW9iICYmICFkLmRhdGEuZXhjbHVkZSA/IFwiLjNlbVwiIDogXCIuMWVtXCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuZXhjbHVkZSA/IG51bGwgOiAoXCIzLCAzXCIpO30pXG5cdFx0LnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblx0Ly8gc2V0IGEgY2xpcHBhdGhcblx0bm9kZS5hcHBlbmQoXCJjbGlwUGF0aFwiKVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5kYXRhLm5hbWU7fSkuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gIShkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHKTt9KVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge3JldHVybiBkLmRhdGEuc2V4ID09IFwiVVwiICYmICEoZC5kYXRhLm1pc2NhcnJpYWdlIHx8IGQuZGF0YS50ZXJtaW5hdGlvbikgPyBcInJvdGF0ZSg0NSlcIiA6IFwiXCI7fSlcblx0XHQuYXR0cihcImRcIiwgZDMuc3ltYm9sKCkuc2l6ZShmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmIChkLmRhdGEuaGlkZGVuKVxuXHRcdFx0XHRcdHJldHVybiBvcHRzLnN5bWJvbF9zaXplICogb3B0cy5zeW1ib2xfc2l6ZSAvIDU7XG5cdFx0XHRcdHJldHVybiBvcHRzLnN5bWJvbF9zaXplICogb3B0cy5zeW1ib2xfc2l6ZTtcblx0XHRcdH0pXG5cdFx0XHQudHlwZShmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pXG5cdFx0XHRcdFx0cmV0dXJuIGQzLnN5bWJvbFRyaWFuZ2xlO1xuXHRcdFx0XHRyZXR1cm4gZC5kYXRhLnNleCA9PSBcIkZcIiA/IGQzLnN5bWJvbENpcmNsZSA6ZDMuc3ltYm9sU3F1YXJlO30pKTtcblxuXHQvLyBwaWUgcGxvdHMgZm9yIGRpc2Vhc2UgY29sb3Vyc1xuXHRsZXQgcGllbm9kZSA9IG5vZGUuc2VsZWN0QWxsKFwicGllbm9kZVwiKVxuXHQgICAuZGF0YShmdW5jdGlvbihkKSB7XHQgXHRcdC8vIHNldCB0aGUgZGlzZWFzZSBkYXRhIGZvciB0aGUgcGllIHBsb3Rcblx0XHQgICBsZXQgbmNhbmNlcnMgPSAwO1xuXHRcdCAgIGxldCBjYW5jZXJzID0gJC5tYXAob3B0cy5kaXNlYXNlcywgZnVuY3Rpb24odmFsLCBpKXtcblx0XHRcdCAgIGlmKHByZWZpeEluT2JqKG9wdHMuZGlzZWFzZXNbaV0udHlwZSwgZC5kYXRhKSkge25jYW5jZXJzKys7IHJldHVybiAxO30gZWxzZSByZXR1cm4gMDtcblx0XHQgICB9KTtcblx0XHQgICBpZihuY2FuY2VycyA9PT0gMCkgY2FuY2VycyA9IFsxXTtcblx0XHQgICByZXR1cm4gWyQubWFwKGNhbmNlcnMsIGZ1bmN0aW9uKHZhbCwgX2kpe1xuXHRcdFx0ICAgcmV0dXJuIHsnY2FuY2VyJzogdmFsLCAnbmNhbmNlcnMnOiBuY2FuY2VycywgJ2lkJzogZC5kYXRhLm5hbWUsXG5cdFx0XHRcdFx0XHQnc2V4JzogZC5kYXRhLnNleCwgJ3Byb2JhbmQnOiBkLmRhdGEucHJvYmFuZCwgJ2hpZGRlbic6IGQuZGF0YS5oaWRkZW4sXG5cdFx0XHRcdFx0XHQnYWZmZWN0ZWQnOiBkLmRhdGEuYWZmZWN0ZWQsXG5cdFx0XHRcdFx0XHQnZXhjbHVkZSc6IGQuZGF0YS5leGNsdWRlfTt9KV07XG5cdCAgIH0pXG5cdCAgIC5lbnRlcigpXG5cdFx0LmFwcGVuZChcImdcIik7XG5cblx0cGllbm9kZS5zZWxlY3RBbGwoXCJwYXRoXCIpXG5cdFx0LmRhdGEoZDMucGllKCkudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmNhbmNlcjt9KSlcblx0XHQuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0XHQuYXR0cihcImNsaXAtcGF0aFwiLCBmdW5jdGlvbihkKSB7cmV0dXJuIFwidXJsKCNcIitkLmRhdGEuaWQrXCIpXCI7fSkgLy8gY2xpcCB0aGUgcmVjdGFuZ2xlXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicGllbm9kZVwiKVxuXHRcdFx0LmF0dHIoXCJkXCIsIGQzLmFyYygpLmlubmVyUmFkaXVzKDApLm91dGVyUmFkaXVzKG9wdHMuc3ltYm9sX3NpemUpKVxuXHRcdFx0LnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRcdGlmKGQuZGF0YS5leGNsdWRlKVxuXHRcdFx0XHRcdHJldHVybiAnbGlnaHRncmV5Jztcblx0XHRcdFx0aWYoZC5kYXRhLm5jYW5jZXJzID09PSAwKSB7XG5cdFx0XHRcdFx0aWYoZC5kYXRhLmFmZmVjdGVkKVxuXHRcdFx0XHRcdFx0cmV0dXJuICdkYXJrZ3JleSc7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdHMubm9kZV9iYWNrZ3JvdW5kO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBvcHRzLmRpc2Vhc2VzW2ldLmNvbG91cjtcblx0XHRcdH0pO1xuXG5cdC8vIGFkb3B0ZWQgaW4vb3V0IGJyYWNrZXRzXG5cdG5vZGUuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gIWQuZGF0YS5oaWRkZW4gJiYgKGQuZGF0YS5hZG9wdGVkX2luIHx8IGQuZGF0YS5hZG9wdGVkX291dCk7fSlcblx0XHQuYXR0cihcImRcIiwgZnVuY3Rpb24oX2QpIHsge1xuXHRcdFx0bGV0IGR4ID0gLShvcHRzLnN5bWJvbF9zaXplICogMC42Nik7XG5cdFx0XHRsZXQgZHkgPSAtKG9wdHMuc3ltYm9sX3NpemUgKiAwLjY0KTtcblx0XHRcdGxldCBpbmRlbnQgPSBvcHRzLnN5bWJvbF9zaXplLzQ7XG5cdFx0XHRyZXR1cm4gZ2V0X2JyYWNrZXQoZHgsIGR5LCBpbmRlbnQsIG9wdHMpK2dldF9icmFja2V0KC1keCwgZHksIC1pbmRlbnQsIG9wdHMpO1xuXHRcdFx0fX0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRyZXR1cm4gZC5kYXRhLmFnZSAmJiBkLmRhdGEueW9iICYmICFkLmRhdGEuZXhjbHVkZSA/IFwiIzMwMzAzMFwiIDogXCJncmV5XCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKF9kKSB7XG5cdFx0XHRyZXR1cm4gXCIuMWVtXCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuZXhjbHVkZSA/IG51bGwgOiAoXCIzLCAzXCIpO30pXG5cdFx0LnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblxuXHQvLyBhbGl2ZSBzdGF0dXMgPSAwOyBkZWFkIHN0YXR1cyA9IDFcblx0bm9kZS5hcHBlbmQoJ2xpbmUnKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5kYXRhLnN0YXR1cyA9PSAxO30pXG5cdFx0XHQuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHRcdFx0LmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gLTAuNipvcHRzLnN5bWJvbF9zaXplO30pXG5cdFx0XHQuYXR0cihcInkxXCIsIGZ1bmN0aW9uKF9kLCBfaSkge3JldHVybiAwLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KVxuXHRcdFx0LmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gMC42Km9wdHMuc3ltYm9sX3NpemU7fSlcblx0XHRcdC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIC0wLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KTtcblxuXHQvLyBuYW1lcyBvZiBpbmRpdmlkdWFsc1xuXHRhZGRMYWJlbChvcHRzLCBub2RlLCBcIi4yNWVtXCIsIC0oMC40ICogb3B0cy5zeW1ib2xfc2l6ZSksIC0oMC4xICogb3B0cy5zeW1ib2xfc2l6ZSksXG5cdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRcdFx0cmV0dXJuICgnZGlzcGxheV9uYW1lJyBpbiBkLmRhdGEgPyBkLmRhdGEuZGlzcGxheV9uYW1lIDogZC5kYXRhLm5hbWUpICsgJyAgJyArIGQuZGF0YS5pZDtcblx0XHRcdFx0cmV0dXJuICdkaXNwbGF5X25hbWUnIGluIGQuZGF0YSA/IGQuZGF0YS5kaXNwbGF5X25hbWUgOiAnJzt9KTtcblxuLypcbiAqIGxldCB3YXJuID0gbm9kZS5maWx0ZXIoZnVuY3Rpb24gKGQpIHsgcmV0dXJuICghZC5kYXRhLmFnZSB8fCAhZC5kYXRhLnlvYikgJiYgIWQuZGF0YS5oaWRkZW47IH0pLmFwcGVuZChcInRleHRcIikgLmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcbiAqIC5hdHRyKFwieFwiLCBcIi4yNWVtXCIpIC5hdHRyKFwieVwiLCAtKDAuNCAqIG9wdHMuc3ltYm9sX3NpemUpLCAtKDAuMiAqIG9wdHMuc3ltYm9sX3NpemUpKSAuaHRtbChcIlxcdWYwNzFcIik7IHdhcm4uYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJpbmNvbXBsZXRlXCIpO1xuICovXG5cblx0bGV0IGZvbnRfc2l6ZSA9IHBhcnNlSW50KGdldFB4KG9wdHMpKSArIDQ7XG5cdC8vIGRpc3BsYXkgbGFiZWwgZGVmaW5lZCBpbiBvcHRzLmxhYmVscyBlLmcuIGFsbGVsZXMvZ2Vub3R5cGUgZGF0YVxuXHRmb3IobGV0IGlsYWI9MDsgaWxhYjxvcHRzLmxhYmVscy5sZW5ndGg7IGlsYWIrKykge1xuXHRcdGxldCBsYWJlbCA9IG9wdHMubGFiZWxzW2lsYWJdO1xuXHRcdGFkZExhYmVsKG9wdHMsIG5vZGUsIFwiLjI1ZW1cIiwgLSgwLjcgKiBvcHRzLnN5bWJvbF9zaXplKSxcblx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYoIWQuZGF0YVtsYWJlbF0pXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRkLnlfb2Zmc2V0ID0gKGlsYWIgPT09IDAgfHwgIWQueV9vZmZzZXQgPyBmb250X3NpemUqMi4yNSA6IGQueV9vZmZzZXQrZm9udF9zaXplKTtcblx0XHRcdFx0cmV0dXJuIGQueV9vZmZzZXQ7XG5cdFx0XHR9LFxuXHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZihkLmRhdGFbbGFiZWxdKSB7XG5cdFx0XHRcdFx0aWYobGFiZWwgPT09ICdhbGxlbGVzJykge1xuXHRcdFx0XHRcdFx0bGV0IGFsbGVsZXMgPSBcIlwiO1xuXHRcdFx0XHRcdFx0bGV0IHZhcnMgPSBkLmRhdGEuYWxsZWxlcy5zcGxpdCgnOycpO1xuXHRcdFx0XHRcdFx0Zm9yKGxldCBpdmFyID0gMDtpdmFyIDwgdmFycy5sZW5ndGg7aXZhcisrKSB7XG5cdFx0XHRcdFx0XHRcdGlmKHZhcnNbaXZhcl0gIT09IFwiXCIpIGFsbGVsZXMgKz0gdmFyc1tpdmFyXSArICc7Jztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBhbGxlbGVzO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihsYWJlbCA9PT0gJ2FnZScpIHtcblx0XHRcdFx0XHRcdHJldHVybiBkLmRhdGFbbGFiZWxdICsneSc7XG5cdFx0XHRcdFx0fSBlbHNlIGlmKGxhYmVsID09PSAnc3RpbGxiaXJ0aCcpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcIlNCXCI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBkLmRhdGFbbGFiZWxdO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCAnaW5kaV9kZXRhaWxzJyk7XG5cdH1cblxuXHQvLyBpbmRpdmlkdWFscyBkaXNlYXNlIGRldGFpbHNcblx0Zm9yKGxldCBpPTA7aTxvcHRzLmRpc2Vhc2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGRpc2Vhc2UgPSBvcHRzLmRpc2Vhc2VzW2ldLnR5cGU7XG5cdFx0YWRkTGFiZWwob3B0cywgbm9kZSwgXCIuMjVlbVwiLCAtKG9wdHMuc3ltYm9sX3NpemUpLFxuXHRcdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdFx0bGV0IHlfb2Zmc2V0ID0gKGQueV9vZmZzZXQgPyBkLnlfb2Zmc2V0K2ZvbnRfc2l6ZTogZm9udF9zaXplKjIuMik7XG5cdFx0XHRcdFx0Zm9yKGxldCBqPTA7ajxvcHRzLmRpc2Vhc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRpZihkaXNlYXNlID09PSBvcHRzLmRpc2Vhc2VzW2pdLnR5cGUpXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0aWYocHJlZml4SW5PYmoob3B0cy5kaXNlYXNlc1tqXS50eXBlLCBkLmRhdGEpKVxuXHRcdFx0XHRcdFx0XHR5X29mZnNldCArPSBmb250X3NpemUtMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHlfb2Zmc2V0O1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdFx0bGV0IGRpcyA9IGRpc2Vhc2UucmVwbGFjZSgnXycsICcgJykucmVwbGFjZSgnY2FuY2VyJywgJ2NhLicpO1xuXHRcdFx0XHRcdHJldHVybiBkaXNlYXNlKydfZGlhZ25vc2lzX2FnZScgaW4gZC5kYXRhID8gZGlzICtcIjogXCIrIGQuZGF0YVtkaXNlYXNlKydfZGlhZ25vc2lzX2FnZSddIDogJyc7XG5cdFx0XHRcdH0sICdpbmRpX2RldGFpbHMnKTtcblx0fVxuXG5cdC8vXG5cdGFkZFdpZGdldHMob3B0cywgbm9kZSk7XG5cblx0Ly8gbGlua3MgYmV0d2VlbiBwYXJ0bmVyc1xuXHRsZXQgY2xhc2hfZGVwdGggPSB7fTtcblx0XG5cdC8vIGdldCBwYXRoIGxvb3Bpbmcgb3ZlciBub2RlKHMpXG5cdGxldCBkcmF3X3BhdGggPSBmdW5jdGlvbihjbGFzaCwgZHgsIGR5MSwgZHkyLCBwYXJlbnRfbm9kZSwgY3NoaWZ0KSB7XG5cdFx0bGV0IGV4dGVuZCA9IGZ1bmN0aW9uKGksIGwpIHtcblx0XHRcdGlmKGkrMSA8IGwpICAgLy8gJiYgTWF0aC5hYnMoY2xhc2hbaV0gLSBjbGFzaFtpKzFdKSA8IChvcHRzLnN5bWJvbF9zaXplKjEuMjUpXG5cdFx0XHRcdHJldHVybiBleHRlbmQoKytpKTtcblx0XHRcdHJldHVybiBpO1xuXHRcdH07XG5cdFx0bGV0IHBhdGggPSBcIlwiO1xuXHRcdGZvcihsZXQgaj0wOyBqPGNsYXNoLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRsZXQgayA9IGV4dGVuZChqLCBjbGFzaC5sZW5ndGgpO1xuXHRcdFx0bGV0IGR4MSA9IGNsYXNoW2pdIC0gZHggLSBjc2hpZnQ7XG5cdFx0XHRsZXQgZHgyID0gY2xhc2hba10gKyBkeCArIGNzaGlmdDtcblx0XHRcdGlmKHBhcmVudF9ub2RlLnggPiBkeDEgJiYgcGFyZW50X25vZGUueCA8IGR4Milcblx0XHRcdFx0cGFyZW50X25vZGUueSA9IGR5MjtcblxuXHRcdFx0cGF0aCArPSBcIkxcIiArIGR4MSArIFwiLFwiICsgIChkeTEgLSBjc2hpZnQpICtcblx0XHRcdFx0XHRcIkxcIiArIGR4MSArIFwiLFwiICsgIChkeTIgLSBjc2hpZnQpICtcblx0XHRcdFx0XHRcIkxcIiArIGR4MiArIFwiLFwiICsgIChkeTIgLSBjc2hpZnQpICtcblx0XHRcdFx0XHRcIkxcIiArIGR4MiArIFwiLFwiICsgIChkeTEgLSBjc2hpZnQpO1xuXHRcdFx0aiA9IGs7XG5cdFx0fVxuXHRcdHJldHVybiBwYXRoO1xuXHR9XG5cdFxuXHRcblx0cGFydG5lcnMgPSBwZWQuc2VsZWN0QWxsKFwiLnBhcnRuZXJcIilcblx0XHQuZGF0YShwdHJMaW5rTm9kZXMpXG5cdFx0LmVudGVyKClcblx0XHRcdC5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIiwgXCIjMDAwXCIpXG5cdFx0XHQuYXR0cihcInNoYXBlLXJlbmRlcmluZ1wiLCBcImF1dG9cIilcblx0XHRcdC5hdHRyKCdkJywgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0bGV0IG5vZGUxID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGQubW90aGVyLmRhdGEubmFtZSk7XG5cdFx0XHRcdGxldCBub2RlMiA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLmZhdGhlci5kYXRhLm5hbWUpO1xuXHRcdFx0XHRsZXQgY29uc2FuZ3VpdHkgPSBwZWRpZ3JlZV91dGlscy5jb25zYW5ndWl0eShub2RlMSwgbm9kZTIsIG9wdHMpO1xuXHRcdFx0XHRsZXQgZGl2b3JjZWQgPSAoZC5tb3RoZXIuZGF0YS5kaXZvcmNlZCAmJiAgZC5tb3RoZXIuZGF0YS5kaXZvcmNlZCA9PT0gZC5mYXRoZXIuZGF0YS5uYW1lKTtcblxuXHRcdFx0XHRsZXQgeDEgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLm1vdGhlci54IDogZC5mYXRoZXIueCk7XG5cdFx0XHRcdGxldCB4MiA9IChkLm1vdGhlci54IDwgZC5mYXRoZXIueCA/IGQuZmF0aGVyLnggOiBkLm1vdGhlci54KTtcblx0XHRcdFx0bGV0IGR5MSA9IGQubW90aGVyLnk7XG5cdFx0XHRcdGxldCBkeTIsIGR4LCBwYXJlbnRfbm9kZTtcblxuXHRcdFx0XHQvLyBpZGVudGlmeSBjbGFzaGVzIHdpdGggb3RoZXIgbm9kZXMgYXQgdGhlIHNhbWUgZGVwdGhcblx0XHRcdFx0bGV0IGNsYXNoID0gY2hlY2tfcHRyX2xpbmtfY2xhc2hlcyhvcHRzLCBkKTtcblx0XHRcdFx0bGV0IHBhdGggPSBcIlwiO1xuXHRcdFx0XHRpZihjbGFzaCkge1xuXHRcdFx0XHRcdGlmKGQubW90aGVyLmRlcHRoIGluIGNsYXNoX2RlcHRoKVxuXHRcdFx0XHRcdFx0Y2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdICs9IDQ7XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdID0gNDtcblxuXHRcdFx0XHRcdGR5MSAtPSBjbGFzaF9kZXB0aFtkLm1vdGhlci5kZXB0aF07XG5cdFx0XHRcdFx0ZHggPSBjbGFzaF9kZXB0aFtkLm1vdGhlci5kZXB0aF0gKyBvcHRzLnN5bWJvbF9zaXplLzIgKyAyO1xuXG5cdFx0XHRcdFx0bGV0IHBhcmVudF9ub2RlcyA9IGQubW90aGVyLmRhdGEucGFyZW50X25vZGU7XG5cdFx0XHRcdFx0bGV0IHBhcmVudF9ub2RlX25hbWUgPSBwYXJlbnRfbm9kZXNbMF07XG5cdFx0XHRcdFx0Zm9yKGxldCBpaT0wOyBpaTxwYXJlbnRfbm9kZXMubGVuZ3RoOyBpaSsrKSB7XG5cdFx0XHRcdFx0XHRpZihwYXJlbnRfbm9kZXNbaWldLmZhdGhlci5uYW1lID09PSBkLmZhdGhlci5kYXRhLm5hbWUgJiZcblx0XHRcdFx0XHRcdCAgIHBhcmVudF9ub2Rlc1tpaV0ubW90aGVyLm5hbWUgPT09IGQubW90aGVyLmRhdGEubmFtZSlcblx0XHRcdFx0XHRcdFx0cGFyZW50X25vZGVfbmFtZSA9IHBhcmVudF9ub2Rlc1tpaV0ubmFtZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFyZW50X25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgcGFyZW50X25vZGVfbmFtZSk7XG5cdFx0XHRcdFx0cGFyZW50X25vZGUueSA9IGR5MTsgLy8gYWRqdXN0IGhndCBvZiBwYXJlbnQgbm9kZVxuXHRcdFx0XHRcdGNsYXNoLnNvcnQoZnVuY3Rpb24gKGEsYikge3JldHVybiBhIC0gYjt9KTtcblxuXHRcdFx0XHRcdGR5MiA9IChkeTEtb3B0cy5zeW1ib2xfc2l6ZS8yLTMpO1xuXHRcdFx0XHRcdHBhdGggPSBkcmF3X3BhdGgoY2xhc2gsIGR4LCBkeTEsIGR5MiwgcGFyZW50X25vZGUsIDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGRpdm9yY2VfcGF0aCA9IFwiXCI7XG5cdFx0XHRcdGlmKGRpdm9yY2VkICYmICFjbGFzaClcblx0XHRcdFx0XHRkaXZvcmNlX3BhdGggPSBcIk1cIiArICh4MSsoKHgyLXgxKSouNjYpKzYpICsgXCIsXCIgKyAoZHkxLTYpICtcblx0XHRcdFx0XHRcdFx0XHQgICBcIkxcIisgICh4MSsoKHgyLXgxKSouNjYpLTYpICsgXCIsXCIgKyAoZHkxKzYpICtcblx0XHRcdFx0XHRcdFx0XHQgICBcIk1cIiArICh4MSsoKHgyLXgxKSouNjYpKzEwKSArIFwiLFwiICsgKGR5MS02KSArXG5cdFx0XHRcdFx0XHRcdFx0ICAgXCJMXCIrICAoeDErKCh4Mi14MSkqLjY2KS0yKSAgKyBcIixcIiArIChkeTErNik7XG5cdFx0XHRcdGlmKGNvbnNhbmd1aXR5KSB7ICAvLyBjb25zYW5ndWlub3VzLCBkcmF3IGRvdWJsZSBsaW5lIGJldHdlZW4gcGFydG5lcnNcblx0XHRcdFx0XHRkeTEgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLm1vdGhlci55IDogZC5mYXRoZXIueSk7XG5cdFx0XHRcdFx0ZHkyID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5mYXRoZXIueSA6IGQubW90aGVyLnkpO1xuXG5cdFx0XHRcdFx0bGV0IGNzaGlmdCA9IDM7XG5cdFx0XHRcdFx0aWYoTWF0aC5hYnMoZHkxLWR5MikgPiAwLjEpIHtcdCAgLy8gRElGRkVSRU5UIExFVkVMXG5cdFx0XHRcdFx0XHRyZXR1cm5cdFwiTVwiICsgeDEgKyBcIixcIiArIGR5MSArIFwiTFwiICsgeDIgKyBcIixcIiArIGR5MiArXG5cdFx0XHRcdFx0XHRcdFx0XCJNXCIgKyB4MSArIFwiLFwiICsgKGR5MSAtIGNzaGlmdCkgKyBcIkxcIiArIHgyICsgXCIsXCIgKyAoZHkyIC0gY3NoaWZ0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1x0XHRcdFx0XHRcdCAgIC8vIFNBTUUgTEVWRUxcblx0XHRcdFx0XHRcdGxldCBwYXRoMiA9IChjbGFzaCA/IGRyYXdfcGF0aChjbGFzaCwgZHgsIGR5MSwgZHkyLCBwYXJlbnRfbm9kZSwgY3NoaWZ0KSA6IFwiXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuXHRcIk1cIiArIHgxICsgXCIsXCIgKyBkeTEgKyBwYXRoICsgXCJMXCIgKyB4MiArIFwiLFwiICsgZHkxICtcblx0XHRcdFx0XHRcdFx0XHRcIk1cIiArIHgxICsgXCIsXCIgKyAoZHkxIC0gY3NoaWZ0KSArIHBhdGgyICsgXCJMXCIgKyB4MiArIFwiLFwiICsgKGR5MSAtIGNzaGlmdCkgKyBkaXZvcmNlX3BhdGg7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVyblx0XCJNXCIgKyB4MSArIFwiLFwiICsgZHkxICsgcGF0aCArIFwiTFwiICsgeDIgKyBcIixcIiArIGR5MSArIGRpdm9yY2VfcGF0aDtcblx0XHRcdH0pO1xuXG5cdC8vIGxpbmtzIHRvIGNoaWxkcmVuXG5cdHBlZC5zZWxlY3RBbGwoXCIubGlua1wiKVxuXHRcdC5kYXRhKHJvb3QubGlua3Mobm9kZXMuZGVzY2VuZGFudHMoKSkpXG5cdFx0LmVudGVyKClcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0Ly8gZmlsdGVyIHVubGVzcyBkZWJ1ZyBpcyBzZXRcblx0XHRcdFx0cmV0dXJuIChvcHRzLkRFQlVHIHx8XG5cdFx0XHRcdFx0XHQoZC50YXJnZXQuZGF0YS5ub3BhcmVudHMgPT09IHVuZGVmaW5lZCAmJiBkLnNvdXJjZS5wYXJlbnQgIT09IG51bGwgJiYgIWQudGFyZ2V0LmRhdGEuaGlkZGVuKSk7XG5cdFx0XHR9KVxuXHRcdFx0Lmluc2VydChcInBhdGhcIiwgXCJnXCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG5cdFx0XHQuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm5vcGFyZW50cyAhPT0gdW5kZWZpbmVkIHx8IGQuc291cmNlLnBhcmVudCA9PT0gbnVsbCB8fCBkLnRhcmdldC5kYXRhLmhpZGRlbilcblx0XHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdFx0cmV0dXJuIChvcHRzLkRFQlVHID8gMiA6IDEpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKGQudGFyZ2V0LmRhdGEubm9wYXJlbnRzICE9PSB1bmRlZmluZWQgfHwgZC5zb3VyY2UucGFyZW50ID09PSBudWxsIHx8IGQudGFyZ2V0LmRhdGEuaGlkZGVuKVxuXHRcdFx0XHRcdHJldHVybiAncGluayc7XG5cdFx0XHRcdHJldHVybiBcIiMwMDBcIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInN0cm9rZS1kYXNoYXJyYXlcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoIWQudGFyZ2V0LmRhdGEuYWRvcHRlZF9pbikgcmV0dXJuIG51bGw7XG5cdFx0XHRcdGxldCBkYXNoX2xlbiA9IE1hdGguYWJzKGQuc291cmNlLnktKChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkgLyAyKSk7XG5cdFx0XHRcdGxldCBkYXNoX2FycmF5ID0gW2Rhc2hfbGVuLCAwLCBNYXRoLmFicyhkLnNvdXJjZS54LWQudGFyZ2V0LngpLCAwXTtcblx0XHRcdFx0bGV0IHR3aW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0VHdpbnMob3B0cy5kYXRhc2V0LCBkLnRhcmdldC5kYXRhKTtcblx0XHRcdFx0aWYodHdpbnMubGVuZ3RoID49IDEpIGRhc2hfbGVuID0gZGFzaF9sZW4gKiAzO1xuXHRcdFx0XHRmb3IobGV0IHVzZWRsZW4gPSAwOyB1c2VkbGVuIDwgZGFzaF9sZW47IHVzZWRsZW4gKz0gMTApXG5cdFx0XHRcdFx0JC5tZXJnZShkYXNoX2FycmF5LCBbNSwgNV0pO1xuXHRcdFx0XHRyZXR1cm4gZGFzaF9hcnJheTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInNoYXBlLXJlbmRlcmluZ1wiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm16dHdpbiB8fCBkLnRhcmdldC5kYXRhLmR6dHdpbilcblx0XHRcdFx0XHRyZXR1cm4gXCJnZW9tZXRyaWNQcmVjaXNpb25cIjtcblx0XHRcdFx0cmV0dXJuIFwiYXV0b1wiO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm16dHdpbiB8fCBkLnRhcmdldC5kYXRhLmR6dHdpbikge1xuXHRcdFx0XHRcdC8vIGdldCB0d2luIHBvc2l0aW9uXG5cdFx0XHRcdFx0bGV0IHR3aW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0VHdpbnMob3B0cy5kYXRhc2V0LCBkLnRhcmdldC5kYXRhKTtcblx0XHRcdFx0XHRpZih0d2lucy5sZW5ndGggPj0gMSkge1xuXHRcdFx0XHRcdFx0bGV0IHR3aW54ID0gMDtcblx0XHRcdFx0XHRcdGxldCB4bWluID0gZC50YXJnZXQueDtcblx0XHRcdFx0XHRcdGxldCB4bWF4ID0gZC50YXJnZXQueDtcblx0XHRcdFx0XHRcdGZvcihsZXQgdD0wOyB0PHR3aW5zLmxlbmd0aDsgdCsrKSB7XG5cdFx0XHRcdFx0XHRcdGxldCB0aGlzeCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCB0d2luc1t0XS5uYW1lKS54O1xuXHRcdFx0XHRcdFx0XHRpZih4bWluID4gdGhpc3gpIHhtaW4gPSB0aGlzeDtcblx0XHRcdFx0XHRcdFx0aWYoeG1heCA8IHRoaXN4KSB4bWF4ID0gdGhpc3g7XG5cdFx0XHRcdFx0XHRcdHR3aW54ICs9IHRoaXN4O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRsZXQgeG1pZCA9ICgoZC50YXJnZXQueCArIHR3aW54KSAvICh0d2lucy5sZW5ndGgrMSkpO1xuXHRcdFx0XHRcdFx0bGV0IHltaWQgPSAoKGQuc291cmNlLnkgKyBkLnRhcmdldC55KSAvIDIpO1xuXG5cdFx0XHRcdFx0XHRsZXQgeGhiYXIgPSBcIlwiO1xuXHRcdFx0XHRcdFx0aWYoeG1pbiA9PT0gZC50YXJnZXQueCAmJiBkLnRhcmdldC5kYXRhLm16dHdpbikge1xuXHRcdFx0XHRcdFx0XHQvLyBob3Jpem9udGFsIGJhciBmb3IgbXp0d2luc1xuXHRcdFx0XHRcdFx0XHRsZXQgeHggPSAoeG1pZCArIGQudGFyZ2V0LngpLzI7XG5cdFx0XHRcdFx0XHRcdGxldCB5eSA9ICh5bWlkICsgKGQudGFyZ2V0Lnktb3B0cy5zeW1ib2xfc2l6ZS8yKSkvMjtcblx0XHRcdFx0XHRcdFx0eGhiYXIgPSBcIk1cIiArIHh4ICsgXCIsXCIgKyB5eSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcIkxcIiArICh4bWlkICsgKHhtaWQteHgpKSArIFwiIFwiICsgeXk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiBcIk1cIiArIChkLnNvdXJjZS54KSArIFwiLFwiICsgKGQuc291cmNlLnkgKSArXG5cdFx0XHRcdFx0XHRcdCAgIFwiVlwiICsgeW1pZCArXG5cdFx0XHRcdFx0XHRcdCAgIFwiSFwiICsgeG1pZCArXG5cdFx0XHRcdFx0XHRcdCAgIFwiTFwiICsgKGQudGFyZ2V0LngpICsgXCIgXCIgKyAoZC50YXJnZXQueS1vcHRzLnN5bWJvbF9zaXplLzIpICtcblx0XHRcdFx0XHRcdFx0ICAgeGhiYXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoZC5zb3VyY2UuZGF0YS5tb3RoZXIpIHsgICAvLyBjaGVjayBwYXJlbnRzIGRlcHRoIHRvIHNlZSBpZiB0aGV5IGFyZSBhdCB0aGUgc2FtZSBsZXZlbCBpbiB0aGUgdHJlZVxuXHRcdFx0XHRcdGxldCBtYSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLnNvdXJjZS5kYXRhLm1vdGhlci5uYW1lKTtcblx0XHRcdFx0XHRsZXQgcGEgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5zb3VyY2UuZGF0YS5mYXRoZXIubmFtZSk7XG5cblx0XHRcdFx0XHRpZihtYS5kZXB0aCAhPT0gcGEuZGVwdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcIk1cIiArIChkLnNvdXJjZS54KSArIFwiLFwiICsgKChtYS55ICsgcGEueSkgLyAyKSArXG5cdFx0XHRcdFx0XHRcdCAgIFwiSFwiICsgKGQudGFyZ2V0LngpICtcblx0XHRcdFx0XHRcdFx0ICAgXCJWXCIgKyAoZC50YXJnZXQueSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFwiTVwiICsgKGQuc291cmNlLngpICsgXCIsXCIgKyAoZC5zb3VyY2UueSApICtcblx0XHRcdFx0XHQgICBcIlZcIiArICgoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpIC8gMikgK1xuXHRcdFx0XHRcdCAgIFwiSFwiICsgKGQudGFyZ2V0LngpICtcblx0XHRcdFx0XHQgICBcIlZcIiArIChkLnRhcmdldC55KTtcblx0XHRcdH0pO1xuXG5cdC8vIGRyYXcgcHJvYmFuZCBhcnJvd1xuXHRsZXQgcHJvYmFuZElkeCAgPSBwZWRpZ3JlZV91dGlscy5nZXRQcm9iYW5kSW5kZXgob3B0cy5kYXRhc2V0KTtcblx0aWYodHlwZW9mIHByb2JhbmRJZHggIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0bGV0IHByb2JhbmROb2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIG9wdHMuZGF0YXNldFtwcm9iYW5kSWR4XS5uYW1lKTtcblx0XHRsZXQgdHJpaWQgPSBcInRyaWFuZ2xlXCIrcGVkaWdyZWVfdXRpbHMubWFrZWlkKDMpO1xuXHRcdHBlZC5hcHBlbmQoXCJzdmc6ZGVmc1wiKS5hcHBlbmQoXCJzdmc6bWFya2VyXCIpXHQvLyBhcnJvdyBoZWFkXG5cdFx0XHQuYXR0cihcImlkXCIsIHRyaWlkKVxuXHRcdFx0LmF0dHIoXCJyZWZYXCIsIDYpXG5cdFx0XHQuYXR0cihcInJlZllcIiwgNilcblx0XHRcdC5hdHRyKFwibWFya2VyV2lkdGhcIiwgMjApXG5cdFx0XHQuYXR0cihcIm1hcmtlckhlaWdodFwiLCAyMClcblx0XHRcdC5hdHRyKFwib3JpZW50XCIsIFwiYXV0b1wiKVxuXHRcdFx0LmFwcGVuZChcInBhdGhcIilcblx0XHRcdC5hdHRyKFwiZFwiLCBcIk0gMCAwIDEyIDYgMCAxMiAzIDZcIilcblx0XHRcdC5zdHlsZShcImZpbGxcIiwgXCJibGFja1wiKTtcblxuXHRcdHBlZC5hcHBlbmQoXCJsaW5lXCIpXG5cdFx0XHQuYXR0cihcIngxXCIsIHByb2JhbmROb2RlLngtb3B0cy5zeW1ib2xfc2l6ZSlcblx0XHRcdC5hdHRyKFwieTFcIiwgcHJvYmFuZE5vZGUueStvcHRzLnN5bWJvbF9zaXplKVxuXHRcdFx0LmF0dHIoXCJ4MlwiLCBwcm9iYW5kTm9kZS54LW9wdHMuc3ltYm9sX3NpemUvMilcblx0XHRcdC5hdHRyKFwieTJcIiwgcHJvYmFuZE5vZGUueStvcHRzLnN5bWJvbF9zaXplLzIpXG5cdFx0XHQuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHRcdFx0LmF0dHIoXCJtYXJrZXItZW5kXCIsIFwidXJsKCNcIit0cmlpZCtcIilcIik7XG5cdH1cblx0Ly8gZHJhZyBhbmQgem9vbVxuXHR6b29tID0gZDMuem9vbSgpXG5cdCAgLnNjYWxlRXh0ZW50KFtvcHRzLnpvb21Jbiwgb3B0cy56b29tT3V0XSlcblx0ICAub24oJ3pvb20nLCB6b29tRm4pO1xuXG5cdGZ1bmN0aW9uIHpvb21GbigpIHtcblx0XHRsZXQgdCA9IGQzLmV2ZW50LnRyYW5zZm9ybTtcblx0XHRpZihwZWRpZ3JlZV91dGlscy5pc0lFKCkgJiYgdC54LnRvU3RyaW5nKCkubGVuZ3RoID4gMTApXHQvLyBJRSBmaXggZm9yIGRyYWcgb2ZmIHNjcmVlblxuXHRcdFx0cmV0dXJuO1xuXHRcdGxldCBwb3MgPSBbKHQueCArIHBhcnNlSW50KHh0cmFuc2Zvcm0pKSwgKHQueSArIHBhcnNlSW50KHl0cmFuc2Zvcm0pKV07XG5cdFx0aWYodC5rID09IDEpIHtcblx0XHRcdHBlZGNhY2hlLnNldHBvc2l0aW9uKG9wdHMsIHBvc1swXSwgcG9zWzFdKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cGVkY2FjaGUuc2V0cG9zaXRpb24ob3B0cywgcG9zWzBdLCBwb3NbMV0sIHQuayk7XG5cdFx0fVxuXHRcdHBlZC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBwb3NbMF0gKyAnLCcgKyBwb3NbMV0gKyAnKSBzY2FsZSgnICsgdC5rICsgJyknKTtcblx0fVxuXHRzdmcuY2FsbCh6b29tKTtcblx0cmV0dXJuIG9wdHM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9lcnIoZXJyKSB7XG5cdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0cmV0dXJuIG5ldyBFcnJvcihlcnIpO1xufVxuXG4vLyB2YWxpZGF0ZSBwZWRpZ3JlZSBkYXRhXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfcGVkaWdyZWUob3B0cyl7XG5cdGlmKG9wdHMudmFsaWRhdGUpIHtcblx0XHRpZiAodHlwZW9mIG9wdHMudmFsaWRhdGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coJ0NBTExJTkcgQ09ORklHVVJFRCBWQUxJREFUSU9OIEZVTkNUSU9OJyk7XG5cdFx0XHRyZXR1cm4gb3B0cy52YWxpZGF0ZS5jYWxsKHRoaXMsIG9wdHMpO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIGNvbnNpc3RlbmN5IG9mIHBhcmVudHMgc2V4XG5cdFx0bGV0IHVuaXF1ZW5hbWVzID0gW107XG5cdFx0bGV0IGZhbWlkcyA9IFtdO1xuXHRcdGxldCBkaXNwbGF5X25hbWU7XG5cdFx0Zm9yKGxldCBwPTA7IHA8b3B0cy5kYXRhc2V0Lmxlbmd0aDsgcCsrKSB7XG5cdFx0XHRpZighcC5oaWRkZW4pIHtcblx0XHRcdFx0aWYob3B0cy5kYXRhc2V0W3BdLm1vdGhlciB8fCBvcHRzLmRhdGFzZXRbcF0uZmF0aGVyKSB7XG5cdFx0XHRcdFx0ZGlzcGxheV9uYW1lID0gb3B0cy5kYXRhc2V0W3BdLmRpc3BsYXlfbmFtZTtcblx0XHRcdFx0XHRpZighZGlzcGxheV9uYW1lKVxuXHRcdFx0XHRcdFx0ZGlzcGxheV9uYW1lID0gJ3VubmFtZWQnO1xuXHRcdFx0XHRcdGRpc3BsYXlfbmFtZSArPSAnIChJbmRpdklEOiAnK29wdHMuZGF0YXNldFtwXS5uYW1lKycpJztcblx0XHRcdFx0XHRsZXQgbW90aGVyID0gb3B0cy5kYXRhc2V0W3BdLm1vdGhlcjtcblx0XHRcdFx0XHRsZXQgZmF0aGVyID0gb3B0cy5kYXRhc2V0W3BdLmZhdGhlcjtcblx0XHRcdFx0XHRpZighbW90aGVyIHx8ICFmYXRoZXIpIHtcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ01pc3NpbmcgcGFyZW50IGZvciAnK2Rpc3BsYXlfbmFtZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IG1pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIpO1xuXHRcdFx0XHRcdGxldCBmaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKG9wdHMuZGF0YXNldCwgZmF0aGVyKTtcblx0XHRcdFx0XHRpZihtaWR4ID09PSAtMSlcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ1RoZSBtb3RoZXIgKEluZGl2SUQ6ICcrbW90aGVyKycpIG9mIGZhbWlseSBtZW1iZXIgJytcblx0XHRcdFx0XHRcdFx0XHRcdFx0IGRpc3BsYXlfbmFtZSsnIGlzIG1pc3NpbmcgZnJvbSB0aGUgcGVkaWdyZWUuJyk7XG5cdFx0XHRcdFx0aWYoZmlkeCA9PT0gLTEpXG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdUaGUgZmF0aGVyIChJbmRpdklEOiAnK2ZhdGhlcisnKSBvZiBmYW1pbHkgbWVtYmVyICcrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCBkaXNwbGF5X25hbWUrJyBpcyBtaXNzaW5nIGZyb20gdGhlIHBlZGlncmVlLicpO1xuXHRcdFx0XHRcdGlmKG9wdHMuZGF0YXNldFttaWR4XS5zZXggIT09IFwiRlwiKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihcIlRoZSBtb3RoZXIgb2YgZmFtaWx5IG1lbWJlciBcIitkaXNwbGF5X25hbWUrXG5cdFx0XHRcdFx0XHRcdFx0XCIgaXMgbm90IHNwZWNpZmllZCBhcyBmZW1hbGUuIEFsbCBtb3RoZXJzIGluIHRoZSBwZWRpZ3JlZSBtdXN0IGhhdmUgc2V4IHNwZWNpZmllZCBhcyAnRicuXCIpO1xuXHRcdFx0XHRcdGlmKG9wdHMuZGF0YXNldFtmaWR4XS5zZXggIT09IFwiTVwiKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihcIlRoZSBmYXRoZXIgb2YgZmFtaWx5IG1lbWJlciBcIitkaXNwbGF5X25hbWUrXG5cdFx0XHRcdFx0XHRcdFx0XCIgaXMgbm90IHNwZWNpZmllZCBhcyBtYWxlLiBBbGwgZmF0aGVycyBpbiB0aGUgcGVkaWdyZWUgbXVzdCBoYXZlIHNleCBzcGVjaWZpZWQgYXMgJ00nLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdGlmKCFvcHRzLmRhdGFzZXRbcF0ubmFtZSlcblx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihkaXNwbGF5X25hbWUrJyBoYXMgbm8gSW5kaXZJRC4nKTtcblx0XHRcdGlmKCQuaW5BcnJheShvcHRzLmRhdGFzZXRbcF0ubmFtZSwgdW5pcXVlbmFtZXMpID4gLTEpXG5cdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ0luZGl2SUQgZm9yIGZhbWlseSBtZW1iZXIgJytkaXNwbGF5X25hbWUrJyBpcyBub3QgdW5pcXVlLicpO1xuXHRcdFx0dW5pcXVlbmFtZXMucHVzaChvcHRzLmRhdGFzZXRbcF0ubmFtZSk7XG5cblx0XHRcdGlmKCQuaW5BcnJheShvcHRzLmRhdGFzZXRbcF0uZmFtaWQsIGZhbWlkcykgPT09IC0xICYmIG9wdHMuZGF0YXNldFtwXS5mYW1pZCkge1xuXHRcdFx0XHRmYW1pZHMucHVzaChvcHRzLmRhdGFzZXRbcF0uZmFtaWQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGZhbWlkcy5sZW5ndGggPiAxKSB7XG5cdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdNb3JlIHRoYW4gb25lIGZhbWlseSBmb3VuZDogJytmYW1pZHMuam9pbihcIiwgXCIpKycuJyk7XG5cdFx0fVxuXHRcdC8vIHdhcm4gaWYgdGhlcmUgaXMgYSBicmVhayBpbiB0aGUgcGVkaWdyZWVcblx0XHRsZXQgdWMgPSBwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChvcHRzLmRhdGFzZXQpO1xuXHRcdGlmKHVjLmxlbmd0aCA+IDApXG5cdFx0XHRjb25zb2xlLndhcm4oXCJpbmRpdmlkdWFscyB1bmNvbm5lY3RlZCB0byBwZWRpZ3JlZSBcIiwgdWMpO1xuXHR9XG59XG5cbi8vYWRvcHRlZCBpbi9vdXQgYnJhY2tldHNcbmZ1bmN0aW9uIGdldF9icmFja2V0KGR4LCBkeSwgaW5kZW50LCBvcHRzKSB7XG5cdHJldHVybiBcdFwiTVwiICsgKGR4K2luZGVudCkgKyBcIixcIiArIGR5ICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIGR5ICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIChkeSsob3B0cy5zeW1ib2xfc2l6ZSAqICAxLjI4KSkgK1xuXHRcdFx0XCJMXCIgKyBkeCArIFwiIFwiICsgKGR5KyhvcHRzLnN5bWJvbF9zaXplICogIDEuMjgpKSArXG5cdFx0XHRcIkxcIiArIChkeCtpbmRlbnQpICsgXCIsXCIgKyAoZHkrKG9wdHMuc3ltYm9sX3NpemUgKiAgMS4yOCkpXG59XG5cbi8vIGNoZWNrIGlmIHRoZSBvYmplY3QgY29udGFpbnMgYSBrZXkgd2l0aCBhIGdpdmVuIHByZWZpeFxuZnVuY3Rpb24gcHJlZml4SW5PYmoocHJlZml4LCBvYmopIHtcblx0bGV0IGZvdW5kID0gZmFsc2U7XG5cdGlmKG9iailcblx0XHQkLmVhY2gob2JqLCBmdW5jdGlvbihrLCBfbil7XG5cdFx0XHRpZihrLmluZGV4T2YocHJlZml4K1wiX1wiKSA9PT0gMCB8fCBrID09PSBwcmVmaXgpIHtcblx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm4gZm91bmQ7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBmb3VuZDtcbn1cblxuLy8gY2hlY2sgZm9yIGNyb3NzaW5nIG9mIHBhcnRuZXIgbGluZXNcbmZ1bmN0aW9uIGNoZWNrX3B0cl9saW5rcyhvcHRzLCBwdHJMaW5rTm9kZXMpe1xuXHRmb3IobGV0IGE9MDsgYTxwdHJMaW5rTm9kZXMubGVuZ3RoOyBhKyspIHtcblx0XHRsZXQgY2xhc2ggPSBjaGVja19wdHJfbGlua19jbGFzaGVzKG9wdHMsIHB0ckxpbmtOb2Rlc1thXSk7XG5cdFx0aWYoY2xhc2gpXG5cdFx0XHRjb25zb2xlLmxvZyhcIkNMQVNIIDo6IFwiK3B0ckxpbmtOb2Rlc1thXS5tb3RoZXIuZGF0YS5uYW1lK1wiIFwiK3B0ckxpbmtOb2Rlc1thXS5mYXRoZXIuZGF0YS5uYW1lLCBjbGFzaCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrX3B0cl9saW5rX2NsYXNoZXMob3B0cywgYW5vZGUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbGF0dGVuTm9kZXMgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgbW90aGVyLCBmYXRoZXI7XG5cdGlmKCduYW1lJyBpbiBhbm9kZSkge1xuXHRcdGFub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGFub2RlLm5hbWUpO1xuXHRcdGlmKCEoJ21vdGhlcicgaW4gYW5vZGUuZGF0YSkpXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRtb3RoZXIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgYW5vZGUuZGF0YS5tb3RoZXIpO1xuXHRcdGZhdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBhbm9kZS5kYXRhLmZhdGhlcik7XG5cdH0gZWxzZSB7XG5cdFx0bW90aGVyID0gYW5vZGUubW90aGVyO1xuXHRcdGZhdGhlciA9IGFub2RlLmZhdGhlcjtcblx0fVxuXG5cdGxldCB4MSA9IChtb3RoZXIueCA8IGZhdGhlci54ID8gbW90aGVyLnggOiBmYXRoZXIueCk7XG5cdGxldCB4MiA9IChtb3RoZXIueCA8IGZhdGhlci54ID8gZmF0aGVyLnggOiBtb3RoZXIueCk7XG5cdGxldCBkeSA9IG1vdGhlci55O1xuXG5cdC8vIGlkZW50aWZ5IGNsYXNoZXMgd2l0aCBvdGhlciBub2RlcyBhdCB0aGUgc2FtZSBkZXB0aFxuXHRsZXQgY2xhc2ggPSAkLm1hcChmbGF0dGVuTm9kZXMsIGZ1bmN0aW9uKGJub2RlLCBfaSl7XG5cdFx0cmV0dXJuICFibm9kZS5kYXRhLmhpZGRlbiAmJlxuXHRcdFx0XHRibm9kZS5kYXRhLm5hbWUgIT09IG1vdGhlci5kYXRhLm5hbWUgJiYgIGJub2RlLmRhdGEubmFtZSAhPT0gZmF0aGVyLmRhdGEubmFtZSAmJlxuXHRcdFx0XHRibm9kZS55ID09IGR5ICYmIGJub2RlLnggPiB4MSAmJiBibm9kZS54IDwgeDIgPyBibm9kZS54IDogbnVsbDtcblx0fSk7XG5cdHJldHVybiBjbGFzaC5sZW5ndGggPiAwID8gY2xhc2ggOiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRfc3ZnX2RpbWVuc2lvbnMob3B0cykge1xuXHRyZXR1cm4geyd3aWR0aCcgOiAocGJ1dHRvbnMuaXNfZnVsbHNjcmVlbigpPyB3aW5kb3cuaW5uZXJXaWR0aCAgOiBvcHRzLndpZHRoKSxcblx0XHRcdCdoZWlnaHQnOiAocGJ1dHRvbnMuaXNfZnVsbHNjcmVlbigpPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBvcHRzLmhlaWdodCl9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKSB7XG5cdC8vIC8gZ2V0IHNjb3JlIGF0IGVhY2ggZGVwdGggdXNlZCB0byBhZGp1c3Qgbm9kZSBzZXBhcmF0aW9uXG5cdGxldCBzdmdfZGltZW5zaW9ucyA9IGdldF9zdmdfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IG1heHNjb3JlID0gMDtcblx0bGV0IGdlbmVyYXRpb24gPSB7fTtcblx0Zm9yKGxldCBpPTA7IGk8b3B0cy5kYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGRlcHRoID0gcGVkaWdyZWVfdXRpbHMuZ2V0RGVwdGgob3B0cy5kYXRhc2V0LCBvcHRzLmRhdGFzZXRbaV0ubmFtZSk7XG5cdFx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBvcHRzLmRhdGFzZXRbaV0pO1xuXG5cdFx0Ly8gc2NvcmUgYmFzZWQgb24gbm8uIG9mIGNoaWxkcmVuIGFuZCBpZiBwYXJlbnQgZGVmaW5lZFxuXHRcdGxldCBzY29yZSA9IDEgKyAoY2hpbGRyZW4ubGVuZ3RoID4gMCA/IDAuNTUrKGNoaWxkcmVuLmxlbmd0aCowLjI1KSA6IDApICsgKG9wdHMuZGF0YXNldFtpXS5mYXRoZXIgPyAwLjI1IDogMCk7XG5cdFx0aWYoZGVwdGggaW4gZ2VuZXJhdGlvbilcblx0XHRcdGdlbmVyYXRpb25bZGVwdGhdICs9IHNjb3JlO1xuXHRcdGVsc2Vcblx0XHRcdGdlbmVyYXRpb25bZGVwdGhdID0gc2NvcmU7XG5cblx0XHRpZihnZW5lcmF0aW9uW2RlcHRoXSA+IG1heHNjb3JlKVxuXHRcdFx0bWF4c2NvcmUgPSBnZW5lcmF0aW9uW2RlcHRoXTtcblx0fVxuXG5cdGxldCBtYXhfZGVwdGggPSBPYmplY3Qua2V5cyhnZW5lcmF0aW9uKS5sZW5ndGgqb3B0cy5zeW1ib2xfc2l6ZSozLjU7XG5cdGxldCB0cmVlX3dpZHRoID0gIChzdmdfZGltZW5zaW9ucy53aWR0aCAtIG9wdHMuc3ltYm9sX3NpemUgPiBtYXhzY29yZSpvcHRzLnN5bWJvbF9zaXplKjEuNjUgP1xuXHRcdFx0XHRcdCAgIHN2Z19kaW1lbnNpb25zLndpZHRoIC0gb3B0cy5zeW1ib2xfc2l6ZSA6IG1heHNjb3JlKm9wdHMuc3ltYm9sX3NpemUqMS42NSk7XG5cdGxldCB0cmVlX2hlaWdodCA9IChzdmdfZGltZW5zaW9ucy5oZWlnaHQgLSBvcHRzLnN5bWJvbF9zaXplID4gbWF4X2RlcHRoID9cblx0XHRcdFx0XHQgICBzdmdfZGltZW5zaW9ucy5oZWlnaHQgLSBvcHRzLnN5bWJvbF9zaXplIDogbWF4X2RlcHRoKTtcblx0cmV0dXJuIHsnd2lkdGgnOiB0cmVlX3dpZHRoLCAnaGVpZ2h0JzogdHJlZV9oZWlnaHR9O1xufVxuXG4vLyBncm91cCB0b3BfbGV2ZWwgbm9kZXMgYnkgdGhlaXIgcGFydG5lcnNcbmZ1bmN0aW9uIGdyb3VwX3RvcF9sZXZlbChkYXRhc2V0KSB7XG5cdC8vIGxldCB0b3BfbGV2ZWwgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbih2YWwsIGkpe3JldHVybiAndG9wX2xldmVsJyBpbiB2YWwgJiYgdmFsLnRvcF9sZXZlbCA/IHZhbCA6IG51bGw7fSk7XG5cdC8vIGNhbGN1bGF0ZSB0b3BfbGV2ZWwgbm9kZXNcblx0Zm9yKGxldCBpPTA7aTxkYXRhc2V0Lmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRpZ3JlZV91dGlscy5nZXREZXB0aChkYXRhc2V0LCBkYXRhc2V0W2ldLm5hbWUpID09IDIpXG5cdFx0XHRkYXRhc2V0W2ldLnRvcF9sZXZlbCA9IHRydWU7XG5cdH1cblxuXHRsZXQgdG9wX2xldmVsID0gW107XG5cdGxldCB0b3BfbGV2ZWxfc2VlbiA9IFtdO1xuXHRmb3IobGV0IGk9MDtpPGRhdGFzZXQubGVuZ3RoO2krKykge1xuXHRcdGxldCBub2RlID0gZGF0YXNldFtpXTtcblx0XHRpZigndG9wX2xldmVsJyBpbiBub2RlICYmICQuaW5BcnJheShub2RlLm5hbWUsIHRvcF9sZXZlbF9zZWVuKSA9PSAtMSl7XG5cdFx0XHR0b3BfbGV2ZWxfc2Vlbi5wdXNoKG5vZGUubmFtZSk7XG5cdFx0XHR0b3BfbGV2ZWwucHVzaChub2RlKTtcblx0XHRcdGxldCBwdHJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIG5vZGUpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cHRycy5sZW5ndGg7IGorKyl7XG5cdFx0XHRcdGlmKCQuaW5BcnJheShwdHJzW2pdLCB0b3BfbGV2ZWxfc2VlbikgPT0gLTEpIHtcblx0XHRcdFx0XHR0b3BfbGV2ZWxfc2Vlbi5wdXNoKHB0cnNbal0pO1xuXHRcdFx0XHRcdHRvcF9sZXZlbC5wdXNoKHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgcHRyc1tqXSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0bGV0IG5ld2RhdGFzZXQgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gJ3RvcF9sZXZlbCcgaW4gdmFsICYmIHZhbC50b3BfbGV2ZWwgPyBudWxsIDogdmFsO30pO1xuXHRmb3IgKGxldCBpID0gdG9wX2xldmVsLmxlbmd0aDsgaSA+IDA7IC0taSlcblx0XHRuZXdkYXRhc2V0LnVuc2hpZnQodG9wX2xldmVsW2ktMV0pO1xuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLy8gZ2V0IGhlaWdodCBpbiBwaXhlbHNcbmZ1bmN0aW9uIGdldFB4KG9wdHMpe1xuXHRsZXQgZW1WYWwgPSBvcHRzLmZvbnRfc2l6ZTtcblx0aWYgKGVtVmFsID09PSBwYXJzZUludChlbVZhbCwgMTApKSAvLyB0ZXN0IGlmIGludGVnZXJcblx0XHRyZXR1cm4gZW1WYWw7XG5cblx0aWYoZW1WYWwuaW5kZXhPZihcInB4XCIpID4gLTEpXG5cdFx0cmV0dXJuIGVtVmFsLnJlcGxhY2UoJ3B4JywgJycpO1xuXHRlbHNlIGlmKGVtVmFsLmluZGV4T2YoXCJlbVwiKSA9PT0gLTEpXG5cdFx0cmV0dXJuIGVtVmFsO1xuXHRlbVZhbCA9IHBhcnNlRmxvYXQoZW1WYWwucmVwbGFjZSgnZW0nLCAnJykpO1xuXHRyZXR1cm4gKHBhcnNlRmxvYXQoZ2V0Q29tcHV0ZWRTdHlsZSgkKCcjJytvcHRzLnRhcmdldERpdikuZ2V0KDApKS5mb250U2l6ZSkqZW1WYWwpLTEuMDtcbn1cblxuLy8gQWRkIGxhYmVsXG5mdW5jdGlvbiBhZGRMYWJlbChvcHRzLCBub2RlLCBzaXplLCBmeCwgZnksIGZ0ZXh0LCBjbGFzc19sYWJlbCkge1xuXHRub2RlLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHID8gZmFsc2UgOiB0cnVlO1xuXHR9KS5hcHBlbmQoXCJ0ZXh0XCIpXG5cdC5hdHRyKFwiY2xhc3NcIiwgY2xhc3NfbGFiZWwgKyAnIHBlZF9sYWJlbCcgfHwgXCJwZWRfbGFiZWxcIilcblx0LmF0dHIoXCJ4XCIsIGZ4KVxuXHQuYXR0cihcInlcIiwgZnkpXG5cdC8vIC5hdHRyKFwiZHlcIiwgc2l6ZSlcblx0LmF0dHIoXCJmb250LWZhbWlseVwiLCBvcHRzLmZvbnRfZmFtaWx5KVxuXHQuYXR0cihcImZvbnQtc2l6ZVwiLCBvcHRzLmZvbnRfc2l6ZSlcblx0LmF0dHIoXCJmb250LXdlaWdodFwiLCBvcHRzLmZvbnRfd2VpZ2h0KVxuXHQudGV4dChmdGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWJ1aWxkKG9wdHMpIHtcblx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0cGVkY2FjaGUuaW5pdF9jYWNoZShvcHRzKTtcblx0dHJ5IHtcblx0XHRidWlsZChvcHRzKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHR0aHJvdyBlO1xuXHR9XG5cblx0dHJ5IHtcblx0XHR0ZW1wbGF0ZXMudXBkYXRlKG9wdHMpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHQvLyB0ZW1wbGF0ZXMgbm90IGRlY2xhcmVkXG5cdH1cbn1cblxuLy8gYWRkIGNoaWxkcmVuIHRvIGEgZ2l2ZW4gbm9kZVxuZXhwb3J0IGZ1bmN0aW9uIGFkZGNoaWxkKGRhdGFzZXQsIG5vZGUsIHNleCwgbmNoaWxkLCB0d2luX3R5cGUpIHtcblx0aWYodHdpbl90eXBlICYmICQuaW5BcnJheSh0d2luX3R5cGUsIFsgXCJtenR3aW5cIiwgXCJkenR3aW5cIiBdICkgPT09IC0xKVxuXHRcdHJldHVybiBuZXcgRXJyb3IoXCJJTlZBTElEIFRXSU4gVFlQRSBTRVQ6IFwiK3R3aW5fdHlwZSk7XG5cblx0aWYgKHR5cGVvZiBuY2hpbGQgPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0bmNoaWxkID0gMTtcblx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgbm9kZSk7XG5cdGxldCBwdHJfbmFtZSwgaWR4O1xuXHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG5cdFx0bGV0IHBhcnRuZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIG5vZGUsIG5vZGUuc2V4ID09PSAnRicgPyAnTSc6ICdGJywgbm9kZS5zZXggPT09ICdGJyk7XG5cdFx0cGFydG5lci5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdHB0cl9uYW1lID0gcGFydG5lci5uYW1lO1xuXHRcdGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpKzE7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IGMgPSBjaGlsZHJlblswXTtcblx0XHRwdHJfbmFtZSA9IChjLmZhdGhlciA9PT0gbm9kZS5uYW1lID8gYy5tb3RoZXIgOiBjLmZhdGhlcik7XG5cdFx0aWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGMubmFtZSk7XG5cdH1cblxuXHRsZXQgdHdpbl9pZDtcblx0aWYodHdpbl90eXBlKVxuXHRcdHR3aW5faWQgPSBnZXRVbmlxdWVUd2luSUQoZGF0YXNldCwgdHdpbl90eXBlKTtcblx0bGV0IG5ld2NoaWxkcmVuID0gW107XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbmNoaWxkOyBpKyspIHtcblx0XHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogc2V4LFxuXHRcdFx0XHRcdCBcIm1vdGhlclwiOiAobm9kZS5zZXggPT09ICdGJyA/IG5vZGUubmFtZSA6IHB0cl9uYW1lKSxcblx0XHRcdFx0XHQgXCJmYXRoZXJcIjogKG5vZGUuc2V4ID09PSAnRicgPyBwdHJfbmFtZSA6IG5vZGUubmFtZSl9O1xuXHRcdGRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xuXG5cdFx0aWYodHdpbl90eXBlKVxuXHRcdFx0Y2hpbGRbdHdpbl90eXBlXSA9IHR3aW5faWQ7XG5cdFx0bmV3Y2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cdH1cblx0cmV0dXJuIG5ld2NoaWxkcmVuO1xufVxuXG4vL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZHNpYmxpbmcoZGF0YXNldCwgbm9kZSwgc2V4LCBhZGRfbGhzLCB0d2luX3R5cGUpIHtcblx0aWYodHdpbl90eXBlICYmICQuaW5BcnJheSh0d2luX3R5cGUsIFsgXCJtenR3aW5cIiwgXCJkenR3aW5cIiBdICkgPT09IC0xKVxuXHRcdHJldHVybiBuZXcgRXJyb3IoXCJJTlZBTElEIFRXSU4gVFlQRSBTRVQ6IFwiK3R3aW5fdHlwZSk7XG5cblx0bGV0IG5ld2JpZSA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBzZXh9O1xuXHRpZihub2RlLnRvcF9sZXZlbCkge1xuXHRcdG5ld2JpZS50b3BfbGV2ZWwgPSB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdG5ld2JpZS5tb3RoZXIgPSBub2RlLm1vdGhlcjtcblx0XHRuZXdiaWUuZmF0aGVyID0gbm9kZS5mYXRoZXI7XG5cdH1cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpO1xuXG5cdGlmKHR3aW5fdHlwZSkge1xuXHRcdHNldE16VHdpbihkYXRhc2V0LCBkYXRhc2V0W2lkeF0sIG5ld2JpZSwgdHdpbl90eXBlKTtcblx0fVxuXG5cdGlmKGFkZF9saHMpIHsgLy8gYWRkIHRvIExIU1xuXHRcdGlmKGlkeCA+IDApIGlkeC0tO1xuXHR9IGVsc2Vcblx0XHRpZHgrKztcblx0ZGF0YXNldC5zcGxpY2UoaWR4LCAwLCBuZXdiaWUpO1xuXHRyZXR1cm4gbmV3YmllO1xufVxuXG4vLyBzZXQgdHdvIHNpYmxpbmdzIGFzIHR3aW5zXG5mdW5jdGlvbiBzZXRNelR3aW4oZGF0YXNldCwgZDEsIGQyLCB0d2luX3R5cGUpIHtcblx0aWYoIWQxW3R3aW5fdHlwZV0pIHtcblx0XHRkMVt0d2luX3R5cGVdID0gZ2V0VW5pcXVlVHdpbklEKGRhdGFzZXQsIHR3aW5fdHlwZSk7XG5cdFx0aWYoIWQxW3R3aW5fdHlwZV0pXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0ZDJbdHdpbl90eXBlXSA9IGQxW3R3aW5fdHlwZV07XG5cdGlmKGQxLnlvYilcblx0XHRkMi55b2IgPSBkMS55b2I7XG5cdGlmKGQxLmFnZSAmJiAoZDEuc3RhdHVzID09IDAgfHwgIWQxLnN0YXR1cykpXG5cdFx0ZDIuYWdlID0gZDEuYWdlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLy8gZ2V0IGEgbmV3IHVuaXF1ZSB0d2lucyBJRCwgbWF4IG9mIDEwIHR3aW5zIGluIGEgcGVkaWdyZWVcbmZ1bmN0aW9uIGdldFVuaXF1ZVR3aW5JRChkYXRhc2V0LCB0d2luX3R5cGUpIHtcblx0bGV0IG16ID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIFwiQVwiXTtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGRhdGFzZXRbaV1bdHdpbl90eXBlXSkge1xuXHRcdFx0bGV0IGlkeCA9IG16LmluZGV4T2YoZGF0YXNldFtpXVt0d2luX3R5cGVdKTtcblx0XHRcdGlmIChpZHggPiAtMSlcblx0XHRcdFx0bXouc3BsaWNlKGlkeCwgMSk7XG5cdFx0fVxuXHR9XG5cdGlmKG16Lmxlbmd0aCA+IDApXG5cdFx0cmV0dXJuIG16WzBdO1xuXHRyZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vLyBzeW5jIGF0dHJpYnV0ZXMgb2YgdHdpbnNcbmV4cG9ydCBmdW5jdGlvbiBzeW5jVHdpbnMoZGF0YXNldCwgZDEpIHtcblx0aWYoIWQxLm16dHdpbiAmJiAhZDEuZHp0d2luKVxuXHRcdHJldHVybjtcblx0bGV0IHR3aW5fdHlwZSA9IChkMS5tenR3aW4gPyBcIm16dHdpblwiIDogXCJkenR3aW5cIik7XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgZDIgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGQyW3R3aW5fdHlwZV0gJiYgZDFbdHdpbl90eXBlXSA9PSBkMlt0d2luX3R5cGVdICYmIGQyLm5hbWUgIT09IGQxLm5hbWUpIHtcblx0XHRcdGlmKHR3aW5fdHlwZSA9PT0gXCJtenR3aW5cIilcblx0XHRcdCAgZDIuc2V4ID0gZDEuc2V4O1xuXHRcdFx0aWYoZDEueW9iKVxuXHRcdFx0XHRkMi55b2IgPSBkMS55b2I7XG5cdFx0XHRpZihkMS5hZ2UgJiYgKGQxLnN0YXR1cyA9PSAwIHx8ICFkMS5zdGF0dXMpKVxuXHRcdFx0XHRkMi5hZ2UgPSBkMS5hZ2U7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGNoZWNrIGludGVncml0eSB0d2luIHNldHRpbmdzXG5mdW5jdGlvbiBjaGVja1R3aW5zKGRhdGFzZXQpIHtcblx0bGV0IHR3aW5fdHlwZXMgPSBbXCJtenR3aW5cIiwgXCJkenR3aW5cIl07XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IobGV0IGo9MDsgajx0d2luX3R5cGVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRsZXQgdHdpbl90eXBlID0gdHdpbl90eXBlc1tqXTtcblx0XHRcdGlmKGRhdGFzZXRbaV1bdHdpbl90eXBlXSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSAwO1xuXHRcdFx0XHRmb3IobGV0IGo9MDsgajxkYXRhc2V0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYoZGF0YXNldFtqXVt0d2luX3R5cGVdID09IGRhdGFzZXRbaV1bdHdpbl90eXBlXSlcblx0XHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoY291bnQgPCAyKVxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhc2V0W2ldW1t0d2luX3R5cGVdXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLy8gYWRkIHBhcmVudHMgdG8gdGhlICdub2RlJ1xuZXhwb3J0IGZ1bmN0aW9uIGFkZHBhcmVudHMob3B0cywgZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgbW90aGVyLCBmYXRoZXI7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdF90cmVlID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IHRyZWVfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBuYW1lKTtcblx0bGV0IG5vZGUgID0gdHJlZV9ub2RlLmRhdGE7XG5cdGxldCBkZXB0aCA9IHRyZWVfbm9kZS5kZXB0aDsgICAvLyBkZXB0aCBvZiB0aGUgbm9kZSBpbiByZWxhdGlvbiB0byB0aGUgcm9vdCAoZGVwdGggPSAxIGlzIGEgdG9wX2xldmVsIG5vZGUpXG5cblx0bGV0IHBpZCA9IC0xMDE7XG5cdGxldCBwdHJfbmFtZTtcblx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgbm9kZSk7XG5cdGlmKGNoaWxkcmVuLmxlbmd0aCA+IDApe1xuXHRcdHB0cl9uYW1lID0gY2hpbGRyZW5bMF0ubW90aGVyID09IG5vZGUubmFtZSA/IGNoaWxkcmVuWzBdLmZhdGhlciA6IGNoaWxkcmVuWzBdLm1vdGhlcjtcblx0XHRwaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgcHRyX25hbWUpLmRhdGEuaWQ7XG5cdH1cblxuXHRsZXQgaTtcblx0aWYoZGVwdGggPT0gMSkge1xuXHRcdG1vdGhlciA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBcIkZcIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX07XG5cdFx0ZmF0aGVyID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IFwiTVwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfTtcblx0XHRkYXRhc2V0LnNwbGljZSgwLCAwLCBtb3RoZXIpO1xuXHRcdGRhdGFzZXQuc3BsaWNlKDAsIDAsIGZhdGhlcik7XG5cblx0XHRmb3IoaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspe1xuXHRcdFx0aWYoZGF0YXNldFtpXS50b3BfbGV2ZWwgJiYgZGF0YXNldFtpXS5uYW1lICE9PSBtb3RoZXIubmFtZSAmJiBkYXRhc2V0W2ldLm5hbWUgIT09IGZhdGhlci5uYW1lKXtcblx0XHRcdFx0ZGVsZXRlIGRhdGFzZXRbaV0udG9wX2xldmVsO1xuXHRcdFx0XHRkYXRhc2V0W2ldLm5vcGFyZW50cyA9IHRydWU7XG5cdFx0XHRcdGRhdGFzZXRbaV0ubW90aGVyID0gbW90aGVyLm5hbWU7XG5cdFx0XHRcdGRhdGFzZXRbaV0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBub2RlX21vdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCB0cmVlX25vZGUuZGF0YS5tb3RoZXIpO1xuXHRcdGxldCBub2RlX2ZhdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCB0cmVlX25vZGUuZGF0YS5mYXRoZXIpO1xuXHRcdGxldCBub2RlX3NpYnMgPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxTaWJsaW5ncyhkYXRhc2V0LCBub2RlKTtcblxuXHRcdC8vIGxocyAmIHJocyBpZCdzIGZvciBzaWJsaW5ncyBvZiB0aGlzIG5vZGVcblx0XHRsZXQgcmlkID0gMTAwMDA7XG5cdFx0bGV0IGxpZCA9IHRyZWVfbm9kZS5kYXRhLmlkO1xuXHRcdGZvcihpPTA7IGk8bm9kZV9zaWJzLmxlbmd0aDsgaSsrKXtcblx0XHRcdGxldCBzaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgbm9kZV9zaWJzW2ldLm5hbWUpLmRhdGEuaWQ7XG5cdFx0XHRpZihzaWQgPCByaWQgJiYgc2lkID4gdHJlZV9ub2RlLmRhdGEuaWQpXG5cdFx0XHRcdHJpZCA9IHNpZDtcblx0XHRcdGlmKHNpZCA8IGxpZClcblx0XHRcdFx0bGlkID0gc2lkO1xuXHRcdH1cblx0XHRsZXQgYWRkX2xocyA9IChsaWQgPj0gdHJlZV9ub2RlLmRhdGEuaWQgfHwgKHBpZCA9PSBsaWQgJiYgcmlkIDwgMTAwMDApKTtcblx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0Y29uc29sZS5sb2coJ2xpZD0nK2xpZCsnIHJpZD0nK3JpZCsnIG5pZD0nK3RyZWVfbm9kZS5kYXRhLmlkKycgQUREX0xIUz0nK2FkZF9saHMpO1xuXHRcdGxldCBtaWR4O1xuXHRcdGlmKCAoIWFkZF9saHMgJiYgbm9kZV9mYXRoZXIuZGF0YS5pZCA+IG5vZGVfbW90aGVyLmRhdGEuaWQpIHx8XG5cdFx0XHQoYWRkX2xocyAmJiBub2RlX2ZhdGhlci5kYXRhLmlkIDwgbm9kZV9tb3RoZXIuZGF0YS5pZCkgKVxuXHRcdFx0bWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLmZhdGhlcik7XG5cdFx0ZWxzZVxuXHRcdFx0bWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm1vdGhlcik7XG5cblx0XHRsZXQgcGFyZW50ID0gZGF0YXNldFttaWR4XTtcblx0XHRmYXRoZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHBhcmVudCwgJ00nLCBhZGRfbGhzKTtcblx0XHRtb3RoZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHBhcmVudCwgJ0YnLCBhZGRfbGhzKTtcblxuXHRcdGxldCBmYWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0bGV0IG1vaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG1vdGhlci5uYW1lKTtcblx0XHRpZihmYWlkeCA+IG1vaWR4KSB7XHRcdFx0XHQgICAvLyBzd2l0Y2ggdG8gZW5zdXJlIGZhdGhlciBvbiBsaHMgb2YgbW90aGVyXG5cdFx0XHRsZXQgdG1wZmEgPSBkYXRhc2V0W2ZhaWR4XTtcblx0XHRcdGRhdGFzZXRbZmFpZHhdID0gZGF0YXNldFttb2lkeF07XG5cdFx0XHRkYXRhc2V0W21vaWR4XSA9IHRtcGZhO1xuXHRcdH1cblxuXHRcdGxldCBvcnBoYW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWRvcHRlZFNpYmxpbmdzKGRhdGFzZXQsIG5vZGUpO1xuXHRcdGxldCBuaWQgPSB0cmVlX25vZGUuZGF0YS5pZDtcblx0XHRmb3IoaT0wOyBpPG9ycGhhbnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IG9pZCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBvcnBoYW5zW2ldLm5hbWUpLmRhdGEuaWQ7XG5cdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnT1JQSEFOPScraSsnICcrb3JwaGFuc1tpXS5uYW1lKycgJysobmlkIDwgb2lkICYmIG9pZCA8IHJpZCkrJyBuaWQ9JytuaWQrJyBvaWQ9JytvaWQrJyByaWQ9JytyaWQpO1xuXHRcdFx0aWYoKGFkZF9saHMgfHwgbmlkIDwgb2lkKSAmJiBvaWQgPCByaWQpe1xuXHRcdFx0XHRsZXQgb2lkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBvcnBoYW5zW2ldLm5hbWUpO1xuXHRcdFx0XHRkYXRhc2V0W29pZHhdLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0XHRkYXRhc2V0W29pZHhdLmZhdGhlciA9IGZhdGhlci5uYW1lO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmKGRlcHRoID09IDIpIHtcblx0XHRtb3RoZXIudG9wX2xldmVsID0gdHJ1ZTtcblx0XHRmYXRoZXIudG9wX2xldmVsID0gdHJ1ZTtcblx0fSBlbHNlIGlmKGRlcHRoID4gMikge1xuXHRcdG1vdGhlci5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdGZhdGhlci5ub3BhcmVudHMgPSB0cnVlO1xuXHR9XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5uYW1lKTtcblx0ZGF0YXNldFtpZHhdLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRkYXRhc2V0W2lkeF0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdGRlbGV0ZSBkYXRhc2V0W2lkeF0ubm9wYXJlbnRzO1xuXG5cdGlmKCdwYXJlbnRfbm9kZScgaW4gbm9kZSkge1xuXHRcdGxldCBwdHJfbm9kZSA9IGRhdGFzZXRbcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIHB0cl9uYW1lKV07XG5cdFx0aWYoJ25vcGFyZW50cycgaW4gcHRyX25vZGUpIHtcblx0XHRcdHB0cl9ub2RlLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0cHRyX25vZGUuZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGFkZCBwYXJ0bmVyXG5leHBvcnQgZnVuY3Rpb24gYWRkcGFydG5lcihvcHRzLCBkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdF90cmVlID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IHRyZWVfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBuYW1lKTtcblxuXHRsZXQgcGFydG5lciA9IGFkZHNpYmxpbmcoZGF0YXNldCwgdHJlZV9ub2RlLmRhdGEsIHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gJ00nIDogJ0YnLCB0cmVlX25vZGUuZGF0YS5zZXggPT09ICdGJyk7XG5cdHBhcnRuZXIubm9wYXJlbnRzID0gdHJ1ZTtcblxuXHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogXCJNXCJ9O1xuXHRjaGlsZC5tb3RoZXIgPSAodHJlZV9ub2RlLmRhdGEuc2V4ID09PSAnRicgPyB0cmVlX25vZGUuZGF0YS5uYW1lIDogcGFydG5lci5uYW1lKTtcblx0Y2hpbGQuZmF0aGVyID0gKHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gcGFydG5lci5uYW1lIDogdHJlZV9ub2RlLmRhdGEubmFtZSk7XG5cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCB0cmVlX25vZGUuZGF0YS5uYW1lKSsyO1xuXHRkYXRhc2V0LnNwbGljZShpZHgsIDAsIGNoaWxkKTtcbn1cblxuLy8gZ2V0IGFkamFjZW50IG5vZGVzIGF0IHRoZSBzYW1lIGRlcHRoXG5mdW5jdGlvbiBhZGphY2VudF9ub2Rlcyhyb290LCBub2RlLCBleGNsdWRlcykge1xuXHRsZXQgZG5vZGVzID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZXNBdERlcHRoKHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCksIG5vZGUuZGVwdGgsIGV4Y2x1ZGVzKTtcblx0bGV0IGxoc19ub2RlLCByaHNfbm9kZTtcblx0Zm9yKGxldCBpPTA7IGk8ZG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYoZG5vZGVzW2ldLnggPCBub2RlLngpXG5cdFx0XHRsaHNfbm9kZSA9IGRub2Rlc1tpXTtcblx0XHRpZighcmhzX25vZGUgJiYgZG5vZGVzW2ldLnggPiBub2RlLngpXG5cdFx0XHRyaHNfbm9kZSA9IGRub2Rlc1tpXTtcblx0fVxuXHRyZXR1cm4gW2xoc19ub2RlLCByaHNfbm9kZV07XG59XG5cbi8vIGRlbGV0ZSBhIG5vZGUgYW5kIGRlc2NlbmRhbnRzXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlX25vZGVfZGF0YXNldChkYXRhc2V0LCBub2RlLCBvcHRzLCBvbkRvbmUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbm9kZXMgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgZGVsZXRlcyA9IFtdO1xuXHRsZXQgaSwgajtcblxuXHQvLyBnZXQgZDMgZGF0YSBub2RlXG5cdGlmKG5vZGUuaWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGxldCBkM25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2Rlcywgbm9kZS5uYW1lKTtcblx0XHRpZihkM25vZGUgIT09IHVuZGVmaW5lZClcblx0XHRcdG5vZGUgPSBkM25vZGUuZGF0YTtcblx0fVxuXG5cdGlmKG5vZGUucGFyZW50X25vZGUpIHtcblx0XHRmb3IoaT0wOyBpPG5vZGUucGFyZW50X25vZGUubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IHBhcmVudCA9IG5vZGUucGFyZW50X25vZGVbaV07XG5cdFx0XHRsZXQgcHMgPSBbcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwYXJlbnQubW90aGVyLm5hbWUpLFxuXHRcdFx0XHRcdCAgcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwYXJlbnQuZmF0aGVyLm5hbWUpXTtcblx0XHRcdC8vIGRlbGV0ZSBwYXJlbnRzXG5cdFx0XHRmb3Ioaj0wOyBqPHBzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHBzW2pdLm5hbWUgPT09IG5vZGUubmFtZSB8fCBwc1tqXS5ub3BhcmVudHMgIT09IHVuZGVmaW5lZCB8fCBwc1tqXS50b3BfbGV2ZWwpIHtcblx0XHRcdFx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgcHNbal0ubmFtZSksIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZXMucHVzaChwc1tqXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bGV0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkcmVuO1xuXHRcdFx0bGV0IGNoaWxkcmVuX25hbWVzID0gJC5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKHAsIF9pKXtyZXR1cm4gcC5uYW1lO30pO1xuXHRcdFx0Zm9yKGo9MDsgajxjaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRsZXQgY2hpbGQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIGNoaWxkcmVuW2pdLm5hbWUpO1xuXHRcdFx0XHRpZihjaGlsZCl7XG5cdFx0XHRcdFx0Y2hpbGQubm9wYXJlbnRzID0gdHJ1ZTtcblx0XHRcdFx0XHRsZXQgcHRycyA9IHBlZGlncmVlX3V0aWxzLmdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCk7XG5cdFx0XHRcdFx0bGV0IHB0cjtcblx0XHRcdFx0XHRpZihwdHJzLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0XHRwdHIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbMF0pO1xuXHRcdFx0XHRcdGlmKHB0ciAmJiBwdHIubW90aGVyICE9PSBjaGlsZC5tb3RoZXIpIHtcblx0XHRcdFx0XHRcdGNoaWxkLm1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0XHRcdFx0XHRjaGlsZC5mYXRoZXIgPSBwdHIuZmF0aGVyO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihwdHIpIHtcblx0XHRcdFx0XHRcdGxldCBjaGlsZF9ub2RlICA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZm5vZGVzLCBjaGlsZC5uYW1lKTtcblx0XHRcdFx0XHRcdGxldCBhZGogPSBhZGphY2VudF9ub2Rlcyhyb290LCBjaGlsZF9ub2RlLCBjaGlsZHJlbl9uYW1lcyk7XG5cdFx0XHRcdFx0XHRjaGlsZC5tb3RoZXIgPSBhZGpbMF0gPyBhZGpbMF0uZGF0YS5tb3RoZXIgOiAoYWRqWzFdID8gYWRqWzFdLmRhdGEubW90aGVyIDogbnVsbCk7XG5cdFx0XHRcdFx0XHRjaGlsZC5mYXRoZXIgPSBhZGpbMF0gPyBhZGpbMF0uZGF0YS5mYXRoZXIgOiAoYWRqWzFdID8gYWRqWzFdLmRhdGEuZmF0aGVyIDogbnVsbCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBjaGlsZC5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpLCAxKTtcblx0fVxuXG5cdC8vIGRlbGV0ZSBhbmNlc3RvcnNcblx0Y29uc29sZS5sb2coZGVsZXRlcyk7XG5cdGZvcihpPTA7IGk8ZGVsZXRlcy5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkZWwgPSBkZWxldGVzW2ldO1xuXHRcdGxldCBzaWJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgZGVsKTtcblx0XHRjb25zb2xlLmxvZygnREVMJywgZGVsLm5hbWUsIHNpYnMpO1xuXHRcdGlmKHNpYnMubGVuZ3RoIDwgMSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2RlbCBzaWJzJywgZGVsLm5hbWUsIHNpYnMpO1xuXHRcdFx0bGV0IGRhdGFfbm9kZSAgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2RlcywgZGVsLm5hbWUpO1xuXHRcdFx0bGV0IGFuY2VzdG9ycyA9IGRhdGFfbm9kZS5hbmNlc3RvcnMoKTtcblx0XHRcdGZvcihqPTA7IGo8YW5jZXN0b3JzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGFuY2VzdG9yc1tpXSk7XG5cdFx0XHRcdGlmKGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlcil7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ0RFTEVURSAnLCBhbmNlc3RvcnNbal0uZGF0YS5tb3RoZXIsIGFuY2VzdG9yc1tqXS5kYXRhLmZhdGhlcik7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlci5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGFuY2VzdG9yc1tqXS5kYXRhLmZhdGhlci5uYW1lKSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Ly8gY2hlY2sgaW50ZWdyaXR5IG9mIG16dHdpbnMgc2V0dGluZ3Ncblx0Y2hlY2tUd2lucyhkYXRhc2V0KTtcblxuXHRsZXQgdWM7XG5cdHRyeVx0e1xuXHRcdC8vIHZhbGlkYXRlIG5ldyBwZWRpZ3JlZSBkYXRhc2V0XG5cdFx0bGV0IG5ld29wdHMgPSAkLmV4dGVuZCh7fSwgb3B0cyk7XG5cdFx0bmV3b3B0cy5kYXRhc2V0ID0gcGVkaWdyZWVfdXRpbHMuY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHRcdHZhbGlkYXRlX3BlZGlncmVlKG5ld29wdHMpO1xuXHRcdC8vIGNoZWNrIGlmIHBlZGlncmVlIGlzIHNwbGl0XG5cdFx0dWMgPSBwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChkYXRhc2V0KTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRwZWRpZ3JlZV91dGlscy5tZXNzYWdlcygnV2FybmluZycsICdEZWxldGlvbiBvZiB0aGlzIHBlZGlncmVlIG1lbWJlciBpcyBkaXNhbGxvd2VkLicpXG5cdFx0dGhyb3cgZXJyO1xuXHR9XG5cdGlmKHVjLmxlbmd0aCA+IDApIHtcblx0XHQvLyBjaGVjayAmIHdhcm4gb25seSBpZiB0aGlzIGlzIGEgbmV3IHNwbGl0XG5cdFx0aWYocGVkaWdyZWVfdXRpbHMudW5jb25uZWN0ZWQob3B0cy5kYXRhc2V0KS5sZW5ndGggPT09IDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJpbmRpdmlkdWFscyB1bmNvbm5lY3RlZCB0byBwZWRpZ3JlZSBcIiwgdWMpO1xuXHRcdFx0cGVkaWdyZWVfdXRpbHMubWVzc2FnZXMoXCJXYXJuaW5nXCIsIFwiRGVsZXRpbmcgdGhpcyB3aWxsIHNwbGl0IHRoZSBwZWRpZ3JlZS4gQ29udGludWU/XCIsIG9uRG9uZSwgb3B0cywgZGF0YXNldCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0aWYob25Eb25lKSB7XG5cdFx0b25Eb25lKG9wdHMsIGRhdGFzZXQpO1xuXHR9XG5cdHJldHVybiBkYXRhc2V0O1xufVxuIl0sIm5hbWVzIjpbIm1heF9saW1pdCIsImRpY3RfY2FjaGUiLCJoYXNfYnJvd3Nlcl9zdG9yYWdlIiwib3B0cyIsInN0b3JlX3R5cGUiLCJ1bmRlZmluZWQiLCJtb2QiLCJsb2NhbFN0b3JhZ2UiLCJzZXRJdGVtIiwicmVtb3ZlSXRlbSIsImUiLCJnZXRfcHJlZml4IiwiYnRuX3RhcmdldCIsImdldF9hcnIiLCJnZXRfYnJvd3Nlcl9zdG9yZSIsIml0ZW0iLCJnZXRJdGVtIiwic2Vzc2lvblN0b3JhZ2UiLCJzZXRfYnJvd3Nlcl9zdG9yZSIsIm5hbWUiLCJjbGVhcl9icm93c2VyX3N0b3JlIiwiY2xlYXIiLCJjbGVhcl9wZWRpZ3JlZV9kYXRhIiwicHJlZml4Iiwic3RvcmUiLCJpdGVtcyIsImkiLCJsZW5ndGgiLCJrZXkiLCJpbmRleE9mIiwicHVzaCIsImdldF9jb3VudCIsImNvdW50Iiwic2V0X2NvdW50IiwiaW5pdF9jYWNoZSIsImRhdGFzZXQiLCJKU09OIiwic3RyaW5naWZ5IiwiY29uc29sZSIsIndhcm4iLCJuc3RvcmUiLCJjdXJyZW50IiwicGFyc2UiLCJsYXN0IiwiaXQiLCJhcnIiLCJwcmV2aW91cyIsIm5leHQiLCJwYXJzZUludCIsInNldHBvc2l0aW9uIiwieCIsInkiLCJ6b29tIiwiZ2V0cG9zaXRpb24iLCJwb3MiLCJwYXJzZUZsb2F0IiwiaXNJRSIsInVhIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaXNFZGdlIiwibWF0Y2giLCJjb3B5X2RhdGFzZXQiLCJpZCIsInNvcnQiLCJhIiwiYiIsImRpc2FsbG93ZWQiLCJuZXdkYXRhc2V0Iiwib2JqIiwiZ2V0Rm9ybWF0dGVkRGF0ZSIsInRpbWUiLCJkIiwiRGF0ZSIsImdldEhvdXJzIiwic2xpY2UiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwibWVzc2FnZXMiLCJ0aXRsZSIsIm1zZyIsIm9uQ29uZmlybSIsIiQiLCJkaWFsb2ciLCJtb2RhbCIsIndpZHRoIiwiYnV0dG9ucyIsInRleHQiLCJjbGljayIsInZhbGlkYXRlX2FnZV95b2IiLCJhZ2UiLCJ5b2IiLCJzdGF0dXMiLCJ5ZWFyIiwic3VtIiwiTWF0aCIsImFicyIsImNhcGl0YWxpc2VGaXJzdExldHRlciIsInN0cmluZyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwibWFrZWlkIiwibGVuIiwicG9zc2libGUiLCJmbG9vciIsInJhbmRvbSIsImJ1aWxkVHJlZSIsInBlcnNvbiIsInJvb3QiLCJwYXJ0bmVyTGlua3MiLCJjaGlsZHJlbiIsImdldENoaWxkcmVuIiwibm9kZXMiLCJmbGF0dGVuIiwicGFydG5lcnMiLCJlYWNoIiwiY2hpbGQiLCJqIiwicCIsIm1vdGhlciIsImZhdGhlciIsIm0iLCJnZXROb2RlQnlOYW1lIiwiZiIsImNvbnRhaW5zX3BhcmVudCIsIm1lcmdlIiwicHRyIiwicGFyZW50IiwiaGlkZGVuIiwibWlkeCIsImdldElkeEJ5TmFtZSIsImZpZHgiLCJzZXRDaGlsZHJlbklkIiwiZ3AiLCJnZXRfZ3JhbmRwYXJlbnRzX2lkeCIsInVwZGF0ZVBhcmVudCIsInBhcmVudF9ub2RlIiwibXp0d2luIiwiZHp0d2lucyIsInR3aW5zIiwiZ2V0VHdpbnMiLCJ0d2luIiwiZHp0d2luIiwiaXNQcm9iYW5kIiwiYXR0ciIsInNldFByb2JhbmQiLCJpc19wcm9iYW5kIiwicHJvYmFuZCIsImNvbWJpbmVBcnJheXMiLCJhcnIxIiwiYXJyMiIsImluQXJyYXkiLCJpbmNsdWRlX2NoaWxkcmVuIiwiY29ubmVjdGVkIiwiZ2V0X3BhcnRuZXJzIiwiZ2V0QWxsQ2hpbGRyZW4iLCJjaGlsZF9pZHgiLCJhbm9kZSIsInB0cnMiLCJibm9kZSIsInVuY29ubmVjdGVkIiwidGFyZ2V0IiwiZ2V0UHJvYmFuZEluZGV4IiwiY2hhbmdlIiwiaWkiLCJuY29ubmVjdCIsImlkeCIsImhhc19wYXJlbnQiLCJub3BhcmVudHMiLCJuYW1lcyIsIm1hcCIsInZhbCIsIl9pIiwic2V4IiwiZ2V0U2libGluZ3MiLCJnZXRBbGxTaWJsaW5ncyIsInNpYnMiLCJ0d2luX3R5cGUiLCJnZXRBZG9wdGVkU2libGluZ3MiLCJnZXREZXB0aCIsImRlcHRoIiwidG9wX2xldmVsIiwiZ2V0Tm9kZXNBdERlcHRoIiwiZm5vZGVzIiwiZXhjbHVkZV9uYW1lcyIsImRhdGEiLCJsaW5rTm9kZXMiLCJmbGF0dGVuTm9kZXMiLCJsaW5rcyIsImFuY2VzdG9ycyIsIm5vZGUiLCJyZWN1cnNlIiwiY29uc2FuZ3VpdHkiLCJub2RlMSIsIm5vZGUyIiwiYW5jZXN0b3JzMSIsImFuY2VzdG9yczIiLCJuYW1lczEiLCJhbmNlc3RvciIsIm5hbWVzMiIsImluZGV4IiwiZmxhdCIsImZvckVhY2giLCJhZGp1c3RfY29vcmRzIiwieG1pZCIsIm92ZXJsYXAiLCJkZXNjZW5kYW50cyIsImRpZmYiLCJjaGlsZDEiLCJjaGlsZDIiLCJub2Rlc092ZXJsYXAiLCJERUJVRyIsImxvZyIsImRlc2NlbmRhbnRzTmFtZXMiLCJkZXNjZW5kYW50IiwieG5ldyIsIm4iLCJzeW1ib2xfc2l6ZSIsInVybFBhcmFtIiwicmVzdWx0cyIsIlJlZ0V4cCIsImV4ZWMiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJnbWlkeCIsImdmaWR4IiwicHJvYmFuZF9hdHRyIiwia2V5cyIsInZhbHVlIiwibm9kZV9hdHRyIiwicGVkY2FjaGUiLCJpc0FycmF5IiwiayIsImZvdW5kIiwic3luY1R3aW5zIiwicmVidWlsZCIsInByb2JhbmRfYWRkX2NoaWxkIiwiYnJlYXN0ZmVlZGluZyIsIm5ld2NoaWxkIiwiYWRkY2hpbGQiLCJkZWxldGVfbm9kZV9ieV9uYW1lIiwib25Eb25lIiwiZGVsZXRlX25vZGVfZGF0YXNldCIsImV4aXN0cyIsInByaW50X29wdHMiLCJyZW1vdmUiLCJhcHBlbmQiLCJhZGQiLCJvcHRpb25zIiwiZXh0ZW5kIiwiYnRucyIsImxpcyIsImZhIiwiaXNfZnVsbHNjcmVlbiIsImRvY3VtZW50IiwiZnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsIndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50Iiwib24iLCJfZSIsImxvY2FsX2RhdGFzZXQiLCJtb3pGdWxsU2NyZWVuIiwid2Via2l0RnVsbFNjcmVlbiIsInRhcmdldERpdiIsIm1velJlcXVlc3RGdWxsU2NyZWVuIiwid2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4iLCJFbGVtZW50IiwiQUxMT1dfS0VZQk9BUkRfSU5QVVQiLCJtb3pDYW5jZWxGdWxsU2NyZWVuIiwid2Via2l0Q2FuY2VsRnVsbFNjcmVlbiIsInN0b3BQcm9wYWdhdGlvbiIsImhhc0NsYXNzIiwiZW1wdHkiLCJidWlsZCIsInJlc2l6YWJsZSIsImhlaWdodCIsIkNvbnRpbnVlIiwicmVzZXQiLCJrZWVwX3Byb2JhbmRfb25fcmVzZXQiLCJDYW5jZWwiLCJ0cmlnZ2VyIiwia2VlcF9wcm9iYW5kIiwic2VsZWN0ZWQiLCJ1cGRhdGVCdXR0b25zIiwiYWRkQ2xhc3MiLCJyZW1vdmVDbGFzcyIsImNhbmNlcnMiLCJnZW5ldGljX3Rlc3QiLCJwYXRob2xvZ3lfdGVzdHMiLCJnZXRfcHJzX3ZhbHVlcyIsInBycyIsImhhc0lucHV0IiwiaXNFbXB0eSIsInRyaW0iLCJteU9iaiIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImdldF9zdXJnaWNhbF9vcHMiLCJtZXRhIiwibG9hZCIsInNhdmUiLCJicmVhc3RfY2FuY2VyX3BycyIsImFscGhhIiwienNjb3JlIiwib3Zhcmlhbl9jYW5jZXJfcHJzIiwiZXJyIiwic2F2ZV9jYW5yaXNrIiwicHJpbnQiLCJnZXRfcHJpbnRhYmxlX3N2ZyIsInN2Z19kb3dubG9hZCIsImRlZmVycmVkIiwic3ZnMmltZyIsIndoZW4iLCJhcHBseSIsImRvbmUiLCJnZXRCeU5hbWUiLCJhcmd1bWVudHMiLCJwZWRpZ3JlZV91dGlsIiwiaHRtbCIsImltZyIsIm5ld1RhYiIsIm9wZW4iLCJ3cml0ZSIsImNyZWF0ZUVsZW1lbnQiLCJkb3dubG9hZCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsInJlbW92ZUNoaWxkIiwiZ3JlcCIsIm8iLCJzdmciLCJkZWZlcnJlZF9uYW1lIiwiZGVmYXVsdHMiLCJpc2NhbnZnIiwicmVzb2x1dGlvbiIsImltZ190eXBlIiwiZmluZCIsImQzb2JqIiwiZDMiLCJzZWxlY3QiLCJnZXQiLCJsb3dlciIsIkRlZmVycmVkIiwic3ZnU3RyIiwiWE1MU2VyaWFsaXplciIsInNlcmlhbGl6ZVRvU3RyaW5nIiwieG1sIiwiaW1nc3JjIiwiYnRvYSIsInVuZXNjYXBlIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY2FudmFzIiwiY29udGV4dCIsImdldENvbnRleHQiLCJvbmxvYWQiLCJyZXBsYWNlIiwidiIsImNhbnZnIiwiQ2FudmciLCJmcm9tU3RyaW5nIiwic2NhbGVXaWR0aCIsInNjYWxlSGVpZ2h0IiwiaWdub3JlRGltZW5zaW9ucyIsInN0YXJ0IiwiZHJhd0ltYWdlIiwicmVzb2x2ZSIsInRvRGF0YVVSTCIsInNyYyIsInByb21pc2UiLCJnZXRNYXRjaGVzIiwic3RyIiwibXlSZWdleHAiLCJtYXRjaGVzIiwiYyIsImxhc3RJbmRleCIsImVycm9yIiwidW5pcXVlX3VybHMiLCJzdmdfaHRtbCIsInF1b3RlIiwibTEiLCJtMiIsIm5ld3ZhbCIsImNvcHlfc3ZnIiwic3ZnX25vZGUiLCJzZWxlY3RBbGwiLCJmaWx0ZXIiLCJ0cmVlX2RpbWVuc2lvbnMiLCJnZXRfdHJlZV9kaW1lbnNpb25zIiwic3ZnX2RpdiIsImNsb25lIiwiYXBwZW5kVG8iLCJ3aWQiLCJoZ3QiLCJzY2FsZSIsInhzY2FsZSIsInlzY2FsZSIsInl0cmFuc2Zvcm0iLCJlbCIsImNvbnN0cnVjdG9yIiwiQXJyYXkiLCJjc3NGaWxlcyIsInByaW50V2luZG93IiwiaGVhZENvbnRlbnQiLCJjc3MiLCJjbG9zZSIsImZvY3VzIiwic2V0VGltZW91dCIsInNhdmVfZmlsZSIsImNvbnRlbnQiLCJmaWxlbmFtZSIsInR5cGUiLCJmaWxlIiwiQmxvYiIsIm1zU2F2ZU9yT3BlbkJsb2IiLCJ1cmwiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJyZXZva2VPYmplY3RVUkwiLCJydW5fcHJlZGljdGlvbiIsImdldF9ub25fYW5vbl9wZWRpZ3JlZSIsImNhbnJpc2tfdmFsaWRhdGlvbiIsImRpc3BsYXlfbmFtZSIsImZpbGVzIiwicmlza19mYWN0b3JzIiwicmVhZGVyIiwiRmlsZVJlYWRlciIsInJlc3VsdCIsInN0YXJ0c1dpdGgiLCJyZWFkQm9hZGljZWFWNCIsImNhbnJpc2tfZGF0YSIsInJlYWRDYW5SaXNrVjEiLCJyZWFkTGlua2FnZSIsInZhbGlkYXRlX3BlZGlncmVlIiwiZXJyMSIsIm1lc3NhZ2UiLCJhY2NfRmFtSGlzdF90aWNrZWQiLCJhY2NfRmFtSGlzdF9MZWF2ZSIsIlJFU1VMVCIsIkZMQUdfRkFNSUxZX01PREFMIiwiZXJyMyIsImVycjIiLCJvbmVycm9yIiwiZXZlbnQiLCJjb2RlIiwicmVhZEFzVGV4dCIsImJvYWRpY2VhX2xpbmVzIiwibGluZXMiLCJzcGxpdCIsInBlZCIsImZhbWlkIiwiaW5kaSIsImFmZmVjdGVkIiwiYWxsZWxlcyIsInVuc2hpZnQiLCJwcm9jZXNzX3BlZCIsImhkciIsImxuIiwib3BzIiwib3BkYXRhIiwiZGVsaW0iLCJjYW5jZXIiLCJkaWFnbm9zaXNfYWdlIiwiYXNoa2VuYXppIiwiZ2VuZV90ZXN0IiwicGF0aF90ZXN0IiwidmVyc2lvbiIsImdldExldmVsIiwibWF4X2xldmVsIiwibGV2ZWwiLCJwaWR4IiwiZ2V0UGFydG5lcklkeCIsInVwZGF0ZV9wYXJlbnRzX2xldmVsIiwicGFyZW50cyIsIm1hIiwicGEiLCJpcyIsInBlZGNhY2hlX2N1cnJlbnQiLCJyZXNldF9uX3N5bmMiLCJwcm9wIiwiZXhjbHVkZSIsInVwZGF0ZSIsInBlZGlncmVlX2Zvcm0iLCJiY19tdXRhdGlvbl9mcmVxdWVuY2llcyIsImJjbWZyZXEiLCJnZW5lIiwidG9Mb3dlckNhc2UiLCJvYmNtZnJlcSIsIm9jX211dGF0aW9uX2ZyZXF1ZW5jaWVzIiwic2F2ZV9hc2hrbiIsInVwZGF0ZV9hc2hrbiIsInN3aXRjaGVzIiwiaXN3aXRjaCIsInMiLCJ1cGRhdGVfY2FuY2VyX2J5X3NleCIsImFwcHJveF9kaWFnbm9zaXNfYWdlIiwic3Vic3RyaW5nIiwicm91bmQ1IiwiY2hlY2tlZCIsInRyZXMiLCJ2YWxpZCIsInNob3ciLCJvdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlIiwiY2xvc2VzdCIsImhpZGUiLCJwcm9zdGF0ZV9jYW5jZXJfZGlhZ25vc2lzX2FnZSIsIngxIiwieDIiLCJyb3VuZCIsImRyYWdnaW5nIiwibGFzdF9tb3VzZW92ZXIiLCJhZGRXaWRnZXRzIiwiZm9udF9zaXplIiwicG9wdXBfc2VsZWN0aW9uIiwic3R5bGUiLCJzcXVhcmUiLCJzcXVhcmVfdGl0bGUiLCJjaXJjbGUiLCJjaXJjbGVfdGl0bGUiLCJ1bnNwZWNpZmllZCIsImFkZF9wZXJzb24iLCJjbGFzc2VkIiwiZGF0dW0iLCJhZGRzaWJsaW5nIiwiaGlnaGxpZ2h0IiwiZHJhZ19oYW5kbGUiLCJfZCIsImZ4Iiwib2ZmIiwiZnkiLCJ3aWRnZXRzIiwiZWRpdCIsInNldHRpbmdzIiwid2lkZ2V0Iiwic3R5bGVzIiwicGFyZW50Tm9kZSIsIm9wdCIsIm9wZW5FZGl0RGlhbG9nIiwiYWRkcGFyZW50cyIsImFkZHBhcnRuZXIiLCJjdHJsS2V5Iiwic3BsaWNlIiwibm9kZWNsaWNrIiwic2V0TGluZURyYWdQb3NpdGlvbiIsIm1vdXNlIiwibGluZV9kcmFnX3NlbGVjdGlvbiIsImRsaW5lIiwiZHJhZyIsImRyYWdzdGFydCIsImRyYWdzdG9wIiwic291cmNlRXZlbnQiLCJkeCIsImR5IiwieW5ldyIsInkxIiwieTIiLCJ0cmFuc2xhdGUiLCJhdXRvT3BlbiIsInRhYmxlIiwiZGlzZWFzZXMiLCJkaXNlYXNlX2NvbG91ciIsImNvbG91ciIsImtrIiwicm9vdHMiLCJ6b29tSW4iLCJ6b29tT3V0IiwibGFiZWxzIiwiZm9udF9mYW1pbHkiLCJmb250X3dlaWdodCIsImJhY2tncm91bmQiLCJub2RlX2JhY2tncm91bmQiLCJ2YWxpZGF0ZSIsInBidXR0b25zIiwiaW8iLCJncm91cF90b3BfbGV2ZWwiLCJwZWRpZ3JlZV91dGlscyIsInN2Z19kaW1lbnNpb25zIiwiZ2V0X3N2Z19kaW1lbnNpb25zIiwieHl0cmFuc2Zvcm0iLCJ4dHJhbnNmb3JtIiwiaGlkZGVuX3Jvb3QiLCJoaWVyYXJjaHkiLCJ0cmVlbWFwIiwidHJlZSIsInNlcGFyYXRpb24iLCJzaXplIiwidmlzX25vZGVzIiwiY3JlYXRlX2VyciIsInB0ckxpbmtOb2RlcyIsImNoZWNrX3B0cl9saW5rcyIsImVudGVyIiwibWlzY2FycmlhZ2UiLCJ0ZXJtaW5hdGlvbiIsInN5bWJvbCIsInN5bWJvbFRyaWFuZ2xlIiwic3ltYm9sQ2lyY2xlIiwic3ltYm9sU3F1YXJlIiwicGllbm9kZSIsIm5jYW5jZXJzIiwicHJlZml4SW5PYmoiLCJwaWUiLCJhcmMiLCJpbm5lclJhZGl1cyIsIm91dGVyUmFkaXVzIiwiYWRvcHRlZF9pbiIsImFkb3B0ZWRfb3V0IiwiaW5kZW50IiwiZ2V0X2JyYWNrZXQiLCJhZGRMYWJlbCIsImdldFB4IiwiaWxhYiIsImxhYmVsIiwieV9vZmZzZXQiLCJ2YXJzIiwiaXZhciIsImRpc2Vhc2UiLCJkaXMiLCJjbGFzaF9kZXB0aCIsImRyYXdfcGF0aCIsImNsYXNoIiwiZHkxIiwiZHkyIiwiY3NoaWZ0IiwibCIsInBhdGgiLCJkeDEiLCJkeDIiLCJpbnNlcnQiLCJkaXZvcmNlZCIsImNoZWNrX3B0cl9saW5rX2NsYXNoZXMiLCJwYXJlbnRfbm9kZXMiLCJwYXJlbnRfbm9kZV9uYW1lIiwiZGl2b3JjZV9wYXRoIiwicGF0aDIiLCJzb3VyY2UiLCJkYXNoX2xlbiIsImRhc2hfYXJyYXkiLCJ1c2VkbGVuIiwidHdpbngiLCJ4bWluIiwidCIsInRoaXN4IiwieW1pZCIsInhoYmFyIiwieHgiLCJ5eSIsInByb2JhbmRJZHgiLCJwcm9iYW5kTm9kZSIsInRyaWlkIiwic2NhbGVFeHRlbnQiLCJ6b29tRm4iLCJ0cmFuc2Zvcm0iLCJ0b1N0cmluZyIsIkVycm9yIiwidW5pcXVlbmFtZXMiLCJmYW1pZHMiLCJqb2luIiwidWMiLCJfbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsIm1heHNjb3JlIiwiZ2VuZXJhdGlvbiIsInNjb3JlIiwibWF4X2RlcHRoIiwidHJlZV93aWR0aCIsInRyZWVfaGVpZ2h0IiwidG9wX2xldmVsX3NlZW4iLCJlbVZhbCIsImdldENvbXB1dGVkU3R5bGUiLCJmb250U2l6ZSIsImZ0ZXh0IiwiY2xhc3NfbGFiZWwiLCJ0ZW1wbGF0ZXMiLCJuY2hpbGQiLCJwdHJfbmFtZSIsInBhcnRuZXIiLCJ0d2luX2lkIiwiZ2V0VW5pcXVlVHdpbklEIiwibmV3Y2hpbGRyZW4iLCJhZGRfbGhzIiwibmV3YmllIiwic2V0TXpUd2luIiwiZDEiLCJkMiIsIm16IiwiY2hlY2tUd2lucyIsInR3aW5fdHlwZXMiLCJmbGF0X3RyZWUiLCJ0cmVlX25vZGUiLCJwaWQiLCJub2RlX21vdGhlciIsIm5vZGVfZmF0aGVyIiwibm9kZV9zaWJzIiwicmlkIiwibGlkIiwic2lkIiwiZmFpZHgiLCJtb2lkeCIsInRtcGZhIiwib3JwaGFucyIsIm5pZCIsIm9pZCIsIm9pZHgiLCJwdHJfbm9kZSIsImFkamFjZW50X25vZGVzIiwiZXhjbHVkZXMiLCJkbm9kZXMiLCJsaHNfbm9kZSIsInJoc19ub2RlIiwiZGVsZXRlcyIsImQzbm9kZSIsInBzIiwiY2hpbGRyZW5fbmFtZXMiLCJjaGlsZF9ub2RlIiwiYWRqIiwiZGVsIiwiZGF0YV9ub2RlIiwibmV3b3B0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUFBO0VBRUEsSUFBSUEsU0FBUyxHQUFHLEVBQWhCO0VBQ0EsSUFBSUMsVUFBVSxHQUFHLEVBQWpCOztFQUdBLFNBQVNDLG1CQUFULENBQTZCQyxJQUE3QixFQUFtQztFQUNsQyxNQUFJO0VBQ0gsUUFBR0EsSUFBSSxDQUFDQyxVQUFMLEtBQW9CLE9BQXZCLEVBQ0MsT0FBTyxLQUFQO0VBRUQsUUFBR0QsSUFBSSxDQUFDQyxVQUFMLEtBQW9CLE9BQXBCLElBQStCRCxJQUFJLENBQUNDLFVBQUwsS0FBb0IsU0FBbkQsSUFBZ0VELElBQUksQ0FBQ0MsVUFBTCxLQUFvQkMsU0FBdkYsRUFDQyxPQUFPLEtBQVA7RUFFRCxRQUFJQyxHQUFHLEdBQUcsTUFBVjtFQUNBQyxJQUFBQSxZQUFZLENBQUNDLE9BQWIsQ0FBcUJGLEdBQXJCLEVBQTBCQSxHQUExQjtFQUNBQyxJQUFBQSxZQUFZLENBQUNFLFVBQWIsQ0FBd0JILEdBQXhCO0VBQ0EsV0FBTyxJQUFQO0VBQ0EsR0FYRCxDQVdFLE9BQU1JLENBQU4sRUFBUztFQUNWLFdBQU8sS0FBUDtFQUNBO0VBQ0Q7O0VBRUQsU0FBU0MsVUFBVCxDQUFvQlIsSUFBcEIsRUFBMEI7RUFDekIsU0FBTyxjQUFZQSxJQUFJLENBQUNTLFVBQWpCLEdBQTRCLEdBQW5DO0VBQ0E7OztFQUdELFNBQVNDLE9BQVQsQ0FBaUJWLElBQWpCLEVBQXVCO0VBQ3RCLFNBQU9GLFVBQVUsQ0FBQ1UsVUFBVSxDQUFDUixJQUFELENBQVgsQ0FBakI7RUFDQTs7RUFFRCxTQUFTVyxpQkFBVCxDQUEyQlgsSUFBM0IsRUFBaUNZLElBQWpDLEVBQXVDO0VBQ3RDLE1BQUdaLElBQUksQ0FBQ0MsVUFBTCxLQUFvQixPQUF2QixFQUNDLE9BQU9HLFlBQVksQ0FBQ1MsT0FBYixDQUFxQkQsSUFBckIsQ0FBUCxDQURELEtBR0MsT0FBT0UsY0FBYyxDQUFDRCxPQUFmLENBQXVCRCxJQUF2QixDQUFQO0VBQ0Q7O0VBRUQsU0FBU0csaUJBQVQsQ0FBMkJmLElBQTNCLEVBQWlDZ0IsSUFBakMsRUFBdUNKLElBQXZDLEVBQTZDO0VBQzVDLE1BQUdaLElBQUksQ0FBQ0MsVUFBTCxLQUFvQixPQUF2QixFQUNDLE9BQU9HLFlBQVksQ0FBQ0MsT0FBYixDQUFxQlcsSUFBckIsRUFBMkJKLElBQTNCLENBQVAsQ0FERCxLQUdDLE9BQU9FLGNBQWMsQ0FBQ1QsT0FBZixDQUF1QlcsSUFBdkIsRUFBNkJKLElBQTdCLENBQVA7RUFDRDs7O0VBR0QsU0FBU0ssbUJBQVQsQ0FBNkJqQixJQUE3QixFQUFtQztFQUNsQyxNQUFHQSxJQUFJLENBQUNDLFVBQUwsS0FBb0IsT0FBdkIsRUFDQyxPQUFPRyxZQUFZLENBQUNjLEtBQWIsRUFBUCxDQURELEtBR0MsT0FBT0osY0FBYyxDQUFDSSxLQUFmLEVBQVA7RUFDRDs7O0VBR00sU0FBU0MsbUJBQVQsQ0FBNkJuQixJQUE3QixFQUFtQztFQUN6QyxNQUFJb0IsTUFBTSxHQUFHWixVQUFVLENBQUNSLElBQUQsQ0FBdkI7RUFDQSxNQUFJcUIsS0FBSyxHQUFJckIsSUFBSSxDQUFDQyxVQUFMLEtBQW9CLE9BQXBCLEdBQThCRyxZQUE5QixHQUE2Q1UsY0FBMUQ7RUFDQSxNQUFJUSxLQUFLLEdBQUcsRUFBWjs7RUFDQSxPQUFJLElBQUlDLENBQUMsR0FBRyxDQUFaLEVBQWVBLENBQUMsR0FBR0YsS0FBSyxDQUFDRyxNQUF6QixFQUFpQ0QsQ0FBQyxFQUFsQyxFQUFxQztFQUNwQyxRQUFHRixLQUFLLENBQUNJLEdBQU4sQ0FBVUYsQ0FBVixFQUFhRyxPQUFiLENBQXFCTixNQUFyQixLQUFnQyxDQUFuQyxFQUNDRSxLQUFLLENBQUNLLElBQU4sQ0FBV04sS0FBSyxDQUFDSSxHQUFOLENBQVVGLENBQVYsQ0FBWDtFQUNEOztFQUNELE9BQUksSUFBSUEsRUFBQyxHQUFHLENBQVosRUFBZUEsRUFBQyxHQUFHRCxLQUFLLENBQUNFLE1BQXpCLEVBQWlDRCxFQUFDLEVBQWxDO0VBQ0NGLElBQUFBLEtBQUssQ0FBQ2YsVUFBTixDQUFpQmdCLEtBQUssQ0FBQ0MsRUFBRCxDQUF0QjtFQUREO0VBRUE7RUFFTSxTQUFTSyxTQUFULENBQW1CNUIsSUFBbkIsRUFBeUI7RUFDL0IsTUFBSTZCLEtBQUo7RUFDQSxNQUFJOUIsbUJBQW1CLENBQUNDLElBQUQsQ0FBdkIsRUFDQzZCLEtBQUssR0FBR2xCLGlCQUFpQixDQUFDWCxJQUFELEVBQU9RLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLEdBQWlCLE9BQXhCLENBQXpCLENBREQsS0FHQzZCLEtBQUssR0FBRy9CLFVBQVUsQ0FBQ1UsVUFBVSxDQUFDUixJQUFELENBQVYsR0FBaUIsT0FBbEIsQ0FBbEI7RUFDRCxNQUFHNkIsS0FBSyxLQUFLLElBQVYsSUFBa0JBLEtBQUssS0FBSzNCLFNBQS9CLEVBQ0MsT0FBTzJCLEtBQVA7RUFDRCxTQUFPLENBQVA7RUFDQTs7RUFFRCxTQUFTQyxTQUFULENBQW1COUIsSUFBbkIsRUFBeUI2QixLQUF6QixFQUFnQztFQUMvQixNQUFJOUIsbUJBQW1CLENBQUNDLElBQUQsQ0FBdkIsRUFDQ2UsaUJBQWlCLENBQUNmLElBQUQsRUFBT1EsVUFBVSxDQUFDUixJQUFELENBQVYsR0FBaUIsT0FBeEIsRUFBaUM2QixLQUFqQyxDQUFqQixDQURELEtBR0MvQixVQUFVLENBQUNVLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLEdBQWlCLE9BQWxCLENBQVYsR0FBdUM2QixLQUF2QztFQUNEOztFQUVNLFNBQVNFLFVBQVQsQ0FBb0IvQixJQUFwQixFQUEwQjtFQUNoQyxNQUFHLENBQUNBLElBQUksQ0FBQ2dDLE9BQVQsRUFDQztFQUNELE1BQUlILEtBQUssR0FBR0QsU0FBUyxDQUFDNUIsSUFBRCxDQUFyQjs7RUFDQSxNQUFJRCxtQkFBbUIsQ0FBQ0MsSUFBRCxDQUF2QixFQUErQjtFQUFJO0VBQ2xDZSxJQUFBQSxpQkFBaUIsQ0FBQ2YsSUFBRCxFQUFPUSxVQUFVLENBQUNSLElBQUQsQ0FBVixHQUFpQjZCLEtBQXhCLEVBQStCSSxJQUFJLENBQUNDLFNBQUwsQ0FBZWxDLElBQUksQ0FBQ2dDLE9BQXBCLENBQS9CLENBQWpCO0VBQ0EsR0FGRCxNQUVPO0VBQUk7RUFDVkcsSUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEscURBQWIsRUFBb0VwQyxJQUFJLENBQUNDLFVBQXpFO0VBQ0FKLElBQUFBLFNBQVMsR0FBRyxHQUFaO0VBQ0EsUUFBR2EsT0FBTyxDQUFDVixJQUFELENBQVAsS0FBa0JFLFNBQXJCLEVBQ0NKLFVBQVUsQ0FBQ1UsVUFBVSxDQUFDUixJQUFELENBQVgsQ0FBVixHQUErQixFQUEvQjtFQUNEVSxJQUFBQSxPQUFPLENBQUNWLElBQUQsQ0FBUCxDQUFjMkIsSUFBZCxDQUFtQk0sSUFBSSxDQUFDQyxTQUFMLENBQWVsQyxJQUFJLENBQUNnQyxPQUFwQixDQUFuQjtFQUNBOztFQUNELE1BQUdILEtBQUssR0FBR2hDLFNBQVgsRUFDQ2dDLEtBQUssR0FETixLQUdDQSxLQUFLLEdBQUcsQ0FBUjtFQUNEQyxFQUFBQSxTQUFTLENBQUM5QixJQUFELEVBQU82QixLQUFQLENBQVQ7RUFDQTtFQUVNLFNBQVNRLE1BQVQsQ0FBZ0JyQyxJQUFoQixFQUFzQjtFQUM1QixNQUFHRCxtQkFBbUIsQ0FBQ0MsSUFBRCxDQUF0QixFQUE4QjtFQUM3QixTQUFJLElBQUl1QixDQUFDLEdBQUMxQixTQUFWLEVBQXFCMEIsQ0FBQyxHQUFDLENBQXZCLEVBQTBCQSxDQUFDLEVBQTNCLEVBQStCO0VBQzlCLFVBQUdaLGlCQUFpQixDQUFDWCxJQUFELEVBQU9RLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLElBQWtCdUIsQ0FBQyxHQUFDLENBQXBCLENBQVAsQ0FBakIsS0FBb0QsSUFBdkQsRUFDQyxPQUFPQSxDQUFQO0VBQ0Q7RUFDRCxHQUxELE1BS087RUFDTixXQUFRYixPQUFPLENBQUNWLElBQUQsQ0FBUCxJQUFpQlUsT0FBTyxDQUFDVixJQUFELENBQVAsQ0FBY3dCLE1BQWQsR0FBdUIsQ0FBeEMsR0FBNENkLE9BQU8sQ0FBQ1YsSUFBRCxDQUFQLENBQWN3QixNQUExRCxHQUFtRSxDQUFDLENBQTVFO0VBQ0E7O0VBQ0QsU0FBTyxDQUFDLENBQVI7RUFDQTtFQUVNLFNBQVNjLE9BQVQsQ0FBaUJ0QyxJQUFqQixFQUF1QjtFQUM3QixNQUFJc0MsT0FBTyxHQUFHVixTQUFTLENBQUM1QixJQUFELENBQVQsR0FBZ0IsQ0FBOUI7RUFDQSxNQUFHc0MsT0FBTyxJQUFJLENBQUMsQ0FBZixFQUNDQSxPQUFPLEdBQUd6QyxTQUFWO0VBQ0QsTUFBR0UsbUJBQW1CLENBQUNDLElBQUQsQ0FBdEIsRUFDQyxPQUFPaUMsSUFBSSxDQUFDTSxLQUFMLENBQVc1QixpQkFBaUIsQ0FBQ1gsSUFBRCxFQUFPUSxVQUFVLENBQUNSLElBQUQsQ0FBVixHQUFpQnNDLE9BQXhCLENBQTVCLENBQVAsQ0FERCxLQUVLLElBQUc1QixPQUFPLENBQUNWLElBQUQsQ0FBVixFQUNKLE9BQU9pQyxJQUFJLENBQUNNLEtBQUwsQ0FBVzdCLE9BQU8sQ0FBQ1YsSUFBRCxDQUFQLENBQWNzQyxPQUFkLENBQVgsQ0FBUDtFQUNEO0VBRU0sU0FBU0UsSUFBVCxDQUFjeEMsSUFBZCxFQUFvQjtFQUMxQixNQUFHRCxtQkFBbUIsQ0FBQ0MsSUFBRCxDQUF0QixFQUE4QjtFQUM3QixTQUFJLElBQUl1QixDQUFDLEdBQUMxQixTQUFWLEVBQXFCMEIsQ0FBQyxHQUFDLENBQXZCLEVBQTBCQSxDQUFDLEVBQTNCLEVBQStCO0VBQzlCLFVBQUlrQixFQUFFLEdBQUc5QixpQkFBaUIsQ0FBQ1gsSUFBRCxFQUFPUSxVQUFVLENBQUNSLElBQUQsQ0FBVixJQUFrQnVCLENBQUMsR0FBQyxDQUFwQixDQUFQLENBQTFCOztFQUNBLFVBQUdrQixFQUFFLEtBQUssSUFBVixFQUFnQjtFQUNmWCxRQUFBQSxTQUFTLENBQUM5QixJQUFELEVBQU91QixDQUFQLENBQVQ7RUFDQSxlQUFPVSxJQUFJLENBQUNNLEtBQUwsQ0FBV0UsRUFBWCxDQUFQO0VBQ0E7RUFDRDtFQUNELEdBUkQsTUFRTztFQUNOLFFBQUlDLEdBQUcsR0FBR2hDLE9BQU8sQ0FBQ1YsSUFBRCxDQUFqQjtFQUNBLFFBQUcwQyxHQUFILEVBQ0MsT0FBT1QsSUFBSSxDQUFDTSxLQUFMLENBQVdHLEdBQUcsQ0FBQ0EsR0FBRyxDQUFDbEIsTUFBSixHQUFXLENBQVosQ0FBZCxDQUFQO0VBQ0Q7O0VBQ0QsU0FBT3RCLFNBQVA7RUFDQTtFQUVNLFNBQVN5QyxRQUFULENBQWtCM0MsSUFBbEIsRUFBd0IyQyxRQUF4QixFQUFrQztFQUN4QyxNQUFHQSxRQUFRLEtBQUt6QyxTQUFoQixFQUNDeUMsUUFBUSxHQUFHZixTQUFTLENBQUM1QixJQUFELENBQVQsR0FBa0IsQ0FBN0I7O0VBRUQsTUFBRzJDLFFBQVEsR0FBRyxDQUFkLEVBQWlCO0VBQ2hCLFFBQUlOLE9BQU0sR0FBR0EsT0FBTSxDQUFDckMsSUFBRCxDQUFuQjs7RUFDQSxRQUFHcUMsT0FBTSxHQUFHeEMsU0FBWixFQUNDOEMsUUFBUSxHQUFHTixPQUFNLEdBQUcsQ0FBcEIsQ0FERCxLQUdDTSxRQUFRLEdBQUc5QyxTQUFTLEdBQUcsQ0FBdkI7RUFDRDs7RUFDRGlDLEVBQUFBLFNBQVMsQ0FBQzlCLElBQUQsRUFBTzJDLFFBQVEsR0FBRyxDQUFsQixDQUFUO0VBQ0EsTUFBRzVDLG1CQUFtQixDQUFDQyxJQUFELENBQXRCLEVBQ0MsT0FBT2lDLElBQUksQ0FBQ00sS0FBTCxDQUFXNUIsaUJBQWlCLENBQUNYLElBQUQsRUFBT1EsVUFBVSxDQUFDUixJQUFELENBQVYsR0FBaUIyQyxRQUF4QixDQUE1QixDQUFQLENBREQsS0FHQyxPQUFPVixJQUFJLENBQUNNLEtBQUwsQ0FBVzdCLE9BQU8sQ0FBQ1YsSUFBRCxDQUFQLENBQWMyQyxRQUFkLENBQVgsQ0FBUDtFQUNEO0VBRU0sU0FBU0MsSUFBVCxDQUFjNUMsSUFBZCxFQUFvQjRDLElBQXBCLEVBQTBCO0VBQ2hDLE1BQUdBLElBQUksS0FBSzFDLFNBQVosRUFDQzBDLElBQUksR0FBR2hCLFNBQVMsQ0FBQzVCLElBQUQsQ0FBaEI7RUFDRCxNQUFHNEMsSUFBSSxJQUFJL0MsU0FBWCxFQUNDK0MsSUFBSSxHQUFHLENBQVA7RUFFRGQsRUFBQUEsU0FBUyxDQUFDOUIsSUFBRCxFQUFPNkMsUUFBUSxDQUFDRCxJQUFELENBQVIsR0FBaUIsQ0FBeEIsQ0FBVDtFQUNBLE1BQUc3QyxtQkFBbUIsQ0FBQ0MsSUFBRCxDQUF0QixFQUNDLE9BQU9pQyxJQUFJLENBQUNNLEtBQUwsQ0FBVzVCLGlCQUFpQixDQUFDWCxJQUFELEVBQU9RLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLEdBQWlCNEMsSUFBeEIsQ0FBNUIsQ0FBUCxDQURELEtBR0MsT0FBT1gsSUFBSSxDQUFDTSxLQUFMLENBQVc3QixPQUFPLENBQUNWLElBQUQsQ0FBUCxDQUFjNEMsSUFBZCxDQUFYLENBQVA7RUFDRDtFQUVNLFNBQVMxQixLQUFULENBQWVsQixJQUFmLEVBQXFCO0VBQzNCLE1BQUdELG1CQUFtQixDQUFDQyxJQUFELENBQXRCLEVBQ0NpQixtQkFBbUIsQ0FBQ2pCLElBQUQsQ0FBbkI7RUFDREYsRUFBQUEsVUFBVSxHQUFHLEVBQWI7RUFDQTs7RUFHTSxTQUFTZ0QsV0FBVCxDQUFxQjlDLElBQXJCLEVBQTJCK0MsQ0FBM0IsRUFBOEJDLENBQTlCLEVBQWlDQyxJQUFqQyxFQUF1QztFQUM3QyxNQUFHbEQsbUJBQW1CLENBQUNDLElBQUQsQ0FBdEIsRUFBOEI7RUFDN0JlLElBQUFBLGlCQUFpQixDQUFDZixJQUFELEVBQU9RLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLEdBQWlCLElBQXhCLEVBQThCK0MsQ0FBOUIsQ0FBakI7RUFDQWhDLElBQUFBLGlCQUFpQixDQUFDZixJQUFELEVBQU9RLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLEdBQWlCLElBQXhCLEVBQThCZ0QsQ0FBOUIsQ0FBakI7RUFDQSxRQUFHQyxJQUFILEVBQ0NsQyxpQkFBaUIsQ0FBQ2YsSUFBRCxFQUFPUSxVQUFVLENBQUNSLElBQUQsQ0FBVixHQUFpQixPQUF4QixFQUFpQ2lELElBQWpDLENBQWpCO0VBQ0Q7RUFHRDtFQUVNLFNBQVNDLFdBQVQsQ0FBcUJsRCxJQUFyQixFQUEyQjtFQUNqQyxNQUFHLENBQUNELG1CQUFtQixDQUFDQyxJQUFELENBQXBCLElBQ0RJLFlBQVksQ0FBQ1MsT0FBYixDQUFxQkwsVUFBVSxDQUFDUixJQUFELENBQVYsR0FBaUIsSUFBdEMsTUFBZ0QsSUFBaEQsSUFDQWMsY0FBYyxDQUFDRCxPQUFmLENBQXVCTCxVQUFVLENBQUNSLElBQUQsQ0FBVixHQUFpQixJQUF4QyxNQUFrRCxJQUZwRCxFQUdDLE9BQU8sQ0FBQyxJQUFELEVBQU8sSUFBUCxDQUFQO0VBQ0QsTUFBSW1ELEdBQUcsR0FBRyxDQUFFTixRQUFRLENBQUNsQyxpQkFBaUIsQ0FBQ1gsSUFBRCxFQUFPUSxVQUFVLENBQUNSLElBQUQsQ0FBVixHQUFpQixJQUF4QixDQUFsQixDQUFWLEVBQ1A2QyxRQUFRLENBQUNsQyxpQkFBaUIsQ0FBQ1gsSUFBRCxFQUFPUSxVQUFVLENBQUNSLElBQUQsQ0FBVixHQUFpQixJQUF4QixDQUFsQixDQURELENBQVY7RUFFQSxNQUFHVyxpQkFBaUIsQ0FBQ0gsVUFBVSxDQUFDUixJQUFELENBQVYsR0FBaUIsT0FBbEIsQ0FBakIsS0FBZ0QsSUFBbkQsRUFDQ21ELEdBQUcsQ0FBQ3hCLElBQUosQ0FBU3lCLFVBQVUsQ0FBQ3pDLGlCQUFpQixDQUFDWCxJQUFELEVBQU9RLFVBQVUsQ0FBQ1IsSUFBRCxDQUFWLEdBQWlCLE9BQXhCLENBQWxCLENBQW5CO0VBQ0QsU0FBT21ELEdBQVA7RUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7RUN0TU0sU0FBU0UsSUFBVCxHQUFnQjtFQUNyQixNQUFJQyxFQUFFLEdBQUdDLFNBQVMsQ0FBQ0MsU0FBbkI7RUFDQTs7RUFDQSxTQUFPRixFQUFFLENBQUM1QixPQUFILENBQVcsT0FBWCxJQUFzQixDQUFDLENBQXZCLElBQTRCNEIsRUFBRSxDQUFDNUIsT0FBSCxDQUFXLFVBQVgsSUFBeUIsQ0FBQyxDQUE3RDtFQUNEO0VBRU0sU0FBUytCLE1BQVQsR0FBa0I7RUFDdkIsU0FBT0YsU0FBUyxDQUFDQyxTQUFWLENBQW9CRSxLQUFwQixDQUEwQixPQUExQixDQUFQO0VBQ0Q7RUFFTSxTQUFTQyxZQUFULENBQXNCM0IsT0FBdEIsRUFBK0I7RUFDckMsTUFBR0EsT0FBTyxDQUFDLENBQUQsQ0FBUCxDQUFXNEIsRUFBZCxFQUFrQjtFQUFFO0VBQ25CNUIsSUFBQUEsT0FBTyxDQUFDNkIsSUFBUixDQUFhLFVBQVNDLENBQVQsRUFBV0MsQ0FBWCxFQUFhO0VBQUMsYUFBUSxDQUFDRCxDQUFDLENBQUNGLEVBQUgsSUFBUyxDQUFDRyxDQUFDLENBQUNILEVBQVosR0FBaUIsQ0FBakIsR0FBcUJFLENBQUMsQ0FBQ0YsRUFBRixHQUFPRyxDQUFDLENBQUNILEVBQVYsR0FBZ0IsQ0FBaEIsR0FBc0JHLENBQUMsQ0FBQ0gsRUFBRixHQUFPRSxDQUFDLENBQUNGLEVBQVYsR0FBZ0IsQ0FBQyxDQUFqQixHQUFxQixDQUF0RTtFQUEyRSxLQUF0RztFQUNBOztFQUVELE1BQUlJLFVBQVUsR0FBRyxDQUFDLElBQUQsRUFBTyxhQUFQLENBQWpCO0VBQ0EsTUFBSUMsVUFBVSxHQUFHLEVBQWpCOztFQUNBLE9BQUksSUFBSTFDLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ1MsT0FBTyxDQUFDUixNQUF2QixFQUErQkQsQ0FBQyxFQUFoQyxFQUFtQztFQUNsQyxRQUFJMkMsR0FBRyxHQUFHLEVBQVY7O0VBQ0EsU0FBSSxJQUFJekMsR0FBUixJQUFlTyxPQUFPLENBQUNULENBQUQsQ0FBdEIsRUFBMkI7RUFDMUIsVUFBR3lDLFVBQVUsQ0FBQ3RDLE9BQVgsQ0FBbUJELEdBQW5CLEtBQTJCLENBQUMsQ0FBL0IsRUFDQ3lDLEdBQUcsQ0FBQ3pDLEdBQUQsQ0FBSCxHQUFXTyxPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXRSxHQUFYLENBQVg7RUFDRDs7RUFDRHdDLElBQUFBLFVBQVUsQ0FBQ3RDLElBQVgsQ0FBZ0J1QyxHQUFoQjtFQUNBOztFQUNELFNBQU9ELFVBQVA7RUFDQTtFQUVEO0VBQ0E7RUFDQTs7RUFDTyxTQUFTRSxnQkFBVCxDQUEwQkMsSUFBMUIsRUFBK0I7RUFDckMsTUFBSUMsQ0FBQyxHQUFHLElBQUlDLElBQUosRUFBUjtFQUNBLE1BQUdGLElBQUgsRUFDQyxPQUFPLENBQUMsTUFBTUMsQ0FBQyxDQUFDRSxRQUFGLEVBQVAsRUFBcUJDLEtBQXJCLENBQTJCLENBQUMsQ0FBNUIsSUFBaUMsR0FBakMsR0FBdUMsQ0FBQyxNQUFNSCxDQUFDLENBQUNJLFVBQUYsRUFBUCxFQUF1QkQsS0FBdkIsQ0FBNkIsQ0FBQyxDQUE5QixDQUF2QyxHQUEwRSxHQUExRSxHQUFnRixDQUFDLE1BQU1ILENBQUMsQ0FBQ0ssVUFBRixFQUFQLEVBQXVCRixLQUF2QixDQUE2QixDQUFDLENBQTlCLENBQXZGLENBREQsS0FHQyxPQUFPSCxDQUFDLENBQUNNLFdBQUYsS0FBa0IsR0FBbEIsR0FBd0IsQ0FBQyxPQUFPTixDQUFDLENBQUNPLFFBQUYsS0FBZSxDQUF0QixDQUFELEVBQTJCSixLQUEzQixDQUFpQyxDQUFDLENBQWxDLENBQXhCLEdBQStELEdBQS9ELEdBQXFFLENBQUMsTUFBTUgsQ0FBQyxDQUFDUSxPQUFGLEVBQVAsRUFBb0JMLEtBQXBCLENBQTBCLENBQUMsQ0FBM0IsQ0FBckUsR0FBcUcsR0FBckcsR0FBMkcsQ0FBQyxNQUFNSCxDQUFDLENBQUNFLFFBQUYsRUFBUCxFQUFxQkMsS0FBckIsQ0FBMkIsQ0FBQyxDQUE1QixDQUEzRyxHQUE0SSxHQUE1SSxHQUFrSixDQUFDLE1BQU1ILENBQUMsQ0FBQ0ksVUFBRixFQUFQLEVBQXVCRCxLQUF2QixDQUE2QixDQUFDLENBQTlCLENBQWxKLEdBQXFMLEdBQXJMLEdBQTJMLENBQUMsTUFBTUgsQ0FBQyxDQUFDSyxVQUFGLEVBQVAsRUFBdUJGLEtBQXZCLENBQTZCLENBQUMsQ0FBOUIsQ0FBbE07RUFDQTtFQUVGO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7O0VBQ08sU0FBU00sUUFBVCxDQUFrQkMsS0FBbEIsRUFBeUJDLEdBQXpCLEVBQThCQyxTQUE5QixFQUF5Q2pGLElBQXpDLEVBQStDZ0MsT0FBL0MsRUFBd0Q7RUFDOUQsTUFBR2lELFNBQUgsRUFBYztFQUNiQyxJQUFBQSxDQUFDLENBQUMseUJBQXVCRixHQUF2QixHQUEyQixRQUE1QixDQUFELENBQXVDRyxNQUF2QyxDQUE4QztFQUM1Q0MsTUFBQUEsS0FBSyxFQUFFLElBRHFDO0VBRTVDTCxNQUFBQSxLQUFLLEVBQUVBLEtBRnFDO0VBRzVDTSxNQUFBQSxLQUFLLEVBQUUsR0FIcUM7RUFJNUNDLE1BQUFBLE9BQU8sRUFBRTtFQUNSLGVBQU8sZUFBWTtFQUNsQkosVUFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRQyxNQUFSLENBQWUsT0FBZjtFQUNBRixVQUFBQSxTQUFTLENBQUNqRixJQUFELEVBQU9nQyxPQUFQLENBQVQ7RUFDQSxTQUpPO0VBS1IsY0FBTSxjQUFZO0VBQ2pCa0QsVUFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRQyxNQUFSLENBQWUsT0FBZjtFQUNBO0VBUE87RUFKbUMsS0FBOUM7RUFjQSxHQWZELE1BZU87RUFDTkQsSUFBQUEsQ0FBQyxDQUFDLHlCQUF1QkYsR0FBdkIsR0FBMkIsUUFBNUIsQ0FBRCxDQUF1Q0csTUFBdkMsQ0FBOEM7RUFDN0NKLE1BQUFBLEtBQUssRUFBRUEsS0FEc0M7RUFFN0NNLE1BQUFBLEtBQUssRUFBRSxHQUZzQztFQUc3Q0MsTUFBQUEsT0FBTyxFQUFFLENBQUM7RUFDVEMsUUFBQUEsSUFBSSxFQUFFLElBREc7RUFFVEMsUUFBQUEsS0FBSyxFQUFFLGlCQUFXO0VBQUVOLFVBQUFBLENBQUMsQ0FBRSxJQUFGLENBQUQsQ0FBVUMsTUFBVixDQUFrQixPQUFsQjtFQUE2QjtFQUZ4QyxPQUFEO0VBSG9DLEtBQTlDO0VBUUE7RUFDRDtFQUVEO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOztFQUNPLFNBQVNNLGdCQUFULENBQTBCQyxHQUExQixFQUErQkMsR0FBL0IsRUFBb0NDLE1BQXBDLEVBQTRDO0VBQ2xELE1BQUlDLElBQUksR0FBRyxJQUFJdkIsSUFBSixHQUFXSyxXQUFYLEVBQVg7RUFDQSxNQUFJbUIsR0FBRyxHQUFHakQsUUFBUSxDQUFDNkMsR0FBRCxDQUFSLEdBQWdCN0MsUUFBUSxDQUFDOEMsR0FBRCxDQUFsQzs7RUFDQSxNQUFHQyxNQUFNLElBQUksQ0FBYixFQUFnQjtFQUFJO0VBQ25CLFdBQU9DLElBQUksSUFBSUMsR0FBZjtFQUNBOztFQUNELFNBQU9DLElBQUksQ0FBQ0MsR0FBTCxDQUFTSCxJQUFJLEdBQUdDLEdBQWhCLEtBQXdCLENBQXhCLElBQTZCRCxJQUFJLElBQUlDLEdBQTVDO0VBQ0E7RUFFTSxTQUFTRyx1QkFBVCxDQUErQkMsTUFBL0IsRUFBdUM7RUFDN0MsU0FBT0EsTUFBTSxDQUFDQyxNQUFQLENBQWMsQ0FBZCxFQUFpQkMsV0FBakIsS0FBaUNGLE1BQU0sQ0FBQzFCLEtBQVAsQ0FBYSxDQUFiLENBQXhDO0VBQ0E7RUFHTSxTQUFTNkIsTUFBVCxDQUFnQkMsR0FBaEIsRUFBcUI7RUFDM0IsTUFBSWYsSUFBSSxHQUFHLEVBQVg7RUFDQSxNQUFJZ0IsUUFBUSxHQUFHLHNEQUFmOztFQUNBLE9BQUssSUFBSWhGLENBQUMsR0FBQyxDQUFYLEVBQWNBLENBQUMsR0FBRytFLEdBQWxCLEVBQXVCL0UsQ0FBQyxFQUF4QjtFQUNDZ0UsSUFBQUEsSUFBSSxJQUFJZ0IsUUFBUSxDQUFDSixNQUFULENBQWdCSixJQUFJLENBQUNTLEtBQUwsQ0FBV1QsSUFBSSxDQUFDVSxNQUFMLEtBQWdCRixRQUFRLENBQUMvRSxNQUFwQyxDQUFoQixDQUFSO0VBREQ7O0VBRUEsU0FBTytELElBQVA7RUFDQTtFQUVNLFNBQVNtQixTQUFULENBQW1CMUcsSUFBbkIsRUFBeUIyRyxNQUF6QixFQUFpQ0MsSUFBakMsRUFBdUNDLFlBQXZDLEVBQXFEakQsRUFBckQsRUFBeUQ7RUFDL0QsTUFBSSxRQUFPK0MsTUFBTSxDQUFDRyxRQUFkLG9CQUFKLEVBQ0NILE1BQU0sQ0FBQ0csUUFBUCxHQUFrQkMsV0FBVyxDQUFDL0csSUFBSSxDQUFDZ0MsT0FBTixFQUFlMkUsTUFBZixDQUE3Qjs7RUFFRCxNQUFJLFFBQU9FLFlBQVAsb0JBQUosRUFBOEM7RUFDN0NBLElBQUFBLFlBQVksR0FBRyxFQUFmO0VBQ0FqRCxJQUFBQSxFQUFFLEdBQUcsQ0FBTDtFQUNBOztFQUVELE1BQUlvRCxLQUFLLEdBQUdDLE9BQU8sQ0FBQ0wsSUFBRCxDQUFuQixDQVQrRDs7RUFXL0QsTUFBSU0sUUFBUSxHQUFHLEVBQWY7RUFDQWhDLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBT1IsTUFBTSxDQUFDRyxRQUFkLEVBQXdCLFVBQVN2RixDQUFULEVBQVk2RixLQUFaLEVBQW1CO0VBQzFDbEMsSUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPbkgsSUFBSSxDQUFDZ0MsT0FBWixFQUFxQixVQUFTcUYsQ0FBVCxFQUFZQyxDQUFaLEVBQWU7RUFDbkMsVUFBSSxDQUFFRixLQUFLLENBQUNwRyxJQUFOLEtBQWVzRyxDQUFDLENBQUNDLE1BQWxCLElBQThCSCxLQUFLLENBQUNwRyxJQUFOLEtBQWVzRyxDQUFDLENBQUNFLE1BQWhELEtBQTRESixLQUFLLENBQUN4RCxFQUFOLEtBQWExRCxTQUE3RSxFQUF3RjtFQUN2RixZQUFJdUgsQ0FBQyxHQUFHQyxhQUFhLENBQUNWLEtBQUQsRUFBUU0sQ0FBQyxDQUFDQyxNQUFWLENBQXJCO0VBQ0EsWUFBSUksQ0FBQyxHQUFHRCxhQUFhLENBQUNWLEtBQUQsRUFBUU0sQ0FBQyxDQUFDRSxNQUFWLENBQXJCO0VBQ0FDLFFBQUFBLENBQUMsR0FBSUEsQ0FBQyxLQUFLdkgsU0FBTixHQUFpQnVILENBQWpCLEdBQXFCQyxhQUFhLENBQUMxSCxJQUFJLENBQUNnQyxPQUFOLEVBQWVzRixDQUFDLENBQUNDLE1BQWpCLENBQXZDO0VBQ0FJLFFBQUFBLENBQUMsR0FBSUEsQ0FBQyxLQUFLekgsU0FBTixHQUFpQnlILENBQWpCLEdBQXFCRCxhQUFhLENBQUMxSCxJQUFJLENBQUNnQyxPQUFOLEVBQWVzRixDQUFDLENBQUNFLE1BQWpCLENBQXZDO0VBQ0EsWUFBRyxDQUFDSSxlQUFlLENBQUNWLFFBQUQsRUFBV08sQ0FBWCxFQUFjRSxDQUFkLENBQW5CLEVBQ0NULFFBQVEsQ0FBQ3ZGLElBQVQsQ0FBYztFQUFDLG9CQUFVOEYsQ0FBWDtFQUFjLG9CQUFVRTtFQUF4QixTQUFkO0VBQ0Q7RUFDRCxLQVREO0VBVUEsR0FYRDtFQVlBekMsRUFBQUEsQ0FBQyxDQUFDMkMsS0FBRixDQUFRaEIsWUFBUixFQUFzQkssUUFBdEI7RUFFQWhDLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBT0QsUUFBUCxFQUFpQixVQUFTM0YsQ0FBVCxFQUFZdUcsR0FBWixFQUFpQjtFQUNqQyxRQUFJUCxNQUFNLEdBQUdPLEdBQUcsQ0FBQ1AsTUFBakI7RUFDQSxRQUFJQyxNQUFNLEdBQUdNLEdBQUcsQ0FBQ04sTUFBakI7RUFDQUQsSUFBQUEsTUFBTSxDQUFDVCxRQUFQLEdBQWtCLEVBQWxCO0VBQ0EsUUFBSWlCLE1BQU0sR0FBRztFQUNYL0csTUFBQUEsSUFBSSxFQUFHcUYsTUFBTSxDQUFDLENBQUQsQ0FERjtFQUVYMkIsTUFBQUEsTUFBTSxFQUFHLElBRkU7RUFHWEQsTUFBQUEsTUFBTSxFQUFHLElBSEU7RUFJWFAsTUFBQUEsTUFBTSxFQUFHQSxNQUpFO0VBS1hELE1BQUFBLE1BQU0sRUFBR0EsTUFMRTtFQU1YVCxNQUFBQSxRQUFRLEVBQUdDLFdBQVcsQ0FBQy9HLElBQUksQ0FBQ2dDLE9BQU4sRUFBZXVGLE1BQWYsRUFBdUJDLE1BQXZCO0VBTlgsS0FBYjtFQVNBLFFBQUlTLElBQUksR0FBR0MsWUFBWSxDQUFDbEksSUFBSSxDQUFDZ0MsT0FBTixFQUFldUYsTUFBTSxDQUFDdkcsSUFBdEIsQ0FBdkI7RUFDQSxRQUFJbUgsSUFBSSxHQUFHRCxZQUFZLENBQUNsSSxJQUFJLENBQUNnQyxPQUFOLEVBQWV3RixNQUFNLENBQUN4RyxJQUF0QixDQUF2QjtFQUNBLFFBQUcsRUFBRSxRQUFRd0csTUFBVixLQUFxQixFQUFFLFFBQVFELE1BQVYsQ0FBeEIsRUFDQzNELEVBQUUsR0FBR3dFLGFBQWEsQ0FBQ3pCLE1BQU0sQ0FBQ0csUUFBUixFQUFrQmxELEVBQWxCLENBQWxCLENBaEJnQzs7RUFtQmpDLFFBQUl5RSxFQUFFLEdBQUdDLG9CQUFvQixDQUFDdEksSUFBSSxDQUFDZ0MsT0FBTixFQUFlaUcsSUFBZixFQUFxQkUsSUFBckIsQ0FBN0I7O0VBQ0EsUUFBR0UsRUFBRSxDQUFDRixJQUFILEdBQVVFLEVBQUUsQ0FBQ0osSUFBaEIsRUFBc0I7RUFDckJULE1BQUFBLE1BQU0sQ0FBQzVELEVBQVAsR0FBWUEsRUFBRSxFQUFkO0VBQ0FtRSxNQUFBQSxNQUFNLENBQUNuRSxFQUFQLEdBQVlBLEVBQUUsRUFBZDtFQUNBMkQsTUFBQUEsTUFBTSxDQUFDM0QsRUFBUCxHQUFZQSxFQUFFLEVBQWQ7RUFDQSxLQUpELE1BSU87RUFDTjJELE1BQUFBLE1BQU0sQ0FBQzNELEVBQVAsR0FBWUEsRUFBRSxFQUFkO0VBQ0FtRSxNQUFBQSxNQUFNLENBQUNuRSxFQUFQLEdBQVlBLEVBQUUsRUFBZDtFQUNBNEQsTUFBQUEsTUFBTSxDQUFDNUQsRUFBUCxHQUFZQSxFQUFFLEVBQWQ7RUFDQTs7RUFDREEsSUFBQUEsRUFBRSxHQUFHMkUsWUFBWSxDQUFDaEIsTUFBRCxFQUFTUSxNQUFULEVBQWlCbkUsRUFBakIsRUFBcUJvRCxLQUFyQixFQUE0QmhILElBQTVCLENBQWpCO0VBQ0E0RCxJQUFBQSxFQUFFLEdBQUcyRSxZQUFZLENBQUNmLE1BQUQsRUFBU08sTUFBVCxFQUFpQm5FLEVBQWpCLEVBQXFCb0QsS0FBckIsRUFBNEJoSCxJQUE1QixDQUFqQjtFQUNBMkcsSUFBQUEsTUFBTSxDQUFDRyxRQUFQLENBQWdCbkYsSUFBaEIsQ0FBcUJvRyxNQUFyQjtFQUNBLEdBaENEO0VBaUNBbkUsRUFBQUEsRUFBRSxHQUFHd0UsYUFBYSxDQUFDekIsTUFBTSxDQUFDRyxRQUFSLEVBQWtCbEQsRUFBbEIsQ0FBbEI7RUFFQXNCLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBT1IsTUFBTSxDQUFDRyxRQUFkLEVBQXdCLFVBQVN2RixDQUFULEVBQVkrRixDQUFaLEVBQWU7RUFDdEMxRCxJQUFBQSxFQUFFLEdBQUc4QyxTQUFTLENBQUMxRyxJQUFELEVBQU9zSCxDQUFQLEVBQVVWLElBQVYsRUFBZ0JDLFlBQWhCLEVBQThCakQsRUFBOUIsQ0FBVCxDQUEyQyxDQUEzQyxDQUFMO0VBQ0EsR0FGRDtFQUdBLFNBQU8sQ0FBQ2lELFlBQUQsRUFBZWpELEVBQWYsQ0FBUDtFQUNBOztFQUdELFNBQVMyRSxZQUFULENBQXNCakIsQ0FBdEIsRUFBeUJTLE1BQXpCLEVBQWlDbkUsRUFBakMsRUFBcUNvRCxLQUFyQyxFQUE0Q2hILElBQTVDLEVBQWtEO0VBQ2pEO0VBQ0EsTUFBRyxpQkFBaUJzSCxDQUFwQixFQUNDQSxDQUFDLENBQUNrQixXQUFGLENBQWM3RyxJQUFkLENBQW1Cb0csTUFBbkIsRUFERCxLQUdDVCxDQUFDLENBQUNrQixXQUFGLEdBQWdCLENBQUNULE1BQUQsQ0FBaEIsQ0FMZ0Q7O0VBUWpELE1BQUdULENBQUMsQ0FBQ21CLE1BQUYsSUFBWW5CLENBQUMsQ0FBQ29CLE9BQWpCLEVBQTBCO0VBQ3pCLFFBQUlDLEtBQUssR0FBR0MsUUFBUSxDQUFDNUksSUFBSSxDQUFDZ0MsT0FBTixFQUFlc0YsQ0FBZixDQUFwQjs7RUFDQSxTQUFJLElBQUkvRixDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUNvSCxLQUFLLENBQUNuSCxNQUFyQixFQUE2QkQsQ0FBQyxFQUE5QixFQUFrQztFQUNqQyxVQUFJc0gsSUFBSSxHQUFHbkIsYUFBYSxDQUFDVixLQUFELEVBQVEyQixLQUFLLENBQUNwSCxDQUFELENBQUwsQ0FBU1AsSUFBakIsQ0FBeEI7RUFDQSxVQUFHNkgsSUFBSCxFQUNDQSxJQUFJLENBQUNqRixFQUFMLEdBQVVBLEVBQUUsRUFBWjtFQUNEO0VBQ0Q7O0VBQ0QsU0FBT0EsRUFBUDtFQUNBOztFQUVELFNBQVN3RSxhQUFULENBQXVCdEIsUUFBdkIsRUFBaUNsRCxFQUFqQyxFQUFxQztFQUNwQztFQUNBa0QsRUFBQUEsUUFBUSxDQUFDakQsSUFBVCxDQUFjLFVBQVNDLENBQVQsRUFBWUMsQ0FBWixFQUFlO0VBQzVCLFFBQUdELENBQUMsQ0FBQzJFLE1BQUYsSUFBWTFFLENBQUMsQ0FBQzBFLE1BQWQsSUFBd0IzRSxDQUFDLENBQUMyRSxNQUFGLElBQVkxRSxDQUFDLENBQUMwRSxNQUF6QyxFQUNDLE9BQU8sQ0FBUCxDQURELEtBRUssSUFBRzNFLENBQUMsQ0FBQ2dGLE1BQUYsSUFBWS9FLENBQUMsQ0FBQytFLE1BQWQsSUFBd0JoRixDQUFDLENBQUNnRixNQUFGLElBQVkvRSxDQUFDLENBQUMrRSxNQUF6QyxFQUNKLE9BQU8sQ0FBUCxDQURJLEtBRUEsSUFBR2hGLENBQUMsQ0FBQzJFLE1BQUYsSUFBWTFFLENBQUMsQ0FBQzBFLE1BQWQsSUFBd0IzRSxDQUFDLENBQUNnRixNQUExQixJQUFvQy9FLENBQUMsQ0FBQytFLE1BQXpDLEVBQ0osT0FBTyxDQUFQO0VBQ0QsV0FBTyxDQUFQO0VBQ0EsR0FSRDtFQVVBNUQsRUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPTCxRQUFQLEVBQWlCLFVBQVN2RixDQUFULEVBQVkrRixDQUFaLEVBQWU7RUFDL0IsUUFBR0EsQ0FBQyxDQUFDMUQsRUFBRixLQUFTMUQsU0FBWixFQUF1Qm9ILENBQUMsQ0FBQzFELEVBQUYsR0FBT0EsRUFBRSxFQUFUO0VBQ3ZCLEdBRkQ7RUFHQSxTQUFPQSxFQUFQO0VBQ0E7O0VBRU0sU0FBU21GLFNBQVQsQ0FBbUI3RSxHQUFuQixFQUF3QjtFQUM5QixTQUFPLFFBQU9nQixDQUFDLENBQUNoQixHQUFELENBQUQsQ0FBTzhFLElBQVAsQ0FBWSxTQUFaLENBQVAsd0JBQXNEOUQsQ0FBQyxDQUFDaEIsR0FBRCxDQUFELENBQU84RSxJQUFQLENBQVksU0FBWixNQUEyQixLQUF4RjtFQUNBO0VBRU0sU0FBU0MsVUFBVCxDQUFvQmpILE9BQXBCLEVBQTZCaEIsSUFBN0IsRUFBbUNrSSxVQUFuQyxFQUErQztFQUNyRGhFLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBT25GLE9BQVAsRUFBZ0IsVUFBU1QsQ0FBVCxFQUFZK0YsQ0FBWixFQUFlO0VBQzlCLFFBQUl0RyxJQUFJLEtBQUtzRyxDQUFDLENBQUN0RyxJQUFmLEVBQ0NzRyxDQUFDLENBQUM2QixPQUFGLEdBQVlELFVBQVosQ0FERCxLQUdDLE9BQU81QixDQUFDLENBQUM2QixPQUFUO0VBQ0QsR0FMRDtFQU1BOztFQUdELFNBQVNDLGFBQVQsQ0FBdUJDLElBQXZCLEVBQTZCQyxJQUE3QixFQUFtQztFQUNsQyxPQUFJLElBQUkvSCxDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUMrSCxJQUFJLENBQUM5SCxNQUFwQixFQUE0QkQsQ0FBQyxFQUE3QjtFQUNDLFFBQUcyRCxDQUFDLENBQUNxRSxPQUFGLENBQVdELElBQUksQ0FBQy9ILENBQUQsQ0FBZixFQUFvQjhILElBQXBCLEtBQThCLENBQUMsQ0FBbEMsRUFBcUNBLElBQUksQ0FBQzFILElBQUwsQ0FBVTJILElBQUksQ0FBQy9ILENBQUQsQ0FBZDtFQUR0QztFQUVBOztFQUVELFNBQVNpSSxnQkFBVCxDQUEwQkMsU0FBMUIsRUFBcUNuQyxDQUFyQyxFQUF3Q3RGLE9BQXhDLEVBQWlEO0VBQ2hELE1BQUdrRCxDQUFDLENBQUNxRSxPQUFGLENBQVdqQyxDQUFDLENBQUN0RyxJQUFiLEVBQW1CeUksU0FBbkIsS0FBa0MsQ0FBQyxDQUF0QyxFQUNDO0VBQ0RMLEVBQUFBLGFBQWEsQ0FBQ0ssU0FBRCxFQUFZQyxZQUFZLENBQUMxSCxPQUFELEVBQVVzRixDQUFWLENBQXhCLENBQWI7RUFDQSxNQUFJUixRQUFRLEdBQUc2QyxjQUFjLENBQUMzSCxPQUFELEVBQVVzRixDQUFWLENBQTdCO0VBQ0FwQyxFQUFBQSxDQUFDLENBQUNpQyxJQUFGLENBQU9MLFFBQVAsRUFBaUIsVUFBVThDLFNBQVYsRUFBcUJ4QyxLQUFyQixFQUE2QjtFQUM3QyxRQUFHbEMsQ0FBQyxDQUFDcUUsT0FBRixDQUFXbkMsS0FBSyxDQUFDcEcsSUFBakIsRUFBdUJ5SSxTQUF2QixLQUFzQyxDQUFDLENBQTFDLEVBQTZDO0VBQzVDQSxNQUFBQSxTQUFTLENBQUM5SCxJQUFWLENBQWV5RixLQUFLLENBQUNwRyxJQUFyQjtFQUNBb0ksTUFBQUEsYUFBYSxDQUFDSyxTQUFELEVBQVlDLFlBQVksQ0FBQzFILE9BQUQsRUFBVW9GLEtBQVYsQ0FBeEIsQ0FBYjtFQUNBO0VBQ0QsR0FMRDtFQU1BOzs7RUFHTSxTQUFTc0MsWUFBVCxDQUFzQjFILE9BQXRCLEVBQStCNkgsS0FBL0IsRUFBc0M7RUFDNUMsTUFBSUMsSUFBSSxHQUFHLEVBQVg7O0VBQ0EsT0FBSSxJQUFJdkksQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDUyxPQUFPLENBQUNSLE1BQXZCLEVBQStCRCxDQUFDLEVBQWhDLEVBQW9DO0VBQ25DLFFBQUl3SSxLQUFLLEdBQUcvSCxPQUFPLENBQUNULENBQUQsQ0FBbkI7RUFDQSxRQUFHc0ksS0FBSyxDQUFDN0ksSUFBTixLQUFlK0ksS0FBSyxDQUFDeEMsTUFBckIsSUFBK0JyQyxDQUFDLENBQUNxRSxPQUFGLENBQVVRLEtBQUssQ0FBQ3ZDLE1BQWhCLEVBQXdCc0MsSUFBeEIsS0FBaUMsQ0FBQyxDQUFwRSxFQUNDQSxJQUFJLENBQUNuSSxJQUFMLENBQVVvSSxLQUFLLENBQUN2QyxNQUFoQixFQURELEtBRUssSUFBR3FDLEtBQUssQ0FBQzdJLElBQU4sS0FBZStJLEtBQUssQ0FBQ3ZDLE1BQXJCLElBQStCdEMsQ0FBQyxDQUFDcUUsT0FBRixDQUFVUSxLQUFLLENBQUN4QyxNQUFoQixFQUF3QnVDLElBQXhCLEtBQWlDLENBQUMsQ0FBcEUsRUFDSkEsSUFBSSxDQUFDbkksSUFBTCxDQUFVb0ksS0FBSyxDQUFDeEMsTUFBaEI7RUFDRDs7RUFDRCxTQUFPdUMsSUFBUDtFQUNBOztFQUdNLFNBQVNFLFdBQVQsQ0FBcUJoSSxPQUFyQixFQUE2QjtFQUNuQyxNQUFJaUksTUFBTSxHQUFHakksT0FBTyxDQUFFa0ksZUFBZSxDQUFDbEksT0FBRCxDQUFqQixDQUFwQjs7RUFDQSxNQUFHLENBQUNpSSxNQUFKLEVBQVc7RUFDVjlILElBQUFBLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLG1CQUFiOztFQUNBLFFBQUdKLE9BQU8sQ0FBQ1IsTUFBUixJQUFrQixDQUFyQixFQUF3QjtFQUN2QixZQUFNLHlCQUFOO0VBQ0E7O0VBQ0R5SSxJQUFBQSxNQUFNLEdBQUdqSSxPQUFPLENBQUMsQ0FBRCxDQUFoQjtFQUNBOztFQUNELE1BQUl5SCxTQUFTLEdBQUcsQ0FBQ1EsTUFBTSxDQUFDakosSUFBUixDQUFoQjtFQUNBLE1BQUltSixNQUFNLEdBQUcsSUFBYjtFQUNBLE1BQUlDLEVBQUUsR0FBRyxDQUFUOztFQUNBLFNBQU1ELE1BQU0sSUFBSUMsRUFBRSxHQUFHLEdBQXJCLEVBQTBCO0VBQ3pCQSxJQUFBQSxFQUFFO0VBQ0YsUUFBSUMsUUFBUSxHQUFHWixTQUFTLENBQUNqSSxNQUF6QjtFQUNBMEQsSUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPbkYsT0FBUCxFQUFnQixVQUFVc0ksR0FBVixFQUFlaEQsQ0FBZixFQUFtQjtFQUNsQyxVQUFHcEMsQ0FBQyxDQUFDcUUsT0FBRixDQUFXakMsQ0FBQyxDQUFDdEcsSUFBYixFQUFtQnlJLFNBQW5CLEtBQWtDLENBQUMsQ0FBdEMsRUFBeUM7RUFDeEM7RUFDQSxZQUFJSyxJQUFJLEdBQUdKLFlBQVksQ0FBQzFILE9BQUQsRUFBVXNGLENBQVYsQ0FBdkI7RUFDQSxZQUFJaUQsVUFBVSxHQUFJakQsQ0FBQyxDQUFDdEcsSUFBRixLQUFXaUosTUFBTSxDQUFDakosSUFBbEIsSUFBMEIsQ0FBQ3NHLENBQUMsQ0FBQ2tELFNBQS9DOztFQUNBLGFBQUksSUFBSWpKLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ3VJLElBQUksQ0FBQ3RJLE1BQXBCLEVBQTRCRCxDQUFDLEVBQTdCLEVBQWdDO0VBQy9CLGNBQUcsQ0FBQ21HLGFBQWEsQ0FBQzFGLE9BQUQsRUFBVThILElBQUksQ0FBQ3ZJLENBQUQsQ0FBZCxDQUFiLENBQWdDaUosU0FBcEMsRUFDQ0QsVUFBVSxHQUFHLElBQWI7RUFDRDs7RUFFRCxZQUFHQSxVQUFILEVBQWM7RUFDYixjQUFHakQsQ0FBQyxDQUFDQyxNQUFGLElBQVlyQyxDQUFDLENBQUNxRSxPQUFGLENBQVdqQyxDQUFDLENBQUNDLE1BQWIsRUFBcUJrQyxTQUFyQixLQUFvQyxDQUFDLENBQXBELEVBQ0NBLFNBQVMsQ0FBQzlILElBQVYsQ0FBZTJGLENBQUMsQ0FBQ0MsTUFBakI7RUFDRCxjQUFHRCxDQUFDLENBQUNFLE1BQUYsSUFBWXRDLENBQUMsQ0FBQ3FFLE9BQUYsQ0FBV2pDLENBQUMsQ0FBQ0UsTUFBYixFQUFxQmlDLFNBQXJCLEtBQW9DLENBQUMsQ0FBcEQsRUFDQ0EsU0FBUyxDQUFDOUgsSUFBVixDQUFlMkYsQ0FBQyxDQUFDRSxNQUFqQjtFQUNEO0VBQ0QsT0FmRCxNQWVPLElBQUksQ0FBQ0YsQ0FBQyxDQUFDa0QsU0FBSCxLQUNMbEQsQ0FBQyxDQUFDQyxNQUFGLElBQVlyQyxDQUFDLENBQUNxRSxPQUFGLENBQVdqQyxDQUFDLENBQUNDLE1BQWIsRUFBcUJrQyxTQUFyQixLQUFvQyxDQUFDLENBQWxELElBQ0NuQyxDQUFDLENBQUNFLE1BQUYsSUFBWXRDLENBQUMsQ0FBQ3FFLE9BQUYsQ0FBV2pDLENBQUMsQ0FBQ0UsTUFBYixFQUFxQmlDLFNBQXJCLEtBQW9DLENBQUMsQ0FGNUMsQ0FBSixFQUVvRDtFQUMxREEsUUFBQUEsU0FBUyxDQUFDOUgsSUFBVixDQUFlMkYsQ0FBQyxDQUFDdEcsSUFBakI7RUFDQSxPQXBCaUM7OztFQXNCbEN3SSxNQUFBQSxnQkFBZ0IsQ0FBQ0MsU0FBRCxFQUFZbkMsQ0FBWixFQUFldEYsT0FBZixDQUFoQjtFQUNBLEtBdkJEO0VBd0JBbUksSUFBQUEsTUFBTSxHQUFJRSxRQUFRLElBQUlaLFNBQVMsQ0FBQ2pJLE1BQWhDO0VBQ0E7O0VBQ0QsTUFBSWlKLEtBQUssR0FBR3ZGLENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTTFJLE9BQU4sRUFBZSxVQUFTMkksR0FBVCxFQUFjQyxFQUFkLEVBQWlCO0VBQUMsV0FBT0QsR0FBRyxDQUFDM0osSUFBWDtFQUFpQixHQUFsRCxDQUFaO0VBQ0EsU0FBT2tFLENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTUQsS0FBTixFQUFhLFVBQVN6SixJQUFULEVBQWU0SixFQUFmLEVBQWtCO0VBQUMsV0FBTzFGLENBQUMsQ0FBQ3FFLE9BQUYsQ0FBVXZJLElBQVYsRUFBZ0J5SSxTQUFoQixLQUE4QixDQUFDLENBQS9CLEdBQW1DekksSUFBbkMsR0FBMEMsSUFBakQ7RUFBdUQsR0FBdkYsQ0FBUDtFQUNBO0VBRU0sU0FBU2tKLGVBQVQsQ0FBeUJsSSxPQUF6QixFQUFrQztFQUN4QyxNQUFJbUgsT0FBSjtFQUNBakUsRUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPbkYsT0FBUCxFQUFnQixVQUFTVCxDQUFULEVBQVlvSixHQUFaLEVBQWlCO0VBQ2hDLFFBQUk1QixTQUFTLENBQUM0QixHQUFELENBQWIsRUFBb0I7RUFDbkJ4QixNQUFBQSxPQUFPLEdBQUc1SCxDQUFWO0VBQ0EsYUFBTzRILE9BQVA7RUFDQTtFQUNELEdBTEQ7RUFNQSxTQUFPQSxPQUFQO0VBQ0E7RUFFTSxTQUFTcEMsV0FBVCxDQUFxQi9FLE9BQXJCLEVBQThCdUYsTUFBOUIsRUFBc0NDLE1BQXRDLEVBQThDO0VBQ3BELE1BQUlWLFFBQVEsR0FBRyxFQUFmO0VBQ0EsTUFBSTJELEtBQUssR0FBRyxFQUFaO0VBQ0EsTUFBR2xELE1BQU0sQ0FBQ3NELEdBQVAsS0FBZSxHQUFsQixFQUNDM0YsQ0FBQyxDQUFDaUMsSUFBRixDQUFPbkYsT0FBUCxFQUFnQixVQUFTVCxDQUFULEVBQVkrRixDQUFaLEVBQWU7RUFDOUIsUUFBR0MsTUFBTSxDQUFDdkcsSUFBUCxLQUFnQnNHLENBQUMsQ0FBQ0MsTUFBckIsRUFDQyxJQUFHLENBQUNDLE1BQUQsSUFBV0EsTUFBTSxDQUFDeEcsSUFBUCxJQUFlc0csQ0FBQyxDQUFDRSxNQUEvQixFQUF1QztFQUN0QyxVQUFHdEMsQ0FBQyxDQUFDcUUsT0FBRixDQUFVakMsQ0FBQyxDQUFDdEcsSUFBWixFQUFrQnlKLEtBQWxCLE1BQTZCLENBQUMsQ0FBakMsRUFBbUM7RUFDbEMzRCxRQUFBQSxRQUFRLENBQUNuRixJQUFULENBQWMyRixDQUFkO0VBQ0FtRCxRQUFBQSxLQUFLLENBQUM5SSxJQUFOLENBQVcyRixDQUFDLENBQUN0RyxJQUFiO0VBQ0E7RUFDRDtFQUNGLEdBUkQ7RUFTRCxTQUFPOEYsUUFBUDtFQUNBOztFQUVELFNBQVNjLGVBQVQsQ0FBeUJsRixHQUF6QixFQUE4QitFLENBQTlCLEVBQWlDRSxDQUFqQyxFQUFvQztFQUNuQyxPQUFJLElBQUlwRyxDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUNtQixHQUFHLENBQUNsQixNQUFuQixFQUEyQkQsQ0FBQyxFQUE1QjtFQUNDLFFBQUdtQixHQUFHLENBQUNuQixDQUFELENBQUgsQ0FBT2dHLE1BQVAsS0FBa0JFLENBQWxCLElBQXVCL0UsR0FBRyxDQUFDbkIsQ0FBRCxDQUFILENBQU9pRyxNQUFQLEtBQWtCRyxDQUE1QyxFQUNDLE9BQU8sSUFBUDtFQUZGOztFQUdBLFNBQU8sS0FBUDtFQUNBO0VBR0Q7OztFQUNPLFNBQVNtRCxXQUFULENBQXFCOUksT0FBckIsRUFBOEIyRSxNQUE5QixFQUFzQ2tFLEdBQXRDLEVBQTJDO0VBQ2pELE1BQUdsRSxNQUFNLEtBQUt6RyxTQUFYLElBQXdCLENBQUN5RyxNQUFNLENBQUNZLE1BQWhDLElBQTBDWixNQUFNLENBQUM2RCxTQUFwRCxFQUNDLE9BQU8sRUFBUDtFQUVELFNBQU90RixDQUFDLENBQUN3RixHQUFGLENBQU0xSSxPQUFOLEVBQWUsVUFBU3NGLENBQVQsRUFBWXNELEVBQVosRUFBZTtFQUNwQyxXQUFRdEQsQ0FBQyxDQUFDdEcsSUFBRixLQUFXMkYsTUFBTSxDQUFDM0YsSUFBbEIsSUFBMEIsRUFBRSxlQUFlc0csQ0FBakIsQ0FBMUIsSUFBaURBLENBQUMsQ0FBQ0MsTUFBbkQsSUFDSEQsQ0FBQyxDQUFDQyxNQUFGLEtBQWFaLE1BQU0sQ0FBQ1ksTUFBcEIsSUFBOEJELENBQUMsQ0FBQ0UsTUFBRixLQUFhYixNQUFNLENBQUNhLE1BRC9DLEtBRUgsQ0FBQ3FELEdBQUQsSUFBUXZELENBQUMsQ0FBQ3VELEdBQUYsSUFBU0EsR0FGZCxJQUVxQnZELENBRnJCLEdBRXlCLElBRmpDO0VBR0EsR0FKTSxDQUFQO0VBS0E7O0VBR00sU0FBU3lELGNBQVQsQ0FBd0IvSSxPQUF4QixFQUFpQzJFLE1BQWpDLEVBQXlDa0UsR0FBekMsRUFBOEM7RUFDcEQsU0FBTzNGLENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTTFJLE9BQU4sRUFBZSxVQUFTc0YsQ0FBVCxFQUFZc0QsRUFBWixFQUFlO0VBQ3BDLFdBQVF0RCxDQUFDLENBQUN0RyxJQUFGLEtBQVcyRixNQUFNLENBQUMzRixJQUFsQixJQUEwQixFQUFFLGVBQWVzRyxDQUFqQixDQUExQixJQUFpREEsQ0FBQyxDQUFDQyxNQUFuRCxJQUNIRCxDQUFDLENBQUNDLE1BQUYsS0FBYVosTUFBTSxDQUFDWSxNQUFwQixJQUE4QkQsQ0FBQyxDQUFDRSxNQUFGLEtBQWFiLE1BQU0sQ0FBQ2EsTUFEL0MsS0FFSCxDQUFDcUQsR0FBRCxJQUFRdkQsQ0FBQyxDQUFDdUQsR0FBRixJQUFTQSxHQUZkLElBRXFCdkQsQ0FGckIsR0FFeUIsSUFGakM7RUFHQSxHQUpNLENBQVA7RUFLQTs7RUFHTSxTQUFTc0IsUUFBVCxDQUFrQjVHLE9BQWxCLEVBQTJCMkUsTUFBM0IsRUFBbUM7RUFDekMsTUFBSXFFLElBQUksR0FBR0YsV0FBVyxDQUFDOUksT0FBRCxFQUFVMkUsTUFBVixDQUF0QjtFQUNBLE1BQUlzRSxTQUFTLEdBQUl0RSxNQUFNLENBQUM4QixNQUFQLEdBQWdCLFFBQWhCLEdBQTJCLFFBQTVDO0VBQ0EsU0FBT3ZELENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTU0sSUFBTixFQUFZLFVBQVMxRCxDQUFULEVBQVlzRCxFQUFaLEVBQWU7RUFDakMsV0FBT3RELENBQUMsQ0FBQ3RHLElBQUYsS0FBVzJGLE1BQU0sQ0FBQzNGLElBQWxCLElBQTBCc0csQ0FBQyxDQUFDMkQsU0FBRCxDQUFELElBQWdCdEUsTUFBTSxDQUFDc0UsU0FBRCxDQUFoRCxHQUE4RDNELENBQTlELEdBQWtFLElBQXpFO0VBQ0EsR0FGTSxDQUFQO0VBR0E7O0VBR00sU0FBUzRELGtCQUFULENBQTRCbEosT0FBNUIsRUFBcUMyRSxNQUFyQyxFQUE2QztFQUNuRCxTQUFPekIsQ0FBQyxDQUFDd0YsR0FBRixDQUFNMUksT0FBTixFQUFlLFVBQVNzRixDQUFULEVBQVlzRCxFQUFaLEVBQWU7RUFDcEMsV0FBUXRELENBQUMsQ0FBQ3RHLElBQUYsS0FBVzJGLE1BQU0sQ0FBQzNGLElBQWxCLElBQTBCLGVBQWVzRyxDQUF6QyxJQUNIQSxDQUFDLENBQUNDLE1BQUYsS0FBYVosTUFBTSxDQUFDWSxNQUFwQixJQUE4QkQsQ0FBQyxDQUFDRSxNQUFGLEtBQWFiLE1BQU0sQ0FBQ2EsTUFEL0MsR0FDeURGLENBRHpELEdBQzZELElBRHJFO0VBRUEsR0FITSxDQUFQO0VBSUE7RUFFTSxTQUFTcUMsY0FBVCxDQUF3QjNILE9BQXhCLEVBQWlDMkUsTUFBakMsRUFBeUNrRSxHQUF6QyxFQUE4QztFQUNwRCxTQUFPM0YsQ0FBQyxDQUFDd0YsR0FBRixDQUFNMUksT0FBTixFQUFlLFVBQVNzRixDQUFULEVBQVlzRCxFQUFaLEVBQWU7RUFDcEMsV0FBTyxFQUFFLGVBQWV0RCxDQUFqQixNQUNGQSxDQUFDLENBQUNDLE1BQUYsS0FBYVosTUFBTSxDQUFDM0YsSUFBcEIsSUFBNEJzRyxDQUFDLENBQUNFLE1BQUYsS0FBYWIsTUFBTSxDQUFDM0YsSUFEOUMsTUFFRixDQUFDNkosR0FBRCxJQUFRdkQsQ0FBQyxDQUFDdUQsR0FBRixLQUFVQSxHQUZoQixJQUV1QnZELENBRnZCLEdBRTJCLElBRmxDO0VBR0EsR0FKTSxDQUFQO0VBS0E7O0VBR00sU0FBUzZELFFBQVQsQ0FBa0JuSixPQUFsQixFQUEyQmhCLElBQTNCLEVBQWlDO0VBQ3ZDLE1BQUlzSixHQUFHLEdBQUdwQyxZQUFZLENBQUNsRyxPQUFELEVBQVVoQixJQUFWLENBQXRCO0VBQ0EsTUFBSW9LLEtBQUssR0FBRyxDQUFaOztFQUVBLFNBQU1kLEdBQUcsSUFBSSxDQUFQLEtBQWEsWUFBWXRJLE9BQU8sQ0FBQ3NJLEdBQUQsQ0FBbkIsSUFBNEJ0SSxPQUFPLENBQUNzSSxHQUFELENBQVAsQ0FBYWUsU0FBdEQsQ0FBTixFQUF1RTtFQUN0RWYsSUFBQUEsR0FBRyxHQUFHcEMsWUFBWSxDQUFDbEcsT0FBRCxFQUFVQSxPQUFPLENBQUNzSSxHQUFELENBQVAsQ0FBYS9DLE1BQXZCLENBQWxCO0VBQ0E2RCxJQUFBQSxLQUFLO0VBQ0w7O0VBQ0QsU0FBT0EsS0FBUDtFQUNBOztFQUdNLFNBQVNsRCxZQUFULENBQXNCeEYsR0FBdEIsRUFBMkIxQixJQUEzQixFQUFpQztFQUN2QyxNQUFJc0osR0FBRyxHQUFHLENBQUMsQ0FBWDtFQUNBcEYsRUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPekUsR0FBUCxFQUFZLFVBQVNuQixDQUFULEVBQVkrRixDQUFaLEVBQWU7RUFDMUIsUUFBSXRHLElBQUksS0FBS3NHLENBQUMsQ0FBQ3RHLElBQWYsRUFBcUI7RUFDcEJzSixNQUFBQSxHQUFHLEdBQUcvSSxDQUFOO0VBQ0EsYUFBTytJLEdBQVA7RUFDQTtFQUNELEdBTEQ7RUFNQSxTQUFPQSxHQUFQO0VBQ0E7O0VBR00sU0FBU2dCLGVBQVQsQ0FBeUJDLE1BQXpCLEVBQWlDSCxLQUFqQyxFQUF3Q0ksYUFBeEMsRUFBdUQ7RUFDN0QsU0FBT3RHLENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTWEsTUFBTixFQUFjLFVBQVNqRSxDQUFULEVBQVlzRCxFQUFaLEVBQWU7RUFDbkMsV0FBT3RELENBQUMsQ0FBQzhELEtBQUYsSUFBV0EsS0FBWCxJQUFvQixDQUFDOUQsQ0FBQyxDQUFDbUUsSUFBRixDQUFPekQsTUFBNUIsSUFBc0M5QyxDQUFDLENBQUNxRSxPQUFGLENBQVVqQyxDQUFDLENBQUNtRSxJQUFGLENBQU96SyxJQUFqQixFQUF1QndLLGFBQXZCLEtBQXlDLENBQUMsQ0FBaEYsR0FBb0ZsRSxDQUFwRixHQUF3RixJQUEvRjtFQUNBLEdBRk0sRUFFSnpELElBRkksQ0FFQyxVQUFVQyxDQUFWLEVBQVlDLENBQVosRUFBZTtFQUFDLFdBQU9ELENBQUMsQ0FBQ2YsQ0FBRixHQUFNZ0IsQ0FBQyxDQUFDaEIsQ0FBZjtFQUFrQixHQUZuQyxDQUFQO0VBR0E7O0VBR00sU0FBUzJJLFNBQVQsQ0FBbUJDLFlBQW5CLEVBQWlDekUsUUFBakMsRUFBMkM7RUFDakQsTUFBSTBFLEtBQUssR0FBRyxFQUFaOztFQUNBLE9BQUksSUFBSXJLLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBRTJGLFFBQVEsQ0FBQzFGLE1BQXpCLEVBQWlDRCxDQUFDLEVBQWxDO0VBQ0NxSyxJQUFBQSxLQUFLLENBQUNqSyxJQUFOLENBQVc7RUFBQyxnQkFBVStGLGFBQWEsQ0FBQ2lFLFlBQUQsRUFBZXpFLFFBQVEsQ0FBQzNGLENBQUQsQ0FBUixDQUFZZ0csTUFBWixDQUFtQnZHLElBQWxDLENBQXhCO0VBQ1IsZ0JBQVUwRyxhQUFhLENBQUNpRSxZQUFELEVBQWV6RSxRQUFRLENBQUMzRixDQUFELENBQVIsQ0FBWWlHLE1BQVosQ0FBbUJ4RyxJQUFsQztFQURmLEtBQVg7RUFERDs7RUFHQSxTQUFPNEssS0FBUDtFQUNBOztFQUdNLFNBQVNDLFNBQVQsQ0FBbUI3SixPQUFuQixFQUE0QjhKLElBQTVCLEVBQWtDO0VBQ3hDLE1BQUlELFNBQVMsR0FBRyxFQUFoQjs7RUFDQSxXQUFTRSxPQUFULENBQWlCRCxJQUFqQixFQUF1QjtFQUN0QixRQUFHQSxJQUFJLENBQUNMLElBQVIsRUFBY0ssSUFBSSxHQUFHQSxJQUFJLENBQUNMLElBQVo7O0VBQ2QsUUFBRyxZQUFZSyxJQUFaLElBQW9CLFlBQVlBLElBQWhDLElBQXdDLEVBQUUsZUFBZUEsSUFBakIsQ0FBM0MsRUFBa0U7RUFDakVDLE1BQUFBLE9BQU8sQ0FBQ3JFLGFBQWEsQ0FBQzFGLE9BQUQsRUFBVThKLElBQUksQ0FBQ3ZFLE1BQWYsQ0FBZCxDQUFQO0VBQ0F3RSxNQUFBQSxPQUFPLENBQUNyRSxhQUFhLENBQUMxRixPQUFELEVBQVU4SixJQUFJLENBQUN0RSxNQUFmLENBQWQsQ0FBUDtFQUNBOztFQUNEcUUsSUFBQUEsU0FBUyxDQUFDbEssSUFBVixDQUFlbUssSUFBZjtFQUNBOztFQUNEQyxFQUFBQSxPQUFPLENBQUNELElBQUQsQ0FBUDtFQUNBLFNBQU9ELFNBQVA7RUFDQTs7RUFHTSxTQUFTRyxXQUFULENBQXFCQyxLQUFyQixFQUE0QkMsS0FBNUIsRUFBbUNsTSxJQUFuQyxFQUF5QztFQUMvQyxNQUFHaU0sS0FBSyxDQUFDYixLQUFOLEtBQWdCYyxLQUFLLENBQUNkLEtBQXpCO0VBQ0MsV0FBTyxJQUFQO0VBQ0QsTUFBSWUsVUFBVSxHQUFHTixTQUFTLENBQUM3TCxJQUFJLENBQUNnQyxPQUFOLEVBQWVpSyxLQUFmLENBQTFCO0VBQ0EsTUFBSUcsVUFBVSxHQUFHUCxTQUFTLENBQUM3TCxJQUFJLENBQUNnQyxPQUFOLEVBQWVrSyxLQUFmLENBQTFCO0VBQ0EsTUFBSUcsTUFBTSxHQUFHbkgsQ0FBQyxDQUFDd0YsR0FBRixDQUFNeUIsVUFBTixFQUFrQixVQUFTRyxRQUFULEVBQW1CMUIsRUFBbkIsRUFBc0I7RUFBQyxXQUFPMEIsUUFBUSxDQUFDdEwsSUFBaEI7RUFBc0IsR0FBL0QsQ0FBYjtFQUNBLE1BQUl1TCxNQUFNLEdBQUdySCxDQUFDLENBQUN3RixHQUFGLENBQU0wQixVQUFOLEVBQWtCLFVBQVNFLFFBQVQsRUFBbUIxQixFQUFuQixFQUFzQjtFQUFDLFdBQU8wQixRQUFRLENBQUN0TCxJQUFoQjtFQUFzQixHQUEvRCxDQUFiO0VBQ0EsTUFBSWdMLFdBQVcsR0FBRyxLQUFsQjtFQUNBOUcsRUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPa0YsTUFBUCxFQUFlLFVBQVVHLEtBQVYsRUFBaUJ4TCxJQUFqQixFQUF3QjtFQUN0QyxRQUFHa0UsQ0FBQyxDQUFDcUUsT0FBRixDQUFVdkksSUFBVixFQUFnQnVMLE1BQWhCLE1BQTRCLENBQUMsQ0FBaEMsRUFBa0M7RUFDakNQLE1BQUFBLFdBQVcsR0FBRyxJQUFkO0VBQ0EsYUFBTyxLQUFQO0VBQ0E7RUFDRCxHQUxEO0VBTUEsU0FBT0EsV0FBUDtFQUNBOztFQUdNLFNBQVMvRSxPQUFULENBQWlCTCxJQUFqQixFQUF1QjtFQUM3QixNQUFJNkYsSUFBSSxHQUFHLEVBQVg7O0VBQ0EsV0FBU1YsT0FBVCxDQUFpQkQsSUFBakIsRUFBdUI7RUFDdEIsUUFBR0EsSUFBSSxDQUFDaEYsUUFBUixFQUNDZ0YsSUFBSSxDQUFDaEYsUUFBTCxDQUFjNEYsT0FBZCxDQUFzQlgsT0FBdEI7RUFDRFUsSUFBQUEsSUFBSSxDQUFDOUssSUFBTCxDQUFVbUssSUFBVjtFQUNBOztFQUNEQyxFQUFBQSxPQUFPLENBQUNuRixJQUFELENBQVA7RUFDQSxTQUFPNkYsSUFBUDtFQUNBO0VBR0Q7RUFDQTs7RUFDTyxTQUFTRSxhQUFULENBQXVCM00sSUFBdkIsRUFBNkI0RyxJQUE3QixFQUFtQytFLFlBQW5DLEVBQWlEO0VBQ3ZELFdBQVNJLE9BQVQsQ0FBaUJELElBQWpCLEVBQXVCO0VBQ3RCLFFBQUlBLElBQUksQ0FBQ2hGLFFBQVQsRUFBbUI7RUFDbEJnRixNQUFBQSxJQUFJLENBQUNoRixRQUFMLENBQWM0RixPQUFkLENBQXNCWCxPQUF0Qjs7RUFFQSxVQUFHRCxJQUFJLENBQUNMLElBQUwsQ0FBVWpFLE1BQVYsS0FBcUJ0SCxTQUF4QixFQUFtQztFQUFHO0VBQ3JDLFlBQUlzSCxNQUFNLEdBQUdFLGFBQWEsQ0FBQ2lFLFlBQUQsRUFBZUcsSUFBSSxDQUFDTCxJQUFMLENBQVVqRSxNQUFWLENBQWlCeEcsSUFBaEMsQ0FBMUI7RUFDQSxZQUFJdUcsTUFBTSxHQUFHRyxhQUFhLENBQUNpRSxZQUFELEVBQWVHLElBQUksQ0FBQ0wsSUFBTCxDQUFVbEUsTUFBVixDQUFpQnZHLElBQWhDLENBQTFCO0VBQ0EsWUFBSTRMLElBQUksR0FBRyxDQUFDcEYsTUFBTSxDQUFDekUsQ0FBUCxHQUFXd0UsTUFBTSxDQUFDeEUsQ0FBbkIsSUFBdUIsQ0FBbEM7O0VBQ0EsWUFBRyxDQUFDOEosT0FBTyxDQUFDN00sSUFBRCxFQUFPNEcsSUFBSSxDQUFDa0csV0FBTCxFQUFQLEVBQTJCRixJQUEzQixFQUFpQ2QsSUFBSSxDQUFDVixLQUF0QyxFQUE2QyxDQUFDVSxJQUFJLENBQUNMLElBQUwsQ0FBVXpLLElBQVgsQ0FBN0MsQ0FBWCxFQUEyRTtFQUMxRThLLFVBQUFBLElBQUksQ0FBQy9JLENBQUwsR0FBUzZKLElBQVQsQ0FEMEU7O0VBRTFFLGNBQUlHLElBQUksR0FBR2pCLElBQUksQ0FBQy9JLENBQUwsR0FBUzZKLElBQXBCOztFQUNBLGNBQUdkLElBQUksQ0FBQ2hGLFFBQUwsQ0FBY3RGLE1BQWQsSUFBd0IsQ0FBeEIsS0FBOEJzSyxJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxFQUFpQjJFLElBQWpCLENBQXNCekQsTUFBdEIsSUFBZ0M4RCxJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxFQUFpQjJFLElBQWpCLENBQXNCekQsTUFBcEYsQ0FBSCxFQUFnRztFQUMvRixnQkFBRyxFQUFFOEQsSUFBSSxDQUFDaEYsUUFBTCxDQUFjLENBQWQsRUFBaUIyRSxJQUFqQixDQUFzQnpELE1BQXRCLElBQWdDOEQsSUFBSSxDQUFDaEYsUUFBTCxDQUFjLENBQWQsRUFBaUIyRSxJQUFqQixDQUFzQnpELE1BQXhELENBQUgsRUFBb0U7RUFDbkUsa0JBQUlnRixNQUFNLEdBQUlsQixJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxFQUFpQjJFLElBQWpCLENBQXNCekQsTUFBdEIsR0FBK0I4RCxJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxDQUEvQixHQUFrRGdGLElBQUksQ0FBQ2hGLFFBQUwsQ0FBYyxDQUFkLENBQWhFO0VBQ0Esa0JBQUltRyxNQUFNLEdBQUluQixJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxFQUFpQjJFLElBQWpCLENBQXNCekQsTUFBdEIsR0FBK0I4RCxJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxDQUEvQixHQUFrRGdGLElBQUksQ0FBQ2hGLFFBQUwsQ0FBYyxDQUFkLENBQWhFOztFQUNBLGtCQUFJLENBQUVrRyxNQUFNLENBQUNqSyxDQUFQLEdBQVdrSyxNQUFNLENBQUNsSyxDQUFsQixJQUF1QjZKLElBQUksR0FBR0ssTUFBTSxDQUFDbEssQ0FBdEMsSUFBNkNpSyxNQUFNLENBQUNqSyxDQUFQLEdBQVdrSyxNQUFNLENBQUNsSyxDQUFsQixJQUF1QjZKLElBQUksR0FBR0ssTUFBTSxDQUFDbEssQ0FBbkYsS0FDSCxDQUFDOEosT0FBTyxDQUFDN00sSUFBRCxFQUFPNEcsSUFBSSxDQUFDa0csV0FBTCxFQUFQLEVBQTJCRixJQUEzQixFQUFpQ0ksTUFBTSxDQUFDNUIsS0FBeEMsRUFBK0MsQ0FBQzRCLE1BQU0sQ0FBQ3ZCLElBQVAsQ0FBWXpLLElBQWIsQ0FBL0MsQ0FEVCxFQUM0RTtFQUMzRWdNLGdCQUFBQSxNQUFNLENBQUNqSyxDQUFQLEdBQVc2SixJQUFYO0VBQ0E7RUFDRDtFQUNELFdBVEQsTUFTTyxJQUFHZCxJQUFJLENBQUNoRixRQUFMLENBQWN0RixNQUFkLElBQXdCLENBQXhCLElBQTZCLENBQUNzSyxJQUFJLENBQUNoRixRQUFMLENBQWMsQ0FBZCxFQUFpQjJFLElBQWpCLENBQXNCekQsTUFBdkQsRUFBK0Q7RUFDckUsZ0JBQUcsQ0FBQzZFLE9BQU8sQ0FBQzdNLElBQUQsRUFBTzRHLElBQUksQ0FBQ2tHLFdBQUwsRUFBUCxFQUEyQkYsSUFBM0IsRUFBaUNkLElBQUksQ0FBQ2hGLFFBQUwsQ0FBYyxDQUFkLEVBQWlCc0UsS0FBbEQsRUFBeUQsQ0FBQ1UsSUFBSSxDQUFDaEYsUUFBTCxDQUFjLENBQWQsRUFBaUIyRSxJQUFqQixDQUFzQnpLLElBQXZCLENBQXpELENBQVgsRUFDQzhLLElBQUksQ0FBQ2hGLFFBQUwsQ0FBYyxDQUFkLEVBQWlCL0QsQ0FBakIsR0FBcUI2SixJQUFyQjtFQUNELFdBSE0sTUFHQTtFQUNOLGdCQUFHRyxJQUFJLEtBQUssQ0FBVCxJQUFjLENBQUNHLFlBQVksQ0FBQ2xOLElBQUQsRUFBTzhMLElBQVAsRUFBYWlCLElBQWIsRUFBbUJuRyxJQUFuQixDQUE5QixFQUF1RDtFQUN0RCxrQkFBR2tGLElBQUksQ0FBQ2hGLFFBQUwsQ0FBY3RGLE1BQWQsSUFBd0IsQ0FBM0IsRUFBOEI7RUFDN0JzSyxnQkFBQUEsSUFBSSxDQUFDaEYsUUFBTCxDQUFjLENBQWQsRUFBaUIvRCxDQUFqQixHQUFxQjZKLElBQXJCO0VBQ0EsZUFGRCxNQUVPO0VBQ04sb0JBQUlFLFdBQVcsR0FBR2hCLElBQUksQ0FBQ2dCLFdBQUwsRUFBbEI7RUFDQSxvQkFBRzlNLElBQUksQ0FBQ21OLEtBQVIsRUFDQ2hMLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWSxlQUFhdEIsSUFBSSxDQUFDTCxJQUFMLENBQVV6SyxJQUF2QixHQUE0QixtQkFBNUIsR0FBZ0Q4TCxXQUFXLENBQUN0TCxNQUE1RCxHQUFtRSxRQUFuRSxHQUE0RXVMLElBQXhGOztFQUNELHFCQUFJLElBQUl4TCxDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUN1TCxXQUFXLENBQUN0TCxNQUEzQixFQUFtQ0QsQ0FBQyxFQUFwQyxFQUF3QztFQUN2QyxzQkFBR3VLLElBQUksQ0FBQ0wsSUFBTCxDQUFVekssSUFBVixLQUFtQjhMLFdBQVcsQ0FBQ3ZMLENBQUQsQ0FBWCxDQUFla0ssSUFBZixDQUFvQnpLLElBQTFDLEVBQ0M4TCxXQUFXLENBQUN2TCxDQUFELENBQVgsQ0FBZXdCLENBQWYsSUFBb0JnSyxJQUFwQjtFQUNEO0VBQ0Q7RUFDRDtFQUNEO0VBQ0QsU0E5QkQsTUE4Qk8sSUFBSWpCLElBQUksQ0FBQy9JLENBQUwsR0FBU3lFLE1BQU0sQ0FBQ3pFLENBQWhCLElBQXFCK0ksSUFBSSxDQUFDL0ksQ0FBTCxHQUFTd0UsTUFBTSxDQUFDeEUsQ0FBdEMsSUFBNkMrSSxJQUFJLENBQUMvSSxDQUFMLEdBQVN5RSxNQUFNLENBQUN6RSxDQUFoQixJQUFxQitJLElBQUksQ0FBQy9JLENBQUwsR0FBU3dFLE1BQU0sQ0FBQ3hFLENBQXJGLEVBQXdGO0VBQzdGK0ksVUFBQUEsSUFBSSxDQUFDL0ksQ0FBTCxHQUFTNkosSUFBVCxDQUQ2RjtFQUU5RjtFQUNEO0VBQ0Q7RUFDRDs7RUFDRGIsRUFBQUEsT0FBTyxDQUFDbkYsSUFBRCxDQUFQO0VBQ0FtRixFQUFBQSxPQUFPLENBQUNuRixJQUFELENBQVA7RUFDQTs7RUFHRCxTQUFTc0csWUFBVCxDQUFzQmxOLElBQXRCLEVBQTRCOEwsSUFBNUIsRUFBa0NpQixJQUFsQyxFQUF3Q25HLElBQXhDLEVBQThDO0VBQzdDLE1BQUlrRyxXQUFXLEdBQUdoQixJQUFJLENBQUNnQixXQUFMLEVBQWxCO0VBQ0EsTUFBSU8sZ0JBQWdCLEdBQUduSSxDQUFDLENBQUN3RixHQUFGLENBQU1vQyxXQUFOLEVBQW1CLFVBQVNRLFVBQVQsRUFBcUIxQyxFQUFyQixFQUF3QjtFQUFDLFdBQU8wQyxVQUFVLENBQUM3QixJQUFYLENBQWdCekssSUFBdkI7RUFBNkIsR0FBekUsQ0FBdkI7RUFDQSxNQUFJZ0csS0FBSyxHQUFHSixJQUFJLENBQUNrRyxXQUFMLEVBQVo7O0VBQ0EsT0FBSSxJQUFJdkwsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDdUwsV0FBVyxDQUFDdEwsTUFBM0IsRUFBbUNELENBQUMsRUFBcEMsRUFBdUM7RUFDdEMsUUFBSStMLFVBQVUsR0FBR1IsV0FBVyxDQUFDdkwsQ0FBRCxDQUE1Qjs7RUFDQSxRQUFHdUssSUFBSSxDQUFDTCxJQUFMLENBQVV6SyxJQUFWLEtBQW1Cc00sVUFBVSxDQUFDN0IsSUFBWCxDQUFnQnpLLElBQXRDLEVBQTJDO0VBQzFDLFVBQUl1TSxJQUFJLEdBQUdELFVBQVUsQ0FBQ3ZLLENBQVgsR0FBZWdLLElBQTFCO0VBQ0EsVUFBR0YsT0FBTyxDQUFDN00sSUFBRCxFQUFPZ0gsS0FBUCxFQUFjdUcsSUFBZCxFQUFvQkQsVUFBVSxDQUFDbEMsS0FBL0IsRUFBc0NpQyxnQkFBdEMsQ0FBVixFQUNDLE9BQU8sSUFBUDtFQUNEO0VBQ0Q7O0VBQ0QsU0FBTyxLQUFQO0VBQ0E7OztFQUdNLFNBQVNSLE9BQVQsQ0FBaUI3TSxJQUFqQixFQUF1QmdILEtBQXZCLEVBQThCdUcsSUFBOUIsRUFBb0NuQyxLQUFwQyxFQUEyQ0ksYUFBM0MsRUFBMEQ7RUFDaEUsT0FBSSxJQUFJZ0MsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDeEcsS0FBSyxDQUFDeEYsTUFBckIsRUFBNkJnTSxDQUFDLEVBQTlCLEVBQWtDO0VBQ2pDLFFBQUdwQyxLQUFLLElBQUlwRSxLQUFLLENBQUN3RyxDQUFELENBQUwsQ0FBU3BDLEtBQWxCLElBQTJCbEcsQ0FBQyxDQUFDcUUsT0FBRixDQUFVdkMsS0FBSyxDQUFDd0csQ0FBRCxDQUFMLENBQVMvQixJQUFULENBQWN6SyxJQUF4QixFQUE4QndLLGFBQTlCLEtBQWdELENBQUMsQ0FBL0UsRUFBaUY7RUFDaEYsVUFBR3pGLElBQUksQ0FBQ0MsR0FBTCxDQUFTdUgsSUFBSSxHQUFHdkcsS0FBSyxDQUFDd0csQ0FBRCxDQUFMLENBQVN6SyxDQUF6QixJQUErQi9DLElBQUksQ0FBQ3lOLFdBQUwsR0FBaUIsSUFBbkQsRUFDQyxPQUFPLElBQVA7RUFDRDtFQUNEOztFQUNELFNBQU8sS0FBUDtFQUNBOztFQUdNLFNBQVMvRixhQUFULENBQXVCVixLQUF2QixFQUE4QmhHLElBQTlCLEVBQW9DO0VBQzFDLE9BQUssSUFBSU8sQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3lGLEtBQUssQ0FBQ3hGLE1BQTFCLEVBQWtDRCxDQUFDLEVBQW5DLEVBQXVDO0VBQ3RDLFFBQUd5RixLQUFLLENBQUN6RixDQUFELENBQUwsQ0FBU2tLLElBQVQsSUFBaUJ6SyxJQUFJLEtBQUtnRyxLQUFLLENBQUN6RixDQUFELENBQUwsQ0FBU2tLLElBQVQsQ0FBY3pLLElBQTNDLEVBQ0MsT0FBT2dHLEtBQUssQ0FBQ3pGLENBQUQsQ0FBWixDQURELEtBRUssSUFBSVAsSUFBSSxLQUFLZ0csS0FBSyxDQUFDekYsQ0FBRCxDQUFMLENBQVNQLElBQXRCLEVBQ0osT0FBT2dHLEtBQUssQ0FBQ3pGLENBQUQsQ0FBWjtFQUNEO0VBQ0Q7O0VBR00sU0FBU21NLFFBQVQsQ0FBa0IxTSxJQUFsQixFQUF1QjtFQUM3QixNQUFJMk0sT0FBTyxHQUFHLElBQUlDLE1BQUosQ0FBVyxTQUFTNU0sSUFBVCxHQUFnQixXQUEzQixFQUF3QzZNLElBQXhDLENBQTZDQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLElBQTdELENBQWQ7RUFDQSxNQUFJTCxPQUFPLEtBQUcsSUFBZCxFQUNHLE9BQU8sSUFBUCxDQURILEtBR0csT0FBT0EsT0FBTyxDQUFDLENBQUQsQ0FBUCxJQUFjLENBQXJCO0VBQ0g7O0VBR00sU0FBU3JGLG9CQUFULENBQThCdEcsT0FBOUIsRUFBdUNpRyxJQUF2QyxFQUE2Q0UsSUFBN0MsRUFBbUQ7RUFDekQsTUFBSThGLEtBQUssR0FBR2hHLElBQVo7RUFDQSxNQUFJaUcsS0FBSyxHQUFHL0YsSUFBWjs7RUFDQSxTQUFRLFlBQVluRyxPQUFPLENBQUNpTSxLQUFELENBQW5CLElBQThCLFlBQVlqTSxPQUFPLENBQUNrTSxLQUFELENBQWpELElBQ0wsRUFBRSxlQUFlbE0sT0FBTyxDQUFDaU0sS0FBRCxDQUF4QixDQURLLElBQytCLEVBQUUsZUFBZWpNLE9BQU8sQ0FBQ2tNLEtBQUQsQ0FBeEIsQ0FEdkMsRUFDd0U7RUFDdkVELElBQUFBLEtBQUssR0FBRy9GLFlBQVksQ0FBQ2xHLE9BQUQsRUFBVUEsT0FBTyxDQUFDaU0sS0FBRCxDQUFQLENBQWUxRyxNQUF6QixDQUFwQjtFQUNBMkcsSUFBQUEsS0FBSyxHQUFHaEcsWUFBWSxDQUFDbEcsT0FBRCxFQUFVQSxPQUFPLENBQUNrTSxLQUFELENBQVAsQ0FBZTNHLE1BQXpCLENBQXBCO0VBQ0E7O0VBQ0QsU0FBTztFQUFDLFlBQVEwRyxLQUFUO0VBQWdCLFlBQVFDO0VBQXhCLEdBQVA7RUFDQTtFQUdEO0VBQ0E7O0VBQ08sU0FBU0MsWUFBVCxDQUFzQm5PLElBQXRCLEVBQTRCb08sSUFBNUIsRUFBa0NDLEtBQWxDLEVBQXdDO0VBQzlDLE1BQUlsRixPQUFPLEdBQUduSixJQUFJLENBQUNnQyxPQUFMLENBQWNrSSxlQUFlLENBQUNsSyxJQUFJLENBQUNnQyxPQUFOLENBQTdCLENBQWQ7RUFDQXNNLEVBQUFBLFNBQVMsQ0FBQ3RPLElBQUQsRUFBT21KLE9BQU8sQ0FBQ25JLElBQWYsRUFBcUJvTixJQUFyQixFQUEyQkMsS0FBM0IsQ0FBVDtFQUNBO0VBR0Q7RUFDQTs7RUFDTyxTQUFTQyxTQUFULENBQW1CdE8sSUFBbkIsRUFBeUJnQixJQUF6QixFQUErQm9OLElBQS9CLEVBQXFDQyxLQUFyQyxFQUEyQztFQUNqRCxNQUFJcEssVUFBVSxHQUFHTixZQUFZLENBQUM0SyxPQUFBLENBQWlCdk8sSUFBakIsQ0FBRCxDQUE3QjtFQUNBLE1BQUk4TCxJQUFJLEdBQUdwRSxhQUFhLENBQUN6RCxVQUFELEVBQWFqRCxJQUFiLENBQXhCOztFQUNBLE1BQUcsQ0FBQzhLLElBQUosRUFBUztFQUNSM0osSUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsbUJBQWI7RUFDQTtFQUNBOztFQUVELE1BQUcsQ0FBQzhDLENBQUMsQ0FBQ3NKLE9BQUYsQ0FBVUosSUFBVixDQUFKLEVBQXFCO0VBQ3BCQSxJQUFBQSxJQUFJLEdBQUcsQ0FBQ0EsSUFBRCxDQUFQO0VBQ0E7O0VBRUQsTUFBR0MsS0FBSCxFQUFVO0VBQ1QsU0FBSSxJQUFJOU0sQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDNk0sSUFBSSxDQUFDNU0sTUFBcEIsRUFBNEJELENBQUMsRUFBN0IsRUFBaUM7RUFDaEMsVUFBSWtOLENBQUMsR0FBR0wsSUFBSSxDQUFDN00sQ0FBRCxDQUFaLENBRGdDOztFQUdoQyxVQUFHa04sQ0FBQyxJQUFJM0MsSUFBTCxJQUFhc0MsSUFBSSxDQUFDNU0sTUFBTCxLQUFnQixDQUFoQyxFQUFtQztFQUNsQyxZQUFHc0ssSUFBSSxDQUFDMkMsQ0FBRCxDQUFKLEtBQVlKLEtBQWYsRUFDQzs7RUFDRCxZQUFJO0VBQ0QsY0FBR3BNLElBQUksQ0FBQ0MsU0FBTCxDQUFlNEosSUFBSSxDQUFDMkMsQ0FBRCxDQUFuQixNQUE0QnhNLElBQUksQ0FBQ0MsU0FBTCxDQUFlbU0sS0FBZixDQUEvQixFQUNDO0VBQ0gsU0FIRCxDQUdFLE9BQU05TixDQUFOLEVBQVE7RUFFVDtFQUNEOztFQUNEdUwsTUFBQUEsSUFBSSxDQUFDMkMsQ0FBRCxDQUFKLEdBQVVKLEtBQVY7RUFDQTtFQUNELEdBaEJELE1BZ0JPO0VBQ04sUUFBSUssS0FBSyxHQUFHLEtBQVo7O0VBQ0EsU0FBSSxJQUFJbk4sR0FBQyxHQUFDLENBQVYsRUFBYUEsR0FBQyxHQUFDNk0sSUFBSSxDQUFDNU0sTUFBcEIsRUFBNEJELEdBQUMsRUFBN0IsRUFBaUM7RUFDaEMsVUFBSWtOLEVBQUMsR0FBR0wsSUFBSSxDQUFDN00sR0FBRCxDQUFaLENBRGdDOztFQUdoQyxVQUFHa04sRUFBQyxJQUFJM0MsSUFBUixFQUFjO0VBQ2IsZUFBT0EsSUFBSSxDQUFDMkMsRUFBRCxDQUFYO0VBQ0FDLFFBQUFBLEtBQUssR0FBRyxJQUFSO0VBQ0E7RUFDRDs7RUFDRCxRQUFHLENBQUNBLEtBQUosRUFDQztFQUNEOztFQUNEQyxFQUFBQSxTQUFTLENBQUMxSyxVQUFELEVBQWE2SCxJQUFiLENBQVQ7RUFDQTlMLEVBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZWlDLFVBQWY7RUFDQTJLLEVBQUFBLE9BQU8sQ0FBQzVPLElBQUQsQ0FBUDtFQUNBOztFQUdNLFNBQVM2TyxpQkFBVCxDQUEyQjdPLElBQTNCLEVBQWlDNkssR0FBakMsRUFBc0NuRixHQUF0QyxFQUEyQ0MsR0FBM0MsRUFBZ0RtSixhQUFoRCxFQUE4RDtFQUNwRSxNQUFJN0ssVUFBVSxHQUFHTixZQUFZLENBQUM0SyxPQUFBLENBQWlCdk8sSUFBakIsQ0FBRCxDQUE3QjtFQUNBLE1BQUltSixPQUFPLEdBQUdsRixVQUFVLENBQUVpRyxlQUFlLENBQUNqRyxVQUFELENBQWpCLENBQXhCOztFQUNBLE1BQUcsQ0FBQ2tGLE9BQUosRUFBWTtFQUNYaEgsSUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsb0JBQWI7RUFDQTtFQUNBOztFQUNELE1BQUkyTSxRQUFRLEdBQUdDLFFBQVEsQ0FBQy9LLFVBQUQsRUFBYWtGLE9BQWIsRUFBc0IwQixHQUF0QixFQUEyQixDQUEzQixDQUFSLENBQXNDLENBQXRDLENBQWY7RUFDQWtFLEVBQUFBLFFBQVEsQ0FBQ3JKLEdBQVQsR0FBZUEsR0FBZjtFQUNBcUosRUFBQUEsUUFBUSxDQUFDcEosR0FBVCxHQUFlQSxHQUFmO0VBQ0EsTUFBR21KLGFBQWEsS0FBSzVPLFNBQXJCLEVBQ0M2TyxRQUFRLENBQUNELGFBQVQsR0FBeUJBLGFBQXpCO0VBQ0Q5TyxFQUFBQSxJQUFJLENBQUNnQyxPQUFMLEdBQWVpQyxVQUFmO0VBQ0EySyxFQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQSxTQUFPK08sUUFBUSxDQUFDL04sSUFBaEI7RUFDQTs7RUFHTSxTQUFTaU8sbUJBQVQsQ0FBNkJqUCxJQUE3QixFQUFtQ2dCLElBQW5DLEVBQXdDO0VBQzlDLFdBQVNrTyxNQUFULENBQWdCbFAsSUFBaEIsRUFBc0JnQyxPQUF0QixFQUErQjtFQUM5QjtFQUNBaEMsSUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlQSxPQUFmO0VBQ0E0TSxJQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQTs7RUFDRCxNQUFJaUUsVUFBVSxHQUFHTixZQUFZLENBQUM0SyxPQUFBLENBQWlCdk8sSUFBakIsQ0FBRCxDQUE3QjtFQUNBLE1BQUk4TCxJQUFJLEdBQUdwRSxhQUFhLENBQUM2RyxPQUFBLENBQWlCdk8sSUFBakIsQ0FBRCxFQUF5QmdCLElBQXpCLENBQXhCOztFQUNBLE1BQUcsQ0FBQzhLLElBQUosRUFBUztFQUNSM0osSUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEsaUJBQWI7RUFDQTtFQUNBOztFQUNEK00sRUFBQUEsbUJBQW1CLENBQUNsTCxVQUFELEVBQWE2SCxJQUFiLEVBQW1COUwsSUFBbkIsRUFBeUJrUCxNQUF6QixDQUFuQjtFQUNBOztFQUdNLFNBQVNFLE1BQVQsQ0FBZ0JwUCxJQUFoQixFQUFzQmdCLElBQXRCLEVBQTJCO0VBQ2pDLFNBQU8wRyxhQUFhLENBQUM2RyxPQUFBLENBQWlCdk8sSUFBakIsQ0FBRCxFQUF5QmdCLElBQXpCLENBQWIsS0FBZ0RkLFNBQXZEO0VBQ0E7O0VBR00sU0FBU21QLFVBQVQsQ0FBb0JyUCxJQUFwQixFQUF5QjtFQUMvQmtGLEVBQUFBLENBQUMsQ0FBQyxnQkFBRCxDQUFELENBQW9Cb0ssTUFBcEI7RUFDQXBLLEVBQUFBLENBQUMsQ0FBQyxNQUFELENBQUQsQ0FBVXFLLE1BQVYsQ0FBaUIsZ0NBQWpCO0VBQ0EsTUFBSTlOLEdBQUo7O0VBQ0EsT0FBSSxJQUFJRixDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUN2QixJQUFJLENBQUNnQyxPQUFMLENBQWFSLE1BQTVCLEVBQW9DRCxDQUFDLEVBQXJDLEVBQXlDO0VBQ3hDLFFBQUlvRixNQUFNLEdBQUcsMERBQXdEM0csSUFBSSxDQUFDZ0MsT0FBTCxDQUFhVCxDQUFiLEVBQWdCUCxJQUF4RSxHQUE2RSxrQ0FBMUY7O0VBQ0EsU0FBSVMsR0FBSixJQUFXekIsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhVCxDQUFiLENBQVgsRUFBNEI7RUFDM0IsVUFBR0UsR0FBRyxLQUFLLE1BQVgsRUFBbUI7RUFDbkIsVUFBR0EsR0FBRyxLQUFLLFFBQVgsRUFDQ2tGLE1BQU0sSUFBSSxXQUFTbEYsR0FBVCxHQUFlLEdBQWYsR0FBcUJ6QixJQUFJLENBQUNnQyxPQUFMLENBQWFULENBQWIsRUFBZ0JFLEdBQWhCLEVBQXFCVCxJQUExQyxHQUErQyxXQUF6RCxDQURELEtBRUssSUFBSVMsR0FBRyxLQUFLLFVBQVosRUFBd0I7RUFDNUIsWUFBSXpCLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYVQsQ0FBYixFQUFnQkUsR0FBaEIsRUFBcUIsQ0FBckIsTUFBNEJ2QixTQUFoQyxFQUNDeUcsTUFBTSxJQUFJLFdBQVNsRixHQUFULEdBQWUsR0FBZixHQUFxQnpCLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYVQsQ0FBYixFQUFnQkUsR0FBaEIsRUFBcUIsQ0FBckIsRUFBd0JULElBQTdDLEdBQWtELFdBQTVEO0VBQ0QsT0FISSxNQUlKMkYsTUFBTSxJQUFJLFdBQVNsRixHQUFULEdBQWUsR0FBZixHQUFxQnpCLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYVQsQ0FBYixFQUFnQkUsR0FBaEIsQ0FBckIsR0FBMEMsV0FBcEQ7RUFDRDs7RUFDRHlELElBQUFBLENBQUMsQ0FBQyxnQkFBRCxDQUFELENBQW9CcUssTUFBcEIsQ0FBMkI1SSxNQUFNLEdBQUcsY0FBcEM7RUFFQTs7RUFDRHpCLEVBQUFBLENBQUMsQ0FBQyxnQkFBRCxDQUFELENBQW9CcUssTUFBcEIsQ0FBMkIsY0FBM0I7O0VBQ0EsT0FBSTlOLEdBQUosSUFBV3pCLElBQVgsRUFBaUI7RUFDaEIsUUFBR3lCLEdBQUcsS0FBSyxTQUFYLEVBQXNCO0VBQ3RCeUQsSUFBQUEsQ0FBQyxDQUFDLGdCQUFELENBQUQsQ0FBb0JxSyxNQUFwQixDQUEyQixXQUFTOU4sR0FBVCxHQUFlLEdBQWYsR0FBcUJ6QixJQUFJLENBQUN5QixHQUFELENBQXpCLEdBQStCLFdBQTFEO0VBQ0E7RUFDRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUNqc0JEO0VBS08sU0FBUytOLEtBQVQsQ0FBYUMsT0FBYixFQUFzQjtFQUM1QixNQUFJelAsSUFBSSxHQUFHa0YsQ0FBQyxDQUFDd0ssTUFBRixDQUFTO0VBQ2I7RUFDTmpQLElBQUFBLFVBQVUsRUFBRTtFQUZPLEdBQVQsRUFHTGdQLE9BSEssQ0FBWDtFQUtBLE1BQUlFLElBQUksR0FBRyxDQUFDO0VBQUMsVUFBTSxTQUFQO0VBQWtCLGFBQVM7RUFBM0IsR0FBRCxFQUNSO0VBQUMsVUFBTSxXQUFQO0VBQW9CLGFBQVM7RUFBN0IsR0FEUSxFQUVSO0VBQUMsVUFBTSxZQUFQO0VBQXFCLGFBQVM7RUFBOUIsR0FGUSxFQUdSO0VBQUMsVUFBTSxlQUFQO0VBQXdCLGFBQVM7RUFBakMsR0FIUSxDQUFYO0VBSUEsTUFBSUMsR0FBRyxHQUFHLEVBQVY7O0VBQ0EsT0FBSSxJQUFJck8sQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDb08sSUFBSSxDQUFDbk8sTUFBcEIsRUFBNEJELENBQUMsRUFBN0IsRUFBaUM7RUFDaENxTyxJQUFBQSxHQUFHLElBQUksT0FBUDtFQUNBQSxJQUFBQSxHQUFHLElBQUksOEJBQThCRCxJQUFJLENBQUNwTyxDQUFELENBQUosQ0FBUXNPLEVBQXRDLEdBQTJDLElBQTNDLElBQ1NGLElBQUksQ0FBQ3BPLENBQUQsQ0FBSixDQUFRc08sRUFBUixJQUFjLGVBQWQsR0FBZ0Msa0JBQWhDLEdBQXFELEVBRDlELElBRVEsNkJBRlIsR0FFdUNGLElBQUksQ0FBQ3BPLENBQUQsQ0FBSixDQUFRd0QsS0FGL0MsR0FFc0QsUUFGN0Q7RUFHQTZLLElBQUFBLEdBQUcsSUFBSSxPQUFQO0VBQ0E7O0VBQ0QxSyxFQUFBQSxDQUFDLENBQUUsTUFBSWxGLElBQUksQ0FBQ1MsVUFBWCxDQUFELENBQXlCOE8sTUFBekIsQ0FBZ0NLLEdBQWhDO0VBQ0FwSyxFQUFBQSxLQUFLLENBQUN4RixJQUFELENBQUw7RUFDQTtFQUVNLFNBQVM4UCxhQUFULEdBQXdCO0VBQzlCLFNBQVFDLFFBQVEsQ0FBQ0MsaUJBQVQsSUFBOEJELFFBQVEsQ0FBQ0Usb0JBQXZDLElBQStERixRQUFRLENBQUNHLHVCQUFoRjtFQUNBOztFQUVELFNBQVMxSyxLQUFULENBQWV4RixJQUFmLEVBQXFCO0VBQ3BCO0VBQ0drRixFQUFBQSxDQUFDLENBQUM2SyxRQUFELENBQUQsQ0FBWUksRUFBWixDQUFlLGdGQUFmLEVBQWlHLFVBQVNDLEVBQVQsRUFBYztFQUNqSCxRQUFJQyxhQUFhLEdBQUc5QixPQUFBLENBQWlCdk8sSUFBakIsQ0FBcEI7O0VBQ0EsUUFBSXFRLGFBQWEsS0FBS25RLFNBQWxCLElBQStCbVEsYUFBYSxLQUFLLElBQXJELEVBQTJEO0VBQzFEclEsTUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlcU8sYUFBZjtFQUNBOztFQUNEekIsSUFBQUEsT0FBTyxDQUFDNU8sSUFBRCxDQUFQO0VBQ0csR0FORDtFQVFIa0YsRUFBQUEsQ0FBQyxDQUFDLGFBQUQsQ0FBRCxDQUFpQmlMLEVBQWpCLENBQW9CLE9BQXBCLEVBQTZCLFVBQVNDLEVBQVQsRUFBYTtFQUN6QyxRQUFJLENBQUNMLFFBQVEsQ0FBQ08sYUFBVixJQUEyQixDQUFDUCxRQUFRLENBQUNRLGdCQUF6QyxFQUEyRDtFQUMxRCxVQUFJdEcsTUFBTSxHQUFHL0UsQ0FBQyxDQUFDLE1BQUlsRixJQUFJLENBQUN3USxTQUFWLENBQUQsQ0FBc0IsQ0FBdEIsQ0FBYjtFQUNBLFVBQUd2RyxNQUFNLENBQUN3RyxvQkFBVixFQUNDeEcsTUFBTSxDQUFDd0csb0JBQVAsR0FERCxLQUdDeEcsTUFBTSxDQUFDeUcsdUJBQVAsQ0FBK0JDLE9BQU8sQ0FBQ0Msb0JBQXZDO0VBQ0QsS0FORCxNQU1PO0VBQ04sVUFBR2IsUUFBUSxDQUFDYyxtQkFBWixFQUNDZCxRQUFRLENBQUNjLG1CQUFULEdBREQsS0FHQ2QsUUFBUSxDQUFDZSxzQkFBVDtFQUNEO0VBQ0QsR0FiRCxFQVZvQjs7RUEwQnBCNUwsRUFBQUEsQ0FBQyxDQUFFLE1BQUlsRixJQUFJLENBQUNTLFVBQVgsQ0FBRCxDQUF5QjBQLEVBQXpCLENBQTZCLE9BQTdCLEVBQXNDLFVBQVM1UCxDQUFULEVBQVk7RUFDakRBLElBQUFBLENBQUMsQ0FBQ3dRLGVBQUY7RUFDQSxRQUFHN0wsQ0FBQyxDQUFDM0UsQ0FBQyxDQUFDMEosTUFBSCxDQUFELENBQVkrRyxRQUFaLENBQXFCLFVBQXJCLENBQUgsRUFDQyxPQUFPLEtBQVA7O0VBRUQsUUFBRzlMLENBQUMsQ0FBQzNFLENBQUMsQ0FBQzBKLE1BQUgsQ0FBRCxDQUFZK0csUUFBWixDQUFxQixTQUFyQixDQUFILEVBQW9DO0VBQ25DaFIsTUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFldU0sUUFBQSxDQUFrQnZPLElBQWxCLENBQWY7RUFDQWtGLE1BQUFBLENBQUMsQ0FBQyxNQUFJbEYsSUFBSSxDQUFDd1EsU0FBVixDQUFELENBQXNCUyxLQUF0QjtFQUNBQyxNQUFBQSxLQUFLLENBQUNsUixJQUFELENBQUw7RUFDQSxLQUpELE1BSU8sSUFBSWtGLENBQUMsQ0FBQzNFLENBQUMsQ0FBQzBKLE1BQUgsQ0FBRCxDQUFZK0csUUFBWixDQUFxQixXQUFyQixDQUFKLEVBQXVDO0VBQzdDaFIsTUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFldU0sSUFBQSxDQUFjdk8sSUFBZCxDQUFmO0VBQ0FrRixNQUFBQSxDQUFDLENBQUMsTUFBSWxGLElBQUksQ0FBQ3dRLFNBQVYsQ0FBRCxDQUFzQlMsS0FBdEI7RUFDQUMsTUFBQUEsS0FBSyxDQUFDbFIsSUFBRCxDQUFMO0VBQ0EsS0FKTSxNQUlBLElBQUlrRixDQUFDLENBQUMzRSxDQUFDLENBQUMwSixNQUFILENBQUQsQ0FBWStHLFFBQVosQ0FBcUIsWUFBckIsQ0FBSixFQUF3QztFQUM5QzlMLE1BQUFBLENBQUMsQ0FBQyxtRkFBRCxDQUFELENBQXVGQyxNQUF2RixDQUE4RjtFQUM3RkosUUFBQUEsS0FBSyxFQUFFLGVBRHNGO0VBRTdGb00sUUFBQUEsU0FBUyxFQUFFLEtBRmtGO0VBRzdGQyxRQUFBQSxNQUFNLEVBQUUsTUFIcUY7RUFJN0YvTCxRQUFBQSxLQUFLLEVBQUUsR0FKc0Y7RUFLN0ZELFFBQUFBLEtBQUssRUFBRSxJQUxzRjtFQU03RkUsUUFBQUEsT0FBTyxFQUFFO0VBQ1IrTCxVQUFBQSxRQUFRLEVBQUUsb0JBQVc7RUFDcEJDLFlBQUFBLEtBQUssQ0FBQ3RSLElBQUQsRUFBT0EsSUFBSSxDQUFDdVIscUJBQVosQ0FBTDtFQUNBck0sWUFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRQyxNQUFSLENBQWdCLE9BQWhCO0VBQ0EsV0FKTztFQUtScU0sVUFBQUEsTUFBTSxFQUFFLGtCQUFXO0VBQ2xCdE0sWUFBQUEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRQyxNQUFSLENBQWdCLE9BQWhCO0VBQ0E7RUFDRztFQVJJO0VBTm9GLE9BQTlGO0VBaUJBLEtBL0JnRDs7O0VBaUNqREQsSUFBQUEsQ0FBQyxDQUFDNkssUUFBRCxDQUFELENBQVkwQixPQUFaLENBQW9CLFVBQXBCLEVBQWdDLENBQUN6UixJQUFELENBQWhDO0VBQ0EsR0FsQ0Q7RUFtQ0E7OztFQUdNLFNBQVNzUixLQUFULENBQWV0UixJQUFmLEVBQXFCMFIsWUFBckIsRUFBbUM7RUFDekMsTUFBSXZJLE9BQUo7O0VBQ0EsTUFBR3VJLFlBQUgsRUFBaUI7RUFDaEIsUUFBSXJCLGFBQWEsR0FBRzlCLE9BQUEsQ0FBaUJ2TyxJQUFqQixDQUFwQjtFQUNBLFFBQUlpRSxVQUFVLEdBQUlOLFlBQVksQ0FBQzBNLGFBQUQsQ0FBOUI7RUFDQWxILElBQUFBLE9BQU8sR0FBR2xGLFVBQVUsQ0FBQ2lHLGVBQWUsQ0FBQ2pHLFVBQUQsQ0FBaEIsQ0FBcEIsQ0FIZ0I7O0VBS2hCa0YsSUFBQUEsT0FBTyxDQUFDbkksSUFBUixHQUFlLEtBQWY7RUFDQW1JLElBQUFBLE9BQU8sQ0FBQzVCLE1BQVIsR0FBaUIsS0FBakI7RUFDQTRCLElBQUFBLE9BQU8sQ0FBQzNCLE1BQVIsR0FBaUIsS0FBakIsQ0FQZ0I7O0VBU2hCK0csSUFBQUEsbUJBQUEsQ0FBNkJ2TyxJQUE3QjtFQUNBLEdBVkQsTUFVTztFQUNObUosSUFBQUEsT0FBTyxHQUFHO0VBQ1QsY0FBTyxLQURFO0VBQ0ksYUFBTSxHQURWO0VBQ2MsZ0JBQVMsS0FEdkI7RUFDNkIsZ0JBQVMsS0FEdEM7RUFDNEMsaUJBQVUsSUFEdEQ7RUFDMkQsZ0JBQVMsR0FEcEU7RUFDd0Usc0JBQWU7RUFEdkYsS0FBVjtFQUdBb0YsSUFBQUEsS0FBQSxDQUFldk8sSUFBZixFQUpNO0VBS047O0VBRUQsU0FBT0EsSUFBSSxDQUFDZ0MsT0FBWjtFQUVBLE1BQUkyUCxRQUFRLEdBQUd6TSxDQUFDLENBQUMsbUNBQUQsQ0FBaEI7O0VBQ0EsTUFBR3lNLFFBQVEsQ0FBQ25RLE1BQVQsR0FBa0IsQ0FBbEIsSUFBdUJtUSxRQUFRLENBQUNoSCxHQUFULE1BQWtCLFdBQTVDLEVBQXlEO0VBQUs7RUFDN0QzSyxJQUFBQSxJQUFJLENBQUNnQyxPQUFMLEdBQWUsQ0FDZDtFQUFDLGNBQU8sS0FBUjtFQUFjLGFBQU0sR0FBcEI7RUFBd0IsbUJBQVksSUFBcEM7RUFBeUMsZ0JBQVMsR0FBbEQ7RUFBc0Qsc0JBQWU7RUFBckUsS0FEYyxFQUVkO0VBQUMsY0FBTyxLQUFSO0VBQWMsYUFBTSxHQUFwQjtFQUF3QixtQkFBWSxJQUFwQztFQUF5QyxnQkFBUyxHQUFsRDtFQUFzRCxzQkFBZTtFQUFyRSxLQUZjLEVBR2Q7RUFBQyxjQUFPLEtBQVI7RUFBYyxhQUFNLEdBQXBCO0VBQXdCLG1CQUFZLElBQXBDO0VBQXlDLGdCQUFTLEdBQWxEO0VBQXNELHNCQUFlO0VBQXJFLEtBSGMsRUFJZDtFQUFDLGNBQU8sS0FBUjtFQUFjLGFBQU0sR0FBcEI7RUFBd0IsbUJBQVksSUFBcEM7RUFBeUMsZ0JBQVMsR0FBbEQ7RUFBc0Qsc0JBQWU7RUFBckUsS0FKYyxFQUtkO0VBQUMsY0FBTyxLQUFSO0VBQWMsYUFBTSxHQUFwQjtFQUF3QixnQkFBUyxLQUFqQztFQUF1QyxnQkFBUyxLQUFoRDtFQUFzRCxnQkFBUyxHQUEvRDtFQUFtRSxzQkFBZTtFQUFsRixLQUxjLEVBTWQ7RUFBQyxjQUFPLEtBQVI7RUFBYyxhQUFNLEdBQXBCO0VBQXdCLGdCQUFTLEtBQWpDO0VBQXVDLGdCQUFTLEtBQWhEO0VBQXNELGdCQUFTLEdBQS9EO0VBQW1FLHNCQUFlO0VBQWxGLEtBTmMsRUFPZDtFQUFDLGNBQU8sS0FBUjtFQUFjLGFBQU0sR0FBcEI7RUFBd0IsZ0JBQVMsS0FBakM7RUFBdUMsZ0JBQVMsS0FBaEQ7RUFBc0QsZ0JBQVMsR0FBL0Q7RUFBbUUsc0JBQWU7RUFBbEYsS0FQYyxFQVFkO0VBQUMsY0FBTyxLQUFSO0VBQWMsYUFBTSxHQUFwQjtFQUF3QixnQkFBUyxLQUFqQztFQUF1QyxnQkFBUyxLQUFoRDtFQUFzRCxnQkFBUyxHQUEvRDtFQUFtRSxzQkFBZTtFQUFsRixLQVJjLEVBU2Q7RUFBQyxjQUFPLEtBQVI7RUFBYyxhQUFNLEdBQXBCO0VBQXdCLGdCQUFTLEtBQWpDO0VBQXVDLGdCQUFTLEtBQWhEO0VBQXNELGdCQUFTLEdBQS9EO0VBQW1FLHNCQUFlO0VBQWxGLEtBVGMsRUFVZDtFQUFDLGNBQU8sS0FBUjtFQUFjLGFBQU0sR0FBcEI7RUFBd0IsZ0JBQVMsS0FBakM7RUFBdUMsZ0JBQVMsS0FBaEQ7RUFBc0QsZ0JBQVMsR0FBL0Q7RUFBbUUsc0JBQWU7RUFBbEYsS0FWYyxFQVdkO0VBQUMsY0FBTyxLQUFSO0VBQWMsYUFBTSxHQUFwQjtFQUF3QixnQkFBUyxLQUFqQztFQUF1QyxnQkFBUyxLQUFoRDtFQUFzRCxtQkFBWSxJQUFsRTtFQUF1RSxnQkFBUyxHQUFoRjtFQUFvRixzQkFBZTtFQUFuRyxLQVhjLEVBWWRtSCxPQVpjLEVBYWQ7RUFBQyxjQUFPLEtBQVI7RUFBYyxhQUFNLEdBQXBCO0VBQXdCLGdCQUFTLEtBQWpDO0VBQXVDLGdCQUFTLEtBQWhEO0VBQXNELGdCQUFTLEdBQS9EO0VBQW1FLHNCQUFlO0VBQWxGLEtBYmMsRUFjZDtFQUFDLGNBQU8sS0FBUjtFQUFjLHNCQUFlLEtBQTdCO0VBQW1DLGFBQU0sR0FBekM7RUFBNkMsZ0JBQVMsS0FBdEQ7RUFBNEQsZ0JBQVMsS0FBckU7RUFBMkUsZ0JBQVM7RUFBcEYsS0FkYyxFQWVkO0VBQUMsY0FBTyxLQUFSO0VBQWMsc0JBQWUsZUFBN0I7RUFBNkMsYUFBTSxHQUFuRDtFQUF1RCxnQkFBUyxLQUFoRTtFQUFzRSxnQkFBUyxLQUEvRTtFQUFxRixnQkFBUztFQUE5RixLQWZjLEVBZ0JkO0VBQUMsY0FBTyxLQUFSO0VBQWMsc0JBQWUsZ0JBQTdCO0VBQThDLGFBQU0sR0FBcEQ7RUFBd0QsZ0JBQVMsS0FBakU7RUFBdUUsZ0JBQVMsS0FBaEY7RUFBc0YsZ0JBQVM7RUFBL0YsS0FoQmMsQ0FBZjtFQWlCQSxHQWxCRCxNQWtCTyxJQUFHd0ksUUFBUSxDQUFDblEsTUFBVCxHQUFrQixDQUFsQixJQUF1Qm1RLFFBQVEsQ0FBQ2hILEdBQVQsTUFBa0IsV0FBNUMsRUFBeUQ7RUFBSztFQUNwRTNLLElBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZSxDQUNkO0VBQUMsY0FBTyxLQUFSO0VBQWMsYUFBTSxHQUFwQjtFQUF3QixnQkFBUyxJQUFqQztFQUFzQyxnQkFBUyxJQUEvQztFQUFvRCxnQkFBUyxHQUE3RDtFQUFpRSxzQkFBZSxRQUFoRjtFQUF5RixtQkFBWTtFQUFyRyxLQURjLEVBRWQ7RUFBQyxjQUFPLEtBQVI7RUFBYyxhQUFNLEdBQXBCO0VBQXdCLGdCQUFTLElBQWpDO0VBQXNDLGdCQUFTLElBQS9DO0VBQW9ELGdCQUFTLEdBQTdEO0VBQWlFLHNCQUFlLFFBQWhGO0VBQXlGLG1CQUFZO0VBQXJHLEtBRmMsRUFHZDtFQUFDLGNBQU8sS0FBUjtFQUFjLGFBQU0sR0FBcEI7RUFBd0IsZ0JBQVMsS0FBakM7RUFBdUMsZ0JBQVMsS0FBaEQ7RUFBc0QsZ0JBQVMsR0FBL0Q7RUFBbUUsc0JBQWU7RUFBbEYsS0FIYyxFQUlkO0VBQUMsY0FBTyxLQUFSO0VBQWMsYUFBTSxHQUFwQjtFQUF3QixnQkFBUyxLQUFqQztFQUF1QyxnQkFBUyxLQUFoRDtFQUFzRCxnQkFBUyxHQUEvRDtFQUFtRSxzQkFBZTtFQUFsRixLQUpjLEVBS2Q7RUFBQyxjQUFPLEtBQVI7RUFBYyxhQUFNLEdBQXBCO0VBQXdCLGdCQUFTLEtBQWpDO0VBQXVDLGdCQUFTLEtBQWhEO0VBQXNELG1CQUFZLElBQWxFO0VBQXVFLGdCQUFTLEdBQWhGO0VBQW9GLHNCQUFlO0VBQW5HLEtBTGMsRUFNZG1ILE9BTmMsRUFPZDtFQUFDLGNBQU8sS0FBUjtFQUFjLGFBQU0sR0FBcEI7RUFBd0IsZ0JBQVMsS0FBakM7RUFBdUMsZ0JBQVMsS0FBaEQ7RUFBc0QsZ0JBQVMsR0FBL0Q7RUFBbUUsc0JBQWU7RUFBbEYsS0FQYyxFQVFkO0VBQUMsY0FBTyxLQUFSO0VBQWMsc0JBQWUsS0FBN0I7RUFBbUMsYUFBTSxHQUF6QztFQUE2QyxnQkFBUyxLQUF0RDtFQUE0RCxnQkFBUyxLQUFyRTtFQUEyRSxnQkFBUztFQUFwRixLQVJjLENBQWY7RUFTQSxHQVZNLE1BVUE7RUFDTm5KLElBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZSxDQUNkO0VBQUMsY0FBUSxLQUFUO0VBQWdCLHNCQUFnQixRQUFoQztFQUEwQyxhQUFPLEdBQWpEO0VBQXNELG1CQUFhO0VBQW5FLEtBRGMsRUFFZDtFQUFDLGNBQVEsS0FBVDtFQUFnQixzQkFBZ0IsUUFBaEM7RUFBMEMsYUFBTyxHQUFqRDtFQUFzRCxtQkFBYTtFQUFuRSxLQUZjLEVBR2RtSCxPQUhjLENBQWY7RUFJQTs7RUFDRHlGLEVBQUFBLE9BQU8sQ0FBQzVPLElBQUQsQ0FBUDtFQUNBO0VBRU0sU0FBUzRSLGFBQVQsQ0FBdUI1UixJQUF2QixFQUE2QjtFQUNuQyxNQUFJc0MsT0FBTyxHQUFHaU0sU0FBQSxDQUFtQnZPLElBQW5CLENBQWQ7RUFDQSxNQUFJcUMsUUFBTSxHQUFHa00sTUFBQSxDQUFnQnZPLElBQWhCLENBQWI7RUFDQSxNQUFJNEQsRUFBRSxHQUFHLE1BQUk1RCxJQUFJLENBQUNTLFVBQWxCO0VBQ0EsTUFBRzRCLFFBQU0sSUFBSUMsT0FBYixFQUNDNEMsQ0FBQyxDQUFDdEIsRUFBRSxHQUFDLGFBQUosQ0FBRCxDQUFvQmlPLFFBQXBCLENBQTZCLFVBQTdCLEVBREQsS0FHQzNNLENBQUMsQ0FBQ3RCLEVBQUUsR0FBQyxhQUFKLENBQUQsQ0FBb0JrTyxXQUFwQixDQUFnQyxVQUFoQztFQUVELE1BQUd4UCxPQUFPLEdBQUcsQ0FBYixFQUNDNEMsQ0FBQyxDQUFDdEIsRUFBRSxHQUFDLFdBQUosQ0FBRCxDQUFrQmtPLFdBQWxCLENBQThCLFVBQTlCLEVBREQsS0FHQzVNLENBQUMsQ0FBQ3RCLEVBQUUsR0FBQyxXQUFKLENBQUQsQ0FBa0JpTyxRQUFsQixDQUEyQixVQUEzQjtFQUNEOztFQ3ZLRDs7RUFNTyxJQUFJRSxPQUFPLEdBQUc7RUFDbkIsbUJBQWlCLDZCQURFO0VBRW5CLG9CQUFrQiw4QkFGQztFQUduQixvQkFBa0IsOEJBSEM7RUFJbkIscUJBQW1CLCtCQUpBO0VBS25CLHVCQUFxQjtFQUxGLENBQWQ7RUFPQSxJQUFJQyxZQUFZLEdBQUcsQ0FBQyxPQUFELEVBQVUsT0FBVixFQUFtQixPQUFuQixFQUE0QixLQUE1QixFQUFtQyxPQUFuQyxFQUE0QyxRQUE1QyxFQUFzRCxRQUF0RCxFQUFnRSxPQUFoRSxDQUFuQjtFQUNBLElBQUlDLGVBQWUsR0FBRyxDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsTUFBYixFQUFxQixNQUFyQixFQUE2QixNQUE3QixDQUF0Qjs7RUFHQSxTQUFTQyxjQUFULEdBQTBCO0VBQ2hDLE1BQUlDLEdBQUcsR0FBRyxFQUFWOztFQUNBLE1BQUdDLFFBQVEsQ0FBQyxjQUFELENBQVIsSUFBNEJBLFFBQVEsQ0FBQyxjQUFELENBQXZDLEVBQXlEO0VBQ3hERCxJQUFBQSxHQUFHLENBQUMsbUJBQUQsQ0FBSCxHQUEyQjtFQUMxQixlQUFTL08sVUFBVSxDQUFDOEIsQ0FBQyxDQUFDLGVBQUQsQ0FBRCxDQUFtQnlGLEdBQW5CLEVBQUQsQ0FETztFQUUxQixnQkFBVXZILFVBQVUsQ0FBQzhCLENBQUMsQ0FBQyxlQUFELENBQUQsQ0FBbUJ5RixHQUFuQixFQUFELENBRk07RUFHMUIsaUJBQVd2SCxVQUFVLENBQUM4QixDQUFDLENBQUMscUJBQUQsQ0FBRCxDQUF5QnlGLEdBQXpCLEVBQUQ7RUFISyxLQUEzQjtFQUtBOztFQUNELE1BQUd5SCxRQUFRLENBQUMsZUFBRCxDQUFSLElBQTZCQSxRQUFRLENBQUMsZUFBRCxDQUF4QyxFQUEyRDtFQUMxREQsSUFBQUEsR0FBRyxDQUFDLG9CQUFELENBQUgsR0FBNEI7RUFDM0IsZUFBUy9PLFVBQVUsQ0FBQzhCLENBQUMsQ0FBQyxnQkFBRCxDQUFELENBQW9CeUYsR0FBcEIsRUFBRCxDQURRO0VBRTNCLGdCQUFVdkgsVUFBVSxDQUFDOEIsQ0FBQyxDQUFDLGdCQUFELENBQUQsQ0FBb0J5RixHQUFwQixFQUFELENBRk87RUFHM0IsaUJBQVd2SCxVQUFVLENBQUM4QixDQUFDLENBQUMsc0JBQUQsQ0FBRCxDQUEwQnlGLEdBQTFCLEVBQUQ7RUFITSxLQUE1QjtFQUtBOztFQUNEeEksRUFBQUEsT0FBTyxDQUFDaUwsR0FBUixDQUFZK0UsR0FBWjtFQUNBLFNBQVFFLE9BQU8sQ0FBQ0YsR0FBRCxDQUFQLEdBQWUsQ0FBZixHQUFtQkEsR0FBM0I7RUFDQTs7RUFHTSxTQUFTQyxRQUFULENBQWtCeE8sRUFBbEIsRUFBc0I7RUFDNUIsU0FBT3NCLENBQUMsQ0FBQ29OLElBQUYsQ0FBT3BOLENBQUMsQ0FBQyxNQUFJdEIsRUFBTCxDQUFELENBQVUrRyxHQUFWLEVBQVAsRUFBd0JuSixNQUF4QixLQUFtQyxDQUExQztFQUNBOztFQUdELElBQUk2USxPQUFPLEdBQUcsU0FBVkEsT0FBVSxDQUFTRSxLQUFULEVBQWdCO0VBQzdCLE9BQUksSUFBSTlRLEdBQVIsSUFBZThRLEtBQWYsRUFBc0I7RUFDckIsUUFBSUMsTUFBTSxDQUFDQyxTQUFQLENBQWlCQyxjQUFqQixDQUFnQ0MsSUFBaEMsQ0FBcUNKLEtBQXJDLEVBQTRDOVEsR0FBNUMsQ0FBSixFQUFzRDtFQUNyRCxhQUFPLEtBQVA7RUFDQTtFQUNEOztFQUNELFNBQU8sSUFBUDtFQUNBLENBUEQ7O0VBU08sU0FBU21SLGdCQUFULEdBQTRCO0VBQ2xDLE1BQUlDLElBQUksR0FBRyxFQUFYOztFQUNBLE1BQUcsQ0FBQzNOLENBQUMsQ0FBQyxlQUFELENBQUQsQ0FBbUI2QyxNQUFuQixHQUE0QmlKLFFBQTVCLENBQXFDLEtBQXJDLENBQUosRUFBaUQ7RUFDaEQ2QixJQUFBQSxJQUFJLElBQUksV0FBUjtFQUNBOztFQUNELE1BQUcsQ0FBQzNOLENBQUMsQ0FBQyxlQUFELENBQUQsQ0FBbUI2QyxNQUFuQixHQUE0QmlKLFFBQTVCLENBQXFDLEtBQXJDLENBQUosRUFBaUQ7RUFDaEQ2QixJQUFBQSxJQUFJLElBQUksVUFBUjtFQUNBOztFQUNELFNBQU9BLElBQVA7RUFDQTtFQUVNLFNBQVNyRCxHQUFULENBQWF4UCxJQUFiLEVBQW1CO0VBQ3pCa0YsRUFBQUEsQ0FBQyxDQUFDLE9BQUQsQ0FBRCxDQUFXaUYsTUFBWCxDQUFrQixVQUFTNUosQ0FBVCxFQUFZO0VBQzdCdVMsSUFBQUEsSUFBSSxDQUFDdlMsQ0FBRCxFQUFJUCxJQUFKLENBQUo7RUFDQSxHQUZEO0VBSUFrRixFQUFBQSxDQUFDLENBQUMsT0FBRCxDQUFELENBQVdNLEtBQVgsQ0FBaUIsVUFBUzRLLEVBQVQsRUFBYTtFQUM3QjJDLElBQUFBLE1BQUksQ0FBQy9TLElBQUQsQ0FBSjtFQUNBLEdBRkQ7RUFJQWtGLEVBQUFBLENBQUMsQ0FBQyxlQUFELENBQUQsQ0FBbUJNLEtBQW5CLENBQXlCLFVBQVM0SyxFQUFULEVBQWE7RUFDckMsUUFBSXlDLElBQUksR0FBR0QsZ0JBQWdCLEVBQTNCO0VBQ0EsUUFBSVQsR0FBSjs7RUFDQSxRQUFJO0VBQ0hBLE1BQUFBLEdBQUcsR0FBR0QsY0FBYyxFQUFwQjs7RUFDQSxVQUFHQyxHQUFHLENBQUNhLGlCQUFKLElBQXlCYixHQUFHLENBQUNhLGlCQUFKLENBQXNCQyxLQUF0QixLQUFnQyxDQUF6RCxJQUE4RGQsR0FBRyxDQUFDYSxpQkFBSixDQUFzQkUsTUFBdEIsS0FBaUMsQ0FBbEcsRUFBcUc7RUFDcEdMLFFBQUFBLElBQUksSUFBSSxzQkFBb0JWLEdBQUcsQ0FBQ2EsaUJBQUosQ0FBc0JDLEtBQTFDLEdBQWdELFVBQWhELEdBQTJEZCxHQUFHLENBQUNhLGlCQUFKLENBQXNCRSxNQUF6RjtFQUNBOztFQUVELFVBQUdmLEdBQUcsQ0FBQ2dCLGtCQUFKLElBQTBCaEIsR0FBRyxDQUFDZ0Isa0JBQUosQ0FBdUJGLEtBQXZCLEtBQWlDLENBQTNELElBQWdFZCxHQUFHLENBQUNnQixrQkFBSixDQUF1QkQsTUFBdkIsS0FBa0MsQ0FBckcsRUFBd0c7RUFDdkdMLFFBQUFBLElBQUksSUFBSSxzQkFBb0JWLEdBQUcsQ0FBQ2dCLGtCQUFKLENBQXVCRixLQUEzQyxHQUFpRCxVQUFqRCxHQUE0RGQsR0FBRyxDQUFDZ0Isa0JBQUosQ0FBdUJELE1BQTNGO0VBQ0E7RUFDRCxLQVRELENBU0UsT0FBTUUsR0FBTixFQUFXO0VBQUVqUixNQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxLQUFiLEVBQW9CK1AsR0FBcEI7RUFBMkI7O0VBQzFDa0IsSUFBQUEsWUFBWSxDQUFDclQsSUFBRCxFQUFPNlMsSUFBUCxDQUFaO0VBQ0EsR0FkRDtFQWdCQTNOLEVBQUFBLENBQUMsQ0FBQyxRQUFELENBQUQsQ0FBWU0sS0FBWixDQUFrQixVQUFTNEssRUFBVCxFQUFhO0VBQzlCa0QsSUFBQUEsS0FBSyxDQUFDQyxpQkFBaUIsQ0FBQ3ZULElBQUQsQ0FBbEIsQ0FBTDtFQUNBLEdBRkQ7RUFJQWtGLEVBQUFBLENBQUMsQ0FBQyxlQUFELENBQUQsQ0FBbUJNLEtBQW5CLENBQXlCLFVBQVM0SyxFQUFULEVBQWE7RUFDckNvRCxJQUFBQSxZQUFZLENBQUNELGlCQUFpQixDQUFDdlQsSUFBRCxDQUFsQixDQUFaO0VBQ0EsR0FGRDtFQUlBa0YsRUFBQUEsQ0FBQyxDQUFDLGVBQUQsQ0FBRCxDQUFtQk0sS0FBbkIsQ0FBeUIsVUFBUzRLLEVBQVQsRUFBYTtFQUNyQyxRQUFJcUQsUUFBUSxHQUFHQyxPQUFPLENBQUN4TyxDQUFDLENBQUMsS0FBRCxDQUFGLEVBQVcsVUFBWCxDQUF0QjtFQUNBQSxJQUFBQSxDQUFDLENBQUN5TyxJQUFGLENBQU9DLEtBQVAsQ0FBYTFPLENBQWIsRUFBZSxDQUFDdU8sUUFBRCxDQUFmLEVBQTJCSSxJQUEzQixDQUFnQyxZQUFXO0VBQzFDLFVBQUkzUCxHQUFHLEdBQUc0UCxTQUFTLENBQUNDLFNBQUQsRUFBWSxVQUFaLENBQW5COztFQUNBLFVBQUdDLE1BQUEsTUFBMEJBLElBQUEsRUFBN0IsRUFBbUQ7RUFDbEQsWUFBSUMsSUFBSSxHQUFDLGVBQWEvUCxHQUFHLENBQUNnUSxHQUFqQixHQUFxQix3QkFBOUI7RUFDQSxZQUFJQyxNQUFNLEdBQUdyRyxNQUFNLENBQUNzRyxJQUFQLEVBQWIsQ0FGa0Q7O0VBR2xERCxRQUFBQSxNQUFNLENBQUNwRSxRQUFQLENBQWdCc0UsS0FBaEIsQ0FBc0JKLElBQXRCO0VBQ0EsT0FKRCxNQUlPO0VBQ04sWUFBSW5RLENBQUMsR0FBS2lNLFFBQVEsQ0FBQ3VFLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBVjtFQUNBeFEsUUFBQUEsQ0FBQyxDQUFDa0ssSUFBRixHQUFVOUosR0FBRyxDQUFDZ1EsR0FBZDtFQUNBcFEsUUFBQUEsQ0FBQyxDQUFDeVEsUUFBRixHQUFhLFVBQWI7RUFDQXpRLFFBQUFBLENBQUMsQ0FBQ21HLE1BQUYsR0FBYSxRQUFiO0VBQ0E4RixRQUFBQSxRQUFRLENBQUN5RSxJQUFULENBQWNDLFdBQWQsQ0FBMEIzUSxDQUExQjtFQUE4QkEsUUFBQUEsQ0FBQyxDQUFDMEIsS0FBRjtFQUFXdUssUUFBQUEsUUFBUSxDQUFDeUUsSUFBVCxDQUFjRSxXQUFkLENBQTBCNVEsQ0FBMUI7RUFDekM7RUFDRCxLQWJEO0VBY0EsR0FoQkQ7RUFpQkE7RUFFRDtFQUNBO0VBQ0E7O0VBQ0EsU0FBU2dRLFNBQVQsQ0FBbUJwUixHQUFuQixFQUF3QjFCLElBQXhCLEVBQThCO0VBQzdCLFNBQU9rRSxDQUFDLENBQUN5UCxJQUFGLENBQU9qUyxHQUFQLEVBQVksVUFBU2tTLENBQVQsRUFBVztFQUFFLFdBQU9BLENBQUMsSUFBSUEsQ0FBQyxDQUFDNVQsSUFBRixJQUFVQSxJQUF0QjtFQUE2QixHQUF0RCxFQUF3RCxDQUF4RCxDQUFQO0VBQ0E7RUFFRDtFQUNBO0VBQ0E7OztFQUNPLFNBQVMwUyxPQUFULENBQWlCbUIsR0FBakIsRUFBc0JDLGFBQXRCLEVBQXFDckYsT0FBckMsRUFBOEM7RUFDcEQsTUFBSXNGLFFBQVEsR0FBRztFQUFDQyxJQUFBQSxPQUFPLEVBQUUsS0FBVjtFQUFpQkMsSUFBQUEsVUFBVSxFQUFFLENBQTdCO0VBQWdDQyxJQUFBQSxRQUFRLEVBQUU7RUFBMUMsR0FBZjtFQUNBLE1BQUcsQ0FBQ3pGLE9BQUosRUFBYUEsT0FBTyxHQUFHc0YsUUFBVjtFQUNiN1AsRUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPNE4sUUFBUCxFQUFpQixVQUFTdFQsR0FBVCxFQUFjNE0sS0FBZCxFQUFxQjtFQUNyQyxRQUFHLEVBQUU1TSxHQUFHLElBQUlnTyxPQUFULENBQUgsRUFBc0I7RUFBQ0EsTUFBQUEsT0FBTyxDQUFDaE8sR0FBRCxDQUFQLEdBQWU0TSxLQUFmO0VBQXNCO0VBQzdDLEdBRkQsRUFIb0Q7O0VBUXBELE1BQUl3RyxHQUFHLENBQUNNLElBQUosQ0FBUyxlQUFULEVBQTBCM1QsTUFBMUIsS0FBcUMsQ0FBekMsRUFBMkM7RUFDMUMsUUFBSTRULEtBQUssR0FBR0MsRUFBRSxDQUFDQyxNQUFILENBQVVULEdBQUcsQ0FBQ1UsR0FBSixDQUFRLENBQVIsQ0FBVixDQUFaO0VBQ0FILElBQUFBLEtBQUssQ0FBQzdGLE1BQU4sQ0FBYSxNQUFiLEVBQ0V2RyxJQURGLENBQ08sT0FEUCxFQUNnQixNQURoQixFQUVFQSxJQUZGLENBRU8sUUFGUCxFQUVpQixNQUZqQixFQUdFQSxJQUhGLENBR08sT0FIUCxFQUdnQixjQUhoQixFQUlFQSxJQUpGLENBSU8sTUFKUCxFQUllLE9BSmY7RUFLQW9NLElBQUFBLEtBQUssQ0FBQ0UsTUFBTixDQUFhLGVBQWIsRUFBOEJFLEtBQTlCO0VBQ0E7O0VBRUQsTUFBSS9CLFFBQVEsR0FBR3ZPLENBQUMsQ0FBQ3VRLFFBQUYsRUFBZjtFQUNBLE1BQUlDLE1BQUo7O0VBQ0EsTUFBSSxPQUFPNUgsTUFBTSxDQUFDNkgsYUFBZCxJQUErQixXQUFuQyxFQUFnRDtFQUMvQ0QsSUFBQUEsTUFBTSxHQUFJLElBQUlDLGFBQUosRUFBRCxDQUFzQkMsaUJBQXRCLENBQXdDZixHQUFHLENBQUNVLEdBQUosQ0FBUSxDQUFSLENBQXhDLENBQVQ7RUFDQSxHQUZELE1BRU8sSUFBSSxPQUFPVixHQUFHLENBQUNnQixHQUFYLElBQWtCLFdBQXRCLEVBQW1DO0VBQ3pDSCxJQUFBQSxNQUFNLEdBQUdiLEdBQUcsQ0FBQ1UsR0FBSixDQUFRLENBQVIsRUFBV00sR0FBcEI7RUFDQTs7RUFFRCxNQUFJQyxNQUFNLEdBQUcsK0JBQThCQyxJQUFJLENBQUNDLFFBQVEsQ0FBQ0Msa0JBQWtCLENBQUNQLE1BQUQsQ0FBbkIsQ0FBVCxDQUEvQyxDQTFCb0Q7O0VBMkJwRCxNQUFJUSxNQUFNLEdBQUduRyxRQUFRLENBQUN1RSxhQUFULENBQXVCLFFBQXZCLENBQWI7RUFDQTRCLEVBQUFBLE1BQU0sQ0FBQzdRLEtBQVAsR0FBZXdQLEdBQUcsQ0FBQ3hQLEtBQUosS0FBWW9LLE9BQU8sQ0FBQ3dGLFVBQW5DO0VBQ0FpQixFQUFBQSxNQUFNLENBQUM5RSxNQUFQLEdBQWdCeUQsR0FBRyxDQUFDekQsTUFBSixLQUFhM0IsT0FBTyxDQUFDd0YsVUFBckM7RUFDQSxNQUFJa0IsT0FBTyxHQUFHRCxNQUFNLENBQUNFLFVBQVAsQ0FBa0IsSUFBbEIsQ0FBZDtFQUNBLE1BQUlsQyxHQUFHLEdBQUduRSxRQUFRLENBQUN1RSxhQUFULENBQXVCLEtBQXZCLENBQVY7O0VBQ0FKLEVBQUFBLEdBQUcsQ0FBQ21DLE1BQUosR0FBYSxZQUFXO0VBQ3ZCLFFBQUdyQyxJQUFBLEVBQUgsRUFBeUI7RUFDeEI7RUFDQTBCLE1BQUFBLE1BQU0sR0FBR0EsTUFBTSxDQUFDWSxPQUFQLENBQWUseUJBQWYsRUFBMEMsRUFBMUMsQ0FBVDtFQUNBWixNQUFBQSxNQUFNLEdBQUdBLE1BQU0sQ0FBQ1ksT0FBUCxDQUFlLFNBQWYsRUFBMEIseUJBQTFCLENBQVQ7RUFDQSxVQUFJQyxDQUFDLEdBQUdDLEtBQUssQ0FBQ0MsS0FBTixDQUFZQyxVQUFaLENBQXVCUCxPQUF2QixFQUFnQ1QsTUFBaEMsRUFBd0M7RUFDL0NpQixRQUFBQSxVQUFVLEVBQUVULE1BQU0sQ0FBQzdRLEtBRDRCO0VBRS9DdVIsUUFBQUEsV0FBVyxFQUFFVixNQUFNLENBQUM5RSxNQUYyQjtFQUcvQ3lGLFFBQUFBLGdCQUFnQixFQUFFO0VBSDZCLE9BQXhDLENBQVI7RUFLQU4sTUFBQUEsQ0FBQyxDQUFDTyxLQUFGO0VBQ0EzVSxNQUFBQSxPQUFPLENBQUNpTCxHQUFSLENBQVkwSCxhQUFaLEVBQTJCckYsT0FBTyxDQUFDeUYsUUFBbkMsRUFBNkMsMkJBQTdDO0VBQ0EsS0FYRCxNQVdPO0VBQ05pQixNQUFBQSxPQUFPLENBQUNZLFNBQVIsQ0FBa0I3QyxHQUFsQixFQUF1QixDQUF2QixFQUEwQixDQUExQixFQUE2QmdDLE1BQU0sQ0FBQzdRLEtBQXBDLEVBQTJDNlEsTUFBTSxDQUFDOUUsTUFBbEQ7RUFDQWpQLE1BQUFBLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWTBILGFBQVosRUFBMkJyRixPQUFPLENBQUN5RixRQUFuQztFQUNBOztFQUNEekIsSUFBQUEsUUFBUSxDQUFDdUQsT0FBVCxDQUFpQjtFQUFDLGNBQVFsQyxhQUFUO0VBQXdCLG9CQUFjckYsT0FBTyxDQUFDd0YsVUFBOUM7RUFBMEQsYUFBTWlCLE1BQU0sQ0FBQ2UsU0FBUCxDQUFpQnhILE9BQU8sQ0FBQ3lGLFFBQXpCLEVBQW1DLENBQW5DLENBQWhFO0VBQXVHLFdBQUlnQixNQUFNLENBQUM3USxLQUFsSDtFQUF5SCxXQUFJNlEsTUFBTSxDQUFDOUU7RUFBcEksS0FBakI7RUFDQSxHQWpCRDs7RUFrQkE4QyxFQUFBQSxHQUFHLENBQUNnRCxHQUFKLEdBQVVwQixNQUFWO0VBQ0EsU0FBT3JDLFFBQVEsQ0FBQzBELE9BQVQsRUFBUDtFQUNBOztFQUVELFNBQVNDLFVBQVQsQ0FBb0JDLEdBQXBCLEVBQXlCQyxRQUF6QixFQUFtQztFQUNsQyxNQUFJQyxPQUFPLEdBQUcsRUFBZDtFQUNBLE1BQUk3VCxLQUFKO0VBQ0EsTUFBSThULENBQUMsR0FBRyxDQUFSO0VBQ0FGLEVBQUFBLFFBQVEsQ0FBQ0csU0FBVCxHQUFxQixDQUFyQjs7RUFDQSxTQUFRL1QsS0FBSyxHQUFHNFQsUUFBUSxDQUFDekosSUFBVCxDQUFjd0osR0FBZCxDQUFoQixFQUFxQztFQUNwQ0csSUFBQUEsQ0FBQzs7RUFDRCxRQUFHQSxDQUFDLEdBQUcsR0FBUCxFQUFZO0VBQ1hyVixNQUFBQSxPQUFPLENBQUN1VixLQUFSLENBQWMsa0NBQWQ7RUFDQSxhQUFPLENBQUMsQ0FBUjtFQUNBOztFQUNESCxJQUFBQSxPQUFPLENBQUM1VixJQUFSLENBQWErQixLQUFiOztFQUNBLFFBQUk0VCxRQUFRLENBQUNHLFNBQVQsS0FBdUIvVCxLQUFLLENBQUM4SSxLQUFqQyxFQUF3QztFQUN2QzhLLE1BQUFBLFFBQVEsQ0FBQ0csU0FBVDtFQUNBO0VBQ0Q7O0VBQ0QsU0FBT0YsT0FBUDtFQUNBOzs7RUFHRCxTQUFTSSxXQUFULENBQXFCQyxRQUFyQixFQUErQjtFQUM5QixNQUFJTCxPQUFPLEdBQUdILFVBQVUsQ0FBQ1EsUUFBRCxFQUFXLGtEQUFYLENBQXhCO0VBQ0EsTUFBR0wsT0FBTyxLQUFLLENBQUMsQ0FBaEIsRUFDQyxPQUFPLDJCQUFQO0VBRURyUyxFQUFBQSxDQUFDLENBQUNpQyxJQUFGLENBQU9vUSxPQUFQLEVBQWdCLFVBQVMvSyxLQUFULEVBQWdCOUksS0FBaEIsRUFBdUI7RUFDdEMsUUFBSW1VLEtBQUssR0FBSW5VLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBV0EsS0FBSyxDQUFDLENBQUQsQ0FBaEIsR0FBc0IsRUFBbkM7RUFDQSxRQUFJaUgsR0FBRyxHQUFHakgsS0FBSyxDQUFDLENBQUQsQ0FBZjtFQUNBLFFBQUlvVSxFQUFFLEdBQUcsVUFBVW5OLEdBQVYsR0FBZ0IsSUFBekI7RUFDQSxRQUFJb04sRUFBRSxHQUFHLFdBQVdGLEtBQVgsR0FBbUIsR0FBbkIsR0FBeUJsTixHQUF6QixHQUErQmtOLEtBQS9CLEdBQXVDLEtBQWhEO0VBRUEsUUFBSUcsTUFBTSxHQUFHck4sR0FBRyxHQUFDcUosTUFBQSxDQUFxQixDQUFyQixDQUFqQjtFQUNBNEQsSUFBQUEsUUFBUSxHQUFHQSxRQUFRLENBQUN0QixPQUFULENBQWlCLElBQUkxSSxNQUFKLENBQVdrSyxFQUFYLEVBQWUsR0FBZixDQUFqQixFQUFzQyxVQUFRRSxNQUFSLEdBQWUsSUFBckQsQ0FBWDtFQUNBSixJQUFBQSxRQUFRLEdBQUdBLFFBQVEsQ0FBQ3RCLE9BQVQsQ0FBaUIsSUFBSTFJLE1BQUosQ0FBV21LLEVBQVgsRUFBZSxHQUFmLENBQWpCLEVBQXNDLFVBQVFDLE1BQVIsR0FBZSxHQUFyRCxDQUFYO0VBQ0UsR0FUSDtFQVVBLFNBQU9KLFFBQVA7RUFDQTs7O0VBR00sU0FBU0ssUUFBVCxDQUFrQmpZLElBQWxCLEVBQXdCO0VBQzlCLE1BQUlrWSxRQUFRLEdBQUczRSxpQkFBaUIsQ0FBQ3ZULElBQUQsQ0FBaEM7RUFDQSxNQUFJb1YsS0FBSyxHQUFHQyxFQUFFLENBQUNDLE1BQUgsQ0FBVTRDLFFBQVEsQ0FBQzNDLEdBQVQsQ0FBYSxDQUFiLENBQVYsQ0FBWixDQUY4Qjs7RUFLOUJILEVBQUFBLEtBQUssQ0FBQytDLFNBQU4sQ0FBZ0IsK0dBQWhCLEVBQWlJN0ksTUFBakk7RUFDQThGLEVBQUFBLEtBQUssQ0FBQytDLFNBQU4sQ0FBZ0IsTUFBaEIsRUFDR0MsTUFESCxDQUNVLFlBQVU7RUFDbEIsV0FBTy9DLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0IvUCxJQUFoQixHQUF1Qi9ELE1BQXZCLEtBQWtDLENBQXpDO0VBQ0MsR0FISCxFQUdLOE4sTUFITDtFQUlBLFNBQU9wSyxDQUFDLENBQUN5UyxXQUFXLENBQUNPLFFBQVEsQ0FBQ2pFLElBQVQsRUFBRCxDQUFaLENBQVI7RUFDQTs7RUFHTSxTQUFTVixpQkFBVCxDQUEyQnZULElBQTNCLEVBQWlDO0VBQ3ZDLE1BQUlxUSxhQUFhLEdBQUc5QixPQUFBLENBQWlCdk8sSUFBakIsQ0FBcEIsQ0FEdUM7O0VBRXZDLE1BQUlxUSxhQUFhLEtBQUtuUSxTQUFsQixJQUErQm1RLGFBQWEsS0FBSyxJQUFyRCxFQUEyRDtFQUMxRHJRLElBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZXFPLGFBQWY7RUFDQTs7RUFFRCxNQUFJZ0ksZUFBZSxHQUFHQyxtQkFBbUIsQ0FBQ3RZLElBQUQsQ0FBekM7RUFDQSxNQUFJdVksT0FBTyxHQUFHclQsQ0FBQyxDQUFDLGFBQUQsQ0FBZixDQVB1Qzs7RUFRdkMsTUFBSTJQLEdBQUcsR0FBRzNQLENBQUMsQ0FBQyxNQUFJbEYsSUFBSSxDQUFDd1EsU0FBVixDQUFELENBQXNCMkUsSUFBdEIsQ0FBMkIsS0FBM0IsRUFBa0NxRCxLQUFsQyxHQUEwQ0MsUUFBMUMsQ0FBbURGLE9BQW5ELENBQVY7O0VBQ0EsTUFBR3ZZLElBQUksQ0FBQ3FGLEtBQUwsR0FBYWdULGVBQWUsQ0FBQ2hULEtBQTdCLElBQXNDckYsSUFBSSxDQUFDb1IsTUFBTCxHQUFjaUgsZUFBZSxDQUFDakgsTUFBcEUsSUFDQWlILGVBQWUsQ0FBQ2hULEtBQWhCLEdBQXdCLEdBRHhCLElBQytCZ1QsZUFBZSxDQUFDakgsTUFBaEIsR0FBeUIsR0FEM0QsRUFDZ0U7RUFDL0QsUUFBSXNILEdBQUcsR0FBR0wsZUFBZSxDQUFDaFQsS0FBMUI7RUFDQSxRQUFJc1QsR0FBRyxHQUFHTixlQUFlLENBQUNqSCxNQUFoQixHQUF5QixHQUFuQztFQUNBLFFBQUl3SCxLQUFLLEdBQUcsR0FBWjs7RUFFQSxRQUFHUCxlQUFlLENBQUNoVCxLQUFoQixHQUF3QixHQUF4QixJQUErQmdULGVBQWUsQ0FBQ2pILE1BQWhCLEdBQXlCLEdBQTNELEVBQWdFO0VBQUk7RUFDbkUsVUFBR2lILGVBQWUsQ0FBQ2hULEtBQWhCLEdBQXdCLEdBQTNCLEVBQWlDcVQsR0FBRyxHQUFHLEdBQU47RUFDakMsVUFBR0wsZUFBZSxDQUFDakgsTUFBaEIsR0FBeUIsR0FBNUIsRUFBaUN1SCxHQUFHLEdBQUcsR0FBTjtFQUNqQyxVQUFJRSxNQUFNLEdBQUdILEdBQUcsR0FBQ0wsZUFBZSxDQUFDaFQsS0FBakM7RUFDQSxVQUFJeVQsTUFBTSxHQUFHSCxHQUFHLEdBQUNOLGVBQWUsQ0FBQ2pILE1BQWpDO0VBQ0F3SCxNQUFBQSxLQUFLLEdBQUlDLE1BQU0sR0FBR0MsTUFBVCxHQUFrQkQsTUFBbEIsR0FBMkJDLE1BQXBDO0VBQ0E7O0VBRURqRSxJQUFBQSxHQUFHLENBQUM3TCxJQUFKLENBQVMsT0FBVCxFQUFrQjBQLEdBQWxCLEVBYitEOztFQWMvRDdELElBQUFBLEdBQUcsQ0FBQzdMLElBQUosQ0FBUyxRQUFULEVBQW1CMlAsR0FBbkI7RUFFQSxRQUFJSSxVQUFVLEdBQUksQ0FBQy9ZLElBQUksQ0FBQ3lOLFdBQU4sR0FBa0IsR0FBbEIsR0FBc0JtTCxLQUF4QztFQUNBL0QsSUFBQUEsR0FBRyxDQUFDTSxJQUFKLENBQVMsVUFBVCxFQUFxQm5NLElBQXJCLENBQTBCLFdBQTFCLEVBQXVDLGtCQUFnQitQLFVBQWhCLEdBQTJCLFVBQTNCLEdBQXNDSCxLQUF0QyxHQUE0QyxHQUFuRjtFQUNBOztFQUNELFNBQU9MLE9BQVA7RUFDQTs7RUFHTSxTQUFTL0UsWUFBVCxDQUFzQnFCLEdBQXRCLEVBQTBCO0VBQ2hDLE1BQUkvUSxDQUFDLEdBQUtpTSxRQUFRLENBQUN1RSxhQUFULENBQXVCLEdBQXZCLENBQVY7RUFDQXhRLEVBQUFBLENBQUMsQ0FBQ2tLLElBQUYsR0FBVSwrQkFBOEIrSCxJQUFJLENBQUVDLFFBQVEsQ0FBRUMsa0JBQWtCLENBQUVwQixHQUFHLENBQUNaLElBQUosRUFBRixDQUFwQixDQUFWLENBQTVDO0VBQ0FuUSxFQUFBQSxDQUFDLENBQUN5USxRQUFGLEdBQWEsVUFBYjtFQUNBelEsRUFBQUEsQ0FBQyxDQUFDbUcsTUFBRixHQUFhLFFBQWI7RUFDQThGLEVBQUFBLFFBQVEsQ0FBQ3lFLElBQVQsQ0FBY0MsV0FBZCxDQUEwQjNRLENBQTFCO0VBQThCQSxFQUFBQSxDQUFDLENBQUMwQixLQUFGO0VBQVd1SyxFQUFBQSxRQUFRLENBQUN5RSxJQUFULENBQWNFLFdBQWQsQ0FBMEI1USxDQUExQjtFQUN6Qzs7RUFHTSxTQUFTd1AsS0FBVCxDQUFlMEYsRUFBZixFQUFtQnBWLEVBQW5CLEVBQXNCO0VBQzVCLE1BQUdvVixFQUFFLENBQUNDLFdBQUgsS0FBbUJDLEtBQXRCLEVBQ0NGLEVBQUUsR0FBRyxDQUFDQSxFQUFELENBQUw7RUFFRCxNQUFJM1QsS0FBSyxHQUFHSCxDQUFDLENBQUM0SSxNQUFELENBQUQsQ0FBVXpJLEtBQVYsS0FBa0IsR0FBOUI7RUFDQSxNQUFJK0wsTUFBTSxHQUFHbE0sQ0FBQyxDQUFDNEksTUFBRCxDQUFELENBQVVzRCxNQUFWLEtBQW1CLEVBQWhDO0VBQ0EsTUFBSStILFFBQVEsR0FBRyxDQUNkLHlCQURjLEVBRWQsMEVBRmMsQ0FBZjtFQUlBLE1BQUlDLFdBQVcsR0FBR3RMLE1BQU0sQ0FBQ3NHLElBQVAsQ0FBWSxFQUFaLEVBQWdCLFVBQWhCLEVBQTRCLFdBQVcvTyxLQUFYLEdBQW1CLFVBQW5CLEdBQWdDK0wsTUFBNUQsQ0FBbEI7RUFDQSxNQUFJaUksV0FBVyxHQUFHLEVBQWxCOztFQUNBLE9BQUksSUFBSTlYLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQzRYLFFBQVEsQ0FBQzNYLE1BQXhCLEVBQWdDRCxDQUFDLEVBQWpDO0VBQ0M4WCxJQUFBQSxXQUFXLElBQUksaUJBQWVGLFFBQVEsQ0FBQzVYLENBQUQsQ0FBdkIsR0FBMkIsaURBQTFDO0VBREQ7O0VBRUE4WCxFQUFBQSxXQUFXLElBQUksNkJBQTZCblUsQ0FBQyxDQUFDLE1BQUQsQ0FBRCxDQUFVb1UsR0FBVixDQUFjLFdBQWQsQ0FBN0IsR0FBMEQsWUFBekU7RUFFQSxNQUFJckYsSUFBSSxHQUFHLEVBQVg7O0VBQ0EsT0FBSSxJQUFJMVMsR0FBQyxHQUFDLENBQVYsRUFBYUEsR0FBQyxHQUFDeVgsRUFBRSxDQUFDeFgsTUFBbEIsRUFBMEJELEdBQUMsRUFBM0IsRUFBK0I7RUFDOUIsUUFBR0EsR0FBQyxLQUFLLENBQU4sSUFBV3FDLEVBQWQsRUFDQ3FRLElBQUksSUFBSXJRLEVBQVI7RUFDRHFRLElBQUFBLElBQUksSUFBSS9PLENBQUMsQ0FBQzhULEVBQUUsQ0FBQ3pYLEdBQUQsQ0FBSCxDQUFELENBQVMwUyxJQUFULEVBQVI7RUFDQSxRQUFHMVMsR0FBQyxHQUFHeVgsRUFBRSxDQUFDeFgsTUFBSCxHQUFVLENBQWpCLEVBQ0N5UyxJQUFJLElBQUksaUNBQVI7RUFDRDs7RUFFRG1GLEVBQUFBLFdBQVcsQ0FBQ3JKLFFBQVosQ0FBcUJzRSxLQUFyQixDQUEyQmdGLFdBQTNCO0VBQ0FELEVBQUFBLFdBQVcsQ0FBQ3JKLFFBQVosQ0FBcUJzRSxLQUFyQixDQUEyQkosSUFBM0I7RUFDQW1GLEVBQUFBLFdBQVcsQ0FBQ3JKLFFBQVosQ0FBcUJ3SixLQUFyQjtFQUVBSCxFQUFBQSxXQUFXLENBQUNJLEtBQVo7RUFDQUMsRUFBQUEsVUFBVSxDQUFDLFlBQVc7RUFDckJMLElBQUFBLFdBQVcsQ0FBQzlGLEtBQVo7RUFDQThGLElBQUFBLFdBQVcsQ0FBQ0csS0FBWjtFQUNBLEdBSFMsRUFHUCxHQUhPLENBQVY7RUFJQTs7RUFHTSxTQUFTRyxTQUFULENBQW1CMVosSUFBbkIsRUFBeUIyWixPQUF6QixFQUFrQ0MsUUFBbEMsRUFBNENDLElBQTVDLEVBQWlEO0VBQ3ZELE1BQUc3WixJQUFJLENBQUNtTixLQUFSLEVBQ0NoTCxPQUFPLENBQUNpTCxHQUFSLENBQVl1TSxPQUFaO0VBQ0QsTUFBRyxDQUFDQyxRQUFKLEVBQWNBLFFBQVEsR0FBRyxTQUFYO0VBQ2QsTUFBRyxDQUFDQyxJQUFKLEVBQVVBLElBQUksR0FBRyxZQUFQO0VBRVIsTUFBSUMsSUFBSSxHQUFHLElBQUlDLElBQUosQ0FBUyxDQUFDSixPQUFELENBQVQsRUFBb0I7RUFBQ0UsSUFBQUEsSUFBSSxFQUFFQTtFQUFQLEdBQXBCLENBQVg7RUFDQSxNQUFJL0wsTUFBTSxDQUFDdkssU0FBUCxDQUFpQnlXLGdCQUFyQjtFQUNDbE0sSUFBQUEsTUFBTSxDQUFDdkssU0FBUCxDQUFpQnlXLGdCQUFqQixDQUFrQ0YsSUFBbEMsRUFBd0NGLFFBQXhDLEVBREQsS0FFSztFQUFXO0VBQ2YsUUFBSTlWLENBQUMsR0FBR2lNLFFBQVEsQ0FBQ3VFLGFBQVQsQ0FBdUIsR0FBdkIsQ0FBUjtFQUNBLFFBQUkyRixHQUFHLEdBQUdDLEdBQUcsQ0FBQ0MsZUFBSixDQUFvQkwsSUFBcEIsQ0FBVjtFQUNBaFcsSUFBQUEsQ0FBQyxDQUFDa0ssSUFBRixHQUFTaU0sR0FBVDtFQUNBblcsSUFBQUEsQ0FBQyxDQUFDeVEsUUFBRixHQUFhcUYsUUFBYjtFQUNBN0osSUFBQUEsUUFBUSxDQUFDeUUsSUFBVCxDQUFjQyxXQUFkLENBQTBCM1EsQ0FBMUI7RUFDQUEsSUFBQUEsQ0FBQyxDQUFDMEIsS0FBRjtFQUNBaVUsSUFBQUEsVUFBVSxDQUFDLFlBQVc7RUFDckIxSixNQUFBQSxRQUFRLENBQUN5RSxJQUFULENBQWNFLFdBQWQsQ0FBMEI1USxDQUExQjtFQUNBZ0ssTUFBQUEsTUFBTSxDQUFDb00sR0FBUCxDQUFXRSxlQUFYLENBQTJCSCxHQUEzQjtFQUNGLEtBSFcsRUFHVCxDQUhTLENBQVY7RUFJRjtFQUNEO0VBRU0sU0FBU2xILE1BQVQsQ0FBYy9TLElBQWQsRUFBbUI7RUFDekIsTUFBSTJaLE9BQU8sR0FBRzFYLElBQUksQ0FBQ0MsU0FBTCxDQUFlcU0sT0FBQSxDQUFpQnZPLElBQWpCLENBQWYsQ0FBZDtFQUNBMFosRUFBQUEsU0FBUyxDQUFDMVosSUFBRCxFQUFPMlosT0FBUCxDQUFUO0VBQ0E7RUFFTSxTQUFTdEcsWUFBVCxDQUFzQnJULElBQXRCLEVBQTRCNlMsSUFBNUIsRUFBaUM7RUFDdkM2RyxFQUFBQSxTQUFTLENBQUMxWixJQUFELEVBQU9xYSxjQUFjLENBQUNDLHFCQUFmLENBQXFDL0wsT0FBQSxDQUFpQnZPLElBQWpCLENBQXJDLEVBQTZENlMsSUFBN0QsQ0FBUCxFQUEyRSxhQUEzRSxDQUFUO0VBQ0E7RUFFTSxTQUFTMEgsa0JBQVQsQ0FBNEJ2YSxJQUE1QixFQUFrQztFQUN4Q2tGLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBT25ILElBQUksQ0FBQ2dDLE9BQVosRUFBcUIsVUFBU3NJLEdBQVQsRUFBY2hELENBQWQsRUFBaUI7RUFDckMsUUFBRyxDQUFDQSxDQUFDLENBQUNVLE1BQUgsSUFBYVYsQ0FBQyxDQUFDdUQsR0FBRixLQUFVLEdBQXZCLElBQThCLENBQUNtSixTQUFBLENBQXdCMU0sQ0FBeEIsQ0FBbEMsRUFBOEQ7RUFDN0QsVUFBR0EsQ0FBQyxDQUFDeUssT0FBTyxDQUFDLGdCQUFELENBQVIsQ0FBSixFQUFpQztFQUNoQyxZQUFJL00sR0FBRyxHQUFHLHlCQUF1QnNDLENBQUMsQ0FBQ2tULFlBQXpCLEdBQXNDLDRDQUF0QyxHQUNOLCtFQURNLEdBRU4sMkJBRko7RUFHQXJZLFFBQUFBLE9BQU8sQ0FBQ3VWLEtBQVIsQ0FBYzFTLEdBQWQ7RUFDQSxlQUFPc0MsQ0FBQyxDQUFDeUssT0FBTyxDQUFDLGdCQUFELENBQVIsQ0FBUjtFQUNBaUMsUUFBQUEsUUFBQSxDQUF1QixTQUF2QixFQUFrQ2hQLEdBQWxDO0VBQ0E7RUFDRDtFQUNELEdBWEQ7RUFZQTtFQUVNLFNBQVM4TixJQUFULENBQWN2UyxDQUFkLEVBQWlCUCxJQUFqQixFQUF1QjtFQUM3QixNQUFJMkgsQ0FBQyxHQUFHcEgsQ0FBQyxDQUFDMEosTUFBRixDQUFTd1EsS0FBVCxDQUFlLENBQWYsQ0FBUjs7RUFDQSxNQUFHOVMsQ0FBSCxFQUFNO0VBQ0wsUUFBSStTLFlBQUo7RUFDQSxRQUFJQyxNQUFNLEdBQUcsSUFBSUMsVUFBSixFQUFiOztFQUNBRCxJQUFBQSxNQUFNLENBQUN0RSxNQUFQLEdBQWdCLFVBQVM5VixDQUFULEVBQVk7RUFDM0IsVUFBR1AsSUFBSSxDQUFDbU4sS0FBUixFQUNDaEwsT0FBTyxDQUFDaUwsR0FBUixDQUFZN00sQ0FBQyxDQUFDMEosTUFBRixDQUFTNFEsTUFBckI7O0VBQ0QsVUFBSTtFQUNILFlBQUd0YSxDQUFDLENBQUMwSixNQUFGLENBQVM0USxNQUFULENBQWdCQyxVQUFoQixDQUEyQiwwQ0FBM0IsQ0FBSCxFQUEyRTtFQUMxRTlhLFVBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZStZLGNBQWMsQ0FBQ3hhLENBQUMsQ0FBQzBKLE1BQUYsQ0FBUzRRLE1BQVYsRUFBa0IsQ0FBbEIsQ0FBN0I7RUFDQU4sVUFBQUEsa0JBQWtCLENBQUN2YSxJQUFELENBQWxCO0VBQ0EsU0FIRCxNQUdPLElBQUdPLENBQUMsQ0FBQzBKLE1BQUYsQ0FBUzRRLE1BQVQsQ0FBZ0JDLFVBQWhCLENBQTJCLDBDQUEzQixDQUFILEVBQTJFO0VBQ2pGOWEsVUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlK1ksY0FBYyxDQUFDeGEsQ0FBQyxDQUFDMEosTUFBRixDQUFTNFEsTUFBVixFQUFrQixDQUFsQixDQUE3QjtFQUNBTixVQUFBQSxrQkFBa0IsQ0FBQ3ZhLElBQUQsQ0FBbEI7RUFDQSxTQUhNLE1BR0EsSUFBR08sQ0FBQyxDQUFDMEosTUFBRixDQUFTNFEsTUFBVCxDQUFnQkMsVUFBaEIsQ0FBMkIsSUFBM0IsS0FBb0N2YSxDQUFDLENBQUMwSixNQUFGLENBQVM0USxNQUFULENBQWdCblosT0FBaEIsQ0FBd0IsU0FBeEIsTUFBdUMsQ0FBQyxDQUEvRSxFQUFrRjtFQUN4RixjQUFJc1osWUFBWSxHQUFHQyxhQUFhLENBQUMxYSxDQUFDLENBQUMwSixNQUFGLENBQVM0USxNQUFWLENBQWhDO0VBQ0FILFVBQUFBLFlBQVksR0FBR00sWUFBWSxDQUFDLENBQUQsQ0FBM0I7RUFDQWhiLFVBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZWdaLFlBQVksQ0FBQyxDQUFELENBQTNCO0VBQ0FULFVBQUFBLGtCQUFrQixDQUFDdmEsSUFBRCxDQUFsQjtFQUNBLFNBTE0sTUFLQTtFQUNOLGNBQUk7RUFDSEEsWUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlQyxJQUFJLENBQUNNLEtBQUwsQ0FBV2hDLENBQUMsQ0FBQzBKLE1BQUYsQ0FBUzRRLE1BQXBCLENBQWY7RUFDQSxXQUZELENBRUUsT0FBTXpILEdBQU4sRUFBVztFQUNacFQsWUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFla1osV0FBVyxDQUFDM2EsQ0FBQyxDQUFDMEosTUFBRixDQUFTNFEsTUFBVixDQUExQjtFQUNBO0VBQ0Q7O0VBQ0RNLFFBQUFBLGlCQUFpQixDQUFDbmIsSUFBRCxDQUFqQjtFQUNBLE9BcEJELENBb0JFLE9BQU1vYixJQUFOLEVBQVk7RUFDYmpaLFFBQUFBLE9BQU8sQ0FBQ3VWLEtBQVIsQ0FBYzBELElBQWQsRUFBb0I3YSxDQUFDLENBQUMwSixNQUFGLENBQVM0USxNQUE3QjtFQUNBN0csUUFBQUEsUUFBQSxDQUF1QixZQUF2QixFQUF1Q29ILElBQUksQ0FBQ0MsT0FBTCxHQUFlRCxJQUFJLENBQUNDLE9BQXBCLEdBQThCRCxJQUFyRTtFQUNBO0VBQ0E7O0VBQ0RqWixNQUFBQSxPQUFPLENBQUNpTCxHQUFSLENBQVlwTixJQUFJLENBQUNnQyxPQUFqQjs7RUFDQSxVQUFHO0VBQ0Y0TSxRQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7O0VBQ0EsWUFBRzBhLFlBQVksS0FBS3hhLFNBQXBCLEVBQStCO0VBQzlCaUMsVUFBQUEsT0FBTyxDQUFDaUwsR0FBUixDQUFZc04sWUFBWixFQUQ4Qjs7RUFHOUJ4VixVQUFBQSxDQUFDLENBQUM2SyxRQUFELENBQUQsQ0FBWTBCLE9BQVosQ0FBb0Isa0JBQXBCLEVBQXdDLENBQUN6UixJQUFELEVBQU8wYSxZQUFQLENBQXhDO0VBQ0E7O0VBQ0R4VixRQUFBQSxDQUFDLENBQUM2SyxRQUFELENBQUQsQ0FBWTBCLE9BQVosQ0FBb0IsVUFBcEIsRUFBZ0MsQ0FBQ3pSLElBQUQsQ0FBaEMsRUFQRTs7RUFTRixZQUFJO0VBQ0g7RUFDQXNiLFVBQUFBLGtCQUFrQjtFQUNsQkMsVUFBQUEsaUJBQWlCO0VBQ2pCQyxVQUFBQSxNQUFNLENBQUNDLGlCQUFQLEdBQTJCLElBQTNCO0VBQ0EsU0FMRCxDQUtFLE9BQU1DLElBQU4sRUFBWTtFQUViO0VBQ0QsT0FqQkQsQ0FpQkUsT0FBTUMsSUFBTixFQUFZO0VBQ2IzSCxRQUFBQSxRQUFBLENBQXVCLFlBQXZCLEVBQXVDMkgsSUFBSSxDQUFDTixPQUFMLEdBQWVNLElBQUksQ0FBQ04sT0FBcEIsR0FBOEJNLElBQXJFO0VBQ0E7RUFDRCxLQWpERDs7RUFrREFoQixJQUFBQSxNQUFNLENBQUNpQixPQUFQLEdBQWlCLFVBQVNDLEtBQVQsRUFBZ0I7RUFDaEM3SCxNQUFBQSxRQUFBLENBQXVCLFlBQXZCLEVBQXFDLGtDQUFrQzZILEtBQUssQ0FBQzVSLE1BQU4sQ0FBYXlOLEtBQWIsQ0FBbUJvRSxJQUExRjtFQUNBLEtBRkQ7O0VBR0FuQixJQUFBQSxNQUFNLENBQUNvQixVQUFQLENBQWtCcFUsQ0FBbEI7RUFDQSxHQXpERCxNQXlETztFQUNOeEYsSUFBQUEsT0FBTyxDQUFDdVYsS0FBUixDQUFjLHlCQUFkO0VBQ0E7O0VBQ0R4UyxFQUFBQSxDQUFDLENBQUMsT0FBRCxDQUFELENBQVcsQ0FBWCxFQUFjbUosS0FBZCxHQUFzQixFQUF0QixDQTlENkI7RUErRDdCO0VBR0Q7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7O0VBQ08sU0FBUzZNLFdBQVQsQ0FBcUJjLGNBQXJCLEVBQXFDO0VBQzNDLE1BQUlDLEtBQUssR0FBR0QsY0FBYyxDQUFDMUosSUFBZixHQUFzQjRKLEtBQXRCLENBQTRCLElBQTVCLENBQVo7RUFDQSxNQUFJQyxHQUFHLEdBQUcsRUFBVjtFQUNBLE1BQUlDLEtBQUo7O0VBQ0EsT0FBSSxJQUFJN2EsQ0FBQyxHQUFHLENBQVosRUFBY0EsQ0FBQyxHQUFHMGEsS0FBSyxDQUFDemEsTUFBeEIsRUFBK0JELENBQUMsRUFBaEMsRUFBbUM7RUFDaEMsUUFBSXlILElBQUksR0FBRzlELENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTXVSLEtBQUssQ0FBQzFhLENBQUQsQ0FBTCxDQUFTK1EsSUFBVCxHQUFnQjRKLEtBQWhCLENBQXNCLEtBQXRCLENBQU4sRUFBb0MsVUFBU3ZSLEdBQVQsRUFBY0MsRUFBZCxFQUFpQjtFQUFDLGFBQU9ELEdBQUcsQ0FBQzJILElBQUosRUFBUDtFQUFtQixLQUF6RSxDQUFYO0VBQ0EsUUFBR3RKLElBQUksQ0FBQ3hILE1BQUwsR0FBYyxDQUFqQixFQUNDLE1BQU0sZ0JBQU47RUFDRCxRQUFJcUosR0FBRyxHQUFJN0IsSUFBSSxDQUFDLENBQUQsQ0FBSixJQUFXLEdBQVgsR0FBaUIsR0FBakIsR0FBd0JBLElBQUksQ0FBQyxDQUFELENBQUosSUFBVyxHQUFYLEdBQWlCLEdBQWpCLEdBQXVCLEdBQTFEO0VBQ0EsUUFBSXFULElBQUksR0FBRztFQUNaLGVBQVNyVCxJQUFJLENBQUMsQ0FBRCxDQUREO0VBRVosc0JBQWdCQSxJQUFJLENBQUMsQ0FBRCxDQUZSO0VBR1osY0FBUUEsSUFBSSxDQUFDLENBQUQsQ0FIQTtFQUlaLGFBQU82QjtFQUpLLEtBQVg7RUFNRixRQUFHN0IsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFZLEdBQWYsRUFBb0JxVCxJQUFJLENBQUM3VSxNQUFMLEdBQWN3QixJQUFJLENBQUMsQ0FBRCxDQUFsQjtFQUNwQixRQUFHQSxJQUFJLENBQUMsQ0FBRCxDQUFKLEtBQVksR0FBZixFQUFvQnFULElBQUksQ0FBQzlVLE1BQUwsR0FBY3lCLElBQUksQ0FBQyxDQUFELENBQWxCOztFQUVwQixRQUFJLE9BQU9vVCxLQUFQLElBQWdCLFdBQWhCLElBQStCQSxLQUFLLEtBQUtDLElBQUksQ0FBQ0QsS0FBbEQsRUFBeUQ7RUFDeERqYSxNQUFBQSxPQUFPLENBQUN1VixLQUFSLENBQWMsa0RBQWdEMEUsS0FBOUQ7RUFDQTtFQUNBOztFQUNELFFBQUdwVCxJQUFJLENBQUMsQ0FBRCxDQUFKLElBQVcsR0FBZCxFQUFtQnFULElBQUksQ0FBQ0MsUUFBTCxHQUFnQixDQUFoQixDQWxCZTs7RUFvQmxDLFFBQUd0VCxJQUFJLENBQUN4SCxNQUFMLEdBQWMsQ0FBakIsRUFBb0I7RUFDbkI2YSxNQUFBQSxJQUFJLENBQUNFLE9BQUwsR0FBZSxFQUFmOztFQUNBLFdBQUksSUFBSWxWLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQzJCLElBQUksQ0FBQ3hILE1BQXBCLEVBQTRCNkYsQ0FBQyxJQUFFLENBQS9CLEVBQWtDO0VBQ2pDZ1YsUUFBQUEsSUFBSSxDQUFDRSxPQUFMLElBQWdCdlQsSUFBSSxDQUFDM0IsQ0FBRCxDQUFKLEdBQVUsR0FBVixHQUFnQjJCLElBQUksQ0FBQzNCLENBQUMsR0FBQyxDQUFILENBQXBCLEdBQTRCLEdBQTVDO0VBQ0E7RUFDRDs7RUFFRDhVLElBQUFBLEdBQUcsQ0FBQ0ssT0FBSixDQUFZSCxJQUFaO0VBQ0FELElBQUFBLEtBQUssR0FBR3BULElBQUksQ0FBQyxDQUFELENBQVo7RUFDQTs7RUFDRCxTQUFPeVQsV0FBVyxDQUFDTixHQUFELENBQWxCO0VBQ0E7RUFFTSxTQUFTbEIsYUFBVCxDQUF1QmUsY0FBdkIsRUFBdUM7RUFDN0MsTUFBSUMsS0FBSyxHQUFHRCxjQUFjLENBQUMxSixJQUFmLEdBQXNCNEosS0FBdEIsQ0FBNEIsSUFBNUIsQ0FBWjtFQUNBLE1BQUlDLEdBQUcsR0FBRyxFQUFWO0VBQ0EsTUFBSU8sR0FBRyxHQUFHLEVBQVYsQ0FINkM7RUFJN0M7O0VBSjZDLDZCQUtyQ25iLENBTHFDO0VBTTVDLFFBQUlvYixFQUFFLEdBQUdWLEtBQUssQ0FBQzFhLENBQUQsQ0FBTCxDQUFTK1EsSUFBVCxFQUFUOztFQUNBLFFBQUdxSyxFQUFFLENBQUM3QixVQUFILENBQWMsSUFBZCxDQUFILEVBQXdCO0VBQ3ZCLFVBQUc2QixFQUFFLENBQUM3QixVQUFILENBQWMsV0FBZCxLQUE4QjZCLEVBQUUsQ0FBQ2piLE9BQUgsQ0FBVyxHQUFYLElBQWtCLENBQUMsQ0FBcEQsRUFBdUQ7RUFBSTtFQUMxRCxZQUFJa2IsR0FBRyxHQUFHRCxFQUFFLENBQUNULEtBQUgsQ0FBUyxHQUFULENBQVY7O0VBQ0EsYUFBSSxJQUFJN1UsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDdVYsR0FBRyxDQUFDcGIsTUFBbkIsRUFBMkI2RixDQUFDLEVBQTVCLEVBQWdDO0VBQy9CLGNBQUl3VixNQUFNLEdBQUdELEdBQUcsQ0FBQ3ZWLENBQUQsQ0FBSCxDQUFPNlUsS0FBUCxDQUFhLEdBQWIsQ0FBYjs7RUFDQSxjQUFHVyxNQUFNLENBQUNyYixNQUFQLEtBQWtCLENBQXJCLEVBQXdCO0VBQ3ZCa2IsWUFBQUEsR0FBRyxDQUFDL2EsSUFBSixDQUFTaWIsR0FBRyxDQUFDdlYsQ0FBRCxDQUFaO0VBQ0E7RUFDRDtFQUNEOztFQUNELFVBQUdzVixFQUFFLENBQUNqYixPQUFILENBQVcsU0FBWCxNQUEwQixDQUFDLENBQTNCLElBQWdDLENBQUNpYixFQUFFLENBQUM3QixVQUFILENBQWMsU0FBZCxDQUFwQyxFQUE4RDtFQUM3RDRCLFFBQUFBLEdBQUcsQ0FBQy9hLElBQUosQ0FBU2diLEVBQUUsQ0FBQ3JHLE9BQUgsQ0FBVyxJQUFYLEVBQWlCLEVBQWpCLENBQVQ7RUFDQTs7RUFDRDtFQUNBOztFQUVELFFBQUl3RyxLQUFLLEdBQUcsSUFBWjs7RUFDQSxRQUFHSCxFQUFFLENBQUNqYixPQUFILENBQVcsSUFBWCxJQUFtQixDQUF0QixFQUF5QjtFQUN4Qm9iLE1BQUFBLEtBQUssR0FBRyxLQUFSO0VBQ0EzYSxNQUFBQSxPQUFPLENBQUNpTCxHQUFSLENBQVksZUFBWjtFQUNBOztFQUNELFFBQUlwRSxJQUFJLEdBQUc5RCxDQUFDLENBQUN3RixHQUFGLENBQU1pUyxFQUFFLENBQUNULEtBQUgsQ0FBU1ksS0FBVCxDQUFOLEVBQXVCLFVBQVNuUyxHQUFULEVBQWNDLEVBQWQsRUFBaUI7RUFBQyxhQUFPRCxHQUFHLENBQUMySCxJQUFKLEVBQVA7RUFBbUIsS0FBNUQsQ0FBWDs7RUFFQSxRQUFHdEosSUFBSSxDQUFDeEgsTUFBTCxHQUFjLENBQWpCLEVBQW9CO0VBQ25CLFVBQUk2YSxJQUFJLEdBQUc7RUFDVixpQkFBU3JULElBQUksQ0FBQyxDQUFELENBREg7RUFFVix3QkFBZ0JBLElBQUksQ0FBQyxDQUFELENBRlY7RUFHVixnQkFBUUEsSUFBSSxDQUFDLENBQUQsQ0FIRjtFQUlWLGVBQU9BLElBQUksQ0FBQyxDQUFELENBSkQ7RUFLVixrQkFBVUEsSUFBSSxDQUFDLENBQUQ7RUFMSixPQUFYO0VBT0EsVUFBR0EsSUFBSSxDQUFDLENBQUQsQ0FBSixJQUFXLENBQWQsRUFBaUJxVCxJQUFJLENBQUNsVCxPQUFMLEdBQWUsSUFBZjtFQUNqQixVQUFHSCxJQUFJLENBQUMsQ0FBRCxDQUFKLEtBQVksR0FBZixFQUFvQnFULElBQUksQ0FBQzdVLE1BQUwsR0FBY3dCLElBQUksQ0FBQyxDQUFELENBQWxCO0VBQ3BCLFVBQUdBLElBQUksQ0FBQyxDQUFELENBQUosS0FBWSxHQUFmLEVBQW9CcVQsSUFBSSxDQUFDOVUsTUFBTCxHQUFjeUIsSUFBSSxDQUFDLENBQUQsQ0FBbEI7RUFDcEIsVUFBR0EsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFZLEdBQWYsRUFBb0JxVCxJQUFJLENBQUM1VCxNQUFMLEdBQWNPLElBQUksQ0FBQyxDQUFELENBQWxCO0VBQ3BCLFVBQUdBLElBQUksQ0FBQyxDQUFELENBQUosS0FBWSxHQUFmLEVBQW9CcVQsSUFBSSxDQUFDM1csR0FBTCxHQUFXc0QsSUFBSSxDQUFDLENBQUQsQ0FBZjtFQUNwQixVQUFHQSxJQUFJLENBQUMsRUFBRCxDQUFKLEtBQWEsR0FBaEIsRUFBcUJxVCxJQUFJLENBQUMxVyxHQUFMLEdBQVdxRCxJQUFJLENBQUMsRUFBRCxDQUFmO0VBRXJCLFVBQUlzQixHQUFHLEdBQUcsRUFBVjtFQUNBcEYsTUFBQUEsQ0FBQyxDQUFDaUMsSUFBRixDQUFPNEssT0FBUCxFQUFnQixVQUFTZ0wsTUFBVCxFQUFpQkMsYUFBakIsRUFBZ0M7RUFDL0M7RUFDQSxZQUFHaFUsSUFBSSxDQUFDc0IsR0FBRCxDQUFKLEtBQWMsR0FBakIsRUFBc0I7RUFDckIrUixVQUFBQSxJQUFJLENBQUNXLGFBQUQsQ0FBSixHQUFzQmhVLElBQUksQ0FBQ3NCLEdBQUQsQ0FBMUI7RUFDQTs7RUFDREEsUUFBQUEsR0FBRztFQUNILE9BTkQ7RUFRQSxVQUFHdEIsSUFBSSxDQUFDc0IsR0FBRyxFQUFKLENBQUosS0FBZ0IsR0FBbkIsRUFBd0IrUixJQUFJLENBQUNZLFNBQUwsR0FBaUIsQ0FBakIsQ0F4Qkw7RUEwQm5CO0VBQ0E7O0VBQ0EsV0FBSSxJQUFJNVYsRUFBQyxHQUFDLENBQVYsRUFBYUEsRUFBQyxHQUFDMkssWUFBWSxDQUFDeFEsTUFBNUIsRUFBb0M2RixFQUFDLEVBQXJDLEVBQXlDO0VBQ3hDLFlBQUk2VixTQUFTLEdBQUdsVSxJQUFJLENBQUNzQixHQUFELENBQUosQ0FBVTRSLEtBQVYsQ0FBZ0IsR0FBaEIsQ0FBaEI7O0VBQ0EsWUFBR2dCLFNBQVMsQ0FBQyxDQUFELENBQVQsS0FBaUIsR0FBcEIsRUFBeUI7RUFDeEIsY0FBRyxDQUFDQSxTQUFTLENBQUMsQ0FBRCxDQUFULEtBQWlCLEdBQWpCLElBQXdCQSxTQUFTLENBQUMsQ0FBRCxDQUFULEtBQWlCLEdBQTFDLE1BQW1EQSxTQUFTLENBQUMsQ0FBRCxDQUFULEtBQWlCLEdBQWpCLElBQXdCQSxTQUFTLENBQUMsQ0FBRCxDQUFULEtBQWlCLEdBQTVGLENBQUgsRUFDQ2IsSUFBSSxDQUFDckssWUFBWSxDQUFDM0ssRUFBRCxDQUFaLEdBQWtCLFlBQW5CLENBQUosR0FBdUM7RUFBQyxvQkFBUTZWLFNBQVMsQ0FBQyxDQUFELENBQWxCO0VBQXVCLHNCQUFVQSxTQUFTLENBQUMsQ0FBRDtFQUExQyxXQUF2QyxDQURELEtBR0MvYSxPQUFPLENBQUNDLElBQVIsQ0FBYSxxQ0FBb0NiLENBQUMsR0FBQyxDQUF0QyxJQUEyQyxJQUEzQyxHQUFrRDJiLFNBQVMsQ0FBQyxDQUFELENBQTNELEdBQWlFLEdBQWpFLEdBQXVFQSxTQUFTLENBQUMsQ0FBRCxDQUE3RjtFQUNEOztFQUNENVMsUUFBQUEsR0FBRztFQUNILE9BckNrQjs7O0VBdUNuQixVQUFJNlMsU0FBUyxHQUFHblUsSUFBSSxDQUFDc0IsR0FBRCxDQUFKLENBQVU0UixLQUFWLENBQWdCLEdBQWhCLENBQWhCOztFQUNBLFdBQUksSUFBSTdVLEdBQUMsR0FBQyxDQUFWLEVBQWFBLEdBQUMsR0FBQzhWLFNBQVMsQ0FBQzNiLE1BQXpCLEVBQWlDNkYsR0FBQyxFQUFsQyxFQUFzQztFQUNyQyxZQUFHOFYsU0FBUyxDQUFDOVYsR0FBRCxDQUFULEtBQWlCLEdBQXBCLEVBQXlCO0VBQ3hCLGNBQUc4VixTQUFTLENBQUM5VixHQUFELENBQVQsS0FBaUIsR0FBakIsSUFBd0I4VixTQUFTLENBQUM5VixHQUFELENBQVQsS0FBaUIsR0FBNUMsRUFDQ2dWLElBQUksQ0FBQ3BLLGVBQWUsQ0FBQzVLLEdBQUQsQ0FBZixHQUFxQixlQUF0QixDQUFKLEdBQTZDOFYsU0FBUyxDQUFDOVYsR0FBRCxDQUF0RCxDQURELEtBR0NsRixPQUFPLENBQUNDLElBQVIsQ0FBYSxxQ0FBb0NiLENBQUMsR0FBQyxDQUF0QyxJQUEyQyxJQUEzQyxHQUFpRDBRLGVBQWUsQ0FBQzVLLEdBQUQsQ0FBaEUsR0FBc0UsR0FBdEUsR0FBMkU4VixTQUFTLENBQUM5VixHQUFELENBQWpHO0VBQ0Q7RUFDRDs7RUFDRDhVLE1BQUFBLEdBQUcsQ0FBQ0ssT0FBSixDQUFZSCxJQUFaO0VBQ0E7RUEvRTJDOztFQUs3QyxPQUFJLElBQUk5YSxDQUFDLEdBQUcsQ0FBWixFQUFjQSxDQUFDLEdBQUcwYSxLQUFLLENBQUN6YSxNQUF4QixFQUErQkQsQ0FBQyxFQUFoQyxFQUFtQztFQUFBLHFCQUEzQkEsQ0FBMkI7O0VBQUEsNkJBZWpDO0VBNEREOztFQUVELE1BQUk7RUFDSCxXQUFPLENBQUNtYixHQUFELEVBQU1ELFdBQVcsQ0FBQ04sR0FBRCxDQUFqQixDQUFQO0VBQ0EsR0FGRCxDQUVFLE9BQU01YixDQUFOLEVBQVM7RUFDVjRCLElBQUFBLE9BQU8sQ0FBQ3VWLEtBQVIsQ0FBY25YLENBQWQ7RUFDQSxXQUFPLENBQUNtYyxHQUFELEVBQU1QLEdBQU4sQ0FBUDtFQUNBO0VBQ0Q7O0VBR00sU0FBU3BCLGNBQVQsQ0FBd0JpQixjQUF4QixFQUF3Q29CLE9BQXhDLEVBQWlEO0VBQ3ZELE1BQUluQixLQUFLLEdBQUdELGNBQWMsQ0FBQzFKLElBQWYsR0FBc0I0SixLQUF0QixDQUE0QixJQUE1QixDQUFaO0VBQ0EsTUFBSUMsR0FBRyxHQUFHLEVBQVYsQ0FGdUQ7O0VBQUEsK0JBSS9DNWEsQ0FKK0M7RUFLcEQsUUFBSXlILElBQUksR0FBRzlELENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTXVSLEtBQUssQ0FBQzFhLENBQUQsQ0FBTCxDQUFTK1EsSUFBVCxHQUFnQjRKLEtBQWhCLENBQXNCLEtBQXRCLENBQU4sRUFBb0MsVUFBU3ZSLEdBQVQsRUFBY0MsRUFBZCxFQUFpQjtFQUFDLGFBQU9ELEdBQUcsQ0FBQzJILElBQUosRUFBUDtFQUFtQixLQUF6RSxDQUFYOztFQUNGLFFBQUd0SixJQUFJLENBQUN4SCxNQUFMLEdBQWMsQ0FBakIsRUFBb0I7RUFDbkIsVUFBSTZhLElBQUksR0FBRztFQUNWLGlCQUFTclQsSUFBSSxDQUFDLENBQUQsQ0FESDtFQUVWLHdCQUFnQkEsSUFBSSxDQUFDLENBQUQsQ0FGVjtFQUdWLGdCQUFRQSxJQUFJLENBQUMsQ0FBRCxDQUhGO0VBSVYsZUFBT0EsSUFBSSxDQUFDLENBQUQsQ0FKRDtFQUtWLGtCQUFVQSxJQUFJLENBQUMsQ0FBRDtFQUxKLE9BQVg7RUFPQSxVQUFHQSxJQUFJLENBQUMsQ0FBRCxDQUFKLElBQVcsQ0FBZCxFQUFpQnFULElBQUksQ0FBQ2xULE9BQUwsR0FBZSxJQUFmO0VBQ2pCLFVBQUdILElBQUksQ0FBQyxDQUFELENBQUosS0FBWSxHQUFmLEVBQW9CcVQsSUFBSSxDQUFDN1UsTUFBTCxHQUFjd0IsSUFBSSxDQUFDLENBQUQsQ0FBbEI7RUFDcEIsVUFBR0EsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFZLEdBQWYsRUFBb0JxVCxJQUFJLENBQUM5VSxNQUFMLEdBQWN5QixJQUFJLENBQUMsQ0FBRCxDQUFsQjtFQUNwQixVQUFHQSxJQUFJLENBQUMsQ0FBRCxDQUFKLEtBQVksR0FBZixFQUFvQnFULElBQUksQ0FBQzVULE1BQUwsR0FBY08sSUFBSSxDQUFDLENBQUQsQ0FBbEI7RUFDcEIsVUFBR0EsSUFBSSxDQUFDLENBQUQsQ0FBSixLQUFZLEdBQWYsRUFBb0JxVCxJQUFJLENBQUMzVyxHQUFMLEdBQVdzRCxJQUFJLENBQUMsQ0FBRCxDQUFmO0VBQ3BCLFVBQUdBLElBQUksQ0FBQyxFQUFELENBQUosS0FBYSxHQUFoQixFQUFxQnFULElBQUksQ0FBQzFXLEdBQUwsR0FBV3FELElBQUksQ0FBQyxFQUFELENBQWY7RUFFckIsVUFBSXNCLEdBQUcsR0FBRyxFQUFWO0VBQ0FwRixNQUFBQSxDQUFDLENBQUNpQyxJQUFGLENBQU80SyxPQUFQLEVBQWdCLFVBQVNnTCxNQUFULEVBQWlCQyxhQUFqQixFQUFnQztFQUMvQztFQUNBLFlBQUdoVSxJQUFJLENBQUNzQixHQUFELENBQUosS0FBYyxHQUFqQixFQUFzQjtFQUNyQitSLFVBQUFBLElBQUksQ0FBQ1csYUFBRCxDQUFKLEdBQXNCaFUsSUFBSSxDQUFDc0IsR0FBRCxDQUExQjtFQUNBOztFQUNEQSxRQUFBQSxHQUFHO0VBQ0gsT0FORDs7RUFRQSxVQUFHOFMsT0FBTyxLQUFLLENBQWYsRUFBa0I7RUFDakIsWUFBR3BVLElBQUksQ0FBQ3NCLEdBQUcsRUFBSixDQUFKLEtBQWdCLEdBQW5CLEVBQXdCK1IsSUFBSSxDQUFDWSxTQUFMLEdBQWlCLENBQWpCLENBRFA7RUFHakI7RUFDQTs7RUFDQSxhQUFJLElBQUk1VixDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUMsQ0FBZixFQUFrQkEsQ0FBQyxFQUFuQixFQUF1QjtFQUN0QmlELFVBQUFBLEdBQUcsSUFBRSxDQUFMOztFQUNBLGNBQUd0QixJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUFKLEtBQWdCLEdBQW5CLEVBQXdCO0VBQ3ZCLGdCQUFHLENBQUN0QixJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUFKLEtBQWdCLEdBQWhCLElBQXVCdEIsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUwsQ0FBSixLQUFnQixHQUF4QyxNQUFpRHRCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQUosS0FBZ0IsR0FBaEIsSUFBdUJ0QixJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUFKLEtBQWdCLEdBQXhGLENBQUgsRUFDQytSLElBQUksQ0FBQ3JLLFlBQVksQ0FBQzNLLENBQUQsQ0FBWixHQUFrQixZQUFuQixDQUFKLEdBQXVDO0VBQUMsc0JBQVEyQixJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUFiO0VBQXNCLHdCQUFVdEIsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUw7RUFBcEMsYUFBdkMsQ0FERCxLQUdDbkksT0FBTyxDQUFDQyxJQUFSLENBQWEscUNBQW9DYixDQUFDLEdBQUMsQ0FBdEMsSUFBMkMsSUFBM0MsR0FBa0R5SCxJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUF0RCxHQUFnRSxHQUFoRSxHQUFzRXRCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQXZGO0VBQ0Q7RUFDRDtFQUNELE9BZEQsTUFjTyxJQUFJOFMsT0FBTyxLQUFLLENBQWhCLEVBQW1CO0VBQ3pCO0VBQ0E7RUFDQTtFQUNBOVMsUUFBQUEsR0FBRyxJQUFFLENBQUwsQ0FKeUI7O0VBS3pCLFlBQUd0QixJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUFKLEtBQWdCLEdBQW5CLEVBQXdCO0VBQ3ZCLGNBQUl0QixJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUFKLEtBQWdCLEdBQWhCLElBQXVCdEIsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUwsQ0FBSixLQUFnQixHQUEzQyxFQUFpRDtFQUNoRCxnQkFBR3RCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQUosS0FBZ0IsR0FBbkIsRUFBd0I7RUFDdkIrUixjQUFBQSxJQUFJLENBQUMsaUJBQUQsQ0FBSixHQUEwQjtFQUFDLHdCQUFRclQsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUwsQ0FBYjtFQUFzQiwwQkFBVTtFQUFoQyxlQUExQjtFQUNBK1IsY0FBQUEsSUFBSSxDQUFDLGlCQUFELENBQUosR0FBMEI7RUFBQyx3QkFBUXJULElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQWI7RUFBc0IsMEJBQVU7RUFBaEMsZUFBMUI7RUFDQSxhQUhELE1BR08sSUFBR3RCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQUosS0FBZ0IsR0FBbkIsRUFBd0I7RUFDOUIrUixjQUFBQSxJQUFJLENBQUMsaUJBQUQsQ0FBSixHQUEwQjtFQUFDLHdCQUFRclQsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUwsQ0FBYjtFQUFzQiwwQkFBVTtFQUFoQyxlQUExQjtFQUNBK1IsY0FBQUEsSUFBSSxDQUFDLGlCQUFELENBQUosR0FBMEI7RUFBQyx3QkFBUXJULElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQWI7RUFBc0IsMEJBQVU7RUFBaEMsZUFBMUI7RUFDQSxhQUhNLE1BR0EsSUFBR3RCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQUosS0FBZ0IsR0FBbkIsRUFBd0I7RUFDOUIrUixjQUFBQSxJQUFJLENBQUMsaUJBQUQsQ0FBSixHQUEwQjtFQUFDLHdCQUFRclQsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUwsQ0FBYjtFQUFzQiwwQkFBVTtFQUFoQyxlQUExQjtFQUNBK1IsY0FBQUEsSUFBSSxDQUFDLGlCQUFELENBQUosR0FBMEI7RUFBQyx3QkFBUXJULElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQWI7RUFBc0IsMEJBQVU7RUFBaEMsZUFBMUI7RUFDQSxhQUhNLE1BR0EsSUFBR3RCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQUosS0FBZ0IsR0FBbkIsRUFBd0I7RUFDOUIrUixjQUFBQSxJQUFJLENBQUMsaUJBQUQsQ0FBSixHQUEwQjtFQUFDLHdCQUFRclQsSUFBSSxDQUFDc0IsR0FBRyxHQUFDLENBQUwsQ0FBYjtFQUFzQiwwQkFBVTtFQUFoQyxlQUExQjtFQUNBK1IsY0FBQUEsSUFBSSxDQUFDLGlCQUFELENBQUosR0FBMEI7RUFBQyx3QkFBUXJULElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQWI7RUFBc0IsMEJBQVU7RUFBaEMsZUFBMUI7RUFDQTtFQUNELFdBZEQsTUFjTztFQUNObkksWUFBQUEsT0FBTyxDQUFDQyxJQUFSLENBQWEscUNBQW9DYixDQUFDLEdBQUMsQ0FBdEMsSUFBMkMsSUFBM0MsR0FBa0R5SCxJQUFJLENBQUNzQixHQUFHLEdBQUMsQ0FBTCxDQUF0RCxHQUFnRSxHQUFoRSxHQUFzRXRCLElBQUksQ0FBQ3NCLEdBQUcsR0FBQyxDQUFMLENBQXZGO0VBQ0E7RUFDRDs7RUFDRCxZQUFHdEIsSUFBSSxDQUFDc0IsR0FBRyxFQUFKLENBQUosS0FBZ0IsR0FBbkIsRUFBd0IrUixJQUFJLENBQUNZLFNBQUwsR0FBaUIsQ0FBakI7RUFDeEIsT0EvRGtCOzs7RUFrRW5CLFdBQUksSUFBSTVWLEdBQUMsR0FBQyxDQUFWLEVBQWFBLEdBQUMsR0FBQzRLLGVBQWUsQ0FBQ3pRLE1BQS9CLEVBQXVDNkYsR0FBQyxFQUF4QyxFQUE0QztFQUMzQyxZQUFHMkIsSUFBSSxDQUFDc0IsR0FBRCxDQUFKLEtBQWMsR0FBakIsRUFBc0I7RUFDckIsY0FBR3RCLElBQUksQ0FBQ3NCLEdBQUQsQ0FBSixLQUFjLEdBQWQsSUFBcUJ0QixJQUFJLENBQUNzQixHQUFELENBQUosS0FBYyxHQUF0QyxFQUNDK1IsSUFBSSxDQUFDcEssZUFBZSxDQUFDNUssR0FBRCxDQUFmLEdBQXFCLGVBQXRCLENBQUosR0FBNkMyQixJQUFJLENBQUNzQixHQUFELENBQWpELENBREQsS0FHQ25JLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHFDQUFvQ2IsQ0FBQyxHQUFDLENBQXRDLElBQTJDLElBQTNDLEdBQWlEMFEsZUFBZSxDQUFDNUssR0FBRCxDQUFoRSxHQUFzRSxHQUF0RSxHQUEyRTJCLElBQUksQ0FBQ3NCLEdBQUQsQ0FBNUY7RUFDRDs7RUFDREEsUUFBQUEsR0FBRztFQUNIOztFQUNENlIsTUFBQUEsR0FBRyxDQUFDSyxPQUFKLENBQVlILElBQVo7RUFDQTtFQWxGcUQ7O0VBSXZELE9BQUksSUFBSTlhLENBQUMsR0FBRyxDQUFaLEVBQWNBLENBQUMsR0FBRzBhLEtBQUssQ0FBQ3phLE1BQXhCLEVBQStCRCxDQUFDLEVBQWhDLEVBQW1DO0VBQUEsV0FBM0JBLENBQTJCO0VBK0VsQzs7RUFFRCxNQUFJO0VBQ0gsV0FBT2tiLFdBQVcsQ0FBQ04sR0FBRCxDQUFsQjtFQUNBLEdBRkQsQ0FFRSxPQUFNNWIsQ0FBTixFQUFTO0VBQ1Y0QixJQUFBQSxPQUFPLENBQUN1VixLQUFSLENBQWNuWCxDQUFkO0VBQ0EsV0FBTzRiLEdBQVA7RUFDQTtFQUNEOztFQUVELFNBQVNNLFdBQVQsQ0FBcUJOLEdBQXJCLEVBQTBCO0VBQ3pCO0VBQ0EsT0FBSSxJQUFJOVUsQ0FBQyxHQUFDLENBQVYsRUFBWUEsQ0FBQyxHQUFDLENBQWQsRUFBZ0JBLENBQUMsRUFBakIsRUFBcUI7RUFDcEIsU0FBSSxJQUFJOUYsQ0FBQyxHQUFDLENBQVYsRUFBWUEsQ0FBQyxHQUFDNGEsR0FBRyxDQUFDM2EsTUFBbEIsRUFBeUJELENBQUMsRUFBMUIsRUFBOEI7RUFDN0I4YixNQUFBQSxRQUFRLENBQUNsQixHQUFELEVBQU1BLEdBQUcsQ0FBQzVhLENBQUQsQ0FBSCxDQUFPUCxJQUFiLENBQVI7RUFDQTtFQUNELEdBTndCOzs7RUFTekIsTUFBSXNjLFNBQVMsR0FBRyxDQUFoQjs7RUFDQSxPQUFJLElBQUkvYixHQUFDLEdBQUMsQ0FBVixFQUFZQSxHQUFDLEdBQUM0YSxHQUFHLENBQUMzYSxNQUFsQixFQUF5QkQsR0FBQyxFQUExQixFQUE4QjtFQUM3QixRQUFHNGEsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU9nYyxLQUFQLElBQWdCcEIsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU9nYyxLQUFQLEdBQWVELFNBQWxDLEVBQ0NBLFNBQVMsR0FBR25CLEdBQUcsQ0FBQzVhLEdBQUQsQ0FBSCxDQUFPZ2MsS0FBbkI7RUFDRCxHQWJ3Qjs7O0VBZ0J6QixPQUFJLElBQUloYyxHQUFDLEdBQUMsQ0FBVixFQUFZQSxHQUFDLEdBQUM0YSxHQUFHLENBQUMzYSxNQUFsQixFQUF5QkQsR0FBQyxFQUExQixFQUE4QjtFQUM3QixRQUFHeVMsUUFBQSxDQUF1Qm1JLEdBQXZCLEVBQTRCQSxHQUFHLENBQUM1YSxHQUFELENBQUgsQ0FBT1AsSUFBbkMsS0FBNEMsQ0FBL0MsRUFBa0Q7RUFDakQsVUFBR21iLEdBQUcsQ0FBQzVhLEdBQUQsQ0FBSCxDQUFPZ2MsS0FBUCxJQUFnQnBCLEdBQUcsQ0FBQzVhLEdBQUQsQ0FBSCxDQUFPZ2MsS0FBUCxJQUFnQkQsU0FBbkMsRUFBOEM7RUFDN0NuQixRQUFBQSxHQUFHLENBQUM1YSxHQUFELENBQUgsQ0FBTzhKLFNBQVAsR0FBbUIsSUFBbkI7RUFDQSxPQUZELE1BRU87RUFDTjhRLFFBQUFBLEdBQUcsQ0FBQzVhLEdBQUQsQ0FBSCxDQUFPaUosU0FBUCxHQUFtQixJQUFuQixDQURNOztFQUlOLFlBQUlnVCxJQUFJLEdBQUdDLGFBQWEsQ0FBQ3RCLEdBQUQsRUFBTUEsR0FBRyxDQUFDNWEsR0FBRCxDQUFULENBQXhCOztFQUNBLFlBQUdpYyxJQUFJLEdBQUcsQ0FBQyxDQUFYLEVBQWM7RUFDYixjQUFHckIsR0FBRyxDQUFDcUIsSUFBRCxDQUFILENBQVVqVyxNQUFiLEVBQXFCO0VBQ3BCNFUsWUFBQUEsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU9nRyxNQUFQLEdBQWdCNFUsR0FBRyxDQUFDcUIsSUFBRCxDQUFILENBQVVqVyxNQUExQjtFQUNBNFUsWUFBQUEsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU9pRyxNQUFQLEdBQWdCMlUsR0FBRyxDQUFDcUIsSUFBRCxDQUFILENBQVVoVyxNQUExQjtFQUNBO0VBQ0QsU0FWSzs7O0VBYU4sWUFBRyxDQUFDMlUsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU9nRyxNQUFYLEVBQWtCO0VBQ2pCLGVBQUksSUFBSUYsR0FBQyxHQUFDLENBQVYsRUFBYUEsR0FBQyxHQUFDOFUsR0FBRyxDQUFDM2EsTUFBbkIsRUFBMkI2RixHQUFDLEVBQTVCLEVBQWdDO0VBQy9CLGdCQUFHOFUsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU9nYyxLQUFQLElBQWlCcEIsR0FBRyxDQUFDOVUsR0FBRCxDQUFILENBQU9rVyxLQUFQLEdBQWEsQ0FBakMsRUFBcUM7RUFDcENDLGNBQUFBLElBQUksR0FBR0MsYUFBYSxDQUFDdEIsR0FBRCxFQUFNQSxHQUFHLENBQUM5VSxHQUFELENBQVQsQ0FBcEI7O0VBQ0Esa0JBQUdtVyxJQUFJLEdBQUcsQ0FBQyxDQUFYLEVBQWM7RUFDYnJCLGdCQUFBQSxHQUFHLENBQUM1YSxHQUFELENBQUgsQ0FBT2dHLE1BQVAsR0FBaUI0VSxHQUFHLENBQUM5VSxHQUFELENBQUgsQ0FBT3dELEdBQVAsS0FBZSxHQUFmLEdBQXFCc1IsR0FBRyxDQUFDOVUsR0FBRCxDQUFILENBQU9yRyxJQUE1QixHQUFtQ21iLEdBQUcsQ0FBQ3FCLElBQUQsQ0FBSCxDQUFVeGMsSUFBOUQ7RUFDQW1iLGdCQUFBQSxHQUFHLENBQUM1YSxHQUFELENBQUgsQ0FBT2lHLE1BQVAsR0FBaUIyVSxHQUFHLENBQUM5VSxHQUFELENBQUgsQ0FBT3dELEdBQVAsS0FBZSxHQUFmLEdBQXFCc1IsR0FBRyxDQUFDOVUsR0FBRCxDQUFILENBQU9yRyxJQUE1QixHQUFtQ21iLEdBQUcsQ0FBQ3FCLElBQUQsQ0FBSCxDQUFVeGMsSUFBOUQ7RUFDQTtFQUNEO0VBQ0Q7RUFDRDtFQUNEO0VBQ0QsS0E1QkQsTUE0Qk87RUFDTixhQUFPbWIsR0FBRyxDQUFDNWEsR0FBRCxDQUFILENBQU84SixTQUFkO0VBQ0E7RUFDRDs7RUFDRCxTQUFPOFEsR0FBUDtFQUNBOzs7RUFHRCxTQUFTc0IsYUFBVCxDQUF1QnpiLE9BQXZCLEVBQWdDNkgsS0FBaEMsRUFBdUM7RUFDdEMsT0FBSSxJQUFJdEksQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDUyxPQUFPLENBQUNSLE1BQXZCLEVBQStCRCxDQUFDLEVBQWhDLEVBQW9DO0VBQ25DLFFBQUl3SSxLQUFLLEdBQUcvSCxPQUFPLENBQUNULENBQUQsQ0FBbkI7RUFDQSxRQUFHc0ksS0FBSyxDQUFDN0ksSUFBTixLQUFlK0ksS0FBSyxDQUFDeEMsTUFBeEIsRUFDQyxPQUFPeU0sWUFBQSxDQUEyQmhTLE9BQTNCLEVBQW9DK0gsS0FBSyxDQUFDdkMsTUFBMUMsQ0FBUCxDQURELEtBRUssSUFBR3FDLEtBQUssQ0FBQzdJLElBQU4sS0FBZStJLEtBQUssQ0FBQ3ZDLE1BQXhCLEVBQ0osT0FBT3dNLFlBQUEsQ0FBMkJoUyxPQUEzQixFQUFvQytILEtBQUssQ0FBQ3hDLE1BQTFDLENBQVA7RUFDRDs7RUFDRCxTQUFPLENBQUMsQ0FBUjtFQUNBOzs7RUFHRCxTQUFTOFYsUUFBVCxDQUFrQnJiLE9BQWxCLEVBQTJCaEIsSUFBM0IsRUFBaUM7RUFDaEMsTUFBSXNKLEdBQUcsR0FBRzBKLFlBQUEsQ0FBMkJoUyxPQUEzQixFQUFvQ2hCLElBQXBDLENBQVY7RUFDQSxNQUFJdWMsS0FBSyxHQUFJdmIsT0FBTyxDQUFDc0ksR0FBRCxDQUFQLENBQWFpVCxLQUFiLEdBQXFCdmIsT0FBTyxDQUFDc0ksR0FBRCxDQUFQLENBQWFpVCxLQUFsQyxHQUEwQyxDQUF2RDtFQUNBRyxFQUFBQSxvQkFBb0IsQ0FBQ3BULEdBQUQsRUFBTWlULEtBQU4sRUFBYXZiLE9BQWIsQ0FBcEI7RUFDQTs7O0VBR0QsU0FBUzBiLG9CQUFULENBQThCcFQsR0FBOUIsRUFBbUNpVCxLQUFuQyxFQUEwQ3ZiLE9BQTFDLEVBQW1EO0VBQ2xELE1BQUkyYixPQUFPLEdBQUcsQ0FBQyxRQUFELEVBQVcsUUFBWCxDQUFkO0VBQ0FKLEVBQUFBLEtBQUs7O0VBQ0wsT0FBSSxJQUFJaGMsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDb2MsT0FBTyxDQUFDbmMsTUFBdkIsRUFBK0JELENBQUMsRUFBaEMsRUFBb0M7RUFDbkMsUUFBSWljLElBQUksR0FBR3hKLFlBQUEsQ0FBMkJoUyxPQUEzQixFQUFvQ0EsT0FBTyxDQUFDc0ksR0FBRCxDQUFQLENBQWFxVCxPQUFPLENBQUNwYyxDQUFELENBQXBCLENBQXBDLENBQVg7O0VBQ0EsUUFBR2ljLElBQUksSUFBSSxDQUFYLEVBQWM7RUFDYixVQUFJSSxFQUFFLEdBQUc1YixPQUFPLENBQUNnUyxZQUFBLENBQTJCaFMsT0FBM0IsRUFBb0NBLE9BQU8sQ0FBQ3NJLEdBQUQsQ0FBUCxDQUFhL0MsTUFBakQsQ0FBRCxDQUFoQjtFQUNBLFVBQUlzVyxFQUFFLEdBQUc3YixPQUFPLENBQUNnUyxZQUFBLENBQTJCaFMsT0FBM0IsRUFBb0NBLE9BQU8sQ0FBQ3NJLEdBQUQsQ0FBUCxDQUFhOUMsTUFBakQsQ0FBRCxDQUFoQjs7RUFDQSxVQUFHLENBQUN4RixPQUFPLENBQUN3YixJQUFELENBQVAsQ0FBY0QsS0FBZixJQUF3QnZiLE9BQU8sQ0FBQ3diLElBQUQsQ0FBUCxDQUFjRCxLQUFkLEdBQXNCQSxLQUFqRCxFQUF3RDtFQUN2REssUUFBQUEsRUFBRSxDQUFDTCxLQUFILEdBQVdBLEtBQVg7RUFDQU0sUUFBQUEsRUFBRSxDQUFDTixLQUFILEdBQVdBLEtBQVg7RUFDQTs7RUFFRCxVQUFHSyxFQUFFLENBQUNMLEtBQUgsR0FBV00sRUFBRSxDQUFDTixLQUFqQixFQUF3QjtFQUN2QkssUUFBQUEsRUFBRSxDQUFDTCxLQUFILEdBQVdNLEVBQUUsQ0FBQ04sS0FBZDtFQUNBLE9BRkQsTUFFTyxJQUFHTSxFQUFFLENBQUNOLEtBQUgsR0FBV0ssRUFBRSxDQUFDTCxLQUFqQixFQUF3QjtFQUM5Qk0sUUFBQUEsRUFBRSxDQUFDTixLQUFILEdBQVdLLEVBQUUsQ0FBQ0wsS0FBZDtFQUNBOztFQUNERyxNQUFBQSxvQkFBb0IsQ0FBQ0YsSUFBRCxFQUFPRCxLQUFQLEVBQWN2YixPQUFkLENBQXBCO0VBQ0E7RUFDRDtFQUNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQ3Z1QkRrRCxDQUFDLENBQUMsd0JBQUQsQ0FBRCxDQUE0QmlMLEVBQTVCLENBQStCLFFBQS9CLEVBQXlDLFVBQVVDLEVBQVYsRUFBYztFQUN0RCxNQUFHLEtBQUsvQixLQUFMLEtBQWUsR0FBbEIsRUFBdUI7RUFDdEI7RUFDQW5KLElBQUFBLENBQUMsQ0FBQyxZQUFELENBQUQsQ0FBZ0JpUSxJQUFoQixDQUFxQiw0QkFBckIsRUFBbUR4SyxHQUFuRCxDQUF1RCxHQUF2RCxFQUE0RFIsTUFBNUQ7RUFDQWpGLElBQUFBLENBQUMsQ0FBQyxZQUFELENBQUQsQ0FBZ0JpUSxJQUFoQixDQUFxQixtQ0FBckIsRUFBMER4SyxHQUExRCxDQUE4RCxHQUE5RCxFQUFtRVIsTUFBbkU7RUFDQSxHQUpELE1BSU8sSUFBRyxLQUFLa0UsS0FBTCxLQUFlLEdBQWxCLEVBQXVCO0VBQzdCO0VBQ0FuSixJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCaVEsSUFBaEIsQ0FBcUIsNEJBQXJCLEVBQW1EeEssR0FBbkQsQ0FBdUQsR0FBdkQsRUFBNERSLE1BQTVEO0VBQ0FqRixJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCaVEsSUFBaEIsQ0FBcUIsbUNBQXJCLEVBQTBEeEssR0FBMUQsQ0FBOEQsR0FBOUQsRUFBbUVSLE1BQW5FO0VBQ0EsR0FKTSxNQUlBLElBQUcsS0FBS2tFLEtBQUwsS0FBZSxHQUFsQixFQUF1QjtFQUM3QjtFQUNBbkosSUFBQUEsQ0FBQyxDQUFDLFlBQUQsQ0FBRCxDQUFnQmlRLElBQWhCLENBQXFCLG1DQUFyQixFQUEwRHhLLEdBQTFELENBQThELEdBQTlELEVBQW1FUixNQUFuRTtFQUNBLEdBSE0sTUFHQSxJQUFHLEtBQUtrRSxLQUFMLEtBQWUsT0FBbEIsRUFBMkI7RUFDakNuSixJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCaVEsSUFBaEIsQ0FBcUIsNEJBQXJCLEVBQW1EeEssR0FBbkQsQ0FBdUQsR0FBdkQsRUFBNERSLE1BQTVEO0VBQ0FqRixJQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCaVEsSUFBaEIsQ0FBcUIsbUNBQXJCLEVBQTBEeEssR0FBMUQsQ0FBOEQsR0FBOUQsRUFBbUVSLE1BQW5FO0VBQ0E7RUFDRCxDQWhCRDtFQWtCQWpGLENBQUMsQ0FBQyxrQkFBRCxDQUFELENBQXNCaUwsRUFBdEIsQ0FBeUIsT0FBekIsRUFBa0MsMEJBQWxDLEVBQThELFVBQVNDLEVBQVQsRUFBYTtFQUMxRSxNQUFJcFAsSUFBSSxHQUFHa0UsQ0FBQyxDQUFDLFVBQUQsQ0FBRCxDQUFjeUYsR0FBZCxFQUFYOztFQUNBLE1BQUd6RixDQUFDLENBQUMsSUFBRCxDQUFELENBQVE4RCxJQUFSLENBQWEsSUFBYixNQUF1QixZQUF2QixJQUF1QzlELENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUTRZLEVBQVIsQ0FBVyxVQUFYLENBQTFDLEVBQWtFO0VBQ2pFLFFBQUk5WSxHQUFHLEdBQUdFLENBQUMsQ0FBQyx3QkFBRCxDQUFELENBQTRCSyxJQUE1QixFQUFWO0VBRUFMLElBQUFBLENBQUMsQ0FBQyx5QkFBdUJGLEdBQXZCLEdBQTJCLFFBQTVCLENBQUQsQ0FBdUNHLE1BQXZDLENBQThDO0VBQzdDSixNQUFBQSxLQUFLLEVBQUVHLENBQUMsQ0FBQyx3QkFBRCxDQUFELENBQTRCdUcsSUFBNUIsQ0FBaUMsT0FBakMsQ0FEc0M7RUFFN0NwRyxNQUFBQSxLQUFLLEVBQUUsR0FGc0M7RUFHN0NDLE1BQUFBLE9BQU8sRUFBRSxDQUFDO0VBQ1JDLFFBQUFBLElBQUksRUFBRUwsQ0FBQyxDQUFDLHdCQUFELENBQUQsQ0FBNEJ1RyxJQUE1QixDQUFpQyxVQUFqQyxDQURFO0VBRVJqRyxRQUFBQSxLQUFLLEVBQUUsaUJBQVc7RUFDakJOLFVBQUFBLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUUMsTUFBUixDQUFlLE9BQWY7RUFDQSxjQUFJbkQsT0FBTyxHQUFHK2IsT0FBZ0IsQ0FBQy9kLElBQUQsQ0FBOUI7RUFDQUEsVUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlMkIsWUFBWSxDQUFDM0IsT0FBRCxDQUEzQjtFQUNBaUgsVUFBQUEsVUFBVSxDQUFDakosSUFBSSxDQUFDZ0MsT0FBTixFQUFlaEIsSUFBZixFQUFxQixJQUFyQixDQUFWO0VBQ0E0TixVQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQWdlLFVBQUFBLFlBQVksQ0FBQ2hlLElBQUQsQ0FBWjtFQUNBa0YsVUFBQUEsQ0FBQyxDQUFDLGFBQUQsQ0FBRCxDQUFpQitZLElBQWpCLENBQXNCLFVBQXRCLEVBQWtDLElBQWxDO0VBQ0E7RUFWTyxPQUFELEVBV047RUFDRDFZLFFBQUFBLElBQUksRUFBRUwsQ0FBQyxDQUFDLHdCQUFELENBQUQsQ0FBNEJ1RyxJQUE1QixDQUFpQyxRQUFqQyxDQURMO0VBRURqRyxRQUFBQSxLQUFLLEVBQUUsaUJBQVc7RUFDaEJOLFVBQUFBLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUUMsTUFBUixDQUFlLE9BQWY7RUFDQUQsVUFBQUEsQ0FBQyxDQUFDLGFBQUQsQ0FBRCxDQUFpQitZLElBQWpCLENBQXNCLFNBQXRCLEVBQWlDLEtBQWpDO0VBQ0EvWSxVQUFBQSxDQUFDLENBQUMsYUFBRCxDQUFELENBQWlCK1ksSUFBakIsQ0FBc0IsVUFBdEIsRUFBa0MsS0FBbEM7RUFDRDtFQU5BLE9BWE07RUFIb0MsS0FBOUM7RUF1QkEsR0ExQkQsTUEwQk8sSUFBRy9ZLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUThELElBQVIsQ0FBYSxJQUFiLE1BQXVCLFlBQTFCLEVBQXdDO0VBQzlDLFFBQUloSCxPQUFPLEdBQUcrYixPQUFnQixDQUFDL2QsSUFBRCxDQUE5QjtFQUNBQSxJQUFBQSxJQUFJLENBQUNnQyxPQUFMLEdBQWUyQixZQUFZLENBQUMzQixPQUFELENBQTNCO0VBQ0EsUUFBSXNJLEdBQUcsR0FBR3BDLFlBQVksQ0FBQ2xJLElBQUksQ0FBQ2dDLE9BQU4sRUFBZWhCLElBQWYsQ0FBdEI7RUFDQSxRQUFHa0UsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFRNFksRUFBUixDQUFXLFVBQVgsQ0FBSCxFQUNDOWQsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0ksR0FBYixFQUFrQjRULE9BQWxCLEdBQTRCLElBQTVCLENBREQsS0FHQyxPQUFPbGUsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0ksR0FBYixFQUFrQjRULE9BQXpCO0VBQ0R0UCxJQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQTtFQUNELENBdENEO0VBd0NPLFNBQVNtZSxNQUFULENBQWdCbmUsSUFBaEIsRUFBc0I7RUFDNUJrRixFQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCTSxLQUFoQixDQUFzQixZQUFXO0VBQ2hDdU4sSUFBQUEsSUFBSSxDQUFDL1MsSUFBRCxDQUFKO0VBQ0EsR0FGRCxFQUQ0Qjs7RUFNNUJrRixFQUFBQSxDQUFDLENBQUMsNERBQUQsQ0FBRCxDQUFnRStZLElBQWhFLENBQXFFLFVBQXJFLEVBQWlGLElBQWpGO0VBQ0EvWSxFQUFBQSxDQUFDLENBQUMsdUNBQUQsQ0FBRCxDQUEyQ2lGLE1BQTNDLENBQWtELFlBQVc7RUFDNURqRixJQUFBQSxDQUFDLENBQUMsK0JBQUQsQ0FBRCxDQUFtQytZLElBQW5DLENBQXdDLFVBQXhDLEVBQW9ELENBQUMvWSxDQUFDLENBQUMsSUFBRCxDQUFELENBQVE0WSxFQUFSLENBQVcsVUFBWCxDQUFyRDtFQUNBLEdBRkQ7RUFJQTVZLEVBQUFBLENBQUMsQ0FBQywwQkFBRCxDQUFELENBQThCaUYsTUFBOUIsQ0FBcUMsWUFBVztFQUMvQ2pGLElBQUFBLENBQUMsQ0FBQyw2QkFBRCxDQUFELENBQWlDK1ksSUFBakMsQ0FBc0MsVUFBdEMsRUFBbUQsS0FBSzVQLEtBQUwsS0FBZSxRQUFsRSxFQUQrQzs7RUFHL0MsUUFBRytQLGFBQWEsQ0FBQ0MsdUJBQWQsSUFBeUMsS0FBS2hRLEtBQUwsS0FBZSxRQUEzRCxFQUFxRTtFQUNwRSxVQUFJaVEsT0FBTyxHQUFHRixhQUFhLENBQUNDLHVCQUFkLENBQXNDLEtBQUtoUSxLQUEzQyxDQUFkOztFQUNBLFdBQUssSUFBSWtRLElBQVQsSUFBaUJELE9BQWpCO0VBQ0NwWixRQUFBQSxDQUFDLENBQUMsU0FBT3FaLElBQUksQ0FBQ0MsV0FBTCxFQUFQLEdBQTBCLG1CQUEzQixDQUFELENBQWlEN1QsR0FBakQsQ0FBcUQyVCxPQUFPLENBQUNDLElBQUQsQ0FBNUQ7RUFERDs7RUFHQSxVQUFJRSxRQUFRLEdBQUdMLGFBQWEsQ0FBQ00sdUJBQWQsQ0FBc0MsS0FBS3JRLEtBQTNDLENBQWY7O0VBQ0EsV0FBSyxJQUFJa1EsS0FBVCxJQUFpQkUsUUFBakI7RUFDQ3ZaLFFBQUFBLENBQUMsQ0FBQyxTQUFPcVosS0FBSSxDQUFDQyxXQUFMLEVBQVAsR0FBMEIsbUJBQTNCLENBQUQsQ0FBaUQ3VCxHQUFqRCxDQUFxRDhULFFBQVEsQ0FBQ0YsS0FBRCxDQUE3RDtFQUREO0VBRUE7O0VBRUQsUUFBRyxLQUFLbFEsS0FBTCxLQUFlLFdBQWxCLEVBQStCO0VBQUc7RUFDakNuSixNQUFBQSxDQUFDLENBQUMsWUFBRCxDQUFELENBQWdCK1ksSUFBaEIsQ0FBc0IsU0FBdEIsRUFBaUMsSUFBakM7RUFDQSxLQUZELE1BRU87RUFDTi9ZLE1BQUFBLENBQUMsQ0FBQyxXQUFELENBQUQsQ0FBZStZLElBQWYsQ0FBcUIsU0FBckIsRUFBZ0MsSUFBaEM7RUFDQTs7RUFDRFUsSUFBQUEsVUFBVSxDQUFDM2UsSUFBRCxDQUFWLENBbEIrQztFQW1CL0MsR0FuQkQ7RUFvQkE7O0VBR0RrRixDQUFDLENBQUM2SyxRQUFELENBQUQsQ0FBWUksRUFBWixDQUFlLFVBQWYsRUFBMkIsVUFBUzVQLENBQVQsRUFBWVAsSUFBWixFQUFpQjtFQUMzQyxNQUFJO0VBQ0gsUUFBSTRELEVBQUUsR0FBR3NCLENBQUMsQ0FBQyxVQUFELENBQUQsQ0FBY3lGLEdBQWQsRUFBVCxDQURHOztFQUVILFFBQUltQixJQUFJLEdBQUdwRSxhQUFhLENBQUNxVyxPQUFnQixDQUFDL2QsSUFBRCxDQUFqQixFQUF5QjRELEVBQXpCLENBQXhCO0VBQ0EsUUFBR2tJLElBQUksS0FBSzVMLFNBQVosRUFDQ2dGLENBQUMsQ0FBQyxpQkFBRCxDQUFELENBQXFCK1ksSUFBckIsQ0FBMEIsVUFBMUIsRUFBc0MsSUFBdEMsRUFERCxLQUdDL1ksQ0FBQyxDQUFDLGlCQUFELENBQUQsQ0FBcUIrWSxJQUFyQixDQUEwQixVQUExQixFQUFzQyxLQUF0QztFQUNELEdBUEQsQ0FPRSxPQUFNN0ssR0FBTixFQUFXO0VBQ1pqUixJQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYWdSLEdBQWI7RUFDQTtFQUNELENBWEQ7O0VBOEdBLFNBQVN3TCxZQUFULENBQXNCM2EsVUFBdEIsRUFBa0M7RUFDakM7RUFDQSxNQUFHaUIsQ0FBQyxDQUFDLFlBQUQsQ0FBRCxDQUFnQjRZLEVBQWhCLENBQW1CLFVBQW5CLENBQUgsRUFBbUM7RUFDbEM1WSxJQUFBQSxDQUFDLENBQUNpQyxJQUFGLENBQU9sRCxVQUFQLEVBQW1CLFVBQVMxQyxDQUFULEVBQVkrRixDQUFaLEVBQWU7RUFDakMsVUFBR0EsQ0FBQyxDQUFDNkIsT0FBTCxFQUNDN0IsQ0FBQyxDQUFDMlYsU0FBRixHQUFjLENBQWQ7RUFDRCxLQUhEO0VBSUEsR0FMRCxNQUtPO0VBQ04vWCxJQUFBQSxDQUFDLENBQUNpQyxJQUFGLENBQU9sRCxVQUFQLEVBQW1CLFVBQVMxQyxDQUFULEVBQVkrRixDQUFaLEVBQWU7RUFDakMsYUFBT0EsQ0FBQyxDQUFDMlYsU0FBVDtFQUNBLEtBRkQ7RUFHQTtFQUNEOzs7RUFHTSxTQUFTMEIsVUFBVCxDQUFvQjNlLElBQXBCLEVBQTBCO0VBQ2hDLE1BQUlnQyxPQUFPLEdBQUcrYixPQUFnQixDQUFDL2QsSUFBRCxDQUE5QjtFQUNBLE1BQUlpRSxVQUFVLEdBQUdOLFlBQVksQ0FBQzNCLE9BQUQsQ0FBN0I7RUFDQTRjLEVBQUFBLFlBQVksQ0FBQzNhLFVBQUQsQ0FBWjtFQUNBakUsRUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlaUMsVUFBZjtFQUNBMkssRUFBQUEsT0FBTyxDQUFDNU8sSUFBRCxDQUFQO0VBQ0E7RUFFTSxTQUFTK1MsSUFBVCxDQUFjL1MsSUFBZCxFQUFvQjtFQUMxQixNQUFJZ0MsT0FBTyxHQUFHK2IsT0FBZ0IsQ0FBQy9kLElBQUQsQ0FBOUI7RUFDQSxNQUFJZ0IsSUFBSSxHQUFHa0UsQ0FBQyxDQUFDLFVBQUQsQ0FBRCxDQUFjeUYsR0FBZCxFQUFYO0VBQ0EsTUFBSTFHLFVBQVUsR0FBR04sWUFBWSxDQUFDM0IsT0FBRCxDQUE3QjtFQUNBLE1BQUkyRSxNQUFNLEdBQUdlLGFBQWEsQ0FBQ3pELFVBQUQsRUFBYWpELElBQWIsQ0FBMUI7O0VBQ0EsTUFBRyxDQUFDMkYsTUFBSixFQUFZO0VBQ1h4RSxJQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxzQ0FBYjtFQUNBO0VBQ0E7O0VBQ0Q4QyxFQUFBQSxDQUFDLENBQUMsTUFBSWxGLElBQUksQ0FBQ3dRLFNBQVYsQ0FBRCxDQUFzQlMsS0FBdEIsR0FUMEI7O0VBWTFCLE1BQUl0TCxHQUFHLEdBQUdULENBQUMsQ0FBQyxXQUFELENBQUQsQ0FBZXlGLEdBQWYsRUFBVjs7RUFDQSxNQUFHaEYsR0FBRyxJQUFJQSxHQUFHLEtBQUssRUFBbEIsRUFBc0I7RUFDckJnQixJQUFBQSxNQUFNLENBQUNoQixHQUFQLEdBQWFBLEdBQWI7RUFDQSxHQUZELE1BRU87RUFDTixXQUFPZ0IsTUFBTSxDQUFDaEIsR0FBZDtFQUNBLEdBakJ5Qjs7O0VBb0IxQixNQUFJQyxNQUFNLEdBQUdWLENBQUMsQ0FBQyxZQUFELENBQUQsQ0FBZ0JpUSxJQUFoQixDQUFxQiw2QkFBckIsQ0FBYjs7RUFDQSxNQUFHdlAsTUFBTSxDQUFDcEUsTUFBUCxHQUFnQixDQUFuQixFQUFxQjtFQUNwQm1GLElBQUFBLE1BQU0sQ0FBQ2YsTUFBUCxHQUFnQkEsTUFBTSxDQUFDK0UsR0FBUCxFQUFoQjtFQUNBLEdBdkJ5Qjs7O0VBMEIxQixNQUFJa1UsUUFBUSxHQUFHLENBQUMsYUFBRCxFQUFnQixZQUFoQixFQUE4QixhQUE5QixFQUE2QyxhQUE3QyxFQUE0RCxZQUE1RCxDQUFmOztFQUNBLE9BQUksSUFBSUMsT0FBTyxHQUFDLENBQWhCLEVBQW1CQSxPQUFPLEdBQUNELFFBQVEsQ0FBQ3JkLE1BQXBDLEVBQTRDc2QsT0FBTyxFQUFuRCxFQUFzRDtFQUNyRCxRQUFJOVYsSUFBSSxHQUFHNlYsUUFBUSxDQUFDQyxPQUFELENBQW5CO0VBQ0EsUUFBSUMsQ0FBQyxHQUFHN1osQ0FBQyxDQUFDLFNBQU84RCxJQUFSLENBQVQ7O0VBQ0EsUUFBRytWLENBQUMsQ0FBQ3ZkLE1BQUYsR0FBVyxDQUFkLEVBQWdCO0VBQ2ZXLE1BQUFBLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWTJSLENBQUMsQ0FBQ2pCLEVBQUYsQ0FBSyxVQUFMLENBQVo7RUFDQSxVQUFHaUIsQ0FBQyxDQUFDakIsRUFBRixDQUFLLFVBQUwsQ0FBSCxFQUNDblgsTUFBTSxDQUFDcUMsSUFBRCxDQUFOLEdBQWUsSUFBZixDQURELEtBR0MsT0FBT3JDLE1BQU0sQ0FBQ3FDLElBQUQsQ0FBYjtFQUNEO0VBQ0QsR0FyQ3lCOzs7RUF3QzFCLE1BQUk2QixHQUFHLEdBQUczRixDQUFDLENBQUMsU0FBRCxDQUFELENBQWFpUSxJQUFiLENBQWtCLDZCQUFsQixDQUFWOztFQUNBLE1BQUd0SyxHQUFHLENBQUNySixNQUFKLEdBQWEsQ0FBaEIsRUFBa0I7RUFDakJtRixJQUFBQSxNQUFNLENBQUNrRSxHQUFQLEdBQWFBLEdBQUcsQ0FBQ0YsR0FBSixFQUFiO0VBQ0FxVSxJQUFBQSxvQkFBb0IsQ0FBQ3JZLE1BQUQsQ0FBcEI7RUFDQSxHQTVDeUI7OztFQStDMUJpWSxFQUFBQSxZQUFZLENBQUMzYSxVQUFELENBQVo7RUFFQSxNQUFHaUIsQ0FBQyxDQUFDLFlBQUQsQ0FBRCxDQUFnQjRZLEVBQWhCLENBQW1CLFVBQW5CLENBQUg7RUFDQ25YLElBQUFBLE1BQU0sQ0FBQ3NZLG9CQUFQLEdBQThCLElBQTlCLENBREQsS0FHQyxPQUFPdFksTUFBTSxDQUFDc1ksb0JBQWQ7RUFFRC9aLEVBQUFBLENBQUMsQ0FBQyw4SUFBRCxDQUFELENBQWtKaUMsSUFBbEosQ0FBdUosWUFBVztFQUNqSyxRQUFJbkcsSUFBSSxHQUFJLEtBQUtBLElBQUwsQ0FBVVUsT0FBVixDQUFrQixnQkFBbEIsSUFBb0MsQ0FBQyxDQUFyQyxHQUF5QyxLQUFLVixJQUFMLENBQVVrZSxTQUFWLENBQW9CLENBQXBCLEVBQXVCLEtBQUtsZSxJQUFMLENBQVVRLE1BQVYsR0FBaUIsQ0FBeEMsQ0FBekMsR0FBcUYsS0FBS1IsSUFBdEc7O0VBRUEsUUFBR2tFLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUXlGLEdBQVIsRUFBSCxFQUFrQjtFQUNqQixVQUFJQSxHQUFHLEdBQUd6RixDQUFDLENBQUMsSUFBRCxDQUFELENBQVF5RixHQUFSLEVBQVY7RUFDQSxVQUFHM0osSUFBSSxDQUFDVSxPQUFMLENBQWEsZ0JBQWIsSUFBaUMsQ0FBQyxDQUFsQyxJQUF1Q3dELENBQUMsQ0FBQyxZQUFELENBQUQsQ0FBZ0I0WSxFQUFoQixDQUFtQixVQUFuQixDQUExQyxFQUNDblQsR0FBRyxHQUFHd1UsTUFBTSxDQUFDeFUsR0FBRCxDQUFaO0VBQ0RoRSxNQUFBQSxNQUFNLENBQUMzRixJQUFELENBQU4sR0FBZTJKLEdBQWY7RUFDQSxLQUxELE1BS087RUFDTixhQUFPaEUsTUFBTSxDQUFDM0YsSUFBRCxDQUFiO0VBQ0E7RUFDRCxHQVhELEVBdEQwQjs7RUFvRTFCa0UsRUFBQUEsQ0FBQyxDQUFDLGdHQUFELENBQUQsQ0FBb0dpQyxJQUFwRyxDQUF5RyxZQUFXO0VBQ25ILFFBQUcsS0FBS2lZLE9BQVIsRUFDQ3pZLE1BQU0sQ0FBQ3pCLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUThELElBQVIsQ0FBYSxNQUFiLENBQUQsQ0FBTixHQUErQixJQUEvQixDQURELEtBR0MsT0FBT3JDLE1BQU0sQ0FBQ3pCLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUThELElBQVIsQ0FBYSxNQUFiLENBQUQsQ0FBYjtFQUNELEdBTEQsRUFwRTBCOztFQTRFMUI5RCxFQUFBQSxDQUFDLENBQUMsK0NBQUQsQ0FBRCxDQUFtRGlDLElBQW5ELENBQXdELFlBQVc7RUFDbEUsUUFBR2pDLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUXlGLEdBQVIsT0FBa0IsR0FBckIsRUFBMEI7RUFDekJoRSxNQUFBQSxNQUFNLENBQUN6QixDQUFDLENBQUMsSUFBRCxDQUFELENBQVE4RCxJQUFSLENBQWEsTUFBYixDQUFELENBQU4sR0FBK0I5RCxDQUFDLENBQUMsSUFBRCxDQUFELENBQVF5RixHQUFSLEVBQS9CO0VBQ0EsS0FGRCxNQUVPO0VBQ04sYUFBT2hFLE1BQU0sQ0FBQ3pCLENBQUMsQ0FBQyxJQUFELENBQUQsQ0FBUThELElBQVIsQ0FBYSxNQUFiLENBQUQsQ0FBYjtFQUNBO0VBQ0QsR0FORCxFQTVFMEI7O0VBcUYxQjlELEVBQUFBLENBQUMsQ0FBQyw0Q0FBRCxDQUFELENBQWdEaUMsSUFBaEQsQ0FBcUQsWUFBVztFQUMvRCxRQUFHakMsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFReUYsR0FBUixPQUFrQixHQUFyQixFQUEwQjtFQUN6QixVQUFJMFUsSUFBSSxHQUFHbmEsQ0FBQyxDQUFDLGtCQUFnQkEsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFROEQsSUFBUixDQUFhLE1BQWIsQ0FBaEIsR0FBcUMsV0FBdEMsQ0FBWjtFQUNBckMsTUFBQUEsTUFBTSxDQUFDekIsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFROEQsSUFBUixDQUFhLE1BQWIsQ0FBRCxDQUFOLEdBQStCO0VBQUMsZ0JBQVE5RCxDQUFDLENBQUMsSUFBRCxDQUFELENBQVF5RixHQUFSLEVBQVQ7RUFBd0Isa0JBQVV6RixDQUFDLENBQUNtYSxJQUFELENBQUQsQ0FBUTFVLEdBQVI7RUFBbEMsT0FBL0I7RUFDQSxLQUhELE1BR087RUFDTixhQUFPaEUsTUFBTSxDQUFDekIsQ0FBQyxDQUFDLElBQUQsQ0FBRCxDQUFROEQsSUFBUixDQUFhLE1BQWIsQ0FBRCxDQUFiO0VBQ0E7RUFDRCxHQVBEOztFQVNBLE1BQUk7RUFDSDlELElBQUFBLENBQUMsQ0FBQyxpQkFBRCxDQUFELENBQXFCaVEsSUFBckIsQ0FBMEIsTUFBMUIsRUFBa0NtSyxLQUFsQztFQUNBLEdBRkQsQ0FFRSxPQUFNbE0sR0FBTixFQUFXO0VBQ1pqUixJQUFBQSxPQUFPLENBQUNDLElBQVIsQ0FBYSxtQkFBYjtFQUNBOztFQUVEdU0sRUFBQUEsU0FBUyxDQUFDMUssVUFBRCxFQUFhMEMsTUFBYixDQUFUO0VBQ0EzRyxFQUFBQSxJQUFJLENBQUNnQyxPQUFMLEdBQWVpQyxVQUFmO0VBQ0EySyxFQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQTs7RUEyQkQsU0FBU2dmLG9CQUFULENBQThCbFQsSUFBOUIsRUFBb0M7RUFDbkM1RyxFQUFBQSxDQUFDLENBQUMsY0FBRCxDQUFELENBQWtCcWEsSUFBbEI7O0VBQ0EsTUFBR3pULElBQUksQ0FBQ2pCLEdBQUwsS0FBYSxHQUFoQixFQUFxQjtFQUNwQixXQUFPaUIsSUFBSSxDQUFDMFQsNEJBQVo7RUFDQXRhLElBQUFBLENBQUMsQ0FBQyx5Q0FBRCxDQUFELENBQTZDdWEsT0FBN0MsQ0FBcUQsTUFBckQsRUFBNkRDLElBQTdEO0VBQ0F4YSxJQUFBQSxDQUFDLENBQUMseUNBQUQsQ0FBRCxDQUE2QytZLElBQTdDLENBQWtELFVBQWxELEVBQThELElBQTlEO0VBQ0EsR0FKRCxNQUlPLElBQUduUyxJQUFJLENBQUNqQixHQUFMLEtBQWEsR0FBaEIsRUFBcUI7RUFDM0IsV0FBT2lCLElBQUksQ0FBQzZULDZCQUFaO0VBQ0F6YSxJQUFBQSxDQUFDLENBQUMsMENBQUQsQ0FBRCxDQUE4Q3VhLE9BQTlDLENBQXNELE1BQXRELEVBQThEQyxJQUE5RDtFQUNBeGEsSUFBQUEsQ0FBQyxDQUFDLHlDQUFELENBQUQsQ0FBNkMrWSxJQUE3QyxDQUFrRCxVQUFsRCxFQUE4RCxLQUE5RDtFQUNBO0VBQ0Q7OztFQUdELFNBQVNrQixNQUFULENBQWdCUyxFQUFoQixFQUFvQjtFQUNuQixNQUFJQyxFQUFFLEdBQUk5WixJQUFJLENBQUMrWixLQUFMLENBQVcsQ0FBQ0YsRUFBRSxHQUFDLENBQUosSUFBUyxFQUFwQixJQUEwQixFQUFwQztFQUNBLFNBQVFBLEVBQUUsR0FBR0MsRUFBTCxHQUFVQSxFQUFFLEdBQUcsQ0FBZixHQUFtQkEsRUFBRSxHQUFHLENBQWhDO0VBQ0E7O0VDelhEO0VBTUEsSUFBSUUsUUFBSjtFQUNBLElBQUlDLGNBQUo7RUFFQTs7RUFDTyxTQUFTQyxVQUFULENBQW9CamdCLElBQXBCLEVBQTBCOEwsSUFBMUIsRUFBZ0M7RUFFdEM7RUFDQSxNQUFJb1UsU0FBUyxHQUFHcmQsUUFBUSxDQUFDcUMsQ0FBQyxDQUFDLE1BQUQsQ0FBRCxDQUFVb1UsR0FBVixDQUFjLFdBQWQsQ0FBRCxDQUF4QjtFQUNBLE1BQUk2RyxlQUFlLEdBQUc5SyxFQUFFLENBQUNDLE1BQUgsQ0FBVSxVQUFWLENBQXRCO0VBQ0E2SyxFQUFBQSxlQUFlLENBQUM1USxNQUFoQixDQUF1QixNQUF2QixFQUErQnZHLElBQS9CLENBQW9DLE9BQXBDLEVBQTZDLGlCQUE3QyxFQUNPQSxJQURQLENBQ1ksSUFEWixFQUNrQixDQURsQixFQUVPQSxJQUZQLENBRVksSUFGWixFQUVrQixDQUZsQixFQUdPQSxJQUhQLENBR1ksV0FIWixFQUd5Qix1QkFIekIsRUFJT29YLEtBSlAsQ0FJYSxTQUpiLEVBSXdCLENBSnhCLEVBS09wWCxJQUxQLENBS1ksT0FMWixFQUtzQmtYLFNBQVMsR0FBQyxHQUxoQyxFQU1PbFgsSUFOUCxDQU1ZLFFBTlosRUFNc0JrWCxTQUFTLEdBQUMsQ0FOaEMsRUFPT0UsS0FQUCxDQU9hLFFBUGIsRUFPdUIsVUFQdkIsRUFRT3BYLElBUlAsQ0FRWSxNQVJaLEVBUW9CLE9BUnBCO0VBVUEsTUFBSXFYLE1BQU0sR0FBR0YsZUFBZSxDQUFDNVEsTUFBaEIsQ0FBdUIsTUFBdkI7RUFBQSxHQUNYdkcsSUFEVyxDQUNOLGFBRE0sRUFDUyxhQURULEVBRVhvWCxLQUZXLENBRUwsU0FGSyxFQUVNLENBRk4sRUFHWHBYLElBSFcsQ0FHTixXQUhNLEVBR08sTUFIUCxFQUlYQSxJQUpXLENBSU4sT0FKTSxFQUlHLDRDQUpILEVBS1hBLElBTFcsQ0FLTixXQUxNLEVBS08sdUJBTFAsRUFNWEEsSUFOVyxDQU1OLEdBTk0sRUFNRGtYLFNBQVMsR0FBQyxDQU5ULEVBT1hsWCxJQVBXLENBT04sR0FQTSxFQU9Ea1gsU0FBUyxHQUFDLEdBUFQsRUFRWDNhLElBUlcsQ0FRTixTQVJNLENBQWI7RUFTQSxNQUFJK2EsWUFBWSxHQUFHRCxNQUFNLENBQUM5USxNQUFQLENBQWMsV0FBZCxFQUEyQmhLLElBQTNCLENBQWdDLFVBQWhDLENBQW5CO0VBRUEsTUFBSWdiLE1BQU0sR0FBR0osZUFBZSxDQUFDNVEsTUFBaEIsQ0FBdUIsTUFBdkI7RUFBQSxHQUNYdkcsSUFEVyxDQUNOLGFBRE0sRUFDUyxhQURULEVBRVhvWCxLQUZXLENBRUwsU0FGSyxFQUVNLENBRk4sRUFHWHBYLElBSFcsQ0FHTixXQUhNLEVBR08sTUFIUCxFQUlYQSxJQUpXLENBSU4sT0FKTSxFQUlHLDRDQUpILEVBS1hBLElBTFcsQ0FLTixXQUxNLEVBS08sdUJBTFAsRUFNWEEsSUFOVyxDQU1OLEdBTk0sRUFNRGtYLFNBQVMsR0FBQyxHQU5ULEVBT1hsWCxJQVBXLENBT04sR0FQTSxFQU9Ea1gsU0FBUyxHQUFDLEdBUFQsRUFRWDNhLElBUlcsQ0FRTixTQVJNLENBQWI7RUFTQSxNQUFJaWIsWUFBWSxHQUFHRCxNQUFNLENBQUNoUixNQUFQLENBQWMsV0FBZCxFQUEyQmhLLElBQTNCLENBQWdDLFlBQWhDLENBQW5CO0VBRUEsTUFBSWtiLFdBQVcsR0FBR04sZUFBZSxDQUFDNVEsTUFBaEIsQ0FBdUIsTUFBdkI7RUFBQSxHQUNoQnZHLElBRGdCLENBQ1gsYUFEVyxFQUNJLGFBREosRUFFaEJvWCxLQUZnQixDQUVWLFNBRlUsRUFFQyxDQUZELEVBR2hCcFgsSUFIZ0IsQ0FHWCxXQUhXLEVBR0UsTUFIRixFQUloQkEsSUFKZ0IsQ0FJWCxXQUpXLEVBSUUsdUJBSkYsRUFLaEJBLElBTGdCLENBS1gsT0FMVyxFQUtGLDBFQUxFLEVBTWhCekQsSUFOZ0IsQ0FNWCxTQU5XLENBQWxCO0VBT0FrYixFQUFBQSxXQUFXLENBQUNsUixNQUFaLENBQW1CLFdBQW5CLEVBQWdDaEssSUFBaEMsQ0FBcUMsaUJBQXJDO0VBRUEsTUFBSXVELE1BQU0sR0FBR3FYLGVBQWUsQ0FBQzVRLE1BQWhCLENBQXVCLE1BQXZCO0VBQUEsR0FDWHZHLElBRFcsQ0FDTixhQURNLEVBQ1MsYUFEVCxFQUVYb1gsS0FGVyxDQUVMLFNBRkssRUFFTSxDQUZOLEVBR1hwWCxJQUhXLENBR04sV0FITSxFQUdPLHVCQUhQLEVBSVhBLElBSlcsQ0FJTixPQUpNLEVBSUcscURBSkgsRUFLWEEsSUFMVyxDQUtOLEdBTE0sRUFLRGtYLFNBQVMsR0FBQyxHQUxULEVBTVhsWCxJQU5XLENBTU4sR0FOTSxFQU1Ea1gsU0FBUyxHQUFDLEdBTlQsRUFPWDNhLElBUFcsQ0FPTixTQVBNLENBQWI7RUFRQXVELEVBQUFBLE1BQU0sQ0FBQ3lHLE1BQVAsQ0FBYyxXQUFkLEVBQTJCaEssSUFBM0IsQ0FBZ0MsK0JBQWhDO0VBRUEsTUFBSWtELE1BQU0sR0FBRzBYLGVBQWUsQ0FBQzVRLE1BQWhCLENBQXVCLE1BQXZCO0VBQUEsR0FDWnZHLElBRFksQ0FDUCxhQURPLEVBQ1EsYUFEUixFQUVab1gsS0FGWSxDQUVOLFNBRk0sRUFFSyxDQUZMLEVBR1pwWCxJQUhZLENBR1AsV0FITyxFQUdNLHVCQUhOLEVBSVpBLElBSlksQ0FJUCxPQUpPLEVBSUUscURBSkYsRUFLWkEsSUFMWSxDQUtQLEdBTE8sRUFLRmtYLFNBQVMsR0FBQyxHQUxSLEVBTVpsWCxJQU5ZLENBTVAsR0FOTyxFQU1Ga1gsU0FBUyxHQUFDLEdBTlIsRUFPWjNhLElBUFksQ0FPUCxRQVBPLENBQWI7RUFRQWtELEVBQUFBLE1BQU0sQ0FBQzhHLE1BQVAsQ0FBYyxXQUFkLEVBQTJCaEssSUFBM0IsQ0FBZ0MsaUNBQWhDO0VBRUEsTUFBSW1iLFVBQVUsR0FBRyxFQUFqQixDQWxFc0M7O0VBb0V0Q3JMLEVBQUFBLEVBQUUsQ0FBQzhDLFNBQUgsQ0FBYSxhQUFiLEVBQ0doSSxFQURILENBQ00sT0FETixFQUNlLFlBQVk7RUFDMUIsUUFBSWxNLFVBQVUsR0FBR04sWUFBWSxDQUFDb2EsT0FBZ0IsQ0FBQy9kLElBQUQsQ0FBakIsQ0FBN0I7RUFDQSxRQUFJeUksTUFBTSxHQUFHNE0sRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQnFMLE9BQWhCLENBQXdCLFFBQXhCLENBQWI7RUFDQSxRQUFJN1gsTUFBTSxHQUFHdU0sRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQnFMLE9BQWhCLENBQXdCLFFBQXhCLENBQWI7RUFDQSxRQUFJMVYsU0FBSjtFQUNBLFFBQUlKLEdBQUo7O0VBQ0EsUUFBR3BDLE1BQU0sSUFBSUssTUFBYixFQUFxQjtFQUNwQitCLE1BQUFBLEdBQUcsR0FBRzZWLFVBQVUsQ0FBQzVVLElBQVgsQ0FBZ0I4VSxLQUFoQixHQUF3Qm5WLElBQXhCLENBQTZCWixHQUFuQztFQUNBSSxNQUFBQSxTQUFTLEdBQUl4QyxNQUFNLEdBQUcsUUFBSCxHQUFjLFFBQWpDO0VBQ0EsS0FIRCxNQUdPO0VBQ05vQyxNQUFBQSxHQUFHLEdBQUd3SyxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCcUwsT0FBaEIsQ0FBd0IsV0FBeEIsSUFBdUMsR0FBdkMsR0FBOEN0TCxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCcUwsT0FBaEIsQ0FBd0IsV0FBeEIsSUFBdUMsR0FBdkMsR0FBNkMsR0FBakc7RUFDQTs7RUFFRCxRQUFHRCxVQUFVLENBQUM3RyxJQUFYLEtBQW9CLFlBQXZCLEVBQ0NnSCxVQUFVLENBQUM1YyxVQUFELEVBQWF5YyxVQUFVLENBQUM1VSxJQUFYLENBQWdCOFUsS0FBaEIsR0FBd0JuVixJQUFyQyxFQUEyQ1osR0FBM0MsRUFBZ0QsS0FBaEQsRUFBdURJLFNBQXZELENBQVYsQ0FERCxLQUVLLElBQUd5VixVQUFVLENBQUM3RyxJQUFYLEtBQW9CLFVBQXZCLEVBQ0o3SyxRQUFRLENBQUMvSyxVQUFELEVBQWF5YyxVQUFVLENBQUM1VSxJQUFYLENBQWdCOFUsS0FBaEIsR0FBd0JuVixJQUFyQyxFQUE0Q1IsU0FBUyxHQUFHLEdBQUgsR0FBU0osR0FBOUQsRUFBcUVJLFNBQVMsR0FBRyxDQUFILEdBQU8sQ0FBckYsRUFBeUZBLFNBQXpGLENBQVIsQ0FESSxLQUdKO0VBQ0RqTCxJQUFBQSxJQUFJLENBQUNnQyxPQUFMLEdBQWVpQyxVQUFmO0VBQ0EySyxJQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQXFWLElBQUFBLEVBQUUsQ0FBQzhDLFNBQUgsQ0FBYSxrQkFBYixFQUFpQ2lJLEtBQWpDLENBQXVDLFNBQXZDLEVBQWtELENBQWxEO0VBQ0FNLElBQUFBLFVBQVUsR0FBRyxFQUFiO0VBQ0UsR0F4QkgsRUF5Qkd2USxFQXpCSCxDQXlCTSxXQXpCTixFQXlCbUIsWUFBVztFQUMzQixRQUFHdVEsVUFBVSxDQUFDNVUsSUFBZCxFQUNDNFUsVUFBVSxDQUFDNVUsSUFBWCxDQUFnQndKLE1BQWhCLENBQXVCLE1BQXZCLEVBQStCOEssS0FBL0IsQ0FBcUMsU0FBckMsRUFBZ0QsR0FBaEQ7RUFDRC9LLElBQUFBLEVBQUUsQ0FBQzhDLFNBQUgsQ0FBYSxrQkFBYixFQUFpQ2lJLEtBQWpDLENBQXVDLFNBQXZDLEVBQWtELENBQWxELEVBSDJCOztFQUszQixRQUFHTSxVQUFVLENBQUM3RyxJQUFYLEtBQW9CLFlBQXZCLEVBQW9DO0VBQ3BDLFVBQUd4RSxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCcUwsT0FBaEIsQ0FBd0IsV0FBeEIsQ0FBSCxFQUNFTCxZQUFZLENBQUMvYSxJQUFiLENBQWtCLGFBQWxCLEVBREYsS0FHRWliLFlBQVksQ0FBQ2piLElBQWIsQ0FBa0IsWUFBbEI7RUFDRCxLQUxELE1BS08sSUFBR21iLFVBQVUsQ0FBQzdHLElBQVgsS0FBb0IsVUFBdkIsRUFBa0M7RUFDeEMsVUFBR3hFLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0JxTCxPQUFoQixDQUF3QixXQUF4QixDQUFILEVBQ0NMLFlBQVksQ0FBQy9hLElBQWIsQ0FBa0IsU0FBbEIsRUFERCxLQUdDaWIsWUFBWSxDQUFDamIsSUFBYixDQUFrQixjQUFsQjtFQUNEO0VBQ0QsR0F6Q0gsRUFwRXNDOztFQWdIdEM4UCxFQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsa0JBQWIsRUFBaUNoSSxFQUFqQyxDQUFvQyxVQUFwQyxFQUFnRCxZQUFZO0VBQzNEO0VBQ0EsUUFBR3VRLFVBQVUsQ0FBQzVVLElBQVgsS0FBb0I1TCxTQUFwQixJQUFpQzRnQixTQUFTLENBQUNwZixPQUFWLENBQWtCZ2YsVUFBVSxDQUFDNVUsSUFBWCxDQUFnQjhVLEtBQWhCLEVBQWxCLEtBQThDLENBQUMsQ0FBbkYsRUFDQ0YsVUFBVSxDQUFDNVUsSUFBWCxDQUFnQndKLE1BQWhCLENBQXVCLE1BQXZCLEVBQStCOEssS0FBL0IsQ0FBcUMsU0FBckMsRUFBZ0QsQ0FBaEQ7RUFDRC9LLElBQUFBLEVBQUUsQ0FBQzhDLFNBQUgsQ0FBYSxrQkFBYixFQUFpQ2lJLEtBQWpDLENBQXVDLFNBQXZDLEVBQWtELENBQWxEO0VBQ0EsR0FMRCxFQWhIc0M7O0VBeUh0Q1csRUFBQUEsV0FBVyxDQUFDL2dCLElBQUQsQ0FBWCxDQXpIc0M7O0VBNEh0QzhMLEVBQUFBLElBQUksQ0FBQ3lELE1BQUwsQ0FBWSxNQUFaLEVBQ0U2SSxNQURGLENBQ1MsVUFBVS9ULENBQVYsRUFBYTtFQUNqQixXQUFPQSxDQUFDLENBQUNvSCxJQUFGLENBQU96RCxNQUFQLElBQWlCLENBQUNoSSxJQUFJLENBQUNtTixLQUF2QixHQUErQixLQUEvQixHQUF1QyxJQUE5QztFQUNILEdBSEYsRUFJRW5FLElBSkYsQ0FJTyxPQUpQLEVBSWdCLFdBSmhCLEVBS0VBLElBTEYsQ0FLTyxJQUxQLEVBS2EsQ0FMYixFQU1FQSxJQU5GLENBTU8sSUFOUCxFQU1hLENBTmIsRUFPRUEsSUFQRixDQU9PLEdBUFAsRUFPWSxVQUFTZ1ksRUFBVCxFQUFhO0VBQUUsV0FBTyxDQUFFLElBQUYsR0FBT2hoQixJQUFJLENBQUN5TixXQUFuQjtFQUFpQyxHQVA1RCxFQVFFekUsSUFSRixDQVFPLEdBUlAsRUFRWSxVQUFTZ1ksRUFBVCxFQUFhO0VBQUUsV0FBTyxDQUFFaGhCLElBQUksQ0FBQ3lOLFdBQWQ7RUFBNEIsR0FSdkQsRUFTRXpFLElBVEYsQ0FTTyxPQVRQLEVBU2tCLE1BQU1oSixJQUFJLENBQUN5TixXQUFaLEdBQXlCLElBVDFDLEVBVUV6RSxJQVZGLENBVU8sUUFWUCxFQVVrQixJQUFJaEosSUFBSSxDQUFDeU4sV0FBVixHQUF1QixJQVZ4QyxFQVdFMlMsS0FYRixDQVdRLFFBWFIsRUFXa0IsT0FYbEIsRUFZRUEsS0FaRixDQVlRLGNBWlIsRUFZd0IsR0FaeEIsRUFhRUEsS0FiRixDQWFRLFNBYlIsRUFhbUIsQ0FibkIsRUFjRXBYLElBZEYsQ0FjTyxNQWRQLEVBY2UsV0FkZixFQTVIc0M7O0VBNkl0QyxNQUFJaVksRUFBRSxHQUFHLFNBQUxBLEVBQUssQ0FBU0QsRUFBVCxFQUFhO0VBQUMsV0FBT0UsR0FBRyxHQUFHLE9BQUtsaEIsSUFBSSxDQUFDeU4sV0FBdkI7RUFBb0MsR0FBM0Q7O0VBQ0EsTUFBSTBULEVBQUUsR0FBR25oQixJQUFJLENBQUN5TixXQUFMLEdBQWtCLENBQTNCO0VBQ0EsTUFBSXlULEdBQUcsR0FBRyxDQUFWO0VBQ0EsTUFBSUUsT0FBTyxHQUFHO0VBQ2IsZ0JBQWM7RUFBQyxjQUFRLFFBQVQ7RUFBbUIsZUFBUyxXQUE1QjtFQUEyQyxZQUFNSCxFQUFqRDtFQUFxRCxZQUFNRTtFQUEzRCxLQUREO0VBRWIsa0JBQWM7RUFBQyxjQUFRLFFBQVQ7RUFBbUIsZUFBUyxhQUE1QjtFQUEyQyxZQUFNRixFQUFqRDtFQUFxRCxZQUFNRTtFQUEzRCxLQUZEO0VBR2Isa0JBQWM7RUFBQyxjQUFRLFFBQVQ7RUFBbUIsZUFBUyxhQUE1QjtFQUEyQyxZQUFNRixFQUFqRDtFQUFxRCxZQUFNRTtFQUEzRCxLQUhEO0VBSWIsa0JBQWM7RUFDYixjQUFRLFFBREs7RUFDSyxlQUFTLGFBRGQ7RUFFYixZQUFNLENBQUUsSUFBRixHQUFPbmhCLElBQUksQ0FBQ3lOLFdBRkw7RUFHYixZQUFNLENBQUV6TixJQUFJLENBQUN5TixXQUFQLEdBQXFCO0VBSGQsS0FKRDtFQVNiLGNBQVU7RUFDVCxjQUFRLEdBREM7RUFDSSxlQUFTLFFBRGI7RUFFVCxZQUFNek4sSUFBSSxDQUFDeU4sV0FBTCxHQUFpQixDQUFqQixHQUFxQixDQUZsQjtFQUdULFlBQU0sQ0FBRXpOLElBQUksQ0FBQ3lOLFdBQVAsR0FBcUIsRUFIbEI7RUFJVCxnQkFBVTtFQUFDLHVCQUFlLE1BQWhCO0VBQXdCLGdCQUFRLFNBQWhDO0VBQTJDLHVCQUFlO0VBQTFEO0VBSkQ7RUFURyxHQUFkOztFQWlCQSxNQUFHek4sSUFBSSxDQUFDcWhCLElBQVIsRUFBYztFQUNiRCxJQUFBQSxPQUFPLENBQUNFLFFBQVIsR0FBbUI7RUFBQyxjQUFRLFFBQVQ7RUFBbUIsZUFBUyxVQUE1QjtFQUF3QyxZQUFNLENBQUNwQixTQUFELEdBQVcsQ0FBWCxHQUFhLENBQTNEO0VBQThELFlBQU0sQ0FBQ2xnQixJQUFJLENBQUN5TixXQUFOLEdBQW9CO0VBQXhGLEtBQW5CO0VBQ0E7O0VBbktxQyw2QkFxSzlCaE0sR0FySzhCO0VBc0tyQyxRQUFJOGYsTUFBTSxHQUFHelYsSUFBSSxDQUFDeUQsTUFBTCxDQUFZLE1BQVosRUFDWDZJLE1BRFcsQ0FDSixVQUFVL1QsQ0FBVixFQUFhO0VBQ3BCLGFBQVEsQ0FBQ0EsQ0FBQyxDQUFDb0gsSUFBRixDQUFPekQsTUFBUCxJQUFpQixDQUFDaEksSUFBSSxDQUFDbU4sS0FBdkIsR0FBK0IsS0FBL0IsR0FBdUMsSUFBeEMsS0FDTixFQUFFLENBQUM5SSxDQUFDLENBQUNvSCxJQUFGLENBQU9sRSxNQUFQLEtBQWtCckgsU0FBbEIsSUFBK0JtRSxDQUFDLENBQUNvSCxJQUFGLENBQU9qQixTQUF2QyxLQUFxRC9JLEdBQUcsS0FBSyxZQUEvRCxDQURNLElBRU4sRUFBRTRDLENBQUMsQ0FBQ29ILElBQUYsQ0FBT2pELFdBQVAsS0FBdUJ0SSxTQUF2QixJQUFvQ21FLENBQUMsQ0FBQ29ILElBQUYsQ0FBT2pELFdBQVAsQ0FBbUJoSCxNQUFuQixHQUE0QixDQUFoRSxJQUFxRUMsR0FBRyxLQUFLLFlBQS9FLENBRk0sSUFHTixFQUFFNEMsQ0FBQyxDQUFDb0gsSUFBRixDQUFPakQsV0FBUCxLQUF1QnRJLFNBQXZCLElBQW9DdUIsR0FBRyxLQUFLLFVBQTlDLENBSE0sSUFJTixFQUFHNEMsQ0FBQyxDQUFDb0gsSUFBRixDQUFPakIsU0FBUCxLQUFxQnRLLFNBQXJCLElBQWtDbUUsQ0FBQyxDQUFDb0gsSUFBRixDQUFPSixTQUFQLEtBQXFCbkwsU0FBeEQsSUFBc0V1QixHQUFHLEtBQUssWUFBaEYsQ0FKRjtFQUtBLEtBUFcsRUFRWHVILElBUlcsQ0FRTixPQVJNLEVBUUd2SCxHQVJILEVBU1gyZSxLQVRXLENBU0wsU0FUSyxFQVNNLENBVE4sRUFVWHBYLElBVlcsQ0FVTixhQVZNLEVBVVMsYUFWVCxFQVdYQSxJQVhXLENBV04sSUFYTSxFQVdBLFVBQVMzRSxDQUFULEVBQVc7RUFBQyxhQUFPQSxDQUFDLENBQUN0QixDQUFUO0VBQVksS0FYeEIsRUFZWGlHLElBWlcsQ0FZTixJQVpNLEVBWUEsVUFBUzNFLENBQVQsRUFBVztFQUFDLGFBQU9BLENBQUMsQ0FBQ3JCLENBQVQ7RUFBWSxLQVp4QixFQWFYZ0csSUFiVyxDQWFOLEdBYk0sRUFhRG9ZLE9BQU8sQ0FBQzNmLEdBQUQsQ0FBUCxDQUFhd2YsRUFiWixFQWNYalksSUFkVyxDQWNOLEdBZE0sRUFjRG9ZLE9BQU8sQ0FBQzNmLEdBQUQsQ0FBUCxDQUFhMGYsRUFkWixFQWVYblksSUFmVyxDQWVOLFdBZk0sRUFlTyxPQWZQLEVBZ0JYekQsSUFoQlcsQ0FnQk42YixPQUFPLENBQUMzZixHQUFELENBQVAsQ0FBYThELElBaEJQLENBQWI7RUFrQkEsUUFBRyxZQUFZNmIsT0FBTyxDQUFDM2YsR0FBRCxDQUF0QixFQUNDLEtBQUksSUFBSTJlLEtBQVIsSUFBaUJnQixPQUFPLENBQUMzZixHQUFELENBQVAsQ0FBYStmLE1BQTlCLEVBQXFDO0VBQ3BDRCxNQUFBQSxNQUFNLENBQUN2WSxJQUFQLENBQVlvWCxLQUFaLEVBQW1CZ0IsT0FBTyxDQUFDM2YsR0FBRCxDQUFQLENBQWErZixNQUFiLENBQW9CcEIsS0FBcEIsQ0FBbkI7RUFDQTtFQUVGbUIsSUFBQUEsTUFBTSxDQUFDaFMsTUFBUCxDQUFjLFdBQWQsRUFBMkJoSyxJQUEzQixDQUFnQzZiLE9BQU8sQ0FBQzNmLEdBQUQsQ0FBUCxDQUFhc0QsS0FBN0M7RUFDQW1jLElBQUFBLEdBQUcsSUFBSSxFQUFQO0VBOUxxQzs7RUFxS3RDLE9BQUksSUFBSXpmLEdBQVIsSUFBZTJmLE9BQWYsRUFBd0I7RUFBQSxVQUFoQjNmLEdBQWdCO0VBMEJ2QixHQS9McUM7OztFQWtNdEM0VCxFQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsd0JBQWIsRUFDR2hJLEVBREgsQ0FDTSxXQUROLEVBQ21CLFlBQVk7RUFDNUIsUUFBSTBKLElBQUksR0FBR3hFLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0J0TSxJQUFoQixDQUFxQixPQUFyQixDQUFYO0VBQ0FxTSxJQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsa0JBQWIsRUFBaUNpSSxLQUFqQyxDQUF1QyxTQUF2QyxFQUFrRCxDQUFsRDtFQUNBTSxJQUFBQSxVQUFVLEdBQUc7RUFBQyxjQUFRckwsRUFBRSxDQUFDQyxNQUFILENBQVUsS0FBS21NLFVBQWYsQ0FBVDtFQUFxQyxjQUFRNUg7RUFBN0MsS0FBYixDQUg0Qjs7RUFNNUIsUUFBSTlXLENBQUMsR0FBR0YsUUFBUSxDQUFDd1MsRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQnRNLElBQWhCLENBQXFCLElBQXJCLENBQUQsQ0FBUixHQUF1Q25HLFFBQVEsQ0FBQ3dTLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0J0TSxJQUFoQixDQUFxQixHQUFyQixDQUFELENBQXZEO0VBQ0EsUUFBSWhHLENBQUMsR0FBR0gsUUFBUSxDQUFDd1MsRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQnRNLElBQWhCLENBQXFCLElBQXJCLENBQUQsQ0FBUixHQUF1Q25HLFFBQVEsQ0FBQ3dTLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0J0TSxJQUFoQixDQUFxQixHQUFyQixDQUFELENBQXZEO0VBQ0FxTSxJQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsa0JBQWIsRUFBaUNuUCxJQUFqQyxDQUFzQyxXQUF0QyxFQUFtRCxlQUFhakcsQ0FBYixHQUFlLEdBQWYsSUFBb0JDLENBQUMsR0FBQyxDQUF0QixJQUF5QixHQUE1RTtFQUNBcVMsSUFBQUEsRUFBRSxDQUFDOEMsU0FBSCxDQUFhLDJCQUFiLEVBQ0FuUCxJQURBLENBQ0ssV0FETCxFQUNrQixnQkFBY2pHLENBQUMsR0FBQyxJQUFFbWQsU0FBbEIsSUFBNkIsR0FBN0IsSUFBa0NsZCxDQUFDLEdBQUVrZCxTQUFTLEdBQUMsR0FBL0MsSUFBcUQsY0FEdkU7RUFFQSxHQVpILEVBbE1zQzs7RUFpTnRDN0ssRUFBQUEsRUFBRSxDQUFDOEMsU0FBSCxDQUFhLHlEQUFiLEVBQ0doSSxFQURILENBQ00sT0FETixFQUNlLFlBQVk7RUFDMUJrRixJQUFBQSxFQUFFLENBQUN3RyxLQUFILENBQVM5SyxlQUFUO0VBQ0EsUUFBSTJRLEdBQUcsR0FBR3JNLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0J0TSxJQUFoQixDQUFxQixPQUFyQixDQUFWO0VBQ0EsUUFBSTNFLENBQUMsR0FBR2dSLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLEtBQUttTSxVQUFmLEVBQTJCYixLQUEzQixFQUFSOztFQUNBLFFBQUc1Z0IsSUFBSSxDQUFDbU4sS0FBUixFQUFlO0VBQ2RoTCxNQUFBQSxPQUFPLENBQUNpTCxHQUFSLENBQVlzVSxHQUFaO0VBQ0E7O0VBRUQsUUFBSXpkLFVBQUo7O0VBQ0EsUUFBR3lkLEdBQUcsS0FBSyxVQUFYLEVBQXVCO0VBQ3RCLFVBQUcsT0FBTzFoQixJQUFJLENBQUNxaEIsSUFBWixLQUFxQixVQUF4QixFQUFvQztFQUNuQ3JoQixRQUFBQSxJQUFJLENBQUNxaEIsSUFBTCxDQUFVcmhCLElBQVYsRUFBZ0JxRSxDQUFoQjtFQUNBLE9BRkQsTUFFTztFQUNOc2QsUUFBQUEsY0FBYyxDQUFDM2hCLElBQUQsRUFBT3FFLENBQVAsQ0FBZDtFQUNBO0VBQ0QsS0FORCxNQU1PLElBQUdxZCxHQUFHLEtBQUssUUFBWCxFQUFxQjtFQUMzQnpkLE1BQUFBLFVBQVUsR0FBR04sWUFBWSxDQUFDb2EsT0FBZ0IsQ0FBQy9kLElBQUQsQ0FBakIsQ0FBekI7RUFDQW1QLE1BQUFBLG1CQUFtQixDQUFDbEwsVUFBRCxFQUFhSSxDQUFDLENBQUNvSCxJQUFmLEVBQXFCekwsSUFBckIsRUFBMkJrUCxNQUEzQixDQUFuQjtFQUNBLEtBSE0sTUFHQSxJQUFHd1MsR0FBRyxLQUFLLFlBQVgsRUFBeUI7RUFDL0J6ZCxNQUFBQSxVQUFVLEdBQUdOLFlBQVksQ0FBQ29hLE9BQWdCLENBQUMvZCxJQUFELENBQWpCLENBQXpCO0VBQ0FBLE1BQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZWlDLFVBQWY7RUFDQTJkLE1BQUFBLFVBQVUsQ0FBQzVoQixJQUFELEVBQU9pRSxVQUFQLEVBQW1CSSxDQUFDLENBQUNvSCxJQUFGLENBQU96SyxJQUExQixDQUFWO0VBQ0E0TixNQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQSxLQUxNLE1BS0EsSUFBRzBoQixHQUFHLEtBQUssWUFBWCxFQUF5QjtFQUMvQnpkLE1BQUFBLFVBQVUsR0FBR04sWUFBWSxDQUFDb2EsT0FBZ0IsQ0FBQy9kLElBQUQsQ0FBakIsQ0FBekI7RUFDQTZoQixNQUFBQSxVQUFVLENBQUM3aEIsSUFBRCxFQUFPaUUsVUFBUCxFQUFtQkksQ0FBQyxDQUFDb0gsSUFBRixDQUFPekssSUFBMUIsQ0FBVjtFQUNBaEIsTUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlaUMsVUFBZjtFQUNBMkssTUFBQUEsT0FBTyxDQUFDNU8sSUFBRCxDQUFQO0VBQ0EsS0E1QnlCOzs7RUE4QjFCa0YsSUFBQUEsQ0FBQyxDQUFDNkssUUFBRCxDQUFELENBQVkwQixPQUFaLENBQW9CLFVBQXBCLEVBQWdDLENBQUN6UixJQUFELENBQWhDO0VBQ0EsR0FoQ0QsRUFqTnNDOztFQW9QdEMsTUFBSThnQixTQUFTLEdBQUcsRUFBaEI7RUFFQWhWLEVBQUFBLElBQUksQ0FBQ3NNLE1BQUwsQ0FBWSxVQUFVL1QsQ0FBVixFQUFhO0VBQUUsV0FBTyxDQUFDQSxDQUFDLENBQUNvSCxJQUFGLENBQU96RCxNQUFmO0VBQXdCLEdBQW5ELEVBQ0NtSSxFQURELENBQ0ksT0FESixFQUNhLFVBQVU5TCxDQUFWLEVBQWE7RUFDekIsUUFBSWdSLEVBQUUsQ0FBQ3dHLEtBQUgsQ0FBU2lHLE9BQWIsRUFBc0I7RUFDckIsVUFBR2hCLFNBQVMsQ0FBQ3BmLE9BQVYsQ0FBa0IyQyxDQUFsQixLQUF3QixDQUFDLENBQTVCLEVBQ0N5YyxTQUFTLENBQUNuZixJQUFWLENBQWUwQyxDQUFmLEVBREQsS0FHQ3ljLFNBQVMsQ0FBQ2lCLE1BQVYsQ0FBaUJqQixTQUFTLENBQUNwZixPQUFWLENBQWtCMkMsQ0FBbEIsQ0FBakIsRUFBdUMsQ0FBdkM7RUFDRCxLQUxELE1BTUN5YyxTQUFTLEdBQUcsQ0FBQ3pjLENBQUQsQ0FBWjs7RUFFRCxRQUFHLGVBQWVyRSxJQUFsQixFQUF3QjtFQUN2QkEsTUFBQUEsSUFBSSxDQUFDZ2lCLFNBQUwsQ0FBZTNkLENBQUMsQ0FBQ29ILElBQWpCO0VBQ0E0SixNQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsWUFBYixFQUEyQmlJLEtBQTNCLENBQWlDLFNBQWpDLEVBQTRDLENBQTVDO0VBQ0EvSyxNQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsWUFBYixFQUEyQkMsTUFBM0IsQ0FBa0MsVUFBUy9ULENBQVQsRUFBWTtFQUFDLGVBQU95YyxTQUFTLENBQUNwZixPQUFWLENBQWtCMkMsQ0FBbEIsS0FBd0IsQ0FBQyxDQUFoQztFQUFtQyxPQUFsRixFQUFvRitiLEtBQXBGLENBQTBGLFNBQTFGLEVBQXFHLEdBQXJHO0VBQ0E7RUFDRCxHQWZELEVBZ0JDalEsRUFoQkQsQ0FnQkksV0FoQkosRUFnQmlCLFVBQVM5TCxDQUFULEVBQVc7RUFDM0JnUixJQUFBQSxFQUFFLENBQUN3RyxLQUFILENBQVM5SyxlQUFUO0VBQ0FpUCxJQUFBQSxjQUFjLEdBQUczYixDQUFqQjs7RUFDQSxRQUFHMGIsUUFBSCxFQUFhO0VBQ1osVUFBR0EsUUFBUSxDQUFDdFUsSUFBVCxDQUFjekssSUFBZCxLQUF1QmdmLGNBQWMsQ0FBQ3ZVLElBQWYsQ0FBb0J6SyxJQUEzQyxJQUNBK2UsUUFBUSxDQUFDdFUsSUFBVCxDQUFjWixHQUFkLEtBQXNCbVYsY0FBYyxDQUFDdlUsSUFBZixDQUFvQlosR0FEN0MsRUFDa0Q7RUFDakR3SyxRQUFBQSxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCQSxNQUFoQixDQUF1QixNQUF2QixFQUErQjhLLEtBQS9CLENBQXFDLFNBQXJDLEVBQWdELEdBQWhEO0VBQ0E7O0VBQ0Q7RUFDQTs7RUFDRC9LLElBQUFBLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0JBLE1BQWhCLENBQXVCLE1BQXZCLEVBQStCOEssS0FBL0IsQ0FBcUMsU0FBckMsRUFBZ0QsR0FBaEQ7RUFDQS9LLElBQUFBLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLElBQVYsRUFBZ0I2QyxTQUFoQixDQUEwQixzRUFBMUIsRUFBa0dpSSxLQUFsRyxDQUF3RyxTQUF4RyxFQUFtSCxDQUFuSDtFQUNBL0ssSUFBQUEsRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQjZDLFNBQWhCLENBQTBCLGVBQTFCLEVBQTJDaUksS0FBM0MsQ0FBaUQsU0FBakQsRUFBNEQsQ0FBNUQ7RUFDQTZCLElBQUFBLG1CQUFtQixDQUFDamlCLElBQUksQ0FBQ3lOLFdBQUwsR0FBaUIsRUFBbEIsRUFBc0IsQ0FBdEIsRUFBeUJ6TixJQUFJLENBQUN5TixXQUFMLEdBQWlCLENBQTFDLEVBQTZDLENBQTdDLEVBQWdEcEosQ0FBQyxDQUFDdEIsQ0FBRixHQUFJLEdBQUosSUFBU3NCLENBQUMsQ0FBQ3JCLENBQUYsR0FBSSxDQUFiLENBQWhELENBQW5CO0VBQ0EsR0E5QkQsRUErQkNtTixFQS9CRCxDQStCSSxVQS9CSixFQStCZ0IsVUFBUzlMLENBQVQsRUFBVztFQUMxQixRQUFHMGIsUUFBSCxFQUNDO0VBRUQxSyxJQUFBQSxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCNkMsU0FBaEIsQ0FBMEIsc0VBQTFCLEVBQWtHaUksS0FBbEcsQ0FBd0csU0FBeEcsRUFBbUgsQ0FBbkg7RUFDQSxRQUFHVSxTQUFTLENBQUNwZixPQUFWLENBQWtCMkMsQ0FBbEIsS0FBd0IsQ0FBQyxDQUE1QixFQUNDZ1IsRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQkEsTUFBaEIsQ0FBdUIsTUFBdkIsRUFBK0I4SyxLQUEvQixDQUFxQyxTQUFyQyxFQUFnRCxDQUFoRDtFQUNEL0ssSUFBQUEsRUFBRSxDQUFDQyxNQUFILENBQVUsSUFBVixFQUFnQjZDLFNBQWhCLENBQTBCLGVBQTFCLEVBQTJDaUksS0FBM0MsQ0FBaUQsU0FBakQsRUFBNEQsQ0FBNUQsRUFQMEI7O0VBUzFCLFFBQUcvSyxFQUFFLENBQUM2TSxLQUFILENBQVMsSUFBVCxFQUFlLENBQWYsSUFBb0IsTUFBSWxpQixJQUFJLENBQUN5TixXQUFoQyxFQUNDNEgsRUFBRSxDQUFDOEMsU0FBSCxDQUFhLGtCQUFiLEVBQWlDaUksS0FBakMsQ0FBdUMsU0FBdkMsRUFBa0QsQ0FBbEQ7O0VBQ0QsUUFBRyxDQUFDTCxRQUFKLEVBQWM7RUFDYjtFQUNBLFVBQUloYSxJQUFJLENBQUNDLEdBQUwsQ0FBU3FQLEVBQUUsQ0FBQzZNLEtBQUgsQ0FBUyxJQUFULEVBQWUsQ0FBZixDQUFULElBQThCLE9BQUtsaUIsSUFBSSxDQUFDeU4sV0FBeEMsSUFDSDFILElBQUksQ0FBQ0MsR0FBTCxDQUFTcVAsRUFBRSxDQUFDNk0sS0FBSCxDQUFTLElBQVQsRUFBZSxDQUFmLENBQVQsSUFBOEIsQ0FBQyxJQUFELEdBQU1saUIsSUFBSSxDQUFDeU4sV0FEdEMsSUFFSDRILEVBQUUsQ0FBQzZNLEtBQUgsQ0FBUyxJQUFULEVBQWUsQ0FBZixJQUFvQixNQUFJbGlCLElBQUksQ0FBQ3lOLFdBRjlCLEVBRTBDO0VBQ3hDd1UsUUFBQUEsbUJBQW1CLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixDQUFuQjtFQUNEO0VBQ0s7RUFDUCxHQWxERDtFQW1EQTs7RUFFRCxTQUFTL1MsTUFBVCxDQUFnQmxQLElBQWhCLEVBQXNCZ0MsT0FBdEIsRUFBK0I7RUFDOUI7RUFDQWhDLEVBQUFBLElBQUksQ0FBQ2dDLE9BQUwsR0FBZUEsT0FBZjtFQUNBNE0sRUFBQUEsT0FBTyxDQUFDNU8sSUFBRCxDQUFQO0VBQ0E7OztFQUdELFNBQVMrZ0IsV0FBVCxDQUFxQi9nQixJQUFyQixFQUEyQjtFQUMxQixNQUFJbWlCLG1CQUFtQixHQUFHOU0sRUFBRSxDQUFDQyxNQUFILENBQVUsVUFBVixDQUExQjtFQUNBLE1BQUk4TSxLQUFLLEdBQUdELG1CQUFtQixDQUFDNVMsTUFBcEIsQ0FBMkIsTUFBM0IsRUFBbUN2RyxJQUFuQyxDQUF3QyxPQUF4QyxFQUFpRCxxQkFBakQsRUFDSkEsSUFESSxDQUNDLGNBREQsRUFDaUIsQ0FEakIsRUFFSm9YLEtBRkksQ0FFRSxrQkFGRixFQUV1QixNQUZ2QixFQUdKcFgsSUFISSxDQUdDLFFBSEQsRUFHVSxPQUhWLEVBSUoySixJQUpJLENBSUMwQyxFQUFFLENBQUNnTixJQUFILEdBQ0dsUyxFQURILENBQ00sT0FETixFQUNlbVMsU0FEZixFQUVHblMsRUFGSCxDQUVNLE1BRk4sRUFFY2tTLElBRmQsRUFHR2xTLEVBSEgsQ0FHTSxLQUhOLEVBR2FvUyxRQUhiLENBSkQsQ0FBWjtFQVFBSCxFQUFBQSxLQUFLLENBQUM3UyxNQUFOLENBQWEsV0FBYixFQUEwQmhLLElBQTFCLENBQStCLHdDQUEvQjtFQUVBMGMsRUFBQUEsbUJBQW1CLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLEVBQVUsQ0FBVixDQUFuQjs7RUFFQSxXQUFTSyxTQUFULENBQW1CdEIsRUFBbkIsRUFBdUI7RUFDdEIzTCxJQUFBQSxFQUFFLENBQUN3RyxLQUFILENBQVMyRyxXQUFULENBQXFCelIsZUFBckI7RUFDQWdQLElBQUFBLFFBQVEsR0FBR0MsY0FBWDtFQUNBM0ssSUFBQUEsRUFBRSxDQUFDOEMsU0FBSCxDQUFhLHNCQUFiLEVBQ0VuUCxJQURGLENBQ08sUUFEUCxFQUNnQixTQURoQjtFQUVBOztFQUVELFdBQVN1WixRQUFULENBQWtCdkIsRUFBbEIsRUFBc0I7RUFDckIsUUFBR2hCLGNBQWMsSUFDZEQsUUFBUSxDQUFDdFUsSUFBVCxDQUFjekssSUFBZCxLQUF1QmdmLGNBQWMsQ0FBQ3ZVLElBQWYsQ0FBb0J6SyxJQUQzQyxJQUVBK2UsUUFBUSxDQUFDdFUsSUFBVCxDQUFjWixHQUFkLEtBQXVCbVYsY0FBYyxDQUFDdlUsSUFBZixDQUFvQlosR0FGOUMsRUFFbUQ7RUFDbEQ7RUFDQSxVQUFJekQsS0FBSyxHQUFHO0VBQUMsZ0JBQVFmLE1BQU0sQ0FBQyxDQUFELENBQWY7RUFBb0IsZUFBTyxHQUEzQjtFQUNOLGtCQUFXMFosUUFBUSxDQUFDdFUsSUFBVCxDQUFjWixHQUFkLEtBQXNCLEdBQXRCLEdBQTRCa1YsUUFBUSxDQUFDdFUsSUFBVCxDQUFjekssSUFBMUMsR0FBaURnZixjQUFjLENBQUN2VSxJQUFmLENBQW9CekssSUFEMUU7RUFFSCxrQkFBVytlLFFBQVEsQ0FBQ3RVLElBQVQsQ0FBY1osR0FBZCxLQUFzQixHQUF0QixHQUE0Qm1WLGNBQWMsQ0FBQ3ZVLElBQWYsQ0FBb0J6SyxJQUFoRCxHQUF1RCtlLFFBQVEsQ0FBQ3RVLElBQVQsQ0FBY3pLO0VBRjdFLE9BQVo7RUFHQSxVQUFJaUQsVUFBVSxHQUFHTixZQUFZLENBQUMzRCxJQUFJLENBQUNnQyxPQUFOLENBQTdCO0VBQ0FoQyxNQUFBQSxJQUFJLENBQUNnQyxPQUFMLEdBQWVpQyxVQUFmO0VBRUEsVUFBSXFHLEdBQUcsR0FBR3BDLFlBQVksQ0FBQ2xJLElBQUksQ0FBQ2dDLE9BQU4sRUFBZStkLFFBQVEsQ0FBQ3RVLElBQVQsQ0FBY3pLLElBQTdCLENBQVosR0FBK0MsQ0FBekQ7RUFDQWhCLE1BQUFBLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYStmLE1BQWIsQ0FBb0J6WCxHQUFwQixFQUF5QixDQUF6QixFQUE0QmxELEtBQTVCO0VBQ0F3SCxNQUFBQSxPQUFPLENBQUM1TyxJQUFELENBQVA7RUFDQTs7RUFDRGlpQixJQUFBQSxtQkFBbUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLENBQW5CO0VBQ0E1TSxJQUFBQSxFQUFFLENBQUM4QyxTQUFILENBQWEsc0JBQWIsRUFDRW5QLElBREYsQ0FDTyxRQURQLEVBQ2dCLE9BRGhCO0VBRUErVyxJQUFBQSxRQUFRLEdBQUc3ZixTQUFYO0VBQ0E7RUFDQTs7RUFFRCxXQUFTbWlCLElBQVQsQ0FBY3JCLEVBQWQsRUFBa0I7RUFDakIzTCxJQUFBQSxFQUFFLENBQUN3RyxLQUFILENBQVMyRyxXQUFULENBQXFCelIsZUFBckI7RUFDQSxRQUFJMFIsRUFBRSxHQUFHcE4sRUFBRSxDQUFDd0csS0FBSCxDQUFTNEcsRUFBbEI7RUFDQSxRQUFJQyxFQUFFLEdBQUdyTixFQUFFLENBQUN3RyxLQUFILENBQVM2RyxFQUFsQjtFQUNNLFFBQUluVixJQUFJLEdBQUduSyxVQUFVLENBQUNpUyxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCdE0sSUFBaEIsQ0FBcUIsSUFBckIsQ0FBRCxDQUFWLEdBQXdDeVosRUFBbkQ7RUFDQSxRQUFJRSxJQUFJLEdBQUd2ZixVQUFVLENBQUNpUyxFQUFFLENBQUNDLE1BQUgsQ0FBVSxJQUFWLEVBQWdCdE0sSUFBaEIsQ0FBcUIsSUFBckIsQ0FBRCxDQUFWLEdBQXdDMFosRUFBbkQ7RUFDQVQsSUFBQUEsbUJBQW1CLENBQUNqaUIsSUFBSSxDQUFDeU4sV0FBTCxHQUFpQixFQUFsQixFQUFzQixDQUF0QixFQUF5QkYsSUFBekIsRUFBK0JvVixJQUEvQixDQUFuQjtFQUNOO0VBQ0Q7O0VBRUQsU0FBU1YsbUJBQVQsQ0FBNkJyQyxFQUE3QixFQUFpQ2dELEVBQWpDLEVBQXFDL0MsRUFBckMsRUFBeUNnRCxFQUF6QyxFQUE2Q0MsU0FBN0MsRUFBd0Q7RUFDdkQsTUFBR0EsU0FBSCxFQUNDek4sRUFBRSxDQUFDOEMsU0FBSCxDQUFhLHNCQUFiLEVBQXFDblAsSUFBckMsQ0FBMEMsV0FBMUMsRUFBdUQsZUFBYThaLFNBQWIsR0FBdUIsR0FBOUU7RUFDRHpOLEVBQUFBLEVBQUUsQ0FBQzhDLFNBQUgsQ0FBYSxzQkFBYixFQUNFblAsSUFERixDQUNPLElBRFAsRUFDYTRXLEVBRGIsRUFFRTVXLElBRkYsQ0FFTyxJQUZQLEVBRWE0WixFQUZiLEVBR0U1WixJQUhGLENBR08sSUFIUCxFQUdhNlcsRUFIYixFQUlFN1csSUFKRixDQUlPLElBSlAsRUFJYTZaLEVBSmI7RUFLQTs7RUFFRCxTQUFTNWMscUJBQVQsQ0FBK0JDLE1BQS9CLEVBQXVDO0VBQ25DLFNBQU9BLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjLENBQWQsRUFBaUJDLFdBQWpCLEtBQWlDRixNQUFNLENBQUMxQixLQUFQLENBQWEsQ0FBYixDQUF4QztFQUNIOzs7RUFHRCxTQUFTbWQsY0FBVCxDQUF3QjNoQixJQUF4QixFQUE4QnFFLENBQTlCLEVBQWlDO0VBQ2hDYSxFQUFBQSxDQUFDLENBQUMsa0JBQUQsQ0FBRCxDQUFzQkMsTUFBdEIsQ0FBNkI7RUFDekI0ZCxJQUFBQSxRQUFRLEVBQUUsS0FEZTtFQUV6QmhlLElBQUFBLEtBQUssRUFBRVYsQ0FBQyxDQUFDb0gsSUFBRixDQUFPK08sWUFGVztFQUd6Qm5WLElBQUFBLEtBQUssRUFBR0gsQ0FBQyxDQUFDNEksTUFBRCxDQUFELENBQVV6SSxLQUFWLEtBQW9CLEdBQXBCLEdBQTBCLEdBQTFCLEdBQWdDSCxDQUFDLENBQUM0SSxNQUFELENBQUQsQ0FBVXpJLEtBQVYsS0FBbUI7RUFIbEMsR0FBN0I7RUFNQSxNQUFJMmQsS0FBSyxHQUFHLDJDQUFaO0VBRUFBLEVBQUFBLEtBQUssSUFBSSxnSUFDUjNlLENBQUMsQ0FBQ29ILElBQUYsQ0FBT3pLLElBQVAsR0FBY3FELENBQUMsQ0FBQ29ILElBQUYsQ0FBT3pLLElBQXJCLEdBQTRCLEVBRHBCLElBQ3dCLGFBRGpDO0VBRUFnaUIsRUFBQUEsS0FBSyxJQUFJLDJJQUNOM2UsQ0FBQyxDQUFDb0gsSUFBRixDQUFPK08sWUFBUCxHQUFzQm5XLENBQUMsQ0FBQ29ILElBQUYsQ0FBTytPLFlBQTdCLEdBQTRDLEVBRHRDLElBQzBDLGFBRG5EO0VBR0F3SSxFQUFBQSxLQUFLLElBQUksOEpBQ04zZSxDQUFDLENBQUNvSCxJQUFGLENBQU8vRixHQUFQLEdBQWFyQixDQUFDLENBQUNvSCxJQUFGLENBQU8vRixHQUFwQixHQUEwQixFQURwQixJQUN3QixhQURqQztFQUdBc2QsRUFBQUEsS0FBSyxJQUFJLDRLQUNQM2UsQ0FBQyxDQUFDb0gsSUFBRixDQUFPOUYsR0FBUCxHQUFhdEIsQ0FBQyxDQUFDb0gsSUFBRixDQUFPOUYsR0FBcEIsR0FBMEIsRUFEbkIsSUFDdUIsYUFEaEM7RUFHQXFkLEVBQUFBLEtBQUssSUFBSSxxQ0FDTix1RUFETSxJQUNtRTNlLENBQUMsQ0FBQ29ILElBQUYsQ0FBT1osR0FBUCxLQUFlLEdBQWYsR0FBcUIsU0FBckIsR0FBaUMsRUFEcEcsSUFDd0csZUFEeEcsR0FFTix1RUFGTSxJQUVtRXhHLENBQUMsQ0FBQ29ILElBQUYsQ0FBT1osR0FBUCxLQUFlLEdBQWYsR0FBcUIsU0FBckIsR0FBaUMsRUFGcEcsSUFFd0csaUJBRnhHLEdBR04sc0ZBSE0sR0FJTixZQUpILENBcEJnQzs7RUEyQmhDbVksRUFBQUEsS0FBSyxJQUFJLHdDQUNOLDZFQURNLElBQ3lFbmdCLFFBQVEsQ0FBQ3dCLENBQUMsQ0FBQ29ILElBQUYsQ0FBTzdGLE1BQVIsQ0FBUixLQUE0QixDQUE1QixHQUFnQyxTQUFoQyxHQUE0QyxFQURySCxJQUN5SCx3QkFEekgsR0FFTiw2RUFGTSxJQUV5RS9DLFFBQVEsQ0FBQ3dCLENBQUMsQ0FBQ29ILElBQUYsQ0FBTzdGLE1BQVIsQ0FBUixLQUE0QixDQUE1QixHQUFnQyxTQUFoQyxHQUE0QyxFQUZySCxJQUV5SCwyQkFGekgsR0FHTixZQUhIO0VBSUFWLEVBQUFBLENBQUMsQ0FBQyw2QkFBMkJiLENBQUMsQ0FBQ29ILElBQUYsQ0FBTzdGLE1BQWxDLEdBQXlDLElBQTFDLENBQUQsQ0FBaURxWSxJQUFqRCxDQUFzRCxTQUF0RCxFQUFpRSxJQUFqRSxFQS9CZ0M7O0VBa0NoQyxNQUFJWSxRQUFRLEdBQUcsQ0FBQyxZQUFELEVBQWUsYUFBZixFQUE4QixhQUE5QixFQUE2QyxZQUE3QyxFQUEyRCxhQUEzRCxDQUFmO0VBQ0FtRSxFQUFBQSxLQUFLLElBQUksOERBQVQ7RUFDQUEsRUFBQUEsS0FBSyxJQUFJLHNCQUFUOztFQUNBLE9BQUksSUFBSWxFLE9BQU8sR0FBQyxDQUFoQixFQUFtQkEsT0FBTyxHQUFDRCxRQUFRLENBQUNyZCxNQUFwQyxFQUE0Q3NkLE9BQU8sRUFBbkQsRUFBc0Q7RUFDckQsUUFBSTlWLElBQUksR0FBRzZWLFFBQVEsQ0FBQ0MsT0FBRCxDQUFuQjtFQUNBLFFBQUdBLE9BQU8sS0FBSyxDQUFmLEVBQ0NrRSxLQUFLLElBQUksZ0NBQVQ7RUFDREEsSUFBQUEsS0FBSyxJQUNKLGtFQUFnRWhhLElBQWhFLEdBQ0csVUFESCxHQUNjQSxJQURkLEdBQ21CLGNBRG5CLElBQ21DM0UsQ0FBQyxDQUFDb0gsSUFBRixDQUFPekMsSUFBUCxJQUFlLFNBQWYsR0FBMkIsRUFEOUQsSUFDa0UsV0FEbEUsR0FFRy9DLHFCQUFxQixDQUFDK0MsSUFBSSxDQUFDc04sT0FBTCxDQUFhLEdBQWIsRUFBa0IsR0FBbEIsQ0FBRCxDQUZ4QixHQUVpRCxVQUhsRDtFQUlBOztFQUNEME0sRUFBQUEsS0FBSyxJQUFJLFlBQVQsQ0E5Q2dDOztFQWlEaEMsTUFBSTlFLE9BQU8sR0FBRyxDQUFDLFVBQUQsRUFBYSxNQUFiLEVBQXFCLGFBQXJCLEVBQW9DLFdBQXBDLEVBQWlELElBQWpELEVBQXVELFdBQXZELEVBQ0YsT0FERSxFQUNPLEtBRFAsRUFDYyxLQURkLEVBQ3FCLFFBRHJCLEVBQytCLGNBRC9CLEVBQytDLFFBRC9DLEVBQ3lELFFBRHpELEVBRUYsS0FGRSxFQUVLLFFBRkwsRUFFZSxRQUZmLENBQWQ7RUFHQWhaLEVBQUFBLENBQUMsQ0FBQzJDLEtBQUYsQ0FBUXFXLE9BQVIsRUFBaUJXLFFBQWpCO0VBQ0FtRSxFQUFBQSxLQUFLLElBQUksa0VBQVQ7RUFDQTlkLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBT25ILElBQUksQ0FBQ2lqQixRQUFaLEVBQXNCLFVBQVN4VSxDQUFULEVBQVk4SCxDQUFaLEVBQWU7RUFDcEMySCxJQUFBQSxPQUFPLENBQUN2YyxJQUFSLENBQWE0VSxDQUFDLENBQUNzRCxJQUFGLEdBQU8sZ0JBQXBCO0VBRUEsUUFBSXFKLGNBQWMsR0FBRyxzREFBb0RsakIsSUFBSSxDQUFDaWpCLFFBQUwsQ0FBY3hVLENBQWQsRUFBaUIwVSxNQUFyRSxHQUE0RSxXQUFqRztFQUNBLFFBQUluRyxhQUFhLEdBQUczWSxDQUFDLENBQUNvSCxJQUFGLENBQU84SyxDQUFDLENBQUNzRCxJQUFGLEdBQVMsZ0JBQWhCLENBQXBCO0VBRUFtSixJQUFBQSxLQUFLLElBQUksc0NBQW9DL2MscUJBQXFCLENBQUNzUSxDQUFDLENBQUNzRCxJQUFGLENBQU92RCxPQUFQLENBQWUsR0FBZixFQUFvQixHQUFwQixDQUFELENBQXpELEdBQ040TSxjQURNLEdBQ1MsaUJBRFQsR0FFTixxQ0FGTSxHQUdOM00sQ0FBQyxDQUFDc0QsSUFISSxHQUdHLDRDQUhILEdBSU50RCxDQUFDLENBQUNzRCxJQUpJLEdBSUcsMkRBSkgsSUFLTG1ELGFBQWEsS0FBSzljLFNBQWxCLEdBQThCOGMsYUFBOUIsR0FBOEMsRUFMekMsSUFLOEMsY0FMdkQ7RUFNQSxHQVpEO0VBY0FnRyxFQUFBQSxLQUFLLElBQUkseURBQVQ7RUFDQTlkLEVBQUFBLENBQUMsQ0FBQ2lDLElBQUYsQ0FBTzlDLENBQUMsQ0FBQ29ILElBQVQsRUFBZSxVQUFTZ0QsQ0FBVCxFQUFZOEgsQ0FBWixFQUFlO0VBQzdCLFFBQUdyUixDQUFDLENBQUNxRSxPQUFGLENBQVVrRixDQUFWLEVBQWF5UCxPQUFiLEtBQXlCLENBQUMsQ0FBN0IsRUFBZ0M7RUFDL0IsVUFBSWtGLEVBQUUsR0FBR25kLHFCQUFxQixDQUFDd0ksQ0FBRCxDQUE5Qjs7RUFDQSxVQUFHOEgsQ0FBQyxLQUFLLElBQU4sSUFBY0EsQ0FBQyxLQUFLLEtBQXZCLEVBQThCO0VBQzdCeU0sUUFBQUEsS0FBSyxJQUFJLHNDQUFvQ0ksRUFBcEMsR0FBdUMsK0NBQXZDLEdBQXlGM1UsQ0FBekYsR0FBNkYsVUFBN0YsR0FDUEEsQ0FETyxHQUNMLFVBREssR0FDTThILENBRE4sR0FDUSxHQURSLElBQ2FBLENBQUMsR0FBRyxTQUFILEdBQWUsRUFEN0IsSUFDaUMsYUFEMUM7RUFFQSxPQUhELE1BR08sSUFBRzlILENBQUMsQ0FBQ2pOLE1BQUYsR0FBVyxDQUFkLEVBQWdCO0VBQ3RCd2hCLFFBQUFBLEtBQUssSUFBSSxzQ0FBb0NJLEVBQXBDLEdBQXVDLDJDQUF2QyxHQUNQM1UsQ0FETyxHQUNMLFVBREssR0FDTUEsQ0FETixHQUNRLFVBRFIsR0FDbUI4SCxDQURuQixHQUNxQixhQUQ5QjtFQUVBO0VBQ0Q7RUFDRSxHQVhKO0VBWUF5TSxFQUFBQSxLQUFLLElBQUksVUFBVDtFQUVBOWQsRUFBQUEsQ0FBQyxDQUFDLGtCQUFELENBQUQsQ0FBc0IrTyxJQUF0QixDQUEyQitPLEtBQTNCO0VBQ0E5ZCxFQUFBQSxDQUFDLENBQUMsa0JBQUQsQ0FBRCxDQUFzQkMsTUFBdEIsQ0FBNkIsTUFBN0IsRUFwRmdDOztFQXVGaENELEVBQUFBLENBQUMsQ0FBQyxtSkFBRCxDQUFELENBQXVKaUYsTUFBdkosQ0FBOEosWUFBVztFQUN4SzRJLElBQUFBLElBQUksQ0FBQy9TLElBQUQsQ0FBSjtFQUNHLEdBRko7RUFHQW1lLEVBQUFBLE1BQU0sQ0FBQ25lLElBQUQsQ0FBTjtFQUNBO0VBQ0E7O0VDcmRNLElBQUlxakIsS0FBSyxHQUFHLEVBQVo7RUFDQSxTQUFTblMsS0FBVCxDQUFlekIsT0FBZixFQUF3QjtFQUM5QixNQUFJelAsSUFBSSxHQUFHa0YsQ0FBQyxDQUFDd0ssTUFBRixDQUFTO0VBQUU7RUFDckJjLElBQUFBLFNBQVMsRUFBRSxlQURRO0VBRW5CeE8sSUFBQUEsT0FBTyxFQUFFLENBQUU7RUFBQyxjQUFRLEtBQVQ7RUFBZ0Isc0JBQWdCLFFBQWhDO0VBQTBDLGFBQU8sR0FBakQ7RUFBc0QsbUJBQWE7RUFBbkUsS0FBRixFQUNKO0VBQUMsY0FBUSxLQUFUO0VBQWdCLHNCQUFnQixRQUFoQztFQUEwQyxhQUFPLEdBQWpEO0VBQXNELG1CQUFhO0VBQW5FLEtBREksRUFFSjtFQUFDLGNBQVEsS0FBVDtFQUFnQixzQkFBZ0IsSUFBaEM7RUFBc0MsYUFBTyxHQUE3QztFQUFrRCxnQkFBVSxLQUE1RDtFQUFtRSxnQkFBVSxLQUE3RTtFQUFvRixpQkFBVztFQUEvRixLQUZJLENBRlU7RUFLbkJxRCxJQUFBQSxLQUFLLEVBQUUsR0FMWTtFQU1uQitMLElBQUFBLE1BQU0sRUFBRSxHQU5XO0VBT25CM0QsSUFBQUEsV0FBVyxFQUFFLEVBUE07RUFRbkI2VixJQUFBQSxNQUFNLEVBQUUsR0FSVztFQVNuQkMsSUFBQUEsT0FBTyxFQUFFLEdBVFU7RUFVbkJOLElBQUFBLFFBQVEsRUFBRSxDQUFFO0VBQUMsY0FBUSxlQUFUO0VBQTBCLGdCQUFVO0VBQXBDLEtBQUYsRUFDUDtFQUFDLGNBQVEsZ0JBQVQ7RUFBMkIsZ0JBQVU7RUFBckMsS0FETyxFQUVQO0VBQUMsY0FBUSxnQkFBVDtFQUEyQixnQkFBVTtFQUFyQyxLQUZPLEVBR1A7RUFBQyxjQUFRLG1CQUFUO0VBQThCLGdCQUFVO0VBQXhDLEtBSE8sRUFJUDtFQUFDLGNBQVEsaUJBQVQ7RUFBNEIsZ0JBQVU7RUFBdEMsS0FKTyxDQVZTO0VBZW5CTyxJQUFBQSxNQUFNLEVBQUUsQ0FBQyxZQUFELEVBQWUsS0FBZixFQUFzQixLQUF0QixFQUE2QixTQUE3QixDQWZXO0VBZ0JuQmpTLElBQUFBLHFCQUFxQixFQUFFLEtBaEJKO0VBaUJuQjJPLElBQUFBLFNBQVMsRUFBRSxPQWpCUTtFQWtCbkJ1RCxJQUFBQSxXQUFXLEVBQUUsV0FsQk07RUFtQm5CQyxJQUFBQSxXQUFXLEVBQUUsR0FuQk07RUFvQm5CQyxJQUFBQSxVQUFVLEVBQUUsTUFwQk87RUFxQm5CQyxJQUFBQSxlQUFlLEVBQUUsU0FyQkU7RUFzQm5CQyxJQUFBQSxRQUFRLEVBQUUsSUF0QlM7RUF1Qm5CMVcsSUFBQUEsS0FBSyxFQUFFO0VBdkJZLEdBQVQsRUF1QktzQyxPQXZCTCxDQUFYOztFQXlCQSxNQUFLdkssQ0FBQyxDQUFFLGFBQUYsQ0FBRCxDQUFtQjFELE1BQW5CLEtBQThCLENBQW5DLEVBQXVDO0VBQ3RDO0VBQ0FzaUIsSUFBQUEsS0FBQSxDQUFhOWpCLElBQWI7RUFDQStqQixJQUFBQSxHQUFBLENBQU8vakIsSUFBUDtFQUNBOztFQUVELE1BQUd1TyxNQUFBLENBQWdCdk8sSUFBaEIsS0FBeUIsQ0FBQyxDQUE3QixFQUNDdU8sVUFBQSxDQUFvQnZPLElBQXBCO0VBRUQ4akIsRUFBQUEsYUFBQSxDQUF1QjlqQixJQUF2QixFQW5DOEI7O0VBc0M5Qm1iLEVBQUFBLGlCQUFpQixDQUFDbmIsSUFBRCxDQUFqQixDQXRDOEI7O0VBd0M5QkEsRUFBQUEsSUFBSSxDQUFDZ0MsT0FBTCxHQUFlZ2lCLGVBQWUsQ0FBQ2hrQixJQUFJLENBQUNnQyxPQUFOLENBQTlCO0VBRUEsTUFBR2hDLElBQUksQ0FBQ21OLEtBQVIsRUFDQzhXLFVBQUEsQ0FBMEJqa0IsSUFBMUI7RUFDRCxNQUFJa2tCLGNBQWMsR0FBR0Msa0JBQWtCLENBQUNua0IsSUFBRCxDQUF2QztFQUNBLE1BQUk2VSxHQUFHLEdBQUdRLEVBQUUsQ0FBQ0MsTUFBSCxDQUFVLE1BQUl0VixJQUFJLENBQUN3USxTQUFuQixFQUNMakIsTUFESyxDQUNFLFNBREYsRUFFTHZHLElBRkssQ0FFQSxPQUZBLEVBRVNrYixjQUFjLENBQUM3ZSxLQUZ4QixFQUdMMkQsSUFISyxDQUdBLFFBSEEsRUFHVWtiLGNBQWMsQ0FBQzlTLE1BSHpCLENBQVY7RUFLQXlELEVBQUFBLEdBQUcsQ0FBQ3RGLE1BQUosQ0FBVyxNQUFYLEVBQ0V2RyxJQURGLENBQ08sT0FEUCxFQUNnQixNQURoQixFQUVFQSxJQUZGLENBRU8sUUFGUCxFQUVpQixNQUZqQixFQUdFQSxJQUhGLENBR08sSUFIUCxFQUdhLENBSGIsRUFJRUEsSUFKRixDQUlPLElBSlAsRUFJYSxDQUpiLEVBS0VvWCxLQUxGLENBS1EsUUFMUixFQUtrQixVQUxsQixFQU1FQSxLQU5GLENBTVEsTUFOUixFQU1nQnBnQixJQUFJLENBQUMyakIsVUFOckI7RUFBQSxHQU9FdkQsS0FQRixDQU9RLGNBUFIsRUFPd0IsQ0FQeEI7RUFTQSxNQUFJZ0UsV0FBVyxHQUFHN1YsV0FBQSxDQUFxQnZPLElBQXJCLENBQWxCLENBM0Q4Qjs7RUE0RDlCLE1BQUlxa0IsVUFBVSxHQUFHRCxXQUFXLENBQUMsQ0FBRCxDQUE1QjtFQUNBLE1BQUlyTCxVQUFVLEdBQUdxTCxXQUFXLENBQUMsQ0FBRCxDQUE1QjtFQUNBLE1BQUluaEIsSUFBSSxHQUFHLENBQVg7O0VBQ0EsTUFBR21oQixXQUFXLENBQUM1aUIsTUFBWixJQUFzQixDQUF6QixFQUEyQjtFQUMxQnlCLElBQUFBLElBQUksR0FBR21oQixXQUFXLENBQUMsQ0FBRCxDQUFsQjtFQUNBOztFQUVELE1BQUdDLFVBQVUsS0FBSyxJQUFmLElBQXVCdEwsVUFBVSxLQUFLLElBQXpDLEVBQStDO0VBQzlDc0wsSUFBQUEsVUFBVSxHQUFHcmtCLElBQUksQ0FBQ3lOLFdBQUwsR0FBaUIsQ0FBOUI7RUFDQXNMLElBQUFBLFVBQVUsR0FBSSxDQUFDL1ksSUFBSSxDQUFDeU4sV0FBTixHQUFrQixHQUFoQztFQUNBOztFQUNELE1BQUkwTyxHQUFHLEdBQUd0SCxHQUFHLENBQUN0RixNQUFKLENBQVcsR0FBWCxFQUNOdkcsSUFETSxDQUNELE9BREMsRUFDUSxTQURSLEVBRU5BLElBRk0sQ0FFRCxXQUZDLEVBRVksZUFBYXFiLFVBQWIsR0FBd0IsR0FBeEIsR0FBOEJ0TCxVQUE5QixHQUEyQyxVQUEzQyxHQUFzRDlWLElBQXRELEdBQTJELEdBRnZFLENBQVY7RUFJQSxNQUFJb0ksU0FBUyxHQUFHbkcsQ0FBQyxDQUFDd0YsR0FBRixDQUFNMUssSUFBSSxDQUFDZ0MsT0FBWCxFQUFvQixVQUFTMkksR0FBVCxFQUFjQyxFQUFkLEVBQWlCO0VBQUMsV0FBTyxlQUFlRCxHQUFmLElBQXNCQSxHQUFHLENBQUNVLFNBQTFCLEdBQXNDVixHQUF0QyxHQUE0QyxJQUFuRDtFQUF5RCxHQUEvRixDQUFoQjtFQUNBLE1BQUkyWixXQUFXLEdBQUc7RUFDakJ0akIsSUFBQUEsSUFBSSxFQUFHLGFBRFU7RUFFakI0QyxJQUFBQSxFQUFFLEVBQUcsQ0FGWTtFQUdqQm9FLElBQUFBLE1BQU0sRUFBRyxJQUhRO0VBSWpCbEIsSUFBQUEsUUFBUSxFQUFHdUU7RUFKTSxHQUFsQjtFQU9BLE1BQUluRSxRQUFRLEdBQUcrYyxTQUFBLENBQXlCamtCLElBQXpCLEVBQStCc2tCLFdBQS9CLEVBQTRDQSxXQUE1QyxFQUF5RCxDQUF6RCxDQUFmO0VBQ0EsTUFBSTFkLElBQUksR0FBR3lPLEVBQUUsQ0FBQ2tQLFNBQUgsQ0FBYUQsV0FBYixDQUFYO0VBQ0FqQixFQUFBQSxLQUFLLENBQUNyakIsSUFBSSxDQUFDd1EsU0FBTixDQUFMLEdBQXdCNUosSUFBeEIsQ0FyRjhCOztFQXdGOUIsTUFBSXlSLGVBQWUsR0FBR0MsbUJBQW1CLENBQUN0WSxJQUFELENBQXpDO0VBQ0EsTUFBR0EsSUFBSSxDQUFDbU4sS0FBUixFQUNDaEwsT0FBTyxDQUFDaUwsR0FBUixDQUFZLGdCQUFjOFcsY0FBYyxDQUFDN2UsS0FBN0IsR0FBbUMsU0FBbkMsR0FBNkNnVCxlQUFlLENBQUNoVCxLQUE3RCxHQUNULGVBRFMsR0FDTzZlLGNBQWMsQ0FBQzlTLE1BRHRCLEdBQzZCLFVBRDdCLEdBQ3dDaUgsZUFBZSxDQUFDakgsTUFEcEU7RUFHRCxNQUFJb1QsT0FBTyxHQUFHblAsRUFBRSxDQUFDb1AsSUFBSCxHQUFVQyxVQUFWLENBQXFCLFVBQVM1Z0IsQ0FBVCxFQUFZQyxDQUFaLEVBQWU7RUFDakQsV0FBT0QsQ0FBQyxDQUFDaUUsTUFBRixLQUFhaEUsQ0FBQyxDQUFDZ0UsTUFBZixJQUF5QmpFLENBQUMsQ0FBQzJILElBQUYsQ0FBT3pELE1BQWhDLElBQTBDakUsQ0FBQyxDQUFDMEgsSUFBRixDQUFPekQsTUFBakQsR0FBMEQsR0FBMUQsR0FBZ0UsR0FBdkU7RUFDQSxHQUZhLEVBRVgyYyxJQUZXLENBRU4sQ0FBQ3RNLGVBQWUsQ0FBQ2hULEtBQWpCLEVBQXdCZ1QsZUFBZSxDQUFDakgsTUFBeEMsQ0FGTSxDQUFkO0VBSUEsTUFBSXBLLEtBQUssR0FBR3dkLE9BQU8sQ0FBQzVkLElBQUksQ0FBQy9DLElBQUwsQ0FBVSxVQUFTQyxDQUFULEVBQVlDLENBQVosRUFBZTtFQUFFLFdBQU9ELENBQUMsQ0FBQzJILElBQUYsQ0FBTzdILEVBQVAsR0FBWUcsQ0FBQyxDQUFDMEgsSUFBRixDQUFPN0gsRUFBMUI7RUFBK0IsR0FBMUQsQ0FBRCxDQUFuQjtFQUNBLE1BQUkrSCxZQUFZLEdBQUczRSxLQUFLLENBQUM4RixXQUFOLEVBQW5CLENBbEc4Qjs7RUFxRzlCLE1BQUk4WCxTQUFTLEdBQUcxZixDQUFDLENBQUN3RixHQUFGLENBQU0xSyxJQUFJLENBQUNnQyxPQUFYLEVBQW9CLFVBQVNzRixDQUFULEVBQVlzRCxFQUFaLEVBQWU7RUFBQyxXQUFPdEQsQ0FBQyxDQUFDVSxNQUFGLEdBQVcsSUFBWCxHQUFrQlYsQ0FBekI7RUFBNEIsR0FBaEUsQ0FBaEI7O0VBQ0EsTUFBR3NkLFNBQVMsQ0FBQ3BqQixNQUFWLElBQW9CeEIsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhUixNQUFwQyxFQUE0QztFQUMzQyxVQUFNcWpCLFVBQVUsQ0FBQyw0REFBRCxDQUFoQjtFQUNBOztFQUVEWixFQUFBQSxhQUFBLENBQTZCamtCLElBQTdCLEVBQW1DZ0gsS0FBbkMsRUFBMEMyRSxZQUExQztFQUVBLE1BQUltWixZQUFZLEdBQUdiLFNBQUEsQ0FBeUJ0WSxZQUF6QixFQUF1Q3pFLFFBQXZDLENBQW5CO0VBQ0E2ZCxFQUFBQSxlQUFlLENBQUMva0IsSUFBRCxFQUFPOGtCLFlBQVAsQ0FBZixDQTdHOEI7O0VBK0c5QixNQUFJaFosSUFBSSxHQUFHcVEsR0FBRyxDQUFDaEUsU0FBSixDQUFjLE9BQWQsRUFDTDFNLElBREssQ0FDQXpFLEtBQUssQ0FBQzhGLFdBQU4sRUFEQSxFQUVMa1ksS0FGSyxHQUdMelYsTUFISyxDQUdFLEdBSEYsRUFJTnZHLElBSk0sQ0FJRCxXQUpDLEVBSVksVUFBUzNFLENBQVQsRUFBWXVHLEVBQVosRUFBZ0I7RUFDbEMsV0FBTyxlQUFldkcsQ0FBQyxDQUFDdEIsQ0FBakIsR0FBcUIsR0FBckIsR0FBMkJzQixDQUFDLENBQUNyQixDQUE3QixHQUFpQyxHQUF4QztFQUNBLEdBTk0sQ0FBWCxDQS9HOEI7O0VBd0g5QjhJLEVBQUFBLElBQUksQ0FBQ3lELE1BQUwsQ0FBWSxNQUFaLEVBQ0U2SSxNQURGLENBQ1MsVUFBVS9ULENBQVYsRUFBYTtFQUFDLFdBQU8sQ0FBQ0EsQ0FBQyxDQUFDb0gsSUFBRixDQUFPekQsTUFBZjtFQUF1QixHQUQ5QyxFQUVFZ0IsSUFGRixDQUVPLGlCQUZQLEVBRTBCLG9CQUYxQixFQUdFQSxJQUhGLENBR08sV0FIUCxFQUdvQixVQUFTM0UsQ0FBVCxFQUFZO0VBQUMsV0FBT0EsQ0FBQyxDQUFDb0gsSUFBRixDQUFPWixHQUFQLElBQWMsR0FBZCxJQUFxQixFQUFFeEcsQ0FBQyxDQUFDb0gsSUFBRixDQUFPd1osV0FBUCxJQUFzQjVnQixDQUFDLENBQUNvSCxJQUFGLENBQU95WixXQUEvQixDQUFyQixHQUFtRSxZQUFuRSxHQUFrRixFQUF6RjtFQUE2RixHQUg5SCxFQUlFbGMsSUFKRixDQUlPLEdBSlAsRUFJWXFNLEVBQUUsQ0FBQzhQLE1BQUgsR0FBWVIsSUFBWixDQUFpQixVQUFTM0QsRUFBVCxFQUFhO0VBQUUsV0FBUWhoQixJQUFJLENBQUN5TixXQUFMLEdBQW1Cek4sSUFBSSxDQUFDeU4sV0FBekIsR0FBd0MsQ0FBL0M7RUFBa0QsR0FBbEYsRUFDUm9NLElBRFEsQ0FDSCxVQUFTeFYsQ0FBVCxFQUFZO0VBQ2pCLFFBQUdBLENBQUMsQ0FBQ29ILElBQUYsQ0FBT3daLFdBQVAsSUFBc0I1Z0IsQ0FBQyxDQUFDb0gsSUFBRixDQUFPeVosV0FBaEMsRUFDQyxPQUFPN1AsRUFBRSxDQUFDK1AsY0FBVjtFQUNELFdBQU8vZ0IsQ0FBQyxDQUFDb0gsSUFBRixDQUFPWixHQUFQLElBQWMsR0FBZCxHQUFvQndLLEVBQUUsQ0FBQ2dRLFlBQXZCLEdBQXNDaFEsRUFBRSxDQUFDaVEsWUFBaEQ7RUFBOEQsR0FKdEQsQ0FKWixFQVNFbEYsS0FURixDQVNRLFFBVFIsRUFTa0IsVUFBVS9iLENBQVYsRUFBYTtFQUM3QixXQUFPQSxDQUFDLENBQUNvSCxJQUFGLENBQU8vRixHQUFQLElBQWNyQixDQUFDLENBQUNvSCxJQUFGLENBQU85RixHQUFyQixJQUE0QixDQUFDdEIsQ0FBQyxDQUFDb0gsSUFBRixDQUFPeVMsT0FBcEMsR0FBOEMsU0FBOUMsR0FBMEQsTUFBakU7RUFDQSxHQVhGLEVBWUVrQyxLQVpGLENBWVEsY0FaUixFQVl3QixVQUFVL2IsQ0FBVixFQUFhO0VBQ25DLFdBQU9BLENBQUMsQ0FBQ29ILElBQUYsQ0FBTy9GLEdBQVAsSUFBY3JCLENBQUMsQ0FBQ29ILElBQUYsQ0FBTzlGLEdBQXJCLElBQTRCLENBQUN0QixDQUFDLENBQUNvSCxJQUFGLENBQU95UyxPQUFwQyxHQUE4QyxNQUE5QyxHQUF1RCxNQUE5RDtFQUNBLEdBZEYsRUFlRWtDLEtBZkYsQ0FlUSxrQkFmUixFQWU0QixVQUFVL2IsQ0FBVixFQUFhO0VBQUMsV0FBTyxDQUFDQSxDQUFDLENBQUNvSCxJQUFGLENBQU95UyxPQUFSLEdBQWtCLElBQWxCLEdBQTBCLE1BQWpDO0VBQTBDLEdBZnBGLEVBZ0JFa0MsS0FoQkYsQ0FnQlEsTUFoQlIsRUFnQmdCLE1BaEJoQixFQXhIOEI7O0VBMkk5QnRVLEVBQUFBLElBQUksQ0FBQ3lELE1BQUwsQ0FBWSxVQUFaLEVBQ0V2RyxJQURGLENBQ08sSUFEUCxFQUNhLFVBQVUzRSxDQUFWLEVBQWE7RUFBQyxXQUFPQSxDQUFDLENBQUNvSCxJQUFGLENBQU96SyxJQUFkO0VBQW9CLEdBRC9DLEVBQ2lEdU8sTUFEakQsQ0FDd0QsTUFEeEQsRUFFRTZJLE1BRkYsQ0FFUyxVQUFVL1QsQ0FBVixFQUFhO0VBQUMsV0FBTyxFQUFFQSxDQUFDLENBQUNvSCxJQUFGLENBQU96RCxNQUFQLElBQWlCLENBQUNoSSxJQUFJLENBQUNtTixLQUF6QixDQUFQO0VBQXdDLEdBRi9ELEVBR0VuRSxJQUhGLENBR08sT0FIUCxFQUdnQixNQUhoQixFQUlFQSxJQUpGLENBSU8sV0FKUCxFQUlvQixVQUFTM0UsQ0FBVCxFQUFZO0VBQUMsV0FBT0EsQ0FBQyxDQUFDb0gsSUFBRixDQUFPWixHQUFQLElBQWMsR0FBZCxJQUFxQixFQUFFeEcsQ0FBQyxDQUFDb0gsSUFBRixDQUFPd1osV0FBUCxJQUFzQjVnQixDQUFDLENBQUNvSCxJQUFGLENBQU95WixXQUEvQixDQUFyQixHQUFtRSxZQUFuRSxHQUFrRixFQUF6RjtFQUE2RixHQUo5SCxFQUtFbGMsSUFMRixDQUtPLEdBTFAsRUFLWXFNLEVBQUUsQ0FBQzhQLE1BQUgsR0FBWVIsSUFBWixDQUFpQixVQUFTdGdCLENBQVQsRUFBWTtFQUN0QyxRQUFJQSxDQUFDLENBQUNvSCxJQUFGLENBQU96RCxNQUFYLEVBQ0MsT0FBT2hJLElBQUksQ0FBQ3lOLFdBQUwsR0FBbUJ6TixJQUFJLENBQUN5TixXQUF4QixHQUFzQyxDQUE3QztFQUNELFdBQU96TixJQUFJLENBQUN5TixXQUFMLEdBQW1Cek4sSUFBSSxDQUFDeU4sV0FBL0I7RUFDQSxHQUpTLEVBS1RvTSxJQUxTLENBS0osVUFBU3hWLENBQVQsRUFBWTtFQUNqQixRQUFHQSxDQUFDLENBQUNvSCxJQUFGLENBQU93WixXQUFQLElBQXNCNWdCLENBQUMsQ0FBQ29ILElBQUYsQ0FBT3laLFdBQWhDLEVBQ0MsT0FBTzdQLEVBQUUsQ0FBQytQLGNBQVY7RUFDRCxXQUFPL2dCLENBQUMsQ0FBQ29ILElBQUYsQ0FBT1osR0FBUCxJQUFjLEdBQWQsR0FBb0J3SyxFQUFFLENBQUNnUSxZQUF2QixHQUFxQ2hRLEVBQUUsQ0FBQ2lRLFlBQS9DO0VBQTZELEdBUnBELENBTFosRUEzSThCOztFQTJKOUIsTUFBSUMsT0FBTyxHQUFHelosSUFBSSxDQUFDcU0sU0FBTCxDQUFlLFNBQWYsRUFDVjFNLElBRFUsQ0FDTCxVQUFTcEgsQ0FBVCxFQUFZO0VBQUs7RUFDdEIsUUFBSW1oQixRQUFRLEdBQUcsQ0FBZjtFQUNBLFFBQUl6VCxPQUFPLEdBQUc3TSxDQUFDLENBQUN3RixHQUFGLENBQU0xSyxJQUFJLENBQUNpakIsUUFBWCxFQUFxQixVQUFTdFksR0FBVCxFQUFjcEosQ0FBZCxFQUFnQjtFQUNsRCxVQUFHa2tCLFdBQVcsQ0FBQ3psQixJQUFJLENBQUNpakIsUUFBTCxDQUFjMWhCLENBQWQsRUFBaUJzWSxJQUFsQixFQUF3QnhWLENBQUMsQ0FBQ29ILElBQTFCLENBQWQsRUFBK0M7RUFBQytaLFFBQUFBLFFBQVE7RUFBSSxlQUFPLENBQVA7RUFBVSxPQUF0RSxNQUE0RSxPQUFPLENBQVA7RUFDNUUsS0FGYSxDQUFkO0VBR0EsUUFBR0EsUUFBUSxLQUFLLENBQWhCLEVBQW1CelQsT0FBTyxHQUFHLENBQUMsQ0FBRCxDQUFWO0VBQ25CLFdBQU8sQ0FBQzdNLENBQUMsQ0FBQ3dGLEdBQUYsQ0FBTXFILE9BQU4sRUFBZSxVQUFTcEgsR0FBVCxFQUFjQyxFQUFkLEVBQWlCO0VBQ3ZDLGFBQU87RUFBQyxrQkFBVUQsR0FBWDtFQUFnQixvQkFBWTZhLFFBQTVCO0VBQXNDLGNBQU1uaEIsQ0FBQyxDQUFDb0gsSUFBRixDQUFPekssSUFBbkQ7RUFDUCxlQUFPcUQsQ0FBQyxDQUFDb0gsSUFBRixDQUFPWixHQURQO0VBQ1ksbUJBQVd4RyxDQUFDLENBQUNvSCxJQUFGLENBQU90QyxPQUQ5QjtFQUN1QyxrQkFBVTlFLENBQUMsQ0FBQ29ILElBQUYsQ0FBT3pELE1BRHhEO0VBRVAsb0JBQVkzRCxDQUFDLENBQUNvSCxJQUFGLENBQU82USxRQUZaO0VBR1AsbUJBQVdqWSxDQUFDLENBQUNvSCxJQUFGLENBQU95UztFQUhYLE9BQVA7RUFHNEIsS0FKckIsQ0FBRCxDQUFQO0VBS0EsR0FaVSxFQWFWOEcsS0FiVSxHQWNaelYsTUFkWSxDQWNMLEdBZEssQ0FBZDtFQWdCQWdXLEVBQUFBLE9BQU8sQ0FBQ3BOLFNBQVIsQ0FBa0IsTUFBbEIsRUFDRTFNLElBREYsQ0FDTzRKLEVBQUUsQ0FBQ3FRLEdBQUgsR0FBU3JYLEtBQVQsQ0FBZSxVQUFTaEssQ0FBVCxFQUFZO0VBQUMsV0FBT0EsQ0FBQyxDQUFDMFksTUFBVDtFQUFpQixHQUE3QyxDQURQLEVBRUVpSSxLQUZGLEdBRVV6VixNQUZWLENBRWlCLE1BRmpCLEVBR0d2RyxJQUhILENBR1EsV0FIUixFQUdxQixVQUFTM0UsQ0FBVCxFQUFZO0VBQUMsV0FBTyxVQUFRQSxDQUFDLENBQUNvSCxJQUFGLENBQU83SCxFQUFmLEdBQWtCLEdBQXpCO0VBQThCLEdBSGhFO0VBQUEsR0FJR29GLElBSkgsQ0FJUSxPQUpSLEVBSWlCLFNBSmpCLEVBS0dBLElBTEgsQ0FLUSxHQUxSLEVBS2FxTSxFQUFFLENBQUNzUSxHQUFILEdBQVNDLFdBQVQsQ0FBcUIsQ0FBckIsRUFBd0JDLFdBQXhCLENBQW9DN2xCLElBQUksQ0FBQ3lOLFdBQXpDLENBTGIsRUFNRzJTLEtBTkgsQ0FNUyxNQU5ULEVBTWlCLFVBQVMvYixDQUFULEVBQVk5QyxDQUFaLEVBQWU7RUFDN0IsUUFBRzhDLENBQUMsQ0FBQ29ILElBQUYsQ0FBT3lTLE9BQVYsRUFDQyxPQUFPLFdBQVA7O0VBQ0QsUUFBRzdaLENBQUMsQ0FBQ29ILElBQUYsQ0FBTytaLFFBQVAsS0FBb0IsQ0FBdkIsRUFBMEI7RUFDekIsVUFBR25oQixDQUFDLENBQUNvSCxJQUFGLENBQU82USxRQUFWLEVBQ0MsT0FBTyxVQUFQO0VBQ0QsYUFBT3RjLElBQUksQ0FBQzRqQixlQUFaO0VBQ0E7O0VBQ0QsV0FBTzVqQixJQUFJLENBQUNpakIsUUFBTCxDQUFjMWhCLENBQWQsRUFBaUI0aEIsTUFBeEI7RUFDQSxHQWZILEVBM0s4Qjs7RUE2TDlCclgsRUFBQUEsSUFBSSxDQUFDeUQsTUFBTCxDQUFZLE1BQVosRUFDRTZJLE1BREYsQ0FDUyxVQUFVL1QsQ0FBVixFQUFhO0VBQUMsV0FBTyxDQUFDQSxDQUFDLENBQUNvSCxJQUFGLENBQU96RCxNQUFSLEtBQW1CM0QsQ0FBQyxDQUFDb0gsSUFBRixDQUFPcWEsVUFBUCxJQUFxQnpoQixDQUFDLENBQUNvSCxJQUFGLENBQU9zYSxXQUEvQyxDQUFQO0VBQW9FLEdBRDNGLEVBRUUvYyxJQUZGLENBRU8sR0FGUCxFQUVZLFVBQVNnWSxFQUFULEVBQWE7RUFBRTtFQUN6QixVQUFJeUIsRUFBRSxHQUFHLEVBQUV6aUIsSUFBSSxDQUFDeU4sV0FBTCxHQUFtQixJQUFyQixDQUFUO0VBQ0EsVUFBSWlWLEVBQUUsR0FBRyxFQUFFMWlCLElBQUksQ0FBQ3lOLFdBQUwsR0FBbUIsSUFBckIsQ0FBVDtFQUNBLFVBQUl1WSxNQUFNLEdBQUdobUIsSUFBSSxDQUFDeU4sV0FBTCxHQUFpQixDQUE5QjtFQUNBLGFBQU93WSxXQUFXLENBQUN4RCxFQUFELEVBQUtDLEVBQUwsRUFBU3NELE1BQVQsRUFBaUJobUIsSUFBakIsQ0FBWCxHQUFrQ2ltQixXQUFXLENBQUMsQ0FBQ3hELEVBQUYsRUFBTUMsRUFBTixFQUFVLENBQUNzRCxNQUFYLEVBQW1CaG1CLElBQW5CLENBQXBEO0VBQ0M7RUFBQyxHQVBKLEVBUUVvZ0IsS0FSRixDQVFRLFFBUlIsRUFRa0IsVUFBVS9iLENBQVYsRUFBYTtFQUM3QixXQUFPQSxDQUFDLENBQUNvSCxJQUFGLENBQU8vRixHQUFQLElBQWNyQixDQUFDLENBQUNvSCxJQUFGLENBQU85RixHQUFyQixJQUE0QixDQUFDdEIsQ0FBQyxDQUFDb0gsSUFBRixDQUFPeVMsT0FBcEMsR0FBOEMsU0FBOUMsR0FBMEQsTUFBakU7RUFDQSxHQVZGLEVBV0VrQyxLQVhGLENBV1EsY0FYUixFQVd3QixVQUFVWSxFQUFWLEVBQWM7RUFDcEMsV0FBTyxNQUFQO0VBQ0EsR0FiRixFQWNFWixLQWRGLENBY1Esa0JBZFIsRUFjNEIsVUFBVS9iLENBQVYsRUFBYTtFQUFDLFdBQU8sQ0FBQ0EsQ0FBQyxDQUFDb0gsSUFBRixDQUFPeVMsT0FBUixHQUFrQixJQUFsQixHQUEwQixNQUFqQztFQUEwQyxHQWRwRixFQWVFa0MsS0FmRixDQWVRLE1BZlIsRUFlZ0IsTUFmaEIsRUE3TDhCOztFQWdOOUJ0VSxFQUFBQSxJQUFJLENBQUN5RCxNQUFMLENBQVksTUFBWixFQUNFNkksTUFERixDQUNTLFVBQVUvVCxDQUFWLEVBQWE7RUFBQyxXQUFPQSxDQUFDLENBQUNvSCxJQUFGLENBQU83RixNQUFQLElBQWlCLENBQXhCO0VBQTJCLEdBRGxELEVBRUd3YSxLQUZILENBRVMsUUFGVCxFQUVtQixPQUZuQixFQUdHcFgsSUFISCxDQUdRLElBSFIsRUFHYyxVQUFTZ1ksRUFBVCxFQUFhcFcsRUFBYixFQUFpQjtFQUFDLFdBQU8sQ0FBQyxHQUFELEdBQUs1SyxJQUFJLENBQUN5TixXQUFqQjtFQUE4QixHQUg5RCxFQUlHekUsSUFKSCxDQUlRLElBSlIsRUFJYyxVQUFTZ1ksRUFBVCxFQUFhcFcsRUFBYixFQUFpQjtFQUFDLFdBQU8sTUFBSTVLLElBQUksQ0FBQ3lOLFdBQWhCO0VBQTZCLEdBSjdELEVBS0d6RSxJQUxILENBS1EsSUFMUixFQUtjLFVBQVNnWSxFQUFULEVBQWFwVyxFQUFiLEVBQWlCO0VBQUMsV0FBTyxNQUFJNUssSUFBSSxDQUFDeU4sV0FBaEI7RUFBNkIsR0FMN0QsRUFNR3pFLElBTkgsQ0FNUSxJQU5SLEVBTWMsVUFBU2dZLEVBQVQsRUFBYXBXLEVBQWIsRUFBaUI7RUFBQyxXQUFPLENBQUMsR0FBRCxHQUFLNUssSUFBSSxDQUFDeU4sV0FBakI7RUFBOEIsR0FOOUQsRUFoTjhCOztFQXlOOUJ5WSxFQUFBQSxRQUFRLENBQUNsbUIsSUFBRCxFQUFPOEwsSUFBUCxFQUFhLE9BQWIsRUFBc0IsRUFBRSxNQUFNOUwsSUFBSSxDQUFDeU4sV0FBYixDQUF0QixFQUFpRCxFQUFFLE1BQU16TixJQUFJLENBQUN5TixXQUFiLENBQWpELEVBQ04sVUFBU3BKLENBQVQsRUFBWTtFQUNYLFFBQUdyRSxJQUFJLENBQUNtTixLQUFSLEVBQ0MsT0FBTyxDQUFDLGtCQUFrQjlJLENBQUMsQ0FBQ29ILElBQXBCLEdBQTJCcEgsQ0FBQyxDQUFDb0gsSUFBRixDQUFPK08sWUFBbEMsR0FBaURuVyxDQUFDLENBQUNvSCxJQUFGLENBQU96SyxJQUF6RCxJQUFpRSxJQUFqRSxHQUF3RXFELENBQUMsQ0FBQ29ILElBQUYsQ0FBTzdILEVBQXRGO0VBQ0QsV0FBTyxrQkFBa0JTLENBQUMsQ0FBQ29ILElBQXBCLEdBQTJCcEgsQ0FBQyxDQUFDb0gsSUFBRixDQUFPK08sWUFBbEMsR0FBaUQsRUFBeEQ7RUFBNEQsR0FKdkQsQ0FBUjtFQU1EO0VBQ0E7RUFDQTtFQUNBOztFQUVDLE1BQUkwRixTQUFTLEdBQUdyZCxRQUFRLENBQUNzakIsS0FBSyxDQUFDbm1CLElBQUQsQ0FBTixDQUFSLEdBQXdCLENBQXhDLENBcE84Qjs7RUFBQSw2QkFzT3RCb21CLElBdE9zQjtFQXVPN0IsUUFBSUMsS0FBSyxHQUFHcm1CLElBQUksQ0FBQ3dqQixNQUFMLENBQVk0QyxJQUFaLENBQVo7RUFDQUYsSUFBQUEsUUFBUSxDQUFDbG1CLElBQUQsRUFBTzhMLElBQVAsRUFBYSxPQUFiLEVBQXNCLEVBQUUsTUFBTTlMLElBQUksQ0FBQ3lOLFdBQWIsQ0FBdEIsRUFDUCxVQUFTcEosQ0FBVCxFQUFZO0VBQ1gsVUFBRyxDQUFDQSxDQUFDLENBQUNvSCxJQUFGLENBQU80YSxLQUFQLENBQUosRUFDQztFQUNEaGlCLE1BQUFBLENBQUMsQ0FBQ2lpQixRQUFGLEdBQWNGLElBQUksS0FBSyxDQUFULElBQWMsQ0FBQy9oQixDQUFDLENBQUNpaUIsUUFBakIsR0FBNEJwRyxTQUFTLEdBQUMsSUFBdEMsR0FBNkM3YixDQUFDLENBQUNpaUIsUUFBRixHQUFXcEcsU0FBdEU7RUFDQSxhQUFPN2IsQ0FBQyxDQUFDaWlCLFFBQVQ7RUFDQSxLQU5NLEVBT1AsVUFBU2ppQixDQUFULEVBQVk7RUFDWCxVQUFHQSxDQUFDLENBQUNvSCxJQUFGLENBQU80YSxLQUFQLENBQUgsRUFBa0I7RUFDakIsWUFBR0EsS0FBSyxLQUFLLFNBQWIsRUFBd0I7RUFDdkIsY0FBSTlKLE9BQU8sR0FBRyxFQUFkO0VBQ0EsY0FBSWdLLElBQUksR0FBR2xpQixDQUFDLENBQUNvSCxJQUFGLENBQU84USxPQUFQLENBQWVMLEtBQWYsQ0FBcUIsR0FBckIsQ0FBWDs7RUFDQSxlQUFJLElBQUlzSyxJQUFJLEdBQUcsQ0FBZixFQUFpQkEsSUFBSSxHQUFHRCxJQUFJLENBQUMva0IsTUFBN0IsRUFBb0NnbEIsSUFBSSxFQUF4QyxFQUE0QztFQUMzQyxnQkFBR0QsSUFBSSxDQUFDQyxJQUFELENBQUosS0FBZSxFQUFsQixFQUFzQmpLLE9BQU8sSUFBSWdLLElBQUksQ0FBQ0MsSUFBRCxDQUFKLEdBQWEsR0FBeEI7RUFDdEI7O0VBQ0QsaUJBQU9qSyxPQUFQO0VBQ0EsU0FQRCxNQU9PLElBQUc4SixLQUFLLEtBQUssS0FBYixFQUFvQjtFQUMxQixpQkFBT2hpQixDQUFDLENBQUNvSCxJQUFGLENBQU80YSxLQUFQLElBQWUsR0FBdEI7RUFDQSxTQUZNLE1BRUEsSUFBR0EsS0FBSyxLQUFLLFlBQWIsRUFBMkI7RUFDakMsaUJBQU8sSUFBUDtFQUNBOztFQUNELGVBQU9oaUIsQ0FBQyxDQUFDb0gsSUFBRixDQUFPNGEsS0FBUCxDQUFQO0VBQ0E7RUFDRCxLQXZCTSxFQXVCSixjQXZCSSxDQUFSO0VBeE82Qjs7RUFzTzlCLE9BQUksSUFBSUQsSUFBSSxHQUFDLENBQWIsRUFBZ0JBLElBQUksR0FBQ3BtQixJQUFJLENBQUN3akIsTUFBTCxDQUFZaGlCLE1BQWpDLEVBQXlDNGtCLElBQUksRUFBN0MsRUFBaUQ7RUFBQSxVQUF6Q0EsSUFBeUM7RUEwQmhELEdBaFE2Qjs7O0VBQUEsK0JBbVF0QjdrQixDQW5Rc0I7RUFvUTdCLFFBQUlrbEIsT0FBTyxHQUFHem1CLElBQUksQ0FBQ2lqQixRQUFMLENBQWMxaEIsQ0FBZCxFQUFpQnNZLElBQS9CO0VBQ0FxTSxJQUFBQSxRQUFRLENBQUNsbUIsSUFBRCxFQUFPOEwsSUFBUCxFQUFhLE9BQWIsRUFBc0IsQ0FBRTlMLElBQUksQ0FBQ3lOLFdBQTdCLEVBQ04sVUFBU3BKLENBQVQsRUFBWTtFQUNYLFVBQUlpaUIsUUFBUSxHQUFJamlCLENBQUMsQ0FBQ2lpQixRQUFGLEdBQWFqaUIsQ0FBQyxDQUFDaWlCLFFBQUYsR0FBV3BHLFNBQXhCLEdBQW1DQSxTQUFTLEdBQUMsR0FBN0Q7O0VBQ0EsV0FBSSxJQUFJN1ksQ0FBQyxHQUFDLENBQVYsRUFBWUEsQ0FBQyxHQUFDckgsSUFBSSxDQUFDaWpCLFFBQUwsQ0FBY3poQixNQUE1QixFQUFvQzZGLENBQUMsRUFBckMsRUFBeUM7RUFDeEMsWUFBR29mLE9BQU8sS0FBS3ptQixJQUFJLENBQUNpakIsUUFBTCxDQUFjNWIsQ0FBZCxFQUFpQndTLElBQWhDLEVBQ0M7RUFDRCxZQUFHNEwsV0FBVyxDQUFDemxCLElBQUksQ0FBQ2lqQixRQUFMLENBQWM1YixDQUFkLEVBQWlCd1MsSUFBbEIsRUFBd0J4VixDQUFDLENBQUNvSCxJQUExQixDQUFkLEVBQ0M2YSxRQUFRLElBQUlwRyxTQUFTLEdBQUMsQ0FBdEI7RUFDRDs7RUFDRCxhQUFPb0csUUFBUDtFQUNBLEtBVkssRUFXTixVQUFTamlCLENBQVQsRUFBWTtFQUNYLFVBQUlxaUIsR0FBRyxHQUFHRCxPQUFPLENBQUNuUSxPQUFSLENBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLEVBQTBCQSxPQUExQixDQUFrQyxRQUFsQyxFQUE0QyxLQUE1QyxDQUFWO0VBQ0EsYUFBT21RLE9BQU8sR0FBQyxnQkFBUixJQUE0QnBpQixDQUFDLENBQUNvSCxJQUE5QixHQUFxQ2liLEdBQUcsR0FBRSxJQUFMLEdBQVdyaUIsQ0FBQyxDQUFDb0gsSUFBRixDQUFPZ2IsT0FBTyxHQUFDLGdCQUFmLENBQWhELEdBQW1GLEVBQTFGO0VBQ0EsS0FkSyxFQWNILGNBZEcsQ0FBUjtFQXJRNkI7O0VBbVE5QixPQUFJLElBQUlsbEIsQ0FBQyxHQUFDLENBQVYsRUFBWUEsQ0FBQyxHQUFDdkIsSUFBSSxDQUFDaWpCLFFBQUwsQ0FBY3poQixNQUE1QixFQUFvQ0QsQ0FBQyxFQUFyQyxFQUF5QztFQUFBLFdBQWpDQSxDQUFpQztFQWlCeEMsR0FwUjZCOzs7RUF1UjlCMGUsRUFBQUEsVUFBVSxDQUFDamdCLElBQUQsRUFBTzhMLElBQVAsQ0FBVixDQXZSOEI7O0VBMFI5QixNQUFJNmEsV0FBVyxHQUFHLEVBQWxCLENBMVI4Qjs7RUE2UjlCLE1BQUlDLFNBQVMsR0FBRyxTQUFaQSxTQUFZLENBQVNDLEtBQVQsRUFBZ0JwRSxFQUFoQixFQUFvQnFFLEdBQXBCLEVBQXlCQyxHQUF6QixFQUE4QnZlLFdBQTlCLEVBQTJDd2UsTUFBM0MsRUFBbUQ7RUFDbEUsUUFBSXRYLE1BQU0sR0FBRyxTQUFUQSxNQUFTLENBQVNuTyxDQUFULEVBQVkwbEIsQ0FBWixFQUFlO0VBQzNCLFVBQUcxbEIsQ0FBQyxHQUFDLENBQUYsR0FBTTBsQixDQUFUO0VBQ0MsZUFBT3ZYLE1BQU0sQ0FBQyxFQUFFbk8sQ0FBSCxDQUFiO0VBQ0QsYUFBT0EsQ0FBUDtFQUNBLEtBSkQ7O0VBS0EsUUFBSTJsQixJQUFJLEdBQUcsRUFBWDs7RUFDQSxTQUFJLElBQUk3ZixDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUN3ZixLQUFLLENBQUNybEIsTUFBckIsRUFBNkI2RixDQUFDLEVBQTlCLEVBQWtDO0VBQ2pDLFVBQUlvSCxDQUFDLEdBQUdpQixNQUFNLENBQUNySSxDQUFELEVBQUl3ZixLQUFLLENBQUNybEIsTUFBVixDQUFkO0VBQ0EsVUFBSTJsQixHQUFHLEdBQUdOLEtBQUssQ0FBQ3hmLENBQUQsQ0FBTCxHQUFXb2IsRUFBWCxHQUFnQnVFLE1BQTFCO0VBQ0EsVUFBSUksR0FBRyxHQUFHUCxLQUFLLENBQUNwWSxDQUFELENBQUwsR0FBV2dVLEVBQVgsR0FBZ0J1RSxNQUExQjtFQUNBLFVBQUd4ZSxXQUFXLENBQUN6RixDQUFaLEdBQWdCb2tCLEdBQWhCLElBQXVCM2UsV0FBVyxDQUFDekYsQ0FBWixHQUFnQnFrQixHQUExQyxFQUNDNWUsV0FBVyxDQUFDeEYsQ0FBWixHQUFnQitqQixHQUFoQjtFQUVERyxNQUFBQSxJQUFJLElBQUksTUFBTUMsR0FBTixHQUFZLEdBQVosSUFBb0JMLEdBQUcsR0FBR0UsTUFBMUIsSUFDTixHQURNLEdBQ0FHLEdBREEsR0FDTSxHQUROLElBQ2NKLEdBQUcsR0FBR0MsTUFEcEIsSUFFTixHQUZNLEdBRUFJLEdBRkEsR0FFTSxHQUZOLElBRWNMLEdBQUcsR0FBR0MsTUFGcEIsSUFHTixHQUhNLEdBR0FJLEdBSEEsR0FHTSxHQUhOLElBR2NOLEdBQUcsR0FBR0UsTUFIcEIsQ0FBUjtFQUlBM2YsTUFBQUEsQ0FBQyxHQUFHb0gsQ0FBSjtFQUNBOztFQUNELFdBQU95WSxJQUFQO0VBQ0EsR0FyQkQ7O0VBd0JBaGdCLEVBQUFBLFFBQVEsR0FBR2lWLEdBQUcsQ0FBQ2hFLFNBQUosQ0FBYyxVQUFkLEVBQ1QxTSxJQURTLENBQ0pxWixZQURJLEVBRVRFLEtBRlMsR0FHUnFDLE1BSFEsQ0FHRCxNQUhDLEVBR08sR0FIUCxFQUlScmUsSUFKUSxDQUlILE1BSkcsRUFJSyxNQUpMLEVBS1JBLElBTFEsQ0FLSCxRQUxHLEVBS08sTUFMUCxFQU1SQSxJQU5RLENBTUgsaUJBTkcsRUFNZ0IsTUFOaEIsRUFPUkEsSUFQUSxDQU9ILEdBUEcsRUFPRSxVQUFTM0UsQ0FBVCxFQUFZdUcsRUFBWixFQUFnQjtFQUMxQixRQUFJcUIsS0FBSyxHQUFHZ1ksYUFBQSxDQUE2QnRZLFlBQTdCLEVBQTJDdEgsQ0FBQyxDQUFDa0QsTUFBRixDQUFTa0UsSUFBVCxDQUFjekssSUFBekQsQ0FBWjtFQUNBLFFBQUlrTCxLQUFLLEdBQUcrWCxhQUFBLENBQTZCdFksWUFBN0IsRUFBMkN0SCxDQUFDLENBQUNtRCxNQUFGLENBQVNpRSxJQUFULENBQWN6SyxJQUF6RCxDQUFaO0VBQ0EsUUFBSWdMLGFBQVcsR0FBR2lZLFdBQUEsQ0FBMkJoWSxLQUEzQixFQUFrQ0MsS0FBbEMsRUFBeUNsTSxJQUF6QyxDQUFsQjtFQUNBLFFBQUlzbkIsUUFBUSxHQUFJampCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBU2tFLElBQVQsQ0FBYzZiLFFBQWQsSUFBMkJqakIsQ0FBQyxDQUFDa0QsTUFBRixDQUFTa0UsSUFBVCxDQUFjNmIsUUFBZCxLQUEyQmpqQixDQUFDLENBQUNtRCxNQUFGLENBQVNpRSxJQUFULENBQWN6SyxJQUFwRjtFQUVBLFFBQUk0ZSxFQUFFLEdBQUl2YixDQUFDLENBQUNrRCxNQUFGLENBQVN4RSxDQUFULEdBQWFzQixDQUFDLENBQUNtRCxNQUFGLENBQVN6RSxDQUF0QixHQUEwQnNCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBU3hFLENBQW5DLEdBQXVDc0IsQ0FBQyxDQUFDbUQsTUFBRixDQUFTekUsQ0FBMUQ7RUFDQSxRQUFJOGMsRUFBRSxHQUFJeGIsQ0FBQyxDQUFDa0QsTUFBRixDQUFTeEUsQ0FBVCxHQUFhc0IsQ0FBQyxDQUFDbUQsTUFBRixDQUFTekUsQ0FBdEIsR0FBMEJzQixDQUFDLENBQUNtRCxNQUFGLENBQVN6RSxDQUFuQyxHQUF1Q3NCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBU3hFLENBQTFEO0VBQ0EsUUFBSStqQixHQUFHLEdBQUd6aUIsQ0FBQyxDQUFDa0QsTUFBRixDQUFTdkUsQ0FBbkI7RUFDQSxRQUFJK2pCLEdBQUosRUFBU3RFLEVBQVQsRUFBYWphLFdBQWIsQ0FUMEI7O0VBWTFCLFFBQUlxZSxLQUFLLEdBQUdVLHNCQUFzQixDQUFDdm5CLElBQUQsRUFBT3FFLENBQVAsQ0FBbEM7RUFDQSxRQUFJNmlCLElBQUksR0FBRyxFQUFYOztFQUNBLFFBQUdMLEtBQUgsRUFBVTtFQUNULFVBQUd4aUIsQ0FBQyxDQUFDa0QsTUFBRixDQUFTNkQsS0FBVCxJQUFrQnViLFdBQXJCLEVBQ0NBLFdBQVcsQ0FBQ3RpQixDQUFDLENBQUNrRCxNQUFGLENBQVM2RCxLQUFWLENBQVgsSUFBK0IsQ0FBL0IsQ0FERCxLQUdDdWIsV0FBVyxDQUFDdGlCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBUzZELEtBQVYsQ0FBWCxHQUE4QixDQUE5QjtFQUVEMGIsTUFBQUEsR0FBRyxJQUFJSCxXQUFXLENBQUN0aUIsQ0FBQyxDQUFDa0QsTUFBRixDQUFTNkQsS0FBVixDQUFsQjtFQUNBcVgsTUFBQUEsRUFBRSxHQUFHa0UsV0FBVyxDQUFDdGlCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBUzZELEtBQVYsQ0FBWCxHQUE4QnBMLElBQUksQ0FBQ3lOLFdBQUwsR0FBaUIsQ0FBL0MsR0FBbUQsQ0FBeEQ7RUFFQSxVQUFJK1osWUFBWSxHQUFHbmpCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBU2tFLElBQVQsQ0FBY2pELFdBQWpDO0VBQ0EsVUFBSWlmLGdCQUFnQixHQUFHRCxZQUFZLENBQUMsQ0FBRCxDQUFuQzs7RUFDQSxXQUFJLElBQUlwZCxFQUFFLEdBQUMsQ0FBWCxFQUFjQSxFQUFFLEdBQUNvZCxZQUFZLENBQUNobUIsTUFBOUIsRUFBc0M0SSxFQUFFLEVBQXhDLEVBQTRDO0VBQzNDLFlBQUdvZCxZQUFZLENBQUNwZCxFQUFELENBQVosQ0FBaUI1QyxNQUFqQixDQUF3QnhHLElBQXhCLEtBQWlDcUQsQ0FBQyxDQUFDbUQsTUFBRixDQUFTaUUsSUFBVCxDQUFjekssSUFBL0MsSUFDQXdtQixZQUFZLENBQUNwZCxFQUFELENBQVosQ0FBaUI3QyxNQUFqQixDQUF3QnZHLElBQXhCLEtBQWlDcUQsQ0FBQyxDQUFDa0QsTUFBRixDQUFTa0UsSUFBVCxDQUFjekssSUFEbEQsRUFFQ3ltQixnQkFBZ0IsR0FBR0QsWUFBWSxDQUFDcGQsRUFBRCxDQUFaLENBQWlCcEosSUFBcEM7RUFDRDs7RUFDRHdILE1BQUFBLFdBQVcsR0FBR3liLGFBQUEsQ0FBNkJ0WSxZQUE3QixFQUEyQzhiLGdCQUEzQyxDQUFkO0VBQ0FqZixNQUFBQSxXQUFXLENBQUN4RixDQUFaLEdBQWdCOGpCLEdBQWhCLENBakJTOztFQWtCVEQsTUFBQUEsS0FBSyxDQUFDaGpCLElBQU4sQ0FBVyxVQUFVQyxDQUFWLEVBQVlDLENBQVosRUFBZTtFQUFDLGVBQU9ELENBQUMsR0FBR0MsQ0FBWDtFQUFjLE9BQXpDO0VBRUFnakIsTUFBQUEsR0FBRyxHQUFJRCxHQUFHLEdBQUM5bUIsSUFBSSxDQUFDeU4sV0FBTCxHQUFpQixDQUFyQixHQUF1QixDQUE5QjtFQUNBeVosTUFBQUEsSUFBSSxHQUFHTixTQUFTLENBQUNDLEtBQUQsRUFBUXBFLEVBQVIsRUFBWXFFLEdBQVosRUFBaUJDLEdBQWpCLEVBQXNCdmUsV0FBdEIsRUFBbUMsQ0FBbkMsQ0FBaEI7RUFDQTs7RUFFRCxRQUFJa2YsWUFBWSxHQUFHLEVBQW5CO0VBQ0EsUUFBR0osUUFBUSxJQUFJLENBQUNULEtBQWhCLEVBQ0NhLFlBQVksR0FBRyxPQUFPOUgsRUFBRSxHQUFFLENBQUNDLEVBQUUsR0FBQ0QsRUFBSixJQUFRLEdBQVosR0FBaUIsQ0FBeEIsSUFBNkIsR0FBN0IsSUFBb0NrSCxHQUFHLEdBQUMsQ0FBeEMsSUFDVCxHQURTLElBQ0ZsSCxFQUFFLEdBQUUsQ0FBQ0MsRUFBRSxHQUFDRCxFQUFKLElBQVEsR0FBWixHQUFpQixDQURmLElBQ29CLEdBRHBCLElBQzJCa0gsR0FBRyxHQUFDLENBRC9CLElBRVQsR0FGUyxJQUVGbEgsRUFBRSxHQUFFLENBQUNDLEVBQUUsR0FBQ0QsRUFBSixJQUFRLEdBQVosR0FBaUIsRUFGZixJQUVxQixHQUZyQixJQUU0QmtILEdBQUcsR0FBQyxDQUZoQyxJQUdULEdBSFMsSUFHRmxILEVBQUUsR0FBRSxDQUFDQyxFQUFFLEdBQUNELEVBQUosSUFBUSxHQUFaLEdBQWlCLENBSGYsSUFHcUIsR0FIckIsSUFHNEJrSCxHQUFHLEdBQUMsQ0FIaEMsQ0FBZjs7RUFJRCxRQUFHOWEsYUFBSCxFQUFnQjtFQUFHO0VBQ2xCOGEsTUFBQUEsR0FBRyxHQUFJemlCLENBQUMsQ0FBQ2tELE1BQUYsQ0FBU3hFLENBQVQsR0FBYXNCLENBQUMsQ0FBQ21ELE1BQUYsQ0FBU3pFLENBQXRCLEdBQTBCc0IsQ0FBQyxDQUFDa0QsTUFBRixDQUFTdkUsQ0FBbkMsR0FBdUNxQixDQUFDLENBQUNtRCxNQUFGLENBQVN4RSxDQUF2RDtFQUNBK2pCLE1BQUFBLEdBQUcsR0FBSTFpQixDQUFDLENBQUNrRCxNQUFGLENBQVN4RSxDQUFULEdBQWFzQixDQUFDLENBQUNtRCxNQUFGLENBQVN6RSxDQUF0QixHQUEwQnNCLENBQUMsQ0FBQ21ELE1BQUYsQ0FBU3hFLENBQW5DLEdBQXVDcUIsQ0FBQyxDQUFDa0QsTUFBRixDQUFTdkUsQ0FBdkQ7RUFFQSxVQUFJZ2tCLE1BQU0sR0FBRyxDQUFiOztFQUNBLFVBQUdqaEIsSUFBSSxDQUFDQyxHQUFMLENBQVM4Z0IsR0FBRyxHQUFDQyxHQUFiLElBQW9CLEdBQXZCLEVBQTRCO0VBQUk7RUFDL0IsZUFBTyxNQUFNbkgsRUFBTixHQUFXLEdBQVgsR0FBaUJrSCxHQUFqQixHQUF1QixHQUF2QixHQUE2QmpILEVBQTdCLEdBQWtDLEdBQWxDLEdBQXdDa0gsR0FBeEMsR0FDTCxHQURLLEdBQ0NuSCxFQURELEdBQ00sR0FETixJQUNha0gsR0FBRyxHQUFHRSxNQURuQixJQUM2QixHQUQ3QixHQUNtQ25ILEVBRG5DLEdBQ3dDLEdBRHhDLElBQytDa0gsR0FBRyxHQUFHQyxNQURyRCxDQUFQO0VBRUEsT0FIRCxNQUdPO0VBQVU7RUFDaEIsWUFBSVcsS0FBSyxHQUFJZCxLQUFLLEdBQUdELFNBQVMsQ0FBQ0MsS0FBRCxFQUFRcEUsRUFBUixFQUFZcUUsR0FBWixFQUFpQkMsR0FBakIsRUFBc0J2ZSxXQUF0QixFQUFtQ3dlLE1BQW5DLENBQVosR0FBeUQsRUFBM0U7RUFDQSxlQUFPLE1BQU1wSCxFQUFOLEdBQVcsR0FBWCxHQUFpQmtILEdBQWpCLEdBQXVCSSxJQUF2QixHQUE4QixHQUE5QixHQUFvQ3JILEVBQXBDLEdBQXlDLEdBQXpDLEdBQStDaUgsR0FBL0MsR0FDTCxHQURLLEdBQ0NsSCxFQURELEdBQ00sR0FETixJQUNha0gsR0FBRyxHQUFHRSxNQURuQixJQUM2QlcsS0FEN0IsR0FDcUMsR0FEckMsR0FDMkM5SCxFQUQzQyxHQUNnRCxHQURoRCxJQUN1RGlILEdBQUcsR0FBR0UsTUFEN0QsSUFDdUVVLFlBRDlFO0VBRUE7RUFDRDs7RUFDRCxXQUFPLE1BQU05SCxFQUFOLEdBQVcsR0FBWCxHQUFpQmtILEdBQWpCLEdBQXVCSSxJQUF2QixHQUE4QixHQUE5QixHQUFvQ3JILEVBQXBDLEdBQXlDLEdBQXpDLEdBQStDaUgsR0FBL0MsR0FBcURZLFlBQTVEO0VBQ0EsR0FsRVEsQ0FBWCxDQXJUOEI7O0VBMFg5QnZMLEVBQUFBLEdBQUcsQ0FBQ2hFLFNBQUosQ0FBYyxPQUFkLEVBQ0UxTSxJQURGLENBQ083RSxJQUFJLENBQUNnRixLQUFMLENBQVc1RSxLQUFLLENBQUM4RixXQUFOLEVBQVgsQ0FEUCxFQUVFa1ksS0FGRixHQUdHNU0sTUFISCxDQUdVLFVBQVUvVCxDQUFWLEVBQWE7RUFDcEI7RUFDQSxXQUFRckUsSUFBSSxDQUFDbU4sS0FBTCxJQUNMOUksQ0FBQyxDQUFDNEYsTUFBRixDQUFTd0IsSUFBVCxDQUFjakIsU0FBZCxLQUE0QnRLLFNBQTVCLElBQXlDbUUsQ0FBQyxDQUFDdWpCLE1BQUYsQ0FBUzdmLE1BQVQsS0FBb0IsSUFBN0QsSUFBcUUsQ0FBQzFELENBQUMsQ0FBQzRGLE1BQUYsQ0FBU3dCLElBQVQsQ0FBY3pELE1BRHZGO0VBRUEsR0FQSCxFQVFHcWYsTUFSSCxDQVFVLE1BUlYsRUFRa0IsR0FSbEIsRUFTR3JlLElBVEgsQ0FTUSxNQVRSLEVBU2dCLE1BVGhCLEVBVUdBLElBVkgsQ0FVUSxjQVZSLEVBVXdCLFVBQVMzRSxDQUFULEVBQVl1RyxFQUFaLEVBQWdCO0VBQ3JDLFFBQUd2RyxDQUFDLENBQUM0RixNQUFGLENBQVN3QixJQUFULENBQWNqQixTQUFkLEtBQTRCdEssU0FBNUIsSUFBeUNtRSxDQUFDLENBQUN1akIsTUFBRixDQUFTN2YsTUFBVCxLQUFvQixJQUE3RCxJQUFxRTFELENBQUMsQ0FBQzRGLE1BQUYsQ0FBU3dCLElBQVQsQ0FBY3pELE1BQXRGLEVBQ0MsT0FBTyxDQUFQO0VBQ0QsV0FBUWhJLElBQUksQ0FBQ21OLEtBQUwsR0FBYSxDQUFiLEdBQWlCLENBQXpCO0VBQ0EsR0FkSCxFQWVHbkUsSUFmSCxDQWVRLFFBZlIsRUFla0IsVUFBUzNFLENBQVQsRUFBWXVHLEVBQVosRUFBZ0I7RUFDL0IsUUFBR3ZHLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU3dCLElBQVQsQ0FBY2pCLFNBQWQsS0FBNEJ0SyxTQUE1QixJQUF5Q21FLENBQUMsQ0FBQ3VqQixNQUFGLENBQVM3ZixNQUFULEtBQW9CLElBQTdELElBQXFFMUQsQ0FBQyxDQUFDNEYsTUFBRixDQUFTd0IsSUFBVCxDQUFjekQsTUFBdEYsRUFDQyxPQUFPLE1BQVA7RUFDRCxXQUFPLE1BQVA7RUFDQSxHQW5CSCxFQW9CR2dCLElBcEJILENBb0JRLGtCQXBCUixFQW9CNEIsVUFBUzNFLENBQVQsRUFBWXVHLEVBQVosRUFBZ0I7RUFDekMsUUFBRyxDQUFDdkcsQ0FBQyxDQUFDNEYsTUFBRixDQUFTd0IsSUFBVCxDQUFjcWEsVUFBbEIsRUFBOEIsT0FBTyxJQUFQO0VBQzlCLFFBQUkrQixRQUFRLEdBQUc5aEIsSUFBSSxDQUFDQyxHQUFMLENBQVMzQixDQUFDLENBQUN1akIsTUFBRixDQUFTNWtCLENBQVQsR0FBWSxDQUFDcUIsQ0FBQyxDQUFDdWpCLE1BQUYsQ0FBUzVrQixDQUFULEdBQWFxQixDQUFDLENBQUM0RixNQUFGLENBQVNqSCxDQUF2QixJQUE0QixDQUFqRCxDQUFmO0VBQ0EsUUFBSThrQixVQUFVLEdBQUcsQ0FBQ0QsUUFBRCxFQUFXLENBQVgsRUFBYzloQixJQUFJLENBQUNDLEdBQUwsQ0FBUzNCLENBQUMsQ0FBQ3VqQixNQUFGLENBQVM3a0IsQ0FBVCxHQUFXc0IsQ0FBQyxDQUFDNEYsTUFBRixDQUFTbEgsQ0FBN0IsQ0FBZCxFQUErQyxDQUEvQyxDQUFqQjtFQUNBLFFBQUk0RixLQUFLLEdBQUdzYixRQUFBLENBQXdCamtCLElBQUksQ0FBQ2dDLE9BQTdCLEVBQXNDcUMsQ0FBQyxDQUFDNEYsTUFBRixDQUFTd0IsSUFBL0MsQ0FBWjtFQUNBLFFBQUc5QyxLQUFLLENBQUNuSCxNQUFOLElBQWdCLENBQW5CLEVBQXNCcW1CLFFBQVEsR0FBR0EsUUFBUSxHQUFHLENBQXRCOztFQUN0QixTQUFJLElBQUlFLE9BQU8sR0FBRyxDQUFsQixFQUFxQkEsT0FBTyxHQUFHRixRQUEvQixFQUF5Q0UsT0FBTyxJQUFJLEVBQXBEO0VBQ0M3aUIsTUFBQUEsQ0FBQyxDQUFDMkMsS0FBRixDQUFRaWdCLFVBQVIsRUFBb0IsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFwQjtFQUREOztFQUVBLFdBQU9BLFVBQVA7RUFDQSxHQTdCSCxFQThCRzllLElBOUJILENBOEJRLGlCQTlCUixFQThCMkIsVUFBUzNFLENBQVQsRUFBWXVHLEVBQVosRUFBZ0I7RUFDeEMsUUFBR3ZHLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU3dCLElBQVQsQ0FBY2hELE1BQWQsSUFBd0JwRSxDQUFDLENBQUM0RixNQUFGLENBQVN3QixJQUFULENBQWMzQyxNQUF6QyxFQUNDLE9BQU8sb0JBQVA7RUFDRCxXQUFPLE1BQVA7RUFDQSxHQWxDSCxFQW1DR0UsSUFuQ0gsQ0FtQ1EsR0FuQ1IsRUFtQ2EsVUFBUzNFLENBQVQsRUFBWXVHLEVBQVosRUFBZ0I7RUFDMUIsUUFBR3ZHLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU3dCLElBQVQsQ0FBY2hELE1BQWQsSUFBd0JwRSxDQUFDLENBQUM0RixNQUFGLENBQVN3QixJQUFULENBQWMzQyxNQUF6QyxFQUFpRDtFQUNoRDtFQUNBLFVBQUlILEtBQUssR0FBR3NiLFFBQUEsQ0FBd0Jqa0IsSUFBSSxDQUFDZ0MsT0FBN0IsRUFBc0NxQyxDQUFDLENBQUM0RixNQUFGLENBQVN3QixJQUEvQyxDQUFaOztFQUNBLFVBQUc5QyxLQUFLLENBQUNuSCxNQUFOLElBQWdCLENBQW5CLEVBQXNCO0VBQ3JCLFlBQUl3bUIsS0FBSyxHQUFHLENBQVo7RUFDQSxZQUFJQyxJQUFJLEdBQUc1akIsQ0FBQyxDQUFDNEYsTUFBRixDQUFTbEgsQ0FBcEI7RUFDQSxRQUFXc0IsQ0FBQyxDQUFDNEYsTUFBRixDQUFTbEg7O0VBQ3BCLGFBQUksSUFBSW1sQixDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUN2ZixLQUFLLENBQUNuSCxNQUFyQixFQUE2QjBtQixDQUFDLEVBQTlCLEVBQWtDO0VBQ2pDLGNBQUlDLEtBQUssR0FBR2xFLGFBQUEsQ0FBNkJ0WSxZQUE3QixFQUEyQ2hELEtBQUssQ0FBQ3VmLENBQUQsQ0FBTCxDQUFTbG5CLElBQXBELEVBQTBEK0IsQ0FBdEU7RUFDQSxjQUFHa2xCLElBQUksR0FBR0UsS0FBVixFQUFpQkYsSUFBSSxHQUFHRSxLQUFQO0VBRWpCSCxVQUFBQSxLQUFLLElBQUlHLEtBQVQ7RUFDQTs7RUFFRCxZQUFJdmIsSUFBSSxHQUFJLENBQUN2SSxDQUFDLENBQUM0RixNQUFGLENBQVNsSCxDQUFULEdBQWFpbEIsS0FBZCxLQUF3QnJmLEtBQUssQ0FBQ25ILE1BQU4sR0FBYSxDQUFyQyxDQUFaO0VBQ0EsWUFBSTRtQixJQUFJLEdBQUksQ0FBQy9qQixDQUFDLENBQUN1akIsTUFBRixDQUFTNWtCLENBQVQsR0FBYXFCLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU2pILENBQXZCLElBQTRCLENBQXhDO0VBRUEsWUFBSXFsQixLQUFLLEdBQUcsRUFBWjs7RUFDQSxZQUFHSixJQUFJLEtBQUs1akIsQ0FBQyxDQUFDNEYsTUFBRixDQUFTbEgsQ0FBbEIsSUFBdUJzQixDQUFDLENBQUM0RixNQUFGLENBQVN3QixJQUFULENBQWNoRCxNQUF4QyxFQUFnRDtFQUMvQztFQUNBLGNBQUk2ZixFQUFFLEdBQUcsQ0FBQzFiLElBQUksR0FBR3ZJLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU2xILENBQWpCLElBQW9CLENBQTdCO0VBQ0EsY0FBSXdsQixFQUFFLEdBQUcsQ0FBQ0gsSUFBSSxJQUFJL2pCLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU2pILENBQVQsR0FBV2hELElBQUksQ0FBQ3lOLFdBQUwsR0FBaUIsQ0FBaEMsQ0FBTCxJQUF5QyxDQUFsRDtFQUNBNGEsVUFBQUEsS0FBSyxHQUFHLE1BQU1DLEVBQU4sR0FBVyxHQUFYLEdBQWlCQyxFQUFqQixHQUNOLEdBRE0sSUFDQzNiLElBQUksSUFBSUEsSUFBSSxHQUFDMGIsRUFBVCxDQURMLElBQ3FCLEdBRHJCLEdBQzJCQyxFQURuQztFQUVBOztFQUVELGVBQU8sTUFBT2xrQixDQUFDLENBQUN1akIsTUFBRixDQUFTN2tCLENBQWhCLEdBQXFCLEdBQXJCLEdBQTRCc0IsQ0FBQyxDQUFDdWpCLE1BQUYsQ0FBUzVrQixDQUFyQyxHQUNILEdBREcsR0FDR29sQixJQURILEdBRUgsR0FGRyxHQUVHeGIsSUFGSCxHQUdILEdBSEcsR0FHSXZJLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU2xILENBSGIsR0FHa0IsR0FIbEIsSUFHeUJzQixDQUFDLENBQUM0RixNQUFGLENBQVNqSCxDQUFULEdBQVdoRCxJQUFJLENBQUN5TixXQUFMLEdBQWlCLENBSHJELElBSUg0YSxLQUpKO0VBS0E7RUFDRDs7RUFFRCxRQUFHaGtCLENBQUMsQ0FBQ3VqQixNQUFGLENBQVNuYyxJQUFULENBQWNsRSxNQUFqQixFQUF5QjtFQUFJO0VBQzVCLFVBQUlxVyxFQUFFLEdBQUdxRyxhQUFBLENBQTZCdFksWUFBN0IsRUFBMkN0SCxDQUFDLENBQUN1akIsTUFBRixDQUFTbmMsSUFBVCxDQUFjbEUsTUFBZCxDQUFxQnZHLElBQWhFLENBQVQ7RUFDQSxVQUFJNmMsRUFBRSxHQUFHb0csYUFBQSxDQUE2QnRZLFlBQTdCLEVBQTJDdEgsQ0FBQyxDQUFDdWpCLE1BQUYsQ0FBU25jLElBQVQsQ0FBY2pFLE1BQWQsQ0FBcUJ4RyxJQUFoRSxDQUFUOztFQUVBLFVBQUc0YyxFQUFFLENBQUN4UyxLQUFILEtBQWF5UyxFQUFFLENBQUN6UyxLQUFuQixFQUEwQjtFQUN6QixlQUFPLE1BQU8vRyxDQUFDLENBQUN1akIsTUFBRixDQUFTN2tCLENBQWhCLEdBQXFCLEdBQXJCLEdBQTRCLENBQUM2YSxFQUFFLENBQUM1YSxDQUFILEdBQU82YSxFQUFFLENBQUM3YSxDQUFYLElBQWdCLENBQTVDLEdBQ0gsR0FERyxHQUNJcUIsQ0FBQyxDQUFDNEYsTUFBRixDQUFTbEgsQ0FEYixHQUVILEdBRkcsR0FFSXNCLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU2pILENBRnBCO0VBR0E7RUFDRDs7RUFFRCxXQUFPLE1BQU9xQixDQUFDLENBQUN1akIsTUFBRixDQUFTN2tCLENBQWhCLEdBQXFCLEdBQXJCLEdBQTRCc0IsQ0FBQyxDQUFDdWpCLE1BQUYsQ0FBUzVrQixDQUFyQyxHQUNILEdBREcsR0FDSSxDQUFDcUIsQ0FBQyxDQUFDdWpCLE1BQUYsQ0FBUzVrQixDQUFULEdBQWFxQixDQUFDLENBQUM0RixNQUFGLENBQVNqSCxDQUF2QixJQUE0QixDQURoQyxHQUVILEdBRkcsR0FFSXFCLENBQUMsQ0FBQzRGLE1BQUYsQ0FBU2xILENBRmIsR0FHSCxHQUhHLEdBR0lzQixDQUFDLENBQUM0RixNQUFGLENBQVNqSCxDQUhwQjtFQUlBLEdBckZILEVBMVg4Qjs7RUFrZDlCLE1BQUl3bEIsVUFBVSxHQUFJdkUsZUFBQSxDQUErQmprQixJQUFJLENBQUNnQyxPQUFwQyxDQUFsQjs7RUFDQSxNQUFHLE9BQU93bUIsVUFBUCxLQUFzQixXQUF6QixFQUFzQztFQUNyQyxRQUFJQyxXQUFXLEdBQUd4RSxhQUFBLENBQTZCdFksWUFBN0IsRUFBMkMzTCxJQUFJLENBQUNnQyxPQUFMLENBQWF3bUIsVUFBYixFQUF5QnhuQixJQUFwRSxDQUFsQjtFQUNBLFFBQUkwbkIsS0FBSyxHQUFHLGFBQVd6RSxNQUFBLENBQXNCLENBQXRCLENBQXZCO0VBQ0E5SCxJQUFBQSxHQUFHLENBQUM1TSxNQUFKLENBQVcsVUFBWCxFQUF1QkEsTUFBdkIsQ0FBOEIsWUFBOUI7RUFBQSxLQUNFdkcsSUFERixDQUNPLElBRFAsRUFDYTBmLEtBRGIsRUFFRTFmLElBRkYsQ0FFTyxNQUZQLEVBRWUsQ0FGZixFQUdFQSxJQUhGLENBR08sTUFIUCxFQUdlLENBSGYsRUFJRUEsSUFKRixDQUlPLGFBSlAsRUFJc0IsRUFKdEIsRUFLRUEsSUFMRixDQUtPLGNBTFAsRUFLdUIsRUFMdkIsRUFNRUEsSUFORixDQU1PLFFBTlAsRUFNaUIsTUFOakIsRUFPRXVHLE1BUEYsQ0FPUyxNQVBULEVBUUV2RyxJQVJGLENBUU8sR0FSUCxFQVFZLHFCQVJaLEVBU0VvWCxLQVRGLENBU1EsTUFUUixFQVNnQixPQVRoQjtFQVdBakUsSUFBQUEsR0FBRyxDQUFDNU0sTUFBSixDQUFXLE1BQVgsRUFDRXZHLElBREYsQ0FDTyxJQURQLEVBQ2F5ZixXQUFXLENBQUMxbEIsQ0FBWixHQUFjL0MsSUFBSSxDQUFDeU4sV0FEaEMsRUFFRXpFLElBRkYsQ0FFTyxJQUZQLEVBRWF5ZixXQUFXLENBQUN6bEIsQ0FBWixHQUFjaEQsSUFBSSxDQUFDeU4sV0FGaEMsRUFHRXpFLElBSEYsQ0FHTyxJQUhQLEVBR2F5ZixXQUFXLENBQUMxbEIsQ0FBWixHQUFjL0MsSUFBSSxDQUFDeU4sV0FBTCxHQUFpQixDQUg1QyxFQUlFekUsSUFKRixDQUlPLElBSlAsRUFJYXlmLFdBQVcsQ0FBQ3psQixDQUFaLEdBQWNoRCxJQUFJLENBQUN5TixXQUFMLEdBQWlCLENBSjVDLEVBS0V6RSxJQUxGLENBS08sY0FMUCxFQUt1QixDQUx2QixFQU1FQSxJQU5GLENBTU8sUUFOUCxFQU1pQixPQU5qQixFQU9FQSxJQVBGLENBT08sWUFQUCxFQU9xQixVQUFRMGYsS0FBUixHQUFjLEdBUG5DO0VBUUEsR0F6ZTZCOzs7RUEyZTlCemxCLEVBQUFBLElBQUksR0FBR29TLEVBQUUsQ0FBQ3BTLElBQUgsR0FDSjBsQixXQURJLENBQ1EsQ0FBQzNvQixJQUFJLENBQUNzakIsTUFBTixFQUFjdGpCLElBQUksQ0FBQ3VqQixPQUFuQixDQURSLEVBRUpwVCxFQUZJLENBRUQsTUFGQyxFQUVPeVksTUFGUCxDQUFQOztFQUlBLFdBQVNBLE1BQVQsR0FBa0I7RUFDakIsUUFBSVYsQ0FBQyxHQUFHN1MsRUFBRSxDQUFDd0csS0FBSCxDQUFTZ04sU0FBakI7RUFDQSxRQUFHNUUsSUFBQSxNQUF5QmlFLENBQUMsQ0FBQ25sQixDQUFGLENBQUkrbEIsUUFBSixHQUFldG5CLE1BQWYsR0FBd0IsRUFBcEQ7RUFDQztFQUNELFFBQUkyQixHQUFHLEdBQUcsQ0FBRStrQixDQUFDLENBQUNubEIsQ0FBRixHQUFNRixRQUFRLENBQUN3aEIsVUFBRCxDQUFoQixFQUFnQzZELENBQUMsQ0FBQ2xsQixDQUFGLEdBQU1ILFFBQVEsQ0FBQ2tXLFVBQUQsQ0FBOUMsQ0FBVjs7RUFDQSxRQUFHbVAsQ0FBQyxDQUFDelosQ0FBRixJQUFPLENBQVYsRUFBYTtFQUNaRixNQUFBQSxXQUFBLENBQXFCdk8sSUFBckIsRUFBMkJtRCxHQUFHLENBQUMsQ0FBRCxDQUE5QixFQUFtQ0EsR0FBRyxDQUFDLENBQUQsQ0FBdEM7RUFDQSxLQUZELE1BRU87RUFDTm9MLE1BQUFBLFdBQUEsQ0FBcUJ2TyxJQUFyQixFQUEyQm1ELEdBQUcsQ0FBQyxDQUFELENBQTlCLEVBQW1DQSxHQUFHLENBQUMsQ0FBRCxDQUF0QyxFQUEyQytrQixDQUFDLENBQUN6WixDQUE3QztFQUNBOztFQUNEME4sSUFBQUEsR0FBRyxDQUFDblQsSUFBSixDQUFTLFdBQVQsRUFBc0IsZUFBZTdGLEdBQUcsQ0FBQyxDQUFELENBQWxCLEdBQXdCLEdBQXhCLEdBQThCQSxHQUFHLENBQUMsQ0FBRCxDQUFqQyxHQUF1QyxVQUF2QyxHQUFvRCtrQixDQUFDLENBQUN6WixDQUF0RCxHQUEwRCxHQUFoRjtFQUNBOztFQUNEb0csRUFBQUEsR0FBRyxDQUFDbEMsSUFBSixDQUFTMVAsSUFBVDtFQUNBLFNBQU9qRCxJQUFQO0VBQ0E7O0VBRUQsU0FBUzZrQixVQUFULENBQW9CelIsR0FBcEIsRUFBeUI7RUFDeEJqUixFQUFBQSxPQUFPLENBQUN1VixLQUFSLENBQWN0RSxHQUFkO0VBQ0EsU0FBTyxJQUFJMlYsS0FBSixDQUFVM1YsR0FBVixDQUFQO0VBQ0E7OztFQUdNLFNBQVMrSCxpQkFBVCxDQUEyQm5iLElBQTNCLEVBQWdDO0VBQ3RDLE1BQUdBLElBQUksQ0FBQzZqQixRQUFSLEVBQWtCO0VBQ2pCLFFBQUksT0FBTzdqQixJQUFJLENBQUM2akIsUUFBWixJQUF3QixVQUE1QixFQUF3QztFQUN2QyxVQUFHN2pCLElBQUksQ0FBQ21OLEtBQVIsRUFDQ2hMLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWSx3Q0FBWjtFQUNELGFBQU9wTixJQUFJLENBQUM2akIsUUFBTCxDQUFjbFIsSUFBZCxDQUFtQixJQUFuQixFQUF5QjNTLElBQXpCLENBQVA7RUFDQSxLQUxnQjs7O0VBUWpCLFFBQUlncEIsV0FBVyxHQUFHLEVBQWxCO0VBQ0EsUUFBSUMsTUFBTSxHQUFHLEVBQWI7RUFDQSxRQUFJek8sWUFBSjs7RUFDQSxTQUFJLElBQUlsVCxDQUFDLEdBQUMsQ0FBVixFQUFhQSxDQUFDLEdBQUN0SCxJQUFJLENBQUNnQyxPQUFMLENBQWFSLE1BQTVCLEVBQW9DOEYsQ0FBQyxFQUFyQyxFQUF5QztFQUN4QyxVQUFHLENBQUNBLENBQUMsQ0FBQ1UsTUFBTixFQUFjO0VBQ2IsWUFBR2hJLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYXNGLENBQWIsRUFBZ0JDLE1BQWhCLElBQTBCdkgsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0YsQ0FBYixFQUFnQkUsTUFBN0MsRUFBcUQ7RUFDcERnVCxVQUFBQSxZQUFZLEdBQUd4YSxJQUFJLENBQUNnQyxPQUFMLENBQWFzRixDQUFiLEVBQWdCa1QsWUFBL0I7RUFDQSxjQUFHLENBQUNBLFlBQUosRUFDQ0EsWUFBWSxHQUFHLFNBQWY7RUFDREEsVUFBQUEsWUFBWSxJQUFJLGdCQUFjeGEsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0YsQ0FBYixFQUFnQnRHLElBQTlCLEdBQW1DLEdBQW5EO0VBQ0EsY0FBSXVHLE1BQU0sR0FBR3ZILElBQUksQ0FBQ2dDLE9BQUwsQ0FBYXNGLENBQWIsRUFBZ0JDLE1BQTdCO0VBQ0EsY0FBSUMsTUFBTSxHQUFHeEgsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0YsQ0FBYixFQUFnQkUsTUFBN0I7O0VBQ0EsY0FBRyxDQUFDRCxNQUFELElBQVcsQ0FBQ0MsTUFBZixFQUF1QjtFQUN0QixrQkFBTXFkLFVBQVUsQ0FBQyx3QkFBc0JySyxZQUF2QixDQUFoQjtFQUNBOztFQUVELGNBQUl2UyxJQUFJLEdBQUdnYyxZQUFBLENBQTRCamtCLElBQUksQ0FBQ2dDLE9BQWpDLEVBQTBDdUYsTUFBMUMsQ0FBWDtFQUNBLGNBQUlZLElBQUksR0FBRzhiLFlBQUEsQ0FBNEJqa0IsSUFBSSxDQUFDZ0MsT0FBakMsRUFBMEN3RixNQUExQyxDQUFYO0VBQ0EsY0FBR1MsSUFBSSxLQUFLLENBQUMsQ0FBYixFQUNDLE1BQU00YyxVQUFVLENBQUMsMEJBQXdCdGQsTUFBeEIsR0FBK0IscUJBQS9CLEdBQ1ppVCxZQURZLEdBQ0MsZ0NBREYsQ0FBaEI7RUFFRCxjQUFHclMsSUFBSSxLQUFLLENBQUMsQ0FBYixFQUNDLE1BQU0wYyxVQUFVLENBQUMsMEJBQXdCcmQsTUFBeEIsR0FBK0IscUJBQS9CLEdBQ1pnVCxZQURZLEdBQ0MsZ0NBREYsQ0FBaEI7RUFFRCxjQUFHeGEsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhaUcsSUFBYixFQUFtQjRDLEdBQW5CLEtBQTJCLEdBQTlCLEVBQ0MsTUFBTWdhLFVBQVUsQ0FBQyxpQ0FBK0JySyxZQUEvQixHQUNmLDBGQURjLENBQWhCO0VBRUQsY0FBR3hhLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYW1HLElBQWIsRUFBbUIwQyxHQUFuQixLQUEyQixHQUE5QixFQUNDLE1BQU1nYSxVQUFVLENBQUMsaUNBQStCckssWUFBL0IsR0FDZix3RkFEYyxDQUFoQjtFQUVEO0VBQ0Q7O0VBR0QsVUFBRyxDQUFDeGEsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0YsQ0FBYixFQUFnQnRHLElBQXBCLEVBQ0MsTUFBTTZqQixVQUFVLENBQUNySyxZQUFZLEdBQUMsa0JBQWQsQ0FBaEI7RUFDRCxVQUFHdFYsQ0FBQyxDQUFDcUUsT0FBRixDQUFVdkosSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0YsQ0FBYixFQUFnQnRHLElBQTFCLEVBQWdDZ29CLFdBQWhDLElBQStDLENBQUMsQ0FBbkQsRUFDQyxNQUFNbkUsVUFBVSxDQUFDLCtCQUE2QnJLLFlBQTdCLEdBQTBDLGlCQUEzQyxDQUFoQjtFQUNEd08sTUFBQUEsV0FBVyxDQUFDcm5CLElBQVosQ0FBaUIzQixJQUFJLENBQUNnQyxPQUFMLENBQWFzRixDQUFiLEVBQWdCdEcsSUFBakM7O0VBRUEsVUFBR2tFLENBQUMsQ0FBQ3FFLE9BQUYsQ0FBVXZKLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYXNGLENBQWIsRUFBZ0I4VSxLQUExQixFQUFpQzZNLE1BQWpDLE1BQTZDLENBQUMsQ0FBOUMsSUFBbURqcEIsSUFBSSxDQUFDZ0MsT0FBTCxDQUFhc0YsQ0FBYixFQUFnQjhVLEtBQXRFLEVBQTZFO0VBQzVFNk0sUUFBQUEsTUFBTSxDQUFDdG5CLElBQVAsQ0FBWTNCLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYXNGLENBQWIsRUFBZ0I4VSxLQUE1QjtFQUNBO0VBQ0Q7O0VBRUQsUUFBRzZNLE1BQU0sQ0FBQ3puQixNQUFQLEdBQWdCLENBQW5CLEVBQXNCO0VBQ3JCLFlBQU1xakIsVUFBVSxDQUFDLGlDQUErQm9FLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLElBQVosQ0FBL0IsR0FBaUQsR0FBbEQsQ0FBaEI7RUFDQSxLQXZEZ0I7OztFQXlEakIsUUFBSUMsRUFBRSxHQUFHbEYsV0FBQSxDQUEyQmprQixJQUFJLENBQUNnQyxPQUFoQyxDQUFUO0VBQ0EsUUFBR21uQixFQUFFLENBQUMzbkIsTUFBSCxHQUFZLENBQWYsRUFDQ1csT0FBTyxDQUFDQyxJQUFSLENBQWEsc0NBQWIsRUFBcUQrbUIsRUFBckQ7RUFDRDtFQUNEOztFQUdELFNBQVNsRCxXQUFULENBQXFCeEQsRUFBckIsRUFBeUJDLEVBQXpCLEVBQTZCc0QsTUFBN0IsRUFBcUNobUIsSUFBckMsRUFBMkM7RUFDMUMsU0FBUSxPQUFPeWlCLEVBQUUsR0FBQ3VELE1BQVYsSUFBb0IsR0FBcEIsR0FBMEJ0RCxFQUExQixHQUNOLEdBRE0sR0FDQUQsRUFEQSxHQUNLLEdBREwsR0FDV0MsRUFEWCxHQUVOLEdBRk0sR0FFQUQsRUFGQSxHQUVLLEdBRkwsSUFFWUMsRUFBRSxHQUFFMWlCLElBQUksQ0FBQ3lOLFdBQUwsR0FBb0IsSUFGcEMsSUFHTixHQUhNLEdBR0FnVixFQUhBLEdBR0ssR0FITCxJQUdZQyxFQUFFLEdBQUUxaUIsSUFBSSxDQUFDeU4sV0FBTCxHQUFvQixJQUhwQyxJQUlOLEdBSk0sSUFJQ2dWLEVBQUUsR0FBQ3VELE1BSkosSUFJYyxHQUpkLElBSXFCdEQsRUFBRSxHQUFFMWlCLElBQUksQ0FBQ3lOLFdBQUwsR0FBb0IsSUFKN0MsQ0FBUjtFQUtBOzs7RUFHRCxTQUFTZ1ksV0FBVCxDQUFxQnJrQixNQUFyQixFQUE2QjhDLEdBQTdCLEVBQWtDO0VBQ2pDLE1BQUl3SyxLQUFLLEdBQUcsS0FBWjtFQUNBLE1BQUd4SyxHQUFILEVBQ0NnQixDQUFDLENBQUNpQyxJQUFGLENBQU9qRCxHQUFQLEVBQVksVUFBU3VLLENBQVQsRUFBWTJhLEVBQVosRUFBZTtFQUMxQixRQUFHM2EsQ0FBQyxDQUFDL00sT0FBRixDQUFVTixNQUFNLEdBQUMsR0FBakIsTUFBMEIsQ0FBMUIsSUFBK0JxTixDQUFDLEtBQUtyTixNQUF4QyxFQUFnRDtFQUMvQ3NOLE1BQUFBLEtBQUssR0FBRyxJQUFSO0VBQ0EsYUFBT0EsS0FBUDtFQUNBO0VBQ0QsR0FMRDtFQU1ELFNBQU9BLEtBQVA7RUFDQTs7O0VBR0QsU0FBU3FXLGVBQVQsQ0FBeUIva0IsSUFBekIsRUFBK0I4a0IsWUFBL0IsRUFBNEM7RUFDM0MsT0FBSSxJQUFJaGhCLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ2doQixZQUFZLENBQUN0akIsTUFBNUIsRUFBb0NzQyxDQUFDLEVBQXJDLEVBQXlDO0VBQ3hDLFFBQUkraUIsS0FBSyxHQUFHVSxzQkFBc0IsQ0FBQ3ZuQixJQUFELEVBQU84a0IsWUFBWSxDQUFDaGhCLENBQUQsQ0FBbkIsQ0FBbEM7RUFDQSxRQUFHK2lCLEtBQUgsRUFDQzFrQixPQUFPLENBQUNpTCxHQUFSLENBQVksY0FBWTBYLFlBQVksQ0FBQ2hoQixDQUFELENBQVosQ0FBZ0J5RCxNQUFoQixDQUF1QmtFLElBQXZCLENBQTRCekssSUFBeEMsR0FBNkMsR0FBN0MsR0FBaUQ4akIsWUFBWSxDQUFDaGhCLENBQUQsQ0FBWixDQUFnQjBELE1BQWhCLENBQXVCaUUsSUFBdkIsQ0FBNEJ6SyxJQUF6RixFQUErRjZsQixLQUEvRjtFQUNEO0VBQ0Q7O0VBRU0sU0FBU1Usc0JBQVQsQ0FBZ0N2bkIsSUFBaEMsRUFBc0M2SixLQUF0QyxFQUE2QztFQUNuRCxNQUFJakQsSUFBSSxHQUFHeWMsS0FBSyxDQUFDcmpCLElBQUksQ0FBQ3dRLFNBQU4sQ0FBaEI7RUFDQSxNQUFJN0UsWUFBWSxHQUFHc1ksT0FBQSxDQUF1QnJkLElBQXZCLENBQW5CO0VBQ0EsTUFBSVcsTUFBSixFQUFZQyxNQUFaOztFQUNBLE1BQUcsVUFBVXFDLEtBQWIsRUFBb0I7RUFDbkJBLElBQUFBLEtBQUssR0FBR29hLGFBQUEsQ0FBNkJ0WSxZQUE3QixFQUEyQzlCLEtBQUssQ0FBQzdJLElBQWpELENBQVI7RUFDQSxRQUFHLEVBQUUsWUFBWTZJLEtBQUssQ0FBQzRCLElBQXBCLENBQUgsRUFDQyxPQUFPLElBQVA7RUFDRGxFLElBQUFBLE1BQU0sR0FBRzBjLGFBQUEsQ0FBNkJ0WSxZQUE3QixFQUEyQzlCLEtBQUssQ0FBQzRCLElBQU4sQ0FBV2xFLE1BQXRELENBQVQ7RUFDQUMsSUFBQUEsTUFBTSxHQUFHeWMsYUFBQSxDQUE2QnRZLFlBQTdCLEVBQTJDOUIsS0FBSyxDQUFDNEIsSUFBTixDQUFXakUsTUFBdEQsQ0FBVDtFQUNBLEdBTkQsTUFNTztFQUNORCxJQUFBQSxNQUFNLEdBQUdzQyxLQUFLLENBQUN0QyxNQUFmO0VBQ0FDLElBQUFBLE1BQU0sR0FBR3FDLEtBQUssQ0FBQ3JDLE1BQWY7RUFDQTs7RUFFRCxNQUFJb1ksRUFBRSxHQUFJclksTUFBTSxDQUFDeEUsQ0FBUCxHQUFXeUUsTUFBTSxDQUFDekUsQ0FBbEIsR0FBc0J3RSxNQUFNLENBQUN4RSxDQUE3QixHQUFpQ3lFLE1BQU0sQ0FBQ3pFLENBQWxEO0VBQ0EsTUFBSThjLEVBQUUsR0FBSXRZLE1BQU0sQ0FBQ3hFLENBQVAsR0FBV3lFLE1BQU0sQ0FBQ3pFLENBQWxCLEdBQXNCeUUsTUFBTSxDQUFDekUsQ0FBN0IsR0FBaUN3RSxNQUFNLENBQUN4RSxDQUFsRDtFQUNBLE1BQUkyZixFQUFFLEdBQUduYixNQUFNLENBQUN2RSxDQUFoQixDQWpCbUQ7O0VBb0JuRCxNQUFJNmpCLEtBQUssR0FBRzNoQixDQUFDLENBQUN3RixHQUFGLENBQU1pQixZQUFOLEVBQW9CLFVBQVM1QixLQUFULEVBQWdCYSxFQUFoQixFQUFtQjtFQUNsRCxXQUFPLENBQUNiLEtBQUssQ0FBQzBCLElBQU4sQ0FBV3pELE1BQVosSUFDTCtCLEtBQUssQ0FBQzBCLElBQU4sQ0FBV3pLLElBQVgsS0FBb0J1RyxNQUFNLENBQUNrRSxJQUFQLENBQVl6SyxJQUQzQixJQUNvQytJLEtBQUssQ0FBQzBCLElBQU4sQ0FBV3pLLElBQVgsS0FBb0J3RyxNQUFNLENBQUNpRSxJQUFQLENBQVl6SyxJQURwRSxJQUVMK0ksS0FBSyxDQUFDL0csQ0FBTixJQUFXMGYsRUFGTixJQUVZM1ksS0FBSyxDQUFDaEgsQ0FBTixHQUFVNmMsRUFGdEIsSUFFNEI3VixLQUFLLENBQUNoSCxDQUFOLEdBQVU4YyxFQUZ0QyxHQUUyQzlWLEtBQUssQ0FBQ2hILENBRmpELEdBRXFELElBRjVEO0VBR0EsR0FKVyxDQUFaO0VBS0EsU0FBTzhqQixLQUFLLENBQUNybEIsTUFBTixHQUFlLENBQWYsR0FBbUJxbEIsS0FBbkIsR0FBMkIsSUFBbEM7RUFDQTs7RUFFRCxTQUFTMUMsa0JBQVQsQ0FBNEJua0IsSUFBNUIsRUFBa0M7RUFDakMsU0FBTztFQUFDLGFBQVc4akIsYUFBQSxLQUEwQmhXLE1BQU0sQ0FBQ3ViLFVBQWpDLEdBQStDcnBCLElBQUksQ0FBQ3FGLEtBQWhFO0VBQ0wsY0FBV3llLGFBQUEsS0FBMEJoVyxNQUFNLENBQUN3YixXQUFqQyxHQUErQ3RwQixJQUFJLENBQUNvUjtFQUQxRCxHQUFQO0VBRUE7O0VBRU0sU0FBU2tILG1CQUFULENBQTZCdFksSUFBN0IsRUFBbUM7RUFDekM7RUFDQSxNQUFJa2tCLGNBQWMsR0FBR0Msa0JBQWtCLENBQUNua0IsSUFBRCxDQUF2QztFQUNBLE1BQUl1cEIsUUFBUSxHQUFHLENBQWY7RUFDQSxNQUFJQyxVQUFVLEdBQUcsRUFBakI7O0VBQ0EsT0FBSSxJQUFJam9CLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ3ZCLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYVIsTUFBNUIsRUFBb0NELENBQUMsRUFBckMsRUFBeUM7RUFDeEMsUUFBSTZKLEtBQUssR0FBRzZZLFFBQUEsQ0FBd0Jqa0IsSUFBSSxDQUFDZ0MsT0FBN0IsRUFBc0NoQyxJQUFJLENBQUNnQyxPQUFMLENBQWFULENBQWIsRUFBZ0JQLElBQXRELENBQVo7RUFDQSxRQUFJOEYsUUFBUSxHQUFHbWQsY0FBQSxDQUE4QmprQixJQUFJLENBQUNnQyxPQUFuQyxFQUE0Q2hDLElBQUksQ0FBQ2dDLE9BQUwsQ0FBYVQsQ0FBYixDQUE1QyxDQUFmLENBRndDOztFQUt4QyxRQUFJa29CLEtBQUssR0FBRyxLQUFLM2lCLFFBQVEsQ0FBQ3RGLE1BQVQsR0FBa0IsQ0FBbEIsR0FBc0IsT0FBTXNGLFFBQVEsQ0FBQ3RGLE1BQVQsR0FBZ0IsSUFBNUMsR0FBb0QsQ0FBekQsS0FBK0R4QixJQUFJLENBQUNnQyxPQUFMLENBQWFULENBQWIsRUFBZ0JpRyxNQUFoQixHQUF5QixJQUF6QixHQUFnQyxDQUEvRixDQUFaO0VBQ0EsUUFBRzRELEtBQUssSUFBSW9lLFVBQVosRUFDQ0EsVUFBVSxDQUFDcGUsS0FBRCxDQUFWLElBQXFCcWUsS0FBckIsQ0FERCxLQUdDRCxVQUFVLENBQUNwZSxLQUFELENBQVYsR0FBb0JxZSxLQUFwQjtFQUVELFFBQUdELFVBQVUsQ0FBQ3BlLEtBQUQsQ0FBVixHQUFvQm1lLFFBQXZCLEVBQ0NBLFFBQVEsR0FBR0MsVUFBVSxDQUFDcGUsS0FBRCxDQUFyQjtFQUNEOztFQUVELE1BQUlzZSxTQUFTLEdBQUdsWCxNQUFNLENBQUNwRSxJQUFQLENBQVlvYixVQUFaLEVBQXdCaG9CLE1BQXhCLEdBQStCeEIsSUFBSSxDQUFDeU4sV0FBcEMsR0FBZ0QsR0FBaEU7RUFDQSxNQUFJa2MsVUFBVSxHQUFLekYsY0FBYyxDQUFDN2UsS0FBZixHQUF1QnJGLElBQUksQ0FBQ3lOLFdBQTVCLEdBQTBDOGIsUUFBUSxHQUFDdnBCLElBQUksQ0FBQ3lOLFdBQWQsR0FBMEIsSUFBcEUsR0FDWnlXLGNBQWMsQ0FBQzdlLEtBQWYsR0FBdUJyRixJQUFJLENBQUN5TixXQURoQixHQUM4QjhiLFFBQVEsR0FBQ3ZwQixJQUFJLENBQUN5TixXQUFkLEdBQTBCLElBRDNFO0VBRUEsTUFBSW1jLFdBQVcsR0FBSTFGLGNBQWMsQ0FBQzlTLE1BQWYsR0FBd0JwUixJQUFJLENBQUN5TixXQUE3QixHQUEyQ2ljLFNBQTNDLEdBQ1p4RixjQUFjLENBQUM5UyxNQUFmLEdBQXdCcFIsSUFBSSxDQUFDeU4sV0FEakIsR0FDK0JpYyxTQURsRDtFQUVBLFNBQU87RUFBQyxhQUFTQyxVQUFWO0VBQXNCLGNBQVVDO0VBQWhDLEdBQVA7RUFDQTs7RUFHRCxTQUFTNUYsZUFBVCxDQUF5QmhpQixPQUF6QixFQUFrQztFQUNqQztFQUNBO0VBQ0EsT0FBSSxJQUFJVCxDQUFDLEdBQUMsQ0FBVixFQUFZQSxDQUFDLEdBQUNTLE9BQU8sQ0FBQ1IsTUFBdEIsRUFBNkJELENBQUMsRUFBOUIsRUFBa0M7RUFDakMsUUFBRzBpQixRQUFBLENBQXdCamlCLE9BQXhCLEVBQWlDQSxPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXUCxJQUE1QyxLQUFxRCxDQUF4RCxFQUNDZ0IsT0FBTyxDQUFDVCxDQUFELENBQVAsQ0FBVzhKLFNBQVgsR0FBdUIsSUFBdkI7RUFDRDs7RUFFRCxNQUFJQSxTQUFTLEdBQUcsRUFBaEI7RUFDQSxNQUFJd2UsY0FBYyxHQUFHLEVBQXJCOztFQUNBLE9BQUksSUFBSXRvQixHQUFDLEdBQUMsQ0FBVixFQUFZQSxHQUFDLEdBQUNTLE9BQU8sQ0FBQ1IsTUFBdEIsRUFBNkJELEdBQUMsRUFBOUIsRUFBa0M7RUFDakMsUUFBSXVLLElBQUksR0FBRzlKLE9BQU8sQ0FBQ1QsR0FBRCxDQUFsQjs7RUFDQSxRQUFHLGVBQWV1SyxJQUFmLElBQXVCNUcsQ0FBQyxDQUFDcUUsT0FBRixDQUFVdUMsSUFBSSxDQUFDOUssSUFBZixFQUFxQjZvQixjQUFyQixLQUF3QyxDQUFDLENBQW5FLEVBQXFFO0VBQ3BFQSxNQUFBQSxjQUFjLENBQUNsb0IsSUFBZixDQUFvQm1LLElBQUksQ0FBQzlLLElBQXpCO0VBQ0FxSyxNQUFBQSxTQUFTLENBQUMxSixJQUFWLENBQWVtSyxJQUFmO0VBQ0EsVUFBSWhDLElBQUksR0FBR21hLFlBQUEsQ0FBNEJqaUIsT0FBNUIsRUFBcUM4SixJQUFyQyxDQUFYOztFQUNBLFdBQUksSUFBSXpFLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ3lDLElBQUksQ0FBQ3RJLE1BQXBCLEVBQTRCNkYsQ0FBQyxFQUE3QixFQUFnQztFQUMvQixZQUFHbkMsQ0FBQyxDQUFDcUUsT0FBRixDQUFVTyxJQUFJLENBQUN6QyxDQUFELENBQWQsRUFBbUJ3aUIsY0FBbkIsS0FBc0MsQ0FBQyxDQUExQyxFQUE2QztFQUM1Q0EsVUFBQUEsY0FBYyxDQUFDbG9CLElBQWYsQ0FBb0JtSSxJQUFJLENBQUN6QyxDQUFELENBQXhCO0VBQ0FnRSxVQUFBQSxTQUFTLENBQUMxSixJQUFWLENBQWVzaUIsYUFBQSxDQUE2QmppQixPQUE3QixFQUFzQzhILElBQUksQ0FBQ3pDLENBQUQsQ0FBMUMsQ0FBZjtFQUNBO0VBQ0Q7RUFDRDtFQUNEOztFQUVELE1BQUlwRCxVQUFVLEdBQUdpQixDQUFDLENBQUN3RixHQUFGLENBQU0xSSxPQUFOLEVBQWUsVUFBUzJJLEdBQVQsRUFBY0MsRUFBZCxFQUFpQjtFQUFDLFdBQU8sZUFBZUQsR0FBZixJQUFzQkEsR0FBRyxDQUFDVSxTQUExQixHQUFzQyxJQUF0QyxHQUE2Q1YsR0FBcEQ7RUFBeUQsR0FBMUYsQ0FBakI7O0VBQ0EsT0FBSyxJQUFJcEosR0FBQyxHQUFHOEosU0FBUyxDQUFDN0osTUFBdkIsRUFBK0JELEdBQUMsR0FBRyxDQUFuQyxFQUFzQyxFQUFFQSxHQUF4QztFQUNDMEMsSUFBQUEsVUFBVSxDQUFDdVksT0FBWCxDQUFtQm5SLFNBQVMsQ0FBQzlKLEdBQUMsR0FBQyxDQUFILENBQTVCO0VBREQ7O0VBRUEsU0FBTzBDLFVBQVA7RUFDQTs7O0VBR0QsU0FBU2tpQixLQUFULENBQWVubUIsSUFBZixFQUFvQjtFQUNuQixNQUFJOHBCLEtBQUssR0FBRzlwQixJQUFJLENBQUNrZ0IsU0FBakI7RUFDQSxNQUFJNEosS0FBSyxLQUFLam5CLFFBQVEsQ0FBQ2luQixLQUFELEVBQVEsRUFBUixDQUF0QjtFQUNDLFdBQU9BLEtBQVA7RUFFRCxNQUFHQSxLQUFLLENBQUNwb0IsT0FBTixDQUFjLElBQWQsSUFBc0IsQ0FBQyxDQUExQixFQUNDLE9BQU9vb0IsS0FBSyxDQUFDeFQsT0FBTixDQUFjLElBQWQsRUFBb0IsRUFBcEIsQ0FBUCxDQURELEtBRUssSUFBR3dULEtBQUssQ0FBQ3BvQixPQUFOLENBQWMsSUFBZCxNQUF3QixDQUFDLENBQTVCLEVBQ0osT0FBT29vQixLQUFQO0VBQ0RBLEVBQUFBLEtBQUssR0FBRzFtQixVQUFVLENBQUMwbUIsS0FBSyxDQUFDeFQsT0FBTixDQUFjLElBQWQsRUFBb0IsRUFBcEIsQ0FBRCxDQUFsQjtFQUNBLFNBQVFsVCxVQUFVLENBQUMybUIsZ0JBQWdCLENBQUM3a0IsQ0FBQyxDQUFDLE1BQUlsRixJQUFJLENBQUN3USxTQUFWLENBQUQsQ0FBc0IrRSxHQUF0QixDQUEwQixDQUExQixDQUFELENBQWhCLENBQStDeVUsUUFBaEQsQ0FBVixHQUFvRUYsS0FBckUsR0FBNEUsR0FBbkY7RUFDQTs7O0VBR0QsU0FBUzVELFFBQVQsQ0FBa0JsbUIsSUFBbEIsRUFBd0I4TCxJQUF4QixFQUE4QjZZLElBQTlCLEVBQW9DMUQsRUFBcEMsRUFBd0NFLEVBQXhDLEVBQTRDOEksS0FBNUMsRUFBbURDLFdBQW5ELEVBQWdFO0VBQy9EcGUsRUFBQUEsSUFBSSxDQUFDc00sTUFBTCxDQUFZLFVBQVUvVCxDQUFWLEVBQWE7RUFDeEIsV0FBT0EsQ0FBQyxDQUFDb0gsSUFBRixDQUFPekQsTUFBUCxJQUFpQixDQUFDaEksSUFBSSxDQUFDbU4sS0FBdkIsR0FBK0IsS0FBL0IsR0FBdUMsSUFBOUM7RUFDQSxHQUZELEVBRUdvQyxNQUZILENBRVUsTUFGVixFQUdDdkcsSUFIRCxDQUdNLE9BSE4sRUFHZWtoQixXQUFXLEdBQUcsWUFBZCxJQUE4QixXQUg3QyxFQUlDbGhCLElBSkQsQ0FJTSxHQUpOLEVBSVdpWSxFQUpYLEVBS0NqWSxJQUxELENBS00sR0FMTixFQUtXbVksRUFMWDtFQUFBLEdBT0NuWSxJQVBELENBT00sYUFQTixFQU9xQmhKLElBQUksQ0FBQ3lqQixXQVAxQixFQVFDemEsSUFSRCxDQVFNLFdBUk4sRUFRbUJoSixJQUFJLENBQUNrZ0IsU0FSeEIsRUFTQ2xYLElBVEQsQ0FTTSxhQVROLEVBU3FCaEosSUFBSSxDQUFDMGpCLFdBVDFCLEVBVUNuZSxJQVZELENBVU0wa0IsS0FWTjtFQVdBOztFQUVNLFNBQVNyYixPQUFULENBQWlCNU8sSUFBakIsRUFBdUI7RUFDN0JrRixFQUFBQSxDQUFDLENBQUMsTUFBSWxGLElBQUksQ0FBQ3dRLFNBQVYsQ0FBRCxDQUFzQlMsS0FBdEI7RUFDQTFDLEVBQUFBLFVBQUEsQ0FBb0J2TyxJQUFwQjs7RUFDQSxNQUFJO0VBQ0hrUixJQUFBQSxLQUFLLENBQUNsUixJQUFELENBQUw7RUFDQSxHQUZELENBRUUsT0FBTU8sQ0FBTixFQUFTO0VBQ1Y0QixJQUFBQSxPQUFPLENBQUN1VixLQUFSLENBQWNuWCxDQUFkO0VBQ0EsVUFBTUEsQ0FBTjtFQUNBOztFQUVELE1BQUk7RUFDSDRwQixJQUFBQSxTQUFTLENBQUNoTSxNQUFWLENBQWlCbmUsSUFBakI7RUFDQSxHQUZELENBRUUsT0FBTU8sQ0FBTixFQUFTO0VBRVY7RUFDRDs7RUFHTSxTQUFTeU8sUUFBVCxDQUFrQmhOLE9BQWxCLEVBQTJCOEosSUFBM0IsRUFBaUNqQixHQUFqQyxFQUFzQ3VmLE1BQXRDLEVBQThDbmYsU0FBOUMsRUFBeUQ7RUFDL0QsTUFBR0EsU0FBUyxJQUFJL0YsQ0FBQyxDQUFDcUUsT0FBRixDQUFVMEIsU0FBVixFQUFxQixDQUFFLFFBQUYsRUFBWSxRQUFaLENBQXJCLE1BQWtELENBQUMsQ0FBbkUsRUFDQyxPQUFPLElBQUk4ZCxLQUFKLENBQVUsNEJBQTBCOWQsU0FBcEMsQ0FBUDtFQUVELE1BQUksUUFBT21mLE1BQVAsb0JBQUosRUFDQ0EsTUFBTSxHQUFHLENBQVQ7RUFDRCxNQUFJdGpCLFFBQVEsR0FBR21kLGNBQUEsQ0FBOEJqaUIsT0FBOUIsRUFBdUM4SixJQUF2QyxDQUFmO0VBQ0EsTUFBSXVlLFFBQUosRUFBYy9mLEdBQWQ7O0VBQ0EsTUFBSXhELFFBQVEsQ0FBQ3RGLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkI7RUFDMUIsUUFBSThvQixPQUFPLEdBQUd6SixVQUFVLENBQUM3ZSxPQUFELEVBQVU4SixJQUFWLEVBQWdCQSxJQUFJLENBQUNqQixHQUFMLEtBQWEsR0FBYixHQUFtQixHQUFuQixHQUF3QixHQUF4QyxFQUE2Q2lCLElBQUksQ0FBQ2pCLEdBQUwsS0FBYSxHQUExRCxDQUF4QjtFQUNBeWYsSUFBQUEsT0FBTyxDQUFDOWYsU0FBUixHQUFvQixJQUFwQjtFQUNBNmYsSUFBQUEsUUFBUSxHQUFHQyxPQUFPLENBQUN0cEIsSUFBbkI7RUFDQXNKLElBQUFBLEdBQUcsR0FBRzJaLFlBQUEsQ0FBNEJqaUIsT0FBNUIsRUFBcUM4SixJQUFJLENBQUM5SyxJQUExQyxJQUFnRCxDQUF0RDtFQUNBLEdBTEQsTUFLTztFQUNOLFFBQUl3VyxDQUFDLEdBQUcxUSxRQUFRLENBQUMsQ0FBRCxDQUFoQjtFQUNBdWpCLElBQUFBLFFBQVEsR0FBSTdTLENBQUMsQ0FBQ2hRLE1BQUYsS0FBYXNFLElBQUksQ0FBQzlLLElBQWxCLEdBQXlCd1csQ0FBQyxDQUFDalEsTUFBM0IsR0FBb0NpUSxDQUFDLENBQUNoUSxNQUFsRDtFQUNBOEMsSUFBQUEsR0FBRyxHQUFHMlosWUFBQSxDQUE0QmppQixPQUE1QixFQUFxQ3dWLENBQUMsQ0FBQ3hXLElBQXZDLENBQU47RUFDQTs7RUFFRCxNQUFJdXBCLE9BQUo7RUFDQSxNQUFHdGYsU0FBSCxFQUNDc2YsT0FBTyxHQUFHQyxlQUFlLENBQUN4b0IsT0FBRCxFQUFVaUosU0FBVixDQUF6QjtFQUNELE1BQUl3ZixXQUFXLEdBQUcsRUFBbEI7O0VBQ0EsT0FBSyxJQUFJbHBCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUc2b0IsTUFBcEIsRUFBNEI3b0IsQ0FBQyxFQUE3QixFQUFpQztFQUNoQyxRQUFJNkYsS0FBSyxHQUFHO0VBQUMsY0FBUTZjLE1BQUEsQ0FBc0IsQ0FBdEIsQ0FBVDtFQUFtQyxhQUFPcFosR0FBMUM7RUFDUixnQkFBV2lCLElBQUksQ0FBQ2pCLEdBQUwsS0FBYSxHQUFiLEdBQW1CaUIsSUFBSSxDQUFDOUssSUFBeEIsR0FBK0JxcEIsUUFEbEM7RUFFUixnQkFBV3ZlLElBQUksQ0FBQ2pCLEdBQUwsS0FBYSxHQUFiLEdBQW1Cd2YsUUFBbkIsR0FBOEJ2ZSxJQUFJLENBQUM5SztFQUZ0QyxLQUFaO0VBR0FnQixJQUFBQSxPQUFPLENBQUMrZixNQUFSLENBQWV6WCxHQUFmLEVBQW9CLENBQXBCLEVBQXVCbEQsS0FBdkI7RUFFQSxRQUFHNkQsU0FBSCxFQUNDN0QsS0FBSyxDQUFDNkQsU0FBRCxDQUFMLEdBQW1Cc2YsT0FBbkI7RUFDREUsSUFBQUEsV0FBVyxDQUFDOW9CLElBQVosQ0FBaUJ5RixLQUFqQjtFQUNBOztFQUNELFNBQU9xakIsV0FBUDtFQUNBOztFQUdNLFNBQVM1SixVQUFULENBQW9CN2UsT0FBcEIsRUFBNkI4SixJQUE3QixFQUFtQ2pCLEdBQW5DLEVBQXdDNmYsT0FBeEMsRUFBaUR6ZixTQUFqRCxFQUE0RDtFQUNsRSxNQUFHQSxTQUFTLElBQUkvRixDQUFDLENBQUNxRSxPQUFGLENBQVUwQixTQUFWLEVBQXFCLENBQUUsUUFBRixFQUFZLFFBQVosQ0FBckIsTUFBa0QsQ0FBQyxDQUFuRSxFQUNDLE9BQU8sSUFBSThkLEtBQUosQ0FBVSw0QkFBMEI5ZCxTQUFwQyxDQUFQO0VBRUQsTUFBSTBmLE1BQU0sR0FBRztFQUFDLFlBQVExRyxNQUFBLENBQXNCLENBQXRCLENBQVQ7RUFBbUMsV0FBT3BaO0VBQTFDLEdBQWI7O0VBQ0EsTUFBR2lCLElBQUksQ0FBQ1QsU0FBUixFQUFtQjtFQUNsQnNmLElBQUFBLE1BQU0sQ0FBQ3RmLFNBQVAsR0FBbUIsSUFBbkI7RUFDQSxHQUZELE1BRU87RUFDTnNmLElBQUFBLE1BQU0sQ0FBQ3BqQixNQUFQLEdBQWdCdUUsSUFBSSxDQUFDdkUsTUFBckI7RUFDQW9qQixJQUFBQSxNQUFNLENBQUNuakIsTUFBUCxHQUFnQnNFLElBQUksQ0FBQ3RFLE1BQXJCO0VBQ0E7O0VBQ0QsTUFBSThDLEdBQUcsR0FBRzJaLFlBQUEsQ0FBNEJqaUIsT0FBNUIsRUFBcUM4SixJQUFJLENBQUM5SyxJQUExQyxDQUFWOztFQUVBLE1BQUdpSyxTQUFILEVBQWM7RUFDYjJmLElBQUFBLFNBQVMsQ0FBQzVvQixPQUFELEVBQVVBLE9BQU8sQ0FBQ3NJLEdBQUQsQ0FBakIsRUFBd0JxZ0IsTUFBeEIsRUFBZ0MxZixTQUFoQyxDQUFUO0VBQ0E7O0VBRUQsTUFBR3lmLE9BQUgsRUFBWTtFQUFFO0VBQ2IsUUFBR3BnQixHQUFHLEdBQUcsQ0FBVCxFQUFZQSxHQUFHO0VBQ2YsR0FGRCxNQUdDQSxHQUFHOztFQUNKdEksRUFBQUEsT0FBTyxDQUFDK2YsTUFBUixDQUFlelgsR0FBZixFQUFvQixDQUFwQixFQUF1QnFnQixNQUF2QjtFQUNBLFNBQU9BLE1BQVA7RUFDQTs7RUFHRCxTQUFTQyxTQUFULENBQW1CNW9CLE9BQW5CLEVBQTRCNm9CLEVBQTVCLEVBQWdDQyxFQUFoQyxFQUFvQzdmLFNBQXBDLEVBQStDO0VBQzlDLE1BQUcsQ0FBQzRmLEVBQUUsQ0FBQzVmLFNBQUQsQ0FBTixFQUFtQjtFQUNsQjRmLElBQUFBLEVBQUUsQ0FBQzVmLFNBQUQsQ0FBRixHQUFnQnVmLGVBQWUsQ0FBQ3hvQixPQUFELEVBQVVpSixTQUFWLENBQS9CO0VBQ0EsUUFBRyxDQUFDNGYsRUFBRSxDQUFDNWYsU0FBRCxDQUFOLEVBQ0MsT0FBTyxLQUFQO0VBQ0Q7O0VBQ0Q2ZixFQUFBQSxFQUFFLENBQUM3ZixTQUFELENBQUYsR0FBZ0I0ZixFQUFFLENBQUM1ZixTQUFELENBQWxCO0VBQ0EsTUFBRzRmLEVBQUUsQ0FBQ2xsQixHQUFOLEVBQ0NtbEIsRUFBRSxDQUFDbmxCLEdBQUgsR0FBU2tsQixFQUFFLENBQUNsbEIsR0FBWjtFQUNELE1BQUdrbEIsRUFBRSxDQUFDbmxCLEdBQUgsS0FBV21sQixFQUFFLENBQUNqbEIsTUFBSCxJQUFhLENBQWIsSUFBa0IsQ0FBQ2lsQixFQUFFLENBQUNqbEIsTUFBakMsQ0FBSCxFQUNDa2xCLEVBQUUsQ0FBQ3BsQixHQUFILEdBQVNtbEIsRUFBRSxDQUFDbmxCLEdBQVo7RUFDRCxTQUFPLElBQVA7RUFDQTs7O0VBR0QsU0FBUzhrQixlQUFULENBQXlCeG9CLE9BQXpCLEVBQWtDaUosU0FBbEMsRUFBNkM7RUFDNUMsTUFBSThmLEVBQUUsR0FBRyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLEdBQTVCLENBQVQ7O0VBQ0EsT0FBSSxJQUFJeHBCLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ1MsT0FBTyxDQUFDUixNQUF2QixFQUErQkQsQ0FBQyxFQUFoQyxFQUFvQztFQUNuQyxRQUFHUyxPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXMEosU0FBWCxDQUFILEVBQTBCO0VBQ3pCLFVBQUlYLEdBQUcsR0FBR3lnQixFQUFFLENBQUNycEIsT0FBSCxDQUFXTSxPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXMEosU0FBWCxDQUFYLENBQVY7RUFDQSxVQUFJWCxHQUFHLEdBQUcsQ0FBQyxDQUFYLEVBQ0N5Z0IsRUFBRSxDQUFDaEosTUFBSCxDQUFVelgsR0FBVixFQUFlLENBQWY7RUFDRDtFQUNEOztFQUNELE1BQUd5Z0IsRUFBRSxDQUFDdnBCLE1BQUgsR0FBWSxDQUFmLEVBQ0MsT0FBT3VwQixFQUFFLENBQUMsQ0FBRCxDQUFUO0VBQ0QsU0FBTzdxQixTQUFQO0VBQ0E7OztFQUdNLFNBQVN5TyxTQUFULENBQW1CM00sT0FBbkIsRUFBNEI2b0IsRUFBNUIsRUFBZ0M7RUFDdEMsTUFBRyxDQUFDQSxFQUFFLENBQUNwaUIsTUFBSixJQUFjLENBQUNvaUIsRUFBRSxDQUFDL2hCLE1BQXJCLEVBQ0M7RUFDRCxNQUFJbUMsU0FBUyxHQUFJNGYsRUFBRSxDQUFDcGlCLE1BQUgsR0FBWSxRQUFaLEdBQXVCLFFBQXhDOztFQUNBLE9BQUksSUFBSWxILENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQ1MsT0FBTyxDQUFDUixNQUF2QixFQUErQkQsQ0FBQyxFQUFoQyxFQUFvQztFQUNuQyxRQUFJdXBCLEVBQUUsR0FBRzlvQixPQUFPLENBQUNULENBQUQsQ0FBaEI7O0VBQ0EsUUFBR3VwQixFQUFFLENBQUM3ZixTQUFELENBQUYsSUFBaUI0ZixFQUFFLENBQUM1ZixTQUFELENBQUYsSUFBaUI2ZixFQUFFLENBQUM3ZixTQUFELENBQXBDLElBQW1ENmYsRUFBRSxDQUFDOXBCLElBQUgsS0FBWTZwQixFQUFFLENBQUM3cEIsSUFBckUsRUFBMkU7RUFDMUUsVUFBR2lLLFNBQVMsS0FBSyxRQUFqQixFQUNFNmYsRUFBRSxDQUFDamdCLEdBQUgsR0FBU2dnQixFQUFFLENBQUNoZ0IsR0FBWjtFQUNGLFVBQUdnZ0IsRUFBRSxDQUFDbGxCLEdBQU4sRUFDQ21sQixFQUFFLENBQUNubEIsR0FBSCxHQUFTa2xCLEVBQUUsQ0FBQ2xsQixHQUFaO0VBQ0QsVUFBR2tsQixFQUFFLENBQUNubEIsR0FBSCxLQUFXbWxCLEVBQUUsQ0FBQ2psQixNQUFILElBQWEsQ0FBYixJQUFrQixDQUFDaWxCLEVBQUUsQ0FBQ2psQixNQUFqQyxDQUFILEVBQ0NrbEIsRUFBRSxDQUFDcGxCLEdBQUgsR0FBU21sQixFQUFFLENBQUNubEIsR0FBWjtFQUNEO0VBQ0Q7RUFDRDs7RUFHRCxTQUFTc2xCLFVBQVQsQ0FBb0JocEIsT0FBcEIsRUFBNkI7RUFDNUIsTUFBSWlwQixVQUFVLEdBQUcsQ0FBQyxRQUFELEVBQVcsUUFBWCxDQUFqQjs7RUFDQSxPQUFJLElBQUkxcEIsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDUyxPQUFPLENBQUNSLE1BQXZCLEVBQStCRCxDQUFDLEVBQWhDLEVBQW9DO0VBQ25DLFNBQUksSUFBSThGLENBQUMsR0FBQyxDQUFWLEVBQWFBLENBQUMsR0FBQzRqQixVQUFVLENBQUN6cEIsTUFBMUIsRUFBa0M2RixDQUFDLEVBQW5DLEVBQXVDO0VBQ3RDLFVBQUk0RCxTQUFTLEdBQUdnZ0IsVUFBVSxDQUFDNWpCLENBQUQsQ0FBMUI7O0VBQ0EsVUFBR3JGLE9BQU8sQ0FBQ1QsQ0FBRCxDQUFQLENBQVcwSixTQUFYLENBQUgsRUFBMEI7RUFDekIsWUFBSXBKLEtBQUssR0FBRyxDQUFaOztFQUNBLGFBQUksSUFBSXdGLEVBQUMsR0FBQyxDQUFWLEVBQWFBLEVBQUMsR0FBQ3JGLE9BQU8sQ0FBQ1IsTUFBdkIsRUFBK0I2RixFQUFDLEVBQWhDLEVBQW9DO0VBQ25DLGNBQUdyRixPQUFPLENBQUNxRixFQUFELENBQVAsQ0FBVzRELFNBQVgsS0FBeUJqSixPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXMEosU0FBWCxDQUE1QixFQUNDcEosS0FBSztFQUNOOztFQUNELFlBQUdBLEtBQUssR0FBRyxDQUFYLEVBQ0MsT0FBT0csT0FBTyxDQUFDVCxDQUFELENBQVAsQ0FBVyxDQUFDMEosU0FBRCxDQUFYLENBQVA7RUFDRDtFQUNEO0VBQ0Q7RUFDRDs7O0VBR00sU0FBUzJXLFVBQVQsQ0FBb0I1aEIsSUFBcEIsRUFBMEJnQyxPQUExQixFQUFtQ2hCLElBQW5DLEVBQXlDO0VBQy9DLE1BQUl1RyxNQUFKLEVBQVlDLE1BQVo7RUFDQSxNQUFJWixJQUFJLEdBQUd5YyxLQUFLLENBQUNyakIsSUFBSSxDQUFDd1EsU0FBTixDQUFoQjtFQUNBLE1BQUkwYSxTQUFTLEdBQUdqSCxPQUFBLENBQXVCcmQsSUFBdkIsQ0FBaEI7RUFDQSxNQUFJdWtCLFNBQVMsR0FBR2xILGFBQUEsQ0FBNkJpSCxTQUE3QixFQUF3Q2xxQixJQUF4QyxDQUFoQjtFQUNBLE1BQUk4SyxJQUFJLEdBQUlxZixTQUFTLENBQUMxZixJQUF0QjtFQUNBLE1BQUlMLEtBQUssR0FBRytmLFNBQVMsQ0FBQy9mLEtBQXRCLENBTitDOztFQVEvQyxNQUFJZ2dCLEdBQUcsR0FBRyxDQUFDLEdBQVg7RUFDQSxNQUFJZixRQUFKO0VBQ0EsTUFBSXZqQixRQUFRLEdBQUdtZCxjQUFBLENBQThCamlCLE9BQTlCLEVBQXVDOEosSUFBdkMsQ0FBZjs7RUFDQSxNQUFHaEYsUUFBUSxDQUFDdEYsTUFBVCxHQUFrQixDQUFyQixFQUF1QjtFQUN0QjZvQixJQUFBQSxRQUFRLEdBQUd2akIsUUFBUSxDQUFDLENBQUQsQ0FBUixDQUFZUyxNQUFaLElBQXNCdUUsSUFBSSxDQUFDOUssSUFBM0IsR0FBa0M4RixRQUFRLENBQUMsQ0FBRCxDQUFSLENBQVlVLE1BQTlDLEdBQXVEVixRQUFRLENBQUMsQ0FBRCxDQUFSLENBQVlTLE1BQTlFO0VBQ0E2akIsSUFBQUEsR0FBRyxHQUFHbkgsYUFBQSxDQUE2QmlILFNBQTdCLEVBQXdDYixRQUF4QyxFQUFrRDVlLElBQWxELENBQXVEN0gsRUFBN0Q7RUFDQTs7RUFFRCxNQUFJckMsQ0FBSjs7RUFDQSxNQUFHNkosS0FBSyxJQUFJLENBQVosRUFBZTtFQUNkN0QsSUFBQUEsTUFBTSxHQUFHO0VBQUMsY0FBUTBjLE1BQUEsQ0FBc0IsQ0FBdEIsQ0FBVDtFQUFtQyxhQUFPLEdBQTFDO0VBQStDLG1CQUFhO0VBQTVELEtBQVQ7RUFDQXpjLElBQUFBLE1BQU0sR0FBRztFQUFDLGNBQVF5YyxNQUFBLENBQXNCLENBQXRCLENBQVQ7RUFBbUMsYUFBTyxHQUExQztFQUErQyxtQkFBYTtFQUE1RCxLQUFUO0VBQ0FqaUIsSUFBQUEsT0FBTyxDQUFDK2YsTUFBUixDQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUJ4YSxNQUFyQjtFQUNBdkYsSUFBQUEsT0FBTyxDQUFDK2YsTUFBUixDQUFlLENBQWYsRUFBa0IsQ0FBbEIsRUFBcUJ2YSxNQUFyQjs7RUFFQSxTQUFJakcsQ0FBQyxHQUFDLENBQU4sRUFBU0EsQ0FBQyxHQUFDUyxPQUFPLENBQUNSLE1BQW5CLEVBQTJCRCxDQUFDLEVBQTVCLEVBQStCO0VBQzlCLFVBQUdTLE9BQU8sQ0FBQ1QsQ0FBRCxDQUFQLENBQVc4SixTQUFYLElBQXdCckosT0FBTyxDQUFDVCxDQUFELENBQVAsQ0FBV1AsSUFBWCxLQUFvQnVHLE1BQU0sQ0FBQ3ZHLElBQW5ELElBQTJEZ0IsT0FBTyxDQUFDVCxDQUFELENBQVAsQ0FBV1AsSUFBWCxLQUFvQndHLE1BQU0sQ0FBQ3hHLElBQXpGLEVBQThGO0VBQzdGLGVBQU9nQixPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXOEosU0FBbEI7RUFDQXJKLFFBQUFBLE9BQU8sQ0FBQ1QsQ0FBRCxDQUFQLENBQVdpSixTQUFYLEdBQXVCLElBQXZCO0VBQ0F4SSxRQUFBQSxPQUFPLENBQUNULENBQUQsQ0FBUCxDQUFXZ0csTUFBWCxHQUFvQkEsTUFBTSxDQUFDdkcsSUFBM0I7RUFDQWdCLFFBQUFBLE9BQU8sQ0FBQ1QsQ0FBRCxDQUFQLENBQVdpRyxNQUFYLEdBQW9CQSxNQUFNLENBQUN4RyxJQUEzQjtFQUNBO0VBQ0Q7RUFDRCxHQWRELE1BY087RUFDTixRQUFJcXFCLFdBQVcsR0FBR3BILGFBQUEsQ0FBNkJpSCxTQUE3QixFQUF3Q0MsU0FBUyxDQUFDMWYsSUFBVixDQUFlbEUsTUFBdkQsQ0FBbEI7RUFDQSxRQUFJK2pCLFdBQVcsR0FBR3JILGFBQUEsQ0FBNkJpSCxTQUE3QixFQUF3Q0MsU0FBUyxDQUFDMWYsSUFBVixDQUFlakUsTUFBdkQsQ0FBbEI7RUFDQSxRQUFJK2pCLFNBQVMsR0FBR3RILGNBQUEsQ0FBOEJqaUIsT0FBOUIsRUFBdUM4SixJQUF2QyxDQUFoQixDQUhNOztFQU1OLFFBQUkwZixHQUFHLEdBQUcsS0FBVjtFQUNBLFFBQUlDLEdBQUcsR0FBR04sU0FBUyxDQUFDMWYsSUFBVixDQUFlN0gsRUFBekI7O0VBQ0EsU0FBSXJDLENBQUMsR0FBQyxDQUFOLEVBQVNBLENBQUMsR0FBQ2dxQixTQUFTLENBQUMvcEIsTUFBckIsRUFBNkJELENBQUMsRUFBOUIsRUFBaUM7RUFDaEMsVUFBSW1xQixHQUFHLEdBQUd6SCxhQUFBLENBQTZCaUgsU0FBN0IsRUFBd0NLLFNBQVMsQ0FBQ2hxQixDQUFELENBQVQsQ0FBYVAsSUFBckQsRUFBMkR5SyxJQUEzRCxDQUFnRTdILEVBQTFFO0VBQ0EsVUFBRzhuQixHQUFHLEdBQUdGLEdBQU4sSUFBYUUsR0FBRyxHQUFHUCxTQUFTLENBQUMxZixJQUFWLENBQWU3SCxFQUFyQyxFQUNDNG5CLEdBQUcsR0FBR0UsR0FBTjtFQUNELFVBQUdBLEdBQUcsR0FBR0QsR0FBVCxFQUNDQSxHQUFHLEdBQUdDLEdBQU47RUFDRDs7RUFDRCxRQUFJaEIsT0FBTyxHQUFJZSxHQUFHLElBQUlOLFNBQVMsQ0FBQzFmLElBQVYsQ0FBZTdILEVBQXRCLElBQTZCd25CLEdBQUcsSUFBSUssR0FBUCxJQUFjRCxHQUFHLEdBQUcsS0FBaEU7RUFDQSxRQUFHeHJCLElBQUksQ0FBQ21OLEtBQVIsRUFDQ2hMLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWSxTQUFPcWUsR0FBUCxHQUFXLE9BQVgsR0FBbUJELEdBQW5CLEdBQXVCLE9BQXZCLEdBQStCTCxTQUFTLENBQUMxZixJQUFWLENBQWU3SCxFQUE5QyxHQUFpRCxXQUFqRCxHQUE2RDhtQixPQUF6RTtFQUNELFFBQUl6aUIsSUFBSjtFQUNBLFFBQUssQ0FBQ3lpQixPQUFELElBQVlZLFdBQVcsQ0FBQzdmLElBQVosQ0FBaUI3SCxFQUFqQixHQUFzQnluQixXQUFXLENBQUM1ZixJQUFaLENBQWlCN0gsRUFBcEQsSUFDRjhtQixPQUFPLElBQUlZLFdBQVcsQ0FBQzdmLElBQVosQ0FBaUI3SCxFQUFqQixHQUFzQnluQixXQUFXLENBQUM1ZixJQUFaLENBQWlCN0gsRUFEcEQsRUFFQ3FFLElBQUksR0FBR2djLFlBQUEsQ0FBNEJqaUIsT0FBNUIsRUFBcUM4SixJQUFJLENBQUN0RSxNQUExQyxDQUFQLENBRkQsS0FJQ1MsSUFBSSxHQUFHZ2MsWUFBQSxDQUE0QmppQixPQUE1QixFQUFxQzhKLElBQUksQ0FBQ3ZFLE1BQTFDLENBQVA7RUFFRCxRQUFJUSxNQUFNLEdBQUcvRixPQUFPLENBQUNpRyxJQUFELENBQXBCO0VBQ0FULElBQUFBLE1BQU0sR0FBR3FaLFVBQVUsQ0FBQzdlLE9BQUQsRUFBVStGLE1BQVYsRUFBa0IsR0FBbEIsRUFBdUIyaUIsT0FBdkIsQ0FBbkI7RUFDQW5qQixJQUFBQSxNQUFNLEdBQUdzWixVQUFVLENBQUM3ZSxPQUFELEVBQVUrRixNQUFWLEVBQWtCLEdBQWxCLEVBQXVCMmlCLE9BQXZCLENBQW5CO0VBRUEsUUFBSWlCLEtBQUssR0FBRzFILFlBQUEsQ0FBNEJqaUIsT0FBNUIsRUFBcUN3RixNQUFNLENBQUN4RyxJQUE1QyxDQUFaO0VBQ0EsUUFBSTRxQixLQUFLLEdBQUczSCxZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDdUYsTUFBTSxDQUFDdkcsSUFBNUMsQ0FBWjs7RUFDQSxRQUFHMnFCLEtBQUssR0FBR0MsS0FBWCxFQUFrQjtFQUFRO0VBQ3pCLFVBQUlDLEtBQUssR0FBRzdwQixPQUFPLENBQUMycEIsS0FBRCxDQUFuQjtFQUNBM3BCLE1BQUFBLE9BQU8sQ0FBQzJwQixLQUFELENBQVAsR0FBaUIzcEIsT0FBTyxDQUFDNHBCLEtBQUQsQ0FBeEI7RUFDQTVwQixNQUFBQSxPQUFPLENBQUM0cEIsS0FBRCxDQUFQLEdBQWlCQyxLQUFqQjtFQUNBOztFQUVELFFBQUlDLE9BQU8sR0FBRzdILGtCQUFBLENBQWtDamlCLE9BQWxDLEVBQTJDOEosSUFBM0MsQ0FBZDtFQUNBLFFBQUlpZ0IsR0FBRyxHQUFHWixTQUFTLENBQUMxZixJQUFWLENBQWU3SCxFQUF6Qjs7RUFDQSxTQUFJckMsQ0FBQyxHQUFDLENBQU4sRUFBU0EsQ0FBQyxHQUFDdXFCLE9BQU8sQ0FBQ3RxQixNQUFuQixFQUEyQkQsQ0FBQyxFQUE1QixFQUErQjtFQUM5QixVQUFJeXFCLEdBQUcsR0FBRy9ILGFBQUEsQ0FBNkJpSCxTQUE3QixFQUF3Q1ksT0FBTyxDQUFDdnFCLENBQUQsQ0FBUCxDQUFXUCxJQUFuRCxFQUF5RHlLLElBQXpELENBQThEN0gsRUFBeEU7RUFDQSxVQUFHNUQsSUFBSSxDQUFDbU4sS0FBUixFQUNDaEwsT0FBTyxDQUFDaUwsR0FBUixDQUFZLFlBQVU3TCxDQUFWLEdBQVksR0FBWixHQUFnQnVxQixPQUFPLENBQUN2cUIsQ0FBRCxDQUFQLENBQVdQLElBQTNCLEdBQWdDLEdBQWhDLElBQXFDK3FCLEdBQUcsR0FBR0MsR0FBTixJQUFhQSxHQUFHLEdBQUdSLEdBQXhELElBQTZELE9BQTdELEdBQXFFTyxHQUFyRSxHQUF5RSxPQUF6RSxHQUFpRkMsR0FBakYsR0FBcUYsT0FBckYsR0FBNkZSLEdBQXpHOztFQUNELFVBQUcsQ0FBQ2QsT0FBTyxJQUFJcUIsR0FBRyxHQUFHQyxHQUFsQixLQUEwQkEsR0FBRyxHQUFHUixHQUFuQyxFQUF1QztFQUN0QyxZQUFJUyxJQUFJLEdBQUdoSSxZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDOHBCLE9BQU8sQ0FBQ3ZxQixDQUFELENBQVAsQ0FBV1AsSUFBaEQsQ0FBWDtFQUNBZ0IsUUFBQUEsT0FBTyxDQUFDaXFCLElBQUQsQ0FBUCxDQUFjMWtCLE1BQWQsR0FBdUJBLE1BQU0sQ0FBQ3ZHLElBQTlCO0VBQ0FnQixRQUFBQSxPQUFPLENBQUNpcUIsSUFBRCxDQUFQLENBQWN6a0IsTUFBZCxHQUF1QkEsTUFBTSxDQUFDeEcsSUFBOUI7RUFDQTtFQUNEO0VBQ0Q7O0VBRUQsTUFBR29LLEtBQUssSUFBSSxDQUFaLEVBQWU7RUFDZDdELElBQUFBLE1BQU0sQ0FBQzhELFNBQVAsR0FBbUIsSUFBbkI7RUFDQTdELElBQUFBLE1BQU0sQ0FBQzZELFNBQVAsR0FBbUIsSUFBbkI7RUFDQSxHQUhELE1BR08sSUFBR0QsS0FBSyxHQUFHLENBQVgsRUFBYztFQUNwQjdELElBQUFBLE1BQU0sQ0FBQ2lELFNBQVAsR0FBbUIsSUFBbkI7RUFDQWhELElBQUFBLE1BQU0sQ0FBQ2dELFNBQVAsR0FBbUIsSUFBbkI7RUFDQTs7RUFDRCxNQUFJRixHQUFHLEdBQUcyWixZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDOEosSUFBSSxDQUFDOUssSUFBMUMsQ0FBVjtFQUNBZ0IsRUFBQUEsT0FBTyxDQUFDc0ksR0FBRCxDQUFQLENBQWEvQyxNQUFiLEdBQXNCQSxNQUFNLENBQUN2RyxJQUE3QjtFQUNBZ0IsRUFBQUEsT0FBTyxDQUFDc0ksR0FBRCxDQUFQLENBQWE5QyxNQUFiLEdBQXNCQSxNQUFNLENBQUN4RyxJQUE3QjtFQUNBLFNBQU9nQixPQUFPLENBQUNzSSxHQUFELENBQVAsQ0FBYUUsU0FBcEI7O0VBRUEsTUFBRyxpQkFBaUJzQixJQUFwQixFQUEwQjtFQUN6QixRQUFJb2dCLFFBQVEsR0FBR2xxQixPQUFPLENBQUNpaUIsWUFBQSxDQUE0QmppQixPQUE1QixFQUFxQ3FvQixRQUFyQyxDQUFELENBQXRCOztFQUNBLFFBQUcsZUFBZTZCLFFBQWxCLEVBQTRCO0VBQzNCQSxNQUFBQSxRQUFRLENBQUMza0IsTUFBVCxHQUFrQkEsTUFBTSxDQUFDdkcsSUFBekI7RUFDQWtyQixNQUFBQSxRQUFRLENBQUMxa0IsTUFBVCxHQUFrQkEsTUFBTSxDQUFDeEcsSUFBekI7RUFDQTtFQUNEO0VBQ0Q7O0VBR00sU0FBUzZnQixVQUFULENBQW9CN2hCLElBQXBCLEVBQTBCZ0MsT0FBMUIsRUFBbUNoQixJQUFuQyxFQUF5QztFQUMvQyxNQUFJNEYsSUFBSSxHQUFHeWMsS0FBSyxDQUFDcmpCLElBQUksQ0FBQ3dRLFNBQU4sQ0FBaEI7RUFDQSxNQUFJMGEsU0FBUyxHQUFHakgsT0FBQSxDQUF1QnJkLElBQXZCLENBQWhCO0VBQ0EsTUFBSXVrQixTQUFTLEdBQUdsSCxhQUFBLENBQTZCaUgsU0FBN0IsRUFBd0NscUIsSUFBeEMsQ0FBaEI7RUFFQSxNQUFJc3BCLE9BQU8sR0FBR3pKLFVBQVUsQ0FBQzdlLE9BQUQsRUFBVW1wQixTQUFTLENBQUMxZixJQUFwQixFQUEwQjBmLFNBQVMsQ0FBQzFmLElBQVYsQ0FBZVosR0FBZixLQUF1QixHQUF2QixHQUE2QixHQUE3QixHQUFtQyxHQUE3RCxFQUFrRXNnQixTQUFTLENBQUMxZixJQUFWLENBQWVaLEdBQWYsS0FBdUIsR0FBekYsQ0FBeEI7RUFDQXlmLEVBQUFBLE9BQU8sQ0FBQzlmLFNBQVIsR0FBb0IsSUFBcEI7RUFFQSxNQUFJcEQsS0FBSyxHQUFHO0VBQUMsWUFBUTZjLE1BQUEsQ0FBc0IsQ0FBdEIsQ0FBVDtFQUFtQyxXQUFPO0VBQTFDLEdBQVo7RUFDQTdjLEVBQUFBLEtBQUssQ0FBQ0csTUFBTixHQUFnQjRqQixTQUFTLENBQUMxZixJQUFWLENBQWVaLEdBQWYsS0FBdUIsR0FBdkIsR0FBNkJzZ0IsU0FBUyxDQUFDMWYsSUFBVixDQUFlekssSUFBNUMsR0FBbURzcEIsT0FBTyxDQUFDdHBCLElBQTNFO0VBQ0FvRyxFQUFBQSxLQUFLLENBQUNJLE1BQU4sR0FBZ0IyakIsU0FBUyxDQUFDMWYsSUFBVixDQUFlWixHQUFmLEtBQXVCLEdBQXZCLEdBQTZCeWYsT0FBTyxDQUFDdHBCLElBQXJDLEdBQTRDbXFCLFNBQVMsQ0FBQzFmLElBQVYsQ0FBZXpLLElBQTNFO0VBRUEsTUFBSXNKLEdBQUcsR0FBRzJaLFlBQUEsQ0FBNEJqaUIsT0FBNUIsRUFBcUNtcEIsU0FBUyxDQUFDMWYsSUFBVixDQUFlekssSUFBcEQsSUFBMEQsQ0FBcEU7RUFDQWdCLEVBQUFBLE9BQU8sQ0FBQytmLE1BQVIsQ0FBZXpYLEdBQWYsRUFBb0IsQ0FBcEIsRUFBdUJsRCxLQUF2QjtFQUNBOztFQUdELFNBQVMra0IsY0FBVCxDQUF3QnZsQixJQUF4QixFQUE4QmtGLElBQTlCLEVBQW9Dc2dCLFFBQXBDLEVBQThDO0VBQzdDLE1BQUlDLE1BQU0sR0FBR3BJLGVBQUEsQ0FBK0JBLE9BQUEsQ0FBdUJyZCxJQUF2QixDQUEvQixFQUE2RGtGLElBQUksQ0FBQ1YsS0FBbEUsRUFBeUVnaEIsUUFBekUsQ0FBYjtFQUNBLE1BQUlFLFFBQUosRUFBY0MsUUFBZDs7RUFDQSxPQUFJLElBQUlockIsQ0FBQyxHQUFDLENBQVYsRUFBYUEsQ0FBQyxHQUFDOHFCLE1BQU0sQ0FBQzdxQixNQUF0QixFQUE4QkQsQ0FBQyxFQUEvQixFQUFtQztFQUNsQyxRQUFHOHFCLE1BQU0sQ0FBQzlxQixDQUFELENBQU4sQ0FBVXdCLENBQVYsR0FBYytJLElBQUksQ0FBQy9JLENBQXRCLEVBQ0N1cEIsUUFBUSxHQUFHRCxNQUFNLENBQUM5cUIsQ0FBRCxDQUFqQjtFQUNELFFBQUcsQ0FBQ2dyQixRQUFELElBQWFGLE1BQU0sQ0FBQzlxQixDQUFELENBQU4sQ0FBVXdCLENBQVYsR0FBYytJLElBQUksQ0FBQy9JLENBQW5DLEVBQ0N3cEIsUUFBUSxHQUFHRixNQUFNLENBQUM5cUIsQ0FBRCxDQUFqQjtFQUNEOztFQUNELFNBQU8sQ0FBQytxQixRQUFELEVBQVdDLFFBQVgsQ0FBUDtFQUNBOzs7RUFHTSxTQUFTcGQsbUJBQVQsQ0FBNkJuTixPQUE3QixFQUFzQzhKLElBQXRDLEVBQTRDOUwsSUFBNUMsRUFBa0RrUCxNQUFsRCxFQUEwRDtFQUNoRSxNQUFJdEksSUFBSSxHQUFHeWMsS0FBSyxDQUFDcmpCLElBQUksQ0FBQ3dRLFNBQU4sQ0FBaEI7RUFDQSxNQUFJakYsTUFBTSxHQUFHMFksT0FBQSxDQUF1QnJkLElBQXZCLENBQWI7RUFDQSxNQUFJNGxCLE9BQU8sR0FBRyxFQUFkO0VBQ0EsTUFBSWpyQixDQUFKLEVBQU84RixDQUFQLENBSmdFOztFQU9oRSxNQUFHeUUsSUFBSSxDQUFDbEksRUFBTCxLQUFZMUQsU0FBZixFQUEwQjtFQUN6QixRQUFJdXNCLE1BQU0sR0FBR3hJLGFBQUEsQ0FBNkIxWSxNQUE3QixFQUFxQ08sSUFBSSxDQUFDOUssSUFBMUMsQ0FBYjtFQUNBLFFBQUd5ckIsTUFBTSxLQUFLdnNCLFNBQWQsRUFDQzRMLElBQUksR0FBRzJnQixNQUFNLENBQUNoaEIsSUFBZDtFQUNEOztFQUVELE1BQUdLLElBQUksQ0FBQ3RELFdBQVIsRUFBcUI7RUFDcEIsU0FBSWpILENBQUMsR0FBQyxDQUFOLEVBQVNBLENBQUMsR0FBQ3VLLElBQUksQ0FBQ3RELFdBQUwsQ0FBaUJoSCxNQUE1QixFQUFvQ0QsQ0FBQyxFQUFyQyxFQUF3QztFQUN2QyxVQUFJd0csTUFBTSxHQUFHK0QsSUFBSSxDQUFDdEQsV0FBTCxDQUFpQmpILENBQWpCLENBQWI7RUFDQSxVQUFJbXJCLEVBQUUsR0FBRyxDQUFDekksYUFBQSxDQUE2QmppQixPQUE3QixFQUFzQytGLE1BQU0sQ0FBQ1IsTUFBUCxDQUFjdkcsSUFBcEQsQ0FBRCxFQUNMaWpCLGFBQUEsQ0FBNkJqaUIsT0FBN0IsRUFBc0MrRixNQUFNLENBQUNQLE1BQVAsQ0FBY3hHLElBQXBELENBREssQ0FBVCxDQUZ1Qzs7RUFLdkMsV0FBSXFHLENBQUMsR0FBQyxDQUFOLEVBQVNBLENBQUMsR0FBQ3FsQixFQUFFLENBQUNsckIsTUFBZCxFQUFzQjZGLENBQUMsRUFBdkIsRUFBMkI7RUFDMUIsWUFBR3FsQixFQUFFLENBQUNybEIsQ0FBRCxDQUFGLENBQU1yRyxJQUFOLEtBQWU4SyxJQUFJLENBQUM5SyxJQUFwQixJQUE0QjByQixFQUFFLENBQUNybEIsQ0FBRCxDQUFGLENBQU1tRCxTQUFOLEtBQW9CdEssU0FBaEQsSUFBNkR3c0IsRUFBRSxDQUFDcmxCLENBQUQsQ0FBRixDQUFNZ0UsU0FBdEUsRUFBaUY7RUFDaEZySixVQUFBQSxPQUFPLENBQUMrZixNQUFSLENBQWVrQyxZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDMHFCLEVBQUUsQ0FBQ3JsQixDQUFELENBQUYsQ0FBTXJHLElBQTNDLENBQWYsRUFBaUUsQ0FBakU7RUFDQXdyQixVQUFBQSxPQUFPLENBQUM3cUIsSUFBUixDQUFhK3FCLEVBQUUsQ0FBQ3JsQixDQUFELENBQWY7RUFDQTtFQUNEOztFQUVELFVBQUlQLFFBQVEsR0FBR2lCLE1BQU0sQ0FBQ2pCLFFBQXRCO0VBQ0EsVUFBSTZsQixjQUFjLEdBQUd6bkIsQ0FBQyxDQUFDd0YsR0FBRixDQUFNNUQsUUFBTixFQUFnQixVQUFTUSxDQUFULEVBQVlzRCxFQUFaLEVBQWU7RUFBQyxlQUFPdEQsQ0FBQyxDQUFDdEcsSUFBVDtFQUFlLE9BQS9DLENBQXJCOztFQUNBLFdBQUlxRyxDQUFDLEdBQUMsQ0FBTixFQUFTQSxDQUFDLEdBQUNQLFFBQVEsQ0FBQ3RGLE1BQXBCLEVBQTRCNkYsQ0FBQyxFQUE3QixFQUFpQztFQUNoQyxZQUFJRCxLQUFLLEdBQUc2YyxhQUFBLENBQTZCamlCLE9BQTdCLEVBQXNDOEUsUUFBUSxDQUFDTyxDQUFELENBQVIsQ0FBWXJHLElBQWxELENBQVo7O0VBQ0EsWUFBR29HLEtBQUgsRUFBUztFQUNSQSxVQUFBQSxLQUFLLENBQUNvRCxTQUFOLEdBQWtCLElBQWxCO0VBQ0EsY0FBSVYsSUFBSSxHQUFHbWEsWUFBQSxDQUE0QmppQixPQUE1QixFQUFxQ29GLEtBQXJDLENBQVg7RUFDQSxjQUFJVSxHQUFHLFNBQVA7RUFDQSxjQUFHZ0MsSUFBSSxDQUFDdEksTUFBTCxHQUFjLENBQWpCLEVBQ0NzRyxHQUFHLEdBQUdtYyxhQUFBLENBQTZCamlCLE9BQTdCLEVBQXNDOEgsSUFBSSxDQUFDLENBQUQsQ0FBMUMsQ0FBTjs7RUFDRCxjQUFHaEMsR0FBRyxJQUFJQSxHQUFHLENBQUNQLE1BQUosS0FBZUgsS0FBSyxDQUFDRyxNQUEvQixFQUF1QztFQUN0Q0gsWUFBQUEsS0FBSyxDQUFDRyxNQUFOLEdBQWVPLEdBQUcsQ0FBQ1AsTUFBbkI7RUFDQUgsWUFBQUEsS0FBSyxDQUFDSSxNQUFOLEdBQWVNLEdBQUcsQ0FBQ04sTUFBbkI7RUFDQSxXQUhELE1BR08sSUFBR00sR0FBSCxFQUFRO0VBQ2QsZ0JBQUk4a0IsVUFBVSxHQUFJM0ksYUFBQSxDQUE2QjFZLE1BQTdCLEVBQXFDbkUsS0FBSyxDQUFDcEcsSUFBM0MsQ0FBbEI7RUFDQSxnQkFBSTZyQixHQUFHLEdBQUdWLGNBQWMsQ0FBQ3ZsQixJQUFELEVBQU9nbUIsVUFBUCxFQUFtQkQsY0FBbkIsQ0FBeEI7RUFDQXZsQixZQUFBQSxLQUFLLENBQUNHLE1BQU4sR0FBZXNsQixHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVNBLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT3BoQixJQUFQLENBQVlsRSxNQUFyQixHQUErQnNsQixHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVNBLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT3BoQixJQUFQLENBQVlsRSxNQUFyQixHQUE4QixJQUE1RTtFQUNBSCxZQUFBQSxLQUFLLENBQUNJLE1BQU4sR0FBZXFsQixHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVNBLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT3BoQixJQUFQLENBQVlqRSxNQUFyQixHQUErQnFsQixHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVNBLEdBQUcsQ0FBQyxDQUFELENBQUgsQ0FBT3BoQixJQUFQLENBQVlqRSxNQUFyQixHQUE4QixJQUE1RTtFQUNBLFdBTE0sTUFLQTtFQUNOeEYsWUFBQUEsT0FBTyxDQUFDK2YsTUFBUixDQUFla0MsWUFBQSxDQUE0QmppQixPQUE1QixFQUFxQ29GLEtBQUssQ0FBQ3BHLElBQTNDLENBQWYsRUFBaUUsQ0FBakU7RUFDQTtFQUNEO0VBQ0Q7RUFDRDtFQUNELEdBckNELE1BcUNPO0VBQ05nQixJQUFBQSxPQUFPLENBQUMrZixNQUFSLENBQWVrQyxZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDOEosSUFBSSxDQUFDOUssSUFBMUMsQ0FBZixFQUFnRSxDQUFoRTtFQUNBLEdBcEQrRDs7O0VBdURoRW1CLEVBQUFBLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWW9mLE9BQVo7O0VBQ0EsT0FBSWpyQixDQUFDLEdBQUMsQ0FBTixFQUFTQSxDQUFDLEdBQUNpckIsT0FBTyxDQUFDaHJCLE1BQW5CLEVBQTJCRCxDQUFDLEVBQTVCLEVBQWdDO0VBQy9CLFFBQUl1ckIsR0FBRyxHQUFHTixPQUFPLENBQUNqckIsQ0FBRCxDQUFqQjtFQUNBLFFBQUl5SixJQUFJLEdBQUdpWixjQUFBLENBQThCamlCLE9BQTlCLEVBQXVDOHFCLEdBQXZDLENBQVg7RUFDQTNxQixJQUFBQSxPQUFPLENBQUNpTCxHQUFSLENBQVksS0FBWixFQUFtQjBmLEdBQUcsQ0FBQzlyQixJQUF2QixFQUE2QmdLLElBQTdCOztFQUNBLFFBQUdBLElBQUksQ0FBQ3hKLE1BQUwsR0FBYyxDQUFqQixFQUFvQjtFQUNuQlcsTUFBQUEsT0FBTyxDQUFDaUwsR0FBUixDQUFZLFVBQVosRUFBd0IwZixHQUFHLENBQUM5ckIsSUFBNUIsRUFBa0NnSyxJQUFsQztFQUNBLFVBQUkraEIsU0FBUyxHQUFJOUksYUFBQSxDQUE2QjFZLE1BQTdCLEVBQXFDdWhCLEdBQUcsQ0FBQzlyQixJQUF6QyxDQUFqQjtFQUNBLFVBQUk2SyxTQUFTLEdBQUdraEIsU0FBUyxDQUFDbGhCLFNBQVYsRUFBaEI7O0VBQ0EsV0FBSXhFLENBQUMsR0FBQyxDQUFOLEVBQVNBLENBQUMsR0FBQ3dFLFNBQVMsQ0FBQ3JLLE1BQXJCLEVBQTZCNkYsQ0FBQyxFQUE5QixFQUFrQztFQUNqQ2xGLFFBQUFBLE9BQU8sQ0FBQ2lMLEdBQVIsQ0FBWXZCLFNBQVMsQ0FBQ3RLLENBQUQsQ0FBckI7O0VBQ0EsWUFBR3NLLFNBQVMsQ0FBQ3hFLENBQUQsQ0FBVCxDQUFhb0UsSUFBYixDQUFrQmxFLE1BQXJCLEVBQTRCO0VBQzNCcEYsVUFBQUEsT0FBTyxDQUFDaUwsR0FBUixDQUFZLFNBQVosRUFBdUJ2QixTQUFTLENBQUN4RSxDQUFELENBQVQsQ0FBYW9FLElBQWIsQ0FBa0JsRSxNQUF6QyxFQUFpRHNFLFNBQVMsQ0FBQ3hFLENBQUQsQ0FBVCxDQUFhb0UsSUFBYixDQUFrQmpFLE1BQW5FO0VBQ0F4RixVQUFBQSxPQUFPLENBQUMrZixNQUFSLENBQWVrQyxZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDNkosU0FBUyxDQUFDeEUsQ0FBRCxDQUFULENBQWFvRSxJQUFiLENBQWtCbEUsTUFBbEIsQ0FBeUJ2RyxJQUE5RCxDQUFmLEVBQW9GLENBQXBGO0VBQ0FnQixVQUFBQSxPQUFPLENBQUMrZixNQUFSLENBQWVrQyxZQUFBLENBQTRCamlCLE9BQTVCLEVBQXFDNkosU0FBUyxDQUFDeEUsQ0FBRCxDQUFULENBQWFvRSxJQUFiLENBQWtCakUsTUFBbEIsQ0FBeUJ4RyxJQUE5RCxDQUFmLEVBQW9GLENBQXBGO0VBQ0E7RUFDRDtFQUNEO0VBQ0QsR0F6RStEOzs7RUEyRWhFZ3FCLEVBQUFBLFVBQVUsQ0FBQ2hwQixPQUFELENBQVY7RUFFQSxNQUFJbW5CLEVBQUo7O0VBQ0EsTUFBSTtFQUNIO0VBQ0EsUUFBSTZELE9BQU8sR0FBRzluQixDQUFDLENBQUN3SyxNQUFGLENBQVMsRUFBVCxFQUFhMVAsSUFBYixDQUFkO0VBQ0FndEIsSUFBQUEsT0FBTyxDQUFDaHJCLE9BQVIsR0FBa0JpaUIsWUFBQSxDQUE0QmppQixPQUE1QixDQUFsQjtFQUNBbVosSUFBQUEsaUJBQWlCLENBQUM2UixPQUFELENBQWpCLENBSkc7O0VBTUg3RCxJQUFBQSxFQUFFLEdBQUdsRixXQUFBLENBQTJCamlCLE9BQTNCLENBQUw7RUFDQSxHQVBELENBT0UsT0FBTW9SLEdBQU4sRUFBVztFQUNaNlEsSUFBQUEsUUFBQSxDQUF3QixTQUF4QixFQUFtQyxpREFBbkM7RUFDQSxVQUFNN1EsR0FBTjtFQUNBOztFQUNELE1BQUcrVixFQUFFLENBQUMzbkIsTUFBSCxHQUFZLENBQWYsRUFBa0I7RUFDakI7RUFDQSxRQUFHeWlCLFdBQUEsQ0FBMkJqa0IsSUFBSSxDQUFDZ0MsT0FBaEMsRUFBeUNSLE1BQXpDLEtBQW9ELENBQXZELEVBQTBEO0VBQ3pEVyxNQUFBQSxPQUFPLENBQUN1VixLQUFSLENBQWMsc0NBQWQsRUFBc0R5UixFQUF0RDtFQUNBbEYsTUFBQUEsUUFBQSxDQUF3QixTQUF4QixFQUFtQyxrREFBbkMsRUFBdUYvVSxNQUF2RixFQUErRmxQLElBQS9GLEVBQXFHZ0MsT0FBckc7RUFDQTtFQUNBO0VBQ0Q7O0VBRUQsTUFBR2tOLE1BQUgsRUFBVztFQUNWQSxJQUFBQSxNQUFNLENBQUNsUCxJQUFELEVBQU9nQyxPQUFQLENBQU47RUFDQTs7RUFDRCxTQUFPQSxPQUFQO0VBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
