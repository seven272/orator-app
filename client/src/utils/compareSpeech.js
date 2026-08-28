const calculateXP = (accuracy) => {
  let result = 0
  if (accuracy === 0) {
    result = 0
  } else if (accuracy > 0 && accuracy < 10) {
    result = 5
  } else if (accuracy > 10 && accuracy < 80) {
    result = 15
  } else if (accuracy >= 80) {
    result = 30
  }

  return result
}

const calculateAccuracy = (original, spoken) => {
  const s1 = original
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .trim()
  const s2 = spoken
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .trim()

  if (s1 === s2) return 100
  if (s2.length === 0) return 0

  const costs = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j
      else {
        if (j > 0) {
          let newValue = costs[j - 1]
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue =
              Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }

  const maxLength = Math.max(s1.length, s2.length)
  const diff = costs[s2.length]
  const accuracy = ((maxLength - diff) / maxLength) * 100

  return Math.max(0, Math.round(accuracy))
}

export { calculateXP, calculateAccuracy }
