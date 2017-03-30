
// pedigree form
(function(pedigree_form, $, undefined) {

	pedigree_form.update = function(opts) {
		$('.node_save').click(function() {
			pedigree_form.save(opts);
		});
		
		$('#id_proband, #id_exclude').click(function(e) {
			var dataset = pedcache.current(opts);
			opts.dataset = ptree.copy_dataset(dataset);

			var name = $('#id_name').val();
			if($(this).attr("id") === 'id_proband') {
				pedigree_util.setProband(opts.dataset, name, $(this).is(':checked'));
			} else {
				var idx = pedigree_util.getIdxByName(opts.dataset, name);
				if($(this).is(':checked'))
					opts.dataset[idx].exclude = true;
				else
					delete opts.dataset[idx].exclude;
			}
			pedcache.add(opts);
			$("#"+opts.targetDiv).empty();
			ptree.build(opts);
		});

		// advanced options - model parameters
		$("input[id$='_mut_sensitivity'], input[id$='_mut_frequency'").prop('disabled', true);
		$('#id_use_custom_mutation_sensitivities').change(function() {
			$("input[id$='_mut_sensitivity']").prop('disabled', !$(this).is(":checked"));
		});

		$('#id_mutation_frequencies').change(function() {
			$("input[id$='_mut_frequency']").prop('disabled', (this.value !== 'Custom'));
			// note pedigree_form.mutation_frequencies is set in the view see pedigree.html
			if(pedigree_form.mutation_frequencies && this.value !== 'Custom') {
				var mfreq = pedigree_form.mutation_frequencies[this.value];
				for (var gene in mfreq)
					$('#id_'+gene.toLowerCase()+'_mut_frequency').val(mfreq[gene]);
			}
		});
	}
	
	pedigree_form.nodeclick = function(node) {
		$('form > fieldset').removeAttr('disabled');
		// clear values
		$('form').find("input[type=text], input[type=number]").val("");
		$('input[type="checkbox"][name$="cancer"],input[type="checkbox"][name$="cancer2"]').prop('checked', false);

		// assign values to input fields in form
		if(node.sex === 'M' || node.sex === 'F')
			$('input[name=sex][value="'+node.sex+'"]').prop('checked', true);
		else
			$('input[name=sex]').prop('checked', false);
		if(!('status' in node))
			node.status = 0
		$('input[name=status][value="'+node.status+'"]').prop('checked', true);

		if('proband' in node) {
			$('#id_proband').prop('checked', node.proband);
		} else {
			$('#id_proband').prop('checked', false);
		}
		
		if('exclude' in node) {
			$('#id_exclude').prop('checked', node.exclude);
		} else {
			$('#id_exclude').prop('checked', false);
		}
		
		if('ashkenazi' in node) {
			$('#id_ashkenazi').prop('checked', (node.proband == 1 ? true: false));
		} else {
			$('#id_ashkenazi').prop('checked', false);
		}
		
		// year of both
		if('yob' in node) {
			$('#id_yob_0').val(node.yob);
		} else {
			$('#id_yob_0').val('-');
		}

		// clear pathology
		$('select[name$="_bc_pathology"]').val('-');
		// clear gene tests
		$('select[name*="_gene_test"]').val('-');

		// males should not have ovarian cancer and females should not have prostate cancer
		$('#cancer .row').show();
		if(node.sex === 'M') {
			$('#id_ovarian_cancer_diagnosis_age').closest('.row').hide();
		} else if(node.sex === 'F') {
			$('#id_prostate_cancer_diagnosis_age').closest('.row').hide();
		}
		
		for(key in node) {
			if(key !== 'proband' && key !== 'sex') {
				if(node[key] === true) {			// cancer diagnosed
					$("form").find("input[type=checkbox][name='"+key+"']").prop('checked', true);
				} else if($('#id_'+key).length) {	// input value
					if(key.indexOf('_gene_test')  !== -1 && node[key] !== null && typeof node[key] === 'object') {
						$('#id_'+key).val(node[key]['type']);
						$('#id_'+key+'_result').val(node[key]['result']);
					} else {
						$('#id_'+key).val(node[key]);
					}
				}
			}
		}
	}
	
    pedigree_form.save = function(opts) {
		var dataset = pedcache.current(opts);
		var name = $('#id_name').val();
		$("#"+opts.targetDiv).empty();
		var newdataset = ptree.copy_dataset(dataset);
		var person = pedigree_util.getNodeByName(newdataset, name);

		// individual's personal and clinical details
		var yob = $('#id_yob_0').val();
		if(yob && yob !== '-') {
			person.yob = yob;
		}

		// current status: 0 = alive, 1 = dead
		var status = $('#id_status').find("input[type='radio']:checked");
		if(status.length > 0){
			person.status = status.val();
		}

		// current sex
		var sex = $('#id_sex').find("input[type='radio']:checked");
		if(sex.length > 0){
			person.sex = sex.val();
		}

		// Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
		if($('#id_ashkenazi').is(':checked'))
			person.ashkenazi = 1;
		else
			delete person.ashkenazi;

		$("#person_details input[type=text], #person_details input[type=number]").each(function() {
			if($(this).val())
				person[this.name] = $(this).val();
			else
				delete person[this.name]
        });
		
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

		ptree.syncTwins(newdataset, person);
		opts.dataset = newdataset;
		pedcache.add(opts);
		ptree.build(opts);
    }

}(window.pedigree_form = window.pedigree_form || {}, jQuery));
