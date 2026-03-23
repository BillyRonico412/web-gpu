struct Particle {
    center: vec2f,
    speed: vec2f,
    color: vec3f,
    size: f32,
}

struct Uniform {
    canvas_size: vec2f,
    click_position: vec2f,
    click_state: f32,
}

@group(0) @binding(0) var<uniform> uniform_data: Uniform;
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;

const FRICTION = 0.98;

@compute @workgroup_size(64) fn cs_main(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let index = id.x;
    particles[index].center = (particles[index].center + particles[index].speed) % uniform_data.canvas_size;
    if uniform_data.click_state == 0 {
        particles[index].speed *= FRICTION;
    } else if uniform_data.click_state == 1 {
        particles[index].speed = normalize(uniform_data.click_position - particles[index].center);
    } else {
        particles[index].speed = normalize(particles[index].center - uniform_data.click_position);
    }
}