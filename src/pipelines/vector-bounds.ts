import vectorBoundsShader from "../compute-shaders/vector-bounds.wgsl";
import { createVectorBoundsBindGroupLayout } from "../bind-group-layouts/vector-bounds-layout";

export const createVectorBoundsPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createVectorBoundsBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: vectorBoundsShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
