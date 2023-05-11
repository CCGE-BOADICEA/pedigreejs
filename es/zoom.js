/**
/* © 2023 Cambridge University
/* SPDX-FileCopyrightText: 2023 Cambridge University
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
	let k = (xyk.length == 3 ? xyk[2] : 1);
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
	(opts.DEBUG && console.log("zoom", d3.event, e.transform));
	let t = e.transform;
	let k = (t.k && t.k !== 1 ? t.k : undefined);
	setposition(opts, t.x, t.y, k);
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	ped.attr('transform', 'translate(' + t.x + ',' + t.y + ')' + (k ? ' scale(' + k + ')' : ''));
}

function get_pedigree_center(opts) {
	let b = get_bounds(opts);
	return {x: b.xmin+(b.xmax-b.xmin)/2, y: b.ymin+(b.ymax-b.ymin)/2};
}

// find width/height of pedigree graphic
function get_dimensions(opts) {
	let b = get_bounds(opts);
	return {wid: Math.abs(b.xmax-b.xmin), hgt: Math.abs(b.ymax-b.ymin)};
}

export function get_bounds(opts) {
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	let xmin = Number.MAX_VALUE;
	let xmax = -1000000;
	let ymin = Number.MAX_VALUE;
	let ymax = -1000000;
	let sym = opts.symbol_size;
	ped.selectAll('g').each(function(d, _i) {
		if(d.x && d.data.name !== 'hidden_root') {
			let node = d3.select(this).node();
			let dg = node.getBBox();
			let w = dg.width;
			let h = dg.height;

			if(d.x-sym < xmin) xmin = d.x-sym;
			if(d.x+w+sym > xmax) xmax = d.x+w+sym;
			if(d.y < ymin) ymin = d.y;
			if(d.y+h+sym > ymax) ymax = d.y+h+sym;
		}
	});
	return {xmin:xmin, xmax:xmax, ymin:ymin, ymax:ymax};
}

function get_svg_size(svg) {
	return {w: svg.node().clientWidth, h:svg.node().clientHeight};
}
