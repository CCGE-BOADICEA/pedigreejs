
// Pedigree Tree Utils
(function(pedigree_util, $, undefined) {
	
	pedigree_util.buildTree = function(opts, person, root, partnerLinks, id) {
		if (typeof person.children === typeof undefined) {
			person.children = pedigree_util.getChildren(opts.dataset, person);
		}
		if (typeof partnerLinks === typeof undefined) {
			partnerLinks = [];
			id = 1;
		}

		var partners = [];
		var partnerNames = [];
		jQuery.each(person.children, function(i, child) {
			jQuery.each(opts.dataset, function(i, p) {
				if (child.name === p.mother) {
					if ($.inArray(p.father, partnerNames) == -1) {
						partnerNames.push(p.father);
						var f = getNodeByName(root, p.father);
						partners.push({
							'mother' : child,
							'father' : f !== undefined? f : getPersonByName(opts.dataset, p.father)
						});
					}
				}
			});
		});
		$.merge(partnerLinks, partners);

		jQuery.each(partners, function(i, ptr) {
			var mother = ptr.mother;
			var father = ptr.father;
			mother.children = [];
			var parent = {
					name : ptree.makeid(3),
					hidden : true,
					parent : null,
					father : ptr.father,
					mother : ptr.mother,
					children : pedigree_util.getChildren(opts.dataset, mother)
			};

			if('id' in father) {
				father.id = id++;
				parent.id = id++;
				mother.id = id++;
			} else {
				id = idChildren(person.children, id);
				mother.id = id++;
				parent.id = id++;
				father.id = id++;
			}
			mother['parent_node'] = parent;
			father['parent_node'] = parent;

			person.children.push(parent);
		});
		id = idChildren(person.children, id);

		jQuery.each(person.children, function(i, p) {
			id = pedigree_util.buildTree(opts, p, root, partnerLinks, id)[1];
		});
		return [partnerLinks, id];
	};

	function idChildren(children, id) {
		jQuery.each(children, function(i, p) {
			if(p.id === undefined) {
				p.id = id++;
			}
		});
		return id;
	}

	pedigree_util.isProband = function(obj) {
		var proband = $(obj).attr('proband');
		return typeof proband !== typeof undefined && proband !== false;
	}

/*	pedigree_util.getProbandIndex = function(dataset) {
		var proband;
		jQuery.each(dataset, function(i, val) {
			if (pedigree_util.isProband(val)) {
				return proband = i;
			}
		});
		return proband;
	}*/

	pedigree_util.getChildren = function(dataset, person) {
		var children = [];
		jQuery.each(dataset, function(i, p) {
			if (person.name === p.mother) {
				children.push(p);
			}
		});
		return children;
	}

	pedigree_util.getIdxByName = function(arr, name) {
		var idx = -1;
		jQuery.each(arr, function(i, p) {
			if (name === p.name) {
				return idx = i;
			}
		});
		return idx;
	}

	getPersonByName = function(dataset, name) {
		var person = undefined;
		jQuery.each(dataset, function(i, p) {
			if (name === p.name) {
				return person = p;
			}
		});
		return person;
	}

	// convert the partner names into corresponding tree nodes
	pedigree_util.linkNodes = function(flattenNodes, partners) {
		var links = [];
		for(var i=0; i< partners.length; i++){
			links.push({'mother': pedigree_util.getNodeByName(flattenNodes, partners[i].mother.name),
						'father': pedigree_util.getNodeByName(flattenNodes, partners[i].father.name)});
		}
		return links;
	}
	
	// get a node by its name
	getNodeByName = function(root, name) {
		nodes = flatten(root);
		for(var i=0; i<nodes.length; i++) {
			if(nodes[i].name == name)
				return nodes[i];
		}
		return undefined;
	}

	// return a flattened representation of the tree
	flatten = function(root) {
		var flat = [];
		function recurse(node) {
			if (node.children) {
				node.children.forEach(recurse);
			}
			flat.push(node);
		}
		recurse(root);
		return flat;
	}
	
	// Adjust D3 layout positioning.
	// Position hidden parent node centring them between father and mother nodes. Remove kinks
	// from links - e.g. where there is a single child plus a hidden child
	pedigree_util.adjust_coords  = function(root, flattenNodes) {
		function recurse(node) {
			if (node.children) {
				if(node.data.father !== undefined) {
					var father = pedigree_util.getNodeByName(flattenNodes, node.data.father.name);
					var mother = pedigree_util.getNodeByName(flattenNodes, node.data.mother.name);
					var xmid = (father.x + mother.x) /2;
					if(node.children.length == 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
							for(var i=0; i<node.children.length; i++) {
								if(node.children[i].data.hidden == undefined) {
							  		node.children[i].x = xmid;
							  		node.x = xmid;
								}
							}
					} else {
						var diff = node.x - xmid;
						node.x = xmid;
						if(node.children.length == 1) {
							node.children[0].x = xmid;
						} else {
							for(var i=0; i<node.children.length; i++) {
								node.children[i].x -= diff;
							}
						}
					}
				}
				node.children.forEach(recurse);
			}
		}
		recurse(root);
	}

	pedigree_util.getNodeByName = function(nodes, name) {
		for (var i = 0; i < nodes.length; i++) {
			if (name === nodes[i].data.name) {
				return nodes[i];
			}
		}
	}
	
	pedigree_util.urlParam = function(name){
	    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	    if (results==null){
	       return null;
	    }
	    else{
	       return results[1] || 0;
	    }
	}
	
	// print options and dataset
	pedigree_util.print_opts = function(opts){
    	$("#pedigree_data").remove();
    	$("body").append("<div id='pedigree_data'></div>" );
    	for(var i=0; i<opts.dataset.length; i++) {
    		$("#pedigree_data").append("<br /><strong>"+opts.dataset[i]['name']+"</strong><br />");
    		for(var key in opts.dataset[i]) {
    			if(key === 'name') continue;
    			if(key === 'parent') {
    				$("#pedigree_data").append("<span>"+key + ":" + opts.dataset[i][key].name+"; </span>");
    			} else if (key === 'children') {
    				if (opts.dataset[i][key][0] !== undefined) {
    					$("#pedigree_data").append("<span>"+key + ":" + opts.dataset[i][key][0].name+"; </span>");
    				}
    			} else {
    				$("#pedigree_data").append("<span>"+key + ":" + opts.dataset[i][key]+"; </span>");
    			}
    		}
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

	ptree.build = function(options) {
        var opts = $.extend({
            // defaults
        	targetDiv: '#pedigree_edit',
        	dataset: [
        	  		{"name": "m21", "sex": "M", "top_level": true},
        			{"name": "f21", "sex": "F", "top_level": true},
        			{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "bc1":  true, "proband": true}
        		],
        		width: 600,
        		height: 400,
        		symbol_size: 35,
        		DEBUG: false
        }, options );
		
        if(opts.DEBUG) {
        	pedigree_util.print_opts(opts);
        }
		var ped = d3.select(opts.targetDiv)
					 .append("svg:svg")
					 .attr("width", opts.width)
					 .attr("height", opts.height);

		ped.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "lightgrey");
		
		var top_level = [];
		for(var i=0; i<opts.dataset.length; i++) {
			if('top_level' in opts.dataset[i] && opts.dataset[i].top_level) {
				top_level.push(opts.dataset[i]);
			}
		}
		var hidden_root = {
			name : 'hidden_root',
			id : 0,
			hidden : true,
			children : top_level
		};

		var partners = pedigree_util.buildTree(opts, hidden_root, hidden_root)[0];	
		var root = d3.hierarchy(hidden_root);
		var treemap = d3.tree()
						.separation(function(a, b) {
							if(a.data.invisible || b.data.invisible) {
								return 0;
							}
							return a.parent === b.parent ? 1 : 1.2;
						})
						.size([ opts.width - (2*opts.symbol_size), opts.height - (2*opts.symbol_size) ]);
		
		var nodes = treemap(root.sort(function(a, b) { return a.data.id - b.data.id; }));
		var flattenNodes = nodes.descendants();
		pedigree_util.adjust_coords(nodes, flattenNodes);
		var partnerLinkNodes = pedigree_util.linkNodes(flattenNodes, partners);

		var node = ped.selectAll(".node")
					   .data(nodes.descendants())
					   .enter()
					   	.append("g");
	
		node.append("path")
			.filter(function (d) {
		    	return (d.data.hidden || d.data.invisible) && !DEBUG ? false : true;
			})
			.attr("class", "node")
			.attr("transform", function(d, i) {
				return "translate(" + (d.x + opts.symbol_size) + "," + (d.y) + ")";
			})
			.attr("d", d3.symbol().size(function(d) {
				if (d.data.hidden) {
					return opts.symbol_size * opts.symbol_size / 5;
				}
				return opts.symbol_size * opts.symbol_size;
			})
			.type(function(d) {
				return d.data.sex == "M" ? d3.symbolSquare : d3.symbolCircle;
			}))
			.style("fill", function(d) {
				if (pedigree_util.isProband(d.data)) {
					return "yellow";
				} else if (d.data.hidden) {
					return "lightgrey";
				}
				return d.data.sex == "M" ? "#69d3bf" : "red"
			})
			.style("stroke", "#253544").style("stroke-width", ".8px");

		// names of individuals
		node.filter(function (d) {
	    		return d.data.hidden && !DEBUG ? false : true;
			}).append("text")
			.attr("class", "label")
			.attr("x", function(d) { return d.x + (3 * opts.symbol_size)/5 ; })
			.attr("y", function(d) { return d.y; })
			.attr("dy", ".25em")
			.text(function(d) { return (d.data.name + (opts.DEBUG ? ' ' + d.data.id : '')); });

		ptree.addWidgets(opts, node);
			
		// links between partners
		var partners = ped.selectAll(".partner")
		  	.data(partnerLinkNodes)
		  	.enter()
		  		.insert("path", "g")
		  		.attr("fill", "none")
		  		.attr("stroke", "#000")
		  		.attr("shape-rendering", "crispEdges")
		  		.attr('d', function(d, i) {
		  			return	"M" + (d.mother.x+ opts.symbol_size) + "," + (d.mother.y) +
		  					"L" + (d.father.x+ opts.symbol_size) + "," + (d.father.y);
		  		});

		// links to children
		var links = ped.selectAll(".link")
			.data(root.links(nodes.descendants()))
			.enter()
				.insert("path", "g")
				.attr("fill", "none")
				.attr("stroke", "#000")
				.attr("shape-rendering", "crispEdges")
				.attr("d", function(d, i) {
					if(d.target.data.noparents !== undefined ||
					   d.source.parent == null || d.target.data.hidden || d.source.data.invisible) {
						return;
					}
					return "M" + (d.source.x + opts.symbol_size) + "," + (d.source.y ) +
					       "V" + ((d.source.y + d.target.y) / 2) +
					       "H" + (d.target.x + opts.symbol_size) +
					       "V" + (d.target.y );
				});

		// drag and zoom
		var zoom = d3.zoom()
		  .scaleExtent([0.5, 4])
		  .on('zoom', zoomFn);

		function zoomFn() {
		  ped.selectAll('g').attr('transform', 'translate(' + d3.event.transform.x + ',' + d3.event.transform.y + ') scale(' + d3.event.transform.k + ')');
		  links.attr('transform', 'translate(' + d3.event.transform.x + ',' + d3.event.transform.y + ') scale(' + d3.event.transform.k + ')');
		  partners.attr('transform', 'translate(' + d3.event.transform.x + ',' + d3.event.transform.y + ') scale(' + d3.event.transform.k + ')');
		}
		ped.select('rect').call(zoom);
	}
	
	//
	// Add widgets to nodes and bind events
	ptree.addWidgets = function(opts, node) {
		// rectangle used to highlight on mouse over
		node.append("rect")
			.filter(function (d) {
			    return d.data.hidden && !opts.DEBUG ? false : true;
			})
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y - opts.symbol_size; })
			.attr("width",  (2 * opts.symbol_size)+'px')
			.attr("height", (2 * opts.symbol_size)+'px')
			.style("stroke", "black")
			.style("stroke-width", 0.7)
			.style("opacity", 0)
			.attr("fill", "lightgrey");
		
		// widgets
		node.append("text")
			.filter(function (d) {
		    	return d.data.hidden && !opts.DEBUG ? false : true;
			})
			.attr("class", 'delete')
			.style("opacity", 0)
			.attr("x", function(d) { return d.x + (2*opts.symbol_size) - 11; })
			.attr("y", function(d) { return d.y - opts.symbol_size + 11; })
			.attr('font-family', 'monospace')
			.attr('font-size', '0.9em' )
			.style('fill', 'darkred')
			.style("font-weight", "bold")
			.text(function(d) { return 'x' });		

		var fx = function(d) { return d.x + off; };
		var fy = function(d) { return d.y + opts.symbol_size; }
		var widgets = {
				'settings':   {'text': '\uf013'},
				'addchild':   {'text': '\uf063'},
				'addsibling': {'text': '\uf234'},
				'addpartner': {'text': '\uf0c1'},
				'addparents': {'text': '\uf062', 'fx': function(d) { return d.x }, 'fy': function(d) { return d.y }}};

		var off = 1;
		for(var key in widgets) {
			node.append("text")
				.filter(function (d) {
			    	return  (d.data.hidden && !opts.DEBUG ? false : true) &&
			    	       !(d.data.parent_node !== undefined && key === 'addpartner') &&
			    	       !(d.data.noparents === undefined && key === 'addparents');
				})
				.attr("class", key)
				.style("opacity", 0)
				.attr('font-family', 'FontAwesome')
				.attr("x", 'fx' in widgets[key] ? widgets[key]['fx']: fx)
				.attr("y", 'fy' in widgets[key] ? widgets[key]['fy']: fy)
				.attr('font-size', '0.9em' )
				.text(function(d) { return widgets[key]['text'] });		
			off += 17;
		}

		// handle widget clicks
		d3.selectAll(".settings, .addchild, .addsibling, .addpartner, .addparents, .delete")
		  .on("click", function () {
			var opt = d3.select(this).attr('class');
			var d = d3.select(this.parentNode).datum();
			if(DEBUG) {
				console.log(opt);
			}

			if(opt === 'settings') {
				$('#node_properties').dialog({
				    autoOpen: false,
				    title: d.data.name
				});
				$('#node_properties').html("<ul>");
				$.each(d.data, function(k, v) {
					if(k !== "children") {
						$('#node_properties').append("<li>"+k+": "+v+"</li>");
					}
			    });
				$('#node_properties').append("</ul>");
				$('#node_properties').dialog('open');
			} else if(opt === 'delete') {
				var newdataset = copy_dataset(opts.dataset);
				opts['dataset'] = delete_node_dataset(newdataset, d.data);
				$(opts.targetDiv).empty();
				ptree.build(opts);
			} else if(opt === 'addchild') {
				if(d.data.parent_node !== undefined){
					var children = d.data.parent_node.children;
					if(children !== undefined && children.length > 0) {
						var child = children[0];
						var newdataset = copy_dataset(opts.dataset);
						var idx = pedigree_util.getIdxByName(newdataset, child.name);
						
						var newbie = {"name": ptree.makeid(3), "sex": "M", "mother": child.mother, "father": child.father};
						newdataset.splice(idx, 0, newbie);
						opts['dataset'] = newdataset;
						$(opts.targetDiv).empty();
						ptree.build(opts);
					}
				} else {
					// TODO:: currently no children so a partner has not been added
					console.log('TODO:: currently no children so a partner has not been added');
				}
			} else if(opt === 'addsibling') {
				var newdataset = copy_dataset(opts.dataset);
				addsibling(newdataset, d.data, d.data.sex);
				opts['dataset'] = newdataset;
				$(opts.targetDiv).empty();
				ptree.build(opts);
			} else if(opt === 'addparents') {
				var newdataset = copy_dataset(opts.dataset);
				opts['dataset'] = newdataset;
				
				var midx = pedigree_util.getIdxByName(newdataset, d.data.mother);
				var thismother = newdataset[midx];
				var mother = addsibling(newdataset, thismother, 'F');
				var father = addsibling(newdataset, thismother, 'M');
				
				var idx = pedigree_util.getIdxByName(newdataset, d.data.name);
				if(d.depth == 2) {
					mother.top_level = true;
					father.top_level = true;
				} else {
					mother.noparents = true;
					father.noparents = true;
				}
				newdataset[idx].mother = mother.name;
				newdataset[idx].father = father.name;
				delete newdataset[idx].noparents;
			
				$(opts.targetDiv).empty();
				ptree.build(opts);
			} else if(opt === 'addpartner') {
				var newdataset = copy_dataset(opts.dataset);
				var partner = addsibling(newdataset, d.data, d.data.sex=== 'F' ? 'M' : 'F');
				partner.noparents = true;

				var child = {"name": ptree.makeid(3), "sex": "M", "mother": partner.name, "father": d.data.name};
				var idx = pedigree_util.getIdxByName(newdataset, d.data.name);

				newdataset.splice(idx, 0, child);
				opts['dataset'] = newdataset;
				$(opts.targetDiv).empty();
				ptree.build(opts);				
			}
		});
		
		// other mouse events
		var highlight = [];
		node.filter(function (d) {
	    	return !d.data.hidden;
		})
		.on("click", function (d) {
			if (d3.event.ctrlKey) {
				if(highlight.indexOf(this) == -1){
					highlight.push(d);
					console.log(d.data.parent_node.father);
					console.log(d.data.parent_node.mother);
				} else {
					highlight.splice(highlight.indexOf(d), 1);
				}
			} else {
				highlight = [];
			}
     	})
		.on("mouseover", function(){
			d3.select(this).selectAll('.settings, .addchild, .addsibling, .addpartner, .addparents, .delete')
			  .style("opacity", 1);
			d3.select(this).select('rect')
			  .style("opacity", 0.2);
		})
		.on("mouseout", function(d){
			d3.select(this).selectAll('.settings, .addchild, .addsibling, .addpartner, .addparents, .delete')
			  .style("opacity", 0);
			if(highlight.indexOf(d) == -1){
				d3.select(this).select('rect').style("opacity", 0);
			}
		});
	}
	
	copy_dataset = function(dataset) {
		var disallowed = ["id", "parent_node"];
		var newdataset = [];
		for(var i=0; i<dataset.length; i++){
			var obj = {};
			for(var key in dataset[i]) {
				if(disallowed.indexOf(key) == -1) {
					obj[key] = dataset[i][key];
				}
			}
			newdataset.push(obj);
		}
		return newdataset;
	}
	
	//
	addsibling = function(dataset, node, sex) {
		var newbie = {"name": ptree.makeid(3), "sex": sex, "mother": node.mother, "father": node.father};
		if(node.top_level) {
			newbie['top_level'] = true;
		}
		var idx = pedigree_util.getIdxByName(dataset, node.name);
		dataset.splice(idx, 0, newbie);
		return newbie;
	}
	
	// delete a node and it's descendants
	delete_node_dataset = function(dataset, node) {
		var nodeName = node.name;
		var idx = pedigree_util.getIdxByName(dataset, nodeName);
		dataset.splice(idx, 1);
		if(node.parent_node !== undefined) {
			for(var i=0; i<node.parent_node.children.length; i++) {
				dataset = delete_node_dataset(dataset, node.parent_node.children[i]);
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
