// An array containing all the directions the queen can move, now replaced by a set of loops


      //Time travel directions (x,y,b,t)
      var directs = [
        //Same tile (X & Y) directions:
        
        //Rook directions:
        [0,0,0,-1],
        [0,0,0,1],
        [0,0,-1,0],
        [0,0,1,0],
        
        //Bishop directions:
        [0,0,-1,-1],
        [0,0,1,-1],
        [0,0,-1,1],
        [0,0,1,1],
        
        //Different tile directions:
        
        //Bishop directions:
        [-1,0,-1,0],
        [0,-1,-1,0],
        [1,0,-1,0],
        [0,1,-1,0],
        
        [-1,0,1,0],
        [0,-1,1,0],
        [1,0,1,0],
        [0,1,1,0],
        
        [-1,0,0,-1],
        [0,-1,0,-1],
        [1,0,0,-1],
        [0,1,0,-1],
        
        [-1,0,0,1],
        [0,-1,0,1],
        [1,0,0,1],
        [0,1,0,1],
        
        //Queen-exclusive directions:
        [-1,-1,-1,0],
        [1,-1,-1,0],
        [-1,1,-1,0],
        [1,1,-1,0],
        
        [-1,-1,1,0],
        [1,-1,1,0],
        [-1,1,1,0],
        [1,1,1,0],
        
        [-1,-1,0,-1],
        [1,-1,0,-1],
        [-1,1,0,-1],
        [1,1,0,-1],
        
        [-1,-1,0,1],
        [1,-1,0,1],
        [-1,1,0,1],
        [1,1,0,1],
        
        //Queen-exclusive directions (diagonal boards):
        [-1,-1,-1,-1],
        [1,-1,-1,-1],
        [-1,1,-1,-1],
        [1,1,-1,-1],
        
        [-1,-1,-1,1],
        [1,-1,-1,1],
        [-1,1,-1,1],
        [1,1,-1,1],
        
        [-1,-1,1,-1],
        [1,-1,1,-1],
        [-1,1,1,-1],
        [1,1,1,-1],
        
        [-1,-1,1,1],
        [1,-1,1,1],
        [-1,1,1,1],
        [1,1,1,1],
        
        //
        [-1,0,-1,-1],
        [1,0,-1,-1],
        [0,-1,-1,-1],
        [0,1,-1,-1],
        
        [-1,0,-1,1],
        [1,0,-1,1],
        [0,-1,-1,1],
        [0,1,-1,1],
        
        [-1,0,1,-1],
        [1,0,1,-1],
        [0,-1,1,-1],
        [0,1,1,-1],
        
        [-1,0,1,1],
        [1,0,1,1],
        [0,-1,1,1],
        [0,1,1,1]
        
      ];
