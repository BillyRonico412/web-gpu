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

const FRICTION = 0.97;

fn get_acceleration(distance: f32, size: f32) -> f32 {
    if distance < 30 && uniform_data.click_state == 1 {
        return 0;
    }
    return 20000 / (distance * distance * size);
}

    @compute @workgroup_size(64) fn cs_main(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let index = id.x;
    if uniform_data.click_state == 0 {
    } else {
        let distance = distance(uniform_data.click_position, particles[index].center);
        let size = particles[index].size;
        let acceleration = get_acceleration(distance, size);
        let vitesse_normalize = normalize(uniform_data.click_position - particles[index].center);
        let sign = select(-1f, 1f, uniform_data.click_state == 1);
        particles[index].speed += vitesse_normalize * acceleration * sign;
    }
    particles[index].speed *= FRICTION;
    particles[index].center = (particles[index].center + particles[index].speed + uniform_data.canvas_size) % uniform_data.canvas_size;
}