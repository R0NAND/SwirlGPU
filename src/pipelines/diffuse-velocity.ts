import diffuseVelocityShader from "../compute-shaders/diffuse-velocity.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";

export const createDiffuseVelocityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createInOutBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: diffuseVelocityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
