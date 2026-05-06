

struct Uniform {
    mvp_matrix: mat4x4f,
    light_direction: vec4f,
    camera_position: vec4f,
    ambient: f32,
    specular_intensity: f32,
    display_mode: u32,
}

const DISPLAY_MODE_BASIC: u32 = 0u;
const DISPLAY_MODE_BASIC_EDGES: u32 = 1u;
const DISPLAY_MODE_TECHNICAL: u32 = 2u;
const DISPLAY_MODE_NORMAL: u32 = 3u;
const DISPLAY_MODE_CEL_SHADING: u32 = 4u;

struct Material {
    color: vec4f,
    metalic: f32,
    roughness: f32,
}

const VS_VISIBLE = 1u << 0;
const VS_HIGHLIGHTED = 1u << 1;
const VS_HIDDEN = 1u << 2;
const VS_GHOST = 1u << 3;
const VS_CUSTOM_MATERIAL = 1u << 4;

struct CustomMaterial {
    color: vec4f,
    metalic: f32,
    roughness: f32,
}

@group(0) @binding(0) var<uniform> uni: Uniform;
@group(1) @binding(0) var<storage, read> vertex_array: array<vec3f>;
@group(1) @binding(1) var<storage, read> normal_array: array<vec3f>;
@group(1) @binding(2) var<storage, read> vertex_indexes_array: array<u32>;
@group(1) @binding(3) var<storage, read> normal_indexes_array: array<u32>;
@group(1) @binding(4) var<storage, read> part_id_array: array<u32>;
@group(1) @binding(5) var<storage, read> matrix_array: array<mat4x4f>;
@group(1) @binding(6) var<storage, read> material_array: array<Material>;
@group(1) @binding(7) var<storage, read> visibility_state_array: array<u32>;
@group(1) @binding(8) var<storage, read> custom_material_array: array<CustomMaterial>;

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
    let part_id = part_id_array[v_in.draw_index];

    let vertex = vertex_array[vertex_index];
    let normal = normal_array[normal_index];
    let matrix = matrix_array[part_id - 1];

    let rotationMatrix = mat3x3<f32>(
        matrix[0].xyz,
        matrix[1].xyz,
        matrix[2].xyz
    );

    if (visibility_state_array[part_id - 1] & VS_HIDDEN) != 0u {
        var v_out: VertexOut;
        v_out.world_position = vec3f(0, 0, 0);
        v_out.position = vec4f(0, 0, 0, 0);
        v_out.normal = vec3f(0, 0, 0);
        v_out.draw_index = v_in.draw_index;
        return v_out;
    }

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
    @location(2) part_id: f32,
}

@fragment
fn fs_main(f_in: VertexOut) -> FragmentOut {
    let part_id = part_id_array[f_in.draw_index];
    let visibility_state = visibility_state_array[part_id - 1];

    if (visibility_state & VS_HIDDEN) != 0u {
        var out: FragmentOut;
        out.color = vec4f(0, 0, 0, 0);
        out.normal = vec4f(0, 0, 0, 0);
        out.part_id = 0.0;
        return out;
    }

    let is_custom_material = (visibility_state_array[part_id - 1] & VS_CUSTOM_MATERIAL) != 0u;
    let is_highlighted = (visibility_state_array[part_id - 1] & VS_HIGHLIGHTED) != 0u;

    var normal = normalize(f_in.normal);

    var out: FragmentOut;
    out.normal = vec4f(normal, 0);
    out.part_id = f32(part_id);

    let pos_to_camera_vec = normalize(uni.camera_position.xyz - f_in.world_position);
    if dot(normal, pos_to_camera_vec) < -0.5 {
        normal = -normal;
    }

    let light_direction = normalize(-uni.light_direction);

    let v = normalize(uni.camera_position.xyz - f_in.world_position);
    let h = normalize(light_direction.xyz + v);

    let material = material_array[part_id - 1];
    let custom_material = custom_material_array[part_id - 1];

    var base_color: vec3f;
    if is_highlighted {
        base_color = vec3f(1.0, 1.0, 0.0);
    } else if is_custom_material {
        base_color = custom_material.color.xyz;
    } else {
        base_color = material.color.xyz;
    }

    let diffuse = max(dot(normal, light_direction.xyz), 0.0);

    if uni.display_mode == DISPLAY_MODE_CEL_SHADING {
        var shade: f32;
        if diffuse > 0.95 {
            shade = 1.0;
        } else if diffuse > 0.5 {
            shade = 0.7;
        } else if diffuse > 0.2 {
            shade = 0.3;
        } else {
            shade = 0.1;
        }
        out.color = vec4f(base_color * shade, 1.0);
        return out;
    }

    let metalic = select(
        material.metalic,
        custom_material.metalic,
        is_custom_material
    );

    let roughness = select(
        material.roughness,
        custom_material.roughness,
        is_custom_material
    );

    let shininess = mix(MIN_SHININESS, MAX_SHININESS, 1.0 - roughness);
    let specular = pow(max(dot(normal, h), 0.0), shininess) * metalic;

    let specular_color = mix(vec3f(1.0), base_color, metalic);
    let final_specular = specular_color * specular * uni.specular_intensity;
    let final_color = base_color * (diffuse + uni.ambient) + final_specular;
    out.color = vec4f(final_color, 1);

    return out;
}