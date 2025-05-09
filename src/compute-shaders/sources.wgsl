struct sourceInjection{
  cell: vec2<u32>,
  velocity: vec2<f32>,
  density: f32,
  _pad: f32
}

@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<uniform> dt: f32;
@group(0) @binding(2) var<uniform> visc: f32;
@group(0) @binding(3) var<uniform> diff: f32;
@group(0) @binding(4) var<uniform> decay: f32;

@group(1) @binding(0) var<uniform> n_sources: u32;
@group(1) @binding(1) var<storage> sources: array<sourceInjection>;

@group(2) @binding(0) var<storage, read_write> velocities: array<vec2<f32>>;

@group(3) @binding(0) var<storage, read_write> densities: array<f32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if(global_id.x >= n_sources) {
    return;
  }
  if(sources[global_id.x].cell.x < 0 || sources[global_id.x].cell.x >= grid_size.x){
    return;
  }
  let index: u32 = sources[global_id.x].cell.x + grid_size.x * sources[global_id.x].cell.y;
  densities[index] = sources[global_id.x].density * 1; 
  velocities[index] += sources[global_id.x].velocity;
}