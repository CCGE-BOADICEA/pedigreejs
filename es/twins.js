/**
/* © 2023 Cambridge University
/* SPDX-FileCopyrightText: 2023 Cambridge University
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

// get the siblings of a given individual - sex is an optional parameter
// for only returning brothers or sisters
function getSiblings(dataset, person, sex) {
	if(person === undefined || !person.mother || person.noparents)
		return [];

	return $.map(dataset, function(p, _i){
		return  p.name !== person.name && !('noparents' in p) && p.mother &&
			   (p.mother === person.mother && p.father === person.father) &&
			   (!sex || p.sex == sex) ? p : null;
	});
}

// get the mono/di-zygotic twin(s)
export function getTwins(dataset, person) {
	let sibs = getSiblings(dataset, person);
	let twin_type = (person.mztwin ? "mztwin" : "dztwin");
	return $.map(sibs, function(p, _i){
		return p.name !== person.name && p[twin_type] == person[twin_type] ? p : null;
	});
}

// set two siblings as twins
export function setMzTwin(dataset, d1, d2, twin_type) {
	if(!d1[twin_type]) {
		d1[twin_type] = getUniqueTwinID(dataset, twin_type);
		if(!d1[twin_type])
			return false;
	}
	d2[twin_type] = d1[twin_type];
	if(d1.yob)
		d2.yob = d1.yob;
	if(d1.age && (d1.status == 0 || !d1.status))
		d2.age = d1.age;
	return true;
}

// get a new unique twins ID, max of 10 twins in a pedigree
export function getUniqueTwinID(dataset, twin_type) {
	let mz = [1, 2, 3, 4, 5, 6, 7, 8, 9, "A"];
	for(let i=0; i<dataset.length; i++) {
		if(dataset[i][twin_type]) {
			let idx = mz.indexOf(dataset[i][twin_type]);
			if (idx > -1)
				mz.splice(idx, 1);
		}
	}
	if(mz.length > 0)
		return mz[0];
	return undefined;
}

// sync attributes of twins
export function syncTwins(dataset, d1) {
	if(!d1.mztwin && !d1.dztwin)
		return;
	let twin_type = (d1.mztwin ? "mztwin" : "dztwin");
	for(let i=0; i<dataset.length; i++) {
		let d2 = dataset[i];
		if(d2[twin_type] && d1[twin_type] == d2[twin_type] && d2.name !== d1.name) {
			if(twin_type === "mztwin")
			  d2.sex = d1.sex;
			if(d1.yob)
				d2.yob = d1.yob;
			if(d1.age && (d1.status == 0 || !d1.status))
				d2.age = d1.age;
		}
	}
}

// check integrity twin settings
export function checkTwins(dataset) {
	let twin_types = ["mztwin", "dztwin"];
	for(let i=0; i<dataset.length; i++) {
		for(let j=0; j<twin_types.length; j++) {
			let twin_type = twin_types[j];
			if(dataset[i][twin_type]) {
				let count = 0;
				for(let j=0; j<dataset.length; j++) {
					if(dataset[j][twin_type] == dataset[i][twin_type])
						count++;
				}
				if(count < 2)
					delete dataset[i][[twin_type]];
			}
		}
	}
}