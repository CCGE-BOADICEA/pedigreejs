import * as pedigree_util from './pedigree_utils.js';

// cancers, genetic & pathology tests
export let cancers = {
		'breast_cancer': 'breast_cancer_diagnosis_age',
		'breast_cancer2': 'breast_cancer2_diagnosis_age',
		'ovarian_cancer': 'ovarian_cancer_diagnosis_age',
		'prostate_cancer': 'prostate_cancer_diagnosis_age',
		'pancreatic_cancer': 'pancreatic_cancer_diagnosis_age'
	};
export let genetic_test1 = ['brca1', 'brca2', 'palb2', 'atm', 'chek2', 'rad51d', 'rad51c', 'brip1'];
export let genetic_test2 = ['brca1', 'brca2', 'palb2', 'atm', 'chek2', 'bard1', 'rad51d', 'rad51c', 'brip1'];

export let pathology_tests = ['er', 'pr', 'her2', 'ck14', 'ck56'];

// risk factor to storage
let RISK_FACTOR_STORE = new Object();

// get surgical ops and PRS for canrisk header
export function get_meta() {
	let meta = get_surgical_ops();
	let prs;
	try {
		prs = get_prs_values();
		if(prs.breast_cancer_prs && prs.breast_cancer_prs.alpha !== 0 && prs.breast_cancer_prs.zscore !== 0) {
			meta += "\n##PRS_BC=alpha="+prs.breast_cancer_prs.alpha+",zscore="+prs.breast_cancer_prs.zscore;
		}

		if(prs.ovarian_cancer_prs && prs.ovarian_cancer_prs.alpha !== 0 && prs.ovarian_cancer_prs.zscore !== 0) {
			meta += "\n##PRS_OC=alpha="+prs.ovarian_cancer_prs.alpha+",zscore="+prs.ovarian_cancer_prs.zscore;
		}
	} catch(err) { console.warn("PRS", prs); }
	return meta;
}

// return a non-anonimised pedigree format
export function get_non_anon_pedigree(dataset, meta) {
	return get_pedigree(dataset, undefined, meta, false);
}

//check if input has a value
export function hasInput(id) {
	return $.trim($('#'+id).val()).length !== 0;
}

//return true if the object is empty
let isEmpty = function(myObj) {
	for(let key in myObj) {
		if (Object.prototype.hasOwnProperty.call(myObj, key)) {
			return false;
		}
	}
	return true;
}

//get breast and ovarian PRS values
export function get_prs_values() {
	let prs = {};
	if(hasInput("breast_prs_a") && hasInput("breast_prs_z")) {
		prs['breast_cancer_prs'] = {
			'alpha': parseFloat($('#breast_prs_a').val()),
			'zscore': parseFloat($('#breast_prs_z').val()),
			'percent': parseFloat($('#breast_prs_percent').val())
		};
	}
	if(hasInput("ovarian_prs_a") && hasInput("ovarian_prs_z")) {
		prs['ovarian_cancer_prs'] = {
			'alpha': parseFloat($('#ovarian_prs_a').val()),
			'zscore': parseFloat($('#ovarian_prs_z').val()),
			'percent': parseFloat($('#ovarian_prs_percent').val())
		};
	}
	console.log(prs);
	return (isEmpty(prs) ? 0 : prs);
}

function get_surgical_ops() {
	let meta = "";
	if(!$('#A6_4_3_check').parent().hasClass("off")) {
		meta += ";OVARY2=y";
	}
	if(!$('#A6_4_7_check').parent().hasClass("off")) {
		meta += ";MAST2=y";
	}
	return meta;
}

export function readCanRisk(boadicea_lines) {
	let lines = boadicea_lines.trim().split('\n');
	let ped = [];
	let hdr = [];  // collect risk factor header lines
	const regexp = /([0-9])/;
	let version = 2;
	let gt = (version === 1 ? genetic_test1 : genetic_test2);
	let ncol = [26, 27];	// number of columns - v1, v2
	// assumes two line header
	for(let i = 0;i < lines.length;i++){
		let ln = lines[i].trim();
		if(ln.indexOf("##") === 0) {
			if(ln.indexOf("##CanRisk") === 0) {
				const match = ln.match(regexp);
				version = parseInt(match[1]);
				gt = (version === 1 ? genetic_test1 : genetic_test2);
				console.log("CanRisk File Format version "+version);

				if(ln.indexOf(";") > -1) {   // contains surgical op data
					let ops = ln.split(";");
					for(let j=1; j<ops.length; j++) {
						let opdata = ops[j].split("=");
						if(opdata.length === 2) {
							hdr.push(ops[j]);
						}
					}
				}
			}
			if(ln.indexOf("CanRisk") === -1 && ln.indexOf("##FamID") !== 0) {
				hdr.push(ln.replace("##", ""));
			}
			continue;
		}

		let delim = /\t/;
		if(ln.indexOf('\t') < 0) {
			delim = /\s+/;
			console.log("NOT TAB DELIM");
		}
		let attr = $.map(ln.split(delim), function(val, _i){return val.trim();});

		if(attr.length > 1) {
			if(attr.length !== ncol[version-1]) {
				console.error(ln, attr);
				throw 'Found number of columns '+attr.length+'; expected '+ncol[version-1]+' for CanRisk version '+version;
			}
			let indi = {
				'famid': attr[0],
				'display_name': attr[1],
				'name':	attr[3],
				'sex': attr[6],
				'status': attr[8]
			};
			if(attr[2] == 1) indi.proband = true;
			if(attr[4] !== "0") indi.father = attr[4];
			if(attr[5] !== "0") indi.mother = attr[5];
			if(attr[7] !== "0") indi.mztwin = attr[7];
			if(attr[9] !== "0") indi.age = attr[9];
			if(attr[10] !== "0") indi.yob = attr[10];

			let idx = 11;
			$.each(cancers, function(cancer, diagnosis_age) {
				// Age at 1st cancer or 0 = unaffected, AU = unknown age at diagnosis (affected unknown)
				if(attr[idx] !== "0") {
					indi[diagnosis_age] = attr[idx];
				}
				idx++;
			});

			if(attr[idx++] !== "0") indi.ashkenazi = 1;
			// BRCA1, BRCA2, PALB2, ATM, CHEK2, .... genetic tests
			// genetic test type, 0 = untested, S = mutation search, T = direct gene test
			// genetic test result, 0 = untested, P = positive, N = negative
			for(let j=0; j<gt.length; j++) {
				let gene_test = attr[idx].split(":");
				if(gene_test[0] !== '0') {
					if((gene_test[0] === 'S' || gene_test[0] === 'T') && (gene_test[1] === 'P' || gene_test[1] === 'N'))
						indi[gt[j] + '_gene_test'] = {'type': gene_test[0], 'result': gene_test[1]};
					else
						console.warn('UNRECOGNISED GENE TEST ON LINE '+ (i+1) + ": " + gene_test[0] + " " + gene_test[1]);
				}
				idx++;
			}
			// status, 0 = unspecified, N = negative, P = positive
			let path_test = attr[idx].split(":");
			for(let j=0; j<path_test.length; j++) {
				if(path_test[j] !== '0') {
					if(path_test[j] === 'N' || path_test[j] === 'P')
						indi[pathology_tests[j] + '_bc_pathology'] = path_test[j];
					else
						console.warn('UNRECOGNISED PATHOLOGY ON LINE '+ (i+1) + ": " +pathology_tests[j] + " " +path_test[j]);
				}
			}
			ped.unshift(indi);
		}
	}
	return [hdr, ped];
}

/**
 * Get CanRisk formated pedigree.
 */
export function get_pedigree(dataset, famid, meta, isanon, version=2) {
	let msg = "##CanRisk " + (version === 1 ? "1.0" : "2.0");
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
	msg += "\n##FamID\tName\tTarget\tIndivID\tFathID\tMothID\tSex\tMZtwin\tDead\tAge\tYob\tBC1\tBC2\tOC\tPRO\tPAN\tAshkn"

	let gt = (version === 1 ? genetic_test1 : genetic_test2);
	for(let i=0; i<gt.length; i++) {
		msg += "\t"+gt[i].toUpperCase();
	}
	msg += "\tER:PR:HER2:CK14:CK56";

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

		for(let j=0; j<gt.length; j++) {
			if(gt[j]+'_gene_test' in p &&
			   p[gt[j]+'_gene_test']['type'] !== '-' &&
			   p[gt[j]+'_gene_test']['result'] !== '-') {
				msg += p[gt[j]+'_gene_test']['type'] + ':';
				msg += p[gt[j]+'_gene_test']['result'] + '\t';
			} else {
				msg += '0:0\t';		// type, 0=untested, S=mutation search, T=direct gene test
									// result, 0=untested, P=positive, N=negative
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

export function show_risk_factor_store() {
	console.log("RISK_FACTOR_STORE::");
	$.each(RISK_FACTOR_STORE, function(name, val){
		console.log(name + " : " + val);
	});
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
