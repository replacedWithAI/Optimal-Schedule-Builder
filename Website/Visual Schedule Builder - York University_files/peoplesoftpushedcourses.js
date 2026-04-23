function PeopleSoftPushedCourses(){};
PeopleSoftPushedCourses.prototype = {
debug:false,
key:"vsbuilder.courseList",
get:function(){
  var courses = null;
  if(window.localStorage){
    var courses = JSON.parse(localStorage.getItem(this.key));
  }
  if(!courses) courses = {};
  return courses;
},
set:function(courses){
  if(window.localStorage){
    if(courses) localStorage.setItem(this.key,JSON.stringify(courses));
    else localStorage.removeItem(this.key);
  }
},
remove:function(courseId){
  if(window.localStorage){
	if(this.debug)console.log("Remove course "+courseId);
    var courses = this.get();
	if(courses[courseId]){
      delete courses[courseId];
      if(this.debug)console.log("Removed course ID "+courseId);
    }
    this.set(courses);
    this.showList();
  }
},
clear:function(){
  if(window.localStorage){
    if(this.debug)console.log("Clearing course list");
    this.set(null);
    this.showList();
  }
},
listChange:function(event){
  if(event && (!event.key || event.key == this.key) && window.localStorage){
	if(this.debug)console.log("Event 'Storage' received - updating course list");
    this.showList();
  }
},
showList:function(){
  var courses = this.get();
  if(courses){
    var courseList = document.getElementById("PSPushedCourses-courseList");
    if(courseList){
      var clHtml = "";
      for(var crse in courses) clHtml += "<li>"+courses[crse]+"</li>";
      if(!clHtml.length) clHtml = "<span style='color:grey'>&lt;no courses found&gt;</span>";
      courseList.innerHTML=clHtml;
    }
  }
},
togglePanel:function(){
	var panel = document.getElementById("PSPushedCourses-panel");
	if(panel){
		panel.style.display = (panel.style.display == "none")?"table":"none";
		if(panel.style.display != "none") this.showList();
	}
},
init:function(){
  if(window.localStorage){
    if(this.debug)console.log("Initialising PeopleSoftPushedCourses");
    var courses = this.get();
	if(this.debug)console.log("Currently have " + Object.keys(courses).length + " courses in list");
    //this.showList();
    if(this.debug)console.log("Initialised PeopleSoftPushedCourses");
  }
}
};
var PSPushedCourses = new PeopleSoftPushedCourses();
window.addEventListener("load",PSPushedCourses.init());
window.addEventListener("storage",PSPushedCourses.listChange());
