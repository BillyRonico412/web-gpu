struct Uniform {
    fsaa_enabled: u32,
}

@group(0) @binding(0) var basic_sampler: sampler;
@group(0) @binding(1) var color_texture: texture_2d<f32>;
@group(0) @binding(2) var geometric_id_texture: texture_2d<u32>;
@group(0) @binding(3) var normal_texture: texture_2d<f32>;
@group(0) @binding(4) var depth_texture: texture_depth_2d;

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

fn get_geometry_neighbourhood(uv: vec2i) -> array<u32, 9> {
    var neighborhood: array<u32, 9>;
    neighborhood[0] = textureLoad(geometric_id_texture, uv + vec2i(-1, -1), 0).x;
    neighborhood[1] = textureLoad(geometric_id_texture, uv + vec2i(0, -1), 0).x;
    neighborhood[2] = textureLoad(geometric_id_texture, uv + vec2i(1, -1), 0).x;
    neighborhood[3] = textureLoad(geometric_id_texture, uv + vec2i(-1, 0), 0).x;
    neighborhood[4] = textureLoad(geometric_id_texture, uv + vec2i(1, 0), 0).x;
    neighborhood[5] = textureLoad(geometric_id_texture, uv + vec2i(-1, 1), 0).x;
    neighborhood[6] = textureLoad(geometric_id_texture, uv + vec2i(0, 1), 0).x;
    neighborhood[7] = textureLoad(geometric_id_texture, uv + vec2i(1, 1), 0).x;
    return neighborhood;
}

fn nb_different_neighbour(neighborhood: array<u32, 9>, geometric_id: u32) -> u32 {
    var count: u32 = 0;
    for (var i = 0u; i < 8u; i++) {
        if neighborhood[i] != geometric_id {
            count = count + 1u;
        }
    }
    return count;
}

@fragment
fn fs_main(v_in: VertexOut) -> @location(0) vec4f {
    let dims = textureDimensions(color_texture);
    let uv = v_in.position.xy / vec2f(dims);

    let base_color = textureSample(color_texture, basic_sampler, uv);

    return base_color;
}
