import { createSolvePressureBindGroupLayout } from "../bind-group-layouts/solve-pressure-layout";

export const createSolvePressureBindGroup = (
  device: GPUDevice,
  dimension: GPUBuffer,
  divergence: GPUBuffer,
  pressureIn: GPUBuffer,
  pressureOut: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSolvePressureBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: dimension,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: divergence,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: pressureIn,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: pressureOut,
        },
      },
    ],
  });
};
