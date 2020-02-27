
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
