import {getposition, setposition} from './pedcache.js';

let zoom, xi, yi;

// initialise zoom and drag
export function init_zoom(opts, svg) {
	// offsets
	xi = opts.symbol_size/2;
	yi = -opts.symbol_size*2.5;

	zoom = d3.zoom()
	  .scaleExtent([opts.zoomIn, opts.zoomOut])
	  .filter(function() {
			if(!opts.zoomSrc || opts.zoomSrc.indexOf('wheel') === -1) {
				if(d3.event.type && d3.event.type === 'wheel') return false
			}
			// ignore double click & secondary mouse buttons
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
	let xyk = getposition(opts);  // cached position
	let k = round(xyk.length == 3 ? xyk[2]*scale : 1*scale);
	let x = (xyk[0] !== null ? xyk[0] : 0);
	let y = (xyk[1] !== null ? xyk[1] : 0);

	if(k < opts.zoomIn || k > opts.zoomOut) {
		if(xyk.length == 3) {
			let zoomIn = (k < xyk[2]);
			if((zoomIn && k < opts.zoomIn) || (!zoomIn && k > opts.zoomOut)) return;
		} else {
			return;
		}
	}

	let svg = d3.select("#"+opts.targetDiv).select("svg");
	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(x, y);
    svg.transition().duration(300).call(zoom.transform, transform); 	// apply new zoom transform:
}

function round(f) {
	return Math.round(f*10000)/10000;
}

export function scale_to_fit(opts) {
	let d = get_dimensions(opts);
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	let wfull = svg.node().clientWidth,
	    hfull = svg.node().clientHeight;
	let f = (wfull-opts.symbol_size*2)/wfull;
	let k = round(f / Math.max(d.wid/wfull, d.hgt/hfull));

	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(-(xi*2*k), (yi*k));
    svg.transition().delay(200).duration(300).call(zoom.transform, transform); 	// apply new zoom transform:
}

function zooming(opts) {
	(opts.DEBUG && console.log("zoom", d3.event, d3.event.transform));
	let t = d3.event.transform;
	let k = (t.k && t.k !== 1 ? t.k : undefined);
	setposition(opts, t.x, t.y, k);
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	ped.attr('transform', 'translate(' + t.x + ',' + t.y + ')' + (k ? ' scale(' + k + ')' : ''));
}

// find width/height of pedigree graphic
function get_dimensions(opts) {
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
	return {wid: Math.abs(xmax-xmin), hgt: Math.abs(ymax-ymin)};
}
