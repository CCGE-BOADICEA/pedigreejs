// pedigree I/O
import * as pedigree_util from './pedigree_utils.js';
import * as pedcache from './pedcache.js';
import {get_tree_dimensions, validate_pedigree, rebuild} from './pedigree.js';

// cancers, genetic & pathology tests
export let cancers = {
		'breast_cancer': 'breast_cancer_diagnosis_age',
		'breast_cancer2': 'breast_cancer2_diagnosis_age',
		'ovarian_cancer': 'ovarian_cancer_diagnosis_age',
		'prostate_cancer': 'prostate_cancer_diagnosis_age',
		'pancreatic_cancer': 'pancreatic_cancer_diagnosis_age'
	};
export let genetic_test = ['brca1', 'brca2', 'palb2', 'atm', 'chek2', 'rad51d',	'rad51c', 'brip1'];
export let pathology_tests = ['er', 'pr', 'her2', 'ck14', 'ck56'];

// get breast and ovarian PRS values
export function get_prs_values() {
	let prs = {};
	if(hasInput("breast_prs_a") && hasInput("breast_prs_z")) {
		prs['breast_cancer_prs'] = {
			'alpha': parseFloat($('#breast_prs_a').val()),
			'zscore': parseFloat($('#breast_prs_z').val()),
			'percent': parseFloat($('#breast_prs_percent').val())
		};
	}
	if(hasInput("ovarian_prs_a") && hasInput("ovarian_prs_z")) {
		prs['ovarian_cancer_prs'] = {
			'alpha': parseFloat($('#ovarian_prs_a').val()),
			'zscore': parseFloat($('#ovarian_prs_z').val()),
			'percent': parseFloat($('#ovarian_prs_percent').val())
		};
	}
	console.log(prs);
	return (isEmpty(prs) ? 0 : prs);
}

// check if input has a value
export function hasInput(id) {
	return $.trim($('#'+id).val()).length !== 0;
}

// return true if the object is empty
let isEmpty = function(myObj) {
    for(let key in myObj) {
        if (myObj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

export function get_surgical_ops() {
	let meta = "";
	if(!$('#A6_4_3_check').parent().hasClass("off")) {
		meta += ";OVARY2=y";
	}
	if(!$('#A6_4_7_check').parent().hasClass("off")) {
		meta += ";MAST2=y";
	}
	return meta;
};

export function add(opts) {
	$('#load').change(function(e) {
		load(e, opts);
	});

	$('#save').click(function(e) {
		save(opts);
	});

	$('#save_canrisk').click(function(e) {
		let meta = get_surgical_ops();
		try {
			let prs = get_prs_values();
	    	if(prs.breast_cancer_prs && prs.breast_cancer_prs.alpha !== 0 && prs.breast_cancer_prs.zscore !== 0) {
	    		meta += "\n##PRS_BC=alpha="+prs.breast_cancer_prs.alpha+",zscore="+prs.breast_cancer_prs.zscore;
	    	}
	    	
	    	if(prs.ovarian_cancer_prs && prs.ovarian_cancer_prs.alpha !== 0 && prs.ovarian_cancer_prs.zscore !== 0) {
	    		meta += "\n##PRS_OC=alpha="+prs.ovarian_cancer_prs.alpha+",zscore="+prs.ovarian_cancer_prs.zscore;
	    	}
		} catch(err) { console.warn("PRS", prs); }
		save_canrisk(opts, meta);
	});

	$('#print').click(function(e) {
		print(get_printable_svg(opts));
	});

	$('#svg_download').click(function(e) {
		svg_download(get_printable_svg(opts));
	});

	$('#png_download').click(function(e) {
		let deferred = svg2img($('svg'), "pedigree");
	    $.when.apply($,[deferred]).done(function() {
	    	let obj = getByName(arguments, "pedigree");
	        if(pedigree_util.isEdge() || pedigree_util.isIE()) {
	        	let html="<img src='"+obj.img+"' alt='canvas image'/>";
		        let newTab = window.open();
		        newTab.document.write(html);
	        } else {
				let a      = document.createElement('a');
				a.href     = obj.img;
				a.download = 'plot.png';
				a.target   = '_blank';
				document.body.appendChild(a); a.click(); document.body.removeChild(a);
	        }
	    });
	});
};

/**
 * Get object from array by the name attribute.
 */
function getByName(arr, name) {
	return $.grep(arr, function(o){ return o && o.name == name; })[0];
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

	// set SVG background to white - fix for jpeg creation
	if (svg.find(".pdf-white-bg").length === 0){
    	let d3obj = d3.select(svg.get(0));
    	d3obj.append("rect")
	        .attr("width", "100%")
	        .attr("height", "100%")
	        .attr("class", "pdf-white-bg")
	        .attr("fill", "white");
        d3obj.select(".pdf-white-bg").lower();
	}

	let deferred = $.Deferred();
	let svgStr;
    if (typeof window.XMLSerializer != "undefined") {
    	svgStr = (new XMLSerializer()).serializeToString(svg.get(0));
    } else if (typeof svg.xml != "undefined") {
    	svgStr = svg.get(0).xml;
    }

    let imgsrc = 'data:image/svg+xml;base64,'+ btoa(unescape(encodeURIComponent(svgStr))); // convert SVG string to data URL
	let canvas = document.createElement("canvas");
    canvas.width = svg.width()*options.resolution;
    canvas.height = svg.height()*options.resolution;
	let context = canvas.getContext("2d");
    let img = document.createElement("img");
    img.onload = function() {
        if(pedigree_util.isIE()) {
        	// change font so it isn't tiny
        	svgStr = svgStr.replace(/ font-size="\d?.\d*em"/g, '');
        	svgStr = svgStr.replace(/<text /g, '<text font-size="12px" ');
        	v = canvg.Canvg.fromString(context, svgStr, {
    			  scaleWidth: canvas.width,
    			  scaleHeight: canvas.height,
    			  ignoreDimensions: true
        	});
        	v.start();
        	console.log(deferred_name, options.img_type, "use canvg to create image");
        } else {
			context.drawImage(img, 0, 0, canvas.width, canvas.height);
			console.log(deferred_name, options.img_type);
		}
        deferred.resolve({'name': deferred_name, 'resolution': options.resolution, 'img':canvas.toDataURL(options.img_type, 1), 'w':canvas.width, 'h':canvas.height});
	};
	img.src = imgsrc;
	return deferred.promise();
}

function getMatches(str, myRegexp) {
    let matches = [];
    let match;
    let c = 0;
    myRegexp.lastIndex = 0;
    while (match = myRegexp.exec(str)) {
    	c++;
    	if(c > 400) {
    		console.error("getMatches: counter exceeded 800");
    		return -1;
    	}
        matches.push(match);
        if (myRegexp.lastIndex === match.index) {
        	myRegexp.lastIndex++;
        }
    }
    return matches;
}

// find all url's to make unique
function unique_urls(svg_html) {
    let matches = getMatches(svg_html, /url\((&quot;|"|'){0,1}\#(.*?)(&quot;|"|'){0,1}\)/g);
    if(matches === -1)
    	return "ERROR DISPLAYING PEDIGREE"

    $.each(matches, function(index, match) {
		let quote = (match[1] ? match[1] : "");
		let val = match[2];
		let m1 = "id=\"" + val + "\"";
		let m2 = "url\\(" + quote + "\#" + val + quote + "\\)";

		let newval = val+pedigree_util.makeid(2);
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
	d3obj.selectAll(".popup_selection, .indi_rect, .addsibling, .addpartner, .addchild, .addparents, .delete, .line_drag_selection").remove();
	d3obj.selectAll("text")
	  .filter(function(){
		 return d3.select(this).text().length === 0
	  }).remove();
	return $(unique_urls(svg_node.html()));
}

// get printable svg div, adjust size to tree dimensions and scale to fit
export function get_printable_svg(opts) {
	let local_dataset = pedcache.current(opts); // get current dataset
	if (local_dataset !== undefined && local_dataset !== null) {
		opts.dataset = local_dataset;
	}

	let tree_dimensions = get_tree_dimensions(opts);
	let svg_div = $('<div></div>');  				// create a new div
	let svg = $('#'+opts.targetDiv).find('svg').clone().appendTo(svg_div);
	if(opts.width < tree_dimensions.width || opts.height < tree_dimensions.height ||
	   tree_dimensions.width > 595 || tree_dimensions.height > 842) {
		let wid = tree_dimensions.width;
	    let hgt = tree_dimensions.height + 100;
	    let scale = 1.0;

	    if(tree_dimensions.width > 595 || tree_dimensions.height > 842) {   // scale to fit A4
	    	if(tree_dimensions.width > 595)  wid = 595;
	    	if(tree_dimensions.height > 842) hgt = 842;
	    	let xscale = wid/tree_dimensions.width;
	    	let yscale = hgt/tree_dimensions.height;
	    	scale = (xscale < yscale ? xscale : yscale);
	    }

	    svg.attr('width', wid);		// adjust dimensions
	    svg.attr('height', hgt);

	    let ytransform = (-opts.symbol_size*1.5*scale);
	    svg.find(".diagram").attr("transform", "translate(0, "+ytransform+") scale("+scale+")");
	}
	return svg_div;
};

// download the SVG to a file
export function svg_download(svg){
	let a      = document.createElement('a');
	a.href     = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svg.html() ) ) );
	a.download = 'plot.svg';
	a.target   = '_blank';
	document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

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

        /*let headContent2 = '';
        let links = document.getElementsByTagName('link');
        for(let i=0;i<links.length; i++) {
        	let html = links[i].outerHTML;
        	if(html.indexOf('href="http') !== -1)
        		headContent2 += html;
        }
        headContent2 += html;
        let scripts = document.getElementsByTagName('script');
        for(let i=0;i<scripts.length; i++) {
        	let html = scripts[i].outerHTML;
        	if(html.indexOf('src="http') !== -1)
        		headContent += html;
        }*/

    html = "";
    for(i=0; i<el.length; i++) {
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
};

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

export function save(opts){
	let content = JSON.stringify(pedcache.current(opts));
	save_file(opts, content);
};

export function save_canrisk(opts, meta){
	save_file(opts, run_prediction.get_non_anon_pedigree(pedcache.current(opts), meta), "canrisk.txt");
};

export function canrisk_validation(opts) {
	$.each(opts.dataset, function(idx, p) {
		if(!p.hidden && p.sex === 'M' && !pedigree_util.isProband(p)) {
			if(p[cancers['breast_cancer2']]) {
				let msg = 'Male family member ('+p.display_name+') with contralateral breast cancer found. '+
				          'Please note that as the risk models do not take this into account the second '+
				          'breast cancer is ignored.'
				console.error(msg);
				delete p[cancers['breast_cancer2']];
				pedigree_util.messages("Warning", msg);
			}
		}
	});
}

export function load(e, opts) {
    let f = e.target.files[0];
	if(f) {
		let reader = new FileReader();
		reader.onload = function(e) {
			if(opts.DEBUG)
				console.log(e.target.result);
			try {
				if(e.target.result.startsWith("BOADICEA import pedigree file format 4.0")) {
					opts.dataset = readBoadiceaV4(e.target.result, 4);
					canrisk_validation(opts);
				} else if(e.target.result.startsWith("BOADICEA import pedigree file format 2.0")) {
					opts.dataset = readBoadiceaV4(e.target.result, 2);
					canrisk_validation(opts);
				} else if(e.target.result.startsWith("##") && e.target.result.indexOf("CanRisk") !== -1) {
					let canrisk_data = readCanRiskV1(e.target.result);
					let risk_factors = canrisk_data[0];
					opts.dataset = canrisk_data[1];
					canrisk_validation(opts);
				} else {
					try {
						opts.dataset = JSON.parse(e.target.result);
					} catch(err) {
						opts.dataset = readLinkage(e.target.result);
				    }
				}
				validate_pedigree(opts);
			} catch(err1) {
				console.error(err1, e.target.result);
				pedigree_util.messages("File Error", ( err1.message ? err1.message : err1));
				return;
			}
			console.log(opts.dataset);
			try{
				rebuild(opts);
				if(risk_factors !== undefined) {
					console.log(risk_factors);
					// load risk factors - fire riskfactorChange event
					$(document).trigger('riskfactorChange', [opts, risk_factors]);
				}
				$(document).trigger('fhChange', [opts]); 	// trigger fhChange event

				try {
					// update FH section
					acc_FamHist_ticked();
					acc_FamHist_Leave();
					RESULT.FLAG_FAMILY_MODAL = true;
				} catch(err3) {}
			} catch(err2) {
				pedigree_util.messages("File Error", ( err2.message ? err2.message : err2));
			}
		};
		reader.onerror = function(event) {
			pedigree_util.messages("File Error", "File could not be read! Code " + event.target.error.code);
		};
		reader.readAsText(f);
	} else {
		console.error("File could not be read!");
	}
	$("#load")[0].value = ''; // reset value
};

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
//     columns 7 & 8 are allele calls for first variant ('0' = no call); colummns 9 & 10 are calls for second variant etc.
export function readLinkage(boadicea_lines) {
	let lines = boadicea_lines.trim().split('\n');
	let ped = [];
	let famid;
	for(let i = 0;i < lines.length;i++){
	   let attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim();});
	   if(attr.length < 5)
		   throw('unknown format');
	   let sex = (attr[4] == '1' ? 'M' : (attr[4] == '2' ? 'F' : 'U'));
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
		if(attr[5] == "2") indi.affected = 2;
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
};

export function readCanRiskV1(boadicea_lines) {
	let lines = boadicea_lines.trim().split('\n');
	let ped = [];
	let hdr = [];  // collect risk factor header lines
	// assumes two line header
	for(let i = 0;i < lines.length;i++){
		let ln = lines[i].trim();
	    if(ln.startsWith("##")) {
	    	if(ln.startsWith("##CanRisk") && ln.indexOf(";") > -1) {   // contains surgical op data
	    		let ops = ln.split(";");
	    		for(let j=1; j<ops.length; j++) {
	    			let opdata = ops[j].split("=");
	    			if(opdata.length === 2) {
	    				hdr.push(ops[j]);
	    			}
	    		}
	    	}
	    	if(ln.indexOf("CanRisk") === -1 && !ln.startsWith("##FamID")) {
	    		hdr.push(ln.replace("##", ""));
	    	}
	    	continue;
	    }

	    let delim = /\t/;
	    if(ln.indexOf('\t') < 0) {
	    	delim = /\s+/;
	    	console.log("NOT TAB DELIM");
	    }
	    let attr = $.map(ln.split(delim), function(val, i){return val.trim();});

		if(attr.length > 1) {
			let indi = {
				'famid': attr[0],
				'display_name': attr[1],
				'name':	attr[3],
				'sex': attr[6],
				'status': attr[8]
			};
			if(attr[2] == 1) indi.proband = true;
			if(attr[4] !== "0") indi.father = attr[4];
			if(attr[5] !== "0") indi.mother = attr[5];
			if(attr[7] !== "0") indi.mztwin = attr[7];
			if(attr[9] !== "0") indi.age = attr[9];
			if(attr[10] !== "0") indi.yob = attr[10];

			let idx = 11;
			$.each(cancers, function(cancer, diagnosis_age) {
				// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
				if(attr[idx] !== "0") {
					indi[diagnosis_age] = attr[idx];
				}
				idx++;
			});

			if(attr[idx++] !== "0") indi.ashkenazi = 1;
			// BRCA1, BRCA2, PALB2, ATM, CHEK2, .... genetic tests
			// genetic test type, 0 = untested, S = mutation search, T = direct gene test
			// genetic test result, 0 = untested, P = positive, N = negative
			for(let j=0; j<genetic_test.length; j++) {
				let gene_test = attr[idx].split(":");
				if(gene_test[0] !== '0') {
					if((gene_test[0] === 'S' || gene_test[0] === 'T') && (gene_test[1] === 'P' || gene_test[1] === 'N'))
						indi[genetic_test[j] + '_gene_test'] = {'type': gene_test[0], 'result': gene_test[1]};
					else
						console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + gene_test[0] + " " + gene_test[1]);
				}
				idx++;
			}
			// status, 0 = unspecified, N = negative, P = positive
			let path_test = attr[idx].split(":");
			for(j=0; j<path_test.length; j++) {
				if(path_test[j] !== '0') {
					if(path_test[j] === 'N' || path_test[j] === 'P')
						indi[pathology_tests[j] + '_bc_pathology'] = path_test[j];
					else
						console.warn('UNRECOGNISED PATHOLOGY ON LINE '+ (i+1) + ": " +pathology_tests[j] + " " +path_test[j]);
				}
			}
			ped.unshift(indi);
		}
	}

	try {
		return [hdr, process_ped(ped)];
	} catch(e) {
		console.error(e);
		return [hdr, ped];
	}
};

// read boadicea format v4 & v2
export function readBoadiceaV4(boadicea_lines, version) {
	let lines = boadicea_lines.trim().split('\n');
	let ped = [];
	// assumes two line header
	for(let i = 2;i < lines.length;i++){
	   let attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim();});
		if(attr.length > 1) {
			let indi = {
				'famid': attr[0],
				'display_name': attr[1],
				'name':	attr[3],
				'sex': attr[6],
				'status': attr[8]
			};
			if(attr[2] == 1) indi.proband = true;
			if(attr[4] !== "0") indi.father = attr[4];
			if(attr[5] !== "0") indi.mother = attr[5];
			if(attr[7] !== "0") indi.mztwin = attr[7];
			if(attr[9] !== "0") indi.age = attr[9];
			if(attr[10] !== "0") indi.yob = attr[10];

			let idx = 11;
			$.each(cancers, function(cancer, diagnosis_age) {
				// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
				if(attr[idx] !== "0") {
					indi[diagnosis_age] = attr[idx];
				}
				idx++;
			});

			if(version === 4) {
				if(attr[idx++] !== "0") indi.ashkenazi = 1;
				// BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
				// genetic test type, 0 = untested, S = mutation search, T = direct gene test
				// genetic test result, 0 = untested, P = positive, N = negative
				for(let j=0; j<5; j++) {
					idx+=2;
					if(attr[idx-2] !== '0') {
						if((attr[idx-2] === 'S' || attr[idx-2] === 'T') && (attr[idx-1] === 'P' || attr[idx-1] === 'N'))
							indi[genetic_test[j] + '_gene_test'] = {'type': attr[idx-2], 'result': attr[idx-1]};
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
			for(j=0; j<pathology_tests.length; j++) {
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
};

function process_ped(ped) {
	// find the level of individuals in the pedigree
	for(let j=0;j<2;j++) {
		for(let i=0;i<ped.length;i++) {
			getLevel(ped, ped[i].name);
		}
	}

	// find the max level (i.e. top_level)
	let max_level = 0;
	for(i=0;i<ped.length;i++) {
		if(ped[i].level && ped[i].level > max_level)
			max_level = ped[i].level;
	}

	// identify top_level and other nodes without parents
	for(i=0;i<ped.length;i++) {
		if(pedigree_util.getDepth(ped, ped[i].name) == 1) {
			if(ped[i].level && ped[i].level == max_level) {
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
						if(ped[i].level == (ped[j].level-1)) {
							pidx = getPartnerIdx(ped, ped[j]);
							if(pidx > -1) {
								ped[i].mother = (ped[j].sex === 'F' ? ped[j].name : ped[pidx].name);
								ped[i].father = (ped[j].sex === 'M' ? ped[j].name : ped[pidx].name);
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
	let ptrs = [];
	for(let i=0; i<dataset.length; i++) {
		let bnode = dataset[i];
		if(anode.name === bnode.mother)
			return pedigree_util.getIdxByName(dataset, bnode.father);
		else if(anode.name === bnode.father)
			return pedigree_util.getIdxByName(dataset, bnode.mother);
	}
	return -1;
}

// for a given individual assign levels to a parents ancestors
function getLevel(dataset, name) {
	let idx = pedigree_util.getIdxByName(dataset, name);
	let level = (dataset[idx].level ? dataset[idx].level : 0);
	update_parents_level(idx, level, dataset);
}

// recursively update parents levels
function update_parents_level(idx, level, dataset) {
	let parents = ['mother', 'father'];
	level++;
	for(let i=0; i<parents.length; i++) {
		let pidx = pedigree_util.getIdxByName(dataset, dataset[idx][parents[i]]);
		if(pidx >= 0) {
			let ma = dataset[pedigree_util.getIdxByName(dataset, dataset[idx].mother)];
			let pa = dataset[pedigree_util.getIdxByName(dataset, dataset[idx].father)];
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