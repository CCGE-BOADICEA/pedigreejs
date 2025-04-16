/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// Pedigree Tree Builder
import  * as utils from './utils.js';
import * as pbuttons from './pbuttons.js';
import * as pedcache from './pedcache.js';
import * as io from './io.js';
import {addWidgets} from './widgets.js';
import {init_zoom} from './zoom.js';
import {addLabels} from './labels.js';
import {init_dragging} from './dragging.js';


export function build(options) {
	let opts = $.extend({ // defaults
		targetDiv: 'pedigree_edit',
		dataset: [ {"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
				   {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
				   {"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}],
		width: 600,
		height: 400,
		symbol_size: 35,
		zoomSrc: ['wheel', 'button'],
		zoomIn: 1.0,
		zoomOut: 1.0,
		dragNode: true,
		showWidgets: true,
		diseases: [	{'type': 'breast_cancer', 'colour': '#F68F35'},
					{'type': 'breast_cancer2', 'colour': 'pink'},
					{'type': 'ovarian_cancer', 'colour': '#306430'},
					{'type': 'pancreatic_cancer', 'colour': '#4289BA'},
					{'type': 'prostate_cancer', 'colour': '#D5494A'}],
		labels: ['stillbirth', ['age', 'yob'], 'alleles',
							   ['brca1_gene_test', 'brca2_gene_test', 'palb2_gene_test', 'chek2_gene_test', 'atm_gene_test'],
							   ['rad51d_gene_test', 'rad51c_gene_test', 'brip1_gene_test', 'hoxb13_gene_test'],
							   ['er_bc_pathology', 'pr_bc_pathology', 'her2_bc_pathology', 'ck14_bc_pathology', 'ck56_bc_pathology']],
		keep_proband_on_reset: false,
		font_size: '.75em',
		font_family: 'Helvetica',
		font_weight: 700,
		background: "#FAFAFA",
		node_background: '#fdfdfd',
		validate: true,
		DEBUG: false,
		VERBOSE: false}, options );

	if ( $( "#fullscreen" ).length === 0 ) {
		// add undo, redo, fullscreen buttons and event listeners once
		pbuttons.addButtons(opts, rebuild, build);
		io.addIO(opts);
	}

	if(pedcache.nstore(opts) === -1)
		pedcache.init_cache(opts);

	pbuttons.updateButtons(opts);

	// validate pedigree data
	utils.validate_pedigree(opts);
	// group top level nodes by partners
	opts.dataset = group_top_level(opts.dataset);

	if(opts.VERBOSE)
		utils.print_opts(opts);
	let svg_dimensions = utils.get_svg_dimensions(opts);
	let svg = d3.select("#"+opts.targetDiv)
				 .append("svg:svg")
				 .attr("width", svg_dimensions.width)
				 .attr("height", svg_dimensions.height);

	svg.append("rect")
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("rx", 6)
		.attr("ry", 6)
		.style("stroke", "darkgrey")
		.style("fill", opts.background) // or none
		.style("stroke-width", 1);

	let ped = svg.append("g")
			 .attr("class", "diagram");

	let top_level = $.map(opts.dataset, function(val, _i){return 'top_level' in val && val.top_level ? val : null;});
	let hidden_root = {
		name : 'hidden_root',
		id : 0,
		hidden : true,
		children : top_level
	};

	let partners = utils.buildTree(opts, hidden_root, hidden_root)[0];
	let root = d3.hierarchy(hidden_root);
	utils.roots[opts.targetDiv] = root;

	// / get score at each depth used to adjust node separation
	let tree_dimensions = utils.get_tree_dimensions(opts);
	if(opts.DEBUG)
		console.log('opts.width='+svg_dimensions.width+' width='+tree_dimensions.width+
					' opts.height='+svg_dimensions.height+' height='+tree_dimensions.height);

	let treemap = d3.tree().separation(function(a, b) {
		return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
	}).size([tree_dimensions.width, tree_dimensions.height]);

	let nodes = treemap(root.sort(function(a, b) { return a.data.id - b.data.id; }));
	let flattenNodes = nodes.descendants();

	// check the number of visible nodes equals the size of the pedigree dataset
	let vis_nodes = $.map(opts.dataset, function(p, _i){return p.hidden ? null : p;});
	if(vis_nodes.length !== opts.dataset.length) {
		throw utils.create_err('NUMBER OF VISIBLE NODES DIFFERENT TO NUMBER IN THE DATASET');
	}

	utils.adjust_coords(opts, nodes, flattenNodes);

	let ptrLinkNodes = utils.linkNodes(flattenNodes, partners);
	check_ptr_links(opts, ptrLinkNodes);   // check for crossing of partner lines

	let node = ped.selectAll(".node")
				  .data(nodes.descendants())
				  .enter()
				  .append("g")
					.attr("transform", function(d, _i) {
						return "translate(" + d.x + "," + d.y + ")";
					});

	// provide a border to the node
	node.filter(function (d) {return !d.data.hidden;})
		.append("path")
		.attr("shape-rendering", "geometricPrecision")
		.attr("transform", function(d) {return !has_gender(d.data.sex) && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";})
		.attr("d", d3.symbol().size(function(_d) { return (opts.symbol_size * opts.symbol_size) + 2;})
				.type(function(d) {
					if(d.data.miscarriage || d.data.termination)
						return d3.symbolTriangle;
					return d.data.sex === "F" ? d3.symbolCircle : d3.symbolSquare;}))
		.style("stroke", function (d) {
			return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
		})
		.style("stroke-width", function (d) {
			return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
		})
		.style("stroke-dasharray", function (d) {return !d.data.exclude ? null : ("3, 3");})
		.style("fill", "none");

	// set a clippath
	node.filter(function (d) {return !(d.data.hidden && !opts.DEBUG);})
		.append("clipPath")
		.attr("id", function (d) {return d.data.name;}).append("path")
		.attr("class", "node")
		.attr("transform", function(d) {return !has_gender(d.data.sex) && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";})
		.attr("d", d3.symbol().size(function(d) {
				if (d.data.hidden)
					return opts.symbol_size * opts.symbol_size / 5;
				return opts.symbol_size * opts.symbol_size;
			})
			.type(function(d) {
				if(d.data.miscarriage || d.data.termination)
					return d3.symbolTriangle;
				return d.data.sex === "F" ? d3.symbolCircle :d3.symbolSquare;}));

	// pie plots for disease colours
	let pienode = node.filter(function (d) {return !(d.data.hidden && !opts.DEBUG);}).selectAll("pienode")
	   .data(function(d) {	 		// set the disease data for the pie plot
		   let ncancers = 0;
		   let cancers = $.map(opts.diseases, function(_val, i){
			   if(utils.prefixInObj(opts.diseases[i].type, d.data)) {ncancers++; return 1;} else return 0;
		   });
		   if(ncancers === 0) cancers = [1];
		   return [$.map(cancers, function(val, _i){
			   return {'cancer': val, 'ncancers': ncancers, 'id': d.data.name,
						'sex': d.data.sex, 'proband': d.data.proband, 'hidden': d.data.hidden,
						'affected': d.data.affected,
						'exclude': d.data.exclude};})];
	   })
	   .enter()
		.append("g");

	pienode.selectAll("path")
		.data(d3.pie().value(function(d) {return d.cancer;}))
		.enter().append("path")
			.attr("clip-path", function(d) {return "url(#"+d.data.id+")";}) // clip the rectangle
			.attr("class", "pienode")
			.attr("d", d3.arc().innerRadius(0).outerRadius(opts.symbol_size))
			.style("fill", function(d, i) {
				if(d.data.exclude)
					return 'lightgrey';
				if(d.data.ncancers === 0) {
					if(d.data.affected)
						return 'darkgrey';
					return opts.node_background;
				}
				return opts.diseases[i].colour;
			});

	// adopted in/out brackets
	node.filter(function (d) {return !d.data.hidden && (d.data.adopted_in || d.data.adopted_out);})
		.append("path")
		.attr("d", function(_d) {
			let dx = -(opts.symbol_size * 0.66);
			let dy = -(opts.symbol_size * 0.64);
			let indent = opts.symbol_size/4;
			return get_bracket(dx, dy, indent, opts)+get_bracket(-dx, dy, -indent, opts);
			})
		.style("stroke", function (d) {
			return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
		})
		.style("stroke-width", function (_d) {
			return ".1em";
		})
		.style("stroke-dasharray", function (d) {return !d.data.exclude ? null : ("3, 3");})
		.style("fill", "none");


	// alive status = 0; dead status = 1
	node.filter(function (d) {return d.data.status === "1" || d.data.status === 1;})
		.append('line')
			.style("stroke", "black")
			.attr("x1", function(_d, _i) {return -0.6*opts.symbol_size;})
			.attr("y1", function(_d, _i) {return 0.6*opts.symbol_size;})
			.attr("x2", function(_d, _i) {return 0.6*opts.symbol_size;})
			.attr("y2", function(_d, _i) {return -0.6*opts.symbol_size;});

/*
 * let warn = node.filter(function (d) { return (!d.data.age || !d.data.yob) && !d.data.hidden; }).append("text") .attr('font-family', 'FontAwesome')
 * .attr("x", ".25em") .attr("y", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size)) .html("\uf071"); warn.append("svg:title").text("incomplete");
 */
	// add display names and labels defined by opts.labels
	addLabels(opts, node);

	//
	if(opts.showWidgets) addWidgets(opts, node);

	// links between partners
	let clash_depth = {};

	// get path looping over node(s)
	let draw_path = function(clash, dx, dy1, dy2, parent_node, cshift) {
		let extend = function(i, l) {
			if(i+1 < l)   // && Math.abs(clash[i] - clash[i+1]) < (opts.symbol_size*1.25)
				return extend(++i);
			return i;
		};
		let path = "";
		for(let j=0; j<clash.length; j++) {
			let k = extend(j, clash.length);
			let dx1 = clash[j] - dx - cshift;
			let dx2 = clash[k] + dx + cshift;
			if(parent_node.x > dx1 && parent_node.x < dx2)
				parent_node.y = dy2;

			path += "L" + dx1 + "," +  (dy1 - cshift) +
					"L" + dx1 + "," +  (dy2 - cshift) +
					"L" + dx2 + "," +  (dy2 - cshift) +
					"L" + dx2 + "," +  (dy1 - cshift);
			j = k;
		}
		return path;
	}


	partners = ped.selectAll(".partner")
		.data(ptrLinkNodes)
		.enter()
			.insert("path", "g")
			.attr("fill", "none")
			.attr("stroke", "#000")
			.attr("shape-rendering", "auto")
			.attr('d', function(d, _i) {
				let node1 = utils.getNodeByName(flattenNodes, d.mother.data.name);
				let node2 = utils.getNodeByName(flattenNodes, d.father.data.name);
				let consanguity = utils.consanguity(node1, node2, opts);
				let divorced = (d.mother.data.divorced &&  d.mother.data.divorced === d.father.data.name);

				let x1 = (d.mother.x < d.father.x ? d.mother.x : d.father.x);
				let x2 = (d.mother.x < d.father.x ? d.father.x : d.mother.x);
				let dy1 = d.mother.y;
				let dy2, dx, parent_node;

				// identify clashes with other nodes at the same depth
				let clash = check_ptr_link_clashes(opts, d);
				let path = "";
				if(clash) {
					if(d.mother.depth in clash_depth)
						clash_depth[d.mother.depth] += 4;
					else
						clash_depth[d.mother.depth] = 4;

					dy1 -= clash_depth[d.mother.depth];
					dx = clash_depth[d.mother.depth] + (opts.symbol_size/2) + 2;

					let parent_nodes = d.mother.data.parent_node;
					let parent_node_name = parent_nodes[0];
					for(let ii=0; ii<parent_nodes.length; ii++) {
						if(parent_nodes[ii].father.name === d.father.data.name &&
						   parent_nodes[ii].mother.name === d.mother.data.name)
							parent_node_name = parent_nodes[ii].name;
					}
					parent_node = utils.getNodeByName(flattenNodes, parent_node_name);
					parent_node.y = dy1; // adjust hgt of parent node
					clash.sort(function (a,b) {return a - b;});

					dy2 = (dy1-(opts.symbol_size/2)-3);
					path = draw_path(clash, dx, dy1, dy2, parent_node, 0);
				}

				let divorce_path = "";
				if(divorced && !clash)
					divorce_path = "M" + (x1+((x2-x1)*.66)+6) + "," + (dy1-6) +
								   "L"+  (x1+((x2-x1)*.66)-6) + "," + (dy1+6) +
								   "M" + (x1+((x2-x1)*.66)+10) + "," + (dy1-6) +
								   "L"+  (x1+((x2-x1)*.66)-2)  + "," + (dy1+6);
				if(consanguity) {  // consanguinous, draw double line between partners
					dy1 = (d.mother.x < d.father.x ? d.mother.y : d.father.y);
					dy2 = (d.mother.x < d.father.x ? d.father.y : d.mother.y);

					let cshift = 3;
					if(Math.abs(dy1-dy2) > 0.1) {	  // DIFFERENT LEVEL
						return	"M" + x1 + "," + dy1 + "L" + x2 + "," + dy2 +
								"M" + x1 + "," + (dy1 - cshift) + "L" + x2 + "," + (dy2 - cshift);
					} else {						   // SAME LEVEL
						let path2 = (clash ? draw_path(clash, dx, dy1, dy2, parent_node, cshift) : "");
						return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 +
								"M" + x1 + "," + (dy1 - cshift) + path2 + "L" + x2 + "," + (dy1 - cshift) + divorce_path;
					}
				}
				return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + divorce_path;
			});

	// links to children
	ped.selectAll(".link")
		.data(root.links(nodes.descendants()))
		.enter()
			.filter(function (d) {
				// filter unless debug is set
				return (opts.DEBUG ||
						(d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden));
			})
			.insert("path", "g")
			.attr("fill", "none")
			.attr("stroke-width", function(d, _i) {
				if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
					return 1;
				return (opts.DEBUG ? 2 : 1);
			})
			.attr("stroke", function(d, _i) {
				if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
					return 'pink';
				return "#000";
			})
			.attr("stroke-dasharray", function(d, _i) {
				if(!d.target.data.adopted_in) return null;
				let dash_len = Math.abs(d.source.y-((d.source.y + d.target.y) / 2));
				let dash_array = [dash_len, 0, Math.abs(d.source.x-d.target.x), 0];
				let twins = utils.getTwins(opts.dataset, d.target.data);
				if(twins.length >= 1) dash_len = dash_len * 3;
				for(let usedlen = 0; usedlen < dash_len; usedlen += 10)
					$.merge(dash_array, [5, 5]);
				return dash_array;
			})
			.attr("shape-rendering", function(d, _i) {
				if(d.target.data.mztwin || d.target.data.dztwin)
					return "geometricPrecision";
				return "auto";
			})
			.attr("d", function(d, _i) {
				if(d.target.data.mztwin || d.target.data.dztwin) {
					// get twin position
					let twins = utils.getTwins(opts.dataset, d.target.data);
					if(twins.length >= 1) {
						let twinx = 0;
						let xmin = d.target.x;
						//let xmax = d.target.x;
						for(let t=0; t<twins.length; t++) {
							let thisx = utils.getNodeByName(flattenNodes, twins[t].name).x;
							if(xmin > thisx) xmin = thisx;
							//if(xmax < thisx) xmax = thisx;
							twinx += thisx;
						}

						let xmid = ((d.target.x + twinx) / (twins.length+1));
						let ymid = ((d.source.y + d.target.y) / 2);

						let xhbar = "";
						if(xmin === d.target.x && d.target.data.mztwin) {
							// horizontal bar for mztwins
							let xx = (xmid + d.target.x)/2;
							let yy = (ymid + (d.target.y-(opts.symbol_size/2)))/2;
							xhbar = "M" + xx + "," + yy +
									"L" + (xmid + (xmid-xx)) + " " + yy;
						}

						return "M" + (d.source.x) + "," + (d.source.y ) +
							   "V" + ymid +
							   "H" + xmid +
							   "L" + (d.target.x) + " " + (d.target.y-(opts.symbol_size/2)) +
							   xhbar;
					}
				}

				if(d.source.data.mother) {   // check parents depth to see if they are at the same level in the tree
					let ma = utils.getNodeByName(flattenNodes, d.source.data.mother.name);
					let pa = utils.getNodeByName(flattenNodes, d.source.data.father.name);

					if(ma.depth !== pa.depth) {
						return "M" + (d.source.x) + "," + ((ma.y + pa.y) / 2) +
							   "H" + (d.target.x) +
							   "V" + (d.target.y);
					}
				}

				return "M" + (d.source.x) + "," + (d.source.y ) +
					   "V" + ((d.source.y + d.target.y) / 2) +
					   "H" + (d.target.x) +
					   "V" + (d.target.y);
			});

	// draw proband arrow
	let probandIdx  = utils.getProbandIndex(opts.dataset);
	if(typeof probandIdx !== 'undefined') {
		let probandNode = utils.getNodeByName(flattenNodes, opts.dataset[probandIdx].name);
		let triid = "triangle"+utils.makeid(3);
		ped.append("svg:defs").append("svg:marker")	// arrow head
			.attr("id", triid)
			.attr("refX", 6)
			.attr("refY", 6)
			.attr("markerWidth", 20)
			.attr("markerHeight", 20)
			.attr("orient", "auto")
			.append("path")
			.attr("d", "M 0 0 12 6 0 12 3 6")
			.style("fill", "black");

		ped.append("line")
			.attr("x1", probandNode.x-(opts.symbol_size/0.7))
			.attr("y1", probandNode.y+(opts.symbol_size/1.4))
			.attr("x2", probandNode.x-(opts.symbol_size/1.4))
			.attr("y2", probandNode.y+(opts.symbol_size/4))
			.attr("stroke-width", 1)
			.attr("stroke", "black")
			.attr("marker-end", "url(#"+triid+")");
	}

	// drag and zoom
	init_zoom(opts, svg);
	// drag nodes
	if(opts.dragNode) init_dragging(opts, node);
	return opts;
}

function has_gender(sex) {
	return sex === "M" || sex === "F";
}

//adopted in/out brackets
function get_bracket(dx, dy, indent, opts) {
	return 	"M" + (dx+indent) + "," + dy +
			"L" + dx + " " + dy +
			"L" + dx + " " + (dy+(opts.symbol_size *  1.28)) +
			"L" + dx + " " + (dy+(opts.symbol_size *  1.28)) +
			"L" + (dx+indent) + "," + (dy+(opts.symbol_size *  1.28))
}

// check for crossing of partner lines
function check_ptr_links(opts, ptrLinkNodes){
	for(let a=0; a<ptrLinkNodes.length; a++) {
		let clash = check_ptr_link_clashes(opts, ptrLinkNodes[a]);
		if(clash)
			console.log("CLASH :: "+ptrLinkNodes[a].mother.data.name+" "+ptrLinkNodes[a].father.data.name, clash);
	}
}

export function check_ptr_link_clashes(opts, anode) {
	let root = utils.roots[opts.targetDiv];
	let flattenNodes = utils.flatten(root);
	let mother, father;
	if('name' in anode) {
		anode = utils.getNodeByName(flattenNodes, anode.name);
		if(!('mother' in anode.data))
			return null;
		mother = utils.getNodeByName(flattenNodes, anode.data.mother);
		father = utils.getNodeByName(flattenNodes, anode.data.father);
	} else {
		mother = anode.mother;
		father = anode.father;
	}

	let x1 = (mother.x < father.x ? mother.x : father.x);
	let x2 = (mother.x < father.x ? father.x : mother.x);
	let dy = mother.y;

	// identify clashes with other nodes at the same depth
	let clash = $.map(flattenNodes, function(bnode, _i){
		return !bnode.data.hidden &&
				bnode.data.name !== mother.data.name &&  bnode.data.name !== father.data.name &&
				bnode.y === dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
	});
	return clash.length > 0 ? clash : null;
}

// group top_level nodes by their partners
function group_top_level(dataset) {
	// let top_level = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
	// calculate top_level nodes
	for(let i=0;i<dataset.length;i++) {
		if(utils.getDepth(dataset, dataset[i].name) === 2)
			dataset[i].top_level = true;
	}

	let top_level = [];
	let top_level_seen = [];
	for(let i=0;i<dataset.length;i++) {
		let node = dataset[i];
		if('top_level' in node && $.inArray(node.name, top_level_seen) === -1){
			top_level_seen.push(node.name);
			top_level.push(node);
			let ptrs = utils.get_partners(dataset, node);
			for(let j=0; j<ptrs.length; j++){
				if($.inArray(ptrs[j], top_level_seen) === -1) {
					top_level_seen.push(ptrs[j]);
					top_level.push(utils.getNodeByName(dataset, ptrs[j]));
				}
			}
		}
	}

	let newdataset = $.map(dataset, function(val, _i){return 'top_level' in val && val.top_level ? null : val;});
	for (let i = top_level.length; i > 0; --i)
		newdataset.unshift(top_level[i-1]);
	return newdataset;
}

export function rebuild(opts) {
	$("#"+opts.targetDiv).empty();
	pedcache.init_cache(opts);
	try {
		build(opts);
	} catch(e) {
		console.error(e);
		throw e;
	}

	try {
		templates.update(opts);		// eslint-disable-line no-undef
	} catch(e) {
		// templates not declared
	}
}

$(document).on('rebuild', function(_e, opts){
	rebuild(opts);
})

$(document).on('build', function(_e, opts){
	build(opts);
})
