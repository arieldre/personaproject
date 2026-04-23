export interface Cluster {
  centroid: number[]
  memberIndices: number[]
}

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  // Zero-vector guard — cosine undefined, return 0 by convention
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

// k-means++ initialization: first centroid chosen uniformly at random,
// each subsequent centroid chosen with probability proportional to D²
// (squared distance to nearest existing centroid). This spreads centroids
// and typically converges faster than random init.
function kmeansppInit(vectors: number[][], k: number): number[][] {
  const n = vectors.length
  const centroids: number[][] = []

  // Pick first centroid uniformly
  centroids.push([...vectors[Math.floor(Math.random() * n)]])

  for (let c = 1; c < k; c++) {
    // Compute D² for each vector: squared distance to its nearest centroid so far
    const distances = vectors.map((v) => {
      const minDist = Math.min(...centroids.map((cen) => euclideanDistance(v, cen)))
      return minDist * minDist
    })

    const total = distances.reduce((s, d) => s + d, 0)

    // Weighted random selection
    let threshold = Math.random() * total
    let chosen = n - 1
    for (let i = 0; i < n; i++) {
      threshold -= distances[i]
      if (threshold <= 0) {
        chosen = i
        break
      }
    }
    centroids.push([...vectors[chosen]])
  }

  return centroids
}

function assignClusters(vectors: number[][], centroids: number[][]): number[] {
  return vectors.map((v) => {
    let bestIdx = 0
    let bestDist = euclideanDistance(v, centroids[0])
    for (let c = 1; c < centroids.length; c++) {
      const d = euclideanDistance(v, centroids[c])
      if (d < bestDist) {
        bestDist = d
        bestIdx = c
      }
    }
    return bestIdx
  })
}

function recomputeCentroids(vectors: number[][], assignments: number[], k: number, dims: number): number[][] {
  const sums: number[][] = Array.from({ length: k }, () => new Array(dims).fill(0))
  const counts: number[] = new Array(k).fill(0)

  for (let i = 0; i < vectors.length; i++) {
    const c = assignments[i]
    counts[c]++
    for (let d = 0; d < dims; d++) {
      sums[c][d] += vectors[i][d]
    }
  }

  return sums.map((sum, c) => {
    if (counts[c] === 0) {
      // Empty cluster — reinitialize to a random vector to avoid NaN centroids
      return [...vectors[Math.floor(Math.random() * vectors.length)]]
    }
    return sum.map((s) => s / counts[c])
  })
}

function centroidsEqual(a: number[][], b: number[][], eps = 1e-10): boolean {
  for (let c = 0; c < a.length; c++) {
    for (let d = 0; d < a[c].length; d++) {
      if (Math.abs(a[c][d] - b[c][d]) > eps) return false
    }
  }
  return true
}

export function kmeanspp(vectors: number[][], k: number, maxIter = 100): Cluster[] {
  if (vectors.length === 0) throw new Error('No vectors provided')
  if (k < 1) throw new Error('k must be >= 1')
  // Clamp k to number of vectors so we never have more centroids than points
  const actualK = Math.min(k, vectors.length)
  const dims = vectors[0].length

  let centroids = kmeansppInit(vectors, actualK)

  for (let iter = 0; iter < maxIter; iter++) {
    const assignments = assignClusters(vectors, centroids)
    const newCentroids = recomputeCentroids(vectors, assignments, actualK, dims)

    if (centroidsEqual(centroids, newCentroids)) break
    centroids = newCentroids
  }

  // Build final clusters
  const assignments = assignClusters(vectors, centroids)
  const clusters: Cluster[] = centroids.map((centroid) => ({ centroid, memberIndices: [] }))
  for (let i = 0; i < assignments.length; i++) {
    clusters[assignments[i]].memberIndices.push(i)
  }

  return clusters
}
