var topBar = document.getElementById('top-bar');
var sidebar = document.getElementById('sidebar');
var content = document.getElementById('content');

sidebar.style.width = sidebar.offsetWidth + "px";

var width = sidebar.style.width;

function toggle(){
	if(sidebar.style.width == width){
		sidebar.style.width = "0px";
	} else {
		sidebar.style.width = width;
	}
}

topBar.onclick = toggle;

window.onload = function(){
	if(content.offsetWidth == 380){
		toggle();
	}
};