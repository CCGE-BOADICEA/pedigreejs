// undo, redo, reset buttons
import * as pedcache from './pedcache.js';
import {rebuild, build} from './pedigree.js';
import {btn_zoom, scale_to_fit} from './zoom.js';
import {copy_dataset, getProbandIndex} from './pedigree_utils.js';

export function add(options) {
	let opts = $.extend({
        // defaults
		btn_target: 'pedigree_history'
    }, options );

	let btns = [{"fa": "fa-undo pull-left", "title": "undo"},
				{"fa": "fa-repeat pull-left", "title": "redo"},
				{"fa": "fa-refresh pull-left", "title": "reset"}];

	btns.push({"fa": "fa-crosshairs pull-right", "title": "scale-to-fit"});
	if(opts.zoomSrc && (opts.zoomSrc.indexOf('button') > -1)) {
		if(opts.zoomOut != 1)
			btns.push({"fa": "fa-minus-circle pull-right", "title": "zoom-out"});
		if(opts.zoomIn != 1)
			btns.push({"fa": "fa-plus-circle pull-right", "title": "zoom-in"});
	}
	btns.push({"fa": "fa-arrows-alt pull-right", "title": "fullscreen"});

	let lis = "";
	for(let i=0; i<btns.length; i++) {
		lis += '<span>';
		lis += '&nbsp;<i class="fa fa-lg ' + btns[i].fa + '" ' +
		               (btns[i].fa == "fa-arrows-alt pull-right" ? 'id="fullscreen" ' : '') +
		               ' aria-hidden="true" title="'+ btns[i].title +'"></i>';
		lis += '</span>';
	}
	$( "#"+opts.btn_target ).append(lis);
	click(opts);
}

export function is_fullscreen(){
	return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

function click(opts) {
	// fullscreen
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange', function(_e)  {
		let local_dataset = pedcache.current(opts);
		if (local_dataset !== undefined && local_dataset !== null) {
			opts.dataset = local_dataset;
		}
		rebuild(opts);
		setTimeout(function(){ scale_to_fit(opts); }, 500);
    });

	$('#fullscreen').on('click', function(_e) {
		// toggle fullscreen
		if (!is_fullscreen()) {
			let target = $("#"+opts.targetDiv)[0];
			if (target.requestFullscreen) {
                target.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
				target.mozRequestFullScreen(); // Firefox
            } else if (document.documentElement.webkitRequestFullscreen) {
                target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT); // Chrome and Safari
            } else if (document.documentElement.msRequestFullscreen) {
                target.msRequestFullscreen(); // IE
            }
		} else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
		}
	});

	// press and hold to zoom in/out
	let timeoutId = 0;
	function zoomIn() {btn_zoom(opts, 1.05);}
	function zoomOut() {btn_zoom(opts, 0.95);}
	$('.fa-plus-circle, .fa-minus-circle').on('mousedown', function() {
	    timeoutId = setInterval(($( this ).hasClass( "fa-plus-circle" ) ? zoomIn : zoomOut), 50);
	}).on('mouseup mouseleave', function() {
	    clearInterval(timeoutId);
	});

	// undo/redo/reset
	$( "#"+opts.btn_target ).on( "click", function(e) {
		e.stopPropagation();
		if($(e.target).hasClass("disabled"))
			return false;

		if($(e.target).hasClass('fa-undo')) {
			opts.dataset = pedcache.previous(opts);
			$("#"+opts.targetDiv).empty();
			build(opts);
		} else if ($(e.target).hasClass('fa-repeat')) {
			opts.dataset = pedcache.next(opts);
			$("#"+opts.targetDiv).empty();
			build(opts);
		} else if ($(e.target).hasClass('fa-refresh')) {
			$('<div id="msgDialog">Resetting the pedigree may result in loss of some data.</div>').dialog({
				title: 'Confirm Reset',
				resizable: false,
				height: "auto",
				width: 400,
				modal: true,
				buttons: {
					Continue: function() {
						reset(opts, opts.keep_proband_on_reset);
						$(this).dialog( "close" );
					},
					Cancel: function() {
						$(this).dialog( "close" );
						return;
				    }
				}
			});
		} else if ($(e.target).hasClass('fa-crosshairs')) {
			scale_to_fit(opts);
		} 
		// trigger fhChange event
		$(document).trigger('fhChange', [opts]);
	});
}

// reset pedigree and clear the history
export function reset(opts, keep_proband) {
	let proband;
	if(keep_proband) {
		let local_dataset = pedcache.current(opts);
		let newdataset =  copy_dataset(local_dataset);
		proband = newdataset[getProbandIndex(newdataset)];
		//let children = pedigree_util.getChildren(newdataset, proband);
		proband.name = "ch1";
		proband.mother = "f21";
		proband.father = "m21";
		// clear pedigree data but keep proband data and risk factors
		pedcache.clear_pedigree_data(opts)
	} else {
		proband = {
			"name":"ch1","sex":"F","mother":"f21","father":"m21","proband":true,"status":"0","display_name":"me"
		};
		pedcache.clear(opts); // clear all storage data
	}

	delete opts.dataset;

	let selected = $("input[name='default_fam']:checked");
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
			{"name":"zhk","sex":"F","mother":"ch1","father":"Spj","status":"0","display_name":"daughter"},
			{"name":"Knx","display_name":"son","sex":"M","mother":"ch1","father":"Spj","status":"0"}];
	} else {
		opts.dataset = [
			{"name": "m21", "display_name": "father", "sex": "M", "top_level": true},
			{"name": "f21", "display_name": "mother", "sex": "F", "top_level": true},
			proband];
	}
	rebuild(opts);
}

export function updateButtons(opts) {
	let current = pedcache.get_count(opts);
	let nstore = pedcache.nstore(opts);
	let id = "#"+opts.btn_target;
	if(nstore <= current)
		$(id+" .fa-repeat").addClass('disabled');
	else
		$(id+" .fa-repeat").removeClass('disabled');

	if(current > 1)
		$(id+" .fa-undo").removeClass('disabled');
	else
		$(id+" .fa-undo").addClass('disabled');
}
