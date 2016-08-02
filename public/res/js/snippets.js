var snippets = document.getElementsByClassName("code");

var snips = [];
var blocks = [];

for(var i = 0; i < snippets.length; i++){
	if(snippets[i].dataset.src != null){
		blocks.push(snippets[i]);
	} else {
		snips.push(snippets[i]);
	}
}

function encodeHtmlEntity(str) {
	var buf = [];
	for (var i=str.length-1;i>=0;i--) {
		buf.unshift(['&#', str[i].charCodeAt(), ';'].join(''));
	}
	return buf.join('');
}

function generateBlock(block, text) {
	var code = '<div class="line-numbers">';
	var lines = text.split(/\n/).length;
	var file = block.dataset.src;
	text = encodeHtmlEntity(text);
	for(var j = 0; j < lines; j++){
		code += '<pre>' + (j + 1) + '</pre>';
	}
	block.innerHTML = code + '</div><pre class="source">' + text + '</pre>';
}

for(var i = 0; i < blocks.length; i++){
	generateBlock(blocks[i], 'Loading file: ' + blocks[i].dataset.src);
}

var client = new XMLHttpRequest();

var i = 0;

function updateBlocks(){
	if(i >= blocks.length){
		return;
	}
	client.open('GET', blocks[i].dataset.src);
	client.onreadystatechange = function(){
		if(client.readyState == 4){
			if(client.status == 404){
				var message = "Could not find file: " + blocks[i].dataset.src;
				generateBlock(blocks[i], message);
				blocks[i].style.background = "#800";
			} else {
				var response = client.responseText;
				generateBlock(blocks[i], response);
			}
			i += 1;
			updateBlocks();
		}
	};
	client.send();
}

var old = window.onload;

window.onload = function(){
	old();
	updateBlocks();
};