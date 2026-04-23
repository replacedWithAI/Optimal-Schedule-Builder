(function (window, $) {
	function openSuggestPopUp(){
		 var popupcontainer = $('#suggestPopup').popup({
	          width: 510,
	           height: 500
	      });
	      $('#calenderbutton').show();
	      BB.popuplive=true;
    	  $('.popupl-overlay').addClass("is-shown");
    	  popupcontainer.open();
    	  $('#progress').hide();
    	  $('#fileError').hide();
    	  $('#fileMessage').text('');
	      $(".closefitler , .popupl-overlay").click(function(){ BB.popuplive=false; popupcontainer.close();$('#notificationCal').hide();});
	}
	function getRecommendedCourses(){
		var template= ['<a href="javascript:void(0);" onclick="UU.caseLoadRecommendation(\'{{state}}\');" title="Click to load recommendation">','<div class="sresult">','<div class="sthumb"><canvas class="thumbnail" id="thumbtests_{{id}}" width="100" height="100"></canvas></div>','<div class="welcome_subtext sdetails">','<div class="stitle">{{title}}</div>','<div class="sdescription">{{description}}</div>','<div class="sdate">{{date}}</div>','</div>','<div style="clear:both;"></div>','</div></a>'];
		$.ajax({
            url: 'api/suggestedSchedules',
            method: 'get',
        }).done(function (da) {
        	if(da && da.length){
        		if (da.length > 0) {
        			$('#recommendedShow').show();
        		} 
        		//$('#recommendedCount').text(da.length);
	        	for(var i=0;i<da.length;i++){
	        		var row = da[i];
	        		var newTemplate = template.join('');
	        		var dateCreated= new Date(row.timeCreated);
	        		newTemplate = newTemplate.replace('{{title}}',row.name).replace('{{description}}',row.description).replace('{{id}}',i).replace('{{date}}',dateFormated(dateCreated)).replace('{{state}}',row.state);
	        		$('#suggestedResult').append(newTemplate);
	        		if (row.state.indexOf("nopin=1")>= 0) {
	        			drawThumbnail([],"thumbtests_"+i);
	        			var courseNumber = getCoursesList(row.state);
	        			var courseString = (courseNumber>1)?(courseNumber+' Courses'):'1 Course';
	        			$("#thumbtests_"+i).parent().append('<div class="courseCount1">'+courseString+'</div>');
	        		}else {
	        			drawThumbnail(row.time_blocks,"thumbtests_"+i);
	        		}
	        	}	
        	}
        });
	}
	function getCoursesList(state){
		var i =0;
		while (state.indexOf("course_"+i+"_0=")>=0) {
			i++;
		}
		return i;
	}
	function dateFormated(date){
		var monthNames = ["January", "February", "March", "April", "May", "June",
		                  "July", "August", "September", "October", "November", "December"
		                ];
		return monthNames[date.getMonth()]+' '+date.getDate() + ', '+date.getFullYear();

	}
	
	function initSuggest() {
		$('#csvfile').fileupload({
	        url: 'uploadServlet',
	        dataType: 'json',
	        add:function (e,data){
	        	$('#progress,#fileMessage').show();
	        	$('#fileMessage').text('Selected file:'+data.files[0].name);
	        	$('#fileError').hide();
	        	data.submit();
	        },
	        done: function (e, data) {
	        	var temp = [];
	        	for(var k =0; k<data._response.result.length;k++){
	        		var d= data._response.result[k];
	        		temp.push(d.name);
	        	}
	        	$('#uploadedUsernames').val(temp.join('::'));
	        	console.log('done')
	        },
	        progressall: function (e, data) {
	        	$('#progress').show();
	            var progress = parseInt(data.loaded / data.total * 100, 10);
	            $('#progress .progress-bar').css(
	                'width',
	                progress + '%'
	            );
	        }
	    });
		$('#UploadServletForm').on('submit',function (){
			var usernames = $('#uploadedUsernames').val();
			var useridtext = $.trim($('#userIdText').val());
			var sample = [];
			if(usernames != ''){
				sample.push(usernames);
			}
			if(useridtext != ''){
				sample.push(useridtext);
			}
			usernames = sample.join(',').replace(/,/g,'::');
			var messageDescription;
			var suggestionlevel = $('.recommendradio:checked').val();
			var name = $('#suggestTitle').val();
			var isdefault = $('#defaultMessage').is(":checked");
			var state=BB.activeState.toStr();
			if(isdefault){
				messageDescription = "default text"
			}else {
				messageDescription = $('#messageDescription').val();
			}
			if(usernames === ''){
				$('#fileError').show();
				 return false;
			}
			state +='&shared=1';
			if(suggestionlevel == 'courselev'){
				state +='&nopin=1'
			}
			$.ajax({
	            url: 'api/suggestSchedules',
	            method: 'post',
	            data: {name: name, state: state,usernames:usernames,description:messageDescription,termId:BB.activeState.term}
	        }).done(function (da) {
	        	$(".closefitler , .popupl-overlay").trigger('click');
	        	$('#UploadServletForm')[0].reset();
	        	$('#uploadedUsernames').val('');
	        	$('#fileError').hide();
	        });
			return false;
		});
		$('#defaultMessage').on('click',function (){
			if($('#defaultMessage').is(":checked")){
				$('#messageDescription').attr('disabled','disabled');
			}else {
				$('#messageDescription').removeAttr('disabled');
			}
		});
	}
	 
	$().ready(function (){
		$('#suggestState').on('click',openSuggestPopUp);
		
		if ($('#csvfile').length>0) {
			initSuggest();
		}
		
		getRecommendedCourses();
	});
})(window,jQuery)