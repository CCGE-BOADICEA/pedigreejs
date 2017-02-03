
// pedigree widgets
(function(widgets, $, undefined) {

	function getTranslation(transform) {
    	  // Create a dummy g for calculation purposes only. This will never
    	  // be appended to the DOM and will be discarded once this function 
    	  // returns.
    	  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    	  // Set the transform attribute to the provided string value.
    	  g.setAttributeNS(null, "transform", transform);

    	  // consolidate the SVGTransformList containing all transformations
    	  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    	  // its SVGMatrix. 
    	  var matrix = g.transform.baseVal.consolidate().matrix;

    	  // As per definition values e and f are the ones for the translation.
    	  return [matrix.e, matrix.f];
    	}
    
	//
	// Add widgets to nodes and bind events
    widgets.addWidgets = function(opts, node) {

    	// popup gender selection box
    	var font_size = parseInt($("body").css('font-size'));
    	var popup_selection = d3.select('svg').append("g");
    	popup_selection.append("rect").attr("class", "popup_selection")
    							.attr("rx", 6)
    							.attr("ry", 6)
    							.style("opacity", 0)
    							.attr("width", (font_size+4)*3)
    							.attr("height", font_size+4)
    							.attr("fill", "white");
    	
		var square = popup_selection.append("text")  // male
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.em' )
			.attr("class", "popup_selection fa-square persontype")
			.attr("x", 2)
			.attr("y", font_size)
			.html("\uf096&nbsp");
		var square_title = square.append("svg:title").text("add male");
		
		var circle = popup_selection.append("text")  // female
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.em' )
			.attr("class", "popup_selection fa-circle persontype")
			.attr("x", font_size+4)
			.attr("y", font_size)
			.html("\uf10c&nbsp");
		var circle_title = circle.append("svg:title").text("add female");

		var unspecified = popup_selection.append("text")  // unspecified
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.em' )
			.attr("class", "popup_selection fa-unspecified popup_selection_rotate45 persontype")
			.html("\uf096&nbsp");
		var unspecified_title = unspecified.append("svg:title").text("add unspecified");

		var add_person = {};
		// click the person type selection
		d3.selectAll(".persontype")
		  .on("click", function () {
			var newdataset = ptree.copy_dataset(opts.dataset);
			var sex = d3.select(this).classed("fa-square") ? 'M' : (d3.select(this).classed("fa-circle") ? 'F' : 'U');
			if(add_person['type'] === 'addsibling')
				ptree.addsibling(newdataset, add_person['node'].datum().data, sex);
			else if(add_person['type'] === 'addchild')
				ptree.addchild(newdataset, add_person['node'].datum().data, sex);
			else
				return
			opts['dataset'] = newdataset;	
			ptree.rebuild(opts);
			d3.selectAll('.popup_selection').style("opacity", 0);
			add_person = {};
		  })
		  .on("mouseover", function() {
			  if(add_person['node'])
				  add_person['node'].select('rect').style("opacity", 0.2);
			  d3.selectAll('.popup_selection').style("opacity", 1);
			  // add tooltips to font awesome widgets
			  if(add_person['type'] === 'addsibling'){
				 if(d3.select(this).classed("fa-square"))
					  square_title.text("add brother");
				  else 
					  circle_title.text("add sister");
			  } else if(add_person['type'] === 'addchild'){
				  if(d3.select(this).classed("fa-square"))
					  square_title.text("add son");
				  else
					  circle_title.text("add daughter");				  
			  }
		  });

		// handle mouse out of popup selection
		d3.selectAll(".popup_selection").on("mouseout", function () {
			// hide rect and popup selection
			if(add_person['node'] !== undefined && highlight.indexOf(add_person['node'].datum()) == -1)
				add_person['node'].select('rect').style("opacity", 0);
			d3.selectAll('.popup_selection').style("opacity", 0);
		});

		// rectangle used to highlight on mouse over
		node.append("rect")
			.filter(function (d) {
			    return d.data.hidden && !opts.DEBUG ? false : true;
			})
			.attr("class", 'indiv_rect')
			.attr("rx", 6)
			.attr("ry", 6)
			.attr("x", function(d) { return - 0.75*opts.symbol_size; })
			.attr("y", function(d) { return - opts.symbol_size; })
			.attr("width",  (1.5 * opts.symbol_size)+'px')
			.attr("height", (2 * opts.symbol_size)+'px')
			.style("stroke", "black")
			.style("stroke-width", 0.7)
			.style("opacity", 0)
			.attr("fill", "lightgrey");

		// widgets
		var fx = function(d) {return off - 0.75*opts.symbol_size};
		var fy = opts.symbol_size -2;
		var off = 0;
		var widgets = {
			'addchild':   {'text': '\uf063', 'title': 'add child',   'fx': fx, 'fy': fy},
			'addsibling': {'text': '\uf234', 'title': 'add sibling', 'fx': fx, 'fy': fy},
			'addpartner': {'text': '\uf0c1', 'title': 'add partner', 'fx': fx, 'fy': fy},
			'addparents': {
				'text': '\uf062', 'title': 'add parents',
				'fx': - 0.75*opts.symbol_size,
				'fy': - opts.symbol_size + 11
			},
			'delete': {
				'text': 'X', 'title': 'delete',
				'fx': opts.symbol_size/2 - 1,
				'fy': - opts.symbol_size + 12,
				'styles': {"font-weight": "bold", "fill": "darkred", "font-family": "monospace"}
			}
		};

		for(var key in widgets) {
			var widget = node.append("text")
				.filter(function (d) {
			    	return  (d.data.hidden && !opts.DEBUG ? false : true) &&
			    	       !((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') &&
			    	       !(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') &&
			    	       !(d.data.parent_node === undefined && key === 'addchild') &&
			    	       !((d.data.noparents === undefined && d.data.top_level === undefined) && key === 'addparents');
				})
				.attr("class", key)
				.style("opacity", 0)
				.attr('font-family', 'FontAwesome')
				.attr("xx", function(d){return d.x})
				.attr("yy", function(d){return d.y})
				.attr("x", widgets[key]['fx'])
				.attr("y", widgets[key]['fy'])
				.attr('font-size', '0.9em' )
				.html(widgets[key]['text']);

			if('styles' in widgets[key])
				for(var style in widgets[key]['styles']){
					widget.attr(style, widgets[key]['styles'][style]);
				}

			widget.append("svg:title").text(widgets[key]['title']);
			off += 17;
		}

		// add sibling or child
		d3.selectAll(".addsibling, .addchild")
		  .on("mouseover", function () {
			  var type = d3.select(this).attr('class');
			  d3.selectAll('.popup_selection').style("opacity", 1);
			  add_person = {'node': d3.select(this.parentNode), 'type': type};

			  var translate = getTranslation(d3.select('.diagram').attr("transform"));
			  var x = parseInt(d3.select(this).attr("xx")) + parseInt(d3.select(this).attr("x")) + translate[0];
			  var y = parseInt(d3.select(this).attr("yy")) + parseInt(d3.select(this).attr("y")) + translate[1];
			  d3.selectAll('.popup_selection').attr("transform", "translate("+x+","+(y+2)+")");
			  d3.selectAll('.popup_selection_rotate45')
			  	.attr("transform", "translate("+(x+2*(font_size+3))+","+(y+font_size/2+4)+") rotate(45)");
		  })
		  .on("mouseout", function () {
			  d3.selectAll('.popup_selection').style("opacity", 0);
		  });

		// handle widget clicks	
		d3.selectAll(".addchild, .addpartner, .addparents, .delete")
		  .on("click", function () {
			var opt = d3.select(this).attr('class');
			var d = d3.select(this.parentNode).datum();
			if(opts.DEBUG) {
				console.log(opt);
			}

			if(opt === 'delete') {
				var newdataset = ptree.copy_dataset(opts.dataset);
				opts['dataset'] = ptree.delete_node_dataset(newdataset, d.data, opts);
				ptree.rebuild(opts);
			} else if(opt === 'addparents') {
				var newdataset = ptree.copy_dataset(opts.dataset);
				opts['dataset'] = newdataset;
				ptree.addparents(opts, newdataset, d.data.name);
				ptree.rebuild(opts);
			} else if(opt === 'addpartner') {
				var newdataset = ptree.copy_dataset(opts.dataset);
				ptree.addpartner(opts, newdataset, d.data.name);
				opts['dataset'] = newdataset;
				ptree.rebuild(opts);				
			}
		});
		
		// other mouse events
		var highlight = [];
		node.filter(function (d) { return !d.data.hidden; })
		.on("click", function (d) {
			if (d3.event.ctrlKey) {
				if(highlight.indexOf(d) == -1)
					highlight.push(d);
				else
					highlight.splice(highlight.indexOf(d), 1);
			} else
				highlight = [d];
			
			if('nodeclick' in opts) {
				opts.nodeclick(d.data);
				d3.selectAll(".indiv_rect").style("opacity", 0);
				d3.selectAll('.indiv_rect').filter(function(d) {return highlight.indexOf(d) != -1}).style("opacity", 0.5);
			}
     	})
		.on("mouseover", function(d){
			d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete')
			  .style("opacity", 1);
			d3.select(this).select('rect')
			  .style("opacity", 0.2);
		})
		.on("mouseout", function(d){
			d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete')
			  .style("opacity", 0);
			if(highlight.indexOf(d) == -1)
				d3.select(this).select('rect').style("opacity", 0);
		});
	}

}(window.widgets = window.widgets || {}, jQuery));
