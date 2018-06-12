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
				pbuttons.reset(opts);
			}
			// trigger fhChange event
			$(document).trigger('fhChange', [opts]);
		});
	}

	// reset pedigree and clear the history
	pbuttons.reset = function(opts) {
		pedcache.clear(opts);
		delete opts.dataset;

		var selected = $("input[name='default_fam']:checked");
		if(selected.length > 0 && selected.val() == 'extended2') {    // secondary relatives
        	opts.dataset = [
        		{"name":"wZA","sex":"M","top_level":true,"status":"0","display_name":"paternal grandfather"},
        		{"name":"MAk","sex":"F","top_level":true,"status":"0","display_name":"paternal grandmother"},
        		{"name":"dOH","sex":"F","top_level":true,"status":"0","display_name":"maternal grandmother"},
        		{"name":"zwB","sex":"M","top_level":true,"status":"0","display_name":"maternal grandfather"},
        		{"name":"MKg","sex":"F","mother":"MAk","father":"wZA","status":"0","display_name":"paternal aunt"},
        		{"name":"xsm","sex":"M","mother":"MAk","father":"wZA","status":"0","display_name":"paternal uncle"},
        		{"name":"m21","sex":"M","mother":"MAk","father":"wZA","status":"0","display_name":"father"},
        		{"name":"f21","sex":"F","mother":"dOH","father":"zwB","status":"0","display_name":"mother"},
        		{"name":"aOH","sex":"F","mother":"f21","father":"m21","status":"0","display_name":"sister"},
        		{"name":"Vha","sex":"M","mother":"f21","father":"m21","status":"0","display_name":"brother"},
        		{"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"},
        		{"name":"Spj","sex":"M","mother":"f21","father":"m21","noparents":true,"status":"0","display_name":"partner"},
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
				{"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"},
				{"name":"Spj","sex":"M","mother":"f21","father":"m21","noparents":true,"status":"0","display_name":"partner"},
				{"name":"zhk","sex":"F","mother":"ch1","father":"Spj","status":"0","display_name":"daughter"},
				{"name":"Knx","display_name":"son","sex":"M","mother":"ch1","father":"Spj","status":"0"}];
		} else {
			opts.dataset = [ 
				{"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
    		    {"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
    			{"name": "ch1", "display_name": "me", "sex": "F", "mother": "f21", "father": "m21", "proband": true}];
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
	
	function clear_browser_store(opts) {
		if(opts.store_type === 'local')
			return localStorage.clear();
		else
			return sessionStorage.clear();
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
