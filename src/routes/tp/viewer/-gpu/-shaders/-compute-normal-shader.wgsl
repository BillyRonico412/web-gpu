@group(0) @binding(0) var<uniform> triangle_count: u32;
@group(0) @binding(1) var<storage,read> vertexes: array<vec3f>;
@group(0) @binding(2) var<storage,read> vertex_indexes: array<u32>;
@group(0) @binding(3) var<storage, read_write> flat_normals: array<vec3f>;
@group(0) @binding(4) var<storage, read_write> flat_normal_indexes: array<u32>;
@group(0) @binding(5) var<storage, read_write> smooth_normals_atomic: array<atomic<i32>>;
@group(0) @binding(5) var<storage, read_write> smooth_normals: array<vec3f>;
@group(0) @binding(6) var<storage, read_write> smooth_normal_indexes: array<u32>;

fn compute_normal(vertex_0: vec3f, vertex_1: vec3f, vertex_2: vec3f) -> vec3f {
    let edge1 = vertex_1 - vertex_0;
    let edge2 = vertex_2 - vertex_0;
    let cross_prod = cross(edge1, edge2);
    return normalize(cross_prod);
}

@compute @workgroup_size(64) fn pass_flat(
    @builtin(global_invocation_id) invocation_id: vec3u
) {
    // Triangle index
    let invocation_index = invocation_id.x;
    if invocation_index >= triangle_count {
        return;
    }
    let vertex_index_0 = vertex_indexes[invocation_index * 3];
    let vertex_index_1 = vertex_indexes[invocation_index * 3 + 1];
    let vertex_index_2 = vertex_indexes[invocation_index * 3 + 2];

    let vertex_0 = vertexes[vertex_index_0];
    let vertex_1 = vertexes[vertex_index_1];
    let vertex_2 = vertexes[vertex_index_2];

    let normal = compute_normal(vertex_0, vertex_1, vertex_2);

    flat_normals[invocation_index] = normal;
    flat_normal_indexes[invocation_index * 3] = invocation_index;
    flat_normal_indexes[invocation_index * 3 + 1] = invocation_index;
    flat_normal_indexes[invocation_index * 3 + 2] = invocation_index;
}

const BIG_NUMBER: f32 = 100000000;

fn add_normal_atomic(index: u32, normal: vec3f) {
    // On convertit le float en int pour l'atomique
    atomicAdd(&smooth_normals_atomic[index * 3u + 0u], i32(normal.x * BIG_NUMBER));
    atomicAdd(&smooth_normals_atomic[index * 3u + 1u], i32(normal.y * BIG_NUMBER));
    atomicAdd(&smooth_normals_atomic[index * 3u + 2u], i32(normal.z * BIG_NUMBER));
    atomicAdd(&smooth_normals_atomic[index * 3u + 3u], 1);
}

@compute @workgroup_size(64) fn pass_sum(
    @builtin(global_invocation_id) invocation_id: vec3u
) {
    // Index in vertex
    let invocation_index = invocation_id.x;
    let vertex_index = vertex_indexes[invocation_index];
    let normal_index = flat_normal_indexes[invocation_index];
    let normal = flat_normals[normal_index];
    add_normal_atomic(vertex_index, normal);
    smooth_normal_indexes[invocation_index] = vertex_index;
}

@compute @workgroup_size(64) fn pass_smooth(
    @builtin(global_invocation_id) invocation_id: vec3u
) {
    // Vertex index
    let invocation_index = invocation_id.x;
    let nb_edges = smooth_normals[invocation_index * 3 + 3];
    smooth_normals[invocation_index * 3 + 0] /= nb_edges;
    smooth_normals[invocation_index * 3 + 1] /= nb_edges;
    smooth_normals[invocation_index * 3 + 2] /= nb_edges;
}