// Pedigree Tree Builder
import * as pedigree_util from '/es/pedigree_utils.js';
import * as pbuttons from '/es/pbuttons.js';
import {addWidgets} from '/es/widgets.js';
import * as pedcache from '/es/pedcache.js';
import * as io from '/es/io.js';

let roots = {};
export function build(options) {
    let opts = $.extend({ // defaults
    	targetDiv: 'pedigree_edit',
    	dataset: [ {"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
    		       {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
    			   {"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}],
    	width: 600,
    	height: 400,
    	symbol_size: 35,
    	zoomIn: 1.0,
    	zoomOut: 1.0,
    	diseases: [	{'type': 'breast_cancer', 'colour': '#F68F35'},
    				{'type': 'breast_cancer2', 'colour': 'pink'},
					{'type': 'ovarian_cancer', 'colour': '#4DAA4D'},
					{'type': 'pancreatic_cancer', 'colour': '#4289BA'},
					{'type': 'prostate_cancer', 'colour': '#D5494A'}],
		labels: ['stillbirth', 'age', 'yob', 'alleles'],
		keep_proband_on_reset: false,
		font_size: '.75em',
		font_family: 'Helvetica',
		font_weight: 700,
		background: "#EEE",
		node_background: '#fdfdfd',
		validate: true,
    	DEBUG: false}, options );

    if ( $( "#fullscreen" ).length === 0 ) {
    	// add undo, redo, fullscreen buttons and event listeners once
		pbuttons.add(opts);
		io.add(opts);
    }

    if(pedcache.nstore(opts) == -1)
    	pedcache.add(opts);

    pbuttons.updateButtons(opts);

    // validate pedigree data
    validate_pedigree(opts);
    // group top level nodes by partners
    opts.dataset = group_top_level(opts.dataset);

    if(opts.DEBUG)
    	pedigree_util.print_opts(opts);
    let svg_dimensions = get_svg_dimensions(opts);
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

	let xytransform = pedcache.getposition(opts);  // cached position
	let xtransform = xytransform[0];
	let ytransform = xytransform[1];
	let zoom = 1;
	if(xytransform.length == 3){
		zoom = xytransform[2];
	}

	if(xtransform === null || ytransform === null) {
		xtransform = opts.symbol_size/2;
		ytransform = (-opts.symbol_size*2.5);
	}
	let ped = svg.append("g")
			 .attr("class", "diagram")
             .attr("transform", "translate("+xtransform+"," + ytransform + ") scale("+zoom+")");

	let top_level = $.map(opts.dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
	let hidden_root = {
		name : 'hidden_root',
		id : 0,
		hidden : true,
		children : top_level
	};

	let partners = pedigree_util.buildTree(opts, hidden_root, hidden_root)[0];
	let root = d3.hierarchy(hidden_root);
	roots[opts.targetDiv] = root;

	/// get score at each depth used to adjust node separation
	let tree_dimensions = get_tree_dimensions(opts);
	if(opts.DEBUG)
		console.log('opts.width='+svg_dimensions.width+' width='+tree_dimensions.width+
				    ' opts.height='+svg_dimensions.height+' height='+tree_dimensions.height);

	let treemap = d3.tree().separation(function(a, b) {
		return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
	}).size([tree_dimensions.width, tree_dimensions.height]);

	let nodes = treemap(root.sort(function(a, b) { return a.data.id - b.data.id; }));
	let flattenNodes = nodes.descendants();

	// check the number of visible nodes equals the size of the pedigree dataset
	let vis_nodes = $.map(opts.dataset, function(p, i){return p.hidden ? null : p;});
	if(vis_nodes.length != opts.dataset.length) {
		throw create_err('NUMBER OF VISIBLE NODES DIFFERENT TO NUMBER IN THE DATASET');
	}

	pedigree_util.adjust_coords(opts, nodes, flattenNodes);

	let ptrLinkNodes = pedigree_util.linkNodes(flattenNodes, partners);
	check_ptr_links(opts, ptrLinkNodes);   // check for crossing of partner lines

	let node = ped.selectAll(".node")
				  .data(nodes.descendants())
				  .enter()
				   	.append("g")
				   	.attr("transform", function(d, i) {
						return "translate(" + d.x + "," + d.y + ")";
					});

	// provide a border to the node
	node.append("path")
		.filter(function (d) {return !d.data.hidden;})
		.attr("shape-rendering", "geometricPrecision")
		.attr("transform", function(d) {return d.data.sex == "U" && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";})
		.attr("d", d3.symbol().size(function(d) { return (opts.symbol_size * opts.symbol_size) + 2;})
				.type(function(d) {
					if(d.data.miscarriage || d.data.termination)
						return d3.symbolTriangle;
					return d.data.sex == "F" ? d3.symbolCircle : d3.symbolSquare;}))
		.style("stroke", function (d) {
			return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
		})
		.style("stroke-width", function (d) {
			return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
		})
		.style("stroke-dasharray", function (d) {return !d.data.exclude ? null : ("3, 3");})
		.style("fill", "none");

	// set a clippath
	node.append("clipPath")
		.attr("id", function (d) {return d.data.name;}).append("path")
		.filter(function (d) {return !(d.data.hidden && !opts.DEBUG);})
		.attr("class", "node")
		.attr("transform", function(d) {return d.data.sex == "U" && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";})
		.attr("d", d3.symbol().size(function(d) {
				if (d.data.hidden)
					return opts.symbol_size * opts.symbol_size / 5;
				return opts.symbol_size * opts.symbol_size;
			})
			.type(function(d) {
				if(d.data.miscarriage || d.data.termination)
					return d3.symbolTriangle;
				return d.data.sex == "F" ? d3.symbolCircle :d3.symbolSquare;}));

	// pie plots for disease colours
	let pienode = node.selectAll("pienode")
	   .data(function(d) {     		// set the disease data for the pie plot
		   let ncancers = 0;
		   let cancers = $.map(opts.diseases, function(val, i){
			   if(prefixInObj(opts.diseases[i].type, d.data)) {ncancers++; return 1;} else return 0;
		   });
		   if(ncancers === 0) cancers = [1];
		   return [$.map(cancers, function(val, i){
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
	node.append("path")
		.filter(function (d) {return !d.data.hidden && (d.data.adopted_in || d.data.adopted_out);})
		.attr("d", function(d) { {
			function get_bracket(dx, dy, indent) {
				return 	"M" + (dx+indent) + "," + dy +
						"L" + dx + " " + dy +
						"L" + dx + " " + (dy+(opts.symbol_size *  1.28)) +
						"L" + dx + " " + (dy+(opts.symbol_size *  1.28)) +
						"L" + (dx+indent) + "," + (dy+(opts.symbol_size *  1.28))
			}
			let dx = -(opts.symbol_size * 0.66);
			let dy = -(opts.symbol_size * 0.64);
			let indent = opts.symbol_size/4;
			return get_bracket(dx, dy, indent)+get_bracket(-dx, dy, -indent);
			}})
		.style("stroke", function (d) {
			return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
		})
		.style("stroke-width", function (d) {
			return ".1em";
		})
		.style("stroke-dasharray", function (d) {return !d.data.exclude ? null : ("3, 3");})
		.style("fill", "none");


	// alive status = 0; dead status = 1
	let status = node.append('line')
	.filter(function (d) {return d.data.status == 1;})
	    .style("stroke", "black")
	    .attr("x1", function(d, i) {return -0.6*opts.symbol_size;})
	    .attr("y1", function(d, i) {return 0.6*opts.symbol_size;})
	    .attr("x2", function(d, i) {return 0.6*opts.symbol_size;})
	    .attr("y2", function(d, i) {return -0.6*opts.symbol_size;});

	// names of individuals
	addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), -(0.1 * opts.symbol_size),
			function(d) {
				if(opts.DEBUG)
					return ('display_name' in d.data ? d.data.display_name : d.data.name) + '  ' + d.data.id;
				return 'display_name' in d.data ? d.data.display_name : '';});

/*		let warn = node.filter(function (d) {
    		return (!d.data.age || !d.data.yob) && !d.data.hidden;
		}).append("text")
		.attr('font-family', 'FontAwesome')
		.attr("x", ".25em")
		.attr("y", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size))
		.html("\uf071");
		warn.append("svg:title").text("incomplete");*/

	let font_size = parseInt(getPx(opts)) + 4;
	// display label defined in opts.labels e.g. alleles/genotype data
	for(let ilab=0; ilab<opts.labels.length; ilab++) {
		let label = opts.labels[ilab];
		addLabel(opts, node, ".25em", -(0.7 * opts.symbol_size),
			function(d) {
				if(!d.data[label])
					return;
				d.y_offset = (ilab === 0 || !d.y_offset ? font_size*2.25 : d.y_offset+font_size);
				return d.y_offset;
			},
			function(d) {
				if(d.data[label]) {
					if(label === 'alleles') {
						let alleles = "";
						let vars = d.data.alleles.split(';');
						for(let ivar = 0;ivar < vars.length;ivar++) {
							if(vars[ivar] !== "") alleles += vars[ivar] + ';';
						}
						return alleles;
					} else if(label === 'age') {
						return d.data[label] +'y';
					} else if(label === 'stillbirth') {
						return "SB";
					}
					return d.data[label];
				}
			}, 'indi_details');
	}

	// individuals disease details
	for(let i=0;i<opts.diseases.length; i++) {
		let disease = opts.diseases[i].type;
		addLabel(opts, node, ".25em", -(opts.symbol_size),
				function(d) {
					let y_offset = (d.y_offset ? d.y_offset+font_size: font_size*2.2);
					for(let j=0;j<opts.diseases.length; j++) {
						if(disease === opts.diseases[j].type)
							break;
						if(prefixInObj(opts.diseases[j].type, d.data))
							y_offset += font_size-1;
					}
					return y_offset;
				},
				function(d) {
					let dis = disease.replace('_', ' ').replace('cancer', 'ca.');
					return disease+'_diagnosis_age' in d.data ? dis +": "+ d.data[disease+'_diagnosis_age'] : '';
				}, 'indi_details');
	}

	//
	addWidgets(opts, node);

	// links between partners
	let clash_depth = {};
	partners = ped.selectAll(".partner")
	  	.data(ptrLinkNodes)
	  	.enter()
	  		.insert("path", "g")
	  		.attr("fill", "none")
	  		.attr("stroke", "#000")
	  		.attr("shape-rendering", "auto")
	  		.attr('d', function(d, i) {
	  			let node1 = pedigree_util.getNodeByName(flattenNodes, d.mother.data.name);
	  			let node2 = pedigree_util.getNodeByName(flattenNodes, d.father.data.name);
	  			let consanguity = pedigree_util.consanguity(node1, node2, opts);
	  			let divorced = (d.mother.data.divorced &&  d.mother.data.divorced === d.father.data.name);

	  			let x1 = (d.mother.x < d.father.x ? d.mother.x : d.father.x);
  				let x2 = (d.mother.x < d.father.x ? d.father.x : d.mother.x);
  				let dy1 = d.mother.y;
  				let dy2;

  				// identify clashes with other nodes at the same depth
	  			let clash = check_ptr_link_clashes(opts, d);
	  			let path = "";
	  			if(clash) {
	  				if(d.mother.depth in clash_depth)
	  					clash_depth[d.mother.depth] += 4;
	  				else
	  					clash_depth[d.mother.depth] = 4;

	  				dy1 -= clash_depth[d.mother.depth];
	  				let dx = clash_depth[d.mother.depth] + opts.symbol_size/2 + 2;

	  				let parent_nodes = d.mother.data.parent_node;
	  				let parent_node_name = parent_nodes[0];
	  				for(let ii=0; ii<parent_nodes.length; ii++) {
	  					if(parent_nodes[ii].father.name === d.father.data.name &&
	  					   parent_nodes[ii].mother.name === d.mother.data.name)
	  						 parent_node_name = parent_nodes[ii].name;
	  				}
	  				let parent_node = pedigree_util.getNodeByName(flattenNodes, parent_node_name);
					parent_node.y = dy1; // adjust hgt of parent node
	  				clash.sort(function (a,b) {return a - b;});

	  				dy2 = (dy1-opts.symbol_size/2-3);
	  				// get path looping over node(s)
	  				draw_path = function(clash, dx, dy1, dy2, parent_node, cshift) {
		  				extend = function(i, l) {
		  					if(i+1 < l)   //  && Math.abs(clash[i] - clash[i+1]) < (opts.symbol_size*1.25)
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
	  				if(Math.abs(dy1-dy2) > 0.1) {      // DIFFERENT LEVEL
	  					return	"M" + x1 + "," + dy1 + "L" + x2 + "," + dy2 +
  				                "M" + x1 + "," + (dy1 - cshift) + "L" + x2 + "," + (dy2 - cshift);
	  				} else {                           // SAME LEVEL
		  				let path2 = (clash ? draw_path(clash, dx, dy1, dy2, parent_node, cshift) : "");
		  				return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 +
		  				        "M" + x1 + "," + (dy1 - cshift) + path2 + "L" + x2 + "," + (dy1 - cshift) + divorce_path;
	  				}
	  			}
	  			return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + divorce_path;
	  		});

	// links to children
	let links = ped.selectAll(".link")
		.data(root.links(nodes.descendants()))
		.enter()
			.filter(function (d) {
				// filter unless debug is set
				return (opts.DEBUG ||
						(d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden));
			})
			.insert("path", "g")
			.attr("fill", "none")
			.attr("stroke-width", function(d, i) {
				if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
					return 1;
				return (opts.DEBUG ? 2 : 1);
			})
			.attr("stroke", function(d, i) {
				if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
					return 'pink';
				return "#000";
			})
			.attr("stroke-dasharray", function(d, i) {
				if(!d.target.data.adopted_in) return null;
				let dash_len = Math.abs(d.source.y-((d.source.y + d.target.y) / 2));
				let dash_array = [dash_len, 0, Math.abs(d.source.x-d.target.x), 0];
				let twins = pedigree_util.getTwins(opts.dataset, d.target.data);
				if(twins.length >= 1) dash_len = dash_len * 3;
				for(let usedlen = 0; usedlen < dash_len; usedlen += 10)
					$.merge(dash_array, [5, 5]);
				return dash_array;
			})
			.attr("shape-rendering", function(d, i) {
				if(d.target.data.mztwin || d.target.data.dztwin)
					return "geometricPrecision";
				return "auto";
			})
			.attr("d", function(d, i) {
				if(d.target.data.mztwin || d.target.data.dztwin) {
					// get twin position
					let twins = pedigree_util.getTwins(opts.dataset, d.target.data);
					if(twins.length >= 1) {
						let twinx = 0;
						let xmin = d.target.x;
						let xmax = d.target.x;
						for(let t=0; t<twins.length; t++) {
							let thisx = pedigree_util.getNodeByName(flattenNodes, twins[t].name).x;
							if(xmin > thisx) xmin = thisx;
							if(xmax < thisx) xmax = thisx;
							twinx += thisx;
						}

						let xmid = ((d.target.x + twinx) / (twins.length+1));
						let ymid = ((d.source.y + d.target.y) / 2);

						let xhbar = "";
						if(xmin === d.target.x && d.target.data.mztwin) {
							// horizontal bar for mztwins
							let xx = (xmid + d.target.x)/2;
							let yy = (ymid + (d.target.y-opts.symbol_size/2))/2;
							xhbar = "M" + xx + "," + yy +
							     	"L" + (xmid + (xmid-xx)) + " " + yy;
						}

						return "M" + (d.source.x) + "," + (d.source.y ) +
					           "V" + ymid +
					           "H" + xmid +
					           "L" + (d.target.x) + " " + (d.target.y-opts.symbol_size/2) +
					           xhbar;
					}
				}

				if(d.source.data.mother) {   // check parents depth to see if they are at the same level in the tree
					let ma = pedigree_util.getNodeByName(flattenNodes, d.source.data.mother.name);
					let pa = pedigree_util.getNodeByName(flattenNodes, d.source.data.father.name);

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
	let probandIdx  = pedigree_util.getProbandIndex(opts.dataset);
	if(typeof probandIdx !== 'undefined') {
		let probandNode = pedigree_util.getNodeByName(flattenNodes, opts.dataset[probandIdx].name);
		let triid = "triangle"+pedigree_util.makeid(3);
		ped.append("svg:defs").append("svg:marker")    // arrow head
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
	        .attr("x1", probandNode.x-opts.symbol_size)
	        .attr("y1", probandNode.y+opts.symbol_size)
	        .attr("x2", probandNode.x-opts.symbol_size/2)
	        .attr("y2", probandNode.y+opts.symbol_size/2)
	        .attr("stroke-width", 1)
	        .attr("stroke", "black")
	        .attr("marker-end", "url(#"+triid+")");
	}
	// drag and zoom
	zoom = d3.zoom()
	  .scaleExtent([opts.zoomIn, opts.zoomOut])
	  .on('zoom', zoomFn);

	function zoomFn() {
		let t = d3.event.transform;
		if(pedigree_util.isIE() && t.x.toString().length > 10)	// IE fix for drag off screen
			return;
		let pos = [(t.x + parseInt(xtransform)), (t.y + parseInt(ytransform))];
		if(t.k == 1) {
			pedcache.setposition(opts, pos[0], pos[1]);
		} else {
			pedcache.setposition(opts, pos[0], pos[1], t.k);
		}
		ped.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ') scale(' + t.k + ')');
	}
	svg.call(zoom);
	return opts;
};

// validate pedigree data
export function validate_pedigree(opts){
	if(opts.validate) {
		if (typeof opts.validate == 'function') {
			if(opts.DEBUG)
				console.log('CALLING CONFIGURED VALIDATION FUNCTION');
			return opts.validate.call(this, opts);;
	    }

		function create_err(err) {
			console.error(err);
			return new Error(err);
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

					let midx = pedigree_util.getIdxByName(opts.dataset, mother);
					let fidx = pedigree_util.getIdxByName(opts.dataset, father);
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
		let unconnected = pedigree_util.unconnected(opts.dataset);
		if(unconnected.length > 0)
			console.warn("individuals unconnected to pedigree ", unconnected);
	}
}

// check if the object contains a key with a given prefix
function prefixInObj(prefix, obj) {
	let found = false;
	if(obj)
		$.each(obj, function(k, n){
		    if(k.indexOf(prefix+"_") === 0 || k === prefix) {
		    	found = true;
		    	return found;
		    }
		});
	return found;
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
	let root = roots[opts.targetDiv];
	let flattenNodes = pedigree_util.flatten(root);
	let mother, father;
	if('name' in anode) {
		anode = pedigree_util.getNodeByName(flattenNodes, anode.name);
		if(!('mother' in anode.data))
			return null;
		mother = pedigree_util.getNodeByName(flattenNodes, anode.data.mother);
		father = pedigree_util.getNodeByName(flattenNodes, anode.data.father);
	} else {
		mother = anode.mother;
		father = anode.father;
	}

	let x1 = (mother.x < father.x ? mother.x : father.x);
	let x2 = (mother.x < father.x ? father.x : mother.x);
	let dy = mother.y;

	// identify clashes with other nodes at the same depth
	let clash = $.map(flattenNodes, function(bnode, i){
		return !bnode.data.hidden &&
			    bnode.data.name !== mother.data.name &&  bnode.data.name !== father.data.name &&
			    bnode.y == dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
	});
	return clash.length > 0 ? clash : null;
};

function get_svg_dimensions(opts) {
    return {'width' : (pbuttons.is_fullscreen()? window.innerWidth  : opts.width),
    	    'height': (pbuttons.is_fullscreen()? window.innerHeight : opts.height)};
}

export function get_tree_dimensions(opts) {
	/// get score at each depth used to adjust node separation
	let svg_dimensions = get_svg_dimensions(opts);
	let maxscore = 0;
	let generation = {};
	for(let i=0; i<opts.dataset.length; i++) {
		let depth = pedigree_util.getDepth(opts.dataset, opts.dataset[i].name);
		let children = pedigree_util.getAllChildren(opts.dataset, opts.dataset[i]);

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
};

// group top_level nodes by their partners
function group_top_level(dataset) {
	// let top_level = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
	// calculate top_level nodes
	for(let i=0;i<dataset.length;i++) {
		if(pedigree_util.getDepth(dataset, dataset[i].name) == 2)
			dataset[i].top_level = true;
	}

	let top_level = [];
    let top_level_seen = [];
    for(let i=0;i<dataset.length;i++) {
    	let node = dataset[i];
    	if('top_level' in node && $.inArray(node.name, top_level_seen) == -1){
    		top_level_seen.push(node.name);
    		top_level.push(node);
    		let ptrs = pedigree_util.get_partners(dataset, node);
    		for(let j=0; j<ptrs.length; j++){
    			if($.inArray(ptrs[j], top_level_seen) == -1) {
        			top_level_seen.push(ptrs[j]);
        			top_level.push(pedigree_util.getNodeByName(dataset, ptrs[j]));
    			}
    		}
    	}
    }

    let newdataset = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? null : val;});
    for (let i = top_level.length; i > 0; --i)
    	newdataset.unshift(top_level[i-1]);
    return newdataset;
}

// get height in pixels
function getPx(opts){
	let emVal = opts.font_size;
	if (emVal === parseInt(emVal, 10)) // test if integer
		return emVal;

	if(emVal.indexOf("px") > -1)
		return emVal.replace('px', '');
	else if(emVal.indexOf("em") === -1)
		return emVal;
	emVal = parseFloat(emVal.replace('em', ''));
	return (parseFloat(getComputedStyle($('#'+opts.targetDiv).get(0)).fontSize)*emVal)-1.0;
};

// Add label
function addLabel(opts, node, size, fx, fy, ftext, class_label) {
	node.filter(function (d) {
		return d.data.hidden && !opts.DEBUG ? false : true;
	}).append("text")
	.attr("class", class_label + ' ped_label' || "ped_label")
	.attr("x", fx)
	.attr("y", fy)
	//.attr("dy", size)
	.attr("font-family", opts.font_family)
	.attr("font-size", opts.font_size)
	.attr("font-weight", opts.font_weight)
	.text(ftext);
}

export function rebuild(opts) {
	$("#"+opts.targetDiv).empty();
	pedcache.add(opts);
	try {
		build(opts);
	} catch(e) {
		console.error(e);
		throw e;
	}

	try {
		templates.update(opts);
	} catch(e) {
		// templates not declared
	}
};

export function copy_dataset(dataset) {
	if(dataset[0].id) { // sort by id
		dataset.sort(function(a,b){return (!a.id || !b.id ? 0: (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));});
	}

	let disallowed = ["id", "parent_node"];
	let newdataset = [];
	for(let i=0; i<dataset.length; i++){
		let obj = {};
		for(let key in dataset[i]) {
			if(disallowed.indexOf(key) == -1)
				obj[key] = dataset[i][key];
		}
		newdataset.push(obj);
	}
	return newdataset;
};

// add children to a given node
export function addchild(dataset, node, sex, nchild, twin_type) {
	if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
		return new Error("INVALID TWIN TYPE SET: "+twin_type);

	if (typeof nchild === typeof undefined)
		nchild = 1;
	let children = pedigree_util.getAllChildren(dataset, node);
	let ptr_name, idx;
	if (children.length === 0) {
		let partner = addsibling(dataset, node, node.sex === 'F' ? 'M': 'F', node.sex === 'F');
		partner.noparents = true;
		ptr_name = partner.name;
		idx = pedigree_util.getIdxByName(dataset, node.name)+1;
	} else {
		let c = children[0];
		ptr_name = (c.father === node.name ? c.mother : c.father);
		idx = pedigree_util.getIdxByName(dataset, c.name);
	}

	let twin_id;
	if(twin_type)
		twin_id = getUniqueTwinID(dataset, twin_type);
	let newchildren = [];
	for (let i = 0; i < nchild; i++) {
		let child = {"name": pedigree_util.makeid(4), "sex": sex,
				     "mother": (node.sex === 'F' ? node.name : ptr_name),
			         "father": (node.sex === 'F' ? ptr_name : node.name)};
		dataset.splice(idx, 0, child);

		if(twin_type)
			child[twin_type] = twin_id;
		newchildren.push(child);
	}
	return newchildren;
};

//
export function addsibling(dataset, node, sex, add_lhs, twin_type) {
	if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
		return new Error("INVALID TWIN TYPE SET: "+twin_type);

	let newbie = {"name": pedigree_util.makeid(4), "sex": sex};
	if(node.top_level) {
		newbie.top_level = true;
	} else {
		newbie.mother = node.mother;
		newbie.father = node.father;
	}
	let idx = pedigree_util.getIdxByName(dataset, node.name);

	if(twin_type) {
		setMzTwin(dataset, dataset[idx], newbie, twin_type);
	}

	if(add_lhs) { // add to LHS
		if(idx > 0) idx--;
	} else
		idx++;
	dataset.splice(idx, 0, newbie);
	return newbie;
};

// set two siblings as twins
function setMzTwin(dataset, d1, d2, twin_type) {
	if(!d1[twin_type]) {
		d1[twin_type] = getUniqueTwinID(dataset, twin_type);
		if(!d1[twin_type])
			return false;
	}
	d2[twin_type] = d1[twin_type];
	if(d1.yob)
		d2.yob = d1.yob;
	if(d1.age && (d1.status == 0 || !d1.status))
		d2.age = d1.age;
	return true;
}

// get a new unique twins ID, max of 10 twins in a pedigree
function getUniqueTwinID(dataset, twin_type) {
	let mz = [1, 2, 3, 4, 5, 6, 7, 8, 9, "A"];
	for(let i=0; i<dataset.length; i++) {
		if(dataset[i][twin_type]) {
			let idx = mz.indexOf(dataset[i][twin_type]);
			if (idx > -1)
				mz.splice(idx, 1);
		}
	}
	if(mz.length > 0)
		return mz[0];
	return undefined;
}

// sync attributes of twins
export function syncTwins(dataset, d1) {
	if(!d1.mztwin && !d1.dztwin)
		return;
	let twin_type = (d1.mztwin ? "mztwin" : "dztwin");
	for(let i=0; i<dataset.length; i++) {
		let d2 = dataset[i];
		if(d2[twin_type] && d1[twin_type] == d2[twin_type] && d2.name !== d1.name) {
			if(twin_type === "mztwin")
			  d2.sex = d1.sex;
			if(d1.yob)
				d2.yob = d1.yob;
			if(d1.age && (d1.status == 0 || !d1.status))
				d2.age = d1.age;
		}
	}
};

// check integrity twin settings
function checkTwins(dataset) {
	let twin_types = ["mztwin", "dztwin"];
	for(let i=0; i<dataset.length; i++) {
		for(let j=0; j<twin_types.length; j++) {
			let twin_type = twin_types[j];
			if(dataset[i][twin_type]) {
				let count = 0;
				for(let j=0; j<dataset.length; j++) {
					if(dataset[j][twin_type] == dataset[i][twin_type])
						count++;
				}
				if(count < 2)
					delete dataset[i][[twin_type]];
			}
		}
	}
}

// add parents to the 'node'
export function addparents(opts, dataset, name) {
	let mother, father;
	let root = roots[opts.targetDiv];
	let flat_tree = pedigree_util.flatten(root);
	let tree_node = pedigree_util.getNodeByName(flat_tree, name);
	let node  = tree_node.data;
	let depth = tree_node.depth;   // depth of the node in relation to the root (depth = 1 is a top_level node)

	let pid = -101;
	let ptr_name;
	let children = pedigree_util.getAllChildren(dataset, node);
	if(children.length > 0){
		ptr_name = children[0].mother == node.name ? children[0].father : children[0].mother;
		pid = pedigree_util.getNodeByName(flat_tree, ptr_name).data.id;
	}

	let i;
	if(depth == 1) {
		mother = {"name": pedigree_util.makeid(4), "sex": "F", "top_level": true};
		father = {"name": pedigree_util.makeid(4), "sex": "M", "top_level": true};
		dataset.splice(0, 0, mother);
		dataset.splice(0, 0, father);

		for(i=0; i<dataset.length; i++){
			if(dataset[i].top_level && dataset[i].name !== mother.name && dataset[i].name !== father.name){
				delete dataset[i].top_level;
				dataset[i].noparents = true;
				dataset[i].mother = mother.name;
				dataset[i].father = father.name;
			}
		}
	} else {
		let node_mother = pedigree_util.getNodeByName(flat_tree, tree_node.data.mother);
		let node_father = pedigree_util.getNodeByName(flat_tree, tree_node.data.father);
		let node_sibs = pedigree_util.getAllSiblings(dataset, node);

		// lhs & rhs id's for siblings of this node
		let rid = 10000;
		let lid = tree_node.data.id;
		for(i=0; i<node_sibs.length; i++){
			let sid = pedigree_util.getNodeByName(flat_tree, node_sibs[i].name).data.id;
			if(sid < rid && sid > tree_node.data.id)
				rid = sid;
			if(sid < lid)
				lid = sid;
		}
		let add_lhs = (lid >= tree_node.data.id || (pid == lid && rid < 10000));
		if(opts.DEBUG)
			console.log('lid='+lid+' rid='+rid+' nid='+tree_node.data.id+' ADD_LHS='+add_lhs);
		let midx;
		if( (!add_lhs && node_father.data.id > node_mother.data.id) ||
			(add_lhs && node_father.data.id < node_mother.data.id) )
			midx = pedigree_util.getIdxByName(dataset, node.father);
		else
			midx = pedigree_util.getIdxByName(dataset, node.mother);

		let parent = dataset[midx];
		father = addsibling(dataset, parent, 'M', add_lhs);
		mother = addsibling(dataset, parent, 'F', add_lhs);

		let faidx = pedigree_util.getIdxByName(dataset, father.name);
		let moidx = pedigree_util.getIdxByName(dataset, mother.name);
		if(faidx > moidx) {                   // switch to ensure father on lhs of mother
			let tmpfa = dataset[faidx];
			dataset[faidx] = dataset[moidx];
			dataset[moidx] = tmpfa;
		}

		let orphans = pedigree_util.getAdoptedSiblings(dataset, node);
		let nid = tree_node.data.id;
		for(i=0; i<orphans.length; i++){
			let oid = pedigree_util.getNodeByName(flat_tree, orphans[i].name).data.id;
			if(opts.DEBUG)
				console.log('ORPHAN='+i+' '+orphans[i].name+' '+(nid < oid && oid < rid)+' nid='+nid+' oid='+oid+' rid='+rid);
			if((add_lhs || nid < oid) && oid < rid){
				let oidx = pedigree_util.getIdxByName(dataset, orphans[i].name);
				dataset[oidx].mother = mother.name;
				dataset[oidx].father = father.name;
			}
		}
	}

	if(depth == 2) {
		mother.top_level = true;
		father.top_level = true;
	} else if(depth > 2) {
		mother.noparents = true;
		father.noparents = true;
	}
	let idx = pedigree_util.getIdxByName(dataset, node.name);
	dataset[idx].mother = mother.name;
	dataset[idx].father = father.name;
	delete dataset[idx].noparents;

	if('parent_node' in node) {
		let ptr_node = dataset[pedigree_util.getIdxByName(dataset, ptr_name)];
		if('noparents' in ptr_node) {
			ptr_node.mother = mother.name;
			ptr_node.father = father.name;
		}
	}
};

// add partner
export function addpartner(opts, dataset, name) {
	let root = roots[opts.targetDiv];
	let flat_tree = pedigree_util.flatten(root);
	let tree_node = pedigree_util.getNodeByName(flat_tree, name);

	let partner = addsibling(dataset, tree_node.data, tree_node.data.sex === 'F' ? 'M' : 'F', tree_node.data.sex === 'F');
	partner.noparents = true;

	let child = {"name": pedigree_util.makeid(4), "sex": "M"};
	child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
	child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);

	let idx = pedigree_util.getIdxByName(dataset, tree_node.data.name)+2;
	dataset.splice(idx, 0, child);
};

// get adjacent nodes at the same depth
function adjacent_nodes(root, node, excludes) {
	let dnodes = pedigree_util.getNodesAtDepth(pedigree_util.flatten(root), node.depth, excludes);
	let lhs_node, rhs_node;
	for(let i=0; i<dnodes.length; i++) {
		if(dnodes[i].x < node.x)
			lhs_node = dnodes[i];
		if(!rhs_node && dnodes[i].x > node.x)
			rhs_node = dnodes[i];
	}
	return [lhs_node, rhs_node];
}

// delete a node and descendants
export function delete_node_dataset(dataset, node, opts, onDone) {
	let root = roots[opts.targetDiv];
	let fnodes = pedigree_util.flatten(root);
	let deletes = [];
	let i, j;

	// get d3 data node
	if(node.id === undefined) {
		let d3node = pedigree_util.getNodeByName(fnodes, node.name);
		if(d3node !== undefined)
			node = d3node.data;
	}

	if(node.parent_node) {
		for(i=0; i<node.parent_node.length; i++){
			let parent = node.parent_node[i];
			let ps = [pedigree_util.getNodeByName(dataset, parent.mother.name),
				      pedigree_util.getNodeByName(dataset, parent.father.name)];
			// delete parents
			for(j=0; j<ps.length; j++) {
				if(ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
					dataset.splice(pedigree_util.getIdxByName(dataset, ps[j].name), 1);
					deletes.push(ps[j]);
				}
			}

			let children = parent.children;
			let children_names = $.map(children, function(p, i){return p.name;});
			for(j=0; j<children.length; j++) {
				let child = pedigree_util.getNodeByName(dataset, children[j].name);
				if(child){
					child.noparents = true;
					let ptrs = pedigree_util.get_partners(dataset, child);
					let ptr;
					if(ptrs.length > 0)
						ptr = pedigree_util.getNodeByName(dataset, ptrs[0]);
					if(ptr && ptr.mother !== child.mother) {
						child.mother = ptr.mother;
						child.father = ptr.father;
					} else if(ptr) {
						let child_node  = pedigree_util.getNodeByName(fnodes, child.name);
						let adj = adjacent_nodes(root, child_node, children_names);
						child.mother = adj[0] ? adj[0].data.mother : (adj[1] ? adj[1].data.mother : null);
						child.father = adj[0] ? adj[0].data.father : (adj[1] ? adj[1].data.father : null);
					} else {
						dataset.splice(pedigree_util.getIdxByName(dataset, child.name), 1);
					}
				}
			}
		}
	} else {
		dataset.splice(pedigree_util.getIdxByName(dataset, node.name), 1);
	}

	// delete ancestors
	console.log(deletes);
	for(i=0; i<deletes.length; i++) {
		let del = deletes[i];
		let sibs = pedigree_util.getAllSiblings(dataset, del);
		console.log('DEL', del.name, sibs);
		if(sibs.length < 1) {
			console.log('del sibs', del.name, sibs);
			let data_node  = pedigree_util.getNodeByName(fnodes, del.name);
			let ancestors = data_node.ancestors();
			for(j=0; j<ancestors.length; j++) {
				console.log(ancestors[i]);
				if(ancestors[j].data.mother){
					console.log('DELETE ', ancestors[j].data.mother, ancestors[j].data.father);
					dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.mother.name), 1);
					dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.father.name), 1);
				}
			}
		}
	}
	// check integrity of mztwins settings
	checkTwins(dataset);

	let unconnected;
	try	{
		// validate new pedigree dataset
		let newopts = $.extend({}, opts);
		newopts.dataset = copy_dataset(dataset);
		validate_pedigree(newopts);
		// check if pedigree is split
		unconnected = pedigree_util.unconnected(dataset);
	} catch(err) {
		pedigree_util.messages('Warning', 'Deletion of this pedigree member is disallowed.')
		throw err;
	}
	if(unconnected.length > 0) {
		// check & warn only if this is a new split
		if(unconnected(opts.dataset).length === 0) {
			console.error("individuals unconnected to pedigree ", unconnected);
			pedigree_util.messages("Warning", "Deleting this will split the pedigree. Continue?", onDone, opts, dataset);
			return;
		}
	}

	if(onDone) {
		onDone(opts, dataset);
	}
	return dataset;
};
