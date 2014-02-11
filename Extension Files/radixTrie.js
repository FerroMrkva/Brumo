MePersonalityRadixTrie=function(){
	var root;
	var count=0;
	var wordCount=0;
	var locked=0;
	var thisTrie=this;
	// Node
	var RadixTrieNode=function(){
		var thisNode=this;
		this.id=count++;
		this.children=[]; // smerniky na dcerske vrcholy
		this.next=[]; // retazce na hranach do dcerskych vrcholov
		this.value={}; // hodnota v tomto vrchole
		this.changed=1;
		this.createNode=function(s){
			this.next[s.charCodeAt(0)]=s;
			this.changed=1;
			return this.children[s.charCodeAt(0)]=new RadixTrieNode();
		}
		this.childCount=function(){
			var count=0;
			for(var i in thisNode.children){
				++count;
			}
			return count;
		}
	}
	function getRoot(){
		if (!root)
			root=new RadixTrieNode();
		return root;
	}
	this.root=function(){
		return getRoot();
	}
	this.wordCount=function(){
		return wordCount;
	}
	this.nodeCount=function(){
		return count;
	}
	// hladam iba prefix slova
	this.prefixSearch=function(slovo){
		var node=getRoot();
		for(var i=0;i<slovo.length;) {
			if (node.children[slovo.charCodeAt(i)]) {
				var s=node.next[slovo.charCodeAt(i)];
				// ak hladany tag konci na hrane, nie vo vrchole
				// tak vratim az vrchol za hranou
				if (i+s.length>slovo.length) {
					for(var j=0;i+j<slovo.length;++j)
						if (s[j]!=slovo[i+j])
							return null;
				}
				else {
					for(var j=0;j<s.length;++j)
						if (s[j]!=slovo[i+j])
							return null;
				}
				node=node.children[slovo.charCodeAt(i)];
				i+=j;
			}
			else
				return null;
		}
		return node;
	}
	// hladam cele slovo
	this.search=function(slovo){
		var node=getRoot();
		for(var i=0;i<slovo.length;){
			if (node.children[slovo.charCodeAt(i)])
			{
				var s=node.next[slovo.charCodeAt(i)];
				// ak hladany tag konci na hrane, nie vo vrchole
				if (i+s.length>slovo.length)
					return null;
				for(var j=0;j<s.length;++j)
					if (s[j]!=slovo[i+j])
						return null;
				node=node.children[slovo.charCodeAt(i)];
				i+=j;
			}
			else
				return null;
		}
		return node;
	}
	this.addWord=function(slovo,nodeSplit){
		// nodeSplit(parentNode,childNode,splitNode)
		if (locked){
			setTimeout(function addWordLater(){
				thisTrie.addWord(slovo,nodeSplit);
			},10);
		}
		locked++;
		var node=getRoot();
		for(var i=0;i<slovo.length;){
			if (node.children[slovo.charCodeAt(i)]){
				var s=node.next[slovo.charCodeAt(i)];
				// ak hladany tag konci na hrane, nie vo vrchole
				if (i+s.length>slovo.length) {
					var j=0;
					for(;i<slovo.length;++j,++i)
						if (s[j]!=slovo[i])
							break;
					var novy=new RadixTrieNode();
					novy.next[s.charCodeAt(j)]=s.substr(j);
					novy.children[s.charCodeAt(j)]=
						node.children[s.charCodeAt(0)];
					node.next[s.charCodeAt(0)]=s.substr(0,j);
					node.children[s.charCodeAt(0)]=novy;
					node.changed=1;
					if (nodeSplit)
						nodeSplit(node,novy.children[s.charCodeAt(j)],novy);
					if (i==slovo.length){
						locked--;
						return novy;
					}
					locked--;
					return novy.createNode(slovo.substr(i));
				}
				for(var j=0;j<s.length;++j)
					if (s[j]!=slovo[i+j])
					{
						var novy=new RadixTrieNode();
						novy.next[s.charCodeAt(j)]=s.substr(j);
						novy.children[s.charCodeAt(j)]=
							node.children[s.charCodeAt(0)];
						node.next[s.charCodeAt(0)]=s.substr(0,j);
						node.children[s.charCodeAt(0)]=novy;
						node.changed=1;
						if (nodeSplit)
							nodeSplit(node,novy.children[s.charCodeAt(j)],novy);
						if (i+j==slovo.length){
							locked--;
							throw new Exception('Chyba pri vkladani do RadixTree');
						}
						locked--;
						return novy.createNode(slovo.substr(i+j));
					}
				node=node.children[slovo.charCodeAt(i)];
				i+=j;
			}
			else{
				locked--;
				return node.createNode(slovo.substr(i));
			}
		}
		locked--;
		return node;
	}
	// Update nodes on path to the specified word
	this.updatePath=function(slovo,updateFunction){
		if (locked){
			setTimeout(function updatePathLater(){
				thisTrie.updatePath(slovo,updateFunction);
			},10);
		}
		locked++;
		var node=getRoot();
		for(var i=0;i<slovo.length;){
			node.changed=1;
			updateFunction(node);
			if (node.children[slovo.charCodeAt(i)])
			{
				var s=node.next[slovo.charCodeAt(i)];
				// ak hladany tag konci na hrane, nie vo vrchole
				if (i+s.length>slovo.length){
					locked--;
					return;
				}
				for(var j=0;j<s.length;++j)
					if (s[j]!=slovo[i+j]){
						locked--;
						return;
					}
				node=node.children[slovo.charCodeAt(i)];
				i+=j;
			}
			else{
				locked--;
				return;
			}
		}
		node.changed=1;
		updateFunction(node);
		locked--;
	}
	this.removeWord=function(slovo){
		if (locked){
			setTimeout(function removeWordLater(){
				thisTrie.removeWord(slovo);
			},10);
		}
		locked++;
		var node=getRoot();
		var p=undefined,pp=undefined;
		for(var i=0;i<slovo.length;){
			if (node.children[slovo.charCodeAt(i)])
			{
				var s=node.next[slovo.charCodeAt(i)];
				// ak hladane slovo konci na hrane, nie vo vrchole
				if (i+s.length>slovo.length){
					locked--;
					return null;
				}
				for(var j=0;j<s.length;++j)
					if (s[j]!=slovo[i+j]){
						locked--;
						return null;
					}
				pp=p;
				p=node;
				node=node.children[slovo.charCodeAt(i)];
				i+=j;
			}
			else{
				locked--;
				return null;
			}
		}
		if (node.childCount()==0){ // leaf
			for(var i in p.children)
				if (p.children[i]==node){
					delete p.children[i];
					delete p.next[i];
					p.changed=1;
					break;
				}
			if (p.childCount()==1){
				// compress path
				for(var i in p.children)
					for(var j in pp.children)
						if (pp.children[j]==p){
							pp.children[j]=p.children[i];
							pp.next[j]+=p.next[i];
							pp.changed=1;
						}
				delete p;
			}
			locked--;
			return null;
		}
		// inner node, return to update its value
		node.changed=1;
		locked--;
		return node;
	}
	this.getWords=function(node){
		if (!node)
			return this.getWords(getRoot());
		var vys=[];
		console.log(node);
		for(var i in node.children)
			if (!isNaN(i)){
				console.log(node.id+' '+i);
				var suffixes=this.getWords(node.children[i]);
				for(var j=0;j<suffixes.length;++j)
					vys.push(node.next[i]+suffixes[j]);
			}
		if (node.value.length>0) // TODO:
			vys.push('');
		return vys;
	}
	// Persistent storage
	this.store=function(db,table){
		if (locked)
			return;
		locked++;
		if (!table)
			table='';
		function storeNode(node){
			var s={};
			for(var i in node.children)
				if (!isNaN(i)){
					s[node.next[i]]=node.children[i].id;
					storeNode(node.children[i]);
				}
			s['']=node.value;
			if (node.changed){
				locked++;
				db.set(table,node.id,s,function(){
					node.changed=0;
					locked--;
				});
			}
		}
		db.getTransaction(function(){
			storeNode(getRoot());
		});
		locked--;
	}
	this.load=function(db,table){
		if (locked)
			return;
		locked++;
		if (!table)
			table='';
		function createNode(label,nodeId,node){
			loadNode(nodeId,function(node2){
				node.children[label]=node2;
			});
		}
		function loadNode(id,callback){
			locked++;
			db.get(table,id,function(data){
				if (!data) return undefined;
				var node=new RadixTrieNode();
				node.id=id;
				node.value=data[''];
				node.changed=0;
				delete data[''];
				for(var i in data){
					node.next[i.charCodeAt(0)]=i;
					createNode(i.charCodeAt(0),data[i],node);
				}
				callback(node);
				locked--;
			});
		}
		root=undefined;
		count=0;
		loadNode(0,function(node){
			root=node;
		});
		locked--;
	}
}
