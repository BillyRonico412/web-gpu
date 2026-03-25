
struct VsOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f}

@vertex
fn vs_main(@location(0) position: vec2f) -> VsOutput {
    var out: VsOutput;
    out.position = vec4f(position, 0, 1);
    out.uv = vec2f((position.x + 1) / 2, (-position.y + 1) / 2);
    return out;
}

@group(0) @binding(0) var my_texture: texture_2d<f32>;
@group(0) @binding(1) var my_sample: sampler;

@fragment
fn fs_main(@location(0) position: vec2f) -> @location(0) vec4f {
    return textureSample(my_texture, my_sample, position);
}