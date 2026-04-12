@group(0) @binding(0) var<uniform> canvas_size: vec2f;
@group(0) @binding(1) var<uniform> mvp_matrix: mat4x4f;

struct VertexIn {
    @location(0) position: vec4f,
    @location(1) color: vec4f,
    @builtin(vertex_index) vertex_index: u32,
}

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex
fn vs_main(v_in: VertexIn) -> VertexOut {
    var v_out: VertexOut;
    v_out.position = mvp_matrix * v_in.position;
    v_out.color = v_in.color;
    return v_out;
}

@fragment
fn fs_main(f_in: VertexOut) -> @location(0) vec4f {
    return f_in.color;
}