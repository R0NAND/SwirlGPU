import { createCalcDivergenceBindGroupLayout } from "../bind-group-layouts/calc-divergence-layout";

export const createCalcDivergenceBindGroup = (
  device: GPUDevice,
  dimensions: GPUBuffer,
  velocity: GPUBuffer,
  divergence: GPUBuffer,
  pressure: GPUBuffer
) => {
  return device.createBindGroup({
    label: "divergences bind group A",
    layout: createCalcDivergenceBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: dimensions,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: velocity,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: divergence,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: pressure,
        },
      },
    ],
  });
};
