export const createProjectVelocityBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "project velocity bind group layout",
    entries: [
      {
        // pressures
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // velocities
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
