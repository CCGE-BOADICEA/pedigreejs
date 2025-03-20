/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// pedigree I/O
import * as utils from './utils.js';
import * as pedcache from './pedcache.js';
import {readCanRisk, cancers, genetic_test1, pathology_tests} from './canrisk_file.js';
import {get_bounds} from './zoom.js';


export function addIO(opts) {
	$('#load').on('change', function(e) {
		load(e, opts);
	});

	$('#save').on('click', function() {
		save(opts);
	});

	$('#print').on('click', function() {
		print(get_printable_svg(opts));
	});

	$('#svg_download').on('click', function() {
		svg_download(get_printable_svg(opts));
	});

	$('#png_download, .fa-file-image').on('click', function() {
		let resolution = 4;
		img_download(opts, resolution, "image/png");
	});
}

/**
 * Get object from array by the name attribute.
 */
function getByName(arr, name) {
	return $.grep(arr, function(o){ return o && o.name === name; })[0];
}

/**
 * Provide font style to svg
 */
function copyStylesInline(destinationNode, sourceNode) {
	let containerElements = ["svg","g"];
	let destChildNodes = destinationNode.childNodes;
	let srcChildNodes = sourceNode.childNodes;
	for (let cd = 0; cd < destChildNodes.length; cd++) {
		let child = destChildNodes[cd];
		if (containerElements.indexOf(child.tagName) !== -1) {
			copyStylesInline(child, srcChildNodes[cd]);
			continue;
		}
		try {
			let style = srcChildNodes[cd].currentStyle || window.getComputedStyle(srcChildNodes[cd]);
			if (style === "undefined" || style === null) continue;

			let styleLength = style.length;
			let childStyle = child.style;
			for (let st = 0; st < styleLength; st++){
				let mySt = style[st];
				if(mySt.indexOf("text-") > -1 || mySt.indexOf("font-") > -1) childStyle.setProperty(mySt, style.getPropertyValue(mySt));
			}
		} catch(err) { continue; }
   }
}

/**
 * Export pedigree as image, e.g. PNG
 */
export function img_download(opts, resolution, img_type) {
	let deferred = svg2img($('#'+opts.targetDiv).find('svg'), "pedigree", {resolution: resolution, img_type: img_type});
	$.when.apply($,[deferred]).done(function() {
		let obj = getByName(arguments, "pedigree");
		if(utils.isEdge() || utils.isIE()) {
			let html="<img src='"+obj.img+"' alt='canvas image'/>";
			let newTab = window.open();		// pop-ups need to be enabled
			newTab.document.write(html);
		} else {
			let a	  = document.createElement('a');
			a.href	 = obj.img;
			a.download = 'plot.png';
			a.target   = '_blank';
			document.body.appendChild(a); a.click(); document.body.removeChild(a);
		}
	});
}

/** Get SVG data URL from svg element */
function get_svg_as_data_url(svg) {
	let svgCopy = svg.get(0).cloneNode(true);
	// remove unused elements
	d3.select(svgCopy).selectAll("text").filter(function(){
		 return d3.select(this).text().length === 0 || 
		        d3.select(this), d3.select(this).attr('font-family') === "FontAwesome"
	 }).remove();
	copyStylesInline(svgCopy, svg.get(0));
	let svgStr = (new XMLSerializer()).serializeToString(svgCopy);
	return 'data:image/svg+xml;base64,'+ window.btoa(unescape(encodeURIComponent(svgStr))); // convert SVG string to data URL
}
/**
 * Given a SVG document element convert to image (e.g. jpeg, png - default png).
 */
export function svg2img(svg, deferred_name, options) {
	let defaults = {iscanvg: false, resolution: 1, img_type: "image/png"};
	if(!options) options = defaults;
	$.each(defaults, function(key, value) {
		if(!(key in options)) {options[key] = value;}
	});

	let deferred = $.Deferred();
	let imgsrc = get_svg_as_data_url(svg); // convert SVG string to data URL
	let canvas = document.createElement("canvas");
	canvas.width = svg.width()*options.resolution;
	canvas.height = svg.height()*options.resolution;
	let context = canvas.getContext("2d");
	// provide a white background
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);
	
	let img = document.createElement("img");
	img.onload = function() {
		context.drawImage(img, 0, 0, canvas.width, canvas.height);
		console.log(deferred_name, options.img_type);
		deferred.resolve(
			{'name': deferred_name,
			'resolution': options.resolution,
			'img':canvas.toDataURL(options.img_type, 1),
			'w':canvas.width,
			'h':canvas.height});
		context.clearRect(0, 0, canvas.width, canvas.height);
	};
	img.src = imgsrc;
	return deferred.promise();
}

function getMatches(str, myRegexp) {
	let matches = [];
	let c = 0;
	myRegexp.lastIndex = 0;
	let match = myRegexp.exec(str);
	while (match) {
		c++;
		if(c > 400) {
			console.error("getMatches: counter exceeded 400");
			return -1;
		}
		matches.push(match);
		if (myRegexp.lastIndex === match.index) {
			myRegexp.lastIndex++;
		}
		match = myRegexp.exec(str);
	}
	return matches;
}

// find all url's to make unique
function unique_urls(svg_html) {
	let matches = getMatches(svg_html, /url\((&quot;|"|'){0,1}#(.*?)(&quot;|"|'){0,1}\)/g);
	if(matches === -1)
		return "ERROR DISPLAYING PEDIGREE"

	$.each(matches, function(_index, match) {
		let quote = (match[1] ? match[1] : "");
		let val = match[2];
		let m1 = "id=\"" + val + "\"";
		let m2 = "url\\(" + quote + "#" + val + quote + "\\)";

		let newval = val+utils.makeid(2);
		svg_html = svg_html.replace(new RegExp(m1, 'g'), "id=\""+newval+"\"" );
		svg_html = svg_html.replace(new RegExp(m2, 'g'), "url(#"+newval+")" );
   });
	return svg_html;
}

// return a copy pedigree svg
export function copy_svg(opts) {
	let svg_node = get_printable_svg(opts);
	let d3obj = d3.select(svg_node.get(0));

	// remove unused elements
	d3obj.selectAll("text")
	  .filter(function(){
		return d3.select(this).text().length === 0 || d3.select(this), d3.select(this).attr('font-family') === "FontAwesome"
	  }).remove();
	return $(unique_urls(svg_node.html()));
}

// get printable svg div, adjust size to tree dimensions and scale to fit
function get_printable_svg(opts) {
	let local_dataset = pedcache.current(opts); // get current dataset
	if (local_dataset !== undefined && local_dataset !== null) {
		opts.dataset = local_dataset;
	}

	let svg_div = $('<div></div>');  				// create a new div
	let svg = $('#'+opts.targetDiv).find('svg').clone().appendTo(svg_div);

	let a4 = {w: (595-40), h: (842-50)};
	
	let b = get_bounds(opts);
	let d = {w: Math.abs(b.xmax-b.xmin), h: Math.abs(b.ymax-b.ymin)};
	let f = 1;
	let k = (f / Math.max(d.w/a4.w, d.h/a4.h));

	let xi = -(b.xmin-(opts.symbol_size))*k;
	let yi = -(b.ymin-(opts.symbol_size))*k;

	svg.attr('width', a4.w);
	svg.attr('height', d.h*k);	

	svg.find(".diagram").attr("transform", "translate("+xi+", "+yi+") scale("+k+")");
	return svg_div;
}

// download the SVG to a file
export function svg_download(svg){
	let a	   = document.createElement('a');
	a.href	   = get_svg_as_data_url(svg);
	a.download = 'plot.svg';
	a.target   = '_blank';
	document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// open print window for a given element
export function print(el, id){
	if(el.constructor !== Array)
		el = [el];

	let width = $(window).width()*0.9;
	let height = $(window).height()-10;
	let cssFiles = [
		'/static/css/canrisk.css',
		'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'
	];
	let printWindow = window.open('', 'PrintMap', 'width=' + width + ',height=' + height);
	let headContent = '';
	for(let i=0; i<cssFiles.length; i++)
		headContent += '<link href="'+cssFiles[i]+'" rel="stylesheet" type="text/css" media="all">';
	headContent += "<style>body {font-size: " + $("body").css('font-size') + ";}</style>";

	let html = "";
	for(let i=0; i<el.length; i++) {
		if(i === 0 && id)
			html += id;
		html += $(el[i]).html();
		if(i < el.length-1)
			html += '<div class="page-break"> </div>';
	}

	printWindow.document.write(headContent);
	printWindow.document.write(html);
	printWindow.document.close();

	printWindow.focus();
	setTimeout(function() {
		printWindow.print();
		printWindow.close();
	}, 300);
}

// save content to a file
export function save_file(opts, content, filename, type){
	if(opts.DEBUG)
		console.log(content);
	if(!filename) filename = "ped.txt";
	if(!type) type = "text/plain";

   let file = new Blob([content], {type: type});
   if (window.navigator.msSaveOrOpenBlob) 	// IE10+
	   window.navigator.msSaveOrOpenBlob(file, filename);
   else { 									// other browsers
	   let a = document.createElement("a");
	   let url = URL.createObjectURL(file);
	   a.href = url;
	   a.download = filename;
	   document.body.appendChild(a);
	   a.click();
	   setTimeout(function() {
		   document.body.removeChild(a);
		   window.URL.revokeObjectURL(url);
		}, 0);
	}
}

function save(opts){
	let content = JSON.stringify(pedcache.current(opts));
	save_file(opts, content);
}

function canrisk_validation(opts) {
	$.each(opts.dataset, function(_idx, p) {
		if(!p.hidden && p.sex === 'M' && !utils.isProband(p)) {
			if(p[cancers['breast_cancer2']]) {
				let msg = 'Male family member ('+p.display_name+') with contralateral breast cancer found. '+
						  'Please note that as the risk models do not take this into account the second '+
						  'breast cancer is ignored.'
				console.error(msg);
				delete p[cancers['breast_cancer2']];
				utils.messages("Warning", msg);
			}
		}
	});
}

/** Read and load pedigree data string */
export function load_data(d, opts) {
	if(opts.DEBUG) console.log(d);
	let risk_factors;
	try {
		if(d.indexOf("BOADICEA import pedigree file format 4.0") === 0) {
			opts.dataset = readBoadiceaV4(d, 4);
			canrisk_validation(opts);
		} else if(d.indexOf("BOADICEA import pedigree file format 2.0") === 0) {
			opts.dataset = readBoadiceaV4(d, 2);
			canrisk_validation(opts);
		} else if(d.indexOf("##") === 0 && d.indexOf("CanRisk") !== -1) {
			let canrisk_data = readCanRiskFile(d);
			risk_factors = canrisk_data[0];
			opts.dataset = canrisk_data[1];
			canrisk_validation(opts);
		} else {
			try {
				let ped = JSON.parse(d);
				let to_process = true;
				for(let i=0;i<ped.length;i++) {
					if(ped[i].top_level) {
						to_process = false;
					}
				}
				opts.dataset = (to_process ? process_ped(ped) : ped);
			} catch(err) {
				opts.dataset = readLinkage(d);
			}
		}
		utils.validate_pedigree(opts);
	} catch(err1) {
		console.error(err1, d);
		utils.messages("File Error", ( err1.message ? err1.message : err1));
		return;
	}
	if(opts.DEBUG) console.log(opts.dataset);
	try{
		pedcache.setposition(opts);		// clear position
		$(document).trigger('rebuild', [opts]);
		console.log(risk_factors);
		// load risk factors - fire riskfactorChange event
		$(document).trigger('riskfactorChange', [opts, risk_factors]);
		$(document).trigger('fhChange', [opts]); 	// trigger fhChange event
	
		try {
			// update FH section
			acc_FamHist_ticked();				// eslint-disable-line no-undef
			acc_FamHist_Leave();				// eslint-disable-line no-undef
			RESULT.FLAG_FAMILY_MODAL = true;	// eslint-disable-line no-undef
		} catch(err3) {
			// ignore error
		}
	} catch(err2) {
		utils.messages("File Error", ( err2.message ? err2.message : err2));
	}
}

function load(e, opts) {
	let f = e.target.files[0];
	if(f) {
		let reader = new FileReader();
		reader.onload = function(e) {
			load_data(e.target.result, opts);
		};
		reader.onerror = function() {
			utils.messages("File Error", "File could not be read! Code " + reader.error);
		};
		reader.readAsText(f);
	} else {
		console.error("File could not be read!");
	}
	$("#load")[0].value = ''; // reset value
}

//
// https://www.cog-genomics.org/plink/1.9/formats#ped
// https://www.cog-genomics.org/plink/1.9/formats#fam
//	1. Family ID ('FID')
//	2. Within-family ID ('IID'; cannot be '0')
//	3. Within-family ID of father ('0' if father isn't in dataset)
//	4. Within-family ID of mother ('0' if mother isn't in dataset)
//	5. Sex code ('1' = male, '2' = female, '0' = unknown)
//	6. Phenotype value ('1' = control, '2' = case, '-9'/'0'/non-numeric = missing data if case/control)
//  7. Genotypes (column 7 onwards);
//	 columns 7 & 8 are allele calls for first variant ('0' = no call); colummns 9 & 10 are calls for second variant etc.
export function readLinkage(boadicea_lines) {
	let lines = boadicea_lines.trim().split('\n');
	let ped = [];
	let famid;
	for(let i = 0;i < lines.length;i++){
	   let attr = $.map(lines[i].trim().split(/\s+/), function(val, _i){return val.trim();});
	   if(attr.length < 5)
		   throw new Error('unknown format');
	   let sex = (attr[4] === '1' ? 'M' : (attr[4] === '2' ? 'F' : 'U'));
	   let indi = {
			'famid': attr[0],
			'display_name': attr[1],
			'name':	attr[1],
			'sex': sex
		};
		if(attr[2] !== "0") indi.father = attr[2];
		if(attr[3] !== "0") indi.mother = attr[3];

		if (typeof famid != 'undefined' && famid !== indi.famid) {
			console.error('multiple family IDs found only using famid = '+famid);
			break;
		}
		if(attr[5] === "2") indi.affected = 2;
		// add genotype columns
		if(attr.length > 6) {
			indi.alleles = "";
			for(let j=6; j<attr.length; j+=2) {
				indi.alleles += attr[j] + "/" + attr[j+1] + ";";
			}
		}

		ped.unshift(indi);
		famid = attr[0];
	}
	return process_ped(ped);
}

export function readCanRiskFile(boadicea_lines) {
	let [hdr, ped] = readCanRisk(boadicea_lines);
	try {
		return [hdr, process_ped(ped)];
	} catch(e) {
		console.error(e);
		return [hdr, ped];
	}
}

// read boadicea format v4 & v2
export function readBoadiceaV4(boadicea_lines, version) {
	let lines = boadicea_lines.trim().split('\n');
	let ped = [];
	// assumes two line header
	for(let i = 2;i < lines.length;i++){
	   let attr = $.map(lines[i].trim().split(/\s+/), function(val, _i){return val.trim();});
		if(attr.length > 1) {
			let indi = {
				'famid': attr[0],
				'display_name': attr[1],
				'name':	attr[3],
				'sex': attr[6],
				'status': attr[8]
			};
			if(attr[2] === "1") indi.proband = true;
			if(attr[4] !== "0") indi.father = attr[4];
			if(attr[5] !== "0") indi.mother = attr[5];
			if(attr[7] !== "0") indi.mztwin = attr[7];
			if(attr[9] !== "0") indi.age = attr[9];
			if(attr[10] !== "0") indi.yob = attr[10];

			let idx = 11;
			$.each(cancers, function(_cancer, diagnosis_age) {
				// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
				if(attr[idx] !== "0") {
					indi[diagnosis_age] = attr[idx];
				}
				idx++;
			});

			if(version === 4) {
				if(attr[idx++] !== "0") indi.ashkenazi = 1;
				// BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
				// type, 0 = untested, S = mutation search, T = direct gene test
				// result, 0 = untested, P = positive, N = negative
				for(let j=0; j<5; j++) {
					idx+=2;
					if(attr[idx-2] !== '0') {
						if((attr[idx-2] === 'S' || attr[idx-2] === 'T') && (attr[idx-1] === 'P' || attr[idx-1] === 'N'))
							indi[genetic_test1[j] + '_gene_test'] = {'type': attr[idx-2], 'result': attr[idx-1]};
						else
							console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + attr[idx-2] + " " + attr[idx-1]);
					}
				}
			} else if (version === 2) {
				// genetic test BRCA1, BRCA2
				// type, 0 = untested, S = mutation search, T = direct gene test
				// result, 0 = untested, N = no mutation, 1 = BRCA1 positive, 2 = BRCA2 positive, 3 = BRCA1/2 positive
				idx+=2; 	// gtest
				if(attr[idx-2] !== '0') {
					if((attr[idx-2] === 'S' || attr[idx-2] === 'T')) {
						if(attr[idx-1] === 'N') {
							indi['brca1_gene_test'] = {'type': attr[idx-2], 'result': 'N'};
							indi['brca2_gene_test'] = {'type': attr[idx-2], 'result': 'N'};
						} else if(attr[idx-1] === '1') {
							indi['brca1_gene_test'] = {'type': attr[idx-2], 'result': 'P'};
							indi['brca2_gene_test'] = {'type': attr[idx-2], 'result': 'N'};
						} else if(attr[idx-1] === '2') {
							indi['brca1_gene_test'] = {'type': attr[idx-2], 'result': 'N'};
							indi['brca2_gene_test'] = {'type': attr[idx-2], 'result': 'P'};
						} else if(attr[idx-1] === '3') {
							indi['brca1_gene_test'] = {'type': attr[idx-2], 'result': 'P'};
							indi['brca2_gene_test'] = {'type': attr[idx-2], 'result': 'P'};
						}
					} else {
						console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + attr[idx-2] + " " + attr[idx-1]);
					}
				}
				if(attr[idx++] !== "0") indi.ashkenazi = 1;
			}

			// status, 0 = unspecified, N = negative, P = positive
			for(let j=0; j<pathology_tests.length; j++) {
				if(attr[idx] !== '0') {
					if(attr[idx] === 'N' || attr[idx] === 'P')
						indi[pathology_tests[j] + '_bc_pathology'] = attr[idx];
					else
						console.warn('UNRECOGNISED PATHOLOGY ON LINE '+ (i+1) + ": " +pathology_tests[j] + " " +attr[idx]);
				}
				idx++;
			}
			ped.unshift(indi);
		}
	}

	try {
		return process_ped(ped);
	} catch(e) {
		console.error(e);
		return ped;
	}
}

function process_ped(ped) {
	// find the level of individuals in the pedigree
	for(let j=0;j<2;j++) {
		for(let i=0;i<ped.length;i++) {
			getLevel(ped, ped[i].name);
		}
	}

	fix_n_balance_levels(ped);

	// find the max level (i.e. top_level)
	let max_level = 0;
	for(let i=0;i<ped.length;i++) {
		if(ped[i].level && ped[i].level > max_level)
			max_level = ped[i].level;
	}

	// identify top_level and other nodes without parents
	for(let i=0;i<ped.length;i++) {
		if(utils.getDepth(ped, ped[i].name) === 1) {
			if(ped[i].level && ped[i].level === max_level) {
				ped[i].top_level = true;
			} else {
				ped[i].noparents = true;

				// 1. look for partners parents
				let pidx = getPartnerIdx(ped, ped[i]);
				if(pidx > -1) {
					if(ped[pidx].mother) {
						ped[i].mother = ped[pidx].mother;
						ped[i].father = ped[pidx].father;
					}
				}

				// 2. or adopt parents from level above
				if(!ped[i].mother){
					for(let j=0; j<ped.length; j++) {
						if(ped[i].level === (ped[j].level-1)) {
							pidx = getPartnerIdx(ped, ped[j]);
							if(pidx > -1 && i !== pidx) {
								ped[i].mother = (ped[j].sex === 'F' ? ped[j].name : ped[pidx].name);
								ped[i].father = (ped[j].sex === 'M' ? ped[j].name : ped[pidx].name);
								break;
							}
						}
					}
				}
			}
		} else {
			delete ped[i].top_level;
		}
	}
	return ped;
}

// get the partners for a given node
function getPartnerIdx(dataset, anode) {
	for(let i=0; i<dataset.length; i++) {
		let bnode = dataset[i];
		if(anode.name === bnode.mother)
			return utils.getIdxByName(dataset, bnode.father);
		else if(anode.name === bnode.father)
			return utils.getIdxByName(dataset, bnode.mother);
	}
	return -1;
}

// for a given individual assign levels to a parents ancestors
function getLevel(dataset, name) {
	let idx = utils.getIdxByName(dataset, name);
	let level = (dataset[idx].level ? dataset[idx].level : 0);
	update_parents_level(idx, level, dataset);
}

// recursively update parents levels
function update_parents_level(idx, level, dataset) {
	let parents = ['mother', 'father'];
	level++;
	for(let i=0; i<parents.length; i++) {
		let pidx = utils.getIdxByName(dataset, dataset[idx][parents[i]]);
		if(pidx >= 0) {
			let ma = dataset[utils.getIdxByName(dataset, dataset[idx].mother)];
			let pa = dataset[utils.getIdxByName(dataset, dataset[idx].father)];
			if(!dataset[pidx].level || dataset[pidx].level < level) {
				ma.level = level;
				pa.level = level;
			}

			if(ma.level < pa.level) {
				ma.level = pa.level;
			} else if(pa.level < ma.level) {
				pa.level = ma.level;
			}
			update_parents_level(pidx, level, dataset);
		}
	}
}

// for a pedigree fix the levels of children nodes to be consistent with parent
function fix_n_balance_levels(ped) {
	let updated = false;
	let l = ped.length;

	for(let i=0;i<l;i++) {
		let children = utils.getChildren(ped, ped[i]);
		let prt_lvl = ped[i].level;
		for(let j=0;j<children.length;j++){
			if(prt_lvl - children[j].level > 1) {
				children[j].level = prt_lvl-1;
				let ptrs = utils.get_partners(ped, children[j]);

				for(let k=0;k<ptrs.length;k++){
					let p = utils.getNodeByName(ped, ptrs[k])
					p.level = prt_lvl-1;

					let m = utils.getNodeByName(ped, p.mother);
					let f = utils.getNodeByName(ped, p.father);
					if(m) m.level = prt_lvl;
					if(f) f.level = prt_lvl;
				}
				updated = true;
			}
		}
	}
	return updated;
}
