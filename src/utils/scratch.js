export const revealThreshold = 0.45

export function clearedFraction({ data, width, height }, step = 6) {
  let clear = 0
  let samples = 0
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] < 128) clear += 1
      samples += 1
    }
  }
  return samples ? clear / samples : 0
}
