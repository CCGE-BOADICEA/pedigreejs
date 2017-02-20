
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
		    //code here using lines[i] which will give you each line
			var attr = $.map(lines[i].split('\t'), function(val, i){return val.trim()});
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
				$.each(run_prediction.cancers, function(cancer, diagnosis_age) {
					// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
					if(attr[idx] != 0) {
						indi[cancer] = true;
						indi[diagnosis_age] = attr[idx];
					}
					idx++;
				});

				if(attr[idx++] != 0) indi.ashkenazi = true;
				// BRCA1, BRCA2, PALB2, ATM, CHEK2 genetic tests
				for(var j=0; j<run_prediction.genetic_test.length; j++) {
					// todo
					idx+=2;
				}
				// status, 0 = unspecified, N = negative, P = positive
				for(var j=0; j<run_prediction.pathology_tests.length; j++) {
					// todo 
				}
				ped.unshift(indi);
			}
		}
		for(var i=0;i<ped.length;i++) {
			if(pedigree_util.getDepth(ped, ped[i].name) == 1)
				ped[i].top_level = true;
		}
		return ped;
	}

}(window.io = window.io || {}, jQuery));
