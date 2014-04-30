MP.me.indexHistoryByTime({'maxResults':100},function(){
	MP.me.getUserTimedTags({'unitCount':10},function(response){
		var output='';
		for(var i=0;i<10;++i){
			output+='day '+i+'<br/>';
			for(var j=0;j<Math.min(5,response[i].length);++j){
				output+=response[i][j][0]+' '+response[i][j][1]+'<br/>';
			}
		}
		$('#output').html(output);
	});
});
