export const createProjectVelocityBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "project velocity bind group layout",
    entries: [
      {
        //grid_size
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform",
        },
      },
      {
        // pressures
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // velocities
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
