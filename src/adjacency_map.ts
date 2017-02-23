type AdjacencyMap = Map<number, number[]>

let x = new Uint32Array(0);

function createAdjacencyMap(faces: Uint32Array): AdjacencyMap {
    // Setup Adjacency Map
    const adjacencyMap = new Map() as AdjacencyMap;
	{
		for (let vertex of faces) {
			adjacencyMap.set(vertex, []); // Allocate a new array, one for each vertex -> ignore duplicates
		}

		// Generate Adjacency Map
        let v1, v2, v3;
		for (let i = 0; i < faces.length; i+=3) {
			v1 = faces[i];
			v2 = faces[i+1];
			v3 = faces[i+2];
			adjacencyMap.get(v1)!.push(v2, v3);
			adjacencyMap.get(v2)!.push(v1, v3);
			adjacencyMap.get(v3)!.push(v2, v1);
		}
	}

    return adjacencyMap;
}
