struct Face {
    vertex_index: u32,
    normal_index: u32,
}

struct VertexIn {
    @builtin(vertex_index) vertex_index: u32,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(1) normal: vec3f,
}

@group(0) @binding(0) var<uniform> mvp_matrix: mat4x4f;
@group(0) @binding(1) var<uniform> light_direction: vec3f;
@group(1) @binding(0) var<storage, read> vertex_array: array<vec3f>;
@group(1) @binding(1) var<storage, read> normal_array: array<vec3f>;
@group(1) @binding(2) var<storage, read> vertex_indexes_array: array<u32>;
@group(1) @binding(3) var<storage, read> normal_indexes_array: array<u32>;

@vertex
fn vs_main(v_in: VertexIn) -> VertexOut {
    let vertex_index = vertex_indexes_array[v_in.vertex_index];
    let normal_index = normal_indexes_array[v_in.vertex_index];
    let vertex = vertex_array[vertex_index];
    let normal = normal_array[normal_index];
    var v_out: VertexOut;
    v_out.position = mvp_matrix * vec4f(vertex, 1);
    v_out.normal = normal;
    return v_out;
}

@fragment
fn fs_main(f_in: VertexOut) -> @location(0) vec4f {
    let n = normalize(f_in.normal);
    let l = normalize(-light_direction);
    let diffuse = max(dot(n, l), 0.0);
    let ambient = 0.15;
    let base_color = vec3f(0.7, 0.75, 0.8);
    let final_color = base_color * (ambient + 0.85 * diffuse);
    return vec4f(final_color, 1);
}