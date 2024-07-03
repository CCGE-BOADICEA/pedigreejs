import  * as utils from './utils.js';
import {current as pedcache_current} from './pedcache.js';
import {rebuild} from './pedigree.js';


// initialise node dragging - SHIFT + DRAG
export function init_dragging(opts, node) {
	// add drag
	node.filter(function (d) {return !d.data.hidden;})
	    .call(d3.drag()
	    		.filter(function filter(event) { 
					return !event.ctrlKey && !event.button && event.shiftKey; 	// shift and drag
				})
                .on("start", dragstart)
                .on("drag", drag)
                .on("end", dragstop));

	let xstart;
	let xnew;
    function dragstart() {
		xstart = d3.select(this).select('.indi_rect').attr('x');
	}
	
	function drag(e) {
		e.sourceEvent.stopPropagation();
		let dx = e.dx;
 		let indir = d3.select(this).select('.indi_rect');
 		xnew = parseFloat(indir.attr('x'))+ dx;
        indir.attr("x", xnew);
	}
	
	function dragstop(_d) {
		let me = d3.select(this).datum().data;
		let pnrs = utils.get_partners(opts.dataset, me);
		let pnrName = (pnrs.length === 1 ? utils.get_partners(opts.dataset, me)[0] : -1);

		let indir = d3.select(this).select('.indi_rect');
		indir.attr("x", xstart);

        let newdataset = utils.copy_dataset(pedcache_current(opts));
        let idx = utils.getIdxByName(newdataset, me.name)
        array_move(newdataset, idx, newdataset.length-1);
        if(pnrName !== -1) {
        	idx = utils.getIdxByName(newdataset, pnrName)
        	array_move(newdataset, idx, newdataset.length-1);
        }

        opts.dataset = newdataset;
        rebuild(opts);
	}
}

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};
