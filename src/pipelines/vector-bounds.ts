import vectorBoundsShader from "../compute-shaders/vector-bounds.wgsl";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";

export const createVectorBoundsPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "vector bounds pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createBufferBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: vectorBoundsShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
