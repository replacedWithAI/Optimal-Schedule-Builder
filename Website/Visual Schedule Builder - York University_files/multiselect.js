"use strict";

// id = elementId of div to insert multiselect into
// param = Object of optional parameters
// items = Array of MultiselectItems
// callback = optional function that is called when an items checked state has changed.
function Multiselect(id,param,items,callback) {
	
	// Initialize Options
	this.oP=param?param:{};
	this.items=items;

	var k, def = {showSelectLink:true, showList:true, showBox:true, textAll: i8n.all, textNone: i8n.none,
			textListTitle: i8n.list, textBoxTitle: i8n.list, showSelectAllNone: true, showCloseButton: true,
			boxExpandedByDefault: false, textSelectShow: i8n.select, textSelectHide: i8n.select, textSelectTitle: i8n.showSelector, textSelectAll: i8n.selectAll, textSelectNone: i8n.selectNone,
			textClose:i8n.close, textCloseTitle: i8n.hideSelector, textNoneVisible: i8n.noneVisible, columns: 3, maxInList: 10, conserveCount: 100, disableCount: 200};
	for (k in def) {
		if (typeof(this.oP[k])!=typeof(def[k])) {
			this.oP[k] = def[k];
		}
	}
	
	var oP=this.oP;
	
	var $ms=$("#"+id);
	if ($ms.length<1) {
		alert("id of '"+id+"' not found");
	}
	this.$ms=$ms;
	
	
	// Define functions
	
	// Get column (starting at zero) for given item index.
	this.getCol = function(index,total) {
		if (total==0) return 0;
		if (index>=total) return 0;
		var cols=this.oP.columns;
		//var spots=total+(cols-total%cols);
		var spots=Math.ceil(total/cols)*cols;
		var col=Math.ceil((index+1)*cols/spots);
		return col-1;
		
	}
	
	// When converse is true, not shown items will not be in the DOM.
	this.conserve=false;
	
	this.updateDisplay = function() {
		
		var $boxCont=$ms.find(".msBoxCont");
		$boxCont.find(".boxcol").empty();
		var $mslistitemstart=$ms.find(".mslistitemstart");
		var $temp=$ms.find(".mslistitem");
		$temp.remove();
		
		
		var allShownItemsChecked=true;
		var allShownItemsNotChecked=true;
		var nbShown=0;
		var nbChecked=0;
		for (var i=0;i<items.length;i++) {
			var item=items[i];
			if (!item.show) continue;
			nbShown++;
			if (item.checked) nbChecked++;
		}
		if (items.length>this.oP.conserveCount) {
			this.conserve=true;
		}
		
		var lh="";
		var colhtml=new Array();
		for (var c=0;c<this.oP.columns;c++) {
			colhtml[c]="";
		}
		
		if (nbShown<=this.oP.disableCount) {  
			$ms.find(".msActBoxShow").toggle(this.oP.showSelectLink);
			var count=0;
			for (var i=0;i<items.length;i++) {
				var item=items[i];
				
				if (this.conserve && !item.show) continue;
				
				// Item on top
				lh+="<div class='msItemR msitem'><div class='msItemN'><div class='msItemT'>"+item.text+"</div><div class='msItemM' id='"+id+"List"+i+"' onclick='msSelect(\""+id+"\","+i+",false);'></div></div></div>";
				
				// Item in box
				var col=this.getCol(count,nbShown);
				var th="<li class='msitem'><input type='checkbox' class='mobile' id='"+id+"Box"+i+"' "+(item.checked?"checked='checked'":"")+" onchange='msSelect(\""+id+"\","+i+",this.checked);'><label for='"+id+"Box"+i+"'><span></span>"+item.text+"</label></li>";
				colhtml[col]+=th;
				count++;
			}
		} else {
			// Hide the box
			$ms.find(".msbox").hide();
			
			// Prevent Select from being selectable
			$ms.find(".msActBoxShow").hide();
			
			// Select every item that should be visible
			for (var i=0;i<items.length;i++) {
				var item=items[i];
				if (item.show) item.checked=true;
			}
		}
		
		$mslistitemstart.parent().find(".msitem").remove();
		$mslistitemstart.after(lh);
		
		
		for (var c=0;c<colhtml.length;c++) {
			$ms.find(".col"+c).html(colhtml[c]);
		}
		
	}
	
	
	this.msModelToDisplay = function(index) {
		var items=this.$ms.data("items");
		
		if (this.conserve) {
			// We must call this in case visibility of items has changed
			this.updateDisplay();
		}

		var allShownItemsChecked=true;
		var allShownItemsNotChecked=true;
		var nbShown=0;
		var nbChecked=0;
		for (var i=0;i<items.length;i++) {
			var item=items[i];
			if (!item.show) {
				continue;
			}
			nbShown++;
			if (!item.checked) {
				allShownItemsChecked=false;
			} else {
				nbChecked++;
				allShownItemsNotChecked=false;
			}
		}
		var tooManyChecked=(nbChecked>this.oP.maxInList?true:false);
		
		var $mstitle=this.$ms.find(".mstitle");
		if (allShownItemsChecked || allShownItemsNotChecked || tooManyChecked) {
			$mstitle.find(".msitem").hide();
			var $none=$mstitle.find(".textNone");
			$none.toggle((allShownItemsNotChecked || tooManyChecked) && !allShownItemsChecked);
			if (tooManyChecked) {
				$none.html(nbChecked+" of "+nbShown+" selected");
			} else {
				$none.html(this.oP.textNone);
			}
			var $all=$mstitle.find(".textAll");
			$all.toggle(allShownItemsChecked && !allShownItemsNotChecked);
			if (allShownItemsChecked) {
				$all.html(this.oP.textAll.replace("%n",nbShown));
			}
			$mstitle.find(".msAll").show();
		} else {
			$mstitle.find(".msAll").hide();
			$mstitle.find(".textNone").hide();
		}
		
		if(!allShownItemsChecked) {
			$mstitle.find(".msAll").show();
			$mstitle.find(".textAll").html("("+nbChecked+"/"+nbShown+")");
		}
		
		this.$ms.find(".textnonevisible").toggle(allShownItemsChecked && allShownItemsNotChecked);
		
		var min=0;
		var max=items.length;
		if (nbShown>this.oP.disableCount) max=0;
		//if (index!=undefined) {
		//	min=index;
		//	max=index+1;
		//}
		var itemDoms=new Array();
		var visibleItems=0;
		for (var i=min;i<max;i++) {
			var item=items[i];
			if (this.conserve && !item.show) {
				continue;
			}
			var checked=item.checked;
			// List
			$("#"+id+"List"+i).parents(".msitem").css("display", "");
			if(checked && item.show && !allShownItemsChecked && !tooManyChecked) {
				$("#"+id+"List"+i).parents(".msitem").removeClass("hidden");
			} else {
				$("#"+id+"List"+i).parents(".msitem").addClass("hidden");
			}
			//$("#"+id+"List"+i).parents(".msitem").toggle(checked && item.show && !allShownItemsChecked && !tooManyChecked);
			
			// Box
			var $cb=$("#"+id+"Box"+i);
			if (!checked && $cb[0].checked) {
				$cb[0].checked=false;
			} else if (checked) {
				$cb[0].checked=true;
			}
			var $parent=$cb.parents(".msitem");
			$parent.toggle(item.show);
			if (item.show) {
				visibleItems++;
			}
			if (index==undefined) {
				itemDoms[i]=$parent.remove();
			}
		}
		
		if (index==undefined) {
			var visI=0;
			var $cols=new Array();
			for (var i=min;i<max;i++) {
				var col=this.getCol(visI,visibleItems);
				
				if ($cols[i]==undefined) {
					$cols[i]=this.$ms.find(".col"+col);
				}
				var $colo=$cols[i];
				$colo.append(itemDoms[i]);
				
				if (items[i].show) {
					visI++;
				}
			}
		}
	}
	
	
	
	// Regular code:
	
	var t="";
	t+="<div class='mstitle'>";
	t+="<div class='msItemR mslistitemstart'><div class='msItemNb li'><div class='msItemTb'>"+this.oP.textListTitle+"</div></div></div>";
	t+="<div class='msAll'><div class='msItemR'><div class='msItemNb li'><div class='msItemTb'><span class='textAll'>"+this.oP.textAll+"</span><span class='textNone'>"+this.oP.textNone+"</span></div></div></div></div>";
	t+="<div class='msItemR msSelectDot'><div class='msItemNb li'><a href='javascript:void(0)' class='msItemTb a msActBoxShow ms_select_link'";
	t+="title='"+this.oP.textSelectTitle+"'>"+(this.oP.boxExpandedByDefault?this.oP.textSelectHide:this.oP.textSelectShow)+"</a></div></div>";
	t+="</div>";
	
	
	
	t+="<fieldset class='msbox'><legend style=\"display:none\">"+this.oP.textListTitle+"</legend>";

	t+="<div class='msboxtitle'>"+this.oP.textBoxTitle+"</div>";

	t+="<div class='msSelectAllDiv'><a href='javascript:void(0)' class='a msActSelectAll' onclick='msSelect(\""+id+"\",undefined,true);'>"+this.oP.textSelectAll+"</a> / <a href='javascript:void(0)' class='a msActSelectNone' onclick='msSelect(\""+id+"\",undefined,false);'>"+this.oP.textSelectNone+"</a></div>";

	t+="<div class='msBoxCont'>";
	
	for (var c=0;c<this.oP.columns;c++) {
		t+="<div class='msulwrapper wcol"+this.oP.columns+"'><ul class='boxcol col"+c+"'></ul></div>";
	}
	
	t+="<div class='msulwrapper wcol"+this.oP.columns+" textnonevisible'>";
	t+="<ul><li>"+this.oP.textNoneVisible+"</li></ul>";
	t+="</div>";			
	
	t+="<div style='clear:both;'></div>";
	
	t+="</div>";

	t+="<div class='msBoxClose accessOffOnly'>";
	t+="<input class='big_button msActBoxClose' type='button' value='"+this.oP.textClose+"' title='"+this.oP.textCloseTitle+"'>";
	t+="</div>";
	
	
	t+="</fieldset>";
	
	$ms.html(t);
	
	$ms.find(".msAll").hide();
	$ms.find(".textNone").hide();
	$ms.find(".msbox").toggle(this.oP.boxExpandedByDefault);
	$ms.find(".msActBoxShow").toggle(this.oP.showSelectLink);
	//$ms.find(".msulwrapper").css("width",""+Math.floor(100/this.oP.columns)+"%");
	
	this.updateDisplay();
	$ms.data("items",items);
	$ms.data("callback",callback);
	$ms.data("controller",this);
	
	
	// Select... button:
	$ms.find(".msActBoxShow").click(function() {
		if ($(this).hasClass("disableClick")) {
			RR.addBadWarning(i8n.chooseTerm);
			return;
		}
		var $mb=$ms.find(".msbox");
		if ($mb.is(":visible")) {
			$(this).html(oP.textSelectShow);
		} else {
			BUBBLES.skipCampusStep();
			$(this).html(oP.textSelectHide);
		}
		var $b=$ms.find(".msbox");
		//if (isMobile()) {
		//	$b.slideToggle(600);	
		//} else {
			$b.toggle(300);
		//}
		
	});
	
	// Close button
	$ms.find(".msActBoxClose").click(function() {
		$ms.find(".msbox").hide(300);
	});
	
	this.msModelToDisplay();
	
	
}

function MultiselectItem(value,text,checked,onclick,obj1,obj2,show) {
	this.value=value;
	this.text=text;
	this.checked=(checked==undefined?true:checked);
	this.onclick=onclick;
	this.obj1=obj1;
	this.obj2=obj2;
	this.show=(show==undefined?true:show);
	
	// For system use only:
	this.oldCol=-1;
}

//User clicked on 'x' or checkbox or Select All/None
function msSelect(id,i,checked) {
	var $ms=$("#"+id);
	var items=$ms.data("items");
	var controller=$ms.data("controller");
	
	if (i==undefined) {
		for (var i=0; i<items.length; i++) {
			items[i].checked=checked;
		}		
		if(checked) {
			_alert("All items selected");
		} else {
			_alert("All items unselected");
		}
		controller.msModelToDisplay();
	} else {
		items[i].checked=checked;
		controller.msModelToDisplay(i);
	}
	
	var cb=$ms.data("callback");
	if (cb!=undefined) {
		cb();
	}
}

function msRefresh(id) {
	var $ms=$("#"+id);
	var controller=$ms.data("controller");
	controller.msModelToDisplay();
}

function msExpandible(id,enabled) {
	var $ms=$("#"+id);
	var $act=$ms.find(".msActBoxShow");
	if (enabled) {
		$act.removeClass("disableClick");
	} else {
		$act.addClass("disableClick");
	}
}