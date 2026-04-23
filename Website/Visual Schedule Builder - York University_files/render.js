"use strict";

var enrollMode = false;

var legend = null;
var schedule = null;
var schedule2 = null;
var previewSchedule = null;
var tabbing = false;
var m1callbackGo = null;
var popupNotice = null;

var RR = (function() {
	var my={};
	var noteId=0;
	var myPlanImportTerm=null;
	
	my.addBadWarning=function(text,quick) {
		addWarning(text,false,quick);
	}
	
	my.addGoodWarning=function(text,quick) {
		addWarning(text,true,quick);
	}

	function addWarning(text,isGood,quick) {
		noteId++;
		var $ma=$("#message_area");
		var $q=$ma.find(".quick");
		var animate=400;
		if ($q.length>0) {
			animate=0;
		}
		$ma.append("<div class='warningNote"+(isGood?"Good":"Bad")+" note"+noteId+" "+(quick?"quick":"")+"' style='display:none'></div>");
		var $t=$ma.find(".note"+noteId);
		$t.text(text);
		$q.remove();
		$t.show(400,function() {
			$(this).attr("role","alert");	
		});
		
		function delNote(id) {
			return function() {
				$(".note"+id).hide(animate, function() {
					$(this).remove();
				});
			}
		}
		setTimeout(delNote(noteId),5000);
	}
	
	my.renderMyPlanImport = function() {
		var term=BB.activeState.term;
		if (term!=null && term!=myPlanImportTerm) {
			$.getJSON("api/getAcademicPlans?term="+term, function(plans) {
				var $sel=$(".myPlanImport select");
				$sel.empty();
				var h="<option value='0'>"+(plans.length==0?"(No plans)":"Select plan")+"</option>";
				for (var i=0;i<plans.length;i++) {
					h+="<option value='"+plans[i].courses+"'>"+plans[i].title+"</option>";
				}
				$sel.html(h);
			});
			myPlanImportTerm=term;
		}
	}

	// Show the loading div after a small delay to
	// prevent jitter if response is fast, or
	// hide it immediately.
	var loadTimer=null;
	my.showLoadingDiv = function(show) {
		if (show) {
			if (loadTimer==null) {
				loadTimer=setTimeout(function() {
					$(".loadingDiv").show();
				},500);
			}
		} else {
			if (loadTimer!=null) {
				clearTimeout(loadTimer);
				$(".loadingDiv").hide();
				loadTimer=null;
			}
		}
	}
	
	var genTimer=null;
	my.showGeneratingDiv = function(show) {
		if (show) {
			if (genTimer==null) {
				genTimer=setTimeout(function() {
					$("#flap_loading2").show();
					$(".reg_row1").hide();
				},500);
			}
		} else {
			if (genTimer!=null) {
				clearTimeout(genTimer);
				$("#flap_loading2").hide();
				$(".reg_row1").show();
				genTimer=null;
			}
		}		
	}
	
	my.blockOrUnblockSearch = function() {
		var block=false;
		$(".stopIcon:visible").each(function(){
			if ($(this).attr("src").indexOf("no")>0) {
				block=true;
			}
		});
		
		if ($(".courseDiv").length>1 && !block) {
			$("#do_search").prop("disabled",false).attr("title",i8n.generateSchedulesTitle);
			$(".link_results").css("cursor","pointer").attr("onclick","UU.caseViewResults();").attr("title",i8n.gotoAddCoursePage);
		} else {
			var msg = (block?i8n.addressProblems:i8n.addOneMoreCourse);
			$("#do_search").prop("disabled",true).attr("title",msg);
			$(".link_results").css("cursor","not-allowed").attr("onclick","javascript:void(0);").attr("title",msg);
		}
		
	}
	
	function renderCodeNumberFilter(cnf,firstInReq,lastInReq) {
		
		var cnPro=cnf.cnPro;
		var cn=cnPro.cn;
		var $clone=null;
		var isNew=true;
		var globalFilterOk=(cnPro.stoptext.indexOf("selAddCam")>=0);
		
		function domChecksToCodeNumberFilter() {
			var sa=cnf.sa;
			if (sa==null) sa="";
			$clone.find(".class_chk").each(function() {
				var cfsi=$(this).data("cfsi");
				while (sa.length<cfsi) {
					sa+="l";
				}
				var v=$(this).prop("checked");
				var c=(v?"l":"i");
				if (sa.charAt(cfsi)!=c) {
					sa = sa.substr(0, cfsi) + c + sa.substr(cfsi+1);
				}
			});
			UU.caseChangeSelectionMask(cnf,sa);
		}
		function selectAllNone(isAll) {
			$clone.find(".class_chk").prop("checked",isAll);
			domChecksToCodeNumberFilter();
		}
		// See if course already in DOM
		$(".class_code").each(function() {
			if ($(this).data("id")==cnf.cnKey) {
				$clone=$(this).parents(".requirementDiv");
				isNew=false;
			}
		});
		
		// Clone Course Template if it wasn't in the DOM
		if ($clone==null) {
			$clone = $("#templateCourse").clone();
		}
		
		function renderDropdown() {
			var animate=true;
			var $ds=$clone.find(".dropdownSelect")
			if ($ds.val()!=cnf.drop) {
				$ds.val(cnf.drop);
				if ($ds.val()!=cnf.drop) {
					
					// May happen if "kp_" (keeps) in URL and logout.
					var try2=false;
					if (cnf.drop.indexOf("kp_")==0 || cnf.drop.indexOf("dp_")==0) {
						var d2="us_"+cnf.drop.substr(3);
						$ds.val(d2);
						if ($ds.val()==d2) {
							cnf.drop=d2;
							try2=true;
						}
					}
					
					if (!try2) {
						RR.addBadWarning(i8n.requestedClassNotOffered);
						cnf.drop="al";
						$ds.val("al");
					}
					
				}
				animate=false;
			}
			var speed = (animate?300:0);
			var $item=$clone.find(".dropDownText");
			if (cnf.drop=="ss") {
		    	$item.slideDown(speed);
		    } else {
		    	$item.slideUp(speed);
		    }
			// see isPinned function
			var pin=(cnf.isPinned());
			$clone.find(".dropdownPinImg").toggle(pin);
		}
		
		function renderWarnings() {
			// Update warnings
			if (cnPro.warnings.length>0) {
				var w="";
				for (var i=0;i<cnPro.warnings.length;i++) {
					if (i>0) w+="<br/>";
					w+=cnPro.warnings[i];
				}
				$clone.find(".warningMessage").html(w);	
				$clone.find(".warningMessageDiv").show();	
			} else {
				$clone.find(".warningMessageDiv").hide();				
			}
		}
		
		// Called when user clicks "Show More"
		var showMore = function() {
			var $dt=$clone.find(".descText");
			$dt.hide();
			$clone.find(".lesslink").show();
			$dt.css("height","auto");
			$dt.slideDown(300,function() {
				// Just in case user clicks "less" then "more" fast.
				$dt.css("height","auto");
			});
			$clone.find(".no_reqs").show();
			$clone.find(".morelink").hide();
			
			// Change the dropdown value to "Specific Sections" if it exists.
			var d=$clone.find(".dropdownSelect").get(0);
			var haveSS=false;
			for (var k=0;k<d.options.length;k++) {
				if (d.options[k].value=="ss") {
					haveSS=true;
					break;
				}
			}
			if (haveSS && d.value=="al") {
				cnf.setDrop("ss");
				renderDropdown();
			}
			
			//if (tabbing) {
			//	$clone.find(".class_chk").first().focus();
			//}
		}
		$clone.find(".morelink").off().click(showMore);
		
		
		// Called when user clicks "Show Less"
		var showLess = function() {
			var $dt=$clone.find(".descText");
			$dt.animate({height:"15px"},250);
			$clone.find(".lesslink").hide();
			$clone.find(".morelink").show();
			$clone.find(".no_reqs").hide();
			
			// Change dropdown value to "Try All Classes" if all are selected when "Show less" is clicked.
			var d=$clone.find(".dropdownSelect").get(0);
			
			function isAllSelected($requirementDiv) {
				var boxes=$requirementDiv.find(".class_chk").length;
				var checked=$requirementDiv.find(".class_chk:checked").length;
				return (boxes==checked);
			}
			
			if (isAllSelected($clone) && d.value.indexOf("ss")==0) {
				cnf.setDrop("al");
				renderDropdown();
			}
			
			//if (tabbing) {
			//	$clone.find(".morelink").first().focus();
			//}
		}
		$clone.find(".lesslink").off().click(showLess);
		
		
		$clone.find(".ignore_check").off().change(function () {
			var ignore=!($(this).is(":checked"));
			if (ignore && cnf.drop.indexOf("kp_")==0) {
				var $dpOpt=$clone.find("select.dropdownSelect option[value^='dp_']");
				if ($dpOpt.length>0) {
					var dv=$dpOpt.val();
					cnf.setDrop(dv);
				}
			}
			if (!ignore && cnf.drop.indexOf("dp_")==0) {
				var $kpOpt=$clone.find("select.dropdownSelect option[value^='kp_']");
				if ($kpOpt.length>0) {
					var dv=$kpOpt.val();
					cnf.setDrop(dv);
				}
			}
			UU.caseChangeIgnore(cnf,ignore);
		}).prop("checked",!cnf.ignore);
		
		$clone.data("id",cnf.cnKey);
		$clone.removeAttr("id");
		
		if (cnf.reqId!=null) {
			$clone.addClass("has_reqId");
			if (!lastInReq) {
				$clone.addClass("not_last");
			}
			$clone.find(".requirementTitle").text(cnf.reqId);
		}
		$clone.find(".requirementHeader").toggle(firstInReq);
		
		// Fill in all the values
		$clone.find(".inputCourse").attr("value",cn.code+"-"+cn.number);
		var text = "View just " + cn.code + " " + cn.number;
		$clone.find(".campus").html(getDescribeCampuses(cnPro.ecams,60)); // TODO
		$clone.find(".selectMore").toggle(globalFilterOk);
		$clone.find(".faculty").html(cn.faculty);
		$clone.find(".viewButton").attr("alt",text).attr("title",text);
		$clone.find(".class_code").html(switchNameAndCode?course.title:cn.code+" "+cn.number);
		$clone.find(".class_code").data("id",cn.code+"-"+cn.number);
		$clone.find(".courseCode").html(cn.code+" "+cn.number);
		
		{
			var $cd=$clone.find(".courseDiv");
			// Remove old color
			if (!isNew) {
				var old=$cd.data("colorId");
				$cd.removeClass("bc"+old);
				$cd.removeClass("bd"+old);
				$clone.find(".morelink").removeClass("bc"+old);			
			}
			// Set the color
			var col=(cnf.drop.indexOf("dp_")==0||cnf.ignore)?0:cnf.color;
			$cd.data("colorId",col);
			$cd.addClass("bc"+col);
			$cd.addClass("bd"+col);
			$clone.find(".morelink").addClass("bc"+col);
		}
		
		var $wm=$clone.find(".warningMessageDiv");
		var warn="";
		if (cnPro.allFilterPassFull && cnPro.stoptext.length<=0) {
			warn=i8n.allsectionsAreFull;
		}
		
		if (warn.length>0) {
			$wm.find(".warningMessage").html(warn);
			$wm.show();
		} else {
			$wm.hide();
		}

		var $sm=$clone.find(".stopMessageDiv");
		var $icon = $sm.find(".stopIcon");
		if (cnPro.stoptext.length>0) {
			$sm.find(".stopMessage").html(cnPro.stoptext);
			$sm.find(".stopMessageList").html(cnPro.stoptext2);
			if ($clone.find(".class_cam_chk").length+$clone.find(".noentry").length==0 ||
				($clone.find(".noentry_hard").length==0 && $clone.find(".class_cam_chk:checked").length>0)
				) {
				
				$icon.attr("src","images/exclamation.gif");
			} else {
				$icon.attr("src","images/no_entry.gif");
			}
			$icon.toggle(!globalFilterOk);
			
			
			var selectMoreOpen=$clone.find(".class_cam_chk:not(:disabled):checked").length>0;
			
			$sm.toggle(!globalFilterOk || selectMoreOpen);
			
			$sm.find(".class_cam_chk").change(function(ev) {
				if ($(this).prop("disabled")) return;
				var cam = $(this).data("cam");
				var pos = $(this).is(":checked");
				UU.caseChangeCampusAmmend(cnf,cam,pos);				
			});
			
		} else {
			$sm.find(".stopIcon").attr("src","images/exclamation.gif");
			$sm.hide();
		}
		
		$clone.find(".class_name").html(switchNameAndCode?cn.code+" "+cn.number:cn.title);
		
		{
			var s="";
			if (cnf.enr) s="Enrolled";
			if (cnf.cart) s="In Shopping Cart";
			if (cnf.waiting) s="Wait Listed";
			$clone.find(".course_status").html(s);
			$clone.find(".course_status_cont").toggle(s.length>0);
		}
		
		var reqGs=cnPro.reqGs;
		
		if (reqGs.length==0) {
			$clone.find(".rdescDiv").hide();
		}
		
		for (var i=0;i<reqGs.length;i++) {
			var reqG=reqGs[i];
			var $dd=$clone.find(".rdescDiv").first();
			if (i>0) {
				$dd=$dd.clone();
				var $i=$clone.find(".rdescDiv:last");
				$dd.insertAfter($i);
			}
			if (reqG.desc2()=="None") {
				$dd.parent(".rdescDiv_cont").addClass(" no_reqs");
			}
			$dd.find(".rdesc").html(reqG.desc2());
			if (reqGs.length>1) {
				$dd.find(".rdesctitle").html(" (for "+reqG.name+" Classes)");
			}
			$dd.show();
		}

		if (cn.cldesc.length>0) {
			$clone.find(".cldesc").html(cn.cldesc);
			$clone.find(".cldescDiv").show();
		} else {
			$clone.find(".cldescDiv").hide();
		}
		
		if (cn.desc.length>0) {
			$clone.find(".desc").html(cn.desc);
			$clone.find(".descDiv").show();
		} else {
			$clone.find(".descDiv").hide();
		}
		
		var notes = cnPro.notes;
		var nh="";
		if (notes.length>0) {
			for (var ni=0;ni<notes.length;ni++) {
				//nh+="<span>"+ni+":"+notes[ni]+"</span><br/>";
				nh+=notes[ni]+"<br/>";
			}
			$clone.find(".rem").html(nh);
			$clone.find(".remDiv").show();
		} else {
			$clone.find(".remDiv").hide();
		}
		
		if (cn.desc.length<=0 && notes.length<=0 && cn.cldesc.length<=0) {
			$clone.find(".descText").hide();
		}
		
		// Apply Filter-sensitive items
		var ot=cnPro.filterPassOnlineTypes;
		
		// Update Periods dropdown
		{
			var $sp=$clone.find(".select_period");
			var nb=0;
			var h="";
			var hasNone=false;
			for (var pn in cnPro.pns) {
				if (pn=="") {
					hasNone=true;
					pn="&lt;None&gt;"
				}
				h+="<option value='"+pn+"'>"+i8n.period+" "+pn+"</option>";
				nb++;
			}
			if (nb<=1 && hasNone) {
				$sp.parent().remove();
			} else {
				h="<option value=''>"+i8n.allPeriods+" ("+nb+")</option>"+h;
				$sp.html(h).val(cnf.cpn);
				$sp.off().change(function() {
					UU.caseChangePeriod(cnf,$(this).val());
				});
			}
		}
		
		// Update Sections dropdown
		{
			var $sn=$clone.find(".select_usn");
			var sns=[];
			for (var sn in cnPro.sns) {
				sns.push(sn);
			}
			sns.sort();
			
			var h="";
			var nb=0;
			var hasNone=false;
			for (var i=0;i<sns.length;i++) {
				var sn=sns[i];
				if (sn=="") {
					hasNone=true;
					sn="&lt;None&gt;"
				}
				h+="<option value='"+sn+"'>Section "+sn+"</option>";
				nb++;				
			}
			
			if (nb<=1 && hasNone) {
				$sn.parent().remove();
			} else {
				h="<option value=''>"+i8n.allThe+" Sections ("+nb+")</option>"+h;
				$sn.html(h).val(cnf.csn);
				$sn.off().change(function() {
					UU.caseChangeSection(cnf,$(this).val());
				});
			}
		}
		
		// Update all Dropdown options
		var currDropVal=$clone.find("select.dropdownSelect").val();
		var $allOption=$clone.find("select.dropdownSelect option[value='al']");
		
		if (cnPro.nbPass>1) {
			$allOption.html(i8n.tryAllClasses+ " ("+cnPro.nbPass+")");
		} else if (cnPro.nbPass==1) {
			$allOption.html(i8n.tryOnlyClass);
		} else {
			$allOption.html(i8n.noApplicableClasses);
		}
		
		if (cnf.enr.length>0 || cnf.cart.length>0) {
			$clone.find("select.dropdownSelect option[value^='kp_']").remove();
			$clone.find("select.dropdownSelect option[value^='dp_']").remove();
			for (var i=0; i<cn.usels.length; i++) {
				var usel=cn.usels[i];
				for (var j=0; j<usel.sels.length; j++) {
					var sel=usel.sels[j];
					if (sel.key==cnf.enr) {
						$allOption.before("<option value=\"kp_"+sel.key+"\">"+(cnf.waiting?i8n.stayWaitlistedIn:i8n.stayEnrolledIn)+" "+sel.disp+"</option>")
						$allOption.before("<option value=\"dp_"+sel.key+"\">"+i8n.dropCourse+"</option>")
					}
					else if (sel.key==cnf.cart) {
						$allOption.before("<option value=\"kp_"+sel.key+"\">"+i8n.keep+" "+sel.disp+" "+i8n.inShoppingCart+"</option>")
					}
				}
			}
			if (currDropVal.indexOf("kp_")==0 || currDropVal.indexOf("dp_")==0) {
				$clone.find("select.dropdownSelect").val(currDropVal);
			}
		}
		
		if (showOnlineDropdown) {	
			// We have to do it this way because display:none doesn't work for options in IE.
		
			//var allNoTry=$allOption.html().replace("Try","").trim();
			//allNoTry=allNoTry.charAt(0).toUpperCase()+allNoTry.slice(1);
			//$allOption.html(allNoTry); // KCTCS - for consistency with others
			
			{
				var $o=$clone.find("select.dropdownSelect option[value='ld']");
				if (ot.indexOf("l")<0 || ot.length<=1) {
					$o.remove();
				} else{
					if ($o.length<1) {
						$allOption.after("<option value=\"ld\">"+i8n.learnOndemanClassesOnly+"</option>");
					}
				}
			}
			
			{
				var $o=$clone.find("select.dropdownSelect option[value='oo']");
				if (ot.indexOf("o")<0 || ot.length<=1) {
					$o.remove();
				} else{
					if ($o.length<1) {
						$allOption.after("<option value=\"oo\">"+i8n.onlineClassesOnly+"</option>");
					}
				}
			}
			
			{
				var $o=$clone.find("select.dropdownSelect option[value='oc']");
				if (ot.indexOf("c")<0 || ot.length<=1) {
					$o.remove();
				} else{
					if ($o.length<1) {
						$allOption.after("<option value=\"oc\">"+i8n.onCampusClassesOnly+"</option>");
					}
				}
			}
		}
		
		// Update display of selections in the drop-down
		var $after=$clone.find("select.dropdownSelect option[value='ss']");
		var onlyOne=false;
		var removedOption=false;
		if ($after.length==0 && cnf.drop.indexOf("us_")==0) {
			// hideSpecificSectionSelection is true, so work around it
			// when a specific selection is still chosen.
			$after=$allOption;
			onlyOne=true;
		} else if ($after.length==0) {
			// hideSpecificSectionSelection is true and no pin
			//$clone.find("select option[value^='us_']").remove(); // Should we remove it? debatable.
			removedOption=true;
		}
		
		if ($after.length>0) {
			for (var i=0; i<cnPro.uselPros.length; i++) {
				var uselPro=cnPro.uselPros[i];
				
				var selkey=uselPro.usel.sels[0].key; // default
				
				var onlyOneSuccess=false;
				var subName=""; // Useful if user adds CRN for non-selected campus
				var selPro=uselPro.usel.isKeyMatch(cnf.drop.substr(3));
				if (selPro!=null) {
					//course.drop="us_"+usel.key;
					// Change select dropdown to use sel key instead of usel key 
					selkey=cnf.drop.substr(3);
					if (onlyOne) {
						onlyOneSuccess=true;
						subName=selPro.sel.disp;
					}
				}
				
				if ((!onlyOne && uselPro.filterPass) || onlyOneSuccess) {
					var name=uselPro.disp;
					if (name=="") {
						name=subName;
					} else if (uselPro.allFilterPassFull) {
						name+=" (Full)";
					}
					// Make sure it's there
					var $op=$clone.find("select.dropdownSelect option[value='us_"+selkey+"']");
					if ($op.length==0) {
						// Not there. Add it after the item already found.
						$after.after("<option value=\"us_"+selkey+"\">"+name+"</option>");
						$after=$after.next();
					} else {
						// There. Make sure the name is up to date because campus filter may change it.
						if ($op.html()!=name) {
							$op.html(name);
						}
						// Make sure future items are added after it.
						$after=$op;
					}
				} else {
					// Make sure it's not there
					$clone.find("select.dropdownSelect option[value='us_"+selkey+"']").remove();
				}
			}
			
			
			// Update display of selections in checkboxes
			
			var asels=new Array();
			var cfsi=0;
			for (var i=0; i<cnPro.uselPros.length; i++) {
				var uselPro=cnPro.uselPros[i];
				for (var seli=0; seli<uselPro.selPros.length; seli++) {
					var selPro=uselPro.selPros[seli];
					if (selPro.filterPass) {
						selPro.cfsi=cfsi;
						asels.push(selPro);
					}
					cfsi++;
				}
			}
			// Sort alphabetically
			asels.sort(function(a,b){
				if (a.sel.usn>b.sel.usn) {
					return 1;
				} else if (a.sel.usn<b.sel.usn) {
					return -1;
				} else if (a.sel.disp>b.sel.disp) {
					return 1;
				} else if (a.sel.disp<b.sel.disp) {
					return -1;
				}
			});
			
			
			var s="";
			var cfsi=0;
			var rand=(""+Math.random()).replace(".","");
			for (var aseli=0; aseli<asels.length; aseli++) {
				var selPro=asels[aseli];
				var cfsi=selPro.cfsi;
				s+="<label for=\""+cfsi+"-"+rand+"\"><span class=\"spec_sec\" onselectstart=\"return false;\">";
				s+="<input id=\""+cfsi+"-"+rand+"\" class=\"class_chk\" type=\"checkbox\"";
				if (selPro.selected) {
					s+=" checked";
				}
				s+=" data-cfsi=\""+cfsi+"\">";
				s+="<span style=\"cursor:default;\">";
				
				if (!selPro.sel.onCampus) {
					s+="<img alt=\"Class is Online\" title=\""+i8n.calssIsOnline+"\" src=\"images/online.gif\" width=\"18\" height=\"18\" align=\"top\"/> ";
				}

				var sel=selPro.sel;
				var toD=sel.disp;
				if (sel.usn!=null && sel.usn.length>0) {
					if (sel.disp.indexOf(i8n.period+" ")>=0 && sel.disp.indexOf(":")>=0) {
						toD=sel.disp.replace(":",": Section "+sel.usn+":");
					} else {
						toD="Section "+sel.usn+": ";
					}
				}
				s+=toD;
				
				
				s+="</span>";
				if (sel.full) {
					s+="<span style=\"color:#CC0000\" title=\""+i8n.classFull+"\"> (Full)</span>";
				}
				
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
					s += "<div class='course_status_cont course_status_cont_inline'><span class='course_status'>"+es+"</span></div>";
				}
				
				s+="&nbsp;&nbsp;</span></label>";
				cfsi++;
			}
			
			// Only show "Select All / Select None" if there are more than 1 items to select from
			if (cfsi>=2) {
				s+="<div class=\"spec_sec_title\">";
				s+="<a ";
				s+="title=\""+i8n.enterToSelect+"\" href=\"javascript:void(0)\" class=\"a selectAll\"";
				s+=">"+i8n.selectAll+"</a>";
				s+=" / ";
				s+="<a ";
				if(BB.access) {
					s+="title=\""+i8n.enterToDeselect+"\"";
				}			
				s+="title=\""+i8n.enterToDeselect+"\" href=\"javascript:void(0)\" class=\"a selectNone\"";
				s+=">"+i8n.selectNone+"</a>";
				s+="</div>";
			}
			//$clone.find(".spec_sec_title").after(s);
			var $cb=$clone.find(".class_checkboxes");
			$cb.empty();
			$cb.append(s);
			

			
			$cb.find(".class_chk").off().click(function(ev) {
				var $t=$(ev.target);
				var cfsi=$t.data("cfsi");
				domChecksToCodeNumberFilter();
			});
			

			$cb.find(".selectAll").off().click(function () {
				selectAllNone(true);
				return false;
			});
			$cb.find(".selectNone").off().click(function () {
				selectAllNone(false);
				return false;
			});
			
			
			$clone.find(".spec_sec_title").toggle(s.length>0);
		} // end - only if hideSpecificSectionSelection is false
		
		if (isNew) {
			$clone.appendTo("#requirements");
			$clone.find(".inputCampusAmmendments").val(cnf.ca);
		}
		
		var dropChanged=false;
		var $select=$clone.find(".dropdownSelect");
		$select.off().change(function() {
			UU.caseChangeDropdown(cnf,$(this).val());
		});
		
		if ($select.val()!=cnf.drop || removedOption) {
			dropChanged=true;
		}
		
		renderDropdown();
		renderWarnings();
		if (isNew) {
			$clone.slideDown(400);
		} else {
			$clone.show();
		}
		
	}
	
	
	function renderCodeNumberFilters(gState) {
		
		// Remove CodeNumberFilters that are in DOM but no longer in list
		$(".requirementDiv:visible").each(function() {
			var cnKey=$(this).data("id");
			var has=false;
			for (var i=0;i<gState.cnfs.length;i++) {
				var cnKey2=gState.cnfs[i].cnKey;
				if (cnKey==cnKey2) has=true;
			}
			if (!has) {
				$(this).hide(400, function() {
					$(this).remove();
				});
			}
		});
		
		// Refresh/Add CodeNumberFilters in the list
		for (var i=0;i<gState.cnfs.length;i++) {
			var cnf=gState.cnfs[i];
			var first=(cnf.reqId!=null);
			if (i>0 && cnf.reqId==gState.cnfs[i-1].reqId) first=false;
			var last=(cnf.reqId!=null);
			if (i+1<gState.cnfs.length && gState.cnfs[i+1].reqId==cnf.reqId) last=false;
			renderCodeNumberFilter(cnf,first,last);
		}
		
	}
	
	function renderTerm(gState) {
		$("#term_"+gState.term).prop("checked",true);
		gState.term = gState.term || 0;
		if (gState.term==0) $(".termRadio").prop("checked",false);
		$("#phone_term_select").val(gState.term);
	}
	
	my.renderAddCoursesPage = function(gState) {
		renderTerm(gState);
		renderCodeNumberFilters(gState);
		
		
		var isTerm=(gState.term!=null && gState.term!=0)
		msExpandible("collegeSelector",isTerm);
		msExpandible("campusSelector",isTerm);
		msExpandible("locationSelector",isTerm);
		
		// Apply overrides
		disableEnroll=$(".termRadio:checked").data("denroll");
		disableCart=$(".termRadio:checked").data("dcart");
		$(".hideIfDisableEnroll").toggle(!disableEnroll && (typeof custViewMyClassSchedule == "function"));
		$(".hideIfDisableCart").toggle(!disableCart && (typeof custViewMyShoppingCart == "function"));
	}
	
	my.highlightClass = function(id,state) {
		//if (state) {
		//	$(".bc"+id).addClass("bl"+id);
		//} else {
		//	$(".bc"+id).removeClass("bl"+id);
		//}
	}
	
	my.renderSort = function(newSort) {
		Profiler.setParameterState(translateSortToParameter(BB.activeState.sort), false);
		Profiler.setParameterState(translateSortToParameter(newSort), true);

		// Set mobile and set desktop
		var $m=$("#"+newSort+"mobile");
		$m.prop("checked",true);
		$("#sort_by").val(newSort);
	}
	
	my.renderFilter = function() {
		var f = BB.activeState.filters;
		function apply(el,v) {
			$("#"+el).prop("checked",!v);
			$("#"+el+"mobile").prop("checked",!v);			
		}
		apply("hide_full",f.hideFull);
		apply("hide_waitlistable",f.hideWaitlistable);
		apply("hide_online",f.hideOnline);
		apply("hide_on_campus",f.hideOnCampus);
		apply("hide_closed",f.hideClosed);
		apply("hide_no_honors",!f.hideNoHonors);
		apply("hide_honors",!f.hideHonors);
	}
	
	my.popNotice = function(noticeHtml,buttons) {
		$("#popupNoticeText").html(noticeHtml);
		if (buttons) {
			var h="";
			for (var i=0;i<buttons.length;i++) {
				var b=buttons[i];
				h+="<input type='button' class='big_button pbut"+i+"' value='"+b.name+"'/> ";
			}
			var $b=$("#popupNoticeButtons");
			$b.html(h);
			for (var i=0;i<buttons.length;i++) {
				$b.find(".pbut"+i).click(buttons[i].action);
			}
		}
		popupNotice.open();
	}
	
	return my;
}());


var BUBBLES = (function() {
	var lastBubble=null;
	var my={};
	var campusStepShown=false;
	var numbersDone=false;
	
	function updateBubbleNumbers() {
		if (numbersDone) return;
		var nb=1;
		// Are we using step 1? (term)
		if ($(".termRadio").length<=1) nb--;
		$(".bubbleNb1").html(nb);
		// Are we using step 2a? (campus)
		if ($("#locationRegion").length<=0 || preopenCampusSelector) nb--;
		$(".bubbleNb2a").html(++nb);
		$(".bubbleNb2").html(++nb);
		$(".bubbleNb3").html(++nb);
		numbersDone=true;
	}
	
	my.skipCampusStep = function() {
		campusStepShown=true;
	}
	
	var getAppropriateBubble = function() {
		if ($(".course_status_cont:visible").length>0) {
			return "-1";
		}
		if ($(".termRadio:checked").length<=0) {
			return "1";
		}
		if ($(".courseDiv").length>1) {
			return "3";
		}
		if ($("#locationRegion:visible").length>0) {
			if (!campusStepShown) return "2a";
			return "2";
		}
		return "2";
	}
	
	var hideAllBubbles = function() {
		lastBubble="-1";
		setBubble("1",false,true);
		setBubble("2a",false,true);
		setBubble("2",false,true);
		setBubble("3",false,true);
	}
	
	var setBubble = function(bubble,show,instant) {
		
		if (bubble=="-1" && !show) {
			hideAllBubbles();
		} else if (bubble=="1") {
			if (show) {
				$("#step1bubble").fadeIn((instant?0:1300));
			} else {
				$("#step1bubble").fadeOut((instant?0:1300));
			}
		} else if (bubble=="2a") {
			if (show) {
				var left=50;
				$(".ms_select_link").each(function() {
					var l=$(this).position().left+$(this).width();
					if (l>left) left=l;
				});
				$("#step2abubble").css("left",(left+20)+"px");
				$("#step2abubble").fadeIn((instant?0:1000));
			} else {
				$("#step2abubble").fadeOut((instant?0:1300));
			}
		} else if (bubble=="2") {
			if (show) {
				var $s2b=$("#step2bubble");
				$s2b.show((instant?0:500));	
			} else {
				$("#step2bubble").hide((instant?0:500));
			}
		} else if (bubble=="3") {
			if (show) {
				$("#step3bubble").show((instant?0:600));
			} else {
				$("#step3bubble").hide((instant?0:500));
			}
		}
	}

	var showTheRightBubble = function() {
		if (BB.access) {
			if (lastBubble!="-1") {
				hideAllBubbles();
			}
			return; // Do not show any bubbles in accessibility mode!
		}
		
		var ab=getAppropriateBubble();
		if (lastBubble==ab) {
			return;
		}
		
		var instant=isMobile();
		setBubble(lastBubble,false,instant);
		setBubble(ab,true,false); 
		
		$(".mobileRoom").toggle(ab=="1" || ab=="2a");
		
		// Focus on Select... item when user is directed to it.
		if (ab=="2a") {
			var $l=$(".ms_select_link:visible");
			if ($l.length>=1) {
				$l[0].focus();
			}
		}
		
		// Focus on "Select Course" when appropriate
		if (ab=="2") {
			$e("code_number").focus();
		}
		
		lastBubble=ab;
	}
	
	my.update = function(instant) {
		updateBubbleNumbers();
		showTheRightBubble();
		RR.blockOrUnblockSearch();
	}
	
	return my;
}());


function initCriteria() {
	
	$.ajaxSetup({ cache: false });
    var options_xml = {
        script: "add_suggest.jsp",
        varname: "course_add",
        offsety: -2,
        json: false,
        cache: false,
        showResults: autoCompleteSize,
        timeout: 2000000,
        minchars: 1,
        onaction: function() {updateStepBoxes(false);}
    };
    AutoSuggest.init(options_xml);
    
    if (vsbDatabase) {
    	Profiler.init([]);
		Profiler.recording = true;
		Profiler.activateAllParameters();
    }

	$("#addCourseButton").click(function(){
		UU.caseAddCourse($("#code_number").val());
		$("#code_number").val("");
	});
	
	$("#code_number").keyup(function(e){
	    if(e.keyCode == 13) {
	    	UU.caseAddCourse($("#code_number").val());
	    	$("#code_number").val("");
	    }
	});
	

	if (history.pushState) {
		$(window).on("popstate", function() {
			UU.caseBackButton();
		});
	}
	
	$(".plusBox").click(function() {
		BUBBLES.skipCampusStep();
		BUBBLES.update(false);
	});
	
	$("#locationRegion").click(function(){
		BUBBLES.update(false);
	});
	
	if (preopenCampusSelector && $(".termRadio:checked").length>0) {
		$("#camSelector").show();
		BUBBLES.update(false);
	}
	
	// Results Page Stuff
	$(".basic").selectOrDie();
	 
	$("#custom").click(function() { // Mouse over
		if($(this).hasClass('cliked')) { // TODO
			$('body').removeClass('nobg');
			$("#custom").parents().siblings().css('opacity','1');
			$(this).removeClass('clicked');
		} else {
			$('body').addClass('nobg');
			$(this).addClass('clicked');
			$(this).parents().siblings().css('opacity','0.1');
		}
	});
	 
	$(".sod_option").click(function() {
		$('body').removeClass('nobg');
		$("#custom").parents().siblings().css('opacity','1');
	});
	 
	$(document).click(function(ev) {
		$('body').removeClass('nobg');
		$("#custom").parents().siblings().css('opacity','1');
		
		// Hide main menu if user clicks other than on menu
		if ($(ev.target).parents(".main_menu").length<=0) {
			$(".main_menu").hide();
			$(".mi_message_box").hide();
		}
	});
	
	// Timezone
	{
		var $tz=$("#mytimezone");
		$tz.empty();
		for (var i=0;i<timezones.length;i++) {
			var t=timezones[i];
			$tz.append("<option value='"+t.id+"'>"+t.name+"</option>");
		}
		$tz.change(function () {
			UU.caseChangeTimezone($tz.val());
		});
		var tz=getTimezone();
		$tz.val(tz);
	}
	
	
	document.onkeydown = function(event) {
		var keyID;
		if (window.event) {
			keyID=window.event.keyCode;
		}
		else {
			keyID=event.which;
		}
		if (keyID==37) {
			UU.casePrevResult();
		}
		else if (keyID==39) {
			UU.caseNextResult();
		}
		else if (keyID==9) {
			// TAB
			tabbing=true;
		}
		else if (keyID==18) {
			// Alt
			tabbing=true;
		}
	};
	
	// init functions should only be called once:
	PAGES.initPages();
	DRAGGING.dragInit();
	MENU.initMenu();
	popupsort(); 
	popupfilter();
	popupnotice();

}




function initMultiselectors() {

    // Initialize College MultiSelector
    var m1callback = function(noChecking) {
    	for (var i=0;i<mscams.length;i++) {
    		var col=mscams[i].obj1;
    		for (var j=0;j<mscols.length;j++) {
    			if (mscols[j].text==col) {
    				var oldShow=mscams[i].show;
    				mscams[i].show=mscols[j].checked;
    				if (!oldShow && mscams[i].show && !noChecking) {
    					mscams[i].checked=true;
    				}
    			}
    		}
    	}
    	msRefresh("campusSelector");
        m2callback();
    	applyCampusFilterChange();
    }
    m1callbackGo=m1callback;
    var m1Params={textAll:"All", textNone:i8n.none, textListTitle:i8n.colleges, textBoxTitle:"", columns:2};
    var m1 = new Multiselect("collegeSelector",m1Params,mscols,m1callback);
    msExpandible("collegeSelector",false);
    
    // Initialize Campus MultiSelector
    var m2callback = function() {
    	// Flag all locations to not show
    	for (var i=0;i<mslocs.length;i++) {
    		mslocs[i].obj1=false;
    	}

    	// Flag locations that are part of the selected
    	// campuses to show
    	for (var i=0;i<mscams.length;i++) {
    		if (!mscams[i].show || !mscams[i].checked) continue;
    		var locs=mscams[i].obj2; // Get campus location array
    		for (var j=0;j<locs.length;j++) {
    			var loc=locs[j];
            	for (var k=0;k<mslocs.length;k++) {
            		if (mslocs[k].value==loc) {
            			mslocs[k].obj1=true;
            			break;
            		}
            	}
    		}
    	}

    	// Set locations to show, and if they're showing
    	// for the first time now, set them to be checked
    	for (var i=0;i<mslocs.length;i++) {
    		if (mslocs[i].obj1) {
    			if (!mslocs[i].show) {
    				mslocs[i].checked=true;
    			}
    			mslocs[i].show=true;
    		} else {
    			mslocs[i].show=false;
    		}
    	}


    	msRefresh("locationSelector");
    	applyCampusFilterChange();
    }
    var allSense=i8n.all+" (%n)";
    if ($("#collegeSelector:visible").length>0) {
    	allSense=i8n.allWithinColleges;
    }
    var m2Params={textAll:allSense, textNone:i8n.none, textListTitle:i8n.campuses, textBoxTitle:"", columns:2, 
    	textNoneVisible:i8n.collegeMustSelectFirst,
    	textSelectAll: "<span class=\"accessOffOnly\">"+i8n.selectAll+"</span><span class=\"accessOnly\">"+i8n.selectAllCampuses+"</span>",
    	textSelectNone: "<span class=\"accessOffOnly\">"+i8n.selectNone+"</span><span class=\"accessOnly\">"+i8n.deselectAllCampuses+"</span>",
    	textSelectTitle: i8n.toggleCampusSelector,
    	textCloseTitle:i8n.hideCampusSelector,
    	textSelectShow: "<span class=\"accessOffOnly\">"+i8n.select+"</span><span class=\"accessOnly\">"+i8n.showCampusSelector+"</span>",
    	textSelectHide: "<span class=\"accessOffOnly\">"+i8n.select+"</span><span class=\"accessOnly\">"+i8n.hideCampusSelector+"</span>"
    };
    var m2 = new Multiselect("campusSelector",m2Params,mscams,m2callback);
    msExpandible("campusSelector",false);

    // Initialize Location MultiSelector
    var m3callback = function() {
    	applyCampusFilterChange();
    }
    var m3Params={textAll:i8n.allNWithin,  textNone:i8n.none, textListTitle:i8n.locations, textBoxTitle:"", textNoneVisible:i8n.campusMustBeSelectedFirst};
    var m3 = new Multiselect("locationSelector",m3Params,mslocs,m3callback);
    msExpandible("locationSelector",false);

}

function doInitialCampusSelection(gState) {
	
    // Set initial location select
    var locs=gState.locs;
    
	var cams={};
	// Get enrolled Campuses
	for (var c=0;c<gState.cnfs.length;c++) {
		var cnf=gState.cnfs[c];
		var selPro=cnf.getEnrolledSelPro();
		if (selPro==null) {
			selPro=cnf.getCartSelPro();
			if (selPro==null) {
				continue;	
			}
		}
		for (var k=0; k<selPro.sel.classes.length; k++) {
			var cls=selPro.sel.classes[k];
			cams[cls.campus]=true;
		}
	}
	
	//var cams="GTW_GTWB_"; // Test
	//var defaultCollege="ASHLAND COMMUNITY AND TECHNICAL COLLEGE"; // Test
	
	// Add campuses belonging to the default college selection
	for (var i=0;i<mscams.length;i++) {
		var mscam=mscams[i];
		if (mscam.obj1==defaultCollege) {
			cams[mscam.value]=true;
		}
	}

	// Add current campuses (gState.cams)	
	for (var c in cams) {
		gState.cams[c]=true;
	}
	
    // Set selected colleges based on the campuses.
	selectCollegesBasedOnCampuses(gState.cams);
	
	if (m1callbackGo!=null) {
		m1callbackGo(true);
	}
	
    // If the Location Selector is hidden, then always have all locations selected.
    var locationSelectorVisible=($("#locationSelector:visible").length>0);
    if (locationSelectorVisible) {
        // Set initial locations selection
        if (!("any" in locs)) {
            for (var i=0;i<mslocs.length;i++) {
            	var msloc=mslocs[i];
            	if (!(msloc.value in locs)) {
            		msloc.checked=false;
            	}
            }
            msRefresh("locationSelector");
            m3callback();
        }
    } else {
    	gState.locs["any"]=true;
	}
    
}


function selectCollegesBasedOnCampuses(cams) {
    for (var i=0;i<mscams.length;i++) {

    	var ccc=mscams[i].value.split("_"); // A single multiselect may represent more than one campus (for "Others")
    	var c=true;
    	for (var i2=0;i2<ccc.length;i2++) {
    		var ccci=ccc[i2];
    		if (!(ccci in cams)) {
    			c=false;
    		}
    	}
    	mscams[i].checked=c;
    	if (c) {
    		for (var j=0;j<mscols.length;j++) {
    			if (mscols[j].text==mscams[i].obj1) {
    				mscols[j].checked=true;
    			}
    		}
    	}
    }

    // If the College Selector is hidden, then always have all colleges selected.
	if ($("#collegeSelector:visible").length==0) {
		for (var j=0;j<mscols.length;j++) {
			mscols[j].checked=true;
		}
	}
}

function applyCampusFilterChange() {
	var origC=BB.activeState.cams;
	var c={};
	for (var i=0;i<mscams.length;i++) {
		var mscam=mscams[i];
		if (mscam.show && mscam.checked) {
			c[mscam.value]=true;
		}
	}
	
	var origL=BB.activeState.locs;
	var l={};
	var oneOrMoreNotChecked=false;
	for (var i=0;i<mslocs.length;i++) {
		var msloc=mslocs[i];
		if (msloc.show) {
			if (msloc.checked) {
				l[msloc.value]=true;
			} else {
				oneOrMoreNotChecked=true;
			}
		}
	}
	if (!oneOrMoreNotChecked) {
		l["any"]=true;
	}
	
	if (sameContents(origC,c) && sameContents(origL,l)) return;
	UU.caseChangeFilter(c,l);
}

function getDescribeCampuses(cams,maxLength) {
	var names=new Array();
	var len=0;
	for (var c in cams) {
		var name=camToName(c);
		len+=name.length;
		if (names.length>0) len+=2; // account for comma
		if (len>maxLength) break;
		names.push(name);
	}
	
	var s="";
	var others=cams.length-names.length-1;
	for (var i=0; i<names.length; i++) {
		if (i>0 && i+1==names.length && others==0) {
			s+="and ";
		}
		s+=names[i];
		if (i+1<names.length) {
			s+=", ";
		}
	}
	if (others>0) {
		if (names.length>=1) {
			s+=","+i8n.and + others + i8n.others;
		} else {
			s+=others + i8n.campusesLC;
		}
	}
	return s;
}


function popupsort() {
	var popup = $('#popup').popup({
		width : 250,
		height : 300,
		left : '20%'
	});
	$('#forsort').click(function() {
		popup.open();
	});
	$(".popup-body input[name='sb'],.popupl-overlay").click(function() {
		popup.close();
	});
}

function popupfilter() {
	var popup = $('#popupfilter').popup({
		width : 250,
		height : 300,
		left : '20%'
	});
	$('#forfilter').click(function() {
		popup.open();
	});
	$(".closefitler , .popupl-overlay").click(function() {
		popup.close();
	});
}

function popupnotice() {
	popupNotice = $('#noticePopup').popup({
		width : 250,
		height : 300,
		left : '20%'
	});
	$(".closefitler , .popupl-overlay").click(function() {
		popupNotice.close();
	});
}


function getNoResultsIdea(gState) {
	
	for(var i=0;i<gState.cnfs.length;i++) {
		var cnf=gState.cnfs[i];
		if (cnf.drop.indexOf("dp_")==0 || cnf.ignore) continue;
		if (cnf.sa.length>0 && cnf.sa.indexOf("l")<0) {
			return i8n.s("noClassesSelected",cleanCnKey(cnf.cnKey));
		}
	}
	
	
	var f=gState.filters;
	if (f.hideOnline && f.hideOnCampus) {
		return i8n.tipUncheckOnlineOnCampusClasses;
	}
	if (f.hideNoHonors && f.hideHonors) {
		return i8n.bothHonorsNHonors;
	}
	if (f.hideNoHonors) {
		return i8n.noMoreHonors;
	}
	
	var hasDropWith = function(prefix) {
		for(var i=0;i<gState.cnfs.length;i++) {
			if (gState.cnfs[i].drop.indexOf(prefix)==0) return true;
		}
		return false;
	}
	
	if (f.hideOnline && hasDropWith("oo")) {
		return i8n.tipCheckOnlineClassesOnly;
	}
	if (f.hideOnCampus && hasDropWith("ld")) {
		return i8n.tipLearnOnDemandClassesOnly;
	}
	if (f.hideOnCampus && hasDropWith("oc")) {
		return i8n.tipOnCampusClassesOnly;
	}
	var nbPins=gState.nbOfPins();
	if (nbPins>0) {
		var s="";
		if (nbPins==1) {
			s+=i8n.pinnedDownClass;
		} else {
			s+=i8n.youPinnedDown + nbPins + i8n.classesThatAre;
		}
		if (gState.reasons.reasonPins) {
			s+=i8n.overlappingTimes
		} else if (f.hideFull) {
			if (f.hideOnline) {
				s+=i8n.fullOrOnline;
			} else if (f.hideOnCampus) {
				s+=i8n.fullOrOnCampus;
			}
		} else {
			if (f.hideOnline) {
				s+=i8n.probablyOnline;
			} else if (f.hideOnCampus) {
				s+=i8n.probablyOnCampus;
			}
		}
		s+= i8n.changeSheduleFilter+ " <span>"+i8n.removethepins+"</span>";
		return s;
	}
	return "";
}

function renderResult() {
	
	var gState=BB.activeState;
	if (gState.sortedFilteredResults.length<=0) {
		drawNoResults(gState);
		return;
	}
	
	$(".reg_row2").show();
	var nb=BB.activeState.sortedFilteredResults.length;
	if (BB.r<0 || BB.r>=nb) {
		BB.r=0;
	}
	
	$(".resultMax").html(nb);
	$(".resultIndex").html((nb==0?0:BB.r+1));
	
	var result=BB.activeState.sortedFilteredResults[BB.r];
	
	if (legend==null) {
		legend = new Legend(".legend_box");
	}
	if (schedule==null) {
		schedule = new Schedule(".reg_schedule1",true,true,true,true,true);
	}
	if (schedule2==null) {
		schedule2 = new Schedule(".reg_schedule2",true,true,true,false,true);
	}
	var dualSchedule=false;
	
	if (gState.outdated) {
		var dDivide=false;
		if ($(".reg_schedule2").length>0) {
			var $r=$(".termRadio:checked");
			var d1=$r.data("start");
			var d2=$r.data("end");
			var ymd1=new YearMonthDay(d1);
			var ymd2=new YearMonthDay(d2);
			if (ymd1.y!=ymd2.y) {
				// Dual Schedule!
				dualSchedule=true;
				var nextYear=ymd1.y+1;
				var c=yearMonthDayToCode(nextYear,0,1);		
				dDivide=c;
				schedule2.setSize(gState.cnfs,dDivide);
				dDivide--; // last Day of year
				$(".reg_schedule").addClass("dual_schedule");
				$(".reg_schedule2").show().addClass("using");
			} else {
				// Single Schedule
				$(".reg_schedule").removeClass("dual_schedule");
				$(".reg_schedule2").hide().removeClass("using");
			}
		}
		
		schedule.setSize(gState.cnfs,dDivide);
	}
	
	schedule.draw(result,gState);
	if ($(".reg_schedule2").hasClass("using")) {
		schedule2.draw(result,gState);
	}
	// The legend should be drawn after so that a couple BB vars get passed.
	legend.draw(gState,result,gState);
	gState.bbsOutdated=false;
	gState.outdated=false;
	Profiler.recordHit("scheduleFlips");
}

function renderFavorites() {
	
	if ($("#page_favorites").length<=0) {
		return;
	}
	
	if (previewSchedule==null) {
		previewSchedule = new Schedule(".preview_schedule",true,false,false,true,false);
	}
	
	$.getJSON("api/savedSchedulesList", function(data) {
		
		var h="";
		for (var i=0;i<data.length;i++) {
			h+="<div class=\"thumbContainer\"><div class=\"thumbnail_mask\" id=\"delete_btn"+i+"\"></div><canvas class=\"thumbnail\" id=\"thumbtest_"+i+"\" width=\"100\" height=\"100\"></canvas></div>";
		}
		$(".thumbnail_window").html(h);
		
		function scopepreserver3(savedItem,id,i) {
			
			return function() {
				$('.thumbContainer.active').removeClass('active');
				$('#thumbtest_'+i).parent().addClass('active');
				BB.previewState = new GState(savedItem.state);
				BB.previewState.saveId=id;
				BB.previewState.process(function() {
					$('.load_button').prop("disabled", false);
					$('.delete_button').prop("disabled", false);
					$(".preview_schedule").show();
					$(".preview_message").hide();
				});
			}
		}
		
		function deleteButtonEvent(id){
			 return function (){UU.caseDeleteFavorite(id);}
		}
		
		var found=false;
		for (var i=0;i<data.length;i++) {
			var savedItem=data[i];
			drawThumbnail(savedItem.time_blocks,"thumbtest_"+i);
			$("#delete_btn"+i).click(deleteButtonEvent(savedItem.id));
			var $tt=$("#thumbtest_"+i);
			$tt.click(scopepreserver3(savedItem,savedItem.id,i));
			if (BB.previewState!=null && savedItem.id==BB.previewState.saveId) {
				found=true;
				var f=scopepreserver3(savedItem,savedItem.id,i);
				f();
			}
		}
		if (!found) {
			// Favorite was deleted
			BB.previewState=null;
			clearIfNull();
		}
		
	});
	
	function clearIfNull() {
		$(".preview_schedule").toggle(BB.previewState!=null);
		$(".preview_message").toggle(BB.previewState==null);
		if (BB.previewState==null) {
			$('.load_button').prop("disabled", "disabled");
			$('.delete_button').prop("disabled", "disabled");
			previewSchedule.setSize([]);
			previewSchedule.draw(new Result(),BB.previewState);
		}
	}
	
	clearIfNull();
}

function drawNoResults(gState) {
	$("#message_div").show();
	$("#flip_area").hide();
	$(".resultIndex").html("0");
	$(".resultMax").html("0");
	
	var idea = getNoResultsIdea(gState);
	$(".noResultsIdea").toggle(idea.length>0);
	$(".noResultsIdeaText").html(idea);
	$("#message_div").attr("role","alert");
}


function avoidChange(event) {
	var keyID;
	if (window.event) {
		keyID=window.event.keyCode;
	}
	else {
		keyID=event.which;
	}
	// Don't allow user to
	// change dropdown with left/right
	if (keyID==39 || keyID==37) {
		return false;
	}
	return true;
}

function selectMore(el) {
	var $courseDiv=$(el).parents(".courseDiv");
	$courseDiv.find(".stopMessageDiv").slideToggle(300);
}


var PAGES = (function() {

	var my = {};
	var pages=[];
	var fullSize=null;
	var regPage=null;
	var hasCourses=null;
	var isWider=false;
	var fading=false;
	pages.push(new Page("criteria",1.2,true));
	pages.push(new Page("results",2.2,true));
	pages.push(new Page("favorites",0.8,false));
	
	function Page(name,demand,expanded) {
		this.name=name;
		this.demand=demand;
		this.expanded=expanded;
		this.targetPercent=null;
	}
	
	my.openFavorites = function() {
		pages[2].expanded=true;
		transition(true);
	}
	
	my.settleWindow = function() {
		var w=$(".check_media").width();
		if (w<1200 && (BB.wideScreen || BB.wideScreen==null)) {
			// Go from wide-screen to regular
			BB.wideScreen=false;
			$(".vsb_page").css("width","auto");
			$(".page_fader").hide();
			$(".full_page_content").css({opacity:1,width:"auto"});
			if (BB.page!=regPage) {
				if (regPage==null) regPage=BB.page;
				BB.page=regPage;
				PAGES.renderCurrentPage();
			}
		} else if (w>=1200 && (!BB.wideScreen || BB.wideScreen==null)) {
			// Go from regular to wide-screen
			regPage=BB.page;
			BB.page="results";
			PAGES.renderCurrentPage();
			BB.wideScreen=true;
			transition(false)
		}
		
		if (BB.enrollMode) {
			my.settleCheckout();
		}
		
		// Make table correct height
		var a=$("#bodyContent").outerHeight(true);
		var c=$(window).height();
		var $pt=$(".pages_table")
		var h=$pt.outerHeight(true);
		h+=(c-a);
		$pt.css("min-height",(h+"px"));
		applyWider();
	}
	
	function applyWider() {
		var $tw=$(".weekTimes");
		var tw=$tw.first().width();
		if (tw>400 && !isWider) {
			isWider=true;
			$tw.addClass("wider");
		} else if (isWider) {
			isWider=false;
			$tw.removeClass("wider");
		}		
	}
	
	my.settleCheckout = function() {
		var maxWidth=100;
		var $hs=$(".course_cell_legend");
		$hs.each(function() {
			$(this).css("min-width","inherit");
			var w=$(this).width();
			if (w>maxWidth) maxWidth=w;
		});
		var w1=$(".course_cell_action").last().width();
		var w2=$(".course_cell_option").last().width();
		$hs.css("min-width",maxWidth);
		$(".course_legend_header").css("width",maxWidth);
		$(".button_do_actions").css("left",(maxWidth+2)+"px").css("width",(w+10)+"px");
		var b=4;
		$(".course_legend_header").css("left",b+"px");
		$(".course_action_header").css("left",(3+maxWidth+b)+"px");
		$(".course_option_header").css("left",(3+maxWidth+3*b+w1)+"px");
		$(".course_result_header").css("left",(3+maxWidth+6*b+w1+w2)+"px");
		
		var w=$(".check_media").width();
		
		if (w<=680) {
			$(".course_box").each(function() {
				var $h1=$(this).find(".course_header");
				var $h2=$(this).find(".course_cell_action");
				var h1=$h1.outerHeight();
				var h2=$h2.outerHeight();
				if (h1<h2) $h1.css("min-height",h2);
				if (h2<h1) $h2.css("min-height",h1);
			});
		}
	}
	
	my.initPages = function() {
		
		function scopepreserver(page) {
			return function() {
				if (page.expanded) {
					var pagesOpen=0;
					for (var i=0;i<pages.length;i++) {
						pagesOpen+=pages[i].expanded?1:0;
					}
					if (pagesOpen>1) {
						page.expanded=!page.expanded;
						transition(true);
					} else {
						// Don't collapse the last page
					}
				} else {
					page.expanded=!page.expanded;
					transition(true);					
				}
			}
		}
		
		for (var i=0;i<pages.length;i++) {
			var page=pages[i];
			$("#page_"+page.name+" .expander").click(scopepreserver(page));
		}
		
		$(window).resize(function() {
			my.settleWindow();
		});
	}
	
	function transition(animate) {
		
		var width=$("#under_header").width();
		var collapsePerc=100*27/width;
		var totalDemand=0;
		var totalCollapsePerc=0;
		for (var i=0;i<pages.length;i++) {
			var page=pages[i];
			if (page.expanded) {
				totalDemand+=page.demand;
			} else {
				totalCollapsePerc+=collapsePerc;
			}
		}
		var percLeft=100-totalCollapsePerc;
		for (var i=0;i<pages.length;i++) {
			var page=pages[i];
			var newP;
			if (page.expanded) {
				newP=percLeft*page.demand/totalDemand;
			} else {
				newP=collapsePerc;
				// Lock width of collapsing
				var $t=$("#page_"+page.name+" .full_page_content");
				$t.css("width",$t.width());
			}
			page.growing=(newP>page.targetPercent);
			page.targetPercent=newP-0.05; // buffer to prevent wrapping
		}
		
		// Animate to new percent widths (collapse first)
		for (var i=0;i<pages.length;i++) {
			var page=pages[i];
			if (page.expanded) continue;
			var $p=$("#page_"+page.name);
			if (page.name=="results") {
				$(".left_gradient_stronger").hide();
				$(".right_gradient_stronger").hide();
			}
			var $c=$p.find(".full_page_content");
			var $f=$p.find(".page_fader").show();
			$p.find(".expander").addClass("collapsed");
			$f.animate({opacity:1},{duration:(animate?680:0),easing:"swing",queue:true});
			$c.animate({opacity:0},{duration:(animate?180:0),easing:"swing",queue:true});
			$p.animate({width:(page.targetPercent+"%")},{duration:(animate?180:0),easing:"swing",queue:true,complete:function() {
				var bg=$(this).find(".page_fader").css("backgroundColor");
				$(this).find(".full_page_title").addClass("rotate_90d").css("backgroundColor",bg).find(".pusher").css("display","inline");
			}});
		}
		
		
		// Animate to new percent widths
		for (var i=0;i<pages.length;i++) {
			var page=pages[i];
			if (!page.expanded) continue;
			var $p=$("#page_"+page.name);
			if (page.name=="results") {
				$(".left_gradient_stronger").show();
				$(".right_gradient_stronger").show();
			}
			$p.find(".expander").removeClass("collapsed");
			var $c=$p.find(".full_page_content");
			$p.find(".full_page_title").removeClass("rotate_90d").css("backgroundColor","").find(".pusher").css("display","none");;
			var $f=$p.find(".page_fader");
			$f.animate({opacity:0},{duration:(animate?80:0),easing:"swing",queue:true,complete:function () {
				$(this).hide();
			}});
			$c.animate({opacity:1},{duration:(animate?180:0),easing:"swing",queue:true});
			$p.animate({width:(page.targetPercent+"%")},{duration:(animate?180:0),easing:"swing",queue:true,complete:function() {
				// Unlock widths
				$(this).find(".full_page_content").css("width","auto");
				applyWider();
			}});
		}
	}
	
	my.renderCurrentPage = function() {
		
		if (BB.enrollMode) {
			//cancelScheduleClick();
		}
		
		var hasCoursesNow=BB.activeState.cnfs.length>0;
		if (hasCourses==null || hasCoursesNow!=hasCourses && !BB.enrollMode) {
			hasCourses=hasCoursesNow;
			var wait=fading?700:0; // This is in case we hasCourses=true then hasCourses=false within a few ms.
			if (hasCourses) {
				$(".mainframe").addClass("courses_bg");
				setTimeout(function() {
					fading=true;
					$(".reg_no_courses").fadeOut(function() {
						$(".reg_parent").fadeIn(function() {
							fading=false;
						});
					});					
				},wait);
			} else {
				$(".mainframe").removeClass("courses_bg");
				setTimeout(function() {
					fading=true;
					$(".reg_parent").fadeOut(function() {
						$(".reg_no_courses").fadeIn(function() {
							fading=false;
							$(".reg_parent").hide();
						});
					});					
				},wait);
			}
		}
		
		// Re-arrange the page if necessary
		if (BB.page=="criteria") {
			
			if ($("#page_criteria").hasClass("active_vsb_page")) {
				// already on correct page.
				return;
			}
			
			$(".vsb_page").removeClass("active_vsb_page");
			$("#page_criteria").addClass("active_vsb_page");
	
			$(".nav_link").removeClass("navselected");
			$(".link_criteria").addClass("navselected");		
	
			// Increase tip by 1 if not first time.
			SLIDER.showNewTip();
			
			// mobile search course field focus issue
			if(!$e("code_number").disabled && !BB.access) {
				$e("code_number").focus();
			} else if (BB.access) {
				//$("#page_add_courses_desc").focus();
			}
			
		} else if (BB.page=="results") {
			
			if ($("#page_results").hasClass("active_vsb_page")) {
				// already on correct page.
				return;
			}
			
			$(".vsb_page").removeClass("active_vsb_page")
			$("#page_results").addClass("active_vsb_page")
	
			$(".nav_link").removeClass("navselected");
			$(".link_results").addClass("navselected");		
	
		} else if (BB.page=="favorites") {
			
			if ($("#page_favorites").hasClass("active_vsb_page")) {
				// already on correct page.
				return;
			}
			
			$(".vsb_page").removeClass("active_vsb_page")
			$("#page_favorites").addClass("active_vsb_page")
	
			$(".nav_link").removeClass("navselected");
			$(".link_favorites").addClass("navselected");		
		}
	
	}
	
	return my;

}());


var MENU = (function() {
	
	var my={};
	var $mm;
	
	function applyAuthState() {
		$(".main_menu_button").toggle(authenticated);
		$(".sign_in_button").toggle(!authenticated);
		$mm.find(".mi_analytics").toggle(analyticsAccess); // TODO
		//$mm.find(".mi_cart").toggle(isAuthenticatedWithSso);
		//$mm.find(".mi_schedule").toggle(isAuthenticatedWithSso);
		$mm.find(".mi_behalf").toggle(isAdvisor && advisee==null);
		$mm.find(".mi_behalf_change").toggle(advisee!=null);
		$mm.find(".behalf_student").text(advisee);
	}
	
	my.initMenu = function() {
		$mm = $(".main_menu");
	
		$(".main_menu_button").click(function() {
			// Make it visible (invisible is handled by document.onclick handler)
			if ($(".main_menu:visible").length==0) {
				setTimeout(function() {
					$(".main_menu").fadeToggle(230);	
				}, 40);
			}
		});
		
		$mm.find(".mi_behalf").click(function() {
			$(this).slideUp();
			$mm.find(".mi_behalf_start").slideDown();
			$mm.find(".behalf_userid").focus();
		});
		
		$mm.find(".behalf_cancel_button").click(function() {
			$mm.find(".mi_behalf_start").slideUp();
			if (advisee==null) {
				$mm.find(".mi_behalf").slideDown();
			} else {
				$mm.find(".mi_behalf_change").slideDown();
			}
		});
		
		$mm.find(".switch_student_button").click(function() {
			$(this).slideUp();
			$mm.find(".mi_behalf_start").slideDown();
		});
		
		$mm.find(".stop_advising_button").click(function() {
			$.getJSON("api/stopAdvising",function(data) {
				location.reload();
			});
		});
		
		$mm.find(".behalf_start_button").click(function() {
			var userid=$mm.find(".behalf_userid").val();
			$.getJSON("api/startAdvising?userid="+userid,function(data) {
				if (data.error!=null) {
					$(".mi_message_box").text(data.error).show();	
				} else {
					location.reload();
				}
			});
		});
		
		applyAuthState();
	}
	
	return my;
	
}());