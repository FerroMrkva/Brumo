/*
Graph object
vertices - array of strings
relevances - array of floats
*/

function Graph(vertices,relevances,timeslots){
	this.vertices=vertices;
	this.relevances=relevances;
	this.timeslots=timeslots;
        
	this.adjacencyList={};
	
	this.initList=function(){		
		var queryString='';
		for(var i=0;i<this.vertices.length;i++){
			queryString+='words='+escape(this.vertices[i])+'&';
		}
		var obj=this;
		var ajaxOptions={
			url:'http://localhost:8080/get_graph?'+queryString,
			async:false,
			success:function(data){
				console.log(data);
				jQuery.extend(obj.adjacencyList,data.adjacencyList);
				var k=obj.vertices.length;
				for(var i=k;i<data.vertices.length;i++){
					obj.vertices.push(data.vertices[i]);
					obj.relevances.push(0);
				}
			},
			error:function(){
				alert('error');
			}
		};
		jQuery.ajax(ajaxOptions);
	};
	this.getConnections=function(vertex){
		return this.adjacencyList[vertex];
	};
        this.getMostRelevantTimeslot=function(keyword){
            var max=-1;
            var maxTimeslot=-1;
            for(var i=0;i<this.timeslots.length;i++){
                var index=this.timeslots[i].keywords.indexOf(keyword);
                if(index!==-1 && this.timeslots[i].relevance[index]>max){
                    max=this.timeslots[i].relevance[index];
                    maxTimeslot=i+1;
                }
            }
            if(maxTimeslot===-1){
                maxTimeslot=0;
            }
            return maxTimeslot;
        };
}
