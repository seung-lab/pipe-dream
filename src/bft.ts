type HopMap = Float32Array;

interface HopMapData {
    map: HopMap,
    max: number,
    root: number
}

function bft(root: number, a_map: AdjacencyMap, node_count: number): HopMapData{
    let hops = 0;  	// Frontier Levels
    const visited = new Uint8Array(node_count);
    const hop_map = new Float32Array(node_count);

    hop_map.fill(-1000); // for discontinuity

    visited[root] = 1; // Hashmap: 0 -> False; 1 -> True

    let frontier = [root];
    let next_frontier: number[] = [];

    while (frontier.length) {
        for (let node of frontier) {
            hop_map[node] = hops;
            const neighbors = a_map.get(node)!;

            for (let neighbor of neighbors) {
                if (!visited[neighbor]) {
                    next_frontier.push(neighbor);
                    visited[neighbor] = 1;
                }
            }
        }

        frontier = next_frontier;
        next_frontier = [];
        hops++;
    }

    return {
        map: hop_map,
        max: hops - 1,
        root: root
    };
}

function bbft(start: number, a_map: AdjacencyMap, h_map: HopMap, node_count: number, output: Float32Array, offset: number) {    
    const startt = performance.now();
    const arrLength = output.length;

    for (let i = output.length - 4 + offset; i >= 0; i -= 4) {
        output[i] = 0;
    }
    // console.log('clear time', performance.now() - startt, 'ms');

    const visited = new Uint8Array(node_count);

    visited[start] = 1; // Hashmap: 0 -> False; 1 -> True

    let frontier = [start];
    let next_frontier: number[] = [];

    while (frontier.length) {
        for (let node of frontier) {
            output[node * 4 + offset] = 1;
            const c_hop = h_map[node];
            const neighbors = a_map.get(node)!;

            for (let neighbor of neighbors) {
                if (visited[neighbor]) {
                    continue;
                }
                if (h_map[neighbor] > c_hop) { //
                    continue;
                }
                
                next_frontier.push(neighbor);
                visited[neighbor] = 1;
            }
        }

        frontier = next_frontier;
        next_frontier = [];
    }
}
