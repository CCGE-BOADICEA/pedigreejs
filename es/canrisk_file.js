import * as pedigree_util from './pedigree_utils.js';
import {genetic_test, pathology_tests, cancers} from './io.js';

// save risk factor to storage
let RISK_FACTOR_STORE = new Object();
export function show_risk_factor_store() {
	console.log("RISK_FACTOR_STORE::");
	$.each(RISK_FACTOR_STORE, function(name, val){
		console.log(name + " : " + val);
	});
}

// return a non-anonimised pedigree format
export function get_non_anon_pedigree(dataset, meta) {
	return get_pedigree(dataset, undefined, meta, false);
}

/**
 * Get CanRisk formated pedigree.
 */
export function get_pedigree(dataset, famid, meta, isanon) {
	let msg = "##CanRisk 1.0";
	if(!famid) {
		famid = "XXXX";
	}
	if(meta) {
		msg += meta;
	}
	if(typeof isanon === 'undefined') {
		isanon = true;
	}
	// array of individuals excluded from the calculation
	let excl = $.map(dataset, function(p, _i){return 'exclude' in p && p.exclude ? p.name : null;});

	// female risk factors
	let probandIdx  = pedigree_util.getProbandIndex(dataset);
	let sex = 'F';
	if(probandIdx) {
		sex = dataset[probandIdx].sex;
	}

	if(sex !== 'M') {
		let menarche    = get_risk_factor('menarche_age');
		let parity      = get_risk_factor('parity');
		let first_birth = get_risk_factor('age_of_first_live_birth');
		let oc_use      = get_risk_factor('oral_contraception');
		let mht_use     = get_risk_factor('mht');
		let bmi         = get_risk_factor('bmi');
		let alcohol     = get_risk_factor('alcohol_intake');
		let menopause   = get_risk_factor('age_of_menopause');
		let mdensity    = get_risk_factor('mammographic_density');
		let hgt         = get_risk_factor('height');
		let tl          = get_risk_factor('Age_Tubal_ligation');
		let endo        = get_risk_factor('endometriosis');

		if(menarche !== undefined)
			msg += "\n##menarche="+menarche;
		if(parity !== undefined)
			msg += "\n##parity="+parity;
		if(first_birth !== undefined)
			msg += "\n##first_live_birth="+first_birth;
		if(oc_use !== undefined)
			msg += "\n##oc_use="+oc_use;
		if(mht_use !== undefined)
			msg += "\n##mht_use="+mht_use;
		if(bmi !== undefined)
			msg += "\n##BMI="+bmi;
		if(alcohol !== undefined)
			msg += "\n##alcohol="+alcohol;
		if(menopause !== undefined)
			msg += "\n##menopause="+menopause;
		if(mdensity !== undefined)
			msg += "\n##birads="+mdensity;
		if(hgt !== undefined)
			msg += "\n##height="+hgt;
		if(tl !== undefined)
			if(tl !== "n" && tl !== "N")
				msg += "\n##TL=Y";
			else
				msg += "\n##TL=N";

		if(endo !== undefined)
			msg += "\n##endo="+endo;
	}
	msg += "\n##FamID\tName\tTarget\tIndivID\tFathID\tMothID\tSex\tMZtwin\tDead\tAge\tYob\tBC1\tBC2\tOC\tPRO\tPAN\tAshkn\tBRCA1\tBRCA2\tPALB2\tATM\tCHEK2\tRAD51D\tRAD51C\tBRIP1\tER:PR:HER2:CK14:CK56";

	for(let i=0; i<dataset.length; i++) {
		let p = dataset[i];
		if($.inArray(p.name, excl) != -1) {
			console.log('EXCLUDE: '+p.name);
			continue;
		}

		msg += '\n'+famid+'\t';												// max 13 chars
		if(isanon)
			msg += i+'\t';													// display_name (ANONIMISE) max 8 chars
		else
			msg += (p.display_name ? p.display_name : "NA")+'\t';
		msg += ('proband' in p ? '1' : 0)+'\t';
		msg += p.name+'\t';													// max 7 chars
		msg += ('father' in p && !('noparents' in p) && ($.inArray(p.mother, excl) == -1)? p.father : 0)+'\t';	// max 7 chars
		msg += ('mother' in p && !('noparents' in p) && ($.inArray(p.mother, excl) == -1)? p.mother : 0)+'\t';	// max 7 chars
		msg += p.sex+'\t';
		msg += ('mztwin' in p ? p.mztwin : 0)+'\t'; 						// MZtwin
		msg += ('status' in p ? p.status : 0)+'\t';							// current status: 0 = alive, 1 = dead
		msg += ('age' in p ? p.age : 0)+'\t';								// Age at last follow up or 0 = unspecified
		msg += ('yob' in p ? p.yob : 0)+'\t';								// YOB or 0 = unspecified

		$.each(cancers, function(cancer, diagnosis_age) {
			// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
			if(diagnosis_age in p)
				msg += (diagnosis_age in p ? p[diagnosis_age] : 'AU')+'\t';
			else
				msg += '0\t';
		});

		// Ashkenazi status, 0 = not Ashkenazi, 1 = Ashkenazi
		msg += ('ashkenazi' in p ? p.ashkenazi : 0)+'\t';

		for(let j=0; j<genetic_test.length; j++) {
			if(genetic_test[j]+'_gene_test' in p &&
			   p[genetic_test[j]+'_gene_test']['type'] !== '-' &&
			   p[genetic_test[j]+'_gene_test']['result'] !== '-') {
				msg += p[genetic_test[j]+'_gene_test']['type'] + ':';
				msg += p[genetic_test[j]+'_gene_test']['result'] + '\t';
			} else {
				msg += '0:0\t';		// genetic test type, 0=untested, S=mutation search, T=direct gene test
									// genetic test result, 0=untested, P=positive, N=negative
			}
		}

		for(let j=0; j<pathology_tests.length; j++) {
			// status, 0 = unspecified, N = negative, P = positive
			if(pathology_tests[j]+'_bc_pathology' in p) {
				msg += p[pathology_tests[j]+'_bc_pathology'];
				console.log('pathology '+p[pathology_tests[j]+'_bc_pathology']+' for '+p.display_name);
			} else {
				msg += '0';
			}
			if(j<(pathology_tests.length-1))
				msg += ":";
		}
	}

	console.log(msg, RISK_FACTOR_STORE);
	return msg;
}

export function save_risk_factor(risk_factor_name, val) {
	RISK_FACTOR_STORE[store_name(risk_factor_name)] = val;
}

export function get_risk_factor(risk_factor_name) {
	let key = store_name(risk_factor_name);
	if(key in RISK_FACTOR_STORE) {
		return RISK_FACTOR_STORE[key];
	}
	return undefined;
}

// remove risk factor from storage
export function remove_risk_factor(risk_factor_name) {
	delete RISK_FACTOR_STORE[store_name(risk_factor_name)];
}

// prefix risk factor name with the app/page name
export function store_name(risk_factor_name) {
	return window.location.pathname.split('/').filter(function(el){ return !!el; }).pop() +
	       '::' + risk_factor_name;
}
