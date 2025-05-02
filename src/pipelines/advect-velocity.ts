import advectVelocityShader from "../compute-shaders/advect-velocity.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";

export const createAdvectVelocityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createInOutBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: advectVelocityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
