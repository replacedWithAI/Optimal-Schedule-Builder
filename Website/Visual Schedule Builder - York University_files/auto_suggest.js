(function() {
	/**
	 * 3 packages:
	 * AutoSuggest 			- core
	 * AutoSuggest.access 	- accesibility utility
	 * AutoSuggest.render 	- dispaly manager
	 * AutoSuggest.util 	- utility functions
	 * 
	 * constructor:
	 * AutoSuggest.init(opts) - opts will override default configuration below
	 * 
	 * AutoSuggest.renderUI() - refreshes the UI
	 */
	
	if(typeof(AutoSuggest) != "undefined") {
		return;
	}
	
	/**
	 * Default configuration applied to the class, can be overriten with init() parameter
	 */
	AutoSuggest = {
		// PUBLIC VARIABLES
		target: "#code_number",
		showResults: 7,
		script: "add_suggest.jsp",
		accessibility: false,
		
		// PRIVATE VARIABLES
		results: [1,2,3,4,5,6],
		hidden: true,
		activeResult: -1,
		accessTimer: null,
		accessAnnouced: true,
		updateResize: true,
		updateScroll: true,
		
		// NAVIGATION constants
		NAVIGATION_DOWN: 40, // Arrow down
		NAVIGATION_UP: 38, // Arrow up
		ACTION: 13, // Enter
		ESC: 27 // Escape
	};
	
	/**
	 * Initiates the class and listeners
	 * @param opts - Overrides default configuration
	 */
	AutoSuggest.init = function(opts) {
		// Overriding
		for(key in opts) {
			AutoSuggest[key] = opts[key];
		}
		
		$(this.target)
			.keyup(function(event) {
				return AutoSuggest.handleKeyStroke.call(AutoSuggest, event);
			})
			.blur(function(event) {
				AutoSuggest.render.clear();
			});
			
		$(this.target).attr("role", "combobox")
					  .attr("autocomplete", "off");
		
		//$("body").attr("role", "application");
		
		setInterval(function() {
			AutoSuggest.render.updatePosition();
		}, 300);
		
		window.onresize = function() {
			var me = AutoSuggest;
			
			if(me.updateResize && !me.hidden) {
				me.updateResize = false;

				setTimeout(function() {
					me.render.updatePosition();
					me.updateResize = true;
				}, 100);
			}
		};
		
		window.onscroll = function(e) {
			var me = AutoSuggest;
			
			if(!me.hidden && me.updateScroll) {
				me.updateScroll = false;
				
				setTimeout(function() {	
					me.render.updatePosition();
					me.updateScroll = true;
				}, 100);
			}
		}
	};
	
	/**
	 * This methods will draw the UI/Update components according to class variables
	 */
	AutoSuggest.renderUI = function() {
		var me = AutoSuggest;
		var firsttime = me.hidden;
		
		me.hidden = false;
		
		if($("#suggestion_box").length == 0) {
			
			// The box doesn't exist
			//var html = [
			//     "<div id='suggestion_box' class='accessible ak_o' role='listbox'><div id='suggestion_container'></div></div>"
			//].join("");
			//
			//$("body").append(html);
			
			// Css of the box
			
			firsttime = true;
		}
		
		if(firsttime) {
			$("#suggestion_box").css({
				position: "absolute",
				top: "0px",
				left: "0px",
				color: "black",
				//maxWidth: "95%",
				maxWidth: "250px",
				zIndex: "99999"
			});
			
			$("#suggestion_container").css({
				marginTop: "10px",
				backgroundColor: "white",
				border: "1px solid rgb(26, 28, 81)",
				borderRadius: "3px",
				boxShadow: "2px 2px 5px #888888"
			});
			
			$("#suggestion_pointer").css({
				position:"absolute",
				top:"0px",
				left:"47%",
				height:"11px",
				width:"21px",
				backgroundImage: "url('images/sugg_ptr.gif')"
			});
		}
		
		$("#suggestion_box").show();

		me.render.list();
		me.render.updatePosition();
		
		if(firsttime) {
			var obj = $("#suggestion_box");
			
			$(obj).css("heigth", "0px");
			//$(obj).slideUp(0).slideDown(200);
		}
	}
	
	/**
	 * The render package manages the graphic behaviour of the elements
	 */
	AutoSuggest.render = {};
	
	/**
	 * Setting accesibility render
	 * @param accesibility
	 */
	AutoSuggest.render.setAccessibility = function(a) {
		AutoSuggest.accessibility = a;
	}
	
	/**
	 * Update the box position
	 */
	AutoSuggest.render.updatePosition = function() {
		var me = AutoSuggest;
		var	box = $("#suggestion_box");
		if (!box.is(":visible")) return;
		var pos = document.getElementById(me.target.replace("#", "")).getBoundingClientRect();
		
		var paddingW = parseInt($(me.target).css("padding-right"))*2;
		var paddingH = parseInt($(me.target).css("padding-top"))*2;
		
		var widthBox = $(box).width();
		var delta = widthBox-$(me.target).width();
		
		var leftMin = me.util.max(0, pos.left-(delta/2));
		
		var scrollTop = $(document).scrollTop();
		
		$(box).css({
			top: pos.top+$(me.target).height()+paddingH+scrollTop,
			left: leftMin,
			minWidth: $(me.target).width()+paddingW*2
		});
	}
	
	/**
	 * Set active result and fills the field
	 * @param index of result
	 */
	AutoSuggest.setActiveResult = function(index, force) {
		var me = AutoSuggest;
		
		me.activeResult = index;
		
		var replace = me.results[me.activeResult].name;
		
		var beginning = me.activeText.length;
		
		var end = replace.length;
		
		if (!$.isNumeric($(me.target).val()) || $(me.target).val().length<minLengthOfCrn) {
			// Only replace contents if we think it's not a CRN
			$(me.target).val(replace);
		}
		
		if(!me.accessibility) {
			me.util.setInputSelection(beginning, end);
		}
	}
	
	/**
	 * Render the result list
	 */
	AutoSuggest.render.list = function() {
		var me = AutoSuggest,
			results = me.results,
			container = $("#suggestion_container"),
			i = 0;
		
		var html = "";
		
		for(i = 0; i < me.util.min(me.results.length, me.showResults); i++) {
			var result = me.results[i];
			var style = "";
			var className = "";
			
			if(me.activeResult == i) {
				className = "autosuggest_selected";
			}
			
			html += [
			    "<a ",
			    	"href='javascript:void(0)' ",
			    	"aria-label='"+result.name+" "+result.info+"' ",
			    	"index='"+i+"' ",
			    	"role='option' ",
			    	"tabindex='-1' ",
			    	"class='autosuggest_focus "+className+"' ",
			    	"id='results_focus_"+i+"' ",
			    	">",
			    	"<span class='course_name_autocomplete'>",
			    	"<b>"+(result.core.length<=0?"":(me.util.highLightText(result.core, me.activeText)+" - "))+me.util.highLightText(result.name, me.activeText)+"</b>",
			    	"</span>",
			    	"<br/><span class='course_info_autocomplete'>"+me.util.highLightText(result.info, me.activeText)+"</span>",
			    "</a>"
			].join("");
		}
		
		container.html(html);
		
		if(me.accessibility) {
			$("#resultText").
				keyup(function(evt) {
					//console.log("keyup");
					return AutoSuggest.handleKeyStroke.call(AutoSuggest, evt);
				});
			
			$("a.autosuggest_focus", container).
				keyup(function(evt) {
					//console.log("keyup");
					return AutoSuggest.handleKeyStroke.call(AutoSuggest, evt);
				});
		}
		
		$("a.autosuggest_focus", container)
				.mouseover(function(evt) {
					var index = this.getAttribute("index");
					var me = AutoSuggest;
					
					if(me.activeResult != index) {
						AutoSuggest.setActiveResult(parseInt(this.getAttribute("index")));
						AutoSuggest.renderUI();
						$(AutoSuggest.target).focus();
					}
				});
	
		$("a.autosuggest_focus", container)
				.click(function(evt) {
					AutoSuggest.render.result(parseInt(this.getAttribute("index")));
		 });
		
		if(me.hasMore) {
			// More results
			container.append([
			    "<p id='moreResults'>...</p>"
			].join(""));
		}
		
		if(me.results.length == 0 && me.activeText != "") {
			container.append([
			     "<p>"+i8n.noResults+"</p>"
			]);
		}
		
		$("a", container).css({
			display: "block",
			padding: "5px",
			color: "black",
			margin: "3px",
			borderRadius: "3px"
		});
		$("a.autosuggest_selected", container).css({
			backgroundColor: "rgb(26,28,81)",
			color: "white"
		});
		
		$("p", container).css({
			padding: "5px",
			textAlign: "center",
			margin: "0px"
		});
		$("span.course_name_autocomplete", container).css({
			fontWeigth: "bold"
		});
		$("span.course_info_autocomplete", container).css({
			fontSize: "10px"
		});
	}
	
	/**
	 * Override active result
	 * @param index of result
	 */
	AutoSuggest.render.result = function(index) {
		var me = AutoSuggest;
		//console.log("render result");
		
		if(me.results[index] != undefined) {
			me.activeResult = index;
			$(me.target).val(me.results[me.activeResult].name);

			$(me.target).select();
			me.render.clear();
		}
	}
	
	/**
	 * Destroys the box
	 */
	AutoSuggest.render.clear = function() {
		$("#suggestion_box").slideUp(200, function() {
			
		});
		AutoSuggest.activeResult = -1;
		AutoSuggest.hidden = true;
	}
	
	/**
	 * USED INTERNALLY, handles a document event on the search field
	 * @param the event
	 */
	AutoSuggest.handleKeyStroke = function(evt) {
		var code = evt.keyCode,
			prevent = false,
			me = AutoSuggest;
		
		var maximumIndex = me.util.min(me.showResults, me.results.length-1);
		
		switch(code) {
			case me.NAVIGATION_UP:
				me.activeResult =
					me.activeResult - 1 < 0 ?
							maximumIndex :
							me.activeResult - 1;
					prevent = true;
				break;
			
			case me.NAVIGATION_DOWN:
				me.activeResult = 
					me.activeResult + 1 > maximumIndex ?
							0 : 
						    me.activeResult + 1; 
					prevent = true;
				break;
				
			case me.ACTION:
				if(true) {
					if(!me.hidden) {
						if(me.activeResult != -1) {
							if (!$.isNumeric($(me.target).val()) || $(me.target).val().length<4) {
								// Only replace contents if we think it's not a CRN
								$(me.target).val(me.results[me.activeResult].name);
							}
						}
						$(me.target).select();
						me.render.clear();
					}
					return;
				} else {
					me.render.clear();
				}
				break;
				
			case me.ESC:
				if(me.accessibility) {
					$(me.target).focus();
					me.activeResult = -1;
				} else {
					me.render.clear();
				}
				break;
				
			default:
				this.activeText = $(me.target).val();
				if(me.activeText != "") {
					this.queryResultsFor($(me.target).val());
				} else {
					me.render.clear();
				}
				break;
		}

		if(prevent) {
			if(me.activeText == undefined || me.activeText.length == 0) {
				me.render.clear();
			} else {
				me.renderUI();
				me.setActiveResult(me.activeResult);
			}
		}
		
		if(me.accessibility && 
				code != me.ACTION && 
				code != me.ESC && 
				code != me.NAVIGATION_DOWN && 
				code != me.NAVIGATION_UP) {
			if(me.accessTimer != null) {
				clearTimeout(me.accessTimer);
			}
			
			me.accessTimer = setTimeout(function() {
				//AutoSuggest.access.alert("There are "+me.results.length+" results. Use up and down arrows to browse.");
			}, 2000);
			
		}
		
		if(prevent) {
			return false;
		}
	}
	
	/**
	 * Initiates the request and keep track of the search text
	 * @param text to search
	 */
	AutoSuggest.queryResultsFor = function(text) {
		var me = AutoSuggest;
		
		var url = me.script+"?term="+BB.activeState.term+"&cams="+CC.setToStr(BB.activeState.cams)+"&"+me.varname+"="+encodeURIComponent(text);
		
		$.ajax({
			cache: false,
			url: url,
			dataType: "xml"
		}).done(function(answer) {
			AutoSuggest.processResponse.call(me, text, answer);
		});
	}
	
	/**
	 * Handles the request response
	 * @param text that was searched
	 * @param request - the actual response
	 */
	AutoSuggest.processResponse = function(text, response) {
		var me = AutoSuggest;
		
		// If the text has changed while querying results, we just throw the results in the garbage
		if(text != me.activeText) {
			return;
		}
		
		var response = (response);
		
		var resultsContainer = response
						.getElementsByTagName("results")[0];

		var results = resultsContainer
						.childNodes;
		
		me.results = [];
		me.hasMore = false;
		
		for(var i = 0; i < results.length; i++) {
			var result = results[i];
			
			if (!result.hasChildNodes()) {
				continue;
			}
			
			var _name = (result.childNodes[0].nodeValue);
			if(_name == "_more_") { me.hasMore = true; continue; }
			
			var it = result.getAttribute("info");
			if (template=="york") {
				it=it.replace(/-W(\d)(\d)\s\w{1,2}\s\w{1,2}/g, "-W$1$2");
				var two=it.match(/\((.+), (.+) only\)/);
				if (two!=null && two.length>=3 && two[1]==two[2]) {
					//it="("+two[2]+" only)";
					it=it.replace(", "+two[2],"");
				}
				it=it.replace(/in \d terms/,"in other terms");
			}
			
			me.results.push({
				id: result.getAttribute('id'),
				name: _name,
				info: it,
				core: result.getAttribute("core")
			});
		}
		me.accessAnnouced = false;
		me.activeResult = -1;
		
		me.renderUI();
	}
	
	/**
	 * accessibility package
	 */
	AutoSuggest.access = {};
	
	/**
	 * Sets the focus on annouceText
	 */
	AutoSuggest.access.annouceResults = function() {
		$("#suggestion_box #resultText").focus();
		AutoSuggest.accessAnnouced = true;
	}
	
	/**
	 * Creates an alert on the page
	 */
	AutoSuggest.access.alert = function(text) {
		var p = $("#alertJAWS");
		p.html(text);
		p.show();
		p.css({
			position: "absolute",
			top: "0px",
			left: "0px",
			height: "1px",
			width: "1px",
			overflow: "hidden"
		});
		
		setTimeout(function() {
			p.hide();
		}, 2000);
	}
	
	/**
	 * The util package regroups useful functions with nothing to do with AutoSuggest
	 */
	AutoSuggest.util = {};
	
	/**
	 * Return the max value found in arguments
	 * Ex: AutoSuggest.util.max(2,3,4,5,1) will return 5
	 * 
	 * @param list of numbers
	 * @return the max
	 */
	AutoSuggest.util.max = function() {
		var max = arguments[0];
		
		for(var i = 0; i < arguments.length; i++) {
			if(arguments[i] > max) {
				max = arguments[i];
			}
		}
		
		return max;
	}
	
	/**
	 * Return the min value found in arguments
	 * Ex: AutoSuggest.util.min(2,3,4,5,1) will return 1
	 * 
	 * @param list of numbers
	 * @return the min
	 */
	AutoSuggest.util.min = function() {
		var min = arguments[0];
		
		for(var i = 0; i < arguments.length; i++) {
			if(arguments[i] < min) {
				min = arguments[i];
			}
		}
		
		return min;
	}
	
	/**
	 * Wraps $text into spans from $string
	 * Also inserts <br/> every 50 characters
	 */
	AutoSuggest.util.highLightText = function($string, $text) {
		var r = $string;
		
		if(r == null || $text == null) {
			return $string;
		}
		
		var limit = 20;
		if(r.length > limit) {
			var parts = [];
			for(var i = 0; i*limit < r.length; i++) {
				parts.push(r.substring(i*limit, (i+1)*limit));
				//parts.push("<br/>");
			}
			r = parts.join("");
		}
		
		
		var m=AutoSuggest.util.fancyMatch($text,$string);
		var res=r;
		if (m.p2>0) {
			res=r.substring(0,m.p1)+"<span class='highlight' style='background-color:#f1c40f;'>"+r.substring(m.p1,m.p2)+"</span>"+r.substring(m.p2);
		}
		
		return res;
	}
	
	AutoSuggest.util.fancyMatch = function($text,$string) {

		// Find text in string, ignoring all non-alphanumeric characters
		$text=$text.toUpperCase().replace(/\W/g,'');
		var p1=0;
		var p2=0;
		var found=0;
		var skip=false; // don't highlight in HTML tags
		for (var i=0;i<$string.length&&p2==0;i++) {
			var c=$string[i].toUpperCase();
			if (c=='<') skip=true;
			if (c=='>') skip=false;
			if (skip) continue;
			if (c.replace(/\W/g,'').length==0) continue;
			for (var j=found;j<$text.length;j++) {
				if (c==$text[j]) {
					found++;
					if (j==0) p1=i;
					if (j==$text.length-1) p2=i+1;
					break;
				} else {
					i-=found;
					found=0;p1=0;p2=0;
					break;
				}
			}
		}
		return {p1:p1,p2:p2};
	}
	
	/**
	 * Returns the element absolute position on the page
	 * @param DOM element
	 */
	AutoSuggest.util.getOffSet = function(el) {
		var e = document.getElementById(el);

		var obj = e;

		var curleft = 0;
		if (obj.offsetParent)
		{
			while (obj.offsetParent)
			{
				curleft += obj.offsetLeft;
				obj = obj.offsetParent;
			}
		}
		else if (obj.x)
			curleft += obj.x;
		
		var obj = e;
		
		var curtop = 0;
		if (obj.offsetParent)
		{
			while (obj.offsetParent)
			{
				curtop += obj.offsetTop;
				obj = obj.offsetParent;
			}
		}
		else if (obj.y)
			curtop += obj.y;

		return {
			left:curleft, 
			top:curtop
		};
	}
	
	AutoSuggest.util.setInputSelection = function(startPos, endPos) {
		var input = document.getElementById(AutoSuggest.target.replace("#", ""));
		
        input.focus();
        if (typeof input.selectionStart != "undefined") {
            input.selectionStart = startPos;
            input.selectionEnd = endPos;
        } else if (document.selection && document.selection.createRange) {
            // IE branch
            input.select();
            var range = document.selection.createRange();
            range.collapse(true);
            range.moveEnd("character", endPos);
            range.moveStart("character", startPos);
            range.select();
        }
    };
	
	// Global Scope
	window.AutoSuggest = AutoSuggest;
})();