"use strict";

var SLIDER = (function() {

	var my = {};
	var tipNumberMax=4;
	var tipWhenHidden=1;
	var shownYet=false;
	var tipContents=["a","tip_image1.png",i8n.tipClickAndDrag, i8n.tipClickAndDragMobile,
	                 "b","tip_image2b.png",i8n.tipClickToPin,i8n.tipClickToPinMobile,
	                 "c","tip_image3.png",i8n.tipUseArrows,i8n.tipUseArrowsMobile,
	                 // CreateShareLink || ShareSave
	                 "d","tip_image4.png",createShareLinkActivated?i8n.tipCreateShareLink:i8n.tipShareSave,i8n.tipShareSaveMobile];
	
	my.renderSlider = function() {
		if (BB.tip==0) {
			$("#tip_div").slideUp(500, function() {
				drawSliderTip();
			});
			$(".tip_link").fadeIn(500);
		} else {
			drawSliderTip();
			$("#tip_div").slideDown(500);
			$(".tip_link").hide();
		}
	}
	
	function drawSliderTip() {
		var index=(BB.tip-1)*4;
		if (index<0) index=0;
		var img="images/"+tipContents[index+1];
		var txt=tipContents[index+2];
		var txtMobile=tipContents[index+3];
		$("#slider_tip_nb").html(BB.tip);
		$("#slider_tip_img").attr("src",img);
		$(".slider_tip_text").html([
		     "<div class='nomobile'>"+txt+"</div>",
		     "<div class='phoneOnly'>"+txtMobile+"</div>"
		].join(""));
		$(".slider_tip").fadeIn(100);
	}
	
	my.showNewTip = function() {
		if (shownYet) {
			my.sliderChange(true);
		}
		shownYet=true;
	}
	
	my.sliderChange = function(isRight) {
		if (BB.tip==0) return;
		if (isRight) {
			BB.tip++;
			if (BB.tip>tipNumberMax) BB.tip=1;
		} else {
			BB.tip--;
			if (BB.tip<1) BB.tip=tipNumberMax;
		}
		$(".slider_tip").fadeOut(100,function() {
			drawSliderTip();
		});
	}
	
	my.hideTip = function() {
		tipWhenHidden=BB.tip;
		BB.tip=0;
		setCookie("tip",BB.tip,30);
		my.renderSlider();
	}
	
	my.showTip = function() {
		BB.tip=tipWhenHidden;
		setCookie("tip",BB.tip,30);
		my.renderSlider();
	}
	
	return my;

}());