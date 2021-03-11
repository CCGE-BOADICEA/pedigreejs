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

  exports.canrisk_file = canrisk_file;
  exports.io = io;
  exports.pedcache = pedcache;
  exports.pedigree_utils = pedigree_utils;
  exports.pedigreejs = pedigree;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVkaWdyZWVqcy5qcyIsInNvdXJjZXMiOlsiLi4vZXMvcGVkY2FjaGUuanMiLCIuLi9lcy9wZWRpZ3JlZV91dGlscy5qcyIsIi4uL2VzL3BidXR0b25zLmpzIiwiLi4vZXMvY2Fucmlza19maWxlLmpzIiwiLi4vZXMvaW8uanMiLCIuLi9lcy9wZWRpZ3JlZV9mb3JtLmpzIiwiLi4vZXMvd2lkZ2V0cy5qcyIsIi4uL2VzL3BlZGlncmVlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vc3RvcmUgYSBoaXN0b3J5IG9mIHBlZGlncmVlXG5cbmxldCBtYXhfbGltaXQgPSAyNTtcbmxldCBkaWN0X2NhY2hlID0ge307XG5cbi8vIHRlc3QgaWYgYnJvd3NlciBzdG9yYWdlIGlzIHN1cHBvcnRlZFxuZnVuY3Rpb24gaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSB7XG5cdHRyeSB7XG5cdFx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnYXJyYXknKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0aWYob3B0cy5zdG9yZV90eXBlICE9PSAnbG9jYWwnICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gJ3Nlc3Npb24nICYmIG9wdHMuc3RvcmVfdHlwZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0bGV0IG1vZCA9ICd0ZXN0Jztcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShtb2QsIG1vZCk7XG5cdFx0bG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0obW9kKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldF9wcmVmaXgob3B0cykge1xuXHRyZXR1cm4gXCJQRURJR1JFRV9cIitvcHRzLmJ0bl90YXJnZXQrXCJfXCI7XG59XG5cbi8vIHVzZSBkaWN0X2NhY2hlIHRvIHN0b3JlIGNhY2hlIGFzIGFuIGFycmF5XG5mdW5jdGlvbiBnZXRfYXJyKG9wdHMpIHtcblx0cmV0dXJuIGRpY3RfY2FjaGVbZ2V0X3ByZWZpeChvcHRzKV07XG59XG5cbmZ1bmN0aW9uIGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGl0ZW0pIHtcblx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnbG9jYWwnKVxuXHRcdHJldHVybiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKTtcblx0ZWxzZVxuXHRcdHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGl0ZW0pO1xufVxuXG5mdW5jdGlvbiBzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBuYW1lLCBpdGVtKSB7XG5cdGlmKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJylcblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLnNldEl0ZW0obmFtZSwgaXRlbSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBpdGVtKTtcbn1cblxuLy8gY2xlYXIgYWxsIHN0b3JhZ2UgaXRlbXNcbmZ1bmN0aW9uIGNsZWFyX2Jyb3dzZXJfc3RvcmUob3B0cykge1xuXHRpZihvcHRzLnN0b3JlX3R5cGUgPT09ICdsb2NhbCcpXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIHNlc3Npb25TdG9yYWdlLmNsZWFyKCk7XG59XG5cbi8vIHJlbW92ZSBhbGwgc3RvcmFnZSBpdGVtcyB3aXRoIGtleXMgdGhhdCBoYXZlIHRoZSBwZWRpZ3JlZSBoaXN0b3J5IHByZWZpeFxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyX3BlZGlncmVlX2RhdGEob3B0cykge1xuXHRsZXQgcHJlZml4ID0gZ2V0X3ByZWZpeChvcHRzKTtcblx0bGV0IHN0b3JlID0gKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJyA/IGxvY2FsU3RvcmFnZSA6IHNlc3Npb25TdG9yYWdlKTtcblx0bGV0IGl0ZW1zID0gW107XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBzdG9yZS5sZW5ndGg7IGkrKyl7XG5cdFx0aWYoc3RvcmUua2V5KGkpLmluZGV4T2YocHJlZml4KSA9PSAwKVxuXHRcdFx0aXRlbXMucHVzaChzdG9yZS5rZXkoaSkpO1xuXHR9XG5cdGZvcihsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKylcblx0XHRzdG9yZS5yZW1vdmVJdGVtKGl0ZW1zW2ldKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9jb3VudChvcHRzKSB7XG5cdGxldCBjb3VudDtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y291bnQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydDT1VOVCcpO1xuXHRlbHNlXG5cdFx0Y291bnQgPSBkaWN0X2NhY2hlW2dldF9wcmVmaXgob3B0cykrJ0NPVU5UJ107XG5cdGlmKGNvdW50ICE9PSBudWxsICYmIGNvdW50ICE9PSB1bmRlZmluZWQpXG5cdFx0cmV0dXJuIGNvdW50O1xuXHRyZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gc2V0X2NvdW50KG9wdHMsIGNvdW50KSB7XG5cdGlmIChoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHNldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ0NPVU5UJywgY291bnQpO1xuXHRlbHNlXG5cdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpKydDT1VOVCddID0gY291bnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0X2NhY2hlKG9wdHMpIHtcblx0aWYoIW9wdHMuZGF0YXNldClcblx0XHRyZXR1cm47XG5cdGxldCBjb3VudCA9IGdldF9jb3VudChvcHRzKTtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpIHsgICAvLyBsb2NhbCBzdG9yYWdlXG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKStjb3VudCwgSlNPTi5zdHJpbmdpZnkob3B0cy5kYXRhc2V0KSk7XG5cdH0gZWxzZSB7ICAgLy8gVE9ETyA6OiBhcnJheSBjYWNoZVxuXHRcdGNvbnNvbGUud2FybignTG9jYWwgc3RvcmFnZSBub3QgZm91bmQvc3VwcG9ydGVkIGZvciB0aGlzIGJyb3dzZXIhJywgb3B0cy5zdG9yZV90eXBlKTtcblx0XHRtYXhfbGltaXQgPSA1MDA7XG5cdFx0aWYoZ2V0X2FycihvcHRzKSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0ZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpXSA9IFtdO1xuXHRcdGdldF9hcnIob3B0cykucHVzaChKU09OLnN0cmluZ2lmeShvcHRzLmRhdGFzZXQpKTtcblx0fVxuXHRpZihjb3VudCA8IG1heF9saW1pdClcblx0XHRjb3VudCsrO1xuXHRlbHNlXG5cdFx0Y291bnQgPSAwO1xuXHRzZXRfY291bnQob3B0cywgY291bnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbnN0b3JlKG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRpZihnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKSAhPT0gbnVsbClcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAoZ2V0X2FycihvcHRzKSAmJiBnZXRfYXJyKG9wdHMpLmxlbmd0aCA+IDAgPyBnZXRfYXJyKG9wdHMpLmxlbmd0aCA6IC0xKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50KG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBnZXRfY291bnQob3B0cyktMTtcblx0aWYoY3VycmVudCA9PSAtMSlcblx0XHRjdXJyZW50ID0gbWF4X2xpbWl0O1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrY3VycmVudCkpO1xuXHRlbHNlIGlmKGdldF9hcnIob3B0cykpXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtjdXJyZW50XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0KG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkge1xuXHRcdGZvcihsZXQgaT1tYXhfbGltaXQ7IGk+MDsgaS0tKSB7XG5cdFx0XHRsZXQgaXQgPSBnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKyhpLTEpKTtcblx0XHRcdGlmKGl0ICE9PSBudWxsKSB7XG5cdFx0XHRcdHNldF9jb3VudChvcHRzLCBpKTtcblx0XHRcdFx0cmV0dXJuIEpTT04ucGFyc2UoaXQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZXQgYXJyID0gZ2V0X2FycihvcHRzKTtcblx0XHRpZihhcnIpXG5cdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShhcnIoYXJyLmxlbmd0aC0xKSk7XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXZpb3VzKG9wdHMsIHByZXZpb3VzKSB7XG5cdGlmKHByZXZpb3VzID09PSB1bmRlZmluZWQpXG5cdFx0cHJldmlvdXMgPSBnZXRfY291bnQob3B0cykgLSAyO1xuXG5cdGlmKHByZXZpb3VzIDwgMCkge1xuXHRcdGxldCBuc3RvcmUgPSBuc3RvcmUob3B0cyk7XG5cdFx0aWYobnN0b3JlIDwgbWF4X2xpbWl0KVxuXHRcdFx0cHJldmlvdXMgPSBuc3RvcmUgLSAxO1xuXHRcdGVsc2Vcblx0XHRcdHByZXZpb3VzID0gbWF4X2xpbWl0IC0gMTtcblx0fVxuXHRzZXRfY291bnQob3B0cywgcHJldmlvdXMgKyAxKTtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSlcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpK3ByZXZpb3VzKSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYXJyKG9wdHMpW3ByZXZpb3VzXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXh0KG9wdHMsIG5leHQpIHtcblx0aWYobmV4dCA9PT0gdW5kZWZpbmVkKVxuXHRcdG5leHQgPSBnZXRfY291bnQob3B0cyk7XG5cdGlmKG5leHQgPj0gbWF4X2xpbWl0KVxuXHRcdG5leHQgPSAwO1xuXG5cdHNldF9jb3VudChvcHRzLCBwYXJzZUludChuZXh0KSArIDEpO1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrbmV4dCkpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2FycihvcHRzKVtuZXh0XSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcihvcHRzKSB7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0Y2xlYXJfYnJvd3Nlcl9zdG9yZShvcHRzKTtcblx0ZGljdF9jYWNoZSA9IHt9O1xufVxuXG4vLyB6b29tIC0gc3RvcmUgdHJhbnNsYXRpb24gY29vcmRzXG5leHBvcnQgZnVuY3Rpb24gc2V0cG9zaXRpb24ob3B0cywgeCwgeSwgem9vbSkge1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKSB7XG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1gnLCB4KTtcblx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWScsIHkpO1xuXHRcdGlmKHpvb20pXG5cdFx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWk9PTScsIHpvb20pO1xuXHR9IGVsc2Uge1xuXHRcdC8vVE9ET1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRwb3NpdGlvbihvcHRzKSB7XG5cdGlmKCFoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpIHx8XG5cdFx0KGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldF9wcmVmaXgob3B0cykrJ19YJykgPT09IG51bGwgJiZcblx0XHQgc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShnZXRfcHJlZml4KG9wdHMpKydfWCcpID09PSBudWxsKSlcblx0XHRyZXR1cm4gW251bGwsIG51bGxdO1xuXHRsZXQgcG9zID0gWyBwYXJzZUludChnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWCcpKSxcblx0XHRcdFx0cGFyc2VJbnQoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1knKSkgXTtcblx0aWYoZ2V0X2Jyb3dzZXJfc3RvcmUoZ2V0X3ByZWZpeChvcHRzKSsnX1pPT00nKSAhPT0gbnVsbClcblx0XHRwb3MucHVzaChwYXJzZUZsb2F0KGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19aT09NJykpKTtcblx0cmV0dXJuIHBvcztcbn1cbiIsIi8vIFBlZGlncmVlIFRyZWUgVXRpbHNcblxuaW1wb3J0IHtzeW5jVHdpbnMsIHJlYnVpbGQsIGFkZGNoaWxkLCBkZWxldGVfbm9kZV9kYXRhc2V0fSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCAqIGFzIHBlZGNhY2hlIGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNJRSgpIHtcblx0IGxldCB1YSA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG5cdCAvKiBNU0lFIHVzZWQgdG8gZGV0ZWN0IG9sZCBicm93c2VycyBhbmQgVHJpZGVudCB1c2VkIHRvIG5ld2VyIG9uZXMqL1xuXHQgcmV0dXJuIHVhLmluZGV4T2YoXCJNU0lFIFwiKSA+IC0xIHx8IHVhLmluZGV4T2YoXCJUcmlkZW50L1wiKSA+IC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFZGdlKCkge1xuXHQgcmV0dXJuIG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0VkZ2UvZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb3B5X2RhdGFzZXQoZGF0YXNldCkge1xuXHRpZihkYXRhc2V0WzBdLmlkKSB7IC8vIHNvcnQgYnkgaWRcblx0XHRkYXRhc2V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gKCFhLmlkIHx8ICFiLmlkID8gMDogKGEuaWQgPiBiLmlkKSA/IDEgOiAoKGIuaWQgPiBhLmlkKSA/IC0xIDogMCkpO30pO1xuXHR9XG5cblx0bGV0IGRpc2FsbG93ZWQgPSBbXCJpZFwiLCBcInBhcmVudF9ub2RlXCJdO1xuXHRsZXQgbmV3ZGF0YXNldCA9IFtdO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKXtcblx0XHRsZXQgb2JqID0ge307XG5cdFx0Zm9yKGxldCBrZXkgaW4gZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoZGlzYWxsb3dlZC5pbmRleE9mKGtleSkgPT0gLTEpXG5cdFx0XHRcdG9ialtrZXldID0gZGF0YXNldFtpXVtrZXldO1xuXHRcdH1cblx0XHRuZXdkYXRhc2V0LnB1c2gob2JqKTtcblx0fVxuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLyoqXG4gKiAgR2V0IGZvcm1hdHRlZCB0aW1lIG9yIGRhdGEgJiB0aW1lXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGb3JtYXR0ZWREYXRlKHRpbWUpe1xuXHRsZXQgZCA9IG5ldyBEYXRlKCk7XG5cdGlmKHRpbWUpXG5cdFx0cmV0dXJuICgnMCcgKyBkLmdldEhvdXJzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0TWludXRlcygpKS5zbGljZSgtMikgKyBcIjpcIiArICgnMCcgKyBkLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpO1xuXHRlbHNlXG5cdFx0cmV0dXJuIGQuZ2V0RnVsbFllYXIoKSArIFwiLVwiICsgKCcwJyArIChkLmdldE1vbnRoKCkgKyAxKSkuc2xpY2UoLTIpICsgXCItXCIgKyAoJzAnICsgZC5nZXREYXRlKCkpLnNsaWNlKC0yKSArIFwiIFwiICsgKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG4gfVxuXG4vKipcbiAqIFNob3cgbWVzc2FnZSBvciBjb25maXJtYXRpb24gZGlhbG9nLlxuICogQHBhcmFtIHRpdGxlXHQgLSBkaWFsb2cgd2luZG93IHRpdGxlXG4gKiBAcGFyYW0gbXNnXHQgICAtIG1lc3NhZ2UgdG8gZGlhc3BsYXlcbiAqIEBwYXJhbSBvbkNvbmZpcm0gLSBmdW5jdGlvbiB0byBjYWxsIGluIGEgY29uZmlybWF0aW9uIGRpYWxvZ1xuICogQHBhcmFtIG9wdHNcdCAgLSBwZWRpZ3JlZWpzIG9wdGlvbnNcbiAqIEBwYXJhbSBkYXRhc2V0XHQtIHBlZGlncmVlIGRhdGFzZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VzKHRpdGxlLCBtc2csIG9uQ29uZmlybSwgb3B0cywgZGF0YXNldCkge1xuXHRpZihvbkNvbmZpcm0pIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHRcdG1vZGFsOiB0cnVlLFxuXHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdHdpZHRoOiAzNTAsXG5cdFx0XHRcdGJ1dHRvbnM6IHtcblx0XHRcdFx0XHRcIlllc1wiOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHRcdG9uQ29uZmlybShvcHRzLCBkYXRhc2V0KTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFwiTm9cIjogZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coJ2Nsb3NlJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+Jyttc2crJzwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHR3aWR0aDogMzUwLFxuXHRcdFx0YnV0dG9uczogW3tcblx0XHRcdFx0dGV4dDogXCJPS1wiLFxuXHRcdFx0XHRjbGljazogZnVuY3Rpb24oKSB7ICQoIHRoaXMgKS5kaWFsb2coIFwiY2xvc2VcIiApO31cblx0XHRcdH1dXG5cdFx0fSk7XG5cdH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhZ2UgYW5kIHlvYiBpcyBjb25zaXN0ZW50IHdpdGggY3VycmVudCB5ZWFyLiBUaGUgc3VtIG9mIGFnZSBhbmRcbiAqIHlvYiBzaG91bGQgbm90IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBjdXJyZW50IHllYXIuIElmIGFsaXZlIHRoZVxuICogYWJzb2x1dGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBzdW0gb2YgYWdlIGFuZCB5ZWFyIG9mIGJpcnRoIGFuZCB0aGVcbiAqIGN1cnJlbnQgeWVhciBzaG91bGQgYmUgPD0gMS5cbiAqIEBwYXJhbSBhZ2VcdC0gYWdlIGluIHllYXJzLlxuICogQHBhcmFtIHlvYlx0LSB5ZWFyIG9mIGJpcnRoLlxuICogQHBhcmFtIHN0YXR1cyAtIDAgPSBhbGl2ZSwgMSA9IGRlYWQuXG4gKiBAcmV0dXJuIHRydWUgaWYgYWdlIGFuZCB5b2IgYXJlIGNvbnNpc3RlbnQgd2l0aCBjdXJyZW50IHllYXIgb3RoZXJ3aXNlIGZhbHNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfYWdlX3lvYihhZ2UsIHlvYiwgc3RhdHVzKSB7XG5cdGxldCB5ZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuXHRsZXQgc3VtID0gcGFyc2VJbnQoYWdlKSArIHBhcnNlSW50KHlvYik7XG5cdGlmKHN0YXR1cyA9PSAxKSB7ICAgLy8gZGVjZWFzZWRcblx0XHRyZXR1cm4geWVhciA+PSBzdW07XG5cdH1cblx0cmV0dXJuIE1hdGguYWJzKHllYXIgLSBzdW0pIDw9IDEgJiYgeWVhciA+PSBzdW07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoc3RyaW5nKSB7XG5cdHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VpZChsZW4pIHtcblx0bGV0IHRleHQgPSBcIlwiO1xuXHRsZXQgcG9zc2libGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcblx0Zm9yKCBsZXQgaT0wOyBpIDwgbGVuOyBpKysgKVxuXHRcdHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuXHRyZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVHJlZShvcHRzLCBwZXJzb24sIHJvb3QsIHBhcnRuZXJMaW5rcywgaWQpIHtcblx0aWYgKHR5cGVvZiBwZXJzb24uY2hpbGRyZW4gPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0cGVyc29uLmNoaWxkcmVuID0gZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBwZXJzb24pO1xuXG5cdGlmICh0eXBlb2YgcGFydG5lckxpbmtzID09PSB0eXBlb2YgdW5kZWZpbmVkKSB7XG5cdFx0cGFydG5lckxpbmtzID0gW107XG5cdFx0aWQgPSAxO1xuXHR9XG5cblx0bGV0IG5vZGVzID0gZmxhdHRlbihyb290KTtcblx0Ly9jb25zb2xlLmxvZygnTkFNRT0nK3BlcnNvbi5uYW1lKycgTk8uIENISUxEUkVOPScrcGVyc29uLmNoaWxkcmVuLmxlbmd0aCk7XG5cdGxldCBwYXJ0bmVycyA9IFtdO1xuXHQkLmVhY2gocGVyc29uLmNoaWxkcmVuLCBmdW5jdGlvbihpLCBjaGlsZCkge1xuXHRcdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGosIHApIHtcblx0XHRcdGlmICgoKGNoaWxkLm5hbWUgPT09IHAubW90aGVyKSB8fCAoY2hpbGQubmFtZSA9PT0gcC5mYXRoZXIpKSAmJiBjaGlsZC5pZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGxldCBtID0gZ2V0Tm9kZUJ5TmFtZShub2RlcywgcC5tb3RoZXIpO1xuXHRcdFx0XHRsZXQgZiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHAuZmF0aGVyKTtcblx0XHRcdFx0bSA9IChtICE9PSB1bmRlZmluZWQ/IG0gOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5tb3RoZXIpKTtcblx0XHRcdFx0ZiA9IChmICE9PSB1bmRlZmluZWQ/IGYgOiBnZXROb2RlQnlOYW1lKG9wdHMuZGF0YXNldCwgcC5mYXRoZXIpKTtcblx0XHRcdFx0aWYoIWNvbnRhaW5zX3BhcmVudChwYXJ0bmVycywgbSwgZikpXG5cdFx0XHRcdFx0cGFydG5lcnMucHVzaCh7J21vdGhlcic6IG0sICdmYXRoZXInOiBmfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXHQkLm1lcmdlKHBhcnRuZXJMaW5rcywgcGFydG5lcnMpO1xuXG5cdCQuZWFjaChwYXJ0bmVycywgZnVuY3Rpb24oaSwgcHRyKSB7XG5cdFx0bGV0IG1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0bGV0IGZhdGhlciA9IHB0ci5mYXRoZXI7XG5cdFx0bW90aGVyLmNoaWxkcmVuID0gW107XG5cdFx0bGV0IHBhcmVudCA9IHtcblx0XHRcdFx0bmFtZSA6IG1ha2VpZCg0KSxcblx0XHRcdFx0aGlkZGVuIDogdHJ1ZSxcblx0XHRcdFx0cGFyZW50IDogbnVsbCxcblx0XHRcdFx0ZmF0aGVyIDogZmF0aGVyLFxuXHRcdFx0XHRtb3RoZXIgOiBtb3RoZXIsXG5cdFx0XHRcdGNoaWxkcmVuIDogZ2V0Q2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBtb3RoZXIsIGZhdGhlcilcblx0XHR9O1xuXG5cdFx0bGV0IG1pZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIubmFtZSk7XG5cdFx0bGV0IGZpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0aWYoISgnaWQnIGluIGZhdGhlcikgJiYgISgnaWQnIGluIG1vdGhlcikpXG5cdFx0XHRpZCA9IHNldENoaWxkcmVuSWQocGVyc29uLmNoaWxkcmVuLCBpZCk7XG5cblx0XHQvLyBsb29rIGF0IGdyYW5kcGFyZW50cyBpbmRleFxuXHRcdGxldCBncCA9IGdldF9ncmFuZHBhcmVudHNfaWR4KG9wdHMuZGF0YXNldCwgbWlkeCwgZmlkeCk7XG5cdFx0aWYoZ3AuZmlkeCA8IGdwLm1pZHgpIHtcblx0XHRcdGZhdGhlci5pZCA9IGlkKys7XG5cdFx0XHRwYXJlbnQuaWQgPSBpZCsrO1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bW90aGVyLmlkID0gaWQrKztcblx0XHRcdHBhcmVudC5pZCA9IGlkKys7XG5cdFx0XHRmYXRoZXIuaWQgPSBpZCsrO1xuXHRcdH1cblx0XHRpZCA9IHVwZGF0ZVBhcmVudChtb3RoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRpZCA9IHVwZGF0ZVBhcmVudChmYXRoZXIsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKTtcblx0XHRwZXJzb24uY2hpbGRyZW4ucHVzaChwYXJlbnQpO1xuXHR9KTtcblx0aWQgPSBzZXRDaGlsZHJlbklkKHBlcnNvbi5jaGlsZHJlbiwgaWQpO1xuXG5cdCQuZWFjaChwZXJzb24uY2hpbGRyZW4sIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZCA9IGJ1aWxkVHJlZShvcHRzLCBwLCByb290LCBwYXJ0bmVyTGlua3MsIGlkKVsxXTtcblx0fSk7XG5cdHJldHVybiBbcGFydG5lckxpbmtzLCBpZF07XG59XG5cbi8vIHVwZGF0ZSBwYXJlbnQgbm9kZSBhbmQgc29ydCB0d2luc1xuZnVuY3Rpb24gdXBkYXRlUGFyZW50KHAsIHBhcmVudCwgaWQsIG5vZGVzLCBvcHRzKSB7XG5cdC8vIGFkZCB0byBwYXJlbnQgbm9kZVxuXHRpZigncGFyZW50X25vZGUnIGluIHApXG5cdFx0cC5wYXJlbnRfbm9kZS5wdXNoKHBhcmVudCk7XG5cdGVsc2Vcblx0XHRwLnBhcmVudF9ub2RlID0gW3BhcmVudF07XG5cblx0Ly8gY2hlY2sgdHdpbnMgbGllIG5leHQgdG8gZWFjaCBvdGhlclxuXHRpZihwLm16dHdpbiB8fCBwLmR6dHdpbnMpIHtcblx0XHRsZXQgdHdpbnMgPSBnZXRUd2lucyhvcHRzLmRhdGFzZXQsIHApO1xuXHRcdGZvcihsZXQgaT0wOyBpPHR3aW5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgdHdpbiA9IGdldE5vZGVCeU5hbWUobm9kZXMsIHR3aW5zW2ldLm5hbWUpO1xuXHRcdFx0aWYodHdpbilcblx0XHRcdFx0dHdpbi5pZCA9IGlkKys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBpZDtcbn1cblxuZnVuY3Rpb24gc2V0Q2hpbGRyZW5JZChjaGlsZHJlbiwgaWQpIHtcblx0Ly8gc29ydCB0d2lucyB0byBsaWUgbmV4dCB0byBlYWNoIG90aGVyXG5cdGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHRcdGlmKGEubXp0d2luICYmIGIubXp0d2luICYmIGEubXp0d2luID09IGIubXp0d2luKVxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0ZWxzZSBpZihhLmR6dHdpbiAmJiBiLmR6dHdpbiAmJiBhLmR6dHdpbiA9PSBiLmR6dHdpbilcblx0XHRcdHJldHVybiAwO1xuXHRcdGVsc2UgaWYoYS5tenR3aW4gfHwgYi5tenR3aW4gfHwgYS5kenR3aW4gfHwgYi5kenR3aW4pXG5cdFx0XHRyZXR1cm4gMTtcblx0XHRyZXR1cm4gMDtcblx0fSk7XG5cblx0JC5lYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYocC5pZCA9PT0gdW5kZWZpbmVkKSBwLmlkID0gaWQrKztcblx0fSk7XG5cdHJldHVybiBpZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvYmFuZChvYmopIHtcblx0cmV0dXJuIHR5cGVvZiAkKG9iaikuYXR0cigncHJvYmFuZCcpICE9PSB0eXBlb2YgdW5kZWZpbmVkICYmICQob2JqKS5hdHRyKCdwcm9iYW5kJykgIT09IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0UHJvYmFuZChkYXRhc2V0LCBuYW1lLCBpc19wcm9iYW5kKSB7XG5cdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0aWYgKG5hbWUgPT09IHAubmFtZSlcblx0XHRcdHAucHJvYmFuZCA9IGlzX3Byb2JhbmQ7XG5cdFx0ZWxzZVxuXHRcdFx0ZGVsZXRlIHAucHJvYmFuZDtcblx0fSk7XG59XG5cbi8vY29tYmluZSBhcnJheXMgaWdub3JpbmcgZHVwbGljYXRlc1xuZnVuY3Rpb24gY29tYmluZUFycmF5cyhhcnIxLCBhcnIyKSB7XG5cdGZvcihsZXQgaT0wOyBpPGFycjIubGVuZ3RoOyBpKyspXG5cdFx0aWYoJC5pbkFycmF5KCBhcnIyW2ldLCBhcnIxICkgPT0gLTEpIGFycjEucHVzaChhcnIyW2ldKTtcbn1cblxuZnVuY3Rpb24gaW5jbHVkZV9jaGlsZHJlbihjb25uZWN0ZWQsIHAsIGRhdGFzZXQpIHtcblx0aWYoJC5pbkFycmF5KCBwLm5hbWUsIGNvbm5lY3RlZCApID09IC0xKVxuXHRcdHJldHVybjtcblx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBwKSk7XG5cdGxldCBjaGlsZHJlbiA9IGdldEFsbENoaWxkcmVuKGRhdGFzZXQsIHApO1xuXHQkLmVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKCBjaGlsZF9pZHgsIGNoaWxkICkge1xuXHRcdGlmKCQuaW5BcnJheSggY2hpbGQubmFtZSwgY29ubmVjdGVkICkgPT0gLTEpIHtcblx0XHRcdGNvbm5lY3RlZC5wdXNoKGNoaWxkLm5hbWUpO1xuXHRcdFx0Y29tYmluZUFycmF5cyhjb25uZWN0ZWQsIGdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCkpO1xuXHRcdH1cblx0fSk7XG59XG5cbi8vZ2V0IHRoZSBwYXJ0bmVycyBmb3IgYSBnaXZlbiBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIGFub2RlKSB7XG5cdGxldCBwdHJzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgYm5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGFub2RlLm5hbWUgPT09IGJub2RlLm1vdGhlciAmJiAkLmluQXJyYXkoYm5vZGUuZmF0aGVyLCBwdHJzKSA9PSAtMSlcblx0XHRcdHB0cnMucHVzaChibm9kZS5mYXRoZXIpO1xuXHRcdGVsc2UgaWYoYW5vZGUubmFtZSA9PT0gYm5vZGUuZmF0aGVyICYmICQuaW5BcnJheShibm9kZS5tb3RoZXIsIHB0cnMpID09IC0xKVxuXHRcdFx0cHRycy5wdXNoKGJub2RlLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHB0cnM7XG59XG5cbi8vcmV0dXJuIGEgbGlzdCBvZiBpbmRpdmlkdWFscyB0aGF0IGFyZW4ndCBjb25uZWN0ZWQgdG8gdGhlIHRhcmdldFxuZXhwb3J0IGZ1bmN0aW9uIHVuY29ubmVjdGVkKGRhdGFzZXQpe1xuXHRsZXQgdGFyZ2V0ID0gZGF0YXNldFsgZ2V0UHJvYmFuZEluZGV4KGRhdGFzZXQpIF07XG5cdGlmKCF0YXJnZXQpe1xuXHRcdGNvbnNvbGUud2FybihcIk5vIHRhcmdldCBkZWZpbmVkXCIpO1xuXHRcdGlmKGRhdGFzZXQubGVuZ3RoID09IDApIHtcblx0XHRcdHRocm93IFwiZW1wdHkgcGVkaWdyZWUgZGF0YSBzZXRcIjtcblx0XHR9XG5cdFx0dGFyZ2V0ID0gZGF0YXNldFswXTtcblx0fVxuXHRsZXQgY29ubmVjdGVkID0gW3RhcmdldC5uYW1lXTtcblx0bGV0IGNoYW5nZSA9IHRydWU7XG5cdGxldCBpaSA9IDA7XG5cdHdoaWxlKGNoYW5nZSAmJiBpaSA8IDIwMCkge1xuXHRcdGlpKys7XG5cdFx0bGV0IG5jb25uZWN0ID0gY29ubmVjdGVkLmxlbmd0aDtcblx0XHQkLmVhY2goZGF0YXNldCwgZnVuY3Rpb24oIGlkeCwgcCApIHtcblx0XHRcdGlmKCQuaW5BcnJheSggcC5uYW1lLCBjb25uZWN0ZWQgKSAhPSAtMSkge1xuXHRcdFx0XHQvLyBjaGVjayBpZiB0aGlzIHBlcnNvbiBvciBhIHBhcnRuZXIgaGFzIGEgcGFyZW50XG5cdFx0XHRcdGxldCBwdHJzID0gZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIHApO1xuXHRcdFx0XHRsZXQgaGFzX3BhcmVudCA9IChwLm5hbWUgPT09IHRhcmdldC5uYW1lIHx8ICFwLm5vcGFyZW50cyk7XG5cdFx0XHRcdGZvcihsZXQgaT0wOyBpPHB0cnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdGlmKCFnZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbaV0pLm5vcGFyZW50cylcblx0XHRcdFx0XHRcdGhhc19wYXJlbnQgPSB0cnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoaGFzX3BhcmVudCl7XG5cdFx0XHRcdFx0aWYocC5tb3RoZXIgJiYgJC5pbkFycmF5KCBwLm1vdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLm1vdGhlcik7XG5cdFx0XHRcdFx0aWYocC5mYXRoZXIgJiYgJC5pbkFycmF5KCBwLmZhdGhlciwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0XHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLmZhdGhlcik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiggIXAubm9wYXJlbnRzICYmXG5cdFx0XHRcdFx0ICAoKHAubW90aGVyICYmICQuaW5BcnJheSggcC5tb3RoZXIsIGNvbm5lY3RlZCApICE9IC0xKSB8fFxuXHRcdFx0XHRcdCAgIChwLmZhdGhlciAmJiAkLmluQXJyYXkoIHAuZmF0aGVyLCBjb25uZWN0ZWQgKSAhPSAtMSkpKXtcblx0XHRcdFx0Y29ubmVjdGVkLnB1c2gocC5uYW1lKTtcblx0XHRcdH1cblx0XHRcdC8vIGluY2x1ZGUgYW55IGNoaWxkcmVuXG5cdFx0XHRpbmNsdWRlX2NoaWxkcmVuKGNvbm5lY3RlZCwgcCwgZGF0YXNldCk7XG5cdFx0fSk7XG5cdFx0Y2hhbmdlID0gKG5jb25uZWN0ICE9IGNvbm5lY3RlZC5sZW5ndGgpO1xuXHR9XG5cdGxldCBuYW1lcyA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwubmFtZTt9KTtcblx0cmV0dXJuICQubWFwKG5hbWVzLCBmdW5jdGlvbihuYW1lLCBfaSl7cmV0dXJuICQuaW5BcnJheShuYW1lLCBjb25uZWN0ZWQpID09IC0xID8gbmFtZSA6IG51bGw7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9iYW5kSW5kZXgoZGF0YXNldCkge1xuXHRsZXQgcHJvYmFuZDtcblx0JC5lYWNoKGRhdGFzZXQsIGZ1bmN0aW9uKGksIHZhbCkge1xuXHRcdGlmIChpc1Byb2JhbmQodmFsKSkge1xuXHRcdFx0cHJvYmFuZCA9IGk7XG5cdFx0XHRyZXR1cm4gcHJvYmFuZDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gcHJvYmFuZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENoaWxkcmVuKGRhdGFzZXQsIG1vdGhlciwgZmF0aGVyKSB7XG5cdGxldCBjaGlsZHJlbiA9IFtdO1xuXHRsZXQgbmFtZXMgPSBbXTtcblx0aWYobW90aGVyLnNleCA9PT0gJ0YnKVxuXHRcdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRpZihtb3RoZXIubmFtZSA9PT0gcC5tb3RoZXIpXG5cdFx0XHRcdGlmKCFmYXRoZXIgfHwgZmF0aGVyLm5hbWUgPT0gcC5mYXRoZXIpIHtcblx0XHRcdFx0XHRpZigkLmluQXJyYXkocC5uYW1lLCBuYW1lcykgPT09IC0xKXtcblx0XHRcdFx0XHRcdGNoaWxkcmVuLnB1c2gocCk7XG5cdFx0XHRcdFx0XHRuYW1lcy5wdXNoKHAubmFtZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBjaGlsZHJlbjtcbn1cblxuZnVuY3Rpb24gY29udGFpbnNfcGFyZW50KGFyciwgbSwgZikge1xuXHRmb3IobGV0IGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspXG5cdFx0aWYoYXJyW2ldLm1vdGhlciA9PT0gbSAmJiBhcnJbaV0uZmF0aGVyID09PSBmKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gZ2V0IHRoZSBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWwgLSBzZXggaXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyXG4vLyBmb3Igb25seSByZXR1cm5pbmcgYnJvdGhlcnMgb3Igc2lzdGVyc1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbiwgc2V4KSB7XG5cdGlmKHBlcnNvbiA9PT0gdW5kZWZpbmVkIHx8ICFwZXJzb24ubW90aGVyIHx8IHBlcnNvbi5ub3BhcmVudHMpXG5cdFx0cmV0dXJuIFtdO1xuXG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgcC5tb3RoZXIgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09IHNleCkgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgc2libGluZ3MgKyBhZG9wdGVkIHNpYmxpbmdzXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgcGVyc29uLCBzZXgpIHtcblx0cmV0dXJuICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gIHAubmFtZSAhPT0gcGVyc29uLm5hbWUgJiYgISgnbm9wYXJlbnRzJyBpbiBwKSAmJiBwLm1vdGhlciAmJlxuXHRcdFx0ICAgKHAubW90aGVyID09PSBwZXJzb24ubW90aGVyICYmIHAuZmF0aGVyID09PSBwZXJzb24uZmF0aGVyKSAmJlxuXHRcdFx0ICAgKCFzZXggfHwgcC5zZXggPT0gc2V4KSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuLy8gZ2V0IHRoZSBtb25vL2RpLXp5Z290aWMgdHdpbihzKVxuZXhwb3J0IGZ1bmN0aW9uIGdldFR3aW5zKGRhdGFzZXQsIHBlcnNvbikge1xuXHRsZXQgc2licyA9IGdldFNpYmxpbmdzKGRhdGFzZXQsIHBlcnNvbik7XG5cdGxldCB0d2luX3R5cGUgPSAocGVyc29uLm16dHdpbiA/IFwibXp0d2luXCIgOiBcImR6dHdpblwiKTtcblx0cmV0dXJuICQubWFwKHNpYnMsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gcC5uYW1lICE9PSBwZXJzb24ubmFtZSAmJiBwW3R3aW5fdHlwZV0gPT0gcGVyc29uW3R3aW5fdHlwZV0gPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgYWRvcHRlZCBzaWJsaW5ncyBvZiBhIGdpdmVuIGluZGl2aWR1YWxcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZG9wdGVkU2libGluZ3MoZGF0YXNldCwgcGVyc29uKSB7XG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmICdub3BhcmVudHMnIGluIHAgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm1vdGhlciAmJiBwLmZhdGhlciA9PT0gcGVyc29uLmZhdGhlcikgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxDaGlsZHJlbihkYXRhc2V0LCBwZXJzb24sIHNleCkge1xuXHRyZXR1cm4gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe1xuXHRcdHJldHVybiAhKCdub3BhcmVudHMnIGluIHApICYmXG5cdFx0XHQgICAocC5tb3RoZXIgPT09IHBlcnNvbi5uYW1lIHx8IHAuZmF0aGVyID09PSBwZXJzb24ubmFtZSkgJiZcblx0XHRcdCAgICghc2V4IHx8IHAuc2V4ID09PSBzZXgpID8gcCA6IG51bGw7XG5cdH0pO1xufVxuXG4vLyBnZXQgdGhlIGRlcHRoIG9mIHRoZSBnaXZlbiBwZXJzb24gZnJvbSB0aGUgcm9vdFxuZXhwb3J0IGZ1bmN0aW9uIGdldERlcHRoKGRhdGFzZXQsIG5hbWUpIHtcblx0bGV0IGlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGRlcHRoID0gMTtcblxuXHR3aGlsZShpZHggPj0gMCAmJiAoJ21vdGhlcicgaW4gZGF0YXNldFtpZHhdIHx8IGRhdGFzZXRbaWR4XS50b3BfbGV2ZWwpKXtcblx0XHRpZHggPSBnZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLm1vdGhlcik7XG5cdFx0ZGVwdGgrKztcblx0fVxuXHRyZXR1cm4gZGVwdGg7XG59XG5cbi8vIGdpdmVuIGFuIGFycmF5IG9mIHBlb3BsZSBnZXQgYW4gaW5kZXggZm9yIGEgZ2l2ZW4gcGVyc29uXG5leHBvcnQgZnVuY3Rpb24gZ2V0SWR4QnlOYW1lKGFyciwgbmFtZSkge1xuXHRsZXQgaWR4ID0gLTE7XG5cdCQuZWFjaChhcnIsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZiAobmFtZSA9PT0gcC5uYW1lKSB7XG5cdFx0XHRpZHggPSBpO1xuXHRcdFx0cmV0dXJuIGlkeDtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gaWR4O1xufVxuXG4vLyBnZXQgdGhlIG5vZGVzIGF0IGEgZ2l2ZW4gZGVwdGggc29ydGVkIGJ5IHRoZWlyIHggcG9zaXRpb25cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2Rlc0F0RGVwdGgoZm5vZGVzLCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRyZXR1cm4gJC5tYXAoZm5vZGVzLCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuIHAuZGVwdGggPT0gZGVwdGggJiYgIXAuZGF0YS5oaWRkZW4gJiYgJC5pbkFycmF5KHAuZGF0YS5uYW1lLCBleGNsdWRlX25hbWVzKSA9PSAtMSA/IHAgOiBudWxsO1xuXHR9KS5zb3J0KGZ1bmN0aW9uIChhLGIpIHtyZXR1cm4gYS54IC0gYi54O30pO1xufVxuXG4vLyBjb252ZXJ0IHRoZSBwYXJ0bmVyIG5hbWVzIGludG8gY29ycmVzcG9uZGluZyB0cmVlIG5vZGVzXG5leHBvcnQgZnVuY3Rpb24gbGlua05vZGVzKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnMpIHtcblx0bGV0IGxpbmtzID0gW107XG5cdGZvcihsZXQgaT0wOyBpPCBwYXJ0bmVycy5sZW5ndGg7IGkrKylcblx0XHRsaW5rcy5wdXNoKHsnbW90aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLm1vdGhlci5uYW1lKSxcblx0XHRcdFx0XHQnZmF0aGVyJzogZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcnRuZXJzW2ldLmZhdGhlci5uYW1lKX0pO1xuXHRyZXR1cm4gbGlua3M7XG59XG5cbi8vIGdldCBhbmNlc3RvcnMgb2YgYSBub2RlXG5leHBvcnQgZnVuY3Rpb24gYW5jZXN0b3JzKGRhdGFzZXQsIG5vZGUpIHtcblx0bGV0IGFuY2VzdG9ycyA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmRhdGEpIG5vZGUgPSBub2RlLmRhdGE7XG5cdFx0aWYoJ21vdGhlcicgaW4gbm9kZSAmJiAnZmF0aGVyJyBpbiBub2RlICYmICEoJ25vcGFyZW50cycgaW4gbm9kZSkpe1xuXHRcdFx0cmVjdXJzZShnZXROb2RlQnlOYW1lKGRhdGFzZXQsIG5vZGUubW90aGVyKSk7XG5cdFx0XHRyZWN1cnNlKGdldE5vZGVCeU5hbWUoZGF0YXNldCwgbm9kZS5mYXRoZXIpKTtcblx0XHR9XG5cdFx0YW5jZXN0b3JzLnB1c2gobm9kZSk7XG5cdH1cblx0cmVjdXJzZShub2RlKTtcblx0cmV0dXJuIGFuY2VzdG9ycztcbn1cblxuLy8gdGVzdCBpZiB0d28gbm9kZXMgYXJlIGNvbnNhbmd1aW5vdXMgcGFydG5lcnNcbmV4cG9ydCBmdW5jdGlvbiBjb25zYW5ndWl0eShub2RlMSwgbm9kZTIsIG9wdHMpIHtcblx0aWYobm9kZTEuZGVwdGggIT09IG5vZGUyLmRlcHRoKSAvLyBwYXJlbnRzIGF0IGRpZmZlcmVudCBkZXB0aHNcblx0XHRyZXR1cm4gdHJ1ZTtcblx0bGV0IGFuY2VzdG9yczEgPSBhbmNlc3RvcnMob3B0cy5kYXRhc2V0LCBub2RlMSk7XG5cdGxldCBhbmNlc3RvcnMyID0gYW5jZXN0b3JzKG9wdHMuZGF0YXNldCwgbm9kZTIpO1xuXHRsZXQgbmFtZXMxID0gJC5tYXAoYW5jZXN0b3JzMSwgZnVuY3Rpb24oYW5jZXN0b3IsIF9pKXtyZXR1cm4gYW5jZXN0b3IubmFtZTt9KTtcblx0bGV0IG5hbWVzMiA9ICQubWFwKGFuY2VzdG9yczIsIGZ1bmN0aW9uKGFuY2VzdG9yLCBfaSl7cmV0dXJuIGFuY2VzdG9yLm5hbWU7fSk7XG5cdGxldCBjb25zYW5ndWl0eSA9IGZhbHNlO1xuXHQkLmVhY2gobmFtZXMxLCBmdW5jdGlvbiggaW5kZXgsIG5hbWUgKSB7XG5cdFx0aWYoJC5pbkFycmF5KG5hbWUsIG5hbWVzMikgIT09IC0xKXtcblx0XHRcdGNvbnNhbmd1aXR5ID0gdHJ1ZTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gY29uc2FuZ3VpdHk7XG59XG5cbi8vIHJldHVybiBhIGZsYXR0ZW5lZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJlZVxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4ocm9vdCkge1xuXHRsZXQgZmxhdCA9IFtdO1xuXHRmdW5jdGlvbiByZWN1cnNlKG5vZGUpIHtcblx0XHRpZihub2RlLmNoaWxkcmVuKVxuXHRcdFx0bm9kZS5jaGlsZHJlbi5mb3JFYWNoKHJlY3Vyc2UpO1xuXHRcdGZsYXQucHVzaChub2RlKTtcblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZXR1cm4gZmxhdDtcbn1cblxuLy8gQWRqdXN0IEQzIGxheW91dCBwb3NpdGlvbmluZy5cbi8vIFBvc2l0aW9uIGhpZGRlbiBwYXJlbnQgbm9kZSBjZW50cmluZyB0aGVtIGJldHdlZW4gZmF0aGVyIGFuZCBtb3RoZXIgbm9kZXMuIFJlbW92ZSBraW5rc1xuLy8gZnJvbSBsaW5rcyAtIGUuZy4gd2hlcmUgdGhlcmUgaXMgYSBzaW5nbGUgY2hpbGQgcGx1cyBhIGhpZGRlbiBjaGlsZFxuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdF9jb29yZHMob3B0cywgcm9vdCwgZmxhdHRlbk5vZGVzKSB7XG5cdGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuXHRcdGlmIChub2RlLmNoaWxkcmVuKSB7XG5cdFx0XHRub2RlLmNoaWxkcmVuLmZvckVhY2gocmVjdXJzZSk7XG5cblx0XHRcdGlmKG5vZGUuZGF0YS5mYXRoZXIgIT09IHVuZGVmaW5lZCkgeyBcdC8vIGhpZGRlbiBub2Rlc1xuXHRcdFx0XHRsZXQgZmF0aGVyID0gZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIG5vZGUuZGF0YS5mYXRoZXIubmFtZSk7XG5cdFx0XHRcdGxldCBtb3RoZXIgPSBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2Rlcywgbm9kZS5kYXRhLm1vdGhlci5uYW1lKTtcblx0XHRcdFx0bGV0IHhtaWQgPSAoZmF0aGVyLnggKyBtb3RoZXIueCkgLzI7XG5cdFx0XHRcdGlmKCFvdmVybGFwKG9wdHMsIHJvb3QuZGVzY2VuZGFudHMoKSwgeG1pZCwgbm9kZS5kZXB0aCwgW25vZGUuZGF0YS5uYW1lXSkpIHtcblx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzXG5cdFx0XHRcdFx0bGV0IGRpZmYgPSBub2RlLnggLSB4bWlkO1xuXHRcdFx0XHRcdGlmKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDIgJiYgKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gfHwgbm9kZS5jaGlsZHJlblsxXS5kYXRhLmhpZGRlbikpIHtcblx0XHRcdFx0XHRcdGlmKCEobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiAmJiBub2RlLmNoaWxkcmVuWzFdLmRhdGEuaGlkZGVuKSkge1xuXHRcdFx0XHRcdFx0XHRsZXQgY2hpbGQxID0gKG5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4gPyBub2RlLmNoaWxkcmVuWzFdIDogbm9kZS5jaGlsZHJlblswXSk7XG5cdFx0XHRcdFx0XHRcdGxldCBjaGlsZDIgPSAobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiA/IG5vZGUuY2hpbGRyZW5bMF0gOiBub2RlLmNoaWxkcmVuWzFdKTtcblx0XHRcdFx0XHRcdFx0aWYoICgoY2hpbGQxLnggPCBjaGlsZDIueCAmJiB4bWlkIDwgY2hpbGQyLngpIHx8IChjaGlsZDEueCA+IGNoaWxkMi54ICYmIHhtaWQgPiBjaGlsZDIueCkpICYmXG5cdFx0XHRcdFx0XHRcdFx0IW92ZXJsYXAob3B0cywgcm9vdC5kZXNjZW5kYW50cygpLCB4bWlkLCBjaGlsZDEuZGVwdGgsIFtjaGlsZDEuZGF0YS5uYW1lXSkpe1xuXHRcdFx0XHRcdFx0XHRcdGNoaWxkMS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSBpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxICYmICFub2RlLmNoaWxkcmVuWzBdLmRhdGEuaGlkZGVuKSB7XG5cdFx0XHRcdFx0XHRpZighb3ZlcmxhcChvcHRzLCByb290LmRlc2NlbmRhbnRzKCksIHhtaWQsIG5vZGUuY2hpbGRyZW5bMF0uZGVwdGgsIFtub2RlLmNoaWxkcmVuWzBdLmRhdGEubmFtZV0pKVxuXHRcdFx0XHRcdFx0XHRub2RlLmNoaWxkcmVuWzBdLnggPSB4bWlkO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZihkaWZmICE9PSAwICYmICFub2Rlc092ZXJsYXAob3B0cywgbm9kZSwgZGlmZiwgcm9vdCkpe1xuXHRcdFx0XHRcdFx0XHRpZihub2RlLmNoaWxkcmVuLmxlbmd0aCA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0bm9kZS5jaGlsZHJlblswXS54ID0geG1pZDtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgZGVzY2VuZGFudHMgPSBub2RlLmRlc2NlbmRhbnRzKCk7XG5cdFx0XHRcdFx0XHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdBREpVU1RJTkcgJytub2RlLmRhdGEubmFtZSsnIE5PLiBERVNDRU5EQU5UUyAnK2Rlc2NlbmRhbnRzLmxlbmd0aCsnIGRpZmY9JytkaWZmKTtcblx0XHRcdFx0XHRcdFx0XHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYobm9kZS5kYXRhLm5hbWUgIT09IGRlc2NlbmRhbnRzW2ldLmRhdGEubmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVzY2VuZGFudHNbaV0ueCAtPSBkaWZmO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIGlmKChub2RlLnggPCBmYXRoZXIueCAmJiBub2RlLnggPCBtb3RoZXIueCkgfHwgKG5vZGUueCA+IGZhdGhlci54ICYmIG5vZGUueCA+IG1vdGhlci54KSl7XG5cdFx0XHRcdFx0XHRub2RlLnggPSB4bWlkOyAgIC8vIGNlbnRyYWxpc2UgcGFyZW50IG5vZGVzIGlmIGl0IGRvZXNuJ3QgbGllIGJldHdlZW4gbW90aGVyIGFuZCBmYXRoZXJcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZWN1cnNlKHJvb3QpO1xuXHRyZWN1cnNlKHJvb3QpO1xufVxuXG4vLyB0ZXN0IGlmIG1vdmluZyBzaWJsaW5ncyBieSBkaWZmIG92ZXJsYXBzIHdpdGggb3RoZXIgbm9kZXNcbmZ1bmN0aW9uIG5vZGVzT3ZlcmxhcChvcHRzLCBub2RlLCBkaWZmLCByb290KSB7XG5cdGxldCBkZXNjZW5kYW50cyA9IG5vZGUuZGVzY2VuZGFudHMoKTtcblx0bGV0IGRlc2NlbmRhbnRzTmFtZXMgPSAkLm1hcChkZXNjZW5kYW50cywgZnVuY3Rpb24oZGVzY2VuZGFudCwgX2kpe3JldHVybiBkZXNjZW5kYW50LmRhdGEubmFtZTt9KTtcblx0bGV0IG5vZGVzID0gcm9vdC5kZXNjZW5kYW50cygpO1xuXHRmb3IobGV0IGk9MDsgaTxkZXNjZW5kYW50cy5sZW5ndGg7IGkrKyl7XG5cdFx0bGV0IGRlc2NlbmRhbnQgPSBkZXNjZW5kYW50c1tpXTtcblx0XHRpZihub2RlLmRhdGEubmFtZSAhPT0gZGVzY2VuZGFudC5kYXRhLm5hbWUpe1xuXHRcdFx0bGV0IHhuZXcgPSBkZXNjZW5kYW50LnggLSBkaWZmO1xuXHRcdFx0aWYob3ZlcmxhcChvcHRzLCBub2RlcywgeG5ldywgZGVzY2VuZGFudC5kZXB0aCwgZGVzY2VuZGFudHNOYW1lcykpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8vIHRlc3QgaWYgeCBwb3NpdGlvbiBvdmVybGFwcyBhIG5vZGUgYXQgdGhlIHNhbWUgZGVwdGhcbmV4cG9ydCBmdW5jdGlvbiBvdmVybGFwKG9wdHMsIG5vZGVzLCB4bmV3LCBkZXB0aCwgZXhjbHVkZV9uYW1lcykge1xuXHRmb3IobGV0IG49MDsgbjxub2Rlcy5sZW5ndGg7IG4rKykge1xuXHRcdGlmKGRlcHRoID09IG5vZGVzW25dLmRlcHRoICYmICQuaW5BcnJheShub2Rlc1tuXS5kYXRhLm5hbWUsIGV4Y2x1ZGVfbmFtZXMpID09IC0xKXtcblx0XHRcdGlmKE1hdGguYWJzKHhuZXcgLSBub2Rlc1tuXS54KSA8IChvcHRzLnN5bWJvbF9zaXplKjEuMTUpKVxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vLyBnaXZlbiBhIHBlcnNvbnMgbmFtZSByZXR1cm4gdGhlIGNvcnJlc3BvbmRpbmcgZDMgdHJlZSBub2RlXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUJ5TmFtZShub2RlcywgbmFtZSkge1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYobm9kZXNbaV0uZGF0YSAmJiBuYW1lID09PSBub2Rlc1tpXS5kYXRhLm5hbWUpXG5cdFx0XHRyZXR1cm4gbm9kZXNbaV07XG5cdFx0ZWxzZSBpZiAobmFtZSA9PT0gbm9kZXNbaV0ubmFtZSlcblx0XHRcdHJldHVybiBub2Rlc1tpXTtcblx0fVxufVxuXG4vLyBnaXZlbiB0aGUgbmFtZSBvZiBhIHVybCBwYXJhbSBnZXQgdGhlIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gdXJsUGFyYW0obmFtZSl7XG5cdGxldCByZXN1bHRzID0gbmV3IFJlZ0V4cCgnWz8mXScgKyBuYW1lICsgJz0oW14mI10qKScpLmV4ZWMod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuXHRpZiAocmVzdWx0cz09PW51bGwpXG5cdCAgIHJldHVybiBudWxsO1xuXHRlbHNlXG5cdCAgIHJldHVybiByZXN1bHRzWzFdIHx8IDA7XG59XG5cbi8vIGdldCBncmFuZHBhcmVudHMgaW5kZXhcbmV4cG9ydCBmdW5jdGlvbiBnZXRfZ3JhbmRwYXJlbnRzX2lkeChkYXRhc2V0LCBtaWR4LCBmaWR4KSB7XG5cdGxldCBnbWlkeCA9IG1pZHg7XG5cdGxldCBnZmlkeCA9IGZpZHg7XG5cdHdoaWxlKCAgJ21vdGhlcicgaW4gZGF0YXNldFtnbWlkeF0gJiYgJ21vdGhlcicgaW4gZGF0YXNldFtnZmlkeF0gJiZcblx0XHQgICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnbWlkeF0pICYmICEoJ25vcGFyZW50cycgaW4gZGF0YXNldFtnZmlkeF0pKXtcblx0XHRnbWlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2dtaWR4XS5tb3RoZXIpO1xuXHRcdGdmaWR4ID0gZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbZ2ZpZHhdLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIHsnbWlkeCc6IGdtaWR4LCAnZmlkeCc6IGdmaWR4fTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBwcm9iYW5kIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgZnJvbSB0aGUgcHJvYmFuZC5cbi8vICdrZXknIGNhbiBiZSBhIGxpc3Qgb2Yga2V5cyBvciBhIHNpbmdsZSBrZXkuXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hdHRyKG9wdHMsIGtleXMsIHZhbHVlKXtcblx0bGV0IHByb2JhbmQgPSBvcHRzLmRhdGFzZXRbIGdldFByb2JhbmRJbmRleChvcHRzLmRhdGFzZXQpIF07XG5cdG5vZGVfYXR0cihvcHRzLCBwcm9iYW5kLm5hbWUsIGtleXMsIHZhbHVlKTtcbn1cblxuLy8gU2V0IG9yIHJlbW92ZSBub2RlIGF0dHJpYnV0ZXMuXG4vLyBJZiBhIHZhbHVlIGlzIG5vdCBwcm92aWRlZCB0aGUgYXR0cmlidXRlIGlzIHJlbW92ZWQuXG4vLyAna2V5JyBjYW4gYmUgYSBsaXN0IG9mIGtleXMgb3IgYSBzaW5nbGUga2V5LlxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVfYXR0cihvcHRzLCBuYW1lLCBrZXlzLCB2YWx1ZSl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUobmV3ZGF0YXNldCwgbmFtZSk7XG5cdGlmKCFub2RlKXtcblx0XHRjb25zb2xlLndhcm4oXCJObyBwZXJzb24gZGVmaW5lZFwiKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZighJC5pc0FycmF5KGtleXMpKSB7XG5cdFx0a2V5cyA9IFtrZXlzXTtcblx0fVxuXG5cdGlmKHZhbHVlKSB7XG5cdFx0Zm9yKGxldCBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGsgPSBrZXlzW2ldO1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnVkFMVUUgUFJPVklERUQnLCBrLCB2YWx1ZSwgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlICYmIGtleXMubGVuZ3RoID09PSAxKSB7XG5cdFx0XHRcdGlmKG5vZGVba10gPT09IHZhbHVlKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0ICAgaWYoSlNPTi5zdHJpbmdpZnkobm9kZVtrXSkgPT09IEpTT04uc3RyaW5naWZ5KHZhbHVlKSlcblx0XHRcdFx0XHQgICByZXR1cm47XG5cdFx0XHRcdH0gY2F0Y2goZSl7XG5cdFx0XHRcdFx0Ly8gY29udGludWUgcmVnYXJkbGVzcyBvZiBlcnJvclxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRub2RlW2tdID0gdmFsdWU7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBmb3VuZCA9IGZhbHNlO1xuXHRcdGZvcihsZXQgaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCBrID0ga2V5c1tpXTtcblx0XHRcdC8vY29uc29sZS5sb2coJ05PIFZBTFVFIFBST1ZJREVEJywgaywgKGsgaW4gbm9kZSkpO1xuXHRcdFx0aWYoayBpbiBub2RlKSB7XG5cdFx0XHRcdGRlbGV0ZSBub2RlW2tdO1xuXHRcdFx0XHRmb3VuZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmKCFmb3VuZClcblx0XHRcdHJldHVybjtcblx0fVxuXHRzeW5jVHdpbnMobmV3ZGF0YXNldCwgbm9kZSk7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbi8vIGFkZCBhIGNoaWxkIHRvIHRoZSBwcm9iYW5kOyBnaXZlYiBzZXgsIGFnZSwgeW9iIGFuZCBicmVhc3RmZWVkaW5nIG1vbnRocyAob3B0aW9uYWwpXG5leHBvcnQgZnVuY3Rpb24gcHJvYmFuZF9hZGRfY2hpbGQob3B0cywgc2V4LCBhZ2UsIHlvYiwgYnJlYXN0ZmVlZGluZyl7XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgcHJvYmFuZCA9IG5ld2RhdGFzZXRbIGdldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KSBdO1xuXHRpZighcHJvYmFuZCl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gcHJvYmFuZCBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRsZXQgbmV3Y2hpbGQgPSBhZGRjaGlsZChuZXdkYXRhc2V0LCBwcm9iYW5kLCBzZXgsIDEpWzBdO1xuXHRuZXdjaGlsZC5hZ2UgPSBhZ2U7XG5cdG5ld2NoaWxkLnlvYiA9IHlvYjtcblx0aWYoYnJlYXN0ZmVlZGluZyAhPT0gdW5kZWZpbmVkKVxuXHRcdG5ld2NoaWxkLmJyZWFzdGZlZWRpbmcgPSBicmVhc3RmZWVkaW5nO1xuXHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRyZWJ1aWxkKG9wdHMpO1xuXHRyZXR1cm4gbmV3Y2hpbGQubmFtZTtcbn1cblxuLy8gZGVsZXRlIG5vZGUgdXNpbmcgdGhlIG5hbWVcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVfbm9kZV9ieV9uYW1lKG9wdHMsIG5hbWUpe1xuXHRmdW5jdGlvbiBvbkRvbmUob3B0cywgZGF0YXNldCkge1xuXHRcdC8vIGFzc2lnbiBuZXcgZGF0YXNldCBhbmQgcmVidWlsZCBwZWRpZ3JlZVxuXHRcdG9wdHMuZGF0YXNldCA9IGRhdGFzZXQ7XG5cdFx0cmVidWlsZChvcHRzKTtcblx0fVxuXHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZS5jdXJyZW50KG9wdHMpKTtcblx0bGV0IG5vZGUgPSBnZXROb2RlQnlOYW1lKHBlZGNhY2hlLmN1cnJlbnQob3B0cyksIG5hbWUpO1xuXHRpZighbm9kZSl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gbm9kZSBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXHRkZWxldGVfbm9kZV9kYXRhc2V0KG5ld2RhdGFzZXQsIG5vZGUsIG9wdHMsIG9uRG9uZSk7XG59XG5cbi8vIGNoZWNrIGJ5IG5hbWUgaWYgdGhlIGluZGl2aWR1YWwgZXhpc3RzXG5leHBvcnQgZnVuY3Rpb24gZXhpc3RzKG9wdHMsIG5hbWUpe1xuXHRyZXR1cm4gZ2V0Tm9kZUJ5TmFtZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBuYW1lKSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBwcmludCBvcHRpb25zIGFuZCBkYXRhc2V0XG5leHBvcnQgZnVuY3Rpb24gcHJpbnRfb3B0cyhvcHRzKXtcblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLnJlbW92ZSgpO1xuXHQkKFwiYm9keVwiKS5hcHBlbmQoXCI8ZGl2IGlkPSdwZWRpZ3JlZV9kYXRhJz48L2Rpdj5cIiApO1xuXHRsZXQga2V5O1xuXHRmb3IobGV0IGk9MDsgaTxvcHRzLmRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGVyc29uID0gXCI8ZGl2IGNsYXNzPSdyb3cnPjxzdHJvbmcgY2xhc3M9J2NvbC1tZC0xIHRleHQtcmlnaHQnPlwiK29wdHMuZGF0YXNldFtpXS5uYW1lK1wiPC9zdHJvbmc+PGRpdiBjbGFzcz0nY29sLW1kLTExJz5cIjtcblx0XHRmb3Ioa2V5IGluIG9wdHMuZGF0YXNldFtpXSkge1xuXHRcdFx0aWYoa2V5ID09PSAnbmFtZScpIGNvbnRpbnVlO1xuXHRcdFx0aWYoa2V5ID09PSAncGFyZW50Jylcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHRlbHNlIGlmIChrZXkgPT09ICdjaGlsZHJlbicpIHtcblx0XHRcdFx0aWYgKG9wdHMuZGF0YXNldFtpXVtrZXldWzBdICE9PSB1bmRlZmluZWQpXG5cdFx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XVswXS5uYW1lK1wiOyA8L3NwYW4+XCI7XG5cdFx0XHR9IGVsc2Vcblx0XHRcdFx0cGVyc29uICs9IFwiPHNwYW4+XCIra2V5ICsgXCI6XCIgKyBvcHRzLmRhdGFzZXRbaV1ba2V5XStcIjsgPC9zcGFuPlwiO1xuXHRcdH1cblx0XHQkKFwiI3BlZGlncmVlX2RhdGFcIikuYXBwZW5kKHBlcnNvbiArIFwiPC9kaXY+PC9kaXY+XCIpO1xuXG5cdH1cblx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLmFwcGVuZChcIjxiciAvPjxiciAvPlwiKTtcblx0Zm9yKGtleSBpbiBvcHRzKSB7XG5cdFx0aWYoa2V5ID09PSAnZGF0YXNldCcpIGNvbnRpbnVlO1xuXHRcdCQoXCIjcGVkaWdyZWVfZGF0YVwiKS5hcHBlbmQoXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHNba2V5XStcIjsgPC9zcGFuPlwiKTtcblx0fVxufVxuIiwiLy8gdW5kbywgcmVkbywgcmVzZXQgYnV0dG9uc1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge3JlYnVpbGQsIGJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Y29weV9kYXRhc2V0LCBnZXRQcm9iYW5kSW5kZXh9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdGlvbnMpIHtcblx0bGV0IG9wdHMgPSAkLmV4dGVuZCh7XG4gICAgICAgIC8vIGRlZmF1bHRzXG5cdFx0YnRuX3RhcmdldDogJ3BlZGlncmVlX2hpc3RvcnknXG4gICAgfSwgb3B0aW9ucyApO1xuXG5cdGxldCBidG5zID0gW3tcImZhXCI6IFwiZmEtdW5kb1wiLCBcInRpdGxlXCI6IFwidW5kb1wifSxcblx0XHRcdFx0e1wiZmFcIjogXCJmYS1yZXBlYXRcIiwgXCJ0aXRsZVwiOiBcInJlZG9cIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtcmVmcmVzaFwiLCBcInRpdGxlXCI6IFwicmVzZXRcIn0sXG5cdFx0XHRcdHtcImZhXCI6IFwiZmEtYXJyb3dzLWFsdFwiLCBcInRpdGxlXCI6IFwiZnVsbHNjcmVlblwifV07XG5cdGxldCBsaXMgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxidG5zLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGlzICs9ICc8bGlcIj4nO1xuXHRcdGxpcyArPSAnJm5ic3A7PGkgY2xhc3M9XCJmYSBmYS1sZyAnICsgYnRuc1tpXS5mYSArICdcIiAnICtcblx0XHQgICAgICAgICAgICAgICAoYnRuc1tpXS5mYSA9PSBcImZhLWFycm93cy1hbHRcIiA/ICdpZD1cImZ1bGxzY3JlZW5cIiAnIDogJycpICtcblx0XHQgICAgICAgICAgICAgICAnIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHRpdGxlPVwiJysgYnRuc1tpXS50aXRsZSArJ1wiPjwvaT4nO1xuXHRcdGxpcyArPSAnPC9saT4nO1xuXHR9XG5cdCQoIFwiI1wiK29wdHMuYnRuX3RhcmdldCApLmFwcGVuZChsaXMpO1xuXHRjbGljayhvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzX2Z1bGxzY3JlZW4oKXtcblx0cmV0dXJuIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fCBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCk7XG59XG5cbmZ1bmN0aW9uIGNsaWNrKG9wdHMpIHtcblx0Ly8gZnVsbHNjcmVlblxuICAgICQoZG9jdW1lbnQpLm9uKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlIG1vemZ1bGxzY3JlZW5jaGFuZ2UgZnVsbHNjcmVlbmNoYW5nZSBNU0Z1bGxzY3JlZW5DaGFuZ2UnLCBmdW5jdGlvbihfZSkgIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0aWYgKGxvY2FsX2RhdGFzZXQgIT09IHVuZGVmaW5lZCAmJiBsb2NhbF9kYXRhc2V0ICE9PSBudWxsKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBsb2NhbF9kYXRhc2V0O1xuXHRcdH1cblx0XHRyZWJ1aWxkKG9wdHMpO1xuICAgIH0pO1xuXG5cdCQoJyNmdWxsc2NyZWVuJykub24oJ2NsaWNrJywgZnVuY3Rpb24oX2UpIHtcblx0XHRpZiAoIWRvY3VtZW50Lm1vekZ1bGxTY3JlZW4gJiYgIWRvY3VtZW50LndlYmtpdEZ1bGxTY3JlZW4pIHtcblx0XHRcdGxldCB0YXJnZXQgPSAkKFwiI1wiK29wdHMudGFyZ2V0RGl2KVswXTtcblx0XHRcdGlmKHRhcmdldC5tb3pSZXF1ZXN0RnVsbFNjcmVlbilcblx0XHRcdFx0dGFyZ2V0Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRhcmdldC53ZWJraXRSZXF1ZXN0RnVsbFNjcmVlbihFbGVtZW50LkFMTE9XX0tFWUJPQVJEX0lOUFVUKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbilcblx0XHRcdFx0ZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRkb2N1bWVudC53ZWJraXRDYW5jZWxGdWxsU2NyZWVuKCk7XG5cdFx0fVxuXHR9KTtcblxuXHQvLyB1bmRvL3JlZG8vcmVzZXRcblx0JCggXCIjXCIrb3B0cy5idG5fdGFyZ2V0ICkub24oIFwiY2xpY2tcIiwgZnVuY3Rpb24oZSkge1xuXHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0aWYoJChlLnRhcmdldCkuaGFzQ2xhc3MoXCJkaXNhYmxlZFwiKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdGlmKCQoZS50YXJnZXQpLmhhc0NsYXNzKCdmYS11bmRvJykpIHtcblx0XHRcdG9wdHMuZGF0YXNldCA9IHBlZGNhY2hlLnByZXZpb3VzKG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlcGVhdCcpKSB7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBwZWRjYWNoZS5uZXh0KG9wdHMpO1xuXHRcdFx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0XHRcdGJ1aWxkKG9wdHMpO1xuXHRcdH0gZWxzZSBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXJlZnJlc2gnKSkge1xuXHRcdFx0JCgnPGRpdiBpZD1cIm1zZ0RpYWxvZ1wiPlJlc2V0dGluZyB0aGUgcGVkaWdyZWUgbWF5IHJlc3VsdCBpbiBsb3NzIG9mIHNvbWUgZGF0YS48L2Rpdj4nKS5kaWFsb2coe1xuXHRcdFx0XHR0aXRsZTogJ0NvbmZpcm0gUmVzZXQnLFxuXHRcdFx0XHRyZXNpemFibGU6IGZhbHNlLFxuXHRcdFx0XHRoZWlnaHQ6IFwiYXV0b1wiLFxuXHRcdFx0XHR3aWR0aDogNDAwLFxuXHRcdFx0XHRtb2RhbDogdHJ1ZSxcblx0XHRcdFx0YnV0dG9uczoge1xuXHRcdFx0XHRcdENvbnRpbnVlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHJlc2V0KG9wdHMsIG9wdHMua2VlcF9wcm9iYW5kX29uX3Jlc2V0KTtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCBcImNsb3NlXCIgKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdENhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZyggXCJjbG9zZVwiICk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdCAgICB9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pO1xuXHR9KTtcbn1cblxuLy8gcmVzZXQgcGVkaWdyZWUgYW5kIGNsZWFyIHRoZSBoaXN0b3J5XG5leHBvcnQgZnVuY3Rpb24gcmVzZXQob3B0cywga2VlcF9wcm9iYW5kKSB7XG5cdGxldCBwcm9iYW5kO1xuXHRpZihrZWVwX3Byb2JhbmQpIHtcblx0XHRsZXQgbG9jYWxfZGF0YXNldCA9IHBlZGNhY2hlLmN1cnJlbnQob3B0cyk7XG5cdFx0bGV0IG5ld2RhdGFzZXQgPSAgY29weV9kYXRhc2V0KGxvY2FsX2RhdGFzZXQpO1xuXHRcdHByb2JhbmQgPSBuZXdkYXRhc2V0W2dldFByb2JhbmRJbmRleChuZXdkYXRhc2V0KV07XG5cdFx0Ly9sZXQgY2hpbGRyZW4gPSBwZWRpZ3JlZV91dGlsLmdldENoaWxkcmVuKG5ld2RhdGFzZXQsIHByb2JhbmQpO1xuXHRcdHByb2JhbmQubmFtZSA9IFwiY2gxXCI7XG5cdFx0cHJvYmFuZC5tb3RoZXIgPSBcImYyMVwiO1xuXHRcdHByb2JhbmQuZmF0aGVyID0gXCJtMjFcIjtcblx0XHQvLyBjbGVhciBwZWRpZ3JlZSBkYXRhIGJ1dCBrZWVwIHByb2JhbmQgZGF0YSBhbmQgcmlzayBmYWN0b3JzXG5cdFx0cGVkY2FjaGUuY2xlYXJfcGVkaWdyZWVfZGF0YShvcHRzKVxuXHR9IGVsc2Uge1xuXHRcdHByb2JhbmQgPSB7XG5cdFx0XHRcIm5hbWVcIjpcImNoMVwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInByb2JhbmRcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1lXCJcblx0XHR9O1xuXHRcdHBlZGNhY2hlLmNsZWFyKG9wdHMpOyAvLyBjbGVhciBhbGwgc3RvcmFnZSBkYXRhXG5cdH1cblxuXHRkZWxldGUgb3B0cy5kYXRhc2V0O1xuXG5cdGxldCBzZWxlY3RlZCA9ICQoXCJpbnB1dFtuYW1lPSdkZWZhdWx0X2ZhbSddOmNoZWNrZWRcIik7XG5cdGlmKHNlbGVjdGVkLmxlbmd0aCA+IDAgJiYgc2VsZWN0ZWQudmFsKCkgPT0gJ2V4dGVuZGVkMicpIHsgICAgLy8gc2Vjb25kYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIndaQVwiLFwic2V4XCI6XCJNXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGdyYW5kZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUFrXCIsXCJzZXhcIjpcIkZcIixcInRvcF9sZXZlbFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgZ3JhbmRtb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ6d0JcIixcInNleFwiOlwiTVwiLFwidG9wX2xldmVsXCI6dHJ1ZSxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJtYXRlcm5hbCBncmFuZGZhdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImRPSFwiLFwic2V4XCI6XCJGXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGdyYW5kbW90aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiTUtnXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiTUFrXCIsXCJmYXRoZXJcIjpcIndaQVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhdGVybmFsIGF1bnRcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4c21cIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgdW5jbGVcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJtMjFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiZE9IXCIsXCJmYXRoZXJcIjpcInp3QlwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcImFPSFwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJzaXN0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJWaGFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiYnJvdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIlNwalwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcIm5vcGFyZW50c1wiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGFydG5lclwifSxcblx0XHRcdHByb2JhbmQsXG5cdFx0XHR7XCJuYW1lXCI6XCJ6aGtcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJjaDFcIixcImZhdGhlclwiOlwiU3BqXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZGF1Z2h0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJLbnhcIixcImRpc3BsYXlfbmFtZVwiOlwic29uXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwidXVjXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGF1bnRcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ4SXdcIixcImRpc3BsYXlfbmFtZVwiOlwibWF0ZXJuYWwgdW5jbGVcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIn1dO1xuXHR9IGVsc2UgaWYoc2VsZWN0ZWQubGVuZ3RoID4gMCAmJiBzZWxlY3RlZC52YWwoKSA9PSAnZXh0ZW5kZWQxJykgeyAgICAvLyBwcmltYXJ5IHJlbGF0aXZlc1xuXHRcdG9wdHMuZGF0YXNldCA9IFtcblx0XHRcdHtcIm5hbWVcIjpcIm0yMVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpudWxsLFwiZmF0aGVyXCI6bnVsbCxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJmYXRoZXJcIixcIm5vcGFyZW50c1wiOnRydWV9LFxuXHRcdFx0e1wibmFtZVwiOlwiZjIxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOm51bGwsXCJmYXRoZXJcIjpudWxsLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1vdGhlclwiLFwibm9wYXJlbnRzXCI6dHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6XCJhT0hcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwic2lzdGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiVmhhXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImJyb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJTcGpcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJub3BhcmVudHNcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInBhcnRuZXJcIn0sXG5cdFx0XHRwcm9iYW5kLFxuXHRcdFx0e1wibmFtZVwiOlwiemhrXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImRhdWdodGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiS254XCIsXCJkaXNwbGF5X25hbWVcIjpcInNvblwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImNoMVwiLFwiZmF0aGVyXCI6XCJTcGpcIixcInN0YXR1c1wiOlwiMFwifV07XG5cdH0gZWxzZSB7XG5cdFx0b3B0cy5kYXRhc2V0ID0gW1xuXHRcdFx0e1wibmFtZVwiOiBcIm0yMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcImZhdGhlclwiLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6IFwiZjIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibW90aGVyXCIsIFwic2V4XCI6IFwiRlwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdHByb2JhbmRdO1xuXHR9XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVCdXR0b25zKG9wdHMpIHtcblx0bGV0IGN1cnJlbnQgPSBwZWRjYWNoZS5nZXRfY291bnQob3B0cyk7XG5cdGxldCBuc3RvcmUgPSBwZWRjYWNoZS5uc3RvcmUob3B0cyk7XG5cdGxldCBpZCA9IFwiI1wiK29wdHMuYnRuX3RhcmdldDtcblx0aWYobnN0b3JlIDw9IGN1cnJlbnQpXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuXHRlbHNlXG5cdFx0JChpZCtcIiAuZmEtcmVwZWF0XCIpLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuXG5cdGlmKGN1cnJlbnQgPiAxKVxuXHRcdCQoaWQrXCIgLmZhLXVuZG9cIikucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdGVsc2Vcblx0XHQkKGlkK1wiIC5mYS11bmRvXCIpLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xufVxuIiwiaW1wb3J0ICogYXMgcGVkaWdyZWVfdXRpbCBmcm9tICcuL3BlZGlncmVlX3V0aWxzLmpzJztcbmltcG9ydCB7Z2VuZXRpY190ZXN0LCBwYXRob2xvZ3lfdGVzdHMsIGNhbmNlcnN9IGZyb20gJy4vaW8uanMnO1xuXG4vLyBzYXZlIHJpc2sgZmFjdG9yIHRvIHN0b3JhZ2VcbmxldCBSSVNLX0ZBQ1RPUl9TVE9SRSA9IG5ldyBPYmplY3QoKTtcbmV4cG9ydCBmdW5jdGlvbiBzaG93X3Jpc2tfZmFjdG9yX3N0b3JlKCkge1xuXHRjb25zb2xlLmxvZyhcIlJJU0tfRkFDVE9SX1NUT1JFOjpcIik7XG5cdCQuZWFjaChSSVNLX0ZBQ1RPUl9TVE9SRSwgZnVuY3Rpb24obmFtZSwgdmFsKXtcblx0XHRjb25zb2xlLmxvZyhuYW1lICsgXCIgOiBcIiArIHZhbCk7XG5cdH0pO1xufVxuXG4vLyByZXR1cm4gYSBub24tYW5vbmltaXNlZCBwZWRpZ3JlZSBmb3JtYXRcbmV4cG9ydCBmdW5jdGlvbiBnZXRfbm9uX2Fub25fcGVkaWdyZWUoZGF0YXNldCwgbWV0YSkge1xuXHRyZXR1cm4gZ2V0X3BlZGlncmVlKGRhdGFzZXQsIHVuZGVmaW5lZCwgbWV0YSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIEdldCBDYW5SaXNrIGZvcm1hdGVkIHBlZGlncmVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3BlZGlncmVlKGRhdGFzZXQsIGZhbWlkLCBtZXRhLCBpc2Fub24pIHtcblx0bGV0IG1zZyA9IFwiIyNDYW5SaXNrIDEuMFwiO1xuXHRpZighZmFtaWQpIHtcblx0XHRmYW1pZCA9IFwiWFhYWFwiO1xuXHR9XG5cdGlmKG1ldGEpIHtcblx0XHRtc2cgKz0gbWV0YTtcblx0fVxuXHRpZih0eXBlb2YgaXNhbm9uID09PSAndW5kZWZpbmVkJykge1xuXHRcdGlzYW5vbiA9IHRydWU7XG5cdH1cblx0Ly8gYXJyYXkgb2YgaW5kaXZpZHVhbHMgZXhjbHVkZWQgZnJvbSB0aGUgY2FsY3VsYXRpb25cblx0bGV0IGV4Y2wgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7cmV0dXJuICdleGNsdWRlJyBpbiBwICYmIHAuZXhjbHVkZSA/IHAubmFtZSA6IG51bGw7fSk7XG5cblx0Ly8gZmVtYWxlIHJpc2sgZmFjdG9yc1xuXHRsZXQgcHJvYmFuZElkeCAgPSBwZWRpZ3JlZV91dGlsLmdldFByb2JhbmRJbmRleChkYXRhc2V0KTtcblx0bGV0IHNleCA9ICdGJztcblx0aWYocHJvYmFuZElkeCkge1xuXHRcdHNleCA9IGRhdGFzZXRbcHJvYmFuZElkeF0uc2V4O1xuXHR9XG5cblx0aWYoc2V4ICE9PSAnTScpIHtcblx0XHRsZXQgbWVuYXJjaGUgICAgPSBnZXRfcmlza19mYWN0b3IoJ21lbmFyY2hlX2FnZScpO1xuXHRcdGxldCBwYXJpdHkgICAgICA9IGdldF9yaXNrX2ZhY3RvcigncGFyaXR5Jyk7XG5cdFx0bGV0IGZpcnN0X2JpcnRoID0gZ2V0X3Jpc2tfZmFjdG9yKCdhZ2Vfb2ZfZmlyc3RfbGl2ZV9iaXJ0aCcpO1xuXHRcdGxldCBvY191c2UgICAgICA9IGdldF9yaXNrX2ZhY3Rvcignb3JhbF9jb250cmFjZXB0aW9uJyk7XG5cdFx0bGV0IG1odF91c2UgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdtaHQnKTtcblx0XHRsZXQgYm1pICAgICAgICAgPSBnZXRfcmlza19mYWN0b3IoJ2JtaScpO1xuXHRcdGxldCBhbGNvaG9sICAgICA9IGdldF9yaXNrX2ZhY3RvcignYWxjb2hvbF9pbnRha2UnKTtcblx0XHRsZXQgbWVub3BhdXNlICAgPSBnZXRfcmlza19mYWN0b3IoJ2FnZV9vZl9tZW5vcGF1c2UnKTtcblx0XHRsZXQgbWRlbnNpdHkgICAgPSBnZXRfcmlza19mYWN0b3IoJ21hbW1vZ3JhcGhpY19kZW5zaXR5Jyk7XG5cdFx0bGV0IGhndCAgICAgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdoZWlnaHQnKTtcblx0XHRsZXQgdGwgICAgICAgICAgPSBnZXRfcmlza19mYWN0b3IoJ0FnZV9UdWJhbF9saWdhdGlvbicpO1xuXHRcdGxldCBlbmRvICAgICAgICA9IGdldF9yaXNrX2ZhY3RvcignZW5kb21ldHJpb3NpcycpO1xuXG5cdFx0aWYobWVuYXJjaGUgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjbWVuYXJjaGU9XCIrbWVuYXJjaGU7XG5cdFx0aWYocGFyaXR5ICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI3Bhcml0eT1cIitwYXJpdHk7XG5cdFx0aWYoZmlyc3RfYmlydGggIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjZmlyc3RfbGl2ZV9iaXJ0aD1cIitmaXJzdF9iaXJ0aDtcblx0XHRpZihvY191c2UgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjb2NfdXNlPVwiK29jX3VzZTtcblx0XHRpZihtaHRfdXNlICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI21odF91c2U9XCIrbWh0X3VzZTtcblx0XHRpZihibWkgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjQk1JPVwiK2JtaTtcblx0XHRpZihhbGNvaG9sICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI2FsY29ob2w9XCIrYWxjb2hvbDtcblx0XHRpZihtZW5vcGF1c2UgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjbWVub3BhdXNlPVwiK21lbm9wYXVzZTtcblx0XHRpZihtZGVuc2l0eSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNiaXJhZHM9XCIrbWRlbnNpdHk7XG5cdFx0aWYoaGd0ICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI2hlaWdodD1cIitoZ3Q7XG5cdFx0aWYodGwgIT09IHVuZGVmaW5lZClcblx0XHRcdGlmKHRsICE9PSBcIm5cIiAmJiB0bCAhPT0gXCJOXCIpXG5cdFx0XHRcdG1zZyArPSBcIlxcbiMjVEw9WVwiO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRtc2cgKz0gXCJcXG4jI1RMPU5cIjtcblxuXHRcdGlmKGVuZG8gIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjZW5kbz1cIitlbmRvO1xuXHR9XG5cdG1zZyArPSBcIlxcbiMjRmFtSURcXHROYW1lXFx0VGFyZ2V0XFx0SW5kaXZJRFxcdEZhdGhJRFxcdE1vdGhJRFxcdFNleFxcdE1adHdpblxcdERlYWRcXHRBZ2VcXHRZb2JcXHRCQzFcXHRCQzJcXHRPQ1xcdFBST1xcdFBBTlxcdEFzaGtuXFx0QlJDQTFcXHRCUkNBMlxcdFBBTEIyXFx0QVRNXFx0Q0hFSzJcXHRSQUQ1MURcXHRSQUQ1MUNcXHRCUklQMVxcdEVSOlBSOkhFUjI6Q0sxNDpDSzU2XCI7XG5cblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBwID0gZGF0YXNldFtpXTtcblx0XHRpZigkLmluQXJyYXkocC5uYW1lLCBleGNsKSAhPSAtMSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ0VYQ0xVREU6ICcrcC5uYW1lKTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdG1zZyArPSAnXFxuJytmYW1pZCsnXFx0JztcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBtYXggMTMgY2hhcnNcblx0XHRpZihpc2Fub24pXG5cdFx0XHRtc2cgKz0gaSsnXFx0JztcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIGRpc3BsYXlfbmFtZSAoQU5PTklNSVNFKSBtYXggOCBjaGFyc1xuXHRcdGVsc2Vcblx0XHRcdG1zZyArPSAocC5kaXNwbGF5X25hbWUgPyBwLmRpc3BsYXlfbmFtZSA6IFwiTkFcIikrJ1xcdCc7XG5cdFx0bXNnICs9ICgncHJvYmFuZCcgaW4gcCA/ICcxJyA6IDApKydcXHQnO1xuXHRcdG1zZyArPSBwLm5hbWUrJ1xcdCc7XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBtYXggNyBjaGFyc1xuXHRcdG1zZyArPSAoJ2ZhdGhlcicgaW4gcCAmJiAhKCdub3BhcmVudHMnIGluIHApICYmICgkLmluQXJyYXkocC5tb3RoZXIsIGV4Y2wpID09IC0xKT8gcC5mYXRoZXIgOiAwKSsnXFx0JztcdC8vIG1heCA3IGNoYXJzXG5cdFx0bXNnICs9ICgnbW90aGVyJyBpbiBwICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgKCQuaW5BcnJheShwLm1vdGhlciwgZXhjbCkgPT0gLTEpPyBwLm1vdGhlciA6IDApKydcXHQnO1x0Ly8gbWF4IDcgY2hhcnNcblx0XHRtc2cgKz0gcC5zZXgrJ1xcdCc7XG5cdFx0bXNnICs9ICgnbXp0d2luJyBpbiBwID8gcC5tenR3aW4gOiAwKSsnXFx0JzsgXHRcdFx0XHRcdFx0Ly8gTVp0d2luXG5cdFx0bXNnICs9ICgnc3RhdHVzJyBpbiBwID8gcC5zdGF0dXMgOiAwKSsnXFx0JztcdFx0XHRcdFx0XHRcdC8vIGN1cnJlbnQgc3RhdHVzOiAwID0gYWxpdmUsIDEgPSBkZWFkXG5cdFx0bXNnICs9ICgnYWdlJyBpbiBwID8gcC5hZ2UgOiAwKSsnXFx0JztcdFx0XHRcdFx0XHRcdFx0Ly8gQWdlIGF0IGxhc3QgZm9sbG93IHVwIG9yIDAgPSB1bnNwZWNpZmllZFxuXHRcdG1zZyArPSAoJ3lvYicgaW4gcCA/IHAueW9iIDogMCkrJ1xcdCc7XHRcdFx0XHRcdFx0XHRcdC8vIFlPQiBvciAwID0gdW5zcGVjaWZpZWRcblxuXHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdC8vIEFnZSBhdCAxc3QgY2FuY2VyIG9yIDAgPSB1bmFmZmVjdGVkLCBBVSA9IHVua25vd24gYWdlIGF0IGRpYWdub3NpcyAoYWZmZWN0ZWQgdW5rbm93bilcblx0XHRcdGlmKGRpYWdub3Npc19hZ2UgaW4gcClcblx0XHRcdFx0bXNnICs9IChkaWFnbm9zaXNfYWdlIGluIHAgPyBwW2RpYWdub3Npc19hZ2VdIDogJ0FVJykrJ1xcdCc7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdG1zZyArPSAnMFxcdCc7XG5cdFx0fSk7XG5cblx0XHQvLyBBc2hrZW5hemkgc3RhdHVzLCAwID0gbm90IEFzaGtlbmF6aSwgMSA9IEFzaGtlbmF6aVxuXHRcdG1zZyArPSAoJ2FzaGtlbmF6aScgaW4gcCA/IHAuYXNoa2VuYXppIDogMCkrJ1xcdCc7XG5cblx0XHRmb3IobGV0IGo9MDsgajxnZW5ldGljX3Rlc3QubGVuZ3RoOyBqKyspIHtcblx0XHRcdGlmKGdlbmV0aWNfdGVzdFtqXSsnX2dlbmVfdGVzdCcgaW4gcCAmJlxuXHRcdFx0ICAgcFtnZW5ldGljX3Rlc3Rbal0rJ19nZW5lX3Rlc3QnXVsndHlwZSddICE9PSAnLScgJiZcblx0XHRcdCAgIHBbZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0J11bJ3Jlc3VsdCddICE9PSAnLScpIHtcblx0XHRcdFx0bXNnICs9IHBbZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0J11bJ3R5cGUnXSArICc6Jztcblx0XHRcdFx0bXNnICs9IHBbZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0J11bJ3Jlc3VsdCddICsgJ1xcdCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cgKz0gJzA6MFxcdCc7XHRcdC8vIGdlbmV0aWMgdGVzdCB0eXBlLCAwPXVudGVzdGVkLCBTPW11dGF0aW9uIHNlYXJjaCwgVD1kaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBnZW5ldGljIHRlc3QgcmVzdWx0LCAwPXVudGVzdGVkLCBQPXBvc2l0aXZlLCBOPW5lZ2F0aXZlXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yKGxldCBqPTA7IGo8cGF0aG9sb2d5X3Rlc3RzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHQvLyBzdGF0dXMsIDAgPSB1bnNwZWNpZmllZCwgTiA9IG5lZ2F0aXZlLCBQID0gcG9zaXRpdmVcblx0XHRcdGlmKHBhdGhvbG9neV90ZXN0c1tqXSsnX2JjX3BhdGhvbG9neScgaW4gcCkge1xuXHRcdFx0XHRtc2cgKz0gcFtwYXRob2xvZ3lfdGVzdHNbal0rJ19iY19wYXRob2xvZ3knXTtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3BhdGhvbG9neSAnK3BbcGF0aG9sb2d5X3Rlc3RzW2pdKydfYmNfcGF0aG9sb2d5J10rJyBmb3IgJytwLmRpc3BsYXlfbmFtZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtc2cgKz0gJzAnO1xuXHRcdFx0fVxuXHRcdFx0aWYoajwocGF0aG9sb2d5X3Rlc3RzLmxlbmd0aC0xKSlcblx0XHRcdFx0bXNnICs9IFwiOlwiO1xuXHRcdH1cblx0fVxuXG5cdGNvbnNvbGUubG9nKG1zZywgUklTS19GQUNUT1JfU1RPUkUpO1xuXHRyZXR1cm4gbXNnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9yaXNrX2ZhY3RvcihyaXNrX2ZhY3Rvcl9uYW1lLCB2YWwpIHtcblx0UklTS19GQUNUT1JfU1RPUkVbc3RvcmVfbmFtZShyaXNrX2ZhY3Rvcl9uYW1lKV0gPSB2YWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfcmlza19mYWN0b3Iocmlza19mYWN0b3JfbmFtZSkge1xuXHRsZXQga2V5ID0gc3RvcmVfbmFtZShyaXNrX2ZhY3Rvcl9uYW1lKTtcblx0aWYoa2V5IGluIFJJU0tfRkFDVE9SX1NUT1JFKSB7XG5cdFx0cmV0dXJuIFJJU0tfRkFDVE9SX1NUT1JFW2tleV07XG5cdH1cblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLy8gcmVtb3ZlIHJpc2sgZmFjdG9yIGZyb20gc3RvcmFnZVxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZV9yaXNrX2ZhY3RvcihyaXNrX2ZhY3Rvcl9uYW1lKSB7XG5cdGRlbGV0ZSBSSVNLX0ZBQ1RPUl9TVE9SRVtzdG9yZV9uYW1lKHJpc2tfZmFjdG9yX25hbWUpXTtcbn1cblxuLy8gcHJlZml4IHJpc2sgZmFjdG9yIG5hbWUgd2l0aCB0aGUgYXBwL3BhZ2UgbmFtZVxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlX25hbWUocmlza19mYWN0b3JfbmFtZSkge1xuXHRyZXR1cm4gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJykuZmlsdGVyKGZ1bmN0aW9uKGVsKXsgcmV0dXJuICEhZWw7IH0pLnBvcCgpICtcblx0ICAgICAgICc6OicgKyByaXNrX2ZhY3Rvcl9uYW1lO1xufVxuIiwiLy8gcGVkaWdyZWUgSS9PXG5pbXBvcnQgKiBhcyBwZWRpZ3JlZV91dGlsIGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5pbXBvcnQge2dldF90cmVlX2RpbWVuc2lvbnMsIHZhbGlkYXRlX3BlZGlncmVlLCByZWJ1aWxkfSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Z2V0X25vbl9hbm9uX3BlZGlncmVlfSBmcm9tICcuL2NhbnJpc2tfZmlsZS5qcyc7XG5cbi8vIGNhbmNlcnMsIGdlbmV0aWMgJiBwYXRob2xvZ3kgdGVzdHNcbmV4cG9ydCBsZXQgY2FuY2VycyA9IHtcblx0XHQnYnJlYXN0X2NhbmNlcic6ICdicmVhc3RfY2FuY2VyX2RpYWdub3Npc19hZ2UnLFxuXHRcdCdicmVhc3RfY2FuY2VyMic6ICdicmVhc3RfY2FuY2VyMl9kaWFnbm9zaXNfYWdlJyxcblx0XHQnb3Zhcmlhbl9jYW5jZXInOiAnb3Zhcmlhbl9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J3Byb3N0YXRlX2NhbmNlcic6ICdwcm9zdGF0ZV9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J3BhbmNyZWF0aWNfY2FuY2VyJzogJ3BhbmNyZWF0aWNfY2FuY2VyX2RpYWdub3Npc19hZ2UnXG5cdH07XG5leHBvcnQgbGV0IGdlbmV0aWNfdGVzdCA9IFsnYnJjYTEnLCAnYnJjYTInLCAncGFsYjInLCAnYXRtJywgJ2NoZWsyJywgJ3JhZDUxZCcsXHQncmFkNTFjJywgJ2JyaXAxJ107XG5leHBvcnQgbGV0IHBhdGhvbG9neV90ZXN0cyA9IFsnZXInLCAncHInLCAnaGVyMicsICdjazE0JywgJ2NrNTYnXTtcblxuLy8gZ2V0IGJyZWFzdCBhbmQgb3ZhcmlhbiBQUlMgdmFsdWVzXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3Byc192YWx1ZXMoKSB7XG5cdGxldCBwcnMgPSB7fTtcblx0aWYoaGFzSW5wdXQoXCJicmVhc3RfcHJzX2FcIikgJiYgaGFzSW5wdXQoXCJicmVhc3RfcHJzX3pcIikpIHtcblx0XHRwcnNbJ2JyZWFzdF9jYW5jZXJfcHJzJ10gPSB7XG5cdFx0XHQnYWxwaGEnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX2EnKS52YWwoKSksXG5cdFx0XHQnenNjb3JlJzogcGFyc2VGbG9hdCgkKCcjYnJlYXN0X3Byc196JykudmFsKCkpLFxuXHRcdFx0J3BlcmNlbnQnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX3BlcmNlbnQnKS52YWwoKSlcblx0XHR9O1xuXHR9XG5cdGlmKGhhc0lucHV0KFwib3Zhcmlhbl9wcnNfYVwiKSAmJiBoYXNJbnB1dChcIm92YXJpYW5fcHJzX3pcIikpIHtcblx0XHRwcnNbJ292YXJpYW5fY2FuY2VyX3BycyddID0ge1xuXHRcdFx0J2FscGhhJzogcGFyc2VGbG9hdCgkKCcjb3Zhcmlhbl9wcnNfYScpLnZhbCgpKSxcblx0XHRcdCd6c2NvcmUnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc196JykudmFsKCkpLFxuXHRcdFx0J3BlcmNlbnQnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc19wZXJjZW50JykudmFsKCkpXG5cdFx0fTtcblx0fVxuXHRjb25zb2xlLmxvZyhwcnMpO1xuXHRyZXR1cm4gKGlzRW1wdHkocHJzKSA/IDAgOiBwcnMpO1xufVxuXG4vLyBjaGVjayBpZiBpbnB1dCBoYXMgYSB2YWx1ZVxuZXhwb3J0IGZ1bmN0aW9uIGhhc0lucHV0KGlkKSB7XG5cdHJldHVybiAkLnRyaW0oJCgnIycraWQpLnZhbCgpKS5sZW5ndGggIT09IDA7XG59XG5cbi8vIHJldHVybiB0cnVlIGlmIHRoZSBvYmplY3QgaXMgZW1wdHlcbmxldCBpc0VtcHR5ID0gZnVuY3Rpb24obXlPYmopIHtcblx0Zm9yKGxldCBrZXkgaW4gbXlPYmopIHtcblx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG15T2JqLCBrZXkpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3N1cmdpY2FsX29wcygpIHtcblx0bGV0IG1ldGEgPSBcIlwiO1xuXHRpZighJCgnI0E2XzRfM19jaGVjaycpLnBhcmVudCgpLmhhc0NsYXNzKFwib2ZmXCIpKSB7XG5cdFx0bWV0YSArPSBcIjtPVkFSWTI9eVwiO1xuXHR9XG5cdGlmKCEkKCcjQTZfNF83X2NoZWNrJykucGFyZW50KCkuaGFzQ2xhc3MoXCJvZmZcIikpIHtcblx0XHRtZXRhICs9IFwiO01BU1QyPXlcIjtcblx0fVxuXHRyZXR1cm4gbWV0YTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZChvcHRzKSB7XG5cdCQoJyNsb2FkJykuY2hhbmdlKGZ1bmN0aW9uKGUpIHtcblx0XHRsb2FkKGUsIG9wdHMpO1xuXHR9KTtcblxuXHQkKCcjc2F2ZScpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0c2F2ZShvcHRzKTtcblx0fSk7XG5cblx0JCgnI3NhdmVfY2FucmlzaycpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0bGV0IG1ldGEgPSBnZXRfc3VyZ2ljYWxfb3BzKCk7XG5cdFx0bGV0IHBycztcblx0XHR0cnkge1xuXHRcdFx0cHJzID0gZ2V0X3Byc192YWx1ZXMoKTtcblx0XHRcdGlmKHBycy5icmVhc3RfY2FuY2VyX3BycyAmJiBwcnMuYnJlYXN0X2NhbmNlcl9wcnMuYWxwaGEgIT09IDAgJiYgcHJzLmJyZWFzdF9jYW5jZXJfcHJzLnpzY29yZSAhPT0gMCkge1xuXHRcdFx0XHRtZXRhICs9IFwiXFxuIyNQUlNfQkM9YWxwaGE9XCIrcHJzLmJyZWFzdF9jYW5jZXJfcHJzLmFscGhhK1wiLHpzY29yZT1cIitwcnMuYnJlYXN0X2NhbmNlcl9wcnMuenNjb3JlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihwcnMub3Zhcmlhbl9jYW5jZXJfcHJzICYmIHBycy5vdmFyaWFuX2NhbmNlcl9wcnMuYWxwaGEgIT09IDAgJiYgcHJzLm92YXJpYW5fY2FuY2VyX3Bycy56c2NvcmUgIT09IDApIHtcblx0XHRcdFx0bWV0YSArPSBcIlxcbiMjUFJTX09DPWFscGhhPVwiK3Bycy5vdmFyaWFuX2NhbmNlcl9wcnMuYWxwaGErXCIsenNjb3JlPVwiK3Bycy5vdmFyaWFuX2NhbmNlcl9wcnMuenNjb3JlO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2goZXJyKSB7IGNvbnNvbGUud2FybihcIlBSU1wiLCBwcnMpOyB9XG5cdFx0c2F2ZV9jYW5yaXNrKG9wdHMsIG1ldGEpO1xuXHR9KTtcblxuXHQkKCcjcHJpbnQnKS5jbGljayhmdW5jdGlvbihfZSkge1xuXHRcdHByaW50KGdldF9wcmludGFibGVfc3ZnKG9wdHMpKTtcblx0fSk7XG5cblx0JCgnI3N2Z19kb3dubG9hZCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0c3ZnX2Rvd25sb2FkKGdldF9wcmludGFibGVfc3ZnKG9wdHMpKTtcblx0fSk7XG5cblx0JCgnI3BuZ19kb3dubG9hZCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0bGV0IGRlZmVycmVkID0gc3ZnMmltZygkKCdzdmcnKSwgXCJwZWRpZ3JlZVwiKTtcblx0XHQkLndoZW4uYXBwbHkoJCxbZGVmZXJyZWRdKS5kb25lKGZ1bmN0aW9uKCkge1xuXHRcdFx0bGV0IG9iaiA9IGdldEJ5TmFtZShhcmd1bWVudHMsIFwicGVkaWdyZWVcIik7XG5cdFx0XHRpZihwZWRpZ3JlZV91dGlsLmlzRWRnZSgpIHx8IHBlZGlncmVlX3V0aWwuaXNJRSgpKSB7XG5cdFx0XHRcdGxldCBodG1sPVwiPGltZyBzcmM9J1wiK29iai5pbWcrXCInIGFsdD0nY2FudmFzIGltYWdlJy8+XCI7XG5cdFx0XHRcdGxldCBuZXdUYWIgPSB3aW5kb3cub3BlbigpO1x0XHQvLyBwb3AtdXBzIG5lZWQgdG8gYmUgZW5hYmxlZFxuXHRcdFx0XHRuZXdUYWIuZG9jdW1lbnQud3JpdGUoaHRtbCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsZXQgYVx0ICA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblx0XHRcdFx0YS5ocmVmXHQgPSBvYmouaW1nO1xuXHRcdFx0XHRhLmRvd25sb2FkID0gJ3Bsb3QucG5nJztcblx0XHRcdFx0YS50YXJnZXQgICA9ICdfYmxhbmsnO1xuXHRcdFx0XHRkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpOyBhLmNsaWNrKCk7IGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEdldCBvYmplY3QgZnJvbSBhcnJheSBieSB0aGUgbmFtZSBhdHRyaWJ1dGUuXG4gKi9cbmZ1bmN0aW9uIGdldEJ5TmFtZShhcnIsIG5hbWUpIHtcblx0cmV0dXJuICQuZ3JlcChhcnIsIGZ1bmN0aW9uKG8peyByZXR1cm4gbyAmJiBvLm5hbWUgPT0gbmFtZTsgfSlbMF07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBTVkcgZG9jdW1lbnQgZWxlbWVudCBjb252ZXJ0IHRvIGltYWdlIChlLmcuIGpwZWcsIHBuZyAtIGRlZmF1bHQgcG5nKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN2ZzJpbWcoc3ZnLCBkZWZlcnJlZF9uYW1lLCBvcHRpb25zKSB7XG5cdGxldCBkZWZhdWx0cyA9IHtpc2NhbnZnOiBmYWxzZSwgcmVzb2x1dGlvbjogMSwgaW1nX3R5cGU6IFwiaW1hZ2UvcG5nXCJ9O1xuXHRpZighb3B0aW9ucykgb3B0aW9ucyA9IGRlZmF1bHRzO1xuXHQkLmVhY2goZGVmYXVsdHMsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0XHRpZighKGtleSBpbiBvcHRpb25zKSkge29wdGlvbnNba2V5XSA9IHZhbHVlO31cblx0fSk7XG5cblx0Ly8gc2V0IFNWRyBiYWNrZ3JvdW5kIHRvIHdoaXRlIC0gZml4IGZvciBqcGVnIGNyZWF0aW9uXG5cdGlmIChzdmcuZmluZChcIi5wZGYtd2hpdGUtYmdcIikubGVuZ3RoID09PSAwKXtcblx0XHRsZXQgZDNvYmogPSBkMy5zZWxlY3Qoc3ZnLmdldCgwKSk7XG5cdFx0ZDNvYmouYXBwZW5kKFwicmVjdFwiKVxuXHRcdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBkZi13aGl0ZS1iZ1wiKVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwid2hpdGVcIik7XG5cdFx0ZDNvYmouc2VsZWN0KFwiLnBkZi13aGl0ZS1iZ1wiKS5sb3dlcigpO1xuXHR9XG5cblx0bGV0IGRlZmVycmVkID0gJC5EZWZlcnJlZCgpO1xuXHRsZXQgc3ZnU3RyO1xuXHRpZiAodHlwZW9mIHdpbmRvdy5YTUxTZXJpYWxpemVyICE9IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzdmdTdHIgPSAobmV3IFhNTFNlcmlhbGl6ZXIoKSkuc2VyaWFsaXplVG9TdHJpbmcoc3ZnLmdldCgwKSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIHN2Zy54bWwgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHN2Z1N0ciA9IHN2Zy5nZXQoMCkueG1sO1xuXHR9XG5cblx0bGV0IGltZ3NyYyA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCcrIGJ0b2EodW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KHN2Z1N0cikpKTsgLy8gY29udmVydCBTVkcgc3RyaW5nIHRvIGRhdGEgVVJMXG5cdGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXHRjYW52YXMud2lkdGggPSBzdmcud2lkdGgoKSpvcHRpb25zLnJlc29sdXRpb247XG5cdGNhbnZhcy5oZWlnaHQgPSBzdmcuaGVpZ2h0KCkqb3B0aW9ucy5yZXNvbHV0aW9uO1xuXHRsZXQgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cdGxldCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuXHRpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYocGVkaWdyZWVfdXRpbC5pc0lFKCkpIHtcblx0XHRcdC8vIGNoYW5nZSBmb250IHNvIGl0IGlzbid0IHRpbnlcblx0XHRcdHN2Z1N0ciA9IHN2Z1N0ci5yZXBsYWNlKC8gZm9udC1zaXplPVwiXFxkPy5cXGQqZW1cIi9nLCAnJyk7XG5cdFx0XHRzdmdTdHIgPSBzdmdTdHIucmVwbGFjZSgvPHRleHQgL2csICc8dGV4dCBmb250LXNpemU9XCIxMnB4XCIgJyk7XG5cdFx0XHRsZXQgdiA9IGNhbnZnLkNhbnZnLmZyb21TdHJpbmcoY29udGV4dCwgc3ZnU3RyLCB7XG5cdFx0XHRcdHNjYWxlV2lkdGg6IGNhbnZhcy53aWR0aCxcblx0XHRcdFx0c2NhbGVIZWlnaHQ6IGNhbnZhcy5oZWlnaHQsXG5cdFx0XHRcdGlnbm9yZURpbWVuc2lvbnM6IHRydWVcblx0XHRcdH0pO1xuXHRcdFx0di5zdGFydCgpO1xuXHRcdFx0Y29uc29sZS5sb2coZGVmZXJyZWRfbmFtZSwgb3B0aW9ucy5pbWdfdHlwZSwgXCJ1c2UgY2FudmcgdG8gY3JlYXRlIGltYWdlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cdFx0XHRjb25zb2xlLmxvZyhkZWZlcnJlZF9uYW1lLCBvcHRpb25zLmltZ190eXBlKTtcblx0XHR9XG5cdFx0ZGVmZXJyZWQucmVzb2x2ZSh7J25hbWUnOiBkZWZlcnJlZF9uYW1lLCAncmVzb2x1dGlvbic6IG9wdGlvbnMucmVzb2x1dGlvbiwgJ2ltZyc6Y2FudmFzLnRvRGF0YVVSTChvcHRpb25zLmltZ190eXBlLCAxKSwgJ3cnOmNhbnZhcy53aWR0aCwgJ2gnOmNhbnZhcy5oZWlnaHR9KTtcblx0fTtcblx0aW1nLnNyYyA9IGltZ3NyYztcblx0cmV0dXJuIGRlZmVycmVkLnByb21pc2UoKTtcbn1cblxuZnVuY3Rpb24gZ2V0TWF0Y2hlcyhzdHIsIG15UmVnZXhwKSB7XG5cdGxldCBtYXRjaGVzID0gW107XG5cdGxldCBtYXRjaDtcblx0bGV0IGMgPSAwO1xuXHRteVJlZ2V4cC5sYXN0SW5kZXggPSAwO1xuXHR3aGlsZSAoKG1hdGNoID0gbXlSZWdleHAuZXhlYyhzdHIpKSkge1xuXHRcdGMrKztcblx0XHRpZihjID4gNDAwKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiZ2V0TWF0Y2hlczogY291bnRlciBleGNlZWRlZCA4MDBcIik7XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXHRcdG1hdGNoZXMucHVzaChtYXRjaCk7XG5cdFx0aWYgKG15UmVnZXhwLmxhc3RJbmRleCA9PT0gbWF0Y2guaW5kZXgpIHtcblx0XHRcdG15UmVnZXhwLmxhc3RJbmRleCsrO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbWF0Y2hlcztcbn1cblxuLy8gZmluZCBhbGwgdXJsJ3MgdG8gbWFrZSB1bmlxdWVcbmZ1bmN0aW9uIHVuaXF1ZV91cmxzKHN2Z19odG1sKSB7XG5cdGxldCBtYXRjaGVzID0gZ2V0TWF0Y2hlcyhzdmdfaHRtbCwgL3VybFxcKCgmcXVvdDt8XCJ8Jyl7MCwxfSMoLio/KSgmcXVvdDt8XCJ8Jyl7MCwxfVxcKS9nKTtcblx0aWYobWF0Y2hlcyA9PT0gLTEpXG5cdFx0cmV0dXJuIFwiRVJST1IgRElTUExBWUlORyBQRURJR1JFRVwiXG5cblx0JC5lYWNoKG1hdGNoZXMsIGZ1bmN0aW9uKGluZGV4LCBtYXRjaCkge1xuXHRcdGxldCBxdW90ZSA9IChtYXRjaFsxXSA/IG1hdGNoWzFdIDogXCJcIik7XG5cdFx0bGV0IHZhbCA9IG1hdGNoWzJdO1xuXHRcdGxldCBtMSA9IFwiaWQ9XFxcIlwiICsgdmFsICsgXCJcXFwiXCI7XG5cdFx0bGV0IG0yID0gXCJ1cmxcXFxcKFwiICsgcXVvdGUgKyBcIiNcIiArIHZhbCArIHF1b3RlICsgXCJcXFxcKVwiO1xuXG5cdFx0bGV0IG5ld3ZhbCA9IHZhbCtwZWRpZ3JlZV91dGlsLm1ha2VpZCgyKTtcblx0XHRzdmdfaHRtbCA9IHN2Z19odG1sLnJlcGxhY2UobmV3IFJlZ0V4cChtMSwgJ2cnKSwgXCJpZD1cXFwiXCIrbmV3dmFsK1wiXFxcIlwiICk7XG5cdFx0c3ZnX2h0bWwgPSBzdmdfaHRtbC5yZXBsYWNlKG5ldyBSZWdFeHAobTIsICdnJyksIFwidXJsKCNcIituZXd2YWwrXCIpXCIgKTtcbiAgIH0pO1xuXHRyZXR1cm4gc3ZnX2h0bWw7XG59XG5cbi8vIHJldHVybiBhIGNvcHkgcGVkaWdyZWUgc3ZnXG5leHBvcnQgZnVuY3Rpb24gY29weV9zdmcob3B0cykge1xuXHRsZXQgc3ZnX25vZGUgPSBnZXRfcHJpbnRhYmxlX3N2ZyhvcHRzKTtcblx0bGV0IGQzb2JqID0gZDMuc2VsZWN0KHN2Z19ub2RlLmdldCgwKSk7XG5cblx0Ly8gcmVtb3ZlIHVudXNlZCBlbGVtZW50c1xuXHRkM29iai5zZWxlY3RBbGwoXCIucG9wdXBfc2VsZWN0aW9uLCAuaW5kaV9yZWN0LCAuYWRkc2libGluZywgLmFkZHBhcnRuZXIsIC5hZGRjaGlsZCwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5saW5lX2RyYWdfc2VsZWN0aW9uXCIpLnJlbW92ZSgpO1xuXHRkM29iai5zZWxlY3RBbGwoXCJ0ZXh0XCIpXG5cdCAgLmZpbHRlcihmdW5jdGlvbigpe1xuXHRcdCByZXR1cm4gZDMuc2VsZWN0KHRoaXMpLnRleHQoKS5sZW5ndGggPT09IDBcblx0ICB9KS5yZW1vdmUoKTtcblx0cmV0dXJuICQodW5pcXVlX3VybHMoc3ZnX25vZGUuaHRtbCgpKSk7XG59XG5cbi8vIGdldCBwcmludGFibGUgc3ZnIGRpdiwgYWRqdXN0IHNpemUgdG8gdHJlZSBkaW1lbnNpb25zIGFuZCBzY2FsZSB0byBmaXRcbmV4cG9ydCBmdW5jdGlvbiBnZXRfcHJpbnRhYmxlX3N2ZyhvcHRzKSB7XG5cdGxldCBsb2NhbF9kYXRhc2V0ID0gcGVkY2FjaGUuY3VycmVudChvcHRzKTsgLy8gZ2V0IGN1cnJlbnQgZGF0YXNldFxuXHRpZiAobG9jYWxfZGF0YXNldCAhPT0gdW5kZWZpbmVkICYmIGxvY2FsX2RhdGFzZXQgIT09IG51bGwpIHtcblx0XHRvcHRzLmRhdGFzZXQgPSBsb2NhbF9kYXRhc2V0O1xuXHR9XG5cblx0bGV0IHRyZWVfZGltZW5zaW9ucyA9IGdldF90cmVlX2RpbWVuc2lvbnMob3B0cyk7XG5cdGxldCBzdmdfZGl2ID0gJCgnPGRpdj48L2Rpdj4nKTsgIFx0XHRcdFx0Ly8gY3JlYXRlIGEgbmV3IGRpdlxuXHRsZXQgc3ZnID0gJCgnIycrb3B0cy50YXJnZXREaXYpLmZpbmQoJ3N2ZycpLmNsb25lKCkuYXBwZW5kVG8oc3ZnX2Rpdik7XG5cdGlmKG9wdHMud2lkdGggPCB0cmVlX2RpbWVuc2lvbnMud2lkdGggfHwgb3B0cy5oZWlnaHQgPCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0IHx8XG5cdCAgIHRyZWVfZGltZW5zaW9ucy53aWR0aCA+IDU5NSB8fCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSB7XG5cdFx0bGV0IHdpZCA9IHRyZWVfZGltZW5zaW9ucy53aWR0aDtcblx0XHRsZXQgaGd0ID0gdHJlZV9kaW1lbnNpb25zLmhlaWdodCArIDEwMDtcblx0XHRsZXQgc2NhbGUgPSAxLjA7XG5cblx0XHRpZih0cmVlX2RpbWVuc2lvbnMud2lkdGggPiA1OTUgfHwgdHJlZV9kaW1lbnNpb25zLmhlaWdodCA+IDg0MikgeyAgIC8vIHNjYWxlIHRvIGZpdCBBNFxuXHRcdFx0aWYodHJlZV9kaW1lbnNpb25zLndpZHRoID4gNTk1KSAgd2lkID0gNTk1O1xuXHRcdFx0aWYodHJlZV9kaW1lbnNpb25zLmhlaWdodCA+IDg0MikgaGd0ID0gODQyO1xuXHRcdFx0bGV0IHhzY2FsZSA9IHdpZC90cmVlX2RpbWVuc2lvbnMud2lkdGg7XG5cdFx0XHRsZXQgeXNjYWxlID0gaGd0L3RyZWVfZGltZW5zaW9ucy5oZWlnaHQ7XG5cdFx0XHRzY2FsZSA9ICh4c2NhbGUgPCB5c2NhbGUgPyB4c2NhbGUgOiB5c2NhbGUpO1xuXHRcdH1cblxuXHRcdHN2Zy5hdHRyKCd3aWR0aCcsIHdpZCk7XHRcdC8vIGFkanVzdCBkaW1lbnNpb25zXG5cdFx0c3ZnLmF0dHIoJ2hlaWdodCcsIGhndCk7XG5cblx0XHRsZXQgeXRyYW5zZm9ybSA9ICgtb3B0cy5zeW1ib2xfc2l6ZSoxLjUqc2NhbGUpO1xuXHRcdHN2Zy5maW5kKFwiLmRpYWdyYW1cIikuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLCBcIit5dHJhbnNmb3JtK1wiKSBzY2FsZShcIitzY2FsZStcIilcIik7XG5cdH1cblx0cmV0dXJuIHN2Z19kaXY7XG59XG5cbi8vIGRvd25sb2FkIHRoZSBTVkcgdG8gYSBmaWxlXG5leHBvcnQgZnVuY3Rpb24gc3ZnX2Rvd25sb2FkKHN2Zyl7XG5cdGxldCBhXHQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRhLmhyZWZcdCA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LCcrIGJ0b2EoIHVuZXNjYXBlKCBlbmNvZGVVUklDb21wb25lbnQoIHN2Zy5odG1sKCkgKSApICk7XG5cdGEuZG93bmxvYWQgPSAncGxvdC5zdmcnO1xuXHRhLnRhcmdldCAgID0gJ19ibGFuayc7XG5cdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcbn1cblxuLy8gb3BlbiBwcmludCB3aW5kb3cgZm9yIGEgZ2l2ZW4gZWxlbWVudFxuZXhwb3J0IGZ1bmN0aW9uIHByaW50KGVsLCBpZCl7XG5cdGlmKGVsLmNvbnN0cnVjdG9yICE9PSBBcnJheSlcblx0XHRlbCA9IFtlbF07XG5cblx0bGV0IHdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkqMC45O1xuXHRsZXQgaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpLTEwO1xuXHRsZXQgY3NzRmlsZXMgPSBbXG5cdFx0Jy9zdGF0aWMvY3NzL2NhbnJpc2suY3NzJyxcblx0XHQnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9mb250LWF3ZXNvbWVANC43LjAvY3NzL2ZvbnQtYXdlc29tZS5taW4uY3NzJ1xuXHRdO1xuXHRsZXQgcHJpbnRXaW5kb3cgPSB3aW5kb3cub3BlbignJywgJ1ByaW50TWFwJywgJ3dpZHRoPScgKyB3aWR0aCArICcsaGVpZ2h0PScgKyBoZWlnaHQpO1xuXHRsZXQgaGVhZENvbnRlbnQgPSAnJztcblx0Zm9yKGxldCBpPTA7IGk8Y3NzRmlsZXMubGVuZ3RoOyBpKyspXG5cdFx0aGVhZENvbnRlbnQgKz0gJzxsaW5rIGhyZWY9XCInK2Nzc0ZpbGVzW2ldKydcIiByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgbWVkaWE9XCJhbGxcIj4nO1xuXHRoZWFkQ29udGVudCArPSBcIjxzdHlsZT5ib2R5IHtmb250LXNpemU6IFwiICsgJChcImJvZHlcIikuY3NzKCdmb250LXNpemUnKSArIFwiO308L3N0eWxlPlwiO1xuXG5cdGxldCBodG1sID0gXCJcIjtcblx0Zm9yKGxldCBpPTA7IGk8ZWwubGVuZ3RoOyBpKyspIHtcblx0XHRpZihpID09PSAwICYmIGlkKVxuXHRcdFx0aHRtbCArPSBpZDtcblx0XHRodG1sICs9ICQoZWxbaV0pLmh0bWwoKTtcblx0XHRpZihpIDwgZWwubGVuZ3RoLTEpXG5cdFx0XHRodG1sICs9ICc8ZGl2IGNsYXNzPVwicGFnZS1icmVha1wiPiA8L2Rpdj4nO1xuXHR9XG5cblx0cHJpbnRXaW5kb3cuZG9jdW1lbnQud3JpdGUoaGVhZENvbnRlbnQpO1xuXHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShodG1sKTtcblx0cHJpbnRXaW5kb3cuZG9jdW1lbnQuY2xvc2UoKTtcblxuXHRwcmludFdpbmRvdy5mb2N1cygpO1xuXHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdHByaW50V2luZG93LnByaW50KCk7XG5cdFx0cHJpbnRXaW5kb3cuY2xvc2UoKTtcblx0fSwgMzAwKTtcbn1cblxuLy8gc2F2ZSBjb250ZW50IHRvIGEgZmlsZVxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfZmlsZShvcHRzLCBjb250ZW50LCBmaWxlbmFtZSwgdHlwZSl7XG5cdGlmKG9wdHMuREVCVUcpXG5cdFx0Y29uc29sZS5sb2coY29udGVudCk7XG5cdGlmKCFmaWxlbmFtZSkgZmlsZW5hbWUgPSBcInBlZC50eHRcIjtcblx0aWYoIXR5cGUpIHR5cGUgPSBcInRleHQvcGxhaW5cIjtcblxuICAgbGV0IGZpbGUgPSBuZXcgQmxvYihbY29udGVudF0sIHt0eXBlOiB0eXBlfSk7XG4gICBpZiAod2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSBcdC8vIElFMTArXG5cdCAgIHdpbmRvdy5uYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihmaWxlLCBmaWxlbmFtZSk7XG4gICBlbHNlIHsgXHRcdFx0XHRcdFx0XHRcdFx0Ly8gb3RoZXIgYnJvd3NlcnNcblx0ICAgbGV0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcblx0ICAgbGV0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG5cdCAgIGEuaHJlZiA9IHVybDtcblx0ICAgYS5kb3dubG9hZCA9IGZpbGVuYW1lO1xuXHQgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xuXHQgICBhLmNsaWNrKCk7XG5cdCAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0ICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcblx0XHQgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuXHRcdH0sIDApO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlKG9wdHMpe1xuXHRsZXQgY29udGVudCA9IEpTT04uc3RyaW5naWZ5KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRzYXZlX2ZpbGUob3B0cywgY29udGVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlX2NhbnJpc2sob3B0cywgbWV0YSl7XG5cdHNhdmVfZmlsZShvcHRzLCBnZXRfbm9uX2Fub25fcGVkaWdyZWUocGVkY2FjaGUuY3VycmVudChvcHRzKSwgbWV0YSksIFwiY2Fucmlzay50eHRcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5yaXNrX3ZhbGlkYXRpb24ob3B0cykge1xuXHQkLmVhY2gob3B0cy5kYXRhc2V0LCBmdW5jdGlvbihpZHgsIHApIHtcblx0XHRpZighcC5oaWRkZW4gJiYgcC5zZXggPT09ICdNJyAmJiAhcGVkaWdyZWVfdXRpbC5pc1Byb2JhbmQocCkpIHtcblx0XHRcdGlmKHBbY2FuY2Vyc1snYnJlYXN0X2NhbmNlcjInXV0pIHtcblx0XHRcdFx0bGV0IG1zZyA9ICdNYWxlIGZhbWlseSBtZW1iZXIgKCcrcC5kaXNwbGF5X25hbWUrJykgd2l0aCBjb250cmFsYXRlcmFsIGJyZWFzdCBjYW5jZXIgZm91bmQuICcrXG5cdFx0XHRcdFx0XHQgICdQbGVhc2Ugbm90ZSB0aGF0IGFzIHRoZSByaXNrIG1vZGVscyBkbyBub3QgdGFrZSB0aGlzIGludG8gYWNjb3VudCB0aGUgc2Vjb25kICcrXG5cdFx0XHRcdFx0XHQgICdicmVhc3QgY2FuY2VyIGlzIGlnbm9yZWQuJ1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKG1zZyk7XG5cdFx0XHRcdGRlbGV0ZSBwW2NhbmNlcnNbJ2JyZWFzdF9jYW5jZXIyJ11dO1xuXHRcdFx0XHRwZWRpZ3JlZV91dGlsLm1lc3NhZ2VzKFwiV2FybmluZ1wiLCBtc2cpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkKGUsIG9wdHMpIHtcblx0bGV0IGYgPSBlLnRhcmdldC5maWxlc1swXTtcblx0aWYoZikge1xuXHRcdGxldCByaXNrX2ZhY3RvcnM7XG5cdFx0bGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0cmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRcdGNvbnNvbGUubG9nKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZihlLnRhcmdldC5yZXN1bHQuc3RhcnRzV2l0aChcIkJPQURJQ0VBIGltcG9ydCBwZWRpZ3JlZSBmaWxlIGZvcm1hdCA0LjBcIikpIHtcblx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSByZWFkQm9hZGljZWFWNChlLnRhcmdldC5yZXN1bHQsIDQpO1xuXHRcdFx0XHRcdGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKTtcblx0XHRcdFx0fSBlbHNlIGlmKGUudGFyZ2V0LnJlc3VsdC5zdGFydHNXaXRoKFwiQk9BRElDRUEgaW1wb3J0IHBlZGlncmVlIGZpbGUgZm9ybWF0IDIuMFwiKSkge1xuXHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRCb2FkaWNlYVY0KGUudGFyZ2V0LnJlc3VsdCwgMik7XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2UgaWYoZS50YXJnZXQucmVzdWx0LnN0YXJ0c1dpdGgoXCIjI1wiKSAmJiBlLnRhcmdldC5yZXN1bHQuaW5kZXhPZihcIkNhblJpc2tcIikgIT09IC0xKSB7XG5cdFx0XHRcdFx0bGV0IGNhbnJpc2tfZGF0YSA9IHJlYWRDYW5SaXNrVjEoZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdFx0XHRyaXNrX2ZhY3RvcnMgPSBjYW5yaXNrX2RhdGFbMF07XG5cdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gY2Fucmlza19kYXRhWzFdO1xuXHRcdFx0XHRcdGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gSlNPTi5wYXJzZShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdH0gY2F0Y2goZXJyKSB7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSByZWFkTGlua2FnZShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHR2YWxpZGF0ZV9wZWRpZ3JlZShvcHRzKTtcblx0XHRcdH0gY2F0Y2goZXJyMSkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycjEsIGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsICggZXJyMS5tZXNzYWdlID8gZXJyMS5tZXNzYWdlIDogZXJyMSkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmxvZyhvcHRzLmRhdGFzZXQpO1xuXHRcdFx0dHJ5e1xuXHRcdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdFx0XHRpZihyaXNrX2ZhY3RvcnMgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHJpc2tfZmFjdG9ycyk7XG5cdFx0XHRcdFx0Ly8gbG9hZCByaXNrIGZhY3RvcnMgLSBmaXJlIHJpc2tmYWN0b3JDaGFuZ2UgZXZlbnRcblx0XHRcdFx0XHQkKGRvY3VtZW50KS50cmlnZ2VyKCdyaXNrZmFjdG9yQ2hhbmdlJywgW29wdHMsIHJpc2tfZmFjdG9yc10pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ2ZoQ2hhbmdlJywgW29wdHNdKTsgXHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQvLyB1cGRhdGUgRkggc2VjdGlvblxuXHRcdFx0XHRcdGFjY19GYW1IaXN0X3RpY2tlZCgpO1xuXHRcdFx0XHRcdGFjY19GYW1IaXN0X0xlYXZlKCk7XG5cdFx0XHRcdFx0UkVTVUxULkZMQUdfRkFNSUxZX01PREFMID0gdHJ1ZTtcblx0XHRcdFx0fSBjYXRjaChlcnIzKSB7XG5cdFx0XHRcdFx0Ly8gaWdub3JlIGVycm9yXG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2goZXJyMikge1xuXHRcdFx0XHRwZWRpZ3JlZV91dGlsLm1lc3NhZ2VzKFwiRmlsZSBFcnJvclwiLCAoIGVycjIubWVzc2FnZSA/IGVycjIubWVzc2FnZSA6IGVycjIpKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsIFwiRmlsZSBjb3VsZCBub3QgYmUgcmVhZCEgQ29kZSBcIiArIGV2ZW50LnRhcmdldC5lcnJvci5jb2RlKTtcblx0XHR9O1xuXHRcdHJlYWRlci5yZWFkQXNUZXh0KGYpO1xuXHR9IGVsc2Uge1xuXHRcdGNvbnNvbGUuZXJyb3IoXCJGaWxlIGNvdWxkIG5vdCBiZSByZWFkIVwiKTtcblx0fVxuXHQkKFwiI2xvYWRcIilbMF0udmFsdWUgPSAnJzsgLy8gcmVzZXQgdmFsdWVcbn1cblxuLy9cbi8vIGh0dHBzOi8vd3d3LmNvZy1nZW5vbWljcy5vcmcvcGxpbmsvMS45L2Zvcm1hdHMjcGVkXG4vLyBodHRwczovL3d3dy5jb2ctZ2Vub21pY3Mub3JnL3BsaW5rLzEuOS9mb3JtYXRzI2ZhbVxuLy9cdDEuIEZhbWlseSBJRCAoJ0ZJRCcpXG4vL1x0Mi4gV2l0aGluLWZhbWlseSBJRCAoJ0lJRCc7IGNhbm5vdCBiZSAnMCcpXG4vL1x0My4gV2l0aGluLWZhbWlseSBJRCBvZiBmYXRoZXIgKCcwJyBpZiBmYXRoZXIgaXNuJ3QgaW4gZGF0YXNldClcbi8vXHQ0LiBXaXRoaW4tZmFtaWx5IElEIG9mIG1vdGhlciAoJzAnIGlmIG1vdGhlciBpc24ndCBpbiBkYXRhc2V0KVxuLy9cdDUuIFNleCBjb2RlICgnMScgPSBtYWxlLCAnMicgPSBmZW1hbGUsICcwJyA9IHVua25vd24pXG4vL1x0Ni4gUGhlbm90eXBlIHZhbHVlICgnMScgPSBjb250cm9sLCAnMicgPSBjYXNlLCAnLTknLycwJy9ub24tbnVtZXJpYyA9IG1pc3NpbmcgZGF0YSBpZiBjYXNlL2NvbnRyb2wpXG4vLyAgNy4gR2Vub3R5cGVzIChjb2x1bW4gNyBvbndhcmRzKTtcbi8vXHQgY29sdW1ucyA3ICYgOCBhcmUgYWxsZWxlIGNhbGxzIGZvciBmaXJzdCB2YXJpYW50ICgnMCcgPSBubyBjYWxsKTsgY29sdW1tbnMgOSAmIDEwIGFyZSBjYWxscyBmb3Igc2Vjb25kIHZhcmlhbnQgZXRjLlxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRMaW5rYWdlKGJvYWRpY2VhX2xpbmVzKSB7XG5cdGxldCBsaW5lcyA9IGJvYWRpY2VhX2xpbmVzLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG5cdGxldCBwZWQgPSBbXTtcblx0bGV0IGZhbWlkO1xuXHRmb3IobGV0IGkgPSAwO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0ICAgbGV0IGF0dHIgPSAkLm1hcChsaW5lc1tpXS50cmltKCkuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cdCAgIGlmKGF0dHIubGVuZ3RoIDwgNSlcblx0XHQgICB0aHJvdygndW5rbm93biBmb3JtYXQnKTtcblx0ICAgbGV0IHNleCA9IChhdHRyWzRdID09ICcxJyA/ICdNJyA6IChhdHRyWzRdID09ICcyJyA/ICdGJyA6ICdVJykpO1xuXHQgICBsZXQgaW5kaSA9IHtcblx0XHRcdCdmYW1pZCc6IGF0dHJbMF0sXG5cdFx0XHQnZGlzcGxheV9uYW1lJzogYXR0clsxXSxcblx0XHRcdCduYW1lJzpcdGF0dHJbMV0sXG5cdFx0XHQnc2V4Jzogc2V4XG5cdFx0fTtcblx0XHRpZihhdHRyWzJdICE9PSBcIjBcIikgaW5kaS5mYXRoZXIgPSBhdHRyWzJdO1xuXHRcdGlmKGF0dHJbM10gIT09IFwiMFwiKSBpbmRpLm1vdGhlciA9IGF0dHJbM107XG5cblx0XHRpZiAodHlwZW9mIGZhbWlkICE9ICd1bmRlZmluZWQnICYmIGZhbWlkICE9PSBpbmRpLmZhbWlkKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdtdWx0aXBsZSBmYW1pbHkgSURzIGZvdW5kIG9ubHkgdXNpbmcgZmFtaWQgPSAnK2ZhbWlkKTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRpZihhdHRyWzVdID09IFwiMlwiKSBpbmRpLmFmZmVjdGVkID0gMjtcblx0XHQvLyBhZGQgZ2Vub3R5cGUgY29sdW1uc1xuXHRcdGlmKGF0dHIubGVuZ3RoID4gNikge1xuXHRcdFx0aW5kaS5hbGxlbGVzID0gXCJcIjtcblx0XHRcdGZvcihsZXQgaj02OyBqPGF0dHIubGVuZ3RoOyBqKz0yKSB7XG5cdFx0XHRcdGluZGkuYWxsZWxlcyArPSBhdHRyW2pdICsgXCIvXCIgKyBhdHRyW2orMV0gKyBcIjtcIjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHRmYW1pZCA9IGF0dHJbMF07XG5cdH1cblx0cmV0dXJuIHByb2Nlc3NfcGVkKHBlZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkQ2FuUmlza1YxKGJvYWRpY2VhX2xpbmVzKSB7XG5cdGxldCBsaW5lcyA9IGJvYWRpY2VhX2xpbmVzLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG5cdGxldCBwZWQgPSBbXTtcblx0bGV0IGhkciA9IFtdOyAgLy8gY29sbGVjdCByaXNrIGZhY3RvciBoZWFkZXIgbGluZXNcblx0Ly8gYXNzdW1lcyB0d28gbGluZSBoZWFkZXJcblx0Zm9yKGxldCBpID0gMDtpIDwgbGluZXMubGVuZ3RoO2krKyl7XG5cdFx0bGV0IGxuID0gbGluZXNbaV0udHJpbSgpO1xuXHRcdGlmKGxuLnN0YXJ0c1dpdGgoXCIjI1wiKSkge1xuXHRcdFx0aWYobG4uc3RhcnRzV2l0aChcIiMjQ2FuUmlza1wiKSAmJiBsbi5pbmRleE9mKFwiO1wiKSA+IC0xKSB7ICAgLy8gY29udGFpbnMgc3VyZ2ljYWwgb3AgZGF0YVxuXHRcdFx0XHRsZXQgb3BzID0gbG4uc3BsaXQoXCI7XCIpO1xuXHRcdFx0XHRmb3IobGV0IGo9MTsgajxvcHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRsZXQgb3BkYXRhID0gb3BzW2pdLnNwbGl0KFwiPVwiKTtcblx0XHRcdFx0XHRpZihvcGRhdGEubGVuZ3RoID09PSAyKSB7XG5cdFx0XHRcdFx0XHRoZHIucHVzaChvcHNbal0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYobG4uaW5kZXhPZihcIkNhblJpc2tcIikgPT09IC0xICYmICFsbi5zdGFydHNXaXRoKFwiIyNGYW1JRFwiKSkge1xuXHRcdFx0XHRoZHIucHVzaChsbi5yZXBsYWNlKFwiIyNcIiwgXCJcIikpO1xuXHRcdFx0fVxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0bGV0IGRlbGltID0gL1xcdC87XG5cdFx0aWYobG4uaW5kZXhPZignXFx0JykgPCAwKSB7XG5cdFx0XHRkZWxpbSA9IC9cXHMrLztcblx0XHRcdGNvbnNvbGUubG9nKFwiTk9UIFRBQiBERUxJTVwiKTtcblx0XHR9XG5cdFx0bGV0IGF0dHIgPSAkLm1hcChsbi5zcGxpdChkZWxpbSksIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwudHJpbSgpO30pO1xuXG5cdFx0aWYoYXR0ci5sZW5ndGggPiAxKSB7XG5cdFx0XHRsZXQgaW5kaSA9IHtcblx0XHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdFx0J2Rpc3BsYXlfbmFtZSc6IGF0dHJbMV0sXG5cdFx0XHRcdCduYW1lJzpcdGF0dHJbM10sXG5cdFx0XHRcdCdzZXgnOiBhdHRyWzZdLFxuXHRcdFx0XHQnc3RhdHVzJzogYXR0cls4XVxuXHRcdFx0fTtcblx0XHRcdGlmKGF0dHJbMl0gPT0gMSkgaW5kaS5wcm9iYW5kID0gdHJ1ZTtcblx0XHRcdGlmKGF0dHJbNF0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbNF07XG5cdFx0XHRpZihhdHRyWzVdICE9PSBcIjBcIikgaW5kaS5tb3RoZXIgPSBhdHRyWzVdO1xuXHRcdFx0aWYoYXR0cls3XSAhPT0gXCIwXCIpIGluZGkubXp0d2luID0gYXR0cls3XTtcblx0XHRcdGlmKGF0dHJbOV0gIT09IFwiMFwiKSBpbmRpLmFnZSA9IGF0dHJbOV07XG5cdFx0XHRpZihhdHRyWzEwXSAhPT0gXCIwXCIpIGluZGkueW9iID0gYXR0clsxMF07XG5cblx0XHRcdGxldCBpZHggPSAxMTtcblx0XHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdFx0Ly8gQWdlIGF0IDFzdCBjYW5jZXIgb3IgMCA9IHVuYWZmZWN0ZWQsIEFVID0gdW5rbm93biBhZ2UgYXQgZGlhZ25vc2lzIChhZmZlY3RlZCB1bmtub3duKVxuXHRcdFx0XHRpZihhdHRyW2lkeF0gIT09IFwiMFwiKSB7XG5cdFx0XHRcdFx0aW5kaVtkaWFnbm9zaXNfYWdlXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZHgrKztcblx0XHRcdH0pO1xuXG5cdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdC8vIEJSQ0ExLCBCUkNBMiwgUEFMQjIsIEFUTSwgQ0hFSzIsIC4uLi4gZ2VuZXRpYyB0ZXN0c1xuXHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHR5cGUsIDAgPSB1bnRlc3RlZCwgUyA9IG11dGF0aW9uIHNlYXJjaCwgVCA9IGRpcmVjdCBnZW5lIHRlc3Rcblx0XHRcdC8vIGdlbmV0aWMgdGVzdCByZXN1bHQsIDAgPSB1bnRlc3RlZCwgUCA9IHBvc2l0aXZlLCBOID0gbmVnYXRpdmVcblx0XHRcdGZvcihsZXQgaj0wOyBqPGdlbmV0aWNfdGVzdC5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRsZXQgZ2VuZV90ZXN0ID0gYXR0cltpZHhdLnNwbGl0KFwiOlwiKTtcblx0XHRcdFx0aWYoZ2VuZV90ZXN0WzBdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZigoZ2VuZV90ZXN0WzBdID09PSAnUycgfHwgZ2VuZV90ZXN0WzBdID09PSAnVCcpICYmIChnZW5lX3Rlc3RbMV0gPT09ICdQJyB8fCBnZW5lX3Rlc3RbMV0gPT09ICdOJykpXG5cdFx0XHRcdFx0XHRpbmRpW2dlbmV0aWNfdGVzdFtqXSArICdfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBnZW5lX3Rlc3RbMF0sICdyZXN1bHQnOiBnZW5lX3Rlc3RbMV19O1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignVU5SRUNPR05JU0VEIEdFTkUgVEVTVCBPTiBMSU5FICcrIChpKzEpICsgXCI6IFwiICsgZ2VuZV90ZXN0WzBdICsgXCIgXCIgKyBnZW5lX3Rlc3RbMV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fVxuXHRcdFx0Ly8gc3RhdHVzLCAwID0gdW5zcGVjaWZpZWQsIE4gPSBuZWdhdGl2ZSwgUCA9IHBvc2l0aXZlXG5cdFx0XHRsZXQgcGF0aF90ZXN0ID0gYXR0cltpZHhdLnNwbGl0KFwiOlwiKTtcblx0XHRcdGZvcihsZXQgaj0wOyBqPHBhdGhfdGVzdC5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZihwYXRoX3Rlc3Rbal0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKHBhdGhfdGVzdFtqXSA9PT0gJ04nIHx8IHBhdGhfdGVzdFtqXSA9PT0gJ1AnKVxuXHRcdFx0XHRcdFx0aW5kaVtwYXRob2xvZ3lfdGVzdHNbal0gKyAnX2JjX3BhdGhvbG9neSddID0gcGF0aF90ZXN0W2pdO1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignVU5SRUNPR05JU0VEIFBBVEhPTE9HWSBPTiBMSU5FICcrIChpKzEpICsgXCI6IFwiICtwYXRob2xvZ3lfdGVzdHNbal0gKyBcIiBcIiArcGF0aF90ZXN0W2pdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cGVkLnVuc2hpZnQoaW5kaSk7XG5cdFx0fVxuXHR9XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gW2hkciwgcHJvY2Vzc19wZWQocGVkKV07XG5cdH0gY2F0Y2goZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0cmV0dXJuIFtoZHIsIHBlZF07XG5cdH1cbn1cblxuLy8gcmVhZCBib2FkaWNlYSBmb3JtYXQgdjQgJiB2MlxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRCb2FkaWNlYVY0KGJvYWRpY2VhX2xpbmVzLCB2ZXJzaW9uKSB7XG5cdGxldCBsaW5lcyA9IGJvYWRpY2VhX2xpbmVzLnRyaW0oKS5zcGxpdCgnXFxuJyk7XG5cdGxldCBwZWQgPSBbXTtcblx0Ly8gYXNzdW1lcyB0d28gbGluZSBoZWFkZXJcblx0Zm9yKGxldCBpID0gMjtpIDwgbGluZXMubGVuZ3RoO2krKyl7XG5cdCAgIGxldCBhdHRyID0gJC5tYXAobGluZXNbaV0udHJpbSgpLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uKHZhbCwgX2kpe3JldHVybiB2YWwudHJpbSgpO30pO1xuXHRcdGlmKGF0dHIubGVuZ3RoID4gMSkge1xuXHRcdFx0bGV0IGluZGkgPSB7XG5cdFx0XHRcdCdmYW1pZCc6IGF0dHJbMF0sXG5cdFx0XHRcdCdkaXNwbGF5X25hbWUnOiBhdHRyWzFdLFxuXHRcdFx0XHQnbmFtZSc6XHRhdHRyWzNdLFxuXHRcdFx0XHQnc2V4JzogYXR0cls2XSxcblx0XHRcdFx0J3N0YXR1cyc6IGF0dHJbOF1cblx0XHRcdH07XG5cdFx0XHRpZihhdHRyWzJdID09IDEpIGluZGkucHJvYmFuZCA9IHRydWU7XG5cdFx0XHRpZihhdHRyWzRdICE9PSBcIjBcIikgaW5kaS5mYXRoZXIgPSBhdHRyWzRdO1xuXHRcdFx0aWYoYXR0cls1XSAhPT0gXCIwXCIpIGluZGkubW90aGVyID0gYXR0cls1XTtcblx0XHRcdGlmKGF0dHJbN10gIT09IFwiMFwiKSBpbmRpLm16dHdpbiA9IGF0dHJbN107XG5cdFx0XHRpZihhdHRyWzldICE9PSBcIjBcIikgaW5kaS5hZ2UgPSBhdHRyWzldO1xuXHRcdFx0aWYoYXR0clsxMF0gIT09IFwiMFwiKSBpbmRpLnlvYiA9IGF0dHJbMTBdO1xuXG5cdFx0XHRsZXQgaWR4ID0gMTE7XG5cdFx0XHQkLmVhY2goY2FuY2VycywgZnVuY3Rpb24oY2FuY2VyLCBkaWFnbm9zaXNfYWdlKSB7XG5cdFx0XHRcdC8vIEFnZSBhdCAxc3QgY2FuY2VyIG9yIDAgPSB1bmFmZmVjdGVkLCBBVSA9IHVua25vd24gYWdlIGF0IGRpYWdub3NpcyAoYWZmZWN0ZWQgdW5rbm93bilcblx0XHRcdFx0aWYoYXR0cltpZHhdICE9PSBcIjBcIikge1xuXHRcdFx0XHRcdGluZGlbZGlhZ25vc2lzX2FnZV0gPSBhdHRyW2lkeF07XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYodmVyc2lvbiA9PT0gNCkge1xuXHRcdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdFx0Ly8gQlJDQTEsIEJSQ0EyLCBQQUxCMiwgQVRNLCBDSEVLMiBnZW5ldGljIHRlc3RzXG5cdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCB0eXBlLCAwID0gdW50ZXN0ZWQsIFMgPSBtdXRhdGlvbiBzZWFyY2gsIFQgPSBkaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCByZXN1bHQsIDAgPSB1bnRlc3RlZCwgUCA9IHBvc2l0aXZlLCBOID0gbmVnYXRpdmVcblx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8NTsgaisrKSB7XG5cdFx0XHRcdFx0aWR4Kz0yO1xuXHRcdFx0XHRcdGlmKGF0dHJbaWR4LTJdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRcdGlmKChhdHRyW2lkeC0yXSA9PT0gJ1MnIHx8IGF0dHJbaWR4LTJdID09PSAnVCcpICYmIChhdHRyW2lkeC0xXSA9PT0gJ1AnIHx8IGF0dHJbaWR4LTFdID09PSAnTicpKVxuXHRcdFx0XHRcdFx0XHRpbmRpW2dlbmV0aWNfdGVzdFtqXSArICdfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6IGF0dHJbaWR4LTFdfTtcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBhdHRyW2lkeC0yXSArIFwiIFwiICsgYXR0cltpZHgtMV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh2ZXJzaW9uID09PSAyKSB7XG5cdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCBCUkNBMSwgQlJDQTJcblx0XHRcdFx0Ly8gdHlwZSwgMCA9IHVudGVzdGVkLCBTID0gbXV0YXRpb24gc2VhcmNoLCBUID0gZGlyZWN0IGdlbmUgdGVzdFxuXHRcdFx0XHQvLyByZXN1bHQsIDAgPSB1bnRlc3RlZCwgTiA9IG5vIG11dGF0aW9uLCAxID0gQlJDQTEgcG9zaXRpdmUsIDIgPSBCUkNBMiBwb3NpdGl2ZSwgMyA9IEJSQ0ExLzIgcG9zaXRpdmVcblx0XHRcdFx0aWR4Kz0yOyBcdC8vIGd0ZXN0XG5cdFx0XHRcdGlmKGF0dHJbaWR4LTJdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZigoYXR0cltpZHgtMl0gPT09ICdTJyB8fCBhdHRyW2lkeC0yXSA9PT0gJ1QnKSkge1xuXHRcdFx0XHRcdFx0aWYoYXR0cltpZHgtMV0gPT09ICdOJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdOJ307XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoYXR0cltpZHgtMV0gPT09ICcxJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdOJ307XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoYXR0cltpZHgtMV0gPT09ICcyJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdQJ307XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYoYXR0cltpZHgtMV0gPT09ICczJykge1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMV9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdFx0aW5kaVsnYnJjYTJfZ2VuZV90ZXN0J10gPSB7J3R5cGUnOiBhdHRyW2lkeC0yXSwgJ3Jlc3VsdCc6ICdQJ307XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUud2FybignVU5SRUNPR05JU0VEIEdFTkUgVEVTVCBPTiBMSU5FICcrIChpKzEpICsgXCI6IFwiICsgYXR0cltpZHgtMl0gKyBcIiBcIiArIGF0dHJbaWR4LTFdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoYXR0cltpZHgrK10gIT09IFwiMFwiKSBpbmRpLmFzaGtlbmF6aSA9IDE7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHN0YXR1cywgMCA9IHVuc3BlY2lmaWVkLCBOID0gbmVnYXRpdmUsIFAgPSBwb3NpdGl2ZVxuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cGF0aG9sb2d5X3Rlc3RzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKGF0dHJbaWR4XSAhPT0gJzAnKSB7XG5cdFx0XHRcdFx0aWYoYXR0cltpZHhdID09PSAnTicgfHwgYXR0cltpZHhdID09PSAnUCcpXG5cdFx0XHRcdFx0XHRpbmRpW3BhdGhvbG9neV90ZXN0c1tqXSArICdfYmNfcGF0aG9sb2d5J10gPSBhdHRyW2lkeF07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgUEFUSE9MT0dZIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgK3BhdGhvbG9neV90ZXN0c1tqXSArIFwiIFwiICthdHRyW2lkeF0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fVxuXHRcdFx0cGVkLnVuc2hpZnQoaW5kaSk7XG5cdFx0fVxuXHR9XG5cblx0dHJ5IHtcblx0XHRyZXR1cm4gcHJvY2Vzc19wZWQocGVkKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRyZXR1cm4gcGVkO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NfcGVkKHBlZCkge1xuXHQvLyBmaW5kIHRoZSBsZXZlbCBvZiBpbmRpdmlkdWFscyBpbiB0aGUgcGVkaWdyZWVcblx0Zm9yKGxldCBqPTA7ajwyO2orKykge1xuXHRcdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRcdGdldExldmVsKHBlZCwgcGVkW2ldLm5hbWUpO1xuXHRcdH1cblx0fVxuXG5cdC8vIGZpbmQgdGhlIG1heCBsZXZlbCAoaS5lLiB0b3BfbGV2ZWwpXG5cdGxldCBtYXhfbGV2ZWwgPSAwO1xuXHRmb3IobGV0IGk9MDtpPHBlZC5sZW5ndGg7aSsrKSB7XG5cdFx0aWYocGVkW2ldLmxldmVsICYmIHBlZFtpXS5sZXZlbCA+IG1heF9sZXZlbClcblx0XHRcdG1heF9sZXZlbCA9IHBlZFtpXS5sZXZlbDtcblx0fVxuXG5cdC8vIGlkZW50aWZ5IHRvcF9sZXZlbCBhbmQgb3RoZXIgbm9kZXMgd2l0aG91dCBwYXJlbnRzXG5cdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRpZ3JlZV91dGlsLmdldERlcHRoKHBlZCwgcGVkW2ldLm5hbWUpID09IDEpIHtcblx0XHRcdGlmKHBlZFtpXS5sZXZlbCAmJiBwZWRbaV0ubGV2ZWwgPT0gbWF4X2xldmVsKSB7XG5cdFx0XHRcdHBlZFtpXS50b3BfbGV2ZWwgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGVkW2ldLm5vcGFyZW50cyA9IHRydWU7XG5cblx0XHRcdFx0Ly8gMS4gbG9vayBmb3IgcGFydG5lcnMgcGFyZW50c1xuXHRcdFx0XHRsZXQgcGlkeCA9IGdldFBhcnRuZXJJZHgocGVkLCBwZWRbaV0pO1xuXHRcdFx0XHRpZihwaWR4ID4gLTEpIHtcblx0XHRcdFx0XHRpZihwZWRbcGlkeF0ubW90aGVyKSB7XG5cdFx0XHRcdFx0XHRwZWRbaV0ubW90aGVyID0gcGVkW3BpZHhdLm1vdGhlcjtcblx0XHRcdFx0XHRcdHBlZFtpXS5mYXRoZXIgPSBwZWRbcGlkeF0uZmF0aGVyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIDIuIG9yIGFkb3B0IHBhcmVudHMgZnJvbSBsZXZlbCBhYm92ZVxuXHRcdFx0XHRpZighcGVkW2ldLm1vdGhlcil7XG5cdFx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8cGVkLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHRpZihwZWRbaV0ubGV2ZWwgPT0gKHBlZFtqXS5sZXZlbC0xKSkge1xuXHRcdFx0XHRcdFx0XHRwaWR4ID0gZ2V0UGFydG5lcklkeChwZWQsIHBlZFtqXSk7XG5cdFx0XHRcdFx0XHRcdGlmKHBpZHggPiAtMSkge1xuXHRcdFx0XHRcdFx0XHRcdHBlZFtpXS5tb3RoZXIgPSAocGVkW2pdLnNleCA9PT0gJ0YnID8gcGVkW2pdLm5hbWUgOiBwZWRbcGlkeF0ubmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0cGVkW2ldLmZhdGhlciA9IChwZWRbal0uc2V4ID09PSAnTScgPyBwZWRbal0ubmFtZSA6IHBlZFtwaWR4XS5uYW1lKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVkW2ldLnRvcF9sZXZlbDtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHBlZDtcbn1cblxuLy8gZ2V0IHRoZSBwYXJ0bmVycyBmb3IgYSBnaXZlbiBub2RlXG5mdW5jdGlvbiBnZXRQYXJ0bmVySWR4KGRhdGFzZXQsIGFub2RlKSB7XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgYm5vZGUgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGFub2RlLm5hbWUgPT09IGJub2RlLm1vdGhlcilcblx0XHRcdHJldHVybiBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBibm9kZS5mYXRoZXIpO1xuXHRcdGVsc2UgaWYoYW5vZGUubmFtZSA9PT0gYm5vZGUuZmF0aGVyKVxuXHRcdFx0cmV0dXJuIHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGJub2RlLm1vdGhlcik7XG5cdH1cblx0cmV0dXJuIC0xO1xufVxuXG4vLyBmb3IgYSBnaXZlbiBpbmRpdmlkdWFsIGFzc2lnbiBsZXZlbHMgdG8gYSBwYXJlbnRzIGFuY2VzdG9yc1xuZnVuY3Rpb24gZ2V0TGV2ZWwoZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgaWR4ID0gcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbmFtZSk7XG5cdGxldCBsZXZlbCA9IChkYXRhc2V0W2lkeF0ubGV2ZWwgPyBkYXRhc2V0W2lkeF0ubGV2ZWwgOiAwKTtcblx0dXBkYXRlX3BhcmVudHNfbGV2ZWwoaWR4LCBsZXZlbCwgZGF0YXNldCk7XG59XG5cbi8vIHJlY3Vyc2l2ZWx5IHVwZGF0ZSBwYXJlbnRzIGxldmVsc1xuZnVuY3Rpb24gdXBkYXRlX3BhcmVudHNfbGV2ZWwoaWR4LCBsZXZlbCwgZGF0YXNldCkge1xuXHRsZXQgcGFyZW50cyA9IFsnbW90aGVyJywgJ2ZhdGhlciddO1xuXHRsZXZlbCsrO1xuXHRmb3IobGV0IGk9MDsgaTxwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IHBpZHggPSBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2lkeF1bcGFyZW50c1tpXV0pO1xuXHRcdGlmKHBpZHggPj0gMCkge1xuXHRcdFx0bGV0IG1hID0gZGF0YXNldFtwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2lkeF0ubW90aGVyKV07XG5cdFx0XHRsZXQgcGEgPSBkYXRhc2V0W3BlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XS5mYXRoZXIpXTtcblx0XHRcdGlmKCFkYXRhc2V0W3BpZHhdLmxldmVsIHx8IGRhdGFzZXRbcGlkeF0ubGV2ZWwgPCBsZXZlbCkge1xuXHRcdFx0XHRtYS5sZXZlbCA9IGxldmVsO1xuXHRcdFx0XHRwYS5sZXZlbCA9IGxldmVsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihtYS5sZXZlbCA8IHBhLmxldmVsKSB7XG5cdFx0XHRcdG1hLmxldmVsID0gcGEubGV2ZWw7XG5cdFx0XHR9IGVsc2UgaWYocGEubGV2ZWwgPCBtYS5sZXZlbCkge1xuXHRcdFx0XHRwYS5sZXZlbCA9IG1hLmxldmVsO1xuXHRcdFx0fVxuXHRcdFx0dXBkYXRlX3BhcmVudHNfbGV2ZWwocGlkeCwgbGV2ZWwsIGRhdGFzZXQpO1xuXHRcdH1cblx0fVxufVxuIiwiLy8gcGVkaWdyZWUgZm9ybVxuaW1wb3J0IHtyZWJ1aWxkLCBzeW5jVHdpbnN9IGZyb20gJy4vcGVkaWdyZWUuanMnO1xuaW1wb3J0IHtjb3B5X2RhdGFzZXQsIGdldE5vZGVCeU5hbWV9IGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0IHtjdXJyZW50IGFzIHBlZGNhY2hlX2N1cnJlbnR9IGZyb20gJy4vcGVkY2FjaGUuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlKG9wdHMpIHtcblx0JCgnLm5vZGVfc2F2ZScpLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdHNhdmUob3B0cyk7XG5cdH0pO1xuXG5cdC8vIGFkdmFuY2VkIG9wdGlvbnMgLSBtb2RlbCBwYXJhbWV0ZXJzXG5cdCQoXCJpbnB1dFtpZCQ9J19tdXRfc2Vuc2l0aXZpdHknXSwgaW5wdXRbaWQkPSdfbXV0X2ZyZXF1ZW5jeSddXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG5cdCQoJyNpZF91c2VfY3VzdG9tX211dGF0aW9uX3NlbnNpdGl2aXRpZXMnKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0JChcImlucHV0W2lkJD0nX211dF9zZW5zaXRpdml0eSddXCIpLnByb3AoJ2Rpc2FibGVkJywgISQodGhpcykuaXMoXCI6Y2hlY2tlZFwiKSk7XG5cdH0pO1xuXG5cdCQoJyNpZF9tdXRhdGlvbl9mcmVxdWVuY2llcycpLmNoYW5nZShmdW5jdGlvbigpIHtcblx0XHQkKFwiaW5wdXRbaWQkPSdfbXV0X2ZyZXF1ZW5jeSddXCIpLnByb3AoJ2Rpc2FibGVkJywgKHRoaXMudmFsdWUgIT09ICdDdXN0b20nKSk7XG5cdFx0Ly8gbm90ZSBwZWRpZ3JlZV9mb3JtLm11dGF0aW9uX2ZyZXF1ZW5jaWVzIGlzIHNldCBpbiB0aGUgdmlldyBzZWUgcGVkaWdyZWVfc2VjdGlvbl9qcy5odG1sXG5cdFx0aWYocGVkaWdyZWVfZm9ybS5iY19tdXRhdGlvbl9mcmVxdWVuY2llcyAmJiB0aGlzLnZhbHVlICE9PSAnQ3VzdG9tJykge1xuXHRcdFx0bGV0IGJjbWZyZXEgPSBwZWRpZ3JlZV9mb3JtLmJjX211dGF0aW9uX2ZyZXF1ZW5jaWVzW3RoaXMudmFsdWVdO1xuXHRcdFx0Zm9yIChsZXQgZ2VuZSBpbiBiY21mcmVxKVxuXHRcdFx0XHQkKCcjaWRfJytnZW5lLnRvTG93ZXJDYXNlKCkrJ19iY19tdXRfZnJlcXVlbmN5JykudmFsKGJjbWZyZXFbZ2VuZV0pO1xuXG5cdFx0XHRsZXQgb2JjbWZyZXEgPSBwZWRpZ3JlZV9mb3JtLm9jX211dGF0aW9uX2ZyZXF1ZW5jaWVzW3RoaXMudmFsdWVdO1xuXHRcdFx0Zm9yIChsZXQgZ2VuZSBpbiBvYmNtZnJlcSlcblx0XHRcdFx0JCgnI2lkXycrZ2VuZS50b0xvd2VyQ2FzZSgpKydfb2NfbXV0X2ZyZXF1ZW5jeScpLnZhbChvYmNtZnJlcVtnZW5lXSk7XG5cdFx0fVxuXG5cdFx0aWYodGhpcy52YWx1ZSA9PT0gJ0FzaGtlbmF6aScpIHsgIC8vIHVwZGF0ZSBjYW5yaXNrIEZIIHJhZGlvIHNldHRpbmdzXG5cdFx0XHQkKCcjb3JpZ19hc2hrJykucHJvcCggXCJjaGVja2VkXCIsIHRydWUgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JCgnI29yaWdfdW5rJykucHJvcCggXCJjaGVja2VkXCIsIHRydWUgKTtcblx0XHR9XG5cdFx0c2F2ZV9hc2hrbihvcHRzKTsgLy8gc2F2ZSBhc2hrZW5hemkgdXBkYXRlc1xuXHR9KTtcbn1cblxuLy8gaGFuZGxlIGZhbWlseSBoaXN0b3J5IGNoYW5nZSBldmVudHMgKHVuZG8vcmVkby9kZWxldGUpXG4kKGRvY3VtZW50KS5vbignZmhDaGFuZ2UnLCBmdW5jdGlvbihlLCBvcHRzKXtcblx0dHJ5IHtcblx0XHRsZXQgaWQgPSAkKCcjaWRfbmFtZScpLnZhbCgpOyAgLy8gZ2V0IG5hbWUgZnJvbSBoaWRkZW4gZmllbGRcblx0XHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUocGVkY2FjaGVfY3VycmVudChvcHRzKSwgaWQpXG5cdFx0aWYobm9kZSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0JCgnZm9ybSA+IGZpZWxkc2V0JykucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuXHRcdGVsc2Vcblx0XHRcdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHR9IGNhdGNoKGVycikge1xuXHRcdGNvbnNvbGUud2FybihlcnIpO1xuXHR9XG59KVxuXG4vLyB1cGRhdGUgc3RhdHVzIGZpZWxkIGFuZCBhZ2UgbGFiZWwgLSAwID0gYWxpdmUsIDEgPSBkZWFkXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3RhdHVzKHN0YXR1cykge1xuXHQkKCcjYWdlX3lvYl9sb2NrJykucmVtb3ZlQ2xhc3MoJ2ZhLWxvY2sgZmEtdW5sb2NrLWFsdCcpO1xuXHQoc3RhdHVzID09IDEgPyAkKCcjYWdlX3lvYl9sb2NrJykuYWRkQ2xhc3MoJ2ZhLXVubG9jay1hbHQnKSA6ICQoJyNhZ2VfeW9iX2xvY2snKS5hZGRDbGFzcygnZmEtbG9jaycpKTtcblx0JCgnI2lkX2FnZV8nK3N0YXR1cykucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG5cdCQoJyNpZF9hZ2VfJysoc3RhdHVzID09IDEgPyAnMCcgOiAnMScpKS5hZGRDbGFzcyhcImhpZGRlblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVjbGljayhub2RlKSB7XG5cdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHQvLyBjbGVhciB2YWx1ZXNcblx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZChcImlucHV0W3R5cGU9dGV4dF0sIGlucHV0W3R5cGU9bnVtYmVyXVwiKS52YWwoXCJcIik7XG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3QnKS52YWwoJycpLnByb3AoJ3NlbGVjdGVkJywgdHJ1ZSk7XG5cblx0Ly8gYXNzaWduIHZhbHVlcyB0byBpbnB1dCBmaWVsZHMgaW4gZm9ybVxuXHRpZihub2RlLnNleCA9PT0gJ00nIHx8IG5vZGUuc2V4ID09PSAnRicpXG5cdFx0JCgnaW5wdXRbbmFtZT1zZXhdW3ZhbHVlPVwiJytub2RlLnNleCsnXCJdJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuXHRlbHNlXG5cdFx0JCgnaW5wdXRbbmFtZT1zZXhdJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0dXBkYXRlX2NhbmNlcl9ieV9zZXgobm9kZSk7XG5cblx0aWYoISgnc3RhdHVzJyBpbiBub2RlKSlcblx0XHRub2RlLnN0YXR1cyA9IDA7XG5cdCQoJ2lucHV0W25hbWU9c3RhdHVzXVt2YWx1ZT1cIicrbm9kZS5zdGF0dXMrJ1wiXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcblx0Ly8gc2hvdyBsb2NrIHN5bWJvbCBmb3IgYWdlIGFuZCB5b2Igc3luY2hyb25pc2F0aW9uXG5cdHVwZGF0ZVN0YXR1cyhub2RlLnN0YXR1cyk7XG5cblx0aWYoJ3Byb2JhbmQnIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoJ2NoZWNrZWQnLCBub2RlLnByb2JhbmQpO1xuXHRcdCQoJyNpZF9wcm9iYW5kJykucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF9wcm9iYW5kJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCAhKCd5b2InIGluIG5vZGUpKVxuXHR9XG5cblx0aWYoJ2V4Y2x1ZGUnIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfZXhjbHVkZScpLnByb3AoJ2NoZWNrZWQnLCBub2RlLmV4Y2x1ZGUpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF9leGNsdWRlJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0fVxuXG4vKlx0XHRpZignYXNoa2VuYXppJyBpbiBub2RlKSB7XG5cdFx0XHQkKCcjaWRfYXNoa2VuYXppJykucHJvcCgnY2hlY2tlZCcsIChub2RlLnByb2JhbmQgPT0gMSA/IHRydWU6IGZhbHNlKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQoJyNpZF9hc2hrZW5hemknKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xuXHRcdH0qL1xuXG5cdC8vIHllYXIgb2YgYmlydGhcblx0aWYoJ3lvYicgaW4gbm9kZSkge1xuXHRcdCQoJyNpZF95b2JfMCcpLnZhbChub2RlLnlvYik7XG5cdH0gZWxzZSB7XG5cdFx0JCgnI2lkX3lvYl8wJykudmFsKCctJyk7XG5cdH1cblxuXHQvLyBjbGVhciBwYXRob2xvZ3lcblx0JCgnc2VsZWN0W25hbWUkPVwiX2JjX3BhdGhvbG9neVwiXScpLnZhbCgnLScpO1xuXHQvLyBjbGVhciBnZW5lIHRlc3RzXG5cdCQoJ3NlbGVjdFtuYW1lKj1cIl9nZW5lX3Rlc3RcIl0nKS52YWwoJy0nKTtcblxuXHQvLyBkaXNhYmxlIHNleCByYWRpbyBidXR0b25zIGlmIHRoZSBwZXJzb24gaGFzIGEgcGFydG5lclxuXHQkKFwiaW5wdXRbaWRePSdpZF9zZXhfJ11cIikucHJvcChcImRpc2FibGVkXCIsIChub2RlLnBhcmVudF9ub2RlICYmIG5vZGUuc2V4ICE9PSAnVScgPyB0cnVlIDogZmFsc2UpKTtcblxuXHQvLyBkaXNhYmxlIHBhdGhvbG9neSBmb3IgbWFsZSByZWxhdGl2ZXMgKGFzIG5vdCB1c2VkIGJ5IG1vZGVsKVxuXHQvLyBhbmQgaWYgbm8gYnJlYXN0IGNhbmNlciBhZ2Ugb2YgZGlhZ25vc2lzXG5cdCQoXCJzZWxlY3RbaWQkPSdfYmNfcGF0aG9sb2d5J11cIikucHJvcChcImRpc2FibGVkXCIsXG5cdFx0XHQobm9kZS5zZXggPT09ICdNJyB8fCAobm9kZS5zZXggPT09ICdGJyAmJiAhKCdicmVhc3RfY2FuY2VyX2RpYWdub3Npc19hZ2UnIGluIG5vZGUpKSA/IHRydWUgOiBmYWxzZSkpO1xuXG5cdC8vIGFwcHJveGltYXRlIGRpYWdub3NpcyBhZ2Vcblx0JCgnI2lkX2FwcHJveCcpLnByb3AoJ2NoZWNrZWQnLCAobm9kZS5hcHByb3hfZGlhZ25vc2lzX2FnZSA/IHRydWU6IGZhbHNlKSk7XG5cdHVwZGF0ZV9kaWFnbm9zaXNfYWdlX3dpZGdldCgpO1xuXG5cdGZvcihsZXQga2V5IGluIG5vZGUpIHtcblx0XHRpZihrZXkgIT09ICdwcm9iYW5kJyAmJiBrZXkgIT09ICdzZXgnKSB7XG5cdFx0XHRpZigkKCcjaWRfJytrZXkpLmxlbmd0aCkge1x0Ly8gaW5wdXQgdmFsdWVcblx0XHRcdFx0aWYoa2V5LmluZGV4T2YoJ19nZW5lX3Rlc3QnKSAgIT09IC0xICYmIG5vZGVba2V5XSAhPT0gbnVsbCAmJiB0eXBlb2Ygbm9kZVtrZXldID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSkudmFsKG5vZGVba2V5XS50eXBlKTtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkrJ19yZXN1bHQnKS52YWwobm9kZVtrZXldLnJlc3VsdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KS52YWwobm9kZVtrZXldKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKGtleS5pbmRleE9mKCdfZGlhZ25vc2lzX2FnZScpICE9PSAtMSkge1xuXHRcdFx0XHRpZigkKFwiI2lkX2FwcHJveFwiKS5pcygnOmNoZWNrZWQnKSkge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSsnXzEnKS52YWwocm91bmQ1KG5vZGVba2V5XSkpLnByb3AoJ3NlbGVjdGVkJywgdHJ1ZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KydfMCcpLnZhbChub2RlW2tleV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dHJ5IHtcblx0XHQkKCcjcGVyc29uX2RldGFpbHMnKS5maW5kKCdmb3JtJykudmFsaWQoKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oJ3ZhbGlkKCkgbm90IGZvdW5kJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlX2FzaGtuKG5ld2RhdGFzZXQpIHtcblx0Ly8gQXNoa2VuYXppIHN0YXR1cywgMCA9IG5vdCBBc2hrZW5hemksIDEgPSBBc2hrZW5hemlcblx0aWYoJCgnI29yaWdfYXNoaycpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0JC5lYWNoKG5ld2RhdGFzZXQsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRcdGlmKHAucHJvYmFuZClcblx0XHRcdFx0cC5hc2hrZW5hemkgPSAxO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdCQuZWFjaChuZXdkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRkZWxldGUgcC5hc2hrZW5hemk7XG5cdFx0fSk7XG5cdH1cbn1cblxuLy8gU2F2ZSBBc2hrZW5hemkgc3RhdHVzXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9hc2hrbihvcHRzKSB7XG5cdGxldCBkYXRhc2V0ID0gcGVkY2FjaGVfY3VycmVudChvcHRzKTtcblx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KTtcblx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0cmVidWlsZChvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmUob3B0cykge1xuXHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdGxldCBuYW1lID0gJCgnI2lkX25hbWUnKS52YWwoKTtcblx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdGxldCBwZXJzb24gPSBnZXROb2RlQnlOYW1lKG5ld2RhdGFzZXQsIG5hbWUpO1xuXHRpZighcGVyc29uKSB7XG5cdFx0Y29uc29sZS53YXJuKCdwZXJzb24gbm90IGZvdW5kIHdoZW4gc2F2aW5nIGRldGFpbHMnKTtcblx0XHRyZXR1cm47XG5cdH1cblx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblxuXHQvLyBpbmRpdmlkdWFsJ3MgcGVyc29uYWwgYW5kIGNsaW5pY2FsIGRldGFpbHNcblx0bGV0IHlvYiA9ICQoJyNpZF95b2JfMCcpLnZhbCgpO1xuXHRpZih5b2IgJiYgeW9iICE9PSAnJykge1xuXHRcdHBlcnNvbi55b2IgPSB5b2I7XG5cdH0gZWxzZSB7XG5cdFx0ZGVsZXRlIHBlcnNvbi55b2I7XG5cdH1cblxuXHQvLyBjdXJyZW50IHN0YXR1czogMCA9IGFsaXZlLCAxID0gZGVhZFxuXHRsZXQgc3RhdHVzID0gJCgnI2lkX3N0YXR1cycpLmZpbmQoXCJpbnB1dFt0eXBlPSdyYWRpbyddOmNoZWNrZWRcIik7XG5cdGlmKHN0YXR1cy5sZW5ndGggPiAwKXtcblx0XHRwZXJzb24uc3RhdHVzID0gc3RhdHVzLnZhbCgpO1xuXHR9XG5cblx0Ly8gYm9vbGVhbnMgc3dpdGNoZXNcblx0bGV0IHN3aXRjaGVzID0gW1wibWlzY2FycmlhZ2VcIiwgXCJhZG9wdGVkX2luXCIsIFwiYWRvcHRlZF9vdXRcIiwgXCJ0ZXJtaW5hdGlvblwiLCBcInN0aWxsYmlydGhcIl07XG5cdGZvcihsZXQgaXN3aXRjaD0wOyBpc3dpdGNoPHN3aXRjaGVzLmxlbmd0aDsgaXN3aXRjaCsrKXtcblx0XHRsZXQgYXR0ciA9IHN3aXRjaGVzW2lzd2l0Y2hdO1xuXHRcdGxldCBzID0gJCgnI2lkXycrYXR0cik7XG5cdFx0aWYocy5sZW5ndGggPiAwKXtcblx0XHRcdGNvbnNvbGUubG9nKHMuaXMoXCI6Y2hlY2tlZFwiKSk7XG5cdFx0XHRpZihzLmlzKFwiOmNoZWNrZWRcIikpXG5cdFx0XHRcdHBlcnNvblthdHRyXSA9IHRydWU7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGRlbGV0ZSBwZXJzb25bYXR0cl07XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3VycmVudCBzZXhcblx0bGV0IHNleCA9ICQoJyNpZF9zZXgnKS5maW5kKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIpO1xuXHRpZihzZXgubGVuZ3RoID4gMCl7XG5cdFx0cGVyc29uLnNleCA9IHNleC52YWwoKTtcblx0XHR1cGRhdGVfY2FuY2VyX2J5X3NleChwZXJzb24pO1xuXHR9XG5cblx0Ly8gQXNoa2VuYXppIHN0YXR1cywgMCA9IG5vdCBBc2hrZW5hemksIDEgPSBBc2hrZW5hemlcblx0dXBkYXRlX2FzaGtuKG5ld2RhdGFzZXQpO1xuXG5cdGlmKCQoJyNpZF9hcHByb3gnKS5pcygnOmNoZWNrZWQnKSkgLy8gYXBwcm94aW1hdGUgZGlhZ25vc2lzIGFnZVxuXHRcdHBlcnNvbi5hcHByb3hfZGlhZ25vc2lzX2FnZSA9IHRydWU7XG5cdGVsc2Vcblx0XHRkZWxldGUgcGVyc29uLmFwcHJveF9kaWFnbm9zaXNfYWdlO1xuXG5cdCQoXCIjcGVyc29uX2RldGFpbHMgc2VsZWN0W25hbWUqPSdfZGlhZ25vc2lzX2FnZSddOnZpc2libGUsICNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPXRleHRdOnZpc2libGUsICNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPW51bWJlcl06dmlzaWJsZVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdGxldCBuYW1lID0gKHRoaXMubmFtZS5pbmRleE9mKFwiX2RpYWdub3Npc19hZ2VcIik+LTEgPyB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGgtMik6IHRoaXMubmFtZSk7XG5cblx0XHRpZigkKHRoaXMpLnZhbCgpKSB7XG5cdFx0XHRsZXQgdmFsID0gJCh0aGlzKS52YWwoKTtcblx0XHRcdGlmKG5hbWUuaW5kZXhPZihcIl9kaWFnbm9zaXNfYWdlXCIpID4gLTEgJiYgJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpXG5cdFx0XHRcdHZhbCA9IHJvdW5kNSh2YWwpO1xuXHRcdFx0cGVyc29uW25hbWVdID0gdmFsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uW25hbWVdO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gY2FuY2VyIGNoZWNrYm94ZXNcblx0JCgnI3BlcnNvbl9kZXRhaWxzIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lJD1cImNhbmNlclwiXSxpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZSQ9XCJjYW5jZXIyXCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLmNoZWNrZWQpXG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0gdHJ1ZTtcblx0XHRlbHNlXG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0fSk7XG5cblx0Ly8gcGF0aG9sb2d5IHRlc3RzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3RbbmFtZSQ9XCJfYmNfcGF0aG9sb2d5XCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZigkKHRoaXMpLnZhbCgpICE9PSAnLScpIHtcblx0XHRcdHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV0gPSAkKHRoaXMpLnZhbCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGdlbmV0aWMgdGVzdHNcblx0JCgnI3BlcnNvbl9kZXRhaWxzIHNlbGVjdFtuYW1lJD1cIl9nZW5lX3Rlc3RcIl0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdGlmKCQodGhpcykudmFsKCkgIT09ICctJykge1xuXHRcdFx0bGV0IHRyZXMgPSAkKCdzZWxlY3RbbmFtZT1cIicrJCh0aGlzKS5hdHRyKCduYW1lJykrJ19yZXN1bHRcIl0nKTtcblx0XHRcdHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV0gPSB7J3R5cGUnOiAkKHRoaXMpLnZhbCgpLCAncmVzdWx0JzogJCh0cmVzKS52YWwoKX07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSBwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldO1xuXHRcdH1cblx0fSk7XG5cblx0dHJ5IHtcblx0XHQkKCcjcGVyc29uX2RldGFpbHMnKS5maW5kKCdmb3JtJykudmFsaWQoKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oJ3ZhbGlkKCkgbm90IGZvdW5kJyk7XG5cdH1cblxuXHRzeW5jVHdpbnMobmV3ZGF0YXNldCwgcGVyc29uKTtcblx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0cmVidWlsZChvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZV9kaWFnbm9zaXNfYWdlX3dpZGdldCgpIHtcblx0aWYoJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpIHtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLmVhY2goZnVuY3Rpb24oIF9pICkge1xuXHRcdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcblx0XHRcdFx0bGV0IG5hbWUgPSB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGgtMik7XG5cdFx0XHRcdCQoXCIjaWRfXCIrbmFtZStcIl8xXCIpLnZhbChyb3VuZDUoJCh0aGlzKS52YWwoKSkpLnByb3AoJ3NlbGVjdGVkJywgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLmhpZGUoKTtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLnNob3coKTtcblx0fSBlbHNlIHtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLmVhY2goZnVuY3Rpb24oIF9pICkge1xuXHRcdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcblx0XHRcdFx0bGV0IG5hbWUgPSB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGgtMik7XG5cdFx0XHRcdCQoXCIjaWRfXCIrbmFtZStcIl8wXCIpLnZhbCgkKHRoaXMpLnZhbCgpKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCQoXCJbaWQkPSdfZGlhZ25vc2lzX2FnZV8wJ11cIikuc2hvdygpO1xuXHRcdCQoXCJbaWQkPSdfZGlhZ25vc2lzX2FnZV8xJ11cIikuaGlkZSgpO1xuXHR9XG59XG5cbi8vIG1hbGVzIHNob3VsZCBub3QgaGF2ZSBvdmFyaWFuIGNhbmNlciBhbmQgZmVtYWxlcyBzaG91bGQgbm90IGhhdmUgcHJvc3RhdGUgY2FuY2VyXG5mdW5jdGlvbiB1cGRhdGVfY2FuY2VyX2J5X3NleChub2RlKSB7XG5cdCQoJyNjYW5jZXIgLnJvdycpLnNob3coKTtcblx0aWYobm9kZS5zZXggPT09ICdNJykge1xuXHRcdGRlbGV0ZSBub2RlLm92YXJpYW5fY2FuY2VyX2RpYWdub3Npc19hZ2U7XG5cdFx0JChcIltpZF49J2lkX292YXJpYW5fY2FuY2VyX2RpYWdub3Npc19hZ2UnXVwiKS5jbG9zZXN0KCcucm93JykuaGlkZSgpO1xuXHRcdCQoXCJbaWRePSdpZF9icmVhc3RfY2FuY2VyMl9kaWFnbm9zaXNfYWdlJ11cIikucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblx0fSBlbHNlIGlmKG5vZGUuc2V4ID09PSAnRicpIHtcblx0XHRkZWxldGUgbm9kZS5wcm9zdGF0ZV9jYW5jZXJfZGlhZ25vc2lzX2FnZTtcblx0XHQkKFwiW2lkXj0naWRfcHJvc3RhdGVfY2FuY2VyX2RpYWdub3Npc19hZ2UnXVwiKS5jbG9zZXN0KCcucm93JykuaGlkZSgpO1xuXHRcdCQoXCJbaWRePSdpZF9icmVhc3RfY2FuY2VyMl9kaWFnbm9zaXNfYWdlJ11cIikucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG5cdH1cbn1cblxuLy8gcm91bmQgdG8gNSwgMTUsIDI1LCAzNSAuLi4uXG5mdW5jdGlvbiByb3VuZDUoeDEpIHtcblx0bGV0IHgyID0gKE1hdGgucm91bmQoKHgxLTEpIC8gMTApICogMTApO1xuXHRyZXR1cm4gKHgxIDwgeDIgPyB4MiAtIDUgOiB4MiArIDUpO1xufVxuXG4iLCIvLyBwZWRpZ3JlZSB3aWRnZXRzXG5pbXBvcnQge2FkZHNpYmxpbmcsIGFkZGNoaWxkLCBhZGRwYXJlbnRzLCBhZGRwYXJ0bmVyLCByZWJ1aWxkLCBkZWxldGVfbm9kZV9kYXRhc2V0fSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Y29weV9kYXRhc2V0LCBtYWtlaWQsIGdldElkeEJ5TmFtZX0gZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5pbXBvcnQge3NhdmUsIHVwZGF0ZX0gZnJvbSAnLi9wZWRpZ3JlZV9mb3JtLmpzJztcbmltcG9ydCB7Y3VycmVudCBhcyBwZWRjYWNoZV9jdXJyZW50fSBmcm9tICcuL3BlZGNhY2hlLmpzJztcblxubGV0IGRyYWdnaW5nO1xubGV0IGxhc3RfbW91c2VvdmVyO1xuLy9cbi8vIEFkZCB3aWRnZXRzIHRvIG5vZGVzIGFuZCBiaW5kIGV2ZW50c1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFdpZGdldHMob3B0cywgbm9kZSkge1xuXG5cdC8vIHBvcHVwIGdlbmRlciBzZWxlY3Rpb24gYm94XG5cdGxldCBmb250X3NpemUgPSBwYXJzZUludCgkKFwiYm9keVwiKS5jc3MoJ2ZvbnQtc2l6ZScpKTtcblx0bGV0IHBvcHVwX3NlbGVjdGlvbiA9IGQzLnNlbGVjdCgnLmRpYWdyYW0nKTtcblx0cG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uXCIpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwicnhcIiwgNilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJyeVwiLCA2KVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdFx0XHRcdFx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwid2lkdGhcIiwgIGZvbnRfc2l6ZSo3LjkpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwiaGVpZ2h0XCIsIGZvbnRfc2l6ZSoyKVxuXHRcdFx0XHRcdFx0XHQuc3R5bGUoXCJzdHJva2VcIiwgXCJkYXJrZ3JleVwiKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcImZpbGxcIiwgXCJ3aGl0ZVwiKTtcblxuXHRsZXQgc3F1YXJlID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIG1hbGVcblx0XHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cignZm9udC1zaXplJywgJzEuZW0nIClcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLWxnIGZhLXNxdWFyZSBwZXJzb250eXBlXCIpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHQuYXR0cihcInhcIiwgZm9udF9zaXplLzMpXG5cdFx0LmF0dHIoXCJ5XCIsIGZvbnRfc2l6ZSoxLjUpXG5cdFx0LnRleHQoXCJcXHVmMDk2IFwiKTtcblx0bGV0IHNxdWFyZV90aXRsZSA9IHNxdWFyZS5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCBtYWxlXCIpO1xuXG5cdGxldCBjaXJjbGUgPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gZmVtYWxlXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoJ2ZvbnQtc2l6ZScsICcxLmVtJyApXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS1jaXJjbGUgcGVyc29udHlwZVwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSoxLjcpXG5cdFx0LmF0dHIoXCJ5XCIsIGZvbnRfc2l6ZSoxLjUpXG5cdFx0LnRleHQoXCJcXHVmMTBjIFwiKTtcblx0bGV0IGNpcmNsZV90aXRsZSA9IGNpcmNsZS5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCBmZW1hbGVcIik7XG5cblx0bGV0IHVuc3BlY2lmaWVkID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIHVuc3BlY2lmaWVkXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoJ2ZvbnQtc2l6ZScsICcxLmVtJyApXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLWxnIGZhLXVuc3BlY2lmaWVkIHBvcHVwX3NlbGVjdGlvbl9yb3RhdGU0NSBwZXJzb250eXBlXCIpXG5cdFx0LnRleHQoXCJcXHVmMDk2IFwiKTtcblx0dW5zcGVjaWZpZWQuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgdW5zcGVjaWZpZWRcIik7XG5cblx0bGV0IGR6dHdpbiA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBkaXp5Z290aWMgdHdpbnNcblx0XHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtMnggZmEtYW5nbGUtdXAgcGVyc29udHlwZSBkenR3aW5cIilcblx0XHQuYXR0cihcInhcIiwgZm9udF9zaXplKjQuNilcblx0XHQuYXR0cihcInlcIiwgZm9udF9zaXplKjEuNSlcblx0XHQudGV4dChcIlxcdWYxMDYgXCIpO1xuXHRkenR3aW4uYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgZGl6eWdvdGljL2ZyYXRlcm5hbCB0d2luc1wiKTtcblxuXHRsZXQgbXp0d2luID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIG1vbm96eWdvdGljIHR3aW5zXG5cdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS0yeCBmYS1jYXJldC11cCBwZXJzb250eXBlIG16dHdpblwiKVxuXHQuYXR0cihcInhcIiwgZm9udF9zaXplKjYuMilcblx0LmF0dHIoXCJ5XCIsIGZvbnRfc2l6ZSoxLjUpXG5cdC50ZXh0KFwiXFx1ZjBkOFwiKTtcblx0bXp0d2luLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIG1vbm96eWdvdGljL2lkZW50aWNhbCB0d2luc1wiKTtcblxuXHRsZXQgYWRkX3BlcnNvbiA9IHt9O1xuXHQvLyBjbGljayB0aGUgcGVyc29uIHR5cGUgc2VsZWN0aW9uXG5cdGQzLnNlbGVjdEFsbChcIi5wZXJzb250eXBlXCIpXG5cdCAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuXHRcdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlX2N1cnJlbnQob3B0cykpO1xuXHRcdGxldCBtenR3aW4gPSBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcIm16dHdpblwiKTtcblx0XHRsZXQgZHp0d2luID0gZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJkenR3aW5cIik7XG5cdFx0bGV0IHR3aW5fdHlwZTtcblx0XHRsZXQgc2V4O1xuXHRcdGlmKG16dHdpbiB8fCBkenR3aW4pIHtcblx0XHRcdHNleCA9IGFkZF9wZXJzb24ubm9kZS5kYXR1bSgpLmRhdGEuc2V4O1xuXHRcdFx0dHdpbl90eXBlID0gKG16dHdpbiA/IFwibXp0d2luXCIgOiBcImR6dHdpblwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2V4ID0gZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJmYS1zcXVhcmVcIikgPyAnTScgOiAoZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJmYS1jaXJjbGVcIikgPyAnRicgOiAnVScpO1xuXHRcdH1cblxuXHRcdGlmKGFkZF9wZXJzb24udHlwZSA9PT0gJ2FkZHNpYmxpbmcnKVxuXHRcdFx0YWRkc2libGluZyhuZXdkYXRhc2V0LCBhZGRfcGVyc29uLm5vZGUuZGF0dW0oKS5kYXRhLCBzZXgsIGZhbHNlLCB0d2luX3R5cGUpO1xuXHRcdGVsc2UgaWYoYWRkX3BlcnNvbi50eXBlID09PSAnYWRkY2hpbGQnKVxuXHRcdFx0YWRkY2hpbGQobmV3ZGF0YXNldCwgYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkuZGF0YSwgKHR3aW5fdHlwZSA/ICdVJyA6IHNleCksICh0d2luX3R5cGUgPyAyIDogMSksIHR3aW5fdHlwZSk7XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuO1xuXHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdFx0cmVidWlsZChvcHRzKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0YWRkX3BlcnNvbiA9IHt9O1xuXHQgIH0pXG5cdCAgLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdCAgaWYoYWRkX3BlcnNvbi5ub2RlKVxuXHRcdFx0ICBhZGRfcGVyc29uLm5vZGUuc2VsZWN0KCdyZWN0Jykuc3R5bGUoXCJvcGFjaXR5XCIsIDAuMik7XG5cdFx0ICBkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG5cdFx0ICAvLyBhZGQgdG9vbHRpcHMgdG8gZm9udCBhd2Vzb21lIHdpZGdldHNcblx0XHQgIGlmKGFkZF9wZXJzb24udHlwZSA9PT0gJ2FkZHNpYmxpbmcnKXtcblx0XHRcdCBpZihkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImZhLXNxdWFyZVwiKSlcblx0XHRcdFx0ICBzcXVhcmVfdGl0bGUudGV4dChcImFkZCBicm90aGVyXCIpO1xuXHRcdFx0ICBlbHNlXG5cdFx0XHRcdCAgY2lyY2xlX3RpdGxlLnRleHQoXCJhZGQgc2lzdGVyXCIpO1xuXHRcdCAgfSBlbHNlIGlmKGFkZF9wZXJzb24udHlwZSA9PT0gJ2FkZGNoaWxkJyl7XG5cdFx0XHQgIGlmKGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtc3F1YXJlXCIpKVxuXHRcdFx0XHQgIHNxdWFyZV90aXRsZS50ZXh0KFwiYWRkIHNvblwiKTtcblx0XHRcdCAgZWxzZVxuXHRcdFx0XHQgIGNpcmNsZV90aXRsZS50ZXh0KFwiYWRkIGRhdWdodGVyXCIpO1xuXHRcdCAgfVxuXHQgIH0pO1xuXG5cdC8vIGhhbmRsZSBtb3VzZSBvdXQgb2YgcG9wdXAgc2VsZWN0aW9uXG5cdGQzLnNlbGVjdEFsbChcIi5wb3B1cF9zZWxlY3Rpb25cIikub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0Ly8gaGlkZSByZWN0IGFuZCBwb3B1cCBzZWxlY3Rpb25cblx0XHRpZihhZGRfcGVyc29uLm5vZGUgIT09IHVuZGVmaW5lZCAmJiBoaWdobGlnaHQuaW5kZXhPZihhZGRfcGVyc29uLm5vZGUuZGF0dW0oKSkgPT0gLTEpXG5cdFx0XHRhZGRfcGVyc29uLm5vZGUuc2VsZWN0KCdyZWN0Jykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0fSk7XG5cblxuXHQvLyBkcmFnIGxpbmUgYmV0d2VlbiBub2RlcyB0byBjcmVhdGUgcGFydG5lcnNcblx0ZHJhZ19oYW5kbGUob3B0cyk7XG5cblx0Ly8gcmVjdGFuZ2xlIHVzZWQgdG8gaGlnaGxpZ2h0IG9uIG1vdXNlIG92ZXJcblx0bm9kZS5hcHBlbmQoXCJyZWN0XCIpXG5cdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge1xuXHRcdCAgICByZXR1cm4gZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyA/IGZhbHNlIDogdHJ1ZTtcblx0XHR9KVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgJ2luZGlfcmVjdCcpXG5cdFx0LmF0dHIoXCJyeFwiLCA2KVxuXHRcdC5hdHRyKFwicnlcIiwgNilcblx0XHQuYXR0cihcInhcIiwgZnVuY3Rpb24oX2QpIHsgcmV0dXJuIC0gMC43NSpvcHRzLnN5bWJvbF9zaXplOyB9KVxuXHRcdC5hdHRyKFwieVwiLCBmdW5jdGlvbihfZCkgeyByZXR1cm4gLSBvcHRzLnN5bWJvbF9zaXplOyB9KVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgICgxLjUgKiBvcHRzLnN5bWJvbF9zaXplKSsncHgnKVxuXHRcdC5hdHRyKFwiaGVpZ2h0XCIsICgyICogb3B0cy5zeW1ib2xfc2l6ZSkrJ3B4Jylcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgXCJibGFja1wiKVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCAwLjcpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKFwiZmlsbFwiLCBcImxpZ2h0Z3JleVwiKTtcblxuXHQvLyB3aWRnZXRzXG5cdGxldCBmeCA9IGZ1bmN0aW9uKF9kKSB7cmV0dXJuIG9mZiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZTt9O1xuXHRsZXQgZnkgPSBvcHRzLnN5bWJvbF9zaXplIC0yO1xuXHRsZXQgb2ZmID0gMDtcblx0bGV0IHdpZGdldHMgPSB7XG5cdFx0J2FkZGNoaWxkJzogICB7J3RleHQnOiAnXFx1ZjA2MycsICd0aXRsZSc6ICdhZGQgY2hpbGQnLCAgICdmeCc6IGZ4LCAnZnknOiBmeX0sXG5cdFx0J2FkZHNpYmxpbmcnOiB7J3RleHQnOiAnXFx1ZjIzNCcsICd0aXRsZSc6ICdhZGQgc2libGluZycsICdmeCc6IGZ4LCAnZnknOiBmeX0sXG5cdFx0J2FkZHBhcnRuZXInOiB7J3RleHQnOiAnXFx1ZjBjMScsICd0aXRsZSc6ICdhZGQgcGFydG5lcicsICdmeCc6IGZ4LCAnZnknOiBmeX0sXG5cdFx0J2FkZHBhcmVudHMnOiB7XG5cdFx0XHQndGV4dCc6ICdcXHVmMDYyJywgJ3RpdGxlJzogJ2FkZCBwYXJlbnRzJyxcblx0XHRcdCdmeCc6IC0gMC43NSpvcHRzLnN5bWJvbF9zaXplLFxuXHRcdFx0J2Z5JzogLSBvcHRzLnN5bWJvbF9zaXplICsgMTFcblx0XHR9LFxuXHRcdCdkZWxldGUnOiB7XG5cdFx0XHQndGV4dCc6ICdYJywgJ3RpdGxlJzogJ2RlbGV0ZScsXG5cdFx0XHQnZngnOiBvcHRzLnN5bWJvbF9zaXplLzIgLSAxLFxuXHRcdFx0J2Z5JzogLSBvcHRzLnN5bWJvbF9zaXplICsgMTIsXG5cdFx0XHQnc3R5bGVzJzoge1wiZm9udC13ZWlnaHRcIjogXCJib2xkXCIsIFwiZmlsbFwiOiBcImRhcmtyZWRcIiwgXCJmb250LWZhbWlseVwiOiBcIm1vbm9zcGFjZVwifVxuXHRcdH1cblx0fTtcblxuXHRpZihvcHRzLmVkaXQpIHtcblx0XHR3aWRnZXRzLnNldHRpbmdzID0geyd0ZXh0JzogJ1xcdWYwMTMnLCAndGl0bGUnOiAnc2V0dGluZ3MnLCAnZngnOiAtZm9udF9zaXplLzIrMiwgJ2Z5JzogLW9wdHMuc3ltYm9sX3NpemUgKyAxMX07XG5cdH1cblxuXHRmb3IobGV0IGtleSBpbiB3aWRnZXRzKSB7XG5cdFx0bGV0IHdpZGdldCA9IG5vZGUuYXBwZW5kKFwidGV4dFwiKVxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRyZXR1cm4gIChkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHID8gZmFsc2UgOiB0cnVlKSAmJlxuXHRcdFx0XHRcdFx0ISgoZC5kYXRhLm1vdGhlciA9PT0gdW5kZWZpbmVkIHx8IGQuZGF0YS5ub3BhcmVudHMpICYmIGtleSA9PT0gJ2FkZHNpYmxpbmcnKSAmJlxuXHRcdFx0XHRcdFx0IShkLmRhdGEucGFyZW50X25vZGUgIT09IHVuZGVmaW5lZCAmJiBkLmRhdGEucGFyZW50X25vZGUubGVuZ3RoID4gMSAmJiBrZXkgPT09ICdhZGRwYXJ0bmVyJykgJiZcblx0XHRcdFx0XHRcdCEoZC5kYXRhLnBhcmVudF9ub2RlID09PSB1bmRlZmluZWQgJiYga2V5ID09PSAnYWRkY2hpbGQnKSAmJlxuXHRcdFx0XHRcdFx0ISgoZC5kYXRhLm5vcGFyZW50cyA9PT0gdW5kZWZpbmVkICYmIGQuZGF0YS50b3BfbGV2ZWwgPT09IHVuZGVmaW5lZCkgJiYga2V5ID09PSAnYWRkcGFyZW50cycpO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwga2V5KVxuXHRcdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHRcdC5hdHRyKFwieHhcIiwgZnVuY3Rpb24oZCl7cmV0dXJuIGQueDt9KVxuXHRcdFx0LmF0dHIoXCJ5eVwiLCBmdW5jdGlvbihkKXtyZXR1cm4gZC55O30pXG5cdFx0XHQuYXR0cihcInhcIiwgd2lkZ2V0c1trZXldLmZ4KVxuXHRcdFx0LmF0dHIoXCJ5XCIsIHdpZGdldHNba2V5XS5meSlcblx0XHRcdC5hdHRyKCdmb250LXNpemUnLCAnMC45ZW0nIClcblx0XHRcdC50ZXh0KHdpZGdldHNba2V5XS50ZXh0KTtcblxuXHRcdGlmKCdzdHlsZXMnIGluIHdpZGdldHNba2V5XSlcblx0XHRcdGZvcihsZXQgc3R5bGUgaW4gd2lkZ2V0c1trZXldLnN0eWxlcyl7XG5cdFx0XHRcdHdpZGdldC5hdHRyKHN0eWxlLCB3aWRnZXRzW2tleV0uc3R5bGVzW3N0eWxlXSk7XG5cdFx0XHR9XG5cblx0XHR3aWRnZXQuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQod2lkZ2V0c1trZXldLnRpdGxlKTtcblx0XHRvZmYgKz0gMTc7XG5cdH1cblxuXHQvLyBhZGQgc2libGluZyBvciBjaGlsZFxuXHRkMy5zZWxlY3RBbGwoXCIuYWRkc2libGluZywgLmFkZGNoaWxkXCIpXG5cdCAgLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uICgpIHtcblx0XHQgIGxldCB0eXBlID0gZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ2NsYXNzJyk7XG5cdFx0ICBkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG5cdFx0ICBhZGRfcGVyc29uID0geydub2RlJzogZDMuc2VsZWN0KHRoaXMucGFyZW50Tm9kZSksICd0eXBlJzogdHlwZX07XG5cblx0XHQgIC8vbGV0IHRyYW5zbGF0ZSA9IGdldFRyYW5zbGF0aW9uKGQzLnNlbGVjdCgnLmRpYWdyYW0nKS5hdHRyKFwidHJhbnNmb3JtXCIpKTtcblx0XHQgIGxldCB4ID0gcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ4eFwiKSkgKyBwYXJzZUludChkMy5zZWxlY3QodGhpcykuYXR0cihcInhcIikpO1xuXHRcdCAgbGV0IHkgPSBwYXJzZUludChkMy5zZWxlY3QodGhpcykuYXR0cihcInl5XCIpKSArIHBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwieVwiKSk7XG5cdFx0ICBkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiK3grXCIsXCIrKHkrMikrXCIpXCIpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uX3JvdGF0ZTQ1Jylcblx0XHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiKyh4KzMqZm9udF9zaXplKStcIixcIisoeSsoZm9udF9zaXplKjEuMikpK1wiKSByb3RhdGUoNDUpXCIpO1xuXHQgIH0pO1xuXG5cdC8vIGhhbmRsZSB3aWRnZXQgY2xpY2tzXG5cdGQzLnNlbGVjdEFsbChcIi5hZGRjaGlsZCwgLmFkZHBhcnRuZXIsIC5hZGRwYXJlbnRzLCAuZGVsZXRlLCAuc2V0dGluZ3NcIilcblx0ICAub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRsZXQgb3B0ID0gZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ2NsYXNzJyk7XG5cdFx0bGV0IGQgPSBkMy5zZWxlY3QodGhpcy5wYXJlbnROb2RlKS5kYXR1bSgpO1xuXHRcdGlmKG9wdHMuREVCVUcpIHtcblx0XHRcdGNvbnNvbGUubG9nKG9wdCk7XG5cdFx0fVxuXG5cdFx0bGV0IG5ld2RhdGFzZXQ7XG5cdFx0aWYob3B0ID09PSAnc2V0dGluZ3MnKSB7XG5cdFx0XHRpZih0eXBlb2Ygb3B0cy5lZGl0ID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdG9wdHMuZWRpdChvcHRzLCBkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG9wZW5FZGl0RGlhbG9nKG9wdHMsIGQpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZihvcHQgPT09ICdkZWxldGUnKSB7XG5cdFx0XHRuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlX2N1cnJlbnQob3B0cykpO1xuXHRcdFx0ZGVsZXRlX25vZGVfZGF0YXNldChuZXdkYXRhc2V0LCBkLmRhdGEsIG9wdHMsIG9uRG9uZSk7XG5cdFx0fSBlbHNlIGlmKG9wdCA9PT0gJ2FkZHBhcmVudHMnKSB7XG5cdFx0XHRuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlX2N1cnJlbnQob3B0cykpO1xuXHRcdFx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0XHRcdGFkZHBhcmVudHMob3B0cywgbmV3ZGF0YXNldCwgZC5kYXRhLm5hbWUpO1xuXHRcdFx0cmVidWlsZChvcHRzKTtcblx0XHR9IGVsc2UgaWYob3B0ID09PSAnYWRkcGFydG5lcicpIHtcblx0XHRcdG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGVfY3VycmVudChvcHRzKSk7XG5cdFx0XHRhZGRwYXJ0bmVyKG9wdHMsIG5ld2RhdGFzZXQsIGQuZGF0YS5uYW1lKTtcblx0XHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdFx0XHRyZWJ1aWxkKG9wdHMpO1xuXHRcdH1cblx0XHQvLyB0cmlnZ2VyIGZoQ2hhbmdlIGV2ZW50XG5cdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pO1xuXHR9KTtcblxuXHQvLyBvdGhlciBtb3VzZSBldmVudHNcblx0bGV0IGhpZ2hsaWdodCA9IFtdO1xuXG5cdG5vZGUuZmlsdGVyKGZ1bmN0aW9uIChkKSB7IHJldHVybiAhZC5kYXRhLmhpZGRlbjsgfSlcblx0Lm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRpZiAoZDMuZXZlbnQuY3RybEtleSkge1xuXHRcdFx0aWYoaGlnaGxpZ2h0LmluZGV4T2YoZCkgPT0gLTEpXG5cdFx0XHRcdGhpZ2hsaWdodC5wdXNoKGQpO1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRoaWdobGlnaHQuc3BsaWNlKGhpZ2hsaWdodC5pbmRleE9mKGQpLCAxKTtcblx0XHR9IGVsc2Vcblx0XHRcdGhpZ2hsaWdodCA9IFtkXTtcblxuXHRcdGlmKCdub2RlY2xpY2snIGluIG9wdHMpIHtcblx0XHRcdG9wdHMubm9kZWNsaWNrKGQuZGF0YSk7XG5cdFx0XHRkMy5zZWxlY3RBbGwoXCIuaW5kaV9yZWN0XCIpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRcdGQzLnNlbGVjdEFsbCgnLmluZGlfcmVjdCcpLmZpbHRlcihmdW5jdGlvbihkKSB7cmV0dXJuIGhpZ2hsaWdodC5pbmRleE9mKGQpICE9IC0xO30pLnN0eWxlKFwib3BhY2l0eVwiLCAwLjUpO1xuXHRcdH1cblx0fSlcblx0Lm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGV2ZW50LCBkKXtcblx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRsYXN0X21vdXNlb3ZlciA9IGQ7XG5cdFx0aWYoZHJhZ2dpbmcpIHtcblx0XHRcdGlmKGRyYWdnaW5nLmRhdGEubmFtZSAhPT0gbGFzdF9tb3VzZW92ZXIuZGF0YS5uYW1lICYmXG5cdFx0XHQgICBkcmFnZ2luZy5kYXRhLnNleCAhPT0gbGFzdF9tb3VzZW92ZXIuZGF0YS5zZXgpIHtcblx0XHRcdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjIpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0KCdyZWN0Jykuc3R5bGUoXCJvcGFjaXR5XCIsIDAuMik7XG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLmFkZGNoaWxkLCAuYWRkc2libGluZywgLmFkZHBhcnRuZXIsIC5hZGRwYXJlbnRzLCAuZGVsZXRlLCAuc2V0dGluZ3MnKS5zdHlsZShcIm9wYWNpdHlcIiwgMSk7XG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLmluZGlfZGV0YWlscycpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRzZXRMaW5lRHJhZ1Bvc2l0aW9uKG9wdHMuc3ltYm9sX3NpemUtMTAsIDAsIG9wdHMuc3ltYm9sX3NpemUtMiwgMCwgZC54K1wiLFwiKyhkLnkrMikpO1xuXHR9KVxuXHQub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihldmVudCwgZCl7XG5cdFx0aWYoZHJhZ2dpbmcpXG5cdFx0XHRyZXR1cm47XG5cblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuYWRkY2hpbGQsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5zZXR0aW5ncycpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRpZihoaWdobGlnaHQuaW5kZXhPZihkKSA9PSAtMSlcblx0XHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdEFsbCgnLmluZGlfZGV0YWlscycpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcblx0XHQvLyBoaWRlIHBvcHVwIGlmIGl0IGxvb2tzIGxpa2UgdGhlIG1vdXNlIGlzIG1vdmluZyBub3J0aFxuXHRcdGxldCB4Y29vcmQgPSBkMy5wb2ludGVyKGV2ZW50KVswXTtcblx0XHRsZXQgeWNvb3JkID0gZDMucG9pbnRlcihldmVudClbMV07XG5cdFx0aWYoeWNvb3JkIDwgMC44Km9wdHMuc3ltYm9sX3NpemUpXG5cdFx0XHRkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdFx0aWYoIWRyYWdnaW5nKSB7XG5cdFx0XHQvLyBoaWRlIHBvcHVwIGlmIGl0IGxvb2tzIGxpa2UgdGhlIG1vdXNlIGlzIG1vdmluZyBub3J0aCwgc291dGggb3Igd2VzdFxuXHRcdFx0aWYoIE1hdGguYWJzKHljb29yZCkgPiAwLjI1Km9wdHMuc3ltYm9sX3NpemUgfHxcblx0XHRcdFx0TWF0aC5hYnMoeWNvb3JkKSA8IC0wLjI1Km9wdHMuc3ltYm9sX3NpemUgfHxcblx0XHRcdFx0eGNvb3JkIDwgMC4yKm9wdHMuc3ltYm9sX3NpemUpe1xuXHRcdFx0XHRcdHNldExpbmVEcmFnUG9zaXRpb24oMCwgMCwgMCwgMCk7XG5cdFx0XHR9XG4gICAgICAgIH1cblx0fSk7XG59XG5cbmZ1bmN0aW9uIG9uRG9uZShvcHRzLCBkYXRhc2V0KSB7XG5cdC8vIGFzc2lnbiBuZXcgZGF0YXNldCBhbmQgcmVidWlsZCBwZWRpZ3JlZVxuXHRvcHRzLmRhdGFzZXQgPSBkYXRhc2V0O1xuXHRyZWJ1aWxkKG9wdHMpO1xufVxuXG4vLyBkcmFnIGxpbmUgYmV0d2VlbiBub2RlcyB0byBjcmVhdGUgcGFydG5lcnNcbmZ1bmN0aW9uIGRyYWdfaGFuZGxlKG9wdHMpIHtcblx0bGV0IGxpbmVfZHJhZ19zZWxlY3Rpb24gPSBkMy5zZWxlY3QoJy5kaWFncmFtJyk7XG5cdGxldCBkbGluZSA9IGxpbmVfZHJhZ19zZWxlY3Rpb24uYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgJ2xpbmVfZHJhZ19zZWxlY3Rpb24nKVxuICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCA2KVxuICAgICAgICAuc3R5bGUoXCJzdHJva2UtZGFzaGFycmF5XCIsIChcIjIsIDFcIikpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsXCJibGFja1wiKVxuICAgICAgICAuY2FsbChkMy5kcmFnKClcbiAgICAgICAgICAgICAgICAub24oXCJzdGFydFwiLCBkcmFnc3RhcnQpXG4gICAgICAgICAgICAgICAgLm9uKFwiZHJhZ1wiLCBkcmFnKVxuICAgICAgICAgICAgICAgIC5vbihcImVuZFwiLCBkcmFnc3RvcCkpO1xuXHRkbGluZS5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImRyYWcgdG8gY3JlYXRlIGNvbnNhbmd1aW5lb3VzIHBhcnRuZXJzXCIpO1xuXG5cdHNldExpbmVEcmFnUG9zaXRpb24oMCwgMCwgMCwgMCk7XG5cblx0ZnVuY3Rpb24gZHJhZ3N0YXJ0KCkge1xuXHRcdGRyYWdnaW5nID0gbGFzdF9tb3VzZW92ZXI7XG5cdFx0ZDMuc2VsZWN0QWxsKCcubGluZV9kcmFnX3NlbGVjdGlvbicpXG5cdFx0XHQuYXR0cihcInN0cm9rZVwiLFwiZGFya3JlZFwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRyYWdzdG9wKF9kKSB7XG5cdFx0aWYobGFzdF9tb3VzZW92ZXIgJiZcblx0XHQgICBkcmFnZ2luZy5kYXRhLm5hbWUgIT09IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSAmJlxuXHRcdCAgIGRyYWdnaW5nLmRhdGEuc2V4ICAhPT0gbGFzdF9tb3VzZW92ZXIuZGF0YS5zZXgpIHtcblx0XHRcdC8vIG1ha2UgcGFydG5lcnNcblx0XHRcdGxldCBjaGlsZCA9IHtcIm5hbWVcIjogbWFrZWlkKDQpLCBcInNleFwiOiAnVScsXG5cdFx0XHRcdCAgICAgXCJtb3RoZXJcIjogKGRyYWdnaW5nLmRhdGEuc2V4ID09PSAnRicgPyBkcmFnZ2luZy5kYXRhLm5hbWUgOiBsYXN0X21vdXNlb3Zlci5kYXRhLm5hbWUpLFxuXHRcdFx0ICAgICAgICAgXCJmYXRoZXJcIjogKGRyYWdnaW5nLmRhdGEuc2V4ID09PSAnRicgPyBsYXN0X21vdXNlb3Zlci5kYXRhLm5hbWUgOiBkcmFnZ2luZy5kYXRhLm5hbWUpfTtcblx0XHRcdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KG9wdHMuZGF0YXNldCk7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXG5cdFx0XHRsZXQgaWR4ID0gZ2V0SWR4QnlOYW1lKG9wdHMuZGF0YXNldCwgZHJhZ2dpbmcuZGF0YS5uYW1lKSsxO1xuXHRcdFx0b3B0cy5kYXRhc2V0LnNwbGljZShpZHgsIDAsIGNoaWxkKTtcblx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0fVxuXHRcdHNldExpbmVEcmFnUG9zaXRpb24oMCwgMCwgMCwgMCk7XG5cdFx0ZDMuc2VsZWN0QWxsKCcubGluZV9kcmFnX3NlbGVjdGlvbicpXG5cdFx0XHQuYXR0cihcInN0cm9rZVwiLFwiYmxhY2tcIik7XG5cdFx0ZHJhZ2dpbmcgPSB1bmRlZmluZWQ7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZyhldmVudCwgX2QpIHtcblx0XHRldmVudC5zb3VyY2VFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRsZXQgZHggPSBldmVudC5keDtcblx0XHRsZXQgZHkgPSBldmVudC5keTtcbiAgICAgICAgbGV0IHhuZXcgPSBwYXJzZUZsb2F0KGQzLnNlbGVjdCh0aGlzKS5hdHRyKCd4MicpKSsgZHg7XG4gICAgICAgIGxldCB5bmV3ID0gcGFyc2VGbG9hdChkMy5zZWxlY3QodGhpcykuYXR0cigneTInKSkrIGR5O1xuICAgICAgICBzZXRMaW5lRHJhZ1Bvc2l0aW9uKG9wdHMuc3ltYm9sX3NpemUtMTAsIDAsIHhuZXcsIHluZXcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldExpbmVEcmFnUG9zaXRpb24oeDEsIHkxLCB4MiwgeTIsIHRyYW5zbGF0ZSkge1xuXHRpZih0cmFuc2xhdGUpXG5cdFx0ZDMuc2VsZWN0QWxsKCcubGluZV9kcmFnX3NlbGVjdGlvbicpLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIrdHJhbnNsYXRlK1wiKVwiKTtcblx0ZDMuc2VsZWN0QWxsKCcubGluZV9kcmFnX3NlbGVjdGlvbicpXG5cdFx0LmF0dHIoXCJ4MVwiLCB4MSlcblx0XHQuYXR0cihcInkxXCIsIHkxKVxuXHRcdC5hdHRyKFwieDJcIiwgeDIpXG5cdFx0LmF0dHIoXCJ5MlwiLCB5Mik7XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpc2VGaXJzdExldHRlcihzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgc3RyaW5nLnNsaWNlKDEpO1xufVxuXG4vLyBpZiBvcHQuZWRpdCBpcyBzZXQgdHJ1ZSAocmF0aGVyIHRoYW4gZ2l2ZW4gYSBmdW5jdGlvbikgdGhpcyBpcyBjYWxsZWQgdG8gZWRpdCBub2RlIGF0dHJpYnV0ZXNcbmZ1bmN0aW9uIG9wZW5FZGl0RGlhbG9nKG9wdHMsIGQpIHtcblx0JCgnI25vZGVfcHJvcGVydGllcycpLmRpYWxvZyh7XG5cdCAgICBhdXRvT3BlbjogZmFsc2UsXG5cdCAgICB0aXRsZTogZC5kYXRhLmRpc3BsYXlfbmFtZSxcblx0ICAgIHdpZHRoOiAoJCh3aW5kb3cpLndpZHRoKCkgPiA0MDAgPyA0NTAgOiAkKHdpbmRvdykud2lkdGgoKS0gMzApXG5cdH0pO1xuXG5cdGxldCB0YWJsZSA9IFwiPHRhYmxlIGlkPSdwZXJzb25fZGV0YWlscycgY2xhc3M9J3RhYmxlJz5cIjtcblxuXHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlVuaXF1ZSBJRDwvdGQ+PHRkPjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyB0eXBlPSd0ZXh0JyBpZD0naWRfbmFtZScgbmFtZT0nbmFtZScgdmFsdWU9XCIrXG5cdChkLmRhdGEubmFtZSA/IGQuZGF0YS5uYW1lIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPk5hbWU8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0ndGV4dCcgaWQ9J2lkX2Rpc3BsYXlfbmFtZScgbmFtZT0nZGlzcGxheV9uYW1lJyB2YWx1ZT1cIitcblx0XHRcdChkLmRhdGEuZGlzcGxheV9uYW1lID8gZC5kYXRhLmRpc3BsYXlfbmFtZSA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblxuXHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPkFnZTwvdGQ+PHRkPjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyB0eXBlPSdudW1iZXInIGlkPSdpZF9hZ2UnIG1pbj0nMCcgbWF4PScxMjAnIG5hbWU9J2FnZScgc3R5bGU9J3dpZHRoOjdlbScgdmFsdWU9XCIrXG5cdFx0XHQoZC5kYXRhLmFnZSA/IGQuZGF0YS5hZ2UgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cblx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5ZZWFyIE9mIEJpcnRoPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J251bWJlcicgaWQ9J2lkX3lvYicgbWluPScxOTAwJyBtYXg9JzIwNTAnIG5hbWU9J3lvYicgc3R5bGU9J3dpZHRoOjdlbScgdmFsdWU9XCIrXG5cdFx0KGQuZGF0YS55b2IgPyBkLmRhdGEueW9iIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCIgaWQ9XCJpZF9zZXhcIj4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwicmFkaW8taW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzZXhcIiB2YWx1ZT1cIk1cIiAnKyhkLmRhdGEuc2V4ID09PSAnTScgPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+TWFsZTwvbGFiZWw+JyArXG5cdFx0XHQgJzxsYWJlbCBjbGFzcz1cInJhZGlvLWlubGluZVwiPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2V4XCIgdmFsdWU9XCJGXCIgJysoZC5kYXRhLnNleCA9PT0gJ0YnID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPkZlbWFsZTwvbGFiZWw+JyArXG5cdFx0XHQgJzxsYWJlbCBjbGFzcz1cInJhZGlvLWlubGluZVwiPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2V4XCIgdmFsdWU9XCJVXCI+VW5rbm93bjwvbGFiZWw+JyArXG5cdFx0XHQgJzwvdGQ+PC90cj4nO1xuXG5cdC8vIGFsaXZlIHN0YXR1cyA9IDA7IGRlYWQgc3RhdHVzID0gMVxuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiIGlkPVwiaWRfc3RhdHVzXCI+JyArXG5cdFx0XHQgJzxsYWJlbCBjbGFzcz1cImNoZWNrYm94LWlubGluZVwiPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic3RhdHVzXCIgdmFsdWU9XCIwXCIgJysocGFyc2VJbnQoZC5kYXRhLnN0YXR1cykgPT09IDAgPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+JnRoaW5zcDtBbGl2ZTwvbGFiZWw+JyArXG5cdFx0XHQgJzxsYWJlbCBjbGFzcz1cImNoZWNrYm94LWlubGluZVwiPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic3RhdHVzXCIgdmFsdWU9XCIxXCIgJysocGFyc2VJbnQoZC5kYXRhLnN0YXR1cykgPT09IDEgPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+JnRoaW5zcDtEZWNlYXNlZDwvbGFiZWw+JyArXG5cdFx0XHQgJzwvdGQ+PC90cj4nO1xuXHQkKFwiI2lkX3N0YXR1cyBpbnB1dFt2YWx1ZT0nXCIrZC5kYXRhLnN0YXR1cytcIiddXCIpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcblxuXHQvLyBzd2l0Y2hlc1xuXHRsZXQgc3dpdGNoZXMgPSBbXCJhZG9wdGVkX2luXCIsIFwiYWRvcHRlZF9vdXRcIiwgXCJtaXNjYXJyaWFnZVwiLCBcInN0aWxsYmlydGhcIiwgXCJ0ZXJtaW5hdGlvblwiXTtcblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIj48c3Ryb25nPlJlcHJvZHVjdGlvbjo8L3N0cm9uZz48L3RkPjwvdHI+Jztcblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIj4nO1xuXHRmb3IobGV0IGlzd2l0Y2g9MDsgaXN3aXRjaDxzd2l0Y2hlcy5sZW5ndGg7IGlzd2l0Y2grKyl7XG5cdFx0bGV0IGF0dHIgPSBzd2l0Y2hlc1tpc3dpdGNoXTtcblx0XHRpZihpc3dpdGNoID09PSAyKVxuXHRcdFx0dGFibGUgKz0gJzwvdGQ+PC90cj48dHI+PHRkIGNvbHNwYW49XCIyXCI+Jztcblx0XHR0YWJsZSArPVxuXHRcdCAnPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtaW5saW5lXCI+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGlkPVwiaWRfJythdHRyICtcblx0XHQgICAgJ1wiIG5hbWU9XCInK2F0dHIrJ1wiIHZhbHVlPVwiMFwiICcrKGQuZGF0YVthdHRyXSA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz4mdGhpbnNwOycgK1xuXHRcdCAgICBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoYXR0ci5yZXBsYWNlKCdfJywgJyAnKSkrJzwvbGFiZWw+J1xuXHR9XG5cdHRhYmxlICs9ICc8L3RkPjwvdHI+JztcblxuXHQvL1xuXHRsZXQgZXhjbHVkZSA9IFtcImNoaWxkcmVuXCIsIFwibmFtZVwiLCBcInBhcmVudF9ub2RlXCIsIFwidG9wX2xldmVsXCIsIFwiaWRcIiwgXCJub3BhcmVudHNcIixcblx0XHQgICAgICAgICAgIFwibGV2ZWxcIiwgXCJhZ2VcIiwgXCJzZXhcIiwgXCJzdGF0dXNcIiwgXCJkaXNwbGF5X25hbWVcIiwgXCJtb3RoZXJcIiwgXCJmYXRoZXJcIixcblx0XHQgICAgICAgICAgIFwieW9iXCIsIFwibXp0d2luXCIsIFwiZHp0d2luXCJdO1xuXHQkLm1lcmdlKGV4Y2x1ZGUsIHN3aXRjaGVzKTtcblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIj48c3Ryb25nPkFnZSBvZiBEaWFnbm9zaXM6PC9zdHJvbmc+PC90ZD48L3RyPic7XG5cdCQuZWFjaChvcHRzLmRpc2Vhc2VzLCBmdW5jdGlvbihrLCB2KSB7XG5cdFx0ZXhjbHVkZS5wdXNoKHYudHlwZStcIl9kaWFnbm9zaXNfYWdlXCIpO1xuXG5cdFx0bGV0IGRpc2Vhc2VfY29sb3VyID0gJyZ0aGluc3A7PHNwYW4gc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4O2JhY2tncm91bmQ6JytvcHRzLmRpc2Vhc2VzW2tdLmNvbG91cisnXCI+PC9zcGFuPic7XG5cdFx0bGV0IGRpYWdub3Npc19hZ2UgPSBkLmRhdGFbdi50eXBlICsgXCJfZGlhZ25vc2lzX2FnZVwiXTtcblxuXHRcdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+XCIrY2FwaXRhbGlzZUZpcnN0TGV0dGVyKHYudHlwZS5yZXBsYWNlKFwiX1wiLCBcIiBcIikpK1xuXHRcdFx0XHRcdGRpc2Vhc2VfY29sb3VyK1wiJm5ic3A7PC90ZD48dGQ+XCIgK1xuXHRcdFx0XHRcdFwiPGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIGlkPSdpZF9cIiArXG5cdFx0XHRcdFx0di50eXBlICsgXCJfZGlhZ25vc2lzX2FnZV8wJyBtYXg9JzExMCcgbWluPScwJyBuYW1lPSdcIiArXG5cdFx0XHRcdFx0di50eXBlICsgXCJfZGlhZ25vc2lzX2FnZV8wJyBzdHlsZT0nd2lkdGg6NWVtJyB0eXBlPSdudW1iZXInIHZhbHVlPSdcIiArXG5cdFx0XHRcdFx0KGRpYWdub3Npc19hZ2UgIT09IHVuZGVmaW5lZCA/IGRpYWdub3Npc19hZ2UgOiBcIlwiKSArXCInPjwvdGQ+PC90cj5cIjtcblx0fSk7XG5cblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIiBzdHlsZT1cImxpbmUtaGVpZ2h0OjFweDtcIj48L3RkPjwvdHI+Jztcblx0JC5lYWNoKGQuZGF0YSwgZnVuY3Rpb24oaywgdikge1xuXHRcdGlmKCQuaW5BcnJheShrLCBleGNsdWRlKSA9PSAtMSkge1xuXHRcdFx0bGV0IGtrID0gY2FwaXRhbGlzZUZpcnN0TGV0dGVyKGspO1xuXHRcdFx0aWYodiA9PT0gdHJ1ZSB8fCB2ID09PSBmYWxzZSkge1xuXHRcdFx0XHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlwiK2trK1wiJm5ic3A7PC90ZD48dGQ+PGlucHV0IHR5cGU9J2NoZWNrYm94JyBpZD0naWRfXCIgKyBrICsgXCInIG5hbWU9J1wiICtcblx0XHRcdFx0XHRcdGsrXCInIHZhbHVlPVwiK3YrXCIgXCIrKHYgPyBcImNoZWNrZWRcIiA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblx0XHRcdH0gZWxzZSBpZihrLmxlbmd0aCA+IDApe1xuXHRcdFx0XHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlwiK2trK1wiJm5ic3A7PC90ZD48dGQ+PGlucHV0IHR5cGU9J3RleHQnIGlkPSdpZF9cIiArXG5cdFx0XHRcdFx0XHRrK1wiJyBuYW1lPSdcIitrK1wiJyB2YWx1ZT1cIit2K1wiPjwvdGQ+PC90cj5cIjtcblx0XHRcdH1cblx0XHR9XG4gICAgfSk7XG5cdHRhYmxlICs9IFwiPC90YWJsZT5cIjtcblxuXHQkKCcjbm9kZV9wcm9wZXJ0aWVzJykuaHRtbCh0YWJsZSk7XG5cdCQoJyNub2RlX3Byb3BlcnRpZXMnKS5kaWFsb2coJ29wZW4nKTtcblxuXHQvLyQoJyNpZF9uYW1lJykuY2xvc2VzdCgndHInKS50b2dnbGUoKTtcblx0JCgnI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPXJhZGlvXSwgI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPWNoZWNrYm94XSwgI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPXRleHRdLCAjbm9kZV9wcm9wZXJ0aWVzIGlucHV0W3R5cGU9bnVtYmVyXScpLmNoYW5nZShmdW5jdGlvbigpIHtcblx0XHRzYXZlKG9wdHMpO1xuICAgIH0pO1xuXHR1cGRhdGUob3B0cyk7XG5cdHJldHVybjtcbn1cbiIsIi8vIFBlZGlncmVlIFRyZWUgQnVpbGRlclxuaW1wb3J0ICAqIGFzIHBlZGlncmVlX3V0aWxzIGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0ICogYXMgcGJ1dHRvbnMgZnJvbSAnLi9wYnV0dG9ucy5qcyc7XG5pbXBvcnQgKiBhcyBwZWRjYWNoZSBmcm9tICcuL3BlZGNhY2hlLmpzJztcbmltcG9ydCAqIGFzIGlvIGZyb20gJy4vaW8uanMnO1xuaW1wb3J0IHthZGRXaWRnZXRzfSBmcm9tICcuL3dpZGdldHMuanMnO1xuXG5leHBvcnQgbGV0IHJvb3RzID0ge307XG5leHBvcnQgZnVuY3Rpb24gYnVpbGQob3B0aW9ucykge1xuXHRsZXQgb3B0cyA9ICQuZXh0ZW5kKHsgLy8gZGVmYXVsdHNcblx0XHR0YXJnZXREaXY6ICdwZWRpZ3JlZV9lZGl0Jyxcblx0XHRkYXRhc2V0OiBbIHtcIm5hbWVcIjogXCJtMjFcIiwgXCJkaXNwbGF5X25hbWVcIjogXCJmYXRoZXJcIiwgXCJzZXhcIjogXCJNXCIsIFwidG9wX2xldmVsXCI6IHRydWV9LFxuXHRcdFx0XHQgICB7XCJuYW1lXCI6IFwiZjIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibW90aGVyXCIsIFwic2V4XCI6IFwiRlwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdFx0ICAge1wibmFtZVwiOiBcImNoMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcIm1lXCIsIFwic2V4XCI6IFwiRlwiLCBcIm1vdGhlclwiOiBcImYyMVwiLCBcImZhdGhlclwiOiBcIm0yMVwiLCBcInByb2JhbmRcIjogdHJ1ZX1dLFxuXHRcdHdpZHRoOiA2MDAsXG5cdFx0aGVpZ2h0OiA0MDAsXG5cdFx0c3ltYm9sX3NpemU6IDM1LFxuXHRcdHpvb21JbjogMS4wLFxuXHRcdHpvb21PdXQ6IDEuMCxcblx0XHRkaXNlYXNlczogW1x0eyd0eXBlJzogJ2JyZWFzdF9jYW5jZXInLCAnY29sb3VyJzogJyNGNjhGMzUnfSxcblx0XHRcdFx0XHR7J3R5cGUnOiAnYnJlYXN0X2NhbmNlcjInLCAnY29sb3VyJzogJ3BpbmsnfSxcblx0XHRcdFx0XHR7J3R5cGUnOiAnb3Zhcmlhbl9jYW5jZXInLCAnY29sb3VyJzogJyM0REFBNEQnfSxcblx0XHRcdFx0XHR7J3R5cGUnOiAncGFuY3JlYXRpY19jYW5jZXInLCAnY29sb3VyJzogJyM0Mjg5QkEnfSxcblx0XHRcdFx0XHR7J3R5cGUnOiAncHJvc3RhdGVfY2FuY2VyJywgJ2NvbG91cic6ICcjRDU0OTRBJ31dLFxuXHRcdGxhYmVsczogWydzdGlsbGJpcnRoJywgJ2FnZScsICd5b2InLCAnYWxsZWxlcyddLFxuXHRcdGtlZXBfcHJvYmFuZF9vbl9yZXNldDogZmFsc2UsXG5cdFx0Zm9udF9zaXplOiAnLjc1ZW0nLFxuXHRcdGZvbnRfZmFtaWx5OiAnSGVsdmV0aWNhJyxcblx0XHRmb250X3dlaWdodDogNzAwLFxuXHRcdGJhY2tncm91bmQ6IFwiI0VFRVwiLFxuXHRcdG5vZGVfYmFja2dyb3VuZDogJyNmZGZkZmQnLFxuXHRcdHZhbGlkYXRlOiB0cnVlLFxuXHRcdERFQlVHOiBmYWxzZX0sIG9wdGlvbnMgKTtcblxuXHRpZiAoICQoIFwiI2Z1bGxzY3JlZW5cIiApLmxlbmd0aCA9PT0gMCApIHtcblx0XHQvLyBhZGQgdW5kbywgcmVkbywgZnVsbHNjcmVlbiBidXR0b25zIGFuZCBldmVudCBsaXN0ZW5lcnMgb25jZVxuXHRcdHBidXR0b25zLmFkZChvcHRzKTtcblx0XHRpby5hZGQob3B0cyk7XG5cdH1cblxuXHRpZihwZWRjYWNoZS5uc3RvcmUob3B0cykgPT0gLTEpXG5cdFx0cGVkY2FjaGUuaW5pdF9jYWNoZShvcHRzKTtcblxuXHRwYnV0dG9ucy51cGRhdGVCdXR0b25zKG9wdHMpO1xuXG5cdC8vIHZhbGlkYXRlIHBlZGlncmVlIGRhdGFcblx0dmFsaWRhdGVfcGVkaWdyZWUob3B0cyk7XG5cdC8vIGdyb3VwIHRvcCBsZXZlbCBub2RlcyBieSBwYXJ0bmVyc1xuXHRvcHRzLmRhdGFzZXQgPSBncm91cF90b3BfbGV2ZWwob3B0cy5kYXRhc2V0KTtcblxuXHRpZihvcHRzLkRFQlVHKVxuXHRcdHBlZGlncmVlX3V0aWxzLnByaW50X29wdHMob3B0cyk7XG5cdGxldCBzdmdfZGltZW5zaW9ucyA9IGdldF9zdmdfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IHN2ZyA9IGQzLnNlbGVjdChcIiNcIitvcHRzLnRhcmdldERpdilcblx0XHRcdFx0IC5hcHBlbmQoXCJzdmc6c3ZnXCIpXG5cdFx0XHRcdCAuYXR0cihcIndpZHRoXCIsIHN2Z19kaW1lbnNpb25zLndpZHRoKVxuXHRcdFx0XHQgLmF0dHIoXCJoZWlnaHRcIiwgc3ZnX2RpbWVuc2lvbnMuaGVpZ2h0KTtcblxuXHRzdmcuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG5cdFx0LmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG5cdFx0LmF0dHIoXCJyeFwiLCA2KVxuXHRcdC5hdHRyKFwicnlcIiwgNilcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgXCJkYXJrZ3JleVwiKVxuXHRcdC5zdHlsZShcImZpbGxcIiwgb3B0cy5iYWNrZ3JvdW5kKSAvLyBvciBub25lXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIDEpO1xuXG5cdGxldCB4eXRyYW5zZm9ybSA9IHBlZGNhY2hlLmdldHBvc2l0aW9uKG9wdHMpOyAgLy8gY2FjaGVkIHBvc2l0aW9uXG5cdGxldCB4dHJhbnNmb3JtID0geHl0cmFuc2Zvcm1bMF07XG5cdGxldCB5dHJhbnNmb3JtID0geHl0cmFuc2Zvcm1bMV07XG5cdGxldCB6b29tID0gMTtcblx0aWYoeHl0cmFuc2Zvcm0ubGVuZ3RoID09IDMpe1xuXHRcdHpvb20gPSB4eXRyYW5zZm9ybVsyXTtcblx0fVxuXG5cdGlmKHh0cmFuc2Zvcm0gPT09IG51bGwgfHwgeXRyYW5zZm9ybSA9PT0gbnVsbCkge1xuXHRcdHh0cmFuc2Zvcm0gPSBvcHRzLnN5bWJvbF9zaXplLzI7XG5cdFx0eXRyYW5zZm9ybSA9ICgtb3B0cy5zeW1ib2xfc2l6ZSoyLjUpO1xuXHR9XG5cdGxldCBwZWQgPSBzdmcuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0IC5hdHRyKFwiY2xhc3NcIiwgXCJkaWFncmFtXCIpXG5cdFx0XHQgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIreHRyYW5zZm9ybStcIixcIiArIHl0cmFuc2Zvcm0gKyBcIikgc2NhbGUoXCIrem9vbStcIilcIik7XG5cblx0bGV0IHRvcF9sZXZlbCA9ICQubWFwKG9wdHMuZGF0YXNldCwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuICd0b3BfbGV2ZWwnIGluIHZhbCAmJiB2YWwudG9wX2xldmVsID8gdmFsIDogbnVsbDt9KTtcblx0bGV0IGhpZGRlbl9yb290ID0ge1xuXHRcdG5hbWUgOiAnaGlkZGVuX3Jvb3QnLFxuXHRcdGlkIDogMCxcblx0XHRoaWRkZW4gOiB0cnVlLFxuXHRcdGNoaWxkcmVuIDogdG9wX2xldmVsXG5cdH07XG5cblx0bGV0IHBhcnRuZXJzID0gcGVkaWdyZWVfdXRpbHMuYnVpbGRUcmVlKG9wdHMsIGhpZGRlbl9yb290LCBoaWRkZW5fcm9vdClbMF07XG5cdGxldCByb290ID0gZDMuaGllcmFyY2h5KGhpZGRlbl9yb290KTtcblx0cm9vdHNbb3B0cy50YXJnZXREaXZdID0gcm9vdDtcblxuXHQvLyAvIGdldCBzY29yZSBhdCBlYWNoIGRlcHRoIHVzZWQgdG8gYWRqdXN0IG5vZGUgc2VwYXJhdGlvblxuXHRsZXQgdHJlZV9kaW1lbnNpb25zID0gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKTtcblx0aWYob3B0cy5ERUJVRylcblx0XHRjb25zb2xlLmxvZygnb3B0cy53aWR0aD0nK3N2Z19kaW1lbnNpb25zLndpZHRoKycgd2lkdGg9Jyt0cmVlX2RpbWVuc2lvbnMud2lkdGgrXG5cdFx0XHRcdFx0JyBvcHRzLmhlaWdodD0nK3N2Z19kaW1lbnNpb25zLmhlaWdodCsnIGhlaWdodD0nK3RyZWVfZGltZW5zaW9ucy5oZWlnaHQpO1xuXG5cdGxldCB0cmVlbWFwID0gZDMudHJlZSgpLnNlcGFyYXRpb24oZnVuY3Rpb24oYSwgYikge1xuXHRcdHJldHVybiBhLnBhcmVudCA9PT0gYi5wYXJlbnQgfHwgYS5kYXRhLmhpZGRlbiB8fCBiLmRhdGEuaGlkZGVuID8gMS4yIDogMi4yO1xuXHR9KS5zaXplKFt0cmVlX2RpbWVuc2lvbnMud2lkdGgsIHRyZWVfZGltZW5zaW9ucy5oZWlnaHRdKTtcblxuXHRsZXQgbm9kZXMgPSB0cmVlbWFwKHJvb3Quc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLmRhdGEuaWQgLSBiLmRhdGEuaWQ7IH0pKTtcblx0bGV0IGZsYXR0ZW5Ob2RlcyA9IG5vZGVzLmRlc2NlbmRhbnRzKCk7XG5cblx0Ly8gY2hlY2sgdGhlIG51bWJlciBvZiB2aXNpYmxlIG5vZGVzIGVxdWFscyB0aGUgc2l6ZSBvZiB0aGUgcGVkaWdyZWUgZGF0YXNldFxuXHRsZXQgdmlzX25vZGVzID0gJC5tYXAob3B0cy5kYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7cmV0dXJuIHAuaGlkZGVuID8gbnVsbCA6IHA7fSk7XG5cdGlmKHZpc19ub2Rlcy5sZW5ndGggIT0gb3B0cy5kYXRhc2V0Lmxlbmd0aCkge1xuXHRcdHRocm93IGNyZWF0ZV9lcnIoJ05VTUJFUiBPRiBWSVNJQkxFIE5PREVTIERJRkZFUkVOVCBUTyBOVU1CRVIgSU4gVEhFIERBVEFTRVQnKTtcblx0fVxuXG5cdHBlZGlncmVlX3V0aWxzLmFkanVzdF9jb29yZHMob3B0cywgbm9kZXMsIGZsYXR0ZW5Ob2Rlcyk7XG5cblx0bGV0IHB0ckxpbmtOb2RlcyA9IHBlZGlncmVlX3V0aWxzLmxpbmtOb2RlcyhmbGF0dGVuTm9kZXMsIHBhcnRuZXJzKTtcblx0Y2hlY2tfcHRyX2xpbmtzKG9wdHMsIHB0ckxpbmtOb2Rlcyk7ICAgLy8gY2hlY2sgZm9yIGNyb3NzaW5nIG9mIHBhcnRuZXIgbGluZXNcblxuXHRsZXQgbm9kZSA9IHBlZC5zZWxlY3RBbGwoXCIubm9kZVwiKVxuXHRcdFx0XHQgIC5kYXRhKG5vZGVzLmRlc2NlbmRhbnRzKCkpXG5cdFx0XHRcdCAgLmVudGVyKClcblx0XHRcdFx0ICAuYXBwZW5kKFwiZ1wiKVxuXHRcdFx0XHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xuXHRcdFx0XHRcdH0pO1xuXG5cdC8vIHByb3ZpZGUgYSBib3JkZXIgdG8gdGhlIG5vZGVcblx0bm9kZS5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge3JldHVybiAhZC5kYXRhLmhpZGRlbjt9KVxuXHRcdC5hdHRyKFwic2hhcGUtcmVuZGVyaW5nXCIsIFwiZ2VvbWV0cmljUHJlY2lzaW9uXCIpXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge3JldHVybiBkLmRhdGEuc2V4ID09IFwiVVwiICYmICEoZC5kYXRhLm1pc2NhcnJpYWdlIHx8IGQuZGF0YS50ZXJtaW5hdGlvbikgPyBcInJvdGF0ZSg0NSlcIiA6IFwiXCI7fSlcblx0XHQuYXR0cihcImRcIiwgZDMuc3ltYm9sKCkuc2l6ZShmdW5jdGlvbihfZCkgeyByZXR1cm4gKG9wdHMuc3ltYm9sX3NpemUgKiBvcHRzLnN5bWJvbF9zaXplKSArIDI7fSlcblx0XHRcdFx0LnR5cGUoZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRcdGlmKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pXG5cdFx0XHRcdFx0XHRyZXR1cm4gZDMuc3ltYm9sVHJpYW5nbGU7XG5cdFx0XHRcdFx0cmV0dXJuIGQuZGF0YS5zZXggPT0gXCJGXCIgPyBkMy5zeW1ib2xDaXJjbGUgOiBkMy5zeW1ib2xTcXVhcmU7fSkpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRyZXR1cm4gZC5kYXRhLmFnZSAmJiBkLmRhdGEueW9iICYmICFkLmRhdGEuZXhjbHVkZSA/IFwiIzMwMzAzMFwiIDogXCJncmV5XCI7XG5cdFx0fSlcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHJldHVybiBkLmRhdGEuYWdlICYmIGQuZGF0YS55b2IgJiYgIWQuZGF0YS5leGNsdWRlID8gXCIuM2VtXCIgOiBcIi4xZW1cIjtcblx0XHR9KVxuXHRcdC5zdHlsZShcInN0cm9rZS1kYXNoYXJyYXlcIiwgZnVuY3Rpb24gKGQpIHtyZXR1cm4gIWQuZGF0YS5leGNsdWRlID8gbnVsbCA6IChcIjMsIDNcIik7fSlcblx0XHQuc3R5bGUoXCJmaWxsXCIsIFwibm9uZVwiKTtcblxuXHQvLyBzZXQgYSBjbGlwcGF0aFxuXHRub2RlLmFwcGVuZChcImNsaXBQYXRoXCIpXG5cdFx0LmF0dHIoXCJpZFwiLCBmdW5jdGlvbiAoZCkge3JldHVybiBkLmRhdGEubmFtZTt9KS5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge3JldHVybiAhKGQuZGF0YS5oaWRkZW4gJiYgIW9wdHMuREVCVUcpO30pXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7cmV0dXJuIGQuZGF0YS5zZXggPT0gXCJVXCIgJiYgIShkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKSA/IFwicm90YXRlKDQ1KVwiIDogXCJcIjt9KVxuXHRcdC5hdHRyKFwiZFwiLCBkMy5zeW1ib2woKS5zaXplKGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYgKGQuZGF0YS5oaWRkZW4pXG5cdFx0XHRcdFx0cmV0dXJuIG9wdHMuc3ltYm9sX3NpemUgKiBvcHRzLnN5bWJvbF9zaXplIC8gNTtcblx0XHRcdFx0cmV0dXJuIG9wdHMuc3ltYm9sX3NpemUgKiBvcHRzLnN5bWJvbF9zaXplO1xuXHRcdFx0fSlcblx0XHRcdC50eXBlKGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYoZC5kYXRhLm1pc2NhcnJpYWdlIHx8IGQuZGF0YS50ZXJtaW5hdGlvbilcblx0XHRcdFx0XHRyZXR1cm4gZDMuc3ltYm9sVHJpYW5nbGU7XG5cdFx0XHRcdHJldHVybiBkLmRhdGEuc2V4ID09IFwiRlwiID8gZDMuc3ltYm9sQ2lyY2xlIDpkMy5zeW1ib2xTcXVhcmU7fSkpO1xuXG5cdC8vIHBpZSBwbG90cyBmb3IgZGlzZWFzZSBjb2xvdXJzXG5cdGxldCBwaWVub2RlID0gbm9kZS5zZWxlY3RBbGwoXCJwaWVub2RlXCIpXG5cdCAgIC5kYXRhKGZ1bmN0aW9uKGQpIHtcdCBcdFx0Ly8gc2V0IHRoZSBkaXNlYXNlIGRhdGEgZm9yIHRoZSBwaWUgcGxvdFxuXHRcdCAgIGxldCBuY2FuY2VycyA9IDA7XG5cdFx0ICAgbGV0IGNhbmNlcnMgPSAkLm1hcChvcHRzLmRpc2Vhc2VzLCBmdW5jdGlvbih2YWwsIGkpe1xuXHRcdFx0ICAgaWYocHJlZml4SW5PYmoob3B0cy5kaXNlYXNlc1tpXS50eXBlLCBkLmRhdGEpKSB7bmNhbmNlcnMrKzsgcmV0dXJuIDE7fSBlbHNlIHJldHVybiAwO1xuXHRcdCAgIH0pO1xuXHRcdCAgIGlmKG5jYW5jZXJzID09PSAwKSBjYW5jZXJzID0gWzFdO1xuXHRcdCAgIHJldHVybiBbJC5tYXAoY2FuY2VycywgZnVuY3Rpb24odmFsLCBfaSl7XG5cdFx0XHQgICByZXR1cm4geydjYW5jZXInOiB2YWwsICduY2FuY2Vycyc6IG5jYW5jZXJzLCAnaWQnOiBkLmRhdGEubmFtZSxcblx0XHRcdFx0XHRcdCdzZXgnOiBkLmRhdGEuc2V4LCAncHJvYmFuZCc6IGQuZGF0YS5wcm9iYW5kLCAnaGlkZGVuJzogZC5kYXRhLmhpZGRlbixcblx0XHRcdFx0XHRcdCdhZmZlY3RlZCc6IGQuZGF0YS5hZmZlY3RlZCxcblx0XHRcdFx0XHRcdCdleGNsdWRlJzogZC5kYXRhLmV4Y2x1ZGV9O30pXTtcblx0ICAgfSlcblx0ICAgLmVudGVyKClcblx0XHQuYXBwZW5kKFwiZ1wiKTtcblxuXHRwaWVub2RlLnNlbGVjdEFsbChcInBhdGhcIilcblx0XHQuZGF0YShkMy5waWUoKS52YWx1ZShmdW5jdGlvbihkKSB7cmV0dXJuIGQuY2FuY2VyO30pKVxuXHRcdC5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcblx0XHRcdC5hdHRyKFwiY2xpcC1wYXRoXCIsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gXCJ1cmwoI1wiK2QuZGF0YS5pZCtcIilcIjt9KSAvLyBjbGlwIHRoZSByZWN0YW5nbGVcblx0XHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwaWVub2RlXCIpXG5cdFx0XHQuYXR0cihcImRcIiwgZDMuYXJjKCkuaW5uZXJSYWRpdXMoMCkub3V0ZXJSYWRpdXMob3B0cy5zeW1ib2xfc2l6ZSkpXG5cdFx0XHQuc3R5bGUoXCJmaWxsXCIsIGZ1bmN0aW9uKGQsIGkpIHtcblx0XHRcdFx0aWYoZC5kYXRhLmV4Y2x1ZGUpXG5cdFx0XHRcdFx0cmV0dXJuICdsaWdodGdyZXknO1xuXHRcdFx0XHRpZihkLmRhdGEubmNhbmNlcnMgPT09IDApIHtcblx0XHRcdFx0XHRpZihkLmRhdGEuYWZmZWN0ZWQpXG5cdFx0XHRcdFx0XHRyZXR1cm4gJ2RhcmtncmV5Jztcblx0XHRcdFx0XHRyZXR1cm4gb3B0cy5ub2RlX2JhY2tncm91bmQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIG9wdHMuZGlzZWFzZXNbaV0uY29sb3VyO1xuXHRcdFx0fSk7XG5cblx0Ly8gYWRvcHRlZCBpbi9vdXQgYnJhY2tldHNcblx0bm9kZS5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge3JldHVybiAhZC5kYXRhLmhpZGRlbiAmJiAoZC5kYXRhLmFkb3B0ZWRfaW4gfHwgZC5kYXRhLmFkb3B0ZWRfb3V0KTt9KVxuXHRcdC5hdHRyKFwiZFwiLCBmdW5jdGlvbihfZCkgeyB7XG5cdFx0XHRsZXQgZHggPSAtKG9wdHMuc3ltYm9sX3NpemUgKiAwLjY2KTtcblx0XHRcdGxldCBkeSA9IC0ob3B0cy5zeW1ib2xfc2l6ZSAqIDAuNjQpO1xuXHRcdFx0bGV0IGluZGVudCA9IG9wdHMuc3ltYm9sX3NpemUvNDtcblx0XHRcdHJldHVybiBnZXRfYnJhY2tldChkeCwgZHksIGluZGVudCwgb3B0cykrZ2V0X2JyYWNrZXQoLWR4LCBkeSwgLWluZGVudCwgb3B0cyk7XG5cdFx0XHR9fSlcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHJldHVybiBkLmRhdGEuYWdlICYmIGQuZGF0YS55b2IgJiYgIWQuZGF0YS5leGNsdWRlID8gXCIjMzAzMDMwXCIgOiBcImdyZXlcIjtcblx0XHR9KVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoX2QpIHtcblx0XHRcdHJldHVybiBcIi4xZW1cIjtcblx0XHR9KVxuXHRcdC5zdHlsZShcInN0cm9rZS1kYXNoYXJyYXlcIiwgZnVuY3Rpb24gKGQpIHtyZXR1cm4gIWQuZGF0YS5leGNsdWRlID8gbnVsbCA6IChcIjMsIDNcIik7fSlcblx0XHQuc3R5bGUoXCJmaWxsXCIsIFwibm9uZVwiKTtcblxuXG5cdC8vIGFsaXZlIHN0YXR1cyA9IDA7IGRlYWQgc3RhdHVzID0gMVxuXHRub2RlLmFwcGVuZCgnbGluZScpXG5cdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge3JldHVybiBkLmRhdGEuc3RhdHVzID09IDE7fSlcblx0XHRcdC5zdHlsZShcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdFx0XHQuYXR0cihcIngxXCIsIGZ1bmN0aW9uKF9kLCBfaSkge3JldHVybiAtMC42Km9wdHMuc3ltYm9sX3NpemU7fSlcblx0XHRcdC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIDAuNipvcHRzLnN5bWJvbF9zaXplO30pXG5cdFx0XHQuYXR0cihcIngyXCIsIGZ1bmN0aW9uKF9kLCBfaSkge3JldHVybiAwLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KVxuXHRcdFx0LmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gLTAuNipvcHRzLnN5bWJvbF9zaXplO30pO1xuXG5cdC8vIG5hbWVzIG9mIGluZGl2aWR1YWxzXG5cdGFkZExhYmVsKG9wdHMsIG5vZGUsIFwiLjI1ZW1cIiwgLSgwLjQgKiBvcHRzLnN5bWJvbF9zaXplKSwgLSgwLjEgKiBvcHRzLnN5bWJvbF9zaXplKSxcblx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0XHRyZXR1cm4gKCdkaXNwbGF5X25hbWUnIGluIGQuZGF0YSA/IGQuZGF0YS5kaXNwbGF5X25hbWUgOiBkLmRhdGEubmFtZSkgKyAnICAnICsgZC5kYXRhLmlkO1xuXHRcdFx0XHRyZXR1cm4gJ2Rpc3BsYXlfbmFtZScgaW4gZC5kYXRhID8gZC5kYXRhLmRpc3BsYXlfbmFtZSA6ICcnO30pO1xuXG4vKlxuICogbGV0IHdhcm4gPSBub2RlLmZpbHRlcihmdW5jdGlvbiAoZCkgeyByZXR1cm4gKCFkLmRhdGEuYWdlIHx8ICFkLmRhdGEueW9iKSAmJiAhZC5kYXRhLmhpZGRlbjsgfSkuYXBwZW5kKFwidGV4dFwiKSAuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuICogLmF0dHIoXCJ4XCIsIFwiLjI1ZW1cIikgLmF0dHIoXCJ5XCIsIC0oMC40ICogb3B0cy5zeW1ib2xfc2l6ZSksIC0oMC4yICogb3B0cy5zeW1ib2xfc2l6ZSkpIC5odG1sKFwiXFx1ZjA3MVwiKTsgd2Fybi5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImluY29tcGxldGVcIik7XG4gKi9cblxuXHRsZXQgZm9udF9zaXplID0gcGFyc2VJbnQoZ2V0UHgob3B0cykpICsgNDtcblx0Ly8gZGlzcGxheSBsYWJlbCBkZWZpbmVkIGluIG9wdHMubGFiZWxzIGUuZy4gYWxsZWxlcy9nZW5vdHlwZSBkYXRhXG5cdGZvcihsZXQgaWxhYj0wOyBpbGFiPG9wdHMubGFiZWxzLmxlbmd0aDsgaWxhYisrKSB7XG5cdFx0bGV0IGxhYmVsID0gb3B0cy5sYWJlbHNbaWxhYl07XG5cdFx0YWRkTGFiZWwob3B0cywgbm9kZSwgXCIuMjVlbVwiLCAtKDAuNyAqIG9wdHMuc3ltYm9sX3NpemUpLFxuXHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZighZC5kYXRhW2xhYmVsXSlcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdGQueV9vZmZzZXQgPSAoaWxhYiA9PT0gMCB8fCAhZC55X29mZnNldCA/IGZvbnRfc2l6ZSoyLjI1IDogZC55X29mZnNldCtmb250X3NpemUpO1xuXHRcdFx0XHRyZXR1cm4gZC55X29mZnNldDtcblx0XHRcdH0sXG5cdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKGQuZGF0YVtsYWJlbF0pIHtcblx0XHRcdFx0XHRpZihsYWJlbCA9PT0gJ2FsbGVsZXMnKSB7XG5cdFx0XHRcdFx0XHRsZXQgYWxsZWxlcyA9IFwiXCI7XG5cdFx0XHRcdFx0XHRsZXQgdmFycyA9IGQuZGF0YS5hbGxlbGVzLnNwbGl0KCc7Jyk7XG5cdFx0XHRcdFx0XHRmb3IobGV0IGl2YXIgPSAwO2l2YXIgPCB2YXJzLmxlbmd0aDtpdmFyKyspIHtcblx0XHRcdFx0XHRcdFx0aWYodmFyc1tpdmFyXSAhPT0gXCJcIikgYWxsZWxlcyArPSB2YXJzW2l2YXJdICsgJzsnO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIGFsbGVsZXM7XG5cdFx0XHRcdFx0fSBlbHNlIGlmKGxhYmVsID09PSAnYWdlJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGQuZGF0YVtsYWJlbF0gKyd5Jztcblx0XHRcdFx0XHR9IGVsc2UgaWYobGFiZWwgPT09ICdzdGlsbGJpcnRoJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwiU0JcIjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGQuZGF0YVtsYWJlbF07XG5cdFx0XHRcdH1cblx0XHRcdH0sICdpbmRpX2RldGFpbHMnKTtcblx0fVxuXG5cdC8vIGluZGl2aWR1YWxzIGRpc2Vhc2UgZGV0YWlsc1xuXHRmb3IobGV0IGk9MDtpPG9wdHMuZGlzZWFzZXMubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgZGlzZWFzZSA9IG9wdHMuZGlzZWFzZXNbaV0udHlwZTtcblx0XHRhZGRMYWJlbChvcHRzLCBub2RlLCBcIi4yNWVtXCIsIC0ob3B0cy5zeW1ib2xfc2l6ZSksXG5cdFx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0XHRsZXQgeV9vZmZzZXQgPSAoZC55X29mZnNldCA/IGQueV9vZmZzZXQrZm9udF9zaXplOiBmb250X3NpemUqMi4yKTtcblx0XHRcdFx0XHRmb3IobGV0IGo9MDtqPG9wdHMuZGlzZWFzZXMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRcdGlmKGRpc2Vhc2UgPT09IG9wdHMuZGlzZWFzZXNbal0udHlwZSlcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRpZihwcmVmaXhJbk9iaihvcHRzLmRpc2Vhc2VzW2pdLnR5cGUsIGQuZGF0YSkpXG5cdFx0XHRcdFx0XHRcdHlfb2Zmc2V0ICs9IGZvbnRfc2l6ZS0xO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4geV9vZmZzZXQ7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0XHRsZXQgZGlzID0gZGlzZWFzZS5yZXBsYWNlKCdfJywgJyAnKS5yZXBsYWNlKCdjYW5jZXInLCAnY2EuJyk7XG5cdFx0XHRcdFx0cmV0dXJuIGRpc2Vhc2UrJ19kaWFnbm9zaXNfYWdlJyBpbiBkLmRhdGEgPyBkaXMgK1wiOiBcIisgZC5kYXRhW2Rpc2Vhc2UrJ19kaWFnbm9zaXNfYWdlJ10gOiAnJztcblx0XHRcdFx0fSwgJ2luZGlfZGV0YWlscycpO1xuXHR9XG5cblx0Ly9cblx0YWRkV2lkZ2V0cyhvcHRzLCBub2RlKTtcblxuXHQvLyBsaW5rcyBiZXR3ZWVuIHBhcnRuZXJzXG5cdGxldCBjbGFzaF9kZXB0aCA9IHt9O1xuXHRcblx0Ly8gZ2V0IHBhdGggbG9vcGluZyBvdmVyIG5vZGUocylcblx0bGV0IGRyYXdfcGF0aCA9IGZ1bmN0aW9uKGNsYXNoLCBkeCwgZHkxLCBkeTIsIHBhcmVudF9ub2RlLCBjc2hpZnQpIHtcblx0XHRsZXQgZXh0ZW5kID0gZnVuY3Rpb24oaSwgbCkge1xuXHRcdFx0aWYoaSsxIDwgbCkgICAvLyAmJiBNYXRoLmFicyhjbGFzaFtpXSAtIGNsYXNoW2krMV0pIDwgKG9wdHMuc3ltYm9sX3NpemUqMS4yNSlcblx0XHRcdFx0cmV0dXJuIGV4dGVuZCgrK2kpO1xuXHRcdFx0cmV0dXJuIGk7XG5cdFx0fTtcblx0XHRsZXQgcGF0aCA9IFwiXCI7XG5cdFx0Zm9yKGxldCBqPTA7IGo8Y2xhc2gubGVuZ3RoOyBqKyspIHtcblx0XHRcdGxldCBrID0gZXh0ZW5kKGosIGNsYXNoLmxlbmd0aCk7XG5cdFx0XHRsZXQgZHgxID0gY2xhc2hbal0gLSBkeCAtIGNzaGlmdDtcblx0XHRcdGxldCBkeDIgPSBjbGFzaFtrXSArIGR4ICsgY3NoaWZ0O1xuXHRcdFx0aWYocGFyZW50X25vZGUueCA+IGR4MSAmJiBwYXJlbnRfbm9kZS54IDwgZHgyKVxuXHRcdFx0XHRwYXJlbnRfbm9kZS55ID0gZHkyO1xuXG5cdFx0XHRwYXRoICs9IFwiTFwiICsgZHgxICsgXCIsXCIgKyAgKGR5MSAtIGNzaGlmdCkgK1xuXHRcdFx0XHRcdFwiTFwiICsgZHgxICsgXCIsXCIgKyAgKGR5MiAtIGNzaGlmdCkgK1xuXHRcdFx0XHRcdFwiTFwiICsgZHgyICsgXCIsXCIgKyAgKGR5MiAtIGNzaGlmdCkgK1xuXHRcdFx0XHRcdFwiTFwiICsgZHgyICsgXCIsXCIgKyAgKGR5MSAtIGNzaGlmdCk7XG5cdFx0XHRqID0gaztcblx0XHR9XG5cdFx0cmV0dXJuIHBhdGg7XG5cdH1cblx0XG5cdFxuXHRwYXJ0bmVycyA9IHBlZC5zZWxlY3RBbGwoXCIucGFydG5lclwiKVxuXHRcdC5kYXRhKHB0ckxpbmtOb2Rlcylcblx0XHQuZW50ZXIoKVxuXHRcdFx0Lmluc2VydChcInBhdGhcIiwgXCJnXCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG5cdFx0XHQuYXR0cihcInN0cm9rZVwiLCBcIiMwMDBcIilcblx0XHRcdC5hdHRyKFwic2hhcGUtcmVuZGVyaW5nXCIsIFwiYXV0b1wiKVxuXHRcdFx0LmF0dHIoJ2QnLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRsZXQgbm9kZTEgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5tb3RoZXIuZGF0YS5uYW1lKTtcblx0XHRcdFx0bGV0IG5vZGUyID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGQuZmF0aGVyLmRhdGEubmFtZSk7XG5cdFx0XHRcdGxldCBjb25zYW5ndWl0eSA9IHBlZGlncmVlX3V0aWxzLmNvbnNhbmd1aXR5KG5vZGUxLCBub2RlMiwgb3B0cyk7XG5cdFx0XHRcdGxldCBkaXZvcmNlZCA9IChkLm1vdGhlci5kYXRhLmRpdm9yY2VkICYmICBkLm1vdGhlci5kYXRhLmRpdm9yY2VkID09PSBkLmZhdGhlci5kYXRhLm5hbWUpO1xuXG5cdFx0XHRcdGxldCB4MSA9IChkLm1vdGhlci54IDwgZC5mYXRoZXIueCA/IGQubW90aGVyLnggOiBkLmZhdGhlci54KTtcblx0XHRcdFx0bGV0IHgyID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5mYXRoZXIueCA6IGQubW90aGVyLngpO1xuXHRcdFx0XHRsZXQgZHkxID0gZC5tb3RoZXIueTtcblx0XHRcdFx0bGV0IGR5MiwgZHgsIHBhcmVudF9ub2RlO1xuXG5cdFx0XHRcdC8vIGlkZW50aWZ5IGNsYXNoZXMgd2l0aCBvdGhlciBub2RlcyBhdCB0aGUgc2FtZSBkZXB0aFxuXHRcdFx0XHRsZXQgY2xhc2ggPSBjaGVja19wdHJfbGlua19jbGFzaGVzKG9wdHMsIGQpO1xuXHRcdFx0XHRsZXQgcGF0aCA9IFwiXCI7XG5cdFx0XHRcdGlmKGNsYXNoKSB7XG5cdFx0XHRcdFx0aWYoZC5tb3RoZXIuZGVwdGggaW4gY2xhc2hfZGVwdGgpXG5cdFx0XHRcdFx0XHRjbGFzaF9kZXB0aFtkLm1vdGhlci5kZXB0aF0gKz0gNDtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRjbGFzaF9kZXB0aFtkLm1vdGhlci5kZXB0aF0gPSA0O1xuXG5cdFx0XHRcdFx0ZHkxIC09IGNsYXNoX2RlcHRoW2QubW90aGVyLmRlcHRoXTtcblx0XHRcdFx0XHRkeCA9IGNsYXNoX2RlcHRoW2QubW90aGVyLmRlcHRoXSArIG9wdHMuc3ltYm9sX3NpemUvMiArIDI7XG5cblx0XHRcdFx0XHRsZXQgcGFyZW50X25vZGVzID0gZC5tb3RoZXIuZGF0YS5wYXJlbnRfbm9kZTtcblx0XHRcdFx0XHRsZXQgcGFyZW50X25vZGVfbmFtZSA9IHBhcmVudF9ub2Rlc1swXTtcblx0XHRcdFx0XHRmb3IobGV0IGlpPTA7IGlpPHBhcmVudF9ub2Rlcy5sZW5ndGg7IGlpKyspIHtcblx0XHRcdFx0XHRcdGlmKHBhcmVudF9ub2Rlc1tpaV0uZmF0aGVyLm5hbWUgPT09IGQuZmF0aGVyLmRhdGEubmFtZSAmJlxuXHRcdFx0XHRcdFx0ICAgcGFyZW50X25vZGVzW2lpXS5tb3RoZXIubmFtZSA9PT0gZC5tb3RoZXIuZGF0YS5uYW1lKVxuXHRcdFx0XHRcdFx0XHRwYXJlbnRfbm9kZV9uYW1lID0gcGFyZW50X25vZGVzW2lpXS5uYW1lO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwYXJlbnRfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBwYXJlbnRfbm9kZV9uYW1lKTtcblx0XHRcdFx0XHRwYXJlbnRfbm9kZS55ID0gZHkxOyAvLyBhZGp1c3QgaGd0IG9mIHBhcmVudCBub2RlXG5cdFx0XHRcdFx0Y2xhc2guc29ydChmdW5jdGlvbiAoYSxiKSB7cmV0dXJuIGEgLSBiO30pO1xuXG5cdFx0XHRcdFx0ZHkyID0gKGR5MS1vcHRzLnN5bWJvbF9zaXplLzItMyk7XG5cdFx0XHRcdFx0cGF0aCA9IGRyYXdfcGF0aChjbGFzaCwgZHgsIGR5MSwgZHkyLCBwYXJlbnRfbm9kZSwgMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgZGl2b3JjZV9wYXRoID0gXCJcIjtcblx0XHRcdFx0aWYoZGl2b3JjZWQgJiYgIWNsYXNoKVxuXHRcdFx0XHRcdGRpdm9yY2VfcGF0aCA9IFwiTVwiICsgKHgxKygoeDIteDEpKi42NikrNikgKyBcIixcIiArIChkeTEtNikgK1xuXHRcdFx0XHRcdFx0XHRcdCAgIFwiTFwiKyAgKHgxKygoeDIteDEpKi42NiktNikgKyBcIixcIiArIChkeTErNikgK1xuXHRcdFx0XHRcdFx0XHRcdCAgIFwiTVwiICsgKHgxKygoeDIteDEpKi42NikrMTApICsgXCIsXCIgKyAoZHkxLTYpICtcblx0XHRcdFx0XHRcdFx0XHQgICBcIkxcIisgICh4MSsoKHgyLXgxKSouNjYpLTIpICArIFwiLFwiICsgKGR5MSs2KTtcblx0XHRcdFx0aWYoY29uc2FuZ3VpdHkpIHsgIC8vIGNvbnNhbmd1aW5vdXMsIGRyYXcgZG91YmxlIGxpbmUgYmV0d2VlbiBwYXJ0bmVyc1xuXHRcdFx0XHRcdGR5MSA9IChkLm1vdGhlci54IDwgZC5mYXRoZXIueCA/IGQubW90aGVyLnkgOiBkLmZhdGhlci55KTtcblx0XHRcdFx0XHRkeTIgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLmZhdGhlci55IDogZC5tb3RoZXIueSk7XG5cblx0XHRcdFx0XHRsZXQgY3NoaWZ0ID0gMztcblx0XHRcdFx0XHRpZihNYXRoLmFicyhkeTEtZHkyKSA+IDAuMSkge1x0ICAvLyBESUZGRVJFTlQgTEVWRUxcblx0XHRcdFx0XHRcdHJldHVyblx0XCJNXCIgKyB4MSArIFwiLFwiICsgZHkxICsgXCJMXCIgKyB4MiArIFwiLFwiICsgZHkyICtcblx0XHRcdFx0XHRcdFx0XHRcIk1cIiArIHgxICsgXCIsXCIgKyAoZHkxIC0gY3NoaWZ0KSArIFwiTFwiICsgeDIgKyBcIixcIiArIChkeTIgLSBjc2hpZnQpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XHRcdFx0XHRcdFx0ICAgLy8gU0FNRSBMRVZFTFxuXHRcdFx0XHRcdFx0bGV0IHBhdGgyID0gKGNsYXNoID8gZHJhd19wYXRoKGNsYXNoLCBkeCwgZHkxLCBkeTIsIHBhcmVudF9ub2RlLCBjc2hpZnQpIDogXCJcIik7XG5cdFx0XHRcdFx0XHRyZXR1cm5cdFwiTVwiICsgeDEgKyBcIixcIiArIGR5MSArIHBhdGggKyBcIkxcIiArIHgyICsgXCIsXCIgKyBkeTEgK1xuXHRcdFx0XHRcdFx0XHRcdFwiTVwiICsgeDEgKyBcIixcIiArIChkeTEgLSBjc2hpZnQpICsgcGF0aDIgKyBcIkxcIiArIHgyICsgXCIsXCIgKyAoZHkxIC0gY3NoaWZ0KSArIGRpdm9yY2VfcGF0aDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuXHRcIk1cIiArIHgxICsgXCIsXCIgKyBkeTEgKyBwYXRoICsgXCJMXCIgKyB4MiArIFwiLFwiICsgZHkxICsgZGl2b3JjZV9wYXRoO1xuXHRcdFx0fSk7XG5cblx0Ly8gbGlua3MgdG8gY2hpbGRyZW5cblx0cGVkLnNlbGVjdEFsbChcIi5saW5rXCIpXG5cdFx0LmRhdGEocm9vdC5saW5rcyhub2Rlcy5kZXNjZW5kYW50cygpKSlcblx0XHQuZW50ZXIoKVxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHQvLyBmaWx0ZXIgdW5sZXNzIGRlYnVnIGlzIHNldFxuXHRcdFx0XHRyZXR1cm4gKG9wdHMuREVCVUcgfHxcblx0XHRcdFx0XHRcdChkLnRhcmdldC5kYXRhLm5vcGFyZW50cyA9PT0gdW5kZWZpbmVkICYmIGQuc291cmNlLnBhcmVudCAhPT0gbnVsbCAmJiAhZC50YXJnZXQuZGF0YS5oaWRkZW4pKTtcblx0XHRcdH0pXG5cdFx0XHQuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcblx0XHRcdC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKGQudGFyZ2V0LmRhdGEubm9wYXJlbnRzICE9PSB1bmRlZmluZWQgfHwgZC5zb3VyY2UucGFyZW50ID09PSBudWxsIHx8IGQudGFyZ2V0LmRhdGEuaGlkZGVuKVxuXHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHRyZXR1cm4gKG9wdHMuREVCVUcgPyAyIDogMSk7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJzdHJva2VcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5ub3BhcmVudHMgIT09IHVuZGVmaW5lZCB8fCBkLnNvdXJjZS5wYXJlbnQgPT09IG51bGwgfHwgZC50YXJnZXQuZGF0YS5oaWRkZW4pXG5cdFx0XHRcdFx0cmV0dXJuICdwaW5rJztcblx0XHRcdFx0cmV0dXJuIFwiIzAwMFwiO1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZighZC50YXJnZXQuZGF0YS5hZG9wdGVkX2luKSByZXR1cm4gbnVsbDtcblx0XHRcdFx0bGV0IGRhc2hfbGVuID0gTWF0aC5hYnMoZC5zb3VyY2UueS0oKGQuc291cmNlLnkgKyBkLnRhcmdldC55KSAvIDIpKTtcblx0XHRcdFx0bGV0IGRhc2hfYXJyYXkgPSBbZGFzaF9sZW4sIDAsIE1hdGguYWJzKGQuc291cmNlLngtZC50YXJnZXQueCksIDBdO1xuXHRcdFx0XHRsZXQgdHdpbnMgPSBwZWRpZ3JlZV91dGlscy5nZXRUd2lucyhvcHRzLmRhdGFzZXQsIGQudGFyZ2V0LmRhdGEpO1xuXHRcdFx0XHRpZih0d2lucy5sZW5ndGggPj0gMSkgZGFzaF9sZW4gPSBkYXNoX2xlbiAqIDM7XG5cdFx0XHRcdGZvcihsZXQgdXNlZGxlbiA9IDA7IHVzZWRsZW4gPCBkYXNoX2xlbjsgdXNlZGxlbiArPSAxMClcblx0XHRcdFx0XHQkLm1lcmdlKGRhc2hfYXJyYXksIFs1LCA1XSk7XG5cdFx0XHRcdHJldHVybiBkYXNoX2FycmF5O1xuXHRcdFx0fSlcblx0XHRcdC5hdHRyKFwic2hhcGUtcmVuZGVyaW5nXCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKGQudGFyZ2V0LmRhdGEubXp0d2luIHx8IGQudGFyZ2V0LmRhdGEuZHp0d2luKVxuXHRcdFx0XHRcdHJldHVybiBcImdlb21ldHJpY1ByZWNpc2lvblwiO1xuXHRcdFx0XHRyZXR1cm4gXCJhdXRvXCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJkXCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKGQudGFyZ2V0LmRhdGEubXp0d2luIHx8IGQudGFyZ2V0LmRhdGEuZHp0d2luKSB7XG5cdFx0XHRcdFx0Ly8gZ2V0IHR3aW4gcG9zaXRpb25cblx0XHRcdFx0XHRsZXQgdHdpbnMgPSBwZWRpZ3JlZV91dGlscy5nZXRUd2lucyhvcHRzLmRhdGFzZXQsIGQudGFyZ2V0LmRhdGEpO1xuXHRcdFx0XHRcdGlmKHR3aW5zLmxlbmd0aCA+PSAxKSB7XG5cdFx0XHRcdFx0XHRsZXQgdHdpbnggPSAwO1xuXHRcdFx0XHRcdFx0bGV0IHhtaW4gPSBkLnRhcmdldC54O1xuXHRcdFx0XHRcdFx0bGV0IHhtYXggPSBkLnRhcmdldC54O1xuXHRcdFx0XHRcdFx0Zm9yKGxldCB0PTA7IHQ8dHdpbnMubGVuZ3RoOyB0KyspIHtcblx0XHRcdFx0XHRcdFx0bGV0IHRoaXN4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHR3aW5zW3RdLm5hbWUpLng7XG5cdFx0XHRcdFx0XHRcdGlmKHhtaW4gPiB0aGlzeCkgeG1pbiA9IHRoaXN4O1xuXHRcdFx0XHRcdFx0XHRpZih4bWF4IDwgdGhpc3gpIHhtYXggPSB0aGlzeDtcblx0XHRcdFx0XHRcdFx0dHdpbnggKz0gdGhpc3g7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGxldCB4bWlkID0gKChkLnRhcmdldC54ICsgdHdpbngpIC8gKHR3aW5zLmxlbmd0aCsxKSk7XG5cdFx0XHRcdFx0XHRsZXQgeW1pZCA9ICgoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpIC8gMik7XG5cblx0XHRcdFx0XHRcdGxldCB4aGJhciA9IFwiXCI7XG5cdFx0XHRcdFx0XHRpZih4bWluID09PSBkLnRhcmdldC54ICYmIGQudGFyZ2V0LmRhdGEubXp0d2luKSB7XG5cdFx0XHRcdFx0XHRcdC8vIGhvcml6b250YWwgYmFyIGZvciBtenR3aW5zXG5cdFx0XHRcdFx0XHRcdGxldCB4eCA9ICh4bWlkICsgZC50YXJnZXQueCkvMjtcblx0XHRcdFx0XHRcdFx0bGV0IHl5ID0gKHltaWQgKyAoZC50YXJnZXQueS1vcHRzLnN5bWJvbF9zaXplLzIpKS8yO1xuXHRcdFx0XHRcdFx0XHR4aGJhciA9IFwiTVwiICsgeHggKyBcIixcIiArIHl5ICtcblx0XHRcdFx0XHRcdFx0XHRcdFwiTFwiICsgKHhtaWQgKyAoeG1pZC14eCkpICsgXCIgXCIgKyB5eTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIFwiTVwiICsgKGQuc291cmNlLngpICsgXCIsXCIgKyAoZC5zb3VyY2UueSApICtcblx0XHRcdFx0XHRcdFx0ICAgXCJWXCIgKyB5bWlkICtcblx0XHRcdFx0XHRcdFx0ICAgXCJIXCIgKyB4bWlkICtcblx0XHRcdFx0XHRcdFx0ICAgXCJMXCIgKyAoZC50YXJnZXQueCkgKyBcIiBcIiArIChkLnRhcmdldC55LW9wdHMuc3ltYm9sX3NpemUvMikgK1xuXHRcdFx0XHRcdFx0XHQgICB4aGJhcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihkLnNvdXJjZS5kYXRhLm1vdGhlcikgeyAgIC8vIGNoZWNrIHBhcmVudHMgZGVwdGggdG8gc2VlIGlmIHRoZXkgYXJlIGF0IHRoZSBzYW1lIGxldmVsIGluIHRoZSB0cmVlXG5cdFx0XHRcdFx0bGV0IG1hID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGQuc291cmNlLmRhdGEubW90aGVyLm5hbWUpO1xuXHRcdFx0XHRcdGxldCBwYSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLnNvdXJjZS5kYXRhLmZhdGhlci5uYW1lKTtcblxuXHRcdFx0XHRcdGlmKG1hLmRlcHRoICE9PSBwYS5kZXB0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwiTVwiICsgKGQuc291cmNlLngpICsgXCIsXCIgKyAoKG1hLnkgKyBwYS55KSAvIDIpICtcblx0XHRcdFx0XHRcdFx0ICAgXCJIXCIgKyAoZC50YXJnZXQueCkgK1xuXHRcdFx0XHRcdFx0XHQgICBcIlZcIiArIChkLnRhcmdldC55KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gXCJNXCIgKyAoZC5zb3VyY2UueCkgKyBcIixcIiArIChkLnNvdXJjZS55ICkgK1xuXHRcdFx0XHRcdCAgIFwiVlwiICsgKChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkgLyAyKSArXG5cdFx0XHRcdFx0ICAgXCJIXCIgKyAoZC50YXJnZXQueCkgK1xuXHRcdFx0XHRcdCAgIFwiVlwiICsgKGQudGFyZ2V0LnkpO1xuXHRcdFx0fSk7XG5cblx0Ly8gZHJhdyBwcm9iYW5kIGFycm93XG5cdGxldCBwcm9iYW5kSWR4ICA9IHBlZGlncmVlX3V0aWxzLmdldFByb2JhbmRJbmRleChvcHRzLmRhdGFzZXQpO1xuXHRpZih0eXBlb2YgcHJvYmFuZElkeCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRsZXQgcHJvYmFuZE5vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2Rlcywgb3B0cy5kYXRhc2V0W3Byb2JhbmRJZHhdLm5hbWUpO1xuXHRcdGxldCB0cmlpZCA9IFwidHJpYW5nbGVcIitwZWRpZ3JlZV91dGlscy5tYWtlaWQoMyk7XG5cdFx0cGVkLmFwcGVuZChcInN2ZzpkZWZzXCIpLmFwcGVuZChcInN2ZzptYXJrZXJcIilcdC8vIGFycm93IGhlYWRcblx0XHRcdC5hdHRyKFwiaWRcIiwgdHJpaWQpXG5cdFx0XHQuYXR0cihcInJlZlhcIiwgNilcblx0XHRcdC5hdHRyKFwicmVmWVwiLCA2KVxuXHRcdFx0LmF0dHIoXCJtYXJrZXJXaWR0aFwiLCAyMClcblx0XHRcdC5hdHRyKFwibWFya2VySGVpZ2h0XCIsIDIwKVxuXHRcdFx0LmF0dHIoXCJvcmllbnRcIiwgXCJhdXRvXCIpXG5cdFx0XHQuYXBwZW5kKFwicGF0aFwiKVxuXHRcdFx0LmF0dHIoXCJkXCIsIFwiTSAwIDAgMTIgNiAwIDEyIDMgNlwiKVxuXHRcdFx0LnN0eWxlKFwiZmlsbFwiLCBcImJsYWNrXCIpO1xuXG5cdFx0cGVkLmFwcGVuZChcImxpbmVcIilcblx0XHRcdC5hdHRyKFwieDFcIiwgcHJvYmFuZE5vZGUueC1vcHRzLnN5bWJvbF9zaXplKVxuXHRcdFx0LmF0dHIoXCJ5MVwiLCBwcm9iYW5kTm9kZS55K29wdHMuc3ltYm9sX3NpemUpXG5cdFx0XHQuYXR0cihcIngyXCIsIHByb2JhbmROb2RlLngtb3B0cy5zeW1ib2xfc2l6ZS8yKVxuXHRcdFx0LmF0dHIoXCJ5MlwiLCBwcm9iYW5kTm9kZS55K29wdHMuc3ltYm9sX3NpemUvMilcblx0XHRcdC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG5cdFx0XHQuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG5cdFx0XHQuYXR0cihcIm1hcmtlci1lbmRcIiwgXCJ1cmwoI1wiK3RyaWlkK1wiKVwiKTtcblx0fVxuXHQvLyBkcmFnIGFuZCB6b29tXG5cdHpvb20gPSBkMy56b29tKClcblx0ICAuc2NhbGVFeHRlbnQoW29wdHMuem9vbUluLCBvcHRzLnpvb21PdXRdKVxuXHQgIC5vbignem9vbScsIHpvb21Gbik7XG5cblx0ZnVuY3Rpb24gem9vbUZuKGV2ZW50KSB7XG5cdFx0bGV0IHQgPSBldmVudC50cmFuc2Zvcm07XG5cdFx0aWYocGVkaWdyZWVfdXRpbHMuaXNJRSgpICYmIHQueC50b1N0cmluZygpLmxlbmd0aCA+IDEwKVx0Ly8gSUUgZml4IGZvciBkcmFnIG9mZiBzY3JlZW5cblx0XHRcdHJldHVybjtcblx0XHRsZXQgcG9zID0gWyh0LnggKyBwYXJzZUludCh4dHJhbnNmb3JtKSksICh0LnkgKyBwYXJzZUludCh5dHJhbnNmb3JtKSldO1xuXHRcdGlmKHQuayA9PSAxKSB7XG5cdFx0XHRwZWRjYWNoZS5zZXRwb3NpdGlvbihvcHRzLCBwb3NbMF0sIHBvc1sxXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBlZGNhY2hlLnNldHBvc2l0aW9uKG9wdHMsIHBvc1swXSwgcG9zWzFdLCB0LmspO1xuXHRcdH1cblx0XHRwZWQuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgcG9zWzBdICsgJywnICsgcG9zWzFdICsgJykgc2NhbGUoJyArIHQuayArICcpJyk7XG5cdH1cblx0c3ZnLmNhbGwoem9vbSk7XG5cdHJldHVybiBvcHRzO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVfZXJyKGVycikge1xuXHRjb25zb2xlLmVycm9yKGVycik7XG5cdHJldHVybiBuZXcgRXJyb3IoZXJyKTtcbn1cblxuLy8gdmFsaWRhdGUgcGVkaWdyZWUgZGF0YVxuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlX3BlZGlncmVlKG9wdHMpe1xuXHRpZihvcHRzLnZhbGlkYXRlKSB7XG5cdFx0aWYgKHR5cGVvZiBvcHRzLnZhbGlkYXRlID09ICdmdW5jdGlvbicpIHtcblx0XHRcdGlmKG9wdHMuREVCVUcpXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdDQUxMSU5HIENPTkZJR1VSRUQgVkFMSURBVElPTiBGVU5DVElPTicpO1xuXHRcdFx0cmV0dXJuIG9wdHMudmFsaWRhdGUuY2FsbCh0aGlzLCBvcHRzKTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBjb25zaXN0ZW5jeSBvZiBwYXJlbnRzIHNleFxuXHRcdGxldCB1bmlxdWVuYW1lcyA9IFtdO1xuXHRcdGxldCBmYW1pZHMgPSBbXTtcblx0XHRsZXQgZGlzcGxheV9uYW1lO1xuXHRcdGZvcihsZXQgcD0wOyBwPG9wdHMuZGF0YXNldC5sZW5ndGg7IHArKykge1xuXHRcdFx0aWYoIXAuaGlkZGVuKSB7XG5cdFx0XHRcdGlmKG9wdHMuZGF0YXNldFtwXS5tb3RoZXIgfHwgb3B0cy5kYXRhc2V0W3BdLmZhdGhlcikge1xuXHRcdFx0XHRcdGRpc3BsYXlfbmFtZSA9IG9wdHMuZGF0YXNldFtwXS5kaXNwbGF5X25hbWU7XG5cdFx0XHRcdFx0aWYoIWRpc3BsYXlfbmFtZSlcblx0XHRcdFx0XHRcdGRpc3BsYXlfbmFtZSA9ICd1bm5hbWVkJztcblx0XHRcdFx0XHRkaXNwbGF5X25hbWUgKz0gJyAoSW5kaXZJRDogJytvcHRzLmRhdGFzZXRbcF0ubmFtZSsnKSc7XG5cdFx0XHRcdFx0bGV0IG1vdGhlciA9IG9wdHMuZGF0YXNldFtwXS5tb3RoZXI7XG5cdFx0XHRcdFx0bGV0IGZhdGhlciA9IG9wdHMuZGF0YXNldFtwXS5mYXRoZXI7XG5cdFx0XHRcdFx0aWYoIW1vdGhlciB8fCAhZmF0aGVyKSB7XG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdNaXNzaW5nIHBhcmVudCBmb3IgJytkaXNwbGF5X25hbWUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCBtaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKG9wdHMuZGF0YXNldCwgbW90aGVyKTtcblx0XHRcdFx0XHRsZXQgZmlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIGZhdGhlcik7XG5cdFx0XHRcdFx0aWYobWlkeCA9PT0gLTEpXG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdUaGUgbW90aGVyIChJbmRpdklEOiAnK21vdGhlcisnKSBvZiBmYW1pbHkgbWVtYmVyICcrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCBkaXNwbGF5X25hbWUrJyBpcyBtaXNzaW5nIGZyb20gdGhlIHBlZGlncmVlLicpO1xuXHRcdFx0XHRcdGlmKGZpZHggPT09IC0xKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycignVGhlIGZhdGhlciAoSW5kaXZJRDogJytmYXRoZXIrJykgb2YgZmFtaWx5IG1lbWJlciAnK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQgZGlzcGxheV9uYW1lKycgaXMgbWlzc2luZyBmcm9tIHRoZSBwZWRpZ3JlZS4nKTtcblx0XHRcdFx0XHRpZihvcHRzLmRhdGFzZXRbbWlkeF0uc2V4ICE9PSBcIkZcIilcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoXCJUaGUgbW90aGVyIG9mIGZhbWlseSBtZW1iZXIgXCIrZGlzcGxheV9uYW1lK1xuXHRcdFx0XHRcdFx0XHRcdFwiIGlzIG5vdCBzcGVjaWZpZWQgYXMgZmVtYWxlLiBBbGwgbW90aGVycyBpbiB0aGUgcGVkaWdyZWUgbXVzdCBoYXZlIHNleCBzcGVjaWZpZWQgYXMgJ0YnLlwiKTtcblx0XHRcdFx0XHRpZihvcHRzLmRhdGFzZXRbZmlkeF0uc2V4ICE9PSBcIk1cIilcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoXCJUaGUgZmF0aGVyIG9mIGZhbWlseSBtZW1iZXIgXCIrZGlzcGxheV9uYW1lK1xuXHRcdFx0XHRcdFx0XHRcdFwiIGlzIG5vdCBzcGVjaWZpZWQgYXMgbWFsZS4gQWxsIGZhdGhlcnMgaW4gdGhlIHBlZGlncmVlIG11c3QgaGF2ZSBzZXggc3BlY2lmaWVkIGFzICdNJy5cIik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0XG5cdFx0XHRpZighb3B0cy5kYXRhc2V0W3BdLm5hbWUpXG5cdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoZGlzcGxheV9uYW1lKycgaGFzIG5vIEluZGl2SUQuJyk7XG5cdFx0XHRpZigkLmluQXJyYXkob3B0cy5kYXRhc2V0W3BdLm5hbWUsIHVuaXF1ZW5hbWVzKSA+IC0xKVxuXHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdJbmRpdklEIGZvciBmYW1pbHkgbWVtYmVyICcrZGlzcGxheV9uYW1lKycgaXMgbm90IHVuaXF1ZS4nKTtcblx0XHRcdHVuaXF1ZW5hbWVzLnB1c2gob3B0cy5kYXRhc2V0W3BdLm5hbWUpO1xuXG5cdFx0XHRpZigkLmluQXJyYXkob3B0cy5kYXRhc2V0W3BdLmZhbWlkLCBmYW1pZHMpID09PSAtMSAmJiBvcHRzLmRhdGFzZXRbcF0uZmFtaWQpIHtcblx0XHRcdFx0ZmFtaWRzLnB1c2gob3B0cy5kYXRhc2V0W3BdLmZhbWlkKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZihmYW1pZHMubGVuZ3RoID4gMSkge1xuXHRcdFx0dGhyb3cgY3JlYXRlX2VycignTW9yZSB0aGFuIG9uZSBmYW1pbHkgZm91bmQ6ICcrZmFtaWRzLmpvaW4oXCIsIFwiKSsnLicpO1xuXHRcdH1cblx0XHQvLyB3YXJuIGlmIHRoZXJlIGlzIGEgYnJlYWsgaW4gdGhlIHBlZGlncmVlXG5cdFx0bGV0IHVjID0gcGVkaWdyZWVfdXRpbHMudW5jb25uZWN0ZWQob3B0cy5kYXRhc2V0KTtcblx0XHRpZih1Yy5sZW5ndGggPiAwKVxuXHRcdFx0Y29uc29sZS53YXJuKFwiaW5kaXZpZHVhbHMgdW5jb25uZWN0ZWQgdG8gcGVkaWdyZWUgXCIsIHVjKTtcblx0fVxufVxuXG4vL2Fkb3B0ZWQgaW4vb3V0IGJyYWNrZXRzXG5mdW5jdGlvbiBnZXRfYnJhY2tldChkeCwgZHksIGluZGVudCwgb3B0cykge1xuXHRyZXR1cm4gXHRcIk1cIiArIChkeCtpbmRlbnQpICsgXCIsXCIgKyBkeSArXG5cdFx0XHRcIkxcIiArIGR4ICsgXCIgXCIgKyBkeSArXG5cdFx0XHRcIkxcIiArIGR4ICsgXCIgXCIgKyAoZHkrKG9wdHMuc3ltYm9sX3NpemUgKiAgMS4yOCkpICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIChkeSsob3B0cy5zeW1ib2xfc2l6ZSAqICAxLjI4KSkgK1xuXHRcdFx0XCJMXCIgKyAoZHgraW5kZW50KSArIFwiLFwiICsgKGR5KyhvcHRzLnN5bWJvbF9zaXplICogIDEuMjgpKVxufVxuXG4vLyBjaGVjayBpZiB0aGUgb2JqZWN0IGNvbnRhaW5zIGEga2V5IHdpdGggYSBnaXZlbiBwcmVmaXhcbmZ1bmN0aW9uIHByZWZpeEluT2JqKHByZWZpeCwgb2JqKSB7XG5cdGxldCBmb3VuZCA9IGZhbHNlO1xuXHRpZihvYmopXG5cdFx0JC5lYWNoKG9iaiwgZnVuY3Rpb24oaywgX24pe1xuXHRcdFx0aWYoay5pbmRleE9mKHByZWZpeCtcIl9cIikgPT09IDAgfHwgayA9PT0gcHJlZml4KSB7XG5cdFx0XHRcdGZvdW5kID0gdHJ1ZTtcblx0XHRcdFx0cmV0dXJuIGZvdW5kO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRyZXR1cm4gZm91bmQ7XG59XG5cbi8vIGNoZWNrIGZvciBjcm9zc2luZyBvZiBwYXJ0bmVyIGxpbmVzXG5mdW5jdGlvbiBjaGVja19wdHJfbGlua3Mob3B0cywgcHRyTGlua05vZGVzKXtcblx0Zm9yKGxldCBhPTA7IGE8cHRyTGlua05vZGVzLmxlbmd0aDsgYSsrKSB7XG5cdFx0bGV0IGNsYXNoID0gY2hlY2tfcHRyX2xpbmtfY2xhc2hlcyhvcHRzLCBwdHJMaW5rTm9kZXNbYV0pO1xuXHRcdGlmKGNsYXNoKVxuXHRcdFx0Y29uc29sZS5sb2coXCJDTEFTSCA6OiBcIitwdHJMaW5rTm9kZXNbYV0ubW90aGVyLmRhdGEubmFtZStcIiBcIitwdHJMaW5rTm9kZXNbYV0uZmF0aGVyLmRhdGEubmFtZSwgY2xhc2gpO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja19wdHJfbGlua19jbGFzaGVzKG9wdHMsIGFub2RlKSB7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdHRlbk5vZGVzID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IG1vdGhlciwgZmF0aGVyO1xuXHRpZignbmFtZScgaW4gYW5vZGUpIHtcblx0XHRhbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBhbm9kZS5uYW1lKTtcblx0XHRpZighKCdtb3RoZXInIGluIGFub2RlLmRhdGEpKVxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0bW90aGVyID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGFub2RlLmRhdGEubW90aGVyKTtcblx0XHRmYXRoZXIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgYW5vZGUuZGF0YS5mYXRoZXIpO1xuXHR9IGVsc2Uge1xuXHRcdG1vdGhlciA9IGFub2RlLm1vdGhlcjtcblx0XHRmYXRoZXIgPSBhbm9kZS5mYXRoZXI7XG5cdH1cblxuXHRsZXQgeDEgPSAobW90aGVyLnggPCBmYXRoZXIueCA/IG1vdGhlci54IDogZmF0aGVyLngpO1xuXHRsZXQgeDIgPSAobW90aGVyLnggPCBmYXRoZXIueCA/IGZhdGhlci54IDogbW90aGVyLngpO1xuXHRsZXQgZHkgPSBtb3RoZXIueTtcblxuXHQvLyBpZGVudGlmeSBjbGFzaGVzIHdpdGggb3RoZXIgbm9kZXMgYXQgdGhlIHNhbWUgZGVwdGhcblx0bGV0IGNsYXNoID0gJC5tYXAoZmxhdHRlbk5vZGVzLCBmdW5jdGlvbihibm9kZSwgX2kpe1xuXHRcdHJldHVybiAhYm5vZGUuZGF0YS5oaWRkZW4gJiZcblx0XHRcdFx0Ym5vZGUuZGF0YS5uYW1lICE9PSBtb3RoZXIuZGF0YS5uYW1lICYmICBibm9kZS5kYXRhLm5hbWUgIT09IGZhdGhlci5kYXRhLm5hbWUgJiZcblx0XHRcdFx0Ym5vZGUueSA9PSBkeSAmJiBibm9kZS54ID4geDEgJiYgYm5vZGUueCA8IHgyID8gYm5vZGUueCA6IG51bGw7XG5cdH0pO1xuXHRyZXR1cm4gY2xhc2gubGVuZ3RoID4gMCA/IGNsYXNoIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0X3N2Z19kaW1lbnNpb25zKG9wdHMpIHtcblx0cmV0dXJuIHsnd2lkdGgnIDogKHBidXR0b25zLmlzX2Z1bGxzY3JlZW4oKT8gd2luZG93LmlubmVyV2lkdGggIDogb3B0cy53aWR0aCksXG5cdFx0XHQnaGVpZ2h0JzogKHBidXR0b25zLmlzX2Z1bGxzY3JlZW4oKT8gd2luZG93LmlubmVySGVpZ2h0IDogb3B0cy5oZWlnaHQpfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF90cmVlX2RpbWVuc2lvbnMob3B0cykge1xuXHQvLyAvIGdldCBzY29yZSBhdCBlYWNoIGRlcHRoIHVzZWQgdG8gYWRqdXN0IG5vZGUgc2VwYXJhdGlvblxuXHRsZXQgc3ZnX2RpbWVuc2lvbnMgPSBnZXRfc3ZnX2RpbWVuc2lvbnMob3B0cyk7XG5cdGxldCBtYXhzY29yZSA9IDA7XG5cdGxldCBnZW5lcmF0aW9uID0ge307XG5cdGZvcihsZXQgaT0wOyBpPG9wdHMuZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkZXB0aCA9IHBlZGlncmVlX3V0aWxzLmdldERlcHRoKG9wdHMuZGF0YXNldCwgb3B0cy5kYXRhc2V0W2ldLm5hbWUpO1xuXHRcdGxldCBjaGlsZHJlbiA9IHBlZGlncmVlX3V0aWxzLmdldEFsbENoaWxkcmVuKG9wdHMuZGF0YXNldCwgb3B0cy5kYXRhc2V0W2ldKTtcblxuXHRcdC8vIHNjb3JlIGJhc2VkIG9uIG5vLiBvZiBjaGlsZHJlbiBhbmQgaWYgcGFyZW50IGRlZmluZWRcblx0XHRsZXQgc2NvcmUgPSAxICsgKGNoaWxkcmVuLmxlbmd0aCA+IDAgPyAwLjU1KyhjaGlsZHJlbi5sZW5ndGgqMC4yNSkgOiAwKSArIChvcHRzLmRhdGFzZXRbaV0uZmF0aGVyID8gMC4yNSA6IDApO1xuXHRcdGlmKGRlcHRoIGluIGdlbmVyYXRpb24pXG5cdFx0XHRnZW5lcmF0aW9uW2RlcHRoXSArPSBzY29yZTtcblx0XHRlbHNlXG5cdFx0XHRnZW5lcmF0aW9uW2RlcHRoXSA9IHNjb3JlO1xuXG5cdFx0aWYoZ2VuZXJhdGlvbltkZXB0aF0gPiBtYXhzY29yZSlcblx0XHRcdG1heHNjb3JlID0gZ2VuZXJhdGlvbltkZXB0aF07XG5cdH1cblxuXHRsZXQgbWF4X2RlcHRoID0gT2JqZWN0LmtleXMoZ2VuZXJhdGlvbikubGVuZ3RoKm9wdHMuc3ltYm9sX3NpemUqMy41O1xuXHRsZXQgdHJlZV93aWR0aCA9ICAoc3ZnX2RpbWVuc2lvbnMud2lkdGggLSBvcHRzLnN5bWJvbF9zaXplID4gbWF4c2NvcmUqb3B0cy5zeW1ib2xfc2l6ZSoxLjY1ID9cblx0XHRcdFx0XHQgICBzdmdfZGltZW5zaW9ucy53aWR0aCAtIG9wdHMuc3ltYm9sX3NpemUgOiBtYXhzY29yZSpvcHRzLnN5bWJvbF9zaXplKjEuNjUpO1xuXHRsZXQgdHJlZV9oZWlnaHQgPSAoc3ZnX2RpbWVuc2lvbnMuaGVpZ2h0IC0gb3B0cy5zeW1ib2xfc2l6ZSA+IG1heF9kZXB0aCA/XG5cdFx0XHRcdFx0ICAgc3ZnX2RpbWVuc2lvbnMuaGVpZ2h0IC0gb3B0cy5zeW1ib2xfc2l6ZSA6IG1heF9kZXB0aCk7XG5cdHJldHVybiB7J3dpZHRoJzogdHJlZV93aWR0aCwgJ2hlaWdodCc6IHRyZWVfaGVpZ2h0fTtcbn1cblxuLy8gZ3JvdXAgdG9wX2xldmVsIG5vZGVzIGJ5IHRoZWlyIHBhcnRuZXJzXG5mdW5jdGlvbiBncm91cF90b3BfbGV2ZWwoZGF0YXNldCkge1xuXHQvLyBsZXQgdG9wX2xldmVsID0gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24odmFsLCBpKXtyZXR1cm4gJ3RvcF9sZXZlbCcgaW4gdmFsICYmIHZhbC50b3BfbGV2ZWwgPyB2YWwgOiBudWxsO30pO1xuXHQvLyBjYWxjdWxhdGUgdG9wX2xldmVsIG5vZGVzXG5cdGZvcihsZXQgaT0wO2k8ZGF0YXNldC5sZW5ndGg7aSsrKSB7XG5cdFx0aWYocGVkaWdyZWVfdXRpbHMuZ2V0RGVwdGgoZGF0YXNldCwgZGF0YXNldFtpXS5uYW1lKSA9PSAyKVxuXHRcdFx0ZGF0YXNldFtpXS50b3BfbGV2ZWwgPSB0cnVlO1xuXHR9XG5cblx0bGV0IHRvcF9sZXZlbCA9IFtdO1xuXHRsZXQgdG9wX2xldmVsX3NlZW4gPSBbXTtcblx0Zm9yKGxldCBpPTA7aTxkYXRhc2V0Lmxlbmd0aDtpKyspIHtcblx0XHRsZXQgbm9kZSA9IGRhdGFzZXRbaV07XG5cdFx0aWYoJ3RvcF9sZXZlbCcgaW4gbm9kZSAmJiAkLmluQXJyYXkobm9kZS5uYW1lLCB0b3BfbGV2ZWxfc2VlbikgPT0gLTEpe1xuXHRcdFx0dG9wX2xldmVsX3NlZW4ucHVzaChub2RlLm5hbWUpO1xuXHRcdFx0dG9wX2xldmVsLnB1c2gobm9kZSk7XG5cdFx0XHRsZXQgcHRycyA9IHBlZGlncmVlX3V0aWxzLmdldF9wYXJ0bmVycyhkYXRhc2V0LCBub2RlKTtcblx0XHRcdGZvcihsZXQgaj0wOyBqPHB0cnMubGVuZ3RoOyBqKyspe1xuXHRcdFx0XHRpZigkLmluQXJyYXkocHRyc1tqXSwgdG9wX2xldmVsX3NlZW4pID09IC0xKSB7XG5cdFx0XHRcdFx0dG9wX2xldmVsX3NlZW4ucHVzaChwdHJzW2pdKTtcblx0XHRcdFx0XHR0b3BfbGV2ZWwucHVzaChwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbal0pKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGxldCBuZXdkYXRhc2V0ID0gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuICd0b3BfbGV2ZWwnIGluIHZhbCAmJiB2YWwudG9wX2xldmVsID8gbnVsbCA6IHZhbDt9KTtcblx0Zm9yIChsZXQgaSA9IHRvcF9sZXZlbC5sZW5ndGg7IGkgPiAwOyAtLWkpXG5cdFx0bmV3ZGF0YXNldC51bnNoaWZ0KHRvcF9sZXZlbFtpLTFdKTtcblx0cmV0dXJuIG5ld2RhdGFzZXQ7XG59XG5cbi8vIGdldCBoZWlnaHQgaW4gcGl4ZWxzXG5mdW5jdGlvbiBnZXRQeChvcHRzKXtcblx0bGV0IGVtVmFsID0gb3B0cy5mb250X3NpemU7XG5cdGlmIChlbVZhbCA9PT0gcGFyc2VJbnQoZW1WYWwsIDEwKSkgLy8gdGVzdCBpZiBpbnRlZ2VyXG5cdFx0cmV0dXJuIGVtVmFsO1xuXG5cdGlmKGVtVmFsLmluZGV4T2YoXCJweFwiKSA+IC0xKVxuXHRcdHJldHVybiBlbVZhbC5yZXBsYWNlKCdweCcsICcnKTtcblx0ZWxzZSBpZihlbVZhbC5pbmRleE9mKFwiZW1cIikgPT09IC0xKVxuXHRcdHJldHVybiBlbVZhbDtcblx0ZW1WYWwgPSBwYXJzZUZsb2F0KGVtVmFsLnJlcGxhY2UoJ2VtJywgJycpKTtcblx0cmV0dXJuIChwYXJzZUZsb2F0KGdldENvbXB1dGVkU3R5bGUoJCgnIycrb3B0cy50YXJnZXREaXYpLmdldCgwKSkuZm9udFNpemUpKmVtVmFsKS0xLjA7XG59XG5cbi8vIEFkZCBsYWJlbFxuZnVuY3Rpb24gYWRkTGFiZWwob3B0cywgbm9kZSwgc2l6ZSwgZngsIGZ5LCBmdGV4dCwgY2xhc3NfbGFiZWwpIHtcblx0bm9kZS5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHRyZXR1cm4gZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyA/IGZhbHNlIDogdHJ1ZTtcblx0fSkuYXBwZW5kKFwidGV4dFwiKVxuXHQuYXR0cihcImNsYXNzXCIsIGNsYXNzX2xhYmVsICsgJyBwZWRfbGFiZWwnIHx8IFwicGVkX2xhYmVsXCIpXG5cdC5hdHRyKFwieFwiLCBmeClcblx0LmF0dHIoXCJ5XCIsIGZ5KVxuXHQvLyAuYXR0cihcImR5XCIsIHNpemUpXG5cdC5hdHRyKFwiZm9udC1mYW1pbHlcIiwgb3B0cy5mb250X2ZhbWlseSlcblx0LmF0dHIoXCJmb250LXNpemVcIiwgb3B0cy5mb250X3NpemUpXG5cdC5hdHRyKFwiZm9udC13ZWlnaHRcIiwgb3B0cy5mb250X3dlaWdodClcblx0LnRleHQoZnRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVidWlsZChvcHRzKSB7XG5cdCQoXCIjXCIrb3B0cy50YXJnZXREaXYpLmVtcHR5KCk7XG5cdHBlZGNhY2hlLmluaXRfY2FjaGUob3B0cyk7XG5cdHRyeSB7XG5cdFx0YnVpbGQob3B0cyk7XG5cdH0gY2F0Y2goZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0dGhyb3cgZTtcblx0fVxuXG5cdHRyeSB7XG5cdFx0dGVtcGxhdGVzLnVwZGF0ZShvcHRzKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Ly8gdGVtcGxhdGVzIG5vdCBkZWNsYXJlZFxuXHR9XG59XG5cbi8vIGFkZCBjaGlsZHJlbiB0byBhIGdpdmVuIG5vZGVcbmV4cG9ydCBmdW5jdGlvbiBhZGRjaGlsZChkYXRhc2V0LCBub2RlLCBzZXgsIG5jaGlsZCwgdHdpbl90eXBlKSB7XG5cdGlmKHR3aW5fdHlwZSAmJiAkLmluQXJyYXkodHdpbl90eXBlLCBbIFwibXp0d2luXCIsIFwiZHp0d2luXCIgXSApID09PSAtMSlcblx0XHRyZXR1cm4gbmV3IEVycm9yKFwiSU5WQUxJRCBUV0lOIFRZUEUgU0VUOiBcIit0d2luX3R5cGUpO1xuXG5cdGlmICh0eXBlb2YgbmNoaWxkID09PSB0eXBlb2YgdW5kZWZpbmVkKVxuXHRcdG5jaGlsZCA9IDE7XG5cdGxldCBjaGlsZHJlbiA9IHBlZGlncmVlX3V0aWxzLmdldEFsbENoaWxkcmVuKGRhdGFzZXQsIG5vZGUpO1xuXHRsZXQgcHRyX25hbWUsIGlkeDtcblx0aWYgKGNoaWxkcmVuLmxlbmd0aCA9PT0gMCkge1xuXHRcdGxldCBwYXJ0bmVyID0gYWRkc2libGluZyhkYXRhc2V0LCBub2RlLCBub2RlLnNleCA9PT0gJ0YnID8gJ00nOiAnRicsIG5vZGUuc2V4ID09PSAnRicpO1xuXHRcdHBhcnRuZXIubm9wYXJlbnRzID0gdHJ1ZTtcblx0XHRwdHJfbmFtZSA9IHBhcnRuZXIubmFtZTtcblx0XHRpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5uYW1lKSsxO1xuXHR9IGVsc2Uge1xuXHRcdGxldCBjID0gY2hpbGRyZW5bMF07XG5cdFx0cHRyX25hbWUgPSAoYy5mYXRoZXIgPT09IG5vZGUubmFtZSA/IGMubW90aGVyIDogYy5mYXRoZXIpO1xuXHRcdGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBjLm5hbWUpO1xuXHR9XG5cblx0bGV0IHR3aW5faWQ7XG5cdGlmKHR3aW5fdHlwZSlcblx0XHR0d2luX2lkID0gZ2V0VW5pcXVlVHdpbklEKGRhdGFzZXQsIHR3aW5fdHlwZSk7XG5cdGxldCBuZXdjaGlsZHJlbiA9IFtdO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IG5jaGlsZDsgaSsrKSB7XG5cdFx0bGV0IGNoaWxkID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IHNleCxcblx0XHRcdFx0XHQgXCJtb3RoZXJcIjogKG5vZGUuc2V4ID09PSAnRicgPyBub2RlLm5hbWUgOiBwdHJfbmFtZSksXG5cdFx0XHRcdFx0IFwiZmF0aGVyXCI6IChub2RlLnNleCA9PT0gJ0YnID8gcHRyX25hbWUgOiBub2RlLm5hbWUpfTtcblx0XHRkYXRhc2V0LnNwbGljZShpZHgsIDAsIGNoaWxkKTtcblxuXHRcdGlmKHR3aW5fdHlwZSlcblx0XHRcdGNoaWxkW3R3aW5fdHlwZV0gPSB0d2luX2lkO1xuXHRcdG5ld2NoaWxkcmVuLnB1c2goY2hpbGQpO1xuXHR9XG5cdHJldHVybiBuZXdjaGlsZHJlbjtcbn1cblxuLy9cbmV4cG9ydCBmdW5jdGlvbiBhZGRzaWJsaW5nKGRhdGFzZXQsIG5vZGUsIHNleCwgYWRkX2xocywgdHdpbl90eXBlKSB7XG5cdGlmKHR3aW5fdHlwZSAmJiAkLmluQXJyYXkodHdpbl90eXBlLCBbIFwibXp0d2luXCIsIFwiZHp0d2luXCIgXSApID09PSAtMSlcblx0XHRyZXR1cm4gbmV3IEVycm9yKFwiSU5WQUxJRCBUV0lOIFRZUEUgU0VUOiBcIit0d2luX3R5cGUpO1xuXG5cdGxldCBuZXdiaWUgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogc2V4fTtcblx0aWYobm9kZS50b3BfbGV2ZWwpIHtcblx0XHRuZXdiaWUudG9wX2xldmVsID0gdHJ1ZTtcblx0fSBlbHNlIHtcblx0XHRuZXdiaWUubW90aGVyID0gbm9kZS5tb3RoZXI7XG5cdFx0bmV3YmllLmZhdGhlciA9IG5vZGUuZmF0aGVyO1xuXHR9XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5uYW1lKTtcblxuXHRpZih0d2luX3R5cGUpIHtcblx0XHRzZXRNelR3aW4oZGF0YXNldCwgZGF0YXNldFtpZHhdLCBuZXdiaWUsIHR3aW5fdHlwZSk7XG5cdH1cblxuXHRpZihhZGRfbGhzKSB7IC8vIGFkZCB0byBMSFNcblx0XHRpZihpZHggPiAwKSBpZHgtLTtcblx0fSBlbHNlXG5cdFx0aWR4Kys7XG5cdGRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgbmV3YmllKTtcblx0cmV0dXJuIG5ld2JpZTtcbn1cblxuLy8gc2V0IHR3byBzaWJsaW5ncyBhcyB0d2luc1xuZnVuY3Rpb24gc2V0TXpUd2luKGRhdGFzZXQsIGQxLCBkMiwgdHdpbl90eXBlKSB7XG5cdGlmKCFkMVt0d2luX3R5cGVdKSB7XG5cdFx0ZDFbdHdpbl90eXBlXSA9IGdldFVuaXF1ZVR3aW5JRChkYXRhc2V0LCB0d2luX3R5cGUpO1xuXHRcdGlmKCFkMVt0d2luX3R5cGVdKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGQyW3R3aW5fdHlwZV0gPSBkMVt0d2luX3R5cGVdO1xuXHRpZihkMS55b2IpXG5cdFx0ZDIueW9iID0gZDEueW9iO1xuXHRpZihkMS5hZ2UgJiYgKGQxLnN0YXR1cyA9PSAwIHx8ICFkMS5zdGF0dXMpKVxuXHRcdGQyLmFnZSA9IGQxLmFnZTtcblx0cmV0dXJuIHRydWU7XG59XG5cbi8vIGdldCBhIG5ldyB1bmlxdWUgdHdpbnMgSUQsIG1heCBvZiAxMCB0d2lucyBpbiBhIHBlZGlncmVlXG5mdW5jdGlvbiBnZXRVbmlxdWVUd2luSUQoZGF0YXNldCwgdHdpbl90eXBlKSB7XG5cdGxldCBteiA9IFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCBcIkFcIl07XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRpZihkYXRhc2V0W2ldW3R3aW5fdHlwZV0pIHtcblx0XHRcdGxldCBpZHggPSBtei5pbmRleE9mKGRhdGFzZXRbaV1bdHdpbl90eXBlXSk7XG5cdFx0XHRpZiAoaWR4ID4gLTEpXG5cdFx0XHRcdG16LnNwbGljZShpZHgsIDEpO1xuXHRcdH1cblx0fVxuXHRpZihtei5sZW5ndGggPiAwKVxuXHRcdHJldHVybiBtelswXTtcblx0cmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLy8gc3luYyBhdHRyaWJ1dGVzIG9mIHR3aW5zXG5leHBvcnQgZnVuY3Rpb24gc3luY1R3aW5zKGRhdGFzZXQsIGQxKSB7XG5cdGlmKCFkMS5tenR3aW4gJiYgIWQxLmR6dHdpbilcblx0XHRyZXR1cm47XG5cdGxldCB0d2luX3R5cGUgPSAoZDEubXp0d2luID8gXCJtenR3aW5cIiA6IFwiZHp0d2luXCIpO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGQyID0gZGF0YXNldFtpXTtcblx0XHRpZihkMlt0d2luX3R5cGVdICYmIGQxW3R3aW5fdHlwZV0gPT0gZDJbdHdpbl90eXBlXSAmJiBkMi5uYW1lICE9PSBkMS5uYW1lKSB7XG5cdFx0XHRpZih0d2luX3R5cGUgPT09IFwibXp0d2luXCIpXG5cdFx0XHQgIGQyLnNleCA9IGQxLnNleDtcblx0XHRcdGlmKGQxLnlvYilcblx0XHRcdFx0ZDIueW9iID0gZDEueW9iO1xuXHRcdFx0aWYoZDEuYWdlICYmIChkMS5zdGF0dXMgPT0gMCB8fCAhZDEuc3RhdHVzKSlcblx0XHRcdFx0ZDIuYWdlID0gZDEuYWdlO1xuXHRcdH1cblx0fVxufVxuXG4vLyBjaGVjayBpbnRlZ3JpdHkgdHdpbiBzZXR0aW5nc1xuZnVuY3Rpb24gY2hlY2tUd2lucyhkYXRhc2V0KSB7XG5cdGxldCB0d2luX3R5cGVzID0gW1wibXp0d2luXCIsIFwiZHp0d2luXCJdO1xuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0Zm9yKGxldCBqPTA7IGo8dHdpbl90eXBlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0bGV0IHR3aW5fdHlwZSA9IHR3aW5fdHlwZXNbal07XG5cdFx0XHRpZihkYXRhc2V0W2ldW3R3aW5fdHlwZV0pIHtcblx0XHRcdFx0bGV0IGNvdW50ID0gMDtcblx0XHRcdFx0Zm9yKGxldCBqPTA7IGo8ZGF0YXNldC5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGlmKGRhdGFzZXRbal1bdHdpbl90eXBlXSA9PSBkYXRhc2V0W2ldW3R3aW5fdHlwZV0pXG5cdFx0XHRcdFx0XHRjb3VudCsrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGNvdW50IDwgMilcblx0XHRcdFx0XHRkZWxldGUgZGF0YXNldFtpXVtbdHdpbl90eXBlXV07XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbi8vIGFkZCBwYXJlbnRzIHRvIHRoZSAnbm9kZSdcbmV4cG9ydCBmdW5jdGlvbiBhZGRwYXJlbnRzKG9wdHMsIGRhdGFzZXQsIG5hbWUpIHtcblx0bGV0IG1vdGhlciwgZmF0aGVyO1xuXHRsZXQgcm9vdCA9IHJvb3RzW29wdHMudGFyZ2V0RGl2XTtcblx0bGV0IGZsYXRfdHJlZSA9IHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCk7XG5cdGxldCB0cmVlX25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgbmFtZSk7XG5cdGxldCBub2RlICA9IHRyZWVfbm9kZS5kYXRhO1xuXHRsZXQgZGVwdGggPSB0cmVlX25vZGUuZGVwdGg7ICAgLy8gZGVwdGggb2YgdGhlIG5vZGUgaW4gcmVsYXRpb24gdG8gdGhlIHJvb3QgKGRlcHRoID0gMSBpcyBhIHRvcF9sZXZlbCBub2RlKVxuXG5cdGxldCBwaWQgPSAtMTAxO1xuXHRsZXQgcHRyX25hbWU7XG5cdGxldCBjaGlsZHJlbiA9IHBlZGlncmVlX3V0aWxzLmdldEFsbENoaWxkcmVuKGRhdGFzZXQsIG5vZGUpO1xuXHRpZihjaGlsZHJlbi5sZW5ndGggPiAwKXtcblx0XHRwdHJfbmFtZSA9IGNoaWxkcmVuWzBdLm1vdGhlciA9PSBub2RlLm5hbWUgPyBjaGlsZHJlblswXS5mYXRoZXIgOiBjaGlsZHJlblswXS5tb3RoZXI7XG5cdFx0cGlkID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIHB0cl9uYW1lKS5kYXRhLmlkO1xuXHR9XG5cblx0bGV0IGk7XG5cdGlmKGRlcHRoID09IDEpIHtcblx0XHRtb3RoZXIgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogXCJGXCIsIFwidG9wX2xldmVsXCI6IHRydWV9O1xuXHRcdGZhdGhlciA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX07XG5cdFx0ZGF0YXNldC5zcGxpY2UoMCwgMCwgbW90aGVyKTtcblx0XHRkYXRhc2V0LnNwbGljZSgwLCAwLCBmYXRoZXIpO1xuXG5cdFx0Zm9yKGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKXtcblx0XHRcdGlmKGRhdGFzZXRbaV0udG9wX2xldmVsICYmIGRhdGFzZXRbaV0ubmFtZSAhPT0gbW90aGVyLm5hbWUgJiYgZGF0YXNldFtpXS5uYW1lICE9PSBmYXRoZXIubmFtZSl7XG5cdFx0XHRcdGRlbGV0ZSBkYXRhc2V0W2ldLnRvcF9sZXZlbDtcblx0XHRcdFx0ZGF0YXNldFtpXS5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdFx0XHRkYXRhc2V0W2ldLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0XHRkYXRhc2V0W2ldLmZhdGhlciA9IGZhdGhlci5uYW1lO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZXQgbm9kZV9tb3RoZXIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgdHJlZV9ub2RlLmRhdGEubW90aGVyKTtcblx0XHRsZXQgbm9kZV9mYXRoZXIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgdHJlZV9ub2RlLmRhdGEuZmF0aGVyKTtcblx0XHRsZXQgbm9kZV9zaWJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgbm9kZSk7XG5cblx0XHQvLyBsaHMgJiByaHMgaWQncyBmb3Igc2libGluZ3Mgb2YgdGhpcyBub2RlXG5cdFx0bGV0IHJpZCA9IDEwMDAwO1xuXHRcdGxldCBsaWQgPSB0cmVlX25vZGUuZGF0YS5pZDtcblx0XHRmb3IoaT0wOyBpPG5vZGVfc2licy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRsZXQgc2lkID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0X3RyZWUsIG5vZGVfc2lic1tpXS5uYW1lKS5kYXRhLmlkO1xuXHRcdFx0aWYoc2lkIDwgcmlkICYmIHNpZCA+IHRyZWVfbm9kZS5kYXRhLmlkKVxuXHRcdFx0XHRyaWQgPSBzaWQ7XG5cdFx0XHRpZihzaWQgPCBsaWQpXG5cdFx0XHRcdGxpZCA9IHNpZDtcblx0XHR9XG5cdFx0bGV0IGFkZF9saHMgPSAobGlkID49IHRyZWVfbm9kZS5kYXRhLmlkIHx8IChwaWQgPT0gbGlkICYmIHJpZCA8IDEwMDAwKSk7XG5cdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdGNvbnNvbGUubG9nKCdsaWQ9JytsaWQrJyByaWQ9JytyaWQrJyBuaWQ9Jyt0cmVlX25vZGUuZGF0YS5pZCsnIEFERF9MSFM9JythZGRfbGhzKTtcblx0XHRsZXQgbWlkeDtcblx0XHRpZiggKCFhZGRfbGhzICYmIG5vZGVfZmF0aGVyLmRhdGEuaWQgPiBub2RlX21vdGhlci5kYXRhLmlkKSB8fFxuXHRcdFx0KGFkZF9saHMgJiYgbm9kZV9mYXRoZXIuZGF0YS5pZCA8IG5vZGVfbW90aGVyLmRhdGEuaWQpIClcblx0XHRcdG1pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5mYXRoZXIpO1xuXHRcdGVsc2Vcblx0XHRcdG1pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5tb3RoZXIpO1xuXG5cdFx0bGV0IHBhcmVudCA9IGRhdGFzZXRbbWlkeF07XG5cdFx0ZmF0aGVyID0gYWRkc2libGluZyhkYXRhc2V0LCBwYXJlbnQsICdNJywgYWRkX2xocyk7XG5cdFx0bW90aGVyID0gYWRkc2libGluZyhkYXRhc2V0LCBwYXJlbnQsICdGJywgYWRkX2xocyk7XG5cblx0XHRsZXQgZmFpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgZmF0aGVyLm5hbWUpO1xuXHRcdGxldCBtb2lkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBtb3RoZXIubmFtZSk7XG5cdFx0aWYoZmFpZHggPiBtb2lkeCkge1x0XHRcdFx0ICAgLy8gc3dpdGNoIHRvIGVuc3VyZSBmYXRoZXIgb24gbGhzIG9mIG1vdGhlclxuXHRcdFx0bGV0IHRtcGZhID0gZGF0YXNldFtmYWlkeF07XG5cdFx0XHRkYXRhc2V0W2ZhaWR4XSA9IGRhdGFzZXRbbW9pZHhdO1xuXHRcdFx0ZGF0YXNldFttb2lkeF0gPSB0bXBmYTtcblx0XHR9XG5cblx0XHRsZXQgb3JwaGFucyA9IHBlZGlncmVlX3V0aWxzLmdldEFkb3B0ZWRTaWJsaW5ncyhkYXRhc2V0LCBub2RlKTtcblx0XHRsZXQgbmlkID0gdHJlZV9ub2RlLmRhdGEuaWQ7XG5cdFx0Zm9yKGk9MDsgaTxvcnBoYW5zLmxlbmd0aDsgaSsrKXtcblx0XHRcdGxldCBvaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgb3JwaGFuc1tpXS5uYW1lKS5kYXRhLmlkO1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coJ09SUEhBTj0nK2krJyAnK29ycGhhbnNbaV0ubmFtZSsnICcrKG5pZCA8IG9pZCAmJiBvaWQgPCByaWQpKycgbmlkPScrbmlkKycgb2lkPScrb2lkKycgcmlkPScrcmlkKTtcblx0XHRcdGlmKChhZGRfbGhzIHx8IG5pZCA8IG9pZCkgJiYgb2lkIDwgcmlkKXtcblx0XHRcdFx0bGV0IG9pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgb3JwaGFuc1tpXS5uYW1lKTtcblx0XHRcdFx0ZGF0YXNldFtvaWR4XS5tb3RoZXIgPSBtb3RoZXIubmFtZTtcblx0XHRcdFx0ZGF0YXNldFtvaWR4XS5mYXRoZXIgPSBmYXRoZXIubmFtZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZihkZXB0aCA9PSAyKSB7XG5cdFx0bW90aGVyLnRvcF9sZXZlbCA9IHRydWU7XG5cdFx0ZmF0aGVyLnRvcF9sZXZlbCA9IHRydWU7XG5cdH0gZWxzZSBpZihkZXB0aCA+IDIpIHtcblx0XHRtb3RoZXIubm9wYXJlbnRzID0gdHJ1ZTtcblx0XHRmYXRoZXIubm9wYXJlbnRzID0gdHJ1ZTtcblx0fVxuXHRsZXQgaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5vZGUubmFtZSk7XG5cdGRhdGFzZXRbaWR4XS5tb3RoZXIgPSBtb3RoZXIubmFtZTtcblx0ZGF0YXNldFtpZHhdLmZhdGhlciA9IGZhdGhlci5uYW1lO1xuXHRkZWxldGUgZGF0YXNldFtpZHhdLm5vcGFyZW50cztcblxuXHRpZigncGFyZW50X25vZGUnIGluIG5vZGUpIHtcblx0XHRsZXQgcHRyX25vZGUgPSBkYXRhc2V0W3BlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBwdHJfbmFtZSldO1xuXHRcdGlmKCdub3BhcmVudHMnIGluIHB0cl9ub2RlKSB7XG5cdFx0XHRwdHJfbm9kZS5tb3RoZXIgPSBtb3RoZXIubmFtZTtcblx0XHRcdHB0cl9ub2RlLmZhdGhlciA9IGZhdGhlci5uYW1lO1xuXHRcdH1cblx0fVxufVxuXG4vLyBhZGQgcGFydG5lclxuZXhwb3J0IGZ1bmN0aW9uIGFkZHBhcnRuZXIob3B0cywgZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgcm9vdCA9IHJvb3RzW29wdHMudGFyZ2V0RGl2XTtcblx0bGV0IGZsYXRfdHJlZSA9IHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCk7XG5cdGxldCB0cmVlX25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgbmFtZSk7XG5cblx0bGV0IHBhcnRuZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHRyZWVfbm9kZS5kYXRhLCB0cmVlX25vZGUuZGF0YS5zZXggPT09ICdGJyA/ICdNJyA6ICdGJywgdHJlZV9ub2RlLmRhdGEuc2V4ID09PSAnRicpO1xuXHRwYXJ0bmVyLm5vcGFyZW50cyA9IHRydWU7XG5cblx0bGV0IGNoaWxkID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IFwiTVwifTtcblx0Y2hpbGQubW90aGVyID0gKHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gdHJlZV9ub2RlLmRhdGEubmFtZSA6IHBhcnRuZXIubmFtZSk7XG5cdGNoaWxkLmZhdGhlciA9ICh0cmVlX25vZGUuZGF0YS5zZXggPT09ICdGJyA/IHBhcnRuZXIubmFtZSA6IHRyZWVfbm9kZS5kYXRhLm5hbWUpO1xuXG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgdHJlZV9ub2RlLmRhdGEubmFtZSkrMjtcblx0ZGF0YXNldC5zcGxpY2UoaWR4LCAwLCBjaGlsZCk7XG59XG5cbi8vIGdldCBhZGphY2VudCBub2RlcyBhdCB0aGUgc2FtZSBkZXB0aFxuZnVuY3Rpb24gYWRqYWNlbnRfbm9kZXMocm9vdCwgbm9kZSwgZXhjbHVkZXMpIHtcblx0bGV0IGRub2RlcyA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVzQXREZXB0aChwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpLCBub2RlLmRlcHRoLCBleGNsdWRlcyk7XG5cdGxldCBsaHNfbm9kZSwgcmhzX25vZGU7XG5cdGZvcihsZXQgaT0wOyBpPGRub2Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGRub2Rlc1tpXS54IDwgbm9kZS54KVxuXHRcdFx0bGhzX25vZGUgPSBkbm9kZXNbaV07XG5cdFx0aWYoIXJoc19ub2RlICYmIGRub2Rlc1tpXS54ID4gbm9kZS54KVxuXHRcdFx0cmhzX25vZGUgPSBkbm9kZXNbaV07XG5cdH1cblx0cmV0dXJuIFtsaHNfbm9kZSwgcmhzX25vZGVdO1xufVxuXG4vLyBkZWxldGUgYSBub2RlIGFuZCBkZXNjZW5kYW50c1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZV9ub2RlX2RhdGFzZXQoZGF0YXNldCwgbm9kZSwgb3B0cywgb25Eb25lKSB7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZm5vZGVzID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IGRlbGV0ZXMgPSBbXTtcblx0bGV0IGksIGo7XG5cblx0Ly8gZ2V0IGQzIGRhdGEgbm9kZVxuXHRpZihub2RlLmlkID09PSB1bmRlZmluZWQpIHtcblx0XHRsZXQgZDNub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbm9kZXMsIG5vZGUubmFtZSk7XG5cdFx0aWYoZDNub2RlICE9PSB1bmRlZmluZWQpXG5cdFx0XHRub2RlID0gZDNub2RlLmRhdGE7XG5cdH1cblxuXHRpZihub2RlLnBhcmVudF9ub2RlKSB7XG5cdFx0Zm9yKGk9MDsgaTxub2RlLnBhcmVudF9ub2RlLmxlbmd0aDsgaSsrKXtcblx0XHRcdGxldCBwYXJlbnQgPSBub2RlLnBhcmVudF9ub2RlW2ldO1xuXHRcdFx0bGV0IHBzID0gW3BlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgcGFyZW50Lm1vdGhlci5uYW1lKSxcblx0XHRcdFx0XHQgIHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgcGFyZW50LmZhdGhlci5uYW1lKV07XG5cdFx0XHQvLyBkZWxldGUgcGFyZW50c1xuXHRcdFx0Zm9yKGo9MDsgajxwcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZihwc1tqXS5uYW1lID09PSBub2RlLm5hbWUgfHwgcHNbal0ubm9wYXJlbnRzICE9PSB1bmRlZmluZWQgfHwgcHNbal0udG9wX2xldmVsKSB7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIHBzW2pdLm5hbWUpLCAxKTtcblx0XHRcdFx0XHRkZWxldGVzLnB1c2gocHNbal0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGxldCBjaGlsZHJlbiA9IHBhcmVudC5jaGlsZHJlbjtcblx0XHRcdGxldCBjaGlsZHJlbl9uYW1lcyA9ICQubWFwKGNoaWxkcmVuLCBmdW5jdGlvbihwLCBfaSl7cmV0dXJuIHAubmFtZTt9KTtcblx0XHRcdGZvcihqPTA7IGo8Y2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0bGV0IGNoaWxkID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBjaGlsZHJlbltqXS5uYW1lKTtcblx0XHRcdFx0aWYoY2hpbGQpe1xuXHRcdFx0XHRcdGNoaWxkLm5vcGFyZW50cyA9IHRydWU7XG5cdFx0XHRcdFx0bGV0IHB0cnMgPSBwZWRpZ3JlZV91dGlscy5nZXRfcGFydG5lcnMoZGF0YXNldCwgY2hpbGQpO1xuXHRcdFx0XHRcdGxldCBwdHI7XG5cdFx0XHRcdFx0aWYocHRycy5sZW5ndGggPiAwKVxuXHRcdFx0XHRcdFx0cHRyID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwdHJzWzBdKTtcblx0XHRcdFx0XHRpZihwdHIgJiYgcHRyLm1vdGhlciAhPT0gY2hpbGQubW90aGVyKSB7XG5cdFx0XHRcdFx0XHRjaGlsZC5tb3RoZXIgPSBwdHIubW90aGVyO1xuXHRcdFx0XHRcdFx0Y2hpbGQuZmF0aGVyID0gcHRyLmZhdGhlcjtcblx0XHRcdFx0XHR9IGVsc2UgaWYocHRyKSB7XG5cdFx0XHRcdFx0XHRsZXQgY2hpbGRfbm9kZSAgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2RlcywgY2hpbGQubmFtZSk7XG5cdFx0XHRcdFx0XHRsZXQgYWRqID0gYWRqYWNlbnRfbm9kZXMocm9vdCwgY2hpbGRfbm9kZSwgY2hpbGRyZW5fbmFtZXMpO1xuXHRcdFx0XHRcdFx0Y2hpbGQubW90aGVyID0gYWRqWzBdID8gYWRqWzBdLmRhdGEubW90aGVyIDogKGFkalsxXSA/IGFkalsxXS5kYXRhLm1vdGhlciA6IG51bGwpO1xuXHRcdFx0XHRcdFx0Y2hpbGQuZmF0aGVyID0gYWRqWzBdID8gYWRqWzBdLmRhdGEuZmF0aGVyIDogKGFkalsxXSA/IGFkalsxXS5kYXRhLmZhdGhlciA6IG51bGwpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgY2hpbGQubmFtZSksIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5uYW1lKSwgMSk7XG5cdH1cblxuXHQvLyBkZWxldGUgYW5jZXN0b3JzXG5cdGNvbnNvbGUubG9nKGRlbGV0ZXMpO1xuXHRmb3IoaT0wOyBpPGRlbGV0ZXMubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgZGVsID0gZGVsZXRlc1tpXTtcblx0XHRsZXQgc2licyA9IHBlZGlncmVlX3V0aWxzLmdldEFsbFNpYmxpbmdzKGRhdGFzZXQsIGRlbCk7XG5cdFx0Y29uc29sZS5sb2coJ0RFTCcsIGRlbC5uYW1lLCBzaWJzKTtcblx0XHRpZihzaWJzLmxlbmd0aCA8IDEpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdkZWwgc2licycsIGRlbC5uYW1lLCBzaWJzKTtcblx0XHRcdGxldCBkYXRhX25vZGUgID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbm9kZXMsIGRlbC5uYW1lKTtcblx0XHRcdGxldCBhbmNlc3RvcnMgPSBkYXRhX25vZGUuYW5jZXN0b3JzKCk7XG5cdFx0XHRmb3Ioaj0wOyBqPGFuY2VzdG9ycy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhhbmNlc3RvcnNbaV0pO1xuXHRcdFx0XHRpZihhbmNlc3RvcnNbal0uZGF0YS5tb3RoZXIpe1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdERUxFVEUgJywgYW5jZXN0b3JzW2pdLmRhdGEubW90aGVyLCBhbmNlc3RvcnNbal0uZGF0YS5mYXRoZXIpO1xuXHRcdFx0XHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBhbmNlc3RvcnNbal0uZGF0YS5tb3RoZXIubmFtZSksIDEpO1xuXHRcdFx0XHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBhbmNlc3RvcnNbal0uZGF0YS5mYXRoZXIubmFtZSksIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdC8vIGNoZWNrIGludGVncml0eSBvZiBtenR3aW5zIHNldHRpbmdzXG5cdGNoZWNrVHdpbnMoZGF0YXNldCk7XG5cblx0bGV0IHVjO1xuXHR0cnlcdHtcblx0XHQvLyB2YWxpZGF0ZSBuZXcgcGVkaWdyZWUgZGF0YXNldFxuXHRcdGxldCBuZXdvcHRzID0gJC5leHRlbmQoe30sIG9wdHMpO1xuXHRcdG5ld29wdHMuZGF0YXNldCA9IHBlZGlncmVlX3V0aWxzLmNvcHlfZGF0YXNldChkYXRhc2V0KTtcblx0XHR2YWxpZGF0ZV9wZWRpZ3JlZShuZXdvcHRzKTtcblx0XHQvLyBjaGVjayBpZiBwZWRpZ3JlZSBpcyBzcGxpdFxuXHRcdHVjID0gcGVkaWdyZWVfdXRpbHMudW5jb25uZWN0ZWQoZGF0YXNldCk7XG5cdH0gY2F0Y2goZXJyKSB7XG5cdFx0cGVkaWdyZWVfdXRpbHMubWVzc2FnZXMoJ1dhcm5pbmcnLCAnRGVsZXRpb24gb2YgdGhpcyBwZWRpZ3JlZSBtZW1iZXIgaXMgZGlzYWxsb3dlZC4nKVxuXHRcdHRocm93IGVycjtcblx0fVxuXHRpZih1Yy5sZW5ndGggPiAwKSB7XG5cdFx0Ly8gY2hlY2sgJiB3YXJuIG9ubHkgaWYgdGhpcyBpcyBhIG5ldyBzcGxpdFxuXHRcdGlmKHBlZGlncmVlX3V0aWxzLnVuY29ubmVjdGVkKG9wdHMuZGF0YXNldCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiaW5kaXZpZHVhbHMgdW5jb25uZWN0ZWQgdG8gcGVkaWdyZWUgXCIsIHVjKTtcblx0XHRcdHBlZGlncmVlX3V0aWxzLm1lc3NhZ2VzKFwiV2FybmluZ1wiLCBcIkRlbGV0aW5nIHRoaXMgd2lsbCBzcGxpdCB0aGUgcGVkaWdyZWUuIENvbnRpbnVlP1wiLCBvbkRvbmUsIG9wdHMsIGRhdGFzZXQpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdGlmKG9uRG9uZSkge1xuXHRcdG9uRG9uZShvcHRzLCBkYXRhc2V0KTtcblx0fVxuXHRyZXR1cm4gZGF0YXNldDtcbn1cbiJdLCJuYW1lcyI6WyJtYXhfbGltaXQiLCJkaWN0X2NhY2hlIiwiaGFzX2Jyb3dzZXJfc3RvcmFnZSIsIm9wdHMiLCJzdG9yZV90eXBlIiwidW5kZWZpbmVkIiwibW9kIiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsInJlbW92ZUl0ZW0iLCJlIiwiZ2V0X3ByZWZpeCIsImJ0bl90YXJnZXQiLCJnZXRfYXJyIiwiZ2V0X2Jyb3dzZXJfc3RvcmUiLCJpdGVtIiwiZ2V0SXRlbSIsInNlc3Npb25TdG9yYWdlIiwic2V0X2Jyb3dzZXJfc3RvcmUiLCJuYW1lIiwiY2xlYXJfYnJvd3Nlcl9zdG9yZSIsImNsZWFyIiwiY2xlYXJfcGVkaWdyZWVfZGF0YSIsInByZWZpeCIsInN0b3JlIiwiaXRlbXMiLCJpIiwibGVuZ3RoIiwia2V5IiwiaW5kZXhPZiIsInB1c2giLCJnZXRfY291bnQiLCJjb3VudCIsInNldF9jb3VudCIsImluaXRfY2FjaGUiLCJkYXRhc2V0IiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnNvbGUiLCJ3YXJuIiwibnN0b3JlIiwiY3VycmVudCIsInBhcnNlIiwibGFzdCIsIml0IiwiYXJyIiwicHJldmlvdXMiLCJuZXh0IiwicGFyc2VJbnQiLCJzZXRwb3NpdGlvbiIsIngiLCJ5Iiwiem9vbSIsImdldHBvc2l0aW9uIiwicG9zIiwicGFyc2VGbG9hdCIsImlzSUUiLCJ1YSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImlzRWRnZSIsIm1hdGNoIiwiY29weV9kYXRhc2V0IiwiaWQiLCJzb3J0IiwiYSIsImIiLCJkaXNhbGxvd2VkIiwibmV3ZGF0YXNldCIsIm9iaiIsImdldEZvcm1hdHRlZERhdGUiLCJ0aW1lIiwiZCIsIkRhdGUiLCJnZXRIb3VycyIsInNsaWNlIiwiZ2V0TWludXRlcyIsImdldFNlY29uZHMiLCJnZXRGdWxsWWVhciIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsIm1lc3NhZ2VzIiwidGl0bGUiLCJtc2ciLCJvbkNvbmZpcm0iLCIkIiwiZGlhbG9nIiwibW9kYWwiLCJ3aWR0aCIsImJ1dHRvbnMiLCJ0ZXh0IiwiY2xpY2siLCJ2YWxpZGF0ZV9hZ2VfeW9iIiwiYWdlIiwieW9iIiwic3RhdHVzIiwieWVhciIsInN1bSIsIk1hdGgiLCJhYnMiLCJjYXBpdGFsaXNlRmlyc3RMZXR0ZXIiLCJzdHJpbmciLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsIm1ha2VpZCIsImxlbiIsInBvc3NpYmxlIiwiZmxvb3IiLCJyYW5kb20iLCJidWlsZFRyZWUiLCJwZXJzb24iLCJyb290IiwicGFydG5lckxpbmtzIiwiY2hpbGRyZW4iLCJnZXRDaGlsZHJlbiIsIm5vZGVzIiwiZmxhdHRlbiIsInBhcnRuZXJzIiwiZWFjaCIsImNoaWxkIiwiaiIsInAiLCJtb3RoZXIiLCJmYXRoZXIiLCJtIiwiZ2V0Tm9kZUJ5TmFtZSIsImYiLCJjb250YWluc19wYXJlbnQiLCJtZXJnZSIsInB0ciIsInBhcmVudCIsImhpZGRlbiIsIm1pZHgiLCJnZXRJZHhCeU5hbWUiLCJmaWR4Iiwic2V0Q2hpbGRyZW5JZCIsImdwIiwiZ2V0X2dyYW5kcGFyZW50c19pZHgiLCJ1cGRhdGVQYXJlbnQiLCJwYXJlbnRfbm9kZSIsIm16dHdpbiIsImR6dHdpbnMiLCJ0d2lucyIsImdldFR3aW5zIiwidHdpbiIsImR6dHdpbiIsImlzUHJvYmFuZCIsImF0dHIiLCJzZXRQcm9iYW5kIiwiaXNfcHJvYmFuZCIsInByb2JhbmQiLCJjb21iaW5lQXJyYXlzIiwiYXJyMSIsImFycjIiLCJpbkFycmF5IiwiaW5jbHVkZV9jaGlsZHJlbiIsImNvbm5lY3RlZCIsImdldF9wYXJ0bmVycyIsImdldEFsbENoaWxkcmVuIiwiY2hpbGRfaWR4IiwiYW5vZGUiLCJwdHJzIiwiYm5vZGUiLCJ1bmNvbm5lY3RlZCIsInRhcmdldCIsImdldFByb2JhbmRJbmRleCIsImNoYW5nZSIsImlpIiwibmNvbm5lY3QiLCJpZHgiLCJoYXNfcGFyZW50Iiwibm9wYXJlbnRzIiwibmFtZXMiLCJtYXAiLCJ2YWwiLCJfaSIsInNleCIsImdldFNpYmxpbmdzIiwiZ2V0QWxsU2libGluZ3MiLCJzaWJzIiwidHdpbl90eXBlIiwiZ2V0QWRvcHRlZFNpYmxpbmdzIiwiZ2V0RGVwdGgiLCJkZXB0aCIsInRvcF9sZXZlbCIsImdldE5vZGVzQXREZXB0aCIsImZub2RlcyIsImV4Y2x1ZGVfbmFtZXMiLCJkYXRhIiwibGlua05vZGVzIiwiZmxhdHRlbk5vZGVzIiwibGlua3MiLCJhbmNlc3RvcnMiLCJub2RlIiwicmVjdXJzZSIsImNvbnNhbmd1aXR5Iiwibm9kZTEiLCJub2RlMiIsImFuY2VzdG9yczEiLCJhbmNlc3RvcnMyIiwibmFtZXMxIiwiYW5jZXN0b3IiLCJuYW1lczIiLCJpbmRleCIsImZsYXQiLCJmb3JFYWNoIiwiYWRqdXN0X2Nvb3JkcyIsInhtaWQiLCJvdmVybGFwIiwiZGVzY2VuZGFudHMiLCJkaWZmIiwiY2hpbGQxIiwiY2hpbGQyIiwibm9kZXNPdmVybGFwIiwiREVCVUciLCJsb2ciLCJkZXNjZW5kYW50c05hbWVzIiwiZGVzY2VuZGFudCIsInhuZXciLCJuIiwic3ltYm9sX3NpemUiLCJ1cmxQYXJhbSIsInJlc3VsdHMiLCJSZWdFeHAiLCJleGVjIiwid2luZG93IiwibG9jYXRpb24iLCJocmVmIiwiZ21pZHgiLCJnZmlkeCIsInByb2JhbmRfYXR0ciIsImtleXMiLCJ2YWx1ZSIsIm5vZGVfYXR0ciIsInBlZGNhY2hlIiwiaXNBcnJheSIsImsiLCJmb3VuZCIsInN5bmNUd2lucyIsInJlYnVpbGQiLCJwcm9iYW5kX2FkZF9jaGlsZCIsImJyZWFzdGZlZWRpbmciLCJuZXdjaGlsZCIsImFkZGNoaWxkIiwiZGVsZXRlX25vZGVfYnlfbmFtZSIsIm9uRG9uZSIsImRlbGV0ZV9ub2RlX2RhdGFzZXQiLCJleGlzdHMiLCJwcmludF9vcHRzIiwicmVtb3ZlIiwiYXBwZW5kIiwiYWRkIiwib3B0aW9ucyIsImV4dGVuZCIsImJ0bnMiLCJsaXMiLCJmYSIsImlzX2Z1bGxzY3JlZW4iLCJkb2N1bWVudCIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbFNjcmVlbkVsZW1lbnQiLCJ3ZWJraXRGdWxsc2NyZWVuRWxlbWVudCIsIm9uIiwiX2UiLCJsb2NhbF9kYXRhc2V0IiwibW96RnVsbFNjcmVlbiIsIndlYmtpdEZ1bGxTY3JlZW4iLCJ0YXJnZXREaXYiLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuIiwiRWxlbWVudCIsIkFMTE9XX0tFWUJPQVJEX0lOUFVUIiwibW96Q2FuY2VsRnVsbFNjcmVlbiIsIndlYmtpdENhbmNlbEZ1bGxTY3JlZW4iLCJzdG9wUHJvcGFnYXRpb24iLCJoYXNDbGFzcyIsImVtcHR5IiwiYnVpbGQiLCJyZXNpemFibGUiLCJoZWlnaHQiLCJDb250aW51ZSIsInJlc2V0Iiwia2VlcF9wcm9iYW5kX29uX3Jlc2V0IiwiQ2FuY2VsIiwidHJpZ2dlciIsImtlZXBfcHJvYmFuZCIsInNlbGVjdGVkIiwidXBkYXRlQnV0dG9ucyIsImFkZENsYXNzIiwicmVtb3ZlQ2xhc3MiLCJSSVNLX0ZBQ1RPUl9TVE9SRSIsIk9iamVjdCIsInNob3dfcmlza19mYWN0b3Jfc3RvcmUiLCJnZXRfbm9uX2Fub25fcGVkaWdyZWUiLCJtZXRhIiwiZ2V0X3BlZGlncmVlIiwiZmFtaWQiLCJpc2Fub24iLCJleGNsIiwiZXhjbHVkZSIsInByb2JhbmRJZHgiLCJwZWRpZ3JlZV91dGlsIiwibWVuYXJjaGUiLCJnZXRfcmlza19mYWN0b3IiLCJwYXJpdHkiLCJmaXJzdF9iaXJ0aCIsIm9jX3VzZSIsIm1odF91c2UiLCJibWkiLCJhbGNvaG9sIiwibWVub3BhdXNlIiwibWRlbnNpdHkiLCJoZ3QiLCJ0bCIsImVuZG8iLCJkaXNwbGF5X25hbWUiLCJjYW5jZXJzIiwiY2FuY2VyIiwiZGlhZ25vc2lzX2FnZSIsImFzaGtlbmF6aSIsImdlbmV0aWNfdGVzdCIsInBhdGhvbG9neV90ZXN0cyIsInNhdmVfcmlza19mYWN0b3IiLCJyaXNrX2ZhY3Rvcl9uYW1lIiwic3RvcmVfbmFtZSIsInJlbW92ZV9yaXNrX2ZhY3RvciIsInBhdGhuYW1lIiwic3BsaXQiLCJmaWx0ZXIiLCJlbCIsInBvcCIsImdldF9wcnNfdmFsdWVzIiwicHJzIiwiaGFzSW5wdXQiLCJpc0VtcHR5IiwidHJpbSIsIm15T2JqIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiZ2V0X3N1cmdpY2FsX29wcyIsImxvYWQiLCJzYXZlIiwiYnJlYXN0X2NhbmNlcl9wcnMiLCJhbHBoYSIsInpzY29yZSIsIm92YXJpYW5fY2FuY2VyX3BycyIsImVyciIsInNhdmVfY2FucmlzayIsInByaW50IiwiZ2V0X3ByaW50YWJsZV9zdmciLCJzdmdfZG93bmxvYWQiLCJkZWZlcnJlZCIsInN2ZzJpbWciLCJ3aGVuIiwiYXBwbHkiLCJkb25lIiwiZ2V0QnlOYW1lIiwiYXJndW1lbnRzIiwiaHRtbCIsImltZyIsIm5ld1RhYiIsIm9wZW4iLCJ3cml0ZSIsImNyZWF0ZUVsZW1lbnQiLCJkb3dubG9hZCIsImJvZHkiLCJhcHBlbmRDaGlsZCIsInJlbW92ZUNoaWxkIiwiZ3JlcCIsIm8iLCJzdmciLCJkZWZlcnJlZF9uYW1lIiwiZGVmYXVsdHMiLCJpc2NhbnZnIiwicmVzb2x1dGlvbiIsImltZ190eXBlIiwiZmluZCIsImQzb2JqIiwiZDMiLCJzZWxlY3QiLCJnZXQiLCJsb3dlciIsIkRlZmVycmVkIiwic3ZnU3RyIiwiWE1MU2VyaWFsaXplciIsInNlcmlhbGl6ZVRvU3RyaW5nIiwieG1sIiwiaW1nc3JjIiwiYnRvYSIsInVuZXNjYXBlIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiY2FudmFzIiwiY29udGV4dCIsImdldENvbnRleHQiLCJvbmxvYWQiLCJyZXBsYWNlIiwidiIsImNhbnZnIiwiQ2FudmciLCJmcm9tU3RyaW5nIiwic2NhbGVXaWR0aCIsInNjYWxlSGVpZ2h0IiwiaWdub3JlRGltZW5zaW9ucyIsInN0YXJ0IiwiZHJhd0ltYWdlIiwicmVzb2x2ZSIsInRvRGF0YVVSTCIsInNyYyIsInByb21pc2UiLCJnZXRNYXRjaGVzIiwic3RyIiwibXlSZWdleHAiLCJtYXRjaGVzIiwiYyIsImxhc3RJbmRleCIsImVycm9yIiwidW5pcXVlX3VybHMiLCJzdmdfaHRtbCIsInF1b3RlIiwibTEiLCJtMiIsIm5ld3ZhbCIsImNvcHlfc3ZnIiwic3ZnX25vZGUiLCJzZWxlY3RBbGwiLCJ0cmVlX2RpbWVuc2lvbnMiLCJnZXRfdHJlZV9kaW1lbnNpb25zIiwic3ZnX2RpdiIsImNsb25lIiwiYXBwZW5kVG8iLCJ3aWQiLCJzY2FsZSIsInhzY2FsZSIsInlzY2FsZSIsInl0cmFuc2Zvcm0iLCJjb25zdHJ1Y3RvciIsIkFycmF5IiwiY3NzRmlsZXMiLCJwcmludFdpbmRvdyIsImhlYWRDb250ZW50IiwiY3NzIiwiY2xvc2UiLCJmb2N1cyIsInNldFRpbWVvdXQiLCJzYXZlX2ZpbGUiLCJjb250ZW50IiwiZmlsZW5hbWUiLCJ0eXBlIiwiZmlsZSIsIkJsb2IiLCJtc1NhdmVPck9wZW5CbG9iIiwidXJsIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwicmV2b2tlT2JqZWN0VVJMIiwiY2Fucmlza192YWxpZGF0aW9uIiwiZmlsZXMiLCJyaXNrX2ZhY3RvcnMiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwicmVzdWx0Iiwic3RhcnRzV2l0aCIsInJlYWRCb2FkaWNlYVY0IiwiY2Fucmlza19kYXRhIiwicmVhZENhblJpc2tWMSIsInJlYWRMaW5rYWdlIiwidmFsaWRhdGVfcGVkaWdyZWUiLCJlcnIxIiwibWVzc2FnZSIsImFjY19GYW1IaXN0X3RpY2tlZCIsImFjY19GYW1IaXN0X0xlYXZlIiwiUkVTVUxUIiwiRkxBR19GQU1JTFlfTU9EQUwiLCJlcnIzIiwiZXJyMiIsIm9uZXJyb3IiLCJldmVudCIsImNvZGUiLCJyZWFkQXNUZXh0IiwiYm9hZGljZWFfbGluZXMiLCJsaW5lcyIsInBlZCIsImluZGkiLCJhZmZlY3RlZCIsImFsbGVsZXMiLCJ1bnNoaWZ0IiwicHJvY2Vzc19wZWQiLCJoZHIiLCJsbiIsIm9wcyIsIm9wZGF0YSIsImRlbGltIiwiZ2VuZV90ZXN0IiwicGF0aF90ZXN0IiwidmVyc2lvbiIsImdldExldmVsIiwibWF4X2xldmVsIiwibGV2ZWwiLCJwaWR4IiwiZ2V0UGFydG5lcklkeCIsInVwZGF0ZV9wYXJlbnRzX2xldmVsIiwicGFyZW50cyIsIm1hIiwicGEiLCJ1cGRhdGUiLCJwcm9wIiwiaXMiLCJwZWRpZ3JlZV9mb3JtIiwiYmNfbXV0YXRpb25fZnJlcXVlbmNpZXMiLCJiY21mcmVxIiwiZ2VuZSIsInRvTG93ZXJDYXNlIiwib2JjbWZyZXEiLCJvY19tdXRhdGlvbl9mcmVxdWVuY2llcyIsInNhdmVfYXNoa24iLCJwZWRjYWNoZV9jdXJyZW50IiwidXBkYXRlX2FzaGtuIiwic3dpdGNoZXMiLCJpc3dpdGNoIiwicyIsInVwZGF0ZV9jYW5jZXJfYnlfc2V4IiwiYXBwcm94X2RpYWdub3Npc19hZ2UiLCJzdWJzdHJpbmciLCJyb3VuZDUiLCJjaGVja2VkIiwidHJlcyIsInZhbGlkIiwic2hvdyIsIm92YXJpYW5fY2FuY2VyX2RpYWdub3Npc19hZ2UiLCJjbG9zZXN0IiwiaGlkZSIsInByb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlIiwieDEiLCJ4MiIsInJvdW5kIiwiZHJhZ2dpbmciLCJsYXN0X21vdXNlb3ZlciIsImFkZFdpZGdldHMiLCJmb250X3NpemUiLCJwb3B1cF9zZWxlY3Rpb24iLCJzdHlsZSIsInNxdWFyZSIsInNxdWFyZV90aXRsZSIsImNpcmNsZSIsImNpcmNsZV90aXRsZSIsInVuc3BlY2lmaWVkIiwiYWRkX3BlcnNvbiIsImNsYXNzZWQiLCJkYXR1bSIsImFkZHNpYmxpbmciLCJoaWdobGlnaHQiLCJkcmFnX2hhbmRsZSIsIl9kIiwiZngiLCJvZmYiLCJmeSIsIndpZGdldHMiLCJlZGl0Iiwic2V0dGluZ3MiLCJ3aWRnZXQiLCJzdHlsZXMiLCJwYXJlbnROb2RlIiwib3B0Iiwib3BlbkVkaXREaWFsb2ciLCJhZGRwYXJlbnRzIiwiYWRkcGFydG5lciIsImN0cmxLZXkiLCJzcGxpY2UiLCJub2RlY2xpY2siLCJzZXRMaW5lRHJhZ1Bvc2l0aW9uIiwieGNvb3JkIiwicG9pbnRlciIsInljb29yZCIsImxpbmVfZHJhZ19zZWxlY3Rpb24iLCJkbGluZSIsImRyYWciLCJkcmFnc3RhcnQiLCJkcmFnc3RvcCIsInNvdXJjZUV2ZW50IiwiZHgiLCJkeSIsInluZXciLCJ5MSIsInkyIiwidHJhbnNsYXRlIiwiYXV0b09wZW4iLCJ0YWJsZSIsImRpc2Vhc2VzIiwiZGlzZWFzZV9jb2xvdXIiLCJjb2xvdXIiLCJrayIsInJvb3RzIiwiem9vbUluIiwiem9vbU91dCIsImxhYmVscyIsImZvbnRfZmFtaWx5IiwiZm9udF93ZWlnaHQiLCJiYWNrZ3JvdW5kIiwibm9kZV9iYWNrZ3JvdW5kIiwidmFsaWRhdGUiLCJwYnV0dG9ucyIsImlvIiwiZ3JvdXBfdG9wX2xldmVsIiwicGVkaWdyZWVfdXRpbHMiLCJzdmdfZGltZW5zaW9ucyIsImdldF9zdmdfZGltZW5zaW9ucyIsInh5dHJhbnNmb3JtIiwieHRyYW5zZm9ybSIsImhpZGRlbl9yb290IiwiaGllcmFyY2h5IiwidHJlZW1hcCIsInRyZWUiLCJzZXBhcmF0aW9uIiwic2l6ZSIsInZpc19ub2RlcyIsImNyZWF0ZV9lcnIiLCJwdHJMaW5rTm9kZXMiLCJjaGVja19wdHJfbGlua3MiLCJlbnRlciIsIm1pc2NhcnJpYWdlIiwidGVybWluYXRpb24iLCJzeW1ib2wiLCJzeW1ib2xUcmlhbmdsZSIsInN5bWJvbENpcmNsZSIsInN5bWJvbFNxdWFyZSIsInBpZW5vZGUiLCJuY2FuY2VycyIsInByZWZpeEluT2JqIiwicGllIiwiYXJjIiwiaW5uZXJSYWRpdXMiLCJvdXRlclJhZGl1cyIsImFkb3B0ZWRfaW4iLCJhZG9wdGVkX291dCIsImluZGVudCIsImdldF9icmFja2V0IiwiYWRkTGFiZWwiLCJnZXRQeCIsImlsYWIiLCJsYWJlbCIsInlfb2Zmc2V0IiwidmFycyIsIml2YXIiLCJkaXNlYXNlIiwiZGlzIiwiY2xhc2hfZGVwdGgiLCJkcmF3X3BhdGgiLCJjbGFzaCIsImR5MSIsImR5MiIsImNzaGlmdCIsImwiLCJwYXRoIiwiZHgxIiwiZHgyIiwiaW5zZXJ0IiwiZGl2b3JjZWQiLCJjaGVja19wdHJfbGlua19jbGFzaGVzIiwicGFyZW50X25vZGVzIiwicGFyZW50X25vZGVfbmFtZSIsImRpdm9yY2VfcGF0aCIsInBhdGgyIiwic291cmNlIiwiZGFzaF9sZW4iLCJkYXNoX2FycmF5IiwidXNlZGxlbiIsInR3aW54IiwieG1pbiIsInQiLCJ0aGlzeCIsInltaWQiLCJ4aGJhciIsInh4IiwieXkiLCJwcm9iYW5kTm9kZSIsInRyaWlkIiwic2NhbGVFeHRlbnQiLCJ6b29tRm4iLCJ0cmFuc2Zvcm0iLCJ0b1N0cmluZyIsIkVycm9yIiwidW5pcXVlbmFtZXMiLCJmYW1pZHMiLCJqb2luIiwidWMiLCJfbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsIm1heHNjb3JlIiwiZ2VuZXJhdGlvbiIsInNjb3JlIiwibWF4X2RlcHRoIiwidHJlZV93aWR0aCIsInRyZWVfaGVpZ2h0IiwidG9wX2xldmVsX3NlZW4iLCJlbVZhbCIsImdldENvbXB1dGVkU3R5bGUiLCJmb250U2l6ZSIsImZ0ZXh0IiwiY2xhc3NfbGFiZWwiLCJ0ZW1wbGF0ZXMiLCJuY2hpbGQiLCJwdHJfbmFtZSIsInBhcnRuZXIiLCJ0d2luX2lkIiwiZ2V0VW5pcXVlVHdpbklEIiwibmV3Y2hpbGRyZW4iLCJhZGRfbGhzIiwibmV3YmllIiwic2V0TXpUd2luIiwiZDEiLCJkMiIsIm16IiwiY2hlY2tUd2lucyIsInR3aW5fdHlwZXMiLCJmbGF0X3RyZWUiLCJ0cmVlX25vZGUiLCJwaWQiLCJub2RlX21vdGhlciIsIm5vZGVfZmF0aGVyIiwibm9kZV9zaWJzIiwicmlkIiwibGlkIiwic2lkIiwiZmFpZHgiLCJtb2lkeCIsInRtcGZhIiwib3JwaGFucyIsIm5pZCIsIm9pZCIsIm9pZHgiLCJwdHJfbm9kZSIsImFkamFjZW50X25vZGVzIiwiZXhjbHVkZXMiLCJkbm9kZXMiLCJsaHNfbm9kZSIsInJoc19ub2RlIiwiZGVsZXRlcyIsImQzbm9kZSIsInBzIiwiY2hpbGRyZW5fbmFtZXMiLCJjaGlsZF9ub2RlIiwiYWRqIiwiZGVsIiwiZGF0YV9ub2RlIiwibmV3b3B0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUFBO0VBRUEsSUFBSUEsU0FBUyxHQUFHLEVBQWhCO0VBQ0EsSUFBSUMsVUFBVSxHQUFHLEVBQWpCOztFQUdBLFNBQVNDLG1CQUFULENBQTZCQyxJQUE3QixFQUFtQztFQUNsQyxNQUFJO0VBQ0gsUUFBR0EsSUFBSSxDQUFDQyxVQUFMLEtBQW9CLE9BQXZCLEVBQ0MsT0FBTyxLQUFQO0VBRUQsUUFBR0QsSUFBSSxDQUFD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
