@group(0) @binding(0) var<storage,read> vertexes: array<vec3f>;
@group(0) @binding(1) var<storage,read> vertex_indexes: array<u32>;
@group(0) @binding(2) var<storage, read_write> normals: array<vec3f>;
@group(0) @binding(3) var<storage, read_write> normal_indexes: array<u32>;
@group(0) @binding(4) var<uniform> triangle_count: u32;

fn compute_normal(v0: vec3f, v1: vec3f, v2: vec3f) -> vec3f {
    let edge1 = v1 - v0;
    let edge2 = v2 - v0;
    let cross_prod = cross(edge1, edge2);
    return normalize(cross_prod);
}

fn flat_shading(index: u32) {
    let i0 = vertex_indexes[index * 3];
    let i1 = vertex_indexes[index * 3 + 1];
    let i2 = vertex_indexes[index * 3 + 2];
    let v0 = vertexes[i0];
    let v1 = vertexes[i1];
    let v2 = vertexes[i2];
    let normal = compute_normal(v0, v1, v2);
    normals[index] = normal;
    normal_indexes[index * 3] = index;
    normal_indexes[index * 3 + 1] = index;
    normal_indexes[index * 3 + 2] = index;
}

@compute @workgroup_size(64) fn cs_main(
    @builtin(global_invocation_id) invocation_id: vec3u
) {
    let index = invocation_id.x;
    if index >= triangle_count {
        return;
    }
    flat_shading(index);
}