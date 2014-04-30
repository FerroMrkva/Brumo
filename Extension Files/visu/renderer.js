/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function Point(x, y, index, keyword, popularity) {
    this.x = x;
    this.y = y;
    this.keyword = keyword;
    this.index = index;
    this.popularity = popularity;

    this.add = function(point) {
        this.x += point.x;
        this.y += point.y;
    };
    this.substract = function(point) {
        this.x += point.x;
        this.y += point.y;
    };
    this.distance = function(point) {
        return Math.sqrt((this.x - point.x) * (this.x - point.x) + (this.y - point.y) * (this.y - point.y));
    };
    this.move = function(direction, distance) {
        this.x += direction.x * distance;
        this.y += direction.y * distance;
    };
}

function Vector(point1, point2) {
    this.x = point2.x - point1.x;
    this.y = point2.y - point1.y;

    this.magnitute = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    this.normalise = function() {
        var magnitude = this.magnitute();
        this.x /= magnitude;
        this.y /= magnitude;
        return this;
    };
    this.move = function(start, distance) {
        return [start.x + this.x * distance, start.y + this.y * distance];
    };
    this.opposite = function() {
        return new Vector(-this.x, -this.y);
    }
}



function Renderer(context, width, height, graph, mst) {
    this.graph = graph;
    this.mst = mst;
    this.context = context;
    this.width = width;
    this.height = height;
    this.edgeOffset = 100;
    this.maxFontSize = 46;
    this.timeslotOffset = (width - 200) / 6;
    this.points;
    this.k_s = 0.05;
    this.k_r = 1.2;
    this.k_a = 0.1;

    this.clear = function() {
        this.context.clearRect(0, 0, this.width, this.height);
    };
    this.init = function() {
        this.points = new Array(this.mst.vertices.length);
        var middle = this.height / 2;
        this.points[0] = new Point(this.getXCoordinateFromTimeSlot(this.graph.getMostRelevantTimeslot(this.mst.vertices[0])), middle, 0, this.mst.vertices[0], this.mst.relevances[0]);
        this.points[1] = new Point(this.points[0].x, this.points[0].y + this.getRenderedDistance(this.mst.spanningTree[0][2]), this.mst.spanningTree[0][1], this.mst.vertices[this.mst.spanningTree[0][1]], this.mst.relevances[this.mst.spanningTree[0][1]]);

        var counter = 2;
        for (var i = 1; i < this.mst.spanningTree.length; i++) {
            this.points[counter] = this.triangulate(this.points[counter - 2], this.points[counter - 1], this.mst.spanningTree[i]);
            counter++;
        }
    };
    this.getXCoordinateFromTimeSlot = function(slot) {
        return slot * this.timeslotOffset + 100;
    };
    this.getRenderedDistance = function(edgeWeight) {
        //note: edgeWeight is between [0;1]
        //0 nearest relation
        //1 farest relation
        return this.edgeOffset * (1 - edgeWeight);
    };
    //returns point
    this.triangulate = function(point1, point2, edge) {
        var index = edge[1];

        var r1 = this.getRenderedDistance(this.mst.getEdgeWeight(point1.index, index));
        var r2 = this.getRenderedDistance(this.mst.getEdgeWeight(point2.index, index));

        var keyword = this.mst.vertices[index];

        var distance = point1.distance(point2);
        var timeslotPosition = this.getXCoordinateFromTimeSlot(this.graph.getMostRelevantTimeslot(keyword));
        var popularity = this.mst.relevances[index];

        var x = -1;
        var y = -1;

        if (Math.abs(r1 - r2) > distance) {
            if (r1 < r2) {
                var vector = new Vector(point2, point1);
                vector.normalise();
                var temp = vector.move(point1, r1);
                temp = vector.move(point1, (r2 - new Point(temp[0], temp[1], 0, "", 0).distance(point1)) / 2);
                x = temp[0];
                y = temp[1];
            }
            else {
                var vector = new Vector(point1, point2).normalise();
                var temp = vector.move(point2, r2);
                temp = vector.move(point2, (r1 - new Point(temp[0], temp[1], 0, "", 0).distance(point1)) / 2);
                x = temp[0];
                y = temp[1];
            }
        }
        else {
            if (r1 + r2 < distance) {
                x = (point1.x + point2.x) / 2;
                y = (point1.y + point2.y) / 2;
            }
            else {
                if (r1 + r2 - distance === 0.001) {
                    var vector = new Vector(point1, point2);
                    vector.normalise();
                    var temp = vector.move(point1, r1);
                    x = temp[0];
                    y = temp[1];
                }
                else {

                    var a = (r1 * r1 - r2 * r2 + distance * distance) / (2 * distance);
                    var b = distance - a;
                    var tmpPoint = new Vector(point1, point2).normalise().move(point1, distance / 2);
                    var h = Math.sqrt(r1 * r1 - a * a);

                    var intersection1 = [tmpPoint[0] + (h / distance) * (point2.y - point1.y), tmpPoint[1] - (h / distance) * (point2.x - point1.x)];
                    var intersection2 = [tmpPoint[0] - (h / distance) * (point2.y - point1.y), tmpPoint[1] + (h / distance) * (point2.x - point1.x)];

                    if (Math.abs(intersection1[0] - timeslotPosition) <= Math.abs(intersection2[0] - timeslotPosition)) {
                        x = intersection1[0];
                        y = intersection1[1];
                    }
                    else {
                        x = intersection2[0];
                        y = intersection2[1];
                    }
                }
            }
        }
        return new Point(x, y, index, keyword, popularity);
    }
    this.getFontSize = function(point) {
        return point.popularity * this.maxFontSize;
    };
    this.render = function() {
        for (var i = 2; i < 7; i++) {
            this.context.fillStyle=this.getTimeslotColor(i-1);
            this.context.fillRect((i-2)*this.timeslotOffset+100,30,this.timeslotOffset,this.height-60);
        }

        for (var it = 0; it < 10; it++) {
            for (var i = 0; i < this.points.length; i++) {
                for (var j = 0; j < this.points.length; j++) {
                    if (i !== j)
                        this.applySpringForce(this.points[i], this.points[j]);
                }
                for (var j = 0; j < this.points.length; j++) {
                    if (i !== j)
                        this.applyRepulsiveForce(this.points[i], this.points[j]);
                }
                this.applyAttractiveForce(this.points[i]);
            }
        }
        this.context.fillStyle='#000000';
        for (var i = 0; i < this.points.length; i++) {
            this.context.font = this.getFontSize(this.points[i]) + "px Arial";
            this.context.fillText(this.points[i].keyword, this.points[i].x, this.points[i].y);
        }
    };
    this.calculateOverlayArea = function(point1, point2) {
        var result = this.calculateOverlay(point1, point2);
        if (result === 0) {
            return 0;
        }
        else {
            return result[0] * result[1];
        }
    };
    this.calculateOverlay = function(point1, point2) {
        var p1 = point1;
        var p2 = point2;
        this.context.font = this.getFontSize(point1) + "px Arial";
        var w = this.context.measureText(point1.keyword).width;
        if (point1.x > point2.x) {
            p1 = point2;
            p2 = point1;
            this.context.font = this.getFontSize(point2) + "px Arial";
            w = this.context.measureText(point2.keyword).width;
        }

        if (p1.x + w > p2.x) {
            var d_x = p1.x + w - p2.x;
            p1 = point1;
            p2 = point2;
            var h = this.getFontSize(p2);
            if (p1.y > p2.y) {
                p1 = point2;
                p2 = point1;
                h = this.getFontSize(p2);
            }

            if (p2.y - h - p1.y < 0) {
                var d_y = p1.y - p2.y + h;

                return [d_x, d_y];
            }
            else {
                return 0;
            }
        }
        else {
            return 0;
        }
    };
    this.applySpringForce = function(point1, point2) {
        var distance = point1.distance(point2);
        var optDistance = this.getRenderedDistance(this.mst.getEdgeWeight(point1.index, point2.index));
        //var force = (optDistance - distance) * point1.popularity * point2.popularity * this.k_s;
        var force=distance* point1.popularity * point2.popularity * this.k_s;
        var direction = new Vector(point1, point2).normalise();
        point1.move(direction, force/2);
        point2.move(new Vector(point2, point1).normalise(), force/2);
    };
    this.applyRepulsiveForce = function(point1, point2) {
        var deltas = this.calculateOverlay(point1, point2);
        var area = 0;
        if (deltas !== 0) {
            area = deltas[0] * deltas[1];
        }

        if (area > 0.1) {
            var d_l = Math.sqrt(deltas[0] * deltas[0] + deltas[1] * deltas[1]);
            var force = this.k_r * d_l;
            point1.move(new Vector(point2, point1).normalise(), force / 2);
            point2.move(new Vector(point1, point2).normalise(), force / 2);
        }
    };
    this.applyAttractiveForce = function(point) {
        var timeslotPosition = this.getXCoordinateFromTimeSlot(this.graph.getMostRelevantTimeslot(point.keyword));
        var force = this.k_a * point.popularity * (timeslotPosition - point.x);
        var direction = new Vector(point, point);
        direction.x = 1;
        direction.y = 0;
        point.move(direction, force);
    };

    this.getTimeslotColor = function(i) {
        var color = '#000000';
        switch (i) {
            case 1:
                {
                    //color = '#4f81bd';
                    color = 'rgba(79,129,189,0.05)';
                    break;
                }
            case 2:
                {
                    //color = '#c0504d';
                    color = 'rgba(192,80,77,0.05)';
                    break;
                }
            case 3:
                {
                    //color = '#9bbb59';
                    color = 'rgba(155,187,89,0.05)';
                    break;
                }
            case 4:
                {
                    //color = '#8064a2';
                    color = 'rgba(128,100,162,0.05)';
                    break;
                }
            case 5:
                {
                    //color = '#4bacc6';
                    color = 'rgba(75,172,198,0.05)';
                    break;
                }
        }
        return color;
    }
}

