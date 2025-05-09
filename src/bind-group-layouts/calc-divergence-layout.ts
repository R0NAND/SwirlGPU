export const createCalcDivergenceBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "calc divergence bind group layout",
    entries: [
      {
        // velocities
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // divergences
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
      {
        // pressures
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
