// pedigree form
import {rebuild, syncTwins} from './pedigree.js';
import {copy_dataset, getNodeByName} from './pedigree_utils.js';
import {current as pedcache_current} from './pedcache.js';


// handle family history change events (undo/redo/delete)
$(document).on('fhChange', function(e, opts){
	try {
		let id = $('#id_name').val();  // get name from hidden field
		let node = getNodeByName(pedcache_current(opts), id)
		if(node === undefined)
			$('form > fieldset').prop("disabled", true);
		else
			$('form > fieldset').prop('disabled', false);
	} catch(err) {
		console.warn(err);
	}
})

// update status field and age label - 0 = alive, 1 = dead
export function updateStatus(status) {
	$('#age_yob_lock').removeClass('fa-lock fa-unlock-alt');
	(status == 1 ? $('#age_yob_lock').addClass('fa-unlock-alt') : $('#age_yob_lock').addClass('fa-lock'));
	$('#id_age_'+status).removeClass("hidden");
	$('#id_age_'+(status == 1 ? '0' : '1')).addClass("hidden");
}

export function nodeclick(node) {
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
	updateStatus(node.status);

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
	update_diagnosis_age_widget();

	for(let key in node) {
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
}

function update_ashkn(newdataset) {
	// Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
	if($('#orig_ashk').is(':checked')) {
		$.each(newdataset, function(_i, p) {
			if(p.proband)
				p.ashkenazi = 1;
		});
	} else {
		$.each(newdataset, function(_i, p) {
			delete p.ashkenazi;
		});
	}
}

// Save Ashkenazi status
export function save_ashkn(opts) {
	let dataset = pedcache_current(opts);
	let newdataset = copy_dataset(dataset);
	update_ashkn(newdataset);
	opts.dataset = newdataset;
	rebuild(opts);
}

export function save(opts) {
	let dataset = pedcache_current(opts);
	let name = $('#id_name').val();
	let newdataset = copy_dataset(dataset);
	let person = getNodeByName(newdataset, name);
	if(!person) {
		console.warn('person not found when saving details');
		return;
	}
	$("#"+opts.targetDiv).empty();

	// individual's personal and clinical details
	let yob = $('#id_yob_0').val();
	if(yob && yob !== '') {
		person.yob = yob;
	} else {
		delete person.yob;
	}

	// current status: 0 = alive, 1 = dead
	let status = $('#id_status').find("input[type='radio']:checked");
	if(status.length > 0){
		person.status = status.val();
	}

	// booleans switches
	let switches = ["miscarriage", "adopted_in", "adopted_out", "termination", "stillbirth"];
	for(let iswitch=0; iswitch<switches.length; iswitch++){
		let attr = switches[iswitch];
		let s = $('#id_'+attr);
		if(s.length > 0){
			console.log(s.is(":checked"));
			if(s.is(":checked"))
				person[attr] = true;
			else
				delete person[attr];
		}
	}

	// current sex
	let sex = $('#id_sex').find("input[type='radio']:checked");
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
		let name = (this.name.indexOf("_diagnosis_age")>-1 ? this.name.substring(0, this.name.length-2): this.name);

		if($(this).val()) {
			let val = $(this).val();
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
			let tres = $('select[name="'+$(this).attr('name')+'_result"]');
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

	syncTwins(newdataset, person);
	opts.dataset = newdataset;
	rebuild(opts);
}

export function update_diagnosis_age_widget() {
	if($("#id_approx").is(':checked')) {
		$("[id$='_diagnosis_age_0']").each(function( _i ) {
			if($(this).val() !== '') {
				let name = this.name.substring(0, this.name.length-2);
				$("#id_"+name+"_1").val(round5($(this).val())).prop('selected', true);
			}
		});

		$("[id$='_diagnosis_age_0']").hide();
		$("[id$='_diagnosis_age_1']").show();
	} else {
		$("[id$='_diagnosis_age_1']").each(function( _i ) {
			if($(this).val() !== '') {
				let name = this.name.substring(0, this.name.length-2);
				$("#id_"+name+"_0").val($(this).val());
			}
		});

		$("[id$='_diagnosis_age_0']").show();
		$("[id$='_diagnosis_age_1']").hide();
	}
}

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
	let x2 = (Math.round((x1-1) / 10) * 10);
	return (x1 < x2 ? x2 - 5 : x2 + 5);
}

