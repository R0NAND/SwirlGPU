@vertex fn vs_main(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -3.0),
    vec2f(3.0, 1.0),
    vec2f(-1.0, 1.0)
  );
  return vec4f(pos[vertex_index], 0.0, 1.0);
}