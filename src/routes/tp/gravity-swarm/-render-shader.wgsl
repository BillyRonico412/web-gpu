struct Particle {
    position: vec2f,
    speed: vec2f,
    color: vec3f,
    size: f32,
}

@group(0) @binding(0) var<uniform> canvas_size: vec2f;
@group(1) @binding(0) var<storage, read> particles: array<Particle>;

fn get_uv(pos: vec2f) -> vec4f {
    return vec4f(
        (pos.x - (canvas_size.x / 2)) / (canvas_size.x / 2),
        -(pos.y - (canvas_size.y / 2)) / (canvas_size.y / 2),
        0, 1
    );
} 

struct VsInput {
    @builtin(vertex_index) vertex_index: u32,
    @builtin(instance_index) instance_index: u32,
    @location(0) position: vec2f,
}

struct VsOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex fn vs_main(input: VsInput) -> VsOutput {
    let index_particle = input.instance_index;
    let particle = particles[index_particle];
    let translation_vec = input.position * particle.size;
    let position = particle.position + translation_vec;
    var out: VsOutput;
    out.position = get_uv(position);
    out.color = vec4f(particle.color, 1);
    return out;
}

struct FsInput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@fragment fn fs_main(input: FsInput) -> @location(0) vec4f {
    return input.color;
}

