// implementation of n**3 matrix multiplication

// A is a x N
// B is N x b
// final matrix is a x b in size

function matrixMultiply(A, B) {
  // for each row in A, we multiply by values in a column in B
  // AB[i,j] = sum(1, n, lambda: A[i, k] * B[k, j]
  // A.length = a, A[0].length = N
  // B.length = N, B[0].length = b
  //
  // 3x2 x 2x2 = 3x2
  ret = makeMatrix(A.length, B[0].length);
  for (var i = 0; i < A.length; i++) {
    for (var j = 0; j < B[0].length; j++) {
      var summed = 0;
      for (var k = 0; k < A[0].length; k++) {
        summed += A[i][k] * B[k][j];
      }

      ret[i][j] = summed;
    }
  }

  return ret;


}


// an NxM matrix is a matrix that is N rows by M columns
function makeMatrix(n, m, init) {
  init = init || function() { return 0 };

  var mat = [];
  for (var i = 0; i < n; i++) {
    var row = [];
    mat.push(row);
    for (var j = 0; j < m; j++) {
      row.push(init(i, j, n, m));

    }

  }

  return mat;
}

function printMatrix(mat) {
  console.log("--");
  for (var i = 0; i < mat.length; i++) {
    console.log(mat[i].join(" "));
  }

}

var A = [
  [1,4],
  [3,9],
  [8,6]
];

var B = [
  [1,6],
  [2,9]
];

//var A = makeMatrix(2, 3, function(i, j, n, m) {
//  return (i * m) + j
//});
//var B = makeMatrix(3, 5, function(i, j, n, m) {
//  return (i * m) + j
//});

printMatrix(A);
printMatrix(B);

AB = matrixMultiply(A, B);
console.log("RESULT IS", AB);
printMatrix(AB);
