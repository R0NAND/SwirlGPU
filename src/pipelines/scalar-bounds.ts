import scalarBoundsShader from "../compute-shaders/scalar-bounds.wgsl";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";

export const createScalarBoundsPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "scalar bounds pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createBufferBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: scalarBoundsShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
