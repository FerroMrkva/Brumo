/*
	Spreading activation algorithm
	
	graph- Graph class
	F - Fire threshhold
	D - Decay threshold
*/

function SpreadingActivation(graph,F,D){
	this.graph=graph;
	this.verticesMap={};
	this.F=F;
	this.D=D;
	this.A;
	this.markup;
	this.init=function(){
		this.A=new Array(graph.vertices.length);		
		for(var i=0;i<this.A.length;i++){
			this.A[i]=this.graph.relevances[i];
			this.verticesMap[this.graph.vertices[i]]=i;
		}
	};	
	this.spread=function(){
		var results=[];
		/*
			markup - we mark every vertex
			-undefined means not handled vertex
			-1 marked, activation ready to fire
			-2 fired, handled vertex
		*/
		this.markup=new Array(this.A.length);
		var queue=[];
		var componentsCounter=0;
		for(var i=0;i<this.A.length;i++){
			if(this.A[i]>this.F){
				queue.push(this.graph.vertices[i]);
				this.markup[i]=1;
				//todo:
				componentsCounter++;
			}
		}			
		
		for(var i=0;i<100&&queue.length==0;++i){
			var vertex=queue.shift();
			var vertexIndex=this.verticesMap[vertex];
			this.markup[vertexIndex]=2;
			console.log(vertex);
			for(var j=0;j<this.graph.getConnections(vertex).length;j++){
				var edge=this.graph.getConnections(vertex)[j];
				var aVertex=edge[0];
                                //console.log(edge);
                                //console.log(this.verticesMap[edge[0]]);
				var aVertexIndex=this.verticesMap[edge[0]];
				//note: that weights are inverted, less weight means more more activation spread
				this.A[aVertexIndex]=this.A[aVertexIndex]+this.A[vertexIndex]*this.D*edge[1];
				if(this.A[aVertexIndex]<0){
					this.A[aVertexIndex]=0;
				}
				if(this.A[aVertexIndex]>1){
					this.A[aVertexIndex]=1;
				}
				
				if(this.markup[aVertexIndex]===undefined && this.A[aVertexIndex]>=this.F){
					this.markup[aVertexIndex]=1;
					queue.push(aVertex);
				}
			}			
		}
	};
}
