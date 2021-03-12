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

  function updateStatus(status) {
    $('#age_yob_lock').removeClass('fa-lock fa-unlock-alt');
    status == 1 ? $('#age_yob_lock').addClass('fa-unlock-alt') : $('#age_yob_lock').addClass('fa-lock');
    $('#id_age_' + status).removeClass("hidden");
    $('#id_age_' + (status == 1 ? '0' : '1')).addClass("hidden");
  }
  function nodeclick(node) {
    $('form > fieldset').prop('disabled', false); // clear values

    $('#person_details').find("input[type=text], input[type=number]").val("");
    $('#person_details select').val('').prop('selected', true); // assign values to input fields in form

    if (node.sex === 'M' || node.sex === 'F') $('input[name=sex][value="' + node.sex + '"]').prop('checked', true);else $('input[name=sex]').prop('checked', false);
    update_cancer_by_sex(node);
    if (!('status' in node)) node.status = 0;
    $('input[name=status][value="' + node.status + '"]').prop('checked', true); // show lock symbol for age and yob synchronisation

    updateStatus(node.status);

    if ('proband' in node) {
      $('#id_proband').prop('checked', node.proband);
      $('#id_proband').prop("disabled", true);
    } else {
      $('#id_proband').prop('checked', false);
      $('#id_proband').prop("disabled", !('yob' in node));
    }

    if ('exclude' in node) {
      $('#id_exclude').prop('checked', node.exclude);
    } else {
      $('#id_exclude').prop('checked', false);
    }
    /*		if('ashkenazi' in node) {
    			$('#id_ashkenazi').prop('checked', (node.proband == 1 ? true: false));
    		} else {
    			$('#id_ashkenazi').prop('checked', false);
    		}*/
    // year of birth


    if ('yob' in node) {
      $('#id_yob_0').val(node.yob);
    } else {
      $('#id_yob_0').val('-');
    } // clear pathology


    $('select[name$="_bc_pathology"]').val('-'); // clear gene tests

    $('select[name*="_gene_test"]').val('-'); // disable sex radio buttons if the person has a partner

    $("input[id^='id_sex_']").prop("disabled", node.parent_node && node.sex !== 'U' ? true : false); // disable pathology for male relatives (as not used by model)
    // and if no breast cancer age of diagnosis

    $("select[id$='_bc_pathology']").prop("disabled", node.sex === 'M' || node.sex === 'F' && !('breast_cancer_diagnosis_age' in node) ? true : false); // approximate diagnosis age

    $('#id_approx').prop('checked', node.approx_diagnosis_age ? true : false);
    update_diagnosis_age_widget();

    for (var key in node) {
      if (key !== 'proband' && key !== 'sex') {
        if ($('#id_' + key).length) {
          // input value
          if (key.indexOf('_gene_test') !== -1 && node[key] !== null && _typeof(node[key]) === 'object') {
            $('#id_' + key).val(node[key].type);
            $('#id_' + key + '_result').val(node[key].result);
          } else {
            $('#id_' + key).val(node[key]);
          }
        } else if (key.indexOf('_diagnosis_age') !== -1) {
          if ($("#id_approx").is(':checked')) {
            $('#id_' + key + '_1').val(round5(node[key])).prop('selected', true);
          } else {
            $('#id_' + key + '_0').val(node[key]);
          }
        }
      }
    }

    try {
      $('#person_details').find('form').valid();
    } catch (err) {
      console.warn('valid() not found');
    }
  }

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
  function update_diagnosis_age_widget() {
    if ($("#id_approx").is(':checked')) {
      $("[id$='_diagnosis_age_0']").each(function (_i) {
        if ($(this).val() !== '') {
          var name = this.name.substring(0, this.name.length - 2);
          $("#id_" + name + "_1").val(round5($(this).val())).prop('selected', true);
        }
      });
      $("[id$='_diagnosis_age_0']").hide();
      $("[id$='_diagnosis_age_1']").show();
    } else {
      $("[id$='_diagnosis_age_1']").each(function (_i) {
        if ($(this).val() !== '') {
          var name = this.name.substring(0, this.name.length - 2);
          $("#id_" + name + "_0").val($(this).val());
        }
      });
      $("[id$='_diagnosis_age_0']").show();
      $("[id$='_diagnosis_age_1']").hide();
    }
  } // males should not have ovarian cancer and females should not have prostate cancer

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

  var pedigree_form = /*#__PURE__*/Object.freeze({
    __proto__: null,
    updateStatus: updateStatus,
    nodeclick: nodeclick,
    save_ashkn: save_ashkn,
    save: save,
    update_diagnosis_age_widget: update_diagnosis_age_widget
  });

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
    }).on("click", function (event, d) {
      if (event.ctrlKey) {
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
  exports.pedigree_form = pedigree_form;
  exports.pedigree_utils = pedigree_utils;
  exports.pedigreejs = pedigree;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVkaWdyZWVqcy52Mi4wLjAtcmMxLmpzIiwic291cmNlcyI6WyIuLi9lcy9wZWRjYWNoZS5qcyIsIi4uL2VzL3BlZGlncmVlX3V0aWxzLmpzIiwiLi4vZXMvcGJ1dHRvbnMuanMiLCIuLi9lcy9jYW5yaXNrX2ZpbGUuanMiLCIuLi9lcy9pby5qcyIsIi4uL2VzL3BlZGlncmVlX2Zvcm0uanMiLCIuLi9lcy93aWRnZXRzLmpzIiwiLi4vZXMvcGVkaWdyZWUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy9zdG9yZSBhIGhpc3Rvcnkgb2YgcGVkaWdyZWVcblxubGV0IG1heF9saW1pdCA9IDI1O1xubGV0IGRpY3RfY2FjaGUgPSB7fTtcblxuLy8gdGVzdCBpZiBicm93c2VyIHN0b3JhZ2UgaXMgc3VwcG9ydGVkXG5mdW5jdGlvbiBoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpIHtcblx0dHJ5IHtcblx0XHRpZihvcHRzLnN0b3JlX3R5cGUgPT09ICdhcnJheScpXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHRpZihvcHRzLnN0b3JlX3R5cGUgIT09ICdsb2NhbCcgJiYgb3B0cy5zdG9yZV90eXBlICE9PSAnc2Vzc2lvbicgJiYgb3B0cy5zdG9yZV90eXBlICE9PSB1bmRlZmluZWQpXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHRsZXQgbW9kID0gJ3Rlc3QnO1xuXHRcdGxvY2FsU3RvcmFnZS5zZXRJdGVtKG1vZCwgbW9kKTtcblx0XHRsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShtb2QpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0X3ByZWZpeChvcHRzKSB7XG5cdHJldHVybiBcIlBFRElHUkVFX1wiK29wdHMuYnRuX3RhcmdldCtcIl9cIjtcbn1cblxuLy8gdXNlIGRpY3RfY2FjaGUgdG8gc3RvcmUgY2FjaGUgYXMgYW4gYXJyYXlcbmZ1bmN0aW9uIGdldF9hcnIob3B0cykge1xuXHRyZXR1cm4gZGljdF9jYWNoZVtnZXRfcHJlZml4KG9wdHMpXTtcbn1cblxuZnVuY3Rpb24gZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgaXRlbSkge1xuXHRpZihvcHRzLnN0b3JlX3R5cGUgPT09ICdsb2NhbCcpXG5cdFx0cmV0dXJuIGxvY2FsU3RvcmFnZS5nZXRJdGVtKGl0ZW0pO1xuXHRlbHNlXG5cdFx0cmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oaXRlbSk7XG59XG5cbmZ1bmN0aW9uIHNldF9icm93c2VyX3N0b3JlKG9wdHMsIG5hbWUsIGl0ZW0pIHtcblx0aWYob3B0cy5zdG9yZV90eXBlID09PSAnbG9jYWwnKVxuXHRcdHJldHVybiBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBpdGVtKTtcblx0ZWxzZVxuXHRcdHJldHVybiBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKG5hbWUsIGl0ZW0pO1xufVxuXG4vLyBjbGVhciBhbGwgc3RvcmFnZSBpdGVtc1xuZnVuY3Rpb24gY2xlYXJfYnJvd3Nlcl9zdG9yZShvcHRzKSB7XG5cdGlmKG9wdHMuc3RvcmVfdHlwZSA9PT0gJ2xvY2FsJylcblx0XHRyZXR1cm4gbG9jYWxTdG9yYWdlLmNsZWFyKCk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gc2Vzc2lvblN0b3JhZ2UuY2xlYXIoKTtcbn1cblxuLy8gcmVtb3ZlIGFsbCBzdG9yYWdlIGl0ZW1zIHdpdGgga2V5cyB0aGF0IGhhdmUgdGhlIHBlZGlncmVlIGhpc3RvcnkgcHJlZml4XG5leHBvcnQgZnVuY3Rpb24gY2xlYXJfcGVkaWdyZWVfZGF0YShvcHRzKSB7XG5cdGxldCBwcmVmaXggPSBnZXRfcHJlZml4KG9wdHMpO1xuXHRsZXQgc3RvcmUgPSAob3B0cy5zdG9yZV90eXBlID09PSAnbG9jYWwnID8gbG9jYWxTdG9yYWdlIDogc2Vzc2lvblN0b3JhZ2UpO1xuXHRsZXQgaXRlbXMgPSBbXTtcblx0Zm9yKGxldCBpID0gMDsgaSA8IHN0b3JlLmxlbmd0aDsgaSsrKXtcblx0XHRpZihzdG9yZS5rZXkoaSkuaW5kZXhPZihwcmVmaXgpID09IDApXG5cdFx0XHRpdGVtcy5wdXNoKHN0b3JlLmtleShpKSk7XG5cdH1cblx0Zm9yKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxuXHRcdHN0b3JlLnJlbW92ZUl0ZW0oaXRlbXNbaV0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X2NvdW50KG9wdHMpIHtcblx0bGV0IGNvdW50O1xuXHRpZiAoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSlcblx0XHRjb3VudCA9IGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ0NPVU5UJyk7XG5cdGVsc2Vcblx0XHRjb3VudCA9IGRpY3RfY2FjaGVbZ2V0X3ByZWZpeChvcHRzKSsnQ09VTlQnXTtcblx0aWYoY291bnQgIT09IG51bGwgJiYgY291bnQgIT09IHVuZGVmaW5lZClcblx0XHRyZXR1cm4gY291bnQ7XG5cdHJldHVybiAwO1xufVxuXG5mdW5jdGlvbiBzZXRfY291bnQob3B0cywgY291bnQpIHtcblx0aWYgKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0c2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnQ09VTlQnLCBjb3VudCk7XG5cdGVsc2Vcblx0XHRkaWN0X2NhY2hlW2dldF9wcmVmaXgob3B0cykrJ0NPVU5UJ10gPSBjb3VudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRfY2FjaGUob3B0cykge1xuXHRpZighb3B0cy5kYXRhc2V0KVxuXHRcdHJldHVybjtcblx0bGV0IGNvdW50ID0gZ2V0X2NvdW50KG9wdHMpO1xuXHRpZiAoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSkgeyAgIC8vIGxvY2FsIHN0b3JhZ2Vcblx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpK2NvdW50LCBKU09OLnN0cmluZ2lmeShvcHRzLmRhdGFzZXQpKTtcblx0fSBlbHNlIHsgICAvLyBUT0RPIDo6IGFycmF5IGNhY2hlXG5cdFx0Y29uc29sZS53YXJuKCdMb2NhbCBzdG9yYWdlIG5vdCBmb3VuZC9zdXBwb3J0ZWQgZm9yIHRoaXMgYnJvd3NlciEnLCBvcHRzLnN0b3JlX3R5cGUpO1xuXHRcdG1heF9saW1pdCA9IDUwMDtcblx0XHRpZihnZXRfYXJyKG9wdHMpID09PSB1bmRlZmluZWQpXG5cdFx0XHRkaWN0X2NhY2hlW2dldF9wcmVmaXgob3B0cyldID0gW107XG5cdFx0Z2V0X2FycihvcHRzKS5wdXNoKEpTT04uc3RyaW5naWZ5KG9wdHMuZGF0YXNldCkpO1xuXHR9XG5cdGlmKGNvdW50IDwgbWF4X2xpbWl0KVxuXHRcdGNvdW50Kys7XG5cdGVsc2Vcblx0XHRjb3VudCA9IDA7XG5cdHNldF9jb3VudChvcHRzLCBjb3VudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuc3RvcmUob3B0cykge1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKSB7XG5cdFx0Zm9yKGxldCBpPW1heF9saW1pdDsgaT4wOyBpLS0pIHtcblx0XHRcdGlmKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrKGktMSkpICE9PSBudWxsKVxuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIChnZXRfYXJyKG9wdHMpICYmIGdldF9hcnIob3B0cykubGVuZ3RoID4gMCA/IGdldF9hcnIob3B0cykubGVuZ3RoIDogLTEpO1xuXHR9XG5cdHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnQob3B0cykge1xuXHRsZXQgY3VycmVudCA9IGdldF9jb3VudChvcHRzKS0xO1xuXHRpZihjdXJyZW50ID09IC0xKVxuXHRcdGN1cnJlbnQgPSBtYXhfbGltaXQ7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKStjdXJyZW50KSk7XG5cdGVsc2UgaWYoZ2V0X2FycihvcHRzKSlcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYXJyKG9wdHMpW2N1cnJlbnRdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxhc3Qob3B0cykge1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKSB7XG5cdFx0Zm9yKGxldCBpPW1heF9saW1pdDsgaT4wOyBpLS0pIHtcblx0XHRcdGxldCBpdCA9IGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrKGktMSkpO1xuXHRcdFx0aWYoaXQgIT09IG51bGwpIHtcblx0XHRcdFx0c2V0X2NvdW50KG9wdHMsIGkpO1xuXHRcdFx0XHRyZXR1cm4gSlNPTi5wYXJzZShpdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBhcnIgPSBnZXRfYXJyKG9wdHMpO1xuXHRcdGlmKGFycilcblx0XHRcdHJldHVybiBKU09OLnBhcnNlKGFycihhcnIubGVuZ3RoLTEpKTtcblx0fVxuXHRyZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJldmlvdXMob3B0cywgcHJldmlvdXMpIHtcblx0aWYocHJldmlvdXMgPT09IHVuZGVmaW5lZClcblx0XHRwcmV2aW91cyA9IGdldF9jb3VudChvcHRzKSAtIDI7XG5cblx0aWYocHJldmlvdXMgPCAwKSB7XG5cdFx0bGV0IG5zdG9yZSA9IG5zdG9yZShvcHRzKTtcblx0XHRpZihuc3RvcmUgPCBtYXhfbGltaXQpXG5cdFx0XHRwcmV2aW91cyA9IG5zdG9yZSAtIDE7XG5cdFx0ZWxzZVxuXHRcdFx0cHJldmlvdXMgPSBtYXhfbGltaXQgLSAxO1xuXHR9XG5cdHNldF9jb3VudChvcHRzLCBwcmV2aW91cyArIDEpO1xuXHRpZihoYXNfYnJvd3Nlcl9zdG9yYWdlKG9wdHMpKVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrcHJldmlvdXMpKTtcblx0ZWxzZVxuXHRcdHJldHVybiBKU09OLnBhcnNlKGdldF9hcnIob3B0cylbcHJldmlvdXNdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5leHQob3B0cywgbmV4dCkge1xuXHRpZihuZXh0ID09PSB1bmRlZmluZWQpXG5cdFx0bmV4dCA9IGdldF9jb3VudChvcHRzKTtcblx0aWYobmV4dCA+PSBtYXhfbGltaXQpXG5cdFx0bmV4dCA9IDA7XG5cblx0c2V0X2NvdW50KG9wdHMsIHBhcnNlSW50KG5leHQpICsgMSk7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpXG5cdFx0cmV0dXJuIEpTT04ucGFyc2UoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKStuZXh0KSk7XG5cdGVsc2Vcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShnZXRfYXJyKG9wdHMpW25leHRdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyKG9wdHMpIHtcblx0aWYoaGFzX2Jyb3dzZXJfc3RvcmFnZShvcHRzKSlcblx0XHRjbGVhcl9icm93c2VyX3N0b3JlKG9wdHMpO1xuXHRkaWN0X2NhY2hlID0ge307XG59XG5cbi8vIHpvb20gLSBzdG9yZSB0cmFuc2xhdGlvbiBjb29yZHNcbmV4cG9ydCBmdW5jdGlvbiBzZXRwb3NpdGlvbihvcHRzLCB4LCB5LCB6b29tKSB7XG5cdGlmKGhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykpIHtcblx0XHRzZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWCcsIHgpO1xuXHRcdHNldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19ZJywgeSk7XG5cdFx0aWYoem9vbSlcblx0XHRcdHNldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19aT09NJywgem9vbSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly9UT0RPXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldHBvc2l0aW9uKG9wdHMpIHtcblx0aWYoIWhhc19icm93c2VyX3N0b3JhZ2Uob3B0cykgfHxcblx0XHQobG9jYWxTdG9yYWdlLmdldEl0ZW0oZ2V0X3ByZWZpeChvcHRzKSsnX1gnKSA9PT0gbnVsbCAmJlxuXHRcdCBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGdldF9wcmVmaXgob3B0cykrJ19YJykgPT09IG51bGwpKVxuXHRcdHJldHVybiBbbnVsbCwgbnVsbF07XG5cdGxldCBwb3MgPSBbIHBhcnNlSW50KGdldF9icm93c2VyX3N0b3JlKG9wdHMsIGdldF9wcmVmaXgob3B0cykrJ19YJykpLFxuXHRcdFx0XHRwYXJzZUludChnZXRfYnJvd3Nlcl9zdG9yZShvcHRzLCBnZXRfcHJlZml4KG9wdHMpKydfWScpKSBdO1xuXHRpZihnZXRfYnJvd3Nlcl9zdG9yZShnZXRfcHJlZml4KG9wdHMpKydfWk9PTScpICE9PSBudWxsKVxuXHRcdHBvcy5wdXNoKHBhcnNlRmxvYXQoZ2V0X2Jyb3dzZXJfc3RvcmUob3B0cywgZ2V0X3ByZWZpeChvcHRzKSsnX1pPT00nKSkpO1xuXHRyZXR1cm4gcG9zO1xufVxuIiwiLy8gUGVkaWdyZWUgVHJlZSBVdGlsc1xuXG5pbXBvcnQge3N5bmNUd2lucywgcmVidWlsZCwgYWRkY2hpbGQsIGRlbGV0ZV9ub2RlX2RhdGFzZXR9IGZyb20gJy4vcGVkaWdyZWUuanMnO1xuaW1wb3J0ICogYXMgcGVkY2FjaGUgZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0lFKCkge1xuXHQgbGV0IHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcblx0IC8qIE1TSUUgdXNlZCB0byBkZXRlY3Qgb2xkIGJyb3dzZXJzIGFuZCBUcmlkZW50IHVzZWQgdG8gbmV3ZXIgb25lcyovXG5cdCByZXR1cm4gdWEuaW5kZXhPZihcIk1TSUUgXCIpID4gLTEgfHwgdWEuaW5kZXhPZihcIlRyaWRlbnQvXCIpID4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0VkZ2UoKSB7XG5cdCByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvRWRnZS9nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlfZGF0YXNldChkYXRhc2V0KSB7XG5cdGlmKGRhdGFzZXRbMF0uaWQpIHsgLy8gc29ydCBieSBpZFxuXHRcdGRhdGFzZXQuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiAoIWEuaWQgfHwgIWIuaWQgPyAwOiAoYS5pZCA+IGIuaWQpID8gMSA6ICgoYi5pZCA+IGEuaWQpID8gLTEgOiAwKSk7fSk7XG5cdH1cblxuXHRsZXQgZGlzYWxsb3dlZCA9IFtcImlkXCIsIFwicGFyZW50X25vZGVcIl07XG5cdGxldCBuZXdkYXRhc2V0ID0gW107XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspe1xuXHRcdGxldCBvYmogPSB7fTtcblx0XHRmb3IobGV0IGtleSBpbiBkYXRhc2V0W2ldKSB7XG5cdFx0XHRpZihkaXNhbGxvd2VkLmluZGV4T2Yoa2V5KSA9PSAtMSlcblx0XHRcdFx0b2JqW2tleV0gPSBkYXRhc2V0W2ldW2tleV07XG5cdFx0fVxuXHRcdG5ld2RhdGFzZXQucHVzaChvYmopO1xuXHR9XG5cdHJldHVybiBuZXdkYXRhc2V0O1xufVxuXG4vKipcbiAqICBHZXQgZm9ybWF0dGVkIHRpbWUgb3IgZGF0YSAmIHRpbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1hdHRlZERhdGUodGltZSl7XG5cdGxldCBkID0gbmV3IERhdGUoKTtcblx0aWYodGltZSlcblx0XHRyZXR1cm4gKCcwJyArIGQuZ2V0SG91cnMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKSArIFwiOlwiICsgKCcwJyArIGQuZ2V0U2Vjb25kcygpKS5zbGljZSgtMik7XG5cdGVsc2Vcblx0XHRyZXR1cm4gZC5nZXRGdWxsWWVhcigpICsgXCItXCIgKyAoJzAnICsgKGQuZ2V0TW9udGgoKSArIDEpKS5zbGljZSgtMikgKyBcIi1cIiArICgnMCcgKyBkLmdldERhdGUoKSkuc2xpY2UoLTIpICsgXCIgXCIgKyAoJzAnICsgZC5nZXRIb3VycygpKS5zbGljZSgtMikgKyBcIjpcIiArICgnMCcgKyBkLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpICsgXCI6XCIgKyAoJzAnICsgZC5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKTtcbiB9XG5cbi8qKlxuICogU2hvdyBtZXNzYWdlIG9yIGNvbmZpcm1hdGlvbiBkaWFsb2cuXG4gKiBAcGFyYW0gdGl0bGVcdCAtIGRpYWxvZyB3aW5kb3cgdGl0bGVcbiAqIEBwYXJhbSBtc2dcdCAgIC0gbWVzc2FnZSB0byBkaWFzcGxheVxuICogQHBhcmFtIG9uQ29uZmlybSAtIGZ1bmN0aW9uIHRvIGNhbGwgaW4gYSBjb25maXJtYXRpb24gZGlhbG9nXG4gKiBAcGFyYW0gb3B0c1x0ICAtIHBlZGlncmVlanMgb3B0aW9uc1xuICogQHBhcmFtIGRhdGFzZXRcdC0gcGVkaWdyZWUgZGF0YXNldFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVzc2FnZXModGl0bGUsIG1zZywgb25Db25maXJtLCBvcHRzLCBkYXRhc2V0KSB7XG5cdGlmKG9uQ29uZmlybSkge1xuXHRcdCQoJzxkaXYgaWQ9XCJtc2dEaWFsb2dcIj4nK21zZysnPC9kaXY+JykuZGlhbG9nKHtcblx0XHRcdFx0bW9kYWw6IHRydWUsXG5cdFx0XHRcdHRpdGxlOiB0aXRsZSxcblx0XHRcdFx0d2lkdGg6IDM1MCxcblx0XHRcdFx0YnV0dG9uczoge1xuXHRcdFx0XHRcdFwiWWVzXCI6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCdjbG9zZScpO1xuXHRcdFx0XHRcdFx0b25Db25maXJtKG9wdHMsIGRhdGFzZXQpO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XCJOb1wiOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0XHQkKHRoaXMpLmRpYWxvZygnY2xvc2UnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdCQoJzxkaXYgaWQ9XCJtc2dEaWFsb2dcIj4nK21zZysnPC9kaXY+JykuZGlhbG9nKHtcblx0XHRcdHRpdGxlOiB0aXRsZSxcblx0XHRcdHdpZHRoOiAzNTAsXG5cdFx0XHRidXR0b25zOiBbe1xuXHRcdFx0XHR0ZXh0OiBcIk9LXCIsXG5cdFx0XHRcdGNsaWNrOiBmdW5jdGlvbigpIHsgJCggdGhpcyApLmRpYWxvZyggXCJjbG9zZVwiICk7fVxuXHRcdFx0fV1cblx0XHR9KTtcblx0fVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFnZSBhbmQgeW9iIGlzIGNvbnNpc3RlbnQgd2l0aCBjdXJyZW50IHllYXIuIFRoZSBzdW0gb2YgYWdlIGFuZFxuICogeW9iIHNob3VsZCBub3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGN1cnJlbnQgeWVhci4gSWYgYWxpdmUgdGhlXG4gKiBhYnNvbHV0ZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHN1bSBvZiBhZ2UgYW5kIHllYXIgb2YgYmlydGggYW5kIHRoZVxuICogY3VycmVudCB5ZWFyIHNob3VsZCBiZSA8PSAxLlxuICogQHBhcmFtIGFnZVx0LSBhZ2UgaW4geWVhcnMuXG4gKiBAcGFyYW0geW9iXHQtIHllYXIgb2YgYmlydGguXG4gKiBAcGFyYW0gc3RhdHVzIC0gMCA9IGFsaXZlLCAxID0gZGVhZC5cbiAqIEByZXR1cm4gdHJ1ZSBpZiBhZ2UgYW5kIHlvYiBhcmUgY29uc2lzdGVudCB3aXRoIGN1cnJlbnQgeWVhciBvdGhlcndpc2UgZmFsc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZV9hZ2VfeW9iKGFnZSwgeW9iLCBzdGF0dXMpIHtcblx0bGV0IHllYXIgPSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7XG5cdGxldCBzdW0gPSBwYXJzZUludChhZ2UpICsgcGFyc2VJbnQoeW9iKTtcblx0aWYoc3RhdHVzID09IDEpIHsgICAvLyBkZWNlYXNlZFxuXHRcdHJldHVybiB5ZWFyID49IHN1bTtcblx0fVxuXHRyZXR1cm4gTWF0aC5hYnMoeWVhciAtIHN1bSkgPD0gMSAmJiB5ZWFyID49IHN1bTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhcGl0YWxpc2VGaXJzdExldHRlcihzdHJpbmcpIHtcblx0cmV0dXJuIHN0cmluZy5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0cmluZy5zbGljZSgxKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZWlkKGxlbikge1xuXHRsZXQgdGV4dCA9IFwiXCI7XG5cdGxldCBwb3NzaWJsZSA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiO1xuXHRmb3IoIGxldCBpPTA7IGkgPCBsZW47IGkrKyApXG5cdFx0dGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG5cdHJldHVybiB0ZXh0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRUcmVlKG9wdHMsIHBlcnNvbiwgcm9vdCwgcGFydG5lckxpbmtzLCBpZCkge1xuXHRpZiAodHlwZW9mIHBlcnNvbi5jaGlsZHJlbiA9PT0gdHlwZW9mIHVuZGVmaW5lZClcblx0XHRwZXJzb24uY2hpbGRyZW4gPSBnZXRDaGlsZHJlbihvcHRzLmRhdGFzZXQsIHBlcnNvbik7XG5cblx0aWYgKHR5cGVvZiBwYXJ0bmVyTGlua3MgPT09IHR5cGVvZiB1bmRlZmluZWQpIHtcblx0XHRwYXJ0bmVyTGlua3MgPSBbXTtcblx0XHRpZCA9IDE7XG5cdH1cblxuXHRsZXQgbm9kZXMgPSBmbGF0dGVuKHJvb3QpO1xuXHQvL2NvbnNvbGUubG9nKCdOQU1FPScrcGVyc29uLm5hbWUrJyBOTy4gQ0hJTERSRU49JytwZXJzb24uY2hpbGRyZW4ubGVuZ3RoKTtcblx0bGV0IHBhcnRuZXJzID0gW107XG5cdCQuZWFjaChwZXJzb24uY2hpbGRyZW4sIGZ1bmN0aW9uKGksIGNoaWxkKSB7XG5cdFx0JC5lYWNoKG9wdHMuZGF0YXNldCwgZnVuY3Rpb24oaiwgcCkge1xuXHRcdFx0aWYgKCgoY2hpbGQubmFtZSA9PT0gcC5tb3RoZXIpIHx8IChjaGlsZC5uYW1lID09PSBwLmZhdGhlcikpICYmIGNoaWxkLmlkID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0bGV0IG0gPSBnZXROb2RlQnlOYW1lKG5vZGVzLCBwLm1vdGhlcik7XG5cdFx0XHRcdGxldCBmID0gZ2V0Tm9kZUJ5TmFtZShub2RlcywgcC5mYXRoZXIpO1xuXHRcdFx0XHRtID0gKG0gIT09IHVuZGVmaW5lZD8gbSA6IGdldE5vZGVCeU5hbWUob3B0cy5kYXRhc2V0LCBwLm1vdGhlcikpO1xuXHRcdFx0XHRmID0gKGYgIT09IHVuZGVmaW5lZD8gZiA6IGdldE5vZGVCeU5hbWUob3B0cy5kYXRhc2V0LCBwLmZhdGhlcikpO1xuXHRcdFx0XHRpZighY29udGFpbnNfcGFyZW50KHBhcnRuZXJzLCBtLCBmKSlcblx0XHRcdFx0XHRwYXJ0bmVycy5wdXNoKHsnbW90aGVyJzogbSwgJ2ZhdGhlcic6IGZ9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cdCQubWVyZ2UocGFydG5lckxpbmtzLCBwYXJ0bmVycyk7XG5cblx0JC5lYWNoKHBhcnRuZXJzLCBmdW5jdGlvbihpLCBwdHIpIHtcblx0XHRsZXQgbW90aGVyID0gcHRyLm1vdGhlcjtcblx0XHRsZXQgZmF0aGVyID0gcHRyLmZhdGhlcjtcblx0XHRtb3RoZXIuY2hpbGRyZW4gPSBbXTtcblx0XHRsZXQgcGFyZW50ID0ge1xuXHRcdFx0XHRuYW1lIDogbWFrZWlkKDQpLFxuXHRcdFx0XHRoaWRkZW4gOiB0cnVlLFxuXHRcdFx0XHRwYXJlbnQgOiBudWxsLFxuXHRcdFx0XHRmYXRoZXIgOiBmYXRoZXIsXG5cdFx0XHRcdG1vdGhlciA6IG1vdGhlcixcblx0XHRcdFx0Y2hpbGRyZW4gOiBnZXRDaGlsZHJlbihvcHRzLmRhdGFzZXQsIG1vdGhlciwgZmF0aGVyKVxuXHRcdH07XG5cblx0XHRsZXQgbWlkeCA9IGdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIG1vdGhlci5uYW1lKTtcblx0XHRsZXQgZmlkeCA9IGdldElkeEJ5TmFtZShvcHRzLmRhdGFzZXQsIGZhdGhlci5uYW1lKTtcblx0XHRpZighKCdpZCcgaW4gZmF0aGVyKSAmJiAhKCdpZCcgaW4gbW90aGVyKSlcblx0XHRcdGlkID0gc2V0Q2hpbGRyZW5JZChwZXJzb24uY2hpbGRyZW4sIGlkKTtcblxuXHRcdC8vIGxvb2sgYXQgZ3JhbmRwYXJlbnRzIGluZGV4XG5cdFx0bGV0IGdwID0gZ2V0X2dyYW5kcGFyZW50c19pZHgob3B0cy5kYXRhc2V0LCBtaWR4LCBmaWR4KTtcblx0XHRpZihncC5maWR4IDwgZ3AubWlkeCkge1xuXHRcdFx0ZmF0aGVyLmlkID0gaWQrKztcblx0XHRcdHBhcmVudC5pZCA9IGlkKys7XG5cdFx0XHRtb3RoZXIuaWQgPSBpZCsrO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtb3RoZXIuaWQgPSBpZCsrO1xuXHRcdFx0cGFyZW50LmlkID0gaWQrKztcblx0XHRcdGZhdGhlci5pZCA9IGlkKys7XG5cdFx0fVxuXHRcdGlkID0gdXBkYXRlUGFyZW50KG1vdGhlciwgcGFyZW50LCBpZCwgbm9kZXMsIG9wdHMpO1xuXHRcdGlkID0gdXBkYXRlUGFyZW50KGZhdGhlciwgcGFyZW50LCBpZCwgbm9kZXMsIG9wdHMpO1xuXHRcdHBlcnNvbi5jaGlsZHJlbi5wdXNoKHBhcmVudCk7XG5cdH0pO1xuXHRpZCA9IHNldENoaWxkcmVuSWQocGVyc29uLmNoaWxkcmVuLCBpZCk7XG5cblx0JC5lYWNoKHBlcnNvbi5jaGlsZHJlbiwgZnVuY3Rpb24oaSwgcCkge1xuXHRcdGlkID0gYnVpbGRUcmVlKG9wdHMsIHAsIHJvb3QsIHBhcnRuZXJMaW5rcywgaWQpWzFdO1xuXHR9KTtcblx0cmV0dXJuIFtwYXJ0bmVyTGlua3MsIGlkXTtcbn1cblxuLy8gdXBkYXRlIHBhcmVudCBub2RlIGFuZCBzb3J0IHR3aW5zXG5mdW5jdGlvbiB1cGRhdGVQYXJlbnQocCwgcGFyZW50LCBpZCwgbm9kZXMsIG9wdHMpIHtcblx0Ly8gYWRkIHRvIHBhcmVudCBub2RlXG5cdGlmKCdwYXJlbnRfbm9kZScgaW4gcClcblx0XHRwLnBhcmVudF9ub2RlLnB1c2gocGFyZW50KTtcblx0ZWxzZVxuXHRcdHAucGFyZW50X25vZGUgPSBbcGFyZW50XTtcblxuXHQvLyBjaGVjayB0d2lucyBsaWUgbmV4dCB0byBlYWNoIG90aGVyXG5cdGlmKHAubXp0d2luIHx8IHAuZHp0d2lucykge1xuXHRcdGxldCB0d2lucyA9IGdldFR3aW5zKG9wdHMuZGF0YXNldCwgcCk7XG5cdFx0Zm9yKGxldCBpPTA7IGk8dHdpbnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGxldCB0d2luID0gZ2V0Tm9kZUJ5TmFtZShub2RlcywgdHdpbnNbaV0ubmFtZSk7XG5cdFx0XHRpZih0d2luKVxuXHRcdFx0XHR0d2luLmlkID0gaWQrKztcblx0XHR9XG5cdH1cblx0cmV0dXJuIGlkO1xufVxuXG5mdW5jdGlvbiBzZXRDaGlsZHJlbklkKGNoaWxkcmVuLCBpZCkge1xuXHQvLyBzb3J0IHR3aW5zIHRvIGxpZSBuZXh0IHRvIGVhY2ggb3RoZXJcblx0Y2hpbGRyZW4uc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdFx0aWYoYS5tenR3aW4gJiYgYi5tenR3aW4gJiYgYS5tenR3aW4gPT0gYi5tenR3aW4pXG5cdFx0XHRyZXR1cm4gMDtcblx0XHRlbHNlIGlmKGEuZHp0d2luICYmIGIuZHp0d2luICYmIGEuZHp0d2luID09IGIuZHp0d2luKVxuXHRcdFx0cmV0dXJuIDA7XG5cdFx0ZWxzZSBpZihhLm16dHdpbiB8fCBiLm16dHdpbiB8fCBhLmR6dHdpbiB8fCBiLmR6dHdpbilcblx0XHRcdHJldHVybiAxO1xuXHRcdHJldHVybiAwO1xuXHR9KTtcblxuXHQkLmVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZihwLmlkID09PSB1bmRlZmluZWQpIHAuaWQgPSBpZCsrO1xuXHR9KTtcblx0cmV0dXJuIGlkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9iYW5kKG9iaikge1xuXHRyZXR1cm4gdHlwZW9mICQob2JqKS5hdHRyKCdwcm9iYW5kJykgIT09IHR5cGVvZiB1bmRlZmluZWQgJiYgJChvYmopLmF0dHIoJ3Byb2JhbmQnKSAhPT0gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQcm9iYW5kKGRhdGFzZXQsIG5hbWUsIGlzX3Byb2JhbmQpIHtcblx0JC5lYWNoKGRhdGFzZXQsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRpZiAobmFtZSA9PT0gcC5uYW1lKVxuXHRcdFx0cC5wcm9iYW5kID0gaXNfcHJvYmFuZDtcblx0XHRlbHNlXG5cdFx0XHRkZWxldGUgcC5wcm9iYW5kO1xuXHR9KTtcbn1cblxuLy9jb21iaW5lIGFycmF5cyBpZ25vcmluZyBkdXBsaWNhdGVzXG5mdW5jdGlvbiBjb21iaW5lQXJyYXlzKGFycjEsIGFycjIpIHtcblx0Zm9yKGxldCBpPTA7IGk8YXJyMi5sZW5ndGg7IGkrKylcblx0XHRpZigkLmluQXJyYXkoIGFycjJbaV0sIGFycjEgKSA9PSAtMSkgYXJyMS5wdXNoKGFycjJbaV0pO1xufVxuXG5mdW5jdGlvbiBpbmNsdWRlX2NoaWxkcmVuKGNvbm5lY3RlZCwgcCwgZGF0YXNldCkge1xuXHRpZigkLmluQXJyYXkoIHAubmFtZSwgY29ubmVjdGVkICkgPT0gLTEpXG5cdFx0cmV0dXJuO1xuXHRjb21iaW5lQXJyYXlzKGNvbm5lY3RlZCwgZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIHApKTtcblx0bGV0IGNoaWxkcmVuID0gZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgcCk7XG5cdCQuZWFjaChjaGlsZHJlbiwgZnVuY3Rpb24oIGNoaWxkX2lkeCwgY2hpbGQgKSB7XG5cdFx0aWYoJC5pbkFycmF5KCBjaGlsZC5uYW1lLCBjb25uZWN0ZWQgKSA9PSAtMSkge1xuXHRcdFx0Y29ubmVjdGVkLnB1c2goY2hpbGQubmFtZSk7XG5cdFx0XHRjb21iaW5lQXJyYXlzKGNvbm5lY3RlZCwgZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIGNoaWxkKSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuLy9nZXQgdGhlIHBhcnRuZXJzIGZvciBhIGdpdmVuIG5vZGVcbmV4cG9ydCBmdW5jdGlvbiBnZXRfcGFydG5lcnMoZGF0YXNldCwgYW5vZGUpIHtcblx0bGV0IHB0cnMgPSBbXTtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBibm9kZSA9IGRhdGFzZXRbaV07XG5cdFx0aWYoYW5vZGUubmFtZSA9PT0gYm5vZGUubW90aGVyICYmICQuaW5BcnJheShibm9kZS5mYXRoZXIsIHB0cnMpID09IC0xKVxuXHRcdFx0cHRycy5wdXNoKGJub2RlLmZhdGhlcik7XG5cdFx0ZWxzZSBpZihhbm9kZS5uYW1lID09PSBibm9kZS5mYXRoZXIgJiYgJC5pbkFycmF5KGJub2RlLm1vdGhlciwgcHRycykgPT0gLTEpXG5cdFx0XHRwdHJzLnB1c2goYm5vZGUubW90aGVyKTtcblx0fVxuXHRyZXR1cm4gcHRycztcbn1cblxuLy9yZXR1cm4gYSBsaXN0IG9mIGluZGl2aWR1YWxzIHRoYXQgYXJlbid0IGNvbm5lY3RlZCB0byB0aGUgdGFyZ2V0XG5leHBvcnQgZnVuY3Rpb24gdW5jb25uZWN0ZWQoZGF0YXNldCl7XG5cdGxldCB0YXJnZXQgPSBkYXRhc2V0WyBnZXRQcm9iYW5kSW5kZXgoZGF0YXNldCkgXTtcblx0aWYoIXRhcmdldCl7XG5cdFx0Y29uc29sZS53YXJuKFwiTm8gdGFyZ2V0IGRlZmluZWRcIik7XG5cdFx0aWYoZGF0YXNldC5sZW5ndGggPT0gMCkge1xuXHRcdFx0dGhyb3cgXCJlbXB0eSBwZWRpZ3JlZSBkYXRhIHNldFwiO1xuXHRcdH1cblx0XHR0YXJnZXQgPSBkYXRhc2V0WzBdO1xuXHR9XG5cdGxldCBjb25uZWN0ZWQgPSBbdGFyZ2V0Lm5hbWVdO1xuXHRsZXQgY2hhbmdlID0gdHJ1ZTtcblx0bGV0IGlpID0gMDtcblx0d2hpbGUoY2hhbmdlICYmIGlpIDwgMjAwKSB7XG5cdFx0aWkrKztcblx0XHRsZXQgbmNvbm5lY3QgPSBjb25uZWN0ZWQubGVuZ3RoO1xuXHRcdCQuZWFjaChkYXRhc2V0LCBmdW5jdGlvbiggaWR4LCBwICkge1xuXHRcdFx0aWYoJC5pbkFycmF5KCBwLm5hbWUsIGNvbm5lY3RlZCApICE9IC0xKSB7XG5cdFx0XHRcdC8vIGNoZWNrIGlmIHRoaXMgcGVyc29uIG9yIGEgcGFydG5lciBoYXMgYSBwYXJlbnRcblx0XHRcdFx0bGV0IHB0cnMgPSBnZXRfcGFydG5lcnMoZGF0YXNldCwgcCk7XG5cdFx0XHRcdGxldCBoYXNfcGFyZW50ID0gKHAubmFtZSA9PT0gdGFyZ2V0Lm5hbWUgfHwgIXAubm9wYXJlbnRzKTtcblx0XHRcdFx0Zm9yKGxldCBpPTA7IGk8cHRycy5sZW5ndGg7IGkrKyl7XG5cdFx0XHRcdFx0aWYoIWdldE5vZGVCeU5hbWUoZGF0YXNldCwgcHRyc1tpXSkubm9wYXJlbnRzKVxuXHRcdFx0XHRcdFx0aGFzX3BhcmVudCA9IHRydWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihoYXNfcGFyZW50KXtcblx0XHRcdFx0XHRpZihwLm1vdGhlciAmJiAkLmluQXJyYXkoIHAubW90aGVyLCBjb25uZWN0ZWQgKSA9PSAtMSlcblx0XHRcdFx0XHRcdGNvbm5lY3RlZC5wdXNoKHAubW90aGVyKTtcblx0XHRcdFx0XHRpZihwLmZhdGhlciAmJiAkLmluQXJyYXkoIHAuZmF0aGVyLCBjb25uZWN0ZWQgKSA9PSAtMSlcblx0XHRcdFx0XHRcdGNvbm5lY3RlZC5wdXNoKHAuZmF0aGVyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKCAhcC5ub3BhcmVudHMgJiZcblx0XHRcdFx0XHQgICgocC5tb3RoZXIgJiYgJC5pbkFycmF5KCBwLm1vdGhlciwgY29ubmVjdGVkICkgIT0gLTEpIHx8XG5cdFx0XHRcdFx0ICAgKHAuZmF0aGVyICYmICQuaW5BcnJheSggcC5mYXRoZXIsIGNvbm5lY3RlZCApICE9IC0xKSkpe1xuXHRcdFx0XHRjb25uZWN0ZWQucHVzaChwLm5hbWUpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gaW5jbHVkZSBhbnkgY2hpbGRyZW5cblx0XHRcdGluY2x1ZGVfY2hpbGRyZW4oY29ubmVjdGVkLCBwLCBkYXRhc2V0KTtcblx0XHR9KTtcblx0XHRjaGFuZ2UgPSAobmNvbm5lY3QgIT0gY29ubmVjdGVkLmxlbmd0aCk7XG5cdH1cblx0bGV0IG5hbWVzID0gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC5uYW1lO30pO1xuXHRyZXR1cm4gJC5tYXAobmFtZXMsIGZ1bmN0aW9uKG5hbWUsIF9pKXtyZXR1cm4gJC5pbkFycmF5KG5hbWUsIGNvbm5lY3RlZCkgPT0gLTEgPyBuYW1lIDogbnVsbDt9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2JhbmRJbmRleChkYXRhc2V0KSB7XG5cdGxldCBwcm9iYW5kO1xuXHQkLmVhY2goZGF0YXNldCwgZnVuY3Rpb24oaSwgdmFsKSB7XG5cdFx0aWYgKGlzUHJvYmFuZCh2YWwpKSB7XG5cdFx0XHRwcm9iYW5kID0gaTtcblx0XHRcdHJldHVybiBwcm9iYW5kO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBwcm9iYW5kO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hpbGRyZW4oZGF0YXNldCwgbW90aGVyLCBmYXRoZXIpIHtcblx0bGV0IGNoaWxkcmVuID0gW107XG5cdGxldCBuYW1lcyA9IFtdO1xuXHRpZihtb3RoZXIuc2V4ID09PSAnRicpXG5cdFx0JC5lYWNoKGRhdGFzZXQsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRcdGlmKG1vdGhlci5uYW1lID09PSBwLm1vdGhlcilcblx0XHRcdFx0aWYoIWZhdGhlciB8fCBmYXRoZXIubmFtZSA9PSBwLmZhdGhlcikge1xuXHRcdFx0XHRcdGlmKCQuaW5BcnJheShwLm5hbWUsIG5hbWVzKSA9PT0gLTEpe1xuXHRcdFx0XHRcdFx0Y2hpbGRyZW4ucHVzaChwKTtcblx0XHRcdFx0XHRcdG5hbWVzLnB1c2gocC5uYW1lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHR9KTtcblx0cmV0dXJuIGNoaWxkcmVuO1xufVxuXG5mdW5jdGlvbiBjb250YWluc19wYXJlbnQoYXJyLCBtLCBmKSB7XG5cdGZvcihsZXQgaT0wOyBpPGFyci5sZW5ndGg7IGkrKylcblx0XHRpZihhcnJbaV0ubW90aGVyID09PSBtICYmIGFycltpXS5mYXRoZXIgPT09IGYpXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vLyBnZXQgdGhlIHNpYmxpbmdzIG9mIGEgZ2l2ZW4gaW5kaXZpZHVhbCAtIHNleCBpcyBhbiBvcHRpb25hbCBwYXJhbWV0ZXJcbi8vIGZvciBvbmx5IHJldHVybmluZyBicm90aGVycyBvciBzaXN0ZXJzXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2libGluZ3MoZGF0YXNldCwgcGVyc29uLCBzZXgpIHtcblx0aWYocGVyc29uID09PSB1bmRlZmluZWQgfHwgIXBlcnNvbi5tb3RoZXIgfHwgcGVyc29uLm5vcGFyZW50cylcblx0XHRyZXR1cm4gW107XG5cblx0cmV0dXJuICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gIHAubmFtZSAhPT0gcGVyc29uLm5hbWUgJiYgISgnbm9wYXJlbnRzJyBpbiBwKSAmJiBwLm1vdGhlciAmJlxuXHRcdFx0ICAgKHAubW90aGVyID09PSBwZXJzb24ubW90aGVyICYmIHAuZmF0aGVyID09PSBwZXJzb24uZmF0aGVyKSAmJlxuXHRcdFx0ICAgKCFzZXggfHwgcC5zZXggPT0gc2V4KSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuLy8gZ2V0IHRoZSBzaWJsaW5ncyArIGFkb3B0ZWQgc2libGluZ3NcbmV4cG9ydCBmdW5jdGlvbiBnZXRBbGxTaWJsaW5ncyhkYXRhc2V0LCBwZXJzb24sIHNleCkge1xuXHRyZXR1cm4gJC5tYXAoZGF0YXNldCwgZnVuY3Rpb24ocCwgX2kpe1xuXHRcdHJldHVybiAgcC5uYW1lICE9PSBwZXJzb24ubmFtZSAmJiAhKCdub3BhcmVudHMnIGluIHApICYmIHAubW90aGVyICYmXG5cdFx0XHQgICAocC5tb3RoZXIgPT09IHBlcnNvbi5tb3RoZXIgJiYgcC5mYXRoZXIgPT09IHBlcnNvbi5mYXRoZXIpICYmXG5cdFx0XHQgICAoIXNleCB8fCBwLnNleCA9PSBzZXgpID8gcCA6IG51bGw7XG5cdH0pO1xufVxuXG4vLyBnZXQgdGhlIG1vbm8vZGktenlnb3RpYyB0d2luKHMpXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHdpbnMoZGF0YXNldCwgcGVyc29uKSB7XG5cdGxldCBzaWJzID0gZ2V0U2libGluZ3MoZGF0YXNldCwgcGVyc29uKTtcblx0bGV0IHR3aW5fdHlwZSA9IChwZXJzb24ubXp0d2luID8gXCJtenR3aW5cIiA6IFwiZHp0d2luXCIpO1xuXHRyZXR1cm4gJC5tYXAoc2licywgZnVuY3Rpb24ocCwgX2kpe1xuXHRcdHJldHVybiBwLm5hbWUgIT09IHBlcnNvbi5uYW1lICYmIHBbdHdpbl90eXBlXSA9PSBwZXJzb25bdHdpbl90eXBlXSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuLy8gZ2V0IHRoZSBhZG9wdGVkIHNpYmxpbmdzIG9mIGEgZ2l2ZW4gaW5kaXZpZHVhbFxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkb3B0ZWRTaWJsaW5ncyhkYXRhc2V0LCBwZXJzb24pIHtcblx0cmV0dXJuICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gIHAubmFtZSAhPT0gcGVyc29uLm5hbWUgJiYgJ25vcGFyZW50cycgaW4gcCAmJlxuXHRcdFx0ICAgKHAubW90aGVyID09PSBwZXJzb24ubW90aGVyICYmIHAuZmF0aGVyID09PSBwZXJzb24uZmF0aGVyKSA/IHAgOiBudWxsO1xuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbENoaWxkcmVuKGRhdGFzZXQsIHBlcnNvbiwgc2V4KSB7XG5cdHJldHVybiAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbihwLCBfaSl7XG5cdFx0cmV0dXJuICEoJ25vcGFyZW50cycgaW4gcCkgJiZcblx0XHRcdCAgIChwLm1vdGhlciA9PT0gcGVyc29uLm5hbWUgfHwgcC5mYXRoZXIgPT09IHBlcnNvbi5uYW1lKSAmJlxuXHRcdFx0ICAgKCFzZXggfHwgcC5zZXggPT09IHNleCkgPyBwIDogbnVsbDtcblx0fSk7XG59XG5cbi8vIGdldCB0aGUgZGVwdGggb2YgdGhlIGdpdmVuIHBlcnNvbiBmcm9tIHRoZSByb290XG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVwdGgoZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgaWR4ID0gZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG5hbWUpO1xuXHRsZXQgZGVwdGggPSAxO1xuXG5cdHdoaWxlKGlkeCA+PSAwICYmICgnbW90aGVyJyBpbiBkYXRhc2V0W2lkeF0gfHwgZGF0YXNldFtpZHhdLnRvcF9sZXZlbCkpe1xuXHRcdGlkeCA9IGdldElkeEJ5TmFtZShkYXRhc2V0LCBkYXRhc2V0W2lkeF0ubW90aGVyKTtcblx0XHRkZXB0aCsrO1xuXHR9XG5cdHJldHVybiBkZXB0aDtcbn1cblxuLy8gZ2l2ZW4gYW4gYXJyYXkgb2YgcGVvcGxlIGdldCBhbiBpbmRleCBmb3IgYSBnaXZlbiBwZXJzb25cbmV4cG9ydCBmdW5jdGlvbiBnZXRJZHhCeU5hbWUoYXJyLCBuYW1lKSB7XG5cdGxldCBpZHggPSAtMTtcblx0JC5lYWNoKGFyciwgZnVuY3Rpb24oaSwgcCkge1xuXHRcdGlmIChuYW1lID09PSBwLm5hbWUpIHtcblx0XHRcdGlkeCA9IGk7XG5cdFx0XHRyZXR1cm4gaWR4O1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBpZHg7XG59XG5cbi8vIGdldCB0aGUgbm9kZXMgYXQgYSBnaXZlbiBkZXB0aCBzb3J0ZWQgYnkgdGhlaXIgeCBwb3NpdGlvblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVzQXREZXB0aChmbm9kZXMsIGRlcHRoLCBleGNsdWRlX25hbWVzKSB7XG5cdHJldHVybiAkLm1hcChmbm9kZXMsIGZ1bmN0aW9uKHAsIF9pKXtcblx0XHRyZXR1cm4gcC5kZXB0aCA9PSBkZXB0aCAmJiAhcC5kYXRhLmhpZGRlbiAmJiAkLmluQXJyYXkocC5kYXRhLm5hbWUsIGV4Y2x1ZGVfbmFtZXMpID09IC0xID8gcCA6IG51bGw7XG5cdH0pLnNvcnQoZnVuY3Rpb24gKGEsYikge3JldHVybiBhLnggLSBiLng7fSk7XG59XG5cbi8vIGNvbnZlcnQgdGhlIHBhcnRuZXIgbmFtZXMgaW50byBjb3JyZXNwb25kaW5nIHRyZWUgbm9kZXNcbmV4cG9ydCBmdW5jdGlvbiBsaW5rTm9kZXMoZmxhdHRlbk5vZGVzLCBwYXJ0bmVycykge1xuXHRsZXQgbGlua3MgPSBbXTtcblx0Zm9yKGxldCBpPTA7IGk8IHBhcnRuZXJzLmxlbmd0aDsgaSsrKVxuXHRcdGxpbmtzLnB1c2goeydtb3RoZXInOiBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnNbaV0ubW90aGVyLm5hbWUpLFxuXHRcdFx0XHRcdCdmYXRoZXInOiBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnNbaV0uZmF0aGVyLm5hbWUpfSk7XG5cdHJldHVybiBsaW5rcztcbn1cblxuLy8gZ2V0IGFuY2VzdG9ycyBvZiBhIG5vZGVcbmV4cG9ydCBmdW5jdGlvbiBhbmNlc3RvcnMoZGF0YXNldCwgbm9kZSkge1xuXHRsZXQgYW5jZXN0b3JzID0gW107XG5cdGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuXHRcdGlmKG5vZGUuZGF0YSkgbm9kZSA9IG5vZGUuZGF0YTtcblx0XHRpZignbW90aGVyJyBpbiBub2RlICYmICdmYXRoZXInIGluIG5vZGUgJiYgISgnbm9wYXJlbnRzJyBpbiBub2RlKSl7XG5cdFx0XHRyZWN1cnNlKGdldE5vZGVCeU5hbWUoZGF0YXNldCwgbm9kZS5tb3RoZXIpKTtcblx0XHRcdHJlY3Vyc2UoZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBub2RlLmZhdGhlcikpO1xuXHRcdH1cblx0XHRhbmNlc3RvcnMucHVzaChub2RlKTtcblx0fVxuXHRyZWN1cnNlKG5vZGUpO1xuXHRyZXR1cm4gYW5jZXN0b3JzO1xufVxuXG4vLyB0ZXN0IGlmIHR3byBub2RlcyBhcmUgY29uc2FuZ3Vpbm91cyBwYXJ0bmVyc1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnNhbmd1aXR5KG5vZGUxLCBub2RlMiwgb3B0cykge1xuXHRpZihub2RlMS5kZXB0aCAhPT0gbm9kZTIuZGVwdGgpIC8vIHBhcmVudHMgYXQgZGlmZmVyZW50IGRlcHRoc1xuXHRcdHJldHVybiB0cnVlO1xuXHRsZXQgYW5jZXN0b3JzMSA9IGFuY2VzdG9ycyhvcHRzLmRhdGFzZXQsIG5vZGUxKTtcblx0bGV0IGFuY2VzdG9yczIgPSBhbmNlc3RvcnMob3B0cy5kYXRhc2V0LCBub2RlMik7XG5cdGxldCBuYW1lczEgPSAkLm1hcChhbmNlc3RvcnMxLCBmdW5jdGlvbihhbmNlc3RvciwgX2kpe3JldHVybiBhbmNlc3Rvci5uYW1lO30pO1xuXHRsZXQgbmFtZXMyID0gJC5tYXAoYW5jZXN0b3JzMiwgZnVuY3Rpb24oYW5jZXN0b3IsIF9pKXtyZXR1cm4gYW5jZXN0b3IubmFtZTt9KTtcblx0bGV0IGNvbnNhbmd1aXR5ID0gZmFsc2U7XG5cdCQuZWFjaChuYW1lczEsIGZ1bmN0aW9uKCBpbmRleCwgbmFtZSApIHtcblx0XHRpZigkLmluQXJyYXkobmFtZSwgbmFtZXMyKSAhPT0gLTEpe1xuXHRcdFx0Y29uc2FuZ3VpdHkgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBjb25zYW5ndWl0eTtcbn1cblxuLy8gcmV0dXJuIGEgZmxhdHRlbmVkIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmVlXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbihyb290KSB7XG5cdGxldCBmbGF0ID0gW107XG5cdGZ1bmN0aW9uIHJlY3Vyc2Uobm9kZSkge1xuXHRcdGlmKG5vZGUuY2hpbGRyZW4pXG5cdFx0XHRub2RlLmNoaWxkcmVuLmZvckVhY2gocmVjdXJzZSk7XG5cdFx0ZmxhdC5wdXNoKG5vZGUpO1xuXHR9XG5cdHJlY3Vyc2Uocm9vdCk7XG5cdHJldHVybiBmbGF0O1xufVxuXG4vLyBBZGp1c3QgRDMgbGF5b3V0IHBvc2l0aW9uaW5nLlxuLy8gUG9zaXRpb24gaGlkZGVuIHBhcmVudCBub2RlIGNlbnRyaW5nIHRoZW0gYmV0d2VlbiBmYXRoZXIgYW5kIG1vdGhlciBub2Rlcy4gUmVtb3ZlIGtpbmtzXG4vLyBmcm9tIGxpbmtzIC0gZS5nLiB3aGVyZSB0aGVyZSBpcyBhIHNpbmdsZSBjaGlsZCBwbHVzIGEgaGlkZGVuIGNoaWxkXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0X2Nvb3JkcyhvcHRzLCByb290LCBmbGF0dGVuTm9kZXMpIHtcblx0ZnVuY3Rpb24gcmVjdXJzZShub2RlKSB7XG5cdFx0aWYgKG5vZGUuY2hpbGRyZW4pIHtcblx0XHRcdG5vZGUuY2hpbGRyZW4uZm9yRWFjaChyZWN1cnNlKTtcblxuXHRcdFx0aWYobm9kZS5kYXRhLmZhdGhlciAhPT0gdW5kZWZpbmVkKSB7IFx0Ly8gaGlkZGVuIG5vZGVzXG5cdFx0XHRcdGxldCBmYXRoZXIgPSBnZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2Rlcywgbm9kZS5kYXRhLmZhdGhlci5uYW1lKTtcblx0XHRcdFx0bGV0IG1vdGhlciA9IGdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBub2RlLmRhdGEubW90aGVyLm5hbWUpO1xuXHRcdFx0XHRsZXQgeG1pZCA9IChmYXRoZXIueCArIG1vdGhlci54KSAvMjtcblx0XHRcdFx0aWYoIW92ZXJsYXAob3B0cywgcm9vdC5kZXNjZW5kYW50cygpLCB4bWlkLCBub2RlLmRlcHRoLCBbbm9kZS5kYXRhLm5hbWVdKSkge1xuXHRcdFx0XHRcdG5vZGUueCA9IHhtaWQ7ICAgLy8gY2VudHJhbGlzZSBwYXJlbnQgbm9kZXNcblx0XHRcdFx0XHRsZXQgZGlmZiA9IG5vZGUueCAtIHhtaWQ7XG5cdFx0XHRcdFx0aWYobm9kZS5jaGlsZHJlbi5sZW5ndGggPT0gMiAmJiAobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiB8fCBub2RlLmNoaWxkcmVuWzFdLmRhdGEuaGlkZGVuKSkge1xuXHRcdFx0XHRcdFx0aWYoIShub2RlLmNoaWxkcmVuWzBdLmRhdGEuaGlkZGVuICYmIG5vZGUuY2hpbGRyZW5bMV0uZGF0YS5oaWRkZW4pKSB7XG5cdFx0XHRcdFx0XHRcdGxldCBjaGlsZDEgPSAobm9kZS5jaGlsZHJlblswXS5kYXRhLmhpZGRlbiA/IG5vZGUuY2hpbGRyZW5bMV0gOiBub2RlLmNoaWxkcmVuWzBdKTtcblx0XHRcdFx0XHRcdFx0bGV0IGNoaWxkMiA9IChub2RlLmNoaWxkcmVuWzBdLmRhdGEuaGlkZGVuID8gbm9kZS5jaGlsZHJlblswXSA6IG5vZGUuY2hpbGRyZW5bMV0pO1xuXHRcdFx0XHRcdFx0XHRpZiggKChjaGlsZDEueCA8IGNoaWxkMi54ICYmIHhtaWQgPCBjaGlsZDIueCkgfHwgKGNoaWxkMS54ID4gY2hpbGQyLnggJiYgeG1pZCA+IGNoaWxkMi54KSkgJiZcblx0XHRcdFx0XHRcdFx0XHQhb3ZlcmxhcChvcHRzLCByb290LmRlc2NlbmRhbnRzKCksIHhtaWQsIGNoaWxkMS5kZXB0aCwgW2NoaWxkMS5kYXRhLm5hbWVdKSl7XG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGQxLnggPSB4bWlkO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIGlmKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDEgJiYgIW5vZGUuY2hpbGRyZW5bMF0uZGF0YS5oaWRkZW4pIHtcblx0XHRcdFx0XHRcdGlmKCFvdmVybGFwKG9wdHMsIHJvb3QuZGVzY2VuZGFudHMoKSwgeG1pZCwgbm9kZS5jaGlsZHJlblswXS5kZXB0aCwgW25vZGUuY2hpbGRyZW5bMF0uZGF0YS5uYW1lXSkpXG5cdFx0XHRcdFx0XHRcdG5vZGUuY2hpbGRyZW5bMF0ueCA9IHhtaWQ7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmKGRpZmYgIT09IDAgJiYgIW5vZGVzT3ZlcmxhcChvcHRzLCBub2RlLCBkaWZmLCByb290KSl7XG5cdFx0XHRcdFx0XHRcdGlmKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRub2RlLmNoaWxkcmVuWzBdLnggPSB4bWlkO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGxldCBkZXNjZW5kYW50cyA9IG5vZGUuZGVzY2VuZGFudHMoKTtcblx0XHRcdFx0XHRcdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ0FESlVTVElORyAnK25vZGUuZGF0YS5uYW1lKycgTk8uIERFU0NFTkRBTlRTICcrZGVzY2VuZGFudHMubGVuZ3RoKycgZGlmZj0nK2RpZmYpO1xuXHRcdFx0XHRcdFx0XHRcdGZvcihsZXQgaT0wOyBpPGRlc2NlbmRhbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZihub2RlLmRhdGEubmFtZSAhPT0gZGVzY2VuZGFudHNbaV0uZGF0YS5uYW1lKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRkZXNjZW5kYW50c1tpXS54IC09IGRpZmY7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2UgaWYoKG5vZGUueCA8IGZhdGhlci54ICYmIG5vZGUueCA8IG1vdGhlci54KSB8fCAobm9kZS54ID4gZmF0aGVyLnggJiYgbm9kZS54ID4gbW90aGVyLngpKXtcblx0XHRcdFx0XHRcdG5vZGUueCA9IHhtaWQ7ICAgLy8gY2VudHJhbGlzZSBwYXJlbnQgbm9kZXMgaWYgaXQgZG9lc24ndCBsaWUgYmV0d2VlbiBtb3RoZXIgYW5kIGZhdGhlclxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJlY3Vyc2Uocm9vdCk7XG5cdHJlY3Vyc2Uocm9vdCk7XG59XG5cbi8vIHRlc3QgaWYgbW92aW5nIHNpYmxpbmdzIGJ5IGRpZmYgb3ZlcmxhcHMgd2l0aCBvdGhlciBub2Rlc1xuZnVuY3Rpb24gbm9kZXNPdmVybGFwKG9wdHMsIG5vZGUsIGRpZmYsIHJvb3QpIHtcblx0bGV0IGRlc2NlbmRhbnRzID0gbm9kZS5kZXNjZW5kYW50cygpO1xuXHRsZXQgZGVzY2VuZGFudHNOYW1lcyA9ICQubWFwKGRlc2NlbmRhbnRzLCBmdW5jdGlvbihkZXNjZW5kYW50LCBfaSl7cmV0dXJuIGRlc2NlbmRhbnQuZGF0YS5uYW1lO30pO1xuXHRsZXQgbm9kZXMgPSByb290LmRlc2NlbmRhbnRzKCk7XG5cdGZvcihsZXQgaT0wOyBpPGRlc2NlbmRhbnRzLmxlbmd0aDsgaSsrKXtcblx0XHRsZXQgZGVzY2VuZGFudCA9IGRlc2NlbmRhbnRzW2ldO1xuXHRcdGlmKG5vZGUuZGF0YS5uYW1lICE9PSBkZXNjZW5kYW50LmRhdGEubmFtZSl7XG5cdFx0XHRsZXQgeG5ldyA9IGRlc2NlbmRhbnQueCAtIGRpZmY7XG5cdFx0XHRpZihvdmVybGFwKG9wdHMsIG5vZGVzLCB4bmV3LCBkZXNjZW5kYW50LmRlcHRoLCBkZXNjZW5kYW50c05hbWVzKSlcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy8gdGVzdCBpZiB4IHBvc2l0aW9uIG92ZXJsYXBzIGEgbm9kZSBhdCB0aGUgc2FtZSBkZXB0aFxuZXhwb3J0IGZ1bmN0aW9uIG92ZXJsYXAob3B0cywgbm9kZXMsIHhuZXcsIGRlcHRoLCBleGNsdWRlX25hbWVzKSB7XG5cdGZvcihsZXQgbj0wOyBuPG5vZGVzLmxlbmd0aDsgbisrKSB7XG5cdFx0aWYoZGVwdGggPT0gbm9kZXNbbl0uZGVwdGggJiYgJC5pbkFycmF5KG5vZGVzW25dLmRhdGEubmFtZSwgZXhjbHVkZV9uYW1lcykgPT0gLTEpe1xuXHRcdFx0aWYoTWF0aC5hYnMoeG5ldyAtIG5vZGVzW25dLngpIDwgKG9wdHMuc3ltYm9sX3NpemUqMS4xNSkpXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbi8vIGdpdmVuIGEgcGVyc29ucyBuYW1lIHJldHVybiB0aGUgY29ycmVzcG9uZGluZyBkMyB0cmVlIG5vZGVcbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlQnlOYW1lKG5vZGVzLCBuYW1lKSB7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZihub2Rlc1tpXS5kYXRhICYmIG5hbWUgPT09IG5vZGVzW2ldLmRhdGEubmFtZSlcblx0XHRcdHJldHVybiBub2Rlc1tpXTtcblx0XHRlbHNlIGlmIChuYW1lID09PSBub2Rlc1tpXS5uYW1lKVxuXHRcdFx0cmV0dXJuIG5vZGVzW2ldO1xuXHR9XG59XG5cbi8vIGdpdmVuIHRoZSBuYW1lIG9mIGEgdXJsIHBhcmFtIGdldCB0aGUgdmFsdWVcbmV4cG9ydCBmdW5jdGlvbiB1cmxQYXJhbShuYW1lKXtcblx0bGV0IHJlc3VsdHMgPSBuZXcgUmVnRXhwKCdbPyZdJyArIG5hbWUgKyAnPShbXiYjXSopJykuZXhlYyh3aW5kb3cubG9jYXRpb24uaHJlZik7XG5cdGlmIChyZXN1bHRzPT09bnVsbClcblx0ICAgcmV0dXJuIG51bGw7XG5cdGVsc2Vcblx0ICAgcmV0dXJuIHJlc3VsdHNbMV0gfHwgMDtcbn1cblxuLy8gZ2V0IGdyYW5kcGFyZW50cyBpbmRleFxuZXhwb3J0IGZ1bmN0aW9uIGdldF9ncmFuZHBhcmVudHNfaWR4KGRhdGFzZXQsIG1pZHgsIGZpZHgpIHtcblx0bGV0IGdtaWR4ID0gbWlkeDtcblx0bGV0IGdmaWR4ID0gZmlkeDtcblx0d2hpbGUoICAnbW90aGVyJyBpbiBkYXRhc2V0W2dtaWR4XSAmJiAnbW90aGVyJyBpbiBkYXRhc2V0W2dmaWR4XSAmJlxuXHRcdCAgISgnbm9wYXJlbnRzJyBpbiBkYXRhc2V0W2dtaWR4XSkgJiYgISgnbm9wYXJlbnRzJyBpbiBkYXRhc2V0W2dmaWR4XSkpe1xuXHRcdGdtaWR4ID0gZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbZ21pZHhdLm1vdGhlcik7XG5cdFx0Z2ZpZHggPSBnZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtnZmlkeF0ubW90aGVyKTtcblx0fVxuXHRyZXR1cm4geydtaWR4JzogZ21pZHgsICdmaWR4JzogZ2ZpZHh9O1xufVxuXG4vLyBTZXQgb3IgcmVtb3ZlIHByb2JhbmQgYXR0cmlidXRlcy5cbi8vIElmIGEgdmFsdWUgaXMgbm90IHByb3ZpZGVkIHRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCBmcm9tIHRoZSBwcm9iYW5kLlxuLy8gJ2tleScgY2FuIGJlIGEgbGlzdCBvZiBrZXlzIG9yIGEgc2luZ2xlIGtleS5cbmV4cG9ydCBmdW5jdGlvbiBwcm9iYW5kX2F0dHIob3B0cywga2V5cywgdmFsdWUpe1xuXHRsZXQgcHJvYmFuZCA9IG9wdHMuZGF0YXNldFsgZ2V0UHJvYmFuZEluZGV4KG9wdHMuZGF0YXNldCkgXTtcblx0bm9kZV9hdHRyKG9wdHMsIHByb2JhbmQubmFtZSwga2V5cywgdmFsdWUpO1xufVxuXG4vLyBTZXQgb3IgcmVtb3ZlIG5vZGUgYXR0cmlidXRlcy5cbi8vIElmIGEgdmFsdWUgaXMgbm90IHByb3ZpZGVkIHRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZC5cbi8vICdrZXknIGNhbiBiZSBhIGxpc3Qgb2Yga2V5cyBvciBhIHNpbmdsZSBrZXkuXG5leHBvcnQgZnVuY3Rpb24gbm9kZV9hdHRyKG9wdHMsIG5hbWUsIGtleXMsIHZhbHVlKXtcblx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGUuY3VycmVudChvcHRzKSk7XG5cdGxldCBub2RlID0gZ2V0Tm9kZUJ5TmFtZShuZXdkYXRhc2V0LCBuYW1lKTtcblx0aWYoIW5vZGUpe1xuXHRcdGNvbnNvbGUud2FybihcIk5vIHBlcnNvbiBkZWZpbmVkXCIpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGlmKCEkLmlzQXJyYXkoa2V5cykpIHtcblx0XHRrZXlzID0gW2tleXNdO1xuXHR9XG5cblx0aWYodmFsdWUpIHtcblx0XHRmb3IobGV0IGk9MDsgaTxrZXlzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgayA9IGtleXNbaV07XG5cdFx0XHQvL2NvbnNvbGUubG9nKCdWQUxVRSBQUk9WSURFRCcsIGssIHZhbHVlLCAoayBpbiBub2RlKSk7XG5cdFx0XHRpZihrIGluIG5vZGUgJiYga2V5cy5sZW5ndGggPT09IDEpIHtcblx0XHRcdFx0aWYobm9kZVtrXSA9PT0gdmFsdWUpXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHQgICBpZihKU09OLnN0cmluZ2lmeShub2RlW2tdKSA9PT0gSlNPTi5zdHJpbmdpZnkodmFsdWUpKVxuXHRcdFx0XHRcdCAgIHJldHVybjtcblx0XHRcdFx0fSBjYXRjaChlKXtcblx0XHRcdFx0XHQvLyBjb250aW51ZSByZWdhcmRsZXNzIG9mIGVycm9yXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdG5vZGVba10gPSB2YWx1ZTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0bGV0IGZvdW5kID0gZmFsc2U7XG5cdFx0Zm9yKGxldCBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0bGV0IGsgPSBrZXlzW2ldO1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnTk8gVkFMVUUgUFJPVklERUQnLCBrLCAoayBpbiBub2RlKSk7XG5cdFx0XHRpZihrIGluIG5vZGUpIHtcblx0XHRcdFx0ZGVsZXRlIG5vZGVba107XG5cdFx0XHRcdGZvdW5kID0gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYoIWZvdW5kKVxuXHRcdFx0cmV0dXJuO1xuXHR9XG5cdHN5bmNUd2lucyhuZXdkYXRhc2V0LCBub2RlKTtcblx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0cmVidWlsZChvcHRzKTtcbn1cblxuLy8gYWRkIGEgY2hpbGQgdG8gdGhlIHByb2JhbmQ7IGdpdmViIHNleCwgYWdlLCB5b2IgYW5kIGJyZWFzdGZlZWRpbmcgbW9udGhzIChvcHRpb25hbClcbmV4cG9ydCBmdW5jdGlvbiBwcm9iYW5kX2FkZF9jaGlsZChvcHRzLCBzZXgsIGFnZSwgeW9iLCBicmVhc3RmZWVkaW5nKXtcblx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQocGVkY2FjaGUuY3VycmVudChvcHRzKSk7XG5cdGxldCBwcm9iYW5kID0gbmV3ZGF0YXNldFsgZ2V0UHJvYmFuZEluZGV4KG5ld2RhdGFzZXQpIF07XG5cdGlmKCFwcm9iYW5kKXtcblx0XHRjb25zb2xlLndhcm4oXCJObyBwcm9iYW5kIGRlZmluZWRcIik7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxldCBuZXdjaGlsZCA9IGFkZGNoaWxkKG5ld2RhdGFzZXQsIHByb2JhbmQsIHNleCwgMSlbMF07XG5cdG5ld2NoaWxkLmFnZSA9IGFnZTtcblx0bmV3Y2hpbGQueW9iID0geW9iO1xuXHRpZihicmVhc3RmZWVkaW5nICE9PSB1bmRlZmluZWQpXG5cdFx0bmV3Y2hpbGQuYnJlYXN0ZmVlZGluZyA9IGJyZWFzdGZlZWRpbmc7XG5cdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG5cdHJldHVybiBuZXdjaGlsZC5uYW1lO1xufVxuXG4vLyBkZWxldGUgbm9kZSB1c2luZyB0aGUgbmFtZVxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZV9ub2RlX2J5X25hbWUob3B0cywgbmFtZSl7XG5cdGZ1bmN0aW9uIG9uRG9uZShvcHRzLCBkYXRhc2V0KSB7XG5cdFx0Ly8gYXNzaWduIG5ldyBkYXRhc2V0IGFuZCByZWJ1aWxkIHBlZGlncmVlXG5cdFx0b3B0cy5kYXRhc2V0ID0gZGF0YXNldDtcblx0XHRyZWJ1aWxkKG9wdHMpO1xuXHR9XG5cdGxldCBuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlLmN1cnJlbnQob3B0cykpO1xuXHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUocGVkY2FjaGUuY3VycmVudChvcHRzKSwgbmFtZSk7XG5cdGlmKCFub2RlKXtcblx0XHRjb25zb2xlLndhcm4oXCJObyBub2RlIGRlZmluZWRcIik7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGRlbGV0ZV9ub2RlX2RhdGFzZXQobmV3ZGF0YXNldCwgbm9kZSwgb3B0cywgb25Eb25lKTtcbn1cblxuLy8gY2hlY2sgYnkgbmFtZSBpZiB0aGUgaW5kaXZpZHVhbCBleGlzdHNcbmV4cG9ydCBmdW5jdGlvbiBleGlzdHMob3B0cywgbmFtZSl7XG5cdHJldHVybiBnZXROb2RlQnlOYW1lKHBlZGNhY2hlLmN1cnJlbnQob3B0cyksIG5hbWUpICE9PSB1bmRlZmluZWQ7XG59XG5cbi8vIHByaW50IG9wdGlvbnMgYW5kIGRhdGFzZXRcbmV4cG9ydCBmdW5jdGlvbiBwcmludF9vcHRzKG9wdHMpe1xuXHQkKFwiI3BlZGlncmVlX2RhdGFcIikucmVtb3ZlKCk7XG5cdCQoXCJib2R5XCIpLmFwcGVuZChcIjxkaXYgaWQ9J3BlZGlncmVlX2RhdGEnPjwvZGl2PlwiICk7XG5cdGxldCBrZXk7XG5cdGZvcihsZXQgaT0wOyBpPG9wdHMuZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBwZXJzb24gPSBcIjxkaXYgY2xhc3M9J3Jvdyc+PHN0cm9uZyBjbGFzcz0nY29sLW1kLTEgdGV4dC1yaWdodCc+XCIrb3B0cy5kYXRhc2V0W2ldLm5hbWUrXCI8L3N0cm9uZz48ZGl2IGNsYXNzPSdjb2wtbWQtMTEnPlwiO1xuXHRcdGZvcihrZXkgaW4gb3B0cy5kYXRhc2V0W2ldKSB7XG5cdFx0XHRpZihrZXkgPT09ICduYW1lJykgY29udGludWU7XG5cdFx0XHRpZihrZXkgPT09ICdwYXJlbnQnKVxuXHRcdFx0XHRwZXJzb24gKz0gXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHMuZGF0YXNldFtpXVtrZXldLm5hbWUrXCI7IDwvc3Bhbj5cIjtcblx0XHRcdGVsc2UgaWYgKGtleSA9PT0gJ2NoaWxkcmVuJykge1xuXHRcdFx0XHRpZiAob3B0cy5kYXRhc2V0W2ldW2tleV1bMF0gIT09IHVuZGVmaW5lZClcblx0XHRcdFx0XHRwZXJzb24gKz0gXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHMuZGF0YXNldFtpXVtrZXldWzBdLm5hbWUrXCI7IDwvc3Bhbj5cIjtcblx0XHRcdH0gZWxzZVxuXHRcdFx0XHRwZXJzb24gKz0gXCI8c3Bhbj5cIitrZXkgKyBcIjpcIiArIG9wdHMuZGF0YXNldFtpXVtrZXldK1wiOyA8L3NwYW4+XCI7XG5cdFx0fVxuXHRcdCQoXCIjcGVkaWdyZWVfZGF0YVwiKS5hcHBlbmQocGVyc29uICsgXCI8L2Rpdj48L2Rpdj5cIik7XG5cblx0fVxuXHQkKFwiI3BlZGlncmVlX2RhdGFcIikuYXBwZW5kKFwiPGJyIC8+PGJyIC8+XCIpO1xuXHRmb3Ioa2V5IGluIG9wdHMpIHtcblx0XHRpZihrZXkgPT09ICdkYXRhc2V0JykgY29udGludWU7XG5cdFx0JChcIiNwZWRpZ3JlZV9kYXRhXCIpLmFwcGVuZChcIjxzcGFuPlwiK2tleSArIFwiOlwiICsgb3B0c1trZXldK1wiOyA8L3NwYW4+XCIpO1xuXHR9XG59XG4iLCIvLyB1bmRvLCByZWRvLCByZXNldCBidXR0b25zXG5pbXBvcnQgKiBhcyBwZWRjYWNoZSBmcm9tICcuL3BlZGNhY2hlLmpzJztcbmltcG9ydCB7cmVidWlsZCwgYnVpbGR9IGZyb20gJy4vcGVkaWdyZWUuanMnO1xuaW1wb3J0IHtjb3B5X2RhdGFzZXQsIGdldFByb2JhbmRJbmRleH0gZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGQob3B0aW9ucykge1xuXHRsZXQgb3B0cyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgLy8gZGVmYXVsdHNcblx0XHRidG5fdGFyZ2V0OiAncGVkaWdyZWVfaGlzdG9yeSdcbiAgICB9LCBvcHRpb25zICk7XG5cblx0bGV0IGJ0bnMgPSBbe1wiZmFcIjogXCJmYS11bmRvXCIsIFwidGl0bGVcIjogXCJ1bmRvXCJ9LFxuXHRcdFx0XHR7XCJmYVwiOiBcImZhLXJlcGVhdFwiLCBcInRpdGxlXCI6IFwicmVkb1wifSxcblx0XHRcdFx0e1wiZmFcIjogXCJmYS1yZWZyZXNoXCIsIFwidGl0bGVcIjogXCJyZXNldFwifSxcblx0XHRcdFx0e1wiZmFcIjogXCJmYS1hcnJvd3MtYWx0XCIsIFwidGl0bGVcIjogXCJmdWxsc2NyZWVuXCJ9XTtcblx0bGV0IGxpcyA9IFwiXCI7XG5cdGZvcihsZXQgaT0wOyBpPGJ0bnMubGVuZ3RoOyBpKyspIHtcblx0XHRsaXMgKz0gJzxsaVwiPic7XG5cdFx0bGlzICs9ICcmbmJzcDs8aSBjbGFzcz1cImZhIGZhLWxnICcgKyBidG5zW2ldLmZhICsgJ1wiICcgK1xuXHRcdCAgICAgICAgICAgICAgIChidG5zW2ldLmZhID09IFwiZmEtYXJyb3dzLWFsdFwiID8gJ2lkPVwiZnVsbHNjcmVlblwiICcgOiAnJykgK1xuXHRcdCAgICAgICAgICAgICAgICcgYXJpYS1oaWRkZW49XCJ0cnVlXCIgdGl0bGU9XCInKyBidG5zW2ldLnRpdGxlICsnXCI+PC9pPic7XG5cdFx0bGlzICs9ICc8L2xpPic7XG5cdH1cblx0JCggXCIjXCIrb3B0cy5idG5fdGFyZ2V0ICkuYXBwZW5kKGxpcyk7XG5cdGNsaWNrKG9wdHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNfZnVsbHNjcmVlbigpe1xuXHRyZXR1cm4gKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8IGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50KTtcbn1cblxuZnVuY3Rpb24gY2xpY2sob3B0cykge1xuXHQvLyBmdWxsc2NyZWVuXG4gICAgJChkb2N1bWVudCkub24oJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UgbW96ZnVsbHNjcmVlbmNoYW5nZSBmdWxsc2NyZWVuY2hhbmdlIE1TRnVsbHNjcmVlbkNoYW5nZScsIGZ1bmN0aW9uKF9lKSAge1xuXHRcdGxldCBsb2NhbF9kYXRhc2V0ID0gcGVkY2FjaGUuY3VycmVudChvcHRzKTtcblx0XHRpZiAobG9jYWxfZGF0YXNldCAhPT0gdW5kZWZpbmVkICYmIGxvY2FsX2RhdGFzZXQgIT09IG51bGwpIHtcblx0XHRcdG9wdHMuZGF0YXNldCA9IGxvY2FsX2RhdGFzZXQ7XG5cdFx0fVxuXHRcdHJlYnVpbGQob3B0cyk7XG4gICAgfSk7XG5cblx0JCgnI2Z1bGxzY3JlZW4nKS5vbignY2xpY2snLCBmdW5jdGlvbihfZSkge1xuXHRcdGlmICghZG9jdW1lbnQubW96RnVsbFNjcmVlbiAmJiAhZG9jdW1lbnQud2Via2l0RnVsbFNjcmVlbikge1xuXHRcdFx0bGV0IHRhcmdldCA9ICQoXCIjXCIrb3B0cy50YXJnZXREaXYpWzBdO1xuXHRcdFx0aWYodGFyZ2V0Lm1velJlcXVlc3RGdWxsU2NyZWVuKVxuXHRcdFx0XHR0YXJnZXQubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dGFyZ2V0LndlYmtpdFJlcXVlc3RGdWxsU2NyZWVuKEVsZW1lbnQuQUxMT1dfS0VZQk9BUkRfSU5QVVQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZihkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKVxuXHRcdFx0XHRkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGRvY3VtZW50LndlYmtpdENhbmNlbEZ1bGxTY3JlZW4oKTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIHVuZG8vcmVkby9yZXNldFxuXHQkKCBcIiNcIitvcHRzLmJ0bl90YXJnZXQgKS5vbiggXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRpZigkKGUudGFyZ2V0KS5oYXNDbGFzcyhcImRpc2FibGVkXCIpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0aWYoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2ZhLXVuZG8nKSkge1xuXHRcdFx0b3B0cy5kYXRhc2V0ID0gcGVkY2FjaGUucHJldmlvdXMob3B0cyk7XG5cdFx0XHQkKFwiI1wiK29wdHMudGFyZ2V0RGl2KS5lbXB0eSgpO1xuXHRcdFx0YnVpbGQob3B0cyk7XG5cdFx0fSBlbHNlIGlmICgkKGUudGFyZ2V0KS5oYXNDbGFzcygnZmEtcmVwZWF0JykpIHtcblx0XHRcdG9wdHMuZGF0YXNldCA9IHBlZGNhY2hlLm5leHQob3B0cyk7XG5cdFx0XHQkKFwiI1wiK29wdHMudGFyZ2V0RGl2KS5lbXB0eSgpO1xuXHRcdFx0YnVpbGQob3B0cyk7XG5cdFx0fSBlbHNlIGlmICgkKGUudGFyZ2V0KS5oYXNDbGFzcygnZmEtcmVmcmVzaCcpKSB7XG5cdFx0XHQkKCc8ZGl2IGlkPVwibXNnRGlhbG9nXCI+UmVzZXR0aW5nIHRoZSBwZWRpZ3JlZSBtYXkgcmVzdWx0IGluIGxvc3Mgb2Ygc29tZSBkYXRhLjwvZGl2PicpLmRpYWxvZyh7XG5cdFx0XHRcdHRpdGxlOiAnQ29uZmlybSBSZXNldCcsXG5cdFx0XHRcdHJlc2l6YWJsZTogZmFsc2UsXG5cdFx0XHRcdGhlaWdodDogXCJhdXRvXCIsXG5cdFx0XHRcdHdpZHRoOiA0MDAsXG5cdFx0XHRcdG1vZGFsOiB0cnVlLFxuXHRcdFx0XHRidXR0b25zOiB7XG5cdFx0XHRcdFx0Q29udGludWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0cmVzZXQob3B0cywgb3B0cy5rZWVwX3Byb2JhbmRfb25fcmVzZXQpO1xuXHRcdFx0XHRcdFx0JCh0aGlzKS5kaWFsb2coIFwiY2xvc2VcIiApO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0Q2FuY2VsOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdCQodGhpcykuZGlhbG9nKCBcImNsb3NlXCIgKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0ICAgIH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdC8vIHRyaWdnZXIgZmhDaGFuZ2UgZXZlbnRcblx0XHQkKGRvY3VtZW50KS50cmlnZ2VyKCdmaENoYW5nZScsIFtvcHRzXSk7XG5cdH0pO1xufVxuXG4vLyByZXNldCBwZWRpZ3JlZSBhbmQgY2xlYXIgdGhlIGhpc3RvcnlcbmV4cG9ydCBmdW5jdGlvbiByZXNldChvcHRzLCBrZWVwX3Byb2JhbmQpIHtcblx0bGV0IHByb2JhbmQ7XG5cdGlmKGtlZXBfcHJvYmFuZCkge1xuXHRcdGxldCBsb2NhbF9kYXRhc2V0ID0gcGVkY2FjaGUuY3VycmVudChvcHRzKTtcblx0XHRsZXQgbmV3ZGF0YXNldCA9ICBjb3B5X2RhdGFzZXQobG9jYWxfZGF0YXNldCk7XG5cdFx0cHJvYmFuZCA9IG5ld2RhdGFzZXRbZ2V0UHJvYmFuZEluZGV4KG5ld2RhdGFzZXQpXTtcblx0XHQvL2xldCBjaGlsZHJlbiA9IHBlZGlncmVlX3V0aWwuZ2V0Q2hpbGRyZW4obmV3ZGF0YXNldCwgcHJvYmFuZCk7XG5cdFx0cHJvYmFuZC5uYW1lID0gXCJjaDFcIjtcblx0XHRwcm9iYW5kLm1vdGhlciA9IFwiZjIxXCI7XG5cdFx0cHJvYmFuZC5mYXRoZXIgPSBcIm0yMVwiO1xuXHRcdC8vIGNsZWFyIHBlZGlncmVlIGRhdGEgYnV0IGtlZXAgcHJvYmFuZCBkYXRhIGFuZCByaXNrIGZhY3RvcnNcblx0XHRwZWRjYWNoZS5jbGVhcl9wZWRpZ3JlZV9kYXRhKG9wdHMpXG5cdH0gZWxzZSB7XG5cdFx0cHJvYmFuZCA9IHtcblx0XHRcdFwibmFtZVwiOlwiY2gxXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwicHJvYmFuZFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwibWVcIlxuXHRcdH07XG5cdFx0cGVkY2FjaGUuY2xlYXIob3B0cyk7IC8vIGNsZWFyIGFsbCBzdG9yYWdlIGRhdGFcblx0fVxuXG5cdGRlbGV0ZSBvcHRzLmRhdGFzZXQ7XG5cblx0bGV0IHNlbGVjdGVkID0gJChcImlucHV0W25hbWU9J2RlZmF1bHRfZmFtJ106Y2hlY2tlZFwiKTtcblx0aWYoc2VsZWN0ZWQubGVuZ3RoID4gMCAmJiBzZWxlY3RlZC52YWwoKSA9PSAnZXh0ZW5kZWQyJykgeyAgICAvLyBzZWNvbmRhcnkgcmVsYXRpdmVzXG5cdFx0b3B0cy5kYXRhc2V0ID0gW1xuXHRcdFx0e1wibmFtZVwiOlwid1pBXCIsXCJzZXhcIjpcIk1cIixcInRvcF9sZXZlbFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgZ3JhbmRmYXRoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJNQWtcIixcInNleFwiOlwiRlwiLFwidG9wX2xldmVsXCI6dHJ1ZSxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJwYXRlcm5hbCBncmFuZG1vdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcInp3QlwiLFwic2V4XCI6XCJNXCIsXCJ0b3BfbGV2ZWxcIjp0cnVlLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcIm1hdGVybmFsIGdyYW5kZmF0aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiZE9IXCIsXCJzZXhcIjpcIkZcIixcInRvcF9sZXZlbFwiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwibWF0ZXJuYWwgZ3JhbmRtb3RoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJNS2dcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJNQWtcIixcImZhdGhlclwiOlwid1pBXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGF0ZXJuYWwgYXVudFwifSxcblx0XHRcdHtcIm5hbWVcIjpcInhzbVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcIk1Ba1wiLFwiZmF0aGVyXCI6XCJ3WkFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJwYXRlcm5hbCB1bmNsZVwifSxcblx0XHRcdHtcIm5hbWVcIjpcIm0yMVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcIk1Ba1wiLFwiZmF0aGVyXCI6XCJ3WkFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJmYXRoZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJmMjFcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJkT0hcIixcImZhdGhlclwiOlwiendCXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwibW90aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiYU9IXCIsXCJzZXhcIjpcIkZcIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcInNpc3RlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIlZoYVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJicm90aGVyXCJ9LFxuXHRcdFx0e1wibmFtZVwiOlwiU3BqXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiZjIxXCIsXCJmYXRoZXJcIjpcIm0yMVwiLFwibm9wYXJlbnRzXCI6dHJ1ZSxcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJwYXJ0bmVyXCJ9LFxuXHRcdFx0cHJvYmFuZCxcblx0XHRcdHtcIm5hbWVcIjpcInpoa1wiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImNoMVwiLFwiZmF0aGVyXCI6XCJTcGpcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJkYXVnaHRlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIktueFwiLFwiZGlzcGxheV9uYW1lXCI6XCJzb25cIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJjaDFcIixcImZhdGhlclwiOlwiU3BqXCIsXCJzdGF0dXNcIjpcIjBcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJ1dWNcIixcImRpc3BsYXlfbmFtZVwiOlwibWF0ZXJuYWwgYXVudFwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImRPSFwiLFwiZmF0aGVyXCI6XCJ6d0JcIixcInN0YXR1c1wiOlwiMFwifSxcblx0XHRcdHtcIm5hbWVcIjpcInhJd1wiLFwiZGlzcGxheV9uYW1lXCI6XCJtYXRlcm5hbCB1bmNsZVwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImRPSFwiLFwiZmF0aGVyXCI6XCJ6d0JcIixcInN0YXR1c1wiOlwiMFwifV07XG5cdH0gZWxzZSBpZihzZWxlY3RlZC5sZW5ndGggPiAwICYmIHNlbGVjdGVkLnZhbCgpID09ICdleHRlbmRlZDEnKSB7ICAgIC8vIHByaW1hcnkgcmVsYXRpdmVzXG5cdFx0b3B0cy5kYXRhc2V0ID0gW1xuXHRcdFx0e1wibmFtZVwiOlwibTIxXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOm51bGwsXCJmYXRoZXJcIjpudWxsLFwic3RhdHVzXCI6XCIwXCIsXCJkaXNwbGF5X25hbWVcIjpcImZhdGhlclwiLFwibm9wYXJlbnRzXCI6dHJ1ZX0sXG5cdFx0XHR7XCJuYW1lXCI6XCJmMjFcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6bnVsbCxcImZhdGhlclwiOm51bGwsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwibW90aGVyXCIsXCJub3BhcmVudHNcIjp0cnVlfSxcblx0XHRcdHtcIm5hbWVcIjpcImFPSFwiLFwic2V4XCI6XCJGXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcInN0YXR1c1wiOlwiMFwiLFwiZGlzcGxheV9uYW1lXCI6XCJzaXN0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJWaGFcIixcInNleFwiOlwiTVwiLFwibW90aGVyXCI6XCJmMjFcIixcImZhdGhlclwiOlwibTIxXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiYnJvdGhlclwifSxcblx0XHRcdHtcIm5hbWVcIjpcIlNwalwiLFwic2V4XCI6XCJNXCIsXCJtb3RoZXJcIjpcImYyMVwiLFwiZmF0aGVyXCI6XCJtMjFcIixcIm5vcGFyZW50c1wiOnRydWUsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwicGFydG5lclwifSxcblx0XHRcdHByb2JhbmQsXG5cdFx0XHR7XCJuYW1lXCI6XCJ6aGtcIixcInNleFwiOlwiRlwiLFwibW90aGVyXCI6XCJjaDFcIixcImZhdGhlclwiOlwiU3BqXCIsXCJzdGF0dXNcIjpcIjBcIixcImRpc3BsYXlfbmFtZVwiOlwiZGF1Z2h0ZXJcIn0sXG5cdFx0XHR7XCJuYW1lXCI6XCJLbnhcIixcImRpc3BsYXlfbmFtZVwiOlwic29uXCIsXCJzZXhcIjpcIk1cIixcIm1vdGhlclwiOlwiY2gxXCIsXCJmYXRoZXJcIjpcIlNwalwiLFwic3RhdHVzXCI6XCIwXCJ9XTtcblx0fSBlbHNlIHtcblx0XHRvcHRzLmRhdGFzZXQgPSBbXG5cdFx0XHR7XCJuYW1lXCI6IFwibTIxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwiZmF0aGVyXCIsIFwic2V4XCI6IFwiTVwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfSxcblx0XHRcdHtcIm5hbWVcIjogXCJmMjFcIiwgXCJkaXNwbGF5X25hbWVcIjogXCJtb3RoZXJcIiwgXCJzZXhcIjogXCJGXCIsIFwidG9wX2xldmVsXCI6IHRydWV9LFxuXHRcdFx0cHJvYmFuZF07XG5cdH1cblx0cmVidWlsZChvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUJ1dHRvbnMob3B0cykge1xuXHRsZXQgY3VycmVudCA9IHBlZGNhY2hlLmdldF9jb3VudChvcHRzKTtcblx0bGV0IG5zdG9yZSA9IHBlZGNhY2hlLm5zdG9yZShvcHRzKTtcblx0bGV0IGlkID0gXCIjXCIrb3B0cy5idG5fdGFyZ2V0O1xuXHRpZihuc3RvcmUgPD0gY3VycmVudClcblx0XHQkKGlkK1wiIC5mYS1yZXBlYXRcIikuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdGVsc2Vcblx0XHQkKGlkK1wiIC5mYS1yZXBlYXRcIikucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cblx0aWYoY3VycmVudCA+IDEpXG5cdFx0JChpZCtcIiAuZmEtdW5kb1wiKS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblx0ZWxzZVxuXHRcdCQoaWQrXCIgLmZhLXVuZG9cIikuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG59XG4iLCJpbXBvcnQgKiBhcyBwZWRpZ3JlZV91dGlsIGZyb20gJy4vcGVkaWdyZWVfdXRpbHMuanMnO1xuaW1wb3J0IHtnZW5ldGljX3Rlc3QsIHBhdGhvbG9neV90ZXN0cywgY2FuY2Vyc30gZnJvbSAnLi9pby5qcyc7XG5cbi8vIHNhdmUgcmlzayBmYWN0b3IgdG8gc3RvcmFnZVxubGV0IFJJU0tfRkFDVE9SX1NUT1JFID0gbmV3IE9iamVjdCgpO1xuZXhwb3J0IGZ1bmN0aW9uIHNob3dfcmlza19mYWN0b3Jfc3RvcmUoKSB7XG5cdGNvbnNvbGUubG9nKFwiUklTS19GQUNUT1JfU1RPUkU6OlwiKTtcblx0JC5lYWNoKFJJU0tfRkFDVE9SX1NUT1JFLCBmdW5jdGlvbihuYW1lLCB2YWwpe1xuXHRcdGNvbnNvbGUubG9nKG5hbWUgKyBcIiA6IFwiICsgdmFsKTtcblx0fSk7XG59XG5cbi8vIHJldHVybiBhIG5vbi1hbm9uaW1pc2VkIHBlZGlncmVlIGZvcm1hdFxuZXhwb3J0IGZ1bmN0aW9uIGdldF9ub25fYW5vbl9wZWRpZ3JlZShkYXRhc2V0LCBtZXRhKSB7XG5cdHJldHVybiBnZXRfcGVkaWdyZWUoZGF0YXNldCwgdW5kZWZpbmVkLCBtZXRhLCBmYWxzZSk7XG59XG5cbi8qKlxuICogR2V0IENhblJpc2sgZm9ybWF0ZWQgcGVkaWdyZWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRfcGVkaWdyZWUoZGF0YXNldCwgZmFtaWQsIG1ldGEsIGlzYW5vbikge1xuXHRsZXQgbXNnID0gXCIjI0NhblJpc2sgMS4wXCI7XG5cdGlmKCFmYW1pZCkge1xuXHRcdGZhbWlkID0gXCJYWFhYXCI7XG5cdH1cblx0aWYobWV0YSkge1xuXHRcdG1zZyArPSBtZXRhO1xuXHR9XG5cdGlmKHR5cGVvZiBpc2Fub24gPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0aXNhbm9uID0gdHJ1ZTtcblx0fVxuXHQvLyBhcnJheSBvZiBpbmRpdmlkdWFscyBleGNsdWRlZCBmcm9tIHRoZSBjYWxjdWxhdGlvblxuXHRsZXQgZXhjbCA9ICQubWFwKGRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtyZXR1cm4gJ2V4Y2x1ZGUnIGluIHAgJiYgcC5leGNsdWRlID8gcC5uYW1lIDogbnVsbDt9KTtcblxuXHQvLyBmZW1hbGUgcmlzayBmYWN0b3JzXG5cdGxldCBwcm9iYW5kSWR4ICA9IHBlZGlncmVlX3V0aWwuZ2V0UHJvYmFuZEluZGV4KGRhdGFzZXQpO1xuXHRsZXQgc2V4ID0gJ0YnO1xuXHRpZihwcm9iYW5kSWR4KSB7XG5cdFx0c2V4ID0gZGF0YXNldFtwcm9iYW5kSWR4XS5zZXg7XG5cdH1cblxuXHRpZihzZXggIT09ICdNJykge1xuXHRcdGxldCBtZW5hcmNoZSAgICA9IGdldF9yaXNrX2ZhY3RvcignbWVuYXJjaGVfYWdlJyk7XG5cdFx0bGV0IHBhcml0eSAgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdwYXJpdHknKTtcblx0XHRsZXQgZmlyc3RfYmlydGggPSBnZXRfcmlza19mYWN0b3IoJ2FnZV9vZl9maXJzdF9saXZlX2JpcnRoJyk7XG5cdFx0bGV0IG9jX3VzZSAgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdvcmFsX2NvbnRyYWNlcHRpb24nKTtcblx0XHRsZXQgbWh0X3VzZSAgICAgPSBnZXRfcmlza19mYWN0b3IoJ21odCcpO1xuXHRcdGxldCBibWkgICAgICAgICA9IGdldF9yaXNrX2ZhY3RvcignYm1pJyk7XG5cdFx0bGV0IGFsY29ob2wgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdhbGNvaG9sX2ludGFrZScpO1xuXHRcdGxldCBtZW5vcGF1c2UgICA9IGdldF9yaXNrX2ZhY3RvcignYWdlX29mX21lbm9wYXVzZScpO1xuXHRcdGxldCBtZGVuc2l0eSAgICA9IGdldF9yaXNrX2ZhY3RvcignbWFtbW9ncmFwaGljX2RlbnNpdHknKTtcblx0XHRsZXQgaGd0ICAgICAgICAgPSBnZXRfcmlza19mYWN0b3IoJ2hlaWdodCcpO1xuXHRcdGxldCB0bCAgICAgICAgICA9IGdldF9yaXNrX2ZhY3RvcignQWdlX1R1YmFsX2xpZ2F0aW9uJyk7XG5cdFx0bGV0IGVuZG8gICAgICAgID0gZ2V0X3Jpc2tfZmFjdG9yKCdlbmRvbWV0cmlvc2lzJyk7XG5cblx0XHRpZihtZW5hcmNoZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNtZW5hcmNoZT1cIittZW5hcmNoZTtcblx0XHRpZihwYXJpdHkgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjcGFyaXR5PVwiK3Bhcml0eTtcblx0XHRpZihmaXJzdF9iaXJ0aCAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNmaXJzdF9saXZlX2JpcnRoPVwiK2ZpcnN0X2JpcnRoO1xuXHRcdGlmKG9jX3VzZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNvY191c2U9XCIrb2NfdXNlO1xuXHRcdGlmKG1odF91c2UgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjbWh0X3VzZT1cIittaHRfdXNlO1xuXHRcdGlmKGJtaSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNCTUk9XCIrYm1pO1xuXHRcdGlmKGFsY29ob2wgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjYWxjb2hvbD1cIithbGNvaG9sO1xuXHRcdGlmKG1lbm9wYXVzZSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNtZW5vcGF1c2U9XCIrbWVub3BhdXNlO1xuXHRcdGlmKG1kZW5zaXR5ICE9PSB1bmRlZmluZWQpXG5cdFx0XHRtc2cgKz0gXCJcXG4jI2JpcmFkcz1cIittZGVuc2l0eTtcblx0XHRpZihoZ3QgIT09IHVuZGVmaW5lZClcblx0XHRcdG1zZyArPSBcIlxcbiMjaGVpZ2h0PVwiK2hndDtcblx0XHRpZih0bCAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0aWYodGwgIT09IFwiblwiICYmIHRsICE9PSBcIk5cIilcblx0XHRcdFx0bXNnICs9IFwiXFxuIyNUTD1ZXCI7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdG1zZyArPSBcIlxcbiMjVEw9TlwiO1xuXG5cdFx0aWYoZW5kbyAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0bXNnICs9IFwiXFxuIyNlbmRvPVwiK2VuZG87XG5cdH1cblx0bXNnICs9IFwiXFxuIyNGYW1JRFxcdE5hbWVcXHRUYXJnZXRcXHRJbmRpdklEXFx0RmF0aElEXFx0TW90aElEXFx0U2V4XFx0TVp0d2luXFx0RGVhZFxcdEFnZVxcdFlvYlxcdEJDMVxcdEJDMlxcdE9DXFx0UFJPXFx0UEFOXFx0QXNoa25cXHRCUkNBMVxcdEJSQ0EyXFx0UEFMQjJcXHRBVE1cXHRDSEVLMlxcdFJBRDUxRFxcdFJBRDUxQ1xcdEJSSVAxXFx0RVI6UFI6SEVSMjpDSzE0OkNLNTZcIjtcblxuXHRmb3IobGV0IGk9MDsgaTxkYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IHAgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKCQuaW5BcnJheShwLm5hbWUsIGV4Y2wpICE9IC0xKSB7XG5cdFx0XHRjb25zb2xlLmxvZygnRVhDTFVERTogJytwLm5hbWUpO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0bXNnICs9ICdcXG4nK2ZhbWlkKydcXHQnO1x0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIG1heCAxMyBjaGFyc1xuXHRcdGlmKGlzYW5vbilcblx0XHRcdG1zZyArPSBpKydcXHQnO1x0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gZGlzcGxheV9uYW1lIChBTk9OSU1JU0UpIG1heCA4IGNoYXJzXG5cdFx0ZWxzZVxuXHRcdFx0bXNnICs9IChwLmRpc3BsYXlfbmFtZSA/IHAuZGlzcGxheV9uYW1lIDogXCJOQVwiKSsnXFx0Jztcblx0XHRtc2cgKz0gKCdwcm9iYW5kJyBpbiBwID8gJzEnIDogMCkrJ1xcdCc7XG5cdFx0bXNnICs9IHAubmFtZSsnXFx0JztcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIG1heCA3IGNoYXJzXG5cdFx0bXNnICs9ICgnZmF0aGVyJyBpbiBwICYmICEoJ25vcGFyZW50cycgaW4gcCkgJiYgKCQuaW5BcnJheShwLm1vdGhlciwgZXhjbCkgPT0gLTEpPyBwLmZhdGhlciA6IDApKydcXHQnO1x0Ly8gbWF4IDcgY2hhcnNcblx0XHRtc2cgKz0gKCdtb3RoZXInIGluIHAgJiYgISgnbm9wYXJlbnRzJyBpbiBwKSAmJiAoJC5pbkFycmF5KHAubW90aGVyLCBleGNsKSA9PSAtMSk/IHAubW90aGVyIDogMCkrJ1xcdCc7XHQvLyBtYXggNyBjaGFyc1xuXHRcdG1zZyArPSBwLnNleCsnXFx0Jztcblx0XHRtc2cgKz0gKCdtenR3aW4nIGluIHAgPyBwLm16dHdpbiA6IDApKydcXHQnOyBcdFx0XHRcdFx0XHQvLyBNWnR3aW5cblx0XHRtc2cgKz0gKCdzdGF0dXMnIGluIHAgPyBwLnN0YXR1cyA6IDApKydcXHQnO1x0XHRcdFx0XHRcdFx0Ly8gY3VycmVudCBzdGF0dXM6IDAgPSBhbGl2ZSwgMSA9IGRlYWRcblx0XHRtc2cgKz0gKCdhZ2UnIGluIHAgPyBwLmFnZSA6IDApKydcXHQnO1x0XHRcdFx0XHRcdFx0XHQvLyBBZ2UgYXQgbGFzdCBmb2xsb3cgdXAgb3IgMCA9IHVuc3BlY2lmaWVkXG5cdFx0bXNnICs9ICgneW9iJyBpbiBwID8gcC55b2IgOiAwKSsnXFx0JztcdFx0XHRcdFx0XHRcdFx0Ly8gWU9CIG9yIDAgPSB1bnNwZWNpZmllZFxuXG5cdFx0JC5lYWNoKGNhbmNlcnMsIGZ1bmN0aW9uKGNhbmNlciwgZGlhZ25vc2lzX2FnZSkge1xuXHRcdFx0Ly8gQWdlIGF0IDFzdCBjYW5jZXIgb3IgMCA9IHVuYWZmZWN0ZWQsIEFVID0gdW5rbm93biBhZ2UgYXQgZGlhZ25vc2lzIChhZmZlY3RlZCB1bmtub3duKVxuXHRcdFx0aWYoZGlhZ25vc2lzX2FnZSBpbiBwKVxuXHRcdFx0XHRtc2cgKz0gKGRpYWdub3Npc19hZ2UgaW4gcCA/IHBbZGlhZ25vc2lzX2FnZV0gOiAnQVUnKSsnXFx0Jztcblx0XHRcdGVsc2Vcblx0XHRcdFx0bXNnICs9ICcwXFx0Jztcblx0XHR9KTtcblxuXHRcdC8vIEFzaGtlbmF6aSBzdGF0dXMsIDAgPSBub3QgQXNoa2VuYXppLCAxID0gQXNoa2VuYXppXG5cdFx0bXNnICs9ICgnYXNoa2VuYXppJyBpbiBwID8gcC5hc2hrZW5hemkgOiAwKSsnXFx0JztcblxuXHRcdGZvcihsZXQgaj0wOyBqPGdlbmV0aWNfdGVzdC5sZW5ndGg7IGorKykge1xuXHRcdFx0aWYoZ2VuZXRpY190ZXN0W2pdKydfZ2VuZV90ZXN0JyBpbiBwICYmXG5cdFx0XHQgICBwW2dlbmV0aWNfdGVzdFtqXSsnX2dlbmVfdGVzdCddWyd0eXBlJ10gIT09ICctJyAmJlxuXHRcdFx0ICAgcFtnZW5ldGljX3Rlc3Rbal0rJ19nZW5lX3Rlc3QnXVsncmVzdWx0J10gIT09ICctJykge1xuXHRcdFx0XHRtc2cgKz0gcFtnZW5ldGljX3Rlc3Rbal0rJ19nZW5lX3Rlc3QnXVsndHlwZSddICsgJzonO1xuXHRcdFx0XHRtc2cgKz0gcFtnZW5ldGljX3Rlc3Rbal0rJ19nZW5lX3Rlc3QnXVsncmVzdWx0J10gKyAnXFx0Jztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZyArPSAnMDowXFx0JztcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHR5cGUsIDA9dW50ZXN0ZWQsIFM9bXV0YXRpb24gc2VhcmNoLCBUPWRpcmVjdCBnZW5lIHRlc3Rcblx0XHRcdFx0XHRcdFx0XHRcdC8vIGdlbmV0aWMgdGVzdCByZXN1bHQsIDA9dW50ZXN0ZWQsIFA9cG9zaXRpdmUsIE49bmVnYXRpdmVcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IobGV0IGo9MDsgajxwYXRob2xvZ3lfdGVzdHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdC8vIHN0YXR1cywgMCA9IHVuc3BlY2lmaWVkLCBOID0gbmVnYXRpdmUsIFAgPSBwb3NpdGl2ZVxuXHRcdFx0aWYocGF0aG9sb2d5X3Rlc3RzW2pdKydfYmNfcGF0aG9sb2d5JyBpbiBwKSB7XG5cdFx0XHRcdG1zZyArPSBwW3BhdGhvbG9neV90ZXN0c1tqXSsnX2JjX3BhdGhvbG9neSddO1xuXHRcdFx0XHRjb25zb2xlLmxvZygncGF0aG9sb2d5ICcrcFtwYXRob2xvZ3lfdGVzdHNbal0rJ19iY19wYXRob2xvZ3knXSsnIGZvciAnK3AuZGlzcGxheV9uYW1lKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG1zZyArPSAnMCc7XG5cdFx0XHR9XG5cdFx0XHRpZihqPChwYXRob2xvZ3lfdGVzdHMubGVuZ3RoLTEpKVxuXHRcdFx0XHRtc2cgKz0gXCI6XCI7XG5cdFx0fVxuXHR9XG5cblx0Y29uc29sZS5sb2cobXNnLCBSSVNLX0ZBQ1RPUl9TVE9SRSk7XG5cdHJldHVybiBtc2c7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlX3Jpc2tfZmFjdG9yKHJpc2tfZmFjdG9yX25hbWUsIHZhbCkge1xuXHRSSVNLX0ZBQ1RPUl9TVE9SRVtzdG9yZV9uYW1lKHJpc2tfZmFjdG9yX25hbWUpXSA9IHZhbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9yaXNrX2ZhY3RvcihyaXNrX2ZhY3Rvcl9uYW1lKSB7XG5cdGxldCBrZXkgPSBzdG9yZV9uYW1lKHJpc2tfZmFjdG9yX25hbWUpO1xuXHRpZihrZXkgaW4gUklTS19GQUNUT1JfU1RPUkUpIHtcblx0XHRyZXR1cm4gUklTS19GQUNUT1JfU1RPUkVba2V5XTtcblx0fVxuXHRyZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vLyByZW1vdmUgcmlzayBmYWN0b3IgZnJvbSBzdG9yYWdlXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlX3Jpc2tfZmFjdG9yKHJpc2tfZmFjdG9yX25hbWUpIHtcblx0ZGVsZXRlIFJJU0tfRkFDVE9SX1NUT1JFW3N0b3JlX25hbWUocmlza19mYWN0b3JfbmFtZSldO1xufVxuXG4vLyBwcmVmaXggcmlzayBmYWN0b3IgbmFtZSB3aXRoIHRoZSBhcHAvcGFnZSBuYW1lXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVfbmFtZShyaXNrX2ZhY3Rvcl9uYW1lKSB7XG5cdHJldHVybiB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuc3BsaXQoJy8nKS5maWx0ZXIoZnVuY3Rpb24oZWwpeyByZXR1cm4gISFlbDsgfSkucG9wKCkgK1xuXHQgICAgICAgJzo6JyArIHJpc2tfZmFjdG9yX25hbWU7XG59XG4iLCIvLyBwZWRpZ3JlZSBJL09cbmltcG9ydCAqIGFzIHBlZGlncmVlX3V0aWwgZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5pbXBvcnQgKiBhcyBwZWRjYWNoZSBmcm9tICcuL3BlZGNhY2hlLmpzJztcbmltcG9ydCB7Z2V0X3RyZWVfZGltZW5zaW9ucywgdmFsaWRhdGVfcGVkaWdyZWUsIHJlYnVpbGR9IGZyb20gJy4vcGVkaWdyZWUuanMnO1xuaW1wb3J0IHtnZXRfbm9uX2Fub25fcGVkaWdyZWV9IGZyb20gJy4vY2Fucmlza19maWxlLmpzJztcblxuLy8gY2FuY2VycywgZ2VuZXRpYyAmIHBhdGhvbG9neSB0ZXN0c1xuZXhwb3J0IGxldCBjYW5jZXJzID0ge1xuXHRcdCdicmVhc3RfY2FuY2VyJzogJ2JyZWFzdF9jYW5jZXJfZGlhZ25vc2lzX2FnZScsXG5cdFx0J2JyZWFzdF9jYW5jZXIyJzogJ2JyZWFzdF9jYW5jZXIyX2RpYWdub3Npc19hZ2UnLFxuXHRcdCdvdmFyaWFuX2NhbmNlcic6ICdvdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlJyxcblx0XHQncHJvc3RhdGVfY2FuY2VyJzogJ3Byb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlJyxcblx0XHQncGFuY3JlYXRpY19jYW5jZXInOiAncGFuY3JlYXRpY19jYW5jZXJfZGlhZ25vc2lzX2FnZSdcblx0fTtcbmV4cG9ydCBsZXQgZ2VuZXRpY190ZXN0ID0gWydicmNhMScsICdicmNhMicsICdwYWxiMicsICdhdG0nLCAnY2hlazInLCAncmFkNTFkJyxcdCdyYWQ1MWMnLCAnYnJpcDEnXTtcbmV4cG9ydCBsZXQgcGF0aG9sb2d5X3Rlc3RzID0gWydlcicsICdwcicsICdoZXIyJywgJ2NrMTQnLCAnY2s1NiddO1xuXG4vLyBnZXQgYnJlYXN0IGFuZCBvdmFyaWFuIFBSUyB2YWx1ZXNcbmV4cG9ydCBmdW5jdGlvbiBnZXRfcHJzX3ZhbHVlcygpIHtcblx0bGV0IHBycyA9IHt9O1xuXHRpZihoYXNJbnB1dChcImJyZWFzdF9wcnNfYVwiKSAmJiBoYXNJbnB1dChcImJyZWFzdF9wcnNfelwiKSkge1xuXHRcdHByc1snYnJlYXN0X2NhbmNlcl9wcnMnXSA9IHtcblx0XHRcdCdhbHBoYSc6IHBhcnNlRmxvYXQoJCgnI2JyZWFzdF9wcnNfYScpLnZhbCgpKSxcblx0XHRcdCd6c2NvcmUnOiBwYXJzZUZsb2F0KCQoJyNicmVhc3RfcHJzX3onKS52YWwoKSksXG5cdFx0XHQncGVyY2VudCc6IHBhcnNlRmxvYXQoJCgnI2JyZWFzdF9wcnNfcGVyY2VudCcpLnZhbCgpKVxuXHRcdH07XG5cdH1cblx0aWYoaGFzSW5wdXQoXCJvdmFyaWFuX3Byc19hXCIpICYmIGhhc0lucHV0KFwib3Zhcmlhbl9wcnNfelwiKSkge1xuXHRcdHByc1snb3Zhcmlhbl9jYW5jZXJfcHJzJ10gPSB7XG5cdFx0XHQnYWxwaGEnOiBwYXJzZUZsb2F0KCQoJyNvdmFyaWFuX3Byc19hJykudmFsKCkpLFxuXHRcdFx0J3pzY29yZSc6IHBhcnNlRmxvYXQoJCgnI292YXJpYW5fcHJzX3onKS52YWwoKSksXG5cdFx0XHQncGVyY2VudCc6IHBhcnNlRmxvYXQoJCgnI292YXJpYW5fcHJzX3BlcmNlbnQnKS52YWwoKSlcblx0XHR9O1xuXHR9XG5cdGNvbnNvbGUubG9nKHBycyk7XG5cdHJldHVybiAoaXNFbXB0eShwcnMpID8gMCA6IHBycyk7XG59XG5cbi8vIGNoZWNrIGlmIGlucHV0IGhhcyBhIHZhbHVlXG5leHBvcnQgZnVuY3Rpb24gaGFzSW5wdXQoaWQpIHtcblx0cmV0dXJuICQudHJpbSgkKCcjJytpZCkudmFsKCkpLmxlbmd0aCAhPT0gMDtcbn1cblxuLy8gcmV0dXJuIHRydWUgaWYgdGhlIG9iamVjdCBpcyBlbXB0eVxubGV0IGlzRW1wdHkgPSBmdW5jdGlvbihteU9iaikge1xuXHRmb3IobGV0IGtleSBpbiBteU9iaikge1xuXHRcdGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobXlPYmosIGtleSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfc3VyZ2ljYWxfb3BzKCkge1xuXHRsZXQgbWV0YSA9IFwiXCI7XG5cdGlmKCEkKCcjQTZfNF8zX2NoZWNrJykucGFyZW50KCkuaGFzQ2xhc3MoXCJvZmZcIikpIHtcblx0XHRtZXRhICs9IFwiO09WQVJZMj15XCI7XG5cdH1cblx0aWYoISQoJyNBNl80XzdfY2hlY2snKS5wYXJlbnQoKS5oYXNDbGFzcyhcIm9mZlwiKSkge1xuXHRcdG1ldGEgKz0gXCI7TUFTVDI9eVwiO1xuXHR9XG5cdHJldHVybiBtZXRhO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkKG9wdHMpIHtcblx0JCgnI2xvYWQnKS5jaGFuZ2UoZnVuY3Rpb24oZSkge1xuXHRcdGxvYWQoZSwgb3B0cyk7XG5cdH0pO1xuXG5cdCQoJyNzYXZlJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRzYXZlKG9wdHMpO1xuXHR9KTtcblxuXHQkKCcjc2F2ZV9jYW5yaXNrJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRsZXQgbWV0YSA9IGdldF9zdXJnaWNhbF9vcHMoKTtcblx0XHRsZXQgcHJzO1xuXHRcdHRyeSB7XG5cdFx0XHRwcnMgPSBnZXRfcHJzX3ZhbHVlcygpO1xuXHRcdFx0aWYocHJzLmJyZWFzdF9jYW5jZXJfcHJzICYmIHBycy5icmVhc3RfY2FuY2VyX3Bycy5hbHBoYSAhPT0gMCAmJiBwcnMuYnJlYXN0X2NhbmNlcl9wcnMuenNjb3JlICE9PSAwKSB7XG5cdFx0XHRcdG1ldGEgKz0gXCJcXG4jI1BSU19CQz1hbHBoYT1cIitwcnMuYnJlYXN0X2NhbmNlcl9wcnMuYWxwaGErXCIsenNjb3JlPVwiK3Bycy5icmVhc3RfY2FuY2VyX3Bycy56c2NvcmU7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHBycy5vdmFyaWFuX2NhbmNlcl9wcnMgJiYgcHJzLm92YXJpYW5fY2FuY2VyX3Bycy5hbHBoYSAhPT0gMCAmJiBwcnMub3Zhcmlhbl9jYW5jZXJfcHJzLnpzY29yZSAhPT0gMCkge1xuXHRcdFx0XHRtZXRhICs9IFwiXFxuIyNQUlNfT0M9YWxwaGE9XCIrcHJzLm92YXJpYW5fY2FuY2VyX3Bycy5hbHBoYStcIix6c2NvcmU9XCIrcHJzLm92YXJpYW5fY2FuY2VyX3Bycy56c2NvcmU7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaChlcnIpIHsgY29uc29sZS53YXJuKFwiUFJTXCIsIHBycyk7IH1cblx0XHRzYXZlX2NhbnJpc2sob3B0cywgbWV0YSk7XG5cdH0pO1xuXG5cdCQoJyNwcmludCcpLmNsaWNrKGZ1bmN0aW9uKF9lKSB7XG5cdFx0cHJpbnQoZ2V0X3ByaW50YWJsZV9zdmcob3B0cykpO1xuXHR9KTtcblxuXHQkKCcjc3ZnX2Rvd25sb2FkJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRzdmdfZG93bmxvYWQoZ2V0X3ByaW50YWJsZV9zdmcob3B0cykpO1xuXHR9KTtcblxuXHQkKCcjcG5nX2Rvd25sb2FkJykuY2xpY2soZnVuY3Rpb24oX2UpIHtcblx0XHRsZXQgZGVmZXJyZWQgPSBzdmcyaW1nKCQoJ3N2ZycpLCBcInBlZGlncmVlXCIpO1xuXHRcdCQud2hlbi5hcHBseSgkLFtkZWZlcnJlZF0pLmRvbmUoZnVuY3Rpb24oKSB7XG5cdFx0XHRsZXQgb2JqID0gZ2V0QnlOYW1lKGFyZ3VtZW50cywgXCJwZWRpZ3JlZVwiKTtcblx0XHRcdGlmKHBlZGlncmVlX3V0aWwuaXNFZGdlKCkgfHwgcGVkaWdyZWVfdXRpbC5pc0lFKCkpIHtcblx0XHRcdFx0bGV0IGh0bWw9XCI8aW1nIHNyYz0nXCIrb2JqLmltZytcIicgYWx0PSdjYW52YXMgaW1hZ2UnLz5cIjtcblx0XHRcdFx0bGV0IG5ld1RhYiA9IHdpbmRvdy5vcGVuKCk7XHRcdC8vIHBvcC11cHMgbmVlZCB0byBiZSBlbmFibGVkXG5cdFx0XHRcdG5ld1RhYi5kb2N1bWVudC53cml0ZShodG1sKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxldCBhXHQgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXHRcdFx0XHRhLmhyZWZcdCA9IG9iai5pbWc7XG5cdFx0XHRcdGEuZG93bmxvYWQgPSAncGxvdC5wbmcnO1xuXHRcdFx0XHRhLnRhcmdldCAgID0gJ19ibGFuayc7XG5cdFx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7IGEuY2xpY2soKTsgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG5cbi8qKlxuICogR2V0IG9iamVjdCBmcm9tIGFycmF5IGJ5IHRoZSBuYW1lIGF0dHJpYnV0ZS5cbiAqL1xuZnVuY3Rpb24gZ2V0QnlOYW1lKGFyciwgbmFtZSkge1xuXHRyZXR1cm4gJC5ncmVwKGFyciwgZnVuY3Rpb24obyl7IHJldHVybiBvICYmIG8ubmFtZSA9PSBuYW1lOyB9KVswXTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIFNWRyBkb2N1bWVudCBlbGVtZW50IGNvbnZlcnQgdG8gaW1hZ2UgKGUuZy4ganBlZywgcG5nIC0gZGVmYXVsdCBwbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3ZnMmltZyhzdmcsIGRlZmVycmVkX25hbWUsIG9wdGlvbnMpIHtcblx0bGV0IGRlZmF1bHRzID0ge2lzY2Fudmc6IGZhbHNlLCByZXNvbHV0aW9uOiAxLCBpbWdfdHlwZTogXCJpbWFnZS9wbmdcIn07XG5cdGlmKCFvcHRpb25zKSBvcHRpb25zID0gZGVmYXVsdHM7XG5cdCQuZWFjaChkZWZhdWx0cywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdGlmKCEoa2V5IGluIG9wdGlvbnMpKSB7b3B0aW9uc1trZXldID0gdmFsdWU7fVxuXHR9KTtcblxuXHQvLyBzZXQgU1ZHIGJhY2tncm91bmQgdG8gd2hpdGUgLSBmaXggZm9yIGpwZWcgY3JlYXRpb25cblx0aWYgKHN2Zy5maW5kKFwiLnBkZi13aGl0ZS1iZ1wiKS5sZW5ndGggPT09IDApe1xuXHRcdGxldCBkM29iaiA9IGQzLnNlbGVjdChzdmcuZ2V0KDApKTtcblx0XHRkM29iai5hcHBlbmQoXCJyZWN0XCIpXG5cdFx0XHQuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuXHRcdFx0LmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIFwicGRmLXdoaXRlLWJnXCIpXG5cdFx0XHQuYXR0cihcImZpbGxcIiwgXCJ3aGl0ZVwiKTtcblx0XHRkM29iai5zZWxlY3QoXCIucGRmLXdoaXRlLWJnXCIpLmxvd2VyKCk7XG5cdH1cblxuXHRsZXQgZGVmZXJyZWQgPSAkLkRlZmVycmVkKCk7XG5cdGxldCBzdmdTdHI7XG5cdGlmICh0eXBlb2Ygd2luZG93LlhNTFNlcmlhbGl6ZXIgIT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHN2Z1N0ciA9IChuZXcgWE1MU2VyaWFsaXplcigpKS5zZXJpYWxpemVUb1N0cmluZyhzdmcuZ2V0KDApKTtcblx0fSBlbHNlIGlmICh0eXBlb2Ygc3ZnLnhtbCAhPSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c3ZnU3RyID0gc3ZnLmdldCgwKS54bWw7XG5cdH1cblxuXHRsZXQgaW1nc3JjID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJysgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3ZnU3RyKSkpOyAvLyBjb252ZXJ0IFNWRyBzdHJpbmcgdG8gZGF0YSBVUkxcblx0bGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG5cdGNhbnZhcy53aWR0aCA9IHN2Zy53aWR0aCgpKm9wdGlvbnMucmVzb2x1dGlvbjtcblx0Y2FudmFzLmhlaWdodCA9IHN2Zy5oZWlnaHQoKSpvcHRpb25zLnJlc29sdXRpb247XG5cdGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblx0bGV0IGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG5cdGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZihwZWRpZ3JlZV91dGlsLmlzSUUoKSkge1xuXHRcdFx0Ly8gY2hhbmdlIGZvbnQgc28gaXQgaXNuJ3QgdGlueVxuXHRcdFx0c3ZnU3RyID0gc3ZnU3RyLnJlcGxhY2UoLyBmb250LXNpemU9XCJcXGQ/LlxcZCplbVwiL2csICcnKTtcblx0XHRcdHN2Z1N0ciA9IHN2Z1N0ci5yZXBsYWNlKC88dGV4dCAvZywgJzx0ZXh0IGZvbnQtc2l6ZT1cIjEycHhcIiAnKTtcblx0XHRcdGxldCB2ID0gY2FudmcuQ2FudmcuZnJvbVN0cmluZyhjb250ZXh0LCBzdmdTdHIsIHtcblx0XHRcdFx0c2NhbGVXaWR0aDogY2FudmFzLndpZHRoLFxuXHRcdFx0XHRzY2FsZUhlaWdodDogY2FudmFzLmhlaWdodCxcblx0XHRcdFx0aWdub3JlRGltZW5zaW9uczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0XHR2LnN0YXJ0KCk7XG5cdFx0XHRjb25zb2xlLmxvZyhkZWZlcnJlZF9uYW1lLCBvcHRpb25zLmltZ190eXBlLCBcInVzZSBjYW52ZyB0byBjcmVhdGUgaW1hZ2VcIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblx0XHRcdGNvbnNvbGUubG9nKGRlZmVycmVkX25hbWUsIG9wdGlvbnMuaW1nX3R5cGUpO1xuXHRcdH1cblx0XHRkZWZlcnJlZC5yZXNvbHZlKHsnbmFtZSc6IGRlZmVycmVkX25hbWUsICdyZXNvbHV0aW9uJzogb3B0aW9ucy5yZXNvbHV0aW9uLCAnaW1nJzpjYW52YXMudG9EYXRhVVJMKG9wdGlvbnMuaW1nX3R5cGUsIDEpLCAndyc6Y2FudmFzLndpZHRoLCAnaCc6Y2FudmFzLmhlaWdodH0pO1xuXHR9O1xuXHRpbWcuc3JjID0gaW1nc3JjO1xuXHRyZXR1cm4gZGVmZXJyZWQucHJvbWlzZSgpO1xufVxuXG5mdW5jdGlvbiBnZXRNYXRjaGVzKHN0ciwgbXlSZWdleHApIHtcblx0bGV0IG1hdGNoZXMgPSBbXTtcblx0bGV0IG1hdGNoO1xuXHRsZXQgYyA9IDA7XG5cdG15UmVnZXhwLmxhc3RJbmRleCA9IDA7XG5cdHdoaWxlICgobWF0Y2ggPSBteVJlZ2V4cC5leGVjKHN0cikpKSB7XG5cdFx0YysrO1xuXHRcdGlmKGMgPiA0MDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJnZXRNYXRjaGVzOiBjb3VudGVyIGV4Y2VlZGVkIDgwMFwiKTtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cdFx0bWF0Y2hlcy5wdXNoKG1hdGNoKTtcblx0XHRpZiAobXlSZWdleHAubGFzdEluZGV4ID09PSBtYXRjaC5pbmRleCkge1xuXHRcdFx0bXlSZWdleHAubGFzdEluZGV4Kys7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBtYXRjaGVzO1xufVxuXG4vLyBmaW5kIGFsbCB1cmwncyB0byBtYWtlIHVuaXF1ZVxuZnVuY3Rpb24gdW5pcXVlX3VybHMoc3ZnX2h0bWwpIHtcblx0bGV0IG1hdGNoZXMgPSBnZXRNYXRjaGVzKHN2Z19odG1sLCAvdXJsXFwoKCZxdW90O3xcInwnKXswLDF9IyguKj8pKCZxdW90O3xcInwnKXswLDF9XFwpL2cpO1xuXHRpZihtYXRjaGVzID09PSAtMSlcblx0XHRyZXR1cm4gXCJFUlJPUiBESVNQTEFZSU5HIFBFRElHUkVFXCJcblxuXHQkLmVhY2gobWF0Y2hlcywgZnVuY3Rpb24oaW5kZXgsIG1hdGNoKSB7XG5cdFx0bGV0IHF1b3RlID0gKG1hdGNoWzFdID8gbWF0Y2hbMV0gOiBcIlwiKTtcblx0XHRsZXQgdmFsID0gbWF0Y2hbMl07XG5cdFx0bGV0IG0xID0gXCJpZD1cXFwiXCIgKyB2YWwgKyBcIlxcXCJcIjtcblx0XHRsZXQgbTIgPSBcInVybFxcXFwoXCIgKyBxdW90ZSArIFwiI1wiICsgdmFsICsgcXVvdGUgKyBcIlxcXFwpXCI7XG5cblx0XHRsZXQgbmV3dmFsID0gdmFsK3BlZGlncmVlX3V0aWwubWFrZWlkKDIpO1xuXHRcdHN2Z19odG1sID0gc3ZnX2h0bWwucmVwbGFjZShuZXcgUmVnRXhwKG0xLCAnZycpLCBcImlkPVxcXCJcIituZXd2YWwrXCJcXFwiXCIgKTtcblx0XHRzdmdfaHRtbCA9IHN2Z19odG1sLnJlcGxhY2UobmV3IFJlZ0V4cChtMiwgJ2cnKSwgXCJ1cmwoI1wiK25ld3ZhbCtcIilcIiApO1xuICAgfSk7XG5cdHJldHVybiBzdmdfaHRtbDtcbn1cblxuLy8gcmV0dXJuIGEgY29weSBwZWRpZ3JlZSBzdmdcbmV4cG9ydCBmdW5jdGlvbiBjb3B5X3N2ZyhvcHRzKSB7XG5cdGxldCBzdmdfbm9kZSA9IGdldF9wcmludGFibGVfc3ZnKG9wdHMpO1xuXHRsZXQgZDNvYmogPSBkMy5zZWxlY3Qoc3ZnX25vZGUuZ2V0KDApKTtcblxuXHQvLyByZW1vdmUgdW51c2VkIGVsZW1lbnRzXG5cdGQzb2JqLnNlbGVjdEFsbChcIi5wb3B1cF9zZWxlY3Rpb24sIC5pbmRpX3JlY3QsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZGNoaWxkLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLmxpbmVfZHJhZ19zZWxlY3Rpb25cIikucmVtb3ZlKCk7XG5cdGQzb2JqLnNlbGVjdEFsbChcInRleHRcIilcblx0ICAuZmlsdGVyKGZ1bmN0aW9uKCl7XG5cdFx0IHJldHVybiBkMy5zZWxlY3QodGhpcykudGV4dCgpLmxlbmd0aCA9PT0gMFxuXHQgIH0pLnJlbW92ZSgpO1xuXHRyZXR1cm4gJCh1bmlxdWVfdXJscyhzdmdfbm9kZS5odG1sKCkpKTtcbn1cblxuLy8gZ2V0IHByaW50YWJsZSBzdmcgZGl2LCBhZGp1c3Qgc2l6ZSB0byB0cmVlIGRpbWVuc2lvbnMgYW5kIHNjYWxlIHRvIGZpdFxuZXhwb3J0IGZ1bmN0aW9uIGdldF9wcmludGFibGVfc3ZnKG9wdHMpIHtcblx0bGV0IGxvY2FsX2RhdGFzZXQgPSBwZWRjYWNoZS5jdXJyZW50KG9wdHMpOyAvLyBnZXQgY3VycmVudCBkYXRhc2V0XG5cdGlmIChsb2NhbF9kYXRhc2V0ICE9PSB1bmRlZmluZWQgJiYgbG9jYWxfZGF0YXNldCAhPT0gbnVsbCkge1xuXHRcdG9wdHMuZGF0YXNldCA9IGxvY2FsX2RhdGFzZXQ7XG5cdH1cblxuXHRsZXQgdHJlZV9kaW1lbnNpb25zID0gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IHN2Z19kaXYgPSAkKCc8ZGl2PjwvZGl2PicpOyAgXHRcdFx0XHQvLyBjcmVhdGUgYSBuZXcgZGl2XG5cdGxldCBzdmcgPSAkKCcjJytvcHRzLnRhcmdldERpdikuZmluZCgnc3ZnJykuY2xvbmUoKS5hcHBlbmRUbyhzdmdfZGl2KTtcblx0aWYob3B0cy53aWR0aCA8IHRyZWVfZGltZW5zaW9ucy53aWR0aCB8fCBvcHRzLmhlaWdodCA8IHRyZWVfZGltZW5zaW9ucy5oZWlnaHQgfHxcblx0ICAgdHJlZV9kaW1lbnNpb25zLndpZHRoID4gNTk1IHx8IHRyZWVfZGltZW5zaW9ucy5oZWlnaHQgPiA4NDIpIHtcblx0XHRsZXQgd2lkID0gdHJlZV9kaW1lbnNpb25zLndpZHRoO1xuXHRcdGxldCBoZ3QgPSB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ICsgMTAwO1xuXHRcdGxldCBzY2FsZSA9IDEuMDtcblxuXHRcdGlmKHRyZWVfZGltZW5zaW9ucy53aWR0aCA+IDU5NSB8fCB0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSB7ICAgLy8gc2NhbGUgdG8gZml0IEE0XG5cdFx0XHRpZih0cmVlX2RpbWVuc2lvbnMud2lkdGggPiA1OTUpICB3aWQgPSA1OTU7XG5cdFx0XHRpZih0cmVlX2RpbWVuc2lvbnMuaGVpZ2h0ID4gODQyKSBoZ3QgPSA4NDI7XG5cdFx0XHRsZXQgeHNjYWxlID0gd2lkL3RyZWVfZGltZW5zaW9ucy53aWR0aDtcblx0XHRcdGxldCB5c2NhbGUgPSBoZ3QvdHJlZV9kaW1lbnNpb25zLmhlaWdodDtcblx0XHRcdHNjYWxlID0gKHhzY2FsZSA8IHlzY2FsZSA/IHhzY2FsZSA6IHlzY2FsZSk7XG5cdFx0fVxuXG5cdFx0c3ZnLmF0dHIoJ3dpZHRoJywgd2lkKTtcdFx0Ly8gYWRqdXN0IGRpbWVuc2lvbnNcblx0XHRzdmcuYXR0cignaGVpZ2h0JywgaGd0KTtcblxuXHRcdGxldCB5dHJhbnNmb3JtID0gKC1vcHRzLnN5bWJvbF9zaXplKjEuNSpzY2FsZSk7XG5cdFx0c3ZnLmZpbmQoXCIuZGlhZ3JhbVwiKS5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsIFwiK3l0cmFuc2Zvcm0rXCIpIHNjYWxlKFwiK3NjYWxlK1wiKVwiKTtcblx0fVxuXHRyZXR1cm4gc3ZnX2Rpdjtcbn1cblxuLy8gZG93bmxvYWQgdGhlIFNWRyB0byBhIGZpbGVcbmV4cG9ydCBmdW5jdGlvbiBzdmdfZG93bmxvYWQoc3ZnKXtcblx0bGV0IGFcdCAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cdGEuaHJlZlx0ID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsJysgYnRvYSggdW5lc2NhcGUoIGVuY29kZVVSSUNvbXBvbmVudCggc3ZnLmh0bWwoKSApICkgKTtcblx0YS5kb3dubG9hZCA9ICdwbG90LnN2Zyc7XG5cdGEudGFyZ2V0ICAgPSAnX2JsYW5rJztcblx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTsgYS5jbGljaygpOyBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xufVxuXG4vLyBvcGVuIHByaW50IHdpbmRvdyBmb3IgYSBnaXZlbiBlbGVtZW50XG5leHBvcnQgZnVuY3Rpb24gcHJpbnQoZWwsIGlkKXtcblx0aWYoZWwuY29uc3RydWN0b3IgIT09IEFycmF5KVxuXHRcdGVsID0gW2VsXTtcblxuXHRsZXQgd2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSowLjk7XG5cdGxldCBoZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCktMTA7XG5cdGxldCBjc3NGaWxlcyA9IFtcblx0XHQnL3N0YXRpYy9jc3MvY2Fucmlzay5jc3MnLFxuXHRcdCdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2ZvbnQtYXdlc29tZUA0LjcuMC9jc3MvZm9udC1hd2Vzb21lLm1pbi5jc3MnXG5cdF07XG5cdGxldCBwcmludFdpbmRvdyA9IHdpbmRvdy5vcGVuKCcnLCAnUHJpbnRNYXAnLCAnd2lkdGg9JyArIHdpZHRoICsgJyxoZWlnaHQ9JyArIGhlaWdodCk7XG5cdGxldCBoZWFkQ29udGVudCA9ICcnO1xuXHRmb3IobGV0IGk9MDsgaTxjc3NGaWxlcy5sZW5ndGg7IGkrKylcblx0XHRoZWFkQ29udGVudCArPSAnPGxpbmsgaHJlZj1cIicrY3NzRmlsZXNbaV0rJ1wiIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBtZWRpYT1cImFsbFwiPic7XG5cdGhlYWRDb250ZW50ICs9IFwiPHN0eWxlPmJvZHkge2ZvbnQtc2l6ZTogXCIgKyAkKFwiYm9keVwiKS5jc3MoJ2ZvbnQtc2l6ZScpICsgXCI7fTwvc3R5bGU+XCI7XG5cblx0bGV0IGh0bWwgPSBcIlwiO1xuXHRmb3IobGV0IGk9MDsgaTxlbC5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGkgPT09IDAgJiYgaWQpXG5cdFx0XHRodG1sICs9IGlkO1xuXHRcdGh0bWwgKz0gJChlbFtpXSkuaHRtbCgpO1xuXHRcdGlmKGkgPCBlbC5sZW5ndGgtMSlcblx0XHRcdGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJwYWdlLWJyZWFrXCI+IDwvZGl2Pic7XG5cdH1cblxuXHRwcmludFdpbmRvdy5kb2N1bWVudC53cml0ZShoZWFkQ29udGVudCk7XG5cdHByaW50V2luZG93LmRvY3VtZW50LndyaXRlKGh0bWwpO1xuXHRwcmludFdpbmRvdy5kb2N1bWVudC5jbG9zZSgpO1xuXG5cdHByaW50V2luZG93LmZvY3VzKCk7XG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0cHJpbnRXaW5kb3cucHJpbnQoKTtcblx0XHRwcmludFdpbmRvdy5jbG9zZSgpO1xuXHR9LCAzMDApO1xufVxuXG4vLyBzYXZlIGNvbnRlbnQgdG8gYSBmaWxlXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9maWxlKG9wdHMsIGNvbnRlbnQsIGZpbGVuYW1lLCB0eXBlKXtcblx0aWYob3B0cy5ERUJVRylcblx0XHRjb25zb2xlLmxvZyhjb250ZW50KTtcblx0aWYoIWZpbGVuYW1lKSBmaWxlbmFtZSA9IFwicGVkLnR4dFwiO1xuXHRpZighdHlwZSkgdHlwZSA9IFwidGV4dC9wbGFpblwiO1xuXG4gICBsZXQgZmlsZSA9IG5ldyBCbG9iKFtjb250ZW50XSwge3R5cGU6IHR5cGV9KTtcbiAgIGlmICh3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIFx0Ly8gSUUxMCtcblx0ICAgd2luZG93Lm5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKGZpbGUsIGZpbGVuYW1lKTtcbiAgIGVsc2UgeyBcdFx0XHRcdFx0XHRcdFx0XHQvLyBvdGhlciBicm93c2Vyc1xuXHQgICBsZXQgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuXHQgICBsZXQgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcblx0ICAgYS5ocmVmID0gdXJsO1xuXHQgICBhLmRvd25sb2FkID0gZmlsZW5hbWU7XG5cdCAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XG5cdCAgIGEuY2xpY2soKTtcblx0ICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHQgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGEpO1xuXHRcdCAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG5cdFx0fSwgMCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmUob3B0cyl7XG5cdGxldCBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocGVkY2FjaGUuY3VycmVudChvcHRzKSk7XG5cdHNhdmVfZmlsZShvcHRzLCBjb250ZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVfY2FucmlzayhvcHRzLCBtZXRhKXtcblx0c2F2ZV9maWxlKG9wdHMsIGdldF9ub25fYW5vbl9wZWRpZ3JlZShwZWRjYWNoZS5jdXJyZW50KG9wdHMpLCBtZXRhKSwgXCJjYW5yaXNrLnR4dFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbnJpc2tfdmFsaWRhdGlvbihvcHRzKSB7XG5cdCQuZWFjaChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKGlkeCwgcCkge1xuXHRcdGlmKCFwLmhpZGRlbiAmJiBwLnNleCA9PT0gJ00nICYmICFwZWRpZ3JlZV91dGlsLmlzUHJvYmFuZChwKSkge1xuXHRcdFx0aWYocFtjYW5jZXJzWydicmVhc3RfY2FuY2VyMiddXSkge1xuXHRcdFx0XHRsZXQgbXNnID0gJ01hbGUgZmFtaWx5IG1lbWJlciAoJytwLmRpc3BsYXlfbmFtZSsnKSB3aXRoIGNvbnRyYWxhdGVyYWwgYnJlYXN0IGNhbmNlciBmb3VuZC4gJytcblx0XHRcdFx0XHRcdCAgJ1BsZWFzZSBub3RlIHRoYXQgYXMgdGhlIHJpc2sgbW9kZWxzIGRvIG5vdCB0YWtlIHRoaXMgaW50byBhY2NvdW50IHRoZSBzZWNvbmQgJytcblx0XHRcdFx0XHRcdCAgJ2JyZWFzdCBjYW5jZXIgaXMgaWdub3JlZC4nXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IobXNnKTtcblx0XHRcdFx0ZGVsZXRlIHBbY2FuY2Vyc1snYnJlYXN0X2NhbmNlcjInXV07XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJXYXJuaW5nXCIsIG1zZyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWQoZSwgb3B0cykge1xuXHRsZXQgZiA9IGUudGFyZ2V0LmZpbGVzWzBdO1xuXHRpZihmKSB7XG5cdFx0bGV0IHJpc2tfZmFjdG9ycztcblx0XHRsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRyZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmKGUudGFyZ2V0LnJlc3VsdC5zdGFydHNXaXRoKFwiQk9BRElDRUEgaW1wb3J0IHBlZGlncmVlIGZpbGUgZm9ybWF0IDQuMFwiKSkge1xuXHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRCb2FkaWNlYVY0KGUudGFyZ2V0LnJlc3VsdCwgNCk7XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2UgaWYoZS50YXJnZXQucmVzdWx0LnN0YXJ0c1dpdGgoXCJCT0FESUNFQSBpbXBvcnQgcGVkaWdyZWUgZmlsZSBmb3JtYXQgMi4wXCIpKSB7XG5cdFx0XHRcdFx0b3B0cy5kYXRhc2V0ID0gcmVhZEJvYWRpY2VhVjQoZS50YXJnZXQucmVzdWx0LCAyKTtcblx0XHRcdFx0XHRjYW5yaXNrX3ZhbGlkYXRpb24ob3B0cyk7XG5cdFx0XHRcdH0gZWxzZSBpZihlLnRhcmdldC5yZXN1bHQuc3RhcnRzV2l0aChcIiMjXCIpICYmIGUudGFyZ2V0LnJlc3VsdC5pbmRleE9mKFwiQ2FuUmlza1wiKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRsZXQgY2Fucmlza19kYXRhID0gcmVhZENhblJpc2tWMShlLnRhcmdldC5yZXN1bHQpO1xuXHRcdFx0XHRcdHJpc2tfZmFjdG9ycyA9IGNhbnJpc2tfZGF0YVswXTtcblx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBjYW5yaXNrX2RhdGFbMV07XG5cdFx0XHRcdFx0Y2Fucmlza192YWxpZGF0aW9uKG9wdHMpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzLmRhdGFzZXQgPSBKU09OLnBhcnNlKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdFx0fSBjYXRjaChlcnIpIHtcblx0XHRcdFx0XHRcdG9wdHMuZGF0YXNldCA9IHJlYWRMaW5rYWdlKGUudGFyZ2V0LnJlc3VsdCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHZhbGlkYXRlX3BlZGlncmVlKG9wdHMpO1xuXHRcdFx0fSBjYXRjaChlcnIxKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoZXJyMSwgZS50YXJnZXQucmVzdWx0KTtcblx0XHRcdFx0cGVkaWdyZWVfdXRpbC5tZXNzYWdlcyhcIkZpbGUgRXJyb3JcIiwgKCBlcnIxLm1lc3NhZ2UgPyBlcnIxLm1lc3NhZ2UgOiBlcnIxKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKG9wdHMuZGF0YXNldCk7XG5cdFx0XHR0cnl7XG5cdFx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0XHRcdGlmKHJpc2tfZmFjdG9ycyAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmlza19mYWN0b3JzKTtcblx0XHRcdFx0XHQvLyBsb2FkIHJpc2sgZmFjdG9ycyAtIGZpcmUgcmlza2ZhY3RvckNoYW5nZSBldmVudFxuXHRcdFx0XHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ3Jpc2tmYWN0b3JDaGFuZ2UnLCBbb3B0cywgcmlza19mYWN0b3JzXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JChkb2N1bWVudCkudHJpZ2dlcignZmhDaGFuZ2UnLCBbb3B0c10pOyBcdC8vIHRyaWdnZXIgZmhDaGFuZ2UgZXZlbnRcblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIHVwZGF0ZSBGSCBzZWN0aW9uXG5cdFx0XHRcdFx0YWNjX0ZhbUhpc3RfdGlja2VkKCk7XG5cdFx0XHRcdFx0YWNjX0ZhbUhpc3RfTGVhdmUoKTtcblx0XHRcdFx0XHRSRVNVTFQuRkxBR19GQU1JTFlfTU9EQUwgPSB0cnVlO1xuXHRcdFx0XHR9IGNhdGNoKGVycjMpIHtcblx0XHRcdFx0XHQvLyBpZ25vcmUgZXJyb3Jcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaChlcnIyKSB7XG5cdFx0XHRcdHBlZGlncmVlX3V0aWwubWVzc2FnZXMoXCJGaWxlIEVycm9yXCIsICggZXJyMi5tZXNzYWdlID8gZXJyMi5tZXNzYWdlIDogZXJyMikpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0cmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0cGVkaWdyZWVfdXRpbC5tZXNzYWdlcyhcIkZpbGUgRXJyb3JcIiwgXCJGaWxlIGNvdWxkIG5vdCBiZSByZWFkISBDb2RlIFwiICsgZXZlbnQudGFyZ2V0LmVycm9yLmNvZGUpO1xuXHRcdH07XG5cdFx0cmVhZGVyLnJlYWRBc1RleHQoZik7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc29sZS5lcnJvcihcIkZpbGUgY291bGQgbm90IGJlIHJlYWQhXCIpO1xuXHR9XG5cdCQoXCIjbG9hZFwiKVswXS52YWx1ZSA9ICcnOyAvLyByZXNldCB2YWx1ZVxufVxuXG4vL1xuLy8gaHR0cHM6Ly93d3cuY29nLWdlbm9taWNzLm9yZy9wbGluay8xLjkvZm9ybWF0cyNwZWRcbi8vIGh0dHBzOi8vd3d3LmNvZy1nZW5vbWljcy5vcmcvcGxpbmsvMS45L2Zvcm1hdHMjZmFtXG4vL1x0MS4gRmFtaWx5IElEICgnRklEJylcbi8vXHQyLiBXaXRoaW4tZmFtaWx5IElEICgnSUlEJzsgY2Fubm90IGJlICcwJylcbi8vXHQzLiBXaXRoaW4tZmFtaWx5IElEIG9mIGZhdGhlciAoJzAnIGlmIGZhdGhlciBpc24ndCBpbiBkYXRhc2V0KVxuLy9cdDQuIFdpdGhpbi1mYW1pbHkgSUQgb2YgbW90aGVyICgnMCcgaWYgbW90aGVyIGlzbid0IGluIGRhdGFzZXQpXG4vL1x0NS4gU2V4IGNvZGUgKCcxJyA9IG1hbGUsICcyJyA9IGZlbWFsZSwgJzAnID0gdW5rbm93bilcbi8vXHQ2LiBQaGVub3R5cGUgdmFsdWUgKCcxJyA9IGNvbnRyb2wsICcyJyA9IGNhc2UsICctOScvJzAnL25vbi1udW1lcmljID0gbWlzc2luZyBkYXRhIGlmIGNhc2UvY29udHJvbClcbi8vICA3LiBHZW5vdHlwZXMgKGNvbHVtbiA3IG9ud2FyZHMpO1xuLy9cdCBjb2x1bW5zIDcgJiA4IGFyZSBhbGxlbGUgY2FsbHMgZm9yIGZpcnN0IHZhcmlhbnQgKCcwJyA9IG5vIGNhbGwpOyBjb2x1bW1ucyA5ICYgMTAgYXJlIGNhbGxzIGZvciBzZWNvbmQgdmFyaWFudCBldGMuXG5leHBvcnQgZnVuY3Rpb24gcmVhZExpbmthZ2UoYm9hZGljZWFfbGluZXMpIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHRsZXQgZmFtaWQ7XG5cdGZvcihsZXQgaSA9IDA7aSA8IGxpbmVzLmxlbmd0aDtpKyspe1xuXHQgICBsZXQgYXR0ciA9ICQubWFwKGxpbmVzW2ldLnRyaW0oKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gdmFsLnRyaW0oKTt9KTtcblx0ICAgaWYoYXR0ci5sZW5ndGggPCA1KVxuXHRcdCAgIHRocm93KCd1bmtub3duIGZvcm1hdCcpO1xuXHQgICBsZXQgc2V4ID0gKGF0dHJbNF0gPT0gJzEnID8gJ00nIDogKGF0dHJbNF0gPT0gJzInID8gJ0YnIDogJ1UnKSk7XG5cdCAgIGxldCBpbmRpID0ge1xuXHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdCdkaXNwbGF5X25hbWUnOiBhdHRyWzFdLFxuXHRcdFx0J25hbWUnOlx0YXR0clsxXSxcblx0XHRcdCdzZXgnOiBzZXhcblx0XHR9O1xuXHRcdGlmKGF0dHJbMl0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbMl07XG5cdFx0aWYoYXR0clszXSAhPT0gXCIwXCIpIGluZGkubW90aGVyID0gYXR0clszXTtcblxuXHRcdGlmICh0eXBlb2YgZmFtaWQgIT0gJ3VuZGVmaW5lZCcgJiYgZmFtaWQgIT09IGluZGkuZmFtaWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ211bHRpcGxlIGZhbWlseSBJRHMgZm91bmQgb25seSB1c2luZyBmYW1pZCA9ICcrZmFtaWQpO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdGlmKGF0dHJbNV0gPT0gXCIyXCIpIGluZGkuYWZmZWN0ZWQgPSAyO1xuXHRcdC8vIGFkZCBnZW5vdHlwZSBjb2x1bW5zXG5cdFx0aWYoYXR0ci5sZW5ndGggPiA2KSB7XG5cdFx0XHRpbmRpLmFsbGVsZXMgPSBcIlwiO1xuXHRcdFx0Zm9yKGxldCBqPTY7IGo8YXR0ci5sZW5ndGg7IGorPTIpIHtcblx0XHRcdFx0aW5kaS5hbGxlbGVzICs9IGF0dHJbal0gKyBcIi9cIiArIGF0dHJbaisxXSArIFwiO1wiO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHBlZC51bnNoaWZ0KGluZGkpO1xuXHRcdGZhbWlkID0gYXR0clswXTtcblx0fVxuXHRyZXR1cm4gcHJvY2Vzc19wZWQocGVkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRDYW5SaXNrVjEoYm9hZGljZWFfbGluZXMpIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHRsZXQgaGRyID0gW107ICAvLyBjb2xsZWN0IHJpc2sgZmFjdG9yIGhlYWRlciBsaW5lc1xuXHQvLyBhc3N1bWVzIHR3byBsaW5lIGhlYWRlclxuXHRmb3IobGV0IGkgPSAwO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0XHRsZXQgbG4gPSBsaW5lc1tpXS50cmltKCk7XG5cdFx0aWYobG4uc3RhcnRzV2l0aChcIiMjXCIpKSB7XG5cdFx0XHRpZihsbi5zdGFydHNXaXRoKFwiIyNDYW5SaXNrXCIpICYmIGxuLmluZGV4T2YoXCI7XCIpID4gLTEpIHsgICAvLyBjb250YWlucyBzdXJnaWNhbCBvcCBkYXRhXG5cdFx0XHRcdGxldCBvcHMgPSBsbi5zcGxpdChcIjtcIik7XG5cdFx0XHRcdGZvcihsZXQgaj0xOyBqPG9wcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdGxldCBvcGRhdGEgPSBvcHNbal0uc3BsaXQoXCI9XCIpO1xuXHRcdFx0XHRcdGlmKG9wZGF0YS5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0XHRcdGhkci5wdXNoKG9wc1tqXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZihsbi5pbmRleE9mKFwiQ2FuUmlza1wiKSA9PT0gLTEgJiYgIWxuLnN0YXJ0c1dpdGgoXCIjI0ZhbUlEXCIpKSB7XG5cdFx0XHRcdGhkci5wdXNoKGxuLnJlcGxhY2UoXCIjI1wiLCBcIlwiKSk7XG5cdFx0XHR9XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRsZXQgZGVsaW0gPSAvXFx0Lztcblx0XHRpZihsbi5pbmRleE9mKCdcXHQnKSA8IDApIHtcblx0XHRcdGRlbGltID0gL1xccysvO1xuXHRcdFx0Y29uc29sZS5sb2coXCJOT1QgVEFCIERFTElNXCIpO1xuXHRcdH1cblx0XHRsZXQgYXR0ciA9ICQubWFwKGxuLnNwbGl0KGRlbGltKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cblx0XHRpZihhdHRyLmxlbmd0aCA+IDEpIHtcblx0XHRcdGxldCBpbmRpID0ge1xuXHRcdFx0XHQnZmFtaWQnOiBhdHRyWzBdLFxuXHRcdFx0XHQnZGlzcGxheV9uYW1lJzogYXR0clsxXSxcblx0XHRcdFx0J25hbWUnOlx0YXR0clszXSxcblx0XHRcdFx0J3NleCc6IGF0dHJbNl0sXG5cdFx0XHRcdCdzdGF0dXMnOiBhdHRyWzhdXG5cdFx0XHR9O1xuXHRcdFx0aWYoYXR0clsyXSA9PSAxKSBpbmRpLnByb2JhbmQgPSB0cnVlO1xuXHRcdFx0aWYoYXR0cls0XSAhPT0gXCIwXCIpIGluZGkuZmF0aGVyID0gYXR0cls0XTtcblx0XHRcdGlmKGF0dHJbNV0gIT09IFwiMFwiKSBpbmRpLm1vdGhlciA9IGF0dHJbNV07XG5cdFx0XHRpZihhdHRyWzddICE9PSBcIjBcIikgaW5kaS5tenR3aW4gPSBhdHRyWzddO1xuXHRcdFx0aWYoYXR0cls5XSAhPT0gXCIwXCIpIGluZGkuYWdlID0gYXR0cls5XTtcblx0XHRcdGlmKGF0dHJbMTBdICE9PSBcIjBcIikgaW5kaS55b2IgPSBhdHRyWzEwXTtcblxuXHRcdFx0bGV0IGlkeCA9IDExO1xuXHRcdFx0JC5lYWNoKGNhbmNlcnMsIGZ1bmN0aW9uKGNhbmNlciwgZGlhZ25vc2lzX2FnZSkge1xuXHRcdFx0XHQvLyBBZ2UgYXQgMXN0IGNhbmNlciBvciAwID0gdW5hZmZlY3RlZCwgQVUgPSB1bmtub3duIGFnZSBhdCBkaWFnbm9zaXMgKGFmZmVjdGVkIHVua25vd24pXG5cdFx0XHRcdGlmKGF0dHJbaWR4XSAhPT0gXCIwXCIpIHtcblx0XHRcdFx0XHRpbmRpW2RpYWdub3Npc19hZ2VdID0gYXR0cltpZHhdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlkeCsrO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmKGF0dHJbaWR4KytdICE9PSBcIjBcIikgaW5kaS5hc2hrZW5hemkgPSAxO1xuXHRcdFx0Ly8gQlJDQTEsIEJSQ0EyLCBQQUxCMiwgQVRNLCBDSEVLMiwgLi4uLiBnZW5ldGljIHRlc3RzXG5cdFx0XHQvLyBnZW5ldGljIHRlc3QgdHlwZSwgMCA9IHVudGVzdGVkLCBTID0gbXV0YXRpb24gc2VhcmNoLCBUID0gZGlyZWN0IGdlbmUgdGVzdFxuXHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHJlc3VsdCwgMCA9IHVudGVzdGVkLCBQID0gcG9zaXRpdmUsIE4gPSBuZWdhdGl2ZVxuXHRcdFx0Zm9yKGxldCBqPTA7IGo8Z2VuZXRpY190ZXN0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGxldCBnZW5lX3Rlc3QgPSBhdHRyW2lkeF0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0XHRpZihnZW5lX3Rlc3RbMF0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKChnZW5lX3Rlc3RbMF0gPT09ICdTJyB8fCBnZW5lX3Rlc3RbMF0gPT09ICdUJykgJiYgKGdlbmVfdGVzdFsxXSA9PT0gJ1AnIHx8IGdlbmVfdGVzdFsxXSA9PT0gJ04nKSlcblx0XHRcdFx0XHRcdGluZGlbZ2VuZXRpY190ZXN0W2pdICsgJ19nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGdlbmVfdGVzdFswXSwgJ3Jlc3VsdCc6IGdlbmVfdGVzdFsxXX07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBnZW5lX3Rlc3RbMF0gKyBcIiBcIiArIGdlbmVfdGVzdFsxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9XG5cdFx0XHQvLyBzdGF0dXMsIDAgPSB1bnNwZWNpZmllZCwgTiA9IG5lZ2F0aXZlLCBQID0gcG9zaXRpdmVcblx0XHRcdGxldCBwYXRoX3Rlc3QgPSBhdHRyW2lkeF0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cGF0aF90ZXN0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHBhdGhfdGVzdFtqXSAhPT0gJzAnKSB7XG5cdFx0XHRcdFx0aWYocGF0aF90ZXN0W2pdID09PSAnTicgfHwgcGF0aF90ZXN0W2pdID09PSAnUCcpXG5cdFx0XHRcdFx0XHRpbmRpW3BhdGhvbG9neV90ZXN0c1tqXSArICdfYmNfcGF0aG9sb2d5J10gPSBwYXRoX3Rlc3Rbal07XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgUEFUSE9MT0dZIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgK3BhdGhvbG9neV90ZXN0c1tqXSArIFwiIFwiICtwYXRoX3Rlc3Rbal0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBbaGRyLCBwcm9jZXNzX3BlZChwZWQpXTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHRyZXR1cm4gW2hkciwgcGVkXTtcblx0fVxufVxuXG4vLyByZWFkIGJvYWRpY2VhIGZvcm1hdCB2NCAmIHYyXG5leHBvcnQgZnVuY3Rpb24gcmVhZEJvYWRpY2VhVjQoYm9hZGljZWFfbGluZXMsIHZlcnNpb24pIHtcblx0bGV0IGxpbmVzID0gYm9hZGljZWFfbGluZXMudHJpbSgpLnNwbGl0KCdcXG4nKTtcblx0bGV0IHBlZCA9IFtdO1xuXHQvLyBhc3N1bWVzIHR3byBsaW5lIGhlYWRlclxuXHRmb3IobGV0IGkgPSAyO2kgPCBsaW5lcy5sZW5ndGg7aSsrKXtcblx0ICAgbGV0IGF0dHIgPSAkLm1hcChsaW5lc1tpXS50cmltKCkuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24odmFsLCBfaSl7cmV0dXJuIHZhbC50cmltKCk7fSk7XG5cdFx0aWYoYXR0ci5sZW5ndGggPiAxKSB7XG5cdFx0XHRsZXQgaW5kaSA9IHtcblx0XHRcdFx0J2ZhbWlkJzogYXR0clswXSxcblx0XHRcdFx0J2Rpc3BsYXlfbmFtZSc6IGF0dHJbMV0sXG5cdFx0XHRcdCduYW1lJzpcdGF0dHJbM10sXG5cdFx0XHRcdCdzZXgnOiBhdHRyWzZdLFxuXHRcdFx0XHQnc3RhdHVzJzogYXR0cls4XVxuXHRcdFx0fTtcblx0XHRcdGlmKGF0dHJbMl0gPT0gMSkgaW5kaS5wcm9iYW5kID0gdHJ1ZTtcblx0XHRcdGlmKGF0dHJbNF0gIT09IFwiMFwiKSBpbmRpLmZhdGhlciA9IGF0dHJbNF07XG5cdFx0XHRpZihhdHRyWzVdICE9PSBcIjBcIikgaW5kaS5tb3RoZXIgPSBhdHRyWzVdO1xuXHRcdFx0aWYoYXR0cls3XSAhPT0gXCIwXCIpIGluZGkubXp0d2luID0gYXR0cls3XTtcblx0XHRcdGlmKGF0dHJbOV0gIT09IFwiMFwiKSBpbmRpLmFnZSA9IGF0dHJbOV07XG5cdFx0XHRpZihhdHRyWzEwXSAhPT0gXCIwXCIpIGluZGkueW9iID0gYXR0clsxMF07XG5cblx0XHRcdGxldCBpZHggPSAxMTtcblx0XHRcdCQuZWFjaChjYW5jZXJzLCBmdW5jdGlvbihjYW5jZXIsIGRpYWdub3Npc19hZ2UpIHtcblx0XHRcdFx0Ly8gQWdlIGF0IDFzdCBjYW5jZXIgb3IgMCA9IHVuYWZmZWN0ZWQsIEFVID0gdW5rbm93biBhZ2UgYXQgZGlhZ25vc2lzIChhZmZlY3RlZCB1bmtub3duKVxuXHRcdFx0XHRpZihhdHRyW2lkeF0gIT09IFwiMFwiKSB7XG5cdFx0XHRcdFx0aW5kaVtkaWFnbm9zaXNfYWdlXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZHgrKztcblx0XHRcdH0pO1xuXG5cdFx0XHRpZih2ZXJzaW9uID09PSA0KSB7XG5cdFx0XHRcdGlmKGF0dHJbaWR4KytdICE9PSBcIjBcIikgaW5kaS5hc2hrZW5hemkgPSAxO1xuXHRcdFx0XHQvLyBCUkNBMSwgQlJDQTIsIFBBTEIyLCBBVE0sIENIRUsyIGdlbmV0aWMgdGVzdHNcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHR5cGUsIDAgPSB1bnRlc3RlZCwgUyA9IG11dGF0aW9uIHNlYXJjaCwgVCA9IGRpcmVjdCBnZW5lIHRlc3Rcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IHJlc3VsdCwgMCA9IHVudGVzdGVkLCBQID0gcG9zaXRpdmUsIE4gPSBuZWdhdGl2ZVxuXHRcdFx0XHRmb3IobGV0IGo9MDsgajw1OyBqKyspIHtcblx0XHRcdFx0XHRpZHgrPTI7XG5cdFx0XHRcdFx0aWYoYXR0cltpZHgtMl0gIT09ICcwJykge1xuXHRcdFx0XHRcdFx0aWYoKGF0dHJbaWR4LTJdID09PSAnUycgfHwgYXR0cltpZHgtMl0gPT09ICdUJykgJiYgKGF0dHJbaWR4LTFdID09PSAnUCcgfHwgYXR0cltpZHgtMV0gPT09ICdOJykpXG5cdFx0XHRcdFx0XHRcdGluZGlbZ2VuZXRpY190ZXN0W2pdICsgJ19nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogYXR0cltpZHgtMV19O1xuXHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1VOUkVDT0dOSVNFRCBHRU5FIFRFU1QgT04gTElORSAnKyAoaSsxKSArIFwiOiBcIiArIGF0dHJbaWR4LTJdICsgXCIgXCIgKyBhdHRyW2lkeC0xXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHZlcnNpb24gPT09IDIpIHtcblx0XHRcdFx0Ly8gZ2VuZXRpYyB0ZXN0IEJSQ0ExLCBCUkNBMlxuXHRcdFx0XHQvLyB0eXBlLCAwID0gdW50ZXN0ZWQsIFMgPSBtdXRhdGlvbiBzZWFyY2gsIFQgPSBkaXJlY3QgZ2VuZSB0ZXN0XG5cdFx0XHRcdC8vIHJlc3VsdCwgMCA9IHVudGVzdGVkLCBOID0gbm8gbXV0YXRpb24sIDEgPSBCUkNBMSBwb3NpdGl2ZSwgMiA9IEJSQ0EyIHBvc2l0aXZlLCAzID0gQlJDQTEvMiBwb3NpdGl2ZVxuXHRcdFx0XHRpZHgrPTI7IFx0Ly8gZ3Rlc3Rcblx0XHRcdFx0aWYoYXR0cltpZHgtMl0gIT09ICcwJykge1xuXHRcdFx0XHRcdGlmKChhdHRyW2lkeC0yXSA9PT0gJ1MnIHx8IGF0dHJbaWR4LTJdID09PSAnVCcpKSB7XG5cdFx0XHRcdFx0XHRpZihhdHRyW2lkeC0xXSA9PT0gJ04nKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnTid9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzEnKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnUCd9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ04nfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzInKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnTid9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdH0gZWxzZSBpZihhdHRyW2lkeC0xXSA9PT0gJzMnKSB7XG5cdFx0XHRcdFx0XHRcdGluZGlbJ2JyY2ExX2dlbmVfdGVzdCddID0geyd0eXBlJzogYXR0cltpZHgtMl0sICdyZXN1bHQnOiAnUCd9O1xuXHRcdFx0XHRcdFx0XHRpbmRpWydicmNhMl9nZW5lX3Rlc3QnXSA9IHsndHlwZSc6IGF0dHJbaWR4LTJdLCAncmVzdWx0JzogJ1AnfTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdVTlJFQ09HTklTRUQgR0VORSBURVNUIE9OIExJTkUgJysgKGkrMSkgKyBcIjogXCIgKyBhdHRyW2lkeC0yXSArIFwiIFwiICsgYXR0cltpZHgtMV0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRpZihhdHRyW2lkeCsrXSAhPT0gXCIwXCIpIGluZGkuYXNoa2VuYXppID0gMTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gc3RhdHVzLCAwID0gdW5zcGVjaWZpZWQsIE4gPSBuZWdhdGl2ZSwgUCA9IHBvc2l0aXZlXG5cdFx0XHRmb3IobGV0IGo9MDsgajxwYXRob2xvZ3lfdGVzdHMubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoYXR0cltpZHhdICE9PSAnMCcpIHtcblx0XHRcdFx0XHRpZihhdHRyW2lkeF0gPT09ICdOJyB8fCBhdHRyW2lkeF0gPT09ICdQJylcblx0XHRcdFx0XHRcdGluZGlbcGF0aG9sb2d5X3Rlc3RzW2pdICsgJ19iY19wYXRob2xvZ3knXSA9IGF0dHJbaWR4XTtcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ1VOUkVDT0dOSVNFRCBQQVRIT0xPR1kgT04gTElORSAnKyAoaSsxKSArIFwiOiBcIiArcGF0aG9sb2d5X3Rlc3RzW2pdICsgXCIgXCIgK2F0dHJbaWR4XSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWR4Kys7XG5cdFx0XHR9XG5cdFx0XHRwZWQudW5zaGlmdChpbmRpKTtcblx0XHR9XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBwcm9jZXNzX3BlZChwZWQpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHRjb25zb2xlLmVycm9yKGUpO1xuXHRcdHJldHVybiBwZWQ7XG5cdH1cbn1cblxuZnVuY3Rpb24gcHJvY2Vzc19wZWQocGVkKSB7XG5cdC8vIGZpbmQgdGhlIGxldmVsIG9mIGluZGl2aWR1YWxzIGluIHRoZSBwZWRpZ3JlZVxuXHRmb3IobGV0IGo9MDtqPDI7aisrKSB7XG5cdFx0Zm9yKGxldCBpPTA7aTxwZWQubGVuZ3RoO2krKykge1xuXHRcdFx0Z2V0TGV2ZWwocGVkLCBwZWRbaV0ubmFtZSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gZmluZCB0aGUgbWF4IGxldmVsIChpLmUuIHRvcF9sZXZlbClcblx0bGV0IG1heF9sZXZlbCA9IDA7XG5cdGZvcihsZXQgaT0wO2k8cGVkLmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRbaV0ubGV2ZWwgJiYgcGVkW2ldLmxldmVsID4gbWF4X2xldmVsKVxuXHRcdFx0bWF4X2xldmVsID0gcGVkW2ldLmxldmVsO1xuXHR9XG5cblx0Ly8gaWRlbnRpZnkgdG9wX2xldmVsIGFuZCBvdGhlciBub2RlcyB3aXRob3V0IHBhcmVudHNcblx0Zm9yKGxldCBpPTA7aTxwZWQubGVuZ3RoO2krKykge1xuXHRcdGlmKHBlZGlncmVlX3V0aWwuZ2V0RGVwdGgocGVkLCBwZWRbaV0ubmFtZSkgPT0gMSkge1xuXHRcdFx0aWYocGVkW2ldLmxldmVsICYmIHBlZFtpXS5sZXZlbCA9PSBtYXhfbGV2ZWwpIHtcblx0XHRcdFx0cGVkW2ldLnRvcF9sZXZlbCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwZWRbaV0ubm9wYXJlbnRzID0gdHJ1ZTtcblxuXHRcdFx0XHQvLyAxLiBsb29rIGZvciBwYXJ0bmVycyBwYXJlbnRzXG5cdFx0XHRcdGxldCBwaWR4ID0gZ2V0UGFydG5lcklkeChwZWQsIHBlZFtpXSk7XG5cdFx0XHRcdGlmKHBpZHggPiAtMSkge1xuXHRcdFx0XHRcdGlmKHBlZFtwaWR4XS5tb3RoZXIpIHtcblx0XHRcdFx0XHRcdHBlZFtpXS5tb3RoZXIgPSBwZWRbcGlkeF0ubW90aGVyO1xuXHRcdFx0XHRcdFx0cGVkW2ldLmZhdGhlciA9IHBlZFtwaWR4XS5mYXRoZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gMi4gb3IgYWRvcHQgcGFyZW50cyBmcm9tIGxldmVsIGFib3ZlXG5cdFx0XHRcdGlmKCFwZWRbaV0ubW90aGVyKXtcblx0XHRcdFx0XHRmb3IobGV0IGo9MDsgajxwZWQubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRcdGlmKHBlZFtpXS5sZXZlbCA9PSAocGVkW2pdLmxldmVsLTEpKSB7XG5cdFx0XHRcdFx0XHRcdHBpZHggPSBnZXRQYXJ0bmVySWR4KHBlZCwgcGVkW2pdKTtcblx0XHRcdFx0XHRcdFx0aWYocGlkeCA+IC0xKSB7XG5cdFx0XHRcdFx0XHRcdFx0cGVkW2ldLm1vdGhlciA9IChwZWRbal0uc2V4ID09PSAnRicgPyBwZWRbal0ubmFtZSA6IHBlZFtwaWR4XS5uYW1lKTtcblx0XHRcdFx0XHRcdFx0XHRwZWRbaV0uZmF0aGVyID0gKHBlZFtqXS5zZXggPT09ICdNJyA/IHBlZFtqXS5uYW1lIDogcGVkW3BpZHhdLm5hbWUpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSBwZWRbaV0udG9wX2xldmVsO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gcGVkO1xufVxuXG4vLyBnZXQgdGhlIHBhcnRuZXJzIGZvciBhIGdpdmVuIG5vZGVcbmZ1bmN0aW9uIGdldFBhcnRuZXJJZHgoZGF0YXNldCwgYW5vZGUpIHtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBibm9kZSA9IGRhdGFzZXRbaV07XG5cdFx0aWYoYW5vZGUubmFtZSA9PT0gYm5vZGUubW90aGVyKVxuXHRcdFx0cmV0dXJuIHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGJub2RlLmZhdGhlcik7XG5cdFx0ZWxzZSBpZihhbm9kZS5uYW1lID09PSBibm9kZS5mYXRoZXIpXG5cdFx0XHRyZXR1cm4gcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgYm5vZGUubW90aGVyKTtcblx0fVxuXHRyZXR1cm4gLTE7XG59XG5cbi8vIGZvciBhIGdpdmVuIGluZGl2aWR1YWwgYXNzaWduIGxldmVscyB0byBhIHBhcmVudHMgYW5jZXN0b3JzXG5mdW5jdGlvbiBnZXRMZXZlbChkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlsLmdldElkeEJ5TmFtZShkYXRhc2V0LCBuYW1lKTtcblx0bGV0IGxldmVsID0gKGRhdGFzZXRbaWR4XS5sZXZlbCA/IGRhdGFzZXRbaWR4XS5sZXZlbCA6IDApO1xuXHR1cGRhdGVfcGFyZW50c19sZXZlbChpZHgsIGxldmVsLCBkYXRhc2V0KTtcbn1cblxuLy8gcmVjdXJzaXZlbHkgdXBkYXRlIHBhcmVudHMgbGV2ZWxzXG5mdW5jdGlvbiB1cGRhdGVfcGFyZW50c19sZXZlbChpZHgsIGxldmVsLCBkYXRhc2V0KSB7XG5cdGxldCBwYXJlbnRzID0gWydtb3RoZXInLCAnZmF0aGVyJ107XG5cdGxldmVsKys7XG5cdGZvcihsZXQgaT0wOyBpPHBhcmVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgcGlkeCA9IHBlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XVtwYXJlbnRzW2ldXSk7XG5cdFx0aWYocGlkeCA+PSAwKSB7XG5cdFx0XHRsZXQgbWEgPSBkYXRhc2V0W3BlZGlncmVlX3V0aWwuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGRhdGFzZXRbaWR4XS5tb3RoZXIpXTtcblx0XHRcdGxldCBwYSA9IGRhdGFzZXRbcGVkaWdyZWVfdXRpbC5nZXRJZHhCeU5hbWUoZGF0YXNldCwgZGF0YXNldFtpZHhdLmZhdGhlcildO1xuXHRcdFx0aWYoIWRhdGFzZXRbcGlkeF0ubGV2ZWwgfHwgZGF0YXNldFtwaWR4XS5sZXZlbCA8IGxldmVsKSB7XG5cdFx0XHRcdG1hLmxldmVsID0gbGV2ZWw7XG5cdFx0XHRcdHBhLmxldmVsID0gbGV2ZWw7XG5cdFx0XHR9XG5cblx0XHRcdGlmKG1hLmxldmVsIDwgcGEubGV2ZWwpIHtcblx0XHRcdFx0bWEubGV2ZWwgPSBwYS5sZXZlbDtcblx0XHRcdH0gZWxzZSBpZihwYS5sZXZlbCA8IG1hLmxldmVsKSB7XG5cdFx0XHRcdHBhLmxldmVsID0gbWEubGV2ZWw7XG5cdFx0XHR9XG5cdFx0XHR1cGRhdGVfcGFyZW50c19sZXZlbChwaWR4LCBsZXZlbCwgZGF0YXNldCk7XG5cdFx0fVxuXHR9XG59XG4iLCIvLyBwZWRpZ3JlZSBmb3JtXG5pbXBvcnQge3JlYnVpbGQsIHN5bmNUd2luc30gZnJvbSAnLi9wZWRpZ3JlZS5qcyc7XG5pbXBvcnQge2NvcHlfZGF0YXNldCwgZ2V0Tm9kZUJ5TmFtZX0gZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5pbXBvcnQge2N1cnJlbnQgYXMgcGVkY2FjaGVfY3VycmVudH0gZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5cblxuLy8gaGFuZGxlIGZhbWlseSBoaXN0b3J5IGNoYW5nZSBldmVudHMgKHVuZG8vcmVkby9kZWxldGUpXG4kKGRvY3VtZW50KS5vbignZmhDaGFuZ2UnLCBmdW5jdGlvbihlLCBvcHRzKXtcblx0dHJ5IHtcblx0XHRsZXQgaWQgPSAkKCcjaWRfbmFtZScpLnZhbCgpOyAgLy8gZ2V0IG5hbWUgZnJvbSBoaWRkZW4gZmllbGRcblx0XHRsZXQgbm9kZSA9IGdldE5vZGVCeU5hbWUocGVkY2FjaGVfY3VycmVudChvcHRzKSwgaWQpXG5cdFx0aWYobm9kZSA9PT0gdW5kZWZpbmVkKVxuXHRcdFx0JCgnZm9ybSA+IGZpZWxkc2V0JykucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuXHRcdGVsc2Vcblx0XHRcdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHR9IGNhdGNoKGVycikge1xuXHRcdGNvbnNvbGUud2FybihlcnIpO1xuXHR9XG59KVxuXG4vLyB1cGRhdGUgc3RhdHVzIGZpZWxkIGFuZCBhZ2UgbGFiZWwgLSAwID0gYWxpdmUsIDEgPSBkZWFkXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3RhdHVzKHN0YXR1cykge1xuXHQkKCcjYWdlX3lvYl9sb2NrJykucmVtb3ZlQ2xhc3MoJ2ZhLWxvY2sgZmEtdW5sb2NrLWFsdCcpO1xuXHQoc3RhdHVzID09IDEgPyAkKCcjYWdlX3lvYl9sb2NrJykuYWRkQ2xhc3MoJ2ZhLXVubG9jay1hbHQnKSA6ICQoJyNhZ2VfeW9iX2xvY2snKS5hZGRDbGFzcygnZmEtbG9jaycpKTtcblx0JCgnI2lkX2FnZV8nK3N0YXR1cykucmVtb3ZlQ2xhc3MoXCJoaWRkZW5cIik7XG5cdCQoJyNpZF9hZ2VfJysoc3RhdHVzID09IDEgPyAnMCcgOiAnMScpKS5hZGRDbGFzcyhcImhpZGRlblwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vZGVjbGljayhub2RlKSB7XG5cdCQoJ2Zvcm0gPiBmaWVsZHNldCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuXHQvLyBjbGVhciB2YWx1ZXNcblx0JCgnI3BlcnNvbl9kZXRhaWxzJykuZmluZChcImlucHV0W3R5cGU9dGV4dF0sIGlucHV0W3R5cGU9bnVtYmVyXVwiKS52YWwoXCJcIik7XG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3QnKS52YWwoJycpLnByb3AoJ3NlbGVjdGVkJywgdHJ1ZSk7XG5cblx0Ly8gYXNzaWduIHZhbHVlcyB0byBpbnB1dCBmaWVsZHMgaW4gZm9ybVxuXHRpZihub2RlLnNleCA9PT0gJ00nIHx8IG5vZGUuc2V4ID09PSAnRicpXG5cdFx0JCgnaW5wdXRbbmFtZT1zZXhdW3ZhbHVlPVwiJytub2RlLnNleCsnXCJdJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuXHRlbHNlXG5cdFx0JCgnaW5wdXRbbmFtZT1zZXhdJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0dXBkYXRlX2NhbmNlcl9ieV9zZXgobm9kZSk7XG5cblx0aWYoISgnc3RhdHVzJyBpbiBub2RlKSlcblx0XHRub2RlLnN0YXR1cyA9IDA7XG5cdCQoJ2lucHV0W25hbWU9c3RhdHVzXVt2YWx1ZT1cIicrbm9kZS5zdGF0dXMrJ1wiXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcblx0Ly8gc2hvdyBsb2NrIHN5bWJvbCBmb3IgYWdlIGFuZCB5b2Igc3luY2hyb25pc2F0aW9uXG5cdHVwZGF0ZVN0YXR1cyhub2RlLnN0YXR1cyk7XG5cblx0aWYoJ3Byb2JhbmQnIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoJ2NoZWNrZWQnLCBub2RlLnByb2JhbmQpO1xuXHRcdCQoJyNpZF9wcm9iYW5kJykucHJvcChcImRpc2FibGVkXCIsIHRydWUpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF9wcm9iYW5kJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0XHQkKCcjaWRfcHJvYmFuZCcpLnByb3AoXCJkaXNhYmxlZFwiLCAhKCd5b2InIGluIG5vZGUpKVxuXHR9XG5cblx0aWYoJ2V4Y2x1ZGUnIGluIG5vZGUpIHtcblx0XHQkKCcjaWRfZXhjbHVkZScpLnByb3AoJ2NoZWNrZWQnLCBub2RlLmV4Y2x1ZGUpO1xuXHR9IGVsc2Uge1xuXHRcdCQoJyNpZF9leGNsdWRlJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcblx0fVxuXG4vKlx0XHRpZignYXNoa2VuYXppJyBpbiBub2RlKSB7XG5cdFx0XHQkKCcjaWRfYXNoa2VuYXppJykucHJvcCgnY2hlY2tlZCcsIChub2RlLnByb2JhbmQgPT0gMSA/IHRydWU6IGZhbHNlKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdCQoJyNpZF9hc2hrZW5hemknKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xuXHRcdH0qL1xuXG5cdC8vIHllYXIgb2YgYmlydGhcblx0aWYoJ3lvYicgaW4gbm9kZSkge1xuXHRcdCQoJyNpZF95b2JfMCcpLnZhbChub2RlLnlvYik7XG5cdH0gZWxzZSB7XG5cdFx0JCgnI2lkX3lvYl8wJykudmFsKCctJyk7XG5cdH1cblxuXHQvLyBjbGVhciBwYXRob2xvZ3lcblx0JCgnc2VsZWN0W25hbWUkPVwiX2JjX3BhdGhvbG9neVwiXScpLnZhbCgnLScpO1xuXHQvLyBjbGVhciBnZW5lIHRlc3RzXG5cdCQoJ3NlbGVjdFtuYW1lKj1cIl9nZW5lX3Rlc3RcIl0nKS52YWwoJy0nKTtcblxuXHQvLyBkaXNhYmxlIHNleCByYWRpbyBidXR0b25zIGlmIHRoZSBwZXJzb24gaGFzIGEgcGFydG5lclxuXHQkKFwiaW5wdXRbaWRePSdpZF9zZXhfJ11cIikucHJvcChcImRpc2FibGVkXCIsIChub2RlLnBhcmVudF9ub2RlICYmIG5vZGUuc2V4ICE9PSAnVScgPyB0cnVlIDogZmFsc2UpKTtcblxuXHQvLyBkaXNhYmxlIHBhdGhvbG9neSBmb3IgbWFsZSByZWxhdGl2ZXMgKGFzIG5vdCB1c2VkIGJ5IG1vZGVsKVxuXHQvLyBhbmQgaWYgbm8gYnJlYXN0IGNhbmNlciBhZ2Ugb2YgZGlhZ25vc2lzXG5cdCQoXCJzZWxlY3RbaWQkPSdfYmNfcGF0aG9sb2d5J11cIikucHJvcChcImRpc2FibGVkXCIsXG5cdFx0XHQobm9kZS5zZXggPT09ICdNJyB8fCAobm9kZS5zZXggPT09ICdGJyAmJiAhKCdicmVhc3RfY2FuY2VyX2RpYWdub3Npc19hZ2UnIGluIG5vZGUpKSA/IHRydWUgOiBmYWxzZSkpO1xuXG5cdC8vIGFwcHJveGltYXRlIGRpYWdub3NpcyBhZ2Vcblx0JCgnI2lkX2FwcHJveCcpLnByb3AoJ2NoZWNrZWQnLCAobm9kZS5hcHByb3hfZGlhZ25vc2lzX2FnZSA/IHRydWU6IGZhbHNlKSk7XG5cdHVwZGF0ZV9kaWFnbm9zaXNfYWdlX3dpZGdldCgpO1xuXG5cdGZvcihsZXQga2V5IGluIG5vZGUpIHtcblx0XHRpZihrZXkgIT09ICdwcm9iYW5kJyAmJiBrZXkgIT09ICdzZXgnKSB7XG5cdFx0XHRpZigkKCcjaWRfJytrZXkpLmxlbmd0aCkge1x0Ly8gaW5wdXQgdmFsdWVcblx0XHRcdFx0aWYoa2V5LmluZGV4T2YoJ19nZW5lX3Rlc3QnKSAgIT09IC0xICYmIG5vZGVba2V5XSAhPT0gbnVsbCAmJiB0eXBlb2Ygbm9kZVtrZXldID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSkudmFsKG5vZGVba2V5XS50eXBlKTtcblx0XHRcdFx0XHQkKCcjaWRfJytrZXkrJ19yZXN1bHQnKS52YWwobm9kZVtrZXldLnJlc3VsdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KS52YWwobm9kZVtrZXldKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmKGtleS5pbmRleE9mKCdfZGlhZ25vc2lzX2FnZScpICE9PSAtMSkge1xuXHRcdFx0XHRpZigkKFwiI2lkX2FwcHJveFwiKS5pcygnOmNoZWNrZWQnKSkge1xuXHRcdFx0XHRcdCQoJyNpZF8nK2tleSsnXzEnKS52YWwocm91bmQ1KG5vZGVba2V5XSkpLnByb3AoJ3NlbGVjdGVkJywgdHJ1ZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JCgnI2lkXycra2V5KydfMCcpLnZhbChub2RlW2tleV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dHJ5IHtcblx0XHQkKCcjcGVyc29uX2RldGFpbHMnKS5maW5kKCdmb3JtJykudmFsaWQoKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oJ3ZhbGlkKCkgbm90IGZvdW5kJyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlX2FzaGtuKG5ld2RhdGFzZXQpIHtcblx0Ly8gQXNoa2VuYXppIHN0YXR1cywgMCA9IG5vdCBBc2hrZW5hemksIDEgPSBBc2hrZW5hemlcblx0aWYoJCgnI29yaWdfYXNoaycpLmlzKCc6Y2hlY2tlZCcpKSB7XG5cdFx0JC5lYWNoKG5ld2RhdGFzZXQsIGZ1bmN0aW9uKGksIHApIHtcblx0XHRcdGlmKHAucHJvYmFuZClcblx0XHRcdFx0cC5hc2hrZW5hemkgPSAxO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdCQuZWFjaChuZXdkYXRhc2V0LCBmdW5jdGlvbihpLCBwKSB7XG5cdFx0XHRkZWxldGUgcC5hc2hrZW5hemk7XG5cdFx0fSk7XG5cdH1cbn1cblxuLy8gU2F2ZSBBc2hrZW5hemkgc3RhdHVzXG5leHBvcnQgZnVuY3Rpb24gc2F2ZV9hc2hrbihvcHRzKSB7XG5cdGxldCBkYXRhc2V0ID0gcGVkY2FjaGVfY3VycmVudChvcHRzKTtcblx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdHVwZGF0ZV9hc2hrbihuZXdkYXRhc2V0KTtcblx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0cmVidWlsZChvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmUob3B0cykge1xuXHRsZXQgZGF0YXNldCA9IHBlZGNhY2hlX2N1cnJlbnQob3B0cyk7XG5cdGxldCBuYW1lID0gJCgnI2lkX25hbWUnKS52YWwoKTtcblx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQoZGF0YXNldCk7XG5cdGxldCBwZXJzb24gPSBnZXROb2RlQnlOYW1lKG5ld2RhdGFzZXQsIG5hbWUpO1xuXHRpZighcGVyc29uKSB7XG5cdFx0Y29uc29sZS53YXJuKCdwZXJzb24gbm90IGZvdW5kIHdoZW4gc2F2aW5nIGRldGFpbHMnKTtcblx0XHRyZXR1cm47XG5cdH1cblx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblxuXHQvLyBpbmRpdmlkdWFsJ3MgcGVyc29uYWwgYW5kIGNsaW5pY2FsIGRldGFpbHNcblx0bGV0IHlvYiA9ICQoJyNpZF95b2JfMCcpLnZhbCgpO1xuXHRpZih5b2IgJiYgeW9iICE9PSAnJykge1xuXHRcdHBlcnNvbi55b2IgPSB5b2I7XG5cdH0gZWxzZSB7XG5cdFx0ZGVsZXRlIHBlcnNvbi55b2I7XG5cdH1cblxuXHQvLyBjdXJyZW50IHN0YXR1czogMCA9IGFsaXZlLCAxID0gZGVhZFxuXHRsZXQgc3RhdHVzID0gJCgnI2lkX3N0YXR1cycpLmZpbmQoXCJpbnB1dFt0eXBlPSdyYWRpbyddOmNoZWNrZWRcIik7XG5cdGlmKHN0YXR1cy5sZW5ndGggPiAwKXtcblx0XHRwZXJzb24uc3RhdHVzID0gc3RhdHVzLnZhbCgpO1xuXHR9XG5cblx0Ly8gYm9vbGVhbnMgc3dpdGNoZXNcblx0bGV0IHN3aXRjaGVzID0gW1wibWlzY2FycmlhZ2VcIiwgXCJhZG9wdGVkX2luXCIsIFwiYWRvcHRlZF9vdXRcIiwgXCJ0ZXJtaW5hdGlvblwiLCBcInN0aWxsYmlydGhcIl07XG5cdGZvcihsZXQgaXN3aXRjaD0wOyBpc3dpdGNoPHN3aXRjaGVzLmxlbmd0aDsgaXN3aXRjaCsrKXtcblx0XHRsZXQgYXR0ciA9IHN3aXRjaGVzW2lzd2l0Y2hdO1xuXHRcdGxldCBzID0gJCgnI2lkXycrYXR0cik7XG5cdFx0aWYocy5sZW5ndGggPiAwKXtcblx0XHRcdGNvbnNvbGUubG9nKHMuaXMoXCI6Y2hlY2tlZFwiKSk7XG5cdFx0XHRpZihzLmlzKFwiOmNoZWNrZWRcIikpXG5cdFx0XHRcdHBlcnNvblthdHRyXSA9IHRydWU7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGRlbGV0ZSBwZXJzb25bYXR0cl07XG5cdFx0fVxuXHR9XG5cblx0Ly8gY3VycmVudCBzZXhcblx0bGV0IHNleCA9ICQoJyNpZF9zZXgnKS5maW5kKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIpO1xuXHRpZihzZXgubGVuZ3RoID4gMCl7XG5cdFx0cGVyc29uLnNleCA9IHNleC52YWwoKTtcblx0XHR1cGRhdGVfY2FuY2VyX2J5X3NleChwZXJzb24pO1xuXHR9XG5cblx0Ly8gQXNoa2VuYXppIHN0YXR1cywgMCA9IG5vdCBBc2hrZW5hemksIDEgPSBBc2hrZW5hemlcblx0dXBkYXRlX2FzaGtuKG5ld2RhdGFzZXQpO1xuXG5cdGlmKCQoJyNpZF9hcHByb3gnKS5pcygnOmNoZWNrZWQnKSkgLy8gYXBwcm94aW1hdGUgZGlhZ25vc2lzIGFnZVxuXHRcdHBlcnNvbi5hcHByb3hfZGlhZ25vc2lzX2FnZSA9IHRydWU7XG5cdGVsc2Vcblx0XHRkZWxldGUgcGVyc29uLmFwcHJveF9kaWFnbm9zaXNfYWdlO1xuXG5cdCQoXCIjcGVyc29uX2RldGFpbHMgc2VsZWN0W25hbWUqPSdfZGlhZ25vc2lzX2FnZSddOnZpc2libGUsICNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPXRleHRdOnZpc2libGUsICNwZXJzb25fZGV0YWlscyBpbnB1dFt0eXBlPW51bWJlcl06dmlzaWJsZVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdGxldCBuYW1lID0gKHRoaXMubmFtZS5pbmRleE9mKFwiX2RpYWdub3Npc19hZ2VcIik+LTEgPyB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGgtMik6IHRoaXMubmFtZSk7XG5cblx0XHRpZigkKHRoaXMpLnZhbCgpKSB7XG5cdFx0XHRsZXQgdmFsID0gJCh0aGlzKS52YWwoKTtcblx0XHRcdGlmKG5hbWUuaW5kZXhPZihcIl9kaWFnbm9zaXNfYWdlXCIpID4gLTEgJiYgJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpXG5cdFx0XHRcdHZhbCA9IHJvdW5kNSh2YWwpO1xuXHRcdFx0cGVyc29uW25hbWVdID0gdmFsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uW25hbWVdO1xuXHRcdH1cblx0fSk7XG5cblx0Ly8gY2FuY2VyIGNoZWNrYm94ZXNcblx0JCgnI3BlcnNvbl9kZXRhaWxzIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXVtuYW1lJD1cImNhbmNlclwiXSxpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl1bbmFtZSQ9XCJjYW5jZXIyXCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLmNoZWNrZWQpXG5cdFx0XHRwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldID0gdHJ1ZTtcblx0XHRlbHNlXG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0fSk7XG5cblx0Ly8gcGF0aG9sb2d5IHRlc3RzXG5cdCQoJyNwZXJzb25fZGV0YWlscyBzZWxlY3RbbmFtZSQ9XCJfYmNfcGF0aG9sb2d5XCJdJykuZWFjaChmdW5jdGlvbigpIHtcblx0XHRpZigkKHRoaXMpLnZhbCgpICE9PSAnLScpIHtcblx0XHRcdHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV0gPSAkKHRoaXMpLnZhbCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWxldGUgcGVyc29uWyQodGhpcykuYXR0cignbmFtZScpXTtcblx0XHR9XG5cdH0pO1xuXG5cdC8vIGdlbmV0aWMgdGVzdHNcblx0JCgnI3BlcnNvbl9kZXRhaWxzIHNlbGVjdFtuYW1lJD1cIl9nZW5lX3Rlc3RcIl0nKS5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdGlmKCQodGhpcykudmFsKCkgIT09ICctJykge1xuXHRcdFx0bGV0IHRyZXMgPSAkKCdzZWxlY3RbbmFtZT1cIicrJCh0aGlzKS5hdHRyKCduYW1lJykrJ19yZXN1bHRcIl0nKTtcblx0XHRcdHBlcnNvblskKHRoaXMpLmF0dHIoJ25hbWUnKV0gPSB7J3R5cGUnOiAkKHRoaXMpLnZhbCgpLCAncmVzdWx0JzogJCh0cmVzKS52YWwoKX07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlbGV0ZSBwZXJzb25bJCh0aGlzKS5hdHRyKCduYW1lJyldO1xuXHRcdH1cblx0fSk7XG5cblx0dHJ5IHtcblx0XHQkKCcjcGVyc29uX2RldGFpbHMnKS5maW5kKCdmb3JtJykudmFsaWQoKTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRjb25zb2xlLndhcm4oJ3ZhbGlkKCkgbm90IGZvdW5kJyk7XG5cdH1cblxuXHRzeW5jVHdpbnMobmV3ZGF0YXNldCwgcGVyc29uKTtcblx0b3B0cy5kYXRhc2V0ID0gbmV3ZGF0YXNldDtcblx0cmVidWlsZChvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZV9kaWFnbm9zaXNfYWdlX3dpZGdldCgpIHtcblx0aWYoJChcIiNpZF9hcHByb3hcIikuaXMoJzpjaGVja2VkJykpIHtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLmVhY2goZnVuY3Rpb24oIF9pICkge1xuXHRcdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcblx0XHRcdFx0bGV0IG5hbWUgPSB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGgtMik7XG5cdFx0XHRcdCQoXCIjaWRfXCIrbmFtZStcIl8xXCIpLnZhbChyb3VuZDUoJCh0aGlzKS52YWwoKSkpLnByb3AoJ3NlbGVjdGVkJywgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMCddXCIpLmhpZGUoKTtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLnNob3coKTtcblx0fSBlbHNlIHtcblx0XHQkKFwiW2lkJD0nX2RpYWdub3Npc19hZ2VfMSddXCIpLmVhY2goZnVuY3Rpb24oIF9pICkge1xuXHRcdFx0aWYoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcblx0XHRcdFx0bGV0IG5hbWUgPSB0aGlzLm5hbWUuc3Vic3RyaW5nKDAsIHRoaXMubmFtZS5sZW5ndGgtMik7XG5cdFx0XHRcdCQoXCIjaWRfXCIrbmFtZStcIl8wXCIpLnZhbCgkKHRoaXMpLnZhbCgpKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCQoXCJbaWQkPSdfZGlhZ25vc2lzX2FnZV8wJ11cIikuc2hvdygpO1xuXHRcdCQoXCJbaWQkPSdfZGlhZ25vc2lzX2FnZV8xJ11cIikuaGlkZSgpO1xuXHR9XG59XG5cbi8vIG1hbGVzIHNob3VsZCBub3QgaGF2ZSBvdmFyaWFuIGNhbmNlciBhbmQgZmVtYWxlcyBzaG91bGQgbm90IGhhdmUgcHJvc3RhdGUgY2FuY2VyXG5mdW5jdGlvbiB1cGRhdGVfY2FuY2VyX2J5X3NleChub2RlKSB7XG5cdCQoJyNjYW5jZXIgLnJvdycpLnNob3coKTtcblx0aWYobm9kZS5zZXggPT09ICdNJykge1xuXHRcdGRlbGV0ZSBub2RlLm92YXJpYW5fY2FuY2VyX2RpYWdub3Npc19hZ2U7XG5cdFx0JChcIltpZF49J2lkX292YXJpYW5fY2FuY2VyX2RpYWdub3Npc19hZ2UnXVwiKS5jbG9zZXN0KCcucm93JykuaGlkZSgpO1xuXHRcdCQoXCJbaWRePSdpZF9icmVhc3RfY2FuY2VyMl9kaWFnbm9zaXNfYWdlJ11cIikucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcblx0fSBlbHNlIGlmKG5vZGUuc2V4ID09PSAnRicpIHtcblx0XHRkZWxldGUgbm9kZS5wcm9zdGF0ZV9jYW5jZXJfZGlhZ25vc2lzX2FnZTtcblx0XHQkKFwiW2lkXj0naWRfcHJvc3RhdGVfY2FuY2VyX2RpYWdub3Npc19hZ2UnXVwiKS5jbG9zZXN0KCcucm93JykuaGlkZSgpO1xuXHRcdCQoXCJbaWRePSdpZF9icmVhc3RfY2FuY2VyMl9kaWFnbm9zaXNfYWdlJ11cIikucHJvcCgnZGlzYWJsZWQnLCBmYWxzZSk7XG5cdH1cbn1cblxuLy8gcm91bmQgdG8gNSwgMTUsIDI1LCAzNSAuLi4uXG5mdW5jdGlvbiByb3VuZDUoeDEpIHtcblx0bGV0IHgyID0gKE1hdGgucm91bmQoKHgxLTEpIC8gMTApICogMTApO1xuXHRyZXR1cm4gKHgxIDwgeDIgPyB4MiAtIDUgOiB4MiArIDUpO1xufVxuXG4iLCIvLyBwZWRpZ3JlZSB3aWRnZXRzXG5pbXBvcnQge2FkZHNpYmxpbmcsIGFkZGNoaWxkLCBhZGRwYXJlbnRzLCBhZGRwYXJ0bmVyLCByZWJ1aWxkLCBkZWxldGVfbm9kZV9kYXRhc2V0fSBmcm9tICcuL3BlZGlncmVlLmpzJztcbmltcG9ydCB7Y29weV9kYXRhc2V0LCBtYWtlaWQsIGdldElkeEJ5TmFtZX0gZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5pbXBvcnQge3NhdmV9IGZyb20gJy4vcGVkaWdyZWVfZm9ybS5qcyc7XG5pbXBvcnQge2N1cnJlbnQgYXMgcGVkY2FjaGVfY3VycmVudH0gZnJvbSAnLi9wZWRjYWNoZS5qcyc7XG5cbmxldCBkcmFnZ2luZztcbmxldCBsYXN0X21vdXNlb3Zlcjtcbi8vXG4vLyBBZGQgd2lkZ2V0cyB0byBub2RlcyBhbmQgYmluZCBldmVudHNcbmV4cG9ydCBmdW5jdGlvbiBhZGRXaWRnZXRzKG9wdHMsIG5vZGUpIHtcblxuXHQvLyBwb3B1cCBnZW5kZXIgc2VsZWN0aW9uIGJveFxuXHRsZXQgZm9udF9zaXplID0gcGFyc2VJbnQoJChcImJvZHlcIikuY3NzKCdmb250LXNpemUnKSk7XG5cdGxldCBwb3B1cF9zZWxlY3Rpb24gPSBkMy5zZWxlY3QoJy5kaWFncmFtJyk7XG5cdHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvblwiKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcInJ4XCIsIDYpXG5cdFx0XHRcdFx0XHRcdC5hdHRyKFwicnlcIiwgNilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHRcdFx0XHRcdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcIndpZHRoXCIsICBmb250X3NpemUqNy45KVxuXHRcdFx0XHRcdFx0XHQuYXR0cihcImhlaWdodFwiLCBmb250X3NpemUqMilcblx0XHRcdFx0XHRcdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiZGFya2dyZXlcIilcblx0XHRcdFx0XHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwid2hpdGVcIik7XG5cblx0bGV0IHNxdWFyZSA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBtYWxlXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoJ2ZvbnQtc2l6ZScsICcxLmVtJyApXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS1zcXVhcmUgcGVyc29udHlwZVwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZS8zKVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjA5NiBcIik7XG5cdGxldCBzcXVhcmVfdGl0bGUgPSBzcXVhcmUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgbWFsZVwiKTtcblxuXHRsZXQgY2lyY2xlID0gcG9wdXBfc2VsZWN0aW9uLmFwcGVuZChcInRleHRcIikgIC8vIGZlbWFsZVxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtbGcgZmEtY2lyY2xlIHBlcnNvbnR5cGVcIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgtMTAwMCwtMTAwKVwiKVxuXHRcdC5hdHRyKFwieFwiLCBmb250X3NpemUqMS43KVxuXHRcdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHRcdC50ZXh0KFwiXFx1ZjEwYyBcIik7XG5cdGxldCBjaXJjbGVfdGl0bGUgPSBjaXJjbGUuYXBwZW5kKFwic3ZnOnRpdGxlXCIpLnRleHQoXCJhZGQgZmVtYWxlXCIpO1xuXG5cdGxldCB1bnNwZWNpZmllZCA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyB1bnNwZWNpZmllZFxuXHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0LnN0eWxlKFwib3BhY2l0eVwiLCAwKVxuXHRcdC5hdHRyKCdmb250LXNpemUnLCAnMS5lbScgKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBvcHVwX3NlbGVjdGlvbiBmYS1sZyBmYS11bnNwZWNpZmllZCBwb3B1cF9zZWxlY3Rpb25fcm90YXRlNDUgcGVyc29udHlwZVwiKVxuXHRcdC50ZXh0KFwiXFx1ZjA5NiBcIik7XG5cdHVuc3BlY2lmaWVkLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIHVuc3BlY2lmaWVkXCIpO1xuXG5cdGxldCBkenR3aW4gPSBwb3B1cF9zZWxlY3Rpb24uYXBwZW5kKFwidGV4dFwiKSAgLy8gZGl6eWdvdGljIHR3aW5zXG5cdFx0LmF0dHIoJ2ZvbnQtZmFtaWx5JywgJ0ZvbnRBd2Vzb21lJylcblx0XHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoLTEwMDAsLTEwMClcIilcblx0XHQuYXR0cihcImNsYXNzXCIsIFwicG9wdXBfc2VsZWN0aW9uIGZhLTJ4IGZhLWFuZ2xlLXVwIHBlcnNvbnR5cGUgZHp0d2luXCIpXG5cdFx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSo0LjYpXG5cdFx0LmF0dHIoXCJ5XCIsIGZvbnRfc2l6ZSoxLjUpXG5cdFx0LnRleHQoXCJcXHVmMTA2IFwiKTtcblx0ZHp0d2luLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiYWRkIGRpenlnb3RpYy9mcmF0ZXJuYWwgdHdpbnNcIik7XG5cblx0bGV0IG16dHdpbiA9IHBvcHVwX3NlbGVjdGlvbi5hcHBlbmQoXCJ0ZXh0XCIpICAvLyBtb25venlnb3RpYyB0d2luc1xuXHQuYXR0cignZm9udC1mYW1pbHknLCAnRm9udEF3ZXNvbWUnKVxuXHQuc3R5bGUoXCJvcGFjaXR5XCIsIDApXG5cdC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKC0xMDAwLC0xMDApXCIpXG5cdC5hdHRyKFwiY2xhc3NcIiwgXCJwb3B1cF9zZWxlY3Rpb24gZmEtMnggZmEtY2FyZXQtdXAgcGVyc29udHlwZSBtenR3aW5cIilcblx0LmF0dHIoXCJ4XCIsIGZvbnRfc2l6ZSo2LjIpXG5cdC5hdHRyKFwieVwiLCBmb250X3NpemUqMS41KVxuXHQudGV4dChcIlxcdWYwZDhcIik7XG5cdG16dHdpbi5hcHBlbmQoXCJzdmc6dGl0bGVcIikudGV4dChcImFkZCBtb25venlnb3RpYy9pZGVudGljYWwgdHdpbnNcIik7XG5cblx0bGV0IGFkZF9wZXJzb24gPSB7fTtcblx0Ly8gY2xpY2sgdGhlIHBlcnNvbiB0eXBlIHNlbGVjdGlvblxuXHRkMy5zZWxlY3RBbGwoXCIucGVyc29udHlwZVwiKVxuXHQgIC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRsZXQgbmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRsZXQgbXp0d2luID0gZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJtenR3aW5cIik7XG5cdFx0bGV0IGR6dHdpbiA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHp0d2luXCIpO1xuXHRcdGxldCB0d2luX3R5cGU7XG5cdFx0bGV0IHNleDtcblx0XHRpZihtenR3aW4gfHwgZHp0d2luKSB7XG5cdFx0XHRzZXggPSBhZGRfcGVyc29uLm5vZGUuZGF0dW0oKS5kYXRhLnNleDtcblx0XHRcdHR3aW5fdHlwZSA9IChtenR3aW4gPyBcIm16dHdpblwiIDogXCJkenR3aW5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNleCA9IGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtc3F1YXJlXCIpID8gJ00nIDogKGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZmEtY2lyY2xlXCIpID8gJ0YnIDogJ1UnKTtcblx0XHR9XG5cblx0XHRpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRzaWJsaW5nJylcblx0XHRcdGFkZHNpYmxpbmcobmV3ZGF0YXNldCwgYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkuZGF0YSwgc2V4LCBmYWxzZSwgdHdpbl90eXBlKTtcblx0XHRlbHNlIGlmKGFkZF9wZXJzb24udHlwZSA9PT0gJ2FkZGNoaWxkJylcblx0XHRcdGFkZGNoaWxkKG5ld2RhdGFzZXQsIGFkZF9wZXJzb24ubm9kZS5kYXR1bSgpLmRhdGEsICh0d2luX3R5cGUgPyAnVScgOiBzZXgpLCAodHdpbl90eXBlID8gMiA6IDEpLCB0d2luX3R5cGUpO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybjtcblx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0ZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGFkZF9wZXJzb24gPSB7fTtcblx0ICB9KVxuXHQgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbigpIHtcblx0XHQgIGlmKGFkZF9wZXJzb24ubm9kZSlcblx0XHRcdCAgYWRkX3BlcnNvbi5ub2RlLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwLjIpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdCAgLy8gYWRkIHRvb2x0aXBzIHRvIGZvbnQgYXdlc29tZSB3aWRnZXRzXG5cdFx0ICBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRzaWJsaW5nJyl7XG5cdFx0XHQgaWYoZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoXCJmYS1zcXVhcmVcIikpXG5cdFx0XHRcdCAgc3F1YXJlX3RpdGxlLnRleHQoXCJhZGQgYnJvdGhlclwiKTtcblx0XHRcdCAgZWxzZVxuXHRcdFx0XHQgIGNpcmNsZV90aXRsZS50ZXh0KFwiYWRkIHNpc3RlclwiKTtcblx0XHQgIH0gZWxzZSBpZihhZGRfcGVyc29uLnR5cGUgPT09ICdhZGRjaGlsZCcpe1xuXHRcdFx0ICBpZihkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImZhLXNxdWFyZVwiKSlcblx0XHRcdFx0ICBzcXVhcmVfdGl0bGUudGV4dChcImFkZCBzb25cIik7XG5cdFx0XHQgIGVsc2Vcblx0XHRcdFx0ICBjaXJjbGVfdGl0bGUudGV4dChcImFkZCBkYXVnaHRlclwiKTtcblx0XHQgIH1cblx0ICB9KTtcblxuXHQvLyBoYW5kbGUgbW91c2Ugb3V0IG9mIHBvcHVwIHNlbGVjdGlvblxuXHRkMy5zZWxlY3RBbGwoXCIucG9wdXBfc2VsZWN0aW9uXCIpLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24gKCkge1xuXHRcdC8vIGhpZGUgcmVjdCBhbmQgcG9wdXAgc2VsZWN0aW9uXG5cdFx0aWYoYWRkX3BlcnNvbi5ub2RlICE9PSB1bmRlZmluZWQgJiYgaGlnaGxpZ2h0LmluZGV4T2YoYWRkX3BlcnNvbi5ub2RlLmRhdHVtKCkpID09IC0xKVxuXHRcdFx0YWRkX3BlcnNvbi5ub2RlLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5wb3B1cF9zZWxlY3Rpb24nKS5zdHlsZShcIm9wYWNpdHlcIiwgMCk7XG5cdH0pO1xuXG5cblx0Ly8gZHJhZyBsaW5lIGJldHdlZW4gbm9kZXMgdG8gY3JlYXRlIHBhcnRuZXJzXG5cdGRyYWdfaGFuZGxlKG9wdHMpO1xuXG5cdC8vIHJlY3RhbmdsZSB1c2VkIHRvIGhpZ2hsaWdodCBvbiBtb3VzZSBvdmVyXG5cdG5vZGUuYXBwZW5kKFwicmVjdFwiKVxuXHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHQgICAgcmV0dXJuIGQuZGF0YS5oaWRkZW4gJiYgIW9wdHMuREVCVUcgPyBmYWxzZSA6IHRydWU7XG5cdFx0fSlcblx0XHQuYXR0cihcImNsYXNzXCIsICdpbmRpX3JlY3QnKVxuXHRcdC5hdHRyKFwicnhcIiwgNilcblx0XHQuYXR0cihcInJ5XCIsIDYpXG5cdFx0LmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKF9kKSB7IHJldHVybiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZTsgfSlcblx0XHQuYXR0cihcInlcIiwgZnVuY3Rpb24oX2QpIHsgcmV0dXJuIC0gb3B0cy5zeW1ib2xfc2l6ZTsgfSlcblx0XHQuYXR0cihcIndpZHRoXCIsICAoMS41ICogb3B0cy5zeW1ib2xfc2l6ZSkrJ3B4Jylcblx0XHQuYXR0cihcImhlaWdodFwiLCAoMiAqIG9wdHMuc3ltYm9sX3NpemUpKydweCcpXG5cdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMC43KVxuXHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHQuYXR0cihcImZpbGxcIiwgXCJsaWdodGdyZXlcIik7XG5cblx0Ly8gd2lkZ2V0c1xuXHRsZXQgZnggPSBmdW5jdGlvbihfZCkge3JldHVybiBvZmYgLSAwLjc1Km9wdHMuc3ltYm9sX3NpemU7fTtcblx0bGV0IGZ5ID0gb3B0cy5zeW1ib2xfc2l6ZSAtMjtcblx0bGV0IG9mZiA9IDA7XG5cdGxldCB3aWRnZXRzID0ge1xuXHRcdCdhZGRjaGlsZCc6ICAgeyd0ZXh0JzogJ1xcdWYwNjMnLCAndGl0bGUnOiAnYWRkIGNoaWxkJywgICAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRzaWJsaW5nJzogeyd0ZXh0JzogJ1xcdWYyMzQnLCAndGl0bGUnOiAnYWRkIHNpYmxpbmcnLCAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRwYXJ0bmVyJzogeyd0ZXh0JzogJ1xcdWYwYzEnLCAndGl0bGUnOiAnYWRkIHBhcnRuZXInLCAnZngnOiBmeCwgJ2Z5JzogZnl9LFxuXHRcdCdhZGRwYXJlbnRzJzoge1xuXHRcdFx0J3RleHQnOiAnXFx1ZjA2MicsICd0aXRsZSc6ICdhZGQgcGFyZW50cycsXG5cdFx0XHQnZngnOiAtIDAuNzUqb3B0cy5zeW1ib2xfc2l6ZSxcblx0XHRcdCdmeSc6IC0gb3B0cy5zeW1ib2xfc2l6ZSArIDExXG5cdFx0fSxcblx0XHQnZGVsZXRlJzoge1xuXHRcdFx0J3RleHQnOiAnWCcsICd0aXRsZSc6ICdkZWxldGUnLFxuXHRcdFx0J2Z4Jzogb3B0cy5zeW1ib2xfc2l6ZS8yIC0gMSxcblx0XHRcdCdmeSc6IC0gb3B0cy5zeW1ib2xfc2l6ZSArIDEyLFxuXHRcdFx0J3N0eWxlcyc6IHtcImZvbnQtd2VpZ2h0XCI6IFwiYm9sZFwiLCBcImZpbGxcIjogXCJkYXJrcmVkXCIsIFwiZm9udC1mYW1pbHlcIjogXCJtb25vc3BhY2VcIn1cblx0XHR9XG5cdH07XG5cblx0aWYob3B0cy5lZGl0KSB7XG5cdFx0d2lkZ2V0cy5zZXR0aW5ncyA9IHsndGV4dCc6ICdcXHVmMDEzJywgJ3RpdGxlJzogJ3NldHRpbmdzJywgJ2Z4JzogLWZvbnRfc2l6ZS8yKzIsICdmeSc6IC1vcHRzLnN5bWJvbF9zaXplICsgMTF9O1xuXHR9XG5cblx0Zm9yKGxldCBrZXkgaW4gd2lkZ2V0cykge1xuXHRcdGxldCB3aWRnZXQgPSBub2RlLmFwcGVuZChcInRleHRcIilcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmV0dXJuICAoZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyA/IGZhbHNlIDogdHJ1ZSkgJiZcblx0XHRcdFx0XHRcdCEoKGQuZGF0YS5tb3RoZXIgPT09IHVuZGVmaW5lZCB8fCBkLmRhdGEubm9wYXJlbnRzKSAmJiBrZXkgPT09ICdhZGRzaWJsaW5nJykgJiZcblx0XHRcdFx0XHRcdCEoZC5kYXRhLnBhcmVudF9ub2RlICE9PSB1bmRlZmluZWQgJiYgZC5kYXRhLnBhcmVudF9ub2RlLmxlbmd0aCA+IDEgJiYga2V5ID09PSAnYWRkcGFydG5lcicpICYmXG5cdFx0XHRcdFx0XHQhKGQuZGF0YS5wYXJlbnRfbm9kZSA9PT0gdW5kZWZpbmVkICYmIGtleSA9PT0gJ2FkZGNoaWxkJykgJiZcblx0XHRcdFx0XHRcdCEoKGQuZGF0YS5ub3BhcmVudHMgPT09IHVuZGVmaW5lZCAmJiBkLmRhdGEudG9wX2xldmVsID09PSB1bmRlZmluZWQpICYmIGtleSA9PT0gJ2FkZHBhcmVudHMnKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImNsYXNzXCIsIGtleSlcblx0XHRcdC5zdHlsZShcIm9wYWNpdHlcIiwgMClcblx0XHRcdC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG5cdFx0XHQuYXR0cihcInh4XCIsIGZ1bmN0aW9uKGQpe3JldHVybiBkLng7fSlcblx0XHRcdC5hdHRyKFwieXlcIiwgZnVuY3Rpb24oZCl7cmV0dXJuIGQueTt9KVxuXHRcdFx0LmF0dHIoXCJ4XCIsIHdpZGdldHNba2V5XS5meClcblx0XHRcdC5hdHRyKFwieVwiLCB3aWRnZXRzW2tleV0uZnkpXG5cdFx0XHQuYXR0cignZm9udC1zaXplJywgJzAuOWVtJyApXG5cdFx0XHQudGV4dCh3aWRnZXRzW2tleV0udGV4dCk7XG5cblx0XHRpZignc3R5bGVzJyBpbiB3aWRnZXRzW2tleV0pXG5cdFx0XHRmb3IobGV0IHN0eWxlIGluIHdpZGdldHNba2V5XS5zdHlsZXMpe1xuXHRcdFx0XHR3aWRnZXQuYXR0cihzdHlsZSwgd2lkZ2V0c1trZXldLnN0eWxlc1tzdHlsZV0pO1xuXHRcdFx0fVxuXG5cdFx0d2lkZ2V0LmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KHdpZGdldHNba2V5XS50aXRsZSk7XG5cdFx0b2ZmICs9IDE3O1xuXHR9XG5cblx0Ly8gYWRkIHNpYmxpbmcgb3IgY2hpbGRcblx0ZDMuc2VsZWN0QWxsKFwiLmFkZHNpYmxpbmcsIC5hZGRjaGlsZFwiKVxuXHQgIC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbiAoKSB7XG5cdFx0ICBsZXQgdHlwZSA9IGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdCAgYWRkX3BlcnNvbiA9IHsnbm9kZSc6IGQzLnNlbGVjdCh0aGlzLnBhcmVudE5vZGUpLCAndHlwZSc6IHR5cGV9O1xuXG5cdFx0ICAvL2xldCB0cmFuc2xhdGUgPSBnZXRUcmFuc2xhdGlvbihkMy5zZWxlY3QoJy5kaWFncmFtJykuYXR0cihcInRyYW5zZm9ybVwiKSk7XG5cdFx0ICBsZXQgeCA9IHBhcnNlSW50KGQzLnNlbGVjdCh0aGlzKS5hdHRyKFwieHhcIikpICsgcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ4XCIpKTtcblx0XHQgIGxldCB5ID0gcGFyc2VJbnQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJ5eVwiKSkgKyBwYXJzZUludChkMy5zZWxlY3QodGhpcykuYXR0cihcInlcIikpO1xuXHRcdCAgZDMuc2VsZWN0QWxsKCcucG9wdXBfc2VsZWN0aW9uJykuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4K1wiLFwiKyh5KzIpK1wiKVwiKTtcblx0XHQgIGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbl9yb3RhdGU0NScpXG5cdFx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIisoeCszKmZvbnRfc2l6ZSkrXCIsXCIrKHkrKGZvbnRfc2l6ZSoxLjIpKStcIikgcm90YXRlKDQ1KVwiKTtcblx0ICB9KTtcblxuXHQvLyBoYW5kbGUgd2lkZ2V0IGNsaWNrc1xuXHRkMy5zZWxlY3RBbGwoXCIuYWRkY2hpbGQsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzXCIpXG5cdCAgLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0bGV0IG9wdCA9IGQzLnNlbGVjdCh0aGlzKS5hdHRyKCdjbGFzcycpO1xuXHRcdGxldCBkID0gZDMuc2VsZWN0KHRoaXMucGFyZW50Tm9kZSkuZGF0dW0oKTtcblx0XHRpZihvcHRzLkRFQlVHKSB7XG5cdFx0XHRjb25zb2xlLmxvZyhvcHQpO1xuXHRcdH1cblxuXHRcdGxldCBuZXdkYXRhc2V0O1xuXHRcdGlmKG9wdCA9PT0gJ3NldHRpbmdzJykge1xuXHRcdFx0aWYodHlwZW9mIG9wdHMuZWRpdCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRvcHRzLmVkaXQob3B0cywgZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvcGVuRWRpdERpYWxvZyhvcHRzLCBkKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYob3B0ID09PSAnZGVsZXRlJykge1xuXHRcdFx0bmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRcdGRlbGV0ZV9ub2RlX2RhdGFzZXQobmV3ZGF0YXNldCwgZC5kYXRhLCBvcHRzLCBvbkRvbmUpO1xuXHRcdH0gZWxzZSBpZihvcHQgPT09ICdhZGRwYXJlbnRzJykge1xuXHRcdFx0bmV3ZGF0YXNldCA9IGNvcHlfZGF0YXNldChwZWRjYWNoZV9jdXJyZW50KG9wdHMpKTtcblx0XHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cdFx0XHRhZGRwYXJlbnRzKG9wdHMsIG5ld2RhdGFzZXQsIGQuZGF0YS5uYW1lKTtcblx0XHRcdHJlYnVpbGQob3B0cyk7XG5cdFx0fSBlbHNlIGlmKG9wdCA9PT0gJ2FkZHBhcnRuZXInKSB7XG5cdFx0XHRuZXdkYXRhc2V0ID0gY29weV9kYXRhc2V0KHBlZGNhY2hlX2N1cnJlbnQob3B0cykpO1xuXHRcdFx0YWRkcGFydG5lcihvcHRzLCBuZXdkYXRhc2V0LCBkLmRhdGEubmFtZSk7XG5cdFx0XHRvcHRzLmRhdGFzZXQgPSBuZXdkYXRhc2V0O1xuXHRcdFx0cmVidWlsZChvcHRzKTtcblx0XHR9XG5cdFx0Ly8gdHJpZ2dlciBmaENoYW5nZSBldmVudFxuXHRcdCQoZG9jdW1lbnQpLnRyaWdnZXIoJ2ZoQ2hhbmdlJywgW29wdHNdKTtcblx0fSk7XG5cblx0Ly8gb3RoZXIgbW91c2UgZXZlbnRzXG5cdGxldCBoaWdobGlnaHQgPSBbXTtcblxuXHRub2RlLmZpbHRlcihmdW5jdGlvbiAoZCkgeyByZXR1cm4gIWQuZGF0YS5oaWRkZW47IH0pXG5cdC5vbihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCwgZCkge1xuXHRcdGlmIChldmVudC5jdHJsS2V5KSB7XG5cdFx0XHRpZihoaWdobGlnaHQuaW5kZXhPZihkKSA9PSAtMSlcblx0XHRcdFx0aGlnaGxpZ2h0LnB1c2goZCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdGhpZ2hsaWdodC5zcGxpY2UoaGlnaGxpZ2h0LmluZGV4T2YoZCksIDEpO1xuXHRcdH0gZWxzZVxuXHRcdFx0aGlnaGxpZ2h0ID0gW2RdO1xuXG5cdFx0aWYoJ25vZGVjbGljaycgaW4gb3B0cykge1xuXHRcdFx0b3B0cy5ub2RlY2xpY2soZC5kYXRhKTtcblx0XHRcdGQzLnNlbGVjdEFsbChcIi5pbmRpX3JlY3RcIikuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdFx0ZDMuc2VsZWN0QWxsKCcuaW5kaV9yZWN0JykuZmlsdGVyKGZ1bmN0aW9uKGQpIHtyZXR1cm4gaGlnaGxpZ2h0LmluZGV4T2YoZCkgIT0gLTE7fSkuc3R5bGUoXCJvcGFjaXR5XCIsIDAuNSk7XG5cdFx0fVxuXHR9KVxuXHQub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZXZlbnQsIGQpe1xuXHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGxhc3RfbW91c2VvdmVyID0gZDtcblx0XHRpZihkcmFnZ2luZykge1xuXHRcdFx0aWYoZHJhZ2dpbmcuZGF0YS5uYW1lICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLm5hbWUgJiZcblx0XHRcdCAgIGRyYWdnaW5nLmRhdGEuc2V4ICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLnNleCkge1xuXHRcdFx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0KCdyZWN0Jykuc3R5bGUoXCJvcGFjaXR5XCIsIDAuMik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3QoJ3JlY3QnKS5zdHlsZShcIm9wYWNpdHlcIiwgMC4yKTtcblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuYWRkY2hpbGQsIC5hZGRzaWJsaW5nLCAuYWRkcGFydG5lciwgLmFkZHBhcmVudHMsIC5kZWxldGUsIC5zZXR0aW5ncycpLnN0eWxlKFwib3BhY2l0eVwiLCAxKTtcblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuaW5kaV9kZXRhaWxzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdHNldExpbmVEcmFnUG9zaXRpb24ob3B0cy5zeW1ib2xfc2l6ZS0xMCwgMCwgb3B0cy5zeW1ib2xfc2l6ZS0yLCAwLCBkLngrXCIsXCIrKGQueSsyKSk7XG5cdH0pXG5cdC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGV2ZW50LCBkKXtcblx0XHRpZihkcmFnZ2luZylcblx0XHRcdHJldHVybjtcblxuXHRcdGQzLnNlbGVjdCh0aGlzKS5zZWxlY3RBbGwoJy5hZGRjaGlsZCwgLmFkZHNpYmxpbmcsIC5hZGRwYXJ0bmVyLCAuYWRkcGFyZW50cywgLmRlbGV0ZSwgLnNldHRpbmdzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDApO1xuXHRcdGlmKGhpZ2hsaWdodC5pbmRleE9mKGQpID09IC0xKVxuXHRcdFx0ZDMuc2VsZWN0KHRoaXMpLnNlbGVjdCgncmVjdCcpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRkMy5zZWxlY3QodGhpcykuc2VsZWN0QWxsKCcuaW5kaV9kZXRhaWxzJykuc3R5bGUoXCJvcGFjaXR5XCIsIDEpO1xuXHRcdC8vIGhpZGUgcG9wdXAgaWYgaXQgbG9va3MgbGlrZSB0aGUgbW91c2UgaXMgbW92aW5nIG5vcnRoXG5cdFx0bGV0IHhjb29yZCA9IGQzLnBvaW50ZXIoZXZlbnQpWzBdO1xuXHRcdGxldCB5Y29vcmQgPSBkMy5wb2ludGVyKGV2ZW50KVsxXTtcblx0XHRpZih5Y29vcmQgPCAwLjgqb3B0cy5zeW1ib2xfc2l6ZSlcblx0XHRcdGQzLnNlbGVjdEFsbCgnLnBvcHVwX3NlbGVjdGlvbicpLnN0eWxlKFwib3BhY2l0eVwiLCAwKTtcblx0XHRpZighZHJhZ2dpbmcpIHtcblx0XHRcdC8vIGhpZGUgcG9wdXAgaWYgaXQgbG9va3MgbGlrZSB0aGUgbW91c2UgaXMgbW92aW5nIG5vcnRoLCBzb3V0aCBvciB3ZXN0XG5cdFx0XHRpZiggTWF0aC5hYnMoeWNvb3JkKSA+IDAuMjUqb3B0cy5zeW1ib2xfc2l6ZSB8fFxuXHRcdFx0XHRNYXRoLmFicyh5Y29vcmQpIDwgLTAuMjUqb3B0cy5zeW1ib2xfc2l6ZSB8fFxuXHRcdFx0XHR4Y29vcmQgPCAwLjIqb3B0cy5zeW1ib2xfc2l6ZSl7XG5cdFx0XHRcdFx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblx0XHRcdH1cbiAgICAgICAgfVxuXHR9KTtcbn1cblxuZnVuY3Rpb24gb25Eb25lKG9wdHMsIGRhdGFzZXQpIHtcblx0Ly8gYXNzaWduIG5ldyBkYXRhc2V0IGFuZCByZWJ1aWxkIHBlZGlncmVlXG5cdG9wdHMuZGF0YXNldCA9IGRhdGFzZXQ7XG5cdHJlYnVpbGQob3B0cyk7XG59XG5cbi8vIGRyYWcgbGluZSBiZXR3ZWVuIG5vZGVzIHRvIGNyZWF0ZSBwYXJ0bmVyc1xuZnVuY3Rpb24gZHJhZ19oYW5kbGUob3B0cykge1xuXHRsZXQgbGluZV9kcmFnX3NlbGVjdGlvbiA9IGQzLnNlbGVjdCgnLmRpYWdyYW0nKTtcblx0bGV0IGRsaW5lID0gbGluZV9kcmFnX3NlbGVjdGlvbi5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCAnbGluZV9kcmFnX3NlbGVjdGlvbicpXG4gICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDYpXG4gICAgICAgIC5zdHlsZShcInN0cm9rZS1kYXNoYXJyYXlcIiwgKFwiMiwgMVwiKSlcbiAgICAgICAgLmF0dHIoXCJzdHJva2VcIixcImJsYWNrXCIpXG4gICAgICAgIC5jYWxsKGQzLmRyYWcoKVxuICAgICAgICAgICAgICAgIC5vbihcInN0YXJ0XCIsIGRyYWdzdGFydClcbiAgICAgICAgICAgICAgICAub24oXCJkcmFnXCIsIGRyYWcpXG4gICAgICAgICAgICAgICAgLm9uKFwiZW5kXCIsIGRyYWdzdG9wKSk7XG5cdGRsaW5lLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiZHJhZyB0byBjcmVhdGUgY29uc2FuZ3VpbmVvdXMgcGFydG5lcnNcIik7XG5cblx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblxuXHRmdW5jdGlvbiBkcmFnc3RhcnQoKSB7XG5cdFx0ZHJhZ2dpbmcgPSBsYXN0X21vdXNlb3Zlcjtcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsXCJkYXJrcmVkXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZHJhZ3N0b3AoX2QpIHtcblx0XHRpZihsYXN0X21vdXNlb3ZlciAmJlxuXHRcdCAgIGRyYWdnaW5nLmRhdGEubmFtZSAhPT0gbGFzdF9tb3VzZW92ZXIuZGF0YS5uYW1lICYmXG5cdFx0ICAgZHJhZ2dpbmcuZGF0YS5zZXggICE9PSBsYXN0X21vdXNlb3Zlci5kYXRhLnNleCkge1xuXHRcdFx0Ly8gbWFrZSBwYXJ0bmVyc1xuXHRcdFx0bGV0IGNoaWxkID0ge1wibmFtZVwiOiBtYWtlaWQoNCksIFwic2V4XCI6ICdVJyxcblx0XHRcdFx0ICAgICBcIm1vdGhlclwiOiAoZHJhZ2dpbmcuZGF0YS5zZXggPT09ICdGJyA/IGRyYWdnaW5nLmRhdGEubmFtZSA6IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSksXG5cdFx0XHQgICAgICAgICBcImZhdGhlclwiOiAoZHJhZ2dpbmcuZGF0YS5zZXggPT09ICdGJyA/IGxhc3RfbW91c2VvdmVyLmRhdGEubmFtZSA6IGRyYWdnaW5nLmRhdGEubmFtZSl9O1xuXHRcdFx0bGV0IG5ld2RhdGFzZXQgPSBjb3B5X2RhdGFzZXQob3B0cy5kYXRhc2V0KTtcblx0XHRcdG9wdHMuZGF0YXNldCA9IG5ld2RhdGFzZXQ7XG5cblx0XHRcdGxldCBpZHggPSBnZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBkcmFnZ2luZy5kYXRhLm5hbWUpKzE7XG5cdFx0XHRvcHRzLmRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xuXHRcdFx0cmVidWlsZChvcHRzKTtcblx0XHR9XG5cdFx0c2V0TGluZURyYWdQb3NpdGlvbigwLCAwLCAwLCAwKTtcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsXCJibGFja1wiKTtcblx0XHRkcmFnZ2luZyA9IHVuZGVmaW5lZDtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRmdW5jdGlvbiBkcmFnKGV2ZW50LCBfZCkge1xuXHRcdGV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdGxldCBkeCA9IGV2ZW50LmR4O1xuXHRcdGxldCBkeSA9IGV2ZW50LmR5O1xuICAgICAgICBsZXQgeG5ldyA9IHBhcnNlRmxvYXQoZDMuc2VsZWN0KHRoaXMpLmF0dHIoJ3gyJykpKyBkeDtcbiAgICAgICAgbGV0IHluZXcgPSBwYXJzZUZsb2F0KGQzLnNlbGVjdCh0aGlzKS5hdHRyKCd5MicpKSsgZHk7XG4gICAgICAgIHNldExpbmVEcmFnUG9zaXRpb24ob3B0cy5zeW1ib2xfc2l6ZS0xMCwgMCwgeG5ldywgeW5ldyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0TGluZURyYWdQb3NpdGlvbih4MSwgeTEsIHgyLCB5MiwgdHJhbnNsYXRlKSB7XG5cdGlmKHRyYW5zbGF0ZSlcblx0XHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJykuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit0cmFuc2xhdGUrXCIpXCIpO1xuXHRkMy5zZWxlY3RBbGwoJy5saW5lX2RyYWdfc2VsZWN0aW9uJylcblx0XHQuYXR0cihcIngxXCIsIHgxKVxuXHRcdC5hdHRyKFwieTFcIiwgeTEpXG5cdFx0LmF0dHIoXCJ4MlwiLCB4Milcblx0XHQuYXR0cihcInkyXCIsIHkyKTtcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGlzZUZpcnN0TGV0dGVyKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHJpbmcuc2xpY2UoMSk7XG59XG5cbi8vIGlmIG9wdC5lZGl0IGlzIHNldCB0cnVlIChyYXRoZXIgdGhhbiBnaXZlbiBhIGZ1bmN0aW9uKSB0aGlzIGlzIGNhbGxlZCB0byBlZGl0IG5vZGUgYXR0cmlidXRlc1xuZnVuY3Rpb24gb3BlbkVkaXREaWFsb2cob3B0cywgZCkge1xuXHQkKCcjbm9kZV9wcm9wZXJ0aWVzJykuZGlhbG9nKHtcblx0ICAgIGF1dG9PcGVuOiBmYWxzZSxcblx0ICAgIHRpdGxlOiBkLmRhdGEuZGlzcGxheV9uYW1lLFxuXHQgICAgd2lkdGg6ICgkKHdpbmRvdykud2lkdGgoKSA+IDQwMCA/IDQ1MCA6ICQod2luZG93KS53aWR0aCgpLSAzMClcblx0fSk7XG5cblx0bGV0IHRhYmxlID0gXCI8dGFibGUgaWQ9J3BlcnNvbl9kZXRhaWxzJyBjbGFzcz0ndGFibGUnPlwiO1xuXG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+VW5pcXVlIElEPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J3RleHQnIGlkPSdpZF9uYW1lJyBuYW1lPSduYW1lJyB2YWx1ZT1cIitcblx0KGQuZGF0YS5uYW1lID8gZC5kYXRhLm5hbWUgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+TmFtZTwvdGQ+PHRkPjxpbnB1dCBjbGFzcz0nZm9ybS1jb250cm9sJyB0eXBlPSd0ZXh0JyBpZD0naWRfZGlzcGxheV9uYW1lJyBuYW1lPSdkaXNwbGF5X25hbWUnIHZhbHVlPVwiK1xuXHRcdFx0KGQuZGF0YS5kaXNwbGF5X25hbWUgPyBkLmRhdGEuZGlzcGxheV9uYW1lIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXG5cdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+QWdlPC90ZD48dGQ+PGlucHV0IGNsYXNzPSdmb3JtLWNvbnRyb2wnIHR5cGU9J251bWJlcicgaWQ9J2lkX2FnZScgbWluPScwJyBtYXg9JzEyMCcgbmFtZT0nYWdlJyBzdHlsZT0nd2lkdGg6N2VtJyB2YWx1ZT1cIitcblx0XHRcdChkLmRhdGEuYWdlID8gZC5kYXRhLmFnZSA6IFwiXCIpK1wiPjwvdGQ+PC90cj5cIjtcblxuXHR0YWJsZSArPSBcIjx0cj48dGQgc3R5bGU9J3RleHQtYWxpZ246cmlnaHQnPlllYXIgT2YgQmlydGg8L3RkPjx0ZD48aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgdHlwZT0nbnVtYmVyJyBpZD0naWRfeW9iJyBtaW49JzE5MDAnIG1heD0nMjA1MCcgbmFtZT0neW9iJyBzdHlsZT0nd2lkdGg6N2VtJyB2YWx1ZT1cIitcblx0XHQoZC5kYXRhLnlvYiA/IGQuZGF0YS55b2IgOiBcIlwiKStcIj48L3RkPjwvdHI+XCI7XG5cblx0dGFibGUgKz0gJzx0cj48dGQgY29sc3Bhbj1cIjJcIiBpZD1cImlkX3NleFwiPicgK1xuXHRcdFx0ICc8bGFiZWwgY2xhc3M9XCJyYWRpby1pbmxpbmVcIj48aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNleFwiIHZhbHVlPVwiTVwiICcrKGQuZGF0YS5zZXggPT09ICdNJyA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz5NYWxlPC9sYWJlbD4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwicmFkaW8taW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzZXhcIiB2YWx1ZT1cIkZcIiAnKyhkLmRhdGEuc2V4ID09PSAnRicgPyBcImNoZWNrZWRcIiA6IFwiXCIpKyc+RmVtYWxlPC9sYWJlbD4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwicmFkaW8taW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzZXhcIiB2YWx1ZT1cIlVcIj5Vbmtub3duPC9sYWJlbD4nICtcblx0XHRcdCAnPC90ZD48L3RyPic7XG5cblx0Ly8gYWxpdmUgc3RhdHVzID0gMDsgZGVhZCBzdGF0dXMgPSAxXG5cdHRhYmxlICs9ICc8dHI+PHRkIGNvbHNwYW49XCIyXCIgaWQ9XCJpZF9zdGF0dXNcIj4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtaW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzdGF0dXNcIiB2YWx1ZT1cIjBcIiAnKyhwYXJzZUludChkLmRhdGEuc3RhdHVzKSA9PT0gMCA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz4mdGhpbnNwO0FsaXZlPC9sYWJlbD4nICtcblx0XHRcdCAnPGxhYmVsIGNsYXNzPVwiY2hlY2tib3gtaW5saW5lXCI+PGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzdGF0dXNcIiB2YWx1ZT1cIjFcIiAnKyhwYXJzZUludChkLmRhdGEuc3RhdHVzKSA9PT0gMSA/IFwiY2hlY2tlZFwiIDogXCJcIikrJz4mdGhpbnNwO0RlY2Vhc2VkPC9sYWJlbD4nICtcblx0XHRcdCAnPC90ZD48L3RyPic7XG5cdCQoXCIjaWRfc3RhdHVzIGlucHV0W3ZhbHVlPSdcIitkLmRhdGEuc3RhdHVzK1wiJ11cIikucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuXG5cdC8vIHN3aXRjaGVzXG5cdGxldCBzd2l0Y2hlcyA9IFtcImFkb3B0ZWRfaW5cIiwgXCJhZG9wdGVkX291dFwiLCBcIm1pc2NhcnJpYWdlXCIsIFwic3RpbGxiaXJ0aFwiLCBcInRlcm1pbmF0aW9uXCJdO1xuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiPjxzdHJvbmc+UmVwcm9kdWN0aW9uOjwvc3Ryb25nPjwvdGQ+PC90cj4nO1xuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiPic7XG5cdGZvcihsZXQgaXN3aXRjaD0wOyBpc3dpdGNoPHN3aXRjaGVzLmxlbmd0aDsgaXN3aXRjaCsrKXtcblx0XHRsZXQgYXR0ciA9IHN3aXRjaGVzW2lzd2l0Y2hdO1xuXHRcdGlmKGlzd2l0Y2ggPT09IDIpXG5cdFx0XHR0YWJsZSArPSAnPC90ZD48L3RyPjx0cj48dGQgY29sc3Bhbj1cIjJcIj4nO1xuXHRcdHRhYmxlICs9XG5cdFx0ICc8bGFiZWwgY2xhc3M9XCJjaGVja2JveC1pbmxpbmVcIj48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJpZF8nK2F0dHIgK1xuXHRcdCAgICAnXCIgbmFtZT1cIicrYXR0cisnXCIgdmFsdWU9XCIwXCIgJysoZC5kYXRhW2F0dHJdID8gXCJjaGVja2VkXCIgOiBcIlwiKSsnPiZ0aGluc3A7JyArXG5cdFx0ICAgIGNhcGl0YWxpc2VGaXJzdExldHRlcihhdHRyLnJlcGxhY2UoJ18nLCAnICcpKSsnPC9sYWJlbD4nXG5cdH1cblx0dGFibGUgKz0gJzwvdGQ+PC90cj4nO1xuXG5cdC8vXG5cdGxldCBleGNsdWRlID0gW1wiY2hpbGRyZW5cIiwgXCJuYW1lXCIsIFwicGFyZW50X25vZGVcIiwgXCJ0b3BfbGV2ZWxcIiwgXCJpZFwiLCBcIm5vcGFyZW50c1wiLFxuXHRcdCAgICAgICAgICAgXCJsZXZlbFwiLCBcImFnZVwiLCBcInNleFwiLCBcInN0YXR1c1wiLCBcImRpc3BsYXlfbmFtZVwiLCBcIm1vdGhlclwiLCBcImZhdGhlclwiLFxuXHRcdCAgICAgICAgICAgXCJ5b2JcIiwgXCJtenR3aW5cIiwgXCJkenR3aW5cIl07XG5cdCQubWVyZ2UoZXhjbHVkZSwgc3dpdGNoZXMpO1xuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiPjxzdHJvbmc+QWdlIG9mIERpYWdub3Npczo8L3N0cm9uZz48L3RkPjwvdHI+Jztcblx0JC5lYWNoKG9wdHMuZGlzZWFzZXMsIGZ1bmN0aW9uKGssIHYpIHtcblx0XHRleGNsdWRlLnB1c2godi50eXBlK1wiX2RpYWdub3Npc19hZ2VcIik7XG5cblx0XHRsZXQgZGlzZWFzZV9jb2xvdXIgPSAnJnRoaW5zcDs8c3BhbiBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHg7YmFja2dyb3VuZDonK29wdHMuZGlzZWFzZXNba10uY29sb3VyKydcIj48L3NwYW4+Jztcblx0XHRsZXQgZGlhZ25vc2lzX2FnZSA9IGQuZGF0YVt2LnR5cGUgKyBcIl9kaWFnbm9zaXNfYWdlXCJdO1xuXG5cdFx0dGFibGUgKz0gXCI8dHI+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOnJpZ2h0Jz5cIitjYXBpdGFsaXNlRmlyc3RMZXR0ZXIodi50eXBlLnJlcGxhY2UoXCJfXCIsIFwiIFwiKSkrXG5cdFx0XHRcdFx0ZGlzZWFzZV9jb2xvdXIrXCImbmJzcDs8L3RkPjx0ZD5cIiArXG5cdFx0XHRcdFx0XCI8aW5wdXQgY2xhc3M9J2Zvcm0tY29udHJvbCcgaWQ9J2lkX1wiICtcblx0XHRcdFx0XHR2LnR5cGUgKyBcIl9kaWFnbm9zaXNfYWdlXzAnIG1heD0nMTEwJyBtaW49JzAnIG5hbWU9J1wiICtcblx0XHRcdFx0XHR2LnR5cGUgKyBcIl9kaWFnbm9zaXNfYWdlXzAnIHN0eWxlPSd3aWR0aDo1ZW0nIHR5cGU9J251bWJlcicgdmFsdWU9J1wiICtcblx0XHRcdFx0XHQoZGlhZ25vc2lzX2FnZSAhPT0gdW5kZWZpbmVkID8gZGlhZ25vc2lzX2FnZSA6IFwiXCIpICtcIic+PC90ZD48L3RyPlwiO1xuXHR9KTtcblxuXHR0YWJsZSArPSAnPHRyPjx0ZCBjb2xzcGFuPVwiMlwiIHN0eWxlPVwibGluZS1oZWlnaHQ6MXB4O1wiPjwvdGQ+PC90cj4nO1xuXHQkLmVhY2goZC5kYXRhLCBmdW5jdGlvbihrLCB2KSB7XG5cdFx0aWYoJC5pbkFycmF5KGssIGV4Y2x1ZGUpID09IC0xKSB7XG5cdFx0XHRsZXQga2sgPSBjYXBpdGFsaXNlRmlyc3RMZXR0ZXIoayk7XG5cdFx0XHRpZih2ID09PSB0cnVlIHx8IHYgPT09IGZhbHNlKSB7XG5cdFx0XHRcdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+XCIra2srXCImbmJzcDs8L3RkPjx0ZD48aW5wdXQgdHlwZT0nY2hlY2tib3gnIGlkPSdpZF9cIiArIGsgKyBcIicgbmFtZT0nXCIgK1xuXHRcdFx0XHRcdFx0aytcIicgdmFsdWU9XCIrditcIiBcIisodiA/IFwiY2hlY2tlZFwiIDogXCJcIikrXCI+PC90ZD48L3RyPlwiO1xuXHRcdFx0fSBlbHNlIGlmKGsubGVuZ3RoID4gMCl7XG5cdFx0XHRcdHRhYmxlICs9IFwiPHRyPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpyaWdodCc+XCIra2srXCImbmJzcDs8L3RkPjx0ZD48aW5wdXQgdHlwZT0ndGV4dCcgaWQ9J2lkX1wiICtcblx0XHRcdFx0XHRcdGsrXCInIG5hbWU9J1wiK2srXCInIHZhbHVlPVwiK3YrXCI+PC90ZD48L3RyPlwiO1xuXHRcdFx0fVxuXHRcdH1cbiAgICB9KTtcblx0dGFibGUgKz0gXCI8L3RhYmxlPlwiO1xuXG5cdCQoJyNub2RlX3Byb3BlcnRpZXMnKS5odG1sKHRhYmxlKTtcblx0JCgnI25vZGVfcHJvcGVydGllcycpLmRpYWxvZygnb3BlbicpO1xuXG5cdCQoJyNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1yYWRpb10sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT1jaGVja2JveF0sICNub2RlX3Byb3BlcnRpZXMgaW5wdXRbdHlwZT10ZXh0XSwgI25vZGVfcHJvcGVydGllcyBpbnB1dFt0eXBlPW51bWJlcl0nKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG5cdFx0c2F2ZShvcHRzKTtcbiAgICB9KTtcblx0cmV0dXJuO1xufVxuIiwiLy8gUGVkaWdyZWUgVHJlZSBCdWlsZGVyXG5pbXBvcnQgICogYXMgcGVkaWdyZWVfdXRpbHMgZnJvbSAnLi9wZWRpZ3JlZV91dGlscy5qcyc7XG5pbXBvcnQgKiBhcyBwYnV0dG9ucyBmcm9tICcuL3BidXR0b25zLmpzJztcbmltcG9ydCAqIGFzIHBlZGNhY2hlIGZyb20gJy4vcGVkY2FjaGUuanMnO1xuaW1wb3J0ICogYXMgaW8gZnJvbSAnLi9pby5qcyc7XG5pbXBvcnQge2FkZFdpZGdldHN9IGZyb20gJy4vd2lkZ2V0cy5qcyc7XG5cbmV4cG9ydCBsZXQgcm9vdHMgPSB7fTtcbmV4cG9ydCBmdW5jdGlvbiBidWlsZChvcHRpb25zKSB7XG5cdGxldCBvcHRzID0gJC5leHRlbmQoeyAvLyBkZWZhdWx0c1xuXHRcdHRhcmdldERpdjogJ3BlZGlncmVlX2VkaXQnLFxuXHRcdGRhdGFzZXQ6IFsge1wibmFtZVwiOiBcIm0yMVwiLCBcImRpc3BsYXlfbmFtZVwiOiBcImZhdGhlclwiLCBcInNleFwiOiBcIk1cIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX0sXG5cdFx0XHRcdCAgIHtcIm5hbWVcIjogXCJmMjFcIiwgXCJkaXNwbGF5X25hbWVcIjogXCJtb3RoZXJcIiwgXCJzZXhcIjogXCJGXCIsIFwidG9wX2xldmVsXCI6IHRydWV9LFxuXHRcdFx0XHQgICB7XCJuYW1lXCI6IFwiY2gxXCIsIFwiZGlzcGxheV9uYW1lXCI6IFwibWVcIiwgXCJzZXhcIjogXCJGXCIsIFwibW90aGVyXCI6IFwiZjIxXCIsIFwiZmF0aGVyXCI6IFwibTIxXCIsIFwicHJvYmFuZFwiOiB0cnVlfV0sXG5cdFx0d2lkdGg6IDYwMCxcblx0XHRoZWlnaHQ6IDQwMCxcblx0XHRzeW1ib2xfc2l6ZTogMzUsXG5cdFx0em9vbUluOiAxLjAsXG5cdFx0em9vbU91dDogMS4wLFxuXHRcdGRpc2Vhc2VzOiBbXHR7J3R5cGUnOiAnYnJlYXN0X2NhbmNlcicsICdjb2xvdXInOiAnI0Y2OEYzNSd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdicmVhc3RfY2FuY2VyMicsICdjb2xvdXInOiAncGluayd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdvdmFyaWFuX2NhbmNlcicsICdjb2xvdXInOiAnIzREQUE0RCd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdwYW5jcmVhdGljX2NhbmNlcicsICdjb2xvdXInOiAnIzQyODlCQSd9LFxuXHRcdFx0XHRcdHsndHlwZSc6ICdwcm9zdGF0ZV9jYW5jZXInLCAnY29sb3VyJzogJyNENTQ5NEEnfV0sXG5cdFx0bGFiZWxzOiBbJ3N0aWxsYmlydGgnLCAnYWdlJywgJ3lvYicsICdhbGxlbGVzJ10sXG5cdFx0a2VlcF9wcm9iYW5kX29uX3Jlc2V0OiBmYWxzZSxcblx0XHRmb250X3NpemU6ICcuNzVlbScsXG5cdFx0Zm9udF9mYW1pbHk6ICdIZWx2ZXRpY2EnLFxuXHRcdGZvbnRfd2VpZ2h0OiA3MDAsXG5cdFx0YmFja2dyb3VuZDogXCIjRUVFXCIsXG5cdFx0bm9kZV9iYWNrZ3JvdW5kOiAnI2ZkZmRmZCcsXG5cdFx0dmFsaWRhdGU6IHRydWUsXG5cdFx0REVCVUc6IGZhbHNlfSwgb3B0aW9ucyApO1xuXG5cdGlmICggJCggXCIjZnVsbHNjcmVlblwiICkubGVuZ3RoID09PSAwICkge1xuXHRcdC8vIGFkZCB1bmRvLCByZWRvLCBmdWxsc2NyZWVuIGJ1dHRvbnMgYW5kIGV2ZW50IGxpc3RlbmVycyBvbmNlXG5cdFx0cGJ1dHRvbnMuYWRkKG9wdHMpO1xuXHRcdGlvLmFkZChvcHRzKTtcblx0fVxuXG5cdGlmKHBlZGNhY2hlLm5zdG9yZShvcHRzKSA9PSAtMSlcblx0XHRwZWRjYWNoZS5pbml0X2NhY2hlKG9wdHMpO1xuXG5cdHBidXR0b25zLnVwZGF0ZUJ1dHRvbnMob3B0cyk7XG5cblx0Ly8gdmFsaWRhdGUgcGVkaWdyZWUgZGF0YVxuXHR2YWxpZGF0ZV9wZWRpZ3JlZShvcHRzKTtcblx0Ly8gZ3JvdXAgdG9wIGxldmVsIG5vZGVzIGJ5IHBhcnRuZXJzXG5cdG9wdHMuZGF0YXNldCA9IGdyb3VwX3RvcF9sZXZlbChvcHRzLmRhdGFzZXQpO1xuXG5cdGlmKG9wdHMuREVCVUcpXG5cdFx0cGVkaWdyZWVfdXRpbHMucHJpbnRfb3B0cyhvcHRzKTtcblx0bGV0IHN2Z19kaW1lbnNpb25zID0gZ2V0X3N2Z19kaW1lbnNpb25zKG9wdHMpO1xuXHRsZXQgc3ZnID0gZDMuc2VsZWN0KFwiI1wiK29wdHMudGFyZ2V0RGl2KVxuXHRcdFx0XHQgLmFwcGVuZChcInN2ZzpzdmdcIilcblx0XHRcdFx0IC5hdHRyKFwid2lkdGhcIiwgc3ZnX2RpbWVuc2lvbnMud2lkdGgpXG5cdFx0XHRcdCAuYXR0cihcImhlaWdodFwiLCBzdmdfZGltZW5zaW9ucy5oZWlnaHQpO1xuXG5cdHN2Zy5hcHBlbmQoXCJyZWN0XCIpXG5cdFx0LmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcblx0XHQuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcblx0XHQuYXR0cihcInJ4XCIsIDYpXG5cdFx0LmF0dHIoXCJyeVwiLCA2KVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBcImRhcmtncmV5XCIpXG5cdFx0LnN0eWxlKFwiZmlsbFwiLCBvcHRzLmJhY2tncm91bmQpIC8vIG9yIG5vbmVcblx0XHQuc3R5bGUoXCJzdHJva2Utd2lkdGhcIiwgMSk7XG5cblx0bGV0IHh5dHJhbnNmb3JtID0gcGVkY2FjaGUuZ2V0cG9zaXRpb24ob3B0cyk7ICAvLyBjYWNoZWQgcG9zaXRpb25cblx0bGV0IHh0cmFuc2Zvcm0gPSB4eXRyYW5zZm9ybVswXTtcblx0bGV0IHl0cmFuc2Zvcm0gPSB4eXRyYW5zZm9ybVsxXTtcblx0bGV0IHpvb20gPSAxO1xuXHRpZih4eXRyYW5zZm9ybS5sZW5ndGggPT0gMyl7XG5cdFx0em9vbSA9IHh5dHJhbnNmb3JtWzJdO1xuXHR9XG5cblx0aWYoeHRyYW5zZm9ybSA9PT0gbnVsbCB8fCB5dHJhbnNmb3JtID09PSBudWxsKSB7XG5cdFx0eHRyYW5zZm9ybSA9IG9wdHMuc3ltYm9sX3NpemUvMjtcblx0XHR5dHJhbnNmb3JtID0gKC1vcHRzLnN5bWJvbF9zaXplKjIuNSk7XG5cdH1cblx0bGV0IHBlZCA9IHN2Zy5hcHBlbmQoXCJnXCIpXG5cdFx0XHQgLmF0dHIoXCJjbGFzc1wiLCBcImRpYWdyYW1cIilcblx0XHRcdCAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIit4dHJhbnNmb3JtK1wiLFwiICsgeXRyYW5zZm9ybSArIFwiKSBzY2FsZShcIit6b29tK1wiKVwiKTtcblxuXHRsZXQgdG9wX2xldmVsID0gJC5tYXAob3B0cy5kYXRhc2V0LCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gJ3RvcF9sZXZlbCcgaW4gdmFsICYmIHZhbC50b3BfbGV2ZWwgPyB2YWwgOiBudWxsO30pO1xuXHRsZXQgaGlkZGVuX3Jvb3QgPSB7XG5cdFx0bmFtZSA6ICdoaWRkZW5fcm9vdCcsXG5cdFx0aWQgOiAwLFxuXHRcdGhpZGRlbiA6IHRydWUsXG5cdFx0Y2hpbGRyZW4gOiB0b3BfbGV2ZWxcblx0fTtcblxuXHRsZXQgcGFydG5lcnMgPSBwZWRpZ3JlZV91dGlscy5idWlsZFRyZWUob3B0cywgaGlkZGVuX3Jvb3QsIGhpZGRlbl9yb290KVswXTtcblx0bGV0IHJvb3QgPSBkMy5oaWVyYXJjaHkoaGlkZGVuX3Jvb3QpO1xuXHRyb290c1tvcHRzLnRhcmdldERpdl0gPSByb290O1xuXG5cdC8vIC8gZ2V0IHNjb3JlIGF0IGVhY2ggZGVwdGggdXNlZCB0byBhZGp1c3Qgbm9kZSBzZXBhcmF0aW9uXG5cdGxldCB0cmVlX2RpbWVuc2lvbnMgPSBnZXRfdHJlZV9kaW1lbnNpb25zKG9wdHMpO1xuXHRpZihvcHRzLkRFQlVHKVxuXHRcdGNvbnNvbGUubG9nKCdvcHRzLndpZHRoPScrc3ZnX2RpbWVuc2lvbnMud2lkdGgrJyB3aWR0aD0nK3RyZWVfZGltZW5zaW9ucy53aWR0aCtcblx0XHRcdFx0XHQnIG9wdHMuaGVpZ2h0PScrc3ZnX2RpbWVuc2lvbnMuaGVpZ2h0KycgaGVpZ2h0PScrdHJlZV9kaW1lbnNpb25zLmhlaWdodCk7XG5cblx0bGV0IHRyZWVtYXAgPSBkMy50cmVlKCkuc2VwYXJhdGlvbihmdW5jdGlvbihhLCBiKSB7XG5cdFx0cmV0dXJuIGEucGFyZW50ID09PSBiLnBhcmVudCB8fCBhLmRhdGEuaGlkZGVuIHx8IGIuZGF0YS5oaWRkZW4gPyAxLjIgOiAyLjI7XG5cdH0pLnNpemUoW3RyZWVfZGltZW5zaW9ucy53aWR0aCwgdHJlZV9kaW1lbnNpb25zLmhlaWdodF0pO1xuXG5cdGxldCBub2RlcyA9IHRyZWVtYXAocm9vdC5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEuZGF0YS5pZCAtIGIuZGF0YS5pZDsgfSkpO1xuXHRsZXQgZmxhdHRlbk5vZGVzID0gbm9kZXMuZGVzY2VuZGFudHMoKTtcblxuXHQvLyBjaGVjayB0aGUgbnVtYmVyIG9mIHZpc2libGUgbm9kZXMgZXF1YWxzIHRoZSBzaXplIG9mIHRoZSBwZWRpZ3JlZSBkYXRhc2V0XG5cdGxldCB2aXNfbm9kZXMgPSAkLm1hcChvcHRzLmRhdGFzZXQsIGZ1bmN0aW9uKHAsIF9pKXtyZXR1cm4gcC5oaWRkZW4gPyBudWxsIDogcDt9KTtcblx0aWYodmlzX25vZGVzLmxlbmd0aCAhPSBvcHRzLmRhdGFzZXQubGVuZ3RoKSB7XG5cdFx0dGhyb3cgY3JlYXRlX2VycignTlVNQkVSIE9GIFZJU0lCTEUgTk9ERVMgRElGRkVSRU5UIFRPIE5VTUJFUiBJTiBUSEUgREFUQVNFVCcpO1xuXHR9XG5cblx0cGVkaWdyZWVfdXRpbHMuYWRqdXN0X2Nvb3JkcyhvcHRzLCBub2RlcywgZmxhdHRlbk5vZGVzKTtcblxuXHRsZXQgcHRyTGlua05vZGVzID0gcGVkaWdyZWVfdXRpbHMubGlua05vZGVzKGZsYXR0ZW5Ob2RlcywgcGFydG5lcnMpO1xuXHRjaGVja19wdHJfbGlua3Mob3B0cywgcHRyTGlua05vZGVzKTsgICAvLyBjaGVjayBmb3IgY3Jvc3Npbmcgb2YgcGFydG5lciBsaW5lc1xuXG5cdGxldCBub2RlID0gcGVkLnNlbGVjdEFsbChcIi5ub2RlXCIpXG5cdFx0XHRcdCAgLmRhdGEobm9kZXMuZGVzY2VuZGFudHMoKSlcblx0XHRcdFx0ICAuZW50ZXIoKVxuXHRcdFx0XHQgIC5hcHBlbmQoXCJnXCIpXG5cdFx0XHRcdFx0LmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XG5cdFx0XHRcdFx0fSk7XG5cblx0Ly8gcHJvdmlkZSBhIGJvcmRlciB0byB0aGUgbm9kZVxuXHRub2RlLmFwcGVuZChcInBhdGhcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuaGlkZGVuO30pXG5cdFx0LmF0dHIoXCJzaGFwZS1yZW5kZXJpbmdcIiwgXCJnZW9tZXRyaWNQcmVjaXNpb25cIilcblx0XHQuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7cmV0dXJuIGQuZGF0YS5zZXggPT0gXCJVXCIgJiYgIShkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKSA/IFwicm90YXRlKDQ1KVwiIDogXCJcIjt9KVxuXHRcdC5hdHRyKFwiZFwiLCBkMy5zeW1ib2woKS5zaXplKGZ1bmN0aW9uKF9kKSB7IHJldHVybiAob3B0cy5zeW1ib2xfc2l6ZSAqIG9wdHMuc3ltYm9sX3NpemUpICsgMjt9KVxuXHRcdFx0XHQudHlwZShmdW5jdGlvbihkKSB7XG5cdFx0XHRcdFx0aWYoZC5kYXRhLm1pc2NhcnJpYWdlIHx8IGQuZGF0YS50ZXJtaW5hdGlvbilcblx0XHRcdFx0XHRcdHJldHVybiBkMy5zeW1ib2xUcmlhbmdsZTtcblx0XHRcdFx0XHRyZXR1cm4gZC5kYXRhLnNleCA9PSBcIkZcIiA/IGQzLnN5bWJvbENpcmNsZSA6IGQzLnN5bWJvbFNxdWFyZTt9KSlcblx0XHQuc3R5bGUoXCJzdHJva2VcIiwgZnVuY3Rpb24gKGQpIHtcblx0XHRcdHJldHVybiBkLmRhdGEuYWdlICYmIGQuZGF0YS55b2IgJiYgIWQuZGF0YS5leGNsdWRlID8gXCIjMzAzMDMwXCIgOiBcImdyZXlcIjtcblx0XHR9KVxuXHRcdC5zdHlsZShcInN0cm9rZS13aWR0aFwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0cmV0dXJuIGQuZGF0YS5hZ2UgJiYgZC5kYXRhLnlvYiAmJiAhZC5kYXRhLmV4Y2x1ZGUgPyBcIi4zZW1cIiA6IFwiLjFlbVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBmdW5jdGlvbiAoZCkge3JldHVybiAhZC5kYXRhLmV4Y2x1ZGUgPyBudWxsIDogKFwiMywgM1wiKTt9KVxuXHRcdC5zdHlsZShcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cdC8vIHNldCBhIGNsaXBwYXRoXG5cdG5vZGUuYXBwZW5kKFwiY2xpcFBhdGhcIilcblx0XHQuYXR0cihcImlkXCIsIGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQuZGF0YS5uYW1lO30pLmFwcGVuZChcInBhdGhcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuICEoZC5kYXRhLmhpZGRlbiAmJiAhb3B0cy5ERUJVRyk7fSlcblx0XHQuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuXHRcdC5hdHRyKFwidHJhbnNmb3JtXCIsIGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5kYXRhLnNleCA9PSBcIlVcIiAmJiAhKGQuZGF0YS5taXNjYXJyaWFnZSB8fCBkLmRhdGEudGVybWluYXRpb24pID8gXCJyb3RhdGUoNDUpXCIgOiBcIlwiO30pXG5cdFx0LmF0dHIoXCJkXCIsIGQzLnN5bWJvbCgpLnNpemUoZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZiAoZC5kYXRhLmhpZGRlbilcblx0XHRcdFx0XHRyZXR1cm4gb3B0cy5zeW1ib2xfc2l6ZSAqIG9wdHMuc3ltYm9sX3NpemUgLyA1O1xuXHRcdFx0XHRyZXR1cm4gb3B0cy5zeW1ib2xfc2l6ZSAqIG9wdHMuc3ltYm9sX3NpemU7XG5cdFx0XHR9KVxuXHRcdFx0LnR5cGUoZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZihkLmRhdGEubWlzY2FycmlhZ2UgfHwgZC5kYXRhLnRlcm1pbmF0aW9uKVxuXHRcdFx0XHRcdHJldHVybiBkMy5zeW1ib2xUcmlhbmdsZTtcblx0XHRcdFx0cmV0dXJuIGQuZGF0YS5zZXggPT0gXCJGXCIgPyBkMy5zeW1ib2xDaXJjbGUgOmQzLnN5bWJvbFNxdWFyZTt9KSk7XG5cblx0Ly8gcGllIHBsb3RzIGZvciBkaXNlYXNlIGNvbG91cnNcblx0bGV0IHBpZW5vZGUgPSBub2RlLnNlbGVjdEFsbChcInBpZW5vZGVcIilcblx0ICAgLmRhdGEoZnVuY3Rpb24oZCkge1x0IFx0XHQvLyBzZXQgdGhlIGRpc2Vhc2UgZGF0YSBmb3IgdGhlIHBpZSBwbG90XG5cdFx0ICAgbGV0IG5jYW5jZXJzID0gMDtcblx0XHQgICBsZXQgY2FuY2VycyA9ICQubWFwKG9wdHMuZGlzZWFzZXMsIGZ1bmN0aW9uKHZhbCwgaSl7XG5cdFx0XHQgICBpZihwcmVmaXhJbk9iaihvcHRzLmRpc2Vhc2VzW2ldLnR5cGUsIGQuZGF0YSkpIHtuY2FuY2VycysrOyByZXR1cm4gMTt9IGVsc2UgcmV0dXJuIDA7XG5cdFx0ICAgfSk7XG5cdFx0ICAgaWYobmNhbmNlcnMgPT09IDApIGNhbmNlcnMgPSBbMV07XG5cdFx0ICAgcmV0dXJuIFskLm1hcChjYW5jZXJzLCBmdW5jdGlvbih2YWwsIF9pKXtcblx0XHRcdCAgIHJldHVybiB7J2NhbmNlcic6IHZhbCwgJ25jYW5jZXJzJzogbmNhbmNlcnMsICdpZCc6IGQuZGF0YS5uYW1lLFxuXHRcdFx0XHRcdFx0J3NleCc6IGQuZGF0YS5zZXgsICdwcm9iYW5kJzogZC5kYXRhLnByb2JhbmQsICdoaWRkZW4nOiBkLmRhdGEuaGlkZGVuLFxuXHRcdFx0XHRcdFx0J2FmZmVjdGVkJzogZC5kYXRhLmFmZmVjdGVkLFxuXHRcdFx0XHRcdFx0J2V4Y2x1ZGUnOiBkLmRhdGEuZXhjbHVkZX07fSldO1xuXHQgICB9KVxuXHQgICAuZW50ZXIoKVxuXHRcdC5hcHBlbmQoXCJnXCIpO1xuXG5cdHBpZW5vZGUuc2VsZWN0QWxsKFwicGF0aFwiKVxuXHRcdC5kYXRhKGQzLnBpZSgpLnZhbHVlKGZ1bmN0aW9uKGQpIHtyZXR1cm4gZC5jYW5jZXI7fSkpXG5cdFx0LmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuXHRcdFx0LmF0dHIoXCJjbGlwLXBhdGhcIiwgZnVuY3Rpb24oZCkge3JldHVybiBcInVybCgjXCIrZC5kYXRhLmlkK1wiKVwiO30pIC8vIGNsaXAgdGhlIHJlY3RhbmdsZVxuXHRcdFx0LmF0dHIoXCJjbGFzc1wiLCBcInBpZW5vZGVcIilcblx0XHRcdC5hdHRyKFwiZFwiLCBkMy5hcmMoKS5pbm5lclJhZGl1cygwKS5vdXRlclJhZGl1cyhvcHRzLnN5bWJvbF9zaXplKSlcblx0XHRcdC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24oZCwgaSkge1xuXHRcdFx0XHRpZihkLmRhdGEuZXhjbHVkZSlcblx0XHRcdFx0XHRyZXR1cm4gJ2xpZ2h0Z3JleSc7XG5cdFx0XHRcdGlmKGQuZGF0YS5uY2FuY2VycyA9PT0gMCkge1xuXHRcdFx0XHRcdGlmKGQuZGF0YS5hZmZlY3RlZClcblx0XHRcdFx0XHRcdHJldHVybiAnZGFya2dyZXknO1xuXHRcdFx0XHRcdHJldHVybiBvcHRzLm5vZGVfYmFja2dyb3VuZDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gb3B0cy5kaXNlYXNlc1tpXS5jb2xvdXI7XG5cdFx0XHR9KTtcblxuXHQvLyBhZG9wdGVkIGluL291dCBicmFja2V0c1xuXHRub2RlLmFwcGVuZChcInBhdGhcIilcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuICFkLmRhdGEuaGlkZGVuICYmIChkLmRhdGEuYWRvcHRlZF9pbiB8fCBkLmRhdGEuYWRvcHRlZF9vdXQpO30pXG5cdFx0LmF0dHIoXCJkXCIsIGZ1bmN0aW9uKF9kKSB7IHtcblx0XHRcdGxldCBkeCA9IC0ob3B0cy5zeW1ib2xfc2l6ZSAqIDAuNjYpO1xuXHRcdFx0bGV0IGR5ID0gLShvcHRzLnN5bWJvbF9zaXplICogMC42NCk7XG5cdFx0XHRsZXQgaW5kZW50ID0gb3B0cy5zeW1ib2xfc2l6ZS80O1xuXHRcdFx0cmV0dXJuIGdldF9icmFja2V0KGR4LCBkeSwgaW5kZW50LCBvcHRzKStnZXRfYnJhY2tldCgtZHgsIGR5LCAtaW5kZW50LCBvcHRzKTtcblx0XHRcdH19KVxuXHRcdC5zdHlsZShcInN0cm9rZVwiLCBmdW5jdGlvbiAoZCkge1xuXHRcdFx0cmV0dXJuIGQuZGF0YS5hZ2UgJiYgZC5kYXRhLnlvYiAmJiAhZC5kYXRhLmV4Y2x1ZGUgPyBcIiMzMDMwMzBcIiA6IFwiZ3JleVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLXdpZHRoXCIsIGZ1bmN0aW9uIChfZCkge1xuXHRcdFx0cmV0dXJuIFwiLjFlbVwiO1xuXHRcdH0pXG5cdFx0LnN0eWxlKFwic3Ryb2tlLWRhc2hhcnJheVwiLCBmdW5jdGlvbiAoZCkge3JldHVybiAhZC5kYXRhLmV4Y2x1ZGUgPyBudWxsIDogKFwiMywgM1wiKTt9KVxuXHRcdC5zdHlsZShcImZpbGxcIiwgXCJub25lXCIpO1xuXG5cblx0Ly8gYWxpdmUgc3RhdHVzID0gMDsgZGVhZCBzdGF0dXMgPSAxXG5cdG5vZGUuYXBwZW5kKCdsaW5lJylcblx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7cmV0dXJuIGQuZGF0YS5zdGF0dXMgPT0gMTt9KVxuXHRcdFx0LnN0eWxlKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHRcdC5hdHRyKFwieDFcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIC0wLjYqb3B0cy5zeW1ib2xfc2l6ZTt9KVxuXHRcdFx0LmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihfZCwgX2kpIHtyZXR1cm4gMC42Km9wdHMuc3ltYm9sX3NpemU7fSlcblx0XHRcdC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oX2QsIF9pKSB7cmV0dXJuIDAuNipvcHRzLnN5bWJvbF9zaXplO30pXG5cdFx0XHQuYXR0cihcInkyXCIsIGZ1bmN0aW9uKF9kLCBfaSkge3JldHVybiAtMC42Km9wdHMuc3ltYm9sX3NpemU7fSk7XG5cblx0Ly8gbmFtZXMgb2YgaW5kaXZpZHVhbHNcblx0YWRkTGFiZWwob3B0cywgbm9kZSwgXCIuMjVlbVwiLCAtKDAuNCAqIG9wdHMuc3ltYm9sX3NpemUpLCAtKDAuMSAqIG9wdHMuc3ltYm9sX3NpemUpLFxuXHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRcdHJldHVybiAoJ2Rpc3BsYXlfbmFtZScgaW4gZC5kYXRhID8gZC5kYXRhLmRpc3BsYXlfbmFtZSA6IGQuZGF0YS5uYW1lKSArICcgICcgKyBkLmRhdGEuaWQ7XG5cdFx0XHRcdHJldHVybiAnZGlzcGxheV9uYW1lJyBpbiBkLmRhdGEgPyBkLmRhdGEuZGlzcGxheV9uYW1lIDogJyc7fSk7XG5cbi8qXG4gKiBsZXQgd2FybiA9IG5vZGUuZmlsdGVyKGZ1bmN0aW9uIChkKSB7IHJldHVybiAoIWQuZGF0YS5hZ2UgfHwgIWQuZGF0YS55b2IpICYmICFkLmRhdGEuaGlkZGVuOyB9KS5hcHBlbmQoXCJ0ZXh0XCIpIC5hdHRyKCdmb250LWZhbWlseScsICdGb250QXdlc29tZScpXG4gKiAuYXR0cihcInhcIiwgXCIuMjVlbVwiKSAuYXR0cihcInlcIiwgLSgwLjQgKiBvcHRzLnN5bWJvbF9zaXplKSwgLSgwLjIgKiBvcHRzLnN5bWJvbF9zaXplKSkgLmh0bWwoXCJcXHVmMDcxXCIpOyB3YXJuLmFwcGVuZChcInN2Zzp0aXRsZVwiKS50ZXh0KFwiaW5jb21wbGV0ZVwiKTtcbiAqL1xuXG5cdGxldCBmb250X3NpemUgPSBwYXJzZUludChnZXRQeChvcHRzKSkgKyA0O1xuXHQvLyBkaXNwbGF5IGxhYmVsIGRlZmluZWQgaW4gb3B0cy5sYWJlbHMgZS5nLiBhbGxlbGVzL2dlbm90eXBlIGRhdGFcblx0Zm9yKGxldCBpbGFiPTA7IGlsYWI8b3B0cy5sYWJlbHMubGVuZ3RoOyBpbGFiKyspIHtcblx0XHRsZXQgbGFiZWwgPSBvcHRzLmxhYmVsc1tpbGFiXTtcblx0XHRhZGRMYWJlbChvcHRzLCBub2RlLCBcIi4yNWVtXCIsIC0oMC43ICogb3B0cy5zeW1ib2xfc2l6ZSksXG5cdFx0XHRmdW5jdGlvbihkKSB7XG5cdFx0XHRcdGlmKCFkLmRhdGFbbGFiZWxdKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0ZC55X29mZnNldCA9IChpbGFiID09PSAwIHx8ICFkLnlfb2Zmc2V0ID8gZm9udF9zaXplKjIuMjUgOiBkLnlfb2Zmc2V0K2ZvbnRfc2l6ZSk7XG5cdFx0XHRcdHJldHVybiBkLnlfb2Zmc2V0O1xuXHRcdFx0fSxcblx0XHRcdGZ1bmN0aW9uKGQpIHtcblx0XHRcdFx0aWYoZC5kYXRhW2xhYmVsXSkge1xuXHRcdFx0XHRcdGlmKGxhYmVsID09PSAnYWxsZWxlcycpIHtcblx0XHRcdFx0XHRcdGxldCBhbGxlbGVzID0gXCJcIjtcblx0XHRcdFx0XHRcdGxldCB2YXJzID0gZC5kYXRhLmFsbGVsZXMuc3BsaXQoJzsnKTtcblx0XHRcdFx0XHRcdGZvcihsZXQgaXZhciA9IDA7aXZhciA8IHZhcnMubGVuZ3RoO2l2YXIrKykge1xuXHRcdFx0XHRcdFx0XHRpZih2YXJzW2l2YXJdICE9PSBcIlwiKSBhbGxlbGVzICs9IHZhcnNbaXZhcl0gKyAnOyc7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRyZXR1cm4gYWxsZWxlcztcblx0XHRcdFx0XHR9IGVsc2UgaWYobGFiZWwgPT09ICdhZ2UnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZC5kYXRhW2xhYmVsXSArJ3knO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihsYWJlbCA9PT0gJ3N0aWxsYmlydGgnKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJTQlwiO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gZC5kYXRhW2xhYmVsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgJ2luZGlfZGV0YWlscycpO1xuXHR9XG5cblx0Ly8gaW5kaXZpZHVhbHMgZGlzZWFzZSBkZXRhaWxzXG5cdGZvcihsZXQgaT0wO2k8b3B0cy5kaXNlYXNlcy5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkaXNlYXNlID0gb3B0cy5kaXNlYXNlc1tpXS50eXBlO1xuXHRcdGFkZExhYmVsKG9wdHMsIG5vZGUsIFwiLjI1ZW1cIiwgLShvcHRzLnN5bWJvbF9zaXplKSxcblx0XHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRcdGxldCB5X29mZnNldCA9IChkLnlfb2Zmc2V0ID8gZC55X29mZnNldCtmb250X3NpemU6IGZvbnRfc2l6ZSoyLjIpO1xuXHRcdFx0XHRcdGZvcihsZXQgaj0wO2o8b3B0cy5kaXNlYXNlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0aWYoZGlzZWFzZSA9PT0gb3B0cy5kaXNlYXNlc1tqXS50eXBlKVxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdGlmKHByZWZpeEluT2JqKG9wdHMuZGlzZWFzZXNbal0udHlwZSwgZC5kYXRhKSlcblx0XHRcdFx0XHRcdFx0eV9vZmZzZXQgKz0gZm9udF9zaXplLTE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiB5X29mZnNldDtcblx0XHRcdFx0fSxcblx0XHRcdFx0ZnVuY3Rpb24oZCkge1xuXHRcdFx0XHRcdGxldCBkaXMgPSBkaXNlYXNlLnJlcGxhY2UoJ18nLCAnICcpLnJlcGxhY2UoJ2NhbmNlcicsICdjYS4nKTtcblx0XHRcdFx0XHRyZXR1cm4gZGlzZWFzZSsnX2RpYWdub3Npc19hZ2UnIGluIGQuZGF0YSA/IGRpcyArXCI6IFwiKyBkLmRhdGFbZGlzZWFzZSsnX2RpYWdub3Npc19hZ2UnXSA6ICcnO1xuXHRcdFx0XHR9LCAnaW5kaV9kZXRhaWxzJyk7XG5cdH1cblxuXHQvL1xuXHRhZGRXaWRnZXRzKG9wdHMsIG5vZGUpO1xuXG5cdC8vIGxpbmtzIGJldHdlZW4gcGFydG5lcnNcblx0bGV0IGNsYXNoX2RlcHRoID0ge307XG5cdFxuXHQvLyBnZXQgcGF0aCBsb29waW5nIG92ZXIgbm9kZShzKVxuXHRsZXQgZHJhd19wYXRoID0gZnVuY3Rpb24oY2xhc2gsIGR4LCBkeTEsIGR5MiwgcGFyZW50X25vZGUsIGNzaGlmdCkge1xuXHRcdGxldCBleHRlbmQgPSBmdW5jdGlvbihpLCBsKSB7XG5cdFx0XHRpZihpKzEgPCBsKSAgIC8vICYmIE1hdGguYWJzKGNsYXNoW2ldIC0gY2xhc2hbaSsxXSkgPCAob3B0cy5zeW1ib2xfc2l6ZSoxLjI1KVxuXHRcdFx0XHRyZXR1cm4gZXh0ZW5kKCsraSk7XG5cdFx0XHRyZXR1cm4gaTtcblx0XHR9O1xuXHRcdGxldCBwYXRoID0gXCJcIjtcblx0XHRmb3IobGV0IGo9MDsgajxjbGFzaC5sZW5ndGg7IGorKykge1xuXHRcdFx0bGV0IGsgPSBleHRlbmQoaiwgY2xhc2gubGVuZ3RoKTtcblx0XHRcdGxldCBkeDEgPSBjbGFzaFtqXSAtIGR4IC0gY3NoaWZ0O1xuXHRcdFx0bGV0IGR4MiA9IGNsYXNoW2tdICsgZHggKyBjc2hpZnQ7XG5cdFx0XHRpZihwYXJlbnRfbm9kZS54ID4gZHgxICYmIHBhcmVudF9ub2RlLnggPCBkeDIpXG5cdFx0XHRcdHBhcmVudF9ub2RlLnkgPSBkeTI7XG5cblx0XHRcdHBhdGggKz0gXCJMXCIgKyBkeDEgKyBcIixcIiArICAoZHkxIC0gY3NoaWZ0KSArXG5cdFx0XHRcdFx0XCJMXCIgKyBkeDEgKyBcIixcIiArICAoZHkyIC0gY3NoaWZ0KSArXG5cdFx0XHRcdFx0XCJMXCIgKyBkeDIgKyBcIixcIiArICAoZHkyIC0gY3NoaWZ0KSArXG5cdFx0XHRcdFx0XCJMXCIgKyBkeDIgKyBcIixcIiArICAoZHkxIC0gY3NoaWZ0KTtcblx0XHRcdGogPSBrO1xuXHRcdH1cblx0XHRyZXR1cm4gcGF0aDtcblx0fVxuXHRcblx0XG5cdHBhcnRuZXJzID0gcGVkLnNlbGVjdEFsbChcIi5wYXJ0bmVyXCIpXG5cdFx0LmRhdGEocHRyTGlua05vZGVzKVxuXHRcdC5lbnRlcigpXG5cdFx0XHQuaW5zZXJ0KFwicGF0aFwiLCBcImdcIilcblx0XHRcdC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsIFwiIzAwMFwiKVxuXHRcdFx0LmF0dHIoXCJzaGFwZS1yZW5kZXJpbmdcIiwgXCJhdXRvXCIpXG5cdFx0XHQuYXR0cignZCcsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGxldCBub2RlMSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBkLm1vdGhlci5kYXRhLm5hbWUpO1xuXHRcdFx0XHRsZXQgbm9kZTIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5mYXRoZXIuZGF0YS5uYW1lKTtcblx0XHRcdFx0bGV0IGNvbnNhbmd1aXR5ID0gcGVkaWdyZWVfdXRpbHMuY29uc2FuZ3VpdHkobm9kZTEsIG5vZGUyLCBvcHRzKTtcblx0XHRcdFx0bGV0IGRpdm9yY2VkID0gKGQubW90aGVyLmRhdGEuZGl2b3JjZWQgJiYgIGQubW90aGVyLmRhdGEuZGl2b3JjZWQgPT09IGQuZmF0aGVyLmRhdGEubmFtZSk7XG5cblx0XHRcdFx0bGV0IHgxID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5tb3RoZXIueCA6IGQuZmF0aGVyLngpO1xuXHRcdFx0XHRsZXQgeDIgPSAoZC5tb3RoZXIueCA8IGQuZmF0aGVyLnggPyBkLmZhdGhlci54IDogZC5tb3RoZXIueCk7XG5cdFx0XHRcdGxldCBkeTEgPSBkLm1vdGhlci55O1xuXHRcdFx0XHRsZXQgZHkyLCBkeCwgcGFyZW50X25vZGU7XG5cblx0XHRcdFx0Ly8gaWRlbnRpZnkgY2xhc2hlcyB3aXRoIG90aGVyIG5vZGVzIGF0IHRoZSBzYW1lIGRlcHRoXG5cdFx0XHRcdGxldCBjbGFzaCA9IGNoZWNrX3B0cl9saW5rX2NsYXNoZXMob3B0cywgZCk7XG5cdFx0XHRcdGxldCBwYXRoID0gXCJcIjtcblx0XHRcdFx0aWYoY2xhc2gpIHtcblx0XHRcdFx0XHRpZihkLm1vdGhlci5kZXB0aCBpbiBjbGFzaF9kZXB0aClcblx0XHRcdFx0XHRcdGNsYXNoX2RlcHRoW2QubW90aGVyLmRlcHRoXSArPSA0O1xuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGNsYXNoX2RlcHRoW2QubW90aGVyLmRlcHRoXSA9IDQ7XG5cblx0XHRcdFx0XHRkeTEgLT0gY2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdO1xuXHRcdFx0XHRcdGR4ID0gY2xhc2hfZGVwdGhbZC5tb3RoZXIuZGVwdGhdICsgb3B0cy5zeW1ib2xfc2l6ZS8yICsgMjtcblxuXHRcdFx0XHRcdGxldCBwYXJlbnRfbm9kZXMgPSBkLm1vdGhlci5kYXRhLnBhcmVudF9ub2RlO1xuXHRcdFx0XHRcdGxldCBwYXJlbnRfbm9kZV9uYW1lID0gcGFyZW50X25vZGVzWzBdO1xuXHRcdFx0XHRcdGZvcihsZXQgaWk9MDsgaWk8cGFyZW50X25vZGVzLmxlbmd0aDsgaWkrKykge1xuXHRcdFx0XHRcdFx0aWYocGFyZW50X25vZGVzW2lpXS5mYXRoZXIubmFtZSA9PT0gZC5mYXRoZXIuZGF0YS5uYW1lICYmXG5cdFx0XHRcdFx0XHQgICBwYXJlbnRfbm9kZXNbaWldLm1vdGhlci5uYW1lID09PSBkLm1vdGhlci5kYXRhLm5hbWUpXG5cdFx0XHRcdFx0XHRcdHBhcmVudF9ub2RlX25hbWUgPSBwYXJlbnRfbm9kZXNbaWldLm5hbWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHBhcmVudF9ub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIHBhcmVudF9ub2RlX25hbWUpO1xuXHRcdFx0XHRcdHBhcmVudF9ub2RlLnkgPSBkeTE7IC8vIGFkanVzdCBoZ3Qgb2YgcGFyZW50IG5vZGVcblx0XHRcdFx0XHRjbGFzaC5zb3J0KGZ1bmN0aW9uIChhLGIpIHtyZXR1cm4gYSAtIGI7fSk7XG5cblx0XHRcdFx0XHRkeTIgPSAoZHkxLW9wdHMuc3ltYm9sX3NpemUvMi0zKTtcblx0XHRcdFx0XHRwYXRoID0gZHJhd19wYXRoKGNsYXNoLCBkeCwgZHkxLCBkeTIsIHBhcmVudF9ub2RlLCAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBkaXZvcmNlX3BhdGggPSBcIlwiO1xuXHRcdFx0XHRpZihkaXZvcmNlZCAmJiAhY2xhc2gpXG5cdFx0XHRcdFx0ZGl2b3JjZV9wYXRoID0gXCJNXCIgKyAoeDErKCh4Mi14MSkqLjY2KSs2KSArIFwiLFwiICsgKGR5MS02KSArXG5cdFx0XHRcdFx0XHRcdFx0ICAgXCJMXCIrICAoeDErKCh4Mi14MSkqLjY2KS02KSArIFwiLFwiICsgKGR5MSs2KSArXG5cdFx0XHRcdFx0XHRcdFx0ICAgXCJNXCIgKyAoeDErKCh4Mi14MSkqLjY2KSsxMCkgKyBcIixcIiArIChkeTEtNikgK1xuXHRcdFx0XHRcdFx0XHRcdCAgIFwiTFwiKyAgKHgxKygoeDIteDEpKi42NiktMikgICsgXCIsXCIgKyAoZHkxKzYpO1xuXHRcdFx0XHRpZihjb25zYW5ndWl0eSkgeyAgLy8gY29uc2FuZ3Vpbm91cywgZHJhdyBkb3VibGUgbGluZSBiZXR3ZWVuIHBhcnRuZXJzXG5cdFx0XHRcdFx0ZHkxID0gKGQubW90aGVyLnggPCBkLmZhdGhlci54ID8gZC5tb3RoZXIueSA6IGQuZmF0aGVyLnkpO1xuXHRcdFx0XHRcdGR5MiA9IChkLm1vdGhlci54IDwgZC5mYXRoZXIueCA/IGQuZmF0aGVyLnkgOiBkLm1vdGhlci55KTtcblxuXHRcdFx0XHRcdGxldCBjc2hpZnQgPSAzO1xuXHRcdFx0XHRcdGlmKE1hdGguYWJzKGR5MS1keTIpID4gMC4xKSB7XHQgIC8vIERJRkZFUkVOVCBMRVZFTFxuXHRcdFx0XHRcdFx0cmV0dXJuXHRcIk1cIiArIHgxICsgXCIsXCIgKyBkeTEgKyBcIkxcIiArIHgyICsgXCIsXCIgKyBkeTIgK1xuXHRcdFx0XHRcdFx0XHRcdFwiTVwiICsgeDEgKyBcIixcIiArIChkeTEgLSBjc2hpZnQpICsgXCJMXCIgKyB4MiArIFwiLFwiICsgKGR5MiAtIGNzaGlmdCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcdFx0XHRcdFx0XHQgICAvLyBTQU1FIExFVkVMXG5cdFx0XHRcdFx0XHRsZXQgcGF0aDIgPSAoY2xhc2ggPyBkcmF3X3BhdGgoY2xhc2gsIGR4LCBkeTEsIGR5MiwgcGFyZW50X25vZGUsIGNzaGlmdCkgOiBcIlwiKTtcblx0XHRcdFx0XHRcdHJldHVyblx0XCJNXCIgKyB4MSArIFwiLFwiICsgZHkxICsgcGF0aCArIFwiTFwiICsgeDIgKyBcIixcIiArIGR5MSArXG5cdFx0XHRcdFx0XHRcdFx0XCJNXCIgKyB4MSArIFwiLFwiICsgKGR5MSAtIGNzaGlmdCkgKyBwYXRoMiArIFwiTFwiICsgeDIgKyBcIixcIiArIChkeTEgLSBjc2hpZnQpICsgZGl2b3JjZV9wYXRoO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm5cdFwiTVwiICsgeDEgKyBcIixcIiArIGR5MSArIHBhdGggKyBcIkxcIiArIHgyICsgXCIsXCIgKyBkeTEgKyBkaXZvcmNlX3BhdGg7XG5cdFx0XHR9KTtcblxuXHQvLyBsaW5rcyB0byBjaGlsZHJlblxuXHRwZWQuc2VsZWN0QWxsKFwiLmxpbmtcIilcblx0XHQuZGF0YShyb290LmxpbmtzKG5vZGVzLmRlc2NlbmRhbnRzKCkpKVxuXHRcdC5lbnRlcigpXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdC8vIGZpbHRlciB1bmxlc3MgZGVidWcgaXMgc2V0XG5cdFx0XHRcdHJldHVybiAob3B0cy5ERUJVRyB8fFxuXHRcdFx0XHRcdFx0KGQudGFyZ2V0LmRhdGEubm9wYXJlbnRzID09PSB1bmRlZmluZWQgJiYgZC5zb3VyY2UucGFyZW50ICE9PSBudWxsICYmICFkLnRhcmdldC5kYXRhLmhpZGRlbikpO1xuXHRcdFx0fSlcblx0XHRcdC5pbnNlcnQoXCJwYXRoXCIsIFwiZ1wiKVxuXHRcdFx0LmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuXHRcdFx0LmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5ub3BhcmVudHMgIT09IHVuZGVmaW5lZCB8fCBkLnNvdXJjZS5wYXJlbnQgPT09IG51bGwgfHwgZC50YXJnZXQuZGF0YS5oaWRkZW4pXG5cdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdHJldHVybiAob3B0cy5ERUJVRyA/IDIgOiAxKTtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcInN0cm9rZVwiLCBmdW5jdGlvbihkLCBfaSkge1xuXHRcdFx0XHRpZihkLnRhcmdldC5kYXRhLm5vcGFyZW50cyAhPT0gdW5kZWZpbmVkIHx8IGQuc291cmNlLnBhcmVudCA9PT0gbnVsbCB8fCBkLnRhcmdldC5kYXRhLmhpZGRlbilcblx0XHRcdFx0XHRyZXR1cm4gJ3BpbmsnO1xuXHRcdFx0XHRyZXR1cm4gXCIjMDAwXCI7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJzdHJva2UtZGFzaGFycmF5XCIsIGZ1bmN0aW9uKGQsIF9pKSB7XG5cdFx0XHRcdGlmKCFkLnRhcmdldC5kYXRhLmFkb3B0ZWRfaW4pIHJldHVybiBudWxsO1xuXHRcdFx0XHRsZXQgZGFzaF9sZW4gPSBNYXRoLmFicyhkLnNvdXJjZS55LSgoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpIC8gMikpO1xuXHRcdFx0XHRsZXQgZGFzaF9hcnJheSA9IFtkYXNoX2xlbiwgMCwgTWF0aC5hYnMoZC5zb3VyY2UueC1kLnRhcmdldC54KSwgMF07XG5cdFx0XHRcdGxldCB0d2lucyA9IHBlZGlncmVlX3V0aWxzLmdldFR3aW5zKG9wdHMuZGF0YXNldCwgZC50YXJnZXQuZGF0YSk7XG5cdFx0XHRcdGlmKHR3aW5zLmxlbmd0aCA+PSAxKSBkYXNoX2xlbiA9IGRhc2hfbGVuICogMztcblx0XHRcdFx0Zm9yKGxldCB1c2VkbGVuID0gMDsgdXNlZGxlbiA8IGRhc2hfbGVuOyB1c2VkbGVuICs9IDEwKVxuXHRcdFx0XHRcdCQubWVyZ2UoZGFzaF9hcnJheSwgWzUsIDVdKTtcblx0XHRcdFx0cmV0dXJuIGRhc2hfYXJyYXk7XG5cdFx0XHR9KVxuXHRcdFx0LmF0dHIoXCJzaGFwZS1yZW5kZXJpbmdcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5tenR3aW4gfHwgZC50YXJnZXQuZGF0YS5kenR3aW4pXG5cdFx0XHRcdFx0cmV0dXJuIFwiZ2VvbWV0cmljUHJlY2lzaW9uXCI7XG5cdFx0XHRcdHJldHVybiBcImF1dG9cIjtcblx0XHRcdH0pXG5cdFx0XHQuYXR0cihcImRcIiwgZnVuY3Rpb24oZCwgX2kpIHtcblx0XHRcdFx0aWYoZC50YXJnZXQuZGF0YS5tenR3aW4gfHwgZC50YXJnZXQuZGF0YS5kenR3aW4pIHtcblx0XHRcdFx0XHQvLyBnZXQgdHdpbiBwb3NpdGlvblxuXHRcdFx0XHRcdGxldCB0d2lucyA9IHBlZGlncmVlX3V0aWxzLmdldFR3aW5zKG9wdHMuZGF0YXNldCwgZC50YXJnZXQuZGF0YSk7XG5cdFx0XHRcdFx0aWYodHdpbnMubGVuZ3RoID49IDEpIHtcblx0XHRcdFx0XHRcdGxldCB0d2lueCA9IDA7XG5cdFx0XHRcdFx0XHRsZXQgeG1pbiA9IGQudGFyZ2V0Lng7XG5cdFx0XHRcdFx0XHRsZXQgeG1heCA9IGQudGFyZ2V0Lng7XG5cdFx0XHRcdFx0XHRmb3IobGV0IHQ9MDsgdDx0d2lucy5sZW5ndGg7IHQrKykge1xuXHRcdFx0XHRcdFx0XHRsZXQgdGhpc3ggPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgdHdpbnNbdF0ubmFtZSkueDtcblx0XHRcdFx0XHRcdFx0aWYoeG1pbiA+IHRoaXN4KSB4bWluID0gdGhpc3g7XG5cdFx0XHRcdFx0XHRcdGlmKHhtYXggPCB0aGlzeCkgeG1heCA9IHRoaXN4O1xuXHRcdFx0XHRcdFx0XHR0d2lueCArPSB0aGlzeDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHhtaWQgPSAoKGQudGFyZ2V0LnggKyB0d2lueCkgLyAodHdpbnMubGVuZ3RoKzEpKTtcblx0XHRcdFx0XHRcdGxldCB5bWlkID0gKChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkgLyAyKTtcblxuXHRcdFx0XHRcdFx0bGV0IHhoYmFyID0gXCJcIjtcblx0XHRcdFx0XHRcdGlmKHhtaW4gPT09IGQudGFyZ2V0LnggJiYgZC50YXJnZXQuZGF0YS5tenR3aW4pIHtcblx0XHRcdFx0XHRcdFx0Ly8gaG9yaXpvbnRhbCBiYXIgZm9yIG16dHdpbnNcblx0XHRcdFx0XHRcdFx0bGV0IHh4ID0gKHhtaWQgKyBkLnRhcmdldC54KS8yO1xuXHRcdFx0XHRcdFx0XHRsZXQgeXkgPSAoeW1pZCArIChkLnRhcmdldC55LW9wdHMuc3ltYm9sX3NpemUvMikpLzI7XG5cdFx0XHRcdFx0XHRcdHhoYmFyID0gXCJNXCIgKyB4eCArIFwiLFwiICsgeXkgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XCJMXCIgKyAoeG1pZCArICh4bWlkLXh4KSkgKyBcIiBcIiArIHl5O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJNXCIgKyAoZC5zb3VyY2UueCkgKyBcIixcIiArIChkLnNvdXJjZS55ICkgK1xuXHRcdFx0XHRcdFx0XHQgICBcIlZcIiArIHltaWQgK1xuXHRcdFx0XHRcdFx0XHQgICBcIkhcIiArIHhtaWQgK1xuXHRcdFx0XHRcdFx0XHQgICBcIkxcIiArIChkLnRhcmdldC54KSArIFwiIFwiICsgKGQudGFyZ2V0Lnktb3B0cy5zeW1ib2xfc2l6ZS8yKSArXG5cdFx0XHRcdFx0XHRcdCAgIHhoYmFyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKGQuc291cmNlLmRhdGEubW90aGVyKSB7ICAgLy8gY2hlY2sgcGFyZW50cyBkZXB0aCB0byBzZWUgaWYgdGhleSBhcmUgYXQgdGhlIHNhbWUgbGV2ZWwgaW4gdGhlIHRyZWVcblx0XHRcdFx0XHRsZXQgbWEgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgZC5zb3VyY2UuZGF0YS5tb3RoZXIubmFtZSk7XG5cdFx0XHRcdFx0bGV0IHBhID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGQuc291cmNlLmRhdGEuZmF0aGVyLm5hbWUpO1xuXG5cdFx0XHRcdFx0aWYobWEuZGVwdGggIT09IHBhLmRlcHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJNXCIgKyAoZC5zb3VyY2UueCkgKyBcIixcIiArICgobWEueSArIHBhLnkpIC8gMikgK1xuXHRcdFx0XHRcdFx0XHQgICBcIkhcIiArIChkLnRhcmdldC54KSArXG5cdFx0XHRcdFx0XHRcdCAgIFwiVlwiICsgKGQudGFyZ2V0LnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBcIk1cIiArIChkLnNvdXJjZS54KSArIFwiLFwiICsgKGQuc291cmNlLnkgKSArXG5cdFx0XHRcdFx0ICAgXCJWXCIgKyAoKGQuc291cmNlLnkgKyBkLnRhcmdldC55KSAvIDIpICtcblx0XHRcdFx0XHQgICBcIkhcIiArIChkLnRhcmdldC54KSArXG5cdFx0XHRcdFx0ICAgXCJWXCIgKyAoZC50YXJnZXQueSk7XG5cdFx0XHR9KTtcblxuXHQvLyBkcmF3IHByb2JhbmQgYXJyb3dcblx0bGV0IHByb2JhbmRJZHggID0gcGVkaWdyZWVfdXRpbHMuZ2V0UHJvYmFuZEluZGV4KG9wdHMuZGF0YXNldCk7XG5cdGlmKHR5cGVvZiBwcm9iYW5kSWR4ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGxldCBwcm9iYW5kTm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBvcHRzLmRhdGFzZXRbcHJvYmFuZElkeF0ubmFtZSk7XG5cdFx0bGV0IHRyaWlkID0gXCJ0cmlhbmdsZVwiK3BlZGlncmVlX3V0aWxzLm1ha2VpZCgzKTtcblx0XHRwZWQuYXBwZW5kKFwic3ZnOmRlZnNcIikuYXBwZW5kKFwic3ZnOm1hcmtlclwiKVx0Ly8gYXJyb3cgaGVhZFxuXHRcdFx0LmF0dHIoXCJpZFwiLCB0cmlpZClcblx0XHRcdC5hdHRyKFwicmVmWFwiLCA2KVxuXHRcdFx0LmF0dHIoXCJyZWZZXCIsIDYpXG5cdFx0XHQuYXR0cihcIm1hcmtlcldpZHRoXCIsIDIwKVxuXHRcdFx0LmF0dHIoXCJtYXJrZXJIZWlnaHRcIiwgMjApXG5cdFx0XHQuYXR0cihcIm9yaWVudFwiLCBcImF1dG9cIilcblx0XHRcdC5hcHBlbmQoXCJwYXRoXCIpXG5cdFx0XHQuYXR0cihcImRcIiwgXCJNIDAgMCAxMiA2IDAgMTIgMyA2XCIpXG5cdFx0XHQuc3R5bGUoXCJmaWxsXCIsIFwiYmxhY2tcIik7XG5cblx0XHRwZWQuYXBwZW5kKFwibGluZVwiKVxuXHRcdFx0LmF0dHIoXCJ4MVwiLCBwcm9iYW5kTm9kZS54LW9wdHMuc3ltYm9sX3NpemUpXG5cdFx0XHQuYXR0cihcInkxXCIsIHByb2JhbmROb2RlLnkrb3B0cy5zeW1ib2xfc2l6ZSlcblx0XHRcdC5hdHRyKFwieDJcIiwgcHJvYmFuZE5vZGUueC1vcHRzLnN5bWJvbF9zaXplLzIpXG5cdFx0XHQuYXR0cihcInkyXCIsIHByb2JhbmROb2RlLnkrb3B0cy5zeW1ib2xfc2l6ZS8yKVxuXHRcdFx0LmF0dHIoXCJzdHJva2Utd2lkdGhcIiwgMSlcblx0XHRcdC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcblx0XHRcdC5hdHRyKFwibWFya2VyLWVuZFwiLCBcInVybCgjXCIrdHJpaWQrXCIpXCIpO1xuXHR9XG5cdC8vIGRyYWcgYW5kIHpvb21cblx0em9vbSA9IGQzLnpvb20oKVxuXHQgIC5zY2FsZUV4dGVudChbb3B0cy56b29tSW4sIG9wdHMuem9vbU91dF0pXG5cdCAgLm9uKCd6b29tJywgem9vbUZuKTtcblxuXHRmdW5jdGlvbiB6b29tRm4oZXZlbnQpIHtcblx0XHRsZXQgdCA9IGV2ZW50LnRyYW5zZm9ybTtcblx0XHRpZihwZWRpZ3JlZV91dGlscy5pc0lFKCkgJiYgdC54LnRvU3RyaW5nKCkubGVuZ3RoID4gMTApXHQvLyBJRSBmaXggZm9yIGRyYWcgb2ZmIHNjcmVlblxuXHRcdFx0cmV0dXJuO1xuXHRcdGxldCBwb3MgPSBbKHQueCArIHBhcnNlSW50KHh0cmFuc2Zvcm0pKSwgKHQueSArIHBhcnNlSW50KHl0cmFuc2Zvcm0pKV07XG5cdFx0aWYodC5rID09IDEpIHtcblx0XHRcdHBlZGNhY2hlLnNldHBvc2l0aW9uKG9wdHMsIHBvc1swXSwgcG9zWzFdKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cGVkY2FjaGUuc2V0cG9zaXRpb24ob3B0cywgcG9zWzBdLCBwb3NbMV0sIHQuayk7XG5cdFx0fVxuXHRcdHBlZC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBwb3NbMF0gKyAnLCcgKyBwb3NbMV0gKyAnKSBzY2FsZSgnICsgdC5rICsgJyknKTtcblx0fVxuXHRzdmcuY2FsbCh6b29tKTtcblx0cmV0dXJuIG9wdHM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZV9lcnIoZXJyKSB7XG5cdGNvbnNvbGUuZXJyb3IoZXJyKTtcblx0cmV0dXJuIG5ldyBFcnJvcihlcnIpO1xufVxuXG4vLyB2YWxpZGF0ZSBwZWRpZ3JlZSBkYXRhXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVfcGVkaWdyZWUob3B0cyl7XG5cdGlmKG9wdHMudmFsaWRhdGUpIHtcblx0XHRpZiAodHlwZW9mIG9wdHMudmFsaWRhdGUgPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWYob3B0cy5ERUJVRylcblx0XHRcdFx0Y29uc29sZS5sb2coJ0NBTExJTkcgQ09ORklHVVJFRCBWQUxJREFUSU9OIEZVTkNUSU9OJyk7XG5cdFx0XHRyZXR1cm4gb3B0cy52YWxpZGF0ZS5jYWxsKHRoaXMsIG9wdHMpO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIGNvbnNpc3RlbmN5IG9mIHBhcmVudHMgc2V4XG5cdFx0bGV0IHVuaXF1ZW5hbWVzID0gW107XG5cdFx0bGV0IGZhbWlkcyA9IFtdO1xuXHRcdGxldCBkaXNwbGF5X25hbWU7XG5cdFx0Zm9yKGxldCBwPTA7IHA8b3B0cy5kYXRhc2V0Lmxlbmd0aDsgcCsrKSB7XG5cdFx0XHRpZighcC5oaWRkZW4pIHtcblx0XHRcdFx0aWYob3B0cy5kYXRhc2V0W3BdLm1vdGhlciB8fCBvcHRzLmRhdGFzZXRbcF0uZmF0aGVyKSB7XG5cdFx0XHRcdFx0ZGlzcGxheV9uYW1lID0gb3B0cy5kYXRhc2V0W3BdLmRpc3BsYXlfbmFtZTtcblx0XHRcdFx0XHRpZighZGlzcGxheV9uYW1lKVxuXHRcdFx0XHRcdFx0ZGlzcGxheV9uYW1lID0gJ3VubmFtZWQnO1xuXHRcdFx0XHRcdGRpc3BsYXlfbmFtZSArPSAnIChJbmRpdklEOiAnK29wdHMuZGF0YXNldFtwXS5uYW1lKycpJztcblx0XHRcdFx0XHRsZXQgbW90aGVyID0gb3B0cy5kYXRhc2V0W3BdLm1vdGhlcjtcblx0XHRcdFx0XHRsZXQgZmF0aGVyID0gb3B0cy5kYXRhc2V0W3BdLmZhdGhlcjtcblx0XHRcdFx0XHRpZighbW90aGVyIHx8ICFmYXRoZXIpIHtcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ01pc3NpbmcgcGFyZW50IGZvciAnK2Rpc3BsYXlfbmFtZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IG1pZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUob3B0cy5kYXRhc2V0LCBtb3RoZXIpO1xuXHRcdFx0XHRcdGxldCBmaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKG9wdHMuZGF0YXNldCwgZmF0aGVyKTtcblx0XHRcdFx0XHRpZihtaWR4ID09PSAtMSlcblx0XHRcdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ1RoZSBtb3RoZXIgKEluZGl2SUQ6ICcrbW90aGVyKycpIG9mIGZhbWlseSBtZW1iZXIgJytcblx0XHRcdFx0XHRcdFx0XHRcdFx0IGRpc3BsYXlfbmFtZSsnIGlzIG1pc3NpbmcgZnJvbSB0aGUgcGVkaWdyZWUuJyk7XG5cdFx0XHRcdFx0aWYoZmlkeCA9PT0gLTEpXG5cdFx0XHRcdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdUaGUgZmF0aGVyIChJbmRpdklEOiAnK2ZhdGhlcisnKSBvZiBmYW1pbHkgbWVtYmVyICcrXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCBkaXNwbGF5X25hbWUrJyBpcyBtaXNzaW5nIGZyb20gdGhlIHBlZGlncmVlLicpO1xuXHRcdFx0XHRcdGlmKG9wdHMuZGF0YXNldFttaWR4XS5zZXggIT09IFwiRlwiKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihcIlRoZSBtb3RoZXIgb2YgZmFtaWx5IG1lbWJlciBcIitkaXNwbGF5X25hbWUrXG5cdFx0XHRcdFx0XHRcdFx0XCIgaXMgbm90IHNwZWNpZmllZCBhcyBmZW1hbGUuIEFsbCBtb3RoZXJzIGluIHRoZSBwZWRpZ3JlZSBtdXN0IGhhdmUgc2V4IHNwZWNpZmllZCBhcyAnRicuXCIpO1xuXHRcdFx0XHRcdGlmKG9wdHMuZGF0YXNldFtmaWR4XS5zZXggIT09IFwiTVwiKVxuXHRcdFx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihcIlRoZSBmYXRoZXIgb2YgZmFtaWx5IG1lbWJlciBcIitkaXNwbGF5X25hbWUrXG5cdFx0XHRcdFx0XHRcdFx0XCIgaXMgbm90IHNwZWNpZmllZCBhcyBtYWxlLiBBbGwgZmF0aGVycyBpbiB0aGUgcGVkaWdyZWUgbXVzdCBoYXZlIHNleCBzcGVjaWZpZWQgYXMgJ00nLlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRcblx0XHRcdGlmKCFvcHRzLmRhdGFzZXRbcF0ubmFtZSlcblx0XHRcdFx0dGhyb3cgY3JlYXRlX2VycihkaXNwbGF5X25hbWUrJyBoYXMgbm8gSW5kaXZJRC4nKTtcblx0XHRcdGlmKCQuaW5BcnJheShvcHRzLmRhdGFzZXRbcF0ubmFtZSwgdW5pcXVlbmFtZXMpID4gLTEpXG5cdFx0XHRcdHRocm93IGNyZWF0ZV9lcnIoJ0luZGl2SUQgZm9yIGZhbWlseSBtZW1iZXIgJytkaXNwbGF5X25hbWUrJyBpcyBub3QgdW5pcXVlLicpO1xuXHRcdFx0dW5pcXVlbmFtZXMucHVzaChvcHRzLmRhdGFzZXRbcF0ubmFtZSk7XG5cblx0XHRcdGlmKCQuaW5BcnJheShvcHRzLmRhdGFzZXRbcF0uZmFtaWQsIGZhbWlkcykgPT09IC0xICYmIG9wdHMuZGF0YXNldFtwXS5mYW1pZCkge1xuXHRcdFx0XHRmYW1pZHMucHVzaChvcHRzLmRhdGFzZXRbcF0uZmFtaWQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKGZhbWlkcy5sZW5ndGggPiAxKSB7XG5cdFx0XHR0aHJvdyBjcmVhdGVfZXJyKCdNb3JlIHRoYW4gb25lIGZhbWlseSBmb3VuZDogJytmYW1pZHMuam9pbihcIiwgXCIpKycuJyk7XG5cdFx0fVxuXHRcdC8vIHdhcm4gaWYgdGhlcmUgaXMgYSBicmVhayBpbiB0aGUgcGVkaWdyZWVcblx0XHRsZXQgdWMgPSBwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChvcHRzLmRhdGFzZXQpO1xuXHRcdGlmKHVjLmxlbmd0aCA+IDApXG5cdFx0XHRjb25zb2xlLndhcm4oXCJpbmRpdmlkdWFscyB1bmNvbm5lY3RlZCB0byBwZWRpZ3JlZSBcIiwgdWMpO1xuXHR9XG59XG5cbi8vYWRvcHRlZCBpbi9vdXQgYnJhY2tldHNcbmZ1bmN0aW9uIGdldF9icmFja2V0KGR4LCBkeSwgaW5kZW50LCBvcHRzKSB7XG5cdHJldHVybiBcdFwiTVwiICsgKGR4K2luZGVudCkgKyBcIixcIiArIGR5ICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIGR5ICtcblx0XHRcdFwiTFwiICsgZHggKyBcIiBcIiArIChkeSsob3B0cy5zeW1ib2xfc2l6ZSAqICAxLjI4KSkgK1xuXHRcdFx0XCJMXCIgKyBkeCArIFwiIFwiICsgKGR5KyhvcHRzLnN5bWJvbF9zaXplICogIDEuMjgpKSArXG5cdFx0XHRcIkxcIiArIChkeCtpbmRlbnQpICsgXCIsXCIgKyAoZHkrKG9wdHMuc3ltYm9sX3NpemUgKiAgMS4yOCkpXG59XG5cbi8vIGNoZWNrIGlmIHRoZSBvYmplY3QgY29udGFpbnMgYSBrZXkgd2l0aCBhIGdpdmVuIHByZWZpeFxuZnVuY3Rpb24gcHJlZml4SW5PYmoocHJlZml4LCBvYmopIHtcblx0bGV0IGZvdW5kID0gZmFsc2U7XG5cdGlmKG9iailcblx0XHQkLmVhY2gob2JqLCBmdW5jdGlvbihrLCBfbil7XG5cdFx0XHRpZihrLmluZGV4T2YocHJlZml4K1wiX1wiKSA9PT0gMCB8fCBrID09PSBwcmVmaXgpIHtcblx0XHRcdFx0Zm91bmQgPSB0cnVlO1xuXHRcdFx0XHRyZXR1cm4gZm91bmQ7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdHJldHVybiBmb3VuZDtcbn1cblxuLy8gY2hlY2sgZm9yIGNyb3NzaW5nIG9mIHBhcnRuZXIgbGluZXNcbmZ1bmN0aW9uIGNoZWNrX3B0cl9saW5rcyhvcHRzLCBwdHJMaW5rTm9kZXMpe1xuXHRmb3IobGV0IGE9MDsgYTxwdHJMaW5rTm9kZXMubGVuZ3RoOyBhKyspIHtcblx0XHRsZXQgY2xhc2ggPSBjaGVja19wdHJfbGlua19jbGFzaGVzKG9wdHMsIHB0ckxpbmtOb2Rlc1thXSk7XG5cdFx0aWYoY2xhc2gpXG5cdFx0XHRjb25zb2xlLmxvZyhcIkNMQVNIIDo6IFwiK3B0ckxpbmtOb2Rlc1thXS5tb3RoZXIuZGF0YS5uYW1lK1wiIFwiK3B0ckxpbmtOb2Rlc1thXS5mYXRoZXIuZGF0YS5uYW1lLCBjbGFzaCk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrX3B0cl9saW5rX2NsYXNoZXMob3B0cywgYW5vZGUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbGF0dGVuTm9kZXMgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgbW90aGVyLCBmYXRoZXI7XG5cdGlmKCduYW1lJyBpbiBhbm9kZSkge1xuXHRcdGFub2RlID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShmbGF0dGVuTm9kZXMsIGFub2RlLm5hbWUpO1xuXHRcdGlmKCEoJ21vdGhlcicgaW4gYW5vZGUuZGF0YSkpXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRtb3RoZXIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXR0ZW5Ob2RlcywgYW5vZGUuZGF0YS5tb3RoZXIpO1xuXHRcdGZhdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdHRlbk5vZGVzLCBhbm9kZS5kYXRhLmZhdGhlcik7XG5cdH0gZWxzZSB7XG5cdFx0bW90aGVyID0gYW5vZGUubW90aGVyO1xuXHRcdGZhdGhlciA9IGFub2RlLmZhdGhlcjtcblx0fVxuXG5cdGxldCB4MSA9IChtb3RoZXIueCA8IGZhdGhlci54ID8gbW90aGVyLnggOiBmYXRoZXIueCk7XG5cdGxldCB4MiA9IChtb3RoZXIueCA8IGZhdGhlci54ID8gZmF0aGVyLnggOiBtb3RoZXIueCk7XG5cdGxldCBkeSA9IG1vdGhlci55O1xuXG5cdC8vIGlkZW50aWZ5IGNsYXNoZXMgd2l0aCBvdGhlciBub2RlcyBhdCB0aGUgc2FtZSBkZXB0aFxuXHRsZXQgY2xhc2ggPSAkLm1hcChmbGF0dGVuTm9kZXMsIGZ1bmN0aW9uKGJub2RlLCBfaSl7XG5cdFx0cmV0dXJuICFibm9kZS5kYXRhLmhpZGRlbiAmJlxuXHRcdFx0XHRibm9kZS5kYXRhLm5hbWUgIT09IG1vdGhlci5kYXRhLm5hbWUgJiYgIGJub2RlLmRhdGEubmFtZSAhPT0gZmF0aGVyLmRhdGEubmFtZSAmJlxuXHRcdFx0XHRibm9kZS55ID09IGR5ICYmIGJub2RlLnggPiB4MSAmJiBibm9kZS54IDwgeDIgPyBibm9kZS54IDogbnVsbDtcblx0fSk7XG5cdHJldHVybiBjbGFzaC5sZW5ndGggPiAwID8gY2xhc2ggOiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRfc3ZnX2RpbWVuc2lvbnMob3B0cykge1xuXHRyZXR1cm4geyd3aWR0aCcgOiAocGJ1dHRvbnMuaXNfZnVsbHNjcmVlbigpPyB3aW5kb3cuaW5uZXJXaWR0aCAgOiBvcHRzLndpZHRoKSxcblx0XHRcdCdoZWlnaHQnOiAocGJ1dHRvbnMuaXNfZnVsbHNjcmVlbigpPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBvcHRzLmhlaWdodCl9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X3RyZWVfZGltZW5zaW9ucyhvcHRzKSB7XG5cdC8vIC8gZ2V0IHNjb3JlIGF0IGVhY2ggZGVwdGggdXNlZCB0byBhZGp1c3Qgbm9kZSBzZXBhcmF0aW9uXG5cdGxldCBzdmdfZGltZW5zaW9ucyA9IGdldF9zdmdfZGltZW5zaW9ucyhvcHRzKTtcblx0bGV0IG1heHNjb3JlID0gMDtcblx0bGV0IGdlbmVyYXRpb24gPSB7fTtcblx0Zm9yKGxldCBpPTA7IGk8b3B0cy5kYXRhc2V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0bGV0IGRlcHRoID0gcGVkaWdyZWVfdXRpbHMuZ2V0RGVwdGgob3B0cy5kYXRhc2V0LCBvcHRzLmRhdGFzZXRbaV0ubmFtZSk7XG5cdFx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4ob3B0cy5kYXRhc2V0LCBvcHRzLmRhdGFzZXRbaV0pO1xuXG5cdFx0Ly8gc2NvcmUgYmFzZWQgb24gbm8uIG9mIGNoaWxkcmVuIGFuZCBpZiBwYXJlbnQgZGVmaW5lZFxuXHRcdGxldCBzY29yZSA9IDEgKyAoY2hpbGRyZW4ubGVuZ3RoID4gMCA/IDAuNTUrKGNoaWxkcmVuLmxlbmd0aCowLjI1KSA6IDApICsgKG9wdHMuZGF0YXNldFtpXS5mYXRoZXIgPyAwLjI1IDogMCk7XG5cdFx0aWYoZGVwdGggaW4gZ2VuZXJhdGlvbilcblx0XHRcdGdlbmVyYXRpb25bZGVwdGhdICs9IHNjb3JlO1xuXHRcdGVsc2Vcblx0XHRcdGdlbmVyYXRpb25bZGVwdGhdID0gc2NvcmU7XG5cblx0XHRpZihnZW5lcmF0aW9uW2RlcHRoXSA+IG1heHNjb3JlKVxuXHRcdFx0bWF4c2NvcmUgPSBnZW5lcmF0aW9uW2RlcHRoXTtcblx0fVxuXG5cdGxldCBtYXhfZGVwdGggPSBPYmplY3Qua2V5cyhnZW5lcmF0aW9uKS5sZW5ndGgqb3B0cy5zeW1ib2xfc2l6ZSozLjU7XG5cdGxldCB0cmVlX3dpZHRoID0gIChzdmdfZGltZW5zaW9ucy53aWR0aCAtIG9wdHMuc3ltYm9sX3NpemUgPiBtYXhzY29yZSpvcHRzLnN5bWJvbF9zaXplKjEuNjUgP1xuXHRcdFx0XHRcdCAgIHN2Z19kaW1lbnNpb25zLndpZHRoIC0gb3B0cy5zeW1ib2xfc2l6ZSA6IG1heHNjb3JlKm9wdHMuc3ltYm9sX3NpemUqMS42NSk7XG5cdGxldCB0cmVlX2hlaWdodCA9IChzdmdfZGltZW5zaW9ucy5oZWlnaHQgLSBvcHRzLnN5bWJvbF9zaXplID4gbWF4X2RlcHRoID9cblx0XHRcdFx0XHQgICBzdmdfZGltZW5zaW9ucy5oZWlnaHQgLSBvcHRzLnN5bWJvbF9zaXplIDogbWF4X2RlcHRoKTtcblx0cmV0dXJuIHsnd2lkdGgnOiB0cmVlX3dpZHRoLCAnaGVpZ2h0JzogdHJlZV9oZWlnaHR9O1xufVxuXG4vLyBncm91cCB0b3BfbGV2ZWwgbm9kZXMgYnkgdGhlaXIgcGFydG5lcnNcbmZ1bmN0aW9uIGdyb3VwX3RvcF9sZXZlbChkYXRhc2V0KSB7XG5cdC8vIGxldCB0b3BfbGV2ZWwgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbih2YWwsIGkpe3JldHVybiAndG9wX2xldmVsJyBpbiB2YWwgJiYgdmFsLnRvcF9sZXZlbCA/IHZhbCA6IG51bGw7fSk7XG5cdC8vIGNhbGN1bGF0ZSB0b3BfbGV2ZWwgbm9kZXNcblx0Zm9yKGxldCBpPTA7aTxkYXRhc2V0Lmxlbmd0aDtpKyspIHtcblx0XHRpZihwZWRpZ3JlZV91dGlscy5nZXREZXB0aChkYXRhc2V0LCBkYXRhc2V0W2ldLm5hbWUpID09IDIpXG5cdFx0XHRkYXRhc2V0W2ldLnRvcF9sZXZlbCA9IHRydWU7XG5cdH1cblxuXHRsZXQgdG9wX2xldmVsID0gW107XG5cdGxldCB0b3BfbGV2ZWxfc2VlbiA9IFtdO1xuXHRmb3IobGV0IGk9MDtpPGRhdGFzZXQubGVuZ3RoO2krKykge1xuXHRcdGxldCBub2RlID0gZGF0YXNldFtpXTtcblx0XHRpZigndG9wX2xldmVsJyBpbiBub2RlICYmICQuaW5BcnJheShub2RlLm5hbWUsIHRvcF9sZXZlbF9zZWVuKSA9PSAtMSl7XG5cdFx0XHR0b3BfbGV2ZWxfc2Vlbi5wdXNoKG5vZGUubmFtZSk7XG5cdFx0XHR0b3BfbGV2ZWwucHVzaChub2RlKTtcblx0XHRcdGxldCBwdHJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0X3BhcnRuZXJzKGRhdGFzZXQsIG5vZGUpO1xuXHRcdFx0Zm9yKGxldCBqPTA7IGo8cHRycy5sZW5ndGg7IGorKyl7XG5cdFx0XHRcdGlmKCQuaW5BcnJheShwdHJzW2pdLCB0b3BfbGV2ZWxfc2VlbikgPT0gLTEpIHtcblx0XHRcdFx0XHR0b3BfbGV2ZWxfc2Vlbi5wdXNoKHB0cnNbal0pO1xuXHRcdFx0XHRcdHRvcF9sZXZlbC5wdXNoKHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZGF0YXNldCwgcHRyc1tqXSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0bGV0IG5ld2RhdGFzZXQgPSAkLm1hcChkYXRhc2V0LCBmdW5jdGlvbih2YWwsIF9pKXtyZXR1cm4gJ3RvcF9sZXZlbCcgaW4gdmFsICYmIHZhbC50b3BfbGV2ZWwgPyBudWxsIDogdmFsO30pO1xuXHRmb3IgKGxldCBpID0gdG9wX2xldmVsLmxlbmd0aDsgaSA+IDA7IC0taSlcblx0XHRuZXdkYXRhc2V0LnVuc2hpZnQodG9wX2xldmVsW2ktMV0pO1xuXHRyZXR1cm4gbmV3ZGF0YXNldDtcbn1cblxuLy8gZ2V0IGhlaWdodCBpbiBwaXhlbHNcbmZ1bmN0aW9uIGdldFB4KG9wdHMpe1xuXHRsZXQgZW1WYWwgPSBvcHRzLmZvbnRfc2l6ZTtcblx0aWYgKGVtVmFsID09PSBwYXJzZUludChlbVZhbCwgMTApKSAvLyB0ZXN0IGlmIGludGVnZXJcblx0XHRyZXR1cm4gZW1WYWw7XG5cblx0aWYoZW1WYWwuaW5kZXhPZihcInB4XCIpID4gLTEpXG5cdFx0cmV0dXJuIGVtVmFsLnJlcGxhY2UoJ3B4JywgJycpO1xuXHRlbHNlIGlmKGVtVmFsLmluZGV4T2YoXCJlbVwiKSA9PT0gLTEpXG5cdFx0cmV0dXJuIGVtVmFsO1xuXHRlbVZhbCA9IHBhcnNlRmxvYXQoZW1WYWwucmVwbGFjZSgnZW0nLCAnJykpO1xuXHRyZXR1cm4gKHBhcnNlRmxvYXQoZ2V0Q29tcHV0ZWRTdHlsZSgkKCcjJytvcHRzLnRhcmdldERpdikuZ2V0KDApKS5mb250U2l6ZSkqZW1WYWwpLTEuMDtcbn1cblxuLy8gQWRkIGxhYmVsXG5mdW5jdGlvbiBhZGRMYWJlbChvcHRzLCBub2RlLCBzaXplLCBmeCwgZnksIGZ0ZXh0LCBjbGFzc19sYWJlbCkge1xuXHRub2RlLmZpbHRlcihmdW5jdGlvbiAoZCkge1xuXHRcdHJldHVybiBkLmRhdGEuaGlkZGVuICYmICFvcHRzLkRFQlVHID8gZmFsc2UgOiB0cnVlO1xuXHR9KS5hcHBlbmQoXCJ0ZXh0XCIpXG5cdC5hdHRyKFwiY2xhc3NcIiwgY2xhc3NfbGFiZWwgKyAnIHBlZF9sYWJlbCcgfHwgXCJwZWRfbGFiZWxcIilcblx0LmF0dHIoXCJ4XCIsIGZ4KVxuXHQuYXR0cihcInlcIiwgZnkpXG5cdC8vIC5hdHRyKFwiZHlcIiwgc2l6ZSlcblx0LmF0dHIoXCJmb250LWZhbWlseVwiLCBvcHRzLmZvbnRfZmFtaWx5KVxuXHQuYXR0cihcImZvbnQtc2l6ZVwiLCBvcHRzLmZvbnRfc2l6ZSlcblx0LmF0dHIoXCJmb250LXdlaWdodFwiLCBvcHRzLmZvbnRfd2VpZ2h0KVxuXHQudGV4dChmdGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWJ1aWxkKG9wdHMpIHtcblx0JChcIiNcIitvcHRzLnRhcmdldERpdikuZW1wdHkoKTtcblx0cGVkY2FjaGUuaW5pdF9jYWNoZShvcHRzKTtcblx0dHJ5IHtcblx0XHRidWlsZChvcHRzKTtcblx0fSBjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHR0aHJvdyBlO1xuXHR9XG5cblx0dHJ5IHtcblx0XHR0ZW1wbGF0ZXMudXBkYXRlKG9wdHMpO1xuXHR9IGNhdGNoKGUpIHtcblx0XHQvLyB0ZW1wbGF0ZXMgbm90IGRlY2xhcmVkXG5cdH1cbn1cblxuLy8gYWRkIGNoaWxkcmVuIHRvIGEgZ2l2ZW4gbm9kZVxuZXhwb3J0IGZ1bmN0aW9uIGFkZGNoaWxkKGRhdGFzZXQsIG5vZGUsIHNleCwgbmNoaWxkLCB0d2luX3R5cGUpIHtcblx0aWYodHdpbl90eXBlICYmICQuaW5BcnJheSh0d2luX3R5cGUsIFsgXCJtenR3aW5cIiwgXCJkenR3aW5cIiBdICkgPT09IC0xKVxuXHRcdHJldHVybiBuZXcgRXJyb3IoXCJJTlZBTElEIFRXSU4gVFlQRSBTRVQ6IFwiK3R3aW5fdHlwZSk7XG5cblx0aWYgKHR5cGVvZiBuY2hpbGQgPT09IHR5cGVvZiB1bmRlZmluZWQpXG5cdFx0bmNoaWxkID0gMTtcblx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgbm9kZSk7XG5cdGxldCBwdHJfbmFtZSwgaWR4O1xuXHRpZiAoY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG5cdFx0bGV0IHBhcnRuZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIG5vZGUsIG5vZGUuc2V4ID09PSAnRicgPyAnTSc6ICdGJywgbm9kZS5zZXggPT09ICdGJyk7XG5cdFx0cGFydG5lci5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdHB0cl9uYW1lID0gcGFydG5lci5uYW1lO1xuXHRcdGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpKzE7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IGMgPSBjaGlsZHJlblswXTtcblx0XHRwdHJfbmFtZSA9IChjLmZhdGhlciA9PT0gbm9kZS5uYW1lID8gYy5tb3RoZXIgOiBjLmZhdGhlcik7XG5cdFx0aWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGMubmFtZSk7XG5cdH1cblxuXHRsZXQgdHdpbl9pZDtcblx0aWYodHdpbl90eXBlKVxuXHRcdHR3aW5faWQgPSBnZXRVbmlxdWVUd2luSUQoZGF0YXNldCwgdHdpbl90eXBlKTtcblx0bGV0IG5ld2NoaWxkcmVuID0gW107XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgbmNoaWxkOyBpKyspIHtcblx0XHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogc2V4LFxuXHRcdFx0XHRcdCBcIm1vdGhlclwiOiAobm9kZS5zZXggPT09ICdGJyA/IG5vZGUubmFtZSA6IHB0cl9uYW1lKSxcblx0XHRcdFx0XHQgXCJmYXRoZXJcIjogKG5vZGUuc2V4ID09PSAnRicgPyBwdHJfbmFtZSA6IG5vZGUubmFtZSl9O1xuXHRcdGRhdGFzZXQuc3BsaWNlKGlkeCwgMCwgY2hpbGQpO1xuXG5cdFx0aWYodHdpbl90eXBlKVxuXHRcdFx0Y2hpbGRbdHdpbl90eXBlXSA9IHR3aW5faWQ7XG5cdFx0bmV3Y2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cdH1cblx0cmV0dXJuIG5ld2NoaWxkcmVuO1xufVxuXG4vL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZHNpYmxpbmcoZGF0YXNldCwgbm9kZSwgc2V4LCBhZGRfbGhzLCB0d2luX3R5cGUpIHtcblx0aWYodHdpbl90eXBlICYmICQuaW5BcnJheSh0d2luX3R5cGUsIFsgXCJtenR3aW5cIiwgXCJkenR3aW5cIiBdICkgPT09IC0xKVxuXHRcdHJldHVybiBuZXcgRXJyb3IoXCJJTlZBTElEIFRXSU4gVFlQRSBTRVQ6IFwiK3R3aW5fdHlwZSk7XG5cblx0bGV0IG5ld2JpZSA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBzZXh9O1xuXHRpZihub2RlLnRvcF9sZXZlbCkge1xuXHRcdG5ld2JpZS50b3BfbGV2ZWwgPSB0cnVlO1xuXHR9IGVsc2Uge1xuXHRcdG5ld2JpZS5tb3RoZXIgPSBub2RlLm1vdGhlcjtcblx0XHRuZXdiaWUuZmF0aGVyID0gbm9kZS5mYXRoZXI7XG5cdH1cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpO1xuXG5cdGlmKHR3aW5fdHlwZSkge1xuXHRcdHNldE16VHdpbihkYXRhc2V0LCBkYXRhc2V0W2lkeF0sIG5ld2JpZSwgdHdpbl90eXBlKTtcblx0fVxuXG5cdGlmKGFkZF9saHMpIHsgLy8gYWRkIHRvIExIU1xuXHRcdGlmKGlkeCA+IDApIGlkeC0tO1xuXHR9IGVsc2Vcblx0XHRpZHgrKztcblx0ZGF0YXNldC5zcGxpY2UoaWR4LCAwLCBuZXdiaWUpO1xuXHRyZXR1cm4gbmV3YmllO1xufVxuXG4vLyBzZXQgdHdvIHNpYmxpbmdzIGFzIHR3aW5zXG5mdW5jdGlvbiBzZXRNelR3aW4oZGF0YXNldCwgZDEsIGQyLCB0d2luX3R5cGUpIHtcblx0aWYoIWQxW3R3aW5fdHlwZV0pIHtcblx0XHRkMVt0d2luX3R5cGVdID0gZ2V0VW5pcXVlVHdpbklEKGRhdGFzZXQsIHR3aW5fdHlwZSk7XG5cdFx0aWYoIWQxW3R3aW5fdHlwZV0pXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0ZDJbdHdpbl90eXBlXSA9IGQxW3R3aW5fdHlwZV07XG5cdGlmKGQxLnlvYilcblx0XHRkMi55b2IgPSBkMS55b2I7XG5cdGlmKGQxLmFnZSAmJiAoZDEuc3RhdHVzID09IDAgfHwgIWQxLnN0YXR1cykpXG5cdFx0ZDIuYWdlID0gZDEuYWdlO1xuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuLy8gZ2V0IGEgbmV3IHVuaXF1ZSB0d2lucyBJRCwgbWF4IG9mIDEwIHR3aW5zIGluIGEgcGVkaWdyZWVcbmZ1bmN0aW9uIGdldFVuaXF1ZVR3aW5JRChkYXRhc2V0LCB0d2luX3R5cGUpIHtcblx0bGV0IG16ID0gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIFwiQVwiXTtcblx0Zm9yKGxldCBpPTA7IGk8ZGF0YXNldC5sZW5ndGg7IGkrKykge1xuXHRcdGlmKGRhdGFzZXRbaV1bdHdpbl90eXBlXSkge1xuXHRcdFx0bGV0IGlkeCA9IG16LmluZGV4T2YoZGF0YXNldFtpXVt0d2luX3R5cGVdKTtcblx0XHRcdGlmIChpZHggPiAtMSlcblx0XHRcdFx0bXouc3BsaWNlKGlkeCwgMSk7XG5cdFx0fVxuXHR9XG5cdGlmKG16Lmxlbmd0aCA+IDApXG5cdFx0cmV0dXJuIG16WzBdO1xuXHRyZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vLyBzeW5jIGF0dHJpYnV0ZXMgb2YgdHdpbnNcbmV4cG9ydCBmdW5jdGlvbiBzeW5jVHdpbnMoZGF0YXNldCwgZDEpIHtcblx0aWYoIWQxLm16dHdpbiAmJiAhZDEuZHp0d2luKVxuXHRcdHJldHVybjtcblx0bGV0IHR3aW5fdHlwZSA9IChkMS5tenR3aW4gPyBcIm16dHdpblwiIDogXCJkenR3aW5cIik7XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRsZXQgZDIgPSBkYXRhc2V0W2ldO1xuXHRcdGlmKGQyW3R3aW5fdHlwZV0gJiYgZDFbdHdpbl90eXBlXSA9PSBkMlt0d2luX3R5cGVdICYmIGQyLm5hbWUgIT09IGQxLm5hbWUpIHtcblx0XHRcdGlmKHR3aW5fdHlwZSA9PT0gXCJtenR3aW5cIilcblx0XHRcdCAgZDIuc2V4ID0gZDEuc2V4O1xuXHRcdFx0aWYoZDEueW9iKVxuXHRcdFx0XHRkMi55b2IgPSBkMS55b2I7XG5cdFx0XHRpZihkMS5hZ2UgJiYgKGQxLnN0YXR1cyA9PSAwIHx8ICFkMS5zdGF0dXMpKVxuXHRcdFx0XHRkMi5hZ2UgPSBkMS5hZ2U7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGNoZWNrIGludGVncml0eSB0d2luIHNldHRpbmdzXG5mdW5jdGlvbiBjaGVja1R3aW5zKGRhdGFzZXQpIHtcblx0bGV0IHR3aW5fdHlwZXMgPSBbXCJtenR3aW5cIiwgXCJkenR3aW5cIl07XG5cdGZvcihsZXQgaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspIHtcblx0XHRmb3IobGV0IGo9MDsgajx0d2luX3R5cGVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRsZXQgdHdpbl90eXBlID0gdHdpbl90eXBlc1tqXTtcblx0XHRcdGlmKGRhdGFzZXRbaV1bdHdpbl90eXBlXSkge1xuXHRcdFx0XHRsZXQgY291bnQgPSAwO1xuXHRcdFx0XHRmb3IobGV0IGo9MDsgajxkYXRhc2V0Lmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYoZGF0YXNldFtqXVt0d2luX3R5cGVdID09IGRhdGFzZXRbaV1bdHdpbl90eXBlXSlcblx0XHRcdFx0XHRcdGNvdW50Kys7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoY291bnQgPCAyKVxuXHRcdFx0XHRcdGRlbGV0ZSBkYXRhc2V0W2ldW1t0d2luX3R5cGVdXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cblxuLy8gYWRkIHBhcmVudHMgdG8gdGhlICdub2RlJ1xuZXhwb3J0IGZ1bmN0aW9uIGFkZHBhcmVudHMob3B0cywgZGF0YXNldCwgbmFtZSkge1xuXHRsZXQgbW90aGVyLCBmYXRoZXI7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdF90cmVlID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IHRyZWVfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBuYW1lKTtcblx0bGV0IG5vZGUgID0gdHJlZV9ub2RlLmRhdGE7XG5cdGxldCBkZXB0aCA9IHRyZWVfbm9kZS5kZXB0aDsgICAvLyBkZXB0aCBvZiB0aGUgbm9kZSBpbiByZWxhdGlvbiB0byB0aGUgcm9vdCAoZGVwdGggPSAxIGlzIGEgdG9wX2xldmVsIG5vZGUpXG5cblx0bGV0IHBpZCA9IC0xMDE7XG5cdGxldCBwdHJfbmFtZTtcblx0bGV0IGNoaWxkcmVuID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsQ2hpbGRyZW4oZGF0YXNldCwgbm9kZSk7XG5cdGlmKGNoaWxkcmVuLmxlbmd0aCA+IDApe1xuXHRcdHB0cl9uYW1lID0gY2hpbGRyZW5bMF0ubW90aGVyID09IG5vZGUubmFtZSA/IGNoaWxkcmVuWzBdLmZhdGhlciA6IGNoaWxkcmVuWzBdLm1vdGhlcjtcblx0XHRwaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgcHRyX25hbWUpLmRhdGEuaWQ7XG5cdH1cblxuXHRsZXQgaTtcblx0aWYoZGVwdGggPT0gMSkge1xuXHRcdG1vdGhlciA9IHtcIm5hbWVcIjogcGVkaWdyZWVfdXRpbHMubWFrZWlkKDQpLCBcInNleFwiOiBcIkZcIiwgXCJ0b3BfbGV2ZWxcIjogdHJ1ZX07XG5cdFx0ZmF0aGVyID0ge1wibmFtZVwiOiBwZWRpZ3JlZV91dGlscy5tYWtlaWQoNCksIFwic2V4XCI6IFwiTVwiLCBcInRvcF9sZXZlbFwiOiB0cnVlfTtcblx0XHRkYXRhc2V0LnNwbGljZSgwLCAwLCBtb3RoZXIpO1xuXHRcdGRhdGFzZXQuc3BsaWNlKDAsIDAsIGZhdGhlcik7XG5cblx0XHRmb3IoaT0wOyBpPGRhdGFzZXQubGVuZ3RoOyBpKyspe1xuXHRcdFx0aWYoZGF0YXNldFtpXS50b3BfbGV2ZWwgJiYgZGF0YXNldFtpXS5uYW1lICE9PSBtb3RoZXIubmFtZSAmJiBkYXRhc2V0W2ldLm5hbWUgIT09IGZhdGhlci5uYW1lKXtcblx0XHRcdFx0ZGVsZXRlIGRhdGFzZXRbaV0udG9wX2xldmVsO1xuXHRcdFx0XHRkYXRhc2V0W2ldLm5vcGFyZW50cyA9IHRydWU7XG5cdFx0XHRcdGRhdGFzZXRbaV0ubW90aGVyID0gbW90aGVyLm5hbWU7XG5cdFx0XHRcdGRhdGFzZXRbaV0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGxldCBub2RlX21vdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCB0cmVlX25vZGUuZGF0YS5tb3RoZXIpO1xuXHRcdGxldCBub2RlX2ZhdGhlciA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCB0cmVlX25vZGUuZGF0YS5mYXRoZXIpO1xuXHRcdGxldCBub2RlX3NpYnMgPSBwZWRpZ3JlZV91dGlscy5nZXRBbGxTaWJsaW5ncyhkYXRhc2V0LCBub2RlKTtcblxuXHRcdC8vIGxocyAmIHJocyBpZCdzIGZvciBzaWJsaW5ncyBvZiB0aGlzIG5vZGVcblx0XHRsZXQgcmlkID0gMTAwMDA7XG5cdFx0bGV0IGxpZCA9IHRyZWVfbm9kZS5kYXRhLmlkO1xuXHRcdGZvcihpPTA7IGk8bm9kZV9zaWJzLmxlbmd0aDsgaSsrKXtcblx0XHRcdGxldCBzaWQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZsYXRfdHJlZSwgbm9kZV9zaWJzW2ldLm5hbWUpLmRhdGEuaWQ7XG5cdFx0XHRpZihzaWQgPCByaWQgJiYgc2lkID4gdHJlZV9ub2RlLmRhdGEuaWQpXG5cdFx0XHRcdHJpZCA9IHNpZDtcblx0XHRcdGlmKHNpZCA8IGxpZClcblx0XHRcdFx0bGlkID0gc2lkO1xuXHRcdH1cblx0XHRsZXQgYWRkX2xocyA9IChsaWQgPj0gdHJlZV9ub2RlLmRhdGEuaWQgfHwgKHBpZCA9PSBsaWQgJiYgcmlkIDwgMTAwMDApKTtcblx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0Y29uc29sZS5sb2coJ2xpZD0nK2xpZCsnIHJpZD0nK3JpZCsnIG5pZD0nK3RyZWVfbm9kZS5kYXRhLmlkKycgQUREX0xIUz0nK2FkZF9saHMpO1xuXHRcdGxldCBtaWR4O1xuXHRcdGlmKCAoIWFkZF9saHMgJiYgbm9kZV9mYXRoZXIuZGF0YS5pZCA+IG5vZGVfbW90aGVyLmRhdGEuaWQpIHx8XG5cdFx0XHQoYWRkX2xocyAmJiBub2RlX2ZhdGhlci5kYXRhLmlkIDwgbm9kZV9tb3RoZXIuZGF0YS5pZCkgKVxuXHRcdFx0bWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLmZhdGhlcik7XG5cdFx0ZWxzZVxuXHRcdFx0bWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm1vdGhlcik7XG5cblx0XHRsZXQgcGFyZW50ID0gZGF0YXNldFttaWR4XTtcblx0XHRmYXRoZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHBhcmVudCwgJ00nLCBhZGRfbGhzKTtcblx0XHRtb3RoZXIgPSBhZGRzaWJsaW5nKGRhdGFzZXQsIHBhcmVudCwgJ0YnLCBhZGRfbGhzKTtcblxuXHRcdGxldCBmYWlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBmYXRoZXIubmFtZSk7XG5cdFx0bGV0IG1vaWR4ID0gcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIG1vdGhlci5uYW1lKTtcblx0XHRpZihmYWlkeCA+IG1vaWR4KSB7XHRcdFx0XHQgICAvLyBzd2l0Y2ggdG8gZW5zdXJlIGZhdGhlciBvbiBsaHMgb2YgbW90aGVyXG5cdFx0XHRsZXQgdG1wZmEgPSBkYXRhc2V0W2ZhaWR4XTtcblx0XHRcdGRhdGFzZXRbZmFpZHhdID0gZGF0YXNldFttb2lkeF07XG5cdFx0XHRkYXRhc2V0W21vaWR4XSA9IHRtcGZhO1xuXHRcdH1cblxuXHRcdGxldCBvcnBoYW5zID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWRvcHRlZFNpYmxpbmdzKGRhdGFzZXQsIG5vZGUpO1xuXHRcdGxldCBuaWQgPSB0cmVlX25vZGUuZGF0YS5pZDtcblx0XHRmb3IoaT0wOyBpPG9ycGhhbnMubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IG9pZCA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBvcnBoYW5zW2ldLm5hbWUpLmRhdGEuaWQ7XG5cdFx0XHRpZihvcHRzLkRFQlVHKVxuXHRcdFx0XHRjb25zb2xlLmxvZygnT1JQSEFOPScraSsnICcrb3JwaGFuc1tpXS5uYW1lKycgJysobmlkIDwgb2lkICYmIG9pZCA8IHJpZCkrJyBuaWQ9JytuaWQrJyBvaWQ9JytvaWQrJyByaWQ9JytyaWQpO1xuXHRcdFx0aWYoKGFkZF9saHMgfHwgbmlkIDwgb2lkKSAmJiBvaWQgPCByaWQpe1xuXHRcdFx0XHRsZXQgb2lkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBvcnBoYW5zW2ldLm5hbWUpO1xuXHRcdFx0XHRkYXRhc2V0W29pZHhdLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0XHRkYXRhc2V0W29pZHhdLmZhdGhlciA9IGZhdGhlci5uYW1lO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmKGRlcHRoID09IDIpIHtcblx0XHRtb3RoZXIudG9wX2xldmVsID0gdHJ1ZTtcblx0XHRmYXRoZXIudG9wX2xldmVsID0gdHJ1ZTtcblx0fSBlbHNlIGlmKGRlcHRoID4gMikge1xuXHRcdG1vdGhlci5ub3BhcmVudHMgPSB0cnVlO1xuXHRcdGZhdGhlci5ub3BhcmVudHMgPSB0cnVlO1xuXHR9XG5cdGxldCBpZHggPSBwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgbm9kZS5uYW1lKTtcblx0ZGF0YXNldFtpZHhdLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRkYXRhc2V0W2lkeF0uZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdGRlbGV0ZSBkYXRhc2V0W2lkeF0ubm9wYXJlbnRzO1xuXG5cdGlmKCdwYXJlbnRfbm9kZScgaW4gbm9kZSkge1xuXHRcdGxldCBwdHJfbm9kZSA9IGRhdGFzZXRbcGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIHB0cl9uYW1lKV07XG5cdFx0aWYoJ25vcGFyZW50cycgaW4gcHRyX25vZGUpIHtcblx0XHRcdHB0cl9ub2RlLm1vdGhlciA9IG1vdGhlci5uYW1lO1xuXHRcdFx0cHRyX25vZGUuZmF0aGVyID0gZmF0aGVyLm5hbWU7XG5cdFx0fVxuXHR9XG59XG5cbi8vIGFkZCBwYXJ0bmVyXG5leHBvcnQgZnVuY3Rpb24gYWRkcGFydG5lcihvcHRzLCBkYXRhc2V0LCBuYW1lKSB7XG5cdGxldCByb290ID0gcm9vdHNbb3B0cy50YXJnZXREaXZdO1xuXHRsZXQgZmxhdF90cmVlID0gcGVkaWdyZWVfdXRpbHMuZmxhdHRlbihyb290KTtcblx0bGV0IHRyZWVfbm9kZSA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZmxhdF90cmVlLCBuYW1lKTtcblxuXHRsZXQgcGFydG5lciA9IGFkZHNpYmxpbmcoZGF0YXNldCwgdHJlZV9ub2RlLmRhdGEsIHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gJ00nIDogJ0YnLCB0cmVlX25vZGUuZGF0YS5zZXggPT09ICdGJyk7XG5cdHBhcnRuZXIubm9wYXJlbnRzID0gdHJ1ZTtcblxuXHRsZXQgY2hpbGQgPSB7XCJuYW1lXCI6IHBlZGlncmVlX3V0aWxzLm1ha2VpZCg0KSwgXCJzZXhcIjogXCJNXCJ9O1xuXHRjaGlsZC5tb3RoZXIgPSAodHJlZV9ub2RlLmRhdGEuc2V4ID09PSAnRicgPyB0cmVlX25vZGUuZGF0YS5uYW1lIDogcGFydG5lci5uYW1lKTtcblx0Y2hpbGQuZmF0aGVyID0gKHRyZWVfbm9kZS5kYXRhLnNleCA9PT0gJ0YnID8gcGFydG5lci5uYW1lIDogdHJlZV9ub2RlLmRhdGEubmFtZSk7XG5cblx0bGV0IGlkeCA9IHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCB0cmVlX25vZGUuZGF0YS5uYW1lKSsyO1xuXHRkYXRhc2V0LnNwbGljZShpZHgsIDAsIGNoaWxkKTtcbn1cblxuLy8gZ2V0IGFkamFjZW50IG5vZGVzIGF0IHRoZSBzYW1lIGRlcHRoXG5mdW5jdGlvbiBhZGphY2VudF9ub2Rlcyhyb290LCBub2RlLCBleGNsdWRlcykge1xuXHRsZXQgZG5vZGVzID0gcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZXNBdERlcHRoKHBlZGlncmVlX3V0aWxzLmZsYXR0ZW4ocm9vdCksIG5vZGUuZGVwdGgsIGV4Y2x1ZGVzKTtcblx0bGV0IGxoc19ub2RlLCByaHNfbm9kZTtcblx0Zm9yKGxldCBpPTA7IGk8ZG5vZGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0aWYoZG5vZGVzW2ldLnggPCBub2RlLngpXG5cdFx0XHRsaHNfbm9kZSA9IGRub2Rlc1tpXTtcblx0XHRpZighcmhzX25vZGUgJiYgZG5vZGVzW2ldLnggPiBub2RlLngpXG5cdFx0XHRyaHNfbm9kZSA9IGRub2Rlc1tpXTtcblx0fVxuXHRyZXR1cm4gW2xoc19ub2RlLCByaHNfbm9kZV07XG59XG5cbi8vIGRlbGV0ZSBhIG5vZGUgYW5kIGRlc2NlbmRhbnRzXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlX25vZGVfZGF0YXNldChkYXRhc2V0LCBub2RlLCBvcHRzLCBvbkRvbmUpIHtcblx0bGV0IHJvb3QgPSByb290c1tvcHRzLnRhcmdldERpdl07XG5cdGxldCBmbm9kZXMgPSBwZWRpZ3JlZV91dGlscy5mbGF0dGVuKHJvb3QpO1xuXHRsZXQgZGVsZXRlcyA9IFtdO1xuXHRsZXQgaSwgajtcblxuXHQvLyBnZXQgZDMgZGF0YSBub2RlXG5cdGlmKG5vZGUuaWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGxldCBkM25vZGUgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2Rlcywgbm9kZS5uYW1lKTtcblx0XHRpZihkM25vZGUgIT09IHVuZGVmaW5lZClcblx0XHRcdG5vZGUgPSBkM25vZGUuZGF0YTtcblx0fVxuXG5cdGlmKG5vZGUucGFyZW50X25vZGUpIHtcblx0XHRmb3IoaT0wOyBpPG5vZGUucGFyZW50X25vZGUubGVuZ3RoOyBpKyspe1xuXHRcdFx0bGV0IHBhcmVudCA9IG5vZGUucGFyZW50X25vZGVbaV07XG5cdFx0XHRsZXQgcHMgPSBbcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwYXJlbnQubW90aGVyLm5hbWUpLFxuXHRcdFx0XHRcdCAgcGVkaWdyZWVfdXRpbHMuZ2V0Tm9kZUJ5TmFtZShkYXRhc2V0LCBwYXJlbnQuZmF0aGVyLm5hbWUpXTtcblx0XHRcdC8vIGRlbGV0ZSBwYXJlbnRzXG5cdFx0XHRmb3Ioaj0wOyBqPHBzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHBzW2pdLm5hbWUgPT09IG5vZGUubmFtZSB8fCBwc1tqXS5ub3BhcmVudHMgIT09IHVuZGVmaW5lZCB8fCBwc1tqXS50b3BfbGV2ZWwpIHtcblx0XHRcdFx0XHRkYXRhc2V0LnNwbGljZShwZWRpZ3JlZV91dGlscy5nZXRJZHhCeU5hbWUoZGF0YXNldCwgcHNbal0ubmFtZSksIDEpO1xuXHRcdFx0XHRcdGRlbGV0ZXMucHVzaChwc1tqXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bGV0IGNoaWxkcmVuID0gcGFyZW50LmNoaWxkcmVuO1xuXHRcdFx0bGV0IGNoaWxkcmVuX25hbWVzID0gJC5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uKHAsIF9pKXtyZXR1cm4gcC5uYW1lO30pO1xuXHRcdFx0Zm9yKGo9MDsgajxjaGlsZHJlbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRsZXQgY2hpbGQgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIGNoaWxkcmVuW2pdLm5hbWUpO1xuXHRcdFx0XHRpZihjaGlsZCl7XG5cdFx0XHRcdFx0Y2hpbGQubm9wYXJlbnRzID0gdHJ1ZTtcblx0XHRcdFx0XHRsZXQgcHRycyA9IHBlZGlncmVlX3V0aWxzLmdldF9wYXJ0bmVycyhkYXRhc2V0LCBjaGlsZCk7XG5cdFx0XHRcdFx0bGV0IHB0cjtcblx0XHRcdFx0XHRpZihwdHJzLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0XHRwdHIgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGRhdGFzZXQsIHB0cnNbMF0pO1xuXHRcdFx0XHRcdGlmKHB0ciAmJiBwdHIubW90aGVyICE9PSBjaGlsZC5tb3RoZXIpIHtcblx0XHRcdFx0XHRcdGNoaWxkLm1vdGhlciA9IHB0ci5tb3RoZXI7XG5cdFx0XHRcdFx0XHRjaGlsZC5mYXRoZXIgPSBwdHIuZmF0aGVyO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihwdHIpIHtcblx0XHRcdFx0XHRcdGxldCBjaGlsZF9ub2RlICA9IHBlZGlncmVlX3V0aWxzLmdldE5vZGVCeU5hbWUoZm5vZGVzLCBjaGlsZC5uYW1lKTtcblx0XHRcdFx0XHRcdGxldCBhZGogPSBhZGphY2VudF9ub2Rlcyhyb290LCBjaGlsZF9ub2RlLCBjaGlsZHJlbl9uYW1lcyk7XG5cdFx0XHRcdFx0XHRjaGlsZC5tb3RoZXIgPSBhZGpbMF0gPyBhZGpbMF0uZGF0YS5tb3RoZXIgOiAoYWRqWzFdID8gYWRqWzFdLmRhdGEubW90aGVyIDogbnVsbCk7XG5cdFx0XHRcdFx0XHRjaGlsZC5mYXRoZXIgPSBhZGpbMF0gPyBhZGpbMF0uZGF0YS5mYXRoZXIgOiAoYWRqWzFdID8gYWRqWzFdLmRhdGEuZmF0aGVyIDogbnVsbCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBjaGlsZC5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGRhdGFzZXQuc3BsaWNlKHBlZGlncmVlX3V0aWxzLmdldElkeEJ5TmFtZShkYXRhc2V0LCBub2RlLm5hbWUpLCAxKTtcblx0fVxuXG5cdC8vIGRlbGV0ZSBhbmNlc3RvcnNcblx0Y29uc29sZS5sb2coZGVsZXRlcyk7XG5cdGZvcihpPTA7IGk8ZGVsZXRlcy5sZW5ndGg7IGkrKykge1xuXHRcdGxldCBkZWwgPSBkZWxldGVzW2ldO1xuXHRcdGxldCBzaWJzID0gcGVkaWdyZWVfdXRpbHMuZ2V0QWxsU2libGluZ3MoZGF0YXNldCwgZGVsKTtcblx0XHRjb25zb2xlLmxvZygnREVMJywgZGVsLm5hbWUsIHNpYnMpO1xuXHRcdGlmKHNpYnMubGVuZ3RoIDwgMSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ2RlbCBzaWJzJywgZGVsLm5hbWUsIHNpYnMpO1xuXHRcdFx0bGV0IGRhdGFfbm9kZSAgPSBwZWRpZ3JlZV91dGlscy5nZXROb2RlQnlOYW1lKGZub2RlcywgZGVsLm5hbWUpO1xuXHRcdFx0bGV0IGFuY2VzdG9ycyA9IGRhdGFfbm9kZS5hbmNlc3RvcnMoKTtcblx0XHRcdGZvcihqPTA7IGo8YW5jZXN0b3JzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGFuY2VzdG9yc1tpXSk7XG5cdFx0XHRcdGlmKGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlcil7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ0RFTEVURSAnLCBhbmNlc3RvcnNbal0uZGF0YS5tb3RoZXIsIGFuY2VzdG9yc1tqXS5kYXRhLmZhdGhlcik7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGFuY2VzdG9yc1tqXS5kYXRhLm1vdGhlci5uYW1lKSwgMSk7XG5cdFx0XHRcdFx0ZGF0YXNldC5zcGxpY2UocGVkaWdyZWVfdXRpbHMuZ2V0SWR4QnlOYW1lKGRhdGFzZXQsIGFuY2VzdG9yc1tqXS5kYXRhLmZhdGhlci5uYW1lKSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblx0Ly8gY2hlY2sgaW50ZWdyaXR5IG9mIG16dHdpbnMgc2V0dGluZ3Ncblx0Y2hlY2tUd2lucyhkYXRhc2V0KTtcblxuXHRsZXQgdWM7XG5cdHRyeVx0e1xuXHRcdC8vIHZhbGlkYXRlIG5ldyBwZWRpZ3JlZSBkYXRhc2V0XG5cdFx0bGV0IG5ld29wdHMgPSAkLmV4dGVuZCh7fSwgb3B0cyk7XG5cdFx0bmV3b3B0cy5kYXRhc2V0ID0gcGVkaWdyZWVfdXRpbHMuY29weV9kYXRhc2V0KGRhdGFzZXQpO1xuXHRcdHZhbGlkYXRlX3BlZGlncmVlKG5ld29wdHMpO1xuXHRcdC8vIGNoZWNrIGlmIHBlZGlncmVlIGlzIHNwbGl0XG5cdFx0dWMgPSBwZWRpZ3JlZV91dGlscy51bmNvbm5lY3RlZChkYXRhc2V0KTtcblx0fSBjYXRjaChlcnIpIHtcblx0XHRwZWRpZ3JlZV91dGlscy5tZXNzYWdlcygnV2FybmluZycsICdEZWxldGlvbiBvZiB0aGlzIHBlZGlncmVlIG1lbWJlciBpcyBkaXNhbGxvd2VkLicpXG5cdFx0dGhyb3cgZXJyO1xuXHR9XG5cdGlmKHVjLmxlbmd0aCA+IDApIHtcblx0XHQvLyBjaGVjayAmIHdhcm4gb25seSBpZiB0aGlzIGlzIGEgbmV3IHNwbGl0XG5cdFx0aWYocGVkaWdyZWVfdXRpbHMudW5jb25uZWN0ZWQob3B0cy5kYXRhc2V0KS5sZW5ndGggPT09IDApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJpbmRpdmlkdWFscyB1bmNvbm5lY3RlZCB0byBwZWRpZ3JlZSBcIiwgdWMpO1xuXHRcdFx0cGVkaWdyZWVfdXRpbHMubWVzc2FnZXMoXCJXYXJuaW5nXCIsIFwiRGVsZXRpbmcgdGhpcyB3aWxsIHNwbGl0IHRoZSBwZWRpZ3JlZS4gQ29udGludWU/XCIsIG9uRG9uZSwgb3B0cywgZGF0YXNldCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0aWYob25Eb25lKSB7XG5cdFx0b25Eb25lKG9wdHMsIGRhdGFzZXQpO1xuXHR9XG5cdHJldHVybiBkYXRhc2V0O1xufVxuIl0sIm5hbWVzIjpbIm1heF9saW1pdCIsImRpY3RfY2FjaGUiLCJoYXNfYnJvd3Nlcl9zdG9yYWdlIiwib3B0cyIsInN0b3JlX3R5cGUiLCJ1bmRlZmluZWQiLCJtb2QiLCJsb2NhbFN0b3JhZ2UiLCJzZXRJdGVtIiwicmVtb3ZlSXRlbSIsImUiLCJnZXRfcHJlZml4IiwiYnRuX3RhcmdldCIsImdldF9hcnIiLCJnZXRfYnJvd3Nlcl9zdG9yZSIsIml0ZW0iLCJnZXRJdGVtIiwic2Vzc2lvblN0b3JhZ2UiLCJzZXRfYnJvd3Nlcl9zdG9yZSIsIm5hbWUiLCJjbGVhcl9icm93c2VyX3N0b3JlIiwiY2xlYXIiLCJjbGVhcl9wZWRpZ3JlZV9kYXRhIiwicHJlZml4Iiwic3RvcmUiLCJpdGVtcyIsImkiLCJsZW5ndGgiLCJrZXkiLCJpbmRleE9mIiwicHVzaCIsImdldF9jb3VudCIsImNvdW50Iiwic2V0X2NvdW50IiwiaW5pdF9jYWNoZSIsImRhdGFzZXQiLCJKU09OIiwic3RyaW5naWZ5IiwiY29uc29sZSIsIndhcm4iLCJuc3RvcmUiLCJjdXJyZW50IiwicGFyc2UiLCJsYXN0IiwiaXQiLCJhcnIiLCJwcmV2aW91cyIsIm5leHQiLCJwYXJzZUludCIsInNldHBvc2l0aW9uIiwieCIsInkiLCJ6b29tIiwiZ2V0cG9zaXRpb24iLCJwb3MiLCJwYXJzZUZsb2F0IiwiaXNJRSIsInVhIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaXNFZGdlIiwibWF0Y2giLCJjb3B5X2RhdGFzZXQiLCJpZCIsInNvcnQiLCJhIiwiYiIsImRpc2FsbG93ZWQiLCJuZXdkYXRhc2V0Iiwib2JqIiwiZ2V0Rm9ybWF0dGVkRGF0ZSIsInRpbWUiLCJkIiwiRGF0ZSIsImdldEhvdXJzIiwic2xpY2UiLCJnZXRNaW51dGVzIiwiZ2V0U2Vjb25kcyIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwibWVzc2FnZXMiLCJ0aXRsZSIsIm1zZyIsIm9uQ29uZmlybSIsIiQiLCJkaWFsb2ciLCJtb2RhbCIsIndpZHRoIiwiYnV0dG9ucyIsInRleHQiLCJjbGljayIsInZhbGlkYXRlX2FnZV95b2IiLCJhZ2UiLCJ5b2IiLCJzdGF0dXMiLCJ5ZWFyIiwic3VtIiwiTWF0aCIsImFicyIsImNhcGl0YWxpc2VGaXJzdExldHRlciIsInN0cmluZyIsImNoYXJBdCIsInRvVXBwZXJDYXNlIiwibWFrZWlkIiwibGVuIiwicG9zc2libGUiLCJmbG9vciIsInJhbmRvbSIsImJ1aWxkVHJlZSIsInBlcnNvbiIsInJvb3QiLCJwYXJ0bmVyTGlua3MiLCJjaGlsZHJlbiIsImdldENoaWxkcmVuIiwibm9kZXMiLCJmbGF0dGVuIiwicGFydG5lcnMiLCJlYWNoIiwiY2hpbGQiLCJqIiwicCIsIm1vdGhlciIsImZhdGhlciIsIm0iLCJnZXROb2RlQnlOYW1lIiwiZiIsImNvbnRhaW5zX3BhcmVudCIsIm1lcmdlIiwicHRyIiwicGFyZW50IiwiaGlkZGVuIiwibWlkeCIsImdldElkeEJ5TmFtZSIsImZpZHgiLCJzZXRDaGlsZHJlbklkIiwiZ3AiLCJnZXRfZ3JhbmRwYXJlbnRzX2lkeCIsInVwZGF0ZVBhcmVudCIsInBhcmVudF9ub2RlIiwibXp0d2luIiwiZHp0d2lucyIsInR3aW5zIiwiZ2V0VHdpbnMiLCJ0d2luIiwiZHp0d2luIiwiaXNQcm9iYW5kIiwiYXR0ciIsInNldFByb2JhbmQiLCJpc19wcm9iYW5kIiwicHJvYmFuZCIsImNvbWJpbmVBcnJheXMiLCJhcnIxIiwiYXJyMiIsImluQXJyYXkiLCJpbmNsdWRlX2NoaWxkcmVuIiwiY29ubmVjdGVkIiwiZ2V0X3BhcnRuZXJzIiwiZ2V0QWxsQ2hpbGRyZW4iLCJjaGlsZF9pZHgiLCJhbm9kZSIsInB0cnMiLCJibm9kZSIsInVuY29ubmVjdGVkIiwidGFyZ2V0IiwiZ2V0UHJvYmFuZEluZGV4IiwiY2hhbmdlIiwiaWkiLCJuY29ubmVjdCIsImlkeCIsImhhc19wYXJlbnQiLCJub3BhcmVudHMiLCJuYW1lcyIsIm1hcCIsInZhbCIsIl9pIiwic2V4IiwiZ2V0U2libGluZ3MiLCJnZXRBbGxTaWJsaW5ncyIsInNpYnMiLCJ0d2luX3R5cGUiLCJnZXRBZG9wdGVkU2libGluZ3MiLCJnZXREZXB0aCIsImRlcHRoIiwidG9wX2xldmVsIiwiZ2V0Tm9kZXNBdERlcHRoIiwiZm5vZGVzIiwiZXhjbHVkZV9uYW1lcyIsImRhdGEiLCJsaW5rTm9kZXMiLCJmbGF0dGVuTm9kZXMiLCJsaW5rcyIsImFuY2VzdG9ycyIsIm5vZGUiLCJyZWN1cnNlIiwiY29uc2FuZ3VpdHkiLCJub2RlMSIsIm5vZGUyIiwiYW5jZXN0b3JzMSIsImFuY2VzdG9yczIiLCJuYW1lczEiLCJhbmNlc3RvciIsIm5hbWVzMiIsImluZGV4IiwiZmxhdCIsImZvckVhY2giLCJhZGp1c3RfY29vcmRzIiwieG1pZCIsIm92ZXJsYXAiLCJkZXNjZW5kYW50cyIsImRpZmYiLCJjaGlsZDEiLCJjaGlsZDIiLCJub2Rlc092ZXJsYXAiLCJERUJVRyIsImxvZyIsImRlc2NlbmRhbnRzTmFtZXMiLCJkZXNjZW5kYW50IiwieG5ldyIsIm4iLCJzeW1ib2xfc2l6ZSIsInVybFBhcmFtIiwicmVzdWx0cyIsIlJlZ0V4cCIsImV4ZWMiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJnbWlkeCIsImdmaWR4IiwicHJvYmFuZF9hdHRyIiwia2V5cyIsInZhbHVlIiwibm9kZV9hdHRyIiwicGVkY2FjaGUiLCJpc0FycmF5IiwiayIsImZvdW5kIiwic3luY1R3aW5zIiwicmVidWlsZCIsInByb2JhbmRfYWRkX2NoaWxkIiwiYnJlYXN0ZmVlZGluZyIsIm5ld2NoaWxkIiwiYWRkY2hpbGQiLCJkZWxldGVfbm9kZV9ieV9uYW1lIiwib25Eb25lIiwiZGVsZXRlX25vZGVfZGF0YXNldCIsImV4aXN0cyIsInByaW50X29wdHMiLCJyZW1vdmUiLCJhcHBlbmQiLCJhZGQiLCJvcHRpb25zIiwiZXh0ZW5kIiwiYnRucyIsImxpcyIsImZhIiwiaXNfZnVsbHNjcmVlbiIsImRvY3VtZW50IiwiZnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsIndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50Iiwib24iLCJfZSIsImxvY2FsX2RhdGFzZXQiLCJtb3pGdWxsU2NyZWVuIiwid2Via2l0RnVsbFNjcmVlbiIsInRhcmdldERpdiIsIm1velJlcXVlc3RGdWxsU2NyZWVuIiwid2Via2l0UmVxdWVzdEZ1bGxTY3JlZW4iLCJFbGVtZW50IiwiQUxMT1dfS0VZQk9BUkRfSU5QVVQiLCJtb3pDYW5jZWxGdWxsU2NyZWVuIiwid2Via2l0Q2FuY2VsRnVsbFNjcmVlbiIsInN0b3BQcm9wYWdhdGlvbiIsImhhc0NsYXNzIiwiZW1wdHkiLCJidWlsZCIsInJlc2l6YWJsZSIsImhlaWdodCIsIkNvbnRpbnVlIiwicmVzZXQiLCJrZWVwX3Byb2JhbmRfb25fcmVzZXQiLCJDYW5jZWwiLCJ0cmlnZ2VyIiwia2VlcF9wcm9iYW5kIiwic2VsZWN0ZWQiLCJ1cGRhdGVCdXR0b25zIiwiYWRkQ2xhc3MiLCJyZW1vdmVDbGFzcyIsIlJJU0tfRkFDVE9SX1NUT1JFIiwiT2JqZWN0Iiwic2hvd19yaXNrX2ZhY3Rvcl9zdG9yZSIsImdldF9ub25fYW5vbl9wZWRpZ3JlZSIsIm1ldGEiLCJnZXRfcGVkaWdyZWUiLCJmYW1pZCIsImlzYW5vbiIsImV4Y2wiLCJleGNsdWRlIiwicHJvYmFuZElkeCIsInBlZGlncmVlX3V0aWwiLCJtZW5hcmNoZSIsImdldF9yaXNrX2ZhY3RvciIsInBhcml0eSIsImZpcnN0X2JpcnRoIiwib2NfdXNlIiwibWh0X3VzZSIsImJtaSIsImFsY29ob2wiLCJtZW5vcGF1c2UiLCJtZGVuc2l0eSIsImhndCIsInRsIiwiZW5kbyIsImRpc3BsYXlfbmFtZSIsImNhbmNlcnMiLCJjYW5jZXIiLCJkaWFnbm9zaXNfYWdlIiwiYXNoa2VuYXppIiwiZ2VuZXRpY190ZXN0IiwicGF0aG9sb2d5X3Rlc3RzIiwic2F2ZV9yaXNrX2ZhY3RvciIsInJpc2tfZmFjdG9yX25hbWUiLCJzdG9yZV9uYW1lIiwicmVtb3ZlX3Jpc2tfZmFjdG9yIiwicGF0aG5hbWUiLCJzcGxpdCIsImZpbHRlciIsImVsIiwicG9wIiwiZ2V0X3Byc192YWx1ZXMiLCJwcnMiLCJoYXNJbnB1dCIsImlzRW1wdHkiLCJ0cmltIiwibXlPYmoiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJnZXRfc3VyZ2ljYWxfb3BzIiwibG9hZCIsInNhdmUiLCJicmVhc3RfY2FuY2VyX3BycyIsImFscGhhIiwienNjb3JlIiwib3Zhcmlhbl9jYW5jZXJfcHJzIiwiZXJyIiwic2F2ZV9jYW5yaXNrIiwicHJpbnQiLCJnZXRfcHJpbnRhYmxlX3N2ZyIsInN2Z19kb3dubG9hZCIsImRlZmVycmVkIiwic3ZnMmltZyIsIndoZW4iLCJhcHBseSIsImRvbmUiLCJnZXRCeU5hbWUiLCJhcmd1bWVudHMiLCJodG1sIiwiaW1nIiwibmV3VGFiIiwib3BlbiIsIndyaXRlIiwiY3JlYXRlRWxlbWVudCIsImRvd25sb2FkIiwiYm9keSIsImFwcGVuZENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJncmVwIiwibyIsInN2ZyIsImRlZmVycmVkX25hbWUiLCJkZWZhdWx0cyIsImlzY2FudmciLCJyZXNvbHV0aW9uIiwiaW1nX3R5cGUiLCJmaW5kIiwiZDNvYmoiLCJkMyIsInNlbGVjdCIsImdldCIsImxvd2VyIiwiRGVmZXJyZWQiLCJzdmdTdHIiLCJYTUxTZXJpYWxpemVyIiwic2VyaWFsaXplVG9TdHJpbmciLCJ4bWwiLCJpbWdzcmMiLCJidG9hIiwidW5lc2NhcGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJjYW52YXMiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsIm9ubG9hZCIsInJlcGxhY2UiLCJ2IiwiY2FudmciLCJDYW52ZyIsImZyb21TdHJpbmciLCJzY2FsZVdpZHRoIiwic2NhbGVIZWlnaHQiLCJpZ25vcmVEaW1lbnNpb25zIiwic3RhcnQiLCJkcmF3SW1hZ2UiLCJyZXNvbHZlIiwidG9EYXRhVVJMIiwic3JjIiwicHJvbWlzZSIsImdldE1hdGNoZXMiLCJzdHIiLCJteVJlZ2V4cCIsIm1hdGNoZXMiLCJjIiwibGFzdEluZGV4IiwiZXJyb3IiLCJ1bmlxdWVfdXJscyIsInN2Z19odG1sIiwicXVvdGUiLCJtMSIsIm0yIiwibmV3dmFsIiwiY29weV9zdmciLCJzdmdfbm9kZSIsInNlbGVjdEFsbCIsInRyZWVfZGltZW5zaW9ucyIsImdldF90cmVlX2RpbWVuc2lvbnMiLCJzdmdfZGl2IiwiY2xvbmUiLCJhcHBlbmRUbyIsIndpZCIsInNjYWxlIiwieHNjYWxlIiwieXNjYWxlIiwieXRyYW5zZm9ybSIsImNvbnN0cnVjdG9yIiwiQXJyYXkiLCJjc3NGaWxlcyIsInByaW50V2luZG93IiwiaGVhZENvbnRlbnQiLCJjc3MiLCJjbG9zZSIsImZvY3VzIiwic2V0VGltZW91dCIsInNhdmVfZmlsZSIsImNvbnRlbnQiLCJmaWxlbmFtZSIsInR5cGUiLCJmaWxlIiwiQmxvYiIsIm1zU2F2ZU9yT3BlbkJsb2IiLCJ1cmwiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJyZXZva2VPYmplY3RVUkwiLCJjYW5yaXNrX3ZhbGlkYXRpb24iLCJmaWxlcyIsInJpc2tfZmFjdG9ycyIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJyZXN1bHQiLCJzdGFydHNXaXRoIiwicmVhZEJvYWRpY2VhVjQiLCJjYW5yaXNrX2RhdGEiLCJyZWFkQ2FuUmlza1YxIiwicmVhZExpbmthZ2UiLCJ2YWxpZGF0ZV9wZWRpZ3JlZSIsImVycjEiLCJtZXNzYWdlIiwiYWNjX0ZhbUhpc3RfdGlja2VkIiwiYWNjX0ZhbUhpc3RfTGVhdmUiLCJSRVNVTFQiLCJGTEFHX0ZBTUlMWV9NT0RBTCIsImVycjMiLCJlcnIyIiwib25lcnJvciIsImV2ZW50IiwiY29kZSIsInJlYWRBc1RleHQiLCJib2FkaWNlYV9saW5lcyIsImxpbmVzIiwicGVkIiwiaW5kaSIsImFmZmVjdGVkIiwiYWxsZWxlcyIsInVuc2hpZnQiLCJwcm9jZXNzX3BlZCIsImhkciIsImxuIiwib3BzIiwib3BkYXRhIiwiZGVsaW0iLCJnZW5lX3Rlc3QiLCJwYXRoX3Rlc3QiLCJ2ZXJzaW9uIiwiZ2V0TGV2ZWwiLCJtYXhfbGV2ZWwiLCJsZXZlbCIsInBpZHgiLCJnZXRQYXJ0bmVySWR4IiwidXBkYXRlX3BhcmVudHNfbGV2ZWwiLCJwYXJlbnRzIiwibWEiLCJwYSIsInBlZGNhY2hlX2N1cnJlbnQiLCJwcm9wIiwidXBkYXRlU3RhdHVzIiwibm9kZWNsaWNrIiwidXBkYXRlX2NhbmNlcl9ieV9zZXgiLCJhcHByb3hfZGlhZ25vc2lzX2FnZSIsInVwZGF0ZV9kaWFnbm9zaXNfYWdlX3dpZGdldCIsImlzIiwicm91bmQ1IiwidmFsaWQiLCJ1cGRhdGVfYXNoa24iLCJzYXZlX2FzaGtuIiwic3dpdGNoZXMiLCJpc3dpdGNoIiwicyIsInN1YnN0cmluZyIsImNoZWNrZWQiLCJ0cmVzIiwiaGlkZSIsInNob3ciLCJvdmFyaWFuX2NhbmNlcl9kaWFnbm9zaXNfYWdlIiwiY2xvc2VzdCIsInByb3N0YXRlX2NhbmNlcl9kaWFnbm9zaXNfYWdlIiwieDEiLCJ4MiIsInJvdW5kIiwiZHJhZ2dpbmciLCJsYXN0X21vdXNlb3ZlciIsImFkZFdpZGdldHMiLCJmb250X3NpemUiLCJwb3B1cF9zZWxlY3Rpb24iLCJzdHlsZSIsInNxdWFyZSIsInNxdWFyZV90aXRsZSIsImNpcmNsZSIsImNpcmNsZV90aXRsZSIsInVuc3BlY2lmaWVkIiwiYWRkX3BlcnNvbiIsImNsYXNzZWQiLCJkYXR1bSIsImFkZHNpYmxpbmciLCJoaWdobGlnaHQiLCJkcmFnX2hhbmRsZSIsIl9kIiwiZngiLCJvZmYiLCJmeSIsIndpZGdldHMiLCJlZGl0Iiwic2V0dGluZ3MiLCJ3aWRnZXQiLCJzdHlsZXMiLCJwYXJlbnROb2RlIiwib3B0Iiwib3BlbkVkaXREaWFsb2ciLCJhZGRwYXJlbnRzIiwiYWRkcGFydG5lciIsImN0cmxLZXkiLCJzcGxpY2UiLCJzZXRMaW5lRHJhZ1Bvc2l0aW9uIiwieGNvb3JkIiwicG9pbnRlciIsInljb29yZCIsImxpbmVfZHJhZ19zZWxlY3Rpb24iLCJkbGluZSIsImRyYWciLCJkcmFnc3RhcnQiLCJkcmFnc3RvcCIsInNvdXJjZUV2ZW50IiwiZHgiLCJkeSIsInluZXciLCJ5MSIsInkyIiwidHJhbnNsYXRlIiwiYXV0b09wZW4iLCJ0YWJsZSIsImRpc2Vhc2VzIiwiZGlzZWFzZV9jb2xvdXIiLCJjb2xvdXIiLCJrayIsInJvb3RzIiwiem9vbUluIiwiem9vbU91dCIsImxhYmVscyIsImZvbnRfZmFtaWx5IiwiZm9udF93ZWlnaHQiLCJiYWNrZ3JvdW5kIiwibm9kZV9iYWNrZ3JvdW5kIiwidmFsaWRhdGUiLCJwYnV0dG9ucyIsImlvIiwiZ3JvdXBfdG9wX2xldmVsIiwicGVkaWdyZWVfdXRpbHMiLCJzdmdfZGltZW5zaW9ucyIsImdldF9zdmdfZGltZW5zaW9ucyIsInh5dHJhbnNmb3JtIiwieHRyYW5zZm9ybSIsImhpZGRlbl9yb290IiwiaGllcmFyY2h5IiwidHJlZW1hcCIsInRyZWUiLCJzZXBhcmF0aW9uIiwic2l6ZSIsInZpc19ub2RlcyIsImNyZWF0ZV9lcnIiLCJwdHJMaW5rTm9kZXMiLCJjaGVja19wdHJfbGlua3MiLCJlbnRlciIsIm1pc2NhcnJpYWdlIiwidGVybWluYXRpb24iLCJzeW1ib2wiLCJzeW1ib2xUcmlhbmdsZSIsInN5bWJvbENpcmNsZSIsInN5bWJvbFNxdWFyZSIsInBpZW5vZGUiLCJuY2FuY2VycyIsInByZWZpeEluT2JqIiwicGllIiwiYXJjIiwiaW5uZXJSYWRpdXMiLCJvdXRlclJhZGl1cyIsImFkb3B0ZWRfaW4iLCJhZG9wdGVkX291dCIsImluZGVudCIsImdldF9icmFja2V0IiwiYWRkTGFiZWwiLCJnZXRQeCIsImlsYWIiLCJsYWJlbCIsInlfb2Zmc2V0IiwidmFycyIsIml2YXIiLCJkaXNlYXNlIiwiZGlzIiwiY2xhc2hfZGVwdGgiLCJkcmF3X3BhdGgiLCJjbGFzaCIsImR5MSIsImR5MiIsImNzaGlmdCIsImwiLCJwYXRoIiwiZHgxIiwiZHgyIiwiaW5zZXJ0IiwiZGl2b3JjZWQiLCJjaGVja19wdHJfbGlua19jbGFzaGVzIiwicGFyZW50X25vZGVzIiwicGFyZW50X25vZGVfbmFtZSIsImRpdm9yY2VfcGF0aCIsInBhdGgyIiwic291cmNlIiwiZGFzaF9sZW4iLCJkYXNoX2FycmF5IiwidXNlZGxlbiIsInR3aW54IiwieG1pbiIsInQiLCJ0aGlzeCIsInltaWQiLCJ4aGJhciIsInh4IiwieXkiLCJwcm9iYW5kTm9kZSIsInRyaWlkIiwic2NhbGVFeHRlbnQiLCJ6b29tRm4iLCJ0cmFuc2Zvcm0iLCJ0b1N0cmluZyIsIkVycm9yIiwidW5pcXVlbmFtZXMiLCJmYW1pZHMiLCJqb2luIiwidWMiLCJfbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsIm1heHNjb3JlIiwiZ2VuZXJhdGlvbiIsInNjb3JlIiwibWF4X2RlcHRoIiwidHJlZV93aWR0aCIsInRyZWVfaGVpZ2h0IiwidG9wX2xldmVsX3NlZW4iLCJlbVZhbCIsImdldENvbXB1dGVkU3R5bGUiLCJmb250U2l6ZSIsImZ0ZXh0IiwiY2xhc3NfbGFiZWwiLCJ0ZW1wbGF0ZXMiLCJ1cGRhdGUiLCJuY2hpbGQiLCJwdHJfbmFtZSIsInBhcnRuZXIiLCJ0d2luX2lkIiwiZ2V0VW5pcXVlVHdpbklEIiwibmV3Y2hpbGRyZW4iLCJhZGRfbGhzIiwibmV3YmllIiwic2V0TXpUd2luIiwiZDEiLCJkMiIsIm16IiwiY2hlY2tUd2lucyIsInR3aW5fdHlwZXMiLCJmbGF0X3RyZWUiLCJ0cmVlX25vZGUiLCJwaWQiLCJub2RlX21vdGhlciIsIm5vZGVfZmF0aGVyIiwibm9kZV9zaWJzIiwicmlkIiwibGlkIiwic2lkIiwiZmFpZHgiLCJtb2lkeCIsInRtcGZhIiwib3JwaGFucyIsIm5pZCIsIm9pZCIsIm9pZHgiLCJwdHJfbm9kZSIsImFkamFjZW50X25vZGVzIiwiZXhjbHVkZXMiLCJkbm9kZXMiLCJsaHNfbm9kZSIsInJoc19ub2RlIiwiZGVsZXRlcyIsImQzbm9kZSIsInBzIiwiY2hpbGRyZW5fbmFtZXMiLCJjaGlsZF9ub2RlIiwiYWRqIiwiZGVsIiwiZGF0YV9ub2RlIiwibmV3b3B0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUFBO0VBRUEsSUFBSUEsU0FBUyxHQUFHLEVBQWhCO0VBQ0EsSUFBSUMsVUFBVSxHQUFHLEVBQWpCOztFQUdBLFNBQVNDLG1CQUFULENBQTZCQyxJQUE3QixFQUFtQztFQUNsQyxNQUFJO0VBQ0gsUUFBR0EsSUFBSSxDQUFDQyxVQUFMLEtBQW9CLE9BQXZCLEVBQ0MsT0FBTyxLQUFQO0VBRUQsUUFBR0QsSUFBSSxDQUFDQyxVQUFMLEtBQW9CLE9BQXBCLElBQStCRCxJQUFJLENBQUNDLFVBQUwsS0FBb0IsU0FBbkQsSUFBZ0VELElBQUksQ0FBQ0MsVUFBTCxLQUFvQkMsU0FBdkYsRUFDQyxPQUFPLEtBQVA7RUFFRCxRQUFJQyxHQUFHLEdBQUcsTUFBVjtFQUNBQyxJQUFBQSxZQUFZLENBQUNDLE9BQWIsQ0FBcUJGLEdBQXJCLEVBQTBCQSxHQUExQjtFQUNBQyxJQUFBQSxZQUFZLENBQUNFLFVBQWIsQ0FBd0JILEdBQXhCO0VBQ0EsV0FBTyxJQUFQO0VBQ0EsR0FYRCxDQVdFLE9BQU1JLENBQU4sRUFBUztFQUNWLFdBQU8sS0FBUDtFQUNBO0VBQ0Q7O0VBRUQsU0FBU0MsVUFBVCxDQUFvQlIsSUFBcEIsRUFBMEI7RUFDekIsU0FBTyxjQUFZQSxJQUFJLENBQUNTLFVBQWpCLEdBQTRCLEdBQW5DO0VBQ0E7OztFQUdELFNBQVNDLE9BQVQsQ0FBaUJWLElBQWpCLEVBQXVCO0VBQ3RCLFNBQU9GLFVBQVUsQ0FBQ1UsVUFBVSxDQUFDUixJQUFELENBQVgsQ0FBakI7RUFDQTs7RUFFRCxTQUFTVyxpQkFBVCxDQUEyQlgsSUFBM0IsRUFBaUNZLElBQWpDLEVBQXVDO0VBQ3RDLE1BQUdaLElBQUksQ0FBQ0MsVUFBTCxL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
