let counter: i32 = 0;
let totalOperations: i32 = 0;

export function getCounter(): i32 {
  return counter;
}

export function increment(): i32 {
  counter++;
  totalOperations++;
  return counter;
}

export function decrement(): i32 {
  counter--;
  totalOperations++;
  return counter;
}

export function reset(): i32 {
  counter = 0;
  totalOperations++;
  return counter;
}

export function getTotalOperations(): i32 {
  return totalOperations;
}

export function add(value: i32): i32 {
  counter += value;
  totalOperations++;
  return counter;
}

export function multiply(value: i32): i32 {
  counter *= value;
  totalOperations++;
  return counter;
}

export function isEven(): bool {
  return counter % 2 == 0;
}

export function isPositive(): bool {
  return counter > 0;
}

export function getSquare(): i32 {
  return counter * counter;
}

export function fibonacci(): i32 {
  if (counter <= 1) return counter;
  
  let a: i32 = 0;
  let b: i32 = 1;
  let temp: i32;
  
  for (let i: i32 = 2; i <= counter; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
}