import projectVelocityShader from "../compute-shaders/project-velocity.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";

export const createProjectVelocityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "project velocity pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
        createBufferBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: projectVelocityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
