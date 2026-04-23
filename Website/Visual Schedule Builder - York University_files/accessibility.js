/**
 * Set of useful function for accessibility of the software
 * @author Theo Szymkowiak
 */

function _alert(text) {
	if (!BB.access) return;
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