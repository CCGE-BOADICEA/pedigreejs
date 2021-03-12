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

  var RISK_FACTOR_STORE = new Object();
  function show_risk_factor_store() {
    console.log("RISK_FACTOR_STORE::");
    $.each(RISK_FACTOR_STORE, function (name, val) {
      console.log(name + " : " + val);
    });
  } // return a non-anonimised pedigree format

  function get_non_anon_pedigree(dataset, meta) {
    return get_pedigree(dataset, undefined, meta, false);
  }
  /**
   * Get CanRisk formated pedigree.
   */

  function get_pedigree(dataset, famid, meta, isanon) {
    var msg = "##CanRisk 1.0";

    if (!famid) {
      famid = "XXXX";
    }

    if (meta) {
      msg += meta;
    }

    if (typeof isanon === 'undefined') {
      isanon = true;
    } // array of individuals excluded from the calculation


    var excl = $.map(dataset, function (p, _i) {
      return 'exclude' in p && p.exclude ? p.name : null;
    }); // female risk factors

    var probandIdx = getProbandIndex(dataset);
    var sex = 'F';

    if (probandIdx) {
      sex = dataset[probandIdx].sex;
    }

    if (sex !== 'M') {
      var menarche = get_risk_factor('menarche_age');
      var parity = get_risk_factor('parity');
      var first_birth = get_risk_factor('age_of_first_live_birth');
      var oc_use = get_risk_factor('oral_contraception');
      var mht_use = get_risk_factor('mht');
      var bmi = get_risk_factor('bmi');
      var alcohol = get_risk_factor('alcohol_intake');
      var menopause = get_risk_factor('age_of_menopause');
      var mdensity = get_risk_factor('mammographic_density');
      var hgt = get_risk_factor('height');
      var tl = get_risk_factor('Age_Tubal_ligation');
      var endo = get_risk_factor('endometriosis');
      if (menarche !== undefined) msg += "\n##menarche=" + menarche;
      if (parity !== undefined) msg += "\n##parity=" + parity;
      if (first_birth !== undefined) msg += "\n##first_live_birth=" + first_birth;
      if (oc_use !== undefined) msg += "\n##oc_use=" + oc_use;
      if (mht_use !== undefined) msg += "\n##mht_use=" + mht_use;
      if (bmi !== undefined) msg += "\n##BMI=" + bmi;
      if (alcohol !== undefined) msg += "\n##alcohol=" + alcohol;
      if (menopause !== undefined) msg += "\n##menopause=" + menopause;
      if (mdensity !== undefined) msg += "\n##birads=" + mdensity;
      if (hgt !== undefined) msg += "\n##height=" + hgt;
      if (tl !== undefined) if (tl !== "n" && tl !== "N") msg += "\n##TL=Y";else msg += "\n##TL=N";
      if (endo !== undefined) msg += "\n##endo=" + endo;
    }

    msg += "\n##FamID\tName\tTarget\tIndivID\tFathID\tMothID\tSex\tMZtwin\tDead\tAge\tYob\tBC1\tBC2\tOC\tPRO\tPAN\tAshkn\tBRCA1\tBRCA2\tPALB2\tATM\tCHEK2\tRAD51D\tRAD51C\tBRIP1\tER:PR:HER2:CK14:CK56";

    var _loop = function _loop(i) {
      var p = dataset[i];

      if ($.inArray(p.name, excl) != -1) {
        console.log('EXCLUDE: ' + p.name);
        return "continue";
      }

      msg += '\n' + famid + '\t'; // max 13 chars

      if (isanon) msg += i + '\t'; // display_name (ANONIMISE) max 8 chars
      else msg += (p.display_name ? p.display_name : "NA") + '\t';
      msg += ('proband' in p ? '1' : 0) + '\t';
      msg += p.name + '\t'; // max 7 chars

      msg += ('father' in p && !('noparents' in p) && $.inArray(p.mother, excl) == -1 ? p.father : 0) + '\t'; // max 7 chars

      msg += ('mother' in p && !('noparents' in p) && $.inArray(p.mother, excl) == -1 ? p.mother : 0) + '\t'; // max 7 chars

      msg += p.sex + '\t';
      msg += ('mztwin' in p ? p.mztwin : 0) + '\t'; // MZtwin

      msg += ('status' in p ? p.status : 0) + '\t'; // current status: 0 = alive, 1 = dead

      msg += ('age' in p ? p.age : 0) + '\t'; // Age at last follow up or 0 = unspecified

      msg += ('yob' in p ? p.yob : 0) + '\t'; // YOB or 0 = unspecified

      $.each(cancers, function (cancer, diagnosis_age) {
        // Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
        if (diagnosis_age in p) msg += (diagnosis_age in p ? p[diagnosis_age] : 'AU') + '\t';else msg += '0\t';
      }); // Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi

      msg += ('ashkenazi' in p ? p.ashkenazi : 0) + '\t';

      for (var j = 0; j < genetic_test.length; j++) {
        if (genetic_test[j] + '_gene_test' in p && p[genetic_test[j] + '_gene_test']['type'] !== '-' && p[genetic_test[j] + '_gene_test']['result'] !== '-') {
          msg += p[genetic_test[j] + '_gene_test']['type'] + ':';
          msg += p[genetic_test[j] + '_gene_test']['result'] + '\t';
        } else {
          msg += '0:0\t'; // genetic test type, 0=untested, S=mutation search, T=direct gene test
          // genetic test result, 0=untested, P=positive, N=negative
        }
      }

      for (var _j = 0; _j < pathology_tests.length; _j++) {
        // status, 0 = unspecified, N = negative, P = positive
        if (pathology_tests[_j] + '_bc_pathology' in p) {
          msg += p[pathology_tests[_j] + '_bc_pathology'];
          console.log('pathology ' + p[pathology_tests[_j] + '_bc_pathology'] + ' for ' + p.display_name);
        } else {
          msg += '0';
        }

        if (_j < pathology_tests.length - 1) msg += ":";
      }
    };

    for (var i = 0; i < dataset.length; i++) {
      var _ret = _loop(i);

      if (_ret === "continue") continue;
    }

    console.log(msg, RISK_FACTOR_STORE);
    return msg;
  }
  function save_risk_factor(risk_factor_name, val) {
    RISK_FACTOR_STORE[store_name(risk_factor_name)] = val;
  }
  function get_risk_factor(risk_factor_name) {
    var key = store_name(risk_factor_name);

    if (key in RISK_FACTOR_STORE) {
      return RISK_FACTOR_STORE[key];
    }

    return undefined;
  } // remove risk factor from storage

  function remove_risk_factor(risk_factor_name) {
    delete RISK_FACTOR_STORE[store_name(risk_factor_name)];
  } // prefix risk factor name with the app/page name

  function store_name(risk_factor_name) {
    return window.location.pathname.split('/').filter(function (el) {
      return !!el;
    }).pop() + '::' + risk_factor_name;
  }

  var canrisk_file = /*#__PURE__*/Object.freeze({
    __proto__: null,
    show_risk_factor_store: show_risk_factor_store,
    get_non_anon_pedigree: get_non_anon_pedigree,
    get_pedigree: get_pedigree,
    save_risk_factor: save_risk_factor,
    get_risk_factor: get_risk_factor,
    remove_risk_factor: remove_risk_factor,
    store_name: store_name
  });

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
    save_file(opts, get_non_anon_pedigree(current(opts), meta), "canrisk.txt");
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
    $('#node_properties').dialog('open');
    $('#node_properties input[type=radio], #node_properties input[type=checkbox], #node_properties input[type=text], #node_properties input[type=number]').change(function () {
      save(opts);
    });
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

  exports.canrisk_file = canrisk_file;
  exports.io = io;
  exports.pedcache = pedcache;
  exports.pedigree_utils = pedigree_utils;
  exports.pedigreejs = pedigree;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVkaWdyZWVqcy5qcyIsInNvdXJjZXMiOlsiLi4vZXMvcGVkY2FjaGUuanMiLCIuLi9lcy9wZWRpZ3JlZV91dGlscy5qcyIsIi4uL2VzL3BidXR0b25zLmpzIiwiLi4vZXMvY2Fucmlza19maWxlLmpzIiwiLi4vZXMvaW8uanMiLCIuLi9lcy9wZWRpZ3JlZV9mb3JtLmpzIiwiLi4vZXMvd2lkZ2V0cy5qcyIsIi4uL2VzL3BlZGlncmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vc3RvcmUgYSBoaXN0b3J5IG9mIHBlZGlncmVlXG5cbmxldCBtYXhfbGltaXQgPSAyNTtcbmxldCBkaWN0X2NhY2hlID0ge307XG5cbi8vIHRlc3QgaWYgYnJvd3NlciBzdG9yYWdlIGlzIHN1cHBvcnRlZFxuZnVuY3Rpb24gaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSB7XG5cdHRyeSB7XG5cdFx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnYXJyYXknKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0aWYob3B0cy5zdG9yZV90eXBlICE9PSAnbG9jYWwnICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gJ3Nlc3Npb24nICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0bGV0IG1vZCA9ICd0ZXN0Jztcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShtb2QsIG1vZCk7XG5cdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obW9kKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldF9wcmVmaXgob3B0cykge1xuXHRyZXR1cm4gXCJQRURJR1JFRV9cIitvcHRzLmJ0bl90YXJnZXQrXCJfXCI7XG59XG5cbi8vIHVzZSBkaWN0X2NhY2hlIHRvIHN0b3JlIGNhY2hlIGFzIGFuIGFycmF5XG5mdW5jdGlvbiBnZXRfYXJyKG9wdHMpIHtcblx0cmV0dXJuIGRpY3RfY2FjaGVbZ2V0X3ByZWZpeChvcHRzKV07XG59XG5cbmZ1bmN0aW9uIGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGl0ZW0pIHtcblx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnbG9jYWwnKVxuXHRcdHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKTtcblx0ZWxzZVxuXHRcdHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGl0ZW0pO1xufVxuXG5mdW5jdGlvbiBzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBuYW1lLCBpdGVtKSB7XG5cdGlmKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJylcblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLnNldEl0ZW0obmFtZSwgaXRlbSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBpdGVtKTtcbn1cblxuLy8gY2xlYXIgYWxsIHN0b3JhZ2UgaXRlbXNcbmZ1bmN0aW9uIGNsZWFyX2Jyb3dzZXJfc3RvcmUob3B0cykge1xuXHRpZihvcHRzLnN0b3JlX3R5cGUgPT09ICdsb2NhbCcpXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIHNlc3Npb25TdG9yYWdlLmNsZWFyKCk7XG59XG5cbi8vIHJlbW92ZSBhbGwgc3RvcmFnZSBpdGVtcyB3aXRoIGtleXMgdGhhdCBoYXZlIHRoZSBwZWRpZ3JlZSBoaXN0b3J5IHByZWZpeFxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyX3BlZGlncmVlX2RhdGEob3B0cykge1xuXHRsZXQgcHJlZml4ID0gZ2V0X3ByZWZpeChvcHRzKTtcblx0bGV0IHN0b3JlID0gKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJyA/IGxvY2FsU3RvcmFnZSA6IHNlc3Npb25TdG9yYWdlKTtcblx0bGV0IGl0ZW1zID0gW107XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBzdG9yZS5sZW5ndGg7IGkrKyl7XG5cdFx0aWYoc3RvcmUua2V5KGkpLmluZGV4T2YocHJlZml4KSA9PSAwKVxuXHRcdFx0aXRlbXMucHVzaChzdG9yZS5rZXkoaSkpO1xuXHR9XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKylcblx0XHRzdG9yZS5yZW1vdmVJdGVtKGl0ZW1zW2ldKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9jb3VudChvcHRzKSB7XG5cdGxldCBjb3VudDtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y291bnQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydDT1VOVCcpO1xuXHRlbHNlXG5cdFx0Y291bnQgPSBkaWN0X2NhY2hlW2dldF9wcmVmaXgob3B0cykrJ0NPVU5UJ107XG5cdGlmKGNvdW50ICE9PSBudWxsICYmIGNvdW50ICE9PSB1bmRlZmluZWQpXG5cdFx0cmV0dXJuIGNvdW50O1xuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gc2V0X2NvdW50KG9wdHMsIGNvdW50KSB7XG5cdGlmIChoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHNldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ0NPVU5UJywgY291bnQpO1xuXHRlbHNlXG5cdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpKydDT1VOVCddID0gY291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0X2NhY2hlKG9wdHMpIHtcblx0aWYoIW9wdHMuZGF0YXNldClcblx0XHRyZXR1cm47XG5cdGxldCBjb3VudCA9IGdldF9jb3VudChvcHRzKTtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpIHsgICAvLyBsb2NhbCBzdG9yYWdlXG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKStjb3VudCwgSlNPTi5zdHJpbmdpZnkob3B0cy5kYXRhc2V0KSk7XG5cdH0gZWxzZSB7ICAgLy8gVE9ETyA6OiBhcnJheSBjYWNoZVxuXHRcdGNvbnNvbGUud2FybignTG9jYWwgc3RvcmFnZSBub3QgZm91bmQvc3VwcG9ydGVkIGZvciB0aGlzIGJyb3dzZXIhJywgb3B0cy5zdG9yZV90eXBlKTtcblx0XHRtYXhfbGltaXQgPSA1MDA7XG5cdFx0aWYoZ2V0X2FycihvcHRzKSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpXSA9IFtdO1xuXHRcdGdldF9hcnIob3B0cykucHVzaChKU09OLnN0cmluZ2lmeShvcHRzLmRhdGFzZXQpKTtcblx0fVxuXHRpZihjb3VudCA8IG1heF9saW1pdClcblx0XHRjb3VudCsrO1xuXHRlbHNlXG5cdFx0Y291bnQgPSAwO1xuXHRzZXRfY291bnQob3B0cywgY291bnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbnN0b3JlKG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRpZihnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKSAhPT0gbnVsbClcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAoZ2V0X2FycihvcHRzKSAmJiBnZXRfYXJyKG9wdHMpLmxlbmd0aCA+IDAgPyBnZXRfYXJyKG9wdHMpLmxlbmd0aCA6IC0xKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50KG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBnZXRfY291bnQob3B0cyktMTtcblx0aWYoY3VycmVudCA9PSAtMSlcblx0XHRjdXJyZW50ID0gbWF4X2xpbWl0O1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrY3VycmVudCkpO1xuXHRlbHNlIGlmKGdldF9hcnIob3B0cykpXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtjdXJyZW50XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0KG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRsZXQgaXQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKTtcblx0XHRcdGlmKGl0ICE9PSBudWxsKSB7XG5cdFx0XHRcdHNldF9jb3VudChvcHRzLCBpKTtcblx0XHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoaXQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZXQgYXJyID0gZ2V0X2FycihvcHRzKTtcblx0XHRpZihhcnIpXG5cdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShhcnIoYXJyLmxlbmd0aC0xKSk7XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXZpb3VzKG9wdHMsIHByZXZpb3VzKSB7XG5cdGlmKHByZXZpb3VzID09PSB1bmRlZmluZWQpXG5cdFx0cHJldmlvdXMgPSBnZXRfY291bnQob3B0cykgLSAyO1xuXG5cdGlmKHByZXZpb3VzIDwgMCkge1xuXHRcdGxldCBuc3RvcmUgPSBuc3RvcmUob3B0cyk7XG5cdFx0aWYobnN0b3JlIDwgbWF4X2xpbWl0KVxuXHRcdFx0cHJldmlvdXMgPSBuc3RvcmUgLSAxO1xuXHRcdGVsc2Vcblx0XHRcdHByZXZpb3VzID0gbWF4X2xpbWl0IC0gMTtcblx0fVxuXHRzZXRfY291bnQob3B0cywgcHJldmlvdXMgKyAxKTtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSlcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpK3ByZXZpb3VzKSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYXJyKG9wdHMpW3ByZXZpb3VzXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0KG9wdHMsIG5leHQpIHtcblx0aWYobmV4dCA9PT0gdW5kZWZpbmVkKVxuXHRcdG5leHQgPSBnZXRfY291bnQob3B0cyk7XG5cdGlmKG5leHQgPj0gbWF4X2xpbWl0KVxuXHRcdG5leHQgPSAwO1xuXG5cdHNldF9jb3VudChvcHRzLCBwYXJzZUludChuZXh0KSArIDEpO1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrbmV4dCkpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtuZXh0XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcihvcHRzKSB7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y2xlYXJfYnJvd3Nlcl9zdG9yZShvcHRzKTtcblx0ZGljdF9jYWNoZSA9IHt9O1xufVxuXG4vLyB6b29tIC0gc3RvcmUgdHJhbnNsYXRpb24gY29vcmRzXG5leHBvcnQgZnVuY3Rpb24gc2V0cG9zaXRpb24ob3B0cywgeCwgeSwgem9vbSkge1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKSB7XG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1gnLCB4KTtcblx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWScsIHkpO1xuXHRcdGlmKHpvb20pXG5cdFx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWk9PTScsIHpvb20pO1xuXHR9IGVsc2Uge1xuXHRcdC8vVE9ET1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRwb3NpdGlvbihvcHRzKSB7XG5cdGlmKCFoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpIHx8XG5cdFx0KGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldF9wcmVmaXgob3B0cykrJ19YJykgPT09IG51bGwgJiZcblx0XHQgc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShnZXRfcHJlZml4KG9wdHMpKydfWCcpID09PSBudWxsKSlcblx0XHRyZXR1cm4gW251bGwsIG51bGxdO1xuXHRsZXQgcG9zID0gWyBwYXJzZUludChnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWCcpKSxcblx0XHRcdFx0cGFyc2VJbnQoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1knKSkgXTtcblx0aWYoZ2V0X2Jyb3dzZXJfc3RvcmUoZ2V0X3ByZWZpeChvcHRzKSsnX1pPT00nKSAhPT0gbnVsbClcblx0XHRwb3MucHVzaChwYXJzZUZsb2F0KGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19aT09NJykpKTtcblx0cmV0dXJuIHBvcztcbn1cbiIsIi8vIFBlZGlncmVlIFRyZWUgVXRpbHNcblxuaW1wb3J0IHtzeW5jVHdpbnMsIHJlYnVpbGQsIGFkZGNoaWxkLCBkZWxldGVfbm9kZV9kYXRhc2V0fSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCAqIGFzIHBlZGNhY2hlIGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJRSgpIHtcblx0IGxldCB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG5cdCAvKiBNU0lFIHVzZWQgdG8gZGV0ZWN0IG9sZCBicm93c2VycyBhbmQgVHJpZGVudCB1c2VkIHRvIG5ld2VyIG9uZXMqL1xuXHQgcmV0dXJuIHVhLmluZGV4T2YoXCJNU0lFIFwiKSA+IC0xIHx8IHVhLmluZGV4T2YoXCJUcmlkZW50L1wiKSA+IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFZGdlKCkge1xuXHQgcmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0VkZ2UvZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3B5X2RhdGFzZXQoZGF0YXNldCkge1xuXHRpZihkYXRhc2V0WzBdLmlkKSB7IC8vIHNvcnQgYnkgaWRcblx0XHRkYXRhc2V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gKCFhLmlkIHx8ICFiLmlkID8gMDogKGEuaWQgPiBiLmlkKSA/IDEgOiAoKGIuaWQgPiBhLmlkKSA/IC0xIDogMCkpO30pO1xuXHR9XG5cblx0bGV0IGRpc2FsbG93ZWQgPSBbXCJpZFwiLCBcInBhcmVudF9ub2RlXCJdO1xuXHRsZXQgbmV3ZGF0YXNldCA9IFtdO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKXtcblx0XHRsZXQgb2JqID0ge307XG5cdFx0Zm9yKGxldCBrZXkgaW4gZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoZGlzYWxsb3dlZC5pbmRleE9mKGtleSkgPT0gLTEpXG5cdFx0XHRcdG9ialtrZXldID0gZGF0YXNldFtpXVtrZXldO1xuXHRcdH1cblx0XHRuZXdkYXRhc2V0LnB1c2gob2JqKTtcblx0fVxuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLyoqXG4gKiAgR2V0IGZvcm1hdHRlZCB0aW1lIG9yIGRhdGEgJiB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGb3JtYXR0ZWREYXRlKHRpbWUpe1xuXHRsZXQgZCA9IG5ldyBEYXRlKCk7XG5cdGlmKHRpbWUpXG5cdFx0cmV0dXJuICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIjpcIiArICgnMCcgKyBkLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArIFwiLVwiICsgKCcwJyArIChkLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpICsgXCItXCIgKyAoJzAnICsgZC5nZXREYXRlKCkpLnNsaWNlKC0yKSArIFwiIFwiICsgKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gfVxuXG4vKipcbiAqIFNob3cgbWVzc2FnZSBvciBjb25maXJtYXRpb24gZGlhbG9nLlxuICogQHBhcmFtIHRpdGxlXHQgLSBkaWFsb2cgd2luZG93IHRpdGxlXG4gKiBAcGFyYW0gbXNnXHQgICAtIG1lc3NhZ2UgdG8gZGlhc3BsYXlcbiAqIEBwYXJhbSBvbkNvbmZpcm0gLSBmdW5jdGlvbiB0byBjYWxsIGluIGEgY29uZmlybWF0aW9uIGRpYWxvZ1xuICogQHBhcmFtIG9wdHNcdCAgLSBwZWRpZ3JlZWpzIG9wdGlvbnNcbiAqIEBwYXJhbSBkYXRhc2V0XHQtIHBlZGlncmVlIGRhdGFzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VzKHRpdGxlLCBtc2csIG9uQ29uZmlybSwgb3B0cywgZGF0YXNldCkge1xuXHRpZihvbkNvbmZpcm0pIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHRcdG1vZGFsOiB0cnVlLFxuXHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdHdpZHRoOiAzNTAsXG5cdFx0XHRcdGJ1dHRvbnM6IHtcblx0XHRcdFx0XHRcIlllc1wiOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHRcdG9uQ29uZmlybShvcHRzLCBkYXRhc2V0KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwiTm9cIjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHR3aWR0aDogMzUwLFxuXHRcdFx0YnV0dG9uczogW3tcblx0XHRcdFx0dGV4dDogXCJPS1wiLFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7ICQoIHRoaXMgKS5kaWFsb2coIFwiY2xvc2VcIiApO31cblx0XHRcdH1dXG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhZ2UgYW5kIHlvYiBpcyBjb25zaXN0ZW50IHdpdGggY3VycmVudCB5ZWFyLiBUaGUgc3VtIG9mIGFnZSBhbmRcbiAqIHlvYiBzaG91bGQgbm90IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBjdXJyZW50IHllYXIuIElmIGFsaXZlIHRoZVxuICogYWJzb2x1dGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgYWdlIGFuZCB5ZWFyIG9mIGJpcnRoIGFuZCB0aGVcbiAqIGN1cnJlbnQgeWVhciBzaG91bGQgYmUgPD0gMS5cbiAqIEBwYXJhbSBhZ2VcdC0gYWdlIGluIHllYXJzLlxuICogQHBhcmFtIHlvYlx0LSB5ZWFyIG9mIGJpcnRoLlxuICogQHBhcmFtIHN0YXR1cyAtIDAgPSBhbGl2ZSwgMSA9IGRlYWQuXG4gKiBAcmV0dXJuIHRydWUgaWYgYWdlIGFuZCB5b2IgYXJlIGNvbnNpc3RlbnQgd2l0aCBjdXJyZW50IHllYXIgb3RoZXJ3aXNlIGZhbHNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfYWdlX3lvYihhZ2UsIHlvYiwgc3RhdHVzKSB7XG5cdGxldCB5ZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuXHRsZXQgc3VtID0gcGFyc2VJbnQoYWdlKSArIHBhcnNlSW50KHlvYik7XG5cdGlmKHN0YXR1cyA9PSAxKSB7ICAgLy8gZGVjZWFzZWRcblx0XHRyZXR1cm4geWVhciA+PSBzdW07XG5cdH1cblx0cmV0dXJuIE1hdGguYWJzKHllYXIgLSBzdW0pIDw9IDEgJiYgeWVhciA+PSBzdW07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG5cdHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VpZChsZW4pIHtcblx0bGV0IHRleHQgPSBcIlwiO1xuXHRsZXQgcG9zc2libGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcblx0Zm9yKCBsZXQgaT0wOyBpIDwgbGVuOyBpKysgKVxuXHRcdHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVHJlZShvcHRzLCBwZXJzb24sIHJvb3QsIHBhcnRuZXJMaW5rcywgaWQpIHtcblx0aWYgKHR5cGVvZiBwZXJzb24uY2hpbGRyZW4gPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0cGVyc29uLmNoaWxkcmVuID0gZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBwZXJzb24pO1xuXG5cdGlmICh0eXBlb2YgcGFydG5lckxpbmtzID09PSB0eXBlb2YgdW5kZWZpbmVkKSB7XG5cdFx0cGFydG5lckxpbmtzID0gW107XG5cdFx0aWQgPSAxO1xuXHR9XG5cblx0bGV0IG5vZGVzID0gZmxhdHRlbihyb290KTtcblx0Ly9jb25zb2xlLmxvZygnTkFNRT0nK3BlcnNvbi5uYW1lKycgTk8uIENISUxEUkVOPScrcGVyc29uLmNoaWxkcmVuLmxlbmd0aCk7XG5cdGxldCBwYXJ0bmVycyA9IFtdO1xuXHQkLmVhY2gocGVyc29uLmNoaWxkcmVuLCBmdW5jdGlvbihpLCBjaGlsZCkge1xuXHRcdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGosIHApIHtcblx0XHRcdGlmICgoKGNoaWxkLm5hbWUgPT09IHAubW90aGVyKSB8fCAoY2hpbGQubmFtZSA9PT0gcC5mYXRoZXIpKSAmJiBjaGlsZC5pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGxldCBtID0gZ2V0Tm9kZUJ5TmFtZShub2RlcywgcC5tb3RoZXIpO1xuXHRcdFx0XHRsZXQgZiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHAuZmF0aGVyKTtcblx0XHRcdFx0bSA9IChtICE9PSB1bmRlZmluZWQ/IG0gOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5tb3RoZXIpKTtcblx0XHRcdFx0ZiA9IChmICE9PSB1bmRlZmluZWQ/IGYgOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5mYXRoZXIpKTtcblx0XHRcdFx0aWYoIWNvbnRhaW5zX3BhcmVudChwYXJ0bmVycywgbSwgZikpXG5cdFx0XHRcdFx0cGFydG5lcnMucHVzaCh7J21vdGhlcic6IG0sICdmYXRoZXInOiBmfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXHQkLm1lcmdlKHBhcnRuZXJMaW5rcywgcGFydG5lcnMpO1xuXG5cdCQuZWFjaChwYXJ0bmVycywgZnVuY3Rpb24oaSwgcHRyKSB7XG5cdFx0bGV0IG1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0bGV0IGZhdGhlciA9IHB0ci5mYXRoZXI7XG5cdFx0bW90aGVyLmNoaWxkcmVuID0gW107XG5cdFx0bGV0IHBhcmVudCA9IHtcblx0XHRcdFx0bmFtZSA6IG1ha2VpZCg0KSxcblx0XHRcdFx0aGlkZGVuIDogdHJ1ZSxcblx0XHRcdFx0cGFyZW50IDogbnVsbCxcblx0XHRcdFx0ZmF0aGVyIDogZmF0aGVyLFxuXHRcdFx0XHRtb3RoZXIgOiBtb3RoZXIsXG5cdFx0XHRcdGNoaWxkcmVuIDogZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBtb3RoZXIsIGZhdGhlcilcblx0XHR9O1xuXG5cdFx0bGV0IG1pZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIubmFtZSk7XG5cdFx0bGV0IGZpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0aWYoISgnaWQnIGluIGZhdGhlcikgJiYgISgnaWQnIGluIG1vdGhlcikpXG5cdFx0XHRpZCA9IHNldENoaWxkcmVuSWQocGVyc29uLmNoaWxkcmVuLCBpZCk7XG5cblx0XHQvLyBsb29rIGF0IGdyYW5kcGFyZW50cyBpbmRleFxuXHRcdGxldCBncCA9IGdldF9ncmFuZHBhcmVudHNfaWR4KG9wdHMuZGF0YXNldCwgbWlkeCwgZmlkeCk7XG5cdFx0aWYoZ3AuZmlkeCA8IGdwLm1pZHgpIHtcblx0XHRcdGZhdGhlci5pZCA9IGlkKys7XG5cdFx0XHRwYXJlbnQuaWQgPSBpZCsrO1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHRcdHBhcmVudC5pZCA9IGlkKys7XG5cdFx0XHRmYXRoZXIuaWQgPSBpZCsrO1xuXHRcdH1cblx0XHRpZCA9IHVwZGF0ZVBhcmVudChtb3RoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRpZCA9IHVwZGF0ZVBhcmVudChmYXRoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRwZXJzb24uY2hpbGRyZW4ucHVzaChwYXJlbnQpO1xuXHR9KTtcblx0aWQgPSBzZXRDaGlsZHJlbklkKHBlcnNvbi5jaGlsZHJlbiwgaWQpO1xuXG5cdCQuZWFjaChwZXJzb24uY2hpbGRyZW4sIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZCA9IGJ1aWxkVHJlZShvcHRzLCBwLCByb290LCBwYXJ0bmVyTGlua3MsIGlkKVsxXTtcblx0fSk7XG5cdHJldHVybiBbcGFydG5lckxpbmtzLCBpZF07XG59XG5cbi8vIHVwZGF0ZSBwYXJlbnQgbm9kZSBhbmQgc29ydCB0d2luc1xuZnVuY3Rpb24gdXBkYXRlUGFyZW50KHAsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKSB7XG5cdC8vIGFkZCB0byBwYXJlbnQgbm9kZVxuXHRpZigncGFyZW50X25vZGUnIGluIHApXG5cdFx0cC5wYXJlbnRfbm9kZS5wdXNoKHBhcmVudCk7XG5cdGVsc2Vcblx0XHRwLnBhcmVudF9ub2RlID0gW3BhcmVudF07XG5cblx0Ly8gY2hlY2sgdHdpbnMgbGllIG5leHQgdG8gZWFjaCBvdGhlclxuXHRpZihwLm16dHdpbiB8fCBwLmR6dHdpbnMpIHtcblx0XHRsZXQgdHdpbnMgPSBnZXRUd2lucyhvcHRzLmRhdGFzZXQsIHApO1xuXHRcdGZvcihsZXQgaT0wOyBpPHR3aW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgdHdpbiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHR3aW5zW2ldLm5hbWUpO1xuXHRcdFx0aWYodHdpbilcblx0XHRcdFx0dHdpbi5pZCA9IGlkKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBpZDtcbn1cblxuZnVuY3Rpb24gc2V0Q2hpbGRyZW5JZChjaGlsZHJlbiwgaWQpIHtcblx0Ly8gc29ydCB0d2lucyB0byBsaWUgbmV4dCB0byBlYWNoIG90aGVyXG5cdGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHRcdGlmKGEubXp0d2luICYmIGIubXp0d2luICYmIGEubXp0d2luID09IGIubXp0d2luKVxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0ZWxzZSBpZihhLmR6dHdpbiAmJiBiLmR6dHdpbiAmJiBhLmR6dHdpbiA9PSBiLmR6dHdpbilcblx0XHRcdHJldHVybiAwO1xuXHRcdGVsc2UgaWYoYS5tenR3aW4gfHwgYi5tenR3aW4gfHwgYS5kenR3aW4gfHwgYi5kenR3aW4pXG5cdFx0XHRyZXR1cm4gMTtcblx0XHRyZXR1cm4gMDtcblx0fSk7XG5cblx0JC5lYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYocC5pZCA9PT0gdW5kZWZpbmVkKSBwLmlkID0gaWQrKztcblx0fSk7XG5cdHJldHVybiBpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvYmFuZChvYmopIHtcblx0cmV0dXJuIHR5cGVvZiAkKG9iaikuYXR0cigncHJvYmFuZCcpICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmICQob2JqKS5hdHRyKCdwcm9iYW5kJykgIT09IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJvYmFuZChkYXRhc2V0LCBuYW1lLCBpc19wcm9iYW5kKSB7XG5cdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYgKG5hbWUgPT09IHAubmFtZSlcblx0XHRcdHAucHJvYmFuZCA9IGlzX3Byb2JhbmQ7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHAucHJvYmFuZDtcblx0fSk7XG59XG5cbi8vY29tYmluZSBhcnJheXMgaWdub3JpbmcgZHVwbGljYXRlc1xuZnVuY3Rpb24gY29tYmluZUFycmF5cyhhcnIxLCBhcnIyKSB7XG5cdGZvcihsZXQgaT0wOyBpPGFycjIubGVuZ3RoOyBpKyspXG5cdFx0aWYoJC5pbkFycmF5KCBhcnIyW2ldLCBhcnIxICkgPT0gLTEpIGFycjEucHVzaChhcnIyW2ldKTtcbn1cblxuZnVuY3Rpb24gaW5jbHVkZV9jaGlsZHJlbihjb25uZWN0ZWQsIHAsIGRhdGFzZXQpIHtcblx0aWYoJC5pbkFycmF5KCBwLm5hbWUsIGNvbm5lY3RlZCApID09IC0xKVxuXHRcdHJldHVybjtcblx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBwKSk7XG5cdGxldCBjaGlsZHJlbiA9IGdldEFsbENoaWxkcmVuKGRhdGFzZXQsIHApO1xuXHQkLmVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKCBjaGlsZF9pZHgsIGNoaWxkICkge1xuXHRcdGlmKCQuaW5BcnJheSggY2hpbGQubmFtZSwgY29ubmVjdGVkICkgPT0gLTEpIHtcblx0XHRcdGNvbm5lY3RlZC5wdXNoKGNoaWxkLm5hbWUpO1xuXHRcdFx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCkpO1xuXHRcdH1cblx0fSk7XG59XG5cbi8vZ2V0IHRoZSBwYXJ0bmVycyBmb3IgYSBnaXZlbiBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIGFub2RlKSB7XG5cdGxldCBwdHJzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgYm5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGFub2RlLm5hbWUgPT09IGJub2RlLm1vdGhlciAmJiAkLmluQXJyYXkoYm5vZGUuZmF0aGVyLCBwdHJzKSA9PSAtMSlcblx0XHRcdHB0cnMucHVzaChibm9kZS5mYXRoZXIpO1xuXHRcdGVsc2UgaWYoYW5vZGUubmFtZSA9PT0gYm5vZGUuZmF0aGVyICYmICQuaW5BcnJheShibm9kZS5tb3RoZXIsIHB0cnMpID09IC0xKVxuXHRcdFx0cHRycy5wdXNoKGJub2RlLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHB0cnM7XG59XG5cbi8vcmV0dXJuIGEgbGlzdCBvZiBpbmRpdmlkdWFscyB0aGF0IGFyZW4ndCBjb25uZWN0ZWQgdG8gdGhlIHRhcmdldFxuZXhwb3J0IGZ1bmN0aW9uIHVuY29ubmVjdGVkKGRhdGFzZXQpe1xuXHRsZXQgdGFyZ2V0ID0gZGF0YXNldFsgZ2V0UHJvYmFuZEluZGV4KGRhdGFzZXQpIF07XG5cdGlmKCF0YXJnZXQpe1xuXHRcdGNvbnNvbGUud2FybihcIk5vIHRhcmdldCBkZWZpbmVkXCIpO1xuXHRcdGlmKGRhdGFzZXQubGVuZ3RoID09IDApIHtcblx0XHRcdHRocm93IFwiZW1wdHkgcGVkaWdyZWUgZGF0YSBzZXRcIjtcblx0XHR9XG5cdFx0dGFyZ2V0ID0gZGF0YXNldFswXTtcblx0fVxuXHRsZXQgY29ubmVjdGVkID0gW3RhcmdldC5uYW1lXTtcblx0bGV0IGNoYW5nZSA9IHRydWU7XG5cdGxldCBpaSA9IDA7XG5cdHdoaWxlKGNoYW5nZSAmJiBpaSA8IDIwMCkge1xuXHRcdGlpKys7XG5cdFx0bGV0IG5jb25uZWN0ID0gY29ubmVjdGVkLmxlbmd0aDtcblx0XHQkLmVhY2goZGF0YXNldCwgZnVuY3Rpb24oIGlkeCwgcCApIHtcblx0XHRcdGlmKCQuaW5BcnJheSggcC5uYW1lLCBjb25uZWN0ZWQgKSAhPSAtMSkge1xuXHRcdFx0XHQvLyBjaGVjayBpZiB0aGlzIHBlcnNvbiBvciBhIHBhcnRuZXIgaGFzIGEgcGFyZW50XG5cdFx0XHRcdGxldCBwdHJzID0gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIHApO1xuXHRcdFx0XHRsZXQgaGFzX3BhcmVudCA9IChwLm5hbWUgPT09IHRhcmdldC5uYW1lIHx8ICFwLm5vcGFyZW50cyk7XG5cdFx0XHRcdGZvcihsZXQgaT0wOyBpPHB0cnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdGlmKCFnZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbaV0pLm5vcGFyZW50cylcblx0XHRcdFx0XHRcdGhhc19wYXJlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoaGFzX3BhcmVudCl7XG5cdFx0XHRcdFx0aWYocC5tb3RoZXIgJiYgJC5pbkFycmF5KCBwLm1vdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLm1vdGhlcik7XG5cdFx0XHRcdFx0aWYocC5mYXRoZXIgJiYgJC5pbkFycmF5KCBwLmZhdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLmZhdGhlcik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiggIXAubm9wYXJlbnRzICYmXG5cdFx0XHRcdFx0ICAoKHAubW90aGVyICYmICQuaW5BcnJheSggcC5tb3RoZXIsIGNvbm5lY3RlZCApICE9IC0xKSB8fFxuXHRcdFx0XHRcdCAgIChwLmZhdGhlciAmJiAkLmluQXJyYXkoIHAuZmF0aGVyLCBjb25uZWN0ZWQgKSAhPSAtMSkpKXtcblx0XHRcdFx0Y29ubmVjdGVkLnB1c2gocC5uYW1lKTtcblx0XHRcdH1cblx0XHRcdC8vIGluY2x1ZGUgYW55IGNoaWxkcmVuXG5cdFx0XHRpbmNsdWRlX2NoaWxkcmVuKGNvbm5lY3RlZCwgcCwgZGF0YXNldCk7XG5cdFx0fSk7XG5cdFx0Y2hhbmdlID0gKG5jb25uZWN0ICE9IGNvbm5lY3RlZC5sZW5ndGgpO1xuXHR9XG5cdGxldCBuYW1lcyA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwubmFtZTt9KTtcblx0cmV0dXJuICQubWFwKG5hbWVzLCBmdW5jdGlvbihuYW1lLCBfaSl7cmV0dXJuICQuaW5BcnJheShuYW1lLCBjb25uZWN0ZWQpID09IC0xID8gbmFtZSA6IG51bGw7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9iYW5kSW5kZXgoZGF0YXNldCkge1xuXHRsZXQgcHJvYmFuZDtcblx0JC5lYWNoKGRhdGFzZXQsIGZ1bmN0aW9uKGksIHZhbCkge1xuXHRcdGlmIChpc1Byb2JhbmQodmFsKSkge1xuXHRcdFx0cHJvYmFuZCA9IGk7XG5cdFx0XHRyZXR1cm4gcHJvYmFuZDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gcHJvYmFuZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkcmVuKGRhdGFzZXQsIG1vdGhlciwgZmF0aGVyKSB7XG5cdGxldCBjaGlsZHJlbiA9IFtdO1xuXHRsZXQgbmFtZXMgPSBbXTtcblx0aWYobW90aGVyLnNleCA9PT0gJ0YnKVxuXHRcdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihtb3RoZXIubmFtZSA9PT0gcC5tb3RoZXIpXG5cdFx0XHRcdGlmKCFmYXRoZXIgfHwgZmF0aGVyLm5hbWUgPT0gcC5mYXRoZXIpIHtcblx0XHRcdFx0XHRpZigkLmluQXJyYXkocC5uYW1lLCBuYW1lcykgPT09IC0xKXtcblx0XHRcdFx0XHRcdGNoaWxkcmVuLnB1c2gocCk7XG5cdFx0XHRcdFx0XHRuYW1lcy5wdXNoKHAubmFtZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBjaGlsZHJlbjtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNfcGFyZW50KGFyciwgbSwgZikge1xuXHRmb3IobGV0IGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspXG5cdFx0aWYoYXJyW2ldLm1vdGhlciA9PT0gbSAmJiBhcnJbaV0uZmF0aGVyID09PSBmKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gZ2V0IHRoZSBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWwgLSBzZXggaXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyXG4vLyBmb3Igb25seSByZXR1cm5pbmcgYnJvdGhlcnMgb3Igc2lzdGVyc1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbiwgc2V4KSB7XG5cdGlmKHBlcnNvbiA9PT0gdW5kZWZpbmVkIHx8ICFwZXJzb24ubW90aGVyIHx8IHBlcnNvbi5ub3BhcmVudHMpXG5cdFx0cmV0dXJuIFtdO1xuXG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgcC5tb3RoZXIgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09IHNleCkgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgc2libGluZ3MgKyBhZG9wdGVkIHNpYmxpbmdzXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgcGVyc29uLCBzZXgpIHtcblx0cmV0dXJuICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gIHAubmFtZSAhPT0gcGVyc29uLm5hbWUgJiYgISgnbm9wYXJlbnRzJyBpbiBwKSAmJiBwLm1vdGhlciAmJlxuXHRcdFx0ICAgKHAubW90aGVyID09PSBwZXJzb24ubW90aGVyICYmIHAuZmF0aGVyID09PSBwZXJzb24uZmF0aGVyKSAmJlxuXHRcdFx0ICAgKCFzZXggfHwgcC5zZXggPT0gc2V4KSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuLy8gZ2V0IHRoZSBtb25vL2RpLXp5Z290aWMgdHdpbihzKVxuZXhwb3J0IGZ1bmN0aW9uIGdldFR3aW5zKGRhdGFzZXQsIHBlcnNvbikge1xuXHRsZXQgc2licyA9IGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbik7XG5cdGxldCB0d2luX3R5cGUgPSAocGVyc29uLm16dHdpbiA/IFwibXp0d2luXCIgOiBcImR6dHdpblwiKTtcblx0cmV0dXJuICQubWFwKHNpYnMsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gcC5uYW1lICE9PSBwZXJzb24ubmFtZSAmJiBwW3R3aW5fdHlwZV0gPT0gcGVyc29uW3R3aW5fdHlwZV0gPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgYWRvcHRlZCBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWxcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZG9wdGVkU2libGluZ3MoZGF0YXNldCwgcGVyc29uKSB7XG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICdub3BhcmVudHMnIGluIHAgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxDaGlsZHJlbihkYXRhc2V0LCBwZXJzb24sIHNleCkge1xuXHRyZXR1cm4gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe1xuXHRcdHJldHVybiAhKCdub3BhcmVudHMnIGluIHApICYmXG5cdFx0XHQgICAocC5tb3RoZXIgPT09IHBlcnNvbi5uYW1lIHx8IHAuZmF0aGVyID09PSBwZXJzb24ubmFtZSkgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09PSBzZXgpID8gcCA6IG51bGw7XG5cdH0pO1xufVxuXG4vLyBnZXQgdGhlIGRlcHRoIG9mIHRoZSBnaXZlbiBwZXJzb24gZnJvbSB0aGUgcm9vdFxuZXhwb3J0IGZ1bmN0aW9uIGdldERlcHRoKGRhdGFzZXQsIG5hbWUpIHtcblx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGRlcHRoID0gMTtcblxuXHR3aGlsZShpZHggPj0gMCAmJiAoJ21vdGhlcicgaW4gZGF0YXNldFtpZHhdIHx8IGRhdGFzZXRbaWR4XS50b3BfbGV2ZWwpKXtcblx0XHRpZHggPSBnZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLm1vdGhlcik7XG5cdFx0ZGVwdGgrKztcblx0fVxuXHRyZXR1cm4gZGVwdGg7XG59XG5cbi8vIGdpdmVuIGFuIGFycmF5IG9mIHBlb3BsZSBnZXQgYW4gaW5kZXggZm9yIGEgZ2l2ZW4gcGVyc29uXG5leHBvcnQgZnVuY3Rpb24gZ2V0SWR4QnlOYW1lKGFyciwgbmFtZSkge1xuXHRsZXQgaWR4ID0gLTE7XG5cdCQuZWFjaChhcnIsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZiAobmFtZSA9PT0gcC5uYW1lKSB7XG5cdFx0XHRpZHggPSBpO1xuXHRcdFx0cmV0dXJuIGlkeDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gaWR4O1xufVxuXG4vLyBnZXQgdGhlIG5vZGVzIGF0IGEgZ2l2ZW4gZGVwdGggc29ydGVkIGJ5IHRoZWlyIHggcG9zaXRpb25cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2Rlc0F0RGVwdGgoZm5vZGVzLCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRyZXR1cm4gJC5tYXAoZm5vZGVzLCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuIHAuZGVwdGggPT0gZGVwdGggJiYgIXAuZGF0YS5oaWRkZW4gJiYgJC5pbkFycmF5KHAuZGF0YS5uYW1lLCBleGNsdWRlX25hbWVzKSA9PSAtMSA/IHAgOiBudWxsO1xuXHR9KS5zb3J0KGZ1bmN0aW9uIChhLGIpIHtyZXR1cm4gYS54IC0gYi54O30pO1xufVxuXG4vLyBjb252ZXJ0IHRoZSBwYXJ0bmVyIG5hbWVzIGludG8gY29ycmVzcG9uZGluZyB0cmVlIG5vZGVzXG5leHBvcnQgZnVuY3Rpb24gbGlua05vZGVzKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnMpIHtcblx0bGV0IGxpbmtzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPCBwYXJ0bmVycy5sZW5ndGg7IGkrKylcblx0XHRsaW5rcy5wdXNoKHsnbW90aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLm1vdGhlci5uYW1lKSxcblx0XHRcdFx0XHQnZmF0aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLmZhdGhlci5uYW1lKX0pO1xuXHRyZXR1cm4gbGlua3M7XG59XG5cbi8vIGdldCBhbmNlc3RvcnMgb2YgYSBub2RlXG5leHBvcnQgZnVuY3Rpb24gYW5jZXN0b3JzKGRhdGFzZXQsIG5vZGUpIHtcblx0bGV0IGFuY2VzdG9ycyA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmRhdGEpIG5vZGUgPSBub2RlLmRhdGE7XG5cdFx0aWYoJ21vdGhlcicgaW4gbm9kZSAmJiAnZmF0aGVyJyBpbiBub2RlICYmICEoJ25vcGFyZW50cycgaW4gbm9kZSkpe1xuXHRcdFx0cmVjdXJzZShnZXROb2RlQnlOYW1lKGRhdGFzZXQsIG5vZGUubW90aGVyKSk7XG5cdFx0XHRyZWN1cnNlKGdldE5vZGVCeU5hbWUoZGF0YXNldCwgbm9kZS5mYXRoZXIpKTtcblx0XHR9XG5cdFx0YW5jZXN0b3JzLnB1c2gobm9kZSk7XG5cdH1cblx0cmVjdXJzZShub2RlKTtcblx0cmV0dXJuIGFuY2VzdG9ycztcbn1cblxuLy8gdGVzdCBpZiB0d28gbm9kZXMgYXJlIGNvbnNhbmd1aW5vdXMgcGFydG5lcnNcbmV4cG9ydCBmdW5jdGlvbiBjb25zYW5ndWl0eShub2RlMSwgbm9kZTIsIG9wdHMpIHtcblx0aWYobm9kZTEuZGVwdGggIT09IG5vZGUyLmRlcHRoKSAvLyBwYXJlbnRzIGF0IGRpZmZlcmVudCBkZXB0aHNcblx0XHRyZXR1cm4gdHJ1ZTtcblx0bGV0IGFuY2VzdG9yczEgPSBhbmNlc3RvcnMob3B0cy5kYXRhc2V0LCBub2RlMSk7XG5cdGxldCBhbmNlc3RvcnMyID0gYW5jZXN0b3JzKG9wdHMuZGF0YXNldCwgbm9kZTIpO1xuXHRsZXQgbmFtZXMxID0gJC5tYXAoYW5jZXN0b3JzMSwgZnVuY3Rpb24oYW5jZXN0b3IsIF9pKXtyZXR1cm4gYW5jZXN0b3IubmFtZTt9KTtcblx0bGV0IG5hbWVzMiA9ICQubWFwKGFuY2VzdG9yczIsIGZ1bmN0aW9uKGFuY2VzdG9yLCBfaSl7cmV0dXJuIGFuY2VzdG9yLm5hbWU7fSk7XG5cdGxldCBjb25zYW5ndWl0eSA9IGZhbHNlO1xuXHQkLmVhY2gobmFtZXMxLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XG5cdFx0aWYoJC5pbkFycmF5KG5hbWUsIG5hbWVzMikgIT09IC0xKXtcblx0XHRcdGNvbnNhbmd1aXR5ID0gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gY29uc2FuZ3VpdHk7XG59XG5cbi8vIHJldHVybiBhIGZsYXR0ZW5lZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJlZVxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4ocm9vdCkge1xuXHRsZXQgZmxhdCA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmNoaWxkcmVuKVxuXHRcdFx0bm9kZS5jaGlsZHJlbi5mb3JFYWNoKHJlY3Vyc2UpO1xuXHRcdGZsYXQucHVzaChub2RlKTtcblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZXR1cm4gZmxhdDtcbn1cblxuLy8gQWRqdXN0IEQzIGxheW91dCBwb3NpdGlvbmluZy5cbi8vIFBvc2l0aW9uIGhpZGRlbiBwYXJlbnQgbm9kZSBjZW50cmluZyB0aGVtIGJldHdlZW4gZmF0aGVyIGFuZCBtb3RoZXIgbm9kZXMuIFJlbW92ZSBraW5rc1xuLy8gZnJvbSBsaW5rcyAtIGUuZy4gd2hlcmUgdGhlcmUgaXMgYSBzaW5nbGUgY2hpbGQgcGx1cyBhIGhpZGRlbiBjaGlsZFxuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdF9jb29yZHMob3B0cywgcm9vdCwgZmxhdHRlbk5vZGVzKSB7XG5cdGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuXHRcdGlmIChub2RlLmNoaWxkcmVuKSB7XG5cdFx0XHRub2RlLmNoaWxkcmVuLmZvckVhY2gocmVjdXJzZSk7XG5cblx0XHRcdGlmKG5vZGUuZGF0YS5mYXRoZXIgIT09IHVuZGVmaW5lZCkgeyBcdC8vIGhpZGRlbiBub2Rlc1xuXHRcdFx0XHRsZXQgZmF0aGVyID0gZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIG5vZGUuZGF0YS5mYXRoZXIubmFtZSk7XG5cdFx0XHRcdGxldCBtb3RoZXIgPSBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2Rlcywgbm9kZS5kYXRhLm1vdGhlci5uYW1lKTtcblx0XHRcdFx0bGV0IHhtaWQgPSAoZmF0aGVyLnggKyBtb3RoZXIueCkgLzI7XG5cdFx0XHRcdGlmKCFvdmVybGFwKG9wdHMsIHJvb3QuZGVzY2VuZGFudHMoKSwgeG1pZCwgbm9kZS5kZXB0aCwgW25vZGUuZGF0YS5uYW1lXSkpIHtcblx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzXG5cdFx0XHRcdFx0bGV0IGRpZmYgPSBub2RlLnggLSB4bWlkO1xuXHRcdFx0XHRcdGlmKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDIgJiYgKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gfHwgbm9kZS5jaGlsZHJlblsxXS5kYXRhLmhpZGRlbikpIHtcblx0XHRcdFx0XHRcdGlmKCEobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiAmJiBub2RlLmNoaWxkcmVuWzFdLmRhdGEuaGlkZGVuKSkge1xuXHRcdFx0XHRcdFx0XHRsZXQgY2hpbGQxID0gKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gPyBub2RlLmNoaWxkcmVuWzFdIDogbm9kZS5jaGlsZHJlblswXSk7XG5cdFx0XHRcdFx0XHRcdGxldCBjaGlsZDIgPSAobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiA/IG5vZGUuY2hpbGRyZW5bMF0gOiBub2RlLmNoaWxkcmVuWzFdKTtcblx0XHRcdFx0XHRcdFx0aWYoICgoY2hpbGQxLnggPCBjaGlsZDIueCAmJiB4bWlkIDwgY2hpbGQyLngpIHx8IChjaGlsZDEueCA+IGNoaWxkMi54ICYmIHhtaWQgPiBjaGlsZDIueCkpICYmXG5cdFx0XHRcdFx0XHRcdFx0IW92ZXJsYXAob3B0cywgcm9vdC5kZXNjZW5kYW50cygpLCB4bWlkLCBjaGlsZDEuZGVwdGgsIFtjaGlsZDEuZGF0YS5uYW1lXSkpe1xuXHRcdFx0XHRcdFx0XHRcdGNoaWxkMS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxICYmICFub2RlLmNoaWxkcmVuWzBdLmRhdGEuaGlkZGVuKSB7XG5cdFx0XHRcdFx0XHRpZighb3ZlcmxhcChvcHRzLCByb290LmRlc2NlbmRhbnRzKCksIHhtaWQsIG5vZGUuY2hpbGRyZW5bMF0uZGVwdGgsIFtub2RlLmNoaWxkcmVuWzBdLmRhdGEubmFtZV0pKVxuXHRcdFx0XHRcdFx0XHRub2RlLmNoaWxkcmVuWzBdLnggPSB4bWlkO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZihkaWZmICE9PSAwICYmICFub2Rlc092ZXJsYXAob3B0cywgbm9kZSwgZGlmZiwgcm9vdCkpe1xuXHRcdFx0XHRcdFx0XHRpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0bm9kZS5jaGlsZHJlblswXS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZGVzY2VuZGFudHMgPSBub2RlLmRlc2NlbmRhbnRzKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdBREpVU1RJTkcgJytub2RlLmRhdGEubmFtZSsnIE5PLiBERVNDRU5EQU5UUyAnK2Rlc2NlbmRhbnRzLmxlbmd0aCsnIGRpZmY9JytkaWZmKTtcblx0XHRcdFx0XHRcdFx0XHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYobm9kZS5kYXRhLm5hbWUgIT09IGRlc2NlbmRhbnRzW2ldLmRhdGEubmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVzY2VuZGFudHNbaV0ueCAtPSBkaWZmO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmKChub2RlLnggPCBmYXRoZXIueCAmJiBub2RlLnggPCBtb3RoZXIueCkgfHwgKG5vZGUueCA+IGZhdGhlci54ICYmIG5vZGUueCA+IG1vdGhlci54KSl7XG5cdFx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzIGlmIGl0IGRvZXNuJ3QgbGllIGJldHdlZW4gbW90aGVyIGFuZCBmYXRoZXJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZWN1cnNlKHJvb3QpO1xufVxuXG4vLyB0ZXN0IGlmIG1vdmluZyBzaWJsaW5ncyBieSBkaWZmIG92ZXJsYXBzIHdpdGggb3RoZXIgbm9kZXNcbmZ1bmN0aW9uIG5vZGVzT3ZlcmxhcChvcHRzLCBub2RlLCBkaWZmLCByb290KSB7XG5cdGxldCBkZXNjZW5kYW50cyA9IG5vZGUuZGVzY2VuZGFudHMoKTtcblx0bGV0IGRlc2NlbmRhbnRzTmFtZXMgPSAkLm1hcChkZXNjZW5kYW50cywgZnVuY3Rpb24oZGVzY2VuZGFudCwgX2kpe3JldHVybiBkZXNjZW5kYW50LmRhdGEubmFtZTt9KTtcblx0bGV0IG5vZGVzID0gcm9vdC5kZXNjZW5kYW50cygpO1xuXHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKyl7XG5cdFx0bGV0IGRlc2NlbmRhbnQgPSBkZXNjZW5kYW50c1tpXTtcblx0XHRpZihub2RlLmRhdGEubmFtZSAhPT0gZGVzY2VuZGFudC5kYXRhLm5hbWUpe1xuXHRcdFx0bGV0IHhuZXcgPSBkZXNjZW5kYW50LnggLSBkaWZmO1xuXHRcdFx0aWYob3ZlcmxhcChvcHRzLCBub2RlcywgeG5ldywgZGVzY2VuZGFudC5kZXB0aCwgZGVzY2VuZGFudHNOYW1lcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8vIHRlc3QgaWYgeCBwb3NpdGlvbiBvdmVybGFwcyBhIG5vZGUgYXQgdGhlIHNhbWUgZGVwdGhcbmV4cG9ydCBmdW5jdGlvbiBvdmVybGFwKG9wdHMsIG5vZGVzLCB4bmV3LCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRmb3IobGV0IG49MDsgbjxub2Rlcy5sZW5ndGg7IG4rKykge1xuXHRcdGlmKGRlcHRoID09IG5vZGVzW25dLmRlcHRoICYmICQuaW5BcnJheShub2Rlc1tuXS5kYXRhLm5hbWUsIGV4Y2x1ZGVfbmFtZXMpID09IC0xKXtcblx0XHRcdGlmKE1hdGguYWJzKHhuZXcgLSBub2Rlc1tuXS54KSA8IChvcHRzLnN5bWJvbF9zaXplKjEuMTUpKVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vLyBnaXZlbiBhIHBlcnNvbnMgbmFtZSByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgZDMgdHJlZSBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUJ5TmFtZShub2RlcywgbmFtZSkge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYobm9kZXNbaV0uZGF0YSAmJiBuYW1lID09PSBub2Rlc1tpXS5kYXRhLm5hbWUpXG5cdFx0XHRyZXR1cm4gbm9kZXNbaV07XG5cdFx0ZWxzZSBpZiAobmFtZSA9PT0gbm9kZXNbaV0ubmFtZSlcblx0XHRcdHJldHVybiBub2Rlc1tpXTtcblx0fVxufVxuXG4vLyBnaXZlbiB0aGUgbmFtZSBvZiBhIHVybCBwYXJhbSBnZXQgdGhlIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gdXJsUGFyYW0obmFtZSl7XG5cdGxldCByZXN1bHRzID0gbmV3IFJlZ0V4cCgnWz8mXScgKyBuYW1lICsgJz0oW14mI10qKScpLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRpZiAocmVzdWx0cz09PW51bGwpXG5cdCAgIHJldHVybiBudWxsO1xuXHRlbHNlXG5cdCAgIHJldHVybiByZXN1bHRzWzFdIHx8IDA7XG59XG5cbi8vIGdldCBncmFuZHBhcmVudHMgaW5kZXhcbmV4cG9ydCBmdW5jdGlvbiBnZXRfZ3JhbmRwYXJlbnRzX2lkeChkYXRhc2V0LCBtaWR4LCBmaWR4KSB7XG5cdGxldCBnbWlkeCA9IG1pZHg7XG5cdGxldCBnZmlkeCA9IGZpZHg7XG5cdHdoaWxlKCAgJ21vdGhlcicgaW4gZGF0YXNldFtnbWlkeF0gJiYgJ21vdGhlcicgaW4gZGF0YXNldFtnZmlkeF0gJiZcblx0XHQgICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnbWlkeF0pICYmICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnZmlkeF0pKXtcblx0XHRnbWlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2dtaWR4XS5tb3RoZXIpO1xuXHRcdGdmaWR4ID0gZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbZ2ZpZHhdLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHsnbWlkeCc6IGdtaWR4LCAnZmlkeCc6IGdmaWR4fTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBwcm9iYW5kIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSB0aGUgcHJvYmFuZC5cbi8vICdrZXknIGNhbiBiZSBhIGxpc3Qgb2Yga2V5cyBvciBhIHNpbmdsZSBrZXkuXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hdHRyKG9wdHMsIGtleXMsIHZhbHVlKXtcblx0bGV0IHByb2JhbmQgPSBvcHRzLmRhdGFzZXRbIGdldFByb2JhbmRJbmRleChvcHRzLmRhdGFzZXQpIF07XG5cdG5vZGVfYXR0cihvcHRzLCBwcm9iYW5kLm5hbWUsIGtleXMsIHZhbHVlKTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBub2RlIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQuXG4vLyAna2V5JyBjYW4gYmUgYSBsaXN0IG9mIGtleXMgb3IgYSBzaW5nbGUga2V5LlxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVfYXR0cihvcHRzLCBuYW1lLCBrZXlzLCB2YWx1ZSl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUobmV3ZGF0YXNldCwgbmFtZSk7XG5cdGlmKCFub2RlKXtcblx0XHRjb25zb2xlLndhcm4oXCJObyBwZXJzb24gZGVmaW5lZFwiKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZighJC5pc0FycmF5KGtleXMpKSB7XG5cdFx0a2V5cyA9IFtrZXlzXTtcblx0fVxuXG5cdGlmKHZhbHVlKSB7XG5cdFx0Zm9yKGxldCBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGsgPSBrZXlzW2ldO1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnVkFMVUUgUFJPVklERUQnLCBrLCB2YWx1ZSwgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlICYmIGtleXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdGlmKG5vZGVba10gPT09IHZhbHVlKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0ICAgaWYoSlNPTi5zdHJpbmdpZnkobm9kZVtrXSkgPT09IEpTT04uc3RyaW5naWZ5KHZhbHVlKSlcblx0XHRcdFx0XHQgICByZXR1cm47XG5cdFx0XHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRcdFx0Ly8gY29udGludWUgcmVnYXJkbGVzcyBvZiBlcnJvclxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRub2RlW2tdID0gdmFsdWU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBmb3VuZCA9IGZhbHNlO1xuXHRcdGZvcihsZXQgaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBrID0ga2V5c1tpXTtcblx0XHRcdC8vY29uc29sZS5sb2coJ05PIFZBTFVFIFBST1ZJREVEJywgaywgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlKSB7XG5cdFx0XHRcdGRlbGV0ZSBub2RlW2tdO1xuXHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCFmb3VuZClcblx0XHRcdHJldHVybjtcblx0fVxuXHRzeW5jVHdpbnMobmV3ZGF0YXNldCwgbm9kZSk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbi8vIGFkZCBhIGNoaWxkIHRvIHRoZSBwcm9iYW5kOyBnaXZlYiBzZXgsIGFnZSwgeW9iIGFuZCBicmVhc3RmZWVkaW5nIG1vbnRocyAob3B0aW9uYWwpXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hZGRfY2hpbGQob3B0cywgc2V4LCBhZ2UsIHlvYiwgYnJlYXN0ZmVlZGluZyl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgcHJvYmFuZCA9IG5ld2RhdGFzZXRbIGdldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KSBdO1xuXHRpZighcHJvYmFuZCl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gcHJvYmFuZCBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgbmV3Y2hpbGQgPSBhZGRjaGlsZChuZXdkYXRhc2V0LCBwcm9iYW5kLCBzZXgsIDEpWzBdO1xuXHRuZXdjaGlsZC5hZ2UgPSBhZ2U7XG5cdG5ld2NoaWxkLnlvYiA9IHlvYjtcblx0aWYoYnJlYXN0ZmVlZGluZyAhPT0gdW5kZWZpbmVkKVxuXHRcdG5ld2NoaWxkLmJyZWFzdGZlZWRpbmcgPSBicmVhc3RmZWVkaW5nO1xuXHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRyZWJ1aWxkKG9wdHMpO1xuXHRyZXR1cm4gbmV3Y2hpbGQubmFtZTtcbn1cblxuLy8gZGVsZXRlIG5vZGUgdXNpbmcgdGhlIG5hbWVcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVfbm9kZV9ieV9uYW1lKG9wdHMsIG5hbWUpe1xuXHRmdW5jdGlvbiBvbkRvbmUob3B0cywgZGF0YXNldCkge1xuXHRcdC8vIGFzc2lnbiBuZXcgZGF0YXNldCBhbmQgcmVidWlsZCBwZWRpZ3JlZVxuXHRcdG9wdHMuZGF0YXNldCA9IGRhdGFzZXQ7XG5cdFx0cmVidWlsZChvcHRzKTtcblx0fVxuXHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZS5jdXJyZW50KG9wdHMpKTtcblx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlLmN1cnJlbnQob3B0cyksIG5hbWUpO1xuXHRpZighbm9kZSl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gbm9kZSBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRkZWxldGVfbm9kZV9kYXRhc2V0KG5ld2RhdGFzZXQsIG5vZGUsIG9wdHMsIG9uRG9uZSk7XG59XG5cbi8vIGNoZWNrIGJ5IG5hbWUgaWYgdGhlIGluZGl2aWR1YWwgZXhpc3RzXG5leHBvcnQgZnVuY3Rpb24gZXhpc3RzKG9wdHMsIG5hbWUpe1xuXHRyZXR1cm4gZ2V0Tm9kZUJ5TmFtZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBuYW1lKSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBwcmludCBvcHRpb25zIGFuZCBkYXRhc2V0XG5leHBvcnQgZnVuY3Rpb24gcHJpbnRfb3B0cyhvcHRzKXtcblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLnJlbW92ZSgpO1xuXHQkKFwiYm9keVwiKS5hcHBlbmQoXCI8ZGl2IGlkPSdwZWRpZ3JlZV9kYXRhJz48L2Rpdj5cIiApO1xuXHRsZXQga2V5O1xuXHRmb3IobGV0IGk9MDsgaTxvcHRzLmRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGVyc29uID0gXCI8ZGl2IGNsYXNzPSdyb3cnPjxzdHJvbmcgY2xhc3M9J2NvbC1tZC0xIHRleHQtcmlnaHQnPlwiK29wdHMuZGF0YXNldFtpXS5uYW1lK1wiPC9zdHJvbmc+PGRpdiBjbGFzcz0nY29sLW1kLTExJz5cIjtcblx0XHRmb3Ioa2V5IGluIG9wdHMuZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoa2V5ID09PSAnbmFtZScpIGNvbnRpbnVlO1xuXHRcdFx0aWYoa2V5ID09PSAncGFyZW50Jylcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHRlbHNlIGlmIChrZXkgPT09ICdjaGlsZHJlbicpIHtcblx0XHRcdFx0aWYgKG9wdHMuZGF0YXNldFtpXVtrZXldWzBdICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XVswXS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHR9IGVsc2Vcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XStcIjsgPC9zcGFuPlwiO1xuXHRcdH1cblx0XHQkKFwiI3BlZGlncmVlX2RhdGFcIikuYXBwZW5kKHBlcnNvbiArIFwiPC9kaXY+PC9kaXY+XCIpO1xuXG5cdH1cblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLmFwcGVuZChcIjxiciAvPjxiciAvPlwiKTtcblx0Zm9yKGtleSBpbiBvcHRzKSB7XG5cdFx0aWYoa2V5ID09PSAnZGF0YXNldCcpIGNvbnRpbnVlO1xuXHRcdCQoXCIjcGVkaWdyZWVfZGF0YVwiKS5hcHBlbmQoXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHNba2V5XStcIjsgPC9zcGFuPlwiKTtcblx0fVxufVxuIiwiLy8gdW5kbywgcmVkbywgcmVzZXQgYnV0dG9uc1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge3JlYnVpbGQsIGJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Y29weV9kYXRhc2V0LCBnZXRQcm9iYW5kSW5kZXh9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdGlvbnMpIHtcblx0bGV0IG9wdHMgPSAkLmV4dGVuZCh7XG4gICAgICAgIC8vIGRlZmF1bHRzXG5cdFx0YnRuX3RhcmdldDogJ3BlZGlncmVlX2hpc3RvcnknXG4gICAgfSwgb3B0aW9ucyApO1xuXG5cdGxldCBidG5zID0gW3tcImZhXCI6IFwiZmEtdW5kb1wiLCBcInRpdGxlXCI6IFwidW5kb1wifSxcblx0XHRcdFx0e1wiZmFcIjogXCJmYS1yZXBlYXRcIiwgXCJ0aXRsZVwiOiBcInJlZG9cIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtcmVmcmVzaFwiLCBcInRpdGxlXCI6IFwicmVzZXRcIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtYXJyb3dzLWFsdFwiLCBcInRpdGxlXCI6IFwiZnVsbHNjcmVlblwifV07XG5cdGxldCBsaXMgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxidG5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGlzICs9ICc8bGlcIj4nO1xuXHRcdGxpcyArPSAnJm5ic3A7PGkgY2xhc3M9XCJmYSBmYS1sZyAnICsgYnRuc1tpXS5mYSArICdcIiAnICtcblx0XHQgICAgICAgICAgICAgICAoYnRuc1tpXS5mYSA9PSBcImZhLWFycm93cy1hbHRcIiA/ICdpZD1cImZ1bGxzY3JlZW5cIiAnIDogJycpICtcblx0XHQgICAgICAgICAgICAgICAnIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRpdGxlPVwiJysgYnRuc1tpXS50aXRsZSArJ1wiPjwvaT4nO1xuXHRcdGxpcyArPSAnPC9saT4nO1xuXHR9XG5cdCQoIFwiI1wiK29wdHMuYnRuX3RhcmdldCApLmFwcGVuZChsaXMpO1xuXHRjbGljayhvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzX2Z1bGxzY3JlZW4oKXtcblx0cmV0dXJuIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrKG9wdHMpIHtcblx0Ly8gZnVsbHNjcmVlblxuICAgICQoZG9jdW1lbnQpLm9uKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlIG1vemZ1bGxzY3JlZW5jaGFuZ2UgZnVsbHNjcmVlbmNoYW5nZSBNU0Z1bGxzY3JlZW5DaGFuZ2UnLCBmdW5jdGlvbihfZSkgIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0aWYgKGxvY2FsX2RhdGFzZXQgIT09IHVuZGVmaW5lZCAmJiBsb2NhbF9kYXRhc2V0ICE9PSBudWxsKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBsb2NhbF9kYXRhc2V0O1xuXHRcdH1cblx0XHRyZWJ1aWxkKG9wdHMpO1xuICAgIH0pO1xuXG5cdCQoJyNmdWxsc2NyZWVuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oX2UpIHtcblx0XHRpZiAoIWRvY3VtZW50Lm1vekZ1bGxTY3JlZW4gJiYgIWRvY3VtZW50LndlYmtpdEZ1bGxTY3JlZW4pIHtcblx0XHRcdGxldCB0YXJnZXQgPSAkKFwiI1wiK29wdHMudGFyZ2V0RGl2KVswXTtcblx0XHRcdGlmKHRhcmdldC5tb3pSZXF1ZXN0RnVsbFNjcmVlbilcblx0XHRcdFx0dGFyZ2V0Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRhcmdldC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbihFbGVtZW50LkFMTE9XX0tFWUJPQVJEX0lOUFVUKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbilcblx0XHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuKCk7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyB1bmRvL3JlZG8vcmVzZXRcblx0JCggXCIjXCIrb3B0cy5idG5fdGFyZ2V0ICkub24oIFwiY2xpY2tcIiwgZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0aWYoJChlLnRhcmdldCkuaGFzQ2xhc3MoXCJkaXNhYmxlZFwiKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdGlmKCQoZS50YXJnZXQpLmhhc0NsYXNzKCdmYS11bmRvJykpIHtcblx0XHRcdG9wdHMuZGF0YXNldCA9IHBlZGNhY2hlLnByZXZpb3VzKG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlcGVhdCcpKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBwZWRjYWNoZS5uZXh0KG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlZnJlc2gnKSkge1xuXHRcdFx0JCgnPGRpdiBpZD1cIm1zZ0RpYWxvZ1wiPlJlc2V0dGluZyB0aGUgcGVkaWdyZWUgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIHNvbWUgZGF0YS48L2Rpdj4nKS5kaWFsb2coe1xuXHRcdFx0XHR0aXRsZTogJ0NvbmZpcm0gUmVzZXQnLFxuXHRcdFx0XHRyZXNpemFibGU6IGZhbHNlLFxuXHRcdFx0XHRoZWlnaHQ6IFwiYXV0b1wiLFxuXHRcdFx0XHR3aWR0aDogNDAwLFxuXHRcdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdFx0YnV0dG9uczoge1xuXHRcdFx0XHRcdENvbnRpbnVlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHJlc2V0KG9wdHMsIG9wdHMua2VlcF9wcm9iYW5kX29uX3Jlc2V0KTtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCBcImNsb3NlXCIgKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdENhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZyggXCJjbG9zZVwiICk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pO1xuXHR9KTtcbn1cblxuLy8gcmVzZXQgcGVkaWdyZWUgYW5kIGNsZWFyIHRoZSBoaXN0b3J5XG5leHBvcnQgZnVuY3Rpb24gcmVzZXQob3B0cywga2VlcF9wcm9iYW5kKSB7XG5cdGxldCBwcm9iYW5kO1xuXHRpZihrZWVwX3Byb2JhbmQpIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0bGV0IG5ld2RhdGFzZXQgPSAgY29weV9kYXRhc2V0KGxvY2FsX2RhdGFzZXQpO1xuXHRcdHByb2JhbmQgPSBuZXdkYXRhc2V0W2dldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KV07XG5cdFx0Ly9sZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlsLmdldENoaWxkcmVuKG5ld2RhdGFzZXQsIHByb2JhbmQpO1xuXHRcdHByb2JhbmQubmFtZSA9IFwiY2gxXCI7XG5cdFx0cHJvYmFuZC5tb3RoZXIgPSBcImYyMVwiO1xuXHRcdHByb2JhbmQuZmF0aGVyID0gXCJtMjFcIjtcblx0XHQvLyBjbGVhciBwZWRpZ3JlZSBkYXRhIGJ1dCBrZWVwIHByb2JhbmQgZGF0YSBhbmQgcmlzayBmYWN0b3JzXG5cdFx0cGVkY2FjaGUuY2xlYXJfcGVkaWdyZWVfZGF0YShvcHRzKVxuXHR9IGVsc2Uge1xuXHRcdHByb2JhbmQgPSB7XG5cdFx0XHRcIm5hbWVcIjpcImNoMVwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInByb2JhbmRcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1lXCJcblx0XHR9O1xuXHRcdHBlZGNhY2hlLmNsZWFyKG9wdHMpOyAvLyBjbGVhciBhbGwgc3RvcmFnZSBkYXRhXG5cdH1cblxuXHRkZWxldGUgb3B0cy5kYXRhc2V0O1xuXG5cdGxldCBzZWxlY3RlZCA9ICQoXCJpbnB1dFtuYW1lPSdkZWZhdWx0X2ZhbSddOmNoZWNrZWRcIik7XG5cdGlmKHNlbGVjdGVkLmxlbmd0aCA+IDAgJiYgc2VsZWN0ZWQudmFsKCkgPT0gJ2V4dGVuZGVkMicpIHsgICAgLy8gc2Vjb25kYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIndaQVwiLFwic2V4XCI6XCJNXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGdyYW5kZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUFrXCIsXCJzZXhcIjpcIkZcIixcInRvcF9sZXZlbFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgZ3JhbmRtb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ6d0JcIixcInNleFwiOlwiTVwiLFwidG9wX2xldmVsXCI6dHJ1ZSxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJtYXRlcm5hbCBncmFuZGZhdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImRPSFwiLFwic2V4XCI6XCJGXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGdyYW5kbW90aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUtnXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiTUFrXCIsXCJmYXRoZXJcIjpcIndaQVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGF1bnRcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4c21cIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgdW5jbGVcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJtMjFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiZE9IXCIsXCJmYXRoZXJcIjpcInp3QlwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImFPSFwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJzaXN0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJWaGFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiYnJvdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIlNwalwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcIm5vcGFyZW50c1wiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGFydG5lclwifSxcblx0XHRcdHByb2JhbmQsXG5cdFx0XHR7XCJuYW1lXCI6XCJ6aGtcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJjaDFcIixcImZhdGhlclwiOlwiU3BqXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZGF1Z2h0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJLbnhcIixcImRpc3BsYXlfbmFtZVwiOlwic29uXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwidXVjXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGF1bnRcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4SXdcIixcImRpc3BsYXlfbmFtZVwiOlwibWF0ZXJuYWwgdW5jbGVcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn1dO1xuXHR9IGVsc2UgaWYoc2VsZWN0ZWQubGVuZ3RoID4gMCAmJiBzZWxlY3RlZC52YWwoKSA9PSAnZXh0ZW5kZWQxJykgeyAgICAvLyBwcmltYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIm0yMVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpudWxsLFwiZmF0aGVyXCI6bnVsbCxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJmYXRoZXJcIixcIm5vcGFyZW50c1wiOnRydWV9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOm51bGwsXCJmYXRoZXJcIjpudWxsLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwiLFwibm9wYXJlbnRzXCI6dHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6XCJhT0hcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwic2lzdGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiVmhhXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImJyb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJTcGpcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJub3BhcmVudHNcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhcnRuZXJcIn0sXG5cdFx0XHRwcm9iYW5kLFxuXHRcdFx0e1wibmFtZVwiOlwiemhrXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImRhdWdodGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiS254XCIsXCJkaXNwbGF5X25hbWVcIjpcInNvblwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImNoMVwiLFwiZmF0aGVyXCI6XCJTcGpcIixcInN0YXR1c1wiOlwiMFwifV07XG5cdH0gZWxzZSB7XG5cdFx0b3B0cy5kYXRhc2V0ID0gW1xuXHRcdFx0e1wibmFtZVwiOiBcIm0yMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcImZhdGhlclwiLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6IFwiZjIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibW90aGVyXCIsIFwic2V4XCI6IFwiRlwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdHByb2JhbmRdO1xuXHR9XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVCdXR0b25zKG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBwZWRjYWNoZS5nZXRfY291bnQob3B0cyk7XG5cdGxldCBuc3RvcmUgPSBwZWRjYWNoZS5uc3RvcmUob3B0cyk7XG5cdGxldCBpZCA9IFwiI1wiK29wdHMuYnRuX3RhcmdldDtcblx0aWYobnN0b3JlIDw9IGN1cnJlbnQpXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRlbHNlXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG5cdGlmKGN1cnJlbnQgPiAxKVxuXHRcdCQoaWQrXCIgLmZhLXVuZG9cIikucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdGVsc2Vcblx0XHQkKGlkK1wiIC5mYS11bmRvXCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xufVxuIiwiaW1wb3J0ICogYXMgcGVkaWdyZWVfdXRpbCBmcm9tICcuL3BlZGlncmVlX3V0aWxzLmpzJztcbmltcG9ydCB7Z2VuZXRpY190ZXN0LCBwYXRob2xvZ3lfdGVzdHMsIGNhbmNlcnN9IGZyb20gJy4vaW8uanMnO1xuXG4vLyBzYXZlIHJpc2sgZmFjdG9yIHRvIHN0b3JhZ2VcbmxldCBSSVNLX0ZBQ1RPUl9TVE9SRSA9IG5ldyBPYmplY3QoKTtcbmV4cG9ydCBmdW5jdGlvbiBzaG93X3Jpc2tfZmFjdG9yX3N0b3JlKCkge1xuXHRjb25zb2xlLmxvZyhcIlJJU0tfRkFDVE9SX1NUT1JFOjpcIik7XG5cdCQuZWFjaChSSVNLX0ZBQ1RPUl9TVE9SRSwgZnVuY3Rpb24obmFtZSwgdmFsKXtcblx0XHRjb25zb2xlLmxvZyhuYW1lICsgXCIgOiBcIiArIHZhbCk7XG5cdH0pO1xufVxuXG4vLyByZXR1cm4gYSBub24tYW5vbmltaXNlZCBwZWRpZ3JlZSBmb3JtYXRcbmV4cG9ydCBmdW5jdGlvbiBnZXRfbm9uX2Fub25fcGVkaWdyZWUoZGF0YXNldCwgbWV0YSkge1xuXHRyZXR1cm4gZ2V0X3BlZGlncmVlKGRhdGFzZXQsIHVuZGVmaW5lZCwgbWV0YSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIEdldCBDYW5SaXNrIGZvcm1hdGVkIHBlZGlncmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BlZGlncmVlKGRhdGFzZXQsIGZhbWlkLCBtZXRhLCBpc2Fub24pIHtcblx0bGV0IG1zZyA9IFwiIyNDYW5SaXNrIDEuMFwiO1xuXHRpZighZmFtaWQpIHtcblx0XHRmYW1pZCA9IFwiWFhYWFwiO1xuXHR9XG5cdGlmKG1ldGEpIHtcblx0XHRtc2cgKz0gbWV0YTtcblx0fVxuXHRpZih0eXBlb2YgaXNhbm9uID09PSAndW5kZWZpbmVkJykge1xuXHRcdGlzYW5vbiA9IHRydWU7XG5cdH1cblx0Ly8gYXJyYXkgb2YgaW5kaXZpZHVhbHMgZXhjbHVkZWQgZnJvbSB0aGUgY2FsY3VsYXRpb25cblx0bGV0IGV4Y2wgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7cmV0dXJuICdleGNsdWRlJyBpbiBwICYmIHAuZXhjbHVkZSA/IHAubmFtZSA6IG51bGw7fSk7XG5cblx0Ly8gZmVtYWxlIHJpc2sgZmFjdG9yc1xuXHRsZXQgcHJvYmFuZElkeCAgPSBwZWRpZ3JlZV91dGlsLmdldFByb2JhbmRJbmRleChkYXRhc2V0KTtcblx0bGV0IHNleCA9ICdGJztcblx0aWYocHJvYmFuZElkeCkge1xuXHRcdHNleCA9IGRhdGFzZXRbcHJvYmFuZElkeF0uc2V4O1xuXHR9XG5cblx0aWYoc2V4ICE9PSAnTScpIHtcblx0XHRsZXQgbWVuYXJjaGUgICAgPSBnZXRfcmlza19mYWN0b3IoJ21lbmFyY2hlX2FnZScpO1xuXHRcdGxldCBwYXJpdHkgICAgICA9IGdldF9yaXNrX2ZhY3RvcigncGFyaXR5Jyk7XG5cdFx0bGV0IGZpcnN0X2JpcnRoID0gZ2V0X3Jpc2tfZmFjdG9yKCdhZ2Vfb2ZfZmlyc3RfbGl2ZV9iaXJ0aCcpO1xuXHRcdGxldCBvY191c2UgICAgICA9IGdldF9yaXNrX2ZhY3Rvcignb3JhbF9jb250cmFjZXB0aW9uJyk7XG5cdFx0bGV0IG1odF91c2UgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdtaHQnKTtcblx0XHRsZXQgYm1pICAgICAgICAgPSBnZXRfcmlza19mYWN0b3IoJ2JtaScpO1xuXHRcdGxldCBhbGNvaG9sICAgICA9IGdldF9yaXNrX2ZhY3RvcignYWxjb2hvbF9pbnRha2UnKTtcblx0XHRsZXQgbWVub3BhdXNlICAgPSBnZXRfcmlza19mYWN0b3IoJ2FnZV9vZl9tZW5vcGF1c2UnKTtcblx0XHRsZXQgbWRlbnNpdHkgICAgPSBnZXRfcmlza19mYWN0b3IoJ21hbW1vZ3JhcGhpY19kZW5zaXR5Jyk7XG5cdFx0bGV0IGhndCAgICAgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdoZWlnaHQnKTtcblx0XHRsZXQgdGwgICAgICAgICAgPSBnZXRfcmlza19mYWN0b3IoJ0FnZV9UdWJhbF9saWdhdGlvbicpO1xuXHRcdGxldCBlbmRvICAgICAgICA9IGdldF9yaXNrX2ZhY3RvcignZW5kb21ldHJpb3NpcycpO1xuXG5cdFx0aWYobWVuYXJjaGUgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjbWVuYXJjaGU9XCIrbWVuYXJjaGU7XG5cdFx0aWYocGFyaXR5ICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI3Bhcml0eT1cIitwYXJpdHk7XG5cdFx0aWYoZmlyc3RfYmlydGggIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjZmlyc3RfbGl2ZV9iaXJ0aD1cIitmaXJzdF9iaXJ0aDtcblx0XHRpZihvY191c2UgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjb2NfdXNlPVwiK29jX3VzZTtcblx0XHRpZihtaHRfdXNlICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI21odF91c2U9XCIrbWh0X3VzZTtcblx0XHRpZihibWkgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjQk1JPVwiK2JtaTtcblx0XHRpZihhbGNvaG9sICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI2FsY29ob2w9XCIrYWxjb2hvbDtcblx0XHRpZihtZW5vcGF1c2UgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjbWVub3BhdXNlPVwiK21lbm9wYXVzZTtcblx0XHRpZihtZGVuc2l0eSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNiaXJhZHM9XCIrbWRlbnNpdHk7XG5cdFx0aWYoaGd0ICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI2hlaWdodD1cIitoZ3Q7XG5cdFx0aWYodGwgIT09IHVuZGVmaW5lZClcblx0XHRcdGlmKHRsICE9PSBcIm5cIiAmJiB0bCAhPT0gXCJOXCIpXG5cdFx0XHRcdG1zZyArPSBcIlxcbiMjVEw9WVwiO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRtc2cgKz0gXCJcXG4jI1RMPU5cIjtcblxuXHRcdGlmKGVuZG8gIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjZW5kbz1cIitlbmRvO1xuXHR9XG5cdG1zZyArPSBcIlxcbiMjRmFtSURcXHROYW1lXFx0VGFyZ2V0XFx0SW5kaXZJRFxcdEZhdGhJRFxcdE1vdGhJRFxcdFNleFxcdE1adHdpblxcdERlYWRcXHRBZ2VcXHRZb2JcXHRCQzFcXHRCQzJcXHRPQ1xcdFBST1xcdFBBTlxcdEFzaGtuXFx0QlJDQTFcXHRCUkNBMlxcdFBBTEIyXFx0QVRNXFx0Q0hFSzJcXHRSQUQ1MURcXHRSQUQ1MUNcXHRCUklQMVxcdEVSOlBSOkhFUjI6Q0sxNDpDSzU2XCI7XG5cblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBwID0gZGF0YXNldFtpXTtcblx0XHRpZigkLmluQXJyYXkocC5uYW1lLCBleGNsKSAhPSAtMSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ0VYQ0xVREU6ICcrcC5uYW1lKTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdG1zZyArPSAnXFxuJytmYW1pZCsnXFx0JztcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBtYXggMTMgY2hhcnNcblx0XHRpZihpc2Fub24pXG5cdFx0XHRtc2cgKz0gaSsnXFx0JztcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIGRpc3BsYXlfbmFtZSAoQU5PTklNSVNFKSBtYXggOCBjaGFyc1xuXHRcdGVsc2Vcblx0XHRcdG1zZyArPSAocC5kaXNwbGF5X25hbWUgPyBwLmRpc3BsYXlfbmFtZSA6IFwiTkFcIikrJ1xcdCc7XG5cdFx0bXNnICs9ICgncHJvYmFuZCcgaW4gcCA/ICcxJyA6IDApKydcXHQnO1xuXHRcdG1zZyArPSBwLm5hbWUrJ1xcdCc7XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBtYXggNyBjaGFyc1xuXHRcdG1zZyArPSAoJ2ZhdGhlcicgaW4gcCAmJiAhKCdub3BhcmVudHMnIGluIHApICYmICgkLmluQXJyYXkocC5tb3RoZXIsIGV4Y2wpID09IC0xKT8gcC5mYXRoZXIgOiAwKSsnXFx0JztcdC8vIG1heCA3IGNoYXJzXG5cdFx0bXNnICs9ICgnbW90aGVyJyBpbiBwICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgKCQuaW5BcnJheShwLm1vdGhlciwgZXhjbCkgPT0gLTEpPyBwLm1vdGhlciA6IDApKydcXHQnO1x0Ly8gbWF4IDcgY2hhcnNcblx0XHRtc2cgKz0gcC5zZXgrJ1xcdCc7XG5cdFx0bXNnICs9ICgnbXp0d2luJyBpbiBwID8gcC5tenR3aW4gOiAwKSsnXFx0JzsgXHRcdFx0XHRcdFx0Ly8gTVp0d2luXG5cdFx0bXNnICs9ICgnc3RhdHVzJyBpbiBwID8gcC5zdGF0dXMgOiAwKSsnXFx0JztcdFx0XHRcdFx0XHRcdC8vIGN1cnJlbnQgc3RhdHVzOiAwID0gYWxpdmUsIDEgPSBkZWFkXG5cdFx0bXNnICs9ICgnYWdlJyBpbiBwID8gcC5hZ2UgOiAwKSsnXFx0JztcdFx0XHRcdFx0XHRcdFx0Ly8gQWdlIGF0IGxhc3QgZm9sbG93IHVwIG9yIDAgPSB1bnNwZWNpZmllZFxuXHRcdG1zZyArPSAoJ3lvYicgaW4gcCA/IHAueW9iIDogMCkrJ1xcdCc7XHRcdFx0XHRcdFx0XHRcdC8vIFlPQiBvciAwID0gdW5zcGVjaWZpZWRcblxuXHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdC8vIEFnZSBhdCAxc3QgY2FuY2VyIG9yIDAgPSB1bmFmZmVjdGVkLCBBVSA9IHVua25vd24gYWdlIGF0IGRpYWdub3NpcyAoYWZmZWN0ZWQgdW5rbm93bilcblx0XHRcdGlmKGRpYWdub3Npc19hZ2UgaW4gcClcblx0XHRcdFx0bXNnICs9IChkaWFnbm9zaXNfYWdlIGluIHAgPyBwW2RpYWdub3Npc19hZ2VdIDogJ0FVJykrJ1xcdCc7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdG1zZyArPSAnMFxcdCc7XG5cdFx0fSk7XG5cblx0XHQvLyBBc2hrZW5hemkgc3RhdHVzLCAwID0gbm90IEFzaGtlbmF6aSwgMSA9IEFzaGtlbmF6aVxuXHRcdG1zZyArPSAoJ2FzaGtlbmF6aScgaW4gcCA/IHAuYXNoa2VuYXppIDogMCkrJ1xcdCc7XG5cblx0XHRmb3IobGV0IGo9MDsgajxnZW5ldGljX3Rlc3QubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmKGdlbmV0aWNfdGVzdFtqXSsnX2dlbmVfdGVzdCcgaW4gcCAmJlxuXHRcdFx0ICAgcFtnZW5ldGljX3Rlc3Rbal0rJ19nZW5lX3Rlc3QnXVsndHlwZSddICE9PSAnLScgJiZcblx0XHRcdCAgIHBbZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0J11bJ3Jlc3VsdCddICE9PSAnLScpIHtcblx0XHRcdFx0bXNnICs9IHBbZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0J11bJ3R5cGUnXSArICc6Jztcblx0XHRcdFx0bXNnICs9IHBbZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0J11bJ3Jlc3VsdCddICsgJ1xcdCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cgKz0gJzA6MFxcdCc7XHRcdC8vIGdlbmV0aWMgdGVzdCB0eXBlLCAwPXVudGVzdGVkLCBTPW11dGF0aW9uIHNlYXJjaCwgVD1kaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBnZW5ldGljIHRlc3QgcmVzdWx0LCAwPXVudGVzdGVkLCBQPXBvc2l0aXZlLCBOPW5lZ2F0aXZlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yKGxldCBqPTA7IGo8cGF0aG9sb2d5X3Rlc3RzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHQvLyBzdGF0dXMsIDAgPSB1bnNwZWNpZmllZCwgTiA9IG5lZ2F0aXZlLCBQID0gcG9zaXRpdmVcblx0XHRcdGlmKHBhdGhvbG9neV90ZXN0c1tqXSsnX2JjX3BhdGhvbG9neScgaW4gcCkge1xuXHRcdFx0XHRtc2cgKz0gcFtwYXRob2xvZ3lfdGVzdHNbal0rJ19iY19wYXRob2xvZ3knXTtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3BhdGhvbG9neSAnK3BbcGF0aG9sb2d5X3Rlc3RzW2pdKydfYmNfcGF0aG9sb2d5J10rJyBmb3IgJytwLmRpc3BsYXlfbmFtZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cgKz0gJzAnO1xuXHRcdFx0fVxuXHRcdFx0aWYoajwocGF0aG9sb2d5X3Rlc3RzLmxlbmd0aC0xKSlcblx0XHRcdFx0bXNnICs9IFwiOlwiO1xuXHRcdH1cblx0fVxuXG5cdGNvbnNvbGUubG9nKG1zZywgUklTS19GQUNUT1JfU1RPUkUpO1xuXHRyZXR1cm4gbXNnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9yaXNrX2ZhY3RvcihyaXNrX2ZhY3Rvcl9uYW1lLCB2YWwpIHtcblx0UklTS19GQUNUT1JfU1RPUkVbc3RvcmVfbmFtZShyaXNrX2ZhY3Rvcl9uYW1lKV0gPSB2YWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfcmlza19mYWN0b3Iocmlza19mYWN0b3JfbmFtZSkge1xuXHRsZXQga2V5ID0gc3RvcmVfbmFtZShyaXNrX2ZhY3Rvcl9uYW1lKTtcblx0aWYoa2V5IGluIFJJU0tfRkFDVE9SX1NUT1JFKSB7XG5cdFx0cmV0dXJuIFJJU0tfRkFDVE9SX1NUT1JFW2tleV07XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLy8gcmVtb3ZlIHJpc2sgZmFjdG9yIGZyb20gc3RvcmFnZVxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZV9yaXNrX2ZhY3RvcihyaXNrX2ZhY3Rvcl9uYW1lKSB7XG5cdGRlbGV0ZSBSSVNLX0ZBQ1RPUl9TVE9SRVtzdG9yZV9uYW1lKHJpc2tfZmFjdG9yX25hbWUpXTtcbn1cblxuLy8gcHJlZml4IHJpc2sgZmFjdG9yIG5hbWUgd2l0aCB0aGUgYXBwL3BhZ2UgbmFtZVxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlX25hbWUocmlza19mYWN0b3JfbmFtZSkge1xuXHRyZXR1cm4gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJykuZmlsdGVyKGZ1bmN0aW9uKGVsKXsgcmV0dXJuICEhZWw7IH0pLnBvcCgpICtcblx0ICAgICAgICc6OicgKyByaXNrX2ZhY3Rvcl9uYW1lO1xufVxuIiwiLy8gcGVkaWdyZWUgSS9PXG5pbXBvcnQgKiBhcyBwZWRpZ3JlZV91dGlsIGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge2dldF90cmVlX2RpbWVuc2lvbnMsIHZhbGlkYXRlX3BlZGlncmVlLCByZWJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Z2V0X25vbl9hbm9uX3BlZGlncmVlfSBmcm9tICcuL2NhbnJpc2tfZmlsZS5qcyc7XG5cbi8vIGNhbmNlcnMsIGdlbmV0aWMgJiBwYXRob2xvZ3kgdGVzdHNcbmV4cG9ydCBsZXQgY2FuY2VycyA9IHtcblx0XHQnYnJlYXN0X2NhbmNlcic6ICdicmVhc3RfY2FuY2VyX2RpYWdub3Npc19hZ2UnLFxuXHRcdCdicmVhc3RfY2FuY2VyMic6ICdicmVhc3RfY2FuY2VyMl9kaWFnbm9zaXNfYWdlJyxcblx0XHQnb3Zhcmlhbl9jYW5jZXInOiAnb3Zhcmlhbl9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J3Byb3N0YXRlX2NhbmNlcic6ICdwcm9zdGF0ZV9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J3BhbmNyZWF0aWNfY2FuY2VyJzogJ3BhbmNyZWF0aWNfY2FuY2VyX2RpYWdub3Npc19hZ2UnXG5cdH07XG5leHBvcnQgbGV0IGdlbmV0aWNfdGVzdCA9IFsnYnJjYTEnLCAnYnJjYTInLCAncGFsYjInLCAnYXRtJywgJ2NoZWsyJywgJ3JhZDUxZCcsXHQncmFkNTFjJywgJ2JyaXAxJ107XG5leHBvcnQgbGV0IHBhdGhvbG9neV90ZXN0cyA9IFsnZXInLCAncHInLCAnaGVyMicsICdjazE0JywgJ2NrNTYnXTtcblxuLy8gZ2V0IGJyZWFzdCBhbmQgb3ZhcmlhbiBQUlMgdmFsdWVzXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3Byc192YWx1ZXMoKSB7XG5cdGxldCBwcnMgPSB7fTtcblx0aWYoaGFzSW5wdXQoXCJicmVhc3RfcHJzX2FcIikgJiYgaGFzSW5wdXQoXCJicmVhc3RfcHJzX3pcIikpIHtcblx0XHRwcnNbJ2JyZWFzdF9jYW5jZXJfcHJzJ10gPSB7XG5cdFx0XHQnYWxwaGEnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX2EnKS52YWwoKSksXG5cdFx0XHQnenNjb3JlJzogcGFyc2VGbG9hdCgkKCcjYnJlYXN0X3Byc196JykudmFsKCkpLFxuXHRcdFx0J3BlcmNlbnQnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX3BlcmNlbnQnKS52YWwoKSlcblx0XHR9O1xuXHR9XG5cdGlmKGhhc0lucHV0KFwib3Zhcmlhbl9wcnNfYVwiKSAmJiBoYXNJbnB1dChcIm92YXJpYW5fcHJzX3pcIikpIHtcblx0XHRwcnNbJ292YXJpYW5fY2FuY2VyX3BycyddID0ge1xuXHRcdFx0J2FscGhhJzogcGFyc2VGbG9hdCgkKCcjb3Zhcmlhbl9wcnNfYScpLnZhbCgpKSxcblx0XHRcdCd6c2NvcmUnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc196JykudmFsKCkpLFxuXHRcdFx0J3BlcmNlbnQnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc19wZXJjZW50JykudmFsKCkpXG5cdFx0fTtcblx0fVxuXHRjb25zb2xlLmxvZyhwcnMpO1xuXHRyZXR1cm4gKGlzRW1wdHkocHJzKSA/IDAgOiBwcnMpO1xufVxuXG4vLyBjaGVjayBpZiBpbnB1dCBoYXMgYSB2YWx1ZVxuZXhwb3J0IGZ1bmN0aW9uIGhhc0lucHV0KGlkKSB7XG5cdHJldHVybiAkLnRyaW0oJCgnIycraWQpLnZhbCgpKS5sZW5ndGggIT09IDA7XG59XG5cbi8vIHJldHVybiB0cnVlIGlmIHRoZSBvYmplY3QgaXMgZW1wdHlcbmxldCBpc0VtcHR5ID0gZnVuY3Rpb24obXlPYmopIHtcblx0Zm9yKGxldCBrZXkgaW4gbXlPYmopIHtcblx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG15T2JqLCBrZXkpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3N1cmdpY2FsX29wcygpIHtcblx0bGV0IG1ldGEgPSBcIlwiO1xuXHRpZighJCgnI0E2XzRfM19jaGVjaycpLnBhcmVudCgpLmhhc0NsYXNzKFwib2ZmXCIpKSB7XG5cdFx0bWV0YSArPSBcIjtPVkFSWTI9eVwiO1xuXHR9XG5cdGlmKCEkKCcjQTZfNF83X2NoZWNrJykucGFyZW50KCkuaGFzQ2xhc3MoXCJvZmZcIikpIHtcblx0XHRtZXRhICs9IFwiO01BU1QyPXlcIjtcblx0fVxuXHRyZXR1cm4gbWV0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZChvcHRzKSB7XG5cdCQoJyNsb2FkJykuY2hhbmdlKGZ1bmN0aW9uKGUpIHtcblx0XHRsb2FkKGUsIG9wdHMpO1xuXHR9KTtcblxuXHQkKCcjc2F2ZScpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0c2F2ZShvcHRzKTtcblx0fSk7XG5cblx0JCgnI3NhdmVfY2FucmlzaycpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0bGV0IG1ldGEgPSBnZXRfc3VyZ2ljYWxfb3BzKCk7XG5cdFx0bGV0IHBycztcblx0XHR0cnkge1xuXHRcdFx0cHJzID0gZ2V0X3Byc192YWx1ZXMoKTtcblx0XHRcdGlmKHBycy5icmVhc3RfY2FuY2VyX3BycyAmJiBwcnMuYnJlYXN0X2NhbmNlcl9wcnMuYWxwaGEgIT09IDAgJiYgcHJzLmJyZWFzdF9jYW5jZXJfcHJzLnpzY29yZSAhPT0gMCkge1xuXHRcdFx0XHRtZXRhICs9IFwiXFxuIyNQUlNfQkM9YWxwaGE9XCIrcHJzLmJyZWFzdF9jYW5jZXJfcHJzLmFscGhhK1wiLHpzY29yZT1cIitwcnMuYnJlYXN0X2NhbmNlcl9wcnMuenNjb3JlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihwcnMub3Zhcmlhbl9jYW5jZXJfcHJzICYmIHBycy5vdmFyaWFuX2NhbmNlcl9wcnMuYWxwaGEgIT09IDAgJiYgcHJzLm92YXJpYW5fY2FuY2VyX3Bycy56c2NvcmUgIT09IDApIHtcblx0XHRcdFx0bWV0YSArPSBcIlxcbiMjUFJTX09DPWFscGhhPVwiK3Bycy5vdmFyaWFuX2NhbmNlcl9wcnMuYWxwaGErXCIsenNjb3JlPVwiK3Bycy5vdmFyaWFuX2NhbmNlcl9wcnMuenNjb3JlO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2goZXJyKSB7IGNvbnNvbGUud2FybihcIlBSU1wiLCBwcnMpOyB9XG5cdFx0c2F2ZV9jYW5yaXNrKG9wdHMsIG1ldGEpO1xuXHR9KTtcblxuXHQkKCcjcHJpbnQnKS5jbGljayhmdW5jdGlvbihfZSkge1xuXHRcdHByaW50KGdldF9wcmludGFibGVfc3ZnKG9wdHMpKTtcblx0fSk7XG5cblx0JCgnI3N2Z19kb3dubG9hZCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0c3ZnX2Rvd25sb2FkKGdldF9wcmludGFibGVfc3ZnKG9wdHMpKTtcblx0fSk7XG5cblx0JCgnI3BuZ19kb3dubG9hZCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0bGV0IGRlZmVycmVkID0gc3ZnMmltZygkKCdzdmcnKSwgXCJwZWRpZ3JlZVwiKTtcblx0XHQkLndoZW4uYXBwbHkoJCxbZGVmZXJyZWRdKS5kb25lKGZ1bmN0aW9uKCkge1xuXHRcdFx0bGV0IG9iaiA9IGdldEJ5TmFtZShhcmd1bWVudHMsIFwicGVkaWdyZWVcIik7XG5cdFx0XHRpZihwZWRpZ3JlZV91dGlsLmlzRWRnZSgpIHx8IHBlZGlncmVlX3V0aWwuaXNJRSgpKSB7XG5cdFx0XHRcdGxldCBodG1sPVwiPGltZyBzcmM9J1wiK29iai5pbWcrXCInIGFsdD0nY2FudmFzIGltYWdlJy8+XCI7XG5cdFx0XHRcdGxldCBuZXdUYWIgPSB3aW5kb3cub3BlbigpO1x0XHQvLyBwb3AtdXBzIG5lZWQgdG8gYmUgZW5hYmxlZFxuXHRcdFx0XHRuZXdUYWIuZG9jdW1lbnQud3JpdGUoaHRtbCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsZXQgYVx0ICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblx0XHRcdFx0YS5ocmVmXHQgPSBvYmouaW1nO1xuXHRcdFx0XHRhLmRvd25sb2FkID0gJ3Bsb3QucG5nJztcblx0XHRcdFx0YS50YXJnZXQgICA9ICdfYmxhbmsnO1xuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7IGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEdldCBvYmplY3QgZnJvbSBhcnJheSBieSB0aGUgbmFtZSBhdHRyaWJ1dGUuXG4gKi9cbmZ1bmN0aW9uIGdldEJ5TmFtZShhcnIsIG5hbWUpIHtcblx0cmV0dXJuICQuZ3JlcChhcnIsIGZ1bmN0aW9uKG8peyByZXR1cm4gbyAmJiBvLm5hbWUgPT0gbmFtZTsgfSlbMF07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBTVkcgZG9jdW1lbnQgZWxlbWVudCBjb252ZXJ0IHRvIGltYWdlIChlLmcuIGpwZWcsIHBuZyAtIGRlZmF1bHQgcG5nKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN2ZzJpbWcoc3ZnLCBkZWZlcnJlZF9uYW1lLCBvcHRpb25zKSB7XG5cdGxldCBkZWZhdWx0cyA9IHtpc2NhbnZnOiBmYWxzZSwgcmVzb2x1dGlvbjogMSwgaW1nX3R5cGU6IFwiaW1hZ2UvcG5nXCJ9O1xuXHRpZighb3B0aW9ucykgb3B0aW9ucyA9IGRlZmF1bHRzO1xuXHQkLmVhY2goZGVmYXVsdHMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0XHRpZighKGtleSBpbiBvcHRpb25zKSkge29wdGlvbnNba2V5XSA9IHZhbHVlO31cblx0fSk7XG5cblx0Ly8gc2V0IFNWRyBiYWNrZ3JvdW5kIHRvIHdoaXRlIC0gZml4IGZvciBqcGVnIGNyZWF0aW9uXG5cdGlmIChzdmcuZmluZChcIi5wZGYtd2hpdGUtYmdcIikubGVuZ3RoID09PSAwKXtcblx0XHRsZXQgZDNvYmogPSBkMy5zZWxlY3Qoc3ZnLmdldCgwKSk7XG5cdFx0ZDNvYmouYXBwZW5kKFwicmVjdFwiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBkZi13aGl0ZS1iZ1wiKVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwid2hpdGVcIik7XG5cdFx0ZDNvYmouc2VsZWN0KFwiLnBkZi13aGl0ZS1iZ1wiKS5sb3dlcigpO1xuXHR9XG5cblx0bGV0IGRlZmVycmVkID0gJC5EZWZlcnJlZCgpO1xuXHRsZXQgc3ZnU3RyO1xuXHRpZiAodHlwZW9mIHdpbmRvdy5YTUxTZXJpYWxpemVyICE9IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzdmdTdHIgPSAobmV3IFhNTFNlcmlhbGl6ZXIoKSkuc2VyaWFsaXplVG9TdHJpbmcoc3ZnLmdldCgwKSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIHN2Zy54bWwgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHN2Z1N0ciA9IHN2Zy5nZXQoMCkueG1sO1xuXHR9XG5cblx0bGV0IGltZ3NyYyA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCcrIGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN2Z1N0cikpKTsgLy8gY29udmVydCBTVkcgc3RyaW5nIHRvIGRhdGEgVVJMXG5cdGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXHRjYW52YXMud2lkdGggPSBzdmcud2lkdGgoKSpvcHRpb25zLnJlc29sdXRpb247XG5cdGNhbnZhcy5oZWlnaHQgPSBzdmcuaGVpZ2h0KCkqb3B0aW9ucy5yZXNvbHV0aW9uO1xuXHRsZXQgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cdGxldCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuXHRpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYocGVkaWdyZWVfdXRpbC5pc0lFKCkpIHtcblx0XHRcdC8vIGNoYW5nZSBmb250IHNvIGl0IGlzbid0IHRpbnlcblx0XHRcdHN2Z1N0ciA9IHN2Z1N0ci5yZXBsYWNlKC8gZm9udC1zaXplPVwiXFxkPy5cXGQqZW1cIi9nLCAnJyk7XG5cdFx0XHRzdmdTdHIgPSBzdmdTdHIucmVwbGFjZSgvPHRleHQgL2csICc8dGV4dCBmb250LXNpemU9XCIxMnB4XCIgJyk7XG5cdFx0XHRsZXQgdiA9IGNhbnZnLkNhbnZnLmZyb21TdHJpbmcoY29udGV4dCwgc3ZnU3RyLCB7XG5cdFx0XHRcdHNjYWxlV2lkdGg6IGNhbnZhcy53aWR0aCxcblx0XHRcdFx0c2NhbGVIZWlnaHQ6IGNhbnZhcy5oZWlnaHQsXG5cdFx0XHRcdGlnbm9yZURpbWVuc2lvbnM6IHRydWVcblx0XHRcdH0pO1xuXHRcdFx0di5zdGFydCgpO1xuXHRcdFx0Y29uc29sZS5sb2coZGVmZXJyZWRfbmFtZSwgb3B0aW9ucy5pbWdfdHlwZSwgXCJ1c2UgY2FudmcgdG8gY3JlYXRlIGltYWdlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHRjb25zb2xlLmxvZyhkZWZlcnJlZF9uYW1lLCBvcHRpb25zLmltZ190eXBlKTtcblx0XHR9XG5cdFx0ZGVmZXJyZWQucmVzb2x2ZSh7J25hbWUnOiBkZWZlcnJlZF9uYW1lLCAncmVzb2x1dGlvbic6IG9wdGlvbnMucmVzb2x1dGlvbiwgJ2ltZyc6Y2FudmFzLnRvRGF0YVVSTChvcHRpb25zLmltZ190eXBlLCAxKSwgJ3cnOmNhbnZhcy53aWR0aCwgJ2gnOmNhbnZhcy5oZWlnaHR9KTtcblx0fTtcblx0aW1nLnNyYyA9IGltZ3NyYztcblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbn1cblxuZnVuY3Rpb24gZ2V0TWF0Y2hlcyhzdHIsIG15UmVnZXhwKSB7XG5cdGxldCBtYXRjaGVzID0gW107XG5cdGxldCBtYXRjaDtcblx0bGV0IGMgPSAwO1xuXHRteVJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuXHR3aGlsZSAoKG1hdGNoID0gbXlSZWdleHAuZXhlYyhzdHIpKSkge1xuXHRcdGMrKztcblx0XHRpZihjID4gNDAwKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiZ2V0TWF0Y2hlczogY291bnRlciBleGNlZWRlZCA4MDBcIik7XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXHRcdG1hdGNoZXMucHVzaChtYXRjaCk7XG5cdFx0aWYgKG15UmVnZXhwLmxhc3RJbmRleCA9PT0gbWF0Y2guaW5kZXgpIHtcblx0XHRcdG15UmVnZXhwLmxhc3RJbmRleCsrO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbWF0Y2hlcztcbn1cblxuLy8gZmluZCBhbGwgdXJsJ3MgdG8gbWFrZSB1bmlxdWVcbmZ1bmN0aW9uIHVuaXF1ZV91cmxzKHN2Z19odG1sKSB7XG5cdGxldCBtYXRjaGVzID0gZ2V0TWF0Y2hlcyhzdmdfaHRtbCwgL3VybFxcKCgmcXVvdDt8XCJ8Jyl7MCwxfSMoLio/KSgmcXVvdDt8XCJ8Jyl7MCwxfVxcKS9nKTtcblx0aWYobWF0Y2hlcyA9PT0gLTEpXG5cdFx0cmV0dXJuIFwiRVJST1IgRElTUExBWUlORyBQRURJR1JFRVwiXG5cblx0JC5lYWNoKG1hdGNoZXMsIGZ1bmN0aW9uKGluZGV4LCBtYXRjaCkge1xuXHRcdGxldCBxdW90ZSA9IChtYXRjaFsxXSA/IG1hdGNoWzFdIDogXCJcIik7XG5cdFx0bGV0IHZhbCA9IG1hdGNoWzJdO1xuXHRcdGxldCBtMSA9IFwiaWQ9XFxcIlwiICsgdmFsICsgXCJcXFwiXCI7XG5cdFx0bGV0IG0yID0gXCJ1cmxcXFxcKFwiICsgcXVvdGUgKyBcIiNcIiArIHZhbCArIHF1b3RlICsgXCJcXFxcKVwiO1xuXG5cdFx0bGV0IG5ld3ZhbCA9IHZhbCtwZWRpZ3JlZV91dGlsLm1ha2VpZCgyKTtcblx0XHRzdmdfaHRtbCA9IHN2Z19odG1sLnJlcGxhY2UobmV3IFJlZ0V4cChtMSwgJ2cnKSwgXCJpZD1cXFwiXCIrbmV3dmFsK1wiXFxcIlwiICk7XG5cdFx0c3ZnX2h0bWwgPSBzdmdfaHRtbC5yZXBsYWNlKG5ldyBSZWdFeHAobTIsICdnJyksIFwidXJsKCNcIituZXd2YWwrXCIpXCIgKTtcbiAgIH0pO1xuXHRyZXR1cm4gc3ZnX2h0bWw7XG59XG5cbi8vIHJldHVybiBhIGNvcHkgcGVkaWdyZWUgc3ZnXG5leHBvcnQgZnVuY3Rpb24gY29weV9zdmcob3B0cykge1xuXHRsZXQgc3ZnX25vZGUgPSBnZXRfcHJpbnRhYmxlX3N2ZyhvcHRzKTtcblx0bGV0IGQzb2JqID0gZDMuc2VsZWN0KHN2Z19ub2RlLmdldCgwKSk7XG5cblx0Ly8gcmVtb3ZlIHVudXNlZCBlbGVtZW50c1xuXHRkM29iai5zZWxlY3RBbGwoXCIucG9wdXBfc2VsZWN0aW9uLCAuaW5kaV9yZWN0LCAuYWRkc2libGluZywgLmFkZHBhcnRuZXIsIC5hZGRjaGlsZCwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5saW5lX2RyYWdfc2VsZWN0aW9uXCIpLnJlbW92ZSgpO1xuXHRkM29iai5zZWxlY3RBbGwoXCJ0ZXh0XCIpXG5cdCAgLmZpbHRlcihmdW5jdGlvbigpe1xuXHRcdCByZXR1cm4gZDMuc2VsZWN0KHRoaXMpLnRleHQoKS5sZW5ndGggPT09IDBcblx0ICB9KS5yZW1vdmUoKTtcblx0cmV0dXJuICQodW5pcXVlX3VybHMoc3ZnX25vZGUuaHRtbCgpKSk7XG59XG5cbi8vIGdldCBwcmludGFibGUgc3ZnIGRpdiwgYWRqdXN0IHNpemUgdG8gdHJlZSBkaW1lbnNpb25zIGFuZCBzY2FsZSB0byBmaXRcbmV4cG9ydCBmdW5jdGlvbiBnZXRfcHJpbnRhYmxlX3N2ZyhvcHRzKSB7XG5cdGxldCBsb2NhbF9kYXRhc2V0ID0gcGVkY2FjaGUuY3VycmVudChvcHRzKTsgLy8gZ2V0IGN1cnJlbnQgZGF0YXNldFxuXHRpZiAobG9jYWxfZGF0YXNldCAhPT0gdW5kZWZpbmVkICYmIGxvY2FsX2RhdGFzZXQgIT09IG51bGwpIHtcblx0XHRvcHRzLmRhdGFzZXQgPSBsb2NhbF9kYXRhc2V0O1xuXHR9XG5cblx0bGV0IHRyZWVfZGltZW5zaW9ucyA9IGdldF90cmVlX2RpbWVuc2lvbnMob3B0cyk7XG5cdGxldCBzdmdfZGl2ID0gJCgnPGRpdj48L2Rpdj4nKTsgIFx0XHRcdFx0Ly8gY3JlYXRlIGEgbmV3IGRpdlxuXHRsZXQgc3ZnID0gJCgnIycrb3B0cy50YXJnZXREaXYpLmZpbmQoJ3N2ZycpLmNsb25lKCkuYXBwZW5kVG8oc3ZnX2Rpdik7XG5cdGlmKG9wdHMud2lkdGggPCB0cmVlX2RpbWVuc2lvbnMud2lkdGggfHwgb3B0cy5oZWlnaHQgPCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0IHx8XG5cdCAgIHRyZWVfZGltZW5zaW9ucy53aWR0aCA+IDU5NSB8fCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSB7XG5cdFx0bGV0IHdpZCA9IHRyZWVfZGltZW5zaW9ucy53aWR0aDtcblx0XHRsZXQgaGd0ID0gdHJlZV9kaW1lbnNpb25zLmhlaWdodCArIDEwMDtcblx0XHRsZXQgc2NhbGUgPSAxLjA7XG5cblx0XHRpZih0cmVlX2RpbWVuc2lvbnMud2lkdGggPiA1OTUgfHwgdHJlZV9kaW1lbnNpb25zLmhlaWdodCA+IDg0MikgeyAgIC8vIHNjYWxlIHRvIGZpdCBBNFxuXHRcdFx0aWYodHJlZV9kaW1lbnNpb25zLndpZHRoID4gNTk1KSAgd2lkID0gNTk1O1xuXHRcdFx0aWYodHJlZV9kaW1lbnNpb25zLmhlaWdodCA+IDg0MikgaGd0ID0gODQyO1xuXHRcdFx0bGV0IHhzY2FsZSA9IHdpZC90cmVlX2RpbWVuc2lvbnMud2lkdGg7XG5cdFx0XHRsZXQgeXNjYWxlID0gaGd0L3RyZWVfZGltZW5zaW9ucy5oZWlnaHQ7XG5cdFx0XHRzY2FsZSA9ICh4c2NhbGUgPCB5c2NhbGUgPyB4c2NhbGUgOiB5c2NhbGUpO1xuXHRcdH1cblxuXHRcdHN2Zy5hdHRyKCd3aWR0aCcsIHdpZCk7XHRcdC8vIGFkanVzdCBkaW1lbnNpb25zXG5cdFx0c3ZnLmF0dHIoJ2hlaWdodCcsIGhndCk7XG5cblx0XHRsZXQgeXRyYW5zZm9ybSA9ICgtb3B0cy5zeW1ib2xfc2l6ZSoxLjUqc2NhbGUpO1xuXHRcdHN2Zy5maW5kKFwiLmRpYWdyYW1cIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLCBcIit5dHJhbnNmb3JtK1wiKSBzY2FsZShcIitzY2FsZStcIilcIik7XG5cdH1cblx0cmV0dXJuIHN2Z19kaXY7XG59XG5cbi8vIGRvd25sb2FkIHRoZSBTVkcgdG8gYSBmaWxlXG5leHBvcnQgZnVuY3Rpb24gc3ZnX2Rvd25sb2FkKHN2Zyl7XG5cdGxldCBhXHQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRhLmhyZWZcdCA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCcrIGJ0b2EoIHVuZXNjYXBlKCBlbmNvZGVVUklDb21wb25lbnQoIHN2Zy5odG1sKCkgKSApICk7XG5cdGEuZG93bmxvYWQgPSAncGxvdC5zdmcnO1xuXHRhLnRhcmdldCAgID0gJ19ibGFuayc7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcbn1cblxuLy8gb3BlbiBwcmludCB3aW5kb3cgZm9yIGEgZ2l2ZW4gZWxlbWVudFxuZXhwb3J0IGZ1bmN0aW9uIHByaW50KGVsLCBpZCl7XG5cdGlmKGVsLmNvbnN0cnVjdG9yICE9PSBBcnJheSlcblx0XHRlbCA9IFtlbF07XG5cblx0bGV0IHdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkqMC45O1xuXHRsZXQgaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpLTEwO1xuXHRsZXQgY3NzRmlsZXMgPSBbXG5cdFx0Jy9zdGF0aWMvY3NzL2NhbnJpc2suY3NzJyxcblx0XHQnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9mb250LWF3ZXNvbWVANC43LjAvY3NzL2ZvbnQtYXdlc29tZS5taW4uY3NzJ1xuXHRdO1xuXHRsZXQgcHJpbnRXaW5kb3cgPSB3aW5kb3cub3BlbignJywgJ1ByaW50TWFwJywgJ3dpZHRoPScgKyB3aWR0aCArICcsaGVpZ2h0PScgKyBoZWlnaHQpO1xuXHRsZXQgaGVhZENvbnRlbnQgPSAnJztcblx0Zm9yKGxldCBpPTA7IGk8Y3NzRmlsZXMubGVuZ3RoOyBpKyspXG5cdFx0aGVhZENvbnRlbnQgKz0gJzxsaW5rIGhyZWY9XCInK2Nzc0ZpbGVzW2ldKydcIiByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgbWVkaWE9XCJhbGxcIj4nO1xuXHRoZWFkQ29udGVudCArPSBcIjxzdHlsZT5ib2R5IHtmb250LXNpemU6IFwiICsgJChcImJvZHlcIikuY3NzKCdmb250LXNpemUnKSArIFwiO308L3N0eWxlPlwiO1xuXG5cdGxldCBodG1sID0gXCJcIjtcblx0Zm9yKGxldCBpPTA7IGk8ZWwubGVuZ3RoOyBpKyspIHtcblx0XHRpZihpID09PSAwICYmIGlkKVxuXHRcdFx0aHRtbCArPSBpZDtcblx0XHRodG1sICs9ICQoZWxbaV0pLmh0bWwoKTtcblx0XHRpZihpIDwgZWwubGVuZ3RoLTEpXG5cdFx0XHRodG1sICs9ICc8ZGl2IGNsYXNzPVwicGFnZS1icmVha1wiPiA8L2Rpdj4nO1xuXHR9XG5cblx0cHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoaGVhZENvbnRlbnQpO1xuXHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShodG1sKTtcblx0cHJpbnRXaW5kb3cuZG9jdW1lbnQuY2xvc2UoKTtcblxuXHRwcmludFdpbmRvdy5mb2N1cygpO1xuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdHByaW50V2luZG93LnByaW50KCk7XG5cdFx0cHJpbnRXaW5kb3cuY2xvc2UoKTtcblx0fSwgMzAwKTtcbn1cblxuLy8gc2F2ZSBjb250ZW50IHRvIGEgZmlsZVxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfZmlsZShvcHRzLCBjb250ZW50LCBmaWxlbmFtZSwgdHlwZSl7XG5cdGlmKG9wdHMuREVCVUcpXG5cdFx0Y29uc29sZS5sb2coY29udGVudCk7XG5cdGlmKCFmaWxlbmFtZSkgZmlsZW5hbWUgPSBcInBlZC50eHRcIjtcblx0aWYoIXR5cGUpIHR5cGUgPSBcInRleHQvcGxhaW5cIjtcblxuICAgbGV0IGZpbGUgPSBuZXcgQmxvYihbY29udGVudF0sIHt0eXBlOiB0eXBlfSk7XG4gICBpZiAod2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSBcdC8vIElFMTArXG5cdCAgIHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihmaWxlLCBmaWxlbmFtZSk7XG4gICBlbHNlIHsgXHRcdFx0XHRcdFx0XHRcdFx0Ly8gb3RoZXIgYnJvd3NlcnNcblx0ICAgbGV0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblx0ICAgbGV0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG5cdCAgIGEuaHJlZiA9IHVybDtcblx0ICAgYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuXHQgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xuXHQgICBhLmNsaWNrKCk7XG5cdCAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0ICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcblx0XHQgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuXHRcdH0sIDApO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9wdHMpe1xuXHRsZXQgY29udGVudCA9IEpTT04uc3RyaW5naWZ5KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRzYXZlX2ZpbGUob3B0cywgY29udGVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlX2NhbnJpc2sob3B0cywgbWV0YSl7XG5cdHNhdmVfZmlsZShvcHRzLCBnZXRfbm9uX2Fub25fcGVkaWdyZWUocGVkY2FjaGUuY3VycmVudChvcHRzKSwgbWV0YSksIFwiY2Fucmlzay50eHRcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5yaXNrX3ZhbGlkYXRpb24ob3B0cykge1xuXHQkLmVhY2gob3B0cy5kYXRhc2V0LCBmdW5jdGlvbihpZHgsIHApIHtcblx0XHRpZighcC5oaWRkZW4gJiYgcC5zZXggPT09ICdNJyAmJiAhcGVkaWdyZWVfdXRpbC5pc1Byb2JhbmQocCkpIHtcblx0XHRcdGlmKHBbY2FuY2Vyc1snYnJlYXN0X2NhbmNlcjInXV0pIHtcblx0XHRcdFx0bGV0IG1zZyA9ICdNYWxlIGZhbWlseSBtZW1iZXIgKCcrcC5kaXNwbGF5X25hbWUrJykgd2l0aCBjb250cmFsYXRlcmFsIGJyZWFzdCBjYW5jZXIgZm91bmQuICcrXG5cdFx0XHRcdFx0XHQgICdQbGVhc2Ugbm90ZSB0aGF0IGFzIHRoZSByaXNrIG1vZGVscyBkbyBub3QgdGFrZSB0aGlzIGludG8gYWNjb3VudCB0aGUgc2Vjb25kICcrXG5cdFx0XHRcdFx0XHQgICdicmVhc3QgY2FuY2VyIGlzIGlnbm9yZWQuJ1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKG1zZyk7XG5cdFx0XHRcdGRlbGV0ZSBwW2NhbmNlcnNbJ2JyZWFzdF9jYW5jZXIyJ11dO1xuXHRcdFx0XHRwZWRpZ3JlZV91dGlsLm1lc3NhZ2VzKFwiV2FybmluZ1wiLCBtc2cpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkKGUsIG9wdHMpIHtcblx0bGV0IGYgPSBlLnRhcmdldC5maWxlc1swXTtcblx0aWYoZikge1xuXHRcdGxldCByaXNrX2ZhY3RvcnM7XG5cdFx0bGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRcdGNvbnNvbGUubG9nKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZihlLnRhcmdldC5yZXN1bHQuc3RhcnRzV2l0aChcIkJPQURJQ0VBIGltcG9ydCBwZWRpZ3JlZSBmaWxlIGZvcm1hdCA0LjBcIikpIHtcblx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSByZWFkQm9hZGljZWFWNChlLnRhcmdldC5yZXN1bHQsIDQpO1xuXHRcdFx0XHRcdGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKTtcblx0XHRcdFx0fSBlbHNlIGlmKGUudGFyZ2V0LnJlc3VsdC5zdGFydHNXaXRoKFwiQk9BRElDRUEgaW1wb3J0IHBlZGlncmVlIGZpbGUgZm9ybWF0IDIuMFwiKSkge1xuXHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRCb2FkaWNlYVY0KGUudGFyZ2V0LnJlc3VsdCwgMik7XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2UgaWYoZS50YXJnZXQucmVzdWx0LnN0YXJ0c1dpdGgoXCIjI1wiKSAmJiBlLnRhcmdldC5yZXN1bHQuaW5kZXhPZihcIkNhblJpc2tcIikgIT09IC0xKSB7XG5cdFx0XHRcdFx0bGV0IGNhbnJpc2tfZGF0YSA9IHJlYWRDYW5SaXNrVjEoZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdFx0XHRyaXNrX2ZhY3RvcnMgPSBjYW5yaXNrX2RhdGFbMF07XG5cdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gY2Fucmlza19kYXRhWzFdO1xuXHRcdFx0XHRcdGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gSlNPTi5wYXJzZShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdH0gY2F0Y2goZXJyKSB7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSByZWFkTGlua2FnZShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHR2YWxpZGF0ZV9wZWRpZ3JlZShvcHRzKTtcblx0XHRcdH0gY2F0Y2goZXJyMSkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycjEsIGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsICggZXJyMS5tZXNzYWdlID8gZXJyMS5tZXNzYWdlIDogZXJyMSkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmxvZyhvcHRzLmRhdGFzZXQpO1xuXHRcdFx0dHJ5e1xuXHRcdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdFx0XHRpZihyaXNrX2ZhY3RvcnMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHJpc2tfZmFjdG9ycyk7XG5cdFx0XHRcdFx0Ly8gbG9hZCByaXNrIGZhY3RvcnMgLSBmaXJlIHJpc2tmYWN0b3JDaGFuZ2UgZXZlbnRcblx0XHRcdFx0XHQkKGRvY3VtZW50KS50cmlnZ2VyKCdyaXNrZmFjdG9yQ2hhbmdlJywgW29wdHMsIHJpc2tfZmFjdG9yc10pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ2ZoQ2hhbmdlJywgW29wdHNdKTsgXHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQvLyB1cGRhdGUgRkggc2VjdGlvblxuXHRcdFx0XHRcdGFjY19GYW1IaXN0X3RpY2tlZCgpO1xuXHRcdFx0XHRcdGFjY19GYW1IaXN0X0xlYXZlKCk7XG5cdFx0XHRcdFx0UkVTVUxULkZMQUdfRkFNSUxZX01PREFMID0gdHJ1ZTtcblx0XHRcdFx0fSBjYXRjaChlcnIzKSB7XG5cdFx0XHRcdFx0Ly8gaWdub3JlIGVycm9yXG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2goZXJyMikge1xuXHRcdFx0XHRwZWRpZ3JlZV91dGlsLm1lc3NhZ2VzKFwiRmlsZSBFcnJvclwiLCAoIGVycjIubWVzc2FnZSA/IGVycjIubWVzc2FnZSA6IGVycjIpKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsIFwiRmlsZSBjb3VsZCBub3QgYmUgcmVhZCEgQ29kZSBcIiArIGV2ZW50LnRhcmdldC5lcnJvci5jb2RlKTtcblx0XHR9O1xuXHRcdHJlYWRlci5yZWFkQXNUZXh0KGYpO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnNvbGUuZXJyb3IoXCJGaWxlIGNvdWxkIG5vdCBiZSByZWFkIVwiKTtcblx0fVxuXHQkKFwiI2xvYWRcIilbMF0udmFsdWUgPSAnJzsgLy8gcmVzZXQgdmFsdWVcbn1cblxuLy9cbi8vIGh0dHBzOi8vd3d3LmNvZy1nZW5vbWljcy5vcmcvcGxpbmsvMS45L2Zvcm1hdHMjcGVkXG4vLyBodHRwczovL3d3dy5jb2ctZ2Vub21pY3Mub3JnL3BsaW5rLzEuOS9mb3JtYXRzI2ZhbVxuLy9cdDEuIEZhbWlseSBJRCAoJ0ZJRCcpXG4vL1x0Mi4gV2l0aGluLWZhbWlseSBJRCAoJ0lJRCc7IGNhbm5vdCBiZSAnMCcpXG4vL1x0My4gV2l0aGluLWZhbWlseSBJRCBvZiBmYXRoZXIgKCcwJyBpZiBmYXRoZXIgaXNuJ3QgaW4gZGF0YXNldClcbi8vXHQ0LiBXaXRoaW4tZmFtaWx5IElEIG9mIG1vdGhlciAoJzAnIGlmIG1vdGhlciBpc24ndCBpbiBkYXRhc2V0KVxuLy9cdDUuIFNleCBjb2RlICgnMScgPSBtYWxlLCAnMicgPSBmZW1hbGUsICcwJyA9IHVua25vd24pXG4vL1x0Ni4gUGhlbm90eXBlIHZhbHVlICgnMScgPSBjb250cm9sLCAnMicgPSBjYXNlLCAnLTknLycwJy9ub24tbnVtZXJpYyA9IG1pc3NpbmcgZGF0YSBpZiBjYXNlL2NvbnRyb2wpXG4vLyAgNy4gR2Vub3R5cGVzIChjb2x1bW4gNyBvbndhcmRzKTtcbi8vXHQgY29sdW1ucyA3ICYgOCBhcmUgYWxsZWxlIGNhbGxzIGZvciBmaXJzdCB2YXJpYW50ICgnMCcgPSBubyBjYWxsKTsgY29sdW1tbnMgOSAmIDEwIGFyZSBjYWxscyBmb3Igc2Vjb25kIHZhcmlhbnQgZXRjLlxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRMaW5rYWdlKGJvYWRpY2VhX2xpbmVzKSB7XG5cdGxldCBsaW5lcyA9IGJvYWRpY2VhX2xpbmVzLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG5cdGxldCBwZWQgPSBbXTtcblx0bGV0IGZhbWlkO1xuXHRmb3IobGV0IGkgPSAwO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0ICAgbGV0IGF0dHIgPSAkLm1hcChsaW5lc1tpXS50cmltKCkuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cdCAgIGlmKGF0dHIubGVuZ3RoIDwgNSlcblx0XHQgICB0aHJvdygndW5rbm93biBmb3JtYXQnKTtcblx0ICAgbGV0IHNleCA9IChhdHRyWzRdID09ICcxJyA/ICdNJyA6IChhdHRyWzRdID09ICcyJyA/ICdGJyA6ICdVJykpO1xuXHQgICBsZXQgaW5kaSA9IHtcblx0XHRcdCdmYW1pZCc6IGF0dHJbMF0sXG5cdFx0XHQnZGlzcGxheV9uYW1lJzogYXR0clsxXSxcblx0XHRcdCduYW1lJzpcdGF0dHJbMV0sXG5cdFx0XHQnc2V4Jzogc2V4XG5cdFx0fTtcblx0XHRpZihhdHRyWzJdICE9PSBcIjBcIikgaW5kaS5mYXRoZXIgPSBhdHRyWzJdO1xuXHRcdGlmKGF0dHJbM10gIT09IFwiMFwiKSBpbmRpLm1vdGhlciA9IGF0dHJbM107XG5cblx0XHRpZiAodHlwZW9mIGZhbWlkICE9ICd1bmRlZmluZWQnICYmIGZhbWlkICE9PSBpbmRpLmZhbWlkKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdtdWx0aXBsZSBmYW1pbHkgSURzIGZvdW5kIG9ubHkgdXNpbmcgZmFtaWQgPSAnK2ZhbWlkKTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRpZihhdHRyWzVdID09IFwiMlwiKSBpbmRpLmFmZmVjdGVkID0gMjtcblx0XHQvLyBhZGQgZ2Vub3R5cGUgY29sdW1uc1xuXHRcdGlmKGF0dHIubGVuZ3RoID4gNikge1xuXHRcdFx0aW5kaS5hbGxlbGVzID0gXCJcIjtcblx0XHRcdGZvcihsZXQgaj02OyBqPGF0dHIubGVuZ3RoOyBqKz0yKSB7XG5cdFx0XHRcdGluZGkuYWxsZWxlcyArPSBhdHRyW2pdICsgXCIvXCIgKyBhdHRyW2orMV0gKyBcIjtcIjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHRmYW1pZCA9IGF0dHJbMF07XG5cdH1cblx0cmV0dXJuIHByb2Nlc3NfcGVkKHBlZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQ2FuUmlza1YxKGJvYWRpY2VhX2xpbmVzKSB7XG5cdGxldCBsaW5lcyA9IGJvYWRpY2VhX2xpbmVzLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG5cdGxldCBwZWQgPSBbXTtcblx0bGV0IGhkciA9IFtdOyAgLy8gY29sbGVjdCByaXNrIGZhY3RvciBoZWFkZXIgbGluZXNcblx0Ly8gYXNzdW1lcyB0d28gbGluZSBoZWFkZXJcblx0Zm9yKGxldCBpID0gMDtpIDwgbGluZXMubGVuZ3RoO2krKyl7XG5cdFx0bGV0IGxuID0gbGluZXNbaV0udHJpbSgpO1xuXHRcdGlmKGxuLnN0YXJ0c1dpdGgoXCIjI1wiKSkge1xuXHRcdFx0aWYobG4uc3RhcnRzV2l0aChcIiMjQ2FuUmlza1wiKSAmJiBsbi5pbmRleE9mKFwiO1wiKSA+IC0xKSB7ICAgLy8gY29udGFpbnMgc3VyZ2ljYWwgb3AgZGF0YVxuXHRcdFx0XHRsZXQgb3BzID0gbG4uc3BsaXQoXCI7XCIpO1xuXHRcdFx0XHRmb3IobGV0IGo9MTsgajxvcHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRsZXQgb3BkYXRhID0gb3BzW2pdLnNwbGl0KFwiPVwiKTtcblx0XHRcdFx0XHRpZihvcGRhdGEubGVuZ3RoID09PSAyKSB7XG5cdFx0XHRcdFx0XHRoZHIucHVzaChvcHNbal0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYobG4uaW5kZXhPZihcIkNhblJpc2tcIikgPT09IC0xICYmICFsbi5zdGFydHNXaXRoKFwiIyNGYW1JRFwiKSkge1xuXHRcdFx0XHRoZHIucHVzaChsbi5yZXBsYWNlKFwiIyNcIiwgXCJcIikpO1xuXHRcdFx0fVxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0bGV0IGRlbGltID0gL1xcdC87XG5cdFx0aWYobG4uaW5kZXhPZignXFx0JykgPCAwKSB7XG5cdFx0XHRkZWxpbSA9IC9cXHMrLztcblx0XHRcdGNvbnNvbGUubG9nKFwiTk9UIFRBQiBERUxJTVwiKTtcblx0XHR9XG5cdFx0bGV0IGF0dHIgPSAkLm1hcChsbi5zcGxpdChkZWxpbSksIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwudHJpbSgpO30pO1xuXG5cdFx0aWYoYXR0ci5sZW5ndGggPiAxKSB7XG5cdFx0XHRsZXQgaW5kaSA9IHtcblx0XHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdFx0J2Rpc3BsYXlfbmFtZSc6IGF0dHJbMV0sXG5cdFx0XHRcdCduYW1lJzpcdGF0dHJbM10sXG5cdFx0XHRcdCdzZXgnOiBhdHRyWzZdLFxuXHRcdFx0XHQnc3RhdHVzJzogYXR0cls4XVxuXHRcdFx0fTtcblx0XHRcdGlmKGF0dHJbMl0gPT0gMSkgaW5kaS5wcm9iYW5kID0gdHJ1ZTtcblx0XHRcdGlmKGF0dHJbNF0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbNF07XG5cdFx0XHRpZihhdHRyWzVdICE9PSBcIjBcIikgaW5kaS5tb3RoZXIgPSBhdHRyWzVdO1xuXHRcdFx0aWYoYXR0cls3XSAhPT0gXCIwXCIpIGluZGkubXp0d2luID0gYXR0cls3XTtcblx0XHRcdGlmKGF0dHJbOV0gIT09IFwiMFwiKSBpbmRpLmFnZSA9IGF0dHJbOV07XG5cdFx0XHRpZihhdHRyWzEwXSAhPT0gXCIwXCIpIGluZGkueW9iID0gYXR0clsxMF07XG5cblx0XHRcdGxldCBpZHggPSAxMTtcblx0XHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdFx0Ly8gQWdlIGF0IDFzdCBjYW5jZXIgb3IgMCA9IHVuYWZmZWN0ZWQsIEFVID0gdW5rbm93biBhZ2UgYXQgZGlhZ25vc2lzIChhZmZlY3RlZCB1bmtub3duKVxuXHRcdFx0XHRpZihhdHRyW2lkeF0gIT09IFwiMFwiKSB7XG5cdFx0XHRcdFx0aW5kaVtkaWFnbm9zaXNfYWdlXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZHgrKztcblx0XHRcdH0pO1xuXG5cdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdC8vIEJSQ0ExLCBCUkNBMiwgUEFMQjIsIEFUTSwgQ0hFSzIsIC4uLi4gZ2VuZXRpYyB0ZXN0c1xuXHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHR5cGUsIDAgPSB1bnRlc3RlZCwgUyA9IG11dGF0aW9uIHNlYXJjaCwgVCA9IGRpcmVjdCBnZW5lIHRlc3Rcblx0XHRcdC8vIGdlbmV0aWMgdGVzdCByZXN1bHQsIDAgPSB1bnRlc3RlZCwgUCA9IHBvc2l0aXZlLCBOID0gbmVnYXRpdmVcblx0XHRcdGZvcihsZXQgaj0wOyBqPGdlbmV0aWNfdGVzdC5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRsZXQgZ2VuZV90ZXN0ID0gYXR0cltpZHhdLnNwbGl0KFwiOlwiKTtcblx0XHRcdFx0aWYoZ2VuZV90ZXN0WzBdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZigoZ2VuZV90ZXN0WzBdID09PSAnUycgfHwgZ2VuZV90ZXN0WzBdID09PSAnVCcpICYmIChnZW5lX3Rlc3RbMV0gPT09ICdQJyB8fCBnZW5lX3Rlc3RbMV0gPT09ICdOJykpXG5cdFx0XHRcdFx0XHRpbmRpW2dlbmV0aWNfdGVzdFtqXSArICdfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBnZW5lX3Rlc3RbMF0sICdyZXN1bHQnOiBnZW5lX3Rlc3RbMV19O1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignVU5SRUNPR05JU0VEIEdFTkUgVEVTVCBPTiBMSU5FICcrIChpKzEpICsgXCI6IFwiICsgZ2VuZV90ZXN0WzBdICsgXCIgXCIgKyBnZW5lX3Rlc3RbMV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fVxuXHRcdFx0Ly8gc3RhdHVzLCAwID0gdW5zcGVjaWZpZWQsIE4gPSBuZWdhdGl2ZSwgUCA9IHBvc2l0aXZlXG5cdFx0XHRsZXQgcGF0aF90ZXN0ID0gYXR0cltpZHhdLnNwbGl0KFwiOlwiKTtcblx0XHRcdGZvcihsZXQgaj0wOyBqPHBhdGhfdGVzdC5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZihwYXRoX3Rlc3Rbal0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKHBhdGhfdGVzdFtqXSA9PT0gJ04nIHx8IHBhdGhfdGVzdFtqXSA9PT0gJ1AnKVxuXHRcdFx0XHRcdFx0aW5kaVtwYXRob2xvZ3lfdGVzdHNbal0gKyAnX2JjX3BhdGhvbG9neSddID0gcGF0aF90ZXN0W2pdO1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignVU5SRUNPR05JU0VEIFBBVEhPTE9HWSBPTiBMSU5FICcrIChpKzEpICsgXCI6IFwiICtwYXRob2xvZ3lfdGVzdHNbal0gKyBcIiBcIiArcGF0aF90ZXN0W2pdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cGVkLnVuc2hpZnQoaW5kaSk7XG5cdFx0fVxuXHR9XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gW2hkciwgcHJvY2Vzc19wZWQocGVkKV07XG5cdH0gY2F0Y2goZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0cmV0dXJuIFtoZHIsIHBlZF07XG5cdH1cbn1cblxuLy8gcmVhZCBib2FkaWNlYSBmb3JtYXQgdjQgJiB2MlxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRCb2FkaWNlYVY0KGJvYWRpY2VhX2xpbmVzLCB2ZXJzaW9uKSB7XG5cdGxldCBsaW5lcyA9IGJvYWRpY2VhX2xpbmVzLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG5cdGxldCBwZWQgPSBbXTtcblx0Ly8gYXNzdW1lcyB0d28gbGluZSBoZWFkZXJcblx0Zm9yKGxldCBpID0gMjtpIDwgbGluZXMubGVuZ3RoO2krKyl7XG5cdCAgIGxldCBhdHRyID0gJC5tYXAobGluZXNbaV0udHJpbSgpLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwudHJpbSgpO30pO1xuXHRcdGlmKGF0dHIubGVuZ3RoID4gMSkge1xuXHRcdFx0bGV0IGluZGkgPSB7XG5cdFx0XHRcdCdmYW1pZCc6IGF0dHJbMF0sXG5cdFx0XHRcdCdkaXNwbGF5X25hbWUnOiBhdHRyWzFdLFxuXHRcdFx0XHQnbmFtZSc6XHRhdHRyWzNdLFxuXHRcdFx0XHQnc2V4JzogYXR0cls2XSxcblx0XHRcdFx0J3N0YXR1cyc6IGF0dHJbOF1cblx0XHRcdH07XG5cdFx0XHRpZihhdHRyWzJdID09IDEpIGluZGkucHJvYmFuZCA9IHRydWU7XG5cdFx0XHRpZihhdHRyWzRdICE9PSBcIjBcIikgaW5kaS5mYXRoZXIgPSBhdHRyWzRdO1xuXHRcdFx0aWYoYXR0cls1XSAhPT0gXCIwXCIpIGluZGkubW90aGVyID0gYXR0cls1XTtcblx0XHRcdGlmKGF0dHJbN10gIT09IFwiMFwiKSBpbmRpLm16dHdpbiA9IGF0dHJbN107XG5cdFx0XHRpZihhdHRyWzldICE9PSBcIjBcIikgaW5kaS5hZ2UgPSBhdHRyWzldO1xuXHRcdFx0aWYoYXR0clsxMF0gIT09IFwiMFwiKSBpbmRpLnlvYiA9IGF0dHJbMTBdO1xuXG5cdFx0XHRsZXQgaWR4ID0gMTE7XG5cdFx0XHQkLmVhY2goY2FuY2VycywgZnVuY3Rpb24oY2FuY2VyLCBkaWFnbm9zaXNfYWdlKSB7XG5cdFx0XHRcdC8vIEFnZSBhdCAxc3QgY2FuY2VyIG9yIDAgPSB1bmFmZmVjdGVkLCBBVSA9IHVua25vd24gYWdlIGF0IGRpYWdub3NpcyAoYWZmZWN0ZWQgdW5rbm93bilcblx0XHRcdFx0aWYoYXR0cltpZHhdICE9PSBcIjBcIikge1xuXHRcdFx0XHRcdGluZGlbZGlhZ25vc2lzX2FnZV0gPSBhdHRyW2lkeF07XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYodmVyc2lvbiA9PT0gNCkge1xuXHRcdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdFx0Ly8gQlJDQTEsIEJSQ0EyLCBQQUxCMiwgQVRNLCBDSEVLMiBnZW5ldGljIHRlc3RzXG5cdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCB0eXBlLCAwID0gdW50ZXN0ZWQsIFMgPSBtdXRhdGlvbiBzZWFyY2gsIFQgPSBkaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCByZXN1bHQsIDAgPSB1bnRlc3RlZCwgUCA9IHBvc2l0aXZlLCBOID0gbmVnYXRpdmVcblx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8NTsgaisrKSB7XG5cdFx0XHRcdFx0aWR4Kz0yO1xuXHRcdFx0XHRcdGlmKGF0dHJbaWR4LTJdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRcdGlmKChhdHRyW2lkeC0yXSA9PT0gJ1MnIHx8IGF0dHJbaWR4LTJdID09PSAnVCcpICYmIChhdHRyW2lkeC0xXSA9PT0gJ1AnIHx8IGF0dHJbaWR4LTFdID09PSAnTicpKVxuXHRcdFx0XHRcdFx0XHRpbmRpW2dlbmV0aWNfdGVzdFtqXSArICdfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6IGF0dHJbaWR4LTFdfTtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBhdHRyW2lkeC0yXSArIFwiIFwiICsgYXR0cltpZHgtMV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh2ZXJzaW9uID09PSAyKSB7XG5cdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCBCUkNBMSwgQlJDQTJcblx0XHRcdFx0Ly8gdHlwZSwgMCA9IHVudGVzdGVkLCBTID0gbXV0YXRpb24gc2VhcmNoLCBUID0gZGlyZWN0IGdlbmUgdGVzdFxuXHRcdFx0XHQvLyByZXN1bHQsIDAgPSB1bnRlc3RlZCwgTiA9IG5vIG11dGF0aW9uLCAxID0gQlJDQTEgcG9zaXRpdmUsIDIgPSBCUkNBMiBwb3NpdGl2ZSwgMyA9IEJSQ0ExLzIgcG9zaXRpdmVcblx0XHRcdFx0aWR4Kz0yOyBcdC8vIGd0ZXN0XG5cdFx0XHRcdGlmKGF0dHJbaWR4LTJdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZigoYXR0cltpZHgtMl0gPT09ICdTJyB8fCBhdHRyW2lkeC0yXSA9PT0gJ1QnKSkge1xuXHRcdFx0XHRcdFx0aWYoYXR0cltpZHgtMV0gPT09ICdOJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdOJ307XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoYXR0cltpZHgtMV0gPT09ICcxJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdOJ307XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoYXR0cltpZHgtMV0gPT09ICcyJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdQJ307XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoYXR0cltpZHgtMV0gPT09ICczJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdQJ307XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignVU5SRUNPR05JU0VEIEdFTkUgVEVTVCBPTiBMSU5FICcrIChpKzEpICsgXCI6IFwiICsgYXR0cltpZHgtMl0gKyBcIiBcIiArIGF0dHJbaWR4LTFdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoYXR0cltpZHgrK10gIT09IFwiMFwiKSBpbmRpLmFzaGtlbmF6aSA9IDE7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHN0YXR1cywgMCA9IHVuc3BlY2lmaWVkLCBOID0gbmVnYXRpdmUsIFAgPSBwb3NpdGl2ZVxuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cGF0aG9sb2d5X3Rlc3RzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKGF0dHJbaWR4XSAhPT0gJzAnKSB7XG5cdFx0XHRcdFx0aWYoYXR0cltpZHhdID09PSAnTicgfHwgYXR0cltpZHhdID09PSAnUCcpXG5cdFx0XHRcdFx0XHRpbmRpW3BhdGhvbG9neV90ZXN0c1tqXSArICdfYmNfcGF0aG9sb2d5J10gPSBhdHRyW2lkeF07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgUEFUSE9MT0dZIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgK3BhdGhvbG9neV90ZXN0c1tqXSArIFwiIFwiICthdHRyW2lkeF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fVxuXHRcdFx0cGVkLnVuc2hpZnQoaW5kaSk7XG5cdFx0fVxuXHR9XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gcHJvY2Vzc19wZWQocGVkKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRyZXR1cm4gcGVkO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NfcGVkKHBlZCkge1xuXHQvLyBmaW5kIHRoZSBsZXZlbCBvZiBpbmRpdmlkdWFscyBpbiB0aGUgcGVkaWdyZWVcblx0Zm9yKGxldCBqPTA7ajwyO2orKykge1xuXHRcdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRcdGdldExldmVsKHBlZCwgcGVkW2ldLm5hbWUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGZpbmQgdGhlIG1heCBsZXZlbCAoaS5lLiB0b3BfbGV2ZWwpXG5cdGxldCBtYXhfbGV2ZWwgPSAwO1xuXHRmb3IobGV0IGk9MDtpPHBlZC5sZW5ndGg7aSsrKSB7XG5cdFx0aWYocGVkW2ldLmxldmVsICYmIHBlZFtpXS5sZXZlbCA+IG1heF9sZXZlbClcblx0XHRcdG1heF9sZXZlbCA9IHBlZFtpXS5sZXZlbDtcblx0fVxuXG5cdC8vIGlkZW50aWZ5IHRvcF9sZXZlbCBhbmQgb3RoZXIgbm9kZXMgd2l0aG91dCBwYXJlbnRzXG5cdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRpZ3JlZV91dGlsLmdldERlcHRoKHBlZCwgcGVkW2ldLm5hbWUpID09IDEpIHtcblx0XHRcdGlmKHBlZFtpXS5sZXZlbCAmJiBwZWRbaV0ubGV2ZWwgPT0gbWF4X2xldmVsKSB7XG5cdFx0XHRcdHBlZFtpXS50b3BfbGV2ZWwgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGVkW2ldLm5vcGFyZW50cyA9IHRydWU7XG5cblx0XHRcdFx0Ly8gMS4gbG9vayBmb3IgcGFydG5lcnMgcGFyZW50c1xuXHRcdFx0XHRsZXQgcGlkeCA9IGdldFBhcnRuZXJJZHgocGVkLCBwZWRbaV0pO1xuXHRcdFx0XHRpZihwaWR4ID4gLTEpIHtcblx0XHRcdFx0XHRpZihwZWRbcGlkeF0ubW90aGVyKSB7XG5cdFx0XHRcdFx0XHRwZWRbaV0ubW90aGVyID0gcGVkW3BpZHhdLm1vdGhlcjtcblx0XHRcdFx0XHRcdHBlZFtpXS5mYXRoZXIgPSBwZWRbcGlkeF0uZmF0aGVyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIDIuIG9yIGFkb3B0IHBhcmVudHMgZnJvbSBsZXZlbCBhYm92ZVxuXHRcdFx0XHRpZighcGVkW2ldLm1vdGhlcil7XG5cdFx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8cGVkLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRpZihwZWRbaV0ubGV2ZWwgPT0gKHBlZFtqXS5sZXZlbC0xKSkge1xuXHRcdFx0XHRcdFx0XHRwaWR4ID0gZ2V0UGFydG5lcklkeChwZWQsIHBlZFtqXSk7XG5cdFx0XHRcdFx0XHRcdGlmKHBpZHggPiAtMSkge1xuXHRcdFx0XHRcdFx0XHRcdHBlZFtpXS5tb3RoZXIgPSAocGVkW2pdLnNleCA9PT0gJ0YnID8gcGVkW2pdLm5hbWUgOiBwZWRbcGlkeF0ubmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0cGVkW2ldLmZhdGhlciA9IChwZWRbal0uc2V4ID09PSAnTScgPyBwZWRbal0ubmFtZSA6IHBlZFtwaWR4XS5uYW1lKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVkW2ldLnRvcF9sZXZlbDtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHBlZDtcbn1cblxuLy8gZ2V0IHRoZSBwYXJ0bmVycyBmb3IgYSBnaXZlbiBub2RlXG5mdW5jdGlvbiBnZXRQYXJ0bmVySWR4KGRhdGFzZXQsIGFub2RlKSB7XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgYm5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGFub2RlLm5hbWUgPT09IGJub2RlLm1vdGhlcilcblx0XHRcdHJldHVybiBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBibm9kZS5mYXRoZXIpO1xuXHRcdGVsc2UgaWYoYW5vZGUubmFtZSA9PT0gYm5vZGUuZmF0aGVyKVxuXHRcdFx0cmV0dXJuIHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGJub2RlLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIC0xO1xufVxuXG4vLyBmb3IgYSBnaXZlbiBpbmRpdmlkdWFsIGFzc2lnbiBsZXZlbHMgdG8gYSBwYXJlbnRzIGFuY2VzdG9yc1xuZnVuY3Rpb24gZ2V0TGV2ZWwoZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgaWR4ID0gcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbmFtZSk7XG5cdGxldCBsZXZlbCA9IChkYXRhc2V0W2lkeF0ubGV2ZWwgPyBkYXRhc2V0W2lkeF0ubGV2ZWwgOiAwKTtcblx0dXBkYXRlX3BhcmVudHNfbGV2ZWwoaWR4LCBsZXZlbCwgZGF0YXNldCk7XG59XG5cbi8vIHJlY3Vyc2l2ZWx5IHVwZGF0ZSBwYXJlbnRzIGxldmVsc1xuZnVuY3Rpb24gdXBkYXRlX3BhcmVudHNfbGV2ZWwoaWR4LCBsZXZlbCwgZGF0YXNldCkge1xuXHRsZXQgcGFyZW50cyA9IFsnbW90aGVyJywgJ2ZhdGhlciddO1xuXHRsZXZlbCsrO1xuXHRmb3IobGV0IGk9MDsgaTxwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IHBpZHggPSBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2lkeF1bcGFyZW50c1tpXV0pO1xuXHRcdGlmKHBpZHggPj0gMCkge1xuXHRcdFx0bGV0IG1hID0gZGF0YXNldFtwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2lkeF0ubW90aGVyKV07XG5cdFx0XHRsZXQgcGEgPSBkYXRhc2V0W3BlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XS5mYXRoZXIpXTtcblx0XHRcdGlmKCFkYXRhc2V0W3BpZHhdLmxldmVsIHx8IGRhdGFzZXRbcGlkeF0ubGV2ZWwgPCBsZXZlbCkge1xuXHRcdFx0XHRtYS5sZXZlbCA9IGxldmVsO1xuXHRcdFx0XHRwYS5sZXZlbCA9IGxldmVsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihtYS5sZXZlbCA8IHBhLmxldmVsKSB7XG5cdFx0XHRcdG1hLmxldmVsID0gcGEubGV2ZWw7XG5cdFx0XHR9IGVsc2UgaWYocGEubGV2ZWwgPCBtYS5sZXZlbCkge1xuXHRcdFx0XHRwYS5sZXZlbCA9IG1hLmxldmVsO1xuXHRcdFx0fVxuXHRcdFx0dXBkYXRlX3BhcmVudHNfbGV2ZWwocGlkeCwgbGV2ZWwsIGRhdGFzZXQpO1xuXHRcdH1cblx0fVxufVxuIiwiLy8gcGVkaWdyZWUgZm9ybVxuaW1wb3J0IHtyZWJ1aWxkLCBzeW5jVHdpbnN9IGZyb20gJy4vcGVkaWdyZWUuanMnO1xuaW1wb3J0IHtjb3B5X2RhdGFzZXQsIGdldE5vZGVCeU5hbWV9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0IHtjdXJyZW50IGFzIHBlZGNhY2hlX2N1cnJlbnR9IGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5cbi8vIGhhbmRsZSBmYW1pbHkgaGlzdG9yeSBjaGFuZ2UgZXZlbnRzICh1bmRvL3JlZG8vZGVsZXRlKVxuJChkb2N1bWVudCkub24oJ2ZoQ2hhbmdlJywgZnVuY3Rpb24oZSwgb3B0cyl7XG5cdHRyeSB7XG5cdFx0bGV0IGlkID0gJCgnI2lkX25hbWUnKS52YWwoKTsgIC8vIGdldCBuYW1lIGZyb20gaGlkZGVuIGZpZWxkXG5cdFx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlX2N1cnJlbnQob3B0cyksIGlkKVxuXHRcdGlmKG5vZGUgPT09IHVuZGVmaW5lZClcblx0XHRcdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcblx0XHRlbHNlXG5cdFx0XHQkKCdmb3JtID4gZmllbGRzZXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oZXJyKTtcblx0fVxufSlcblxuLy8gdXBkYXRlIHN0YXR1cyBmaWVsZCBhbmQgYWdlIGxhYmVsIC0gMCA9IGFsaXZlLCAxID0gZGVhZFxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhzdGF0dXMpIHtcblx0JCgnI2FnZV95b2JfbG9jaycpLnJlbW92ZUNsYXNzKCdmYS1sb2NrIGZhLXVubG9jay1hbHQnKTtcblx0KHN0YXR1cyA9PSAxID8gJCgnI2FnZV95b2JfbG9jaycpLmFkZENsYXNzKCdmYS11bmxvY2stYWx0JykgOiAkKCcjYWdlX3lvYl9sb2NrJykuYWRkQ2xhc3MoJ2ZhLWxvY2snKSk7XG5cdCQoJyNpZF9hZ2VfJytzdGF0dXMpLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuXHQkKCcjaWRfYWdlXycrKHN0YXR1cyA9PSAxID8gJzAnIDogJzEnKSkuYWRkQ2xhc3MoXCJoaWRkZW5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub2RlY2xpY2sobm9kZSkge1xuXHQkKCdmb3JtID4gZmllbGRzZXQnKS5wcm9wKCdkaXNhYmxlZCcsIGZhbHNlKTtcblx0Ly8gY2xlYXIgdmFsdWVzXG5cdCQoJyNwZXJzb25fZGV0YWlscycpLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLCBpbnB1dFt0eXBlPW51bWJlcl1cIikudmFsKFwiXCIpO1xuXHQkKCcjcGVyc29uX2RldGFpbHMgc2VsZWN0JykudmFsKCcnKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXG5cdC8vIGFzc2lnbiB2YWx1ZXMgdG8gaW5wdXQgZmllbGRzIGluIGZvcm1cblx0aWYobm9kZS5zZXggPT09ICdNJyB8fCBub2RlLnNleCA9PT0gJ0YnKVxuXHRcdCQoJ2lucHV0W25hbWU9c2V4XVt2YWx1ZT1cIicrbm9kZS5zZXgrJ1wiXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcblx0ZWxzZVxuXHRcdCQoJ2lucHV0W25hbWU9c2V4XScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdHVwZGF0ZV9jYW5jZXJfYnlfc2V4KG5vZGUpO1xuXG5cdGlmKCEoJ3N0YXR1cycgaW4gbm9kZSkpXG5cdFx0bm9kZS5zdGF0dXMgPSAwO1xuXHQkKCdpbnB1dFtuYW1lPXN0YXR1c11bdmFsdWU9XCInK25vZGUuc3RhdHVzKydcIl0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG5cdC8vIHNob3cgbG9jayBzeW1ib2wgZm9yIGFnZSBhbmQgeW9iIHN5bmNocm9uaXNhdGlvblxuXHR1cGRhdGVTdGF0dXMobm9kZS5zdGF0dXMpO1xuXG5cdGlmKCdwcm9iYW5kJyBpbiBub2RlKSB7XG5cdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKCdjaGVja2VkJywgbm9kZS5wcm9iYW5kKTtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcblx0fSBlbHNlIHtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdFx0JCgnI2lkX3Byb2JhbmQnKS5wcm9wKFwiZGlzYWJsZWRcIiwgISgneW9iJyBpbiBub2RlKSlcblx0fVxuXG5cdGlmKCdleGNsdWRlJyBpbiBub2RlKSB7XG5cdFx0JCgnI2lkX2V4Y2x1ZGUnKS5wcm9wKCdjaGVja2VkJywgbm9kZS5leGNsdWRlKTtcblx0fSBlbHNlIHtcblx0XHQkKCcjaWRfZXhjbHVkZScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG5cdH1cblxuLypcdFx0aWYoJ2FzaGtlbmF6aScgaW4gbm9kZSkge1xuXHRcdFx0JCgnI2lkX2FzaGtlbmF6aScpLnByb3AoJ2NoZWNrZWQnLCAobm9kZS5wcm9iYW5kID09IDEgPyB0cnVlOiBmYWxzZSkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkKCcjaWRfYXNoa2VuYXppJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHR9Ki9cblxuXHQvLyB5ZWFyIG9mIGJpcnRoXG5cdGlmKCd5b2InIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfeW9iXzAnKS52YWwobm9kZS55b2IpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF95b2JfMCcpLnZhbCgnLScpO1xuXHR9XG5cblx0Ly8gY2xlYXIgcGF0aG9sb2d5XG5cdCQoJ3NlbGVjdFtuYW1lJD1cIl9iY19wYXRob2xvZ3lcIl0nKS52YWwoJy0nKTtcblx0Ly8gY2xlYXIgZ2VuZSB0ZXN0c1xuXHQkKCdzZWxlY3RbbmFtZSo9XCJfZ2VuZV90ZXN0XCJdJykudmFsKCctJyk7XG5cblx0Ly8gZGlzYWJsZSBzZXggcmFkaW8gYnV0dG9ucyBpZiB0aGUgcGVyc29uIGhhcyBhIHBhcnRuZXJcblx0JChcImlucHV0W2lkXj0naWRfc2V4XyddXCIpLnByb3AoXCJkaXNhYmxlZFwiLCAobm9kZS5wYXJlbnRfbm9kZSAmJiBub2RlLnNleCAhPT0gJ1UnID8gdHJ1ZSA6IGZhbHNlKSk7XG5cblx0Ly8gZGlzYWJsZSBwYXRob2xvZ3kgZm9yIG1hbGUgcmVsYXRpdmVzIChhcyBub3QgdXNlZCBieSBtb2RlbClcblx0Ly8gYW5kIGlmIG5vIGJyZWFzdCBjYW5jZXIgYWdlIG9mIGRpYWdub3Npc1xuXHQkKFwic2VsZWN0W2lkJD0nX2JjX3BhdGhvbG9neSddXCIpLnByb3AoXCJkaXNhYmxlZFwiLFxuXHRcdFx0KG5vZGUuc2V4ID09PSAnTScgfHwgKG5vZGUuc2V4ID09PSAnRicgJiYgISgnYnJlYXN0X2NhbmNlcl9kaWFnbm9zaXNfYWdlJyBpbiBub2RlKSkgPyB0cnVlIDogZmFsc2UpKTtcblxuXHQvLyBhcHByb3hpbWF0ZSBkaWFnbm9zaXMgYWdlXG5cdCQoJyNpZF9hcHByb3gnKS5wcm9wKCdjaGVja2VkJywgKG5vZGUuYXBwcm94X2RpYWdub3Npc19hZ2UgPyB0cnVlOiBmYWxzZSkpO1xuXHR1cGRhdGVfZGlhZ25vc2lzX2FnZV93aWRnZXQoKTtcblxuXHRmb3IobGV0IGtleSBpbiBub2RlKSB7XG5cdFx0aWYoa2V5ICE9PSAncHJvYmFuZCcgJiYga2V5ICE9PSAnc2V4Jykge1xuXHRcdFx0aWYoJCgnI2lkXycra2V5KS5sZW5ndGgpIHtcdC8vIGlucHV0IHZhbHVlXG5cdFx0XHRcdGlmKGtleS5pbmRleE9mKCdfZ2VuZV90ZXN0JykgICE9PSAtMSAmJiBub2RlW2tleV0gIT09IG51bGwgJiYgdHlwZW9mIG5vZGVba2V5XSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkpLnZhbChub2RlW2tleV0udHlwZSk7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KydfcmVzdWx0JykudmFsKG5vZGVba2V5XS5yZXN1bHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSkudmFsKG5vZGVba2V5XSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZihrZXkuaW5kZXhPZignX2RpYWdub3Npc19hZ2UnKSAhPT0gLTEpIHtcblx0XHRcdFx0aWYoJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpIHtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkrJ18xJykudmFsKHJvdW5kNShub2RlW2tleV0pKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSsnXzAnKS52YWwobm9kZVtrZXldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRyeSB7XG5cdFx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZCgnZm9ybScpLnZhbGlkKCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0Y29uc29sZS53YXJuKCd2YWxpZCgpIG5vdCBmb3VuZCcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KSB7XG5cdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdGlmKCQoJyNvcmlnX2FzaGsnKS5pcygnOmNoZWNrZWQnKSkge1xuXHRcdCQuZWFjaChuZXdkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihwLnByb2JhbmQpXG5cdFx0XHRcdHAuYXNoa2VuYXppID0gMTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkLmVhY2gobmV3ZGF0YXNldCwgZnVuY3Rpb24oaSwgcCkge1xuXHRcdFx0ZGVsZXRlIHAuYXNoa2VuYXppO1xuXHRcdH0pO1xuXHR9XG59XG5cbi8vIFNhdmUgQXNoa2VuYXppIHN0YXR1c1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfYXNoa24ob3B0cykge1xuXHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHR1cGRhdGVfYXNoa24obmV3ZGF0YXNldCk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9wdHMpIHtcblx0bGV0IGRhdGFzZXQgPSBwZWRjYWNoZV9jdXJyZW50KG9wdHMpO1xuXHRsZXQgbmFtZSA9ICQoJyNpZF9uYW1lJykudmFsKCk7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHRsZXQgcGVyc29uID0gZ2V0Tm9kZUJ5TmFtZShuZXdkYXRhc2V0LCBuYW1lKTtcblx0aWYoIXBlcnNvbikge1xuXHRcdGNvbnNvbGUud2FybigncGVyc29uIG5vdCBmb3VuZCB3aGVuIHNhdmluZyBkZXRhaWxzJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdCQoXCIjXCIrb3B0cy50YXJnZXREaXYpLmVtcHR5KCk7XG5cblx0Ly8gaW5kaXZpZHVhbCdzIHBlcnNvbmFsIGFuZCBjbGluaWNhbCBkZXRhaWxzXG5cdGxldCB5b2IgPSAkKCcjaWRfeW9iXzAnKS52YWwoKTtcblx0aWYoeW9iICYmIHlvYiAhPT0gJycpIHtcblx0XHRwZXJzb24ueW9iID0geW9iO1xuXHR9IGVsc2Uge1xuXHRcdGRlbGV0ZSBwZXJzb24ueW9iO1xuXHR9XG5cblx0Ly8gY3VycmVudCBzdGF0dXM6IDAgPSBhbGl2ZSwgMSA9IGRlYWRcblx0bGV0IHN0YXR1cyA9ICQoJyNpZF9zdGF0dXMnKS5maW5kKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIpO1xuXHRpZihzdGF0dXMubGVuZ3RoID4gMCl7XG5cdFx0cGVyc29uLnN0YXR1cyA9IHN0YXR1cy52YWwoKTtcblx0fVxuXG5cdC8vIGJvb2xlYW5zIHN3aXRjaGVzXG5cdGxldCBzd2l0Y2hlcyA9IFtcIm1pc2NhcnJpYWdlXCIsIFwiYWRvcHRlZF9pblwiLCBcImFkb3B0ZWRfb3V0XCIsIFwidGVybWluYXRpb25cIiwgXCJzdGlsbGJpcnRoXCJdO1xuXHRmb3IobGV0IGlzd2l0Y2g9MDsgaXN3aXRjaDxzd2l0Y2hlcy5sZW5ndGg7IGlzd2l0Y2grKyl7XG5cdFx0bGV0IGF0dHIgPSBzd2l0Y2hlc1tpc3dpdGNoXTtcblx0XHRsZXQgcyA9ICQoJyNpZF8nK2F0dHIpO1xuXHRcdGlmKHMubGVuZ3RoID4gMCl7XG5cdFx0XHRjb25zb2xlLmxvZyhzLmlzKFwiOmNoZWNrZWRcIikpO1xuXHRcdFx0aWYocy5pcyhcIjpjaGVja2VkXCIpKVxuXHRcdFx0XHRwZXJzb25bYXR0cl0gPSB0cnVlO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkZWxldGUgcGVyc29uW2F0dHJdO1xuXHRcdH1cblx0fVxuXG5cdC8vIGN1cnJlbnQgc2V4XG5cdGxldCBzZXggPSAkKCcjaWRfc2V4JykuZmluZChcImlucHV0W3R5cGU9J3JhZGlvJ106Y2hlY2tlZFwiKTtcblx0aWYoc2V4Lmxlbmd0aCA+IDApe1xuXHRcdHBlcnNvbi5zZXggPSBzZXgudmFsKCk7XG5cdFx0dXBkYXRlX2NhbmNlcl9ieV9zZXgocGVyc29uKTtcblx0fVxuXG5cdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KTtcblxuXHRpZigkKCcjaWRfYXBwcm94JykuaXMoJzpjaGVja2VkJykpIC8vIGFwcHJveGltYXRlIGRpYWdub3NpcyBhZ2Vcblx0XHRwZXJzb24uYXBwcm94X2RpYWdub3Npc19hZ2UgPSB0cnVlO1xuXHRlbHNlXG5cdFx0ZGVsZXRlIHBlcnNvbi5hcHByb3hfZGlhZ25vc2lzX2FnZTtcblxuXHQkKFwiI3BlcnNvbl9kZXRhaWxzIHNlbGVjdFtuYW1lKj0nX2RpYWdub3Npc19hZ2UnXTp2aXNpYmxlLCAjcGVyc29uX2RldGFpbHMgaW5wdXRbdHlwZT10ZXh0XTp2aXNpYmxlLCAjcGVyc29uX2RldGFpbHMgaW5wdXRbdHlwZT1udW1iZXJdOnZpc2libGVcIikuZWFjaChmdW5jdGlvbigpIHtcblx0XHRsZXQgbmFtZSA9ICh0aGlzLm5hbWUuaW5kZXhPZihcIl9kaWFnbm9zaXNfYWdlXCIpPi0xID8gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpOiB0aGlzLm5hbWUpO1xuXG5cdFx0aWYoJCh0aGlzKS52YWwoKSkge1xuXHRcdFx0bGV0IHZhbCA9ICQodGhpcykudmFsKCk7XG5cdFx0XHRpZihuYW1lLmluZGV4T2YoXCJfZGlhZ25vc2lzX2FnZVwiKSA+IC0xICYmICQoXCIjaWRfYXBwcm94XCIpLmlzKCc6Y2hlY2tlZCcpKVxuXHRcdFx0XHR2YWwgPSByb3VuZDUodmFsKTtcblx0XHRcdHBlcnNvbltuYW1lXSA9IHZhbDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHBlcnNvbltuYW1lXTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGNhbmNlciBjaGVja2JveGVzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZSQ9XCJjYW5jZXJcIl0saW5wdXRbdHlwZT1cImNoZWNrYm94XCJdW25hbWUkPVwiY2FuY2VyMlwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5jaGVja2VkKVxuXHRcdFx0cGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXSA9IHRydWU7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV07XG5cdH0pO1xuXG5cdC8vIHBhdGhvbG9neSB0ZXN0c1xuXHQkKCcjcGVyc29uX2RldGFpbHMgc2VsZWN0W25hbWUkPVwiX2JjX3BhdGhvbG9neVwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG5cdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJy0nKSB7XG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0gJCh0aGlzKS52YWwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVsZXRlIHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV07XG5cdFx0fVxuXHR9KTtcblxuXHQvLyBnZW5ldGljIHRlc3RzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3RbbmFtZSQ9XCJfZ2VuZV90ZXN0XCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZigkKHRoaXMpLnZhbCgpICE9PSAnLScpIHtcblx0XHRcdGxldCB0cmVzID0gJCgnc2VsZWN0W25hbWU9XCInKyQodGhpcykuYXR0cignbmFtZScpKydfcmVzdWx0XCJdJyk7XG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0geyd0eXBlJzogJCh0aGlzKS52YWwoKSwgJ3Jlc3VsdCc6ICQodHJlcykudmFsKCl9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0XHR9XG5cdH0pO1xuXG5cdHRyeSB7XG5cdFx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZCgnZm9ybScpLnZhbGlkKCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0Y29uc29sZS53YXJuKCd2YWxpZCgpIG5vdCBmb3VuZCcpO1xuXHR9XG5cblx0c3luY1R3aW5zKG5ld2RhdGFzZXQsIHBlcnNvbik7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVfZGlhZ25vc2lzX2FnZV93aWRnZXQoKSB7XG5cdGlmKCQoXCIjaWRfYXBwcm94XCIpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzAnXVwiKS5lYWNoKGZ1bmN0aW9uKCBfaSApIHtcblx0XHRcdGlmKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG5cdFx0XHRcdGxldCBuYW1lID0gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpO1xuXHRcdFx0XHQkKFwiI2lkX1wiK25hbWUrXCJfMVwiKS52YWwocm91bmQ1KCQodGhpcykudmFsKCkpKS5wcm9wKCdzZWxlY3RlZCcsIHRydWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzAnXVwiKS5oaWRlKCk7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzEnXVwiKS5zaG93KCk7XG5cdH0gZWxzZSB7XG5cdFx0JChcIltpZCQ9J19kaWFnbm9zaXNfYWdlXzEnXVwiKS5lYWNoKGZ1bmN0aW9uKCBfaSApIHtcblx0XHRcdGlmKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG5cdFx0XHRcdGxldCBuYW1lID0gdGhpcy5uYW1lLnN1YnN0cmluZygwLCB0aGlzLm5hbWUubGVuZ3RoLTIpO1xuXHRcdFx0XHQkKFwiI2lkX1wiK25hbWUrXCJfMFwiKS52YWwoJCh0aGlzKS52YWwoKSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLnNob3coKTtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLmhpZGUoKTtcblx0fVxufVxuXG4vLyBtYWxlcyBzaG91bGQgbm90IGhhdmUgb3ZhcmlhbiBjYW5jZXIgYW5kIGZlbWFsZXMgc2hvdWxkIG5vdCBoYXZlIHByb3N0YXRlIGNhbmNlclxuZnVuY3Rpb24gdXBkYXRlX2NhbmNlcl9ieV9zZXgobm9kZSkge1xuXHQkKCcjY2FuY2VyIC5yb3cnKS5zaG93KCk7XG5cdGlmKG5vZGUuc2V4ID09PSAnTScpIHtcblx0XHRkZWxldGUgbm9kZS5vdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlO1xuXHRcdCQoXCJbaWRePSdpZF9vdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlJ11cIikuY2xvc2VzdCgnLnJvdycpLmhpZGUoKTtcblx0XHQkKFwiW2lkXj0naWRfYnJlYXN0X2NhbmNlcjJfZGlhZ25vc2lzX2FnZSddXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdH0gZWxzZSBpZihub2RlLnNleCA9PT0gJ0YnKSB7XG5cdFx0ZGVsZXRlIG5vZGUucHJvc3RhdGVfY2FuY2VyX2RpYWdub3Npc19hZ2U7XG5cdFx0JChcIltpZF49J2lkX3Byb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlJ11cIikuY2xvc2VzdCgnLnJvdycpLmhpZGUoKTtcblx0XHQkKFwiW2lkXj0naWRfYnJlYXN0X2NhbmNlcjJfZGlhZ25vc2lzX2FnZSddXCIpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHR9XG59XG5cbi8vIHJvdW5kIHRvIDUsIDE1LCAyNSwgMzUgLi4uLlxuZnVuY3Rpb24gcm91bmQ1KHgxKSB7XG5cdGxldCB4MiA9IChNYXRoLnJvdW5kKCh4MS0xKSAvIDEwKSAqIDEwKTtcblx0cmV0dXJuICh4MSA8IHgyID8geDIgLSA1IDogeDIgKyA1KTtcbn1cblxuIiwiLy8gcGVkaWdyZWUgd2lkZ2V0c1xuaW1wb3J0IHthZGRzaWJsaW5nLCBhZGRjaGlsZCwgYWRkcGFyZW50cywgYWRkcGFydG5lciwgcmVidWlsZCwgZGVsZXRlX25vZGVfZGF0YXNldH0gZnJvbSAnLi9wZWRpZ3JlZS5qcyc7XG5pbXBvcnQge2NvcHlfZGF0YXNldCwgbWFrZWlkLCBnZXRJZHhCeU5hbWV9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0IHtzYXZlfSBmcm9tICcuL3BlZGlncmVlX2Zvcm0uanMnO1xuaW1wb3J0IHtjdXJyZW50IGFzIHBlZGNhY2hlX2N1cnJlbnR9IGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5sZXQgZHJhZ2dpbmc7XG5sZXQgbGFzdF9tb3VzZW92ZXI7XG4vL1xuLy8gQWRkIHdpZGdldHMgdG8gbm9kZXMgYW5kIGJpbmQgZXZlbnRzXG5leHBvcnQgZnVuY3Rpb24gYWRkV2lkZ2V0cyhvcHRzLCBub2RlKSB7XG5cblx0Ly8gcG9wdXAgZ2VuZGVyIHNlbGVjdGlvbiBib3hcblx0bGV0IGZvbnRfc2l6ZSA9IHBhcnNlSW50KCQoXCJib2R5XCIpLmNzcygnZm9udC1zaXplJykpO1xuXHRsZXQgcG9wdXBfc2VsZWN0aW9uID0gZDMuc2VsZWN0KCcuZGlhZ3JhbScpO1xuXHRwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb25cIilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJyeFwiLCA2KVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcInJ5XCIsIDYpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0XHRcdFx0XHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCAgZm9udF9zaXplKjcuOSlcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJoZWlnaHRcIiwgZm9udF9zaXplKjIpXG5cdFx0XHRcdFx0XHRcdC5zdHlsZShcInN0cm9rZVwiLCBcImRhcmtncmV5XCIpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwiZmlsbFwiLCBcIndoaXRlXCIpO1xuXG5cdGxldCBzcXVhcmUgPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gbWFsZVxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtbGcgZmEtc3F1YXJlIHBlcnNvbnR5cGVcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdC5hdHRyKFwieFwiLCBmb250X3NpemUvMylcblx0XHQuYXR0cihcInlcIiwgZm9udF9zaXplKjEuNSlcblx0XHQudGV4dChcIlxcdWYwOTYgXCIpO1xuXHRsZXQgc3F1YXJlX3RpdGxlID0gc3F1YXJlLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIG1hbGVcIik7XG5cblx0bGV0IGNpcmNsZSA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBmZW1hbGVcblx0XHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cignZm9udC1zaXplJywgJzEuZW0nIClcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLWxnIGZhLWNpcmNsZSBwZXJzb250eXBlXCIpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHQuYXR0cihcInhcIiwgZm9udF9zaXplKjEuNylcblx0XHQuYXR0cihcInlcIiwgZm9udF9zaXplKjEuNSlcblx0XHQudGV4dChcIlxcdWYxMGMgXCIpO1xuXHRsZXQgY2lyY2xlX3RpdGxlID0gY2lyY2xlLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIGZlbWFsZVwiKTtcblxuXHRsZXQgdW5zcGVjaWZpZWQgPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gdW5zcGVjaWZpZWRcblx0XHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cignZm9udC1zaXplJywgJzEuZW0nIClcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtbGcgZmEtdW5zcGVjaWZpZWQgcG9wdXBfc2VsZWN0aW9uX3JvdGF0ZTQ1IHBlcnNvbnR5cGVcIilcblx0XHQudGV4dChcIlxcdWYwOTYgXCIpO1xuXHR1bnNwZWNpZmllZC5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCB1bnNwZWNpZmllZFwiKTtcblxuXHRsZXQgZHp0d2luID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIGRpenlnb3RpYyB0d2luc1xuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS0yeCBmYS1hbmdsZS11cCBwZXJzb250eXBlIGR6dHdpblwiKVxuXHRcdC5hdHRyKFwieFwiLCBmb250X3NpemUqNC42KVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjEwNiBcIik7XG5cdGR6dHdpbi5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCBkaXp5Z290aWMvZnJhdGVybmFsIHR3aW5zXCIpO1xuXG5cdGxldCBtenR3aW4gPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gbW9ub3p5Z290aWMgdHdpbnNcblx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLTJ4IGZhLWNhcmV0LXVwIHBlcnNvbnR5cGUgbXp0d2luXCIpXG5cdC5hdHRyKFwieFwiLCBmb250X3NpemUqNi4yKVxuXHQuYXR0cihcInlcIiwgZm9udF9zaXplKjEuNSlcblx0LnRleHQoXCJcXHVmMGQ4XCIpO1xuXHRtenR3aW4uYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgbW9ub3p5Z290aWMvaWRlbnRpY2FsIHR3aW5zXCIpO1xuXG5cdGxldCBhZGRfcGVyc29uID0ge307XG5cdC8vIGNsaWNrIHRoZSBwZXJzb24gdHlwZSBzZWxlY3Rpb25cblx0ZDMuc2VsZWN0QWxsKFwiLnBlcnNvbnR5cGVcIilcblx0ICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG5cdFx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGVfY3VycmVudChvcHRzKSk7XG5cdFx0bGV0IG16dHdpbiA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwibXp0d2luXCIpO1xuXHRcdGxldCBkenR3aW4gPSBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImR6dHdpblwiKTtcblx0XHRsZXQgdHdpbl90eXBlO1xuXHRcdGxldCBzZXg7XG5cdFx0aWYobXp0d2luIHx8IGR6dHdpbikge1xuXHRcdFx0c2V4ID0gYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkuZGF0YS5zZXg7XG5cdFx0XHR0d2luX3R5cGUgPSAobXp0d2luID8gXCJtenR3aW5cIiA6IFwiZHp0d2luXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzZXggPSBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImZhLXNxdWFyZVwiKSA/ICdNJyA6IChkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImZhLWNpcmNsZVwiKSA/ICdGJyA6ICdVJyk7XG5cdFx0fVxuXG5cdFx0aWYoYWRkX3BlcnNvbi50eXBlID09PSAnYWRkc2libGluZycpXG5cdFx0XHRhZGRzaWJsaW5nKG5ld2RhdGFzZXQsIGFkZF9wZXJzb24ubm9kZS5kYXR1bSgpLmRhdGEsIHNleCwgZmFsc2UsIHR3aW5fdHlwZSk7XG5cdFx0ZWxzZSBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRjaGlsZCcpXG5cdFx0XHRhZGRjaGlsZChuZXdkYXRhc2V0LCBhZGRfcGVyc29uLm5vZGUuZGF0dW0oKS5kYXRhLCAodHdpbl90eXBlID8gJ1UnIDogc2V4KSwgKHR3aW5fdHlwZSA/IDIgOiAxKSwgdHdpbl90eXBlKTtcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm47XG5cdFx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRhZGRfcGVyc29uID0ge307XG5cdCAgfSlcblx0ICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oKSB7XG5cdFx0ICBpZihhZGRfcGVyc29uLm5vZGUpXG5cdFx0XHQgIGFkZF9wZXJzb24ubm9kZS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMC4yKTtcblx0XHQgIGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcblx0XHQgIC8vIGFkZCB0b29sdGlwcyB0byBmb250IGF3ZXNvbWUgd2lkZ2V0c1xuXHRcdCAgaWYoYWRkX3BlcnNvbi50eXBlID09PSAnYWRkc2libGluZycpe1xuXHRcdFx0IGlmKGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtc3F1YXJlXCIpKVxuXHRcdFx0XHQgIHNxdWFyZV90aXRsZS50ZXh0KFwiYWRkIGJyb3RoZXJcIik7XG5cdFx0XHQgIGVsc2Vcblx0XHRcdFx0ICBjaXJjbGVfdGl0bGUudGV4dChcImFkZCBzaXN0ZXJcIik7XG5cdFx0ICB9IGVsc2UgaWYoYWRkX3BlcnNvbi50eXBlID09PSAnYWRkY2hpbGQnKXtcblx0XHRcdCAgaWYoZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJmYS1zcXVhcmVcIikpXG5cdFx0XHRcdCAgc3F1YXJlX3RpdGxlLnRleHQoXCJhZGQgc29uXCIpO1xuXHRcdFx0ICBlbHNlXG5cdFx0XHRcdCAgY2lyY2xlX3RpdGxlLnRleHQoXCJhZGQgZGF1Z2h0ZXJcIik7XG5cdFx0ICB9XG5cdCAgfSk7XG5cblx0Ly8gaGFuZGxlIG1vdXNlIG91dCBvZiBwb3B1cCBzZWxlY3Rpb25cblx0ZDMuc2VsZWN0QWxsKFwiLnBvcHVwX3NlbGVjdGlvblwiKS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uICgpIHtcblx0XHQvLyBoaWRlIHJlY3QgYW5kIHBvcHVwIHNlbGVjdGlvblxuXHRcdGlmKGFkZF9wZXJzb24ubm9kZSAhPT0gdW5kZWZpbmVkICYmIGhpZ2hsaWdodC5pbmRleE9mKGFkZF9wZXJzb24ubm9kZS5kYXR1bSgpKSA9PSAtMSlcblx0XHRcdGFkZF9wZXJzb24ubm9kZS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0ZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHR9KTtcblxuXG5cdC8vIGRyYWcgbGluZSBiZXR3ZWVuIG5vZGVzIHRvIGNyZWF0ZSBwYXJ0bmVyc1xuXHRkcmFnX2hhbmRsZShvcHRzKTtcblxuXHQvLyByZWN0YW5nbGUgdXNlZCB0byBoaWdobGlnaHQgb24gbW91c2Ugb3ZlclxuXHRub2RlLmFwcGVuZChcInJlY3RcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XG5cdFx0ICAgIHJldHVybiBkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHID8gZmFsc2UgOiB0cnVlO1xuXHRcdH0pXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCAnaW5kaV9yZWN0Jylcblx0XHQuYXR0cihcInJ4XCIsIDYpXG5cdFx0LmF0dHIoXCJyeVwiLCA2KVxuXHRcdC5hdHRyKFwieFwiLCBmdW5jdGlvbihfZCkgeyByZXR1cm4gLSAwLjc1Km9wdHMuc3ltYm9sX3NpemU7IH0pXG5cdFx0LmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKF9kKSB7IHJldHVybiAtIG9wdHMuc3ltYm9sX3NpemU7IH0pXG5cdFx0LmF0dHIoXCJ3aWR0aFwiLCAgKDEuNSAqIG9wdHMuc3ltYm9sX3NpemUpKydweCcpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgKDIgKiBvcHRzLnN5bWJvbF9zaXplKSsncHgnKVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDAuNylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoXCJmaWxsXCIsIFwibGlnaHRncmV5XCIpO1xuXG5cdC8vIHdpZGdldHNcblx0bGV0IGZ4ID0gZnVuY3Rpb24oX2QpIHtyZXR1cm4gb2ZmIC0gMC43NSpvcHRzLnN5bWJvbF9zaXplO307XG5cdGxldCBmeSA9IG9wdHMuc3ltYm9sX3NpemUgLTI7XG5cdGxldCBvZmYgPSAwO1xuXHRsZXQgd2lkZ2V0cyA9IHtcblx0XHQnYWRkY2hpbGQnOiAgIHsndGV4dCc6ICdcXHVmMDYzJywgJ3RpdGxlJzogJ2FkZCBjaGlsZCcsICAgJ2Z4JzogZngsICdmeSc6IGZ5fSxcblx0XHQnYWRkc2libGluZyc6IHsndGV4dCc6ICdcXHVmMjM0JywgJ3RpdGxlJzogJ2FkZCBzaWJsaW5nJywgJ2Z4JzogZngsICdmeSc6IGZ5fSxcblx0XHQnYWRkcGFydG5lcic6IHsndGV4dCc6ICdcXHVmMGMxJywgJ3RpdGxlJzogJ2FkZCBwYXJ0bmVyJywgJ2Z4JzogZngsICdmeSc6IGZ5fSxcblx0XHQnYWRkcGFyZW50cyc6IHtcblx0XHRcdCd0ZXh0JzogJ1xcdWYwNjInLCAndGl0bGUnOiAnYWRkIHBhcmVudHMnLFxuXHRcdFx0J2Z4JzogLSAwLjc1Km9wdHMuc3ltYm9sX3NpemUsXG5cdFx0XHQnZnknOiAtIG9wdHMuc3ltYm9sX3NpemUgKyAxMVxuXHRcdH0sXG5cdFx0J2RlbGV0ZSc6IHtcblx0XHRcdCd0ZXh0JzogJ1gnLCAndGl0bGUnOiAnZGVsZXRlJyxcblx0XHRcdCdmeCc6IG9wdHMuc3ltYm9sX3NpemUvMiAtIDEsXG5cdFx0XHQnZnknOiAtIG9wdHMuc3ltYm9sX3NpemUgKyAxMixcblx0XHRcdCdzdHlsZXMnOiB7XCJmb250LXdlaWdodFwiOiBcImJvbGRcIiwgXCJmaWxsXCI6IFwiZGFya3JlZFwiLCBcImZvbnQtZmFtaWx5XCI6IFwibW9ub3NwYWNlXCJ9XG5cdFx0fVxuXHR9O1xuXG5cdGlmKG9wdHMuZWRpdCkge1xuXHRcdHdpZGdldHMuc2V0dGluZ3MgPSB7J3RleHQnOiAnXFx1ZjAxMycsICd0aXRsZSc6ICdzZXR0aW5ncycsICdmeCc6IC1mb250X3NpemUvMisyLCAnZnknOiAtb3B0cy5zeW1ib2xfc2l6ZSArIDExfTtcblx0fVxuXG5cdGZvcihsZXQga2V5IGluIHdpZGdldHMpIHtcblx0XHRsZXQgd2lkZ2V0ID0gbm9kZS5hcHBlbmQoXCJ0ZXh0XCIpXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdHJldHVybiAgKGQuZGF0YS5oaWRkZW4gJiYgIW9wdHMuREVCVUcgPyBmYWxzZSA6IHRydWUpICYmXG5cdFx0XHRcdFx0XHQhKChkLmRhdGEubW90aGVyID09PSB1bmRlZmluZWQgfHwgZC5kYXRhLm5vcGFyZW50cykgJiYga2V5ID09PSAnYWRkc2libGluZycpICYmXG5cdFx0XHRcdFx0XHQhKGQuZGF0YS5wYXJlbnRfbm9kZSAhPT0gdW5kZWZpbmVkICYmIGQuZGF0YS5wYXJlbnRfbm9kZS5sZW5ndGggPiAxICYmIGtleSA9PT0gJ2FkZHBhcnRuZXInKSAmJlxuXHRcdFx0XHRcdFx0IShkLmRhdGEucGFyZW50X25vZGUgPT09IHVuZGVmaW5lZCAmJiBrZXkgPT09ICdhZGRjaGlsZCcpICYmXG5cdFx0XHRcdFx0XHQhKChkLmRhdGEubm9wYXJlbnRzID09PSB1bmRlZmluZWQgJiYgZC5kYXRhLnRvcF9sZXZlbCA9PT0gdW5kZWZpbmVkKSAmJiBrZXkgPT09ICdhZGRwYXJlbnRzJyk7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBrZXkpXG5cdFx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0XHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHRcdFx0LmF0dHIoXCJ4eFwiLCBmdW5jdGlvbihkKXtyZXR1cm4gZC54O30pXG5cdFx0XHQuYXR0cihcInl5XCIsIGZ1bmN0aW9uKGQpe3JldHVybiBkLnk7fSlcblx0XHRcdC5hdHRyKFwieFwiLCB3aWRnZXRzW2tleV0uZngpXG5cdFx0XHQuYXR0cihcInlcIiwgd2lkZ2V0c1trZXldLmZ5KVxuXHRcdFx0LmF0dHIoJ2ZvbnQtc2l6ZScsICcwLjllbScgKVxuXHRcdFx0LnRleHQod2lkZ2V0c1trZXldLnRleHQpO1xuXG5cdFx0aWYoJ3N0eWxlcycgaW4gd2lkZ2V0c1trZXldKVxuXHRcdFx0Zm9yKGxldCBzdHlsZSBpbiB3aWRnZXRzW2tleV0uc3R5bGVzKXtcblx0XHRcdFx0d2lkZ2V0LmF0dHIoc3R5bGUsIHdpZGdldHNba2V5XS5zdHlsZXNbc3R5bGVdKTtcblx0XHRcdH1cblxuXHRcdHdpZGdldC5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dCh3aWRnZXRzW2tleV0udGl0bGUpO1xuXHRcdG9mZiArPSAxNztcblx0fVxuXG5cdC8vIGFkZCBzaWJsaW5nIG9yIGNoaWxkXG5cdGQzLnNlbGVjdEFsbChcIi5hZGRzaWJsaW5nLCAuYWRkY2hpbGRcIilcblx0ICAub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24gKCkge1xuXHRcdCAgbGV0IHR5cGUgPSBkMy5zZWxlY3QodGhpcykuYXR0cignY2xhc3MnKTtcblx0XHQgIGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcblx0XHQgIGFkZF9wZXJzb24gPSB7J25vZGUnOiBkMy5zZWxlY3QodGhpcy5wYXJlbnROb2RlKSwgJ3R5cGUnOiB0eXBlfTtcblxuXHRcdCAgLy9sZXQgdHJhbnNsYXRlID0gZ2V0VHJhbnNsYXRpb24oZDMuc2VsZWN0KCcuZGlhZ3JhbScpLmF0dHIoXCJ0cmFuc2Zvcm1cIikpO1xuXHRcdCAgbGV0IHggPSBwYXJzZUludChkMy5zZWxlY3QodGhpcykuYXR0cihcInh4XCIpKSArIHBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwieFwiKSk7XG5cdFx0ICBsZXQgeSA9IHBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwieXlcIikpICsgcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ5XCIpKTtcblx0XHQgIGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIreCtcIixcIisoeSsyKStcIilcIik7XG5cdFx0ICBkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb25fcm90YXRlNDUnKVxuXHRcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIrKHgrMypmb250X3NpemUpK1wiLFwiKyh5Kyhmb250X3NpemUqMS4yKSkrXCIpIHJvdGF0ZSg0NSlcIik7XG5cdCAgfSk7XG5cblx0Ly8gaGFuZGxlIHdpZGdldCBjbGlja3Ncblx0ZDMuc2VsZWN0QWxsKFwiLmFkZGNoaWxkLCAuYWRkcGFydG5lciwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5zZXR0aW5nc1wiKVxuXHQgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGxldCBvcHQgPSBkMy5zZWxlY3QodGhpcykuYXR0cignY2xhc3MnKTtcblx0XHRsZXQgZCA9IGQzLnNlbGVjdCh0aGlzLnBhcmVudE5vZGUpLmRhdHVtKCk7XG5cdFx0aWYob3B0cy5ERUJVRykge1xuXHRcdFx0Y29uc29sZS5sb2cob3B0KTtcblx0XHR9XG5cblx0XHRsZXQgbmV3ZGF0YXNldDtcblx0XHRpZihvcHQgPT09ICdzZXR0aW5ncycpIHtcblx0XHRcdGlmKHR5cGVvZiBvcHRzLmVkaXQgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0b3B0cy5lZGl0KG9wdHMsIGQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0b3BlbkVkaXREaWFsb2cob3B0cywgZCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmKG9wdCA9PT0gJ2RlbGV0ZScpIHtcblx0XHRcdG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGVfY3VycmVudChvcHRzKSk7XG5cdFx0XHRkZWxldGVfbm9kZV9kYXRhc2V0KG5ld2RhdGFzZXQsIGQuZGF0YSwgb3B0cywgb25Eb25lKTtcblx0XHR9IGVsc2UgaWYob3B0ID09PSAnYWRkcGFyZW50cycpIHtcblx0XHRcdG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGVfY3VycmVudChvcHRzKSk7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdFx0YWRkcGFyZW50cyhvcHRzLCBuZXdkYXRhc2V0LCBkLmRhdGEubmFtZSk7XG5cdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZihvcHQgPT09ICdhZGRwYXJ0bmVyJykge1xuXHRcdFx0bmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRcdGFkZHBhcnRuZXIob3B0cywgbmV3ZGF0YXNldCwgZC5kYXRhLm5hbWUpO1xuXHRcdFx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0fVxuXHRcdC8vIHRyaWdnZXIgZmhDaGFuZ2UgZXZlbnRcblx0XHQkKGRvY3VtZW50KS50cmlnZ2VyKCdmaENoYW5nZScsIFtvcHRzXSk7XG5cdH0pO1xuXG5cdC8vIG90aGVyIG1vdXNlIGV2ZW50c1xuXHRsZXQgaGlnaGxpZ2h0ID0gW107XG5cblx0bm9kZS5maWx0ZXIoZnVuY3Rpb24gKGQpIHsgcmV0dXJuICFkLmRhdGEuaGlkZGVuOyB9KVxuXHQub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZCkge1xuXHRcdGlmIChkMy5ldmVudC5jdHJsS2V5KSB7XG5cdFx0XHRpZihoaWdobGlnaHQuaW5kZXhPZihkKSA9PSAtMSlcblx0XHRcdFx0aGlnaGxpZ2h0LnB1c2goZCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGhpZ2hsaWdodC5zcGxpY2UoaGlnaGxpZ2h0LmluZGV4T2YoZCksIDEpO1xuXHRcdH0gZWxzZVxuXHRcdFx0aGlnaGxpZ2h0ID0gW2RdO1xuXG5cdFx0aWYoJ25vZGVjbGljaycgaW4gb3B0cykge1xuXHRcdFx0b3B0cy5ub2RlY2xpY2soZC5kYXRhKTtcblx0XHRcdGQzLnNlbGVjdEFsbChcIi5pbmRpX3JlY3RcIikuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdFx0ZDMuc2VsZWN0QWxsKCcuaW5kaV9yZWN0JykuZmlsdGVyKGZ1bmN0aW9uKGQpIHtyZXR1cm4gaGlnaGxpZ2h0LmluZGV4T2YoZCkgIT0gLTE7fSkuc3R5bGUoXCJvcGFjaXR5XCIsIDAuNSk7XG5cdFx0fVxuXHR9KVxuXHQub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZXZlbnQsIGQpe1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGxhc3RfbW91c2VvdmVyID0gZDtcblx0XHRpZihkcmFnZ2luZykge1xuXHRcdFx0aWYoZHJhZ2dpbmcuZGF0YS5uYW1lICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLm5hbWUgJiZcblx0XHRcdCAgIGRyYWdnaW5nLmRhdGEuc2V4ICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLnNleCkge1xuXHRcdFx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0KCdyZWN0Jykuc3R5bGUoXCJvcGFjaXR5XCIsIDAuMik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMC4yKTtcblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuYWRkY2hpbGQsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5zZXR0aW5ncycpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuaW5kaV9kZXRhaWxzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdHNldExpbmVEcmFnUG9zaXRpb24ob3B0cy5zeW1ib2xfc2l6ZS0xMCwgMCwgb3B0cy5zeW1ib2xfc2l6ZS0yLCAwLCBkLngrXCIsXCIrKGQueSsyKSk7XG5cdH0pXG5cdC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGV2ZW50LCBkKXtcblx0XHRpZihkcmFnZ2luZylcblx0XHRcdHJldHVybjtcblxuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5hZGRjaGlsZCwgLmFkZHNpYmxpbmcsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGlmKGhpZ2hsaWdodC5pbmRleE9mKGQpID09IC0xKVxuXHRcdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuaW5kaV9kZXRhaWxzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdC8vIGhpZGUgcG9wdXAgaWYgaXQgbG9va3MgbGlrZSB0aGUgbW91c2UgaXMgbW92aW5nIG5vcnRoXG5cdFx0bGV0IHhjb29yZCA9IGQzLnBvaW50ZXIoZXZlbnQpWzBdO1xuXHRcdGxldCB5Y29vcmQgPSBkMy5wb2ludGVyKGV2ZW50KVsxXTtcblx0XHRpZih5Y29vcmQgPCAwLjgqb3B0cy5zeW1ib2xfc2l6ZSlcblx0XHRcdGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRpZighZHJhZ2dpbmcpIHtcblx0XHRcdC8vIGhpZGUgcG9wdXAgaWYgaXQgbG9va3MgbGlrZSB0aGUgbW91c2UgaXMgbW92aW5nIG5vcnRoLCBzb3V0aCBvciB3ZXN0XG5cdFx0XHRpZiggTWF0aC5hYnMoeWNvb3JkKSA+IDAuMjUqb3B0cy5zeW1ib2xfc2l6ZSB8fFxuXHRcdFx0XHRNYXRoLmFicyh5Y29vcmQpIDwgLTAuMjUqb3B0cy5zeW1ib2xfc2l6ZSB8fFxuXHRcdFx0XHR4Y29vcmQgPCAwLjIqb3B0cy5zeW1ib2xfc2l6ZSl7XG5cdFx0XHRcdFx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblx0XHRcdH1cbiAgICAgICAgfVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25Eb25lKG9wdHMsIGRhdGFzZXQpIHtcblx0Ly8gYXNzaWduIG5ldyBkYXRhc2V0IGFuZCByZWJ1aWxkIHBlZGlncmVlXG5cdG9wdHMuZGF0YXNldCA9IGRhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbi8vIGRyYWcgbGluZSBiZXR3ZWVuIG5vZGVzIHRvIGNyZWF0ZSBwYXJ0bmVyc1xuZnVuY3Rpb24gZHJhZ19oYW5kbGUob3B0cykge1xuXHRsZXQgbGluZV9kcmFnX3NlbGVjdGlvbiA9IGQzLnNlbGVjdCgnLmRpYWdyYW0nKTtcblx0bGV0IGRsaW5lID0gbGluZV9kcmFnX3NlbGVjdGlvbi5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCAnbGluZV9kcmFnX3NlbGVjdGlvbicpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDYpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZS1kYXNoYXJyYXlcIiwgKFwiMiwgMVwiKSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2VcIixcImJsYWNrXCIpXG4gICAgICAgIC5jYWxsKGQzLmRyYWcoKVxuICAgICAgICAgICAgICAgIC5vbihcInN0YXJ0XCIsIGRyYWdzdGFydClcbiAgICAgICAgICAgICAgICAub24oXCJkcmFnXCIsIGRyYWcpXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIGRyYWdzdG9wKSk7XG5cdGRsaW5lLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiZHJhZyB0byBjcmVhdGUgY29uc2FuZ3VpbmVvdXMgcGFydG5lcnNcIik7XG5cblx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblxuXHRmdW5jdGlvbiBkcmFnc3RhcnQoKSB7XG5cdFx0ZHJhZ2dpbmcgPSBsYXN0X21vdXNlb3Zlcjtcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsXCJkYXJrcmVkXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ3N0b3AoX2QpIHtcblx0XHRpZihsYXN0X21vdXNlb3ZlciAmJlxuXHRcdCAgIGRyYWdnaW5nLmRhdGEubmFtZSAhPT0gbGFzdF9tb3VzZW92ZXIuZGF0YS5uYW1lICYmXG5cdFx0ICAgZHJhZ2dpbmcuZGF0YS5zZXggICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLnNleCkge1xuXHRcdFx0Ly8gbWFrZSBwYXJ0bmVyc1xuXHRcdFx0bGV0IGNoaWxkID0ge1wibmFtZVwiOiBtYWtlaWQoNCksIFwic2V4XCI6ICdVJyxcblx0XHRcdFx0ICAgICBcIm1vdGhlclwiOiAoZHJhZ2dpbmcuZGF0YS5zZXggPT09ICdGJyA/IGRyYWdnaW5nLmRhdGEubmFtZSA6IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSksXG5cdFx0XHQgICAgICAgICBcImZhdGhlclwiOiAoZHJhZ2dpbmcuZGF0YS5zZXggPT09ICdGJyA/IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSA6IGRyYWdnaW5nLmRhdGEubmFtZSl9O1xuXHRcdFx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQob3B0cy5kYXRhc2V0KTtcblx0XHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cblx0XHRcdGxldCBpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBkcmFnZ2luZy5kYXRhLm5hbWUpKzE7XG5cdFx0XHRvcHRzLmRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xuXHRcdFx0cmVidWlsZChvcHRzKTtcblx0XHR9XG5cdFx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsXCJibGFja1wiKTtcblx0XHRkcmFnZ2luZyA9IHVuZGVmaW5lZDtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRmdW5jdGlvbiBkcmFnKGV2ZW50LCBfZCkge1xuXHRcdGV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGxldCBkeCA9IGV2ZW50LmR4O1xuXHRcdGxldCBkeSA9IGV2ZW50LmR5O1xuICAgICAgICBsZXQgeG5ldyA9IHBhcnNlRmxvYXQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ3gyJykpKyBkeDtcbiAgICAgICAgbGV0IHluZXcgPSBwYXJzZUZsb2F0KGQzLnNlbGVjdCh0aGlzKS5hdHRyKCd5MicpKSsgZHk7XG4gICAgICAgIHNldExpbmVEcmFnUG9zaXRpb24ob3B0cy5zeW1ib2xfc2l6ZS0xMCwgMCwgeG5ldywgeW5ldyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0TGluZURyYWdQb3NpdGlvbih4MSwgeTEsIHgyLCB5MiwgdHJhbnNsYXRlKSB7XG5cdGlmKHRyYW5zbGF0ZSlcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJykuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit0cmFuc2xhdGUrXCIpXCIpO1xuXHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHQuYXR0cihcIngxXCIsIHgxKVxuXHRcdC5hdHRyKFwieTFcIiwgeTEpXG5cdFx0LmF0dHIoXCJ4MlwiLCB4Milcblx0XHQuYXR0cihcInkyXCIsIHkyKTtcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGlzZUZpcnN0TGV0dGVyKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cbi8vIGlmIG9wdC5lZGl0IGlzIHNldCB0cnVlIChyYXRoZXIgdGhhbiBnaXZlbiBhIGZ1bmN0aW9uKSB0aGlzIGlzIGNhbGxlZCB0byBlZGl0IG5vZGUgYXR0cmlidXRlc1xuZnVuY3Rpb24gb3BlbkVkaXREaWFsb2cob3B0cywgZCkge1xuXHQkKCcjbm9kZV9wcm9wZXJ0aWVzJykuZGlhbG9nKHtcblx0ICAgIGF1dG9PcGVuOiBmYWxzZSxcblx0ICAgIHRpdGxlOiBkLmRhdGEuZGlzcGxheV9uYW1lLFxuXHQgICAgd2lkdGg6ICgkKHdpbmRvdykud2lkdGgoKSA+IDQwMCA/IDQ1MCA6ICQod2luZG93KS53aWR0aCgpLSAzMClcblx0fSk7XG5cblx0bGV0IHRhYmxlID0gXCI8dGFibGUgaWQ9J3BlcnNvbl9kZXRhaWxzJyBjbGFzcz0ndGFibGUnPlwiO1xuXG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+VW5pcXVlIElEPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J3RleHQnIGlkPSdpZF9uYW1lJyBuYW1lPSduYW1lJyB2YWx1ZT1cIitcblx0KGQuZGF0YS5uYW1lID8gZC5kYXRhLm5hbWUgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+TmFtZTwvdGQ+PHRkPjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyB0eXBlPSd0ZXh0JyBpZD0naWRfZGlzcGxheV9uYW1lJyBuYW1lPSdkaXNwbGF5X25hbWUnIHZhbHVlPVwiK1xuXHRcdFx0KGQuZGF0YS5kaXNwbGF5X25hbWUgPyBkLmRhdGEuZGlzcGxheV9uYW1lIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+QWdlPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J251bWJlcicgaWQ9J2lkX2FnZScgbWluPScwJyBtYXg9JzEyMCcgbmFtZT0nYWdlJyBzdHlsZT0nd2lkdGg6N2VtJyB2YWx1ZT1cIitcblx0XHRcdChkLmRhdGEuYWdlID8gZC5kYXRhLmFnZSA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblxuXHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlllYXIgT2YgQmlydGg8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0nbnVtYmVyJyBpZD0naWRfeW9iJyBtaW49JzE5MDAnIG1heD0nMjA1MCcgbmFtZT0neW9iJyBzdHlsZT0nd2lkdGg6N2VtJyB2YWx1ZT1cIitcblx0XHQoZC5kYXRhLnlvYiA/IGQuZGF0YS55b2IgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIiBpZD1cImlkX3NleFwiPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJyYWRpby1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNleFwiIHZhbHVlPVwiTVwiICcrKGQuZGF0YS5zZXggPT09ICdNJyA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz5NYWxlPC9sYWJlbD4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwicmFkaW8taW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzZXhcIiB2YWx1ZT1cIkZcIiAnKyhkLmRhdGEuc2V4ID09PSAnRicgPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+RmVtYWxlPC9sYWJlbD4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwicmFkaW8taW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzZXhcIiB2YWx1ZT1cIlVcIj5Vbmtub3duPC9sYWJlbD4nICtcblx0XHRcdCAnPC90ZD48L3RyPic7XG5cblx0Ly8gYWxpdmUgc3RhdHVzID0gMDsgZGVhZCBzdGF0dXMgPSAxXG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCIgaWQ9XCJpZF9zdGF0dXNcIj4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtaW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzdGF0dXNcIiB2YWx1ZT1cIjBcIiAnKyhwYXJzZUludChkLmRhdGEuc3RhdHVzKSA9PT0gMCA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz4mdGhpbnNwO0FsaXZlPC9sYWJlbD4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtaW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzdGF0dXNcIiB2YWx1ZT1cIjFcIiAnKyhwYXJzZUludChkLmRhdGEuc3RhdHVzKSA9PT0gMSA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz4mdGhpbnNwO0RlY2Vhc2VkPC9sYWJlbD4nICtcblx0XHRcdCAnPC90ZD48L3RyPic7XG5cdCQoXCIjaWRfc3RhdHVzIGlucHV0W3ZhbHVlPSdcIitkLmRhdGEuc3RhdHVzK1wiJ11cIikucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuXG5cdC8vIHN3aXRjaGVzXG5cdGxldCBzd2l0Y2hlcyA9IFtcImFkb3B0ZWRfaW5cIiwgXCJhZG9wdGVkX291dFwiLCBcIm1pc2NhcnJpYWdlXCIsIFwic3RpbGxiaXJ0aFwiLCBcInRlcm1pbmF0aW9uXCJdO1xuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiPjxzdHJvbmc+UmVwcm9kdWN0aW9uOjwvc3Ryb25nPjwvdGQ+PC90cj4nO1xuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiPic7XG5cdGZvcihsZXQgaXN3aXRjaD0wOyBpc3dpdGNoPHN3aXRjaGVzLmxlbmd0aDsgaXN3aXRjaCsrKXtcblx0XHRsZXQgYXR0ciA9IHN3aXRjaGVzW2lzd2l0Y2hdO1xuXHRcdGlmKGlzd2l0Y2ggPT09IDIpXG5cdFx0XHR0YWJsZSArPSAnPC90ZD48L3RyPjx0cj48dGQgY29sc3Bhbj1cIjJcIj4nO1xuXHRcdHRhYmxlICs9XG5cdFx0ICc8bGFiZWwgY2xhc3M9XCJjaGVja2JveC1pbmxpbmVcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJpZF8nK2F0dHIgK1xuXHRcdCAgICAnXCIgbmFtZT1cIicrYXR0cisnXCIgdmFsdWU9XCIwXCIgJysoZC5kYXRhW2F0dHJdID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPiZ0aGluc3A7JyArXG5cdFx0ICAgIGNhcGl0YWxpc2VGaXJzdExldHRlcihhdHRyLnJlcGxhY2UoJ18nLCAnICcpKSsnPC9sYWJlbD4nXG5cdH1cblx0dGFibGUgKz0gJzwvdGQ+PC90cj4nO1xuXG5cdC8vXG5cdGxldCBleGNsdWRlID0gW1wiY2hpbGRyZW5cIiwgXCJuYW1lXCIsIFwicGFyZW50X25vZGVcIiwgXCJ0b3BfbGV2ZWxcIiwgXCJpZFwiLCBcIm5vcGFyZW50c1wiLFxuXHRcdCAgICAgICAgICAgXCJsZXZlbFwiLCBcImFnZVwiLCBcInNleFwiLCBcInN0YXR1c1wiLCBcImRpc3BsYXlfbmFtZVwiLCBcIm1vdGhlclwiLCBcImZhdGhlclwiLFxuXHRcdCAgICAgICAgICAgXCJ5b2JcIiwgXCJtenR3aW5cIiwgXCJkenR3aW5cIl07XG5cdCQubWVyZ2UoZXhjbHVkZSwgc3dpdGNoZXMpO1xuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiPjxzdHJvbmc+QWdlIG9mIERpYWdub3Npczo8L3N0cm9uZz48L3RkPjwvdHI+Jztcblx0JC5lYWNoKG9wdHMuZGlzZWFzZXMsIGZ1bmN0aW9uKGssIHYpIHtcblx0XHRleGNsdWRlLnB1c2godi50eXBlK1wiX2RpYWdub3Npc19hZ2VcIik7XG5cblx0XHRsZXQgZGlzZWFzZV9jb2xvdXIgPSAnJnRoaW5zcDs8c3BhbiBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHg7YmFja2dyb3VuZDonK29wdHMuZGlzZWFzZXNba10uY29sb3VyKydcIj48L3NwYW4+Jztcblx0XHRsZXQgZGlhZ25vc2lzX2FnZSA9IGQuZGF0YVt2LnR5cGUgKyBcIl9kaWFnbm9zaXNfYWdlXCJdO1xuXG5cdFx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5cIitjYXBpdGFsaXNlRmlyc3RMZXR0ZXIodi50eXBlLnJlcGxhY2UoXCJfXCIsIFwiIFwiKSkrXG5cdFx0XHRcdFx0ZGlzZWFzZV9jb2xvdXIrXCImbmJzcDs8L3RkPjx0ZD5cIiArXG5cdFx0XHRcdFx0XCI8aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgaWQ9J2lkX1wiICtcblx0XHRcdFx0XHR2LnR5cGUgKyBcIl9kaWFnbm9zaXNfYWdlXzAnIG1heD0nMTEwJyBtaW49JzAnIG5hbWU9J1wiICtcblx0XHRcdFx0XHR2LnR5cGUgKyBcIl9kaWFnbm9zaXNfYWdlXzAnIHN0eWxlPSd3aWR0aDo1ZW0nIHR5cGU9J251bWJlcicgdmFsdWU9J1wiICtcblx0XHRcdFx0XHQoZGlhZ25vc2lzX2FnZSAhPT0gdW5kZWZpbmVkID8gZGlhZ25vc2lzX2FnZSA6IFwiXCIpICtcIic+PC90ZD48L3RyPlwiO1xuXHR9KTtcblxuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiIHN0eWxlPVwibGluZS1oZWlnaHQ6MXB4O1wiPjwvdGQ+PC90cj4nO1xuXHQkLmVhY2goZC5kYXRhLCBmdW5jdGlvbihrLCB2KSB7XG5cdFx0aWYoJC5pbkFycmF5KGssIGV4Y2x1ZGUpID09IC0xKSB7XG5cdFx0XHRsZXQga2sgPSBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoayk7XG5cdFx0XHRpZih2ID09PSB0cnVlIHx8IHYgPT09IGZhbHNlKSB7XG5cdFx0XHRcdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+XCIra2srXCImbmJzcDs8L3RkPjx0ZD48aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdpZF9cIiArIGsgKyBcIicgbmFtZT0nXCIgK1xuXHRcdFx0XHRcdFx0aytcIicgdmFsdWU9XCIrditcIiBcIisodiA/IFwiY2hlY2tlZFwiIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXHRcdFx0fSBlbHNlIGlmKGsubGVuZ3RoID4gMCl7XG5cdFx0XHRcdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+XCIra2srXCImbmJzcDs8L3RkPjx0ZD48aW5wdXQgdHlwZT0ndGV4dCcgaWQ9J2lkX1wiICtcblx0XHRcdFx0XHRcdGsrXCInIG5hbWU9J1wiK2srXCInIHZhbHVlPVwiK3YrXCI+PC90ZD48L3RyPlwiO1xuXHRcdFx0fVxuXHRcdH1cbiAgICB9KTtcblx0dGFibGUgKz0gXCI8L3RhYmxlPlwiO1xuXG5cdCQoJyNub2RlX3Byb3BlcnRpZXMnKS5odG1sKHRhYmxlKTtcblx0JCgnI25vZGVfcHJvcGVydGllcycpLmRpYWxvZygnb3BlbicpO1xuXG5cdCQoJyNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1yYWRpb10sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1jaGVja2JveF0sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT10ZXh0XSwgI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPW51bWJlcl0nKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0c2F2ZShvcHRzKTtcbiAgICB9KTtcblx0cmV0dXJuO1xufVxuIiwiLy8gUGVkaWdyZWUgVHJlZSBCdWlsZGVyXG5pbXBvcnQgICogYXMgcGVkaWdyZWVfdXRpbHMgZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5pbXBvcnQgKiBhcyBwYnV0dG9ucyBmcm9tICcuL3BidXR0b25zLmpzJztcbmltcG9ydCAqIGFzIHBlZGNhY2hlIGZyb20gJy4vcGVkY2FjaGUuanMnO1xuaW1wb3J0ICogYXMgaW8gZnJvbSAnLi9pby5qcyc7XG5pbXBvcnQge2FkZFdpZGdldHN9IGZyb20gJy4vd2lkZ2V0cy5qcyc7XG5cbmV4cG9ydCBsZXQgcm9vdHMgPSB7fTtcbmV4cG9ydCBmdW5jdGlvbiBidWlsZChvcHRpb25zKSB7XG5cdGxldCBvcHRzID0gJC5leHRlbmQoeyAvLyBkZWZhdWx0c1xuXHRcdHRhcmdldERpdjogJ3BlZGlncmVlX2VkaXQnLFxuXHRcdGRhdGFzZXQ6IFsge1wibmFtZVwiOiBcIm0yMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcImZhdGhlclwiLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHRcdCAgIHtcIm5hbWVcIjogXCJmMjFcIiwgXCJkaXNwbGF5X25hbWVcIjogXCJtb3RoZXJcIiwgXCJzZXhcIjogXCJGXCIsIFwidG9wX2xldmVsXCI6IHRydWV9LFxuXHRcdFx0XHQgICB7XCJuYW1lXCI6IFwiY2gxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibWVcIiwgXCJzZXhcIjogXCJGXCIsIFwibW90aGVyXCI6IFwiZjIxXCIsIFwiZmF0aGVyXCI6IFwibTIxXCIsIFwicHJvYmFuZFwiOiB0cnVlfV0sXG5cdFx0d2lkdGg6IDYwMCxcblx0XHRoZWlnaHQ6IDQwMCxcblx0XHRzeW1ib2xfc2l6ZTogMzUsXG5cdFx0em9vbUluOiAxLjAsXG5cdFx0em9vbU91dDogMS4wLFxuXHRcdGRpc2Vhc2VzOiBbXHR7J3R5cGUnOiAnYnJlYXN0X2NhbmNlcicsICdjb2xvdXInOiAnI0Y2OEYzNSd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdicmVhc3RfY2FuY2VyMicsICdjb2xvdXInOiAncGluayd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdvdmFyaWFuX2NhbmNlcicsICdjb2xvdXInOiAnIzREQUE0RCd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdwYW5jcmVhdGljX2NhbmNlcicsICdjb2xvdXInOiAnIzQyODlCQSd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdwcm9zdGF0ZV9jYW5jZXInLCAnY29sb3VyJzogJyNENTQ5NEEnfV0sXG5cdFx0bGFiZWxzOiBbJ3N0aWxsYmlydGgnLCAnYWdlJywgJ3lvYicsICdhbGxlbGVzJ10sXG5cdFx0a2VlcF9wcm9iYW5kX29uX3Jlc2V0OiBmYWxzZSxcblx0XHRmb250X3NpemU6ICcuNzVlbScsXG5cdFx0Zm9udF9mYW1pbHk6ICdIZWx2ZXRpY2EnLFxuXHRcdGZvbnRfd2VpZ2h0OiA3MDAsXG5cdFx0YmFja2dyb3VuZDogXCIjRUVFXCIsXG5cdFx0bm9kZV9iYWNrZ3JvdW5kOiAnI2ZkZmRmZCcsXG5cdFx0dmFsaWRhdGU6IHRydWUsXG5cdFx0REVCVUc6IGZhbHNlfSwgb3B0aW9ucyApO1xuXG5cdGlmICggJCggXCIjZnVsbHNjcmVlblwiICkubGVuZ3RoID09PSAwICkge1xuXHRcdC8vIGFkZCB1bmRvLCByZWRvLCBmdWxsc2NyZWVuIGJ1dHRvbnMgYW5kIGV2ZW50IGxpc3RlbmVycyBvbmNlXG5cdFx0cGJ1dHRvbnMuYWRkKG9wdHMpO1xuXHRcdGlvLmFkZChvcHRzKTtcblx0fVxuXG5cdGlmKHBlZGNhY2hlLm5zdG9yZShvcHRzKSA9PSAtMSlcblx0XHRwZWRjYWNoZS5pbml0X2NhY2hlKG9wdHMpO1xuXG5cdHBidXR0b25zLnVwZGF0ZUJ1dHRvbnMob3B0cyk7XG5cblx0Ly8gdmFsaWRhdGUgcGVkaWdyZWUgZGF0YVxuXHR2YWxpZGF0ZV9wZWRpZ3JlZShvcHRzKTtcblx0Ly8gZ3JvdXAgdG9wIGxldmVsIG5vZGVzIGJ5IHBhcnRuZXJzXG5cdG9wdHMuZGF0YXNldCA9IGdyb3VwX3RvcF9sZXZlbChvcHRzLmRhdGFzZXQpO1xuXG5cdGlmKG9wdHMuREVCVUcpXG5cdFx0cGVkaWdyZWVfdXRpbHMucHJpbnRfb3B0cyhvcHRzKTtcblx0bGV0IHN2Z19kaW1lbnNpb25zID0gZ2V0X3N2Z19kaW1lbnNpb25zKG9wdHMpO1xuXHRsZXQgc3ZnID0gZDMuc2VsZWN0KFwiI1wiK29wdHMudGFyZ2V0RGl2KVxuXHRcdFx0XHQgLmFwcGVuZChcInN2ZzpzdmdcIilcblx0XHRcdFx0IC5hdHRyKFwid2lkdGhcIiwgc3ZnX2RpbWVuc2lvbnMud2lkdGgpXG5cdFx0XHRcdCAuYXR0cihcImhlaWdodFwiLCBzdmdfZGltZW5zaW9ucy5oZWlnaHQpO1xuXG5cdHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG5cdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHQuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcblx0XHQuYXR0cihcInJ4XCIsIDYpXG5cdFx0LmF0dHIoXCJyeVwiLCA2KVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBcImRhcmtncmV5XCIpXG5cdFx0LnN0eWxlKFwiZmlsbFwiLCBvcHRzLmJhY2tncm91bmQpIC8vIG9yIG5vbmVcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMSk7XG5cblx0bGV0IHh5dHJhbnNmb3JtID0gcGVkY2FjaGUuZ2V0cG9zaXRpb24ob3B0cyk7ICAvLyBjYWNoZWQgcG9zaXRpb25cblx0bGV0IHh0cmFuc2Zvcm0gPSB4eXRyYW5zZm9ybVswXTtcblx0bGV0IHl0cmFuc2Zvcm0gPSB4eXRyYW5zZm9ybVsxXTtcblx0bGV0IHpvb20gPSAxO1xuXHRpZih4eXRyYW5zZm9ybS5sZW5ndGggPT0gMyl7XG5cdFx0em9vbSA9IHh5dHJhbnNmb3JtWzJdO1xuXHR9XG5cblx0aWYoeHRyYW5zZm9ybSA9PT0gbnVsbCB8fCB5dHJhbnNmb3JtID09PSBudWxsKSB7XG5cdFx0eHRyYW5zZm9ybSA9IG9wdHMuc3ltYm9sX3NpemUvMjtcblx0XHR5dHJhbnNmb3JtID0gKC1vcHRzLnN5bWJvbF9zaXplKjIuNSk7XG5cdH1cblx0bGV0IHBlZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG5cdFx0XHQgLmF0dHIoXCJjbGFzc1wiLCBcImRpYWdyYW1cIilcblx0XHRcdCAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4dHJhbnNmb3JtK1wiLFwiICsgeXRyYW5zZm9ybSArIFwiKSBzY2FsZShcIit6b29tK1wiKVwiKTtcblxuXHRsZXQgdG9wX2xldmVsID0gJC5tYXAob3B0cy5kYXRhc2V0LCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gJ3RvcF9sZXZlbCcgaW4gdmFsICYmIHZhbC50b3BfbGV2ZWwgPyB2YWwgOiBudWxsO30pO1xuXHRsZXQgaGlkZGVuX3Jvb3QgPSB7XG5cdFx0bmFtZSA6ICdoaWRkZW5fcm9vdCcsXG5cdFx0aWQgOiAwLFxuXHRcdGhpZGRlbiA6IHRydWUsXG5cdFx0Y2hpbGRyZW4gOiB0b3BfbGV2ZWxcblx0fTtcblxuXHRsZXQgcGFydG5lcnMgPSBwZWRpZ3JlZV91dGlscy5idWlsZFRyZWUob3B0cywgaGlkZGVuX3Jvb3QsIGhpZGRlbl9yb290KVswXTtcblx0bGV0IHJvb3QgPSBkMy5oaWVyYXJjaHkoaGlkZGVuX3Jvb3QpO1xuXHRyb290c1tvcHRzLnRhcmdldERpdl0gPSByb290O1xuXG5cdC8vIC8gZ2V0IHNjb3JlIGF0IGVhY2ggZGVwdGggdXNlZCB0byBhZGp1c3Qgbm9kZSBzZXBhcmF0aW9uXG5cdGxldCB0cmVlX2RpbWVuc2lvbnMgPSBnZXRfdHJlZV9kaW1lbnNpb25zKG9wdHMpO1xuXHRpZihvcHRzLkRFQlVHKVxuXHRcdGNvbnNvbGUubG9nKCdvcHRzLndpZHRoPScrc3ZnX2RpbWVuc2lvbnMud2lkdGgrJyB3aWR0aD0nK3RyZWVfZGltZW5zaW9ucy53aWR0aCtcblx0XHRcdFx0XHQnIG9wdHMuaGVpZ2h0PScrc3ZnX2RpbWVuc2lvbnMuaGVpZ2h0KycgaGVpZ2h0PScrdHJlZV9kaW1lbnNpb25zLmhlaWdodCk7XG5cblx0bGV0IHRyZWVtYXAgPSBkMy50cmVlKCkuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XG5cdFx0cmV0dXJuIGEucGFyZW50ID09PSBiLnBhcmVudCB8fCBhLmRhdGEuaGlkZGVuIHx8IGIuZGF0YS5oaWRkZW4gPyAxLjIgOiAyLjI7XG5cdH0pLnNpemUoW3RyZWVfZGltZW5zaW9ucy53aWR0aCwgdHJlZV9kaW1lbnNpb25zLmhlaWdodF0pO1xuXG5cdGxldCBub2RlcyA9IHRyZWVtYXAocm9vdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEuZGF0YS5pZCAtIGIuZGF0YS5pZDsgfSkpO1xuXHRsZXQgZmxhdHRlbk5vZGVzID0gbm9kZXMuZGVzY2VuZGFudHMoKTtcblxuXHQvLyBjaGVjayB0aGUgbnVtYmVyIG9mIHZpc2libGUgbm9kZXMgZXF1YWxzIHRoZSBzaXplIG9mIHRoZSBwZWRpZ3JlZSBkYXRhc2V0XG5cdGxldCB2aXNfbm9kZXMgPSAkLm1hcChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtyZXR1cm4gcC5oaWRkZW4gPyBudWxsIDogcDt9KTtcblx0aWYodmlzX25vZGVzLmxlbmd0aCAhPSBvcHRzLmRhdGFzZXQubGVuZ3RoKSB7XG5cdFx0dGhyb3cgY3JlYXRlX2VycignTlVNQkVSIE9GIFZJU0lCTEUgTk9ERVMgRElGRkVSRU5UIFRPIE5VTUJFUiBJTiBUSEUgREFUQVNFVCcpO1xuXHR9XG5cblx0cGVkaWdyZWVfdXRpbHMuYWRqdXN0X2Nvb3JkcyhvcHRzLCBub2RlcywgZmxhdHRlbk5vZGVzKTtcblxuXHRsZXQgcHRyTGlua05vZGVzID0gcGVkaWdyZWVfdXRpbHMubGlua05vZGVzKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnMpO1xuXHRjaGVja19wdHJfbGlua3Mob3B0cywgcHRyTGlua05vZGVzKTsgICAvLyBjaGVjayBmb3IgY3Jvc3Npbmcgb2YgcGFydG5lciBsaW5lc1xuXG5cdGxldCBub2RlID0gcGVkLnNlbGVjdEFsbChcIi5ub2RlXCIpXG5cdFx0XHRcdCAgLmRhdGEobm9kZXMuZGVzY2VuZGFudHMoKSlcblx0XHRcdFx0ICAuZW50ZXIoKVxuXHRcdFx0XHQgIC5hcHBlbmQoXCJnXCIpXG5cdFx0XHRcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XG5cdFx0XHRcdFx0fSk7XG5cblx0Ly8gcHJvdmlkZSBhIGJvcmRlciB0byB0aGUgbm9kZVxuXHRub2RlLmFwcGVuZChcInBhdGhcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuaGlkZGVuO30pXG5cdFx0LmF0dHIoXCJzaGFwZS1yZW5kZXJpbmdcIiwgXCJnZW9tZXRyaWNQcmVjaXNpb25cIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7cmV0dXJuIGQuZGF0YS5zZXggPT0gXCJVXCIgJiYgIShkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKSA/IFwicm90YXRlKDQ1KVwiIDogXCJcIjt9KVxuXHRcdC5hdHRyKFwiZFwiLCBkMy5zeW1ib2woKS5zaXplKGZ1bmN0aW9uKF9kKSB7IHJldHVybiAob3B0cy5zeW1ib2xfc2l6ZSAqIG9wdHMuc3ltYm9sX3NpemUpICsgMjt9KVxuXHRcdFx0XHQudHlwZShmdW5jdGlvbihkKSB7XG5cdFx0XHRcdFx0aWYoZC5kYXRhLm1pc2NhcnJpYWdlIHx8IGQuZGF0YS50ZXJtaW5hdGlvbilcblx0XHRcdFx0XHRcdHJldHVybiBkMy5zeW1ib2xUcmlhbmdsZTtcblx0XHRcdFx0XHRyZXR1cm4gZC5kYXRhLnNleCA9PSBcIkZcIiA/IGQzLnN5bWJvbENpcmNsZSA6IGQzLnN5bWJvbFNxdWFyZTt9KSlcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHJldHVybiBkLmRhdGEuYWdlICYmIGQuZGF0YS55b2IgJiYgIWQuZGF0YS5leGNsdWRlID8gXCIjMzAzMDMwXCIgOiBcImdyZXlcIjtcblx0XHR9KVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0cmV0dXJuIGQuZGF0YS5hZ2UgJiYgZC5kYXRhLnlvYiAmJiAhZC5kYXRhLmV4Y2x1ZGUgPyBcIi4zZW1cIiA6IFwiLjFlbVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBmdW5jdGlvbiAoZCkge3JldHVybiAhZC5kYXRhLmV4Y2x1ZGUgPyBudWxsIDogKFwiMywgM1wiKTt9KVxuXHRcdC5zdHlsZShcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cdC8vIHNldCBhIGNsaXBwYXRoXG5cdG5vZGUuYXBwZW5kKFwiY2xpcFBhdGhcIilcblx0XHQuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQuZGF0YS5uYW1lO30pLmFwcGVuZChcInBhdGhcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuICEoZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyk7fSlcblx0XHQuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5kYXRhLnNleCA9PSBcIlVcIiAmJiAhKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pID8gXCJyb3RhdGUoNDUpXCIgOiBcIlwiO30pXG5cdFx0LmF0dHIoXCJkXCIsIGQzLnN5bWJvbCgpLnNpemUoZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZiAoZC5kYXRhLmhpZGRlbilcblx0XHRcdFx0XHRyZXR1cm4gb3B0cy5zeW1ib2xfc2l6ZSAqIG9wdHMuc3ltYm9sX3NpemUgLyA1O1xuXHRcdFx0XHRyZXR1cm4gb3B0cy5zeW1ib2xfc2l6ZSAqIG9wdHMuc3ltYm9sX3NpemU7XG5cdFx0XHR9KVxuXHRcdFx0LnR5cGUoZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZihkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKVxuXHRcdFx0XHRcdHJldHVybiBkMy5zeW1ib2xUcmlhbmdsZTtcblx0XHRcdFx0cmV0dXJuIGQuZGF0YS5zZXggPT0gXCJGXCIgPyBkMy5zeW1ib2xDaXJjbGUgOmQzLnN5bWJvbFNxdWFyZTt9KSk7XG5cblx0Ly8gcGllIHBsb3RzIGZvciBkaXNlYXNlIGNvbG91cnNcblx0bGV0IHBpZW5vZGUgPSBub2RlLnNlbGVjdEFsbChcInBpZW5vZGVcIilcblx0ICAgLmRhdGEoZnVuY3Rpb24oZCkge1x0IFx0XHQvLyBzZXQgdGhlIGRpc2Vhc2UgZGF0YSBmb3IgdGhlIHBpZSBwbG90XG5cdFx0ICAgbGV0IG5jYW5jZXJzID0gMDtcblx0XHQgICBsZXQgY2FuY2VycyA9ICQubWFwKG9wdHMuZGlzZWFzZXMsIGZ1bmN0aW9uKHZhbCwgaSl7XG5cdFx0XHQgICBpZihwcmVmaXhJbk9iaihvcHRzLmRpc2Vhc2VzW2ldLnR5cGUsIGQuZGF0YSkpIHtuY2FuY2VycysrOyByZXR1cm4gMTt9IGVsc2UgcmV0dXJuIDA7XG5cdFx0ICAgfSk7XG5cdFx0ICAgaWYobmNhbmNlcnMgPT09IDApIGNhbmNlcnMgPSBbMV07XG5cdFx0ICAgcmV0dXJuIFskLm1hcChjYW5jZXJzLCBmdW5jdGlvbih2YWwsIF9pKXtcblx0XHRcdCAgIHJldHVybiB7J2NhbmNlcic6IHZhbCwgJ25jYW5jZXJzJzogbmNhbmNlcnMsICdpZCc6IGQuZGF0YS5uYW1lLFxuXHRcdFx0XHRcdFx0J3NleCc6IGQuZGF0YS5zZXgsICdwcm9iYW5kJzogZC5kYXRhLnByb2JhbmQsICdoaWRkZW4nOiBkLmRhdGEuaGlkZGVuLFxuXHRcdFx0XHRcdFx0J2FmZmVjdGVkJzogZC5kYXRhLmFmZmVjdGVkLFxuXHRcdFx0XHRcdFx0J2V4Y2x1ZGUnOiBkLmRhdGEuZXhjbHVkZX07fSldO1xuXHQgICB9KVxuXHQgICAuZW50ZXIoKVxuXHRcdC5hcHBlbmQoXCJnXCIpO1xuXG5cdHBpZW5vZGUuc2VsZWN0QWxsKFwicGF0aFwiKVxuXHRcdC5kYXRhKGQzLnBpZSgpLnZhbHVlKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jYW5jZXI7fSkpXG5cdFx0LmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuXHRcdFx0LmF0dHIoXCJjbGlwLXBhdGhcIiwgZnVuY3Rpb24oZCkge3JldHVybiBcInVybCgjXCIrZC5kYXRhLmlkK1wiKVwiO30pIC8vIGNsaXAgdGhlIHJlY3RhbmdsZVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBpZW5vZGVcIilcblx0XHRcdC5hdHRyKFwiZFwiLCBkMy5hcmMoKS5pbm5lclJhZGl1cygwKS5vdXRlclJhZGl1cyhvcHRzLnN5bWJvbF9zaXplKSlcblx0XHRcdC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0XHRpZihkLmRhdGEuZXhjbHVkZSlcblx0XHRcdFx0XHRyZXR1cm4gJ2xpZ2h0Z3JleSc7XG5cdFx0XHRcdGlmKGQuZGF0YS5uY2FuY2VycyA9PT0gMCkge1xuXHRcdFx0XHRcdGlmKGQuZGF0YS5hZmZlY3RlZClcblx0XHRcdFx0XHRcdHJldHVybiAnZGFya2dyZXknO1xuXHRcdFx0XHRcdHJldHVybiBvcHRzLm5vZGVfYmFja2dyb3VuZDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gb3B0cy5kaXNlYXNlc1tpXS5jb2xvdXI7XG5cdFx0XHR9KTtcblxuXHQvLyBhZG9wdGVkIGluL291dCBicmFja2V0c1xuXHRub2RlLmFwcGVuZChcInBhdGhcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuaGlkZGVuICYmIChkLmRhdGEuYWRvcHRlZF9pbiB8fCBkLmRhdGEuYWRvcHRlZF9vdXQpO30pXG5cdFx0LmF0dHIoXCJkXCIsIGZ1bmN0aW9uKF9kKSB7IHtcblx0XHRcdGxldCBkeCA9IC0ob3B0cy5zeW1ib2xfc2l6ZSAqIDAuNjYpO1xuXHRcdFx0bGV0IGR5ID0gLShvcHRzLnN5bWJvbF9zaXplICogMC42NCk7XG5cdFx0XHRsZXQgaW5kZW50ID0gb3B0cy5zeW1ib2xfc2l6ZS80O1xuXHRcdFx0cmV0dXJuIGdldF9icmFja2V0KGR4LCBkeSwgaW5kZW50LCBvcHRzKStnZXRfYnJhY2tldCgtZHgsIGR5LCAtaW5kZW50LCBvcHRzKTtcblx0XHRcdH19KVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0cmV0dXJuIGQuZGF0YS5hZ2UgJiYgZC5kYXRhLnlvYiAmJiAhZC5kYXRhLmV4Y2x1ZGUgPyBcIiMzMDMwMzBcIiA6IFwiZ3JleVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChfZCkge1xuXHRcdFx0cmV0dXJuIFwiLjFlbVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBmdW5jdGlvbiAoZCkge3JldHVybiAhZC5kYXRhLmV4Y2x1ZGUgPyBudWxsIDogKFwiMywgM1wiKTt9KVxuXHRcdC5zdHlsZShcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cblx0Ly8gYWxpdmUgc3RhdHVzID0gMDsgZGVhZCBzdGF0dXMgPSAxXG5cdG5vZGUuYXBwZW5kKCdsaW5lJylcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQuZGF0YS5zdGF0dXMgPT0gMTt9KVxuXHRcdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHRcdC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIC0wLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KVxuXHRcdFx0LmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gMC42Km9wdHMuc3ltYm9sX3NpemU7fSlcblx0XHRcdC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIDAuNipvcHRzLnN5bWJvbF9zaXplO30pXG5cdFx0XHQuYXR0cihcInkyXCIsIGZ1bmN0aW9uKF9kLCBfaSkge3JldHVybiAtMC42Km9wdHMuc3ltYm9sX3NpemU7fSk7XG5cblx0Ly8gbmFtZXMgb2YgaW5kaXZpZHVhbHNcblx0YWRkTGFiZWwob3B0cywgbm9kZSwgXCIuMjVlbVwiLCAtKDAuNCAqIG9wdHMuc3ltYm9sX3NpemUpLCAtKDAuMSAqIG9wdHMuc3ltYm9sX3NpemUpLFxuXHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRcdHJldHVybiAoJ2Rpc3BsYXlfbmFtZScgaW4gZC5kYXRhID8gZC5kYXRhLmRpc3BsYXlfbmFtZSA6IGQuZGF0YS5uYW1lKSArICcgICcgKyBkLmRhdGEuaWQ7XG5cdFx0XHRcdHJldHVybiAnZGlzcGxheV9uYW1lJyBpbiBkLmRhdGEgPyBkLmRhdGEuZGlzcGxheV9uYW1lIDogJyc7fSk7XG5cbi8qXG4gKiBsZXQgd2FybiA9IG5vZGUuZmlsdGVyKGZ1bmN0aW9uIChkKSB7IHJldHVybiAoIWQuZGF0YS5hZ2UgfHwgIWQuZGF0YS55b2IpICYmICFkLmRhdGEuaGlkZGVuOyB9KS5hcHBlbmQoXCJ0ZXh0XCIpIC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG4gKiAuYXR0cihcInhcIiwgXCIuMjVlbVwiKSAuYXR0cihcInlcIiwgLSgwLjQgKiBvcHRzLnN5bWJvbF9zaXplKSwgLSgwLjIgKiBvcHRzLnN5bWJvbF9zaXplKSkgLmh0bWwoXCJcXHVmMDcxXCIpOyB3YXJuLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiaW5jb21wbGV0ZVwiKTtcbiAqL1xuXG5cdGxldCBmb250X3NpemUgPSBwYXJzZUludChnZXRQeChvcHRzKSkgKyA0O1xuXHQvLyBkaXNwbGF5IGxhYmVsIGRlZmluZWQgaW4gb3B0cy5sYWJlbHMgZS5nLiBhbGxlbGVzL2dlbm90eXBlIGRhdGFcblx0Zm9yKGxldCBpbGFiPTA7IGlsYWI8b3B0cy5sYWJlbHMubGVuZ3RoOyBpbGFiKyspIHtcblx0XHRsZXQgbGFiZWwgPSBvcHRzLmxhYmVsc1tpbGFiXTtcblx0XHRhZGRMYWJlbChvcHRzLCBub2RlLCBcIi4yNWVtXCIsIC0oMC43ICogb3B0cy5zeW1ib2xfc2l6ZSksXG5cdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKCFkLmRhdGFbbGFiZWxdKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0ZC55X29mZnNldCA9IChpbGFiID09PSAwIHx8ICFkLnlfb2Zmc2V0ID8gZm9udF9zaXplKjIuMjUgOiBkLnlfb2Zmc2V0K2ZvbnRfc2l6ZSk7XG5cdFx0XHRcdHJldHVybiBkLnlfb2Zmc2V0O1xuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYoZC5kYXRhW2xhYmVsXSkge1xuXHRcdFx0XHRcdGlmKGxhYmVsID09PSAnYWxsZWxlcycpIHtcblx0XHRcdFx0XHRcdGxldCBhbGxlbGVzID0gXCJcIjtcblx0XHRcdFx0XHRcdGxldCB2YXJzID0gZC5kYXRhLmFsbGVsZXMuc3BsaXQoJzsnKTtcblx0XHRcdFx0XHRcdGZvcihsZXQgaXZhciA9IDA7aXZhciA8IHZhcnMubGVuZ3RoO2l2YXIrKykge1xuXHRcdFx0XHRcdFx0XHRpZih2YXJzW2l2YXJdICE9PSBcIlwiKSBhbGxlbGVzICs9IHZhcnNbaXZhcl0gKyAnOyc7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gYWxsZWxlcztcblx0XHRcdFx0XHR9IGVsc2UgaWYobGFiZWwgPT09ICdhZ2UnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZC5kYXRhW2xhYmVsXSArJ3knO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihsYWJlbCA9PT0gJ3N0aWxsYmlydGgnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJTQlwiO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gZC5kYXRhW2xhYmVsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgJ2luZGlfZGV0YWlscycpO1xuXHR9XG5cblx0Ly8gaW5kaXZpZHVhbHMgZGlzZWFzZSBkZXRhaWxzXG5cdGZvcihsZXQgaT0wO2k8b3B0cy5kaXNlYXNlcy5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkaXNlYXNlID0gb3B0cy5kaXNlYXNlc1tpXS50eXBlO1xuXHRcdGFkZExhYmVsKG9wdHMsIG5vZGUsIFwiLjI1ZW1cIiwgLShvcHRzLnN5bWJvbF9zaXplKSxcblx0XHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRcdGxldCB5X29mZnNldCA9IChkLnlfb2Zmc2V0ID8gZC55X29mZnNldCtmb250X3NpemU6IGZvbnRfc2l6ZSoyLjIpO1xuXHRcdFx0XHRcdGZvcihsZXQgaj0wO2o8b3B0cy5kaXNlYXNlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0aWYoZGlzZWFzZSA9PT0gb3B0cy5kaXNlYXNlc1tqXS50eXBlKVxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGlmKHByZWZpeEluT2JqKG9wdHMuZGlzZWFzZXNbal0udHlwZSwgZC5kYXRhKSlcblx0XHRcdFx0XHRcdFx0eV9vZmZzZXQgKz0gZm9udF9zaXplLTE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB5X29mZnNldDtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRcdGxldCBkaXMgPSBkaXNlYXNlLnJlcGxhY2UoJ18nLCAnICcpLnJlcGxhY2UoJ2NhbmNlcicsICdjYS4nKTtcblx0XHRcdFx0XHRyZXR1cm4gZGlzZWFzZSsnX2RpYWdub3Npc19hZ2UnIGluIGQuZGF0YSA/IGRpcyArXCI6IFwiKyBkLmRhdGFbZGlzZWFzZSsnX2RpYWdub3Npc19hZ2UnXSA6ICcnO1xuXHRcdFx0XHR9LCAnaW5kaV9kZXRhaWxzJyk7XG5cdH1cblxuXHQvL1xuXHRhZGRXaWRnZXRzKG9wdHMsIG5vZGUpO1xuXG5cdC8vIGxpbmtzIGJldHdlZW4gcGFydG5lcnNcblx0bGV0IGNsYXNoX2RlcHRoID0ge307XG5cdFxuXHQvLyBnZXQgcGF0aCBsb29waW5nIG92ZXIgbm9kZShzKVxuXHRsZXQgZHJhd19wYXRoID0gZnVuY3Rpb24oY2xhc2gsIGR4LCBkeTEsIGR5MiwgcGFyZW50X25vZGUsIGNzaGlmdCkge1xuXHRcdGxldCBleHRlbmQgPSBmdW5jdGlvbihpLCBsKSB7XG5cdFx0XHRpZihpKzEgPCBsKSAgIC8vICYmIE1hdGguYWJzKGNsYXNoW2ldIC0gY2xhc2hbaSsxXSkgPCAob3B0cy5zeW1ib2xfc2l6ZSoxLjI1KVxuXHRcdFx0XHRyZXR1cm4gZXh0ZW5kKCsraSk7XG5cdFx0XHRyZXR1cm4gaTtcblx0XHR9O1xuXHRcdGxldCBwYXRoID0gXCJcIjtcblx0XHRmb3IobGV0IGo9MDsgajxjbGFzaC5sZW5ndGg7IGorKykge1xuXHRcdFx0bGV0IGsgPSBleHRlbmQoaiwgY2xhc2gubGVuZ3RoKTtcblx0XHRcdGxldCBkeDEgPSBjbGFzaFtqXSAtIGR4IC0gY3NoaWZ0O1xuXHRcdFx0bGV0IGR4MiA9IGNsYXNoW2tdICsgZHggKyBjc2hpZnQ7XG5cdFx0XHRpZihwYXJlbnRfbm9kZS54ID4gZHgxICYmIHBhcmVudF9ub2RlLnggPCBkeDIpXG5cdFx0XHRcdHBhcmVudF9ub2RlLnkgPSBkeTI7XG5cblx0XHRcdHBhdGggKz0gXCJMXCIgKyBkeDEgKyBcIixcIiArICAoZHkxIC0gY3NoaWZ0KSArXG5cdFx0XHRcdFx0XCJMXCIgKyBkeDEgKyBcIixcIiArICAoZHkyIC0gY3NoaWZ0KSArXG5cdFx0XHRcdFx0XCJMXCIgKyBkeDIgKyBcIixcIiArICAoZHkyIC0gY3NoaWZ0KSArXG5cdFx0XHRcdFx0XCJMXCIgKyBkeDIgKyBcIixcIiArICAoZHkxIC0gY3NoaWZ0KTtcblx0XHRcdGogPSBrO1xuXHRcdH1cblx0XHRyZXR1cm4gcGF0aDtcblx0fVxuXHRcblx0XG5cdHBhcnRuZXJzID0gcGVkLnNlbGVjdEFsbChcIi5wYXJ0bmVyXCIpXG5cdFx0LmRhdGEocHRyTGlua05vZGVzKVxuXHRcdC5lbnRlcigpXG5cdFx0XHQuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcblx0XHRcdC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsIFwiIzAwMFwiKVxuXHRcdFx0LmF0dHIoXCJzaGFwZS1yZW5kZXJpbmdcIiwgXCJhdXRvXCIpXG5cdFx0XHQuYXR0cignZCcsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGxldCBub2RlMSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLm1vdGhlci5kYXRhLm5hbWUpO1xuXHRcdFx0XHRsZXQgbm9kZTIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5mYXRoZXIuZGF0YS5uYW1lKTtcblx0XHRcdFx0bGV0IGNvbnNhbmd1aXR5ID0gcGVkaWdyZWVfdXRpbHMuY29uc2FuZ3VpdHkobm9kZTEsIG5vZGUyLCBvcHRzKTtcblx0XHRcdFx0bGV0IGRpdm9yY2VkID0gKGQubW90aGVyLmRhdGEuZGl2b3JjZWQgJiYgIGQubW90aGVyLmRhdGEuZGl2b3JjZWQgPT09IGQuZmF0aGVyLmRhdGEubmFtZSk7XG5cblx0XHRcdFx0bGV0IHgxID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5tb3RoZXIueCA6IGQuZmF0aGVyLngpO1xuXHRcdFx0XHRsZXQgeDIgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLmZhdGhlci54IDogZC5tb3RoZXIueCk7XG5cdFx0XHRcdGxldCBkeTEgPSBkLm1vdGhlci55O1xuXHRcdFx0XHRsZXQgZHkyLCBkeCwgcGFyZW50X25vZGU7XG5cblx0XHRcdFx0Ly8gaWRlbnRpZnkgY2xhc2hlcyB3aXRoIG90aGVyIG5vZGVzIGF0IHRoZSBzYW1lIGRlcHRoXG5cdFx0XHRcdGxldCBjbGFzaCA9IGNoZWNrX3B0cl9saW5rX2NsYXNoZXMob3B0cywgZCk7XG5cdFx0XHRcdGxldCBwYXRoID0gXCJcIjtcblx0XHRcdFx0aWYoY2xhc2gpIHtcblx0XHRcdFx0XHRpZihkLm1vdGhlci5kZXB0aCBpbiBjbGFzaF9kZXB0aClcblx0XHRcdFx0XHRcdGNsYXNoX2RlcHRoW2QubW90aGVyLmRlcHRoXSArPSA0O1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNsYXNoX2RlcHRoW2QubW90aGVyLmRlcHRoXSA9IDQ7XG5cblx0XHRcdFx0XHRkeTEgLT0gY2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdO1xuXHRcdFx0XHRcdGR4ID0gY2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdICsgb3B0cy5zeW1ib2xfc2l6ZS8yICsgMjtcblxuXHRcdFx0XHRcdGxldCBwYXJlbnRfbm9kZXMgPSBkLm1vdGhlci5kYXRhLnBhcmVudF9ub2RlO1xuXHRcdFx0XHRcdGxldCBwYXJlbnRfbm9kZV9uYW1lID0gcGFyZW50X25vZGVzWzBdO1xuXHRcdFx0XHRcdGZvcihsZXQgaWk9MDsgaWk8cGFyZW50X25vZGVzLmxlbmd0aDsgaWkrKykge1xuXHRcdFx0XHRcdFx0aWYocGFyZW50X25vZGVzW2lpXS5mYXRoZXIubmFtZSA9PT0gZC5mYXRoZXIuZGF0YS5uYW1lICYmXG5cdFx0XHRcdFx0XHQgICBwYXJlbnRfbm9kZXNbaWldLm1vdGhlci5uYW1lID09PSBkLm1vdGhlci5kYXRhLm5hbWUpXG5cdFx0XHRcdFx0XHRcdHBhcmVudF9ub2RlX25hbWUgPSBwYXJlbnRfbm9kZXNbaWldLm5hbWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHBhcmVudF9ub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcmVudF9ub2RlX25hbWUpO1xuXHRcdFx0XHRcdHBhcmVudF9ub2RlLnkgPSBkeTE7IC8vIGFkanVzdCBoZ3Qgb2YgcGFyZW50IG5vZGVcblx0XHRcdFx0XHRjbGFzaC5zb3J0KGZ1bmN0aW9uIChhLGIpIHtyZXR1cm4gYSAtIGI7fSk7XG5cblx0XHRcdFx0XHRkeTIgPSAoZHkxLW9wdHMuc3ltYm9sX3NpemUvMi0zKTtcblx0XHRcdFx0XHRwYXRoID0gZHJhd19wYXRoKGNsYXNoLCBkeCwgZHkxLCBkeTIsIHBhcmVudF9ub2RlLCAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBkaXZvcmNlX3BhdGggPSBcIlwiO1xuXHRcdFx0XHRpZihkaXZvcmNlZCAmJiAhY2xhc2gpXG5cdFx0XHRcdFx0ZGl2b3JjZV9wYXRoID0gXCJNXCIgKyAoeDErKCh4Mi14MSkqLjY2KSs2KSArIFwiLFwiICsgKGR5MS02KSArXG5cdFx0XHRcdFx0XHRcdFx0ICAgXCJMXCIrICAoeDErKCh4Mi14MSkqLjY2KS02KSArIFwiLFwiICsgKGR5MSs2KSArXG5cdFx0XHRcdFx0XHRcdFx0ICAgXCJNXCIgKyAoeDErKCh4Mi14MSkqLjY2KSsxMCkgKyBcIixcIiArIChkeTEtNikgK1xuXHRcdFx0XHRcdFx0XHRcdCAgIFwiTFwiKyAgKHgxKygoeDIteDEpKi42NiktMikgICsgXCIsXCIgKyAoZHkxKzYpO1xuXHRcdFx0XHRpZihjb25zYW5ndWl0eSkgeyAgLy8gY29uc2FuZ3Vpbm91cywgZHJhdyBkb3VibGUgbGluZSBiZXR3ZWVuIHBhcnRuZXJzXG5cdFx0XHRcdFx0ZHkxID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5tb3RoZXIueSA6IGQuZmF0aGVyLnkpO1xuXHRcdFx0XHRcdGR5MiA9IChkLm1vdGhlci54IDwgZC5mYXRoZXIueCA/IGQuZmF0aGVyLnkgOiBkLm1vdGhlci55KTtcblxuXHRcdFx0XHRcdGxldCBjc2hpZnQgPSAzO1xuXHRcdFx0XHRcdGlmKE1hdGguYWJzKGR5MS1keTIpID4gMC4xKSB7XHQgIC8vIERJRkZFUkVOVCBMRVZFTFxuXHRcdFx0XHRcdFx0cmV0dXJuXHRcIk1cIiArIHgxICsgXCIsXCIgKyBkeTEgKyBcIkxcIiArIHgyICsgXCIsXCIgKyBkeTIgK1xuXHRcdFx0XHRcdFx0XHRcdFwiTVwiICsgeDEgKyBcIixcIiArIChkeTEgLSBjc2hpZnQpICsgXCJMXCIgKyB4MiArIFwiLFwiICsgKGR5MiAtIGNzaGlmdCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcdFx0XHRcdFx0XHQgICAvLyBTQU1FIExFVkVMXG5cdFx0XHRcdFx0XHRsZXQgcGF0aDIgPSAoY2xhc2ggPyBkcmF3X3BhdGgoY2xhc2gsIGR4LCBkeTEsIGR5MiwgcGFyZW50X25vZGUsIGNzaGlmdCkgOiBcIlwiKTtcblx0XHRcdFx0XHRcdHJldHVyblx0XCJNXCIgKyB4MSArIFwiLFwiICsgZHkxICsgcGF0aCArIFwiTFwiICsgeDIgKyBcIixcIiArIGR5MSArXG5cdFx0XHRcdFx0XHRcdFx0XCJNXCIgKyB4MSArIFwiLFwiICsgKGR5MSAtIGNzaGlmdCkgKyBwYXRoMiArIFwiTFwiICsgeDIgKyBcIixcIiArIChkeTEgLSBjc2hpZnQpICsgZGl2b3JjZV9wYXRoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm5cdFwiTVwiICsgeDEgKyBcIixcIiArIGR5MSArIHBhdGggKyBcIkxcIiArIHgyICsgXCIsXCIgKyBkeTEgKyBkaXZvcmNlX3BhdGg7XG5cdFx0XHR9KTtcblxuXHQvLyBsaW5rcyB0byBjaGlsZHJlblxuXHRwZWQuc2VsZWN0QWxsKFwiLmxpbmtcIilcblx0XHQuZGF0YShyb290LmxpbmtzKG5vZGVzLmRlc2NlbmRhbnRzKCkpKVxuXHRcdC5lbnRlcigpXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdC8vIGZpbHRlciB1bmxlc3MgZGVidWcgaXMgc2V0XG5cdFx0XHRcdHJldHVybiAob3B0cy5ERUJVRyB8fFxuXHRcdFx0XHRcdFx0KGQudGFyZ2V0LmRhdGEubm9wYXJlbnRzID09PSB1bmRlZmluZWQgJiYgZC5zb3VyY2UucGFyZW50ICE9PSBudWxsICYmICFkLnRhcmdldC5kYXRhLmhpZGRlbikpO1xuXHRcdFx0fSlcblx0XHRcdC5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuXHRcdFx0LmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5ub3BhcmVudHMgIT09IHVuZGVmaW5lZCB8fCBkLnNvdXJjZS5wYXJlbnQgPT09IG51bGwgfHwgZC50YXJnZXQuZGF0YS5oaWRkZW4pXG5cdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdHJldHVybiAob3B0cy5ERUJVRyA/IDIgOiAxKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm5vcGFyZW50cyAhPT0gdW5kZWZpbmVkIHx8IGQuc291cmNlLnBhcmVudCA9PT0gbnVsbCB8fCBkLnRhcmdldC5kYXRhLmhpZGRlbilcblx0XHRcdFx0XHRyZXR1cm4gJ3BpbmsnO1xuXHRcdFx0XHRyZXR1cm4gXCIjMDAwXCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKCFkLnRhcmdldC5kYXRhLmFkb3B0ZWRfaW4pIHJldHVybiBudWxsO1xuXHRcdFx0XHRsZXQgZGFzaF9sZW4gPSBNYXRoLmFicyhkLnNvdXJjZS55LSgoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpIC8gMikpO1xuXHRcdFx0XHRsZXQgZGFzaF9hcnJheSA9IFtkYXNoX2xlbiwgMCwgTWF0aC5hYnMoZC5zb3VyY2UueC1kLnRhcmdldC54KSwgMF07XG5cdFx0XHRcdGxldCB0d2lucyA9IHBlZGlncmVlX3V0aWxzLmdldFR3aW5zKG9wdHMuZGF0YXNldCwgZC50YXJnZXQuZGF0YSk7XG5cdFx0XHRcdGlmKHR3aW5zLmxlbmd0aCA+PSAxKSBkYXNoX2xlbiA9IGRhc2hfbGVuICogMztcblx0XHRcdFx0Zm9yKGxldCB1c2VkbGVuID0gMDsgdXNlZGxlbiA8IGRhc2hfbGVuOyB1c2VkbGVuICs9IDEwKVxuXHRcdFx0XHRcdCQubWVyZ2UoZGFzaF9hcnJheSwgWzUsIDVdKTtcblx0XHRcdFx0cmV0dXJuIGRhc2hfYXJyYXk7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJzaGFwZS1yZW5kZXJpbmdcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5tenR3aW4gfHwgZC50YXJnZXQuZGF0YS5kenR3aW4pXG5cdFx0XHRcdFx0cmV0dXJuIFwiZ2VvbWV0cmljUHJlY2lzaW9uXCI7XG5cdFx0XHRcdHJldHVybiBcImF1dG9cIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImRcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5tenR3aW4gfHwgZC50YXJnZXQuZGF0YS5kenR3aW4pIHtcblx0XHRcdFx0XHQvLyBnZXQgdHdpbiBwb3NpdGlvblxuXHRcdFx0XHRcdGxldCB0d2lucyA9IHBlZGlncmVlX3V0aWxzLmdldFR3aW5zKG9wdHMuZGF0YXNldCwgZC50YXJnZXQuZGF0YSk7XG5cdFx0XHRcdFx0aWYodHdpbnMubGVuZ3RoID49IDEpIHtcblx0XHRcdFx0XHRcdGxldCB0d2lueCA9IDA7XG5cdFx0XHRcdFx0XHRsZXQgeG1pbiA9IGQudGFyZ2V0Lng7XG5cdFx0XHRcdFx0XHRsZXQgeG1heCA9IGQudGFyZ2V0Lng7XG5cdFx0XHRcdFx0XHRmb3IobGV0IHQ9MDsgdDx0d2lucy5sZW5ndGg7IHQrKykge1xuXHRcdFx0XHRcdFx0XHRsZXQgdGhpc3ggPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgdHdpbnNbdF0ubmFtZSkueDtcblx0XHRcdFx0XHRcdFx0aWYoeG1pbiA+IHRoaXN4KSB4bWluID0gdGhpc3g7XG5cdFx0XHRcdFx0XHRcdGlmKHhtYXggPCB0aGlzeCkgeG1heCA9IHRoaXN4O1xuXHRcdFx0XHRcdFx0XHR0d2lueCArPSB0aGlzeDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHhtaWQgPSAoKGQudGFyZ2V0LnggKyB0d2lueCkgLyAodHdpbnMubGVuZ3RoKzEpKTtcblx0XHRcdFx0XHRcdGxldCB5bWlkID0gKChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkgLyAyKTtcblxuXHRcdFx0XHRcdFx0bGV0IHhoYmFyID0gXCJcIjtcblx0XHRcdFx0XHRcdGlmKHhtaW4gPT09IGQudGFyZ2V0LnggJiYgZC50YXJnZXQuZGF0YS5tenR3aW4pIHtcblx0XHRcdFx0XHRcdFx0Ly8gaG9yaXpvbnRhbCBiYXIgZm9yIG16dHdpbnNcblx0XHRcdFx0XHRcdFx0bGV0IHh4ID0gKHhtaWQgKyBkLnRhcmdldC54KS8yO1xuXHRcdFx0XHRcdFx0XHRsZXQgeXkgPSAoeW1pZCArIChkLnRhcmdldC55LW9wdHMuc3ltYm9sX3NpemUvMikpLzI7XG5cdFx0XHRcdFx0XHRcdHhoYmFyID0gXCJNXCIgKyB4eCArIFwiLFwiICsgeXkgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XCJMXCIgKyAoeG1pZCArICh4bWlkLXh4KSkgKyBcIiBcIiArIHl5O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJNXCIgKyAoZC5zb3VyY2UueCkgKyBcIixcIiArIChkLnNvdXJjZS55ICkgK1xuXHRcdFx0XHRcdFx0XHQgICBcIlZcIiArIHltaWQgK1xuXHRcdFx0XHRcdFx0XHQgICBcIkhcIiArIHhtaWQgK1xuXHRcdFx0XHRcdFx0XHQgICBcIkxcIiArIChkLnRhcmdldC54KSArIFwiIFwiICsgKGQudGFyZ2V0Lnktb3B0cy5zeW1ib2xfc2l6ZS8yKSArXG5cdFx0XHRcdFx0XHRcdCAgIHhoYmFyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKGQuc291cmNlLmRhdGEubW90aGVyKSB7ICAgLy8gY2hlY2sgcGFyZW50cyBkZXB0aCB0byBzZWUgaWYgdGhleSBhcmUgYXQgdGhlIHNhbWUgbGV2ZWwgaW4gdGhlIHRyZWVcblx0XHRcdFx0XHRsZXQgbWEgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5zb3VyY2UuZGF0YS5tb3RoZXIubmFtZSk7XG5cdFx0XHRcdFx0bGV0IHBhID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGQuc291cmNlLmRhdGEuZmF0aGVyLm5hbWUpO1xuXG5cdFx0XHRcdFx0aWYobWEuZGVwdGggIT09IHBhLmRlcHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJNXCIgKyAoZC5zb3VyY2UueCkgKyBcIixcIiArICgobWEueSArIHBhLnkpIC8gMikgK1xuXHRcdFx0XHRcdFx0XHQgICBcIkhcIiArIChkLnRhcmdldC54KSArXG5cdFx0XHRcdFx0XHRcdCAgIFwiVlwiICsgKGQudGFyZ2V0LnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBcIk1cIiArIChkLnNvdXJjZS54KSArIFwiLFwiICsgKGQuc291cmNlLnkgKSArXG5cdFx0XHRcdFx0ICAgXCJWXCIgKyAoKGQuc291cmNlLnkgKyBkLnRhcmdldC55KSAvIDIpICtcblx0XHRcdFx0XHQgICBcIkhcIiArIChkLnRhcmdldC54KSArXG5cdFx0XHRcdFx0ICAgXCJWXCIgKyAoZC50YXJnZXQueSk7XG5cdFx0XHR9KTtcblxuXHQvLyBkcmF3IHByb2JhbmQgYXJyb3dcblx0bGV0IHByb2JhbmRJZHggID0gcGVkaWdyZWVfdXRpbHMuZ2V0UHJvYmFuZEluZGV4KG9wdHMuZGF0YXNldCk7XG5cdGlmKHR5cGVvZiBwcm9iYW5kSWR4ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGxldCBwcm9iYW5kTm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBvcHRzLmRhdGFzZXRbcHJvYmFuZElkeF0ubmFtZSk7XG5cdFx0bGV0IHRyaWlkID0gXCJ0cmlhbmdsZVwiK3BlZGlncmVlX3V0aWxzLm1ha2VpZCgzKTtcblx0XHRwZWQuYXBwZW5kKFwic3ZnOmRlZnNcIikuYXBwZW5kKFwic3ZnOm1hcmtlclwiKVx0Ly8gYXJyb3cgaGVhZFxuXHRcdFx0LmF0dHIoXCJpZFwiLCB0cmlpZClcblx0XHRcdC5hdHRyKFwicmVmWFwiLCA2KVxuXHRcdFx0LmF0dHIoXCJyZWZZXCIsIDYpXG5cdFx0XHQuYXR0cihcIm1hcmtlcldpZHRoXCIsIDIwKVxuXHRcdFx0LmF0dHIoXCJtYXJrZXJIZWlnaHRcIiwgMjApXG5cdFx0XHQuYXR0cihcIm9yaWVudFwiLCBcImF1dG9cIilcblx0XHRcdC5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0XHQuYXR0cihcImRcIiwgXCJNIDAgMCAxMiA2IDAgMTIgMyA2XCIpXG5cdFx0XHQuc3R5bGUoXCJmaWxsXCIsIFwiYmxhY2tcIik7XG5cblx0XHRwZWQuYXBwZW5kKFwibGluZVwiKVxuXHRcdFx0LmF0dHIoXCJ4MVwiLCBwcm9iYW5kTm9kZS54LW9wdHMuc3ltYm9sX3NpemUpXG5cdFx0XHQuYXR0cihcInkxXCIsIHByb2JhbmROb2RlLnkrb3B0cy5zeW1ib2xfc2l6ZSlcblx0XHRcdC5hdHRyKFwieDJcIiwgcHJvYmFuZE5vZGUueC1vcHRzLnN5bWJvbF9zaXplLzIpXG5cdFx0XHQuYXR0cihcInkyXCIsIHByb2JhbmROb2RlLnkrb3B0cy5zeW1ib2xfc2l6ZS8yKVxuXHRcdFx0LmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHRcdC5hdHRyKFwibWFya2VyLWVuZFwiLCBcInVybCgjXCIrdHJpaWQrXCIpXCIpO1xuXHR9XG5cdC8vIGRyYWcgYW5kIHpvb21cblx0em9vbSA9IGQzLnpvb20oKVxuXHQgIC5zY2FsZUV4dGVudChbb3B0cy56b29tSW4sIG9wdHMuem9vbU91dF0pXG5cdCAgLm9uKCd6b29tJywgem9vbUZuKTtcblxuXHRmdW5jdGlvbiB6b29tRm4oZXZlbnQpIHtcblx0XHRsZXQgdCA9IGV2ZW50LnRyYW5zZm9ybTtcblx0XHRpZihwZWRpZ3JlZV91dGlscy5pc0lFKCkgJiYgdC54LnRvU3RyaW5nKCkubGVuZ3RoID4gMTApXHQvLyBJRSBmaXggZm9yIGRyYWcgb2ZmIHNjcmVlblxuXHRcdFx0cmV0dXJuO1xuXHRcdGxldCBwb3MgPSBbKHQueCArIHBhcnNlSW50KHh0cmFuc2Zvcm0pKSwgKHQueSArIHBhcnNlSW50KHl0cmFuc2Zvcm0pKV07XG5cdFx0aWYodC5rID09IDEpIHtcblx0XHRcdHBlZGNhY2hlLnNldHBvc2l0aW9uKG9wdHMsIHBvc1swXSwgcG9zWzFdKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cGVkY2FjaGUuc2V0cG9zaXRpb24ob3B0cywgcG9zWzBdLCBwb3NbMV0sIHQuayk7XG5cdFx0fVxuXHRcdHBlZC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBwb3NbMF0gKyAnLCcgKyBwb3NbMV0gKyAnKSBzY2FsZSgnICsgdC5rICsgJyknKTtcblx0fVxuXHRzdmcuY2FsbCh6b29tKTtcblx0cmV0dXJuIG9wdHM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9lcnIoZXJyKSB7XG5cdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0cmV0dXJuIG5ldyBFcnJvcihlcnIpO1xufVxuXG4vLyB2YWxpZGF0ZSBwZWRpZ3JlZSBkYXRhXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfcGVkaWdyZWUob3B0cyl7XG5cdGlmKG9wdHMudmFsaWRhdGUpIHtcblx0XHRpZiAodHlwZW9mIG9wdHMudmFsaWRhdGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coJ0NBTExJTkcgQ09ORklHVVJFRCBWQUxJREFUSU9OIEZVTkNUSU9OJyk7XG5cdFx0XHRyZXR1cm4gb3B0cy52YWxpZGF0ZS5jYWxsKHRoaXMsIG9wdHMpO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIGNvbnNpc3RlbmN5IG9mIHBhcmVudHMgc2V4XG5cdFx0bGV0IHVuaXF1ZW5hbWVzID0gW107XG5cdFx0bGV0IGZhbWlkcyA9IFtdO1xuXHRcdGxldCBkaXNwbGF5X25hbWU7XG5cdFx0Zm9yKGxldCBwPTA7IHA8b3B0cy5kYXRhc2V0Lmxlbmd0aDsgcCsrKSB7XG5cdFx0XHRpZighcC5oaWRkZW4pIHtcblx0XHRcdFx0aWYob3B0cy5kYXRhc2V0W3BdLm1vdGhlciB8fCBvcHRzLmRhdGFzZXRbcF0uZmF0aGVyKSB7XG5cdFx0XHRcdFx0ZGlzcGxheV9uYW1lID0gb3B0cy5kYXRhc2V0W3BdLmRpc3BsYXlfbmFtZTtcblx0XHRcdFx0XHRpZighZGlzcGxheV9uYW1lKVxuXHRcdFx0XHRcdFx0ZGlzcGxheV9uYW1lID0gJ3VubmFtZWQnO1xuXHRcdFx0XHRcdGRpc3BsYXlfbmFtZSArPSAnIChJbmRpdklEOiAnK29wdHMuZGF0YXNldFtwXS5uYW1lKycpJztcblx0XHRcdFx0XHRsZXQgbW90aGVyID0gb3B0cy5kYXRhc2V0W3BdLm1vdGhlcjtcblx0XHRcdFx0XHRsZXQgZmF0aGVyID0gb3B0cy5kYXRhc2V0W3BdLmZhdGhlcjtcblx0XHRcdFx0XHRpZighbW90aGVyIHx8ICFmYXRoZXIpIHtcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ01pc3NpbmcgcGFyZW50IGZvciAnK2Rpc3BsYXlfbmFtZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IG1pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIpO1xuXHRcdFx0XHRcdGxldCBmaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKG9wdHMuZGF0YXNldCwgZmF0aGVyKTtcblx0XHRcdFx0XHRpZihtaWR4ID09PSAtMSlcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ1RoZSBtb3RoZXIgKEluZGl2SUQ6ICcrbW90aGVyKycpIG9mIGZhbWlseSBtZW1iZXIgJytcblx0XHRcdFx0XHRcdFx0XHRcdFx0IGRpc3BsYXlfbmFtZSsnIGlzIG1pc3NpbmcgZnJvbSB0aGUgcGVkaWdyZWUuJyk7XG5cdFx0XHRcdFx0aWYoZmlkeCA9PT0gLTEpXG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdUaGUgZmF0aGVyIChJbmRpdklEOiAnK2ZhdGhlcisnKSBvZiBmYW1pbHkgbWVtYmVyICcrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCBkaXNwbGF5X25hbWUrJyBpcyBtaXNzaW5nIGZyb20gdGhlIHBlZGlncmVlLicpO1xuXHRcdFx0XHRcdGlmKG9wdHMuZGF0YXNldFttaWR4XS5zZXggIT09IFwiRlwiKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihcIlRoZSBtb3RoZXIgb2YgZmFtaWx5IG1lbWJlciBcIitkaXNwbGF5X25hbWUrXG5cdFx0XHRcdFx0XHRcdFx0XCIgaXMgbm90IHNwZWNpZmllZCBhcyBmZW1hbGUuIEFsbCBtb3RoZXJzIGluIHRoZSBwZWRpZ3JlZSBtdXN0IGhhdmUgc2V4IHNwZWNpZmllZCBhcyAnRicuXCIpO1xuXHRcdFx0XHRcdGlmKG9wdHMuZGF0YXNldFtmaWR4XS5zZXggIT09IFwiTVwiKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihcIlRoZSBmYXRoZXIgb2YgZmFtaWx5IG1lbWJlciBcIitkaXNwbGF5X25hbWUrXG5cdFx0XHRcdFx0XHRcdFx0XCIgaXMgbm90IHNwZWNpZmllZCBhcyBtYWxlLiBBbGwgZmF0aGVycyBpbiB0aGUgcGVkaWdyZWUgbXVzdCBoYXZlIHNleCBzcGVjaWZpZWQgYXMgJ00nLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdGlmKCFvcHRzLmRhdGFzZXRbcF0ubmFtZSlcblx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihkaXNwbGF5X25hbWUrJyBoYXMgbm8gSW5kaXZJRC4nKTtcblx0XHRcdGlmKCQuaW5BcnJheShvcHRzLmRhdGFzZXRbcF0ubmFtZSwgdW5pcXVlbmFtZXMpID4gLTEpXG5cdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ0luZGl2SUQgZm9yIGZhbWlseSBtZW1iZXIgJytkaXNwbGF5X25hbWUrJyBpcyBub3QgdW5pcXVlLicpO1xuXHRcdFx0dW5pcXVlbmFtZXMucHVzaChvcHRzLmRhdGFzZXRbcF0ubmFtZSk7XG5cblx0XHRcdGlmKCQuaW5BcnJheShvcHRzLmRhdGFzZXRbcF0uZmFtaWQsIGZhbWlkcykgPT09IC0xICYmIG9wdHMuZGF0YXNldFtwXS5mYW1pZCkge1xuXHRcdFx0XHRmYW1pZHMucHVzaChvcHRzLmRhdGFzZXRbcF0uZmFtaWQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGZhbWlkcy5sZW5ndGggPiAxKSB7XG5cdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdNb3JlIHRoYW4gb25lIGZhbWlseSBmb3VuZDogJytmYW1pZHMuam9pbihcIiwgXCIpKycuJyk7XG5cdFx0fVxuXHRcdC8vIHdhcm4gaWYgdGhlcmUgaXMgYSBicmVhayBpbiB0aGUgcGVkaWdyZWVcblx0XHRsZXQgdWMgPSBwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChvcHRzLmRhdGFzZXQpO1xuXHRcdGlmKHVjLmxlbmd0aCA+IDApXG5cdFx0XHRjb25zb2xlLndhcm4oXCJpbmRpdmlkdWFscyB1bmNvbm5lY3RlZCB0byBwZWRpZ3JlZSBcIiwgdWMpO1xuXHR9XG59XG5cbi8vYWRvcHRlZCBpbi9vdXQgYnJhY2tldHNcbmZ1bmN0aW9uIGdldF9icmFja2V0KGR4LCBkeSwgaW5kZW50LCBvcHRzKSB7XG5cdHJldHVybiBcdFwiTVwiICsgKGR4K2luZGVudCkgKyBcIixcIiArIGR5ICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIGR5ICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIChkeSsob3B0cy5zeW1ib2xfc2l6ZSAqICAxLjI4KSkgK1xuXHRcdFx0XCJMXCIgKyBkeCArIFwiIFwiICsgKGR5KyhvcHRzLnN5bWJvbF9zaXplICogIDEuMjgpKSArXG5cdFx0XHRcIkxcIiArIChkeCtpbmRlbnQpICsgXCIsXCIgKyAoZHkrKG9wdHMuc3ltYm9sX3NpemUgKiAgMS4yOCkpXG59XG5cbi8vIGNoZWNrIGlmIHRoZSBvYmplY3QgY29udGFpbnMgYSBrZXkgd2l0aCBhIGdpdmVuIHByZWZpeFxuZnVuY3Rpb24gcHJlZml4SW5PYmoocHJlZml4LCBvYmopIHtcblx0bGV0IGZvdW5kID0gZmFsc2U7XG5cdGlmKG9iailcblx0XHQkLmVhY2gob2JqLCBmdW5jdGlvbihrLCBfbil7XG5cdFx0XHRpZihrLmluZGV4T2YocHJlZml4K1wiX1wiKSA9PT0gMCB8fCBrID09PSBwcmVmaXgpIHtcblx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm4gZm91bmQ7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBmb3VuZDtcbn1cblxuLy8gY2hlY2sgZm9yIGNyb3NzaW5nIG9mIHBhcnRuZXIgbGluZXNcbmZ1bmN0aW9uIGNoZWNrX3B0cl9saW5rcyhvcHRzLCBwdHJMaW5rTm9kZXMpe1xuXHRmb3IobGV0IGE9MDsgYTxwdHJMaW5rTm9kZXMubGVuZ3RoOyBhKyspIHtcblx0XHRsZXQgY2xhc2ggPSBjaGVja19wdHJfbGlua19jbGFzaGVzKG9wdHMsIHB0ckxpbmtOb2Rlc1thXSk7XG5cdFx0aWYoY2xhc2gpXG5cdFx0XHRjb25zb2xlLmxvZyhcIkNMQVNIIDo6IFwiK3B0ckxpbmtOb2Rlc1thXS5tb3RoZXIuZGF0YS5uYW1lK1wiIFwiK3B0ckxpbmtOb2Rlc1thXS5mYXRoZXIuZGF0YS5uYW1lLCBjbGFzaCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrX3B0cl9saW5rX2NsYXNoZXMob3B0cywgYW5vZGUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbGF0dGVuTm9kZXMgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgbW90aGVyLCBmYXRoZXI7XG5cdGlmKCduYW1lJyBpbiBhbm9kZSkge1xuXHRcdGFub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGFub2RlLm5hbWUpO1xuXHRcdGlmKCEoJ21vdGhlcicgaW4gYW5vZGUuZGF0YSkpXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRtb3RoZXIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgYW5vZGUuZGF0YS5tb3RoZXIpO1xuXHRcdGZhdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBhbm9kZS5kYXRhLmZhdGhlcik7XG5cdH0gZWxzZSB7XG5cdFx0bW90aGVyID0gYW5vZGUubW90aGVyO1xuXHRcdGZhdGhlciA9IGFub2RlLmZhdGhlcjtcblx0fVxuXG5cdGxldCB4MSA9IChtb3RoZXIueCA8IGZhdGhlci54ID8gbW90aGVyLnggOiBmYXRoZXIueCk7XG5cdGxldCB4MiA9IChtb3RoZXIueCA8IGZhdGhlci54ID8gZmF0aGVyLnggOiBtb3RoZXIueCk7XG5cdGxldCBkeSA9IG1vdGhlci55O1xuXG5cdC8vIGlkZW50aWZ5IGNsYXNoZXMgd2l0aCBvdGhlciBub2RlcyBhdCB0aGUgc2FtZSBkZXB0aFxuXHRsZXQgY2xhc2ggPSAkLm1hcChmbGF0dGVuTm9kZXMsIGZ1bmN0aW9uKGJub2RlLCBfaSl7XG5cdFx0cmV0dXJuICFibm9kZS5kYXRhLmhpZGRlbiAmJlxuXHRcdFx0XHRibm9kZS5kYXRhLm5hbWUgIT09IG1vdGhlci5kYXRhLm5hbWUgJiYgIGJub2RlLmRhdGEubmFtZSAhPT0gZmF0aGVyLmRhdGEubmFtZSAmJlxuXHRcdFx0XHRibm9kZS55ID09IGR5ICYmIGJub2RlLnggPiB4MSAmJiBibm9kZS54IDwgeDIgPyBibm9kZS54IDogbnVsbDtcblx0fSk7XG5cdHJldHVybiBjbGFzaC5sZW5ndGggPiAwID8gY2xhc2ggOiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRfc3ZnX2RpbWVuc2lvbnMob3B0cykge1xuXHRyZXR1cm4geyd3aWR0aCcgOiAocGJ1dHRvbnMuaXNfZnVsbHNjcmVlbigpPyB3aW5kb3cuaW5uZXJXaWR0aCAgOiBvcHRzLndpZHRoKSxcblx0XHRcdCdoZWlnaHQnOiAocGJ1dHRvbnMuaXNfZnVsbHNjcmVlbigpPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBvcHRzLmhlaWdodCl9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKSB7XG5cdC8vIC8gZ2V0IHNjb3JlIGF0IGVhY2ggZGVwdGggdXNlZCB0byBhZGp1c3Qgbm9kZSBzZXBhcmF0aW9uXG5cdGxldCBzdmdfZGltZW5zaW9ucyA9IGdldF9zdmdfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IG1heHNjb3JlID0gMDtcblx0bGV0IGdlbmVyYXRpb24gPSB7fTtcblx0Zm9yKGxldCBpPTA7IGk8b3B0cy5kYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGRlcHRoID0gcGVkaWdyZWVfdXRpbHMuZ2V0RGVwdGgob3B0cy5kYXRhc2V0LCBvcHRzLmRhdGFzZXRbaV0ubmFtZSk7XG5cdFx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBvcHRzLmRhdGFzZXRbaV0pO1xuXG5cdFx0Ly8gc2NvcmUgYmFzZWQgb24gbm8uIG9mIGNoaWxkcmVuIGFuZCBpZiBwYXJlbnQgZGVmaW5lZFxuXHRcdGxldCBzY29yZSA9IDEgKyAoY2hpbGRyZW4ubGVuZ3RoID4gMCA/IDAuNTUrKGNoaWxkcmVuLmxlbmd0aCowLjI1KSA6IDApICsgKG9wdHMuZGF0YXNldFtpXS5mYXRoZXIgPyAwLjI1IDogMCk7XG5cdFx0aWYoZGVwdGggaW4gZ2VuZXJhdGlvbilcblx0XHRcdGdlbmVyYXRpb25bZGVwdGhdICs9IHNjb3JlO1xuXHRcdGVsc2Vcblx0XHRcdGdlbmVyYXRpb25bZGVwdGhdID0gc2NvcmU7XG5cblx0XHRpZihnZW5lcmF0aW9uW2RlcHRoXSA+IG1heHNjb3JlKVxuXHRcdFx0bWF4c2NvcmUgPSBnZW5lcmF0aW9uW2RlcHRoXTtcblx0fVxuXG5cdGxldCBtYXhfZGVwdGggPSBPYmplY3Qua2V5cyhnZW5lcmF0aW9uKS5sZW5ndGgqb3B0cy5zeW1ib2xfc2l6ZSozLjU7XG5cdGxldCB0cmVlX3dpZHRoID0gIChzdmdfZGltZW5zaW9ucy53aWR0aCAtIG9wdHMuc3ltYm9sX3NpemUgPiBtYXhzY29yZSpvcHRzLnN5bWJvbF9zaXplKjEuNjUgP1xuXHRcdFx0XHRcdCAgIHN2Z19kaW1lbnNpb25zLndpZHRoIC0gb3B0cy5zeW1ib2xfc2l6ZSA6IG1heHNjb3JlKm9wdHMuc3ltYm9sX3NpemUqMS42NSk7XG5cdGxldCB0cmVlX2hlaWdodCA9IChzdmdfZGltZW5zaW9ucy5oZWlnaHQgLSBvcHRzLnN5bWJvbF9zaXplID4gbWF4X2RlcHRoID9cblx0XHRcdFx0XHQgICBzdmdfZGltZW5zaW9ucy5oZWlnaHQgLSBvcHRzLnN5bWJvbF9zaXplIDogbWF4X2RlcHRoKTtcblx0cmV0dXJuIHsnd2lkdGgnOiB0cmVlX3dpZHRoLCAnaGVpZ2h0JzogdHJlZV9oZWlnaHR9O1xufVxuXG4vLyBncm91cCB0b3BfbGV2ZWwgbm9kZXMgYnkgdGhlaXIgcGFydG5lcnNcbmZ1bmN0aW9uIGdyb3VwX3RvcF9sZXZlbChkYXRhc2V0KSB7XG5cdC8vIGxldCB0b3BfbGV2ZWwgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbih2YWwsIGkpe3JldHVybiAndG9wX2xldmVsJyBpbiB2YWwgJiYgdmFsLnRvcF9sZXZlbCA/IHZhbCA6IG51bGw7fSk7XG5cdC8vIGNhbGN1bGF0ZSB0b3BfbGV2ZWwgbm9kZXNcblx0Zm9yKGxldCBpPTA7aTxkYXRhc2V0Lmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRpZ3JlZV91dGlscy5nZXREZXB0aChkYXRhc2V0LCBkYXRhc2V0W2ldLm5hbWUpID09IDIpXG5cdFx0XHRkYXRhc2V0W2ldLnRvcF9sZXZlbCA9IHRydWU7XG5cdH1cblxuXHRsZXQgdG9wX2xldmVsID0gW107XG5cdGxldCB0b3BfbGV2ZWxfc2VlbiA9IFtdO1xuXHRmb3IobGV0IGk9MDtpPGRhdGFzZXQubGVuZ3RoO2krKykge1xuXHRcdGxldCBub2RlID0gZGF0YXNldFtpXTtcblx0XHRpZigndG9wX2xldmVsJyBpbiBub2RlICYmICQuaW5BcnJheShub2RlLm5hbWUsIHRvcF9sZXZlbF9zZWVuKSA9PSAtMSl7XG5cdFx0XHR0b3BfbGV2ZWxfc2Vlbi5wdXNoKG5vZGUubmFtZSk7XG5cdFx0XHR0b3BfbGV2ZWwucHVzaChub2RlKTtcblx0XHRcdGxldCBwdHJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIG5vZGUpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cHRycy5sZW5ndGg7IGorKyl7XG5cdFx0XHRcdGlmKCQuaW5BcnJheShwdHJzW2pdLCB0b3BfbGV2ZWxfc2VlbikgPT0gLTEpIHtcblx0XHRcdFx0XHR0b3BfbGV2ZWxfc2Vlbi5wdXNoKHB0cnNbal0pO1xuXHRcdFx0XHRcdHRvcF9sZXZlbC5wdXNoKHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgcHRyc1tqXSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0bGV0IG5ld2RhdGFzZXQgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gJ3RvcF9sZXZlbCcgaW4gdmFsICYmIHZhbC50b3BfbGV2ZWwgPyBudWxsIDogdmFsO30pO1xuXHRmb3IgKGxldCBpID0gdG9wX2xldmVsLmxlbmd0aDsgaSA+IDA7IC0taSlcblx0XHRuZXdkYXRhc2V0LnVuc2hpZnQodG9wX2xldmVsW2ktMV0pO1xuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLy8gZ2V0IGhlaWdodCBpbiBwaXhlbHNcbmZ1bmN0aW9uIGdldFB4KG9wdHMpe1xuXHRsZXQgZW1WYWwgPSBvcHRzLmZvbnRfc2l6ZTtcblx0aWYgKGVtVmFsID09PSBwYXJzZUludChlbVZhbCwgMTApKSAvLyB0ZXN0IGlmIGludGVnZXJcblx0XHRyZXR1cm4gZW1WYWw7XG5cblx0aWYoZW1WYWwuaW5kZXhPZihcInB4XCIpID4gLTEpXG5cdFx0cmV0dXJuIGVtVmFsLnJlcGxhY2UoJ3B4JywgJycpO1xuXHRlbHNlIGlmKGVtVmFsLmluZGV4T2YoXCJlbVwiKSA9PT0gLTEpXG5cdFx0cmV0dXJuIGVtVmFsO1xuXHRlbVZhbCA9IHBhcnNlRmxvYXQoZW1WYWwucmVwbGFjZSgnZW0nLCAnJykpO1xuXHRyZXR1cm4gKHBhcnNlRmxvYXQoZ2V0Q29tcHV0ZWRTdHlsZSgkKCcjJytvcHRzLnRhcmdldERpdikuZ2V0KDApKS5mb250U2l6ZSkqZW1WYWwpLTEuMDtcbn1cblxuLy8gQWRkIGxhYmVsXG5mdW5jdGlvbiBhZGRMYWJlbChvcHRzLCBub2RlLCBzaXplLCBmeCwgZnksIGZ0ZXh0LCBjbGFzc19sYWJlbCkge1xuXHRub2RlLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHID8gZmFsc2UgOiB0cnVlO1xuXHR9KS5hcHBlbmQoXCJ0ZXh0XCIpXG5cdC5hdHRyKFwiY2xhc3NcIiwgY2xhc3NfbGFiZWwgKyAnIHBlZF9sYWJlbCcgfHwgXCJwZWRfbGFiZWxcIilcblx0LmF0dHIoXCJ4XCIsIGZ4KVxuXHQuYXR0cihcInlcIiwgZnkpXG5cdC8vIC5hdHRyKFwiZHlcIiwgc2l6ZSlcblx0LmF0dHIoXCJmb250LWZhbWlseVwiLCBvcHRzLmZvbnRfZmFtaWx5KVxuXHQuYXR0cihcImZvbnQtc2l6ZVwiLCBvcHRzLmZvbnRfc2l6ZSlcblx0LmF0dHIoXCJmb250LXdlaWdodFwiLCBvcHRzLmZvbnRfd2VpZ2h0KVxuXHQudGV4dChmdGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWJ1aWxkKG9wdHMpIHtcblx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0cGVkY2FjaGUuaW5pdF9jYWNoZShvcHRzKTtcblx0dHJ5IHtcblx0XHRidWlsZChvcHRzKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHR0aHJvdyBlO1xuXHR9XG5cblx0dHJ5IHtcblx0XHR0ZW1wbGF0ZXMudXBkYXRlKG9wdHMpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHQvLyB0ZW1wbGF0ZXMgbm90IGRlY2xhcmVkXG5cdH1cbn1cblxuLy8gYWRkIGNoaWxkcmVuIHRvIGEgZ2l2ZW4gbm9kZVxuZXhwb3J0IGZ1bmN0aW9uIGFkZGNoaWxkKGRhdGFzZXQsIG5vZGUsIHNleCwgbmNoaWxkLCB0d2luX3R5cGUpIHtcblx0aWYodHdpbl90eXBlICYmICQuaW5BcnJheSh0d2luX3R5cGUsIFsgXCJtenR3aW5cIiwgXCJkenR3aW5cIiBdICkgPT09IC0xKVxuXHRcdHJldHVybiBuZXcgRXJyb3IoXCJJTlZBTElEIFRXSU4gVFlQRSBTRVQ6IFwiK3R3aW5fdHlwZSk7XG5cblx0aWYgKHR5cGVvZiBuY2hpbGQgPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0bmNoaWxkID0gMTtcblx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgbm9kZSk7XG5cdGxldCBwdHJfbmFtZSwgaWR4O1xuXHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG5cdFx0bGV0IHBhcnRuZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIG5vZGUsIG5vZGUuc2V4ID09PSAnRicgPyAnTSc6ICdGJywgbm9kZS5zZXggPT09ICdGJyk7XG5cdFx0cGFydG5lci5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdHB0cl9uYW1lID0gcGFydG5lci5uYW1lO1xuXHRcdGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpKzE7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IGMgPSBjaGlsZHJlblswXTtcblx0XHRwdHJfbmFtZSA9IChjLmZhdGhlciA9PT0gbm9kZS5uYW1lID8gYy5tb3RoZXIgOiBjLmZhdGhlcik7XG5cdFx0aWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGMubmFtZSk7XG5cdH1cblxuXHRsZXQgdHdpbl9pZDtcblx0aWYodHdpbl90eXBlKVxuXHRcdHR3aW5faWQgPSBnZXRVbmlxdWVUd2luSUQoZGF0YXNldCwgdHdpbl90eXBlKTtcblx0bGV0IG5ld2NoaWxkcmVuID0gW107XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbmNoaWxkOyBpKyspIHtcblx0XHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogc2V4LFxuXHRcdFx0XHRcdCBcIm1vdGhlclwiOiAobm9kZS5zZXggPT09ICdGJyA/IG5vZGUubmFtZSA6IHB0cl9uYW1lKSxcblx0XHRcdFx0XHQgXCJmYXRoZXJcIjogKG5vZGUuc2V4ID09PSAnRicgPyBwdHJfbmFtZSA6IG5vZGUubmFtZSl9O1xuXHRcdGRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xuXG5cdFx0aWYodHdpbl90eXBlKVxuXHRcdFx0Y2hpbGRbdHdpbl90eXBlXSA9IHR3aW5faWQ7XG5cdFx0bmV3Y2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cdH1cblx0cmV0dXJuIG5ld2NoaWxkcmVuO1xufVxuXG4vL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZHNpYmxpbmcoZGF0YXNldCwgbm9kZSwgc2V4LCBhZGRfbGhzLCB0d2luX3R5cGUpIHtcblx0aWYodHdpbl90eXBlICYmICQuaW5BcnJheSh0d2luX3R5cGUsIFsgXCJtenR3aW5cIiwgXCJkenR3aW5cIiBdICkgPT09IC0xKVxuXHRcdHJldHVybiBuZXcgRXJyb3IoXCJJTlZBTElEIFRXSU4gVFlQRSBTRVQ6IFwiK3R3aW5fdHlwZSk7XG5cblx0bGV0IG5ld2JpZSA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBzZXh9O1xuXHRpZihub2RlLnRvcF9sZXZlbCkge1xuXHRcdG5ld2JpZS50b3BfbGV2ZWwgPSB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdG5ld2JpZS5tb3RoZXIgPSBub2RlLm1vdGhlcjtcblx0XHRuZXdiaWUuZmF0aGVyID0gbm9kZS5mYXRoZXI7XG5cdH1cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpO1xuXG5cdGlmKHR3aW5fdHlwZSkge1xuXHRcdHNldE16VHdpbihkYXRhc2V0LCBkYXRhc2V0W2lkeF0sIG5ld2JpZSwgdHdpbl90eXBlKTtcblx0fVxuXG5cdGlmKGFkZF9saHMpIHsgLy8gYWRkIHRvIExIU1xuXHRcdGlmKGlkeCA+IDApIGlkeC0tO1xuXHR9IGVsc2Vcblx0XHRpZHgrKztcblx0ZGF0YXNldC5zcGxpY2UoaWR4LCAwLCBuZXdiaWUpO1xuXHRyZXR1cm4gbmV3YmllO1xufVxuXG4vLyBzZXQgdHdvIHNpYmxpbmdzIGFzIHR3aW5zXG5mdW5jdGlvbiBzZXRNelR3aW4oZGF0YXNldCwgZDEsIGQyLCB0d2luX3R5cGUpIHtcblx0aWYoIWQxW3R3aW5fdHlwZV0pIHtcblx0XHRkMVt0d2luX3R5cGVdID0gZ2V0VW5pcXVlVHdpbklEKGRhdGFzZXQsIHR3aW5fdHlwZSk7XG5cdFx0aWYoIWQxW3R3aW5fdHlwZV0pXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0ZDJbdHdpbl90eXBlXSA9IGQxW3R3aW5fdHlwZV07XG5cdGlmKGQxLnlvYilcblx0XHRkMi55b2IgPSBkMS55b2I7XG5cdGlmKGQxLmFnZSAmJiAoZDEuc3RhdHVzID09IDAgfHwgIWQxLnN0YXR1cykpXG5cdFx0ZDIuYWdlID0gZDEuYWdlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLy8gZ2V0IGEgbmV3IHVuaXF1ZSB0d2lucyBJRCwgbWF4IG9mIDEwIHR3aW5zIGluIGEgcGVkaWdyZWVcbmZ1bmN0aW9uIGdldFVuaXF1ZVR3aW5JRChkYXRhc2V0LCB0d2luX3R5cGUpIHtcblx0bGV0IG16ID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIFwiQVwiXTtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGRhdGFzZXRbaV1bdHdpbl90eXBlXSkge1xuXHRcdFx0bGV0IGlkeCA9IG16LmluZGV4T2YoZGF0YXNldFtpXVt0d2luX3R5cGVdKTtcblx0XHRcdGlmIChpZHggPiAtMSlcblx0XHRcdFx0bXouc3BsaWNlKGlkeCwgMSk7XG5cdFx0fVxuXHR9XG5cdGlmKG16Lmxlbmd0aCA+IDApXG5cdFx0cmV0dXJuIG16WzBdO1xuXHRyZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vLyBzeW5jIGF0dHJpYnV0ZXMgb2YgdHdpbnNcbmV4cG9ydCBmdW5jdGlvbiBzeW5jVHdpbnMoZGF0YXNldCwgZDEpIHtcblx0aWYoIWQxLm16dHdpbiAmJiAhZDEuZHp0d2luKVxuXHRcdHJldHVybjtcblx0bGV0IHR3aW5fdHlwZSA9IChkMS5tenR3aW4gPyBcIm16dHdpblwiIDogXCJkenR3aW5cIik7XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgZDIgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGQyW3R3aW5fdHlwZV0gJiYgZDFbdHdpbl90eXBlXSA9PSBkMlt0d2luX3R5cGVdICYmIGQyLm5hbWUgIT09IGQxLm5hbWUpIHtcblx0XHRcdGlmKHR3aW5fdHlwZSA9PT0gXCJtenR3aW5cIilcblx0XHRcdCAgZDIuc2V4ID0gZDEuc2V4O1xuXHRcdFx0aWYoZDEueW9iKVxuXHRcdFx0XHRkMi55b2IgPSBkMS55b2I7XG5cdFx0XHRpZihkMS5hZ2UgJiYgKGQxLnN0YXR1cyA9PSAwIHx8ICFkMS5zdGF0dXMpKVxuXHRcdFx0XHRkMi5hZ2UgPSBkMS5hZ2U7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGNoZWNrIGludGVncml0eSB0d2luIHNldHRpbmdzXG5mdW5jdGlvbiBjaGVja1R3aW5zKGRhdGFzZXQpIHtcblx0bGV0IHR3aW5fdHlwZXMgPSBbXCJtenR3aW5cIiwgXCJkenR3aW5cIl07XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IobGV0IGo9MDsgajx0d2luX3R5cGVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRsZXQgdHdpbl90eXBlID0gdHdpbl90eXBlc1tqXTtcblx0XHRcdGlmKGRhdGFzZXRbaV1bdHdpbl90eXBlXSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSAwO1xuXHRcdFx0XHRmb3IobGV0IGo9MDsgajxkYXRhc2V0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYoZGF0YXNldFtqXVt0d2luX3R5cGVdID09IGRhdGFzZXRbaV1bdHdpbl90eXBlXSlcblx0XHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoY291bnQgPCAyKVxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhc2V0W2ldW1t0d2luX3R5cGVdXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLy8gYWRkIHBhcmVudHMgdG8gdGhlICdub2RlJ1xuZXhwb3J0IGZ1bmN0aW9uIGFkZHBhcmVudHMob3B0cywgZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgbW90aGVyLCBmYXRoZXI7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdF90cmVlID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IHRyZWVfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBuYW1lKTtcblx0bGV0IG5vZGUgID0gdHJlZV9ub2RlLmRhdGE7XG5cdGxldCBkZXB0aCA9IHRyZWVfbm9kZS5kZXB0aDsgICAvLyBkZXB0aCBvZiB0aGUgbm9kZSBpbiByZWxhdGlvbiB0byB0aGUgcm9vdCAoZGVwdGggPSAxIGlzIGEgdG9wX2xldmVsIG5vZGUpXG5cblx0bGV0IHBpZCA9IC0xMDE7XG5cdGxldCBwdHJfbmFtZTtcblx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgbm9kZSk7XG5cdGlmKGNoaWxkcmVuLmxlbmd0aCA+IDApe1xuXHRcdHB0cl9uYW1lID0gY2hpbGRyZW5bMF0ubW90aGVyID09IG5vZGUubmFtZSA/IGNoaWxkcmVuWzBdLmZhdGhlciA6IGNoaWxkcmVuWzBdLm1vdGhlcjtcblx0XHRwaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgcHRyX25hbWUpLmRhdGEuaWQ7XG5cdH1cblxuXHRsZXQgaTtcblx0aWYoZGVwdGggPT0gMSkge1xuXHRcdG1vdGhlciA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBcIkZcIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX07XG5cdFx0ZmF0aGVyID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IFwiTVwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfTtcblx0XHRkYXRhc2V0LnNwbGljZSgwLCAwLCBtb3RoZXIpO1xuXHRcdGRhdGFzZXQuc3BsaWNlKDAsIDAsIGZhdGhlcik7XG5cblx0XHRmb3IoaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspe1xuXHRcdFx0aWYoZGF0YXNldFtpXS50b3BfbGV2ZWwgJiYgZGF0YXNldFtpXS5uYW1lICE9PSBtb3RoZXIubmFtZSAmJiBkYXRhc2V0W2ldLm5hbWUgIT09IGZhdGhlci5uYW1lKXtcblx0XHRcdFx0ZGVsZXRlIGRhdGFzZXRbaV0udG9wX2xldmVsO1xuXHRcdFx0XHRkYXRhc2V0W2ldLm5vcGFyZW50cyA9IHRydWU7XG5cdFx0XHRcdGRhdGFzZXRbaV0ubW90aGVyID0gbW90aGVyLm5hbWU7XG5cdFx0XHRcdGRhdGFzZXRbaV0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBub2RlX21vdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCB0cmVlX25vZGUuZGF0YS5tb3RoZXIpO1xuXHRcdGxldCBub2RlX2ZhdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCB0cmVlX25vZGUuZGF0YS5mYXRoZXIpO1xuXHRcdGxldCBub2RlX3NpYnMgPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxTaWJsaW5ncyhkYXRhc2V0LCBub2RlKTtcblxuXHRcdC8vIGxocyAmIHJocyBpZCdzIGZvciBzaWJsaW5ncyBvZiB0aGlzIG5vZGVcblx0XHRsZXQgcmlkID0gMTAwMDA7XG5cdFx0bGV0IGxpZCA9IHRyZWVfbm9kZS5kYXRhLmlkO1xuXHRcdGZvcihpPTA7IGk8bm9kZV9zaWJzLmxlbmd0aDsgaSsrKXtcblx0XHRcdGxldCBzaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgbm9kZV9zaWJzW2ldLm5hbWUpLmRhdGEuaWQ7XG5cdFx0XHRpZihzaWQgPCByaWQgJiYgc2lkID4gdHJlZV9ub2RlLmRhdGEuaWQpXG5cdFx0XHRcdHJpZCA9IHNpZDtcblx0XHRcdGlmKHNpZCA8IGxpZClcblx0XHRcdFx0bGlkID0gc2lkO1xuXHRcdH1cblx0XHRsZXQgYWRkX2xocyA9IChsaWQgPj0gdHJlZV9ub2RlLmRhdGEuaWQgfHwgKHBpZCA9PSBsaWQgJiYgcmlkIDwgMTAwMDApKTtcblx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0Y29uc29sZS5sb2coJ2xpZD0nK2xpZCsnIHJpZD0nK3JpZCsnIG5pZD0nK3RyZWVfbm9kZS5kYXRhLmlkKycgQUREX0xIUz0nK2FkZF9saHMpO1xuXHRcdGxldCBtaWR4O1xuXHRcdGlmKCAoIWFkZF9saHMgJiYgbm9kZV9mYXRoZXIuZGF0YS5pZCA+IG5vZGVfbW90aGVyLmRhdGEuaWQpIHx8XG5cdFx0XHQoYWRkX2xocyAmJiBub2RlX2ZhdGhlci5kYXRhLmlkIDwgbm9kZV9tb3RoZXIuZGF0YS5pZCkgKVxuXHRcdFx0bWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLmZhdGhlcik7XG5cdFx0ZWxzZVxuXHRcdFx0bWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm1vdGhlcik7XG5cblx0XHRsZXQgcGFyZW50ID0gZGF0YXNldFttaWR4XTtcblx0XHRmYXRoZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHBhcmVudCwgJ00nLCBhZGRfbGhzKTtcblx0XHRtb3RoZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHBhcmVudCwgJ0YnLCBhZGRfbGhzKTtcblxuXHRcdGxldCBmYWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0bGV0IG1vaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG1vdGhlci5uYW1lKTtcblx0XHRpZihmYWlkeCA+IG1vaWR4KSB7XHRcdFx0XHQgICAvLyBzd2l0Y2ggdG8gZW5zdXJlIGZhdGhlciBvbiBsaHMgb2YgbW90aGVyXG5cdFx0XHRsZXQgdG1wZmEgPSBkYXRhc2V0W2ZhaWR4XTtcblx0XHRcdGRhdGFzZXRbZmFpZHhdID0gZGF0YXNldFttb2lkeF07XG5cdFx0XHRkYXRhc2V0W21vaWR4XSA9IHRtcGZhO1xuXHRcdH1cblxuXHRcdGxldCBvcnBoYW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWRvcHRlZFNpYmxpbmdzKGRhdGFzZXQsIG5vZGUpO1xuXHRcdGxldCBuaWQgPSB0cmVlX25vZGUuZGF0YS5pZDtcblx0XHRmb3IoaT0wOyBpPG9ycGhhbnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IG9pZCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBvcnBoYW5zW2ldLm5hbWUpLmRhdGEuaWQ7XG5cdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnT1JQSEFOPScraSsnICcrb3JwaGFuc1tpXS5uYW1lKycgJysobmlkIDwgb2lkICYmIG9pZCA8IHJpZCkrJyBuaWQ9JytuaWQrJyBvaWQ9JytvaWQrJyByaWQ9JytyaWQpO1xuXHRcdFx0aWYoKGFkZF9saHMgfHwgbmlkIDwgb2lkKSAmJiBvaWQgPCByaWQpe1xuXHRcdFx0XHRsZXQgb2lkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBvcnBoYW5zW2ldLm5hbWUpO1xuXHRcdFx0XHRkYXRhc2V0W29pZHhdLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0XHRkYXRhc2V0W29pZHhdLmZhdGhlciA9IGZhdGhlci5uYW1lO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmKGRlcHRoID09IDIpIHtcblx0XHRtb3RoZXIudG9wX2xldmVsID0gdHJ1ZTtcblx0XHRmYXRoZXIudG9wX2xldmVsID0gdHJ1ZTtcblx0fSBlbHNlIGlmKGRlcHRoID4gMikge1xuXHRcdG1vdGhlci5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdGZhdGhlci5ub3BhcmVudHMgPSB0cnVlO1xuXHR9XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5uYW1lKTtcblx0ZGF0YXNldFtpZHhdLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRkYXRhc2V0W2lkeF0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdGRlbGV0ZSBkYXRhc2V0W2lkeF0ubm9wYXJlbnRzO1xuXG5cdGlmKCdwYXJlbnRfbm9kZScgaW4gbm9kZSkge1xuXHRcdGxldCBwdHJfbm9kZSA9IGRhdGFzZXRbcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIHB0cl9uYW1lKV07XG5cdFx0aWYoJ25vcGFyZW50cycgaW4gcHRyX25vZGUpIHtcblx0XHRcdHB0cl9ub2RlLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0cHRyX25vZGUuZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGFkZCBwYXJ0bmVyXG5leHBvcnQgZnVuY3Rpb24gYWRkcGFydG5lcihvcHRzLCBkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdF90cmVlID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IHRyZWVfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBuYW1lKTtcblxuXHRsZXQgcGFydG5lciA9IGFkZHNpYmxpbmcoZGF0YXNldCwgdHJlZV9ub2RlLmRhdGEsIHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gJ00nIDogJ0YnLCB0cmVlX25vZGUuZGF0YS5zZXggPT09ICdGJyk7XG5cdHBhcnRuZXIubm9wYXJlbnRzID0gdHJ1ZTtcblxuXHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogXCJNXCJ9O1xuXHRjaGlsZC5tb3RoZXIgPSAodHJlZV9ub2RlLmRhdGEuc2V4ID09PSAnRicgPyB0cmVlX25vZGUuZGF0YS5uYW1lIDogcGFydG5lci5uYW1lKTtcblx0Y2hpbGQuZmF0aGVyID0gKHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gcGFydG5lci5uYW1lIDogdHJlZV9ub2RlLmRhdGEubmFtZSk7XG5cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCB0cmVlX25vZGUuZGF0YS5uYW1lKSsyO1xuXHRkYXRhc2V0LnNwbGljZShpZHgsIDAsIGNoaWxkKTtcbn1cblxuLy8gZ2V0IGFkamFjZW50IG5vZGVzIGF0IHRoZSBzYW1lIGRlcHRoXG5mdW5jdGlvbiBhZGphY2VudF9ub2Rlcyhyb290LCBub2RlLCBleGNsdWRlcykge1xuXHRsZXQgZG5vZGVzID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZXNBdERlcHRoKHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCksIG5vZGUuZGVwdGgsIGV4Y2x1ZGVzKTtcblx0bGV0IGxoc19ub2RlLCByaHNfbm9kZTtcblx0Zm9yKGxldCBpPTA7IGk8ZG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYoZG5vZGVzW2ldLnggPCBub2RlLngpXG5cdFx0XHRsaHNfbm9kZSA9IGRub2Rlc1tpXTtcblx0XHRpZighcmhzX25vZGUgJiYgZG5vZGVzW2ldLnggPiBub2RlLngpXG5cdFx0XHRyaHNfbm9kZSA9IGRub2Rlc1tpXTtcblx0fVxuXHRyZXR1cm4gW2xoc19ub2RlLCByaHNfbm9kZV07XG59XG5cbi8vIGRlbGV0ZSBhIG5vZGUgYW5kIGRlc2NlbmRhbnRzXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlX25vZGVfZGF0YXNldChkYXRhc2V0LCBub2RlLCBvcHRzLCBvbkRvbmUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbm9kZXMgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgZGVsZXRlcyA9IFtdO1xuXHRsZXQgaSwgajtcblxuXHQvLyBnZXQgZDMgZGF0YSBub2RlXG5cdGlmKG5vZGUuaWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGxldCBkM25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2Rlcywgbm9kZS5uYW1lKTtcblx0XHRpZihkM25vZGUgIT09IHVuZGVmaW5lZClcblx0XHRcdG5vZGUgPSBkM25vZGUuZGF0YTtcblx0fVxuXG5cdGlmKG5vZGUucGFyZW50X25vZGUpIHtcblx0XHRmb3IoaT0wOyBpPG5vZGUucGFyZW50X25vZGUubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IHBhcmVudCA9IG5vZGUucGFyZW50X25vZGVbaV07XG5cdFx0XHRsZXQgcHMgPSBbcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwYXJlbnQubW90aGVyLm5hbWUpLFxuXHRcdFx0XHRcdCAgcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwYXJlbnQuZmF0aGVyLm5hbWUpXTtcblx0XHRcdC8vIGRlbGV0ZSBwYXJlbnRzXG5cdFx0XHRmb3Ioaj0wOyBqPHBzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHBzW2pdLm5hbWUgPT09IG5vZGUubmFtZSB8fCBwc1tqXS5ub3BhcmVudHMgIT09IHVuZGVmaW5lZCB8fCBwc1tqXS50b3BfbGV2ZWwpIHtcblx0XHRcdFx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgcHNbal0ubmFtZSksIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZXMucHVzaChwc1tqXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bGV0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkcmVuO1xuXHRcdFx0bGV0IGNoaWxkcmVuX25hbWVzID0gJC5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKHAsIF9pKXtyZXR1cm4gcC5uYW1lO30pO1xuXHRcdFx0Zm9yKGo9MDsgajxjaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRsZXQgY2hpbGQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIGNoaWxkcmVuW2pdLm5hbWUpO1xuXHRcdFx0XHRpZihjaGlsZCl7XG5cdFx0XHRcdFx0Y2hpbGQubm9wYXJlbnRzID0gdHJ1ZTtcblx0XHRcdFx0XHRsZXQgcHRycyA9IHBlZGlncmVlX3V0aWxzLmdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCk7XG5cdFx0XHRcdFx0bGV0IHB0cjtcblx0XHRcdFx0XHRpZihwdHJzLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0XHRwdHIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbMF0pO1xuXHRcdFx0XHRcdGlmKHB0ciAmJiBwdHIubW90aGVyICE9PSBjaGlsZC5tb3RoZXIpIHtcblx0XHRcdFx0XHRcdGNoaWxkLm1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0XHRcdFx0XHRjaGlsZC5mYXRoZXIgPSBwdHIuZmF0aGVyO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihwdHIpIHtcblx0XHRcdFx0XHRcdGxldCBjaGlsZF9ub2RlICA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZm5vZGVzLCBjaGlsZC5uYW1lKTtcblx0XHRcdFx0XHRcdGxldCBhZGogPSBhZGphY2VudF9ub2Rlcyhyb290LCBjaGlsZF9ub2RlLCBjaGlsZHJlbl9uYW1lcyk7XG5cdFx0XHRcdFx0XHRjaGlsZC5tb3RoZXIgPSBhZGpbMF0gPyBhZGpbMF0uZGF0YS5tb3RoZXIgOiAoYWRqWzFdID8gYWRqWzFdLmRhdGEubW90aGVyIDogbnVsbCk7XG5cdFx0XHRcdFx0XHRjaGlsZC5mYXRoZXIgPSBhZGpbMF0gPyBhZGpbMF0uZGF0YS5mYXRoZXIgOiAoYWRqWzFdID8gYWRqWzFdLmRhdGEuZmF0aGVyIDogbnVsbCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBjaGlsZC5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpLCAxKTtcblx0fVxuXG5cdC8vIGRlbGV0ZSBhbmNlc3RvcnNcblx0Y29uc29sZS5sb2coZGVsZXRlcyk7XG5cdGZvcihpPTA7IGk8ZGVsZXRlcy5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkZWwgPSBkZWxldGVzW2ldO1xuXHRcdGxldCBzaWJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgZGVsKTtcblx0XHRjb25zb2xlLmxvZygnREVMJywgZGVsLm5hbWUsIHNpYnMpO1xuXHRcdGlmKHNpYnMubGVuZ3RoIDwgMSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2RlbCBzaWJzJywgZGVsLm5hbWUsIHNpYnMpO1xuXHRcdFx0bGV0IGRhdGFfbm9kZSAgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2RlcywgZGVsLm5hbWUpO1xuXHRcdFx0bGV0IGFuY2VzdG9ycyA9IGRhdGFfbm9kZS5hbmNlc3RvcnMoKTtcblx0XHRcdGZvcihqPTA7IGo8YW5jZXN0b3JzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGFuY2VzdG9yc1tpXSk7XG5cdFx0XHRcdGlmKGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlcil7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ0RFTEVURSAnLCBhbmNlc3RvcnNbal0uZGF0YS5tb3RoZXIsIGFuY2VzdG9yc1tqXS5kYXRhLmZhdGhlcik7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlci5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGFuY2VzdG9yc1tqXS5kYXRhLmZhdGhlci5uYW1lKSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Ly8gY2hlY2sgaW50ZWdyaXR5IG9mIG16dHdpbnMgc2V0dGluZ3Ncblx0Y2hlY2tUd2lucyhkYXRhc2V0KTtcblxuXHRsZXQgdWM7XG5cdHRyeVx0e1xuXHRcdC8vIHZhbGlkYXRlIG5ldyBwZWRpZ3JlZSBkYXRhc2V0XG5cdFx0bGV0IG5ld29wdHMgPSAkLmV4dGVuZCh7fSwgb3B0cyk7XG5cdFx0bmV3b3B0cy5kYXRhc2V0ID0gcGVkaWdyZWVfdXRpbHMuY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHRcdHZhbGlkYXRlX3BlZGlncmVlKG5ld29wdHMpO1xuXHRcdC8vIGNoZWNrIGlmIHBlZGlncmVlIGlzIHNwbGl0XG5cdFx0dWMgPSBwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChkYXRhc2V0KTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRwZWRpZ3JlZV91dGlscy5tZXNzYWdlcygnV2FybmluZycsICdEZWxldGlvbiBvZiB0aGlzIHBlZGlncmVlIG1lbWJlciBpcyBkaXNhbGxvd2VkLicpXG5cdFx0dGhyb3cgZXJyO1xuXHR9XG5cdGlmKHVjLmxlbmd0aCA+IDApIHtcblx0XHQvLyBjaGVjayAmIHdhcm4gb25seSBpZiB0aGlzIGlzIGEgbmV3IHNwbGl0XG5cdFx0aWYocGVkaWdyZWVfdXRpbHMudW5jb25uZWN0ZWQob3B0cy5kYXRhc2V0KS5sZW5ndGggPT09IDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJpbmRpdmlkdWFscyB1bmNvbm5lY3RlZCB0byBwZWRpZ3JlZSBcIiwgdWMpO1xuXHRcdFx0cGVkaWdyZWVfdXRpbHMubWVzc2FnZXMoXCJXYXJuaW5nXCIsIFwiRGVsZXRpbmcgdGhpcyB3aWxsIHNwbGl0IHRoZSBwZWRpZ3JlZS4gQ29udGludWU/XCIsIG9uRG9uZSwgb3B0cywgZGF0YXNldCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0aWYob25Eb25lKSB7XG5cdFx0b25Eb25lKG9wdHMsIGRhdGFzZXQpO1xuXHR9XG5cdHJldHVybiBkYXRhc2V0O1xufVxuIl0sIm5hbWVzIjpbIm1heF9saW1pdCIsImRpY3RfY2FjaGUiLCJoYXNfYnJvd3Nlcl9zdG9yYWdlIiwib3B0cyIsInN0b3JlX3R5cGUiLCJ1bmRlZmluZWQiLCJtb2QiLCJsb2NhbFN0b3JhZ2UiLCJzZXRJdGVtIiwicmVtb3ZlSXRlbSIsImUiLCJnZXRfcHJlZml4IiwiYnRuX3RhcmdldCIsImdldF9hcnIiLCJnZXRfYnJvd3Nlcl9zdG9yZSIsIml0ZW0iLCJnZXRJdGVtIiwic2Vzc2lvblN0b3JhZ2UiLCJzZXRfYnJvd3Nlcl9zdG9yZSIsIm5hbWUiLCJjbGVhcl9icm93c2VyX3N0b3JlIiwiY2xlYXIiLCJjbGVhcl9wZWRpZ3JlZV9kYXRhIiwicHJlZml4Iiwic3RvcmUiLCJpdGVtcyIsImkiLCJsZW5ndGgiLCJrZXkiLCJpbmRleE9mIiwicHVzaCIsImdldF9jb3VudCIsImNvdW50Iiwic2V0X2NvdW50IiwiaW5pdF9jYWNoZSIsImRhdGFzZXQiLCJKU09OIiwic3RyaW5naWZ5IiwiY29uc29sZSIsIndhcm4iLCJuc3RvcmUiLCJjdXJyZW50IiwicGFyc2UiLCJsYXN0IiwiaXQiLCJhcnIiLCJwcmV2aW91cyIsIm5leHQiLCJwYXJzZUludCIsInNldHBvc2l0aW9uIiwieCIsInkiLCJ6b29tIiwiZ2V0cG9zaXRpb24iLCJwb3MiLCJwYXJzZUZsb2F0IiwiaXNJRSIsInVhIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaXNFZGdlIiwibWF0Y2giLCJjb3B5X2RhdGFzZXQiLCJpZCIsInNvcnQiLCJhIiwiYiIsImRpc2FsbG93ZWQiLCJuZXdkYXRhc2V0Iiwib2JqIiwiZ2V0Rm9ybWF0dGVkRGF0ZSIsInRpbWUiLCJkIiwiRGF0ZSIsImdldEhvdXJzIiwic2xpY2UiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwibWVzc2FnZXMiLCJ0aXRsZSIsIm1zZyIsIm9uQ29uZmlybSIsIiQiLCJkaWFsb2ciLCJtb2RhbCIsIndpZHRoIiwiYnV0dG9ucyIsInRleHQiLCJjbGljayIsInZhbGlkYXRlX2FnZV95b2IiLCJhZ2UiLCJ5b2IiLCJzdGF0dXMiLCJ5ZWFyIiwic3VtIiwiTWF0aCIsImFicyIsImNhcGl0YWxpc2VGaXJzdExldHRlciIsInN0cmluZyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwibWFrZWlkIiwibGVuIiwicG9zc2libGUiLCJmbG9vciIsInJhbmRvbSIsImJ1aWxkVHJlZSIsInBlcnNvbiIsInJvb3QiLCJwYXJ0bmVyTGlua3MiLCJjaGlsZHJlbiIsImdldENoaWxkcmVuIiwibm9kZXMiLCJmbGF0dGVuIiwicGFydG5lcnMiLCJlYWNoIiwiY2hpbGQiLCJqIiwicCIsIm1vdGhlciIsImZhdGhlciIsIm0iLCJnZXROb2RlQnlOYW1lIiwiZiIsImNvbnRhaW5zX3BhcmVudCIsIm1lcmdlIiwicHRyIiwicGFyZW50IiwiaGlkZGVuIiwibWlkeCIsImdldElkeEJ5TmFtZSIsImZpZHgiLCJzZXRDaGlsZHJlbklkIiwiZ3AiLCJnZXRfZ3JhbmRwYXJlbnRzX2lkeCIsInVwZGF0ZVBhcmVudCIsInBhcmVudF9ub2RlIiwibXp0d2luIiwiZHp0d2lucyIsInR3aW5zIiwiZ2V0VHdpbnMiLCJ0d2luIiwiZHp0d2luIiwiaXNQcm9iYW5kIiwiYXR0ciIsInNldFByb2JhbmQiLCJpc19wcm9iYW5kIiwicHJvYmFuZCIsImNvbWJpbmVBcnJheXMiLCJhcnIxIiwiYXJyMiIsImluQXJyYXkiLCJpbmNsdWRlX2NoaWxkcmVuIiwiY29ubmVjdGVkIiwiZ2V0X3BhcnRuZXJzIiwiZ2V0QWxsQ2hpbGRyZW4iLCJjaGlsZF9pZHgiLCJhbm9kZSIsInB0cnMiLCJibm9kZSIsInVuY29ubmVjdGVkIiwidGFyZ2V0IiwiZ2V0UHJvYmFuZEluZGV4IiwiY2hhbmdlIiwiaWkiLCJuY29ubmVjdCIsImlkeCIsImhhc19wYXJlbnQiLCJub3BhcmVudHMiLCJuYW1lcyIsIm1hcCIsInZhbCIsIl9pIiwic2V4IiwiZ2V0U2libGluZ3MiLCJnZXRBbGxTaWJsaW5ncyIsInNpYnMiLCJ0d2luX3R5cGUiLCJnZXRBZG9wdGVkU2libGluZ3MiLCJnZXREZXB0aCIsImRlcHRoIiwidG9wX2xldmVsIiwiZ2V0Tm9kZXNBdERlcHRoIiwiZm5vZGVzIiwiZXhjbHVkZV9uYW1lcyIsImRhdGEiLCJsaW5rTm9kZXMiLCJmbGF0dGVuTm9kZXMiLCJsaW5rcyIsImFuY2VzdG9ycyIsIm5vZGUiLCJyZWN1cnNlIiwiY29uc2FuZ3VpdHkiLCJub2RlMSIsIm5vZGUyIiwiYW5jZXN0b3JzMSIsImFuY2VzdG9yczIiLCJuYW1lczEiLCJhbmNlc3RvciIsIm5hbWVzMiIsImluZGV4IiwiZmxhdCIsImZvckVhY2giLCJhZGp1c3RfY29vcmRzIiwieG1pZCIsIm92ZXJsYXAiLCJkZXNjZW5kYW50cyIsImRpZmYiLCJjaGlsZDEiLCJjaGlsZDIiLCJub2Rlc092ZXJsYXAiLCJERUJVRyIsImxvZyIsImRlc2NlbmRhbnRzTmFtZXMiLCJkZXNjZW5kYW50IiwieG5ldyIsIm4iLCJzeW1ib2xfc2l6ZSIsInVybFBhcmFtIiwicmVzdWx0cyIsIlJlZ0V4cCIsImV4ZWMiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJnbWlkeCIsImdmaWR4IiwicHJvYmFuZF9hdHRyIiwia2V5cyIsInZhbHVlIiwibm9kZV9hdHRyIiwicGVkY2FjaGUiLCJpc0FycmF5IiwiayIsImZvdW5kIiwic3luY1R3aW5zIiwicmVidWlsZCIsInByb2JhbmRfYWRkX2NoaWxkIiwiYnJlYXN0ZmVlZGluZyIsIm5ld2NoaWxkIiwiYWRkY2hpbGQiLCJkZWxldGVfbm9kZV9ieV9uYW1lIiwib25Eb25lIiwiZGVsZXRlX25vZGVfZGF0YXNldCIsImV4aXN0cyIsInByaW50X29wdHMiLCJyZW1vdmUiLCJhcHBlbmQiLCJhZGQiLCJvcHRpb25zIiwiZXh0ZW5kIiwiYnRucyIsImxpcyIsImZhIiwiaXNfZnVsbHNjcmVlbiIsImRvY3VtZW50IiwiZnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsIndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50Iiwib24iLCJfZSIsImxvY2FsX2RhdGFzZXQiLCJtb3pGdWxsU2NyZWVuIiwid2Via2l0RnVsbFNjcmVlbiIsInRhcmdldERpdiIsIm1velJlcXVlc3RGdWxsU2NyZWVuIiwid2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4iLCJFbGVtZW50IiwiQUxMT1dfS0VZQk9BUkRfSU5QVVQiLCJtb3pDYW5jZWxGdWxsU2NyZWVuIiwid2Via2l0Q2FuY2VsRnVsbFNjcmVlbiIsInN0b3BQcm9wYWdhdGlvbiIsImhhc0NsYXNzIiwiZW1wdHkiLCJidWlsZCIsInJlc2l6YWJsZSIsImhlaWdodCIsIkNvbnRpbnVlIiwicmVzZXQiLCJrZWVwX3Byb2JhbmRfb25fcmVzZXQiLCJDYW5jZWwiLCJ0cmlnZ2VyIiwia2VlcF9wcm9iYW5kIiwic2VsZWN0ZWQiLCJ1cGRhdGVCdXR0b25zIiwiYWRkQ2xhc3MiLCJyZW1vdmVDbGFzcyIsIlJJU0tfRkFDVE9SX1NUT1JFIiwiT2JqZWN0Iiwic2hvd19yaXNrX2ZhY3Rvcl9zdG9yZSIsImdldF9ub25fYW5vbl9wZWRpZ3JlZSIsIm1ldGEiLCJnZXRfcGVkaWdyZWUiLCJmYW1pZCIsImlzYW5vbiIsImV4Y2wiLCJleGNsdWRlIiwicHJvYmFuZElkeCIsInBlZGlncmVlX3V0aWwiLCJtZW5hcmNoZSIsImdldF9yaXNrX2ZhY3RvciIsInBhcml0eSIsImZpcnN0X2JpcnRoIiwib2NfdXNlIiwibWh0X3VzZSIsImJtaSIsImFsY29ob2wiLCJtZW5vcGF1c2UiLCJtZGVuc2l0eSIsImhndCIsInRsIiwiZW5kbyIsImRpc3BsYXlfbmFtZSIsImNhbmNlcnMiLCJjYW5jZXIiLCJkaWFnbm9zaXNfYWdlIiwiYXNoa2VuYXppIiwiZ2VuZXRpY190ZXN0IiwicGF0aG9sb2d5X3Rlc3RzIiwic2F2ZV9yaXNrX2ZhY3RvciIsInJpc2tfZmFjdG9yX25hbWUiLCJzdG9yZV9uYW1lIiwicmVtb3ZlX3Jpc2tfZmFjdG9yIiwicGF0aG5hbWUiLCJzcGxpdCIsImZpbHRlciIsImVsIiwicG9wIiwiZ2V0X3Byc192YWx1ZXMiLCJwcnMiLCJoYXNJbnB1dCIsImlzRW1wdHkiLCJ0cmltIiwibXlPYmoiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJnZXRfc3VyZ2ljYWxfb3BzIiwibG9hZCIsInNhdmUiLCJicmVhc3RfY2FuY2VyX3BycyIsImFscGhhIiwienNjb3JlIiwib3Zhcmlhbl9jYW5jZXJfcHJzIiwiZXJyIiwic2F2ZV9jYW5yaXNrIiwicHJpbnQiLCJnZXRfcHJpbnRhYmxlX3N2ZyIsInN2Z19kb3dubG9hZCIsImRlZmVycmVkIiwic3ZnMmltZyIsIndoZW4iLCJhcHBseSIsImRvbmUiLCJnZXRCeU5hbWUiLCJhcmd1bWVudHMiLCJodG1sIiwiaW1nIiwibmV3VGFiIiwib3BlbiIsIndyaXRlIiwiY3JlYXRlRWxlbWVudCIsImRvd25sb2FkIiwiYm9keSIsImFwcGVuZENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJncmVwIiwibyIsInN2ZyIsImRlZmVycmVkX25hbWUiLCJkZWZhdWx0cyIsImlzY2FudmciLCJyZXNvbHV0aW9uIiwiaW1nX3R5cGUiLCJmaW5kIiwiZDNvYmoiLCJkMyIsInNlbGVjdCIsImdldCIsImxvd2VyIiwiRGVmZXJyZWQiLCJzdmdTdHIiLCJYTUxTZXJpYWxpemVyIiwic2VyaWFsaXplVG9TdHJpbmciLCJ4bWwiLCJpbWdzcmMiLCJidG9hIiwidW5lc2NhcGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjYW52YXMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm9ubG9hZCIsInJlcGxhY2UiLCJ2IiwiY2FudmciLCJDYW52ZyIsImZyb21TdHJpbmciLCJzY2FsZVdpZHRoIiwic2NhbGVIZWlnaHQiLCJpZ25vcmVEaW1lbnNpb25zIiwic3RhcnQiLCJkcmF3SW1hZ2UiLCJyZXNvbHZlIiwidG9EYXRhVVJMIiwic3JjIiwicHJvbWlzZSIsImdldE1hdGNoZXMiLCJzdHIiLCJteVJlZ2V4cCIsIm1hdGNoZXMiLCJjIiwibGFzdEluZGV4IiwiZXJyb3IiLCJ1bmlxdWVfdXJscyIsInN2Z19odG1sIiwicXVvdGUiLCJtMSIsIm0yIiwibmV3dmFsIiwiY29weV9zdmciLCJzdmdfbm9kZSIsInNlbGVjdEFsbCIsInRyZWVfZGltZW5zaW9ucyIsImdldF90cmVlX2RpbWVuc2lvbnMiLCJzdmdfZGl2IiwiY2xvbmUiLCJhcHBlbmRUbyIsIndpZCIsInNjYWxlIiwieHNjYWxlIiwieXNjYWxlIiwieXRyYW5zZm9ybSIsImNvbnN0cnVjdG9yIiwiQXJyYXkiLCJjc3NGaWxlcyIsInByaW50V2luZG93IiwiaGVhZENvbnRlbnQiLCJjc3MiLCJjbG9zZSIsImZvY3VzIiwic2V0VGltZW91dCIsInNhdmVfZmlsZSIsImNvbnRlbnQiLCJmaWxlbmFtZSIsInR5cGUiLCJmaWxlIiwiQmxvYiIsIm1zU2F2ZU9yT3BlbkJsb2IiLCJ1cmwiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJyZXZva2VPYmplY3RVUkwiLCJjYW5yaXNrX3ZhbGlkYXRpb24iLCJmaWxlcyIsInJpc2tfZmFjdG9ycyIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJyZXN1bHQiLCJzdGFydHNXaXRoIiwicmVhZEJvYWRpY2VhVjQiLCJjYW5yaXNrX2RhdGEiLCJyZWFkQ2FuUmlza1YxIiwicmVhZExpbmthZ2UiLCJ2YWxpZGF0ZV9wZWRpZ3JlZSIsImVycjEiLCJtZXNzYWdlIiwiYWNjX0ZhbUhpc3RfdGlja2VkIiwiYWNjX0ZhbUhpc3RfTGVhdmUiLCJSRVNVTFQiLCJGTEFHX0ZBTUlMWV9NT0RBTCIsImVycjMiLCJlcnIyIiwib25lcnJvciIsImV2ZW50IiwiY29kZSIsInJlYWRBc1RleHQiLCJib2FkaWNlYV9saW5lcyIsImxpbmVzIiwicGVkIiwiaW5kaSIsImFmZmVjdGVkIiwiYWxsZWxlcyIsInVuc2hpZnQiLCJwcm9jZXNzX3BlZCIsImhkciIsImxuIiwib3BzIiwib3BkYXRhIiwiZGVsaW0iLCJnZW5lX3Rlc3QiLCJwYXRoX3Rlc3QiLCJ2ZXJzaW9uIiwiZ2V0TGV2ZWwiLCJtYXhfbGV2ZWwiLCJsZXZlbCIsInBpZHgiLCJnZXRQYXJ0bmVySWR4IiwidXBkYXRlX3BhcmVudHNfbGV2ZWwiLCJwYXJlbnRzIiwibWEiLCJwYSIsInBlZGNhY2hlX2N1cnJlbnQiLCJwcm9wIiwidXBkYXRlX2FzaGtuIiwiaXMiLCJzd2l0Y2hlcyIsImlzd2l0Y2giLCJzIiwidXBkYXRlX2NhbmNlcl9ieV9zZXgiLCJhcHByb3hfZGlhZ25vc2lzX2FnZSIsInN1YnN0cmluZyIsInJvdW5kNSIsImNoZWNrZWQiLCJ0cmVzIiwidmFsaWQiLCJzaG93Iiwib3Zhcmlhbl9jYW5jZXJfZGlhZ25vc2lzX2FnZSIsImNsb3Nlc3QiLCJoaWRlIiwicHJvc3RhdGVfY2FuY2VyX2RpYWdub3Npc19hZ2UiLCJ4MSIsIngyIiwicm91bmQiLCJkcmFnZ2luZyIsImxhc3RfbW91c2VvdmVyIiwiYWRkV2lkZ2V0cyIsImZvbnRfc2l6ZSIsInBvcHVwX3NlbGVjdGlvbiIsInN0eWxlIiwic3F1YXJlIiwic3F1YXJlX3RpdGxlIiwiY2lyY2xlIiwiY2lyY2xlX3RpdGxlIiwidW5zcGVjaWZpZWQiLCJhZGRfcGVyc29uIiwiY2xhc3NlZCIsImRhdHVtIiwiYWRkc2libGluZyIsImhpZ2hsaWdodCIsImRyYWdfaGFuZGxlIiwiX2QiLCJmeCIsIm9mZiIsImZ5Iiwid2lkZ2V0cyIsImVkaXQiLCJzZXR0aW5ncyIsIndpZGdldCIsInN0eWxlcyIsInBhcmVudE5vZGUiLCJvcHQiLCJvcGVuRWRpdERpYWxvZyIsImFkZHBhcmVudHMiLCJhZGRwYXJ0bmVyIiwiY3RybEtleSIsInNwbGljZSIsIm5vZGVjbGljayIsInNldExpbmVEcmFnUG9zaXRpb24iLCJ4Y29vcmQiLCJwb2ludGVyIiwieWNvb3JkIiwibGluZV9kcmFnX3NlbGVjdGlvbiIsImRsaW5lIiwiZHJhZyIsImRyYWdzdGFydCIsImRyYWdzdG9wIiwic291cmNlRXZlbnQiLCJkeCIsImR5IiwieW5ldyIsInkxIiwieTIiLCJ0cmFuc2xhdGUiLCJhdXRvT3BlbiIsInRhYmxlIiwiZGlzZWFzZXMiLCJkaXNlYXNlX2NvbG91ciIsImNvbG91ciIsImtrIiwicm9vdHMiLCJ6b29tSW4iLCJ6b29tT3V0IiwibGFiZWxzIiwiZm9udF9mYW1pbHkiLCJmb250X3dlaWdodCIsImJhY2tncm91bmQiLCJub2RlX2JhY2tncm91bmQiLCJ2YWxpZGF0ZSIsInBidXR0b25zIiwiaW8iLCJncm91cF90b3BfbGV2ZWwiLCJwZWRpZ3JlZV91dGlscyIsInN2Z19kaW1lbnNpb25zIiwiZ2V0X3N2Z19kaW1lbnNpb25zIiwieHl0cmFuc2Zvcm0iLCJ4dHJhbnNmb3JtIiwiaGlkZGVuX3Jvb3QiLCJoaWVyYXJjaHkiLCJ0cmVlbWFwIiwidHJlZSIsInNlcGFyYXRpb24iLCJzaXplIiwidmlzX25vZGVzIiwiY3JlYXRlX2VyciIsInB0ckxpbmtOb2RlcyIsImNoZWNrX3B0cl9saW5rcyIsImVudGVyIiwibWlzY2FycmlhZ2UiLCJ0ZXJtaW5hdGlvbiIsInN5bWJvbCIsInN5bWJvbFRyaWFuZ2xlIiwic3ltYm9sQ2lyY2xlIiwic3ltYm9sU3F1YXJlIiwicGllbm9kZSIsIm5jYW5jZXJzIiwicHJlZml4SW5PYmoiLCJwaWUiLCJhcmMiLCJpbm5lclJhZGl1cyIsIm91dGVyUmFkaXVzIiwiYWRvcHRlZF9pbiIsImFkb3B0ZWRfb3V0IiwiaW5kZW50IiwiZ2V0X2JyYWNrZXQiLCJhZGRMYWJlbCIsImdldFB4IiwiaWxhYiIsImxhYmVsIiwieV9vZmZzZXQiLCJ2YXJzIiwiaXZhciIsImRpc2Vhc2UiLCJkaXMiLCJjbGFzaF9kZXB0aCIsImRyYXdfcGF0aCIsImNsYXNoIiwiZHkxIiwiZHkyIiwiY3NoaWZ0IiwibCIsInBhdGgiLCJkeDEiLCJkeDIiLCJpbnNlcnQiLCJkaXZvcmNlZCIsImNoZWNrX3B0cl9saW5rX2NsYXNoZXMiLCJwYXJlbnRfbm9kZXMiLCJwYXJlbnRfbm9kZV9uYW1lIiwiZGl2b3JjZV9wYXRoIiwicGF0aDIiLCJzb3VyY2UiLCJkYXNoX2xlbiIsImRhc2hfYXJyYXkiLCJ1c2VkbGVuIiwidHdpbngiLCJ4bWluIiwidCIsInRoaXN4IiwieW1pZCIsInhoYmFyIiwieHgiLCJ5eSIsInByb2JhbmROb2RlIiwidHJpaWQiLCJzY2FsZUV4dGVudCIsInpvb21GbiIsInRyYW5zZm9ybSIsInRvU3RyaW5nIiwiRXJyb3IiLCJ1bmlxdWVuYW1lcyIsImZhbWlkcyIsImpvaW4iLCJ1YyIsIl9uIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwibWF4c2NvcmUiLCJnZW5lcmF0aW9uIiwic2NvcmUiLCJtYXhfZGVwdGgiLCJ0cmVlX3dpZHRoIiwidHJlZV9oZWlnaHQiLCJ0b3BfbGV2ZWxfc2VlbiIsImVtVmFsIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImZvbnRTaXplIiwiZnRleHQiLCJjbGFzc19sYWJlbCIsInRlbXBsYXRlcyIsInVwZGF0ZSIsIm5jaGlsZCIsInB0cl9uYW1lIiwicGFydG5lciIsInR3aW5faWQiLCJnZXRVbmlxdWVUd2luSUQiLCJuZXdjaGlsZHJlbiIsImFkZF9saHMiLCJuZXdiaWUiLCJzZXRNelR3aW4iLCJkMSIsImQyIiwibXoiLCJjaGVja1R3aW5zIiwidHdpbl90eXBlcyIsImZsYXRfdHJlZSIsInRyZWVfbm9kZSIsInBpZCIsIm5vZGVfbW90aGVyIiwibm9kZV9mYXRoZXIiLCJub2RlX3NpYnMiLCJyaWQiLCJsaWQiLCJzaWQiLCJmYWlkeCIsIm1vaWR4IiwidG1wZmEiLCJvcnBoYW5zIiwibmlkIiwib2lkIiwib2lkeCIsInB0cl9ub2RlIiwiYWRqYWNlbnRfbm9kZXMiLCJleGNsdWRlcyIsImRub2RlcyIsImxoc19ub2RlIiwicmhzX25vZGUiLCJkZWxldGVzIiwiZDNub2RlIiwicHMiLCJjaGls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
