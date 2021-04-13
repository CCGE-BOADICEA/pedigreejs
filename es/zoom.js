import {getposition, setposition} from './pedcache.js';

let zoom;

// initialise zoom and drag
export function init_zoom(opts, svg) {
	// offsets
	let xi = opts.symbol_size/2;
	let yi = -opts.symbol_size*2.5;

	zoom = d3.zoom()
	  .scaleExtent([opts.zoomIn, opts.zoomOut])
	  .filter(function() {
			if(!opts.zoomSrc || opts.zoomSrc.indexOf('wheel') === -1) {
				if(d3.event.type && d3.event.type === 'wheel') return false
			}
			// ignore dblclick & secondary mouse buttons
			return (d3.event.type !== 'dblclick') && !d3.event.button})
	  .on('zoom', function() { zooming(opts); });
	svg.call(zoom);

	// set initial position & scale
	let xyk = getposition(opts);		// cached position
	let k = (xyk.length == 3 ? xyk[2] : 1);
	let x = (xyk[0] !== null ? xyk[0]/k: (xi*k));
	let y = (xyk[1] !== null ? xyk[1]/k: (yi*k));

	var transform = d3.zoomIdentity
      .scale(k)
      .translate(x, y);
    svg.call(zoom.transform, transform);
}

// scale size the pedigree
export function btn_zoom(opts, scale) {
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	svg.transition().duration(50).call(zoom.scaleBy, scale);
}

export function scale_to_fit(opts) {
	let d = get_dimensions(opts);
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	let size = get_svg_size(svg);
	let f = (size.w-opts.symbol_size*2)/size.w;
	let k = (f / Math.max(d.wid/size.w, d.hgt/size.h));

	if(k < opts.zoomIn) zoom.scaleExtent([k, opts.zoomOut]);

	let ped = get_pedigree_center(opts);
	svg.call(zoom.translateTo, ped.x, ped.y);
	setTimeout(function(){svg.transition().duration(700).call(zoom.scaleTo, k)}, 400);
}

function zooming(opts) {
	(opts.DEBUG && console.log("zoom", d3.event, d3.event.transform));
	let t = d3.event.transform;
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

function get_bounds(opts) {
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	let xmin = Number.MAX_VALUE;
	let xmax = -1000000;
	let ymin = Number.MAX_VALUE;
	let ymax = -1000000;
	let sym2 = opts.symbol_size/2;
	ped.selectAll('g').each(function(d, _i) {
		if(d.x && d.data.name !== 'hidden_root') {
			if(d.x-sym2 < xmin) xmin = d.x-sym2;
			if(d.x+sym2 > xmax) xmax = d.x+sym2;
			if(d.y-sym2 < ymin) ymin = d.y-sym2;
			if(d.y+sym2 > ymax) ymax = d.y+sym2;
		}
	});
	return {xmin:xmin, xmax:xmax, ymin:ymin, ymax:ymax};
}

function get_svg_size(svg) {
	return {w: svg.node().clientWidth, h:svg.node().clientHeight};
}
