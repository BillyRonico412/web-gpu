struct Particle {
    center: vec2f,
    speed: vec2f,
    color: vec3f,
    size: f32,
}

@group(0) @binding(0) var<uniform> canvas_size: vec2f;
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(64) fn cs_main(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let index = id.x;
    particles[index].center = (particles[index].center + particles[index].speed) % canvas_size;
    particles[index].color = vec3f(1, 1, 1);
}