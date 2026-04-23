"use strict";

// User Use Cases
var UU = (function() {
	var my = {};

	function loadState(state,pinAlso) {
		if (state.indexOf("shared=1")>=0) {
			pinAlso=true;
		}
		if (state.indexOf("nopin=1")>= 0) {
			pinAlso=false;
		}
		var append = (state.indexOf("loadFromPS=1")>=0);
		if (append) {
			if(window.localStorage){
				var state2=localStorage.getItem("vsbuilder.gstate");
				if (!(state2)) {
					append = false;
				} else {
					state=state2;
				}
			} else {
				append=false;
			}
		}
		
		window.BB = new BState(state);
		
		PAGES.settleWindow();
		RR.renderSort(BB.activeState.sort);
		RR.renderFilter(BB.activeState.filter);
		SLIDER.renderSlider();
		renderFavorites();
		updateAccess(true);

		// Select only term if there is only one
		var $r=$(".termRadio");
		if ($r.length==1) {
			$r.prop("checked",true)
			BB.activeState.term=$r.data("term");
		}
		
		// Get the keys we want
		var cnfs=BB.activeState.cnfs;
		var keys=[];
		for (var i=0;i<cnfs.length;i++) {
			if (!(cnfs[i].drop.indexOf("dp_")==0) && !cnfs[i].ignore) {
				var key=cnfs[i].cs;
				if (key==null) key=cnfs[i].cnKey;
				keys.push(key);
			}
		}

		BB.activeState.loadEnrollmentState(function() {
			if (append) {
				UU.caseLoadLocalStorage();
			}
			var courses=CC.paramOfStr(state,"courses","");
			UU.caseAddCourses(courses,function() {
				doInitialCampusSelection(BB.activeState);
				BB.activeState.process(function() {
					if (pinAlso) {
						BB.activeState.applySelkeysToDropdowns(keys);
						// Process a second time because dropdowns may have changed
						BB.activeState.process();
					}
				});
			},true);
		});
		
	}
	
	my.caseF5 = function() {
		var state=window.location.search.substring(1);
		loadState(state,false);
	}
	
	my.caseAddCourses = function(courses,complete,skipProcess) {
		if (courses=="0") return;
		UU.caseAddCourse(courses,function() {
			BB.activeState.outdated=true;
			if (skipProcess) {
				if (complete) complete();
			} else {
				BB.activeState.process(complete);
			}
		});
	}
	
	my.caseImportPlan = function(termCourses,pinAlso) {
		if (termCourses=="0") return;
		var term=termCourses.split(";")[0];
		var complete = function() {
			var courses=termCourses.split(";")[1];
			UU.caseAddCourses(courses,function() {
				RR.addGoodWarning("Plan import complete.");
			});
		}
		if (BB.activeState.term!=term) {
			my.caseChangeTerm(term,complete);
		} else {
			complete();
		}
	}
	
	my.caseChangeLanguage = function(lang) {
		BB.lang=lang;
		sendStateToUrl(true);
		window.location.reload(false);
	}
	
	my.caseLoadFavorite = function() {
		var state=BB.previewState.toStr()
		loadState(state,true);
		sendStateToUrl(true);
	}
	
	my.caseLoadRecommendation = function(state) {
		loadState(state,true);
		sendStateToUrl(true);
	}
	
	my.caseBackButton = function() {
		my.caseF5();
	}
	
	my.caseChangeTerm = function(term,complete) {
		BB.activeState.term=term;
		BB.activeState.cnfs=new Array();
		BB.activeState.outdated=true;
		BB.activeState.loadEnrollmentState(function() {
			BB.activeState.process(complete);
			sendStateToUrl(true);
		});
	}
	
	my.caseChangeTimezone = function(tz) {
		BB.tz=tz;
		//TODO
		//BB.activeState.process();
	}
	
	my.caseLoadLocalStorage = function() {
		BB.activeState.loadLocalStorage();
		sendStateToUrl(true);
	}
	
	// Will run "complete" when done, unless it's undefined, un which case
	// it will process.
	my.caseAddCourse = function(str,complete) {
		if (str==null || str=="") {
			if (complete) complete();
			return;
		}
		if (BB.activeState.term==null || BB.activeState.term=="0") {
			RR.addBadWarning(i8n.chooseTerm);
			if (complete) complete();
			return;
		}
		if (BB.activeState.isTooMany()) {
			RR.addBadWarning($(".tooManyResults").text());
			if (complete) complete();
			return;
		}
		// Add filter and process
		$.getJSON("api/stringToFilter?term="+BB.activeState.term+"&input="+str,function(data) {
			
			var addedKeys=[];
			for (var i=0; i<data.length; i++) {
				var entry=data[i];
				if (entry.error) {
					RR.addBadWarning(entry.error);
					continue;
				}
				var cnf=new CodeNumberFilter(entry.cnKey,entry.drop,(entry.reqId.length>0?entry.reqId:false));
				RR.addGoodWarning(i8n.adding+ "'"+cleanCnKey(cnf.cnKey)+"'... "+(template=="spc"?i8n.pleaseWait+"...":""),true);
				if (BB.activeState.addCodeNumberFilter(cnf)) {
					addedKeys.push(cnf.cnKey);
				}
			}
			
			if (complete) {
				complete();
			} else {
				if (addedKeys.length>0) {
					BB.activeState.process(function() {
						for (var i=0;i<addedKeys.length;i++) {						
							RR.addGoodWarning(i8n.theCourse+ " '" + cleanCnKey(addedKeys[i]) + "' " +i8n.wasAdded);
						}
						sendStateToUrl(true);
					});
				}
			}
			
		}).fail(function() {
			RR.addBadWarning(i8n.verifyInternetConnection);
		});
	}
	
	my.caseRemoveCourse = function(cnKey) {
		BB.activeState.removeCodeNumberFilter(cnKey);
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseViewCriteria = function() {
		BB.page="criteria";
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseViewResults = function() {
		BB.page="results";
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseViewFavorites = function() {
		BB.page="favorites";
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseChangeFilter = function(cams,locs) {
		BB.activeState.cams=cams;
		BB.activeState.locs=locs;
		BB.activeState.outdated=true;
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseChangeCampusAmmend = function(cnf,cam,isSelected) {
		if (isSelected) {
			cnf.ca[cam]=true;	
		} else {
			delete cnf.ca[cam];
		}
		BB.activeState.outdated=true;
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseChangePeriod = function(cnf,cpn) {
		cnf.cpn=cpn;
		my.caseChangeSection(cnf,"");
	}
	
	my.caseChangeSection = function(cnf,csn) {
		cnf.csn=csn;
		my.caseChangeDropdown(cnf,"al");
	}
	
	my.caseChangeDropdown = function(cnf,drop) {
		cnf.setDrop(drop);
		BB.activeState.process();
		sendStateToUrl(true);
	}
	
	my.caseChangeIgnore = function(cnf,ignore) {
		cnf.ignore=ignore;
		// TODO If enrolled, change dropdown to "drop".
		BB.activeState.outdated=true;
		BB.activeState.process();
		sendStateToUrl(true);		
	}
	
	my.caseFirstResult = function() {
		BB.r=0;
		renderResult();
		sendStateToUrl(true);
	}

	my.casePrevResult = function() {
		if (BB.r>0) {
			BB.r--;
			renderResult();
			sendStateToUrl(true);
		}
	}
	
	my.caseNextResult = function() {
		if (BB.r+1<BB.activeState.sortedFilteredResults.length) {
			BB.r++;
			renderResult();
			sendStateToUrl(true);
		}
	}
	
	my.caseLastResult = function() {
		BB.r=BB.activeState.sortedFilteredResults.length-1
		renderResult();
		sendStateToUrl(true);
	}
	
	my.caseChangeHideFull = function(el) {
		applyToOther(el);
		var b=!el.checked;
		Profiler.setParameterState("filterOutFull", b);
		BB.activeState.filters.hideFull = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeHideOnline = function(el) {
		applyToOther(el);
		var b=!el.checked;
		Profiler.setParameterState("filterOutOnline", b);
		BB.activeState.filters.hideOnline = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeHideOnCampus = function(el) {
		applyToOther(el);
		var b=!el.checked;
		Profiler.setParameterState("filterOutOnCampus", b);
		BB.activeState.filters.hideOnCampus = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeHideWaitlistable = function(el) {
		applyToOther(el);
		var b=!el.checked;
		Profiler.setParameterState("filterOutWaitlistable", b);
		BB.activeState.filters.hideWaitlistable = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeHideClosed = function(el) {
		applyToOther(el);
		var b=!el.checked;
		BB.activeState.filters.hideClosed = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeHideNoHonors = function(el) {
		applyToOther(el);
		var b=el.checked;
		BB.activeState.filters.hideNoHonors = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeHideHonors = function(el) {
		applyToOther(el);
		var b=el.checked;
		BB.activeState.filters.hideHonors = b;
		ENGINE.sortAndFilterResults(BB.activeState,true);
		renderResult();
		sendStateToUrl(true);
	}

	my.caseChangeSort = function(newSort) {
		RR.renderSort(newSort);
		BB.activeState.sort = newSort;
		ENGINE.sortAndFilterResults(BB.activeState,false);
		renderResult();
		sendStateToUrl(true);
	}
	
	my.caseClearPersonalTimeBlocks = function() {
		BB.activeState.clearBusyBlocks();
		ENGINE.computeOverlap(BB.activeState);
		ENGINE.sortAndFilterResults(BB.activeState,false);
		renderResult();
		sendStateToUrl(true);
	}
	
	my.caseChangePersonalTimeBlock = function(d1,d2,dayHourA,dayHourB,onlyAdd) {

		var r = sortDayHours(dayHourA,dayHourB);
		var dayHour1 = r.first;
		var dayHour2 = r.last;
		 
		for (var d=dayHour1.day;d<=dayHour2.day;d++) {
			var busyBlock = new BusyBlock(d1,d2,d,dayHour1.hour,dayHour2.hour);
			BB.activeState.addNewBusyBlock(busyBlock,onlyAdd);
		}
		
		ENGINE.computeOverlap(BB.activeState);
		ENGINE.sortAndFilterResults(BB.activeState,false);
		renderResult();
		sendStateToUrl(true);
	}
	
	my.casePin = function(cnf,add) {
		if (!add) {
			if (BB.activeState.isTooMany()) {
				alert(i8n.unpinningThisCourse);
				return;
			}
		}
		
		
		if (cnf.pin(add)) {
			//if (!add) {
			//	cnf.cs=""; // Clear the course selection so
			//	// that class will jump towards desired sort.
			//}
			BB.activeState.process();
			sendStateToUrl(true);
		}
	}
	
	my.caseChangeSelectionMask = function(cnf,sa) {
		if (cnf.sa!=sa) {
			cnf.sa=sa;
			BB.activeState.outdated=true;
			BB.activeState.process();
			sendStateToUrl(true);
		}
	}
	
	my.caseFavoriteResult = function() {
		if ($(".thumbContainer").length>=9) {
			alert("You are limited to a maximum of 9 favorites. You must delete an existing one first.");
			return;
		}
		var state=BB.activeState.toStr();
		// Change all evidences of "enrollment" to generic:
		state=state.replace(/=kp_/g,"=us_");
		$.getJSON("api/saveSchedule",{term:BB.activeState.term,state:state,name:"untitled"},function() {
			$("#result_page_message").show().hide(2000);
			renderFavorites();
			PAGES.openFavorites();
		});
	}
	
	my.caseDeleteFavorite = function(savedItem) {
		var id=savedItem || BB.previewState.saveId ;
		//BB.previewState=null;
		$.getJSON("api/deleteSavedState",{id:id},function() {
			renderFavorites();
		});	
	}
	
	my.caseCompleteEnroll = function() {
		BB.activeState.removeDropped();
		BB.activeState.loadEnrollmentState(function() {
			BB.activeState.process();
			sendStateToUrl(true);			
		});
	}
	
	my.caseChangeSelection = function(gState) {
		legend.applyRadioToCrnList(gState);
		sendStateToUrl(true);
	}
	
	my.caseStartFromScratch = function() {
		loadState("scratch=1",false);
	}
	
	function sendStateToUrl(replace) {
		if (!history.pushState) return;
		var state=BB.toStr().substr(1);
		var url="criteria.jsp?"+state;
		if (replace) {
			history.replaceState({id: "vsb_latest_0"}, "VSB State", url);
		} else {
			history.pushState({id: "vsb_latest_0"}, "VSB State", url);	
		}
		if(window.localStorage){
			localStorage.setItem("vsbuilder.gstate",state);
		}
	}
	
	
	function applyToOther(el,v) {
		var id=$(el).attr("id");
		if (id.indexOf("mobile")>1) {
			id=id.replace("mobile","");
		} else {
			id=id+"mobile";
		}
		var $other=$("#"+id);
		$other.prop("checked",el.checked);
	}
	
	return my;
}());

// Holds objects in browser memory for fast retrieval
var MM = (function() {
	var my = {};
	
	my.codeNumbers = new Array();
	my.colleges = new Array();
	my.campuses = new Array();
	my.locations = new Array();
	my.rgLines = new Array();
	
	my.getCodeNumber = function(term,cnKey) {
		for (var i=0;i<my.codeNumbers.length;i++) {
			var cn=my.codeNumbers[i];
			if (cn.key==cnKey && cn.term==term) {
				return cn;
			}
		}
		return null;
	}
	
	my.findReqGroupDesc = function(reqg) {
		var d="";
		for (var i=0;i<my.rgLines.length;i++) {
			var r=my.rgLines[i];
			if (r.reqg==reqg && r.desc.length>0) {
				if (d.length>0) d+="<br/>";
				d+=r.desc;
			}
		}
		return d;
	}
	
	function xmlToTimeblocks(xmlDoc) {
		var timeblockEls = xmlDoc.getElementsByTagName("timeblock");
		var timeblocksTemp = [];
		for (var i=0; i<timeblockEls.length;  i++) {
			var el=timeblockEls[i];
			var id=+el.getAttribute("id");
			var day=+el.getAttribute("day");
			var t1=+el.getAttribute("t1");
			var t2=+el.getAttribute("t2");
			var d1=+el.getAttribute("d1");
			var d2=+el.getAttribute("d2");
			var timeblock = new TimeBlock(id,day,t1,t2,d1,d2,"");
			timeblocksTemp.push(timeblock);
		}
		return timeblocksTemp;
	}
	
	my.loadFromXmlIncremental = function(xmlDoc,gState) {
		var tbsTemp = xmlToTimeblocks(xmlDoc);
		
		var sels=[];
		var selEls = xmlDoc.getElementsByTagName("selection");
		for (var i=0;i<selEls.length;i++) {
			var selEl=selEls[i];
			var sel = new Selection2(selEl,null,null,tbsTemp);
			sels.push(sel);
		}
		
		var change=false;
		for (var i=0;i<gState.cnfs.length;i++) {
			var cnf=gState.cnfs[i];
			if (cnf.cnPro==null) continue; // wasn't loaded yet
			var cn=cnf.cnPro.cn;
			if (cn.updateLiveSeats(sels)) {
				change=true;
				gState.outdated=true;
			}
		}
		
		return change;
	}
	
	my.loadFromXml = function(xmlDoc,term) {
		var errorEls = xmlDoc.getElementsByTagName("error");
		if (errorEls!=null && errorEls.length>=1) {
			for (var i=0; i<errorEls.length; i++) {
				var el=errorEls[i];
				var error=el.textContent||el.text;
				RR.addBadWarning(error);
			}
		}

		var campusEls = xmlDoc.getElementsByTagName("campus");
		for (var i=0; i<campusEls.length;  i++) {
			var c=new Campus(campusEls[i]);
			// Make sure it's not already added
			var added=false;
			for (var j=0;j<my.campuses.length;j++) {
				if (my.campuses[j].name==c.name) {
					added=true;
					break;
				}
			}
			if (!added) {
				// Add campus to list
				my.campuses.push(c);
			}
		}
		
		var rgEls = xmlDoc.getElementsByTagName("reqgroupline");
		for (var i=0; i<rgEls.length;  i++) {
			var r=new ReqGroupLine(rgEls[i]);
			// Make sure it's not already added
			var added=false;
			for (var j=0;j<my.rgLines.length;j++) {
				if (my.rgLines[j].reqg==r.reqg && my.rgLines[j].line==r.line) {
					added=true;
					break;
				}
			}
			if (!added) {
				// Add to list
				my.rgLines.push(r);
			}
		}
		
		var timeblocksTemp = xmlToTimeblocks(xmlDoc);
		
		var cnEls = xmlDoc.getElementsByTagName("course");
		for (var i=0; i<cnEls.length; i++) {
			var cnEl = cnEls[i];
			var cn = new CodeNumber(cnEl,timeblocksTemp,term);
			my.codeNumbers.push(cn);
		}
	}
	return my;
}());

var CC = (function() {
	var my = {};
	my.strToSet = function(str) {
		var obj = {};
		var g=str.split("_");
		for (var i=0;i<g.length;i++) {
			if (g[i].length>0) {
				obj[g[i]]=true;
			}
		}
		return obj;
	}
	my.setToStr = function(set) {
		var s="";
		for (var key in set) {
			if (s.length>0) s+="_";
			s+=key;
		}
		return s;
	}
	my.paramOfStr = function(str,p,def) {
		if (!str) return def;
	    var vars=str.split('&');
	    for (var i=0;i<vars.length;i++) {
	        var vn=vars[i].split('=');
	        if (vn[0]==p) {
	            return vn[1];
	        }
	    }
	    return def;		
	}
	return my;
}());

function YearMonthDay(e){var t=Math.floor((e-1)*4/1461);var n=Math.floor((t+3)/4);
var r=e-t*365-n;t+=2008;var i=t%4==0?1:0;var s=0;if(r<=31){s=0;}else{r-=31;if(r<=28+i){s=1;}else{r-=28+i;
if(r<=31){s=2;}else{r-=31;if(r<=30){s=3;}else{r-=30;if(r<=31){s=4;}else{r-=31;if(r<=30){s=5;}else{r-=30;
if(r<=31){s=6;}else{r-=31;if(r<=31){s=7;}else{r-=31;if(r<=30){s=8;}else{r-=30;if(r<=31){s=9;}else{r-=31;
if(r<=30){s=10;}else{r-=30;if(r<=31){s=11;}}}}}}}}}}}}this.y=t;this.m=s;this.d=r;}

function yearMonthDayToCode(y,m,d) {
	var days = 365*(y-2008);
	var leapdays = Math.floor((y-2005)/4); // 2008=0, 2009=1, 2010=1, etc...
	days+=leapdays;
	var febDay = (y%4==0?1:0);
	if (m>=2) days+=febDay;
	days+=d;
	switch (m) {
	case 11: // Dec
		return days+334;
	case 10: // Nov
		return days+304;
	case 9: // Oct
		return days+273;
	case 8: // Sept
		return days+243;
	case 7: // Aug
		return days+212;
	case 6: // Jul
		return days+181;
	case 5: // 5=June
		return days+151;
	case 4: // 4=May
		return days+120;
	case 3: // 3=April
		return days+90;
	case 2: // 2=Mar
		return days+59;
	case 1: // 1=Feb
		return days+31;
	case 0:
		return days;
	default:
		return days;
	}
}

function GState(str) {
	
	this.term=termToNb(param("term",null));
	this.sort=param("sort","none");
	this.filters=new Filters(param("filters",""));
	this.bbs=deserializeBusyBlocks(param("bbs",""),param("ds",""));
	this.cams=CC.strToSet(param("cams",defaultCams));
	this.locs=CC.strToSet(param("locs",""));
	this.outdated=true;
	this.bbsOutdated=true;
	
	this.cnfs=[];
	this.reqs=[];
	
	var i=0;
	while (str.indexOf("course_"+i+"_0=")>=0) {
		var cnKey=param("course_"+i+"_0");
		var sa=param("sa_"+i+"_0");
		var ca=CC.strToSet(param("ca_"+i+"_0"));
		var drop=param("dropdown_"+i+"_0");
		var cs=param("cs_"+i+"_0");
		var cpn=param("cpn_"+i+"_0");
		var csn=param("csn_"+i+"_0");
		var ignore=param("ig_"+i+"_0")=="1";
		var reqId=param("rq_"+i+"_0",null);
		var cnf=new CodeNumberFilter(cnKey,drop,reqId,sa,ca,cs,cpn,csn,ignore)
		this.cnfs.push(cnf);
		i++;
	}
	
	this.lastSort=null; // Last type of sort employed
	this.reasons=new Reasons(); // Reason(s) for no results
	this.results=[];
	this.sortedFilteredResults=[];
	
	function param(p,def) {
		return CC.paramOfStr(str,p,def);
	}
	
	function termToNb(term) {
		if (term==null) return null;
		var v = 0;
		for (var i=0; i<term.length; i++) {
			var c = term.charAt(i);
			if (c>='0' && c<='9') {
				v = v*10+(+c);
			} else {
				v = v*1000+c.charCodeAt(0);
			}
		}
		return v;
	}
	
	function serializeBusyBlocks(bbs) {
		var s="";
		var dates=[];
		function upsertDate(date) {
			for (var i=0;i<dates.length;i++) {
				if (dates[i]==date) return i;
			}
			dates.push(date);
			return dates.length-1;
		}
		for (var i=0; i<bbs.length; i++) {
			var bb = bbs[i];
			var d1i=0;
			var ss = "";
			ss+=upsertDate(bb.d1)+""+upsertDate(bb.d2);
			ss+=bb.day + "" + String.fromCharCode(65+bb.hourStart,65+bb.hourEnd);
			s+=ss;
		}
		var ds="";
		for (var i=0;i<dates.length;i++) {
			if (ds.length>0) ds+="-";
			ds+=dates[i];
		}
		return {bbs:s,ds:ds};
	}
	function deserializeBusyBlocks(bbs,ds) {
		var dates=ds.split("-");
		var ba=new Array();
		for (var i=0; i+2<bbs.length;i+=5) {
			var d1i=bbs.substr(i,1);
			var d2i=bbs.substr(i+1,1);
			var d1=dates[d1i];
			var d2=dates[d2i];
			var day=bbs.substr(i+2,1);
			var h1=bbs.substr(i+3,1).charCodeAt(0)-65;
			var h2=bbs.substr(i+4,2).charCodeAt(0)-65;
			var bb=new BusyBlock(d1,d2,day,h1,h2);
			ba.push(bb);
		}
		return ba;
	}
	
	this.toStr = function() {
		var s="";
		s+="&term="+(this.term==null?"":this.term);
		s+="&sort="+this.sort;
		s+="&filters="+this.filters.toStr();
		var ser=serializeBusyBlocks(this.bbs);
		s+="&bbs="+ser.bbs;
		s+="&ds="+ser.ds;
		s+="&cams="+CC.setToStr(this.cams);
		s+="&locs="+CC.setToStr(this.locs);
		for (var i=0;i<this.cnfs.length;i++) {
			var cnf=this.cnfs[i];
			s+="&course_"+i+"_0="+cnf.cnKey;
			s+="&sa_"+i+"_0="+cnf.sa;
			s+="&cs_"+i+"_0="+cnf.cs;
			s+="&cpn_"+i+"_0="+cnf.cpn;
			s+="&csn_"+i+"_0="+cnf.csn;
			s+="&ca_"+i+"_0="+CC.setToStr(cnf.ca);
			s+="&dropdown_"+i+"_0="+cnf.drop;
			s+="&ig_"+i+"_0="+(cnf.ignore?"1":"0");
			s+="&rq_"+i+"_0="+(cnf.reqId==null?"":cnf.reqId);
		}
		return s;
	}
	
	this.loadLocalStorage = function() {
		var pCourses=PSPushedCourses.get();
		var n=0;
		var courses="";
		for (var c in pCourses) {
			var cn=pCourses[c];
			if (n>0) {
				courses+=",";
			}
			courses+=":"+(+c);
			RR.addGoodWarning("Loading "+cn+" from PeopleSoft...");
			n++;
		}
		if (n==0) {
			RR.addBadWarning(i8n.noCoursesToLoad);
			return;
		}
		UU.caseAddCourses(courses);
	}
	
	this.loadEnrollmentState = function(complete) {
		if (BB.activeState.term==null || !authenticated || BB.scratch) {
			if (complete) complete();
			return;
		}
		RR.showLoadingDiv(true);
		// Add filter and process
		$.getJSON("api/getEnrollmentState?term="+BB.activeState.term,function(data) {
			
			// Show any errors
			for (var i=0;i<data.errors.length;i++) {
				var e = data.errors[i].desc;
				RR.addBadWarning(e);
			}

			for (var i=0;i<data.cnfs.length;i++) {
				var jcnf=data.cnfs[i];
				var cs=jcnf.enr.length>0?jcnf.enr:jcnf.cart;
				var drop="kp_"+cs;
				// TODO ca if not found in selected campuses?
				var cnf = new CodeNumberFilter(jcnf.cnKey,drop,false,sa,ca,cs,false,false,false,jcnf.enr,jcnf.cart,jcnf.waiting);
				BB.activeState.addCodeNumberFilter(cnf,true);
			}
			
			RR.showLoadingDiv(false);
			
			if (complete) complete();
		}).fail(function() {
			RR.addBadWarning(i8n.unableToLoad);
			if (complete) complete();
		});
	}
	
	this.nbOfPins = function() {
		var nb=0;
		for (var i=0;i<this.cnfs.length;i++) {
			var cnf=this.cnfs[i];
			if (cnf.drop.indexOf("dp_")==0 || cnf.ignore) continue;
			if (cnf.drop.indexOf("_")==2) nb++;
		}
		return nb;
	}
	
	this.trackCourseConflicts = function() {
		var toSend =[];
		for(var i =0; i<this.cnfs.length; i++){
			var cnf = this.cnfs[i];
			if(cnf.conflicts && cnf.conflicts.length>0){
				for(var k =0;k<cnf.conflicts.length;k++){
					var conflict = cnf.conflicts[k];
					var input=(conflict<cnf.cnKey?conflict+':'+cnf.cnKey:cnf.cnKey+':'+conflict);
					if(toSend.indexOf(input)<0){
						toSend.push(input);
					}
				}
				cnf.conflicts = [];
			}
		}
		if(toSend.length === 0){
			return ;
		}
		$.ajax({
			url:'api/courseConflictUsage',
			method:'post',
			data:{school_term_id:this.term,payload:toSend.join(";")}
		}).done(function() {
		});
	}
	
	this.process = function(complete,incremental) {
		
		var gState=this;
		var processContinue = function() {
			for (var i=0;i<gState.cnfs.length;i++) {
				var cnf=gState.cnfs[i];
				if (!cnf.populate(gState.term)) {
					console.log("Error could not load "+cnf.cnKey);
					gState.cnfs.splice(i,1);
					i--;
				}
			}
			
			for (var i=0;i<gState.cnfs.length;i++) {
				var cnf=gState.cnfs[i];
				cnf.applyFilters(gState.cams,gState.locs);
			}
			
			gState.computeWarnings();
			
	   		RR.showLoadingDiv(false);
	   		
	   		CA.assignColors();
	   		
			// If this GState is the active one, then render it
			if (BB.activeState==gState) {
				PAGES.renderCurrentPage();
				RR.renderAddCoursesPage(BB.activeState,true);
				RR.renderMyPlanImport();
				BUBBLES.update();
				
				if (/*(BB.page=="results" || BB.wideScreen) &&*/ gState.outdated) {
					
					if (!BB.enrollMode) RR.showGeneratingDiv(true);
					
					Profiler.recordHit("scheduleGenerationRequests");
					gState.trackCourseConflicts();

					// Regenerate results
					ENGINE.generateResults(gState,false,function(gResults) {
						gState.results=gResults;
						if (gState.isTooMany()) {
							$(".tooManyResults").show();
							$("#addCourseButton").prop("disabled",true);
						} else {
							$(".tooManyResults").hide();
							$("#addCourseButton").prop("disabled",false);
						}
						
						ENGINE.computeOverlap(gState);
						ENGINE.sortAndFilterResults(gState,true);
						Profiler.addValue("schedulesGenerated", gState.sortedFilteredResults.length);
						if (!BB.enrollMode) RR.showGeneratingDiv(false);
						if (!BB.enrollMode) renderResult();
						if (complete) {
							complete();	
						}
					});
					
				} else {
					if (complete) {
						complete();	
					}
				}
				
			} else if (BB.previewState==gState) {
				// Render for preview
				
				ENGINE.generateResults(gState,false,function(gResults) {
					gState.results=gResults;
					var r=gState.findCurrentSelectedResult();
					
					if (r!=null) {
						previewSchedule.setSize(BB.previewState.cnfs);
						previewSchedule.draw(r,BB.previewState);
					}
					if (complete) {
						complete();	
					}
				});

			} else {
				if (complete) {
					complete();
				}
			}
			
		}
		
		this.verifyTerm();
		
		// Process CodeNumberFilters
		var s=""; // missing CodeNumbers
		var oldest=(new Date()).getTime();
		for (var i=0;i<this.cnfs.length;i++) {
			var cnf=this.cnfs[i];
			if (incremental || !cnf.populate(this.term)) {
				if (cnf.since<oldest) oldest=c.since;
				// We're updating data or we don't have data in JS memory or 
				s+="&course_"+i+"_0="+cnf.cnKey;
			} else {
				// We already have data in JS memory
			}
		}
		if (s.length>0) {
			// We need to use AJAX to get more data
			s="getclassdata.jsp?term="+this.term+s+nWindow();
			s+="&nouser=1";
			
			if (incremental) {
				s+="&since="+oldest;
			} else {
				RR.showLoadingDiv(true);
			}
			
			$.ajax({
				method: "GET",
				url: s,
				cache: false,
				dataType: "xml"
			})
			  .done(function(data) {
				  // Load data into browser memory
				  if (incremental) {
					  var change=MM.loadFromXmlIncremental(data,gState);
					  if (!change) return;
				  } else {
					  MM.loadFromXml(data,gState.term);
				  }
				  processContinue();
			  })
			  .fail(function(jqXHR,textStatus) {
				  if (textStatus=="error") {
					  RR.addBadWarning("Connection error... are you connected?");
				  } else {
					  RR.addBadWarning(textStatus+": Failed at "+(new Date())+". URL: "+s);
				  }
			  });
		} else {
			if (incremental) return;
			processContinue();
		}
	}
	
	
	this.applySelkeysToDropdowns = function(selkeys) {
		
		var used=[];
		for (var c=0;c<this.cnfs.length;c++) {
			var cnf=this.cnfs[c];
			var gotIt=false;
			for (var i=0;i<selkeys.length;i++) {
				if (cnf.cnKey==selkeys[i] || cnf.setDropPlus(selkeys[i])) {
					used[i]=1;
					gotIt=true;
					break;
				}
			}
			if (!gotIt) {
				if (cnf.enr.length>0) {
					cnf.setDrop("dp_"+cnf.enr);
				} else {
					cnf.ignore=true;
				}
			}
		}
		
		for (var i=0;i<selkeys.length;i++) {
			if (1!=used[i]) {
				RR.addBadWarning("Class " + selkeys[i] + " no longer found.");
			}
		}
	}
	
	this.findCurrentSelectedResult = function() {
		// Determine the selkeys that must be in the result
		var keys=[];
		for (var i=0;i<this.cnfs.length;i++) {
			var cnf=this.cnfs[i];
			if (cnf.drop.indexOf("dp_")==0 || cnf.ignore || cnf.cs.length==0) continue;
			keys.push(cnf.cs);
		}

		// Search the results for it.
		// All the selkeys are expected to be
		// found in order. However there may
		// be extra selkeys in the result.
		var p=0;
		for (var i=0;i<this.results.length;i++) {
			var r=this.results[i];
			for (var j=0;j<r.selPros.length;j++) {
				if (r.selPros[j].sel.key==keys[p]) {
					p++;
				}
			}
			if (p==keys.length) {
				return r;
			}
		}
		return null;
	}
	
	this.addCodeNumberFilter = function(cnf,overwrite,nowarn) {
		// Check for same
		for (var i=0;i<this.cnfs.length;i++) {
			if (this.cnfs[i].cnKey==cnf.cnKey && (cnf.reqId==null || (cnf.reqId==this.cnfs[i].reqId))) {
				if (overwrite) {
					this.outdated=true;
					
					// FIXME - not working well
					var oldReqId=this.cnfs[i].reqId;
					cnf.reqId=oldReqId;
					
					this.cnfs[i]=cnf;
					return true;
				} else {
					if (!(nowarn)) {
						RR.addBadWarning( i8n.alreadyAdded+ " '" + cnf.cnKey + "'.");
						return false;
					}
				}
			}
		}
		this.cnfs.push(cnf);
		this.outdated=true;
		return true;
	}
	
	this.removeDropped = function() {
		for (var i=this.cnfs.length-1;i>=0;i--) {
			var cnf=this.cnfs[i];
			if (cnf.drop.indexOf("dp_")==0) {
				this.cnfs.splice(i,1);
				this.outdated=true;
			}
		}
	}
	
	this.removeCodeNumberFilter = function(cnKey) {
		// Check for same
		for (var i=0;i<this.cnfs.length;i++) {
			var cnf=this.cnfs[i];
			if (cnf.cnKey==cnKey) {
				
				// Check to see if in cart. If so, remove it.
				var fromCart=false;
				if (cnf.cart.length>0) {
					clickRemoveFromCart(cnf.cart);
					fromCart=true;
				}
				
				// Check to see if enrolled. If so, set it to drop.
				if (cnf.enr.length>0) {
					cnf.setDrop("dp_"+cnf.enr);
					return;
				}
				
				this.cnfs.splice(i,1);
				this.outdated=true;
				RR.addGoodWarning( i8n.removed+ " '" + cleanCnKey(cnKey) + "'"+(fromCart?" from Cart":""));
				return;
			}
		}
	}
	
	this.getSelPro = function(selkey) {
		for (var i=0;i<this.cnfs.length;i++) {
			var cnf=this.cnfs[i];
			var selPro=cnf.getSelPro(selkey);
			if (selPro!=null) return selPro;
		}
		return null;
	}
	
	this.computeWarnings = function() {
		
		// Used for Req Groups checking
		var allSelPros=new Array();
		for (var i=0; i<this.cnfs.length; i++) {
			var cnf=this.cnfs[i];
			var cnPro=cnf.cnPro;
			if (!cnPro.filterPass || cnf.drop.indexOf("dp_")==0) {
				continue;
			}
			for (var j=0;j<cnPro.uselPros.length;j++) {
				var uselPro=cnPro.uselPros[j];
				for (var k=0;k<uselPro.selPros.length;k++) {
					var selPro=uselPro.selPros[k];
					if (!selPro.filterPass) continue;
					allSelPros.push(selPro);	
				}
			}
		}
		
		// Requirement Group Warnings
		for (var i=0; i<this.cnfs.length; i++) {
			var cnf=this.cnfs[i];
			cnf.computeWarnings(allSelPros);
		}
		
		// Warnings for CodeNumbers compared against
		// other CodeNumbers
		for (var i=0; i<this.cnfs.length; i++) {
			var cnf=this.cnfs[i];
			var cnPro=cnf.cnPro;
			
			// Ensure at least 1 thing selected
			if (!cnPro.filterPass || cnf.drop.indexOf("dp_")==0 || cnf.ignore) {
				//course.warnings.push("You must select at least one class");
				continue;
			}
			cnf.conflicts = [];
			
			// Check with itself
			var r1=cnf.toRequirement(true);
			var requirements = new Array();
			requirements.push(r1);
			var tResults = null;
			ENGINE.doSearch(requirements,true,function(gResults) {
				tResults = gResults;
			});
			
			var expected=0;
			for (var j=0;j<cnPro.uselPros.length;j++) {
				if (cnPro.uselPros[j].filterPass) expected++;
			}
			
			if (tResults.length<=0) {
				cnPro.warnings.push(i8n.selfConflicting);  //All classes of this course are self-conflicting 
			} else if (tResults.length < expected) {
				cnPro.warnings.push(""+(expected-tResults.length)+" "+i8n.ofThe+" "+cnPro.uselPros.length+" "+i8n.classesSelfConflict); //classes self-conflict
			}
			
			
			// Ensure it has at least 1 seat available in each selection
			if (cnPro.allFilterPassFull && cnf.enr.length<=0) {
				if (cnPro.filterPassWaits>0) {
					cnPro.warnings.push(i8n.classesFull+ " ("+cnPro.filterPassWaits+" wait list classes available)" );
				} else {
					cnPro.warnings.push(i8n.classesFull+(waitlistableFilter?i8n.noWaitlistable:""));
				}
			}
			
			// Check with other CodeNumbers
			for (var j=0; j<this.cnfs.length; j++) {
				
				if (i==j) continue;
				var cnf2=this.cnfs[j];
				var cnPro2=this.cnfs[j].cnPro;
				if (!cnPro2.filterPass || cnf2.drop.indexOf("dp_")==0 || cnf2.enr.length>0 || cnf2.ignore) continue;
				
				var requirements = new Array();
				requirements.push(r1);
				var r2=cnf2.toRequirement(true);
				requirements.push(r2);
				// Do search
				var tResults = null;
				ENGINE.doSearch(requirements,true,function(gResults) {
					tResults = gResults;
				});
				
				if (tResults.length<=0) {
					cnPro.warnings.push(i8n.courseConflict+" "+cnPro2.cn.code+" "+cnPro2.cn.number);
					cnf.conflicts.push(cnf2.cnKey);
				} else {			
					// Ensure at least 1 seat in each usel of result
					var hadOpening=false;
					var waitlistable=false;
					for (var k=0; k<tResults.length; k++) {
						var result=tResults[k];
						
						var lastusel=null;
						hadOpening=false;
						for (var m=0; m<result.selPros.length; m++) {
							var selPro = result.selPros[m];
							var sel = selPro.sel;
							if (sel.usel!=lastusel && lastusel!=null) {
								if (!hadOpening) {
									break;
								}
								hadOpening=false;
							}
							if (!sel.full || selPro.cnf.enr==sel.key) {
								hadOpening=true;
							}
							if (sel.waits>0) {
								waitlistable=true; // not used yet
							}
							lastusel=sel.usel;
						}
						if (hadOpening) {
							break;
						}
					}
					if (!hadOpening) {
						cnPro.warnings.push(cnPro2.cn.code+" "+cnPro2.cn.number+" "+i8n.noClassesWithOpenSeats);
					}
				}
				
			}
		}
	}
	
	this.clearBusyBlocks = function() {
		this.bbsOutdated=true;
		this.bbs.length=0;
	}
	
	this.addNewBusyBlock = function(busyBlock,onlyAdd) {
		this.bbsOutdated=true;
		var addIt = true;
		for (var blocki=0; blocki<this.bbs.length; blocki++) {
			var bb = this.bbs[blocki];
			// see if intersection
			if (bb.day!=busyBlock.day) continue;
			if (bb.d1!=busyBlock.d1 || bb.d2!=busyBlock.d2) {
				continue;
			}
			if ((bb.hourEnd+1) < busyBlock.hourStart || bb.hourStart > (busyBlock.hourEnd+1)) continue;

			// If right next to an existing block, then add it.
			if ((bb.hourEnd+1) == busyBlock.hourStart) {
				busyBlock.hourStart=bb.hourStart;
			}

			// If right next to an existing block, then add it.
			if (bb.hourStart == (busyBlock.hourEnd+1)) {
				busyBlock.hourEnd=bb.hourEnd;
			}

			if (onlyAdd) {
				if (bb.hourEnd>busyBlock.hourEnd) busyBlock.hourEnd=bb.hourEnd;
				if (bb.hourStart<busyBlock.hourStart) busyBlock.hourStart=bb.hourStart;
			}

			// Don't add the new if it's identical to the old
			if (bb.hourEnd==busyBlock.hourEnd && bb.hourStart==busyBlock.hourStart && !onlyAdd) {
				addIt = false;
			}
			// Don't add the new if it's only 1 hour
			if (busyBlock.hourEnd-busyBlock.hourStart<=0) {
				addIt = false;
			}

			// intersection. remove this block.
			for (var y=blocki; y<this.bbs.length-1; y++) {
				this.bbs[y]=this.bbs[y+1];
			}
			this.bbs.length = this.bbs.length-1;
			blocki--;
		}

		if (addIt) {
			// Add the new block
			this.bbs.push(busyBlock);
		}
	}
	
	this.isTooMany = function() {
		return (this.results.length>55000);
	}
	
	this.verifyTerm = function() {
		var t=""+this.term
		if (!(t>0)) {
			return; 
		}
		var found=false;
		var leastOffTerm=t;
		var leastOff=100;
		$(".termRadio").each(function() {
			var t2=""+$(this).data("term");
			if (t2==t) {
				found=true;
			} else {
				var off=0;
				for (var i=0;i<t.length||i<t2.length;i++) {
					if (t.charAt(i)!=t2.charAt(i)) {
						off++;
					}
				}
				if (off<=leastOff) {
					leastOff=off;
					leastOffTerm=t2;
				}
			}
		})
		if (!found) {
			this.term=leastOffTerm;
			var buttons=[{name:"OK",action:function() {popupNotice.close();}}];
			RR.popNotice("The schedule you are trying to load is for a term that is no longer enabled. We attempted load its classes into a similar term.",buttons);	
		}
	}
	
}

function BState(str) {
	var param = function(p,def) {
		return CC.paramOfStr(str,p,def);
	}
	this.access=param("access")=="1";
	this.lang=param("lang","en");
	this.tip=+param("tip",(getCookie("tip")=="0"?0:1));
	this.page=param("page","criteria");
	this.scratch=param("scratch")=="1";
	this.wideScreen=null; // Set by PAGES.initWindow()
	this.savedStates = new Array();
	this.previewState = null;
	this.activeState = new GState(str);
	
	// Temporary GUI items
	this.r=0;
	this.popuplive=false;
	this.enrollMode=false;
	
	this.toStr = function() {
		var s="";
		s+="&access="+(this.access?"1":"0");
		s+="&lang="+this.lang;
		s+="&tip="+this.tip;
		s+="&page="+this.page;
		s+="&scratch="+(this.scratch?"1":"0");
		s+=this.activeState.toStr();
		return s;
	}
}

function CodeNumberFilter(cnKey,drop,reqId,sa,ca,cs,cpn,csn,ignore,enr,cart,waiting) {
	this.cnKey=cnKey;
	this.drop=drop?drop:"al";
	this.reqId=reqId?reqId:null;
	this.oldDrop="al";
	this.sa=sa?sa:"";
	this.ca=ca?ca:{};
	this.cs=cs?cs:"";
	// Choose the specific Sel of the Usel by default.
	if (drop && drop.indexOf("us_")==0 && this.cs=="") this.cs=drop.substr(3);
	this.cpn=cpn?cpn:"";
	this.csn=csn?csn:"";
	this.ignore=ignore?true:false;
	
	this.enr=enr?enr:"";
	this.cart=cart?cart:"";
	this.waiting=waiting?true:false;

	
	this.cnPro=null;
	this.color=999;
	
	this.hardPin=true;
	
	this.populate = function(term) {
		if (this.cnPro!=null) return true;
		var codeNumber=MM.getCodeNumber(term,this.cnKey);
		if (codeNumber==null) {
			return false;
		}
		this.cnPro=new CodeNumberPro(codeNumber,this);
		return true;
	}
	
	// Will set the "cs" and the drop value if this
	// Cnf contains the given selkey.
	this.setDropPlus = function(selkey) {
		var selPro=this.getSelPro(selkey);
		if (selPro==null) return false;
		var uselkey=selPro.uselPro.usel.key;
		this.cs=selkey;
		this.setDrop("us_"+uselkey);
		return true;
	}
	
	this.setDrop = function(drop) {
		//if (drop.indexOf("dp_")==0 || this.drop.indexOf("dp_")==0) {
			BB.activeState.outdated=true;
		//}
		this.drop=drop;
		if (drop.indexOf("_")<0) {
			// set the "non-pin" drop
			this.oldDrop=drop;
		}
		// Make hard pin?
		//if (change && !this.isPinned()) {
		//	BB.activeState.outdated=true;
		//}
	}
	
	this.getSelPro = function(selkey) {
		for (var i=0;i<this.cnPro.uselPros.length;i++) {
			var uselPro=this.cnPro.uselPros[i];
			for (var j=0;j<uselPro.selPros.length;j++) {
				var selPro=uselPro.selPros[j];
				if (selPro.sel.key==selkey) {
					return selPro;
				}
			}
		}
		return null;
	}
	
	this.applyPostFilters = function(filters) {
		var uselPros=this.cnPro.uselPros;
		for (var i=0; i<uselPros.length; i++) {
			var uselPro=uselPros[i];
			for (var j=0; j<uselPro.selPros.length; j++) {
				var selPro=uselPro.selPros[j];
				selPro.postPass=selPro.isPostFilterPass(filters);
			}
		}
	}
	
	this.applyFilters = function(cams,locs) {
		var locFilter=!("any" in locs);
		
		var allFilterPassFull=true;
		var anyUselsFilterPass=false;
		var filterPassOnlineTypes="";
		var filterPassWaits=0;
		var filterPassFalseByLocationOnly=false;
		var anyPass=false;
		var ccams={}; // aCcumulated campuses
		var clocs={}; // aCcumulated locations
		var cpns={} // aCumulated Period Numbers
		var csns={} // aCumulated Section Numbers
		var ecams={};
		var nbPass=0;
		var enrException=false;
		
		var usels=this.cnPro.cn.usels;
		var uselPros=this.cnPro.uselPros;
		
		for (var i=0; i<usels.length; i++) {
			var usel=usels[i];
			var uselPro=uselPros[i];
			
			var anySelsFilterPass=false;
			var allSelsFull=true;
			var disp="";
			var sl="";
			
			for (var j=0; j<usel.sels.length; j++) {
				var sel=usel.sels[j];
				var selPro=uselPro.selPros[j];
				
				var filterPass=true;
				var includeSel=true;
				var forcePass=false;
				var passPeriod=true;
				
				if (sel.key==this.enr || sel.key==this.cart) {
					// Selection is enrolled or in cart. Never filter it out.
					forcePass=true;
				}
				
				if (!forcePass && preventOutOfEnrollmentWindow && usel.de!=0 && usel.de<todayCode) {
					// skip completely because drop/add date is past and not enrolled.
					filterPass=false;
					includeSel=false;
				}
				
				if (!forcePass && this.cpn.length>0 && sel.classes[0].pn!=this.cpn) {
					// Chosen Period Number does not match
					filterPass=false;
					passPeriod=false;
				}
				
				if (!forcePass && this.csn.length>0 && sel.classes[0].usn!=this.csn) {
					// Chosen Unique Selection Number does not match
					filterPass=false;
				}
				
				for (var k=0; k<sel.classes.length; k++) {
					var cls=sel.classes[k];
					var cam=cls.campus;
					var loc=cls.psl;
					if (!filterPass) {
						// Already failed some filter
					} else if (!(cam in cams)) {
						// failed global campus filter and global location filter
						if (!(cam in this.ca)) {
							// either no amend filter, or failed amend filter. 
							filterPass=false;
						}
					} else if (locFilter && (!(loc in locs))) {
						// failed global location filter
						filterPass=false;
						filterPassFalseByLocationOnly=true;
					} else {
						anyPass=true; // Something passed filter.
					}
					
					if (forcePass) {
						if (!filterPass) {
							enrException=true;
							filterPass=true;
							anyPass=true;
						}
					}
					
					if (includeSel) {
						ccams[cam]=true;
						clocs[loc]=true;
						cpns[sel.classes[0].pn]=true;
						if (passPeriod) csns[sel.classes[0].usn]=true;
					}
					if (filterPass) {
						ecams[cam]=true;
					}
				}
				selPro.filterPass=filterPass;
				if (filterPass) {
					anySelsFilterPass=true;
					if (!sel.full) {
						allFilterPassFull=false;
						allSelsFull=false;
					} else {
						if (sel.waits>0) {
							filterPassWaits++;
						}					
					}
					var ot=sel.ot;
					for (var p=0;p<ot.length;p++) {
						var c=ot.charAt(p);
						if (filterPassOnlineTypes.indexOf(c)<0) {
							filterPassOnlineTypes+=c;
						}
					}
					if (disp.length>0) {
						disp+=" or ";
					}
					if (sel.usn.length>0) {
						if (sl.indexOf(sel.usn)<0) { // only once
							if (sl.length>0) sl+=",";
							sl+=sel.usn;
						}
					}
					disp+=sel.disp;
					nbPass++;
				}
			}
			if (anySelsFilterPass) {
				anyUselsFilterPass=true;
			}
			if (disp.length>45) {
				disp=disp.substr(0,22)+"..."+disp.substr(disp.length-18,disp.length);
			}
			if (sl.length>0) {
				disp="Section"+(sl.indexOf(",")>=0?"s":"")+" "+sl+": "+disp;
			}
			uselPro.allFilterPassFull=allSelsFull;
			uselPro.filterPass=anySelsFilterPass;			
			uselPro.disp=disp;
		}
		this.cnPro.allFilterPassFull=allFilterPassFull;
		this.cnPro.filterPass=anyUselsFilterPass;
		this.cnPro.filterPassOnlineTypes=filterPassOnlineTypes;
		this.cnPro.filterPassWaits=filterPassWaits;
		this.cnPro.filterPassFalseByLocationOnly=filterPassFalseByLocationOnly;
		this.cnPro.cams=ccams;
		this.cnPro.pns=cpns;
		this.cnPro.sns=csns;
		this.cnPro.ecams=ecams;
		this.cnPro.nbPass=nbPass;
		this.cnPro.enrException=enrException;
		
		var selPro=this.getDropdownSelPro();
		var filteredOutDropdown=false;
		if (selPro!=null && !selPro.filterPass) {
			filteredOutDropdown=true;
		}
		
		var t="";
		if (!anyPass) {
			var o4e=preventOutOfEnrollmentWindow?i8n.stillOpenForEnrollement:"";
			if (filterPassFalseByLocationOnly) {
				t+="<span class='noentry'></span>"+i8n.noClasses +o4e+ i8n.occurAtSelectedlocations +getLocations(clocs)+".";
			} else {
				if (cams.length<=1) {
					t+= i8n.noCampusesSelectedAbove;
				} else {
					if (locFilter) t+="<span class='noentry'></span>";
					t+= i8n.thisCourseHasNoClasses +o4e+ i8n.providedAtCampusesSelectedAbove;  
				}
				if (!locFilter && ccams.length>0) {
					t+= i8n.chooseCampusToselectThisCourse;
				}
			}
		} else if (filteredOutDropdown) {
			t+="<span class='noentry noentry_hard'></span>"+i8n.doesNotoccurLocations+" ";
			if (!locFilter) {
				t+= i8n.youMustIncludeCampus;
			}
		} else {
			if (!locFilter) {
				t+=i8n.selectAdditionalCampuses+"<span class=\"selAddCam\"></span>";
			}
		}
		this.cnPro.stoptext=t;
		this.cnPro.stoptext2=(filterPassFalseByLocationOnly||locFilter?"":getCampuses(ccams,this.ca,cams));
		
		/**
		 * 
		 * @param ca all campuses of course
		 * @param selectedCams campuses selected by user for this course
		 * @param cams global campus filter
		 * @returns {String} HTML
		 */
		function getCampuses(ccams,ca,cams) {
			var s="";
			for (var c in ccams) {
				if (c.length<1) continue;
				var desc=camToName(c);
				s+="<li><label>";
				s+="<input class=\"class_cam_chk\" data-cam=\""+c+"\" type=\"checkbox\"";
				var inGlobal=(c in cams);
				if ((c in ca) || inGlobal) {
					s+=" checked=\"checked\"";
				}
				if (inGlobal) {
					s+=" disabled=\"disabled\"";
				}
				s+="/>";
				s+=desc;
				s+="</label></li>";
			}
			return s;
		}

		// Apply Selection Mask
		var tsi=0; // total selection index
		for (var i=0;i<uselPros.length;i++) {
			var uselPro=uselPros[i];
			for (var j=0;j<uselPro.selPros.length;j++) {
				var selPro=uselPro.selPros[j];
				selPro.selected=(this.sa.charAt(tsi)!="i");
				tsi++;
			}
		}
		
		
		// Apply Dropdown selection
		var dropDP=false;
		var dropSS=false;
		var dropUS=false;
		var usKey=null;
		var dropOC=false;
		var dropOO=false;
		var dropLD=false;
		var dropIG=false;
		var dropKP=false;
		var includeAll=false;
		if (this.drop.indexOf("al")==0) {
			includeAll=true;
		} else if (this.drop.indexOf("ss")==0) {
			dropSS=true;
		} else if (this.drop.indexOf("us_")==0) {
			dropUS=true;
			usKey=this.drop.substr(3);
		} else if (this.drop.indexOf("oc")==0) {
			dropOC=true;
		} else if (this.drop.indexOf("oo")==0) {
			dropOO=true;
		} else if (this.drop.indexOf("ld")==0) {
			dropLD=true;
		} else if (this.drop.indexOf("ig")==0) {
			dropIG=true;
		} else if (this.drop.indexOf("kp_")==0) {
			dropKP=true;
		} else if (this.drop.indexOf("dp_")==0) {
			dropDP=true;
		}
		
		for (var j=0;j<uselPros.length;j++) {
			var uselPro=uselPros[j];
			var oneIncluded=false;
			for (var k=0;k<uselPro.selPros.length;k++) {
				var selPro=uselPro.selPros[k];
				
				var inc=true;
				
				if (!selPro.filterPass) {
					inc=false;
				} else if (includeAll) {
					// Include all selections
				} else if (dropIG || dropDP) {
					inc=false;
				} else if (dropSS) {
					if (!selPro.selected) {
						inc=false;
					}
				} else if (dropUS) {
					if (selPro.cnf.hardPin) {
						if (!selPro.uselPro.usel.isKeyMatch(this.drop.substr(3))) {
							inc=false;
						}
					}
				} else if (dropOC) {
					if (selPro.ot.indexOf("c")<0) {
						// Online Types must contain "c" for campus
						// for us to include it.
						inc=false;
					}
				} else if (dropOO) {
					if (selPro.ot.indexOf("l")<0 && selPro.ot.indexOf("o")<0) {
						inc=false;
					}
				} else if (dropLD) {
					if (selPro.ot.indexOf("l")<0) {
						inc=false;
					}
				} else if (dropKP) {
					if (selPro.cnf.hardPin) {
						if (selPro.sel.key!=selPro.cnf.enr && selPro.sel.key!=selPro.cnf.cart) {
							inc=false;
						}
					}
				}
				
				selPro.included=inc;
			}		
		}
		
		this.cnPro.computeRelevantRequirementGroups();
		this.cnPro.computeRelevantNotes();
	}
	
	this.computeWarnings = function(allSelPros) {
		
		// Compute Requirement Group Warnings
		var cnPro=this.cnPro;
		cnPro.warnings.length=0;
		if (!cnPro.filterPass || this.drop.indexOf("dp_")==0) {
			return;
		}
		var sat=false;
		for (var j=0;j<cnPro.uselPros.length;j++) {
			var uselPro=cnPro.uselPros[j];
			for (var k=0;k<uselPro.selPros.length;k++) {
				var selPro=uselPro.selPros[k];
				if (!selPro.filterPass) continue;
				if (selPro.isSatisfied(allSelPros)) {
					sat=true;
				}
			}
		}
		if (!sat) cnPro.warnings.push(i8n.noClassesSatisfy);
		if (cnPro.enrException) {
			if (this.enr.length>0) {
				cnPro.warnings.push(i8n.doesNotOccurFilters);
			} else {
				cnPro.warnings.push(i8n.cartDoesNotFilters);
			}
		}
	}
	
	this.toRequirement = function(includeAll) {
		var shellsT = [];
		shellsT.push(this.toShell(includeAll));
		return new Requirement(shellsT,1);
	}
	
	this.toShell = function(includeAll) {
		var includes=new Array();
		var uselPros=this.cnPro.uselPros;
		for (var j=0;j<uselPros.length;j++) {
			var uselPro=uselPros[j];
			var oneIncluded=false;
			for (var k=0;k<uselPro.selPros.length;k++) {
				if (uselPro.selPros[k].included) {
					oneIncluded=true;
					break;
				}
			}
			if (includeAll || oneIncluded) {
				includes.push(j);
			}
		}
		return new Shell(this,includes);
	}
	
	this.pin = function(add) {
		if (add) {
			if (this.cs==null) return false;
			this.setDrop("us_"+this.cs);
			return true;			
		} else {
			this.setDrop(this.oldDrop);
			return true;
		}
	}
	
	this.isPinned = function() {
		return (this.drop.indexOf("_")==2 && this.drop.indexOf("dp_")!=0);
	}
	
	this.getEnrolledSelPro = function() {
		if (this.enr.length<=0) return null;
		return this.getSelPro(this.enr);
	}
	
	this.getDropdownSelPro = function () {
		if (this.drop.indexOf("_")<=0 || this.drop.indexOf("dp_")==0) return null;
		return this.getSelPro(this.drop.substr(3));
	}
	
	this.getCartSelPro = function() {
		if (this.cart.length<=0) return null;
		return this.getSelPro(this.cart);
	}

}

function CodeNumberPro(cn,cnf) {
	this.cn=cn;
	this.uselPros=new Array();
	for (var i=0;i<cn.usels.length;i++) {
		this.uselPros.push(new USelectionPro(cn.usels[i],cnf,cn));
	}
	
	// Set by applyFilter method
	this.allFilterPassFull=null;
	this.filterPass=null;
	this.filterPassOnlineTypes=null;
	this.filterPassWaits=null;
	this.filterPassFalseByLocationOnly=null;
	this.cams=null;
	this.pns=null;
	this.sns=null;
	this.ecams=null;
	this.nbPass=null;
	this.enrException=null;
	
	this.stoptext=null;
	this.stoptext2=null;
	this.warnings=new Array();
	
	this.reqGs=null;
	this.computeRelevantRequirementGroups = function() {
		var reqGs=new Array();
		// for each requirement group of non-filtered selections
		// determine all acadCareers and all acadGroups
		for (var i=0; i<this.uselPros.length; i++) {
			var uselPro=this.uselPros[i];
			for (var seli=0; seli<uselPro.selPros.length; seli++) {
				var selPro=uselPro.selPros[seli];
				var sel=selPro.sel;
				if (selPro.filterPass) {
					var rg=sel.course.rg;
					var reqG=null;
					for (var ri=0;ri<reqGs.length;ri++) {
						if (reqGs[ri].rg==rg) reqG=reqGs[ri];
					}
					if (reqG==null) {
						reqG=new RequirementGroup(rg,sel.course.rdesc);
						reqGs.push(reqG);
					}
					reqG.selections.push(sel);
					reqG.acadCareers[sel.course.ac]=true;
					reqG.acadGroups[sel.course.ag]=true;
				}
			}
		}
		// for each req. group, determine appropriate name
		for (var i=0;i<reqGs.length;i++) {
			var r=reqGs[i];
			var acSame=true;
			var agSame=true;
			for (var j=0;j<reqGs.length;j++) {
				if (i==j) continue;
				if (!sameContents(r.acadCareers,reqGs[j].acadCareers)) {
					acSame=false;
				}
				if (!sameContents(r.acadGroups,reqGs[j].acadGroups)) {
					agSame=false;
				}
			}
			if (acSame && agSame) {
				// keep name
			} else if (acSame) {
				r.name=luToString(r.acadGroups);
			} else if (agSame) {
				r.name=luToString(r.acadCareers);
			} else {
				r.name=luToString(r.acadCareers)+" "+luToString(r.acadGroups);
			}
		}
		// Sort by ones with no requirements last
		reqGs.sort(function(a,b){return b.desc.length-a.desc.length});
		this.reqGs=reqGs;
	}
	
	this.notes=null;
	this.computeRelevantNotes = function() {
		var notes = new Array();
		for (var i=0; i<this.uselPros.length; i++) {
			var uselPro=this.uselPros[i];
			for (var seli=0; seli<uselPro.selPros.length; seli++) {
				var selPro=uselPro.selPros[seli];
				if (!selPro.filterPass) continue;
				for (var bi=0; bi<selPro.sel.classes.length; bi++) {
					var cls=selPro.sel.classes[bi];
					if (cls.n.length>0) {
						notes.push(cls.disp + ": " + cls.n);
					}
				}
			}
		}
		notes.sort();
		this.notes=notes;
	}
	
}

function USelectionPro(usel,cnf,cn) {
	this.usel=usel;
	this.cnf=cnf;
	this.selPros=new Array();
	for (var i=0;i<usel.sels.length;i++) {
		this.selPros.push(new SelectionPro(usel.sels[i],this,cn));
	}
}

function SelectionPro(sel,uselPro,cn) {
	this.sel=sel;
	this.uselPro=uselPro;
	this.cnf=this.uselPro.cnf;
	this.cn=cn;
	
	this.selected=true; // set by CodeNumberFilter.sa (selection mask)
	this.included=true; // set by CodeNumberFilter.drop,enr,cart
	this.filterPass=null; // set by cams,locs
	this.postPass=null; // Set before sortAndFilter
	
	this.isSatisfied=function(selPros,filters) {
		// See if Class Association req's satisfied
		var sat=true;
		for (var bi=0; bi<this.sel.classes.length; bi++) {
			var cls = this.sel.classes[bi];
			for (var ri=0;ri<cls.rgLines.length;ri++) {
				if (ri>0) return true; // TODO Support multiple lines
				// We found a requirement in this Selection.
				// It must be satisfied.
				sat=false;
				var rgLine=cls.rgLines[ri];
				for (var si=0;si<selPros.length;si++) {
					var selPro=selPros[si];
					if (filters && !selPro.isPostFilterPass(filters)) {
						continue;
					}
					if (selPro.sel.course.cid==rgLine.cid && selPro.sel.classes[0].ac==rgLine.ac) {
						sat=true;
						break;
					}
				}
			}
		}
		this.satified=sat;
		return sat;
	}
	

	this.isPostFilterPass = function(filters) {
		if (!this.included) return false;
		// Ignore full/waitlist filters if enrolled.
		if (this.sel.key!=this.uselPro.cnf.enr) {
			if (filters.hideFull && this.sel.full && this.sel.waits<=0) return false;
			if (filters.hideFull && filters.hideWaitlistable && this.sel.full) return false;
			// This last condition is debatable/confusing
			if (!filters.hideFull && filters.hideWaitlistable && this.sel.waits>0 && !this.sel.full) return false;
		}
		if (filters.hideOnCampus && this.sel.onCampus) return false;
		if (filters.hideOnline && !this.sel.onCampus) return false;
		if (filters.hideClosed && this.sel.closed) return false;
		if (filters.hideHonors && this.sel.hon>0) return false;
		var drop = this.cnf.drop;
		var oldDrop = this.cnf.oldDrop;
		var ot=this.sel.ot;
		if ((drop.indexOf("oc")==0 || oldDrop.indexOf("oc")==0) && ot.indexOf("c")<0) return false;
		if ((drop.indexOf("oo")==0 || oldDrop.indexOf("oo")==0) && ot.indexOf("l")<0 && ot.indexOf("o")<0) return false;
		if ((drop.indexOf("ld")==0 || oldDrop.indexOf("ld")==0) && ot.indexOf("l")<0) return false;
		return true;
	}
	
	this.isChosen = function() {
		return this.cnf.cs==this.sel.key;
	}
	
}


function CodeNumber(cnEl,cnTimeBlocks,term) {
	this.key=cnEl.getAttribute("key");
	this.term=term;
	this.courses=new Array();
	this.usels=new Array();
	
	this.title=cnEl.getAttribute("title");
	this.code=cnEl.getAttribute("code");
	this.number=cnEl.getAttribute("number");
	this.desc=cnEl.getAttribute("desc");
	this.faculty=cnEl.getAttribute("faculty");
	this.since=(new Date()).getTime();
	
	for (var nodei=0; nodei<cnEl.childNodes.length; nodei++) {
		var cEl=cnEl.childNodes[nodei];
		if (cEl.nodeType!=1) continue;
		if (cEl.nodeName!="offering") continue;
		var course = new Course2(cEl);
		this.courses.push(course);
	}
	
	for (var nodei=0; nodei<cnEl.childNodes.length; nodei++) {
		var uselectionEl=cnEl.childNodes[nodei];
		// check node type
		if (uselectionEl.nodeType!=1) continue;
		if (uselectionEl.nodeName!="uselection") continue;
		var uselection = new USelection2(uselectionEl,this,cnTimeBlocks);
		this.usels.push(uselection);
	}
	
	// Put the Course Requirement description together
	var rdesc="";
	var cldesc=null;
	for (var i=0;i<this.courses.length;i++) {
		var c=this.courses[i];
		var rdesc2="";
		if (this.courses.length>1) {
			rdesc2+=c.ac+": "+c.d;
			if (cldesc!=null && cldesc!=c.clcn) {
				cldesc="";
			} else {
				cldesc=c.clcn;
			}
		} else {
			cldesc=c.clcn;
			rdesc2+=c.d;
		}
		if (rdesc.indexOf(rdesc2)>=0) continue;
		if (rdesc.length>0) rdesc+="<br/>";
		rdesc+=rdesc2;
	}
	this.rdesc=rdesc;
	this.cldesc=cldesc==null?"":cldesc.replace(/,/g,", ");

	
	this.updateLiveSeats = function(sels) {
		var change = false;
		for (var i=0; i<this.usels.length; i++) {
			var usel = this.usels[i];
			for (var j=0;j<sels.length;j++) {
				if (usel.updateSelection(sels[j])) {
					change=true;
				}
			}
		}
		this.since=(new Date()).getTime();
		return change;
	}	
	
}

function Course2(cEl) {
	this.key=cEl.getAttribute("key");
	this.cid=cEl.getAttribute("cid");
	this.ac=cEl.getAttribute("ac");
	this.ag=cEl.getAttribute("ag");
	this.ao=cEl.getAttribute("ao");
	this.rg=cEl.getAttribute("rg");
	this.ti=cEl.getAttribute("ti");
	this.eq=cEl.getAttribute("eq");
	this.clcn=cEl.getAttribute("clcn");
	this.rdesc=MM.findReqGroupDesc(this.rg);
}

function USelection2(uselEl,cn,cnTimeBlocks) {
	this.cn=cn;
	this.key=uselEl.getAttribute("key");
	this.d1=+uselEl.getAttribute("d1");
	this.d2=+uselEl.getAttribute("d2");
	this.de=+uselEl.getAttribute("de");
	this.ss=uselEl.getAttribute("ss");
	this.mp=uselEl.getAttribute("mp")=="true"?true:false;
	this.bs=uselEl.getAttribute("bs").split(",");
	for (var i=0;i<this.bs.length;i++) {
		this.bs[i]=+this.bs[i];
	}
	this.sels = new Array();

	var ymd1 = new YearMonthDay(this.d1);
	var ymd2 = new YearMonthDay(this.d2);
	this.ds=getMonth(ymd1.m%12)+" "+ymd1.d+" - "+getMonth(ymd2.m%12)+" "+ymd2.d;

	var seli=0;
	var hon=0;
	var usn=null;
	var usnSame=true;
	for (var i=0; i<uselEl.childNodes.length; i++) {
		var unknownEl=uselEl.childNodes[i];
		if (unknownEl.nodeName!="selection") {
			continue;
		}
		var sel = new Selection2(unknownEl,cn,this,cnTimeBlocks);
		this.sels[seli]=sel;

		hon+=sel.hon;
		seli++;
		if (usn==null) {
			usn=sel.usn;
		}
		if (usn!=sel.usn) {
			usnSame=false;
		}
	}
	this.usn=usnSame?usn:null;
	this.hon=hon;
	this.isKeyMatch = function(key) {
		for (var i=0;i<this.sels.length;i++) {
			if (this.sels[i].key==key) {
				return this.sels[i];
			}
		}
		return null;
	}
	this.updateSelection = function(sel) {
		for (var i=0;i<this.sels.length;i++) {
			if (this.sels[i].key!=sel.key) continue;
			// Overwrite old selection's ClassModels with new ones
			this.sels[i].setClasses(sel.classes);
			return true;
		}
		return false;
	}
}

function Selection2(selEl,cn,usel,cnTimeBlocks) {
	this.cn=cn;
	this.usel=usel;
	this.key=selEl.getAttribute("key");
	var cmkey=selEl.getAttribute("cmkey");
	
	this.credits=selEl.getAttribute("credits");
	this.thc=selEl.getAttribute("thc");
	this.onCampus=(selEl.getAttribute("onCampus")=="true"?true:false);
	this.ot=selEl.getAttribute("ot");

	this.inst=selEl.getAttribute("inst");
	this.ac=selEl.getAttribute("ac");
	this.ssid=selEl.getAttribute("ssid");
	
	// Determine course offering
	if (this.cn!=null) { // null for incremental updates
		for (var i=0;i<this.cn.courses.length;i++) {
			if (this.cn.courses[i].key==cmkey) {
				this.course=this.cn.courses[i];
			}
		}
	}

	// Get XML elements into array
	this.acreqs=false;
	var classes=new Array();
	for (var nodei=0; nodei<selEl.childNodes.length; nodei++) {
		var cEl=selEl.childNodes[nodei];
		if (cEl.nodeType!=1) continue;
		var cls = new Class(cEl,cnTimeBlocks);
		if (cls.rgLines.length>0) {
			this.acreqs=true;
		}
		classes.push(cls);
	}
	
	// Set new blocks (i.e. ClassModels) to this Selection 
	this.setClasses = function(classes) {
		var disp="";
		var closed=false;
		var hon=0;
		var waits=1;
		var full=false;
		var usn=null;
		var usnSame=true;
		var pn=null;
		var pnSame=true;
		for (var bi=0; bi<classes.length; bi++) {
			var cls = classes[bi];
			if (cls.c) closed=true;
			if (cls.secNo.charAt(0)=='H') {
				hon++;
			}
			if (!cls.dispOnly()) {
				if (cls.os<1) {
					full=true;
				}
				// Special banner cond.
				if (!full && positiveWaitlistFillsClass && cls.wc>0 && cls.ws!=-1 && cls.ws<cls.wc) {
					// At least 1 person is in the waitlist, therefore class is full.
					full=true;
				}
				if (cls.ws<1) {
					waits=0;
				}
				
				if (disp.length>0) {
					disp+=" - ";
				}
				disp+=cls.disp;
				
				// If all blocks have the same Unique Selection Number then save it into usn.
				if (usn==null) {
					usn=cls.usn;
				}
				if (cls.usn!=usn) {
					usnSame=false;
				}
				// If all blocks have the same Period Number then save it into pn.
				if (pn==null) {
					pn=cls.pn;
				}
				if (cls.pn!=pn) {
					pnSame=false;
				}

			}
		}
		this.usn=usnSame?usn:null;
		this.pn=pnSame?pn:null;
		this.closed=closed;
		this.hon=hon;
		
		if (pn.length>0) {
			disp=""+i8n.period+" "+pn+": "+disp;
		}
		
		this.disp=disp;
		this.waits=waits;
		this.full=full;
		this.classes = classes;
	}
	
	this.setClasses(classes);
}



function Class(cEl,cnTimeBlocks) {
	this.type=cEl.getAttribute("type");
	this.key=cEl.getAttribute("key");
	this.cartid=cEl.getAttribute("cartid");
	this.secNo=cEl.getAttribute("secNo");
	this.status=cEl.getAttribute("status");
	this.psl=cEl.getAttribute("psl");
	this.u=(cEl.getAttribute("u")=="true"?true:false); // unknown seat availability
	this.c=(cEl.getAttribute("c")=="true"?true:false); // closed
	this.os=+cEl.getAttribute("os");
	this.me=+cEl.getAttribute("me");
	this.ws=+cEl.getAttribute("ws");
	this.wc=+cEl.getAttribute("wc");
	this.n=cEl.getAttribute("n"); // notes
	this.disp=cEl.getAttribute("disp");
	this.usn=cEl.getAttribute("usn");
	this.credits=cEl.getAttribute("credits");
	this.rg=cEl.getAttribute("rg");
	this.ac=cEl.getAttribute("ac");
	this.pn=cEl.getAttribute("pn");
	this.teacher=cEl.getAttribute("teacher");
	this.location=cEl.getAttribute("location");
	this.loos=";"+cEl.getAttribute("loos")+";";
	this.campus=cEl.getAttribute("campus");
	
	// Determine all Req. Group Lines that are part of this ClassModel
	this.rgLines=new Array();
	if (this.rg.length>0) {
		for (var i=0;i<MM.rgLines.length;i++) {
			var r=MM.rgLines[i];
			if (r.reqg==this.rg) {
				this.rgLines.push(r);
			}
		}
	}
	
	// Add to Class Remarks
	for (var i=0;i<this.rgLines.length;i++) {
		var r=this.rgLines[i];
		if (this.n.length>0) this.n+="<br/>";
		if (r.desc.length>0) {
			this.n+=r.desc;
		}
		if (this.n.length==0) {
			this.n+="Class Pairing RG#"+this.rg;
		}
	}
	
	var getTimeBlock = function(id) {
		for (var i=0; i<cnTimeBlocks.length; i++) {
			if (cnTimeBlocks[i].id==id) {
				return cnTimeBlocks[i];
			}
		}
		console.log("Timeblock id="+id+" not found");
		return null;
	}
	
	var timeblockids=cEl.getAttribute("timeblockids").split(",");
	this.timeblocks = new Array();
	for (var i=0; i<timeblockids.length; i++) {
		var id = timeblockids[i];
		if (id=="") continue; // online courses do this
		var tb = getTimeBlock(id,cnTimeBlocks);
		this.timeblocks[i] = tb;
	}
	
	this.getLocForTimeBlock = function(id) {
		if (this.loos.length<=2) return this.location;
		var i=this.loos.indexOf(";"+id+":");
		if (i>=0) {
			var p1=this.loos.indexOf(":",i+1);
			var p2=this.loos.indexOf(";",i+1);
			var loc=this.loos.substring(p1+1,p2);
			return loc;
		}
		return this.location;
	}
	
	this.dispOnly = function() {
		return (this.key.indexOf(".")>=0);
	}
}


function Campus(campusEl) {
	this.name=campusEl.getAttribute("n");
	this.value=campusEl.getAttribute("v");
}

function TimeBlock(id,day,t1,t2,d1,d2,s) {
	this.id=id;
	this.day=day; // 1=Sunday, 2=Monday, ...
	this.t1=t1;
	this.t2=t2;
	this.d1=d1;
	this.d2=d2;
	this.s=s; // Date String: Ex: Feb 5 - Jun 15
	this.offset=0;
	this.overlap=0;

	this.applyOffset = function(offset) {
		var diff=offset-this.offset;
		this.t1=this.t1+diff;
		this.t2=this.t2+diff;
		this.offset=offset;
	}

	this.getText = function() {
		var french=(BB.lang=="fr");
		var hour12=!french;
		var t=getDay2(this.day);
		
		var ymd1 = new YearMonthDay(this.d1);
		var ymd2 = new YearMonthDay(this.d2);
		if (french) {
			t+=" "+ymd1.d+" "+getMonth(ymd1.m%12);
			if (d1!=d2) {
				t+=" - "+ymd1.d+" "+getMonth(ymd2.m%12);
			}			
		} else {
			t+=" "+getMonth(ymd1.m%12)+" "+ymd1.d;
			if (d1!=d2) {
				t+=" - "+getMonth(ymd2.m%12)+" "+ymd2.d;
			}
		}
		
		var h1=Math.floor(this.t1/60);
		var m1=this.t1-h1*60;
		if (m1<=9) m1="0"+m1;
		var h2=Math.floor(this.t2/60);
		var m2=this.t2-h2*60;
		if (m2<=9) m2="0"+m2;
		var a1="";
		var a2="";
		if (hour12) {
			a1="AM";
			if (h1>=12) {
				a1="PM";
			}
			if (h1>12) {
				h1-=12;
			}
			a2="AM";
			if (h2>=12) {
				a2="PM";
			}
			if (h2>12) {
				h2-=12;
			}
		}
		t+=": "+h1+":"+m1+" "+a1+" "+i8n.to+" "+h2+":"+m2+" "+a2;
		return t;
	}

	this.doesOccurBetween = function(v1,v2) {
		// 1. What dateCode is the first occurrence of <day> on or after v1?
		var day=(v1+1)%7; // Get day of week of v1 (0=Sunday, 1=Monday)
		var d=(this.day-1)-day;
		if (d<0) d+=7;
		var d0=v1+d;
		// 2. Ensure this dateCode (d0) within v1,v2 and within d1,d2
		if (d0>v2 || d0<this.d1 || d0>this.d2) {
			return false;
		}
		return true;
	}
}

function RequirementGroup(rg,desc) {
	this.rg=rg;
	this.desc=desc==""?"None":desc;
	this.acadCareers={};
	this.acadGroups={};
	this.name=rg;
	this.selections=new Array();
	this.desc2=function() {
		if (this.desc!="None") return this.desc;
		var has=false;
		for (var i=0;i<this.selections.length;i++) {
			if (this.selections[i].acreqs) {
				has=true;
				break;
			}
		}
		if (has) {
			this.desc=i8n.seeClassRemarks;
		}
		return this.desc;
	}
}

function Timezone(id,offset,abbr,name,dstWarning) {
	this.id=id;
	this.offset=offset;
	this.abbr=abbr;
	this.name=name;
	this.dstWarning=dstWarning;
}

var timezones=new Array();
timezones.push(new Timezone(1,-4,"<br/>HST*","Hawaii",true));
timezones.push(new Timezone(2,-3,"AKST<br/>AKDT","Alaska",false));
timezones.push(new Timezone(3,-2,"PST<br/>PDT","Pacific  (US &amp; Canada)",false));
timezones.push(new Timezone(4,-1,"MST<br/>MDT","Mountain Time (US &amp; Canada)",false));
timezones.push(new Timezone(5,-1,"<br/>MST*","Arizona",true));
timezones.push(new Timezone(6,0,"CST<br/>CDT","Central Time (US &amp; Canada)",false));
timezones.push(new Timezone(7,1,"EST<br/>EDT","Eastern Time (US &amp; Canada)",false));
timezones.push(new Timezone(8,2,"AST<br/>ADT","Atlantic (Canada)",false));
timezones.push(new Timezone(9,2.5,"NST<br/>NDT","Newfoundland (Canada)",false));

function getTimezone() {
    var tmSummer = new Date(Date.UTC(2005, 6, 30, 0, 0, 0, 0));
    var so = -1 * tmSummer.getTimezoneOffset();
    var tmWinter = new Date(Date.UTC(2005, 12, 30, 0, 0, 0, 0));
    var wo = -1 * tmWinter.getTimezoneOffset();
    if (-600 == so && -600 == wo) return '1'; // Hawaii
    if (-480 == so && -540 == wo) return '2'; // Alaska
    if (-420 == so && -480 == wo) return '3'; // Pacific
    if (-360 == so && -420 == wo) return '4'; // Mountain
    if (-420 == so && -420 == wo) return '5'; // Arizona
    if (-300 == so && -360 == wo) return '6'; // Central
    if (-240 == so && -300 == wo) return '7'; // Eastern
    if (-180 == so && -240 == wo) return '8'; // Atlantic
    if (-150 == so && -210 == wo) return '9'; // Newfoundland
    return '0';
}

function Filters(str) {
	this.hideFull=(str.charAt(0)=="l");
	this.hideOnline=(str.charAt(1)=="l");
	this.hideOnCampus=(str.charAt(2)=="l");
	this.hideBadCohort=(str.charAt(3)=="l");
	this.hideWaitlistable=(str.charAt(4)=="l");
	this.hideClosed=(str.charAt(5)=="l");
	this.hideHonors=(str.charAt(6)=="l");
	this.hideNoHonors=(str.charAt(7)=="l");
	
	this.toStr = function() {
		var s="";
		s+=(this.hideFull?"l":"i");
		s+=(this.hideOnline?"l":"i");
		s+=(this.hideOnCampus?"l":"i");
		s+=(this.hideBadCohort?"l":"i");
		s+=(this.hideWaitlistable?"l":"i");
		s+=(this.hideClosed?"l":"i");
		s+=(this.hideHonors?"l":"i");
		s+=(this.hideNoHonors?"l":"i");
		return s;
	}
}

function Reasons() {
	this.nonOverlapResults=0;
	this.reasonPins=false;
	this.reasonCoreqs=false;
	this.reasonHideNoHonors=false;
}

function BusyBlock(d1,d2,day,hourStart,hourEnd) {
	this.d1=d1;
	this.d2=d2;
	this.day=day;
	this.hourStart=hourStart;
	this.hourEnd=hourEnd;
}

function ReqGroupLine(rglEl) {
	this.reqg=rglEl.getAttribute("reqg");
	this.line=rglEl.getAttribute("line");
	this.connand=rglEl.getAttribute("connand");
	this.lineand=rglEl.getAttribute("lineand");
	this.desc=rglEl.getAttribute("desc");
	this.cid=rglEl.getAttribute("cid");
	this.ac=rglEl.getAttribute("ac");
	this.ieq=rglEl.getAttribute("ieq");
	this.top=rglEl.getAttribute("top");
}

// Color assignment
var CA = (function() {
	var my = {};
	var ass = [];
	for (var i=0;i<=12;i++) {
		ass[i]={key:"",age:99};
	}
	
	function nextGoodColor(cnKey) {
		// Find color not used in a while
		for (var i=1;i<=12;i++) {
			if (ass[i].key==cnKey) return i;
			if (ass[i].age>3) {
				ass[i].key=cnKey;
				return i;
			}
		}
		return 0;
	}
	
	function assignState(gState) {
		if (gState==null) return;
		for (var i=0;i<gState.cnfs.length;i++) {
			var cnf=gState.cnfs[i];
			if (cnf.color>12) {
				cnf.color=nextGoodColor(cnf.cnKey);
			}
			ass[cnf.color].age=0;
		}
	}
	
	my.assignColors = function() {
		for (var i=0;i<=12;i++) {
			ass[i].age++;
		}
		assignState(BB.activeState);
		assignState(BB.previewState);
	}
	
	return my;
}());