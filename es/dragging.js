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

		// reset individuals rectangle
		let indir = d3.select(this).select('.indi_rect');
		indir.attr("x", xstart);
		
		console.log("START "+xstart, "END "+xnew);
		
		const isMovingRight = (xnew>xstart);
		
		// get depth of node being dragged
		let root = utils.roots[opts.targetDiv];
		let flat_tree = utils.flatten(root);
		let meNode = utils.getNodeByName(flat_tree, me.name);
		
		// nodes at same depth
		let dnodes = utils.getNodesAtDepth(utils.flatten(root), meNode.depth);
		let adj_node;
		xnew+=meNode.x;
		for(let i=0; i<dnodes.length; i++) {
			console.log(dnodes[i].data.display_name, utils.getIdxByName(opts.dataset, dnodes[i].data.name), dnodes[i].x, xnew, meNode.x, (dnodes[i].x < xnew));
			if(isMovingRight) {
				if(dnodes[i].x < xnew)
					adj_node = dnodes[i];
			} else if(dnodes[i].x > xnew) {
				adj_node = dnodes[i];
			}
		}
		if(adj_node === undefined) return;
		let adjIdx = utils.getIdxByName(opts.dataset, adj_node.data.name)+(isMovingRight? 1: -1);
		console.log("ADJACENT NODE DISPLAY NAME", adj_node.data.display_name, adjIdx, indir, isMovingRight);

        let newdataset = utils.copy_dataset(pedcache_current(opts));
        let idx = utils.getIdxByName(newdataset, me.name);

        array_move(newdataset, idx, adjIdx);
        if(pnrName !== -1 && pnrName !== adj_node.data.name) {
        	idx = utils.getIdxByName(newdataset, pnrName);
        	array_move(newdataset, idx, adjIdx);
        }

       	/*for(let i=0; i<dnodes.length; i++) {
			console.log(dnodes[i].data.display_name, utils.getIdxByName(newdataset, dnodes[i].data.name), newdataset);
		}*/
        opts.dataset = newdataset;
        rebuild(opts);
	}
}

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
		console.log("XXXXXXXXX", new_index, arr.length);
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};
