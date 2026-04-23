"use strict";

/*
This code is the exclusive property of
Visual Schedule Builder Inc.
www.vsbuilder.com
Copyright 2002-2016.
*/

// dDivide - dateCode where the schedule will end if it's the first half or begin if it's
// not the first half (i.e. second half) for Fall/Summer situation or similar.
function Schedule(scheduleDest,isDateGrid,isPersonal,isDragging,isFirstHalf,isPinning) {
	
	var self=this;
	var $divSchedule = $(scheduleDest);
	if ($divSchedule.length<1) {
		console.log("Error: scheduleDest not found");
	}
	var redrawTimetable=true;
	
	var drawnV1=null;
	var drawnV2=null;
	
	var nbCourses=0;
	var dateGridStart = null;
	var dateGridEnd = null;
	var dateGridMonthWidth = 10;
	
	var lastResult = null;
	var lastGState = null;
	var schedulePos = null;
	var onePxInPerc=0.4;
	
	// Drag/Touch items:
	var dragDayHourStart = null;
	var dragDayHourUnderMouse = null;
	var refreshes = 0;
	var touchTime=null;
	var holdTimeout=null;
	var tap=false;
	var startCoords=null;
	var coords=null;
	var preventEmulateTimeout=null;
	var timeToHold=700;
	
	// Size
	this.firstDay=2; // Monday
	this.lastDay=6; // Friday
	this.firstHour=11;
	this.lastHour=13;
	this.d1=null;
	this.d2=null;
	this.v1=null;
	this.v2=null;
	
	this.campusChangeWarning=false;
	
	function clearChildren(el) {
		while (el.childNodes.length >= 1) {
			el.removeChild(el.lastChild);
		}
	}
	function isTouchDevice() {
		return !!('ontouchstart' in window);
	}
	if (isDragging) {
		if (isTouchDevice()) { // touch events
			$(document).on("touchstart", touchStart);
			$(document).on("touchmove ", touchMove);
			$(document).on("touchend", touchEnd);
		} else { // desktop events
			$(document).on("mousedown", mouseDown);
			$(document).on("mousemove", mouseMove);
			$(document).on("mouseup", mouseUp);
		}
		
		$(window).scroll(function(){
			//consolelog("scroll");
			dragDayHourStart=null;
			touchTime=null;
			if (holdTimeout!=null) {
				clearTimeout(holdTimeout);
				holdTimeout=null;
			}
		});
	}
	
	this.setSize = function(cnfs,dDivide) {
		redrawTimetable = true;
		var day1=2; // Monday
		var day2=6; // Friday
		var t1=60*11; // 11am
		var t2=60*13; // 1pm
		var d1=Number.MAX_VALUE;
		var d2=0;
		nbCourses=cnfs.length;

		for (var c=0;c<cnfs.length;c++) {
			var cnf=cnfs[c];
			if (!cnf.cnPro.filterPass) continue;
			for (var u=0;u<cnf.cnPro.uselPros.length;u++) {
				var uselPro=cnf.cnPro.uselPros[u];
				var usel=uselPro.usel;
				if (!uselPro.filterPass) continue;
				var sel=uselPro.selPros[0].sel;
				for (var i=0;i<sel.classes.length;i++) {
					var cls=sel.classes[i];
					for (var j=0;j<cls.timeblocks.length;j++) {
						var tb=cls.timeblocks[j];
						if (tb.day < day1) {
							day1 = tb.day;
						}
						if (tb.day > day2) {
							day2 = tb.day;
						}
						if (tb.t1 < t1) {
							t1 = tb.t1;
						}
						if (tb.t2 > t2) {
							t2 = tb.t2;
						}
					}
				}
				if (usel.d1 < d1) {
					d1 = usel.d1;
				}
				if (usel.d2 > d2) {
					d2 = usel.d2;
				}
			}
		}
		
		// If the range is less than 6 hours, bump it up to 6 hours.
		if (t2-t1<360) {
			var add=(t2-t1)/120;
			add=Math.ceil(add);
			t1-=add*60;
			t2+=add*60;
		}
		
		// If no courses, put a simple date range
		if (cnfs.length==0) {
			day1=1;
			day2=7;
		}
		
		this.firstDay=day1;
		this.lastDay=day2;
		this.firstHour=Math.floor(t1/60);
		this.lastHour=Math.ceil(t2/60);
		
		var ymd_test1=new YearMonthDay(d1);
		var ymd_test2=new YearMonthDay(d2);
		
		if (dDivide) {
			// This schedule is one of two parts divided
			if (isFirstHalf) {
				this.d1=d1;
				this.d2=dDivide;
			} else {
				this.d1=dDivide;
				this.d2=d2;
			}
		} else {
			this.d1=d1;
			this.d2=d2;
		}
		
		if (isFirstHalf && this.d1>this.d2) {
			this.d1=this.d2-60;
		}
		if (!isFirstHalf && this.d2<this.d1) {
			this.d2=this.d1+60;
		}

    	// Prevent more than 2 years (something wrong)
    	if (this.d2-this.d1>731) this.d2=this.d1+731;
    	
		var resetV1V2=(this.v1==null || this.v2<this.d1 || this.v1>this.d2);

		if(weekSliderDisplay && isDateGrid) {
			// Get day of week of d1 (0=Sunday, 1=Monday)
			var day=(this.d1+1)%7;
			this.firstSunday=this.d1-day;
			var totalWeeks=Math.ceil((this.d2-this.firstSunday)/7);
			this.totalWeeks=totalWeeks;
			if (resetV1V2) {
				var weekIndex=(this.d1>this.firstSunday?1:0); // Show the 2nd week by default if the term starts part way through the week
				this.gotoWeek(weekIndex);
			}
		} else {
			if (this.$divSchedule!=null) {
				this.$divSchedule.find(".sliderdiv").hide();	
			}
			if (resetV1V2) {
				this.v1=this.d1;
				this.v2=this.d2;				
			}
		}
	}
	
	this.dayWidth=61; // set elsewhere
	this.hourHeight=timesheetHourHeight>0?+timesheetHourHeight:32;

	this.isPrevWeek = function() {
		return (this.v1>this.d1);
	}

	this.isNextWeek = function() {
		return (this.v2<this.d2);
	}

	this.gotoWeek = function(weekIndex) {
		this.currWeekIndex=weekIndex;
		this.v1=this.firstSunday+(7*weekIndex);
		this.v2=this.v1+6;
	}
	
	function drawTimetable() {
		if (self.d1==null) {
			console.log("setSize not called");
		}
		var h="";
		h += "<h3 class=\"accessOnly test123\" style=\"padding-left: 62px\">"+i8n.schedule+"<\/h3>";
		h += "<div style=\"width: 1px; height: 1px; overflow: hidden;\">If you are";
		h += "	using a screen reader, the contents of this heading will not be useful";
		h += "	to you. Visual content here is repeated textually under the Legend";
		h += "	heading.<\/div>";
		h += "<div style=\"position: relative;\">";
		h += "	<div class=\"weekName\">";
		h += "		&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span";
		h += "			class=\"timetable_title\">&nbsp;<\/span>";
		h += "	<\/div>";
		h += "";
		h += "	<div class=\"timezoneAbbr\">&nbsp;<\/div>";
		h += "";
		h += "	<div class=\"timetable table_container\">";
		h += "		<div style=\"position: relative\">";
		h += "";
		h += "			<div class=\"weekArea\"><\/div>";
		h += "";
		h += "			<div class=\"currentBusyBlocks\"";
		h += "				style=\"position: absolute; display: block; top: 0px; left: 0px; width: 100%; height: 100%\">";
		h += "				&nbsp;<\/div>";
		h += "";
		h += "			<div class=\"weekTimes\"";
		h += "				style=\"position: absolute; display: block; top: 0px; left: 0px; width: 100%; height: 100%\"";
		h += "				class=\"cal_view\"";
		h += "				title=\""+(isDragging?i8n.dontWant:"")+"\">";
		h += "			<\/div>";
		h += "";
		h += "		<\/div>";
		h += "";
		h += "	<\/div>";
		h += "";
		h += "<\/div>";
		h += "";
		h += "<div class=\"monthscalc\">";
		
		if (weekSliderDisplay) {
			h += "	<div class=\"sliderdiv\" style=\"position: relative;\">";
			h += "		<p style=\"text-align: center;\">";
			h += "			<label>";//+i8n.weeksliderlabel;
			h += "				<span class=\"disp_days\">---<\/span><\/label>";
			h += "		<\/p>";
			h += "		<div class=\"slider\" data-begin=\"1\" data-end=\"20\"><\/div>";
			h += "		<div class=\"sliderleft\">";
			h += "			<img";
			h += "				src=\"images/arrow_left.png\"";
			h += "				alt=\"Previous week arrow\" \/>";
			h += "		<\/div>";
			h += "		<div class=\"sliderright\">";
			h += "			<img";
			h += "				src=\"images/arrow_right.png\"";
			h += "				alt=\"Next week arrow\">";
			h += "		<\/div>";
			h += "	<\/div>";
		}
		
		h += "";
		h += "	<div class=\"dateGridHolder\" style=\"position: relative;\">";
		h += "		<div class=\"dateGridTable\"><\/div>";
		h += "		<div class=\"dateGridBlocks\"><\/div>";
		h += "		<div class=\"scheduleWarning\"><\/div>";
		h += "	<\/div>";
		h += "<\/div>";
		h += "";
		
		if (BB.access) {
			h += "<div class=\"timesToAvoid\" class=\"noprint\">";
			h += "	<div class=\"bubble\" style=\"width: auto;\" class=\"timesToAvoidBubble\">";
			h += "		<h3 class=\"bubbletitle\">";
			h += "			<label>"+i8n.addTimeToAvoid+"<\/label>";
			h += "		<\/h3>";
			h += "		"+i8n.clearTimesToAviodText;
			h += "		<div class=\"tip_bottom\"><\/div>";
			h += "	<\/div>";
			h += "	<div style=\"margin-top: 6px\">";
			h += "		<div style=\"width: 1px; height: 1px; overflow: hidden;\">";
			h += "			<label for=\"add_avoid_time\">Personal Time Entry. For example,";
			h += "				enter Friday 5 dash 7 PM and press enter.<\/label>";
			h += "		<\/div>";
			h += "		<input type=\"text\" class=\"add_avoid_time\""; // TODO
			h += "			style=\"width: 62%; font-size: 160%;\"\/> <input type=\"button\"";
			h += "			class=\"add_avoid_time_button big_button\"";
			h += "			value=\""+i8n.addTime+"\"";
			h += "			style=\"width: auto\"\/>";
			h += "	<\/div>";
			h += "	<div>";
			h += "		"+i8n.examples;
			h += "	<\/div>";
			h += "	<div class=\"avoidNotice\"><\/div>";
			h += "	<div class=\"clearTimesToAvoidNew\"";
			h += "		style=\"margin-top: 4px; margin-bottom: 2px;\">";
			h += "		<input type=\"button\" class=\"big_button clearAvoidTimesButton\"";
			h += "			value=\""+i8n.clearTimesToAviod+"\"\/>";
			h += "	<\/div>";
			h += "<\/div>";
		}
		h += "";
		
		$divSchedule.html(h);
		
		new Timetable($divSchedule.find(".weekArea"),self.firstDay,self.lastDay,self.firstHour,self.lastHour);
		
	    
	    if (isDateGrid) {
	    	
	    	if (nbCourses<=0) {
	    		$divSchedule.find(".monthscalc").hide();
	    	} else {
	    		$divSchedule.find(".monthscalc").show();
	    	}
	    	
			var $s=$divSchedule.find(".slider");
		    $s.slider({
		        range: "min",
		        value: self.currWeekIndex,
		        min: 0,
		        max: self.totalWeeks-1,
		        slide: function (event, ui) {
		        	self.gotoWeek(ui.value);
		        	self.draw(lastResult,lastGState);
		        }
		    });

	    	var borderDays=weekSliderDisplay?20:0;
	    	var ymd1 = new YearMonthDay(self.d1-borderDays);
	    	var ymd2 = new YearMonthDay(self.d2+borderDays);
	    	
	    	dateGridStart = ymd1;
	    	dateGridEnd = ymd2;
	    		
	    	var m1 = ymd1.m;
	    	var m2 = ((ymd2.y-ymd1.y)*12)+ymd2.m;
	    	
	    	dateGridMonthWidth = 100/(m2-m1+1);

	    	var th="<table class='dateGrid' cellpadding='0' cellspacing='0'>";
	    	for (var i=0; i<=nbCourses; i++) {
	    		th+="<tr>";
	    		for (var m=m1; m<=m2; m++) {
	    			th+="<td style='width:" + dateGridMonthWidth + "%;'";
	    			if (i==0) {
	    				th+=" class='mo'>";
	    				th+=getMonth(m%12);
	    			} else {
	    				th+=">&nbsp;";
	    			}
	    			th+="</td>";
	    		}
	    		th+="</tr>";
	    	}
	    	th+="</table>";

	    	var $dateGridTable = $divSchedule.find(".dateGridTable");
	    	$dateGridTable.html(th);
	    	
	    	if (weekSliderDisplay) {
		    	var sliderX1=dateToPixelPos(new YearMonthDay(self.firstSunday));
		    	var sliderX2=dateToPixelPos(new YearMonthDay(self.firstSunday+7*self.totalWeeks));
		    	var ww=(dateGridMonthWidth/31*7);
	
		    	var $slider = $divSchedule.find(".slider");
		    	
		    	$slider.css("left",(sliderX1+(ww/2))+"%");
		    	$slider.css("width",((sliderX2-sliderX1)-ww)+"%");
		    	
		    	$divSchedule.find(".sliderleft").css("right",((100-sliderX1)+"%"));
		    	$divSchedule.find(".sliderright").css("left",(sliderX2+"%"));
		    	
		    	$divSchedule.find(".ui-slider-handle").css("width",ww+"%");
		    	$divSchedule.find(".ui-slider-handle").html("<span style='display:inline-block;width:75%;height:"+((nbCourses*(16))+($('tr .first').height()+2))+"px'></span>");
		    	
		    	$divSchedule.find('.sliderright').click(function () {
		    		var value = $slider.slider("value");
		    		value++;
		    		$slider.slider("value", value);
		    		self.gotoWeek(value);
		    		self.draw(lastResult,lastGState);
		        });
		    	
		    	$divSchedule.find('.sliderleft').click(function () {
		    		var value = $slider.slider("value");
		    		value--;
		    		$slider.slider("value", value);
		    		self.gotoWeek(value);
		    		self.draw(lastResult,lastGState);
		        });
	    	}
	    	
	    }
	    
	    if (isPersonal) {
	    	
	    	$divSchedule.find(".add_avoid_time").keyup(function (e) {
	    	    if (e.keyCode == 13) {
	    	        addAvoidTime($(this).val());
	    	    }
	    	});
	    	
	    	$divSchedule.find(".add_avoid_time_button").click(function() {
	    		var string=$divSchedule.find(".add_avoid_time").val();
	    		addAvoidTime(string);
	    	});
	    	
	    	$divSchedule.find(".clearAvoidTimesButton").click(function() {
	    		clearAvoidTimes();
	    	});
	    }
	    
	}
	
	this.draw = function(result,gState) {
		lastResult = result;
		lastGState = gState;
		
		if (redrawTimetable) {
			drawTimetable();
		}
		
		var scheduleWidthPx=$divSchedule.find("table").width();
		if (scheduleWidthPx<200) scheduleWidthPx=400;
		onePxInPerc=100/scheduleWidthPx;
		
		if (gState!=null && (redrawTimetable || gState.bbsOutdated)) {
			refreshBusyBlocks(gState);
		}

		// Remove current blocks 
		$divSchedule.find(".time_block").remove();
		$divSchedule.find(".dateBlock").remove();
		$divSchedule.find(".exclBlock").remove();
		
		if (gState==null) return;

		// Draw the blocks on the schedule
		if (gState==BB.activeState) {
			$("#message_div").hide();
			$("#flip_area").show();			
		}
		
		this.campusChangeWarning=false;
		var lastCn = null;
		var courseNb = 0;
		for (var i=0; i<result.selPros.length; i++) {
			var selPro = result.selPros[i];
			var sel = selPro.sel;
			if (lastCn!=null && lastCn==sel.cn) {
				// No need to redraw - selection belongs to same CodeNumber
				continue;
			}
			// Find best sel in usel
			var best=i;
			for (var j=i+1;j<result.selPros.length;j++) {
				var selPro2 = result.selPros[j];
				if (selPro2.sel.cn!=sel.cn) break;
				if (selPro2.isChosen()) {
					// Found a better one - the selected one
					i=j;
					selPro=selPro2;
					sel=selPro.sel;
					break;
				}
			}
			
			courseNb++;
			
			// Date Grid stuff
			var ymd1=new YearMonthDay(sel.usel.d1);
			var ymd2=new YearMonthDay(sel.usel.d2);
			drawDateRow(courseNb,selPro.cnf.color,selPro.cn.title,sel.classes,ymd1,ymd2,sel.usel.key,selPro.cnf.isPinned());
			
			
			for (var j=0; j<sel.classes.length; j++) {
				var cls=sel.classes[j];
				var text="<span class='mobile_nb'>"+courseNb+"</span><span class='nonmobile'>";
				if (template=="york") {
					var code=sel.cn.code;
					var nb=3;
					for (var ci=0;ci<code.length;ci++) {
						if (code.charAt(ci)=='-') nb--;
						if (nb==0) {
							code=code.substr(0,ci);
							break;
						}
					}
					code=code.replace(/-/g,"-<wbr/>"); // Fix firefox no-break-on-hyphen
					var meet="";//cls.secNo;
					text+=code+"<br/>"+cls.type+" "+meet+" Sec."+cls.usn+"<br/>(L#C)";
					// TODO: Use cnf.cs
					//text+=" Period "+cls.pn+" Section "+cls.usn+"<br/>"+cls.location;
				} else {
					text+=sel.cn.code + " " + sel.cn.number +"<br/>" + cls.type;
				}
				text+="</span>";// + " " + cls.secNo;
				if (switchNameAndCode) text=sel.cn.title;
				for (var k=0; k<cls.timeblocks.length; k++) {
					var timeblock = cls.timeblocks[k];
					
					// See if we really should show it for this schedule's date range
					if (timeblock.d2<self.d1 || timeblock.d1>self.d2) {
						continue;
					}

					var lowerDates=0;
					var higherDates=0;

					// Check for campus proximity and visual overlap:
					var lastCn2 = null;
					for ( var i2 = 0; i2 < result.selPros.length; i2++) {
						var sel2 = result.selPros[i2].sel;
						if (sel2.usel==sel.usel) continue;
						if (lastCn2!=null && lastCn2==sel2.cn) {
							// No need to check this selection, we already checked its timeblocks
							continue;
						}
						
						for ( var j2 = 0; j2 < sel2.classes.length; j2++) {
							var cls2 = sel2.classes[j2];
							for ( var k2 = 0; k2 < cls2.timeblocks.length; k2++) {
								if (i == i2 && j == j2 && k == k2) continue;
								var timeblock2 = cls2.timeblocks[k2];
								if (timeblock.day != timeblock2.day) continue;
								
								// Skip it if it's out of date range
								if (timeblock2.d2<self.d1 || timeblock2.d1>self.d2) {
									continue;
								}

								var datesOff=false;
								if (timeblock.d2 <= timeblock2.d1 || timeblock.d1 >= timeblock2.d2) {
									// No date overlap. But may be visual overlap
									datesOff=true;
									if (timeblock2.t1 < timeblock.t2 && timeblock2.t2 > timeblock.t1) {
										// Overlap!
										if (timeblock.d1 > timeblock2.d1) {
											lowerDates++;
										} else {
											higherDates++;
										}
									}
								}

								// Only do campus check once
								if (i2 < i) continue;

								if (!(minCampusSwitchTime>0)) continue;

								if (cls.campus==cls2.campus) continue;

								if (datesOff) continue;
								
								// May be campus proximity issue

								if ((Math.abs(timeblock.t2 - timeblock2.t1) > minCampusSwitchTime)
										&& (Math.abs(timeblock.t1 - timeblock2.t2) > minCampusSwitchTime)) {
									// Times are not close enough
									continue;
								}

								var t1 = timeblock.t2;
								var t2 = timeblock2.t1;
								if (t2 < t1) {
									t1 = timeblock2.t2;
									t2 = timeblock.t1;
								}
								var tb = new TimeBlock(0, timeblock.day, t1, t2, timeblock.d1, timeblock.d2, i8n.campusChange);
								addImage(tb);
								this.campusChangeWarning=true;
							}
						}
						lastCn2 = sel2.cn;
					}
					
					var text2=text;
					if (template=="york") {
						var loc=cls.getLocForTimeBlock(timeblock.id);
						text2=text2.replace("(L#C)",loc);
					}

					addTimeBlock(selPro.cnf.isPinned(),selPro.cnf.color,timeblock,text2,sel.usel.key,lowerDates,higherDates);
				}
			}
			lastCn = sel.cn;
		}
		
		
		// Update the Week Slider display
		if (weekSliderDisplay && (redrawTimetable || drawnV1==null || drawnV2==null || drawnV1!=self.v1 || drawnV2!=self.v2)) {
			$divSchedule.find(".sliderleft").toggle(this.isPrevWeek());
			$divSchedule.find(".sliderright").toggle(this.isNextWeek());

			var ymdw1 = new YearMonthDay(self.v1);
			var ymdw2 = new YearMonthDay(self.v2);
			var sugString=getMonth2(ymdw1.m%12)+" "+ymdw1.d;
			if (ymdw1.y!=ymdw2.y) {
				sugString+=", "+ymdw1.y;
			}
			sugString+=" - ";
			if (ymdw1.m!=ymdw2.m) {
				sugString+=getMonth2(ymdw2.m%12)+" ";
			}
			sugString+=ymdw2.d+", "+ymdw2.y;
			$divSchedule.find(".disp_days").html(sugString);

			$divSchedule.find(".timetable tr.header").addClass("tall");
			for (var d=1;d<=7;d++) {
				var ymd = new YearMonthDay(self.v1+d-1);
				$divSchedule.find(".day_"+d+"_date").html("<br/>"+getMonth(ymd.m)+" "+ymd.d);
			}
			drawnV1=self.v1;
			drawnV2=self.v2;
		}
		redrawTimetable=false;

	}

	function addTimeBlock(isPinned,color,timeBlock,text,selkey,lowerDates,higherDates) {

		if (typeof minDuration != "undefined") {
			if (timeBlock.d2 - timeBlock.d1 < minDuration) {
				return;
			}
		}

		if (weekSliderDisplay && !timeBlock.doesOccurBetween(self.v1,self.v2)) {
			return;
		}
		var pos = getBlockPosition(timeBlock);

		var newW = pos.widthp-(onePxInPerc*2); // Take off 2 px for border
		var newLeft = pos.leftp;

		if ((lowerDates>0 || higherDates>0)&& !weekSliderDisplay) {
			newW = newW/(lowerDates+higherDates+1);
			newLeft += newW*lowerDates;
		}

		var pinned=false;
		var extraClass="";
		var message="";
		if (isPinning) {
			if (isPinned) {
				pinned=true;
				extraClass=" bclock";
				message+=i8n.clickToUnpin;
			} else {
				message+=i8n.clickToPin;
			}
		}

		// Create new element
		var el = document.createElement('div');
		var clsName = "time_block bc"+color+" bd"+color+" bh"+color+extraClass;
		el.setAttribute("class",clsName);
		el.setAttribute("className",clsName);
		el.setAttribute("title",message);
		el.setAttribute("onmouseover","RR.highlightClass("+color+",true)");
		el.setAttribute("onmouseout","RR.highlightClass("+color+",false)");
		
		var wRed=0;
		if (timeBlock.overlap>0) {
			// Reduce width if overlap
			wRed=1;
		}
		var h=(pos.height-2);
		var moreLines=(template=="york"?3:0);
		var pt=Math.floor(h/2-9-(moreLines*5));
		if (pt<0) pt=0;
		var h2=h-pt;
		el.style.cssText = "left:"+(newLeft+wRed)+"%;top:"+pos.top+"px;width:"+(newW-wRed*2)+"%;height:"+h2+"px;padding-top:"+pt+"px";
		el.innerHTML = text;

		var week = $divSchedule.find(".weekTimes")[0];
		week.appendChild(el);
		$(el).data("selkey",selkey);
		if (isPinning) {
			$(el).data("pinned",pinned);
		}
	}
	
	function addImage(timeBlock) {

		// See if we really should show it for this schedule's date range
		if (timeBlock.d2<self.d1 || timeBlock.d1>self.d2) {
			return;
		}

		if (!timeBlock.doesOccurBetween(self.v1,self.v2)) {
			return;
		}

		var pos = getBlockPosition(timeBlock);

		//var left = pos.left+pos.width/2-10;
		var top = pos.top;//+pos.height/2-10;
		var height = pos.height;
		if (height<20) {
			top+=height/2-10;
			height=20;
		}

		// Create new element
		var el = document.createElement('div');
		var clsName = "exclBlock";
		el.setAttribute("class",clsName);
		el.setAttribute("className",clsName);
		el.setAttribute("title",timeBlock.s);
		el.style.cssText = "left:"+pos.leftp+"%;top:"+top+"px;width:"+pos.widthp+"%;height:"+height+"px;";
		el.innerHTML = "&nbsp;";

		var week = $divSchedule.find(".weekTimes")[0];
		week.appendChild(el);
	}
	
	
	function getBlockPosition(timeBlock) {
		var t = Math.floor(((timeBlock.t1/60-self.firstHour)*self.hourHeight)+(self.hourHeight/2+1)+(weekSliderDisplay?10:0));
		var h = Math.floor((timeBlock.t2-timeBlock.t1)/60*self.hourHeight-1);
		var wp = 100/(self.lastDay-self.firstDay+1);
		var lp = (timeBlock.day-self.firstDay)*wp+onePxInPerc;
		return {top:t,height:h,leftp:lp,widthp:(wp-onePxInPerc)};
	}

	function dateToPixelPos(ymd) {
		var m1=((ymd.y-dateGridStart.y)*12)+(ymd.m-dateGridStart.m)+(ymd.d/31);
		var dl=m1*dateGridMonthWidth;
		return dl;
	}
	
	function addDateBlock(ymd1, ymd2, courseNb, color, title, uselkey, pinned) {
		
		var dl=dateToPixelPos(ymd1);
		var dw=dateToPixelPos(ymd2)-dl;
		
		var dt=courseNb*16+2;
		var dh=11;

		// Create new element
		var el = document.createElement('div');
		var clsName = "dateBlock bc"+color+" bd"+color+" bh"+color;
		var lockFunction="addPin(event,'"+uselkey+"',"+(!pinned)+",'no');";
		
		var message="";
		if (isPinning) {
			if (pinned) {
				message+=i8n.clickToUnpin;
			} else {
				message+=i8n.clickToPin;
			}
		}
		el.setAttribute("class",clsName);
		el.setAttribute("className",clsName);
		el.setAttribute("onmouseover","RR.highlightClass("+color+",true)");
		el.setAttribute("onmouseout","RR.highlightClass("+color+",false)");
		if (isPinning) {
			el.setAttribute("onclick",lockFunction);	
		}
		el.setAttribute("title",message);
		el.style.cssText = "left:"+dl+"%;top:"+dt+"px;width:"+dw+"%;height:"+dh+"px;";
		if (title!=null) {
			el.innerHTML = "&nbsp;<span class='mobileNUmber'>"+courseNb+"-</span>"+title+"&nbsp;";
		}
		
		var grid = $divSchedule.find(".dateGridBlocks");
		grid[0].appendChild(el);
	}
	

	function drawDateRow(courseNb,color,title,classes,sessYmd1,sessYmd2,uselkey,pinned) {

		// Get all timeblocks from the blocks
		var tbs=new Array();
		for (var i=0;i<classes.length;i++) {
			var cls=classes[i];
			for (var j=0;j<cls.timeblocks.length;j++) {
				tbs.push(cls.timeblocks[j]);
			}
		}
		
		// compute the union of all d1/d2's.
		var u=new Array();
		
		// First sort blocks by d1.
		tbs.sort(function(a,b){return a.d1-b.d1;});

		// Then for each block
		// extend the current block or create a new one
		
		for (var i=0;i<tbs.length;i++) {
			var tb=tbs[i];
			if (i==0) {
				u.push([tb.d1,tb.d2]);
				continue;
			}
			var ut=u[u.length-1];
			if (tb.d1<=ut[1]) {
				if (tb.d2>ut[1]) ut[1]=tb.d2;
			} else {
				u.push([tb.d1,tb.d2]);
			}
		}
		
		for (var i=u.length-1;i>=0;i--) {
			var ymd1=new YearMonthDay(u[i][0]);
			var ymd2=new YearMonthDay(u[i][1]);
			addDateBlock(ymd1, ymd2, courseNb, color, (i==0?title:null), uselkey, pinned);
		}
		
		if (u.length==0) {
			// If there are no scheduled blocks, display
			// session length
			addDateBlock(sessYmd1, sessYmd2, courseNb, color, title, uselkey, pinned);
		}
		
	}

	
	// Dragging functions:
	
	function mouseCoords(ev){
		//touch event co ordinates
		if (ev.originalEvent && ev.originalEvent.touches) {
			if (ev.originalEvent.touches || ev.originalEvent.changedTouches) {
				var vev = ev.originalEvent.changedTouches[0] || ev.originalEvent.touches[0];
				if (vev && (vev.pageX || vev.pageY)) {
					return {
						x : vev.pageX,
						y : vev.pageY
					};
				}
			}
		}
		// desktop event co ordinates
		if(ev.pageX || ev.pageY){
			return {x:ev.pageX, y:ev.pageY};
		}
		return {
			x:ev.clientX + (document.documentElement.scrollLeft?document.documentElement.scrollLeft:document.body.scrollLeft) - document.body.clientLeft,
			y:ev.clientY + (document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop) - document.body.clientTop
		};
	}
	
	function getDayTime(ev) {
		ev           = ev || window.event;
		var mousePos = mouseCoords(ev);
		return getDayTime2(mousePos);
	}
	
	function getDayTime2(mousePos) {

		var dx = mousePos.x-schedulePos.x;
		var dy = mousePos.y-schedulePos.y-(17+(weekSliderDisplay?11:0));

		var d = Math.floor(dx/self.dayWidth+self.firstDay);
		var h = Math.floor(dy/self.hourHeight+self.firstHour);

		// If out of current schedule properties range return null
		if (d<self.firstDay || d>self.lastDay || h<self.firstHour || h>self.lastHour) {
			return null;
		}

		return {day:d,hour:h};
	}
	
	function mouseDown(ev) {
		mouseDown2(ev,false);
	}
	
	function touchStart(ev) {
		mouseDown2(ev,true);
	}
	
	function mouseDown2(ev,isTouch) {
		if (tap || BB.popuplive || (BB.page!="results" && !BB.wideScreen)) return true;
		
		// We must do this the first time:
		var $weekArea = $divSchedule.find(".weekArea");
		if ($weekArea.length<1) {
			// no schedule drawn yet.
			return true;
		}
		schedulePos = getPosition($weekArea[0]);
		self.dayWidth=$weekArea.width()/(self.lastDay-self.firstDay+1);
		startCoords = mouseCoords(ev);
		coords = startCoords;
		
		if (isTouch) {
			touchTime=(new Date()).getTime();
			holdTimeout=setTimeout(function() {
				mouseMove2(false,true);
			},timeToHold);
		}
	}
	
	function mouseMove(ev) {
		mouseMove2(ev,false);
	}
	
	function touchMove(ev) {
		mouseMove2(ev,true);
	}
	
	function mouseMove2(ev,isTouch) {
		if (startCoords==null) return;
		//consolelog("move touch?"+isTouch);
		if (ev) {
			coords = mouseCoords(ev);
		}
		
		var startDrag=(!isTouch && (Math.abs(coords.x-startCoords.x)>3 || Math.abs(coords.y-startCoords.y)>3));
		var now=(new Date()).getTime();
		if (!startDrag && isTouch && touchTime!=null && dragDayHourStart==null) {
			if (now>touchTime+timeToHold) {
				// Touch held long enough
				//consolelog("longg");
				if (Math.abs(coords.x-startCoords.x)<7 && Math.abs(coords.y-startCoords.y)<7) {
					// Touch held without moving too much
					startDrag=true;
				}
			}
		}
		if (startDrag) {
			if (dragDayHourStart==null) {
				dragDayHourStart=getDayTime2(coords);
			}
		}
		if (dragDayHourStart!=null) {
			
			if (isTouch) {
				if (ev) ev.preventDefault();
			}
			
			var dayHour=getDayTime2(coords);
			// See if any change:
			if (dayHour!=null && (dragDayHourUnderMouse==null || dayHour.day!=dragDayHourUnderMouse.day || dayHour.hour!=dragDayHourUnderMouse.hour)) {
				dragDayHourUnderMouse=dayHour;
				refreshCurrentBusyBlock(dragDayHourStart,dayHour);
			}
		} else if (isTouch && now<(touchTime+1400) && Math.abs(coords.x-startCoords.x)>130 && Math.abs(coords.y-startCoords.y)<100) {
			// Do swipe
			if (coords.x<startCoords.x) {
				// left
				UU.caseNextResult(); //go next and do not allow scroll
			} else {
				// right
				UU.casePrevResult(); //got prev and do not allow scroll
			}
			touchTime=null;
			startCoords=null;
			ev.preventDefault();
			return false;
		}
	}

	
	function mouseUp(ev) {
		return mouseUp2(ev,false);
	}

	function touchEnd(ev) {
		return mouseUp2(ev,true);
	}
	
	function mouseUp2(ev,isTouch) {
		if (startCoords==null || BB.enrollMode || BB.popuplive || (BB.page!="results" && !BB.wideScreen) || schedulePos==null) {
			return true;
		}
		if (holdTimeout) {
			clearTimeout(holdTimeout);
			holdTimeout=null;
		}
		coords = mouseCoords(ev);
		var now=(new Date()).getTime();
		
		//consolelog("up x:"+Math.abs(coords.x-startCoords.x)+" y:"+Math.abs(coords.y-startCoords.y));
		//consolelog("now:"+now);
		//consolelog("ttt:"+touchTime);
		
		if (dragDayHourStart==null && Math.abs(coords.x-startCoords.x)<7 && Math.abs(coords.y-startCoords.y)<7) {
			// Do Tap
			tap=true;
			setTimeout(function() {tap=false;},100);
			var $o=overTimeBlock(ev);
			if ($o!=null) {
				ev.preventDefault();
				var selkey=$o.data("selkey");
				var pinned=$o.data("pinned");
				if (isPinning && pinned!=null) {
					addPin(ev,selkey,!pinned,'no');	
				}
				touchTime=null;
				startCoords=null;
				return false;
			} else {
				var dayHour = getDayTime2(coords);
				dragDayHourStart=dayHour;
				dragDayHourUnderMouse=dayHour;
			}
		}
		if (dragDayHourStart!=null && dragDayHourUnderMouse!=null) {
			// Do Drag complete.
			var ds=dragDayHourStart;
			var de=dragDayHourUnderMouse;
			setTimeout(function() {
				UU.caseChangePersonalTimeBlock(self.d1,self.d2,{day:ds.day,hour:ds.hour},{day:de.day,hour:de.hour});
			},20)
		}
		touchTime=null;
		startCoords=null;
		dragDayHourStart=null;
		dragDayHourUnderMouse=null;
		return true;
	}
	
	function overTimeBlock(ev) {
		var $t=$(ev.target);
		if ($t.hasClass("time_block")) return $t;
		var $tp=$t.parent();
		if ($tp.hasClass("time_block")) return $tp;
		var $tp=$tp.parent();
		if ($tp.hasClass("time_block")) return $tp;
		return null;
	}
		
	function refreshCurrentBusyBlock(dayHourA,dayHourB) {
		var r = sortDayHours(dayHourA,dayHourB);
		var dayHour1 = r.first;
		var dayHour2 = r.last;

		refreshes++;
		var $busyDiv=$divSchedule.find(".currentBusyBlocks");
		$busyDiv.empty();
		for (var d=dayHour1.day; d<=dayHour2.day; d++) {
			var timeblock = new TimeBlock(0,d,dayHour1.hour*60,dayHour2.hour*60+60,0,0,"");
			var pos = getBlockPosition(timeblock);

			// Create new element
			var el = document.createElement('div');
			el.setAttribute("class","busy_block");
			el.setAttribute("className","busy_block");
			el.style.cssText = "left:"+pos.leftp+"%;top:"+pos.top+"px;width:"+pos.widthp+"%;height:"+pos.height+"px;";
			$busyDiv[0].appendChild(el);
		}
	}
	
	function refreshBusyBlocks(gState) {
		
		$divSchedule.find(".busy_block").remove();
		
		if (gState==null) return;
		
		var $weekTimes = $divSchedule.find(".weekTimes");
		var bd=$weekTimes[0];
		
		for (var blocki=0; blocki<gState.bbs.length; blocki++) {
			var busyBlock=gState.bbs[blocki];

			// Skip if doesn't apply to range.
			if (busyBlock.d2<self.d1 || busyBlock.d1>self.d2) {
				continue;
			}
			
			var d=busyBlock.day;
			var timeblock = new TimeBlock(0,d,busyBlock.hourStart*60,busyBlock.hourEnd*60+60,0,0,"");
			var pos = getBlockPosition(timeblock);

			// Create new element
			var el = document.createElement('div');
			el.setAttribute("class","busy_block");
			el.setAttribute("className","busy_block");
			el.setAttribute("title",i8n.clickToRemove);
			el.style.cssText = "left:"+pos.leftp+"%;top:"+pos.top+"px;width:"+pos.widthp+"%;height:"+pos.height+"px;";
			if (bd.childElementCount>0) {
				bd.insertBefore(el,bd.childNodes[0]);
			} else {
				bd.appendChild(el);
			}
		}

		if(Profiler.exists()) {
			Profiler.get("blockUsage").updateBlocks();
		}
	}
	
	function addAvoidTime(string) {
		var french=false;
		if (BB.lang=="fr") french=true;
		var days1=["lordsday","sunday","monday","tuesday","wednesday","thursday","friday","saturday","sabbath"];
		var days2=["d","d","m","t","w","r","f","s","s"];
		var days3=["d","m","t","w","r","f","s"];
		if (french) {
			days1=["dimanche","lundi___","mardi___","mercredi","jeudi___","vendredi","samedi__","sabbat__"];
			days2=["d","q","t","w","r","f","s","s"]; // q is to prevent Monday from becoming Mardi.
			days3=["d","q","t","w","r","f","s"];
		}
		var t=string;
		t=t.toLowerCase();
		t=t.replace(" ","");
		t=t.replace("'","");
		if (french) {
			t=t.replace(" a ","-");
			t=t.replace(" à ","-");
		} else {
			t=t.replace("to","-");
		}
		t=t.replace("until","-");
		t=t.replace("through","-");
		t=t.replace("from","");
		t=t.replace("am","y");
		t=t.replace("pm","z");
		if (french) {
			t=t.replace("avant",">");
			t=t.replace("apres","<");
			t=t.replace("après","<");
		} else {
			t=t.replace("after",">");
			t=t.replace("before","<");
		}
		t=t.replace(/:\d\d/g, "");
		if (french) {
			t=t.replace("mm", "marmer");			
		} else {
			t=t.replace("ss", "ds");
			t=t.replace("tt", "tr");
			t=t.replace("wt", "wr");
			t=t.replace("sm", "dm");
			t=t.replace("st", "dt");
			t=t.replace("sw", "dw");
			t=t.replace("sr", "dr");
			t=t.replace("sf", "df");
		}
		for (var c=0;c<10;c++) {
			for (var i=0; i<days1.length; i++) {
				var d1=days1[i];
				if (d1.length<(french?1:2)) continue;
				var d2=days2[i];
				
				t=t.replace(d1,d2);
				
				// Chop off last character
				days1[i]=days1[i].substr(0,days1[i].length-1);
			}
		}
		
		//alert(t);
		
		var days=new Array();
		var prevDay=null;
		var firstDay=null;
		// Extract days
		for (var i=0;i<t.length;i++) {
			var c=t.charAt(i);
			if (c=='-' && prevDay!=null) {
				firstDay=prevDay;
			} else {
				for (var d=0;d<days3.length;d++) {
					if (c==days3[d]) {
						days.push(d);
						if (firstDay!=null) {
							// There was a range.
							for (var d2=firstDay+1;d2<d;d2++) {
								days.push(d2);
							}
							firstDay=null; // stop the range
						}
						prevDay=d;
						break;
					}
				}
			}
		}
		
		// Extract hours
		var h1="";
		var h1pm=null;
		var h2="";
		var h2pm=null;
		var on1=true;
		for (var i=0;i<t.length;i++) {
			var c=t.charAt(i);
			if (c>='0'&&c<='9') {
				if (on1) {
					h1+=c;
				} else {
					h2+=c;
				}
			} else if (c=='y'||c=='z') {
				if (on1) {
					h1pm=(c=='z');
				} else {
					h2pm=(c=='z');
				}
			} else if ((c=="-" && h1!="") || c=="<") {
				on1=false;
			}
		}
		if (h1=="") h1="0";
		if (h2=="") h2="23";
		h1=+h1;
		h2=+h2;
		if (h1pm==null&&h2pm==null) h1pm=h2pm=false;
		if (h1pm==null&&h2pm!=null) h1pm=h2pm;
		if (h2pm==null&&h1pm!=null) h2pm=h1pm;
		if (h1pm&&h1<12) h1+=12;
		if (h2pm&&h2<12) h2+=12;
		if (h2pm&&h1>h2) h1-=12;
		if (!h1pm&&h1>h2) h2+=12;
		
		//alert("days:"+days+" t:"+h1+"-"+h2);
		
		var notice=i8n.added;
		for (var d=0;d<days.length;d++) {
			if (d>0) {
				notice+=", ";
			}
			var day=days[d]+1;
			notice+=getDay2(day);
			
			UU.caseChangePersonalTimeBlock(self.d1,self.d2,{day:day,hour:h1},{day:day,hour:(h2-1)},false);
		}
		notice+=" "+h1+":00 "+i8n.to+" "+h2+":00";

		var good=true;
		if (days.length<=0) {
			notice= i8n.ReviewExamples; // Could not understand input. Review examples.
			good=false;
		} else {
			$divSchedule.find(".timesToAvoidBubble").slideUp(800);
		}
		setAvoidNotice(notice,good);
		$divSchedule.find(".add_avoid_time").val("");
		
	}

	function setAvoidNotice(message,good) {
		var $an=$divSchedule.find(".avoidNotice");
		$an.removeClass("warningNote"+(good?"Bad":"Good"));		
		$an.addClass("warningNote"+(good?"Good":"Bad"));
		$an.html("<span role=\"alert\">"+message+"</span>");
	}
	
	function clearAvoidTimes() {
		UU.caseClearPersonalTimeBlocks();
		setAvoidNotice(i8n.personalCleared,true);
		$divSchedule.find(".timesToAvoidBubble").slideDown(800);
	}

}