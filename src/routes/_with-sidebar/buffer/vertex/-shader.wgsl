struct VsIn {
    @location(0) position: vec2f,
}

struct VsOut {
    @builtin(position) position: vec4f,
}

@vertex
fn vs_main(in: VsIn) -> VsOut {
    var out: VsOut;
    out.position = vec4f(in.position, 0, 1);
    return out;
}

@fragment
fn fs_main(
    in: VsOut
) -> @location(0) vec4f {
    return vec4f(1, 1, 1, 1);
}