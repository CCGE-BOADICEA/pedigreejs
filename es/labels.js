import {prefixInObj} from './pedigree_utils.js';

export function addLabels(opts, node) {
	// names of individuals
	addLabel(opts, node, -(0.4 * opts.symbol_size), -(0.1 * opts.symbol_size),
			function(d) {
				if(opts.DEBUG)
					return ('display_name' in d.data ? d.data.display_name : d.data.name) + '  ' + d.data.id;
				return 'display_name' in d.data ? d.data.display_name : '';}, undefined, ['display_name']);

	let font_size = parseInt(getPx(opts)) + 4;
	// display age/yob label first
	for(let ilab=0; ilab<opts.labels.length; ilab++) {
		let label = opts.labels[ilab];
		let arr = (Array.isArray(label) ? label : [label]);
		if(arr.indexOf('age') > -1 || arr.indexOf('yob') > -1) {
			addLabel(opts, node, -opts.symbol_size,
				function(d) { return ypos(d, arr, font_size); },
				function(d) { return get_text(d, arr); }, 'indi_details', arr);
		}
	}

	// individuals disease details
	for(let i=0;i<opts.diseases.length; i++) {
		let disease = opts.diseases[i].type;
		addLabel(opts, node, -opts.symbol_size,
				function(d) { return ypos(d, [disease], font_size); },
				function(d) {
					let dis = disease.replace('_', ' ').replace('cancer', 'ca.');
					return disease+'_diagnosis_age' in d.data ? dis +": "+ d.data[disease+'_diagnosis_age'] : '';
				}, 'indi_details', [disease]);
	}

	// display other labels defined in opts.labels e.g. alleles/genotype data
	for(let ilab=0; ilab<opts.labels.length; ilab++) {
		let label = opts.labels[ilab];
		let arr = (Array.isArray(label) ? label : [label]);
		if(arr.indexOf('age') === -1 && arr.indexOf('yob') === -1) {
			addLabel(opts, node, -opts.symbol_size,
				function(d) { return ypos(d, arr, font_size); },
				function(d) { return get_text(d, arr); }, 'indi_details', arr);
		}
	}
}

function get_text(d, arr) {
	let txt = "";
	for(let l=0; l<arr.length; l++) {
		let this_label = arr[l];
		if(d.data[this_label]) {
			if(this_label === 'alleles') {
				let vars = d.data.alleles.split(';');
				for(let ivar = 0;ivar < vars.length;ivar++) {
					if(vars[ivar] !== "") txt += vars[ivar] + ';';
				}
			} else if(this_label === 'age') {
				txt += d.data[this_label] +'y ';
			} else if(this_label === 'stillbirth') {
				txt += "SB";
			} else if(this_label.match("_gene_test$") && 'result' in d.data[this_label]) {
				let r = d.data[this_label]['result'].toUpperCase();
				//let t = d.data[this_label]['type'];
				if(r !== "-") {
					txt += this_label.replace('_gene_test', '').toUpperCase()
					txt += (r === 'P' ? '+ ' : (r === 'N' ? '- ' : ' '));
				}
			} else if(this_label.match("_bc_pathology$")) {
				let r = d.data[this_label].toUpperCase();
				txt += this_label.replace('_bc_pathology', '').toUpperCase()
				txt += (r === 'P' ? '+ ' : (r === 'N' ? '- ' : ' '));
			} else {
			  txt += d.data[this_label];
			}
		}
	}
	if(txt !== "") return txt;
}

function ypos(d, arr, font_size) {
	if(!node_has_label(d, arr)) return;
	d.y_offset = (!d.y_offset ? font_size*2.35 : d.y_offset+font_size);
	return d.y_offset;
}

function node_has_label(d, labels) {
	for(let l=0; l<labels.length; l++) {
		if(prefixInObj(labels[l], d.data)) return true;
	}
	return false;
}

// add label to node
function addLabel(opts, node, fx, fy, ftext, class_label, labels) {
	node.filter(function (d) {
		return !d.data.hidden && (!labels || node_has_label(d, labels));
	}).append("text")
	.attr("class", (class_label ? class_label + ' ped_label' : 'ped_label'))
	.attr("x", fx)
	.attr("y", fy)
	.attr("font-family", opts.font_family)
	.attr("font-size", opts.font_size)
	.attr("font-weight", opts.font_weight)
	.text(ftext);
}

// get height in pixels
function getPx(opts){
	let emVal = opts.font_size;
	if (emVal === parseInt(emVal, 10)) // test if integer
		return emVal;

	if(emVal.indexOf("px") > -1)
		return emVal.replace('px', '');
	else if(emVal.indexOf("em") === -1)
		return emVal;
	emVal = parseFloat(emVal.replace('em', ''));
	return (parseFloat(getComputedStyle($('#'+opts.targetDiv).get(0)).fontSize)*emVal)-1.0;
}
