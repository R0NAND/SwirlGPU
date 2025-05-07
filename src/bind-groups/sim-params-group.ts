import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
export const createInOutBindGroup = (
  device: GPUDevice,
  gridSize: GPUBuffer,
  dt: GPUBuffer,
  viscosity: GPUBuffer,
  diffusivity: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSimParamsBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: gridSize,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: dt,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: viscosity,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: diffusivity,
        },
      },
    ],
  });
};
