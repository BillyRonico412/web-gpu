struct VertexIn {
    @builtin(vertex_index) vertex_index: u32,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) world_position: vec3f,
    @location(1) normal: vec3f,
    @interpolate(flat) @location(2) material_index: u32,
}

struct Uniform {
    mvp_matrix: mat4x4f,
    light_direction: vec3f,
    camera_position: vec3f,
}

struct Material {
    color: vec4f,
    metalic: f32,
    roughness: f32,
}

@group(0) @binding(0) var<uniform> uni: Uniform;
@group(1) @binding(0) var<storage, read> vertex_array: array<vec3f>;
@group(1) @binding(1) var<storage, read> normal_array: array<vec3f>;
@group(1) @binding(2) var<storage, read> vertex_indexes_array: array<u32>;
@group(1) @binding(3) var<storage, read> normal_indexes_array: array<u32>;
@group(1) @binding(4) var<storage, read> material_array: array<Material>;
@group(1) @binding(5) var<storage, read> material_indexes_array: array<u32>;

@vertex
fn vs_main(v_in: VertexIn) -> VertexOut {
    let vertex_index = vertex_indexes_array[v_in.vertex_index];
    let normal_index = normal_indexes_array[v_in.vertex_index];
    let material_index = material_indexes_array[v_in.vertex_index];
    let vertex = vertex_array[vertex_index];
    let normal = normal_array[normal_index];
    var v_out: VertexOut;
    v_out.world_position = vertex;
    v_out.position = uni.mvp_matrix * vec4f(vertex, 1);
    v_out.normal = normal;
    v_out.material_index = material_index;
    return v_out;
}

@fragment
fn fs_main(f_in: VertexOut) -> @location(0) vec4f {
    let n = normalize(f_in.normal);
    let l = normalize(-uni.light_direction);

    let v = normalize(uni.camera_position - f_in.world_position);
    let h = normalize(l + v);

    let material = material_array[f_in.material_index];
    let diffuse = max(dot(n, l), 0.0);
    let ambient = 0.1;

    let shininess = mix(64.0, 256.0, 1.0 - material.roughness);
    let specular = pow(max(dot(n, h), 0.0), shininess) * material.metalic;

    let base_color = material.color.rgb;
    let final_color = base_color * (diffuse + ambient) + vec3f(0.2) * specular;
    return vec4f(final_color, 1);
}