

// pedigree utils
(function(utils, $, undefined) {

	/**
	 * Show message or confirmation dialog.
	 * @param title     - dialog window title
	 * @param msg       - message to diasplay
	 * @param onConfirm - function to call in a confirmation dialog
	 * @param opts      - pedigreejs options
	 * @param dataset    - pedigree dataset
	 */ 
	utils.messages = function(title, msg, onConfirm, opts, dataset) {
		if(onConfirm) {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
			        modal: true,
			        title: title,
			        width: 350,
			        buttons: {
			        	"Yes": function () {
			                $(this).dialog('close');
			                onConfirm(opts, dataset);
			            },
			            "No": function () {
			                $(this).dialog('close');
			            }
			        }
			    });
		} else {
			$('<div id="msgDialog">'+msg+'</div>').dialog({
	    		title: title,
	    		width: 350,
	    		buttons: [{
	    			text: "OK",
	    			click: function() { $( this ).dialog( "close" );}
	    		}]
			});
		}
	}
	
	/**
	 * Validate age and yob is consistent with current year. The sum of age and
	 * yob should not be greater than or equal to current year. If alive the
	 * absolute difference between the sum of age and year of birth and the
	 * current year should be <= 1.
	 * @param age    - age in years.
	 * @param yob    - year of birth.
	 * @param status - 0 = alive, 1 = dead.
	 * @return true if age and yob are consistent with current year otherwise false.
	 */
	utils.validate_age_yob = function(age, yob, status) {
		var year = new Date().getFullYear();
		var sum = parseInt(age) + parseInt(yob);
		if(status == 1) {   // deceased
			return year >= sum;
		}
		return Math.abs(year - sum) <= 1 && year >= sum;
	}
}(window.utils = window.utils || {}, jQuery));


// pedigree I/O 
(function(io, $, undefined) {

	// cancers, genetic & pathology tests
	io.cancers = {
			'breast_cancer': 'breast_cancer_diagnosis_age',
			'breast_cancer2': 'breast_cancer2_diagnosis_age',
			'ovarian_cancer': 'ovarian_cancer_diagnosis_age',
			'prostate_cancer': 'prostate_cancer_diagnosis_age',
			'pancreatic_cancer': 'pancreatic_cancer_diagnosis_age'
		};
	io.genetic_test = ['brca1', 'brca2', 'palb2', 'atm', 'chek2'];
	io.pathology_tests = ['er', 'pr', 'her2', 'ck14', 'ck56'];
	
	
	io.add = function(opts) {
		$('#load').change(function(e) {
			io.load(e, opts);
		});

		$('#save').click(function(e) {
			io.save(opts);
		});

		$('#print').click(function(e) {
			io.print(io.get_printable_svg(opts));
		});

		$('#svg_download').click(function(e) {
			io.svg_download(io.get_printable_svg(opts));
		});

		$('#png_download').click(function(e) {
			var wrapper = $(io.get_printable_svg(opts)).appendTo('body')[0];
			var svg = wrapper.querySelector("svg");
			var svgData;
		    if (typeof window.XMLSerializer != "undefined") {
		        svgData = (new XMLSerializer()).serializeToString(svg);
		    } else if (typeof svg.xml != "undefined") {
		        svgData = svg.xml;
		    }

		    var canvas = document.createElement("canvas");
		    var svgSize = svg.getBoundingClientRect();
		    canvas.width = svgSize.width;
		    canvas.height = svgSize.height;
		    var ctx = canvas.getContext("2d");

		    var img = document.createElement("img");
		    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))) );
		    img.onload = function() {
		        ctx.drawImage(img, 0, 0);
		        var imgsrc = canvas.toDataURL("image/png");
				var a      = document.createElement('a');
				a.href     = imgsrc;
				a.download = 'plot.png';
				a.target   = '_blank';
				document.body.appendChild(a); a.click(); document.body.removeChild(a);
		        setTimeout(function() {
		        	wrapper.remove();
		        }, 200);
		    };
		});
	};

	// return a copy of svg html with unique url references (e.g. for clippath)
	io.copy_svg_html = function(opts) {
    	var svg_html = io.get_printable_svg(opts).html();
    	// find all url's to make unique
    	var myRegexp = /url\(\#(.*?)\)/g;
		var match = myRegexp.exec(svg_html);
		while (match !== null) {
			var val = match[1];  // replace all url id's with new unique id's
			svg_html = svg_html.replace(new RegExp(val, 'g'), val+ptree.makeid(2));
			match = myRegexp.exec(svg_html);
		}
		return svg_html;
	};

	// get printable svg div, adjust size to tree dimensions and scale to fit
	io.get_printable_svg = function(opts) {
		var local_dataset = pedcache.current(opts); // get current dataset
		if (local_dataset !== undefined && local_dataset !== null) {
			opts.dataset = local_dataset;
		}

		var tree_dimensions = ptree.get_tree_dimensions(opts);
		var svg_div = $('#'+opts.targetDiv).find('svg').parent();
		if(opts.width < tree_dimensions.width || opts.height < tree_dimensions.height ||
		   tree_dimensions.width > 595 || tree_dimensions.height > 842) {
			var wid = tree_dimensions.width;
		    var hgt = tree_dimensions.height + 100;
		    var scale = 1.0;

		    if(tree_dimensions.width > 595 || tree_dimensions.height > 842) {   // scale to fit A4
		    	if(tree_dimensions.width > 595)  wid = 595;
		    	if(tree_dimensions.height > 842) hgt = 842;
		    	var xscale = wid/tree_dimensions.width;
		    	var yscale = hgt/tree_dimensions.height;
		    	scale = (xscale < yscale ? xscale : yscale);
		    }
			svg_div = $('<div></div>');  				// create a new div
			svg_div.append($('svg').parent().html());	// copy svg html to new div
		    var svg = svg_div.find( "svg" );
		    svg.attr('width', wid);		// adjust dimensions
		    svg.attr('height', hgt);

		    var ytransform = (-opts.symbol_size*1.5*scale);
		    svg.find(".diagram").attr("transform", "translate(0, "+ytransform+") scale("+scale+")");
		}
		return svg_div;
	};

	// download the SVG to a file
	io.svg_download = function(svg){
		var a      = document.createElement('a');
		a.href     = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svg.html() ) ) );
		a.download = 'plot.svg';
		a.target   = '_blank';
		document.body.appendChild(a); a.click(); document.body.removeChild(a);
	};

	// open print window for a given element
	io.print = function(el){
        if(el.constructor !== Array)
        	el = [el];

        var width = $(window).width()*2/3;
        var height = $(window).height()-40;
        var cssFiles = [
        	'/static/css/output.css',
        	'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
        ];
        var printWindow = window.open('', 'PrintMap', 'width=' + width + ',height=' + height);
        var headContent = '';
        for(var i=0; i<cssFiles.length; i++)
        	headContent += '<link href="'+cssFiles[i]+'" rel="stylesheet" type="text/css" media="all">';
        headContent += "<style>body {font-size: " + $("body").css('font-size') + ";}</style>";

            /*var headContent2 = '';
            var links = document.getElementsByTagName('link');
            for(var i=0;i<links.length; i++) {
            	var html = links[i].outerHTML;
            	if(html.indexOf('href="http') !== -1)
            		headContent2 += html;
            }
            headContent2 += html;          
            var scripts = document.getElementsByTagName('script');
            for(var i=0;i<scripts.length; i++) {
            	var html = scripts[i].outerHTML;
            	if(html.indexOf('src="http') !== -1)
            		headContent += html;
            }*/

        html = "";
        for(i=0; i<el.length; i++) {
        	html += $(el[i]).html();
        	if(i < el.length-1)
        		html += '<div style="page-break-before:always"> </div>';
        }

        printWindow.document.write(headContent);
        printWindow.document.write(html);
        printWindow.document.close();

        printWindow.focus();
        setTimeout(function() {
            printWindow.print();
            printWindow.close();
        }, 100);
	};

	io.save = function(opts){
		var content = JSON.stringify(pedcache.current(opts));
		if(opts.DEBUG)
			console.log(content);
		var uriContent = "data:application/csv;charset=utf-8," + encodeURIComponent(content);
		window.open(uriContent, 'boadicea_pedigree');
	};

	io.load = function(e, opts) {
	    var f = e.target.files[0];
		if(f) {
			var reader = new FileReader();
			reader.onload = function(e) {
				if(opts.DEBUG)
					console.log(e.target.result);
				try {
					if(e.target.result.startsWith("BOADICEA import pedigree file format 4.0"))
						opts.dataset = io.readBoadiceaV4(e.target.result);
					else {
						try {
							opts.dataset = JSON.parse(e.target.result);
						} catch(err) {
							opts.dataset = io.readLinkage(e.target.result);
					    }
					}
					ptree.validate_pedigree(opts);
				} catch(err1) {
					console.error(err1);
					utils.messages("File Error", ( err1.message ? err1.message : err1));
					return;
				}
				console.log(opts.dataset);
				try{
					ptree.rebuild(opts);
				} catch(err2) {
					utils.messages("File Error", ( err2.message ? err2.message : err2));
				}
			};
			reader.onerror = function(event) {
			    utils.messages("File Error", "File could not be read! Code " + event.target.error.code);
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
	io.readLinkage = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = [];
		var famid;
		for(var i = 0;i < lines.length;i++){
		   var attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim();});
		   if(attr.length < 5)
			   throw('unknown format');
		   var sex = (attr[4] == '1' ? 'M' : (attr[4] == '2' ? 'F' : 'U'));
		   var indi = {
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
				for(var j=6; j<attr.length; j+=2) {
					indi.alleles += attr[j] + "/" + attr[j+1] + ";";
				}
			}
			
			ped.unshift(indi);
			famid = attr[0];
		}
		return process_ped(ped);
	};

	// read boadicea format v4
	io.readBoadiceaV4 = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = [];
		// assumes two line header
		for(var i = 2;i < lines.length;i++){
		   var attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim();});
			if(attr.length > 1) {
				var indi = {
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

				var idx = 11;
				$.each(io.cancers, function(cancer, diagnosis_age) {
					// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
					if(attr[idx] !== "0") {
						indi[diagnosis_age] = attr[idx];
					}
					idx++;
				});

				if(attr[idx++] !== "0") indi.ashkenazi = 1;
				// BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
				// genetic test type, 0 = untested, S = mutation search, T = direct gene test
				// genetic test result, 0 = untested, P = positive, N = negative
				for(var j=0; j<io.genetic_test.length; j++) {
					idx+=2;
					if(attr[idx-2] !== '0') {
						if((attr[idx-2] === 'S' || attr[idx-2] === 'T') && (attr[idx-1] === 'P' || attr[idx-1] === 'N'))
							indi[io.genetic_test[j] + '_gene_test'] = {'type': attr[idx-2], 'result': attr[idx-1]};
						else
							console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + attr[idx-2] + " " + attr[idx-1]);
					}
				}
				// status, 0 = unspecified, N = negative, P = positive
				for(j=0; j<io.pathology_tests.length; j++) {
					if(attr[idx] !== '0') {
						if(attr[idx] === 'N' || attr[idx] === 'P')
							indi[io.pathology_tests[j] + '_bc_pathology'] = attr[idx];
						else
							console.warn('UNRECOGNISED PATHOLOGY ON LINE '+ (i+1) + ": " +io.pathology_tests[j] + " " +attr[idx]);
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
		for(var i=0;i<ped.length;i++) {
			getLevel(ped, ped[i].name);
		}

		// find the max level (i.e. top_level)
		var max_level = 0;
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
					var pidx = getPartnerIdx(ped, ped[i]);
					if(pidx > -1) {
						if(ped[pidx].mother) {
							ped[i].mother = ped[pidx].mother;
							ped[i].father = ped[pidx].father;
						}
					}

					// 2. or adopt parents from level above
					if(!ped[i].mother){
						for(var j=0; j<ped.length; j++) {
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
		var ptrs = [];
		for(var i=0; i<dataset.length; i++) {
			var bnode = dataset[i];
			if(anode.name === bnode.mother)
				return pedigree_util.getIdxByName(dataset, bnode.father);
			else if(anode.name === bnode.father)
				return pedigree_util.getIdxByName(dataset, bnode.mother);
		}
		return -1;
	}
	
	// for a given individual assign levels to a parents ancestors
	function getLevel(dataset, name) {
		var idx = pedigree_util.getIdxByName(dataset, name);
		var level = (dataset[idx].level ? dataset[idx].level : 0);
		update_parents_level(idx, level, dataset);
	}

	// recursively update parents levels 
	function update_parents_level(idx, level, dataset) {
		var parents = ['mother', 'father'];
		level++;
		for(var i=0; i<parents.length; i++) {
			var pidx = pedigree_util.getIdxByName(dataset, dataset[idx][parents[i]]);
			if(pidx >= 0) {
				if(!dataset[pidx].level || dataset[pidx].level < level) {
					dataset[pedigree_util.getIdxByName(dataset, dataset[idx].mother)].level = level;
					dataset[pedigree_util.getIdxByName(dataset, dataset[idx].father)].level = level;
				}
				update_parents_level(pidx, level, dataset);
			}
		}
	}

}(window.io = window.io || {}, jQuery));
