import advectVelocityShader from "../compute-shaders/advect-velocity.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";

export const createAdvectVelocityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "advect velocity pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: advectVelocityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
