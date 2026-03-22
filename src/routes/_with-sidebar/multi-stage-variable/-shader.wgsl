struct VertexOutput {
    @builtin(position) pos: vec4f,
    @location(0) vColor: vec3f,
}

struct Uniforms {
    offset: vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) index: u32) -> VertexOutput {
    let pos = array(
        vec2f(0, 0.5),
        vec2f(-0.5, -0.5),
        vec2f(0.5, -0.5),
    );
    let color = array(
        vec3f(1, 0, 0),
        vec3f(0, 1, 0),
        vec3f(0, 0, 1),
    );
    var out: VertexOutput;
    out.pos = vec4f(pos[index], 0, 1);
    out.vColor = color[index];
    return out;
}

@fragment
fn fs_main(@location(0) color: vec3f) -> @location(0) vec4f {
    return vec4f(color, 1);
}