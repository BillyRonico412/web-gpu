struct Uniform {
    canvas_size: vec2u,
    cell_pixel_density: u32,
    is_dark_mode: u32,
}

@group(0) @binding(0) var<uniform> uniform_data: Uniform;
@group(1) @binding(0) var<storage, read> grid: array<u32>;

struct VsInput {
    @builtin(vertex_index) vertex_index: u32,
    @builtin(instance_index) instance_index: u32,
    @location(0) position: vec2f,
}

struct VsOutput {
    @builtin(position) position: vec4f,
}

@vertex fn vs_main(input: VsInput) -> @builtin(position) vec4f {
    return vec4f(input.position, 0, 1);
}

const DARK_COLOR = vec4f(0.1, 0.1, 0.1, 1);
const LIGHT_COLOR = vec4f(1, 1, 1, 1);

@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
    let grid_size = uniform_data.canvas_size / uniform_data.cell_pixel_density;
    let coord = vec2u(position.xy / f32(uniform_data.cell_pixel_density));
    let alive = grid[coord.x + coord.y * grid_size.x] == 1;
    let alive_color = select(DARK_COLOR, LIGHT_COLOR, uniform_data.is_dark_mode == 1);
    let dead_color = select(DARK_COLOR, LIGHT_COLOR, uniform_data.is_dark_mode == 0);
    return select(dead_color, alive_color, alive);
}