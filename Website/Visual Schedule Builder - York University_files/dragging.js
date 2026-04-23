
var DRAGGING = (function() {

	var my={};
	
	var draggingBusyBlock=false;
	var wasScrolling = false; //track scrolling
	

	// jquery debounce polyfill
	var debounce = function(func, threshold, execAsap) {
		var timeout;
		return function debounced() {
			var obj = this, args = arguments;
			function delayed() {
				if (!execAsap) {
					func.apply(obj, args);
				}
				timeout = null;
			}

			if (timeout) {
				clearTimeout(timeout);
			} else if (execAsap) {
				func.apply(obj, args);
			}

			timeout = setTimeout(delayed, threshold || 100);
		};
	}
	
	function mouseDown(ev) {

		if (popuplive) {
			return true;
		}
		
		wasScrolling = false;
		// consolelog("not scrolling 2");

		if ($("#page_results:visible").length<1) {
			return false;
		}

		if ($(ev.target).hasClass("time_block")) {
			draggingBusyBlock = false;
			return false;
		}

		draggingBusyBlock = true;

		// We must do this the first time:
		schedulePos = getPosition($e("weekArea"));
		schedule.dayWidth=$("#weekArea").width()/(schedule.lastDay-schedule.firstDay+1);

		dragDayHourStart = getDayTime(ev);


		if (dragDayHourStart!=null) {
			return false; // avoid text selection
		}
		return true;
	}
	
	function mouseMove(ev){

		if (popuplive) {
			return true;
		}
		if (dragDayHourStart==null) {
			return true;
		}
		var dayHour = getDayTime(ev);
		if (dayHour==null) {
			return true;
		}


		if (dragDayHourUnderMouse!=null) {
			// See if any change:
			if (dragDayHourUnderMouse.day!=dayHour.day || dragDayHourUnderMouse.hour!=dayHour.hour) {
				dragDayHourUnderMouse=dayHour;
				refreshCurrentBusyBlock(dragDayHourStart,dayHour);
			}
		} else {
			dragDayHourUnderMouse=dayHour;
			refreshCurrentBusyBlock(dragDayHourStart,dayHour);
		}
		return false;

	}
	
	function mouseUp(ev) {

		if (!draggingBusyBlock || enrollMode || popuplive) {
			return true;
		}

		draggingBusyBlock = false;
		var dayHour = getDayTime(ev);
		if (dragDayHourStart!=null && dayHour!=null) {
			dragDayHourEnd = dayHour;
			
			// We need to do this by timeout due to FF bug:
			setTimeout("addBusyBlock({day:"+dragDayHourStart.day+",hour:"+dragDayHourStart.hour+"},{day:"+dragDayHourEnd.day+",hour:"+dragDayHourEnd.hour+"});",20);

		}
		// We need to do this by timeout due to FF bug:
		setTimeout("clearChildren($e('currentBusyBlock0'));",20);

		dragDayHourStart = null;
		return true;
	}
	
	//initialize calendar drag functionality
	my.dragInit = function() {
	
		//TODO
		//schedulePos = getPosition($e("weekTimes0"));
	
		function is_touch_device() {
			return !!('ontouchstart' in window);
		}	
		
		// TODO
//		if (is_touch_device()) { // touch events
//			$(document).on("touchstart", touchStart);
//			$(document).on("touchmove ", touchMove);
//			$(document).on("touchend", touchEnd);
//		} else { // desktop events
//			$(document).on("mousedown", mouseDown);
//			$(document).on("mousemove", mouseMove);
//			$(document).on("mouseup", mouseUp);
//		}
		
		//track scrolling status
		$(window).scroll(debounce(  function(){
			//console.log("scrolling");
			wasScrolling = true;
		},250, true ) );
	
		//TODO
		//schedule = new Schedule();
		$('.selectmorevalhideshow, .selectmoreval').hide();
	
	}
	
	return my;

}());