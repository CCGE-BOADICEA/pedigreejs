/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

import {getposition, setposition} from './pedcache.js';

let zm;

// initialise zoom and drag
export function init_zoom(opts, svg) {
	// offsets
	let xi = opts.symbol_size/2;
	let yi = -opts.symbol_size*2.5;

	zm = d3.zoom()
	  .scaleExtent([opts.zoomIn, opts.zoomOut])
	  .filter(function(e) {
			if(!opts.zoomSrc || opts.zoomSrc.indexOf('wheel') === -1) {
				if(e.type && e.type === 'wheel') return false
			}
			// ignore dblclick & secondary mouse buttons
			return (e.type !== 'dblclick') && !e.button})
	  .on('zoom', function(e) { zooming(e, opts); });
	svg.call(zm);

	// set initial position & scale
	let xyk = getposition(opts);		// cached position
	let k = (xyk.length === 3 ? xyk[2] : 1);
	let x = (xyk[0] !== null ? xyk[0]/k: (xi*k));
	let y = (xyk[1] !== null ? xyk[1]/k: (yi*k));

	var transform = d3.zoomIdentity
      .scale(k)
      .translate(x, y);
    svg.call(zm.transform, transform);
}

// scale size the pedigree
export function btn_zoom(opts, scale) {
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	svg.transition().duration(50).call(zm.scaleBy, scale);
}

export function scale_to_fit(opts) {
	let d = get_dimensions(opts);
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	let size = get_svg_size(svg);
	let f = 1;
	let k = (f / Math.max(d.wid/size.w, d.hgt/size.h));

	if(k < opts.zoomIn) zm.scaleExtent([k, opts.zoomOut]);

	let ped = get_pedigree_center(opts);
	svg.call(zm.translateTo, ped.x-(opts.symbol_size), ped.y-(opts.symbol_size));
	setTimeout(function(){svg.transition().duration(700).call(zm.scaleTo, k)}, 400);
}

function zooming(e, opts) {
	(opts.DEBUG && console.log("zoom", e.transform));
	let t = e.transform;
	let k = (t.k && t.k !== 1 ? t.k : undefined);
	setposition(opts, t.x, t.y, k);
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	ped.attr('transform', 'translate(' + t.x + ',' + t.y + ')' + (k ? ' scale(' + k + ')' : ''));
}

function get_pedigree_center(opts) {
	let b = get_bounds(opts);
	return {x: b.xmin+((b.xmax-b.xmin)/2), y: b.ymin+((b.ymax-b.ymin)/2)};
}

// find width/height of pedigree graphic
function get_dimensions(opts) {
	let b = get_bounds(opts);
	return {wid: Math.abs(b.xmax-b.xmin), hgt: Math.abs(b.ymax-b.ymin)};
}

/**
 * Get the min/max boundary of the diagram
 */
export function get_bounds(opts) {
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	let xmin = Number.MAX_VALUE;
	let xmax = -1000000;
	let ymin = Number.MAX_VALUE;
	let ymax = -1000000;
	let sym = opts.symbol_size;
	ped.selectAll('g').each(function(d, _i) {
		if(d.x && d.data.name !== 'hidden_root' && !d.data.hidden) {
			let n = getNodeSize(opts, this, sym);
			if(d.x-sym < xmin) xmin = d.x-sym;
			if(d.x+n.w+sym > xmax) xmax = d.x+n.w+sym;
			if(d.y < ymin) ymin = d.y;
			if(d.y+n.h+sym > ymax) ymax = d.y+n.h+sym;
		}
	});
	return {xmin:xmin, xmax:xmax, ymin:ymin, ymax:ymax};
}

/**
 * Get the size of an individual's graphical representation
 */
function getNodeSize(opts, g_elm, sym) {
	let node = d3.select(g_elm).node();
	let dg = node.getBBox();
	let w = dg.width;
	let h = dg.height;
	if(w === 0 && h === 0) {	// pedigree not shown yet (family history section not opened)
		try {
			w = sym*2;
			h = sym*2;
			let text_elements = d3.select(g_elm).selectAll(".indi_details"); // get individuals details
			for(let i=0; i<text_elements._groups[0].length; i++) {
				let txt = text_elements._groups[0][i].firstChild.nodeValue;
				let txtsize = getTextSize(txt, opts.font_family, opts.font_size);
	
				w = Math.max(txtsize.w+(sym/2), w);
				h = Math.max((sym*2)+(i*txtsize.h), h);
			}
		} catch(err) {
			console.error(err);
			w = sym*2;
			h = sym*2;
		}
	}
	return {w:w, h:h};
}

/**
 * Calculate width and height of text
 */
function getTextSize(txt, font, fontSize) {
	  let o = $('<div></div>')
	            .text(txt)
	            .css(
					{'position': 'absolute',
					 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden',
					 'font': font || 'Helvetica',
					 'fontSize': fontSize || '1em'})
	            .appendTo($('body'));
	  let s = {w: o.width(), h:o.height()};
	  o.remove();
	  return s;
}

function get_svg_size(svg) {
	return {w: svg.node().clientWidth, h:svg.node().clientHeight};
}
