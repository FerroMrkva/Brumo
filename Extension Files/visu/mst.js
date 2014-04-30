/* 
 *Maximal spanning tree
 * graph object of class Graph
 * relevances - new relevance, especially SA or pageRank
 * 
 * 
 */


function MST(graph, relevances) {
    this.graph = graph;
    this.relevances = relevances.slice();
    this.adjacencyMatrix;
    this.verticesMap = {};
    this.vertices;
    this.spanningTree = new Array();

    this.createAdjacencyMatrix = function(relevanceFilter) {
        var relevances = this.relevances;
        this.vertices = this.graph.vertices.slice().filter(function(elem, i) {
            return relevances[i] > relevanceFilter;
        });
        this.relevances = relevances.filter(function(elem) {
            return elem > relevanceFilter;
        });

        var verticesMap = this.verticesMap;
        this.vertices.forEach(function(elem, index) {
            verticesMap[elem] = index;
        });
        
        
        relevances = this.relevances;
        this.vertices.sort(function(a, b) {
            var v1 = relevances[verticesMap[a]];
            var v2 = relevances[verticesMap[b]];
            return v2 - v1;
        });
        this.relevances.sort(function(a, b) {
            return b - a;
        });

        this.adjacencyMatrix = new Array(this.vertices.length);
        for (var i = 0; i < this.vertices.length; i++) {
            this.adjacencyMatrix[i] = new Array(this.vertices.length);
            var adjList = this.graph.getConnections(this.vertices[i]);
            this.adjacencyMatrix[i][i] = 0;
            for (var j = 0; j < adjList.length; j++) {
                if (this.verticesMap[adjList[j][0]] !== undefined) {
                    //just filterered vertex is accetable
                    this.adjacencyMatrix[i][this.verticesMap[adjList[j][0]]] = adjList[j][1];
                }
            }
        }
    };
    this.find = function() {
        var components = new Array();
        components.push(0);

        var markup = new Array(this.vertices.length);
        markup[0] = 1;

        while (components.length < this.vertices.length) {
            var max = -1;
            var maxIndex1 = -1;
            var maxIndex2 = -1;
            for (var i = 0; i < components.length; i++) {
                for (var j = 0; j < this.adjacencyMatrix.length; j++) {
                    if (markup[j] !== 1 && max < this.adjacencyMatrix[i][j]) {
                        max = this.adjacencyMatrix[i][j];
                        maxIndex1 = components[i];
                        maxIndex2 = j;
                    }
                }
            }
            this.spanningTree.push([maxIndex1, maxIndex2, max]);
            components.push(maxIndex2);
            markup[maxIndex2] = 1;
        }
    };
    this.getEdgeWeight = function(index1, index2) {
        if (this.adjacencyMatrix[index1][index2] === undefined) {
            return 0;
        }
        else {
            return this.adjacencyMatrix[index1][index2];
        }
    }
}

