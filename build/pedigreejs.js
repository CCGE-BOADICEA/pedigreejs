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

    d3.selectAll(".addchild, .addpartner, .addparents, .delete, .settings").on("click", function (event) {
      event.stopPropagation();
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
    }).on("mouseover", function (event, d) {
      event.stopPropagation();
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
    }).on("mouseout", function (event, d) {
      if (dragging) return;
      d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 0);
      if (highlight.indexOf(d) == -1) d3.select(this).select('rect').style("opacity", 0);
      d3.select(this).selectAll('.indi_details').style("opacity", 1); // hide popup if it looks like the mouse is moving north

      var xcoord = d3.pointer(event)[0];
      var ycoord = d3.pointer(event)[1];
      if (ycoord < 0.8 * opts.symbol_size) d3.selectAll('.popup_selection').style("opacity", 0);

      if (!dragging) {
        // hide popup if it looks like the mouse is moving north, south or west
        if (Math.abs(ycoord) > 0.25 * opts.symbol_size || Math.abs(ycoord) < -0.25 * opts.symbol_size || xcoord < 0.2 * opts.symbol_size) {
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

    function dragstart() {
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

    function drag(event, _d) {
      event.sourceEvent.stopPropagation();
      var dx = event.dx;
      var dy = event.dy;
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

    function zoomFn(event) {
      var t = event.transform;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVkaWdyZWVqcy5qcyIsInNvdXJjZXMiOlsiLi4vZXMvcGVkY2FjaGUuanMiLCIuLi9lcy9wZWRpZ3JlZV91dGlscy5qcyIsIi4uL2VzL3BidXR0b25zLmpzIiwiLi4vZXMvaW8uanMiLCIuLi9lcy9wZWRpZ3JlZV9mb3JtLmpzIiwiLi4vZXMvd2lkZ2V0cy5qcyIsIi4uL2VzL3BlZGlncmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vc3RvcmUgYSBoaXN0b3J5IG9mIHBlZGlncmVlXG5cbmxldCBtYXhfbGltaXQgPSAyNTtcbmxldCBkaWN0X2NhY2hlID0ge307XG5cbi8vIHRlc3QgaWYgYnJvd3NlciBzdG9yYWdlIGlzIHN1cHBvcnRlZFxuZnVuY3Rpb24gaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSB7XG5cdHRyeSB7XG5cdFx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnYXJyYXknKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0aWYob3B0cy5zdG9yZV90eXBlICE9PSAnbG9jYWwnICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gJ3Nlc3Npb24nICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0bGV0IG1vZCA9ICd0ZXN0Jztcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShtb2QsIG1vZCk7XG5cdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obW9kKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldF9wcmVmaXgob3B0cykge1xuXHRyZXR1cm4gXCJQRURJR1JFRV9cIitvcHRzLmJ0bl90YXJnZXQrXCJfXCI7XG59XG5cbi8vIHVzZSBkaWN0X2NhY2hlIHRvIHN0b3JlIGNhY2hlIGFzIGFuIGFycmF5XG5mdW5jdGlvbiBnZXRfYXJyKG9wdHMpIHtcblx0cmV0dXJuIGRpY3RfY2FjaGVbZ2V0X3ByZWZpeChvcHRzKV07XG59XG5cbmZ1bmN0aW9uIGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGl0ZW0pIHtcblx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnbG9jYWwnKVxuXHRcdHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKTtcblx0ZWxzZVxuXHRcdHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGl0ZW0pO1xufVxuXG5mdW5jdGlvbiBzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBuYW1lLCBpdGVtKSB7XG5cdGlmKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJylcblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLnNldEl0ZW0obmFtZSwgaXRlbSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBpdGVtKTtcbn1cblxuLy8gY2xlYXIgYWxsIHN0b3JhZ2UgaXRlbXNcbmZ1bmN0aW9uIGNsZWFyX2Jyb3dzZXJfc3RvcmUob3B0cykge1xuXHRpZihvcHRzLnN0b3JlX3R5cGUgPT09ICdsb2NhbCcpXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIHNlc3Npb25TdG9yYWdlLmNsZWFyKCk7XG59XG5cbi8vIHJlbW92ZSBhbGwgc3RvcmFnZSBpdGVtcyB3aXRoIGtleXMgdGhhdCBoYXZlIHRoZSBwZWRpZ3JlZSBoaXN0b3J5IHByZWZpeFxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyX3BlZGlncmVlX2RhdGEob3B0cykge1xuXHRsZXQgcHJlZml4ID0gZ2V0X3ByZWZpeChvcHRzKTtcblx0bGV0IHN0b3JlID0gKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJyA/IGxvY2FsU3RvcmFnZSA6IHNlc3Npb25TdG9yYWdlKTtcblx0bGV0IGl0ZW1zID0gW107XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBzdG9yZS5sZW5ndGg7IGkrKyl7XG5cdFx0aWYoc3RvcmUua2V5KGkpLmluZGV4T2YocHJlZml4KSA9PSAwKVxuXHRcdFx0aXRlbXMucHVzaChzdG9yZS5rZXkoaSkpO1xuXHR9XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKylcblx0XHRzdG9yZS5yZW1vdmVJdGVtKGl0ZW1zW2ldKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9jb3VudChvcHRzKSB7XG5cdGxldCBjb3VudDtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y291bnQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydDT1VOVCcpO1xuXHRlbHNlXG5cdFx0Y291bnQgPSBkaWN0X2NhY2hlW2dldF9wcmVmaXgob3B0cykrJ0NPVU5UJ107XG5cdGlmKGNvdW50ICE9PSBudWxsICYmIGNvdW50ICE9PSB1bmRlZmluZWQpXG5cdFx0cmV0dXJuIGNvdW50O1xuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gc2V0X2NvdW50KG9wdHMsIGNvdW50KSB7XG5cdGlmIChoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHNldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ0NPVU5UJywgY291bnQpO1xuXHRlbHNlXG5cdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpKydDT1VOVCddID0gY291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0X2NhY2hlKG9wdHMpIHtcblx0aWYoIW9wdHMuZGF0YXNldClcblx0XHRyZXR1cm47XG5cdGxldCBjb3VudCA9IGdldF9jb3VudChvcHRzKTtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpIHsgICAvLyBsb2NhbCBzdG9yYWdlXG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKStjb3VudCwgSlNPTi5zdHJpbmdpZnkob3B0cy5kYXRhc2V0KSk7XG5cdH0gZWxzZSB7ICAgLy8gVE9ETyA6OiBhcnJheSBjYWNoZVxuXHRcdGNvbnNvbGUud2FybignTG9jYWwgc3RvcmFnZSBub3QgZm91bmQvc3VwcG9ydGVkIGZvciB0aGlzIGJyb3dzZXIhJywgb3B0cy5zdG9yZV90eXBlKTtcblx0XHRtYXhfbGltaXQgPSA1MDA7XG5cdFx0aWYoZ2V0X2FycihvcHRzKSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpXSA9IFtdO1xuXHRcdGdldF9hcnIob3B0cykucHVzaChKU09OLnN0cmluZ2lmeShvcHRzLmRhdGFzZXQpKTtcblx0fVxuXHRpZihjb3VudCA8IG1heF9saW1pdClcblx0XHRjb3VudCsrO1xuXHRlbHNlXG5cdFx0Y291bnQgPSAwO1xuXHRzZXRfY291bnQob3B0cywgY291bnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbnN0b3JlKG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRpZihnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKSAhPT0gbnVsbClcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAoZ2V0X2FycihvcHRzKSAmJiBnZXRfYXJyKG9wdHMpLmxlbmd0aCA+IDAgPyBnZXRfYXJyKG9wdHMpLmxlbmd0aCA6IC0xKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50KG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBnZXRfY291bnQob3B0cyktMTtcblx0aWYoY3VycmVudCA9PSAtMSlcblx0XHRjdXJyZW50ID0gbWF4X2xpbWl0O1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrY3VycmVudCkpO1xuXHRlbHNlIGlmKGdldF9hcnIob3B0cykpXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtjdXJyZW50XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0KG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRsZXQgaXQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKTtcblx0XHRcdGlmKGl0ICE9PSBudWxsKSB7XG5cdFx0XHRcdHNldF9jb3VudChvcHRzLCBpKTtcblx0XHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoaXQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZXQgYXJyID0gZ2V0X2FycihvcHRzKTtcblx0XHRpZihhcnIpXG5cdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShhcnIoYXJyLmxlbmd0aC0xKSk7XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXZpb3VzKG9wdHMsIHByZXZpb3VzKSB7XG5cdGlmKHByZXZpb3VzID09PSB1bmRlZmluZWQpXG5cdFx0cHJldmlvdXMgPSBnZXRfY291bnQob3B0cykgLSAyO1xuXG5cdGlmKHByZXZpb3VzIDwgMCkge1xuXHRcdGxldCBuc3RvcmUgPSBuc3RvcmUob3B0cyk7XG5cdFx0aWYobnN0b3JlIDwgbWF4X2xpbWl0KVxuXHRcdFx0cHJldmlvdXMgPSBuc3RvcmUgLSAxO1xuXHRcdGVsc2Vcblx0XHRcdHByZXZpb3VzID0gbWF4X2xpbWl0IC0gMTtcblx0fVxuXHRzZXRfY291bnQob3B0cywgcHJldmlvdXMgKyAxKTtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSlcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpK3ByZXZpb3VzKSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYXJyKG9wdHMpW3ByZXZpb3VzXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0KG9wdHMsIG5leHQpIHtcblx0aWYobmV4dCA9PT0gdW5kZWZpbmVkKVxuXHRcdG5leHQgPSBnZXRfY291bnQob3B0cyk7XG5cdGlmKG5leHQgPj0gbWF4X2xpbWl0KVxuXHRcdG5leHQgPSAwO1xuXG5cdHNldF9jb3VudChvcHRzLCBwYXJzZUludChuZXh0KSArIDEpO1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrbmV4dCkpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtuZXh0XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcihvcHRzKSB7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y2xlYXJfYnJvd3Nlcl9zdG9yZShvcHRzKTtcblx0ZGljdF9jYWNoZSA9IHt9O1xufVxuXG4vLyB6b29tIC0gc3RvcmUgdHJhbnNsYXRpb24gY29vcmRzXG5leHBvcnQgZnVuY3Rpb24gc2V0cG9zaXRpb24ob3B0cywgeCwgeSwgem9vbSkge1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKSB7XG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1gnLCB4KTtcblx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWScsIHkpO1xuXHRcdGlmKHpvb20pXG5cdFx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWk9PTScsIHpvb20pO1xuXHR9IGVsc2Uge1xuXHRcdC8vVE9ET1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRwb3NpdGlvbihvcHRzKSB7XG5cdGlmKCFoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpIHx8XG5cdFx0KGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldF9wcmVmaXgob3B0cykrJ19YJykgPT09IG51bGwgJiZcblx0XHQgc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShnZXRfcHJlZml4KG9wdHMpKydfWCcpID09PSBudWxsKSlcblx0XHRyZXR1cm4gW251bGwsIG51bGxdO1xuXHRsZXQgcG9zID0gWyBwYXJzZUludChnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWCcpKSxcblx0XHRcdFx0cGFyc2VJbnQoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1knKSkgXTtcblx0aWYoZ2V0X2Jyb3dzZXJfc3RvcmUoZ2V0X3ByZWZpeChvcHRzKSsnX1pPT00nKSAhPT0gbnVsbClcblx0XHRwb3MucHVzaChwYXJzZUZsb2F0KGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19aT09NJykpKTtcblx0cmV0dXJuIHBvcztcbn1cbiIsIi8vIFBlZGlncmVlIFRyZWUgVXRpbHNcblxuaW1wb3J0IHtzeW5jVHdpbnMsIHJlYnVpbGQsIGFkZGNoaWxkLCBkZWxldGVfbm9kZV9kYXRhc2V0fSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCAqIGFzIHBlZGNhY2hlIGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJRSgpIHtcblx0IGxldCB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG5cdCAvKiBNU0lFIHVzZWQgdG8gZGV0ZWN0IG9sZCBicm93c2VycyBhbmQgVHJpZGVudCB1c2VkIHRvIG5ld2VyIG9uZXMqL1xuXHQgcmV0dXJuIHVhLmluZGV4T2YoXCJNU0lFIFwiKSA+IC0xIHx8IHVhLmluZGV4T2YoXCJUcmlkZW50L1wiKSA+IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFZGdlKCkge1xuXHQgcmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0VkZ2UvZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3B5X2RhdGFzZXQoZGF0YXNldCkge1xuXHRpZihkYXRhc2V0WzBdLmlkKSB7IC8vIHNvcnQgYnkgaWRcblx0XHRkYXRhc2V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gKCFhLmlkIHx8ICFiLmlkID8gMDogKGEuaWQgPiBiLmlkKSA/IDEgOiAoKGIuaWQgPiBhLmlkKSA/IC0xIDogMCkpO30pO1xuXHR9XG5cblx0bGV0IGRpc2FsbG93ZWQgPSBbXCJpZFwiLCBcInBhcmVudF9ub2RlXCJdO1xuXHRsZXQgbmV3ZGF0YXNldCA9IFtdO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKXtcblx0XHRsZXQgb2JqID0ge307XG5cdFx0Zm9yKGxldCBrZXkgaW4gZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoZGlzYWxsb3dlZC5pbmRleE9mKGtleSkgPT0gLTEpXG5cdFx0XHRcdG9ialtrZXldID0gZGF0YXNldFtpXVtrZXldO1xuXHRcdH1cblx0XHRuZXdkYXRhc2V0LnB1c2gob2JqKTtcblx0fVxuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLyoqXG4gKiAgR2V0IGZvcm1hdHRlZCB0aW1lIG9yIGRhdGEgJiB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGb3JtYXR0ZWREYXRlKHRpbWUpe1xuXHRsZXQgZCA9IG5ldyBEYXRlKCk7XG5cdGlmKHRpbWUpXG5cdFx0cmV0dXJuICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIjpcIiArICgnMCcgKyBkLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArIFwiLVwiICsgKCcwJyArIChkLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpICsgXCItXCIgKyAoJzAnICsgZC5nZXREYXRlKCkpLnNsaWNlKC0yKSArIFwiIFwiICsgKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gfVxuXG4vKipcbiAqIFNob3cgbWVzc2FnZSBvciBjb25maXJtYXRpb24gZGlhbG9nLlxuICogQHBhcmFtIHRpdGxlXHQgLSBkaWFsb2cgd2luZG93IHRpdGxlXG4gKiBAcGFyYW0gbXNnXHQgICAtIG1lc3NhZ2UgdG8gZGlhc3BsYXlcbiAqIEBwYXJhbSBvbkNvbmZpcm0gLSBmdW5jdGlvbiB0byBjYWxsIGluIGEgY29uZmlybWF0aW9uIGRpYWxvZ1xuICogQHBhcmFtIG9wdHNcdCAgLSBwZWRpZ3JlZWpzIG9wdGlvbnNcbiAqIEBwYXJhbSBkYXRhc2V0XHQtIHBlZGlncmVlIGRhdGFzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VzKHRpdGxlLCBtc2csIG9uQ29uZmlybSwgb3B0cywgZGF0YXNldCkge1xuXHRpZihvbkNvbmZpcm0pIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHRcdG1vZGFsOiB0cnVlLFxuXHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdHdpZHRoOiAzNTAsXG5cdFx0XHRcdGJ1dHRvbnM6IHtcblx0XHRcdFx0XHRcIlllc1wiOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHRcdG9uQ29uZmlybShvcHRzLCBkYXRhc2V0KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwiTm9cIjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHR3aWR0aDogMzUwLFxuXHRcdFx0YnV0dG9uczogW3tcblx0XHRcdFx0dGV4dDogXCJPS1wiLFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7ICQoIHRoaXMgKS5kaWFsb2coIFwiY2xvc2VcIiApO31cblx0XHRcdH1dXG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhZ2UgYW5kIHlvYiBpcyBjb25zaXN0ZW50IHdpdGggY3VycmVudCB5ZWFyLiBUaGUgc3VtIG9mIGFnZSBhbmRcbiAqIHlvYiBzaG91bGQgbm90IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBjdXJyZW50IHllYXIuIElmIGFsaXZlIHRoZVxuICogYWJzb2x1dGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgYWdlIGFuZCB5ZWFyIG9mIGJpcnRoIGFuZCB0aGVcbiAqIGN1cnJlbnQgeWVhciBzaG91bGQgYmUgPD0gMS5cbiAqIEBwYXJhbSBhZ2VcdC0gYWdlIGluIHllYXJzLlxuICogQHBhcmFtIHlvYlx0LSB5ZWFyIG9mIGJpcnRoLlxuICogQHBhcmFtIHN0YXR1cyAtIDAgPSBhbGl2ZSwgMSA9IGRlYWQuXG4gKiBAcmV0dXJuIHRydWUgaWYgYWdlIGFuZCB5b2IgYXJlIGNvbnNpc3RlbnQgd2l0aCBjdXJyZW50IHllYXIgb3RoZXJ3aXNlIGZhbHNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfYWdlX3lvYihhZ2UsIHlvYiwgc3RhdHVzKSB7XG5cdGxldCB5ZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuXHRsZXQgc3VtID0gcGFyc2VJbnQoYWdlKSArIHBhcnNlSW50KHlvYik7XG5cdGlmKHN0YXR1cyA9PSAxKSB7ICAgLy8gZGVjZWFzZWRcblx0XHRyZXR1cm4geWVhciA+PSBzdW07XG5cdH1cblx0cmV0dXJuIE1hdGguYWJzKHllYXIgLSBzdW0pIDw9IDEgJiYgeWVhciA+PSBzdW07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG5cdHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VpZChsZW4pIHtcblx0bGV0IHRleHQgPSBcIlwiO1xuXHRsZXQgcG9zc2libGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcblx0Zm9yKCBsZXQgaT0wOyBpIDwgbGVuOyBpKysgKVxuXHRcdHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVHJlZShvcHRzLCBwZXJzb24sIHJvb3QsIHBhcnRuZXJMaW5rcywgaWQpIHtcblx0aWYgKHR5cGVvZiBwZXJzb24uY2hpbGRyZW4gPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0cGVyc29uLmNoaWxkcmVuID0gZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBwZXJzb24pO1xuXG5cdGlmICh0eXBlb2YgcGFydG5lckxpbmtzID09PSB0eXBlb2YgdW5kZWZpbmVkKSB7XG5cdFx0cGFydG5lckxpbmtzID0gW107XG5cdFx0aWQgPSAxO1xuXHR9XG5cblx0bGV0IG5vZGVzID0gZmxhdHRlbihyb290KTtcblx0Ly9jb25zb2xlLmxvZygnTkFNRT0nK3BlcnNvbi5uYW1lKycgTk8uIENISUxEUkVOPScrcGVyc29uLmNoaWxkcmVuLmxlbmd0aCk7XG5cdGxldCBwYXJ0bmVycyA9IFtdO1xuXHQkLmVhY2gocGVyc29uLmNoaWxkcmVuLCBmdW5jdGlvbihpLCBjaGlsZCkge1xuXHRcdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGosIHApIHtcblx0XHRcdGlmICgoKGNoaWxkLm5hbWUgPT09IHAubW90aGVyKSB8fCAoY2hpbGQubmFtZSA9PT0gcC5mYXRoZXIpKSAmJiBjaGlsZC5pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGxldCBtID0gZ2V0Tm9kZUJ5TmFtZShub2RlcywgcC5tb3RoZXIpO1xuXHRcdFx0XHRsZXQgZiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHAuZmF0aGVyKTtcblx0XHRcdFx0bSA9IChtICE9PSB1bmRlZmluZWQ/IG0gOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5tb3RoZXIpKTtcblx0XHRcdFx0ZiA9IChmICE9PSB1bmRlZmluZWQ/IGYgOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5mYXRoZXIpKTtcblx0XHRcdFx0aWYoIWNvbnRhaW5zX3BhcmVudChwYXJ0bmVycywgbSwgZikpXG5cdFx0XHRcdFx0cGFydG5lcnMucHVzaCh7J21vdGhlcic6IG0sICdmYXRoZXInOiBmfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXHQkLm1lcmdlKHBhcnRuZXJMaW5rcywgcGFydG5lcnMpO1xuXG5cdCQuZWFjaChwYXJ0bmVycywgZnVuY3Rpb24oaSwgcHRyKSB7XG5cdFx0bGV0IG1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0bGV0IGZhdGhlciA9IHB0ci5mYXRoZXI7XG5cdFx0bW90aGVyLmNoaWxkcmVuID0gW107XG5cdFx0bGV0IHBhcmVudCA9IHtcblx0XHRcdFx0bmFtZSA6IG1ha2VpZCg0KSxcblx0XHRcdFx0aGlkZGVuIDogdHJ1ZSxcblx0XHRcdFx0cGFyZW50IDogbnVsbCxcblx0XHRcdFx0ZmF0aGVyIDogZmF0aGVyLFxuXHRcdFx0XHRtb3RoZXIgOiBtb3RoZXIsXG5cdFx0XHRcdGNoaWxkcmVuIDogZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBtb3RoZXIsIGZhdGhlcilcblx0XHR9O1xuXG5cdFx0bGV0IG1pZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIubmFtZSk7XG5cdFx0bGV0IGZpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0aWYoISgnaWQnIGluIGZhdGhlcikgJiYgISgnaWQnIGluIG1vdGhlcikpXG5cdFx0XHRpZCA9IHNldENoaWxkcmVuSWQocGVyc29uLmNoaWxkcmVuLCBpZCk7XG5cblx0XHQvLyBsb29rIGF0IGdyYW5kcGFyZW50cyBpbmRleFxuXHRcdGxldCBncCA9IGdldF9ncmFuZHBhcmVudHNfaWR4KG9wdHMuZGF0YXNldCwgbWlkeCwgZmlkeCk7XG5cdFx0aWYoZ3AuZmlkeCA8IGdwLm1pZHgpIHtcblx0XHRcdGZhdGhlci5pZCA9IGlkKys7XG5cdFx0XHRwYXJlbnQuaWQgPSBpZCsrO1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHRcdHBhcmVudC5pZCA9IGlkKys7XG5cdFx0XHRmYXRoZXIuaWQgPSBpZCsrO1xuXHRcdH1cblx0XHRpZCA9IHVwZGF0ZVBhcmVudChtb3RoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRpZCA9IHVwZGF0ZVBhcmVudChmYXRoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRwZXJzb24uY2hpbGRyZW4ucHVzaChwYXJlbnQpO1xuXHR9KTtcblx0aWQgPSBzZXRDaGlsZHJlbklkKHBlcnNvbi5jaGlsZHJlbiwgaWQpO1xuXG5cdCQuZWFjaChwZXJzb24uY2hpbGRyZW4sIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZCA9IGJ1aWxkVHJlZShvcHRzLCBwLCByb290LCBwYXJ0bmVyTGlua3MsIGlkKVsxXTtcblx0fSk7XG5cdHJldHVybiBbcGFydG5lckxpbmtzLCBpZF07XG59XG5cbi8vIHVwZGF0ZSBwYXJlbnQgbm9kZSBhbmQgc29ydCB0d2luc1xuZnVuY3Rpb24gdXBkYXRlUGFyZW50KHAsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKSB7XG5cdC8vIGFkZCB0byBwYXJlbnQgbm9kZVxuXHRpZigncGFyZW50X25vZGUnIGluIHApXG5cdFx0cC5wYXJlbnRfbm9kZS5wdXNoKHBhcmVudCk7XG5cdGVsc2Vcblx0XHRwLnBhcmVudF9ub2RlID0gW3BhcmVudF07XG5cblx0Ly8gY2hlY2sgdHdpbnMgbGllIG5leHQgdG8gZWFjaCBvdGhlclxuXHRpZihwLm16dHdpbiB8fCBwLmR6dHdpbnMpIHtcblx0XHRsZXQgdHdpbnMgPSBnZXRUd2lucyhvcHRzLmRhdGFzZXQsIHApO1xuXHRcdGZvcihsZXQgaT0wOyBpPHR3aW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgdHdpbiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHR3aW5zW2ldLm5hbWUpO1xuXHRcdFx0aWYodHdpbilcblx0XHRcdFx0dHdpbi5pZCA9IGlkKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBpZDtcbn1cblxuZnVuY3Rpb24gc2V0Q2hpbGRyZW5JZChjaGlsZHJlbiwgaWQpIHtcblx0Ly8gc29ydCB0d2lucyB0byBsaWUgbmV4dCB0byBlYWNoIG90aGVyXG5cdGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHRcdGlmKGEubXp0d2luICYmIGIubXp0d2luICYmIGEubXp0d2luID09IGIubXp0d2luKVxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0ZWxzZSBpZihhLmR6dHdpbiAmJiBiLmR6dHdpbiAmJiBhLmR6dHdpbiA9PSBiLmR6dHdpbilcblx0XHRcdHJldHVybiAwO1xuXHRcdGVsc2UgaWYoYS5tenR3aW4gfHwgYi5tenR3aW4gfHwgYS5kenR3aW4gfHwgYi5kenR3aW4pXG5cdFx0XHRyZXR1cm4gMTtcblx0XHRyZXR1cm4gMDtcblx0fSk7XG5cblx0JC5lYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYocC5pZCA9PT0gdW5kZWZpbmVkKSBwLmlkID0gaWQrKztcblx0fSk7XG5cdHJldHVybiBpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvYmFuZChvYmopIHtcblx0cmV0dXJuIHR5cGVvZiAkKG9iaikuYXR0cigncHJvYmFuZCcpICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmICQob2JqKS5hdHRyKCdwcm9iYW5kJykgIT09IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJvYmFuZChkYXRhc2V0LCBuYW1lLCBpc19wcm9iYW5kKSB7XG5cdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYgKG5hbWUgPT09IHAubmFtZSlcblx0XHRcdHAucHJvYmFuZCA9IGlzX3Byb2JhbmQ7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHAucHJvYmFuZDtcblx0fSk7XG59XG5cbi8vY29tYmluZSBhcnJheXMgaWdub3JpbmcgZHVwbGljYXRlc1xuZnVuY3Rpb24gY29tYmluZUFycmF5cyhhcnIxLCBhcnIyKSB7XG5cdGZvcihsZXQgaT0wOyBpPGFycjIubGVuZ3RoOyBpKyspXG5cdFx0aWYoJC5pbkFycmF5KCBhcnIyW2ldLCBhcnIxICkgPT0gLTEpIGFycjEucHVzaChhcnIyW2ldKTtcbn1cblxuZnVuY3Rpb24gaW5jbHVkZV9jaGlsZHJlbihjb25uZWN0ZWQsIHAsIGRhdGFzZXQpIHtcblx0aWYoJC5pbkFycmF5KCBwLm5hbWUsIGNvbm5lY3RlZCApID09IC0xKVxuXHRcdHJldHVybjtcblx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBwKSk7XG5cdGxldCBjaGlsZHJlbiA9IGdldEFsbENoaWxkcmVuKGRhdGFzZXQsIHApO1xuXHQkLmVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKCBjaGlsZF9pZHgsIGNoaWxkICkge1xuXHRcdGlmKCQuaW5BcnJheSggY2hpbGQubmFtZSwgY29ubmVjdGVkICkgPT0gLTEpIHtcblx0XHRcdGNvbm5lY3RlZC5wdXNoKGNoaWxkLm5hbWUpO1xuXHRcdFx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCkpO1xuXHRcdH1cblx0fSk7XG59XG5cbi8vZ2V0IHRoZSBwYXJ0bmVycyBmb3IgYSBnaXZlbiBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIGFub2RlKSB7XG5cdGxldCBwdHJzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgYm5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGFub2RlLm5hbWUgPT09IGJub2RlLm1vdGhlciAmJiAkLmluQXJyYXkoYm5vZGUuZmF0aGVyLCBwdHJzKSA9PSAtMSlcblx0XHRcdHB0cnMucHVzaChibm9kZS5mYXRoZXIpO1xuXHRcdGVsc2UgaWYoYW5vZGUubmFtZSA9PT0gYm5vZGUuZmF0aGVyICYmICQuaW5BcnJheShibm9kZS5tb3RoZXIsIHB0cnMpID09IC0xKVxuXHRcdFx0cHRycy5wdXNoKGJub2RlLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHB0cnM7XG59XG5cbi8vcmV0dXJuIGEgbGlzdCBvZiBpbmRpdmlkdWFscyB0aGF0IGFyZW4ndCBjb25uZWN0ZWQgdG8gdGhlIHRhcmdldFxuZXhwb3J0IGZ1bmN0aW9uIHVuY29ubmVjdGVkKGRhdGFzZXQpe1xuXHRsZXQgdGFyZ2V0ID0gZGF0YXNldFsgZ2V0UHJvYmFuZEluZGV4KGRhdGFzZXQpIF07XG5cdGlmKCF0YXJnZXQpe1xuXHRcdGNvbnNvbGUud2FybihcIk5vIHRhcmdldCBkZWZpbmVkXCIpO1xuXHRcdGlmKGRhdGFzZXQubGVuZ3RoID09IDApIHtcblx0XHRcdHRocm93IFwiZW1wdHkgcGVkaWdyZWUgZGF0YSBzZXRcIjtcblx0XHR9XG5cdFx0dGFyZ2V0ID0gZGF0YXNldFswXTtcblx0fVxuXHRsZXQgY29ubmVjdGVkID0gW3RhcmdldC5uYW1lXTtcblx0bGV0IGNoYW5nZSA9IHRydWU7XG5cdGxldCBpaSA9IDA7XG5cdHdoaWxlKGNoYW5nZSAmJiBpaSA8IDIwMCkge1xuXHRcdGlpKys7XG5cdFx0bGV0IG5jb25uZWN0ID0gY29ubmVjdGVkLmxlbmd0aDtcblx0XHQkLmVhY2goZGF0YXNldCwgZnVuY3Rpb24oIGlkeCwgcCApIHtcblx0XHRcdGlmKCQuaW5BcnJheSggcC5uYW1lLCBjb25uZWN0ZWQgKSAhPSAtMSkge1xuXHRcdFx0XHQvLyBjaGVjayBpZiB0aGlzIHBlcnNvbiBvciBhIHBhcnRuZXIgaGFzIGEgcGFyZW50XG5cdFx0XHRcdGxldCBwdHJzID0gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIHApO1xuXHRcdFx0XHRsZXQgaGFzX3BhcmVudCA9IChwLm5hbWUgPT09IHRhcmdldC5uYW1lIHx8ICFwLm5vcGFyZW50cyk7XG5cdFx0XHRcdGZvcihsZXQgaT0wOyBpPHB0cnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdGlmKCFnZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbaV0pLm5vcGFyZW50cylcblx0XHRcdFx0XHRcdGhhc19wYXJlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoaGFzX3BhcmVudCl7XG5cdFx0XHRcdFx0aWYocC5tb3RoZXIgJiYgJC5pbkFycmF5KCBwLm1vdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLm1vdGhlcik7XG5cdFx0XHRcdFx0aWYocC5mYXRoZXIgJiYgJC5pbkFycmF5KCBwLmZhdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLmZhdGhlcik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiggIXAubm9wYXJlbnRzICYmXG5cdFx0XHRcdFx0ICAoKHAubW90aGVyICYmICQuaW5BcnJheSggcC5tb3RoZXIsIGNvbm5lY3RlZCApICE9IC0xKSB8fFxuXHRcdFx0XHRcdCAgIChwLmZhdGhlciAmJiAkLmluQXJyYXkoIHAuZmF0aGVyLCBjb25uZWN0ZWQgKSAhPSAtMSkpKXtcblx0XHRcdFx0Y29ubmVjdGVkLnB1c2gocC5uYW1lKTtcblx0XHRcdH1cblx0XHRcdC8vIGluY2x1ZGUgYW55IGNoaWxkcmVuXG5cdFx0XHRpbmNsdWRlX2NoaWxkcmVuKGNvbm5lY3RlZCwgcCwgZGF0YXNldCk7XG5cdFx0fSk7XG5cdFx0Y2hhbmdlID0gKG5jb25uZWN0ICE9IGNvbm5lY3RlZC5sZW5ndGgpO1xuXHR9XG5cdGxldCBuYW1lcyA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwubmFtZTt9KTtcblx0cmV0dXJuICQubWFwKG5hbWVzLCBmdW5jdGlvbihuYW1lLCBfaSl7cmV0dXJuICQuaW5BcnJheShuYW1lLCBjb25uZWN0ZWQpID09IC0xID8gbmFtZSA6IG51bGw7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9iYW5kSW5kZXgoZGF0YXNldCkge1xuXHRsZXQgcHJvYmFuZDtcblx0JC5lYWNoKGRhdGFzZXQsIGZ1bmN0aW9uKGksIHZhbCkge1xuXHRcdGlmIChpc1Byb2JhbmQodmFsKSkge1xuXHRcdFx0cHJvYmFuZCA9IGk7XG5cdFx0XHRyZXR1cm4gcHJvYmFuZDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gcHJvYmFuZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkcmVuKGRhdGFzZXQsIG1vdGhlciwgZmF0aGVyKSB7XG5cdGxldCBjaGlsZHJlbiA9IFtdO1xuXHRsZXQgbmFtZXMgPSBbXTtcblx0aWYobW90aGVyLnNleCA9PT0gJ0YnKVxuXHRcdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihtb3RoZXIubmFtZSA9PT0gcC5tb3RoZXIpXG5cdFx0XHRcdGlmKCFmYXRoZXIgfHwgZmF0aGVyLm5hbWUgPT0gcC5mYXRoZXIpIHtcblx0XHRcdFx0XHRpZigkLmluQXJyYXkocC5uYW1lLCBuYW1lcykgPT09IC0xKXtcblx0XHRcdFx0XHRcdGNoaWxkcmVuLnB1c2gocCk7XG5cdFx0XHRcdFx0XHRuYW1lcy5wdXNoKHAubmFtZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBjaGlsZHJlbjtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNfcGFyZW50KGFyciwgbSwgZikge1xuXHRmb3IobGV0IGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspXG5cdFx0aWYoYXJyW2ldLm1vdGhlciA9PT0gbSAmJiBhcnJbaV0uZmF0aGVyID09PSBmKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gZ2V0IHRoZSBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWwgLSBzZXggaXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyXG4vLyBmb3Igb25seSByZXR1cm5pbmcgYnJvdGhlcnMgb3Igc2lzdGVyc1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbiwgc2V4KSB7XG5cdGlmKHBlcnNvbiA9PT0gdW5kZWZpbmVkIHx8ICFwZXJzb24ubW90aGVyIHx8IHBlcnNvbi5ub3BhcmVudHMpXG5cdFx0cmV0dXJuIFtdO1xuXG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgcC5tb3RoZXIgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09IHNleCkgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgc2libGluZ3MgKyBhZG9wdGVkIHNpYmxpbmdzXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgcGVyc29uLCBzZXgpIHtcblx0cmV0dXJuICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gIHAubmFtZSAhPT0gcGVyc29uLm5hbWUgJiYgISgnbm9wYXJlbnRzJyBpbiBwKSAmJiBwLm1vdGhlciAmJlxuXHRcdFx0ICAgKHAubW90aGVyID09PSBwZXJzb24ubW90aGVyICYmIHAuZmF0aGVyID09PSBwZXJzb24uZmF0aGVyKSAmJlxuXHRcdFx0ICAgKCFzZXggfHwgcC5zZXggPT0gc2V4KSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuLy8gZ2V0IHRoZSBtb25vL2RpLXp5Z290aWMgdHdpbihzKVxuZXhwb3J0IGZ1bmN0aW9uIGdldFR3aW5zKGRhdGFzZXQsIHBlcnNvbikge1xuXHRsZXQgc2licyA9IGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbik7XG5cdGxldCB0d2luX3R5cGUgPSAocGVyc29uLm16dHdpbiA/IFwibXp0d2luXCIgOiBcImR6dHdpblwiKTtcblx0cmV0dXJuICQubWFwKHNpYnMsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gcC5uYW1lICE9PSBwZXJzb24ubmFtZSAmJiBwW3R3aW5fdHlwZV0gPT0gcGVyc29uW3R3aW5fdHlwZV0gPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgYWRvcHRlZCBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWxcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZG9wdGVkU2libGluZ3MoZGF0YXNldCwgcGVyc29uKSB7XG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICdub3BhcmVudHMnIGluIHAgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxDaGlsZHJlbihkYXRhc2V0LCBwZXJzb24sIHNleCkge1xuXHRyZXR1cm4gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe1xuXHRcdHJldHVybiAhKCdub3BhcmVudHMnIGluIHApICYmXG5cdFx0XHQgICAocC5tb3RoZXIgPT09IHBlcnNvbi5uYW1lIHx8IHAuZmF0aGVyID09PSBwZXJzb24ubmFtZSkgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09PSBzZXgpID8gcCA6IG51bGw7XG5cdH0pO1xufVxuXG4vLyBnZXQgdGhlIGRlcHRoIG9mIHRoZSBnaXZlbiBwZXJzb24gZnJvbSB0aGUgcm9vdFxuZXhwb3J0IGZ1bmN0aW9uIGdldERlcHRoKGRhdGFzZXQsIG5hbWUpIHtcblx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGRlcHRoID0gMTtcblxuXHR3aGlsZShpZHggPj0gMCAmJiAoJ21vdGhlcicgaW4gZGF0YXNldFtpZHhdIHx8IGRhdGFzZXRbaWR4XS50b3BfbGV2ZWwpKXtcblx0XHRpZHggPSBnZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLm1vdGhlcik7XG5cdFx0ZGVwdGgrKztcblx0fVxuXHRyZXR1cm4gZGVwdGg7XG59XG5cbi8vIGdpdmVuIGFuIGFycmF5IG9mIHBlb3BsZSBnZXQgYW4gaW5kZXggZm9yIGEgZ2l2ZW4gcGVyc29uXG5leHBvcnQgZnVuY3Rpb24gZ2V0SWR4QnlOYW1lKGFyciwgbmFtZSkge1xuXHRsZXQgaWR4ID0gLTE7XG5cdCQuZWFjaChhcnIsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZiAobmFtZSA9PT0gcC5uYW1lKSB7XG5cdFx0XHRpZHggPSBpO1xuXHRcdFx0cmV0dXJuIGlkeDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gaWR4O1xufVxuXG4vLyBnZXQgdGhlIG5vZGVzIGF0IGEgZ2l2ZW4gZGVwdGggc29ydGVkIGJ5IHRoZWlyIHggcG9zaXRpb25cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2Rlc0F0RGVwdGgoZm5vZGVzLCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRyZXR1cm4gJC5tYXAoZm5vZGVzLCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuIHAuZGVwdGggPT0gZGVwdGggJiYgIXAuZGF0YS5oaWRkZW4gJiYgJC5pbkFycmF5KHAuZGF0YS5uYW1lLCBleGNsdWRlX25hbWVzKSA9PSAtMSA/IHAgOiBudWxsO1xuXHR9KS5zb3J0KGZ1bmN0aW9uIChhLGIpIHtyZXR1cm4gYS54IC0gYi54O30pO1xufVxuXG4vLyBjb252ZXJ0IHRoZSBwYXJ0bmVyIG5hbWVzIGludG8gY29ycmVzcG9uZGluZyB0cmVlIG5vZGVzXG5leHBvcnQgZnVuY3Rpb24gbGlua05vZGVzKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnMpIHtcblx0bGV0IGxpbmtzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPCBwYXJ0bmVycy5sZW5ndGg7IGkrKylcblx0XHRsaW5rcy5wdXNoKHsnbW90aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLm1vdGhlci5uYW1lKSxcblx0XHRcdFx0XHQnZmF0aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLmZhdGhlci5uYW1lKX0pO1xuXHRyZXR1cm4gbGlua3M7XG59XG5cbi8vIGdldCBhbmNlc3RvcnMgb2YgYSBub2RlXG5leHBvcnQgZnVuY3Rpb24gYW5jZXN0b3JzKGRhdGFzZXQsIG5vZGUpIHtcblx0bGV0IGFuY2VzdG9ycyA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmRhdGEpIG5vZGUgPSBub2RlLmRhdGE7XG5cdFx0aWYoJ21vdGhlcicgaW4gbm9kZSAmJiAnZmF0aGVyJyBpbiBub2RlICYmICEoJ25vcGFyZW50cycgaW4gbm9kZSkpe1xuXHRcdFx0cmVjdXJzZShnZXROb2RlQnlOYW1lKGRhdGFzZXQsIG5vZGUubW90aGVyKSk7XG5cdFx0XHRyZWN1cnNlKGdldE5vZGVCeU5hbWUoZGF0YXNldCwgbm9kZS5mYXRoZXIpKTtcblx0XHR9XG5cdFx0YW5jZXN0b3JzLnB1c2gobm9kZSk7XG5cdH1cblx0cmVjdXJzZShub2RlKTtcblx0cmV0dXJuIGFuY2VzdG9ycztcbn1cblxuLy8gdGVzdCBpZiB0d28gbm9kZXMgYXJlIGNvbnNhbmd1aW5vdXMgcGFydG5lcnNcbmV4cG9ydCBmdW5jdGlvbiBjb25zYW5ndWl0eShub2RlMSwgbm9kZTIsIG9wdHMpIHtcblx0aWYobm9kZTEuZGVwdGggIT09IG5vZGUyLmRlcHRoKSAvLyBwYXJlbnRzIGF0IGRpZmZlcmVudCBkZXB0aHNcblx0XHRyZXR1cm4gdHJ1ZTtcblx0bGV0IGFuY2VzdG9yczEgPSBhbmNlc3RvcnMob3B0cy5kYXRhc2V0LCBub2RlMSk7XG5cdGxldCBhbmNlc3RvcnMyID0gYW5jZXN0b3JzKG9wdHMuZGF0YXNldCwgbm9kZTIpO1xuXHRsZXQgbmFtZXMxID0gJC5tYXAoYW5jZXN0b3JzMSwgZnVuY3Rpb24oYW5jZXN0b3IsIF9pKXtyZXR1cm4gYW5jZXN0b3IubmFtZTt9KTtcblx0bGV0IG5hbWVzMiA9ICQubWFwKGFuY2VzdG9yczIsIGZ1bmN0aW9uKGFuY2VzdG9yLCBfaSl7cmV0dXJuIGFuY2VzdG9yLm5hbWU7fSk7XG5cdGxldCBjb25zYW5ndWl0eSA9IGZhbHNlO1xuXHQkLmVhY2gobmFtZXMxLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XG5cdFx0aWYoJC5pbkFycmF5KG5hbWUsIG5hbWVzMikgIT09IC0xKXtcblx0XHRcdGNvbnNhbmd1aXR5ID0gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gY29uc2FuZ3VpdHk7XG59XG5cbi8vIHJldHVybiBhIGZsYXR0ZW5lZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJlZVxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4ocm9vdCkge1xuXHRsZXQgZmxhdCA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmNoaWxkcmVuKVxuXHRcdFx0bm9kZS5jaGlsZHJlbi5mb3JFYWNoKHJlY3Vyc2UpO1xuXHRcdGZsYXQucHVzaChub2RlKTtcblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZXR1cm4gZmxhdDtcbn1cblxuLy8gQWRqdXN0IEQzIGxheW91dCBwb3NpdGlvbmluZy5cbi8vIFBvc2l0aW9uIGhpZGRlbiBwYXJlbnQgbm9kZSBjZW50cmluZyB0aGVtIGJldHdlZW4gZmF0aGVyIGFuZCBtb3RoZXIgbm9kZXMuIFJlbW92ZSBraW5rc1xuLy8gZnJvbSBsaW5rcyAtIGUuZy4gd2hlcmUgdGhlcmUgaXMgYSBzaW5nbGUgY2hpbGQgcGx1cyBhIGhpZGRlbiBjaGlsZFxuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdF9jb29yZHMob3B0cywgcm9vdCwgZmxhdHRlbk5vZGVzKSB7XG5cdGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuXHRcdGlmIChub2RlLmNoaWxkcmVuKSB7XG5cdFx0XHRub2RlLmNoaWxkcmVuLmZvckVhY2gocmVjdXJzZSk7XG5cblx0XHRcdGlmKG5vZGUuZGF0YS5mYXRoZXIgIT09IHVuZGVmaW5lZCkgeyBcdC8vIGhpZGRlbiBub2Rlc1xuXHRcdFx0XHRsZXQgZmF0aGVyID0gZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIG5vZGUuZGF0YS5mYXRoZXIubmFtZSk7XG5cdFx0XHRcdGxldCBtb3RoZXIgPSBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2Rlcywgbm9kZS5kYXRhLm1vdGhlci5uYW1lKTtcblx0XHRcdFx0bGV0IHhtaWQgPSAoZmF0aGVyLnggKyBtb3RoZXIueCkgLzI7XG5cdFx0XHRcdGlmKCFvdmVybGFwKG9wdHMsIHJvb3QuZGVzY2VuZGFudHMoKSwgeG1pZCwgbm9kZS5kZXB0aCwgW25vZGUuZGF0YS5uYW1lXSkpIHtcblx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzXG5cdFx0XHRcdFx0bGV0IGRpZmYgPSBub2RlLnggLSB4bWlkO1xuXHRcdFx0XHRcdGlmKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDIgJiYgKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gfHwgbm9kZS5jaGlsZHJlblsxXS5kYXRhLmhpZGRlbikpIHtcblx0XHRcdFx0XHRcdGlmKCEobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiAmJiBub2RlLmNoaWxkcmVuWzFdLmRhdGEuaGlkZGVuKSkge1xuXHRcdFx0XHRcdFx0XHRsZXQgY2hpbGQxID0gKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gPyBub2RlLmNoaWxkcmVuWzFdIDogbm9kZS5jaGlsZHJlblswXSk7XG5cdFx0XHRcdFx0XHRcdGxldCBjaGlsZDIgPSAobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiA/IG5vZGUuY2hpbGRyZW5bMF0gOiBub2RlLmNoaWxkcmVuWzFdKTtcblx0XHRcdFx0XHRcdFx0aWYoICgoY2hpbGQxLnggPCBjaGlsZDIueCAmJiB4bWlkIDwgY2hpbGQyLngpIHx8IChjaGlsZDEueCA+IGNoaWxkMi54ICYmIHhtaWQgPiBjaGlsZDIueCkpICYmXG5cdFx0XHRcdFx0XHRcdFx0IW92ZXJsYXAob3B0cywgcm9vdC5kZXNjZW5kYW50cygpLCB4bWlkLCBjaGlsZDEuZGVwdGgsIFtjaGlsZDEuZGF0YS5uYW1lXSkpe1xuXHRcdFx0XHRcdFx0XHRcdGNoaWxkMS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxICYmICFub2RlLmNoaWxkcmVuWzBdLmRhdGEuaGlkZGVuKSB7XG5cdFx0XHRcdFx0XHRpZighb3ZlcmxhcChvcHRzLCByb290LmRlc2NlbmRhbnRzKCksIHhtaWQsIG5vZGUuY2hpbGRyZW5bMF0uZGVwdGgsIFtub2RlLmNoaWxkcmVuWzBdLmRhdGEubmFtZV0pKVxuXHRcdFx0XHRcdFx0XHRub2RlLmNoaWxkcmVuWzBdLnggPSB4bWlkO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZihkaWZmICE9PSAwICYmICFub2Rlc092ZXJsYXAob3B0cywgbm9kZSwgZGlmZiwgcm9vdCkpe1xuXHRcdFx0XHRcdFx0XHRpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0bm9kZS5jaGlsZHJlblswXS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZGVzY2VuZGFudHMgPSBub2RlLmRlc2NlbmRhbnRzKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdBREpVU1RJTkcgJytub2RlLmRhdGEubmFtZSsnIE5PLiBERVNDRU5EQU5UUyAnK2Rlc2NlbmRhbnRzLmxlbmd0aCsnIGRpZmY9JytkaWZmKTtcblx0XHRcdFx0XHRcdFx0XHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYobm9kZS5kYXRhLm5hbWUgIT09IGRlc2NlbmRhbnRzW2ldLmRhdGEubmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVzY2VuZGFudHNbaV0ueCAtPSBkaWZmO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmKChub2RlLnggPCBmYXRoZXIueCAmJiBub2RlLnggPCBtb3RoZXIueCkgfHwgKG5vZGUueCA+IGZhdGhlci54ICYmIG5vZGUueCA+IG1vdGhlci54KSl7XG5cdFx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzIGlmIGl0IGRvZXNuJ3QgbGllIGJldHdlZW4gbW90aGVyIGFuZCBmYXRoZXJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZWN1cnNlKHJvb3QpO1xufVxuXG4vLyB0ZXN0IGlmIG1vdmluZyBzaWJsaW5ncyBieSBkaWZmIG92ZXJsYXBzIHdpdGggb3RoZXIgbm9kZXNcbmZ1bmN0aW9uIG5vZGVzT3ZlcmxhcChvcHRzLCBub2RlLCBkaWZmLCByb290KSB7XG5cdGxldCBkZXNjZW5kYW50cyA9IG5vZGUuZGVzY2VuZGFudHMoKTtcblx0bGV0IGRlc2NlbmRhbnRzTmFtZXMgPSAkLm1hcChkZXNjZW5kYW50cywgZnVuY3Rpb24oZGVzY2VuZGFudCwgX2kpe3JldHVybiBkZXNjZW5kYW50LmRhdGEubmFtZTt9KTtcblx0bGV0IG5vZGVzID0gcm9vdC5kZXNjZW5kYW50cygpO1xuXHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKyl7XG5cdFx0bGV0IGRlc2NlbmRhbnQgPSBkZXNjZW5kYW50c1tpXTtcblx0XHRpZihub2RlLmRhdGEubmFtZSAhPT0gZGVzY2VuZGFudC5kYXRhLm5hbWUpe1xuXHRcdFx0bGV0IHhuZXcgPSBkZXNjZW5kYW50LnggLSBkaWZmO1xuXHRcdFx0aWYob3ZlcmxhcChvcHRzLCBub2RlcywgeG5ldywgZGVzY2VuZGFudC5kZXB0aCwgZGVzY2VuZGFudHNOYW1lcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8vIHRlc3QgaWYgeCBwb3NpdGlvbiBvdmVybGFwcyBhIG5vZGUgYXQgdGhlIHNhbWUgZGVwdGhcbmV4cG9ydCBmdW5jdGlvbiBvdmVybGFwKG9wdHMsIG5vZGVzLCB4bmV3LCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRmb3IobGV0IG49MDsgbjxub2Rlcy5sZW5ndGg7IG4rKykge1xuXHRcdGlmKGRlcHRoID09IG5vZGVzW25dLmRlcHRoICYmICQuaW5BcnJheShub2Rlc1tuXS5kYXRhLm5hbWUsIGV4Y2x1ZGVfbmFtZXMpID09IC0xKXtcblx0XHRcdGlmKE1hdGguYWJzKHhuZXcgLSBub2Rlc1tuXS54KSA8IChvcHRzLnN5bWJvbF9zaXplKjEuMTUpKVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vLyBnaXZlbiBhIHBlcnNvbnMgbmFtZSByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgZDMgdHJlZSBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUJ5TmFtZShub2RlcywgbmFtZSkge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYobm9kZXNbaV0uZGF0YSAmJiBuYW1lID09PSBub2Rlc1tpXS5kYXRhLm5hbWUpXG5cdFx0XHRyZXR1cm4gbm9kZXNbaV07XG5cdFx0ZWxzZSBpZiAobmFtZSA9PT0gbm9kZXNbaV0ubmFtZSlcblx0XHRcdHJldHVybiBub2Rlc1tpXTtcblx0fVxufVxuXG4vLyBnaXZlbiB0aGUgbmFtZSBvZiBhIHVybCBwYXJhbSBnZXQgdGhlIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gdXJsUGFyYW0obmFtZSl7XG5cdGxldCByZXN1bHRzID0gbmV3IFJlZ0V4cCgnWz8mXScgKyBuYW1lICsgJz0oW14mI10qKScpLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRpZiAocmVzdWx0cz09PW51bGwpXG5cdCAgIHJldHVybiBudWxsO1xuXHRlbHNlXG5cdCAgIHJldHVybiByZXN1bHRzWzFdIHx8IDA7XG59XG5cbi8vIGdldCBncmFuZHBhcmVudHMgaW5kZXhcbmV4cG9ydCBmdW5jdGlvbiBnZXRfZ3JhbmRwYXJlbnRzX2lkeChkYXRhc2V0LCBtaWR4LCBmaWR4KSB7XG5cdGxldCBnbWlkeCA9IG1pZHg7XG5cdGxldCBnZmlkeCA9IGZpZHg7XG5cdHdoaWxlKCAgJ21vdGhlcicgaW4gZGF0YXNldFtnbWlkeF0gJiYgJ21vdGhlcicgaW4gZGF0YXNldFtnZmlkeF0gJiZcblx0XHQgICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnbWlkeF0pICYmICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnZmlkeF0pKXtcblx0XHRnbWlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2dtaWR4XS5tb3RoZXIpO1xuXHRcdGdmaWR4ID0gZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbZ2ZpZHhdLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHsnbWlkeCc6IGdtaWR4LCAnZmlkeCc6IGdmaWR4fTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBwcm9iYW5kIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSB0aGUgcHJvYmFuZC5cbi8vICdrZXknIGNhbiBiZSBhIGxpc3Qgb2Yga2V5cyBvciBhIHNpbmdsZSBrZXkuXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hdHRyKG9wdHMsIGtleXMsIHZhbHVlKXtcblx0bGV0IHByb2JhbmQgPSBvcHRzLmRhdGFzZXRbIGdldFByb2JhbmRJbmRleChvcHRzLmRhdGFzZXQpIF07XG5cdG5vZGVfYXR0cihvcHRzLCBwcm9iYW5kLm5hbWUsIGtleXMsIHZhbHVlKTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBub2RlIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQuXG4vLyAna2V5JyBjYW4gYmUgYSBsaXN0IG9mIGtleXMgb3IgYSBzaW5nbGUga2V5LlxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVfYXR0cihvcHRzLCBuYW1lLCBrZXlzLCB2YWx1ZSl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUobmV3ZGF0YXNldCwgbmFtZSk7XG5cdGlmKCFub2RlKXtcblx0XHRjb25zb2xlLndhcm4oXCJObyBwZXJzb24gZGVmaW5lZFwiKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZighJC5pc0FycmF5KGtleXMpKSB7XG5cdFx0a2V5cyA9IFtrZXlzXTtcblx0fVxuXG5cdGlmKHZhbHVlKSB7XG5cdFx0Zm9yKGxldCBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGsgPSBrZXlzW2ldO1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnVkFMVUUgUFJPVklERUQnLCBrLCB2YWx1ZSwgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlICYmIGtleXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdGlmKG5vZGVba10gPT09IHZhbHVlKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0ICAgaWYoSlNPTi5zdHJpbmdpZnkobm9kZVtrXSkgPT09IEpTT04uc3RyaW5naWZ5KHZhbHVlKSlcblx0XHRcdFx0XHQgICByZXR1cm47XG5cdFx0XHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRcdFx0Ly8gY29udGludWUgcmVnYXJkbGVzcyBvZiBlcnJvclxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRub2RlW2tdID0gdmFsdWU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBmb3VuZCA9IGZhbHNlO1xuXHRcdGZvcihsZXQgaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBrID0ga2V5c1tpXTtcblx0XHRcdC8vY29uc29sZS5sb2coJ05PIFZBTFVFIFBST1ZJREVEJywgaywgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlKSB7XG5cdFx0XHRcdGRlbGV0ZSBub2RlW2tdO1xuXHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCFmb3VuZClcblx0XHRcdHJldHVybjtcblx0fVxuXHRzeW5jVHdpbnMobmV3ZGF0YXNldCwgbm9kZSk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbi8vIGFkZCBhIGNoaWxkIHRvIHRoZSBwcm9iYW5kOyBnaXZlYiBzZXgsIGFnZSwgeW9iIGFuZCBicmVhc3RmZWVkaW5nIG1vbnRocyAob3B0aW9uYWwpXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hZGRfY2hpbGQob3B0cywgc2V4LCBhZ2UsIHlvYiwgYnJlYXN0ZmVlZGluZyl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgcHJvYmFuZCA9IG5ld2RhdGFzZXRbIGdldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KSBdO1xuXHRpZighcHJvYmFuZCl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gcHJvYmFuZCBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgbmV3Y2hpbGQgPSBhZGRjaGlsZChuZXdkYXRhc2V0LCBwcm9iYW5kLCBzZXgsIDEpWzBdO1xuXHRuZXdjaGlsZC5hZ2UgPSBhZ2U7XG5cdG5ld2NoaWxkLnlvYiA9IHlvYjtcblx0aWYoYnJlYXN0ZmVlZGluZyAhPT0gdW5kZWZpbmVkKVxuXHRcdG5ld2NoaWxkLmJyZWFzdGZlZWRpbmcgPSBicmVhc3RmZWVkaW5nO1xuXHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRyZWJ1aWxkKG9wdHMpO1xuXHRyZXR1cm4gbmV3Y2hpbGQubmFtZTtcbn1cblxuLy8gZGVsZXRlIG5vZGUgdXNpbmcgdGhlIG5hbWVcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVfbm9kZV9ieV9uYW1lKG9wdHMsIG5hbWUpe1xuXHRmdW5jdGlvbiBvbkRvbmUob3B0cywgZGF0YXNldCkge1xuXHRcdC8vIGFzc2lnbiBuZXcgZGF0YXNldCBhbmQgcmVidWlsZCBwZWRpZ3JlZVxuXHRcdG9wdHMuZGF0YXNldCA9IGRhdGFzZXQ7XG5cdFx0cmVidWlsZChvcHRzKTtcblx0fVxuXHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZS5jdXJyZW50KG9wdHMpKTtcblx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlLmN1cnJlbnQob3B0cyksIG5hbWUpO1xuXHRpZighbm9kZSl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gbm9kZSBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRkZWxldGVfbm9kZV9kYXRhc2V0KG5ld2RhdGFzZXQsIG5vZGUsIG9wdHMsIG9uRG9uZSk7XG59XG5cbi8vIGNoZWNrIGJ5IG5hbWUgaWYgdGhlIGluZGl2aWR1YWwgZXhpc3RzXG5leHBvcnQgZnVuY3Rpb24gZXhpc3RzKG9wdHMsIG5hbWUpe1xuXHRyZXR1cm4gZ2V0Tm9kZUJ5TmFtZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBuYW1lKSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBwcmludCBvcHRpb25zIGFuZCBkYXRhc2V0XG5leHBvcnQgZnVuY3Rpb24gcHJpbnRfb3B0cyhvcHRzKXtcblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLnJlbW92ZSgpO1xuXHQkKFwiYm9keVwiKS5hcHBlbmQoXCI8ZGl2IGlkPSdwZWRpZ3JlZV9kYXRhJz48L2Rpdj5cIiApO1xuXHRsZXQga2V5O1xuXHRmb3IobGV0IGk9MDsgaTxvcHRzLmRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGVyc29uID0gXCI8ZGl2IGNsYXNzPSdyb3cnPjxzdHJvbmcgY2xhc3M9J2NvbC1tZC0xIHRleHQtcmlnaHQnPlwiK29wdHMuZGF0YXNldFtpXS5uYW1lK1wiPC9zdHJvbmc+PGRpdiBjbGFzcz0nY29sLW1kLTExJz5cIjtcblx0XHRmb3Ioa2V5IGluIG9wdHMuZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoa2V5ID09PSAnbmFtZScpIGNvbnRpbnVlO1xuXHRcdFx0aWYoa2V5ID09PSAncGFyZW50Jylcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHRlbHNlIGlmIChrZXkgPT09ICdjaGlsZHJlbicpIHtcblx0XHRcdFx0aWYgKG9wdHMuZGF0YXNldFtpXVtrZXldWzBdICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XVswXS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHR9IGVsc2Vcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XStcIjsgPC9zcGFuPlwiO1xuXHRcdH1cblx0XHQkKFwiI3BlZGlncmVlX2RhdGFcIikuYXBwZW5kKHBlcnNvbiArIFwiPC9kaXY+PC9kaXY+XCIpO1xuXG5cdH1cblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLmFwcGVuZChcIjxiciAvPjxiciAvPlwiKTtcblx0Zm9yKGtleSBpbiBvcHRzKSB7XG5cdFx0aWYoa2V5ID09PSAnZGF0YXNldCcpIGNvbnRpbnVlO1xuXHRcdCQoXCIjcGVkaWdyZWVfZGF0YVwiKS5hcHBlbmQoXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHNba2V5XStcIjsgPC9zcGFuPlwiKTtcblx0fVxufVxuIiwiLy8gdW5kbywgcmVkbywgcmVzZXQgYnV0dG9uc1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge3JlYnVpbGQsIGJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Y29weV9kYXRhc2V0LCBnZXRQcm9iYW5kSW5kZXh9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdGlvbnMpIHtcblx0bGV0IG9wdHMgPSAkLmV4dGVuZCh7XG4gICAgICAgIC8vIGRlZmF1bHRzXG5cdFx0YnRuX3RhcmdldDogJ3BlZGlncmVlX2hpc3RvcnknXG4gICAgfSwgb3B0aW9ucyApO1xuXG5cdGxldCBidG5zID0gW3tcImZhXCI6IFwiZmEtdW5kb1wiLCBcInRpdGxlXCI6IFwidW5kb1wifSxcblx0XHRcdFx0e1wiZmFcIjogXCJmYS1yZXBlYXRcIiwgXCJ0aXRsZVwiOiBcInJlZG9cIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtcmVmcmVzaFwiLCBcInRpdGxlXCI6IFwicmVzZXRcIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtYXJyb3dzLWFsdFwiLCBcInRpdGxlXCI6IFwiZnVsbHNjcmVlblwifV07XG5cdGxldCBsaXMgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxidG5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGlzICs9ICc8bGlcIj4nO1xuXHRcdGxpcyArPSAnJm5ic3A7PGkgY2xhc3M9XCJmYSBmYS1sZyAnICsgYnRuc1tpXS5mYSArICdcIiAnICtcblx0XHQgICAgICAgICAgICAgICAoYnRuc1tpXS5mYSA9PSBcImZhLWFycm93cy1hbHRcIiA/ICdpZD1cImZ1bGxzY3JlZW5cIiAnIDogJycpICtcblx0XHQgICAgICAgICAgICAgICAnIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRpdGxlPVwiJysgYnRuc1tpXS50aXRsZSArJ1wiPjwvaT4nO1xuXHRcdGxpcyArPSAnPC9saT4nO1xuXHR9XG5cdCQoIFwiI1wiK29wdHMuYnRuX3RhcmdldCApLmFwcGVuZChsaXMpO1xuXHRjbGljayhvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzX2Z1bGxzY3JlZW4oKXtcblx0cmV0dXJuIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrKG9wdHMpIHtcblx0Ly8gZnVsbHNjcmVlblxuICAgICQoZG9jdW1lbnQpLm9uKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlIG1vemZ1bGxzY3JlZW5jaGFuZ2UgZnVsbHNjcmVlbmNoYW5nZSBNU0Z1bGxzY3JlZW5DaGFuZ2UnLCBmdW5jdGlvbihfZSkgIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0aWYgKGxvY2FsX2RhdGFzZXQgIT09IHVuZGVmaW5lZCAmJiBsb2NhbF9kYXRhc2V0ICE9PSBudWxsKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBsb2NhbF9kYXRhc2V0O1xuXHRcdH1cblx0XHRyZWJ1aWxkKG9wdHMpO1xuICAgIH0pO1xuXG5cdCQoJyNmdWxsc2NyZWVuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oX2UpIHtcblx0XHRpZiAoIWRvY3VtZW50Lm1vekZ1bGxTY3JlZW4gJiYgIWRvY3VtZW50LndlYmtpdEZ1bGxTY3JlZW4pIHtcblx0XHRcdGxldCB0YXJnZXQgPSAkKFwiI1wiK29wdHMudGFyZ2V0RGl2KVswXTtcblx0XHRcdGlmKHRhcmdldC5tb3pSZXF1ZXN0RnVsbFNjcmVlbilcblx0XHRcdFx0dGFyZ2V0Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRhcmdldC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbihFbGVtZW50LkFMTE9XX0tFWUJPQVJEX0lOUFVUKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbilcblx0XHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuKCk7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyB1bmRvL3JlZG8vcmVzZXRcblx0JCggXCIjXCIrb3B0cy5idG5fdGFyZ2V0ICkub24oIFwiY2xpY2tcIiwgZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0aWYoJChlLnRhcmdldCkuaGFzQ2xhc3MoXCJkaXNhYmxlZFwiKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdGlmKCQoZS50YXJnZXQpLmhhc0NsYXNzKCdmYS11bmRvJykpIHtcblx0XHRcdG9wdHMuZGF0YXNldCA9IHBlZGNhY2hlLnByZXZpb3VzKG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlcGVhdCcpKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBwZWRjYWNoZS5uZXh0KG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlZnJlc2gnKSkge1xuXHRcdFx0JCgnPGRpdiBpZD1cIm1zZ0RpYWxvZ1wiPlJlc2V0dGluZyB0aGUgcGVkaWdyZWUgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIHNvbWUgZGF0YS48L2Rpdj4nKS5kaWFsb2coe1xuXHRcdFx0XHR0aXRsZTogJ0NvbmZpcm0gUmVzZXQnLFxuXHRcdFx0XHRyZXNpemFibGU6IGZhbHNlLFxuXHRcdFx0XHRoZWlnaHQ6IFwiYXV0b1wiLFxuXHRcdFx0XHR3aWR0aDogNDAwLFxuXHRcdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdFx0YnV0dG9uczoge1xuXHRcdFx0XHRcdENvbnRpbnVlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHJlc2V0KG9wdHMsIG9wdHMua2VlcF9wcm9iYW5kX29uX3Jlc2V0KTtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCBcImNsb3NlXCIgKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdENhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZyggXCJjbG9zZVwiICk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pO1xuXHR9KTtcbn1cblxuLy8gcmVzZXQgcGVkaWdyZWUgYW5kIGNsZWFyIHRoZSBoaXN0b3J5XG5leHBvcnQgZnVuY3Rpb24gcmVzZXQob3B0cywga2VlcF9wcm9iYW5kKSB7XG5cdGxldCBwcm9iYW5kO1xuXHRpZihrZWVwX3Byb2JhbmQpIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0bGV0IG5ld2RhdGFzZXQgPSAgY29weV9kYXRhc2V0KGxvY2FsX2RhdGFzZXQpO1xuXHRcdHByb2JhbmQgPSBuZXdkYXRhc2V0W2dldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KV07XG5cdFx0Ly9sZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlsLmdldENoaWxkcmVuKG5ld2RhdGFzZXQsIHByb2JhbmQpO1xuXHRcdHByb2JhbmQubmFtZSA9IFwiY2gxXCI7XG5cdFx0cHJvYmFuZC5tb3RoZXIgPSBcImYyMVwiO1xuXHRcdHByb2JhbmQuZmF0aGVyID0gXCJtMjFcIjtcblx0XHQvLyBjbGVhciBwZWRpZ3JlZSBkYXRhIGJ1dCBrZWVwIHByb2JhbmQgZGF0YSBhbmQgcmlzayBmYWN0b3JzXG5cdFx0cGVkY2FjaGUuY2xlYXJfcGVkaWdyZWVfZGF0YShvcHRzKVxuXHR9IGVsc2Uge1xuXHRcdHByb2JhbmQgPSB7XG5cdFx0XHRcIm5hbWVcIjpcImNoMVwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInByb2JhbmRcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1lXCJcblx0XHR9O1xuXHRcdHBlZGNhY2hlLmNsZWFyKG9wdHMpOyAvLyBjbGVhciBhbGwgc3RvcmFnZSBkYXRhXG5cdH1cblxuXHRkZWxldGUgb3B0cy5kYXRhc2V0O1xuXG5cdGxldCBzZWxlY3RlZCA9ICQoXCJpbnB1dFtuYW1lPSdkZWZhdWx0X2ZhbSddOmNoZWNrZWRcIik7XG5cdGlmKHNlbGVjdGVkLmxlbmd0aCA+IDAgJiYgc2VsZWN0ZWQudmFsKCkgPT0gJ2V4dGVuZGVkMicpIHsgICAgLy8gc2Vjb25kYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIndaQVwiLFwic2V4XCI6XCJNXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGdyYW5kZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUFrXCIsXCJzZXhcIjpcIkZcIixcInRvcF9sZXZlbFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgZ3JhbmRtb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ6d0JcIixcInNleFwiOlwiTVwiLFwidG9wX2xldmVsXCI6dHJ1ZSxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJtYXRlcm5hbCBncmFuZGZhdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImRPSFwiLFwic2V4XCI6XCJGXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGdyYW5kbW90aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUtnXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiTUFrXCIsXCJmYXRoZXJcIjpcIndaQVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGF1bnRcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4c21cIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgdW5jbGVcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJtMjFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiZE9IXCIsXCJmYXRoZXJcIjpcInp3QlwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImFPSFwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJzaXN0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJWaGFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiYnJvdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIlNwalwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcIm5vcGFyZW50c1wiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGFydG5lclwifSxcblx0XHRcdHByb2JhbmQsXG5cdFx0XHR7XCJuYW1lXCI6XCJ6aGtcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJjaDFcIixcImZhdGhlclwiOlwiU3BqXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZGF1Z2h0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJLbnhcIixcImRpc3BsYXlfbmFtZVwiOlwic29uXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwidXVjXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGF1bnRcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4SXdcIixcImRpc3BsYXlfbmFtZVwiOlwibWF0ZXJuYWwgdW5jbGVcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn1dO1xuXHR9IGVsc2UgaWYoc2VsZWN0ZWQubGVuZ3RoID4gMCAmJiBzZWxlY3RlZC52YWwoKSA9PSAnZXh0ZW5kZWQxJykgeyAgICAvLyBwcmltYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIm0yMVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpudWxsLFwiZmF0aGVyXCI6bnVsbCxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJmYXRoZXJcIixcIm5vcGFyZW50c1wiOnRydWV9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOm51bGwsXCJmYXRoZXJcIjpudWxsLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwiLFwibm9wYXJlbnRzXCI6dHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6XCJhT0hcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwic2lzdGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiVmhhXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImJyb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJTcGpcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJub3BhcmVudHNcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhcnRuZXJcIn0sXG5cdFx0XHRwcm9iYW5kLFxuXHRcdFx0e1wibmFtZVwiOlwiemhrXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImRhdWdodGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiS254XCIsXCJkaXNwbGF5X25hbWVcIjpcInNvblwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImNoMVwiLFwiZmF0aGVyXCI6XCJTcGpcIixcInN0YXR1c1wiOlwiMFwifV07XG5cdH0gZWxzZSB7XG5cdFx0b3B0cy5kYXRhc2V0ID0gW1xuXHRcdFx0e1wibmFtZVwiOiBcIm0yMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcImZhdGhlclwiLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6IFwiZjIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibW90aGVyXCIsIFwic2V4XCI6IFwiRlwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdHByb2JhbmRdO1xuXHR9XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVCdXR0b25zKG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBwZWRjYWNoZS5nZXRfY291bnQob3B0cyk7XG5cdGxldCBuc3RvcmUgPSBwZWRjYWNoZS5uc3RvcmUob3B0cyk7XG5cdGxldCBpZCA9IFwiI1wiK29wdHMuYnRuX3RhcmdldDtcblx0aWYobnN0b3JlIDw9IGN1cnJlbnQpXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRlbHNlXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG5cdGlmKGN1cnJlbnQgPiAxKVxuXHRcdCQoaWQrXCIgLmZhLXVuZG9cIikucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdGVsc2Vcblx0XHQkKGlkK1wiIC5mYS11bmRvXCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xufVxuIiwiLy8gcGVkaWdyZWUgSS9PXG5pbXBvcnQgKiBhcyBwZWRpZ3JlZV91dGlsIGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge2dldF90cmVlX2RpbWVuc2lvbnMsIHZhbGlkYXRlX3BlZGlncmVlLCByZWJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcblxuLy8gY2FuY2VycywgZ2VuZXRpYyAmIHBhdGhvbG9neSB0ZXN0c1xuZXhwb3J0IGxldCBjYW5jZXJzID0ge1xuXHRcdCdicmVhc3RfY2FuY2VyJzogJ2JyZWFzdF9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J2JyZWFzdF9jYW5jZXIyJzogJ2JyZWFzdF9jYW5jZXIyX2RpYWdub3Npc19hZ2UnLFxuXHRcdCdvdmFyaWFuX2NhbmNlcic6ICdvdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlJyxcblx0XHQncHJvc3RhdGVfY2FuY2VyJzogJ3Byb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlJyxcblx0XHQncGFuY3JlYXRpY19jYW5jZXInOiAncGFuY3JlYXRpY19jYW5jZXJfZGlhZ25vc2lzX2FnZSdcblx0fTtcbmV4cG9ydCBsZXQgZ2VuZXRpY190ZXN0ID0gWydicmNhMScsICdicmNhMicsICdwYWxiMicsICdhdG0nLCAnY2hlazInLCAncmFkNTFkJyxcdCdyYWQ1MWMnLCAnYnJpcDEnXTtcbmV4cG9ydCBsZXQgcGF0aG9sb2d5X3Rlc3RzID0gWydlcicsICdwcicsICdoZXIyJywgJ2NrMTQnLCAnY2s1NiddO1xuXG4vLyBnZXQgYnJlYXN0IGFuZCBvdmFyaWFuIFBSUyB2YWx1ZXNcbmV4cG9ydCBmdW5jdGlvbiBnZXRfcHJzX3ZhbHVlcygpIHtcblx0bGV0IHBycyA9IHt9O1xuXHRpZihoYXNJbnB1dChcImJyZWFzdF9wcnNfYVwiKSAmJiBoYXNJbnB1dChcImJyZWFzdF9wcnNfelwiKSkge1xuXHRcdHByc1snYnJlYXN0X2NhbmNlcl9wcnMnXSA9IHtcblx0XHRcdCdhbHBoYSc6IHBhcnNlRmxvYXQoJCgnI2JyZWFzdF9wcnNfYScpLnZhbCgpKSxcblx0XHRcdCd6c2NvcmUnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX3onKS52YWwoKSksXG5cdFx0XHQncGVyY2VudCc6IHBhcnNlRmxvYXQoJCgnI2JyZWFzdF9wcnNfcGVyY2VudCcpLnZhbCgpKVxuXHRcdH07XG5cdH1cblx0aWYoaGFzSW5wdXQoXCJvdmFyaWFuX3Byc19hXCIpICYmIGhhc0lucHV0KFwib3Zhcmlhbl9wcnNfelwiKSkge1xuXHRcdHByc1snb3Zhcmlhbl9jYW5jZXJfcHJzJ10gPSB7XG5cdFx0XHQnYWxwaGEnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc19hJykudmFsKCkpLFxuXHRcdFx0J3pzY29yZSc6IHBhcnNlRmxvYXQoJCgnI292YXJpYW5fcHJzX3onKS52YWwoKSksXG5cdFx0XHQncGVyY2VudCc6IHBhcnNlRmxvYXQoJCgnI292YXJpYW5fcHJzX3BlcmNlbnQnKS52YWwoKSlcblx0XHR9O1xuXHR9XG5cdGNvbnNvbGUubG9nKHBycyk7XG5cdHJldHVybiAoaXNFbXB0eShwcnMpID8gMCA6IHBycyk7XG59XG5cbi8vIGNoZWNrIGlmIGlucHV0IGhhcyBhIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gaGFzSW5wdXQoaWQpIHtcblx0cmV0dXJuICQudHJpbSgkKCcjJytpZCkudmFsKCkpLmxlbmd0aCAhPT0gMDtcbn1cblxuLy8gcmV0dXJuIHRydWUgaWYgdGhlIG9iamVjdCBpcyBlbXB0eVxubGV0IGlzRW1wdHkgPSBmdW5jdGlvbihteU9iaikge1xuXHRmb3IobGV0IGtleSBpbiBteU9iaikge1xuXHRcdGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobXlPYmosIGtleSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfc3VyZ2ljYWxfb3BzKCkge1xuXHRsZXQgbWV0YSA9IFwiXCI7XG5cdGlmKCEkKCcjQTZfNF8zX2NoZWNrJykucGFyZW50KCkuaGFzQ2xhc3MoXCJvZmZcIikpIHtcblx0XHRtZXRhICs9IFwiO09WQVJZMj15XCI7XG5cdH1cblx0aWYoISQoJyNBNl80XzdfY2hlY2snKS5wYXJlbnQoKS5oYXNDbGFzcyhcIm9mZlwiKSkge1xuXHRcdG1ldGEgKz0gXCI7TUFTVDI9eVwiO1xuXHR9XG5cdHJldHVybiBtZXRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdHMpIHtcblx0JCgnI2xvYWQnKS5jaGFuZ2UoZnVuY3Rpb24oZSkge1xuXHRcdGxvYWQoZSwgb3B0cyk7XG5cdH0pO1xuXG5cdCQoJyNzYXZlJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRzYXZlKG9wdHMpO1xuXHR9KTtcblxuXHQkKCcjc2F2ZV9jYW5yaXNrJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRsZXQgbWV0YSA9IGdldF9zdXJnaWNhbF9vcHMoKTtcblx0XHRsZXQgcHJzO1xuXHRcdHRyeSB7XG5cdFx0XHRwcnMgPSBnZXRfcHJzX3ZhbHVlcygpO1xuXHRcdFx0aWYocHJzLmJyZWFzdF9jYW5jZXJfcHJzICYmIHBycy5icmVhc3RfY2FuY2VyX3Bycy5hbHBoYSAhPT0gMCAmJiBwcnMuYnJlYXN0X2NhbmNlcl9wcnMuenNjb3JlICE9PSAwKSB7XG5cdFx0XHRcdG1ldGEgKz0gXCJcXG4jI1BSU19CQz1hbHBoYT1cIitwcnMuYnJlYXN0X2NhbmNlcl9wcnMuYWxwaGErXCIsenNjb3JlPVwiK3Bycy5icmVhc3RfY2FuY2VyX3Bycy56c2NvcmU7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHBycy5vdmFyaWFuX2NhbmNlcl9wcnMgJiYgcHJzLm92YXJpYW5fY2FuY2VyX3Bycy5hbHBoYSAhPT0gMCAmJiBwcnMub3Zhcmlhbl9jYW5jZXJfcHJzLnpzY29yZSAhPT0gMCkge1xuXHRcdFx0XHRtZXRhICs9IFwiXFxuIyNQUlNfT0M9YWxwaGE9XCIrcHJzLm92YXJpYW5fY2FuY2VyX3Bycy5hbHBoYStcIix6c2NvcmU9XCIrcHJzLm92YXJpYW5fY2FuY2VyX3Bycy56c2NvcmU7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaChlcnIpIHsgY29uc29sZS53YXJuKFwiUFJTXCIsIHBycyk7IH1cblx0XHRzYXZlX2NhbnJpc2sob3B0cywgbWV0YSk7XG5cdH0pO1xuXG5cdCQoJyNwcmludCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0cHJpbnQoZ2V0X3ByaW50YWJsZV9zdmcob3B0cykpO1xuXHR9KTtcblxuXHQkKCcjc3ZnX2Rvd25sb2FkJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRzdmdfZG93bmxvYWQoZ2V0X3ByaW50YWJsZV9zdmcob3B0cykpO1xuXHR9KTtcblxuXHQkKCcjcG5nX2Rvd25sb2FkJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRsZXQgZGVmZXJyZWQgPSBzdmcyaW1nKCQoJ3N2ZycpLCBcInBlZGlncmVlXCIpO1xuXHRcdCQud2hlbi5hcHBseSgkLFtkZWZlcnJlZF0pLmRvbmUoZnVuY3Rpb24oKSB7XG5cdFx0XHRsZXQgb2JqID0gZ2V0QnlOYW1lKGFyZ3VtZW50cywgXCJwZWRpZ3JlZVwiKTtcblx0XHRcdGlmKHBlZGlncmVlX3V0aWwuaXNFZGdlKCkgfHwgcGVkaWdyZWVfdXRpbC5pc0lFKCkpIHtcblx0XHRcdFx0bGV0IGh0bWw9XCI8aW1nIHNyYz0nXCIrb2JqLmltZytcIicgYWx0PSdjYW52YXMgaW1hZ2UnLz5cIjtcblx0XHRcdFx0bGV0IG5ld1RhYiA9IHdpbmRvdy5vcGVuKCk7XHRcdC8vIHBvcC11cHMgbmVlZCB0byBiZSBlbmFibGVkXG5cdFx0XHRcdG5ld1RhYi5kb2N1bWVudC53cml0ZShodG1sKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxldCBhXHQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRcdFx0XHRhLmhyZWZcdCA9IG9iai5pbWc7XG5cdFx0XHRcdGEuZG93bmxvYWQgPSAncGxvdC5wbmcnO1xuXHRcdFx0XHRhLnRhcmdldCAgID0gJ19ibGFuayc7XG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG5cbi8qKlxuICogR2V0IG9iamVjdCBmcm9tIGFycmF5IGJ5IHRoZSBuYW1lIGF0dHJpYnV0ZS5cbiAqL1xuZnVuY3Rpb24gZ2V0QnlOYW1lKGFyciwgbmFtZSkge1xuXHRyZXR1cm4gJC5ncmVwKGFyciwgZnVuY3Rpb24obyl7IHJldHVybiBvICYmIG8ubmFtZSA9PSBuYW1lOyB9KVswXTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIFNWRyBkb2N1bWVudCBlbGVtZW50IGNvbnZlcnQgdG8gaW1hZ2UgKGUuZy4ganBlZywgcG5nIC0gZGVmYXVsdCBwbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3ZnMmltZyhzdmcsIGRlZmVycmVkX25hbWUsIG9wdGlvbnMpIHtcblx0bGV0IGRlZmF1bHRzID0ge2lzY2Fudmc6IGZhbHNlLCByZXNvbHV0aW9uOiAxLCBpbWdfdHlwZTogXCJpbWFnZS9wbmdcIn07XG5cdGlmKCFvcHRpb25zKSBvcHRpb25zID0gZGVmYXVsdHM7XG5cdCQuZWFjaChkZWZhdWx0cywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdGlmKCEoa2V5IGluIG9wdGlvbnMpKSB7b3B0aW9uc1trZXldID0gdmFsdWU7fVxuXHR9KTtcblxuXHQvLyBzZXQgU1ZHIGJhY2tncm91bmQgdG8gd2hpdGUgLSBmaXggZm9yIGpwZWcgY3JlYXRpb25cblx0aWYgKHN2Zy5maW5kKFwiLnBkZi13aGl0ZS1iZ1wiKS5sZW5ndGggPT09IDApe1xuXHRcdGxldCBkM29iaiA9IGQzLnNlbGVjdChzdmcuZ2V0KDApKTtcblx0XHRkM29iai5hcHBlbmQoXCJyZWN0XCIpXG5cdFx0XHQuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicGRmLXdoaXRlLWJnXCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCJ3aGl0ZVwiKTtcblx0XHRkM29iai5zZWxlY3QoXCIucGRmLXdoaXRlLWJnXCIpLmxvd2VyKCk7XG5cdH1cblxuXHRsZXQgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdGxldCBzdmdTdHI7XG5cdGlmICh0eXBlb2Ygd2luZG93LlhNTFNlcmlhbGl6ZXIgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHN2Z1N0ciA9IChuZXcgWE1MU2VyaWFsaXplcigpKS5zZXJpYWxpemVUb1N0cmluZyhzdmcuZ2V0KDApKTtcblx0fSBlbHNlIGlmICh0eXBlb2Ygc3ZnLnhtbCAhPSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c3ZnU3RyID0gc3ZnLmdldCgwKS54bWw7XG5cdH1cblxuXHRsZXQgaW1nc3JjID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJysgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3ZnU3RyKSkpOyAvLyBjb252ZXJ0IFNWRyBzdHJpbmcgdG8gZGF0YSBVUkxcblx0bGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG5cdGNhbnZhcy53aWR0aCA9IHN2Zy53aWR0aCgpKm9wdGlvbnMucmVzb2x1dGlvbjtcblx0Y2FudmFzLmhlaWdodCA9IHN2Zy5oZWlnaHQoKSpvcHRpb25zLnJlc29sdXRpb247XG5cdGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblx0bGV0IGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG5cdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZihwZWRpZ3JlZV91dGlsLmlzSUUoKSkge1xuXHRcdFx0Ly8gY2hhbmdlIGZvbnQgc28gaXQgaXNuJ3QgdGlueVxuXHRcdFx0c3ZnU3RyID0gc3ZnU3RyLnJlcGxhY2UoLyBmb250LXNpemU9XCJcXGQ/LlxcZCplbVwiL2csICcnKTtcblx0XHRcdHN2Z1N0ciA9IHN2Z1N0ci5yZXBsYWNlKC88dGV4dCAvZywgJzx0ZXh0IGZvbnQtc2l6ZT1cIjEycHhcIiAnKTtcblx0XHRcdGxldCB2ID0gY2FudmcuQ2FudmcuZnJvbVN0cmluZyhjb250ZXh0LCBzdmdTdHIsIHtcblx0XHRcdFx0c2NhbGVXaWR0aDogY2FudmFzLndpZHRoLFxuXHRcdFx0XHRzY2FsZUhlaWdodDogY2FudmFzLmhlaWdodCxcblx0XHRcdFx0aWdub3JlRGltZW5zaW9uczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0XHR2LnN0YXJ0KCk7XG5cdFx0XHRjb25zb2xlLmxvZyhkZWZlcnJlZF9uYW1lLCBvcHRpb25zLmltZ190eXBlLCBcInVzZSBjYW52ZyB0byBjcmVhdGUgaW1hZ2VcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdGNvbnNvbGUubG9nKGRlZmVycmVkX25hbWUsIG9wdGlvbnMuaW1nX3R5cGUpO1xuXHRcdH1cblx0XHRkZWZlcnJlZC5yZXNvbHZlKHsnbmFtZSc6IGRlZmVycmVkX25hbWUsICdyZXNvbHV0aW9uJzogb3B0aW9ucy5yZXNvbHV0aW9uLCAnaW1nJzpjYW52YXMudG9EYXRhVVJMKG9wdGlvbnMuaW1nX3R5cGUsIDEpLCAndyc6Y2FudmFzLndpZHRoLCAnaCc6Y2FudmFzLmhlaWdodH0pO1xuXHR9O1xuXHRpbWcuc3JjID0gaW1nc3JjO1xuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xufVxuXG5mdW5jdGlvbiBnZXRNYXRjaGVzKHN0ciwgbXlSZWdleHApIHtcblx0bGV0IG1hdGNoZXMgPSBbXTtcblx0bGV0IG1hdGNoO1xuXHRsZXQgYyA9IDA7XG5cdG15UmVnZXhwLmxhc3RJbmRleCA9IDA7XG5cdHdoaWxlICgobWF0Y2ggPSBteVJlZ2V4cC5leGVjKHN0cikpKSB7XG5cdFx0YysrO1xuXHRcdGlmKGMgPiA0MDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJnZXRNYXRjaGVzOiBjb3VudGVyIGV4Y2VlZGVkIDgwMFwiKTtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cdFx0bWF0Y2hlcy5wdXNoKG1hdGNoKTtcblx0XHRpZiAobXlSZWdleHAubGFzdEluZGV4ID09PSBtYXRjaC5pbmRleCkge1xuXHRcdFx0bXlSZWdleHAubGFzdEluZGV4Kys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBtYXRjaGVzO1xufVxuXG4vLyBmaW5kIGFsbCB1cmwncyB0byBtYWtlIHVuaXF1ZVxuZnVuY3Rpb24gdW5pcXVlX3VybHMoc3ZnX2h0bWwpIHtcblx0bGV0IG1hdGNoZXMgPSBnZXRNYXRjaGVzKHN2Z19odG1sLCAvdXJsXFwoKCZxdW90O3xcInwnKXswLDF9IyguKj8pKCZxdW90O3xcInwnKXswLDF9XFwpL2cpO1xuXHRpZihtYXRjaGVzID09PSAtMSlcblx0XHRyZXR1cm4gXCJFUlJPUiBESVNQTEFZSU5HIFBFRElHUkVFXCJcblxuXHQkLmVhY2gobWF0Y2hlcywgZnVuY3Rpb24oaW5kZXgsIG1hdGNoKSB7XG5cdFx0bGV0IHF1b3RlID0gKG1hdGNoWzFdID8gbWF0Y2hbMV0gOiBcIlwiKTtcblx0XHRsZXQgdmFsID0gbWF0Y2hbMl07XG5cdFx0bGV0IG0xID0gXCJpZD1cXFwiXCIgKyB2YWwgKyBcIlxcXCJcIjtcblx0XHRsZXQgbTIgPSBcInVybFxcXFwoXCIgKyBxdW90ZSArIFwiI1wiICsgdmFsICsgcXVvdGUgKyBcIlxcXFwpXCI7XG5cblx0XHRsZXQgbmV3dmFsID0gdmFsK3BlZGlncmVlX3V0aWwubWFrZWlkKDIpO1xuXHRcdHN2Z19odG1sID0gc3ZnX2h0bWwucmVwbGFjZShuZXcgUmVnRXhwKG0xLCAnZycpLCBcImlkPVxcXCJcIituZXd2YWwrXCJcXFwiXCIgKTtcblx0XHRzdmdfaHRtbCA9IHN2Z19odG1sLnJlcGxhY2UobmV3IFJlZ0V4cChtMiwgJ2cnKSwgXCJ1cmwoI1wiK25ld3ZhbCtcIilcIiApO1xuICAgfSk7XG5cdHJldHVybiBzdmdfaHRtbDtcbn1cblxuLy8gcmV0dXJuIGEgY29weSBwZWRpZ3JlZSBzdmdcbmV4cG9ydCBmdW5jdGlvbiBjb3B5X3N2ZyhvcHRzKSB7XG5cdGxldCBzdmdfbm9kZSA9IGdldF9wcmludGFibGVfc3ZnKG9wdHMpO1xuXHRsZXQgZDNvYmogPSBkMy5zZWxlY3Qoc3ZnX25vZGUuZ2V0KDApKTtcblxuXHQvLyByZW1vdmUgdW51c2VkIGVsZW1lbnRzXG5cdGQzb2JqLnNlbGVjdEFsbChcIi5wb3B1cF9zZWxlY3Rpb24sIC5pbmRpX3JlY3QsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZGNoaWxkLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLmxpbmVfZHJhZ19zZWxlY3Rpb25cIikucmVtb3ZlKCk7XG5cdGQzb2JqLnNlbGVjdEFsbChcInRleHRcIilcblx0ICAuZmlsdGVyKGZ1bmN0aW9uKCl7XG5cdFx0IHJldHVybiBkMy5zZWxlY3QodGhpcykudGV4dCgpLmxlbmd0aCA9PT0gMFxuXHQgIH0pLnJlbW92ZSgpO1xuXHRyZXR1cm4gJCh1bmlxdWVfdXJscyhzdmdfbm9kZS5odG1sKCkpKTtcbn1cblxuLy8gZ2V0IHByaW50YWJsZSBzdmcgZGl2LCBhZGp1c3Qgc2l6ZSB0byB0cmVlIGRpbWVuc2lvbnMgYW5kIHNjYWxlIHRvIGZpdFxuZXhwb3J0IGZ1bmN0aW9uIGdldF9wcmludGFibGVfc3ZnKG9wdHMpIHtcblx0bGV0IGxvY2FsX2RhdGFzZXQgPSBwZWRjYWNoZS5jdXJyZW50KG9wdHMpOyAvLyBnZXQgY3VycmVudCBkYXRhc2V0XG5cdGlmIChsb2NhbF9kYXRhc2V0ICE9PSB1bmRlZmluZWQgJiYgbG9jYWxfZGF0YXNldCAhPT0gbnVsbCkge1xuXHRcdG9wdHMuZGF0YXNldCA9IGxvY2FsX2RhdGFzZXQ7XG5cdH1cblxuXHRsZXQgdHJlZV9kaW1lbnNpb25zID0gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IHN2Z19kaXYgPSAkKCc8ZGl2PjwvZGl2PicpOyAgXHRcdFx0XHQvLyBjcmVhdGUgYSBuZXcgZGl2XG5cdGxldCBzdmcgPSAkKCcjJytvcHRzLnRhcmdldERpdikuZmluZCgnc3ZnJykuY2xvbmUoKS5hcHBlbmRUbyhzdmdfZGl2KTtcblx0aWYob3B0cy53aWR0aCA8IHRyZWVfZGltZW5zaW9ucy53aWR0aCB8fCBvcHRzLmhlaWdodCA8IHRyZWVfZGltZW5zaW9ucy5oZWlnaHQgfHxcblx0ICAgdHJlZV9kaW1lbnNpb25zLndpZHRoID4gNTk1IHx8IHRyZWVfZGltZW5zaW9ucy5oZWlnaHQgPiA4NDIpIHtcblx0XHRsZXQgd2lkID0gdHJlZV9kaW1lbnNpb25zLndpZHRoO1xuXHRcdGxldCBoZ3QgPSB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ICsgMTAwO1xuXHRcdGxldCBzY2FsZSA9IDEuMDtcblxuXHRcdGlmKHRyZWVfZGltZW5zaW9ucy53aWR0aCA+IDU5NSB8fCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSB7ICAgLy8gc2NhbGUgdG8gZml0IEE0XG5cdFx0XHRpZih0cmVlX2RpbWVuc2lvbnMud2lkdGggPiA1OTUpICB3aWQgPSA1OTU7XG5cdFx0XHRpZih0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSBoZ3QgPSA4NDI7XG5cdFx0XHRsZXQgeHNjYWxlID0gd2lkL3RyZWVfZGltZW5zaW9ucy53aWR0aDtcblx0XHRcdGxldCB5c2NhbGUgPSBoZ3QvdHJlZV9kaW1lbnNpb25zLmhlaWdodDtcblx0XHRcdHNjYWxlID0gKHhzY2FsZSA8IHlzY2FsZSA/IHhzY2FsZSA6IHlzY2FsZSk7XG5cdFx0fVxuXG5cdFx0c3ZnLmF0dHIoJ3dpZHRoJywgd2lkKTtcdFx0Ly8gYWRqdXN0IGRpbWVuc2lvbnNcblx0XHRzdmcuYXR0cignaGVpZ2h0JywgaGd0KTtcblxuXHRcdGxldCB5dHJhbnNmb3JtID0gKC1vcHRzLnN5bWJvbF9zaXplKjEuNSpzY2FsZSk7XG5cdFx0c3ZnLmZpbmQoXCIuZGlhZ3JhbVwiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsIFwiK3l0cmFuc2Zvcm0rXCIpIHNjYWxlKFwiK3NjYWxlK1wiKVwiKTtcblx0fVxuXHRyZXR1cm4gc3ZnX2Rpdjtcbn1cblxuLy8gZG93bmxvYWQgdGhlIFNWRyB0byBhIGZpbGVcbmV4cG9ydCBmdW5jdGlvbiBzdmdfZG93bmxvYWQoc3ZnKXtcblx0bGV0IGFcdCAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdGEuaHJlZlx0ID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJysgYnRvYSggdW5lc2NhcGUoIGVuY29kZVVSSUNvbXBvbmVudCggc3ZnLmh0bWwoKSApICkgKTtcblx0YS5kb3dubG9hZCA9ICdwbG90LnN2Zyc7XG5cdGEudGFyZ2V0ICAgPSAnX2JsYW5rJztcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygpOyBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xufVxuXG4vLyBvcGVuIHByaW50IHdpbmRvdyBmb3IgYSBnaXZlbiBlbGVtZW50XG5leHBvcnQgZnVuY3Rpb24gcHJpbnQoZWwsIGlkKXtcblx0aWYoZWwuY29uc3RydWN0b3IgIT09IEFycmF5KVxuXHRcdGVsID0gW2VsXTtcblxuXHRsZXQgd2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSowLjk7XG5cdGxldCBoZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCktMTA7XG5cdGxldCBjc3NGaWxlcyA9IFtcblx0XHQnL3N0YXRpYy9jc3MvY2Fucmlzay5jc3MnLFxuXHRcdCdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2ZvbnQtYXdlc29tZUA0LjcuMC9jc3MvZm9udC1hd2Vzb21lLm1pbi5jc3MnXG5cdF07XG5cdGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCcnLCAnUHJpbnRNYXAnLCAnd2lkdGg9JyArIHdpZHRoICsgJyxoZWlnaHQ9JyArIGhlaWdodCk7XG5cdGxldCBoZWFkQ29udGVudCA9ICcnO1xuXHRmb3IobGV0IGk9MDsgaTxjc3NGaWxlcy5sZW5ndGg7IGkrKylcblx0XHRoZWFkQ29udGVudCArPSAnPGxpbmsgaHJlZj1cIicrY3NzRmlsZXNbaV0rJ1wiIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBtZWRpYT1cImFsbFwiPic7XG5cdGhlYWRDb250ZW50ICs9IFwiPHN0eWxlPmJvZHkge2ZvbnQtc2l6ZTogXCIgKyAkKFwiYm9keVwiKS5jc3MoJ2ZvbnQtc2l6ZScpICsgXCI7fTwvc3R5bGU+XCI7XG5cblx0bGV0IGh0bWwgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxlbC5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGkgPT09IDAgJiYgaWQpXG5cdFx0XHRodG1sICs9IGlkO1xuXHRcdGh0bWwgKz0gJChlbFtpXSkuaHRtbCgpO1xuXHRcdGlmKGkgPCBlbC5sZW5ndGgtMSlcblx0XHRcdGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJwYWdlLWJyZWFrXCI+IDwvZGl2Pic7XG5cdH1cblxuXHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShoZWFkQ29udGVudCk7XG5cdHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGh0bWwpO1xuXHRwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuXG5cdHByaW50V2luZG93LmZvY3VzKCk7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0cHJpbnRXaW5kb3cucHJpbnQoKTtcblx0XHRwcmludFdpbmRvdy5jbG9zZSgpO1xuXHR9LCAzMDApO1xufVxuXG4vLyBzYXZlIGNvbnRlbnQgdG8gYSBmaWxlXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9maWxlKG9wdHMsIGNvbnRlbnQsIGZpbGVuYW1lLCB0eXBlKXtcblx0aWYob3B0cy5ERUJVRylcblx0XHRjb25zb2xlLmxvZyhjb250ZW50KTtcblx0aWYoIWZpbGVuYW1lKSBmaWxlbmFtZSA9IFwicGVkLnR4dFwiO1xuXHRpZighdHlwZSkgdHlwZSA9IFwidGV4dC9wbGFpblwiO1xuXG4gICBsZXQgZmlsZSA9IG5ldyBCbG9iKFtjb250ZW50XSwge3R5cGU6IHR5cGV9KTtcbiAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIFx0Ly8gSUUxMCtcblx0ICAgd2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKGZpbGUsIGZpbGVuYW1lKTtcbiAgIGVsc2UgeyBcdFx0XHRcdFx0XHRcdFx0XHQvLyBvdGhlciBicm93c2Vyc1xuXHQgICBsZXQgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXHQgICBsZXQgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcblx0ICAgYS5ocmVmID0gdXJsO1xuXHQgICBhLmRvd25sb2FkID0gZmlsZW5hbWU7XG5cdCAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XG5cdCAgIGEuY2xpY2soKTtcblx0ICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHQgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xuXHRcdCAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG5cdFx0fSwgMCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmUob3B0cyl7XG5cdGxldCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocGVkY2FjaGUuY3VycmVudChvcHRzKSk7XG5cdHNhdmVfZmlsZShvcHRzLCBjb250ZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfY2FucmlzayhvcHRzLCBtZXRhKXtcblx0c2F2ZV9maWxlKG9wdHMsIHJ1bl9wcmVkaWN0aW9uLmdldF9ub25fYW5vbl9wZWRpZ3JlZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBtZXRhKSwgXCJjYW5yaXNrLnR4dFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKSB7XG5cdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGlkeCwgcCkge1xuXHRcdGlmKCFwLmhpZGRlbiAmJiBwLnNleCA9PT0gJ00nICYmICFwZWRpZ3JlZV91dGlsLmlzUHJvYmFuZChwKSkge1xuXHRcdFx0aWYocFtjYW5jZXJzWydicmVhc3RfY2FuY2VyMiddXSkge1xuXHRcdFx0XHRsZXQgbXNnID0gJ01hbGUgZmFtaWx5IG1lbWJlciAoJytwLmRpc3BsYXlfbmFtZSsnKSB3aXRoIGNvbnRyYWxhdGVyYWwgYnJlYXN0IGNhbmNlciBmb3VuZC4gJytcblx0XHRcdFx0XHRcdCAgJ1BsZWFzZSBub3RlIHRoYXQgYXMgdGhlIHJpc2sgbW9kZWxzIGRvIG5vdCB0YWtlIHRoaXMgaW50byBhY2NvdW50IHRoZSBzZWNvbmQgJytcblx0XHRcdFx0XHRcdCAgJ2JyZWFzdCBjYW5jZXIgaXMgaWdub3JlZC4nXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IobXNnKTtcblx0XHRcdFx0ZGVsZXRlIHBbY2FuY2Vyc1snYnJlYXN0X2NhbmNlcjInXV07XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJXYXJuaW5nXCIsIG1zZyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoZSwgb3B0cykge1xuXHRsZXQgZiA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRpZihmKSB7XG5cdFx0bGV0IHJpc2tfZmFjdG9ycztcblx0XHRsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmKGUudGFyZ2V0LnJlc3VsdC5zdGFydHNXaXRoKFwiQk9BRElDRUEgaW1wb3J0IHBlZGlncmVlIGZpbGUgZm9ybWF0IDQuMFwiKSkge1xuXHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRCb2FkaWNlYVY0KGUudGFyZ2V0LnJlc3VsdCwgNCk7XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2UgaWYoZS50YXJnZXQucmVzdWx0LnN0YXJ0c1dpdGgoXCJCT0FESUNFQSBpbXBvcnQgcGVkaWdyZWUgZmlsZSBmb3JtYXQgMi4wXCIpKSB7XG5cdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gcmVhZEJvYWRpY2VhVjQoZS50YXJnZXQucmVzdWx0LCAyKTtcblx0XHRcdFx0XHRjYW5yaXNrX3ZhbGlkYXRpb24ob3B0cyk7XG5cdFx0XHRcdH0gZWxzZSBpZihlLnRhcmdldC5yZXN1bHQuc3RhcnRzV2l0aChcIiMjXCIpICYmIGUudGFyZ2V0LnJlc3VsdC5pbmRleE9mKFwiQ2FuUmlza1wiKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRsZXQgY2Fucmlza19kYXRhID0gcmVhZENhblJpc2tWMShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdHJpc2tfZmFjdG9ycyA9IGNhbnJpc2tfZGF0YVswXTtcblx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBjYW5yaXNrX2RhdGFbMV07XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBKU09OLnBhcnNlKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdFx0fSBjYXRjaChlcnIpIHtcblx0XHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRMaW5rYWdlKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHZhbGlkYXRlX3BlZGlncmVlKG9wdHMpO1xuXHRcdFx0fSBjYXRjaChlcnIxKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyMSwgZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdFx0cGVkaWdyZWVfdXRpbC5tZXNzYWdlcyhcIkZpbGUgRXJyb3JcIiwgKCBlcnIxLm1lc3NhZ2UgPyBlcnIxLm1lc3NhZ2UgOiBlcnIxKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKG9wdHMuZGF0YXNldCk7XG5cdFx0XHR0cnl7XG5cdFx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0XHRcdGlmKHJpc2tfZmFjdG9ycyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmlza19mYWN0b3JzKTtcblx0XHRcdFx0XHQvLyBsb2FkIHJpc2sgZmFjdG9ycyAtIGZpcmUgcmlza2ZhY3RvckNoYW5nZSBldmVudFxuXHRcdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ3Jpc2tmYWN0b3JDaGFuZ2UnLCBbb3B0cywgcmlza19mYWN0b3JzXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pOyBcdC8vIHRyaWdnZXIgZmhDaGFuZ2UgZXZlbnRcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSBGSCBzZWN0aW9uXG5cdFx0XHRcdFx0YWNjX0ZhbUhpc3RfdGlja2VkKCk7XG5cdFx0XHRcdFx0YWNjX0ZhbUhpc3RfTGVhdmUoKTtcblx0XHRcdFx0XHRSRVNVTFQuRkxBR19GQU1JTFlfTU9EQUwgPSB0cnVlO1xuXHRcdFx0XHR9IGNhdGNoKGVycjMpIHtcblx0XHRcdFx0XHQvLyBpZ25vcmUgZXJyb3Jcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaChlcnIyKSB7XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsICggZXJyMi5tZXNzYWdlID8gZXJyMi5tZXNzYWdlIDogZXJyMikpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0cmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0cGVkaWdyZWVfdXRpbC5tZXNzYWdlcyhcIkZpbGUgRXJyb3JcIiwgXCJGaWxlIGNvdWxkIG5vdCBiZSByZWFkISBDb2RlIFwiICsgZXZlbnQudGFyZ2V0LmVycm9yLmNvZGUpO1xuXHRcdH07XG5cdFx0cmVhZGVyLnJlYWRBc1RleHQoZik7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5lcnJvcihcIkZpbGUgY291bGQgbm90IGJlIHJlYWQhXCIpO1xuXHR9XG5cdCQoXCIjbG9hZFwiKVswXS52YWx1ZSA9ICcnOyAvLyByZXNldCB2YWx1ZVxufVxuXG4vL1xuLy8gaHR0cHM6Ly93d3cuY29nLWdlbm9taWNzLm9yZy9wbGluay8xLjkvZm9ybWF0cyNwZWRcbi8vIGh0dHBzOi8vd3d3LmNvZy1nZW5vbWljcy5vcmcvcGxpbmsvMS45L2Zvcm1hdHMjZmFtXG4vL1x0MS4gRmFtaWx5IElEICgnRklEJylcbi8vXHQyLiBXaXRoaW4tZmFtaWx5IElEICgnSUlEJzsgY2Fubm90IGJlICcwJylcbi8vXHQzLiBXaXRoaW4tZmFtaWx5IElEIG9mIGZhdGhlciAoJzAnIGlmIGZhdGhlciBpc24ndCBpbiBkYXRhc2V0KVxuLy9cdDQuIFdpdGhpbi1mYW1pbHkgSUQgb2YgbW90aGVyICgnMCcgaWYgbW90aGVyIGlzbid0IGluIGRhdGFzZXQpXG4vL1x0NS4gU2V4IGNvZGUgKCcxJyA9IG1hbGUsICcyJyA9IGZlbWFsZSwgJzAnID0gdW5rbm93bilcbi8vXHQ2LiBQaGVub3R5cGUgdmFsdWUgKCcxJyA9IGNvbnRyb2wsICcyJyA9IGNhc2UsICctOScvJzAnL25vbi1udW1lcmljID0gbWlzc2luZyBkYXRhIGlmIGNhc2UvY29udHJvbClcbi8vICA3LiBHZW5vdHlwZXMgKGNvbHVtbiA3IG9ud2FyZHMpO1xuLy9cdCBjb2x1bW5zIDcgJiA4IGFyZSBhbGxlbGUgY2FsbHMgZm9yIGZpcnN0IHZhcmlhbnQgKCcwJyA9IG5vIGNhbGwpOyBjb2x1bW1ucyA5ICYgMTAgYXJlIGNhbGxzIGZvciBzZWNvbmQgdmFyaWFudCBldGMuXG5leHBvcnQgZnVuY3Rpb24gcmVhZExpbmthZ2UoYm9hZGljZWFfbGluZXMpIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHRsZXQgZmFtaWQ7XG5cdGZvcihsZXQgaSA9IDA7aSA8IGxpbmVzLmxlbmd0aDtpKyspe1xuXHQgICBsZXQgYXR0ciA9ICQubWFwKGxpbmVzW2ldLnRyaW0oKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gdmFsLnRyaW0oKTt9KTtcblx0ICAgaWYoYXR0ci5sZW5ndGggPCA1KVxuXHRcdCAgIHRocm93KCd1bmtub3duIGZvcm1hdCcpO1xuXHQgICBsZXQgc2V4ID0gKGF0dHJbNF0gPT0gJzEnID8gJ00nIDogKGF0dHJbNF0gPT0gJzInID8gJ0YnIDogJ1UnKSk7XG5cdCAgIGxldCBpbmRpID0ge1xuXHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdCdkaXNwbGF5X25hbWUnOiBhdHRyWzFdLFxuXHRcdFx0J25hbWUnOlx0YXR0clsxXSxcblx0XHRcdCdzZXgnOiBzZXhcblx0XHR9O1xuXHRcdGlmKGF0dHJbMl0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbMl07XG5cdFx0aWYoYXR0clszXSAhPT0gXCIwXCIpIGluZGkubW90aGVyID0gYXR0clszXTtcblxuXHRcdGlmICh0eXBlb2YgZmFtaWQgIT0gJ3VuZGVmaW5lZCcgJiYgZmFtaWQgIT09IGluZGkuZmFtaWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ211bHRpcGxlIGZhbWlseSBJRHMgZm91bmQgb25seSB1c2luZyBmYW1pZCA9ICcrZmFtaWQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdGlmKGF0dHJbNV0gPT0gXCIyXCIpIGluZGkuYWZmZWN0ZWQgPSAyO1xuXHRcdC8vIGFkZCBnZW5vdHlwZSBjb2x1bW5zXG5cdFx0aWYoYXR0ci5sZW5ndGggPiA2KSB7XG5cdFx0XHRpbmRpLmFsbGVsZXMgPSBcIlwiO1xuXHRcdFx0Zm9yKGxldCBqPTY7IGo8YXR0ci5sZW5ndGg7IGorPTIpIHtcblx0XHRcdFx0aW5kaS5hbGxlbGVzICs9IGF0dHJbal0gKyBcIi9cIiArIGF0dHJbaisxXSArIFwiO1wiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHBlZC51bnNoaWZ0KGluZGkpO1xuXHRcdGZhbWlkID0gYXR0clswXTtcblx0fVxuXHRyZXR1cm4gcHJvY2Vzc19wZWQocGVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRDYW5SaXNrVjEoYm9hZGljZWFfbGluZXMpIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHRsZXQgaGRyID0gW107ICAvLyBjb2xsZWN0IHJpc2sgZmFjdG9yIGhlYWRlciBsaW5lc1xuXHQvLyBhc3N1bWVzIHR3byBsaW5lIGhlYWRlclxuXHRmb3IobGV0IGkgPSAwO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0XHRsZXQgbG4gPSBsaW5lc1tpXS50cmltKCk7XG5cdFx0aWYobG4uc3RhcnRzV2l0aChcIiMjXCIpKSB7XG5cdFx0XHRpZihsbi5zdGFydHNXaXRoKFwiIyNDYW5SaXNrXCIpICYmIGxuLmluZGV4T2YoXCI7XCIpID4gLTEpIHsgICAvLyBjb250YWlucyBzdXJnaWNhbCBvcCBkYXRhXG5cdFx0XHRcdGxldCBvcHMgPSBsbi5zcGxpdChcIjtcIik7XG5cdFx0XHRcdGZvcihsZXQgaj0xOyBqPG9wcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGxldCBvcGRhdGEgPSBvcHNbal0uc3BsaXQoXCI9XCIpO1xuXHRcdFx0XHRcdGlmKG9wZGF0YS5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0XHRcdGhkci5wdXNoKG9wc1tqXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihsbi5pbmRleE9mKFwiQ2FuUmlza1wiKSA9PT0gLTEgJiYgIWxuLnN0YXJ0c1dpdGgoXCIjI0ZhbUlEXCIpKSB7XG5cdFx0XHRcdGhkci5wdXNoKGxuLnJlcGxhY2UoXCIjI1wiLCBcIlwiKSk7XG5cdFx0XHR9XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRsZXQgZGVsaW0gPSAvXFx0Lztcblx0XHRpZihsbi5pbmRleE9mKCdcXHQnKSA8IDApIHtcblx0XHRcdGRlbGltID0gL1xccysvO1xuXHRcdFx0Y29uc29sZS5sb2coXCJOT1QgVEFCIERFTElNXCIpO1xuXHRcdH1cblx0XHRsZXQgYXR0ciA9ICQubWFwKGxuLnNwbGl0KGRlbGltKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cblx0XHRpZihhdHRyLmxlbmd0aCA+IDEpIHtcblx0XHRcdGxldCBpbmRpID0ge1xuXHRcdFx0XHQnZmFtaWQnOiBhdHRyWzBdLFxuXHRcdFx0XHQnZGlzcGxheV9uYW1lJzogYXR0clsxXSxcblx0XHRcdFx0J25hbWUnOlx0YXR0clszXSxcblx0XHRcdFx0J3NleCc6IGF0dHJbNl0sXG5cdFx0XHRcdCdzdGF0dXMnOiBhdHRyWzhdXG5cdFx0XHR9O1xuXHRcdFx0aWYoYXR0clsyXSA9PSAxKSBpbmRpLnByb2JhbmQgPSB0cnVlO1xuXHRcdFx0aWYoYXR0cls0XSAhPT0gXCIwXCIpIGluZGkuZmF0aGVyID0gYXR0cls0XTtcblx0XHRcdGlmKGF0dHJbNV0gIT09IFwiMFwiKSBpbmRpLm1vdGhlciA9IGF0dHJbNV07XG5cdFx0XHRpZihhdHRyWzddICE9PSBcIjBcIikgaW5kaS5tenR3aW4gPSBhdHRyWzddO1xuXHRcdFx0aWYoYXR0cls5XSAhPT0gXCIwXCIpIGluZGkuYWdlID0gYXR0cls5XTtcblx0XHRcdGlmKGF0dHJbMTBdICE9PSBcIjBcIikgaW5kaS55b2IgPSBhdHRyWzEwXTtcblxuXHRcdFx0bGV0IGlkeCA9IDExO1xuXHRcdFx0JC5lYWNoKGNhbmNlcnMsIGZ1bmN0aW9uKGNhbmNlciwgZGlhZ25vc2lzX2FnZSkge1xuXHRcdFx0XHQvLyBBZ2UgYXQgMXN0IGNhbmNlciBvciAwID0gdW5hZmZlY3RlZCwgQVUgPSB1bmtub3duIGFnZSBhdCBkaWFnbm9zaXMgKGFmZmVjdGVkIHVua25vd24pXG5cdFx0XHRcdGlmKGF0dHJbaWR4XSAhPT0gXCIwXCIpIHtcblx0XHRcdFx0XHRpbmRpW2RpYWdub3Npc19hZ2VdID0gYXR0cltpZHhdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmKGF0dHJbaWR4KytdICE9PSBcIjBcIikgaW5kaS5hc2hrZW5hemkgPSAxO1xuXHRcdFx0Ly8gQlJDQTEsIEJSQ0EyLCBQQUxCMiwgQVRNLCBDSEVLMiwgLi4uLiBnZW5ldGljIHRlc3RzXG5cdFx0XHQvLyBnZW5ldGljIHRlc3QgdHlwZSwgMCA9IHVudGVzdGVkLCBTID0gbXV0YXRpb24gc2VhcmNoLCBUID0gZGlyZWN0IGdlbmUgdGVzdFxuXHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHJlc3VsdCwgMCA9IHVudGVzdGVkLCBQID0gcG9zaXRpdmUsIE4gPSBuZWdhdGl2ZVxuXHRcdFx0Zm9yKGxldCBqPTA7IGo8Z2VuZXRpY190ZXN0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGxldCBnZW5lX3Rlc3QgPSBhdHRyW2lkeF0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0XHRpZihnZW5lX3Rlc3RbMF0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKChnZW5lX3Rlc3RbMF0gPT09ICdTJyB8fCBnZW5lX3Rlc3RbMF0gPT09ICdUJykgJiYgKGdlbmVfdGVzdFsxXSA9PT0gJ1AnIHx8IGdlbmVfdGVzdFsxXSA9PT0gJ04nKSlcblx0XHRcdFx0XHRcdGluZGlbZ2VuZXRpY190ZXN0W2pdICsgJ19nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGdlbmVfdGVzdFswXSwgJ3Jlc3VsdCc6IGdlbmVfdGVzdFsxXX07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBnZW5lX3Rlc3RbMF0gKyBcIiBcIiArIGdlbmVfdGVzdFsxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9XG5cdFx0XHQvLyBzdGF0dXMsIDAgPSB1bnNwZWNpZmllZCwgTiA9IG5lZ2F0aXZlLCBQID0gcG9zaXRpdmVcblx0XHRcdGxldCBwYXRoX3Rlc3QgPSBhdHRyW2lkeF0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cGF0aF90ZXN0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHBhdGhfdGVzdFtqXSAhPT0gJzAnKSB7XG5cdFx0XHRcdFx0aWYocGF0aF90ZXN0W2pdID09PSAnTicgfHwgcGF0aF90ZXN0W2pdID09PSAnUCcpXG5cdFx0XHRcdFx0XHRpbmRpW3BhdGhvbG9neV90ZXN0c1tqXSArICdfYmNfcGF0aG9sb2d5J10gPSBwYXRoX3Rlc3Rbal07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgUEFUSE9MT0dZIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgK3BhdGhvbG9neV90ZXN0c1tqXSArIFwiIFwiICtwYXRoX3Rlc3Rbal0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBbaGRyLCBwcm9jZXNzX3BlZChwZWQpXTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRyZXR1cm4gW2hkciwgcGVkXTtcblx0fVxufVxuXG4vLyByZWFkIGJvYWRpY2VhIGZvcm1hdCB2NCAmIHYyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEJvYWRpY2VhVjQoYm9hZGljZWFfbGluZXMsIHZlcnNpb24pIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHQvLyBhc3N1bWVzIHR3byBsaW5lIGhlYWRlclxuXHRmb3IobGV0IGkgPSAyO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0ICAgbGV0IGF0dHIgPSAkLm1hcChsaW5lc1tpXS50cmltKCkuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cdFx0aWYoYXR0ci5sZW5ndGggPiAxKSB7XG5cdFx0XHRsZXQgaW5kaSA9IHtcblx0XHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdFx0J2Rpc3BsYXlfbmFtZSc6IGF0dHJbMV0sXG5cdFx0XHRcdCduYW1lJzpcdGF0dHJbM10sXG5cdFx0XHRcdCdzZXgnOiBhdHRyWzZdLFxuXHRcdFx0XHQnc3RhdHVzJzogYXR0cls4XVxuXHRcdFx0fTtcblx0XHRcdGlmKGF0dHJbMl0gPT0gMSkgaW5kaS5wcm9iYW5kID0gdHJ1ZTtcblx0XHRcdGlmKGF0dHJbNF0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbNF07XG5cdFx0XHRpZihhdHRyWzVdICE9PSBcIjBcIikgaW5kaS5tb3RoZXIgPSBhdHRyWzVdO1xuXHRcdFx0aWYoYXR0cls3XSAhPT0gXCIwXCIpIGluZGkubXp0d2luID0gYXR0cls3XTtcblx0XHRcdGlmKGF0dHJbOV0gIT09IFwiMFwiKSBpbmRpLmFnZSA9IGF0dHJbOV07XG5cdFx0XHRpZihhdHRyWzEwXSAhPT0gXCIwXCIpIGluZGkueW9iID0gYXR0clsxMF07XG5cblx0XHRcdGxldCBpZHggPSAxMTtcblx0XHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdFx0Ly8gQWdlIGF0IDFzdCBjYW5jZXIgb3IgMCA9IHVuYWZmZWN0ZWQsIEFVID0gdW5rbm93biBhZ2UgYXQgZGlhZ25vc2lzIChhZmZlY3RlZCB1bmtub3duKVxuXHRcdFx0XHRpZihhdHRyW2lkeF0gIT09IFwiMFwiKSB7XG5cdFx0XHRcdFx0aW5kaVtkaWFnbm9zaXNfYWdlXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZHgrKztcblx0XHRcdH0pO1xuXG5cdFx0XHRpZih2ZXJzaW9uID09PSA0KSB7XG5cdFx0XHRcdGlmKGF0dHJbaWR4KytdICE9PSBcIjBcIikgaW5kaS5hc2hrZW5hemkgPSAxO1xuXHRcdFx0XHQvLyBCUkNBMSwgQlJDQTIsIFBBTEIyLCBBVE0sIENIRUsyIGdlbmV0aWMgdGVzdHNcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHR5cGUsIDAgPSB1bnRlc3RlZCwgUyA9IG11dGF0aW9uIHNlYXJjaCwgVCA9IGRpcmVjdCBnZW5lIHRlc3Rcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHJlc3VsdCwgMCA9IHVudGVzdGVkLCBQID0gcG9zaXRpdmUsIE4gPSBuZWdhdGl2ZVxuXHRcdFx0XHRmb3IobGV0IGo9MDsgajw1OyBqKyspIHtcblx0XHRcdFx0XHRpZHgrPTI7XG5cdFx0XHRcdFx0aWYoYXR0cltpZHgtMl0gIT09ICcwJykge1xuXHRcdFx0XHRcdFx0aWYoKGF0dHJbaWR4LTJdID09PSAnUycgfHwgYXR0cltpZHgtMl0gPT09ICdUJykgJiYgKGF0dHJbaWR4LTFdID09PSAnUCcgfHwgYXR0cltpZHgtMV0gPT09ICdOJykpXG5cdFx0XHRcdFx0XHRcdGluZGlbZ2VuZXRpY190ZXN0W2pdICsgJ19nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogYXR0cltpZHgtMV19O1xuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1VOUkVDT0dOSVNFRCBHRU5FIFRFU1QgT04gTElORSAnKyAoaSsxKSArIFwiOiBcIiArIGF0dHJbaWR4LTJdICsgXCIgXCIgKyBhdHRyW2lkeC0xXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHZlcnNpb24gPT09IDIpIHtcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IEJSQ0ExLCBCUkNBMlxuXHRcdFx0XHQvLyB0eXBlLCAwID0gdW50ZXN0ZWQsIFMgPSBtdXRhdGlvbiBzZWFyY2gsIFQgPSBkaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdC8vIHJlc3VsdCwgMCA9IHVudGVzdGVkLCBOID0gbm8gbXV0YXRpb24sIDEgPSBCUkNBMSBwb3NpdGl2ZSwgMiA9IEJSQ0EyIHBvc2l0aXZlLCAzID0gQlJDQTEvMiBwb3NpdGl2ZVxuXHRcdFx0XHRpZHgrPTI7IFx0Ly8gZ3Rlc3Rcblx0XHRcdFx0aWYoYXR0cltpZHgtMl0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKChhdHRyW2lkeC0yXSA9PT0gJ1MnIHx8IGF0dHJbaWR4LTJdID09PSAnVCcpKSB7XG5cdFx0XHRcdFx0XHRpZihhdHRyW2lkeC0xXSA9PT0gJ04nKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnTid9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzEnKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnUCd9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzInKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnTid9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzMnKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnUCd9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBhdHRyW2lkeC0yXSArIFwiIFwiICsgYXR0cltpZHgtMV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gc3RhdHVzLCAwID0gdW5zcGVjaWZpZWQsIE4gPSBuZWdhdGl2ZSwgUCA9IHBvc2l0aXZlXG5cdFx0XHRmb3IobGV0IGo9MDsgajxwYXRob2xvZ3lfdGVzdHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoYXR0cltpZHhdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZihhdHRyW2lkeF0gPT09ICdOJyB8fCBhdHRyW2lkeF0gPT09ICdQJylcblx0XHRcdFx0XHRcdGluZGlbcGF0aG9sb2d5X3Rlc3RzW2pdICsgJ19iY19wYXRob2xvZ3knXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1VOUkVDT0dOSVNFRCBQQVRIT0xPR1kgT04gTElORSAnKyAoaSsxKSArIFwiOiBcIiArcGF0aG9sb2d5X3Rlc3RzW2pdICsgXCIgXCIgK2F0dHJbaWR4XSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9XG5cdFx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBwcm9jZXNzX3BlZChwZWQpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdHJldHVybiBwZWQ7XG5cdH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc19wZWQocGVkKSB7XG5cdC8vIGZpbmQgdGhlIGxldmVsIG9mIGluZGl2aWR1YWxzIGluIHRoZSBwZWRpZ3JlZVxuXHRmb3IobGV0IGo9MDtqPDI7aisrKSB7XG5cdFx0Zm9yKGxldCBpPTA7aTxwZWQubGVuZ3RoO2krKykge1xuXHRcdFx0Z2V0TGV2ZWwocGVkLCBwZWRbaV0ubmFtZSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gZmluZCB0aGUgbWF4IGxldmVsIChpLmUuIHRvcF9sZXZlbClcblx0bGV0IG1heF9sZXZlbCA9IDA7XG5cdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRbaV0ubGV2ZWwgJiYgcGVkW2ldLmxldmVsID4gbWF4X2xldmVsKVxuXHRcdFx0bWF4X2xldmVsID0gcGVkW2ldLmxldmVsO1xuXHR9XG5cblx0Ly8gaWRlbnRpZnkgdG9wX2xldmVsIGFuZCBvdGhlciBub2RlcyB3aXRob3V0IHBhcmVudHNcblx0Zm9yKGxldCBpPTA7aTxwZWQubGVuZ3RoO2krKykge1xuXHRcdGlmKHBlZGlncmVlX3V0aWwuZ2V0RGVwdGgocGVkLCBwZWRbaV0ubmFtZSkgPT0gMSkge1xuXHRcdFx0aWYocGVkW2ldLmxldmVsICYmIHBlZFtpXS5sZXZlbCA9PSBtYXhfbGV2ZWwpIHtcblx0XHRcdFx0cGVkW2ldLnRvcF9sZXZlbCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwZWRbaV0ubm9wYXJlbnRzID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyAxLiBsb29rIGZvciBwYXJ0bmVycyBwYXJlbnRzXG5cdFx0XHRcdGxldCBwaWR4ID0gZ2V0UGFydG5lcklkeChwZWQsIHBlZFtpXSk7XG5cdFx0XHRcdGlmKHBpZHggPiAtMSkge1xuXHRcdFx0XHRcdGlmKHBlZFtwaWR4XS5tb3RoZXIpIHtcblx0XHRcdFx0XHRcdHBlZFtpXS5tb3RoZXIgPSBwZWRbcGlkeF0ubW90aGVyO1xuXHRcdFx0XHRcdFx0cGVkW2ldLmZhdGhlciA9IHBlZFtwaWR4XS5mYXRoZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gMi4gb3IgYWRvcHQgcGFyZW50cyBmcm9tIGxldmVsIGFib3ZlXG5cdFx0XHRcdGlmKCFwZWRbaV0ubW90aGVyKXtcblx0XHRcdFx0XHRmb3IobGV0IGo9MDsgajxwZWQubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRcdGlmKHBlZFtpXS5sZXZlbCA9PSAocGVkW2pdLmxldmVsLTEpKSB7XG5cdFx0XHRcdFx0XHRcdHBpZHggPSBnZXRQYXJ0bmVySWR4KHBlZCwgcGVkW2pdKTtcblx0XHRcdFx0XHRcdFx0aWYocGlkeCA+IC0xKSB7XG5cdFx0XHRcdFx0XHRcdFx0cGVkW2ldLm1vdGhlciA9IChwZWRbal0uc2V4ID09PSAnRicgPyBwZWRbal0ubmFtZSA6IHBlZFtwaWR4XS5uYW1lKTtcblx0XHRcdFx0XHRcdFx0XHRwZWRbaV0uZmF0aGVyID0gKHBlZFtqXS5zZXggPT09ICdNJyA/IHBlZFtqXS5uYW1lIDogcGVkW3BpZHhdLm5hbWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSBwZWRbaV0udG9wX2xldmVsO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcGVkO1xufVxuXG4vLyBnZXQgdGhlIHBhcnRuZXJzIGZvciBhIGdpdmVuIG5vZGVcbmZ1bmN0aW9uIGdldFBhcnRuZXJJZHgoZGF0YXNldCwgYW5vZGUpIHtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBibm9kZSA9IGRhdGFzZXRbaV07XG5cdFx0aWYoYW5vZGUubmFtZSA9PT0gYm5vZGUubW90aGVyKVxuXHRcdFx0cmV0dXJuIHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGJub2RlLmZhdGhlcik7XG5cdFx0ZWxzZSBpZihhbm9kZS5uYW1lID09PSBibm9kZS5mYXRoZXIpXG5cdFx0XHRyZXR1cm4gcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgYm5vZGUubW90aGVyKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbi8vIGZvciBhIGdpdmVuIGluZGl2aWR1YWwgYXNzaWduIGxldmVscyB0byBhIHBhcmVudHMgYW5jZXN0b3JzXG5mdW5jdGlvbiBnZXRMZXZlbChkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGxldmVsID0gKGRhdGFzZXRbaWR4XS5sZXZlbCA/IGRhdGFzZXRbaWR4XS5sZXZlbCA6IDApO1xuXHR1cGRhdGVfcGFyZW50c19sZXZlbChpZHgsIGxldmVsLCBkYXRhc2V0KTtcbn1cblxuLy8gcmVjdXJzaXZlbHkgdXBkYXRlIHBhcmVudHMgbGV2ZWxzXG5mdW5jdGlvbiB1cGRhdGVfcGFyZW50c19sZXZlbChpZHgsIGxldmVsLCBkYXRhc2V0KSB7XG5cdGxldCBwYXJlbnRzID0gWydtb3RoZXInLCAnZmF0aGVyJ107XG5cdGxldmVsKys7XG5cdGZvcihsZXQgaT0wOyBpPHBhcmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGlkeCA9IHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XVtwYXJlbnRzW2ldXSk7XG5cdFx0aWYocGlkeCA+PSAwKSB7XG5cdFx0XHRsZXQgbWEgPSBkYXRhc2V0W3BlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XS5tb3RoZXIpXTtcblx0XHRcdGxldCBwYSA9IGRhdGFzZXRbcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLmZhdGhlcildO1xuXHRcdFx0aWYoIWRhdGFzZXRbcGlkeF0ubGV2ZWwgfHwgZGF0YXNldFtwaWR4XS5sZXZlbCA8IGxldmVsKSB7XG5cdFx0XHRcdG1hLmxldmVsID0gbGV2ZWw7XG5cdFx0XHRcdHBhLmxldmVsID0gbGV2ZWw7XG5cdFx0XHR9XG5cblx0XHRcdGlmKG1hLmxldmVsIDwgcGEubGV2ZWwpIHtcblx0XHRcdFx0bWEubGV2ZWwgPSBwYS5sZXZlbDtcblx0XHRcdH0gZWxzZSBpZihwYS5sZXZlbCA8IG1hLmxldmVsKSB7XG5cdFx0XHRcdHBhLmxldmVsID0gbWEubGV2ZWw7XG5cdFx0XHR9XG5cdFx0XHR1cGRhdGVfcGFyZW50c19sZXZlbChwaWR4LCBsZXZlbCwgZGF0YXNldCk7XG5cdFx0fVxuXHR9XG59XG4iLCIvLyBwZWRpZ3JlZSBmb3JtXG5pbXBvcnQge3JlYnVpbGQsIHN5bmNUd2luc30gZnJvbSAnLi9wZWRpZ3JlZS5qcyc7XG5pbXBvcnQge2NvcHlfZGF0YXNldCwgc2V0UHJvYmFuZCwgZ2V0SWR4QnlOYW1lLCBnZXROb2RlQnlOYW1lfSBmcm9tICcuL3BlZGlncmVlX3V0aWxzLmpzJztcbmltcG9ydCB7Y3VycmVudCBhcyBwZWRjYWNoZV9jdXJyZW50fSBmcm9tICcuL3BlZGNhY2hlLmpzJztcblxuJChcIiNzZWxlY3RfYWxsX2dlbmVfdGVzdHNcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uIChfZSkge1xuXHRpZih0aGlzLnZhbHVlID09PSBcIlNcIikge1xuXHRcdC8vIHNlbGVjdCBhbGwgbXV0YXRpb24gc2VhcmNoIHRvIGJlIG5lZ2F0aXZlXG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdCddXCIpLnZhbChcIlNcIikuY2hhbmdlKCk7XG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdF9yZXN1bHQnXVwiKS52YWwoXCJOXCIpLmNoYW5nZSgpO1xuXHR9IGVsc2UgaWYodGhpcy52YWx1ZSA9PT0gXCJUXCIpIHtcblx0XHQvLyBzZWxlY3QgYWxsIGRpcmVjdCBnZW5lIHRlc3RzIHRvIGJlIG5lZ2F0aXZlXG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdCddXCIpLnZhbChcIlRcIikuY2hhbmdlKCk7XG5cdFx0JChcIiNnZW5lX3Rlc3RcIikuZmluZChcInNlbGVjdFtuYW1lJD0nX2dlbmVfdGVzdF9yZXN1bHQnXVwiKS52YWwoXCJOXCIpLmNoYW5nZSgpO1xuXHR9IGVsc2UgaWYodGhpcy52YWx1ZSA9PT0gXCJOXCIpIHtcblx0XHQvLyBzZWxlY3QgYWxsIGdlbmUgdGVzdHMgdG8gYmUgbmVnYXRpdmVcblx0XHQkKFwiI2dlbmVfdGVzdFwiKS5maW5kKFwic2VsZWN0W25hbWUkPSdfZ2VuZV90ZXN0X3Jlc3VsdCddXCIpLnZhbChcIk5cIikuY2hhbmdlKCk7XG5cdH0gZWxzZSBpZih0aGlzLnZhbHVlID09PSBcInJlc2V0XCIpIHtcblx0XHQkKFwiI2dlbmVfdGVzdFwiKS5maW5kKFwic2VsZWN0W25hbWUkPSdfZ2VuZV90ZXN0J11cIikudmFsKFwiLVwiKS5jaGFuZ2UoKTtcblx0XHQkKFwiI2dlbmVfdGVzdFwiKS5maW5kKFwic2VsZWN0W25hbWUkPSdfZ2VuZV90ZXN0X3Jlc3VsdCddXCIpLnZhbChcIi1cIikuY2hhbmdlKCk7XG5cdH1cbn0pO1xuXG4kKCcjYWNjX0ZhbUhpc3RfZGl2Jykub24oJ2NsaWNrJywgJyNpZF9wcm9iYW5kLCAjaWRfZXhjbHVkZScsIGZ1bmN0aW9uKF9lKSB7XG5cdGxldCBuYW1lID0gJCgnI2lkX25hbWUnKS52YWwoKTtcblx0aWYoJCh0aGlzKS5hdHRyKFwiaWRcIikgPT09ICdpZF9wcm9iYW5kJyAmJiAkKHRoaXMpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0bGV0IG1zZyA9ICQoXCIjcHJvYmFuZF9zd2l0Y2hfZGlhbG9nXCIpLnRleHQoKTtcblxuXHRcdCQoJzxkaXYgaWQ9XCJtc2dEaWFsb2dcIj4nK21zZysnPC9kaXY+JykuZGlhbG9nKHtcblx0XHRcdHRpdGxlOiAkKFwiI3Byb2JhbmRfc3dpdGNoX2RpYWxvZ1wiKS5kYXRhKFwidGl0bGVcIiksXG5cdFx0XHR3aWR0aDogMzUwLFxuXHRcdFx0YnV0dG9uczogW3tcblx0XHRcdFx0XHR0ZXh0OiAkKFwiI3Byb2JhbmRfc3dpdGNoX2RpYWxvZ1wiKS5kYXRhKFwiY29udGludWVcIiksXG5cdFx0XHRcdFx0Y2xpY2s6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJyk7XG5cdFx0XHRcdFx0XHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdFx0XHRcdFx0XHRzZXRQcm9iYW5kKG9wdHMuZGF0YXNldCwgbmFtZSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdFx0XHRcdFx0cmVzZXRfbl9zeW5jKG9wdHMpO1xuXHRcdFx0XHRcdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LHtcblx0XHRcdFx0XHR0ZXh0OiAkKFwiI3Byb2JhbmRfc3dpdGNoX2RpYWxvZ1wiKS5kYXRhKFwiY2FuY2VsXCIpLFxuXHRcdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCAkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHRcdCAkKFwiI2lkX3Byb2JhbmRcIikucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHRcdFx0XHRcdCAkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XVxuXHRcdH0pO1xuXHR9IGVsc2UgaWYoJCh0aGlzKS5hdHRyKFwiaWRcIikgPT09ICdpZF9leGNsdWRlJykge1xuXHRcdGxldCBkYXRhc2V0ID0gcGVkY2FjaGVfY3VycmVudChvcHRzKTtcblx0XHRvcHRzLmRhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdFx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIG5hbWUpO1xuXHRcdGlmKCQodGhpcykuaXMoJzpjaGVja2VkJykpXG5cdFx0XHRvcHRzLmRhdGFzZXRbaWR4XS5leGNsdWRlID0gdHJ1ZTtcblx0XHRlbHNlXG5cdFx0XHRkZWxldGUgb3B0cy5kYXRhc2V0W2lkeF0uZXhjbHVkZTtcblx0XHRyZWJ1aWxkKG9wdHMpO1xuXHR9XG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZShvcHRzKSB7XG5cdCQoJy5ub2RlX3NhdmUnKS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRzYXZlKG9wdHMpO1xuXHR9KTtcblxuXHQvLyBhZHZhbmNlZCBvcHRpb25zIC0gbW9kZWwgcGFyYW1ldGVyc1xuXHQkKFwiaW5wdXRbaWQkPSdfbXV0X3NlbnNpdGl2aXR5J10sIGlucHV0W2lkJD0nX211dF9mcmVxdWVuY3knXVwiKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXHQkKCcjaWRfdXNlX2N1c3RvbV9tdXRhdGlvbl9zZW5zaXRpdml0aWVzJykuY2hhbmdlKGZ1bmN0aW9uKCkge1xuXHRcdCQoXCJpbnB1dFtpZCQ9J19tdXRfc2Vuc2l0aXZpdHknXVwiKS5wcm9wKCdkaXNhYmxlZCcsICEkKHRoaXMpLmlzKFwiOmNoZWNrZWRcIikpO1xuXHR9KTtcblxuXHQkKCcjaWRfbXV0YXRpb25fZnJlcXVlbmNpZXMnKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0JChcImlucHV0W2lkJD0nX211dF9mcmVxdWVuY3knXVwiKS5wcm9wKCdkaXNhYmxlZCcsICh0aGlzLnZhbHVlICE9PSAnQ3VzdG9tJykpO1xuXHRcdC8vIG5vdGUgcGVkaWdyZWVfZm9ybS5tdXRhdGlvbl9mcmVxdWVuY2llcyBpcyBzZXQgaW4gdGhlIHZpZXcgc2VlIHBlZGlncmVlX3NlY3Rpb25fanMuaHRtbFxuXHRcdGlmKHBlZGlncmVlX2Zvcm0uYmNfbXV0YXRpb25fZnJlcXVlbmNpZXMgJiYgdGhpcy52YWx1ZSAhPT0gJ0N1c3RvbScpIHtcblx0XHRcdGxldCBiY21mcmVxID0gcGVkaWdyZWVfZm9ybS5iY19tdXRhdGlvbl9mcmVxdWVuY2llc1t0aGlzLnZhbHVlXTtcblx0XHRcdGZvciAobGV0IGdlbmUgaW4gYmNtZnJlcSlcblx0XHRcdFx0JCgnI2lkXycrZ2VuZS50b0xvd2VyQ2FzZSgpKydfYmNfbXV0X2ZyZXF1ZW5jeScpLnZhbChiY21mcmVxW2dlbmVdKTtcblxuXHRcdFx0bGV0IG9iY21mcmVxID0gcGVkaWdyZWVfZm9ybS5vY19tdXRhdGlvbl9mcmVxdWVuY2llc1t0aGlzLnZhbHVlXTtcblx0XHRcdGZvciAobGV0IGdlbmUgaW4gb2JjbWZyZXEpXG5cdFx0XHRcdCQoJyNpZF8nK2dlbmUudG9Mb3dlckNhc2UoKSsnX29jX211dF9mcmVxdWVuY3knKS52YWwob2JjbWZyZXFbZ2VuZV0pO1xuXHRcdH1cblxuXHRcdGlmKHRoaXMudmFsdWUgPT09ICdBc2hrZW5hemknKSB7ICAvLyB1cGRhdGUgY2FucmlzayBGSCByYWRpbyBzZXR0aW5nc1xuXHRcdFx0JCgnI29yaWdfYXNoaycpLnByb3AoIFwiY2hlY2tlZFwiLCB0cnVlICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQoJyNvcmlnX3VuaycpLnByb3AoIFwiY2hlY2tlZFwiLCB0cnVlICk7XG5cdFx0fVxuXHRcdHNhdmVfYXNoa24ob3B0cyk7IC8vIHNhdmUgYXNoa2VuYXppIHVwZGF0ZXNcblx0fSk7XG59XG5cbi8vIGhhbmRsZSBmYW1pbHkgaGlzdG9yeSBjaGFuZ2UgZXZlbnRzICh1bmRvL3JlZG8vZGVsZXRlKVxuJChkb2N1bWVudCkub24oJ2ZoQ2hhbmdlJywgZnVuY3Rpb24oZSwgb3B0cyl7XG5cdHRyeSB7XG5cdFx0bGV0IGlkID0gJCgnI2lkX25hbWUnKS52YWwoKTsgIC8vIGdldCBuYW1lIGZyb20gaGlkZGVuIGZpZWxkXG5cdFx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlX2N1cnJlbnQob3B0cyksIGlkKVxuXHRcdGlmKG5vZGUgPT09IHVuZGVmaW5lZClcblx0XHRcdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcblx0XHRlbHNlXG5cdFx0XHQkKCdmb3JtID4gZmllbGRzZXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oZXJyKTtcblx0fVxufSlcblxuLy8gdXBkYXRlIHN0YXR1cyBmaWVsZCBhbmQgYWdlIGxhYmVsIC0gMCA9IGFsaXZlLCAxID0gZGVhZFxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhzdGF0dXMpIHtcblx0JCgnI2FnZV95b2JfbG9jaycpLnJlbW92ZUNsYXNzKCdmYS1sb2NrIGZhLXVubG9jay1hbHQnKTtcblx0KHN0YXR1cyA9PSAxID8gJCgnI2FnZV95b2JfbG9jaycpLmFkZENsYXNzKCdmYS11bmxvY2stYWx0JykgOiAkKCcjYWdlX3lvYl9sb2NrJykuYWRkQ2xhc3MoJ2ZhLWxvY2snKSk7XG5cdCQoJyNpZF9hZ2VfJytzdGF0dXMpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuXHQkKCcjaWRfYWdlXycrKHN0YXR1cyA9PSAxID8gJzAnIDogJzEnKSkuYWRkQ2xhc3MoXCJoaWRkZW5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlY2xpY2sobm9kZSkge1xuXHQkKCdmb3JtID4gZmllbGRzZXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblx0Ly8gY2xlYXIgdmFsdWVzXG5cdCQoJyNwZXJzb25fZGV0YWlscycpLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLCBpbnB1dFt0eXBlPW51bWJlcl1cIikudmFsKFwiXCIpO1xuXHQkKCcjcGVyc29uX2RldGFpbHMgc2VsZWN0JykudmFsKCcnKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXG5cdC8vIGFzc2lnbiB2YWx1ZXMgdG8gaW5wdXQgZmllbGRzIGluIGZvcm1cblx0aWYobm9kZS5zZXggPT09ICdNJyB8fCBub2RlLnNleCA9PT0gJ0YnKVxuXHRcdCQoJ2lucHV0W25hbWU9c2V4XVt2YWx1ZT1cIicrbm9kZS5zZXgrJ1wiXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcblx0ZWxzZVxuXHRcdCQoJ2lucHV0W25hbWU9c2V4XScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdHVwZGF0ZV9jYW5jZXJfYnlfc2V4KG5vZGUpO1xuXG5cdGlmKCEoJ3N0YXR1cycgaW4gbm9kZSkpXG5cdFx0bm9kZS5zdGF0dXMgPSAwO1xuXHQkKCdpbnB1dFtuYW1lPXN0YXR1c11bdmFsdWU9XCInK25vZGUuc3RhdHVzKydcIl0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cdC8vIHNob3cgbG9jayBzeW1ib2wgZm9yIGFnZSBhbmQgeW9iIHN5bmNocm9uaXNhdGlvblxuXHR1cGRhdGVTdGF0dXMobm9kZS5zdGF0dXMpO1xuXG5cdGlmKCdwcm9iYW5kJyBpbiBub2RlKSB7XG5cdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKCdjaGVja2VkJywgbm9kZS5wcm9iYW5kKTtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcblx0fSBlbHNlIHtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKFwiZGlzYWJsZWRcIiwgISgneW9iJyBpbiBub2RlKSlcblx0fVxuXG5cdGlmKCdleGNsdWRlJyBpbiBub2RlKSB7XG5cdFx0JCgnI2lkX2V4Y2x1ZGUnKS5wcm9wKCdjaGVja2VkJywgbm9kZS5leGNsdWRlKTtcblx0fSBlbHNlIHtcblx0XHQkKCcjaWRfZXhjbHVkZScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdH1cblxuLypcdFx0aWYoJ2FzaGtlbmF6aScgaW4gbm9kZSkge1xuXHRcdFx0JCgnI2lkX2FzaGtlbmF6aScpLnByb3AoJ2NoZWNrZWQnLCAobm9kZS5wcm9iYW5kID09IDEgPyB0cnVlOiBmYWxzZSkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkKCcjaWRfYXNoa2VuYXppJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHR9Ki9cblxuXHQvLyB5ZWFyIG9mIGJpcnRoXG5cdGlmKCd5b2InIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfeW9iXzAnKS52YWwobm9kZS55b2IpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF95b2JfMCcpLnZhbCgnLScpO1xuXHR9XG5cblx0Ly8gY2xlYXIgcGF0aG9sb2d5XG5cdCQoJ3NlbGVjdFtuYW1lJD1cIl9iY19wYXRob2xvZ3lcIl0nKS52YWwoJy0nKTtcblx0Ly8gY2xlYXIgZ2VuZSB0ZXN0c1xuXHQkKCdzZWxlY3RbbmFtZSo9XCJfZ2VuZV90ZXN0XCJdJykudmFsKCctJyk7XG5cblx0Ly8gZGlzYWJsZSBzZXggcmFkaW8gYnV0dG9ucyBpZiB0aGUgcGVyc29uIGhhcyBhIHBhcnRuZXJcblx0JChcImlucHV0W2lkXj0naWRfc2V4XyddXCIpLnByb3AoXCJkaXNhYmxlZFwiLCAobm9kZS5wYXJlbnRfbm9kZSAmJiBub2RlLnNleCAhPT0gJ1UnID8gdHJ1ZSA6IGZhbHNlKSk7XG5cblx0Ly8gZGlzYWJsZSBwYXRob2xvZ3kgZm9yIG1hbGUgcmVsYXRpdmVzIChhcyBub3QgdXNlZCBieSBtb2RlbClcblx0Ly8gYW5kIGlmIG5vIGJyZWFzdCBjYW5jZXIgYWdlIG9mIGRpYWdub3Npc1xuXHQkKFwic2VsZWN0W2lkJD0nX2JjX3BhdGhvbG9neSddXCIpLnByb3AoXCJkaXNhYmxlZFwiLFxuXHRcdFx0KG5vZGUuc2V4ID09PSAnTScgfHwgKG5vZGUuc2V4ID09PSAnRicgJiYgISgnYnJlYXN0X2NhbmNlcl9kaWFnbm9zaXNfYWdlJyBpbiBub2RlKSkgPyB0cnVlIDogZmFsc2UpKTtcblxuXHQvLyBhcHByb3hpbWF0ZSBkaWFnbm9zaXMgYWdlXG5cdCQoJyNpZF9hcHByb3gnKS5wcm9wKCdjaGVja2VkJywgKG5vZGUuYXBwcm94X2RpYWdub3Npc19hZ2UgPyB0cnVlOiBmYWxzZSkpO1xuXHR1cGRhdGVfZGlhZ25vc2lzX2FnZV93aWRnZXQoKTtcblxuXHRmb3IobGV0IGtleSBpbiBub2RlKSB7XG5cdFx0aWYoa2V5ICE9PSAncHJvYmFuZCcgJiYga2V5ICE9PSAnc2V4Jykge1xuXHRcdFx0aWYoJCgnI2lkXycra2V5KS5sZW5ndGgpIHtcdC8vIGlucHV0IHZhbHVlXG5cdFx0XHRcdGlmKGtleS5pbmRleE9mKCdfZ2VuZV90ZXN0JykgICE9PSAtMSAmJiBub2RlW2tleV0gIT09IG51bGwgJiYgdHlwZW9mIG5vZGVba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkpLnZhbChub2RlW2tleV0udHlwZSk7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KydfcmVzdWx0JykudmFsKG5vZGVba2V5XS5yZXN1bHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSkudmFsKG5vZGVba2V5XSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihrZXkuaW5kZXhPZignX2RpYWdub3Npc19hZ2UnKSAhPT0gLTEpIHtcblx0XHRcdFx0aWYoJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpIHtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkrJ18xJykudmFsKHJvdW5kNShub2RlW2tleV0pKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSsnXzAnKS52YWwobm9kZVtrZXldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRyeSB7XG5cdFx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZCgnZm9ybScpLnZhbGlkKCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0Y29uc29sZS53YXJuKCd2YWxpZCgpIG5vdCBmb3VuZCcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KSB7XG5cdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdGlmKCQoJyNvcmlnX2FzaGsnKS5pcygnOmNoZWNrZWQnKSkge1xuXHRcdCQuZWFjaChuZXdkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihwLnByb2JhbmQpXG5cdFx0XHRcdHAuYXNoa2VuYXppID0gMTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkLmVhY2gobmV3ZGF0YXNldCwgZnVuY3Rpb24oaSwgcCkge1xuXHRcdFx0ZGVsZXRlIHAuYXNoa2VuYXppO1xuXHRcdH0pO1xuXHR9XG59XG5cbi8vIFNhdmUgQXNoa2VuYXppIHN0YXR1c1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfYXNoa24ob3B0cykge1xuXHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHR1cGRhdGVfYXNoa24obmV3ZGF0YXNldCk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9wdHMpIHtcblx0bGV0IGRhdGFzZXQgPSBwZWRjYWNoZV9jdXJyZW50KG9wdHMpO1xuXHRsZXQgbmFtZSA9ICQoJyNpZF9uYW1lJykudmFsKCk7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHRsZXQgcGVyc29uID0gZ2V0Tm9kZUJ5TmFtZShuZXdkYXRhc2V0LCBuYW1lKTtcblx0aWYoIXBlcnNvbikge1xuXHRcdGNvbnNvbGUud2FybigncGVyc29uIG5vdCBmb3VuZCB3aGVuIHNhdmluZyBkZXRhaWxzJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdCQoXCIjXCIrb3B0cy50YXJnZXREaXYpLmVtcHR5KCk7XG5cblx0Ly8gaW5kaXZpZHVhbCdzIHBlcnNvbmFsIGFuZCBjbGluaWNhbCBkZXRhaWxzXG5cdGxldCB5b2IgPSAkKCcjaWRfeW9iXzAnKS52YWwoKTtcblx0aWYoeW9iICYmIHlvYiAhPT0gJycpIHtcblx0XHRwZXJzb24ueW9iID0geW9iO1xuXHR9IGVsc2Uge1xuXHRcdGRlbGV0ZSBwZXJzb24ueW9iO1xuXHR9XG5cblx0Ly8gY3VycmVudCBzdGF0dXM6IDAgPSBhbGl2ZSwgMSA9IGRlYWRcblx0bGV0IHN0YXR1cyA9ICQoJyNpZF9zdGF0dXMnKS5maW5kKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIpO1xuXHRpZihzdGF0dXMubGVuZ3RoID4gMCl7XG5cdFx0cGVyc29uLnN0YXR1cyA9IHN0YXR1cy52YWwoKTtcblx0fVxuXG5cdC8vIGJvb2xlYW5zIHN3aXRjaGVzXG5cdGxldCBzd2l0Y2hlcyA9IFtcIm1pc2NhcnJpYWdlXCIsIFwiYWRvcHRlZF9pblwiLCBcImFkb3B0ZWRfb3V0XCIsIFwidGVybWluYXRpb25cIiwgXCJzdGlsbGJpcnRoXCJdO1xuXHRmb3IobGV0IGlzd2l0Y2g9MDsgaXN3aXRjaDxzd2l0Y2hlcy5sZW5ndGg7IGlzd2l0Y2grKyl7XG5cdFx0bGV0IGF0dHIgPSBzd2l0Y2hlc1tpc3dpdGNoXTtcblx0XHRsZXQgcyA9ICQoJyNpZF8nK2F0dHIpO1xuXHRcdGlmKHMubGVuZ3RoID4gMCl7XG5cdFx0XHRjb25zb2xlLmxvZyhzLmlzKFwiOmNoZWNrZWRcIikpO1xuXHRcdFx0aWYocy5pcyhcIjpjaGVja2VkXCIpKVxuXHRcdFx0XHRwZXJzb25bYXR0cl0gPSB0cnVlO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkZWxldGUgcGVyc29uW2F0dHJdO1xuXHRcdH1cblx0fVxuXG5cdC8vIGN1cnJlbnQgc2V4XG5cdGxldCBzZXggPSAkKCcjaWRfc2V4JykuZmluZChcImlucHV0W3R5cGU9J3JhZGlvJ106Y2hlY2tlZFwiKTtcblx0aWYoc2V4Lmxlbmd0aCA+IDApe1xuXHRcdHBlcnNvbi5zZXggPSBzZXgudmFsKCk7XG5cdFx0dXBkYXRlX2NhbmNlcl9ieV9zZXgocGVyc29uKTtcblx0fVxuXG5cdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KTtcblxuXHRpZigkKCcjaWRfYXBwcm94JykuaXMoJzpjaGVja2VkJykpIC8vIGFwcHJveGltYXRlIGRpYWdub3NpcyBhZ2Vcblx0XHRwZXJzb24uYXBwcm94X2RpYWdub3Npc19hZ2UgPSB0cnVlO1xuXHRlbHNlXG5cdFx0ZGVsZXRlIHBlcnNvbi5hcHByb3hfZGlhZ25vc2lzX2FnZTtcblxuXHQkKFwiI3BlcnNvbl9kZXRhaWxzIHNlbGVjdFtuYW1lKj0nX2RpYWdub3Npc19hZ2UnXTp2aXNpYmxlLCAjcGVyc29uX2RldGFpbHMgaW5wdXRbdHlwZT10ZXh0XTp2aXNpYmxlLCAjcGVyc29uX2RldGFpbHMgaW5wdXRbdHlwZT1udW1iZXJdOnZpc2libGVcIikuZWFjaChmdW5jdGlvbigpIHtcblx0XHRsZXQgbmFtZSA9ICh0aGlzLm5hbWUuaW5kZXhPZihcIl9kaWFnbm9zaXNfYWdlXCIpPi0xID8gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpOiB0aGlzLm5hbWUpO1xuXG5cdFx0aWYoJCh0aGlzKS52YWwoKSkge1xuXHRcdFx0bGV0IHZhbCA9ICQodGhpcykudmFsKCk7XG5cdFx0XHRpZihuYW1lLmluZGV4T2YoXCJfZGlhZ25vc2lzX2FnZVwiKSA+IC0xICYmICQoXCIjaWRfYXBwcm94XCIpLmlzKCc6Y2hlY2tlZCcpKVxuXHRcdFx0XHR2YWwgPSByb3VuZDUodmFsKTtcblx0XHRcdHBlcnNvbltuYW1lXSA9IHZhbDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHBlcnNvbltuYW1lXTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGNhbmNlciBjaGVja2JveGVzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZSQ9XCJjYW5jZXJcIl0saW5wdXRbdHlwZT1cImNoZWNrYm94XCJdW25hbWUkPVwiY2FuY2VyMlwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5jaGVja2VkKVxuXHRcdFx0cGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXSA9IHRydWU7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV07XG5cdH0pO1xuXG5cdC8vIHBhdGhvbG9neSB0ZXN0c1xuXHQkKCcjcGVyc29uX2RldGFpbHMgc2VsZWN0W25hbWUkPVwiX2JjX3BhdGhvbG9neVwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJy0nKSB7XG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0gJCh0aGlzKS52YWwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV07XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBnZW5ldGljIHRlc3RzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3RbbmFtZSQ9XCJfZ2VuZV90ZXN0XCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZigkKHRoaXMpLnZhbCgpICE9PSAnLScpIHtcblx0XHRcdGxldCB0cmVzID0gJCgnc2VsZWN0W25hbWU9XCInKyQodGhpcykuYXR0cignbmFtZScpKydfcmVzdWx0XCJdJyk7XG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0geyd0eXBlJzogJCh0aGlzKS52YWwoKSwgJ3Jlc3VsdCc6ICQodHJlcykudmFsKCl9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0XHR9XG5cdH0pO1xuXG5cdHRyeSB7XG5cdFx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZCgnZm9ybScpLnZhbGlkKCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0Y29uc29sZS53YXJuKCd2YWxpZCgpIG5vdCBmb3VuZCcpO1xuXHR9XG5cblx0c3luY1R3aW5zKG5ld2RhdGFzZXQsIHBlcnNvbik7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfZGlhZ25vc2lzX2FnZV93aWRnZXQoKSB7XG5cdGlmKCQoXCIjaWRfYXBwcm94XCIpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzAnXVwiKS5lYWNoKGZ1bmN0aW9uKCBfaSApIHtcblx0XHRcdGlmKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG5cdFx0XHRcdGxldCBuYW1lID0gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpO1xuXHRcdFx0XHQkKFwiI2lkX1wiK25hbWUrXCJfMVwiKS52YWwocm91bmQ1KCQodGhpcykudmFsKCkpKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzAnXVwiKS5oaWRlKCk7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzEnXVwiKS5zaG93KCk7XG5cdH0gZWxzZSB7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzEnXVwiKS5lYWNoKGZ1bmN0aW9uKCBfaSApIHtcblx0XHRcdGlmKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG5cdFx0XHRcdGxldCBuYW1lID0gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpO1xuXHRcdFx0XHQkKFwiI2lkX1wiK25hbWUrXCJfMFwiKS52YWwoJCh0aGlzKS52YWwoKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLnNob3coKTtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLmhpZGUoKTtcblx0fVxufVxuXG4vLyBtYWxlcyBzaG91bGQgbm90IGhhdmUgb3ZhcmlhbiBjYW5jZXIgYW5kIGZlbWFsZXMgc2hvdWxkIG5vdCBoYXZlIHByb3N0YXRlIGNhbmNlclxuZnVuY3Rpb24gdXBkYXRlX2NhbmNlcl9ieV9zZXgobm9kZSkge1xuXHQkKCcjY2FuY2VyIC5yb3cnKS5zaG93KCk7XG5cdGlmKG5vZGUuc2V4ID09PSAnTScpIHtcblx0XHRkZWxldGUgbm9kZS5vdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlO1xuXHRcdCQoXCJbaWRePSdpZF9vdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlJ11cIikuY2xvc2VzdCgnLnJvdycpLmhpZGUoKTtcblx0XHQkKFwiW2lkXj0naWRfYnJlYXN0X2NhbmNlcjJfZGlhZ25vc2lzX2FnZSddXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdH0gZWxzZSBpZihub2RlLnNleCA9PT0gJ0YnKSB7XG5cdFx0ZGVsZXRlIG5vZGUucHJvc3RhdGVfY2FuY2VyX2RpYWdub3Npc19hZ2U7XG5cdFx0JChcIltpZF49J2lkX3Byb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlJ11cIikuY2xvc2VzdCgnLnJvdycpLmhpZGUoKTtcblx0XHQkKFwiW2lkXj0naWRfYnJlYXN0X2NhbmNlcjJfZGlhZ25vc2lzX2FnZSddXCIpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHR9XG59XG5cbi8vIHJvdW5kIHRvIDUsIDE1LCAyNSwgMzUgLi4uLlxuZnVuY3Rpb24gcm91bmQ1KHgxKSB7XG5cdGxldCB4MiA9IChNYXRoLnJvdW5kKCh4MS0xKSAvIDEwKSAqIDEwKTtcblx0cmV0dXJuICh4MSA8IHgyID8geDIgLSA1IDogeDIgKyA1KTtcbn1cblxuIiwiLy8gcGVkaWdyZWUgd2lkZ2V0c1xuaW1wb3J0IHthZGRzaWJsaW5nLCBhZGRjaGlsZCwgYWRkcGFyZW50cywgYWRkcGFydG5lciwgcmVidWlsZCwgZGVsZXRlX25vZGVfZGF0YXNldH0gZnJvbSAnLi9wZWRpZ3JlZS5qcyc7XG5pbXBvcnQge2NvcHlfZGF0YXNldCwgbWFrZWlkLCBnZXRJZHhCeU5hbWV9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0IHtzYXZlLCB1cGRhdGV9IGZyb20gJy4vcGVkaWdyZWVfZm9ybS5qcyc7XG5pbXBvcnQge2N1cnJlbnQgYXMgcGVkY2FjaGVfY3VycmVudH0gZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5cbmxldCBkcmFnZ2luZztcbmxldCBsYXN0X21vdXNlb3Zlcjtcbi8vXG4vLyBBZGQgd2lkZ2V0cyB0byBub2RlcyBhbmQgYmluZCBldmVudHNcbmV4cG9ydCBmdW5jdGlvbiBhZGRXaWRnZXRzKG9wdHMsIG5vZGUpIHtcblxuXHQvLyBwb3B1cCBnZW5kZXIgc2VsZWN0aW9uIGJveFxuXHRsZXQgZm9udF9zaXplID0gcGFyc2VJbnQoJChcImJvZHlcIikuY3NzKCdmb250LXNpemUnKSk7XG5cdGxldCBwb3B1cF9zZWxlY3Rpb24gPSBkMy5zZWxlY3QoJy5kaWFncmFtJyk7XG5cdHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvblwiKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcInJ4XCIsIDYpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwicnlcIiwgNilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHRcdFx0XHRcdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcIndpZHRoXCIsICBmb250X3NpemUqNy45KVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcImhlaWdodFwiLCBmb250X3NpemUqMilcblx0XHRcdFx0XHRcdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiZGFya2dyZXlcIilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwid2hpdGVcIik7XG5cblx0bGV0IHNxdWFyZSA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBtYWxlXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoJ2ZvbnQtc2l6ZScsICcxLmVtJyApXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS1zcXVhcmUgcGVyc29udHlwZVwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZS8zKVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjA5NiBcIik7XG5cdGxldCBzcXVhcmVfdGl0bGUgPSBzcXVhcmUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgbWFsZVwiKTtcblxuXHRsZXQgY2lyY2xlID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIGZlbWFsZVxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtbGcgZmEtY2lyY2xlIHBlcnNvbnR5cGVcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdC5hdHRyKFwieFwiLCBmb250X3NpemUqMS43KVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjEwYyBcIik7XG5cdGxldCBjaXJjbGVfdGl0bGUgPSBjaXJjbGUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgZmVtYWxlXCIpO1xuXG5cdGxldCB1bnNwZWNpZmllZCA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyB1bnNwZWNpZmllZFxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS11bnNwZWNpZmllZCBwb3B1cF9zZWxlY3Rpb25fcm90YXRlNDUgcGVyc29udHlwZVwiKVxuXHRcdC50ZXh0KFwiXFx1ZjA5NiBcIik7XG5cdHVuc3BlY2lmaWVkLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIHVuc3BlY2lmaWVkXCIpO1xuXG5cdGxldCBkenR3aW4gPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gZGl6eWdvdGljIHR3aW5zXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLTJ4IGZhLWFuZ2xlLXVwIHBlcnNvbnR5cGUgZHp0d2luXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSo0LjYpXG5cdFx0LmF0dHIoXCJ5XCIsIGZvbnRfc2l6ZSoxLjUpXG5cdFx0LnRleHQoXCJcXHVmMTA2IFwiKTtcblx0ZHp0d2luLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIGRpenlnb3RpYy9mcmF0ZXJuYWwgdHdpbnNcIik7XG5cblx0bGV0IG16dHdpbiA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBtb25venlnb3RpYyB0d2luc1xuXHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtMnggZmEtY2FyZXQtdXAgcGVyc29udHlwZSBtenR3aW5cIilcblx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSo2LjIpXG5cdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHQudGV4dChcIlxcdWYwZDhcIik7XG5cdG16dHdpbi5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCBtb25venlnb3RpYy9pZGVudGljYWwgdHdpbnNcIik7XG5cblx0bGV0IGFkZF9wZXJzb24gPSB7fTtcblx0Ly8gY2xpY2sgdGhlIHBlcnNvbiB0eXBlIHNlbGVjdGlvblxuXHRkMy5zZWxlY3RBbGwoXCIucGVyc29udHlwZVwiKVxuXHQgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRsZXQgbXp0d2luID0gZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJtenR3aW5cIik7XG5cdFx0bGV0IGR6dHdpbiA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHp0d2luXCIpO1xuXHRcdGxldCB0d2luX3R5cGU7XG5cdFx0bGV0IHNleDtcblx0XHRpZihtenR3aW4gfHwgZHp0d2luKSB7XG5cdFx0XHRzZXggPSBhZGRfcGVyc29uLm5vZGUuZGF0dW0oKS5kYXRhLnNleDtcblx0XHRcdHR3aW5fdHlwZSA9IChtenR3aW4gPyBcIm16dHdpblwiIDogXCJkenR3aW5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNleCA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtc3F1YXJlXCIpID8gJ00nIDogKGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtY2lyY2xlXCIpID8gJ0YnIDogJ1UnKTtcblx0XHR9XG5cblx0XHRpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRzaWJsaW5nJylcblx0XHRcdGFkZHNpYmxpbmcobmV3ZGF0YXNldCwgYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkuZGF0YSwgc2V4LCBmYWxzZSwgdHdpbl90eXBlKTtcblx0XHRlbHNlIGlmKGFkZF9wZXJzb24udHlwZSA9PT0gJ2FkZGNoaWxkJylcblx0XHRcdGFkZGNoaWxkKG5ld2RhdGFzZXQsIGFkZF9wZXJzb24ubm9kZS5kYXR1bSgpLmRhdGEsICh0d2luX3R5cGUgPyAnVScgOiBzZXgpLCAodHdpbl90eXBlID8gMiA6IDEpLCB0d2luX3R5cGUpO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybjtcblx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0ZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGFkZF9wZXJzb24gPSB7fTtcblx0ICB9KVxuXHQgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbigpIHtcblx0XHQgIGlmKGFkZF9wZXJzb24ubm9kZSlcblx0XHRcdCAgYWRkX3BlcnNvbi5ub2RlLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjIpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdCAgLy8gYWRkIHRvb2x0aXBzIHRvIGZvbnQgYXdlc29tZSB3aWRnZXRzXG5cdFx0ICBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRzaWJsaW5nJyl7XG5cdFx0XHQgaWYoZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJmYS1zcXVhcmVcIikpXG5cdFx0XHRcdCAgc3F1YXJlX3RpdGxlLnRleHQoXCJhZGQgYnJvdGhlclwiKTtcblx0XHRcdCAgZWxzZVxuXHRcdFx0XHQgIGNpcmNsZV90aXRsZS50ZXh0KFwiYWRkIHNpc3RlclwiKTtcblx0XHQgIH0gZWxzZSBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRjaGlsZCcpe1xuXHRcdFx0ICBpZihkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImZhLXNxdWFyZVwiKSlcblx0XHRcdFx0ICBzcXVhcmVfdGl0bGUudGV4dChcImFkZCBzb25cIik7XG5cdFx0XHQgIGVsc2Vcblx0XHRcdFx0ICBjaXJjbGVfdGl0bGUudGV4dChcImFkZCBkYXVnaHRlclwiKTtcblx0XHQgIH1cblx0ICB9KTtcblxuXHQvLyBoYW5kbGUgbW91c2Ugb3V0IG9mIHBvcHVwIHNlbGVjdGlvblxuXHRkMy5zZWxlY3RBbGwoXCIucG9wdXBfc2VsZWN0aW9uXCIpLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKCkge1xuXHRcdC8vIGhpZGUgcmVjdCBhbmQgcG9wdXAgc2VsZWN0aW9uXG5cdFx0aWYoYWRkX3BlcnNvbi5ub2RlICE9PSB1bmRlZmluZWQgJiYgaGlnaGxpZ2h0LmluZGV4T2YoYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkpID09IC0xKVxuXHRcdFx0YWRkX3BlcnNvbi5ub2RlLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdH0pO1xuXG5cblx0Ly8gZHJhZyBsaW5lIGJldHdlZW4gbm9kZXMgdG8gY3JlYXRlIHBhcnRuZXJzXG5cdGRyYWdfaGFuZGxlKG9wdHMpO1xuXG5cdC8vIHJlY3RhbmdsZSB1c2VkIHRvIGhpZ2hsaWdodCBvbiBtb3VzZSBvdmVyXG5cdG5vZGUuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIGQuZGF0YS5oaWRkZW4gJiYgIW9wdHMuREVCVUcgPyBmYWxzZSA6IHRydWU7XG5cdFx0fSlcblx0XHQuYXR0cihcImNsYXNzXCIsICdpbmRpX3JlY3QnKVxuXHRcdC5hdHRyKFwicnhcIiwgNilcblx0XHQuYXR0cihcInJ5XCIsIDYpXG5cdFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKF9kKSB7IHJldHVybiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZTsgfSlcblx0XHQuYXR0cihcInlcIiwgZnVuY3Rpb24oX2QpIHsgcmV0dXJuIC0gb3B0cy5zeW1ib2xfc2l6ZTsgfSlcblx0XHQuYXR0cihcIndpZHRoXCIsICAoMS41ICogb3B0cy5zeW1ib2xfc2l6ZSkrJ3B4Jylcblx0XHQuYXR0cihcImhlaWdodFwiLCAoMiAqIG9wdHMuc3ltYm9sX3NpemUpKydweCcpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMC43KVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cihcImZpbGxcIiwgXCJsaWdodGdyZXlcIik7XG5cblx0Ly8gd2lkZ2V0c1xuXHRsZXQgZnggPSBmdW5jdGlvbihfZCkge3JldHVybiBvZmYgLSAwLjc1Km9wdHMuc3ltYm9sX3NpemU7fTtcblx0bGV0IGZ5ID0gb3B0cy5zeW1ib2xfc2l6ZSAtMjtcblx0bGV0IG9mZiA9IDA7XG5cdGxldCB3aWRnZXRzID0ge1xuXHRcdCdhZGRjaGlsZCc6ICAgeyd0ZXh0JzogJ1xcdWYwNjMnLCAndGl0bGUnOiAnYWRkIGNoaWxkJywgICAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRzaWJsaW5nJzogeyd0ZXh0JzogJ1xcdWYyMzQnLCAndGl0bGUnOiAnYWRkIHNpYmxpbmcnLCAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRwYXJ0bmVyJzogeyd0ZXh0JzogJ1xcdWYwYzEnLCAndGl0bGUnOiAnYWRkIHBhcnRuZXInLCAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRwYXJlbnRzJzoge1xuXHRcdFx0J3RleHQnOiAnXFx1ZjA2MicsICd0aXRsZSc6ICdhZGQgcGFyZW50cycsXG5cdFx0XHQnZngnOiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZSxcblx0XHRcdCdmeSc6IC0gb3B0cy5zeW1ib2xfc2l6ZSArIDExXG5cdFx0fSxcblx0XHQnZGVsZXRlJzoge1xuXHRcdFx0J3RleHQnOiAnWCcsICd0aXRsZSc6ICdkZWxldGUnLFxuXHRcdFx0J2Z4Jzogb3B0cy5zeW1ib2xfc2l6ZS8yIC0gMSxcblx0XHRcdCdmeSc6IC0gb3B0cy5zeW1ib2xfc2l6ZSArIDEyLFxuXHRcdFx0J3N0eWxlcyc6IHtcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLCBcImZpbGxcIjogXCJkYXJrcmVkXCIsIFwiZm9udC1mYW1pbHlcIjogXCJtb25vc3BhY2VcIn1cblx0XHR9XG5cdH07XG5cblx0aWYob3B0cy5lZGl0KSB7XG5cdFx0d2lkZ2V0cy5zZXR0aW5ncyA9IHsndGV4dCc6ICdcXHVmMDEzJywgJ3RpdGxlJzogJ3NldHRpbmdzJywgJ2Z4JzogLWZvbnRfc2l6ZS8yKzIsICdmeSc6IC1vcHRzLnN5bWJvbF9zaXplICsgMTF9O1xuXHR9XG5cblx0Zm9yKGxldCBrZXkgaW4gd2lkZ2V0cykge1xuXHRcdGxldCB3aWRnZXQgPSBub2RlLmFwcGVuZChcInRleHRcIilcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuICAoZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyA/IGZhbHNlIDogdHJ1ZSkgJiZcblx0XHRcdFx0XHRcdCEoKGQuZGF0YS5tb3RoZXIgPT09IHVuZGVmaW5lZCB8fCBkLmRhdGEubm9wYXJlbnRzKSAmJiBrZXkgPT09ICdhZGRzaWJsaW5nJykgJiZcblx0XHRcdFx0XHRcdCEoZC5kYXRhLnBhcmVudF9ub2RlICE9PSB1bmRlZmluZWQgJiYgZC5kYXRhLnBhcmVudF9ub2RlLmxlbmd0aCA+IDEgJiYga2V5ID09PSAnYWRkcGFydG5lcicpICYmXG5cdFx0XHRcdFx0XHQhKGQuZGF0YS5wYXJlbnRfbm9kZSA9PT0gdW5kZWZpbmVkICYmIGtleSA9PT0gJ2FkZGNoaWxkJykgJiZcblx0XHRcdFx0XHRcdCEoKGQuZGF0YS5ub3BhcmVudHMgPT09IHVuZGVmaW5lZCAmJiBkLmRhdGEudG9wX2xldmVsID09PSB1bmRlZmluZWQpICYmIGtleSA9PT0gJ2FkZHBhcmVudHMnKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGtleSlcblx0XHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0XHQuYXR0cihcInh4XCIsIGZ1bmN0aW9uKGQpe3JldHVybiBkLng7fSlcblx0XHRcdC5hdHRyKFwieXlcIiwgZnVuY3Rpb24oZCl7cmV0dXJuIGQueTt9KVxuXHRcdFx0LmF0dHIoXCJ4XCIsIHdpZGdldHNba2V5XS5meClcblx0XHRcdC5hdHRyKFwieVwiLCB3aWRnZXRzW2tleV0uZnkpXG5cdFx0XHQuYXR0cignZm9udC1zaXplJywgJzAuOWVtJyApXG5cdFx0XHQudGV4dCh3aWRnZXRzW2tleV0udGV4dCk7XG5cblx0XHRpZignc3R5bGVzJyBpbiB3aWRnZXRzW2tleV0pXG5cdFx0XHRmb3IobGV0IHN0eWxlIGluIHdpZGdldHNba2V5XS5zdHlsZXMpe1xuXHRcdFx0XHR3aWRnZXQuYXR0cihzdHlsZSwgd2lkZ2V0c1trZXldLnN0eWxlc1tzdHlsZV0pO1xuXHRcdFx0fVxuXG5cdFx0d2lkZ2V0LmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KHdpZGdldHNba2V5XS50aXRsZSk7XG5cdFx0b2ZmICs9IDE3O1xuXHR9XG5cblx0Ly8gYWRkIHNpYmxpbmcgb3IgY2hpbGRcblx0ZDMuc2VsZWN0QWxsKFwiLmFkZHNpYmxpbmcsIC5hZGRjaGlsZFwiKVxuXHQgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICBsZXQgdHlwZSA9IGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdCAgYWRkX3BlcnNvbiA9IHsnbm9kZSc6IGQzLnNlbGVjdCh0aGlzLnBhcmVudE5vZGUpLCAndHlwZSc6IHR5cGV9O1xuXG5cdFx0ICAvL2xldCB0cmFuc2xhdGUgPSBnZXRUcmFuc2xhdGlvbihkMy5zZWxlY3QoJy5kaWFncmFtJykuYXR0cihcInRyYW5zZm9ybVwiKSk7XG5cdFx0ICBsZXQgeCA9IHBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwieHhcIikpICsgcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ4XCIpKTtcblx0XHQgIGxldCB5ID0gcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ5eVwiKSkgKyBwYXJzZUludChkMy5zZWxlY3QodGhpcykuYXR0cihcInlcIikpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiKyh5KzIpK1wiKVwiKTtcblx0XHQgIGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbl9yb3RhdGU0NScpXG5cdFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIisoeCszKmZvbnRfc2l6ZSkrXCIsXCIrKHkrKGZvbnRfc2l6ZSoxLjIpKStcIikgcm90YXRlKDQ1KVwiKTtcblx0ICB9KTtcblxuXHQvLyBoYW5kbGUgd2lkZ2V0IGNsaWNrc1xuXHRkMy5zZWxlY3RBbGwoXCIuYWRkY2hpbGQsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzXCIpXG5cdCAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0bGV0IG9wdCA9IGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuXHRcdGxldCBkID0gZDMuc2VsZWN0KHRoaXMucGFyZW50Tm9kZSkuZGF0dW0oKTtcblx0XHRpZihvcHRzLkRFQlVHKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhvcHQpO1xuXHRcdH1cblxuXHRcdGxldCBuZXdkYXRhc2V0O1xuXHRcdGlmKG9wdCA9PT0gJ3NldHRpbmdzJykge1xuXHRcdFx0aWYodHlwZW9mIG9wdHMuZWRpdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRvcHRzLmVkaXQob3B0cywgZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvcGVuRWRpdERpYWxvZyhvcHRzLCBkKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYob3B0ID09PSAnZGVsZXRlJykge1xuXHRcdFx0bmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRcdGRlbGV0ZV9ub2RlX2RhdGFzZXQobmV3ZGF0YXNldCwgZC5kYXRhLCBvcHRzLCBvbkRvbmUpO1xuXHRcdH0gZWxzZSBpZihvcHQgPT09ICdhZGRwYXJlbnRzJykge1xuXHRcdFx0bmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdFx0XHRhZGRwYXJlbnRzKG9wdHMsIG5ld2RhdGFzZXQsIGQuZGF0YS5uYW1lKTtcblx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0fSBlbHNlIGlmKG9wdCA9PT0gJ2FkZHBhcnRuZXInKSB7XG5cdFx0XHRuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlX2N1cnJlbnQob3B0cykpO1xuXHRcdFx0YWRkcGFydG5lcihvcHRzLCBuZXdkYXRhc2V0LCBkLmRhdGEubmFtZSk7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdFx0cmVidWlsZChvcHRzKTtcblx0XHR9XG5cdFx0Ly8gdHJpZ2dlciBmaENoYW5nZSBldmVudFxuXHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ2ZoQ2hhbmdlJywgW29wdHNdKTtcblx0fSk7XG5cblx0Ly8gb3RoZXIgbW91c2UgZXZlbnRzXG5cdGxldCBoaWdobGlnaHQgPSBbXTtcblxuXHRub2RlLmZpbHRlcihmdW5jdGlvbiAoZCkgeyByZXR1cm4gIWQuZGF0YS5oaWRkZW47IH0pXG5cdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0aWYgKGQzLmV2ZW50LmN0cmxLZXkpIHtcblx0XHRcdGlmKGhpZ2hsaWdodC5pbmRleE9mKGQpID09IC0xKVxuXHRcdFx0XHRoaWdobGlnaHQucHVzaChkKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0aGlnaGxpZ2h0LnNwbGljZShoaWdobGlnaHQuaW5kZXhPZihkKSwgMSk7XG5cdFx0fSBlbHNlXG5cdFx0XHRoaWdobGlnaHQgPSBbZF07XG5cblx0XHRpZignbm9kZWNsaWNrJyBpbiBvcHRzKSB7XG5cdFx0XHRvcHRzLm5vZGVjbGljayhkLmRhdGEpO1xuXHRcdFx0ZDMuc2VsZWN0QWxsKFwiLmluZGlfcmVjdFwiKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0XHRkMy5zZWxlY3RBbGwoJy5pbmRpX3JlY3QnKS5maWx0ZXIoZnVuY3Rpb24oZCkge3JldHVybiBoaWdobGlnaHQuaW5kZXhPZihkKSAhPSAtMTt9KS5zdHlsZShcIm9wYWNpdHlcIiwgMC41KTtcblx0XHR9XG5cdH0pXG5cdC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihldmVudCwgZCl7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0bGFzdF9tb3VzZW92ZXIgPSBkO1xuXHRcdGlmKGRyYWdnaW5nKSB7XG5cdFx0XHRpZihkcmFnZ2luZy5kYXRhLm5hbWUgIT09IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSAmJlxuXHRcdFx0ICAgZHJhZ2dpbmcuZGF0YS5zZXggIT09IGxhc3RfbW91c2VvdmVyLmRhdGEuc2V4KSB7XG5cdFx0XHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMC4yKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjIpO1xuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5hZGRjaGlsZCwgLmFkZHNpYmxpbmcsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5pbmRpX2RldGFpbHMnKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0c2V0TGluZURyYWdQb3NpdGlvbihvcHRzLnN5bWJvbF9zaXplLTEwLCAwLCBvcHRzLnN5bWJvbF9zaXplLTIsIDAsIGQueCtcIixcIisoZC55KzIpKTtcblx0fSlcblx0Lm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZXZlbnQsIGQpe1xuXHRcdGlmKGRyYWdnaW5nKVxuXHRcdFx0cmV0dXJuO1xuXG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLmFkZGNoaWxkLCAuYWRkc2libGluZywgLmFkZHBhcnRuZXIsIC5hZGRwYXJlbnRzLCAuZGVsZXRlLCAuc2V0dGluZ3MnKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0aWYoaGlnaGxpZ2h0LmluZGV4T2YoZCkgPT0gLTEpXG5cdFx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0KCdyZWN0Jykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5pbmRpX2RldGFpbHMnKS5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG5cdFx0Ly8gaGlkZSBwb3B1cCBpZiBpdCBsb29rcyBsaWtlIHRoZSBtb3VzZSBpcyBtb3Zpbmcgbm9ydGhcblx0XHRsZXQgeGNvb3JkID0gZDMucG9pbnRlcihldmVudClbMF07XG5cdFx0bGV0IHljb29yZCA9IGQzLnBvaW50ZXIoZXZlbnQpWzFdO1xuXHRcdGlmKHljb29yZCA8IDAuOCpvcHRzLnN5bWJvbF9zaXplKVxuXHRcdFx0ZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGlmKCFkcmFnZ2luZykge1xuXHRcdFx0Ly8gaGlkZSBwb3B1cCBpZiBpdCBsb29rcyBsaWtlIHRoZSBtb3VzZSBpcyBtb3Zpbmcgbm9ydGgsIHNvdXRoIG9yIHdlc3Rcblx0XHRcdGlmKCBNYXRoLmFicyh5Y29vcmQpID4gMC4yNSpvcHRzLnN5bWJvbF9zaXplIHx8XG5cdFx0XHRcdE1hdGguYWJzKHljb29yZCkgPCAtMC4yNSpvcHRzLnN5bWJvbF9zaXplIHx8XG5cdFx0XHRcdHhjb29yZCA8IDAuMipvcHRzLnN5bWJvbF9zaXplKXtcblx0XHRcdFx0XHRzZXRMaW5lRHJhZ1Bvc2l0aW9uKDAsIDAsIDAsIDApO1xuXHRcdFx0fVxuICAgICAgICB9XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBvbkRvbmUob3B0cywgZGF0YXNldCkge1xuXHQvLyBhc3NpZ24gbmV3IGRhdGFzZXQgYW5kIHJlYnVpbGQgcGVkaWdyZWVcblx0b3B0cy5kYXRhc2V0ID0gZGF0YXNldDtcblx0cmVidWlsZChvcHRzKTtcbn1cblxuLy8gZHJhZyBsaW5lIGJldHdlZW4gbm9kZXMgdG8gY3JlYXRlIHBhcnRuZXJzXG5mdW5jdGlvbiBkcmFnX2hhbmRsZShvcHRzKSB7XG5cdGxldCBsaW5lX2RyYWdfc2VsZWN0aW9uID0gZDMuc2VsZWN0KCcuZGlhZ3JhbScpO1xuXHRsZXQgZGxpbmUgPSBsaW5lX2RyYWdfc2VsZWN0aW9uLmFwcGVuZChcImxpbmVcIikuYXR0cihcImNsYXNzXCIsICdsaW5lX2RyYWdfc2VsZWN0aW9uJylcbiAgICAgICAgLmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgNilcbiAgICAgICAgLnN0eWxlKFwic3Ryb2tlLWRhc2hhcnJheVwiLCAoXCIyLCAxXCIpKVxuICAgICAgICAuYXR0cihcInN0cm9rZVwiLFwiYmxhY2tcIilcbiAgICAgICAgLmNhbGwoZDMuZHJhZygpXG4gICAgICAgICAgICAgICAgLm9uKFwic3RhcnRcIiwgZHJhZ3N0YXJ0KVxuICAgICAgICAgICAgICAgIC5vbihcImRyYWdcIiwgZHJhZylcbiAgICAgICAgICAgICAgICAub24oXCJlbmRcIiwgZHJhZ3N0b3ApKTtcblx0ZGxpbmUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJkcmFnIHRvIGNyZWF0ZSBjb25zYW5ndWluZW91cyBwYXJ0bmVyc1wiKTtcblxuXHRzZXRMaW5lRHJhZ1Bvc2l0aW9uKDAsIDAsIDAsIDApO1xuXG5cdGZ1bmN0aW9uIGRyYWdzdGFydCgpIHtcblx0XHRkcmFnZ2luZyA9IGxhc3RfbW91c2VvdmVyO1xuXHRcdGQzLnNlbGVjdEFsbCgnLmxpbmVfZHJhZ19zZWxlY3Rpb24nKVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIixcImRhcmtyZWRcIik7XG5cdH1cblxuXHRmdW5jdGlvbiBkcmFnc3RvcChfZCkge1xuXHRcdGlmKGxhc3RfbW91c2VvdmVyICYmXG5cdFx0ICAgZHJhZ2dpbmcuZGF0YS5uYW1lICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLm5hbWUgJiZcblx0XHQgICBkcmFnZ2luZy5kYXRhLnNleCAgIT09IGxhc3RfbW91c2VvdmVyLmRhdGEuc2V4KSB7XG5cdFx0XHQvLyBtYWtlIHBhcnRuZXJzXG5cdFx0XHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IG1ha2VpZCg0KSwgXCJzZXhcIjogJ1UnLFxuXHRcdFx0XHQgICAgIFwibW90aGVyXCI6IChkcmFnZ2luZy5kYXRhLnNleCA9PT0gJ0YnID8gZHJhZ2dpbmcuZGF0YS5uYW1lIDogbGFzdF9tb3VzZW92ZXIuZGF0YS5uYW1lKSxcblx0XHRcdCAgICAgICAgIFwiZmF0aGVyXCI6IChkcmFnZ2luZy5kYXRhLnNleCA9PT0gJ0YnID8gbGFzdF9tb3VzZW92ZXIuZGF0YS5uYW1lIDogZHJhZ2dpbmcuZGF0YS5uYW1lKX07XG5cdFx0XHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChvcHRzLmRhdGFzZXQpO1xuXHRcdFx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblxuXHRcdFx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIGRyYWdnaW5nLmRhdGEubmFtZSkrMTtcblx0XHRcdG9wdHMuZGF0YXNldC5zcGxpY2UoaWR4LCAwLCBjaGlsZCk7XG5cdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdH1cblx0XHRzZXRMaW5lRHJhZ1Bvc2l0aW9uKDAsIDAsIDAsIDApO1xuXHRcdGQzLnNlbGVjdEFsbCgnLmxpbmVfZHJhZ19zZWxlY3Rpb24nKVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIixcImJsYWNrXCIpO1xuXHRcdGRyYWdnaW5nID0gdW5kZWZpbmVkO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGZ1bmN0aW9uIGRyYWcoZXZlbnQsIF9kKSB7XG5cdFx0ZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0bGV0IGR4ID0gZXZlbnQuZHg7XG5cdFx0bGV0IGR5ID0gZXZlbnQuZHk7XG4gICAgICAgIGxldCB4bmV3ID0gcGFyc2VGbG9hdChkMy5zZWxlY3QodGhpcykuYXR0cigneDInKSkrIGR4O1xuICAgICAgICBsZXQgeW5ldyA9IHBhcnNlRmxvYXQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ3kyJykpKyBkeTtcbiAgICAgICAgc2V0TGluZURyYWdQb3NpdGlvbihvcHRzLnN5bWJvbF9zaXplLTEwLCAwLCB4bmV3LCB5bmV3KTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXRMaW5lRHJhZ1Bvc2l0aW9uKHgxLCB5MSwgeDIsIHkyLCB0cmFuc2xhdGUpIHtcblx0aWYodHJhbnNsYXRlKVxuXHRcdGQzLnNlbGVjdEFsbCgnLmxpbmVfZHJhZ19zZWxlY3Rpb24nKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3RyYW5zbGF0ZStcIilcIik7XG5cdGQzLnNlbGVjdEFsbCgnLmxpbmVfZHJhZ19zZWxlY3Rpb24nKVxuXHRcdC5hdHRyKFwieDFcIiwgeDEpXG5cdFx0LmF0dHIoXCJ5MVwiLCB5MSlcblx0XHQuYXR0cihcIngyXCIsIHgyKVxuXHRcdC5hdHRyKFwieTJcIiwgeTIpO1xufVxuXG5mdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbn1cblxuLy8gaWYgb3B0LmVkaXQgaXMgc2V0IHRydWUgKHJhdGhlciB0aGFuIGdpdmVuIGEgZnVuY3Rpb24pIHRoaXMgaXMgY2FsbGVkIHRvIGVkaXQgbm9kZSBhdHRyaWJ1dGVzXG5mdW5jdGlvbiBvcGVuRWRpdERpYWxvZyhvcHRzLCBkKSB7XG5cdCQoJyNub2RlX3Byb3BlcnRpZXMnKS5kaWFsb2coe1xuXHQgICAgYXV0b09wZW46IGZhbHNlLFxuXHQgICAgdGl0bGU6IGQuZGF0YS5kaXNwbGF5X25hbWUsXG5cdCAgICB3aWR0aDogKCQod2luZG93KS53aWR0aCgpID4gNDAwID8gNDUwIDogJCh3aW5kb3cpLndpZHRoKCktIDMwKVxuXHR9KTtcblxuXHRsZXQgdGFibGUgPSBcIjx0YWJsZSBpZD0ncGVyc29uX2RldGFpbHMnIGNsYXNzPSd0YWJsZSc+XCI7XG5cblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5VbmlxdWUgSUQ8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0ndGV4dCcgaWQ9J2lkX25hbWUnIG5hbWU9J25hbWUnIHZhbHVlPVwiK1xuXHQoZC5kYXRhLm5hbWUgPyBkLmRhdGEubmFtZSA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5OYW1lPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J3RleHQnIGlkPSdpZF9kaXNwbGF5X25hbWUnIG5hbWU9J2Rpc3BsYXlfbmFtZScgdmFsdWU9XCIrXG5cdFx0XHQoZC5kYXRhLmRpc3BsYXlfbmFtZSA/IGQuZGF0YS5kaXNwbGF5X25hbWUgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5BZ2U8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0nbnVtYmVyJyBpZD0naWRfYWdlJyBtaW49JzAnIG1heD0nMTIwJyBuYW1lPSdhZ2UnIHN0eWxlPSd3aWR0aDo3ZW0nIHZhbHVlPVwiK1xuXHRcdFx0KGQuZGF0YS5hZ2UgPyBkLmRhdGEuYWdlIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+WWVhciBPZiBCaXJ0aDwvdGQ+PHRkPjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyB0eXBlPSdudW1iZXInIGlkPSdpZF95b2InIG1pbj0nMTkwMCcgbWF4PScyMDUwJyBuYW1lPSd5b2InIHN0eWxlPSd3aWR0aDo3ZW0nIHZhbHVlPVwiK1xuXHRcdChkLmRhdGEueW9iID8gZC5kYXRhLnlvYiA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblxuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiIGlkPVwiaWRfc2V4XCI+JyArXG5cdFx0XHQgJzxsYWJlbCBjbGFzcz1cInJhZGlvLWlubGluZVwiPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2V4XCIgdmFsdWU9XCJNXCIgJysoZC5kYXRhLnNleCA9PT0gJ00nID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPk1hbGU8L2xhYmVsPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJyYWRpby1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNleFwiIHZhbHVlPVwiRlwiICcrKGQuZGF0YS5zZXggPT09ICdGJyA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz5GZW1hbGU8L2xhYmVsPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJyYWRpby1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNleFwiIHZhbHVlPVwiVVwiPlVua25vd248L2xhYmVsPicgK1xuXHRcdFx0ICc8L3RkPjwvdHI+JztcblxuXHQvLyBhbGl2ZSBzdGF0dXMgPSAwOyBkZWFkIHN0YXR1cyA9IDFcblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIiBpZD1cImlkX3N0YXR1c1wiPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJjaGVja2JveC1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInN0YXR1c1wiIHZhbHVlPVwiMFwiICcrKHBhcnNlSW50KGQuZGF0YS5zdGF0dXMpID09PSAwID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPiZ0aGluc3A7QWxpdmU8L2xhYmVsPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJjaGVja2JveC1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInN0YXR1c1wiIHZhbHVlPVwiMVwiICcrKHBhcnNlSW50KGQuZGF0YS5zdGF0dXMpID09PSAxID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPiZ0aGluc3A7RGVjZWFzZWQ8L2xhYmVsPicgK1xuXHRcdFx0ICc8L3RkPjwvdHI+Jztcblx0JChcIiNpZF9zdGF0dXMgaW5wdXRbdmFsdWU9J1wiK2QuZGF0YS5zdGF0dXMrXCInXVwiKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cblx0Ly8gc3dpdGNoZXNcblx0bGV0IHN3aXRjaGVzID0gW1wiYWRvcHRlZF9pblwiLCBcImFkb3B0ZWRfb3V0XCIsIFwibWlzY2FycmlhZ2VcIiwgXCJzdGlsbGJpcnRoXCIsIFwidGVybWluYXRpb25cIl07XG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCI+PHN0cm9uZz5SZXByb2R1Y3Rpb246PC9zdHJvbmc+PC90ZD48L3RyPic7XG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCI+Jztcblx0Zm9yKGxldCBpc3dpdGNoPTA7IGlzd2l0Y2g8c3dpdGNoZXMubGVuZ3RoOyBpc3dpdGNoKyspe1xuXHRcdGxldCBhdHRyID0gc3dpdGNoZXNbaXN3aXRjaF07XG5cdFx0aWYoaXN3aXRjaCA9PT0gMilcblx0XHRcdHRhYmxlICs9ICc8L3RkPjwvdHI+PHRyPjx0ZCBjb2xzcGFuPVwiMlwiPic7XG5cdFx0dGFibGUgKz1cblx0XHQgJzxsYWJlbCBjbGFzcz1cImNoZWNrYm94LWlubGluZVwiPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImlkXycrYXR0ciArXG5cdFx0ICAgICdcIiBuYW1lPVwiJythdHRyKydcIiB2YWx1ZT1cIjBcIiAnKyhkLmRhdGFbYXR0cl0gPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+JnRoaW5zcDsnICtcblx0XHQgICAgY2FwaXRhbGlzZUZpcnN0TGV0dGVyKGF0dHIucmVwbGFjZSgnXycsICcgJykpKyc8L2xhYmVsPidcblx0fVxuXHR0YWJsZSArPSAnPC90ZD48L3RyPic7XG5cblx0Ly9cblx0bGV0IGV4Y2x1ZGUgPSBbXCJjaGlsZHJlblwiLCBcIm5hbWVcIiwgXCJwYXJlbnRfbm9kZVwiLCBcInRvcF9sZXZlbFwiLCBcImlkXCIsIFwibm9wYXJlbnRzXCIsXG5cdFx0ICAgICAgICAgICBcImxldmVsXCIsIFwiYWdlXCIsIFwic2V4XCIsIFwic3RhdHVzXCIsIFwiZGlzcGxheV9uYW1lXCIsIFwibW90aGVyXCIsIFwiZmF0aGVyXCIsXG5cdFx0ICAgICAgICAgICBcInlvYlwiLCBcIm16dHdpblwiLCBcImR6dHdpblwiXTtcblx0JC5tZXJnZShleGNsdWRlLCBzd2l0Y2hlcyk7XG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCI+PHN0cm9uZz5BZ2Ugb2YgRGlhZ25vc2lzOjwvc3Ryb25nPjwvdGQ+PC90cj4nO1xuXHQkLmVhY2gob3B0cy5kaXNlYXNlcywgZnVuY3Rpb24oaywgdikge1xuXHRcdGV4Y2x1ZGUucHVzaCh2LnR5cGUrXCJfZGlhZ25vc2lzX2FnZVwiKTtcblxuXHRcdGxldCBkaXNlYXNlX2NvbG91ciA9ICcmdGhpbnNwOzxzcGFuIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweDtiYWNrZ3JvdW5kOicrb3B0cy5kaXNlYXNlc1trXS5jb2xvdXIrJ1wiPjwvc3Bhbj4nO1xuXHRcdGxldCBkaWFnbm9zaXNfYWdlID0gZC5kYXRhW3YudHlwZSArIFwiX2RpYWdub3Npc19hZ2VcIl07XG5cblx0XHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlwiK2NhcGl0YWxpc2VGaXJzdExldHRlcih2LnR5cGUucmVwbGFjZShcIl9cIiwgXCIgXCIpKStcblx0XHRcdFx0XHRkaXNlYXNlX2NvbG91citcIiZuYnNwOzwvdGQ+PHRkPlwiICtcblx0XHRcdFx0XHRcIjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyBpZD0naWRfXCIgK1xuXHRcdFx0XHRcdHYudHlwZSArIFwiX2RpYWdub3Npc19hZ2VfMCcgbWF4PScxMTAnIG1pbj0nMCcgbmFtZT0nXCIgK1xuXHRcdFx0XHRcdHYudHlwZSArIFwiX2RpYWdub3Npc19hZ2VfMCcgc3R5bGU9J3dpZHRoOjVlbScgdHlwZT0nbnVtYmVyJyB2YWx1ZT0nXCIgK1xuXHRcdFx0XHRcdChkaWFnbm9zaXNfYWdlICE9PSB1bmRlZmluZWQgPyBkaWFnbm9zaXNfYWdlIDogXCJcIikgK1wiJz48L3RkPjwvdHI+XCI7XG5cdH0pO1xuXG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCIgc3R5bGU9XCJsaW5lLWhlaWdodDoxcHg7XCI+PC90ZD48L3RyPic7XG5cdCQuZWFjaChkLmRhdGEsIGZ1bmN0aW9uKGssIHYpIHtcblx0XHRpZigkLmluQXJyYXkoaywgZXhjbHVkZSkgPT0gLTEpIHtcblx0XHRcdGxldCBrayA9IGNhcGl0YWxpc2VGaXJzdExldHRlcihrKTtcblx0XHRcdGlmKHYgPT09IHRydWUgfHwgdiA9PT0gZmFsc2UpIHtcblx0XHRcdFx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5cIitraytcIiZuYnNwOzwvdGQ+PHRkPjxpbnB1dCB0eXBlPSdjaGVja2JveCcgaWQ9J2lkX1wiICsgayArIFwiJyBuYW1lPSdcIiArXG5cdFx0XHRcdFx0XHRrK1wiJyB2YWx1ZT1cIit2K1wiIFwiKyh2ID8gXCJjaGVja2VkXCIgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cdFx0XHR9IGVsc2UgaWYoay5sZW5ndGggPiAwKXtcblx0XHRcdFx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5cIitraytcIiZuYnNwOzwvdGQ+PHRkPjxpbnB1dCB0eXBlPSd0ZXh0JyBpZD0naWRfXCIgK1xuXHRcdFx0XHRcdFx0aytcIicgbmFtZT0nXCIraytcIicgdmFsdWU9XCIrditcIj48L3RkPjwvdHI+XCI7XG5cdFx0XHR9XG5cdFx0fVxuICAgIH0pO1xuXHR0YWJsZSArPSBcIjwvdGFibGU+XCI7XG5cblx0JCgnI25vZGVfcHJvcGVydGllcycpLmh0bWwodGFibGUpO1xuXHQkKCcjbm9kZV9wcm9wZXJ0aWVzJykuZGlhbG9nKCdvcGVuJyk7XG5cblx0Ly8kKCcjaWRfbmFtZScpLmNsb3Nlc3QoJ3RyJykudG9nZ2xlKCk7XG5cdCQoJyNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1yYWRpb10sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1jaGVja2JveF0sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT10ZXh0XSwgI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPW51bWJlcl0nKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0c2F2ZShvcHRzKTtcbiAgICB9KTtcblx0dXBkYXRlKG9wdHMpO1xuXHRyZXR1cm47XG59XG4iLCIvLyBQZWRpZ3JlZSBUcmVlIEJ1aWxkZXJcbmltcG9ydCAgKiBhcyBwZWRpZ3JlZV91dGlscyBmcm9tICcuL3BlZGlncmVlX3V0aWxzLmpzJztcbmltcG9ydCAqIGFzIHBidXR0b25zIGZyb20gJy4vcGJ1dHRvbnMuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQgKiBhcyBpbyBmcm9tICcuL2lvLmpzJztcbmltcG9ydCB7YWRkV2lkZ2V0c30gZnJvbSAnLi93aWRnZXRzLmpzJztcblxuZXhwb3J0IGxldCByb290cyA9IHt9O1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkKG9wdGlvbnMpIHtcblx0bGV0IG9wdHMgPSAkLmV4dGVuZCh7IC8vIGRlZmF1bHRzXG5cdFx0dGFyZ2V0RGl2OiAncGVkaWdyZWVfZWRpdCcsXG5cdFx0ZGF0YXNldDogWyB7XCJuYW1lXCI6IFwibTIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwiZmF0aGVyXCIsIFwic2V4XCI6IFwiTVwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdFx0ICAge1wibmFtZVwiOiBcImYyMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcIm1vdGhlclwiLCBcInNleFwiOiBcIkZcIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHRcdCAgIHtcIm5hbWVcIjogXCJjaDFcIiwgXCJkaXNwbGF5X25hbWVcIjogXCJtZVwiLCBcInNleFwiOiBcIkZcIiwgXCJtb3RoZXJcIjogXCJmMjFcIiwgXCJmYXRoZXJcIjogXCJtMjFcIiwgXCJwcm9iYW5kXCI6IHRydWV9XSxcblx0XHR3aWR0aDogNjAwLFxuXHRcdGhlaWdodDogNDAwLFxuXHRcdHN5bWJvbF9zaXplOiAzNSxcblx0XHR6b29tSW46IDEuMCxcblx0XHR6b29tT3V0OiAxLjAsXG5cdFx0ZGlzZWFzZXM6IFtcdHsndHlwZSc6ICdicmVhc3RfY2FuY2VyJywgJ2NvbG91cic6ICcjRjY4RjM1J30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ2JyZWFzdF9jYW5jZXIyJywgJ2NvbG91cic6ICdwaW5rJ30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ292YXJpYW5fY2FuY2VyJywgJ2NvbG91cic6ICcjNERBQTREJ30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ3BhbmNyZWF0aWNfY2FuY2VyJywgJ2NvbG91cic6ICcjNDI4OUJBJ30sXG5cdFx0XHRcdFx0eyd0eXBlJzogJ3Byb3N0YXRlX2NhbmNlcicsICdjb2xvdXInOiAnI0Q1NDk0QSd9XSxcblx0XHRsYWJlbHM6IFsnc3RpbGxiaXJ0aCcsICdhZ2UnLCAneW9iJywgJ2FsbGVsZXMnXSxcblx0XHRrZWVwX3Byb2JhbmRfb25fcmVzZXQ6IGZhbHNlLFxuXHRcdGZvbnRfc2l6ZTogJy43NWVtJyxcblx0XHRmb250X2ZhbWlseTogJ0hlbHZldGljYScsXG5cdFx0Zm9udF93ZWlnaHQ6IDcwMCxcblx0XHRiYWNrZ3JvdW5kOiBcIiNFRUVcIixcblx0XHRub2RlX2JhY2tncm91bmQ6ICcjZmRmZGZkJyxcblx0XHR2YWxpZGF0ZTogdHJ1ZSxcblx0XHRERUJVRzogZmFsc2V9LCBvcHRpb25zICk7XG5cblx0aWYgKCAkKCBcIiNmdWxsc2NyZWVuXCIgKS5sZW5ndGggPT09IDAgKSB7XG5cdFx0Ly8gYWRkIHVuZG8sIHJlZG8sIGZ1bGxzY3JlZW4gYnV0dG9ucyBhbmQgZXZlbnQgbGlzdGVuZXJzIG9uY2Vcblx0XHRwYnV0dG9ucy5hZGQob3B0cyk7XG5cdFx0aW8uYWRkKG9wdHMpO1xuXHR9XG5cblx0aWYocGVkY2FjaGUubnN0b3JlKG9wdHMpID09IC0xKVxuXHRcdHBlZGNhY2hlLmluaXRfY2FjaGUob3B0cyk7XG5cblx0cGJ1dHRvbnMudXBkYXRlQnV0dG9ucyhvcHRzKTtcblxuXHQvLyB2YWxpZGF0ZSBwZWRpZ3JlZSBkYXRhXG5cdHZhbGlkYXRlX3BlZGlncmVlKG9wdHMpO1xuXHQvLyBncm91cCB0b3AgbGV2ZWwgbm9kZXMgYnkgcGFydG5lcnNcblx0b3B0cy5kYXRhc2V0ID0gZ3JvdXBfdG9wX2xldmVsKG9wdHMuZGF0YXNldCk7XG5cblx0aWYob3B0cy5ERUJVRylcblx0XHRwZWRpZ3JlZV91dGlscy5wcmludF9vcHRzKG9wdHMpO1xuXHRsZXQgc3ZnX2RpbWVuc2lvbnMgPSBnZXRfc3ZnX2RpbWVuc2lvbnMob3B0cyk7XG5cdGxldCBzdmcgPSBkMy5zZWxlY3QoXCIjXCIrb3B0cy50YXJnZXREaXYpXG5cdFx0XHRcdCAuYXBwZW5kKFwic3ZnOnN2Z1wiKVxuXHRcdFx0XHQgLmF0dHIoXCJ3aWR0aFwiLCBzdmdfZGltZW5zaW9ucy53aWR0aClcblx0XHRcdFx0IC5hdHRyKFwiaGVpZ2h0XCIsIHN2Z19kaW1lbnNpb25zLmhlaWdodCk7XG5cblx0c3ZnLmFwcGVuZChcInJlY3RcIilcblx0XHQuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuXHRcdC5hdHRyKFwicnhcIiwgNilcblx0XHQuYXR0cihcInJ5XCIsIDYpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiZGFya2dyZXlcIilcblx0XHQuc3R5bGUoXCJmaWxsXCIsIG9wdHMuYmFja2dyb3VuZCkgLy8gb3Igbm9uZVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAxKTtcblxuXHRsZXQgeHl0cmFuc2Zvcm0gPSBwZWRjYWNoZS5nZXRwb3NpdGlvbihvcHRzKTsgIC8vIGNhY2hlZCBwb3NpdGlvblxuXHRsZXQgeHRyYW5zZm9ybSA9IHh5dHJhbnNmb3JtWzBdO1xuXHRsZXQgeXRyYW5zZm9ybSA9IHh5dHJhbnNmb3JtWzFdO1xuXHRsZXQgem9vbSA9IDE7XG5cdGlmKHh5dHJhbnNmb3JtLmxlbmd0aCA9PSAzKXtcblx0XHR6b29tID0geHl0cmFuc2Zvcm1bMl07XG5cdH1cblxuXHRpZih4dHJhbnNmb3JtID09PSBudWxsIHx8IHl0cmFuc2Zvcm0gPT09IG51bGwpIHtcblx0XHR4dHJhbnNmb3JtID0gb3B0cy5zeW1ib2xfc2l6ZS8yO1xuXHRcdHl0cmFuc2Zvcm0gPSAoLW9wdHMuc3ltYm9sX3NpemUqMi41KTtcblx0fVxuXHRsZXQgcGVkID0gc3ZnLmFwcGVuZChcImdcIilcblx0XHRcdCAuYXR0cihcImNsYXNzXCIsIFwiZGlhZ3JhbVwiKVxuXHRcdFx0IC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3h0cmFuc2Zvcm0rXCIsXCIgKyB5dHJhbnNmb3JtICsgXCIpIHNjYWxlKFwiK3pvb20rXCIpXCIpO1xuXG5cdGxldCB0b3BfbGV2ZWwgPSAkLm1hcChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiAndG9wX2xldmVsJyBpbiB2YWwgJiYgdmFsLnRvcF9sZXZlbCA/IHZhbCA6IG51bGw7fSk7XG5cdGxldCBoaWRkZW5fcm9vdCA9IHtcblx0XHRuYW1lIDogJ2hpZGRlbl9yb290Jyxcblx0XHRpZCA6IDAsXG5cdFx0aGlkZGVuIDogdHJ1ZSxcblx0XHRjaGlsZHJlbiA6IHRvcF9sZXZlbFxuXHR9O1xuXG5cdGxldCBwYXJ0bmVycyA9IHBlZGlncmVlX3V0aWxzLmJ1aWxkVHJlZShvcHRzLCBoaWRkZW5fcm9vdCwgaGlkZGVuX3Jvb3QpWzBdO1xuXHRsZXQgcm9vdCA9IGQzLmhpZXJhcmNoeShoaWRkZW5fcm9vdCk7XG5cdHJvb3RzW29wdHMudGFyZ2V0RGl2XSA9IHJvb3Q7XG5cblx0Ly8gLyBnZXQgc2NvcmUgYXQgZWFjaCBkZXB0aCB1c2VkIHRvIGFkanVzdCBub2RlIHNlcGFyYXRpb25cblx0bGV0IHRyZWVfZGltZW5zaW9ucyA9IGdldF90cmVlX2RpbWVuc2lvbnMob3B0cyk7XG5cdGlmKG9wdHMuREVCVUcpXG5cdFx0Y29uc29sZS5sb2coJ29wdHMud2lkdGg9JytzdmdfZGltZW5zaW9ucy53aWR0aCsnIHdpZHRoPScrdHJlZV9kaW1lbnNpb25zLndpZHRoK1xuXHRcdFx0XHRcdCcgb3B0cy5oZWlnaHQ9JytzdmdfZGltZW5zaW9ucy5oZWlnaHQrJyBoZWlnaHQ9Jyt0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0KTtcblxuXHRsZXQgdHJlZW1hcCA9IGQzLnRyZWUoKS5zZXBhcmF0aW9uKGZ1bmN0aW9uKGEsIGIpIHtcblx0XHRyZXR1cm4gYS5wYXJlbnQgPT09IGIucGFyZW50IHx8IGEuZGF0YS5oaWRkZW4gfHwgYi5kYXRhLmhpZGRlbiA/IDEuMiA6IDIuMjtcblx0fSkuc2l6ZShbdHJlZV9kaW1lbnNpb25zLndpZHRoLCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0XSk7XG5cblx0bGV0IG5vZGVzID0gdHJlZW1hcChyb290LnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYS5kYXRhLmlkIC0gYi5kYXRhLmlkOyB9KSk7XG5cdGxldCBmbGF0dGVuTm9kZXMgPSBub2Rlcy5kZXNjZW5kYW50cygpO1xuXG5cdC8vIGNoZWNrIHRoZSBudW1iZXIgb2YgdmlzaWJsZSBub2RlcyBlcXVhbHMgdGhlIHNpemUgb2YgdGhlIHBlZGlncmVlIGRhdGFzZXRcblx0bGV0IHZpc19ub2RlcyA9ICQubWFwKG9wdHMuZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe3JldHVybiBwLmhpZGRlbiA/IG51bGwgOiBwO30pO1xuXHRpZih2aXNfbm9kZXMubGVuZ3RoICE9IG9wdHMuZGF0YXNldC5sZW5ndGgpIHtcblx0XHR0aHJvdyBjcmVhdGVfZXJyKCdOVU1CRVIgT0YgVklTSUJMRSBOT0RFUyBESUZGRVJFTlQgVE8gTlVNQkVSIElOIFRIRSBEQVRBU0VUJyk7XG5cdH1cblxuXHRwZWRpZ3JlZV91dGlscy5hZGp1c3RfY29vcmRzKG9wdHMsIG5vZGVzLCBmbGF0dGVuTm9kZXMpO1xuXG5cdGxldCBwdHJMaW5rTm9kZXMgPSBwZWRpZ3JlZV91dGlscy5saW5rTm9kZXMoZmxhdHRlbk5vZGVzLCBwYXJ0bmVycyk7XG5cdGNoZWNrX3B0cl9saW5rcyhvcHRzLCBwdHJMaW5rTm9kZXMpOyAgIC8vIGNoZWNrIGZvciBjcm9zc2luZyBvZiBwYXJ0bmVyIGxpbmVzXG5cblx0bGV0IG5vZGUgPSBwZWQuc2VsZWN0QWxsKFwiLm5vZGVcIilcblx0XHRcdFx0ICAuZGF0YShub2Rlcy5kZXNjZW5kYW50cygpKVxuXHRcdFx0XHQgIC5lbnRlcigpXG5cdFx0XHRcdCAgLmFwcGVuZChcImdcIilcblx0XHRcdFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjtcblx0XHRcdFx0XHR9KTtcblxuXHQvLyBwcm92aWRlIGEgYm9yZGVyIHRvIHRoZSBub2RlXG5cdG5vZGUuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gIWQuZGF0YS5oaWRkZW47fSlcblx0XHQuYXR0cihcInNoYXBlLXJlbmRlcmluZ1wiLCBcImdlb21ldHJpY1ByZWNpc2lvblwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5kYXRhLnNleCA9PSBcIlVcIiAmJiAhKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pID8gXCJyb3RhdGUoNDUpXCIgOiBcIlwiO30pXG5cdFx0LmF0dHIoXCJkXCIsIGQzLnN5bWJvbCgpLnNpemUoZnVuY3Rpb24oX2QpIHsgcmV0dXJuIChvcHRzLnN5bWJvbF9zaXplICogb3B0cy5zeW1ib2xfc2l6ZSkgKyAyO30pXG5cdFx0XHRcdC50eXBlKGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0XHRpZihkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKVxuXHRcdFx0XHRcdFx0cmV0dXJuIGQzLnN5bWJvbFRyaWFuZ2xlO1xuXHRcdFx0XHRcdHJldHVybiBkLmRhdGEuc2V4ID09IFwiRlwiID8gZDMuc3ltYm9sQ2lyY2xlIDogZDMuc3ltYm9sU3F1YXJlO30pKVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0cmV0dXJuIGQuZGF0YS5hZ2UgJiYgZC5kYXRhLnlvYiAmJiAhZC5kYXRhLmV4Y2x1ZGUgPyBcIiMzMDMwMzBcIiA6IFwiZ3JleVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRyZXR1cm4gZC5kYXRhLmFnZSAmJiBkLmRhdGEueW9iICYmICFkLmRhdGEuZXhjbHVkZSA/IFwiLjNlbVwiIDogXCIuMWVtXCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuZXhjbHVkZSA/IG51bGwgOiAoXCIzLCAzXCIpO30pXG5cdFx0LnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblx0Ly8gc2V0IGEgY2xpcHBhdGhcblx0bm9kZS5hcHBlbmQoXCJjbGlwUGF0aFwiKVxuXHRcdC5hdHRyKFwiaWRcIiwgZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5kYXRhLm5hbWU7fSkuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gIShkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHKTt9KVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge3JldHVybiBkLmRhdGEuc2V4ID09IFwiVVwiICYmICEoZC5kYXRhLm1pc2NhcnJpYWdlIHx8IGQuZGF0YS50ZXJtaW5hdGlvbikgPyBcInJvdGF0ZSg0NSlcIiA6IFwiXCI7fSlcblx0XHQuYXR0cihcImRcIiwgZDMuc3ltYm9sKCkuc2l6ZShmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmIChkLmRhdGEuaGlkZGVuKVxuXHRcdFx0XHRcdHJldHVybiBvcHRzLnN5bWJvbF9zaXplICogb3B0cy5zeW1ib2xfc2l6ZSAvIDU7XG5cdFx0XHRcdHJldHVybiBvcHRzLnN5bWJvbF9zaXplICogb3B0cy5zeW1ib2xfc2l6ZTtcblx0XHRcdH0pXG5cdFx0XHQudHlwZShmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pXG5cdFx0XHRcdFx0cmV0dXJuIGQzLnN5bWJvbFRyaWFuZ2xlO1xuXHRcdFx0XHRyZXR1cm4gZC5kYXRhLnNleCA9PSBcIkZcIiA/IGQzLnN5bWJvbENpcmNsZSA6ZDMuc3ltYm9sU3F1YXJlO30pKTtcblxuXHQvLyBwaWUgcGxvdHMgZm9yIGRpc2Vhc2UgY29sb3Vyc1xuXHRsZXQgcGllbm9kZSA9IG5vZGUuc2VsZWN0QWxsKFwicGllbm9kZVwiKVxuXHQgICAuZGF0YShmdW5jdGlvbihkKSB7XHQgXHRcdC8vIHNldCB0aGUgZGlzZWFzZSBkYXRhIGZvciB0aGUgcGllIHBsb3Rcblx0XHQgICBsZXQgbmNhbmNlcnMgPSAwO1xuXHRcdCAgIGxldCBjYW5jZXJzID0gJC5tYXAob3B0cy5kaXNlYXNlcywgZnVuY3Rpb24odmFsLCBpKXtcblx0XHRcdCAgIGlmKHByZWZpeEluT2JqKG9wdHMuZGlzZWFzZXNbaV0udHlwZSwgZC5kYXRhKSkge25jYW5jZXJzKys7IHJldHVybiAxO30gZWxzZSByZXR1cm4gMDtcblx0XHQgICB9KTtcblx0XHQgICBpZihuY2FuY2VycyA9PT0gMCkgY2FuY2VycyA9IFsxXTtcblx0XHQgICByZXR1cm4gWyQubWFwKGNhbmNlcnMsIGZ1bmN0aW9uKHZhbCwgX2kpe1xuXHRcdFx0ICAgcmV0dXJuIHsnY2FuY2VyJzogdmFsLCAnbmNhbmNlcnMnOiBuY2FuY2VycywgJ2lkJzogZC5kYXRhLm5hbWUsXG5cdFx0XHRcdFx0XHQnc2V4JzogZC5kYXRhLnNleCwgJ3Byb2JhbmQnOiBkLmRhdGEucHJvYmFuZCwgJ2hpZGRlbic6IGQuZGF0YS5oaWRkZW4sXG5cdFx0XHRcdFx0XHQnYWZmZWN0ZWQnOiBkLmRhdGEuYWZmZWN0ZWQsXG5cdFx0XHRcdFx0XHQnZXhjbHVkZSc6IGQuZGF0YS5leGNsdWRlfTt9KV07XG5cdCAgIH0pXG5cdCAgIC5lbnRlcigpXG5cdFx0LmFwcGVuZChcImdcIik7XG5cblx0cGllbm9kZS5zZWxlY3RBbGwoXCJwYXRoXCIpXG5cdFx0LmRhdGEoZDMucGllKCkudmFsdWUoZnVuY3Rpb24oZCkge3JldHVybiBkLmNhbmNlcjt9KSlcblx0XHQuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0XHQuYXR0cihcImNsaXAtcGF0aFwiLCBmdW5jdGlvbihkKSB7cmV0dXJuIFwidXJsKCNcIitkLmRhdGEuaWQrXCIpXCI7fSkgLy8gY2xpcCB0aGUgcmVjdGFuZ2xlXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicGllbm9kZVwiKVxuXHRcdFx0LmF0dHIoXCJkXCIsIGQzLmFyYygpLmlubmVyUmFkaXVzKDApLm91dGVyUmFkaXVzKG9wdHMuc3ltYm9sX3NpemUpKVxuXHRcdFx0LnN0eWxlKFwiZmlsbFwiLCBmdW5jdGlvbihkLCBpKSB7XG5cdFx0XHRcdGlmKGQuZGF0YS5leGNsdWRlKVxuXHRcdFx0XHRcdHJldHVybiAnbGlnaHRncmV5Jztcblx0XHRcdFx0aWYoZC5kYXRhLm5jYW5jZXJzID09PSAwKSB7XG5cdFx0XHRcdFx0aWYoZC5kYXRhLmFmZmVjdGVkKVxuXHRcdFx0XHRcdFx0cmV0dXJuICdkYXJrZ3JleSc7XG5cdFx0XHRcdFx0cmV0dXJuIG9wdHMubm9kZV9iYWNrZ3JvdW5kO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBvcHRzLmRpc2Vhc2VzW2ldLmNvbG91cjtcblx0XHRcdH0pO1xuXG5cdC8vIGFkb3B0ZWQgaW4vb3V0IGJyYWNrZXRzXG5cdG5vZGUuYXBwZW5kKFwicGF0aFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gIWQuZGF0YS5oaWRkZW4gJiYgKGQuZGF0YS5hZG9wdGVkX2luIHx8IGQuZGF0YS5hZG9wdGVkX291dCk7fSlcblx0XHQuYXR0cihcImRcIiwgZnVuY3Rpb24oX2QpIHsge1xuXHRcdFx0bGV0IGR4ID0gLShvcHRzLnN5bWJvbF9zaXplICogMC42Nik7XG5cdFx0XHRsZXQgZHkgPSAtKG9wdHMuc3ltYm9sX3NpemUgKiAwLjY0KTtcblx0XHRcdGxldCBpbmRlbnQgPSBvcHRzLnN5bWJvbF9zaXplLzQ7XG5cdFx0XHRyZXR1cm4gZ2V0X2JyYWNrZXQoZHgsIGR5LCBpbmRlbnQsIG9wdHMpK2dldF9icmFja2V0KC1keCwgZHksIC1pbmRlbnQsIG9wdHMpO1xuXHRcdFx0fX0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRyZXR1cm4gZC5kYXRhLmFnZSAmJiBkLmRhdGEueW9iICYmICFkLmRhdGEuZXhjbHVkZSA/IFwiIzMwMzAzMFwiIDogXCJncmV5XCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKF9kKSB7XG5cdFx0XHRyZXR1cm4gXCIuMWVtXCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuZXhjbHVkZSA/IG51bGwgOiAoXCIzLCAzXCIpO30pXG5cdFx0LnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIik7XG5cblxuXHQvLyBhbGl2ZSBzdGF0dXMgPSAwOyBkZWFkIHN0YXR1cyA9IDFcblx0bm9kZS5hcHBlbmQoJ2xpbmUnKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtyZXR1cm4gZC5kYXRhLnN0YXR1cyA9PSAxO30pXG5cdFx0XHQuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHRcdFx0LmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gLTAuNipvcHRzLnN5bWJvbF9zaXplO30pXG5cdFx0XHQuYXR0cihcInkxXCIsIGZ1bmN0aW9uKF9kLCBfaSkge3JldHVybiAwLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KVxuXHRcdFx0LmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gMC42Km9wdHMuc3ltYm9sX3NpemU7fSlcblx0XHRcdC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIC0wLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KTtcblxuXHQvLyBuYW1lcyBvZiBpbmRpdmlkdWFsc1xuXHRhZGRMYWJlbChvcHRzLCBub2RlLCBcIi4yNWVtXCIsIC0oMC40ICogb3B0cy5zeW1ib2xfc2l6ZSksIC0oMC4xICogb3B0cy5zeW1ib2xfc2l6ZSksXG5cdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRcdFx0cmV0dXJuICgnZGlzcGxheV9uYW1lJyBpbiBkLmRhdGEgPyBkLmRhdGEuZGlzcGxheV9uYW1lIDogZC5kYXRhLm5hbWUpICsgJyAgJyArIGQuZGF0YS5pZDtcblx0XHRcdFx0cmV0dXJuICdkaXNwbGF5X25hbWUnIGluIGQuZGF0YSA/IGQuZGF0YS5kaXNwbGF5X25hbWUgOiAnJzt9KTtcblxuLypcbiAqIGxldCB3YXJuID0gbm9kZS5maWx0ZXIoZnVuY3Rpb24gKGQpIHsgcmV0dXJuICghZC5kYXRhLmFnZSB8fCAhZC5kYXRhLnlvYikgJiYgIWQuZGF0YS5oaWRkZW47IH0pLmFwcGVuZChcInRleHRcIikgLmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcbiAqIC5hdHRyKFwieFwiLCBcIi4yNWVtXCIpIC5hdHRyKFwieVwiLCAtKDAuNCAqIG9wdHMuc3ltYm9sX3NpemUpLCAtKDAuMiAqIG9wdHMuc3ltYm9sX3NpemUpKSAuaHRtbChcIlxcdWYwNzFcIik7IHdhcm4uYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJpbmNvbXBsZXRlXCIpO1xuICovXG5cblx0bGV0IGZvbnRfc2l6ZSA9IHBhcnNlSW50KGdldFB4KG9wdHMpKSArIDQ7XG5cdC8vIGRpc3BsYXkgbGFiZWwgZGVmaW5lZCBpbiBvcHRzLmxhYmVscyBlLmcuIGFsbGVsZXMvZ2Vub3R5cGUgZGF0YVxuXHRmb3IobGV0IGlsYWI9MDsgaWxhYjxvcHRzLmxhYmVscy5sZW5ndGg7IGlsYWIrKykge1xuXHRcdGxldCBsYWJlbCA9IG9wdHMubGFiZWxzW2lsYWJdO1xuXHRcdGFkZExhYmVsKG9wdHMsIG5vZGUsIFwiLjI1ZW1cIiwgLSgwLjcgKiBvcHRzLnN5bWJvbF9zaXplKSxcblx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYoIWQuZGF0YVtsYWJlbF0pXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRkLnlfb2Zmc2V0ID0gKGlsYWIgPT09IDAgfHwgIWQueV9vZmZzZXQgPyBmb250X3NpemUqMi4yNSA6IGQueV9vZmZzZXQrZm9udF9zaXplKTtcblx0XHRcdFx0cmV0dXJuIGQueV9vZmZzZXQ7XG5cdFx0XHR9LFxuXHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZihkLmRhdGFbbGFiZWxdKSB7XG5cdFx0XHRcdFx0aWYobGFiZWwgPT09ICdhbGxlbGVzJykge1xuXHRcdFx0XHRcdFx0bGV0IGFsbGVsZXMgPSBcIlwiO1xuXHRcdFx0XHRcdFx0bGV0IHZhcnMgPSBkLmRhdGEuYWxsZWxlcy5zcGxpdCgnOycpO1xuXHRcdFx0XHRcdFx0Zm9yKGxldCBpdmFyID0gMDtpdmFyIDwgdmFycy5sZW5ndGg7aXZhcisrKSB7XG5cdFx0XHRcdFx0XHRcdGlmKHZhcnNbaXZhcl0gIT09IFwiXCIpIGFsbGVsZXMgKz0gdmFyc1tpdmFyXSArICc7Jztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiBhbGxlbGVzO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihsYWJlbCA9PT0gJ2FnZScpIHtcblx0XHRcdFx0XHRcdHJldHVybiBkLmRhdGFbbGFiZWxdICsneSc7XG5cdFx0XHRcdFx0fSBlbHNlIGlmKGxhYmVsID09PSAnc3RpbGxiaXJ0aCcpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcIlNCXCI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBkLmRhdGFbbGFiZWxdO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCAnaW5kaV9kZXRhaWxzJyk7XG5cdH1cblxuXHQvLyBpbmRpdmlkdWFscyBkaXNlYXNlIGRldGFpbHNcblx0Zm9yKGxldCBpPTA7aTxvcHRzLmRpc2Vhc2VzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGRpc2Vhc2UgPSBvcHRzLmRpc2Vhc2VzW2ldLnR5cGU7XG5cdFx0YWRkTGFiZWwob3B0cywgbm9kZSwgXCIuMjVlbVwiLCAtKG9wdHMuc3ltYm9sX3NpemUpLFxuXHRcdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdFx0bGV0IHlfb2Zmc2V0ID0gKGQueV9vZmZzZXQgPyBkLnlfb2Zmc2V0K2ZvbnRfc2l6ZTogZm9udF9zaXplKjIuMik7XG5cdFx0XHRcdFx0Zm9yKGxldCBqPTA7ajxvcHRzLmRpc2Vhc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRpZihkaXNlYXNlID09PSBvcHRzLmRpc2Vhc2VzW2pdLnR5cGUpXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0aWYocHJlZml4SW5PYmoob3B0cy5kaXNlYXNlc1tqXS50eXBlLCBkLmRhdGEpKVxuXHRcdFx0XHRcdFx0XHR5X29mZnNldCArPSBmb250X3NpemUtMTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIHlfb2Zmc2V0O1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdFx0bGV0IGRpcyA9IGRpc2Vhc2UucmVwbGFjZSgnXycsICcgJykucmVwbGFjZSgnY2FuY2VyJywgJ2NhLicpO1xuXHRcdFx0XHRcdHJldHVybiBkaXNlYXNlKydfZGlhZ25vc2lzX2FnZScgaW4gZC5kYXRhID8gZGlzICtcIjogXCIrIGQuZGF0YVtkaXNlYXNlKydfZGlhZ25vc2lzX2FnZSddIDogJyc7XG5cdFx0XHRcdH0sICdpbmRpX2RldGFpbHMnKTtcblx0fVxuXG5cdC8vXG5cdGFkZFdpZGdldHMob3B0cywgbm9kZSk7XG5cblx0Ly8gbGlua3MgYmV0d2VlbiBwYXJ0bmVyc1xuXHRsZXQgY2xhc2hfZGVwdGggPSB7fTtcblx0XG5cdC8vIGdldCBwYXRoIGxvb3Bpbmcgb3ZlciBub2RlKHMpXG5cdGxldCBkcmF3X3BhdGggPSBmdW5jdGlvbihjbGFzaCwgZHgsIGR5MSwgZHkyLCBwYXJlbnRfbm9kZSwgY3NoaWZ0KSB7XG5cdFx0bGV0IGV4dGVuZCA9IGZ1bmN0aW9uKGksIGwpIHtcblx0XHRcdGlmKGkrMSA8IGwpICAgLy8gJiYgTWF0aC5hYnMoY2xhc2hbaV0gLSBjbGFzaFtpKzFdKSA8IChvcHRzLnN5bWJvbF9zaXplKjEuMjUpXG5cdFx0XHRcdHJldHVybiBleHRlbmQoKytpKTtcblx0XHRcdHJldHVybiBpO1xuXHRcdH07XG5cdFx0bGV0IHBhdGggPSBcIlwiO1xuXHRcdGZvcihsZXQgaj0wOyBqPGNsYXNoLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRsZXQgayA9IGV4dGVuZChqLCBjbGFzaC5sZW5ndGgpO1xuXHRcdFx0bGV0IGR4MSA9IGNsYXNoW2pdIC0gZHggLSBjc2hpZnQ7XG5cdFx0XHRsZXQgZHgyID0gY2xhc2hba10gKyBkeCArIGNzaGlmdDtcblx0XHRcdGlmKHBhcmVudF9ub2RlLnggPiBkeDEgJiYgcGFyZW50X25vZGUueCA8IGR4Milcblx0XHRcdFx0cGFyZW50X25vZGUueSA9IGR5MjtcblxuXHRcdFx0cGF0aCArPSBcIkxcIiArIGR4MSArIFwiLFwiICsgIChkeTEgLSBjc2hpZnQpICtcblx0XHRcdFx0XHRcIkxcIiArIGR4MSArIFwiLFwiICsgIChkeTIgLSBjc2hpZnQpICtcblx0XHRcdFx0XHRcIkxcIiArIGR4MiArIFwiLFwiICsgIChkeTIgLSBjc2hpZnQpICtcblx0XHRcdFx0XHRcIkxcIiArIGR4MiArIFwiLFwiICsgIChkeTEgLSBjc2hpZnQpO1xuXHRcdFx0aiA9IGs7XG5cdFx0fVxuXHRcdHJldHVybiBwYXRoO1xuXHR9XG5cdFxuXHRcblx0cGFydG5lcnMgPSBwZWQuc2VsZWN0QWxsKFwiLnBhcnRuZXJcIilcblx0XHQuZGF0YShwdHJMaW5rTm9kZXMpXG5cdFx0LmVudGVyKClcblx0XHRcdC5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIiwgXCIjMDAwXCIpXG5cdFx0XHQuYXR0cihcInNoYXBlLXJlbmRlcmluZ1wiLCBcImF1dG9cIilcblx0XHRcdC5hdHRyKCdkJywgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0bGV0IG5vZGUxID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGQubW90aGVyLmRhdGEubmFtZSk7XG5cdFx0XHRcdGxldCBub2RlMiA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLmZhdGhlci5kYXRhLm5hbWUpO1xuXHRcdFx0XHRsZXQgY29uc2FuZ3VpdHkgPSBwZWRpZ3JlZV91dGlscy5jb25zYW5ndWl0eShub2RlMSwgbm9kZTIsIG9wdHMpO1xuXHRcdFx0XHRsZXQgZGl2b3JjZWQgPSAoZC5tb3RoZXIuZGF0YS5kaXZvcmNlZCAmJiAgZC5tb3RoZXIuZGF0YS5kaXZvcmNlZCA9PT0gZC5mYXRoZXIuZGF0YS5uYW1lKTtcblxuXHRcdFx0XHRsZXQgeDEgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLm1vdGhlci54IDogZC5mYXRoZXIueCk7XG5cdFx0XHRcdGxldCB4MiA9IChkLm1vdGhlci54IDwgZC5mYXRoZXIueCA/IGQuZmF0aGVyLnggOiBkLm1vdGhlci54KTtcblx0XHRcdFx0bGV0IGR5MSA9IGQubW90aGVyLnk7XG5cdFx0XHRcdGxldCBkeTIsIGR4LCBwYXJlbnRfbm9kZTtcblxuXHRcdFx0XHQvLyBpZGVudGlmeSBjbGFzaGVzIHdpdGggb3RoZXIgbm9kZXMgYXQgdGhlIHNhbWUgZGVwdGhcblx0XHRcdFx0bGV0IGNsYXNoID0gY2hlY2tfcHRyX2xpbmtfY2xhc2hlcyhvcHRzLCBkKTtcblx0XHRcdFx0bGV0IHBhdGggPSBcIlwiO1xuXHRcdFx0XHRpZihjbGFzaCkge1xuXHRcdFx0XHRcdGlmKGQubW90aGVyLmRlcHRoIGluIGNsYXNoX2RlcHRoKVxuXHRcdFx0XHRcdFx0Y2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdICs9IDQ7XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdID0gNDtcblxuXHRcdFx0XHRcdGR5MSAtPSBjbGFzaF9kZXB0aFtkLm1vdGhlci5kZXB0aF07XG5cdFx0XHRcdFx0ZHggPSBjbGFzaF9kZXB0aFtkLm1vdGhlci5kZXB0aF0gKyBvcHRzLnN5bWJvbF9zaXplLzIgKyAyO1xuXG5cdFx0XHRcdFx0bGV0IHBhcmVudF9ub2RlcyA9IGQubW90aGVyLmRhdGEucGFyZW50X25vZGU7XG5cdFx0XHRcdFx0bGV0IHBhcmVudF9ub2RlX25hbWUgPSBwYXJlbnRfbm9kZXNbMF07XG5cdFx0XHRcdFx0Zm9yKGxldCBpaT0wOyBpaTxwYXJlbnRfbm9kZXMubGVuZ3RoOyBpaSsrKSB7XG5cdFx0XHRcdFx0XHRpZihwYXJlbnRfbm9kZXNbaWldLmZhdGhlci5uYW1lID09PSBkLmZhdGhlci5kYXRhLm5hbWUgJiZcblx0XHRcdFx0XHRcdCAgIHBhcmVudF9ub2Rlc1tpaV0ubW90aGVyLm5hbWUgPT09IGQubW90aGVyLmRhdGEubmFtZSlcblx0XHRcdFx0XHRcdFx0cGFyZW50X25vZGVfbmFtZSA9IHBhcmVudF9ub2Rlc1tpaV0ubmFtZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cGFyZW50X25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgcGFyZW50X25vZGVfbmFtZSk7XG5cdFx0XHRcdFx0cGFyZW50X25vZGUueSA9IGR5MTsgLy8gYWRqdXN0IGhndCBvZiBwYXJlbnQgbm9kZVxuXHRcdFx0XHRcdGNsYXNoLnNvcnQoZnVuY3Rpb24gKGEsYikge3JldHVybiBhIC0gYjt9KTtcblxuXHRcdFx0XHRcdGR5MiA9IChkeTEtb3B0cy5zeW1ib2xfc2l6ZS8yLTMpO1xuXHRcdFx0XHRcdHBhdGggPSBkcmF3X3BhdGgoY2xhc2gsIGR4LCBkeTEsIGR5MiwgcGFyZW50X25vZGUsIDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGRpdm9yY2VfcGF0aCA9IFwiXCI7XG5cdFx0XHRcdGlmKGRpdm9yY2VkICYmICFjbGFzaClcblx0XHRcdFx0XHRkaXZvcmNlX3BhdGggPSBcIk1cIiArICh4MSsoKHgyLXgxKSouNjYpKzYpICsgXCIsXCIgKyAoZHkxLTYpICtcblx0XHRcdFx0XHRcdFx0XHQgICBcIkxcIisgICh4MSsoKHgyLXgxKSouNjYpLTYpICsgXCIsXCIgKyAoZHkxKzYpICtcblx0XHRcdFx0XHRcdFx0XHQgICBcIk1cIiArICh4MSsoKHgyLXgxKSouNjYpKzEwKSArIFwiLFwiICsgKGR5MS02KSArXG5cdFx0XHRcdFx0XHRcdFx0ICAgXCJMXCIrICAoeDErKCh4Mi14MSkqLjY2KS0yKSAgKyBcIixcIiArIChkeTErNik7XG5cdFx0XHRcdGlmKGNvbnNhbmd1aXR5KSB7ICAvLyBjb25zYW5ndWlub3VzLCBkcmF3IGRvdWJsZSBsaW5lIGJldHdlZW4gcGFydG5lcnNcblx0XHRcdFx0XHRkeTEgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLm1vdGhlci55IDogZC5mYXRoZXIueSk7XG5cdFx0XHRcdFx0ZHkyID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5mYXRoZXIueSA6IGQubW90aGVyLnkpO1xuXG5cdFx0XHRcdFx0bGV0IGNzaGlmdCA9IDM7XG5cdFx0XHRcdFx0aWYoTWF0aC5hYnMoZHkxLWR5MikgPiAwLjEpIHtcdCAgLy8gRElGRkVSRU5UIExFVkVMXG5cdFx0XHRcdFx0XHRyZXR1cm5cdFwiTVwiICsgeDEgKyBcIixcIiArIGR5MSArIFwiTFwiICsgeDIgKyBcIixcIiArIGR5MiArXG5cdFx0XHRcdFx0XHRcdFx0XCJNXCIgKyB4MSArIFwiLFwiICsgKGR5MSAtIGNzaGlmdCkgKyBcIkxcIiArIHgyICsgXCIsXCIgKyAoZHkyIC0gY3NoaWZ0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1x0XHRcdFx0XHRcdCAgIC8vIFNBTUUgTEVWRUxcblx0XHRcdFx0XHRcdGxldCBwYXRoMiA9IChjbGFzaCA/IGRyYXdfcGF0aChjbGFzaCwgZHgsIGR5MSwgZHkyLCBwYXJlbnRfbm9kZSwgY3NoaWZ0KSA6IFwiXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuXHRcIk1cIiArIHgxICsgXCIsXCIgKyBkeTEgKyBwYXRoICsgXCJMXCIgKyB4MiArIFwiLFwiICsgZHkxICtcblx0XHRcdFx0XHRcdFx0XHRcIk1cIiArIHgxICsgXCIsXCIgKyAoZHkxIC0gY3NoaWZ0KSArIHBhdGgyICsgXCJMXCIgKyB4MiArIFwiLFwiICsgKGR5MSAtIGNzaGlmdCkgKyBkaXZvcmNlX3BhdGg7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVyblx0XCJNXCIgKyB4MSArIFwiLFwiICsgZHkxICsgcGF0aCArIFwiTFwiICsgeDIgKyBcIixcIiArIGR5MSArIGRpdm9yY2VfcGF0aDtcblx0XHRcdH0pO1xuXG5cdC8vIGxpbmtzIHRvIGNoaWxkcmVuXG5cdHBlZC5zZWxlY3RBbGwoXCIubGlua1wiKVxuXHRcdC5kYXRhKHJvb3QubGlua3Mobm9kZXMuZGVzY2VuZGFudHMoKSkpXG5cdFx0LmVudGVyKClcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0Ly8gZmlsdGVyIHVubGVzcyBkZWJ1ZyBpcyBzZXRcblx0XHRcdFx0cmV0dXJuIChvcHRzLkRFQlVHIHx8XG5cdFx0XHRcdFx0XHQoZC50YXJnZXQuZGF0YS5ub3BhcmVudHMgPT09IHVuZGVmaW5lZCAmJiBkLnNvdXJjZS5wYXJlbnQgIT09IG51bGwgJiYgIWQudGFyZ2V0LmRhdGEuaGlkZGVuKSk7XG5cdFx0XHR9KVxuXHRcdFx0Lmluc2VydChcInBhdGhcIiwgXCJnXCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG5cdFx0XHQuYXR0cihcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm5vcGFyZW50cyAhPT0gdW5kZWZpbmVkIHx8IGQuc291cmNlLnBhcmVudCA9PT0gbnVsbCB8fCBkLnRhcmdldC5kYXRhLmhpZGRlbilcblx0XHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdFx0cmV0dXJuIChvcHRzLkRFQlVHID8gMiA6IDEpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKGQudGFyZ2V0LmRhdGEubm9wYXJlbnRzICE9PSB1bmRlZmluZWQgfHwgZC5zb3VyY2UucGFyZW50ID09PSBudWxsIHx8IGQudGFyZ2V0LmRhdGEuaGlkZGVuKVxuXHRcdFx0XHRcdHJldHVybiAncGluayc7XG5cdFx0XHRcdHJldHVybiBcIiMwMDBcIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInN0cm9rZS1kYXNoYXJyYXlcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoIWQudGFyZ2V0LmRhdGEuYWRvcHRlZF9pbikgcmV0dXJuIG51bGw7XG5cdFx0XHRcdGxldCBkYXNoX2xlbiA9IE1hdGguYWJzKGQuc291cmNlLnktKChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkgLyAyKSk7XG5cdFx0XHRcdGxldCBkYXNoX2FycmF5ID0gW2Rhc2hfbGVuLCAwLCBNYXRoLmFicyhkLnNvdXJjZS54LWQudGFyZ2V0LngpLCAwXTtcblx0XHRcdFx0bGV0IHR3aW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0VHdpbnMob3B0cy5kYXRhc2V0LCBkLnRhcmdldC5kYXRhKTtcblx0XHRcdFx0aWYodHdpbnMubGVuZ3RoID49IDEpIGRhc2hfbGVuID0gZGFzaF9sZW4gKiAzO1xuXHRcdFx0XHRmb3IobGV0IHVzZWRsZW4gPSAwOyB1c2VkbGVuIDwgZGFzaF9sZW47IHVzZWRsZW4gKz0gMTApXG5cdFx0XHRcdFx0JC5tZXJnZShkYXNoX2FycmF5LCBbNSwgNV0pO1xuXHRcdFx0XHRyZXR1cm4gZGFzaF9hcnJheTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInNoYXBlLXJlbmRlcmluZ1wiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm16dHdpbiB8fCBkLnRhcmdldC5kYXRhLmR6dHdpbilcblx0XHRcdFx0XHRyZXR1cm4gXCJnZW9tZXRyaWNQcmVjaXNpb25cIjtcblx0XHRcdFx0cmV0dXJuIFwiYXV0b1wiO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwiZFwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm16dHdpbiB8fCBkLnRhcmdldC5kYXRhLmR6dHdpbikge1xuXHRcdFx0XHRcdC8vIGdldCB0d2luIHBvc2l0aW9uXG5cdFx0XHRcdFx0bGV0IHR3aW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0VHdpbnMob3B0cy5kYXRhc2V0LCBkLnRhcmdldC5kYXRhKTtcblx0XHRcdFx0XHRpZih0d2lucy5sZW5ndGggPj0gMSkge1xuXHRcdFx0XHRcdFx0bGV0IHR3aW54ID0gMDtcblx0XHRcdFx0XHRcdGxldCB4bWluID0gZC50YXJnZXQueDtcblx0XHRcdFx0XHRcdGxldCB4bWF4ID0gZC50YXJnZXQueDtcblx0XHRcdFx0XHRcdGZvcihsZXQgdD0wOyB0PHR3aW5zLmxlbmd0aDsgdCsrKSB7XG5cdFx0XHRcdFx0XHRcdGxldCB0aGlzeCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCB0d2luc1t0XS5uYW1lKS54O1xuXHRcdFx0XHRcdFx0XHRpZih4bWluID4gdGhpc3gpIHhtaW4gPSB0aGlzeDtcblx0XHRcdFx0XHRcdFx0aWYoeG1heCA8IHRoaXN4KSB4bWF4ID0gdGhpc3g7XG5cdFx0XHRcdFx0XHRcdHR3aW54ICs9IHRoaXN4O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRsZXQgeG1pZCA9ICgoZC50YXJnZXQueCArIHR3aW54KSAvICh0d2lucy5sZW5ndGgrMSkpO1xuXHRcdFx0XHRcdFx0bGV0IHltaWQgPSAoKGQuc291cmNlLnkgKyBkLnRhcmdldC55KSAvIDIpO1xuXG5cdFx0XHRcdFx0XHRsZXQgeGhiYXIgPSBcIlwiO1xuXHRcdFx0XHRcdFx0aWYoeG1pbiA9PT0gZC50YXJnZXQueCAmJiBkLnRhcmdldC5kYXRhLm16dHdpbikge1xuXHRcdFx0XHRcdFx0XHQvLyBob3Jpem9udGFsIGJhciBmb3IgbXp0d2luc1xuXHRcdFx0XHRcdFx0XHRsZXQgeHggPSAoeG1pZCArIGQudGFyZ2V0LngpLzI7XG5cdFx0XHRcdFx0XHRcdGxldCB5eSA9ICh5bWlkICsgKGQudGFyZ2V0Lnktb3B0cy5zeW1ib2xfc2l6ZS8yKSkvMjtcblx0XHRcdFx0XHRcdFx0eGhiYXIgPSBcIk1cIiArIHh4ICsgXCIsXCIgKyB5eSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcIkxcIiArICh4bWlkICsgKHhtaWQteHgpKSArIFwiIFwiICsgeXk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiBcIk1cIiArIChkLnNvdXJjZS54KSArIFwiLFwiICsgKGQuc291cmNlLnkgKSArXG5cdFx0XHRcdFx0XHRcdCAgIFwiVlwiICsgeW1pZCArXG5cdFx0XHRcdFx0XHRcdCAgIFwiSFwiICsgeG1pZCArXG5cdFx0XHRcdFx0XHRcdCAgIFwiTFwiICsgKGQudGFyZ2V0LngpICsgXCIgXCIgKyAoZC50YXJnZXQueS1vcHRzLnN5bWJvbF9zaXplLzIpICtcblx0XHRcdFx0XHRcdFx0ICAgeGhiYXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoZC5zb3VyY2UuZGF0YS5tb3RoZXIpIHsgICAvLyBjaGVjayBwYXJlbnRzIGRlcHRoIHRvIHNlZSBpZiB0aGV5IGFyZSBhdCB0aGUgc2FtZSBsZXZlbCBpbiB0aGUgdHJlZVxuXHRcdFx0XHRcdGxldCBtYSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLnNvdXJjZS5kYXRhLm1vdGhlci5uYW1lKTtcblx0XHRcdFx0XHRsZXQgcGEgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5zb3VyY2UuZGF0YS5mYXRoZXIubmFtZSk7XG5cblx0XHRcdFx0XHRpZihtYS5kZXB0aCAhPT0gcGEuZGVwdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcIk1cIiArIChkLnNvdXJjZS54KSArIFwiLFwiICsgKChtYS55ICsgcGEueSkgLyAyKSArXG5cdFx0XHRcdFx0XHRcdCAgIFwiSFwiICsgKGQudGFyZ2V0LngpICtcblx0XHRcdFx0XHRcdFx0ICAgXCJWXCIgKyAoZC50YXJnZXQueSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFwiTVwiICsgKGQuc291cmNlLngpICsgXCIsXCIgKyAoZC5zb3VyY2UueSApICtcblx0XHRcdFx0XHQgICBcIlZcIiArICgoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpIC8gMikgK1xuXHRcdFx0XHRcdCAgIFwiSFwiICsgKGQudGFyZ2V0LngpICtcblx0XHRcdFx0XHQgICBcIlZcIiArIChkLnRhcmdldC55KTtcblx0XHRcdH0pO1xuXG5cdC8vIGRyYXcgcHJvYmFuZCBhcnJvd1xuXHRsZXQgcHJvYmFuZElkeCAgPSBwZWRpZ3JlZV91dGlscy5nZXRQcm9iYW5kSW5kZXgob3B0cy5kYXRhc2V0KTtcblx0aWYodHlwZW9mIHByb2JhbmRJZHggIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0bGV0IHByb2JhbmROb2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIG9wdHMuZGF0YXNldFtwcm9iYW5kSWR4XS5uYW1lKTtcblx0XHRsZXQgdHJpaWQgPSBcInRyaWFuZ2xlXCIrcGVkaWdyZWVfdXRpbHMubWFrZWlkKDMpO1xuXHRcdHBlZC5hcHBlbmQoXCJzdmc6ZGVmc1wiKS5hcHBlbmQoXCJzdmc6bWFya2VyXCIpXHQvLyBhcnJvdyBoZWFkXG5cdFx0XHQuYXR0cihcImlkXCIsIHRyaWlkKVxuXHRcdFx0LmF0dHIoXCJyZWZYXCIsIDYpXG5cdFx0XHQuYXR0cihcInJlZllcIiwgNilcblx0XHRcdC5hdHRyKFwibWFya2VyV2lkdGhcIiwgMjApXG5cdFx0XHQuYXR0cihcIm1hcmtlckhlaWdodFwiLCAyMClcblx0XHRcdC5hdHRyKFwib3JpZW50XCIsIFwiYXV0b1wiKVxuXHRcdFx0LmFwcGVuZChcInBhdGhcIilcblx0XHRcdC5hdHRyKFwiZFwiLCBcIk0gMCAwIDEyIDYgMCAxMiAzIDZcIilcblx0XHRcdC5zdHlsZShcImZpbGxcIiwgXCJibGFja1wiKTtcblxuXHRcdHBlZC5hcHBlbmQoXCJsaW5lXCIpXG5cdFx0XHQuYXR0cihcIngxXCIsIHByb2JhbmROb2RlLngtb3B0cy5zeW1ib2xfc2l6ZSlcblx0XHRcdC5hdHRyKFwieTFcIiwgcHJvYmFuZE5vZGUueStvcHRzLnN5bWJvbF9zaXplKVxuXHRcdFx0LmF0dHIoXCJ4MlwiLCBwcm9iYW5kTm9kZS54LW9wdHMuc3ltYm9sX3NpemUvMilcblx0XHRcdC5hdHRyKFwieTJcIiwgcHJvYmFuZE5vZGUueStvcHRzLnN5bWJvbF9zaXplLzIpXG5cdFx0XHQuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHRcdFx0LmF0dHIoXCJtYXJrZXItZW5kXCIsIFwidXJsKCNcIit0cmlpZCtcIilcIik7XG5cdH1cblx0Ly8gZHJhZyBhbmQgem9vbVxuXHR6b29tID0gZDMuem9vbSgpXG5cdCAgLnNjYWxlRXh0ZW50KFtvcHRzLnpvb21Jbiwgb3B0cy56b29tT3V0XSlcblx0ICAub24oJ3pvb20nLCB6b29tRm4pO1xuXG5cdGZ1bmN0aW9uIHpvb21GbihldmVudCkge1xuXHRcdGxldCB0ID0gZXZlbnQudHJhbnNmb3JtO1xuXHRcdGlmKHBlZGlncmVlX3V0aWxzLmlzSUUoKSAmJiB0LngudG9TdHJpbmcoKS5sZW5ndGggPiAxMClcdC8vIElFIGZpeCBmb3IgZHJhZyBvZmYgc2NyZWVuXG5cdFx0XHRyZXR1cm47XG5cdFx0bGV0IHBvcyA9IFsodC54ICsgcGFyc2VJbnQoeHRyYW5zZm9ybSkpLCAodC55ICsgcGFyc2VJbnQoeXRyYW5zZm9ybSkpXTtcblx0XHRpZih0LmsgPT0gMSkge1xuXHRcdFx0cGVkY2FjaGUuc2V0cG9zaXRpb24ob3B0cywgcG9zWzBdLCBwb3NbMV0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwZWRjYWNoZS5zZXRwb3NpdGlvbihvcHRzLCBwb3NbMF0sIHBvc1sxXSwgdC5rKTtcblx0XHR9XG5cdFx0cGVkLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIHBvc1swXSArICcsJyArIHBvc1sxXSArICcpIHNjYWxlKCcgKyB0LmsgKyAnKScpO1xuXHR9XG5cdHN2Zy5jYWxsKHpvb20pO1xuXHRyZXR1cm4gb3B0cztcbn1cblxuZnVuY3Rpb24gY3JlYXRlX2VycihlcnIpIHtcblx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRyZXR1cm4gbmV3IEVycm9yKGVycik7XG59XG5cbi8vIHZhbGlkYXRlIHBlZGlncmVlIGRhdGFcbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZV9wZWRpZ3JlZShvcHRzKXtcblx0aWYob3B0cy52YWxpZGF0ZSkge1xuXHRcdGlmICh0eXBlb2Ygb3B0cy52YWxpZGF0ZSA9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnQ0FMTElORyBDT05GSUdVUkVEIFZBTElEQVRJT04gRlVOQ1RJT04nKTtcblx0XHRcdHJldHVybiBvcHRzLnZhbGlkYXRlLmNhbGwodGhpcywgb3B0cyk7XG5cdFx0fVxuXG5cdFx0Ly8gY2hlY2sgY29uc2lzdGVuY3kgb2YgcGFyZW50cyBzZXhcblx0XHRsZXQgdW5pcXVlbmFtZXMgPSBbXTtcblx0XHRsZXQgZmFtaWRzID0gW107XG5cdFx0bGV0IGRpc3BsYXlfbmFtZTtcblx0XHRmb3IobGV0IHA9MDsgcDxvcHRzLmRhdGFzZXQubGVuZ3RoOyBwKyspIHtcblx0XHRcdGlmKCFwLmhpZGRlbikge1xuXHRcdFx0XHRpZihvcHRzLmRhdGFzZXRbcF0ubW90aGVyIHx8IG9wdHMuZGF0YXNldFtwXS5mYXRoZXIpIHtcblx0XHRcdFx0XHRkaXNwbGF5X25hbWUgPSBvcHRzLmRhdGFzZXRbcF0uZGlzcGxheV9uYW1lO1xuXHRcdFx0XHRcdGlmKCFkaXNwbGF5X25hbWUpXG5cdFx0XHRcdFx0XHRkaXNwbGF5X25hbWUgPSAndW5uYW1lZCc7XG5cdFx0XHRcdFx0ZGlzcGxheV9uYW1lICs9ICcgKEluZGl2SUQ6ICcrb3B0cy5kYXRhc2V0W3BdLm5hbWUrJyknO1xuXHRcdFx0XHRcdGxldCBtb3RoZXIgPSBvcHRzLmRhdGFzZXRbcF0ubW90aGVyO1xuXHRcdFx0XHRcdGxldCBmYXRoZXIgPSBvcHRzLmRhdGFzZXRbcF0uZmF0aGVyO1xuXHRcdFx0XHRcdGlmKCFtb3RoZXIgfHwgIWZhdGhlcikge1xuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycignTWlzc2luZyBwYXJlbnQgZm9yICcrZGlzcGxheV9uYW1lKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgbWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIG1vdGhlcik7XG5cdFx0XHRcdFx0bGV0IGZpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBmYXRoZXIpO1xuXHRcdFx0XHRcdGlmKG1pZHggPT09IC0xKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycignVGhlIG1vdGhlciAoSW5kaXZJRDogJyttb3RoZXIrJykgb2YgZmFtaWx5IG1lbWJlciAnK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQgZGlzcGxheV9uYW1lKycgaXMgbWlzc2luZyBmcm9tIHRoZSBwZWRpZ3JlZS4nKTtcblx0XHRcdFx0XHRpZihmaWR4ID09PSAtMSlcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ1RoZSBmYXRoZXIgKEluZGl2SUQ6ICcrZmF0aGVyKycpIG9mIGZhbWlseSBtZW1iZXIgJytcblx0XHRcdFx0XHRcdFx0XHRcdFx0IGRpc3BsYXlfbmFtZSsnIGlzIG1pc3NpbmcgZnJvbSB0aGUgcGVkaWdyZWUuJyk7XG5cdFx0XHRcdFx0aWYob3B0cy5kYXRhc2V0W21pZHhdLnNleCAhPT0gXCJGXCIpXG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKFwiVGhlIG1vdGhlciBvZiBmYW1pbHkgbWVtYmVyIFwiK2Rpc3BsYXlfbmFtZStcblx0XHRcdFx0XHRcdFx0XHRcIiBpcyBub3Qgc3BlY2lmaWVkIGFzIGZlbWFsZS4gQWxsIG1vdGhlcnMgaW4gdGhlIHBlZGlncmVlIG11c3QgaGF2ZSBzZXggc3BlY2lmaWVkIGFzICdGJy5cIik7XG5cdFx0XHRcdFx0aWYob3B0cy5kYXRhc2V0W2ZpZHhdLnNleCAhPT0gXCJNXCIpXG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKFwiVGhlIGZhdGhlciBvZiBmYW1pbHkgbWVtYmVyIFwiK2Rpc3BsYXlfbmFtZStcblx0XHRcdFx0XHRcdFx0XHRcIiBpcyBub3Qgc3BlY2lmaWVkIGFzIG1hbGUuIEFsbCBmYXRoZXJzIGluIHRoZSBwZWRpZ3JlZSBtdXN0IGhhdmUgc2V4IHNwZWNpZmllZCBhcyAnTScuXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0aWYoIW9wdHMuZGF0YXNldFtwXS5uYW1lKVxuXHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKGRpc3BsYXlfbmFtZSsnIGhhcyBubyBJbmRpdklELicpO1xuXHRcdFx0aWYoJC5pbkFycmF5KG9wdHMuZGF0YXNldFtwXS5uYW1lLCB1bmlxdWVuYW1lcykgPiAtMSlcblx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycignSW5kaXZJRCBmb3IgZmFtaWx5IG1lbWJlciAnK2Rpc3BsYXlfbmFtZSsnIGlzIG5vdCB1bmlxdWUuJyk7XG5cdFx0XHR1bmlxdWVuYW1lcy5wdXNoKG9wdHMuZGF0YXNldFtwXS5uYW1lKTtcblxuXHRcdFx0aWYoJC5pbkFycmF5KG9wdHMuZGF0YXNldFtwXS5mYW1pZCwgZmFtaWRzKSA9PT0gLTEgJiYgb3B0cy5kYXRhc2V0W3BdLmZhbWlkKSB7XG5cdFx0XHRcdGZhbWlkcy5wdXNoKG9wdHMuZGF0YXNldFtwXS5mYW1pZCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoZmFtaWRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ01vcmUgdGhhbiBvbmUgZmFtaWx5IGZvdW5kOiAnK2ZhbWlkcy5qb2luKFwiLCBcIikrJy4nKTtcblx0XHR9XG5cdFx0Ly8gd2FybiBpZiB0aGVyZSBpcyBhIGJyZWFrIGluIHRoZSBwZWRpZ3JlZVxuXHRcdGxldCB1YyA9IHBlZGlncmVlX3V0aWxzLnVuY29ubmVjdGVkKG9wdHMuZGF0YXNldCk7XG5cdFx0aWYodWMubGVuZ3RoID4gMClcblx0XHRcdGNvbnNvbGUud2FybihcImluZGl2aWR1YWxzIHVuY29ubmVjdGVkIHRvIHBlZGlncmVlIFwiLCB1Yyk7XG5cdH1cbn1cblxuLy9hZG9wdGVkIGluL291dCBicmFja2V0c1xuZnVuY3Rpb24gZ2V0X2JyYWNrZXQoZHgsIGR5LCBpbmRlbnQsIG9wdHMpIHtcblx0cmV0dXJuIFx0XCJNXCIgKyAoZHgraW5kZW50KSArIFwiLFwiICsgZHkgK1xuXHRcdFx0XCJMXCIgKyBkeCArIFwiIFwiICsgZHkgK1xuXHRcdFx0XCJMXCIgKyBkeCArIFwiIFwiICsgKGR5KyhvcHRzLnN5bWJvbF9zaXplICogIDEuMjgpKSArXG5cdFx0XHRcIkxcIiArIGR4ICsgXCIgXCIgKyAoZHkrKG9wdHMuc3ltYm9sX3NpemUgKiAgMS4yOCkpICtcblx0XHRcdFwiTFwiICsgKGR4K2luZGVudCkgKyBcIixcIiArIChkeSsob3B0cy5zeW1ib2xfc2l6ZSAqICAxLjI4KSlcbn1cblxuLy8gY2hlY2sgaWYgdGhlIG9iamVjdCBjb250YWlucyBhIGtleSB3aXRoIGEgZ2l2ZW4gcHJlZml4XG5mdW5jdGlvbiBwcmVmaXhJbk9iaihwcmVmaXgsIG9iaikge1xuXHRsZXQgZm91bmQgPSBmYWxzZTtcblx0aWYob2JqKVxuXHRcdCQuZWFjaChvYmosIGZ1bmN0aW9uKGssIF9uKXtcblx0XHRcdGlmKGsuaW5kZXhPZihwcmVmaXgrXCJfXCIpID09PSAwIHx8IGsgPT09IHByZWZpeCkge1xuXHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHRcdHJldHVybiBmb3VuZDtcblx0XHRcdH1cblx0XHR9KTtcblx0cmV0dXJuIGZvdW5kO1xufVxuXG4vLyBjaGVjayBmb3IgY3Jvc3Npbmcgb2YgcGFydG5lciBsaW5lc1xuZnVuY3Rpb24gY2hlY2tfcHRyX2xpbmtzKG9wdHMsIHB0ckxpbmtOb2Rlcyl7XG5cdGZvcihsZXQgYT0wOyBhPHB0ckxpbmtOb2Rlcy5sZW5ndGg7IGErKykge1xuXHRcdGxldCBjbGFzaCA9IGNoZWNrX3B0cl9saW5rX2NsYXNoZXMob3B0cywgcHRyTGlua05vZGVzW2FdKTtcblx0XHRpZihjbGFzaClcblx0XHRcdGNvbnNvbGUubG9nKFwiQ0xBU0ggOjogXCIrcHRyTGlua05vZGVzW2FdLm1vdGhlci5kYXRhLm5hbWUrXCIgXCIrcHRyTGlua05vZGVzW2FdLmZhdGhlci5kYXRhLm5hbWUsIGNsYXNoKTtcblx0fVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tfcHRyX2xpbmtfY2xhc2hlcyhvcHRzLCBhbm9kZSkge1xuXHRsZXQgcm9vdCA9IHJvb3RzW29wdHMudGFyZ2V0RGl2XTtcblx0bGV0IGZsYXR0ZW5Ob2RlcyA9IHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCk7XG5cdGxldCBtb3RoZXIsIGZhdGhlcjtcblx0aWYoJ25hbWUnIGluIGFub2RlKSB7XG5cdFx0YW5vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgYW5vZGUubmFtZSk7XG5cdFx0aWYoISgnbW90aGVyJyBpbiBhbm9kZS5kYXRhKSlcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdG1vdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBhbm9kZS5kYXRhLm1vdGhlcik7XG5cdFx0ZmF0aGVyID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGFub2RlLmRhdGEuZmF0aGVyKTtcblx0fSBlbHNlIHtcblx0XHRtb3RoZXIgPSBhbm9kZS5tb3RoZXI7XG5cdFx0ZmF0aGVyID0gYW5vZGUuZmF0aGVyO1xuXHR9XG5cblx0bGV0IHgxID0gKG1vdGhlci54IDwgZmF0aGVyLnggPyBtb3RoZXIueCA6IGZhdGhlci54KTtcblx0bGV0IHgyID0gKG1vdGhlci54IDwgZmF0aGVyLnggPyBmYXRoZXIueCA6IG1vdGhlci54KTtcblx0bGV0IGR5ID0gbW90aGVyLnk7XG5cblx0Ly8gaWRlbnRpZnkgY2xhc2hlcyB3aXRoIG90aGVyIG5vZGVzIGF0IHRoZSBzYW1lIGRlcHRoXG5cdGxldCBjbGFzaCA9ICQubWFwKGZsYXR0ZW5Ob2RlcywgZnVuY3Rpb24oYm5vZGUsIF9pKXtcblx0XHRyZXR1cm4gIWJub2RlLmRhdGEuaGlkZGVuICYmXG5cdFx0XHRcdGJub2RlLmRhdGEubmFtZSAhPT0gbW90aGVyLmRhdGEubmFtZSAmJiAgYm5vZGUuZGF0YS5uYW1lICE9PSBmYXRoZXIuZGF0YS5uYW1lICYmXG5cdFx0XHRcdGJub2RlLnkgPT0gZHkgJiYgYm5vZGUueCA+IHgxICYmIGJub2RlLnggPCB4MiA/IGJub2RlLnggOiBudWxsO1xuXHR9KTtcblx0cmV0dXJuIGNsYXNoLmxlbmd0aCA+IDAgPyBjbGFzaCA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldF9zdmdfZGltZW5zaW9ucyhvcHRzKSB7XG5cdHJldHVybiB7J3dpZHRoJyA6IChwYnV0dG9ucy5pc19mdWxsc2NyZWVuKCk/IHdpbmRvdy5pbm5lcldpZHRoICA6IG9wdHMud2lkdGgpLFxuXHRcdFx0J2hlaWdodCc6IChwYnV0dG9ucy5pc19mdWxsc2NyZWVuKCk/IHdpbmRvdy5pbm5lckhlaWdodCA6IG9wdHMuaGVpZ2h0KX07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfdHJlZV9kaW1lbnNpb25zKG9wdHMpIHtcblx0Ly8gLyBnZXQgc2NvcmUgYXQgZWFjaCBkZXB0aCB1c2VkIHRvIGFkanVzdCBub2RlIHNlcGFyYXRpb25cblx0bGV0IHN2Z19kaW1lbnNpb25zID0gZ2V0X3N2Z19kaW1lbnNpb25zKG9wdHMpO1xuXHRsZXQgbWF4c2NvcmUgPSAwO1xuXHRsZXQgZ2VuZXJhdGlvbiA9IHt9O1xuXHRmb3IobGV0IGk9MDsgaTxvcHRzLmRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgZGVwdGggPSBwZWRpZ3JlZV91dGlscy5nZXREZXB0aChvcHRzLmRhdGFzZXQsIG9wdHMuZGF0YXNldFtpXS5uYW1lKTtcblx0XHRsZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxDaGlsZHJlbihvcHRzLmRhdGFzZXQsIG9wdHMuZGF0YXNldFtpXSk7XG5cblx0XHQvLyBzY29yZSBiYXNlZCBvbiBuby4gb2YgY2hpbGRyZW4gYW5kIGlmIHBhcmVudCBkZWZpbmVkXG5cdFx0bGV0IHNjb3JlID0gMSArIChjaGlsZHJlbi5sZW5ndGggPiAwID8gMC41NSsoY2hpbGRyZW4ubGVuZ3RoKjAuMjUpIDogMCkgKyAob3B0cy5kYXRhc2V0W2ldLmZhdGhlciA/IDAuMjUgOiAwKTtcblx0XHRpZihkZXB0aCBpbiBnZW5lcmF0aW9uKVxuXHRcdFx0Z2VuZXJhdGlvbltkZXB0aF0gKz0gc2NvcmU7XG5cdFx0ZWxzZVxuXHRcdFx0Z2VuZXJhdGlvbltkZXB0aF0gPSBzY29yZTtcblxuXHRcdGlmKGdlbmVyYXRpb25bZGVwdGhdID4gbWF4c2NvcmUpXG5cdFx0XHRtYXhzY29yZSA9IGdlbmVyYXRpb25bZGVwdGhdO1xuXHR9XG5cblx0bGV0IG1heF9kZXB0aCA9IE9iamVjdC5rZXlzKGdlbmVyYXRpb24pLmxlbmd0aCpvcHRzLnN5bWJvbF9zaXplKjMuNTtcblx0bGV0IHRyZWVfd2lkdGggPSAgKHN2Z19kaW1lbnNpb25zLndpZHRoIC0gb3B0cy5zeW1ib2xfc2l6ZSA+IG1heHNjb3JlKm9wdHMuc3ltYm9sX3NpemUqMS42NSA/XG5cdFx0XHRcdFx0ICAgc3ZnX2RpbWVuc2lvbnMud2lkdGggLSBvcHRzLnN5bWJvbF9zaXplIDogbWF4c2NvcmUqb3B0cy5zeW1ib2xfc2l6ZSoxLjY1KTtcblx0bGV0IHRyZWVfaGVpZ2h0ID0gKHN2Z19kaW1lbnNpb25zLmhlaWdodCAtIG9wdHMuc3ltYm9sX3NpemUgPiBtYXhfZGVwdGggP1xuXHRcdFx0XHRcdCAgIHN2Z19kaW1lbnNpb25zLmhlaWdodCAtIG9wdHMuc3ltYm9sX3NpemUgOiBtYXhfZGVwdGgpO1xuXHRyZXR1cm4geyd3aWR0aCc6IHRyZWVfd2lkdGgsICdoZWlnaHQnOiB0cmVlX2hlaWdodH07XG59XG5cbi8vIGdyb3VwIHRvcF9sZXZlbCBub2RlcyBieSB0aGVpciBwYXJ0bmVyc1xuZnVuY3Rpb24gZ3JvdXBfdG9wX2xldmVsKGRhdGFzZXQpIHtcblx0Ly8gbGV0IHRvcF9sZXZlbCA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgaSl7cmV0dXJuICd0b3BfbGV2ZWwnIGluIHZhbCAmJiB2YWwudG9wX2xldmVsID8gdmFsIDogbnVsbDt9KTtcblx0Ly8gY2FsY3VsYXRlIHRvcF9sZXZlbCBub2Rlc1xuXHRmb3IobGV0IGk9MDtpPGRhdGFzZXQubGVuZ3RoO2krKykge1xuXHRcdGlmKHBlZGlncmVlX3V0aWxzLmdldERlcHRoKGRhdGFzZXQsIGRhdGFzZXRbaV0ubmFtZSkgPT0gMilcblx0XHRcdGRhdGFzZXRbaV0udG9wX2xldmVsID0gdHJ1ZTtcblx0fVxuXG5cdGxldCB0b3BfbGV2ZWwgPSBbXTtcblx0bGV0IHRvcF9sZXZlbF9zZWVuID0gW107XG5cdGZvcihsZXQgaT0wO2k8ZGF0YXNldC5sZW5ndGg7aSsrKSB7XG5cdFx0bGV0IG5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKCd0b3BfbGV2ZWwnIGluIG5vZGUgJiYgJC5pbkFycmF5KG5vZGUubmFtZSwgdG9wX2xldmVsX3NlZW4pID09IC0xKXtcblx0XHRcdHRvcF9sZXZlbF9zZWVuLnB1c2gobm9kZS5uYW1lKTtcblx0XHRcdHRvcF9sZXZlbC5wdXNoKG5vZGUpO1xuXHRcdFx0bGV0IHB0cnMgPSBwZWRpZ3JlZV91dGlscy5nZXRfcGFydG5lcnMoZGF0YXNldCwgbm9kZSk7XG5cdFx0XHRmb3IobGV0IGo9MDsgajxwdHJzLmxlbmd0aDsgaisrKXtcblx0XHRcdFx0aWYoJC5pbkFycmF5KHB0cnNbal0sIHRvcF9sZXZlbF9zZWVuKSA9PSAtMSkge1xuXHRcdFx0XHRcdHRvcF9sZXZlbF9zZWVuLnB1c2gocHRyc1tqXSk7XG5cdFx0XHRcdFx0dG9wX2xldmVsLnB1c2gocGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwdHJzW2pdKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRsZXQgbmV3ZGF0YXNldCA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiAndG9wX2xldmVsJyBpbiB2YWwgJiYgdmFsLnRvcF9sZXZlbCA/IG51bGwgOiB2YWw7fSk7XG5cdGZvciAobGV0IGkgPSB0b3BfbGV2ZWwubGVuZ3RoOyBpID4gMDsgLS1pKVxuXHRcdG5ld2RhdGFzZXQudW5zaGlmdCh0b3BfbGV2ZWxbaS0xXSk7XG5cdHJldHVybiBuZXdkYXRhc2V0O1xufVxuXG4vLyBnZXQgaGVpZ2h0IGluIHBpeGVsc1xuZnVuY3Rpb24gZ2V0UHgob3B0cyl7XG5cdGxldCBlbVZhbCA9IG9wdHMuZm9udF9zaXplO1xuXHRpZiAoZW1WYWwgPT09IHBhcnNlSW50KGVtVmFsLCAxMCkpIC8vIHRlc3QgaWYgaW50ZWdlclxuXHRcdHJldHVybiBlbVZhbDtcblxuXHRpZihlbVZhbC5pbmRleE9mKFwicHhcIikgPiAtMSlcblx0XHRyZXR1cm4gZW1WYWwucmVwbGFjZSgncHgnLCAnJyk7XG5cdGVsc2UgaWYoZW1WYWwuaW5kZXhPZihcImVtXCIpID09PSAtMSlcblx0XHRyZXR1cm4gZW1WYWw7XG5cdGVtVmFsID0gcGFyc2VGbG9hdChlbVZhbC5yZXBsYWNlKCdlbScsICcnKSk7XG5cdHJldHVybiAocGFyc2VGbG9hdChnZXRDb21wdXRlZFN0eWxlKCQoJyMnK29wdHMudGFyZ2V0RGl2KS5nZXQoMCkpLmZvbnRTaXplKSplbVZhbCktMS4wO1xufVxuXG4vLyBBZGQgbGFiZWxcbmZ1bmN0aW9uIGFkZExhYmVsKG9wdHMsIG5vZGUsIHNpemUsIGZ4LCBmeSwgZnRleHQsIGNsYXNzX2xhYmVsKSB7XG5cdG5vZGUuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XG5cdFx0cmV0dXJuIGQuZGF0YS5oaWRkZW4gJiYgIW9wdHMuREVCVUcgPyBmYWxzZSA6IHRydWU7XG5cdH0pLmFwcGVuZChcInRleHRcIilcblx0LmF0dHIoXCJjbGFzc1wiLCBjbGFzc19sYWJlbCArICcgcGVkX2xhYmVsJyB8fCBcInBlZF9sYWJlbFwiKVxuXHQuYXR0cihcInhcIiwgZngpXG5cdC5hdHRyKFwieVwiLCBmeSlcblx0Ly8gLmF0dHIoXCJkeVwiLCBzaXplKVxuXHQuYXR0cihcImZvbnQtZmFtaWx5XCIsIG9wdHMuZm9udF9mYW1pbHkpXG5cdC5hdHRyKFwiZm9udC1zaXplXCIsIG9wdHMuZm9udF9zaXplKVxuXHQuYXR0cihcImZvbnQtd2VpZ2h0XCIsIG9wdHMuZm9udF93ZWlnaHQpXG5cdC50ZXh0KGZ0ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYnVpbGQob3B0cykge1xuXHQkKFwiI1wiK29wdHMudGFyZ2V0RGl2KS5lbXB0eSgpO1xuXHRwZWRjYWNoZS5pbml0X2NhY2hlKG9wdHMpO1xuXHR0cnkge1xuXHRcdGJ1aWxkKG9wdHMpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdHRocm93IGU7XG5cdH1cblxuXHR0cnkge1xuXHRcdHRlbXBsYXRlcy51cGRhdGUob3B0cyk7XG5cdH0gY2F0Y2goZSkge1xuXHRcdC8vIHRlbXBsYXRlcyBub3QgZGVjbGFyZWRcblx0fVxufVxuXG4vLyBhZGQgY2hpbGRyZW4gdG8gYSBnaXZlbiBub2RlXG5leHBvcnQgZnVuY3Rpb24gYWRkY2hpbGQoZGF0YXNldCwgbm9kZSwgc2V4LCBuY2hpbGQsIHR3aW5fdHlwZSkge1xuXHRpZih0d2luX3R5cGUgJiYgJC5pbkFycmF5KHR3aW5fdHlwZSwgWyBcIm16dHdpblwiLCBcImR6dHdpblwiIF0gKSA9PT0gLTEpXG5cdFx0cmV0dXJuIG5ldyBFcnJvcihcIklOVkFMSUQgVFdJTiBUWVBFIFNFVDogXCIrdHdpbl90eXBlKTtcblxuXHRpZiAodHlwZW9mIG5jaGlsZCA9PT0gdHlwZW9mIHVuZGVmaW5lZClcblx0XHRuY2hpbGQgPSAxO1xuXHRsZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxDaGlsZHJlbihkYXRhc2V0LCBub2RlKTtcblx0bGV0IHB0cl9uYW1lLCBpZHg7XG5cdGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcblx0XHRsZXQgcGFydG5lciA9IGFkZHNpYmxpbmcoZGF0YXNldCwgbm9kZSwgbm9kZS5zZXggPT09ICdGJyA/ICdNJzogJ0YnLCBub2RlLnNleCA9PT0gJ0YnKTtcblx0XHRwYXJ0bmVyLm5vcGFyZW50cyA9IHRydWU7XG5cdFx0cHRyX25hbWUgPSBwYXJ0bmVyLm5hbWU7XG5cdFx0aWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5vZGUubmFtZSkrMTtcblx0fSBlbHNlIHtcblx0XHRsZXQgYyA9IGNoaWxkcmVuWzBdO1xuXHRcdHB0cl9uYW1lID0gKGMuZmF0aGVyID09PSBub2RlLm5hbWUgPyBjLm1vdGhlciA6IGMuZmF0aGVyKTtcblx0XHRpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgYy5uYW1lKTtcblx0fVxuXG5cdGxldCB0d2luX2lkO1xuXHRpZih0d2luX3R5cGUpXG5cdFx0dHdpbl9pZCA9IGdldFVuaXF1ZVR3aW5JRChkYXRhc2V0LCB0d2luX3R5cGUpO1xuXHRsZXQgbmV3Y2hpbGRyZW4gPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuY2hpbGQ7IGkrKykge1xuXHRcdGxldCBjaGlsZCA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBzZXgsXG5cdFx0XHRcdFx0IFwibW90aGVyXCI6IChub2RlLnNleCA9PT0gJ0YnID8gbm9kZS5uYW1lIDogcHRyX25hbWUpLFxuXHRcdFx0XHRcdCBcImZhdGhlclwiOiAobm9kZS5zZXggPT09ICdGJyA/IHB0cl9uYW1lIDogbm9kZS5uYW1lKX07XG5cdFx0ZGF0YXNldC5zcGxpY2UoaWR4LCAwLCBjaGlsZCk7XG5cblx0XHRpZih0d2luX3R5cGUpXG5cdFx0XHRjaGlsZFt0d2luX3R5cGVdID0gdHdpbl9pZDtcblx0XHRuZXdjaGlsZHJlbi5wdXNoKGNoaWxkKTtcblx0fVxuXHRyZXR1cm4gbmV3Y2hpbGRyZW47XG59XG5cbi8vXG5leHBvcnQgZnVuY3Rpb24gYWRkc2libGluZyhkYXRhc2V0LCBub2RlLCBzZXgsIGFkZF9saHMsIHR3aW5fdHlwZSkge1xuXHRpZih0d2luX3R5cGUgJiYgJC5pbkFycmF5KHR3aW5fdHlwZSwgWyBcIm16dHdpblwiLCBcImR6dHdpblwiIF0gKSA9PT0gLTEpXG5cdFx0cmV0dXJuIG5ldyBFcnJvcihcIklOVkFMSUQgVFdJTiBUWVBFIFNFVDogXCIrdHdpbl90eXBlKTtcblxuXHRsZXQgbmV3YmllID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IHNleH07XG5cdGlmKG5vZGUudG9wX2xldmVsKSB7XG5cdFx0bmV3YmllLnRvcF9sZXZlbCA9IHRydWU7XG5cdH0gZWxzZSB7XG5cdFx0bmV3YmllLm1vdGhlciA9IG5vZGUubW90aGVyO1xuXHRcdG5ld2JpZS5mYXRoZXIgPSBub2RlLmZhdGhlcjtcblx0fVxuXHRsZXQgaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5vZGUubmFtZSk7XG5cblx0aWYodHdpbl90eXBlKSB7XG5cdFx0c2V0TXpUd2luKGRhdGFzZXQsIGRhdGFzZXRbaWR4XSwgbmV3YmllLCB0d2luX3R5cGUpO1xuXHR9XG5cblx0aWYoYWRkX2xocykgeyAvLyBhZGQgdG8gTEhTXG5cdFx0aWYoaWR4ID4gMCkgaWR4LS07XG5cdH0gZWxzZVxuXHRcdGlkeCsrO1xuXHRkYXRhc2V0LnNwbGljZShpZHgsIDAsIG5ld2JpZSk7XG5cdHJldHVybiBuZXdiaWU7XG59XG5cbi8vIHNldCB0d28gc2libGluZ3MgYXMgdHdpbnNcbmZ1bmN0aW9uIHNldE16VHdpbihkYXRhc2V0LCBkMSwgZDIsIHR3aW5fdHlwZSkge1xuXHRpZighZDFbdHdpbl90eXBlXSkge1xuXHRcdGQxW3R3aW5fdHlwZV0gPSBnZXRVbmlxdWVUd2luSUQoZGF0YXNldCwgdHdpbl90eXBlKTtcblx0XHRpZighZDFbdHdpbl90eXBlXSlcblx0XHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRkMlt0d2luX3R5cGVdID0gZDFbdHdpbl90eXBlXTtcblx0aWYoZDEueW9iKVxuXHRcdGQyLnlvYiA9IGQxLnlvYjtcblx0aWYoZDEuYWdlICYmIChkMS5zdGF0dXMgPT0gMCB8fCAhZDEuc3RhdHVzKSlcblx0XHRkMi5hZ2UgPSBkMS5hZ2U7XG5cdHJldHVybiB0cnVlO1xufVxuXG4vLyBnZXQgYSBuZXcgdW5pcXVlIHR3aW5zIElELCBtYXggb2YgMTAgdHdpbnMgaW4gYSBwZWRpZ3JlZVxuZnVuY3Rpb24gZ2V0VW5pcXVlVHdpbklEKGRhdGFzZXQsIHR3aW5fdHlwZSkge1xuXHRsZXQgbXogPSBbMSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgXCJBXCJdO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYoZGF0YXNldFtpXVt0d2luX3R5cGVdKSB7XG5cdFx0XHRsZXQgaWR4ID0gbXouaW5kZXhPZihkYXRhc2V0W2ldW3R3aW5fdHlwZV0pO1xuXHRcdFx0aWYgKGlkeCA+IC0xKVxuXHRcdFx0XHRtei5zcGxpY2UoaWR4LCAxKTtcblx0XHR9XG5cdH1cblx0aWYobXoubGVuZ3RoID4gMClcblx0XHRyZXR1cm4gbXpbMF07XG5cdHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8vIHN5bmMgYXR0cmlidXRlcyBvZiB0d2luc1xuZXhwb3J0IGZ1bmN0aW9uIHN5bmNUd2lucyhkYXRhc2V0LCBkMSkge1xuXHRpZighZDEubXp0d2luICYmICFkMS5kenR3aW4pXG5cdFx0cmV0dXJuO1xuXHRsZXQgdHdpbl90eXBlID0gKGQxLm16dHdpbiA/IFwibXp0d2luXCIgOiBcImR6dHdpblwiKTtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkMiA9IGRhdGFzZXRbaV07XG5cdFx0aWYoZDJbdHdpbl90eXBlXSAmJiBkMVt0d2luX3R5cGVdID09IGQyW3R3aW5fdHlwZV0gJiYgZDIubmFtZSAhPT0gZDEubmFtZSkge1xuXHRcdFx0aWYodHdpbl90eXBlID09PSBcIm16dHdpblwiKVxuXHRcdFx0ICBkMi5zZXggPSBkMS5zZXg7XG5cdFx0XHRpZihkMS55b2IpXG5cdFx0XHRcdGQyLnlvYiA9IGQxLnlvYjtcblx0XHRcdGlmKGQxLmFnZSAmJiAoZDEuc3RhdHVzID09IDAgfHwgIWQxLnN0YXR1cykpXG5cdFx0XHRcdGQyLmFnZSA9IGQxLmFnZTtcblx0XHR9XG5cdH1cbn1cblxuLy8gY2hlY2sgaW50ZWdyaXR5IHR3aW4gc2V0dGluZ3NcbmZ1bmN0aW9uIGNoZWNrVHdpbnMoZGF0YXNldCkge1xuXHRsZXQgdHdpbl90eXBlcyA9IFtcIm16dHdpblwiLCBcImR6dHdpblwiXTtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGZvcihsZXQgaj0wOyBqPHR3aW5fdHlwZXMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGxldCB0d2luX3R5cGUgPSB0d2luX3R5cGVzW2pdO1xuXHRcdFx0aWYoZGF0YXNldFtpXVt0d2luX3R5cGVdKSB7XG5cdFx0XHRcdGxldCBjb3VudCA9IDA7XG5cdFx0XHRcdGZvcihsZXQgaj0wOyBqPGRhdGFzZXQubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRpZihkYXRhc2V0W2pdW3R3aW5fdHlwZV0gPT0gZGF0YXNldFtpXVt0d2luX3R5cGVdKVxuXHRcdFx0XHRcdFx0Y291bnQrKztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihjb3VudCA8IDIpXG5cdFx0XHRcdFx0ZGVsZXRlIGRhdGFzZXRbaV1bW3R3aW5fdHlwZV1dO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufVxuXG4vLyBhZGQgcGFyZW50cyB0byB0aGUgJ25vZGUnXG5leHBvcnQgZnVuY3Rpb24gYWRkcGFyZW50cyhvcHRzLCBkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCBtb3RoZXIsIGZhdGhlcjtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbGF0X3RyZWUgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgdHJlZV9ub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIG5hbWUpO1xuXHRsZXQgbm9kZSAgPSB0cmVlX25vZGUuZGF0YTtcblx0bGV0IGRlcHRoID0gdHJlZV9ub2RlLmRlcHRoOyAgIC8vIGRlcHRoIG9mIHRoZSBub2RlIGluIHJlbGF0aW9uIHRvIHRoZSByb290IChkZXB0aCA9IDEgaXMgYSB0b3BfbGV2ZWwgbm9kZSlcblxuXHRsZXQgcGlkID0gLTEwMTtcblx0bGV0IHB0cl9uYW1lO1xuXHRsZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxDaGlsZHJlbihkYXRhc2V0LCBub2RlKTtcblx0aWYoY2hpbGRyZW4ubGVuZ3RoID4gMCl7XG5cdFx0cHRyX25hbWUgPSBjaGlsZHJlblswXS5tb3RoZXIgPT0gbm9kZS5uYW1lID8gY2hpbGRyZW5bMF0uZmF0aGVyIDogY2hpbGRyZW5bMF0ubW90aGVyO1xuXHRcdHBpZCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBwdHJfbmFtZSkuZGF0YS5pZDtcblx0fVxuXG5cdGxldCBpO1xuXHRpZihkZXB0aCA9PSAxKSB7XG5cdFx0bW90aGVyID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IFwiRlwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfTtcblx0XHRmYXRoZXIgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogXCJNXCIsIFwidG9wX2xldmVsXCI6IHRydWV9O1xuXHRcdGRhdGFzZXQuc3BsaWNlKDAsIDAsIG1vdGhlcik7XG5cdFx0ZGF0YXNldC5zcGxpY2UoMCwgMCwgZmF0aGVyKTtcblxuXHRcdGZvcihpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKyl7XG5cdFx0XHRpZihkYXRhc2V0W2ldLnRvcF9sZXZlbCAmJiBkYXRhc2V0W2ldLm5hbWUgIT09IG1vdGhlci5uYW1lICYmIGRhdGFzZXRbaV0ubmFtZSAhPT0gZmF0aGVyLm5hbWUpe1xuXHRcdFx0XHRkZWxldGUgZGF0YXNldFtpXS50b3BfbGV2ZWw7XG5cdFx0XHRcdGRhdGFzZXRbaV0ubm9wYXJlbnRzID0gdHJ1ZTtcblx0XHRcdFx0ZGF0YXNldFtpXS5tb3RoZXIgPSBtb3RoZXIubmFtZTtcblx0XHRcdFx0ZGF0YXNldFtpXS5mYXRoZXIgPSBmYXRoZXIubmFtZTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0bGV0IG5vZGVfbW90aGVyID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIHRyZWVfbm9kZS5kYXRhLm1vdGhlcik7XG5cdFx0bGV0IG5vZGVfZmF0aGVyID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIHRyZWVfbm9kZS5kYXRhLmZhdGhlcik7XG5cdFx0bGV0IG5vZGVfc2licyA9IHBlZGlncmVlX3V0aWxzLmdldEFsbFNpYmxpbmdzKGRhdGFzZXQsIG5vZGUpO1xuXG5cdFx0Ly8gbGhzICYgcmhzIGlkJ3MgZm9yIHNpYmxpbmdzIG9mIHRoaXMgbm9kZVxuXHRcdGxldCByaWQgPSAxMDAwMDtcblx0XHRsZXQgbGlkID0gdHJlZV9ub2RlLmRhdGEuaWQ7XG5cdFx0Zm9yKGk9MDsgaTxub2RlX3NpYnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IHNpZCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBub2RlX3NpYnNbaV0ubmFtZSkuZGF0YS5pZDtcblx0XHRcdGlmKHNpZCA8IHJpZCAmJiBzaWQgPiB0cmVlX25vZGUuZGF0YS5pZClcblx0XHRcdFx0cmlkID0gc2lkO1xuXHRcdFx0aWYoc2lkIDwgbGlkKVxuXHRcdFx0XHRsaWQgPSBzaWQ7XG5cdFx0fVxuXHRcdGxldCBhZGRfbGhzID0gKGxpZCA+PSB0cmVlX25vZGUuZGF0YS5pZCB8fCAocGlkID09IGxpZCAmJiByaWQgPCAxMDAwMCkpO1xuXHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRjb25zb2xlLmxvZygnbGlkPScrbGlkKycgcmlkPScrcmlkKycgbmlkPScrdHJlZV9ub2RlLmRhdGEuaWQrJyBBRERfTEhTPScrYWRkX2xocyk7XG5cdFx0bGV0IG1pZHg7XG5cdFx0aWYoICghYWRkX2xocyAmJiBub2RlX2ZhdGhlci5kYXRhLmlkID4gbm9kZV9tb3RoZXIuZGF0YS5pZCkgfHxcblx0XHRcdChhZGRfbGhzICYmIG5vZGVfZmF0aGVyLmRhdGEuaWQgPCBub2RlX21vdGhlci5kYXRhLmlkKSApXG5cdFx0XHRtaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5vZGUuZmF0aGVyKTtcblx0XHRlbHNlXG5cdFx0XHRtaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5vZGUubW90aGVyKTtcblxuXHRcdGxldCBwYXJlbnQgPSBkYXRhc2V0W21pZHhdO1xuXHRcdGZhdGhlciA9IGFkZHNpYmxpbmcoZGF0YXNldCwgcGFyZW50LCAnTScsIGFkZF9saHMpO1xuXHRcdG1vdGhlciA9IGFkZHNpYmxpbmcoZGF0YXNldCwgcGFyZW50LCAnRicsIGFkZF9saHMpO1xuXG5cdFx0bGV0IGZhaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGZhdGhlci5uYW1lKTtcblx0XHRsZXQgbW9pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbW90aGVyLm5hbWUpO1xuXHRcdGlmKGZhaWR4ID4gbW9pZHgpIHtcdFx0XHRcdCAgIC8vIHN3aXRjaCB0byBlbnN1cmUgZmF0aGVyIG9uIGxocyBvZiBtb3RoZXJcblx0XHRcdGxldCB0bXBmYSA9IGRhdGFzZXRbZmFpZHhdO1xuXHRcdFx0ZGF0YXNldFtmYWlkeF0gPSBkYXRhc2V0W21vaWR4XTtcblx0XHRcdGRhdGFzZXRbbW9pZHhdID0gdG1wZmE7XG5cdFx0fVxuXG5cdFx0bGV0IG9ycGhhbnMgPSBwZWRpZ3JlZV91dGlscy5nZXRBZG9wdGVkU2libGluZ3MoZGF0YXNldCwgbm9kZSk7XG5cdFx0bGV0IG5pZCA9IHRyZWVfbm9kZS5kYXRhLmlkO1xuXHRcdGZvcihpPTA7IGk8b3JwaGFucy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRsZXQgb2lkID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIG9ycGhhbnNbaV0ubmFtZSkuZGF0YS5pZDtcblx0XHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdPUlBIQU49JytpKycgJytvcnBoYW5zW2ldLm5hbWUrJyAnKyhuaWQgPCBvaWQgJiYgb2lkIDwgcmlkKSsnIG5pZD0nK25pZCsnIG9pZD0nK29pZCsnIHJpZD0nK3JpZCk7XG5cdFx0XHRpZigoYWRkX2xocyB8fCBuaWQgPCBvaWQpICYmIG9pZCA8IHJpZCl7XG5cdFx0XHRcdGxldCBvaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG9ycGhhbnNbaV0ubmFtZSk7XG5cdFx0XHRcdGRhdGFzZXRbb2lkeF0ubW90aGVyID0gbW90aGVyLm5hbWU7XG5cdFx0XHRcdGRhdGFzZXRbb2lkeF0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aWYoZGVwdGggPT0gMikge1xuXHRcdG1vdGhlci50b3BfbGV2ZWwgPSB0cnVlO1xuXHRcdGZhdGhlci50b3BfbGV2ZWwgPSB0cnVlO1xuXHR9IGVsc2UgaWYoZGVwdGggPiAyKSB7XG5cdFx0bW90aGVyLm5vcGFyZW50cyA9IHRydWU7XG5cdFx0ZmF0aGVyLm5vcGFyZW50cyA9IHRydWU7XG5cdH1cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpO1xuXHRkYXRhc2V0W2lkeF0ubW90aGVyID0gbW90aGVyLm5hbWU7XG5cdGRhdGFzZXRbaWR4XS5mYXRoZXIgPSBmYXRoZXIubmFtZTtcblx0ZGVsZXRlIGRhdGFzZXRbaWR4XS5ub3BhcmVudHM7XG5cblx0aWYoJ3BhcmVudF9ub2RlJyBpbiBub2RlKSB7XG5cdFx0bGV0IHB0cl9ub2RlID0gZGF0YXNldFtwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgcHRyX25hbWUpXTtcblx0XHRpZignbm9wYXJlbnRzJyBpbiBwdHJfbm9kZSkge1xuXHRcdFx0cHRyX25vZGUubW90aGVyID0gbW90aGVyLm5hbWU7XG5cdFx0XHRwdHJfbm9kZS5mYXRoZXIgPSBmYXRoZXIubmFtZTtcblx0XHR9XG5cdH1cbn1cblxuLy8gYWRkIHBhcnRuZXJcbmV4cG9ydCBmdW5jdGlvbiBhZGRwYXJ0bmVyKG9wdHMsIGRhdGFzZXQsIG5hbWUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbGF0X3RyZWUgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgdHJlZV9ub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIG5hbWUpO1xuXG5cdGxldCBwYXJ0bmVyID0gYWRkc2libGluZyhkYXRhc2V0LCB0cmVlX25vZGUuZGF0YSwgdHJlZV9ub2RlLmRhdGEuc2V4ID09PSAnRicgPyAnTScgOiAnRicsIHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnKTtcblx0cGFydG5lci5ub3BhcmVudHMgPSB0cnVlO1xuXG5cdGxldCBjaGlsZCA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBcIk1cIn07XG5cdGNoaWxkLm1vdGhlciA9ICh0cmVlX25vZGUuZGF0YS5zZXggPT09ICdGJyA/IHRyZWVfbm9kZS5kYXRhLm5hbWUgOiBwYXJ0bmVyLm5hbWUpO1xuXHRjaGlsZC5mYXRoZXIgPSAodHJlZV9ub2RlLmRhdGEuc2V4ID09PSAnRicgPyBwYXJ0bmVyLm5hbWUgOiB0cmVlX25vZGUuZGF0YS5uYW1lKTtcblxuXHRsZXQgaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIHRyZWVfbm9kZS5kYXRhLm5hbWUpKzI7XG5cdGRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xufVxuXG4vLyBnZXQgYWRqYWNlbnQgbm9kZXMgYXQgdGhlIHNhbWUgZGVwdGhcbmZ1bmN0aW9uIGFkamFjZW50X25vZGVzKHJvb3QsIG5vZGUsIGV4Y2x1ZGVzKSB7XG5cdGxldCBkbm9kZXMgPSBwZWRpZ3JlZV91dGlscy5nZXROb2Rlc0F0RGVwdGgocGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KSwgbm9kZS5kZXB0aCwgZXhjbHVkZXMpO1xuXHRsZXQgbGhzX25vZGUsIHJoc19ub2RlO1xuXHRmb3IobGV0IGk9MDsgaTxkbm9kZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZihkbm9kZXNbaV0ueCA8IG5vZGUueClcblx0XHRcdGxoc19ub2RlID0gZG5vZGVzW2ldO1xuXHRcdGlmKCFyaHNfbm9kZSAmJiBkbm9kZXNbaV0ueCA+IG5vZGUueClcblx0XHRcdHJoc19ub2RlID0gZG5vZGVzW2ldO1xuXHR9XG5cdHJldHVybiBbbGhzX25vZGUsIHJoc19ub2RlXTtcbn1cblxuLy8gZGVsZXRlIGEgbm9kZSBhbmQgZGVzY2VuZGFudHNcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVfbm9kZV9kYXRhc2V0KGRhdGFzZXQsIG5vZGUsIG9wdHMsIG9uRG9uZSkge1xuXHRsZXQgcm9vdCA9IHJvb3RzW29wdHMudGFyZ2V0RGl2XTtcblx0bGV0IGZub2RlcyA9IHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCk7XG5cdGxldCBkZWxldGVzID0gW107XG5cdGxldCBpLCBqO1xuXG5cdC8vIGdldCBkMyBkYXRhIG5vZGVcblx0aWYobm9kZS5pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0bGV0IGQzbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZm5vZGVzLCBub2RlLm5hbWUpO1xuXHRcdGlmKGQzbm9kZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bm9kZSA9IGQzbm9kZS5kYXRhO1xuXHR9XG5cblx0aWYobm9kZS5wYXJlbnRfbm9kZSkge1xuXHRcdGZvcihpPTA7IGk8bm9kZS5wYXJlbnRfbm9kZS5sZW5ndGg7IGkrKyl7XG5cdFx0XHRsZXQgcGFyZW50ID0gbm9kZS5wYXJlbnRfbm9kZVtpXTtcblx0XHRcdGxldCBwcyA9IFtwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIHBhcmVudC5tb3RoZXIubmFtZSksXG5cdFx0XHRcdFx0ICBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIHBhcmVudC5mYXRoZXIubmFtZSldO1xuXHRcdFx0Ly8gZGVsZXRlIHBhcmVudHNcblx0XHRcdGZvcihqPTA7IGo8cHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYocHNbal0ubmFtZSA9PT0gbm9kZS5uYW1lIHx8IHBzW2pdLm5vcGFyZW50cyAhPT0gdW5kZWZpbmVkIHx8IHBzW2pdLnRvcF9sZXZlbCkge1xuXHRcdFx0XHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBwc1tqXS5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0ZGVsZXRlcy5wdXNoKHBzW2pdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRyZW47XG5cdFx0XHRsZXQgY2hpbGRyZW5fbmFtZXMgPSAkLm1hcChjaGlsZHJlbiwgZnVuY3Rpb24ocCwgX2kpe3JldHVybiBwLm5hbWU7fSk7XG5cdFx0XHRmb3Ioaj0wOyBqPGNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGxldCBjaGlsZCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgY2hpbGRyZW5bal0ubmFtZSk7XG5cdFx0XHRcdGlmKGNoaWxkKXtcblx0XHRcdFx0XHRjaGlsZC5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdFx0XHRcdGxldCBwdHJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIGNoaWxkKTtcblx0XHRcdFx0XHRsZXQgcHRyO1xuXHRcdFx0XHRcdGlmKHB0cnMubGVuZ3RoID4gMClcblx0XHRcdFx0XHRcdHB0ciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgcHRyc1swXSk7XG5cdFx0XHRcdFx0aWYocHRyICYmIHB0ci5tb3RoZXIgIT09IGNoaWxkLm1vdGhlcikge1xuXHRcdFx0XHRcdFx0Y2hpbGQubW90aGVyID0gcHRyLm1vdGhlcjtcblx0XHRcdFx0XHRcdGNoaWxkLmZhdGhlciA9IHB0ci5mYXRoZXI7XG5cdFx0XHRcdFx0fSBlbHNlIGlmKHB0cikge1xuXHRcdFx0XHRcdFx0bGV0IGNoaWxkX25vZGUgID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbm9kZXMsIGNoaWxkLm5hbWUpO1xuXHRcdFx0XHRcdFx0bGV0IGFkaiA9IGFkamFjZW50X25vZGVzKHJvb3QsIGNoaWxkX25vZGUsIGNoaWxkcmVuX25hbWVzKTtcblx0XHRcdFx0XHRcdGNoaWxkLm1vdGhlciA9IGFkalswXSA/IGFkalswXS5kYXRhLm1vdGhlciA6IChhZGpbMV0gPyBhZGpbMV0uZGF0YS5tb3RoZXIgOiBudWxsKTtcblx0XHRcdFx0XHRcdGNoaWxkLmZhdGhlciA9IGFkalswXSA/IGFkalswXS5kYXRhLmZhdGhlciA6IChhZGpbMV0gPyBhZGpbMV0uZGF0YS5mYXRoZXIgOiBudWxsKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGNoaWxkLm5hbWUpLCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5vZGUubmFtZSksIDEpO1xuXHR9XG5cblx0Ly8gZGVsZXRlIGFuY2VzdG9yc1xuXHRjb25zb2xlLmxvZyhkZWxldGVzKTtcblx0Zm9yKGk9MDsgaTxkZWxldGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGRlbCA9IGRlbGV0ZXNbaV07XG5cdFx0bGV0IHNpYnMgPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxTaWJsaW5ncyhkYXRhc2V0LCBkZWwpO1xuXHRcdGNvbnNvbGUubG9nKCdERUwnLCBkZWwubmFtZSwgc2licyk7XG5cdFx0aWYoc2licy5sZW5ndGggPCAxKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnZGVsIHNpYnMnLCBkZWwubmFtZSwgc2licyk7XG5cdFx0XHRsZXQgZGF0YV9ub2RlICA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZm5vZGVzLCBkZWwubmFtZSk7XG5cdFx0XHRsZXQgYW5jZXN0b3JzID0gZGF0YV9ub2RlLmFuY2VzdG9ycygpO1xuXHRcdFx0Zm9yKGo9MDsgajxhbmNlc3RvcnMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYW5jZXN0b3JzW2ldKTtcblx0XHRcdFx0aWYoYW5jZXN0b3JzW2pdLmRhdGEubW90aGVyKXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnREVMRVRFICcsIGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlciwgYW5jZXN0b3JzW2pdLmRhdGEuZmF0aGVyKTtcblx0XHRcdFx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgYW5jZXN0b3JzW2pdLmRhdGEubW90aGVyLm5hbWUpLCAxKTtcblx0XHRcdFx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgYW5jZXN0b3JzW2pdLmRhdGEuZmF0aGVyLm5hbWUpLCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHQvLyBjaGVjayBpbnRlZ3JpdHkgb2YgbXp0d2lucyBzZXR0aW5nc1xuXHRjaGVja1R3aW5zKGRhdGFzZXQpO1xuXG5cdGxldCB1Yztcblx0dHJ5XHR7XG5cdFx0Ly8gdmFsaWRhdGUgbmV3IHBlZGlncmVlIGRhdGFzZXRcblx0XHRsZXQgbmV3b3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRzKTtcblx0XHRuZXdvcHRzLmRhdGFzZXQgPSBwZWRpZ3JlZV91dGlscy5jb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdFx0dmFsaWRhdGVfcGVkaWdyZWUobmV3b3B0cyk7XG5cdFx0Ly8gY2hlY2sgaWYgcGVkaWdyZWUgaXMgc3BsaXRcblx0XHR1YyA9IHBlZGlncmVlX3V0aWxzLnVuY29ubmVjdGVkKGRhdGFzZXQpO1xuXHR9IGNhdGNoKGVycikge1xuXHRcdHBlZGlncmVlX3V0aWxzLm1lc3NhZ2VzKCdXYXJuaW5nJywgJ0RlbGV0aW9uIG9mIHRoaXMgcGVkaWdyZWUgbWVtYmVyIGlzIGRpc2FsbG93ZWQuJylcblx0XHR0aHJvdyBlcnI7XG5cdH1cblx0aWYodWMubGVuZ3RoID4gMCkge1xuXHRcdC8vIGNoZWNrICYgd2FybiBvbmx5IGlmIHRoaXMgaXMgYSBuZXcgc3BsaXRcblx0XHRpZihwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChvcHRzLmRhdGFzZXQpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcImluZGl2aWR1YWxzIHVuY29ubmVjdGVkIHRvIHBlZGlncmVlIFwiLCB1Yyk7XG5cdFx0XHRwZWRpZ3JlZV91dGlscy5tZXNzYWdlcyhcIldhcm5pbmdcIiwgXCJEZWxldGluZyB0aGlzIHdpbGwgc3BsaXQgdGhlIHBlZGlncmVlLiBDb250aW51ZT9cIiwgb25Eb25lLCBvcHRzLCBkYXRhc2V0KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cblxuXHRpZihvbkRvbmUpIHtcblx0XHRvbkRvbmUob3B0cywgZGF0YXNldCk7XG5cdH1cblx0cmV0dXJuIGRhdGFzZXQ7XG59XG4iXSwibmFtZXMiOlsibWF4X2xpbWl0IiwiZGljdF9jYWNoZSIsImhhc19icm93c2VyX3N0b3JhZ2UiLCJvcHRzIiwic3RvcmVfdHlwZSIsInVuZGVmaW5lZCIsIm1vZCIsImxvY2FsU3RvcmFnZSIsInNldEl0ZW0iLCJyZW1vdmVJdGVtIiwiZSIsImdldF9wcmVmaXgiLCJidG5fdGFyZ2V0IiwiZ2V0X2FyciIsImdldF9icm93c2VyX3N0b3JlIiwiaXRlbSIsImdldEl0ZW0iLCJzZXNzaW9uU3RvcmFnZSIsInNldF9icm93c2VyX3N0b3JlIiwibmFtZSIsImNsZWFyX2Jyb3dzZXJfc3RvcmUiLCJjbGVhciIsImNsZWFyX3BlZGlncmVlX2RhdGEiLCJwcmVmaXgiLCJzdG9yZSIsIml0ZW1zIiwiaSIsImxlbmd0aCIsImtleSIsImluZGV4T2YiLCJwdXNoIiwiZ2V0X2NvdW50IiwiY291bnQiLCJzZXRfY291bnQiLCJpbml0X2NhY2hlIiwiZGF0YXNldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJjb25zb2xlIiwid2FybiIsIm5zdG9yZSIsImN1cnJlbnQiLCJwYXJzZSIsImxhc3QiLCJpdCIsImFyciIsInByZXZpb3VzIiwibmV4dCIsInBhcnNlSW50Iiwic2V0cG9zaXRpb24iLCJ4IiwieSIsInpvb20iLCJnZXRwb3NpdGlvbiIsInBvcyIsInBhcnNlRmxvYXQiLCJpc0lFIiwidWEiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJpc0VkZ2UiLCJtYXRjaCIsImNvcHlfZGF0YXNldCIsImlkIiwic29ydCIsImEiLCJiIiwiZGlzYWxsb3dlZCIsIm5ld2RhdGFzZXQiLCJvYmoiLCJnZXRGb3JtYXR0ZWREYXRlIiwidGltZSIsImQiLCJEYXRlIiwiZ2V0SG91cnMiLCJzbGljZSIsImdldE1pbnV0ZXMiLCJnZXRTZWNvbmRzIiwiZ2V0RnVsbFllYXIiLCJnZXRNb250aCIsImdldERhdGUiLCJtZXNzYWdlcyIsInRpdGxlIiwibXNnIiwib25Db25maXJtIiwiJCIsImRpYWxvZyIsIm1vZGFsIiwid2lkdGgiLCJidXR0b25zIiwidGV4dCIsImNsaWNrIiwidmFsaWRhdGVfYWdlX3lvYiIsImFnZSIsInlvYiIsInN0YXR1cyIsInllYXIiLCJzdW0iLCJNYXRoIiwiYWJzIiwiY2FwaXRhbGlzZUZpcnN0TGV0dGVyIiwic3RyaW5nIiwiY2hhckF0IiwidG9VcHBlckNhc2UiLCJtYWtlaWQiLCJsZW4iLCJwb3NzaWJsZSIsImZsb29yIiwicmFuZG9tIiwiYnVpbGRUcmVlIiwicGVyc29uIiwicm9vdCIsInBhcnRuZXJMaW5rcyIsImNoaWxkcmVuIiwiZ2V0Q2hpbGRyZW4iLCJub2RlcyIsImZsYXR0ZW4iLCJwYXJ0bmVycyIsImVhY2giLCJjaGlsZCIsImoiLCJwIiwibW90aGVyIiwiZmF0aGVyIiwibSIsImdldE5vZGVCeU5hbWUiLCJmIiwiY29udGFpbnNfcGFyZW50IiwibWVyZ2UiLCJwdHIiLCJwYXJlbnQiLCJoaWRkZW4iLCJtaWR4IiwiZ2V0SWR4QnlOYW1lIiwiZmlkeCIsInNldENoaWxkcmVuSWQiLCJncCIsImdldF9ncmFuZHBhcmVudHNfaWR4IiwidXBkYXRlUGFyZW50IiwicGFyZW50X25vZGUiLCJtenR3aW4iLCJkenR3aW5zIiwidHdpbnMiLCJnZXRUd2lucyIsInR3aW4iLCJkenR3aW4iLCJpc1Byb2JhbmQiLCJhdHRyIiwic2V0UHJvYmFuZCIsImlzX3Byb2JhbmQiLCJwcm9iYW5kIiwiY29tYmluZUFycmF5cyIsImFycjEiLCJhcnIyIiwiaW5BcnJheSIsImluY2x1ZGVfY2hpbGRyZW4iLCJjb25uZWN0ZWQiLCJnZXRfcGFydG5lcnMiLCJnZXRBbGxDaGlsZHJlbiIsImNoaWxkX2lkeCIsImFub2RlIiwicHRycyIsImJub2RlIiwidW5jb25uZWN0ZWQiLCJ0YXJnZXQiLCJnZXRQcm9iYW5kSW5kZXgiLCJjaGFuZ2UiLCJpaSIsIm5jb25uZWN0IiwiaWR4IiwiaGFzX3BhcmVudCIsIm5vcGFyZW50cyIsIm5hbWVzIiwibWFwIiwidmFsIiwiX2kiLCJzZXgiLCJnZXRTaWJsaW5ncyIsImdldEFsbFNpYmxpbmdzIiwic2licyIsInR3aW5fdHlwZSIsImdldEFkb3B0ZWRTaWJsaW5ncyIsImdldERlcHRoIiwiZGVwdGgiLCJ0b3BfbGV2ZWwiLCJnZXROb2Rlc0F0RGVwdGgiLCJmbm9kZXMiLCJleGNsdWRlX25hbWVzIiwiZGF0YSIsImxpbmtOb2RlcyIsImZsYXR0ZW5Ob2RlcyIsImxpbmtzIiwiYW5jZXN0b3JzIiwibm9kZSIsInJlY3Vyc2UiLCJjb25zYW5ndWl0eSIsIm5vZGUxIiwibm9kZTIiLCJhbmNlc3RvcnMxIiwiYW5jZXN0b3JzMiIsIm5hbWVzMSIsImFuY2VzdG9yIiwibmFtZXMyIiwiaW5kZXgiLCJmbGF0IiwiZm9yRWFjaCIsImFkanVzdF9jb29yZHMiLCJ4bWlkIiwib3ZlcmxhcCIsImRlc2NlbmRhbnRzIiwiZGlmZiIsImNoaWxkMSIsImNoaWxkMiIsIm5vZGVzT3ZlcmxhcCIsIkRFQlVHIiwibG9nIiwiZGVzY2VuZGFudHNOYW1lcyIsImRlc2NlbmRhbnQiLCJ4bmV3IiwibiIsInN5bWJvbF9zaXplIiwidXJsUGFyYW0iLCJyZXN1bHRzIiwiUmVnRXhwIiwiZXhlYyIsIndpbmRvdyIsImxvY2F0aW9uIiwiaHJlZiIsImdtaWR4IiwiZ2ZpZHgiLCJwcm9iYW5kX2F0dHIiLCJrZXlzIiwidmFsdWUiLCJub2RlX2F0dHIiLCJwZWRjYWNoZSIsImlzQXJyYXkiLCJrIiwiZm91bmQiLCJzeW5jVHdpbnMiLCJyZWJ1aWxkIiwicHJvYmFuZF9hZGRfY2hpbGQiLCJicmVhc3RmZWVkaW5nIiwibmV3Y2hpbGQiLCJhZGRjaGlsZCIsImRlbGV0ZV9ub2RlX2J5X25hbWUiLCJvbkRvbmUiLCJkZWxldGVfbm9kZV9kYXRhc2V0IiwiZXhpc3RzIiwicHJpbnRfb3B0cyIsInJlbW92ZSIsImFwcGVuZCIsImFkZCIsIm9wdGlvbnMiLCJleHRlbmQiLCJidG5zIiwibGlzIiwiZmEiLCJpc19mdWxsc2NyZWVuIiwiZG9jdW1lbnQiLCJmdWxsc2NyZWVuRWxlbWVudCIsIm1vekZ1bGxTY3JlZW5FbGVtZW50Iiwid2Via2l0RnVsbHNjcmVlbkVsZW1lbnQiLCJvbiIsIl9lIiwibG9jYWxfZGF0YXNldCIsIm1vekZ1bGxTY3JlZW4iLCJ3ZWJraXRGdWxsU2NyZWVuIiwidGFyZ2V0RGl2IiwibW96UmVxdWVzdEZ1bGxTY3JlZW4iLCJ3ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbiIsIkVsZW1lbnQiLCJBTExPV19LRVlCT0FSRF9JTlBVVCIsIm1vekNhbmNlbEZ1bGxTY3JlZW4iLCJ3ZWJraXRDYW5jZWxGdWxsU2NyZWVuIiwic3RvcFByb3BhZ2F0aW9uIiwiaGFzQ2xhc3MiLCJlbXB0eSIsImJ1aWxkIiwicmVzaXphYmxlIiwiaGVpZ2h0IiwiQ29udGludWUiLCJyZXNldCIsImtlZXBfcHJvYmFuZF9vbl9yZXNldCIsIkNhbmNlbCIsInRyaWdnZXIiLCJrZWVwX3Byb2JhbmQiLCJzZWxlY3RlZCIsInVwZGF0ZUJ1dHRvbnMiLCJhZGRDbGFzcyIsInJlbW92ZUNsYXNzIiwiY2FuY2VycyIsImdlbmV0aWNfdGVzdCIsInBhdGhvbG9neV90ZXN0cyIsImdldF9wcnNfdmFsdWVzIiwicHJzIiwiaGFzSW5wdXQiLCJpc0VtcHR5IiwidHJpbSIsIm15T2JqIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZ2V0X3N1cmdpY2FsX29wcyIsIm1ldGEiLCJsb2FkIiwic2F2ZSIsImJyZWFzdF9jYW5jZXJfcHJzIiwiYWxwaGEiLCJ6c2NvcmUiLCJvdmFyaWFuX2NhbmNlcl9wcnMiLCJlcnIiLCJzYXZlX2NhbnJpc2siLCJwcmludCIsImdldF9wcmludGFibGVfc3ZnIiwic3ZnX2Rvd25sb2FkIiwiZGVmZXJyZWQiLCJzdmcyaW1nIiwid2hlbiIsImFwcGx5IiwiZG9uZSIsImdldEJ5TmFtZSIsImFyZ3VtZW50cyIsInBlZGlncmVlX3V0aWwiLCJodG1sIiwiaW1nIiwibmV3VGFiIiwib3BlbiIsIndyaXRlIiwiY3JlYXRlRWxlbWVudCIsImRvd25sb2FkIiwiYm9keSIsImFwcGVuZENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJncmVwIiwibyIsInN2ZyIsImRlZmVycmVkX25hbWUiLCJkZWZhdWx0cyIsImlzY2FudmciLCJyZXNvbHV0aW9uIiwiaW1nX3R5cGUiLCJmaW5kIiwiZDNvYmoiLCJkMyIsInNlbGVjdCIsImdldCIsImxvd2VyIiwiRGVmZXJyZWQiLCJzdmdTdHIiLCJYTUxTZXJpYWxpemVyIiwic2VyaWFsaXplVG9TdHJpbmciLCJ4bWwiLCJpbWdzcmMiLCJidG9hIiwidW5lc2NhcGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjYW52YXMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm9ubG9hZCIsInJlcGxhY2UiLCJ2IiwiY2FudmciLCJDYW52ZyIsImZyb21TdHJpbmciLCJzY2FsZVdpZHRoIiwic2NhbGVIZWlnaHQiLCJpZ25vcmVEaW1lbnNpb25zIiwic3RhcnQiLCJkcmF3SW1hZ2UiLCJyZXNvbHZlIiwidG9EYXRhVVJMIiwic3JjIiwicHJvbWlzZSIsImdldE1hdGNoZXMiLCJzdHIiLCJteVJlZ2V4cCIsIm1hdGNoZXMiLCJjIiwibGFzdEluZGV4IiwiZXJyb3IiLCJ1bmlxdWVfdXJscyIsInN2Z19odG1sIiwicXVvdGUiLCJtMSIsIm0yIiwibmV3dmFsIiwiY29weV9zdmciLCJzdmdfbm9kZSIsInNlbGVjdEFsbCIsImZpbHRlciIsInRyZWVfZGltZW5zaW9ucyIsImdldF90cmVlX2RpbWVuc2lvbnMiLCJzdmdfZGl2IiwiY2xvbmUiLCJhcHBlbmRUbyIsIndpZCIsImhndCIsInNjYWxlIiwieHNjYWxlIiwieXNjYWxlIiwieXRyYW5zZm9ybSIsImVsIiwiY29uc3RydWN0b3IiLCJBcnJheSIsImNzc0ZpbGVzIiwicHJpbnRXaW5kb3ciLCJoZWFkQ29udGVudCIsImNzcyIsImNsb3NlIiwiZm9jdXMiLCJzZXRUaW1lb3V0Iiwic2F2ZV9maWxlIiwiY29udGVudCIsImZpbGVuYW1lIiwidHlwZSIsImZpbGUiLCJCbG9iIiwibXNTYXZlT3JPcGVuQmxvYiIsInVybCIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsInJldm9rZU9iamVjdFVSTCIsInJ1bl9wcmVkaWN0aW9uIiwiZ2V0X25vbl9hbm9uX3BlZGlncmVlIiwiY2Fucmlza192YWxpZGF0aW9uIiwiZGlzcGxheV9uYW1lIiwiZmlsZXMiLCJyaXNrX2ZhY3RvcnMiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwicmVzdWx0Iiwic3RhcnRzV2l0aCIsInJlYWRCb2FkaWNlYVY0IiwiY2Fucmlza19kYXRhIiwicmVhZENhblJpc2tWMSIsInJlYWRMaW5rYWdlIiwidmFsaWRhdGVfcGVkaWdyZWUiLCJlcnIxIiwibWVzc2FnZSIsImFjY19GYW1IaXN0X3RpY2tlZCIsImFjY19GYW1IaXN0X0xlYXZlIiwiUkVTVUxUIiwiRkxBR19GQU1JTFlfTU9EQUwiLCJlcnIzIiwiZXJyMiIsIm9uZXJyb3IiLCJldmVudCIsImNvZGUiLCJyZWFkQXNUZXh0IiwiYm9hZGljZWFfbGluZXMiLCJsaW5lcyIsInNwbGl0IiwicGVkIiwiZmFtaWQiLCJpbmRpIiwiYWZmZWN0ZWQiLCJhbGxlbGVzIiwidW5zaGlmdCIsInByb2Nlc3NfcGVkIiwiaGRyIiwibG4iLCJvcHMiLCJvcGRhdGEiLCJkZWxpbSIsImNhbmNlciIsImRpYWdub3Npc19hZ2UiLCJhc2hrZW5hemkiLCJnZW5lX3Rlc3QiLCJwYXRoX3Rlc3QiLCJ2ZXJzaW9uIiwiZ2V0TGV2ZWwiLCJtYXhfbGV2ZWwiLCJsZXZlbCIsInBpZHgiLCJnZXRQYXJ0bmVySWR4IiwidXBkYXRlX3BhcmVudHNfbGV2ZWwiLCJwYXJlbnRzIiwibWEiLCJwYSIsImlzIiwicGVkY2FjaGVfY3VycmVudCIsInJlc2V0X25fc3luYyIsInByb3AiLCJleGNsdWRlIiwidXBkYXRlIiwicGVkaWdyZWVfZm9ybSIsImJjX211dGF0aW9uX2ZyZXF1ZW5jaWVzIiwiYmNtZnJlcSIsImdlbmUiLCJ0b0xvd2VyQ2FzZSIsIm9iY21mcmVxIiwib2NfbXV0YXRpb25fZnJlcXVlbmNpZXMiLCJzYXZlX2FzaGtuIiwidXBkYXRlX2FzaGtuIiwic3dpdGNoZXMiLCJpc3dpdGNoIiwicyIsInVwZGF0ZV9jYW5jZXJfYnlfc2V4IiwiYXBwcm94X2RpYWdub3Npc19hZ2UiLCJzdWJzdHJpbmciLCJyb3VuZDUiLCJjaGVja2VkIiwidHJlcyIsInZhbGlkIiwic2hvdyIsIm92YXJpYW5fY2FuY2VyX2RpYWdub3Npc19hZ2UiLCJjbG9zZXN0IiwiaGlkZSIsInByb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlIiwieDEiLCJ4MiIsInJvdW5kIiwiZHJhZ2dpbmciLCJsYXN0X21vdXNlb3ZlciIsImFkZFdpZGdldHMiLCJmb250X3NpemUiLCJwb3B1cF9zZWxlY3Rpb24iLCJzdHlsZSIsInNxdWFyZSIsInNxdWFyZV90aXRsZSIsImNpcmNsZSIsImNpcmNsZV90aXRsZSIsInVuc3BlY2lmaWVkIiwiYWRkX3BlcnNvbiIsImNsYXNzZWQiLCJkYXR1bSIsImFkZHNpYmxpbmciLCJoaWdobGlnaHQiLCJkcmFnX2hhbmRsZSIsIl9kIiwiZngiLCJvZmYiLCJmeSIsIndpZGdldHMiLCJlZGl0Iiwic2V0dGluZ3MiLCJ3aWRnZXQiLCJzdHlsZXMiLCJwYXJlbnROb2RlIiwib3B0Iiwib3BlbkVkaXREaWFsb2ciLCJhZGRwYXJlbnRzIiwiYWRkcGFydG5lciIsImN0cmxLZXkiLCJzcGxpY2UiLCJub2RlY2xpY2siLCJzZXRMaW5lRHJhZ1Bvc2l0aW9uIiwieGNvb3JkIiwicG9pbnRlciIsInljb29yZCIsImxpbmVfZHJhZ19zZWxlY3Rpb24iLCJkbGluZSIsImRyYWciLCJkcmFnc3RhcnQiLCJkcmFnc3RvcCIsInNvdXJjZUV2ZW50IiwiZHgiLCJkeSIsInluZXciLCJ5MSIsInkyIiwidHJhbnNsYXRlIiwiYXV0b09wZW4iLCJ0YWJsZSIsImRpc2Vhc2VzIiwiZGlzZWFzZV9jb2xvdXIiLCJjb2xvdXIiLCJrayIsInJvb3RzIiwiem9vbUluIiwiem9vbU91dCIsImxhYmVscyIsImZvbnRfZmFtaWx5IiwiZm9udF93ZWlnaHQiLCJiYWNrZ3JvdW5kIiwibm9kZV9iYWNrZ3JvdW5kIiwidmFsaWRhdGUiLCJwYnV0dG9ucyIsImlvIiwiZ3JvdXBfdG9wX2xldmVsIiwicGVkaWdyZWVfdXRpbHMiLCJzdmdfZGltZW5zaW9ucyIsImdldF9zdmdfZGltZW5zaW9ucyIsInh5dHJhbnNmb3JtIiwieHRyYW5zZm9ybSIsImhpZGRlbl9yb290IiwiaGllcmFyY2h5IiwidHJlZW1hcCIsInRyZWUiLCJzZXBhcmF0aW9uIiwic2l6ZSIsInZpc19ub2RlcyIsImNyZWF0ZV9lcnIiLCJwdHJMaW5rTm9kZXMiLCJjaGVja19wdHJfbGlua3MiLCJlbnRlciIsIm1pc2NhcnJpYWdlIiwidGVybWluYXRpb24iLCJzeW1ib2wiLCJzeW1ib2xUcmlhbmdsZSIsInN5bWJvbENpcmNsZSIsInN5bWJvbFNxdWFyZSIsInBpZW5vZGUiLCJuY2FuY2VycyIsInByZWZpeEluT2JqIiwicGllIiwiYXJjIiwiaW5uZXJSYWRpdXMiLCJvdXRlclJhZGl1cyIsImFkb3B0ZWRfaW4iLCJhZG9wdGVkX291dCIsImluZGVudCIsImdldF9icmFja2V0IiwiYWRkTGFiZWwiLCJnZXRQeCIsImlsYWIiLCJsYWJlbCIsInlfb2Zmc2V0IiwidmFycyIsIml2YXIiLCJkaXNlYXNlIiwiZGlzIiwiY2xhc2hfZGVwdGgiLCJkcmF3X3BhdGgiLCJjbGFzaCIsImR5MSIsImR5MiIsImNzaGlmdCIsImwiLCJwYXRoIiwiZHgxIiwiZHgyIiwiaW5zZXJ0IiwiZGl2b3JjZWQiLCJjaGVja19wdHJfbGlua19jbGFzaGVzIiwicGFyZW50X25vZGVzIiwicGFyZW50X25vZGVfbmFtZSIsImRpdm9yY2VfcGF0aCIsInBhdGgyIiwic291cmNlIiwiZGFzaF9sZW4iLCJkYXNoX2FycmF5IiwidXNlZGxlbiIsInR3aW54IiwieG1pbiIsInQiLCJ0aGlzeCIsInltaWQiLCJ4aGJhciIsInh4IiwieXkiLCJwcm9iYW5kSWR4IiwicHJvYmFuZE5vZGUiLCJ0cmlpZCIsInNjYWxlRXh0ZW50Iiwiem9vbUZuIiwidHJhbnNmb3JtIiwidG9TdHJpbmciLCJFcnJvciIsInVuaXF1ZW5hbWVzIiwiZmFtaWRzIiwiam9pbiIsInVjIiwiX24iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJtYXhzY29yZSIsImdlbmVyYXRpb24iLCJzY29yZSIsIm1heF9kZXB0aCIsInRyZWVfd2lkdGgiLCJ0cmVlX2hlaWdodCIsInRvcF9sZXZlbF9zZWVuIiwiZW1WYWwiLCJnZXRDb21wdXRlZFN0eWxlIiwiZm9udFNpemUiLCJmdGV4dCIsImNsYXNzX2xhYmVsIiwidGVtcGxhdGVzIiwibmNoaWxkIiwicHRyX25hbWUiLCJwYXJ0bmVyIiwidHdpbl9pZCIsImdldFVuaXF1ZVR3aW5JRCIsIm5ld2NoaWxkcmVuIiwiYWRkX2xocyIsIm5ld2JpZSIsInNldE16VHdpbiIsImQxIiwiZDIiLCJteiIsImNoZWNrVHdpbnMiLCJ0d2luX3R5cGVzIiwiZmxhdF90cmVlIiwidHJlZV9ub2RlIiwicGlkIiwibm9kZV9tb3RoZXIiLCJub2RlX2ZhdGhlciIsIm5vZGVfc2licyIsInJpZCIsImxpZCIsInNpZCIsImZhaWR4IiwibW9pZHgiLCJ0bXBmYSIsIm9ycGhhbnMiLCJuaWQiLCJvaWQiLCJvaWR4IiwicHRyX25vZGUiLCJhZGphY2VudF9ub2RlcyIsImV4Y2x1ZGVzIiwiZG5vZGVzIiwibGhzX25vZGUiLCJyaHNfbm9kZSIsImRlbGV0ZXMiLCJkM25vZGUiLCJwcyIsImNoaWxkcmVuX25hbWVzIiwiY2hpbGRfbm9kZSIs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
