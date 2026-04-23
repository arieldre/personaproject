/**
 * Clustering Service
 * 
 * Implements k-means clustering on VCPQ meta-vectors to group similar
 * responses into aggregated personas.
 */

/**
 * Calculate Euclidean distance between two meta-vector objects
 */
function euclideanDistance(vec1, vec2) {
    const keys = Object.keys(vec1);
    let sum = 0;
    for (const key of keys) {
        const diff = (vec1[key] || 0) - (vec2[key] || 0);
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Calculate centroid (average) of a cluster of meta-vectors
 */
function calculateCentroid(vectors) {
    if (vectors.length === 0) return null;

    const keys = Object.keys(vectors[0]);
    const centroid = {};

    for (const key of keys) {
        const sum = vectors.reduce((acc, v) => acc + (v[key] || 0), 0);
        centroid[key] = Math.round((sum / vectors.length) * 100) / 100;
    }

    return centroid;
}

/**
 * Initialize centroids using k-means++ algorithm for better starting positions
 */
function initializeCentroids(vectors, k) {
    const centroids = [];
    const usedIndices = new Set();

    // Pick first centroid randomly
    const firstIdx = Math.floor(Math.random() * vectors.length);
    centroids.push({ ...vectors[firstIdx] });
    usedIndices.add(firstIdx);

    // Pick remaining centroids with probability proportional to distance
    while (centroids.length < k) {
        const distances = vectors.map((v, i) => {
            if (usedIndices.has(i)) return 0;
            const minDist = Math.min(...centroids.map(c => euclideanDistance(v, c)));
            return minDist * minDist; // Square for probability weighting
        });

        const totalDist = distances.reduce((a, b) => a + b, 0);
        if (totalDist === 0) break;

        let random = Math.random() * totalDist;
        for (let i = 0; i < distances.length; i++) {
            random -= distances[i];
            if (random <= 0 && !usedIndices.has(i)) {
                centroids.push({ ...vectors[i] });
                usedIndices.add(i);
                break;
            }
        }
    }

    return centroids;
}

/**
 * Assign each vector to nearest centroid
 */
function assignToClusters(vectors, centroids) {
    return vectors.map(v => {
        let minDist = Infinity;
        let cluster = 0;

        centroids.forEach((c, i) => {
            const dist = euclideanDistance(v, c);
            if (dist < minDist) {
                minDist = dist;
                cluster = i;
            }
        });

        return { cluster, distance: minDist };
    });
}

/**
 * K-means clustering algorithm
 * @param {Array} dataPoints - Array of {id, metaVectors, ...otherData}
 * @param {number} k - Number of clusters (max personas)
 * @param {number} maxIterations - Max iterations for convergence
 * @returns {Array} Clusters with assigned data points
 */
function kMeansClustering(dataPoints, k, maxIterations = 50) {
    if (dataPoints.length === 0) return [];
    if (dataPoints.length <= k) {
        // If fewer points than clusters, each is its own cluster
        return dataPoints.map((dp, i) => ({
            clusterId: i,
            centroid: dp.metaVectors,
            members: [dp],
            size: 1
        }));
    }

    const vectors = dataPoints.map(dp => dp.metaVectors);
    let centroids = initializeCentroids(vectors, k);
    let assignments = [];

    for (let iter = 0; iter < maxIterations; iter++) {
        // Assign points to clusters
        assignments = assignToClusters(vectors, centroids);

        // Calculate new centroids
        const newCentroids = [];
        for (let i = 0; i < k; i++) {
            const clusterVectors = vectors.filter((_, idx) => assignments[idx].cluster === i);
            if (clusterVectors.length > 0) {
                newCentroids.push(calculateCentroid(clusterVectors));
            } else {
                // Keep old centroid if cluster is empty
                newCentroids.push(centroids[i]);
            }
        }

        // Check for convergence
        let converged = true;
        for (let i = 0; i < k; i++) {
            if (euclideanDistance(centroids[i], newCentroids[i]) > 0.001) {
                converged = false;
                break;
            }
        }

        centroids = newCentroids;

        if (converged) {
            console.log(`[Clustering] Converged after ${iter + 1} iterations`);
            break;
        }
    }

    // Build cluster objects
    const clusters = [];
    for (let i = 0; i < k; i++) {
        const members = dataPoints.filter((_, idx) => assignments[idx].cluster === i);
        if (members.length > 0) {
            clusters.push({
                clusterId: i,
                centroid: centroids[i],
                members,
                size: members.length,
                avgDistance: members.reduce((sum, m, idx) => {
                    const origIdx = dataPoints.indexOf(m);
                    return sum + assignments[origIdx].distance;
                }, 0) / members.length
            });
        }
    }

    return clusters.sort((a, b) => b.size - a.size); // Sort by size descending
}

/**
 * Determine optimal k using elbow method or silhouette
 * For simplicity, we use a heuristic: sqrt(n/2) capped at maxK
 */
function determineOptimalK(n, maxK = 10, minK = 3) {
    if (n <= minK) return n;

    // Heuristic: sqrt(n/2), rounded, capped
    const suggested = Math.round(Math.sqrt(n / 2));
    return Math.max(minK, Math.min(maxK, suggested));
}

/**
 * Aggregate demographics from cluster members
 */
function aggregateDemographics(members) {
    const allDemographics = members.map(m => m.demographics || {});

    // Count frequencies for each field
    const fieldCounts = {};
    for (const demo of allDemographics) {
        for (const [key, value] of Object.entries(demo)) {
            if (!fieldCounts[key]) fieldCounts[key] = {};
            const strValue = String(value);
            fieldCounts[key][strValue] = (fieldCounts[key][strValue] || 0) + 1;
        }
    }

    // Pick most common value for each field
    const aggregated = {};
    for (const [key, counts] of Object.entries(fieldCounts)) {
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
            aggregated[key] = sorted[0][0];
        }
    }

    return aggregated;
}

/**
 * Main clustering function for persona generation
 * @param {Array} responses - Array of processed responses with metaVectors
 * @param {Object} options - Clustering options
 * @returns {Array} Clustered personas ready for insertion
 */
function clusterResponses(responses, options = {}) {
    const { maxPersonas = 10, minPersonas = 3 } = options;

    console.log(`[Clustering] Processing ${responses.length} responses into max ${maxPersonas} personas`);

    // Prepare data points
    const dataPoints = responses.map(r => ({
        id: r.id,
        metaVectors: r.vectorResult.meta_vectors,
        vcpqScores: r.vcpqScores,
        demographics: r.demographics,
        vectorResult: r.vectorResult
    }));

    // Determine k
    const k = determineOptimalK(responses.length, maxPersonas, minPersonas);
    console.log(`[Clustering] Using k=${k} clusters for ${responses.length} responses`);

    // Run clustering
    const clusters = kMeansClustering(dataPoints, k);

    console.log(`[Clustering] Created ${clusters.length} clusters:`,
        clusters.map(c => `Cluster ${c.clusterId}: ${c.size} members`));

    return clusters;
}

module.exports = {
    euclideanDistance,
    calculateCentroid,
    kMeansClustering,
    determineOptimalK,
    aggregateDemographics,
    clusterResponses
};
