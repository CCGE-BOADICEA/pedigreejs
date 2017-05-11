
$('#load').change(function(e) {
	io.load(e);
});

$('#save').click(function(e) {
	io.save();
});

$('#print').click(function(e) {
	io.print($('svg').parent());
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

	io.print = function(el){

        var popUpAndPrint = function() {
        	var element = $(el);           
            var width = parseFloat(element.width())
            var height = parseFloat(element.height())
            var printWindow = window.open('', 'PrintMap',
            'width=' + width + ',height=' + height);
            printWindow.document.writeln($(el).html());
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
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
					opts.dataset = readBoadiceaV4(e.target.result);
				else
					opts.dataset = JSON.parse(e.target.result);
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

	// read boadicea format v4
	function readBoadiceaV4(boadicea_lines) {
		var lines = boadicea_lines.split('\n');
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
