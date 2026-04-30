

struct Uniform {
    mvp_matrix: mat4x4f,
    light_direction: vec3f,
    camera_position: vec3f,
    ambient: f32,
    specular_intensity: f32,
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
@group(1) @binding(6) var<storage, read> matrix_array: array<mat4x4f>;
@group(1) @binding(7) var<storage, read> matrix_indexes_array: array<u32>;

struct VertexIn {
    @builtin(vertex_index) draw_index: u32,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @interpolate(flat) @location(0) draw_index: u32,
    @location(1) world_position: vec3f,
    @location(2) normal: vec3f,
}

@vertex
fn vs_main(v_in: VertexIn) -> VertexOut {
    let vertex_index = vertex_indexes_array[v_in.draw_index];
    let normal_index = normal_indexes_array[v_in.draw_index];
    let matrix_index = matrix_indexes_array[v_in.draw_index];

    let matrix = matrix_array[matrix_index];
    let vertex = vertex_array[vertex_index];
    let normal = normal_array[normal_index];

    let rotationMatrix = mat3x3<f32>(
        matrix[0].xyz,
        matrix[1].xyz,
        matrix[2].xyz
    );

    var v_out: VertexOut;
    v_out.world_position = vertex;
    v_out.position = uni.mvp_matrix * matrix * vec4f(vertex, 1);
    v_out.normal = normalize(rotationMatrix * normal);
    v_out.draw_index = v_in.draw_index;
    return v_out;
}

const MIN_SHININESS: f32 = 32.0;
const MAX_SHININESS: f32 = 512.0;

struct FragmentOut {
    @location(0) color: vec4f,
    @location(1) normal: vec4f,
}

@fragment
fn fs_main(f_in: VertexOut) -> FragmentOut {
    var normal = normalize(f_in.normal);
    let pos_to_camara = normalize(uni.camera_position - f_in.world_position);
    if dot(normal, pos_to_camara) < 0.0 {
        normal = -normal;
    }
    let light_direction = normalize(-uni.light_direction);

    let v = normalize(uni.camera_position - f_in.world_position);
    let h = normalize(light_direction + v);

    let material_index = material_indexes_array[f_in.draw_index];
    let material = material_array[material_index];

    let diffuse = max(dot(normal, light_direction), 0.0);

    let shininess = mix(MIN_SHININESS, MAX_SHININESS, 1.0 - material.roughness);
    let specular = pow(max(dot(normal, h), 0.0), shininess) * material.metalic;

    let base_color = material.color.rgb;
    let specular_color = mix(vec3f(1.0), base_color, material.metalic);
    let final_specular = specular_color * specular * uni.specular_intensity;
    let final_color = base_color * (diffuse + uni.ambient) + final_specular;

    var out: FragmentOut;
    out.color = vec4f(final_color, material.color.a);
    out.normal = vec4f(normal, 0);

    return out;
}