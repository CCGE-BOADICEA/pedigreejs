
// pedigree utils
(function(utils, $, undefined) {

	utils.isIE = function() {
		 var ua = navigator.userAgent;
		 /* MSIE used to detect old browsers and Trident used to newer ones*/
		 return ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
	}

	utils.isEdge = function() {
		 return navigator.userAgent.match(/Edge/g);
	}

	/**
	 *  Get formatted time or data & time
	 */
	utils.getFormattedDate = function(time){
	    var d = new Date();
	    if(time)
	    	return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	    else
	    	return d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	 }

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

	utils.capitaliseFirstLetter = function(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
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
	io.genetic_test = ['brca1', 'brca2', 'palb2', 'atm', 'chek2', 'rad51d',	'rad51c', 'brip1'];
	io.pathology_tests = ['er', 'pr', 'her2', 'ck14', 'ck56'];

	// get breast and ovarian PRS values
	io.get_prs_values = function() {
		var prs = {};
		if(io.hasInput("breast_prs_a") && io.hasInput("breast_prs_z")) {
			prs['breast_cancer_prs'] = {
				'alpha': parseFloat($('#breast_prs_a').val()),
				'zscore': parseFloat($('#breast_prs_z').val()),
				'percent': parseFloat($('#breast_prs_percent').val())
			};
		}
		if(io.hasInput("ovarian_prs_a") && io.hasInput("ovarian_prs_z")) {
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
	io.hasInput = function(id) {
		return $.trim($('#'+id).val()).length !== 0;
	}

	// return true if the object is empty
	var isEmpty = function(myObj) {
	    for(var key in myObj) {
	        if (myObj.hasOwnProperty(key)) {
	            return false;
	        }
	    }
	    return true;
	}

	io.get_surgical_ops = function() {
		var meta = "";
		if(!$('#A6_4_3_check').parent().hasClass("off")) {
			meta += ";OVARY2=y";
		}
		if(!$('#A6_4_7_check').parent().hasClass("off")) {
			meta += ";MAST2=y";
		}
		return meta;
	};

	io.add = function(opts) {
		$('#load').change(function(e) {
			io.load(e, opts);
		});

		$('#save').click(function(e) {
			io.save(opts);
		});

		$('#save_canrisk').click(function(e) {
			var meta = io.get_surgical_ops();
			try {
				var prs = io.get_prs_values();
		    	if(prs.breast_cancer_prs && prs.breast_cancer_prs.alpha !== 0 && prs.breast_cancer_prs.zscore !== 0) {
		    		meta += "\n##PRS_BC=alpha="+prs.breast_cancer_prs.alpha+",zscore="+prs.breast_cancer_prs.zscore;
		    	}
		    	if(prs.ovarian_cancer_prs && prs.ovarian_cancer_prs.alpha !== 0 && prs.ovarian_cancer_prs.zscore !== 0) {
		    		meta += "\n##PRS_OC=alpha="+prs.ovarian_cancer_prs.alpha+",zscore="+prs.ovarian_cancer_prs.zscore;
		    	}
			} catch(err) { console.warn("PRS", prs); }
			io.save_canrisk(opts, meta);
		});

		$('#print').click(function(e) {
			io.print(io.get_printable_svg(opts));
		});

		$('#svg_download').click(function(e) {
			io.svg_download(io.get_printable_svg(opts));
		});

		$('#png_download').click(function(e) {
			var deferred = io.svg2png($('svg'), "pedigree", utils.isEdge()||utils.isIE());
		    $.when.apply($,[deferred]).done(function() {
		    	var obj = getByName(arguments, "pedigree");
		        if(utils.isEdge() || utils.isIE()) {
		        	var html="<img src='"+obj.img+"' alt='canvas image'/>";
			        var newTab = window.open();
			        newTab.document.write(html);
		        } else {
					var a      = document.createElement('a');
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
	 * Given a SVG document element convert to PNG.
	 */
    io.svg2png = function(svg, deferred_name, iscanvg) {
    	var deferred = $.Deferred();
    	var svgStr;
	    if (typeof window.XMLSerializer != "undefined") {
	    	svgStr = (new XMLSerializer()).serializeToString(svg.get(0));
	    } else if (typeof svg.xml != "undefined") {
	    	svgStr = svg.get(0).xml;
	    }

	    var imgsrc = 'data:image/svg+xml;base64,'+ btoa(unescape(encodeURIComponent(svgStr))); // convert SVG string to data URL
    	var canvas = document.createElement("canvas");
    	var context = canvas.getContext("2d");
	    canvas.width = svg.width();
	    canvas.height = svg.height();
	    var img = document.createElement("img");
	    img.onload = function() {
	        if(utils.isIE() || iscanvg) {
	        	// change font so it isn't tiny
	        	svgStr = svgStr.replace(/ font-size="\d?.\d*em"/g, '');
	        	svgStr = svgStr.replace(/<text /g, '<text font-size="13px" ');
	        	canvg(canvas, svgStr, {
	    			  scaleWidth: svg.width(),
	    			  scaleHeight: svg.height(),
	    			  ignoreDimensions: true
	        	});
	        	console.log(deferred_name, "use canvg to create PNG");
	        } else {
    			context.clearRect (0, 0, svg.width(), svg.height());
        		context.drawImage(img, 0, 0, svg.width(), svg.height());
    		}
	        deferred.resolve({'name': deferred_name, 'img':canvas.toDataURL("image/png"), 'w':svg.width(), 'h':svg.height()});
    	};
    	img.src = imgsrc;
    	return deferred.promise();
    }

	// return a copy pedigree svg
	io.copy_svg_html = function(opts) {
    	var svg_html = io.get_printable_svg(opts).html();
    	return io.copy_svg(svg_html);
	}

	// return a copy of svg html with unique url references (e.g. for clippath)
    io.copy_svg = function(svg_html) {
    	// find all url's to make unique
    	var myRegexp = /url\((&quot;|"|'){0,1}\#(.*?)(&quot;|"|'){0,1}\)/g;
	    var matches = [];
	    var match;
	    var c = 0;
	    myRegexp.lastIndex = 0;
	    while (match = myRegexp.exec(svg_html)) {
	    	c++;
	    	if(c > 800) {
	    		console.error("io.copy_svg_html: counter exceeded 800");
	    		return "ERROR DISPLAYING PEDIGREE";
	    	}
	        matches.push(match);
	        if (myRegexp.lastIndex === match.index) {
	        	myRegexp.lastIndex++;
	        }
	    }

    	for(var i=0; i<matches.length; i++) {
    		var quote = (matches[i][1] ? matches[i][1] : "");
    		var val = matches[i][2];
    		var m1 = "id=\"" + val + "\"";
    		var m2 = "url\\(" + quote + "\#" + val + quote + "\\)";

    		var newval = val+ptree.makeid(2);
    		svg_html = svg_html.replace(new RegExp(m1, 'g'), "id=\""+newval+"\"" );
    		svg_html = svg_html.replace(new RegExp(m2, 'g'), "url(#"+newval+")" );
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
			svg_div.append($('#'+opts.targetDiv).find('svg').parent().html());	// copy svg html to new div
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
	io.print = function(el, id){
        if(el.constructor !== Array)
        	el = [el];

        var width = $(window).width()*0.9;
        var height = $(window).height()-10;
        var cssFiles = [
        	'/static/css/canrisk.css',
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
        	if(i === 0 && id)
        		html += id;
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
        }, 300);
	};

	// save content to a file
	io.save_file = function(opts, content, filename, type){
		if(opts.DEBUG)
			console.log(content);
		if(!filename) filename = "ped.txt";
		if(!type) type = "text/plain";

	   var file = new Blob([content], {type: type});
	   if (window.navigator.msSaveOrOpenBlob) 	// IE10+
		   window.navigator.msSaveOrOpenBlob(file, filename);
	   else { 									// other browsers
		   var a = document.createElement("a");
		   var url = URL.createObjectURL(file);
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

	io.save = function(opts){
		var content = JSON.stringify(pedcache.current(opts));
		io.save_file(opts, content);
	};

	io.save_canrisk = function(opts, meta){
		io.save_file(opts, run_prediction.get_non_anon_pedigree(pedcache.current(opts), meta), "canrisk.txt");
	};

	io.canrisk_validation = function(opts) {
		$.each(opts.dataset, function(idx, p) {
			if(!p.hidden && p.sex === 'M' && !pedigree_util.isProband(p)) {
				if(p[io.cancers['breast_cancer2']]) {
					var msg = 'Male family member ('+p.display_name+') with contralateral breast cancer found. '+
					          'Please note that as the risk models do not take this into account the second '+
					          'breast cancer is ignored.'
					console.error(msg);
					delete p[io.cancers['breast_cancer2']];
					utils.messages("Warning", msg);
				}
			}
		});
	}

	io.load = function(e, opts) {
	    var f = e.target.files[0];
		if(f) {
			var reader = new FileReader();
			reader.onload = function(e) {
				if(opts.DEBUG)
					console.log(e.target.result);
				try {
					if(e.target.result.startsWith("BOADICEA import pedigree file format 4.0")) {
						opts.dataset = io.readBoadiceaV4(e.target.result, 4);
						io.canrisk_validation(opts);
					} else if(e.target.result.startsWith("BOADICEA import pedigree file format 2.0")) {
						opts.dataset = io.readBoadiceaV4(e.target.result, 2);
						io.canrisk_validation(opts);
					} else if(e.target.result.startsWith("##") && e.target.result.indexOf("CanRisk") !== -1) {
						var canrisk_data = io.readCanRiskV1(e.target.result);
						var risk_factors = canrisk_data[0];
						opts.dataset = canrisk_data[1];
						io.canrisk_validation(opts);
					} else {
						try {
							opts.dataset = JSON.parse(e.target.result);
						} catch(err) {
							opts.dataset = io.readLinkage(e.target.result);
					    }
					}
					ptree.validate_pedigree(opts);
				} catch(err1) {
					console.error(err1, e.target.result);
					utils.messages("File Error", ( err1.message ? err1.message : err1));
					return;
				}
				console.log(opts.dataset);
				try{
					ptree.rebuild(opts);
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

	io.readCanRiskV1 = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = [];
		var hdr = [];  // collect risk factor header lines
		// assumes two line header
		for(var i = 0;i < lines.length;i++){
		    if(lines[i].startsWith("##")) {
		    	if(lines[i].startsWith("##CanRisk") && lines[i].indexOf(";") > -1) {   // contains surgical op data
		    		var ops = lines[i].split(";");
		    		for(var j=1; j<ops.length; j++) {
		    			var opdata = ops[j].split("=");
		    			if(opdata.length === 2) {
		    				hdr.push(ops[j]);
		    			}
		    		}
		    	}
		    	if(lines[i].indexOf("CanRisk") === -1 && !lines[i].startsWith("##FamID")) {
		    		hdr.push(lines[i].replace("##", ""));
		    	}
		    	continue;
		    }

		    var delim = /\t/;
		    if(lines[i].indexOf('\t') < 0) {
		    	delim = /\s+/;
		    	console.log("NOT TAB DELIM");
		    }
		    var attr = $.map(lines[i].trim().split(delim), function(val, i){return val.trim();});

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
				// BRCA1, BRCA2, PALB2, ATM, CHEK2, .... genetic tests
				// genetic test type, 0 = untested, S = mutation search, T = direct gene test
				// genetic test result, 0 = untested, P = positive, N = negative
				for(var j=0; j<io.genetic_test.length; j++) {
					var gene_test = attr[idx].split(":");
					if(gene_test[0] !== '0') {
						if((gene_test[0] === 'S' || gene_test[0] === 'T') && (gene_test[1] === 'P' || gene_test[1] === 'N'))
							indi[io.genetic_test[j] + '_gene_test'] = {'type': gene_test[0], 'result': gene_test[1]};
						else
							console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + gene_test[0] + " " + gene_test[1]);
					}
					idx++;
				}
				// status, 0 = unspecified, N = negative, P = positive
				var path_test = attr[idx].split(":");
				for(j=0; j<path_test.length; j++) {
					if(path_test[j] !== '0') {
						if(path_test[j] === 'N' || path_test[j] === 'P')
							indi[io.pathology_tests[j] + '_bc_pathology'] = path_test[j];
						else
							console.warn('UNRECOGNISED PATHOLOGY ON LINE '+ (i+1) + ": " +io.pathology_tests[j] + " " +path_test[j]);
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
	io.readBoadiceaV4 = function(boadicea_lines, version) {
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

				if(version === 4) {
					if(attr[idx++] !== "0") indi.ashkenazi = 1;
					// BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
					// genetic test type, 0 = untested, S = mutation search, T = direct gene test
					// genetic test result, 0 = untested, P = positive, N = negative
					for(var j=0; j<5; j++) {
						idx+=2;
						if(attr[idx-2] !== '0') {
							if((attr[idx-2] === 'S' || attr[idx-2] === 'T') && (attr[idx-1] === 'P' || attr[idx-1] === 'N'))
								indi[io.genetic_test[j] + '_gene_test'] = {'type': attr[idx-2], 'result': attr[idx-1]};
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
		for(var j=0;j<2;j++) {
			for(var i=0;i<ped.length;i++) {
				getLevel(ped, ped[i].name);
			}
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
				var ma = dataset[pedigree_util.getIdxByName(dataset, dataset[idx].mother)];
				var pa = dataset[pedigree_util.getIdxByName(dataset, dataset[idx].father)];
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

}(window.io = window.io || {}, jQuery));

// Pedigree Tree Utils
(function(pedigree_util, $, undefined) {

	pedigree_util.buildTree = function(opts, person, root, partnerLinks, id) {
		if (typeof person.children === typeof undefined)
			person.children = pedigree_util.getChildren(opts.dataset, person);

		if (typeof partnerLinks === typeof undefined) {
			partnerLinks = [];
			id = 1;
		}

		var nodes = pedigree_util.flatten(root);
		//console.log('NAME='+person.name+' NO. CHILDREN='+person.children.length);
		var partners = [];
		$.each(person.children, function(i, child) {
			$.each(opts.dataset, function(j, p) {
				if (((child.name === p.mother) || (child.name === p.father)) && child.id === undefined) {
					var m = pedigree_util.getNodeByName(nodes, p.mother);
					var f = pedigree_util.getNodeByName(nodes, p.father);
					m = (m !== undefined? m : pedigree_util.getNodeByName(opts.dataset, p.mother));
					f = (f !== undefined? f : pedigree_util.getNodeByName(opts.dataset, p.father));
					if(!contains_parent(partners, m, f))
						partners.push({'mother': m, 'father': f});
				}
			});
		});
		$.merge(partnerLinks, partners);

		$.each(partners, function(i, ptr) {
			var mother = ptr.mother;
			var father = ptr.father;
			mother.children = [];
			var parent = {
					name : ptree.makeid(4),
					hidden : true,
					parent : null,
					father : father,
					mother : mother,
					children : pedigree_util.getChildren(opts.dataset, mother, father)
			};

			var midx = pedigree_util.getIdxByName(opts.dataset, mother.name);
			var fidx = pedigree_util.getIdxByName(opts.dataset, father.name);
			if(!('id' in father) && !('id' in mother))
				id = setChildrenId(person.children, id);

			// look at grandparents index
			var gp = pedigree_util.get_grandparents_idx(opts.dataset, midx, fidx);
			if(gp.fidx < gp.midx) {
				father.id = id++;
				parent.id = id++;
				mother.id = id++;
			} else {
				mother.id = id++;
				parent.id = id++;
				father.id = id++;
			}
			id = updateParent(mother, parent, id, nodes, opts);
			id = updateParent(father, parent, id, nodes, opts);
			person.children.push(parent);
		});
		id = setChildrenId(person.children, id);

		$.each(person.children, function(i, p) {
			id = pedigree_util.buildTree(opts, p, root, partnerLinks, id)[1];
		});
		return [partnerLinks, id];
	};

	// update parent node and sort twins
	function updateParent(p, parent, id, nodes, opts) {
		// add to parent node
		if('parent_node' in p)
			p.parent_node.push(parent);
		else
			p.parent_node = [parent];

		// check twins lie next to each other
		if(p.mztwin || p.dztwins) {
			var twins = pedigree_util.getTwins(opts.dataset, p);
			for(var i=0; i<twins.length; i++) {
				var twin = pedigree_util.getNodeByName(nodes, twins[i].name);
				if(twin)
					twin.id = id++;
			}
		}
		return id;
	}

	function setChildrenId(children, id) {
		// sort twins to lie next to each other
		children.sort(function(a, b) {
			if(a.mztwin && b.mztwin && a.mztwin == b.mztwin)
				return 0;
			else if(a.dztwin && b.dztwin && a.dztwin == b.dztwin)
				return 0;
			else if(a.mztwin || b.mztwin || a.dztwin || b.dztwin)
				return 1;
			return 0;
		});

		$.each(children, function(i, p) {
			if(p.id === undefined) p.id = id++;
		});
		return id;
	}

	pedigree_util.isProband = function(obj) {
		return typeof $(obj).attr('proband') !== typeof undefined && $(obj).attr('proband') !== false;
	};

	pedigree_util.setProband = function(dataset, name, is_proband) {
		$.each(dataset, function(i, p) {
			if (name === p.name)
				p.proband = is_proband;
			else
				delete p.proband;
		});
	};

	pedigree_util.getProbandIndex = function(dataset) {
		var proband;
		$.each(dataset, function(i, val) {
			if (pedigree_util.isProband(val)) {
				proband = i;
				return proband;
			}
		});
		return proband;
	};

	pedigree_util.getChildren = function(dataset, mother, father) {
		var children = [];
		var names = [];
		if(mother.sex === 'F')
			$.each(dataset, function(i, p) {
				if(mother.name === p.mother)
					if(!father || father.name == p.father) {
						if($.inArray(p.name, names) === -1){
							children.push(p);
							names.push(p.name);
						}
					}
			});
		return children;
	};

	function contains_parent(arr, m, f) {
		for(var i=0; i<arr.length; i++)
			if(arr[i].mother === m && arr[i].father === f)
				return true;
		return false;
	}

	// get the siblings of a given individual - sex is an optional parameter
	// for only returning brothers or sisters
	pedigree_util.getSiblings = function(dataset, person, sex) {
		if(person === undefined || !person.mother || person.noparents)
			return [];

		return $.map(dataset, function(p, i){
			return  p.name !== person.name && !('noparents' in p) && p.mother &&
			       (p.mother === person.mother && p.father === person.father) &&
			       (!sex || p.sex == sex) ? p : null;
		});
	};

	// get the siblings + adopted siblings
	pedigree_util.getAllSiblings = function(dataset, person, sex) {
		return $.map(dataset, function(p, i){
			return  p.name !== person.name && !('noparents' in p) && p.mother &&
			       (p.mother === person.mother && p.father === person.father) &&
			       (!sex || p.sex == sex) ? p : null;
		});
	};

	// get the mono/di-zygotic twin(s)
	pedigree_util.getTwins = function(dataset, person) {
		var sibs = pedigree_util.getSiblings(dataset, person);
		var twin_type = (person.mztwin ? "mztwin" : "dztwin");
		return $.map(sibs, function(p, i){
			return p.name !== person.name && p[twin_type] == person[twin_type] ? p : null;
		});
	};

	// get the adopted siblings of a given individual
	pedigree_util.getAdoptedSiblings = function(dataset, person) {
		return $.map(dataset, function(p, i){
			return  p.name !== person.name && 'noparents' in p &&
			       (p.mother === person.mother && p.father === person.father) ? p : null;
		});
	};

	pedigree_util.getAllChildren = function(dataset, person, sex) {
		return $.map(dataset, function(p, i){
			return !('noparents' in p) &&
			       (p.mother === person.name || p.father === person.name) &&
			       (!sex || p.sex === sex) ? p : null;
		});
	};

	// get the depth of the given person from the root
	pedigree_util.getDepth = function(dataset, name) {
		var idx = pedigree_util.getIdxByName(dataset, name);
		var depth = 1;

		while(idx >= 0 && ('mother' in dataset[idx] || dataset[idx].top_level)){
			idx = pedigree_util.getIdxByName(dataset, dataset[idx].mother);
			depth++;
		}
		return depth;
	};

	// given an array of people get an index for a given person
	pedigree_util.getIdxByName = function(arr, name) {
		var idx = -1;
		$.each(arr, function(i, p) {
			if (name === p.name) {
				idx = i;
				return idx;
			}
		});
		return idx;
	};

	// get the nodes at a given depth sorted by their x position
	pedigree_util.getNodesAtDepth = function(fnodes, depth, exclude_names) {
		return $.map(fnodes, function(p, i){
			return p.depth == depth && !p.data.hidden && $.inArray(p.data.name, exclude_names) == -1 ? p : null;
		}).sort(function (a,b) {return a.x - b.x;});
	};

	// convert the partner names into corresponding tree nodes
	pedigree_util.linkNodes = function(flattenNodes, partners) {
		var links = [];
		for(var i=0; i< partners.length; i++)
			links.push({'mother': pedigree_util.getNodeByName(flattenNodes, partners[i].mother.name),
						'father': pedigree_util.getNodeByName(flattenNodes, partners[i].father.name)});
		return links;
	};

	// get ancestors of a node
	pedigree_util.ancestors = function(dataset, node) {
		var ancestors = [];
		function recurse(node) {
			if(node.data) node = node.data;
			if('mother' in node && 'father' in node && !('noparents' in node)){
				recurse(pedigree_util.getNodeByName(dataset, node.mother));
				recurse(pedigree_util.getNodeByName(dataset, node.father));
			}
			ancestors.push(node);
		}
		recurse(node);
		return ancestors;
	}

	// test if two nodes are consanguinous partners
	pedigree_util.consanguity = function(node1, node2, opts) {
		if(node1.depth !== node2.depth) // parents at different depths
			return true;
		var ancestors1 = pedigree_util.ancestors(opts.dataset, node1);
		var ancestors2 = pedigree_util.ancestors(opts.dataset, node2);
		var names1 = $.map(ancestors1, function(ancestor, i){return ancestor.name;});
		var names2 = $.map(ancestors2, function(ancestor, i){return ancestor.name;});
  		var consanguity = false;
  		$.each(names1, function( index, name ) {
  			if($.inArray(name, names2) !== -1){
  				consanguity = true;
  				return false;
  			}
  		});
  		return consanguity;
	}

	// return a flattened representation of the tree
	pedigree_util.flatten = function(root) {
		var flat = [];
		function recurse(node) {
			if(node.children)
				node.children.forEach(recurse);
			flat.push(node);
		}
		recurse(root);
		return flat;
	};

	// Adjust D3 layout positioning.
	// Position hidden parent node centring them between father and mother nodes. Remove kinks
	// from links - e.g. where there is a single child plus a hidden child
	pedigree_util.adjust_coords  = function(opts, root, flattenNodes) {
		function recurse(node) {
			if (node.children) {
				node.children.forEach(recurse);

				if(node.data.father !== undefined) { 	// hidden nodes
					var father = pedigree_util.getNodeByName(flattenNodes, node.data.father.name);
					var mother = pedigree_util.getNodeByName(flattenNodes, node.data.mother.name);
					var xmid = (father.x + mother.x) /2;
					if(!pedigree_util.overlap(opts, root.descendants(), xmid, node.depth, [node.data.name])) {
						node.x = xmid;   // centralise parent nodes
						var diff = node.x - xmid;
						if(node.children.length == 2 && (node.children[0].data.hidden || node.children[1].data.hidden)) {
							if(!(node.children[0].data.hidden && node.children[1].data.hidden)) {
								var child1 = (node.children[0].data.hidden ? node.children[1] : node.children[0]);
								var child2 = (node.children[0].data.hidden ? node.children[0] : node.children[1]);
								if( ((child1.x < child2.x && xmid < child2.x) || (child1.x > child2.x && xmid > child2.x)) &&
								    !pedigree_util.overlap(opts, root.descendants(), xmid, child1.depth, [child1.data.name])){
									child1.x = xmid;
								}
							}
						} else if(node.children.length == 1 && !node.children[0].data.hidden) {
							if(!pedigree_util.overlap(opts, root.descendants(), xmid, node.children[0].depth, [node.children[0].data.name]))
								node.children[0].x = xmid;
						} else {
							if(diff !== 0 && !nodesOverlap(opts, node, diff, root)){
								if(node.children.length == 1) {
									node.children[0].x = xmid;
								} else {
									var descendants = node.descendants();
									if(opts.DEBUG)
										console.log('ADJUSTING '+node.data.name+' NO. DESCENDANTS '+descendants.length+' diff='+diff);
									for(var i=0; i<descendants.length; i++) {
										if(node.data.name !== descendants[i].data.name)
											descendants[i].x -= diff;
									}
								}
							}
						}
					} else if((node.x < father.x && node.x < mother.x) || (node.x > father.x && node.x > mother.x)){
							node.x = xmid;   // centralise parent nodes if it doesn't lie between mother and father
					}
				}
			}
		}
		recurse(root);
		recurse(root);
	};

	// test if moving siblings by diff overlaps with other nodes
	function nodesOverlap(opts, node, diff, root) {
		var descendants = node.descendants();
		var descendantsNames = $.map(descendants, function(descendant, i){return descendant.data.name;});
		var nodes = root.descendants();
		for(var i=0; i<descendants.length; i++){
			var descendant = descendants[i];
			if(node.data.name !== descendant.data.name){
				var xnew = descendant.x - diff;
				if(pedigree_util.overlap(opts, nodes, xnew, descendant.depth, descendantsNames))
					return true;
			}
		}
		return false;
	}

	// test if x position overlaps a node at the same depth
	pedigree_util.overlap = function(opts, nodes, xnew, depth, exclude_names) {
		for(var n=0; n<nodes.length; n++) {
			if(depth == nodes[n].depth && $.inArray(nodes[n].data.name, exclude_names) == -1){
				if(Math.abs(xnew - nodes[n].x) < (opts.symbol_size*1.15))
					return true;
			}
		}
		return false;
	};

	// given a persons name return the corresponding d3 tree node
	pedigree_util.getNodeByName = function(nodes, name) {
		for (var i = 0; i < nodes.length; i++) {
			if(nodes[i].data && name === nodes[i].data.name)
				return nodes[i];
			else if (name === nodes[i].name)
				return nodes[i];
		}
	};

	// given the name of a url param get the value
	pedigree_util.urlParam = function(name){
	    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	    if (results===null)
	       return null;
	    else
	       return results[1] || 0;
	};

	// get grandparents index
	pedigree_util.get_grandparents_idx = function(dataset, midx, fidx) {
		var gmidx = midx;
		var gfidx = fidx;
		while(  'mother' in dataset[gmidx] && 'mother' in dataset[gfidx] &&
			  !('noparents' in dataset[gmidx]) && !('noparents' in dataset[gfidx])){
			gmidx = pedigree_util.getIdxByName(dataset, dataset[gmidx].mother);
			gfidx = pedigree_util.getIdxByName(dataset, dataset[gfidx].mother);
		}
		return {'midx': gmidx, 'fidx': gfidx};
	};

	// Set or remove proband attributes.
	// If a value is not provided the attribute is removed from the proband.
	// 'key' can be a list of keys or a single key.
	pedigree_util.proband_attr = function(opts, keys, value){
		var proband = opts.dataset[ pedigree_util.getProbandIndex(opts.dataset) ];
		pedigree_util.node_attr(opts, proband.name, keys, value);
	}

	// Set or remove node attributes.
	// If a value is not provided the attribute is removed.
	// 'key' can be a list of keys or a single key.
	pedigree_util.node_attr = function(opts, name, keys, value){
		var newdataset = ptree.copy_dataset(pedcache.current(opts));
		var node = pedigree_util.getNodeByName(newdataset, name);
		if(!node){
			console.warn("No person defined");
			return;
		}

		if(!$.isArray(keys)) {
			keys = [keys];
		}

		if(value) {
			for(var i=0; i<keys.length; i++) {
				var k = keys[i];
				//console.log('VALUE PROVIDED', k, value, (k in node));
				if(k in node && keys.length === 1) {
					if(node[k] === value)
						return;
					try{
					   if(JSON.stringify(node[k]) === JSON.stringify(value))
						   return;
					} catch(e){}
				}
				node[k] = value;
			}
		} else {
			var found = false;
			for(var i=0; i<keys.length; i++) {
				var k = keys[i];
				//console.log('NO VALUE PROVIDED', k, (k in node));
				if(k in node) {
					delete node[k];
					found = true;
				}
			}
			if(!found)
				return;
		}
        ptree.syncTwins(newdataset, node);
		opts.dataset = newdataset;
		ptree.rebuild(opts);
	}

	// add a child to the proband; giveb sex, age, yob and breastfeeding months (optional)
	pedigree_util.proband_add_child = function(opts, sex, age, yob, breastfeeding){
		var newdataset = ptree.copy_dataset(pedcache.current(opts));
		var proband = newdataset[ pedigree_util.getProbandIndex(newdataset) ];
		if(!proband){
			console.warn("No proband defined");
			return;
		}
		var newchild = ptree.addchild(newdataset, proband, sex, 1)[0];
	    newchild.age = age;
	    newchild.yob = yob;
	    if(breastfeeding !== undefined)
	    	newchild.breastfeeding = breastfeeding;
		opts.dataset = newdataset;
		ptree.rebuild(opts);
		return newchild.name;
	}

	// delete node using the name
	pedigree_util.delete_node_by_name = function(opts, name){
		function onDone(opts, dataset) {
			// assign new dataset and rebuild pedigree
			opts.dataset = dataset;
			ptree.rebuild(opts);
		}
		var newdataset = ptree.copy_dataset(pedcache.current(opts));
		var node = pedigree_util.getNodeByName(pedcache.current(opts), name);
		if(!node){
			console.warn("No node defined");
			return;
		}
		ptree.delete_node_dataset(newdataset, node, opts, onDone);
	}

	// check by name if the individual exists
	pedigree_util.exists = function(opts, name){
		return pedigree_util.getNodeByName(pedcache.current(opts), name) !== undefined;
	}

	// print options and dataset
	pedigree_util.print_opts = function(opts){
    	$("#pedigree_data").remove();
    	$("body").append("<div id='pedigree_data'></div>" );
    	var key;
    	for(var i=0; i<opts.dataset.length; i++) {
    		var person = "<div class='row'><strong class='col-md-1 text-right'>"+opts.dataset[i].name+"</strong><div class='col-md-11'>";
    		for(key in opts.dataset[i]) {
    			if(key === 'name') continue;
    			if(key === 'parent')
    				person += "<span>"+key + ":" + opts.dataset[i][key].name+"; </span>";
    			else if (key === 'children') {
    				if (opts.dataset[i][key][0] !== undefined)
    					person += "<span>"+key + ":" + opts.dataset[i][key][0].name+"; </span>";
    			} else
    				person += "<span>"+key + ":" + opts.dataset[i][key]+"; </span>";
    		}
    		$("#pedigree_data").append(person + "</div></div>");

    	}
    	$("#pedigree_data").append("<br /><br />");
    	for(key in opts) {
    		if(key === 'dataset') continue;
    		$("#pedigree_data").append("<span>"+key + ":" + opts[key]+"; </span>");
    	}
	};
}(window.pedigree_util = window.pedigree_util || {}, jQuery));


// Pedigree Tree Builder
(function(ptree, $, undefined) {
	ptree.roots = {};
	ptree.build = function(options) {
        var opts = $.extend({ // defaults
        	targetDiv: 'pedigree_edit',
        	dataset: [ {"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
        		       {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
        			   {"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}],
        	width: 600,
        	height: 400,
        	symbol_size: 35,
        	zoomIn: 1.0,
        	zoomOut: 1.0,
        	diseases: [	{'type': 'breast_cancer', 'colour': '#F68F35'},
        				{'type': 'breast_cancer2', 'colour': 'pink'},
						{'type': 'ovarian_cancer', 'colour': '#4DAA4D'},
						{'type': 'pancreatic_cancer', 'colour': '#4289BA'},
						{'type': 'prostate_cancer', 'colour': '#D5494A'}],
			labels: ['stillbirth', 'age', 'yob', 'alleles'],
			keep_proband_on_reset: false,
			font_size: '.75em',
			font_family: 'Helvetica',
			font_weight: 700,
			background: "#EEE",
			node_background: '#fdfdfd',
			validate: true,
        	DEBUG: false}, options );

        if ( $( "#fullscreen" ).length === 0 ) {
        	// add undo, redo, fullscreen buttons and event listeners once
			pbuttons.add(opts);
			io.add(opts);
        }

        if(pedcache.nstore(opts) == -1)
        	pedcache.add(opts);

        pbuttons.updateButtons(opts);

        // validate pedigree data
        ptree.validate_pedigree(opts);
        // group top level nodes by partners
        opts.dataset = group_top_level(opts.dataset);

        if(opts.DEBUG)
        	pedigree_util.print_opts(opts);
        var svg_dimensions = get_svg_dimensions(opts);
        var svg = d3.select("#"+opts.targetDiv)
					 .append("svg:svg")
					 .attr("width", svg_dimensions.width)
					 .attr("height", svg_dimensions.height);

		svg.append("rect")
			.attr("width", "100%")
			.attr("height", "100%")
			.attr("rx", 6)
			.attr("ry", 6)
			.style("stroke", "darkgrey")
       		.style("fill", opts.background) // or none
       		.style("stroke-width", 1);

		var xytransform = pedcache.getposition(opts);  // cached position
		var xtransform = xytransform[0];
		var ytransform = xytransform[1];
		var zoom = 1;
		if(xytransform.length == 3){
			zoom = xytransform[2];
		}

		if(xtransform === null || ytransform === null) {
			xtransform = opts.symbol_size/2;
			ytransform = (-opts.symbol_size*2.5);
		}
		var ped = svg.append("g")
				 .attr("class", "diagram")
	             .attr("transform", "translate("+xtransform+"," + ytransform + ") scale("+zoom+")");

		var top_level = $.map(opts.dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
		var hidden_root = {
			name : 'hidden_root',
			id : 0,
			hidden : true,
			children : top_level
		};

		var partners = pedigree_util.buildTree(opts, hidden_root, hidden_root)[0];
		var root = d3.hierarchy(hidden_root);
		ptree.roots[opts.targetDiv] = root;

		/// get score at each depth used to adjust node separation
		var tree_dimensions = ptree.get_tree_dimensions(opts);
		if(opts.DEBUG)
			console.log('opts.width='+svg_dimensions.width+' width='+tree_dimensions.width+
					    ' opts.height='+svg_dimensions.height+' height='+tree_dimensions.height);

		var treemap = d3.tree().separation(function(a, b) {
			return a.parent === b.parent || a.data.hidden || b.data.hidden ? 1.2 : 2.2;
		}).size([tree_dimensions.width, tree_dimensions.height]);

		var nodes = treemap(root.sort(function(a, b) { return a.data.id - b.data.id; }));
		var flattenNodes = nodes.descendants();

		// check the number of visible nodes equals the size of the pedigree dataset
		var vis_nodes = $.map(opts.dataset, function(p, i){return p.hidden ? null : p;});
		if(vis_nodes.length != opts.dataset.length) {
			throw create_err('NUMBER OF VISIBLE NODES DIFFERENT TO NUMBER IN THE DATASET');
		}

		pedigree_util.adjust_coords(opts, nodes, flattenNodes);

		var ptrLinkNodes = pedigree_util.linkNodes(flattenNodes, partners);
		check_ptr_links(opts, ptrLinkNodes);   // check for crossing of partner lines

		var node = ped.selectAll(".node")
					  .data(nodes.descendants())
					  .enter()
					   	.append("g")
					   	.attr("transform", function(d, i) {
							return "translate(" + d.x + "," + d.y + ")";
						});

		// provide a border to the node
		node.append("path")
			.filter(function (d) {return !d.data.hidden;})
			.attr("shape-rendering", "geometricPrecision")
			.attr("transform", function(d) {return d.data.sex == "U" && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";})
			.attr("d", d3.symbol().size(function(d) { return (opts.symbol_size * opts.symbol_size) + 2;})
					.type(function(d) {
						if(d.data.miscarriage || d.data.termination)
							return d3.symbolTriangle;
						return d.data.sex == "F" ? d3.symbolCircle : d3.symbolSquare;}))
			.style("stroke", function (d) {
				return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
			})
			.style("stroke-width", function (d) {
				return d.data.age && d.data.yob && !d.data.exclude ? ".3em" : ".1em";
			})
			.style("stroke-dasharray", function (d) {return !d.data.exclude ? null : ("3, 3");})
			.style("fill", "none");

		// set a clippath
		node.append("clipPath")
			.attr("id", function (d) {return d.data.name;}).append("path")
			.filter(function (d) {return !(d.data.hidden && !opts.DEBUG);})
			.attr("class", "node")
			.attr("transform", function(d) {return d.data.sex == "U" && !(d.data.miscarriage || d.data.termination) ? "rotate(45)" : "";})
			.attr("d", d3.symbol().size(function(d) {
					if (d.data.hidden)
						return opts.symbol_size * opts.symbol_size / 5;
					return opts.symbol_size * opts.symbol_size;
				})
				.type(function(d) {
					if(d.data.miscarriage || d.data.termination)
						return d3.symbolTriangle;
					return d.data.sex == "F" ? d3.symbolCircle :d3.symbolSquare;}));

		// pie plots for disease colours
		var pienode = node.selectAll("pienode")
		   .data(function(d) {     		// set the disease data for the pie plot
			   var ncancers = 0;
			   var cancers = $.map(opts.diseases, function(val, i){
				   if(prefixInObj(opts.diseases[i].type, d.data)) {ncancers++; return 1;} else return 0;
			   });
			   if(ncancers === 0) cancers = [1];
			   return [$.map(cancers, function(val, i){
				   return {'cancer': val, 'ncancers': ncancers, 'id': d.data.name,
					   	   'sex': d.data.sex, 'proband': d.data.proband, 'hidden': d.data.hidden,
					   	   'affected': d.data.affected,
					   	   'exclude': d.data.exclude};})];
		   })
		   .enter()
		    .append("g");

		pienode.selectAll("path")
		    .data(d3.pie().value(function(d) {return d.cancer;}))
		    .enter().append("path")
		    	.attr("clip-path", function(d) {return "url(#"+d.data.id+")";}) // clip the rectangle
			    .attr("class", "pienode")
			    .attr("d", d3.arc().innerRadius(0).outerRadius(opts.symbol_size))
			    .style("fill", function(d, i) {
			    	if(d.data.exclude)
			    		return 'lightgrey';
			    	if(d.data.ncancers === 0) {
			    		if(d.data.affected)
			    			return 'darkgrey';
				    	return opts.node_background;
			    	}
			    	return opts.diseases[i].colour;
			    });

		// adopted in/out brackets
		node.append("path")
			.filter(function (d) {return !d.data.hidden && (d.data.adopted_in || d.data.adopted_out);})
			.attr("d", function(d) { {
				function get_bracket(dx, dy, indent) {
					return 	"M" + (dx+indent) + "," + dy +
							"L" + dx + " " + dy +
							"L" + dx + " " + (dy+(opts.symbol_size *  1.28)) +
							"L" + dx + " " + (dy+(opts.symbol_size *  1.28)) +
							"L" + (dx+indent) + "," + (dy+(opts.symbol_size *  1.28))
				}
				var dx = -(opts.symbol_size * 0.66);
				var dy = -(opts.symbol_size * 0.64);
				var indent = opts.symbol_size/4;
				return get_bracket(dx, dy, indent)+get_bracket(-dx, dy, -indent);
				}})
			.style("stroke", function (d) {
				return d.data.age && d.data.yob && !d.data.exclude ? "#303030" : "grey";
			})
			.style("stroke-width", function (d) {
				return ".1em";
			})
			.style("stroke-dasharray", function (d) {return !d.data.exclude ? null : ("3, 3");})
			.style("fill", "none");


		// alive status = 0; dead status = 1
		var status = node.append('line')
		.filter(function (d) {return d.data.status == 1;})
		    .style("stroke", "black")
		    .attr("x1", function(d, i) {return -0.6*opts.symbol_size;})
		    .attr("y1", function(d, i) {return 0.6*opts.symbol_size;})
		    .attr("x2", function(d, i) {return 0.6*opts.symbol_size;})
		    .attr("y2", function(d, i) {return -0.6*opts.symbol_size;});

		// names of individuals
		addLabel(opts, node, ".25em", -(0.4 * opts.symbol_size), -(0.1 * opts.symbol_size),
				function(d) {
					if(opts.DEBUG)
						return ('display_name' in d.data ? d.data.display_name : d.data.name) + '  ' + d.data.id;
					return 'display_name' in d.data ? d.data.display_name : '';});

/*		var warn = node.filter(function (d) {
    		return (!d.data.age || !d.data.yob) && !d.data.hidden;
		}).append("text")
		.attr('font-family', 'FontAwesome')
		.attr("x", ".25em")
		.attr("y", -(0.4 * opts.symbol_size), -(0.2 * opts.symbol_size))
		.html("\uf071");
		warn.append("svg:title").text("incomplete");*/

		var font_size = parseInt(getPx(opts.font_size)) + 4;
		// display label defined in opts.labels e.g. alleles/genotype data
		for(var ilab=0; ilab<opts.labels.length; ilab++) {
			var label = opts.labels[ilab];
			addLabel(opts, node, ".25em", -(0.7 * opts.symbol_size),
				function(d) {
					if(!d.data[label])
						return;
					d.y_offset = (ilab === 0 || !d.y_offset ? font_size*2.25 : d.y_offset+font_size);
					return d.y_offset;
				},
				function(d) {
					if(d.data[label]) {
						if(label === 'alleles') {
							var alleles = "";
							var vars = d.data.alleles.split(';');
							for(var ivar = 0;ivar < vars.length;ivar++) {
								if(vars[ivar] !== "") alleles += vars[ivar] + ';';
							}
							return alleles;
						} else if(label === 'age') {
							return d.data[label] +'y';
						} else if(label === 'stillbirth') {
							return "SB";
						}
						return d.data[label];
					}
				}, 'indi_details');
		}

		// individuals disease details
		for(var i=0;i<opts.diseases.length; i++) {
			var disease = opts.diseases[i].type;
			addLabel(opts, node, ".25em", -(opts.symbol_size),
					function(d) {
						var y_offset = (d.y_offset ? d.y_offset+font_size: font_size*2.2);
						for(var j=0;j<opts.diseases.length; j++) {
							if(disease === opts.diseases[j].type)
								break;
							if(prefixInObj(opts.diseases[j].type, d.data))
								y_offset += font_size-1;
						}
						return y_offset;
					},
					function(d) {
						var dis = disease.replace('_', ' ').replace('cancer', 'ca.');
						return disease+'_diagnosis_age' in d.data ? dis +": "+ d.data[disease+'_diagnosis_age'] : '';
					}, 'indi_details');
		}

		//
		widgets.addWidgets(opts, node);

		// links between partners
		var clash_depth = {};
		partners = ped.selectAll(".partner")
		  	.data(ptrLinkNodes)
		  	.enter()
		  		.insert("path", "g")
		  		.attr("fill", "none")
		  		.attr("stroke", "#000")
		  		.attr("shape-rendering", "auto")
		  		.attr('d', function(d, i) {
		  			var node1 = pedigree_util.getNodeByName(flattenNodes, d.mother.data.name);
		  			var node2 = pedigree_util.getNodeByName(flattenNodes, d.father.data.name);
		  			var consanguity = pedigree_util.consanguity(node1, node2, opts);
		  			var divorced = (d.mother.data.divorced &&  d.mother.data.divorced === d.father.data.name);

		  			var x1 = (d.mother.x < d.father.x ? d.mother.x : d.father.x);
	  				var x2 = (d.mother.x < d.father.x ? d.father.x : d.mother.x);
	  				var dy1 = d.mother.y;

	  				// identify clashes with other nodes at the same depth
		  			var clash = ptree.check_ptr_link_clashes(opts, d);
		  			var path = "";
		  			if(clash) {
		  				if(d.mother.depth in clash_depth)
		  					clash_depth[d.mother.depth] += 4;
		  				else
		  					clash_depth[d.mother.depth] = 4;

		  				dy1 -= clash_depth[d.mother.depth];
		  				var dx = clash_depth[d.mother.depth] + opts.symbol_size/2 + 2;

		  				var parent_nodes = d.mother.data.parent_node;
		  				var parent_node_name = parent_nodes[0];
		  				for(var ii=0; ii<parent_nodes.length; ii++) {
		  					if(parent_nodes[ii].father.name === d.father.data.name &&
		  					   parent_nodes[ii].mother.name === d.mother.data.name)
		  						 parent_node_name = parent_nodes[ii].name;
		  				}
		  				var parent_node = pedigree_util.getNodeByName(flattenNodes, parent_node_name);
						parent_node.y = dy1; // adjust hgt of parent node
		  				clash.sort(function (a,b) {return a - b;});

		  				var dy2 = (dy1-opts.symbol_size/2-3);
		  				// get path looping over node(s)
		  				draw_path = function(clash, dx, dy1, dy2, parent_node, cshift) {
			  				extend = function(i, l) {
			  					if(i+1 < l)   //  && Math.abs(clash[i] - clash[i+1]) < (opts.symbol_size*1.25)
			  						return extend(++i);
			  					return i;
			  				};
		  					var path = "";
			  				for(var j=0; j<clash.length; j++) {
			  					var k = extend(j, clash.length);
			  					var dx1 = clash[j] - dx - cshift;
			  					var dx2 = clash[k] + dx + cshift;
			  					if(parent_node.x > dx1 && parent_node.x < dx2)
			  						parent_node.y = dy2;

		  						path += "L" + dx1 + "," +  (dy1 - cshift) +
			  					        "L" + dx1 + "," +  (dy2 - cshift) +
			  					        "L" + dx2 + "," +  (dy2 - cshift) +
			  					        "L" + dx2 + "," +  (dy1 - cshift);
		  						j = k;
			  				}
			  				return path;
		  				}
		  				path = draw_path(clash, dx, dy1, dy2, parent_node, 0);
		  			}

		  			var divorce_path = "";
		  			if(divorced && !clash)
		  				divorce_path = "M" + (x1+((x2-x1)*.66)+6) + "," + (dy1-6) +
		  				               "L"+  (x1+((x2-x1)*.66)-6) + "," + (dy1+6) +
		  				               "M" + (x1+((x2-x1)*.66)+10) + "," + (dy1-6) +
		  				               "L"+  (x1+((x2-x1)*.66)-2)  + "," + (dy1+6);
		  			if(consanguity) {  // consanguinous, draw double line between partners
		  				dy1 = (d.mother.x < d.father.x ? d.mother.y : d.father.y);
		  				dy2 = (d.mother.x < d.father.x ? d.father.y : d.mother.y);

		  				var cshift = 3;
		  				if(Math.abs(dy1-dy2) > 0.1) {      // DIFFERENT LEVEL
		  					return	"M" + x1 + "," + dy1 + "L" + x2 + "," + dy2 +
	  				                "M" + x1 + "," + (dy1 - cshift) + "L" + x2 + "," + (dy2 - cshift);
		  				} else {                           // SAME LEVEL
			  				var path2 = (clash ? draw_path(clash, dx, dy1, dy2, parent_node, cshift) : "");
			  				return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 +
			  				        "M" + x1 + "," + (dy1 - cshift) + path2 + "L" + x2 + "," + (dy1 - cshift) + divorce_path;
		  				}
		  			}
		  			return	"M" + x1 + "," + dy1 + path + "L" + x2 + "," + dy1 + divorce_path;
		  		});

		// links to children
		var links = ped.selectAll(".link")
			.data(root.links(nodes.descendants()))
			.enter()
				.filter(function (d) {
					// filter unless debug is set
					return (opts.DEBUG ||
							(d.target.data.noparents === undefined && d.source.parent !== null && !d.target.data.hidden));
				})
				.insert("path", "g")
				.attr("fill", "none")
				.attr("stroke-width", function(d, i) {
					if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
						return 1;
					return (opts.DEBUG ? 2 : 1);
				})
				.attr("stroke", function(d, i) {
					if(d.target.data.noparents !== undefined || d.source.parent === null || d.target.data.hidden)
						return 'pink';
					return "#000";
				})
				.attr("stroke-dasharray", function(d, i) {
					if(!d.target.data.adopted_in) return null;
					var dash_len = Math.abs(d.source.y-((d.source.y + d.target.y) / 2));
					var dash_array = [dash_len, 0, Math.abs(d.source.x-d.target.x), 0];
					var twins = pedigree_util.getTwins(opts.dataset, d.target.data);
					if(twins.length >= 1) dash_len = dash_len * 3;
					for(var usedlen = 0; usedlen < dash_len; usedlen += 10)
						$.merge(dash_array, [5, 5]);
					return dash_array;
				})
				.attr("shape-rendering", function(d, i) {
					if(d.target.data.mztwin || d.target.data.dztwin)
						return "geometricPrecision";
					return "auto";
				})
				.attr("d", function(d, i) {
					if(d.target.data.mztwin || d.target.data.dztwin) {
						// get twin position
						var twins = pedigree_util.getTwins(opts.dataset, d.target.data);
						if(twins.length >= 1) {
							var twinx = 0;
							var xmin = d.target.x;
							var xmax = d.target.x;
							for(var t=0; t<twins.length; t++) {
								var thisx = pedigree_util.getNodeByName(flattenNodes, twins[t].name).x;
								if(xmin > thisx) xmin = thisx;
								if(xmax < thisx) xmax = thisx;
								twinx += thisx;
							}

							var xmid = ((d.target.x + twinx) / (twins.length+1));
							var ymid = ((d.source.y + d.target.y) / 2);

							var xhbar = "";
							if(xmin === d.target.x && d.target.data.mztwin) {
								// horizontal bar for mztwins
								var xx = (xmid + d.target.x)/2;
								var yy = (ymid + (d.target.y-opts.symbol_size/2))/2;
								xhbar = "M" + xx + "," + yy +
								     	"L" + (xmid + (xmid-xx)) + " " + yy;
							}

							return "M" + (d.source.x) + "," + (d.source.y ) +
						           "V" + ymid +
						           "H" + xmid +
						           "L" + (d.target.x) + " " + (d.target.y-opts.symbol_size/2) +
						           xhbar;
						}
					}

					if(d.source.data.mother) {   // check parents depth to see if they are at the same level in the tree
						var ma = pedigree_util.getNodeByName(flattenNodes, d.source.data.mother.name);
						var pa = pedigree_util.getNodeByName(flattenNodes, d.source.data.father.name);

						if(ma.depth !== pa.depth) {
							return "M" + (d.source.x) + "," + ((ma.y + pa.y) / 2) +
							       "H" + (d.target.x) +
						           "V" + (d.target.y);
						}
					}

					return "M" + (d.source.x) + "," + (d.source.y ) +
					       "V" + ((d.source.y + d.target.y) / 2) +
					       "H" + (d.target.x) +
					       "V" + (d.target.y);
				});

		// draw proband arrow
		var probandIdx  = pedigree_util.getProbandIndex(opts.dataset);
		if(typeof probandIdx !== 'undefined') {
			var probandNode = pedigree_util.getNodeByName(flattenNodes, opts.dataset[probandIdx].name);

			ped.append("svg:defs").append("svg:marker")    // arrow head
			    .attr("id", "triangle")
			    .attr("refX", 6)
			    .attr("refY", 6)
			    .attr("markerWidth", 20)
			    .attr("markerHeight", 20)
			    .attr("orient", "auto")
			    .append("path")
			    .attr("d", "M 0 0 12 6 0 12 3 6")
			    .style("fill", "black");

			ped.append("line")
		        .attr("x1", probandNode.x-opts.symbol_size)
		        .attr("y1", probandNode.y+opts.symbol_size)
		        .attr("x2", probandNode.x-opts.symbol_size/2)
		        .attr("y2", probandNode.y+opts.symbol_size/2)
		        .attr("stroke-width", 1)
		        .attr("stroke", "black")
		        .attr("marker-end", "url(#triangle)");
		}
		// drag and zoom
		zoom = d3.zoom()
		  .scaleExtent([opts.zoomIn, opts.zoomOut])
		  .on('zoom', zoomFn);

		function zoomFn() {
			var t = d3.event.transform;
			if(d3.event, t.x.toString().length > 10)	// IE fix for drag off screen
				return;
			var pos = [(t.x + parseInt(xtransform)), (t.y + parseInt(ytransform))];
			if(t.k == 1) {
				pedcache.setposition(opts, pos[0], pos[1]);
			} else {
				pedcache.setposition(opts, pos[0], pos[1], t.k);
			}
			ped.attr('transform', 'translate(' + pos[0] + ',' + pos[1] + ') scale(' + t.k + ')');
		}
		svg.call(zoom);
		return opts;
	};

	// validate pedigree data
	ptree.validate_pedigree = function(opts){
		if(opts.validate) {
			if (typeof opts.validate == 'function') {
				if(opts.DEBUG)
					console.log('CALLING CONFIGURED VALIDATION FUNCTION');
				return opts.validate.call(this, opts);;
		    }

			function create_err(err) {
				console.error(err);
				return new Error(err);
			}

			// check consistency of parents sex
			var uniquenames = [];
			var famids = [];
			for(var p=0; p<opts.dataset.length; p++) {
				if(!p.hidden) {
					if(opts.dataset[p].mother || opts.dataset[p].father) {
						var display_name = opts.dataset[p].display_name;
						if(!display_name)
							display_name = 'unnamed';
						display_name += ' (IndivID: '+opts.dataset[p].name+')';
						var mother = opts.dataset[p].mother;
						var father = opts.dataset[p].father;
						if(!mother || !father) {
							throw create_err('Missing parent for '+display_name);
						}

						var midx = pedigree_util.getIdxByName(opts.dataset, mother);
						var fidx = pedigree_util.getIdxByName(opts.dataset, father);
						if(midx === -1)
							throw create_err('The mother (IndivID: '+mother+') of family member '+
									         display_name+' is missing from the pedigree.');
						if(fidx === -1)
							throw create_err('The father (IndivID: '+father+') of family member '+
									         display_name+' is missing from the pedigree.');
						if(opts.dataset[midx].sex !== "F")
							throw create_err("The mother of family member "+display_name+
									" is not specified as female. All mothers in the pedigree must have sex specified as 'F'.");
						if(opts.dataset[fidx].sex !== "M")
							throw create_err("The father of family member "+display_name+
									" is not specified as male. All fathers in the pedigree must have sex specified as 'M'.");
					}
				}
				if(!opts.dataset[p].name)
					throw create_err(display_name+' has no IndivID.');
				if($.inArray(opts.dataset[p].name, uniquenames) > -1)
					throw create_err('IndivID for family member '+display_name+' is not unique.');
				uniquenames.push(opts.dataset[p].name);

				if($.inArray(opts.dataset[p].famid, famids) === -1 && opts.dataset[p].famid) {
					famids.push(opts.dataset[p].famid);
				}
			}

			if(famids.length > 1) {
				throw create_err('More than one family found: '+famids.join(", ")+'.');
			}
			// warn if there is a break in the pedigree
			var unconnected = ptree.unconnected(opts.dataset);
			if(unconnected.length > 0)
				console.warn("individuals unconnected to pedigree ", unconnected);
		}
	}

	// check if the object contains a key with a given prefix
	function prefixInObj(prefix, obj) {
		var found = false;
		if(obj)
			$.each(obj, function(k, n){
			    if(k.indexOf(prefix+"_") === 0 || k === prefix) {
			    	found = true;
			    	return found;
			    }
			});
		return found;
	}

	// return a list of individuals that aren't connected to the target
	ptree.unconnected = function(dataset){
		var target = dataset[ pedigree_util.getProbandIndex(dataset) ];
		if(!target){
			console.warn("No target defined");
			if(dataset.length == 0) {
				throw "empty pedigree data set";
			}
			target = dataset[0];
		}
        var connected = [target.name];
        var change = true;
        var ii = 0;
        while(change && ii < 200) {
        	ii++;
        	var nconnect = connected.length;
            $.each(dataset, function( idx, p ) {
            	if($.inArray( p.name, connected ) != -1) {
            		// check if this person or a partner has a parent
            		var ptrs = get_partners(dataset, p);
            		var has_parent = (p.name === target.name || !p.noparents);
            		for(var i=0; i<ptrs.length; i++){
            			if(!pedigree_util.getNodeByName(dataset, ptrs[i]).noparents)
            				has_parent = true;
            		}

            		if(has_parent){
	            		if(p.mother && $.inArray( p.mother, connected ) == -1)
	            			connected.push(p.mother);
	            		if(p.father && $.inArray( p.father, connected ) == -1)
	            			connected.push(p.father);
            		}
            	} else if( !p.noparents &&
            			  ((p.mother && $.inArray( p.mother, connected ) != -1) ||
            			   (p.father && $.inArray( p.father, connected ) != -1))){
            		connected.push(p.name);
            	}
        		// include any children
            	include_children(connected, p, dataset);
            });
            change = (nconnect != connected.length);
        }
        var names = $.map(dataset, function(val, i){return val.name;});
        return $.map(names, function(name, i){return $.inArray(name, connected) == -1 ? name : null;});
	};

	function include_children(connected, p, dataset) {
		if($.inArray( p.name, connected ) == -1)
			return;
		combineArrays(connected, get_partners(dataset, p));
		var children = pedigree_util.getAllChildren(dataset, p);
    	$.each(children, function( child_idx, child ) {
    		if($.inArray( child.name, connected ) == -1) {
    			connected.push(child.name);
    			combineArrays(connected, get_partners(dataset, child));
    		}
    	});
	}

	// combine arrays ignoring duplicates
	function combineArrays(arr1, arr2) {
	    for(var i=0; i<arr2.length; i++)
	    	if($.inArray( arr2[i], arr1 ) == -1) arr1.push(arr2[i]);
	}

	// check for crossing of partner lines
	function check_ptr_links(opts, ptrLinkNodes){
		for(var a=0; a<ptrLinkNodes.length; a++) {
			var clash = ptree.check_ptr_link_clashes(opts, ptrLinkNodes[a]);
			if(clash)
				console.log("CLASH :: "+ptrLinkNodes[a].mother.data.name+" "+ptrLinkNodes[a].father.data.name, clash);
		}
	}

	ptree.check_ptr_link_clashes = function(opts, anode) {
		var root = ptree.roots[opts.targetDiv];
		var flattenNodes = pedigree_util.flatten(root);
		var mother, father;
		if('name' in anode) {
			anode = pedigree_util.getNodeByName(flattenNodes, anode.name);
			if(!('mother' in anode.data))
				return null;
			mother = pedigree_util.getNodeByName(flattenNodes, anode.data.mother);
			father = pedigree_util.getNodeByName(flattenNodes, anode.data.father);
		} else {
			mother = anode.mother;
			father = anode.father;
		}

		var x1 = (mother.x < father.x ? mother.x : father.x);
		var x2 = (mother.x < father.x ? father.x : mother.x);
		var dy = mother.y;

		// identify clashes with other nodes at the same depth
  		var clash = $.map(flattenNodes, function(bnode, i){
  			return !bnode.data.hidden &&
  				    bnode.data.name !== mother.data.name &&  bnode.data.name !== father.data.name &&
  				    bnode.y == dy && bnode.x > x1 && bnode.x < x2 ? bnode.x : null;
  		});
  		return clash.length > 0 ? clash : null;
	};

	function get_svg_dimensions(opts) {
        return {'width' : (pbuttons.is_fullscreen()? window.innerWidth  : opts.width),
        	    'height': (pbuttons.is_fullscreen()? window.innerHeight : opts.height)};
	}

	ptree.get_tree_dimensions = function(opts) {
		/// get score at each depth used to adjust node separation
		var svg_dimensions = get_svg_dimensions(opts);
		var maxscore = 0;
		var generation = {};
		for(var i=0; i<opts.dataset.length; i++) {
			var depth = pedigree_util.getDepth(opts.dataset, opts.dataset[i].name);
			var children = pedigree_util.getAllChildren(opts.dataset, opts.dataset[i]);

			// score based on no. of children and if parent defined
			var score = 1 + (children.length > 0 ? 0.55+(children.length*0.25) : 0) + (opts.dataset[i].father ? 0.25 : 0);
			if(depth in generation)
				generation[depth] += score;
			else
				generation[depth] = score;

			if(generation[depth] > maxscore)
				maxscore = generation[depth];
		}

		var max_depth = Object.keys(generation).length*opts.symbol_size*3.5;
		var tree_width =  (svg_dimensions.width - opts.symbol_size > maxscore*opts.symbol_size*1.65 ?
				           svg_dimensions.width - opts.symbol_size : maxscore*opts.symbol_size*1.65);
		var tree_height = (svg_dimensions.height - opts.symbol_size > max_depth ?
		      		       svg_dimensions.height - opts.symbol_size : max_depth);
		return {'width': tree_width, 'height': tree_height};
	};

	// get the partners for a given node
	function get_partners(dataset, anode) {
		var ptrs = [];
		for(var i=0; i<dataset.length; i++) {
			var bnode = dataset[i];
			if(anode.name === bnode.mother && $.inArray(bnode.father, ptrs) == -1)
				ptrs.push(bnode.father);
			else if(anode.name === bnode.father && $.inArray(bnode.mother, ptrs) == -1)
				ptrs.push(bnode.mother);
		}
		return ptrs;
	}

	// group top_level nodes by their partners
	function group_top_level(dataset) {
		// var top_level = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? val : null;});
		// calculate top_level nodes
		for(var i=0;i<dataset.length;i++) {
			if(pedigree_util.getDepth(dataset, dataset[i].name) == 2)
				dataset[i].top_level = true;
		}

		var top_level = [];
        var top_level_seen = [];
        for(i=0;i<dataset.length;i++) {
        	var node = dataset[i];
        	if('top_level' in node && $.inArray(node.name, top_level_seen) == -1){
        		top_level_seen.push(node.name);
        		top_level.push(node);
        		var ptrs = get_partners(dataset, node);
        		for(var j=0; j<ptrs.length; j++){
        			if($.inArray(ptrs[j], top_level_seen) == -1) {
	        			top_level_seen.push(ptrs[j]);
	        			top_level.push(pedigree_util.getNodeByName(dataset, ptrs[j]));
        			}
        		}
        	}
        }

        var newdataset = $.map(dataset, function(val, i){return 'top_level' in val && val.top_level ? null : val;});
        for (i = top_level.length; i > 0; --i)
        	newdataset.unshift(top_level[i-1]);
        return newdataset;
	}

	// get height in pixels
	function getPx(emVal){
		if (emVal === parseInt(emVal, 10)) // test if integer
			return emVal;

		if(emVal.indexOf("px") > -1)
			return emVal.replace('px', '');
		else if(emVal.indexOf("em") === -1)
			return emVal;
		var adiv = $('<div style="display: none; font-size: '+emVal+'; margin: 0; padding:0; height: auto; line-height: 1; border:0;">&nbsp;</div>').appendTo('body');
		var hgt = adiv.height();
		adiv.remove();
		return hgt;
	};

	// Add label
	function addLabel(opts, node, size, fx, fy, ftext, class_label) {
		node.filter(function (d) {
    		return d.data.hidden && !opts.DEBUG ? false : true;
		}).append("text")
		.attr("class", class_label + ' ped_label' || "ped_label")
		.attr("x", fx)
		.attr("y", fy)
		//.attr("dy", size)
		.attr("font-family", opts.font_family)
		.attr("font-size", opts.font_size)
		.attr("font-weight", opts.font_weight)
		.text(ftext);
    }

	ptree.rebuild = function(opts) {
		$("#"+opts.targetDiv).empty();
		pedcache.add(opts);
		try {
			ptree.build(opts);
		} catch(e) {
			console.error(e);
			throw e;
		}

		try {
			templates.update(opts);
		} catch(e) {
			// templates not declared
		}
	};

	ptree.copy_dataset = function(dataset) {
		if(dataset[0].id) { // sort by id
			dataset.sort(function(a,b){return (!a.id || !b.id ? 0: (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0));});
		}

		var disallowed = ["id", "parent_node"];
		var newdataset = [];
		for(var i=0; i<dataset.length; i++){
			var obj = {};
			for(var key in dataset[i]) {
				if(disallowed.indexOf(key) == -1)
					obj[key] = dataset[i][key];
			}
			newdataset.push(obj);
		}
		return newdataset;
	};

	// add children to a given node
	ptree.addchild = function(dataset, node, sex, nchild, twin_type) {
		if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
			return new Error("INVALID TWIN TYPE SET: "+twin_type);

		if (typeof nchild === typeof undefined)
			nchild = 1;
		var children = pedigree_util.getAllChildren(dataset, node);
		var ptr_name, idx;
		if (children.length === 0) {
			var partner = ptree.addsibling(dataset, node, node.sex === 'F' ? 'M': 'F', node.sex === 'F');
			partner.noparents = true;
			ptr_name = partner.name;
			idx = pedigree_util.getIdxByName(dataset, node.name)+1;
		} else {
			var c = children[0];
			ptr_name = (c.father === node.name ? c.mother : c.father);
			idx = pedigree_util.getIdxByName(dataset, c.name);
		}

		if(twin_type)
			var twin_id = getUniqueTwinID(dataset, twin_type);
		var newchildren = [];
		for (var i = 0; i < nchild; i++) {
			var child = {"name": ptree.makeid(4), "sex": sex,
					     "mother": (node.sex === 'F' ? node.name : ptr_name),
				         "father": (node.sex === 'F' ? ptr_name : node.name)};
			dataset.splice(idx, 0, child);

			if(twin_type)
				child[twin_type] = twin_id;
			newchildren.push(child);
		}
		return newchildren;
	};

	//
	ptree.addsibling = function(dataset, node, sex, add_lhs, twin_type) {
		if(twin_type && $.inArray(twin_type, [ "mztwin", "dztwin" ] ) === -1)
			return new Error("INVALID TWIN TYPE SET: "+twin_type);

		var newbie = {"name": ptree.makeid(4), "sex": sex};
		if(node.top_level) {
			newbie.top_level = true;
		} else {
			newbie.mother = node.mother;
			newbie.father = node.father;
		}
		var idx = pedigree_util.getIdxByName(dataset, node.name);

		if(twin_type) {
			setMzTwin(dataset, dataset[idx], newbie, twin_type);
		}

		if(add_lhs) { // add to LHS
			if(idx > 0) idx--;
		} else
			idx++;
		dataset.splice(idx, 0, newbie);
		return newbie;
	};

	// set two siblings as twins
	function setMzTwin(dataset, d1, d2, twin_type) {
		if(!d1[twin_type]) {
			d1[twin_type] = getUniqueTwinID(dataset, twin_type);
			if(!d1[twin_type])
				return false;
		}
		d2[twin_type] = d1[twin_type];
		if(d1.yob)
			d2.yob = d1.yob;
		if(d1.age && (d1.status == 0 || !d1.status))
			d2.age = d1.age;
		return true;
	}

	// get a new unique twins ID, max of 10 twins in a pedigree
	function getUniqueTwinID(dataset, twin_type) {
		var mz = [1, 2, 3, 4, 5, 6, 7, 8, 9, "A"];
		for(var i=0; i<dataset.length; i++) {
			if(dataset[i][twin_type]) {
				var idx = mz.indexOf(dataset[i][twin_type]);
				if (idx > -1)
					mz.splice(idx, 1);
			}
		}
		if(mz.length > 0)
			return mz[0];
		return undefined;
	}

	// sync attributes of twins
	ptree.syncTwins = function(dataset, d1) {
		if(!d1.mztwin && !d1.dztwin)
			return;
		var twin_type = (d1.mztwin ? "mztwin" : "dztwin");
		for(var i=0; i<dataset.length; i++) {
			var d2 = dataset[i];
			if(d2[twin_type] && d1[twin_type] == d2[twin_type] && d2.name !== d1.name) {
				if(twin_type === "mztwin")
				  d2.sex = d1.sex;
				if(d1.yob)
					d2.yob = d1.yob;
				if(d1.age && (d1.status == 0 || !d1.status))
					d2.age = d1.age;
			}
		}
	};

	// check integrity twin settings
	function checkTwins(dataset) {
		var twin_types = ["mztwin", "dztwin"];
		for(var i=0; i<dataset.length; i++) {
			for(var j=0; j<twin_types.length; j++) {
				var twin_type = twin_types[j];
				if(dataset[i][twin_type]) {
					var count = 0;
					for(var j=0; j<dataset.length; j++) {
						if(dataset[j][twin_type] == dataset[i][twin_type])
							count++;
					}
					if(count < 2)
						delete dataset[i][[twin_type]];
				}
			}
		}
	}

	// add parents to the 'node'
	ptree.addparents = function(opts, dataset, name) {
		var mother, father;
		var root = ptree.roots[opts.targetDiv];
		var flat_tree = pedigree_util.flatten(root);
		var tree_node = pedigree_util.getNodeByName(flat_tree, name);
		var node  = tree_node.data;
		var depth = tree_node.depth;   // depth of the node in relation to the root (depth = 1 is a top_level node)

		var pid = -101;
		var ptr_name;
		var children = pedigree_util.getAllChildren(dataset, node);
		if(children.length > 0){
			ptr_name = children[0].mother == node.name ? children[0].father : children[0].mother;
			pid = pedigree_util.getNodeByName(flat_tree, ptr_name).data.id;
		}

		var i;
		if(depth == 1) {
			mother = {"name": ptree.makeid(4), "sex": "F", "top_level": true};
			father = {"name": ptree.makeid(4), "sex": "M", "top_level": true};
			dataset.splice(0, 0, mother);
			dataset.splice(0, 0, father);

			for(i=0; i<dataset.length; i++){
				if(dataset[i].top_level && dataset[i].name !== mother.name && dataset[i].name !== father.name){
					delete dataset[i].top_level;
					dataset[i].noparents = true;
					dataset[i].mother = mother.name;
					dataset[i].father = father.name;
				}
			}
		} else {
			var node_mother = pedigree_util.getNodeByName(flat_tree, tree_node.data.mother);
			var node_father = pedigree_util.getNodeByName(flat_tree, tree_node.data.father);
			var node_sibs = pedigree_util.getAllSiblings(dataset, node);

			// lhs & rhs id's for siblings of this node
			var rid = 10000;
			var lid = tree_node.data.id;
			for(i=0; i<node_sibs.length; i++){
				var sid = pedigree_util.getNodeByName(flat_tree, node_sibs[i].name).data.id;
				if(sid < rid && sid > tree_node.data.id)
					rid = sid;
				if(sid < lid)
					lid = sid;
			}
			var add_lhs = (lid >= tree_node.data.id || (pid == lid && rid < 10000));
			if(opts.DEBUG)
				console.log('lid='+lid+' rid='+rid+' nid='+tree_node.data.id+' ADD_LHS='+add_lhs);
			var midx;
			if( (!add_lhs && node_father.data.id > node_mother.data.id) ||
				(add_lhs && node_father.data.id < node_mother.data.id) )
				midx = pedigree_util.getIdxByName(dataset, node.father);
			else
				midx = pedigree_util.getIdxByName(dataset, node.mother);

			var parent = dataset[midx];
			father = ptree.addsibling(dataset, parent, 'M', add_lhs);
			mother = ptree.addsibling(dataset, parent, 'F', add_lhs);

			var faidx = pedigree_util.getIdxByName(dataset, father.name);
			var moidx = pedigree_util.getIdxByName(dataset, mother.name);
			if(faidx > moidx) {                   // switch to ensure father on lhs of mother
				var tmpfa = dataset[faidx];
				dataset[faidx] = dataset[moidx];
				dataset[moidx] = tmpfa;
			}

			var orphans = pedigree_util.getAdoptedSiblings(dataset, node);
			var nid = tree_node.data.id;
			for(i=0; i<orphans.length; i++){
				var oid = pedigree_util.getNodeByName(flat_tree, orphans[i].name).data.id;
				if(opts.DEBUG)
					console.log('ORPHAN='+i+' '+orphans[i].name+' '+(nid < oid && oid < rid)+' nid='+nid+' oid='+oid+' rid='+rid);
				if((add_lhs || nid < oid) && oid < rid){
					var oidx = pedigree_util.getIdxByName(dataset, orphans[i].name);
					dataset[oidx].mother = mother.name;
					dataset[oidx].father = father.name;
				}
			}
		}

		if(depth == 2) {
			mother.top_level = true;
			father.top_level = true;
		} else if(depth > 2) {
			mother.noparents = true;
			father.noparents = true;
		}
		var idx = pedigree_util.getIdxByName(dataset, node.name);
		dataset[idx].mother = mother.name;
		dataset[idx].father = father.name;
		delete dataset[idx].noparents;

		if('parent_node' in node) {
			var ptr_node = dataset[pedigree_util.getIdxByName(dataset, ptr_name)];
			if('noparents' in ptr_node) {
				ptr_node.mother = mother.name;
				ptr_node.father = father.name;
			}
		}
	};

	// add partner
	ptree.addpartner = function(opts, dataset, name) {
		var root = ptree.roots[opts.targetDiv];
		var flat_tree = pedigree_util.flatten(root);
		var tree_node = pedigree_util.getNodeByName(flat_tree, name);

		var partner = ptree.addsibling(dataset, tree_node.data, tree_node.data.sex === 'F' ? 'M' : 'F', tree_node.data.sex === 'F');
		partner.noparents = true;

		var child = {"name": ptree.makeid(4), "sex": "M"};
		child.mother = (tree_node.data.sex === 'F' ? tree_node.data.name : partner.name);
		child.father = (tree_node.data.sex === 'F' ? partner.name : tree_node.data.name);

		var idx = pedigree_util.getIdxByName(dataset, tree_node.data.name)+2;
		dataset.splice(idx, 0, child);
	};

	// get adjacent nodes at the same depth
	function adjacent_nodes(root, node, excludes) {
		var dnodes = pedigree_util.getNodesAtDepth(pedigree_util.flatten(root), node.depth, excludes);
		var lhs_node, rhs_node;
		for(var i=0; i<dnodes.length; i++) {
			if(dnodes[i].x < node.x)
				lhs_node = dnodes[i];
			if(!rhs_node && dnodes[i].x > node.x)
				rhs_node = dnodes[i];
		}
		return [lhs_node, rhs_node];
	}

	// delete a node and descendants
	ptree.delete_node_dataset = function(dataset, node, opts, onDone) {
		var root = ptree.roots[opts.targetDiv];
		var fnodes = pedigree_util.flatten(root);
		var deletes = [];
		var i, j;

		// get d3 data node
		if(node.id === undefined) {
			var d3node = pedigree_util.getNodeByName(fnodes, node.name);
			if(d3node !== undefined)
				node = d3node.data;
		}

		if(node.parent_node) {
			for(i=0; i<node.parent_node.length; i++){
				var parent = node.parent_node[i];
				var ps = [pedigree_util.getNodeByName(dataset, parent.mother.name),
					      pedigree_util.getNodeByName(dataset, parent.father.name)];
				// delete parents
				for(j=0; j<ps.length; j++) {
					if(ps[j].name === node.name || ps[j].noparents !== undefined || ps[j].top_level) {
						dataset.splice(pedigree_util.getIdxByName(dataset, ps[j].name), 1);
						deletes.push(ps[j]);
					}
				}

				var children = parent.children;
				var children_names = $.map(children, function(p, i){return p.name;});
				for(j=0; j<children.length; j++) {
					var child = pedigree_util.getNodeByName(dataset, children[j].name);
					if(child){
						child.noparents = true;
						var ptrs = get_partners(dataset, child);
						var ptr;
						if(ptrs.length > 0)
							ptr = pedigree_util.getNodeByName(dataset, ptrs[0]);
						if(ptr && ptr.mother !== child.mother) {
							child.mother = ptr.mother;
							child.father = ptr.father;
						} else if(ptr) {
							var child_node  = pedigree_util.getNodeByName(fnodes, child.name);
							var adj = adjacent_nodes(root, child_node, children_names);
							child.mother = adj[0] ? adj[0].data.mother : (adj[1] ? adj[1].data.mother : null);
							child.father = adj[0] ? adj[0].data.father : (adj[1] ? adj[1].data.father : null);
						} else {
							dataset.splice(pedigree_util.getIdxByName(dataset, child.name), 1);
						}
					}
				}
			}
		} else {
			dataset.splice(pedigree_util.getIdxByName(dataset, node.name), 1);
		}

		// delete ancestors
		console.log(deletes);
		for(i=0; i<deletes.length; i++) {
			var del = deletes[i];
			var sibs = pedigree_util.getAllSiblings(dataset, del);
			console.log('DEL', del.name, sibs);
			if(sibs.length < 1) {
				console.log('del sibs', del.name, sibs);
				var data_node  = pedigree_util.getNodeByName(fnodes, del.name);
				var ancestors = data_node.ancestors();
				for(j=0; j<ancestors.length; j++) {
					console.log(ancestors[i]);
					if(ancestors[j].data.mother){
						console.log('DELETE ', ancestors[j].data.mother, ancestors[j].data.father);
						dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.mother.name), 1);
						dataset.splice(pedigree_util.getIdxByName(dataset, ancestors[j].data.father.name), 1);
					}
				}
			}
		}
		// check integrity of mztwins settings
		checkTwins(dataset);

		try	{
			// validate new pedigree dataset
			var newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(dataset);
			ptree.validate_pedigree(newopts);
			// check if pedigree is split
			var unconnected = ptree.unconnected(dataset);
		} catch(err) {
			utils.messages('Warning', 'Deletion of this pedigree member is disallowed.')
			throw err;
		}
		if(unconnected.length > 0) {
			// check & warn only if this is a new split
			if(ptree.unconnected(opts.dataset).length === 0) {
				console.error("individuals unconnected to pedigree ", unconnected);
				utils.messages("Warning", "Deleting this will split the pedigree. Continue?", onDone, opts, dataset);
				return;
			}
		}

		if(onDone) {
			onDone(opts, dataset);
		}
		return dataset;
	};

	ptree.makeid = function(len) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	    for( var i=0; i < len; i++ )
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    return text;
	};

}(window.ptree = window.ptree || {}, jQuery));


// pedigree form
(function(pedigree_form, $, undefined) {

	$("#select_all_gene_tests").on('change', function (e) {
	    if(this.value === "S") {
	    	// select all mutation search to be negative
	    	$("#gene_test").find("select[name$='_gene_test']").val("S").change();
			$("#gene_test").find("select[name$='_gene_test_result']").val("N").change();
	    } else if(this.value === "T") {
	    	// select all direct gene tests to be negative
	    	$("#gene_test").find("select[name$='_gene_test']").val("T").change();
			$("#gene_test").find("select[name$='_gene_test_result']").val("N").change();
	    } else if(this.value === "N") {
	    	// select all gene tests to be negative
	    	$("#gene_test").find("select[name$='_gene_test_result']").val("N").change();
	    } else if(this.value === "reset") {
	    	$("#gene_test").find("select[name$='_gene_test']").val("-").change();
	    	$("#gene_test").find("select[name$='_gene_test_result']").val("-").change();
	    }
	});

	$('#acc_FamHist_div').on('click', '#id_proband, #id_exclude', function(e) {
		var name = $('#id_name').val();
		if($(this).attr("id") === 'id_proband' && $(this).is(':checked')) {
			var msg = "You are about to switch the index family member. Risk factor information (e.g. BMI "+
			          "etc) will be cleared for the current index. Ensure you have saved the pedigree file "+
			          "before continuing.";

			$('<div id="msgDialog">'+msg+'</div>').dialog({
	    		title: "WARNING - save before continuing",
	    		width: 350,
	    		buttons: {
		        	"Continue": function () {
		                $(this).dialog('close');
		                var dataset = pedcache.current(opts);
		                opts.dataset = ptree.copy_dataset(dataset);
		                pedigree_util.setProband(opts.dataset, name, true);
		                ptree.rebuild(opts);
		                reset_n_sync(opts);
		                $('#id_proband').prop("disabled", true);
		            },
		            "Cancel": function () {
		                $(this).dialog('close');
		                $("#id_proband").prop('checked', false);
		                $('#id_proband').prop("disabled", false);
		            }
	    		}
			});
		} else if($(this).attr("id") === 'id_exclude') {
			var dataset = pedcache.current(opts);
            opts.dataset = ptree.copy_dataset(dataset);
			var idx = pedigree_util.getIdxByName(opts.dataset, name);
			if($(this).is(':checked'))
				opts.dataset[idx].exclude = true;
			else
				delete opts.dataset[idx].exclude;
			ptree.rebuild(opts);
		}
	});

	pedigree_form.update = function(opts) {
		$('.node_save').click(function() {
			pedigree_form.save(opts);
		});

		// advanced options - model parameters
		$("input[id$='_mut_sensitivity'], input[id$='_mut_frequency']").prop('disabled', true);
		$('#id_use_custom_mutation_sensitivities').change(function() {
			$("input[id$='_mut_sensitivity']").prop('disabled', !$(this).is(":checked"));
		});

		$('#id_mutation_frequencies').change(function() {
			$("input[id$='_mut_frequency']").prop('disabled', (this.value !== 'Custom'));
			// note pedigree_form.mutation_frequencies is set in the view see pedigree_section_js.html
			if(pedigree_form.bc_mutation_frequencies && this.value !== 'Custom') {
				var bcmfreq = pedigree_form.bc_mutation_frequencies[this.value];
				for (var gene in bcmfreq)
					$('#id_'+gene.toLowerCase()+'_bc_mut_frequency').val(bcmfreq[gene]);

				var obcmfreq = pedigree_form.oc_mutation_frequencies[this.value];
				for (var gene in obcmfreq)
					$('#id_'+gene.toLowerCase()+'_oc_mut_frequency').val(obcmfreq[gene]);
			}

			if(this.value === 'Ashkenazi') {  // update canrisk FH radio settings
				$('#orig_ashk').prop( "checked", true );
			} else {
				$('#orig_unk').prop( "checked", true );
			}
			pedigree_form.save_ashkn(opts); // save ashkenazi updates
		});
	};

	// handle family history change events (undo/redo/delete)
	$(document).on('fhChange', function(e, opts){
		try {
			var id = $('#id_name').val();  // get name from hidden field
			var node = pedigree_util.getNodeByName(pedcache.current(opts), id)
			if(node === undefined)
				$('form > fieldset').prop("disabled", true);
			else
				$('form > fieldset').prop('disabled', false);
		} catch(err) {
			console.warn(err);
		}
    })

	pedigree_form.nodeclick = function(node) {
		$('form > fieldset').prop('disabled', false);
		// clear values
		$('#person_details').find("input[type=text], input[type=number]").val("");
		$('#person_details select').val('').prop('selected', true);

		// assign values to input fields in form
		if(node.sex === 'M' || node.sex === 'F')
			$('input[name=sex][value="'+node.sex+'"]').prop('checked', true);
		else
			$('input[name=sex]').prop('checked', false);
		update_cancer_by_sex(node);

		if(!('status' in node))
			node.status = 0;
		$('input[name=status][value="'+node.status+'"]').prop('checked', true);
		// show lock symbol for age and yob synchronisation
		$('#age_yob_lock').removeClass('fa-lock fa-unlock-alt');
		(node.status == 1 ? $('#age_yob_lock').addClass('fa-unlock-alt') : $('#age_yob_lock').addClass('fa-lock'))

		if('proband' in node) {
			$('#id_proband').prop('checked', node.proband);
			$('#id_proband').prop("disabled", true);
		} else {
			$('#id_proband').prop('checked', false);
			$('#id_proband').prop("disabled", !('yob' in node))
		}

		if('exclude' in node) {
			$('#id_exclude').prop('checked', node.exclude);
		} else {
			$('#id_exclude').prop('checked', false);
		}

/*		if('ashkenazi' in node) {
			$('#id_ashkenazi').prop('checked', (node.proband == 1 ? true: false));
		} else {
			$('#id_ashkenazi').prop('checked', false);
		}*/

		// year of birth
		if('yob' in node) {
			$('#id_yob_0').val(node.yob);
		} else {
			$('#id_yob_0').val('-');
		}

		// clear pathology
		$('select[name$="_bc_pathology"]').val('-');
		// clear gene tests
		$('select[name*="_gene_test"]').val('-');

		// disable sex radio buttons if the person has a partner
		$("input[id^='id_sex_']").prop("disabled", (node.parent_node && node.sex !== 'U' ? true : false));

		// disable pathology for male relatives (as not used by model)
		// and if no breast cancer age of diagnosis
		$("select[id$='_bc_pathology']").prop("disabled",
				(node.sex === 'M' || (node.sex === 'F' && !('breast_cancer_diagnosis_age' in node)) ? true : false));

		// approximate diagnosis age
		$('#id_approx').prop('checked', (node.approx_diagnosis_age ? true: false));
		pedigree_form.update_diagnosis_age_widget();

		for(var key in node) {
			if(key !== 'proband' && key !== 'sex') {
				if($('#id_'+key).length) {	// input value
					if(key.indexOf('_gene_test')  !== -1 && node[key] !== null && typeof node[key] === 'object') {
						$('#id_'+key).val(node[key].type);
						$('#id_'+key+'_result').val(node[key].result);
					} else {
						$('#id_'+key).val(node[key]);
					}
				} else if(key.indexOf('_diagnosis_age') !== -1) {
					if($("#id_approx").is(':checked')) {
						$('#id_'+key+'_1').val(round5(node[key])).prop('selected', true);
					} else {
						$('#id_'+key+'_0').val(node[key]);
					}
				}
			}
		}

		try {
			$('#person_details').find('form').valid();
		} catch(err) {
			console.warn('valid() not found');
		}
	};

	function update_ashkn(newdataset) {
		// Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
		if($('#orig_ashk').is(':checked')) {
			$.each(newdataset, function(i, p) {
				if(p.proband)
					p.ashkenazi = 1;
			});
		} else {
			$.each(newdataset, function(i, p) {
				delete p.ashkenazi;
			});
		}
	}

	// Save Ashkenazi status
	pedigree_form.save_ashkn = function(opts) {
		var dataset = pedcache.current(opts);
		var newdataset = ptree.copy_dataset(dataset);
		update_ashkn(newdataset);
		opts.dataset = newdataset;
		ptree.rebuild(opts);
	}

    pedigree_form.save = function(opts) {
		var dataset = pedcache.current(opts);
		var name = $('#id_name').val();
		var newdataset = ptree.copy_dataset(dataset);
		var person = pedigree_util.getNodeByName(newdataset, name);
		if(!person) {
			console.warn('person not found when saving details');
			return;
		}
		$("#"+opts.targetDiv).empty();

		// individual's personal and clinical details
		var yob = $('#id_yob_0').val();
		if(yob && yob !== '') {
			person.yob = yob;
		} else {
			delete person.yob;
		}

		// current status: 0 = alive, 1 = dead
		var status = $('#id_status').find("input[type='radio']:checked");
		if(status.length > 0){
			person.status = status.val();
		}

		// booleans switches
		var switches = ["miscarriage", "adopted_in", "adopted_out", "termination", "stillbirth"];
		for(var iswitch=0; iswitch<switches.length; iswitch++){
			var attr = switches[iswitch];
			var s = $('#id_'+attr);
			if(s.length > 0){
				console.log(s.is(":checked"));
				if(s.is(":checked"))
					person[attr] = true;
				else
					delete person[attr];
			}
		}

		// current sex
		var sex = $('#id_sex').find("input[type='radio']:checked");
		if(sex.length > 0){
			person.sex = sex.val();
			update_cancer_by_sex(person);
		}

		// Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
		update_ashkn(newdataset);

		if($('#id_approx').is(':checked')) // approximate diagnosis age
			person.approx_diagnosis_age = true;
		else
			delete person.approx_diagnosis_age;

		$("#person_details select[name*='_diagnosis_age']:visible, #person_details input[type=text]:visible, #person_details input[type=number]:visible").each(function() {
			var name = (this.name.indexOf("_diagnosis_age")>-1 ? this.name.substring(0, this.name.length-2): this.name);

			if($(this).val()) {
				var val = $(this).val();
				if(name.indexOf("_diagnosis_age") > -1 && $("#id_approx").is(':checked'))
					val = round5(val);
				person[name] = val;
			} else {
				delete person[name];
			}
        });

		// cancer checkboxes
		$('#person_details input[type="checkbox"][name$="cancer"],input[type="checkbox"][name$="cancer2"]').each(function() {
			if(this.checked)
				person[$(this).attr('name')] = true;
			else
				delete person[$(this).attr('name')];
		});

		// pathology tests
		$('#person_details select[name$="_bc_pathology"]').each(function() {
			if($(this).val() !== '-') {
				person[$(this).attr('name')] = $(this).val();
			} else {
				delete person[$(this).attr('name')];
			}
		});

		// genetic tests
		$('#person_details select[name$="_gene_test"]').each(function() {
			if($(this).val() !== '-') {
				var tres = $('select[name="'+$(this).attr('name')+'_result"]');
				person[$(this).attr('name')] = {'type': $(this).val(), 'result': $(tres).val()};
			} else {
				delete person[$(this).attr('name')];
			}
		});

		try {
			$('#person_details').find('form').valid();
		} catch(err) {
			console.warn('valid() not found');
		}

		ptree.syncTwins(newdataset, person);
		opts.dataset = newdataset;
		ptree.rebuild(opts);
    };

    pedigree_form.update_diagnosis_age_widget = function() {
		if($("#id_approx").is(':checked')) {
			$("[id$='_diagnosis_age_0']").each(function( index ) {
				if($(this).val() !== '') {
					var name = this.name.substring(0, this.name.length-2);
					$("#id_"+name+"_1").val(round5($(this).val())).prop('selected', true);
				}
			});

			$("[id$='_diagnosis_age_0']").hide();
			$("[id$='_diagnosis_age_1']").show();
		} else {
			$("[id$='_diagnosis_age_1']").each(function( index ) {
				if($(this).val() !== '') {
					var name = this.name.substring(0, this.name.length-2);
					$("#id_"+name+"_0").val($(this).val());
				}
			});

			$("[id$='_diagnosis_age_0']").show();
			$("[id$='_diagnosis_age_1']").hide();
		}
    };

    // males should not have ovarian cancer and females should not have prostate cancer
    function update_cancer_by_sex(node) {
		$('#cancer .row').show();
		if(node.sex === 'M') {
			delete node.ovarian_cancer_diagnosis_age;
			$("[id^='id_ovarian_cancer_diagnosis_age']").closest('.row').hide();
			$("[id^='id_breast_cancer2_diagnosis_age']").prop('disabled', true);
		} else if(node.sex === 'F') {
			delete node.prostate_cancer_diagnosis_age;
			$("[id^='id_prostate_cancer_diagnosis_age']").closest('.row').hide();
			$("[id^='id_breast_cancer2_diagnosis_age']").prop('disabled', false);
		}
    }

    // round to 5, 15, 25, 35 ....
    function round5(x1) {
    	var x2 = (Math.round((x1-1) / 10) * 10);
    	return (x1 < x2 ? x2 - 5 : x2 + 5);
    }

}(window.pedigree_form = window.pedigree_form || {}, jQuery));

//
// undo, redo, reset buttons
(function(pbuttons, $, undefined) {

	pbuttons.add = function(options) {
		var opts = $.extend({
            // defaults
			btn_target: 'pedigree_history'
        }, options );

		var btns = [{"fa": "fa-undo", "title": "undo"},
					{"fa": "fa-repeat", "title": "redo"},
					{"fa": "fa-refresh", "title": "reset"},
					{"fa": "fa-arrows-alt", "title": "fullscreen"}];
		var lis = "";
		for(var i=0; i<btns.length; i++) {
			lis += '<li">';
			lis += '&nbsp;<i class="fa fa-lg ' + btns[i].fa + '" ' +
			               (btns[i].fa == "fa-arrows-alt" ? 'id="fullscreen" ' : '') +
			               ' aria-hidden="true" title="'+ btns[i].title +'"></i>';
			lis += '</li>';
		}
		$( "#"+opts.btn_target ).append(lis);
		click(opts);
	};

	pbuttons.is_fullscreen = function(){
		return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement);
	};

	function click(opts) {
		// fullscreen
	    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function(e)  {
			var local_dataset = pedcache.current(opts);
	    	if (local_dataset !== undefined && local_dataset !== null) {
	    		opts.dataset = local_dataset;
	    	}
			ptree.rebuild(opts);
	    });

		$('#fullscreen').on('click', function(e) {
			if (!document.mozFullScreen && !document.webkitFullScreen) {
				var target = $("#"+opts.targetDiv)[0];
				if(target.mozRequestFullScreen)
					target.mozRequestFullScreen();
			    else
			    	target.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			} else {
				if(document.mozCancelFullScreen)
			        document.mozCancelFullScreen();
			    else
			    	document.webkitCancelFullScreen();
			}
		});

		// undo/redo/reset
		$( "#"+opts.btn_target ).on( "click", function(e) {
			e.stopPropagation();
			if($(e.target).hasClass("disabled"))
				return false;

			if($(e.target).hasClass('fa-undo')) {
				opts.dataset = pedcache.previous(opts);
				$("#"+opts.targetDiv).empty();
				ptree.build(opts);
			} else if ($(e.target).hasClass('fa-repeat')) {
				opts.dataset = pedcache.next(opts);
				$("#"+opts.targetDiv).empty();
				ptree.build(opts);
			} else if ($(e.target).hasClass('fa-refresh')) {
				$('<div id="msgDialog">Resetting the pedigree may result in loss of some data.</div>').dialog({
					title: 'Confirm Reset',
					resizable: false,
					height: "auto",
					width: 400,
					modal: true,
					buttons: {
						Continue: function() {
					    	pbuttons.reset(opts, opts.keep_proband_on_reset);
					    	$(this).dialog( "close" );
						},
						Cancel: function() {
							$(this).dialog( "close" );
							return;
					    }
					}
				});
			}
			// trigger fhChange event
			$(document).trigger('fhChange', [opts]);
		});
	}

	// reset pedigree and clear the history
	pbuttons.reset = function(opts, keep_proband) {
		if(keep_proband) {
			var local_dataset = pedcache.current(opts);
			var newdataset =  ptree.copy_dataset(local_dataset);
			var proband = newdataset[pedigree_util.getProbandIndex(newdataset)];
			//var children = pedigree_util.getChildren(newdataset, proband);
			proband.name = "ch1";
			proband.mother = "f21";
			proband.father = "m21";
			// clear pedigree data but keep proband data and risk factors
			pedcache.clear_pedigree_data(opts)
		} else {
			var proband = {
				"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"
			};
			pedcache.clear(opts); // clear all storage data
		}

		delete opts.dataset;

		var selected = $("input[name='default_fam']:checked");
		if(selected.length > 0 && selected.val() == 'extended2') {    // secondary relatives
        	opts.dataset = [
        		{"name":"wZA","sex":"M","top_level":true,"status":"0","display_name":"paternal grandfather"},
        		{"name":"MAk","sex":"F","top_level":true,"status":"0","display_name":"paternal grandmother"},
        		{"name":"zwB","sex":"M","top_level":true,"status":"0","display_name":"maternal grandfather"},
        		{"name":"dOH","sex":"F","top_level":true,"status":"0","display_name":"maternal grandmother"},
        		{"name":"MKg","sex":"F","mother":"MAk","father":"wZA","status":"0","display_name":"paternal aunt"},
        		{"name":"xsm","sex":"M","mother":"MAk","father":"wZA","status":"0","display_name":"paternal uncle"},
        		{"name":"m21","sex":"M","mother":"MAk","father":"wZA","status":"0","display_name":"father"},
        		{"name":"f21","sex":"F","mother":"dOH","father":"zwB","status":"0","display_name":"mother"},
        		{"name":"aOH","sex":"F","mother":"f21","father":"m21","status":"0","display_name":"sister"},
        		{"name":"Vha","sex":"M","mother":"f21","father":"m21","status":"0","display_name":"brother"},
        		{"name":"Spj","sex":"M","mother":"f21","father":"m21","noparents":true,"status":"0","display_name":"partner"},
        		proband,
        		//{"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"},
        		{"name":"zhk","sex":"F","mother":"ch1","father":"Spj","status":"0","display_name":"daughter"},
        		{"name":"Knx","display_name":"son","sex":"M","mother":"ch1","father":"Spj","status":"0"},
        		{"name":"uuc","display_name":"maternal aunt","sex":"F","mother":"dOH","father":"zwB","status":"0"},
        		{"name":"xIw","display_name":"maternal uncle","sex":"M","mother":"dOH","father":"zwB","status":"0"}];
		} else if(selected.length > 0 && selected.val() == 'extended1') {    // primary relatives
			opts.dataset = [
				{"name":"m21","sex":"M","mother":null,"father":null,"status":"0","display_name":"father","noparents":true},
				{"name":"f21","sex":"F","mother":null,"father":null,"status":"0","display_name":"mother","noparents":true},
				{"name":"aOH","sex":"F","mother":"f21","father":"m21","status":"0","display_name":"sister"},
				{"name":"Vha","sex":"M","mother":"f21","father":"m21","status":"0","display_name":"brother"},
				{"name":"Spj","sex":"M","mother":"f21","father":"m21","noparents":true,"status":"0","display_name":"partner"},
				proband,
				//{"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"},
				{"name":"zhk","sex":"F","mother":"ch1","father":"Spj","status":"0","display_name":"daughter"},
				{"name":"Knx","display_name":"son","sex":"M","mother":"ch1","father":"Spj","status":"0"}];
		} else {
			opts.dataset = [
				{"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
    		    {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
    		    proband];
    			//{"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}];
		}
		ptree.rebuild(opts);
	}

	pbuttons.updateButtons = function(opts) {
		var current = pedcache.get_count(opts);
		var nstore = pedcache.nstore(opts);
		var id = "#"+opts.btn_target;
		if(nstore <= current)
			$(id+" .fa-repeat").addClass('disabled');
		else
			$(id+" .fa-repeat").removeClass('disabled');

		if(current > 1)
			$(id+" .fa-undo").removeClass('disabled');
		else
			$(id+" .fa-undo").addClass('disabled');
	};
}(window.pbuttons = window.pbuttons || {}, jQuery));

//
//store a history of pedigree
(function(pedcache, $, undefined) {
	var count = 0;
	var max_limit = 25;
	var dict_cache = {};

	// test if browser storage is supported
	function has_browser_storage(opts) {
	    try {
	    	if(opts.store_type === 'array')
	    		return false;

	    	if(opts.store_type !== 'local' && opts.store_type !== 'session' && opts.store_type !== undefined)
	    		return false;

	    	var mod = 'test';
	        localStorage.setItem(mod, mod);
	        localStorage.removeItem(mod);
	        return true;
	    } catch(e) {
	        return false;
	    }
	}

	function get_prefix(opts) {
		return "PEDIGREE_"+opts.btn_target+"_";
	}

	// use dict_cache to store cache as an array
	function get_arr(opts) {
		return dict_cache[get_prefix(opts)];
	}

	function get_browser_store(opts, item) {
		if(opts.store_type === 'local')
			return localStorage.getItem(item);
		else
			return sessionStorage.getItem(item);
	}

	function set_browser_store(opts, name, item) {
		if(opts.store_type === 'local')
			return localStorage.setItem(name, item);
		else
			return sessionStorage.setItem(name, item);
	}

	// clear all storage items
	function clear_browser_store(opts) {
		if(opts.store_type === 'local')
			return localStorage.clear();
		else
			return sessionStorage.clear();
	}

	// remove all storage items with keys that have the pedigree history prefix
	pedcache.clear_pedigree_data = function(opts) {
		var prefix = get_prefix(opts);
		var store = (opts.store_type === 'local' ? localStorage : sessionStorage);
		var items = [];
		for(var i = 0; i < store.length; i++){
			if(store.key(i).indexOf(prefix) == 0)
				items.push(store.key(i));
		}
		for(var i = 0; i < items.length; i++)
			store.removeItem(items[i]);
	}

	pedcache.get_count = function(opts) {
		var count;
		if (has_browser_storage(opts))
			count = get_browser_store(opts, get_prefix(opts)+'COUNT');
		else
			count = dict_cache[get_prefix(opts)+'COUNT'];
		if(count !== null && count !== undefined)
			return count;
		return 0;
	};

	function set_count(opts, count) {
		if (has_browser_storage(opts))
			set_browser_store(opts, get_prefix(opts)+'COUNT', count);
		else
			dict_cache[get_prefix(opts)+'COUNT'] = count;
	}

	pedcache.add = function(opts) {
		if(!opts.dataset)
			return;
		var count = pedcache.get_count(opts);
		if (has_browser_storage(opts)) {   // local storage
			set_browser_store(opts, get_prefix(opts)+count, JSON.stringify(opts.dataset));
		} else {   // TODO :: array cache
			console.warn('Local storage not found/supported for this browser!', opts.store_type);
			max_limit = 500;
			if(get_arr(opts) === undefined)
				dict_cache[get_prefix(opts)] = [];
			get_arr(opts).push(JSON.stringify(opts.dataset));
		}
		if(count < max_limit)
			count++;
		else
			count = 0;
		set_count(opts, count);
	};

	pedcache.nstore = function(opts) {
		if(has_browser_storage(opts)) {
			for(var i=max_limit; i>0; i--) {
				if(get_browser_store(opts, get_prefix(opts)+(i-1)) !== null)
					return i;
			}
		} else {
			return (get_arr(opts) && get_arr(opts).length > 0 ? get_arr(opts).length : -1);
		}
		return -1;
	};

	pedcache.current = function(opts) {
		var current = pedcache.get_count(opts)-1;
		if(current == -1)
			current = max_limit-1;
		if(has_browser_storage(opts))
			return JSON.parse(get_browser_store(opts, get_prefix(opts)+current));
		else if(get_arr(opts))
			return JSON.parse(get_arr(opts)[current]);
	};

	pedcache.last = function(opts) {
		if(has_browser_storage(opts)) {
			for(var i=max_limit; i>0; i--) {
				var it = get_browser_store(opts, get_prefix(opts)+(i-1));
				if(it !== null) {
					set_count(opts, i);
					return JSON.parse(it);
				}
			}
		} else {
			var arr = get_arr(opts);
			if(arr)
				return JSON.parse(arr(arr.length-1));
		}
		return undefined;
	};

	pedcache.previous = function(opts, previous) {
		if(previous === undefined)
			previous = pedcache.get_count(opts) - 2;

		if(previous < 0) {
			var nstore = pedcache.nstore(opts);
			if(nstore < max_limit)
				previous = nstore - 1;
			else
				previous = max_limit - 1;
		}
		set_count(opts, previous + 1);
		if(has_browser_storage(opts))
			return JSON.parse(get_browser_store(opts, get_prefix(opts)+previous));
		else
			return JSON.parse(get_arr(opts)[previous]);
	};

	pedcache.next = function(opts, next) {
		if(next === undefined)
			next = pedcache.get_count(opts);
		if(next >= max_limit)
			next = 0;

		set_count(opts, parseInt(next) + 1);
		if(has_browser_storage(opts))
			return JSON.parse(get_browser_store(opts, get_prefix(opts)+next));
		else
			return JSON.parse(get_arr(opts)[next]);
	};

	pedcache.clear = function(opts) {
		if(has_browser_storage(opts))
			clear_browser_store(opts);
		dict_cache = {};
	};

	// zoom - store translation coords
	pedcache.setposition = function(opts, x, y, zoom) {
		if(has_browser_storage(opts)) {
			set_browser_store(opts, get_prefix(opts)+'_X', x);
			set_browser_store(opts, get_prefix(opts)+'_Y', y);
			if(zoom)
				set_browser_store(opts, get_prefix(opts)+'_ZOOM', zoom);
		} else {
			//TODO
		}
	};

	pedcache.getposition = function(opts) {
		if(!has_browser_storage(opts) ||
			(localStorage.getItem(get_prefix(opts)+'_X') === null &&
			 sessionStorage.getItem(get_prefix(opts)+'_X') === null))
			return [null, null];
		var pos = [parseInt(get_browser_store(opts, get_prefix(opts)+'_X')),
			   	   parseInt(get_browser_store(opts, get_prefix(opts)+'_Y'))];
		if(get_browser_store(get_prefix(opts)+'_ZOOM') !== null)
			pos.push(parseFloat(get_browser_store(opts, get_prefix(opts)+'_ZOOM')));
		return pos;
	};

}(window.pedcache = window.pedcache || {}, jQuery));


// pedigree widgets
(function(widgets, $, undefined) {

	function getTranslation(transform) {
    	  // Create a dummy g for calculation purposes only. This will never
    	  // be appended to the DOM and will be discarded once this function
    	  // returns.
    	  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    	  // Set the transform attribute to the provided string value.
    	  g.setAttributeNS(null, "transform", transform);

    	  // consolidate the SVGTransformList containing all transformations
    	  // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    	  // its SVGMatrix.
    	  var matrix = g.transform.baseVal.consolidate().matrix;

    	  // As per definition values e and f are the ones for the translation.
    	  return [matrix.e, matrix.f];
    	}

	var dragging;
	var last_mouseover;
	//
	// Add widgets to nodes and bind events
    widgets.addWidgets = function(opts, node) {

    	// popup gender selection box
    	var font_size = parseInt($("body").css('font-size'));
    	var popup_selection = d3.select('.diagram');
    	popup_selection.append("rect").attr("class", "popup_selection")
    							.attr("rx", 6)
    							.attr("ry", 6)
    							.attr("transform", "translate(-1000,-100)")
    							.style("opacity", 0)
    							.attr("width",  font_size*7.9)
    							.attr("height", font_size*2)
    							.style("stroke", "darkgrey")
    							.attr("fill", "white");

		var square = popup_selection.append("text")  // male
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.em' )
			.attr("class", "popup_selection fa-lg fa-square persontype")
			.attr("transform", "translate(-1000,-100)")
			.attr("x", font_size/3)
			.attr("y", font_size*1.5)
			.text("\uf096 ");
		var square_title = square.append("svg:title").text("add male");

		var circle = popup_selection.append("text")  // female
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.em' )
			.attr("class", "popup_selection fa-lg fa-circle persontype")
			.attr("transform", "translate(-1000,-100)")
			.attr("x", font_size*1.7)
			.attr("y", font_size*1.5)
			.text("\uf10c ");
		var circle_title = circle.append("svg:title").text("add female");

		var unspecified = popup_selection.append("text")  // unspecified
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr('font-size', '1.em' )
			.attr("transform", "translate(-1000,-100)")
			.attr("class", "popup_selection fa-lg fa-unspecified popup_selection_rotate45 persontype")
			.text("\uf096 ");
		var unspecified_title = unspecified.append("svg:title").text("add unspecified");

		var dztwin = popup_selection.append("text")  // dizygotic twins
			.attr('font-family', 'FontAwesome')
			.style("opacity", 0)
			.attr("transform", "translate(-1000,-100)")
			.attr("class", "popup_selection fa-2x fa-angle-up persontype dztwin")
			.attr("x", font_size*4.6)
			.attr("y", font_size*1.5)
			.text("\uf106 ");
		var dztwin_title = dztwin.append("svg:title").text("add dizygotic/fraternal twins");

		var mztwin = popup_selection.append("text")  // monozygotic twins
		.attr('font-family', 'FontAwesome')
		.style("opacity", 0)
		.attr("transform", "translate(-1000,-100)")
		.attr("class", "popup_selection fa-2x fa-caret-up persontype mztwin")
		.attr("x", font_size*6.2)
		.attr("y", font_size*1.5)
		.text("\uf0d8");
		var mztwin_title = mztwin.append("svg:title").text("add monozygotic/identical twins");

		var add_person = {};
		// click the person type selection
		d3.selectAll(".persontype")
		  .on("click", function () {
			var newdataset = ptree.copy_dataset(pedcache.current(opts));
			var mztwin = d3.select(this).classed("mztwin");
			var dztwin = d3.select(this).classed("dztwin");
			var twin_type;
			var sex;
			if(mztwin || dztwin) {
				sex = add_person.node.datum().data.sex;
				twin_type = (mztwin ? "mztwin" : "dztwin");
			} else {
				sex = d3.select(this).classed("fa-square") ? 'M' : (d3.select(this).classed("fa-circle") ? 'F' : 'U');
			}

			if(add_person.type === 'addsibling')
				ptree.addsibling(newdataset, add_person.node.datum().data, sex, false, twin_type);
			else if(add_person.type === 'addchild')
				ptree.addchild(newdataset, add_person.node.datum().data, (twin_type ? 'U' : sex), (twin_type ? 2 : 1), twin_type);
			else
				return;
			opts.dataset = newdataset;
			ptree.rebuild(opts);
			d3.selectAll('.popup_selection').style("opacity", 0);
			add_person = {};
		  })
		  .on("mouseover", function() {
			  if(add_person.node)
				  add_person.node.select('rect').style("opacity", 0.2);
			  d3.selectAll('.popup_selection').style("opacity", 1);
			  // add tooltips to font awesome widgets
			  if(add_person.type === 'addsibling'){
				 if(d3.select(this).classed("fa-square"))
					  square_title.text("add brother");
				  else
					  circle_title.text("add sister");
			  } else if(add_person.type === 'addchild'){
				  if(d3.select(this).classed("fa-square"))
					  square_title.text("add son");
				  else
					  circle_title.text("add daughter");
			  }
		  });

		// handle mouse out of popup selection
		d3.selectAll(".popup_selection").on("mouseout", function () {
			// hide rect and popup selection
			if(add_person.node !== undefined && highlight.indexOf(add_person.node.datum()) == -1)
				add_person.node.select('rect').style("opacity", 0);
			d3.selectAll('.popup_selection').style("opacity", 0);
		});


		// drag line between nodes to create partners
		drag_handle(opts);

		// rectangle used to highlight on mouse over
		node.append("rect")
			.filter(function (d) {
			    return d.data.hidden && !opts.DEBUG ? false : true;
			})
			.attr("class", 'indi_rect')
			.attr("rx", 6)
			.attr("ry", 6)
			.attr("x", function(d) { return - 0.75*opts.symbol_size; })
			.attr("y", function(d) { return - opts.symbol_size; })
			.attr("width",  (1.5 * opts.symbol_size)+'px')
			.attr("height", (2 * opts.symbol_size)+'px')
			.style("stroke", "black")
			.style("stroke-width", 0.7)
			.style("opacity", 0)
			.attr("fill", "lightgrey");

		// widgets
		var fx = function(d) {return off - 0.75*opts.symbol_size;};
		var fy = opts.symbol_size -2;
		var off = 0;
		var widgets = {
			'addchild':   {'text': '\uf063', 'title': 'add child',   'fx': fx, 'fy': fy},
			'addsibling': {'text': '\uf234', 'title': 'add sibling', 'fx': fx, 'fy': fy},
			'addpartner': {'text': '\uf0c1', 'title': 'add partner', 'fx': fx, 'fy': fy},
			'addparents': {
				'text': '\uf062', 'title': 'add parents',
				'fx': - 0.75*opts.symbol_size,
				'fy': - opts.symbol_size + 11
			},
			'delete': {
				'text': 'X', 'title': 'delete',
				'fx': opts.symbol_size/2 - 1,
				'fy': - opts.symbol_size + 12,
				'styles': {"font-weight": "bold", "fill": "darkred", "font-family": "monospace"}
			}
		};

		if(opts.edit) {
			widgets.settings = {'text': '\uf013', 'title': 'settings', 'fx': -font_size/2+2, 'fy': -opts.symbol_size + 11};
		}

		for(var key in widgets) {
			var widget = node.append("text")
				.filter(function (d) {
			    	return  (d.data.hidden && !opts.DEBUG ? false : true) &&
			    	       !((d.data.mother === undefined || d.data.noparents) && key === 'addsibling') &&
			    	       !(d.data.parent_node !== undefined && d.data.parent_node.length > 1 && key === 'addpartner') &&
			    	       !(d.data.parent_node === undefined && key === 'addchild') &&
			    	       !((d.data.noparents === undefined && d.data.top_level === undefined) && key === 'addparents');
				})
				.attr("class", key)
				.style("opacity", 0)
				.attr('font-family', 'FontAwesome')
				.attr("xx", function(d){return d.x;})
				.attr("yy", function(d){return d.y;})
				.attr("x", widgets[key].fx)
				.attr("y", widgets[key].fy)
				.attr('font-size', '0.9em' )
				.text(widgets[key].text);

			if('styles' in widgets[key])
				for(var style in widgets[key].styles){
					widget.attr(style, widgets[key].styles[style]);
				}

			widget.append("svg:title").text(widgets[key].title);
			off += 17;
		}

		// add sibling or child
		d3.selectAll(".addsibling, .addchild")
		  .on("mouseover", function () {
			  var type = d3.select(this).attr('class');
			  d3.selectAll('.popup_selection').style("opacity", 1);
			  add_person = {'node': d3.select(this.parentNode), 'type': type};

			  //var translate = getTranslation(d3.select('.diagram').attr("transform"));
			  var x = parseInt(d3.select(this).attr("xx")) + parseInt(d3.select(this).attr("x"));
			  var y = parseInt(d3.select(this).attr("yy")) + parseInt(d3.select(this).attr("y"));
			  d3.selectAll('.popup_selection').attr("transform", "translate("+x+","+(y+2)+")");
			  d3.selectAll('.popup_selection_rotate45')
			  	.attr("transform", "translate("+(x+3*font_size)+","+(y+(font_size*1.2))+") rotate(45)");
		  });

		// handle widget clicks
		d3.selectAll(".addchild, .addpartner, .addparents, .delete, .settings")
		  .on("click", function () {
			d3.event.stopPropagation();
			var opt = d3.select(this).attr('class');
			var d = d3.select(this.parentNode).datum();
			if(opts.DEBUG) {
				console.log(opt);
			}

			var newdataset;
			if(opt === 'settings') {
				if(typeof opts.edit === 'function') {
					opts.edit(opts, d);
				} else {
					openEditDialog(opts, d);
				}
			} else if(opt === 'delete') {
				newdataset = ptree.copy_dataset(pedcache.current(opts));
				function onDone(opts, dataset) {
					// assign new dataset and rebuild pedigree
					opts.dataset = dataset;
					ptree.rebuild(opts);
				}
				ptree.delete_node_dataset(newdataset, d.data, opts, onDone);
			} else if(opt === 'addparents') {
				newdataset = ptree.copy_dataset(pedcache.current(opts));
				opts.dataset = newdataset;
				ptree.addparents(opts, newdataset, d.data.name);
				ptree.rebuild(opts);
			} else if(opt === 'addpartner') {
				newdataset = ptree.copy_dataset(pedcache.current(opts));
				ptree.addpartner(opts, newdataset, d.data.name);
				opts.dataset = newdataset;
				ptree.rebuild(opts);
			}
			// trigger fhChange event
			$(document).trigger('fhChange', [opts]);
		});

		// other mouse events
		var highlight = [];

		node.filter(function (d) { return !d.data.hidden; })
		.on("click", function (d) {
			if (d3.event.ctrlKey) {
				if(highlight.indexOf(d) == -1)
					highlight.push(d);
				else
					highlight.splice(highlight.indexOf(d), 1);
			} else
				highlight = [d];

			if('nodeclick' in opts) {
				opts.nodeclick(d.data);
				d3.selectAll(".indi_rect").style("opacity", 0);
				d3.selectAll('.indi_rect').filter(function(d) {return highlight.indexOf(d) != -1;}).style("opacity", 0.5);
			}
     	})
		.on("mouseover", function(d){
			d3.event.stopPropagation();
			last_mouseover = d;
			if(dragging) {
				if(dragging.data.name !== last_mouseover.data.name &&
				   dragging.data.sex !== last_mouseover.data.sex) {
					d3.select(this).select('rect').style("opacity", 0.2);
				}
				return;
			}
			d3.select(this).select('rect').style("opacity", 0.2);
			d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 1);
			d3.select(this).selectAll('.indi_details').style("opacity", 0);
			setLineDragPosition(opts.symbol_size-10, 0, opts.symbol_size-2, 0, d.x+","+(d.y+2));
		})
		.on("mouseout", function(d){
			if(dragging)
				return;

			d3.select(this).selectAll('.addchild, .addsibling, .addpartner, .addparents, .delete, .settings').style("opacity", 0);
			if(highlight.indexOf(d) == -1)
				d3.select(this).select('rect').style("opacity", 0);
			d3.select(this).selectAll('.indi_details').style("opacity", 1);
			// hide popup if it looks like the mouse is moving north
	        if(d3.mouse(this)[1] < 0.8*opts.symbol_size)
	        	d3.selectAll('.popup_selection').style("opacity", 0);
	        if(!dragging) {
	        	// hide popup if it looks like the mouse is moving north, south or west
	        	if(Math.abs(d3.mouse(this)[1]) > 0.25*opts.symbol_size ||
	        	   Math.abs(d3.mouse(this)[1]) < -0.25*opts.symbol_size ||
	        	   d3.mouse(this)[0] < 0.2*opts.symbol_size){
	        		setLineDragPosition(0, 0, 0, 0);
	        	}
	        }
		});
	};

	// drag line between nodes to create partners
	function drag_handle(opts) {
		var line_drag_selection = d3.select('.diagram');
		var dline = line_drag_selection.append("line").attr("class", 'line_drag_selection')
	        .attr("stroke-width", 6)
	        .style("stroke-dasharray", ("2, 1"))
	        .attr("stroke","black")
	        .call(d3.drag()
	                .on("start", dragstart)
	                .on("drag", drag)
	                .on("end", dragstop));
		dline.append("svg:title").text("drag to create consanguineous partners");

		setLineDragPosition(0, 0, 0, 0);

		function dragstart(d) {
			d3.event.sourceEvent.stopPropagation();
			dragging = last_mouseover;
			d3.selectAll('.line_drag_selection')
				.attr("stroke","darkred");
		}

		function dragstop(d) {
			if(last_mouseover &&
			   dragging.data.name !== last_mouseover.data.name &&
			   dragging.data.sex  !== last_mouseover.data.sex) {
				// make partners
				var child = {"name": ptree.makeid(4), "sex": 'U',
					     "mother": (dragging.data.sex === 'F' ? dragging.data.name : last_mouseover.data.name),
				         "father": (dragging.data.sex === 'F' ? last_mouseover.data.name : dragging.data.name)};
				newdataset = ptree.copy_dataset(opts.dataset);
				opts.dataset = newdataset;

				var idx = pedigree_util.getIdxByName(opts.dataset, dragging.data.name)+1;
				opts.dataset.splice(idx, 0, child);
				ptree.rebuild(opts);
			}
			setLineDragPosition(0, 0, 0, 0);
			d3.selectAll('.line_drag_selection')
				.attr("stroke","black");
			dragging = undefined;
			return;
		}

		function drag(d) {
			d3.event.sourceEvent.stopPropagation();
			var dx = d3.event.dx;
			var dy = d3.event.dy;
            var xnew = parseFloat(d3.select(this).attr('x2'))+ dx;
            var ynew = parseFloat(d3.select(this).attr('y2'))+ dy;
            setLineDragPosition(opts.symbol_size-10, 0, xnew, ynew);
		}
	}

	function setLineDragPosition(x1, y1, x2, y2, translate) {
		if(translate)
			d3.selectAll('.line_drag_selection').attr("transform", "translate("+translate+")");
		d3.selectAll('.line_drag_selection')
	    	.attr("x1", x1)
	    	.attr("y1", y1)
	    	.attr("x2", x2)
	        .attr("y2", y2);
	}

	function capitaliseFirstLetter(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
	}

    // if opt.edit is set true (rather than given a function) this is called to edit node attributes
    function openEditDialog(opts, d) {
		$('#node_properties').dialog({
		    autoOpen: false,
		    title: d.data.display_name,
		    width: ($(window).width() > 400 ? 450 : $(window).width()- 30)
		});

		var table = "<table id='person_details' class='table'>";

		table += "<tr><td style='text-align:right'>Unique ID</td><td><input class='form-control' type='text' id='id_name' name='name' value="+
		(d.data.name ? d.data.name : "")+"></td></tr>";
		table += "<tr><td style='text-align:right'>Name</td><td><input class='form-control' type='text' id='id_display_name' name='display_name' value="+
				(d.data.display_name ? d.data.display_name : "")+"></td></tr>";

		table += "<tr><td style='text-align:right'>Age</td><td><input class='form-control' type='number' id='id_age' min='0' max='120' name='age' style='width:7em' value="+
				(d.data.age ? d.data.age : "")+"></td></tr>";

		table += "<tr><td style='text-align:right'>Year Of Birth</td><td><input class='form-control' type='number' id='id_yob' min='1900' max='2050' name='yob' style='width:7em' value="+
			(d.data.yob ? d.data.yob : "")+"></td></tr>";

		table += '<tr><td colspan="2" id="id_sex">' +
				 '<label class="radio-inline"><input type="radio" name="sex" value="M" '+(d.data.sex === 'M' ? "checked" : "")+'>Male</label>' +
				 '<label class="radio-inline"><input type="radio" name="sex" value="F" '+(d.data.sex === 'F' ? "checked" : "")+'>Female</label>' +
				 '<label class="radio-inline"><input type="radio" name="sex" value="U">Unknown</label>' +
				 '</td></tr>';

		// alive status = 0; dead status = 1
		table += '<tr><td colspan="2" id="id_status">' +
				 '<label class="checkbox-inline"><input type="radio" name="status" value="0" '+(d.data.status === 0 ? "checked" : "")+'>&thinsp;Alive</label>' +
				 '<label class="checkbox-inline"><input type="radio" name="status" value="1" '+(d.data.status === 1 ? "checked" : "")+'>&thinsp;Deceased</label>' +
				 '</td></tr>';
		$("#id_status input[value='"+d.data.status+"']").prop('checked', true);

		// switches
		var switches = ["adopted_in", "adopted_out", "miscarriage", "stillbirth", "termination"];
		table += '<tr><td colspan="2"><strong>Reproduction:</strong></td></tr>';
		table += '<tr><td colspan="2">';
		for(var iswitch=0; iswitch<switches.length; iswitch++){
			var attr = switches[iswitch];
			if(iswitch === 2)
				table += '</td></tr><tr><td colspan="2">';
			table +=
			 '<label class="checkbox-inline"><input type="checkbox" id="id_'+attr +
			    '" name="'+attr+'" value="0" '+(d.data[attr] ? "checked" : "")+'>&thinsp;' +
			    capitaliseFirstLetter(attr.replace('_', ' '))+'</label>'
		}
		table += '</td></tr>';

		//
		var exclude = ["children", "name", "parent_node", "top_level", "id", "noparents",
			           "level", "age", "sex", "status", "display_name", "mother", "father",
			           "yob", "mztwin", "dztwin"];
		$.merge(exclude, switches);
		table += '<tr><td colspan="2"><strong>Age of Diagnosis:</strong></td></tr>';
		$.each(opts.diseases, function(k, v) {
			exclude.push(v.type+"_diagnosis_age");

			var disease_colour = '&thinsp;<span style="padding-left:5px;background:'+opts.diseases[k].colour+'"></span>';
			var diagnosis_age = d.data[v.type + "_diagnosis_age"];

			table += "<tr><td style='text-align:right'>"+capitaliseFirstLetter(v.type.replace("_", " "))+
						disease_colour+"&nbsp;</td><td>" +
						"<input class='form-control' id='id_" +
						v.type + "_diagnosis_age_0' max='110' min='0' name='" +
						v.type + "_diagnosis_age_0' style='width:5em' type='number' value='" +
						(diagnosis_age !== undefined ? diagnosis_age : "") +"'></td></tr>";
		});

		table += '<tr><td colspan="2" style="line-height:1px;"></td></tr>';
		$.each(d.data, function(k, v) {
			if($.inArray(k, exclude) == -1) {
				var kk = capitaliseFirstLetter(k);
				if(v === true || v === false) {
					table += "<tr><td style='text-align:right'>"+kk+"&nbsp;</td><td><input type='checkbox' id='id_" + k + "' name='" +
							k+"' value="+v+" "+(v ? "checked" : "")+"></td></tr>";
				} else if(k.length > 0){
					table += "<tr><td style='text-align:right'>"+kk+"&nbsp;</td><td><input type='text' id='id_" +
							k+"' name='"+k+"' value="+v+"></td></tr>";
				}
			}
	    });
		table += "</table>";

		$('#node_properties').html(table);
		$('#node_properties').dialog('open');

		//$('#id_name').closest('tr').toggle();
		$('#node_properties input[type=radio], #node_properties input[type=checkbox], #node_properties input[type=text], #node_properties input[type=number]').change(function() {
	    	pedigree_form.save(opts);
	    });
		pedigree_form.update(opts);
		return;
    }

}(window.widgets = window.widgets || {}, jQuery));

//# sourceMappingURL=pedigreejs.js.map