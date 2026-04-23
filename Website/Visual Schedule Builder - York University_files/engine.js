"use strict";

/*
This code is the exclusive property of

Visual Schedule Builder Inc.
www.vsbuilder.com
Copyright 2002-2014.
*/

var ENGINE = (function() {

	var my = {};

	function nextMask(mask) {
		var foundZero = false;
		var onesFound = 0;
		var newMask=mask;
		for (var i=mask.length-1; i>=0; i--) {
			var c = mask.charAt(i);
			if (c=='1' && !foundZero) {
				onesFound++;
			} else if (c=='0') {
				foundZero=true;
			} else {
				newMask = mask.substring(0,i)+"01";
				for (var n=0; n<onesFound; n++) {
					newMask+="1";
				}
				while (newMask.length<mask.length) {
					newMask+="0";
				}
				break;
			}
		}
		return newMask;
	}

	
	/**
	 * @param quickForm if true, will not use threading and will not return full
	 * result list. Instead, will call displayGenResults with results when done.
	 */
	my.doSearch = function(requirements,noTimer,complete) {
	
		var gResults = new Array();
		
		// Handle case of no input
		if (requirements.length<=0) {
			complete(gResults);
		}
		
		// Generate lists of courses according to the
		// requirements and how many courses are needed
		// in each requirement
		
		// Current Shells
		var shells = new Array();
		var pendingComputations = 0;
		goDeeper(shells,0);
	
		function goDeeper(shells,level) {
			var req=requirements[level];
			var again;
			var origMask=req.mask;
			do {
				var newMask=nextMask(req.mask);
				again=false;
				if (newMask!=req.mask) {
					again=true;
				}
				var nbPushed=0;
				for (var si=0; si<req.shells.length; si++) {
					if (req.mask.charAt(si)=='0') continue;
					var courseShell=req.shells[si];
					shells.push(courseShell);
					nbPushed++;
				}
				if (level+1>=requirements.length) {
					// Hit end of leaf.
					// Do Search with these courses.
					computeShellConflicts(shells);
				} else {
					goDeeper(shells,level+1);
				}
				shells.length=shells.length-nbPushed;
				req.mask=newMask;
				if (!again) {
					req.mask=origMask;
				}
			} while (again);
		}
		
	
		
		function computeShellConflicts(shells) {
			
			pendingComputations++;
			
			// Determine buffer size
			var maxTbs=0;
			var maxIncs=0;
			for (var shelli=0;shelli<shells.length;shelli++) {
				var usels = shells[shelli].cnf.cnPro.cn.usels;
				var includes = shells[shelli].includes;
				if (includes.length>maxIncs) {
					maxIncs=includes.length;
				}
				for (var inci=0;inci<includes.length;inci++) {
					var uselIndex=includes[inci];
					var len=usels[uselIndex].bs.length;
					if (len>maxTbs) {
						maxTbs=len;
					}
				}
			}
	
			// Determine needed size and allocate buffer
			var jumpUsel=nextPowerOf2(maxTbs);
			var jumpShell=nextPowerOf2(jumpUsel*maxIncs);
			var resetUsel=~(jumpUsel-1);
			var resetShell=~(jumpShell-1);
			var buffer = new Array();
			buffer.length=jumpShell*shells.length;
	
			// Fill in buffer
			for (var shelli=0;shelli<shells.length;shelli++) {
				var usels=shells[shelli].cnf.cnPro.cn.usels;
				var includes=shells[shelli].includes;
				for (var inci=0;inci<includes.length;inci++) {
					var usel=usels[includes[inci]];
					for (var tbi=0;tbi<usel.bs.length;tbi++) {
						buffer[jumpShell*shelli+jumpUsel*inci+tbi]=usel.bs[tbi];
					}
				}
			}
	
			// Use buffer. This is akin to adding one course at a time
			// and trying every possiblity.
			var ptr=new Array();
			var nbBlocks=new Array(); // # of timeblocks before this depth
			nbBlocks[0]=0;
			for (var shelli=0;shelli<shells.length;shelli++) {
				ptr[shelli]=shelli*jumpShell;
			}
			var depth=0;
			var blocki=0;
			var timeblocks=new Array(); // keeps track of confirmed non-conflicting set of timeblocks
			
			var d1 = new Date();
			//console.log("t1:"+d1.getTime());
			var timeouts=0;
			var done=false;
			var processLoop = function(shellsCopy,complete) {
				for (var loop=0;noTimer||loop<50000;loop++) {
					var tb1=buffer[ptr[depth]+blocki];
					var tb2=buffer[ptr[depth]+blocki+1];
					if (tb1==undefined && blocki==0) {
						// uselection DNE, so go shallower
						ptr[depth]=depth*jumpShell;
						depth--;
						if (depth<0) {
							// done searching
							done=true;
							break;
						}
						ptr[depth]=ptr[depth]+jumpUsel;
						timeblocks.length=nbBlocks[depth];
						continue;
					}
					if (tb1==undefined) {
						// end of uselection.
						if (depth>=ptr.length-1) {
							// found result! Save it.
							var uselis=new Array();
							uselis.length=depth;
							for (var shelli=0;shelli<=depth;shelli++) {
								uselis[shelli]=(ptr[shelli]-shelli*jumpShell)/jumpUsel;
							}
							
							// do scoring here with timeblocks array
							var scores=computeScores(timeblocks,gResults.length);
							var result=new Result(gResults.length,uselis,scores,shellsCopy);
							//computeCohortness(result,gResults.length);
							gResults.push(result);
		
							// Move to next usel
							timeblocks.length-=blocki;
							blocki=0;
							ptr[depth]=ptr[depth]+jumpUsel;
							continue;
						} else {
							depth++;
							nbBlocks[depth]=timeblocks.length;
							blocki=0;
						}
						
						continue;
					}
		
					var conflict=false;
					for (var tbi=0;tbi<timeblocks.length;tbi+=2) {
						var c1=isConflict(timeblocks[tbi],tb1);
						var c2=isConflict(timeblocks[tbi+1],tb2);
						if (c1&&c2) {
							conflict=true;
							break;
						}
					}
					if (conflict) {
						// Move to next usel
						timeblocks.length-=blocki;
						blocki=0;
						ptr[depth]=ptr[depth]+jumpUsel;
						continue;
					} else {
						// We need to add to timeblocks
						timeblocks.push(tb1);
						timeblocks.push(tb2);
						blocki+=2;
					}
				}
				$("#procStatus").html(i8n.found+" "+gResults.length+" "+i8n.results +"..."); //found X results
				if (!done) {
					timeouts++;
					setTimeout(function() {
						processLoop(shellsCopy,complete);
					},10);
				} else {
					pendingComputations--;
					if (pendingComputations==0) {
						complete(gResults);
					}
					//displayGenResults(gResults);
				}
			};
			
			// We have to copy shells var into another array because
			// if we use SetTimeout, then this method will exit
			// and clear the shells var,
			var shellsCopy = new Array();
			for (var i=0; i<shells.length;i++) {
				shellsCopy.push(new Shell(shells[i].cnf,shells[i].includes));
			}
			
			if (noTimer) {
				processLoop(shellsCopy,complete);
			} else {
				setTimeout(function() {
					processLoop(shellsCopy,complete);
				},10);
			}
		}
	
		function isConflict(tb1,tb2) {
			var t2End=tb2<<16;
			var t1Start=tb1;
			var t2Start=tb2;
			var t1End=tb1<<16;
			return t2End>t1Start && t2Start<t1End;
		}	
	
		function nextPowerOf2(val) {
			var v=2;
			while (v<=val) {
				v=v*2;
			}
			return v;
		}
	}
	
	my.generateResults = function(gState,combosOnly,complete) {
		// Build requirements
		var reqs = [];
		var droppingAll=true;
		var combos=1;
		for (var i=0; i<gState.cnfs.length; i++) {
			var cnf=gState.cnfs[i];
			
			if (cnf.ignore || cnf.drop.indexOf("dp_")==0) {
				// intention to drop or skip
				continue;
			}
			droppingAll=false;
			
			var shell = cnf.toShell(false);
			var req = null;
			var shells = [];
			if (cnf.reqId!=null) {
				for (var j=0;j<reqs.length;j++) {
					if (cnf.reqId==reqs[j].reqId) {
						req = reqs[j];
						shells = req.shells;
					}
				}		
			}
			shells.push(shell);
			if (req==null) {
				req=new Requirement(shells,1,cnf.reqId);
				reqs.push(req);
			}
			if (cnf.isPinned()) {
				// If a course is pinned, then inform the requirement
				// so it knows to not include all other shells in the same reqId.
				req.pinAt=shells.length-1;
			}
			req.resetMask();
			
			combos=combos*(shell.includes.length);
		}
		if (combosOnly) {
			return combos;
		}
		
		if (droppingAll) {
			// Put one empty result so user can drop all classes
			var results=[];
			results.push(new Result(null));
			if (complete) {
				complete(results);
			}
			return;
		}
		
		// Do search
		my.doSearch(reqs,false,complete);
	}
	
	
	
	// Compute scores when given
	// an Array of TimeBlocks as time1,date1,time2,date2,etc...
	//
	// Scores:
	//	[0]=daysoff
	//	[1]=morning
	//	[2]=midday
	//	[3]=evening
	//	[4]=timeatschool (inverse of timeoffcampus)
	//	[5]=timeinclass
	//	[6]=score (not used)
	//  [7]=cohortness (computed later)
	function computeScores(timeblocks,tinyShift) {
		var dates = new Array();
		for (var i=1;i<timeblocks.length;i+=2) {
			
			var date=timeblocks[i];
			
			// Date Start
			var date1=date>>16;
			var have=false;
			for (var j=dates.length-1;j>=0;j--) {
				if (dates[j]==date1) {
					have=true;
					break;
				}
			}
			if (!have) {
				dates.push(date1);
			}
			
			// Date End
			var date2=date&0x0000FFFF;
			var have=false;
			for (var j=dates.length-1;j>=0;j--) {
				if (dates[j]==date2) {
					have=true;
					break;
				}
			}
			if (!have) {
				dates.push(date2);
			}
			
		}
		dates.sort();
		
	    var daysOff = 0;
	    var morning = 0;
	    var midday = 0;
	    var evening = 0;
	    var timeOffCampus = 0;
	    var timeInClass = 0;
	    
	    if (dates.length <= 0) {
	    	// This is for the rare case where all the classes on the schedule are
	    	// unscheduled, causing the computation below to be skipped, so we need
	    	// to compensate for this one
	    	daysOff = 9999;
	    }
		
	    var startTimes = new Array();
	    var endTimes = new Array();
	    startTimes.length=7;
	    endTimes.length=7;
	    
	    // for each date segment
		for (var i=0; i<dates.length-1; i++) {
			var date1=dates[i];
			var date2=dates[i+1];
			var duration = date2-date1;
			
			for (var d=0;d<=6;d++) {
	    		startTimes[d]=-1;
	    		endTimes[d]=-1;			
			}
			
			// for each timeblock in the date segment
			for (var j=0; j<timeblocks.length; j+=2) {
				var date=timeblocks[j+1];
				var date1b=date>>16;
				var date2b=date&0x0000FFFF;
				
				// See if date intersects
				if (!(date2>date1b&&date1<date2b)) continue;
				
				var time=timeblocks[j];
				var startTimeW=(time&0x3FFF0000)>>16;
				var endTimeW=time&0x00003FFF;
				var startTime=startTimeW%1440;
				var endTime=endTimeW%1440;
				var day=(startTimeW-startTime)/1440;
				
				timeInClass += (endTime - startTime) * duration;
				if (startTimes[day]==-1 || startTime < startTimes[day]) {
					startTimes[day] = startTime;
				}
				if (endTimes[day]==-1 || endTime > endTimes[day]) {
					endTimes[day] = endTime;
				}
			}
			
			// compute scores
	        var morningSeg = 0;
	        var middaySeg =  0;
	        var eveningSeg = 0;
	        var daysOffSeg = 0;
	        var timeOffCampusSeg = 0; // total number of minutes need "at school"
	
	        // For Sunday through Saturday
	        for (var dayi=0; dayi<=6; dayi++) {
	
	        	var todaysEarliest = startTimes[dayi];
	        	var todaysLatest = endTimes[dayi];
	        	
	            if (todaysEarliest!=-1) {
	                // if earliest time before 6pm, penalize it
	                if (todaysEarliest<1080) {
	                    eveningSeg -= Math.pow(1080-todaysEarliest,1.6);
	                }
	                middaySeg -= (todaysEarliest-780)*(todaysEarliest-780); // Penalize difference squared from 1pm
	            } else {
	                daysOffSeg++;
	            }
	
	            if (todaysLatest!=-1) {
	                // if latest time after 11am, penalize it
	                if (todaysLatest>660) {
	                    morningSeg -= Math.pow(todaysLatest-660,1.6);
	                }
	                middaySeg -= (todaysLatest-780)*(todaysLatest-780); // Penalize difference squared from 1pm
	            }
	            
	            if (todaysEarliest!=-1 && todaysLatest!=-1) {
	            	timeOffCampusSeg -= todaysLatest-todaysEarliest;
	            }
	        } // for each day
			
	    	morning += morningSeg * duration;
	    	midday += middaySeg * duration;
	    	evening += eveningSeg * duration;
	    	timeOffCampus += timeOffCampusSeg * duration;
	    	daysOff += daysOffSeg * duration;
			
		}
		
		//console.log("scores:"+daysOff+","+morning+","+midday+","+evening+","+timeOffCampus+","+timeInClass);
		
		// TinyShift is to keep things in original order
		// as last priority
		var t=tinyShift/9000000;
		daysOff-=t;
		morning-=t;
		midday-=t;
		evening-=t;
		timeOffCampus-=t;
		timeInClass-=t;
		
		return [daysOff,morning,midday,evening,timeOffCampus,timeInClass,3,100];
		
	}
	
	// Compute the amount of overlap between all the
	// timeBlocks and the busyBlocks.
	// Then compute overlap in results.
	my.computeOverlap = function(gState) {

		// Convert BusyBlocks to busyTimeBlocks
		var busyTimeBlocks = new Array();
		for (var i=0; i<gState.bbs.length; i++) {
			var bb = gState.bbs[i];
			busyTimeBlocks.push(new TimeBlock(0,bb.day,bb.hourStart*60,bb.hourEnd*60+60,bb.d1,bb.d2,""));
		}

		var allTbs=new Array();
		for (var c=0;c<gState.cnfs.length;c++) {
			var cnPro=gState.cnfs[c].cnPro;
			if (!cnPro.filterPass) continue;
			for (var u=0;u<cnPro.uselPros.length;u++) {
				var uselPro=cnPro.uselPros[u];
				if (!uselPro.filterPass) continue;
				for (var s=0;s<uselPro.selPros.length;s++) {
					var selPro=uselPro.selPros[s];
					if (!selPro.filterPass) continue;
					for (var b=0;b<selPro.sel.classes.length;b++) {
						var cls=selPro.sel.classes[b];
						allTbs=allTbs.concat(cls.timeblocks);
					}
				}
			}
		}

		// Compare timeblocks against busyTimeBlocks
		// and update the timeblocks
		for (var i=0; i<allTbs.length; i++) {
			var a = allTbs[i];
			var overlap=0;
			for (var j=0; j<busyTimeBlocks.length; j++) {
				var b = busyTimeBlocks[j];
				if (a.day!=b.day) continue;
				// Skip if out of date range
				if (b.d2<a.d1 || b.d1>a.d2) continue;
				if ((b.t2) < a.t1 || b.t1 > (a.t2)) continue;
				// Compute amount of overlap
				if (a.t1<b.t1) {
					if (a.t2<b.t2) {
						overlap+=(a.t2-b.t1);
						continue;
					} else {
						overlap+=(b.t2-b.t1);
						continue;
					}
				} else {
					if (a.t2<b.t2) {
						overlap+=(a.t2-a.t1);
						continue;
					} else {
						overlap+=(b.t2-a.t1);
						continue;
					}
				}
			}
			// Assign the computed overlap to the timeblock
			a.overlap=overlap;
		}

		// Recompute the scores for each Selection
		for (var i=0; i<gState.cnfs.length; i++) {
			var cnPro=gState.cnfs[i].cnPro;
			for (var j=0; j<cnPro.uselPros.length; j++) {
				var uselPro=cnPro.uselPros[j];
				var usel=uselPro.usel;
				var overlap=0;
				if (usel.sels.length>0) {
					var sel=usel.sels[0];
					for (var l=0; l<sel.classes.length; l++) {
						var cls=sel.classes[l];
						for (var m=0; m<cls.timeblocks.length; m++) {
							var timeblock=cls.timeblocks[m];
							overlap+=timeblock.overlap;
						}
					}
				}
				uselPro.overlap=overlap;
			}
		}

		// Set the overlap for each result
		for (var i=0; i<gState.results.length; i++) {
			var result=gState.results[i];
			var overlap=0;
			var lastuselPro=null;
			for (var j=0; j<result.selPros.length; j++) {
				var selPro = result.selPros[j];
				if (selPro.uselPro==lastuselPro) continue; // don't count selections twice
				overlap+=selPro.uselPro.overlap;
				lastuselPro=selPro.uselPro;
			}
			result.overlap=overlap;
		}

	}
	
	// Keep methods:
	// 1. Keep as many previous UniqueSelections (cnf.cs) as possible
	// 2. ...while ensuring the highest score (personal block, change sort)
	// (multiple results may have the same highest score)
	my.sortAndFilterResults = function(gState,forceSameResultId) {
		
		for (var i=0;i<gState.cnfs.length;i++) {
			var cnf=gState.cnfs[i];
			cnf.applyPostFilters(gState.filters);
		}
		
		gState.sortedFilteredResults = optimizedSortAndFilter(gState.sort,gState.results,gState.sortedFilteredResults.length,gState.filters,gState.reasons,forceSameResultId);
	}
	
	function optimizedSortAndFilter(sort,results,previousLength,filters,reasons,forceSameResultId) {

		var tryTokeepOldResult = previousLength>0 && BB.r<previousLength;
		if (tryTokeepOldResult) {
			//console.log("Will try to keep result before this sort/filter action");
		} else {
			//console.log("Not trying keep last result (saving a previous one)");
		}

		//var d0=(new Date()).getTime();
		//console.log("1: 0");
		
		// Set the temporary score variable
		var index=-1;
		if (sort=="daysoff") {
			index=0;
		}
		else if (sort=="morning") {
			index=1;
		}
		else if (sort=="midday") {
			index=2;
		}
		else if (sort=="evening") {
			index=3;
		}
		else if (sort=="timeatschool") {
			index=4;
		}
		else if (sort=="timeinclass") {
			index=5;
		}
		else if (sort=="score") {
			index=6;
		}
		else if (sort=="cohort") {
			index=7;
		}

		var needsSort=false;
		for (var i=0; i<results.length; i++) {
			var result = results[i];
			var s = -1000000000*result.overlap;
			if (index>=0) {
				s+=result.scores[index];
			} else {
				s-=result.id/9000000; // tinyShift
			}
			if (s!=0) {
				needsSort=true;
			}
			result.score = s;
		}
		
		//var d2=(new Date()).getTime();
		//console.log("2: "+(d2-d0));


		// this will create a copy of the array
		var sortedFilteredResults = [];

		var reasonPins=true;
		var reasonCoreqs=false;
		var reasonHideNoHonors=false;

		// Filter out results
		if (true) {

			var j=0;
			for (var i=0; i<results.length; i++) {
				var result = results[i];

				// Make sure the result contains all the pinned unique selection keys
				{
					var missing=false;
					var lastUsel=null;
					for (var seli=0; seli<result.selPros.length; seli++) {
						var selPro=result.selPros[seli];
						var uselPro=selPro.uselPro;
						if (uselPro.cnf.drop.charAt(2)=="_") {
							var usel=uselPro.usel;
							if (usel!=lastUsel) {
								if (missing) {
									// Last usel did not match drop
									break;
								}
								missing=true;
							}
							if (selPro.sel.key==uselPro.cnf.drop.substr(3)) {
								missing=false;
							}
							lastUsel=usel;
						}
					}
					if (missing) continue;
				}

				reasonPins=false;

				// If the result has no selections, it's because
				// it's a placeholder result.
				if (result.selPros.length>0) {
					// Make sure at least 1 good selection from each USelection that passes the filters.
					var goodOne=false;
					var ready=false;
					var lastUSelPro=null;
					var honInSched=0;
					for (var seli=0; seli<result.selPros.length; seli++) {
						var selPro=result.selPros[seli];
						if (selPro.uselPro==lastUSelPro && goodOne && ready) {
							continue;
						}
						if (selPro.uselPro!=lastUSelPro) {
							if (lastUSelPro!=null && !goodOne) {
								// Discovered USelection with no Selections that went through the filter.
								break;
							}
							goodOne=false;
							lastUSelPro=selPro.uselPro;
						}
						if (!selPro.postPass) {
							continue;
						}
						
						// Check co-reqs
						if (!selPro.isSatisfied(result.selPros,filters)) {
							reasonCoreqs=true;
							continue;
						}
	
						// If we got here, this Selection passes the selection filters.
						honInSched+=selPro.sel.hon;
						goodOne=true;
						ready=true;
						if (filters.hideNoHonors && honInSched<=0) {
							// Try again becasue we didn't find an honors class yet.
							ready=false;
						}
					}
					if (!goodOne) continue;
	
					// Check to see if schedule result passes the schedule filters.
					if (filters.hideNoHonors && honInSched<=0) {
						reasonHideNoHonors=true;
						continue;
					}
				}

				sortedFilteredResults.push(result);
			}
		}
		
		//var d3=(new Date()).getTime();
		//console.log("3: "+(d3-d0));

		// Sort the results
		if (needsSort) {
			sortedFilteredResults.sort(function(a,b){return b.score-a.score;});
		}
		
		//var d4=(new Date()).getTime();
		//console.log("4: "+(d4-d0));
		
		// Get the first result that does not overlap
		var nonOverlapResults=0
		for (var i=0;i<sortedFilteredResults.length;i++) {
			if (sortedFilteredResults[i].score>-1000000000) {
				nonOverlapResults++;
			}
		}
		
		sortedFilteredResults = sortedFilteredResults;
		
		reasons.nonOverlapResults=nonOverlapResults;
		reasons.reasonPins=reasonPins;
		reasons.reasonCoreqs=reasonCoreqs;
		reasons.reasonHideNoHonors=reasonHideNoHonors;

		//var d5=(new Date()).getTime();
		//console.log("5: "+(d5-d0));
		
		// Handle which result should display
		if (sortedFilteredResults.length>0) {
			var bestScore = sortedFilteredResults[0].score;
			
			// Get new score of closest result
			var closestResultIndex = findClosestResult(sortedFilteredResults);
			var closestResultScore = sortedFilteredResults[closestResultIndex].score;
			
			if (!forceSameResultId && (bestScore > closestResultScore+0.5)) {
				// Result(s) 0 to (something) have higher score than old result's score. Reset.
				BB.r=findClosestResult(sortedFilteredResults,true);
				//console.log("Near first result is best");
			} else {
				// Keep the closest/old result
				BB.r=closestResultIndex;
				//console.log("Previous result is "+(forceSameResultId?"forcedSameId":"fine")+(BB.r==0?" but cannot be found.":" and was found"));
			}
		} else {
			//console.log("Not attempting to find old result");
			BB.r=0;
		}
		
		//var d6=(new Date()).getTime();
		//console.log("6: "+(d6-d0));
		
		// Alert JAWS
		if (previousLength!=sortedFilteredResults.length && sortedFilteredResults.length>0) {
			_alert("Now there are "+sortedFilteredResults.length+" results. You are viewing result number "+(BB.r+1));
		}
		
		return sortedFilteredResults;
		
	}
	
	
	function findClosestResult(sortedFilteredResults,bestScoreOnly) {
		var mostFound=0;
		var best=0;
		var topScore=sortedFilteredResults[0].score;
		for (var i=0; i<sortedFilteredResults.length; i++) {
			var found=0;
			var result=sortedFilteredResults[i];
			// 0.5 is to ignore the "tinyShift" used to keep things
			// in original order as last priority (up to 3.5M results)
			if (bestScoreOnly && result.score<(topScore-0.5)) break;
			for (var j=result.selPros.length; j>0 && j+found>=mostFound; j--) {
				if (result.selPros[j-1].isChosen()) {
					found++;	
				}
			}
			if (found>mostFound) {
				mostFound=found;
				best=i;
			}
		}
		//console.log("Found "+(bestScoreOnly?"best ":"")+"result with "+mostFound+" same cs's");
		return best;
	}
	
	return my;

}());



//It is a list of indexes of the 'CodeNumber.usels' array.
//For example, {1,3} would include CodeNumber.usels[1]
//and CodeNumber.usels[3]
//in the search.
function Shell(cnf,includes) {
	this.cnf=cnf;
	this.includes=includes;
}


function Requirement(shells,needed,reqId) {
	this.needed=needed;
	this.shells=shells;
	this.reqId=reqId;
	this.pinAt=null;
	this.resetMask = function() {
		var m="";
		for (var i=0;i<this.shells.length;i++) {
			if (i<needed) {
				m+='1';
			} else {
				m+='0';
			}
		}
		this.mask=m;
		
		if (this.pinAt!=null) {
			for (var i=0;i<shells.length;i++) {
				if (i==this.pinAt) continue;
				shells[i].includes=[];
			}
		}
	}
	this.resetMask();
}

function ResultSet(results,allToDrop) {
	this.results=results;
	this.allToDrop=allToDrop;
}

function Result(id,uselis,scores,shells) {
	this.id=id;
	this.scores=scores?scores:[0,0,0,0,0,0,0,0,0,0,0,0];
	
	// just for sorting:
	this.overlap=0;
	this.score=0; 
	
	this.selPros = new Array();	
	if (uselis!=null) {
		for (var i=0; i<uselis.length; i++) {
			var useli=uselis[i];
			var useli2=shells[i].includes[useli];
			var uselPro=shells[i].cnf.cnPro.uselPros[useli2];
			for (var j=0; j<uselPro.selPros.length; j++) {
				this.selPros.push(uselPro.selPros[j]);
			}
		}
	}
}