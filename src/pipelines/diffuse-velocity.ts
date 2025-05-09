import diffuseVelocityShader from "../compute-shaders/diffuse-velocity.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";

export const createDiffuseVelocityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "diffuse velocity pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: diffuseVelocityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
