// Pedigree Tree Utils
(function(pedigree_util, $, undefined) {
	
	pedigree_util.buildTree = function(opts, person, root, partnerLinks, id) {
		if (typeof person.children === typeof undefined)
			person.children = pedigree_util.getChildren(opts.dataset, person);

		if (typeof partnerLinks === typeof undefined) {
			partnerLinks = [];
			id = 1;
		}

		//console.log('NAME='+person.name+' NO. CHILDREN='+person.children.length);
		var partners = [];
		$.each(person.children, function(i, child) {
			$.each(opts.dataset, function(j, p) {
				if (((child.name === p.mother) || (child.name === p.father)) && child.id == undefined) {
					if (!(contains_parent(partners, child.name))) {
						var nodes = pedigree_util.flatten(root);
						var m = pedigree_util.getNodeByName(nodes, p.mother);
						var f = pedigree_util.getNodeByName(nodes, p.father);
						partners.push({
							'mother' : m !== undefined? m : pedigree_util.getNodeByName(opts.dataset, p.mother),
							'father' : f !== undefined? f : pedigree_util.getNodeByName(opts.dataset, p.father)
						});
					}
				}
			});
		});
		$.merge(partnerLinks, partners);

		$.each(partners, function(i, ptr) {
			var mother = ptr.mother;
			var father = ptr.father;
			mother.children = [];
			var parent = {
					name : ptree.makeid(3),
					hidden : true,
					parent : null,
					father : father,
					mother : mother,
					children : pedigree_util.getChildren(opts.dataset, mother, father)
			};

			var midx = pedigree_util.getIdxByName(opts.dataset, mother.name);
			var fidx = pedigree_util.getIdxByName(opts.dataset, father.name);
			if(!('id' in father) && !('id' in mother))
				id = setChildrenId(person.children, id);

			// look at grandparents index
			var gp = pedigree_util.get_grandparents_idx(opts.dataset, midx, fidx);
			if(gp.fidx < gp.midx) {
				father.id = id++;
				parent.id = id++;
				mother.id = id++;
			} else {
				mother.id = id++;
				parent.id = id++;
				father.id = id++;
			}
			addParent(mother, parent);
			addParent(father, parent);
			person.children.push(parent);
		});
		id = setChildrenId(person.children, id);

		$.each(person.children, function(i, p) {
			id = pedigree_util.buildTree(opts, p, root, partnerLinks, id)[1];
		});
		return [partnerLinks, id];
	};

	function addParent(p, parent) {
		if('parent_node' in p)
			p.parent_node.push(parent)
		else
			p['parent_node'] = [parent];
	}

	function setChildrenId(children, id) {
		$.each(children, function(i, p) {
			if(p.id === undefined) p.id = id++;
		});
		return id;
	}
	
	pedigree_util.isProband = function(obj) {
		return typeof $(obj).attr('proband') !== typeof undefined && $(obj).attr('proband') !== false;
	}
	
	pedigree_util.setProband = function(dataset, name, is_proband) {
		$.each(dataset, function(i, p) {
			if (name === p.name)
				p.proband = is_proband;
			else
				delete p.proband;
		});
	}

	pedigree_util.getProbandIndex = function(dataset) {
		var proband;
		$.each(dataset, function(i, val) {
			if (pedigree_util.isProband(val)) return proband = i;
		});
		return proband;
	}

	pedigree_util.getChildren = function(dataset, mother, father) {
		var children = [];
		if(mother.sex === 'F')
			$.each(dataset, function(i, p) {
				if(mother.name === p.mother)
					if(!father || father.name == p.father)
						children.push(p);
			});
		return children;
	}
	
	function contains_parent(arr, name) {
		for(var i=0; i< arr.length; i++){
			if(name === arr[i].mother.name || name === arr[i].father.name)
				return true;
		}
		return false;
	}

	// get the siblings of a given individual - sex is an optional parameter
	// for only returning brothers or sisters
	pedigree_util.getSiblings = function(dataset, person, sex) {
		return $.map(dataset, function(p, i){
			return  p.name !== person.name && !('noparents' in p) && 
			       (p.mother === person.mother && p.father === person.father) &&
			       (!sex || p.sex == sex) ? p : null
		});
	}
	
	// get the adopted siblings of a given individual
	pedigree_util.getAdoptedSiblings = function(dataset, person) {
		return $.map(dataset, function(p, i){
			return  p.name !== person.name && 'noparents' in p && 
			       (p.mother === person.mother && p.father === person.father) ? p : null
		});
	}
	
	pedigree_util.getAllChildren = function(dataset, person, sex) {
		return $.map(dataset, function(p, i){
			return !('noparents' in p) &&
			       (p.mother === person.name || p.father === person.name) &&
			       (!sex || p.sex === sex) ? p : null
		});
	}
	
	// get the depth of the given person from the root
	pedigree_util.getDepth = function(dataset, name) {
		var idx = pedigree_util.getIdxByName(dataset, name);
		var depth = 1;

		while(idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)){
			idx = pedigree_util.getIdxByName(dataset, dataset[idx].mother);
			depth++;
		}
		return depth;
	}

	// given an array of people get an index for a given person
	pedigree_util.getIdxByName = function(arr, name) {
		var idx = -1;
		$.each(arr, function(i, p) {
			if (name === p.name) return idx = i;
		});
		return idx;
	}

	// get the nodes at a given depth sorted by their x position
	pedigree_util.getNodesAtDepth = function(fnodes, depth, exclude_names) {
		return $.map(fnodes, function(p, i){
			return p.depth == depth && !p.data.hidden && $.inArray(p.data.name, exclude_names) == -1 ? p : null
		}).sort(function (a,b) {return a.x - b.x;});
	}

	// convert the partner names into corresponding tree nodes
	pedigree_util.linkNodes = function(flattenNodes, partners) {
		var links = [];
		for(var i=0; i< partners.length; i++)
			links.push({'mother': pedigree_util.getNodeByName(flattenNodes, partners[i].mother.name),
						'father': pedigree_util.getNodeByName(flattenNodes, partners[i].father.name)});
		return links;
	}

	// return a flattened representation of the tree
	pedigree_util.flatten = function(root) {
		var flat = [];
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
	pedigree_util.adjust_coords  = function(opts, root, flattenNodes) {
		function recurse(node) {
			if (node.children) {
				node.children.forEach(recurse);

				if(node.data.father !== undefined) { 	// hidden nodes
					var father = pedigree_util.getNodeByName(flattenNodes, node.data.father.name);
					var mother = pedigree_util.getNodeByName(flattenNodes, node.data.mother.name);
					var xmid = (father.x + mother.x) /2;
					if(!pedigree_util.overlap(opts, root.descendants(), xmid, node.depth, [node.data.name])) {
						node.x = xmid;   // centralise parent nodes
						var diff = node.x - xmid;
						if(node.children.length == 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
							if(!(node.children[0].data.hidden && node.children[1].data.hidden)) {
								var child1 = (node.children[0].data.hidden ? node.children[1] : node.children[0]);
								var child2 = (node.children[0].data.hidden ? node.children[0] : node.children[1]);
								if( ((child1.x < child2.x && xmid < child2.x) || (child1.x > child2.x && xmid > child2.x)) &&
								    !pedigree_util.overlap(opts, root.descendants(), xmid, child1.depth, [child1.data.name])){
									child1.x = xmid;
								}
							}
						} else if(node.children.length == 1 && !node.children[0].data.hidden) {
							node.children[0].x = xmid;
						} else {
							if(diff != 0 && !nodesOverlap(opts, node, diff, root)){
								if(node.children.length == 1) {
									node.children[0].x = xmid;
								} else {
									var descendants = node.descendants();
									if(opts.DEBUG)
										console.log('ADJUSTING '+node.data.name+' NO. DESCENDANTS '+descendants.length+' diff='+diff);
									for(var i=0; i<descendants.length; i++) {
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
		var descendants = node.descendants();
		var descendantsNames = $.map(descendants, function(descendant, i){return descendant.data.name});
		var nodes = root.descendants();
		for(var i=0; i<descendants.length; i++){
			var descendant = descendants[i];
			if(node.data.name !== descendant.data.name){
				var xnew = descendant.x - diff;
				if(pedigree_util.overlap(opts, nodes, xnew, descendant.depth, descendantsNames))
					return true
			}
		}
		return false;
	}

	// test if x position overlaps a node at the same depth
	pedigree_util.overlap = function(opts, nodes, xnew, depth, exclude_names) {
		for(var n=0; n<nodes.length; n++) {
			if(depth == nodes[n].depth && $.inArray(nodes[n].data.name, exclude_names) == -1){
				if(Math.abs(xnew - nodes[n].x) < (opts.symbol_size*1.15))
					return true;
			}
		}
		return false;
	}

	// given a persons name return the corresponding d3 tree node
	pedigree_util.getNodeByName = function(nodes, name) {
		for (var i = 0; i < nodes.length; i++) {
			if(nodes[i].data && name === nodes[i].data.name)
				return nodes[i];
			else if (name === nodes[i].name)
				return nodes[i];
		}
	}

	// given the name of a url param get the value
	pedigree_util.urlParam = function(name){
	    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	    if (results==null)
	       return null;
	    else
	       return results[1] || 0;
	}
	
	// get grandparents index
	pedigree_util.get_grandparents_idx = function(dataset, midx, fidx) {
		var gmidx = midx;
		var gfidx = fidx;
		while(  'mother' in dataset[gmidx] && 'mother' in dataset[gfidx] &&
			  !('noparents' in dataset[gmidx]) && !('noparents' in dataset[gfidx])){
			gmidx = pedigree_util.getIdxByName(dataset, dataset[gmidx].mother);
			gfidx = pedigree_util.getIdxByName(dataset, dataset[gfidx].mother);
		}
		return {'midx': gmidx, 'fidx': gfidx};
	}

	// print options and dataset
	pedigree_util.print_opts = function(opts){
    	$("#pedigree_data").remove();
    	$("body").append("<div id='pedigree_data'></div>" );
    	for(var i=0; i<opts.dataset.length; i++) {
    		var person = "<div class='row'><strong class='col-md-1 text-right'>"+opts.dataset[i]['name']+"</strong><div class='col-md-11'>";
    		for(var key in opts.dataset[i]) {
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
    	for(var key in opts) {
    		if(key === 'dataset') continue;
    		$("#pedigree_data").append("<span>"+key + ":" + opts[key]+"; </span>");
    	}
	}
}(window.pedigree_util = window.pedigree_util || {}, jQuery));


// Pedigree Tree Builder
(function(ptree, $, undefined) {
	ptree.roots = {};
	ptree.build = function(options) {
        var opts = $.extend({ // defaults
        	targetDiv: 'pedigree_edit',
        	dataset: [ {"name": "m21", "sex": "M", "top_level": true},
        		       {"name": "f21", "sex": "F", "top_level": true},
        			   {"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "bc1":  true, "proband": true}],
        	width: 600, 
        	height: 400,
        	symbol_size: 35,
        	zoomIn: 1.,
        	zoomOut: 1.,
        	diseases: [	{'type': 'breast_cancer', 'colour': '#F68F35'},
        				{'type': 'breast_cancer2', 'colour': 'pink'},
						{'type': 'ovarian_cancer', 'colour': '#4DAA4D'},
						{'type': 'pancreatic_cancer', 'colour': '#4289BA'},
						{'type': 'prostate_cancer', 'colour': '#D5494A'}],
        	DEBUG: false}, options );
		
        if(pedcache.nstore(opts) == -1)
        	pedcache.add(opts);
        if(opts.DEBUG)
        	pedigree_util.print_opts(opts);
        pbuttons.updateButtons(opts);

        // group top level nodes by partners
        opts.dataset = group_top_level(opts.dataset);

        var svg_dimensions = get_svg_dimensions(opts);
        var svg = d3.select("#"+opts.targetDiv)
					 .append("svg:svg")
					 .attr("width", svg_dimensions.width)
					 .attr("height", svg_dimensions.height);

		svg.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("rx", 6)
			.attr("ry", 6)
			.attr("fill", "#EEE");

		var xytransform = pedcache.getposition(opts);  // cached position
		var xtransform = xytransform[0];
		var ytransform = xytransform[1];
		if(xtransform == null) {
			xtransform = opts.symbol_size/2;
			ytransform = (-opts.symbol_size*1.5);
		}
		var ped = svg.append("g")
				 .attr("class", "diagram")
	             .attr("transform", "translate("+xtransform+"," + ytransform + ")");

		var top_level = $.map(opts.dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
		var hidden_root = {
			name : 'hidden_root',
			id : 0,
			hidden : true,
			children : top_level
		};

		var partners = pedigree_util.buildTree(opts, hidden_root, hidden_root)[0];
		var root = d3.hierarchy(hidden_root);
		ptree.roots[opts.targetDiv] = root;
		
		/// get score at each depth used to adjust node separation
		var tree_dimensions = ptree.get_tree_dimensions(opts, svg_dimensions);
		if(opts.DEBUG)
			console.log('opts.width='+svg_dimensions.width+' width='+tree_dimensions.width+
					    ' opts.height='+svg_dimensions.height+' height='+tree_dimensions.height);

		var treemap = d3.tree().separation(function(a, b) {
				if(a.data.hidden || b.data.hidden)
					return 1.2;
				if(a.parent === b.parent && ('noparents' in a.data || 'noparents' in b.data || 'top_level' in a.data))
					return 1.2;			
				return a.parent === b.parent ? 1 : 1.2;
		}).size([tree_dimensions.width, tree_dimensions.height]);

		var nodes = treemap(root.sort(function(a, b) { return a.data.id - b.data.id; }));
		var flattenNodes = nodes.descendants();
		pedigree_util.adjust_coords(opts, nodes, flattenNodes);

		var ptrLinkNodes = pedigree_util.linkNodes(flattenNodes, partners);

		check_ptr_links(opts, ptrLinkNodes);   // check for crossing of partner lines
		var unconnected = ptree.unconnected(opts.dataset);
		if(unconnected.length > 0)
			console.error("individuals unconnected to pedigree ", unconnected);

		var node = ped.selectAll(".node")
					  .data(nodes.descendants())
					  .enter()
					   	.append("g")
					   	.attr("transform", function(d, i) {
							return "translate(" + d.x + "," + d.y + ")";
						});

		// provide a border to the node
		node.append("path")
			.filter(function (d) {return !d.data.hidden})
			.attr("transform", function(d) {return d.data.sex == "U"? "rotate(45)" : ""})
			.attr("d", d3.symbol().size(function(d) { return (opts.symbol_size * opts.symbol_size) + 2;})
			.type(function(d) {return d.data.sex == "F" ? d3.symbolCircle :d3.symbolSquare}))
			.style("stroke", "grey")
			.style("fill", "none");

		// set a clippath
		node.append("clipPath")
			.attr("id", function (d) {return d.data.name}).append("path")
			.filter(function (d) {return !(d.data.hidden && !opts.DEBUG)})
			.attr("class", "node")
			.attr("transform", function(d) {return d.data.sex == "U"? "rotate(45)" : ""})
			.attr("d", d3.symbol().size(function(d) {
				if (d.data.hidden)
					return opts.symbol_size * opts.symbol_size / 5;
				return opts.symbol_size * opts.symbol_size;
			})
			.type(function(d) {return d.data.sex == "F" ? d3.symbolCircle :d3.symbolSquare}));

		// pie plots for disease colours
		var pienode = node.selectAll("pienode")
		   .data(function(d) {     		// set the disease data for the pie plot
			   var ncancers = 0;
			   var cancers = $.map(opts.diseases, function(val, i){
				   if((opts.diseases[i].type + '_diagnosis_age') in d.data) {ncancers++; return 1;} else return 0;
			   });
			   if(ncancers == 0) cancers = [1];
			   return [$.map(cancers, function(val, i){ 
				   return {'cancer': val, 'ncancers': ncancers, 'id': d.data.name,
					   	   'sex': d.data.sex, 'proband': d.data.proband, 'hidden': d.data.hidden};})];
		   })
		   .enter()
		    .append("g");

		pienode.selectAll("path")
		    .data(d3.pie().value(function(d) {return  d.cancer}))
		    .enter().append("path")
		    	.attr("clip-path", function(d) {return "url(#"+d.data.id+")"}) // clip the rectangle
			    .attr("class", "pienode")
			    .attr("d", d3.arc().innerRadius(0).outerRadius(opts.symbol_size))
			    .style("fill", function(d, i) {
			    	if(d.data.ncancers == 0)
				    	return "lightgrey";
			    	return opts.diseases[i].colour; 
			    });

		// alive status = 0; dead status = 1
		var status = node.append('line')
		.filter(function (d) {return d.data.status == 1})
		    .style("stroke", "black")
		    .attr("x1", function(d, i) {return -0.6*opts.symbol_size})
		    .attr("y1", function(d, i) {return 0.6*opts.symbol_size})
		    .attr("x2", function(d, i) {return 0.6*opts.symbol_size})
		    .attr("y2", function(d, i) {return -0.6*opts.symbol_size});
		
		// names of individuals
		addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size),
				function(d) {
					if(opts.DEBUG)
						return ('display_name' in d.data ? d.data.display_name : d.data.name) + '  ' + d.data.id;
					return 'display_name' in d.data ? d.data.display_name : '';});

		var font_size = parseInt($("body").css('font-size'));
		addLabel(opts, node, ".25em", -(0.3 * opts.symbol_size), -(0.2 * opts.symbol_size)+font_size,
				function(d) {return 'age' in d.data ? d.data.age : '';});		

		// individuals disease details
		for(var i=0;i<opts.diseases.length; i++) {
			var disease = opts.diseases[i].type;
			addLabel(opts, node, ".25em", -(opts.symbol_size),
					function(d) {
						var y_offset = font_size*2;
						for(var j=0;j<opts.diseases.length; j++) {
							if(disease === opts.diseases[j].type)
								break;
							if(opts.diseases[j].type + '_diagnosis_age' in d.data)
								y_offset += font_size;
						}
						return y_offset;
					},
					function(d) {
						var dis = disease.replace('_', ' ').replace('cancer', 'ca.');
						return disease+'_diagnosis_age' in d.data ? dis +": "+ d.data[disease+'_diagnosis_age'] : '';
					}, 'indi_details');
		}

		//
		widgets.addWidgets(opts, node);

		// links between partners
		var clash_depth = {};
		var partners = ped.selectAll(".partner")
		  	.data(ptrLinkNodes)
		  	.enter()
		  		.insert("path", "g")
		  		.attr("fill", "none")
		  		.attr("stroke", "#000")
		  		.attr("shape-rendering", "crispEdges")
		  		.attr('d', function(d, i) {
		  			var x1 = (d.mother.x < d.father.x ? d.mother.x : d.father.x);
	  				var x2 = (d.mother.x < d.father.x ? d.father.x : d.mother.x);
	  				var dy1 = d.mother.y;

	  				// identify clashes with other nodes at the same depth
		  			var clash = ptree.check_ptr_link_clashes(opts, d);
		  			var path = "";
		  			if(clash) {
		  				if(d.mother.depth in clash_depth)
		  					clash_depth[d.mother.depth] += 3;
		  				else
		  					clash_depth[d.mother.depth] = 3;

		  				dy1 -= clash_depth[d.mother.depth];
		  				var dx = 3 + clash_depth[d.mother.depth] + opts.symbol_size/2;
		  				
		  				var parent_node = pedigree_util.getNodeByName(flattenNodes, d.mother.data.parent_node[0].name);
						parent_node.y = dy1; // adjust hgt of parent node
		  				clash.sort(function (a,b) {return a - b;});

		  				extend = function(i, l) {
		  					if(i+1 < l)   //  && Math.abs(clash[i] - clash[i+1]) < (opts.symbol_size*1.25)
		  						return extend(++i);
		  					return i;
		  				}

		  				var dy2 = (dy1-opts.symbol_size/2-3);
		  				// loop over node(s)
		  				for(var i=0; i<clash.length; i++) {
		  					var j = extend(i, clash.length);
		  					var dx1 = clash[i] - dx;
		  					var dx2 = clash[j] + dx;
		  					if(parent_node.x > dx1 && parent_node.x < dx2)
		  						parent_node.y = dy2;

	  						path += "L" + dx1 + "," +  dy1 +
		  					        "L" + dx1 + "," +  dy2 +
		  					        "L" + dx2 + "," +  dy2 +
		  					        "L" + dx2 + "," +  dy1;
	  						i = j;
		  				}
		  			}
		  			return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1;
		  		});

		// links to children
		var links = ped.selectAll(".link")
			.data(root.links(nodes.descendants()))
			.enter()
				.insert("path", "g")
				.attr("fill", "none")
				.attr("stroke-width", function(d, i) {
					if(d.target.data.noparents !== undefined || d.source.parent == null || d.target.data.hidden)
						return 1;
					return (opts.DEBUG ? 2 : 1);
				})
				.attr("stroke", function(d, i) {
					if(d.target.data.noparents !== undefined || d.source.parent == null || d.target.data.hidden)
						return 'pink';
					return "#000";
				})
				.attr("shape-rendering", "crispEdges")
				.attr("d", function(d, i) {
					if(!opts.DEBUG &&
					   (d.target.data.noparents !== undefined ||  d.source.parent == null || d.target.data.hidden))
						return;
					return "M" + (d.source.x) + "," + (d.source.y ) +
					       "V" + ((d.source.y + d.target.y) / 2) +
					       "H" + (d.target.x) +
					       "V" + (d.target.y);
				});

		// draw proband arrow
		var probandIdx  = pedigree_util.getProbandIndex(opts.dataset);
		if(probandIdx) {
			var probandNode = pedigree_util.getNodeByName(flattenNodes, opts.dataset[probandIdx].name);
	
			ped.append("svg:defs").append("svg:marker")    // arrow head
			    .attr("id", "triangle")
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
		        .attr("marker-end", "url(#triangle)");
		}
		// drag and zoom
		var zoom = d3.zoom()
		  .scaleExtent([opts.zoomIn, opts.zoomOut])
		  .on('zoom', zoomFn);

		function zoomFn() {
			var t = d3.event.transform;
			var pos = [(t.x + parseInt(xtransform)), (t.y + parseInt(ytransform))]
			pedcache.setposition(opts, pos[0], pos[1]);
			ped.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ') scale(' + t.k + ')');
		}
		svg.call(zoom);
		return opts;
	}

	// return a list of individuals that aren't connected to the target
	ptree.unconnected = function(dataset){
		var target = dataset[ pedigree_util.getProbandIndex(dataset) ];
		if(!target){
			console.error("No target defined");
			return [];
		}
        var connected = [target.name];
        var change = true;
        var ii = 0;
        while(change && ii < 200) {
        	ii++;
        	var nconnect = connected.length;
            $.each(dataset, function( idx, p ) {
            	if($.inArray( p.name, connected ) != -1) {
            		// check if this person or a partner has a parent
            		var ptrs = get_partners(dataset, p);
            		var has_parent = (p.name === target.name || !p.noparents);
            		for(var i=0; i<ptrs.length; i++){
            			if(!pedigree_util.getNodeByName(dataset, ptrs[i]).noparents)
            				has_parent = true;
            		}

            		if(has_parent){
	            		if(p.mother && $.inArray( p.mother, connected ) == -1)
	            			connected.push(p.mother);
	            		if(p.father && $.inArray( p.father, connected ) == -1)
	            			connected.push(p.father);
            		}
            	} else if( !p.noparents &&
            			  ((p.mother && $.inArray( p.mother, connected ) != -1) ||
            			   (p.father && $.inArray( p.father, connected ) != -1))){
            		connected.push(p.name);
            	}
        		// include any children
            	include_children(connected, p, dataset);
            });
            change = (nconnect != connected.length);
        }
        var names = $.map(dataset, function(val, i){return val.name});
        return $.map(names, function(name, i){return $.inArray(name, connected) == -1 ? name : null});
	}

	function include_children(connected, p, dataset) {
		if($.inArray( p.name, connected ) == -1)
			return;
		combineArrays(connected, get_partners(dataset, p));
		var children = pedigree_util.getAllChildren(dataset, p);
    	$.each(children, function( child_idx, child ) {
    		if($.inArray( child.name, connected ) == -1) {
    			connected.push(child.name);
    			combineArrays(connected, get_partners(dataset, child));
    		}
    	});
	}

	// combine arrays ignoring duplicates
	function combineArrays(arr1, arr2) {
	    for(var i=0; i<arr2.length; i++)
	    	if($.inArray( arr2[i], arr1 ) == -1) arr1.push(arr2[i]);
	}
	
	// check for crossing of partner lines
	function check_ptr_links(opts, ptrLinkNodes){
		for(var a=0; a<ptrLinkNodes.length; a++) {
			var clash = ptree.check_ptr_link_clashes(opts, ptrLinkNodes[a]);
			if(clash)
				console.log("CLASH :: "+ptrLinkNodes[a].mother.data.name+" "+ptrLinkNodes[a].father.data.name, clash);
		}
	}
	
	ptree.check_ptr_link_clashes = function(opts, anode) {
		var root = ptree.roots[opts.targetDiv];
		var flattenNodes = pedigree_util.flatten(root);
		var mother, father;
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

		var x1 = (mother.x < father.x ? mother.x : father.x);
		var x2 = (mother.x < father.x ? father.x : mother.x);
		var dy = mother.y;

		// identify clashes with other nodes at the same depth
  		var clash = $.map(flattenNodes, function(bnode, i){
  			return !bnode.data.hidden &&
  				    bnode.data.name !== mother.data.name &&  bnode.data.name !== father.data.name && 
  				    bnode.y == dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null
  		});
  		return clash.length > 0 ? clash : null;
	}
	
	function get_svg_dimensions(opts) {
        return {'width' : (pbuttons.is_fullscreen()? window.innerWidth  : opts.width),
        	    'height': (pbuttons.is_fullscreen()? window.innerHeight : opts.height)};
	}
	
	ptree.get_tree_dimensions = function(opts, svg_dimensions) {
		/// get score at each depth used to adjust node separation
		var maxscore = 0;
		var generation = {};
		for(var i=0; i<opts.dataset.length; i++) {
			var depth = pedigree_util.getDepth(opts.dataset, opts.dataset[i].name);
			var children = pedigree_util.getAllChildren(opts.dataset, opts.dataset[i]);

			// score based on no. of children and if parent defined
			var score = 1 + (children.length > 0 ? 0.55+(children.length*0.25) : 0) + (opts.dataset[i].father ? 0.25 : 0);
			if(depth in generation)
				generation[depth] += score;
			else
				generation[depth] = score;

			if(generation[depth] > maxscore)
				maxscore = generation[depth];
		}

		var max_depth = Object.keys(generation).length*opts.symbol_size*3;
		var tree_width =  (svg_dimensions.width - opts.symbol_size > maxscore*opts.symbol_size*1.5 ?
				           svg_dimensions.width - opts.symbol_size : maxscore*opts.symbol_size*1.5);
		var tree_height = (svg_dimensions.height - opts.symbol_size > max_depth ?
		      		       svg_dimensions.height - opts.symbol_size : max_depth);
		return {'width': tree_width, 'height': tree_height};
	}
	
	// get the partners for a given node
	function get_partners(dataset, anode) {
		var ptrs = [];
		for(var i=0; i<dataset.length; i++) {
			var bnode = dataset[i];
			if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) == -1)
				ptrs.push(bnode.father);
			else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) == -1)
				ptrs.push(bnode.mother);
		}		
		return ptrs;
	}
	
	// group top_level nodes by their partners
	function group_top_level(dataset) {
		//var top_level = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
		// calculate top_level nodes
		for(var i=0;i<dataset.length;i++) {
			if(pedigree_util.getDepth(dataset, dataset[i].name) == 2)
				dataset[i].top_level = true;
		}

		var top_level = [];
        var top_level_seen = [];
        for(var i=0;i<dataset.length;i++) {
        	var node = dataset[i];
        	if('top_level' in node && $.inArray(node.name, top_level_seen) == -1){
        		top_level_seen.push(node.name);
        		top_level.push(node);
        		var ptrs = get_partners(dataset, node);
        		for(var j=0; j<ptrs.length; j++){
        			top_level_seen.push(ptrs[j]);
        			top_level.push(pedigree_util.getNodeByName(dataset, ptrs[j]));
        		}
        	}
        }

        var newdataset = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? null : val});
        for (var i = top_level.length; i > 0; --i)
        	newdataset.unshift(top_level[i-1]);
        return newdataset;
	}

	// Add label
	function addLabel(opts, node, size, fx, fy, ftext, class_label) {
		node.filter(function (d) {
    		return d.data.hidden && !opts.DEBUG ? false : true;
		}).append("text")
		.attr("class", class_label + ' label' || "label")
		.attr("x", fx)
		.attr("y", fy)
		.attr("dy", size)
		.text(ftext);	
    }

	ptree.rebuild = function(opts) {
		$("#"+opts.targetDiv).empty();
		pedcache.add(opts);
		ptree.build(opts);
	}

	ptree.copy_dataset = function(dataset) {
	    // sort by id
		dataset.sort(function(a,b) {return (!a.id || !b.id ? 0: (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0)); } );

		var disallowed = ["id", "parent_node"];
		var newdataset = [];
		for(var i=0; i<dataset.length; i++){
			var obj = {};
			for(var key in dataset[i]) {
				if(disallowed.indexOf(key) == -1)
					obj[key] = dataset[i][key];
			}
			newdataset.push(obj);
		}
		return newdataset;
	}
	
	// add children to a given node
	ptree.addchild = function(dataset, node, sex, nchild) {
		if (typeof nchild === typeof undefined)
			nchild = 1;
		var children = pedigree_util.getAllChildren(dataset, node);
		var ptr_name, idx;
		if (children.length == 0) {
			var partner = ptree.addsibling(dataset, node, node.sex === 'F' ? 'M': 'F');
			partner.noparents = true;
			ptr_name = partner.name
			idx = pedigree_util.getIdxByName(dataset, node.name)+1;
		} else {
			var c = children[0];
			ptr_name = (c.father === node.name ? c.mother : c.father)
			idx = pedigree_util.getIdxByName(dataset, c.name);
		}

		for (var i = 0; i < nchild; i++) {
			var child = {"name": ptree.makeid(3), "sex": sex,
					     "mother": (node.sex === 'F' ? node.name : ptr_name),
				         "father": (node.sex === 'F' ? ptr_name : node.name)};
			dataset.splice(idx, 0, child);
		}
	}

	//
	ptree.addsibling = function(dataset, node, sex, add_lhs) {
		var newbie = {"name": ptree.makeid(3), "sex": sex};
		if(node.top_level) {
			newbie.top_level = true;
		} else {
			newbie.mother = node.mother;
			newbie.father = node.father;
		}
		var idx = pedigree_util.getIdxByName(dataset, node.name);
		if(add_lhs) { // add to LHS
			if(idx > 0) idx--;
		} else
			idx++;
		dataset.splice(idx, 0, newbie);
		return newbie;
	}
	
	// add parents to the 'node'
	ptree.addparents = function(opts, dataset, name) {
		var mother, father;
		var root = ptree.roots[opts.targetDiv];
		var flat_tree = pedigree_util.flatten(root);
		var tree_node = pedigree_util.getNodeByName(flat_tree, name);
		var node  = tree_node.data;
		var depth = tree_node.depth;   // depth of the node in relation to the root (depth = 1 is a top_level node)

		var pid = -101;
		var ptr_name;
		var children = pedigree_util.getAllChildren(dataset, node);
		if(children.length > 0){
			ptr_name = children[0].mother == node.name ? children[0].father : children[0].mother;
			pid = pedigree_util.getNodeByName(flat_tree, ptr_name).data.id;
		}

		if(depth == 1) {
			mother = {"name": ptree.makeid(3), "sex": "F", "top_level": true};
			father = {"name": ptree.makeid(3), "sex": "M", "top_level": true};
			dataset.splice(0, 0, father);
			dataset.splice(0, 0, mother);

			for(var i=0; i<dataset.length; i++){
				if(dataset[i].top_level && dataset[i].name !== mother.name && dataset[i].name !== father.name){
					delete dataset[i].top_level;
					dataset[i].noparents = true;
					dataset[i].mother = mother.name;
					dataset[i].father = father.name;
				}
			}
		} else {
			var node_mother = pedigree_util.getNodeByName(flat_tree, tree_node.data.mother);
			var node_father = pedigree_util.getNodeByName(flat_tree, tree_node.data.father);
			var node_sibs = pedigree_util.getSiblings(dataset, node);

			// lhs & rhs id's for siblings of this node
			var rid = 10000;
			var lid = tree_node.data.id;
			for(var i=0; i<node_sibs.length; i++){
				var sid = pedigree_util.getNodeByName(flat_tree, node_sibs[i].name).data.id;
				if(sid < rid && sid > tree_node.data.id)
					rid = sid;
				if(sid < lid)
					lid = sid;
			}
			var add_lhs = (lid >= tree_node.data.id || (pid == lid && rid < 10000));
			if(opts.DEBUG)
				console.log('lid='+lid+' rid='+rid+' nid='+tree_node.data.id+' ADD_LHS='+add_lhs);
			var midx;
			if( (!add_lhs && node_father.data.id > node_mother.data.id) ||
				(add_lhs && node_father.data.id < node_mother.data.id) )
				midx = pedigree_util.getIdxByName(dataset, node.father);
			else
				midx = pedigree_util.getIdxByName(dataset, node.mother);

			var parent = dataset[midx];
			mother = ptree.addsibling(dataset, parent, 'F', add_lhs);
			father = ptree.addsibling(dataset, parent, 'M', add_lhs);

			var orphans = pedigree_util.getAdoptedSiblings(dataset, node);
			var nid = tree_node.data.id;
			for(var i=0; i<orphans.length; i++){
				var oid = pedigree_util.getNodeByName(flat_tree, orphans[i].name).data.id;
				if(opts.DEBUG)
					console.log('ORPHAN='+i+' '+orphans[i].name+' '+(nid < oid && oid < rid)+' nid='+nid+' oid='+oid+' rid='+rid);
				if((add_lhs || nid < oid) && oid < rid){
					var oidx = pedigree_util.getIdxByName(dataset, orphans[i].name);
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
		var idx = pedigree_util.getIdxByName(dataset, node.name);
		dataset[idx].mother = mother.name;
		dataset[idx].father = father.name;
		delete dataset[idx].noparents;

		if('parent_node' in node) {
			var ptr_node = dataset[pedigree_util.getIdxByName(dataset, ptr_name)];
			if('noparents' in ptr_node) {
				ptr_node.mother = mother.name;
				ptr_node.father = father.name;
			}
		}
	}
	
	// add partner
	ptree.addpartner = function(opts, dataset, name) {
		var root = ptree.roots[opts.targetDiv];
		var flat_tree = pedigree_util.flatten(root);
		var tree_node = pedigree_util.getNodeByName(flat_tree, name);

		var partner = ptree.addsibling(dataset, tree_node.data, tree_node.data.sex=== 'F' ? 'M' : 'F');
		partner.noparents = true;

		var child = {"name": ptree.makeid(3), "sex": "M"};
		child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
		child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);

		var idx = pedigree_util.getIdxByName(dataset, tree_node.data.name)+2;
		dataset.splice(idx, 0, child);
	}
	
	// get adjacent nodes at the same depth
	function adjacent_nodes(root, node, excludes) {
		var dnodes = pedigree_util.getNodesAtDepth(pedigree_util.flatten(root), node.depth, excludes);
		var lhs_node, rhs_node;
		for(var i=0; i<dnodes.length; i++) {
			if(dnodes[i].x < node.x)
				lhs_node = dnodes[i];
			if(!rhs_node && dnodes[i].x > node.x)
				rhs_node = dnodes[i];
		}
		return [lhs_node, rhs_node];
	}
	
	// delete a node and descendants
	ptree.delete_node_dataset = function(dataset, node, opts) {
		var root = ptree.roots[opts.targetDiv];
		var fnodes = pedigree_util.flatten(root);
		var deletes = [];

		if(node.parent_node) {
			for(var i=0; i<node.parent_node.length; i++){
				var parent = node.parent_node[i];
				var ps = [pedigree_util.getNodeByName(dataset, parent.mother.name),
					      pedigree_util.getNodeByName(dataset, parent.father.name)];
				// delete parents
				for(var j=0; j<ps.length; j++) {
					if(ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
						dataset.splice(pedigree_util.getIdxByName(dataset, ps[j].name), 1);
						deletes.push(ps[j]);
					}
				}

				var children = parent.children;
				var children_names = $.map(children, function(p, i){return p.name}); 
				for(var j=0; j<children.length; j++) {
					var child = pedigree_util.getNodeByName(dataset, children[j].name);
					if(child){
						child.noparents = true;
						ptrs = get_partners(dataset, child);
						var ptr = undefined;
						if(ptrs.length > 0)
							ptr = pedigree_util.getNodeByName(dataset, ptrs[0]);
						if(ptr && ptr.mother !== child.mother) {
							child.mother = ptr.mother;
							child.father = ptr.father;
						} else if(ptr) {
							var child_node  = pedigree_util.getNodeByName(fnodes, child.name);
							var adj = adjacent_nodes(root, child_node, children_names);
							child.mother = adj[0] ? adj[0].data.mother : (adj[1] ? adj[1].data.mother : null);
							child.father = adj[0] ? adj[0].data.father : (adj[1] ? adj[1].data.father : null);
						} else {
							dataset.splice(pedigree_util.getIdxByName(dataset, child.name), 1);
						}
					}
				}
			}
		} else
			dataset.splice(pedigree_util.getIdxByName(dataset, node.name), 1);

		// delete ancestors
		console.log(deletes);
		for(var i=0; i<deletes.length; i++) {
			var del = deletes[i];
			var sibs = pedigree_util.getSiblings(dataset, del);
			console.log('DEL', del.name, sibs);
			if(sibs.length < 1) {
				console.log('del sibs', del.name, sibs);
				var data_node  = pedigree_util.getNodeByName(fnodes, del.name);
				var ancestors = data_node.ancestors();
				for(var j=0; j<ancestors.length; j++) {
					console.log(ancestors[i]);
					if(ancestors[j].data.mother){
						console.log('DELETE ', ancestors[j].data.mother, ancestors[j].data.father);
						dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.mother.name), 1);
						dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.father.name), 1);
					}
				}
			}	
		}
		return dataset;
	}

	ptree.makeid = function(len) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	    for( var i=0; i < len; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    return text;
	}

}(window.ptree = window.ptree || {}, jQuery));
