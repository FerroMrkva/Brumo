// MIT License
// Andrej Karpathy
// core of the backpropagation code was yanked and adapted from Heather Arthur's project https://github.com/harthur/brain

var nnjs = (function(){
  
  var NeuralNetwork = function(options) {
  options = options || {};
  this.learningRate = options.learningRate || 0.1;
  this.momentum = options.momentum || 0.0;
}

NeuralNetwork.prototype = {
  initialize: function(sizes) {
    this.sizes = sizes;
    this.outputLayer = this.sizes.length - 1;

    // weights, biases and activations
    this.biases = []; 
    this.weights = [];
    this.outputs = [];
    
    // vars used in backprop
    this.deltas = [];
    this.errors = [];

    for (var layer = 0; layer <= this.outputLayer; layer++) {
      var size = this.sizes[layer];
      this.deltas[layer] = zeros(size);
      this.errors[layer] = zeros(size);
      this.outputs[layer] = zeros(size);

      if (layer > 0) {
        this.biases[layer] = randos(size);
        this.weights[layer] = new Array(size);

        for (var node = 0; node < size; node++) {
          var prevSize = this.sizes[layer - 1];
          this.weights[layer][node] = randos(prevSize);
        }
      }
    }
  },
    
  shock : function() {
    // shock the weights
    for(var layer=1;layer<=this.outputLayer;layer++) {
        for(var node=0;node<this.sizes[layer];node++) {
            var w= this.weights[layer][node];
            for(var i=0;i<w.length;i++) {
                w[i] += Math.random()*3-1.5;
            }
        }
    }
  },
  
  train : function(input, target) {
    
    this.forwardProp(input);
    this.calculateDeltas(target);
    this.adjustWeights();
    
    var error = mse(this.errors[this.outputLayer]);
    return error;
  },
  
  // forward prop input to output
  forwardProp: function(input) {
    this.outputs[0] = input; 
    for (var layer = 1; layer <= this.outputLayer; layer++) {
      for (var node = 0; node < this.sizes[layer]; node++) {
        var weights = this.weights[layer][node];

        var sum = this.biases[layer][node];
        for (var k = 0; k < weights.length; k++) {
          sum += weights[k] * input[k];
        }
        this.outputs[layer][node] = 1 / (1 + Math.exp(-sum));
      }
      var output = input = this.outputs[layer];
    }
    return output;
  },

  calculateDeltas: function(target) {
    for (var layer = this.outputLayer; layer >= 0; layer--) {
      for (var node = 0; node < this.sizes[layer]; node++) {
        
        var output = this.outputs[layer][node];
        var error = 0;
        if (layer == this.outputLayer) {
          error = target[node] - output;
        } else {
          var deltas = this.deltas[layer + 1];
          for (var k = 0; k < deltas.length; k++) {
            error += deltas[k] * this.weights[layer + 1][k][node];
          }
        }
        
        this.errors[layer][node] = error;
        this.deltas[layer][node] = error * output * (1 - output);
      }
    }
  },

  adjustWeights: function() {
    for (var layer = 1; layer <= this.outputLayer; layer++) {
      
      var incoming = this.outputs[layer - 1];
      for (var node = 0; node < this.sizes[layer]; node++) {
        
        var delta = this.deltas[layer][node];
        for (var k = 0; k < incoming.length; k++) {
          this.weights[layer][node][k] += this.learningRate * delta * incoming[k];
        }
        this.biases[layer][node] += this.learningRate * delta;
      }
    }
  },

  test : function(data) {
    var output = this.forwardProp(data[i].input);
    var dec = output[0] > 0.5 ? 1 : 0;
    return dec;
  },
}

  function randomWeight() {
    return Math.random() * 4 - 2;
  }

  function zeros(size) {
    var array = new Array(size);
    for (var i = 0; i < size; i++) {
      array[i] = 0;
    }
    return array;
  }

  function randos(size) {
    var array = new Array(size);
    for (var i = 0; i < size; i++) {
      array[i] = randomWeight();
    }
    return array;
  }


  function mse(errors) {
    // mean squared error
    var sum = 0;
    for (var i = 0; i < errors.length; i++) {
      sum += Math.pow(errors[i], 2);
    }
    return sum / errors.length;
  }

  // export public members
  var exports = {};
  exports.NeuralNetwork = NeuralNetwork;
  return exports;
  
})();
