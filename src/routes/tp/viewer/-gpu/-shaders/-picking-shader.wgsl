struct Uniform {
    mvp_matrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> uni: Uniform;
@group(1) @binding(0) var<storage, read> vertex_array: array<vec3f>;
@group(1) @binding(1) var<storage, read> vertex_indexes_array: array<u32>;
@group(1) @binding(2) var<storage, read> matrix_array: array<mat4x4f>;
@group(1) @binding(3) var<storage, read> matrix_indexes_array: array<u32>;
@group(1) @binding(4) var<storage, read> geometric_id_array: array<u32>;

struct VertexIn {
    @builtin(vertex_index) draw_index: u32,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @interpolate(flat) @location(0) draw_index: u32,
}

@vertex
fn vs_main(v_in: VertexIn) -> VertexOut {
    let vertex_index = vertex_indexes_array[v_in.draw_index];
    let matrix_index = matrix_indexes_array[v_in.draw_index];

    let vertex = vertex_array[vertex_index];
    let matrix = matrix_array[matrix_index];

    var v_out: VertexOut;
    v_out.position = uni.mvp_matrix * matrix * vec4f(vertex, 1);
    v_out.draw_index = v_in.draw_index;
    return v_out;
}

@fragment
fn fs_main(f_in: VertexOut) -> @location(0) u32 {
    let geometric_id = geometric_id_array[f_in.draw_index];
    return geometric_id;
}
