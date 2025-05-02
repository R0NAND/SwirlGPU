import projectVelocityShader from "../compute-shaders/project-velocity.wgsl";
import { createProjectVelocityBindGroupLayout } from "../bind-group-layouts/project-velocity-layout";

export const createProjectVelocityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createProjectVelocityBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: projectVelocityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
