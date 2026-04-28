struct Uniform {
    fsaa_enabled: u32,
}

@group(0) @binding(0) var<uniform> uni: Uniform;
@group(1) @binding(0) var basic_sampler: sampler;
@group(1) @binding(1) var color_texture: texture_2d<f32>;
@group(1) @binding(2) var geometric_id_texture: texture_2d<u32>;
@group(1) @binding(3) var normal_texture: texture_2d<f32>;
@group(1) @binding(4) var depth_texture: texture_depth_2d;

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

@fragment
fn fs_main(v_in: VertexOut) -> @location(0) vec4f {
    let dims = textureDimensions(color_texture);
    let uv = v_in.position.xy / vec2f(dims);

    let geometric_id = textureLoad(geometric_id_texture, vec2i(v_in.position.xy), 0).x;
    let g1 = textureLoad(geometric_id_texture, vec2i(v_in.position.xy) + vec2i(-1, -1), 0).x;
    let g2 = textureLoad(geometric_id_texture, vec2i(v_in.position.xy) + vec2i(1, 1), 0).x;

    let is_edge = (geometric_id != g1) || (geometric_id != g2);

    let base_color = textureSample(color_texture, basic_sampler, uv);

    let offset = 0.5;
    let c1 = textureSample(color_texture, basic_sampler, uv + vec2f(-offset, -offset) / vec2f(dims));
    let c2 = textureSample(color_texture, basic_sampler, uv + vec2f(-offset, offset) / vec2f(dims));
    let c3 = textureSample(color_texture, basic_sampler, uv + vec2f(offset, -offset) / vec2f(dims));
    let c4 = textureSample(color_texture, basic_sampler, uv + vec2f(offset, offset) / vec2f(dims));

    let final_color = (c1 + c2 + c3 + c4) * 0.25;

    if !is_edge {
        return base_color;
    }

    return vec4f(0, 0, 0, 1);
}
