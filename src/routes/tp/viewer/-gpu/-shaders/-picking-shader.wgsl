struct PickParams {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

@group(0) @binding(0) var<uniform> pick_params: PickParams;
@group(1) @binding(0) var geometric_id_texture: texture_multisampled_2d<f32>;
@group(2) @binding(0) var<storage, read_write> geomtric_bit_set: array<u32>;

@compute @workgroup_size(16, 16)
fn cs_main(@builtin(global_invocation_id) global_id: vec3u) {
    let x = global_id.x;
    let y = global_id.y;
    if x >= pick_params.width || y >= pick_params.height {
        return;
    }
    let uv = vec2u(pick_params.x + x, pick_params.y + y);
    let geometric_id = u32(textureLoad(geometric_id_texture, uv, 0).x);
    if geometric_id == 0u {
        return;
    }
    geomtric_bit_set[geometric_id] = 1u;
}
