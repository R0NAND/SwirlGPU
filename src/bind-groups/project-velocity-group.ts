import { createProjectVelocityBindGroupLayout } from "../bind-group-layouts/project-velocity-layout";

export const createProjectVelocityBindGroup = (
  device: GPUDevice,
  dimensions: GPUBuffer,
  pressureIn: GPUBuffer,
  velocityOut: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createProjectVelocityBindGroupLayout(device),
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
          buffer: pressureIn,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: velocityOut,
        },
      },
    ],
  });
};
