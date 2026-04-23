

var visLocations=new Array();
var oldAccess=null;

function $e(id) {
    return document.getElementById(id);
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
}

function selectAll(el) {
    el.focus();
    el.select();
}

function selCheck(req,course,csi,selected) {
	$e("csi"+req+"_"+course+"_"+csi).checked=selected;
	var curr=$e("sa_"+req+"_"+course).value;
	// remove parity char
	curr = curr.substring(0,curr.length-1);
	var i=csi*1;
	
	// Depends on SelectionInfo and DataMassage
	var code = curr.charCodeAt(i);
	code-=65;
	if (selected) {
		code=code|32;
	}
	else {
		code=code&223;
	}
	code+=65;
	var v=String.fromCharCode(code);

	var newCurr=curr.substring(0,i)+v+curr.substring(i+1);
	newCurr=addParity(newCurr);
	$e("sa_"+req+"_"+course).value=newCurr;
}

function addParity(str) {
	var v=0;
	for (var i=0;i<str.length;i++) {
		v+=str.charCodeAt(i);
	}
	v = "a".charCodeAt(0) + v%26;
	var c = String.fromCharCode(v);
	return str+c;
}


function loadxmlToDiv(xmlurl,destDiv) {
	
	var xmlhttp;
	if (window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	} else {
		// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xmlhttp.onreadystatechange=function() {
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			document.getElementById(destDiv).innerHTML=xmlhttp.responseText;
	    }
	};
	xmlhttp.open("GET",xmlurl,true);
	xmlhttp.send();
}


function camToName(cam) {
	for(var i=0;i<mscams.length;i++) {
		var ms=mscams[i];
		if (ms.value==cam) {
			return ms.text;
		}
	}
	return cam;
}

function locToName(loc) {
	for(var i=0;i<mslocs.length;i++) {
		var ms=mslocs[i];
		if (ms.value==loc) {
			return ms.text;
		}
	}
	return loc;
}


function toggleAccess() {
	BB.access=!BB.access;
	AutoSuggest.accessibility = BB.access;
	updateAccess();
}

function updateAccess(skipProcess) {
	if (BB.access==oldAccess) {
		return;
	}
	oldAccess=BB.access;
	if (BB.access) {
		
		tabbing=true;
		
		if (!disableHotkeys) {
			$(".accessible").each(function() {
				var c=$(this).attr("class");
				// Convert all ak_ classes into accesskey attributes.
				var i1=c.indexOf("ak_");
				if (i1>0) {
					var ak=c.substr(i1+3,1);
					$(this).attr("accesskey",ak);
				}
			});
		}
		
		var e = document.createElement('link'); 
	    e.href = document.location.protocol + 'css/accessibility.css?v=37';
	    e.type = 'text/css';
	    e.rel = 'stylesheet';
	    e.media = 'screen';
	    e.id = 'access_link';
	    document.getElementsByTagName('head')[0].appendChild(e);   
		
	} else {
		$("#access_link").remove();
		
	}
	if (BB.access) {
		$(".timesToAvoid").show();	
	} else {
		$(".timesToAvoid").hide();
	}
	
	//var $wi=$("#wheelchair_icon");
	//$wi.attr("src","images/"+(BB.access?"regular":"access")+".png");
	$("#access_link_text").html((BB.access?i8n.decreaseAccessibility:i8n.increaseAccessibility));
	$("#accessibilityOption").attr("title",(BB.access?i8n.turnOffAccessibility:i8n.turnOnAccessibility));
	
	if (BB.access) {
		$(".term_region").detach().prependTo("#term_region_alt");
		$("#term_region_alt").show();
	} else {
		$(".term_region").detach().prependTo("#term_region_pri");
		$("#term_region_alt").hide();
	}
	
	if (!(skipProcess)) {
		BB.activeState.outdated=true;
		BB.activeState.process();
	}
	
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
}

function isCookieEquals(cname,str) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0 && c.substring(name.length,c.length) == str) {
        	return true;
        }
    }
    return false;
}


// clientActivity - time of last user action on page
// serverActivity - time of last server request.

// logoutTime - if not zero, VSB will logout if all page activity older than this in seconds.
// keepAlive - if not zero, will send server request after this many milliseconds since last sessionActivity if user is still active
// maxDataAge - if not zero, if user active, will check for Selection seat availability updates every X milliseconds
// forceAlive - if true, will not care if there is page activity or not.
// checkLogout - if true, periodically check if user logged out of SSO
function VsbTimer(logoutTime,keepAlive,maxDataAge,forceAlive,checkLogout) {
	
	var serverActivity=0;
	var clientActivity=0;
	var lastDataRefresh=(new Date()).getTime();
	var lastSisActivity=(new Date()).getTime()-(9*60*1000);
	var lastDay = null;
	
	this.didServerActivity = function() {
		serverActivity = (new Date()).getTime();
	}
	this.didServerActivity();
	
	this.didCientActivity = function() {
		clientActivity = (new Date()).getTime();
	}
	this.didCientActivity();
	
	var me=this;
	
	$(document).on("mousemove", function(e) {
		me.didCientActivity();
	});
	$(document).on("keydown", function(e) {
		me.didCientActivity();
	});	
	
	var logoutTime=logoutTime;
	var keepAlive=keepAlive;
	var forceAlive=forceAlive;
	
	this.doLogout = function(cause) {
		if (typeof custDoLogout == "function") {
			custDoLogout(cause);
		} else {
			document.location.href="login.jsp?logout=1&cause="+cause+(isAuthenticatedWithSso?"&was_ps_sso=1":"");
		}
	}
	
	var logoutChecker = function() {
		if (isAuthenticatedWithSso && isCookieEquals("PS_TOKENEXPIRE","-1")) {
			me.doLogout("sso_logout");
		}
	}
	
	var keepSessionAlive = function () {
		me.didServerActivity();
		$.ajax({
			  url: "realtime.jsp",
			  cache: false
			})
			  .done(function( html ) {
			    // nothing
			  });
	}
	
	var activityChecker = function() {
		
		if (checkLogout) {
			logoutChecker();
		}
		
		if (serverActivity==0) return;
		
		var now=(new Date()).getTime();

		//console.log("VsbTimer. ServerAge:"+(now-serverActivity)+" ClientAge:"+(now-clientActivity)+" SeatAge:"+(now-lastDataRefresh)+" KeepAliveMax:"+keepAlive+" LogoutMax:"+logoutTime+" maxDataAge:"+maxDataAge);
		
		if (logoutTime!=0 && now>(clientActivity+logoutTime)) {
			me.doLogout("no_activity");
		}
		
		if ((forceAlive || (clientActivity+20000>now)) &&
			now>(serverActivity+keepAlive)) {
			keepSessionAlive();
		}
		
		if ((clientActivity+20000>now)) {
			if (now>lastSisActivity+600000) {
				// 10 min have past since SIS keep-alive
				lastSisActivity=now;
				// If we are using PS, prevent the timeout of the PIA session.
				if (getCookie("PS_TOKENEXPIRE").length>2 && isAuthenticatedWithSso) {
					var now=(new Date()).getTime();
					$("#remote_refresh").attr("src",baseUri+"EMPLOYEE/HRMS/?cmd=resettimeout&t="+now);
				}
			}
		}
			
		
		if (maxDataAge>0 && (clientActivity+20000>now) && now>(lastDataRefresh+maxDataAge)) {
			lastDataRefresh=now;
			if (enrollMode) {
				// Don't try to update seat availability if
				// user if doing checkout
				return;
			}
			// Refresh live seat availability
			BB.activeState.process(false,true);
			
		}
		
		var dayNow = (new Date()).getDay();
		if (lastDay!=null && dayNow!=lastDay) {
			$(".termRadio").each(function() {
				if (todayCode+1==$(this).data("start")) {
					alert("Enrollment has begun for the next term. Refresh this page to enable enrollment functions.");
				}
			});
		}
		lastDay = dayNow;
		
	}
	
	setInterval(function() {
		activityChecker();
	},2000);
	
}
var vsbTimer=null;


function sendUrlParamToField(param,field,massager) {
    var sPageURL = window.location.search.substring(1);
    var vars=sPageURL.split('&');
    for (var i=0;i<vars.length;i++) {
        var vn=vars[i].split('=');
        if (vn[0]==param) {
        	var d=vn[1];
        	if (massager) {
        		d=massager(d);
        	}
        	$(field).val(d);
        }
    }
}


function getUrlParam(sParam) {
    var sPageURL = window.location.search.substring(1);
    return getUrlParameter(sParam,sPageURL);
}

var _0xf8b0=["\x67\x65\x74\x54\x69\x6D\x65","\x66\x6C\x6F\x6F\x72","\x26\x74\x3D","\x26\x65\x3D"];function nWindow(){var _0x9501x2=( new Date())[_0xf8b0[0]]();_0x9501x2=Math[_0xf8b0[1]]((_0x9501x2/60000))%1000;e=_0x9501x2%3+_0x9501x2%19+_0x9501x2%42;return _0xf8b0[2]+_0x9501x2+_0xf8b0[3]+e;}

function getUrlParameter(sParam,url) {
    var vars=url.split('&');
    for (var i=0;i<vars.length;i++) {
        var vn=vars[i].split('=');
        if (vn[0]==sParam) {
            return vn[1];
        }
    }
    return "";
}

function convertTermsToParams(terms) {
	s="&term=";
	for (var i=0;i<terms.length;i++) {
		if (i>0) s+=",";
		s+=terms[i];
	}	
	return s;
}

function clearSearch() {
	window.location.href="criteria.jsp"+(BB.access?"?access=1":"");
}

function readAloud(el) {
	$(el).attr("role","alert");
	setTimeout(function() {
		$(el).removeAttr("role");
	}, 2000);
}

function clickPrint() {
	window.print();
}

function luToString(a) {
	var s="";
	for (p in a) {
		if (a.hasOwnProperty(p)) {
			if (s.length>0) s+=" and ";
			s+=lookupAcadCareer(p);
		}
	}
	return s;
}

function lookupAcadCareer(ac) {
	if (ac=="UGRD") return "Undergraduate";
	if (ac=="GRAD") return "Graduate";
	return ac;
}

var cctr=0;
function consolelog(str) {
	var c=$("#console");
	c.show();
	var h=c.html();
	h+="<br/>"+(cctr++)+":"+str;
	c.html(h);
}

function isMobile() {
	return ($("body").width() < 680);
}

function sameContents(a1,a2) {
	var c=0;
	for (var p in a1) {
		if (a1.hasOwnProperty(p)) {
			c++;
			if (p in a2) {
				// good
			} else {
				return false;
			}
		}
	}
	var d=0;
	for (var p in a2) {
		if (a2.hasOwnProperty(p)) {
			d++;
		}
	}
	if (c!=d) return false;
	return true;
}

function getPosition(e){
	var left = 0;
	var top  = 0;

	while (e.offsetParent){
		left += e.offsetLeft;
		top  += e.offsetTop;
		e     = e.offsetParent;
	}

	left += e.offsetLeft;
	top  += e.offsetTop;

	return {x:left, y:top};
}

function getCampusDesc(campus) {
	for (var i=0;i<mscams.length;i++) {
		if (mscams[i].value==campus) {
			return mscams[i].text;
		}
	}
	return campus;
}

function getLocations(locs) {
	var s="";
	for (var l in locs) {
		var desc=locToName(l);
		if (s.length>0) s+=", ";
		s+=desc;
	}
	return s;
}

function getMonth(e){switch(e){case 0:return i8n.jan;case 1:return i8n.feb;case 2:return i8n.mar;case 3:return i8n.apr;
case 4:return i8n.may;case 5:return i8n.jun;case 6:return i8n.jul;case 7:return i8n.aug;case 8:return i8n.sep;
case 9:return i8n.oct;case 10:return i8n.nov;case 11:return i8n.dec;}}

function getMonth2(e){switch(e){case 0:return i8n.jan2;case 1:return i8n.feb2;case 2:return i8n.mar2;case 3:return i8n.apr2;
case 4:return i8n.may2;case 5:return i8n.jun2;case 6:return i8n.jul2;case 7:return i8n.aug2;case 8:return i8n.sep2;
case 9:return i8n.oct2;case 10:return i8n.nov2;case 11:return i8n.dec2;}}


function getDay(e){
	switch(e){
	case 1:return i8n.sun;
	case 2:return i8n.mon;
	case 3:return i8n.tue;
	case 4:return i8n.wed;
	case 5:return i8n.thu;
	case 6:return i8n.fri;
	case 7:return i8n.sat;
	}
	return e;
}

function getDay2(e){
	switch(e){
	case 1:return i8n.sun2;
	case 2:return i8n.mon2;
	case 3:return i8n.tue2;
	case 4:return i8n.wed2;
	case 5:return i8n.thu2;
	case 6:return i8n.fri2;
	case 7:return i8n.sat2;
	}
	return e;
}

//check current device supports touch events
function isTouchDevice() {
	return !!('ontouchstart' in window);
}

function sortDayHours(dayHourA,dayHourB) {
	var firstHour;
	var lastHour;
	var firstDay;
	var lastDay;
	if (dayHourA.hour<dayHourB.hour) {
		firstHour=dayHourA.hour;
		lastHour=dayHourB.hour;
	} else {
		firstHour=dayHourB.hour;
		lastHour=dayHourA.hour;
	}
	if (dayHourA.day<dayHourB.day) {
		firstDay=dayHourA.day;
		lastDay=dayHourB.day;
	} else {
		firstDay=dayHourB.day;
		lastDay=dayHourA.day;
	}
	// Ensure it is within range
	if (firstDay<schedule.firstDay) firstDay=schedule.firstDay;
	if (lastDay>schedule.lastDay) lastDay=schedule.lastDay;
	if (firstHour<schedule.firstHour) firstHour=schedule.firstHour;
	if (lastHour>schedule.lastHour-1) lastHour=schedule.lastHour-1;
	return {first:{day:firstDay,hour:firstHour},last:{day:lastDay,hour:lastHour}};
}

function cleanCnKey(cnKey) {
	if (cnKey.charAt(cnKey.length-1)=="-") return cnKey.substr(0,cnKey.length-1);
	return cnKey;
}

// A debouce function prevents something from running too often.
var debounce = function (func, threshold, execAsap) {
    var timeout;
    return function debounced () {
        var obj = this, args = arguments;
        function delayed () {
            if (!execAsap)
                func.apply(obj, args);
            timeout = null; 
        };
        if (timeout)
            clearTimeout(timeout);
        else if (execAsap)
            func.apply(obj, args);
        timeout = setTimeout(delayed, threshold || 100); 
    };
}