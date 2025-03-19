/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// pedigree widgets
import * as utils from './utils.js';
import {save} from './popup_form.js';
import {current as pedcache_current} from './pedcache.js';
import {getUniqueTwinID, setMzTwin, checkTwins} from './twins.js';


let dragging;
let last_mouseover;
//
// Add widgets to nodes and bind events
export function addWidgets(opts, node) {

	// popup gender selection box
	let font_size = parseInt($("body").css('font-size'));
	let popup_selection = d3.select('.diagram');
	popup_selection.append("rect").attr("class", "popup_selection")
							.attr("rx", 6)
							.attr("ry", 6)
							.attr("transform", "translate(-1000,-100)")
							.style("opacity", 0)
							.attr("width",  font_size*7.9)
							.attr("height", font_size*2)
							.style("stroke", "darkgrey")
							.attr("fill", "white");

	let square = popup_selection.append("text")  // male
		.attr('font-family', 'FontAwesome')
		.style("opacity", 0)
		.style("font-size", "1.1em")
		.attr("class", "popup_selection fa-square persontype")
		.attr("transform", "translate(-1000,-100)")
		.attr("x", font_size/3)
		.attr("y", font_size*1.5)
		.text("\uf096 ");
	let square_title = square.append("svg:title").text("add male");

	let circle = popup_selection.append("text")  // female
		.attr('font-family', 'FontAwesome')
		.style("opacity", 0)
		.style("font-size", "1.1em")
		.attr("class", "popup_selection fa-circle persontype")
		.attr("transform", "translate(-1000,-100)")
		.attr("x", font_size*1.71)
		.attr("y", font_size*1.5)
		.text("\uf10c ");
	let circle_title = circle.append("svg:title").text("add female");

	let unspecified = popup_selection.append("text")  // unspecified
		.attr('font-family', 'FontAwesome')
		.style("opacity", 0)
		.style("font-size", "1.1em")
		.attr("transform", "translate(-1000,-100)")
		.attr("x", font_size*0.065)
		.attr("y", -font_size*0.065)
		.attr("class", "popup_selection fa-unspecified popup_selection_rotate45 persontype")
		.text("\uf096 ");
	unspecified.append("svg:title").text("add unspecified");

	let dztwin = popup_selection.append("text")  // dizygotic twins
		.attr('font-family', 'FontAwesome')
		.style("opacity", 0)
		.style("font-size", "1.6em")
		.attr("transform", "translate(-1000,-100)")
		.attr("class", "popup_selection fa-angle-up persontype dztwin")
		.attr("x", font_size*4.62)
		.attr("y", font_size*1.5)
		.text("\uf106 ");
	dztwin.append("svg:title").text("add dizygotic/fraternal twins");

	let mztwin = popup_selection.append("text")  // monozygotic twins
	.attr('font-family', 'FontAwesome')
	.style("opacity", 0)
	.style("font-size", "1.6em")
	.attr("transform", "translate(-1000,-100)")
	.attr("class", "popup_selection fa-caret-up persontype mztwin")
	.attr("x", font_size*6.4)
	.attr("y", font_size*1.5)
	.text("\uf0d8 ");
	mztwin.append("svg:title").text("add monozygotic/identical twins");

	let add_person = {};
	// click the person type selection
	d3.selectAll(".persontype")
	  .on("click", function () {
		let newdataset = utils.copy_dataset(pedcache_current(opts));
		let mztwin = d3.select(this).classed("mztwin");
		let dztwin = d3.select(this).classed("dztwin");
		let twin_type;
		let sex;
		if(mztwin || dztwin) {
			sex = add_person.node.datum().data.sex;
			twin_type = (mztwin ? "mztwin" : "dztwin");
		} else {
			sex = d3.select(this).classed("fa-square") ? 'M' : (d3.select(this).classed("fa-circle") ? 'F' : 'U');
		}

		if(add_person.type === 'addsibling')
			addsibling(newdataset, add_person.node.datum().data, sex, false, twin_type);
		else if(add_person.type === 'addchild')
			addchild(newdataset, add_person.node.datum().data, (twin_type ? 'U' : sex), (twin_type ? 2 : 1), twin_type);
		else
			return;
		opts.dataset = newdataset;
		$(document).trigger('rebuild', [opts]);
		d3.selectAll('.popup_selection').style("opacity", 0);
		add_person = {};
	  })
	  .on("mouseover", function() {
		  if(add_person.node)
			  add_person.node.select('rect').style("opacity", 0.2);
		  d3.selectAll('.popup_selection').style("opacity", 1);
		  // add tooltips to font awesome widgets
		  if(add_person.type === 'addsibling'){
			 if(d3.select(this).classed("fa-square"))
				  square_title.text("add brother");
			  else
				  circle_title.text("add sister");
		  } else if(add_person.type === 'addchild'){
			  if(d3.select(this).classed("fa-square"))
				  square_title.text("add son");
			  else
				  circle_title.text("add daughter");
		  }
	  });

	// handle mouse out of popup selection
	d3.selectAll(".popup_selection").on("mouseout", function () {
		// hide rect and popup selection
		if(add_person.node !== undefined && highlight.indexOf(add_person.node.datum()) === -1)
			add_person.node.select('rect').style("opacity", 0);
		d3.selectAll('.popup_selection').style("opacity", 0);
	});


	// drag line between nodes to create partners
	drag_handle(opts);

	// rectangle used to highlight on mouse over
	node.filter(function (d) {
		    return d.data.hidden && !opts.DEBUG ? false : true;
		})
		.append("rect")
		.attr("class", 'indi_rect')
		.attr("rx", 6)
		.attr("ry", 6)
		.attr("x", function(_d) { return - 0.75*opts.symbol_size; })
		.attr("y", function(_d) { return - opts.symbol_size; })
		.attr("width",  (1.5 * opts.symbol_size)+'px')
		.attr("height", (2 * opts.symbol_size)+'px')
		.style("stroke", "black")
		.style("stroke-width", 0.7)
		.style("opacity", 0)
		.attr("fill", "lightgrey");

	// widgets
	let fx = function(_d) {return off - (0.75*opts.symbol_size);};
	let fy = opts.symbol_size -2;
	let off = 0;
	let widgets = {
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
			'fx': (opts.symbol_size/2) - 1,
			'fy': - opts.symbol_size + 12,
			'styles': {"font-weight": "bold", "fill": "darkred", "font-family": "monospace"}
		}
	};

	if(opts.edit) {
		widgets.settings = {'text': '\uf013', 'title': 'settings', 'fx': (-font_size/2)+2, 'fy': -opts.symbol_size + 11};
	}

	for(let key in widgets) {
		let widget = node.filter(function (d) {
				return  (d.data.hidden && !opts.DEBUG ? false : true) &&
						!((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') &&
						!(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') &&
						!(d.data.parent_node === undefined && key === 'addchild') &&
						!((d.data.noparents === undefined && d.data.top_level === undefined) && key === 'addparents');
			})
			.append("text")
			.attr("class", key)
			.style("opacity", 0)
			.attr('font-family', 'FontAwesome')
			.attr("xx", function(d){return d.x;})
			.attr("yy", function(d){return d.y;})
			.attr("x", widgets[key].fx)
			.attr("y", widgets[key].fy)
			.attr('font-size', '0.85em' )
			.text(widgets[key].text);

		if('styles' in widgets[key])
			for(let style in widgets[key].styles){
				widget.attr(style, widgets[key].styles[style]);
			}

		widget.append("svg:title").text(widgets[key].title);
		off += 17;
	}

	// add sibling or child
	d3.selectAll(".addsibling, .addchild")
	  .on("mouseover", function () {
		  let type = d3.select(this).attr('class');
		  d3.selectAll('.popup_selection').style("opacity", 1);
		  add_person = {'node': d3.select(this.parentNode), 'type': type};

		  //let translate = getTranslation(d3.select('.diagram').attr("transform"));
		  let x = parseInt(d3.select(this).attr("xx")) + parseInt(d3.select(this).attr("x"));
		  let y = parseInt(d3.select(this).attr("yy")) + parseInt(d3.select(this).attr("y"));
		  d3.selectAll('.popup_selection').attr("transform", "translate("+x+","+(y+2)+")");
		  d3.selectAll('.popup_selection_rotate45')
			.attr("transform", "translate("+(x+(3*font_size))+","+(y+(font_size*1.2))+") rotate(45)");
	  });

	// handle widget clicks
	d3.selectAll(".addchild, .addpartner, .addparents, .delete, .settings")
	  .on("click", function (e) {
		  e.stopPropagation();
		let opt = d3.select(this).attr('class');
		let d = d3.select(this.parentNode).datum();
		if(opts.DEBUG) {
			console.log(opt);
		}

		let newdataset;
		if(opt === 'settings') {
			if(typeof opts.edit === 'function') {
				opts.edit(opts, d);
			} else {
				openEditDialog(opts, d);
			}
		} else if(opt === 'delete') {
			newdataset = utils.copy_dataset(pedcache_current(opts));
			delete_node_dataset(newdataset, d.data, opts, onDone);
		} else if(opt === 'addparents') {
			newdataset = utils.copy_dataset(pedcache_current(opts));
			opts.dataset = newdataset;
			addparents(opts, newdataset, d.data.name);
			$(document).trigger('rebuild', [opts]);
		} else if(opt === 'addpartner') {
			newdataset = utils.copy_dataset(pedcache_current(opts));
			addpartner(opts, newdataset, d.data.name);
			opts.dataset = newdataset;
			$(document).trigger('rebuild', [opts]);
		}
		// trigger fhChange event
		$(document).trigger('fhChange', [opts]);
	});

	// other mouse events
	let highlight = [];

	node.filter(function (d) { return !d.data.hidden; })
	.on("click", function (e, d) {
		if (e.ctrlKey) {
			if(highlight.indexOf(d) === -1)
				highlight.push(d);
			else
				highlight.splice(highlight.indexOf(d), 1);
		} else
			highlight = [d];

		if('nodeclick' in opts) {
			opts.nodeclick(d.data);
			d3.selectAll(".indi_rect").style("opacity", 0);
			d3.selectAll('.indi_rect').filter(function(d) {return highlight.indexOf(d) !== -1;}).style("opacity", 0.5);
		}
	})
	.on("mouseover", function(e, d){
		e.stopPropagation();
		last_mouseover = d;
		if(dragging) {
			if(dragging.data.name !== last_mouseover.data.name &&
			   dragging.data.sex !== last_mouseover.data.sex) {
				d3.select(this).select('rect').style("opacity", 0.2);
			}
			return;
		}
		d3.select(this).select('rect').style("opacity", 0.2);
		d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 1);
		d3.select(this).selectAll('.indi_details').style("opacity", 0);

		setLineDragPosition(opts.symbol_size-10, 0, opts.symbol_size-2, 0, d.x+","+(d.y+2));
	})
	.on("mouseout", function(d){
		if(dragging)
			return;

		d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 0);
		if(highlight.indexOf(d) === -1)
			d3.select(this).select('rect').style("opacity", 0);
		d3.select(this).selectAll('.indi_details').style("opacity", 1);
		// hide popup if it looks like the mouse is moving north
		let xcoord = d3.pointer(d)[0];
		let ycoord = d3.pointer(d)[1];
		if(ycoord < 0.8*opts.symbol_size)
			d3.selectAll('.popup_selection').style("opacity", 0);
		if(!dragging) {
			// hide popup if it looks like the mouse is moving north, south or west
			if( Math.abs(ycoord) > 0.25*opts.symbol_size ||
				Math.abs(ycoord) < -0.25*opts.symbol_size ||
				xcoord < 0.2*opts.symbol_size){
					setLineDragPosition(0, 0, 0, 0);
			}
        }
	});
}

function onDone(opts, dataset) {
	// assign new dataset and rebuild pedigree
	opts.dataset = dataset;
	$(document).trigger('rebuild', [opts]);
}

// drag line between nodes to create partners
function drag_handle(opts) {
	let line_drag_selection = d3.select('.diagram');
	let dline = line_drag_selection.append("line").attr("class", 'line_drag_selection')
        .attr("stroke-width", 6)
        .style("stroke-dasharray", ("2, 1"))
        .attr("stroke","black")
        .call(d3.drag()
                .on("start", dragstart)
                .on("drag", drag)
                .on("end", dragstop));
	dline.append("svg:title").text("drag to create consanguineous partners");

	setLineDragPosition(0, 0, 0, 0);

	function dragstart() {
		dragging = last_mouseover;
		d3.selectAll('.line_drag_selection')
			.attr("stroke","darkred");
	}

	function dragstop(_d) {
		if(last_mouseover &&
		   dragging.data.name !== last_mouseover.data.name &&
		   dragging.data.sex  !== last_mouseover.data.sex) {
			// make partners
			let child = {"name": utils.makeid(4), "sex": 'U',
				     "mother": (dragging.data.sex === 'F' ? dragging.data.name : last_mouseover.data.name),
			         "father": (dragging.data.sex === 'F' ? last_mouseover.data.name : dragging.data.name)};
			let newdataset = utils.copy_dataset(opts.dataset);
			opts.dataset = newdataset;

			let idx = utils.getIdxByName(opts.dataset, dragging.data.name)+1;
			opts.dataset.splice(idx, 0, child);
			$(document).trigger('rebuild', [opts]);
		}
		setLineDragPosition(0, 0, 0, 0);
		d3.selectAll('.line_drag_selection')
			.attr("stroke","black");
		dragging = undefined;
		return;
	}

	function drag(e) {
		e.sourceEvent.stopPropagation();
		let dx = e.dx;
		let dy = e.dy;
		let xnew = parseFloat(d3.select(this).attr('x2'))+ dx;
        let ynew = parseFloat(d3.select(this).attr('y2'))+ dy;
        setLineDragPosition(opts.symbol_size-10, 0, xnew, ynew);
	}
}

/**
 * Set the position and start and end of consanguineous widget.
 */
function setLineDragPosition(x1, y1, x2, y2, translate) {
	if(translate) {
		d3.selectAll('.line_drag_selection').attr("transform", "translate("+translate+")");
	}
	d3.selectAll('.line_drag_selection')
		.attr("x1", x1)
		.attr("y1", y1)
		.attr("x2", x2)
		.attr("y2", y2);
}

function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// if opt.edit is set true (rather than given a function) this is called to edit node attributes
function openEditDialog(opts, d) {
	$('#node_properties').dialog({
	    autoOpen: false,
	    title: d.data.display_name,
	    width: ($(window).width() > 400 ? 450 : $(window).width()- 30)
	});

	let table = "<table id='person_details' class='table'>";

	table += "<tr><td style='text-align:right'>Unique ID</td><td><input class='form-control' type='text' id='id_name' name='name' value="+
	(d.data.name ? d.data.name : "")+"></td></tr>";
	table += "<tr><td style='text-align:right'>Name</td><td><input class='form-control' type='text' id='id_display_name' name='display_name' value="+
			(d.data.display_name ? d.data.display_name : "")+"></td></tr>";

	table += "<tr><td style='text-align:right'>Age</td><td><input class='form-control' type='number' id='id_age' min='0' max='120' name='age' style='width:7em' value="+
			(d.data.age ? d.data.age : "")+"></td></tr>";

	table += "<tr><td style='text-align:right'>Year Of Birth</td><td><input class='form-control' type='number' id='id_yob' min='1900' max='2050' name='yob' style='width:7em' value="+
		(d.data.yob ? d.data.yob : "")+"></td></tr>";

	table += '<tr><td colspan="2" id="id_sex">' +
			 '<label class="radio-inline"><input type="radio" name="sex" value="M" '+(d.data.sex === 'M' ? "checked" : "")+'>Male</label>' +
			 '<label class="radio-inline"><input type="radio" name="sex" value="F" '+(d.data.sex === 'F' ? "checked" : "")+'>Female</label>' +
			 '<label class="radio-inline"><input type="radio" name="sex" value="U">Unknown</label>' +
			 '</td></tr>';

	// alive status = 0; dead status = 1
	table += '<tr><td colspan="2" id="id_status">' +
			 '<label class="checkbox-inline"><input type="radio" name="status" value="0" '+(parseInt(d.data.status) === 0 ? "checked" : "")+'>&thinsp;Alive</label>' +
			 '<label class="checkbox-inline"><input type="radio" name="status" value="1" '+(parseInt(d.data.status) === 1 ? "checked" : "")+'>&thinsp;Deceased</label>' +
			 '</td></tr>';
	$("#id_status input[value='"+d.data.status+"']").prop('checked', true);

	// switches
	let switches = ["adopted_in", "adopted_out", "miscarriage", "stillbirth", "termination"];
	table += '<tr><td colspan="2"><strong>Reproduction:</strong></td></tr>';
	table += '<tr><td colspan="2">';
	for(let iswitch=0; iswitch<switches.length; iswitch++){
		let attr = switches[iswitch];
		if(iswitch === 2)
			table += '</td></tr><tr><td colspan="2">';
		table +=
		 '<label class="checkbox-inline"><input type="checkbox" id="id_'+attr +
		    '" name="'+attr+'" value="0" '+(d.data[attr] ? "checked" : "")+'>&thinsp;' +
		    capitaliseFirstLetter(attr.replace('_', ' '))+'</label>'
	}
	table += '</td></tr>';

	//
	let exclude = ["children", "name", "parent_node", "top_level", "id", "noparents",
		           "level", "age", "sex", "status", "display_name", "mother", "father",
		           "yob", "mztwin", "dztwin"];
	$.merge(exclude, switches);
	table += '<tr><td colspan="2"><strong>Age of Diagnosis:</strong></td></tr>';
	$.each(opts.diseases, function(k, v) {
		exclude.push(v.type+"_diagnosis_age");

		let disease_colour = '&thinsp;<span style="padding-left:5px;background:'+opts.diseases[k].colour+'"></span>';
		let diagnosis_age = d.data[v.type + "_diagnosis_age"];

		table += "<tr><td style='text-align:right'>"+capitaliseFirstLetter(v.type.replace("_", " "))+
					disease_colour+"&nbsp;</td><td>" +
					"<input class='form-control' id='id_" +
					v.type + "_diagnosis_age_0' max='110' min='0' name='" +
					v.type + "_diagnosis_age_0' style='width:5em' type='number' value='" +
					(diagnosis_age !== undefined ? diagnosis_age : "") +"'></td></tr>";
	});

	table += '<tr><td colspan="2" style="line-height:1px;"></td></tr>';
	$.each(d.data, function(k, v) {
		if($.inArray(k, exclude) === -1) {
			let kk = capitaliseFirstLetter(k);
			if(v === true || v === false) {
				table += "<tr><td style='text-align:right'>"+kk+"&nbsp;</td><td><input type='checkbox' id='id_" + k + "' name='" +
						k+"' value="+v+" "+(v ? "checked" : "")+"></td></tr>";
			} else if(k.length > 0){
				table += "<tr><td style='text-align:right'>"+kk+"&nbsp;</td><td><input type='text' id='id_" +
						k+"' name='"+k+"' value="+v+"></td></tr>";
			}
		}
    });
	table += "</table>";

	$('#node_properties').html(table);
	$('#node_properties').dialog('open');

	$('#node_properties input[type=radio], #node_properties input[type=checkbox], #node_properties input[type=text], #node_properties input[type=number]').on('change', function() {
		save(opts);
    });
	return;
}



// add children to a given node
export function addchild(dataset, node, sex, nchild, twin_type) {
	if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
		return new Error("INVALID TWIN TYPE SET: "+twin_type);

	if (typeof nchild === typeof undefined)
		nchild = 1;
	let children = utils.getAllChildren(dataset, node);
	let ptr_name, idx;
	if (children.length === 0) {
		let partner = addsibling(dataset, node, node.sex === 'F' ? 'M': 'F', node.sex === 'F');
		partner.noparents = true;
		ptr_name = partner.name;
		idx = utils.getIdxByName(dataset, node.name)+1;
	} else {
		let c = children[0];
		ptr_name = (c.father === node.name ? c.mother : c.father);
		idx = utils.getIdxByName(dataset, c.name);
	}

	let twin_id;
	if(twin_type)
		twin_id = getUniqueTwinID(dataset, twin_type);
	let newchildren = [];
	for (let i = 0; i < nchild; i++) {
		let child = {"name": utils.makeid(4), "sex": sex,
					 "mother": (node.sex === 'F' ? node.name : ptr_name),
					 "father": (node.sex === 'F' ? ptr_name : node.name)};
		dataset.splice(idx, 0, child);

		if(twin_type)
			child[twin_type] = twin_id;
		newchildren.push(child);
	}
	return newchildren;
}

//
export function addsibling(dataset, node, sex, add_lhs, twin_type) {
	if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
		return new Error("INVALID TWIN TYPE SET: "+twin_type);

	let newbie = {"name": utils.makeid(4), "sex": sex};
	if(node.top_level) {
		newbie.top_level = true;
	} else {
		newbie.mother = node.mother;
		newbie.father = node.father;
	}
	let idx = utils.getIdxByName(dataset, node.name);

	if(twin_type) {
		setMzTwin(dataset, dataset[idx], newbie, twin_type);
	}

	if(add_lhs) { // add to LHS
		if(idx > 0) idx--;
	} else
		idx++;
	dataset.splice(idx, 0, newbie);
	return newbie;
}

// add parents to the 'node'
export function addparents(opts, dataset, name) {
	let mother, father;
	let root = utils.roots[opts.targetDiv];
	let flat_tree = utils.flatten(root);
	let tree_node = utils.getNodeByName(flat_tree, name);
	let node  = tree_node.data;
	let depth = tree_node.depth;   // depth of the node in relation to the root (depth = 1 is a top_level node)

	let pid = -101;
	let ptr_name;
	let children = utils.getAllChildren(dataset, node);
	if(children.length > 0){
		ptr_name = children[0].mother === node.name ? children[0].father : children[0].mother;
		pid = utils.getNodeByName(flat_tree, ptr_name).data.id;
	}

	let i;
	if(depth === 1) {
		mother = {"name": utils.makeid(4), "sex": "F", "top_level": true};
		father = {"name": utils.makeid(4), "sex": "M", "top_level": true};
		dataset.splice(0, 0, mother);
		dataset.splice(0, 0, father);

		for(i=0; i<dataset.length; i++){
			if( (dataset[i].top_level || utils.getDepth(dataset, dataset[i].name) === 2) && 
			     dataset[i].name !== mother.name && dataset[i].name !== father.name){
				delete dataset[i].top_level;
				dataset[i].noparents = true;
				dataset[i].mother = mother.name;
				dataset[i].father = father.name;
			}
		}
	} else {
		let node_mother = utils.getNodeByName(flat_tree, tree_node.data.mother);
		let node_father = utils.getNodeByName(flat_tree, tree_node.data.father);
		let node_sibs = utils.getAllSiblings(dataset, node);

		// lhs & rhs id's for siblings of this node
		let rid = 10000;
		let lid = tree_node.data.id;
		for(i=0; i<node_sibs.length; i++){
			let sid = utils.getNodeByName(flat_tree, node_sibs[i].name).data.id;
			if(sid < rid && sid > tree_node.data.id)
				rid = sid;
			if(sid < lid)
				lid = sid;
		}
		let add_lhs = (lid >= tree_node.data.id || (pid === lid && rid < 10000));
		if(opts.DEBUG)
			console.log('lid='+lid+' rid='+rid+' nid='+tree_node.data.id+' ADD_LHS='+add_lhs);
		let midx;
		if( (!add_lhs && node_father.data.id > node_mother.data.id) ||
			(add_lhs && node_father.data.id < node_mother.data.id) )
			midx = utils.getIdxByName(dataset, node.father);
		else
			midx = utils.getIdxByName(dataset, node.mother);

		let parent = dataset[midx];
		father = addsibling(dataset, parent, 'M', add_lhs);
		mother = addsibling(dataset, parent, 'F', add_lhs);

		let faidx = utils.getIdxByName(dataset, father.name);
		let moidx = utils.getIdxByName(dataset, mother.name);
		if(faidx > moidx) {				   // switch to ensure father on lhs of mother
			let tmpfa = dataset[faidx];
			dataset[faidx] = dataset[moidx];
			dataset[moidx] = tmpfa;
		}

		let orphans = utils.getAdoptedSiblings(dataset, node);
		let nid = tree_node.data.id;
		for(i=0; i<orphans.length; i++){
			let oid = utils.getNodeByName(flat_tree, orphans[i].name).data.id;
			if(opts.DEBUG)
				console.log('ORPHAN='+i+' '+orphans[i].name+' '+(nid < oid && oid < rid)+' nid='+nid+' oid='+oid+' rid='+rid);
			if((add_lhs || nid < oid) && oid < rid){
				let oidx = utils.getIdxByName(dataset, orphans[i].name);
				dataset[oidx].mother = mother.name;
				dataset[oidx].father = father.name;
			}
		}
	}

	if(depth === 2) {
		mother.top_level = true;
		father.top_level = true;
	} else if(depth > 2) {
		mother.noparents = true;
		father.noparents = true;
	}
	let idx = utils.getIdxByName(dataset, node.name);
	dataset[idx].mother = mother.name;
	dataset[idx].father = father.name;
	delete dataset[idx].noparents;

	if('parent_node' in node) {
		let ptr_node = dataset[utils.getIdxByName(dataset, ptr_name)];
		if('noparents' in ptr_node) {
			ptr_node.mother = mother.name;
			ptr_node.father = father.name;
		}
	}
}

// add partner
export function addpartner(opts, dataset, name) {
	let root = utils.roots[opts.targetDiv];
	let flat_tree = utils.flatten(root);
	let tree_node = utils.getNodeByName(flat_tree, name);

	let partner = addsibling(dataset, tree_node.data, tree_node.data.sex === 'F' ? 'M' : 'F', tree_node.data.sex === 'F');
	partner.noparents = true;

	let child = {"name": utils.makeid(4), "sex": "M"};
	child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
	child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);

	let idx = utils.getIdxByName(dataset, tree_node.data.name)+2;
	dataset.splice(idx, 0, child);
}

// get adjacent nodes at the same depth
function adjacent_nodes(root, node, excludes) {
	let dnodes = utils.getNodesAtDepth(utils.flatten(root), node.depth, excludes);
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
	let root = utils.roots[opts.targetDiv];
	let fnodes = utils.flatten(root);
	let deletes = [];
	let i, j;

	// get d3 data node
	if(node.id === undefined) {
		let d3node = utils.getNodeByName(fnodes, node.name);
		if(d3node !== undefined)
			node = d3node.data;
	}

	if(node.parent_node) {
		for(i=0; i<node.parent_node.length; i++){
			let parent = node.parent_node[i];
			let ps = [utils.getNodeByName(dataset, parent.mother.name),
					  utils.getNodeByName(dataset, parent.father.name)];
			// delete parents
			for(j=0; j<ps.length; j++) {
				if(ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
					dataset.splice(utils.getIdxByName(dataset, ps[j].name), 1);
					deletes.push(ps[j]);
				}
			}

			let children = parent.children;
			let children_names = $.map(children, function(p, _i){return p.name;});
			for(j=0; j<children.length; j++) {
				let child = utils.getNodeByName(dataset, children[j].name);
				if(child){
					child.noparents = true;
					let ptrs = utils.get_partners(dataset, child);
					let ptr;
					if(ptrs.length > 0)
						ptr = utils.getNodeByName(dataset, ptrs[0]);
					if(ptr && ptr.mother !== child.mother) {
						child.mother = ptr.mother;
						child.father = ptr.father;
					} else if(ptr) {
						let child_node  = utils.getNodeByName(fnodes, child.name);
						let adj = adjacent_nodes(root, child_node, children_names);
						child.mother = adj[0] ? adj[0].data.mother : (adj[1] ? adj[1].data.mother : null);
						child.father = adj[0] ? adj[0].data.father : (adj[1] ? adj[1].data.father : null);
					} else {
						dataset.splice(utils.getIdxByName(dataset, child.name), 1);
					}
				}
			}
		}
	} else {
		dataset.splice(utils.getIdxByName(dataset, node.name), 1);
	}

	// delete ancestors
	console.log(deletes);
	for(i=0; i<deletes.length; i++) {
		let del = deletes[i];
		let sibs = utils.getAllSiblings(dataset, del);
		console.log('DEL', del.name, sibs);
		if(sibs.length < 1) {
			console.log('del sibs', del.name, sibs);
			let data_node  = utils.getNodeByName(fnodes, del.name);
			let ancestors = data_node.ancestors();
			for(j=0; j<ancestors.length; j++) {
				console.log(ancestors[i]);
				if(ancestors[j].data.mother){
					console.log('DELETE ', ancestors[j].data.mother, ancestors[j].data.father);
					dataset.splice(utils.getIdxByName(dataset, ancestors[j].data.mother.name), 1);
					dataset.splice(utils.getIdxByName(dataset, ancestors[j].data.father.name), 1);
				}
			}
		}
	}
	// check integrity of mztwins settings
	checkTwins(dataset);

	let uc;
	try	{
		// validate new pedigree dataset
		let newopts = $.extend({}, opts);
		newopts.dataset = utils.copy_dataset(dataset);
		utils.validate_pedigree(newopts);
		// check if pedigree is split
		uc = utils.unconnected(dataset);
	} catch(err) {
		utils.messages('Warning', 'Deletion of this pedigree member is disallowed.')
		throw err;
	}
	if(uc.length > 0) {
		// check & warn only if this is a new split
		if(utils.unconnected(opts.dataset).length === 0) {
			console.error("individuals unconnected to pedigree ", uc);
			utils.messages("Warning", "Deleting this will split the pedigree. Continue?", onDone, opts, dataset);
			return;
		}
	}

	if(onDone) {
		onDone(opts, dataset);
	}
	return dataset;
}

