      //Diagonal boards, Diagonal tiles
      for(var a = 0;a < 4;a += 1){
        for(var b = 0;b < 4;b += 1){
          //2 different ways of achieving the same thing (leaving both here for future reference)
          
          directs.push([
            (a < 2 ? 0 : (1-(a%2)*2)),
            (a < 2 ? (1-(a%2)*2) : 0),
            (b < 2 ? 0 : (1-(b%2)*2)),
            (b < 2 ? (1-(b%2)*2) : 0)
          ]);
          
        }
      }
      //Orthogonal boards, Diagonal tiles
      for(var a = 0;a < 4;a += 1){
        for(var b = 0;b < 4;b += 1){
          //2 different ways of achieving the same thing (leaving both here for future reference)
          
          directs.push([
            (a%2 == 0 ? -1 : 1),
            (a < 2 ? -1 : 1),
            (b < 2 ? 0 : (1-(b%2)*2)),
            (b < 2 ? (1-(b%2)*2) : 0)
          ]);
          
        }
      }
      //Diagonal boards, Orthogonal tiles
      for(var a = 0;a < 4;a += 1){
        for(var b = 0;b < 4;b += 1){
          //2 different ways of achieving the same thing (leaving both here for future reference)
          
          directs.push([
            (a < 2 ? 0 : (1-(a%2)*2)),
            (a < 2 ? (1-(a%2)*2) : 0),
            (b%2 == 0 ? -1 : 1),
            (b < 2 ? -1 : 1)
          ]);
          
        }
      }
      //Diagonal boards, Diagonal tiles
      for(var a = 0;a < 4;a += 1){
        for(var b = 0;b < 4;b += 1){
          //2 different ways of achieving the same thing (leaving both here for future reference)
          
          directs.push([
            (a%2 == 0 ? -1 : 1),
            (a < 2 ? -1 : 1),
            (b%2 == 0 ? -1 : 1),
            (b < 2 ? -1 : 1)
          ]);
          
        }
      }
