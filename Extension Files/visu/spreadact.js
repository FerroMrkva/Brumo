var graph;

var url_trail='';

for(var i=0;i<data.keywords.length;i++){   
    url_trail+='words='+data.keywords[i]+'&';
}
console.log(url_trail);

//console.log('http://localhost:8080/get_graph?'+url_trail.substr(0,url_trail.length-1));

jQuery.ajax({
    //url:'http://localhost:8080/get_graph?words=cat&words=car&words=dog&words=wash&words=clean&words=polish&words=food&words=smell',
    url:'http://localhost:8080/get_graph?'+url_trail.substr(0,url_trail.length-1),
    //dataType: 'json',
    async:false,
    success:function(data){
        graph=data;
        console.log(data);
        //console.log('got words');
    }
});

//console.log(JSON_data);

/*

//var data=$.parseJSON(JSON_data);
//console.log(JSON_data);

var graph={
    vertices:{},
    adjacency_list:{},
};

//console.log(JSON_data.words.length);

for(var i=0;i<JSON_data.words.length;i++){   
    graph.vertices[JSON_data.words[i]]=0;
}

//console.log(data.keywords.length);
*/
 


var queue = [];
var F=0.7;
var D=0.2;

var counter=0;

var max=-1;
for(var i=0;i<data.keywords.length;i++){
	if(max<data.relevance[i]){
		max=data.relevance[i];
	}
}
//console.log(max);

for(var i=0;i<data.keywords.length;i++){
	data.relevance[i]/=max;
	
	data1.relevance[i]/=max;
	data2.relevance[i]/=max;
	data3.relevance[i]/=max;
	data4.relevance[i]/=max;
	data5.relevance[i]/=max;
	
    graph.vertices[data.keywords[i]].r=data.relevance[i];
	graph.vertices[data.keywords[i]].pop=data.relevance[i];
	graph.vertices[data.keywords[i]].f=0;
	graph.vertices[data.keywords[i]].m=0;
	graph.vertices[data.keywords[i]].ord=i;
    if(data.relevance[i]>F){
        //console.log(data.keywords[i]);
        queue.push(data.keywords[i]);
		graph.vertices[data.keywords[i]].m=1;
		graph.vertices[data.keywords[i]].c=counter++;
    }
}

var fired=new Array();
var fired_map={};

while(queue.length>0){
    var keyword=queue.shift();
    graph.vertices[keyword].f=1;	
    console.log("%c%s fired %d",'color:blue;',keyword,graph.vertices[keyword].c);
	fired.push({
		k:keyword,
		c:graph.vertices[keyword].c,
		r:graph.vertices[keyword].pop,
	});
	fired_map[keyword]=0;
    //console.log(graph.vertices[keyword].f);
	
    for(var i=0;i<graph.adjancy_list[keyword].length;i++){
        var adjacent=graph.adjancy_list[keyword][i];
        //console.log("tada");
        //console.log(adjacent);
		
        if(graph.vertices[adjacent.v].f!==1){
            //console.log(graph.vertices[adjacent.v].f);
			graph.vertices[adjacent.v].r=graph.vertices[adjacent.v].r+D*adjacent.w*graph.vertices[keyword].r;
			if(graph.vertices[adjacent.v].r<0){
				graph.vertices[adjacent.v].r=0;
			}
			if(graph.vertices[adjacent.v].r>1){
				graph.vertices[adjacent.v].r=1;
			}
			
            if(graph.vertices[adjacent.v].m!==1 && graph.vertices[adjacent.v].r>F){
				//console.log("%c%s pushed",'color:green;',adjacent.v);
                queue.push(adjacent.v);
				graph.vertices[adjacent.v].m=1;
				graph.vertices[adjacent.v].c=graph.vertices[keyword].c;
            }
        }
    }
}


fired.sort(function(a,b){return b.r-a.r});
console.log(fired);

var copy={};

var components=new Array();
components.push(fired[0].k);
fired_map[fired[0].k]=1;
var edges=new Array();

$.extend(copy,fired_map);
console.log(copy);

var A=new Array();

function getIndex(keyword){
	for(var i=0;i<fired.length;i++){
		if(keyword==fired[i].k){
			return i;
		}
	}
	return -1;
}

for(var i=0;i<fired.length;i++){	
	A.push(new Array(fired.length));
	A[i][i]=0;
	for(var j=0;j<graph.adjancy_list[fired[i].k].length;j++){
		var adjacent=graph.adjancy_list[fired[i].k][j];
		var indexA=getIndex(adjacent.v);
		if(indexA!==-1){
			A[i][indexA]=adjacent.w;
		}		
	}
}	

while(components.length<fired.length){
	var min_value=1000000;
	var min=-1;
	for(var i=0;i<components.length;i++){
		var keyword=components[i];
		//console.log("%c%s eximine",'color:green;',keyword);
		for(var j=0;j<graph.adjancy_list[keyword].length;j++){
			var adjacent=graph.adjancy_list[keyword][j];
			if(fired_map[adjacent.v]!==undefined && fired_map[adjacent.v]!==1){
					if(adjacent.v!==keyword && adjacent.w<min_value){
						min_value=adjacent.w;
						min=adjacent.v;
						//console.log("%c%s loc min",'color:gray;',adjacent.v);
					}
			}
		}	
	}
	if(min!=-1){
			edges.push({u:keyword,v:min,w:min_value});
			components.push(min);
			//console.log("%c%s min",'color:blue;',min);
			fired_map[min]=1;
	}
}

console.log(edges);
console.log(fired);
console.log(A);




//console.log("done");



