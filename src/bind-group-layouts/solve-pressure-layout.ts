export const createSolvePressureBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "solve pressure bind group layout",
    entries: [
      {
        // divergences
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // pressures in
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // pressures out
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
