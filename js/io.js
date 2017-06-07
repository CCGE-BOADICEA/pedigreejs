
$('#load').change(function(e) {
	io.load(e);
});

$('#save').click(function(e) {
	io.save();
});

$('#print').click(function(e) {
	io.print(io.get_printable_svg());
});


$('#svg_download').click(function(e) {
	io.svg_download(io.get_printable_svg());
});


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

	// get printable svg div, adjust size to tree dimensions and scale to fit
	io.get_printable_svg = function() {
		var local_dataset = pedcache.current(opts); // get current dataset
		if (local_dataset !== undefined && local_dataset !== null) {
			opts.dataset = local_dataset;
		}

		var tree_dimensions = ptree.get_tree_dimensions(opts);
		var svg_div = $('#'+opts.targetDiv).find('svg').parent();
		if(opts.width < tree_dimensions.width || opts.height < tree_dimensions.height) {
		    var wid = tree_dimensions.width;
		    var hgt = tree_dimensions.height + 100;
		    var scale = 1.0;

		    if(tree_dimensions.width > 595 || tree_dimensions.height > 842) {   // scale to fit A4
		    	wid = 595;
		    	hgt = 842;
		    	var xscale = 595/tree_dimensions.width;
		    	var yscale = 842/tree_dimensions.height;
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
	}

	// download the SVG to a file
	io.svg_download = function(svg){
		var a      = document.createElement('a');
		a.href     = 'data:image/svg+xml;utf8,' + unescape(svg.html());
		a.download = 'plot.svg';
		a.target   = '_blank';
		document.body.appendChild(a); a.click(); document.body.removeChild(a);
	}
	
	io.print = function(el){

        var popUpAndPrint = function() {
        	if(el.constructor !== Array)
        		el = [el];

        	var width = $(window).width()*2/3;
        	var height = $(window).height()-40;
            var cssFile = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css';
            var printWindow = window.open('', 'PrintMap',
            'width=' + width + ',height=' + height);

            var headContent = '<link href="'+cssFile+'" rel="stylesheet" type="text/css" media="all">';
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

            html = "<!doctype html><head>";
            html += headContent;
            html += "</head><body>";
            for(var i=0; i<el.length; i++)
            	html += $(el[i]).html();
            html +=  "</body></html>";

            printWindow.document.body.innerHTML = html;           
            var img = document.createElement('img');
            printWindow.document.body.appendChild(img);
            printWindow.document.close();
            img.style.display = 'none';
            img.onerror = function(){
            	printWindow.print();
                printWindow.close();
            };
            img.src = cssFile;
        };
        setTimeout(popUpAndPrint, 500);
	}

	io.save = function(){
		var content = JSON.stringify(pedcache.current(opts));
		if(opts.DEBUG)
			console.log(content);
		var uriContent = "data:application/csv;charset=utf-8," + encodeURIComponent(content);
		window.open(uriContent, 'boadicea_pedigree');
	}

	io.load = function(e) {
	    var f = e.target.files[0];
		if(f) {
			var reader = new FileReader();
			reader.onload = function(e) {
				if(opts.DEBUG)
					console.log(e.target.result);

				if(e.target.result.startsWith("BOADICEA import pedigree file format 4.0"))
					opts.dataset = io.readBoadiceaV4(e.target.result);
				else {
					try {
						opts.dataset = JSON.parse(e.target.result);
					} catch(err) {
						opts.dataset = io.readLinkage(e.target.result)
				    }
				}
				console.log(opts.dataset);
				ptree.rebuild(opts);
			}
			reader.onerror = function(event) {
			    console.error("File could not be read! Code " + event.target.error.code);
			};
			reader.readAsText(f);
		} else {
			console.error("File could not be read!");
		}
		$("#load")[0].value = ''; // reset value
	}

	// http://www.jurgott.org/linkage/LinkageHandbook.pdf
	// standard pre-makeped LINKAGE file format
	// Column 1 : Pedigree identifier The identifier can be a number or a character string
	// Column 2 : Individual's ID The identifier can be a number or a character string
	// Column 3 : The individual's father If the person is a founder, just put a 0 in each column
	// Column 4 : The individual's mother If the person is a founder, just put a 0 in each column
	// Column 5 : Sex (gender) ( 1 = Male, 2 = Female )
	// Column 6+: Genetic data (Disease and Marker Phenotypes)
	io.readLinkage = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = [];
		var famid = undefined;
		for(var i = 0;i < lines.length;i++){
		   var attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim()});
		   if(attr.length < 5)
			   throw('unknown format');
			   
		   var indi = {
				'famid': attr[0],
				'display_name': attr[1],
				'name':	attr[1],
				'sex': attr[4] == '1' ? 'M' : 'F' 
			}
			if(attr[2] != 0) indi.father = attr[2];
			if(attr[3] != 0) indi.mother = attr[3];
			
			if (typeof famid != 'undefined' && famid !== indi.famid) {
				console.error('multiple family IDs found only using famid = '+famid);
				break;
			}
			ped.unshift(indi);
			famid = attr[0];
		}
		return process_ped(ped);
	}

	// read boadicea format v4
	io.readBoadiceaV4 = function(boadicea_lines) {
		var lines = boadicea_lines.trim().split('\n');
		var ped = []
		// assumes two line header
		for(var i = 2;i < lines.length;i++){
		   var attr = $.map(lines[i].trim().split(/\s+/), function(val, i){return val.trim()});
			if(attr.length > 1) {
				var indi = {
					'famid': attr[0],
					'display_name': attr[1],
					'name':	attr[3],
					'sex': attr[6],
					'status': attr[8]
				}
				if(attr[2] == 1) indi.proband = true;
				if(attr[4] != 0) indi.father = attr[4];
				if(attr[5] != 0) indi.mother = attr[5];
				if(attr[7] != 0) indi.mztwin = attr[7];
				if(attr[9] != 0) indi.age = attr[9];
				if(attr[10] != 0) indi.yob = attr[10];

				var idx = 11;
				$.each(io.cancers, function(cancer, diagnosis_age) {
					// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
					if(attr[idx] != 0) {
						indi[diagnosis_age] = attr[idx];
					}
					idx++;
				});

				if(attr[idx++] != 0) indi.ashkenazi = 1;
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
				for(var j=0; j<io.pathology_tests.length; j++) {
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
		return process_ped(ped);
	}

	function process_ped(ped) {
		// find the level of individuals in the pedigree
		for(var i=0;i<ped.length;i++) {
			getLevel(ped, ped[i].name);
		}

		// find the max level (i.e. top_level)
		var max_level = 0;
		for(var i=0;i<ped.length;i++) {
			if(ped[i].level && ped[i].level > max_level)
				max_level = ped[i].level;
		}

		// identify top_level and other nodes without parents
		for(var i=0;i<ped.length;i++) {
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
								var pidx = getPartnerIdx(ped, ped[j]);
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
				update_parents_level(pidx, level, dataset)
			}
		}
	}

}(window.io = window.io || {}, jQuery));
