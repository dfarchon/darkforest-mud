export function range(start: number, stop: number, step: number = 1) {
  const numbers = [];
  for (let value = start; value < stop; value += step) {
    numbers.push(value);
  }

  return numbers;
}
