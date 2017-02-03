
$('#load').change(function(e) {
	io.load
});

$('#save').click(function(e) {
	io.save();
});

// pedigree I/O 
(function(io, $, undefined) {

	io.save = function(){
		var content = JSON.stringify(pedcache.current(opts));
		if(opts.DEBUG)
			console.log(content);
		var uriContent = "data:application/csv;charset=utf-8," + encodeURIComponent(content);
		window.open(uriContent, 'boadicea_pedigree');
	}
	
	io.load = function() {
	    var f = e.target.files[0];
		if(f) {
			var reader = new FileReader();
			reader.onload = function(e) {
				if(opts.DEBUG)
					console.log(e.target.result);
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
}(window.io = window.io || {}, jQuery));
