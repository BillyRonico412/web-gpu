struct Uniform {
    time: f32,
}

@group(0) @binding(0) var<uniform> params: Uniform;  

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
    let start_angle_array = array(90f, 210f, -30f);
    let current_start_angle = start_angle_array[index];
    let computed_pos = vec2f(
        0.5 * cos(radians(f32(params.time + current_start_angle))),
        0.5 * sin(radians(f32(params.time + current_start_angle)))
    );
    return vec4f(computed_pos, 0, 1);
}

@fragment
fn fs_main() -> @location(0) vec4f {
    let r = (sin(radians(params.time / 5)) + 1) / 2;
    let g = (sin(radians(params.time / 5 * 2)) + 1) / 2;
    let b = (sin(radians(params.time / 5 * 3)) + 1) / 2;
    return vec4f(r, g, b, 1);
}