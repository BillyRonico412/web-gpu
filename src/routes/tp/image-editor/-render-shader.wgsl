struct Uniform {
    canvas_size: vec2u,
    applied_filter: u32,
}

const FILTER_NONE = 0u;
const FILTER_GRAYSCALE = 1u;
const FILTER_INVERT = 2u;
const FILTER_SEPIA = 3u;

@group(0) @binding(0) var s: sampler;
@group(0) @binding(1) var t: texture_2d<f32>;
@group(1) @binding(0) var<uniform> u: Uniform;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
};

const quad_vertexes = array<vec2f, 4>(
    vec2f(-1.0, -1.0),
    vec2f(1.0, -1.0),
    vec2f(-1.0, 1.0),
    vec2f(1.0, 1.0),
);

const quad_indexes = array<u32, 6>(
    0u, 1u, 2u,
    2u, 1u, 3u,
);

@vertex
fn vs_main(@builtin(vertex_index) draw_index: u32) -> VertexOutput {
    var output: VertexOutput;
    let vertex_index = quad_indexes[draw_index];
    let vertex = quad_vertexes[vertex_index];
    output.position = vec4f(vertex, 0.0, 1.0);
    return output;
}

@fragment
fn fs_main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
    let texture_dim = vec2f(textureDimensions(t, 0));
    let texture_ratio = texture_dim.x / texture_dim.y;

    var canvas_size_used = vec2f(u.canvas_size);
    var offset = vec2f(0.0);
    if texture_ratio > 1 {
        canvas_size_used.y = f32(u.canvas_size.x) / texture_ratio;
        offset.y = (f32(u.canvas_size.y) - canvas_size_used.y) / 2.0;
    } else {
        canvas_size_used.x = f32(u.canvas_size.y) * texture_ratio;
        offset.x = (f32(u.canvas_size.x) - canvas_size_used.x) / 2.0;
    }

    let uv = (position.xy - offset) / canvas_size_used;

    var color = textureSample(t, s, uv);
    if uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 {
        color = vec4f(0.0, 0.0, 0.0, 1.0);
    }

    switch u.applied_filter {
        case FILTER_NONE: {
            return color;
        }
        case FILTER_GRAYSCALE: {
            let gray = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
            color = vec4f(vec3f(gray), color.a);
            return color;
        }
        case FILTER_SEPIA: {
            let r = dot(color.rgb, vec3f(0.393, 0.769, 0.189));
            let g = dot(color.rgb, vec3f(0.349, 0.686, 0.168));
            let b = dot(color.rgb, vec3f(0.272, 0.534, 0.131));
            color = vec4f(r, g, b, color.a);
            return color;
        }
        case FILTER_INVERT: {
            color = vec4f(vec3f(1.0) - color.rgb, color.a);
            return color;
        }
        default: {
            return color;
        }
    }
}