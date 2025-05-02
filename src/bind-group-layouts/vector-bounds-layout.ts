export const createVectorBoundsBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "vector bounds bind group layout",
    entries: [
      {
        // grid_size
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform",
        },
      },
      {
        // vectors
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
