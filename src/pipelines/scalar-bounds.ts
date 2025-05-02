import scalarBoundsShader from "../compute-shaders/scalar-bounds.wgsl";
import { createScalarBoundsBindGroupLayout } from "../bind-group-layouts/scalar-bounds-layout";

export const createScalarBoundsPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createScalarBoundsBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: scalarBoundsShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
