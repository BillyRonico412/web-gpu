struct Uniform {
    canvas_size: vec2u,
    cell_pixel_density: u32,
}

@group(0) @binding(0) var<uniform> uniform_data: Uniform;
@group(1) @binding(0) var<storage, read_write> grid_source: array<u32>;
@group(1) @binding(1) var<storage, read_write> grid_dest: array<u32>;

fn get_grid_size() -> vec2u {
    return uniform_data.canvas_size / uniform_data.cell_pixel_density;
}

fn get_index_by_coord(coord: vec2u) -> u32 {
    let grid_size = get_grid_size();
    return grid_size.x * coord.y + coord.x;
}

fn get_coord_by_index(index: u32) -> vec2u {
    let grid_size = get_grid_size();
    return vec2u(index % grid_size.x, index / grid_size.x);
}

fn modulo_euclidien(n: i32, d: u32) -> u32 {
    return u32(((n % i32(d)) + i32(d)) % i32(d));
}

fn get_nb_neighboors(index: u32) -> u32 {
    let grid_size = get_grid_size();
    let coord = get_coord_by_index(index);
    let offsets = array(
        vec2i(-1, -1),
        vec2i(-1, 0),
        vec2i(-1, 1),
        vec2i(0, -1),
        vec2i(0, 1),
        vec2i(1, -1),
        vec2i(1, 0),
        vec2i(1, 1),
    );
    var nb_neighboors = 0u;
    for (var i = 0; i < 8; i++) {
        let offset = offsets[i];
        let coord_x_temp = i32(coord.x) + offset.x;
        let new_coord_x = modulo_euclidien(coord_x_temp, grid_size.x);
        let coord_y_temp = i32(coord.y) + offset.y;
        let new_coord_y = modulo_euclidien(coord_y_temp, grid_size.y);
        let new_coord = vec2u(new_coord_x, new_coord_y);
        let new_index = get_index_by_coord(new_coord);
        if grid_source[new_index] == 0 {
            continue;
        }
        nb_neighboors += 1;
    }
    return nb_neighboors;
}

@compute @workgroup_size(16, 16) fn cs_main(
    @builtin(global_invocation_id) invocation_id: vec3u
) {
    let index = get_index_by_coord(invocation_id.xy);
    let grid_size = get_grid_size();
    let nb_neighboors = get_nb_neighboors(index);
    let is_alive = grid_source[index] == 1;
    if is_alive && (nb_neighboors == 2 || nb_neighboors == 3) {
        grid_dest[index] = 1;
    } else {
        grid_dest[index] = 0;
    }
    if !is_alive && nb_neighboors == 3 {
        grid_dest[index] = 1;
    }
}