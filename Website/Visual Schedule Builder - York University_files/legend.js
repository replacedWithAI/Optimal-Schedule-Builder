"use strict";

var overlapWarning=false;

function Legend(legendDest) {
	
	var self=this;
	var $divLegend = $(legendDest);
	
	var randomizeLegendSelection=true;
	
	var nonOverlapResults;
	
	this.draw = function(gState,result) {
		
		nonOverlapResults = gState.reasons.nonOverlapResults;
		
		var filters = gState.filters;
		var cnfs = gState.cnfs;
		
		// Create the legend
		var leg = "";

		//leg = "ID: "+result.id+"<br/>";
		//leg += "Score: "+result.score+"<br/>";
		//leg += "Scores: "+result.scores+"<br/>";
		//leg += "overlap="+result.overlap;
		
		overlapWarning=(result.overlap>0);
		
		if (enableCohort) {
			var coScore=result.scores[7];
			coScore=Math.round(coScore,1);
			if (coScore>=1000) coScore-=1000;
			leg+="<div class=\"legend_score\" title=\""+i8n.ratingDecreases+"\">Cohort Rating: "+coScore+"%</div>";
		}


		var lastCnf = null;
		var newCourse=false;
		var courseNb=0;
		var radioName=null;
		var usingQuotes=false;

		if (result.selPros.length==0) {
			leg+="<div class=\"empty_warning warningNoteBad\">"+i8n.scheduleBlank+"</div>";
		}

		for (var ci=0; ci<cnfs.length; ci++) {
			var cnf=cnfs[ci];
			
			// if ignored and not enrolled, skip it completely
			if (cnf.ignore && cnf.drop.indexOf("dp_")!=0) {
				continue;
			}
			
			var hideCourse=false;
			// Get the selections in the result that are part of this course.
			var selPros=new Array();
			for (var i=0; i<result.selPros.length; i++) {
				if (result.selPros[i].cnf==cnf) {
					selPros.push(result.selPros[i]);
				}
			}

			if (selPros.length==0) {

				// Inserting dropped courses as hidden
				if (cnf.cnPro.uselPros.length>=1) {

					// Try to add the currently enrolled section
					var selPro=cnf.getEnrolledSelPro();
					if (selPro!=null) {
						selPros.push(selPro);
					} else {
						// Otherwise, just show the first usel
						for (var i=0;i<cnf.cnPro.uselPros[0].selPros.length;i++) {
							selPros.push(cnf.cnPro.uselPros[0].selPros[i]);
						}
					}
				}
				hideCourse=true;
				courseNb--;
			}

			var hideShowResultsCount=0;
			for (var i=0; i<selPros.length; i++) {
				var selPro = selPros[i];

				if (!hideCourse) {
					if (!selPro.isPostFilterPass(filters)) {
						continue;
					}
					
					// Check co-reqs
					if (!selPro.isSatisfied(result.selections,filters)) {
						continue;
					}
				}

				if (lastCnf==null || lastCnf!=selPro.cnf) {
					newCourse = true;
				} else {
					newCourse = false;
				}

				// Get Selection CRNs
				var selCrns="";
				var sel=selPro.sel;
				for (var b=0; b<sel.classes.length;b++) {
					var cls = sel.classes[b];
					if (cls.dispOnly()) continue;
					if (b>0) {
						usingQuotes=true;
						selCrns+=(disableRel12Parenthesis?" ":" (");
					}
					selCrns+=cls.cartid;
					if (b>0) {
						selCrns+=(disableRel12Parenthesis?"":")");
					}
					if (useLeafCartItemId) {
						selCrns=cls.cartid;
					}
				}

				// put radio?
				radioName=null;
				var nextSelPro=null;
				if (i<selPros.length-1) {
					nextSelPro = selPros[i+1];
				}
				// If last Selection had same course or next selection has same course
				if ((lastCnf!=null && lastCnf==selPro.cnf) || (nextSelPro!=null && nextSelPro.cnf==selPro.cnf)) {
					radioName=sel.cn.code+sel.cn.number;
				}

				if (newCourse && lastCnf!=null) {
					leg += "</div></div></div>"; // tr/td/table course_cell_legend
					leg += "</div>"; // course_box
				}

				if (newCourse) {
					courseNb++;

					var uselkey=sel.usel.key;

					var pinned=false;
					var extraClass="";
					var message="";
					if (cnf.isPinned()) {
						pinned=true;
						extraClass=" bclock";
						message+=i8n.clickToUnpin;
					} else {
						message+=i8n.clickToPin;
					}
					var lockFunction = "addPin(event,'"+uselkey+"',"+(!pinned)+",'no');";
					
					// Date Grid stuff
					//if (!hideCourse) {
					//	var ymd1=new YearMonthDay(sel.usel.d1);
					//	var ymd2=new YearMonthDay(sel.usel.d2);
					//	drawDateRow(courseNb,cnf.cnPro.cn.title,sel.blocks,ymd1,ymd2,uselkey,pinned);
					//}
					
					leg += "<div class=\"course_box be"+(hideCourse?0:0)+(hideCourse?" to_drop":"")+"\" style=\""+(hideCourse?"display:none;":"")+"\">";

					leg += "<div class=\"legend_table table computer-only\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\"><div class='tr'><div class=\"td course_cell_legend one_col\">";


					var bcNb=(hideCourse?0:cnf.color);
					leg += "<div  class=\"course_header bc"+bcNb+" bh"+bcNb+extraClass+"\"";

					leg += " title=\""+message+"\" onclick=\""+lockFunction+"\" onmouseout=\"RR.highlightClass("+bcNb+",false);\" onmouseover=\"RR.highlightClass("+bcNb+",true);\"><div  class=\"header_cell\">";

					leg += "<h4 style='float:left;' class='course_title'>"+sel.cn.code+" "+sel.cn.number+"</h4>";
					leg += "<div style='float:right;'";
					if (sel.usel.ss.length>0) {
						leg += " title='"+sel.usel.ss+"'";
					}
					leg += ">"+sel.usel.ds+"</div>";

					leg += "<div style='float:right;clear:right;' class='session_label'>";
					if (sel.usel.ss.length>0) {
						leg += "Session: ";
						leg += sel.usel.ss;
						leg += " &nbsp;&nbsp;";
					}
					leg += "</div>";

					leg += "<div style='float:left;clear:left;'><span class='mobileNUmber'>"+courseNb+"-</span><span>"+sel.cn.title+"</span></div>";
					leg += "<div style='clear:both'></div>";

					if (BB.access) {
						var texts=new Array();
						for (var b=0; b<sel.classes.length;b++) {
							var cls=sel.classes[b];
							for (var tbi=0;tbi<cls.timeblocks.length;tbi++) {
								var tb=cls.timeblocks[tbi];
								var text=tb.getText();
								var ii=text.indexOf(":");
								texts.push([text.substr(0,ii),text.substr(ii)]);
							}
						}

						var timesDisp="";
						for (var ti=0;ti<texts.length;ti++) {
							if (texts[ti]==null) continue;
							for (var tj=ti+1;tj<texts.length;tj++) {
								if (texts[tj]==null) continue;
								if (texts[ti][1]==texts[tj][1]) {
									texts[ti][0]+=", "+texts[tj][0];
									texts[tj]=null;
								}
							}
							timesDisp+=texts[ti][0]+texts[ti][1]+"<br/>";
						}

						leg += timesDisp;//+"<input type='checkbox'/><a  class='pinunpin' href='javascript:void(0)'>"+message+" "+sel.course.title+"</a>";
					}

					leg += "</div></div>";
					if(BB.access) {
						leg += "<div class='course_header bc"+bcNb+"'><a id=\"bc"+bcNb+"unpin noprint\" href=\"javascript:void(0)\" onclick=\"addPin(event,'"+uselkey+"',"+(!pinned)+",'bc"+bcNb+"unpin');\">"+message+" "+sel.cn.code+" "+sel.cn.number+"</a></div>";
					}
				} else {
					leg += "<div class=\"selection_or\">or</div>";
				}
				hideShowResultsCount++;
				// Selection
				leg += "<label class='vsbselectionnew'>";  // temp disabled
				//leg += "<label>";
				leg += "<div class=\"selection_row"+(radioName!=null?" selection_row_radio":"")+"\" data-selkey=\""+sel.key+"\">";

				leg += "<div class=\"selection_table\"><table class=\"inner_legend_table\" cellpadding='1' cellspacing='0' width='100%'>";

				var lastSecNo="";
				for (var b=0; b<sel.classes.length; b++) {
					var cls = sel.classes[b];
					leg += "<tr>";
					if (b==0) {

						var color="green";
						if (sel.full && sel.waits<=0) color="red";
						if (sel.full && sel.waits>0) color="yellow";

						leg += "<td rowspan=\"" + (sel.classes.length*2) + "\" valign=\"middle\" align=\"center\" width=\"25\" class=\"legendSelect bg_"+color+" "+(radioName!=null ? "" : "empty")+"\">";
						if (radioName!=null) {
							leg += "<input id=\"rad_"+sel.key+"\" class=\"sel_radio tttt radioforcourse\" type=\"radio\" name=\"" + radioName + "\"";
							leg+=" data-crns=\""+selCrns+"\"";
							leg+=" data-selkey=\""+sel.key+"\"";
							leg+=" data-color=\""+color+"\"";
							leg+=" data-pri=\""+(selPro.cnf.enr==sel.key||selPro.cnf.cart==sel.key?"1":"0")+"\"";
							leg+=" value=\""+sel.key+"\"";
							leg+=" title=\"These classes occur at the same time. Choose the one you prefer.\"";
							leg+="/>";
						} else {
							leg += "<span class=\"sel_radio\"";
							leg+=" data-selkey=\""+sel.key+"\"";
							leg+=" data-crns=\""+selCrns+"\"";
							leg+=" data-color=\""+color+"\"";
							leg+="></span>";
						}
						leg += "</td>";
					}

					var unsched = "";
					if (sel.onCampus && cls.timeblocks.length<=0) {
						unsched+="<span class='leftnclear'>"+i8n.unscheduled+"</span>";
					}

					var campusDisp = "";
					var campusDesc = "";
					if (cls.campus!=null) {
						var fullCampus=getCampusDesc(cls.campus);
						if (showFullCampusInLegend) {
							campusDisp=fullCampus;
						} else {
							campusDisp=cls.campus;
						}
						campusDesc=" title=\""+i8n.campus+""+fullCampus+"\"";
					}


					// McGill Specific - start
					if (cls.status=="T") {
						unsched+=i8n.temporarilyClosed;
					}
					if (cls.status=="R") {
						unsched+=i8n.registrationOptional;
					}
					campusDisp = campusDisp.replace("Downtown", "<a href='http://www.mcgill.ca/maps/' target='_blank' title='Click for campus map'>Downtown</a>");
					campusDisp = campusDisp.replace("Macdonald", "<a href='http://www.mcgill.ca/maps/macdonald/' target='_blank' title='Click for campus map'>Macdonald</a>");
					// McGill Specific - end


					leg += "<td><strong class='leftnclear'>";
					if (b==0) {
						if (sel.pn.length>0) leg+= ""+i8n.period+" "+sel.pn+": ";
						if (sel.usn.length>0) leg+= "Section "+sel.usn+": ";
					}
					leg += cls.type;
					if (lastSecNo!=cls.secNo || template=="york") {
						leg += " "+cls.secNo;
					}
					lastSecNo=cls.secNo;
					leg += "</strong>";
					
					// Enrollment status
					var es="";
					if (sel.key==cnf.enr) {
						es="Enrolled";
						if (cnf.waiting) {
							es="Wait Listed";
						}
					}
					if (sel.key==cnf.cart) {
						es="In Shopping Cart";
					}
					if (es.length>0) {
						leg += "<div class='course_status_cont'><span class='course_status'>"+es+"</span></div>";
					}

					if (sel.thc.length>0) {
						leg += "<span class='leftnclear class_title' data-classTitle='"+sel.thc+"'>"+sel.thc+"</span>";
					}
					if (!cls.dispOnly()) {

						var dispKey=cls.cartid;
						if (template=="spc" && dispKey.length>=11) {
							dispKey=dispKey.substring(0,4)+"-"+dispKey.substring(4,8)+"."+dispKey.substring(8,11)+"-"+dispKey.substring(11);
						}

						if (!useLeafCartItemId || b==sel.classes.length-1) {
							leg += "<label for=\"rad_"+sel.key+"\"><span class=\"leftnclear\"><span class='crn_label'>"+i8n.crn+":</span></span><span class=\"crn_value\" style='float:left'>"+dispKey+"</span></label>";
						}
						if (showSeatNumbers) {
							if (cls.u) {
								// Seat Availability unknown
								leg += "<span class='leftnclear'>";
								leg += i8n.unknownSeatAvailability;
								leg += "</span>";
							} else if (cls.os!=9999) {
								// Seat Availability is not unlimited:
								
								if (cls.os<=0 || (positiveWaitlistFillsClass && cls.wc>0 && cls.ws<cls.wc)) {
									// Seats are full, but there may be room in waitlist
									
									leg += "<span class='leftnclear' title=\"All "+cls.me+" seats are taken\">"+i8n.seats+": <span class=\"fullText\">"+i8n.full+"</span></span>";
									leg += "<span class=\"legend_waitlist leftnclear\">";
									
									leg += "<span title=\"";
									leg += i8n.waitListNotice;
									if (cls.ws>0) {
										var waiting=cls.wc-cls.ws;
										leg += "There ";
										if (waiting==1) {
											leg += "is 1 person";
										} else {
											leg += "are "+waiting+" people";
										}
										leg += " waiting out of the limit of "+cls.wc+"\">Waitlist: <span class=\"waitText\">"+waiting+"/"+cls.wc+"</span></span>";
									} else if (cls.ws==0 && cls.wc>0){
										leg += "The limit of ";
										if (cls.wc==1) {
											leg += "1 person";
										} else {
											leg += cls.wc+" people"
										}
										leg += " waiting has been reached\">Waitlist: <span class=\"fullText\">Full</span></span>";
									} else {
										leg += "This class is not waitlist-enabled\">Waitlist: <span class=\"fullText\">None</span></span>";
									}
									leg+="</span>";
								} else {
									
									// There are seats available. Don't bother to show waitlist.
									var help=cls.os+" seat"+(cls.os>1?"s":"")+" remaining";
									if (inspecificSeats) {
										leg += "<span class='leftnclear seats_available'>"+i8n.seats+": <span class=\"seatText\">"+i8n.available+"</span></span>";
									} else {
										if (cls.me>=0) {
											var taken=cls.me-cls.os;
											leg += "<span title=\""+help+"\" class='leftnclear'>"+i8n.seats+": <span class=\"seatText\">"+taken+"/"+cls.me+"</span></span>";
										} else {
											leg += "<span title=\""+help+"\" class='leftnclear'>"+i8n.seats+": <span class=\"seatText\">"+cls.os+"</span></span>";
										}
									}
									leg+="</span>";
								}

							}
						}
					} else {
						campusDisp = "";
					}

					var locationDisp = (cls.location==null?"":cls.location+"<br/>");
					var teacherDisp = (cls.teacher==null?"":cls.teacher);
					var notesDisp = (cls.n==null?"":cls.n);

					leg += unsched+"</td>";
					leg += "<td align=\"right\">";
					if (campusDisp.length>0) {
						leg += "<div"+campusDesc+" class='campus_block rightnclear'>"+campusDisp+"</div>";
					}
					if(sel.credits!=0 && b==0) {
						leg += "<div class='credits_block rightnclear' data-credits='"+sel.credits+"' data-classTitle='"+sel.thc+"'  data-courseTitle='"+sel.cn.code+" "+sel.cn.number+"'>"+sel.credits+" Credits</div>";
					}
					leg += "<div class='rightnclear'>";
					if (!sel.onCampus) {
						leg += "<img alt=\"Class is Online\" title=\""+i8n.calssIsOnline+"\" src=\"images/online.gif\" style=\"vertical-align:middle;\" width=\"20\" height=\"20\"/>";
					}
					leg += "<span title=\""+i8n.buildingAndRoomNo+"\">"+locationDisp+"</span>";
					leg += "</div>"
					leg += "<div class=\"rightnclear\" title=\""+i8n.instructor+"\">"+teacherDisp+"</div></td></tr>";
					leg += "<tr><td colspan='2' class='notes'>"+notesDisp+"</td></tr>";

				}

				leg += "</table></div>";
				leg += "<div style=\"clear:both;\"></div>";

				//leg += sel.key;
				leg += "</div></label>"; // end of selection_row
				lastCnf = selPro.cnf;
			}


			if(selPros.length>1) {
				var sim="";
				if(hideShowResultsCount-1==1) {
					sim=i8n.s("showSimilarOption",(hideShowResultsCount-1));
				} else {
					sim=i8n.s("showSimilarOptions",(hideShowResultsCount-1));
				}
				leg+="<div class=\"toggleExtra\">"
				leg+="<a href='javascript:void(0)' onclick=\"toggleExtraSelections(this,true,false);return false;\" class='selectmoreval' ><img src=\"images/exp1.gif\" style=\"vertical-align: top;\"/> "+sim+" ...</a>";
				leg+="<a href='javascript:void(0)' onclick=\"toggleExtraSelections(this,false,false);return false;\" class='selectmorevalhideshow' ><img src=\"images/exp2.gif\" style=\"vertical-align: top;\"/> "+i8n.hideSimilarOptions+"</a>";
				leg+="</div>";
			}
		}

		if (cnfs.length>0) {
			leg += "</div></div></div>"; // <td>course_cell_legend, <table>legend_table
			leg += "</div>"; // course_box
		}

		leg += "<div id=\"crnListInfos\"></div>";
		leg += "<div id=\"crnListWarnings\"></div>";
		
		if (enrollType=="real") {

			var disText=" title=\""+i8n.automaticallyAddDropSwap+"\"";
			if (result.full) {
				disText=" disabled title=\""+i8n.oneOrMoreClassesFull+"\"";

			}

			// Enroll button
			leg += "<div style=\"text-align:center;position:relative;margin-bottom:8px\">&nbsp;";
			
			var bText=i8n.getThisSchedule;
			if (disableEnroll) bText=i8n.sendToShoppingCart;
			
			leg += "<input class=\"button_get_schedule big_button\" value=\""+bText+"\" type=\"button\" onclick=\"getScheduleClick();\""+disText+"/>";
			
			var eText=i8n.alreadyEnrolledFor;
			if (disableEnroll) eText=i8n.ScheduleAlreadyInCart;
			leg += "<div class=\"already_have\">"+eText+"</div>";
			leg += "<div class=\"not_signed_in_message\">"+i8n.youAreNotSigned+"</div>";
			leg += "<input class=\"big_button button_cancel_schedule\" type=\"button\" onclick=\"cancelScheduleClick();\" value=\"&#9664; "+i8n.cancel+"\"/>";
			leg += "<input class=\"big_button button_do_actions\" type=\"button\" onclick=\"doActionsClick();\" title=\""+i8n.performAllActions+"\" value=\""+i8n.doActions+"\"/>";
			leg += "<input class=\"big_button button_return\" type=\"button\" value=\""+i8n.returnToAddCourses+"\"/>";
			//leg += "<input class=\"button_to_cart big_button\" value=\"Update Shopping Cart\" type=\"button\" onclick=\"toCartClick();\"/>";
			leg += "</div>";

		} else {

			// Add "add to cart"
			leg += "<div id=\"crnList\"><img src=\"images/cart.gif\" id=\"cart_icon\" style=\"vertical-align:middle;\" alt=\"cart icon\"/> <span class=\"crn_label accessOffOnly\">"+i8n.crn+"s:</span><span class=\"class_label\">Classes:</span>";
			leg += "<label for=\"cartCrns\"><h3 class=\"accessOnly\">Schedule "+i8n.crn+"s</h3></label>";
			if(template == 'york'){
				leg += "<textarea rows=\"4\" style=\"width:80%\" id=\"cartCrns\" autocomplete=\"off\"/></textarea></div>";
			} else {
				leg += " <input type=\"text\" style=\"width:80%\" id=\"cartCrns\" autocomplete=\"off\"/></div>";
			}
			
			
			if (crnHelpText.length>0) {
				leg += "<div class=\"bubble\" style=\"width:88%\"><img src=\"images/tiptop.gif\" class=\"tiptop\" alt=\"\"/>"+i8n.crnHelpText;
				if (usingQuotes && !useLeafCartItemId && !disableRel12Parenthesis) {
					leg+= i8n.numberBetweenAreSelectable;
				}
				leg += "</div>";
			}

			// "Add to MyTrent" button
			if (enrollType=="url") {
				leg += "<div style=\"text-align:center;margin-top:12px\">";
				leg += "<input class=\"big_button enroll_by_url\" value=\""+i8n.sendToWorksheet+"\" type=\"button\"/>";
				if(feeReportButton){
					leg += " <input class=\"big_button\" value=\"Get Fee Details\" type=\"button\" onclick=\"openFeeReportClick();\""+disText+"/>";
				}
				leg += "<div class=\"sendToWorkSheetSubText\">"+i8n.sendToWorkSheetSubText+"</div>";
				leg += "</div>";
			} else if (enrollType=="print") {
				leg += "<p style=\"text-align:center;margin-top:20px\"><input class=\"big_button\" value=\""+i8n.printSchedule+"\" type=\"button\" onclick=\"window.print();\"/></p>";
			}
		}

		$divLegend.html(leg);
		
		$(".sel_radio").click(function() {
			UU.caseChangeSelection(gState);
		});
		
		$(".enroll_by_url").click(function() {
			var cs=$("#cartCrns").val().trim();
			var ids=cs.split(" ");
			for (var i=0;i<ids.length;i++) {
				ids[i]=ids[i].replace("(","");
				ids[i]=ids[i].replace(")","");
			}
			var ids2=ids.join();
			if (typeof custEnrollUrl == "function") {
				custEnrollUrl(ids2);
			} else {
				alert("no custEnrollUrl defined");
			}
		});
		

		selectDefaultRadios(gState);
		radiosToCrnList(gState);
	}
	
	this.applyRadioToCrnList = function(gState) {
		radiosToCrnList(gState);
	}
	
	this.initToggleExtraSelections = function() {
		$divLegend.find(".course_box").each(function() {
			var nb=0;
			nb+=$(this).find(".sel_radio").length;
			if (nb>2 || ($(window).width()<680 && nb>1)) {
				// Set default to hide extra Selections  
				toggleExtraSelections($(this).find(".sel_radio"),false,true);
			}
		});
	}
	
	function selectDefaultRadios(gState) {
		
		$divLegend.find(".course_box").each(function() {
			
			// Use current CodeNumberFilter.cs values as default radio selection
			var done=false;
			var $sr=$(this).find(".sel_radio").each(function () {
				var selkey=$(this).data("selkey");
				var selPro=gState.getSelPro(selkey);
				if (selPro.isChosen()) {
					$(this).prop("checked",true);
					done=true;
					return false;
				}
			});

			if (!done) {
				// URL and wanted data param did not specify Selection.
				// Get a random one - preferring
				// open (g), then waitlistable (y),
				// then closed (r).
				var p=null;
				var g=new Array();
				var y=new Array();
				var r=new Array();
				var nb=0;
				$(this).find(".sel_radio").each(function() {
					if ($(this).data("pri")=="1") {
						p=$(this);
					}
					var c=$(this).data("color");
					if (c=="red") r.push($(this));
					if (c=="yellow") y.push($(this));
					if (c=="green") g.push($(this));
					nb++;
				});
				if (p!=null) {
					p.prop("checked",true);
				} else if (g.length>0) {
					g[(randomizeLegendSelection?getOnceRandomInt(0,g.length-1):0)].prop("checked",true);
				}
				else if (y.length>0) {
					y[(randomizeLegendSelection?getOnceRandomInt(0,y.length-1):0)].prop("checked",true);
				}
				else if (r.length>0) {
					r[(randomizeLegendSelection?getOnceRandomInt(0,r.length-1):0)].prop("checked",true);
				}
			}
		});
		
		self.initToggleExtraSelections();
		
//		$divLegend.find(".course_box").each(function() {
//			var nb=0;
//			nb+=$(this).find(".sel_radio").length;
//			if (nb>4 || ($(window).width()<680 && nb>1)) {
//				// Set default to hide extra Selections  
//				toggleExtraSelections($(this).find(".sel_radio"),false,true);
//			}
//		});
	}
	
	
	// Returns a random integer between min (inclusive) and max (inclusive)
	function getRandomInt(min, max) {
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	var randos=null;
	function getOnceRandomInt(min, max) {
		if ((max-min)>20 || (max-min)<0) return getRandomInt(min,max);
		if (randos==null) {
			randos=new Array();
			for (var i=0;i<=20;i++) {
				randos[i]=getRandomInt(0,i);
			}
		}
		return randos[(max-min)]+min;
	}
	
	

	function radiosToCrnList(gState) {
		var crns="";
		var dropCrns="";
		var warning=false;
		var noRadios=true;
		var honTotal=0;
		var creTotal=0;
		
		// Clear selections (necessary for proper favoriting)
		for (var i=0;i<gState.cnfs.length;i++) {
			gState.cnfs[i].cs="";
		}
		
		$(".course_box").each(function() {
			var $r=$(this).find(".sel_radio:checked");
			if ($r.length<=0) {
				$r=$(this).find(".sel_radio");
			} else {
				noRadios=false;
			}
			
			var col=$r.data("color");
			var selkey=$r.data("selkey");
			var selPro=gState.getSelPro(selkey);
			
			var c=$r.data("crns");
			if (selPro.cnf.drop.indexOf("dp_")==0) {
				// course will be dropped
				if (dropCrns.length>0) dropCrns+=" ";
				dropCrns+=c;
				return;
			}
			if ($(this).hasClass("to_drop")) {
				// course is toggled off
				return;
			}
			if (crns.length>0) crns+=" ";
			crns+=c;

			// Set cs values based on radio selection
			selPro.cnf.cs=selkey;
			
			//honTotal+=(+$r.data("hon"));
			//creTotal+=(+$r.data("cre"));
			honTotal+=+selPro.sel.hon
			creTotal+=+selPro.sel.credits
			if (col!="green" && selPro.cnf.enr=="") warning=true;
			
		});

		$("#cartCrns").val(crns);
		
		
		if (template=="york" && gState==BB.activeState) {
			// We need to redraw in case
			// room numbers change
			var result = gState.sortedFilteredResults[BB.r];
			schedule.draw(result,gState);
			if ($(".reg_schedule2").hasClass("using")) {
				schedule2.draw(result,gState);
			}
		}
		
		var warnMsg="";
		if (warning) {
			warnMsg+="<div class=\"crnListWarning\">"+i8n.warningNotAllclasses +(noRadios?"":"selected ")+i8n.aboveHaveSeatsAvailable+"</div>";
		}
		if (schedule.campusChangeWarning || (schedule2!=null && schedule2.campusChangeWarning)) {
			warnMsg+="<div class=\"crnListWarning\">"+i8n.campusChange+"</div>";
		}
		if (overlapWarning) {
			
			var extra="";
			var rewrite=false;
			
			var nonOverlapResults = gState.reasons.nonOverlapResults;
			
			if (nonOverlapResults<gState.sortedFilteredResults.length) {
				if (nonOverlapResults>1) {
					extra=""+i8n.theFirst+" "+nonOverlapResults+" "+i8n.scheduleResultsDoNot+"";
				} else if (nonOverlapResults==1){
					extra=i8n.firstScheduleResult;
				} else {
					rewrite=true;
				}
			}
			
			warnMsg+="<div class=\"crnListWarning\">";
			if (rewrite) {
				warnMsg+=i8n.overlapsPersonalTime;
			} else {
				warnMsg+=i8n.overlapsNotWantClasses+extra;	
			}
			warnMsg+="</div>";
		}
		if (BB.activeState.filters.hideNoHonors && honTotal==0) {
			warnMsg+="<div class=\"crnListWarning\">"+i8n.selectAtleastOne+"</div>";
		}
		if (minFullTimeCredits>0 && creTotal<minFullTimeCredits) {
			warnMsg+="<div class=\"crnListWarning\">"+i8n.noticeScheduleContains+" "+creTotal+" "+i8n.creditsYouNeed+" "+minFullTimeCredits+" "+i8n.creditsForFullTime+"</div>"
		}
		if (maxFullTimeCredits>0 && creTotal>maxFullTimeCredits) {
			warnMsg+="<div class=\"crnListWarning\">"+i8n.noticeScheduleContains+" "+creTotal+" "+i8n.creditsOverMaximum+" "+maxFullTimeCredits+".</div>"
		}
		if (dropCrns.length>0 && enrollType!="real") {
			warnMsg+="<div class=\"crnListWarning\">"+i8n.dropCrns+""+dropCrns+"</div>";
		}

		if (creTotal>0) {
			var d=creTotal.toFixed(2);
			if (d.charAt(d.length-1)=="0") {
				d=creTotal.toFixed(1);
			}
			var link="";
			if (template=="demo") {
				link="<br/><a target=\"_blank\" href=\""+baseUri+"EMPLOYEE/HRMS/c/SA_LEARNER_SERVICES.SS_TRCR_RPT.GBL?FolderPath=PORTAL_ROOT_OBJECT.CO_EMPLOYEE_SELF_SERVICE.HCCC_TRANSFER_CREDIT.HC_SS_TRCR_RPT_GBL&IsFolder=false&IgnoreParamTempl=FolderPath%2cIsFolder&szCrefClick=T\"><img style=\"vertical-align:top\" src=\"images/popup.gif\"/>&nbsp;Excess Credit Hour Counter</a>";
			}
			$("#crnListInfos").html("<div class=\"crnListInfo credits_block\">"+i8n.totalCredits+": "+d+link+"</div>");
		}
		$("#crnListWarnings").html(warnMsg);

		flagIfHaveAlready(gState);

	}
	

	//Check if we already are enrolled for this whole schedule.
	function flagIfHaveAlready(gState) {
		var haveAll=true;
		var cnfs=gState.cnfs;
		for (var i=0;i<cnfs.length;i++) {
			var cnf=cnfs[i];
			if (cnf.cs==cnf.enr && cnf.drop.indexOf("dp")!=0 && !cnf.ignore) {
				continue;
			}
			haveAll=false;
			break;
		}
		
		$(".already_have").toggle(haveAll);
		
		$(".not_signed_in_message").toggle(!authenticated);
		
		$(".button_get_schedule").prop("disabled",haveAll || !authenticated);
		return haveAll;
	}	
	
}


function toggleExtraSelections(src,isVisible,instant) {
	var slideTime=instant?0:400;
	var $cb=$(src).parents(".course_box");
	$cb.find(".selectmoreval").toggle(!isVisible);
	$cb.find(".selectmorevalhideshow").toggle(isVisible);
	var $or=$cb.find(".selection_or");
	if (isVisible) {
		$or.slideDown(slideTime);
	} else {
		$or.slideUp(slideTime);
	}
	$cb.find(".vsbselectionnew").each(function () {
		if (!isVisible) {
			if($(this).find(".sel_radio").is(":checked")) {
				return;
			}
		}
		if (isVisible) {
			$(this).slideDown(slideTime);
		} else {
			$(this).slideUp(slideTime);
		}
	});
}


function addPin(event,uselkey,addIt,pinid) {
	if (BB.enrollMode) {
		return;
	}

	var selPro = BB.activeState.getSelPro(uselkey);
	if (selPro==null) return;
	
	UU.casePin(selPro.cnf,addIt);
	
	if (event!=null) event.cancelBubble=true;
	if(pinid!='no') {
		$('#'+pinid).focus();
	}
}

function openFeeReportClick() {
	var crnArray = [],crnArray1=[];
	var term = $('.termRadio:checked').data('term');
	$('#termFee').text($('.termRadio:checked').data('termlabel'));
	$(".course_box").each(function() {
		if ($(this).hasClass("to_drop")) return;
		var $r=$(this).find(".sel_radio:checked"),creditsElement,crn,credits,courseTitle,classTitle;
		if($r.length >0){
			crn = $r.data('crns');
		} else {
			$r=$(this).find(".sel_radio");
			crn = $r.data('crns');
		}
		
		creditsElement= $r.parent().parent().find('.credits_block');
		credits = creditsElement.data('credits');
		courseTitle = creditsElement.data('coursetitle');
		classTitle = creditsElement.data('classtitle');
		crnArray1.push({crn:crn,credits:credits,courseTitle:courseTitle,classTitle:classTitle});
		crnArray.push(crn);
	});
	 window.feeData ={crnArray:crnArray,crnArray1:crnArray1,term:term};
	var popupcontainer = $('#feeReportPopup').popup({
        //width: 650
       //  height: 600
    });
	$('#feeTable').hide();
	$('#selectStudentType').val('D');
	loadFeedData(null,prepareFeeTable);
	popupcontainer.open();
    $(".closefitler , .popupl-overlay").click(function(){ 
    	popupcontainer.close();
    });
    
}
function selectStudentTypeChange(){
	var selectStudentTypeValue = $('#selectStudentType').val();
	if(selectStudentTypeValue == ''){
		return ;
	}
	loadFeedData(selectStudentTypeValue,prepareFeeTable);
}
function prepareFeeTable(data){
	var templateArray = ['<tr>','<td class="default" nowrap>{{courseTitle}}</td>','<td class="default">{{classTitle}}</td>','<td class="default">{{crn}}</td>','<td class="default"><p class="rightaligntext">{{credits}}</p></td>','<td class="default"><p class="rightaligntext">${{tutionAmount}}</p></td>','<td class="default"><p class="rightaligntext">${{consumableAmount}}</p></td>','<td class="default"><p class="rightaligntext">${{otherAmount}}</p></td>','<td class="default"><p class="rightaligntext">${{totalAmount}}</p></td>','</tr>'];
	var templateArray1 = ['<tr>','<td class="default">&nbsp;</td>','<td class="default">&nbsp;</td>','<td class="default"><strong>Totals:</strong></td>','<td class="default"><p class="rightaligntext">{{totalCredits}}</p></td>','<td class="default"><p class="rightaligntext">${{totalTutionAmount}}</p></td>','<td class="default"><p class="rightaligntext">${{totalCunsumableAmount}}</p></td>','<td class="default"><p class="rightaligntext">${{totalOtherAmount}}</p></td>','<td class="default"><p class="rightaligntext">${{totalTotalAmount}}</p></td>','</tr>'];
	var rows = window.feeData.crnArray1;
	$('#feeTable tbody').empty();
	var tbody = $('#feeTable tbody'),totalTutionAmount = 0,totalCunsumableAmount =0,totalOtherAmount =0,totalCredits =0,totalTotalAmount = 0;
	for(var i =0; i< rows.length;i++){
		var row = rows[i];
		var d= data[i];
		var total =0;
		for(var k in d){
			if(k != 'crn'){
				total +=d[k];
			}
		}
		d.totalAmount = total;
		row = $.extend(row,d);
		template = templateArray.join('');
		for(var m in row){
			template = template.replace('{{'+m+'}}',row[m]);
		}
		totalTutionAmount += row.tutionAmount;
		totalCunsumableAmount += row.consumableAmount;
		totalOtherAmount += row.otherAmount;
		totalCredits += parseFloat(row.credits);
		totalTotalAmount += row.totalAmount;
		tbody.append(template);
	}
	var template2 = templateArray1.join('');
	var totalsObject = {
			totalTotalAmount:totalTotalAmount,
			totalCredits:totalCredits.toFixed(1),
			totalOtherAmount:totalOtherAmount,
			totalCunsumableAmount:totalCunsumableAmount,
			totalTutionAmount:totalTutionAmount
	};
	for(var m in totalsObject){
		template2 = template2.replace('{{'+m+'}}',totalsObject[m]);
	}
	tbody.append(template2);
	$('#loadinfeedata').hide();
	$('#feeTable').show();
}
function loadFeedData(studentype,cb){
	$('#loadinfeedata').show();
	$.ajax({
        url: 'js/feestructure.json',
        method: 'post',
        data: {term: feeData.term, payload: feeData.crnArray.join('::')}
    }).done(cb);
}

function toggle_visibility(feeReportPopup) {
    var e = document.getElementById(id);
    if(e.style.display == 'block')
       e.style.display = 'none';
    else
       e.style.display = 'block';

 }

function getScheduleClick() {
	
	$(".page_whiteout").addClass("blurr");

	BB.enrollMode = true;
	$(".button_get_schedule").hide();
	$(".hideDuringEnroll").hide();
	var lw=$(".course_cell_legend").outerWidth(true);
	$(".course_cell_legend").removeClass("one_col").css("width",lw+"px");
	$(".toggleExtra").hide();
	$(".empty_warning").hide();
	$(".legend_table").css("width","auto");
	var lw2=$(".reg_parent").width()*0.35; // CSS .course_cell_legend
	$(".course_box").addClass("course_box_noround").css("border-width","inherit");
	$(".course_cell_legend").animate({width:lw2},500);
	$(".course_header").attr("title","");
	
	$("#crnListInfos").slideUp();
	$("#crnListWarnings").slideUp();

	$(".reg_schedule").slideUp(700,function() {
		
		$(".course_box").css("border-width","1px");
		$(".reg_legend").css("max-width","none");
		$(".reg_legend").css("overflow","visible");
		$(".button_cancel_schedule").show();
		$(".button_to_cart").show();

		var actionId=0;
		var ni=1;
		$(".selection_row:visible").each(function() {
			var selkey=$(this).data("selkey");
			var selPro=BB.activeState.getSelPro(selkey);
			var $row=$(this).parents(".course_cell_legend");
			{
				$row.parents(".course_box").addClass("fsk_"+selkey); // for easy finding later
			}

			//$row.after("<div class='phoneOnly clearfix'></div>");

			var doAction=false;
			
			// See EnrollState.java, method fromXlat
			var stateA="T";
			if (selPro.cnf.enr.length>0) stateA="E";
			if (selPro.cnf.waiting) stateA="W";
			if (selPro.cnf.cart.length>0) stateA="C";
			var stateB="E";
			var h="";
			if (selPro.cnf.drop.indexOf("dp_")==0) {
				// Drop
				doAction=true;
				stateB="G";
				h+="<div class=\"td course_cell_action be"+ni+"\">"+i8n.drop+"</div>";
				h+="<div class=\"td course_cell_option be"+ni+" action_drop loading\">Loading...</div>";
				h+="<div class=\"td course_cell_result be"+ni+"\">&nbsp;</div>";
			} else if (selPro.cnf.ignore) {
				// None (If this occurs, we are ignoring a class in the cart, otherwise
				// we would have a drop (dp_) above
				h+="<div class=\"td course_cell_action be"+ni+"\">"+i8n.none+"<br/></div>";
				h+="<div class=\"td course_cell_option nothing be"+ni+"\">N/A</div>";
				h+="<div class=\"td course_cell_result nothing be"+ni+"\">N/A</div>";
			} else if (selPro.cnf.enr.length>0 && selPro.cnf.enr==selkey) {
				// None
				h+="<div class=\"td course_cell_action be"+ni+"\">"+i8n.none+"<br/><span class=\"already\">"+i8n.alreadyEnrolled+"</span></div>";
				h+="<div class=\"td course_cell_option nothing be"+ni+"\">N/A</div>";
				h+="<div class=\"td course_cell_result nothing be"+ni+"\">N/A</div>";
			} else if (selPro.cnf.enr.length>0) {
				// Swap
				doAction=true;
				h+="<div class=\"td course_cell_action be"+ni+"\">"+((noSwapSupport||selPro.cnf.waiting)?""+i8n.drop+" &amp; "+i8n.add+"":""+i8n.swap+"")+"</div>";
				h+="<div class=\"td course_cell_option be"+ni+" action_swap loading\">Loading...</div>";
				h+="<div class=\"td course_cell_result be"+ni+"\">&nbsp;</div>";
			} else if (selPro.cnf.cart.length>0 && selPro.cnf.cart==selkey){
				// Checkout or nothing
				h+="<div class=\"td course_cell_action be"+ni+"\">";
				if (disableEnroll) {
					stateB="C";
					h+="None<br/><span class=\"already\">"+i8n.alreadyInShopping+"</span>";
					h+="</div>";
					h+="<div class=\"td course_cell_option nothing be"+ni+"\">N/A</div>";
					h+="<div class=\"td course_cell_result nothing be"+ni+"\">N/A</div>";
				} else {
					doAction=true;
					h+="<select onchange='changeAction(this);'><option value='none'>"+i8n.none+"</option><option value='enroll' selected='selected'>Checkout (Enroll)</option></select>";
					h+="</div>";
					h+="<div class=\"td course_cell_option be"+ni+" action_add loading\">Loading...</div>";
					h+="<div class=\"td course_cell_result be"+ni+"\"></div>";
				}
			} else if (selPro.cnf.cart.length>0){
				// Drop from Cart and Add to Cart (i.e. cart swap) OR
				// Drop from Cart and Enroll
				doAction=true;
				h+="<div class=\"td course_cell_action be"+ni+"\">";
				if (disableEnroll) {
					stateB="C";
					h+="Swap in Cart";
				} else if (disableCart) {
					h+="Enroll";
				} else {
					h+="<select onchange='changeAction(this);'><option value='cart'>"+i8n.swapInCart+"</option><option value='enroll' selected='selected'>"+i8n.enroll+"</option></select>";
				}
				h+="</div>";
				h+="<div class=\"td course_cell_option be"+ni+" action_add loading\">Loading...</div>";
				h+="<div class=\"td course_cell_result be"+ni+"\"></div>";
			} else {
				// Add to cart or Enroll
				doAction=true;
				h+="<div class=\"td course_cell_action be"+ni+"\">";
				if (disableEnroll) {
					stateB="C";
					h+="Add to Cart";
				} else if (disableCart) {
					h+="Enroll";
				} else {
					h+="<select onchange='changeAction(this);'><option value='cart'>"+i8n.addToCart+"</option><option value='enroll' selected='selected'>"+i8n.enroll+"</option></select>";	
				}
				h+="</div>";
				h+="<div class=\"td course_cell_option be"+ni+" action_add loading\">Loading...</div>";
				h+="<div class=\"td course_cell_result be"+ni+"\"></div>";
			}
			$row.after(h);

			PAGES.settleCheckout();
			
			if (doAction) {
				var $cb=$row.parents(".course_box");
				
				var keyA=selkey;
				if (selPro.cnf.enr.length>0) keyA=selPro.cnf.enr;
				if (selPro.cnf.cart.length>0) keyA=selPro.cnf.cart;
				var keyB=selkey;
				$cb.data("stateA",stateA);
				$cb.data("stateB",stateB);
				$cb.data("keyA",keyA);
				$cb.data("keyB",keyB);
				
				fillOptions($cb);
			}

		});

		$("#legend_headers").fadeIn(500);

	});
	$("#tip_div").slideUp(700);
	$(".reg_row1").hide();
	$(".reg_row1_enroll").show();
	$(".selection_or").hide();
	$(".ResultsPageTitle").html("Finalizing Schedule");
	$("input.sel_radio:not(:checked)").parents("label").slideUp(300);
	$(".to_drop").slideDown(300)
}

//Update options for given ".course_box" div
function fillOptions($cb,nothing) {
	
	var renderButton = function () {
		if ($(".loading").length<=0 && $(".option_good").length>=1) {
			$(".button_do_actions").show();
		}		
	}
	
	var $tdiv=$cb.find(".course_cell_option");
	var $tdivr=$cb.find(".course_cell_result");
	
	if (nothing) {
		$tdiv.html("N/A").addClass("nothing");
		$tdivr.html("N/A").addClass("nothing");
	} else {
		$tdiv.html("").removeClass("nothing");
		$tdivr.html("").removeClass("nothing");
		var stateA=$cb.data("stateA");
		var stateB=$cb.data("stateB");
		var keyA=$cb.data("keyA");
		var keyB=$cb.data("keyB");
		
		// Get the options HTML
		var url="option.jsp?statea="+stateA+"&keya="+keyA+"&stateb="+stateB+"&keyb="+keyB;
		$tdiv.addClass("loading");
		$.ajax({
			type: "GET",
			url: url,
			cache: false
		}).fail(function(){
			$tdiv.removeClass("loading");
			$tdiv.html("Server 500 Error at<br/>"+(new Date())+"<input type=\"text\" value=\"" + url + "\"/>");
		}).done(function(html) {
			$tdiv.removeClass("loading");
			$tdiv.html(html);
			renderButton();
		});
	}
	renderButton();
	
}


function cancelScheduleClick() {
	
	$(".page_whiteout").removeClass("blurr");
	
	$(".button_get_schedule").show();
	$(".hideDuringEnroll").show();
	$("#crnListInfos").show();
	$("#crnListWarnings").show();
	$(".empty_warning").show();
	$(".course_box").removeClass("course_box_noround");
	$(".button_cancel_schedule").hide();
	$(".button_do_actions").hide();
	$(".button_to_cart").hide();
	$(".reg_final_bubble").hide();
	$(".button_return").hide();

	
	$("#legend_headers").hide();
	$(".reg_legend").css("overflow","hidden");

	$(".course_cell_result").remove();
	$(".course_cell_option").remove();
	$(".course_cell_action").remove();

	if (BB.tip!=0) {
		$("#tip_div").slideDown(0);
	}
	$(".selection_or").show();
	$(".reg_row1_enroll").hide();
	$(".reg_row1").show();
	$(".ResultsPageTitle").html(i8n.generatedResults);
	$(".to_drop").slideUp(300);

	$(".course_cell_legend").removeAttr("style").removeClass("one_col");
	$(".legend_table").removeAttr("style");
	$(".legend_box").removeAttr("style");

	$(".reg_schedule").show();
	
	$(".vsbselectionnew").show();
	
	$(".toggleExtra").show();
	legend.initToggleExtraSelections();

	BB.enrollMode = false;
}

function doActionsClick() {

	$(".button_cancel_schedule").hide();
	$(".button_do_actions").hide();

	$(".course_cell_result").each(function() {
		if ($(this).hasClass("nothing")) return;
		$(this).addClass("loading");
	});

	var i=0;
	var url="action.jsp?";
	$(".course_box:visible").each(function() {

		// Check for a bad getOptions response.
		if ($(this).find(".option_bad").length>=1) {
			$(this).find(".course_cell_result").removeClass("loading").html("Failed");
			return;
		}
		
		if ($(this).find(".course_cell_action select").val()=="none") {
			// Skip action=None courses.
			return;
		}

		var stateA = $(this).data("stateA");
		var keyA = $(this).data("keyA");
		var stateB = $(this).data("stateB");
		var keyB = $(this).data("keyB");
		
		if (stateA==null || stateB==null) {
			return;
		}
		
		var selkey=$(this).find(".selection_row:visible").data("selkey");
		var sel=getSelection(selkey);


		if (i>0) url+="&";
		
		url+="statea"+i+"="+stateA+"&keya"+i+"="+keyA+"&stateb"+i+"="+stateB+"&keyb"+i+"="+keyB;		

		// Enrollment options
		$(this).find(".enrollmentOption").each(function () {
			var ok=$(this).data("optionkey");
			var t1=$(this).find("select").val();
			if (t1==undefined) {
				var ip=$(this).find("input");
				var t1=ip.attr("checked");
				if (ip.is(":checked")) {
					t1="true";
				} else {
					t1="false";
				}
			}

			if (t1!=null && t1.length>0) {
				url+="&option"+i+"_"+ok+"="+t1;
			}

		});

		i++;
	});
	url += "&schoolTermId="+BB.activeState.term;

	$.ajax({
		type: "GET",
		url: url
	}).fail(function(){
		var $t=$(".course_cell_result");
		$t.removeClass("loading");
		$t.html("Server 500 Error at<br/>"+(new Date())+"<input type=\"text\" value=\"" + url + "\"/>");
	}).done(function(html) {
		var $input=$(html);
		$input.find(".actionResult").each(function() {
			var fsk=$(this).data("fsk");
			if (fsk!=undefined) {
				var $t1=$(".fsk_"+fsk);
				var $t2=$t1.find(".course_cell_result");
				
				if ($t2.find(".actionResult").length>0) {
					// Not first response for cell
					$t2.append($(this));
				} else {
					$t2.removeClass("loading");
					$t2.html($(this));
				}
				
			} else {
				alert($(this).html());
			}
		});
		$(".course_cell_result.loading").each(function() {
			$(this).removeClass("loading").text("Problem encountered. No action taken.");
		});
		
		//clearDropdowns();
		//guiToPageState();
		$(".button_return").show();
		$(".reg_final_bubble").show();
		$(".button_do_actions").hide();
		$(".button_return").attr("value",i8n.returnToAddCourses);
		
		function returnAfterEnroll() {
			cancelScheduleClick();
			UU.caseViewCriteria();
		}
		
		$(".button_return").click(function() {
			returnAfterEnroll();
		});

		UU.caseCompleteEnroll();

	});
}

function changeAction(src) {
	$(".button_do_actions").hide();
	var $s=$(src);
	var $cb=$s.parents(".course_box");
	var nothing=false;
	if ($s.val()=="enroll") {
		$cb.data("stateB","E");
	} else if ($s.val()=="none") {
		var currState=$cb.data("stateA");
		$cb.data("stateB",currState);
		nothing=true;
	} else {
		// val=="cart"
		$cb.data("stateB","C");
	}
	fillOptions($cb,nothing);
}

function clickRemoveFromCart(selkey) {
	var url="action.jsp?statea0=C&keya0="+selkey+"&stateb0=G&keyb0="+selkey;
	$.ajax({
		type: "GET",
		url: url
	}).fail(function(){
		alert("Failed to remove course from cart");
	}).done(function(html) {
		// nothing
	});
}