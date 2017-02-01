
//
// undo, redo, reset buttons
(function(pbuttons, $, undefined) {
	
	pbuttons.add = function(options) {
		var opts = $.extend({
            // defaults
			btn_target: 'pedigree_history'
        }, options );

		var btns = 
			'<i class="fa fa-undo fa-lg" aria-hidden="true" aria-label="undo"></i>&thinsp;' +
			'<i class="fa fa-repeat fa-lg" aria-hidden="true" aria-label="redo"></i>&thinsp;' +
			'<i class="fa fa-refresh fa-lg" aria-hidden="true" aria-label="reset"></i>&nbsp;' +
			'<i class="fa fa-arrows-alt" aria-hidden="true" id="fullscreen"></i>';
		$( "#" + opts.btn_target ).append( btns );
		click(opts);
	}
	
	pbuttons.is_fullscreen = function(){
		return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement);
	}
	
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
				var target = $(opts.targetDiv)[0];
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
		$( "#"+opts.btn_target ).on( "click", ":not(.disabled)", function(e) {
			e.stopPropagation();

			if($(e.target).hasClass('fa-undo')) {
				opts['dataset'] = pedcache.previous(opts);
				$(opts.targetDiv).empty();
				ptree.build(opts);				
			} else if ($(e.target).hasClass('fa-repeat')) {
				opts['dataset'] = pedcache.next(opts);
				$(opts.targetDiv).empty();
				ptree.build(opts);				
			} else if ($(e.target).hasClass('fa-refresh')) {
				pedcache.clear(opts);
				delete opts.dataset;
				$(opts.targetDiv).empty();
				ptree.build(opts);
			}
		});
	}
	
	pbuttons.updateButtons = function(opts) {
		var current = pedcache.get_count(opts);
		var nstore = pedcache.nstore(opts);
		var id = "#"+opts.btn_target;
		if(nstore <= current) {
			$(id+" .fa-repeat").addClass('disabled');
		} else {
			$(id+" .fa-repeat").removeClass('disabled');
		}
		if(current > 1) {
			$(id+" .fa-undo").removeClass('disabled');
		} else {
			$(id+" .fa-undo").addClass('disabled');
		}
	}

}(window.pbuttons = window.pbuttons || {}, jQuery));

//
//store a history of pedigree
(function(pedcache, $, undefined) {
	var count = 0;
	var max_limit = 25;

	function get_prefix(opts) {
		return "PEDIGREE_"+opts.btn_target+"_";
	}
	
	pedcache.get_count = function(opts) {
		var count = localStorage.getItem(get_prefix(opts)+'COUNT');
		if(count !== null) {
			return count;
		}
		return 0;
	}
	
	function set_count(opts, count) {
		localStorage.setItem(get_prefix(opts)+'COUNT', count);
	}
	
	pedcache.add = function(opts, store_type) {
		if (typeof(Storage) !== "undefined" && (store_type === undefined || store_type === 'local')) {
		    // local storage
			var count = pedcache.get_count(opts);
			localStorage.setItem(get_prefix(opts)+count, JSON.stringify(opts.dataset));
			if(count < max_limit) {
				count++;
			} else {
				count = 0;
			}
			set_count(opts, count)
		} else {
		    // array cache
		}
	};
	
	pedcache.nstore = function(opts) {
		for(var i=max_limit; i>0; i--) {
			if(localStorage.getItem(get_prefix(opts)+(i-1)) !== null) {
				return i;
			}
		}
		return -1;
	}
	
	pedcache.current = function(opts) {
		var current = pedcache.get_count(opts)-1;
		if(current == -1)
			current = max_limit-1;
		return JSON.parse(localStorage.getItem(get_prefix(opts)+current));
	}

	pedcache.last = function(opts) {
		for(var i=max_limit; i>0; i--) {
			var it = localStorage.getItem(get_prefix(opts)+(i-1));
			if(it !== null) {
				set_count(opts, i);
				return JSON.parse(it);
			}
		}
		return undefined;
	}
	
	pedcache.previous = function(opts, previous) {
		if(previous === undefined){
			previous = pedcache.get_count(opts) - 2;
		}
		if(previous < 0) {
			var nstore = pedcache.nstore;
			if(nstore < max_limit){
				previous = nstore - 1;
			} else {
				previous = max_limit - 1;
			}
		}

		set_count(opts, previous + 1);
		return JSON.parse(localStorage.getItem(get_prefix(opts)+previous));
	}
	
	pedcache.next = function(opts, next) {
		if(next === undefined){
			next = pedcache.get_count(opts);
		}
		if(next >= max_limit) {
			next = 0;
		}

		set_count(opts, parseInt(next) + 1);
		return JSON.parse(localStorage.getItem(get_prefix(opts)+next));
	}

	pedcache.clear = function(previous) {
		localStorage.clear();
	}
	
	// zoom - store translation coords
	pedcache.setposition = function(opts, x, y) {
		localStorage.setItem(get_prefix(opts)+'_X', x);
		localStorage.setItem(get_prefix(opts)+'_Y', y);
	}
	
	pedcache.getposition = function(opts) {
		if(localStorage.getItem(get_prefix(opts)+'_X') == null)
			return [null, null];
		
		return [parseInt(localStorage.getItem(get_prefix(opts)+'_X')),
				parseInt(localStorage.getItem(get_prefix(opts)+'_Y'))];
	}

}(window.pedcache = window.pedcache || {}, jQuery));
