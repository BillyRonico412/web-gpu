override NB_SUB_PARTICLE = 5u;

struct Particle {
    position: array<vec2f, 5>,
    speed: vec2f,
    color: vec3f,
    size: f32,
}

struct Uniform {
    canvas_size: vec2f,
    click_position: vec2f,
    click_state: f32,
    timer: f32,
}

@group(0) @binding(0) var<uniform> uniform_data: Uniform;
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;

const FRICTION = 0.95;
const FORCE = 50000;
const BLACK_HOLE_CENTER = 30;

fn get_acceleration(distance: f32, size: f32) -> f32 {
    if distance < BLACK_HOLE_CENTER && uniform_data.click_state == 1 {
        return 0;
    }
    return FORCE / (distance * distance * size);
}

    @compute @workgroup_size(64) fn cs_main(
    @builtin(global_invocation_id) id: vec3<u32>
) {
    let index = id.x;
    if uniform_data.click_state != 0 {
        let distance = distance(uniform_data.click_position, particles[index].position[0]);
        let size = particles[index].size;
        let acceleration = get_acceleration(distance, size);
        let vitesse_normalize = normalize(uniform_data.click_position - particles[index].position[0]);
        let sign = select(-1f, 1f, uniform_data.click_state == 1);
        particles[index].speed += vitesse_normalize * acceleration * sign;
    }
    particles[index].speed *= FRICTION;
    let new_position = (particles[index].position[0] + particles[index].speed + uniform_data.canvas_size) % uniform_data.canvas_size;;
    if uniform_data.timer % 2 == 0 {
        for (var i = NB_SUB_PARTICLE - 1; i > 0; i--) {
            particles[index].position[i] = particles[index].position[i - 1];
        }
    }
    particles[index].position[0] = new_position;
}