(function(scope) {
	/**
	 * The Profile class tracks the usage of VSB
	 * 
	 * Profiler.record(true | false); 				- Starts or stops recording
	 * Profiler.setParameterState("name", state) 	- Sets the state of a parameter (for examples filters ..)
	 * 
	 *  3 types of parameter
	 *  	- Time dependent (time)
	 *  	- Hit dependent (hit)
	 *  	- Custom (custom objects with known methods)
	 *  
	 *  False data prevention
	 *  	- The recording system stops itself after <preventionTime> seconds of inactivity on the page (no mouse moved, or key pressed)
	 *  	- The system will automatically resume activity when the user moves the mouse or hits a key
	 *  
	 *  Data release:
	 *  	- The system will report all data every "releaseInterval" seconds
	 *  	- Additionally, on the page unload, it will try to send the remaining data
	 */
	Profiler = { // Default parameters
		interval: null,
		recording: false,
		preventing: false,
		log: false,
		preventionTime: 20, // in seconds
		
		lastDataRelease: 0,
		releaseInterval: 30, // in seconds
		
		timeOut: null,
		isActivated: false,
		
		parameters: []
	};
	
	/**
	 * Contructor, by default Profiler doesn't record action, a Profiler.record(true) is required
	 */
	Profiler.init = function(_parameters) {
		var me = Profiler;
		
		me.isActivated = true;
		
		me.interval = setInterval(function() {
			if(me.recording) {
				me.lastDataRelease++;
				Profiler.update();
			}
			
			if(me.lastDataRelease >= me.releaseInterval) {
				me.reportToServer();
			}
		}, 1000);
		
		//me.parameters = _parameters;
		me.recording = true;
		
		// False data prevention
		$(document).on("mousemove", function(e) {
			me.listener();
		});
		$(document).on("keydown", function(e) {
			me.listener();
		});
		me.listener();
		
		// Report data before the user quits the page
		$(window).on("unload", function() {
			me.reportToServer();
		});
	}
	
	/**
	 * Function to determine is Profiler has been initiated or not
	 */
	Profiler.exists = function() {
		return Profiler.isActivated;
	}
	
	/**
	 * Reports to the API to record the session
	 */
	Profiler.reportToServer = function() {
		var me = Profiler;
		
		me.lastDataRelease = 0;
		
		if(!me.recording) {
			return;
		}
		
		var post = {};
		
		for(var i = 0; i < me.parameters.length; i++) {
			var param = me.parameters[i];
			
			// Construct data report
			if(param.type == "hit") {
				post[param.name] = param.value;
			} 
			if(param.type == "time") {
				post[param.name+"Duration"] = param.on;
				post[param.name+"DurationOFF"] = param.off;
			}
			if(param.type == "custom") {
				post[param.name] = param.createValueRepresentation();
			}
			
			if(param.reset) {
				param.value = 0;
				param.on = 0;
				param.off = 0;	
			}
		}
		post.schoolTermId = BB.activeState.term;
		
		$.ajax({
			method: "POST",
			url: "api/reportUsage",
			data: post
		})
		.done(function( msg, status ) {
			
		})
		.fail( function(xhr, textStatus, errorThrown) {
			// Report refused because client not authenticated
			if(xhr.status == 401) {
				Profiler.recording = false;
			}
	    });
	}
	
	/**
	 * PRIVATE METHOD
	 */
	Profiler.update = function() {
		var me = Profiler;
		
		if(!me.recording || me.preventing) {
			return;
		}
		
		for(var i = 0; i < me.parameters.length; i++) {
			if(me.parameters[i].type == "time") {
				me.parameters[i].validateType();
				me.parameters[i].increment();
			}
			if(me.parameters[i].type == "custom") {
				me.parameters[i].update();
			}
		}
		
		if(this.log) {
			me.print();
		}
	}
	
	/**
	 * ALIAS
	 * Adds a duration name to track
	 * @name name of the duration
	 * @state ON/OFF -> true/false
	 */
	Profiler.addDuration = function(name, state) {
		Profiler.setParameterState(name, state);
	}
	
	/**
	 * Sets a parameter state
	 * @param name - Name of the parameter
	 * @param state - if true, Profiler will count the seconds
	 */
	Profiler.setParameterState = function(name, state) {
		var me = Profiler;
		
		var param = me.getParameter(name);
		
		if(!param) {
			var param = new Parameter(name, "time", state);
			me.parameters.push(param);
		}
		
		param.state = state;
	}
	
	/**
	 * ALIAS
	 * The type of parameter that doesn't depend on time
	 */
	Profiler.recordHit = function(name) {
		Profiler.addValue(name, 1);
	}
	
	/**
	 * Adding a number to a "hit" parameter
	 * @param name of the parameter
	 */
	Profiler.addValue = function(name, number) {
		var me = Profiler;
		
		var param = me.getParameter(name);
		
		if(!param) {
			var param = new Parameter(name, "hit", true);
			me.parameters.push(param);
		}
		
		if(param.state) {
			param.value += number;
		}
	}
	
	/**
	 * Returns the parameter class
	 * @param name - Name of the parameter
	 * @return the parameter class if found, NULL otherwise
	 */
	Profiler.getParameter = function(_name) {
		var me = Profiler;
		
		for(var i = 0; i < me.parameters.length; i++) {
			if(me.parameters[i].name == _name) {
				return me.parameters[i];
			}
		}
		
		return null;
	}
	Profiler.get = Profiler.getParameter; // ALIAS
	
	/**
	 * Allows external program to go throught the list of parameters
	 * @param callback with one parameter (the parameter object)
	 */
	Profiler.forEach = function(callback) {
		for(var i = 0; i < me.parameters.length; i++) {
			var p = me.parameters[i];
			callback(p);
		}
	} 
	
	/**
	 * Adds a custom parameter
	 */
	Profiler.addCustom = function(name, obj) {
		var me = Profiler;
		
		var param = me.getParameter(name);
		
		if(!param) {
			var param = new Parameter(name, "custom", true);
			param.reset = false;
			me.parameters.push(param);
		}
		
		for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                param[key] = obj[key];
            }
        }
	}
	
	/**
	 * Prints the parameters states - For debug only
	 */
	Profiler.print = function() {
		var me = Profiler;
		
		if($("#profiler").length == 0) {
			$("body").append([
			     "<div id='profiler'></div>"
			].join(""));
			
			$("#profiler").css({
				position: "fixed",
				top: "0px",
				right: "0px",
				backgroundColor: "white",
				padding: "15px",
				border: "1px black solid"
			});
		}
		
		$("#profiler").html("<h3>Profiler log</h3>");
		for(var i = 0; i < me.parameters.length; i++) {
			var p = me.parameters[i];
			$("#profiler").append([
			      "<b>"+p.name+" ("+p.type+")</b>",
			      "<b>value</b> "+p.value+", ",
			      	"<b>ON</b> "+p.on+", ",
			      	"<b>OFF</b> "+p.off+" <b>"+(p.listening ? "" : "not")+" listening</b><br/>"
			].join(""));
		}
		
		if(me.preventing) {
			$("#profiler").append("<b style='color:red;'>False data prevention activated</b><br/>");
		}
		$("#profiler").append("Last data release: <b>"+(me.lastDataRelease == -1 ? "Never": me.lastDataRelease+" seconds ago")+"</br>");
	}
	
	/**
	 * Prevents false data by deactivating the system if no document event is recorded for
	 * more than <preventionTime> seconds
	 * Ex: Mouse move
	 */
	Profiler.preventFalseData = function() {
		var me = Profiler;
		
		me.recording = false;
		me.preventing = true;
	}
	
	Profiler.listener = function() {
		var me = Profiler;
		
		clearTimeout(me.timeOut);
		
		me.timeOut = setTimeout(function() {
			me.preventFalseData();
		}, 1000 * me.preventionTime);
		
		if(me.preventing) {
			me.recording = true;
			me.preventing = false;
		}
	}
	
	Profiler.activateOnlyParameters = function(listParameters) {
		var me = Profiler;
		
		for(var i = 0; i < me.parameters.length; i++) {
			me.parameters[i].listening = false;
		}
		
		for(var i = 0; i < listParameters.length; i++) {
			var name = listParameters[i];
			
			var param = me.getParameter(name);
			
			if(param != null) {
				param.listening = true;
			}
		}
	}
	
	Profiler.activateAllParameters = function() {
		var me = Profiler;
		
		for(var i = 0; i < me.parameters.length; i++) {
			me.parameters[i].listening = true;
		}
	}
	
	/**
	 * The parameter class, allows to store the state/time of a parameter
	 */
	function Parameter(name, type, state, reset) {
		this.name = name;
		this.state = state;
		this.value = 0;
		this.type = type;
		this.reset = reset || true;
		this.listening = true;
		
		this.on = 0;
		this.off = 0;
		
		this.increment = function() {
			if(Profiler.preventing || !this.listening) {
				return;
			}
			
			if(this.state) {
				this.value++;
			}
			
			if(this.state) {
				this.on++;
			} else {
				this.off++;
			}
		}
		
		this.validateType = function() {
			return this.type;
		}
		
		this.createValueRepresentation = function() {
			return "";
		}
		
		this.update = function() {};
	}
	
	// Global Scope
	window.Profiler = Profiler;
	
	// DECLARING EVENTS
	Profiler.addValue("schedulesGenerated", 0);
	Profiler.addValue("scheduleFlips", 0);
	Profiler.addValue("scheduleGenerationRequests", 0);
	Profiler.addDuration("total", true);
	
	Profiler.addDuration("sortNone", false);
	Profiler.addDuration("sortDaysOff", false);
	Profiler.addDuration("sortMorning", false);
	Profiler.addDuration("sortMidday", false);
	Profiler.addDuration("sortEvening", false);
	Profiler.addDuration("sortTimeAtSchool", false);
	Profiler.addDuration("sortTimeInClass", false);
	
	Profiler.addDuration("filterOutFull", false);
	Profiler.addDuration("filterOutWaitlistable", false);
	Profiler.addDuration("filterOutOnline", false);
	Profiler.addDuration("filterOutOnCampus", false);
	
	Profiler.addCustom("blockUsage", {
		track: [],
		
		createValueRepresentation: function() {
			var me = Profiler.get("blockUsage");
			
			// Create the string that is send to VsbPublicAPI
			var blocks = me.track;
			var value = "";
			
			for(var i = 0; i < blocks.length; i++) {
				var b = blocks[i];
				if(b.duration == 0) { continue; }
				
				value += b.day+":"+b.hourStart+":"+b.minute+":"+b.duration+";";
			}
			
			me.updateBlocks();
			//console.log("sending "+value);
			return value;
		},
		
		update: function() {
			var me = Profiler.get("blockUsage");
			
			for(var i = 0; i < me.track.length; i++) {
				if(me.track[i].toAdd) {
					me.track[i].duration++;
				}
			}
		},
		
		updateBlocks: function(block) {
			var me = Profiler.get("blockUsage");
			for(var i = 0; i < me.track.length; i++) {
				me.track[i].toAdd = false;
				me.track[i].duration = 0;
			}
			
			for(var i = 0; i < BB.activeState.bbs.length; i++) {
				var b = BB.activeState.bbs[i];
				var start = b.hourStart;
				var end = b.hourEnd;
				
				for(var h = start; h <= end; h++) {
					if(b.day == "f") {
						continue;
					}
					
					var blockSmall1 = {
						day: b.day,
						hourStart: h,
						minute: 0
					};
					var blockSmall2 = {
						day: b.day,
						hourStart: h,
						minute: 30
					};
					
					if(me.has(blockSmall1)) {
						//console.log("tracking ");
						me.track[me.get(blockSmall1)].toAdd = true;
					} else {
						//console.log("adding");
						me.record(blockSmall1);
					}
					
					if(me.has(blockSmall2)) {
						//console.log("tracking ");
						me.track[me.get(blockSmall2)].toAdd = true;
					} else {
						//console.log("adding");
						me.record(blockSmall2);
					}
				}
			}
		},
		
		has: function(block) {
			var me = Profiler.get("blockUsage");
			return me.get(block) != -1;
		},
		get: function(block) {
			var me = Profiler.get("blockUsage");
			if(!block.minute) {
				return -1;
			}
			
			for(var i = 0; i < me.track.length; i++) {
				if(block.day == me.track[i].day &&
				   block.hourStart == me.track[i].hourStart &&
				   block.minute == me.track[i].minute) {
					return i;
				}
			}
			return -1;
		},
		
		record: function(block) {
			var me = Profiler.get("blockUsage");
			
			if(me.has(block)) {
				return;
			}
			
			block.duration = 0;
			block.toAdd = true;
			me.track.push(block);
		}
	});
	
	Profiler.addCustom("termUsed", {
		track: [],
		
		createValueRepresentation: function() {
			return getUsedTerm();
		}
	});
})(window);

// UTILS
function translateSortToParameter(value) {
	if(value == "none") {
		return "sortNone";
	}
	if(value == "daysoff") {
		return "sortDaysOff";
	}
	if(value == "morning") {
		return "sortMorning";
	}
	if(value == "midday") {
		return "sortMidday";
	}
	if(value == "evening") {
		return "sortEvening";
	}
	if(value == "timeatschool") {
		return "sortTimeAtSchool";
	}
	if(value == "timeinclass") {
		return "sortTimeInClass";
	}
}
function getUsedTerm() {
	return BB.activeState.term;
}

(function(scope) {
	var API = {
		base: "api/"	
	};
	
	API.call = function(fonction, post_data, callback) {
		if(post_data == null) {
			$.ajax({
				method: "GET",
				url: API.base+""+fonction
			})
			.done(callback);
		} else {
			$.ajax({
				method: "POST",
				url: API.base+""+fonction,
				data: post_data
			})
			.done(callback);
		}
	}
	
	window.API = API;
})(window);