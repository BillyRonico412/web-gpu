struct UniformData {
    position: vec2f,
    scale: f32,
    color: vec3f,
}

@group(0) @binding(0) var<storage> uniformData: UniformData;

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4f {
    const offset_by_index = array(
        vec2f(0, 0.1), vec2f(-0.1, -0.1), vec2f(0.1, -0.1)
    );
    return vec4f(uniformData.position + offset_by_index[vertex_index] * uniformData.scale, 0, 1);
}

@fragment
fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
    return vec4f(uniformData.color, 1);
}