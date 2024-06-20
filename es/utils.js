/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// Pedigree Tree Utils
import * as pedcache from './pedcache.js';


export let roots = {};

export function isIE() {
	 let ua = navigator.userAgent;
	 /* MSIE used to detect old browsers and Trident used to newer ones*/
	 return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
}

export function isEdge() {
	 return navigator.userAgent.match(/Edge/g);
}

export function create_err(err) {
	console.error(err);
	return new Error(err);
}

// validate pedigree data
export function validate_pedigree(opts){
	if(opts.validate) {
		if (typeof opts.validate == 'function') {
			if(opts.DEBUG)
				console.log('CALLING CONFIGURED VALIDATION FUNCTION');
			return opts.validate.call(this, opts);
		}

		// check consistency of parents sex
		let uniquenames = [];
		let famids = [];
		let display_name;
		for(let p=0; p<opts.dataset.length; p++) {
			if(!p.hidden) {
				if(opts.dataset[p].mother || opts.dataset[p].father) {
					display_name = opts.dataset[p].display_name;
					if(!display_name)
						display_name = 'unnamed';
					display_name += ' (IndivID: '+opts.dataset[p].name+')';
					let mother = opts.dataset[p].mother;
					let father = opts.dataset[p].father;
					if(!mother || !father) {
						throw create_err('Missing parent for '+display_name);
					}

					let midx = getIdxByName(opts.dataset, mother);
					let fidx = getIdxByName(opts.dataset, father);
					if(midx === -1)
						throw create_err('The mother (IndivID: '+mother+') of family member '+
										 display_name+' is missing from the pedigree.');
					if(fidx === -1)
						throw create_err('The father (IndivID: '+father+') of family member '+
										 display_name+' is missing from the pedigree.');
					if(opts.dataset[midx].sex !== "F")
						throw create_err("The mother of family member "+display_name+
								" is not specified as female. All mothers in the pedigree must have sex specified as 'F'.");
					if(opts.dataset[fidx].sex !== "M")
						throw create_err("The father of family member "+display_name+
								" is not specified as male. All fathers in the pedigree must have sex specified as 'M'.");
				}
			}


			if(!opts.dataset[p].name)
				throw create_err(display_name+' has no IndivID.');
			if($.inArray(opts.dataset[p].name, uniquenames) > -1)
				throw create_err('IndivID for family member '+display_name+' is not unique.');
			uniquenames.push(opts.dataset[p].name);

			if($.inArray(opts.dataset[p].famid, famids) === -1 && opts.dataset[p].famid) {
				famids.push(opts.dataset[p].famid);
			}
		}

		if(famids.length > 1) {
			throw create_err('More than one family found: '+famids.join(", ")+'.');
		}
		// warn if there is a break in the pedigree
		let uc = unconnected(opts.dataset);
		if(uc.length > 0)
			console.warn("individuals unconnected to pedigree ", uc);
	}
}

export function copy_dataset(dataset) {
	if(dataset[0].id) { // sort by id
		dataset.sort(function(a,b){return (!a.id || !b.id ? 0: (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));});
	}

	let disallowed = ["id", "parent_node"];
	let newdataset = [];
	for(let i=0; i<dataset.length; i++){
		let obj = {};
		for(let key in dataset[i]) {
			if(disallowed.indexOf(key) === -1)
				obj[key] = dataset[i][key];
		}
		newdataset.push(obj);
	}
	return newdataset;
}

// check if the object contains a key with a given prefix
export function prefixInObj(prefix, obj) {
	let found = false;
	if(obj)
		$.each(obj, function(k, _n){
			if(k.indexOf(prefix+"_") === 0 || k === prefix) {
				found = true;
				return found;
			}
		});
	return found;
}

/**
 *  Get formatted time or data & time
 */
export function getFormattedDate(time){
	let d = new Date();
	if(time)
		return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	else
		return d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
 }

function showDialog(title, msg, onConfirm, opts, dataset) {
	const errModalEl = document.getElementById('errModal');
	const modalTitle = errModalEl.querySelector('.modal-title');
	const modalBodyInput = errModalEl.querySelector('.modal-body');
	if(onConfirm) {
		$('#errModal button.hidden').removeClass("hidden");
		$('#errModal button:contains("OK")').on( "click", function() {
			onConfirm(opts, dataset);
			$('#errModal button:contains("OK")').off('click');
		});
	} else {
		const cancelBtn = $('#errModal button:contains("CANCEL")');
		if(!cancelBtn.hasClass("hidden")) cancelBtn.addClass("hidden");
		$('#errModal button:contains("OK")').off('click');
	}

	modalTitle.textContent = title;
	modalBodyInput.textContent = msg;
	$("#errModal").modal("show");
}

/**
 * Show message or confirmation dialog.
 * @param title	 - dialog window title
 * @param msg	   - message to diasplay
 * @param onConfirm - function to call in a confirmation dialog
 * @param opts	  - pedigreejs options
 * @param dataset	- pedigree dataset
 */
export function messages(title, msg, onConfirm, opts, dataset) {
	try {
		if(onConfirm) {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
					modal: true,
					title: title,
					width: 350,
					buttons: {
						"Yes": function () {
							$(this).dialog('close');
							onConfirm(opts, dataset);
						},
						"No": function () {
							$(this).dialog('close');
						}
					}
				});
		} else {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
				title: title,
				width: 350,
				buttons: [{
					text: "OK",
					click: function() { $( this ).dialog( "close" );}
				}]
			});
		}
	} catch(err) {
		showDialog(title, msg, onConfirm, opts, dataset);
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
export function validate_age_yob(age, yob, status) {
	let year = new Date().getFullYear();
	let sum = parseInt(age) + parseInt(yob);
	// check status is an expected string
	if (status !== "1" && status !== "0")
		return false

	if(status === "1") {   // deceased
		return year >= sum;
	}
	return Math.abs(year - sum) <= 1 && year >= sum;
}

export function capitaliseFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}


export function makeid(len) {
	let text = "";
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for( let i=0; i < len; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

export function buildTree(opts, person, root, partnerLinks, id) {
	if (typeof person.children === typeof undefined)
		person.children = getChildren(opts.dataset, person);

	if (typeof partnerLinks === typeof undefined) {
		partnerLinks = [];
		id = 1;
	}

	let nodes = flatten(root);
	//console.log('NAME='+person.name+' NO. CHILDREN='+person.children.length);
	let partners = [];
	$.each(person.children, function(_i, child) {
		$.each(opts.dataset, function(_j, p) {
			if (((child.name === p.mother) || (child.name === p.father)) && child.id === undefined) {
				let m = getNodeByName(nodes, p.mother);
				let f = getNodeByName(nodes, p.father);
				m = (m !== undefined? m : getNodeByName(opts.dataset, p.mother));
				f = (f !== undefined? f : getNodeByName(opts.dataset, p.father));
				if(!contains_parent(partners, m, f))
					partners.push({'mother': m, 'father': f});
			}
		});
	});
	$.merge(partnerLinks, partners);

	$.each(partners, function(_i, ptr) {
		let mother = ptr.mother;
		let father = ptr.father;
		mother.children = [];
		let parent = {
				name : makeid(4),
				hidden : true,
				parent : null,
				father : father,
				mother : mother,
				children : getChildren(opts.dataset, mother, father)
		};

		let midx = getIdxByName(opts.dataset, mother.name);
		let fidx = getIdxByName(opts.dataset, father.name);
		if(!('id' in father) && !('id' in mother))
			id = setChildrenId(person.children, id);

		// look at grandparents index
		let gp = get_grandparents_idx(opts.dataset, midx, fidx);
		if(gp.fidx < gp.midx) {
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

	$.each(person.children, function(_i, p) {
		id = buildTree(opts, p, root, partnerLinks, id)[1];
	});
	return [partnerLinks, id];
}


// update parent node and sort twins
function updateParent(p, parent, id, nodes, opts) {
	// add to parent node
	if('parent_node' in p)
		p.parent_node.push(parent);
	else
		p.parent_node = [parent];

	// check twins lie next to each other
	if(p.mztwin || p.dztwins) {
		let twins = getTwins(opts.dataset, p);
		for(let i=0; i<twins.length; i++) {
			let twin = getNodeByName(nodes, twins[i].name);
			if(twin)
				twin.id = id++;
		}
	}
	return id;
}

function setChildrenId(children, id) {
	// sort twins to lie next to each other
	children.sort(function(a, b) {
		if(a.mztwin && b.mztwin && a.mztwin === b.mztwin)
			return 0;
		else if(a.dztwin && b.dztwin && a.dztwin === b.dztwin)
			return 0;
		else if(a.mztwin || b.mztwin || a.dztwin || b.dztwin)
			return 1;
		return 0;
	});

	$.each(children, function(_i, p) {
		if(p.id === undefined) p.id = id++;
	});
	return id;
}

export function isProband(obj) {
	return typeof $(obj).attr('proband') !== typeof undefined && $(obj).attr('proband') !== false;
}

export function setProband(dataset, name, is_proband) {
	$.each(dataset, function(_i, p) {
		if (name === p.name)
			p.proband = is_proband;
		else
			delete p.proband;
	});
}

//combine arrays ignoring duplicates
function combineArrays(arr1, arr2) {
	for(let i=0; i<arr2.length; i++)
		if($.inArray( arr2[i], arr1 ) === -1) arr1.push(arr2[i]);
}

function include_children(connected, p, dataset) {
	if($.inArray( p.name, connected ) === -1)
		return;
	combineArrays(connected, get_partners(dataset, p));
	let children = getAllChildren(dataset, p);
	$.each(children, function( _child_idx, child ) {
		if($.inArray( child.name, connected ) === -1) {
			connected.push(child.name);
			combineArrays(connected, get_partners(dataset, child));
		}
	});
}

//get the partners for a given node
export function get_partners(dataset, anode) {
	let ptrs = [];
	for(let i=0; i<dataset.length; i++) {
		let bnode = dataset[i];
		if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) === -1)
			ptrs.push(bnode.father);
		else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) === -1)
			ptrs.push(bnode.mother);
	}
	return ptrs;
}

//return a list of individuals that aren't connected to the target
export function unconnected(dataset){
	let target = dataset[ getProbandIndex(dataset) ];
	if(!target){
		console.warn("No target defined");
		if(dataset.length === 0) {
			throw new Error("empty pedigree data set");
		}
		target = dataset[0];
	}
	let connected = [target.name];
	let change = true;
	let ii = 0;
	while(change && ii < 200) {
		ii++;
		let nconnect = connected.length;
		$.each(dataset, function( _idx, p ) {
			if($.inArray( p.name, connected ) !== -1) {
				// check if this person or a partner has a parent
				let ptrs = get_partners(dataset, p);
				let has_parent = (p.name === target.name || !p.noparents);
				for(let i=0; i<ptrs.length; i++){
					if(!getNodeByName(dataset, ptrs[i]).noparents)
						has_parent = true;
				}

				if(has_parent){
					if(p.mother && $.inArray( p.mother, connected ) === -1)
						connected.push(p.mother);
					if(p.father && $.inArray( p.father, connected ) === -1)
						connected.push(p.father);
				}
			} else if( !p.noparents &&
					  ((p.mother && $.inArray( p.mother, connected ) !== -1) ||
					   (p.father && $.inArray( p.father, connected ) !== -1))){
				connected.push(p.name);
			}
			// include any children
			include_children(connected, p, dataset);
		});
		change = (nconnect !== connected.length);
	}
	let names = $.map(dataset, function(val, _i){return val.name;});
	return $.map(names, function(name, _i){return $.inArray(name, connected) === -1 ? name : null;});
}

export function getProbandIndex(dataset) {
	let proband;
	$.each(dataset, function(i, val) {
		if (isProband(val)) {
			proband = i;
			return proband;
		}
	});
	return proband;
}

export function getChildren(dataset, mother, father) {
	let children = [];
	let names = [];
	if(mother.sex === 'F')
		$.each(dataset, function(_i, p) {
			if(mother.name === p.mother)
				if(!father || father.name === p.father) {
					if($.inArray(p.name, names) === -1){
						children.push(p);
						names.push(p.name);
					}
				}
		});
	return children;
}

function contains_parent(arr, m, f) {
	for(let i=0; i<arr.length; i++)
		if(arr[i].mother === m && arr[i].father === f)
			return true;
	return false;
}

// get the mono/di-zygotic twin(s)
export function getTwins(dataset, person) {
	let sibs = getSiblings(dataset, person);
	let twin_type = (person.mztwin ? "mztwin" : "dztwin");
	return $.map(sibs, function(p, _i){
		return p.name !== person.name && p[twin_type] === person[twin_type] ? p : null;
	});
}

// get the siblings - sex is an optional parameter
// for only returning brothers or sisters
export function getSiblings(dataset, person, sex) {
	if(person === undefined || !person.mother || person.noparents)
		return [];

	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && !('noparents' in p) && p.mother &&
			   (p.mother === person.mother && p.father === person.father) &&
			   (!sex || p.sex === sex) ? p : null;
	});
}

// get the siblings + adopted siblings - sex is an optional parameter
// for only returning brothers or sisters
export function getAllSiblings(dataset, person, sex) {
	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && !('noparents' in p) && p.mother &&
			   (p.mother === person.mother && p.father === person.father) &&
			   (!sex || p.sex === sex) ? p : null;
	});
}

// get the adopted siblings of a given individual
export function getAdoptedSiblings(dataset, person) {
	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && 'noparents' in p &&
			   (p.mother === person.mother && p.father === person.father) ? p : null;
	});
}

export function getAllChildren(dataset, person, sex) {
	return $.map(dataset, function(p, _i){
		return !('noparents' in p) &&
			   (p.mother === person.name || p.father === person.name) &&
			   (!sex || p.sex === sex) ? p : null;
	});
}

// get the depth of the given person from the root
export function getDepth(dataset, name) {
	let idx = getIdxByName(dataset, name);
	let depth = 1;

	while(idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)){
		idx = getIdxByName(dataset, dataset[idx].mother);
		depth++;
	}
	return depth;
}

// given an array of people get an index for a given person
export function getIdxByName(arr, name) {
	let idx = -1;
	$.each(arr, function(i, p) {
		if (name === p.name) {
			idx = i;
			return idx;
		}
	});
	return idx;
}

// get the nodes at a given depth sorted by their x position
export function getNodesAtDepth(fnodes, depth, exclude_names) {
	return $.map(fnodes, function(p, _i){
		return p.depth === depth && !p.data.hidden && $.inArray(p.data.name, exclude_names) === -1 ? p : null;
	}).sort(function (a,b) {return a.x - b.x;});
}

// convert the partner names into corresponding tree nodes
export function linkNodes(flattenNodes, partners) {
	let links = [];
	for(let i=0; i< partners.length; i++)
		links.push({'mother': getNodeByName(flattenNodes, partners[i].mother.name),
					'father': getNodeByName(flattenNodes, partners[i].father.name)});
	return links;
}

// get ancestors of a node
export function ancestors(dataset, node) {
	let ancestors = [];
	function recurse(node) {
		if(node.data) node = node.data;
		if('mother' in node && 'father' in node && !('noparents' in node)){
			recurse(getNodeByName(dataset, node.mother));
			recurse(getNodeByName(dataset, node.father));
		}
		ancestors.push(node);
	}
	recurse(node);
	return ancestors;
}

// test if two nodes are consanguinous partners
export function consanguity(node1, node2, opts) {
	if(node1.depth !== node2.depth) // parents at different depths
		return true;
	let ancestors1 = ancestors(opts.dataset, node1);
	let ancestors2 = ancestors(opts.dataset, node2);
	let names1 = $.map(ancestors1, function(ancestor, _i){return ancestor.name;});
	let names2 = $.map(ancestors2, function(ancestor, _i){return ancestor.name;});
	let consanguity = false;
	$.each(names1, function( _index, name ) {
		if($.inArray(name, names2) !== -1){
			consanguity = true;
			return false;
		}
	});
	return consanguity;
}

// return a flattened representation of the tree
export function flatten(root) {
	let flat = [];
	function recurse(node) {
		if(node.children)
			node.children.forEach(recurse);
		flat.push(node);
	}
	recurse(root);
	return flat;
}

// Adjust D3 layout positioning.
// Position hidden parent node centring them between father and mother nodes. Remove kinks
// from links - e.g. where there is a single child plus a hidden child
export function adjust_coords(opts, root, flattenNodes) {
	function recurse(node) {
		if (node.children) {
			node.children.forEach(recurse);

			if(node.data.father !== undefined) { 	// hidden nodes
				let father = getNodeByName(flattenNodes, node.data.father.name);
				let mother = getNodeByName(flattenNodes, node.data.mother.name);
				let xmid = (father.x + mother.x) /2;
				if(!overlap(opts, root.descendants(), xmid, node.depth, [node.data.name])) {
					node.x = xmid;   // centralise parent nodes
					let diff = node.x - xmid;
					if(node.children.length === 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
						if(!(node.children[0].data.hidden && node.children[1].data.hidden)) {
							let child1 = (node.children[0].data.hidden ? node.children[1] : node.children[0]);
							let child2 = (node.children[0].data.hidden ? node.children[0] : node.children[1]);
							if( ((child1.x < child2.x && xmid < child2.x) || (child1.x > child2.x && xmid > child2.x)) &&
								!overlap(opts, root.descendants(), xmid, child1.depth, [child1.data.name])){
								child1.x = xmid;
							}
						}
					} else if(node.children.length === 1 && !node.children[0].data.hidden) {
						if(!overlap(opts, root.descendants(), xmid, node.children[0].depth, [node.children[0].data.name]))
							node.children[0].x = xmid;
					} else {
						if(diff !== 0 && !nodesOverlap(opts, node, diff, root)){
							if(node.children.length === 1) {
								node.children[0].x = xmid;
							} else {
								let descendants = node.descendants();
								if(opts.DEBUG)
									console.log('ADJUSTING '+node.data.name+' NO. DESCENDANTS '+descendants.length+' diff='+diff);
								for(let i=0; i<descendants.length; i++) {
									if(node.data.name !== descendants[i].data.name)
										descendants[i].x -= diff;
								}
							}
						}
					}
				} else if((node.x < father.x && node.x < mother.x) || (node.x > father.x && node.x > mother.x)){
						node.x = xmid;   // centralise parent nodes if it doesn't lie between mother and father
				}
			}
		}
	}
	recurse(root);
	recurse(root);
}

// test if moving siblings by diff overlaps with other nodes
function nodesOverlap(opts, node, diff, root) {
	let descendants = node.descendants();
	let descendantsNames = $.map(descendants, function(descendant, _i){return descendant.data.name;});
	let nodes = root.descendants();
	for(let i=0; i<descendants.length; i++){
		let descendant = descendants[i];
		if(node.data.name !== descendant.data.name){
			let xnew = descendant.x - diff;
			if(overlap(opts, nodes, xnew, descendant.depth, descendantsNames))
				return true;
		}
	}
	return false;
}

// test if x position overlaps a node at the same depth
export function overlap(opts, nodes, xnew, depth, exclude_names) {
	for(let n=0; n<nodes.length; n++) {
		if(depth === nodes[n].depth && $.inArray(nodes[n].data.name, exclude_names) === -1){
			if(Math.abs(xnew - nodes[n].x) < (opts.symbol_size*1.15))
				return true;
		}
	}
	return false;
}

// given a persons name return the corresponding d3 tree node
export function getNodeByName(nodes, name) {
	for (let i = 0; i < nodes.length; i++) {
		if(nodes[i].data && name === nodes[i].data.name)
			return nodes[i];
		else if (name === nodes[i].name)
			return nodes[i];
	}
}

// given the name of a url param get the value
export function urlParam(name){
	let results = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.href);
	if (results===null)
	   return null;
	else
	   return results[1] || 0;
}

// get grandparents index
function get_grandparents_idx(dataset, midx, fidx) {
	let gmidx = midx;
	let gfidx = fidx;
	while(  'mother' in dataset[gmidx] && 'mother' in dataset[gfidx] &&
		  !('noparents' in dataset[gmidx]) && !('noparents' in dataset[gfidx])){
		gmidx = getIdxByName(dataset, dataset[gmidx].mother);
		gfidx = getIdxByName(dataset, dataset[gfidx].mother);
	}
	return {'midx': gmidx, 'fidx': gfidx};
}

// check by name if the individual exists
export function exists(opts, name){
	return getNodeByName(pedcache.current(opts), name) !== undefined;
}

// print options and dataset
export function print_opts(opts){
	$("#pedigree_data").remove();
	$("body").append("<div id='pedigree_data'></div>" );
	let key;
	for(let i=0; i<opts.dataset.length; i++) {
		let person = "<div class='row'><strong class='col-md-1 text-right'>"+opts.dataset[i].name+"</strong><div class='col-md-11'>";
		for(key in opts.dataset[i]) {
			if(key === 'name') continue;
			if(key === 'parent')
				person += "<span>"+key + ":" + opts.dataset[i][key].name+"; </span>";
			else if (key === 'children') {
				if (opts.dataset[i][key][0] !== undefined)
					person += "<span>"+key + ":" + opts.dataset[i][key][0].name+"; </span>";
			} else
				person += "<span>"+key + ":" + opts.dataset[i][key]+"; </span>";
		}
		$("#pedigree_data").append(person + "</div></div>");

	}
	$("#pedigree_data").append("<br /><br />");
	for(key in opts) {
		if(key === 'dataset') continue;
		$("#pedigree_data").append("<span>"+key + ":" + opts[key]+"; </span>");
	}
}

export function is_fullscreen(){
	return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}


export function get_svg_dimensions(opts) {
	return {'width' : (is_fullscreen()? window.innerWidth  : opts.width),
			'height': (is_fullscreen()? window.innerHeight : opts.height)};
}

export function get_tree_dimensions(opts) {
	// / get score at each depth used to adjust node separation
	let svg_dimensions = get_svg_dimensions(opts);
	let maxscore = 0;
	let generation = {};
	for(let i=0; i<opts.dataset.length; i++) {
		let depth = getDepth(opts.dataset, opts.dataset[i].name);
		let children = getAllChildren(opts.dataset, opts.dataset[i]);

		// score based on no. of children and if parent defined
		let score = 1 + (children.length > 0 ? 0.55+(children.length*0.25) : 0) + (opts.dataset[i].father ? 0.25 : 0);
		if(depth in generation)
			generation[depth] += score;
		else
			generation[depth] = score;

		if(generation[depth] > maxscore)
			maxscore = generation[depth];
	}

	let max_depth = Object.keys(generation).length*opts.symbol_size*3.5;
	let tree_width =  (svg_dimensions.width - opts.symbol_size > maxscore*opts.symbol_size*1.65 ?
					   svg_dimensions.width - opts.symbol_size : maxscore*opts.symbol_size*1.65);
	let tree_height = (svg_dimensions.height - opts.symbol_size > max_depth ?
					   svg_dimensions.height - opts.symbol_size : max_depth);
	return {'width': tree_width, 'height': tree_height};
}

