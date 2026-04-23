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

// Silhouette score for a clustering result.
// Returns value in [-1, 1]; higher = better-separated clusters.
export function silhouetteScore(vectors: number[][], clusters: Cluster[]): number {
  const n = vectors.length
  if (clusters.length <= 1 || n < 2) return 0

  // Build assignment map: vectorIndex → clusterIndex
  const assignment = new Array<number>(n)
  for (let c = 0; c < clusters.length; c++) {
    for (const idx of clusters[c].memberIndices) assignment[idx] = c
  }

  let totalS = 0
  for (let i = 0; i < n; i++) {
    const ci = assignment[i]
    const clusterMembers = clusters[ci].memberIndices

    // a(i): mean distance to other points in same cluster
    let a = 0
    if (clusterMembers.length > 1) {
      let sum = 0
      for (const j of clusterMembers) {
        if (j !== i) sum += euclideanDistance(vectors[i], vectors[j])
      }
      a = sum / (clusterMembers.length - 1)
    }

    // b(i): min mean distance to any other cluster
    let b = Infinity
    for (let c = 0; c < clusters.length; c++) {
      if (c === ci || clusters[c].memberIndices.length === 0) continue
      let sum = 0
      for (const j of clusters[c].memberIndices) {
        sum += euclideanDistance(vectors[i], vectors[j])
      }
      const mean = sum / clusters[c].memberIndices.length
      if (mean < b) b = mean
    }

    const s = b === Infinity ? 0 : (b - a) / Math.max(a, b)
    totalS += s
  }

  return totalS / n
}

// Run kmeanspp `attempts` times for a given k, return the clustering with best silhouette.
function bestKmeans(vectors: number[][], k: number, attempts = 3): { clusters: Cluster[]; score: number } {
  let best: Cluster[] | null = null
  let bestScore = -Infinity
  for (let t = 0; t < attempts; t++) {
    const clusters = kmeanspp(vectors, k)
    const score = silhouetteScore(vectors, clusters)
    if (score > bestScore) { bestScore = score; best = clusters }
  }
  return { clusters: best!, score: bestScore }
}

// Automatically choose k in [minK, maxK] using silhouette score.
// Runs kmeanspp multiple times per k and picks the k with the highest score.
export function optimalK(vectors: number[][], minK = 3, maxK = 10): number {
  const n = vectors.length
  // Need at least 2 points per cluster to compute silhouette
  const hi = Math.min(maxK, Math.floor(n / 2))
  const lo = Math.min(minK, hi)
  if (lo === hi) return lo

  let bestK = lo
  let bestScore = -Infinity
  for (let k = lo; k <= hi; k++) {
    const { score } = bestKmeans(vectors, k)
    if (score > bestScore) { bestScore = score; bestK = k }
  }
  return bestK
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
