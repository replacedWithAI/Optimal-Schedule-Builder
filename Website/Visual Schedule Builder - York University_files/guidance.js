

function guidanceInit(name,terms,id,testName) {
	
	if (name==null || name=="" || name=="null" || terms.length==0) {
		return;
	}

	var $loc=$(id);
	
	var termParams=convertTermsToParams(terms);
	
	var testParam="";
	if (testName) {
		testParam="&test="+testName;
	}
	
	$.getJSON("vsbmultipurpose?noc="+(new Date()).getTime()+"&action=studenttiming"+termParams+testParam,function(data) {
		
		var st=data;
		
		var m1="";
		if (!(!st.holds)) {
			m1=getHoldsText(st.holds,0);
		}
		
		var m2="";
		var substance=false;
		for (var termi=0;termi<st.terms.length;termi++) {
			var term=st.terms[termi];
			if (st.terms.length>0) {
				if (termi>0) m2+="<br/>";
				m2+="<strong>"+term.term.name+" Term:</strong> ";
			}

			var sentences=new Array();
			var allSessionsSame=true;
			for (var sessi=0;sessi<term.sessions.length;sessi++) {
				var session=term.sessions[sessi];
				var s="";

				
				if (session.appointments.length>0) {
					s+="Your online enrollment time";
					if (session.appointments.length>1) {
						s+="s";
					}
					if (term.sessions.length>1) {
						s+=" for ";
					}
				}
				
				if (term.sessions.length>1) {
					s+=" Sessionz s-s-s";
				}
				
				var allPast=true;
				for (var a=0;a<session.appointments.length;a++) {
					if (session.appointments[a].endDate.code>=todayCode) {
						allPast=false;
					}
				}
				
				if (session.appointments.length>1) {
					if (allPast) {
						s+=" were ";	
					} else {
						s+=" are ";
					}
				} else if (session.appointments.length==1) {
					if (allPast) {
						s+=" was ";	
					} else {
						s+=" is ";
					}
				} else {
					s+=" ";
				}
				
				for (var a=0;a<session.appointments.length;a++) {
					if (a>0) {
						s+=", ";
						if (a+1==session.appointments.length) {
							s+="and ";
						}
					}
					var appt=session.appointments[a];
					s+=getMonth2(appt.startDate.month)+" "+appt.startDate.day+", ";
					s+=formatTime(appt.startHour,appt.startMinute);
					s+=" to ";
					if (appt.startDate.code!=appt.endDate.code) {
						s+=getMonth2(appt.endDate.month)+" "+appt.endDate.day+", ";
					}
					s+=formatTime(appt.endHour,appt.endMinute);
				}
				
				if (session.appointments.length>0) {
					if (allPast) {
						s+=". Anyone may enroll since ";
					} else {
						s+=". Or, anyone may enroll starting ";	
					}
				} else {
					if (s.length<=1) {
						s+="E";
					} else {
						s+="e";
					}
					s+="nrollment ";
					if (session.session.openEnrollmentDate.code<todayCode) {
						s+="already began";
					} else {
						s+="will begin";
					}
					s+=" on ";
				}
				
				s+=getMonth2(session.session.openEnrollmentDate.month)+" "+session.session.openEnrollmentDate.day+". ";

				var sentence=new Sentence(s,session.session.schoolSessionCode);
				
				if (sentences.length>=1 && sentences[0].words!=sentence.words) {
					allSessionsSame=false;
				}
				sentences.push(sentence);

			}

			sentences.sort(function(a,b) {
				if (a.words<b.words) return -1;
				if (a.words>b.words) return 1;
				return 0;
			});
			
			var sBuf=new Array();
			for (si=0;si<sentences.length;si++) {
				var sen=sentences[si];
				sBuf.push(sen.session);
				if (si+1<sentences.length && sen.words==sentences[si+1].words) {
					// nada
				} else {
					var p="";
					for (var pi=0;pi<sBuf.length;pi++) {
						if (pi>0) p+=", ";
						if (pi>0 && pi+1==sBuf.length) p+=" and ";
						p+="'"+sBuf[pi]+"'";
					}
					if (allSessionsSame) {
						sen.words=sen.words.replace("Sessionz s-s-s e","E");
						sen.words=sen.words.replace("time for  Sessionz s-s-s is","time is");
						p="";
					}
					m2+=sen.words.replace("s-s-s",p).replace("z",(sBuf.length>1?"s":""));
					substance=true;
					
					sBuf.length=0;
				}
			}
			
			// term-specific holds:
			var m2h = st.holds?getHoldsText(st.holds,+term.term.id):"";
			if (m2h.length>0) substance=true;
			m2+=m2h;
			
		}
		
		
		if (!substance) m2="";
		
		var m=m1;
		if (m2.length>0 && m1.length>0) m+="<br/>";
		m+=m2;
		
		if (preventOutOfEnrollmentWindow) {
			if (m.length>0) m+="<br/>";
			m+="Note: Classes that are past their Add/Drop date will not be displayed"
		}

		// TEMP for demo
//		if (name=="990000003") {
//			m="Attention: You have a hold on your student record. You will not be able to register for classes until it is removed.";
//		}
		
		// TEMP for french
		if (i8n.ext=="_fr") {
			m="Les inscriptions pour le trimester d'hiver 2016 ont commencé le 1er août";
		}
		
		if (m.length>0) {
			$loc.find(".guidanceText").html(m);
			$loc.show();
			PAGES.settleWindow();
		}
		
	});

	
}

// Get hold for the given school term id (sti). Use sti=0 to get general holds.
function getHoldsText(holds,sti) {
	var now=(new Date()).getTime()
	if (holds.length<=0) return "";
	var t="";
	for (var i=0;i<holds.length;i++) {
		var h=holds[i];
		if (sti==0 && (+h.firstSchoolTermId!=0 || +h.lastSchoolTermId!=0)) {
			continue;
		}
		if (sti<h.firstSchoolTermId) continue;
		if (sti>h.lastSchoolTermId) continue;
		if (!h.active) continue;
		if (h.dateCreated>now) continue;
		if (+h.dateExpiring!=0 && h.dateExpiring<now) continue;
		//if (!h.preventAdd && !h.preventSwap && !h.preventDrop) continue;
		if (h.hide) continue;
		t+="Attention: ";
		t+=h.description+"<br/>";
	}
	return t;
}

function Sentence(words,session) {
	this.words=words;
	this.session=session;
	this.getText=function() {
		return this.words.replace("s-s-s",this.session);
	}
}


function formatTime(hour,min) {
	var pm=false;
	var dh=hour;
	if (hour==0) {
		dh=0;
	} else if (hour==12) {
		pm=true;
	} else if (hour>12) {
		dh-=12;
		pm=true;
	}
	var dm=min;
	if (dm<=9) dm="0"+dm;
	return dh+":"+dm+(pm?"pm":"am");
}