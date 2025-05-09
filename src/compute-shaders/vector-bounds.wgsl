@group(0) @binding(0) var<uniform> grid_size: vec2<u32>;
@group(0) @binding(1) var<uniform> dt: f32;
@group(0) @binding(2) var<uniform> visc: f32;
@group(0) @binding(3) var<uniform> diff: f32;
@group(0) @binding(4) var<uniform> decay: f32;

@group(1) @binding(0) var<storage, read_write> vectors: array<vec2<f32>>;
@compute @workgroup_size(16, 16)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if(global_id.x == 0){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    vectors[index].x = -vectors[index + 1].x;
    vectors[index].y = vectors[index + 1].y; 
  }
  if(global_id.x == grid_size.x - 1){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    vectors[index].x = -vectors[index - 1].x;
    vectors[index].y = vectors[index - 1].y; 
  }
  if(global_id.y == 0){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    vectors[index].x = vectors[index + grid_size.x].x;
    vectors[index].y = -vectors[index + grid_size.x].y; 
  }
  if(global_id.y == grid_size.y - 1){
    let index: u32 = global_id.x + grid_size.x * global_id.y;
    vectors[index].x = vectors[index - grid_size.x].x;
    vectors[index].y = -vectors[index - grid_size.x].y; 
  }
}