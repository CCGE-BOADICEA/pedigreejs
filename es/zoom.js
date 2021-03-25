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

export function set_initial_xy(opts) {
	xi = opts.symbol_size/2;
	yi = -opts.symbol_size*2.5;
}

function get_bounds(ped, opts) {
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

function zoomFn(opts) {
	let t = d3.event.transform;
	if(d3.event.sourceEvent && d3.event.sourceEvent.type === 'mousemove') {
		let xyk = pedcache.getposition(opts);
		if(xyk.length == 3) t.k = xyk[2];
	}
	transform_pedigree(opts, t.x+(xi*t.k), t.y+(yi*t.k), t.k);
    return;
}

// scale size the pedigree
export function btn_zoom(opts, scale) {
	let xyk = pedcache.getposition(opts);  // cached position
	let k = (xyk.length == 3 ? xyk[2]*scale : 1*scale);
	let x = (xyk[0] !== null ? xyk[0] : xi)-(xi*k);
	let y = (xyk[1] !== null ? xyk[1] : yi)-(yi*k);

	if(k < opts.zoomIn || k > opts.zoomOut) {
		if(xyk.length == 3) {
			let ck = xyk[2];
			let zoomOut = (k < ck);
			if(zoomOut  && k < opts.zoomIn) return;
			if(!zoomOut && k > opts.zoomOut) return;
		} else {
			return;
		}
	}

	let svg = d3.select("#"+opts.targetDiv).select("svg");
	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(x, y);
    svg.transition().duration(700).call(zoom.transform, transform); 	// apply new zoom transform:
}

export function zoom_to_fit(opts) {
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	let bounds = get_bounds(ped, opts);
	let w = bounds.xmax-bounds.xmin,
	    h = bounds.ymax-bounds.ymin;
	
	let svg = d3.select("#"+opts.targetDiv).select("svg");
	let wfull = svg.node().clientWidth,
	    hfull = svg.node().clientHeight;
	let k = 0.90 / Math.max(w/wfull, h/hfull);
	//let midX = w / 2,
	//    midY = h / 2;
	//let x = (wfull/2) - (k * midX);
	//let y = (hfull/2) - (k * midY);

	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
      .scale(k) 
      .translate(-opts.symbol_size*1.5*k, 0);
    svg.transition().duration(700).call(zoom.transform, transform); 	// apply new zoom transform:
}

//export function center(opts) {
//	let svg = d3.select("#"+opts.targetDiv).select("svg");
//	var transform = d3.zoomIdentity 		// new zoom transform (using d3.zoomIdentity as a base)
//      .translate(0, 0);
//    svg.transition().duration(700).call(zoom.transform, transform); 	// apply new zoom transform:
//}

function transform_pedigree(opts, x, y, k) {
	pedcache.setposition(opts, x, y, (k !== 1 ? k : undefined));
	let ped = d3.select("#"+opts.targetDiv).select(".diagram");
	ped.attr('transform', 'translate(' + x + ',' + y + ') scale(' + k + ')');
}
