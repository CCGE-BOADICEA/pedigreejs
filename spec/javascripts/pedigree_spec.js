describe('Test pedigree SVG ', function() {
	var wid = 600;
	var hgt = 500;
	var opts = {
			targetDiv : 'pedigree_edit',
			width : wid,
			height : hgt,
			symbol_size: 35,
			validate: true
		}
	
	var ds1 = [
  		{"name": "m21", "sex": "M", "top_level": true},
		{"name": "f21", "sex": "F", "top_level": true},
		{"name": "ch1", "sex": "F", "mother": "f21", "father": "m21", "bc1":  true, "proband": true}
	];
	
	var ds2 = [
		{"name":"hGf","sex":"F","top_level":true,"status":0},
		{"name":"tRc","sex":"M","top_level":true},
		{"name":"James","sex":"M","mother":"hGf","father":"tRc","noparents":true},
		{"name":"Sarah","sex":"F","noparents":true,"mother":"hGf","father":"tRc"},
		{"name":"fcc","sex":"F","mother":"hGf","father":"tRc"},
		{"name":"bMo","sex":"M","mother":"fcc","father":"James"},
		{"name":"OAa","sex":"M","mother":"hGf","father":"tRc"},
		{"name":"m21","sex":"M","mother":"Sarah","father":"OAa"},
		{"name":"Pat","sex":"F","noparents":true,"mother":"Sarah","father":"OAa"},
		{"name":"ch1","sex":"F","mother":"Pat","father":"m21","bc1":true,"proband":true}];
	
	var ds3 = [
		{"name":"Yvb","sex":"F","top_level":true},
		{"name":"UTN","sex":"M","top_level":true},
		{"name":"cMy","sex":"M","top_level":true},
		{"name":"KSc","sex":"F","top_level":true},
		{"name":"m21","sex":"M","mother":"Yvb","father":"UTN"},
		{"name":"f21","sex":"F","mother":"KSc","father":"cMy","status":0},
		{"name":"IWS","sex":"M","mother":"f21","father":"m21"},
		{"name":"Jane","sex":"F","mother":"f21","father":"m21","noparents":true},
		{"name":"GJi","sex":"M","mother":"Jane","father":"IWS"},
		{"name":"CbB","sex":"M","mother":"f21","father":"m21"},
		{"name":"Ana","sex":"F","mother":"f21","father":"m21","noparents":true},
		{"name":"ch1","sex":"F","mother":"f21","father":"m21","bc1":true,"proband":true},
		{"name":"Dan","sex":"M","mother":"YlJ","father":"qLM"},
		{"name":"rie","sex":"M","mother":"Ana","father":"CbB"},
		{"name":"Tom","sex":"M","mother":"ch1","father":"Dan"},
		{"name":"qLM","sex":"M","mother":"KSc","father":"cMy","noparents":true},
		{"name":"YlJ","sex":"F","mother":"KSc","father":"cMy","noparents":true}];
 
	var bwa_v4 = "BOADICEA import pedigree file format 4.0\n" +
			"FamID	Name	Target	IndivID	FathID	MothID	Sex	MZtwin	Dead	Age	Yob	1stBrCa	2ndBrCa	OvCa	ProCa	PanCa	Ashkn	BRCA1t	BRCA1r	BRCA2t	BRCA2r	PALB2t	PALB2r	ATMt	ATMr	CHEK2t	CHEK2r	ER	PR	HER2	CK14	CK56\n"+
			"XXXX	0	0	lgzm	0	0	F	0	0	92	1925	81	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0\n" +
			"XXXX	1	0	VqNY	0	0	M	0	1	78	1939	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0\n" +
			"XXXX	2	0	m21	0	0	M	0	0	68	1949	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0\n" +
			"XXXX	3	0	f21	VqNY	lgzm	F	0	0	67	1950	67	0	0	0	0	0	S	P	0	0	0	0	0	0	0	0	P	0	0	0	0\n" +
			"XXXX	4	1	ch1	m21	f21	F	0	0	43	1974	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0	0";

	var linkage_ped = 	"ex1 father 0 0 1 2 1 2\n" +
						"ex1 mother 0 0 2 1 1 1\n" +
						"ex1 dau1 father mother 2 1 1 2\n" +
						"ex1 dau2 father mother 2 2 1 2\n" +
						"ex1 son1 father mother 1 2 1 2\n" +
						"ex1 dau3 father mother 2 1 1 1\n" +
						"ex1 son2 father mother 1 1 1 1";

	beforeEach(function() {
		$('body').append("<div id='pedigree_edit'></div>");
		ptree.build(opts);
	});

	afterEach(function() {
		d3.selectAll('svg').remove();
		localStorage.clear();
		sessionStorage.clear();
	});

	function getGlobals() {
		// show global variables and functions
	    var iframe = document.createElement('iframe');
	    iframe.src = "about:blank";
	    document.body.appendChild(iframe);

	    var windowVars = Object.keys(iframe.contentWindow);
	    var globalVars = Object.keys(window);
	    for(var widx in windowVars) {
	    	var idx = globalVars.indexOf(windowVars[widx]);
	    	if(idx > -1)
	    		globalVars.splice(idx, 1);
	    }
	    console.log("Global vars:", globalVars);
	    document.body.removeChild(iframe);
	}
	
	describe('the svg', function() {
		it('should be created', function() {
			getGlobals();
			expect(d3.select('svg')).not.toBeNull();
		});

		it('should have the correct height', function() {
			expect(d3.select('svg').attr('height')).toBe(hgt.toString());
		});

		it('should have the correct width', function() {
			expect(d3.select('svg').attr('width')).toBe(wid.toString());
		});

		it('should contain a background rectangle', function() {
			expect(d3.select('svg').select('rect')).not.toBeNull();
		});

		it('should have a background rectangle with a width of 100%', function() {
			expect(d3.select('svg').select('rect').attr('width')).toBe('100%');
		});

		it('should contains a g group element with a diagram class', function() {
			expect(d3.select('svg').select("g.diagram").classed("diagram")).toBe(true);
		});
	});
	
	// check for links between partners that clash
	function check_clashing_partner_links(newopts) {
		for(var i=0; i<newopts.dataset.length; i++) {
			if(ptree.check_ptr_link_clashes(newopts, newopts.dataset[i]))
				return true;
		}
		return false;
	}

	// check for nodes that overlap
	function check_nodes_overlapping(newopts) {
		var fn = pedigree_util.flatten(ptree.roots[newopts.targetDiv]);
		for(var i=0; i<fn.length; i++)
			expect(pedigree_util.overlap(newopts, fn, fn[i].x, fn[i].depth, [fn[i].data.name])).toBe(false);
	}

	// check for individuals that aren't connected to the target
	function check_unconnected(newopts) {
		expect(ptree.unconnected(newopts.dataset).length).toBe(0);
	}

	describe('the pedigree utility', function() {
		var newopts;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds1);
		});

		it('should identify nodes overlapping', function() {
			var flattenNodes = pedigree_util.flatten(ptree.roots[opts.targetDiv]);
			var n1 = pedigree_util.getNodeByName(flattenNodes, 'm21');
			var n2 = pedigree_util.getNodeByName(flattenNodes, 'f21');
			n1.x = n2.x;
			expect(pedigree_util.overlap(opts, flattenNodes, n1.x, n1.depth, [n1.data.name])).toBe(true);
		});

		it('should confirm nodes are not overlapping', function() {
			var fnodes = pedigree_util.flatten(ptree.roots[opts.targetDiv]);
			for(var i=0; i<fnodes.length; i++) {
				var node = fnodes[i];
				expect(pedigree_util.overlap(opts, fnodes, node.x, node.depth, [node.data.name])).toBe(false);
			}
		});

		it('should confirm individuals are all connected to the proband', function() {
			check_unconnected(newopts);
		});

		it('should identify individuals that are not connected to the proband', function() {
			newopts.dataset.push({"name": "frank", "sex":"M"});
			var unconnected = ptree.unconnected(newopts.dataset);
			expect(unconnected.length).toBe(1);
			expect(unconnected[0]).toBe("frank");
		});
	});

    // test validation
    describe('the pedigree data', function() {
            beforeEach(function() {
                    newopts = $.extend({}, opts);
                    newopts.dataset = ptree.copy_dataset(ds1);
                    ptree.rebuild(newopts);
                    ncount = newopts.dataset.length;
            });

            it('should have unique names', function() {
            	    var err = "IndivID for family member unnamed (IndivID: f21) is not unique.";
                    expect(function() {ptree.build(newopts)}).not.toThrow(new Error(err));
                    var ch1 = pedigree_util.getNodeByName(newopts.dataset, 'ch1');
                    ch1.name = 'f21';
                    newopts.dataset = ptree.copy_dataset(newopts.dataset);
                    expect(function() {ptree.build(newopts)}).toThrow(new Error(err));
            });

            it('should expect mothers to be female', function() {
            		var err = "The mother of family member unnamed (IndivID: ch1) is not specified as female. All mothers in the pedigree must have sex specified as 'F'.";
                    expect(function() {ptree.build(newopts)}).not.toThrow(new Error(err));
                    var f21 = pedigree_util.getNodeByName(newopts.dataset, 'f21');
                    f21.sex = 'M';
                    newopts.dataset = ptree.copy_dataset(newopts.dataset);
                    expect(function() {ptree.build(newopts)}).toThrow(new Error(err));
            });

            it('should expect fathers to be male', function() {
        		var err = "The father of family member unnamed (IndivID: ch1) is not specified as male. All fathers in the pedigree must have sex specified as 'M'.";
                expect(function() {ptree.build(newopts)}).not.toThrow(new Error(err));
                var m21 = pedigree_util.getNodeByName(newopts.dataset, 'm21');
                m21.sex = 'F';
                newopts.dataset = ptree.copy_dataset(newopts.dataset);
                expect(function() {ptree.build(newopts)}).toThrow(new Error(err));
            });

            it('should expect father to present', function() {
        		var err = "The father (IndivID: m21) of family member unnamed (IndivID: ch1) is missing from the pedigree.";
                expect(function() {ptree.build(newopts)}).not.toThrow(new Error(err));
                newopts.dataset.splice(pedigree_util.getIdxByName(newopts.dataset, 'm21'), 1)   // remove father
                newopts.dataset = ptree.copy_dataset(newopts.dataset);
                expect(function() {ptree.build(newopts)}).toThrow(new Error(err));
            });

            it('should expect mother to present', function() {
        		var err = "The mother (IndivID: f21) of family member unnamed (IndivID: ch1) is missing from the pedigree.";
                expect(function() {ptree.build(newopts)}).not.toThrow(new Error(err));
                newopts.dataset.splice(pedigree_util.getIdxByName(newopts.dataset, 'f21'), 1)   // remove mother
                newopts.dataset = ptree.copy_dataset(newopts.dataset);
                expect(function() {ptree.build(newopts)}).toThrow(new Error(err));
            });

            it('should expect IndivID', function() {
        		var err = "Me (IndivID: undefined) has no IndivID.";
                expect(function() {ptree.build(newopts)}).not.toThrow(new Error(err));
                var ch1 = pedigree_util.getNodeByName(newopts.dataset, 'ch1');
                ch1.display_name = 'Me';
                delete ch1.name;
                newopts.dataset = ptree.copy_dataset(newopts.dataset);
                expect(function() {ptree.build(newopts)}).toThrow(new Error(err));
            });
    });

	describe('the addition of children', function() {
		var newopts, ncount;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds1);
			ptree.rebuild(newopts);
			ncount = newopts.dataset.length;
		});

		it('should be possible at the top level', function() {
			var f21 = pedigree_util.getNodeByName(newopts.dataset, 'f21');
			ptree.addchild(newopts.dataset, f21, 'F', 1);
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);

			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts)
			expect(newopts.dataset.length).toBe(ncount+1);
		});

		it('should be possible for the proband', function() {
			var ch1 = pedigree_util.getNodeByName(newopts.dataset, 'ch1');
			ptree.addchild(newopts.dataset, ch1, 'F', 2);
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);

			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts)
			expect(newopts.dataset.length).toBe(ncount+3);
		});

		it('should be possible as twins for the proband', function() {
			var ch1 = pedigree_util.getNodeByName(newopts.dataset, 'ch1');
			ptree.addchild(newopts.dataset, ch1, 'U', 2, "mztwin");
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);

			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts)
			expect(newopts.dataset.length).toBe(ncount+3);
		});
	});


	describe('the addition of sibling', function() {
		var newopts, ncount;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds1);
			ptree.rebuild(newopts);
			ncount = newopts.dataset.length;
		});

		it('should be possible for nodes with parents', function() {
			var ch1 = pedigree_util.getNodeByName(newopts.dataset, 'ch1');
			ptree.addsibling(newopts.dataset, ch1, "M");
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts)
			expect(newopts.dataset.length).toBe(ncount+1);
		});

		it('should be possible to add twins', function() {
			var ch1 = pedigree_util.getNodeByName(newopts.dataset, 'ch1');
			ptree.addsibling(newopts.dataset, ch1, ch1.sex, false, "dztwin");
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts)
			expect(newopts.dataset.length).toBe(ncount+1);
			expect(ch1.dztwin).toBeDefined();
		});
	});


	describe('the addition of a partner', function() {
		var newopts, ncount;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds1);
			ptree.rebuild(newopts);
			ncount = newopts.dataset.length;
		});
		
		it('should be possible to add a partner to nodes', function() {
			ptree.addpartner(newopts, newopts.dataset, 'ch1');
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts)
			expect(newopts.dataset.length).toBe(ncount+2);
		});
	});


	describe('the deletion of an individual', function() {
		var newopts;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds3);
			ptree.rebuild(newopts);
		});

		afterEach(function() {
			pedcache.clear();
			$('#msgDialog').remove();
		});
		
		it('should show message dialog if disallowed', function() {
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
			var fnodes = pedigree_util.flatten(ptree.roots[newopts.targetDiv]);
			var dan = pedigree_util.getNodeByName(fnodes, 'Dan');

			var err = "The mother (IndivID: KSc) of family member unnamed (IndivID: f21) is missing from the pedigree.";
			expect($('#msgDialog').length).toBe(0);
            expect(function() {ptree.delete_node_dataset(newopts.dataset, dan.data, newopts)}).toThrow(new Error(err));
			// message dialog
			expect($('#msgDialog').length).toBe(1);
			expect($('#msgDialog').text()).toBe("Deletion of this pedigree member is disallowed.");
		});
		
		it('should show confirmation dialog if splitting pedigree', function() {
			newdataset = ptree.copy_dataset(newopts.dataset);
			var fnodes = pedigree_util.flatten(ptree.roots[newopts.targetDiv]);
			var tom = pedigree_util.getNodeByName(fnodes, 'Tom');

			spyOn(utils, "messages");
            ptree.delete_node_dataset(newdataset, tom.data, newopts);
            expect(utils.messages).toHaveBeenCalled();   // message dialog
		});

		it('should be allowed', function() {
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
			var fnodes = pedigree_util.flatten(ptree.roots[newopts.targetDiv]);
			var ana = pedigree_util.getNodeByName(fnodes, 'Ana');
			ptree.delete_node_dataset(newopts.dataset, ana.data, newopts);
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts);
		});
	});


	describe('after the deletion of an individual', function() {
		var newopts;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds3);
			ptree.rebuild(newopts);
			var fnodes = pedigree_util.flatten(ptree.roots[newopts.targetDiv]);
			var ana = pedigree_util.getNodeByName(fnodes, 'Ana');
			ptree.delete_node_dataset(newopts.dataset, ana.data, newopts);
			newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
		});

		it('should not have any partner links clashing', function() {
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(check_clashing_partner_links(newopts)).toBe(false);
		});
		
		it('should not have nodes overlapping', function() {
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			check_nodes_overlapping(newopts);
		});
		
		it('should not have any individuals not connected to the target', function() {
			expect(function() {ptree.rebuild(newopts)}).not.toThrow();
			expect(ptree.unconnected(newopts.dataset).length).toBe(0);  // check if individuals aren't connected to target
		});
	});

	describe('the cached data', function() {
		it('should have a default dataset', function() {
			expect(pedcache.current(opts)).not.toBeNull();
		});

		it('should have default dataset with a proband', function() {
			expect(pedigree_util.getProbandIndex(pedcache.current(opts))).toBeDefined();
		});

		it('should be able to clear the cache', function() {
			pedcache.clear(opts);
			expect(pedigree_util.getProbandIndex(pedcache.current(opts))).not.toBeDefined();
		});

		it('should have a count greater than zero', function() {
			expect(pedcache.get_count(opts)).toBeGreaterThan(0);
		});

		it('should be able to append updates to', function() {
			var ncache = pedcache.get_count(opts);
			var idx = pedigree_util.getProbandIndex(ds3);
			var newdataset = ptree.copy_dataset(ds3); 
			ptree.addsibling(newdataset, newdataset[idx], 'F');
			var newopts = $.extend({}, opts);
			newopts.dataset = newdataset;
			ptree.rebuild(newopts);
			expect(parseInt(pedcache.get_count(newopts))).toBe(parseInt(ncache)+1);
			pedcache.clear();
		});
		
		it('can be stored as an array', function() {
			pedcache.clear();
			var newopts = $.extend({}, opts);
			newopts.store_type = "array";
			ptree.rebuild(newopts);
			expect(parseInt(pedcache.get_count(newopts))).toBe(1);
			var current = pedcache.current(newopts);
			var idx = pedigree_util.getProbandIndex(current);
			ptree.addsibling(current, current[idx], 'F');
			newopts['dataset'] = current;	
			ptree.rebuild(newopts);
			expect(parseInt(pedcache.get_count(newopts))).toBe(2);
			pedcache.clear();
		});
	});

	describe('the pedigree test data (1)', function() {
		var newopts;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds2);
			ptree.rebuild(newopts);
		});

		afterEach(function() {
			pedcache.clear();
		});

		it('should not have any partner links clashing', function() {
			for(var i=0; i<newopts.dataset.length; i++) {
				expect(ptree.check_ptr_link_clashes(newopts, newopts.dataset[i])).toBe(null);
			}
		});

	    function addParentTest(name) {
	    	it('should not have any partner links clashing when a parent is added to '+name, function() {
				// add parent
				newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
				ptree.addparents(newopts, newopts.dataset, name);
				ptree.rebuild(newopts);

				for(var i=0; i<newopts.dataset.length; i++) {
					expect(ptree.check_ptr_link_clashes(newopts, newopts.dataset[i])).toBe(null);
				}
			});
	    }
	    var kids = ['James', 'Sarah', 'Pat'];		
		for(var i=0; i<kids.length; i++)
			addParentTest(kids[i]);
	});
	
	
	describe('the pedigree test data (2)', function() {
		var newopts;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds3);
			ptree.rebuild(newopts);
		});

		afterEach(function() {
			pedcache.clear();
		});
		
		it('should not have any partner links clashing', function() {
			expect(check_clashing_partner_links(newopts)).toBe(false);
		});

		it('should not have any nodes overlapping', function() {
			check_nodes_overlapping(newopts);
		});

		it('should identify nodes overlapping', function() {
			var fn = pedigree_util.flatten(ptree.roots[newopts.targetDiv]);
			var n1 = pedigree_util.getNodeByName(fn, 'Yvb');
			n1.x = pedigree_util.getNodeByName(fn, 'cMy').x;
			expect(pedigree_util.overlap(newopts, fn, n1.x, n1.depth, [n1.data.name])).toBe(true);
		});
		
		// add a parent and test for clashes
	    function addParentTest(name, clashExpected) {
	    	it( (clashExpected ? 'should have' : 'should not have any')+
	    	 	 ' partner links clashing when a parent is added to '+name, function() {
				newopts['dataset'] = ptree.copy_dataset(newopts.dataset);
				ptree.addparents(newopts, newopts.dataset, name);
				ptree.rebuild(newopts);
				expect(check_clashing_partner_links(newopts)).toBe(clashExpected);
			});
	    }
	    var kids = [{'name':'Jane', 'clashExpected':false}, {'name':'Ana', 'clashExpected':true}];		
		for(var i=0; i<kids.length; i++)
			addParentTest(kids[i].name, kids[i].clashExpected);
	});
	
	// io
	describe('the input', function() {
		var newopts;
		beforeEach(function() {
			newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds1);
		});
		
		it('should allow bwa v4 format', function() {
			newopts['dataset'] = io.readBoadiceaV4(bwa_v4);
			ptree.rebuild(newopts);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts);
		});

		it('should allow linkage format', function() {
			newopts['dataset'] = io.readLinkage(linkage_ped);
			ptree.rebuild(newopts);
			check_nodes_overlapping(newopts);
			check_unconnected(newopts);
		});
	});
	
	// utils
	describe('the age and year of birth', function() {
		var year = new Date().getFullYear();
		var age = 48;
		var yob = year - age;
		it('should be consistent with current year for alive individuals', function() {
			var status = 0;       // status - 0 = alive, 1 = dead
			expect(utils.validate_age_yob(age, yob, status)).toBe(true);
			expect(utils.validate_age_yob(age-1, yob, status)).toBe(true);
			expect(utils.validate_age_yob(age+1, yob, status)).toBe(false); 
			expect(utils.validate_age_yob(age+2, yob, status)).toBe(false);
		});

		it('should be consistent with current year for decesased individuals', function() {
			var status = 1;       // status - 0 = alive, 1 = dead
			expect(utils.validate_age_yob(age, yob, status)).toBe(true);
			expect(utils.validate_age_yob(age-2, yob, status)).toBe(true);
			expect(utils.validate_age_yob(age+1, yob, status)).toBe(false);
		});
	});

	describe('the dialog window', function() {
		afterEach(function() {
			$('#msgDialog').remove();
		});
		it('should be displayed', function() {
			expect($('#msgDialog').length).toBe(0);
			utils.messages('title', 'hello');
			expect($('#msgDialog').length).toBe(1);
			expect($('#msgDialog').text()).toBe("hello");
		});
		
		it('should show confirmation dialog', function() {
			expect($('#msgDialog').length).toBe(0);
			var newopts = $.extend({}, opts);
			newopts.dataset = ptree.copy_dataset(ds1);
			var onConfirm = function(){return};
            utils.messages('title', 'hello', onConfirm, newopts, ds1);
			expect($('#msgDialog').length).toBe(1);
		});
	});

});
