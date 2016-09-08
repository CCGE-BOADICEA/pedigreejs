
// Pedigree Tree Utils
(function(pedigree_util, $, undefined) {
	pedigree_util.buildTree = function(person, partnerLinks, id) {
		if (typeof person.children === typeof undefined) {
			person.children = pedigree_util.getChildren(dataset, person);
		}
		if (typeof partnerLinks === typeof undefined) {
			partnerLinks = [];
			id = 1;
		}

		var partners = [];
		var partnerNames = [];
		jQuery.each(person.children, function(i, child) {
			jQuery.each(dataset, function(i, p) {
				if (child.name === p.mother) {
					if ($.inArray(p.father, partnerNames) == -1) {
						partnerNames.push(p.father);
						partners.push({
							'mother' : child,
							'father' : pedigree_util.getPersonByName(dataset, p.father)
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
					name : '',
					hidden : true,
					parent : null,
					children : pedigree_util.getChildren(dataset, mother)
			};

			if('id' in father) {
				father.id = id++;
				parent['id'] = id++;
				mother.id = id++;
				
			} else {
				id = idChildren(person.children, id);
				mother.id = id++;
				parent['id'] = id++;
				father.id = id++;
			}

			person.children.push(parent);
		});
		id = idChildren(person.children, id);

		jQuery.each(person.children, function(i, p) {
			id = pedigree_util.buildTree(p, partnerLinks, id)[1];
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

	pedigree_util.getProbandIndex = function(dataset) {
		var proband;
		jQuery.each(dataset, function(i, val) {
			if (pedigree_util.isProband(val)) {
				return proband = i;
			}
		});
		return proband;
	}

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

	pedigree_util.getPersonByName = function(dataset, name) {
		var person = undefined;
		jQuery.each(dataset, function(i, p) {
			if (name === p.name) {
				return person = p;
			}
		});
		return person;
	}

	
	pedigree_util.connect = function(d, i) {
		if (d.source.parent == null || d.target.data.hidden) {
			return;
		}

		return "M" + (d.source.x) + "," + (d.source.y + symbol_size) +
		       "V" + ((3 * d.source.y + 4 * d.target.y) / 7) +
		       "H" + d.target.x +
		       "V" + (d.target.y + symbol_size);
	};

	pedigree_util.connectPartners = function(d, i) {
		return "M" + (d.mother.x) + "," + (d.mother.y + symbol_size) +
		       "L" + (d.father.x) + "," + (d.father.y + symbol_size);
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

	// return a flattened representation of the tree
	pedigree_util.flatten = function(root) {
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

	pedigree_util.getNodeByName = function(nodes, name) {
		for (i = 0; i < nodes.length; i++) {
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
}(window.pedigree_util = window.pedigree_util || {}, jQuery));



// Pedigree Tree Builder
(function(ptree, $, undefined) {

	ptree.build = function(targetDiv, dataset, width, height, symbol_size, DEBUG) {
		var proband_index = pedigree_util.getProbandIndex(dataset);
	
		var ped2 = d3.select(targetDiv)
					 .append("svg:svg")
					 .attr("width", width)
					 .attr("height", height);
		
		ped2.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("fill", "lightgrey");
		
		var top_level = [];
		for(var i=0; i<dataset.length; i++) {
			if('top_level' in dataset[i] && dataset[i].top_level) {
				top_level.push(dataset[i]);
			}
		}
		var hidden_root = {
			name : '',
			id : 0,
			hidden : true,
			children : top_level
		};
		
		var partners = pedigree_util.buildTree(hidden_root)[0];
		var root = d3.hierarchy(hidden_root);
		var treemap = d3.tree()
						.separation(function(a, b) {
							return a.parent === b.parent ? 1 : 1.2;
						})
						.size([ width, height - symbol_size - symbol_size ]);
		
		var nodes = treemap(root.sort(function(a, b) { return a.data.id - b.data.id; }));
		var flattenNodes = pedigree_util.flatten(nodes);
		var partnerLinkNodes = pedigree_util.linkNodes(flattenNodes, partners);
		
		var node = ped2.selectAll(".node")
					   .data(nodes.descendants())
					   .enter()
					   	.append("g");
		
		node.append("path")
			.filter(function (d) {
		    	return d.data.hidden && !DEBUG ? false : true;
			})
			.attr("transform", function(d, i) {
				return "translate(" + (d.x) + "," + (d.y + symbol_size) + ")";
			})
			.attr("d", d3.symbol().size(function(d) {
				if (d.data.hidden) {
					return symbol_size * symbol_size / 5;
				}
				return symbol_size * symbol_size;
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
		
		node.on("click", function(d, i) {
			console.log(d.data.name);
			d3.event.stopPropagation();
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
		});

		node.append("text")
			.attr("x", function(d) { return d.x - symbol_size/2; })
			.attr("y", function(d) { return d.y + symbol_size; })
			.attr("dy", ".25em")
			.text(function(d) { return (d.data.name + (DEBUG ? ' ' + d.data.id : '')); });

		var partnerLink = ped2.selectAll(".partner")
		            	 	  .data(partnerLinkNodes)
		            	 	  .enter()
		            	 	  	.insert("path", "g")
		            	 	  	.attr("fill", "none")
		            	 	  	.attr("stroke", "#000")
		            	 	  	.attr("shape-rendering", "crispEdges")
		            	 	  	.attr('d', pedigree_util.connectPartners);

		var link = ped2.selectAll(".link")
					   .data(root.links(nodes.descendants()))
					   .enter()
					   	.insert("path", "g").attr("fill", "none")
					   	.attr("stroke", "#000")
					   	.attr("shape-rendering", "crispEdges")
					   	.attr("d", pedigree_util.connect);
	}

}(window.ptree = window.ptree || {}, jQuery));
