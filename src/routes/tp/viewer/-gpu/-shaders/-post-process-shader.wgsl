struct Uniform1 {
    display_mode: u32,
}

struct Uniform2 {
    geometric_edge_active: f32,
    normal_edge_active: f32,
    depth_edge_active: f32,
    near: f32,
    far: f32,
}

const DISPLAY_MODE_BASIC: u32 = 0u;
const DISPLAY_MODE_BASIC_EDGES: u32 = 1u;
const DISPLAY_MODE_TECHNICAL: u32 = 2u;
const DISPLAY_MODE_NORMAL: u32 = 3u;
const DISPLAY_MODE_CEL_SHADING: u32 = 4u;

@group(0) @binding(0) var<uniform> uni1: Uniform1;
@group(0) @binding(1) var<uniform> uni2: Uniform2;
@group(1) @binding(0) var basic_sampler: sampler;
@group(1) @binding(1) var color_texture: texture_2d<f32>;
@group(1) @binding(2) var geometric_id_texture: texture_multisampled_2d<f32>;
@group(1) @binding(3) var normal_texture: texture_2d<f32>;
@group(1) @binding(4) var depth_texture: texture_multisampled_2d<f32>;
@group(2) @binding(0) var<storage, read> visibility_state_array: array<u32>; 

struct VertexOut {
    @builtin(position) position: vec4f,
}

const vertexes: array<vec2f, 6> = array<vec2f, 6>(
    vec2f(-1, -1),
    vec2f(1, -1),
    vec2f(-1, 1),
    vec2f(-1, 1),
    vec2f(1, -1),
    vec2f(1, 1)
);

const vertexIndexes: array<u32, 6> = array<u32, 6>(
    0, 1, 2,
    3, 4, 5
);

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOut {
    var v_out: VertexOut;
    v_out.position = vec4f(vertexes[vertexIndexes[vertex_index]], 0, 1);
    return v_out;
}

const neighborOffsets: array<vec2i, 8> = array<vec2i, 8>(
    vec2i(-1, -1),
    vec2i(0, -1),
    vec2i(1, -1),
    vec2i(-1, 0),
    vec2i(1, 0),
    vec2i(-1, 1),
    vec2i(0, 1),
    vec2i(1, 1)
);

fn get_geometry_neighbors(uv: vec2i) -> array<f32, 8> {
    var geometry_neighbors: array<f32, 8>;
    for (var i = 0u; i < 8u; i++) {
        geometry_neighbors[i] = textureLoad(geometric_id_texture, uv + neighborOffsets[i], 0).x;
    }
    return geometry_neighbors;
}

fn get_nb_different_geometry(geometry_neighbors: array<f32, 8>, geometric_id: f32) -> u32 {
    if uni2.geometric_edge_active == 0.0 {
        return 0u;
    }
    var count: u32 = 0;
    for (var i = 0u; i < 8u; i++) {
        if geometry_neighbors[i] != geometric_id {
            count = count + 1u;
        }
    }
    return count;
}

fn get_normal_neighbors(uv: vec2i) -> array<vec3f, 8> {
    var normal_neighbors: array<vec3f, 8>;
    for (var i = 0u; i < 8u; i++) {
        normal_neighbors[i] = textureLoad(normal_texture, uv + neighborOffsets[i], 0).xyz;
    }
    return normal_neighbors;
}

const NORMAL_SIMILARITY_THRESHOLD: f32 = 0.98;
fn get_nb_different_normal(normal_neighbors: array<vec3f, 8>, normal: vec3f) -> u32 {
    if uni2.normal_edge_active == 0.0 {
        return 0u;
    }
    var count: u32 = 0;
    for (var i = 0u; i < 8u; i++) {
        if dot(normalize(normal_neighbors[i]), normalize(normal)) < NORMAL_SIMILARITY_THRESHOLD {
            count = count + 1u;
        }
    }
    return count;
}

fn linearize_reverse_z(depth: f32) -> f32 {
    return (uni2.near * uni2.far) / (depth * (uni2.far - uni2.near) + uni2.near);
}

fn get_depth_neighbors(uv: vec2i) -> array<f32, 8> {
    var depth_neighbors: array<f32, 8>;
    for (var i = 0u; i < 8u; i++) {
        depth_neighbors[i] = linearize_reverse_z(textureLoad(depth_texture, uv + neighborOffsets[i], 0).x);
    }
    return depth_neighbors;
}

const DEPTH_SIMILARITY_THRESHOLD: f32 = 5.0;
fn get_nb_different_depth(depth_neighbors: array<f32, 8>, depth: f32) -> u32 {
    if uni2.depth_edge_active == 0.0 {
        return 0u;
    }
    var count: u32 = 0;
    for (var i = 0u; i < 8u; i++) {
        if abs(depth_neighbors[i] - depth) > DEPTH_SIMILARITY_THRESHOLD {
            count = count + 1u;
        }
    }
    return count;
}

fn get_edge_darkening_factor(
    v_in: VertexOut,
    geometric_id: f32,
    normal: vec3f,
    depth: f32,
    base_color: vec4f
) -> f32 {
    let geometry_neighbors = get_geometry_neighbors(vec2i(v_in.position.xy));
    let nb_different_geometry = get_nb_different_geometry(geometry_neighbors, geometric_id);

    let normal_neighbors = get_normal_neighbors(vec2i(v_in.position.xy));
    let nb_different_normal = get_nb_different_normal(normal_neighbors, normal);

    let depth_neighbors = get_depth_neighbors(vec2i(v_in.position.xy));
    let nb_different_depth = get_nb_different_depth(depth_neighbors, depth);

    if nb_different_geometry == 0 && nb_different_normal == 0 && get_nb_different_depth(depth_neighbors, depth) == 0 {
        return -1.0;
    }
    let edge_color = vec3f(0, 0, 0);
    var edge_darkening_factor = 0.0;

    edge_darkening_factor = max(edge_darkening_factor, f32(nb_different_geometry) / 8.0);
    edge_darkening_factor = max(edge_darkening_factor, f32(nb_different_normal) / 8.0);
    edge_darkening_factor = max(edge_darkening_factor, f32(nb_different_depth) / 8.0);

    return smoothstep(0.0, 1.0, edge_darkening_factor);
} 

@fragment
fn fs_main(v_in: VertexOut) -> @location(0) vec4f {
    let dims = textureDimensions(color_texture);
    let uv = v_in.position.xy / vec2f(dims);

    let base_color = textureSample(color_texture, basic_sampler, uv);
    let geometric_id = textureLoad(geometric_id_texture, vec2i(v_in.position.xy), 0).x;
    let normal = textureLoad(normal_texture, vec2i(v_in.position.xy), 0).xyz;
    let depth = linearize_reverse_z(textureLoad(depth_texture, vec2i(v_in.position.xy), 0).x);

    switch uni1.display_mode {
        case DISPLAY_MODE_BASIC: {
            return base_color;
        }
        case DISPLAY_MODE_BASIC_EDGES: {
            let neighbors = get_geometry_neighbors(vec2i(v_in.position.xy));
            let nb_different_geometry = get_nb_different_geometry(neighbors, geometric_id);
            if nb_different_geometry == 0 {
                return base_color;
            }
            let edge_color = vec3f(0, 0, 0);
            let edge_darkening_factor = f32(nb_different_geometry) / 8.0;
            let factor = smoothstep(0.0, 1.0, edge_darkening_factor);
            return vec4f(mix(base_color.xyz, edge_color, factor), base_color.a);
        }
        case DISPLAY_MODE_TECHNICAL: {
            let is_highlighted = visibility_state_array[u32(geometric_id) - 1] == (1u << 1u);
            let base_color = select(vec4f(1, 1, 1, 1), vec4f(0.8, 0.8, 0.8, 1), is_highlighted);
            let edge_factor = get_edge_darkening_factor(v_in, geometric_id, normal, depth, base_color);
            if edge_factor < 0.0 {
                return base_color;
            }
            let edge_color = vec3f(0, 0, 0);
            return vec4f(mix(base_color.xyz, edge_color, edge_factor), base_color.a);
        }
        case DISPLAY_MODE_CEL_SHADING: {
            let edge_factor = get_edge_darkening_factor(v_in, geometric_id, normal, depth, base_color);
            if edge_factor < 0.0 {
                return base_color;
            }
            return vec4f(mix(base_color.xyz, vec3f(0, 0, 0), edge_factor), base_color.a);
        }
        case DISPLAY_MODE_NORMAL: {
            return vec4f(normal * 0.5 + 0.5, 1.0);
        }
        default {
            return base_color;
        }
    }
}
