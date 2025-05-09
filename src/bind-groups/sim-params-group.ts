import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
export const createSimParamsBindGroup = (
  device: GPUDevice,
  gridSize: GPUBuffer,
  dt: GPUBuffer,
  viscosity: GPUBuffer,
  diffusivity: GPUBuffer,
  decay: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSimParamsBindGroupLayout(device),
    entries: [
      {
        //grid_size
        binding: 0,
        resource: {
          buffer: gridSize,
        },
      },
      {
        //dt
        binding: 1,
        resource: {
          buffer: dt,
        },
      },
      {
        //viscosity
        binding: 2,
        resource: {
          buffer: viscosity,
        },
      },
      {
        //diffusivity
        binding: 3,
        resource: {
          buffer: diffusivity,
        },
      },
      {
        //decay
        binding: 4,
        resource: {
          buffer: decay,
        },
      },
    ],
  });
};
