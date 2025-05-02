import { createInInOutBindGroupLayout } from "../bind-group-layouts/in-in-out-layout";

export const createInInOutBindGroup = (
  device: GPUDevice,
  dimensions: GPUBuffer,
  in1: GPUBuffer,
  in2: GPUBuffer,
  out: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createInInOutBindGroupLayout(device),
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
          buffer: in1,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: in2,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: out,
        },
      },
    ],
  });
};
