MePersonalityHeap=function(cmp){
	var nodes=[];
	if (!cmp)
		cmp=function(a,b){
			return a<b;
		}
	function bubbleUp(){
		var kde=nodes.length-1;
		var node=nodes[kde];
		while(kde>0){
			var kam=(kde-1)>>1;
			if (cmp(node,nodes[kam])){
				nodes[kde]=nodes[kam];
				kde=kam;
			}
			else break;
		}
		nodes[kde]=node;
	}
	function bubbleDown(){
		var kde=0,pocet=nodes.length;
		var node=nodes[0];
		while(kde<(pocet>>1)){
			var a=(kde<<1)+1,b=(kde<<1)+2;
			var kam=b<pocet&&cmp(nodes[b],nodes[a])?b:a;
			if (cmp(node,nodes[kam]))
				break;
			nodes[kde]=nodes[kam];
			kde=kam;
		}
		nodes[kde]=node;
	}
	this.clear=function(){
		nodes=[];
	}
	this.count=function(){
		return nodes.length;
	}
	this.push=function(item){
		nodes.push(item);
		bubbleUp();
	}
	this.pop=function(){
		if (nodes.length==1)
			return nodes.pop();
		if (nodes.length==0)
			return undefined;
		var ans=nodes[0];
		nodes[0]=nodes.pop();
		bubbleDown();
		return ans;
	}
	this.top=function(){
		return nodes[0];
	}
	this.getNodes=function(){
		var ans=[];
		var len=nodes.length;
		for(var i=0;i<len;++i)
			ans.push(nodes[i]);
		return ans;
	}
}
