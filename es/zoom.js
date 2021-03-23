import * as pedcache from './pedcache.js';

let zoom, xi, yi;

// zoom and drag
export function get_zoom(opts) {
	zoom = d3.zoom()
	  .scaleExtent([opts.zoomIn, opts.zoomOut])
	  .filter(function() {
			if(d3.event.type === 'dblclick') return false;
			if(!opts.zoomSrc || opts.zoomSrc.indexOf('wheel') === -1) {
				if(d3.event.type && d3.event.type === 'wheel') return false
			}
			console.log("zoom", d3.event.type, d3.event);
			return  true})
	  .on('zoom', function() { zoomFn(opts) });
	return zoom;	  
}

export function set_initial_xy(x, y) {
	xi = x;
	yi = y;
}

function zoomFn(opts) {
	let t = d3.event.transform;
	if(d3.event.sourceEvent && d3.event.sourceEvent.type === 'mousemove') {
		let xyk = pedcache.getposition(opts);
		if(xyk.length == 3) t.k = xyk[2];
	}
    transform_pedigree(opts, t.x+xi, t.y+yi, t.k);
    return;
}

// scale size the pedigree or optionally set x, y and k
export function zoom_pedigree(opts, scale, x, y, k) {
	if(!x) {
		let xyk = pedcache.getposition(opts);  // cached position
		x = (xyk[0] !== null ? xyk[0] : xi);
		y = (xyk[1] !== null ? xyk[1] : yi);
		if(!k) k = (xyk.length == 3 ? xyk[2]*scale : 1*scale);
	}

	if(k < opts.zoomIn || k > opts.zoomOut) return;

	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(x-xi, y-yi);
    ped.transition().duration(700).call(zoom.transform, transform); 	// apply new zoom transform:
}

function transform_pedigree(opts, x, y, k) {
	pedcache.setposition(opts, x, y, (k !== 1 ? k : undefined));
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	ped.attr('transform', 'translate(' + x + ',' + y + ') scale(' + k + ')');
}
