function drawThumbnail(timeblocks, div) {
	var colors = '#CBD4EB,#F6C8B6,#C0F4AE,#FAFE92,#E8CAE3,#A6FCDD,#C0A6FC,#FCA6F3,#DDDDDD,#BBBBBB,#999999,#666666'.split(',');
	var minTime = 60*11,maxTime = 60*13,d1 = 2, d2 = 6;
	for(var n =0; n<timeblocks.length;n++){
		var timeblock = timeblocks[n];
		maxTime = Math.max(maxTime,timeblock.t2);
		minTime = Math.min(minTime,timeblock.t1);
		d1 = Math.min(d1,timeblock.d);
		d2 = Math.max(d2,timeblock.d);
	}
    var c = document.getElementById(div);
    var ctx = c.getContext("2d");
    var t1 = Math.floor(minTime/60);
    var t2 = Math.ceil(maxTime/60);
    var dw = 80 / (d2 - d1 + 1);
    var dh = 70 / (t2-t1);
    
    ctx.clearRect(0, 0, ctx.width, ctx.height);
    ctx.fillStyle = "#E0E0E0";
    roundRect(ctx, 0, 0, 100, 100, 4, true, false);

    ctx.translate(0.5, 0.5);

    ctx.fillStyle = "#E9E9F2";
    roundRect(ctx, 10, 10, 80, 10, {tl: 4, tr: 4}, true, false);


    ctx.fillStyle = "#F5F5F5";
    ctx.fillRect(10, 20, 80, 70);

    ctx.fillStyle = "#EEEEEE";
   
    for (var d = 1; d < (d2 - d1); d += 2) {
        ctx.fillRect(10 + d * dw, 20, dw, 70);
    }

    ctx.fillStyle = "#CCCCCC";
    ctx.font = "bold 9px Verdana";
    ctx.textAlign = "center";
    var days = ["S", "M", "T", "W", "T", "F", "S"];
    for (var d = 0; d <= (d2 - d1); d++) {
        ctx.fillText(days[d + d1 - 1], 10 + dw * (d + 0.5), 18);
    }

    function drawBlock(ctx, d, th1, th2,c) {
        ctx.fillStyle = c;
        var posx = d - d1;
        var poxy = th1 - t1;
        roundRect(ctx, 10 + dw * posx, 20 + poxy * dh, dw, dh * (th2 - th1), 0, true, false);
    }

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke == 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    for (var i = 0; i < timeblocks.length; i++) {
        var time = timeblocks[i];
        drawBlock(ctx, time.d, time.t1/60, time.t2/60,colors[time.color]);
    }
}

function testThumb(){	
	drawThumbnail(timeblocks,'thumbtest');
}
$().ready(function (){
	$('#testThumb').hide().on('click',testThumb);
	//$('#testThumb').on('click',drawThumb);
})
