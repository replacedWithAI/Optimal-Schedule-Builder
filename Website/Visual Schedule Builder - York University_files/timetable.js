function Timetable($dest,firstDay,lastDay,firstHour,lastHour) {
	var h="";
	h+="<table cellpadding='0' cellspacing='0'>";
	h+="<tr class='header'>";
	for (var d=firstDay;d<=lastDay;d++) {
		h+="<td>"+getDay(d)+"<span class='day_"+d+"_date'></span></td>";
	}
	h+="</tr>";
	for (var hr=firstHour;hr<lastHour;hr++) {
		h+="<tr class='even'>";
		for (var d=firstDay;d<=lastDay;d++) {
			h+="<td>&nbsp;";
			if (d==firstDay) {
				var disp=hr;
				var min="00";
				if (disp==0) {
					disp=12;
					min="am";
				} else if (disp==12) {
					min="pm";
				}
				if (disp>=13) {
					disp-=12;
				}
				h+="<div class='left_fade'><div class='hour_marker'>"+disp+"</div>";
				h+="<div class='min_marker'>"+min+"</div></div>";
			}
			h+="</td>";
		}
		h+="</tr>";
		h+="<tr class='odd'>";
		for (var d=firstDay;d<=lastDay;d++) {
			h+="<td>&nbsp;</td>";
		}
		h+="</tr>";
	}
	h+="</table>";
	$dest.html(h);
}

